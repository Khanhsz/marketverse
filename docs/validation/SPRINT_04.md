# Sprint 04 validation — 2026-10-20

Tested source: `2d66fb648dd5a3de134e254dd0781a31dc7e082b`. Node 22.23.3, real headless Chromium at laptop sizes.

Typed weekly review, atomic idempotent commands, persistent price/production policies, budgeted construction/research/shipment queues and version-1 migration. Browser commits a 70,000-credit plan, reloads and verifies retained policies, project progress and cash.

- `npm run verify`: 21/21 behavioral tests, TypeScript and Vite production build pass.
- `npm run test:browser`: pass; isolated Vite server and fresh storage. Regression coverage includes map camera/layers, entity context, save/reload/reset/recovery and weekly review workflow, plus the active sprint's checks in the committed smoke script.
- `git diff --check`: pass. Nonfatal bundle-size warning remains unless noted elsewhere.
- Remote CI has not been observed: GitHub API is proxy-blocked. Native Git push works. No API key, paid runner or recurring Work scheduler is used.
