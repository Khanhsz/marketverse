# Alpha candidate known issues and scope

Historical Sprint 16 evidence belongs to its recorded commit. A later map update introduced an invalid two-byte PNG; the P0 repair now passes local asset, map, UI, 104-week production-browser and exact replay checks, GitHub CI and the deployed map journey. Deployed acceptance is recorded separately in `validation/P0_MAP_STABILITY.md`. This does not claim that every strategy, browser or edge case has been exhaustively verified.

- Human gameplay review is still required before formal release. The working branch has not been merged into `main`; an Alpha review deployment exists at https://marketverse-alpha.onrender.com. There is no formal GitHub Release.
- Automated browser evidence covers Chromium at laptop/desktop sizes and pixel densities 1×/2×. Firefox, Safari, mobile/touch and assistive-technology user testing have not been completed.
- On the cloud software renderer, the 1440×900 2× map profile is slower than 1×. See the recorded UI profile; the renderer is idle between interactions. Hardware-specific performance remains a manual review item.
- The industry uses generic component kits and deterministic configurable unit conversion costs. Facilities have simplified capacities/operating costs; there is no raw-material commodity market, depreciation, receivables or international trade in this Alpha.
- Shipping charges and lead times use graph links (up to three weeks). Stock is physically located and unavailable in transit; route geography matters through the connected graph. There is no congestion simulation.
- Large fixed production targets can accumulate paid inventory. Low-margin and high-media policies lose money on some tested seeds; the balance sweep preserves those outcomes. A solvent company is not automatically profitable or successful.
- Old saves migrate into the current rules. Replays begin at the checkpoint displayed in the export button; unrecorded pre-migration commands cannot be recovered. Imported files replace progress only after validation and explicit local confirmation.
- UI language is English. The map has keyboard alternatives, focus-contained dialogs and improved contrast, but no formal accessibility certification is claimed.
- GitHub connector access is available for the P0 follow-up. Historical remote-CI limitations are not evidence of the latest workflow result; current CI and local/deployed validation must be recorded separately.
- No unattended Work/Codex coding runner, paid runner or OpenAI API key is configured. GitHub Actions validates code and does not launch a coding agent.
