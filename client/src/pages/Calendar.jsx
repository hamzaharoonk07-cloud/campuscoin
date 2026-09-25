import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout, { MonthPicker } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import TransactionForm, { Modal } from '../components/TransactionForm.jsx';
import { artUrl, CategoryIcon } from '../components/Illustrations.jsx';
import { api } from '../lib/api.js';
import { compactMoney, money, monthKey } from '../lib/format.js';
import { useAuth, useToast } from '../context/AppContext.jsx';

/* ---------------------------------------------------------------------------
   The money calendar.

   The month laid out as a real calendar: each day shows what went out (and
   anything that came in), shaded by how heavy the day was, with a marker on
   days a repeating payment is due. Tapping a day opens it beside the grid -
   its transactions, what is coming up, and a button to add something on that
   date. ?day=YYYY-MM-DD opens a day directly (the dashboard's spending grid
   links here).
--------------------------------------------------------------------------- */

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const iso = (d) => d.toISOString().slice(0, 10);
const todayIso = () => {
  const now = new Date();
  return iso(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
};

export default function Calendar() {
  const { currency } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const initialDay = params.get('day');
  const [month, setMonth] = useState(initialDay ? initialDay.slice(0, 7) : monthKey());
  const [data, setData] = useState(null);
  const [picked, setPicked] = useState(initialDay || null);
  const [categories, setCategories] = useState([]);
  const [adding, setAdding] = useState(null);

  const load = useCallback(() => {
    api
      .get(`/reports/calendar?month=${month}`)
      .then(setData)
      .catch((err) => toast.error('Could not load the calendar', err.message));
  }, [month, toast]);

  useEffect(load, [load]);
  useEffect(() => {
    api.get('/categories').then(({ categories: list }) => setCategories(list)).catch(() => {});
  }, []);

  // On a phone the day's details sit below the grid, so tapping a day
  // scrolls down to them.
  const pick = (value) => {
    setPicked(value);
    if (window.matchMedia('(max-width: 1100px)').matches) {
      requestAnimationFrame(() => document.querySelector('.cal-dayview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  // Changing month opens today (this month) or the 1st (any other month).
  const changeMonth = (next) => {
    setMonth(next);
    setPicked(next === monthKey() ? todayIso() : `${next}-01`);
    setParams({});
  };

  // The grid: blank cells before the 1st so weeks start on Monday.
  const cells = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const first = new Date(Date.UTC(y, m - 1, 1));
    const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const lead = (first.getUTCDay() + 6) % 7;
    return [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => iso(new Date(Date.UTC(y, m - 1, i + 1))))];
  }, [month]);

  const days = data?.days || {};
  const peak = Math.max(1, ...Object.values(days).map((d) => d.expense));
  const shade = (spent) => (!spent ? '' : spent < peak * 0.25 ? 'is-1' : spent < peak * 0.6 ? 'is-2' : 'is-3');
  const today = todayIso();
  const day = picked ? days[picked] || { date: picked, income: 0, expense: 0, transactions: [], upcoming: [] } : null;
  const pickedLabel = picked
    ? new Date(`${picked}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
    : '';
  const activeDays = Object.values(days).filter((d) => d.expense > 0).length;
  const quiet = cells.filter((c) => c && c <= today && !(days[c]?.expense > 0)).length;

  return (
    <Layout
      title="Calendar"
      crumbs={
        <>
          <Link to="/dashboard">Dashboard</Link> / <span>Calendar</span>
        </>
      }
      actions={<MonthPicker value={month} onChange={changeMonth} />}
    >
      <div className="cal-summary">
        <div className="cal-fact">
          <img src={artUrl('money-with-wings')} alt="" width="30" height="30" />
          <span>
            <small>Spent this month</small>
            <strong className="num">{money(data?.totals.expense || 0, currency)}</strong>
          </span>
        </div>
        <div className="cal-fact">
          <img src={artUrl('dollar-banknote')} alt="" width="30" height="30" />
          <span>
            <small>Came in</small>
            <strong className="num is-in">{money(data?.totals.income || 0, currency)}</strong>
          </span>
        </div>
        <div className="cal-fact">
          <img src={artUrl('spiral-calendar')} alt="" width="30" height="30" />
          <span>
            <small>Days with spending</small>
            <strong className="num">{activeDays}</strong>
          </span>
        </div>
        <div className="cal-fact">
          <img src={artUrl('seedling')} alt="" width="30" height="30" />
          <span>
            <small>No-spend days so far</small>
            <strong className="num">{quiet}</strong>
          </span>
        </div>
      </div>

      <div className="cal-layout">
        <section className="cal-card">
          <div className="cal-week" aria-hidden="true">
            {WEEK.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          {!data ? (
            <div className="skeleton" style={{ height: 460 }} />
          ) : (
            <div className="cal-grid" role="grid" aria-label="Money by day">
              {cells.map((c, i) => {
                if (!c) return <span key={`pad${i}`} className="cal-day is-pad" />;
                const d = days[c];
                const classes = ['cal-day', shade(d?.expense), c === today ? 'is-today' : '', c === picked ? 'is-picked' : '', c > today ? 'is-future' : '']
                  .filter(Boolean)
                  .join(' ');
                const top = d?.transactions.filter((t) => t.type === 'expense').sort((a, b) => b.amount - a.amount)[0];
                return (
                  <button
                    key={c}
                    type="button"
                    className={classes}
                    onClick={() => pick(c)}
                    aria-pressed={c === picked}
                    aria-label={`${c}: spent ${money(d?.expense || 0, currency)}${d?.income ? `, received ${money(d.income, currency)}` : ''}`}
                  >
                    <span className="cal-num">{Number(c.slice(8))}</span>
                    {top ? <CategoryIcon icon={top.category?.icon} slot={top.category?.slot} size={24} text={top.description} /> : null}
                    <span className="cal-amounts">
                      {d?.expense ? <b className="num">−{compactMoney(d.expense, currency)}</b> : null}
                      {d?.income ? <i className="num">+{compactMoney(d.income, currency)}</i> : null}
                    </span>
                    {d?.upcoming?.length ? <span className="cal-due" title="A repeating payment is due" /> : null}
                  </button>
                );
              })}
            </div>
          )}
          <div className="cal-legend">
            <span>Less</span>
            <i className="cal-swatch" />
            <i className="cal-swatch is-1" />
            <i className="cal-swatch is-2" />
            <i className="cal-swatch is-3" />
            <span>More</span>
            <span className="cal-legend-due">
              <i className="cal-due" /> Payment due
            </span>
          </div>
        </section>

        <aside className="cal-card cal-dayview" aria-live="polite">
          {!day ? (
            <div className="cal-empty">
              <img src={artUrl('calendar')} alt="" width="60" height="60" />
              <strong>Pick a day</strong>
              <span>Tap any day to see what came in and went out, or to add something on that date.</span>
            </div>
          ) : (
            <>
              <div className="cal-day-head">
                <span>
                  <small>{picked === today ? 'Today' : picked > today ? 'Coming up' : 'On'}</small>
                  <strong>{pickedLabel}</strong>
                </span>
                <button type="button" className="cal-add" onClick={() => setAdding(picked)}>
                  <Icon name="plus" size={15} />
                  Add
                </button>
              </div>
              <div className="cal-day-totals">
                <span>
                  <small>Spent</small>
                  <strong className="num">{money(day.expense, currency)}</strong>
                </span>
                <span>
                  <small>Came in</small>
                  <strong className="num is-in">{money(day.income, currency)}</strong>
                </span>
              </div>

              {day.transactions.length ? (
                <ul className="cal-list">
                  {day.transactions.map((t) => (
                    <li key={t._id}>
                      <CategoryIcon icon={t.category?.icon} slot={t.category?.slot} size={36} text={t.description} />
                      <span className="cal-list-main">
                        <strong>{t.description || t.category?.name}</strong>
                        <small>{t.category?.name}</small>
                      </span>
                      <span className={`num cal-list-amt${t.type === 'income' ? ' is-in' : ''}`}>
                        {t.type === 'income' ? '+' : '−'}
                        {money(t.amount, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="cal-note">
                  {picked > today ? 'Nothing logged for this day yet.' : 'A no-spend day - nothing went out.'}
                </p>
              )}

              {day.upcoming?.length ? (
                <>
                  <span className="cal-sub">Due this day</span>
                  <ul className="cal-list is-upcoming">
                    {day.upcoming.map((t) => (
                      <li key={t._id}>
                        <CategoryIcon icon={t.category?.icon} slot={t.category?.slot} size={36} text={t.description} />
                        <span className="cal-list-main">
                          <strong>{t.description || t.category?.name}</strong>
                          <small>Repeats {t.frequency}</small>
                        </span>
                        <span className={`num cal-list-amt${t.type === 'income' ? ' is-in' : ''}`}>
                          {t.type === 'income' ? '+' : '−'}
                          {money(t.amount, currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              <Link className="cal-more" to={`/transactions?from=${picked}&to=${picked}`}>
                Open this day in Transactions
                <Icon name="right" size={14} />
              </Link>
            </>
          )}
        </aside>
      </div>

      {adding ? (
        <Modal title="Add a transaction" onClose={() => setAdding(null)}>
          <TransactionForm
            categories={categories}
            preset={{ date: adding }}
            onSaved={() => {
              setAdding(null);
              load();
              toast.success('Added to the calendar');
            }}
            onCancel={() => setAdding(null)}
          />
        </Modal>
      ) : null}
    </Layout>
  );
}
