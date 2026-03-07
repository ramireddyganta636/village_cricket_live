import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import API from '../../lib/api';

export default function AdminTournaments() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    } else {
      fetchTournaments();
    }
  }, [user, loading]);

  const fetchTournaments = async () => {
    try {
      const { data } = await API.get('/public/tournaments');
      setTournaments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const deleteTournament = async (tournamentId) => {
    if (!confirm('Delete this tournament? All matches and data will be lost.')) return;
    try {
      await API.delete(`/admin/tournament/${tournamentId}`);
      setTournaments(prev => prev.filter(t => t.id !== tournamentId));
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => router.back()} className="mb-6 text-white/80 hover:text-white">← Back</button>
        <h1 className="text-4xl text-white mb-8">All Tournaments</h1>
        <div className="grid gap-4">
          {tournaments.map(t => (
            <div key={t.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 flex justify-between items-center">
              <div>
                <h3 className="text-xl text-white font-bold">{t.name}</h3>
                <p className="text-white/70">Status: {t.status} | Created: {new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="space-x-2">
                <Link href={`/tournament/${t.id}`}>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">View</button>
                </Link>
                <button onClick={() => deleteTournament(t.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Delete</button>
              </div>
            </div>
          ))}
          {tournaments.length === 0 && <p className="text-white/70 text-center py-8">No tournaments found.</p>}
        </div>
      </div>
    </div>
  );
}