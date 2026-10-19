# Balance and conservation methodology

`npm run test:balance` runs five documented player policies against all four AI archetypes for 104 weeks on seeds 7, 42, 99 and 20261020. It writes `BALANCE_14.json` and fails if a campaign cannot complete, the player defaults, or fewer than two strategies earn positive operating profit. This is a replicable Alpha sweep, not a claim of universal strategy balance or exhaustive exploit freedom.

Every turn independently audits opening physical goods + manufactured goods − fulfilled goods = closing physical goods, including cargo in transit and legacy/new SKUs. It checks cash movements against journal cash postings, prices against fulfilled revenue, and stock/staff attribution against unmet preferred orders. Engine validation separately reconciles double-entry balances and inventory cost basis. Opening assets and stock are an explicit initial capital endowment, not free weekly resources.

Policies:

- Margin: 2.6× unit cost, 100-unit target, restrained media.
- Volume: 1.55× cost, 200-unit target. Overproduction ties up cash; low margin must cover salaries/rent.
- Innovator: 2.5× cost, 140-unit target, periodic paid R&D with SKU lifecycle transitions.
- Expander: 1.9× cost, 200-unit target, quarterly stores and physical shipments to owned nodes.
- Brand: 2.1× cost, 140-unit target, 6,000-credit weekly national media investment.

Results retain negative-profit and stockout outcomes. Solvent does not mean profitable; inventory is an asset with a cash cost and cannot be counted as sales. No assertions, expenses or inventory requirements are disabled to make a policy win. Adversarial tests cover negative/overflow orders, loan roundtrips and duplicate command replay. Future human gameplay review should tune pacing and improve policies that overspend or overproduce.

Timing is recorded as p95/max engine turn duration on the actual cloud machine, using sequential campaigns to avoid artificial parallel contention. Browser frame and layout checks are separate in Sprint 15/16.
