import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  canUpdateClass: (classId: number) => boolean;
  canViewAllResults: () => boolean;
  isSuperAdmin: () => boolean;
  isPrincipal: () => boolean;
  assignedClassId: () => number | null;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        try {
          const userData = await api.auth.getMe();
          setUser(userData);
          setToken(storedToken);
        } catch (err) {
          console.error('Failed to load user from token', err);
          localStorage.removeItem('access_token');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(username, password);
      localStorage.setItem('access_token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('access_token');
    }
  };

  const canUpdateClass = (classId: number): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'PRINCIPAL') return true;
    if (user.role === 'CLASS_TEACHER') {
      return user.teacher_profile?.assigned_class_id === classId;
    }
    return false;
  };

  const canViewAllResults = (): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN' || user.role === 'PRINCIPAL') return true;
    return user.permissions.includes('VIEW_ALL_RESULTS');
  };

  const isSuperAdmin = (): boolean => user?.role === 'SUPER_ADMIN';
  const isPrincipal = (): boolean => user?.role === 'PRINCIPAL';
  
  const assignedClassId = (): number | null => {
    return user?.teacher_profile?.assigned_class_id ?? null;
  };

  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.permissions.includes(perm);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        canUpdateClass,
        canViewAllResults,
        isSuperAdmin,
        isPrincipal,
        assignedClassId,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
