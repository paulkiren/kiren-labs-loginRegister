import { useAuth } from '../auth/AuthContext';

export function ProfileCard() {
  const { profile, fetchProfile, loading, error } = useAuth();

  return (
    <section className="card">
      <div className="card-header">
        <h2>Profile</h2>
        <button onClick={() => fetchProfile()} disabled={loading}>
          {loading ? 'Loading…' : profile ? 'Refresh' : 'Load profile'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {profile ? (
        <div className="profile">
          <div>
            <strong>ID:</strong> {profile.id}
          </div>
          <div>
            <strong>Email:</strong> {profile.email}
          </div>
          <div>
            <strong>Username:</strong> {profile.username}
          </div>
        </div>
      ) : (
        <p className="muted">No profile loaded yet.</p>
      )}
    </section>
  );
}
