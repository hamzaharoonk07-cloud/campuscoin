import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ---------------------------------------------------------------------------
   Motion for the landing page.

   The set piece is the pinned scene: the steps column sticks to the viewport
   while the page scrolls past it, and the screenshot beside it swaps to the
   part of the app each step is describing. Scroll position drives which step
   is lit, so the reader is moving through the product rather than watching it
   play.

   Everything is registered inside gsap.matchMedia(). Under
   prefers-reduced-motion nothing is created at all: no pinning, no drifting
   colour, no counters - the page renders as a normal static document with the
   first step lit and the first screenshot showing.
--------------------------------------------------------------------------- */

export function useLandingMotion(scope) {
  useLayoutEffect(() => {
    if (!scope.current) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      /* ----- Things that run at every size ------------------------------- */
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // The colour behind the page, drifting slowly and never repeating the
        // same way twice.
        gsap.utils.toArray('[data-blob]').forEach((blob, i) => {
          gsap.to(blob, {
            xPercent: gsap.utils.random(-18, 18),
            yPercent: gsap.utils.random(-16, 16),
            scale: gsap.utils.random(0.85, 1.25),
            duration: gsap.utils.random(14, 22),
            delay: i * 0.4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        });

        // The hero, arriving in one staggered sequence.
        gsap.from('[data-hero]', {
          y: 40,
          opacity: 0,
          duration: 0.9,
          stagger: 0.09,
          ease: 'power3.out',
        });

        // The gradient in the headline slides continuously.
        gsap.to('[data-grad]', {
          backgroundPosition: '250% 50%',
          duration: 9,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        // The screenshot rises into place, then tilts back as you scroll off it.
        gsap.from('[data-shot]', {
          y: 90,
          opacity: 0,
          scale: 0.94,
          duration: 1.1,
          delay: 0.3,
          ease: 'power3.out',
        });

        gsap.to('[data-shot] .lp-shot-main', {
          rotateX: 16,
          scale: 0.94,
          ease: 'none',
          scrollTrigger: { trigger: '[data-shot]', start: 'top 15%', end: 'bottom top', scrub: 0.5 },
        });

        gsap.to('[data-float]', {
          y: -50,
          ease: 'none',
          scrollTrigger: { trigger: '[data-shot]', start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        });

        // The spending ticker. Half the track is a duplicate of the other half,
        // so resetting at -50% makes it seamless.
        const marquee = document.querySelector('[data-marquee]');
        if (marquee) {
          gsap.to(marquee, { xPercent: -50, duration: 38, repeat: -1, ease: 'none' });
        }

        // The stats count up when they arrive.
        gsap.utils.toArray('[data-stat]').forEach((el) => {
          const target = Number(el.dataset.stat);
          const counter = { value: 0 };
          gsap.to(counter, {
            value: target,
            duration: 1.5,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
            onUpdate: () => {
              el.textContent = String(Math.round(counter.value));
            },
          });
        });

        // Headings and cards, arriving with some life in them.
        gsap.utils.toArray('[data-reveal]').forEach((el) => {
          gsap.from(el, {
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          });
        });

        gsap.from('[data-card]', {
          y: 60,
          opacity: 0,
          scale: 0.96,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.lp-bento', start: 'top 85%', once: true },
        });

        gsap.from('[data-final]', {
          scale: 0.94,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: '[data-final]', start: 'top 88%', once: true },
        });
      });

      /* ----- The pinned scene, wide screens only ------------------------- */
      // Pinning on a phone would fight the user's own scrolling, so below
      // 900px the section is left as an ordinary stacked block.
      mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
        const steps = gsap.utils.toArray('[data-step]');
        const stages = gsap.utils.toArray('[data-stage]');
        if (!steps.length) return;

        const show = (index) => {
          steps.forEach((step, i) => step.classList.toggle('is-on', i === index));
          stages.forEach((img, i) => img.classList.toggle('is-on', i === index));
        };

        ScrollTrigger.create({
          trigger: '[data-scene]',
          start: 'top top',
          // One viewport of scroll per step, so each one gets equal time.
          end: () => `+=${window.innerHeight * steps.length}`,
          pin: '.lp-scene-sticky',
          pinSpacing: true,
          onUpdate: (self) => {
            const index = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
            show(index);
          },
        });
      });
    }, scope);

    return () => ctx.revert();
  }, [scope]);
}
