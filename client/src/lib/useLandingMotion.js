import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ---------------------------------------------------------------------------
   Scroll behaviour for the landing page.

   The deliberate omission here is the obvious one: no section fades up as it
   comes into view. That pattern is on every marketing page built in the last
   five years, and applying it everywhere would flatten the difference between
   the parts of this page that mean something and the parts that are just text.

   So only four things move, and each one is doing a job:

     1. A progress line, because the page is long enough to want one.
     2. The facts count up when they arrive - a number landing on its value
        reads as a measurement being taken.
     3. The step connector draws left to right, because the three steps are a
        sequence and the line is what says so.
     4. The category bars are tied to scroll position rather than triggered by
        it, so the month's spending fills in under your own scrolling. This is
        the one real flourish on the page and it is on the data, not the chrome.

   Everything is registered inside gsap.matchMedia() under a
   prefers-reduced-motion query, so a viewer who has asked for less motion gets
   the finished state immediately and no ScrollTriggers are created at all.
--------------------------------------------------------------------------- */

export function useLandingMotion(scope) {
  useLayoutEffect(() => {
    if (!scope.current) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // 1. Scroll progress -------------------------------------------------
        gsap.to('[data-progress]', {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: document.documentElement,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.25,
          },
        });

        // 2. The facts ------------------------------------------------------
        gsap.utils.toArray('[data-count]').forEach((el) => {
          const target = Number(el.dataset.count);
          const counter = { value: 0 };

          gsap.to(counter, {
            value: target,
            duration: 1.1,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            onUpdate: () => {
              el.textContent = String(Math.round(counter.value));
            },
          });
        });

        // 3. The line joining the three steps -------------------------------
        gsap.to('[data-steps-line]', {
          scaleX: 1,
          duration: 0.9,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: '[data-steps-line]', start: 'top 85%', once: true },
        });

        gsap.from('.steps-n', {
          scale: 0.4,
          opacity: 0,
          duration: 0.5,
          stagger: 0.12,
          ease: 'back.out(2)',
          scrollTrigger: { trigger: '.steps', start: 'top 82%', once: true },
        });

        // 4. The month filling in as you scroll through it -------------------
        // scrub ties progress to scroll position instead of playing on entry,
        // so the bars are drawn by the reader rather than at them.
        gsap.from('.showcase .spine-fill', {
          scaleX: 0,
          transformOrigin: 'left center',
          stagger: 0.12,
          ease: 'none',
          scrollTrigger: {
            trigger: '.showcase',
            start: 'top 85%',
            end: 'center 60%',
            scrub: 0.4,
          },
        });

        // The figure it sums to arrives with the bars.
        gsap.from('.showcase-figure', {
          opacity: 0,
          y: 12,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: '.showcase', start: 'top 80%', once: true },
        });
      });
    }, scope);

    return () => ctx.revert();
  }, [scope]);
}
