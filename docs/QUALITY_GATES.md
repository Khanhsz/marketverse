# MarketVerse — Quality Gates

## All sprints
- [ ] Source committed to a branch with traceable changes.
- [ ] Typecheck and production build PASS.
- [ ] Behavioral regression tests PASS (not just grep tests).
- [ ] New gameplay formulas have deterministic tests / invariants.
- [ ] Browser smoke performed if UI or Pixi renderer changed.
- [ ] No serious performance or browser rendering regression.
- [ ] Design and sprint state docs updated.
- [ ] Unresolved blockers stated accurately.
- [ ] No external API key or paid action introduced without permission.

## Sprint 01 closure
- [x] Foundation source committed and GitHub Actions verified on commit `7606717`.
- [x] 10 engine behavioral tests passed in GitHub Actions.
- [x] React/TypeScript/Pixi production bundle built in GitHub Actions.
- [x] Open app in real browser: map displays without a Pixi runtime error.
- [x] Click each city and verify contextual panel updates.
- [x] Click Next Week and check calendar progression and localStorage save.
- [x] Reload and verify saved week; Reset restores week 1.
- [x] Check viewport at typical laptop width.

## Sprint transition
Only a coding agent with actual source/test access can attest a test gate. Never treat a mock, inferred result, or checklist checkbox as a verified test. If a gate is not available in the execution environment, mark pending.
