// Optional: PLAYWRIGHT_MODULE=/absolute/path/to/playwright-core/index.mjs node test/browser.mjs
// Uses synthetic HA data and component stubs, never a live HA instance.
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}) });
const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
try {
 await page.setContent('<style>body{font:14px Arial;margin:20px;background:#f4f6f8}#container{width:440px}body.dark{background:#111820;--card-background-color:#1b2532;--primary-text-color:#e8eef5;--secondary-text-color:#a0b0c2;--divider-color:#344252}</style><div id="container"></div>');
 await page.evaluate(() => {
  customElements.define('ha-card', class extends HTMLElement {});
  customElements.define('ha-icon', class extends HTMLElement { connectedCallback() { this.style.display = 'inline-flex'; this.style.alignItems = 'center'; this.style.justifyContent = 'center'; this.style.width = 'var(--mdc-icon-size,24px)'; this.style.height = 'var(--mdc-icon-size,24px)'; this.textContent = '◇'; } });
 });
 await page.addScriptTag({ content: readFileSync(new URL('../ha-room-orbit-card.js', import.meta.url), 'utf8') });
 await page.evaluate(() => {
  const card = document.createElement('ha-room-orbit-card'); window.card = card; window.calls = []; window.infos = [];
  card.setConfig({ title: 'Living room', temperature_entity: 'sensor.temperature', humidity_entity: 'sensor.humidity', presence_entity: 'binary_sensor.occupancy', entity_1: 'light.room', entity_2: 'cover.room', entity_3: 'switch.room', entity_4: 'binary_sensor.window' });
  const s = (state, attributes = {}) => ({ state, attributes });
  window.mockHass = { language: 'en', services: { light: { toggle: {} }, cover: { open_cover: {}, stop_cover: {}, close_cover: {} }, switch: { toggle: {} } }, states: {
   'sensor.temperature': s('22.4', { unit_of_measurement: '°C' }), 'sensor.humidity': s('48', { unit_of_measurement: '%' }), 'binary_sensor.occupancy': s('on'),
   'light.room': s('on', { friendly_name: 'Ceiling light' }), 'cover.room': s('open', { friendly_name: 'Window blind', supported_features: 11, current_position: 65 }),
   'switch.room': s('off', { friendly_name: 'Desk socket' }), 'binary_sensor.window': s('off', { friendly_name: 'Window' }),
  }, callService: async (...args) => window.calls.push(args) };
  card.hass = window.mockHass; card.addEventListener('hass-more-info', (e) => window.infos.push(e.detail)); document.querySelector('#container').append(card);
 });
 const output = process.env.SCREENSHOT_DIR;
 if (output) mkdirSync(output, { recursive: true });
 for (const width of [440, 320, 280, 200]) {
  await page.evaluate((w) => { document.querySelector('#container').style.width = w + 'px'; }, width);
  const bounds = await page.evaluate(() => {
   const root = window.card.shadowRoot; const box = window.card.getBoundingClientRect();
   return { card: box.width, maxRight: Math.max(...[...root.querySelectorAll('button,.tile,.reading,.header,.overview,.telemetry')].map((el) => el.getBoundingClientRect().right - box.left)), columns: getComputedStyle(root.querySelector('.tiles')).gridTemplateColumns };
  });
  assert.ok(bounds.maxRight <= width + 1, JSON.stringify({ width, bounds }));
  console.log('Browser layout PASS ' + width + 'px: ' + bounds.columns);
  if (output && [440, 280].includes(width)) await page.locator('#container').screenshot({ path: output + '/room-' + width + '.png' });
 }
 await page.evaluate(() => { document.querySelector('#container').style.width = '320px'; });
 const stable = await page.evaluate(() => {
  const before = window.card.shadowRoot.querySelector('[data-action="toggle"]');
  window.card.hass = { ...window.mockHass, states: { ...window.mockHass.states, 'sensor.unrelated': { state: '1' } } };
  return before === window.card.shadowRoot.querySelector('[data-action="toggle"]');
 }); assert.equal(stable, true);
 await page.locator('ha-room-orbit-card button[data-entity="light.room"][data-action="toggle"]').click();
 await page.locator('ha-room-orbit-card button[data-action="stop_cover"]').click();
 await page.locator('ha-room-orbit-card button[data-entity="sensor.temperature"]').click();
 const dispatched = await page.evaluate(() => ({ calls: window.calls, infos: window.infos }));
 assert.deepEqual(dispatched.calls, [['light', 'toggle', { entity_id: 'light.room' }], ['cover', 'stop_cover', { entity_id: 'cover.room' }]]);
 assert.deepEqual(dispatched.infos, [{ entityId: 'sensor.temperature' }]);
 await page.evaluate(() => { document.body.classList.add('dark'); });
 await page.emulateMedia({ reducedMotion: 'reduce' });
 assert.equal(await page.evaluate(() => getComputedStyle(window.card.shadowRoot.querySelector('.action')).transitionDuration), '0s');
 if (output) await page.locator('#container').screenshot({ path: output + '/room-dark.png' });
 await page.evaluate(() => { window.card.setConfig({ ...window.card._config, read_only: true }); });
 assert.equal(await page.locator('ha-room-orbit-card .action').count(), 0);
 assert.deepEqual(errors, []); console.log('Browser interactions, More Info, dark theme, reduced-motion and read-only: PASS');
} finally { await browser.close(); }
