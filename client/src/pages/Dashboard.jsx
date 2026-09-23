import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout, { MonthPicker } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import TransactionForm, { Modal } from '../components/TransactionForm.jsx';
import { BudgetMeter, CategorySpine, TrendChart } from '../components/Charts.jsx';
import { api } from '../lib/api.js';
import { dayHeading, money, monthKey, slotColor } from '../lib/format.js';
import { useAuth, useToast } from '../context/AppContext.jsx';

export default function Dashboard() {
  const { user, currency } = useAuth();
  const toast = useToast();
  const [month, setMonth] = useState(monthKey());
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    api
      .get(`/reports/dashboard?month=${month}`)
      .then(setData)
      .catch((err) => toast.error('Could not load your dashboard', err.message));
  }, [month, toast]);

  useEffect(load, [load]);

  useEffect(() => {
    api.get('/categories').then(({ categories: list }) => setCategories(list)).catch(() => {});
  }, []);

  const onSaved = () => {
    setAdding(false);
    load();
  };

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
        <div className="skeleton" style={{ height: 150 }} />
        <div className="grid grid-main">
          <div className="skeleton" style={{ height: 320 }} />
          <div className="skeleton" style={{ height: 320 }} />
        </div>
      </Layout>
    );
  }

  const { totals, spending, budgets, trend, tips, recent, goal, insight, announcements, topCategory } = data;

  // The rail is scaled to whichever is larger, income or spending. That way an
  // overspent month shows the income line sitting *inside* the orange instead of
  // pinning the bar at 100% and hiding the fact entirely.
  const scale = Math.max(totals.income, totals.expense, 1);
  const spentPct = (totals.expense / scale) * 100;
  const incomePct = (totals.income / scale) * 100;
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

      {/* The month band. One number, said loudly, with the whole month behind it. */}
      <section className="band">
        <div className="band-figure">
          <div className="band-label">Kept this month</div>
          <div className={`band-amount num${totals.balance < 0 ? ' over' : ''}`} style={{ color: totals.balance < 0 ? 'var(--bad)' : undefined }}>
            {money(totals.balance, currency)}
          </div>
          <div className="band-sub">
            {totals.savingsRate === null
              ? 'Nothing has come in yet this month.'
              : totals.savingsRate >= 0
                ? `That is ${totals.savingsRate}% of what came in.`
                : `You have spent ${Math.abs(totals.savingsRate)}% more than came in.`}
          </div>
        </div>

        <div className="gauge">
          <div
            className="gauge-track"
            role="img"
            aria-label={`Spent ${money(totals.expense, currency)} of ${money(totals.income, currency)} received`}
          >
            <div className="gauge-fill is-out" style={{ width: `${spentPct}%` }} />
            <div className="gauge-fill is-left" style={{ width: `${Math.max(0, 100 - spentPct)}%` }} />
            {overspent ? (
              <div className="gauge-mark" style={{ left: `${incomePct}%` }} title={`Income ${money(totals.income, currency)}`} />
            ) : null}
          </div>
          <div className="gauge-keys">
            <span className="gauge-key">
              <i className="swatch" style={{ background: 'var(--series-in)' }} /> In{' '}
              <strong className="num">{money(totals.income, currency)}</strong>
            </span>
            <span className="gauge-key">
              <i className="swatch" style={{ background: 'var(--series-out)' }} /> Out{' '}
              <strong className="num">{money(totals.expense, currency)}</strong>
            </span>
            {overspent ? (
              <span className="gauge-key">
                <Icon name="alert" size={14} /> Everything right of the line came out of savings
              </span>
            ) : null}
            {topCategory ? (
              <span className="gauge-key">
                <i className="swatch" style={{ background: slotColor(topCategory.slot) }} /> Most on{' '}
                <strong>{topCategory.name}</strong>
              </span>
            ) : null}
            {goal.target > 0 ? (
              <span className="gauge-key">
                <Icon name="target" size={14} /> Goal{' '}
                <strong className="num">
                  {money(goal.kept, currency)} of {money(goal.target, currency)}
                </strong>
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid grid-main">
        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <h2>Where it went</h2>
              <Link className="btn btn-ghost btn-sm" to="/reports">
                Full report
              </Link>
            </div>
            <div className="panel-body">
              <CategorySpine
                rows={spending}
                currency={currency}
                budgets={budgets}
                emptyText="Add a few transactions and the split will appear here."
              />
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Six months at a glance</h2>
            </div>
            <div className="panel-body">
              <TrendChart data={trend} currency={currency} />
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Just added</h2>
              <Link className="btn btn-ghost btn-sm" to="/transactions">
                All transactions
              </Link>
            </div>
            <div className="panel-body">
              {recent.length === 0 ? (
                <div className="empty">
                  <h3>Nothing logged yet</h3>
                  <p>Start with the thing you bought most recently - it takes about five seconds.</p>
                  <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setAdding(true)}>
                    Add your first transaction
                  </button>
                </div>
              ) : (
                <div className="ledger">
                  {recent.map((row) => (
                    <div className="ledger-row" key={row._id} style={{ cursor: 'default' }}>
                      <span className="ledger-dot" style={{ background: slotColor(row.category?.slot) }}>
                        <Icon name={row.category?.icon} size={15} />
                      </span>
                      <span className="ledger-main">
                        <span className="ledger-title">{row.description || row.category?.name}</span>
                        <span className="ledger-sub">
                          {row.category?.name} &middot; {dayHeading(row.date)}
                          {row.flags?.includes('duplicate') ? <span className="pill is-warn">possible duplicate</span> : null}
                          {row.flags?.includes('large') ? <span className="pill is-warn">unusually large</span> : null}
                        </span>
                      </span>
                      <span className={`ledger-amount num${row.type === 'income' ? ' is-in' : ''}`}>
                        {row.type === 'income' ? '+' : '−'}
                        {money(row.amount, currency).replace('−', '')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <h3>Worth doing</h3>
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

          {insight ? (
            <section className="panel">
              <div className="panel-head">
                <h3>This month, in a sentence</h3>
              </div>
              <div className="panel-body stack">
                <p className="insight-quote">{insight.summaryText}</p>
                <Link className="btn btn-sm" to="/insights">
                  Read the full insight
                </Link>
              </div>
            </section>
          ) : null}

          <section className="panel">
            <div className="panel-head">
              <h3>Budgets</h3>
              <Link className="btn btn-ghost btn-sm" to="/budgets">
                Manage
              </Link>
            </div>
            <div className="panel-body">
              {budgets.length === 0 ? (
                <div className="stack-sm">
                  <p className="muted small">
                    No caps set yet. One budget on your biggest category is the change most people actually stick to.
                  </p>
                  <Link className="btn btn-sm" to="/budgets">
                    Set a budget
                  </Link>
                </div>
              ) : (
                <div className="spine">
                  {budgets.map((budget) => (
                    <BudgetMeter key={budget._id} budget={budget} currency={currency} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {adding ? (
        <Modal title="Add a transaction" onClose={() => setAdding(false)}>
          <TransactionForm categories={categories} onSaved={onSaved} onCancel={() => setAdding(false)} />
        </Modal>
      ) : null}
    </Layout>
  );
}
