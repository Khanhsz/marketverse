# MarketVerse — product review follow-up

Authorized on 2026-10-20: work through the Senior PO priorities one step at a time. Preserve the approved clean country artwork, weekly simulation, single country, no fog and laptop-first scope.

## P0 — restore a reliable playable build

Status: implementation and local verification in progress. Deployment is not accepted until the fixed commit is live and its behavior is checked.

- Restore the approved 1536×1024 country PNG, keeping game UI and interactive entities separate.
- Keep artwork mounted through selection, layer changes and weekly state updates.
- Rebuild visible business entities at zoom thresholds; hidden markers must not receive clicks.
- Recover from a failed image request without replacing the saved company.
- Fail production builds on missing, truncated, corrupt or unapproved artwork.
- Validate the same build through map interaction, save/reload, weekly planning and the existing campaign journey.

Evidence belongs in `validation/P0_MAP_STABILITY.md`; record deployment and local checks separately. The older Sprint 16 evidence describes its recorded source commit and is not automatically evidence for later map changes.

## P1 — first twelve weeks

Queued. Make the main start flow clear, introduce decisions through playable situations and give the player a short-term business objective. Acceptance requires observing new players; simulated test users are not a substitute.

## P1 — contextual map actions

Queued. Link a selected city's stock, staffing and distribution problems to relevant actions, with visible cost and lead time before commitment.

## P1 — understandable weekly results

Queued. Surface at most three material changes with links to supporting reports and available actions. Distinguish measured stock/staff losses from estimated preference effects.

## P2 — strategy balance and campaign pacing

Queued. Review several viable policies and intermediate business milestones through human playtests and scenario evidence. Do not infer universal balance from the existing four-seed sweep.

International expansion, extra industries and mobile-first redesign remain outside this sequence.
