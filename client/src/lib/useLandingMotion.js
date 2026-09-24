import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ---------------------------------------------------------------------------
   Motion for the landing page.

   The page is written to be driven from here: headings arrive as masked lines
   rising out of their own edge, images are revealed by their frame rather than
   faded, the feature rail runs sideways while the page runs down, and the
   background colour changes between chapters.

   Under prefers-reduced-motion none of it is created. The loader is removed
   immediately, the custom cursor never appears, and the page renders as an
   ordinary static document - which is why every animated element is styled to
   its finished state by default and animated *from* somewhere, never *to*.
--------------------------------------------------------------------------- */

const CHAPTER_COLOURS = ['#0a0a0a', '#0d1410', '#140f08', '#0a0a0a'];

export function useLandingMotion(scope) {
  useLayoutEffect(() => {
    if (!scope.current) return undefined;

    const root = scope.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // The loader is the one thing that must be dealt with whatever the
    // preference, or it would sit over the page forever.
    const loader = root.querySelector('[data-loader]');
    if (reduced && loader) loader.remove();

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        /* --- Preloader ------------------------------------------------- */
        const num = root.querySelector('[data-loader-num]');
        const bar = root.querySelector('[data-loader-bar]');
        const counter = { value: 0 };

        const intro = gsap.timeline();
        intro
          .to(counter, {
            value: 100,
            duration: 1.1,
            ease: 'power2.inOut',
            onUpdate: () => {
              if (num) num.textContent = String(Math.round(counter.value));
            },
          })
          .to(bar, { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 0)
          .to(loader, { yPercent: -100, duration: 0.8, ease: 'power3.inOut' })
          .from('[data-line]', { yPercent: 115, duration: 1, stagger: 0.07, ease: 'power3.out' }, '-=0.45')
          .from('[data-fade]', { y: 24, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power2.out' }, '-=0.6')
          .from('[data-hero-shot]', { opacity: 0, scale: 1.06, duration: 1.1, ease: 'power2.out' }, '-=0.9')
          .add(() => loader && loader.remove());

        /* --- Cursor ----------------------------------------------------- */
        const dot = root.querySelector('[data-cursor]');
        const ring = root.querySelector('[data-cursor-ring]');

        if (dot && ring) {
          const dotX = gsap.quickTo(dot, 'x', { duration: 0.15, ease: 'power3' });
          const dotY = gsap.quickTo(dot, 'y', { duration: 0.15, ease: 'power3' });
          // The ring lags the dot, which is what makes it read as a cursor
          // rather than as two dots.
          const ringX = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
          const ringY = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });

          const move = (e) => {
            dotX(e.clientX - 7);
            dotY(e.clientY - 7);
            ringX(e.clientX - 22);
            ringY(e.clientY - 22);
          };
          window.addEventListener('mousemove', move);

          root.querySelectorAll('a, button').forEach((el) => {
            el.addEventListener('mouseenter', () => gsap.to(ring, { scale: 1.8, opacity: 0.5, duration: 0.3 }));
            el.addEventListener('mouseleave', () => gsap.to(ring, { scale: 1, opacity: 1, duration: 0.3 }));
          });
        }

        /* --- Magnetic buttons ------------------------------------------- */
        root.querySelectorAll('[data-magnet]').forEach((el) => {
          const strength = 0.35;
          el.addEventListener('mousemove', (e) => {
            const r = el.getBoundingClientRect();
            gsap.to(el, {
              x: (e.clientX - (r.left + r.width / 2)) * strength,
              y: (e.clientY - (r.top + r.height / 2)) * strength,
              duration: 0.4,
              ease: 'power3.out',
            });
          });
          el.addEventListener('mouseleave', () => {
            gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
          });
        });

        /* --- Headings below the fold ------------------------------------ */
        gsap.utils.toArray('[data-line]').forEach((line) => {
          if (line.closest('.lp-hero')) return; // handled by the intro
          gsap.from(line, {
            yPercent: 115,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: line, start: 'top 92%', once: true },
          });
        });

        gsap.utils.toArray('[data-fade]').forEach((el) => {
          if (el.closest('.lp-hero')) return;
          gsap.from(el, {
            y: 26,
            opacity: 0,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          });
        });

        /* --- Image reveals and parallax --------------------------------- */
        gsap.utils.toArray('[data-reveal]').forEach((frame) => {
          gsap.from(frame, {
            clipPath: 'inset(0% 0% 100% 0%)',
            duration: 1.1,
            ease: 'power3.inOut',
            scrollTrigger: { trigger: frame, start: 'top 88%', once: true },
          });
        });

        gsap.utils.toArray('[data-parallax]').forEach((img) => {
          gsap.fromTo(
            img,
            { yPercent: -8, scale: 1.12 },
            {
              yPercent: 8,
              ease: 'none',
              scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true },
            }
          );
        });

        gsap.to('[data-hero-shot]', {
          yPercent: 18,
          ease: 'none',
          scrollTrigger: { trigger: '.lp-hero', start: 'top top', end: 'bottom top', scrub: true },
        });

        /* --- Marquee ----------------------------------------------------- */
        const marquee = root.querySelector('[data-marquee]');
        if (marquee) gsap.to(marquee, { xPercent: -50, duration: 30, repeat: -1, ease: 'none' });

        /* --- Counters ---------------------------------------------------- */
        gsap.utils.toArray('[data-count]').forEach((el) => {
          const target = Number(el.dataset.count);
          const value = { n: 0 };
          gsap.to(value, {
            n: target,
            duration: 1.4,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
            onUpdate: () => {
              el.textContent = String(Math.round(value.n));
            },
          });
        });

        /* --- The page changing colour between chapters ------------------- */
        const bg = root.querySelector('[data-bg]');
        gsap.utils.toArray('.lp-chapter').forEach((chapter, i) => {
          ScrollTrigger.create({
            trigger: chapter,
            start: 'top 60%',
            end: 'bottom 40%',
            onToggle: (self) => {
              if (self.isActive && bg) {
                bg.style.background = CHAPTER_COLOURS[(i + 1) % CHAPTER_COLOURS.length];
              } else if (bg) {
                bg.style.background = CHAPTER_COLOURS[0];
              }
            },
          });
        });
      });

      /* --- The sideways rail, wide screens only ------------------------- */
      // Pinning and hijacking horizontal movement on a phone fights the
      // reader, so below 900px the rail is left as an ordinary scroller.
      mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
        const track = root.querySelector('[data-rail-track]');
        const rail = root.querySelector('[data-rail]');
        if (!track || !rail) return;

        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 48);

        gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: rail,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
      });
    }, scope);

    return () => ctx.revert();
  }, [scope]);
}
