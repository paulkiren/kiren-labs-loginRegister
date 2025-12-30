import axios from 'axios';
import { Platform } from 'react-native';

// Emulator-friendly defaults; override via editing or env-injection if desired.
const DEFAULT_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
export const API_URL = DEFAULT_API_URL;

export const api = axios.create({ baseURL: API_URL, timeout: 10000 });

export type LoginResponse = { access_token: string };
export type UserProfile = { id: number; email: string; username: string };

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function fetchProfileRequest(token: string): Promise<UserProfile> {
  const res = await api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}
