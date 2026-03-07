import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import API from '../../lib/api';

export default function ManageUsers() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { role } = router.query;
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [fetching, setFetching] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.push('/');
    else fetchUsers();
  }, [user, loading]);

  useEffect(() => {
    if (role && ['admin','manager','audience'].includes(role)) setRoleFilter(role);
    else setRoleFilter('all');
  }, [role]);

  useEffect(() => {
    let filtered = users;
    if (search) filtered = filtered.filter(u => (u.email?.toLowerCase()||'').includes(search.toLowerCase()) || (u.name?.toLowerCase()||'').includes(search.toLowerCase()));
    if (roleFilter !== 'all') filtered = filtered.filter(u => u.role === roleFilter);
    setFilteredUsers(filtered);
  }, [search, roleFilter, users]);

  const fetchUsers = async () => {
    try {
      const { data } = await API.get('/admin/users');
      setUsers(data);
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
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Error updating role: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Delete user permanently?')) return;
    try {
      await API.delete(`/admin/user/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert('Error deleting user: ' + (err.response?.data?.message || err.message));
    }
  };

  const inviteUser = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      await API.post('/admin/invite', { email: inviteEmail });
      alert(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setShowInviteModal(false);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => router.back()} className="mb-6 text-white/80 hover:text-white">← Back</button>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl text-white">Manage Users</h1>
          <button onClick={() => setShowInviteModal(true)} className="bg-green-600 text-white px-4 py-2 rounded">+ Invite User</button>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Search by email or name..." value={search} onChange={e => setSearch(e.target.value)} className="p-2 rounded bg-white/20 text-white border border-white/30" />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="p-2 rounded bg-white/20 text-white border border-white/30">
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="audience">Audience</option>
            </select>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 overflow-x-auto">
          <table className="w-full text-white">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className="border-b border-white/10">
                  <td className="py-2">{u.name || 'N/A'}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} onChange={e => updateRole(u.id, e.target.value)} disabled={updating} className="bg-white/20 text-white p-1 rounded">
                      <option value="audience">Audience</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{u.email_confirmed_at ? 'Confirmed' : 'Pending'}</td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td><button onClick={() => deleteUser(u.id)} className="text-red-400 hover:text-red-300">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-md w-full">
            <h2 className="text-2xl text-white mb-4">Invite User</h2>
            <form onSubmit={inviteUser}>
              <input type="email" placeholder="Email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full p-2 mb-4 rounded bg-white/20 text-white" required />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 text-white/70 hover:text-white">Cancel</button>
                <button type="submit" disabled={inviteLoading} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50">{inviteLoading ? 'Sending...' : 'Send Invite'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}