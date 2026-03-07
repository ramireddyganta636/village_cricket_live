import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import RequireAuth from '../../components/RequireAuth';
import { createMatch, getTournaments, getTeams } from '../../lib/api';

export default function CreateMatch() {
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    tournamentId: '',
    teamAId: '',
    teamBId: '',
    overs: 20,
    startTime: '',
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
        setFormData(prev => ({ ...prev, tournamentId: data[0].id }));
        fetchTeams(data[0].id);
      } else {
        setFetching(false);
      }
    } catch (err) {
      console.error(err);
      setFetching(false);
    }
  };

  const fetchTeams = async (tournamentId) => {
    setFetching(true);
    try {
      const { data } = await getTeams(tournamentId);
      setTeams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleTournamentChange = (e) => {
    const tid = e.target.value;
    setFormData({ ...formData, tournamentId: tid, teamAId: '', teamBId: '' });
    fetchTeams(tid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.teamAId === formData.teamBId) {
      alert('Team A and Team B must be different');
      return;
    }
    setLoading(true);
    try {
      await createMatch(formData);
      router.push('/dashboard');
    } catch (err) {
      alert('Error creating match: ' + (err.response?.data?.message || err.message));
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
            <h1 className="text-3xl font-bold text-white mb-6 text-center">Schedule Match</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <select
                  id="tournamentId"
                  value={formData.tournamentId}
                  onChange={handleTournamentChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/50 backdrop-blur-sm text-white"
                  required
                >
                  <option value="" disabled>Select Tournament</option>
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <label
                  htmlFor="tournamentId"
                  className="absolute left-4 -top-2.5 bg-white/20 backdrop-blur-sm px-2 text-sm text-white/80"
                >
                  Tournament
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <select
                    id="teamAId"
                    value={formData.teamAId}
                    onChange={(e) => setFormData({ ...formData, teamAId: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/50 backdrop-blur-sm text-white"
                    required
                    disabled={teams.length === 0}
                  >
                    <option value="" disabled>Select Team A</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <label
                    htmlFor="teamAId"
                    className="absolute left-4 -top-2.5 bg-white/20 backdrop-blur-sm px-2 text-sm text-white/80"
                  >
                    Team A
                  </label>
                </div>

                <div className="relative">
                  <select
                    id="teamBId"
                    value={formData.teamBId}
                    onChange={(e) => setFormData({ ...formData, teamBId: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/50 backdrop-blur-sm text-white"
                    required
                    disabled={teams.length === 0}
                  >
                    <option value="" disabled>Select Team B</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <label
                    htmlFor="teamBId"
                    className="absolute left-4 -top-2.5 bg-white/20 backdrop-blur-sm px-2 text-sm text-white/80"
                  >
                    Team B
                  </label>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  id="overs"
                  value={formData.overs}
                  onChange={(e) => setFormData({ ...formData, overs: parseInt(e.target.value) })}
                  className="peer w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/50 backdrop-blur-sm transition-all duration-200 text-white"
                  placeholder=" "
                  min="1"
                  max="50"
                  required
                />
                <label
                  htmlFor="overs"
                  className="absolute left-4 -top-2.5 bg-white/20 backdrop-blur-sm px-2 text-sm text-white/80"
                >
                  Overs
                </label>
              </div>

              <div className="relative">
                <input
                  type="datetime-local"
                  id="startTime"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="peer w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white/50 backdrop-blur-sm transition-all duration-200 text-white"
                  placeholder=" "
                  required
                />
                <label
                  htmlFor="startTime"
                  className="absolute left-4 -top-2.5 bg-white/20 backdrop-blur-sm px-2 text-sm text-white/80"
                >
                  Start Time
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-pink-600 text-white py-3 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Match'}
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