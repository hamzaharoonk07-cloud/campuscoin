import { useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon, { BrandMark } from '../components/Icon.jsx';
import { useLandingMotion } from '../lib/useLandingMotion.js';
import { SITEMAP } from './Sitemap.jsx';
import '../styles/landing.css';

/* ---------------------------------------------------------------------------
   The public page, built brutalist: hard edges, flat colour, visible grid,
   monospace labels, solid drop shadows and abrupt motion.

   It is deliberately a different object from the application. The app is a
   tool for reading your own money and stays quiet; this page has to stop
   someone scrolling.

   Every figure on it is real - all of it comes from the seeded demo account
   and you can sign in and check any of it.
--------------------------------------------------------------------------- */

const WORDS = [
  'Canteen chai', 'Rickshaw fare', 'Hostel rent', 'Spotify', 'Biryani',
  'Photocopy', 'Cinema ticket', 'Textbooks', 'Foodpanda', 'Bus card',
  'Laundry', 'Petrol', 'Semester fee', 'Eidi',
];

const STEPS = [
  {
    n: 'Step 01',
    title: 'Log it in seconds',
    body: 'Type what you bought and the category fills itself in. Your allowance and your subscriptions add themselves every month without you touching them.',
    shot: '/shots/dashboard.jpg',
  },
  {
    n: 'Step 02',
    title: 'See where it went',
    body: 'Category splits, daily and weekly views, six months side by side, and every budget cap marked on its own bar. No guessing at the end of the month.',
    shot: '/shots/reports.jpg',
  },
  {
    n: 'Step 03',
    title: 'Get told what to do',
    body: 'Every tip carries a number - what it is worth per month - and the list is ordered by that. The one at the top moves the most money.',
    shot: '/shots/tips.jpg',
  },
];

const STATS = [
  { value: 39, suffix: '%', label: 'Jump in subscriptions it caught last month' },
  { value: 7, suffix: '', label: 'Different ways it hunts for savings' },
  { value: 6, suffix: '', label: 'Months of history in the demo account' },
  { value: 0, suffix: '', label: 'Bank logins, card details or fees' },
];

const CARDS = [
  {
    icon: 'spark', tint: 'var(--yellow)', wide: true,
    title: 'It learns your words',
    body: 'Type "canteen chai" once and it remembers. Correcting a guess is exactly how it gets better, and every suggestion shows how sure it is and what it went on.',
  },
  {
    icon: 'target', tint: 'var(--pink)', wide: true,
    title: 'Budgets you notice',
    body: 'Set a cap on one category. Campus Coin tells you when you are getting close to it, not after you have sailed past it.',
  },
  {
    icon: 'repeat', tint: 'var(--lime)',
    title: 'Recurring, handled',
    body: 'Allowance and subscriptions write themselves in each month.',
  },
  {
    icon: 'upload', tint: 'var(--paper)',
    title: 'Bring your history',
    body: 'Import a CSV and it suggests a category for every row before saving a thing.',
  },
  {
    icon: 'alert', tint: 'var(--orange)',
    title: 'Catches your slips',
    body: 'Flags a double entry, or an amount far bigger than you normally spend there.',
  },
];

export default function Landing() {
  const page = useRef(null);
  useLandingMotion(page);

  return (
    <div className="lp" ref={page}>
      <div className="lp-wrap">
        <nav className="lp-nav">
          <Link to="/" className="lp-brand">
            <BrandMark size={30} />
            Campus Coin
          </Link>
          <span className="lp-spacer" />
          <Link className="lp-nav-link" to="/login">
            Sign in
          </Link>
          <Link className="lp-nav-link" style={{ background: 'var(--yellow)' }} to="/register">
            Get started
          </Link>
        </nav>

        <header className="lp-hero">
          <span className="lp-hero-tag lp-label" data-hero>
            Budget tracker / built for students
          </span>

          <h1 className="lp-mega">
            <span data-hero>Where</span>
            <span className="ln2" data-hero>did it</span>
            <span className="ln3" data-hero>all go?</span>
          </h1>

          <div className="lp-hero-body">
            <div data-hero>
              <p className="lp-lead">
                An allowance that turns up when it turns up. A bit of tutoring money. A scholarship instalment
                if you are lucky. Campus Coin is the budget tracker built for that, not for a salary.
              </p>
              <p className="lp-fine">No bank login / no card details / no subscription</p>
            </div>

            <div className="lp-cta-row" data-hero>
              <Link className="lp-btn lp-btn-main" to="/register">
                Start tracking
              </Link>
              <Link className="lp-btn" to="/login">
                Try the demo
              </Link>
            </div>
          </div>

          <div className="lp-shot" data-shot>
            <div className="lp-shot-main">
              <img
                src="/shots/dashboard.jpg"
                alt="The Campus Coin dashboard, showing a month's income, spending and category split"
              />
            </div>
            <div className="lp-shot-float" data-float>
              <img src="/shots/mobile-dashboard.jpg" alt="Campus Coin running on a phone" />
            </div>
          </div>
        </header>
      </div>

      {/* The things students actually spend on, running past. */}
      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee-track" data-marquee>
          {[...WORDS, ...WORDS].map((word, i) => (
            <span className="lp-marquee-item" key={`${word}-${i}`}>
              {word}
              <i />
            </span>
          ))}
        </div>
      </div>

      <div className="lp-wrap">
        <section className="lp-section">
          <div className="lp-section-head">
            <span className="lp-label">Figures / all checkable</span>
            <h2 className="lp-big">
              Real numbers,
              <br />
              <mark>not slogans.</mark>
            </h2>
          </div>

          <div className="lp-stats">
            {STATS.map((stat) => (
              <div className="lp-stat" key={stat.label}>
                <div className="lp-stat-value">
                  <span data-stat={stat.value}>{stat.value}</span>
                  {stat.suffix}
                </div>
                <div className="lp-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Scroll-driven: the steps light in turn and the plate beside them
          switches to the part of the app being described. */}
      <section className="lp-scene" data-scene>
        <div className="lp-wrap">
          <div className="lp-scene-sticky">
            <div className="lp-scene-steps">
              <span className="lp-label" style={{ display: 'block', marginBottom: '1rem' }}>
                How it works
              </span>
              <h2 className="lp-big">Three things.</h2>
              {STEPS.map((step, i) => (
                <article className={`lp-step${i === 0 ? ' is-on' : ''}`} key={step.n} data-step>
                  <span className="lp-step-n">{step.n}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              ))}
            </div>

            <div className="lp-scene-stage">
              {STEPS.map((step, i) => (
                <img
                  key={step.shot}
                  src={step.shot}
                  alt={step.title}
                  className={i === 0 ? 'is-on' : undefined}
                  data-stage
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="lp-wrap">
        <section className="lp-section">
          <div className="lp-section-head">
            <span className="lp-label">Features / all of them</span>
            <h2 className="lp-big">
              Small app.
              <br />
              <mark>Does a lot.</mark>
            </h2>
          </div>

          <div className="lp-bento">
            {CARDS.map((card) => (
              <article
                className={`lp-card${card.wide ? ' is-wide' : ''}`}
                key={card.title}
                style={{ '--tint': card.tint }}
                data-card
              >
                <span className="lp-card-icon">
                  <Icon name={card.icon} size={24} strokeWidth={2.2} />
                </span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-final" data-final>
            <span className="lp-label" style={{ display: 'block', marginBottom: '1rem', color: 'var(--yellow)' }}>
              Free / no card
            </span>
            <h2 className="lp-big">
              Six months from now
              <br />
              you will <mark>know</mark>.
            </h2>
            <p className="lp-lead">
              It takes about five seconds to log the thing you just bought. Everything else builds itself from
              there.
            </p>
            <div className="lp-cta-row">
              <Link className="lp-btn lp-btn-main" to="/register">
                Create account
              </Link>
              <Link className="lp-btn lp-btn-pink" to="/login">
                Look around first
              </Link>
            </div>
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-section-head">
            <span className="lp-label">Demo accounts / seeded with six months</span>
            <h2 className="lp-big">Try it now.</h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="lp-table">
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

          <div className="lp-cta-row" style={{ marginTop: '2rem' }}>
            <Link className="lp-btn lp-btn-blue" to="/login">
              Sign in as student
            </Link>
            <Link className="lp-btn" to="/admin/login">
              Administrator
            </Link>
          </div>
        </section>

        {/* The SRS asks for a sitemap on the home page. */}
        <section className="lp-section">
          <div className="lp-section-head">
            <span className="lp-label">Index</span>
            <h2 className="lp-big">Every page.</h2>
          </div>
          <div className="lp-sitemap">
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

        <footer className="lp-footer">
          <div className="lp-brand">
            <BrandMark size={26} />
            Campus Coin
          </div>
          <p>
            A student project built for the Aptech End-to-End Web Solutions category. It holds no real money,
            connects to no bank, and its suggestions are prompts to look closer &mdash; not financial advice.
          </p>
        </footer>
      </div>
    </div>
  );
}
