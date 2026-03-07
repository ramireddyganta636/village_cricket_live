const supabase = require('../utils/supabase');

// Get all tournaments
exports.getTournaments = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error in getTournaments:', error);
      return res.status(500).json({ message: error.message });
    }
    res.json(data || []);
  } catch (err) {
    console.error('Unexpected error in getTournaments:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get matches of a tournament
exports.getTournamentMatches = async (req, res) => {
  try {
    const { tournamentId } = req.params; // changed from id to tournamentId
    if (!tournamentId) {
      return res.status(400).json({ message: 'Tournament ID is required' });
    }

    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        teamA:teamAId(id, name),
        teamB:teamBId(id, name),
        battingTeam:battingTeamId(id, name),
        bowlingTeam:bowlingTeamId(id, name)
      `)
      .eq('tournamentId', tournamentId);

    if (error) {
      console.error('Error in getTournamentMatches:', error);
      return res.status(500).json({ message: error.message });
    }
    res.json(data || []);
  } catch (err) {
    console.error('Unexpected error in getTournamentMatches:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get match details with ball-by-ball and innings
exports.getMatch = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Match ID is required' });

    // Fetch match with team, player details, man of the match, and innings
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        *,
        teamA:teamAId(*),
        teamB:teamBId(*),
        battingTeam:battingTeamId(*),
        bowlingTeam:bowlingTeamId(*),
        striker:strikerId(*),
        nonStriker:nonStrikerId(*),
        bowler:bowlerId(*),
        manOfTheMatch:man_of_the_match ( id, name ),
        innings ( * )
      `)
      .eq('id', id)
      .maybeSingle();

    if (matchError) {
      console.error('Error in getMatch (match):', matchError);
      return res.status(500).json({ message: matchError.message });
    }
    if (!match) return res.status(404).json({ message: 'Match not found' });

    // Fetch balls for this match
    const { data: balls, error: ballsError } = await supabase
      .from('balls')
      .select(`
        *,
        batsman:batsmanId(*),
        bowler:bowlerId(*)
      `)
      .eq('matchId', id)
      .order('over', { ascending: true })
      .order('ball', { ascending: true });

    if (ballsError) {
      console.error('Error in getMatch (balls):', ballsError);
      return res.status(500).json({ message: ballsError.message });
    }

    res.json({ match, balls: balls || [] });
  } catch (err) {
    console.error('Unexpected error in getMatch:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get player statistics for a match
exports.getPlayerStats = async (req, res) => {
  try {
    const { matchId } = req.params;
    if (!matchId) {
      return res.status(400).json({ message: 'Match ID is required' });
    }

    // Get all balls for the match
    const { data: balls, error } = await supabase
      .from('balls')
      .select('*')
      .eq('matchId', matchId);

    if (error) {
      console.error('Error in getPlayerStats (balls):', error);
      return res.status(500).json({ message: error.message });
    }

    const battingStats = {};
    const bowlingStats = {};

    balls.forEach(ball => {
      // Batting stats
      if (ball.batsmanId) {
        if (!battingStats[ball.batsmanId]) {
          battingStats[ball.batsmanId] = {
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0
          };
        }
        battingStats[ball.batsmanId].runs += ball.runs;
        if (ball.extra !== 'wide' && ball.extra !== 'noball') {
          battingStats[ball.batsmanId].balls += 1;
        }
        if (ball.runs === 4) battingStats[ball.batsmanId].fours += 1;
        if (ball.runs === 6) battingStats[ball.batsmanId].sixes += 1;
      }

      // Bowling stats
      if (ball.bowlerId) {
        if (!bowlingStats[ball.bowlerId]) {
          bowlingStats[ball.bowlerId] = {
            runs: 0,
            wickets: 0,
            overs: 0,
            balls: 0,
            economy: 0
          };
        }
        bowlingStats[ball.bowlerId].runs += ball.runs;
        if (ball.wicket) bowlingStats[ball.bowlerId].wickets += 1;
        if (ball.extra !== 'wide' && ball.extra !== 'noball') {
          bowlingStats[ball.bowlerId].balls += 1;
        }
      }
    });

    // Calculate strike rates and economies
    Object.keys(battingStats).forEach(id => {
      const s = battingStats[id];
      s.strikeRate = s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(2) : 0;
    });

    Object.keys(bowlingStats).forEach(id => {
      const s = bowlingStats[id];
      s.overs = Math.floor(s.balls / 6) + (s.balls % 6) / 10;
      s.economy = s.balls > 0 ? (s.runs / (s.balls / 6)).toFixed(2) : 0;
    });

    // Fetch player names
    const playerIds = [...new Set([...Object.keys(battingStats), ...Object.keys(bowlingStats)])];
    if (playerIds.length === 0) {
      return res.json({ batting: [], bowling: [] });
    }

    const { data: players, error: playerError } = await supabase
      .from('players')
      .select('id, name')
      .in('id', playerIds);

    if (playerError) {
      console.error('Error in getPlayerStats (players):', playerError);
      return res.status(500).json({ message: playerError.message });
    }

    const playerMap = {};
    players.forEach(p => playerMap[p.id] = p.name);

    res.json({
      batting: Object.entries(battingStats).map(([id, stats]) => ({ id, name: playerMap[id] || 'Unknown', ...stats })),
      bowling: Object.entries(bowlingStats).map(([id, stats]) => ({ id, name: playerMap[id] || 'Unknown', ...stats }))
    });
  } catch (err) {
    console.error('Unexpected error in getPlayerStats:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get points table for a tournament
exports.getPointsTable = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    if (!tournamentId) {
      return res.status(400).json({ message: 'Tournament ID is required' });
    }

    // Get all completed matches in tournament
    const { data: matches, error } = await supabase
      .from('matches')
      .select('teamAId, teamBId, result, teamA:teamAId(name), teamB:teamBId(name)')
      .eq('tournamentId', tournamentId)
      .eq('status', 'completed');

    if (error) {
      console.error('Error in getPointsTable:', error);
      return res.status(500).json({ message: error.message });
    }

    const points = {};

    matches.forEach(match => {
      // Initialize teams if not present
      if (!points[match.teamAId]) {
        points[match.teamAId] = { name: match.teamA?.name || 'Unknown', played: 0, won: 0, lost: 0, points: 0 };
      }
      if (!points[match.teamBId]) {
        points[match.teamBId] = { name: match.teamB?.name || 'Unknown', played: 0, won: 0, lost: 0, points: 0 };
      }

      points[match.teamAId].played += 1;
      points[match.teamBId].played += 1;

      // Determine winner from result string (simplistic)
      // You can enhance this by storing structured data
      if (match.result) {
        const winnerName = match.result.split(' won')[0]; // crude extraction
        if (winnerName === match.teamA?.name) {
          points[match.teamAId].won += 1;
          points[match.teamAId].points += 2;
          points[match.teamBId].lost += 1;
        } else if (winnerName === match.teamB?.name) {
          points[match.teamBId].won += 1;
          points[match.teamBId].points += 2;
          points[match.teamAId].lost += 1;
        } else {
          // Tie – both get 1 point
          points[match.teamAId].points += 1;
          points[match.teamBId].points += 1;
        }
      }
    });

    // Convert to array and sort by points
    const table = Object.entries(points).map(([id, data]) => ({ id, ...data }));
    table.sort((a, b) => b.points - a.points);

    res.json(table);
  } catch (err) {
    console.error('Unexpected error in getPointsTable:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get all teams in a tournament
exports.getTeamsByTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    if (!tournamentId) {
      return res.status(400).json({ message: 'Tournament ID is required' });
    }

    const { data, error } = await supabase
      .from('teams')
      .select('id, name')
      .eq('tournamentId', tournamentId);

    if (error) {
      console.error('Error in getTeamsByTournament:', error);
      return res.status(500).json({ message: error.message });
    }
    res.json(data || []);
  } catch (err) {
    console.error('Unexpected error in getTeamsByTournament:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get all matches (with team names)
exports.getAllMatches = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        teamA:teamAId(id, name),
        teamB:teamBId(id, name)
      `)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error in getAllMatches:', error);
      return res.status(500).json({ message: error.message });
    }
    res.json(data || []);
  } catch (err) {
    console.error('Unexpected error in getAllMatches:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get players of a team
exports.getPlayersByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    if (!teamId) return res.status(400).json({ message: 'Team ID required' });
    const { data, error } = await supabase
      .from('players')
      .select('id, name')
      .eq('teamId', teamId);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};