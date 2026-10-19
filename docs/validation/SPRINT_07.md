# Sprint 07 validation — 2026-10-20

Tested source: `23a8423273dcb5e91259ed327ef7e6bf1716523b`. Node 22.23.3, real headless Chromium at laptop sizes.

Double-entry integer-credit ledger, opening balances, inventory and cash reconciliation, capitalized construction, loans/principal/interest, payroll/rent/marketing, payables and prolonged-default bankruptcy. Tests prove net-worth/profit reconciliation, no profit from loans, asset commissioning, tamper rejection and identical JSON replay. Browser verifies profit/capex reporting alongside weekly order review.

- `npm run verify`: 31/31 behavioral tests, TypeScript and Vite production build pass.
- `npm run test:browser`: pass; isolated Vite server and fresh storage. Regression coverage includes map camera/layers, entity context, save/reload/reset/recovery and weekly review workflow, plus the active sprint's checks in the committed smoke script.
- `git diff --check`: pass. Nonfatal bundle-size warning remains unless noted elsewhere.
- Remote CI has not been observed: GitHub API is proxy-blocked. Native Git push works. No API key, paid runner or recurring Work scheduler is used.
