/* ---------------------------------------------------------------------------
   Illustrations and icons drawn from real SVG artwork.

   The objects are Microsoft's Fluent Emoji in the flat style (MIT licence),
   copied into client/src/assets/emoji by client/scripts/extract-emoji.cjs so
   only the ones used are shipped and nothing is fetched from outside.

   - CategoryIcon: a category's object (a burger for Food, a bus for
     Transport...) on a soft tint of the category colour, or a merchant's own
     logo when the transaction names one (lib/brands.js).
   - ArtIcon: one object on a round tile, for feature cards and chips.
   - The *Art scenes: a few objects arranged at different sizes, angles and
     depths over a soft glow, each floating slowly, for empty states and
     feature panels. All of it is decoration, labelled once for screen readers.
--------------------------------------------------------------------------- */

import { slotColor } from '../lib/format.js';
import { brandFor, inkOn } from '../lib/brands.js';

// Every extracted SVG, by file name, as a URL Vite serves (and caches).
const FILES = import.meta.glob('../assets/emoji/*.svg', { eager: true, query: '?url', import: 'default' });
const EMOJI = Object.fromEntries(Object.entries(FILES).map(([file, url]) => [file.split('/').pop().replace('.svg', ''), url]));
const emoji = (name) => EMOJI[name] || EMOJI.coin;

/** The URL of one object's SVG, by file name (hot-beverage, bus...). */
export const artUrl = emoji;

// The line-icon name a category is saved with, to the object that shows it.
const CATEGORY_ART = {
  utensils: 'hamburger',
  bus: 'bus',
  home: 'house',
  book: 'books',
  repeat: 'mobile-phone',
  film: 'clapper-board',
  wallet: 'dollar-banknote',
  briefcase: 'briefcase',
  award: 'graduation-cap',
  gift: 'wrapped-gift',
  'plus-circle': 'money-bag',
  tag: 'shopping-bags',
};

/**
 * One object in a scene.
 *   x, y  - centre, as a percentage of the scene
 *   s     - width, as a percentage of the scene
 *   r     - resting tilt in degrees
 *   z     - depth: 1 is nearest; nearer objects float further
 *   d     - animation delay in seconds, so objects never move in step
 */
function Piece({ name, x, y, s, r = 0, z = 2, d = 0, shadow = true }) {
  return (
    <span
      className={`scene-piece depth-${z}`}
      style={{ left: `${x}%`, top: `${y}%`, width: `${s}%`, '--r': `${r}deg`, animationDelay: `${d}s` }}
    >
      {shadow ? <i className="scene-shadow" /> : null}
      <img src={emoji(name)} alt="" draggable="false" loading="lazy" />
    </span>
  );
}

function Scene({ label, children }) {
  return (
    <div className="scene" role="img" aria-label={label}>
      <span className="scene-glow" aria-hidden="true" />
      <span className="scene-ring" aria-hidden="true" />
      <span className="scene-floor" aria-hidden="true" />
      {children}
    </div>
  );
}

export function WalletArt({ label = 'A purse with a card, coins and a banknote' }) {
  return (
    <Scene label={label}>
      <Piece name="credit-card" x={66} y={38} s={32} r={14} z={3} d={-1.2} />
      <Piece name="purse" x={46} y={58} s={44} r={-6} z={1} />
      <Piece name="coin" x={20} y={38} s={17} r={-18} z={2} d={-2.4} />
      <Piece name="coin" x={80} y={72} s={13} r={20} z={2} d={-0.8} />
      <Piece name="dollar-banknote" x={80} y={20} s={20} r={-12} z={3} d={-3} shadow={false} />
      <Piece name="sparkles" x={16} y={72} s={12} z={3} d={-1.6} shadow={false} />
    </Scene>
  );
}

export function GaugeArt({ label = 'A target with a chart and a coin' }) {
  return (
    <Scene label={label}>
      <Piece name="bar-chart" x={70} y={44} s={30} r={10} z={3} d={-1.4} />
      <Piece name="bullseye" x={42} y={56} s={44} r={-4} z={1} />
      <Piece name="coin" x={78} y={76} s={15} r={-14} z={2} d={-2.2} />
      <Piece name="check-mark-button" x={20} y={28} s={15} r={-10} z={2} d={-0.6} />
      <Piece name="sparkles" x={84} y={18} s={11} z={3} d={-2.8} shadow={false} />
    </Scene>
  );
}

export function ReceiptArt({ label = 'A phone scanning a receipt' }) {
  return (
    <Scene label={label}>
      <Piece name="mobile-phone" x={62} y={50} s={38} r={10} z={2} d={-1} />
      <Piece name="receipt" x={34} y={56} s={36} r={-12} z={1} />
      <Piece name="magnifying-glass-tilted-left" x={80} y={76} s={20} r={8} z={1} d={-2.4} />
      <Piece name="check-mark-button" x={82} y={20} s={15} r={12} z={2} d={-3.2} shadow={false} />
      <Piece name="sparkles" x={16} y={24} s={12} z={3} d={-1.8} shadow={false} />
    </Scene>
  );
}

