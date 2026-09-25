import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Icon from '../components/Icon.jsx';
import { SproutArt } from '../components/Illustrations.jsx';
import { api } from '../lib/api.js';
import { money, monthKey } from '../lib/format.js';
import { useAuth, useToast } from '../context/AppContext.jsx';

export default function Tips() {
  const { currency } = useAuth();
  const toast = useToast();
  const [tips, setTips] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showDismissed, setShowDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api
      .get(`/tips${showDismissed ? '?all=1' : ''}`)
      .then((data) => {
        setTips(data.tips);
        setTemplates(data.templates);
      })
      .catch((err) => toast.error('Could not load your tips', err.message));
  }, [showDismissed, toast]);

  useEffect(load, [load]);

  const refresh = async () => {
    setBusy(true);
    try {
      const { tips: fresh } = await api.post('/tips/refresh', { month: monthKey() });
      setTips(fresh);
      toast.success('Rebuilt from your latest numbers');
    } catch (err) {
      toast.error('Could not refresh them', err.message);
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (tip, status) => {
    try {
      await api.patch(`/tips/${tip._id}`, { status });
      load();
    } catch (err) {
      toast.error('Could not update that tip', err.message);
    }
  };

  // Several tips can be about the same category - "Food is over budget" and
  // "14 small Food purchases" describe the same money. Adding every impact would
  // promise a saving twice, so only the largest tip per category counts.
  const best = new Map();
  for (const tip of tips.filter((t) => t.status !== 'dismissed')) {
    const key = tip.categoryName || tip.key;
    if (!best.has(key) || best.get(key) < tip.impact) best.set(key, tip.impact);
  }
  const total = [...best.values()].reduce((acc, value) => acc + value, 0);

  return (
    <Layout
      title="Saving tips"
      crumbs={
        <>
          <Link to="/dashboard">Dashboard</Link> / <span>Saving tips</span>
        </>
      }
      actions={
        <button type="button" className="btn btn-sm" onClick={refresh} disabled={busy}>
          {busy ? <span className="spinner" /> : <Icon name="repeat" size={15} />}
          Refresh
        </button>
      }
    >
      {total > 0 ? (
        <section className="band">
          <div className="band-figure">
            <div className="band-label">Worth up to</div>
            <div className="band-amount num">{money(total, currency)}</div>
            <div className="band-sub">a month, counting only the biggest tip per category</div>
          </div>
          <div className="band-art">
            <SproutArt />
          </div>
          <p className="muted" style={{ maxWidth: '52ch' }}>
            Every tip is built from your own transactions and carries an estimate of what it is worth. They are
            ordered by that estimate, so the one at the top is the one that moves the most money - not the easiest
            or the most obvious.
          </p>
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-head">
          <h2>{tips.length ? `${tips.filter((t) => t.status !== 'dismissed').length} tips for you` : 'Your tips'}</h2>
          <label className="check small">
            <input type="checkbox" checked={showDismissed} onChange={(e) => setShowDismissed(e.target.checked)} />
            Show dismissed
          </label>
        </div>
        <div className="panel-body">
          {tips.length === 0 ? (
            <div className="empty">
              <SproutArt />
              <h3>Nothing to suggest yet</h3>
              <p>
                Campus Coin builds every tip by comparing this month against your own history, so it needs a couple
                of weeks of transactions before it has anything worth saying.
              </p>
              <Link className="btn btn-primary" to="/transactions" style={{ marginTop: '1rem' }}>
                Log some transactions
              </Link>
            </div>
          ) : (
            tips.map((tip) => (
              <div className="tip" key={tip._id} style={{ opacity: tip.status === 'dismissed' ? 0.55 : 1 }}>
                <span className="tip-impact num">{tip.impact > 0 ? money(tip.impact, currency) : 'Start'}</span>
                <div>
                  <h4>
                    {tip.title}
                    {tip.status === 'pinned' ? (
                      <span className="pill is-accent" style={{ marginLeft: '0.5rem' }}>
                        <Icon name="pin" size={11} /> pinned
                      </span>
                    ) : null}
                  </h4>
                  <p>{tip.body}</p>
                  <div className="tip-actions">
                    {tip.status === 'dismissed' ? (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStatus(tip, 'active')}>
                        Bring it back
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setStatus(tip, tip.status === 'pinned' ? 'active' : 'pinned')}
                        >
                          <Icon name="pin" size={14} />
                          {tip.status === 'pinned' ? 'Unpin' : 'Pin it'}
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStatus(tip, 'dismissed')}>
                          Not useful
                        </button>
                        {tip.categoryName ? (
                          <Link className="btn btn-ghost btn-sm" to="/budgets">
                            Set a {tip.categoryName} budget
                          </Link>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {templates.length ? (
        <section className="panel">
          <div className="panel-head">
            <h3>From your college</h3>
            <span className="panel-note">Posted by an administrator, the same for everyone</span>
          </div>
          <div className="panel-body">
            {templates.map((template) => (
              <div className="tip" key={template._id}>
                <span className="tip-impact" style={{ background: 'var(--raised)', color: 'var(--muted)' }}>
                  <Icon name="bulb" size={15} />
                </span>
                <div>
                  <h4>{template.title}</h4>
                  <p>{template.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <p className="small muted">
        Pinned tips stay at the top even when they stop applying. Dismissed ones never come back on their own.
      </p>
    </Layout>
  );
}
