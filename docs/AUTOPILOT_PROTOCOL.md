# MarketVerse — Autonomous Sprint Protocol

## Purpose
Provide reliable **checkpoint-based handoff** to ChatGPT Work/Codex. This repository makes the next task self-describing; it does NOT independently launch an LLM.

## Modes
1. **Interactive/authorized Codex session:** can read `AGENTS.md`, implement current sprint, run tests and immediately continue while that session is active.
2. **ChatGPT Work Scheduled:** if available, user configures a recurring Work job with GitHub permissions and prompt in `docs/WORK_CODEX_BOOTSTRAP.md`; each job reads state and attempts scoped work. Whether it can write code depends on account and actual execution tools.
3. **CI-only:** GitHub Actions verifies code and state validity but does NOT generate code. No OpenAI API needed.
4. **Codex automations:** if user has Codex-native automation, configure inside Codex, not by assuming a GitHub workflow can sign into a ChatGPT subscription.

## Cycle
Read state -> inspect active sprint brief -> implement -> test -> human-readable evidence -> commit -> update state -> next sprint when fully accepted -> repeat while authorized.

## States
`awaiting_validation`: code exists but a required gate is not verified.
`in_progress`: code is being developed.
`blocked`: required tool, approval or unsolved error.
`ready_to_advance`: all acceptance checks done; no unrelated blockers.
`alpha_candidate`: all 16 sprint acceptance checks complete; needs human gameplay review.

## Evidence requirements
Each transition to completed requires commit SHA, test command and result, UI smoke evidence if UI changed, and a `docs/SPRINT_TRACKER.md` entry. Future tracker may include timestamps and issue/PR links.

## Safety and guardrails
- Maximum three automatic repair attempts for a failure; then mark blocked with reproducible log.
- Do not skip failed tests to meet time target.
- Do not make concurrent agent runs write to the same branch without coordination.
- Use feature branches; only merge to stable when required review and tests pass.
- No recursive GitHub Actions calling external models and no usage of OPENAI_API_KEY.
- Never claim autonomous continuous 24/7 coding unless a persistent authorized scheduled agent is actually enabled and observed.

## Sprint 01 state
Initial CI at `7606717` has passed 10 engine tests and build. An actual browser/UI smoke is not yet verified, so it is NOT completed. The next authorized action is to verify the browser and fix issues; then begin Sprint 02.
