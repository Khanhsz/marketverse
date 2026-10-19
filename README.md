# MarketVerse

**Weekly turn-based, map-first business strategy game.** React + TypeScript + PixiJS with a deterministic business simulation engine.

## Development status — 20 October 2026
- Sprint 01 and Sprint 02 accepted with local engine/build/browser evidence in `docs/validation/`.
- Sprint 03 active; see `docs/AUTOPILOT_STATE.json` and the tracker for the latest checkpoint.
- GitHub Actions verifies code; no unattended coding schedule is configured.

## Quick start
Requires Node.js 22.
```bash
npm ci
npm run verify
npm run dev
```
Run `npm run test:browser` for isolated real-browser smoke (it starts/stops its own Vite server). Requires system Chromium or `npx playwright install chromium`; override the executable with `CHROMIUM_PATH`. `SMOKE_URL` can target an existing server. No API key required.

## Canonical agent instructions
- **Start:** [AGENTS.md](AGENTS.md) and [Work/Codex bootstrap](docs/WORK_CODEX_BOOTSTRAP.md)
- **Current state:** [AUTOPILOT_STATE.json](docs/AUTOPILOT_STATE.json), [SPRINT_TRACKER.md](docs/SPRINT_TRACKER.md)
- **Product:** [GAME_DESIGN.md](docs/GAME_DESIGN.md), [MAP_FIRST_UX.md](docs/MAP_FIRST_UX.md)
- **Engine:** [SIMULATION_SPEC.md](docs/SIMULATION_SPEC.md), [DATA_SCHEMA.md](docs/DATA_SCHEMA.md)
- **Build:** [ARCHITECTURE.md](docs/ARCHITECTURE.md), [QUALITY_GATES.md](docs/QUALITY_GATES.md)
- **Plan:** [ROADMAP.md](docs/ROADMAP.md), [sprint briefs](docs/sprints/)
- **Autonomy:** [AUTOPILOT_PROTOCOL.md](docs/AUTOPILOT_PROTOCOL.md)

## Scope
Alpha targets one fictional country, 8 cities, 4 AI competitors, one consumer products industry, and a 104-week campaign. The present foundation has only 3 test cities, 2 AI opponents and zero economic transactions: do not treat the goal as already implemented.

## Repository workflow
Coding agents should work on feature branches from `autopilot` (or `main` when required), submit tested changes to a reviewable PR, and checkpoint in the state tracker. No secrets or OpenAI API credentials required for CI.

## Simulation reference library

See [MarketLab V12–V18 reference](references/marketlab-v18/README.md) for independently authored mechanics hypotheses, selected Python prototypes, historical tests, and the [weekly-to-quarterly integration guide](references/marketlab-v18/INTEGRATION_GUIDE.md).

**Reference only:** this material does not change or validate the Sprint 01 weekly economy. Do not import the Python prototypes or treat synthetic formulas as verified Marketplace algorithms. Adopt individual mechanics only in later planned sprints with TypeScript invariants and tests.
