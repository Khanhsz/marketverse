# Sprint 01 validation — 2026-10-20

Tested source: `eed7a83ce5cfe4ad6cf712e91d04ff986b7b7f01` (application unchanged from `9698232`). Node 22.23.3, Chromium, 1366×768.

- `npm run verify`: 10/10 engine tests; TypeScript and Vite build pass.
- `node scripts/check-sprint-state.mjs`: pass.
- Start `npm run dev -- --port 5173 --strictPort`, then `npm run test:browser`: pass.
- Real canvas rendered without data-error or uncaught page errors; clicked Northport, Central City and South Bay and observed matching panels.
- Next Week persisted W02 to localStorage and survived reload. Reset returned W01 and Central City. Company/map tabs worked; no horizontal overflow at laptop size.
- Selected city resets to Central City on reload by current design; only game state is persisted.
- Nonblocking production bundle-size warning remains. No economics are claimed.

Browser setup: `npm ci`; use system Chromium (`CHROMIUM_PATH` override supported), or install the Playwright browser with `npx playwright install chromium`. Run smoke in a fresh browser context. Screenshots are generated under ignored `.browser-artifacts/`.

No Work/Codex scheduler tool is exposed in this session. No recurring coding task was created; CI is a verifier only. No API key or paid runner was introduced.
