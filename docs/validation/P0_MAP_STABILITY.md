# P0 — map stability — 2026-10-20

Base source: `993cb8b6fa1a5aba35d4303e6b7e7e5e03041d7d`. Fixed runtime source: `4574ab478b7962edac5f2ff0168f286b9a308db4`, tree `bd7b603432574ec703aec6fec33080645b7e5354`. Local, CI and deployed acceptance passed below. This is post-Alpha maintenance, not a new claim that all historical release gates were rerun.

## Root causes and repairs

- The required PNG in the base commit contained only two bytes. Restored the approved UI-free country artwork: 1536×1024, 2,262,971 bytes, SHA-256 `14d4428c1744fefe322b7c760faa9a38e5bc4ab75da1dfb8a5a5e6d6c5e7f71a`.
- The previous overlay redraw destroyed the artwork container and then attempted to reuse it. The decoded background now remains mounted; only dynamic overlays are rebuilt.
- Crossing zoom thresholds previously changed labels without rebuilding business entities. Zoom now rebuilds those overlays when needed, and hidden facility markers cannot intercept clicks.
- Failed image loading now gives a working retry control. The browser regression reproduces the original two-byte response and verifies exact save preservation through failure and retry.
- Every production build now checks PNG signature, chunks/CRC, decompressed pixels, dimensions and approved checksum. Stale nonexistent fallback/layer paths were removed from the artwork manifest.
- Existing unformatted map/UI edits were formatted to restore the required repository formatting gate. The general browser journeys were updated to use the actual planner tabs and visible business zoom.

## Checks actually run

Runtime: Node `v24.19.0`, Chromium `153.0.8010.0` on the container. The normal managed browser download was unavailable; a temporary test-only Chromium binary was used without changing application dependencies.

- `npm run verify`: 56/56 behavioral tests, formatting, artwork integrity, TypeScript and production build passed.
- `npm run test:map:prod`: approved artwork, 15 repeated layer switches, city selection, eight-city campaign, zoomed facility selection, hidden-hit rejection, three weekly turns, reload and invalid-image retry passed. One canvas, zero uncaught errors. See `P0_MAP_BROWSER.json`.
- `npm run test:browser`: cities/company/facility interactions, camera, five layers, queues, products/people/media, reports, save recovery and keyboard workflows passed.
- `npm run test:campaign:prod`: all 104 weekly UI commits, projects, save import/export, completed save restoration and worker replay passed. See `P0_BROWSER_CAMPAIGN.json`.
- `npm run test:replay:cross`: exact Node/Chromium canonical state equality passed. See `P0_CROSS_RUNTIME.json`. Canonical SHA-256 remains `17ba2b19b3e4003899d707db013e11906cdb0344e001ff45e48eb3b0ebb9d059`, matching the historical campaign's simulation result.
- No changes to `src/engine/` or `src/data/`; no economy, weekly cadence or save schema changes.
- Production laptop screenshot was visually inspected. Screenshots and test exports remain local QA artifacts.

## Deployment acceptance

Existing service: `marketverse-alpha`, Static Site, https://marketverse-alpha.onrender.com. Connected branch automatically deploys commits.

Accepted runtime commit: `4574ab478b7962edac5f2ff0168f286b9a308db4`. Render deploy `dep-dbbl7bhsrm7s738bovt0` reached **live** on 2026-10-20 at 11:43:05 UTC.

- HTTPS image request returned 200 and the original 2,262,971-byte PNG with its approved SHA-256.
- The browser delivery path used Cloudflare Polish (`cf-polished: ok, orig_size=2262971`), returning a 2,046,226-byte lossless PNG. Both images decode to the identical RGBA SHA-256 `fd86169056ca67547054bd9d45b74f3041aed2bdb98ba8929c2f85ff8350f62b`. See `P0_ASSET_DELIVERY.json`.
- The browser test now verifies delivered-image decoding/dimensions rather than assuming a CDN preserves PNG compression bytes. Source checksum remains enforced by every build.
- The same 15-layer-switch/eight-city/zoom/selection/three-turn/save/reload/corrupt-image-retry journey passed against https://marketverse-alpha.onrender.com with zero uncaught errors. See `P0_DEPLOYED_BROWSER.json`, including its test harness checksum. The live map screenshot was visually inspected.
- [GitHub CI run 39416889137](https://github.com/Khanhsz/marketverse/actions/runs/39416889137) completed successfully for the deployed runtime commit, including 56 behavior tests, browser/map gates, 104-week campaign, exact replay and the balance sweep.

The follow-up changes to this evidence and the CDN-safe browser assertion do not change application source. Its commit skips Render deployment; the verified runtime remains the commit recorded above.

## Limits and next product step

Human gameplay review, strategy balance, first-twelve-weeks onboarding and broader browser/mobile/accessibility review remain open. No new industry, international map, API key, paid service or unattended coding runner was introduced. Next authorized product work is P1 in `../PRODUCT_REVIEW_PLAN.md`.
