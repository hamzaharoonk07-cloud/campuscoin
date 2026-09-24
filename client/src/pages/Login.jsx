import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/Icon.jsx';
import { useAuth } from '../context/AppContext.jsx';

/** The navy half of every sign-in page: the promise, and a glimpse of the tiles. */
export function AuthAside() {
  return (
    <aside className="auth-aside">
      <Link to="/" className="brand" style={{ padding: 0 }}>
        <BrandMark />
        Campus Coin
      </Link>
      <div>
        <span className="eyebrow has-rule">Student money. Clearly sorted.</span>
        <h2 className="auth-title">
          Six months from now,
          <em>you will know where it went.</em>
        </h2>
        <p className="auth-lead">
          Log what comes in and what goes out. Campus Coin does the rest: the patterns, the budgets, and one honest
          sentence a month about what changed.
        </p>
      </div>
      {/* Labels only, no invented figures: this panel is seen before sign-in. */}
      <div className="money-tiles auth-tiles" aria-hidden="true">
        <span className="money-tile is-in">
          <span className="money-tile-label">Money in</span>
        </span>
        <span className="money-tile is-out">
          <span className="money-tile-label">Money out</span>
        </span>
        <span className="money-tile is-budget">
          <span className="money-tile-label">Budgets</span>
        </span>
        <span className="money-tile is-goal">
          <span className="money-tile-label">Savings</span>
        </span>
      </div>
      <p className="auth-foot">No bank connection, no card details, no subscription.</p>
    </aside>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <AuthAside />
      <div className="auth-form-side">
        <form className="auth-form" onSubmit={submit}>
          <h1>Sign in</h1>
          {error ? <div className="form-error">{error}</div> : null}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : null}
            {busy ? 'Signing in' : 'Sign in'}
          </button>

          <p className="auth-alt">
            <Link to="/forgot-password">Forgot your password?</Link>
          </p>
          <p className="auth-alt">
            New here? <Link to="/register">Create an account</Link>
          </p>
          <p className="auth-alt small">
            Trying the demo? student@campuscoin.app / Student@12345
          </p>
        </form>
      </div>
    </div>
  );
}
