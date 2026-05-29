// Tests for scripts/check-processes.mjs — the HYPOTHESES falsifier lint.
//
// Uses Node's built-in node:test runner so no additional dev-deps are
// required at the repo root (the existing `vitest` lives inside the
// SDK workspace; this script is at the repo root and stays plain Node).
//
// Run:
//   node --test scripts/__tests__/check-processes.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const script = resolve(repoRoot, 'scripts', 'check-processes.mjs');
const fixtures = resolve(repoRoot, 'scripts', '__fixtures__', 'processes');

function runLint(subdir) {
  const dir = resolve(fixtures, subdir);
  return spawnSync('node', [script, '--dir', dir], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

test('--self-test exits 0', () => {
  const result = spawnSync('node', [script, '--self-test'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /--self-test OK/);
});

test('valid (snake_case) → exit 0', () => {
  const result = runLint('valid');
  assert.equal(result.status, 0, `stderr=${result.stderr} stdout=${result.stdout}`);
  assert.match(result.stdout, /all have falsifying_observation/);
});

test('valid (camelCase) → exit 0', () => {
  const result = runLint('valid-camel');
  assert.equal(result.status, 0, `stderr=${result.stderr} stdout=${result.stdout}`);
  assert.match(result.stdout, /all have falsifying_observation/);
});

test('missing-falsifier → exit 1 with helpful message', () => {
  const result = runLint('missing-falsifier');
  assert.equal(result.status, 1, `stderr=${result.stderr} stdout=${result.stdout}`);
  assert.match(result.stderr, /HYP-FAIL/);
  assert.match(
    result.stderr,
    /falsifying_observation \(or falsifyingObservation\)/,
  );
});

test('no-hypotheses → exit 0 (script ignores files without HYPOTHESES)', () => {
  const result = runLint('no-hypotheses');
  assert.equal(result.status, 0, `stderr=${result.stderr} stdout=${result.stdout}`);
  assert.match(result.stdout, /Linted 0 HYPOTHESES array/);
});

test('mixed dir with one bad fixture → exit 1', () => {
  const result = runLint('mixed');
  assert.equal(result.status, 1, `stderr=${result.stderr} stdout=${result.stdout}`);
  // Other fixtures still report their results — failure does not short-circuit.
  assert.match(result.stdout, /OK   valid.process.js/);
  assert.match(result.stdout, /OK   valid-camel.process.js/);
  assert.match(result.stdout, /OK   no-hypotheses.process.js/);
  assert.match(result.stderr, /HYP-FAIL missing-falsifier.process.js/);
});

test('missing directory → exit 0 with friendly note', () => {
  const result = spawnSync(
    'node',
    [script, '--dir', resolve(fixtures, 'does-not-exist')],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, `stderr=${result.stderr}`);
  assert.match(result.stdout, /no process directory/);
});
