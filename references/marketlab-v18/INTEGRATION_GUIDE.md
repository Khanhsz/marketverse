# Porting MarketLab concepts into MarketVerse

## Architecture boundaries

**Source of truth:** MarketVerse `src/engine/game.ts` is TypeScript, deterministic, seeded, serializable and **weekly**. MarketLab V18 Python is reference logic only. Implement a new TypeScript mechanic only after an approved sprint with tests; do **not** run Python from React, splice report CSVs into live state, or replace existing game files.

MarketVerse initial state: three fictional cities, three companies, map-first, no fog. It currently advances a calendar with zero economic effects, by design.

### Turn/report mapping

- Week `1..13` → reporting Q1, `14..26` → Q2, `27..39` → Q3, `40..52` → Q4.
- For a 104-week campaign there are **8 reporting quarters**. This is a reporting alignment, **not** a request to turn MarketVerse decisions into quarterly actions.
- `quarterOf(absoluteWeek) = floor((absoluteWeek - 1) / 13) + 1` for a two-year campaign.
- Keep **weekly** sales, payroll and cash settlement. Aggregate 13 weeks into quarterly reports; do not post annual/quarterly totals twice.
- Schedule delayed investments in **weeks**, explicitly converting research assumptions (e.g. prototype 'arrives next quarter') to a tested delay rule such as 13 weeks. Never silently assume equivalence.

### Proposed future modules (do not implement in Sprint 01)

```text
weekly decisions + prior state + seeded RNG
          |
          v
 validate orders / pricing / budgets / legal constraints
          |
          v
 mature scheduled deliveries / factory expansions / R&D
          |
          v
 marketing exposure -> segment demand by city
          |
          v
 allocate physical production + stock + channel fulfillment
          |
          v
 post one balanced set of transaction journals
          |
          v
 financial statements + competitor information + KPI reports
          |
          v
 validate invariants -> immutable next-week state
```

### Suggested interfaces

```ts
type Money = number; // choose integer cents before enabling transactions
type WeekIndex = number;

type PendingDelivery = {
  id: string; orderWeek: WeekIndex; arrivalWeek: WeekIndex;
  productId: string; quantity: number; costCents: number;
};

type PhysicalMovement = {
  skuId: string; week: WeekIndex;
  opening: number; received: number; built: number;
  sold: number; scrapped: number; closing: number;
};

type JournalEntry = {
  id: string; week: WeekIndex; sourceId: string;
  debitAccount: string; creditAccount: string;
  amountCents: number;
};
```

These types are **proposals**, not currently committed runtime interfaces.

### Mandatory invariants / tests before live integration

1. Every input, RNG seed and previous state yields the same next state and report on replay.
2. Closing inventory = opening + receipts + builds − shipments − scrap; never negative.
3. `unitsSold <= available finished goods` and all invoices correspond to delivered goods.
4. Sum of debits = sum of credits for each accounting batch; postings happen once and only once.
5. `assets = liabilities + ownersEquity` with explicit treatment of cash, inventory, capital goods and retained earnings.
6. Supplier invoice and reseller procurement use a shared immutable event ID; penalties are symmetric between counterparties.
7. A single weekly decision cannot trigger both a standalone scenario settlement and a second company-wide settlement.
8. Out-of-stock and closed distribution locations do not receive full marketing exposure or report impossible fulfilled sales.
9. Save/reload retains RNG state, delayed work, contract obligations and idempotency keys.
10. All economic features stay disabled until the Sprint 01 gate is met. Run `npm run verify` and browser smoke tests during implementation.

### UI guidance

Preserve one-country city map, compact city/company icons, restrained palette, laptop-first, no fog. Use city selection to open contextual decision panels. Avoid replacing the map with a permanent KPI dashboard; expose budget, capacity, inventory and contracts through contextual panels.

### Integration policy

Convert **one mechanic at a time** into new TypeScript engine modules, separately from UI. Start with inventory + weekly journal transactions, then supplier contracts, then city demand, then FX once geography expands beyond one country. Model values here are synthetic: recalibrate from explicitly authorized play observations when available.
