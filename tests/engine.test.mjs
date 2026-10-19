import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGame, advanceWeek, calendarOf, createRng, validateState, serializeGame, deserializeGame } from '../src/engine/game.ts';

test('initial state has 3 cities, 3 companies and a valid player', () => {
  const s = createInitialGame();
  assert.equal(s.cities.length, 3);
  assert.equal(s.companies.length, 3);
  assert.equal(s.companies.find(x => x.id === s.playerId).control, 'human');
  assert.doesNotThrow(() => validateState(s));
});
test('one turn advances exactly one week and produces one report', () => {
  const s = createInitialGame();
  const next = advanceWeek(s);
  assert.equal(next.absoluteWeek, 2);
  assert.equal(next.week, 2);
  assert.equal(next.reports.length, 1);
});
test('52 weeks roll over to year 2 week 1', () => {
  assert.deepEqual(calendarOf(53), { year: 2, week: 1 });
  assert.deepEqual(calendarOf(52), { year: 1, week: 52 });
});
test('104 weeks roll over to year 3 week 1', () => {
  assert.deepEqual(calendarOf(105), { year: 3, week: 1 });
});
test('calendar rejects invalid week numbers', () => {
  for (const n of [-1, 0, 1.5, NaN]) assert.throws(() => calendarOf(n));
});
test('seeded RNG gives reproducible numbers within [0,1)', () => {
  const a = createRng(123);
  const b = createRng(123);
  for (let i = 0; i < 30; i++) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1);
  }
});
test('duplicate city identifiers invalidate state', () => {
  const state = createInitialGame();
  state.cities[1].id = state.cities[0].id;
  assert.throws(() => validateState(state), /Duplicate/);
});
test('advanceWeek does not mutate input state', () => {
  const initial = createInitialGame();
  const before = JSON.stringify(initial);
  advanceWeek(initial);
  assert.equal(JSON.stringify(initial), before);
});
test('foundation has no phantom cash or inventory changes', () => {
  const initial = createInitialGame();
  const next = advanceWeek(initial);
  assert.deepEqual(next.companies.map(x => x.cash), initial.companies.map(x => x.cash));
  assert.deepEqual(next.products.map(x => x.inventory), initial.products.map(x => x.inventory));
  assert.ok(Object.values(next.reports[0].cashDelta).every(x => x === 0));
});
test('save serialization roundtrip and invalid save rejection', () => {
  const initial = createInitialGame();
  assert.deepEqual(deserializeGame(serializeGame(initial)), initial);
  assert.throws(() => deserializeGame('{"version":999}'));
  assert.throws(() => deserializeGame('not json'));
});
