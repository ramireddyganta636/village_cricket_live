import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children, requiredRole = 'manager' }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, loading]);

  if (loading || !user) return <div>Loading...</div>;
  return children;
}