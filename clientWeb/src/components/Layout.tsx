import type { ReactNode } from 'react';
import { API_URL } from '../lib/api';
import { useAuth } from '../auth/AuthContext';

export function Layout({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth();
  const isLoggedIn = Boolean(token);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <div className="eyebrow">Auth demo</div>
          <h1>Login & Profile</h1>
          <p className="subtitle">Uses Nest auth API at {API_URL}</p>
        </div>
        {isLoggedIn && (
          <button className="ghost" onClick={logout}>
            Log out
          </button>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}
