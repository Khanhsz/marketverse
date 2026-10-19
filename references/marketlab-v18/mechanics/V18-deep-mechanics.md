# MarketLab V18 — Deep Mechanics Specification

**Status:** independently implemented prototype; not Marketplace software, algorithms, protected dataset, or official scorecard. All prices, populations, exchange rates, geography, and coefficients below are *synthetic*. The V17 codebase is shipped without changing its settlement path.

## 1. Architecture and compatibility

```
MarketLab V18 package
├── v18_deep.py        # three independent industry/financial settlements
├── v18_lab.py         # durable sessions, atomic saves, preview, idempotency
├── v18_server.py      # single-player localhost API
├── v18_dashboard.*    # map-first browser frontend
├── demo_v18.py        # six reproducible multi-quarter runs and CSVs
├── test_v18*.py       # 67 new automated tests
└── v17_launcher.py    # original V17 Bikes multi-edition, plus V14 PC Classic
    └── V6–V17 inherited source and 334 regression tests
```

**No double booking.** Each V18 deep mode owns the **only** quantity and finance settlement for its own scenario. These modes do **not** feed settled sales into V10 after the fact. They are separate teaching scenarios packaged with the preserved V17 simulation; they are **not yet one unified V10/V18 general ledger or one shared company save**. V14's public product-designer definitions and five segments are reused for the PC demand model.

## 2. PC Operations & Inventory — 8 quarters

### Inputs

- `price_alpha`, `price_pro`: retail prices.
- `build_alpha`, `build_pro`: scheduled production target, Alpha Pro unlocked Q3.
- `buy_parts`: one purchase order for each of four material pools, all arriving next quarter.
- `workers`, `overtime`, `expand_cells`: labor, overtime and added production cells (available next quarter).
- `marketing`, `cpu_alpha`, `cpu_pro`: fixed advertising spend and CPU specification.

### Market demand

Real 5 segment profiles × 2 city groups are taken from the independent V14 model. The feature fit comes from `v14_game.build_pc_spec`. For segment `s` and brand `b`:

```
fit_b,s = sum(features_b,k * needs_s,k)
value_b,s = max(0.07, 1 + 0.95 * (fit_b,s - 0.47))
choice_b,s = value_b,s * exp(-sensitivity_s * clip(price_b / reference_s - 1))
demand_b,s = round(buyers_s * choice_b,s / (0.95 + sum(choice_brands,s)))
```

`0.95` models an aggregate competitor with synthetic attractiveness. Brand Alpha Pro enters from Q3. These equations are **original** and not inferred Marketplace response functions.

### Physical production

- Four inventory pools: CPU, memory, storage, chassis; each unit bought through PO `q` arrives `q+1`.
- Alpha recipe uses `1 CPU, 1 memory, 1 storage, 1 chassis`.
- Alpha Pro recipe uses `1 CPU, 2 memory, 2 storage, 1 chassis`.
- Effective quarterly capacity `min(cells × 230, workers × 48) + (90 if overtime)` minus `30` unit changeover penalty when both brands are produced.
- Production is sequential Alpha then Alpha Pro. The allocation priority is intentionally deterministic and adjustable as future work.
- Finished products persist across quarters; sales cannot exceed both customer demand and on-hand finished goods.
- New machine cells appear in the next quarter; expansion cash is capitalized as equipment, not expensed in the purchase quarter.

### Inventory and financial flow

- `parts` and `pending_parts` are both recognized material assets; a PO costs cash in the order quarter.
- Production transfers raw-material asset to finished-goods inventory, plus paid assembly cost. CPU tier influences both market fit and paid unit assembly cost.
- Inventory is carried at weighted average cost for each brand.
- The quarter of sale recognizes revenue and COGS. Payroll, marketing and holding costs are period expenses.
- Every quarter checks:

```
assets = cash + parts_at_cost + pending_parts_at_cost + finished_goods_at_cost + equipment
assets == paid_in_equity + cumulative_retained_earnings
```

Cash can diverge from profit due to investment, purchased stock and finished inventory; therefore different strategies must be judged on both profitability and liquidity.

## 3. Supplier ↔ Reseller Negotiation — 6 quarters

This single-player two-role simulation exposes **both sides of one supply channel**, not actual multiplayer or independent human supplier/reseller accounts.

