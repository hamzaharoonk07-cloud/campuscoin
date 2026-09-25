# Campus Coin

**Smart Spending, Student Style** — a budget and expense tracker for college and
university students.

Theme: NextGen BudgetBee · Category: End-to-End Web Solutions · Version 1.0

Students are paid irregularly — an allowance when it arrives, a bit of tutoring
money, a scholarship instalment — and general personal-finance apps assume a
salary and a bank feed. Campus Coin assumes neither. Everything is entered by
hand or imported from a CSV, and every piece of advice it gives is built from
the student's own transactions.

**Live site: https://campuscoin-sable.vercel.app**
(source: https://github.com/hamzaharoonk07-cloud/campuscoin)

---

## Installation

**Requirements:** Node.js 18 or newer. A MongoDB server is *optional* — with no
connection string configured the app starts its own embedded MongoDB and stores
it in `server/data/db`, so it runs on a fresh machine with no database setup.

```bash
# 1. Install both halves
npm run setup

# 2. Copy the environment template (all values are optional for a local run)
cp server/.env.example server/.env

# 3. Build the React front end
npm run build

# 4. Start it
npm start
```

Open **http://localhost:5000**. The first start seeds the default categories,
the administrator and two demo students with six months of history, so every
chart, budget and tip has real data behind it immediately.

### Running in development

Two terminals, so the front end hot-reloads:

```bash
npm run dev          # API on http://localhost:5000
npm run dev:client   # React on http://localhost:5173 (proxies /api to the API)
```

### Testing every feature

With the server running (`npm start`), in a second terminal:

```bash
npm run test:e2e --prefix server
```

It registers a throwaway student and works through every functional
requirement in the SRS - sign-up, login, password reset, profile, categories,
income and expenses, recurring entries, CSV import and export, the
categoriser learning from corrections, anomaly flags, budgets and alerts,
reports and filters, insights, tips, sharing, the chat assistant and every
administrator control - then deletes the account. It prints PASS or FAIL for
each of its 58 checks.

### Reseeding

```bash
npm run seed
```

Seeding only fills what is missing; it never overwrites existing data. To start
completely fresh, delete `server/data/` first.

---

## User credentials

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@campuscoin.app` | `Admin@12345` |
| Student | `student@campuscoin.app` | `Student@12345` |
| Student | `bilal@campuscoin.app` | `Student@12345` |

Students sign in at `/login`. The administrator has a **separate, direct-access
sign-in at `/admin/login`**, which posts to its own endpoint and refuses any
account that is not an administrator — a student's password is useless there
even with the URL.

---

## Configuration

Everything in `server/.env` is optional. The app is designed to run and
demonstrate every feature with an empty file.

| Variable | What it does when set | What happens when it is not |
|---|---|---|
| `MONGO_URI` | Uses that MongoDB (local or Atlas) | Starts an embedded MongoDB in `server/data/db` |
| `JWT_SECRET` | Signs session tokens | A development default is used |
| `SMTP_*`, `MAIL_FROM` | Sends password-reset links and shared reports | The message is returned in the API response instead, so the flow is still demonstrable |
| `ANTHROPIC_API_KEY` | Monthly summaries are rewritten by Claude | Summaries come from the built-in statistical engine |
| `CRON_SECRET` | Protects the daily recurring-transaction endpoint | The endpoint refuses all callers; the local server runs the job on a timer anyway |

---

## Technology

**Front end** — React 18 with React Router, built by Vite. No UI framework and
no component library: the design system, the layout and all four chart types are
written from scratch in CSS and SVG (`client/src/styles/`,
`client/src/components/Charts.jsx`).

**Back end** — Node.js with Express 5 and Mongoose.

**Database** — MongoDB.

**Deployment** — configured for Vercel (`vercel.json` + `api/index.mjs`), with
the API as a serverless function and the built client served as static files.

---

## How the application is put together

```
CampusCoin/
├── api/index.mjs              Vercel serverless entry point
├── vercel.json                Build, routing and cron configuration
├── server/
│   └── src/
│       ├── app.js             Express app, routes and error handling
│       ├── index.js           Local server entry point
│       ├── config/db.js       Connection, including the embedded fallback
│       ├── models/            User, Category, Transaction, Budget,
│       │                      Insight, Tip, Notification, Announcement,
│       │                      CategoryHint
│       ├── middleware/auth.js JWT verification and role gates
│       ├── routes/            One file per area of the API
│       ├── services/          The engines - see below
│       └── seed/              Default categories and demo data
└── client/
    └── src/
        ├── pages/             One file per screen
        ├── components/        Layout, charts, forms, import wizard
        ├── context/           Auth, theme and toasts
        ├── lib/               API client and formatting
        └── styles/            Design tokens and the stylesheet
```

### The engines

Everything that makes a judgement lives in `server/src/services/`, separately
from the routes that serve it:

| File | What it decides |
|---|---|
| `analytics.js` | The shared aggregations. Reports, tips, insights and the forecast all read their numbers from here, so they can never disagree with each other. |
| `categorizer.js` | Suggests a category from a description. |
| `tips.js` | Builds the saving tips and estimates what each is worth. |
| `insights.js` | Writes the monthly summary. |
| `anomaly.js` | Flags unusually large and duplicate transactions. |
| `forecast.js` | Projects next month. |
| `recurring.js` | Writes recurring entries when they come due. |
| `alerts.js` | Raises budget warnings. |
| `csv.js` | Imports and exports transaction files. |
| `chat.js` | Works out what a chat question is asking and answers it from the figures above. |
| `llm.js` | Optional: rewrites an already-computed summary in warmer language, and answers chat questions the rules did not recognise. |

---

## Notes on the parts that make judgements

The SRS asks for AI assistance in two places, and for a chatbot. They are
separate features, and a language model is only ever an optional finishing
step: every figure is calculated by Campus Coin itself.

**Categorising a description** runs entirely on Campus Coin's own server. Each
word of a description is counted against the category the student actually
chose, building a per-student word-to-category frequency table
(`CategoryHint`). Correcting a suggestion is what teaches it: the correction
records a different pairing than the one that was proposed, so the next guess
leans the other way. A new account starts from seed keywords on the default
categories until it has a history of its own. Every suggestion shows its
confidence and its reason, and can always be overridden.

**Writing the monthly summary** computes every figure from the database first,
then — only if `ANTHROPIC_API_KEY` is set — asks Claude to rewrite those
already-computed facts in friendlier language. The model is never asked to do
arithmetic, so a summary cannot contradict the report it came from. Without a
key the built-in statistical writer produces the summary instead, and the
feature reports which one wrote it.

**The chat assistant** (the SRS's "AI ChatBot") lives in the bubble in the
corner of every student page; what it has learned, and a button to make it
forget, are in Settings. It is built in rather than
embedded from tawk.to or Tidio, because a third-party widget cannot see the
student's data. A rule-based router in `chat.js` recognises the kind of
question being asked (balance, one category, the category breakdown, budgets,
the forecast, the largest expense, saving tips, "can I afford 2,500?",
"which category is chai at the canteen?", this month against last) and answers
from the same aggregations the reports use, so the chat and the reports can
never disagree. Only a question no rule recognises is passed to Claude, and
only if `ANTHROPIC_API_KEY` is set, together with a sheet of already-computed
facts and an instruction to use nothing else. The conversation is kept in the
browser tab and is never stored on the server.

**Scanning a receipt** is the SRS's optional OCR. In the add-transaction form
a student takes or drops a photo of a receipt (or tries one of the two samples
in `client/public/samples`). The photo is shrunk in the browser and read with
Tesseract OCR, also in the browser - no API key and nothing is uploaded to be
read. Plain rules in `client/src/lib/receipt.js` then pick out the amount paid
(preferring "grand total", "net payable" and "total" lines and ignoring
subtotal, tax, cash and change), the shop and the date, fill the form, and let
the categoriser suggest the category. The student checks everything before
saving. A compressed copy of the photo is kept with the transaction and is only
fetched when someone opens it. The first scan on a device downloads the OCR
engine and English data (about 3 MB) from a CDN, so it needs an internet
connection once.

**Profile photos** are uploaded from Settings, cropped square and shrunk to
about 20 KB in the browser, and shown in the sidebar, the chat and the
administrator's student list. The server accepts only JPEG, PNG or WebP and
checks the size of every picture (`server/src/utils/images.js`).

**The saving tips** are not AI at all. Each rule compares this month against the
student's own three-month average and states how much money the advice is worth
per month; the list is ranked by that figure. No tip is generic — every one
quotes real numbers from that student's history.

**The forecast** is a least-squares line through the last six months. It refuses
to answer with fewer than three months of data and reports how far the line
typically sits from the actual points, rather than implying precision it does
not have.

None of this is financial advice, and the interface says so where it matters.

---

## Design and accessibility

The interface is written rather than assembled. A few decisions worth naming:

- **Light by default, with a dark theme.** Both are designed against their own
  surface rather than one being an inversion of the other. The choice is saved
  to the device *and* the account, so it follows the student to another machine.
  Settings also offers "match my device", which follows the operating system live.
- **Neutral, with one green.** Grey and white pages (charcoal in dark mode),
  and a single deep emerald (`#047857`, white text at 5.5:1) kept for what you
  can act on and the few highlights - green because it reads as money that is
  growing. Near-black ink carries the dashboard hero, the sign-in panel and the
  landing hero; soft tints separate the four kinds of money (rose for
  spending, mint for income, cream for budgets, blue for savings). Headings are set in Inter Tight, body text in Inter; buttons
  are pills and cards are generously rounded. The landing page is built from
  the same tokens, so the page you arrive on and the app you sign into are
  visibly one product. The layout was modelled on the style of the Hisab Kitab
  expense app; the code and all the copy are our own.
- **Illustrations are small 3D scenes** (`client/src/components/Illustrations.jsx`).
  Each is a few 3D objects arranged at different sizes, angles and depths over
  a soft glow, each with its own floor shadow and slow float, so nearer objects
  move more and the page reads as having depth. The objects come from
  Microsoft's **Fluent Emoji** set, used under the MIT licence; the files and
  the licence are stored in `client/public/art`, so nothing is fetched from
  outside at runtime. The layout, animation and composition are our own.
- **A logo and a mascot.** The mark is a gold coin on an emerald tile, drawn
  in SVG (`client/src/components/Brand.jsx`) so it is sharp from the favicon
  to the hero. The chat assistant has a face - Coin, the gold coin from the
  logo with eyes that blink and a speech bubble whose dots move while it
  answers (`client/src/components/CoinBot.jsx`) - on its button, its
  messages and its header, and in Settings beside what it has learned.
- **Pictures only where they help.** Navigation and lists use clean line
  icons; categories are their icon in their own colour. The 3D scenes are kept
  for empty states, quick add, the receipt card and the landing page.
- **The dashboard widgets the SRS names:** quick-add buttons (chai, rickshaw,
  printing, allowance) that open the form already filled in, "Top category
  this month", budget against actual, and the repeating payments coming up next.
- **Motion explains, it does not decorate** (`client/src/styles/motion.css`).
  Sections arrive top to bottom, charts draw themselves (the donut sweeps in
  ranked order, lines trace, bars grow), headline figures count up, and budget
  bars fill, which is the SRS's "smooth transitions while charts and insights
  are generated". Every entrance ends at the element's normal resting style, so
  with the system's reduced-motion setting on, pages simply appear complete.
- **Text size is adjustable** from Settings and scales the whole interface,
  charts included.
- Keyboard focus is always visible, `prefers-reduced-motion` is respected, the
  layout works down to 360px, and every chart is backed by a table of the same
  numbers.

---

## Deploying to Vercel

1. Push the repository to GitHub and import it into Vercel.
2. Add a MongoDB Atlas connection string as `MONGO_URI` (or connect the Atlas
   integration, which provides `MONGODB_URI`). **This is required** — the
   embedded database cannot run in a serverless function.
3. Set `JWT_SECRET` and `CRON_SECRET`.
4. Deploy. `vercel.json` handles the build, the API routing and the daily cron
   that writes recurring transactions.

---

## Project deliverables checklist

- [x] Problem definition, design specification and database design — see the
      project report
- [x] Installation instructions — above
- [x] User credentials for all user types — above
- [x] Test data — seeded automatically on first run (`server/src/seed/`)
- [x] Sitemap on the home page — `/` and `/sitemap`
- [ ] Demonstration video (.mp4) — to record
- [ ] Project report with flowcharts and DFDs — to write

---

## Development helper

`shot.mjs` drives headless Chrome to screenshot every page of the running app
into `shots/`. It is a development convenience and is not part of the
application — delete it before submitting if you prefer.

```bash
node shot.mjs ./shots
```
