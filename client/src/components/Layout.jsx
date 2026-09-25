import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import Icon, { Wordmark } from './Icon.jsx';
import { ArtIcon } from './Illustrations.jsx';
import CoinBot from './CoinBot.jsx';

/** A destination's picture: a 3D object, or Coin for the assistant. */
const NavArt = ({ name, size }) => (name === 'coinbot' ? <CoinBot size={size + 4} bubble={false} /> : <ArtIcon name={name} size={size} />);
import { money } from '../lib/format.js';
import Chat from './Chat.jsx';
import Backdrop from './Backdrop.jsx';
import Avatar from './Avatar.jsx';
import { api } from '../lib/api.js';
import { useAuth, useTheme } from '../context/AppContext.jsx';

// Every destination has a 3D object (client/public/art) for the rail, the
// phone tab bar and its page header, and a line saying what the page is for.
const STUDENT_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'home', art: 'house', about: 'Your month at a glance' },
  { to: '/transactions', label: 'Transactions', icon: 'ledger', art: 'receipt', about: 'Everything that came in and went out' },
  { to: '/budgets', label: 'Budgets', icon: 'target', art: 'bullseye', about: 'A cap for each category, filling in real time' },
  { to: '/reports', label: 'Reports', icon: 'chart', art: 'bar_chart', about: 'Where it went, by category, day and week' },
  { to: '/insights', label: 'Insights', icon: 'spark', art: 'sparkles', about: 'Your month, in plain words' },
  { to: '/tips', label: 'Saving tips', icon: 'bulb', art: 'light_bulb', about: 'Ranked by what they would save you' },
  { to: '/categories', label: 'Categories', icon: 'tag', art: 'label', about: 'How your money is sorted' },
];

const SECONDARY_NAV = [
  { to: '/settings', label: 'Settings', icon: 'user', art: 'gear', about: 'Profile, photo and display' },
  { to: '/sitemap', label: 'Sitemap', icon: 'map', art: 'world_map', about: 'Every page in Campus Coin' },
];

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: 'chart', art: 'bar_chart', about: 'How Campus Coin is being used' },
  { to: '/admin/students', label: 'Students', icon: 'user', art: 'busts_in_silhouette', about: 'Every student account' },
  { to: '/admin/categories', label: 'Default categories', icon: 'tag', art: 'card_index_dividers', about: 'The categories every student starts with' },
  { to: '/admin/announcements', label: 'Announcements', icon: 'bell', art: 'megaphone', about: 'Notices and tip templates for everyone' },
];

const ALL_NAV = [...STUDENT_NAV, ...SECONDARY_NAV, ...ADMIN_NAV];
const pageFor = (path) =>
  ALL_NAV.filter((item) => path === item.to || path.startsWith(`${item.to}/`)).sort((a, b) => b.to.length - a.to.length)[0];

/**
 * The small "this month" card in the rail: what is kept so far against the
 * savings goal. Cached for a minute outside React, because every page
 * renders its own Layout and the figure does not need fetching on each one.
 */
let monthCache = { at: 0, data: null };

function MonthCard() {
  const { currency } = useAuth();
  const [data, setData] = useState(monthCache.data);

  useEffect(() => {
    if (Date.now() - monthCache.at < 60000 && monthCache.data) return;
    api
      .get('/reports/dashboard')
      .then(({ totals, goal }) => {
        monthCache = { at: Date.now(), data: { totals, goal } };
        setData(monthCache.data);
      })
      .catch(() => {});
  }, []);

  if (!data) return null;
  const { totals, goal } = data;
  const pct = goal.target > 0 ? Math.max(0, Math.min(100, (goal.kept / goal.target) * 100)) : 0;
  const over = totals.balance < 0;
  const month = new Date().toLocaleString('en', { month: 'long' });

  return (
    <Link to="/dashboard" className="rail-month">
      <ArtIcon name={over ? 'money_with_wings' : 'seedling'} size={38} />
      <span className="rail-month-copy">
        <span className="rail-month-label">{month} so far</span>
        <strong className={`num${over ? ' is-bad' : ''}`}>
          {over ? `${money(-totals.balance, currency)} over` : `${money(totals.balance, currency)} kept`}
        </strong>
      </span>
      {goal.target > 0 ? (
        <span className="rail-month-bar" title={`${Math.round(pct)}% of your savings goal`}>
          <i style={{ width: `${pct}%` }} />
        </span>
      ) : null}
    </Link>
  );
}

