/* ---------------------------------------------------------------------------
   Where the money moved.

   Cash is notes in hand; every other method is digital. The distinction earns
   its own card on the dashboard because the two behave differently: a wallet
   payment leaves a record the student can check against, and cash does not -
   so cash is almost always the part of a month that cannot be accounted for.

   The order here is the order the form offers, and the colours are each
   provider's own, matching the logos already used on transaction rows
   (lib/brands.js).
--------------------------------------------------------------------------- */

import { brandFor, inkOn } from './brands.js';

export const METHODS = [
  { id: 'cash', name: 'Cash', short: 'Cash', hex: '6B7488', letter: 'Rs', digital: false },
  { id: 'easypaisa', name: 'Easypaisa', short: 'Easypaisa', hex: '3BB54A', letter: 'e', digital: true },
  { id: 'jazzcash', name: 'JazzCash', short: 'JazzCash', hex: 'E4002B', letter: 'JC', digital: true },
  { id: 'sadapay', name: 'SadaPay', short: 'SadaPay', hex: '00D9A6', letter: 'S', dark: true, digital: true },
  { id: 'nayapay', name: 'NayaPay', short: 'NayaPay', hex: '6C2BD9', letter: 'N', digital: true },
  { id: 'bank', name: 'Bank transfer', short: 'Bank', hex: '2F5FD0', letter: 'B', digital: true },
  { id: 'card', name: 'Debit or credit card', short: 'Card', hex: '121214', letter: 'C', digital: true },
  { id: 'other', name: 'Something else', short: 'Other', hex: '8E8E98', letter: '?', digital: true },
];

const BY_ID = Object.fromEntries(METHODS.map((m) => [m.id, m]));

/** One method by id, falling back to cash the way the server's default does. */
export const methodFor = (id) => BY_ID[id] || BY_ID.cash;

/** Whether an id counts as digital. Kept here so the client and the server
 *  agree on the one rule that matters: everything except cash. */
export const isDigital = (id) => methodFor(id).digital;

/**
 * The mark shown for one method: its colour, its lettering and the ink that
 * reads on it. "Other" borrows all three from whatever the student typed, so a
 * wallet Campus Coin has never heard of is still shown as itself - through the
 * same brand table the transaction rows use, and falling back to initials on a
 * colour derived from the name when even that does not know it.
 */
export function markFor(id, label = '') {
  const m = methodFor(id);
  const typed = String(label || '').trim();
  if (id !== 'other' || !typed) {
    return { hex: m.hex, letter: m.letter, ink: m.dark ? '#121214' : '#ffffff', name: m.name };
  }
  const brand = brandFor(typed);
  if (brand) return { hex: brand.hex, letter: brand.letter || initials(typed), ink: inkOn(brand.hex), name: brand.name || typed };
  const hex = hueFor(typed);
  return { hex, letter: initials(typed), ink: inkOn(hex), name: typed };
}

/** Up to two initials for a name the brand table has never seen. */
export function initials(text) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/* A colour for an unknown provider, chosen from the app's own category hues so
   a typed wallet never introduces a colour the design system does not have.
   The same name always lands on the same hue. */
const FALLBACK_HUES = ['5B91FF', '2F5FD0', '3D3D45', '6B7488', '9EBFFF', '121214'];

export function hueFor(text) {
  let hash = 0;
  for (const ch of String(text)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK_HUES[hash % FALLBACK_HUES.length];
}
