# Sprint 13 validation — 2026-10-20

Tested source: `6e542ead3746755586aebb8841bd24502b8ba8ea`. Node 22.23.3, real headless Chromium at laptop sizes.

Eight economically distinct connected cities, four rival archetypes, equipped starter companies and a 104-week national campaign alongside the preserved foundation sandbox. Six weighted objectives measure operating profit, liquidity, realized share, innovation, brand and geographic reach; cash alone cannot win. Tests complete all 104 weeks with quarterly JSON replay checkpoints and valid terminal scoring; browser starts and advances a national campaign.

- `npm run verify`: 46/46 behavioral tests, TypeScript and Vite production build pass.
- `npm run test:browser`: pass; isolated Vite server and fresh storage. Regression coverage includes map camera/layers, entity context, save/reload/reset/recovery and weekly review workflow, plus the active sprint's checks in the committed smoke script.
- `git diff --check`: pass. Nonfatal bundle-size warning remains unless noted elsewhere.
- Remote CI has not been observed: GitHub API is proxy-blocked. Native Git push works. No API key, paid runner or recurring Work scheduler is used.
