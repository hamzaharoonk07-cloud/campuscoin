import { useId } from 'react';

/* ---------------------------------------------------------------------------
   Illustrations, drawn in SVG rather than downloaded.

   Each one is built from the app's own colour tokens, so it recolours with
   the theme and stays sharp at any size, and none of them costs a network
   request. Depth comes from the same three tricks throughout: a gradient
   from light to dark down each shape, a thin highlight along its top edge,
   and a soft shadow ellipse on the "floor". Parts marked ill-float bob
   gently and ill-twinkle sparkles fade in and out (pictures.css); both stand
   still under reduced motion.
--------------------------------------------------------------------------- */

const stop = (offset, color, opacity = 1) => <stop offset={offset} style={{ stopColor: color, stopOpacity: opacity }} />;

/** Gradients and the floor shadow shared by every illustration. */
function Defs({ id }) {
  return (
    <defs>
      <linearGradient id={`${id}-accent`} x1="0" y1="0" x2="0" y2="1">
        {stop('0%', 'color-mix(in srgb, var(--accent) 70%, #fff)')}
        {stop('100%', 'var(--accent-deep)')}
      </linearGradient>
      <linearGradient id={`${id}-navy`} x1="0" y1="0" x2="1" y2="1">
        {stop('0%', 'var(--navy-raised)')}
        {stop('100%', 'var(--navy)')}
      </linearGradient>
      <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
        {stop('0%', '#fde68a')}
        {stop('55%', '#fbbf24')}
        {stop('100%', '#d97706')}
      </linearGradient>
      <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="0" y2="1">
        {stop('0%', '#ffffff')}
        {stop('100%', '#eef2f0')}
      </linearGradient>
      <linearGradient id={`${id}-mint`} x1="0" y1="0" x2="0" y2="1">
        {stop('0%', 'var(--sky)')}
        {stop('100%', 'color-mix(in srgb, var(--sky) 55%, var(--accent))')}
      </linearGradient>
      <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
        {stop('0%', 'var(--tile-in)', 1)}
        {stop('100%', 'var(--tile-in)', 0)}
      </radialGradient>
      <radialGradient id={`${id}-floor`} cx="0.5" cy="0.5" r="0.5">
        {stop('0%', '#0f1f19', 0.28)}
        {stop('100%', '#0f1f19', 0)}
      </radialGradient>
    </defs>
  );
}

function Frame({ label, children, className = '' }) {
  const id = `ill${useId().replace(/:/g, '')}`;
  return (
    <svg className={`ill ${className}`} viewBox="0 0 240 180" role="img" aria-label={label}>
      <Defs id={id} />
      {children(id)}
    </svg>
  );
}

/** A four-point sparkle. */
const Spark = ({ x, y, r = 6, color = 'var(--sky)', delay = 0 }) => (
  <path
    className="ill-twinkle"
    style={{ animationDelay: `${delay}s` }}
    d={`M${x} ${y - r}C${x + r * 0.15} ${y - r * 0.15} ${x + r * 0.15} ${y - r * 0.15} ${x + r} ${y}C${x + r * 0.15} ${y + r * 0.15} ${x + r * 0.15} ${y + r * 0.15} ${x} ${y + r}C${x - r * 0.15} ${y + r * 0.15} ${x - r * 0.15} ${y + r * 0.15} ${x - r} ${y}C${x - r * 0.15} ${y - r * 0.15} ${x - r * 0.15} ${y - r * 0.15} ${x} ${y - r}z`}
    fill={color}
  />
);

/** A coin seen slightly from above: rim, face and a currency stroke. */
const Coin = ({ id, x, y, r = 16, className = '', delay = 0 }) => (
  <g className={className} style={{ animationDelay: `${delay}s` }}>
    <ellipse cx={x} cy={y + r * 0.22} rx={r} ry={r * 0.92} fill="#b45309" />
    <ellipse cx={x} cy={y} rx={r} ry={r * 0.92} fill={`url(#${id}-gold)`} />
    <ellipse cx={x} cy={y} rx={r * 0.72} ry={r * 0.66} fill="none" stroke="#fef3c7" strokeWidth="1.6" opacity="0.8" />
    <path d={`M${x + r * 0.22} ${y - r * 0.28}c-.3-.4-.8-.6-1.4-.6-1 0-1.6.5-1.6 1.2s.7 1 1.6 1.1c.9.1 1.6.5 1.6 1.2s-.7 1.2-1.6 1.2c-.6 0-1.1-.3-1.4-.6M${x} ${y - r * 0.42}v${r * 0.84}`} fill="none" stroke="#92400e" strokeWidth="1.8" strokeLinecap="round" transform={`translate(${-r * 0.02} 0) scale(1)`} />
    <path d={`M${x - r * 0.6} ${y - r * 0.5}q${r * 0.3} -${r * 0.35} ${r * 0.7} -${r * 0.35}`} fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
  </g>
);

