import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout, { MonthPicker, openChat } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import TransactionForm, { Modal } from '../components/TransactionForm.jsx';
import { api } from '../lib/api.js';
import { formatDate, money, monthKey, slotColor } from '../lib/format.js';
import CountUp from '../components/CountUp.jsx';
import { MonthBars } from '../components/DashCharts.jsx';
import { CategoryIcon, WalletArt } from '../components/Illustrations.jsx';
import { useAuth, useToast } from '../context/AppContext.jsx';

/* ---------------------------------------------------------------------------
   The dashboard.

   Laid out like design 9 (a fintech dashboard on Dribbble): three figures
   across the top beside a tall "my month" card, the cash flow on a black
   card, then the month's spending as a grid of days, quick add and the
   latest transactions. Coming up, Coin's insight and the best tips close it.
--------------------------------------------------------------------------- */

// The things students log most often, one tap away. The description is what
// the categoriser reads, so each lands in the right category by itself.
const QUICK = [
  { label: 'Chai', icon: 'utensils', type: 'expense', description: 'Chai at the canteen' },
  { label: 'Rickshaw', icon: 'bus', type: 'expense', description: 'Rickshaw to campus' },
  { label: 'Printing', icon: 'book', type: 'expense', description: 'Printing notes' },
  { label: 'Allowance', icon: 'wallet', type: 'income', description: 'Monthly allowance' },
];

/** Percentage change from last month, or null when there is nothing to compare. */
const change = (now, before) => (before ? Math.round(((now - before) / Math.abs(before)) * 100) : null);

/** A black pill with the change in it: "+22%". */
function Chip({ pct }) {
  if (pct === null) return <span className="d9-chip">new</span>;
  return (
    <span className="d9-chip">
      {pct >= 0 ? '+' : '−'}
      {Math.abs(pct)}%
    </span>
  );
}

/* --- The month as a grid of days ------------------------------------------ */

