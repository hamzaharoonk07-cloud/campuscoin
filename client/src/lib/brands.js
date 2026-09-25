/* ---------------------------------------------------------------------------
   Brand logos for transactions that name a company ("Netflix share",
   "Foodpanda dinner"), so the list shows the logo a student recognises
   instead of a generic category icon.

   The logos are from Simple Icons (CC0, bundled with the app, nothing is
   fetched). Brands that set does not carry - Careem, inDrive, Daraz, the
   Pakistani wallets and food chains, and a few that asked Simple Icons to
   remove theirs - get a tile in their brand colour with their initials
   instead of an imitation logo.
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
  siTelenor,
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
  { match: /in ?drive/i, name: 'inDrive', hex: 'C1F11D', letter: 'iD', dark: true },
  { match: /bykea/i, name: 'Bykea', hex: '1BB55C', letter: 'B' },
  { match: /daraz/i, name: 'Daraz', hex: 'F85606', letter: 'D' },
  { match: /amazon/i, name: 'Amazon', hex: '232F3E', letter: 'a' },
  { match: /jazz ?cash/i, name: 'JazzCash', hex: 'E4002B', letter: 'JC' },
  { match: /easy ?paisa/i, name: 'Easypaisa', hex: '3BB54A', letter: 'e' },
  { match: /sada ?pay/i, name: 'SadaPay', hex: '00D9A6', letter: 'S', dark: true },
  { match: /naya ?pay/i, name: 'NayaPay', hex: '6C2BD9', letter: 'N' },
  { match: /cheezious/i, name: 'Cheezious', hex: 'FFC20E', letter: 'C', dark: true },
  { match: /savour/i, name: 'Savour Foods', hex: 'D71920', letter: 'S' },
  { match: /pizza ?hut/i, name: 'Pizza Hut', hex: 'EE3124', letter: 'PH' },
  { match: /domino/i, name: "Domino's", hex: '006491', letter: 'D' },
  { match: /subway/i, name: 'Subway', hex: '008C15', letter: 'S' },
  { match: /hardee/i, name: "Hardee's", hex: 'E31837', letter: 'H' },
  { match: /gloria jean/i, name: "Gloria Jean's", hex: '5A2D0C', letter: 'GJ' },
  { match: /imtiaz/i, name: 'Imtiaz', hex: 'E30613', letter: 'I' },
  { match: /\bptcl\b/i, name: 'PTCL', hex: '0F75BC', letter: 'P' },
  { match: /\bzong\b/i, name: 'Zong', hex: '8DC63F', letter: 'Z', dark: true },
  { match: /\bufone\b/i, name: 'Ufone', hex: 'F58220', letter: 'U' },
  { match: /\bjazz\b/i, name: 'Jazz', hex: 'ED1C24', letter: 'J' },
  { match: /telenor/i, icon: siTelenor },
  { match: /k-?electric/i, name: 'K-Electric', hex: 'E2231A', letter: 'KE' },
  { match: /chat ?gpt|openai/i, name: 'ChatGPT', hex: '10A37F', letter: 'AI' },
  { match: /canva/i, name: 'Canva', hex: '00C4CC', letter: 'C' },
  { match: /microsoft|office 365|\bxbox\b/i, name: 'Microsoft', hex: '5E5E5E', letter: 'M' },
  { match: /adobe/i, name: 'Adobe', hex: 'DA1F26', letter: 'A' },
  { match: /\bkfc\b/i, icon: siKfc },
  { match: /mcdonald|mcd\b/i, icon: siMcdonalds },
  { match: /burger ?king/i, icon: siBurgerking },
  { match: /starbucks/i, icon: siStarbucks },
  { match: /google drive|google one/i, icon: siGoogledrive },
  { match: /icloud/i, icon: siIcloud },
  { match: /\bapple\b|app store/i, icon: siApple },
  { match: /\bgoogle\b|play store/i, icon: siGoogle },
  { match: /steam/i, icon: siSteam },
  { match: /playstation|\bpsn\b/i, icon: siPlaystation },
  { match: /pubg/i, icon: siPubg },
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
