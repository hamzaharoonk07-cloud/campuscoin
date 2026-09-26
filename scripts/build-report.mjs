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

const footer = `
  <div style="width:100%;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:7.4pt;color:#8a8a94;
              padding:0 17mm;display:flex;align-items:center;">
    <span>Campus Coin &middot; Project Report</span>
    <span style="margin-left:auto;"><span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>`;

const pdf = await cdp(ws, 'Page.printToPDF', {
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: footer,
  marginBottom: 0.55,
});

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(pdf.data, 'base64'));

const kb = (fs.statSync(out).size / 1024).toFixed(0);
console.log(`Wrote ${out} (${kb} KB)`);

ws.close();
chrome.kill();
process.exit(0);
