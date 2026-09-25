import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout, { MonthPicker, openChat } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import TransactionForm, { Modal } from '../components/TransactionForm.jsx';
import { api } from '../lib/api.js';
import { formatDate, money, monthKey } from '../lib/format.js';
import { useCountUp } from '../lib/useCountUp.js';
import CountUp from '../components/CountUp.jsx';
import { CategoryIcon, WalletArt } from '../components/Illustrations.jsx';
import { useAuth, useToast } from '../context/AppContext.jsx';

/* ---------------------------------------------------------------------------
   The dashboard.

   Laid out like the Lefstyle finance dashboard: the month's headline figure
   and three small cards on the left, the month's rhythm as three coloured
   blocks, then the recent transactions. On the right, Coin's insight, the
   month's financial health on a gauge, quick add and what is coming up.
--------------------------------------------------------------------------- */

// The things students log most often, one tap away. The description is what
// the categoriser reads, so each lands in the right category by itself.
const QUICK = [
  { label: 'Chai', icon: 'utensils', type: 'expense', description: 'Chai at the canteen' },
  { label: 'Rickshaw', icon: 'bus', type: 'expense', description: 'Rickshaw to campus' },
  { label: 'Printing', icon: 'book', type: 'expense', description: 'Printing notes' },
  { label: 'Allowance', icon: 'wallet', type: 'income', description: 'Monthly allowance' },
];

// The three blocks of the rhythm card take these colours, in order.
const BLOCKS = ['var(--sage)', 'var(--cream)', 'var(--lilac)'];

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
};

/** Percentage change from last month, or null when there is nothing to compare. */
const change = (now, before) => (before ? Math.round(((now - before) / Math.abs(before)) * 100) : null);

/** "↑ 20%" in the corner of a small card. */
function Trend({ pct, goodWhenUp = true }) {
  if (pct === null) return <span className="lf-trend">new</span>;
  const good = pct >= 0 === goodWhenUp;
  return (
    <span className={`lf-trend ${good ? 'is-good' : 'is-bad'}`}>
      {pct >= 0 ? '↑' : '↓'} {Math.abs(pct)}%
    </span>
  );
}

/* --- The health gauge ------------------------------------------------------ */

// A 240° arc, open at the bottom: it starts at the lower left and sweeps
// clockwise over the top to the lower right. Angles are in degrees on the
// screen, where y points down.
const G = { cx: 110, cy: 110, r: 88, from: 150, sweep: 240 };
const point = (deg) => {
  const rad = (deg * Math.PI) / 180;
  return [G.cx + G.r * Math.cos(rad), G.cy + G.r * Math.sin(rad)];
};
const arc = (a0, a1) => {
  const [x0, y0] = point(a0);
  const [x1, y1] = point(a1);
  return `M ${x0} ${y0} A ${G.r} ${G.r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
};

function HealthGauge({ pct }) {
  const p = Math.max(0, Math.min(100, pct));
  const end = G.from + (G.sweep * p) / 100;
  const stop = G.from + G.sweep;
  // What is left of the arc is split between amber and clay, with small gaps.
  const rest = stop - end;
  const split = end + rest * 0.55;
  const [kx, ky] = point(end);
  return (
    <svg className="lf-gauge" viewBox="0 0 220 200" role="img" aria-label={`${Math.round(p)}% of this month's income saved`}>
      {p > 0 ? <path className="lf-gauge-fill" d={arc(G.from, end)} /> : null}
      {rest > 14 ? <path d={arc(end + 7, split - 3)} stroke="var(--amber)" /> : null}
      {rest > 14 ? <path d={arc(split + 3, stop)} stroke="var(--clay)" /> : null}
      <circle cx={kx} cy={ky} r="11" fill="var(--teal)" stroke="var(--surface)" strokeWidth="4" />
    </svg>
  );
}

