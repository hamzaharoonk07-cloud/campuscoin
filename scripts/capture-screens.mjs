/* ---------------------------------------------------------------------------
   Captures the app's main screens as PNGs to drag into Figma as frames.

     node scripts/capture-screens.mjs [outDir]      (server running on :5000)
     BASE=https://campuscoin-sable.vercel.app node scripts/capture-screens.mjs

   Desktop frames are 1440 wide and phone frames 390 wide. Pages taller than the
   screen are captured in full, capped at 4000px because Figma scales any image
   larger than 4096px on a side down. It signs in with the public demo student
   from the README, hides the chat bubble so frames are clean, and forces the
   scroll-reveal states so nothing is captured half-faded.
--------------------------------------------------------------------------- */

import fs from 'fs';
import path from 'path';
import url from 'url';
import { spawn } from 'child_process';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const OUT = process.argv[2] || path.join(root, 'docs', 'figma', 'screens');
const BASE = process.env.BASE || 'http://localhost:5000';
const PORT = 9755;
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
].find((p) => fs.existsSync(p));
if (!CHROME) throw new Error('Could not find Chrome.');

const DEVICES = {
  desktop: { width: 1440, height: 900, mobile: false },
  phone: { width: 390, height: 844, mobile: true },
};

// name, path, needs sign-in, theme, and either a full-page capture or one section
// scrolled into view (the landing page is far too tall to take whole).
const SHOTS = [
  ['landing-hero', '/', false, 'light', 'view'],
  ['landing-features', '/', false, 'light', '.lp-bento'],
  ['landing-why', '/', false, 'light', '.lp-navy'],
  ['landing-faq', '/', false, 'light', '#faq'],
  ['landing-cta', '/', false, 'light', '.lp-cta'],
  ['landing-hero-dark', '/', false, 'dark', 'view'],
  ['sign-in', '/login', false, 'light', 'view'],
  ['sign-up', '/register', false, 'light', 'full'],
  ['forgot-password', '/forgot-password', false, 'light', 'view'],
  ['dashboard', '/dashboard', true, 'light', 'full'],
  ['dashboard-dark', '/dashboard', true, 'dark', 'full'],
  ['transactions', '/transactions', true, 'light', 'full'],
  ['calendar', '/calendar', true, 'light', 'full'],
  ['budgets', '/budgets', true, 'light', 'full'],
  ['reports', '/reports', true, 'light', 'full'],
  ['insights', '/insights', true, 'light', 'full'],
  ['tips', '/tips', true, 'light', 'full'],
  ['categories', '/categories', true, 'light', 'full'],
  ['settings', '/settings', true, 'light', 'full'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The demo student's token, from the public sign-in.
const login = await fetch(BASE + '/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'student@campuscoin.app', password: 'Student@12345' }),
});
const token = (await login.json()).token;
if (!token) throw new Error('Could not sign in as the demo student.');

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + path.join(root, 'node_modules', '.cache', 'screens-chrome'),
  'about:blank',
], { stdio: 'ignore' });
process.on('exit', () => chrome.kill());
await sleep(2500);

async function cdp(ws, method, params = {}, id = Math.floor(Math.random() * 1e6)) {
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => {
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) { ws.removeEventListener('message', handler); resolve(msg.result); }
    };
    ws.addEventListener('message', handler);
  });
}
const evaluate = async (ws, expression) => (await cdp(ws, 'Runtime.evaluate', { expression, returnByValue: true })).result.value;

fs.mkdirSync(OUT, { recursive: true });
const written = [];

for (const [device, spec] of Object.entries(DEVICES)) {
  for (const [name, route, authed, theme, mode] of SHOTS) {
    // The landing sections and the dark hero are wide-screen designs first; the
    // phone gets the same set, so every frame exists in both sizes.
    const res = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
    const target = await res.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));
    await cdp(ws, 'Page.enable');
    await cdp(ws, 'Emulation.setDeviceMetricsOverride', { width: spec.width, height: spec.height, deviceScaleFactor: 1, mobile: spec.mobile });
    await cdp(ws, 'Page.addScriptToEvaluateOnNewDocument', {
      source:
        "try{" +
        (authed ? `localStorage.setItem('campuscoin.token','${token}');` : "localStorage.removeItem('campuscoin.token');") +
        `localStorage.setItem('campuscoin.theme','${theme}');sessionStorage.setItem('campuscoin.chatHint','1');}catch(e){}`,
    });
    await cdp(ws, 'Page.navigate', { url: BASE + route });
    await sleep(authed ? 5500 : 4200);
    // Clean frames: no chat bubble, and every reveal-on-scroll element shown.
    await evaluate(ws, "(()=>{const s=document.createElement('style');s.textContent='.chat-fab,.chat-hint,.chat-panel{display:none !important}[data-reveal]{opacity:1 !important;transform:none !important}';document.head.appendChild(s);})()");

    let clip;
    if (mode === 'full') {
      // captureBeyondViewport renders the full scrollable height in one shot, but
      // a position:fixed element (the phone tab bar) still computes against the
      // viewport, not the capture canvas - so it painted once, frozen partway down
      // the page, looking like a broken floating nav rather than a pinned one. A
      // full-page export has no "bottom of the screen" for it to be fixed to, so
      // it is turned into a normal flow element at the true end of the page
      // instead of being hidden outright, which would silently drop real UI.
      await evaluate(ws, "(()=>{const s=document.createElement('style');s.textContent='.tabbar{position:static !important;margin-top:auto}';document.head.appendChild(s);})()");
      const h = await evaluate(ws, "Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, ...[...document.querySelectorAll('.page,main')].map(e=>e.scrollHeight))");
      clip = { x: 0, y: 0, width: spec.width, height: Math.min(Math.max(h, spec.height), 4000), scale: 1 };
    } else {
      if (mode !== 'view') {
        await evaluate(ws, `(()=>{const e=document.querySelector('${mode}'); if(e) e.scrollIntoView({block:'start'});})()`);
        await sleep(1300);
      }
      clip = { x: 0, y: 0, width: spec.width, height: spec.height, scale: 1 };
      if (mode !== 'view') {
        const y = await evaluate(ws, 'Math.round(window.scrollY)');
        clip.y = y;
      }
    }
    const shot = await cdp(ws, 'Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip });
    const file = path.join(OUT, `${name}-${device}.png`);
    fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
    written.push({ file, w: clip.width, h: clip.height });
    console.log(`${(name + '-' + device).padEnd(28)} ${clip.width}x${clip.height}`);
    ws.close();
    await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`);
  }
}

const total = written.reduce((n, f) => n + fs.statSync(f.file).size, 0);
console.log(`\n${written.length} frames, ${(total / 1024 / 1024).toFixed(1)} MB, in ${OUT}`);
chrome.kill();
process.exit(0);
