import { useEffect, useRef, useState } from 'react';

/**
 * Counts a figure up to its value once, when it first arrives.
 *
 * This is the only motion in the app that nobody asked for, and it is here for
 * one reason: the month's balance is the first thing a student looks at, and
 * watching it settle makes them read it rather than skip past it. It runs once
 * per value, never on a re-render, and does nothing at all when the viewer has
 * asked for reduced motion.
 */
export function useCountUp(value, { duration = 850 } = {}) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || from.current === target) {
      setShown(target);
      from.current = target;
      return undefined;
    }

    const start = performance.now();
    const origin = from.current;
    let frame;

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // Ease out, so it decelerates into the final figure instead of stopping dead.
      const eased = 1 - (1 - t) ** 3;
      setShown(origin + (target - origin) * eased);
      if (t < 1) frame = requestAnimationFrame(step);
      else from.current = target;
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return shown;
}
