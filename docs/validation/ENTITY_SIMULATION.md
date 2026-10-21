# City and entity simulation follow-up — 2026-10-21

## Scope

The 57 illustrated landmarks are now stable gameplay entities rather than decoration-only sprites. Every entity has an owning city, type, level, condition, workforce, capacity, weekly public upkeep and demand/logistics/productivity/retail effects. Every national city has a sector, annual growth, wage, rent, tax, talent and infrastructure profile.

A single deterministic aggregate connects these values to the simulation:

- demand uses condition-adjusted local entity demand effects;
- factories, stores, warehouses, HQ and R&D facilities derive capacity and efficiency from local infrastructure, public entities and talent;
- freight cost and lead time use infrastructure and logistics entities at both endpoints;
- rent and tax affect weekly facility cost, HQ location affects payroll, and talent affects R&D cost;
- annual population growth uses the authored city growth rate with bounded seeded variation;
- sales staff remains a national shared constraint while each city's stores impose a local capacity constraint.

Map selection resolves stable `world` IDs. The selected landmark receives a map ring and its complete operating stats appear in both the department panel and advanced inspector. City views list every local public entity. Existing save version 9 remains compatible because the new world model is immutable rules data and facility stats are derived.

## Verification

- `npm run verify:alpha` passed from the final source tree.
- 66 Node behavioral tests passed, including three new world/entity contract tests.
- Production build and artwork integrity passed.
- Browser smoke selected `central-factory-1` directly on the Pixi canvas and verified its stats.
- Production map stability passed with one canvas and no uncaught errors.
- The 104-week production campaign completed; Node and Chromium canonical replay hashes matched exactly.
- Laptop/DPR profile passed. At 1440×900 DPR 2, keyboard-pan p95 was 57.5 ms after capping Pixi backing resolution at 1×.
- All 20 seeded balance campaigns completed without bankruptcy; strategy outcomes remain differentiated.

Generated runtime evidence is in `ALPHA_BROWSER_16.json`, `ALPHA_CROSS_RUNTIME_16.json`, `UI_PROFILE_15.json` and `BALANCE_16.json`.
