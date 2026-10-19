import { readFileSync, readdirSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.version !== '0.1.0-alpha.1') throw new Error('Unexpected Alpha version');
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else
      files.push({
        path: relative('dist', path),
        bytes: statSync(path).size,
        sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
      });
  }
}
walk('dist');
const manifest = {
  version: pkg.version,
  sourceCommit,
  saveVersion: 9,
  replayRulesVersion: 1,
  publication: 'not published; human gameplay review required',
  files: files.sort((a, b) => a.path.localeCompare(b.path)),
};
writeFileSync('dist/release-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
mkdirSync('.artifacts', { recursive: true });
const artifact = `.artifacts/marketverse-${pkg.version}.tar.gz`;
execFileSync('tar', [
  '--sort=name',
  '--mtime=@0',
  '--owner=0',
  '--group=0',
  '--numeric-owner',
  '-czf',
  artifact,
  '-C',
  'dist',
  '.',
]);
const sha256 = createHash('sha256').update(readFileSync(artifact)).digest('hex');
writeFileSync(artifact + '.sha256', `${sha256}  ${artifact.split('/').at(-1)}\n`);
writeFileSync(
  'docs/validation/ALPHA_CANDIDATE.json',
  JSON.stringify(
    { ...manifest, artifact, artifactBytes: statSync(artifact).size, artifactSha256: sha256 },
    null,
    2,
  ) + '\n',
);
console.log(JSON.stringify({ artifact, sha256, sourceCommit, version: pkg.version }));
