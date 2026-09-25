/* ---------------------------------------------------------------------------
   Copies the few Fluent Emoji (Flat) icons Campus Coin uses out of the
   @iconify-json/fluent-emoji-flat package into client/src/assets/emoji as
   plain .svg files, so the app ships only what it shows and needs no icon
   package at runtime.

   Fluent Emoji is by Microsoft, MIT licence (copied beside the icons).
   Run from client/:  node scripts/extract-emoji.cjs
--------------------------------------------------------------------------- */

const fs = require('fs');
const path = require('path');
const data = require('@iconify-json/fluent-emoji-flat/icons.json');

const NAMES = [
  // Categories
  'hamburger', 'bus', 'house', 'books', 'mobile-phone', 'clapper-board', 'dollar-banknote', 'briefcase',
  'graduation-cap', 'wrapped-gift', 'money-bag', 'shopping-bags',
  // Illustrations and feature tiles
  'label', 'purse', 'credit-card', 'coin', 'sparkles', 'bullseye', 'bar-chart', 'check-mark-button', 'receipt',
  'magnifying-glass-tilted-left', 'chart-increasing', 'chart-decreasing', 'rocket', 'seedling', 'light-bulb',
  'speech-balloon', 'hot-beverage', 'megaphone', 'bell', 'party-popper', 'money-with-wings', 'busts-in-silhouette',
  'calendar', 'spiral-calendar', 'card-index-dividers', 'gear', 'world-map', 'shield', 'camera-with-flash', 'locked',
  'key', 'bank', 'robot', 'shopping-cart', 'page-facing-up', 'envelope', 'star',
];

const out = path.join(__dirname, '..', 'src', 'assets', 'emoji');
fs.mkdirSync(out, { recursive: true });

for (const name of NAMES) {
  const icon = data.icons[name] || data.icons[data.aliases?.[name]?.parent];
  if (!icon) throw new Error(`No icon called ${name}`);
  const w = icon.width || data.width || 32;
  const h = icon.height || data.height || 32;
  fs.writeFileSync(path.join(out, `${name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${icon.body}</svg>\n`);
}

// The licence text lives beside the icons in LICENSE.txt (written by hand,
// because the package does not ship one).
console.log(`Wrote ${NAMES.length} icons to ${out}`);
