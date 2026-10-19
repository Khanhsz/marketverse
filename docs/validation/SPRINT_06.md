# Sprint 06 validation — 2026-10-20

Tested source: `3a4ec833105aa8ea7328a66bf1e2e9221c063084`. Node 22.23.3, real headless Chromium at laptop sizes.

Localized cost-basis inventory lots, cash/material/labor/capacity-limited production, owned-node shipping with graph lead times and reserved cargo. Fulfillment consumes only local stock; tests prove transit isolation, no negative inventory, no phantom sales, lot COGS and deterministic save/resume. Save version 3 migrates old aggregate inventory into opening lots.

- `npm run verify`: 27/27 behavioral tests, TypeScript and Vite production build pass.
- `npm run test:browser`: pass; isolated Vite server and fresh storage. Regression coverage includes map camera/layers, entity context, save/reload/reset/recovery and weekly review workflow, plus the active sprint's checks in the committed smoke script.
- `git diff --check`: pass. Nonfatal bundle-size warning remains unless noted elsewhere.
- Remote CI has not been observed: GitHub API is proxy-blocked. Native Git push works. No API key, paid runner or recurring Work scheduler is used.
