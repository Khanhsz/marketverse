# Sprint 05 validation — 2026-10-20

Tested source: `9d8240e3d4c5c84468ccc99581eeab2659e2ec5d`. Node 22.23.3, real headless Chromium at laptop sizes.

Deterministic city/segment/SKU demand with affordability, segment fit, quality and an explicit no-purchase option. Hamilton integer allocation conserves buyers and is order-stable; tests verify price elasticity, quality response and no revenue from preferences. Browser inspects the persisted demand report.

- `npm run verify`: 24/24 behavioral tests, TypeScript and Vite production build pass.
- `npm run test:browser`: pass; isolated Vite server and fresh storage. Regression coverage includes map camera/layers, entity context, save/reload/reset/recovery and weekly review workflow, plus the active sprint's checks in the committed smoke script.
- `git diff --check`: pass. Nonfatal bundle-size warning remains unless noted elsewhere.
- Remote CI has not been observed: GitHub API is proxy-blocked. Native Git push works. No API key, paid runner or recurring Work scheduler is used.