export default function Dashboard() {
  const { user, currency } = useAuth();
  const toast = useToast();
  const [month, setMonth] = useState(monthKey());
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [adding, setAdding] = useState(false);
  // A quick-add button opens the form already filled in.
  const [preset, setPreset] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [rhythm, setRhythm] = useState('out');
  const [search, setSearch] = useState('');

  // Called before the loading branch below returns, because a hook cannot sit
  // after an early return.
  const kept = useCountUp(Math.abs(data?.totals?.balance ?? 0));

  const load = useCallback(() => {
    api
      .get(`/reports/dashboard?month=${month}`)
      .then(setData)
      .catch((err) => toast.error('Could not load your dashboard', err.message));
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

  // The three blocks of the rhythm card for the chosen tab.
  const blocks = useMemo(() => {
    if (!data) return [];
    if (rhythm === 'budgets') {
      return data.budgets.slice(0, 3).map((b) => ({
        key: b._id,
        figure: money(b.spent, currency),
        label: `${b.category.name} · ${b.pct}% of ${money(b.limitAmount, currency)}`,
        weight: b.limitAmount,
        fill: Math.min(100, b.pct),
      }));
    }
    const rows = rhythm === 'in' ? data.income || [] : data.spending;
    return rows.slice(0, 3).map((r) => ({
      key: r._id || r.name,
      figure: money(r.total, currency),
      label: r.name,
      weight: r.total,
      fill: null,
    }));
  }, [data, rhythm, currency]);

  const actions = (
    <>
      <MonthPicker value={month} onChange={setMonth} />
      <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
        <Icon name="plus" size={16} />
        Add
      </button>
    </>
  );

  const title = `${greeting()}, ${user?.name?.split(' ')[0] || 'there'} 👋`;

  if (!data) {
    return (
      <Layout title={title} actions={actions}>
        <div className="lf-grid">
          <div className="skeleton" style={{ height: 520 }} />
          <div className="skeleton" style={{ height: 520 }} />
        </div>
      </Layout>
    );
  }

  const { totals, trend, tips, recent, goal, announcements } = data;
  const overspent = totals.balance < 0;
  // Last month, for the change figures: the trend ends with the month shown.
  const before = trend.length > 1 ? trend[trend.length - 2] : null;
  const spendChange = change(totals.expense, before?.expense);
  const savedPct = totals.savingsRate === null ? 0 : Math.max(0, totals.savingsRate);
  const health =
    totals.savingsRate === null ? ['Waiting', 'is-flat'] : totals.savingsRate >= 20 ? ['On track', 'is-good'] : totals.savingsRate >= 0 ? ['Tight', 'is-warn'] : ['Over', 'is-bad'];
  const biggest = Math.max(...recent.map((r) => r.amount), 1);
  const shown = recent.filter((r) =>
    `${r.description || ''} ${r.category?.name || ''}`.toLowerCase().includes(search.trim().toLowerCase())
  );
  const tip = tips[0];

  return (
    <Layout title={title} actions={actions}>
      {announcements?.length ? (
        <div className="lf-notice">
          <Icon name="bell" size={16} />
          <strong>{announcements[0].title}</strong>
          <span>{announcements[0].body}</span>
        </div>
      ) : null}

      <div className="lf-grid">
        {/* --- Left: the month in figures ------------------------------- */}
        <div className="lf-col">
          <section className="lf-hero">
            <span className="lf-label">{overspent ? 'Spent beyond income' : 'Kept this month'}</span>
            <div className="lf-hero-row">
              <strong className="lf-hero-figure num">{money(kept, currency)}</strong>
              <span className="lf-hero-note">
                {totals.savingsRate === null ? (
                  'Nothing has come in yet this month'
                ) : overspent ? (
                  <>
                    Spending is <b className="is-bad">{Math.abs(totals.savingsRate)}%</b> ahead of income
                  </>
                ) : (
                  <>
                    Saved <b>{totals.savingsRate}%</b> of what came in
                  </>
                )}
              </span>
            </div>
          </section>

          <div className="lf-three">
            <Link to="/reports" className="lf-card lf-stat">
              <span className="lf-stat-head">
                Income <Icon name="right" size={14} />
              </span>
              <strong className="num">
                <CountUp value={totals.income} currency={currency} />
              </strong>
              <span className="lf-stat-foot">
                vs last month <Trend pct={change(totals.income, before?.income)} />
              </span>
            </Link>
            <Link to="/transactions" className="lf-card lf-stat">
              <span className="lf-stat-head">
                Expense <Icon name="right" size={14} />
              </span>
              <strong className="num">
                <CountUp value={totals.expense} currency={currency} />
              </strong>
              <span className="lf-stat-foot">
                vs last month <Trend pct={spendChange} goodWhenUp={false} />
              </span>
            </Link>
            <Link to="/settings" className="lf-card lf-stat">
              <span className="lf-stat-head">
                Savings goal <Icon name="right" size={14} />
              </span>
              <strong className="num">{goal.target > 0 ? money(goal.target, currency) : 'Not set'}</strong>
              <span className="lf-stat-foot">
                {goal.target > 0 ? (
                  <>
                    reached <span className="lf-trend">{Math.max(0, goal.pct ?? 0)}%</span>
                  </>
                ) : (
                  'Set one in Settings'
                )}
              </span>
            </Link>
          </div>

          <section className="lf-card lf-rhythm">
            <div className="lf-card-head">
              <h2>Monthly money rhythm</h2>
              <div className="lf-tabs" role="tablist">
                {[
                  ['out', 'Spending'],
                  ['in', 'Income'],
                  ['budgets', 'Budgets'],
                ].map(([key, label]) => (
                  <button key={key} type="button" role="tab" aria-selected={rhythm === key} className={rhythm === key ? 'is-on' : ''} onClick={() => setRhythm(key)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {blocks.length ? (
              <div className="lf-blocks">
                {blocks.map((b, i) => (
                  <div key={b.key} className="lf-block" style={{ flexGrow: Math.max(b.weight, 1), '--block': BLOCKS[i] }}>
                    <i className="lf-block-dot" />
                    <strong className="num">{b.figure}</strong>
                    <span>{b.label}</span>
                    <span className="lf-block-bar">{b.fill !== null ? <i style={{ height: `${b.fill}%` }} /> : null}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="lf-muted">
                {rhythm === 'budgets' ? (
                  <>
                    No budgets this month. <Link to="/budgets">Set one</Link> on your biggest category.
                  </>
                ) : (
                  'Nothing logged here for this month yet.'
                )}
              </p>
            )}
          </section>

          <section className="lf-card">
            <div className="lf-card-head">
              <h2>Recent transactions</h2>
              <label className="lf-search">
                <Icon name="search" size={15} />
                <input type="search" placeholder="Search" aria-label="Search recent transactions" value={search} onChange={(e) => setSearch(e.target.value)} />
              </label>
              <Link to="/transactions" className="lf-btn">
                <Icon name="ledger" size={15} />
                View all
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="empty">
                <WalletArt />
                <h3>Nothing logged yet</h3>
                <p>Start with the thing you bought most recently &mdash; it takes about five seconds.</p>
                <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setAdding(true)}>
                  Add your first transaction
                </button>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="lf-table">
                  <thead>
                    <tr>
                      <th>Transaction</th>
                      <th className="tx-hide">Date</th>
                      <th className="tx-hide">Size</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((row) => {
                      const flagged = row.flags?.includes('duplicate') || row.flags?.includes('large');
                      const share = Math.round((row.amount / biggest) * 100);
                      return (
                        <tr key={row._id}>
                          <td>
                            <div className="lf-tx">
                              <CategoryIcon icon={row.category?.icon} slot={row.category?.slot} size={32} />
                              <span>
                                <strong>{row.description || row.category?.name}</strong>
                                <small>
                                  {row.category?.name}
                                  {flagged ? <em> · {row.flags.includes('duplicate') ? 'duplicate?' : 'unusual'}</em> : null}
                                </small>
                              </span>
                            </div>
                          </td>
                          <td className="lf-date tx-hide">{formatDate(row.date, { day: 'numeric', month: 'short' })}</td>
                          <td className="tx-hide">
                            <span className="lf-share">
                              <span className="lf-share-bar">
                                <i style={{ width: `${share}%` }} />
                              </span>
                              {share}%
                            </span>
                          </td>
                          <td className={`lf-amount num${row.type === 'income' ? ' is-in' : ''}`}>
                            {row.type === 'income' ? '+' : '−'}
                            {money(row.amount, currency).replace('−', '')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {shown.length === 0 ? <p className="lf-muted">Nothing recent matches "{search}".</p> : null}
              </div>
            )}
          </section>
        </div>

        {/* --- Right: insight, health, quick add ------------------------ */}
        <div className="lf-col">
          <section className="lf-card lf-insight">
            <div className="lf-insight-head">
              <span className="lf-insight-icon" aria-hidden="true">
                <Icon name="spark" size={16} />
              </span>
              <span>
                <strong>Coin's insight</strong>
                <small>Generated from your transactions</small>
              </span>
              <button type="button" className="lf-icon-btn" onClick={() => openChat()} aria-label="Ask Coin">
                <Icon name="chat" size={17} />
              </button>
            </div>
            <div className="lf-insight-tiles">
              <Link to="/reports" className="lf-insight-tile">
                <span>
                  Money alert <Icon name="right" size={14} />
                </span>
                <p>
                  {spendChange === null ? (
                    <>
                      First month <em>of spending on record</em>
                    </>
                  ) : (
                    <>
                      Spending {spendChange >= 0 ? 'up' : 'down'} <em>{Math.abs(spendChange)}% on last month</em>
                    </>
                  )}
                </p>
              </Link>
              <Link to="/tips" className="lf-insight-tile">
                <span>
                  Advice <Icon name="right" size={14} />
                </span>
                <p>
                  {tip ? (
                    <>
                      {tip.title.split(' ').slice(0, 3).join(' ')} <em>{tip.title.split(' ').slice(3).join(' ')}</em>
                    </>
                  ) : (
                    <>
                      Tips appear <em>after two weeks</em>
                    </>
                  )}
                </p>
              </Link>
            </div>
          </section>

          <section className="lf-card lf-health">
            <div className="lf-card-head">
              <h2>Financial health</h2>
              <Link to="/insights" className="lf-icon-btn" aria-label="Read the monthly insight">
                <Icon name="right" size={16} />
              </Link>
            </div>
            <div className="lf-health-body">
              <div className="lf-health-copy">
                <span className={`lf-chip ${health[1]}`}>{health[0]}</span>
                <strong className="num">{money(totals.balance, currency)}</strong>
                <span className="lf-muted">
                  {before ? (
                    <>
                      <b className={totals.balance >= before.balance ? 'is-good' : 'is-bad'}>
                        {totals.balance >= before.balance ? '+' : '−'}
                        {money(Math.abs(totals.balance - before.balance), currency)}
                      </b>{' '}
                      from last month
                    </>
                  ) : (
                    'kept this month'
                  )}
                </span>
                <small>Based on this month's transactions.</small>
              </div>
              <div className="lf-gauge-wrap">
                <HealthGauge pct={savedPct} />
                <div className="lf-gauge-centre">
                  <strong className="num">{savedPct}%</strong>
                  <span>of income saved</span>
                </div>
              </div>
            </div>
          </section>

          <section className="lf-card">
            <div className="lf-card-head">
              <h2>Quick add</h2>
              <span className="lf-muted">One tap</span>
            </div>
            <div className="lf-quick">
              {QUICK.map((item) => (
                <button key={item.label} type="button" onClick={() => quickAdd(item)}>
                  <Icon name={item.icon} size={18} />
                  <strong>{item.label}</strong>
                  <small>{item.type === 'income' ? 'Money in' : 'Money out'}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="lf-card">
            <div className="lf-card-head">
              <h2>Coming up</h2>
              <Link to="/transactions" className="lf-icon-btn" aria-label="All transactions">
                <Icon name="right" size={16} />
              </Link>
            </div>
            {upcoming.length ? (
              <ul className="lf-list">
                {upcoming.map((row) => (
                  <li key={row._id}>
                    <span>
                      <strong>{row.description || row.category?.name}</strong>
                      <small>
                        {formatDate(row.recurring.nextRun, { day: 'numeric', month: 'short' })} · {row.recurring.frequency}
                      </small>
                    </span>
                    <span className={`lf-amount num${row.type === 'income' ? ' is-in' : ''}`}>
                      {row.type === 'income' ? '+' : '−'}
                      {money(row.amount, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="lf-muted">Nothing repeats yet. Tick "This repeats" when you add an allowance or a subscription.</p>
            )}
          </section>
        </div>
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
