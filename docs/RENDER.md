# Playtest deployment on Render

MarketVerse is a static browser game. Render serves the production `dist/` files; it does not run Vite, a simulation server, a database or a model API. This is an Alpha playtest deployment; the human review checklist in `ALPHA_REVIEW.md` remains open.

## Existing review site — checked 2026-10-20

- URL: https://marketverse-alpha.onrender.com
- Workspace: Khánh's workspace.
- Service: `marketverse-alpha` (`srv-dbbfrqbbc2fs73b2cocg`), Static Site.
- Connected source: `Khanhsz/marketverse`, branch `codex/marketverse-sprint-continuation`.
- Build command: `npm ci --no-audit --no-fund && npm run build`; publish `dist`.
- Automatic deployment: **on commit**. A branch update already triggers a build; do not submit a duplicate manual deploy.

`npm run build` now validates the approved PNG before compiling. Render's `live` status alone does not prove that an image decodes or map interaction works. Use the production browser journey and compare the served asset checksum; see `validation/P0_MAP_STABILITY.md` for the current repair evidence.

## Create the site

1. Sign in to Render and connect the GitHub account with access to the private `Khanhsz/marketverse` repository. Grant Render access to this repository.
2. Choose **New → Blueprint**, select the repository and branch **`codex/marketverse-sprint-continuation`**, and use the root `render.yaml`. Review the resources and any charges displayed before creating the site. The configuration defines only a Static Site; do not create a paid Web Service or database.
3. This section is a recreation guide; the existing review site is listed above. Only create another service when explicitly requested. When recreating, wait for the build/deploy and inspect the assigned HTTPS URL.

If the Blueprint flow is unavailable, choose **New → Static Site** and enter:

| Setting | Value |
|---|---|
| Repository | `Khanhsz/marketverse` |
| Branch | `codex/marketverse-sprint-continuation` |
| Root directory | Leave blank |
| Build command | `npm ci --include=dev --no-audit --no-fund && npm run build` |
| Publish directory | `dist` |
| Environment variable | `NODE_VERSION=22.23.3` |
| Auto deploy | On commit for the existing review site; review deliberately when recreating |
| Rewrite | `/*` → `/index.html` |

No secret or OpenAI API key is needed. The existing site automatically deploys updates to its connected branch. The `main` branch does not contain the completed Alpha; use the branch above until it is reviewed and merged.

## Check the deployed game

Open the assigned HTTPS URL on a laptop, open **How to play**, then **Start national campaign**. Pan/zoom the map, review **NEXT WEEK**, commit a week, inspect **Reports**, and reload to check that the save persists. Export a save before moving to a different browser or domain. Browser storage is local to each browser/profile and origin; there is no account or cloud-save synchronization. A public Static Site URL lets visitors play even when the source repository is private.

## Automation boundary

The existing Render connector and GitHub connection are available. Automatic hosting builds are separate from an unattended coding agent: no recurring Work/Codex coding runner has been configured. Human gameplay review, local tests, GitHub CI and actual deployed behavior must be reported separately.
