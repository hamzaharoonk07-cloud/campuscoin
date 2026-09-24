import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/Icon.jsx';
import { useLandingMotion } from '../lib/useLandingMotion.js';
import { SITEMAP } from './Sitemap.jsx';
import '../styles/landing.css';

/* ---------------------------------------------------------------------------
   The public page.

   Built to be driven by scroll. Headings are split into masked lines so they
   can rise out of their own edge, the chapters are pinned and stepped through,
   the features run sideways while the page runs down, and the background
   colour changes as you move between sections.

   Every figure is real: it all comes from the seeded demo account, and the
   credentials near the foot let anyone sign in and check it.
--------------------------------------------------------------------------- */

/** A heading split into masked lines, ready for the motion hook to lift. */
function Lines({ lines, className = '' }) {
  return (
    <>
      {lines.map((line, i) => (
        <span className="lp-mask" key={i}>
          <span data-line className={className}>
            {line}
          </span>
        </span>
      ))}
    </>
  );
}

const WORDS = ['Canteen chai', 'Hostel rent', 'Rickshaw fare', 'Spotify', 'Biryani', 'Photocopy', 'Textbooks', 'Foodpanda'];

const CHAPTERS = [
  {
    n: '01',
    lines: ['Log it', 'in seconds'],
    body: 'Type what you bought and the category fills itself in. Your allowance and your subscriptions post themselves every month without you touching them.',
    shot: '/shots/dashboard.jpg',
    alt: 'The Campus Coin dashboard',
    flipped: false,
  },
  {
    n: '02',
    lines: ['See where', 'it went'],
    body: 'Category splits, daily and weekly views, six months side by side, and every budget cap marked on its own bar. Every chart is backed by a table of the same numbers.',
    shot: '/shots/reports.jpg',
    alt: 'The Campus Coin monthly report',
    flipped: true,
  },
  {
    n: '03',
    lines: ['Know what', 'to do next'],
    body: 'Every tip quotes your real figures and states what acting on it would save you each month. The list is ranked by that number, so the one at the top moves the most money.',
    shot: '/shots/tips.jpg',
    alt: 'The Campus Coin saving tips page',
    flipped: false,
  },
];

const RAIL = [
  { label: 'Entry', title: 'Recurring, handled', body: 'Allowance and subscriptions write themselves in each month, so the only things you type are the ones you decided on.' },
  { label: 'Assistant', title: 'Learns your words', body: 'Type "canteen chai" once and it remembers. Correcting a guess is exactly how it improves, and every suggestion shows its confidence.' },
  { label: 'Budgets', title: 'Told in time', body: 'A cap per category, filling in real time. You hear about it once when you are close and once if you go over, not on every purchase.' },
  { label: 'Reports', title: 'Six months at once', body: 'Income against spending, daily and weekly views, and a projection for next month that states how rough it is.' },
  { label: 'Import', title: 'Bring your history', body: 'Paste or upload a CSV and every row gets a suggested category before a single thing is saved.' },
  { label: 'Safety', title: 'Catches your slips', body: 'Duplicate entries and amounts far outside your normal range for a category are flagged as you save them.' },
];

const FIGURES = [
  { value: 13, suffix: '', label: 'features across nine screens' },
  { value: 7, suffix: '', label: 'rules hunting for savings' },
  { value: 6, suffix: '', label: 'months of demo history' },
  { value: 0, suffix: '', label: 'bank connections required' },
];

const CREDS = [
  ['Student', 'student@campuscoin.app', 'Student@12345'],
  ['Student', 'bilal@campuscoin.app', 'Student@12345'],
  ['Administrator', 'admin@campuscoin.app', 'Admin@12345'],
];

