# Sprint 09 validation — 2026-10-20

Tested source: `1cd91fd34c922d7bf597f7568cf229e7bc341a4f`. Node 22.23.3, real headless Chromium at laptop sizes.

Versioned SKUs with quality/design/performance/durability, segment positioning and explicit component/assembly BOM. R&D spends cash and takes multiple turns to create a new SKU, retaining original attributes and lot cost on old stock; ambitious designs cost more. Migration preserves previous SKU economics. Browser observes the completed R2 portfolio after committing a design.

- `npm run verify`: 37/37 behavioral tests, TypeScript and Vite production build pass.
- `npm run test:browser`: pass; isolated Vite server and fresh storage. Regression coverage includes map camera/layers, entity context, save/reload/reset/recovery and weekly review workflow, plus the active sprint's checks in the committed smoke script.
- `git diff --check`: pass. Nonfatal bundle-size warning remains unless noted elsewhere.
- Remote CI has not been observed: GitHub API is proxy-blocked. Native Git push works. No API key, paid runner or recurring Work scheduler is used.
