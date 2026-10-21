# MarketVerse Changelog

## 2026-10-20 — P0 map stability follow-up
- Restored the approved clean PNG, replacing the two-byte invalid upload; retained interactive gameplay overlays above a persistent artwork container.
- Fixed business-zoom redraws, hidden facility hit targets and failed-image retry without losing the current save.
- Added a real PNG/checksum gate to every build and a production map regression to CI/Alpha verification.
- Updated existing browser journeys for planner tabs and zoom visibility; formatted pre-existing UI/map edits so the required formatting gate passes.
- Local validation: 56 behavior tests and build, map production regression, general browser regression, 104-week production campaign and exact Node/Chromium replay pass. Existing simulation result is unchanged. See `docs/validation/P0_MAP_STABILITY.md` for deployed acceptance and remaining human review.
- Updated the actual Render connection state and recorded the authorized step-by-step product backlog. No gameplay economy, industry, API key or hosting resource changes.

## Render playtest deployment preparation
- Added `render.yaml` for a Node 22.23.3 production build published as a Render Static Site from the completed Alpha branch, with automatic deployments disabled.
- Added `docs/RENDER.md` with private-repository connection, manual setup, playtest and browser-local save instructions. No Render service or public URL has been created; account connection and site creation require the owner's Render session.
- Local validation: `npm run verify` (53 tests, formatting, TypeScript/build), `npm run test:browser` and sprint-state check pass. Render-side Blueprint validation/build and GitHub CI have not been observed.

## 2026-10-20 — Sprint 16 accepted · Alpha 0.1.0-alpha.1
- All 16 roadmap sprints accepted at `alpha_candidate`; human gameplay review remains required before public release.
- Save format 9, canonical checkpoint/command replay, exact production Chromium/Node equality, historical v1–v8 initial/pending/terminal migrations and validated import/export with preservation on failure.
- Full production UI campaign commits 104 weeks with construction, R&D, hiring, shipping, reload, result scoring and exported save/replay recovery. Local worker verification keeps imports off the main UI thread.
- Fixed continuous-state precision removes runtime-dependent last-bit differences; map code is split from initial app load and the earlier large-chunk warning is resolved.
- 53 behavioral tests, formatting, TypeScript/build, browser regression, laptop/DPR profile and 20 audited 104-week balance campaigns pass. Tested source `b020d4d973ae142e966f5017cca77792150caf5d`.
- Versioned static archive plus SHA-256/source/file manifest prepared locally. No deployment, main merge, recurring Work job, OpenAI API key or separate model API charge.


## 2026-10-20 — Sprint 15 accepted
- Native focus-contained dialogs with explicit focus return, optional keyboard shortcuts, accessible city/entity alternatives and keyboard map pan/zoom/fit. Added onboarding guide, collapsible/context-reset panels, clearer type/contrast, constant-readable map labels and demand availability labels. Dirty-frame rendering avoids an idle render loop. Browser keyboard/mouse journeys pass; measured laptop/DPR profile and screenshots cover 1024, 1280 and 1440 widths.
- Validation: 48 tests, build and browser smoke pass; `534d6a5`.

## 2026-10-20 — Sprint 14 accepted
- Replicable five-policy, four-seed sweep completes 20 campaigns of 104 weeks with zero bankruptcies, 14 profitable outcomes and no physical/cash/fulfillment invariant failures. Three policies profit across all four seeds; losing volume/brand outcomes remain in raw results. Adversarial order/loan/replay checks pass. Tracked balance methodology and JSON/Markdown results record roughly 40 ms maximum p95 engine turn time.
- Validation: 48 tests, build and browser smoke pass; `e5b5f21`.

## 2026-10-20 — Sprint 13 accepted
- Eight economically distinct connected cities, four rival archetypes, equipped starter companies and a 104-week national campaign alongside the preserved foundation sandbox. Six weighted objectives measure operating profit, liquidity, realized share, innovation, brand and geographic reach; cash alone cannot win. Tests complete all 104 weeks with quarterly JSON replay checkpoints and valid terminal scoring; browser starts and advances a national campaign.
- Validation: 46 tests, build and browser smoke pass; `6e542ea`.

