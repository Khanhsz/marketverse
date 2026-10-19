# V17 — Reverse Engineering Notes and Original Multi-Edition Mechanics

## A. Provenance

**Publicly established features, not private implementation:** Marketplace's E-Commerce and Business Strategy covers SEO, PPC, social and website decisions; International Corporate Management adds volatile regional demand and exchange rates; supply-chain simulations split suppliers/resellers and emphasize contract fulfillment; Conscious Capitalism addresses stakeholders, HR, environment and ethics. Relevant official pages:

- https://www.marketplace-simulation.com/entrepreneurship-simulations/
- https://www.marketplace-simulation.com/capstone-simulations/
- https://www.marketplace-simulation.com/supply-chain-simulations/
- https://www.marketplace-simulation.com/compare-our-business-simulations/international-corporate-management-bikes/

**Original, uncalibrated V17 hypotheses:** All specific weights, synthetic FX path, cost assumptions, KPI thresholds, mission definitions and player adaptation code are invented independently. These source files are NOT Marketplace's source code or confirmed numerical behavior.

## B. Common Engine / Quarter Lifecycle

```text
Player Decision Draft (V11–V16 + V17 mode fields)
       |
       v
validate schema, enum bounds & scenario-only fields
       |
       v
adapt specialized inputs (demand / media spend / wages / supplier contract / COGS)
       |
       v
V15 Bikes brand configuration --> V13 Rival AI --> V10 quarter settlement ONCE
       |
       +--> Market demand & brand substitution (V6) + marketing (V7)
       +--> Plant/worker capacity + stockouts + delayed supplier contract (V9/V10)
       +--> HR/R&D/quality/risk + financial ledger / balance validation (V10)
       |
       v
V17 nonfinancial diagnostic indicators and extra mission condition
       |
       v
V12 persistence: schema=6, SHA256 checksum, atomic save, idempotent submissions
```

`v17_persistence.py` includes `v17_latest`, `v17_commits` and `v17_indicators` in the already-serialized `config` map. The save identity contains the active scenario; an edition cannot restore another edition's save. `--mode pc-classic` uses V14's legacy save.

All simulations run on **5 fictional Bikes segments in 2 fictional cities, 4 firms**. They are not official city data.

## C. Mode formulas (synthetic)

### C1. E-Commerce — 6 quarters

Decision fields `v17_web_quality` (0–1), `v17_email_budget` (0–16k), `v17_channel_mix` (`direct`, `retail`, `hybrid`). On each active player offer:

```
creative_fit_bonus = (UX - .50)*.30 + {direct:.07, hybrid:.035, retail:-.035}
distribution_bonus = .24*(UX-.50) + {direct:.055, hybrid:.020, retail:-.035}
new_distribution = clamp(original_distribution+distribution_bonus,0,1)
```

Email/retargeting expense is added to social media budgets, 63% North/37% South for direct, 50%/50% for hybrid, 32%/68% for retail. These are marketing expenses booked through V7. After settlement, budgets are restored to the **user's base budget**, avoiding unintended compound spending in Q2 onward.

Mission: mean `digital_readiness = .62*UX + .38*min(1,email_budget/12000)` over active quarters must be at least `.56` AND Player ranks #1 on the V16 synthetic edition score.

### C2. International — 8 quarters

Q1..Q8 predefined fictional FX proxy: `[1.00,1.14,.89,1.21,.92,1.08,1.17,.94]`. No real-time FX feeds. Southgate acts as the “foreign market” proxy. `foreign_exposure` and `hedge` are [0,1].

```
effective_FX = 1 + (FX-1)*(1-.85*hedge)
new_South_audience = round(current_South_audience * (1 + exposure*(effective_FX-1)*.65))
new_South_reference_price = old_reference_price*(1+exposure*(effective_FX-1)*.55)
unit_cost_multiplier = 1 + clamp(exposure*(1-effective_FX)*.35 + .025*hedge,-.20,.25)
```

Unit-cost changes affect V10 costs, balance sheets and retained earnings. The hedge premium `.025*hedge` is embedded in produced unit COGS; not double-counted as a post-settlement cash adjustment. This is deliberately simplified: NOT true currency accounting, import tax, or hedging derivatives pricing.

Mission: average hedge coverage >= `.35` and Player ranks #1 (educational risk objective; *not* an official Marketplace condition).

### C3. Supplier & Channel — 6 quarters

Decisions: supplier tier `none|standard|assured`, 0–600 reservation units, lean index 0–1. Selecting a supplier maps into V10's original `ContractProposal` (NPC vendor and a delayed delivery process); direct V10 supplier request cannot be submitted alongside V17 procurement to prevent double-booking.

```
standard -> VEND-A, 30 unit surcharge, 900 reservation fee
assured  -> VEND-B, 43 unit surcharge, 1750 reservation fee
new_unit_COGS = V15_unit_cost*(1-.08*lean)
```

Higher lean intensity >.75 requests one additional overtime hour in Southgate (max 4) and changes capacity costs through V10. Contract fulfillment is not guaranteed and might not be needed if own plants meet demand. Mission: mean actual fulfilled/demand >= `.75` and Player ranks #1.

### C4. Conscious Capitalism — 6 quarters

Decisions `people`, `environment`, `governance` each 0–1. Actual costs and attributes:

```
new_region_salary = min(15000, current_salary*(1+.06*people))
new_region_training_budget = min(50000, training_budget+1600*people)
new_unit_cost = V15_unit_cost*(1+.045*environment)
risk_mitigation = max(existing_risk_mitigation, .60*governance)
```

The player also receives limited synthetic product safety/message-fit benefits. Stakeholder proxy is **not a real measurement**:

```
stakeholder_index = .35*people + .35*environment + .30*governance
```

Mission: average stakeholder index >= `.62` and Player ranks #1. Employee costs and unit costs affect cash/profit through the original ledger, not custom duplicate financial postings.

## D. Regression and Quality Gates

- `test_v17.py`: mode validations, absent fields, preview isolation, deterministic FX, accounting checks, supply lead time, personnel costs, marketing one-time budget, replay mismatch, stale quarter, 6/8 endgame, rollback and corrupted save recovery.
- `python -m unittest discover -q`: 334 tests, including 304 from earlier versions.
- `browser_smoke_v17.py` (optional Playwright): actual Chromium through the local HTTP server, setup -> editing -> Preview -> Submit -> edition switch -> saved slot restoration; zero JavaScript errors.
- `demo_v17.py`: a scripted comparison of baseline and specialized strategy in all 4 modes. Data is purely deterministic, synthetic and not a claim of empirical correctness.

## E. Scope explicitly deferred

Supplier/reseller **role-specific multiplayer** and negotiation market; PC operations inventory valuation/production scheduling; international region/currency ledgers, cross-border taxes, country maps; external real-time macro data; official academic Balanced Scorecard calibration, multiplayer synchronization. These require separate V18+ work and/or instrumented, permitted observation of actual gameplay.
