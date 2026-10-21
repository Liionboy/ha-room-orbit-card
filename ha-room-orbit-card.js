const TYPE = 'ha-room-orbit-card';
const VERSION = '1.3.0';
const PALETTES = ['aurora', 'ocean', 'sunset', 'lavender'];
const DOMAINS = ['light', 'switch', 'input_boolean', 'cover', 'sensor', 'binary_sensor', 'climate'];
const DEFAULTS = { title: 'Room Orbit', icon: 'mdi:sofa', palette: 'aurora', read_only: false, navigation_path: '' };
const FIELDS = ['temperature_entity', 'humidity_entity', 'presence_entity', 'climate_entity', 'entity_1', 'entity_2', 'entity_3', 'entity_4'];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const available = (s) => !!s && !['unknown', 'unavailable', 'none', ''].includes(String(s.state).toLowerCase());
const domain = (id) => String(id || '').split('.')[0];
const icon = (name) => '<ha-icon icon="' + esc(name) + '"></ha-icon>';
const STYLE = [
 ':host{display:block;min-width:0;max-width:100%;color:var(--primary-text-color,#202b3c)}*{box-sizing:border-box}',
 'ha-card{display:block;container:room-orbit/inline-size;width:100%;min-width:0;max-width:100%;overflow:hidden;border:1px solid color-mix(in srgb,var(--divider-color,#dfe5eb) 65%,transparent);border-radius:20px;background:var(--ha-card-background,var(--card-background-color,#fff));box-shadow:var(--ha-card-box-shadow,0 2px 5px #14233716);--accent:#078f72;--accent2:#27b7b0;--accent3:#54a9db}',
 'ha-card[data-palette=ocean]{--accent:#1477c9;--accent2:#22a7c7;--accent3:#6b68d8}ha-card[data-palette=sunset]{--accent:#df5d42;--accent2:#ee973f;--accent3:#cf5d9e}ha-card[data-palette=lavender]{--accent:#8059c7;--accent2:#b56cc8;--accent3:#4c9bc7}',
 '.shell{position:relative;padding:12px;background:radial-gradient(ellipse at 0 0,color-mix(in srgb,var(--accent) 5%,transparent),transparent 80%)}.shell:before{content:"";position:absolute;top:0;left:20px;right:20px;height:2px;background:linear-gradient(90deg,var(--accent),var(--accent2),var(--accent3));border-radius:0 0 4px 4px}',
 'button{font:inherit;color:inherit;cursor:pointer}button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}button:disabled{cursor:not-allowed;opacity:.45}.summary{display:grid;grid-template-columns:minmax(0,1fr) 92px;align-items:center;gap:10px;min-height:92px}.summary.no-shortcuts{grid-template-columns:1fr}.identity{min-width:0}.room-icon{position:relative;display:grid;place-items:center;width:40px;height:40px;padding:0;border:0;border-radius:50%;background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent)}.room-icon ha-icon{--mdc-icon-size:23px}.dot{position:absolute;right:-1px;bottom:1px;width:9px;height:9px;border:2px solid var(--card-background-color,#fff);border-radius:50%;background:var(--secondary-text-color,#637080)}.room-icon.occupied .dot{background:var(--accent)}h2{margin:7px 0 2px;font-size:14px;font-weight:750;line-height:17px;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
 '.telemetry{display:flex;flex-wrap:wrap;column-gap:8px;row-gap:0;min-width:0}.reading{display:inline-flex;align-items:center;gap:3px;border:0;background:none;padding:0;min-width:0;max-width:100%;font-size:11px;line-height:16px;color:var(--secondary-text-color,#637080)}.reading ha-icon{flex:none;--mdc-icon-size:12px;color:var(--accent)}.reading-value{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;font-variant-numeric:tabular-nums}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}',
 '.shortcuts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;align-content:center}.shortcuts.count-1,.shortcuts.count-2{grid-template-columns:1fr}.quick{position:relative;display:grid;place-items:center;min-width:0;height:44px;padding:0;border:0;border-radius:13px;background:color-mix(in srgb,var(--secondary-text-color,#637080) 7%,var(--card-background-color,#fff));color:var(--secondary-text-color,#637080)}.quick ha-icon{--mdc-icon-size:21px}.quick.active{background:color-mix(in srgb,var(--accent) 15%,var(--card-background-color,#fff));color:var(--accent)}.quick .busy{position:absolute;inset:auto 0 2px;text-align:center;font-size:9px}.quick:hover:not(:disabled),.action:hover:not(:disabled){filter:brightness(.96)}',
 '.tiles{display:grid;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid var(--divider-color,#dfe5eb)}.tile{display:flex;align-items:center;gap:8px;min-width:0}.tile-head{display:flex;align-items:center;gap:7px;border:0;background:none;padding:4px 0;min-width:0;flex:1;text-align:left}.tile-head ha-icon{flex:none;color:var(--accent);--mdc-icon-size:19px}.tile-copy{min-width:0}.tile-name{display:block;font-size:11px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tile-state{display:block;margin-top:2px;font-size:10px;line-height:13px;color:var(--secondary-text-color,#637080);overflow-wrap:anywhere}.actions{display:flex;gap:3px;flex:none}.action{display:grid;place-items:center;width:32px;height:38px;padding:0;border:0;border-radius:10px;background:color-mix(in srgb,var(--accent) 10%,var(--card-background-color,#fff));color:var(--accent)}.action ha-icon{--mdc-icon-size:18px}.hint{margin:0;font-size:10px;line-height:15px;color:var(--secondary-text-color,#637080)}.error{margin-top:8px;font-size:11px;color:var(--error-color,#c74343)}',
 '@container room-orbit (max-width:220px){.shell{padding:10px}.summary{position:relative;grid-template-columns:minmax(0,1fr) 76px;gap:6px;padding-top:19px}.quick{height:40px;border-radius:11px}.shortcuts{gap:3px}.tile{flex-wrap:wrap}.actions{margin-left:auto}.room-icon{width:36px;height:36px}h2{position:absolute;top:0;left:0;right:0;margin:0;font-size:13px}.reading{font-size:10px}}@media(prefers-reduced-motion:reduce){button{transition:none}}',
].join('');
const NAV_STYLE = '.summary{position:relative}.room-navigation{position:absolute;inset:0;z-index:1;border-radius:12px}.room-navigation:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.room-icon,.reading,.quick{position:relative;z-index:2}';
const CLIMATE_STYLE = '.quick.climate-shortcut{display:flex;flex-direction:column;gap:1px}.quick.climate-shortcut ha-icon{--mdc-icon-size:17px}.quick-climate-label{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;line-height:11px}.climate-status{position:relative;z-index:2;display:inline-flex;align-items:center;gap:3px;max-width:100%;height:16px;margin-top:2px;padding:0 4px;border:0;border-radius:6px;background:color-mix(in srgb,var(--secondary-text-color,#637080) 8%,transparent);color:var(--secondary-text-color,#637080);font-size:10px;line-height:16px;white-space:nowrap}.climate-status ha-icon{flex:none;--mdc-icon-size:12px}.climate-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.climate-status.heating,.quick.heating{color:var(--error-color,#db5546);background:color-mix(in srgb,var(--error-color,#db5546) 14%,var(--card-background-color,#fff))}.climate-status.cooling,.quick.cooling{color:var(--info-color,#2389ce);background:color-mix(in srgb,var(--info-color,#2389ce) 12%,var(--card-background-color,#fff))}';

