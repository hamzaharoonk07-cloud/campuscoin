import { useId } from 'react';

/**
 * The Campus Coin mark: a gold coin standing on an emerald tile, the shape of
 * an app icon. The depth is all gradient and highlight - a lit top edge on the
 * tile, a darker rim and a stacked edge under the coin, an embossed C on its
 * face and a glint of light - so it holds up from a 16px favicon to the size
 * of a hero, in either theme, without an image file.
 */
export function BrandMark({ size = 30 }) {
  const id = `bm${useId().replace(/:/g, '')}`;
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-tile`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="0.55" stopColor="#059669" />
          <stop offset="1" stopColor="#064e3b" />
        </linearGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fef3c7" />
          <stop offset="0.35" stopColor="#fcd34d" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#92400e" />
        </linearGradient>
        <radialGradient id={`${id}-shine`} cx="0.3" cy="0.2" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* tile, with a lit top edge */}
      <rect width="48" height="48" rx="14" fill={`url(#${id}-tile)`} />
      <rect width="48" height="48" rx="14" fill={`url(#${id}-shine)`} />
      <path d="M8 4.5h32" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />
      {/* the coin's stacked edge, then its face */}
      <ellipse cx="24" cy="28.5" rx="13" ry="12.5" fill="#064e3b" opacity="0.35" />
      <circle cx="24" cy="26" r="13" fill={`url(#${id}-rim)`} />
      <circle cx="24" cy="24.4" r="12.2" fill={`url(#${id}-gold)`} />
      <circle cx="24" cy="24.4" r="9.3" fill="none" stroke="#b45309" strokeOpacity="0.45" strokeWidth="1.2" />
      {/* an embossed C: a dark stroke with a light one offset above it */}
      <path d="M28.6 20.2a6.2 6.2 0 1 0 0 8.4" fill="none" stroke="#92400e" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M28.6 19.4a6.2 6.2 0 1 0 0 8.4" fill="none" stroke="#fffbeb" strokeOpacity="0.55" strokeWidth="1.1" strokeLinecap="round" />
      {/* a glint of light */}
      <path d="M17.5 16.6c1.6-1.7 3.6-2.6 5.8-2.8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
      <path d="M37.5 9.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="#fff" opacity="0.9" />
    </svg>
  );
}

/** The mark with the two-tone name beside it. */
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
