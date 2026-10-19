# Sprint 10 validation — 2026-10-20

Tested source: `dd44f56234e6ebffe2ddc17acab1b6780c50f5f0`. Node 22.23.3, real headless Chromium at laptop sizes.

Persistent city/segment media budgets build and decay bounded brand awareness only when funded; demand uses measured awareness. Two-week role-specific hiring, onboarding cost, salary payroll, research capability and finite sales/production capacity are enforced. AI hires and markets through the same rules. Browser commits targeted media and hiring, then verifies workforce arrival and awareness growth.

- `npm run verify`: 40/40 behavioral tests, TypeScript and Vite production build pass.
- `npm run test:browser`: pass; isolated Vite server and fresh storage. Regression coverage includes map camera/layers, entity context, save/reload/reset/recovery and weekly review workflow, plus the active sprint's checks in the committed smoke script.
- `git diff --check`: pass. Nonfatal bundle-size warning remains unless noted elsewhere.
- Remote CI has not been observed: GitHub API is proxy-blocked. Native Git push works. No API key, paid runner or recurring Work scheduler is used.
