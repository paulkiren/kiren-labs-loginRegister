import { useEffect, useMemo, useState } from 'react';
import './App.css';

type LoginResponse = { access_token: string };
type UserProfile = { id: number; email: string; username: string };

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = useMemo(() => Boolean(token), [token]);

  useEffect(() => {
    if (!token) return;
    localStorage.setItem('token', token);
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Login failed');
      }
      const data = (await res.json()) as LoginResponse;
      setToken(data.access_token);
      setProfile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchProfile = async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Could not load profile');
      }
      const data = (await res.json()) as UserProfile;
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setProfile(null);
    localStorage.removeItem('token');
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <div className="eyebrow">Auth demo</div>
          <h1>Login & Profile</h1>
          <p className="subtitle">Uses Nest auth API at {API_URL}</p>
        </div>
        {isLoggedIn && (
          <button className="ghost" onClick={handleLogout}>
            Log out
          </button>
        )}
      </header>

      {!isLoggedIn && (
        <section className="card">
          <h2>Sign in</h2>
          <form className="form" onSubmit={handleLogin}>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          {error && <div className="error">{error}</div>}
        </section>
      )}

      {isLoggedIn && (
        <section className="card">
          <div className="card-header">
            <h2>Profile</h2>
            <button onClick={handleFetchProfile} disabled={loading}>
              {loading ? 'Loading…' : profile ? 'Refresh' : 'Load profile'}
            </button>
          </div>
          {error && <div className="error">{error}</div>}
          {profile ? (
            <div className="profile">
              <div><strong>ID:</strong> {profile.id}</div>
              <div><strong>Email:</strong> {profile.email}</div>
              <div><strong>Username:</strong> {profile.username}</div>
            </div>
          ) : (
            <p className="muted">No profile loaded yet.</p>
          )}
        </section>
      )}
    </div>
  );
}

export default App;
