/**
 * FIX-005: clean packed install/import test for the Genty hooks leaf.
 *
 * `@a5c-ai/hooks-adapter-genty` is a public, documented package
 * (`npm install @a5c-ai/hooks-adapter-genty` in its README) that had never
 * been published, built by CI, or verified as an artifact
 * (docs/release-incident-2026-08-13.md). This drives the generic FIX-011
 * verifier for that single leaf: the exact publishable tarball is built and
 * packed, every declared surface target must exist inside it, the tarball is
 * installed into a fresh temporary npm project OUTSIDE the repository (no
 * workspace links, lifecycle scripts disabled) and imported and typechecked
 * there — the documented install path, exercised before publication.
 *
 * Read-only with respect to the registry: it installs, never publishes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const GENTY_LEAF = '@a5c-ai/hooks-adapter-genty';

test(
  'the Genty hooks leaf installs and imports from its packed tarball in a clean consumer',
  { timeout: 10 * 60 * 1000 },
  (t) => {
    const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fix005-genty-packed-'));
    t.after(() => fs.rmSync(reportDir, { recursive: true, force: true }));

    const result = spawnSync(
      process.execPath,
      ['scripts/verify-release-artifacts.mjs', '--package', GENTY_LEAF, '--report-dir', reportDir],
      { cwd: repoRoot, encoding: 'utf8' },
    );
    assert.equal(
      result.status,
      0,
      `packed verification of ${GENTY_LEAF} must pass\n${result.stdout}\n${result.stderr}`,
    );

    const report = JSON.parse(
      fs.readFileSync(path.join(reportDir, 'a5c-ai__hooks-adapter-genty.json'), 'utf8'),
    );
    assert.equal(report.package, GENTY_LEAF);
    assert.equal(report.status, 'passed');
    assert.deepEqual(report.failures, []);

    // The steps that prove the documented `npm install` path works from a
    // clean registry-shaped consumer, not from the workspace.
    for (const step of ['build', 'pack', 'surfaces', 'install', 'imports', 'typecheck']) {
      assert.equal(report.steps[step].status, 'passed', `${step} step must pass for ${GENTY_LEAF}`);
    }
    assert.equal(report.steps.install.ignoreScripts, true, 'the clean install must not run lifecycle scripts');
    assert.deepEqual(report.steps.imports.importedSubpaths, [GENTY_LEAF]);

    // The tarball must carry the built runtime and the documented README.
    assert.ok(report.tarball.files.includes('dist/index.js'), 'the tarball must ship the built entrypoint');
    assert.ok(report.tarball.files.includes('dist/index.d.ts'), 'the tarball must ship the declarations');
    assert.ok(report.tarball.files.includes('README.md'), 'the tarball must ship the documented README');
  },
);
