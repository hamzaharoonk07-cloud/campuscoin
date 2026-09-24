import { useCountUp } from '../lib/useCountUp.js';
import { money } from '../lib/format.js';

/** An amount of money that counts up into place. See useCountUp for why. */
export default function CountUp({ value, currency, sign = false }) {
  const shown = useCountUp(value);
  return money(shown, currency, { sign });
}

/** The same for a plain count - students, transactions, words learned. */
export function CountNumber({ value }) {
  const shown = useCountUp(value);
  return Math.round(shown).toLocaleString('en-US');
}