const Floor = ({ id, x = 120, y = 160, w = 90 }) => <ellipse cx={x} cy={y} rx={w} ry={9} fill={`url(#${id}-floor)`} />;
const Glow = ({ id, x = 120, y = 88, r = 78 }) => <circle cx={x} cy={y} r={r} fill={`url(#${id}-glow)`} />;

/* --- The set ---------------------------------------------------------------- */

export function WalletArt({ label = 'A wallet with coins' }) {
  return (
    <Frame label={label}>
      {(id) => (
        <>
          <Glow id={id} />
          <Floor id={id} />
          {/* card peeking out */}
          <g transform="rotate(-8 128 70)">
            <rect x="92" y="46" width="88" height="54" rx="8" fill={`url(#${id}-mint)`} />
            <rect x="92" y="58" width="88" height="9" fill="var(--navy)" opacity="0.55" />
            <rect x="102" y="78" width="26" height="6" rx="3" fill="#fff" opacity="0.8" />
          </g>
          {/* wallet body */}
          <rect x="58" y="70" width="128" height="84" rx="16" fill={`url(#${id}-accent)`} />
          <path d="M58 86a16 16 0 0 1 16-16h96a16 16 0 0 1 16 16" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" />
          <rect x="146" y="98" width="52" height="30" rx="10" fill={`url(#${id}-navy)`} />
          <circle cx="163" cy="113" r="6" fill="var(--sky)" />
          <path d="M70 142h60" stroke="#fff" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" />
          <Coin id={id} x={62} y={52} r={15} className="ill-float" />
          <Coin id={id} x={196} y={62} r={11} className="ill-float" delay={-2} />
          <Spark x={40} y={96} r={6} delay={0.4} />
          <Spark x={210} y={30} r={7} color="#fbbf24" delay={1.2} />
        </>
      )}
    </Frame>
  );
}

export function GaugeArt({ label = 'A budget gauge' }) {
  // A half-circle dial: the green arc is what is left, the needle is how much
  // of the budget is used.
  return (
    <Frame label={label}>
      {(id) => (
        <>
          <Glow id={id} />
          <Floor id={id} w={80} />
          <rect x="50" y="46" width="140" height="104" rx="18" fill="var(--surface)" stroke="var(--line)" />
          <path d="M72 128a48 48 0 0 1 96 0" fill="none" stroke="var(--sunken)" strokeWidth="14" strokeLinecap="round" />
          <path className="ill-draw" pathLength="1" d="M72 128a48 48 0 0 1 96 0" fill="none" stroke={`url(#${id}-accent)`} strokeWidth="14" strokeLinecap="round" strokeDasharray="0.72 1" />
          <g className="ill-needle">
            <path d="M120 128 L150 96" stroke={`url(#${id}-navy)`} strokeWidth="5" strokeLinecap="round" />
          </g>
          <circle cx="120" cy="128" r="8" fill={`url(#${id}-navy)`} />
          <circle cx="120" cy="128" r="3" fill="var(--sky)" />
          <rect x="96" y="138" width="48" height="6" rx="3" fill="var(--muted)" opacity="0.35" />
          <g className="ill-pop">
            <rect x="152" y="30" width="58" height="26" rx="13" fill={`url(#${id}-accent)`} />
            <rect x="162" y="40" width="38" height="6" rx="3" fill="#fff" opacity="0.85" />
          </g>
          <Coin id={id} x={46} y={60} r={12} className="ill-float" />
          <Spark x={200} y={120} r={6} delay={0.7} />
        </>
      )}
    </Frame>
  );
}

