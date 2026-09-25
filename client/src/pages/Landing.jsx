import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon, { BrandMark, Wordmark } from '../components/Icon.jsx';
import { SITEMAP } from './Sitemap.jsx';
import { ArtIcon, artUrl, ChartArt, ChatArt, ReceiptArt, WalletArt } from '../components/Illustrations.jsx';
import CoinBot from '../components/CoinBot.jsx';
import '../styles/landing.css';

/* ---------------------------------------------------------------------------
   The public page.

   Calm and plain on purpose: one clear promise at the top, the real app shown
   rather than described, and every section answering one question a student
   would actually ask before signing up. The figures and screenshots come
   from the app itself.
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

/**
 * Pointer depth for the hero: writes the pointer's position (-1 to 1 on each
 * axis) to CSS variables, and each layer moves by its own --depth. Mouse only -
 * touch screens and reduced motion get a still hero.
 */
function usePointerDepth(target) {
  useEffect(() => {
    const node = target.current;
    if (!node || prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return undefined;
    let frame = 0;
    const move = (event) => {
      const box = node.getBoundingClientRect();
      const x = ((event.clientX - box.left) / box.width) * 2 - 1;
      const y = ((event.clientY - box.top) / box.height) * 2 - 1;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.style.setProperty('--mx', x.toFixed(3));
        node.style.setProperty('--my', y.toFixed(3));
      });
    };
    const leave = () => {
      node.style.setProperty('--mx', '0');
      node.style.setProperty('--my', '0');
    };
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerleave', leave);
    return () => {
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', leave);
      cancelAnimationFrame(frame);
    };
  }, [target]);
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
    key: 'receipts',
    label: 'Receipts',
    eyebrow: 'Snap it',
    title: 'A photo of the receipt is enough.',
    body: 'Take a picture and Campus Coin reads the total, the shop and the date, then suggests the category. It all happens on your device, and the photo stays with the transaction for later.',
    points: ['Finds the real total, not the subtotal', 'Reads the shop and the date', 'Keeps the photo with the entry'],
    shot: '/shots/receipt.png',
    alt: 'A receipt being scanned in the Campus Coin add-transaction form',
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

// The ribbon under the hero: the everyday things students actually log.
const RIBBON = [
  ['hot_beverage', 'Canteen chai'],
  ['house', 'Hostel rent'],
  ['bus', 'Rickshaw fare'],
  ['books', 'Textbooks'],
  ['mobile_phone', 'Netflix'],
  ['hamburger', 'Biryani'],
  ['receipt', 'Photocopies'],
  ['wrapped_gift', 'Eidi'],
  ['graduation_cap', 'Scholarship'],
  ['popcorn', 'Cinema night'],
  ['dollar_banknote', 'Allowance'],
  ['pizza', 'Pizza Friday'],
];

// Everything in the app, each with its object. The first two are the ones
// that most set Campus Coin apart, so they take the larger cards.
const FEATURES = [
  { art: 'receipt', title: 'Snap a receipt', body: 'Photo in, amount, shop and date out. Read on your own device, and the photo stays with the entry.', big: true, Scene: ReceiptArt },
  { art: 'speech_balloon', title: 'Ask Coin', body: 'A chat assistant that answers from your own numbers: "how much on food?", "can I afford 2,500?"', big: true, Scene: ChatArt },
  { art: 'bell', title: 'Budget alerts', body: 'Told once at 80% and once when you go over. Never on every purchase.' },
  { art: 'bar_chart', title: 'Reports and PDF', body: 'By category, day and week, six months side by side, saved as a PDF.' },
  { art: 'light_bulb', title: 'Tips that pay', body: 'Ranked by what each would save you, from your own history.' },
  { art: 'calendar', title: 'Recurring entries', body: 'Allowance and subscriptions post themselves on the right day.' },
  { art: 'magnifying_glass_tilted_left', title: 'Catches slips', body: 'Duplicates and unusually large amounts are flagged as you save.' },
  { art: 'card_index_dividers', title: 'CSV import', body: 'Bring last term in; every row gets a suggested category first.' },
  { art: 'gear', title: 'Your way', body: 'Light or dark, larger text, and your own photo and categories.' },
  { art: 'shield', title: 'Private by design', body: 'No bank link and no card. Only you can see your transactions.' },
];

