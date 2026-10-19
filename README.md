# MarketVerse

A map-first, weekly business strategy simulator for laptops and desktops. Build a consumer electronics/appliances company across a fictional country, compete against four budget-bound rivals, and complete a 104-week campaign.

**All 16 roadmap sprints are accepted at Alpha candidate `0.1.0-alpha.1`.** Accepted sprint evidence and the live checkpoint are in [the tracker](docs/SPRINT_TRACKER.md), [state](docs/AUTOPILOT_STATE.json) and [validation records](docs/validation/). No public deployment or unattended coding schedule is configured.

## Play and develop

Requires Node 22 (tested with **22.23.3**, pinned in `.nvmrc`). No API key, backend or paid service is required.

```bash
npm ci
npm run dev
```

Open **How to play** in the app. **Start national campaign** prepares eight distinct connected cities, four AI archetypes, factories and staff. The original three-city foundation sandbox remains available through Reset.

- Pan/zoom the vector map and inspect Market, Competition, Operations, Logistics and Economy layers.
- Review persistent prices, production and media budgets before committing each business week.
- Hire staff; build stores, warehouses, factories and labs; research versioned products and ship physical stock.
- Follow realized sales, cost-basis inventory, double-entry finances, loans and cash flow.
- Pursue profit, liquidity, market share, innovation, brand and reach. Cash alone cannot win.
- Export/import saves or verified command replays. Old save versions 1–8 migrate to version 9. Replay starts at the checkpoint stated in its export button.

## Validation commands

| Command | What it checks |
|---|---|
| `npm run verify` | Formatting, deterministic behavioral tests, TypeScript and production build |
| `npm run test:browser` | Camera/layers, entity context, save recovery, orders, R&D/HR/marketing, reports and keyboard workflows |
| `npm run test:campaign:prod` | Full 104-week UI campaign against the current production build, save import/export and worker replay |
| `npm run test:replay:cross` | Exact canonical state equality between the preceding production Chromium run and Node |
| `npm run test:profile` | Eight-city map at three laptop sizes and two pixel densities |
| `npm run test:balance` | Five policies × four seeds × 104 weeks, with resource and cash audits |
| `npm run verify:alpha` | All Alpha gates in order; requires Chromium |
| `npm run package:alpha` | Fresh production build, version/source manifest and SHA-256 archive under `.artifacts/` |

Browser runners own and stop their temporary servers. Install the managed browser with `npx playwright install --with-deps chromium`, use system Chromium, or set `CHROMIUM_PATH`. `SMOKE_URL` targets an existing server without taking ownership of it. Run `npm run build` before the production campaign command. Screenshots, downloaded test saves and packaged archives are ignored local artifacts.

Use `npm run preview` to inspect the production build. No publishing or deployment is performed by these commands.

## Canonical project records

Start with [AGENTS.md](AGENTS.md), then read the current state and sprint brief. The [16-sprint roadmap](docs/ROADMAP.md), [game design](docs/GAME_DESIGN.md), [architecture](docs/ARCHITECTURE.md), [simulation contract](docs/SIMULATION_SPEC.md), [save schema](docs/DATA_SCHEMA.md) and [quality gates](docs/QUALITY_GATES.md) explain scope and evidence.

See [known issues](docs/KNOWN_ISSUES.md) and the [Alpha review checklist](docs/ALPHA_REVIEW.md) before release. Human gameplay review remains required before public publication. Local validation and GitHub CI status are reported separately.

GitHub Actions verifies code; it does not launch an LLM coder. Recurring Work/Codex execution depends on actual account/tool support; see [the automation protocol](docs/AUTOPILOT_PROTOCOL.md).

## Reference library

The [MarketLab V12–V18 reference](references/marketlab-v18/README.md) contains independently authored mechanics hypotheses and historical Python prototypes. It is reference material, not an imported runtime or proof of external proprietary algorithms. The TypeScript engine and its tests define MarketVerse's original mechanics.
