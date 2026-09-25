/* ---------------------------------------------------------------------------
   Illustrations: flat spot drawings in the app's three colours.

   Each one is the same small composition, drawn in SVG: a pale disc, a black
   card tilted behind it with a few lines of "content", a blue coin carrying
   the subject's icon, and a couple of sparkles. Only the icon and the card's
   content change, so every empty state and feature card looks like part of
   one set, and nothing is fetched from outside. All of it is decoration: the
   drawing carries one label for screen readers.
--------------------------------------------------------------------------- */

import { useId } from 'react';
import Icon from './Icon.jsx';
import { slotColor } from '../lib/format.js';

// What goes on the tilted card behind the coin.
const CARDS = {
  lines: (
    <>
      <rect x="18" y="20" width="40" height="6" rx="3" fill="#fff" opacity="0.9" />
      <rect x="18" y="34" width="56" height="5" rx="2.5" fill="#fff" opacity="0.35" />
      <rect x="18" y="45" width="46" height="5" rx="2.5" fill="#fff" opacity="0.35" />
      <rect x="18" y="56" width="30" height="5" rx="2.5" fill="#fff" opacity="0.35" />
    </>
  ),
  bars: (
    <>
      <rect x="20" y="46" width="9" height="20" rx="3" fill="#fff" opacity="0.35" />
      <rect x="35" y="32" width="9" height="34" rx="3" fill="#5b91ff" />
      <rect x="50" y="40" width="9" height="26" rx="3" fill="#fff" opacity="0.35" />
      <rect x="65" y="22" width="9" height="44" rx="3" fill="#fff" opacity="0.9" />
    </>
  ),
  ring: (
    <>
      <circle cx="47" cy="44" r="20" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="7" />
      <path d="M47 24a20 20 0 0 1 19 26" fill="none" stroke="#5b91ff" strokeWidth="7" strokeLinecap="round" />
    </>
  ),
  bubble: (
    <>
      <rect x="16" y="18" width="46" height="18" rx="9" fill="#fff" opacity="0.9" />
      <rect x="34" y="44" width="46" height="18" rx="9" fill="#5b91ff" />
    </>
  ),
};

function Spot({ label, icon, card = 'lines' }) {
  const id = `sp${useId().replace(/:/g, '')}`;
  return (
    <div className="spot" role="img" aria-label={label}>
      <svg viewBox="0 0 200 150" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-coin`} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0" stopColor="#8db3ff" />
            <stop offset="1" stopColor="#3566dc" />
          </linearGradient>
        </defs>
        <circle className="spot-disc" cx="100" cy="78" r="64" />
        <g transform="translate(28 30) rotate(-8 47 44)">
          <rect className="spot-card" width="94" height="84" rx="16" />
          {CARDS[card]}
        </g>
        <g className="spot-float">
          <circle cx="132" cy="92" r="31" fill="#1e3f96" opacity="0.25" transform="translate(3 5)" />
          <circle cx="132" cy="92" r="31" fill={`url(#${id}-coin)`} />
          <circle cx="132" cy="92" r="27" fill="none" stroke="#fff" strokeOpacity="0.35" />
        </g>
        <path className="spot-sparkle" d="M166 30c.8 5 3.6 7.8 8.6 8.6-5 .8-7.8 3.6-8.6 8.6-.8-5-3.6-7.8-8.6-8.6 5-.8 7.8-3.6 8.6-8.6z" />
        <path className="spot-sparkle is-small" d="M30 112c.5 3 2.1 4.6 5.1 5.1-3 .5-4.6 2.1-5.1 5.1-.5-3-2.1-4.6-5.1-5.1 3-.5 4.6-2.1 5.1-5.1z" />
      </svg>
      <span className="spot-icon">
        <Icon name={icon} size={26} strokeWidth={2} />
      </span>
    </div>
  );
}

export const WalletArt = ({ label = 'A wallet on a card' }) => <Spot label={label} icon="wallet" />;
export const GaugeArt = ({ label = 'A budget filling up' }) => <Spot label={label} icon="target" card="ring" />;
export const ReceiptArt = ({ label = 'A receipt being read' }) => <Spot label={label} icon="camera" />;
export const ChartArt = ({ label = 'A rising chart' }) => <Spot label={label} icon="trend" card="bars" />;
export const SproutArt = ({ label = 'An idea for saving' }) => <Spot label={label} icon="bulb" card="bars" />;
export const ChatArt = ({ label = 'Coin, the assistant, in conversation' }) => <Spot label={label} icon="chat" card="bubble" />;
export const TagsArt = ({ label = 'Labels for sorting money' }) => <Spot label={label} icon="tag" />;
export const MegaphoneArt = ({ label = 'An announcement' }) => <Spot label={label} icon="bell" card="bubble" />;

// The older 3D picture names, mapped to the matching line icon.
const ART_ICONS = {
  bar_chart: 'chart',
  bell: 'bell',
  bullseye: 'target',
  busts_in_silhouette: 'user',
  calendar: 'calendar',
  card_index_dividers: 'tag',
  dollar_banknote: 'wallet',
  gear: 'sliders',
  house: 'home',
  label: 'tag',
  light_bulb: 'bulb',
  magnifying_glass_tilted_left: 'search',
  megaphone: 'bell',
  money_bag: 'coin',
  money_with_wings: 'trend',
  receipt: 'receipt',
  seedling: 'trend',
  shield: 'shield',
  sparkles: 'spark',
  speech_balloon: 'chat',
  world_map: 'map',
};

/** A single icon on a round tile, for feature cards and chips. */
export function ArtIcon({ name, size = 44, className = '' }) {
  return (
    <span className={`art-icon ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <Icon name={ART_ICONS[name] || 'coin'} size={Math.round(size * 0.48)} />
    </span>
  );
}

/**
 * A category as an icon: its line icon in white on a round black tile, with a
 * small dot in the category's own colour so the charts' colours still match.
 */
export function CategoryIcon({ icon, slot, size = 38 }) {
  return (
    <span className="cat-art" aria-hidden="true" style={{ width: size, height: size, '--cat': slotColor(slot) }}>
      <Icon name={icon} size={Math.round(size * 0.46)} />
    </span>
  );
}
