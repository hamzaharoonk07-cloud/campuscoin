import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout, { MonthPicker, openChat } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import CoinBot from '../components/CoinBot.jsx';
import TransactionForm, { Modal } from '../components/TransactionForm.jsx';
import { CashflowBars, DonutChart } from '../components/DashCharts.jsx';
import { api } from '../lib/api.js';
import { formatDate, money, monthKey, slotColor } from '../lib/format.js';
import { useCountUp } from '../lib/useCountUp.js';
import CountUp from '../components/CountUp.jsx';
import { CategoryIcon, WalletArt } from '../components/Illustrations.jsx';
import { useAuth, useToast } from '../context/AppContext.jsx';

/* ---------------------------------------------------------------------------
   The dashboard.

   Laid out like a finance dashboard people already know how to read: the
   balance and the month's three figures across the top, the cash flow and the
   assistant beside it, then the recent transactions, where the money went and
   quick add. Everything below that is advice.
--------------------------------------------------------------------------- */

// The things students log most often, one tap away. The description is what
// the categoriser reads, so each lands in the right category by itself.
const QUICK = [
  { label: 'Chai', icon: 'utensils', type: 'expense', description: 'Chai at the canteen' },
  { label: 'Rickshaw', icon: 'bus', type: 'expense', description: 'Rickshaw to campus' },
  { label: 'Printing', icon: 'book', type: 'expense', description: 'Printing notes' },
  { label: 'Allowance', icon: 'wallet', type: 'income', description: 'Monthly allowance' },
];

// Starting points for the assistant card.
const ASK = ['How much on food?', 'Am I over budget?', 'Where can I save?'];

