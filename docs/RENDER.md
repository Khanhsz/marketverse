# Playtest deployment on Render

MarketVerse is a static browser game. Render serves the production `dist/` files; it does not run Vite, a simulation server, a database or a model API. This is an Alpha playtest deployment; the human review checklist in `ALPHA_REVIEW.md` remains open.

## Create the site

1. Sign in to Render and connect the GitHub account with access to the private `Khanhsz/marketverse` repository. Grant Render access to this repository.
2. Choose **New → Blueprint**, select the repository and branch **`codex/marketverse-sprint-continuation`**, and use the root `render.yaml`. Review the resources and any charges displayed before creating the site. The configuration defines only a Static Site; do not create a paid Web Service or database.
3. Apply the Blueprint and wait for the initial build/deploy. Open the HTTPS `onrender.com` URL assigned by Render. Its exact hostname is available only after site creation.

If the Blueprint flow is unavailable, choose **New → Static Site** and enter:

| Setting | Value |
|---|---|
| Repository | `Khanhsz/marketverse` |
| Branch | `codex/marketverse-sprint-continuation` |
| Root directory | Leave blank |
| Build command | `npm ci --include=dev --no-audit --no-fund && npm run build` |
| Publish directory | `dist` |
| Environment variable | `NODE_VERSION=22.23.3` |
| Auto deploy | Off |
| Rewrite | `/*` → `/index.html` |

No secret or OpenAI API key is needed. Static Site hosting is suitable for the free offering; check the account's current usage limits and pricing in Render. Updates require a manual deploy of the reviewed commit. The `main` branch does not contain the completed Alpha; use the branch above until it is reviewed and merged.

## Check the deployed game

Open the assigned HTTPS URL on a laptop, open **How to play**, then **Start national campaign**. Pan/zoom the map, review **NEXT WEEK**, commit a week, inspect **Reports**, and reload to check that the save persists. Export a save before moving to a different browser or domain. Browser storage is local to each browser/profile and origin; there is no account or cloud-save synchronization. A public Static Site URL lets visitors play even when the source repository is private.

## Automation boundary

This session prepares and locally validates the deployment files. No Render account connection, service creation, live URL or remote deployment result is implied. The account owner must connect GitHub and create the site in Render because no Render connector or authenticated deployment session is available here. Human gameplay review and remote GitHub CI results remain separate from local checks.
