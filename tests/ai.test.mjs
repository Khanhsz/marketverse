import { initializeStaff } from '../src/engine/people.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialGame,
  advanceWeek,
  deserializeGame,
  serializeGame,
} from '../src/engine/game.ts';
import { observeMarket, planAI } from '../src/engine/ai.ts';
import { initialPolicies } from '../src/engine/orders.ts';
import { initializeFinance, validateFinance } from '../src/engine/finance.ts';
import { initializeStocks } from '../src/engine/operations.ts';
function scenario() {
  const s = createInitialGame();
  for (const [id, strategy] of [
    ['region', 'regional-specialist'],
    ['expand', 'aggressive-expander'],
  ]) {
    s.companies.push({ id, name: id, control: 'ai', cash: 2000000, debt: 0, strategy });
    s.products.push({ ...s.products[0], id: 'sku-' + id, companyId: id, name: id, inventory: 500 });
    s.facilities.push({
      id: 'store-' + id,
      name: id,
      kind: 'store',
      companyId: id,
      cityId: id === 'region' ? 'central' : 'south',
    });
  }
  s.policies = initialPolicies(s);
  s.stocks = initializeStocks(s);
  s.staff = initializeStaff(s);
  s.finance = initializeFinance(s);
  return s;
}
test('AI receives own resources and public prices, never private player policies or orders', () => {
  const s = scenario(),
    a = observeMarket(s, 'value'),
    before = JSON.stringify(a),
    plan = planAI(a);
  s.policies.player.prices.nova = 9999;
  s.policies.player.marketing = 999;
  s.commandHistory.push('private-plan');
  assert.deepEqual(observeMarket(s, 'value'), a);
  assert.equal(JSON.stringify(a), before);
  assert.deepEqual(planAI(observeMarket(s, 'value')), plan);
  assert.ok(a.products.every((p) => p.companyId === 'value'));
  assert.ok(a.projects.every((p) => p.companyId === 'value'));
});
test('four strategies complete 16 deterministic weeks through shared budget, queue and inventory rules', () => {
  let s = scenario();
  const initial = structuredClone(s);
  for (let week = 0; week < 16; week++) {
    s = advanceWeek(s);
    assert.doesNotThrow(() => validateFinance(s));
    assert.ok(s.companies.every((c) => c.cash >= 0));
    assert.ok(s.stocks.every((l) => l.quantity > 0));
  }
  assert.equal(s.absoluteWeek, 17);
  assert.equal(
    new Set(s.companies.filter((c) => c.control === 'ai').map((c) => c.strategy)).size,
    4,
  );
  for (const c of s.companies.filter((c) => c.control === 'ai')) {
    assert.ok(s.projects.some((p) => p.companyId === c.id && p.kind === 'construction'));
    assert.ok(
      s.reports.some((r) =>
        r.sales.some(
          (row) =>
            s.products.find((p) => p.id === row.productId).companyId === c.id && row.units > 0,
        ),
      ),
    );
    assert.equal(s.finance[c.id].bankrupt, false);
  }
  let replay = initial;
  for (let i = 0; i < 16; i++) replay = advanceWeek(replay);
  assert.equal(serializeGame(replay), serializeGame(s));
  assert.deepEqual(advanceWeek(deserializeGame(serializeGame(s))), advanceWeek(s));
});
test('insolvent AI cannot create free projects or cash', () => {
  const s = createInitialGame();
  s.companies[1].cash = 0;
  s.finance = initializeFinance(s);
  const plan = planAI(observeMarket(s, 'value'));
  assert.deepEqual(plan.projects, []);
});
