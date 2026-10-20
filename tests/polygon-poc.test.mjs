import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ISLAND,
  DISTRICTS,
  MAP_SIZE,
  generateBuildings,
  pointInPolygon,
} from '../src/poc/geometry.ts';

test('native polygon POC is deterministic and contains no reference to raster assets', () => {
  assert.deepEqual(generateBuildings(), generateBuildings());
  assert.ok(ISLAND.length >= 35);
  assert.deepEqual(MAP_SIZE, { width: 1500, height: 960 });
  const buildings = generateBuildings();
  assert.ok(buildings.length >= 40 && buildings.length <= 74, '40–74 buildings required');
  assert.equal(DISTRICTS.length, 3);
  assert.deepEqual(
    new Set(DISTRICTS.map((x) => x.id)),
    new Set(['northport', 'central', 'southbay']),
  );
  for (const b of buildings) {
    assert.ok(pointInPolygon({ x: b.x, y: b.y }, ISLAND), b.id + ' outside island');
    const district = DISTRICTS.find((d) => d.id === b.districtId);
    assert.ok(district);
    assert.ok(pointInPolygon({ x: b.x, y: b.y }, district.points), b.id + ' outside district');
    assert.ok(b.height > 0 && b.floors >= 1);
    assert.ok(['office', 'retail', 'warehouse', 'housing', 'factory'].includes(b.kind));
  }
  assert.equal(new Set(buildings.map((b) => b.id)).size, buildings.length);
});

test('polygon hit-test includes known centers and excludes outside points', () => {
  assert.equal(pointInPolygon({ x: 850, y: 440 }, DISTRICTS[1].points), true);
  assert.equal(pointInPolygon({ x: 80, y: 70 }, ISLAND), false);
  assert.equal(pointInPolygon({ x: 1450, y: 900 }, ISLAND), false);
  assert.equal(pointInPolygon({ x: 850, y: 440 }, DISTRICTS[0].points), false);
});
