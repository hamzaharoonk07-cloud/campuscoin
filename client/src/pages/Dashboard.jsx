import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout, { MonthPicker, openChat } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import TransactionForm, { Modal } from '../components/TransactionForm.jsx';
import { AreaChart, DonutChart } from '../components/DashCharts.jsx';
import { api } from '../lib/api.js';
import { formatDate, money, monthKey } from '../lib/format.js';
import { useCountUp } from '../lib/useCountUp.js';
import CountUp from '../components/CountUp.jsx';
import { CategoryIcon, WalletArt } from '../components/Illustrations.jsx';
import { useAuth, useToast } from '../context/AppContext.jsx';

/* ---------------------------------------------------------------------------
   The dashboard.

   Laid out like the Finstack finance dashboard: three balance cards across
   the top, the cash flow beside the budgets, then the recent transactions
   beside where the money went. Quick add, what is coming up and the best
   tips sit underneath.
--------------------------------------------------------------------------- */

// The things students log most often, one tap away. The description is what
// the categoriser reads, so each lands in the right category by itself.
const QUICK = [
  { label: 'Chai', icon: 'utensils', type: 'expense', description: 'Chai at the canteen' },
  { label: 'Rickshaw', icon: 'bus', type: 'expense', description: 'Rickshaw to campus' },
  { label: 'Printing', icon: 'book', type: 'expense', description: 'Printing notes' },
  { label: 'Allowance', icon: 'wallet', type: 'income', description: 'Monthly allowance' },
];

// Whether the figures are hidden (the eye on each balance card), kept per device.
const HIDE_KEY = 'campuscoin.hideFigures';
const readHidden = () => {
  try {
    return localStorage.getItem(HIDE_KEY) === '1';
  } catch {
    return false;
  }
};

/** The change from last month as a small chip: "↑ 12%" or "↓ 8%". */
function Delta({ now, before, goodWhenUp = true }) {
  if (!before) return <span className="delta is-flat">New</span>;
  const pct = Math.round(((now - before) / Math.abs(before)) * 100);
  if (pct === 0) return <span className="delta is-flat">0%</span>;
  const good = pct > 0 === goodWhenUp;
  return (
    <span className={`delta ${good ? 'is-good' : 'is-bad'}`}>
      {pct > 0 ? '↑' : '↓'} {Math.abs(pct)}%
    </span>
  );
}

/** One of the three balance cards: a header strip, then the figure on a white inset. */
function StatCard({ title, dark, hidden, onToggle, children, foot }) {
  return (
    <section className={`fs-stat${dark ? ' is-dark' : ''}`}>
      <div className="fs-stat-head">
        <span>{title}</span>
        <button type="button" className="fs-eye" onClick={onToggle} aria-label={hidden ? 'Show figures' : 'Hide figures'}>
          <Icon name="eye" size={16} />
        </button>
      </div>
      <div className="fs-stat-body">
        <div className="fs-stat-figure num">{hidden ? '••••••' : children}</div>
        <div className="fs-stat-foot">{foot}</div>
      </div>
    </section>
  );
}

