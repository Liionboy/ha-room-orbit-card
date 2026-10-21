import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../ha-room-orbit-card.js', import.meta.url), 'utf8');
const registry = new Map();
class Element {
 attachShadow() { this.shadowRoot = { innerHTML: '', listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; } }; }
 dispatchEvent(event) { this.event = event; }
}
const context = vm.createContext({ HTMLElement: Element, customElements: { get: (n) => registry.get(n), define: (n, c) => registry.set(n, c) }, window: {}, console: { info() {} }, Intl, CustomEvent: class { constructor(type, options) { this.type = type; Object.assign(this, options); } } });
vm.runInContext(source, context);
const Card = registry.get('ha-room-orbit-card');
const state = (value, attributes = {}) => ({ state: value, attributes });
function setup(config = {}) {
 const card = new Card(); const calls = [];
 card.setConfig({ temperature_entity: 'sensor.temperature', humidity_entity: 'sensor.humidity', presence_entity: 'binary_sensor.presence', entity_1: 'light.room', entity_2: 'cover.room', ...config });
 card.hass = { language: 'en', states: {
  'sensor.temperature': state('22.4', { unit_of_measurement: '°C' }), 'sensor.humidity': state('48', { unit_of_measurement: '%' }),
  'binary_sensor.presence': state('on'), 'light.room': state('off', { friendly_name: 'Room light' }),
  'cover.room': state('open', { supported_features: 11, current_position: 65, friendly_name: 'Room blind' }),
  'switch.room': state('on'), 'input_boolean.room': state('off'),
 }, services: { light: { toggle: {} }, switch: { toggle: {} }, input_boolean: { toggle: {} }, cover: { open_cover: {}, close_cover: {}, stop_cover: {} } }, callService: async (...args) => calls.push(args) };
 return { card, calls };
}
test('selected telemetry, occupancy and cover position', () => {
 const { card } = setup(); const html = card.shadowRoot.innerHTML;
 for (const text of ['22.4 °C', '48 %', 'Occupied', '65% open', 'Room light']) assert.ok(html.includes(text));
 assert.equal((html.match(/class="action"/g) || []).length, 4);
});
test('empty configuration has editor hints', () => {
 const card = new Card(); card.setConfig({}); card.hass = { states: {} }; assert.match(card.shadowRoot.innerHTML, /Add up to four shortcuts/);
});
test('editor exposes four shortcut entity selectors and read-only mode', () => {
 const schema = Card.getConfigForm().schema;
 assert.equal(schema.filter((s) => /^entity_[1-4]$/.test(s.name)).length, 4);
 assert.ok(schema.some((s) => s.name === 'read_only'));
 assert.equal(Card.getConfigForm().computeLabel({ name: 'entity_2' }), 'Shortcut 2 · entity');
});
test('unrelated updates preserve DOM and delegated control click', async () => {
 const { card, calls } = setup(); let renders = 0;
 const render = card._render.bind(card); card._render = () => { renders++; render(); };
 card.hass = { ...card.hass, states: { ...card.hass.states, 'sensor.unrelated': state('99') } }; assert.equal(renders, 0);
 const button = { dataset: { entity: 'light.room', action: 'toggle' }, disabled: false };
 card.shadowRoot.listeners.click({ composedPath: () => [{}, button, card.shadowRoot] }); await new Promise((r) => setImmediate(r));
 assert.equal(JSON.stringify(calls), JSON.stringify([['light', 'toggle', { entity_id: 'light.room' }]]));
});
test('cover actions follow supported feature flags', async () => {
 const { card, calls } = setup(); card.hass.states['cover.room'].attributes.supported_features = 1; card._update();
 assert.equal(card._actions('cover.room').map((a) => a.action).join(','), 'open_cover');
 await card._activate('cover.room', 'stop_cover'); assert.equal(calls.length, 0);
 await card._activate('cover.room', 'open_cover'); assert.equal(calls[0][1], 'open_cover');
});
test('unavailable entities cannot dispatch', async () => {
 const { card, calls } = setup(); card.hass.states['light.room'].state = 'unavailable'; card._update();
 assert.equal(card._actions('light.room').length, 0); await card._activate('light.room', 'toggle'); assert.equal(calls.length, 0);
});
test('read-only blocks services while preserving More Info', async () => {
 const { card, calls } = setup({ read_only: true }); assert.doesNotMatch(card.shadowRoot.innerHTML, /class="action"/);
 await card._activate('light.room', 'toggle'); await card._activate('sensor.temperature', 'info'); assert.equal(calls.length, 0);
 assert.equal(card.event.type, 'hass-more-info'); assert.equal(card.event.detail.entityId, 'sensor.temperature'); assert.equal(card.event.composed, true);
});
test('missing service registry disables controls', async () => {
 const { card, calls } = setup(); card.hass = { ...card.hass, services: {} };
 assert.equal(card._actions('light.room').length, 0); await card._activate('light.room', 'toggle'); assert.equal(calls.length, 0);
});
test('unconfigured targets and arbitrary actions are rejected', async () => {
 const { card, calls } = setup(); await card._activate('switch.room', 'toggle'); await card._activate('light.room', 'turn_off'); assert.equal(calls.length, 0);
});
test('busy guard prevents duplicates; failures clear busy and show generic error', async () => {
 const { card } = setup(); let release; let count = 0;
 card.hass.callService = () => { count++; return new Promise((r) => { release = r; }); };
 const first = card._activate('light.room', 'toggle'); await card._activate('light.room', 'toggle'); assert.equal(count, 1); release(); await first;
 card.hass.callService = async () => { throw new Error('private connection details'); };
 await card._activate('light.room', 'toggle'); assert.equal(card._busy.size, 0); assert.match(card.shadowRoot.innerHTML, /role="alert"/); assert.doesNotMatch(card.shadowRoot.innerHTML, /private connection/);
});
test('hostile titles, labels, units and attributes are escaped', () => {
 const { card } = setup({ title: '<img src=x onerror=alert(1)>', icon: 'x" onclick="alert(1)', name_1: '<script>alert(1)</script>' });
 card.hass.states['sensor.temperature'].attributes.unit_of_measurement = '<svg onload=alert(1)>'; card._update();
 const html = card.shadowRoot.innerHTML;
 assert.doesNotMatch(html, /<img|<script|<svg|icon="x" onclick=/); assert.match(html, /&lt;img/); assert.match(html, /&lt;svg/);
});
test('unknown occupancy is not clear', () => {
 const { card } = setup(); delete card.hass.states['binary_sensor.presence']; card._update(); assert.match(card.shadowRoot.innerHTML, /Presence unknown/);
 card.hass.states['binary_sensor.presence'] = state('unavailable'); card._update(); assert.match(card.shadowRoot.innerHTML, /Presence unknown/);
});
test('switch and helper use their respective toggle domains', async () => {
 const { card, calls } = setup({ entity_3: 'switch.room', entity_4: 'input_boolean.room' });
 await card._activate('switch.room', 'toggle'); await card._activate('input_boolean.room', 'toggle'); assert.equal(calls.map((c) => c[0]).join(','), 'switch,input_boolean');
});
test('informational sensors and configuration validation', () => {
 const { card } = setup({ entity_1: 'sensor.temperature', palette: 'invalid' });
 assert.equal(card._actions('sensor.temperature').length, 0); assert.equal(card._config.palette, 'aurora');
 for (const config of [null, [], { entity_1: 'lock.door' }, { entity_1: {} }, { presence_entity: 'sensor.temp' }]) assert.throws(() => card.setConfig(config));
});
test('manifest, version and registration agree', () => {
 const manifest = JSON.parse(readFileSync(new URL('../hacs.json', import.meta.url)));
 const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
 assert.equal(manifest.filename, pkg.name + '.js'); assert.ok(source.includes("const VERSION = '" + pkg.version + "'"));
 assert.equal(context.window.customCards[0].type, 'ha-room-orbit-card');
});