export function ReceiptArt({ label = 'A phone scanning a receipt' }) {
  return (
    <Frame label={label}>
      {(id) => (
        <>
          <Glow id={id} />
          <Floor id={id} />
          {/* receipt paper */}
          <g className="ill-float" style={{ animationDelay: '-1s' }}>
            <path d="M44 34h70v112l-7-5-7 5-7-5-7 5-7-5-7 5-7-5-7 5-7-5-7 5z" fill={`url(#${id}-paper)`} stroke="var(--line-strong)" />
            <rect x="56" y="46" width="40" height="7" rx="3.5" fill="var(--text)" opacity="0.75" />
            {[64, 76, 88, 100].map((y) => (
              <g key={y}>
                <rect x="56" y={y} width="30" height="4" rx="2" fill="var(--muted)" opacity="0.45" />
                <rect x="92" y={y} width="12" height="4" rx="2" fill="var(--muted)" opacity="0.45" />
              </g>
            ))}
            <rect x="56" y="116" width="48" height="8" rx="4" fill="var(--accent)" opacity="0.85" />
          </g>
          {/* phone */}
          <g transform="rotate(8 160 92)">
            <rect x="124" y="30" width="74" height="126" rx="14" fill={`url(#${id}-navy)`} />
            <rect x="130" y="38" width="62" height="108" rx="9" fill="#fff" />
            <rect x="136" y="46" width="50" height="62" rx="6" fill="var(--tile-in)" />
            <path d="M144 58h34M144 68h26M144 78h30M144 90h22" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            <rect className="ill-scan" x="134" y="46" width="54" height="4" rx="2" fill="var(--accent)" />
            <rect x="140" y="116" width="42" height="12" rx="6" fill="var(--accent)" />
            <rect x="148" y="33" width="26" height="3" rx="1.5" fill="#fff" opacity="0.3" />
          </g>
          {/* found badge */}
          <g className="ill-pop">
            <circle cx="200" cy="44" r="16" fill={`url(#${id}-accent)`} />
            <path d="M192 44l6 6 10-11" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <Spark x={30} y={60} r={6} delay={0.2} />
        </>
      )}
    </Frame>
  );
}

export function ChartArt({ label = 'A chart of rising bars' }) {
  return (
    <Frame label={label}>
      {(id) => (
        <>
          <Glow id={id} />
          <Floor id={id} />
          <rect x="46" y="36" width="148" height="112" rx="16" fill="var(--surface)" stroke="var(--line)" />
          <rect x="46" y="36" width="148" height="22" rx="16" fill="var(--raised)" />
          <circle cx="60" cy="47" r="3.5" fill="var(--line-strong)" />
          <circle cx="71" cy="47" r="3.5" fill="var(--line-strong)" />
          {[
            [66, 44, 'var(--series-in)'],
            [88, 62, 'var(--series-out)'],
            [110, 52, 'var(--series-in)'],
            [132, 74, 'var(--series-out)'],
            [154, 66, 'var(--series-in)'],
          ].map(([x, h, c], i) => (
            <rect key={x} className="ill-grow" style={{ animationDelay: `${i * 0.12}s` }} x={x} y={134 - h} width="16" height={h} rx="4" fill={c} />
          ))}
          <path d="M60 106 L96 88 L118 96 L148 66 L178 58" fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="ill-draw" pathLength="1" />
          <circle cx="178" cy="58" r="6" fill="var(--accent)" stroke="#fff" strokeWidth="2.5" />
          {/* donut chip */}
          <g className="ill-float" transform="translate(186 108)">
            <circle r="22" fill="var(--surface)" stroke="var(--line)" />
            <circle r="13" fill="none" stroke="var(--cat-3)" strokeWidth="7" strokeDasharray="50 82" transform="rotate(-90)" />
            <circle r="13" fill="none" stroke="var(--cat-4)" strokeWidth="7" strokeDasharray="22 82" strokeDashoffset="-50" transform="rotate(-90)" />
          </g>
          <Spark x={36} y={40} r={6} delay={0.8} />
        </>
      )}
    </Frame>
  );
}

export function SproutArt({ label = 'A plant growing from a stack of coins' }) {
  return (
    <Frame label={label}>
      {(id) => (
        <>
          <Glow id={id} />
          <Floor id={id} w={70} />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <ellipse cx={120 + (i % 2 ? 3 : -2)} cy={150 - i * 11} rx={32} ry={9} fill="#b45309" />
              <ellipse cx={120 + (i % 2 ? 3 : -2)} cy={146 - i * 11} rx={32} ry={9} fill={`url(#${id}-gold)`} />
            </g>
          ))}
          {/* stem and leaves */}
          <g className="ill-sway">
            <path d="M120 100 C 120 80, 116 66, 122 46" fill="none" stroke="var(--accent-deep)" strokeWidth="4" strokeLinecap="round" />
            <path d="M121 66 C 100 64, 88 50, 90 36 C 108 36, 120 48, 121 66z" fill={`url(#${id}-accent)`} />
            <path d="M122 54 C 142 52, 156 38, 154 22 C 134 24, 122 36, 122 54z" fill={`url(#${id}-mint)`} />
            <path d="M121 66 C 108 58, 100 48, 96 40" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.5" />
          </g>
          <Coin id={id} x={62} y={70} r={13} className="ill-float" />
          <Spark x={176} y={80} r={7} color="#fbbf24" delay={0.3} />
          <Spark x={172} y={40} r={5} delay={1.4} />
        </>
      )}
    </Frame>
  );
}

