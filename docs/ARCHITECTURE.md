# MarketVerse technical architecture — Alpha

React 19 + TypeScript + Vite form the application shell; PixiJS 8 renders the vector map. The simulation is pure TypeScript with no browser, network, wall-clock or model API dependency. Node 22 runs its deterministic tests. Pixi is loaded separately from the initial app bundle; the static map renders only when an interaction/state update marks it dirty.

## Modules

- `src/data/`: explicit country, industry, budget, capacity, AI, macro and campaign constants.
- `src/engine/game.ts`: immutable weekly transaction, validation, schema migration and canonical saves.
- `orders.ts`: typed persistent policies, financing, reviewed commitments and timed projects.
- `demand.ts`: city × segment × SKU utility, outside choice and conserved integer allocation.
- `operations.ts`: located cost-basis lots, reserved cargo, component kits, workforce/cash-constrained production and stock-limited fulfillment.
- `finance.ts`: balanced signed-debit journal, opening balances, assets, liabilities, expenses, cash, arrears and insolvency.
- `ai.ts`: observations limited to own resources and previous public prices/macro; four strategies use the same order executor as the player.
- `products.ts`, `people.ts`, `macro.ts`: versioned product design, paid R&D, hiring/media/awareness and seeded seasonal economic changes.
- `analytics.ts`, `campaign.ts`, `scenarios.ts`: reconciled reporting, multi-axis 104-week objectives and audited multi-seed policy sweeps.
- `replay.ts`, `json.ts`, `precision.ts`, `report-validation.ts`: checkpointed command replay, canonical object order, fixed continuous-state precision and imported history validation.
- `src/ui/`: contextual map/entity panels, native modal weekly review/reports/guide/results and a worker for imported replays.

## Weekly resolution

Validate current state → form AI orders from the previous public snapshot → clone state → resolve seeded public macro change → apply player and AI commitments through common validation → advance projects exactly one week → allocate workforce and manufacture → compute segment demand → fulfill from local inventory → recognize expenses/payables → update funded awareness → reconcile reports/journal → record canonical player command → advance calendar and campaign.

AI decisions intentionally precede resolution of the new macro event so they do not see a future event the human could not see while planning. Policy changes remain private until simultaneous resolution. Reports separate measured flows/accounting from modeled preference effects.

## Persistence and UI

Save format 9 accepts historical formats 1–8 through explicit migrations. Goods/money use integers; persisted awareness/macro state uses nine decimals. Canonical JSON key order and checkpointed command logs support exact replay; production Chromium and Node equality are a release gate. Imported replay verification runs in a local worker and never sends data to a service.

Invalid saves remain untouched with export/reset recovery. File imports validate before replacement and require a local user confirmation. Native dialogs contain focus; optional single-key shortcuts can be disabled. Keyboard city/entity selectors provide alternatives to canvas pins. Camera position is independent of simulation and survives selection, layer switches, panel changes and resize.

## Verification and release

`npm run verify:alpha` combines behavior/build checks, dev browser regression, production 104-week UI journey, cross-runtime replay, laptop/DPR profile and multi-seed balance audits. GitHub Actions performs the main automated gates without an API key. The candidate archive contains a source/version/file-hash manifest; it is prepared locally, never automatically deployed. Human gameplay review is required before any public release.
