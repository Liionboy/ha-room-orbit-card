# Room Orbit Card

A compact Home Assistant room tile in the Orbit visual style. Select your own temperature, humidity and occupancy sensors, plus up to four room shortcuts. No personal entities, external assets or runtime dependencies are bundled.

## Features

- Compact room icon, room name, inline readings and occupancy dot. No large ring, metric panels or footer.
- Temperature and humidity with Home Assistant sensor units.
- Four optional shortcuts, each with an entity, custom name and icon.
- Light, switch and input-boolean toggles; cover Open / Stop / Close controls gated by supported features and registered services.
- Quick buttons toggle lights, switches and helpers. A cover shortcut expands its supported controls; informational shortcuts open More Info.
- Tap the room icon to show/hide detailed names, states, More Info headings and all supported controls. Readings also open More Info. Details are collapsed by default.
- Read-only mode, unavailable-entity handling, duplicate-call protection and visible action errors.
- Aurora, Ocean, Sunset and Lavender palettes, HA light/dark themes, container-responsive layout and reduced-motion support.
- Complete visual configuration form (Home Assistant 2026.6+); YAML is also supported.
- Optional room-view navigation: set navigation_path in the visual editor or YAML, then tap the room name or free card background. Quick buttons, readings and the details icon keep their own actions.
- Optional thermostat indicator: climate_entity shows real HVAC action, including Heating (warm highlight), Idle (neutral) and Off. Tap it for native HA More Info. No thermostat commands are sent by this card.
- Optional temperature colors and a gentle glow: below the cold threshold the room uses blue/cyan accents; at or above the warm threshold it uses orange accents. The normal range keeps the selected Orbit palette. Animation can be disabled and respects reduced-motion preferences.

This is a room overview, not a replacement for full light/color or cover-position cards. No discovery or area-wide bulk actions: only explicitly configured entities are shown or controlled. A motion sensor reports its current detection state, not guaranteed long-term occupancy.

## HACS installation

1. Open **HACS → ⋮ → Custom repositories**.
2. Add **https://github.com/Liionboy/ha-room-orbit-card**, category **Dashboard**.
3. Install **Room Orbit Card**, refresh the browser and add it from the card picker.
4. Choose your sensors and shortcuts in the visual editor.

This is a custom repository, not an entry in the HACS default catalog. Requires Home Assistant **2026.6 or later**, matching the built-in form editor API. The minimum is based on the API requirement, not a full live-version compatibility certification.

## YAML example

Replace every sample entity with one from your own installation:

~~~yaml
type: custom:ha-room-orbit-card
title: Living room
navigation_path: /dashboard-home/living-room
icon: mdi:sofa
palette: aurora
temperature_entity: sensor.room_temperature
humidity_entity: sensor.room_humidity
presence_entity: binary_sensor.room_occupancy
climate_entity: climate.room_thermostat
entity_1: light.room_ceiling
name_1: Ceiling
entity_2: cover.room_blind
name_2: Blind
entity_3: switch.room_socket
name_3: Socket
entity_4: binary_sensor.room_window
name_4: Window
read_only: false
~~~

All fields are optional. For shortcuts 1–4, use entity_N, name_N and icon_N. Supported domains: light, switch, input_boolean, cover, sensor, binary_sensor, climate. Names and icons default to entity metadata. Unknown palettes fall back to Aurora. Enable read_only to hide device actions while preserving More Info.

### Temperature colors

Enable in the visual editor, or add these fields to an existing card:

~~~yaml
temperature_effect: true
temperature_cold_below: 22
temperature_warm_from: 25
temperature_animation: true
~~~

The effect reads only the configured temperature_entity sensor. Thresholds are always in Celsius: defaults are cold below 22°C and warm from 25°C (inclusive). Exactly 22°C is normal. A sensor in °F or K is converted for comparison; its displayed unit stays unchanged. Missing, unavailable, nonnumeric or unsupported-unit readings keep the normal palette. No thermostat setpoint, HVAC mode or service is changed. Temperature color is independent of the thermostat's Heating/Idle action.

The feature is opt-in (temperature_effect defaults to false). Set temperature_animation to false for static colors; the operating system's Reduce motion preference always disables the pulse. The 3.8-second low-contrast glow does not change tile dimensions or block taps. The cold threshold must be lower than the warm threshold.

For navigation, copy the path from the browser address bar while the target room view is open (for example /dashboard-home/living-room or /lovelace/living-room). The example is not auto-discovery: use your dashboard's actual path, which may include a different view slug or numeric index. Only local paths beginning with a single slash are accepted. Leave navigation_path empty to disable navigation. The room icon still expands details, sensors open More Info, and controls never trigger navigation. Keyboard focus/Enter and native modified-link clicks are supported. Read-only mode does not block navigation.

Select climate_entity in the visual editor for the compact thermostat badge, without consuming one of the four shortcuts. A climate entity can alternatively be assigned to a shortcut (informational, no direct HVAC control); avoid selecting the same entity in both places if you do not want duplicates. Heating and Idle come only from the climate entity's hvac_action attribute, never from its selected heat mode. Other native actions (Cooling, Drying, Fan, Defrosting, Preheating) are distinct. If hvac_action is not supplied, a neutral mode label such as Heat mode is shown; activity is not inferred. Unknown/unavailable devices remain distinct. No target temperature or HVAC mode is modified.

Version 1.1.0 keeps existing YAML unchanged. The default tile targets roughly 116–128 px height with four shortcuts, including narrow two-column phone grids. Full names are available in the expandable details and accessible button labels. The Sections default is six columns; existing dashboard row/height overrides may still need to be set to Auto. A parent stack or fixed grid can constrain any card independently of its own layout.

Cover position is shown only when a numeric current_position from 0 to 100 is supplied; 100 means fully open according to HA. The card does not guess unavailable states or cover features. Tilt-only covers remain informational unless they also support open/close actions.

## Manual installation

Copy ha-room-orbit-card.js into /config/www/, register /local/ha-room-orbit-card.js as a JavaScript module in dashboard resources, then use custom:ha-room-orbit-card.

## Development and verification

~~~sh
npm run check
npm test
~~~

Dependency-free Node tests use a mocked HA context. Synthetic browser checks do not contact HA or operate real devices. The built-in editor still requires validation in an actual HA installation; mock/browser rendering is not live device verification.

Optional browser suite: install Playwright in your own development environment and run node test/browser.mjs. PLAYWRIGHT_MODULE can point to an existing Playwright module; CHROMIUM_EXECUTABLE can select an installed Chromium. SCREENSHOT_DIR optionally saves synthetic previews (HA components/icons are stubs).

## References

- [Minimalist Room Card](https://ui-lovelace-minimalist.github.io/UI/usage/cards/card_room/) — functional inspiration; independent implementation.
- [HA custom cards and form editor](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/)
- [Cover integration](https://www.home-assistant.io/integrations/cover/)
- [HACS Dashboard plugin requirements](https://www.hacs.xyz/docs/publish/plugin/)

## License

MIT. See [LICENSE](LICENSE).
