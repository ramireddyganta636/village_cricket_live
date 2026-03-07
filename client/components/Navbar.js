import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white/10 backdrop-blur-lg p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="font-bold text-xl">Cricket Live</Link>
        <div className="space-x-4">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="hover:underline">Admin</Link>
              )}
              <button onClick={logout} className="hover:underline">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">Login</Link>
              <Link href="/register" className="hover:underline">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}