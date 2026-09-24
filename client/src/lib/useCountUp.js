import { useEffect, useRef, useState } from 'react';

/**
 * Counts a figure up to its value, starting from zero when it first appears
 * and from the previous figure when it changes (switching month, say).
 *
 * The point is reading, not decoration: a headline number that settles into
 * place is one the eye stops on. It runs only when the value changes, never on
 * an ordinary re-render, and jumps straight to the answer when the viewer has
 * asked their system for reduced motion.
 */
export function useCountUp(value, { duration = 900 } = {}) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(0);
  const from = useRef(0);

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
      const current = origin + (target - origin) * eased;
      // Remembered every frame, so an interrupted count resumes from the figure
      // on screen rather than jumping.
      from.current = current;
      setShown(current);
      if (t < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return shown;
}
