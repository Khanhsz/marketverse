# MarketVerse — State and Data Schema

## Existing Sprint 01 contract
See `src/engine/game.ts`. Persisted `GameState` currently includes:
`version,gameId,seed,absoluteWeek,year,week,playerId,cities,companies,products,facilities,reports`.
Models:
- City: id/name/map x,y, population, purchasing power, three segment weights, transport links.
- Company: id/name, human|ai, cash, debt.
- Product: id, companyId, name, price, unit cost, quality, inventory, target segment.
- Facility: id, companyId, cityId, HQ/store/factory/warehouse/R&D, name.
- WeekReport: report week, events, zero-change placeholder ledger flag.

This is a compact 3-city Foundation, not final economic database. Save key: `marketverse:sprint01:state`.

## Target schemas to introduce incrementally
`GameConfig`: industry configs, difficulty, deterministic version, price/cost parameters.
`WorldState`: region, city, routing graph, wages, taxes, macro drivers, consumers.
`ProductDefinition`: features, SKU lifecycle, R&D prerequisites, bills of material, brand.
`FactoryState`: capacity/efficiency/workforce/input stocks/production orders.
`InventoryLot`: SKU, location, units, cost basis, reserved units.
`Shipment`: origin, destination, ETA week, freight costs, lots.
`StoreState`: city reach, service capacity, rent, pricing/assortment policy.
`HRState`: functional staff, pay, productivity and hiring pipeline.
`CompanyFinancials`: cash, debt, receivables, payables, asset register, double-entry ledger.
`CompetitorStrategy`: archetype, observed rivals, information quality, target returns.
`PlayerOrders`: typed weekly decisions with schedule and budget confirmation.
`Project`: capex/R&D/construction progress across turns.
`WeeklyReport`: demand vs fulfilled sales, explanations, finances, per-city attribution.

## Rules
- Monetary amounts stored in smallest currency units or integer milli-units with documented conversion; avoid floating-point drift.
- Quantities integer at fulfillment, explicit rounding at allocation boundaries.
- Stable IDs rather than array indices in entity references.
- Versioned migrations: never silently discard earlier saves.
- Every schema evolution gets validation and migration tests.
- Geography coordinates in a stable map coordinate system, independent of Pixi screen positions.
- Engine must remain serialization-compatible and deterministic.
