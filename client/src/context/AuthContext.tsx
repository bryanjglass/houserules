import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
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

  // Register for push notifications on native (Android) when a user is authenticated.
  // Skipped entirely on web — Capacitor.isNativePlatform() is false in a browser.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user) return;

    let active = true;

    PushNotifications.requestPermissions().then((result) => {
      if (!active || result.receive !== 'granted') return;

      PushNotifications.addListener('registration', (token) => {
        api.post('/notifications/register', { token: token.value, platform: 'android' })
          .catch((err) => console.error('[push] token registration failed:', err));
      });

      PushNotifications.addListener('registrationError', (err) => {
        console.error('[push] registration error:', err);
      });

      PushNotifications.register();
    });

    return () => {
      active = false;
      PushNotifications.removeAllListeners();
    };
  }, [user?.id]);

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
