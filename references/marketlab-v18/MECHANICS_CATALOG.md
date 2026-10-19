# Reference mechanics catalog (V12–V18)

| System | Reference source | Data / decision | Dependency | Status in MarketVerse |
| --- | --- | --- | --- | --- |
| Persistence and idempotent submit | V12 | save slot, hash/integrity, request ID | deterministic game state | Reference, **not** a production upgrade |
| PC product and ads | V13, V14 | features, segments, targeting, truthfulness claims | demand, prices, brands | Reference |
| PC segmentation | V14 | Costcutter, Workhorse, Traveler, Innovator, Mercedes | city × segment demand | Reference; not official coefficients |
| Carbon-bike product design | V15 | frame, drive train, gear, brake, suspension, fit | cost and demand | Reference |
| Corporate edition profiles | V16 | 6/8 rounds, financing, goals, KPI weights | simulation lifecycle | Reference |
| E-commerce / digital | V17 | SEO/PPC, website, acquisition budgets | customer response | Reference |
| International macro | V17, V18 | FX, tariffs, hedging, regional demand | general ledger | Deferred beyond one-country foundation |
| Supply-chain bargaining | V17, V18 | offers, acceptance, deliveries, underfill penalties | inventory, contract state | Reference |
| PC inventory & scheduling | V18 | BOM, PO lead time, changeover, workers, COGS | transactional ledger | Best future foundation candidate |
| Stakeholder metrics | V17 | employees, community, environment | costs and reputation | Reference |

## Candidate implementation sequence **after** Sprint 01 gate

1. Week-level physical inventory / stockflow and a journal ledger.
2. Cost/price/product specs and market demand by city and segment.
3. AI competition and marketing allocation.
4. Supplier negotiations and contracts with promised-delivery dates.
5. Research/R&D, reputation and edition scoring.
6. International FX / hedge after multi-country map exists.

## Model uncertainty

The documents record an **independently built game prototype**, not recovered closed-source internals. All demand elasticities, technology costs, currencies, segment weights, rivalry coefficients and artificial geography are illustrative until empirical calibration. Test counts in historical execution reports apply only to their own Python projects.
