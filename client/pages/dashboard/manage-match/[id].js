import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import RequireAuth from '../../../components/RequireAuth';
import { getMatch, addBall, startMatch, endMatch, getPlayersByTeam } from '../../../lib/api';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ScoreMatch() {
  const router = useRouter();
  const { id } = router.query;
  const [match, setMatch] = useState(null);
  const [balls, setBalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState({ teamA: [], teamB: [] });
  const [formData, setFormData] = useState({
    over: 1,
    ball: 1,
    batsmanId: '',
    bowlerId: '',
    runs: 0,
    extra: '',
    wicket: false,
    commentary: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endForm, setEndForm] = useState({ result: '', manOfTheMatch: '' });
  const [ending, setEnding] = useState(false);
  const [currentBattingTeamId, setCurrentBattingTeamId] = useState(null);
  const [currentBowlingTeamId, setCurrentBowlingTeamId] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetchMatch();
    subscribeToUpdates();
    return () => supabase.removeAllChannels();
  }, [id]);

  const fetchMatch = async () => {
    try {
      const { data } = await getMatch(id);
      setMatch(data.match);
      setBalls(data.balls);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch players when match is loaded
  useEffect(() => {
    if (match) {
      Promise.all([
        getPlayersByTeam(match.teamAId).then(res => res.data),
        getPlayersByTeam(match.teamBId).then(res => res.data)
      ]).then(([teamAPlayers, teamBPlayers]) => {
        setPlayers({ teamA: teamAPlayers, teamB: teamBPlayers });
      }).catch(err => console.error(err));
    }
  }, [match]);

  // Determine current batting and bowling teams based on current innings
  useEffect(() => {
    if (match && match.innings) {
      const currentInnings = match.innings.find(inn => inn.innings_number === match.current_innings);
      if (currentInnings) {
        setCurrentBattingTeamId(currentInnings.batting_team_id);
        setCurrentBowlingTeamId(currentInnings.bowling_team_id);
      } else {
        // Fallback based on current_innings
        if (match.current_innings === 1) {
          setCurrentBattingTeamId(match.teamAId);
          setCurrentBowlingTeamId(match.teamBId);
        } else if (match.current_innings === 2) {
          setCurrentBattingTeamId(match.teamBId);
          setCurrentBowlingTeamId(match.teamAId);
        }
      }
    }
  }, [match]);

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel(`match-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'balls',
          filter: `matchId=eq.${id}`,
        },
        (payload) => {
          setBalls((prev) => [...prev, payload.new].sort((a, b) => a.over - b.over || a.ball - b.ball));
          getMatch(id).then(({ data }) => setMatch(data.match));
        }
      )
      .subscribe();
    return channel;
  };

  const handleStartMatch = async () => {
    if (confirm('Start this match?')) {
      try {
        await startMatch(id);
        fetchMatch();
      } catch (err) {
        alert('Error starting match');
      }
    }
  };

  const handleEndMatchClick = () => {
    setShowEndModal(true);
  };

  const handleEndMatchSubmit = async (e) => {
    e.preventDefault();
    setEnding(true);
    try {
      await endMatch(id, endForm.result, endForm.manOfTheMatch);
      setShowEndModal(false);
      fetchMatch();
    } catch (err) {
      alert('Error ending match');
    } finally {
      setEnding(false);
    }
  };

  const handleAddBall = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addBall(id, formData);
      const nextBall = formData.ball === 6 ? 1 : formData.ball + 1;
      const nextOver = formData.ball === 6 ? formData.over + 1 : formData.over;
      setFormData({
        over: nextOver,
        ball: nextBall,
        batsmanId: '',
        bowlerId: '',
        runs: 0,
        extra: '',
        wicket: false,
        commentary: '',
      });
    } catch (err) {
      alert('Error adding ball: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Get players for current batting team
  const battingPlayers = currentBattingTeamId === match?.teamAId ? players.teamA : players.teamB;
  const bowlingPlayers = currentBowlingTeamId === match?.teamAId ? players.teamA : players.teamB;

  // Compute if both innings are completed
  const bothInningsCompleted = match?.innings?.every(inning => inning.status === 'completed') ?? false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-white text-xl">Match not found</div>
      </div>
    );
  }

  const sortedInnings = match.innings ? [...match.innings].sort((a, b) => a.innings_number - b.innings_number) : [];

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-20 left-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-6 text-white/80 hover:text-white flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <h1 className="text-3xl font-bold text-white mb-2">
            {match.teamA?.name} vs {match.teamB?.name}
          </h1>
          <div className="flex items-center gap-4 mb-6">
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${
                match.status === 'live' ? 'bg-red-500' : match.status === 'completed' ? 'bg-gray-500' : 'bg-green-500'
              }`}
            >
              {match.status.toUpperCase()}
            </span>
            {match.status === 'live' && <span className="text-red-400 animate-pulse">🔴 LIVEℹ</span>}
            {match.status === 'live' && (
              <span className="text-white/70">
                Current Innings: {match.current_innings} (
                {currentBattingTeamId === match.teamAId ? match.teamA?.name : match.teamB?.name} batting)
              </span>
            )}
          </div>

          {/* Innings Score Display */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedInnings.map(inning => (
                <div key={inning.id} className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {inning.batting_team_id === match.teamAId ? match.teamA.name : match.teamB.name} Innings
                  </h3>
                  <div className="text-4xl font-bold text-white mb-2">
                    {inning.runs}/{inning.wickets}
                  </div>
                  <div className="text-white/80">
                    Overs: {inning.overs} / {match.overs}
                  </div>
                  {inning.status === 'live' && <span className="text-red-400 animate-pulse mt-2 block">🔴 LIVE</span>}
                  {inning.status === 'completed' && <span className="text-gray-400 mt-2 block">Completed</span>}
                </div>
              ))}
            </div>
            {match.result && <div className="mt-4 text-center text-yellow-300 text-xl">{match.result}</div>}
            {match.manOfTheMatch && (
              <div className="mt-2 text-center text-yellow-300">
                Man of the Match: {match.manOfTheMatch.name}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 mb-8">
            {match.status === 'upcoming' && (
              <button
                onClick={handleStartMatch}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Start Match
              </button>
            )}
            {match.status === 'live' && (
              <button
                onClick={handleEndMatchClick}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
              >
                End Match
              </button>
            )}
          </div>

          {/* Add ball form (only when live and not both innings completed) */}
          {match.status === 'live' && !bothInningsCompleted && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Add Ball</h2>
              <form onSubmit={handleAddBall} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/80 mb-1">Over</label>
                  <input
                    type="number"
                    value={formData.over}
                    onChange={(e) => setFormData({ ...formData, over: parseInt(e.target.value) })}
                    className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-1">Ball</label>
                  <input
                    type="number"
                    value={formData.ball}
                    onChange={(e) => setFormData({ ...formData, ball: parseInt(e.target.value) })}
                    className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                    min="1"
                    max="6"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-1">Batsman</label>
                  <select
                    value={formData.batsmanId}
                    onChange={(e) => setFormData({ ...formData, batsmanId: e.target.value })}
                    className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                    required
                  >
                    <option value="">Select batsman</option>
                    {battingPlayers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (ID: {p.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/80 mb-1">Bowler</label>
                  <select
                    value={formData.bowlerId}
                    onChange={(e) => setFormData({ ...formData, bowlerId: e.target.value })}
                    className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                    required
                  >
                    <option value="">Select bowler</option>
                    {bowlingPlayers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (ID: {p.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/80 mb-1">Runs</label>
                  <input
                    type="number"
                    value={formData.runs}
                    onChange={(e) => setFormData({ ...formData, runs: parseInt(e.target.value) })}
                    className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/80 mb-1">Extra</label>
                  <select
                    value={formData.extra}
                    onChange={(e) => setFormData({ ...formData, extra: e.target.value })}
                    className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                  >
                    <option value="">None</option>
                    <option value="wide">Wide</option>
                    <option value="noball">No Ball</option>
                    <option value="bye">Bye</option>
                    <option value="legbye">Leg Bye</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center text-white/80">
                    <input
                      type="checkbox"
                      checked={formData.wicket}
                      onChange={(e) => setFormData({ ...formData, wicket: e.target.checked })}
                      className="mr-2"
                    />
                    Wicket
                  </label>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-white/80 mb-1">Commentary</label>
                  <input
                    type="text"
                    value={formData.commentary}
                    onChange={(e) => setFormData({ ...formData, commentary: e.target.value })}
                    className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                    placeholder="e.g. FOUR, caught at mid-wicket"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {submitting ? 'Adding...' : 'Add Ball'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Recent balls */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Recent Balls</h2>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {balls.slice(-15).reverse().map((b, idx) => (
                <div key={idx} className="text-white/80 border-b border-white/10 pb-1">
                  <span className="font-mono text-sm bg-white/20 px-1 py-0.5 rounded mr-2">
                    {b.over}.{b.ball}
                  </span>
                  <span>
                    {b.commentary ||
                      `${b.runs} run${b.runs !== 1 ? 's' : ''} ${b.extra ? `(${b.extra})` : ''}`}
                    {b.wicket && ' 🔴 WICKET'}
                  </span>
                </div>
              ))}
              {balls.length === 0 && <p className="text-white/60">No balls yet.</p>}
            </div>
          </div>
        </div>

        {/* End Match Modal */}
        {showEndModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-md w-full">
              <h2 className="text-2xl font-bold text-white mb-4">End Match</h2>
              <form onSubmit={handleEndMatchSubmit}>
                <div className="mb-4">
                  <label className="block text-white mb-2">Result</label>
                  <input
                    type="text"
                    value={endForm.result}
                    onChange={(e) => setEndForm({ ...endForm, result: e.target.value })}
                    placeholder="e.g. India won by 20 runs"
                    className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-white mb-2">Man of the Match</label>
                  <select
                    value={endForm.manOfTheMatch}
                    onChange={(e) => setEndForm({ ...endForm, manOfTheMatch: e.target.value })}
                    className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
                    required
                  >
                    <option value="">Select player</option>
                    {players.teamA.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Team A)</option>
                    ))}
                    {players.teamB.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Team B)</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEndModal(false)}
                    className="px-4 py-2 text-white/70 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={ending}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    {ending ? 'Ending...' : 'End Match'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Animations */}
        <style jsx>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
        `}</style>
      </div>
    </RequireAuth>
  );
}