function DayGrid({ daily, currency }) {
  const peak = Math.max(...daily.map((d) => d.total), 1);
  // Four shades: nothing spent, a little, a fair amount, a heavy day.
  const shade = (t) => (t === 0 ? 'is-0' : t < peak * 0.25 ? 'is-1' : t < peak * 0.6 ? 'is-2' : 'is-3');
  // Seven columns, Monday first, one row per week, like a calendar.
  const first = daily.length ? (new Date(daily[0].date).getUTCDay() + 6) % 7 : 0;
  const cells = [...Array(first).fill(null), ...daily];
  return (
    <div className="d9-days">
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((w, i) => (
        <span key={`w${i}`} className="d9-weekday" aria-hidden="true">
          {w}
        </span>
      ))}
      {cells.map((d, i) =>
        d ? (
          <span
            key={d.date}
            className={`d9-day ${shade(d.total)}`}
            title={`${formatDate(d.date, { day: 'numeric', month: 'short' })}: ${d.total ? money(d.total, currency) : 'nothing spent'}`}
          >
            {d.day}
          </span>
        ) : (
          <span key={`pad${i}`} className="d9-day is-pad" />
        )
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, currency } = useAuth();
  const toast = useToast();
  const [month, setMonth] = useState(monthKey());
  const [data, setData] = useState(null);
  const [daily, setDaily] = useState([]);
  const [categories, setCategories] = useState([]);
  const [adding, setAdding] = useState(false);
  // A quick-add button opens the form already filled in.
  const [preset, setPreset] = useState(null);
  const [upcoming, setUpcoming] = useState([]);

  const load = useCallback(() => {
    api
      .get(`/reports/dashboard?month=${month}`)
      .then(setData)
      .catch((err) => toast.error('Could not load your dashboard', err.message));
    // The day-by-day spending, for the activity grid.
    api
      .get(`/reports/monthly?month=${month}`)
      .then(({ daily: days }) => setDaily(days || []))
      .catch(() => setDaily([]));
  }, [month, toast]);

  useEffect(load, [load]);

  useEffect(() => {
    api.get('/categories').then(({ categories: list }) => setCategories(list)).catch(() => {});
    // The repeating entries, soonest first, for "Coming up".
    api
      .get('/transactions?recurring=1&limit=20')
      .then(({ transactions }) =>
        setUpcoming(
          transactions
            .filter((t) => t.recurring?.nextRun)
            .sort((a, b) => new Date(a.recurring.nextRun) - new Date(b.recurring.nextRun))
            .slice(0, 3)
        )
      )
      .catch(() => {});
  }, []);

  const quickAdd = (item) => {
    setPreset(item);
    setAdding(true);
  };

  const activeDays = useMemo(() => daily.filter((d) => d.total > 0), [daily]);
  const busiest = useMemo(() => [...activeDays].sort((a, b) => b.total - a.total)[0], [activeDays]);

  const actions = <MonthPicker value={month} onChange={setMonth} />;
  const title = `Hello, ${user?.name?.split(' ')[0] || 'there'}`;

  if (!data) {
    return (
      <Layout title={title} actions={actions}>
        <div className="d9-top">
          <div className="skeleton" style={{ height: 160 }} />
          <div className="skeleton" style={{ height: 160 }} />
          <div className="skeleton" style={{ height: 160 }} />
          <div className="skeleton" style={{ height: 160 }} />
        </div>
      </Layout>
    );
  }

  const { totals, spending, trend, tips, recent, insight, budgets, announcements } = data;
  // Last month, for the change chips: the trend ends with the month shown.
  const before = trend.length > 1 ? trend[trend.length - 2] : null;
  const [year, monthIndex] = month.split('-').map(Number);
  const monthName = new Date(Date.UTC(year, monthIndex - 1, 1)).toLocaleString('en', { month: 'long', timeZone: 'UTC' });
  const over = budgets.filter((b) => b.state === 'exceeded').length;

  return (
    <Layout title={title} actions={actions}>
      {announcements?.length ? (
        <div className="d9-notice">
          <Icon name="bell" size={16} />
          <strong>{announcements[0].title}</strong>
          <span>{announcements[0].body}</span>
        </div>
      ) : null}

      <div className="d9-top">
        {/* --- Three figures ------------------------------------------- */}
        <Link to="/reports" className="d9-card d9-stat">
          <span className="d9-stat-head">
            <Icon name="download" size={18} />
            Money in
          </span>
          <span className="d9-stat-row">
            <strong className="num">
              <CountUp value={totals.income} currency={currency} />
            </strong>
            <Chip pct={change(totals.income, before?.income)} />
          </span>
        </Link>
        <Link to="/transactions" className="d9-card d9-stat">
          <span className="d9-stat-head">
            <Icon name="upload" size={18} />
            Money out
          </span>
          <span className="d9-stat-row">
            <strong className="num">
              <CountUp value={totals.expense} currency={currency} />
            </strong>
            <Chip pct={change(totals.expense, before?.expense)} />
          </span>
        </Link>
        <Link to="/insights" className="d9-card d9-stat">
          <span className="d9-stat-head">
            <Icon name="calendar" size={18} />
            {totals.balance < 0 ? 'Spent beyond income' : 'Kept'}
          </span>
          <span className="d9-stat-row">
            <strong className="num">{money(totals.balance, currency)}</strong>
            <small>in {monthName}</small>
          </span>
        </Link>

        {/* --- My month: the tall card on the right --------------------- */}
        <section className="d9-card d9-month">
          <div className="d9-head">
            <h2>My month</h2>
            <button type="button" className="d9-pill is-dark" onClick={() => setAdding(true)}>
              <Icon name="plus" size={15} />
              Add
            </button>
          </div>
          <div className="d9-month-figure">
            <strong className="num">{money(totals.expense, currency)}</strong>
            <span>
              spent
              {totals.savingsRate !== null ? `, ${totals.savingsRate >= 0 ? totals.savingsRate + '% of income kept' : Math.abs(totals.savingsRate) + '% over income'}` : ''}
            </span>
          </div>
          <span className="d9-sub">Where it went</span>
          {spending.length ? (
            <>
              <div className="d9-alloc" aria-hidden="true">
                {spending.map((c) => (
                  <i key={c.name} style={{ flexGrow: c.share, background: slotColor(c.slot) }} />
                ))}
              </div>
              <ul className="d9-alloc-list">
                {spending.slice(0, 5).map((c) => (
                  <li key={c.name}>
                    <i style={{ background: slotColor(c.slot) }} />
                    <span>{c.name}</span>
                    <small>{c.share}%</small>
                    <strong className="num">{money(c.total, currency)}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="d9-muted">Nothing spent yet this month.</p>
          )}
          <p className="d9-muted d9-budget-line">
            {budgets.length ? `${budgets.length} budgets set · ${over ? `${over} over the cap` : 'all within their cap'}` : 'No budgets set this month.'}
          </p>
          <Link to="/budgets" className="d9-pill is-dark is-wide">
            Manage budgets
          </Link>
        </section>

        {/* --- Cash flow on black ---------------------------------------- */}
        <section className="d9-card d9-dark d9-flow-card">
          <div className="d9-head">
            <h2>Cash flow</h2>
            <span className="d9-flow-note">Last 6 months · tap a month</span>
          </div>
          <MonthBars data={trend} currency={currency} dark />
        </section>
      </div>

      <div className="d9-row">
        {/* --- Spending activity ----------------------------------------- */}
        <section className="d9-card d9-activity">
          <div className="d9-head">
            <h2>Spending activity</h2>
            <span className="d9-pill is-dark is-small">{monthName}</span>
          </div>
          <div className="d9-activity-figure">
            <strong className="num">{activeDays.length}</strong>
            <span>days with spending</span>
          </div>
          {daily.length ? <DayGrid daily={daily} currency={currency} /> : <p className="d9-muted">No days to show yet.</p>}
          <div className="d9-legend">
            <span>Less</span>
            <i className="d9-day is-0" />
            <i className="d9-day is-1" />
            <i className="d9-day is-2" />
            <i className="d9-day is-3" />
            <span>More</span>
          </div>
          {busiest ? (
            <p className="d9-muted">
              Busiest day: {formatDate(busiest.date, { day: 'numeric', month: 'short' })}, {money(busiest.total, currency)}
            </p>
          ) : null}
        </section>

        {/* --- Quick add: dark tiles ------------------------------------- */}
        <section className="d9-card">
          <div className="d9-head">
            <h2>Quick add</h2>
            <span className="d9-muted">One tap</span>
          </div>
          <div className="d9-quick">
            {QUICK.map((item) => (
              <button key={item.label} type="button" onClick={() => quickAdd(item)}>
                <span className="d9-quick-icon">
                  <Icon name={item.icon} size={18} />
                </span>
                <strong>{item.label}</strong>
                <small>{item.type === 'income' ? 'Money in' : 'Money out'}</small>
              </button>
            ))}
          </div>
          <button type="button" className="d9-pill is-dark is-wide" onClick={() => setAdding(true)}>
            <Icon name="camera" size={15} />
            Scan a receipt
          </button>
        </section>

        {/* --- Latest transactions --------------------------------------- */}
        <section className="d9-card">
          <div className="d9-head">
            <h2>Transactions</h2>
            <Link to="/transactions" className="d9-link">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="empty">
              <WalletArt />
              <h3>Nothing logged yet</h3>
              <p>Start with the thing you bought most recently.</p>
            </div>
          ) : (
            <ul className="d9-tx">
              {recent.map((row) => {
                const flagged = row.flags?.includes('duplicate') || row.flags?.includes('large');
                return (
                  <li key={row._id}>
                    <CategoryIcon icon={row.category?.icon} slot={row.category?.slot} size={36} text={row.description} />
                    <span className="d9-tx-name">
                      <strong>{row.description || row.category?.name}</strong>
                      <small>
                        {row.category?.name}
                        {flagged ? <em> · {row.flags.includes('duplicate') ? 'duplicate?' : 'unusual'}</em> : null}
                      </small>
                    </span>
                    <span className="d9-tx-amount">
                      <strong className={`num${row.type === 'income' ? ' is-in' : ''}`}>
                        {row.type === 'income' ? '+' : '−'}
                        {money(row.amount, currency).replace('−', '')}
                      </strong>
                      <small>{formatDate(row.date, { day: 'numeric', month: 'short' })}</small>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="d9-row">
        <section className="d9-card">
          <div className="d9-head">
            <h2>Coming up</h2>
            <span className="d9-muted">Repeating</span>
          </div>
          {upcoming.length ? (
            <ul className="d9-tx">
              {upcoming.map((row) => (
                <li key={row._id}>
                  <CategoryIcon icon={row.category?.icon} slot={row.category?.slot} size={36} text={row.description} />
                  <span className="d9-tx-name">
                    <strong>{row.description || row.category?.name}</strong>
                    <small>{row.recurring.frequency}</small>
                  </span>
                  <span className="d9-tx-amount">
                    <strong className={`num${row.type === 'income' ? ' is-in' : ''}`}>
                      {row.type === 'income' ? '+' : '−'}
                      {money(row.amount, currency)}
                    </strong>
                    <small>{formatDate(row.recurring.nextRun, { day: 'numeric', month: 'short' })}</small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="d9-muted">Nothing repeats yet. Tick "This repeats" when you add an allowance or a subscription.</p>
          )}
        </section>

        <section className="d9-card d9-blue">
          <div className="d9-head">
            <h2>Coin's insight</h2>
            <button type="button" className="d9-round" onClick={() => openChat()} aria-label="Ask Coin">
              <Icon name="chat" size={17} />
            </button>
          </div>
          <p className="d9-insight">
            {insight?.summaryText ||
              (tips[0] ? tips[0].body : 'Log a couple of weeks of spending and Coin will sum up your month here.')}
          </p>
          <Link to="/insights" className="d9-pill is-light">
            Read the full insight
          </Link>
        </section>

        <section className="d9-card">
          <div className="d9-head">
            <h2>Worth doing</h2>
            <Link to="/tips" className="d9-link">
              All tips
            </Link>
          </div>
          {tips.length ? (
            <ul className="d9-tips">
              {tips.slice(0, 3).map((tip) => (
                <li key={tip._id}>
                  <span className="d9-round is-small">
                    <Icon name="bulb" size={15} />
                  </span>
                  <span>
                    <strong>{tip.title}</strong>
                    {tip.impact > 0 ? <small>Could save {money(tip.impact, currency)} a month</small> : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="d9-muted">Tips appear once there is a couple of weeks of history to compare against.</p>
          )}
        </section>
      </div>

      {adding ? (
        <Modal
          title="Add a transaction"
          onClose={() => {
            setAdding(false);
            setPreset(null);
          }}
        >
          <TransactionForm
            categories={categories}
            preset={preset}
            onSaved={() => {
              setAdding(false);
              load();
            }}
            onCancel={() => setAdding(false)}
          />
        </Modal>
      ) : null}
    </Layout>
  );
}
