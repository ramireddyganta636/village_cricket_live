import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import RequireAuth from '../../components/RequireAuth';
import API from '../../lib/api';

export default function ManagePlayers() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const { data } = await API.get('/manager/teams');
      setTeams(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const url = selectedTeam ? `/manager/players?teamId=${selectedTeam}` : '/manager/players';
      const { data } = await API.get(url);
      setPlayers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deletePlayer = async (playerId, playerName) => {
    if (!confirm(`Delete player "${playerName}"?`)) return;
    try {
      await API.delete(`/manager/player/${playerId}`);
      fetchPlayers();
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
          <h1 className="text-4xl font-bold text-white mb-8">Manage Players</h1>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
            <label className="block text-white mb-2">Filter by Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full p-2 rounded bg-white/20 text-white border border-white/30"
            >
              <option value="">All Teams</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-2">Player Name</th>
                  <th className="text-left py-2">Team</th>
                  <th className="text-left py-2">Role</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.length > 0 ? (
                  players.map(p => (
                    <tr key={p.id} className="border-b border-white/10">
                      <td className="py-2">{p.name}</td>
                      <td className="py-2">{p.teams?.name || 'Unknown'}</td>
                      <td className="py-2">{p.role || 'N/A'}</td>
                      <td className="py-2">
                        <button
                          onClick={() => deletePlayer(p.id, p.name)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="text-center py-4 text-white/60">No players found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}