/* ---------------------------------------------------------------------------
   Illustrations: small 3D scenes.

   Each scene is a handful of 3D objects from Microsoft's Fluent Emoji set
   (MIT licence, stored in client/public/art with its licence file) arranged
   at different sizes, angles and depths over a soft glow, each with its own
   floor shadow and its own slow float. Nearer objects are larger and move
   more, which is what makes a flat page read as having depth.

   Positions are percentages of the scene, so every scene scales to whatever
   space it is given. All of it is decoration: the scene carries one label
   for screen readers and the objects themselves are hidden from them.
--------------------------------------------------------------------------- */

import { categoryArt } from '../lib/art.js';
import { slotColor } from '../lib/format.js';
import CoinBot from './CoinBot.jsx';

const art = (name) => `/art/${name}.png`;

/**
 * One object in a scene.
 *   x, y  - centre, as a percentage of the scene
 *   s     - width, as a percentage of the scene
 *   r     - resting tilt in degrees
 *   z     - depth: 1 is nearest; nearer objects float further
 *   d     - animation delay in seconds, so objects never move in step
 */
function Piece({ name, x, y, s, r = 0, z = 2, d = 0, shadow = true, children }) {
  return (
    <span
      className={`scene-piece depth-${z}`}
      style={{ left: `${x}%`, top: `${y}%`, width: `${s}%`, '--r': `${r}deg`, animationDelay: `${d}s` }}
    >
      {shadow ? <i className="scene-shadow" /> : null}
      {children || <img src={art(name)} alt="" draggable="false" loading="lazy" />}
    </span>
  );
}

function Scene({ label, tone = 'mint', className = '', children }) {
  return (
    <div className={`scene tone-${tone} ${className}`} role="img" aria-label={label}>
      <span className="scene-glow" aria-hidden="true" />
      <span className="scene-ring" aria-hidden="true" />
      <span className="scene-floor" aria-hidden="true" />
      {children}
    </div>
  );
}

export function WalletArt({ label = 'A purse with a card, coins and a banknote' }) {
  return (
    <Scene label={label} tone="gold">
      <Piece name="credit_card" x={64} y={40} s={34} r={14} z={3} d={-1.2} />
      <Piece name="purse" x={46} y={56} s={46} r={-6} z={1} />
      <Piece name="coin" x={20} y={36} s={18} r={-18} z={2} d={-2.4} />
      <Piece name="coin" x={80} y={70} s={14} r={20} z={2} d={-0.8} />
      <Piece name="dollar_banknote" x={78} y={22} s={22} r={-12} z={3} d={-3} shadow={false} />
      <Piece name="sparkles" x={16} y={70} s={13} z={3} d={-1.6} shadow={false} />
    </Scene>
  );
}

export function GaugeArt({ label = 'A target with a chart and a coin' }) {
  return (
    <Scene label={label} tone="mint">
      <Piece name="bar_chart" x={70} y={44} s={32} r={10} z={3} d={-1.4} />
      <Piece name="bullseye" x={42} y={54} s={46} r={-4} z={1} />
      <Piece name="coin" x={78} y={74} s={16} r={-14} z={2} d={-2.2} />
      <Piece name="check_mark_button" x={20} y={28} s={16} r={-10} z={2} d={-0.6} />
      <Piece name="sparkles" x={84} y={18} s={12} z={3} d={-2.8} shadow={false} />
    </Scene>
  );
}

export function ReceiptArt({ label = 'A phone scanning a receipt' }) {
  return (
    <Scene label={label} tone="mint">
      <Piece name="mobile_phone" x={60} y={50} s={40} r={10} z={2} d={-1} />
      <Piece name="receipt" x={34} y={56} s={38} r={-12} z={1} />
      <Piece name="magnifying_glass_tilted_left" x={78} y={74} s={22} r={8} z={1} d={-2.4} />
      <Piece name="check_mark_button" x={80} y={20} s={17} r={12} z={2} d={-3.2} shadow={false} />
      <Piece name="sparkles" x={16} y={24} s={13} z={3} d={-1.8} shadow={false} />
    </Scene>
  );
}

