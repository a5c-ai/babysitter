/**
 * FIX-011 regression: the published bins must answer the harmless smoke
 * arguments the release gate uses.
 *
 * `scripts/verify-release-artifacts.mjs` invokes every declared bin from the
 * installed tarball with `--help` (see `binSmokeArgs` in
 * scripts/lib/package-surface.cjs). `kradle-server --help` used to fall through
 * and START the HTTP server, so the smoke call bound a port and hung until the
 * gate timed it out (ETIMEDOUT). Neither flag may open a socket.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));

function runBin(binTarget, args) {
  return execFileSync(process.execPath, [path.join(packageRoot, binTarget), ...args], {
    encoding: 'utf8',
    timeout: 30_000,
  });
}

for (const [binName, binTarget] of Object.entries(manifest.bin)) {
  test(`${binName} --help exits 0 without starting a server`, () => {
    const stdout = runBin(binTarget, ['--help']);
    assert.match(stdout, /Usage:/);
    assert.doesNotMatch(stdout, /"status":\s*"listening"/);
  });
}

test('kradle-server --version prints the package version without starting a server', () => {
  const stdout = runBin(manifest.bin['kradle-server'], ['--version']);
  assert.equal(stdout.trim(), manifest.version);
});
