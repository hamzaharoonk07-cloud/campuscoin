import { useEffect, useState } from 'react';
import { BrandMark } from './Brand.jsx';

// Short lines that change while the app gets ready, so a slow connection
// feels like progress rather than a stall.
const LINES = ['Counting your coins', 'Sorting your categories', 'Drawing your charts', 'Checking your budgets'];

/**
 * The full-screen loader: the coin logo with a blue ring running round it on
 * the app's black frame. The same design is written into index.html so it is
 * on screen before any JavaScript has arrived; this component takes over
 * while the saved sign-in is checked, so the two join up without a flash.
 */
export default function Loader({ label }) {
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (label) return undefined;
    const timer = setInterval(() => setLine((n) => (n + 1) % LINES.length), 1400);
    return () => clearInterval(timer);
  }, [label]);

  return (
    <div className="app-loader" role="status" aria-live="polite">
      <div className="app-loader-mark">
        <svg className="app-loader-ring" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" />
          <circle className="is-run" cx="50" cy="50" r="46" pathLength="100" />
        </svg>
        <BrandMark size={56} />
      </div>
      <strong className="app-loader-name">Campus Coin</strong>
      <span className="app-loader-line" key={label || line}>
        {label || LINES[line]}
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
