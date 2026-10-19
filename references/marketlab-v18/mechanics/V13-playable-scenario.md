# V13 — PC Founders: Full Playable Scenario

**Classification:** Original playable teaching simulator inspired by public business-simulation ideas. **Not** an extraction of the proprietary Marketplace Business Simulations application, source code, or economic coefficients.

## Scenario scope

- Eight quarterly decision rounds; one human player (**PLAYER**) and three independently-accounted rival firms (**RIVAL/Beta**, **RIVAL2/Gamma**, **RIVAL3/Delta**).
- Two geographic regions (**North**, **South**) and three synthetic customer segments (**Budget**, **Professional**, **Mobile**). This is **not** the five-segment PC Classic dataset.
- Desktop / laptop component-based products and an **experimental tablet** archetype available from quarter 6. The tablet and all component scores/costs are original approximations, not verified PC/Tablet catalogs.
- Launch setup: company name, primary segment, Easy/Normal/Hard difficulty. Difficulty scales initial rival prices and social investment; it does **not** secretly adjust customer demand parameters.
- Distinct cash, facilities, staff, products, marketing exposures, financial ledgers, and stockout for every firm. The V10 market, manufacturing and finance pipeline still settles the full quarter once.

## Product designer data and equations

Editable draft fields:

| Field | Values | Effect |
|---|---|---|
| `pc_type` | desktop / laptop / tablet | Initial device cost & mobility |
| `cpu_tier` | basic / balanced / performance | Cost and `performance` |
| `storage_tier` | standard / large / fast | Cost |
| `chassis_tier` | standard / mobile / premium | Cost and portability |
| `target_segment` | Budget / Professional / Mobile | Preferred positioning, creative alignment |
| `ad_claim` | none / value / performance / portable | Must match technical benefit |
| `ad_segment` | Budget / Professional / Mobile | Message target |
| `ad_region` | North / South | Placement target |

Synthetic production cost:

```text
unit_cost = base_cost(device) + cpu_cost(tier)
          + storage_cost(tier) + chassis_cost(tier)
```

Values (money is an invented game unit):

- `base_cost`: desktop 300; laptop 360; tablet 290.
- `cpu_cost`: basic 0; balanced 85; performance 205.
- `storage_cost`: standard 0; large 50; fast 110.
- `chassis_cost`: standard 0; mobile 70; premium 140.
- `performance`: basic .38; balanced .68; performance .94.
- `portable`: desktop .28; laptop .72; tablet .93, plus .08 for mobile chassis or .04 for premium chassis (max 1).
- `value = clamp(1.12 - unit_cost/1500, 0.18, 0.97)`.
- Completed R&D projects add an improvement to their feature on top of the selected component baseline. Projects completing **during** the current quarter are handled by the V10 pipeline, not double-counted by the designer.

Creative claims are **hard-validated**: claim benefit must score at least 0.55 in the proposed product, and is unavailable until Q2. Valid claims adjust message/creative fit for the selected audience. No claim auto-awards sales or bypasses budget and supply. Marketing carryover and rival bidding continue through V7.

## Quarter unlocks

| Q | New decision capability |
|---:|---|
| 1 | Setup; Market Research; PC Product Designer; core pricing/budgets |
| 2 | Claim & Creative Designer |
| 3 | R&D proposals |
| 4 | Quality studies / improvement investigation |
| 5 | Technology licensing |
| 6 | Experimental tablet product option |
| 7–8 | Competition and investment optimization; final outcome after Q8 |

UI lock indicators are supplemented by **server-side** validation. A pre-unlock claim/project/study/license/tablet selection raises a `GameError` on both Preview and Submit.

## Competitor policies and fairness

- Defender Beta uses the original V8 rival policy.
- Gamma uses a price-leadership policy with price adjustments based only on the **previous quarter's published share** and its own marketing budget/cash.
- Delta uses a differentiated-product profile and adjusts prices/social using its own previous share and own cash.
- All rivals are actual companies in the V10 market and operations states, not invented rows for the leaderboard.
- Preview does not secretly use unsubmitted changes in opponents. The current iteration's actual decisions are applied only for an actual Submit.

## Commit, accounting and durability

1. Validate setup, new product/creative fields and quarter locks.
2. Work on a copy of the saved market and marketing plans.
3. Reconcile selected component features and COGS; apply approved claim modifiers.
4. On **Submit**, update rival strategies from last-quarter public information only.
5. Run V10 `process_quarter` once (V6 choice, V7 marketing, V9 capacity and finance, V10 quality/risk/scorecard).
6. Persist quarter outcome, each firm's actual sales and component design, draft decisions, and stable `submission_id`.
7. Autoload the same slot after restart. `Preview` does not mutate durable game state. Replayed Submit is idempotent; corrupt files fail checksum validation.

V13 save schema version is **2** and stored in a separate save directory. Users should not point the V13 save manager at V12 saves; no automatic migration is offered.

## Victory / endgame

After Q8 the simulator ranks all four companies by **cumulative fulfilled units sold**, tie-breaker firm ID. Only the highest-ranked firm wins. The final page includes the endgame rank, own cumulative sales, average V10 proxy score, and quarter-by-quarter performance.

This is an **independent V13 win condition** and must not be misrepresented as the official Marketplace Balanced Scorecard winner selection.

## What V13 does not yet claim to implement

- The five authentic PC Classic segments, 20-city Advanced scenario or a verified tablet BOM.
- Free-form design of arbitrary computer components and advertising copy.
- A branded asset library, multiplayer or real-time corporate negotiations.
- Verified economic response coefficients, behavioral calibration against recorded Marketplace gameplay, or any original Marketplace server/API.
- A production-ready cloud multi-user service (this is a localhost, single active user server).

## V13 black-box test priorities

For future work with **authorized** recorded play sessions: isolate Brand Judgment changes for specific PC component substitutions, distinguish demand growth from company market-share changes, measure rival moves across matched runs, estimate pricing cross-elasticities, verify actual research and technology delays, and compare volume/financial-score trade-offs on held-out games. Never label an inferred coefficient as an original proprietary constant without evidence.
