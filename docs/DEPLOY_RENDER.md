# Deploy MarketVerse to Render

Status: ready to connect, **not yet deployed**. Render currently cannot fetch private `Khanhsz/marketverse` with its GitHub integration.

## Prerequisite: authorize Render to read the private repository

1. Open https://github.com/apps/render/installations/new and select the GitHub account owning `Khanhsz/marketverse`.
2. In **Repository access**, select **Only select repositories** and add **marketverse** (keeping any other repos already in use).
3. Save the installation settings. Keep MarketVerse private on GitHub; there is no need to make the source public.

## Deploy

Use https://dashboard.render.com/static/new, select `Khanhsz/marketverse`, and set:

- **Service name:** `marketverse`
- **Branch:** `main`
- **Build Command:** `npm install --no-audit --no-fund && npm run build`
- **Publish Directory:** `dist`
- **Auto Deploy:** enabled

Or use Render **Blueprints** and point it at `render.yaml` in the repository root.

The deployment produces a **public static web app** even though the GitHub source repository stays private. The current Sprint 01 app is a foundation/prototype, not a complete game.

## Verification

- Wait for a successful Render build/deploy status.
- Load the Render static site's URL in a browser and confirm the main view renders, console has no errors, and assets load.
- Push a new commit to `main` and verify that auto-deploy runs.

If Render still rejects the repo after authorization, check the Render GitHub app permissions and repository selection again: https://render.com/docs/git-provider.
