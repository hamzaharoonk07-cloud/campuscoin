// The press ripple, installed once for the whole app rather than wired into
// every component: a ring spreads from the exact point where a button is
// pressed, so the press is felt where it happened. One listener on the
// document finds its target with closest(), so new buttons are covered
// without extra code, and it does nothing under reduced motion.

const RIPPLE_TARGETS = '.btn, .lp-btn, .chip, .chat-send';

export function installPointerEffects() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.addEventListener('pointerdown', (event) => {
    const target = event.target.closest(RIPPLE_TARGETS);
    if (!target || target.disabled) return;
    const box = target.getBoundingClientRect();
    const size = Math.max(box.width, box.height) * 2;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - box.left - size / 2}px`;
    ripple.style.top = `${event.clientY - box.top - size / 2}px`;
    target.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
}
