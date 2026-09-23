import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthAside } from './Login.jsx';
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
      <AuthAside />
      <div className="auth-form-side">
        <form className="auth-form" onSubmit={submit}>
          <h1>Choose a new password</h1>

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

              <div className="field">
                <label htmlFor="password">New password</label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="confirm">Confirm it</label>
                <input
                  id="confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                />
              </div>

              <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
                {busy ? 'Saving' : 'Save and sign in'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