const STEPS = [
  ['01', 'Make an account', 'Name, email and your monthly allowance. No bank details and no card, ever.'],
  ['02', 'Log as you go', 'Type what you bought, snap the receipt, or bring last term in from a CSV. The category fills itself in.'],
  ['03', 'Read your month', 'Budgets, reports, a plain-language summary and tips ranked by what they would save you.'],
];

// Plain facts about the product, counted up when they come into view.
const STATS = [
  [12, '', 'categories ready on day one'],
  [3, '', 'ways to add: type, scan or import'],
  [2, '', 'budget alerts: at 80% and at 100%'],
  [0, '', 'bank details needed, ever'],
];

/** Counts from 0 to the value the first time the number scrolls into view. */
function CountOnView({ to }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window) || to === 0) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / 900);
        setShown(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{shown}</span>;
}

// A conversation with Coin, played message by message.
const TALK = [
  ['me', 'How much did I spend on food this month?'],
  ['coin', 'Rs 10,941 on Food in September - 7% more than your usual month, and Rs 1,941 over its budget.'],
  ['me', 'Can I afford a Rs 2,500 concert ticket?'],
  ['coin', 'You have Rs 3,200 left to spend this month. It fits, but it would leave Rs 700 for the last 6 days.'],
  ['me', 'Where can I save?'],
  ['coin', 'Food delivery rose 40%. A weekly cap of Rs 1,800 would save about Rs 2,100 a month.'],
];

