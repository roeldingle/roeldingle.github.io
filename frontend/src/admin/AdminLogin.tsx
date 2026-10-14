import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AdminDashboard from './AdminDashboard';
import './AdminLogin.css';


export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
  let active = true;

  async function restoreSession() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) return;

      const { data, error: authorizationError } = await supabase
        .rpc('is_portfolio_admin');

      if (active && !authorizationError && data === true) {
        setIsAdmin(true);
      }
    } finally {
      if (active) setCheckingSession(false);
    }
  }

  void restoreSession();

  return () => {
    active = false;
  };
}, []);

  async function handleLogin(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data, error: authorizationError } = await supabase
        .rpc('is_portfolio_admin');

      if (authorizationError || data !== true) {
        await supabase.auth.signOut();
        setMessage('This account does not have administrator access.');
        return;
      }

      setIsAdmin(true);
      setPassword('');
    } catch {
      setMessage('Login failed. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setMessage('');
  }

  if (checkingSession) {
  return (
    <main className="admin-login-page">
      <p>Checking administrator session...</p>
    </main>
  );
}

  if (isAdmin) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleLogin}>
        <img src="/logo.png" alt="RD Logo" width="72" />

        <h1>Portfolio Admin</h1>
        <p>Sign in to manage your portfolio.</p>

        <label htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {message && <p role="alert" className="admin-error">{message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <a href="/">← Back to Portfolio</a>
      </form>
    </main>
  );
}