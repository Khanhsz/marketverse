# Sprint 08 validation — 2026-10-20

Tested source: `10dcdd9925da01583abfc71568ef909d569e57c4`. Node 22.23.3, real headless Chromium at laptop sizes.

Four bounded AI archetypes plan solely from own resources and previous public market prices, then use shared order, construction, research, shipping and cash rules. A deterministic four-rival 16-week test audits every ledger and replay; browser advances through the playable core and displays rival strategy. Tests verify hidden player policy changes cannot affect AI plans.

- `npm run verify`: 34/34 behavioral tests, TypeScript and Vite production build pass.
- `npm run test:browser`: pass; isolated Vite server and fresh storage. Regression coverage includes map camera/layers, entity context, save/reload/reset/recovery and weekly review workflow, plus the active sprint's checks in the committed smoke script.
- `git diff --check`: pass. Nonfatal bundle-size warning remains unless noted elsewhere.
- Remote CI has not been observed: GitHub API is proxy-blocked. Native Git push works. No API key, paid runner or recurring Work scheduler is used.
