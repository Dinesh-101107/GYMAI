import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';
import { User, Role } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<User>;
  register: (data: { email: string; password: string; name: string; phone?: string; feeAmount?: number }) => Promise<User>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('gymmate_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('gymmate_access_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          const userData: User = {
            id: res.data.id,
            email: res.data.email,
            role: res.data.role,
            name: res.data.member?.name || res.data.staff?.name || res.data.email.split('@')[0],
            memberId: res.data.member?.id,
            staffId: res.data.staff?.id,
            membershipStatus: res.data.member?.membershipStatus,
            designation: res.data.staff?.designation,
          };
          setUser(userData);
          localStorage.setItem('gymmate_user', JSON.stringify(userData));
        } catch {
          // Token invalid
          localStorage.removeItem('gymmate_access_token');
          localStorage.removeItem('gymmate_refresh_token');
          localStorage.removeItem('gymmate_user');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const res = await api.post('/auth/login', { email, password: pass });
    const { accessToken, refreshToken, user: loggedUser } = res.data;

    localStorage.setItem('gymmate_access_token', accessToken);
    localStorage.setItem('gymmate_refresh_token', refreshToken);
    localStorage.setItem('gymmate_user', JSON.stringify(loggedUser));

    setUser(loggedUser);
    return loggedUser;
  };

  const loginWithGoogle = async (credential: string): Promise<User> => {
    const res = await api.post('/auth/google', { credential });
    const { accessToken, refreshToken, user: loggedUser } = res.data;

    localStorage.setItem('gymmate_access_token', accessToken);
    localStorage.setItem('gymmate_refresh_token', refreshToken);
    localStorage.setItem('gymmate_user', JSON.stringify(loggedUser));

    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (data: { email: string; password: string; name: string; phone?: string; feeAmount?: number }): Promise<User> => {
    const res = await api.post('/auth/register', data);
    const { accessToken, refreshToken, user: registeredUser } = res.data;

    localStorage.setItem('gymmate_access_token', accessToken);
    localStorage.setItem('gymmate_refresh_token', refreshToken);
    localStorage.setItem('gymmate_user', JSON.stringify(registeredUser));

    setUser(registeredUser);
    return registeredUser;
  };

  const logout = () => {
    localStorage.removeItem('gymmate_access_token');
    localStorage.removeItem('gymmate_refresh_token');
    localStorage.removeItem('gymmate_user');
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUserData = async () => {
    try {
      const res = await api.get('/auth/me');
      const updated: User = {
        id: res.data.id,
        email: res.data.email,
        role: res.data.role,
        name: res.data.member?.name || res.data.staff?.name || res.data.email.split('@')[0],
        memberId: res.data.member?.id,
        staffId: res.data.staff?.id,
        membershipStatus: res.data.member?.membershipStatus,
        designation: res.data.staff?.designation,
      };
      setUser(updated);
      localStorage.setItem('gymmate_user', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to refresh user data', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
