# State, migration and replay contract

Current **save version 9**, **replay rules version 1**. The local save key remains `marketverse:sprint01:state` to preserve existing user saves.

`GameState` contains identity/seed/calendar, cities, companies, products, facilities, policies, projects, command IDs, located stock lots, factories, company finance/opening balances, journals, role-based staff, awareness, macro baselines/events, reports, campaign and replay.

The authored world model lives outside saves because it is immutable rules data. `CITY_PROFILES` defines sector, annual growth, wage, rent, tax, talent and infrastructure for every national city. `WORLD_ENTITIES` defines all 57 illustrated map entities with a stable ID, owning city, type, map position, level, condition, workforce, capacity, public upkeep and four local-effect values. UI selections reference these stable IDs with `kind: "world"`.

`COUNTRIES` defines all 38 named political regions visible inside the seven illustrated continents. Each country has a stable ID, label anchor, continent, capital, nearest operating city, economic specialty and population/GDP/tax/stability/infrastructure/trade stats. Country selections use `kind: "country"`. Coarse continent land polygons constrain nearest-label hit testing so open ocean is not selectable; cities, facilities and world entities retain higher pointer priority.

- Geography uses stable city IDs and world coordinates. The fixture remains three cities; national mode is eight connected cities with four distinct AI archetypes.
- One aggregate (`cityOperationalStats`) combines each city profile with the condition-adjusted contribution of all its public entities. Demand, factory and store capacity, shipping cost/lead time, rent/tax, payroll, R&D and annual population growth consume this aggregate or its authored profile fields.
- Company facilities expose derived level, condition, workforce, capacity, efficiency and weekly cost. Their persisted identity and placement schema remains unchanged, so version-9 saves do not need migration.
- Product IDs remain stable across saves. R&D creates a new revision/ID with a parent; old stock retains its attributes and lot cost. Policies switch production to the new SKU, while legacy inventory can still sell.
- Goods and credits are integers. Credits are the smallest game currency unit. Every journal sums signed debit amounts to zero. Inventory cost includes cargo while in transit.
- Continuous awareness, macro indices and power are rounded to nine decimal places at state transitions. Preference weights are quantized before Hamilton integer allocation. Brand scoring accumulates integer nanounits to avoid object-order-dependent sums.
- Projects reserve money/goods when committed. `createdWeek`, `dueWeek`, `remaining` and status must agree with the calendar. Completed construction commissions an asset; hiring adds paid capacity after two weeks.
- Reports are ordered one per resolved week. Recognized revenue/COGS/expenses/cash movements reconcile to their journal week. Historical pre-ledger reports remain explicitly distinguishable.

## Historical versions

1. Foundation: three-city global stock, calendar and placeholder reports.
2. Policies, reviewed commands and construction/research/shipment queues.
3. Located cost-basis stock/cargo and factory operations.
4. Double-entry finance and financial reports.
5. Product attributes, revision lineage and lifecycle.
6. Role staffing, targeted media and funded awareness.
7. Macro baseline, seasonality and seeded events.
8. Foundation/national campaign mode and multi-axis results.
9. Canonical baseline plus ordered player commands for replay, imported report validation and fixed continuous-state precision.

Migrations preserve identity, progress, balances, stock and prior records. On introduction of the ledger, a balanced opening snapshot represents existing assets/liabilities; historical transactions are not invented. Aggregate stock is assigned to an owned opening node (or the first city if an old save has no facility). Legacy replay starts at the imported checkpoint because earlier player commands did not exist in those save formats.

`tests/fixtures/` contains actual week-1 and week-2 exports from each historical engine version, including pending projects. They are tested through migration, future turns, JSON resume and new replay. Unsupported or corrupt data is rejected before UI replacement. Files are limited to 20 MB; replay verification has a worker time budget and preserves the existing save on failure.

Game saves are local, editable files, not signed multiplayer records. They contain fictional simulation state and no credentials. The checkpoint replay includes its initial snapshot and ordered canonical commands. Identical supported rules and inputs must reproduce the same canonical terminal state; the production browser/Node check compares complete bytes and SHA-256 hashes.
