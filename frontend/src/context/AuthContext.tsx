import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  srid?: string;
  role: 'ambassador' | 'admin' | 'superadmin' | 'super_admin';
  totalPoints?: number;
  currentRank?: number;
  badgeTier?: string;
  college?: string;
  linkedin?: string;
  instagram?: string;
  phone?: string;
  city?: string;
  state?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  role: 'ambassador' | 'admin' | 'superadmin' | 'super_admin' | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authAPI.getMe();
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      } else {
        throw new Error('User not found');
      }
    } catch (err: any) {
      console.warn('Session verification failed:', err.message);
      // Clean up stale or invalid session to prevent unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    // Purge any existing session storage to avoid cross-user state pollution
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();

    // Normalize admin role
    const normalizedRole =
      newUser.role === 'admin' || newUser.role === 'superadmin' || (newUser.role as string) === 'super_admin'
        ? 'admin'
        : 'ambassador';
    const normalizedUser = { ...newUser, role: normalizedRole as 'admin' | 'ambassador' };

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    localStorage.setItem('sessionTimestamp', String(Date.now()));
    setToken(newToken);
    setUser(normalizedUser);
  };

  const logout = () => {
    const wasAdmin =
      user?.role === 'admin' || user?.role === 'superadmin' || (user?.role as string) === 'super_admin';
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = wasAdmin ? '/admin/login' : '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
