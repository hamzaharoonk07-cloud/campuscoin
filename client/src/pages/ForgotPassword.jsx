import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthAside, AuthTop, IconField } from './Login.jsx';
import { BrandMark } from '../components/Icon.jsx';
import { api } from '../lib/api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      setResult(await api.post('/auth/forgot-password', { email }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <AuthAside
        title="Locked out?"
        highlight="It happens to everyone."
        lead="Enter the email on your account and Campus Coin sends a link that lets you choose a new password. Your transactions stay exactly where they were."
      />
      <div className="auth-form-side">
        <AuthTop>
          <Link to="/login" className="btn btn-sm">
            Back to sign in
          </Link>
        </AuthTop>
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-head">
            <span className="auth-mark">
              <BrandMark size={36} />
            </span>
            <span className="eyebrow">Password reset</span>
            <h1>Reset your password</h1>
            <p>We will send a link that works for one hour.</p>
          </div>

          {error ? <div className="form-error">{error}</div> : null}
          {result ? <div className="form-ok">{result.message}</div> : null}

          {/* Without SMTP configured the server hands the link back instead of
              pretending to send it, so the flow can still be demonstrated. */}
          {result?.devResetLink ? (
            <div className="panel" style={{ padding: '0.85rem' }}>
              <p className="small muted">{result.note}</p>
              <Link className="btn btn-sm btn-primary" to={result.devResetLink.replace(/^.*?\/\/[^/]+/, '')}>
                Open the reset link
              </Link>
            </div>
          ) : null}

          <IconField
            id="email"
            label="Email"
            icon="mail"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : null}
            {busy ? 'Sending' : 'Send reset link'}
          </button>

          <p className="auth-alt">
            Remembered it? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