export function ChartArt({ label = 'A rising chart with a rocket' }) {
  return (
    <Scene label={label}>
      <Piece name="bar-chart" x={30} y={54} s={30} r={-10} z={3} d={-1.6} />
      <Piece name="chart-increasing" x={56} y={54} s={44} r={4} z={1} />
      <Piece name="rocket" x={82} y={24} s={19} r={10} z={2} d={-2.6} shadow={false} />
      <Piece name="coin" x={20} y={80} s={13} r={-20} z={2} d={-0.4} />
      <Piece name="sparkles" x={18} y={22} s={11} z={3} d={-3} shadow={false} />
    </Scene>
  );
}

export function SproutArt({ label = 'A money bag with a seedling and coins' }) {
  return (
    <Scene label={label}>
      <Piece name="money-bag" x={44} y={58} s={42} r={-6} z={1} />
      <Piece name="seedling" x={74} y={40} s={24} r={8} z={2} d={-1.8} />
      <Piece name="coin" x={78} y={76} s={15} r={16} z={2} d={-0.6} />
      <Piece name="coin" x={16} y={72} s={12} r={-22} z={3} d={-2.8} />
      <Piece name="light-bulb" x={20} y={28} s={17} r={-12} z={2} d={-1.2} />
      <Piece name="sparkles" x={82} y={16} s={11} z={3} d={-2.2} shadow={false} />
    </Scene>
  );
}

export function ChatArt({ label = 'A conversation with the assistant' }) {
  return (
    <Scene label={label}>
      <Piece name="speech-balloon" x={62} y={40} s={38} r={8} z={1} d={-1.4} />
      <Piece name="robot" x={34} y={58} s={34} r={-6} z={2} />
      <Piece name="light-bulb" x={82} y={74} s={17} r={14} z={2} d={-2.4} />
      <Piece name="sparkles" x={16} y={24} s={12} z={3} d={-0.8} shadow={false} />
    </Scene>
  );
}

export function TagsArt({ label = 'A label surrounded by things students spend on' }) {
  return (
    <Scene label={label}>
      <Piece name="label" x={48} y={54} s={38} r={-10} z={1} />
      <Piece name="hot-beverage" x={18} y={34} s={19} r={-8} z={2} d={-1} />
      <Piece name="bus" x={82} y={30} s={21} r={8} z={3} d={-2.2} />
      <Piece name="books" x={18} y={76} s={19} r={6} z={2} d={-3} />
      <Piece name="house" x={82} y={74} s={19} r={-6} z={2} d={-1.6} />
    </Scene>
  );
}

export function MegaphoneArt({ label = 'A megaphone with a bell and confetti' }) {
  return (
    <Scene label={label}>
      <Piece name="megaphone" x={46} y={56} s={42} r={-10} z={1} />
      <Piece name="bell" x={78} y={30} s={21} r={14} z={2} d={-1.8} />
      <Piece name="party-popper" x={20} y={28} s={19} r={-12} z={3} d={-0.8} shadow={false} />
      <Piece name="sparkles" x={82} y={74} s={12} z={3} d={-2.6} shadow={false} />
    </Scene>
  );
}

/** One object on a round tile, for feature cards and chips. Takes the old
    underscore names (light_bulb) as well as the file names (light-bulb). */
export function ArtIcon({ name, size = 44, className = '' }) {
  const file = String(name).replace(/_/g, '-');
  return (
    <span className={`art-icon ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <img src={emoji(file)} alt="" width={Math.round(size * 0.62)} height={Math.round(size * 0.62)} draggable="false" />
    </span>
  );
}

/**
 * A category as an icon: its object on a soft tint of the category colour, so
 * both the picture and the colour say which category it is. When `text` (a
 * transaction's description) names a brand, that brand's own logo is shown
 * on its brand colour instead.
 */
export function CategoryIcon({ icon, slot, size = 38, text }) {
  const brand = brandFor(text);
  if (brand) {
    const ink = brand.dark ? '#121214' : inkOn(brand.hex);
    return (
      <span
        className="cat-art is-brand"
        title={brand.name}
        aria-hidden="true"
        style={{ width: size, height: size, background: `#${brand.hex}`, color: ink }}
      >
        {brand.path ? (
          <svg width={Math.round(size * 0.5)} height={Math.round(size * 0.5)} viewBox="0 0 24 24" fill="currentColor">
            <path d={brand.path} />
          </svg>
        ) : (
          <strong style={{ fontSize: Math.round(size * (brand.letter.length > 1 ? 0.34 : 0.46)) }}>{brand.letter}</strong>
        )}
      </span>
    );
  }
  const colour = slotColor(slot);
  return (
    <span
      className="cat-art is-object"
      aria-hidden="true"
      style={{ width: size, height: size, background: `color-mix(in srgb, ${colour} 16%, var(--surface))` }}
    >
      <img src={emoji(CATEGORY_ART[icon] || 'shopping-bags')} alt="" width={Math.round(size * 0.6)} height={Math.round(size * 0.6)} draggable="false" />
    </span>
  );
}

/** The object for a category, for places that want just the picture. */
export const categoryArt = (icon) => emoji(CATEGORY_ART[icon] || 'shopping-bags');
