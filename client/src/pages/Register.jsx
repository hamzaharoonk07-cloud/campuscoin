import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthAside } from './Login.jsx';
import { CURRENCY_SYMBOLS } from '../lib/format.js';
import { useAuth } from '../context/AppContext.jsx';

const YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Masters', 'PhD'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    academicYear: '',
    institution: '',
    monthlyAllowance: '',
    savingsGoal: '',
    currency: 'PKR',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register({
        ...form,
        monthlyAllowance: Number(form.monthlyAllowance) || 0,
        savingsGoal: Number(form.savingsGoal) || 0,
      });
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
          <h1>Create your account</h1>
          {error ? <div className="form-error">{error}</div> : null}

          <div className="field">
            <label htmlFor="name">Your name</label>
            <input id="name" required value={form.name} onChange={set('name')} autoComplete="name" />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
            />
            <span className="small muted">At least 8 characters.</span>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="year">Year of study</label>
              <select id="year" value={form.academicYear} onChange={set('academicYear')}>
                <option value="">Prefer not to say</option>
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="currency">Currency</label>
              <select id="currency" value={form.currency} onChange={set('currency')}>
                {Object.keys(CURRENCY_SYMBOLS).map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="institution">College or university</label>
            <input id="institution" value={form.institution} onChange={set('institution')} />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="allowance">Monthly allowance</label>
              <input id="allowance" type="number" min="0" value={form.monthlyAllowance} onChange={set('monthlyAllowance')} />
            </div>
            <div className="field">
              <label htmlFor="goal">Monthly savings goal</label>
              <input id="goal" type="number" min="0" value={form.savingsGoal} onChange={set('savingsGoal')} />
            </div>
          </div>
          <span className="small muted">
            Both are optional and easy to change later. They only shape the advice you get.
          </span>

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" /> : null}
            {busy ? 'Creating' : 'Create account'}
          </button>

          <p className="auth-alt">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
