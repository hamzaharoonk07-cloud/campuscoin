import { useId } from 'react';

/**
 * Coin, the assistant's face: the gold coin from the logo, brought to life.
 *
 * Drawn in SVG with the same gradients as the brand mark (Brand.jsx), so the
 * mascot and the logo are visibly the same object. The eyes blink, and while
 * the assistant is answering the dots in its speech bubble bounce (motion in
 * frame.css; still under reduced motion). `bubble={false}` drops the speech
 * bubble for the smallest sizes.
 */
export default function CoinBot({ size = 40, bubble = true, talking = false, className = '' }) {
  const id = `cb${useId().replace(/:/g, '')}`;
  return (
    <svg
      className={`coinbot${talking ? ' is-talking' : ''} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff7d6" />
          <stop offset="0.3" stopColor="#fcd34d" />
          <stop offset="1" stopColor="#e08a0b" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#9a4a0a" />
        </linearGradient>
        <linearGradient id={`${id}-bubble`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6f8f78" />
          <stop offset="1" stopColor="#3d5243" />
        </linearGradient>
        <radialGradient id={`${id}-shine`} cx="0.32" cy="0.25" r="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* the coin: its edge, its face, the engraved ring and a lit top */}
      <ellipse cx="29" cy="37.5" rx="24" ry="23" fill="#7c3a06" opacity="0.28" />
      <circle cx="29" cy="35" r="24" fill={`url(#${id}-rim)`} />
      <circle cx="29" cy="33" r="22.6" fill={`url(#${id}-face)`} />
      <circle cx="29" cy="33" r="22.6" fill={`url(#${id}-shine)`} />
      <circle cx="29" cy="33" r="18" fill="none" stroke="#b45309" strokeOpacity="0.35" strokeWidth="1.4" />

      {/* the face */}
      <ellipse cx="20" cy="38.5" rx="3.6" ry="2.2" fill="#fb7185" opacity="0.4" />
      <ellipse cx="38" cy="38.5" rx="3.6" ry="2.2" fill="#fb7185" opacity="0.4" />
      <g className="coinbot-eyes">
        <ellipse cx="22.5" cy="31" rx="2.8" ry="3.8" fill="#3b1d06" />
        <ellipse cx="35.5" cy="31" rx="2.8" ry="3.8" fill="#3b1d06" />
        <circle cx="23.5" cy="29.4" r="1.1" fill="#fff" />
        <circle cx="36.5" cy="29.4" r="1.1" fill="#fff" />
      </g>
      <path d="M23.5 38.6c3.1 3.4 7.9 3.4 11 0" fill="none" stroke="#7c2d12" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M14.6 22.4c2.4-3 5.7-4.9 9.4-5.4" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.85" />

      {bubble ? (
        <g className="coinbot-bubble">
          <path d="M44 4h14a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5h-8l-6 5 1.2-5.4A5 5 0 0 1 39 17V9a5 5 0 0 1 5-5z" fill={`url(#${id}-bubble)`} />
          <path d="M43 6.5h14" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.4" strokeLinecap="round" />
          <circle className="coinbot-dot" cx="45.5" cy="13" r="1.9" fill="#fff" />
          <circle className="coinbot-dot" cx="51" cy="13" r="1.9" fill="#fff" />
          <circle className="coinbot-dot" cx="56.5" cy="13" r="1.9" fill="#fff" />
        </g>
      ) : null}
    </svg>
  );
}
