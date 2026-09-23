import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout.jsx';
import { api } from '../../lib/api.js';
import { money, slotColor } from '../../lib/format.js';
import { useToast } from '../../context/AppContext.jsx';

export default function AdminOverview() {
  const toast = useToast();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get('/admin/stats')
      .then(setStats)
      .catch((err) => toast.error('Could not load the statistics', err.message));
  }, [toast]);

  if (!stats) {
    return (
      <Layout title="Usage overview">
        <div className="skeleton" style={{ height: 320 }} />
      </Layout>
    );
  }

  const maxSignup = Math.max(...stats.signups.map((s) => s.count), 1);
  const maxCategory = Math.max(...stats.topCategories.map((c) => c.count), 1);

  return (
    <Layout title="Usage overview">
      <div className="stat-row">
        <div className="stat">
          <div className="stat-label">Students</div>
          <div className="stat-value num">{stats.users.total}</div>
          <div className="stat-meta">{stats.users.activeLast30Days} signed in this month</div>
        </div>
        <div className="stat">
          <div className="stat-label">Transactions logged</div>
          <div className="stat-value num">{stats.transactions.total.toLocaleString()}</div>
          <div className="stat-meta">{stats.transactions.thisMonth} this month</div>
        </div>
        <div className="stat">
          <div className="stat-label">Income recorded</div>
          <div className="stat-value num">{money(stats.volume.income, 'PKR')}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Spending recorded</div>
          <div className="stat-value num">{money(stats.volume.expense, 'PKR')}</div>
        </div>
      </div>

      <div className="grid grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Most used categories</h2>
            <span className="panel-note">By number of transactions</span>
          </div>
          <div className="panel-body">
            <div className="spine">
              {stats.topCategories.map((row) => (
                <div className="spine-row" key={row.name}>
                  <div className="spine-name">
                    <i className="swatch" style={{ background: slotColor(row.slot) }} />
                    <span>{row.name}</span>
                    <span className="pill">{row.type === 'income' ? 'in' : 'out'}</span>
                  </div>
                  <div className="spine-amount num">{row.count.toLocaleString()}</div>
                  <div className="spine-bar">
                    <div
                      className="spine-fill"
                      style={{ width: `${(row.count / maxCategory) * 100}%`, background: slotColor(row.slot) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>New students</h2>
            <span className="panel-note">Last six months</span>
          </div>
          <div className="panel-body">
            {stats.signups.length === 0 ? (
              <p className="muted small">No sign-ups in this period.</p>
            ) : (
              <div className="spine">
                {stats.signups.map((row) => (
                  <div className="spine-row" key={row.month}>
                    <div className="spine-name">
                      <span>{row.month}</span>
                    </div>
                    <div className="spine-amount num">{row.count}</div>
                    <div className="spine-bar">
                      <div
                        className="spine-fill"
                        style={{ width: `${(row.count / maxSignup) * 100}%`, background: 'var(--series-in)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Manage</h2>
        </div>
        <div className="panel-body">
          <div className="row row-wrap">
            <Link className="btn" to="/admin/students">
              Student accounts
            </Link>
            <Link className="btn" to="/admin/categories">
              Default categories
            </Link>
            <Link className="btn" to="/admin/announcements">
              Announcements and tip templates
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
