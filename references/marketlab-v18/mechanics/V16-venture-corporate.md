# V16 — Mechanics Specification: Venture & Corporate Editions

Version: 16.0 · Model category: **independent behavioral reconstruction** · Product: Carbon Bikes.

## Provenance & confidence

| Fact | Status | Source |
|---|---|---|
| Strategic Management runs 6 decision rounds | Public, confirmed | https://www.marketplace-simulation.com/strategic-management-simulations/ |
| Business Management and Integrated Business Management run 8 decision rounds (extended can run up to 12) | Public, confirmed | https://www.marketplace-simulation.com/strategic-management-simulations/ |
| Venture simulation includes outside capital pitch and cross-functional decisions | Public, confirmed at feature level | https://www.marketplace-simulation.com/compare-tool/ |
| Strategic Corporate Management has 8 business quarters with a balanced scorecard | Public, confirmed at high level | https://www.marketplace-simulation.com/blog/the-yin-and-yang-of-decision-making/ |
| Edition starting balances, financing caps, unlock quarters, weighting coefficients, objective scoring and rival behavior | **Independent authored assumptions** | MarketLab V16 code |

**Do not interpret the following rules as internally recovered Marketplace source or algorithms.**

## Modes implemented in V16

| Mode ID | Quarters | Capital uplift relative to V15 | Borrow unlocked | External equity unlocked | Quality unlocked | R&D unlocked | Market / Profit / Resilience weights |
|---|---:|---:|---|---|---|---|---|
| venture | 6 | 0 | Q3 | Q5 | Q5 | Q3 | .28/.52/.20 |
| strategic | 6 | 40,000 | Q3 | Q5 | Q5 | Q3 | .55/.25/.20 |
| business | 8 | 100,000 | Q2 | Q5 | Q4 | Q3 | .30/.50/.20 |
| corporate | 8 | 180,000 | Q2 | Q5 | Q4 | Q3 | .25/.35/.40 |

These numbers are synthetic and can be tuned; they are not Marketplace settings. All uplift is paid-in equity, so the accounting identity continues to hold. The built-in V10 finance validator restricts outside equity to Q5 and 150,000 units and borrowing to 250,000 units; V16 policy caps borrowing further to 180k / 120k / 220k / 250k respectively.

## Edition state and process

- `GameController(edition)` stores a fixed edition key in `config` and cannot switch editions within a slot.
- User setup adds `objective`: balanced, growth, profit, resilience.
- The edition controls `max_rounds`, unlocks, seed funding, policy caps and endgame criteria, **without** branching the V10 demand / finance engine.
- `preview(draft)` calls edition validation first, then the inherited V15 preview, which does not mutate committed business state.
- `submit(quarter,id,draft)` also validates edition restrictions and invokes the V15/V10 economic settlement **once**; it records the edition, phase and result in quarter history.
- Idempotent submit replay verifies the saved original quarter and normalized input fingerprint; it remains valid after a restart.
- A 6-round mode sets `finished=True` and `draft=None` after Q6, even though its underlying state clock has advanced to Q7. A new Q7 submit is rejected. This prevents accidentally running an eighth-quarter scenario in six-round modes.
- Saves are stored with schema version 5 and an edition-specific scenario identity. Reopening a different edition's save is rejected.

## Synthetic multi-KPI endgame

Unlike V13–V15, which ranked **cumulative unit sales only**, V16 combines three separate business outcomes for every firm:

1. **Market score:** min-max normalized cumulative actual delivered units across four companies.
2. **Profit score:** min-max normalized final retained earnings (not gross revenue).
3. **Resilience score:** truncated final accounting equity / total assets.

`Score = w_market × MarketScore + w_profit × ProfitScore + w_resilience × ResilienceScore`.

Objective modifiers affect the custom score weights: `growth` adds +.10 to market; `profit` adds +.10 to profit; `resilience` adds +.10 to resilience; in each case, the other two receive −.05. All choices keep weight totals equal to 1. Rankings use score descending then firm ID lexicographic as deterministic tie break.

**This score is original, not the balanced-scorecard formula of the Marketplace Corporate product.** Scores can be sensitive to the comparison group because of min-max normalization.

## Integration limits

- Decisions still use inherited Bikes brand designer, 5 segments, 2 synthetic city markets, 3 AI opponents, 3D carbon made-to-order and V9/V10 production/finance.
- Venture's investor pitch is currently represented by the existing Q5 outside-equity decision; there is no independent investor-negotiation AI, valuation negotiation or term sheet yet.
- Corporate uses the inherited V10 quality, R&D and risk modules; V16 changes access policy but does not newly calibrate those models.
- The PC storyline remains V14 rules when launched through `--scenario pc`; V16 does not extend PC editions yet.

## Acceptance tests

- Each edition completes exactly its advertised number of decision rounds.
- Current-quarter Preview is read-only and runs edition validation.
- Q1 restricted finance/quality/R&D actions reject invalid drafts.
- Q5 equity financing settles in accounting, not as artificial sales income.
- Save/load works after Q6 game completion; replaying the previous submit returns the same settled outcome.
- Switching a save path across editions is rejected by scenario identity/checksum.
- Four rivals/one player remain the same firms in all modes; endgame scores are finite and rankable.
