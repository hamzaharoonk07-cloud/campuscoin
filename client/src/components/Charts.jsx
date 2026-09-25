import { useEffect, useState } from 'react';
import { compactMoney, money, slotColor } from '../lib/format.js';

/* ---------------------------------------------------------------------------
   Charts, drawn by hand in SVG.

   Rules the whole set follows:
   - One value axis. Income and spending share it because they share a unit.
   - Two series are told apart by blue and orange, not green and red: the
     green/red pair is the one that collapses under red-green colour blindness.
   - A legend whenever there is more than one series, and the value written on
     the bar you are pointing at rather than on every bar.
   - Recessive gridlines, a 2px gap between neighbouring bars, rounded tops.
--------------------------------------------------------------------------- */

// An SVG with a fixed viewBox scales its text down with its width, which on a
// phone leaves the labels unreadable. So the viewBox itself gets squarer below
// 640px: the chart keeps its height while the type stays the same size. On a
// wide screen, where a full-width chart would double its type, it gets wider.
const WIDE = { W: 1100, H: 300, PAD: { top: 16, right: 12, bottom: 28, left: 50 } };
const DESKTOP = { W: 640, H: 220, PAD: { top: 16, right: 12, bottom: 28, left: 46 } };
const PHONE = { W: 360, H: 240, PAD: { top: 14, right: 8, bottom: 26, left: 42 } };

function useChartBox() {
  const pick = () =>
    window.matchMedia('(max-width: 640px)').matches ? PHONE : window.matchMedia('(min-width: 1280px)').matches ? WIDE : DESKTOP;
  const [box, setBox] = useState(() => (typeof window !== 'undefined' ? pick() : DESKTOP));

  useEffect(() => {
    const queries = [window.matchMedia('(max-width: 640px)'), window.matchMedia('(min-width: 1280px)')];
    const apply = () => setBox(pick());
    apply();
    queries.forEach((q) => q.addEventListener('change', apply));
    return () => queries.forEach((q) => q.removeEventListener('change', apply));
  }, []);

  const plotW = box.W - box.PAD.left - box.PAD.right;
  const plotH = box.H - box.PAD.top - box.PAD.bottom;
  return { ...box, plotW, plotH };
}

/**
 * Chooses the axis top and how many gridlines to draw, together.
 *
 * Fixing the gridline count first forces a choice between round labels and a
 * tight fit: four lines over a 42k maximum either lands on "Rs 13k / Rs 38k" or
 * wastes half the panel by topping out at 80k. Trying three, four and five and
 * keeping whichever clean interval fits closest gets both.
 */
function niceScale(value) {
  if (value <= 0) return { max: 100, ticks: 4 };

  // Intervals that still read as round numbers once abbreviated to "k".
  const steps = [1, 2, 2.5, 5, 10];
  let best = null;

  for (const ticks of [3, 4, 5]) {
    const rough = value / ticks;
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    const interval = magnitude * (steps.find((step) => rough <= magnitude * step) ?? 10);
    const max = interval * ticks;
    if (!best || max < best.max) best = { max, ticks };
  }

  return best;
}

