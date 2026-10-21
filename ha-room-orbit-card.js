const TYPE = 'ha-room-orbit-card';
const VERSION = '1.0.0';
const PALETTES = ['aurora', 'ocean', 'sunset', 'lavender'];
const DOMAINS = ['light', 'switch', 'input_boolean', 'cover', 'sensor', 'binary_sensor'];
const DEFAULTS = { title: 'Room Orbit', icon: 'mdi:sofa', palette: 'aurora', read_only: false };
const FIELDS = ['temperature_entity', 'humidity_entity', 'presence_entity', 'entity_1', 'entity_2', 'entity_3', 'entity_4'];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const available = (s) => !!s && !['unknown', 'unavailable', 'none', ''].includes(String(s.state).toLowerCase());
const domain = (id) => String(id || '').split('.')[0];
const icon = (name) => '<ha-icon icon="' + esc(name) + '"></ha-icon>';
const STYLE = [
 ':host{display:block;min-width:0;max-width:100%;color:var(--primary-text-color,#202b3c)}*{box-sizing:border-box}',
 'ha-card{display:block;container:room-orbit/inline-size;width:100%;min-width:0;max-width:100%;overflow:hidden;border:1px solid var(--divider-color,#dfe5eb);border-radius:24px;background:var(--ha-card-background,var(--card-background-color,#fff));box-shadow:var(--ha-card-box-shadow,0 12px 34px #14233716);--accent:#078f72;--accent2:#27b7b0;--accent3:#54a9db}',
 'ha-card[data-palette=ocean]{--accent:#1477c9;--accent2:#22a7c7;--accent3:#6b68d8}ha-card[data-palette=sunset]{--accent:#df5d42;--accent2:#ee973f;--accent3:#cf5d9e}ha-card[data-palette=lavender]{--accent:#8059c7;--accent2:#b56cc8;--accent3:#4c9bc7}',
 '.shell{position:relative;padding:20px;background:radial-gradient(ellipse at 0 0,color-mix(in srgb,var(--accent) 13%,transparent),transparent 65%)}.shell:before{content:"";position:absolute;top:0;left:22px;right:22px;height:3px;background:linear-gradient(90deg,var(--accent),var(--accent2),var(--accent3));border-radius:0 0 6px 6px}',
 '.header{display:flex;align-items:center;justify-content:space-between;gap:10px}.identity{min-width:0}.eyebrow{font-size:9px;font-weight:800;letter-spacing:.15em;color:var(--accent)}h2{margin:5px 0 0;font-size:22px;letter-spacing:-.035em;overflow-wrap:anywhere}.pill{display:flex;align-items:center;gap:7px;flex:none;border-radius:99px;padding:7px 10px;background:color-mix(in srgb,var(--accent) 9%,transparent);font-size:11px;color:var(--secondary-text-color,#637080)}.pill.active{color:var(--accent)}.dot{width:7px;height:7px;border-radius:50%;background:currentColor}',
 '.overview{display:grid;grid-template-columns:114px minmax(0,1fr);align-items:center;gap:18px;margin:20px 0}.orbit{position:relative;display:grid;place-items:center;width:110px;aspect-ratio:1;border:1px solid color-mix(in srgb,var(--accent) 22%,transparent);border-radius:50%;background:conic-gradient(from 35deg,color-mix(in srgb,var(--accent) 24%,transparent),transparent 45%,color-mix(in srgb,var(--accent2) 24%,transparent));color:var(--accent)}.orbit:before{content:"";position:absolute;inset:9px;border:1px dashed color-mix(in srgb,var(--accent) 34%,transparent);border-radius:50%}.orbit-core{display:grid;place-items:center;width:72px;height:72px;border-radius:50%;background:var(--card-background-color,#fff);box-shadow:0 6px 24px color-mix(in srgb,var(--accent) 13%,transparent)}.orbit ha-icon{--mdc-icon-size:38px}.orbit.active:after{content:"";position:absolute;right:3px;top:23px;width:9px;height:9px;border-radius:50%;background:var(--accent2);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent2) 15%,transparent)}',
 '.telemetry{min-width:0;display:grid;gap:8px}.reading{display:flex;align-items:center;gap:9px;min-width:0;padding:9px 11px;border:1px solid color-mix(in srgb,var(--divider-color,#dfe5eb) 75%,transparent);border-radius:13px;background:color-mix(in srgb,var(--card-background-color,#fff) 92%,var(--accent))}.reading ha-icon{color:var(--accent);--mdc-icon-size:20px}.reading-label{font-size:10px;color:var(--secondary-text-color,#637080)}.reading-value{margin-left:auto;min-width:0;font-size:20px;font-weight:800;letter-spacing:-.035em;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}',
 'button{font:inherit;cursor:pointer;color:inherit}button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}button:disabled{cursor:not-allowed;opacity:.45}.info{width:100%;text-align:left}.tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.tile{min-width:0;padding:12px;border:1px solid var(--divider-color,#dfe5eb);border-radius:16px;background:color-mix(in srgb,var(--card-background-color,#fff) 96%,var(--accent))}.tile.active{border-color:color-mix(in srgb,var(--accent) 42%,var(--divider-color,#dfe5eb));background:color-mix(in srgb,var(--card-background-color,#fff) 90%,var(--accent))}.tile-head{display:flex;align-items:center;gap:8px;border:0;background:none;padding:0;text-align:left;width:100%;min-width:0}.tile-head ha-icon{flex:none;--mdc-icon-size:22px;color:var(--accent)}.tile-copy{min-width:0}.tile-name{display:block;font-size:12px;font-weight:750;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tile-state{display:block;font-size:11px;margin-top:4px;color:var(--secondary-text-color,#637080);overflow-wrap:anywhere}',
 '.actions{display:flex;gap:5px;margin-top:10px}.action{display:grid;place-items:center;flex:1;min-width:0;min-height:38px;padding:6px;border:1px solid color-mix(in srgb,var(--accent) 20%,var(--divider-color,#dfe5eb));border-radius:11px;background:color-mix(in srgb,var(--accent) 8%,var(--card-background-color,#fff));color:var(--accent);transition:background .15s ease}.action ha-icon{--mdc-icon-size:20px}.action:hover:not(:disabled){background:color-mix(in srgb,var(--accent) 17%,var(--card-background-color,#fff))}',
 '.footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;font-size:10px;color:var(--secondary-text-color,#637080)}.hint{font-size:12px;line-height:1.6;color:var(--secondary-text-color,#637080)}.error{margin-top:12px;font-size:12px;color:var(--error-color,#c74343)}',
 '@container room-orbit (max-width:330px){.shell{padding:14px}.overview{grid-template-columns:80px minmax(0,1fr);gap:10px}.orbit{width:78px}.orbit-core{width:54px;height:54px}.orbit ha-icon{--mdc-icon-size:29px}.reading{padding:8px;gap:5px}.reading-label{font-size:9px}.reading-value{font-size:17px}.pill{font-size:10px;padding:6px 8px}h2{font-size:19px}.tiles{gap:7px}.tile{padding:10px}.footer{flex-wrap:wrap}}@container room-orbit (max-width:230px){.tiles{grid-template-columns:1fr}.overview{grid-template-columns:1fr}.orbit{justify-self:center}.header{align-items:flex-start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.action{transition:none}}',
].join('\n');

