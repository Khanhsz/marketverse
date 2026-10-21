import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COUNTRIES,
  CONTINENT_HIT_AREAS,
  countryAtPoint,
  pointInPolygon,
} from '../src/data/countries.ts';

test('all 38 atlas countries have unique IDs, complete stats and a reachable hit region', () => {
  assert.equal(COUNTRIES.length, 38);
  assert.equal(new Set(COUNTRIES.map((country) => country.id)).size, COUNTRIES.length);
  for (const country of COUNTRIES) {
    assert.equal(countryAtPoint(country.center.x, country.center.y)?.id, country.id);
    assert.ok(country.capital && country.specialty && country.cityId);
    assert.ok(country.stats.population > 0);
    assert.ok(country.stats.gdpIndex > 0);
    assert.ok(country.stats.taxRate > 0 && country.stats.taxRate < 1);
    for (const key of ['stability', 'infrastructure', 'tradeOpenness'])
      assert.ok(country.stats[key] >= 0 && country.stats[key] <= 100);
  }
});

test('country hit testing excludes open ocean and resolves every continent deterministically', () => {
  assert.equal(countryAtPoint(960, 80), undefined);
  assert.equal(countryAtPoint(1450, 930), undefined);
  for (const [continent, polygon] of Object.entries(CONTINENT_HIT_AREAS)) {
    const countries = COUNTRIES.filter((country) => country.continent === continent);
    assert.ok(countries.length >= 2);
    assert.ok(
      countries.every((country) => pointInPolygon(country.center.x, country.center.y, polygon)),
    );
  }
  assert.equal(countryAtPoint(1300, 960)?.id, 'thuria');
  assert.equal(countryAtPoint(1300, 960)?.id, countryAtPoint(1300, 960)?.id);
});
