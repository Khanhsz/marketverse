import { mkdirSync, writeFileSync } from 'node:fs';
import { STRATEGIES, runScenario } from '../src/engine/scenarios.ts';
const seeds = process.env.BALANCE_SEEDS?.split(',').map(Number) || [7, 42, 99, 20261020];
const rows = [];
for (const seed of seeds)
  for (const strategy of STRATEGIES) {
    const result = runScenario(seed, strategy);
    rows.push(result);
    console.log(JSON.stringify(result));
  }
const summary = {
  scenarioVersion: 1,
  seeds,
  strategies: STRATEGIES,
  rows,
  completed: rows.filter((r) => r.turns === 104).length,
  bankrupt: rows.filter((r) => r.bankrupt).length,
  positiveProfit: rows.filter((r) => r.profit > 0).length,
  meanScore: rows.reduce((n, r) => n + r.score, 0) / rows.length,
};
mkdirSync('docs/validation', { recursive: true });
writeFileSync(
  process.env.BALANCE_OUTPUT || 'docs/validation/BALANCE_14.json',
  JSON.stringify(summary, null, 2) + '\n',
);
if (
  summary.completed !== rows.length ||
  summary.bankrupt ||
  new Set(rows.filter((r) => r.profit > 0).map((r) => r.strategy)).size < 2
)
  throw new Error(
    'Balance acceptance failed: campaigns must complete with at least two profitable strategies',
  );