export function ChatArt({ label = 'Chat bubbles with a spark' }) {
  return (
    <Frame label={label}>
      {(id) => (
        <>
          <Glow id={id} />
          <Floor id={id} />
          <g className="ill-float">
            <path d="M40 44h104a14 14 0 0 1 14 14v38a14 14 0 0 1-14 14H74l-18 16v-16H40a14 14 0 0 1-14-14V58a14 14 0 0 1 14-14z" fill="var(--surface)" stroke="var(--line)" />
            <rect x="42" y="62" width="80" height="7" rx="3.5" fill="var(--muted)" opacity="0.4" />
            <rect x="42" y="76" width="56" height="7" rx="3.5" fill="var(--muted)" opacity="0.4" />
            <rect x="42" y="90" width="40" height="7" rx="3.5" fill="var(--accent)" opacity="0.7" />
          </g>
          <g className="ill-float" style={{ animationDelay: '-2.5s' }}>
            <path d="M200 84H132a14 14 0 0 0-14 14v24a14 14 0 0 0 14 14h44l16 14v-14h8a14 14 0 0 0 14-14V98a14 14 0 0 0-14-14z" fill={`url(#${id}-accent)`} />
            {[146, 164, 182].map((x, i) => (
              <circle key={x} className="ill-dot" style={{ animationDelay: `${i * 0.18}s` }} cx={x} cy="110" r="5" fill="#fff" />
            ))}
          </g>
          <g transform="translate(186 44)">
            <circle r="18" fill={`url(#${id}-navy)`} />
            <Spark x={0} y={0} r={10} color="var(--sky)" />
          </g>
          <Spark x={30} y={132} r={6} color="#fbbf24" delay={1} />
        </>
      )}
    </Frame>
  );
}

export function TagsArt({ label = 'Category tags' }) {
  const tag = (x, y, r, color, w = 84) => (
    <g transform={`rotate(${r} ${x} ${y})`}>
      <path d={`M${x} ${y}h${w}l18 18-18 18h-${w}a8 8 0 0 1-8-8v-20a8 8 0 0 1 8-8z`} fill={color} />
      <circle cx={x + w + 4} cy={y + 18} r="4" fill="#fff" />
      <rect x={x + 10} y={y + 14} width={w - 36} height="8" rx="4" fill="#fff" opacity="0.75" />
    </g>
  );
  return (
    <Frame label={label}>
      {(id) => (
        <>
          <Glow id={id} />
          <Floor id={id} />
          <g className="ill-float" style={{ animationDelay: '-1s' }}>{tag(58, 104, -10, 'var(--cat-2)')}</g>
          <g className="ill-float" style={{ animationDelay: '-3s' }}>{tag(70, 72, 4, 'var(--cat-1)')}</g>
          <g className="ill-float">{tag(62, 40, -6, `url(#${id}-accent)`, 96)}</g>
          <Spark x={196} y={40} r={7} delay={0.5} />
          <Spark x={40} y={140} r={5} color="#fbbf24" delay={1.5} />
        </>
      )}
    </Frame>
  );
}

export function MegaphoneArt({ label = 'A megaphone' }) {
  return (
    <Frame label={label}>
      {(id) => (
        <>
          <Glow id={id} />
          <Floor id={id} />
          <g transform="rotate(-14 120 92)">
            <path d="M70 76h22l58-30v92l-58-30H70a10 10 0 0 1-10-10v-12a10 10 0 0 1 10-10z" fill={`url(#${id}-accent)`} />
            <rect x="150" y="44" width="14" height="96" rx="7" fill={`url(#${id}-navy)`} />
            <path d="M78 108l8 30h14l-6-30" fill="var(--accent-deep)" />
            <path d="M92 78l56-28" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" />
          </g>
          {[0, 1, 2].map((i) => (
            <path key={i} className="ill-wave" style={{ animationDelay: `${i * 0.3}s` }} d={`M${182 + i * 12} ${58 - i * 6}q${14 + i * 4} ${22 + i * 4} 0 ${46 + i * 12}`} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
          ))}
          <Spark x={46} y={48} r={6} delay={0.9} />
        </>
      )}
    </Frame>
  );
}
