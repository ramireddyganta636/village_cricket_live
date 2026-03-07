const supabase = require('../utils/supabase');
const { getIO } = require('../config/socket');

// Create a tournament
exports.createTournament = async (req, res) => {
  try {
    const { name, startDate, endDate } = req.body;
    const { data, error } = await supabase
      .from('tournaments')
      .insert([
        {
          name,
          startDate,
          endDate,
          status: 'upcoming',
          createdBy: req.user.id
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a team
exports.createTeam = async (req, res) => {
  try {
    const { name, tournamentId } = req.body;
    const { data, error } = await supabase
      .from('teams')
      .insert([{ name, tournamentId }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a player to a team
exports.addPlayer = async (req, res) => {
  try {
    const { name, teamId, role } = req.body; // role: batsman, bowler, all-rounder
    const { data, error } = await supabase
      .from('players')
      .insert([{ name, teamId, role }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new match (now creates two innings)
exports.createMatch = async (req, res) => {
  try {
    const { tournamentId, teamAId, teamBId, overs, startTime } = req.body;

    if (!tournamentId || !teamAId || !teamBId) {
      return res.status(400).json({ message: 'Missing required fields: tournamentId, teamAId, teamBId' });
    }

    // Insert match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert([{
        tournamentId,
        teamAId,
        teamBId,
        overs: overs || 20,
        status: 'upcoming',
        startTime: startTime || new Date().toISOString(),
        current_innings: 1  // new column (must be added via migration)
      }])
      .select()
      .single();

    if (matchError) throw matchError;

    // Create innings for both teams
    const inningsData = [
      {
        match_id: match.id,
        innings_number: 1,
        batting_team_id: teamAId,
        bowling_team_id: teamBId,
        status: 'pending'
      },
      {
        match_id: match.id,
        innings_number: 2,
        batting_team_id: teamBId,
        bowling_team_id: teamAId,
        status: 'pending'
      }
    ];

    const { error: inningsError } = await supabase
      .from('innings')
      .insert(inningsData);

    if (inningsError) throw inningsError;

    res.status(201).json(match);
  } catch (err) {
    console.error('Create match error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// Start a match (sets first innings live)
exports.startMatch = async (req, res) => {
  try {
    const { id } = req.params;

    // Update match status and set current_innings to 1
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .update({ 
        status: 'live', 
        startTime: new Date().toISOString(),
        current_innings: 1
      })
      .eq('id', id)
      .select()
      .single();

    if (matchError) throw matchError;
    if (!match) return res.status(404).json({ message: 'Match not found' });

    // Set first innings to live
    const { error: inningsError } = await supabase
      .from('innings')
      .update({ status: 'live' })
      .eq('match_id', id)
      .eq('innings_number', 1);

    if (inningsError) throw inningsError;

    res.json(match);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// End a match (sets final result and man of the match)
exports.endMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { result, manOfTheMatch } = req.body; // e.g., "India won by 20 runs" and player UUID

    const { data, error } = await supabase
      .from('matches')
      .update({ 
        status: 'completed', 
        result, 
        man_of_the_match: manOfTheMatch,
        endTime: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Match not found' });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Change innings (manual override – may need to also update innings status)
// Note: This function uses old column names (battingTeamId, etc.) and may not work correctly
// with the new innings table. It is kept for backward compatibility but should be used with caution.
exports.changeInnings = async (req, res) => {
  try {
    const { id } = req.params;
    const { battingTeamId, bowlingTeamId } = req.body;

    // Update match (using old columns; these may not exist in updated schema)
    const { data, error } = await supabase
      .from('matches')
      .update({
        currentInnings: supabase.raw('currentInnings + 1'),
        battingTeamId,
        bowlingTeamId,
        runs: 0,
        wickets: 0,
        oversCompleted: 0,
        ballsInCurrentOver: 0,
        strikerId: null,
        nonStrikerId: null,
        bowlerId: null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Also update innings status (optional)
    await supabase
      .from('innings')
      .update({ status: 'completed' })
      .eq('match_id', id)
      .eq('innings_number', 1); // assuming we are moving from innings 1 to 2

    await supabase
      .from('innings')
      .update({ status: 'live' })
      .eq('match_id', id)
      .eq('innings_number', 2);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Enhanced ball-by-ball scoring with full logic (now uses innings table)
exports.addBall = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { over, ball, batsmanId, bowlerId, runs, extra, wicket, commentary } = req.body;

    // Get current match state (including current_innings)
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) return res.status(404).json({ message: 'Match not found' });
    if (match.status !== 'live') return res.status(400).json({ message: 'Match is not live' });

    // Get current innings
    const { data: innings, error: inningsError } = await supabase
      .from('innings')
      .select('*')
      .eq('match_id', matchId)
      .eq('innings_number', match.current_innings)
      .single();

    if (inningsError) throw inningsError;

    // Insert ball (with innings_id)
    const { data: ballEvent, error: ballError } = await supabase
      .from('balls')
      .insert([{
        matchId,
        innings_id: innings.id,
        over,
        ball,
        batsmanId,
        bowlerId,
        runs,
        extra,
        wicket,
        commentary
      }])
      .select()
      .single();

    if (ballError) throw ballError;

    // Update innings runs, wickets, overs
    let newRuns = innings.runs + runs;
    let newWickets = innings.wickets + (wicket ? 1 : 0);
    let newBallsInCurrentOver = innings.balls_in_over;
    let newOvers = innings.overs;

    const isLegalBall = !(extra === 'wide' || extra === 'noball');
    if (isLegalBall) {
      newBallsInCurrentOver += 1;
    }

    if (newBallsInCurrentOver >= 6) {
      newOvers = parseFloat((innings.overs + 1).toFixed(1));
      newBallsInCurrentOver = 0;
    }

    // Update innings in database
    const { error: inningsUpdateError } = await supabase
      .from('innings')
      .update({
        runs: newRuns,
        wickets: newWickets,
        overs: newOvers,
        balls_in_over: newBallsInCurrentOver
      })
      .eq('id', innings.id);

    if (inningsUpdateError) throw inningsUpdateError;

    // Check if innings over (all out or overs completed)
    const inningsOver = (newWickets >= 10) || (newOvers >= match.overs);
    let newStatus = match.status;
    let newInnings = match.current_innings;

    if (inningsOver) {
      // Mark current innings completed
      await supabase
        .from('innings')
        .update({ status: 'completed' })
        .eq('id', innings.id);

      if (match.current_innings === 1) {
        // Start second innings
        newInnings = 2;
        // Set second innings live
        await supabase
          .from('innings')
          .update({ status: 'live' })
          .eq('match_id', matchId)
          .eq('innings_number', 2);
      } else {
        // Second innings over – do NOT mark match completed, keep it live
        // newStatus remains 'live'
      }
    }

    // Update match record (current_innings and maybe status)
    const matchUpdate = {
      current_innings: newInnings,
      status: newStatus
    };
    // Do not set endTime here

    const { error: matchUpdateError } = await supabase
      .from('matches')
      .update(matchUpdate)
      .eq('id', matchId);

    if (matchUpdateError) throw matchUpdateError;

    // Fetch updated match with innings for real‑time emission
    const { data: updatedMatch } = await supabase
      .from('matches')
      .select('*, innings(*)')
      .eq('id', matchId)
      .single();

    // Emit real-time updates via Socket.io
    const io = getIO();
    io.to(`match_${matchId}`).emit('newBall', ballEvent);
    io.to(`match_${matchId}`).emit('scoreUpdate', updatedMatch);

    res.status(201).json(ballEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
// Get all teams (optionally filtered by tournament)
exports.getAllTeams = async (req, res) => {
  try {
    const { tournamentId } = req.query;
    let query = supabase.from('teams').select('*, tournaments(name)');
    if (tournamentId) {
      query = query.eq('tournamentId', tournamentId);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a team and its players
exports.deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    // First delete all players in this team
    const { error: playersError } = await supabase
      .from('players')
      .delete()
      .eq('teamId', teamId);
    if (playersError) throw playersError;

    // Then delete the team
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);
    if (error) throw error;

    res.json({ message: 'Team and its players deleted successfully' });
  } catch (err) {
    console.error('Error deleting team:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// Get all players (optionally filtered by team)
exports.getAllPlayers = async (req, res) => {
  try {
    const { teamId } = req.query;
    let query = supabase.from('players').select('*, teams(name)');
    if (teamId) {
      query = query.eq('teamId', teamId);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a player
exports.deletePlayer = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId);
    if (error) throw error;
    res.json({ message: 'Player deleted successfully' });
  } catch (err) {
    console.error('Error deleting player:', err.message);
    res.status(500).json({ message: err.message });
  }
};