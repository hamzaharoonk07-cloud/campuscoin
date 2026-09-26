import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon, { Wordmark } from '../components/Icon.jsx';
import { useAuth } from '../context/AppContext.jsx';

/**
 * The navy half of every sign-in page: the promise, and the real dashboard
 * the student is about to open, so they know what they are signing in to.
 */
export function AuthAside({ eyebrow = 'Student money. Clearly sorted.', title, highlight, lead }) {
  return (
    <aside className="auth-aside">
      <Link to="/" className="brand" style={{ padding: 0 }}>
        <Wordmark />
      </Link>
      <div>
        <span className="eyebrow has-rule">{eyebrow}</span>
        <h2 className="auth-title">
          {title || 'Six months from now,'}
          <em>{highlight || 'you will know where it went.'}</em>
        </h2>
        <p className="auth-lead">
          {lead ||
            'Log what comes in and what goes out. Campus Coin does the rest: the patterns, the budgets, and one honest sentence a month about what changed.'}
        </p>
      </div>
      <div className="auth-preview" aria-hidden="true">
        <img src="/shots/hero.png" alt="" />
        <div className="auth-preview-card">
          <span className="auth-preview-icon">
            <Icon name="bulb" size={17} />
          </span>
          <div>
            <strong>Tip of the day</strong>
            <span>Every tip quotes your own numbers</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

/** The strip above every sign-in form: a way home, and the other door. */
export function AuthTop({ children }) {
  return (
    <div className="auth-top">
      <Link to="/" className="auth-back">
        <Icon name="left" size={16} />
        Back to home
      </Link>
      {children}
    </div>
  );
}

/** A text input with an icon inside it, and an optional show/hide switch for passwords. */
export function IconField({ id, label, icon, type = 'text', aside, ...input }) {
  const [shown, setShown] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="field">
      <div className="field-label-row">
        <label htmlFor={id}>{label}</label>
        {aside}
      </div>
      <div className="input-icon">
        <Icon name={icon} size={17} />
        <input id={id} type={isPassword && shown ? 'text' : type} {...input} />
        {isPassword ? (
          <button
            type="button"
            className="input-toggle"
            onClick={() => setShown((was) => !was)}
            aria-label={shown ? 'Hide password' : 'Show password'}
            aria-pressed={shown}
          >
            <Icon name={shown ? 'eye-off' : 'eye'} size={17} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

// The seeded demo student, so anyone evaluating the app is one click from data.
const DEMO = { email: 'student@campuscoin.app', password: 'Student@12345' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const signIn = async (credentials) => {
    setBusy(true);
    setError('');
    try {
      await login(credentials.email, credentials.password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    signIn(form);
  };

  // Fills the form first so the student sees what is being used, then signs in.
  const signInAsDemo = () => {
    setForm(DEMO);
    signIn(DEMO);
  };

  return (
    <div className="auth">
      <AuthAside />
      <div className="auth-form-side">
        <AuthTop>
          <span className="auth-top-note">
            New here?{' '}
            <Link to="/register" className="btn btn-sm">
              Create an account
            </Link>
          </span>
        </AuthTop>

        {/* On a phone this wrapper becomes the sheet, so the fine print sits on
            it rather than stranded on the dark below a card that stops short. */}
        <div className="auth-sheet">
        <form className="auth-form" onSubmit={submit}>
          {/* The aside already carries the brand and the promise, so the card
              only has to ask for two things. */}
          <div className="auth-head">
            <h1>Sign in</h1>
          </div>

          {error ? <div className="form-error">{error}</div> : null}

          <IconField
            id="email"
            label="Email"
            icon="mail"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <IconField
            id="password"
            label="Password"
            icon="key"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            aside={
              <Link to="/forgot-password" className="field-link">
                Forgot?
              </Link>
            }
          />

          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : null}
            {busy ? 'Signing in' : 'Sign in'}
            {busy ? null : <Icon name="arrow-ne" size={16} />}
          </button>

          <button type="button" className="btn btn-block auth-demo" onClick={signInAsDemo} disabled={busy}>
            <Icon name="user" size={16} />
            Use the demo account
          </button>
        </form>

        {/* The navy panel is hidden on a phone, which leaves the sheet with a
            band of empty white and the page with no reason to sign up. These
            three carry it on small screens only. */}
        <ul className="auth-points">
          <li>
            <Icon name="shield" size={17} />
            <span>
              <strong>No bank link</strong>
              Nothing to connect, ever
            </span>
          </li>
          <li>
            <Icon name="spark" size={17} />
            <span>
              <strong>Seven saving rules</strong>
              Built from your own history
            </span>
          </li>
          <li>
            <Icon name="chart" size={17} />
            <span>
              <strong>Six months</strong>
              Side by side, from day one
            </span>
          </li>
        </ul>

        {/* Out of the card: neither is part of signing in. */}
        <p className="auth-fine">
          No bank connection, no card details, no subscription.
          <Link to="/admin/login">Administrator sign-in</Link>
        </p>
        </div>
      </div>
    </div>
  );
}