class RoomOrbitCard extends HTMLElement {
 static getStubConfig() { return { ...DEFAULTS }; }
 static getConfigForm() {
  const schema = [
   { name: 'title', selector: { text: {} } }, { name: 'icon', selector: { icon: {} } },
   { name: 'palette', selector: { select: { options: PALETTES, mode: 'dropdown' } } },
   { name: 'read_only', selector: { boolean: {} } },
   { name: 'navigation_path', selector: { text: {} } },
   { name: 'temperature_entity', selector: { entity: { domain: 'sensor' } } },
   { name: 'humidity_entity', selector: { entity: { domain: 'sensor' } } },
   { name: 'presence_entity', selector: { entity: { domain: 'binary_sensor' } } },
   { name: 'climate_entity', selector: { entity: { domain: 'climate' } } },
  ];
  for (let i = 1; i <= 4; i++) schema.push(
   { name: 'entity_' + i, selector: { entity: { domain: DOMAINS } } },
   { name: 'name_' + i, selector: { text: {} } },
   { name: 'icon_' + i, selector: { icon: {} } },
  );
  const labels = { climate_entity: 'Room thermostat (optional)', navigation_path: 'Room view path (e.g. /dashboard-home/living-room)', title: 'Room name', icon: 'Room icon', palette: 'Orbit palette', read_only: 'Read-only mode', temperature_entity: 'Temperature sensor', humidity_entity: 'Humidity sensor', presence_entity: 'Occupancy / motion sensor' };
  return { schema, computeLabel: ({ name }) => labels[name] || name.replace(/^(entity|name|icon)_(\d)$/, (_, field, i) => 'Shortcut ' + i + ' · ' + field) };
 }
 constructor() {
  super(); this.attachShadow({ mode: 'open' }); this._config = { ...DEFAULTS };
  this._busy = new Set(); this._error = ''; this._signature = ''; this._expanded = false;
  this.shadowRoot.addEventListener('click', (event) => {
   const button = event.composedPath().find((el) => el?.dataset?.action);
   if (!button || button.disabled) return;
   if (button.dataset.action === 'navigate') {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
   }
   void this._activate(button.dataset.entity, button.dataset.action);
  });
 }
 setConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Room Orbit requires an object configuration.');
  if (config.navigation_path && (typeof config.navigation_path !== 'string' || !/^\/(?!\/)[^\s\\]*$/.test(config.navigation_path))) throw new Error('navigation_path must be a local path such as /dashboard-home/living-room.');
  for (const key of FIELDS) if (config[key] && (typeof config[key] !== 'string' || !/^[a-z_]+\.[a-z0-9_]+$/.test(config[key]))) throw new Error(key + ' must be an entity ID.');
  for (let i = 1; i <= 4; i++) if (config['entity_' + i] && !DOMAINS.includes(domain(config['entity_' + i]))) throw new Error('Shortcut ' + i + ' has an unsupported entity domain.');
  for (const key of ['temperature_entity', 'humidity_entity']) if (config[key] && domain(config[key]) !== 'sensor') throw new Error(key + ' must be a sensor.');
  if (config.presence_entity && domain(config.presence_entity) !== 'binary_sensor') throw new Error('Presence must be a binary sensor.');
  if (config.climate_entity && domain(config.climate_entity) !== 'climate') throw new Error('climate_entity must be a climate entity.');
  this._config = { ...DEFAULTS, ...config, palette: PALETTES.includes(config.palette) ? config.palette : 'aurora', read_only: config.read_only === true };
  this._error = ''; this._signature = ''; this._expanded = false; this._update();
 }
 set hass(value) { this._hass = value; this._update(); }
 get hass() { return this._hass; }
 getCardSize() { return this._expanded ? 4 : 2; }
 getGridOptions() { return { columns: 6, min_columns: 6 }; }
 _ids() { return [...new Set(FIELDS.map((key) => this._config[key]).filter(Boolean))]; }
 _state(id) { return this._hass?.states?.[id]; }
 _climate(id) {
  const s = this._state(id);
  if (!available(s)) return { label: 'Unavailable', kind: 'unavailable', icon: 'mdi:thermostat' };
  const action = s.attributes?.hvac_action;
  const actions = {
   heating: ['Heating', 'mdi:fire'], idle: ['Idle', 'mdi:pause-circle-outline'], off: ['Off', 'mdi:power'],
   cooling: ['Cooling', 'mdi:snowflake'], drying: ['Drying', 'mdi:water-percent'], fan: ['Fan', 'mdi:fan'],
   defrosting: ['Defrosting', 'mdi:snowflake-melt'], preheating: ['Preheating', 'mdi:thermometer-chevron-up'],
  };
  if (Object.hasOwn(actions, action)) return { label: actions[action][0], kind: action, icon: actions[action][1] };
  const modes = { heat: 'Heat mode', cool: 'Cool mode', heat_cool: 'Heat/cool mode', auto: 'Auto mode', dry: 'Dry mode', fan_only: 'Fan mode', off: 'Off mode' };
  return { label: !action && Object.hasOwn(modes, s.state) ? modes[s.state] : 'Action unknown', kind: 'unknown', icon: 'mdi:thermostat' };
 }
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
  const signature = JSON.stringify([this._config, this._hass.locale, this._hass.language, this._ids().map((id) => [id, this._state(id), this._actions(id)]), [...this._busy], this._error, this._expanded]);
  if (signature === this._signature) return;
  this._signature = signature; this._render();
 }
 _infoButton(id, content, className = '') { return '<button class="' + className + '" data-action="info" data-entity="' + esc(id) + '" aria-label="More information: ' + esc(this._state(id)?.attributes?.friendly_name || id) + '">' + content + '</button>'; }
 _render() {
  const c = this._config, presence = this._state(c.presence_entity);
  const occupied = available(presence) && presence.state === 'on';
  const status = !c.presence_entity ? 'Room overview' : !available(presence) ? 'Presence unknown' : occupied ? 'Occupied' : 'Clear';
  const climate = c.climate_entity ? this._climate(c.climate_entity) : null;
  const badge = climate ? this._infoButton(c.climate_entity, icon(climate.icon) + '<span class="climate-label">' + esc(climate.label) + '</span>', 'climate-status ' + climate.kind) : '';
  const readings = [['temperature_entity', 'Temperature', 'mdi:thermometer'], ['humidity_entity', 'Humidity', 'mdi:water-percent']].filter(([field]) => c[field]).map(([field, label, image]) => this._infoButton(c[field], icon(image) + '<span class="sr-only">' + label + ': </span><span class="reading-value">' + esc(this._format(this._state(c[field]))) + '</span>', 'reading')).join('');
  const slots = [1, 2, 3, 4].filter((i) => c['entity_' + i]).map((i) => {
   const id = c['entity_' + i], s = this._state(id), d = domain(id);
   const image = c['icon_' + i] || s?.attributes?.icon || ({ light: 'mdi:lightbulb', cover: 'mdi:window-shutter', switch: 'mdi:power-socket-eu', input_boolean: 'mdi:toggle-switch', binary_sensor: 'mdi:motion-sensor' })[d] || 'mdi:chart-line';
   const active = d === 'climate' ? this._climate(id).kind === 'heating' : available(s) && ['on', 'open', 'opening', 'closing'].includes(s.state);
   const name = c['name_' + i] || s?.attributes?.friendly_name || id;
   let state = d === 'climate' ? this._climate(id).label : this._format(s); const position = s?.attributes?.current_position;
   if (d === 'cover' && available(s) && typeof position === 'number' && Number.isFinite(position) && position >= 0 && position <= 100) state += ' · ' + position + '% open';
   return { id, image: d === 'climate' ? this._climate(id).icon : image, active, name, state, climateKind: d === 'climate' ? this._climate(id).kind : '', actions: this._actions(id) };
  });
  const quick = slots.map((slot) => {
   const toggle = slot.actions.some((a) => a.action === 'toggle');
   const action = toggle ? 'toggle' : slot.actions.length ? 'expand' : 'info';
   const label = (toggle ? 'Toggle: ' : action === 'expand' ? 'Show controls: ' : 'More information: ') + slot.name + ' · ' + slot.state;
   return '<button class="quick ' + (slot.active ? 'active ' : '') + (slot.climateKind ? 'climate-shortcut ' : '') + slot.climateKind + '" data-entity="' + esc(slot.id) + '" data-action="' + action + '" aria-label="' + esc(label) + '" title="' + esc(label) + '"' + (action === 'expand' ? ' aria-expanded="' + (this._expanded === true || this._expanded === slot.id) + '"' : '') + (this._busy.has(slot.id) ? ' disabled aria-busy="true"' : '') + '>' + icon(slot.image) + (slot.climateKind ? '<span class="quick-climate-label">' + esc(slot.state) + '</span>' : '') + (this._busy.has(slot.id) ? '<span class="busy">…</span>' : '') + '</button>';
  }).join('');
  const details = this._expanded ? slots.filter((slot) => this._expanded === true || this._expanded === slot.id).map((slot) => {
   const buttons = slot.actions.map((a) => '<button class="action" data-entity="' + esc(slot.id) + '" data-action="' + a.action + '" aria-label="' + a.label + ': ' + esc(slot.name) + '" title="' + a.label + '" ' + (this._busy.has(slot.id) ? 'disabled aria-busy="true"' : '') + '>' + icon(a.icon) + '</button>').join('');
   return '<article class="tile">' + this._infoButton(slot.id, icon(slot.image) + '<span class="tile-copy"><span class="tile-name" title="' + esc(slot.name) + '">' + esc(slot.name) + '</span><span class="tile-state">' + esc(slot.state) + '</span></span>', 'tile-head') + (buttons ? '<div class="actions">' + buttons + '</div>' : '') + '</article>';
  }).join('') : '';
  const title = c.title || DEFAULTS.title;
  this.shadowRoot.innerHTML = '<style>' + STYLE + NAV_STYLE + CLIMATE_STYLE + '</style><ha-card data-palette="' + c.palette + '"><div class="shell"><div class="summary ' + (!slots.length ? 'no-shortcuts' : '') + '">' + (c.navigation_path ? '<a class="room-navigation" data-action="navigate" data-entity="" href="' + esc(c.navigation_path) + '" aria-label="Open room view: ' + esc(title) + '"><span class="sr-only">Open ' + esc(title) + '</span></a>' : '') + '<div class="identity"><button class="room-icon ' + (occupied ? 'occupied' : '') + '" data-action="details" data-entity="" aria-label="' + (this._expanded ? 'Hide' : 'Show') + ' room details: ' + esc(title) + '" aria-expanded="' + !!this._expanded + '" title="' + status + ' · Room details">' + icon(c.icon || DEFAULTS.icon) + (c.presence_entity ? '<span class="dot"></span>' : '') + '</button><h2 title="' + esc(title) + '">' + esc(title) + '</h2><span class="sr-only">' + status + '</span><div class="telemetry">' + (readings || '<span class="hint">' + status + '</span>') + '</div>' + badge + '</div>' + (slots.length ? '<section class="shortcuts count-' + slots.length + '" aria-label="Room shortcuts">' + quick + '</section>' : '') + '</div>' + (details ? '<section class="tiles" aria-label="Room details">' + details + '</section>' : '') + (!slots.length && !readings ? '<p class="hint">Add up to four shortcuts in the card editor.</p>' : '') + (this._error ? '<div class="error" role="alert">' + esc(this._error) + '</div>' : '') + '</div></ha-card>';
 }
 async _activate(id, action) {
  if (action === 'navigate' && id === '') { this._navigate(); return; }
  if (action === 'details' && id === '') { this._expanded = !this._expanded; this._update(); return; }
  if (!this._ids().includes(id)) return;
  if (action === 'expand' && this._actions(id).length) { this._expanded = this._expanded === id ? false : id; this._update(); return; }
  if (action === 'info') { this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true })); return; }
  if (this._busy.has(id) || !this._actions(id).some((a) => a.action === action)) return;
  this._busy.add(id); this._error = ''; this._update();
  try { await this._hass.callService(domain(id), action, { entity_id: id }); }
  catch { this._error = 'The action could not be sent. Check Home Assistant and try again.'; }
  finally { this._busy.delete(id); this._update(); }
 }
 _navigate() {
  const path = this._config.navigation_path;
  if (!path) return;
  const current = window.location.pathname + window.location.search + window.location.hash;
  if (current === path) return;
  try {
   window.history.pushState({ from: current }, '', path);
   window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
  } catch { this._error = 'The room view could not be opened. Check the navigation path.'; this._update(); }
 }
}
if (!customElements.get(TYPE)) customElements.define(TYPE, RoomOrbitCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === TYPE)) window.customCards.push({ type: TYPE, name: 'Room Orbit Card', description: 'Room sensors and capability-aware shortcuts in the Orbit style.', preview: true, documentationURL: 'https://github.com/Liionboy/ha-room-orbit-card' });
console.info('ROOM ORBIT ' + VERSION);
