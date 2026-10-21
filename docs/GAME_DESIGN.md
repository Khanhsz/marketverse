# MarketVerse — Game Design Source of Truth

## Product vision
Build a company, understand the market, shape the economy. An original strategic business simulator where the map is the primary play surface; decisions are explained by an interconnected economic simulation rather than hidden random scoring.

### Pillars
1. **Map-first:** world economy is legible as geographic nodes and routes; panels are contextual, not the entire game.
2. **Systems thinking:** product/pricing/brand/operations/finance influence each other.
3. **Fair and explainable AI:** competitors make resource-constrained strategies; reports explain cause and effect.
4. **Meaningful weekly cadence:** policies persist, multiweek projects progress, weekly reactions are meaningful rather than tedious.

## Core loop
1. Weekly briefing: prior results, economy, competition.
2. Inspect market and analyze cities/segments.
3. Choose decisions: pricing, marketing, product, production, shipping, staffing, capex.
4. Confirm weekly orders and advance one week.
5. Resolve simultaneous AI and player outcomes deterministically.
6. See weekly reports and updated geographic assets, then repeat.

## Weekly time system
- One turn = one week; weeks 1–52/year, 104-week starter campaign. Every 13 weeks is a summary/reporting quarter, **not a turn**.
- Persistent policies: pricing, ad budgets, staffing and target production remain active until edited.
- Action latency (design defaults, to balance later): shipping 1–3 weeks, R&D 6–12, stores 3–8, factories 8–20.
- Calendar and queued actions must survive save/load.

## World
- Fictional country for initial release; scope grows from 3 test cities to 8 Alpha cities.
- Cities have population, segments, spending power, wages, infrastructure, growth and demand.
- Each national city also has a sector, rent and tax environment, talent pool and a roster of public map entities. Airports, ports, warehouses, factories, commercial centers, residential districts, headquarters and urban cores contribute condition-adjusted demand, logistics, productivity or retail effects.
- The illustrated world contains 38 selectable countries across seven continents. Country inspection exposes capital, population, GDP index, taxation, stability, infrastructure, trade openness and economic specialty; it provides world context without changing the current eight-city campaign scope.
- Companies have their own assets, inventory, stores, balance sheets, rival intentions and geography.
- Logistics graph maps routes, shipping costs and lead times to serviceable markets.
- Facility output and cost are local: infrastructure and nearby entities affect capacity, rent and tax affect weekly cost, headquarters location affects payroll, and talent affects R&D economics.
- No fog; uncertainty is market *information quality*, not masked map tiles.

## Industry
Start with consumer electronics/home appliances. Define SKUs using modular quality, durability/design/performance and unit-cost attributes. Future data packs may add bikes/mobility, packaged foods and apparel without changing simulation fundamentals.

## Customer segments
Three starter segments: Value, Mainstream, Premium. Each segment has relative preferences for affordability, quality, brand, accessibility and design. Demand, willingness to pay and utility vary across cities and time.

## Strategic phases
- Startup: product-market fit in first city.
- Regional expansion: distribution, inventory, price wars.
- National scale: additional factories, portfolio of cities.
- Corporate scale: multiple brands/products, capital allocation; post-Alpha.
- International map: explicitly later and not in Alpha.

## Campaign modes
- Campaign: 104 weekly turns. Evaluate profit, liquidity, market share, brand, customer fit, innovation and solvency; no single raw-money win condition.
- Sandbox: unrestricted turns after core engine is stable.
- Challenge/multiplayer: later.

## Difficult choices
Scale vs margin, inventory vs cash, capex vs financing, brand vs discounting, centralized production vs delivery delay, quality vs cost. Multiple viable strategies must remain possible.

## Exclusions for Alpha
Global map, multiplayer, full city-building 3D, individual consumer agents, dozens of industries, real-time tick, complex M&A and live external economic feeds.

## Source caveat
Earlier project conversations explored 19 reverse-engineering iterations of Marketplace Simulation. This repository contains the intentionally abstracted, original MarketVerse design assumptions; do not claim external algorithms or proprietary source were recovered. Review game content for originality and implement from these specifications.
