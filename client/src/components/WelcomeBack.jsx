import { useEffect, useState } from 'react';
import Avatar from './Avatar.jsx';
import { artUrl } from './Illustrations.jsx';
import { useAuth } from '../context/AppContext.jsx';

/** "3 hours ago", "2 days ago" - how long since the last sign-in. */
function since(date) {
  if (!date) return null;
  const minutes = Math.round((Date.now() - new Date(date)) / 60000);
  if (minutes < 2) return null;
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return 'over a month ago';
}

/**
 * A short welcome right after signing in or registering: the student's photo,
 * a waving hand (a party face for a new account), and when they were last
 * here. It reads the note left by AuthProvider once, shows for a few seconds,
 * then fades - or goes at once when clicked.
 */
export default function WelcomeBack() {
  const { user } = useAuth();
  const [note, setNote] = useState(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let saved = null;
    try {
      saved = JSON.parse(sessionStorage.getItem('campuscoin.welcome') || 'null');
    } catch {
      /* nothing to show */
    }
    if (!saved) return undefined;
    setNote(saved);
    // The note is cleared when the message goes, not when it is read, so a
    // second run of this effect (React's development check) shows it too.
    const fade = setTimeout(() => setLeaving(true), 4200);
    const gone = setTimeout(() => dismiss(), 4700);
    return () => {
      clearTimeout(fade);
      clearTimeout(gone);
    };
  }, []);

  function dismiss() {
    try {
      sessionStorage.removeItem('campuscoin.welcome');
    } catch {
      /* already gone */
    }
    setNote(null);
  }

  if (!note || !user) return null;
  const first = user.name?.split(' ')[0] || 'there';
  const isNew = note.kind === 'new';
  const last = since(note.since);

  return (
    <button
      type="button"
      className={`welcome-back${leaving ? ' is-leaving' : ''}`}
      onClick={() => {
        setLeaving(true);
        setTimeout(dismiss, 300);
      }}
      role="status"
      aria-live="polite"
    >
      <span className="welcome-back-face">
        <Avatar user={user} size={46} />
        <img className="welcome-back-wave" src={artUrl(isNew ? 'partying-face' : 'waving-hand')} alt="" width="26" height="26" />
      </span>
      <span className="welcome-back-copy">
        <strong>{isNew ? `Welcome to Campus Coin, ${first}!` : `Welcome back, ${first}!`}</strong>
        <small>
          {isNew
            ? 'Start by logging this month’s allowance.'
            : last
              ? `Last here ${last}. Here is your month so far.`
              : 'Here is your month so far.'}
        </small>
      </span>
    </button>
  );
}
