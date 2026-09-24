import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import Icon, { BrandMark } from './Icon.jsx';
import Chat from './Chat.jsx';
import { api } from '../lib/api.js';
import { useAuth, useTheme } from '../context/AppContext.jsx';

const STUDENT_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'home' },
  { to: '/transactions', label: 'Transactions', icon: 'ledger' },
  { to: '/budgets', label: 'Budgets', icon: 'target' },
  { to: '/reports', label: 'Reports', icon: 'chart' },
  { to: '/insights', label: 'Insights', icon: 'spark' },
  { to: '/tips', label: 'Saving tips', icon: 'bulb' },
  { to: '/categories', label: 'Categories', icon: 'tag' },
];

const SECONDARY_NAV = [
  { to: '/assistant', label: 'AI assistant', icon: 'chat' },
  { to: '/settings', label: 'Settings', icon: 'user' },
  { to: '/sitemap', label: 'Sitemap', icon: 'map' },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: 'chart' },
  { to: '/admin/students', label: 'Students', icon: 'user' },
  { to: '/admin/categories', label: 'Default categories', icon: 'tag' },
  { to: '/admin/announcements', label: 'Announcements', icon: 'bell' },
];

/** The five destinations that earn a place in the phone tab bar. */
const TAB_NAV = STUDENT_NAV.slice(0, 5);

