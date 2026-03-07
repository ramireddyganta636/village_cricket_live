import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import RequireAuth from '../../components/RequireAuth';
import { createPlayer, getTournaments, getTeams } from '../../lib/api'; // getTeams assumed

export default function CreatePlayer() {
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    teamId: '',
    role: 'batsman',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const { data } = await getTournaments();
      setTournaments(data);
      if (data.length > 0) {
        fetchTeams(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeams = async (tournamentId) => {
    setFetching(true);
    try {
      const { data } = await getTeams(tournamentId); // assume this returns teams for that tournament
      setTeams(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, teamId: data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleTournamentChange = (e) => {
    const tid = e.target.value;
    setFormData(prev => ({ ...prev, teamId: '' })); // reset team selection
    fetchTeams(tid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createPlayer(formData);
      router.push('/dashboard');
    } catch (err) {
      alert('Error adding player: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (fetching && tournaments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-20 left-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-6 text-white/80 hover:text-white flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h1 className="text-3xl font-bold text-white mb-6 text-center">Add Player</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="peer w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/50 backdrop-blur-sm transition-all duration-200 text-white"
                  placeholder=" "
                  required
                />
                <label
                  htmlFor="name"
                  className="absolute left-4 -top-2.5 bg-white/20 backdrop-blur-sm px-2 text-sm text-white/80"
                >
                  Player Name
                </label>
              </div>

              <div className="relative">
                <select
                  id="tournamentSelect"
                  onChange={handleTournamentChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/50 backdrop-blur-sm text-white"
                  required
                >
                  <option value="" disabled selected>Select Tournament</option>
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <label
                  htmlFor="tournamentSelect"
                  className="absolute left-4 -top-2.5 bg-white/20 backdrop-blur-sm px-2 text-sm text-white/80"
                >
                  Tournament
                </label>
              </div>

              <div className="relative">
                <select
                  id="teamId"
                  value={formData.teamId}
                  onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/50 backdrop-blur-sm text-white"
                  required
                  disabled={teams.length === 0}
                >
                  <option value="" disabled>Select Team</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <label
                  htmlFor="teamId"
                  className="absolute left-4 -top-2.5 bg-white/20 backdrop-blur-sm px-2 text-sm text-white/80"
                >
                  Team
                </label>
              </div>

              <div className="relative">
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/50 backdrop-blur-sm text-white"
                  required
                >
                  <option value="batsman">Batsman</option>
                  <option value="bowler">Bowler</option>
                  <option value="all-rounder">All-Rounder</option>
                  <option value="wicketkeeper">Wicketkeeper</option>
                </select>
                <label
                  htmlFor="role"
                  className="absolute left-4 -top-2.5 bg-white/20 backdrop-blur-sm px-2 text-sm text-white/80"
                >
                  Role
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-pink-600 text-white py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Player'}
              </button>
            </form>
          </div>
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
        `}</style>
      </div>
    </RequireAuth>
  );
}