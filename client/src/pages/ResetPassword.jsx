import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthAside, AuthTop, IconField } from './Login.jsx';
import { BrandMark } from '../components/Icon.jsx';
import PasswordStrength from '../components/PasswordStrength.jsx';
import { api, setToken } from '../lib/api.js';
import { passwordOk } from '../lib/password.js';
import { useAuth } from '../context/AppContext.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Whether the link is still good, checked before the form is shown:
  // null while checking, then { valid, email }.
  const [link, setLink] = useState(token ? null : { valid: false });

  useEffect(() => {
    if (!token) return;
    api
      .get(`/auth/reset-password/check?token=${encodeURIComponent(token)}`)
      .then(setLink)
      .catch(() => setLink({ valid: false }));
  }, [token]);

  const submit = async (event) => {
    event.preventDefault();
    if (!passwordOk(form.password)) {
      setError('Your new password does not meet the rules under it yet');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Those two passwords do not match');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await api.post('/auth/reset-password', { token, password: form.password });
      setToken(data.token);
      setUser(data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <AuthAside
        title="A fresh start,"
        highlight="same history."
        lead="Choose a new password and you will be signed straight back in, with every transaction where you left it. Every other device is signed out."
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
            <h1>Choose a new password</h1>
            <p>{link?.email ? `For the account ${link.email}.` : 'The link works once, for one hour.'}</p>
          </div>

          {link === null ? (
            <p className="muted small">Checking your link...</p>
          ) : !link.valid ? (
            <>
              <div className="form-error">
                {token ? 'This reset link has expired or has already been used.' : 'This page needs a reset link to work.'}
              </div>
              <Link className="btn btn-primary btn-block btn-lg" to="/forgot-password">
                Send me a new link
              </Link>
            </>
          ) : (
            <>
              {error ? <div className="form-error">{error}</div> : null}

              <IconField
                id="password"
                label="New password"
                icon="key"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />

              <IconField
                id="confirm"
                label="Confirm it"
                icon="key"
                type="password"
                required
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />
              <PasswordStrength password={form.password} confirm={form.confirm} />

              <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={busy}>
                {busy ? 'Saving' : 'Save and sign in'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
