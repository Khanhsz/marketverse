# Sprint 02 validation — 2026-10-20

Tested source: `08038c222a51d676f4dae787ce4ae1199d1f1506`. Node 22.23.3; real Chromium at 1366×768 and 1280×800.

- `npm run verify`: 13/13 tests (10 engine + 3 camera); TypeScript and production build pass.
- `npm run test:browser`: pass. Runner owns and closes a temporary Vite server; fresh isolated browser storage.
- All three city pins update the contextual panel without replacing the canvas.
- Wheel zoom keeps the world coordinate beneath the cursor. Browser events use integer CSS coordinates; the assertion matches those delivered coordinates.
- Dragging a city changes camera position without changing selection. Zoomed city selection remains accurate.
- Selection, all five layer switches, and viewport resize preserve camera center and scale.
- Reset view centers the full vector country; zoom buttons work. Camera unit tests cover cursor invariance at both zoom limits and screen-distance pan at different scales.
- Market population/segments, company ownership colors, existing facilities, transport links and purchasing power use actual state. Future economics/route costs are explicitly labeled unavailable.
- Week/save/reload/reset and company/map tab regression checks pass; one canvas and no uncaught page errors. Screenshot visually inspected: vector country, labels, layers and controls at laptop size.
- CI definition now runs browser smoke; remote CI result has not been observed from this session. Existing nonfatal bundle-size warning remains.

No background Work/Codex scheduler is exposed. GitHub API access returned Forbidden; native Git read works. Scheduling remains unconfigured and no API charges are introduced.
