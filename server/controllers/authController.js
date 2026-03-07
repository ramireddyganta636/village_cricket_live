const supabase = require('../utils/supabase');

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) throw error;

    res.status(201).json({ user: data.user, session: data.session });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    res.json({ user: data.user, session: data.session });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const authUser = req.user;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    }

    const combinedUser = {
      id: authUser.id,
      email: authUser.email,
      created_at: authUser.created_at,
      email_confirmed_at: authUser.email_confirmed_at,
      name: profile?.name || null,
      role: profile?.role || 'audience',
      subscriptionStart: profile?.subscriptionStart || null,
      subscriptionEnd: profile?.subscriptionEnd || null,
      isActive: profile?.isActive ?? false,
    };

    res.json(combinedUser);
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ message: err.message });
  }
};