/* ---------------------------------------------------------------------------
   Exports client/src/styles/tokens.css as design tokens for Figma.

     node scripts/export-tokens.mjs [out.json]

   The output is the format the Tokens Studio for Figma plugin imports: three
   sets - global (fonts, sizes, radii, motion: the same in both themes), light
   (colours and shadows) and dark (only what dark changes) - plus two themes, so
   switching to Dark in the plugin restyles a file the way the app's theme toggle
   does. tokens.css stays the single source of truth; this reads it and never
   writes to it, so the design file and the app cannot drift apart silently.
--------------------------------------------------------------------------- */

import fs from 'fs';
import path from 'path';
import url from 'url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const source = path.join(root, 'client', 'src', 'styles', 'tokens.css');
const out = process.argv[2] || path.join(root, 'docs', 'figma', 'tokens.json');

const css = fs.readFileSync(source, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

// The two blocks: the default (light) theme, then the dark overrides.
function block(selector) {
  const at = css.indexOf(selector);
  if (at < 0) throw new Error('Could not find ' + selector + ' in tokens.css');
  const open = css.indexOf('{', at);
  const close = css.indexOf('}', open);
  return css.slice(open + 1, close);
}

function declarations(text) {
  const found = [];
  for (const chunk of text.split(';')) {
    const piece = chunk.trim();
    if (!piece.startsWith('--')) continue;
    const colon = piece.indexOf(':');
    if (colon < 0) continue;
    found.push([piece.slice(2, colon).trim(), piece.slice(colon + 1).trim()]);
  }
  return found;
}

const light = declarations(block(':root {'));
const dark = declarations(block(":root[data-theme='dark'] {"));

const isColour = (v) => v.startsWith('#') || v.startsWith('rgb') || v.startsWith('hsl');

// Which group a colour belongs to, so the plugin shows a tidy tree rather than
// 90 loose names.
function colourGroup(name) {
  if (['text', 'muted', 'faint', 'accent-text'].includes(name)) return 'text';
  if (['bg', 'surface', 'raised', 'sunken', 'input-bg'].includes(name)) return 'surface';
  if (name.startsWith('line')) return 'line';
  if (name.startsWith('cat-')) return 'category';
  if (name.startsWith('tile-')) return 'tile';
  if (name.startsWith('series-')) return 'chart';
  if (name.startsWith('navy') || name.startsWith('on-navy') || name === 'sky') return 'navy';
  if (name.startsWith('bad') || name.startsWith('warn')) return 'status';
  if (name.startsWith('good')) return 'status';
  if (name.startsWith('accent') || name.startsWith('on-accent') || name.startsWith('blue') || name === 'fill-strong') return 'accent';
  return 'palette';
}

function put(tree, group, key, token) {
  (tree[group] ||= {})[key] = token;
}

// Steps are written as calc(0.75rem * var(--font-scale)); at the default scale
// of 1 that is rem * 16 pixels.
function stepToPx(value) {
  const m = value.match(/calc\(([0-9.]+)rem/);
  return m ? String(Math.round(parseFloat(m[1]) * 16 * 100) / 100) : null;
}

const globalSet = {};
const lightSet = {};
const darkSet = {};
let counts = { colour: 0, shadow: 0, type: 0, radius: 0, other: 0, skipped: [] };

function classify(name, value, set, isGlobal) {
  if (isColour(value)) {
    put(set, colourGroup(name), name, { value, type: 'color' });
    counts.colour++;
    return;
  }
  if (name.startsWith('shadow') || name === 'accent-glow' || name.startsWith('edge')) {
    put(set, 'shadow', name, { value, type: 'boxShadow' });
    counts.shadow++;
    return;
  }
  if (!isGlobal) return;
  if (name.startsWith('font-') && name !== 'font-scale') {
    const family = value.split(',')[0].replace(/['"]/g, '').trim();
    put(set, 'fontFamily', name.replace('font-', ''), { value: family, type: 'fontFamilies' });
    counts.type++;
    return;
  }
  if (name.startsWith('step-')) {
    const px = stepToPx(value);
    if (px) {
      put(set, 'fontSize', name.replace('step-', 'step '), { value: px, type: 'fontSizes' });
      counts.type++;
      return;
    }
  }
  if (name.startsWith('r-') && value.endsWith('px')) {
    put(set, 'radius', name.replace('r-', ''), { value: value.replace('px', ''), type: 'borderRadius' });
    counts.radius++;
    return;
  }
  if (name === 'rail' && value.endsWith('px')) {
    put(set, 'size', name, { value: value.replace('px', ''), type: 'sizing' });
    counts.other++;
    return;
  }
  if (name.startsWith('ease')) {
    put(set, 'motion', name, { value, type: 'other' });
    counts.other++;
    return;
  }
  counts.skipped.push(name);
}

for (const [name, value] of light) classify(name, value, isColourOrShadow(name, value) ? lightSet : globalSet, !isColourOrShadow(name, value));
for (const [name, value] of dark) classify(name, value, darkSet, false);

function isColourOrShadow(name, value) {
  return isColour(value) || name.startsWith('shadow') || name === 'accent-glow' || name.startsWith('edge');
}

const tokens = {
  global: globalSet,
  light: lightSet,
  dark: darkSet,
  $themes: [
    { id: 'light', name: 'Light', selectedTokenSets: { global: 'source', light: 'enabled' } },
    { id: 'dark', name: 'Dark', selectedTokenSets: { global: 'source', light: 'source', dark: 'enabled' } },
  ],
  $metadata: { tokenSetOrder: ['global', 'light', 'dark'] },
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(tokens, null, 2) + '\n');

const size = (set) => Object.values(set).reduce((n, g) => n + Object.keys(g).length, 0);
console.log('Wrote ' + out);
console.log('  global : ' + size(globalSet) + ' tokens (fonts, sizes, radii, motion)');
console.log('  light  : ' + size(lightSet) + ' tokens (colours, shadows)');
console.log('  dark   : ' + size(darkSet) + ' tokens (overrides only)');
console.log('  left out (no Figma equivalent): ' + counts.skipped.join(', '));
