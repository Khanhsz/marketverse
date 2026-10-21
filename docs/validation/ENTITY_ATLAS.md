# World atlas entity integration

Tested implementation: `b9ab8aab573b4da8594f3e7ea174af87c9bde7a2`. Follow-up to accepted Sprint 16, explicitly requested by user.

Changed: map image and integrity manifest, eight optimized transparent sprites, `entityLayout.ts`, artwork loader, city visual anchors, facility rendering, map asset assertion and production browser script.

57 manually placed landmarks = eight city landmarks + 42 district/industrial/transport landmarks + seven ports. All share the world camera; decorative landmarks never intercept pointer events or create simulated revenue, costs or facilities. Existing facilities receive sprites only at the existing detail threshold and use the existing hit targets.

Validation: `npm run verify` passed (63 behavioral tests, format, PNG integrity, TypeScript, Vite build); `npm run test:map:prod` and `npm run test:browser` passed with Chromium. Map coverage includes eight decoded entity sprites, 15 layer switches, eight-city facility/city selection, three weekly turns, exact save reload, corrupt map retry and no uncaught errors. Reviewed the resulting in-game screenshot. Remote CI/deployment status is separate.

Boundaries: the original atlas supplies country borders. The earlier generated country cutouts do not tessellate exactly, so they are not substituted for this terrain or promoted to gameplay polygons. This is a worldwide visual layout for the existing economy, not new international trade gameplay. Historical alpha package has not been rebuilt.

## Publication and CI follow-up

Published implementation `076cd453a56487d5d5ffe6d88f568747aa89ac9f` has exactly the tested source tree `7812b0a0d64bf9739d472cdc208bbdf1f30f8ddf`. Render deployment `dep-dbcamg5g1s2s738kgt9g` is live. Initial remote CI passed verify but its additional visual suite used previous map coordinates. Updated those clicks to the new city anchors and ran `npm run test:visual` successfully in Chromium. This follow-up changes tests/documentation only.
