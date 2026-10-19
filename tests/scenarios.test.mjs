import test from 'node:test';
import assert from 'node:assert/strict';
import { createNationalCampaign } from '../src/engine/campaign.ts';
import { advanceWeek } from '../src/engine/game.ts';
import { runScenario, auditTransition } from '../src/engine/scenarios.ts';
test('scenario harness is reproducible and audits physical/cash invariants across strategies', () => {
  for (const strategy of ['margin', 'expander']) {
    const a = runScenario(11, strategy, 26),
      b = runScenario(11, strategy, 26);
    const stable = ({ p95TurnMs, maxTurnMs, ...rest }) => rest;
    assert.deepEqual(stable(a), stable(b));
    assert.equal(a.turns, 26);
    assert.equal(a.bankrupt, false);
    assert.equal(a.endingStock, 400 + a.produced - a.sold);
  }
  const s = createNationalCampaign(),
    next = advanceWeek(s),
    bad = structuredClone(next);
  bad.stocks[0].quantity++;
  assert.throws(() => auditTransition(s, bad), /conservation/);
  bad.stocks[0].quantity--;
  bad.companies[0].cash++;
  assert.throws(() => auditTransition(s, bad), /Cash flow/);
});
test('negative orders, price overflow, repeated commands and round-trip loans cannot create free profit', () => {
  const s = createNationalCampaign(),
    plan = {
      id: 'exploit',
      expectedWeek: 1,
      projects: [],
      financing: { borrow: 500000, repay: 500000 },
    };
  const baseline = advanceWeek(s),
    roundtrip = advanceWeek(s, plan);
  assert.equal(roundtrip.companies[0].cash, baseline.companies[0].cash);
  assert.equal(
    roundtrip.reports.at(-1).financials[0].profit,
    baseline.reports.at(-1).financials[0].profit,
  );
  assert.throws(() => advanceWeek(roundtrip, plan), /Stale|duplicate/);
  assert.throws(
    () => advanceWeek(s, { ...plan, financing: { borrow: -1, repay: 0 } }),
    /financing/,
  );
  assert.throws(
    () =>
      advanceWeek(s, {
        ...plan,
        financing: undefined,
        policy: { ...s.policies.player, prices: { nova: Infinity } },
      }),
    /policy/,
  );
  const extreme = advanceWeek(s, {
    ...plan,
    financing: undefined,
    policy: { ...s.policies.player, prices: { nova: 1000000 } },
  });
  assert.equal(
    extreme.reports
      .at(-1)
      .sales.filter((r) => r.productId === 'nova')
      .reduce((n, r) => n + r.units, 0),
    0,
  );
});
