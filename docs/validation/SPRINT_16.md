# Sprint 16 validation — Alpha 0.1.0-alpha.1 — 2026-10-20

Tested source: `b020d4d973ae142e966f5017cca77792150caf5d`. Node 22.23.3 and production Chromium 154.0.8037.57. Repository status: **all 16 sprint acceptance gates complete at `alpha_candidate`**. Human gameplay/release review is separate and still pending.

## Executed gates

`npm ci --no-audit --no-fund` completed from the frozen lockfile. `npm run verify:alpha` then completed successfully on the committed source:

- Formatting check, **53/53 behavioral tests**, TypeScript and Vite production build pass. No tests are skipped or disabled. Tests include 16 historical initial/week-2 JSON exports plus a compressed completed historical national campaign (17 save fixtures total), pending-project completion, replay and corrupt-import rejection.
- Dev browser regression passes for city/company/facility context, all map layers, cursor zoom, drag suppression, camera retention, controls, local save/recovery, policies, queues, R&D, people/media, reports, keyboard focus containment/return and optional shortcuts.
- **Production** UI commits all **104 weeks** in an eight-city/four-rival campaign. It creates projects, hires, researches and ships, reloads at year rollover, scores the terminal state, exports/imports a completed save in a fresh context and verifies a full replay in a local worker. Invalid/future files preserve current progress. Complete 52-week reporting is checked. No uncaught page errors.
- Cross-runtime check compares the complete canonical state and hash after replaying all **104 commands in Node** against the production browser export. Exact equality passes, rather than a floating-point tolerance. Run ID `57fed1ce-4769-4b57-9aab-854aa34fe75c`; canonical state SHA-256 `17ba2b19b3e4003899d707db013e11906cdb0344e001ff45e48eb3b0ebb9d059`.
- Laptop profile: 1024×768 DPR1: p95 16.9 ms, 1280×800 DPR1: p95 16.8 ms, 1440×900 DPR2: p95 48.7 ms. One canvas, no horizontal overflow or uncaught errors at the tested viewports. Screenshots of the map and campaign result were visually inspected. These are cloud software-renderer observations, not untested hardware guarantees.
- Balance sweep: **20/20** campaigns finish 104 weeks, **0 player bankruptcies**, **14 positive-profit outcomes**. Every turn audits physical goods including transit, cash postings and fulfillment. Three policies profit on all four seeds; negative-profit/stockout outcomes remain recorded. Maximum per-campaign engine p95 **45.5 ms**, observed individual maximum **67.6 ms** in this final run.
- State contract passes before final acceptance; it is rechecked after recording completed sprints 1–16.

## Candidate artifact

`npm run package:alpha` rebuilt the source into a static archive and generated `release-manifest.json` plus an outer checksum. All **13 bundle files** were read back from the archive and matched to their SHA-256 values; paths were checked to stay relative.

- Archive: `.artifacts/marketverse-0.1.0-alpha.1.tar.gz` (278,703 bytes).
- Archive SHA-256: `2aefde66830b8d3340dc2424efdb392803a8453e7beb185f9458623cbd35351e`.
- Source and per-file hashes: `ALPHA_CANDIDATE.json`.
- Save format 9; replay rules version 1. The earlier oversized initial JS chunk warning is resolved by loading Pixi/map code separately.

## Limits and next action

No severity-1 blocker was found in these selected journeys. This does not replace human playtesting, broader browser/accessibility coverage or future balance tuning. See `../KNOWN_ISSUES.md` and `../ALPHA_REVIEW.md`.

Source/checkpoint is pushed on `codex/marketverse-sprint-continuation`; `main` is not merged, no public deployment/release is created, and remote CI has not been observed because the GitHub API was proxy-denied. No Work/Codex scheduling capability is exposed, so no recurring coding task was created. No OpenAI API key or separate model API service is used.

Reusable `install_script`/`start_skill` were updated in the environment draft. Draft saving does not publish the filesystem snapshot or prove restoration in a new task; environment settings review/save/publish remains a user action.
