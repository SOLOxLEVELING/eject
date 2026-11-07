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
const watchdog = setTimeout(() => { console.error('Browser smoke timed out.'); process.exitCode = 1; chrome.kill(); server.kill(); ws?.close(); }, 120000);

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
  const checkRoomHint = async (moveWhileOpen = false) => {
    const before = await position();
    await focus('[aria-label="Show chamber hint"]'); await key('Enter');
    assert.equal(await evaluate(`document.querySelector('[data-testid="chamber-arrival"]').dataset.message`), 'hint');
    assert(!(await modal()));
    assert.equal(await evaluate(`document.activeElement.className`), 'game-world');
    assert(!(await evaluate(`/\\d|%/.test(document.querySelector('#chamber-note .story-dialogue').textContent)`)));
    if (moveWhileOpen) {
      await key('d'); assert.equal(await position(), '3,3');
      await key('a'); assert.equal(await position(), before);
      assert.equal(await evaluate(`document.querySelector('[data-testid="chamber-arrival"]').dataset.message`), 'hint');
    }
    await screenshot(`v3-5-hint-${await room()}`);
    await focus('[aria-label="Dismiss chamber note"]');
    for (const k of ['d', 'e', 'k']) await key(k);
    assert.equal(await position(), before);
    await key('Tab');
    assert(!(await evaluate(`document.querySelector('#chamber-note').contains(document.activeElement)`)));
    await click('[aria-label="Dismiss chamber note"]');
    assert.equal(await evaluate(`document.activeElement.className`), 'game-world');
    assert(!(await evaluate(`!!document.querySelector('#chamber-note')`)));
  };
  const completeCrossTalk = async (exercise = false) => {
    assert.equal(await room(), 'crosstalk');
    assert.equal(await evaluate(`document.querySelector('[data-cross-stage]').dataset.crossStage`), 'unlinked');
    assert.equal(await exit(), 'locked');
    if (exercise) await checkRoomHint();
    if (exercise) {
      // The old room flags and already-valid audio cannot skip the optical step.
      for (const k of ['d', 'd', 'd', 'd', 's', 's', 'k']) await key(k);
      assert.equal(await evaluate(`document.querySelector('[data-cross-relay-state]').dataset.crossRelayState`), 'no-carrier');
      await screenshot('03-crosstalk-no-carrier');
      for (const k of ['w', 'w', 'a', 'a', 'a', 'a']) await key(k);
    }
    await key('w'); await key('w'); assert.equal(await position(), '1,1');
    if (exercise) {
      await key('Escape'); await range('#brightness-slider', 69); await key('Escape'); await key('k');
      assert.equal(await evaluate(`document.querySelector('[data-cross-receiver-state]').dataset.crossReceiverState`), 'hidden');
      assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-cross-receiver-state] .optical-signal')).opacity`), '0');
      await screenshot('03-crosstalk-hidden-lens');
      await key('Escape'); await focus('#brightness-slider'); await key('k');
      assert.equal(await evaluate(`document.querySelector('[data-cross-stage]').dataset.crossStage`), 'unlinked');
      await range('#brightness-slider', 70);
      await delay(550); await screenshot('03-crosstalk-reveal-live'); await key('Escape');
    }
    await click('[data-testid="onscreen-interact-btn"]');
    assert.equal(await evaluate(`document.querySelector('[data-cross-stage]').dataset.crossStage`), 'routed');
    assert.equal(await evaluate(`document.querySelectorAll('.tile-node-ready').length`), 0);
    assert.equal(await evaluate(`!!document.querySelector('[data-testid="onscreen-interact-btn"]')`), false);
    assert.equal(await evaluate(`document.querySelector('[data-cross-receiver-state]').dataset.crossReceiverState`), 'linked');
    assert.equal(await exit(), 'locked');
    await screenshot('03-crosstalk-carrier-routed');
    if (exercise) {
      await key('Escape'); await range('#brightness-slider', 0); await range('#volume-slider', 54); await key('Escape');
    }
    for (const k of ['s', 's', 'd', 'd', 'd', 'd', 's', 's']) await key(k);
    assert.equal(await position(), '5,5');
    if (exercise) {
      await key('k'); assert.equal(await exit(), 'locked');
      assert.equal(await evaluate(`document.querySelector('[data-cross-relay-state]').dataset.crossRelayState`), 'too-low');
      await key('Escape'); await range('#volume-slider', 55); await click('[role="switch"]'); await key('Escape');
      await key('k'); assert.equal(await exit(), 'locked');
      assert.equal(await evaluate(`document.querySelector('[data-cross-relay-state]').dataset.crossRelayState`), 'muted');
      await screenshot('03-crosstalk-relay-muted');
      await key('Escape'); await click('[role="switch"]'); await range('#volume-slider', 75); await key('Escape');
      await focus('[data-testid="settings-open-btn"]'); await key('k'); assert.equal(await exit(), 'locked');
      await focus('.game-world');
    }
    assert.equal(await evaluate(`document.querySelectorAll('.tile-node-ready').length`), 1);
    await click('[data-testid="onscreen-interact-btn"]');
    assert.equal(await evaluate(`document.querySelector('[data-cross-stage]').dataset.crossStage`), 'powered');
    assert.equal(await exit(), 'unlocked');
    assert(await evaluate(`document.querySelector('#chamber-note').textContent.includes('They can finally hear each other.')`));
    await screenshot('03-crosstalk-exit-powered');
    if (exercise) {
      await key('Escape'); await range('#volume-slider', 0); await click('[role="switch"]');
      assert.equal(await exit(), 'unlocked');
      await range('#brightness-slider', 70); await range('#volume-slider', 75); await click('[role="switch"]'); await key('Escape');
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      assert.equal(await evaluate(`document.documentElement.scrollWidth`), 390);
      await screenshot('03-crosstalk-mobile-room');
      await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    }
    if (await evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches`)) {
      assert.equal(await evaluate(`getComputedStyle(document.querySelector('.cable-output')).animationName`), 'none');
    }
    for (const k of ['w', 'w', 'w', 'w', 'd', 'd', 's', 's', 'd']) await key(k);
    assert.equal(await room(), 'finale');
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
  assert.equal(await evaluate(`document.querySelectorAll('.boot-SideRack, .rack-register').length`), 0);
  assert(await evaluate(`document.querySelector('.crt-screen').contains(document.querySelector('[data-testid="start-btn"]'))`));
  assert(await evaluate(`document.querySelector('.crt-screen').textContent.includes('PLAYERS ONLINE: 1')`));
  await screenshot('v3-2-title-bedroom');
  await click('[aria-controls="title-help"]');
  assert(!(await evaluate(`document.querySelector('#title-help').hidden`)));
  await screenshot('v3-2-title-help');
  await click('#title-help button');
  assert.equal(await evaluate(`document.activeElement.getAttribute('aria-controls')`), 'title-help');
  await click('[data-testid="start-btn"]');
  assert.equal(await evaluate(`document.querySelector('[data-phase]').dataset.phase`), 'cinematic');
  assert.equal(await evaluate(`document.querySelector('[data-shot]').dataset.shot`), 'final-night');
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
  await click('[data-testid="start-btn"]');
  await click('[data-testid="advance-intro-btn"]');
  assert.equal(await evaluate(`document.querySelector('[data-shot]').dataset.shot`), 'too-late');
  await click('[data-testid="skip-intro-btn"]');
  assert.deepEqual(await freshRoomSnapshot(), skippedSnapshot);
  assert(!(await modal()));
  await key('Escape'); await click('[data-testid="hud-restart-btn"]');
  // An uncleared timer from the skipped run would now finish the next opening too early.
  await delay(1200);
  const openingStarted = Date.now();
  await click('[data-testid="start-btn"]');
  await waitFor(`document.querySelector('[data-shot]')?.dataset.shot === 'too-late'`, 10000);
  assert(await evaluate(`document.querySelector('.crt-screen').textContent.includes('SESSION TERMINATED')`));
  await screenshot('v3-2-session-terminated');
  for (const k of ['d', 'w', 'e']) await key(k);
  await evaluate(`document.querySelector('.dpad-btn').click()`);
  assert.equal(await position(), '2,3');
  assert(!(await modal()));
  await focus('.dpad-btn');
  assert(!(await evaluate(`document.querySelector('.opening-world').contains(document.activeElement)`)));
  await focus('[data-testid="skip-intro-btn"]');
  await waitFor(`document.querySelector('[data-shot]')?.dataset.shot === 'the-pull'`, 7500);
  await screenshot('v3-2-pull');
  await waitFor(`document.querySelector('[data-shot]')?.dataset.shot === 'new-body'`, 7500);
  assert.equal(await evaluate(`document.querySelector('[data-door-locked]').dataset.doorLocked`), 'true');
  assert(await evaluate(`document.querySelector('.story-dialogue').textContent.includes("I'm... inside the game?")`));
  await focus('.dpad-btn');
  assert(!(await evaluate(`document.querySelector('.opening-world').contains(document.activeElement)`)));
  await screenshot('00-opening-containment');
  await waitFor(`document.querySelector('[data-shot]')?.dataset.shot === 'agency'`, 12000);
  await screenshot('00-opening-rules');
  await waitFor(`!!document.querySelector('[data-phase="playing"]')`, 10000);
  const openingDuration = Date.now() - openingStarted;
  assert(openingDuration >= 42500 && openingDuration < 46000, `Opening took ${openingDuration}ms`);
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
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.world-luminance-veil')).zIndex`), '4');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.tile-player')).zIndex`), '5');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.world-luminance-veil')).pointerEvents`), 'none');
  assert(await evaluate(`Array.from(document.querySelectorAll('[data-nearby]')).every(el => el.dataset.nearby === 'false')`));
  assert(!(await evaluate(`document.querySelector('.hud-bar').textContent.match(/70|55|75|authorized.*K/i)`)));
  await screenshot('01-cold-start');
  await click('[aria-label="Dismiss chamber note"]');
  assert(!(await evaluate(`!!document.querySelector('[data-testid="chamber-arrival"]')`)));
  await checkRoomHint(true);

  // Same room and position: brightness changes spatial visibility, not only the glyph.
  const lightCenter = () => evaluate(`document.querySelector('.world-luminance-veil').dataset.lightCenter`);
  const initialCenter = await lightCenter();
  assert.equal(initialCenter, `${2.5 / 9 * 100}% ${3.5 / 7 * 100}%`);
  assert(await evaluate(`Number(document.querySelector('.world-luminance-veil').dataset.darkness) > 0.9`));
  await screenshot('v3-01-brightness-20-same-position');
  await range('#patch-brightness', 80);
  assert(!(await modal()));
  assert.equal(await position(), '2,3');
  assert.equal(await lightCenter(), initialCenter);
  assert(await evaluate(`Number(document.querySelector('.world-luminance-veil').dataset.darkness) < 0.07`));
  await screenshot('v3-02-brightness-80-same-position');
  await range('#patch-brightness', 20);
  await click('[data-testid="patch-return-btn"]');
  for (const k of ['a', 'w', 'w']) await key(k);
  assert.equal(await position(), '1,1');
  assert.equal(await lightCenter(), `${1.5 / 9 * 100}% ${1.5 / 7 * 100}%`);
  await screenshot('v3-03-edge-spotlight-20');
  for (const k of ['s', 's', 'd']) await key(k);
  assert.equal(await lightCenter(), initialCenter);

  // Nonmodal instrument controls: adjust, move, adjust again without opening Settings.
  await focus('#patch-brightness'); await key('ArrowRight');
  assert.equal(await evaluate(`document.querySelector('#patch-brightness').value`), '21');
  for (const k of ['d', 'w', 'e', 'k']) await key(k);
  assert.equal(await position(), '2,3');
  await key('Tab');
  assert.equal(await evaluate(`document.activeElement.id`), 'patch-volume');
  await key('ArrowRight');
  assert.equal(await evaluate(`document.querySelector('#patch-volume').value`), '21');
  assert.equal(await position(), '2,3');
  await click('[data-testid="patch-return-btn"]'); await key('d');
  assert.equal(await position(), '3,3');
  await focus('#patch-brightness'); await key('ArrowLeft');
  assert.equal(await position(), '3,3');
  await click('[data-testid="patch-return-btn"]'); await key('a');
  assert.equal(await position(), '2,3');
  await range('#patch-volume', 20);
  await click('.patch-expansion summary');
  for (const k of ['d', 'w', 'e', 'k']) await key(k);
  assert.equal(await position(), '2,3');
  await key('Tab');
  assert.equal(await evaluate(`document.activeElement.id`), 'patch-key');
  await key('Tab');
  assert(!(await evaluate(`document.querySelector('.patch-deck').contains(document.activeElement)`)));
  await click('.patch-expansion summary');
  await click('[data-testid="patch-return-btn"]');
  assert(!(await modal()));
  await screenshot('v3-3-patch-deck');
  // Drag the deck's real thumb while the world stays live and the menu stays shut.
  const patchSlider = await evaluate(`(() => { const r = document.querySelector('#patch-brightness').getBoundingClientRect(); return { x: r.x, y: r.y + r.height / 2, width: r.width }; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: patchSlider.x + 8, y: patchSlider.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: patchSlider.x + patchSlider.width - 8, y: patchSlider.y, button: 'left', buttons: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: patchSlider.x + patchSlider.width - 8, y: patchSlider.y, button: 'left', clickCount: 1 });
  await delay(50);
  assert.equal(await evaluate(`document.querySelector('[data-glyph-state]').dataset.glyphState`), 'revealed');
  assert.equal(await position(), '2,3');
  assert(!(await modal()));
  await range('#patch-brightness', 20); await click('[data-testid="patch-return-btn"]');
  const unobscuredRoom = await evaluate(`(() => {
    const world = document.querySelector('.world-grid').getBoundingClientRect();
    const deck = document.querySelector('.patch-deck').getBoundingClientRect();
    const overlap = Math.max(0, Math.min(world.right, deck.right) - Math.max(world.left, deck.left)) * Math.max(0, Math.min(world.bottom, deck.bottom) - Math.max(world.top, deck.top));
    return 1 - overlap / (world.width * world.height);
  })()`);
  assert(unobscuredRoom > 0.8, 'Patch Deck must leave over 80% of the room visible');
  await range('#patch-brightness', 37); await range('#patch-volume', 62); await click('#patch-mute');
  await click('.patch-expansion summary'); await focus('#patch-key'); await key('f'); await key('Enter');
  await click('.patch-expansion summary'); await click('[data-testid="patch-return-btn"]');

  // Focused HUD/button keys must not reach the world, including descendant targets.
  await focus('[data-testid="settings-open-btn"]');
  for (const k of ['d', 'e', 'k']) await key(k);
  assert.equal(await position(), '2,3');
  await key('Enter'); assert(await modal());
  assert.equal(await evaluate(`!!document.querySelector('#window-mode-select')`), false);
  assert.equal(await evaluate(`document.querySelector('#brightness-slider').value`), '37');
  assert.equal(await evaluate(`document.querySelector('#volume-slider').value`), '62');
  assert.equal(await evaluate(`document.querySelector('[role="switch"]').getAttribute('aria-checked')`), 'false');
  assert.equal(await evaluate(`document.querySelector('#interact-key-select').value`), 'f');
  await range('#brightness-slider', 20); await range('#volume-slider', 20); await click('[role="switch"]');
  await focus('#interact-key-select'); await key('e'); await key('Enter');
  assert.equal(await evaluate(`document.querySelector('#patch-brightness').value`), '20');
  assert.equal(await evaluate(`document.querySelector('#patch-volume').value`), '20');
  assert.equal(await evaluate(`document.querySelector('#patch-mute').getAttribute('aria-pressed')`), 'true');
  assert.equal(await evaluate(`document.querySelector('#patch-key').value`), 'e');
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
  assert.equal(await evaluate(`document.querySelector('#patch-brightness').value`), '0');
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
  assert.equal(await evaluate(`document.querySelector('#patch-brightness').value`), '70');
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
  assert.equal(await evaluate(`document.querySelector('[data-testid="chamber-arrival"]').dataset.message`), 'success');
  await focus('[aria-label="Dismiss chamber note"]');
  await delay(6200);
  assert(await evaluate(`document.querySelector('#chamber-note').contains(document.activeElement)`));
  await click('[aria-label="Dismiss chamber note"]');
  for (const k of ['s', 'd', 'd', 's', 'd']) await key(k);
  assert.equal(await room(), 'audio');
  assert(await evaluate(`document.querySelector('[data-testid="chamber-arrival"]').textContent.includes('Something in here is listening.')`));
  await checkRoomHint();
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
  assert.equal(await evaluate(`document.querySelector('#patch-volume').value`), '75');
  assert.equal(await evaluate(`document.querySelector('#patch-mute').getAttribute('aria-pressed')`), 'false');
  assert.equal(await evaluate(`document.querySelector('[data-audio-level]').dataset.audioLevel`), 'stable');
  assert.equal(await evaluate(`document.querySelector('[data-resonator-state]').dataset.resonatorState`), 'stable');
  await key('Escape'); await delay(450); await screenshot('02-resonator-stable');
  await key('e'); assert.equal(await exit(), 'unlocked');
  for (let i = 0; i < 4; i++) await key('d'); assert.equal(await room(), 'controls');
  assert(await evaluate(`document.querySelector('[data-testid="chamber-arrival"]').textContent.includes("It doesn't recognize my input.")`));
  await checkRoomHint();
  for (let i = 0; i < 4; i++) await key('d');
  assert.equal(await evaluate(`document.querySelector('.terminal-key').textContent`), 'E');
  await screenshot('02-terminal-revoked');
  await key('e'); await key('k'); assert.equal(await exit(), 'locked');
  await key('Escape'); await focus('#interact-key-select');
  await key('k'); await key('Enter');
  assert.equal(await evaluate(`document.querySelector('#interact-key-select').value`), 'k');
  assert.equal(await evaluate(`document.querySelector('#patch-key').value`), 'k');
  await key('k'); assert.equal(await exit(), 'locked');
  await key('Escape'); await key('e'); assert.equal(await exit(), 'locked');
  await key('k'); assert.equal(await exit(), 'unlocked');
  assert.equal(await evaluate(`document.querySelector('.terminal-key').textContent`), 'K');
  await screenshot('02-terminal-authorized');
  for (let i = 0; i < 3; i++) await key('d'); assert.equal(await room(), 'frame');
  await checkRoomHint();
  assert.equal(await exit(), 'locked');
  assert(await evaluate(`document.querySelector('.frame-clue').textContent === 'THE FRAME IS PART OF THE PRISON.'`));
  const browserWindow = await evaluate(`({ width: outerWidth, height: outerHeight })`);
  for (const k of ['w', 'w', 'd', 'd', 's', 's']) await key(k);
  assert.equal(await position(), '3,3');
  await key('d'); assert.equal(await position(), '3,3');
  await delay(300);
  const frameSceneSnapshot = () => evaluate(`(() => {
    const r = document.querySelector('.world-grid').getBoundingClientRect();
    const p = document.querySelector('.tile-player').getBoundingClientRect();
    return { world: [r.x, r.y, r.width, r.height], player: [p.x, p.y, p.width, p.height], position: document.querySelector('.tile-player').dataset.coords, light: document.querySelector('.world-luminance-veil').dataset.lightCenter };
  })()`);
  const frameCamera = await frameSceneSnapshot();
  const assertAperture = async (closed) => {
    assert(await evaluate(`(() => {
      const grid = document.querySelector('.world-grid');
      const shutter = document.querySelector('.frame-shutter');
      const r = grid.getBoundingClientRect();
      const s = shutter.getBoundingClientRect();
      const passage = document.querySelector('[data-frame-state]');
      const edge = passage.getBoundingClientRect().left;
      return ${closed} ? passage.dataset.tile === 'wall' && Math.abs(s.left - edge) < 2 && s.width > r.width * 0.5
        : passage.dataset.tile === 'floor' && s.left >= r.right - 2;
    })()`), 'Visual aperture must agree with passage collision');
  };
  await assertAperture(true);
  assert(await evaluate(`Number(getComputedStyle(document.querySelector('.tile-player')).zIndex) > Number(getComputedStyle(document.querySelector('.frame-aperture')).zIndex)`));
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.frame-aperture')).overflow`), 'hidden');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.frame-aperture')).pointerEvents`), 'none');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.frame-shutter')).transitionDuration`), '0.28s');
  await screenshot('v3-4-framed-same-position');
  await screenshot('03-frame-sealed');
  await key('Escape'); await focus('#window-mode-select'); await key('b'); await key('Enter');
  assert.equal(await evaluate(`document.querySelector('[data-frame-state]').dataset.frameState`), 'borderless');
  assert.equal(await evaluate(`document.querySelector('[data-frame-state]').dataset.tile`), 'floor');
  assert.equal(await evaluate(`document.querySelector('#patch-frame').value`), 'borderless');
  assert.equal(await exit(), 'unlocked');
  assert.equal(await position(), '3,3');
  await delay(300);
  assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('.frame-beam-top')).transform`), 'none');
  await screenshot('03-frame-retracted-live');
  await assertAperture(false);
  await key('Escape');
  assert.deepEqual(await frameSceneSnapshot(), frameCamera);
  await screenshot('v3-4-borderless-same-position');
  assert(await evaluate(`document.querySelector('#chamber-note').textContent.includes('The room got bigger.')`));
  await click('[aria-label="Dismiss chamber note"]');
  await key('d'); assert.equal(await position(), '4,3');
  // Reclosing cannot crush OP-01 on the passage or strand them beyond it.
  for (const expectedPosition of ['4,3', '5,3']) {
    await key('Escape'); await focus('#window-mode-select'); await key('f'); await key('Enter');
    assert.equal(await evaluate(`document.querySelector('#window-mode-select').value`), 'borderless');
    assert(await evaluate(`document.querySelector('#window-mode-feedback').textContent.includes('Return to the entry side')`));
    assert.equal(await position(), expectedPosition);
    await assertAperture(false);
    await screenshot(`03-frame-safe-rejection-${expectedPosition[0]}`);
    await key('Escape');
    if (expectedPosition === '4,3') await key('d');
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await key('Escape');
  assert.equal(await evaluate(`document.documentElement.scrollWidth`), 390);
  assert.equal(await evaluate(`document.querySelector('#window-mode-select').value`), 'borderless');
  await screenshot('03-frame-mobile-overlay');
  await key('Escape'); await screenshot('03-frame-mobile-room');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await key('a'); await key('a'); assert.equal(await position(), '3,3');
  await key('Escape'); await focus('#window-mode-select'); await key('f'); await key('Enter');
  assert.equal(await evaluate(`document.querySelector('[data-frame-state]').dataset.tile`), 'wall');
  await delay(300);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.frame-beam-top')).transform`), 'none');
  await assertAperture(true);
  await key('Escape'); await screenshot('03-frame-restored'); await key('d'); assert.equal(await position(), '3,3');
  await key('Escape'); await focus('#window-mode-select'); await key('b'); await key('Enter'); await key('Escape');
  assert(!(await evaluate(`!!document.querySelector('#chamber-note')`)), 'Repeated Frame toggles must not spam success dialogue');
  for (const k of ['d', 'd', 's', 's', 'd', 'd', 'w', 'w', 'd']) await key(k);
  await completeCrossTalk(true);
  assert.equal(await room(), 'finale');
  assert.equal(await evaluate(`document.querySelectorAll('.frame-aperture').length`), 0);
  await checkRoomHint();
  assert.deepEqual(await evaluate(`({ width: outerWidth, height: outerHeight })`), browserWindow);
  assert.equal(await evaluate(`!!document.fullscreenElement`), false);
  await key('Escape'); await focus('#window-mode-select'); await key('f'); await key('Enter');
  assert.equal(await exit(), 'unlocked');
  assert.equal(await evaluate(`document.querySelectorAll('.gate-lock').length`), 3);
  await key('Escape');
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
  assert(await evaluate(`document.querySelector('.escape-screen .story-dialogue').textContent.includes('PLAYERS ONLINE: 0')`));
  const endingStarted = Date.now();
  await waitFor(`document.querySelector('[data-ending-stage]')?.dataset.endingStage === 'look-again'`, 2000);
  assert(await evaluate(`document.querySelector('.escape-screen .story-dialogue').textContent.includes('Look again.')`));
  await screenshot('v3-5-look-again');
  await waitFor(`document.querySelector('[data-ending-stage]')?.dataset.endingStage === 'seen'`, 2000);
  assert(await evaluate(`document.querySelector('.escape-screen .story-dialogue').textContent.includes('PLAYERS ONLINE: 1')`));
  await delay(600);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.escape-darkness')).opacity`), '0');
  await screenshot('v3-5-player-seen');
  await waitFor(`document.querySelector('[data-ending-stage]')?.dataset.endingStage === 'dawn'`, 2500);
  assert(await evaluate(`document.querySelector('[data-moment="dawn"]').textContent.includes('THANK YOU FOR PLAYING.')`));
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.bedroom-boy')).display`), 'none');
  await screenshot('v3-5-dawn-bedroom');
  await waitFor(`document.querySelector('[data-settled]')?.dataset.settled === 'true'`, 6000);
  const endingDuration = Date.now() - endingStarted;
  assert(endingDuration >= 9500 && endingDuration < 11500, `Ending took ${endingDuration}ms`);
  await focus('.escape-credits summary'); await key('Enter');
  assert(await evaluate(`document.querySelector('.escape-credits').open`));
  await key('Tab');
  assert(!(await evaluate(`document.querySelector('.escape-credits').contains(document.activeElement)`)));
  await screenshot('03-escape-complete');
  await click('[data-testid="play-again-btn"]');
  assert(await evaluate(`!!document.querySelector('[data-phase="intro"]')`));

  // Mid-sequence Escape skips once; it must not also open Settings.
  await click('[data-testid="start-btn"]');
  await key('Enter');
  assert.equal(await evaluate(`document.querySelector('[data-shot]').dataset.shot`), 'too-late');
  await key('Escape');
  assert.deepEqual(await freshRoomSnapshot(), skippedSnapshot);
  assert(!(await modal()));
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', windowsVirtualKeyCode: 27, autoRepeat: true });
  assert(!(await modal()));
  await key('Escape'); assert(await modal());
  assert.equal(await evaluate(`document.querySelector('#brightness-slider').value`), '20');
  assert.equal(await evaluate(`document.querySelector('#volume-slider').value`), '20');
  assert.equal(await evaluate(`!!document.querySelector('#window-mode-select')`), false);
  assert.equal(await evaluate(`document.querySelector('[role="switch"]').getAttribute('aria-checked')`), 'true');
  assert.equal(await evaluate(`document.querySelector('#interact-key-select').value`), 'e');
  await click('[data-testid="hud-restart-btn"]');
  assert(!(await modal()));
  assert(await evaluate(`!!document.querySelector('[data-phase="intro"]')`));

  // Enter on Start must not skip via a held key. Reduced motion removes story movement.
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await key('Enter');
  assert.equal(await evaluate(`document.querySelector('[data-shot]').dataset.shot`), 'final-night');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', windowsVirtualKeyCode: 13, text: '\r', autoRepeat: true });
  assert.equal(await evaluate(`document.querySelector('[data-shot]').dataset.shot`), 'final-night');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.bedroom-rain')).animationName`), 'none');
  await click('.story-dialogue');
  assert.equal(await evaluate(`document.querySelector('[data-shot]').dataset.shot`), 'too-late');
  await click('[data-testid="advance-intro-btn"]');
  assert.equal(await evaluate(`document.querySelector('[data-shot]').dataset.shot`), 'the-pull');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.bedroom-fragments')).animationName`), 'none');
  await key('Enter');
  assert.equal(await evaluate(`document.querySelector('[data-shot]').dataset.shot`), 'new-body');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.opening-world .world-grid')).transform`), 'none');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.door-leaf')).animationName`), 'none');
  await key('Enter');
  assert.equal(await evaluate(`document.querySelector('[data-shot]').dataset.shot`), 'agency');
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
    assert.equal(await evaluate(`document.querySelector('#patch-brightness').value`), '20');
    assert.equal(await evaluate(`document.querySelector('#patch-volume').value`), '20');
    assert.equal(await evaluate(`document.querySelector('#patch-mute').getAttribute('aria-pressed')`), 'true');
    assert.equal(await evaluate(`document.querySelector('.patch-expansion').open`), false);
    await range('#patch-brightness', 70); await click('[data-testid="patch-return-btn"]');
    for (const k of ['d', 'd', 'd', 'w', 'w', 'e', 's', 'd', 'd', 's', 'd']) await key(k);
    await range('#patch-volume', 65); await click('#patch-mute');
    await click('[data-testid="patch-return-btn"]');
    for (const k of ['d', 'd', 'd', 'e', 'd', 'd', 'd', 'd']) await key(k);
    for (let i = 0; i < 4; i++) await key('d');
    await click('.patch-expansion summary'); await focus('#patch-key'); await key('k'); await key('Enter');
    await key('k'); assert.equal(await exit(), 'locked');
    await click('[data-testid="patch-return-btn"]');
    await key('e'); assert.equal(await exit(), 'locked');
    await key('k'); for (let i = 0; i < 3; i++) await key('d');
    assert.equal(await room(), 'frame');
    assert.equal(await exit(), 'locked');
    await focus('#patch-frame'); await key('b'); await key('Enter');
    assert.equal(await evaluate(`document.querySelector('[data-frame-state]').dataset.frameState`), 'borderless');
    await screenshot('v3-3-frame-deck-expanded');
    assert(await evaluate(`(() => {
      const w = document.querySelector('.world-grid').getBoundingClientRect();
      const covered = ['.patch-deck', '.patch-expanded-controls'].reduce((area, selector) => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return area + Math.max(0, Math.min(w.right, r.right) - Math.max(w.left, r.left)) * Math.max(0, Math.min(w.bottom, r.bottom) - Math.max(w.top, r.top));
      }, 0);
      return 1 - covered / (w.width * w.height) > 0.8;
    })()`));
    await click('.patch-expansion summary'); await click('[data-testid="patch-return-btn"]');
    assert(!(await modal()));
    if (await evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches`)) {
      assert(await evaluate(`parseFloat(getComputedStyle(document.querySelector('.frame-beam')).transitionDuration) <= 0.001`));
      assert(await evaluate(`parseFloat(getComputedStyle(document.querySelector('.frame-shutter')).transitionDuration) <= 0.001`));
    }
    for (const k of ['w', 'w', 'd', 'd', 's', 's', 'd']) await key(k);
    assert.equal(await position(), '4,3');
    await click('.patch-expansion summary'); await focus('#patch-frame'); await key('f'); await key('Enter');
    assert.equal(await evaluate(`document.querySelector('#patch-frame').value`), 'borderless');
    assert(await evaluate(`document.querySelector('#patch-frame-feedback').textContent.includes('Return to the entry side')`));
    await screenshot('v3-3-deck-frame-safe-rejection');
    await click('.patch-expansion summary'); await click('[data-testid="patch-return-btn"]');
    for (const k of ['d', 's', 's', 'd', 'd', 'w', 'w']) await key(k);
    assert.equal(await position(), '7,3');
    await click('.patch-expansion summary'); await focus('#patch-frame'); await key('f'); await key('Enter');
    assert.equal(await evaluate(`document.querySelector('#patch-frame').value`), 'borderless');
    assert(await evaluate(`document.querySelector('#patch-frame-feedback').textContent.includes('FRAME OCCUPIED')`));
    await assertAperture(false);
    await screenshot('v3-4-exit-side-safe-rejection');
    await click('.patch-expansion summary'); await click('[data-testid="patch-return-btn"]');
    await key('d');
    await completeCrossTalk();
    assert.equal(await room(), 'finale');
    for (let i = 0; i < 7; i++) await key('d');
  };
  // Second and third escapes cover the instant reduced-motion ending and normal-motion skip.
  await escapeFreshRun();
  assert.equal(await evaluate(`document.querySelector('[data-settled]')?.dataset.settled`), 'true');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.escape-operator')).animationName`), 'none');
  assert(await evaluate(`document.querySelector('.escape-screen .story-dialogue').textContent.includes('Look again.')`));
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.equal(await evaluate(`document.documentElement.scrollWidth`), 390);
  await screenshot('v3-5-mobile-static-ending');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
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
  await screenshot('v3-2-mobile-title');
  assert.equal(await evaluate(`document.documentElement.scrollWidth`), 390);
  await click('[data-testid="start-btn"]');
  await screenshot('04-mobile-opening');
  await key('Escape');
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
  console.log(`PASS: bedroom title/help, all five story beats completed in ${openingDuration}ms; first-frame skip, mid-sequence Escape, click/Enter advancement, held-key isolation and reduced-motion still frames.`);
  console.log('PASS: cold start → three original puzzles → The Frame → Cross-Talk → live-setting finale → escape scene → reset title; three complete escapes, non-blocking chamber notes, menu restart and boot return.');
  console.log('PASS: OP-01 artwork, world geometry beneath spatial darkness, glyph threshold/reveal, proximity, opening door leaves, muted/low/high/stable resonator, terminal authorization and reduced-motion art.');
  console.log('PASS: The Frame room-sized shutter conceals the inaccessible half and retracts in 280ms; same-position camera/light comparison, collision alignment, safe rejection on passage/beyond/near exit, entry-side restoration, instant reduced motion, no browser resizing/fullscreen and exactly three finale locks.');
  console.log('PASS: Cross-Talk requires lens before relay, 69/70 reveal, latched optical carrier, stable unmuted relay, separate proximity/focus isolation, powered exit, reduced-motion cable and 390px room.');
  console.log('PASS: player-centered spatial darkness, same-position 20/80 reveal, edge/movement synchronization, readable player and pointer-transparent lighting.');
  console.log(`PASS: Patch Deck leaves ${(unobscuredRoom * 100).toFixed(1)}% of room unobscured; native Tab, focus isolation, brightness/movement round trip, shared menu state and two complete deck-only settings playthroughs.`);
  console.log(`PASS: dismissible manual hints in all six rooms, movement while reading and native focus/Tab; ordered 0 → Look again → 1 → dawn ending in ${endingDuration}ms, credits, reduced-motion recap, skip and replay.`);
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
