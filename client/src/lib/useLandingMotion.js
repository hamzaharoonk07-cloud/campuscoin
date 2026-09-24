import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ---------------------------------------------------------------------------
   Motion for the landing page.

   Tuned to the style rather than bolted onto it. Brutalist motion is abrupt:
   things arrive on a hard offset and stop, or they run at a constant speed.
   There is no gentle deceleration anywhere here, and nothing fades through a
   soft opacity ramp - `steps()` and `none` do most of the work.

   The set piece is the pinned scene: the steps column sticks to the viewport
   while the page scrolls past, and the plate beside it cuts to the part of the
   app each step describes. It cuts rather than dissolves, which is why the
   stage uses display rather than opacity.

   Everything sits inside gsap.matchMedia() under a reduced-motion query, so a
   reader who has asked for less motion gets a plain static document.
--------------------------------------------------------------------------- */

export function useLandingMotion(scope) {
  useLayoutEffect(() => {
    if (!scope.current) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // The hero blocks slam in from the left, one after another.
        gsap.from('[data-hero]', {
          x: -40,
          opacity: 0,
          duration: 0.35,
          stagger: 0.07,
          ease: 'power4.out',
        });

        gsap.from('[data-shot]', {
          y: 60,
          opacity: 0,
          duration: 0.4,
          delay: 0.3,
          ease: 'power4.out',
        });

        // The floating phone drifts against the page as you scroll past it.
        gsap.to('[data-float]', {
          y: -60,
          ease: 'none',
          scrollTrigger: { trigger: '[data-shot]', start: 'top bottom', end: 'bottom top', scrub: true },
        });

        // The ticker. Half the track duplicates the other half, so resetting at
        // -50% makes it seamless. Constant speed, no easing.
        const marquee = document.querySelector('[data-marquee]');
        if (marquee) gsap.to(marquee, { xPercent: -50, duration: 34, repeat: -1, ease: 'none' });

        // Counters that tick rather than glide.
        gsap.utils.toArray('[data-stat]').forEach((el) => {
          const target = Number(el.dataset.stat);
          const counter = { value: 0 };
          gsap.to(counter, {
            value: target,
            duration: 1,
            ease: 'steps(24)',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
            onUpdate: () => {
              el.textContent = String(Math.round(counter.value));
            },
          });
        });

        // Feature blocks land on their offset and stop dead.
        gsap.from('[data-card]', {
          y: 30,
          opacity: 0,
          duration: 0.3,
          stagger: 0.05,
          ease: 'power4.out',
          scrollTrigger: { trigger: '.lp-bento', start: 'top 85%', once: true },
        });

        gsap.from('[data-final]', {
          y: 40,
          opacity: 0,
          duration: 0.35,
          ease: 'power4.out',
          scrollTrigger: { trigger: '[data-final]', start: 'top 88%', once: true },
        });
      });

      // Pinning would fight the reader's own scrolling on a phone, so below
      // 900px the section is left as an ordinary stacked block.
      mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
        const steps = gsap.utils.toArray('[data-step]');
        const stages = gsap.utils.toArray('[data-stage]');
        if (!steps.length) return;

        ScrollTrigger.create({
          trigger: '[data-scene]',
          start: 'top top',
          // One viewport of scroll per step, so each gets equal time.
          end: () => `+=${window.innerHeight * steps.length}`,
          pin: '.lp-scene-sticky',
          pinSpacing: true,
          onUpdate: (self) => {
            const index = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
            steps.forEach((step, i) => step.classList.toggle('is-on', i === index));
            stages.forEach((img, i) => img.classList.toggle('is-on', i === index));
          },
        });
      });
    }, scope);

    return () => ctx.revert();
  }, [scope]);
}
