# MarketVerse Sprint Tracker

| Sprint | Name | Status | Proof / next gate |
|---:|---|---|---|
| 01 | Foundation & Data Schema | completed | 10 tests + typecheck/build + real Chromium smoke PASS; `eed7a83`; see validation/SPRINT_01.md |
| 02 | Country Strategy Map | completed | 13 tests + build + Chromium camera/layers smoke PASS; `08038c2`; see validation/SPRINT_02.md |
| 03 | Cities, Companies & Facilities | completed | 17 tests + build + Chromium entities/recovery smoke PASS; `8d6cf05`; see validation/SPRINT_03.md |
| 04 | Weekly Decision Engine | completed | 21 tests + build + Chromium PASS; `2d66fb6`; validation/SPRINT_04.md |
| 05 | Customer Segments & Demand | completed | 24 tests + build + Chromium PASS; `9d8240e`; validation/SPRINT_05.md |
| 06 | Production, Inventory & Logistics | completed | 27 tests + build + Chromium PASS; `3a4ec83`; validation/SPRINT_06.md |
| 07 | Finance & Cash Flow | in progress | auditable ledger and solvency |
| 08 | Competitor AI | queued | fair, bounded resource decisions |
| 09 | Product Design & R&D | queued | SKU + tech progression |
| 10 | Marketing, Brand & HR | queued | multi-strategy staffing & marketing |
| 11 | Weekly Reports & Analytics | queued | causal KPI explanation |
| 12 | Economic Events & Markets | queued | seeded plausible macro shocks |
| 13 | National Campaign | queued | 8 cities, 4 AI, 104-week goals |
| 14 | Balance & Scenario Testing | queued | multi-seed simulations |
| 15 | UX Polish & Onboarding | queued | laptop usability & accessibility |
| 16 | Alpha QA & Release Candidate | queued | end-to-end acceptance |

## Integration principles
- This project is not complete at Sprint 01; CI passing is necessary but not sufficient.
- Every Sprint brief and acceptance checklist is under `docs/sprints/`.
- Detailed architecture and economic formulas live in `docs/`.
- On completion, update BOTH this file and `docs/AUTOPILOT_STATE.json` in a tested commit.
- Sprint instructions in the repository are the permanent memory handoff for new Work/Codex conversations.
- **No background Codex runner has been configured yet.** GitHub CI will run automatically upon code pushes; it will not produce code.
