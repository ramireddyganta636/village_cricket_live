const supabase = require('../utils/supabase');

const checkSubscription = async (req, res, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ message: 'Not authorized' });

  // Get role from user_metadata
  const role = user.user_metadata?.role;

  // Admin bypass (if you have admin role)
  if (role === 'admin') return next();

  if (role !== 'manager') {
    return res.status(403).json({ message: 'Access denied: not a manager' });
  }

  // Check subscription expiration (if you store it in user_metadata)
  const subscriptionEnd = user.user_metadata?.subscriptionEnd;
  if (subscriptionEnd && new Date(subscriptionEnd) < new Date()) {
    return res.status(403).json({ message: 'Subscription expired' });
  }

  next();
};

module.exports = checkSubscription;