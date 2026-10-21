import test from 'node:test';
import assert from 'node:assert/strict';
import { createNationalCampaign } from '../src/engine/campaign.ts';
import { CITY_PROFILES, WORLD_ENTITIES } from '../src/data/worldEntities.ts';
import {
  cityEntities,
  cityOperationalStats,
  facilityOperationalStats,
  transportQuoteModifiers,
} from '../src/engine/entityStats.ts';

test('all 57 map entities have stable identity, city ownership and complete operating stats', () => {
  const state = createNationalCampaign();
  assert.equal(WORLD_ENTITIES.length, 57);
  assert.equal(new Set(WORLD_ENTITIES.map((entity) => entity.id)).size, WORLD_ENTITIES.length);
  for (const entity of WORLD_ENTITIES) {
    assert.ok(state.cities.some((city) => city.id === entity.cityId));
    assert.ok(entity.name.length > 3);
    assert.equal(entity.status, 'operational');
    assert.ok(Number.isInteger(entity.stats.level) && entity.stats.level > 0);
    assert.ok(entity.stats.condition >= 1 && entity.stats.condition <= 100);
    assert.ok(entity.stats.workforce >= 0);
    assert.ok(entity.stats.capacity > 0);
    assert.ok(entity.stats.weeklyUpkeep > 0);
    for (const key of ['demandBoost', 'logisticsBoost', 'productivityBoost', 'retailBoost'])
      assert.ok(Number.isFinite(entity.stats[key]) && entity.stats[key] >= 0);
  }
  for (const city of state.cities) {
    assert.ok(cityEntities(city.id).length > 0);
    assert.ok(cityEntities(city.id).some((entity) => entity.kind === 'city'));
  }
});

test('every national city profile drives bounded demand, logistics, capacity and cost modifiers', () => {
  const state = createNationalCampaign();
  assert.deepEqual(
    new Set(state.cities.map((city) => city.id)),
    new Set(Object.keys(CITY_PROFILES)),
  );
  for (const city of state.cities) {
    const stats = cityOperationalStats(city);
    assert.ok(stats.growthRate > 0 && stats.growthRate < 0.1);
    assert.ok(stats.wageIndex > 0 && stats.rentIndex > 0);
    assert.ok(stats.taxRate > 0 && stats.taxRate < 1);
    assert.ok(stats.infrastructure >= 0 && stats.infrastructure <= 100);
    assert.ok(stats.talentIndex >= 0 && stats.talentIndex <= 100);
    assert.ok(stats.demandMultiplier >= 0.9 && stats.demandMultiplier <= 1.35);
    assert.ok(stats.logisticsMultiplier >= 0.58 && stats.logisticsMultiplier <= 1.18);
    assert.ok(stats.productivityMultiplier > 0 && stats.productivityMultiplier <= 1.35);
    assert.ok(stats.retailMultiplier > 0 && stats.retailMultiplier <= 1.35);
  }
  assert.notEqual(cityOperationalStats(state.cities[0]), cityOperationalStats(state.cities[1]));
});

test('every facility kind exposes usable stats and transport modifiers are deterministic', () => {
  const state = createNationalCampaign();
  const city = state.cities.find((item) => item.id === 'central');
  for (const kind of ['hq', 'store', 'factory', 'warehouse', 'rd']) {
    const stats = facilityOperationalStats(
      { id: kind, name: kind, kind, companyId: 'player', cityId: city.id },
      city,
    );
    assert.ok(stats.capacity > 0 && stats.workforce > 0 && stats.weeklyCost > 0);
    assert.ok(stats.condition > 0 && stats.efficiency > 0);
  }
  const from = state.cities.find((item) => item.id === 'north');
  const to = state.cities.find((item) => item.id === 'harbor');
  assert.deepEqual(transportQuoteModifiers(from, to), transportQuoteModifiers(from, to));
  assert.ok(transportQuoteModifiers(from, to).cost > 0);
});
