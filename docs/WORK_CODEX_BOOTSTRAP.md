# Copy/paste bootstrap for ChatGPT Work or Codex Cloud

## Prerequisite
Connect GitHub repo `Khanhsz/marketverse` in Work or Codex Cloud. Give explicit authorization to read/write project files. No API key is required for GitHub CI or this prompt. Scheduled coding depends on actual Work/Codex account support and permissions, not this file.

## First execution prompt
Continue development of the private GitHub repository `Khanhsz/marketverse`. Read `AGENTS.md`, `docs/AUTOPILOT_STATE.json`, `docs/SPRINT_TRACKER.md`, the complete roadmap and the current sprint brief. Treat GitHub as the source of truth instead of relying on conversation memory.

Follow the current JSON checkpoint. Sprint 01–03 now have recorded local acceptance evidence in `docs/validation/`; do not assume they are still pending. Start the active sprint brief (currently Sprint 04 weekly decisions and queues), validate all gates, then commit and push the working branch `codex/marketverse-sprint-continuation`. Fetch and inspect the remote branch before continuing; never reset or overwrite local work.

When a sprint meets every acceptance criterion, automatically continue to the next sprint IN THE SAME authorized running session if possible. If runtime ends or requires approval, leave a clear checkpoint and return. Never fabricate tests or say a scheduled task exists until it is configured.

Continue toward Sprint 16 Alpha. No OpenAI API key, no separate model API charges and no paid deployment. Use GitHub Actions solely for code validation. Surface genuine blockers and required approvals.

## Optional Scheduled Work prompt
On each scheduled run, inspect `Khanhsz/marketverse` and read `AGENTS.md` and `docs/AUTOPILOT_STATE.json`. If an unfinished approved sprint exists, continue the smallest independently verifiable scope you can implement with the available tools, run tests and commit/checkpoint to the working branch. If no coding tools are available, report that limitation instead of marking progress. Only mark the sprint complete on proof of acceptance tests. If all 16 sprints are accepted, report Alpha candidate and stop substantive feature additions. Never use an OpenAI API key.

## Event-triggered Work
Where supported, choose a *supported GitHub PR event* for this repo, with condition limiting to MarketVerse sprint PR activity, and instruction to review/tests/handoff. A PR webhook trigger does not necessarily offer automatic Codex coding. Review trigger, permissions and approvals before activation.

## Operator setup
1. Open Work or Codex (supported surface).
2. Connect/authorize GitHub `Khanhsz/marketverse`.
3. Paste the First execution prompt and begin.
4. To schedule recurring continuation, create a cloud Work task using Optional Scheduled Work prompt and verify it appears under Scheduled. For Codex-native automations, configure within Codex if available.
5. Return to `docs/AUTOPILOT_STATE.json` and commit history to see real progress.
