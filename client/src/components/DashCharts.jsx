import { useId, useState } from 'react';
import { compactMoney, money, slotColor } from '../lib/format.js';
import { categoryArt } from './Illustrations.jsx';

/* ---------------------------------------------------------------------------
   The dashboard's chart set, drawn by hand in SVG.

   These keep the rules the rest of the app's charts follow: category colour
   comes from the validated palette slot so it is legible in both themes and
   for colour-blind readers, every value is direct-labelled somewhere so
   identity never rests on colour alone, and marks stay flat - the material
   belongs to the card, not to the data.
--------------------------------------------------------------------------- */

/* --- Donut ---------------------------------------------------------------- */

const TAU = Math.PI * 2;

/** A ring segment as an SVG path, from one angle to another. */
function arc(cx, cy, rOuter, rInner, from, to) {
  const large = to - from > Math.PI ? 1 : 0;
  const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x1, y1] = p(rOuter, from);
  const [x2, y2] = p(rOuter, to);
  const [x3, y3] = p(rInner, to);
  const [x4, y4] = p(rInner, from);
  return `M${x1} ${y1} A${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L${x3} ${y3} A${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
}

export function DonutChart({ rows, currency, total, caption = 'Spent this month' }) {
  const [hover, setHover] = useState(null);
  const maskId = `sweep${useId().replace(/:/g, '')}`;

  if (!rows?.length) return <p className="muted small">Nothing logged for this month yet.</p>;

  const sum = rows.reduce((acc, r) => acc + r.total, 0) || 1;
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;

  // A 2px gap between segments, expressed as an angle so it stays even.
  const gap = 0.022;
  let angle = -Math.PI / 2;

  const segments = rows.map((row) => {
    const sweep = (row.total / sum) * TAU;
    const seg = { row, from: angle + gap / 2, to: angle + sweep - gap / 2 };
    angle += sweep;
    return seg;
  });

  const shown = hover !== null ? rows[hover] : null;

  return (
    <div className="donut">
      <div className="donut-ring">
        <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Spending by category">
          {/* The ring is revealed by a single stroke that sweeps round once, so
              the categories appear in the order they are ranked. */}
          <mask id={maskId}>
            <circle
              className="donut-sweep"
              cx={cx}
              cy={cy}
              r="75"
              fill="none"
              stroke="#fff"
              strokeWidth="38"
              pathLength="1"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          </mask>
          <g mask={`url(#${maskId})`}>
          {segments.map((seg, i) => (
            <path
              key={seg.row.categoryId}
              d={arc(cx, cy, 92, hover === i ? 58 : 62, seg.from, Math.max(seg.from + 0.002, seg.to))}
              fill={slotColor(seg.row.slot)}
              opacity={hover === null || hover === i ? 1 : 0.35}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
            />
          ))}
          </g>
          {/* Each slice big enough to hold it carries its category's picture,
              so the chart reads without matching colours to the legend. */}
          {segments.map((seg, i) => {
            if (seg.to - seg.from < 0.42) return null;
            const mid = (seg.from + seg.to) / 2;
            const x = cx + 77 * Math.cos(mid);
            const y = cy + 77 * Math.sin(mid);
            return (
              <g key={`art${seg.row.categoryId}`} className="donut-art" style={{ '--i': i }} pointerEvents="none">
                <circle cx={x} cy={y} r="15" fill="#fff" />
                <image href={categoryArt(seg.row.icon)} x={x - 10} y={y - 10} width="20" height="20" />
              </g>
            );
          })}
        </svg>

        <div className="donut-centre">
          <span className="donut-centre-label">{shown ? shown.name : caption}</span>
          <strong className="num">{money(shown ? shown.total : total ?? sum, currency)}</strong>
          {shown ? <span className="donut-centre-share num">{shown.share}%</span> : null}
        </div>
      </div>

      {/* The legend carries the figures too, so the chart is readable without
          hovering and without relying on colour alone. */}
      <ul className="donut-legend">
        {rows.map((row, i) => (
          <li
            key={row.categoryId}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => setHover((was) => (was === i ? null : i))}
            className={hover === i ? 'is-on' : undefined}
          >
            <i style={{ background: slotColor(row.slot) }} />
            <img className="donut-legend-art" src={categoryArt(row.icon)} alt="" width="20" height="20" />
            <span>
              {row.name} <small className="num">{row.share}%</small>
            </span>
            <strong className="num">{money(row.total, currency)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --- Area chart ----------------------------------------------------------- */

function niceScale(value) {
  if (value <= 0) return { max: 100, ticks: 4 };
  const steps = [1, 2, 2.5, 5, 10];
  let best = null;
  for (const ticks of [3, 4]) {
    const rough = value / ticks;
    const m = 10 ** Math.floor(Math.log10(rough));
    const interval = m * (steps.find((s) => rough <= m * s) ?? 10);
    const max = interval * ticks;
    if (!best || max < best.max) best = { max, ticks };
  }
  return best;
}

/** Smooth path through points, so the trend reads as a flow rather than a zigzag. */
function smooth(points) {
  if (points.length < 2) return '';
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const mx = (x0 + x1) / 2;
    d += ` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
  }
  return d;
}

export function AreaChart({ data, currency }) {
  const [hover, setHover] = useState(null);

  if (!data?.length) return <p className="muted small">No months to compare yet.</p>;

  const W = 640;
  const H = 240;
  const PAD = { top: 18, right: 16, bottom: 30, left: 48 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const { max, ticks } = niceScale(Math.max(...data.flatMap((d) => [d.income, d.expense]), 1));
  const x = (i) => PAD.left + (plotW / Math.max(1, data.length - 1)) * i;
  const y = (v) => PAD.top + plotH - (v / max) * plotH;

  const series = [
    { key: 'income', label: 'Money in', colour: 'var(--series-in)', id: 'gIn' },
    { key: 'expense', label: 'Money out', colour: 'var(--series-out)', id: 'gOut' },
  ];

  return (
    <div className="chart-holder">
      <div className="legend">
        {series.map((s) => (
          <span key={s.key}>
            <i className="swatch" style={{ background: s.colour }} /> {s.label}
          </span>
        ))}
      </div>

      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Income and spending by month">
        <defs>
          {series.map((s) => (
            <linearGradient key={s.id} id={s.id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.colour} stopOpacity="0.35" />
              <stop offset="100%" stopColor={s.colour} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {Array.from({ length: ticks + 1 }, (_, i) => {
          const value = (max / ticks) * i;
          return (
            <g key={i}>
              <line className="grid-line" x1={PAD.left} x2={W - PAD.right} y1={y(value)} y2={y(value)} />
              <text x={PAD.left - 10} y={y(value) + 4} textAnchor="end">
                {compactMoney(value, currency)}
              </text>
            </g>
          );
        })}

        {series.map((s) => {
          const points = data.map((row, i) => [x(i), y(row[s.key])]);
          const line = smooth(points);
          return (
            <g key={s.key}>
              <path
                className="area-rise"
                d={`${line} L${x(data.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`}
                fill={`url(#${s.id})`}
              />
              <path className="line-draw" pathLength="1" d={line} fill="none" stroke={s.colour} strokeWidth="2" strokeLinecap="round" />
              {points.map(([px, py], i) => (
                <circle
                  key={i}
                  className="dot-pop"
                  style={{ '--i': i }}
                  cx={px}
                  cy={py}
                  r={hover === i ? 5 : 3.5}
                  fill={s.colour}
                  stroke="var(--surface)"
                  strokeWidth="2"
                />
              ))}
            </g>
          );
        })}

        {data.map((row, i) => (
          <g key={row.month}>
            <text x={x(i)} y={H - 10} textAnchor="middle" fill={hover === i ? 'var(--text)' : undefined}>
              {row.label}
            </text>
            <rect
              className="hit"
              x={x(i) - plotW / data.length / 2}
              y={PAD.top}
              width={plotW / data.length}
              height={plotH}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}

        {hover !== null ? (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PAD.top}
            y2={PAD.top + plotH}
            stroke="var(--line-strong)"
            strokeDasharray="3 3"
          />
        ) : null}
      </svg>

      {hover !== null ? (
        <div className="chart-tooltip" style={{ left: `${(x(hover) / W) * 100}%`, top: '8%' }}>
          <strong>{data[hover].label}</strong>
          <div className="num">In {money(data[hover].income, currency)}</div>
          <div className="num">Out {money(data[hover].expense, currency)}</div>
        </div>
      ) : null}
    </div>
  );
}

/* --- Sparkline ------------------------------------------------------------ */

/**
 * A small line of the last few months. `from` and `to` label its two ends
 * (the first and last month), so it reads as a trend over time and not as
 * decoration.
 */
export function Sparkline({ values, colour = 'var(--accent)', from, to }) {
  if (!values?.length) return null;

  const W = 160;
  const H = 42;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((v, i) => [
    (W / Math.max(1, values.length - 1)) * i,
    H - 4 - ((v - min) / span) * (H - 10),
  ]);

  const line = (
    <svg className="sparkline" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <path className="line-draw" pathLength="1" d={smooth(points)} fill="none" stroke={colour} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
  if (!from) return line;
  return (
    <div className="spark-wrap">
      {line}
      <span className="spark-ends">
        <span>{from}</span>
        <span>{values.length} months</span>
        <span>{to}</span>
      </span>
    </div>
  );
}

/* --- Ring gauge ----------------------------------------------------------- */

export function RingGauge({ pct, label, tone = 'ok' }) {
  const size = 118;
  const r = 48;
  const c = TAU * r;
  // The arc stops at a full circle, but the figure keeps going: clamping both
  // made an overspent month read as exactly on budget.
  const value = Math.max(0, Math.round(pct));
  const clamped = Math.min(100, value);
  const colour = tone === 'exceeded' ? 'var(--bad)' : tone === 'warning' ? 'var(--warn)' : 'var(--good)';

  return (
    <div className="ring">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${value} per cent ${label}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sunken)" strokeWidth="10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (clamped / 100) * c}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="ring-fill"
          style={{ '--c': c, transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="ring-centre">
        <strong className="num">{value}%</strong>
      </div>
    </div>
  );
}

/* --- Paired mini bars ----------------------------------------------------- */

export function MiniBars({ data }) {
  if (!data?.length) return null;

  const W = 150;
  const H = 46;
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const slot = W / data.length;
  const w = Math.max(3, slot / 2 - 3);

  return (
    <svg className="minibars" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {data.map((row, i) => {
        const cx = slot * i + slot / 2;
        return (
          <g key={row.month}>
            <rect
              className="bar-grow"
              style={{ '--i': i * 2 }}
              x={cx - w - 1}
              y={H - (row.income / max) * H}
              width={w}
              height={Math.max(2, (row.income / max) * H)}
              rx="2"
              fill="var(--series-in)"
            />
            <rect
              className="bar-grow"
              style={{ '--i': i * 2 + 1 }}
              x={cx + 1}
              y={H - (row.expense / max) * H}
              width={w}
              height={Math.max(2, (row.expense / max) * H)}
              rx="2"
              fill="var(--series-out)"
            />
          </g>
        );
      })}
    </svg>
  );
}

/* --- Money in and out by month, as plain bars ------------------------------ */

/**
 * Two bars a month - money in (blue) beside money out (black) - with the
 * scale on the left and the month under each pair. Built from HTML rather
 * than SVG so the text stays full size on a phone instead of shrinking with
 * the drawing. Tapping a month shows its three figures underneath; the
 * latest month is shown to begin with.
 */
export function MonthBars({ data, currency, dark = false }) {
  const [picked, setPicked] = useState(null);
  if (!data?.length) return <p className="muted small">No months to compare yet.</p>;

  // At least Rs 1,000 of scale, so tiny first amounts do not give labels like "Rs1, Rs1, Rs0".
  const { max, ticks } = niceScale(Math.max(...data.flatMap((d) => [d.income, d.expense]), 1000));
  const at = picked ?? data.length - 1;
  const shown = data[at];
  const kept = shown.income - shown.expense;
  const pct = (v) => `${Math.max(0, (v / max) * 100)}%`;

  return (
    <div className={`mbars${dark ? ' is-dark' : ''}`}>
      <div className="mbars-legend">
        <span>
          <i className="is-in" /> Money in
        </span>
        <span>
          <i className="is-out" /> Money out
        </span>
      </div>

      <div className="mbars-plot">
        <div className="mbars-scale" aria-hidden="true">
          {Array.from({ length: ticks + 1 }, (_, i) => ticks - i).map((t) => (
            <span key={t} style={{ bottom: `${(t / ticks) * 100}%` }}>
              {compactMoney((max / ticks) * t, currency)}
            </span>
          ))}
        </div>
        <div className="mbars-area">
          {Array.from({ length: ticks + 1 }, (_, i) => i).map((t) => (
            <i key={t} className="mbars-grid" style={{ bottom: `${(t / ticks) * 100}%` }} />
          ))}
          {data.map((m, i) => (
            <button
              key={m.month}
              type="button"
              className={`mbars-month${i === at ? ' is-on' : ''}`}
              onClick={() => setPicked(i)}
              aria-pressed={i === at}
              aria-label={`${m.label}: in ${money(m.income, currency)}, out ${money(m.expense, currency)}`}
            >
              <span className="mbars-pair">
                <i className="is-in" style={{ height: pct(m.income), '--i': i }} />
                <i className="is-out" style={{ height: pct(m.expense), '--i': i }} />
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="mbars-labels" aria-hidden="true">
        {data.map((m, i) => (
          <span key={m.month} className={i === at ? 'is-on' : ''}>
            {m.label}
          </span>
        ))}
      </div>

      <dl className="mbars-detail">
        <div>
          <dt>{shown.label} in</dt>
          <dd className="num">{money(shown.income, currency)}</dd>
        </div>
        <div>
          <dt>Out</dt>
          <dd className="num">{money(shown.expense, currency)}</dd>
        </div>
        <div>
          <dt>{kept >= 0 ? 'Kept' : 'Over by'}</dt>
          <dd className={`num${kept < 0 ? ' is-bad' : ' is-good'}`}>{money(Math.abs(kept), currency)}</dd>
        </div>
      </dl>
    </div>
  );
}
