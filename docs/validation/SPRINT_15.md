# Sprint 15 validation — 2026-10-20

Tested source: `534d6a5097a3bf42a04ae6bd5923e0a86cc03eb9`. Node 22.23.3, real headless Chromium at laptop sizes.

Native focus-contained dialogs with explicit focus return, optional keyboard shortcuts, accessible city/entity alternatives and keyboard map pan/zoom/fit. Added onboarding guide, collapsible/context-reset panels, clearer type/contrast, constant-readable map labels and demand availability labels. Dirty-frame rendering avoids an idle render loop. Browser keyboard/mouse journeys pass; measured laptop/DPR profile and screenshots cover 1024, 1280 and 1440 widths.

- `npm run verify`: 48/48 behavioral tests, TypeScript and Vite production build pass.
- `npm run test:browser`: pass; isolated Vite server and fresh storage. Regression coverage includes map camera/layers, entity context, save/reload/reset/recovery and weekly review workflow, plus the active sprint's checks in the committed smoke script.
- `git diff --check`: pass. Nonfatal bundle-size warning remains unless noted elsewhere.
- Remote CI has not been observed: GitHub API is proxy-blocked. Native Git push works. No API key, paid runner or recurring Work scheduler is used.