export function ChartArt({ label = 'A rising chart with a rocket' }) {
  return (
    <Scene label={label} tone="sky">
      <Piece name="bar_chart" x={30} y={52} s={32} r={-10} z={3} d={-1.6} />
      <Piece name="chart_increasing" x={56} y={54} s={46} r={4} z={1} />
      <Piece name="rocket" x={82} y={24} s={20} r={10} z={2} d={-2.6} shadow={false} />
      <Piece name="coin" x={20} y={80} s={14} r={-20} z={2} d={-0.4} />
      <Piece name="sparkles" x={18} y={22} s={12} z={3} d={-3} shadow={false} />
    </Scene>
  );
}

export function SproutArt({ label = 'A money bag with a seedling and coins' }) {
  return (
    <Scene label={label} tone="gold">
      <Piece name="money_bag" x={44} y={58} s={44} r={-6} z={1} />
      <Piece name="seedling" x={74} y={40} s={26} r={8} z={2} d={-1.8} />
      <Piece name="coin" x={78} y={76} s={16} r={16} z={2} d={-0.6} />
      <Piece name="coin" x={16} y={70} s={13} r={-22} z={3} d={-2.8} />
      <Piece name="light_bulb" x={20} y={26} s={18} r={-12} z={2} d={-1.2} />
      <Piece name="sparkles" x={82} y={16} s={12} z={3} d={-2.2} shadow={false} />
    </Scene>
  );
}

export function ChatArt({ label = 'Coin, the assistant, with a speech bubble and an idea' }) {
  return (
    <Scene label={label} tone="sky">
      <Piece name="speech_balloon" x={70} y={32} s={34} r={8} z={2} d={-1.4} />
      <Piece name="coinbot" x={42} y={56} s={50} r={-4} z={1}>
        <CoinBot size="100%" talking />
      </Piece>
      <Piece name="light_bulb" x={80} y={70} s={18} r={14} z={2} d={-2.4} />
      <Piece name="sparkles" x={16} y={24} s={13} z={3} d={-0.8} shadow={false} />
    </Scene>
  );
}

export function TagsArt({ label = 'A label surrounded by things students spend on' }) {
  return (
    <Scene label={label} tone="mint">
      <Piece name="label" x={48} y={54} s={40} r={-10} z={1} />
      <Piece name="hot_beverage" x={18} y={34} s={20} r={-8} z={2} d={-1} />
      <Piece name="bus" x={82} y={30} s={22} r={8} z={3} d={-2.2} />
      <Piece name="books" x={18} y={76} s={20} r={6} z={2} d={-3} />
      <Piece name="house" x={82} y={74} s={20} r={-6} z={2} d={-1.6} />
    </Scene>
  );
}

export function MegaphoneArt({ label = 'A megaphone with a bell and confetti' }) {
  return (
    <Scene label={label} tone="gold">
      <Piece name="megaphone" x={46} y={56} s={44} r={-10} z={1} />
      <Piece name="bell" x={78} y={30} s={22} r={14} z={2} d={-1.8} />
      <Piece name="party_popper" x={20} y={28} s={20} r={-12} z={3} d={-0.8} shadow={false} />
      <Piece name="sparkles" x={82} y={74} s={13} z={3} d={-2.6} shadow={false} />
    </Scene>
  );
}

/** A single 3D object as an icon, for tiles and cards. */
export function ArtIcon({ name, size = 44, className = '' }) {
  return <img className={`art-icon ${className}`} src={art(name)} alt="" width={size} height={size} draggable="false" />;
}

/**
 * A category as a picture: its 3D object on a tile tinted with the category's
 * own colour, so colour and shape both say which category it is.
 */
export function CategoryIcon({ icon, slot, size = 38 }) {
  const colour = slotColor(slot);
  return (
    <span
      className="cat-art"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        background: `color-mix(in srgb, ${colour} 15%, var(--surface))`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${colour} 30%, transparent)`,
      }}
    >
      <ArtIcon name={categoryArt(icon)} size={Math.round(size * 0.68)} />
    </span>
  );
}
