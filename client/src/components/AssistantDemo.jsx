import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Icon from './Icon.jsx';

gsap.registerPlugin(ScrollTrigger);

/* ---------------------------------------------------------------------------
   A working demonstration of the categorisation assistant, rather than a
   paragraph describing it.

   Every value below is what the real engine actually produces for this phrase:
   "and" is dropped as a stop word, the remaining three words each carry a
   Food association, and the suggestion comes back at 91% confidence. You can
   verify it by signing in and typing the same thing.
--------------------------------------------------------------------------- */

const PHRASE = 'canteen chai and paratha';

// How the tokeniser treats each word, in order.
const TOKENS = [
  { word: 'canteen', kept: true, via: 'a known keyword' },
  { word: 'chai', kept: true, via: 'a known keyword' },
  { word: 'and', kept: false, via: 'stop word' },
  { word: 'paratha', kept: true, via: 'your past entries' },
];

export default function AssistantDemo() {
  const root = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const caret = root.current.querySelector('[data-caret]');
        const typed = root.current.querySelector('[data-typed]');

        // The result is held for most of the cycle and cleared only just before
        // the next pass. An earlier version faded out and then waited, which
        // left the panel blank for about three seconds in every eight - long
        // enough that someone scrolling past would see an empty box.
        const tl = gsap.timeline({
          repeat: -1,
          repeatDelay: 0.25,
          scrollTrigger: { trigger: root.current, start: 'top 85%' },
        });

        // 1. The description is typed a character at a time.
        tl.set([typed, caret], { opacity: 1 })
          .set('[data-token]', { opacity: 0, y: 6 })
          .set('[data-result]', { opacity: 0, y: 10 })
          .set(typed, { text: '' })
          .to(typed, {
            duration: PHRASE.length * 0.055,
            ease: 'none',
            onUpdate() {
              const n = Math.round(this.progress() * PHRASE.length);
              typed.textContent = PHRASE.slice(0, n);
            },
          })
          // 2. Each word is weighed in turn.
          .to('[data-token]', { opacity: 1, y: 0, duration: 0.3, stagger: 0.16 }, '+=0.35')
          // 3. The category comes back, with its reason.
          .to('[data-result]', { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '+=0.25')
          // 4. Hold it long enough to read twice over, then clear quickly.
          .to([typed, caret, '[data-token]', '[data-result]'], {
            opacity: 0,
            duration: 0.3,
            ease: 'power1.in',
          }, '+=4.5');

        // A caret that blinks independently of the typing.
        gsap.to(caret, { opacity: 0, duration: 0.5, repeat: -1, yoyo: true, ease: 'steps(1)' });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div className="assistant-demo panel" ref={root}>
      <div className="assistant-demo-field">
        <label>What was it?</label>
        <div className="assistant-demo-input">
          <span data-typed>{PHRASE}</span>
          <i data-caret aria-hidden="true" />
        </div>
      </div>

      <div className="assistant-demo-tokens" aria-hidden="true">
        {TOKENS.map((token) => (
          <span
            key={token.word}
            data-token
            className={`assistant-token${token.kept ? '' : ' is-dropped'}`}
          >
            {token.word}
            <em>{token.via}</em>
          </span>
        ))}
      </div>

      <div className="assistant-demo-result" data-result>
        <span className="ledger-dot" style={{ background: 'var(--cat-1)' }}>
          <Icon name="utensils" size={15} />
        </span>
        <div>
          <strong>Food</strong>
          <span>91% sure, from your past entries and a known keyword</span>
        </div>
        <span className="pill">overrule it</span>
      </div>

      {/* The animation is decorative; this is what a screen reader is told. */}
      <p className="sr-only">
        Typing &ldquo;canteen chai and paratha&rdquo; suggests the category Food, 91% confident, based on
        past entries and a known keyword. The suggestion can always be overruled.
      </p>
    </div>
  );
}
