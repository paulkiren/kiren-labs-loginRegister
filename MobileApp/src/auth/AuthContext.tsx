import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchProfileRequest, loginRequest, type UserProfile } from '../lib/api';

const TOKEN_KEY = 'auth_token';

type AuthContextValue = {
  token: string | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // hydrate token on mount
  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then(stored => {
      if (stored) setToken(stored);
    });
  }, []);

  // persist token changes
  useEffect(() => {
    if (token) AsyncStorage.setItem(TOKEN_KEY, token);
    else AsyncStorage.removeItem(TOKEN_KEY);
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginRequest(email, password);
      setToken(data.access_token);
      setProfile(null);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Login failed';
      setError(Array.isArray(message) ? message.join(', ') : message);
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
      const data = await fetchProfileRequest(token);
      setProfile(data);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Could not load profile';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const logout = useCallback(async () => {
    setToken(null);
    setProfile(null);
    setError(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (token && !profile) {
      fetchProfile();
    }
  }, [token, profile, fetchProfile]);

  const value = useMemo(
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
