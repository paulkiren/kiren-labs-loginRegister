import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import type { ReactNode } from 'react';

export type UserProfile = { id: number; email: string; username: string };
type LoginResponse = { access_token: string };

type AuthContextValue = {
  token: string | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = 'token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.access_token);
      setProfile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<UserProfile>('/users/me', { method: 'GET' }, token);
      setProfile(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load profile';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const logout = useCallback(() => {
    setToken(null);
    setProfile(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (token && !profile) {
      fetchProfile().catch(() => {
        // error already handled in fetchProfile
      });
    }
  }, [token, profile, fetchProfile]);

  const value: AuthContextValue = useMemo(
    () => ({ token, profile, loading, error, login, logout, fetchProfile, clearError }),
    [token, profile, loading, error, login, logout, fetchProfile, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
