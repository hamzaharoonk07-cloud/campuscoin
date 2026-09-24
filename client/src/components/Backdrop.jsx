// The slow-moving scenery behind every signed-in page: three soft colour washes
// that drift, and a handful of small shapes that float. It is decoration only,
// so it is hidden from screen readers, never takes a click, sits behind the
// content, and stands still for anyone who has asked for reduced motion.

const SHAPES = [
  // kind, left, top, size, colour, float duration (s)
  ['coin', '14%', '22%', 38, 'var(--accent)', 9],
  ['diamond', '46%', '9%', 16, 'var(--series-out)', 11],
  ['spark', '88%', '30%', 22, 'var(--accent)', 8],
  ['ring', '72%', '78%', 34, 'var(--series-in)', 12],
  ['dot', '30%', '64%', 10, 'var(--cat-5)', 7],
  ['coin', '94%', '62%', 30, 'var(--series-in)', 10],
  ['plus', '58%', '46%', 14, 'var(--cat-3)', 9],
  ['diamond', '8%', '84%', 13, 'var(--accent)', 13],
];

function Shape({ kind, size }) {
  if (kind === 'coin') {
    // A tilted rounded tile with a currency mark, like a coin on a table.
    return (
      <svg width={size} height={size} viewBox="0 0 40 40">
        <rect x="4" y="4" width="32" height="32" rx="9" fill="currentColor" opacity="0.22" />
        <rect x="4" y="4" width="32" height="32" rx="9" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
        <path d="M24 15.5c-.8-1-2.1-1.6-3.6-1.6-2 0-3.6 1.1-3.6 2.7s1.6 2.5 3.6 2.7c2 .2 3.6 1.1 3.6 2.7s-1.6 2.7-3.6 2.7c-1.5 0-2.8-.6-3.6-1.6M20.4 11.5v17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </svg>
    );
  }
  if (kind === 'diamond') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20">
        <rect x="4" y="4" width="12" height="12" rx="2" transform="rotate(45 10 10)" fill="currentColor" opacity="0.4" />
      </svg>
    );
  }
  if (kind === 'spark') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M12 2c.6 4.6 2.4 7.4 10 10-7.6 2.6-9.4 5.4-10 10-.6-4.6-2.4-7.4-10-10 7.6-2.6 9.4-5.4 10-10z" fill="currentColor" opacity="0.4" />
      </svg>
    );
  }
  if (kind === 'ring') {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="5" opacity="0.2" />
      </svg>
    );
  }
  if (kind === 'plus') {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20">
        <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 10 10">
      <circle cx="5" cy="5" r="5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <span className="wash wash-1" />
      <span className="wash wash-2" />
      <span className="wash wash-3" />
      {SHAPES.map(([kind, left, top, size, colour, duration], i) => (
        <span
          // eslint-disable-next-line react/no-array-index-key -- a fixed list
          key={i}
          className={`float float-${kind}`}
          style={{
            left,
            top,
            color: colour,
            animationDuration: `${duration}s`,
            // Negative delays start each shape part-way through its loop, so
            // they are never all at the top of their float at once.
            animationDelay: `${-i * 1.7}s`,
          }}
        >
          <Shape kind={kind} size={size} />
        </span>
      ))}
    </div>
  );
}
