import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';

export default function Settings() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return <div>Loading...</div>;
  if (!user || user.user_metadata?.role !== 'admin') {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => router.back()} className="mb-6 text-white/80 hover:text-white">
          ← Back
        </button>
        <h1 className="text-4xl font-bold text-white mb-8">Settings</h1>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <p className="text-white/70">Platform settings coming soon...</p>
        </div>
      </div>
    </div>
  );
}