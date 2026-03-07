import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTournamentMatches } from '../../lib/api';

export default function TournamentPage() {
  const router = useRouter();
  const { id } = router.query;
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchMatches();
  }, [id]);

  const fetchMatches = async () => {
    try {
      const { data } = await getTournamentMatches(id);
      // Assuming the response includes tournament info + matches array
      setTournament(data.tournament || { name: 'Tournament' });
      setMatches(data.matches || data); // adjust based on your API response
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-500';
      case 'ongoing': return 'bg-yellow-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-green-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-8 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-20 left-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 text-white/80 hover:text-white flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Tournament header */}
        <h1 className="text-4xl font-bold text-white mb-2 animate-fade-in-down">
          {tournament?.name || 'Tournament'}
        </h1>
        {tournament?.startDate && (
          <p className="text-white/80 mb-8 animate-fade-in-down animation-delay-200">
            {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
          </p>
        )}

        {matches.length === 0 ? (
          <div className="text-center text-white text-xl bg-white/10 backdrop-blur-lg rounded-2xl p-12 max-w-md mx-auto border border-white/20">
            No matches scheduled yet
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, index) => (
              <Link key={match.id} href={`/match/${match.id}`}>
                <div
                  className="group relative bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {match.teamA?.name} vs {match.teamB?.name}
                      </h3>
                      <div className="flex items-center gap-3 text-white/70 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${getStatusColor(match.status)}`}>
                          {match.status.toUpperCase()}
                        </span>
                        {match.status === 'live' && (
                          <span className="text-red-400">🔴 LIVE</span>
                        )}
                        {match.runs !== undefined && (
                          <span>{match.runs}/{match.wickets} ({match.oversCompleted} ov)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white/50 text-sm">
                        {new Date(match.startTime).toLocaleTimeString()}
                      </span>
                      <span className="text-white/70 group-hover:translate-x-2 transition-transform duration-300">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Custom animations (same as before) */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}