## 2026-10-20 — Sprint 12 accepted
- Seeded bounded purchasing-power trends, population growth, seasonal demand and narrated thirteen-week macro events with recorded before/after effects. AI uses the previous public macro snapshot, preserving simultaneous-order fairness. Tests replay 52 weeks across seeds, check bounds and causal event references, seasonality, AI response and desktop runtime; browser observes the week-13 event.
- Validation: 44 tests, build and browser smoke pass; `9e2e96d`.

## 2026-10-20 — Sprint 11 accepted
- Measured revenue-to-profit bridge, SKU/city/segment demand and fulfillment, realized market shares, stock-versus-staff loss attribution, readable recent-profit chart and complete/partial 13-week and 52-week aggregation. Map overlays now show resolved potential, ownership share, local stock/output and incoming cargo. Tests reconcile aggregate reports directly to ledger; browser navigates week/quarter/year reports.
- Validation: 42 tests, build and browser smoke pass; `fdca9e4`.

## 2026-10-20 — Sprint 10 accepted
- Persistent city/segment media budgets build and decay bounded brand awareness only when funded; demand uses measured awareness. Two-week role-specific hiring, onboarding cost, salary payroll, research capability and finite sales/production capacity are enforced. AI hires and markets through the same rules. Browser commits targeted media and hiring, then verifies workforce arrival and awareness growth.
- Validation: 40 tests, build and browser smoke pass; `dd44f56`.

## 2026-10-20 — Sprint 09 accepted
- Versioned SKUs with quality/design/performance/durability, segment positioning and explicit component/assembly BOM. R&D spends cash and takes multiple turns to create a new SKU, retaining original attributes and lot cost on old stock; ambitious designs cost more. Migration preserves previous SKU economics. Browser observes the completed R2 portfolio after committing a design.
- Validation: 37 tests, build and browser smoke pass; `1cd91fd`.

## 2026-10-20 — Sprint 08 accepted
- Four bounded AI archetypes plan solely from own resources and previous public market prices, then use shared order, construction, research, shipping and cash rules. A deterministic four-rival 16-week test audits every ledger and replay; browser advances through the playable core and displays rival strategy. Tests verify hidden player policy changes cannot affect AI plans.
- Validation: 34 tests, build and browser smoke pass; `10dcdd9`.

## 2026-10-20 — Sprint 07 accepted
- Double-entry integer-credit ledger, opening balances, inventory and cash reconciliation, capitalized construction, loans/principal/interest, payroll/rent/marketing, payables and prolonged-default bankruptcy. Tests prove net-worth/profit reconciliation, no profit from loans, asset commissioning, tamper rejection and identical JSON replay. Browser verifies profit/capex reporting alongside weekly order review.
- Validation: 31 tests, build and browser smoke pass; `23a8423`.

## 2026-10-20 — Sprint 06 accepted
- Localized cost-basis inventory lots, cash/material/labor/capacity-limited production, owned-node shipping with graph lead times and reserved cargo. Fulfillment consumes only local stock; tests prove transit isolation, no negative inventory, no phantom sales, lot COGS and deterministic save/resume. Save version 3 migrates old aggregate inventory into opening lots.
- Validation: 27 tests, build and browser smoke pass; `3a4ec83`.

## 2026-10-20 — Sprint 05 accepted
- Deterministic city/segment/SKU demand with affordability, segment fit, quality and an explicit no-purchase option. Hamilton integer allocation conserves buyers and is order-stable; tests verify price elasticity, quality response and no revenue from preferences. Browser inspects the persisted demand report.
- Validation: 24 tests, build and browser smoke pass; `9d8240e`.

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

## 2026-10-21 — World atlas entities

- Fit the approved fictional world map without stretching inside the existing camera bounds.
- Add 57 authored landmarks across seven continents using eight transparent isometric sprite types.
- Replace facility squares with sprites and ownership dots; preserve selection and simulation/save rules.
- Update eight visual city anchors and production map coverage, including sprite decoding.
