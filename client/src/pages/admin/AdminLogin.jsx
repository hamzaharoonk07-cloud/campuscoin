import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon, { BrandMark } from '../../components/Icon.jsx';
import { useAuth } from '../../context/AppContext.jsx';

/**
 * A separate, direct-access administrator sign-in, as the SRS asks for. It posts
 * to its own endpoint, which refuses any account that is not an administrator -
 * so a student password is useless here even with the URL.
 */
export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form.email, form.password, { admin: true });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth-aside">
        <Link to="/" className="brand" style={{ padding: 0 }}>
          <BrandMark />
          Campus Coin
        </Link>
        <div>
          <span className="pill is-accent">
            <Icon name="shield" size={13} />
            Administrator
          </span>
          <h2 style={{ fontSize: 'var(--step-2)', margin: '0.75rem 0' }}>Control panel</h2>
          <p className="muted" style={{ maxWidth: '38ch' }}>
            Default categories, student accounts, announcements and system-wide usage. This sign-in only accepts
            administrator accounts.
          </p>
        </div>
      </aside>

      <div className="auth-form-side">
        <form className="auth-form" onSubmit={submit}>
          <h1>Administrator sign-in</h1>
          {error ? <div className="form-error">{error}</div> : null}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : null}
            Sign in
          </button>

          <p className="auth-alt">
            <Link to="/login">Student sign-in instead</Link>
          </p>
          <p className="auth-alt small">Demo: admin@campuscoin.app / Admin@12345</p>
        </form>
      </div>
    </div>
  );
}
