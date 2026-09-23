import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthAside } from './Login.jsx';
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
      <AuthAside />
      <div className="auth-form-side">
        <form className="auth-form" onSubmit={submit}>
          <h1>Reset your password</h1>
          <p className="muted small">
            Enter the email on your account and we will send a link that works for one hour.
          </p>

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

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : null}
            {busy ? 'Sending' : 'Send reset link'}
          </button>

          <p className="auth-alt">
            <Link to="/login">Back to sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
