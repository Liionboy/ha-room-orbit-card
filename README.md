# Room Orbit Card

A standalone Home Assistant room summary in the Orbit visual style. Select your own temperature, humidity and occupancy sensors, plus up to four room shortcuts. No personal entities, external assets or runtime dependencies are bundled.

## Features

- Room name, icon, decorative Orbit ring and occupancy indicator.
- Temperature and humidity with Home Assistant sensor units.
- Four optional shortcuts, each with an entity, custom name and icon.
- Light, switch and input-boolean toggles; cover Open / Stop / Close controls gated by supported features and registered services.
- Sensor and binary-sensor shortcuts are informational. Click any tile heading or reading for Home Assistant More Info.
- Read-only mode, unavailable-entity handling, duplicate-call protection and visible action errors.
- Aurora, Ocean, Sunset and Lavender palettes, HA light/dark themes, container-responsive layout and reduced-motion support.
- Complete visual configuration form (Home Assistant 2026.6+); YAML is also supported.

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
icon: mdi:sofa
palette: aurora
temperature_entity: sensor.room_temperature
humidity_entity: sensor.room_humidity
presence_entity: binary_sensor.room_occupancy
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

All fields are optional. For shortcuts 1–4, use entity_N, name_N and icon_N. Supported domains: light, switch, input_boolean, cover, sensor, binary_sensor. Names and icons default to entity metadata. Unknown palettes fall back to Aurora. Enable read_only to hide device actions while preserving More Info.

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
