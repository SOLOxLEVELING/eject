// Run after npm run build. Requires Node 22+ and Chrome (or CHROME_PATH).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const profile = await mkdtemp(join(tmpdir(), 'eject-browser-'));
const chromePath = process.env.CHROME_PATH || (process.platform === 'darwin'
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome');
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '0'], { stdio: ['ignore', 'pipe', 'pipe'] });
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
let serverOutput = '';
let startupError;
server.stdout.on('data', (data) => { serverOutput += data; });
server.stderr.on('data', (data) => { serverOutput += data; });
for (const child of [server, chrome]) child.on('error', (error) => { startupError = error; });
let ws;
const watchdog = setTimeout(() => { console.error('Browser smoke timed out.'); process.exitCode = 1; chrome.kill(); server.kill(); ws?.close(); }, 60000);

try {
  let port;
  let url;
  for (let i = 0; i < 100; i++) {
    if (startupError) throw startupError;
    url = serverOutput.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; } catch {}
    if (url && port) break;
    await delay(100);
  }
  assert(url && port, `Chrome/Vite did not start: ${serverOutput}`);
  const tabs = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
  ws = new WebSocket(tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl);
  await once(ws, 'open');
  let id = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry.text);
    if (message.id) {
      const promise = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) promise.reject(new Error(JSON.stringify(message.error)));
      else promise.resolve(message.result);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, { resolve, reject });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const focus = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
  const click = async (selector) => {
    const point = await evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      el.scrollIntoView({ block: 'nearest' });
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`);
    assert(point, `Missing control: ${selector}`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
    await delay(25);
  };
  const key = async (key, modifiers = 0) => {
    const special = { Escape: 27, Tab: 9, Enter: 13, ' ': 32, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Home: 36, End: 35 };
    const params = {
      key, modifiers,
      windowsVirtualKeyCode: special[key] || key.toUpperCase().charCodeAt(0),
      text: key === 'Enter' ? '\r' : key.length === 1 ? key : undefined,
    };
    await send('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
    await delay(25);
  };
  const range = async (selector, value) => {
    await evaluate(`{ const el = document.querySelector(${JSON.stringify(selector)});
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(String(value))});
      el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }`);
    await delay(25);
  };
  const position = () => evaluate(`document.querySelector('.tile-player')?.dataset.coords`);
  const room = () => evaluate(`document.querySelector('[data-room]')?.dataset.room`);
  const exit = () => evaluate(`document.querySelector('[data-exit-state]')?.dataset.exitState`);
  const modal = () => evaluate(`!!document.querySelector('dialog:modal')`);
  const screenshot = async (name) => {
    if (!process.env.SCREENSHOT_DIR) return;
    await mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(join(process.env.SCREENSHOT_DIR, `${name}.png`), Buffer.from(data, 'base64'));
  };
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  for (let i = 0; i < 100 && !(await evaluate(`!!document.querySelector('[data-phase="intro"]')`)); i++) await delay(50);
  await click('.console-btn-primary');
  assert.equal(await room(), 'display');
  assert.equal(await position(), '2,3');
  assert.equal(await evaluate(`document.activeElement.className`), 'game-world');
  const dimensions = await evaluate(`(() => { const r = document.querySelector('.world-grid').getBoundingClientRect(); return { width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, documentHeight: document.documentElement.scrollHeight, worldArea: r.width * r.height / (innerWidth * innerHeight) }; })()`);
  assert.equal(dimensions.documentWidth, 1280);
  assert.equal(dimensions.documentHeight, 720);
  assert(dimensions.worldArea > 0.7, JSON.stringify(dimensions));
  assert(!(await modal()));
  assert.equal(await evaluate(`document.querySelectorAll('.coord-ruler-top, .viewport-legend, .hud-telemetry, .telemetry-log, .finale-diag-card').length`), 0);
  await screenshot('01-cold-start');

  // Focused HUD/button keys must not reach the world, including descendant targets.
  await focus('[data-testid="settings-open-btn"]');
  for (const k of ['d', 'e', 'k']) await key(k);
  assert.equal(await position(), '2,3');
  await key('Enter'); assert(await modal());
  for (let i = 0; i < 15; i++) {
    await key('Tab', i > 9 ? 8 : 0);
    // Native Tab may visit browser chrome (BODY), but never the inert game controls.
    assert(await evaluate(`document.activeElement === document.body || document.querySelector('dialog').contains(document.activeElement)`));
  }
  // Real pointer drag, not just a synthetic value update: the glyph changes before closing.
  const slider = await evaluate(`(() => { const r = document.querySelector('#brightness-slider').getBoundingClientRect(); return { x: r.x, y: r.y + r.height / 2, width: r.width }; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: slider.x + 8, y: slider.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: slider.x + slider.width - 12, y: slider.y, button: 'left', buttons: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: slider.x + slider.width - 12, y: slider.y, button: 'left', clickCount: 1 });
  await delay(50);
  assert.equal(await evaluate(`document.querySelector('[data-glyph-state]').dataset.glyphState`), 'revealed');
  await focus('#brightness-slider');
  await range('#brightness-slider', 69);
  await key('ArrowRight');
  assert.equal(await evaluate(`document.querySelector('#brightness-slider').value`), '70');
  assert.equal(await evaluate(`document.querySelector('[data-glyph-state]').dataset.glyphState`), 'revealed');
  assert.equal(await position(), '2,3');
  await screenshot('02-live-settings');
  await key('Escape'); assert(!(await modal()));
  assert.equal(await evaluate(`document.activeElement.className`), 'game-world');
  for (const k of ['d', 'd', 'd', 'w', 'w']) await key(k);
  assert.equal(await position(), '5,1');

  // Regression: a bound key on a focused range/button must not activate a nearby glyph.
  await focus('[data-testid="settings-open-btn"]'); await key('e');
  assert.equal(await exit(), 'locked');
  await key('Escape');
  await focus('.settings-header button'); await key('e');
  assert.equal(await exit(), 'locked');
  await focus('#brightness-slider');
  for (const k of ['e', 'k', 'd', 'w']) await key(k);
  await evaluate(`document.querySelector('[aria-label="Move right"]').click(); document.querySelector('[data-testid="onscreen-interact-btn"]').click()`);
  assert.equal(await position(), '5,1');
  assert.equal(await exit(), 'locked');
  assert.equal(await evaluate(`document.activeElement.id`), 'brightness-slider');
  await range('#brightness-slider', 69); await key('Escape'); await key('e'); assert.equal(await exit(), 'locked');
  await key('Escape'); await range('#brightness-slider', 70); await click('.settings-header button');
  await click('[data-testid="onscreen-interact-btn"]'); assert.equal(await exit(), 'unlocked');
  for (const k of ['s', 'd', 'd', 's', 'd']) await key(k);
  assert.equal(await room(), 'audio');

  for (let i = 0; i < 3; i++) await key('d');
  await key('Escape'); await range('#volume-slider', 55); await key('Escape'); await key('e'); assert.equal(await exit(), 'locked');
  await key('Escape'); await click('[role="switch"]'); await range('#volume-slider', 54); await key('Escape'); await key('e'); assert.equal(await exit(), 'locked');
  await key('Escape'); await range('#volume-slider', 55);
  await focus('#volume-slider'); await key('ArrowRight');
  assert.equal(await evaluate(`document.querySelector('#volume-slider').value`), '56');
  await range('#volume-slider', 75); await key('Escape'); await key('e'); assert.equal(await exit(), 'unlocked');
  for (let i = 0; i < 4; i++) await key('d'); assert.equal(await room(), 'controls');

  for (let i = 0; i < 4; i++) await key('d');
  await key('e'); await key('k'); assert.equal(await exit(), 'locked');
  await key('Escape'); await focus('#interact-key-select');
  await key('k'); await key('Enter');
  assert.equal(await evaluate(`document.querySelector('#interact-key-select').value`), 'k');
  await key('k'); assert.equal(await exit(), 'locked');
  await key('Escape'); await key('e'); assert.equal(await exit(), 'locked');
  await key('k'); assert.equal(await exit(), 'unlocked');
  for (let i = 0; i < 3; i++) await key('d'); assert.equal(await room(), 'finale');
  for (let i = 0; i < 6; i++) await key('d');
  for (const [selector, invalid, valid] of [['#brightness-slider', 69, 70], ['#volume-slider', 76, 75]]) {
    await key('Escape'); await range(selector, invalid);
    assert.equal(await exit(), 'locked');
    await key('Escape'); await key('d'); assert.equal(await position(), '7,3');
    await key('Escape'); await range(selector, valid); await key('Escape'); assert.equal(await exit(), 'unlocked');
  }
  await key('Escape'); await click('[role="switch"]'); assert.equal(await exit(), 'locked');
  await click('[role="switch"]'); assert.equal(await exit(), 'unlocked');
  await focus('#interact-key-select'); await key('e'); await key('Enter');
  assert.equal(await exit(), 'locked');
  await key('Escape'); await key('d'); assert.equal(await position(), '7,3');
  await key('Escape'); await focus('#interact-key-select'); await key('k'); await key('Enter');
  assert.equal(await exit(), 'unlocked');
  await screenshot('03-finale-live-locks');
  await key('Escape'); await key('d');
  assert(await evaluate(`!!document.querySelector('[data-phase="won"]')`));
  await click('[data-testid="play-again-btn"]'); assert.equal(await room(), 'display');
  await key('Escape');
  assert.equal(await evaluate(`document.querySelector('#brightness-slider').value`), '20');
  assert.equal(await evaluate(`document.querySelector('#volume-slider').value`), '20');
  assert.equal(await evaluate(`document.querySelector('[role="switch"]').getAttribute('aria-checked')`), 'true');
  assert.equal(await evaluate(`document.querySelector('#interact-key-select').value`), 'e');
  await click('[data-testid="hud-restart-btn"]'); assert(!(await modal())); assert.equal(await position(), '2,3');
  await key('Escape'); await click('.settings-actions button:last-child');
  assert(await evaluate(`!!document.querySelector('[data-phase="intro"]')`));
  await click('.console-btn-primary');

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate(`document.documentElement.scrollWidth`), 390);
  await click('[aria-label="Move right"]'); assert.equal(await position(), '3,3');
  await click('[data-testid="settings-open-btn"]'); assert(await modal());
  await focus('#brightness-slider'); await key('ArrowRight');
  assert.equal(await position(), '3,3');
  await screenshot('04-mobile-overlay');
  await key('Escape'); assert(!(await modal()));
  await screenshot('05-mobile-room');
  assert.deepEqual(errors, []);
  console.log(`PASS: world fills ${(dimensions.worldArea * 100).toFixed(1)}% of 1280×720; no page overflow.`);
  console.log('PASS: button/Escape menu, native Tab containment, slider/select keyboard controls, focus return, no keyboard/pointer leakage.');
  console.log('PASS: cold start → all three puzzles → live-setting finale → win → replay, menu restart and boot return.');
  console.log('PASS: 390px pointer controls/overlay and no captured browser errors.');
} finally {
  clearTimeout(watchdog);
  ws?.close();
  const stopped = [chrome, server].filter((child) => child.pid && child.exitCode === null).map((child) => {
    const exit = once(child, 'exit'); child.kill('SIGTERM'); return exit;
  });
  await Promise.all(stopped);
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 });
}
