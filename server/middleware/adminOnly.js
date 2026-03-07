const adminOnly = (req, res, next) => {
  // The protect middleware already attaches req.user
  // We need to fetch the role from profiles table or user metadata
  // For simplicity, we assume role is in user_metadata
  const role = req.user?.user_metadata?.role;
  if (role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
};

module.exports = adminOnly;