/** A striped bar: how this month compares with the best month of the six. */
function Stripes({ value, max, tone }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <span className={`fs-stripes is-${tone}`} title={`${Math.round(pct)}% of the highest month in the last six`}>
      <i style={{ width: `${pct}%` }} />
    </span>
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
  const [hidden, setHidden] = useState(readHidden);

  // Called before the loading branch below returns, because a hook cannot sit
  // after an early return.
  const kept = useCountUp(data?.totals?.balance ?? 0);

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
            .slice(0, 4)
        )
      )
      .catch(() => {});
  }, []);

  const toggleHidden = () => {
    setHidden((was) => {
      try {
        localStorage.setItem(HIDE_KEY, was ? '0' : '1');
      } catch {
        /* private mode: remember for this visit only */
      }
      return !was;
    });
  };

  const quickAdd = (item) => {
    setPreset(item);
    setAdding(true);
  };

  // The month's budgets added together, for the budgets card.
  const budgetTotals = useMemo(() => {
    const budgets = data?.budgets || [];
    const limit = budgets.reduce((acc, b) => acc + b.limitAmount, 0);
    const spent = budgets.reduce((acc, b) => acc + b.spent, 0);
    return {
      limit,
      spent,
      pct: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      over: budgets.filter((b) => b.state === 'exceeded').length,
    };
  }, [data]);

  const refreshTips = async () => {
    try {
      await api.post('/reports/refresh-tips', { month });
      load();
      toast.success('Tips rebuilt from your latest numbers');
    } catch (err) {
      toast.error('Could not refresh the tips', err.message);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  const actions = (
    <>
      <MonthPicker value={month} onChange={setMonth} />
      <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
        <Icon name="plus" size={16} />
        Add
      </button>
      <button type="button" className="btn fs-hide-sm" onClick={() => setAdding(true)}>
        <Icon name="camera" size={16} />
        Scan receipt
      </button>
      <button type="button" className="btn fs-hide-sm" onClick={() => openChat()}>
        <Icon name="spark" size={16} />
        Ask Coin
      </button>
    </>
  );

  if (!data) {
    return (
      <Layout title="Dashboard" actions={actions}>
        <div className="fs-row fs-three">
          <div className="skeleton" style={{ height: 150 }} />
          <div className="skeleton" style={{ height: 150 }} />
          <div className="skeleton" style={{ height: 150 }} />
        </div>
        <div className="fs-row fs-wide">
          <div className="skeleton" style={{ height: 360 }} />
          <div className="skeleton" style={{ height: 360 }} />
        </div>
      </Layout>
    );
  }

  const { totals, spending, budgets, trend, tips, recent, goal, announcements } = data;
  const overspent = totals.expense > totals.income;
  // Last month, for the change chips: the trend ends with the month shown.
  const before = trend.length > 1 ? trend[trend.length - 2] : null;
  const topIn = Math.max(...trend.map((m) => m.income), 0);
  const topOut = Math.max(...trend.map((m) => m.expense), 0);
  const sixMonthKept = trend.reduce((acc, m) => acc + m.income - m.expense, 0);

  return (
    <Layout title={`Welcome back, ${firstName}`} actions={actions}>
      {announcements?.length ? (
        <div className="fs-notice">
          <Icon name="bell" size={16} />
          <strong>{announcements[0].title}</strong>
          <span>{announcements[0].body}</span>
        </div>
      ) : null}

      {/* --- Three balance cards ------------------------------------------ */}
      <div className="fs-row fs-three">
        <StatCard
          dark
          title={overspent ? 'Spent beyond income' : 'Kept this month'}
          hidden={hidden}
          onToggle={toggleHidden}
          foot={
            <>
              <Delta now={totals.balance} before={before?.balance} />
              <span>
                {goal.target > 0
                  ? `${Math.max(0, Math.round(goal.pct ?? 0))}% of your ${money(goal.target, currency)} goal`
                  : 'compared to last month'}
              </span>
            </>
          }
        >
          {money(Math.abs(kept), currency)}
        </StatCard>

        <StatCard
          title="Money in"
          hidden={hidden}
          onToggle={toggleHidden}
          foot={
            <>
              <Stripes value={totals.income} max={topIn} tone="in" />
              <Delta now={totals.income} before={before?.income} />
            </>
          }
        >
          <CountUp value={totals.income} currency={currency} />
        </StatCard>

        <StatCard
          title="Money out"
          hidden={hidden}
          onToggle={toggleHidden}
          foot={
            <>
              <Stripes value={totals.expense} max={topOut} tone="out" />
              <Delta now={totals.expense} before={before?.expense} goodWhenUp={false} />
            </>
          }
        >
          <CountUp value={totals.expense} currency={currency} />
        </StatCard>
      </div>

      {/* --- Cash flow and budgets ---------------------------------------- */}
      <div className="fs-row fs-wide">
        <section className="panel fs-card">
          <div className="fs-card-head">
            <h2>Cash flow</h2>
            <Link to="/reports" className="fs-mini-btn">
              Full report
            </Link>
          </div>
          <div className="fs-flow-figure">
            <strong className="num">{hidden ? '••••••' : money(sixMonthKept, currency)}</strong>
            <span>{sixMonthKept >= 0 ? 'kept over the last six months' : 'spent beyond income over six months'}</span>
          </div>
          <AreaChart data={trend} currency={currency} />
        </section>

        <section className="panel fs-card">
          <div className="fs-card-head">
            <h2>Budgets</h2>
            <span className="fs-muted">{budgets.length} this month</span>
          </div>
          {budgets.length === 0 ? (
            <div className="fs-empty">
              <p>No caps set this month. One budget on your biggest category is the change most students actually keep to.</p>
            </div>
          ) : (
            <>
              <div className="fs-pair">
                <div className="fs-box">
                  <span>Budgeted</span>
                  <strong className="num">{money(budgetTotals.limit, currency)}</strong>
                </div>
                <span className="fs-pair-mark" aria-hidden="true">
                  <Icon name="down" size={16} />
                </span>
                <div className="fs-box">
                  <span>Spent against it</span>
                  <strong className={`num${budgetTotals.spent > budgetTotals.limit ? ' is-bad' : ''}`}>
                    {money(budgetTotals.spent, currency)}
                  </strong>
                </div>
              </div>
              <dl className="fs-facts">
                <div>
                  <dt>Used</dt>
                  <dd className="num">{budgetTotals.pct}%</dd>
                </div>
                <div>
                  <dt>Still available</dt>
                  <dd className="num">{money(Math.max(0, budgetTotals.limit - budgetTotals.spent), currency)}</dd>
                </div>
                <div>
                  <dt>Over their cap</dt>
                  <dd className={budgetTotals.over ? 'is-bad' : ''}>{budgetTotals.over} of {budgets.length}</dd>
                </div>
              </dl>
            </>
          )}
          <Link to="/budgets" className="btn btn-primary fs-block-btn">
            {budgets.length ? 'Manage budgets' : 'Set a budget'}
          </Link>
        </section>
      </div>

      {/* --- Recent transactions and spending ----------------------------- */}
      <div className="fs-row fs-wide">
        <section className="panel fs-card fs-flush">
          <div className="fs-card-head">
            <h2>Recent transactions</h2>
            <Link to="/transactions?flagged=1" className="fs-mini-btn">
              <Icon name="filter" size={14} />
              Flagged
            </Link>
            <Link to="/transactions" className="fs-mini-btn">
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
              <table className="fs-table">
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th className="tx-hide">Date</th>
                    <th className="tx-hide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => {
                    const flag = row.flags?.includes('duplicate') ? 'Duplicate?' : row.flags?.includes('large') ? 'Unusual' : null;
                    return (
                      <tr key={row._id}>
                        <td>
                          <div className="fs-tx">
                            <CategoryIcon icon={row.category?.icon} slot={row.category?.slot} size={34} />
                            <span>
                              <strong>{row.description || row.category?.name}</strong>
                              <small>{row.category?.name}</small>
                            </span>
                          </div>
                        </td>
                        <td className={`fs-amount num${row.type === 'income' ? ' is-in' : ''}`}>
                          {row.type === 'income' ? '+' : '−'}
                          {money(row.amount, currency).replace('−', '')}
                        </td>
                        <td className="fs-date tx-hide">{formatDate(row.date, { day: 'numeric', month: 'short' })}</td>
                        <td className="tx-hide">
                          <span className={`fs-status ${flag ? 'is-warn' : row.type === 'income' ? 'is-in' : 'is-out'}`}>
                            {flag || (row.type === 'income' ? 'Money in' : 'Money out')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel fs-card">
          <div className="fs-card-head">
            <h2>Where it went</h2>
            <span className="fs-muted">{spending.length} categories</span>
          </div>
          <DonutChart rows={spending} currency={currency} total={totals.expense} />
        </section>
      </div>

      {/* --- Quick add, coming up, tips ----------------------------------- */}
      <div className="fs-row fs-three">
        <section className="panel fs-card">
          <div className="fs-card-head">
            <h2>Quick add</h2>
            <span className="fs-muted">One tap, then the amount</span>
          </div>
          <div className="fs-quick">
            {QUICK.map((item) => (
              <button key={item.label} type="button" onClick={() => quickAdd(item)}>
                <Icon name={item.icon} size={18} />
                <strong>{item.label}</strong>
                <small>{item.type === 'income' ? 'Money in' : 'Money out'}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="panel fs-card">
          <div className="fs-card-head">
            <h2>Coming up</h2>
            <Link className="fs-mini-btn" to="/transactions">
              All
            </Link>
          </div>
          {upcoming.length ? (
            <ul className="fs-list">
              {upcoming.map((row) => (
                <li key={row._id}>
                  <span>
                    <strong>{row.description || row.category?.name}</strong>
                    <small>
                      {formatDate(row.recurring.nextRun, { day: 'numeric', month: 'short' })} · {row.recurring.frequency}
                    </small>
                  </span>
                  <span className={`num fs-amount${row.type === 'income' ? ' is-in' : ''}`}>
                    {row.type === 'income' ? '+' : '−'}
                    {money(row.amount, currency)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="fs-muted">Nothing repeats yet. Tick "This repeats" when you add an allowance or a subscription.</p>
          )}
        </section>

        <section className="panel fs-card">
          <div className="fs-card-head">
            <h2>Worth doing</h2>
            <button type="button" className="fs-mini-btn" onClick={refreshTips}>
              <Icon name="repeat" size={14} />
              Refresh
            </button>
          </div>
          {tips.length === 0 ? (
            <p className="fs-muted">Tips appear once there is a couple of weeks of history to compare against.</p>
          ) : (
            <ul className="fs-list">
              {tips.slice(0, 3).map((tip) => (
                <li key={tip._id}>
                  <span>
                    <strong>{tip.title}</strong>
                    <small>{tip.body}</small>
                  </span>
                  {tip.impact > 0 ? <span className="num fs-amount is-in">{money(tip.impact, currency)}</span> : null}
                </li>
              ))}
            </ul>
          )}
          <Link className="fs-mini-btn" to="/tips" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
            All saving tips
          </Link>
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
