import { Link } from 'react-router-dom';
import Icon, { BrandMark } from '../components/Icon.jsx';
import { useTheme } from '../context/AppContext.jsx';
import { SITEMAP } from './Sitemap.jsx';

/* ---------------------------------------------------------------------------
   The public page.

   The product's actual promise is one honest sentence a month, so that sentence
   is the hero rather than a stock dashboard shot. Everything below it exists to
   answer the only question a student really has: where does that sentence come
   from, and can I trust it?

   The figures on this page are the real output of the seeded demo account, not
   invented marketing numbers - you can sign in and find every one of them.
--------------------------------------------------------------------------- */

const STEPS = [
  {
    n: '1',
    title: 'You log what you spend',
    body: 'Type "canteen chai" and the category fills itself in. Your allowance and your subscriptions add themselves each month.',
  },
  {
    n: '2',
    title: 'It compares you to you',
    body: 'Not to a budget someone else wrote. Every figure is measured against your own three-month average, so the comparison means something.',
  },
  {
    n: '3',
    title: 'You get a number you can act on',
    body: 'Each tip says what it is worth per month, and the list is ordered by that. The top one is the one that moves the most money.',
  },
];

// Each of these is checkable against the code, not a marketing figure: twelve
// seeded default categories, six months of demo history, and seven rules in the
// tips engine that look for money (the eighth only fires on an empty account).
const FACTS = [
  { value: '0', label: 'bank connections' },
  { value: '12', label: 'categories to start from' },
  { value: '6', label: 'months of demo history' },
  { value: '7', label: 'ways it looks for savings' },
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

      {/* One orchestrated entrance, staggered down the hero. Nothing else on the
          page animates on load. */}
      <header className="hero">
        <div className="hero-copy">
          <h1 className="reveal" style={{ '--d': '0ms' }}>
            Money is easier to fix when you can see it.
          </h1>
          <p className="lead reveal" style={{ '--d': '70ms' }}>
            A budget tracker built for the way students are actually paid: an allowance that arrives when it
            arrives, a bit of tutoring money, a scholarship instalment if you are lucky.
          </p>
          <div className="hero-actions reveal" style={{ '--d': '140ms' }}>
            <Link className="btn btn-primary" to="/register">
              Start tracking
            </Link>
            <Link className="btn" to="/login">
              Try the demo account
            </Link>
          </div>
          <p className="hero-fine reveal" style={{ '--d': '200ms' }}>
            No bank login. No card details. No subscription.
          </p>
        </div>

        {/* The product's real output, at the size it deserves. */}
        <figure className="hero-quote reveal" style={{ '--d': '260ms' }}>
          <div className="hero-quote-label">September, on the demo account</div>
          <blockquote>
            Subscriptions rose <em>39%</em> against your recent average, from about Rs&nbsp;1,840 to
            Rs&nbsp;2,564.
          </blockquote>
          <figcaption>
            <span className="pill is-accent">
              <Icon name="bulb" size={12} />
              What to do
            </span>
            Try a weekly cap of about Rs&nbsp;483 on Subscriptions next month. That puts it back near the level
            you were already comfortable with rather than asking you to cut it out.
          </figcaption>
        </figure>
      </header>

      <section className="facts">
        {FACTS.map((fact) => (
          <div key={fact.label}>
            <div className="facts-value">{fact.value}</div>
            <div className="facts-label">{fact.label}</div>
          </div>
        ))}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Where that sentence comes from</h2>
          <p>
            Nothing on this page is a stock figure. Campus Coin computes every number from your own
            transactions before it writes a word, which is why a summary can never disagree with your report.
          </p>
        </div>

        {/* Numbered because this genuinely is a sequence - each step needs the
            one before it. */}
        <ol className="steps">
          {STEPS.map((step) => (
            <li key={step.n}>
              <span className="steps-n">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <div className="split">
          <div className="section-head">
            <h2>A month, the way it actually looks</h2>
            <p>
              Your spending split by category, with each budget cap marked on its own bar. This is the demo
              account&rsquo;s September - an overspent month, shown as one.
            </p>
            <Link className="btn" to="/login">
              Open the full dashboard
            </Link>
          </div>

          <div className="panel showcase">
            <div className="showcase-head">
              <div>
                <div className="panel-note">Kept this month</div>
                <div className="showcase-figure" style={{ color: 'var(--bad)' }}>
                  &minus;Rs&nbsp;1,491
                </div>
              </div>
              <div className="showcase-keys">
                <span className="gauge-key">
                  <i className="swatch" style={{ background: 'var(--series-in)' }} /> In{' '}
                  <strong className="num">Rs&nbsp;38,074</strong>
                </span>
                <span className="gauge-key">
                  <i className="swatch" style={{ background: 'var(--series-out)' }} /> Out{' '}
                  <strong className="num">Rs&nbsp;39,565</strong>
                </span>
              </div>
            </div>

            <div className="spine">
              {[
                { name: 'Hostel/Rent', amount: 'Rs 12,000', share: 30, slot: 2, width: 100 },
                { name: 'Food', amount: 'Rs 10,941', share: 28, slot: 1, width: 91, cap: 75 },
                { name: 'Academics', amount: 'Rs 6,178', share: 16, slot: 4, width: 51 },
                { name: 'Transport', amount: 'Rs 2,884', share: 7, slot: 3, width: 24, cap: 29 },
              ].map((row) => (
                <div className="spine-row" key={row.name}>
                  <div className="spine-name">
                    <i className="swatch" style={{ background: `var(--cat-${row.slot})` }} />
                    <span>{row.name}</span>
                    {row.cap && row.width > row.cap ? <span className="pill is-bad">over cap</span> : null}
                  </div>
                  <div className="spine-amount num">
                    {row.amount} <span className="muted small">{row.share}%</span>
                  </div>
                  <div className="spine-bar">
                    <div className="spine-fill" style={{ width: `${row.width}%`, background: `var(--cat-${row.slot})` }} />
                    {row.cap ? <div className="spine-cap" style={{ left: `${row.cap}%` }} /> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>About the assistant</h2>
          <p>
            Two separate things get called AI here, and only one of them is a language model. Both are
            explained in full inside the app, and both can be switched off.
          </p>
        </div>

        <div className="grid grid-2">
          <div className="panel">
            <div className="panel-body">
              <h3>Sorting your spending</h3>
              <p className="muted small">
                Runs entirely on Campus Coin&rsquo;s own server, with no external service involved. It counts
                the words you use against the categories you pick, so correcting it is how it learns. Every
                suggestion shows its confidence and its reason, and you can always overrule it.
              </p>
            </div>
          </div>
          <div className="panel">
            <div className="panel-body">
              <h3>Writing the monthly summary</h3>
              <p className="muted small">
                Campus Coin works out every figure first, then optionally asks Claude to put those
                already-calculated facts into friendlier words. The model is never asked to do arithmetic.
                Without an API key the built-in writer does it instead, and the app tells you which one wrote
                what you are reading.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="panel">
          <div className="panel-head">
            <h2>Try it without signing up</h2>
            <span className="panel-note">Seeded with six months of history</span>
          </div>
          <div className="panel-body stack">
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
        </div>
      </section>

      {/* The SRS asks for a sitemap on the home page, so the whole structure of
          the application is visible before you sign in. */}
      <section className="section">
        <div className="section-head">
          <h2>Everything in Campus Coin</h2>
        </div>
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
      </section>

      <footer className="landing-footer">
        <div className="brand">
          <BrandMark size={24} />
          Campus Coin
        </div>
        <p>
          A student project built for the Aptech End-to-End Web Solutions category. It holds no real money,
          connects to no bank, and its suggestions are prompts to look closer &mdash; not financial advice.
        </p>
      </footer>
    </div>
  );
}
