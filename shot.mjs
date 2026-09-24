// Development helper: drives headless Chrome over CDP to screenshot the running
// app, seeding the auth token into localStorage first so signed-in pages render.
// Not part of the application - delete before submitting if you like.
import fs from 'fs';
import { spawn } from 'child_process';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5000';
const OUT = process.argv[2] || './shots';
const token = fs.readFileSync('C:/Users/LINKTR~1/AppData/Local/Temp/cc-token.txt', 'utf8').trim();
const adminToken = fs.readFileSync('C:/Users/LINKTR~1/AppData/Local/Temp/cc-admin-token.txt', 'utf8').trim();

const PAGES = [
  ['landing', '/', null, 'dark', 1440, 1050],
  ['landing-mid', '/', null, 'dark', 1440, 1050],
  ['landing-light', '/', null, 'light', 1440, 1100],
  ['login', '/login', null, 'dark', 1440, 900],
  ['dashboard', '/dashboard', token, 'dark', 1440, 1400],
  ['dashboard-light', '/dashboard', token, 'light', 1440, 1400],
  ['transactions', '/transactions', token, 'dark', 1440, 1300],
  ['reports', '/reports', token, 'dark', 1440, 1700],
  ['budgets', '/budgets', token, 'dark', 1440, 1000],
  ['insights', '/insights', token, 'dark', 1440, 1000],
  ['tips', '/tips', token, 'dark', 1440, 1200],
  ['categories', '/categories', token, 'dark', 1440, 1200],
  ['assistant', '/assistant', token, 'dark', 1440, 1100],
  ['settings', '/settings', token, 'dark', 1440, 1200],
  ['admin', '/admin', adminToken, 'dark', 1440, 1100],
  ['admin-students', '/admin/students', adminToken, 'dark', 1440, 900],
  ['mobile-dashboard', '/dashboard', token, 'dark', 390, 844],
  ['mobile-reports', '/reports', token, 'light', 390, 844],
];

fs.mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=9333', '--user-data-dir=C:/Users/LINKTR~1/AppData/Local/Temp/cc-chrome',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(2500);

async function cdp(ws, method, params = {}, id = Math.floor(Math.random() * 1e6)) {
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => {
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
  });
}

for (const [name, path, tok, theme, width, height] of PAGES) {
  const res = await fetch(`http://127.0.0.1:9333/json/new?about:blank`, { method: 'PUT' });
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));

  await cdp(ws, 'Page.enable');
  await cdp(ws, 'Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 500 });
  // Seed auth + theme before the app boots, so it never flashes the login page.
  await cdp(ws, 'Page.addScriptToEvaluateOnNewDocument', {
    source: `try{${tok ? `localStorage.setItem('campuscoin.token','${tok}');` : `localStorage.removeItem('campuscoin.token');`}localStorage.setItem('campuscoin.theme','${theme}');}catch(e){}`,
  });
  await cdp(ws, 'Page.navigate', { url: BASE + path });
  await sleep(3200);

  const shot = await cdp(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(shot.data, 'base64'));
  console.log('captured', name);
  ws.close();
  await fetch(`http://127.0.0.1:9333/json/close/${target.id}`);
}

chrome.kill();
process.exit(0);
