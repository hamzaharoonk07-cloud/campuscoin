import { Link } from 'react-router-dom';
import Icon, { BrandMark } from '../components/Icon.jsx';
import { useTheme } from '../context/AppContext.jsx';
import { SITEMAP } from './Sitemap.jsx';

const FEATURES = [
  {
    title: 'Logging takes seconds',
    body: 'Type what you bought and the category fills itself in. Recurring things like your allowance and subscriptions write themselves each month.',
  },
  {
    title: 'Advice from your own numbers',
    body: 'Every tip names a real figure from your history and says what it is worth. No generic lectures about skipping coffee.',
  },
  {
    title: 'Budgets you will actually notice',
    body: 'Set a cap on one category and Campus Coin tells you when you are close to it - not after you have gone past.',
  },
  {
    title: 'A plain summary each month',
    body: 'One short paragraph on what changed, what it cost, and one thing worth trying next month. Past months stay readable.',
  },
];

export default function Landing() {
  const { theme, toggle } = useTheme();

  return (
    <div className="landing">
      <nav className="landing-nav">
        <Link to="/" className="brand">
          <BrandMark />
          Campus Coin
        </Link>
        <span className="spacer" />
        <button type="button" className="icon-btn" onClick={toggle} aria-label="Switch theme">
          <Icon name={theme === 'light' ? 'moon' : 'sun'} />
        </button>
        <Link className="btn btn-sm" to="/login">
          Sign in
        </Link>
        <Link className="btn btn-sm btn-primary" to="/register">
          Create an account
        </Link>
      </nav>

      <header className="hero">
        <div>
          <h1>Money is easier to fix when you can see it.</h1>
          <p className="lead">
            Campus Coin is a budget tracker built for the way students are actually paid: an allowance that
            arrives when it arrives, a bit of tutoring money, and a scholarship instalment if you are lucky.
            No bank login, no subscription.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/register">
              Start tracking
            </Link>
            <Link className="btn" to="/login">
              I already have an account
            </Link>
          </div>
        </div>

        {/* The hero shows the product's actual output rather than a stock chart:
            this is the shape of a real month, and the sentence a student gets. */}
        <div className="panel" style={{ padding: '1.25rem' }}>
          <div className="stack">
            <div>
              <div className="panel-note">September, so far</div>
              <div className="num" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step-3)', fontWeight: 800, letterSpacing: '-0.04em' }}>
                Rs&nbsp;39,565 out
              </div>
            </div>
            <div className="gauge-track" aria-hidden="true">
              <div className="gauge-fill is-out" style={{ width: '76%' }} />
              <div className="gauge-fill is-left" style={{ width: '24%' }} />
            </div>
            <div className="spine">
              {[
                // Slots match the seeded defaults, so the preview and the real
                // app colour the same category the same way.
                { name: 'Hostel/Rent', share: 30, slot: 2 },
                { name: 'Food', share: 28, slot: 1 },
                { name: 'Transport', share: 14, slot: 3 },
              ].map((row) => (
                <div className="spine-row" key={row.name}>
                  <div className="spine-name">
                    <i className="swatch" style={{ background: `var(--cat-${row.slot})` }} />
                    <span>{row.name}</span>
                  </div>
                  <div className="spine-amount num muted small">{row.share}%</div>
                  <div className="spine-bar">
                    <div className="spine-fill" style={{ width: `${row.share * 3}%`, background: `var(--cat-${row.slot})` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="insight-quote" style={{ fontSize: 'var(--step-0)' }}>
              &ldquo;Subscriptions rose 39% against your recent average. Try a weekly cap of about Rs&nbsp;483 next
              month.&rdquo;
            </p>
          </div>
        </div>
      </header>

      <section className="feature-list">
        {FEATURES.map((feature) => (
          <div className="feature" key={feature.title}>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </div>
        ))}
      </section>

      <section className="panel" style={{ marginBottom: '3rem' }}>
        <div className="panel-head">
          <h2>Try it without signing up</h2>
        </div>
        <div className="panel-body stack">
          <p className="muted">
            These accounts are seeded with six months of history so every chart, budget and tip has something real
            behind it.
          </p>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Password</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Student</td>
                  <td>student@campuscoin.app</td>
                  <td>Student@12345</td>
                </tr>
                <tr>
                  <td>Student</td>
                  <td>bilal@campuscoin.app</td>
                  <td>Student@12345</td>
                </tr>
                <tr>
                  <td>Administrator</td>
                  <td>admin@campuscoin.app</td>
                  <td>Admin@12345</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="row row-wrap">
            <Link className="btn btn-primary" to="/login">
              Sign in as a student
            </Link>
            <Link className="btn" to="/admin/login">
              Administrator sign-in
            </Link>
          </div>
        </div>
      </section>

      {/* The SRS asks for a sitemap on the home page, so the whole structure of
          the application is visible before you sign in. */}
      <section className="panel" style={{ marginBottom: '3rem' }}>
        <div className="panel-head">
          <h2>Sitemap</h2>
          <span className="panel-note">Every page in Campus Coin</span>
        </div>
        <div className="panel-body">
          <div className="sitemap">
            {SITEMAP.map((group) => (
              <div key={group.title}>
                <h3>{group.title}</h3>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="muted small" style={{ paddingBottom: '3rem' }}>
        Campus Coin is a student project. It holds no real money, connects to no bank, and its suggestions are
        prompts to look closer - not financial advice.
      </footer>
    </div>
  );
}