class RoomOrbitCard extends HTMLElement {
 static getStubConfig() { return { ...DEFAULTS }; }
 static getConfigForm() {
  const schema = [
   { name: 'title', selector: { text: {} } }, { name: 'icon', selector: { icon: {} } },
   { name: 'palette', selector: { select: { options: PALETTES, mode: 'dropdown' } } },
   { name: 'read_only', selector: { boolean: {} } },
   { name: 'temperature_entity', selector: { entity: { domain: 'sensor' } } },
   { name: 'humidity_entity', selector: { entity: { domain: 'sensor' } } },
   { name: 'presence_entity', selector: { entity: { domain: 'binary_sensor' } } },
  ];
  for (let i = 1; i <= 4; i++) schema.push(
   { name: 'entity_' + i, selector: { entity: { domain: DOMAINS } } },
   { name: 'name_' + i, selector: { text: {} } },
   { name: 'icon_' + i, selector: { icon: {} } },
  );
  const labels = { title: 'Room name', icon: 'Room icon', palette: 'Orbit palette', read_only: 'Read-only mode', temperature_entity: 'Temperature sensor', humidity_entity: 'Humidity sensor', presence_entity: 'Occupancy / motion sensor' };
  return { schema, computeLabel: ({ name }) => labels[name] || name.replace(/^(entity|name|icon)_(\d)$/, (_, field, i) => 'Shortcut ' + i + ' · ' + field) };
 }
 constructor() {
  super(); this.attachShadow({ mode: 'open' }); this._config = { ...DEFAULTS };
  this._busy = new Set(); this._error = ''; this._signature = '';
  this.shadowRoot.addEventListener('click', (event) => {
   const button = event.composedPath().find((el) => el?.dataset?.action);
   if (button && !button.disabled) void this._activate(button.dataset.entity, button.dataset.action);
  });
 }
 setConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Room Orbit requires an object configuration.');
  for (const key of FIELDS) if (config[key] && (typeof config[key] !== 'string' || !/^[a-z_]+\.[a-z0-9_]+$/.test(config[key]))) throw new Error(key + ' must be an entity ID.');
  for (let i = 1; i <= 4; i++) if (config['entity_' + i] && !DOMAINS.includes(domain(config['entity_' + i]))) throw new Error('Shortcut ' + i + ' has an unsupported entity domain.');
  for (const key of ['temperature_entity', 'humidity_entity']) if (config[key] && domain(config[key]) !== 'sensor') throw new Error(key + ' must be a sensor.');
  if (config.presence_entity && domain(config.presence_entity) !== 'binary_sensor') throw new Error('Presence must be a binary sensor.');
  this._config = { ...DEFAULTS, ...config, palette: PALETTES.includes(config.palette) ? config.palette : 'aurora', read_only: config.read_only === true };
  this._error = ''; this._signature = ''; this._update();
 }
 set hass(value) { this._hass = value; this._update(); }
 get hass() { return this._hass; }
 getCardSize() { return 5; }
 getGridOptions() { return { columns: 12, min_columns: 6 }; }
 _ids() { return [...new Set(FIELDS.map((key) => this._config[key]).filter(Boolean))]; }
 _state(id) { return this._hass?.states?.[id]; }
 _format(state) {
  if (!available(state)) return state ? 'Unavailable' : 'Not found';
  if (String(state.state).trim() !== '' && Number.isFinite(Number(state.state))) {
   let formatted; try { formatted = new Intl.NumberFormat(this._hass?.locale?.language || this._hass?.language || undefined, { maximumFractionDigits: 1 }).format(Number(state.state)); } catch { formatted = String(state.state); }
   return formatted + (state.attributes?.unit_of_measurement ? ' ' + state.attributes.unit_of_measurement : '');
  }
  try { return this._hass.formatEntityState?.(state) || String(state.state); } catch { return String(state.state); }
 }
 _actions(id) {
  const s = this._state(id), d = domain(id);
  if (this._config.read_only || !available(s)) return [];
  const has = (service) => !!this._hass?.services?.[d]?.[service];
  if (['light', 'switch', 'input_boolean'].includes(d)) return has('toggle') ? [{ action: 'toggle', icon: 'mdi:power', label: 'Toggle' }] : [];
  if (d !== 'cover') return [];
  const flags = Number(s.attributes?.supported_features) || 0;
  return [
   { action: 'open_cover', bit: 1, icon: 'mdi:chevron-up', label: 'Open' },
   { action: 'stop_cover', bit: 8, icon: 'mdi:stop', label: 'Stop' },
   { action: 'close_cover', bit: 2, icon: 'mdi:chevron-down', label: 'Close' },
  ].filter((a) => (flags & a.bit) && has(a.action));
 }
 _update() {
  if (!this._hass) return;
  const signature = JSON.stringify([this._config, this._hass.locale, this._hass.language, this._ids().map((id) => [id, this._state(id), this._actions(id)]), [...this._busy], this._error]);
  if (signature === this._signature) return;
  this._signature = signature; this._render();
 }
 _infoButton(id, content, className = '') { return '<button class="' + className + '" data-action="info" data-entity="' + esc(id) + '" aria-label="More information: ' + esc(this._state(id)?.attributes?.friendly_name || id) + '">' + content + '</button>'; }
 _render() {
  const c = this._config, presence = this._state(c.presence_entity);
  const occupied = available(presence) && presence.state === 'on';
  const status = !c.presence_entity ? 'Room overview' : !available(presence) ? 'Presence unknown' : occupied ? 'Occupied' : 'Clear';
  const readings = [['temperature_entity', 'Temperature', 'mdi:thermometer'], ['humidity_entity', 'Humidity', 'mdi:water-percent']].filter(([field]) => c[field]).map(([field, label, image]) => this._infoButton(c[field], icon(image) + '<span class="reading-label">' + label + '</span><span class="reading-value">' + esc(this._format(this._state(c[field]))) + '</span>', 'reading info')).join('');
  const shortcuts = [1, 2, 3, 4].filter((i) => c['entity_' + i]).map((i) => {
   const id = c['entity_' + i], s = this._state(id), d = domain(id);
   const image = c['icon_' + i] || s?.attributes?.icon || ({ light: 'mdi:lightbulb', cover: 'mdi:window-shutter', switch: 'mdi:power-socket-eu', input_boolean: 'mdi:toggle-switch', binary_sensor: 'mdi:motion-sensor' })[d] || 'mdi:chart-line';
   const active = available(s) && ['on', 'open', 'opening', 'closing'].includes(s.state);
   const name = c['name_' + i] || s?.attributes?.friendly_name || id;
   let state = this._format(s);
   const position = s?.attributes?.current_position;
   if (d === 'cover' && available(s) && typeof position === 'number' && Number.isFinite(position) && position >= 0 && position <= 100) state += ' · ' + position + '% open';
   const actions = this._actions(id);
   const buttons = actions.map((a) => '<button class="action" data-entity="' + esc(id) + '" data-action="' + a.action + '" aria-label="' + a.label + ': ' + esc(name) + '" title="' + a.label + '" ' + (this._busy.has(id) ? 'disabled aria-busy="true"' : '') + '>' + icon(a.icon) + '</button>').join('');
   return '<article class="tile ' + (active ? 'active' : '') + '">' + this._infoButton(id, icon(image) + '<span class="tile-copy"><span class="tile-name" title="' + esc(name) + '">' + esc(name) + '</span><span class="tile-state">' + esc(state) + '</span></span>', 'tile-head') + (buttons ? '<div class="actions">' + buttons + '</div>' : '') + '</article>';
  }).join('');
  const count = [1, 2, 3, 4].filter((i) => c['entity_' + i]).length;
  this.shadowRoot.innerHTML = '<style>' + STYLE + '</style><ha-card data-palette="' + c.palette + '"><div class="shell"><header class="header"><div class="identity"><div class="eyebrow">ROOM · ORBIT</div><h2>' + esc(c.title || DEFAULTS.title) + '</h2></div><span class="pill ' + (occupied ? 'active' : '') + '"><span class="dot"></span>' + status + '</span></header><section class="overview"><div class="orbit ' + (occupied ? 'active' : '') + '" aria-hidden="true"><div class="orbit-core">' + icon(c.icon || DEFAULTS.icon) + '</div></div><div class="telemetry">' + (readings || '<p class="hint">Choose room sensors and shortcuts in the card editor.</p>') + '</div></section>' + (shortcuts ? '<section class="tiles" aria-label="Room shortcuts">' + shortcuts + '</section>' : '<p class="hint">Add up to four shortcuts: lights, covers, switches, helpers or sensors.</p>') + (this._error ? '<div class="error" role="alert">' + esc(this._error) + '</div>' : '') + '<footer class="footer"><span>' + count + ' shortcut' + (count === 1 ? '' : 's') + '</span><span>' + (c.read_only ? 'Read-only' : 'Live Home Assistant data') + '</span></footer></div></ha-card>';
 }
 async _activate(id, action) {
  if (!this._ids().includes(id)) return;
  if (action === 'info') { this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true })); return; }
  if (this._busy.has(id) || !this._actions(id).some((a) => a.action === action)) return;
  this._busy.add(id); this._error = ''; this._update();
  try { await this._hass.callService(domain(id), action, { entity_id: id }); }
  catch { this._error = 'The action could not be sent. Check Home Assistant and try again.'; }
  finally { this._busy.delete(id); this._update(); }
 }
}
if (!customElements.get(TYPE)) customElements.define(TYPE, RoomOrbitCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === TYPE)) window.customCards.push({ type: TYPE, name: 'Room Orbit Card', description: 'Room sensors and capability-aware shortcuts in the Orbit style.', preview: true, documentationURL: 'https://github.com/Liionboy/ha-room-orbit-card' });
console.info('ROOM ORBIT ' + VERSION);
