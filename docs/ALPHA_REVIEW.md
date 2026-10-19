# Alpha 0.1.0-alpha.1 candidate review

The candidate is prepared on `codex/marketverse-sprint-continuation`. It remains private/reviewable. Source SHA, archive checksum and file manifest are recorded in `validation/ALPHA_CANDIDATE.json` when packaging completes.

## Automated acceptance evidence

- `npm run verify`: formatting, engine/invariant/migration/replay tests, TypeScript and production build.
- `npm run test:browser`: map/layers, objects, local save/recovery, orders, product/people/media, reports and keyboard/focus workflows.
- `npm run test:campaign:prod`: actual production bundle/worker, 104 UI commits, R&D/build/hire/shipping, reload, final results, save and replay imports, corrupt-file preservation and year report.
- `npm run test:replay:cross`: full canonical output and SHA-256 equality between the preceding production Chromium run and Node.
- `npm run test:profile`: three laptop sizes with 1×/2× evidence.
- `npm run test:balance`: five policies × four seeds × 104 weeks, physical/cash/fulfillment audits and retained loss outcomes.
- `node scripts/check-sprint-state.mjs`: ordered sprint completion and API-free policy.

Final observed results are in `validation/SPRINT_16.md`, `ALPHA_BROWSER_16.json`, `ALPHA_CROSS_RUNTIME_16.json`, `BALANCE_16.json` and the UI profile. Generated screenshots and exported journey saves are under ignored `.browser-artifacts/`.

## Human gameplay review before public release

- [ ] Start a national campaign at a normal laptop viewport; use map and contextual panels without instructions from a developer.
- [ ] Compare price/production decisions, overstock, stockouts, hiring, local expansion, R&D and marketing. Inspect the reports and verify that losses are understandable.
- [ ] Play several competing strategies; review campaign pacing, starting capital, goals and difficult choices.
- [ ] Try keyboard/screen-reader workflows and intended browsers/hardware beyond the automated Chromium matrix.
- [ ] Inspect the full 104-week result, exported save/replay and the known-issues list.
- [ ] Observe GitHub CI, review the branch/PR, and approve any merge/public release separately.

These manual items are release review, not fabricated automated passes. No publishing command, paid deployment or recurring model job is part of candidate packaging.

## Reproduce the package

Use Node 22.23.3, `npm ci`, install Chromium if necessary, then `npm run verify:alpha` and `npm run package:alpha`. The archive under `.artifacts/` contains the built static app and `release-manifest.json`. Run `npm run preview` for local review. Compare the `.sha256` file before sharing or deploying the archive.