1. Supplier sends offer `(asking price, quantity, quarter q)`.
2. Reseller can accept only an existing previous-quarter offer (if `buyer_bid >= supplier_ask`), during quarter `q+1` or later.
3. The accepted order is scheduled to arrive in the **following** quarter after acceptance.
4. Actual deliveries are limited by supplier capacity and a deterministic reliability × operational-shock factor.
5. Buyer is invoiced for delivered units only. Under-delivery causes a contractual penalty transferred from supplier to buyer.
6. Reseller sells only goods physically held in inventory; unsold inventory retains wholesale cost on the asset ledger.

Synthetic fixed production cost: 88 per delivered unit. The supplier and buyer carry two separate financial ledgers. The same invoice appears as receipt for the supplier and as inventory purchase for the buyer. The same penalty is an outflow for supplier and inflow for buyer. Each side checks `cash + inventory = initial_equity + cumulative_profit` (supplier currently has no stock ledger: production is just-in-time).

Limitations: all bargaining decisions belong to one local player; no secret information, no counterpart human negotiation, no dynamic credit terms or role-separated logins. The V10 supplier contract engine remains separate and unchanged.

## 4. International Treasury — 8 quarters

Three fictional markets: Northland (domestic, DOM), Atlantica (ATL), Pacifica (PAC). **Two independent synthetic spot-rate paths**, a hedge fraction and region-specific trade tariffs enter monetary settlement.

For region `c`:

```
units_c = round(base_demand_c * growth_q * entry_exposure_c
                * exp(-price_local / 1100 + 1, clipped)
                * exchange_rate_demand_factor)
foreign_invoice_c = units_c * price_local_c
translated_revenue_DOM_c = foreign_invoice_c * (spot_c * (1 - hedge_c) + 1.0 * hedge_c)
hedge_premium_DOM_c = foreign_invoice_c * hedge_c * 0.008
border_tariff_DOM_c = units_c * 560 * tariff_c
cost_DOM_c = units_c * 560 + border_tariff_DOM_c + hedge_premium_DOM_c
```

`1.0` is the synthetic contractual forward rate. Total quarterly net income in DOM equals translated revenue minus direct costs, hedge premiums, tariffs, fixed overhead and marketing. Domestic cash is the settlement currency. Each quarter validates `domestic_cash == opening_equity + cumulative_profit`.

**Critical scope distinction:** ATL/PAC holdings are tracked as exposure *memos*, NOT bank accounts or full multi-currency balance sheets. There is no mark-to-market of foreign deposits or international borrowing. Thus V18 adds cross-border cashflow risk mechanics but **not** complete accounting consolidation under IAS/IFRS.

## 5. API, persistence and security

- `GET /api/state`, `/api/modes`; `POST /api/switch`, `/api/preview`, `/api/draft`, `/api/submit`, `/api/reset`.
- `preview` operates on deep-copied state, **never advances** the real quarter.
- `submit` requires exact current quarter and unique ID. Retry with same ID + exact payload returns stored result; conflicting payload is rejected. Concurrent submissions serialize on a per-mode lock.
- Revision checks avoid stale writes. Autosave is **not automatic on every keystroke** in the V18 deep UI; click Save draft or Commit quarter. Unlike V17, the V18 deep modes have **one persistent save per mode**, without multi-slot branching.
- JSON-only saves, envelope SHA-256 integrity, atomic temp-file + fsync + replace. Corrupt saves are not silently deleted. File-write failure rolls back in-memory state.
- Localhost-only server, JSON content-type and origin checks, no path traversal endpoints.
- This is a prototype, not a hardened multi-user internet service.

## 6. Validation

- 334 inherited V6–V17 automated regression tests unchanged.
- 53 new unit/invariant/persistence tests and 14 HTTP tests.
- **401/401** automated tests pass in the tested runtime.
- Six end-to-end simulation runs (two decision policies per V18 scenario) settled for 6–8 quarters each, financial checks successful.
- Chromium DOM render & user-input changes validated in all three scenario screens, 0 JavaScript page errors. Native browser navigation to `127.0.0.1` is blocked by the test sandbox; the test injects verified game snapshots into the actual frontend JavaScript and separately checks HTTP APIs, rather than claiming full browser-to-localhost E2E.

## 7. Next work / remaining reverse-engineering gaps

- Integrate PC inventory with the larger multi-firm V10 cashflow/demand engine, eliminating parallel PC accounting models.
- Make the supplier/reseller roles independently playable across accounts, with separate private offers and contract breach resolution.
- Expand FX to true local-currency bank ledgers, forward contracts that mature in later quarters, translation gains/losses and consolidated statements.
- Add calibration against **authorized, observable** Marketplace play traces; quantify confidence intervals and error on held-out scenarios.
- Do not claim Marketplace black-box equivalence before independent empirical validation.
