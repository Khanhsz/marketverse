# MarketLab V14 — PC Classic Deep Scenario / Mechanics Specification

**Type:** independent behaviorally inspired game implementation, **not** the original Marketplace Simulations software.  
**Scenario:** 8 decisions / quarters, four competing firms, 5 PC business-customer segments, two **fictional** city sales offices, up to 2 player-owned PC brands, desktop/laptop plus the earlier experimental tablet unlock.  
**Build on:** V6 demand → V7 marketing → V8 adaptive competitors & research → V9 operations and finance → V10 quality/risk/contracts → V11 web UI → V12 durable slots → V13 endgame.

## Evidence vs hypotheses

### Documented in publicly available materials
- PC Classic marketing scenarios feature five named segments: **Costcutter, Workhorse, Traveler, Innovator, Mercedes**. Their needs differ considerably.
- Strategic Marketing lasts eight decision rounds in the official description and includes product design, advertising, pricing, market analysis and competitive decision-making.
- The product customization vocabulary includes different chassis, processors, data/storage options, displays, input, networking, batteries and software (historical PC Help File; edition may vary).
- Brand/Price/Advertising judgments are segment-specific; historical manuals emphasize that product quality and perceived price must both satisfy target segments.
- Sales offices, brands, sales force, competitors, market research, R&D, quarterly outcomes are meaningful interactions.

Sources: https://www.marketplace-simulation.com/compare-our-business-simulations/strategic-marketing-bikes/ and https://www.scribd.com/document/368581362/Help-File (2017 third-party hosting; do not treat all historical numerical values as current).

### Reconstructed independently in V14
**Every** number in these modules (population, WTP, segment-need weight, component COGS, marketing spend, default rival parameters, city names) is synthetic, not extracted from Marketplace:

1. `make_segments()` generates 10 consumer cells = 5 segments × 2 fictional cities. Each cell has a population, WTP, price sensitivity, and vector of up to eight needs.
2. `build_pc_spec()` maps PC configuration to a continuous feature vector and component-cost sum. These become actual fields on the market `Offer` and affect choice and production COGS.
3. `Alpha Pro` is added as a distinct `Offer` in the same company from Q3, with its own price, configurable cost, target and distribution. It competes for the same buyers and shares the company's regional factory capacity. The single V10 settlement processes all brands and firms.
4. Two city offices are represented by the existing physical **North/South** operational regions of V10. Their fictional map names are **Northport** and **Southgate**. They are meaningful independent demand/capacity markets, *not* actual Marketplace city locations or a map of the real world.
5. Per-brand city on/off flags change eligibility in consumer choice and suppress corresponding ad plans; a city can reopen in a later quarter and its media controls continue to work.
6. Claim verification checks existence/strength of technology, region availability, or published best-seller proof from a previous quarter. Claimed competitor superiority is not accepted from the current unpublished round.
7. Q3 unlocks a second PC brand; earlier V13 unlocks remain intact.

## Quarter processing

```
User draft + Alpha BOM + second-brand BOM
                |
       V14 restrictions
      /         |         \
  Product     Creative    City sales-office reach
  spec/cost   proof       and activation
      \         |         /
    Existing V13 / V10 transaction pipeline
                |
     V7 marketing exposure and spend
                |
     V6 5-segment consumer choice
                |
    V9/V10 per-region manufacturing,
    stockouts + supplier fallback
                |
    Exactly one booking of physical sales
       and accounting per quarter
                |
    Brand × City × Segment performance
      Save and continue to next Q
```

**Important invariant:** Brand and city reports read the same fulfilled `MarketReport.rows` that V10 books into P&L. Reports **never** create independent revenue or second settlement.

### Product BOM formula (independent)

`UnitCost = Chassis + CPU + Memory + Storage + Display + Battery(if mobile) + Software + Security`.

Feature benefits include `value`, `performance`, `portable`, `memory`, `storage`, `display`, `software`, `security`, `reliability` (each normalized 0–1). Segment fit continues to be V6's weighted fit:

`Fit(segment,brand) = Σ needWeight(segment,k) × featureScore(brand,k) / Σ needWeight(segment,k)`

The existing V6/V7 logit choice includes an explicit **no-purchase** option. No extra rule awards sales for just adding components or brands.

### Secondary brand and supply constraints

A second brand draws demand from the same city/segment choice set. At fulfillment time both brands draw from the same `Site` factory and external supply for their firm/city; the default V10 brand priority is `Alpha` before `Alpha Pro`. This can make the new brand demand exceed its fulfilled sales despite a strong launch. Reports keep that stockout distinct.

Marketing availability, BOM/COGS, sales demand and profit all respond to activation; shutting a city eliminates consumer purchase eligibility and advertising spend in that city. When reopened, the last submitted media-budget decisions are retained in the local save and default templates are rehydrated.

### Claims

| Claim | Independently modeled rule |
|---|---|
| `performance` | Feature performance >= 0.72 |
| `portable` | Feature portability >= 0.70 |
| `secure` | Feature security >= 0.80 |
| `largest_storage` | Storage feature >= 0.90; **not** a global superlative proof |
| `best_selling` | Brand was top seller among observed brands in the previous completed round |

The literal label `largest_storage` should be interpreted as a **high-capacity component** statement in this demo, not proof that the brand has the largest storage of all competitors. These thresholds are V14 hypotheses, not Marketplace original settings. Claim errors block Preview and Submit. Ad availability requires the claimed brand be sold in the claimed city.

## State and compatibility

- `v14_game.py` subclasses the playable V13 controller, keeping V10's physics/accounting.
- `v14_persistence.py` is a schema **v3** fork of V13's JSON codec with `v14_design` and `v14_commit_hash` persisted. V12/V13 saves are not implicitly migrated, avoiding silent corruption from changed world segmentation.
- `v14_server.py` exposes the same localhost API (`/api/state`, `/api/preview`, `/api/submit`, `/api/draft`, `/api/setup`, and save-slot endpoints), so original browsers can continue to use autosave/recovery.
- Preview uses copied state and unchanged rival published policies. Submit applies the actual adaptive rival turn and commits one outcome atomically.
- The V14 full-decision fingerprint supplements earlier submission idempotency: a previously used ID cannot be reused with different V14 settings.

## Tests and known limitations

Test suite includes the original 227 V6–V13 tests plus 19 V14 tests, including true multi-brand sales/revenue identity, city closure/reopening, supported/unsupported claims, research/progression through inherited tests, idempotency, persistence and full eight-quarter playthrough.

**Not yet reverse-engineered:** Exact Marketplace product-component response weights, named geographic cities and their actual populations, price-judgment curves, product redesign fees, advertising copy layout, outlet-specific media inventory, NPC competitor optimization and server algorithms, the full PC and Bikes rulesets, multiplayer human negotiations, and visual assets. V14 also keeps a deliberately small player brand limit (two), not Marketplace's catalog-wide limit.

**Fairness caveat:** The V14 endgame still uses the V13 original synthetic ranking criterion, cumulative physical units sold in eight quarters, **not** Marketplace's proprietary scoring or the full Corporate Balanced Scorecard.