/** The chat showcase: messages appear one after another once it is in view. */
function CoinTalk() {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let timer;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      setCount(TALK.length);
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      let n = 0;
      const next = () => {
        n += 1;
        setCount(n);
        if (n < TALK.length) timer = setTimeout(next, n % 2 ? 1300 : 900);
      };
      timer = setTimeout(next, 300);
    }, { threshold: 0.35 });
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, []);
  const typing = count < TALK.length && count > 0 && TALK[count][0] === 'coin';
  return (
    <div className="lp-talk" ref={ref} aria-label="An example conversation with Coin">
      <div className="lp-talk-head">
        <span className="lp-talk-face">
          <CoinBot size={36} bubble={false} />
        </span>
        <span>
          <strong>Coin</strong>
          <small>
            <i /> Online - answers from your own money
          </small>
        </span>
      </div>
      <div className="lp-talk-log">
        {TALK.slice(0, count).map(([who, text], i) => (
          <p key={i} className={`lp-msg is-${who}`}>
            {text}
          </p>
        ))}
        {typing ? (
          <p className="lp-msg is-coin is-typing" aria-hidden="true">
            <i />
            <i />
            <i />
          </p>
        ) : null}
      </div>
    </div>
  );
}

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
  const hero = useRef(null);
  const [tab, setTab] = useState(TABS[0].key);
  const [autoplay] = useState(() => !prefersReducedMotion());
  useReveal(page);
  const scrolled = useScrollState(page);
  usePointerDepth(hero);

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
      <nav className={`lp-nav ${scrolled ? 'is-scrolled' : 'is-top'}`}>
        <div className="lp-wrap lp-nav-inner">
          <Link to="/" className="lp-brand">
            <Wordmark size={30} />
          </Link>
          <div className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#coin">Meet Coin</a>
            <a href="#faq">Help</a>
            <Link to="/login">Sign in</Link>
          </div>
          {/* On a phone the links above are hidden, so Sign in gets its own button. */}
          <Link to="/login" className="lp-nav-signin">
            Sign in
          </Link>
          <Link to="/register" className="lp-btn lp-btn-solid lp-nav-cta">
            Get started
            <Icon name="arrow-ne" size={16} />
          </Link>
        </div>
      </nav>

      <header className="lp-hero" ref={hero}>
        {/* Scenery: a soft colour mesh, a faint grid and two slow orbits. */}
        <div className="lp-hero-bg" aria-hidden="true">
          <span className="lp-mesh lp-mesh-a" />
          <span className="lp-grid" />
        </div>

        <div className="lp-wrap lp-hero-grid">
          <div className="lp-hero-copy">
            <a href="#features" className="lp-badge">
              <span className="lp-badge-tag">New</span>
              An assistant that answers from your own numbers
              <Icon name="right" size={14} />
            </a>
            <h1>
              {['Your allowance.', 'Your spending.'].map((line, i) => (
                <span className="lp-line" key={line} style={{ '--i': i }}>
                  <span>{line}</span>
                </span>
              ))}
              <span className="lp-line" style={{ '--i': 2 }}>
                <em>
                  One clear picture.
                  {/* A hand-drawn stroke that draws itself under the promise. */}
                  <svg className="lp-underline" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M4 14 C 60 4, 140 4, 200 10 S 280 16, 296 6" pathLength="1" />
                  </svg>
                </em>
              </span>
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
              <a href="#how" className="lp-text-link">
                See how it works
                <Icon name="right" size={16} />
              </a>
            </div>
            <ul className="lp-facts">
              <li>
                <span className="lp-fact-icon">
                  <Icon name="shield" size={16} />
                </span>
                <span>
                  <strong>No bank link</strong>
                  Nothing to connect
                </span>
              </li>
              <li>
                <span className="lp-fact-icon is-mint">
                  <Icon name="spark" size={16} />
                </span>
                <span>
                  <strong>7 saving rules</strong>
                  Built from your history
                </span>
              </li>
              <li>
                <span className="lp-fact-icon is-cream">
                  <Icon name="chart" size={16} />
                </span>
                <span>
                  <strong>6 months</strong>
                  Side by side
                </span>
              </li>
            </ul>
          </div>

          {/* The app, layered: the desktop dashboard behind, the phone in front,
              and cards with figures from the app. Each layer
              has its own depth, so they drift apart as the pointer moves. */}
          <div className="lp-stage" aria-hidden="true">
            <span className="lp-orbit lp-orbit-a">
              <i className="lp-orbit-coin" />
            </span>
            <span className="lp-orbit lp-orbit-b">
              <i className="lp-orbit-coin is-small" />
            </span>

            <figure className="lp-frame lp-depth" style={{ '--depth': 0.4 }}>
              <div className="lp-frame-bar">
                <i />
                <i />
                <i />
              </div>
              <img src="/shots/hero.png" alt="" />
            </figure>

            <figure className="lp-phone lp-depth" style={{ '--depth': 1 }}>
              <span className="lp-phone-notch" />
              <img src="/shots/phone.png" alt="" />
            </figure>

            <div className="lp-card lp-card-income lp-depth" style={{ '--depth': 1.4 }}>
              <span className="lp-card-icon is-mint">
                <Icon name="download" size={17} />
              </span>
              <div>
                <span>Allowance received</span>
                <strong className="num">+Rs 20,000</strong>
              </div>
            </div>

            <div className="lp-card lp-card-budget lp-depth" style={{ '--depth': 1.8 }}>
              <div className="lp-card-row">
                <span>Food budget</span>
                <em>Over</em>
              </div>
              <strong className="num">
                Rs 10,941 <small>of Rs 9,000</small>
              </strong>
              <span className="lp-card-bar">
                <i />
              </span>
            </div>

            <div className="lp-card lp-card-chat lp-depth" style={{ '--depth': 1.2 }}>
              <span className="lp-chat-q">How much on food?</span>
              <span className="lp-chat-a">
                <Icon name="spark" size={13} />
                Rs 10,941 this month, 7% above your usual.
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* A ribbon of the things students spend on, running sideways forever.
          The list is written twice so the loop has no visible seam. */}
      <section className="lp-ribbon" aria-label="Things students log with Campus Coin">
        <div className="lp-ribbon-track">
          {[...RIBBON, ...RIBBON].map(([art, label], i) => (
            <span className="lp-ribbon-chip" key={`${label}-${i}`} aria-hidden={i >= RIBBON.length}>
              <ArtIcon name={art} size={34} />
              {label}
            </span>
          ))}
        </div>
      </section>

      <section className="lp-stats" aria-label="Campus Coin in numbers">
        <div className="lp-wrap lp-stats-grid">
          {STATS.map(([n, suffix, label]) => (
            <div className="lp-stat" key={label} data-reveal>
              <strong>
                <CountOnView to={n} />
                {suffix}
              </strong>
              <span>{label}</span>
            </div>
          ))}
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
              <Link to="/register" className="lp-text-link">
                Start free
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

      <section className="lp-section lp-bento-section">
        <div className="lp-wrap">
          <div className="lp-center" data-reveal>
            <span className="lp-eyebrow">Everything in it</span>
            <h2 className="lp-h2 is-light">
              Small app.
              <br />
              <em>Does a lot.</em>
            </h2>
          </div>
          <div className="lp-bento">
            {FEATURES.map((f) => (
              <article className={`lp-bento-card${f.big ? ' is-big' : ''}`} key={f.title} data-reveal>
                {f.Scene ? (
                  <div className="lp-bento-scene">
                    <f.Scene />
                  </div>
                ) : (
                  <span className="lp-bento-art">
                    <ArtIcon name={f.art} size={56} />
                  </span>
                )}
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </article>
            ))}
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
              <em>One clear picture.</em>
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
              <ArtIcon name="calendar" size={52} />
            </article>
            <article className="lp-navy-card is-pale" data-reveal>
              <span className="lp-card-num">02 / Compared to you</span>
              <h3>
                Your average,
                <br />
                not someone else’s.
              </h3>
              <p>Every tip measures this month against your own last three, which is the only reason the advice is worth anything.</p>
              <ArtIcon name="bullseye" size={52} />
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
            <Link to="/register" className="lp-text-link">
              Try it free
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
              <span className="is-out">
                <ArtIcon name="money_with_wings" size={34} />
                Spending
              </span>
              <span className="is-in">
                <ArtIcon name="dollar_banknote" size={34} />
                Income
              </span>
              <span className="is-budget">
                <ArtIcon name="bullseye" size={34} />
                Budgets
              </span>
              <span className="is-goal">
                <ArtIcon name="seedling" size={34} />
                Savings
              </span>
            </div>
            <Link to="/register" className="lp-text-link">
              Get started
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
            {STEPS.map(([n, title, body], i) => (
              <li key={n} data-reveal>
                <div className="lp-step-art">{[<WalletArt key="w" />, <ReceiptArt key="r" />, <ChartArt key="c" />][i]}</div>
                <span>{n}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lp-coin" id="coin">
        <div className="lp-wrap lp-coin-grid">
          <div data-reveal>
            <span className="lp-eyebrow is-sky">Meet Coin</span>
            <h2 className="lp-h2 is-light">
              Ask your money
              <br />
              <em>anything.</em>
            </h2>
            <p>
              Coin is the assistant inside Campus Coin. Ask in plain words and it answers from your own transactions -
              what you spent, what is left, whether something fits, and where the easy savings are.
            </p>
            <ul className="lp-coin-points">
              <li>
                <img src={artUrl('speech-balloon')} alt="" width="26" height="26" /> Plain questions, plain answers
              </li>
              <li>
                <img src={artUrl('bar-chart')} alt="" width="26" height="26" /> Every figure comes from your own data
              </li>
              <li>
                <img src={artUrl('light-bulb')} alt="" width="26" height="26" /> Advice worth real money, not rules of thumb
              </li>
            </ul>
            <Link to="/register" className="lp-btn lp-btn-solid">
              Start chatting with Coin
              <Icon name="arrow-ne" size={16} />
            </Link>
          </div>
          <CoinTalk />
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
            <ArtIcon name="money_bag" size={58} />
          </span>
          <span className="lp-eyebrow">Your money, a little more sorted</span>
          <h2 className="lp-h2 is-light">
            Good semesters start
            <br />
            with a clear plan.
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
                <Wordmark size={28} />
              </Link>
              <p>Smart spending, student style.</p>
            </div>
            {/* The SRS asks for a sitemap on the home page. */}
            <nav className="lp-sitemap" id="sitemap" aria-label="Sitemap">
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
