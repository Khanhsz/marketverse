import test from 'node:test';
import assert from 'node:assert/strict';
import { adjustHiringPlan, plannedHires, mediaBudgetLimit } from '../src/ui/plannerModel.ts';
import { createInitialGame, advanceWeek } from '../src/engine/game.ts';

test('team +/- operates on planned hires and never decrements existing staff', () => {
  const original = createInitialGame();
  let queue = [{ kind: 'construction', cityId: 'north', facilityKind: 'store' }];
  queue = adjustHiringPlan(queue, 'production', 1);
  queue = adjustHiringPlan(queue, 'production', 1);
  queue = adjustHiringPlan(queue, 'sales', 1);
  assert.equal(plannedHires(queue, 'production'), 2);
  assert.equal(plannedHires(queue, 'sales'), 1);
  queue = adjustHiringPlan(queue, 'production', -1);
  assert.equal(plannedHires(queue, 'production'), 1);
  queue = adjustHiringPlan(queue, 'production', -1);
  queue = adjustHiringPlan(queue, 'production', -1);
  assert.equal(plannedHires(queue, 'production'), 0);
  assert.equal(queue.find((item) => item.kind === 'construction').cityId, 'north');
  assert.equal(original.staff.player.production, createInitialGame().staff.player.production);
});

test('batches are a request-size safeguard, not an artificial 6-person team cap', () => {
  let queue = [];
  for (let i = 0; i < 105; i++) queue = adjustHiringPlan(queue, 'research', 1);
  assert.equal(plannedHires(queue, 'research'), 105);
  assert.deepEqual(queue.filter((p) => p.kind === 'hiring').map((p) => p.quantity), [100, 5]);
  assert.equal(plannedHires(adjustHiringPlan(queue, 'research', -1), 'research'), 104);
});

test('media slider maximum follows remaining cash and other persistent media allocations', () => {
  const state = createInitialGame();
  const policy = {
    ...state.policies.player,
    marketing: 300,
    media: { central: { mainstream: 500, value: 700 }, north: { premium: 300 } },
  };
  assert.equal(mediaBudgetLimit(5000, policy, 'central', 'mainstream'), 3700);
  assert.equal(mediaBudgetLimit(500, policy, 'central', 'mainstream'), 0);
  assert.equal(mediaBudgetLimit(5000, policy, 'central', 'premium'), 3200);
});

test('engine permits team headcount above display-only limits while keeping valid hire costs', () => {
  const state = createInitialGame();
  state.staff.player.sales = 1002;
  assert.doesNotThrow(() => advanceWeek(state));
  const next = advanceWeek(createInitialGame(), {
    id: 'many-staff',
    expectedWeek: 1,
    policy: createInitialGame().policies.player,
    projects: [{ kind: 'hiring', role: 'research', quantity: 8 }],
  });
  assert.ok(next.projects.some((project) => project.kind === 'hiring' && project.quantity === 8));
});
