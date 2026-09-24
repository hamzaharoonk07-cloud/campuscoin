import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthAside, AuthTop, IconField } from './Login.jsx';
import { BrandMark } from '../components/Icon.jsx';
import { api, setToken } from '../lib/api.js';
import { useAuth } from '../context/AppContext.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
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
        lead="Choose a new password and you will be signed straight back in, with every transaction where you left it."
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
            <p>At least 8 characters.</p>
          </div>

          {!token ? (
            <>
              <div className="form-error">This page needs a reset link to work.</div>
              <Link className="btn btn-block" to="/forgot-password">
                Request a new link
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
                minLength={8}
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />

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