function Bell() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ notifications: [], unread: 0 });
  const holder = useRef(null);

  const load = useCallback(() => {
    api
      .get('/notifications')
      .then(setState)
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, [load]);

  // Clicking anywhere else closes the panel.
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!holder.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const openPanel = async () => {
    setOpen((was) => !was);
    if (!open && state.unread > 0) {
      await api.post('/notifications/read', {}).catch(() => {});
      setState((current) => ({ ...current, unread: 0 }));
    }
  };

  return (
    <div className="has-menu" ref={holder}>
      <button
        type="button"
        className="icon-btn"
        onClick={openPanel}
        aria-expanded={open}
        aria-label={state.unread ? `Alerts, ${state.unread} unread` : 'Alerts'}
      >
        <Icon name="bell" />
        {state.unread > 0 && <span className="badge-count">{state.unread > 9 ? '9+' : state.unread}</span>}
      </button>

      {open && (
        <div className="menu">
          {state.notifications.length === 0 ? (
            <div className="menu-item">
              <strong>Nothing to report</strong>
              <span>Budget warnings and unusual transactions will show up here.</span>
            </div>
          ) : (
            state.notifications.slice(0, 8).map((note) => (
              <div key={note._id} className={`menu-item${note.read ? '' : ' is-unread'}`}>
                <strong>{note.title}</strong>
                <span>{note.body}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ThemeButton() {
  const { theme, toggle } = useTheme();
  const { updateProfile } = useAuth();
  const showing = theme === 'system' ? 'matching your device' : theme;

  // The choice is saved to the account as well as this device, so it carries
  // over to a phone or a lab machine without being set again.
  const flip = async () => {
    const next = toggle();
    try {
      await updateProfile({ preferences: { theme: next } });
    } catch {
      /* the theme already changed locally; the saved copy can wait */
    }
  };

  return (
    <button type="button" className="icon-btn" onClick={flip} aria-label={`Switch theme (currently ${showing})`} title={`Theme: ${showing}`}>
      <Icon name={theme === 'light' ? 'moon' : 'sun'} />
    </button>
  );
}

/**
 * The chat bubble in the corner of every student page - the SRS's "AI ChatBot",
 * built in rather than embedded from tawk.to or Tidio so it can answer from the
 * student's own data. The /assistant page already shows the chat, so the bubble
 * stays away from there.
 */
function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (location.pathname === '/assistant') return null;

  return (
    <>
      {open && (
        <div className="chat-popover" role="dialog" aria-label="Campus Coin assistant">
          <div className="chat-popover-head">
            <span className="chat-avatar" aria-hidden="true">
              <Icon name="spark" size={16} />
            </span>
            <div style={{ marginRight: 'auto' }}>
              <strong>Campus Coin assistant</strong>
              <span>Answers from your own transactions</span>
            </div>
            <Link to="/assistant" className="icon-btn" aria-label="Open the full assistant page" title="Open full page">
              <Icon name="right" size={16} />
            </Link>
            <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close the assistant">
              <Icon name="x" size={16} />
            </button>
          </div>
          <Chat compact />
        </div>
      )}
      <button
        type="button"
        className="chat-fab"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-label={open ? 'Close the assistant' : 'Ask the assistant'}
      >
        <Icon name={open ? 'x' : 'chat'} size={22} />
      </button>
    </>
  );
}

export default function Layout({ title, crumbs, actions, children }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = isAdmin ? ADMIN_NAV : STUDENT_NAV;

  const signOut = () => {
    logout();
    navigate(isAdmin ? '/admin/login' : '/login');
  };

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <nav className="rail" aria-label="Main">
        <Link to={isAdmin ? '/admin' : '/dashboard'} className="brand">
          <BrandMark />
          Campus Coin
        </Link>

        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/admin'}>
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}

        {!isAdmin && (
          <>
            <div className="rail-group">More</div>
            {SECONDARY_NAV.map((item) => (
              <NavLink key={item.to} to={item.to}>
                <Icon name={item.icon} />
                {item.label}
              </NavLink>
            ))}
          </>
        )}

        <div className="rail-spacer" />

        <div className="rail-footer">
          <div className="row" style={{ padding: '0.35rem 0.7rem 0.6rem' }}>
            <span
              aria-hidden="true"
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background: user?.avatarColor || 'var(--accent)',
                color: 'var(--on-accent)',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontSize: 13,
                flex: 'none',
              }}
            >
              {user?.name?.[0]?.toUpperCase() || '?'}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--step--1)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div className="muted" style={{ fontSize: '0.75rem' }}>
                {isAdmin ? 'Administrator' : user?.academicYear || 'Student'}
              </div>
            </div>
          </div>
          <button type="button" className="rail-item" onClick={signOut}>
            <Icon name="logout" />
            Sign out
          </button>
        </div>
      </nav>

      <div className="main">
        <header className="topbar">
          <div style={{ marginRight: 'auto', minWidth: 0 }}>
            {crumbs ? <div className="crumbs">{crumbs}</div> : null}
            <h1>{title}</h1>
          </div>
          {actions}
          {!isAdmin && <Bell />}
          <ThemeButton />
        </header>

        <main id="main" className="page">
          {children}
        </main>
      </div>

      {!isAdmin && <ChatLauncher />}

      {!isAdmin && (
        <nav className="tabbar" aria-label="Sections">
          {TAB_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={location.pathname === item.to ? 'active' : undefined}>
              <Icon name={item.icon} size={20} />
              {item.label.split(' ')[0]}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

/** Shared month stepper used by the dashboard, reports and budgets. */
export function MonthPicker({ value, onChange, label = 'Month' }) {
  const [year, month] = value.split('-').map(Number);
  const shown = new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const move = (by) => {
    const next = new Date(Date.UTC(year, month - 1 + by, 1));
    onChange(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`);
  };

  const isFuture = new Date(Date.UTC(year, month - 1, 1)) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  return (
    <div className="row" role="group" aria-label={label}>
      <button type="button" className="icon-btn" onClick={() => move(-1)} aria-label="Previous month">
        <Icon name="left" />
      </button>
      <strong style={{ minWidth: '9.5rem', textAlign: 'center', fontSize: 'var(--step-0)' }}>{shown}</strong>
      <button type="button" className="icon-btn" onClick={() => move(1)} disabled={isFuture} aria-label="Next month">
        <Icon name="right" />
      </button>
    </div>
  );
}