/** The change from last month as a small chip: "+12%" or "−8%". */
function Delta({ now, before, goodWhenUp = true }) {
  if (!before) return <span className="delta is-flat">New</span>;
  const pct = Math.round(((now - before) / Math.abs(before)) * 100);
  if (pct === 0) return <span className="delta is-flat">0%</span>;
  const good = pct > 0 === goodWhenUp;
  return (
    <span className={`delta ${good ? 'is-good' : 'is-bad'}`} title="Compared with last month">
      {pct > 0 ? '↑' : '↓'} {Math.abs(pct)}%
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
  const [question, setQuestion] = useState('');

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

  const ask = (event) => {
    event.preventDefault();
    if (!question.trim()) return;
    openChat(question.trim());
    setQuestion('');
  };

  // How much of the month's total budget has been used, for the score card.
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

  if (!data) {
    return (
      <Layout title="Dashboard">
        <div className="fx-row fx-top">
          <div className="skeleton" style={{ height: 210 }} />
          <div className="skeleton" style={{ height: 210 }} />
          <div className="skeleton" style={{ height: 210 }} />
        </div>
        <div className="fx-row fx-mid">
          <div className="skeleton" style={{ height: 340 }} />
          <div className="skeleton" style={{ height: 340 }} />
        </div>
      </Layout>
    );
  }

  const { totals, spending, budgets, trend, tips, recent, goal, insight, announcements } = data;
  const overspent = totals.expense > totals.income;
  // Last month, for the change chips: the trend ends with the month shown.
  const before = trend.length > 1 ? trend[trend.length - 2] : null;
  const scoreWord =
    budgetHealth.limit === 0 ? 'No budgets' : budgetHealth.tone === 'exceeded' ? 'Over' : budgetHealth.tone === 'warning' ? 'Tight' : 'Healthy';

  return (
    <Layout
      title={`Welcome back, ${firstName}`}
      actions={<MonthPicker value={month} onChange={setMonth} />}
    >
      {announcements?.length ? (
        <div className="fx-notice">
          <Icon name="bell" size={16} />
          <strong>{announcements[0].title}</strong>
          <span>{announcements[0].body}</span>
        </div>
      ) : null}

      {/* --- Row 1: balance, the month, budget score ----------------------- */}
      <div className="fx-row fx-top">
        <section className="fx-balance">
          <div className="fx-balance-head">
            <span>{overspent ? 'Spent beyond income' : 'Kept this month'}</span>
            <Link to="/reports" className="fx-circle" aria-label="Open reports">
              <Icon name="right" size={16} />
            </Link>
          </div>
          <div className="fx-balance-figure num">{money(Math.abs(kept), currency)}</div>
          <p className="fx-balance-note">
            {totals.savingsRate === null
              ? 'Nothing has come in yet. Log your allowance to begin.'
              : overspent
                ? `Spending is ${Math.abs(totals.savingsRate)}% ahead of what came in.`
                : `${totals.savingsRate}% of everything that came in, across ${totals.transactionCount} transactions.`}
          </p>
          <div className="fx-balance-actions">
            <button type="button" className="fx-pill is-light" onClick={() => setAdding(true)}>
              <Icon name="plus" size={16} />
              Add
            </button>
            <button type="button" className="fx-pill is-dark" onClick={() => setAdding(true)}>
              <Icon name="camera" size={16} />
              Scan receipt
            </button>
          </div>
        </section>

        <section className="panel fx-card">
          <div className="fx-card-head">
            <h2>This month</h2>
            <Link to="/transactions" className="fx-link">
              View all
            </Link>
          </div>
          <div className="fx-mini-grid">
            <div className="fx-mini">
              <span className="fx-mini-icon is-in">
                <Icon name="download" size={16} />
              </span>
              <span className="fx-mini-label">Income</span>
              <strong className="num">
                <CountUp value={totals.income} currency={currency} />
              </strong>
              <Delta now={totals.income} before={before?.income} />
            </div>
            <div className="fx-mini">
              <span className="fx-mini-icon is-out">
                <Icon name="upload" size={16} />
              </span>
              <span className="fx-mini-label">Expense</span>
              <strong className="num">
                <CountUp value={totals.expense} currency={currency} />
              </strong>
              <Delta now={totals.expense} before={before?.expense} goodWhenUp={false} />
            </div>
            <div className="fx-mini">
              <span className="fx-mini-icon is-kept">
                <Icon name="coin" size={16} />
              </span>
              <span className="fx-mini-label">{goal.target > 0 ? 'Goal' : 'Kept'}</span>
              <strong className="num">
                {goal.target > 0 ? `${Math.max(0, Math.round(goal.pct ?? 0))}%` : <CountUp value={totals.balance} currency={currency} />}
              </strong>
              {goal.target > 0 ? (
                <span className="delta is-flat">of {money(goal.target, currency)}</span>
              ) : (
                <Delta now={totals.balance} before={before?.balance} />
              )}
            </div>
          </div>
        </section>

        <section className="panel fx-card fx-score">
          <div className="fx-card-head">
            <h2>Budget score</h2>
            <Link to="/budgets" className="fx-link">
              Manage
            </Link>
          </div>
          <div className="fx-score-body">
            <span className={`fx-score-word is-${budgetHealth.tone}`}>{scoreWord}</span>
            <div className="fx-score-figure num">
              {budgetHealth.limit > 0 ? (
                <>
                  {Math.round(budgetHealth.pct)}
                  <small>% used</small>
                </>
              ) : (
                '—'
              )}
            </div>
            <div className={`fx-score-bar is-${budgetHealth.tone}`} aria-hidden="true">
              <i style={{ width: `${Math.min(100, budgetHealth.pct)}%` }} />
            </div>
            <p className="fx-score-note">
              {budgetHealth.limit === 0
                ? 'Set one cap on your biggest category to start a score.'
                : budgetHealth.over > 0
                  ? `${budgetHealth.over} budget${budgetHealth.over > 1 ? 's are' : ' is'} over the limit.`
                  : `${money(Math.max(0, budgetHealth.limit - budgetHealth.spent), currency)} left across ${budgets.length} budget${budgets.length > 1 ? 's' : ''}.`}
            </p>
          </div>
        </section>
      </div>

      {/* --- Row 2: cash flow and the assistant ---------------------------- */}
      <div className="fx-row fx-mid">
        <section className="panel fx-card">
          <div className="fx-card-head">
            <h2>Cashflow</h2>
            <span className="fx-legend">
              <i className="is-in" /> Money in
              <i className="is-out" /> Money out
            </span>
            <span className="fx-tag">Last 6 months</span>
          </div>
          <CashflowBars data={trend} currency={currency} />
        </section>

        <section className="panel fx-card fx-assist">
          <div className="fx-assist-orb" aria-hidden="true">
            <CoinBot size={64} bubble={false} />
          </div>
          <h2>What can I help with?</h2>
          <p>Coin answers from your own transactions.</p>
          <div className="fx-assist-chips">
            {ASK.map((text) => (
              <button key={text} type="button" onClick={() => openChat(text)}>
                {text}
              </button>
            ))}
          </div>
          <form className="fx-assist-input" onSubmit={ask}>
            <input
              type="text"
              placeholder="Ask anything about your money..."
              aria-label="Ask Coin a question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button type="submit" aria-label="Send">
              <Icon name="send" size={16} />
            </button>
          </form>
        </section>
      </div>

      {/* --- Row 3: recent, where it went, quick add ----------------------- */}
      <div className="fx-row fx-low">
        <section className="panel fx-card">
          <div className="fx-card-head">
            <h2>Recent transactions</h2>
            <Link to="/transactions" className="fx-link">
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
              <table className="tx-table fx-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="tx-hide">Date</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th className="tx-hide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => {
                    const flagged = row.flags?.includes('duplicate') || row.flags?.includes('large');
                    return (
                      <tr key={row._id}>
                        <td>
                          <div className="tx-name">
                            <CategoryIcon icon={row.category?.icon} slot={row.category?.slot} />
                            <span className="fx-tx-copy">
                              <strong>{row.description || row.category?.name}</strong>
                              <span>{row.category?.name}</span>
                            </span>
                          </div>
                        </td>
                        <td className="tx-date tx-hide">{formatDate(row.date, { day: 'numeric', month: 'short' })}</td>
                        <td className={`tx-amount${row.type === 'income' ? ' is-in' : ''}`}>
                          {row.type === 'income' ? '+' : '−'}
                          {money(row.amount, currency).replace('−', '')}
                        </td>
                        <td className="tx-hide">
                          <span className={`fx-status ${flagged ? 'is-warn' : row.type === 'income' ? 'is-in' : 'is-out'}`}>
                            {flagged ? (row.flags.includes('duplicate') ? 'Duplicate?' : 'Unusual') : row.type === 'income' ? 'Money in' : 'Money out'}
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

        <section className="panel fx-card">
          <div className="fx-card-head">
            <h2>Spending</h2>
            <Link to="/reports" className="fx-link">
              Report
            </Link>
          </div>
          <DonutChart rows={spending} currency={currency} total={totals.expense} />
        </section>

        <section className="panel fx-card">
          <div className="fx-card-head">
            <h2>Quick add</h2>
            <span className="fx-tag">One tap</span>
          </div>
          <div className="fx-quick">
            {QUICK.map((item) => (
              <button key={item.label} type="button" onClick={() => quickAdd(item)}>
                <span className={`fx-quick-icon${item.type === 'income' ? ' is-in' : ''}`}>
                  <Icon name={item.icon} size={18} />
                </span>
                <span className="fx-quick-copy">
                  <strong>{item.label}</strong>
                  <span>{item.type === 'income' ? 'Money in' : 'Money out'}</span>
                </span>
                <Icon name="plus" size={16} />
              </button>
            ))}
          </div>
          <button type="button" className="fx-wide-btn" onClick={() => setAdding(true)}>
            <Icon name="plus" size={16} />
            New transaction
          </button>
        </section>
      </div>

      {/* --- Row 4: advice -------------------------------------------------- */}
      <div className="fx-row fx-advice">
        <section className="panel fx-card">
          <div className="fx-card-head">
            <h2>Worth doing</h2>
            <button type="button" className="fx-link" onClick={refreshTips}>
              <Icon name="repeat" size={14} />
              Refresh
            </button>
          </div>
          {tips.length === 0 ? (
            <p className="muted small">Tips appear once there is a couple of weeks of history to compare against.</p>
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
              <Link className="fx-link" to="/tips" style={{ marginTop: '0.85rem', display: 'inline-flex' }}>
                All saving tips
              </Link>
            </>
          )}
        </section>

        <section className="panel fx-card">
          <div className="fx-card-head">
            <h2>Coming up</h2>
            <Link className="fx-link" to="/transactions">
              All
            </Link>
          </div>
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

          {spending.length ? (
            <div className="fx-topcat">
              <span className="fx-mini-label">Top category</span>
              <div className="fx-topcat-row">
                <CategoryIcon icon={spending[0].icon} slot={spending[0].slot} size={32} />
                <strong>{spending[0].name}</strong>
                <span className="num">{spending[0].share}%</span>
              </div>
              <div className="top-cat-bar">
                <i style={{ width: `${spending[0].share}%`, background: slotColor(spending[0].slot) }} />
              </div>
            </div>
          ) : null}
        </section>

        {insight ? (
          <section className="panel fx-card fx-insight">
            <span className="fx-tag">
              <Icon name="spark" size={13} />
              Insight
            </span>
            <p className="insight-quote">{insight.summaryText}</p>
            <Link className="fx-link" to="/insights">
              Read the full insight
            </Link>
          </section>
        ) : null}
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
