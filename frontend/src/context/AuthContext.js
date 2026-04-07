import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('studyhub_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('studyhub_token'));

  // Set auth header on token change
  useEffect(() => {
    if (token) {
      localStorage.setItem('studyhub_token', token);
    } else {
      localStorage.removeItem('studyhub_token');
      localStorage.removeItem('studyhub_user');
      setUser(null);
    }
  }, [token]);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (!token) { 
        setLoading(false); 
        return; 
      }
      
      // Check if user is already in localStorage
      const storedUser = localStorage.getItem('studyhub_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setLoading(false);
        return;
      }
      
      // Otherwise fetch from API
      try {
        const response = await fetch('https://studyhub-siol.onrender.com/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          localStorage.setItem('studyhub_user', JSON.stringify(data.user));
        }
      } catch (error) {
        console.error('Failed to load user:', error);
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
