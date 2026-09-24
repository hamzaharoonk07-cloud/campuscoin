import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon, { BrandMark } from '../components/Icon.jsx';
import { SITEMAP } from './Sitemap.jsx';
import '../styles/landing.css';

/* ---------------------------------------------------------------------------
   The public page.

   Calm and plain on purpose: one clear promise at the top, the real app shown
   rather than described, and every section answering one question a student
   would actually ask before signing up. Every figure and screenshot comes
   from the seeded demo account, and the credentials further down let anyone
   sign in and check it.
--------------------------------------------------------------------------- */

/** Adds `is-in` to each [data-reveal] element as it scrolls into view. */
function useReveal(root) {
  useEffect(() => {
    const nodes = root.current?.querySelectorAll('[data-reveal]') || [];
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-in'));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [root]);
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Tracks scroll for the navigation: whether the page has left the top (the bar
 * gains a shadow) and how far through it you are (the thin progress line).
 * The progress is written straight to a CSS variable rather than React state,
 * so scrolling never re-renders the page.
 */
function useScrollState(root) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      root.current?.style.setProperty('--progress', max > 0 ? String(window.scrollY / max) : '0');
      setScrolled(window.scrollY > 8);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [root]);
  return scrolled;
}

// What the categoriser really does with these words, shown as a loop: a
// description is typed, then the category it would suggest appears.
const TYPING = [
  ['chai at the canteen', 'Food'],
  ['rickshaw to campus', 'Transport'],
  ['netflix monthly', 'Subscriptions'],
  ['data structures book', 'Academics'],
];

function TypingFlow() {
  const holder = useRef(null);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(prefersReducedMotion() ? TYPING[0][0] : '');
  const [visible, setVisible] = useState(false);

  // Only runs while the card is on screen.
  useEffect(() => {
    const node = holder.current;
    if (!node || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || prefersReducedMotion()) return undefined;
    const [text] = TYPING[index];
    if (typed.length < text.length) {
      const timer = setTimeout(() => setTyped(text.slice(0, typed.length + 1)), 70);
      return () => clearTimeout(timer);
    }
    // Hold the finished pair on screen, then start the next description.
    const timer = setTimeout(() => {
      setTyped('');
      setIndex((i) => (i + 1) % TYPING.length);
    }, 2400);
    return () => clearTimeout(timer);
  }, [visible, typed, index]);

  const [text, category] = TYPING[index];
  const done = typed.length === text.length;

  return (
    <div className="lp-flow" ref={holder}>
      <div className="lp-flow-box">
        <Icon name="edit" size={18} />
        <span className="lp-typed">
          &ldquo;{typed}
          <i className="lp-caret" aria-hidden="true" />
          &rdquo;
        </span>
      </div>
      <Icon name="right" size={18} className={`lp-flow-arrow${done ? ' is-on' : ''}`} />
      <div className={`lp-flow-box lp-flow-result${done ? ' is-on' : ''}`}>
        <Icon name="check" size={18} />
        <span>
          <strong>{category}</strong> suggested
        </span>
      </div>
    </div>
  );
}

const TABS = [
  {
    key: 'all',
    label: 'Your whole month',
    eyebrow: 'The whole picture',
    title: 'More than a list of expenses.',
    body: 'Allowance, tutoring money and scholarship instalments on one side, canteen, hostel and textbooks on the other. Campus Coin puts them together so you can see what is left, not just what went.',
    points: ['Income and spending side by side', 'Recurring allowance and subscriptions post themselves', 'Import past months from a CSV'],
    shot: '/shots/dashboard.png',
    alt: 'The Campus Coin dashboard',
  },
  {
    key: 'budgets',
    label: 'Budgets',
    eyebrow: 'Told in time',
    title: 'A cap for each category.',
    body: 'Set what food, transport or subscriptions should cost this month and watch each bar fill in real time. You hear about it once when you get close and once if you go over, not on every purchase.',
    points: ['One cap per category, per month', 'Copy last month in one click', 'Alerts at 80% and 100%'],
    shot: '/shots/budgets.png',
    alt: 'The Campus Coin budgets page',
  },
  {
    key: 'reports',
    label: 'Reports',
    eyebrow: 'Look back',
    title: 'Make sense of every month.',
    body: 'Where it went by category, by day and by week, and six months of income against spending. Every chart has a table of the same numbers, and the report saves as a PDF.',
    points: ['Category, daily and weekly views', 'Six months side by side', 'Save as PDF or CSV'],
    shot: '/shots/reports.png',
    alt: 'The Campus Coin monthly report',
  },
  {
    key: 'assistant',
    label: 'Assistant',
    eyebrow: 'Ask it anything',
    title: 'An assistant that knows your numbers.',
    body: 'Ask "how much on food?" or "can I afford 2,500?" and get an answer from your own transactions. It also files each purchase under the right category as you type, and learns from your corrections.',
    points: ['Answers from your own data', 'Categorises as you type', 'Never presented as financial advice'],
    shot: '/shots/assistant.png',
    alt: 'The Campus Coin assistant answering a question',
  },
];

const STEPS = [
  ['01', 'Make an account', 'Name, email and your monthly allowance. No bank details and no card, ever.'],
  ['02', 'Log as you go', 'Type what you bought and the category fills itself in. Or bring last term in from a CSV.'],
  ['03', 'Read your month', 'Budgets, reports, a plain-language summary and tips ranked by what they would save you.'],
];

const CREDS = [
  ['Student', 'student@campuscoin.app', 'Student@12345', '/login'],
  ['Student', 'bilal@campuscoin.app', 'Student@12345', '/login'],
  ['Administrator', 'admin@campuscoin.app', 'Admin@12345', '/admin/login'],
];

const FAQ = [
  [
    'Does Campus Coin connect to my bank?',
    'No. Everything is entered by you or imported from a CSV file. There is no bank connection, no card and no real money moving anywhere.',
  ],
  [
    'Is the assistant an AI?',
    'Partly. Categorising runs on Campus Coin’s own server and learns from your corrections. The chat answers from the same calculations as your reports, and only hands a question to a language model when one is configured and no rule understood it.',
  ],
  [
    'Can I change a category it picked?',
    'Always. Every suggestion shows how sure it is and why, and correcting it is exactly how it learns.',
  ],
  [
    'Is any of this financial advice?',
    'No. Tips and summaries are prompts to look closer at your own numbers. They are never certified financial advice.',
  ],
];

export default function Landing() {
  const page = useRef(null);
  const [tab, setTab] = useState(TABS[0].key);
  const [autoplay] = useState(() => !prefersReducedMotion());
  useReveal(page);
  const scrolled = useScrollState(page);

  // The tabs advance on their own: the progress line under the active tab is a
  // CSS animation, and when it finishes it moves to the next tab. Hovering the
  // tabs pauses the animation, and with it the rotation, for free.
  const advance = () => {
    const at = TABS.findIndex((t) => t.key === tab);
    setTab(TABS[(at + 1) % TABS.length].key);
  };

  const current = TABS.find((t) => t.key === tab);

  return (
    <div className="lp" ref={page}>
      <span className="lp-progress" aria-hidden="true" />
      <nav className={`lp-nav${scrolled ? ' is-scrolled' : ''}`}>
        <div className="lp-wrap lp-nav-inner">
          <Link to="/" className="lp-brand">
            <BrandMark size={30} />
            Campus Coin
          </Link>
          <div className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#demo">Demo</a>
            <a href="#faq">Help</a>
            <Link to="/login">Sign in</Link>
          </div>
          <Link to="/register" className="lp-btn lp-btn-solid lp-nav-cta">
            Get started
            <Icon name="arrow-ne" size={16} />
          </Link>
        </div>
      </nav>

      <header className="lp-hero">
        <div className="lp-wrap lp-hero-grid">
          <div className="lp-hero-copy">
            <span className="lp-eyebrow has-rule">Student money. Clearly sorted.</span>
            <h1>
              {['Your allowance.', 'Your spending.', 'One clear picture.'].map((line, i) => (
                <span className="lp-line" key={line} style={{ '--i': i }}>
                  {i === 2 ? <em>{line}</em> : <span>{line}</span>}
                </span>
              ))}
            </h1>
            <p className="lp-lead">
              From your morning chai at the canteen to the hostel rent at the end of the month. Log it, budget it and
              understand it, with a tracker built for irregular student income rather than a salary.
            </p>
            <div className="lp-actions">
              <Link to="/register" className="lp-btn lp-btn-solid">
                Start tracking
                <Icon name="arrow-ne" size={16} />
              </Link>
              <a href="#features" className="lp-text-link">
                Take a closer look
                <Icon name="right" size={16} />
              </a>
            </div>
            <ul className="lp-ticks">
              <li>
                <Icon name="check" size={15} /> Free, no bank needed
              </li>
              <li>
                <Icon name="check" size={15} /> Works on your phone
              </li>
            </ul>
          </div>

          <div className="lp-hero-visual">
            <span className="lp-eyebrow lp-hero-tag">A little clarity. A lot less guessing.</span>
            <div className="lp-orbit" aria-hidden="true" />
            <figure className="lp-frame">
              <div className="lp-frame-bar" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <img src="/shots/hero.png" alt="The Campus Coin dashboard showing a month of income and spending" />
            </figure>
            <div className="lp-float lp-float-a">
              <span className="lp-float-icon">
                <Icon name="bulb" size={18} />
              </span>
              <div>
                <strong>Tip of the day</strong>
                <span>Worth up to Rs 10,847 a month</span>
              </div>
            </div>
            <div className="lp-float lp-float-b">
              <span className="lp-float-icon is-green">
                <Icon name="chart" size={18} />
              </span>
              <div>
                <strong>See the bigger picture</strong>
                <span>Six months, side by side</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="lp-strip">
        <div className="lp-wrap lp-strip-inner">
          <span className="lp-eyebrow is-muted">One app. Every side of student money.</span>
          <ul>
            <li>
              <i style={{ background: 'var(--cat-2)' }} /> Spending
            </li>
            <li>
              <i style={{ background: 'var(--cat-3)' }} /> Income
            </li>
            <li>
              <i style={{ background: 'var(--cat-4)' }} /> Budgets
            </li>
            <li>
              <i style={{ background: 'var(--cat-1)' }} /> Savings
            </li>
          </ul>
        </div>
      </section>

      <section className="lp-section" id="features">
        <div className="lp-wrap">
          <div className="lp-head-split" data-reveal>
            <div>
              <span className="lp-eyebrow">Made for student life</span>
              <h2 className="lp-h2 is-light">
                One app.
                <br />
                Everything sorted.
              </h2>
            </div>
            <p className="lp-aside">
              Money does not arrive on a schedule when you are a student. Your tracker should not assume it does.
            </p>
          </div>

          <div className={`lp-tabs${autoplay ? ' is-auto' : ''}`} role="tablist" aria-label="Features">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={tab === t.key ? 'is-on' : undefined}
                onClick={() => setTab(t.key)}
              >
                {t.label}
                <Icon name="arrow-ne" size={15} />
                {autoplay && tab === t.key ? (
                  <i className="lp-tab-progress" aria-hidden="true" onAnimationEnd={advance} />
                ) : null}
              </button>
            ))}
          </div>

          <div className="lp-tab-panel" role="tabpanel" key={current.key}>
            <div className="lp-tab-copy">
              <span className="lp-eyebrow">{current.eyebrow}</span>
              <h3>{current.title}</h3>
              <p>{current.body}</p>
              <ul className="lp-checks">
                {current.points.map((point) => (
                  <li key={point}>
                    <Icon name="check" size={16} />
                    {point}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="lp-text-link">
                Try it in the demo
                <Icon name="right" size={16} />
              </Link>
            </div>
            <div className="lp-tab-shot">
              <span className="lp-eyebrow is-muted">A look inside Campus Coin</span>
              <img src={current.shot} alt={current.alt} loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section className="lp-navy">
        <div className="lp-wrap lp-navy-grid">
          <div data-reveal>
            <span className="lp-eyebrow is-sky">For the way students are paid</span>
            <h2 className="lp-h2 is-light">
              One allowance.
              <br />
              One semester.
              <br />
              <em>One clear hisab.</em>
            </h2>
            <p>
              An allowance that turns up when it turns up, a bit of tutoring money, a scholarship instalment if you
              are lucky. Campus Coin was built for exactly that.
            </p>
            <Link to="/register" className="lp-text-link is-light">
              Create your account
              <Icon name="right" size={16} />
            </Link>
          </div>
          <div className="lp-navy-cards">
            <article className="lp-navy-card" data-reveal>
              <span className="lp-card-num">01 / Recurring</span>
              <h3>
                The monthly things,
                <br />
                handled.
              </h3>
              <p>Your allowance and your subscriptions post themselves on the right day, so the only things you type are the ones you chose.</p>
              <Icon name="repeat" size={22} />
            </article>
            <article className="lp-navy-card is-pale" data-reveal>
              <span className="lp-card-num">02 / Compared to you</span>
              <h3>
                Your average,
                <br />
                not someone else’s.
              </h3>
              <p>Every tip measures this month against your own last three, which is the only reason the advice is worth anything.</p>
              <Icon name="target" size={22} />
            </article>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-wrap lp-duo">
          <article className="lp-duo-card is-blue" data-reveal>
            <h3>
              Type it once.
              <br />
              It remembers.
            </h3>
            <p>Describe a purchase the way you would say it and the category fills itself in. Correct it once and it learns your words.</p>
            <TypingFlow />
            <Link to="/login" className="lp-text-link">
              See the categoriser
              <Icon name="right" size={16} />
            </Link>
          </article>

          <article className="lp-duo-card is-grey" data-reveal>
            <h3>
              Make sense
              <br />
              of every month.
            </h3>
            <p>Category breakdowns and six months of history turn your entries into a picture you can actually read.</p>
            <div className="lp-pastels">
              <span className="is-out">Spending</span>
              <span className="is-in">Income</span>
              <span className="is-budget">Budgets</span>
              <span className="is-goal">Savings</span>
            </div>
            <Link to="/login" className="lp-text-link">
              Explore the reports
              <Icon name="right" size={16} />
            </Link>
          </article>
        </div>
      </section>

      <section className="lp-section" id="how">
        <div className="lp-wrap">
          <div className="lp-center" data-reveal>
            <span className="lp-eyebrow">Less setup. More clarity.</span>
            <h2 className="lp-h2 is-light">
              Your next semester.
              <br />
              In three simple steps.
            </h2>
          </div>
          <ol className="lp-steps">
            {STEPS.map(([n, title, body]) => (
              <li key={n} data-reveal>
                <span>{n}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lp-band" id="demo">
        <div className="lp-wrap">
          <div className="lp-head-split" data-reveal>
            <div>
              <span className="lp-eyebrow">Try before you sign up</span>
              <h2 className="lp-h2 is-light">
                Real data.
                <br />
                Real accounts.
              </h2>
            </div>
            <Link to="/sitemap" className="lp-text-link">
              See every page
              <Icon name="right" size={16} />
            </Link>
          </div>
          <div className="lp-creds">
            {CREDS.map(([role, email, password, to]) => (
              <article className="lp-cred" key={email} data-reveal>
                <span className="lp-cred-role">{role}</span>
                <dl>
                  <div>
                    <dt>Email</dt>
                    <dd>{email}</dd>
                  </div>
                  <div>
                    <dt>Password</dt>
                    <dd>{password}</dd>
                  </div>
                </dl>
                <Link to={to} className="lp-text-link">
                  Sign in as {role.toLowerCase()}
                  <Icon name="right" size={16} />
                </Link>
              </article>
            ))}
          </div>
          <p className="lp-note">Six months of history is already in the demo accounts, so every chart has something to show.</p>
        </div>
      </section>

      <section className="lp-section" id="faq">
        <div className="lp-wrap lp-faq-grid">
          <div data-reveal>
            <span className="lp-eyebrow">Good questions</span>
            <h2 className="lp-h2 is-light">
              A little more
              <br />
              peace of mind.
            </h2>
          </div>
          <div className="lp-faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <Icon name="plus" size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-cta">
        <div className="lp-wrap lp-center" data-reveal>
          <span className="lp-cta-mark">
            <BrandMark size={44} />
          </span>
          <span className="lp-eyebrow">Your money, a little more sorted</span>
          <h2 className="lp-h2 is-light">
            Good semesters start
            <br />
            with a clear hisab.
          </h2>
          <p className="lp-lead">Six months from now, you will know exactly where it went.</p>
          <div className="lp-actions is-center">
            <Link to="/register" className="lp-btn lp-btn-solid">
              Create your account
              <Icon name="arrow-ne" size={16} />
            </Link>
            <Link to="/login" className="lp-btn">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-footer-top">
            <div>
              <Link to="/" className="lp-brand">
                <BrandMark size={28} />
                Campus Coin
              </Link>
              <p>Smart spending, student style.</p>
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
          </div>
          <p className="lp-colophon">
            Campus Coin is a student project for the Aptech End-to-End Web Solutions category. It holds no real money,
            connects to no bank, and its suggestions are prompts to look closer, not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
