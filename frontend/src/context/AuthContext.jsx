import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('access_token');
    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await authApi.login(credentials);
    const { access, refresh, user: userData } = response.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  }, []);

  const register = useCallback(async (data) => {
    const response = await authApi.register(data);
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token');
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {}
    localStorage.clear();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.me();
      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
