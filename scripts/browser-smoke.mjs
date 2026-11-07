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
const watchdog = setTimeout(() => { console.error('Browser smoke timed out.'); process.exitCode = 1; chrome.kill(); server.kill(); ws?.close(); }, 90000);

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
  const waitFor = async (expression, timeout = 5000) => {
    const deadline = Date.now() + timeout;
    while (!(await evaluate(expression)) && Date.now() < deadline) await delay(50);
    assert(await evaluate(expression), `Timed out: ${expression}`);
  };
  const freshRoomSnapshot = () => evaluate(`({ room: document.querySelector('[data-room]')?.dataset.room, position: document.querySelector('.tile-player')?.dataset.coords, glyph: document.querySelector('[data-glyph-state]')?.dataset.glyphState, exit: document.querySelector('[data-exit-state]')?.dataset.exitState })`);
  const focus = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
  const click = async (selector) => {
    const point = await evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      el.scrollIntoView({ block: 'nearest' });
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`);
    if (!point) {
      await screenshot('failure');
      assert.fail(`Missing control: ${selector}; phase: ${await evaluate("document.querySelector('[data-phase]')?.dataset.phase")}`);
    }
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
    await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
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
  await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__audioContexts = 0;
    if (window.AudioContext) {
      const NativeAudioContext = window.AudioContext;
      window.AudioContext = class extends NativeAudioContext {
        constructor(...args) { super(...args); window.__audioContexts++; }
      };
    }
  ` });
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  await waitFor(`!!document.querySelector('[data-phase="intro"]')`);
  assert(await evaluate(`document.querySelector('#title-help').hidden`));
  await click('[aria-controls="title-help"]');
  assert(!(await evaluate(`document.querySelector('#title-help').hidden`)));
  await click('[aria-controls="title-help"]');
  await click('[data-testid="start-btn"]');
  assert.equal(await evaluate(`document.querySelector('[data-phase]').dataset.phase`), 'cinematic');
  assert.equal(await evaluate(`document.querySelector('[data-shot]').dataset.shot`), 'shutdown');
  await screenshot('00-opening-first-frame');
  await click('[data-testid="skip-intro-btn"]');
  const skippedSnapshot = await freshRoomSnapshot();
  assert.deepEqual(skippedSnapshot, { room: 'display', position: '2,3', glyph: 'hidden', exit: 'locked' });
  assert(!(await modal()));
  assert.equal(await evaluate(`window.__audioContexts`), 0);

  // Restart returns to a clean title, not directly to a running room.
  await key('Escape'); await click('[data-testid="hud-restart-btn"]');
  await waitFor(`!!document.querySelector('[data-phase="intro"]')`);
  assert.equal(await evaluate(`document.activeElement.dataset.testid`), 'start-btn');
  // An uncleared timer from the skipped run would now finish the next opening too early.
  await delay(1200);
  const openingStarted = Date.now();
  await click('[data-testid="start-btn"]');
  await waitFor(`document.querySelector('[data-shot]')?.dataset.shot === 'process'`, 6000);
  for (const k of ['d', 'w', 'e']) await key(k);
  await evaluate(`document.querySelector('.dpad-btn').click()`);
  assert.equal(await position(), '2,3');
  assert(!(await modal()));
  await focus('.dpad-btn');
  assert(!(await evaluate(`document.querySelector('.opening-world').contains(document.activeElement)`)));
  await focus('[data-testid="skip-intro-btn"]');
  await waitFor(`document.querySelector('[data-shot]')?.dataset.shot === 'containment'`, 6500);
  assert.equal(await evaluate(`document.querySelector('[data-door-locked]').dataset.doorLocked`), 'true');
  await screenshot('00-opening-containment');
  await waitFor(`document.querySelector('[data-shot]')?.dataset.shot === 'rules'`, 7500);
  await screenshot('00-opening-rules');
  await waitFor(`!!document.querySelector('[data-phase="playing"]')`, 8500);
  const openingDuration = Date.now() - openingStarted;
  assert(openingDuration >= 21500 && openingDuration < 25000, `Opening took ${openingDuration}ms`);
  assert.deepEqual(await freshRoomSnapshot(), skippedSnapshot);
  assert.equal(await evaluate(`window.__audioContexts`), 0);
  assert.equal(await evaluate(`document.activeElement.className`), 'game-world');
  assert(await evaluate(`document.querySelector('[data-testid="chamber-arrival"]').textContent.includes('WASD / Arrows')`));
  const dimensions = await evaluate(`(() => { const r = document.querySelector('.world-grid').getBoundingClientRect(); return { width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, documentHeight: document.documentElement.scrollHeight, worldArea: r.width * r.height / (innerWidth * innerHeight) }; })()`);
  assert.equal(dimensions.documentWidth, 1280);
  assert.equal(dimensions.documentHeight, 720);
  assert(dimensions.worldArea > 0.7, JSON.stringify(dimensions));
  assert(!(await modal()));
  assert.equal(await evaluate(`document.querySelectorAll('.coord-ruler-top, .viewport-legend, .hud-telemetry, .telemetry-log, .finale-diag-card').length`), 0);
  assert.equal(await evaluate(`document.querySelector('.tile-player .operator')?.tagName`), 'svg');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.optical-signal')).opacity`), '0');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.tile-wall')).zIndex`), '2');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.world-luminance-veil')).zIndex`), '1');
  assert(await evaluate(`Array.from(document.querySelectorAll('[data-nearby]')).every(el => el.dataset.nearby === 'false')`));
  assert(!(await evaluate(`document.querySelector('.hud-bar').textContent.match(/70|55|75|authorized.*K/i)`)));
  await screenshot('01-cold-start');
  await click('[aria-label="Dismiss chamber note"]');
  assert(!(await evaluate(`!!document.querySelector('[data-testid="chamber-arrival"]')`)));

  // Focused HUD/button keys must not reach the world, including descendant targets.
  await focus('[data-testid="settings-open-btn"]');
  for (const k of ['d', 'e', 'k']) await key(k);
  assert.equal(await position(), '2,3');
  await key('Enter'); assert(await modal());
  await focus('.settings-help summary'); await key('Enter');
  assert(await evaluate(`document.querySelector('.settings-help').open`));
  assert(await evaluate(`document.querySelector('.settings-help').textContent.includes('WASD')`));
  await key('Enter');
  for (let i = 0; i < 15; i++) {
    await key('Tab', i > 9 ? 8 : 0);
    // Native Tab may visit browser chrome (BODY), but never the inert game controls.
    assert(await evaluate(`document.activeElement === document.body || document.querySelector('dialog').contains(document.activeElement)`));
  }
  await range('#brightness-slider', 0);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.optical-signal')).opacity`), '0');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.tile-wall')).opacity`), '1');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.operator')).visibility`), 'visible');
  await key('Escape'); await screenshot('01-minimum-brightness'); await key('Escape');
  // Real pointer drag, not just a synthetic value update: the glyph changes before closing.
  const slider = await evaluate(`(() => { const r = document.querySelector('#brightness-slider').getBoundingClientRect(); return { x: r.x, y: r.y + r.height / 2, width: r.width }; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: slider.x + 8, y: slider.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: slider.x + slider.width - 12, y: slider.y, button: 'left', buttons: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: slider.x + slider.width - 12, y: slider.y, button: 'left', clickCount: 1 });
  await delay(50);
  assert.equal(await evaluate(`document.querySelector('[data-glyph-state]').dataset.glyphState`), 'revealed');
  await focus('#brightness-slider');
  await range('#brightness-slider', 69);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.optical-signal')).opacity`), '0');
  await key('ArrowRight');
  assert.equal(await evaluate(`document.querySelector('#brightness-slider').value`), '70');
  assert.equal(await evaluate(`document.querySelector('[data-glyph-state]').dataset.glyphState`), 'revealed');
  assert.equal(await position(), '2,3');
  await delay(550);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.optical-signal')).opacity`), '1');
  await screenshot('02-live-settings');
  await key('Escape'); assert(!(await modal()));
  assert.equal(await evaluate(`document.activeElement.className`), 'game-world');
  // Art layers must not change collision or delay player input.
  await key('w'); assert.equal(await position(), '2,3');
  for (const k of ['d', 'd', 'd', 'w', 'w']) await key(k);
  assert.equal(await position(), '5,1');
  assert.equal(await evaluate(`document.querySelector('[data-glyph-state]').dataset.nearby`), 'true');
  assert(await evaluate(`document.querySelector('[data-glyph-state]').classList.contains('tile-node-ready')`));
  await screenshot('02-glyph-nearby');

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
  await delay(350);
  assert(await evaluate(`getComputedStyle(document.querySelector('.door-leaf-left')).transform !== 'none'`));
  await screenshot('02-door-released');
  for (const k of ['s', 'd', 'd', 's', 'd']) await key(k);
  assert.equal(await room(), 'audio');
  assert(await evaluate(`document.querySelector('[data-testid="chamber-arrival"]').textContent.includes('Light was only the first constraint.')`));
  for (let i = 0; i < 3; i++) await key('d');
  assert.equal(await position(), '4,3');
  assert.equal(await evaluate(`document.querySelector('[data-audio-level]').dataset.audioLevel`), 'muted');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.resonator-mute')).display`), 'block');
  await screenshot('02-resonator-muted');
  await key('Escape'); await range('#volume-slider', 55); await key('Escape'); await key('e'); assert.equal(await exit(), 'locked');
  await key('Escape'); await click('[role="switch"]'); await range('#volume-slider', 54);
  assert.equal(await evaluate(`document.querySelector('[data-audio-level]').dataset.audioLevel`), 'too-low');
  await key('Escape'); await key('e'); assert.equal(await exit(), 'locked');
  await key('Escape'); await range('#volume-slider', 55);
  await focus('#volume-slider'); await key('ArrowRight');
  assert.equal(await evaluate(`document.querySelector('#volume-slider').value`), '56');
  await range('#volume-slider', 76);
  assert.equal(await evaluate(`document.querySelector('[data-audio-level]').dataset.audioLevel`), 'too-high');
  await key('Escape'); await key('e'); assert.equal(await exit(), 'locked');
  await screenshot('02-resonator-overload');
  await key('Escape'); await range('#volume-slider', 75);
  assert.equal(await evaluate(`document.querySelector('[data-audio-level]').dataset.audioLevel`), 'stable');
  assert.equal(await evaluate(`document.querySelector('[data-resonator-state]').dataset.resonatorState`), 'stable');
  await key('Escape'); await delay(450); await screenshot('02-resonator-stable');
  await key('e'); assert.equal(await exit(), 'unlocked');
  for (let i = 0; i < 4; i++) await key('d'); assert.equal(await room(), 'controls');
  assert(await evaluate(`document.querySelector('[data-testid="chamber-arrival"]').textContent.includes('The system has heard you.')`));
  for (let i = 0; i < 4; i++) await key('d');
  assert.equal(await evaluate(`document.querySelector('.terminal-key').textContent`), 'E');
  await screenshot('02-terminal-revoked');
  await key('e'); await key('k'); assert.equal(await exit(), 'locked');
  await key('Escape'); await focus('#interact-key-select');
  await key('k'); await key('Enter');
  assert.equal(await evaluate(`document.querySelector('#interact-key-select').value`), 'k');
  await key('k'); assert.equal(await exit(), 'locked');
  await key('Escape'); await key('e'); assert.equal(await exit(), 'locked');
  await key('k'); assert.equal(await exit(), 'unlocked');
  assert.equal(await evaluate(`document.querySelector('.terminal-key').textContent`), 'K');
  await screenshot('02-terminal-authorized');
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
  assert.equal(await evaluate(`document.querySelector('[data-settled]').dataset.settled`), 'false');
  assert.equal(await evaluate(`document.querySelector('[data-testid="play-again-btn"]').disabled`), false);
  await screenshot('03-escape-crossing');
  await waitFor(`document.querySelector('[data-settled]')?.dataset.settled === 'true'`, 2500);
  await screenshot('03-escape-complete');
  await click('[data-testid="play-again-btn"]');
  assert(await evaluate(`!!document.querySelector('[data-phase="intro"]')`));

  // Mid-sequence Escape skips once; it must not also open Settings.
  await click('[data-testid="start-btn"]');
  await waitFor(`document.querySelector('[data-shot]')?.dataset.shot === 'process'`, 6000);
  await key('Escape');
  assert.deepEqual(await freshRoomSnapshot(), skippedSnapshot);
  assert(!(await modal()));
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', windowsVirtualKeyCode: 27, autoRepeat: true });
  assert(!(await modal()));
  await key('Escape'); assert(await modal());
  assert.equal(await evaluate(`document.querySelector('#brightness-slider').value`), '20');
  assert.equal(await evaluate(`document.querySelector('#volume-slider').value`), '20');
  assert.equal(await evaluate(`document.querySelector('[role="switch"]').getAttribute('aria-checked')`), 'true');
  assert.equal(await evaluate(`document.querySelector('#interact-key-select').value`), 'e');
  await click('[data-testid="hud-restart-btn"]');
  assert(!(await modal()));
  assert(await evaluate(`!!document.querySelector('[data-phase="intro"]')`));

  // Enter on Start must not skip via a held key. Reduced motion removes story movement.
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await key('Enter');
  assert.equal(await evaluate(`document.querySelector('[data-shot]').dataset.shot`), 'shutdown');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', windowsVirtualKeyCode: 13, text: '\r', autoRepeat: true });
  assert.equal(await evaluate(`document.querySelector('[data-phase]').dataset.phase`), 'cinematic');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.opening-world .world-grid')).transform`), 'none');
  await waitFor(`document.querySelector('[data-shot]')?.dataset.shot === 'process'`, 6000);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.tile-entity-player')).animationName`), 'none');
  await screenshot('00-reduced-motion');
  await key('Enter');
  assert.deepEqual(await freshRoomSnapshot(), skippedSnapshot);
  assert(!(await modal()));
  for (const selector of ['.world-grid', '.operator', '.optical-signal']) {
    assert.equal(await evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(selector)})).animationName`), 'none');
  }
  await key('Escape'); await click('.settings-actions button:last-child');
  assert(await evaluate(`!!document.querySelector('[data-phase="intro"]')`));
  await click('[data-testid="start-btn"]'); await click('[data-testid="skip-intro-btn"]');

  const escapeFreshRun = async () => {
    await key('Escape'); await range('#brightness-slider', 70); await key('Escape');
    for (const k of ['d', 'd', 'd', 'w', 'w', 'e', 's', 'd', 'd', 's', 'd']) await key(k);
    await key('Escape'); await range('#volume-slider', 65); await click('[role="switch"]'); await key('Escape');
    for (const k of ['d', 'd', 'd', 'e', 'd', 'd', 'd', 'd']) await key(k);
    for (let i = 0; i < 4; i++) await key('d');
    await key('Escape'); await focus('#interact-key-select'); await key('k'); await key('Enter'); await key('Escape');
    await key('k'); for (let i = 0; i < 10; i++) await key('d');
  };
  // Second and third escapes cover the instant reduced-motion ending and normal-motion skip.
  await escapeFreshRun();
  assert.equal(await evaluate(`document.querySelector('[data-settled]')?.dataset.settled`), 'true');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.escape-operator')).animationName`), 'none');
  await click('[data-testid="play-again-btn"]');
  assert(await evaluate(`!!document.querySelector('[data-phase="intro"]')`));

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await click('[data-testid="start-btn"]'); await click('[data-testid="skip-intro-btn"]');
  await escapeFreshRun();
  assert.equal(await evaluate(`document.querySelector('[data-settled]')?.dataset.settled`), 'false');
  await key('Escape');
  assert.equal(await evaluate(`document.querySelector('[data-settled]')?.dataset.settled`), 'true');
  assert(!(await modal()));
  await click('[data-testid="play-again-btn"]');

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await click('[data-testid="start-btn"]');
  await screenshot('04-mobile-opening');
  await key('Enter');
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
  console.log(`PASS: full opening completed in ${openingDuration}ms; first-frame button, mid-sequence Escape, Enter, held-key and reduced-motion paths passed.`);
  console.log('PASS: cold start → all three puzzles → live-setting finale → escape scene → reset title; three complete escapes, non-blocking chamber notes, menu restart and boot return.');
  console.log('PASS: OP-01 artwork, readable walls above brightness veil, glyph threshold/reveal, proximity, opening door leaves, muted/low/high/stable resonator, terminal authorization and reduced-motion art.');
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
