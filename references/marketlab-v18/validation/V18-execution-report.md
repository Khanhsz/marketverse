# MarketLab V18 — Verified execution report

## Delivery status

- Three NEW deep games running: `pc_operations` (8 quarters), `supply_network` (6), `global_treasury` (8).
- Full V17 legacy codebase remains available with its Bikes editions + PC Classic via `v17_launcher.py`.
- Localhost server/API + map-first bright HTML/JS user interface for the new deep games.
- Transactional JSON saves with SHA-256 integrity, revision guard, atomic write, recovery by restart, and submission-ID replay.

## Automated test runs

```text
python -m unittest discover -q
----------------------------------------------------------------------
Ran 401 tests in 19.465s

OK
```

Composition: 334 regression tests V6–V17, 53 new V18 unit/invariant/session tests, 14 new HTTP/API tests.

HTTP tests also include concurrent replay of the *same* submission ID, origin rejection, path protection, reset, mode isolation, preview immutability, static asset serving, and stale/invalid request rejection.

## Six reproducible multi-quarter simulations

| Deep mode | Policy | Quarters | Physical units sold | Closing cash (synthetic currency) | Cumulative profit | Accounting |
|---|---|---:|---:|---:|---:|---|
| PC Operations | Baseline | 8 | 1,600 | 1,088,108.80 | 608,108.80 | Pass |
| PC Operations | Active | 8 | 2,360 | 844,149.20 | 944,869.20 | Pass |
| Supplier–Reseller | Baseline / no acceptance | 6 | 0 | 279,200.00 buyer | −10,800.00 buyer | Pass both |
| Supplier–Reseller | Active negotiation | 6 | 987 | 401,857.40 buyer | 111,857.40 buyer | Pass both |
| International | Baseline | 8 | 6,353 | 3,247,940.45 DOM | 2,747,940.45 DOM | Pass |
| International | Hedge/market expansion | 8 | 6,822 | 3,352,554.01 DOM | 2,852,554.01 DOM | Pass |

These are **synthetic scenarios** chosen to test different paths. Differences in game length, demand, currency, stock and scoring prevent ranking different modes against each other.

### Interpretation

- PC Active increases cumulative profit and sales but lowers cash versus Baseline, because cash was invested into production resources, working capital and stock. More sales do not necessarily mean a higher ending cash balance.
- Supplier baseline makes no purchase agreement, so the reseller has no inventory to sell. The Active strategy uses binding one-quarter-old quotes and subsequent fulfillment.
- The international stress scenario reacts to exogenous FX paths through local demand, translated foreign revenue, hedge costs and tariffs. A hedge improves certainty in this model but does not guarantee profits under all spot paths.

## UI verification

The runtime restricted Chromium navigation to localhost. A two-part verification was therefore used:

1. Actual HTTP server + REST routes tested by Python in 14 automated tests and additional direct API run for all 3 modes.
2. Actual HTML/CSS/JavaScript rendered inside headless Chromium, fed with real game-state snapshots; PC, supplier and FX user-input changes detected; zero page JavaScript errors. Screenshots: `screenshot_v18_pc.png`, `screenshot_v18_supply.png`, `screenshot_v18_global.png`.

**Do not misinterpret** the second check as an unblocked full browser-to-HTTP UI E2E run. Manual browser E2E on user's computer remains recommended.

## What is NOT done yet

- No verified recovery of Marketplace source code or private score formula.
- No calibration against observed authorized real play sessions.
- No unified V10 and V18 general ledger; V18 deep games are self-contained while the V17 codebase is preserved separately.
- No simultaneous multi-human supplier/reseller game.
- No comprehensive multi-currency foreign bank accounts, currency debt or IFRS consolidation.
- V18 deep save UI has a single session per mode; V17 legacy multi-slot saves are preserved separately.

Next priority, V19: centralize simulation settlement, empirical calibration, playthrough comparison and stress-testing of the edition engines.
