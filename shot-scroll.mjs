// Captures one page at several scroll positions, for reviewing a long layout.
import fs from 'fs';
import { spawn } from 'child_process';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2] || 'http://localhost:5000/';
const out = process.argv[3] || './shots';
const theme = process.argv[4] || 'dark';
const chrome = spawn(CHROME, ['--headless=new','--disable-gpu','--hide-scrollbars',
  '--remote-debugging-port=9344','--user-data-dir=C:/Users/LINKTR~1/AppData/Local/Temp/cc-chrome2','about:blank'], { stdio:'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
await sleep(5000);
const res = await fetch('http://127.0.0.1:9344/json/new?about:blank', { method:'PUT' });
const target = await res.json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
const cdp = (method, params={}, id=Math.floor(Math.random()*1e6)) => {
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise(resolve => {
    const h = e => { const m = JSON.parse(e.data); if (m.id === id) { ws.removeEventListener('message', h); resolve(m.result); } };
    ws.addEventListener('message', h);
  });
};
await cdp('Page.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width:1440, height:1000, deviceScaleFactor:1, mobile:false });
await cdp('Page.addScriptToEvaluateOnNewDocument', { source:`try{localStorage.setItem('campuscoin.theme','${theme}')}catch(e){}` });
await cdp('Page.navigate', { url });
await sleep(5000);
const { result } = await cdp('Runtime.evaluate', { expression: 'document.body.scrollHeight' });
const total = result.value;
if (!total) { console.error('page did not render - is the server up?'); process.exit(1); }
console.log('page height', total);
for (let i = 0, y = 0; y < total; i++, y += 950) {
  await cdp('Runtime.evaluate', { expression: `window.scrollTo(0, ${y})` });
  await sleep(1400);
  const shot = await cdp('Page.captureScreenshot', { format:'png' });
  fs.writeFileSync(`${out}/scroll-${i}.png`, Buffer.from(shot.data,'base64'));
  console.log('captured scroll-' + i, 'at y=' + y);
}
chrome.kill(); process.exit(0);
