import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import axios from 'axios';

export default function Payment() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1. Create order on your backend
      const { data: order } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/create-order`
      );

      // 2. Initialize Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'LiveCrick Pro',
        description: 'Manager Subscription (30 days)',
        order_id: order.id,
        handler: async (response) => {
          // 3. Verify payment on backend
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/payment/verify`,
            response
          );
          if (data.success) {
            alert('Subscription activated!');
            window.location.href = '/dashboard';
          } else {
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#3399cc' },
      };

      // 4. Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error(error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Get Manager Access – ₹100 for 30 days</h1>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
}