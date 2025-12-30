import { AuthProvider, useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { LoginForm } from './components/LoginForm';
import { ProfileCard } from './components/ProfileCard';
import './App.css';

function AppContent() {
  const { token } = useAuth();
  const isLoggedIn = Boolean(token);

  return (
    <Layout>
      {isLoggedIn ? <ProfileCard /> : <LoginForm />}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
