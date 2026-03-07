const supabase = require('../utils/supabase');
const supabaseAdmin = require('../utils/supabaseAdmin');

exports.getAllUsers = async (req, res) => {
  try {
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    if (profilesError) throw profilesError;

    const users = authUsers.users.map(authUser => {
      const profile = profiles.find(p => p.id === authUser.id) || {};
      return {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        email_confirmed_at: authUser.email_confirmed_at,
        name: profile.name || null,
        role: profile.role || 'audience',
        subscriptionStart: profile.subscriptionStart || null,
        subscriptionEnd: profile.subscriptionEnd || null,
        isActive: profile.isActive ?? false,
      };
    });

    res.json(users);
  } catch (err) {
    console.error('Error in getAllUsers:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error updating role:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Delete from any tables that reference auth.users
    // Profiles table (always present)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) throw profileError;

    // 2. (Optional) If tournaments have createdBy, either delete or reassign them
    // Here we delete them (choose one – you may want to reassign instead)
    const { error: tournError } = await supabase
      .from('tournaments')
      .delete()
      .eq('createdBy', userId);
    if (tournError && tournError.code !== 'PGRST116') throw tournError; // ignore "no rows"

    // 3. Finally delete from auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.inviteUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (error) throw error;

    await supabase
      .from('profiles')
      .insert([{ id: data.user.id, name: '', role: 'audience' }]);

    res.json({ message: 'Invitation sent successfully', user: data.user });
  } catch (err) {
    console.error('Error inviting user:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: data.user.id, name, role }]);
    if (profileError) throw profileError;

    res.status(201).json({ id: data.user.id, email, name, role });
  } catch (err) {
    console.error('Error creating user:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTournament = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ message: 'Tournament deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// In server/controllers/adminController.js
exports.deleteMatch = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ message: 'Match deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};