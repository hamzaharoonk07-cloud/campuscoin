/* ---------------------------------------------------------------------------
   Brand logos for transactions that name a company ("Netflix share",
   "Foodpanda dinner"), so the list shows the logo a student recognises
   instead of a generic category icon.

   The logos are from Simple Icons (CC0, bundled with the app, nothing is
   fetched). Careem and inDrive are not in that set, so they get a tile in
   their brand colour with their initial instead of an imitation logo.
   The logos only identify the merchant; Campus Coin is not affiliated.
--------------------------------------------------------------------------- */

import {
  siAirbnb,
  siApple,
  siBurgerking,
  siCoursera,
  siDuolingo,
  siEpicgames,
  siFiverr,
  siFoodpanda,
  siGithub,
  siGoogle,
  siGoogledrive,
  siIcloud,
  siInstagram,
  siKfc,
  siMcdonalds,
  siNetflix,
  siNotion,
  siPaypal,
  siPlaystation,
  siPubg,
  siSpotify,
  siStarbucks,
  siSteam,
  siTiktok,
  siUber,
  siUdemy,
  siUpwork,
  siYoutube,
  siZoom,
} from 'simple-icons';

// Checked in order, so the more specific names come first.
const BRANDS = [
  { match: /netflix/i, icon: siNetflix },
  { match: /spotify/i, icon: siSpotify },
  { match: /youtube/i, icon: siYoutube },
  { match: /food ?panda/i, icon: siFoodpanda },
  { match: /\buber\b/i, icon: siUber },
  { match: /careem/i, name: 'Careem', hex: '37B44A', letter: 'C' },
  { match: /in ?drive/i, name: 'inDrive', hex: 'C1F11D', letter: 'i', dark: true },
  { match: /\bkfc\b/i, icon: siKfc },
  { match: /mcdonald|mcd\b/i, icon: siMcdonalds },
  { match: /burger ?king/i, icon: siBurgerking },
  { match: /starbucks/i, icon: siStarbucks },
  { match: /google drive|google one|cloud storage/i, icon: siGoogledrive },
  { match: /icloud/i, icon: siIcloud },
  { match: /\bapple\b|app store/i, icon: siApple },
  { match: /\bgoogle\b|play store/i, icon: siGoogle },
  { match: /steam/i, icon: siSteam },
  { match: /playstation|\bpsn\b/i, icon: siPlaystation },
  { match: /pubg|game top ?up|uc top ?up/i, icon: siPubg },
  { match: /epic games|fortnite/i, icon: siEpicgames },
  { match: /coursera/i, icon: siCoursera },
  { match: /udemy/i, icon: siUdemy },
  { match: /duolingo/i, icon: siDuolingo },
  { match: /notion/i, icon: siNotion },
  { match: /github/i, icon: siGithub },
  { match: /\bzoom\b/i, icon: siZoom },
  { match: /tiktok/i, icon: siTiktok },
  { match: /instagram/i, icon: siInstagram },
  { match: /airbnb/i, icon: siAirbnb },
  { match: /paypal/i, icon: siPaypal },
  { match: /upwork/i, icon: siUpwork },
  { match: /fiverr/i, icon: siFiverr },
];

/**
 * The brand a description names, as { name, hex, path } (a Simple Icons
 * logo) or { name, hex, letter } (a coloured initial), or null.
 */
export function brandFor(text) {
  if (!text) return null;
  const found = BRANDS.find((b) => b.match.test(text));
  if (!found) return null;
  if (found.icon) return { name: found.icon.title, hex: found.icon.hex, path: found.icon.path };
  return found;
}

/** Whether white or black reads better on a brand colour. */
export function inkOn(hex) {
  const n = parseInt(hex, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? '#121214' : '#ffffff';
}
