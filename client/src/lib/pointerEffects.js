// Two small pointer effects, installed once for the whole app rather than
// wired into every component:
//
//   ripple - a ring spreads from the exact point where a button is pressed,
//            so the press is felt where it happened.
//   tilt   - money tiles and summary cards lean towards the pointer, which
//            makes the surfaces feel like objects rather than paint.
//
// Both use one listener each on the document and find their target with
// closest(), so new buttons and cards are covered without any extra code.
// Neither runs for anyone who has asked for reduced motion, and tilt only
// runs with a mouse (it means nothing on a touch screen).

const RIPPLE_TARGETS = '.btn, .lp-btn, .chip, .chat-send';
const TILT_TARGETS = '.money-tile, .panel.kpi, .lp-cred, .lp-navy-card, .lp-duo-card';
const MAX_TILT = 6; // degrees

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

  if (!window.matchMedia('(pointer: fine)').matches) return;

  let current = null;
  const reset = (el) => {
    if (!el) return;
    el.style.transform = '';
    el.classList.remove('is-tilting');
  };

  document.addEventListener('pointermove', (event) => {
    const el = event.target.closest(TILT_TARGETS);
    if (el !== current) {
      reset(current);
      current = el;
    }
    if (!el) return;
    const box = el.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    el.classList.add('is-tilting');
    el.style.transform = `perspective(900px) rotateX(${(-y * MAX_TILT).toFixed(2)}deg) rotateY(${(x * MAX_TILT).toFixed(2)}deg) translateY(-3px)`;
    el.style.setProperty('--glare-x', `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty('--glare-y', `${((y + 0.5) * 100).toFixed(1)}%`);
  });

  document.addEventListener('pointerleave', () => {
    reset(current);
    current = null;
  });
}
