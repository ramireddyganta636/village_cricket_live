import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import RequireAuth from '../../components/RequireAuth';
import { getTournaments, getTournamentMatches } from '../../lib/api';
import Link from 'next/link';

export default function LiveScoringSelect() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const { data } = await getTournaments();
      setTournaments(data);
      if (data.length > 0) {
        setSelectedTournament(data[0].id);
        fetchMatches(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async (tournamentId) => {
    console.log('1. Fetching matches for tournament:', tournamentId);
    setLoading(true);
    try {
      const response = await getTournamentMatches(tournamentId);
      console.log('2. Full API response:', response);
      console.log('3. Response status:', response.status);
      console.log('4. Response data:', response.data);
      setMatches(response.data);
      console.log('5. Matches state updated with:', response.data);
    } catch (err) {
      console.error('6. Error object:', err);
      if (err.response) {
        console.error('7. Error response data:', err.response.data);
        console.error('8. Error response status:', err.response.status);
      } else if (err.request) {
        console.error('9. Error request:', err.request);
      } else {
        console.error('10. Error message:', err.message);
      }
    } finally {
      setLoading(false);
      console.log('11. Loading finished');
    }
  };

  const handleTournamentChange = (e) => {
    const tid = e.target.value;
    setSelectedTournament(tid);
    fetchMatches(tid);
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => router.back()} className="mb-6 text-white/80 hover:text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <h1 className="text-3xl font-bold text-white mb-6">Live Scoring</h1>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
            <label className="block text-white mb-2">Select Tournament</label>
            <select
              value={selectedTournament || ''}
              onChange={handleTournamentChange}
              className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
            >
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center text-white">Loading matches...</div>
          ) : (
            <div className="grid gap-4">
              {matches.map(m => (
                <Link key={m.id} href={`/dashboard/manage-match/${m.id}`}>
                  <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition">
                    <h3 className="text-xl text-white">{m.teamA?.name} vs {m.teamB?.name}</h3>
                    <p className="text-white/70">Status: {m.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}