# MarketLab V18 → MarketVerse | Reference Library

> **REFERENCE ONLY.** Independent educational simulation prototypes and reverse-engineering *hypotheses*. Not official Marketplace source, parameters, proprietary assets, or validated formulas. Not production game code.

## Purpose

This directory organizes the prior MarketLab V12–V18 work for use when designing **MarketVerse**, without changing the current React/TypeScript game.

**Important mismatch:** MarketLab prototypes simulate **quarters**, while MarketVerse uses **1 week per turn, 52 weeks/year, target 104 weeks**, with a map-first, laptop-first **single-country/no-fog** UX. The current MarketVerse Sprint 01 economy intentionally has zero sales/revenue effects. **Do not connect reference models until the Sprint 01 quality gate is passed and a later economics sprint is explicitly planned.**

## Contents

| Path | What it is | How to use |
| --- | --- | --- |
| [mechanics/](mechanics/) | V12–V18 rules, limitations and hypothesized mechanisms | Product/game-design research, **not** specs of Marketplace's private algorithms |
| [prototypes/](prototypes/) | Selected original Python engine source for Bikes, editions, extended modes and V18 deep games | Read for logic; **not standalone**, not importable into a TypeScript project |
| [validation/](validation/) | V18 historical test report and six synthetic scenario results | Test ideas, **not** verification of MarketVerse itself |
| [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) | Adaptation to MarketVerse weekly deterministic engine | Architecture and data-flow contract |
| [MECHANICS_CATALOG.md](MECHANICS_CATALOG.md) | Priority/dependency catalog | Backlog reference |
| [PROVENANCE.md](PROVENANCE.md) | Confidence boundaries and research protocol | Prevent misuse of invented formulas |

## The three V18 deep scenario references

1. **PC Operations:** BOM, components arriving one quarter later, factory scheduling, work in progress/finished-goods inventory, and material/asset reconciliation.
2. **Supplier–Reseller:** sequential offer → accept → deliver, under-fulfillment penalty, mirrored wholesale cash/invoice; one local player controls both roles.
3. **International Treasury:** synthetic spot FX paths, local demand, forward hedge fraction and tariffs; **no** full multi-currency bank account ledger.

**Accounting boundary:** Each V18 scenario owns its own settlement. The preserved V17/V10 systems are **separate**. Never import V18 booked revenue/units *after* another engine has already posted them.

## Provenance and reproducibility

The original full V18 downloadable bundle was produced outside this repository (115-file prototype archive); this directory is a curated **text/code reference subset**, not a claim to contain that whole runnable ZIP or all Python dependencies. The original test run reported **401/401** passing *in the MarketLab runtime*. Those tests have **not** been run against MarketVerse's TypeScript engine or in this repository.

## Status

Reference ingestion only. No changes to `src/`, `package.json`, game turn logic, saves, CI, or Sprint 01 acceptance status. See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) before implementing mechanics.
