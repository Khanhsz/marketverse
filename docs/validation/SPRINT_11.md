# Sprint 11 validation — 2026-10-20

Tested source: `fdca9e4bae6562c1054426c14be30107cd018f52`. Node 22.23.3, real headless Chromium at laptop sizes.

Measured revenue-to-profit bridge, SKU/city/segment demand and fulfillment, realized market shares, stock-versus-staff loss attribution, readable recent-profit chart and complete/partial 13-week and 52-week aggregation. Map overlays now show resolved potential, ownership share, local stock/output and incoming cargo. Tests reconcile aggregate reports directly to ledger; browser navigates week/quarter/year reports.

- `npm run verify`: 42/42 behavioral tests, TypeScript and Vite production build pass.
- `npm run test:browser`: pass; isolated Vite server and fresh storage. Regression coverage includes map camera/layers, entity context, save/reload/reset/recovery and weekly review workflow, plus the active sprint's checks in the committed smoke script.
- `git diff --check`: pass. Nonfatal bundle-size warning remains unless noted elsewhere.
- Remote CI has not been observed: GitHub API is proxy-blocked. Native Git push works. No API key, paid runner or recurring Work scheduler is used.
