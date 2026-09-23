import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout, { MonthPicker } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { CategorySpine, DayBars, TrendChart } from '../components/Charts.jsx';
import { api } from '../lib/api.js';
import { formatDate, money, monthKey } from '../lib/format.js';
import { useAuth, useToast } from '../context/AppContext.jsx';

export default function Reports() {
  const { currency, user } = useAuth();
  const toast = useToast();
  const [month, setMonth] = useState(monthKey());
  const [report, setReport] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [view, setView] = useState('daily');

  const load = useCallback(() => {
    api
      .get(`/reports/monthly?month=${month}`)
      .then(setReport)
      .catch((err) => toast.error('Could not build that report', err.message));
    api
      .get(`/reports/forecast?month=${month}`)
      .then(({ forecast: f }) => setForecast(f))
      .catch(() => {});
  }, [month, toast]);

  useEffect(load, [load]);

  const exportCsv = async () => {
    try {
      const csv = await api.text(`/transactions/export?month=${month}`);
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `campus-coin-${month}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Could not prepare the download', err.message);
    }
  };

  if (!report) {
    return (
      <Layout title="Reports">
        <div className="skeleton" style={{ height: 420 }} />
      </Layout>
    );
  }

  const { totals, expenses, income, daily, weekly, trend, budgets, pace, label } = report;

  return (
    <Layout
      title="Monthly report"
      crumbs={
        <>
          <Link to="/dashboard">Dashboard</Link> / <span>Reports</span>
        </>
      }
      actions={
        <>
          <MonthPicker value={month} onChange={setMonth} />
          <button type="button" className="btn btn-sm" onClick={() => window.print()}>
            <Icon name="download" size={15} />
            Save as PDF
          </button>
          <button type="button" className="btn btn-sm" onClick={exportCsv}>
            CSV
          </button>
        </>
      }
    >
      <div className="stat-row">
        <div className="stat">
          <div className="stat-label">Money in</div>
          <div className="stat-value num">{money(totals.income, currency)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Money out</div>
          <div className="stat-value num">{money(totals.expense, currency)}</div>
          <div className="stat-meta">{totals.transactionCount} transactions</div>
        </div>
        <div className="stat">
          <div className="stat-label">Kept</div>
          <div className="stat-value num" style={{ color: totals.balance < 0 ? 'var(--bad)' : 'var(--good)' }}>
            {money(totals.balance, currency)}
          </div>
          {totals.savingsRate !== null ? <div className="stat-meta">{totals.savingsRate}% of income</div> : null}
        </div>
        <div className="stat">
          <div className="stat-label">On a spending day</div>
          <div className="stat-value num">{money(pace.perActiveDay, currency)}</div>
          <div className="stat-meta">across {pace.activeDays} days with any spending</div>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{label}</h2>
          <div className="seg" role="group" aria-label="View">
            <button type="button" aria-pressed={view === 'daily'} onClick={() => setView('daily')}>
              By day
            </button>
            <button type="button" aria-pressed={view === 'weekly'} onClick={() => setView('weekly')}>
              By week
            </button>
          </div>
        </div>
        <div className="panel-body">
          {view === 'daily' ? (
            <DayBars data={daily} currency={currency} average={pace.perActiveDay} />
          ) : (
            <div className="spine">
              {weekly.map((week) => {
                const max = Math.max(...weekly.map((w) => w.total), 1);
                return (
                  <div className="spine-row" key={week.week}>
                    <div className="spine-name">
                      <span>Week {week.week}</span>
                      <span className="muted small">
                        {formatDate(week.from, { day: 'numeric', month: 'short' })} &ndash;{' '}
                        {formatDate(week.to, { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="spine-amount num">{money(week.total, currency)}</div>
                    <div className="spine-bar">
                      <div
                        className="spine-fill"
                        style={{ width: `${(week.total / max) * 100}%`, background: 'var(--series-out)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {pace.busiestDay ? (
            <p className="small muted" style={{ marginTop: '0.85rem' }}>
              The heaviest single day was {formatDate(pace.busiestDay.date)} at {money(pace.busiestDay.total, currency)}.
            </p>
          ) : null}
        </div>
      </section>

      <div className="grid grid-2">
        <section className="panel">
          <div className="panel-head">
            <h3>Where it went</h3>
          </div>
          <div className="panel-body">
            <CategorySpine rows={expenses} currency={currency} budgets={budgets} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Where it came from</h3>
          </div>
          <div className="panel-body">
            <CategorySpine rows={income} currency={currency} emptyText="No income logged for this month." />
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h3>Income against spending, last six months</h3>
        </div>
        <div className="panel-body">
          <TrendChart data={trend} currency={currency} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Next month, projected</h3>
        </div>
        <div className="panel-body">
          {!forecast?.available ? (
            <p className="muted small">{forecast?.reason || 'Not enough history yet.'}</p>
          ) : (
            <div className="stack">
              <div className="row row-wrap" style={{ gap: '2rem' }}>
                <div>
                  <div className="stat-label">Likely spending</div>
                  <div className="stat-value num">{money(forecast.expense, currency)}</div>
                </div>
                <div>
                  <div className="stat-label">Likely income</div>
                  <div className="stat-value num">{money(forecast.income, currency)}</div>
                </div>
                <div>
                  <div className="stat-label">Which leaves</div>
                  <div className="stat-value num" style={{ color: forecast.balance < 0 ? 'var(--bad)' : 'var(--good)' }}>
                    {money(forecast.balance, currency)}
                  </div>
                </div>
              </div>

              {/* The forecast says how rough it is rather than implying precision. */}
              <p className="small muted">
                Drawn as a straight line through your last {forecast.monthsUsed} months, so treat it as a direction
                rather than a number. It is <strong>{forecast.reliability}</strong> - the line usually sits about{' '}
                {money(forecast.margin, currency)} away from what actually happened.{' '}
                {forecast.trendPerMonth > 0
                  ? `Spending has been climbing by about ${money(forecast.trendPerMonth, currency)} a month.`
                  : forecast.trendPerMonth < 0
                    ? `Spending has been falling by about ${money(Math.abs(forecast.trendPerMonth), currency)} a month.`
                    : 'Spending has been steady.'}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>The numbers behind the charts</h3>
          <span className="panel-note">Every figure above, as a table</span>
        </div>
        <div className="panel-body table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Category</th>
                <th className="right">Spent</th>
                <th className="right">Share</th>
                <th className="right">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((row) => (
                <tr key={row.categoryId}>
                  <td>{row.name}</td>
                  <td className="right num">{money(row.total, currency)}</td>
                  <td className="right num">{row.share}%</td>
                  <td className="right num">{row.count}</td>
                </tr>
              ))}
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">
                    Nothing spent this month.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <p className="small muted">
        Report for {user?.name}, generated {formatDate(new Date())}.
      </p>
    </Layout>
  );
}
