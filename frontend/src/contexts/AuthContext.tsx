import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

export type UserRole = 'admin' | 'teacher' | 'parent';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  studentId?: string; // for parent linking
  schoolCode?: string; // for all roles to link to a school
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole, extra?: any) => Promise<void>;
  logout: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  language: string;
  setLanguage: (lang: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const token = localStorage.getItem('eduauto_token');
    if (token) {
      api.get('/auth/me').then(res => {
        setUser(res.data.user);
        setIsLoading(false);
      }).catch(() => {
        localStorage.removeItem('eduauto_token');
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, _role: UserRole) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('eduauto_token', res.data.token);
    setUser(res.data.user);
  };

  const signup = async (name: string, email: string, password: string, role: UserRole, extra?: any) => {
    const payload: any = { name, email, password, role };
    let endpoint = '/auth/signup';

    if (role === 'admin') {
      // Map extra fields for admin/school signup
      payload.schoolName = extra.schoolName;
      payload.schoolCode = extra.schoolCode;
      payload.board = extra.board;
      payload.affiliationId = extra.affiliationId;
      payload.address = extra.address;
      payload.city = extra.city;
      payload.state = extra.state;
      payload.contactNumber = extra.contactNumber;
      payload.schoolEmail = extra.schoolEmail;
      payload.adminName = name;
      payload.adminEmail = email;
      payload.adminPassword = password;
    } else if (role === 'teacher') {
      // Teachers shouldn't be signing up directly in SaaS without an invite, but keeping for legacy compat
      throw new Error('Please contact administrator to create a teacher account.');
    } else if (role === 'parent') {
      endpoint = '/auth/parent-signup';
      payload.studentId = extra.studentId;
    }

    const res = await api.post(endpoint, payload);
    localStorage.setItem('eduauto_token', res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('eduauto_token');
    setUser(null);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('light', next === 'light');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, theme, toggleTheme, language, setLanguage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