export default function Landing() {
  const page = useRef(null);
  useLandingMotion(page);

  return (
    <div className="lp" ref={page}>
      <div className="lp-bg" data-bg aria-hidden="true" />
      <div className="lp-grain" aria-hidden="true" />
      <div className="lp-cursor" data-cursor aria-hidden="true" />
      <div className="lp-cursor-ring" data-cursor-ring aria-hidden="true" />

      <div className="lp-loader" data-loader aria-hidden="true">
        <div className="lp-loader-num" data-loader-num>
          0
        </div>
        <span className="lp-loader-bar" data-loader-bar />
      </div>

      <nav className="lp-nav">
        <Link to="/" className="lp-brand">
          <BrandMark size={26} />
          Campus Coin
        </Link>
        <span className="lp-spacer" />
        <Link className="lp-nav-link" to="/login" style={{ marginRight: '1.75rem' }}>
          Sign in
        </Link>
        <Link className="lp-nav-link" to="/register">
          Get started
        </Link>
      </nav>

      <header className="lp-hero">
        <div className="lp-wrap">
          <div className="lp-hero-head">
            <h1 className="lp-mega">
              <Lines lines={['Where']} />
              <Lines lines={['did it']} className="lp-outline" />
              <Lines lines={['all go?']} className="lp-amber" />
            </h1>
          </div>

          <div className="lp-hero-shot" data-hero-shot>
            <img src="/shots/dashboard.jpg" alt="The Campus Coin dashboard showing a month of income and spending" />
          </div>

          <div className="lp-hero-meta">
            <p className="lp-lead" data-fade>
              An allowance that turns up when it turns up. A bit of tutoring money. A scholarship instalment if
              you are lucky. The budget tracker built for that, not for a salary.
            </p>
            <div className="lp-hero-actions" data-fade>
              <Link className="lp-btn lp-btn-solid" to="/register" data-magnet>
                <span>Start tracking</span>
              </Link>
              <Link className="lp-btn" to="/login" data-magnet>
                <span>Try the demo</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="lp-scrollcue" aria-hidden="true">
          <span className="lp-label">Scroll</span>
          <i />
        </div>
      </header>

      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee-track" data-marquee>
          {[...WORDS, ...WORDS].map((word, i) => (
            <span className={`lp-marquee-item${i % 3 === 0 ? ' is-solid' : ''}`} key={`${word}-${i}`}>
              {word}
              <b>&mdash;</b>
            </span>
          ))}
        </div>
      </div>

      <section className="lp-section" data-chapter-zone>
        <div className="lp-wrap">
          <div className="lp-section-head">
            <span className="lp-label">How it works</span>
            <h2 className="lp-big">
              <Lines lines={['Three things,', 'that is it.']} />
            </h2>
          </div>

          {CHAPTERS.map((chapter) => (
            <article className={`lp-chapter${chapter.flipped ? ' is-flipped' : ''}`} key={chapter.n}>
              <div className="lp-chapter-text">
                <span className="lp-chapter-num" data-fade>
                  Chapter {chapter.n}
                </span>
                <h2 className="lp-big">
                  <Lines lines={chapter.lines} />
                </h2>
                <p className="lp-lead" data-fade>
                  {chapter.body}
                </p>
              </div>
              <div className="lp-chapter-shot" data-reveal>
                <img src={chapter.shot} alt={chapter.alt} data-parallax loading="lazy" />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Runs sideways while the page runs down. */}
      <section className="lp-rail" data-rail>
        <div className="lp-wrap" style={{ marginBottom: '3rem' }}>
          <span className="lp-label">Everything in it</span>
          <h2 className="lp-big" style={{ marginTop: '1.5rem' }}>
            <Lines lines={['Small app.', 'Does a lot.']} />
          </h2>
        </div>
        <div className="lp-rail-track" data-rail-track>
          {RAIL.map((card) => (
            <article className="lp-rail-card" key={card.title}>
              <span className="lp-label">{card.label}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-statement">
        <div className="lp-wrap">
          <h2 className="lp-big">
            <Lines lines={['It compares you']} />
            <Lines lines={['to you.']} className="lp-amber" />
          </h2>
          <p className="lp-lead" data-fade>
            Not to a budget somebody else wrote. Every figure is measured against your own three-month
            average, which is the only reason the advice is worth anything.
          </p>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-figures">
            {FIGURES.map((figure) => (
              <div key={figure.label}>
                <div className="lp-figure-value">
                  <span data-count={figure.value}>{figure.value}</span>
                  {figure.suffix}
                </div>
                <p className="lp-figure-label">{figure.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-section-head">
            <span className="lp-label">Demo accounts</span>
            <h2 className="lp-big">
              <Lines lines={['Try it without', 'signing up.']} />
            </h2>
          </div>

          <div className="lp-creds" data-fade>
            <div className="lp-creds-row">
              <span>Role</span>
              <span>Email</span>
              <span>Password</span>
            </div>
            {CREDS.map(([role, email, password]) => (
              <div className="lp-creds-row" key={email}>
                <span className="lp-amber">{role}</span>
                <span>{email}</span>
                <span>{password}</span>
              </div>
            ))}
          </div>

          <div className="lp-hero-actions" style={{ marginTop: '2.5rem' }} data-fade>
            <Link className="lp-btn" to="/login" data-magnet>
              <span>Student sign-in</span>
            </Link>
            <Link className="lp-btn" to="/admin/login" data-magnet>
              <span>Administrator</span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-footer-cta">
            <h2 className="lp-mega">
              <Lines lines={['Six months']} />
              <Lines lines={['from now']} className="lp-outline" />
              <Lines lines={['you will know.']} className="lp-amber" />
            </h2>
            <div className="lp-hero-actions" style={{ marginTop: '3rem' }} data-fade>
              <Link className="lp-btn lp-btn-solid" to="/register" data-magnet>
                <span>Create your account</span>
              </Link>
            </div>
          </div>

          {/* The SRS asks for a sitemap on the home page. */}
          <nav className="lp-sitemap" aria-label="Sitemap">
            {SITEMAP.map((group) => (
              <div key={group.title}>
                <h4>{group.title}</h4>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <p className="lp-colophon">
            Campus Coin is a student project built for the Aptech End-to-End Web Solutions category. It holds
            no real money, connects to no bank, and its suggestions are prompts to look closer &mdash; not
            financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
