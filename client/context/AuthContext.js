import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { login as apiLogin, register as apiRegister, getMe } from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const { data } = await getMe();
      setUser(data);
    } catch (err) {
      console.error('fetchUser error:', err);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, selectedRole) => {
    console.log('1. Login started, selectedRole:', selectedRole);
    setError(null);
    try {
      const { data } = await apiLogin(email, password);
      console.log('2. apiLogin response:', data);

      const token = data.session?.access_token;
      if (!token) throw new Error('No access token received');
      console.log('3. Token received:', token.substring(0, 20) + '...');

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('4. Token stored');

      const meResponse = await getMe();
      console.log('5. getMe response:', meResponse.data);
      const userData = meResponse.data;

      const expectedRole = selectedRole === 'public' ? 'audience' : selectedRole;
      console.log('6. expectedRole:', expectedRole, 'actual role:', userData.role);

      if (expectedRole !== userData.role) {
        console.log('7. Role mismatch!');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setError(`You are not authorized as ${selectedRole}. Your actual role is ${userData.role}.`);
        return;
      }

      console.log('8. Role match. Setting user...');
      setUser(userData);

      // Small delay to ensure state is updated before redirect
      setTimeout(() => {
        console.log('9. Redirecting...');
        if (userData.role === 'admin') {
          router.push('/admin');
        } else if (userData.role === 'manager') {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
      }, 100);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const register = async (email, password, name) => {
    setError(null);
    try {
      const { data } = await apiRegister(email, password, name);
      if (data.session) {
        const token = data.session.access_token;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const meResponse = await getMe();
        setUser(meResponse.data);
      } else {
        alert('Registration successful! Please check your email to confirm.');
      }
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);