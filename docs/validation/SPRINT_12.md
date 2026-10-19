# Sprint 12 validation — 2026-10-20

Tested source: `9e2e96df2d63b2529098f834eecb0d450174a14d`. Node 22.23.3, real headless Chromium at laptop sizes.

Seeded bounded purchasing-power trends, population growth, seasonal demand and narrated thirteen-week macro events with recorded before/after effects. AI uses the previous public macro snapshot, preserving simultaneous-order fairness. Tests replay 52 weeks across seeds, check bounds and causal event references, seasonality, AI response and desktop runtime; browser observes the week-13 event.

- `npm run verify`: 44/44 behavioral tests, TypeScript and Vite production build pass.
- `npm run test:browser`: pass; isolated Vite server and fresh storage. Regression coverage includes map camera/layers, entity context, save/reload/reset/recovery and weekly review workflow, plus the active sprint's checks in the committed smoke script.
- `git diff --check`: pass. Nonfatal bundle-size warning remains unless noted elsewhere.
- Remote CI has not been observed: GitHub API is proxy-blocked. Native Git push works. No API key, paid runner or recurring Work scheduler is used.
