import axios from 'axios';
import { Platform } from 'react-native';

// Default base URL: emulator-friendly. Override by editing here or injecting env in Metro.
const DEFAULT_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
export const API_URL = DEFAULT_API_URL;

export const api = axios.create({ baseURL: API_URL, timeout: 10000 });

export async function loginRequest(email, password) {
  const res = await api.post('/auth/login', { email, password });
  return res.data; // { access_token }
}

export async function fetchProfileRequest(token) {
  const res = await api.get('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // profile
}
