import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout, { MonthPicker, openChat } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import TransactionForm, { Modal } from '../components/TransactionForm.jsx';
import { AreaChart, DonutChart, RingGauge } from '../components/DashCharts.jsx';
import { api } from '../lib/api.js';
import { formatDate, money, monthKey, slotColor } from '../lib/format.js';
import { useCountUp } from '../lib/useCountUp.js';
import CountUp from '../components/CountUp.jsx';
import { ArtIcon, CategoryIcon, ReceiptArt, WalletArt } from '../components/Illustrations.jsx';
import { useAuth, useToast } from '../context/AppContext.jsx';

/* ---------------------------------------------------------------------------
   The dashboard.

   Three headline figures across the top, the category breakdown and the trend
   below them, and the most recent transactions underneath - the shape people
   already know how to read from a finance dashboard, so nothing has to be
   learned before the numbers can be.
--------------------------------------------------------------------------- */

// The things students log most often, one tap away. The description is what
// the categoriser reads, so each lands in the right category by itself.
const QUICK = [
  { label: 'Chai', art: 'hot_beverage', type: 'expense', description: 'Chai at the canteen' },
  { label: 'Rickshaw', art: 'bus', type: 'expense', description: 'Rickshaw to campus' },
  { label: 'Printing', art: 'books', type: 'expense', description: 'Printing notes' },
  { label: 'Allowance', art: 'dollar_banknote', type: 'income', description: 'Monthly allowance' },
];

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

  const quickAdd = (item) => {
    setPreset(item);
    setAdding(true);
  };

  // How much of the month's total budget has been used, for the health ring.
  const budgetHealth = useMemo(() => {
    const budgets = data?.budgets || [];
    const limit = budgets.reduce((acc, b) => acc + b.limitAmount, 0);
    const spent = budgets.reduce((acc, b) => acc + b.spent, 0);
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    return {
      limit,
      spent,
      pct,
      tone: pct >= 100 ? 'exceeded' : pct >= 80 ? 'warning' : 'ok',
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
  const [year, monthIndex] = month.split('-').map(Number);
  const monthName = new Date(Date.UTC(year, monthIndex - 1, 1)).toLocaleString('en', { month: 'long', timeZone: 'UTC' });

  if (!data) {
    return (
      <Layout title="Dashboard">
        <div className="dash-row">
          <div className="skeleton" style={{ height: 184 }} />
          <div className="skeleton" style={{ height: 184 }} />
          <div className="skeleton" style={{ height: 184 }} />
        </div>
        <div className="grid grid-2">
          <div className="skeleton" style={{ height: 300 }} />
          <div className="skeleton" style={{ height: 300 }} />
        </div>
      </Layout>
    );
  }

  const { totals, spending, budgets, trend, tips, recent, goal, insight, announcements } = data;
  const overspent = totals.expense > totals.income;

  return (
    <Layout
      title={`Good to see you, ${firstName}`}
      actions={
        <>
          <MonthPicker value={month} onChange={setMonth} />
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            <Icon name="plus" />
            Add
          </button>
        </>
      }
    >
      {announcements?.length ? (
        <div className="panel" style={{ borderLeft: '3px solid var(--accent)' }}>
          <div className="panel-body row" style={{ padding: '0.85rem 1.25rem' }}>
            <Icon name="bell" />
            <div>
              <strong>{announcements[0].title}</strong>
              <div className="small muted">{announcements[0].body}</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* --- The hero: the month in one sentence and four tiles ----------- */}
      <section className="dash-hero">
        <div className="dash-hero-text">
          <span className="eyebrow has-rule">{monthName} · your hisab</span>
          <h2>
            {overspent ? 'You spent' : 'You kept'}{' '}
            <span className="num">{money(Math.abs(kept), currency)}</span>
            {overspent ? ' more than came in.' : ' this month.'}
            <em>{overspent ? 'Time for a closer look.' : 'One clear picture.'}</em>
          </h2>
          <p>
            {totals.savingsRate === null
              ? 'Nothing has come in yet this month. Log your allowance and the picture fills in.'
              : `${totals.transactionCount} transactions so far. ${
                  overspent
                    ? `Spending is ${Math.abs(totals.savingsRate)}% ahead of what came in.`
                    : `That is ${totals.savingsRate}% of everything that came in.`
                }`}
          </p>
          <div className="dash-hero-actions">
            <button type="button" className="btn btn-sky" onClick={() => setAdding(true)}>
              <Icon name="plus" />
              Add a transaction
            </button>
            <button type="button" className="dash-hero-link" onClick={openChat}>
              Ask Coin
              <Icon name="right" size={15} />
            </button>
          </div>
        </div>

        <div className="money-tiles">
          <Link to="/reports" className="money-tile is-in">
            <ArtIcon name="dollar_banknote" className="money-tile-art" />
            <span className="money-tile-value num">
              <CountUp value={totals.income} currency={currency} />
            </span>
            <span className="money-tile-label">Money in</span>
          </Link>
          <Link to="/transactions" className="money-tile is-out">
            <ArtIcon name="money_with_wings" className="money-tile-art" />
            <span className="money-tile-value num">
              <CountUp value={totals.expense} currency={currency} />
            </span>
            <span className="money-tile-label">Money out</span>
          </Link>
          <Link to="/budgets" className="money-tile is-budget">
            <ArtIcon name="bullseye" className="money-tile-art" />
            <span className="money-tile-value num">
              {budgetHealth.limit > 0 ? `${Math.round(budgetHealth.pct)}%` : '—'}
            </span>
            <span className="money-tile-label">
              {budgetHealth.limit > 0 ? 'Of budgets used' : 'No budgets yet'}
            </span>
          </Link>
          <Link to="/tips" className="money-tile is-goal">
            <ArtIcon name="seedling" className="money-tile-art" />
            <span className="money-tile-value num">
              {goal.target > 0 ? money(goal.target, currency) : tips.length}
            </span>
            <span className="money-tile-label">{goal.target > 0 ? 'Savings goal' : 'Saving tips'}</span>
          </Link>
        </div>
      </section>

      {/* --- Quick add, top category, coming up ------------------------- */}
      <div className="dash-row dash-row-3">
        <section className="panel">
          <div className="panel-head">
            <h2>Quick add</h2>
            <span className="panel-note">One tap, then the amount</span>
          </div>
          <div className="panel-body quick-grid">
            {QUICK.map((item) => (
              <button key={item.label} type="button" className="quick-btn" onClick={() => quickAdd(item)}>
                <ArtIcon name={item.art} size={40} />
                <span>{item.label}</span>
                <small>{item.type === 'income' ? 'money in' : 'money out'}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="panel top-cat">
          <div className="panel-head">
            <h2>Top category</h2>
            <span className="panel-note">This month</span>
          </div>
          <div className="panel-body">
            {spending.length ? (
              <>
                <div className="top-cat-hero">
                  <CategoryIcon icon={spending[0].icon} slot={spending[0].slot} size={72} />
                  <div>
                    <strong>{spending[0].name}</strong>
                    <span className="num">{money(spending[0].total, currency)}</span>
                  </div>
                </div>
                <div className="top-cat-bar" aria-label={`${spending[0].share}% of spending`}>
                  <i style={{ width: `${spending[0].share}%`, background: slotColor(spending[0].slot) }} />
                </div>
                <p className="small muted" style={{ margin: '0.6rem 0 0' }}>
                  {spending[0].share}% of everything you spent
                  {spending[1] ? `, ahead of ${spending[1].name} at ${spending[1].share}%` : ''}.
                </p>
              </>
            ) : (
              <p className="muted small">Nothing spent yet this month.</p>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Coming up</h2>
            <Link className="btn btn-ghost btn-sm" to="/transactions">
              All
            </Link>
          </div>
          <div className="panel-body">
            {upcoming.length ? (
              <ul className="upcoming">
                {upcoming.map((row) => (
                  <li key={row._id}>
                    <CategoryIcon icon={row.category?.icon} slot={row.category?.slot} size={36} />
                    <span className="upcoming-main">
                      <strong>{row.description || row.category?.name}</strong>
                      <span>
                        {formatDate(row.recurring.nextRun, { day: 'numeric', month: 'short' })} · {row.recurring.frequency}
                      </span>
                    </span>
                    <span className={`num upcoming-amount${row.type === 'income' ? ' is-in' : ''}`}>
                      {row.type === 'income' ? '+' : '−'}
                      {money(row.amount, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">Nothing repeats yet. Tick "This repeats" when you add an allowance or a subscription.</p>
            )}
          </div>
        </section>
      </div>

      {/* --- Breakdown and trend ---------------------------------------- */}
      <div className="dash-row dash-row-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Spending analysis</h2>
            <Link className="btn btn-ghost btn-sm" to="/reports">
              Full report
            </Link>
          </div>
          <div className="panel-body">
            <DonutChart rows={spending} currency={currency} total={totals.expense} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Cash flow trend</h2>
            <span className="panel-note">Last six months</span>
          </div>
          <div className="panel-body">
            <AreaChart data={trend} currency={currency} />
          </div>
        </section>
      </div>

      {/* --- Recent transactions ---------------------------------------- */}
      <section className="panel">
        <div className="panel-head">
          <h2>Recent transactions</h2>
          <Link className="btn btn-ghost btn-sm" to="/transactions">
            View all
          </Link>
        </div>
        <div className="panel-body">
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
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th className="tx-hide">Date</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => (
                    <tr key={row._id}>
                      <td>
                        <div className="tx-name">
                          <CategoryIcon icon={row.category?.icon} slot={row.category?.slot} />
                          <span>{row.description || row.category?.name}</span>
                          {row.flags?.includes('duplicate') ? <span className="pill is-warn">duplicate?</span> : null}
                          {row.flags?.includes('large') ? <span className="pill is-warn">unusual</span> : null}
                        </div>
                      </td>
                      <td className="tx-date tx-hide">{formatDate(row.date, { day: 'numeric', month: 'short' })}</td>
                      <td>
                        <span
                          className="tx-cat"
                          style={{
                            background: `color-mix(in srgb, ${slotColor(row.category?.slot)} 16%, transparent)`,
                            color: slotColor(row.category?.slot),
                          }}
                        >
                          {row.category?.name}
                        </span>
                      </td>
                      <td className={`tx-amount${row.type === 'income' ? ' is-in' : ''}`}>
                        {row.type === 'income' ? '+' : '−'}
                        {money(row.amount, currency).replace('−', '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* --- Advice ------------------------------------------------------ */}
      <div className="dash-row dash-row-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Worth doing</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={refreshTips}>
              <Icon name="repeat" size={14} />
              Refresh
            </button>
          </div>
          <div className="panel-body">
            {tips.length === 0 ? (
              <p className="muted small">
                Tips appear once there is a couple of weeks of history to compare against.
              </p>
            ) : (
              <>
                {tips.map((tip) => (
                  <div className="tip" key={tip._id}>
                    <span className="tip-impact num">{tip.impact > 0 ? money(tip.impact, currency) : 'Start'}</span>
                    <div>
                      <h4>{tip.title}</h4>
                      <p>{tip.body}</p>
                    </div>
                  </div>
                ))}
                <Link className="btn btn-sm" to="/tips" style={{ marginTop: '0.85rem' }}>
                  All saving tips
                </Link>
              </>
            )}
          </div>
        </section>

        <div className="stack">
          <section className="panel receipt-promo">
            <div className="panel-body art-panel">
              <ReceiptArt />
              <div className="stack" style={{ gap: '0.5rem' }}>
                <span className="eyebrow">New</span>
                <h3>Snap a receipt</h3>
                <p className="small muted" style={{ margin: 0 }}>
                  Take a photo and Campus Coin reads the amount, the shop and the date for you, right on this device.
                </p>
                <button type="button" className="btn btn-primary btn-sm" style={{ justifySelf: 'start' }} onClick={() => setAdding(true)}>
                  <Icon name="camera" size={14} />
                  Scan a receipt
                </button>
              </div>
            </div>
          </section>

          <section className="panel kpi">
            <div className="kpi-head">
              <span>Budget health</span>
              <Link className="btn btn-ghost btn-sm" to="/budgets">
                Manage
              </Link>
            </div>

            {budgets.length === 0 ? (
              <div className="kpi-sub" style={{ marginTop: '0.6rem' }}>
                No caps set this month. One budget on your biggest category is the change most students actually
                keep to.
                <div style={{ marginTop: '0.85rem' }}>
                  <Link className="btn btn-sm" to="/budgets">
                    Set a budget
                  </Link>
                </div>
              </div>
            ) : (
              <div className="kpi-split" style={{ marginTop: '0.5rem' }}>
                <div className="kpi-budgets">
                  {budgets.slice(0, 3).map((budget) => (
                    <div className="kpi-budget-row" key={budget._id}>
                      <div className="kpi-budget-head">
                        <span>{budget.category.name}</span>
                        <span className="num">{budget.pct}%</span>
                      </div>
                      <div className="kpi-budget-track">
                        <div
                          className="kpi-budget-fill"
                          style={{
                            width: `${Math.min(100, budget.pct)}%`,
                            background:
                              budget.state === 'exceeded'
                                ? 'var(--bad)'
                                : budget.state === 'warning'
                                  ? 'var(--warn)'
                                  : slotColor(budget.category.slot),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <RingGauge pct={budgetHealth.pct} label="of your budgets used" tone={budgetHealth.tone} />
              </div>
            )}
          </section>

          {insight ? (
            <section className="panel">
              <div className="panel-head">
                <h2>This month, in a sentence</h2>
              </div>
              <div className="panel-body stack">
                <p className="insight-quote">{insight.summaryText}</p>
                <Link className="btn btn-sm" to="/insights">
                  Read the full insight
                </Link>
              </div>
            </section>
          ) : null}

          {goal.target > 0 ? (
            <section className="panel kpi" style={{ minHeight: 0 }}>
              <div className="kpi-head">
                <span>Savings goal</span>
                <Icon name="target" size={16} />
              </div>
              <div className="kpi-split" style={{ marginTop: '0.4rem' }}>
                <div>
                  <div className="kpi-figure" style={{ fontSize: 'var(--step-2)' }}>
                    <CountUp value={goal.kept} currency={currency} />
                  </div>
                  <div className="kpi-sub">of {money(goal.target, currency)} this month</div>
                </div>
                <RingGauge
                  pct={goal.pct ?? 0}
                  label="of your savings goal"
                  tone={goal.kept < 0 ? 'exceeded' : 'ok'}
                />
              </div>
            </section>
          ) : null}
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
