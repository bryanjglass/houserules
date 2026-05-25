import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api, { setUnauthorizedHandler } from '../api/client';
import type { AuthUser } from '../types/domain';

export interface Credentials {
  email?: string;
  password?: string;
  householdCode?: string;
  childId?: string;
  pin?: string;
  rememberDevice?: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  // undefined = loading, null = logged out, AuthUser = logged in
  user: AuthUser | null | undefined;
  login: (credentials: Credentials) => Promise<AuthUser>;
  deviceLogin: (childId: string) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    // Any 401 (expired/invalid session) drops us back to logged-out state.
    setUnauthorizedHandler(() => setUser(null));
    api.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => setUser(null));
  }, []);

  const login = async (credentials: Credentials) => {
    const r = await api.post('/auth/login', credentials);
    setUser(r.data);
    return r.data as AuthUser;
  };

  const deviceLogin = async (childId: string) => {
    const r = await api.post('/auth/device-login', { childId });
    setUser(r.data);
    return r.data as AuthUser;
  };

  const register = async (data: RegisterData) => {
    const r = await api.post('/auth/register', data);
    setUser(r.data);
    return r.data as AuthUser;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, deviceLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
