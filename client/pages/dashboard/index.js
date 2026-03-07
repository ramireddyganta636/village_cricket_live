import RequireAuth from '../../components/RequireAuth';
import Link from 'next/link';

export default function DashboardHome() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-20 left-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold text-white text-center mb-12 animate-fade-in-down">
            Manager Dashboard
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create Tournament */}
            <Link href="/dashboard/create-tournament">
              <div className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer animate-fade-in-up">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center">
                  <span className="text-5xl mb-4 block">🏆</span>
                  <h2 className="text-2xl font-bold text-white">Create Tournament</h2>
                  <p className="text-white/70 mt-2">Set up a new cricket tournament</p>
                </div>
              </div>
            </Link>

            {/* Create Team */}
            <Link href="/dashboard/create-team">
              <div className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center">
                  <span className="text-5xl mb-4 block">👥</span>
                  <h2 className="text-2xl font-bold text-white">Create Team</h2>
                  <p className="text-white/70 mt-2">Add a team to a tournament</p>
                </div>
              </div>
            </Link>

            {/* Add Player */}
            <Link href="/dashboard/create-player">
              <div className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center">
                  <span className="text-5xl mb-4 block">🏏</span>
                  <h2 className="text-2xl font-bold text-white">Add Player</h2>
                  <p className="text-white/70 mt-2">Register players for a team</p>
                </div>
              </div>
            </Link>

            {/* NEW: Manage Teams */}
            <Link href="/dashboard/teams">
              <div className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center">
                  <span className="text-5xl mb-4 block">🗂️</span>
                  <h2 className="text-2xl font-bold text-white">Manage Teams</h2>
                  <p className="text-white/70 mt-2">View and delete teams</p>
                </div>
              </div>
            </Link>

            {/* NEW: Manage Players */}
            <Link href="/dashboard/players">
              <div className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center">
                  <span className="text-5xl mb-4 block">📋</span>
                  <h2 className="text-2xl font-bold text-white">Manage Players</h2>
                  <p className="text-white/70 mt-2">View and delete players</p>
                </div>
              </div>
            </Link>

            {/* Schedule Match */}
            <Link href="/dashboard/create-match">
              <div className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center">
                  <span className="text-5xl mb-4 block">⚔️</span>
                  <h2 className="text-2xl font-bold text-white">Schedule Match</h2>
                  <p className="text-white/70 mt-2">Create a match between two teams</p>
                </div>
              </div>
            </Link>

            {/* Live Scoring */}
            <Link href="/dashboard/live-scoring">
              <div className="group relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center">
                  <span className="text-5xl mb-4 block">🔴</span>
                  <h2 className="text-2xl font-bold text-white">Live Scoring</h2>
                  <p className="text-white/70 mt-2">Enter ball‑by‑ball data</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Custom animations */}
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
    </RequireAuth>
  );
}