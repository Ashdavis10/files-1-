import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('studyhub_token'));

  // Set auth header on token change
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('studyhub_token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('studyhub_token');
    }
  }, [token]);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  const register = useCallback(async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    setToken(data.token);
    setUser(data.user);
    toast.success(`Welcome to StudyHub, ${data.user.username}! 🎉`);
    return data;
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    toast.success(`Welcome back, ${data.user.username}! 📚`);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const updatePreferences = useCallback(async (prefs) => {
    const { data } = await api.put('/auth/preferences', prefs);
    setUser(prev => prev ? { ...prev, preferences: data.preferences } : null);
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout, updateUser, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
