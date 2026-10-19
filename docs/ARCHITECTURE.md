# MarketVerse — Technical Architecture

## Stack
React 19 + TypeScript + Vite for app shell; PixiJS 8 for map renderer; Node 22 tests and GitHub Actions CI. No API key, paid hosting or background coding service configured.

## Layer boundaries
- `src/engine/`: pure domain types, actions, transitions, random, save validation and future economics. Never import React, Pixi or browser globals.
- `src/ui/`: React containers and Pixi canvas; display state and send typed commands, not calculate business finances.
- `src/data/` (future): city/industry/economic configs validated at load.
- `tests/`: fast deterministic behavior and regression tests; introduce UI smoke tests as UI grows.
- `docs/`: product spec, sprint briefs, quality and handoff.

## Event/data flow
UI command -> typed validator -> weekly decision plan -> simulation pipeline -> new immutable GameState + explainable report -> UI projection/map view -> save.

## Geographic map
Country geometry as vector polygons/paths; city nodes and route edges as world-coordinate graph. Camera state separate from world state. Pixi used only to render and interact. After Sprint 02 add pan/zoom and semantic layers.

## Determinism
Use seeded PRNG, no Date.now or Math.random in game outcome decisions. All player orders are recorded for replay. Allow UI transitions to be nondeterministic only when they do not affect simulation outputs.

## Persistence
Local storage for Foundation only. Longer term add indexed storage as needed, migrations and optional cloud saves. Never overwrite malformed saves without an export/recovery option.

## CI
`npm run verify` runs engine tests and production build. Future additions should check state schema, gameplay invariants, UI smoke and balance scenarios. CI by itself NEVER triggers LLM coding.

## Dependencies
Keep packages minimal, lock versions after repository bootstrap, separate noncritical asset rendering from core rules. Avoid bundling secrets and external service tokens.
