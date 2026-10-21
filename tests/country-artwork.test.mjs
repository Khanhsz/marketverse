import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { COUNTRIES } from '../src/data/countries.ts';
import { COUNTRY_ARTWORK_LAYOUT, countryArtworkPath } from '../src/map/countryArtwork.ts';

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const pngEnd = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

test('every gameplay country has one independently decodable artwork layer', () => {
  assert.equal(COUNTRIES.length, 38);
  assert.equal(Object.keys(COUNTRY_ARTWORK_LAYOUT).length, COUNTRIES.length);
  for (const country of COUNTRIES) {
    const placement = COUNTRY_ARTWORK_LAYOUT[country.id];
    assert.ok(placement, `${country.id} has a renderer placement`);
    assert.ok(placement.width >= 150 && placement.width <= 240);
    const publicUrl = countryArtworkPath(country);
    const file = fileURLToPath(new URL(`../public${publicUrl}`, import.meta.url));
    const bytes = readFileSync(file);
    assert.ok(bytes.subarray(0, 8).equals(pngSignature), `${country.id} is a PNG`);
    assert.ok(bytes.subarray(-12).equals(pngEnd), `${country.id} PNG is complete`);
    assert.ok(bytes.readUInt32BE(16) >= 200 && bytes.readUInt32BE(20) >= 100);
    assert.ok(statSync(file).size > 10_000, `${country.id} artwork is non-trivial`);
  }
});

test('country artwork manifest stays aligned with gameplay country ids', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('../public/maps/countries/manifest.json', import.meta.url), 'utf8'),
  );
  assert.equal(manifest.count, COUNTRIES.length);
  assert.deepEqual(new Set(manifest.countries), new Set(COUNTRIES.map((country) => country.id)));
});
