import { useId } from 'react';

/**
 * The Campus Coin mark: a blue coin with a white C cut into it.
 *
 * The C is a thick ring left open on the right, and the dot in its middle is
 * the coin's centre - so the mark reads as a letter and as a coin at once.
 * A soft light across the top gives the disc a little depth. It is flat
 * enough to stay crisp at favicon size and needs no image file.
 */
export function BrandMark({ size = 30 }) {
  const id = `bm${useId().replace(/:/g, '')}`;
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-disc`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#8db3ff" />
          <stop offset="0.5" stopColor="#5b91ff" />
          <stop offset="1" stopColor="#3566dc" />
        </linearGradient>
        <radialGradient id={`${id}-light`} cx="0.35" cy="0.2" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill={`url(#${id}-disc)`} />
      <circle cx="24" cy="24" r="24" fill={`url(#${id}-light)`} />
      <circle cx="24" cy="24" r="22.5" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1" />
      {/* the C: a ring open on the right, from 45° round to 315° */}
      <path d="M32.5 15.5A12 12 0 1 0 32.5 32.5" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" />
      {/* the coin's centre */}
      <circle cx="24" cy="24" r="3.4" fill="#fff" />
    </svg>
  );
}

/** The mark with the name beside it. */
export function Wordmark({ size = 30 }) {
  return (
    <>
      <BrandMark size={size} />
      <span className="wordmark">
        Campus<b>Coin</b>
      </span>
    </>
  );
}