function Gridlines({ max, currency, ticks, box }) {
  const { W, PAD, plotH } = box;
  return (
    <g>
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const value = (max / ticks) * i;
        const y = PAD.top + plotH - (value / max) * plotH;
        return (
          <g key={i}>
            <line className="grid-line" x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end">
              {compactMoney(value, currency)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Tooltip({ point, children }) {
  if (!point) return null;
  return (
    <div className="chart-tooltip" style={{ left: `${point.xPct}%`, top: `${point.yPct}%` }}>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Income vs spending across the last months
--------------------------------------------------------------------------- */

export function TrendChart({ data, currency, title = 'Money in and out by month' }) {
  const [hover, setHover] = useState(null);
  const box = useChartBox();
  const { W, H, PAD, plotW, plotH } = box;

  if (!data?.length) return <p className="muted small">No months to compare yet.</p>;

  const { max, ticks } = niceScale(Math.max(...data.flatMap((d) => [d.income, d.expense]), 1));
  const slot = plotW / data.length;
  const barW = Math.min(26, Math.max(4, (slot - 8) / 2));

  return (
    <div className="chart-holder">
      <div className="legend">
        <span>
          <i className="swatch" style={{ background: 'var(--series-in)' }} /> Money in
        </span>
        <span>
          <i className="swatch" style={{ background: 'var(--series-out)' }} /> Money out
        </span>
      </div>

      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        <Gridlines max={max} ticks={ticks} currency={currency} box={box} />

        {data.map((row, i) => {
          const centre = PAD.left + slot * i + slot / 2;
          const inH = (row.income / max) * plotH;
          const outH = (row.expense / max) * plotH;
          const active = hover?.index === i;

          return (
            <g key={row.month}>
              {/* Money in - sits left of centre, with a 2px gap to its neighbour. */}
              <rect
                className="bar-grow"
                style={{ '--i': i * 2 }}
                x={centre - barW - 1}
                y={PAD.top + plotH - inH}
                width={barW}
                height={Math.max(inH, row.income > 0 ? 2 : 0)}
                rx="4"
                fill="var(--series-in)"
                opacity={hover && !active ? 0.45 : 1}
              />
              <rect
                className="bar-grow"
                style={{ '--i': i * 2 + 1 }}
                x={centre + 1}
                y={PAD.top + plotH - outH}
                width={barW}
                height={Math.max(outH, row.expense > 0 ? 2 : 0)}
                rx="4"
                fill="var(--series-out)"
                opacity={hover && !active ? 0.45 : 1}
              />

              <text x={centre} y={H - 9} textAnchor="middle" fill={active ? 'var(--text)' : undefined}>
                {row.label}
              </text>

              {/* The hit area is the whole column, not the bars - far easier to hit. */}
              <rect
                className="hit"
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={plotH}
                onMouseEnter={() =>
                  setHover({ index: i, row, xPct: (centre / W) * 100, yPct: ((PAD.top + plotH - Math.max(inH, outH) - 10) / H) * 100 })
                }
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}

        <line className="axis-line" x1={PAD.left} x2={W - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} />
      </svg>

      <Tooltip point={hover}>
        {hover && (
          <>
            <strong>{hover.row.label}</strong>
            <div className="num">In {money(hover.row.income, currency)}</div>
            <div className="num">Out {money(hover.row.expense, currency)}</div>
            <div className="num muted">Kept {money(hover.row.balance, currency)}</div>
          </>
        )}
      </Tooltip>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Day-by-day spending across one month
--------------------------------------------------------------------------- */

export function DayBars({ data, currency, average = 0 }) {
  const [hover, setHover] = useState(null);
  const box = useChartBox();
  const { W, H, PAD, plotW, plotH } = box;

  if (!data?.length) return <p className="muted small">No days to show yet.</p>;

  const { max, ticks } = niceScale(Math.max(...data.map((d) => d.total), 1));
  const slot = plotW / data.length;
  const barW = Math.max(2, slot - 2);
  const avgY = average > 0 ? PAD.top + plotH - (average / max) * plotH : null;

  return (
    <div className="chart-holder">
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Spending by day">
        <Gridlines max={max} ticks={ticks} currency={currency} box={box} />

        {data.map((row, i) => {
          const x = PAD.left + slot * i;
          const h = (row.total / max) * plotH;
          const active = hover?.index === i;
          return (
            <g key={row.date}>
              <rect
                className="bar-grow"
                style={{ '--i': i * 0.6 }}
                x={x + 1}
                y={PAD.top + plotH - h}
                width={barW}
                height={Math.max(h, row.total > 0 ? 2 : 0)}
                rx="3"
                fill="var(--series-out)"
                opacity={hover && !active ? 0.4 : row.total > 0 ? 1 : 0}
              />
              {(i === 0 || (i + 1) % (W < 500 ? 7 : 5) === 0) && (
                <text x={x + slot / 2} y={H - 9} textAnchor="middle">
                  {row.day}
                </text>
              )}
              <rect
                className="hit"
                x={x}
                y={PAD.top}
                width={slot}
                height={plotH}
                onMouseEnter={() =>
                  setHover({ index: i, row, xPct: ((x + slot / 2) / W) * 100, yPct: ((PAD.top + plotH - h - 10) / H) * 100 })
                }
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}

        {/* The average is a reference line, so it is dashed and unlabelled until hovered. */}
        {avgY !== null && (
          <g>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={avgY}
              y2={avgY}
              stroke="var(--line-strong)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text x={W - PAD.right} y={avgY - 6} textAnchor="end">
              average {compactMoney(average, currency)}
            </text>
          </g>
        )}

        <line className="axis-line" x1={PAD.left} x2={W - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} />
      </svg>

      <Tooltip point={hover}>
        {hover && (
          <>
            <strong>Day {hover.row.day}</strong>
            <div className="num">{money(hover.row.total, currency)}</div>
          </>
        )}
      </Tooltip>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   The category spine - share, amount and the budget cap in one row.
   Built in HTML rather than SVG so the labels wrap and read like text.
--------------------------------------------------------------------------- */

export function CategorySpine({ rows, currency, budgets = [], emptyText = 'Nothing logged for this month yet.' }) {
  if (!rows?.length) return <p className="muted small">{emptyText}</p>;

  const max = Math.max(...rows.map((r) => r.total), 1);
  const capFor = new Map(budgets.map((b) => [String(b.category?._id ?? b.category), b.limitAmount]));

  return (
    <div className="spine">
      {rows.map((row) => {
        const cap = capFor.get(String(row.categoryId));
        // The cap is drawn against the same scale as the bar, so its notch sits
        // exactly where the spending would have to stop.
        const capPct = cap ? Math.min(100, (cap / max) * 100) : null;
        const over = cap && row.total > cap;

        return (
          <div className="spine-row" key={row.categoryId}>
            <div className="spine-name">
              <i className="swatch" style={{ background: slotColor(row.slot) }} />
              <span>{row.name}</span>
              {over ? <span className="pill is-bad">over cap</span> : null}
            </div>
            <div className="spine-amount num">
              {money(row.total, currency)} <span className="muted small">{row.share}%</span>
              {/* The cap is named here rather than floated over the bar, where it
                  used to collide with the amount and the category name. */}
              {cap ? <div className="muted small nowrap">cap {money(cap, currency)}</div> : null}
            </div>
            <div className="spine-bar">
              <div
                className="spine-fill"
                style={{ width: `${Math.max(2, (row.total / max) * 100)}%`, background: slotColor(row.slot) }}
              />
              {capPct !== null && (
                <div className="spine-cap" style={{ left: `${capPct}%` }} title={`Budget cap ${money(cap, currency)}`} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Budget progress - a meter per category, with the state said in words
--------------------------------------------------------------------------- */

export function BudgetMeter({ budget, currency }) {
  const tone = budget.state === 'exceeded' ? 'bad' : budget.state === 'warning' ? 'warn' : 'good';
  const label = budget.state === 'exceeded' ? 'Over' : budget.state === 'warning' ? 'Close' : 'On track';

  return (
    <div className="spine-row">
      <div className="spine-name">
        <i className="swatch" style={{ background: slotColor(budget.category.slot) }} />
        <span>{budget.category.name}</span>
        <span className={`pill is-${tone}`}>{label}</span>
      </div>
      <div className="spine-amount num">
        {money(budget.spent, currency)} <span className="muted small">of {money(budget.limitAmount, currency)}</span>
      </div>
      <div className="spine-bar">
        <div
          className="spine-fill"
          style={{
            width: `${Math.min(100, budget.pct)}%`,
            background: tone === 'bad' ? 'var(--bad)' : tone === 'warn' ? 'var(--warn)' : slotColor(budget.category.slot),
          }}
        />
      </div>
    </div>
  );
}
