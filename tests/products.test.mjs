import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialGame,
  advanceWeek,
  serializeGame,
  deserializeGame,
} from '../src/engine/game.ts';
import { defaultUpgrade, billOfMaterials, quoteResearch } from '../src/engine/products.ts';
import { productUtility } from '../src/engine/demand.ts';
test('R&D requires cash and time and creates a new SKU without upgrading old inventory', () => {
  let s = createInitialGame();
  const original = structuredClone(s.products[0]),
    attributes = defaultUpgrade(original);
  s = advanceWeek(s, {
    id: 'design',
    expectedWeek: 1,
    projects: [{ kind: 'research', productId: 'nova', attributes, segment: 'premium' }],
  });
  assert.equal(s.products.filter((p) => p.companyId === 'player').length, 1);
  assert.equal(s.reports.at(-1).financials[0].expenses >= 30000, true);
  for (let i = 0; i < 5; i++) s = advanceWeek(s);
  const fresh = s.products.find((p) => p.parentId === 'nova');
  assert.ok(fresh);
  assert.equal(fresh.inventory, 0);
  assert.equal(fresh.cost, billOfMaterials(attributes).total);
  assert.equal(fresh.segment, 'premium');
  assert.equal(s.products[0].quality, original.quality);
  assert.equal(s.products[0].attributes.design, original.attributes.design);
  assert.equal(s.policies.player.production.nova, 0);
  assert.deepEqual(advanceWeek(deserializeGame(serializeGame(s))), advanceWeek(s));
});
test('performance/design/durability change demand and bills of materials; ambitious research costs more', () => {
  const s = createInitialGame(),
    p = s.products[0],
    city = s.cities[1],
    better = { ...p, attributes: { ...p.attributes, performance: 98, design: 98, durability: 98 } };
  assert.ok(productUtility(better, city, 'premium') > productUtility(p, city, 'premium'));
  assert.ok(billOfMaterials(better.attributes).total > billOfMaterials(p.attributes).total);
  assert.ok(
    quoteResearch(p, { quality: 100, design: 100, performance: 100, durability: 100 }).cost >
      quoteResearch(p).cost,
  );
  assert.throws(() => quoteResearch(p, p.attributes), /unchanged/);
});
test('version-4 saves gain attributes without altering previous SKU economics', () => {
  const s = createInitialGame(),
    legacy = structuredClone(s);
  legacy.version = 4;
  for (const p of legacy.products) {
    delete p.attributes;
    delete p.revision;
    delete p.lifecycle;
  }
  const migrated = deserializeGame(JSON.stringify(legacy));
  assert.equal(migrated.products[0].price, s.products[0].price);
  assert.equal(migrated.products[0].cost, s.products[0].cost);
  assert.deepEqual(migrated.products[0].attributes, s.products[0].attributes);
});
