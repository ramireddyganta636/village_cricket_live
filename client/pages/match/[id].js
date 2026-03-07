import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getMatch } from '../../lib/api';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function MatchPage() {
  const router = useRouter();
  const { id } = router.query;
  const [match, setMatch] = useState(null);
  const [balls, setBalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInnings, setSelectedInnings] = useState(1); // 1 or 2

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

  // Compute batting/bowling stats for a specific innings
  const computeStats = (inningsId) => {
    const inningsBalls = balls.filter(b => b.innings_id === inningsId);
    const batting = {};
    const bowling = {};

    inningsBalls.forEach((ball) => {
      // Batting
      if (ball.batsmanId) {
        if (!batting[ball.batsmanId]) {
          batting[ball.batsmanId] = {
            id: ball.batsmanId,
            name: ball.batsman?.name || `Player ${ball.batsmanId}`,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
          };
        }
        batting[ball.batsmanId].runs += ball.runs;
        if (ball.extra !== 'wide' && ball.extra !== 'noball') {
          batting[ball.batsmanId].balls += 1;
        }
        if (ball.runs === 4) batting[ball.batsmanId].fours += 1;
        if (ball.runs === 6) batting[ball.batsmanId].sixes += 1;
      }

      // Bowling
      if (ball.bowlerId) {
        if (!bowling[ball.bowlerId]) {
          bowling[ball.bowlerId] = {
            id: ball.bowlerId,
            name: ball.bowler?.name || `Player ${ball.bowlerId}`,
            runs: 0,
            wickets: 0,
            balls: 0,
          };
        }
        bowling[ball.bowlerId].runs += ball.runs;
        if (ball.wicket) bowling[ball.bowlerId].wickets += 1;
        if (ball.extra !== 'wide' && ball.extra !== 'noball') {
          bowling[ball.bowlerId].balls += 1;
        }
      }
    });

    // Calculate strike rates and economies
    Object.values(batting).forEach((p) => {
      p.strikeRate = p.balls ? ((p.runs / p.balls) * 100).toFixed(2) : 0;
    });
    Object.values(bowling).forEach((p) => {
      const overs = Math.floor(p.balls / 6) + (p.balls % 6) / 10;
      p.overs = overs.toFixed(1);
      p.economy = p.balls ? (p.runs / (p.balls / 6)).toFixed(2) : 0;
    });

    return { batting: Object.values(batting), bowling: Object.values(bowling) };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-green-500';
    }
  };

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
        <div className="text-white text-xl bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          Match not found
        </div>
      </div>
    );
  }

  const sortedInnings = match.innings ? [...match.innings].sort((a, b) => a.innings_number - b.innings_number) : [];
  const innings1 = sortedInnings[0];
  const innings2 = sortedInnings[1];

  const stats1 = innings1 ? computeStats(innings1.id) : { batting: [], bowling: [] };
  const stats2 = innings2 ? computeStats(innings2.id) : { batting: [], bowling: [] };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-20 left-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Back button */}
        <button onClick={() => router.back()} className="mb-6 text-white/80 hover:text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Match header */}
        <h1 className="text-4xl font-bold text-white mb-2">
          {match.teamA?.name} vs {match.teamB?.name}
        </h1>
        <div className="flex items-center gap-4 mb-6">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${getStatusColor(match.status)}`}>
            {match.status.toUpperCase()}
          </span>
          {match.status === 'live' && (
            <span className="flex items-center text-red-400">
              <span className="animate-pulse mr-2">🔴</span> LIVE
            </span>
          )}
          <span className="text-white/70">{new Date(match.startTime).toLocaleString()}</span>
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
              </div>
            ))}
          </div>
          {match.result && (
            <div className="mt-4 text-center text-yellow-300 text-xl font-semibold">{match.result}</div>
          )}
          {match.manOfTheMatch && (
            <div className="mt-2 text-center text-yellow-300">
              Man of the Match: {match.manOfTheMatch.name}
            </div>
          )}
        </div>

        {/* Innings selector tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/20">
          <button
            onClick={() => setSelectedInnings(1)}
            className={`px-4 py-2 text-lg font-semibold transition-colors ${
              selectedInnings === 1
                ? 'text-white border-b-2 border-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {innings1 ? (innings1.batting_team_id === match.teamAId ? match.teamA.name : match.teamB.name) : '1st'} Innings
          </button>
          <button
            onClick={() => setSelectedInnings(2)}
            className={`px-4 py-2 text-lg font-semibold transition-colors ${
              selectedInnings === 2
                ? 'text-white border-b-2 border-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {innings2 ? (innings2.batting_team_id === match.teamAId ? match.teamA.name : match.teamB.name) : '2nd'} Innings
          </button>
        </div>

        {/* Scorecard for selected innings */}
        <div className="animate-fade-in-up">
          {selectedInnings === 1 && innings1 && (
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Batting – {innings1.batting_team_id === match.teamAId ? match.teamA.name : match.teamB.name}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead><tr className="border-b border-white/20">
                      <th className="text-left py-2">Batter</th><th className="text-right">R</th><th className="text-right">B</th><th className="text-right">4s</th><th className="text-right">6s</th><th className="text-right">SR</th>
                    </tr></thead>
                    <tbody>
                      {stats1.batting.length ? stats1.batting.map(p => (
                        <tr key={p.id} className="border-b border-white/10">
                          <td className="py-2">{p.name}</td><td className="text-right">{p.runs}</td><td className="text-right">{p.balls}</td><td className="text-right">{p.fours}</td><td className="text-right">{p.sixes}</td><td className="text-right">{p.strikeRate}</td>
                        </tr>
                      )) : <tr><td colSpan="6" className="text-center py-4 text-white/60">No batting data</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Bowling – {innings1.bowling_team_id === match.teamAId ? match.teamA.name : match.teamB.name}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead><tr className="border-b border-white/20">
                      <th className="text-left py-2">Bowler</th><th className="text-right">O</th><th className="text-right">R</th><th className="text-right">W</th><th className="text-right">Econ</th>
                    </tr></thead>
                    <tbody>
                      {stats1.bowling.length ? stats1.bowling.map(p => (
                        <tr key={p.id} className="border-b border-white/10">
                          <td className="py-2">{p.name}</td><td className="text-right">{p.overs}</td><td className="text-right">{p.runs}</td><td className="text-right">{p.wickets}</td><td className="text-right">{p.economy}</td>
                        </tr>
                      )) : <tr><td colSpan="5" className="text-center py-4 text-white/60">No bowling data</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedInnings === 2 && innings2 && (
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Batting – {innings2.batting_team_id === match.teamAId ? match.teamA.name : match.teamB.name}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead><tr className="border-b border-white/20">
                      <th className="text-left py-2">Batter</th><th className="text-right">R</th><th className="text-right">B</th><th className="text-right">4s</th><th className="text-right">6s</th><th className="text-right">SR</th>
                    </tr></thead>
                    <tbody>
                      {stats2.batting.length ? stats2.batting.map(p => (
                        <tr key={p.id} className="border-b border-white/10">
                          <td className="py-2">{p.name}</td><td className="text-right">{p.runs}</td><td className="text-right">{p.balls}</td><td className="text-right">{p.fours}</td><td className="text-right">{p.sixes}</td><td className="text-right">{p.strikeRate}</td>
                        </tr>
                      )) : <tr><td colSpan="6" className="text-center py-4 text-white/60">No batting data</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Bowling – {innings2.bowling_team_id === match.teamAId ? match.teamA.name : match.teamB.name}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead><tr className="border-b border-white/20">
                      <th className="text-left py-2">Bowler</th><th className="text-right">O</th><th className="text-right">R</th><th className="text-right">W</th><th className="text-right">Econ</th>
                    </tr></thead>
                    <tbody>
                      {stats2.bowling.length ? stats2.bowling.map(p => (
                        <tr key={p.id} className="border-b border-white/10">
                          <td className="py-2">{p.name}</td><td className="text-right">{p.overs}</td><td className="text-right">{p.runs}</td><td className="text-right">{p.wickets}</td><td className="text-right">{p.economy}</td>
                        </tr>
                      )) : <tr><td colSpan="5" className="text-center py-4 text-white/60">No bowling data</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ball-by-ball commentary (optional, hidden behind expand) */}
        <details className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
          <summary className="text-white font-bold cursor-pointer">Ball-by-Ball Commentary</summary>
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            {balls.length ? balls.slice(-30).reverse().map((b, i) => (
              <div key={i} className="text-white/80 border-b border-white/10 py-1">
                <span className="font-mono text-sm bg-white/20 px-1 py-0.5 rounded mr-2">{b.over}.{b.ball}</span>
                {b.commentary || `${b.runs} run${b.runs!==1?'s':''} ${b.extra?`(${b.extra})`:''}`}{b.wicket && ' 🔴 WICKET'}
              </div>
            )) : <p className="text-white/60">No balls yet.</p>}
          </div>
        </details>
      </div>

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
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out; }
      `}</style>
    </div>
  );
}