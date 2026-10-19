# Sprint 14 balance results — 2026-10-20

20 full 104-week campaigns: **20 completed, 0 player bankruptcies, 14 positive-profit outcomes**. No physical/cash/fulfillment invariant failure occurred. Three policies (margin, innovator, expander) were profitable on all four tested seeds.

| Policy | Mean profit (credits) | Profit range | Score range | Profitable seeds |
|---|---:|---:|---:|---:|
| margin | 353,426 | 305,906 to 438,566 | 56–56 | 4/4 |
| volume | -35,125 | -57,004 to 4,876 | 42–43 | 1/4 |
| innovator | 1,102,577 | 1,003,645 to 1,238,859 | 81–81 | 4/4 |
| expander | 839,150 | 805,170 to 906,178 | 74–74 | 4/4 |
| brand | -12,558 | -63,728 to 73,632 | 54–59 | 1/4 |

Maximum per-campaign p95 turn time: **39.5 ms**. Maximum observed individual turn: **48.9 ms**. Measured sequentially on the cloud machine; this is engine timing, not a browser frame-rate guarantee.

Volume and brand policies lose money on three seeds. Their raw outcomes are retained: volume overproduces and ties up cash in stock; brand investment does not always repay its recurring cost. Innovator leads this sweep but pays for R&D, higher unit cost and time; expander also succeeds through paid stores and physical shipping. These comparisons motivate human balance review rather than a universal optimal-policy claim.

Run `npm run test:balance` to reproduce. See `BALANCE_METHOD.md` and raw `BALANCE_14.json`.
