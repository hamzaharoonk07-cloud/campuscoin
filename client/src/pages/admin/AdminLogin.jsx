import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon, { BrandMark } from '../../components/Icon.jsx';
import { useAuth } from '../../context/AppContext.jsx';
import { AuthAside, AuthTop, IconField } from '../Login.jsx';

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
      <AuthAside
        eyebrow="Administrator"
        title="The control panel,"
        highlight="for administrators only."
        lead="Default categories, student accounts, announcements and system-wide usage. This sign-in refuses any account that is not an administrator."
      />

      <div className="auth-form-side">
        <AuthTop>
          <Link to="/login" className="btn btn-sm">
            Student sign-in
          </Link>
        </AuthTop>
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-head">
            <span className="auth-mark">
              <BrandMark size={36} />
            </span>
            <span className="eyebrow">
              <Icon name="shield" size={13} /> Administrator
            </span>
            <h1>Sign in to the control panel</h1>
          </div>
          {error ? <div className="form-error">{error}</div> : null}

          <IconField
            id="email"
            label="Email"
            icon="mail"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <IconField
            id="password"
            label="Password"
            icon="key"
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : null}
            Sign in
          </button>

          <p className="auth-alt">Demo administrator: admin@campuscoin.app / Admin@12345</p>
        </form>
      </div>
    </div>
  );
}
