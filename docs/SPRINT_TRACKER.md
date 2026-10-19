# MarketVerse Sprint Tracker

| Sprint | Name | Status | Proof / next gate |
|---:|---|---|---|
| 01 | Foundation & Data Schema | completed | 10 tests + typecheck/build + real Chromium smoke PASS; `eed7a83`; see validation/SPRINT_01.md |
| 02 | Country Strategy Map | in progress | pan/zoom/layers/no fog |
| 03 | Cities, Companies & Facilities | queued | selectable geolocated assets |
| 04 | Weekly Decision Engine | queued | policies persist, queued jobs |
| 05 | Customer Segments & Demand | queued | reproducible demand and preference allocation |
| 06 | Production, Inventory & Logistics | queued | constrained physical flows |
| 07 | Finance & Cash Flow | queued | auditable ledger and solvency |
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
