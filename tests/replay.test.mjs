import { gunzipSync } from 'node:zlib';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createInitialGame,
  advanceWeek,
  serializeGame,
  deserializeGame,
  SCHEMA_VERSION,
} from '../src/engine/game.ts';
import { createNationalCampaign } from '../src/engine/campaign.ts';
import { replayGame } from '../src/engine/replay.ts';
import { scenarioOrders } from '../src/engine/scenarios.ts';
test('historical version 1–8 fixtures preserve progress, money and stock and continue deterministically', () => {
  for (let version = 1; version <= 8; version++) {
    for (const suffix of ['', '-week2']) {
      const raw = readFileSync(
          new URL(`./fixtures/save-v${version}${suffix}.json`, import.meta.url),
          'utf8',
        ),
        original = JSON.parse(raw);
      let state = deserializeGame(raw);
      assert.equal(state.version, SCHEMA_VERSION);
      assert.equal(state.absoluteWeek, original.absoluteWeek);
      assert.equal(state.companies[0].cash, original.companies[0].cash);
      assert.equal(state.products[0].inventory, original.products[0].inventory);
      for (let week = 0; week < 6; week++) {
        const resumed = advanceWeek(deserializeGame(serializeGame(state))),
          direct = advanceWeek(state);
        assert.equal(serializeGame(resumed), serializeGame(direct));
        state = direct;
      }
      assert.equal(serializeGame(replayGame(state.replay)), serializeGame(state));
    }
  }
});
test('104-week recorded command replay exactly reproduces terminal state, ledger and objectives', () => {
  let state = createNationalCampaign(1234);
  for (let i = 0; i < 104; i++) state = advanceWeek(state, scenarioOrders(state, 'innovator'));
  assert.equal(state.replay.commands.length, 104);
  assert.equal(serializeGame(replayGame(state.replay)), serializeGame(state));
  const invalid = structuredClone(state.replay);
  invalid.commands[2].expectedWeek++;
  assert.throws(() => replayGame(invalid), /Stale|duplicate|replay/);
});
test('malformed reports and fabricated profit are rejected before imported data reaches the UI', () => {
  const state = advanceWeek(createInitialGame());
  for (const corrupt of [
    (s) => (s.reports[0] = null),
    (s) => (s.reports[0].events = null),
    (s) => s.reports[0].financials[0].profit++,
    (s) => (s.reports[0].sales[0].units = -1),
    (s) => s.reports[0].demand[0].potential++,
    (s) => (s.replay.origin = '{}'),
    (s) => (s.cities[0].name = { invalid: 'label' }),
    (s) => (s.companies[0].name = 42),
  ]) {
    const s = structuredClone(state);
    corrupt(s);
    assert.throws(() => deserializeGame(JSON.stringify(s)));
  }
});

test('import rejects unknown strategies and invalid pending projects before future turns can break', () => {
  const state = advanceWeek(createInitialGame());
  for (const corrupt of [
    (s) => (s.companies[1].strategy = 'unknown'),
    (s) => (s.projects.find((p) => p.kind === 'construction').facilityKind = 'constructor'),
    (s) => (s.products = []),
  ]) {
    const s = structuredClone(state);
    corrupt(s);
    assert.throws(() => deserializeGame(JSON.stringify(s)));
  }
  const duplicate = structuredClone(state),
    pending = duplicate.projects.find((p) => p.kind === 'construction');
  duplicate.projects.push({ ...pending, id: 'duplicate' });
  assert.throws(() => deserializeGame(JSON.stringify(duplicate)), /pending construction/);
  const research = advanceWeek(createInitialGame(), {
    id: 'test-research',
    expectedWeek: 1,
    projects: [{ kind: 'research', productId: 'nova' }],
  });
  research.projects[0].segment = 'invalid';
  assert.throws(() => deserializeGame(JSON.stringify(research)), /segment/);
});

test('completed historical national campaign migrates without losing results or pretending past commands exist', () => {
  const raw = gunzipSync(
      readFileSync(new URL('./fixtures/save-v8-completed.json.gz', import.meta.url)),
    ).toString('utf8'),
    legacy = JSON.parse(raw),
    state = deserializeGame(raw);
  assert.equal(state.absoluteWeek, 105);
  assert.equal(state.campaign.status, 'completed');
  assert.equal(state.campaign.score.total, legacy.campaign.score.total);
  assert.deepEqual(state.companies, legacy.companies);
  assert.deepEqual(state.products, legacy.products);
  assert.equal(state.replay.commands.length, 0);
  assert.equal(JSON.parse(state.replay.origin).absoluteWeek, 105);
  assert.equal(serializeGame(replayGame(state.replay)), serializeGame(state));
});
