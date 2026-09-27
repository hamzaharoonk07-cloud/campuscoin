/* ---------------------------------------------------------------------------
   Renders docs/report/report.html to a PDF with headless Chrome.

     node scripts/build-report.mjs [out.pdf]

   Chrome is driven over CDP rather than through a headless-browser package so
   the repository gains no dependency for something that runs by hand a few
   times. The page is loaded from a file:// URL, which is why the screenshots
   it shows are referenced relatively.

   A4 with the margins the stylesheet's @page rule expects, and a footer
   carrying the page number - printed by Chrome rather than drawn in CSS,
   because CSS has no way to count pages.
--------------------------------------------------------------------------- */

import fs from 'fs';
import path from 'path';
import url from 'url';
import { spawn } from 'child_process';

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

// fileURLToPath handles the percent-encoding and the leading slash Windows
// drive letters get in a file:// URL; hand-rolling it left "LINK%20TRADERS".
const here = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const source = path.join(root, 'docs', 'report', 'report.html');
const out = process.argv[2] || path.join(root, 'docs', 'Campus Coin - Project Report (themed).pdf');
const PORT = 9777;

const chromePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!chromePath) {
  console.error('Could not find Chrome. Set one of these paths in CHROME_CANDIDATES:');
  CHROME_CANDIDATES.forEach((p) => console.error('  ' + p));
  process.exit(1);
}
if (!fs.existsSync(source)) {
  console.error('Missing ' + source);
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdp(ws, method, params = {}, id = Math.floor(Math.random() * 1e6)) {
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id !== id) return;
      ws.removeEventListener('message', handler);
      if (msg.error) reject(new Error(method + ': ' + msg.error.message));
      else resolve(msg.result);
    };
    ws.addEventListener('message', handler);
  });
}

const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + path.join(root, 'node_modules', '.cache', 'report-chrome'),
  'about:blank',
], { stdio: 'ignore' });

process.on('exit', () => chrome.kill());

await sleep(2500);

const res = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
const target = await res.json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));

await cdp(ws, 'Page.enable');
const pageUrl = 'file:///' + source.replace(/\\/g, '/').replace(/^\/+/, '');
await cdp(ws, 'Page.navigate', { url: pageUrl });

// Long enough for the Google Fonts stylesheet and the screenshots to land.
await sleep(5000);

// Chrome renders header/footer templates in their own isolated frame, with no
// access to the report's stylesheet or its Google Fonts link - font-family
// here falls back past 'Plus Jakarta Sans' to system-ui on every real render,
// which is fine for a few words of small print but is why the logo is drawn
// as inline SVG paths rather than anything that depends on a loaded font.
const header = `
  <div style="width:100%;font-family:system-ui,sans-serif;font-size:8pt;color:#e8e8ee;
              padding:0 17mm;display:flex;align-items:center;gap:2.6mm;">
    <svg width="12" height="12" viewBox="0 0 48 48" style="flex:none">
      <circle cx="24" cy="24" r="22" fill="none" stroke="#4ade80" stroke-width="2.4" />
      <path d="M32.5 15.5A12 12 0 1 0 32.5 32.5" fill="none" stroke="#4ade80" stroke-width="5.5" stroke-linecap="round" />
      <circle cx="24" cy="24" r="3.4" fill="#4ade80" />
    </svg>
    <span style="font-weight: 700;">Campus Coin</span>
    <span style="color:#8a8a94;">&nbsp;&middot; Project Report</span>
  </div>`;

const footer = `
  <div style="width:100%;font-family:system-ui,sans-serif;font-size:7.4pt;color:#8a8a94;
              padding:0 17mm;display:flex;align-items:center;justify-content:flex-end;">
    <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>`;

const pdf = await cdp(ws, 'Page.printToPDF', {
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: header,
  footerTemplate: footer,
  marginTop: 0.5,
  marginBottom: 0.55,
});

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(pdf.data, 'base64'));

const kb = (fs.statSync(out).size / 1024).toFixed(0);
console.log(`Wrote ${out} (${kb} KB)`);

ws.close();
chrome.kill();
process.exit(0);
