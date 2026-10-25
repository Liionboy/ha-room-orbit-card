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
 await page.addScriptTag({ content: readFileSync(process.env.CARD_RESOURCE || new URL('../ha-room-orbit-card.js', import.meta.url), 'utf8') });
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
 const measure = async (label, width, maxHeight = 130) => {
  const bounds = await page.evaluate(() => {
   const root = window.card.shadowRoot, box = window.card.getBoundingClientRect();
   return { width: box.width, height: box.height, maxRight: Math.max(...[...root.querySelectorAll('button,.summary,.identity,.shortcuts')].map((el) => el.getBoundingClientRect().right - box.left)), readings: [...root.querySelectorAll('.reading-value')].map((el) => ({ text: el.textContent, height: el.getBoundingClientRect().height, scroll: el.scrollWidth, client: el.clientWidth })) };
  });
  assert.ok(bounds.maxRight <= bounds.width + 1, JSON.stringify(bounds));
  assert.ok(bounds.height <= maxHeight, 'Card too tall: ' + JSON.stringify(bounds));
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
 await page.evaluate(() => {
  window.card.hass = { ...window.card.hass, states: { ...window.card.hass.states, 'climate.room': { state: 'heat', attributes: { hvac_action: 'heating' } } } };
  window.card.setConfig({ ...window.card._config, climate_entity: 'climate.room' });
 });
 assert.equal(await page.locator('ha-room-orbit-card .climate-label').textContent(), 'Heating');
 await measure('thermostat-heating');
 const heatingColor = await page.locator('ha-room-orbit-card .climate-status').evaluate((el) => getComputedStyle(el).color);
 await page.evaluate(() => { window.card.hass.states['climate.room'].attributes.hvac_action = 'idle'; window.card.hass = { ...window.card.hass }; });
 assert.equal(await page.locator('ha-room-orbit-card .climate-label').textContent(), 'Idle');
 const idleColor = await page.locator('ha-room-orbit-card .climate-status').evaluate((el) => getComputedStyle(el).color);
 assert.notEqual(heatingColor, idleColor);
 const routes = await page.evaluate(() => window.routes.length);
 await page.locator('ha-room-orbit-card .climate-status').click();
 assert.equal(await page.evaluate(() => window.infos.at(-1).entityId), 'climate.room');
 assert.equal(await page.evaluate(() => window.routes.length), routes);
 await page.setViewportSize({ width: 360, height: 800 });
 await page.evaluate(() => { const grid = document.querySelector('#grid'); grid.style.width = '100%'; grid.style.gridTemplateColumns = 'repeat(2,minmax(0,1fr))'; });
 await measure('phone-360-thermostat-idle');
 await page.evaluate(() => { window.card.hass.states['climate.room'].attributes.hvac_action = 'heating'; window.card.hass = { ...window.card.hass }; });
 await measure('phone-360-thermostat-heating');
 const badge = await page.locator('ha-room-orbit-card .climate-label').evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
 assert.ok(badge.scroll <= badge.client + 1, 'Thermostat status must stay fully visible');
 console.log('Thermostat Heating/Idle transitions, color, More Info and compact phone layout: PASS');
 await page.evaluate(() => { window.card.setConfig({ ...window.card._config, climate_entity: '', entity_3: 'climate.room' }); });
 assert.equal(await page.locator('ha-room-orbit-card .quick-climate-label').textContent(), 'Heating');
 const shortcut = await page.locator('ha-room-orbit-card .quick-climate-label').evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth }));
 assert.ok(shortcut.scroll <= shortcut.client + 1, 'Heating label must fit climate shortcut');
 await page.locator('ha-room-orbit-card .quick[data-entity="climate.room"]').click();
 assert.equal(await page.evaluate(() => window.infos.at(-1).entityId), 'climate.room');
 await measure('phone-360-climate-shortcut');
 await page.emulateMedia({ reducedMotion: 'no-preference' });
 await page.evaluate(() => { window.card.setConfig({ ...window.card._config, temperature_effect: true, temperature_animation: true }); });
 const temperatureStyles = async () => page.evaluate(() => {
  const root = window.card.shadowRoot, card = root.querySelector('ha-card'), shell = root.querySelector('.shell');
  return { range: card.dataset.temperature, color: getComputedStyle(root.querySelector('.room-icon')).color, animation: getComputedStyle(shell, '::after').animationName, pointerEvents: getComputedStyle(shell, '::after').pointerEvents };
 });
 const colors = [];
 for (const [value, range] of [[21.5, 'cold'], [24, 'normal'], [25, 'warm']]) {
  await page.evaluate((v) => { window.card.hass.states['sensor.temperature'].state = String(v); window.card.hass = { ...window.card.hass }; }, value);
  const style = await temperatureStyles(); assert.equal(style.range, range); colors.push(style.color);
  assert.equal(style.animation, range === 'normal' ? 'none' : 'room-temperature-glow');
  if (range !== 'normal') assert.equal(style.pointerEvents, 'none');
  // The original layout assertion uses these fixed readings; verify dimensions independently here.
  const height = await page.locator('ha-room-orbit-card').evaluate((el) => el.getBoundingClientRect().height); assert.ok(height <= 130);
  if (output) await page.locator('#grid').screenshot({ path: output + '/temperature-' + range + '-dark.png' });
 }
 assert.equal(new Set(colors).size, 3);
 const opacity = await page.evaluate(() => {
  const shell = window.card.shadowRoot.querySelector('.shell'); const animation = shell.getAnimations({ subtree: true }).find((a) => a.animationName === 'room-temperature-glow');
  if (!animation) return null; animation.pause(); animation.currentTime = 0; const low = getComputedStyle(shell, '::after').opacity;
  animation.currentTime = 1900; return { low, high: getComputedStyle(shell, '::after').opacity };
 }); assert.ok(opacity); assert.notEqual(opacity.low, opacity.high);
 // The decorative pulse must not intercept sensor or control taps.
 const routesBeforeGlowTap = await page.evaluate(() => window.routes.length);
 await page.locator('ha-room-orbit-card .reading[data-entity="sensor.temperature"]').click();
 assert.equal(await page.evaluate(() => window.infos.at(-1).entityId), 'sensor.temperature');
 assert.equal(await page.evaluate(() => window.routes.length), routesBeforeGlowTap);
 await page.emulateMedia({ reducedMotion: 'reduce' }); assert.equal((await temperatureStyles()).animation, 'none');
 assert.equal((await temperatureStyles()).range, 'warm');
 await page.emulateMedia({ reducedMotion: 'no-preference' });
 await page.evaluate(() => { window.card.setConfig({ ...window.card._config, temperature_animation: false }); });
 assert.equal((await temperatureStyles()).animation, 'none'); assert.equal((await temperatureStyles()).range, 'warm');
 await page.evaluate(() => { document.body.classList.remove('dark'); });
 if (output) await page.locator('#grid').screenshot({ path: output + '/temperature-warm-light.png' });
 await page.evaluate(() => { window.card.hass.states['sensor.temperature'].state = '21'; window.card.hass = { ...window.card.hass }; });
 if (output) await page.locator('#grid').screenshot({ path: output + '/temperature-cold-light.png' });
 await page.evaluate(() => { window.card.setConfig({ ...window.card._config, temperature_effect: false }); });
 assert.equal((await temperatureStyles()).range, 'normal'); assert.equal((await temperatureStyles()).animation, 'none');
 console.log('Cold/normal/warm colors, animated opacity, static colors, reduced motion and pointer safety: PASS');

 // The same regression can target the standalone script or the final suite resource.
 await page.setViewportSize({width:1000,height:900});
 await page.evaluate(()=>{
  document.querySelector('#grid').style.width='243px';document.querySelector('#grid').style.gridTemplateColumns='1fr';
  card.setConfig({...card._config,climate_entity:'humidifier.room',entity_3:'fan.room',read_only:false});
  card.hass={...card.hass,services:{...card.hass.services,fan:{toggle:{}}},states:{...card.hass.states,'humidifier.room':{state:'on',attributes:{action:'humidifying'}},'fan.room':{state:'off',attributes:{supported_features:48,friendly_name:'Room fan'}}}};
  card.hass.states['sensor.temperature'].state='24.7';card.hass={...card.hass};calls.length=0;infos.length=0;
 });
 const room=page.locator('ha-room-orbit-card'), routeCount=await page.evaluate(()=>routes.length);
 assert.equal(await room.locator('.climate-label').textContent(),'Humidifying');
 await room.locator('.climate-status').click();assert.deepEqual(await page.evaluate(()=>infos),[{entityId:'humidifier.room'}]);
 await page.evaluate(()=>{window.fanButton=card.shadowRoot.querySelector('.quick[data-entity="fan.room"]');card.hass={...card.hass,states:{...card.hass.states,'sensor.unrelated':{state:'7'}}};});
 assert.equal(await page.evaluate(()=>fanButton===card.shadowRoot.querySelector('.quick[data-entity="fan.room"]')),true);
 await room.locator('.quick[data-entity="fan.room"]').focus();await page.keyboard.press('Enter');
 assert.deepEqual(await page.evaluate(()=>calls),[['fan','toggle',{entity_id:'fan.room'}]]);
 assert.equal(await page.evaluate(()=>routes.length),routeCount);
 await page.evaluate(()=>{card.hass.states['fan.room'].state='on';card.hass={...card.hass};});assert.equal(await room.locator('.quick[data-entity="fan.room"]').evaluate(el=>el.classList.contains('active')),true);
 await room.locator('.room-icon').click();await room.locator('.tile-head[data-entity="fan.room"]').click();assert.equal(await page.evaluate(()=>infos.at(-1).entityId),'fan.room');await room.locator('.room-icon').click();
 for(const action of ['humidifying','drying','idle','off']){await page.evaluate(a=>{card.hass.states['humidifier.room'].attributes.action=a;card.hass={...card.hass};},action);assert.equal((await room.locator('.climate-label').textContent()).toLowerCase(),action);}
 await page.evaluate(()=>{card.hass.states['humidifier.room'].attributes.action='humidifying';card.hass={...card.hass};});
 for(const width of [440,243,200,164]){await page.evaluate(w=>document.querySelector('#grid').style.width=w+'px',width);await measure('humidifier-fan-'+width,width,148);const m=await room.locator('.climate-label').evaluate(el=>({scroll:el.scrollWidth,client:el.clientWidth,text:el.textContent}));assert.ok(m.scroll<=m.client+1,JSON.stringify(m));}
 if(output)await room.screenshot({path:output+'/humidifier-fan-light.png'});
 await page.evaluate(()=>document.body.classList.add('dark'));if(output)await room.screenshot({path:output+'/humidifier-fan-dark.png'});
 await page.evaluate(()=>card.setConfig({...card._config,read_only:true}));assert.equal(await room.locator('.quick[data-entity="fan.room"]').getAttribute('data-action'),'info');await room.locator('.quick[data-entity="fan.room"]').click();assert.equal(await page.evaluate(()=>infos.at(-1).entityId),'fan.room');
 await room.locator('.climate-status').click();assert.equal(await page.evaluate(()=>infos.at(-1).entityId),'humidifier.room');assert.equal(await page.evaluate(()=>calls.length),1);
 await page.evaluate(()=>{card.setConfig({...card._config,read_only:false});card.hass.states['fan.room'].attributes.supported_features=0;card.hass={...card.hass};});assert.equal(await room.locator('.quick[data-entity="fan.room"]').getAttribute('data-action'),'info');
 await page.evaluate(()=>{card.hass.states['humidifier.room'].state='unavailable';card.hass={...card.hass};});assert.equal(await room.locator('.climate-label').textContent(),'Unavailable');
 console.log('Humidifier action/More Info, fan keyboard toggle/flags/read-only, no routing cross-trigger: PASS');

 await page.evaluate(()=>{
  card.setConfig({...card._config,climate_entity:'',entity_1:'binary_sensor.door',entity_2:'binary_sensor.window',entity_3:'binary_sensor.smoke',entity_4:'binary_sensor.motion',read_only:false});
  for(const dc of ['door','window','smoke','motion'])card.hass.states['binary_sensor.'+dc]={state:'on',attributes:{device_class:dc,friendly_name:dc+' sensor'}};
  card.hass.formatEntityState=s=>s.attributes.device_class==='door'?(s.state==='on'?'Open':'Closed'):s.state;
  card.hass={...card.hass};calls.length=0;infos.length=0;document.body.classList.remove('dark');
 });
 for(const [dc,image]of [['door','door-open'],['window','window-open'],['smoke','smoke-detector-variant-alert'],['motion','motion-sensor']]){
  const quick=room.locator('.quick[data-entity="binary_sensor.'+dc+'"]');assert.equal(await quick.getAttribute('data-action'),'info');assert.equal(await quick.locator('ha-icon').getAttribute('icon'),'mdi:'+image);await quick.click();assert.equal(await page.evaluate(()=>infos.at(-1).entityId),'binary_sensor.'+dc);
 }
 assert.match(await room.locator('.quick[data-entity="binary_sensor.door"]').getAttribute('aria-label'),/Open/);
 await page.evaluate(()=>{card.hass.states['binary_sensor.door'].state='off';card.hass={...card.hass};});assert.equal(await room.locator('.quick[data-entity="binary_sensor.door"] ha-icon').getAttribute('icon'),'mdi:door-closed');
 await page.evaluate(()=>{card.hass.states['binary_sensor.door'].state='unavailable';card.hass={...card.hass};});assert.equal(await room.locator('.quick[data-entity="binary_sensor.door"] ha-icon').getAttribute('icon'),'mdi:help-circle-outline');assert.equal(await room.locator('.quick[data-entity="binary_sensor.door"]').evaluate(el=>el.classList.contains('active')),false);
 for(const w of [440,243,200,164]){await page.evaluate(w=>document.querySelector('#grid').style.width=w+'px',w);await measure('generic-binary-'+w,w);}
 if(output)await room.screenshot({path:output+'/generic-binary-light.png'});await page.evaluate(()=>document.body.classList.add('dark'));if(output)await room.screenshot({path:output+'/generic-binary-dark.png'});
 const beforeGenericRoutes=await page.evaluate(()=>routes.length);
 for(const ids of [['lock.room','alarm_control_panel.room','button.room','update.room'],['person.example','media_player.room','vacuum.room','select.room'],['number.room','scene.room','script.room','custom2.room']]){
  await page.evaluate(ids=>{const c={...card._config};ids.forEach((id,i)=>{c['entity_'+(i+1)]=id;card.hass.states[id]={state:'idle',attributes:{friendly_name:id}};});card.setConfig(c);},ids);
  for(const id of ids){const b=room.locator('.quick[data-entity="'+id+'"]');assert.equal(await b.getAttribute('data-action'),'info');await b.focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>infos.at(-1).entityId),id);}
 }
 await page.evaluate(()=>{card.setConfig({...card._config,read_only:true});});await room.locator('.quick').first().click();assert.equal(await page.evaluate(()=>infos.at(-1).entityId),'number.room');
 assert.deepEqual(await page.evaluate(()=>calls),[]);assert.equal(await page.evaluate(()=>routes.length),beforeGenericRoutes);
 console.log('Arbitrary domains + sensitive entities open exact More Info only; binary class/state icons and keyboard/no-route checks: PASS');
 assert.deepEqual(errors, []); console.log('Quick actions, cover details, More Info, dark theme and read-only: PASS');
} finally { await browser.close(); }
