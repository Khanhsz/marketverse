# MarketVerse — Deterministic Weekly Simulation Specification (Target Architecture)

Current `src/engine/game.ts` is Sprint 01 scaffolding; this document specifies forward implementation, not capabilities already present.

## Weekly pipeline
1. Verify player commands and budgets. Save immutable snapshot of decisions.
2. Roll forward exogenous macro conditions using seeded PRNG; record event IDs.
3. AI selects actions with its own limited information and resource constraints.
4. Update in-flight construction, R&D, hiring and transport queues.
5. Acquire inputs, resolve production with capacity and cost constraints.
6. Allocate finished inventories to city distribution nodes, considering lead times.
7. Calculate city x segment market demand and SKU preference scores.
8. Allocate potential orders to products and fulfillment channels, cap by available units.
9. Record actual fulfilled sales, COGS, fees, wages, rent, marketing and interest.
10. Post balanced ledger entries, update brand/reputation/market share/project progress.
11. Generate auditable Weekly Report and next state; persist save snapshot.

AI should not observe player unrevealed orders. For simultaneous competition, use previous-period observable state plus committed strategic policies.

## Demand
Potential demand for city c, segment s, week t:
D(c,s,t) = addressable_population(c) * segment_share(c,s) * purchase_probability(c,s,t) * macro_multiplier(t).
Normalize units explicitly; demand may be fractional internally, but sold quantity is integer.

## Choice shares
A configurable utility U(c,s,SKU,t) scores match to segment preferences, after price/quality/brand/distribution. Softmax of utilities may allocate preference probabilistically; include an outside/no-purchase option. Configurable price elasticity and temperature. Must not use raw advertised interest as actual sales.

## Market clearing
- Orders depend on preference and reachable channel presence.
- Fulfilled_units <= available_units at reachable inventory node.
- Unfulfilled demand may spill to substitutes after limited allocation passes; prevent duplicate demand counted as multiple sales.
- Units and currency require deterministic rounding and traceable records.

## Production and logistics
Available production = min(capacity, labor-constrained throughput, materials-constrained throughput). All inputs have unit costs. Transit inventory is not available until ETA. Warehouses have carrying costs; stores may stock out.

## Finance
Operating profit = revenue - COGS - wages - rent - logistics - marketing - other OPEX.
Cash movement != profit. Capex draws cash and creates capital assets. Loans increase cash *and* debt, interest is expensed, principal repayment reduces debt and cash. Accounting equation must reconcile. Do not create revenue when inventory sold is zero.

## AI
Four archetypes for Alpha: Cost Leader, Premium Innovator, Regional Specialist, Aggressive Expander. Use policy-and-utility or bounded lookahead, no omniscience. AI limited by money, facilities, research and lead times.

## Reports
Weekly reports expose revenue, fulfilled orders, lost demand, inventory, gross/operating profit, cash movement, market share and 2–4 directional causes. Mark inferred vs measured. Quarter/year are aggregations over 13/52 weeks, not alternate simulation cycles.

## Invariants and tests
- Same seed+initial state+actions => same transition and reports.
- Money and inventory conserved subject to explicit flows/entries.
- Non-negative inventory, no double booking, no negative capacity.
- No player/AI transaction if it lacks prerequisite resources.
- Save/load/resume produces same forward sequence.
- AI decision engine never mutates hidden player data.

## Balance
Run multi-seed multi-strategy simulations across 104 weeks; inspect insolvency rates, runaway snowballing, dominant strategies and economic stability. Tune using config rather than hardcoded fixes.