/** Where the rail's highlight last sat, so the next page can slide it from there. */
let lastRailSpot = null;

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

/**
 * The picture in the top bar opens a small menu with the account's name,
 * Settings and Sign out. It is there on every screen size - on a phone the
 * rail is hidden, and this is the way out.
 */
function AccountMenu({ onSignOut }) {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const holder = useRef(null);

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

  return (
    <div className="has-menu" ref={holder}>
      <button
        type="button"
        className="account-btn"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Your account"
      >
        <Avatar user={user} size={34} />
      </button>
      {open ? (
        <div className="menu account-menu" role="menu">
          <div className="account-menu-head">
            <Avatar user={user} size={42} />
            <div style={{ minWidth: 0 }}>
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          {!isAdmin ? (
            <Link to="/settings" className="account-menu-item" role="menuitem">
              <Icon name="user" size={16} />
              Settings and photo
            </Link>
          ) : null}
          <button type="button" className="account-menu-item is-danger" role="menuitem" onClick={onSignOut}>
            <Icon name="logout" size={16} />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ThemeButton() {
  const { theme, toggle } = useTheme();
  const { updateProfile } = useAuth();
  const showing = theme === 'system' ? 'matching your device' : theme;

  // The choice is saved to the account as well as this device, so it carries
  // over to a phone or a lab machine without being set again.
  const flip = async (event) => {
    let next;
    const apply = () => {
      next = toggle();
      // Set straight away rather than waiting for the theme effect, so the
      // view transition below captures the new colours.
      document.documentElement.setAttribute('data-theme', next);
    };

    // Where supported, the new theme spreads out in a circle from the button.
    // The browser snapshots the page before and after, and motion.css clips
    // the new snapshot to a growing circle centred on the click.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.startViewTransition && !reduced) {
      const root = document.documentElement;
      root.style.setProperty('--vt-x', `${event.clientX}px`);
      root.style.setProperty('--vt-y', `${event.clientY}px`);
      await document.startViewTransition(() => flushSync(apply)).updateCallbackDone;
    } else {
      apply();
    }

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
 * student's own data. Anything on a page can open it by dispatching the
 * "campuscoin:open-chat" event (see openChat below).
 */
function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  // A short "need help?" bubble, once per browser session, then never again.
  const [hint, setHint] = useState(false);
  useEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem('campuscoin.chatHint') === '1';
      sessionStorage.setItem('campuscoin.chatHint', '1');
    } catch {
      /* private mode: skip the hint */
    }
    if (seen) return undefined;
    const show = setTimeout(() => setHint(true), 2200);
    const hide = setTimeout(() => setHint(false), 9000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const show = () => {
      setHint(false);
      setOpen(true);
    };
    window.addEventListener('campuscoin:open-chat', show);
    return () => window.removeEventListener('campuscoin:open-chat', show);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {open && (
        <div className="chat-popover" role="dialog" aria-label="Campus Coin assistant">
          <div className="chat-popover-head">
            <span className="chat-bot-face" aria-hidden="true">
              <CoinBot size={38} bubble={false} />
              <i className="chat-online" />
            </span>
            <div style={{ marginRight: 'auto' }}>
              <strong>Coin, your money assistant</strong>
              <span>Online · answers from your own transactions</span>
            </div>
            <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close the assistant">
              <Icon name="x" size={16} />
            </button>
          </div>
          <Chat compact />
        </div>
      )}
      {hint && !open ? (
        <button type="button" className="chat-hint" onClick={() => setOpen(true)}>
          <strong>Need help with your money?</strong>
          <span>Ask Coin anything, like "how much on food?"</span>
        </button>
      ) : null}
      <button
        type="button"
        className={`chat-fab${open ? ' is-open' : ''}`}
        onClick={() => {
          setHint(false);
          setOpen((was) => !was);
        }}
        aria-expanded={open}
        aria-label={open ? 'Close the assistant' : 'Ask the assistant'}
      >
        {open ? <Icon name="x" size={22} /> : <CoinBot size={46} />}
      </button>
    </>
  );
}

export default function Layout({ title, crumbs, actions, children }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = isAdmin ? ADMIN_NAV : STUDENT_NAV;
  const page = pageFor(location.pathname);
  const rail = useRef(null);
  const indicator = useRef(null);

  // Every page renders its own Layout, so the rail is rebuilt on each
  // navigation. The highlight still slides from the previous item because
  // its last position is kept outside React (lastRailSpot), placed there
  // instantly, then moved to the new active item.
  useLayoutEffect(() => {
    const bar = indicator.current;
    const active = rail.current?.querySelector('a.active');
    if (!bar) return;
    if (!active) {
      bar.style.opacity = '0';
      return;
    }
    const to = { top: active.offsetTop, height: active.offsetHeight };
    const place = (spot) => {
      bar.style.transform = `translateY(${spot.top}px)`;
      bar.style.height = `${spot.height}px`;
    };
    bar.style.opacity = '1';
    bar.style.transition = 'none';
    place(lastRailSpot || to);
    bar.getBoundingClientRect(); // commit the starting point before animating
    bar.style.transition = '';
    const frame = requestAnimationFrame(() => place(to));
    lastRailSpot = to;
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  const signOut = () => {
    logout();
    navigate(isAdmin ? '/admin/login' : '/login');
  };

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {/* A thin bar that sweeps across the top as each page opens. */}
      <span className="route-progress" aria-hidden="true" />

      <Backdrop />

      <nav className="rail" aria-label="Main" ref={rail}>
        <span className="rail-indicator" ref={indicator} aria-hidden="true" />
        <Link to={isAdmin ? '/admin' : '/dashboard'} className="brand">
          <Wordmark />
        </Link>

        {!isAdmin ? <div className="rail-group">Money</div> : <div className="rail-group">Control panel</div>}
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/admin'}>
            <span className="rail-art">
              <NavArt name={item.art} size={22} />
            </span>
            {item.label}
          </NavLink>
        ))}

        {!isAdmin && (
          <>
            <div className="rail-group">More</div>
            {SECONDARY_NAV.map((item) => (
              <NavLink key={item.to} to={item.to}>
                <span className="rail-art">
                  <NavArt name={item.art} size={22} />
                </span>
                {item.label}
              </NavLink>
            ))}
          </>
        )}

        <div className="rail-spacer" />

        {!isAdmin ? <MonthCard /> : null}

        <div className="rail-footer">
          <div className="row" style={{ padding: '0.35rem 0.7rem 0.6rem' }}>
            <Link to={isAdmin ? '/admin' : '/settings'} className="rail-avatar" title="Change your photo">
              <Avatar user={user} size={34} />
            </Link>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--step--1)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div className="rail-role">
                <span className={`rail-badge${isAdmin ? ' is-admin' : ''}`}>{isAdmin ? 'Admin' : 'Student'}</span>
                {!isAdmin && user?.academicYear ? <span className="muted">{user.academicYear}</span> : null}
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
          {page ? (
            <span className="topbar-art" aria-hidden="true">
              <NavArt name={location.pathname === '/dashboard' ? 'waving_hand' : page.art} size={34} />
            </span>
          ) : null}
          <div style={{ marginRight: 'auto', minWidth: 0 }}>
            {crumbs ? <div className="crumbs">{crumbs}</div> : null}
            <h1>{title}</h1>
            {page ? <div className="topbar-about">{page.about}</div> : null}
          </div>
          {actions}
          {!isAdmin && <Bell />}
          <ThemeButton />
          <AccountMenu onSignOut={signOut} />
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
              <NavArt name={item.art} size={24} />
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

/** Opens the chat bubble from anywhere on a page. */
export const openChat = () => window.dispatchEvent(new Event('campuscoin:open-chat'));
