import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGame } from '../src/engine/game.ts';
import { nationalCities } from '../src/data/country.ts';
import {
  CITY_ARTWORK_ANCHORS,
  CITY_LABEL_OFFSETS,
  cityWorldPoint,
  cityLabelPoint,
  cityCardBounds,
} from '../src/map/cityAnchors.ts';

test('the artwork has one grounded normalized anchor and label offset per national city', () => {
  const cities = nationalCities();
  assert.equal(cities.length, 8);
  assert.deepEqual(cities.map((c) => c.id).sort(), Object.keys(CITY_ARTWORK_ANCHORS).sort());
  assert.deepEqual(
    Object.keys(CITY_LABEL_OFFSETS).sort(),
    Object.keys(CITY_ARTWORK_ANCHORS).sort(),
  );
  for (const city of cities) {
    const normalized = CITY_ARTWORK_ANCHORS[city.id];
    assert.ok(normalized.x > 0 && normalized.x < 1);
    assert.ok(normalized.y > 0 && normalized.y < 1);
    const point = cityWorldPoint(city);
    assert.equal(point.x, normalized.x * 1920);
    assert.equal(point.y, normalized.y * 1280);
  }
});

test('city art anchors do not modify saved simulation coordinates or legacy hit locations', () => {
  const initial = createInitialGame();
  const before = structuredClone(initial.cities);
  assert.deepEqual(initial.cities.map((c) => c.id).sort(), ['central', 'north', 'south']);
  for (const city of initial.cities) {
    assert.deepEqual(cityWorldPoint(city, 'legacy'), { x: city.x * 2, y: city.y * 2 });
    assert.ok(cityWorldPoint(city, 'artwork').x !== city.x * 2);
  }
  assert.deepEqual(initial.cities, before);
  const unknown = { id: 'future-city', x: 110, y: 140 };
  assert.deepEqual(cityWorldPoint(unknown), { x: 220, y: 280 });
});

test('all city operation cards stay within the atlas and do not overlap each other', () => {
  const cities = nationalCities();
  // Every selection state uses one expanded card and seven compact chips.
  // Test real rendered geometry, not eight hypothetical expanded cards.
  for (const selected of cities) {
    const cards = cities.map((city) => ({
      id: city.id,
      ...cityCardBounds(city, 'artwork', city.id === selected.id),
    }));
    for (const card of cards) {
      assert.ok(card.x >= 0 && card.x + card.width <= 1920, selected.id + ': ' + card.id);
      assert.ok(card.y >= 0 && card.y + card.height <= 1280, selected.id + ': ' + card.id);
    }
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const a = cards[i],
          b = cards[j];
        const overlap =
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y;
        assert.equal(overlap, false, selected.id + ': ' + a.id + ' overlaps ' + b.id);
      }
    }
  }
  for (const city of cities) {
    const offset = CITY_LABEL_OFFSETS[city.id];
    const point = cityWorldPoint(city);
    const label = cityLabelPoint(city);
    assert.equal(label.x, point.x + 40 + offset.dx * 1.25);
    assert.equal(label.y, point.y - 18 + offset.dy * 1.25);
  }
});
