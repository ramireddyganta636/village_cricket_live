const Razorpay = require('razorpay');
const crypto = require('crypto');
const supabase = require('../utils/supabase');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create order
exports.createOrder = async (req, res) => {
  try {
    const options = {
      amount: 100 * 100, // ₹100 in paise
      currency: 'INR',
      receipt: `sub_${req.user.id}`
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Verify payment and activate subscription
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Update user metadata in Supabase Auth (or profiles table) to set subscription
      const subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Update auth user metadata
      const { error } = await supabase.auth.admin.updateUserById(
        req.user.id,
        { user_metadata: { role: 'manager', subscriptionEnd } }
      );

      if (error) throw error;

      // Also update profiles table if you have one
      await supabase
        .from('profiles')
        .update({ role: 'manager', subscriptionEnd })
        .eq('id', req.user.id);

      res.json({ success: true, message: 'Payment verified, subscription activated' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};