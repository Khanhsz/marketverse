# MarketVerse — Codex / ChatGPT Agent Contract

**Read this file first at the start of EVERY coding session.** Repository documentation, not chat memory, is the canonical source of truth.

## Immediate execution sequence
1. Read `docs/AUTOPILOT_STATE.json`, `docs/SPRINT_TRACKER.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/GAME_DESIGN.md`, `docs/SIMULATION_SPEC.md`, and the current sprint in `docs/sprints/`.
2. Inspect source and git history; do not assume a historical chat or ZIP is available.
3. Work on exactly the active sprint, first completing any outstanding acceptance gate. Accepted sprint evidence is recorded in `docs/validation/`; follow the current JSON state rather than reopening accepted work. At `alpha_candidate`, stop substantive feature additions and proceed to human gameplay/release review unless the user authorizes new work.
4. Implement in small integrated commits. Run `npm run verify` and relevant browser tests. Fix regressions before advancing.
5. Update `docs/SPRINT_TRACKER.md`, `docs/AUTOPILOT_STATE.json` and `CHANGELOG.md` with evidence, tested commit and remaining blockers.
6. When ALL gates pass, mark the sprint completed and increment activeSprint to the next item, then continue in the SAME authorized execution if possible. Otherwise stop with a resumable checkpoint.
7. No pretend automation: an AGENTS file, CI, or a scheduled notification does NOT launch an unattended coding agent. See `docs/AUTOPILOT_PROTOCOL.md`.

## Product invariants
- Game title: **MarketVerse**. Original map-first business/economic strategy simulator, not a copy of another game's UI or proprietary code.
- 1 turn = 1 business week; 52 turns/year; initial campaign target 104 turns. No quarter-turn progression. Quarterly reports may summarize 13 weeks.
- Single fictional country at Alpha, laptop/desktop first, map-first UI with no fog of war.
- Map is large, scrollable and draggable; clean tech-modernist style: light, muted, angular geometry, legible context panels, few UI layers.
- World, region and business interaction flow. Geographic distance, logistics links and distribution matter economically.
- Alpha scope: 8 cities, 4 AI competitors, 1 deeply simulated industry (consumer electronics/home appliances), 3 customer segments.
- Player controls product, R&D, pricing, marketing, hiring, production, inventory, logistics, finance, and expansion.
- Real sales can NEVER exceed inventory at served nodes. Simulated cash must reconcile. Capex and shipping take time. Persistent policies do not reset weekly.
- AI companies have their own budget, assets, capabilities, limited information and strategies. Do not cheat.
- Financial causality must be auditable: demand -> allocation -> fulfilled orders -> revenue/COGS/expenses -> balance changes.
- Avoid unsafe realism shortcuts: seeded deterministic RNG, explicit rounding rules, immutable transition semantics, versioned save state.

## Architecture
- React + TypeScript + Vite for application shell.
- PixiJS for map rendering, pan/zoom, overlays, pointer handling.
- Pure TypeScript simulation engine with no browser dependencies.
- All gameplay calculations behind types and testable deterministic functions.
- Data-driven industry, city and competitor configs; no unexplained magic constants.
- Prioritize laptop layout; do not replace the map with a dashboard.

## Quality gate
For each sprint: typecheck/build PASS, relevant behavioral tests PASS, no serious regression, browser smoke on affected UI, docs updated, commit saved. `npm run verify` checks formatting, 56 behavioral tests, artwork integrity, TypeScript and Vite build. Run `npm run test:map:prod` for map/artwork changes and `npm run test:browser` for UI regression. Historical save fixtures and `npm run verify:alpha` additionally cover production 104-week UI, exact cross-runtime replay, laptop profiles and multi-seed balance. Accepted evidence is in `docs/validation/`. Remote CI must be reported separately from local results; never reuse historical acceptance as validation for later source changes.

## Autonomy, permissions and cost
- User preference: ChatGPT Work / Codex through ChatGPT subscription; **NO OpenAI API key or separate API charge**.
- Never add OPENAI_API_KEY, use third-party paid runners or enable deployments without user consent.
- Never force-push, delete repository content, publish privately held data, or merge unverified work.
- GitHub Actions CI is a verifier ONLY; it is not an LLM coder.
- If the authorized Work/Codex session cannot restart itself, leave the next sprint queued in repo and say precisely what is blocked.

## Required session response
Report current sprint, modified files/commit, tests actually run, unresolved blockers, and next authorized action. Do not claim 16 sprints are complete because the plan is present.
