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
 assert.equal((html.match(/class="quick /g) || []).length, 2);
 assert.doesNotMatch(html, /class="tiles"|<footer|class="overview"/);
 assert.equal(card.getCardSize(), 2);
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
test('details expand on demand without services and retain cover controls', async () => {
 const { card, calls } = setup();
 await card._activate('cover.room', 'expand'); assert.match(card.shadowRoot.innerHTML, /class="tiles"/);
 assert.equal((card.shadowRoot.innerHTML.match(/class="action"/g) || []).length, 3);
 assert.equal(calls.length, 0); await card._activate('cover.room', 'expand'); assert.doesNotMatch(card.shadowRoot.innerHTML, /class="tiles"/);
 await card._activate('', 'details'); assert.equal((card.shadowRoot.innerHTML.match(/class="action"/g) || []).length, 4);
 await card._activate('', 'details'); assert.equal(card.getCardSize(), 2);
});
test('room navigation pushes local path and emits HA routing event once', async () => {
 const { card, calls } = setup({ navigation_path: '/dashboard-home/living-room' });
 const pushed = [], events = [];
 context.window.location = { pathname: '/dashboard-home/rooms', search: '', hash: '' };
 context.window.history = { pushState: (...args) => pushed.push(args) };
 context.window.dispatchEvent = (event) => events.push(event);
 assert.match(card.shadowRoot.innerHTML, /href="\/dashboard-home\/living-room"/);
 await card._activate('', 'navigate'); assert.equal(pushed.length, 1); assert.equal(pushed[0][2], '/dashboard-home/living-room');
 assert.equal(pushed[0][0].from, '/dashboard-home/rooms'); assert.equal(events[0].type, 'location-changed'); assert.equal(events[0].detail.replace, false);
 await card._activate('light.room', 'toggle'); await card._activate('sensor.temperature', 'info');
 assert.equal(pushed.length, 1); assert.equal(calls.length, 1);
});
test('navigation is optional, read-only compatible and rejects external URLs', async () => {
 const { card } = setup(); assert.doesNotMatch(card.shadowRoot.innerHTML, /class="room-navigation"/);
 for (const path of ['https://example.com', '//example.com/x', '/' + String.fromCharCode(92) + 'evil', 'javascript:alert(1)', '/bad path', {}]) assert.throws(() => card.setConfig({ navigation_path: path }));
 const { card: readonly } = setup({ read_only: true, navigation_path: '/lovelace/living-room?mode=room#lights' });
 assert.match(readonly.shadowRoot.innerHTML, /class="room-navigation"/);
 let pushed = 0; context.window.history = { pushState: () => pushed++ };
 await readonly._activate('', 'navigate'); assert.equal(pushed, 1);
 context.window.location = { pathname: '/lovelace/living-room', search: '?mode=room', hash: '#lights' };
 await readonly._activate('', 'navigate'); assert.equal(pushed, 1);
});
test('delegated navigation respects modified native link clicks', () => {
 const { card } = setup({ navigation_path: '/lovelace/living-room' }); let prevented = 0, navigated = 0;
 card._navigate = () => navigated++;
 const target = { dataset: { action: 'navigate', entity: '' } };
 const event = { composedPath: () => [target], preventDefault: () => prevented++ };
 card.shadowRoot.listeners.click({ ...event, ctrlKey: true }); assert.equal(navigated, 0);
 card.shadowRoot.listeners.click(event); assert.equal(navigated, 1); assert.equal(prevented, 1);
});
test('thermostat shows Heating then Idle while HVAC mode remains heat', () => {
 const { card } = setup({ climate_entity: 'climate.room' });
 card.hass.states['climate.room'] = state('heat', { hvac_action: 'heating' }); card._update();
 assert.match(card.shadowRoot.innerHTML, /class="climate-status heating"/); assert.match(card.shadowRoot.innerHTML, />Heating</);
 card.hass.states['climate.room'].attributes.hvac_action = 'idle'; card._update();
 assert.match(card.shadowRoot.innerHTML, /class="climate-status idle"/); assert.match(card.shadowRoot.innerHTML, />Idle</);
 assert.equal(card.hass.states['climate.room'].state, 'heat');
});
test('missing or unrecognized action never implies Heating or Idle', () => {
 const { card } = setup({ climate_entity: 'climate.room' });
 card.hass.states['climate.room'] = state('heat'); card._update();
 assert.equal(card._climate('climate.room').label, 'Heat mode'); assert.equal(card._climate('climate.room').kind, 'unknown');
 card.hass.states['climate.room'].attributes.hvac_action = 'unexpected'; card._update();
 assert.equal(card._climate('climate.room').label, 'Action unknown');
});
test('thermostat handles off, cooling, unavailable and other native actions', () => {
 const { card } = setup({ climate_entity: 'climate.room' });
 for (const action of ['off', 'cooling', 'drying', 'fan', 'preheating', 'defrosting']) {
  card.hass.states['climate.room'] = state('auto', { hvac_action: action }); card._update(); assert.equal(card._climate('climate.room').kind, action);
 }
 card.hass.states['climate.room'] = state('unavailable', { hvac_action: 'heating' }); card._update();
 assert.equal(card._climate('climate.room').kind, 'unavailable');
 delete card.hass.states['climate.room']; card._update(); assert.equal(card._climate('climate.room').label, 'Unavailable');
});
test('thermostat badge opens More Info without services or navigation', async () => {
 const { card, calls } = setup({ climate_entity: 'climate.room', read_only: true, navigation_path: '/lovelace/room' });
 card.hass.states['climate.room'] = state('heat', { hvac_action: 'idle' }); card._update();
 await card._activate('climate.room', 'info'); assert.equal(card.event.detail.entityId, 'climate.room'); assert.equal(calls.length, 0);
 await card._activate('climate.room', 'toggle'); assert.equal(calls.length, 0);
});
test('climate can occupy a shortcut and never uses hvac_mode as active heating', () => {
 const { card } = setup({ entity_1: 'climate.room' });
 card.hass.states['climate.room'] = state('heat', { hvac_action: 'idle' }); card._update(); assert.match(card.shadowRoot.innerHTML, /Idle/);
 assert.equal(card._actions('climate.room').length, 0);
 card.hass.states['climate.room'].attributes.hvac_action = 'heating'; card._update(); assert.match(card.shadowRoot.innerHTML, /quick active climate-shortcut heating/);
 assert.match(card.shadowRoot.innerHTML, /class="quick-climate-label">Heating</);
 assert.throws(() => card.setConfig({ climate_entity: 'switch.room' }));
 assert.ok(Card.getConfigForm().schema.some((field) => field.name === 'climate_entity' && field.selector.entity.domain === 'climate'));
});
test('temperature colors are opt-in and preserve the chosen palette by default', () => {
 const { card } = setup({ palette: 'lavender' }); card.hass.states['sensor.temperature'].state = '30'; card._update();
 assert.equal(card._temperatureEffect(), 'normal'); assert.match(card.shadowRoot.innerHTML, /data-palette="lavender" data-temperature="normal"/);
});
test('default thresholds: below 22 cold, 22 to below 25 normal, 25+ warm', () => {
 const { card } = setup({ temperature_effect: true });
 for (const [value, expected] of [[21.9, 'cold'], [22, 'normal'], [24.9, 'normal'], [25, 'warm'], [25.1, 'warm']]) {
  card.hass.states['sensor.temperature'].state = String(value); card._update();
  assert.equal(card._temperatureEffect(), expected); assert.ok(card.shadowRoot.innerHTML.includes('data-temperature="' + expected + '"'));
 }
});
test('temperature thresholds are configurable and validate order and numbers', () => {
 const { card } = setup({ temperature_effect: true, temperature_cold_below: 20, temperature_warm_from: 26 });
 card.hass.states['sensor.temperature'].state = '25'; assert.equal(card._temperatureEffect(), 'normal');
 card.hass.states['sensor.temperature'].state = '19.9'; assert.equal(card._temperatureEffect(), 'cold');
 for (const config of [{ temperature_cold_below: 25, temperature_warm_from: 25 }, { temperature_cold_below: 26 }, { temperature_warm_from: Infinity }, { temperature_cold_below: '22' }, { temperature_warm_from: NaN }]) assert.throws(() => card.setConfig(config));
});
test('Fahrenheit and Kelvin are normalized without boundary drift', () => {
 const { card } = setup({ temperature_effect: true });
 for (const [value, unit, expected] of [[71.6, '°F', 'normal'], [77, '°F', 'warm'], [70, '°F', 'cold'], [298.15, 'K', 'warm'], [295.15, 'K', 'normal']]) {
  card.hass.states['sensor.temperature'] = state(String(value), { unit_of_measurement: unit }); card._update(); assert.equal(card._temperatureEffect(), expected);
 }
});
test('missing, invalid and unitless temperatures never activate color effects', () => {
 const { card } = setup({ temperature_effect: true });
 for (const s of [undefined, state('unavailable', { unit_of_measurement: '°C' }), state('unknown'), state(''), state('abc', { unit_of_measurement: '°C' }), state('30'), state('30', { unit_of_measurement: '%' })]) {
  card.hass.states['sensor.temperature'] = s; card._update(); assert.equal(card._temperatureEffect(), 'normal');
 }
});
test('temperature effect does not change HVAC activity and sends no commands', async () => {
 const { card, calls } = setup({ temperature_effect: true, climate_entity: 'climate.room', temperature_animation: false });
 card.hass.states['sensor.temperature'].state = '21'; card.hass.states['climate.room'] = state('heat', { hvac_action: 'heating' }); card._update();
 assert.equal(card._temperatureEffect(), 'cold'); assert.equal(card._climate('climate.room').label, 'Heating');
 assert.match(card.shadowRoot.innerHTML, /data-temperature-animation="false"/);
 card.hass.states['sensor.temperature'].state = '26'; card.hass.states['climate.room'].attributes.hvac_action = 'idle'; card._update();
 assert.equal(card._temperatureEffect(), 'warm'); assert.equal(card._climate('climate.room').label, 'Idle'); assert.equal(calls.length, 0);
});
test('temperature effect editor exposes booleans and Celsius thresholds', () => {
 const schema = Card.getConfigForm().schema;
 for (const name of ['temperature_effect', 'temperature_animation']) assert.ok(schema.find((f) => f.name === name).selector.boolean);
 for (const name of ['temperature_cold_below', 'temperature_warm_from']) assert.equal(schema.find((f) => f.name === name).selector.number.unit_of_measurement, '°C');
});
