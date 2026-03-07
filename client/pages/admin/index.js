import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import API from '../../lib/api';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ users:0, tournaments:0, matches:0, managers:0 });
  const [allUsers, setAllUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [nonManagers, setNonManagers] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newManager, setNewManager] = useState({ name: '', email: '', password: '', role: 'manager' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.push('/');
    else fetchStats();
  }, [user, loading]);

  const fetchStats = async () => {
    try {
      const usersRes = await API.get('/admin/users');
      const tournamentsRes = await API.get('/public/tournaments');
      const matchesRes = await API.get('/public/matches');
      const users = usersRes.data;
      const managersList = users.filter(u => u.role === 'manager');
      setAllUsers(users);
      setManagers(managersList);
      setNonManagers(users.filter(u => u.role !== 'manager'));
      setStats({
        users: users.length,
        tournaments: tournamentsRes.data.length,
        matches: matchesRes.data.length,
        managers: managersList.length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const updateRole = async (userId, newRole) => {
    setUpdating(true);
    try {
      await API.patch(`/admin/user/${userId}/role`, { role: newRole });
      await fetchStats();
    } catch (err) {
      alert('Error updating role: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Delete user permanently?')) return;
    setUpdating(true);
    try {
      await API.delete(`/admin/user/${userId}`);
      await fetchStats();
    } catch (err) {
      alert('Error deleting user: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const createManager = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await API.post('/admin/users', newManager);
      setNewManager({ name: '', email: '', password: '', role: 'manager' });
      setShowAddModal(false);
      await fetchStats();
      alert('Manager created');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreating(false);
    }
  };

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl text-white mb-8">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Link href="/admin/users"><div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 cursor-pointer hover:bg-white/20"><div className="text-3xl text-white">{stats.users}</div><div className="text-white/70">Total Users</div></div></Link>
          <Link href="/admin/users?role=manager"><div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 cursor-pointer hover:bg-white/20"><div className="text-3xl text-white">{stats.managers}</div><div className="text-white/70">Managers</div></div></Link>
          <Link href="/admin/tournaments"><div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 cursor-pointer hover:bg-white/20"><div className="text-3xl text-white">{stats.tournaments}</div><div className="text-white/70">Tournaments</div></div></Link>
          <Link href="/admin/matches"><div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 cursor-pointer hover:bg-white/20"><div className="text-3xl text-white">{stats.matches}</div><div className="text-white/70">Matches</div></div></Link>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl text-white">🔑 Manager Control</h2>
            <button onClick={() => setShowAddModal(true)} className="bg-green-600 text-white px-4 py-2 rounded">+ Create Manager</button>
          </div>
          {managers.length === 0 ? <p className="text-white/70">No managers yet.</p> : (
            <ul className="space-y-2">
              {managers.map(m => (
                <li key={m.id} className="flex justify-between items-center bg-white/5 p-3 rounded">
                  <div><p className="text-white font-medium">{m.name || 'No name'}</p><p className="text-white/60 text-sm">{m.email}</p></div>
                  <div className="flex gap-2">
                    <button onClick={() => updateRole(m.id, 'audience')} className="text-yellow-400 hover:text-yellow-300 text-sm">Revoke</button>
                    <button onClick={() => deleteUser(m.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/users"><div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 cursor-pointer hover:bg-white/20"><h2 className="text-2xl text-white">👥 Manage Users</h2><p className="text-white/70">View, edit roles, delete users</p></div></Link>
          <Link href="/admin/tournaments"><div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 cursor-pointer hover:bg-white/20"><h2 className="text-2xl text-white">🏆 Tournaments</h2><p className="text-white/70">Manage tournaments</p></div></Link>
          <Link href="/admin/matches"><div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 cursor-pointer hover:bg-white/20"><h2 className="text-2xl text-white">⚔️ Matches</h2><p className="text-white/70">Manage matches</p></div></Link>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-md w-full">
            <h2 className="text-2xl text-white mb-4">Create New Manager</h2>
            <form onSubmit={createManager}>
              <input type="text" placeholder="Name" value={newManager.name} onChange={e => setNewManager({...newManager, name: e.target.value})} className="w-full p-2 mb-3 rounded bg-white/20 text-white" required />
              <input type="email" placeholder="Email" value={newManager.email} onChange={e => setNewManager({...newManager, email: e.target.value})} className="w-full p-2 mb-3 rounded bg-white/20 text-white" required />
              <input type="password" placeholder="Password" value={newManager.password} onChange={e => setNewManager({...newManager, password: e.target.value})} className="w-full p-2 mb-3 rounded bg-white/20 text-white" required minLength={6} />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-white/70 hover:text-white">Cancel</button>
                <button type="submit" disabled={creating} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">{creating ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}