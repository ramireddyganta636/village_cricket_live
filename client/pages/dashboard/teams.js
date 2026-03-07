import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import RequireAuth from '../../components/RequireAuth';
import API from '../../lib/api';
import Link from 'next/link';

export default function ManageTeams() {
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const { data } = await API.get('/public/tournaments');
      setTournaments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const url = selectedTournament ? `/manager/teams?tournamentId=${selectedTournament}` : '/manager/teams';
      const { data } = await API.get(url);
      setTeams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (teamId, teamName) => {
    if (!confirm(`Delete team "${teamName}"? All its players will also be deleted.`)) return;
    try {
      await API.delete(`/manager/team/${teamId}`);
      fetchTeams();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => router.back()} className="mb-6 text-white/80 hover:text-white">← Back</button>
          <h1 className="text-4xl font-bold text-white mb-8">Manage Teams</h1>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
            <label className="block text-white mb-2">Filter by Tournament</label>
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
            >
              <option value="">All Tournaments</option>
              {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-2">Team Name</th>
                  <th className="text-left py-2">Tournament</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.length > 0 ? (
                  teams.map(t => (
                    <tr key={t.id} className="border-b border-white/10">
                      <td className="py-2">{t.name}</td>
                      <td className="py-2">{t.tournaments?.name || 'Unknown'}</td>
                      <td className="py-2">
                        <button
                          onClick={() => deleteTeam(t.id, t.name)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" className="text-center py-4 text-white/60">No teams found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}