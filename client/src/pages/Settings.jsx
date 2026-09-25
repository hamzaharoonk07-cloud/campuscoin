import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import Avatar from '../components/Avatar.jsx';
import { squarePhoto } from '../lib/images.js';
import { api } from '../lib/api.js';
import { CURRENCY_SYMBOLS } from '../lib/format.js';
import { useAuth, useTheme, useToast } from '../context/AppContext.jsx';

const YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Masters', 'PhD'];
const SCALES = [
  { value: 0.875, label: 'Small' },
  { value: 1, label: 'Default' },
  { value: 1.125, label: 'Large' },
  { value: 1.375, label: 'Largest' },
];

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme, fontScale, setFontScale } = useTheme();
  const toast = useToast();

  const [profile, setProfile] = useState({
    name: user.name,
    academicYear: user.academicYear || '',
    institution: user.institution || '',
    monthlyAllowance: user.monthlyAllowance || 0,
    savingsGoal: user.savingsGoal || 0,
    currency: user.currency,
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => setProfile({ ...profile, [key]: event.target.value });

  // Profile photo: cropped square and shrunk to about 20 KB in the browser
  // (lib/images.js), then saved straight away - no separate save button.
  const photoInput = useRef(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const applyPhoto = async (file) => {
    if (!file) return;
    setPhotoBusy(true);
    try {
      await updateProfile({ avatar: await squarePhoto(file) });
      toast.success('Photo updated', 'It now shows in the sidebar and the chat.');
    } catch (err) {
      toast.error('Could not use that picture', err.message);
    } finally {
      setPhotoBusy(false);
      if (photoInput.current) photoInput.current.value = '';
    }
  };

  const removePhoto = async () => {
    try {
      await updateProfile({ avatar: null });
      toast.success('Photo removed');
    } catch (err) {
      toast.error('Could not remove it', err.message);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await updateProfile({
        ...profile,
        monthlyAllowance: Number(profile.monthlyAllowance) || 0,
        savingsGoal: Number(profile.savingsGoal) || 0,
      });
      toast.success('Profile saved');
    } catch (err) {
      toast.error('Could not save your profile', err.message);
    } finally {
      setBusy(false);
    }
  };

  // Accessibility choices are saved to the account too, so they follow the
  // student to a different device rather than living only in this browser.
  const savePreferences = async (next) => {
    try {
      await updateProfile({ preferences: { ...user.preferences, ...next } });
    } catch {
      /* the local change already applied; the server copy can wait */
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    try {
      const { message } = await api.post('/auth/change-password', passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      toast.success(message);
    } catch (err) {
      toast.error('Could not change your password', err.message);
    }
  };

  return (
    <Layout
      title="Settings"
      crumbs={
        <>
          <Link to="/dashboard">Dashboard</Link> / <span>Settings</span>
        </>
      }
    >
      <div className="grid grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Your profile</h2>
          </div>
          <div className="panel-body">
            <div
              className={`photo-picker${dragging ? ' is-dragging' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                applyPhoto(e.dataTransfer.files[0]);
              }}
            >
              <button
                type="button"
                className="photo-face"
                onClick={() => photoInput.current?.click()}
                aria-label="Choose a profile photo"
                disabled={photoBusy}
              >
                <Avatar user={user} size={92} />
                <span className="photo-badge">{photoBusy ? <span className="spinner" /> : <Icon name="upload" size={15} />}</span>
              </button>
              <div className="photo-copy">
                <strong>Profile photo</strong>
                <p className="small muted">
                  Click the picture or drop one on it. It is cropped to a square and shrunk before it is uploaded.
                </p>
                <div className="row">
                  <button type="button" className="btn btn-sm" onClick={() => photoInput.current?.click()} disabled={photoBusy}>
                    <Icon name="upload" size={14} />
                    {user.avatar ? 'Change photo' : 'Upload photo'}
                  </button>
                  {user.avatar ? (
                    <button type="button" className="btn btn-sm btn-ghost" onClick={removePhoto} disabled={photoBusy}>
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
              <input
                ref={photoInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => applyPhoto(e.target.files[0])}
              />
            </div>

            <form className="stack" onSubmit={saveProfile}>
              <div className="field">
                <label htmlFor="name">Name</label>
                <input id="name" required value={profile.name} onChange={set('name')} />
              </div>

              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" value={user.email} disabled />
                <span className="small muted">Your email is how you sign in and cannot be changed here.</span>
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="year">Year of study</label>
                  <select id="year" value={profile.academicYear} onChange={set('academicYear')}>
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
                  <select id="currency" value={profile.currency} onChange={set('currency')}>
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
                <input id="institution" value={profile.institution} onChange={set('institution')} />
              </div>

              <div className="field-row">
                <div className="field">
                  <label htmlFor="allowance">Monthly allowance</label>
                  <input id="allowance" type="number" min="0" value={profile.monthlyAllowance} onChange={set('monthlyAllowance')} />
                </div>
                <div className="field">
                  <label htmlFor="goal">Monthly savings goal</label>
                  <input id="goal" type="number" min="0" value={profile.savingsGoal} onChange={set('savingsGoal')} />
                </div>
              </div>
              <span className="small muted">
                Your savings goal is what the tips measure against, so it is worth setting honestly.
              </span>

              <button type="submit" className="btn btn-primary" disabled={busy}>
                Save profile
              </button>
            </form>
          </div>
        </section>

        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <h2>Reading and display</h2>
            </div>
            <div className="panel-body stack">
              <div className="field">
                <label>Theme</label>
                <div className="seg" role="group" aria-label="Theme">
                  {['light', 'dark', 'system'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={theme === option}
                      onClick={() => {
                        setTheme(option);
                        savePreferences({ theme: option });
                      }}
                    >
                      {option === 'system' ? 'Match device' : option === 'light' ? 'Light' : 'Dark'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Text size</label>
                <div className="seg" role="group" aria-label="Text size">
                  {SCALES.map((scale) => (
                    <button
                      key={scale.value}
                      type="button"
                      aria-pressed={fontScale === scale.value}
                      onClick={() => {
                        setFontScale(scale.value);
                        savePreferences({ fontScale: scale.value });
                      }}
                    >
                      {scale.label}
                    </button>
                  ))}
                </div>
                <span className="small muted">Everything on the page scales together, including the charts.</span>
              </div>

              <label className="check">
                <input
                  type="checkbox"
                  checked={user.preferences?.alertsEnabled !== false}
                  onChange={(e) => savePreferences({ alertsEnabled: e.target.checked })}
                />
                Tell me when a budget is close or broken
              </label>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Password</h2>
            </div>
            <div className="panel-body">
              <form className="stack" onSubmit={changePassword}>
                <div className="field">
                  <label htmlFor="current">Current password</label>
                  <input
                    id="current"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="new">New password</label>
                  <input
                    id="new"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn">
                  <Icon name="key" size={15} />
                  Change password
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
