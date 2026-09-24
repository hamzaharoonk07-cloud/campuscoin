import { useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon, { BrandMark } from '../components/Icon.jsx';
import AssistantDemo from '../components/AssistantDemo.jsx';
import { useLandingMotion } from '../lib/useLandingMotion.js';
import { SITEMAP } from './Sitemap.jsx';
import '../styles/landing.css';

/* ---------------------------------------------------------------------------
   The public page.

   This is the one part of Campus Coin that is loud. The application itself is
   a tool for reading your own money and stays quiet; a landing page has a
   different job, so it gets the oversized type, the colour and the motion.

   The figures are still real - every number here comes from the seeded demo
   account, and you can sign in and check any of them.
--------------------------------------------------------------------------- */

const WORDS = [
  'Canteen chai', 'Rickshaw fare', 'Hostel rent', 'Spotify', 'Biryani with friends',
  'Photocopy', 'Cinema ticket', 'Textbooks', 'Foodpanda', 'Bus card',
  'Laundry', 'Petrol', 'Semester fee', 'Eidi',
];

const DOT_COLOURS = ['var(--lp-honey)', 'var(--lp-coral)', 'var(--lp-cyan)', 'var(--lp-violet)'];

const STEPS = [
  {
    n: '1',
    tint: 'var(--lp-honey)',
    title: 'Log it in seconds',
    body: 'Type what you bought and the category fills itself in. Your allowance and your subscriptions add themselves every month without you touching them.',
    shot: '/shots/dashboard.jpg',
  },
  {
    n: '2',
    tint: 'var(--lp-coral)',
    title: 'See where it really went',
    body: 'Category splits, daily and weekly views, six months side by side, and every budget cap marked on its own bar. No guessing at the end of the month.',
    shot: '/shots/reports.jpg',
  },
  {
    n: '3',
    tint: 'var(--lp-cyan)',
    title: 'Get told what to do about it',
    body: 'Every tip carries a number - what it is worth per month - and the list is ordered by that. The one at the top moves the most money.',
    shot: '/shots/tips.jpg',
  },
];

const STATS = [
  { value: 39, suffix: '%', label: 'jump in subscriptions it caught last month', tint: 'var(--lp-coral)' },
  { value: 7, suffix: '', label: 'different ways it hunts for savings', tint: 'var(--lp-honey)' },
  { value: 6, suffix: '', label: 'months of history in the demo account', tint: 'var(--lp-cyan)' },
  { value: 0, suffix: '', label: 'bank logins, card details or fees', tint: 'var(--lp-lime)' },
];

const CARDS = [
  {
    icon: 'spark', tint: 'var(--lp-violet)', wide: true,
    title: 'It learns the words you use',
    body: 'Type "canteen chai" once and it remembers. Correcting a guess is exactly how it gets better, and every suggestion shows how sure it is and what it went on.',
  },
  {
    icon: 'target', tint: 'var(--lp-coral)', wide: true,
    title: 'Budgets you notice in time',
    body: 'Set a cap on one category. Campus Coin tells you when you are getting close to it, not after you have sailed past.',
  },
  {
    icon: 'repeat', tint: 'var(--lp-honey)',
    title: 'Recurring, handled',
    body: 'Allowance and subscriptions write themselves in each month.',
  },
  {
    icon: 'upload', tint: 'var(--lp-cyan)',
    title: 'Bring your history',
    body: 'Import a CSV and it suggests a category for every row before saving a thing.',
  },
  {
    icon: 'alert', tint: 'var(--lp-lime)',
    title: 'Catches your slips',
    body: 'Flags a double entry, or an amount far bigger than you normally spend there.',
  },
];

export default function Landing() {
  const page = useRef(null);
  useLandingMotion(page);

  return (
    <div className="lp" ref={page}>
      {/* Slow-drifting colour behind the whole page. */}
      <div className="lp-aurora" aria-hidden="true">
        <span className="lp-blob b1" data-blob />
        <span className="lp-blob b2" data-blob />
        <span className="lp-blob b3" data-blob />
        <span className="lp-blob b4" data-blob />
        <span className="lp-blob b5" data-blob />
      </div>

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
          <Link
            className="lp-btn lp-btn-main"
            to="/register"
            style={{ padding: '0.6rem 1.3rem', fontSize: '0.9375rem' }}
          >
            Get started
          </Link>
        </nav>

        <header className="lp-hero">
          <span className="lp-eyebrow" data-hero>
            <Icon name="spark" size={14} />
            Built for how students actually get paid
          </span>

          <h1 className="lp-mega" data-hero>
            Where did it
            <br />
            <span className="lp-grad" data-grad>all go?</span>
          </h1>

          <p className="lp-lead" data-hero>
            An allowance that turns up when it turns up. A bit of tutoring money. A scholarship instalment if
            you are lucky. Campus Coin is the budget tracker built for that, not for a salary.
          </p>

          <div className="lp-cta-row" data-hero>
            <Link className="lp-btn lp-btn-main" to="/register">
              Start tracking free
            </Link>
            <Link className="lp-btn lp-btn-ghost" to="/login">
              Try the demo account
            </Link>
          </div>

          <p className="lp-fine" data-hero>No bank login. No card details. No subscription. Ever.</p>

          <div className="lp-shot" data-shot>
            <span className="lp-shot-glow" aria-hidden="true" />
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
            <span className={`lp-marquee-item${i % 4 === 0 ? ' is-solid' : ''}`} key={`${word}-${i}`}>
              {word}
              <i style={{ background: DOT_COLOURS[i % 4] }} />
            </span>
          ))}
        </div>
      </div>

      <div className="lp-wrap">
        <section className="lp-section">
          <div className="lp-stats">
            {STATS.map((stat) => (
              <div className="lp-stat" key={stat.label}>
                <div className="lp-stat-value" style={{ color: stat.tint }}>
                  <span data-stat={stat.value}>{stat.value}</span>
                  {stat.suffix}
                </div>
                <div className="lp-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Scroll-driven: the steps light up in turn and the screen beside them
          changes to the part of the app being described. */}
      <section className="lp-scene" data-scene>
        <div className="lp-wrap">
          <div className="lp-scene-sticky">
            <div className="lp-scene-steps">
              <h2 className="lp-big" style={{ marginBottom: '0.75rem' }}>
                Three things,
                <br />
                <span className="lp-grad">that is it.</span>
              </h2>
              {STEPS.map((step, i) => (
                <article className={`lp-step${i === 0 ? ' is-on' : ''}`} key={step.n} data-step>
                  <span className="lp-step-n" style={{ background: step.tint }}>
                    {step.n}
                  </span>
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
          <div className="lp-section-head is-centred">
            <h2 className="lp-big" data-reveal>
              Small app.
              <br />
              <span className="lp-grad">Does a lot.</span>
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
                  <Icon name={card.icon} size={22} />
                </span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-section-head is-centred">
            <h2 className="lp-big" data-reveal>
              Watch it <span className="lp-grad">think</span>
            </h2>
            <p className="lp-lead">
              No black box. Type a description and it shows you every word it weighed, what it made of each
              one, and how sure it is about the answer.
            </p>
          </div>
          <div style={{ maxWidth: 560, marginInline: 'auto' }}>
            <AssistantDemo />
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-final" data-final>
            <h2 className="lp-big">
              Six months from now
              <br />
              you will <span className="lp-grad">know</span>.
            </h2>
            <p className="lp-lead">
              It takes about five seconds to log the thing you just bought. Everything else builds itself from
              there.
            </p>
            <div className="lp-cta-row">
              <Link className="lp-btn lp-btn-main" to="/register">
                Create your account
              </Link>
              <Link className="lp-btn lp-btn-ghost" to="/login">
                Look around first
              </Link>
            </div>
          </div>
        </section>

        <section className="lp-section" style={{ paddingTop: 0 }}>
          <div className="lp-panel">
            <h3 style={{ fontSize: '1.35rem', marginBottom: '0.4rem' }}>Try it without signing up</h3>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
              These accounts are seeded with six months of history, so every chart and every tip has something
              real behind it.
            </p>
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
            <div className="lp-cta-row" style={{ justifyContent: 'flex-start', marginTop: '1.5rem' }}>
              <Link
                className="lp-btn lp-btn-ghost"
                to="/login"
                style={{ padding: '0.7rem 1.4rem', fontSize: '0.9375rem' }}
              >
                Sign in as a student
              </Link>
              <Link
                className="lp-btn lp-btn-ghost"
                to="/admin/login"
                style={{ padding: '0.7rem 1.4rem', fontSize: '0.9375rem' }}
              >
                Administrator
              </Link>
            </div>
          </div>
        </section>

        {/* The SRS asks for a sitemap on the home page. */}
        <section className="lp-section" style={{ paddingTop: 0 }}>
          <h3 style={{ fontSize: '1.35rem', marginBottom: '1.75rem' }}>Everything in Campus Coin</h3>
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
            <BrandMark size={24} />
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
