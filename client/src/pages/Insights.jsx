import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout, { MonthPicker } from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../lib/api.js';
import { formatDate, money, monthKey, monthLabel } from '../lib/format.js';
import { useAuth, useToast } from '../context/AppContext.jsx';

export default function Insights() {
  const { currency, user } = useAuth();
  const toast = useToast();
  const [month, setMonth] = useState(monthKey());
  const [insight, setInsight] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [shareTo, setShareTo] = useState('');

  const load = useCallback(() => {
    api
      .get(`/insights/${month}`)
      .then((data) => {
        setInsight(data.insight);
        setAiEnabled(data.aiEnabled);
      })
      .catch((err) => toast.error('Could not load that month', err.message));
    api.get('/insights').then(({ insights }) => setHistory(insights)).catch(() => {});
  }, [month, toast]);

  useEffect(load, [load]);

  const regenerate = async () => {
    setBusy(true);
    try {
      const { insight: fresh } = await api.post(`/insights/${month}/generate`, {});
      setInsight(fresh);
      toast.success('Rebuilt from your current transactions');
    } catch (err) {
      toast.error('Could not rebuild it', err.message);
    } finally {
      setBusy(false);
    }
  };

  const bookmark = async () => {
    try {
      const { insight: updated } = await api.post(`/insights/${month}/bookmark`, {});
      setInsight(updated);
      toast.success(updated.bookmarked ? 'Saved to your bookmarks' : 'Removed from bookmarks');
    } catch (err) {
      toast.error('Could not save it', err.message);
    }
  };

  const share = async (event) => {
    event.preventDefault();
    try {
      const result = await api.post(`/insights/${month}/share`, { email: shareTo || user.email });
      if (result.sent) toast.success(result.message);
      else toast.push('Nothing was emailed', { body: result.message, tone: 'warn', ms: 9000 });
      setShareTo('');
    } catch (err) {
      toast.error('Could not send it', err.message);
    }
  };

  return (
    <Layout
      title="Monthly insights"
      crumbs={
        <>
          <Link to="/dashboard">Dashboard</Link> / <span>Insights</span>
        </>
      }
      actions={<MonthPicker value={month} onChange={setMonth} />}
    >
      <div className="grid grid-main">
        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <h2>{monthLabel(month)}</h2>
              {insight ? (
                <>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={bookmark}>
                    <Icon name="pin" size={14} />
                    {insight.bookmarked ? 'Bookmarked' : 'Bookmark'}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={regenerate} disabled={busy}>
                    <Icon name="repeat" size={14} />
                    Rebuild
                  </button>
                </>
              ) : null}
            </div>
            <div className="panel-body stack">
              {!insight ? (
                <div className="skeleton" style={{ height: 120 }} />
              ) : (
                <>
                  <p className="insight-quote">{insight.summaryText}</p>

                  <div className="panel" style={{ background: 'var(--accent-soft)', border: 0, padding: '1rem 1.15rem' }}>
                    <div className="row" style={{ alignItems: 'flex-start' }}>
                      <Icon name="bulb" />
                      <p style={{ margin: 0, color: 'var(--text)' }}>{insight.tipText}</p>
                    </div>
                  </div>

                  <p className="small muted">
                    {insight.engine === 'llm'
                      ? 'Written by Claude from figures Campus Coin calculated itself.'
                      : 'Written by the built-in statistical engine from your own transactions.'}{' '}
                    Generated {formatDate(insight.generatedAt)}. This is a prompt to look closer, not financial advice.
                  </p>
                </>
              )}
            </div>
          </section>

          {insight?.highlights?.length ? (
            <section className="panel">
              <div className="panel-head">
                <h3>What moved</h3>
                <span className="panel-note">Against your own recent average</span>
              </div>
              <div className="panel-body">
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th className="right">This month</th>
                        <th className="right">Your average</th>
                        <th className="right">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insight.highlights.map((row) => (
                        <tr key={row.categoryName}>
                          <td>{row.categoryName}</td>
                          <td className="right num">{money(row.amount, currency)}</td>
                          <td className="right num">{money(row.previousAmount, currency)}</td>
                          <td className="right num">
                            <span className={`pill is-${row.direction === 'up' ? 'bad' : 'good'}`}>
                              {row.direction === 'up' ? '+' : ''}
                              {Math.round(row.changePct)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ) : null}

          <section className="panel">
            <div className="panel-head">
              <h3>Send it to yourself</h3>
            </div>
            <div className="panel-body">
              <form className="row row-wrap" onSubmit={share}>
                <input
                  type="email"
                  placeholder={user?.email}
                  value={shareTo}
                  onChange={(e) => setShareTo(e.target.value)}
                  style={{ flex: '1 1 220px' }}
                  aria-label="Email address"
                />
                <button type="submit" className="btn">
                  <Icon name="mail" size={15} />
                  Send summary
                </button>
              </form>
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <h3>Earlier months</h3>
            </div>
            <div className="panel-body">
              {history.length === 0 ? (
                <p className="muted small">Nothing yet. Each month you use Campus Coin adds one here.</p>
              ) : (
                <div className="stack-sm">
                  {history.map((row) => {
                    const key = new Date(row.month).toISOString().slice(0, 7);
                    return (
                      <button
                        key={row._id}
                        type="button"
                        className="ledger-row"
                        style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}
                        onClick={() => setMonth(key)}
                      >
                        <span className="ledger-main">
                          <span className="ledger-title">
                            {monthLabel(key)} {row.bookmarked ? <Icon name="pin" size={13} /> : null}
                          </span>
                          <span className="ledger-sub">{row.stats?.topCategory ? `Most on ${row.stats.topCategory}` : 'No spending'}</span>
                        </span>
                        <span className="ledger-amount num" style={{ color: row.stats?.balance < 0 ? 'var(--bad)' : 'var(--good)' }}>
                          {money(row.stats?.balance || 0, currency)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {!aiEnabled ? (
            <section className="panel">
              <div className="panel-body">
                <p className="small muted">
                  Summaries are written by Campus Coin&rsquo;s own statistical engine. Setting an
                  <code> ANTHROPIC_API_KEY</code> on the server turns on the Claude-written version, which rewrites
                  the same figures in warmer language. The numbers never change either way.
                </p>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
