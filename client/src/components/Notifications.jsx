import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { artUrl } from './Illustrations.jsx';
import { api } from '../lib/api.js';

// Each kind of alert gets its own picture and a word for the filter tabs.
const KINDS = {
  'budget-exceeded': { art: 'bullseye', label: 'Budget', tone: 'is-bad' },
  'budget-warning': { art: 'bullseye', label: 'Budget', tone: 'is-warn' },
  anomaly: { art: 'magnifying-glass-tilted-left', label: 'Check', tone: 'is-warn' },
  insight: { art: 'light-bulb', label: 'Insight', tone: '' },
  announcement: { art: 'megaphone', label: 'News', tone: '' },
};

/** "Just now", "5 min ago", "3 h ago", "Yesterday", "12 Sep". */
function ago(date) {
  const mins = Math.round((Date.now() - new Date(date)) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  if (hours < 48) return 'Yesterday';
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * The bell in the top bar and its panel: budget alerts, checks on unusual
 * transactions, insights and announcements, newest first, each with its
 * picture, how long ago, and a tap that goes to the right page. Unread ones
 * carry a blue dot; they are marked read once the panel has been open a
 * moment. Refreshes every minute.
 */
export default function Notifications() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [state, setState] = useState({ notifications: [], unread: 0 });
  const [ring, setRing] = useState(false);
  const holder = useRef(null);
  const lastUnread = useRef(0);

  const load = useCallback(() => {
    api
      .get('/notifications')
      .then((data) => {
        // A gentle ring when something new arrives while the page is open.
        if (data.unread > lastUnread.current) {
          setRing(true);
          setTimeout(() => setRing(false), 1200);
        }
        lastUnread.current = data.unread;
        setState(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  // Clicking outside or pressing Escape closes the panel.
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!holder.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Open for a moment, then everything shown counts as read. The dots stay
  // until the panel closes, so the student can still see what was new.
  useEffect(() => {
    if (!open || state.unread === 0) return undefined;
    const timer = setTimeout(() => {
      api.post('/notifications/read', {}).catch(() => {});
      lastUnread.current = 0;
      setState((s) => ({ ...s, unread: 0 }));
    }, 1500);
    return () => clearTimeout(timer);
  }, [open, state.unread]);

  useEffect(() => {
    if (!open) setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
  }, [open]);

  const go = (note) => {
    setOpen(false);
    if (note.link) navigate(note.link);
  };

  const remove = async (event, note) => {
    event.stopPropagation();
    setState((s) => ({ ...s, notifications: s.notifications.filter((n) => n._id !== note._id) }));
    await api.del(`/notifications/${note._id}`).catch(() => {});
  };

  const clearAll = async () => {
    setState({ notifications: [], unread: 0 });
    await api.del('/notifications').catch(() => {});
  };

  const list = state.notifications.filter((n) => filter === 'all' || (filter === 'unread' ? !n.read : KINDS[n.kind]?.label === filter));
  const filters = ['all', 'unread', ...new Set(state.notifications.map((n) => KINDS[n.kind]?.label).filter(Boolean))];

  return (
    <div className="has-menu" ref={holder}>
      <button
        type="button"
        className={`icon-btn nt-bell${ring ? ' is-ringing' : ''}`}
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-label={state.unread ? `Notifications, ${state.unread} unread` : 'Notifications'}
      >
        <Icon name="bell" />
        {state.unread > 0 && <span className="badge-count">{state.unread > 9 ? '9+' : state.unread}</span>}
      </button>

      {open ? (
        <div className="nt-panel" role="dialog" aria-label="Notifications">
          <div className="nt-head">
            <strong>Notifications</strong>
            {state.notifications.length ? (
              <button type="button" className="nt-clear" onClick={clearAll}>
                Clear all
              </button>
            ) : null}
          </div>
          {state.notifications.length ? (
            <div className="nt-filters" role="tablist">
              {filters.map((f) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} className={filter === f ? 'is-on' : ''} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f}
                </button>
              ))}
            </div>
          ) : null}

          {list.length === 0 ? (
            <div className="nt-empty">
              <img src={artUrl('bell')} alt="" width="54" height="54" />
              <strong>{state.notifications.length ? 'Nothing here' : 'You are all caught up'}</strong>
              <span>Budget warnings, unusual transactions and news from Campus Coin show up here.</span>
            </div>
          ) : (
            <ul className="nt-list">
              {list.map((note) => {
                const kind = KINDS[note.kind] || KINDS.announcement;
                return (
                  <li key={note._id}>
                    <button type="button" className={`nt-item${note.read ? '' : ' is-unread'}`} onClick={() => go(note)}>
                      <span className={`nt-art ${kind.tone}`}>
                        <img src={artUrl(kind.art)} alt="" width="24" height="24" />
                      </span>
                      <span className="nt-copy">
                        <span className="nt-top">
                          <strong>{note.title}</strong>
                          <small>{ago(note.createdAt)}</small>
                        </span>
                        {note.body ? <span className="nt-body">{note.body}</span> : null}
                        {note.link ? (
                          <span className="nt-go">
                            {note.link.startsWith('/budgets') ? 'Open budgets' : note.link.startsWith('/transactions') ? 'Review it' : 'Open'}
                            <Icon name="right" size={13} />
                          </span>
                        ) : null}
                      </span>
                      <span className="nt-x" role="button" tabIndex={0} aria-label="Dismiss" onClick={(e) => remove(e, note)} onKeyDown={(e) => e.key === 'Enter' && remove(e, note)}>
                        <Icon name="x" size={14} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
