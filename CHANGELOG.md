# MarketVerse Changelog

## 2026-10-20 — Sprint 04 accepted
- Typed weekly review, atomic idempotent commands, persistent price/production policies, budgeted construction/research/shipment queues and version-1 migration. Browser commits a 70,000-credit plan, reloads and verifies retained policies, project progress and cash.
- Validation: 21 tests, build and browser smoke pass; `2d66fb6`.

## 2026-10-20 — Sprint 03 accepted
- Stable city/company/facility selection from map markers and contextual navigation; all five facility kinds supported.
- Validated ownership, reciprocal transport references, eight-city capability and placement constraints while preserving the three-city starter.
- Malformed saves remain intact with export/reset recovery. 17 tests, build and expanded real browser smoke pass.
- Sprint 04 is the next implementation checkpoint. No recurring Work task is configured; GitHub API access is proxy-blocked.

## 2026-10-20 — Sprint 02 accepted
- Persistent Pixi renderer, vector country, pointer pan and bounded cursor-anchored zoom, camera controls and resize retention.
- Five labeled state-driven layers: Market, Competition, Operations, Logistics, Economy.
- Camera behavior tests and real browser interactions pass; browser runner owns its temporary Vite service. CI now includes Chromium smoke and frozen dependency installation.

## 2026-10-20 — Sprint 01 accepted
- Added repeatable Chromium smoke, Playwright dev tooling and dependency lockfile.
- Verified all city selections, tabs, week advancement, local save/reload, reset, laptop layout and no page errors.
- 10 engine tests and production build pass; transitioned to Sprint 02.

## 2026-10-20 — Agent-ready foundation
- Canonical game design, architecture, simulation, schema, UX and sprint roadmap committed for new Codex/ChatGPT Work sessions.
- Added explicit no-API-key automation and quality gate contract.
- Kept Sprint 01 awaiting browser validation; prior GitHub CI passed 10 tests and build.

## 2026-10-20 — Sprint 01 scaffold
- React, TypeScript, PixiJS sample country UI and weekly engine.
- Deterministic seeded RNG, validation, local save/load and calendar rollover tests.
- CI workflow for build and tests.
