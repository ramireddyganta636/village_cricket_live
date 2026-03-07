import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import API from '../../lib/api';

export default function AdminMatches() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    } else {
      fetchMatches();
    }
  }, [user, loading]);

  const fetchMatches = async () => {
    try {
      const { data } = await API.get('/public/matches');
      setMatches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const deleteMatch = async (matchId) => {
    if (!confirm('Delete this match? All ball-by-ball data will be lost.')) return;
    try {
      await API.delete(`/admin/match/${matchId}`); // need this endpoint – if not, you'll need to add it
      setMatches(prev => prev.filter(m => m.id !== matchId));
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
        <h1 className="text-4xl text-white mb-8">All Matches</h1>
        <div className="grid gap-4">
          {matches.map(m => (
            <div key={m.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 flex justify-between items-center">
              <div>
                <h3 className="text-xl text-white font-bold">
                  {m.teamA?.name || `Team ${m.teamAId}`} vs {m.teamB?.name || `Team ${m.teamBId}`}
                </h3>
                <p className="text-white/70">
                  Status: {m.status} | Score: {m.runs}/{m.wickets} ({m.oversCompleted} ov)
                </p>
              </div>
              <div className="space-x-2">
                <Link href={`/match/${m.id}`}>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">View</button>
                </Link>
                <button onClick={() => deleteMatch(m.id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Delete</button>
              </div>
            </div>
          ))}
          {matches.length === 0 && <p className="text-white/70 text-center py-8">No matches found.</p>}
        </div>
      </div>
    </div>
  );
}