import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkMapAssets } from '../scripts/check-map-assets.mjs';

const artwork = readFileSync(new URL('../public/marketverse-ocean.png', import.meta.url));
const manifest = readFileSync(new URL('../public/maps/v6/map-manifest.json', import.meta.url));
function withImage(bytes, inspect) {
  const root = mkdtempSync(join(tmpdir(), 'marketverse-map-'));
  try {
    mkdirSync(join(root, 'public/maps/v6'), { recursive: true });
    writeFileSync(join(root, 'public/maps/v6/map-manifest.json'), manifest);
    writeFileSync(join(root, 'public/marketverse-ocean.png'), bytes);
    inspect(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
test('ocean-only underlay is a complete decoded PNG with the recorded checksum', () => {
  assert.equal(checkMapAssets().bytes, 784665);
});
test('combined world-atlas PNG is absent from the runtime bundle', () => {
  assert.equal(
    existsSync(new URL('../public/marketverse-v6-map-clean.png', import.meta.url)),
    false,
  );
});
test('map gate rejects the original two-byte upload and HTML masquerading as an image', () => {
  for (const invalid of [Buffer.from('\r\n'), Buffer.from('<html>Not found</html>')])
    withImage(invalid, (root) => assert.throws(() => checkMapAssets(root), /not a PNG/));
});
test('map gate rejects truncated or corrupted image data', () => {
  withImage(artwork.subarray(0, artwork.length - 24), (root) =>
    assert.throws(() => checkMapAssets(root), /truncated|incomplete/),
  );
  const corrupt = Buffer.from(artwork);
  corrupt[Math.floor(corrupt.length / 2)] ^= 1;
  withImage(corrupt, (root) => assert.throws(() => checkMapAssets(root), /corrupt chunk/));
});
