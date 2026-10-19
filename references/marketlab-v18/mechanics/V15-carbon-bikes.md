# V15 — Bikes Deep Scenario Mechanics Specification

**Reference version:** MarketLab 15.0, independent implementation dated 2026-10-19. **No source-code access** to Marketplace and no behavioral calibration to its proprietary demand engine.

## 1. Decision schema

`bike_frame ∈ {urban,comfort,trail,aero,junior}`; `bike_carbon ∈ {standard,reinforced,ultralight}`; `bike_tires ∈ {city,hybrid,mountain,race}`; `bike_gears ∈ {single,7_speed,18_speed,22_speed}`; `bike_brakes ∈ {standard,disc,hydraulic}`; `bike_saddle ∈ {basic,comfort,sport}`; `bike_suspension ∈ {rigid,front,full}`; `bike_accessories ∈ {none,safety,cargo,computer}`.

Other fields: `bike_target`, city availability, city coverage [0,1], advertising claim, brand/segment/region, secondary brand profile/price after Q3. Generic V10 business fields remain usable, including staffing, training, production capacity, quality, finance, R&D, market research and vendor contracts.

**Hard validation:** Enums, finite numeric intervals, at least one active brand, secondary Q3 unlock, Q2 ad-claim unlock, city availability and component truthfulness. Reuse V13 and V10 validation and single-settlement pipeline.

## 2. Product cost and customer values

Each chosen part contributes a synthetic numeric BOM cost. An original function `bike_spec()` constructs nine [0,1] normalized buyer benefit dimensions: `comfort`, `speed`, `offroad`, `safety`, `practical`, `durability`, `lightweight`, `youth`, `value`.

Every segment has its own positive need-weight vector summing to one. This is coupled to V6's generic weighted-fit function. Product improvement is therefore not a single additive quality score: the same frame/tire selection can increase Mountain fit while decreasing Youth or Work fit. Actual demand follows V6 utility-based brand choice and no-purchase alternatives. **Weights and cost figures are demonstration assumptions, not recovered Marketplace coefficients.**

## 3. Competing firms and brands

Four independent finance/plant/marketing firms inherited from V13 (Player, Beta, Gamma, Delta brands; one player and three AI rivals). Player may add Alpha Pro at Q3. Each offer has its own price, unit cost, active regions, distribution share, message-fit and feature vector, so same-company cannibalization occurs *within* the core choice engine. Rival AI reads prior-quarter reports; it has no access to future player choices.

## 4. Marketing, capacity and sales

Marketing impressions, paid search and social plan are handled by V7; V6 computes brand demand; V10 allocates the final physical output *once* by site/firm and computes final invoices/COGS/financial accounts. There is no parallel bike sales settlement.

Bikes are represented as **build-to-order**, with no finished-goods inventory or carry-over in this implementation. Each regional production cell uses V9's **520 frame units per quarter** baseline (before productivity and overtime adjustments). New cells follow V9 investment delay. `v15_inventory=0` in reports is a stated scenario invariant; lost demand becomes stockout, not free inventory or backlog.

## 5. Creative truthfulness

- `comfort` claim requires comfort benefit >= 0.72.
- `trail_ready` requires offroad >= 0.72.
- `lightweight` requires lightweight >= 0.70.
- `safety` requires safety >= 0.70.
- `fast` requires speed >= 0.70.
- `bestseller` requires previous-quarter brand sales > 0 and no lower than competing brands.

These exact thresholds are **authored for V15**, not Marketplace rules.

## 6. State machine and accounting

`Draft → Validate → Preview on cloned state (no mutation) → Submit with ID → Apply decisions → V10 market/capacity/finance settlement → Commit history → autosave → Next Q.` A duplicate Submit ID with identical content replays results; changing content reusing the same ID is rejected. V15 saves have a **separate schema v4** and integrity hash. PC V14 stays available with schema v3 in a separate folder.

Core game state includes: firms/brands, city market segments, ad memory, brand loyalty, corporate financial ledgers, worker morale, capacity, R&D, contracts, quarter history, player bike configuration and idempotency hashes.

## 7. Calibration & gaps

Not identified: hidden demand utility, ad response and weights of actual Marketplace, exact segment population, 3D printer costs, R&D tree, official endgame condition, online/offline buyer switching, city geography, full bikes bill of materials and AI opponent policy. Further black-box validation requires legitimate per-quarter input/output pairs under controlled scenario settings. V15 has not undergone that validation.
