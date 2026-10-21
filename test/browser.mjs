// Optional synthetic browser suite; no live HA or device calls.
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}) });
const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
try {
 await page.route('http://room-orbit.test/**', (route) => route.fulfill({ contentType: 'text/html', body: '<html></html>' }));
 await page.goto('http://room-orbit.test/dashboard-home/rooms');
 await page.setContent('<style>body{font:14px Arial;margin:8px;background:#f4f6f8}#grid{display:grid;gap:8px;grid-template-columns:1fr;width:440px}#container{min-width:0}body.dark{background:#111820;--card-background-color:#1b2532;--primary-text-color:#e8eef5;--secondary-text-color:#a0b0c2;--divider-color:#344252}</style><div id="grid"><div id="container"></div></div>');
 await page.evaluate(() => {
  customElements.define('ha-card', class extends HTMLElement {});
  customElements.define('ha-icon', class extends HTMLElement { connectedCallback() { this.style.display = 'inline-flex'; this.style.alignItems = 'center'; this.style.justifyContent = 'center'; this.style.width = 'var(--mdc-icon-size,24px)'; this.style.height = 'var(--mdc-icon-size,24px)'; this.style.flexShrink = '0'; this.innerHTML = '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M12 3L3 12l9 9 9-9zM12 6l6 6-6 6-6-6z"/></svg>'; } });
 });
 await page.addScriptTag({ content: readFileSync(new URL('../ha-room-orbit-card.js', import.meta.url), 'utf8') });
 await page.evaluate(() => {
  const card = document.createElement('ha-room-orbit-card'); window.card = card; window.calls = []; window.infos = [];
  card.setConfig({ title: 'Living room', navigation_path: '/dashboard-home/living-room', temperature_entity: 'sensor.temperature', humidity_entity: 'sensor.humidity', presence_entity: 'binary_sensor.occupancy', entity_1: 'light.room', entity_2: 'cover.room', entity_3: 'switch.room', entity_4: 'binary_sensor.window' });
  const s = (state, attributes = {}) => ({ state, attributes });
  window.mockHass = { language: 'en', services: { light: { toggle: {} }, cover: { open_cover: {}, stop_cover: {}, close_cover: {} }, switch: { toggle: {} } }, states: {
   'sensor.temperature': s('24.7', { unit_of_measurement: '°C' }), 'sensor.humidity': s('65.1', { unit_of_measurement: '%' }), 'binary_sensor.occupancy': s('off'),
   'light.room': s('off', { friendly_name: 'Ceiling light' }), 'cover.room': s('open', { friendly_name: 'Window blind', supported_features: 11, current_position: 65 }),
   'switch.room': s('on', { friendly_name: 'Desk socket' }), 'binary_sensor.window': s('off', { friendly_name: 'Window' }),
  }, callService: async (...args) => window.calls.push(args) };
  card.hass = window.mockHass; card.addEventListener('hass-more-info', (e) => window.infos.push(e.detail)); document.querySelector('#container').append(card);
 });
 const output = process.env.SCREENSHOT_DIR;
 if (output) mkdirSync(output, { recursive: true });
 const measure = async (label, width) => {
  const bounds = await page.evaluate(() => {
   const root = window.card.shadowRoot, box = window.card.getBoundingClientRect();
   return { width: box.width, height: box.height, maxRight: Math.max(...[...root.querySelectorAll('button,.summary,.identity,.shortcuts')].map((el) => el.getBoundingClientRect().right - box.left)), readings: [...root.querySelectorAll('.reading-value')].map((el) => ({ text: el.textContent, height: el.getBoundingClientRect().height, scroll: el.scrollWidth, client: el.clientWidth })) };
  });
  assert.ok(bounds.maxRight <= bounds.width + 1, JSON.stringify(bounds));
  assert.ok(bounds.height <= 130, 'Card too tall: ' + JSON.stringify(bounds));
  for (const value of bounds.readings) { assert.ok(value.height <= 18, JSON.stringify(value)); assert.ok(value.scroll <= value.client + 1, JSON.stringify(value)); }
  assert.equal(bounds.readings[0].text, '24.7 °C'); assert.equal(bounds.readings[1].text, '65.1 %');
  console.log(label + ' PASS: ' + JSON.stringify(bounds));
  if (output) await page.locator('#grid').screenshot({ path: output + '/compact-' + label + '.png' });
 };
 for (const width of [440, 320, 280, 243, 200, 164]) {
  await page.evaluate((w) => { document.querySelector('#grid').style.width = w + 'px'; }, width);
  await measure(String(width), width);
 }
 for (const phone of [360, 390]) {
  await page.setViewportSize({ width: phone, height: 800 });
  await page.evaluate(() => { const grid = document.querySelector('#grid'); grid.style.width = '100%'; grid.style.gridTemplateColumns = 'repeat(2,minmax(0,1fr))'; });
  await measure('phone-' + phone);
 }
 await page.setViewportSize({ width: 1000, height: 900 });
 await page.evaluate(() => { const grid = document.querySelector('#grid'); grid.style.width = '243px'; grid.style.gridTemplateColumns = '1fr'; });
 const stable = await page.evaluate(() => {
  const before = window.card.shadowRoot.querySelector('[data-action="toggle"]');
  window.card.hass = { ...window.mockHass, states: { ...window.mockHass.states, 'sensor.unrelated': { state: '1' } } };
  return before === window.card.shadowRoot.querySelector('[data-action="toggle"]');
 }); assert.equal(stable, true);
 await page.locator('ha-room-orbit-card button.quick[data-entity="light.room"]').click();
 await page.locator('ha-room-orbit-card button.quick[data-entity="cover.room"]').click();
 assert.equal(await page.locator('ha-room-orbit-card .tile').count(), 1);
 await page.locator('ha-room-orbit-card button[data-action="stop_cover"]').click();
 await page.locator('ha-room-orbit-card button[data-entity="sensor.temperature"]').click();
 await page.locator('ha-room-orbit-card .room-icon').click();
 await measure('collapsed-after-details');
 await page.locator('ha-room-orbit-card .room-icon').click();
 assert.equal(await page.locator('ha-room-orbit-card .tile').count(), 4);
 await page.locator('ha-room-orbit-card .tile-head[data-entity="light.room"]').click();
 await page.locator('ha-room-orbit-card .room-icon').click();
 const dispatched = await page.evaluate(() => ({ calls: window.calls, infos: window.infos }));
 assert.deepEqual(dispatched.calls, [['light', 'toggle', { entity_id: 'light.room' }], ['cover', 'stop_cover', { entity_id: 'cover.room' }]]);
 assert.deepEqual(dispatched.infos, [{ entityId: 'sensor.temperature' }, { entityId: 'light.room' }]);
 await page.evaluate(() => { document.body.classList.add('dark'); }); await page.emulateMedia({ reducedMotion: 'reduce' });
 await measure('dark');
 await page.evaluate(() => { window.card.setConfig({ ...window.card._config, read_only: true }); });
 assert.equal(await page.locator('ha-room-orbit-card .quick[data-action="toggle"]').count(), 0);
 // Read-only still permits routing. Shortcut and details clicks above must not navigate.
 assert.equal(new URL(page.url()).pathname, '/dashboard-home/rooms');
 await page.evaluate(() => { window.routes = []; window.addEventListener('location-changed', (e) => window.routes.push(e.detail)); });
 await page.locator('ha-room-orbit-card .room-navigation').click({ position: { x: 100, y: 20 } });
 assert.equal(new URL(page.url()).pathname, '/dashboard-home/living-room');
 assert.equal(await page.evaluate(() => window.routes.length), 1);
 assert.deepEqual(await page.evaluate(() => window.history.state), { from: '/dashboard-home/rooms' });
 await page.evaluate(() => { window.history.replaceState({}, '', '/dashboard-home/rooms'); });
 await page.locator('ha-room-orbit-card .room-navigation').focus(); await page.keyboard.press('Enter');
 assert.equal(new URL(page.url()).pathname, '/dashboard-home/living-room');
 assert.equal(await page.evaluate(() => window.routes.length), 2);
 console.log('Background tap and keyboard navigation, local URL and HA routing event: PASS');
 assert.deepEqual(errors, []); console.log('Quick actions, cover details, More Info, dark theme and read-only: PASS');
} finally { await browser.close(); }
