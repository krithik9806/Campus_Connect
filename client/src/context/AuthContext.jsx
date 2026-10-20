import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cc_token'));
  const [loading, setLoading] = useState(true);

  // Initialize user
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        // Auto-login default demo student Aarav on first load
        try {
          const res = await api.switchDemoUser('student');
          localStorage.setItem('cc_token', res.token);
          setToken(res.token);
          setUser(res.user);
        } catch (e) {
          console.warn('Could not auto-login demo student:', e);
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        const res = await api.getMe();
        setUser(res.user);
        setStats(res.stats);
      } catch (err) {
        console.warn('Session expired or invalid, logging into demo student:', err);
        try {
          const demoRes = await api.switchDemoUser('student');
          localStorage.setItem('cc_token', demoRes.token);
          setToken(demoRes.token);
          setUser(demoRes.user);
        } catch (e) {
          localStorage.removeItem('cc_token');
          setToken(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('cc_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    localStorage.setItem('cc_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('cc_token');
    setToken(null);
    setUser(null);
    setStats(null);
  };

  const switchRole = async (targetRole) => {
    setLoading(true);
    try {
      const res = await api.switchDemoUser(targetRole);
      localStorage.setItem('cc_token', res.token);
      setToken(res.token);
      setUser(res.user);
      // Fetch updated stats
      const meRes = await api.getMe();
      setStats(meRes.stats);
      return res.user;
    } catch (err) {
      console.error('Failed to switch role:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.getMe();
      setUser(res.user);
      setStats(res.stats);
    } catch (err) {
      console.error('Refresh user error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'student',
        token,
        stats,
        loading,
        login,
        register,
        logout,
        switchRole,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
