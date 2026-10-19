# Sprint 14 validation — 2026-10-20

Tested source: `e5b5f2175cb2ffc5635444b9a5477c9e7a95c4cb`. Node 22.23.3, real headless Chromium at laptop sizes.

Replicable five-policy, four-seed sweep completes 20 campaigns of 104 weeks with zero bankruptcies, 14 profitable outcomes and no physical/cash/fulfillment invariant failures. Three policies profit across all four seeds; losing volume/brand outcomes remain in raw results. Adversarial order/loan/replay checks pass. Tracked balance methodology and JSON/Markdown results record roughly 40 ms maximum p95 engine turn time.

- `npm run verify`: 48/48 behavioral tests, TypeScript and Vite production build pass.
- `npm run test:browser`: pass; isolated Vite server and fresh storage. Regression coverage includes map camera/layers, entity context, save/reload/reset/recovery and weekly review workflow, plus the active sprint's checks in the committed smoke script.
- `git diff --check`: pass. Nonfatal bundle-size warning remains unless noted elsewhere.
- Remote CI has not been observed: GitHub API is proxy-blocked. Native Git push works. No API key, paid runner or recurring Work scheduler is used.
