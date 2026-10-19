import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { replayGame } from '../src/engine/replay.ts';
import { serializeGame } from '../src/engine/game.ts';
const report = JSON.parse(readFileSync('docs/validation/ALPHA_BROWSER_16.json', 'utf8'));
assert.equal(
  report.production,
  true,
  'Alpha cross-runtime check requires the current production browser campaign',
);
const expected = readFileSync('.browser-artifacts/completed-save.json', 'utf8'),
  rawReplay = readFileSync('.browser-artifacts/completed-replay.json', 'utf8');
const hash = (value) => createHash('sha256').update(value).digest('hex');
assert.equal(hash(expected), report.saveSha256);
assert.equal(hash(rawReplay), report.replaySha256);
const actual = serializeGame(replayGame(JSON.parse(rawReplay).replay));
assert.equal(
  actual,
  expected,
  'Node and production Chromium must reproduce exactly the same canonical state',
);
const result = {
  runId: report.runId,
  node: process.version,
  chromium: report.browserVersion,
  weeks: 104,
  exactCanonicalState: true,
  sha256: hash(actual),
};
writeFileSync(
  'docs/validation/ALPHA_CROSS_RUNTIME_16.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result));
