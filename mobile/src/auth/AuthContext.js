import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loginRequest, fetchProfileRequest } from '../lib/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginRequest(email, password);
      setToken(data.access_token);
      setProfile(null);
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Login failed';
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
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Could not load profile';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const logout = useCallback(() => {
    setToken(null);
    setProfile(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (token && !profile) {
      fetchProfile();
    }
  }, [token, profile, fetchProfile]);

  const value = useMemo(
    () => ({ token, profile, loading, error, login, logout, fetchProfile, setError }),
    [token, profile, loading, error, login, logout, fetchProfile, setError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
