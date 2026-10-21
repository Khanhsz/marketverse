import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialGame,
  advanceWeek,
  serializeGame,
  deserializeGame,
} from '../src/engine/game.ts';
import { brandKey } from '../src/engine/people.ts';
import { calculateDemand } from '../src/engine/demand.ts';
import { cityOperationalStats } from '../src/engine/entityStats.ts';
const plan = (s, policy = s.policies.player, projects = []) => ({
  id: 'people-' + s.absoluteWeek,
  expectedWeek: s.absoluteWeek,
  policy,
  projects,
});
test('targeted media persists, is charged, builds bounded awareness and decays without spending', () => {
  let s = createInitialGame();
  const key = brandKey('player', 'central', 'mainstream'),
    policy = { ...s.policies.player, media: { central: { mainstream: 5000 } } };
  const n = advanceWeek(s, plan(s, policy));
  assert.equal(n.policies.player.media.central.mainstream, 5000);
  assert.ok(n.brand[key] > 0);
  assert.equal(n.brand[brandKey('player', 'north', 'mainstream')], 0);
  assert.equal(
    n.ledger
      .filter((e) => e.companyId === 'player' && e.memo === 'Weekly marketing')
      .flatMap((e) => e.lines)
      .find((l) => l.account === 'marketing').amount,
    5000,
  );
  const without = structuredClone(n);
  without.brand = {};
  const buyers = (x) =>
    calculateDemand(x)
      .filter((c) => c.cityId === 'central' && c.segment === 'mainstream')[0]
      .allocations.find((a) => a.productId === 'nova').desired;
  assert.ok(buyers(n) > buyers(without));
  const quiet = { ...n.policies.player, media: {} };
  const decayed = advanceWeek(n, plan(n, quiet));
  assert.ok(decayed.brand[key] < n.brand[key]);
  assert.ok(decayed.brand[key] >= 0);
  assert.deepEqual(advanceWeek(deserializeGame(serializeGame(n))), advanceWeek(n));
});
test('hiring has cost and delay, then persistent payroll and measurable staffing capacity', () => {
  let s = createInitialGame();
  s.staff.player.sales = 0;
  s = advanceWeek(s, plan(s, s.policies.player, [{ kind: 'hiring', role: 'sales', quantity: 2 }]));
  assert.equal(s.staff.player.sales, 0);
  assert.ok(
    s.reports
      .at(-1)
      .sales.filter((r) => r.productId === 'nova')
      .every((r) => r.units === 0),
  );
  s = advanceWeek(s);
  assert.equal(s.staff.player.sales, 2);
  const units = s.reports
    .at(-1)
    .sales.filter((r) => r.productId === 'nova')
    .reduce((n, r) => n + r.units, 0);
  assert.ok(units > 0 && units <= 150);
  assert.ok(
    s.ledger.some(
      (e) =>
        e.companyId === 'player' &&
        e.memo === 'Weekly payroll' &&
        e.lines.some(
          (l) =>
            l.amount ===
            Math.round(
              700 * cityOperationalStats(s.cities.find((c) => c.id === 'central')).wageIndex,
            ),
        ),
    ),
  );
  assert.throws(
    () =>
      advanceWeek(
        s,
        plan(s, s.policies.player, [{ kind: 'hiring', role: 'unknown', quantity: 3 }]),
      ),
    /hiring/,
  );
});
test('unfunded media does not create free brand awareness', () => {
  let s = createInitialGame();
  s.staff.player.sales = 0;
  s.companies[0].cash = 0;
  for (const [account, value] of Object.entries(s.finance.player.opening))
    if (account === 'cash') s.finance.player.opening.cash = 0;
  s.finance.player.opening.equity += 2500000;
  s.finance.player.balances = { ...s.finance.player.opening };
  s = advanceWeek(s, plan(s, { ...s.policies.player, media: { central: { premium: 10000 } } }));
  assert.equal(s.brand[brandKey('player', 'central', 'premium')], 0);
  assert.ok(s.finance.player.balances.payable < 0);
});
