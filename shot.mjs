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

// Asks the chat a question: types it, submits, and leaves time for the answer.
const ASK = (q) => `(async()=>{const i=document.querySelector('.chat-compose input');const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(i,${JSON.stringify(q)});i.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,100));i.form.requestSubmit();})()`;
const OPEN_BUBBLE = `document.querySelector('.chat-fab').click()`;

// name, path, token, theme, width, height, optional script run after load
const PAGES = [
  ['landing', '/', null, 'dark', 1440, 1050],
  ['login', '/login', null, 'light', 1440, 900],
  ['dashboard', '/dashboard', token, 'light', 1440, 1320],
  ['dashboard-dark', '/dashboard', token, 'dark', 1440, 1320],
  ['transactions', '/transactions', token, 'light', 1440, 1300],
  ['reports', '/reports', token, 'light', 1440, 1450],
  ['budgets', '/budgets', token, 'light', 1440, 1000],
  ['insights', '/insights', token, 'light', 1440, 1000],
  ['tips', '/tips', token, 'light', 1440, 1150],
  ['categories', '/categories', token, 'light', 1440, 1200],
  ['assistant', '/assistant', token, 'light', 1440, 1000, ASK('How much did I spend on food?')],
  ['assistant-dark', '/assistant', token, 'dark', 1440, 1000, ASK('Am I within budget?')],
  ['bubble', '/dashboard', token, 'light', 1440, 900, OPEN_BUBBLE],
  ['settings', '/settings', token, 'light', 1440, 1200],
  ['admin', '/admin', adminToken, 'light', 1440, 1100],
  ['admin-students', '/admin/students', adminToken, 'light', 1440, 900],
  ['mobile-dashboard', '/dashboard', token, 'light', 390, 844],
  ['mobile-assistant', '/assistant', token, 'light', 390, 844],
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

for (const [name, path, tok, theme, width, height, script] of PAGES) {
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
  if (script) {
    await cdp(ws, 'Runtime.evaluate', { expression: script, awaitPromise: true });
    await sleep(1800);
  }

  const shot = await cdp(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(shot.data, 'base64'));
  console.log('captured', name);
  ws.close();
  await fetch(`http://127.0.0.1:9333/json/close/${target.id}`);
}

chrome.kill();
process.exit(0);
