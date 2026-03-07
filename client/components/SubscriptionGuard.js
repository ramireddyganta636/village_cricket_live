import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function SubscriptionGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'manager' && user.role !== 'admin') {
        router.push('/');
        return;
      }
      if (user.role === 'manager') {
        const now = new Date();
        const subscriptionEnd = user.subscriptionEnd ? new Date(user.subscriptionEnd) : null;
        if (!subscriptionEnd || subscriptionEnd < now) {
          router.push('/payment');
        }
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return <>{children}</>;
}