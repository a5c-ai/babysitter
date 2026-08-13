/**
 * FIX-005: the publish helper must verify EVERY exact internal dependency
 * against the registry, even when a same-named local workspace exists.
 *
 * The 2026-08-13 incident: `@a5c-ai/hooks-adapter-genty` had never been
 * published, yet `@a5c-ai/hooks-adapter-cli` pins it exactly. The helper
 * skipped its registry existence check whenever the dependency also existed as
 * a local workspace — which is always true inside this monorepo — so a CLI
 * publication whose exact dependency is absent from npm succeeded and shipped
 * an uninstallable package.
 *
 * These tests drive the real helper against a temporary fixture repository
 * with a fake `npm` on PATH. They never contact or mutate the npm registry.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const HELPER = path.join(repoRoot, 'scripts', 'publish-package-from-tag.mjs');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

/**
 * Fixture monorepo: a leaf package and a consumer that pins it exactly, plus a
 * consumer that only uses a caret range. The real helper is copied in so it
 * resolves the fixture as its repository root.
 */
function createFixtureRepo(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fix005-publish-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  writeJson(path.join(root, 'package.json'), {
    name: 'fixture-root',
    version: '1.0.0',
    private: true,
    workspaces: ['packages/*'],
  });
  writeJson(path.join(root, 'packages', 'leaf', 'package.json'), {
    name: '@fixture/leaf',
    version: '1.0.0',
    publishConfig: { access: 'public' },
  });
  writeJson(path.join(root, 'packages', 'consumer', 'package.json'), {
    name: '@fixture/consumer',
    version: '1.0.0',
    publishConfig: { access: 'public' },
    dependencies: { '@fixture/leaf': '1.0.0' },
  });
  writeJson(path.join(root, 'packages', 'range-consumer', 'package.json'), {
    name: '@fixture/range-consumer',
    version: '1.0.0',
    publishConfig: { access: 'public' },
    dependencies: { '@fixture/leaf': '^1.0.0' },
  });

  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.copyFileSync(HELPER, path.join(root, 'scripts', 'publish-package-from-tag.mjs'));

  // Fake npm: records every invocation and answers `npm view` from the
  // NPM_FAKE_PUBLISHED allowlist. Nothing here touches the network.
  const binDir = path.join(root, 'fake-bin');
  fs.mkdirSync(binDir, { recursive: true });
  const npmShim = path.join(binDir, 'npm');
  fs.writeFileSync(
    npmShim,
    [
      '#!/bin/sh',
      'echo "$*" >> "$NPM_FAKE_LOG"',
      'if [ "$1" = "view" ]; then',
      '  case ":$NPM_FAKE_PUBLISHED:" in',
      '    *":$2:"*) echo "1.0.0"; exit 0 ;;',
      '    *) echo "npm error code E404" >&2; exit 1 ;;',
      '  esac',
      'fi',
      'exit 0',
      '',
    ].join('\n'),
  );
  fs.chmodSync(npmShim, 0o755);

  return { root, binDir, logPath: path.join(root, 'npm-invocations.log') };
}

function runHelper(fixture, workspace, { published = [] } = {}) {
  fs.writeFileSync(fixture.logPath, '');
  const result = spawnSync(process.execPath, ['scripts/publish-package-from-tag.mjs', `--workspace=${workspace}`, '--skip-build'], {
    cwd: fixture.root,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fixture.binDir}${path.delimiter}${process.env.PATH}`,
      NODE_AUTH_TOKEN: 'fixture-token',
      GITHUB_REF_NAME: 'babysitter/develop/v1.0.0',
      NPM_FAKE_LOG: fixture.logPath,
      NPM_FAKE_PUBLISHED: published.join(':'),
    },
  });
  const invocations = fs.readFileSync(fixture.logPath, 'utf8').split('\n').filter(Boolean);
  return { ...result, invocations };
}

test('publication fails when an exact internal dependency is missing from the registry, despite a local workspace of the same name', (t) => {
  const fixture = createFixtureRepo(t);
  const result = runHelper(fixture, '@fixture/consumer', { published: [] });

  assert.equal(result.status, 1, `expected a hard failure, got ${result.status}\n${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Required internal dependency @fixture\/leaf@1\.0\.0 is not published yet/);
  assert.ok(
    result.invocations.some((line) => line.startsWith('view @fixture/leaf@1.0.0')),
    `the helper must query the registry for the exact dependency; saw: ${result.invocations.join(' | ')}`,
  );
  assert.ok(
    !result.invocations.some((line) => line.startsWith('publish')),
    `nothing may be published when an exact dependency is missing; saw: ${result.invocations.join(' | ')}`,
  );
});

test('publication proceeds when the exact internal dependency exists in the registry', (t) => {
  const fixture = createFixtureRepo(t);
  const result = runHelper(fixture, '@fixture/consumer', { published: ['@fixture/leaf@1.0.0'] });

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.ok(
    result.invocations.some((line) => line.startsWith('publish --workspace @fixture/consumer')),
    `expected a publish invocation; saw: ${result.invocations.join(' | ')}`,
  );
});

test('range-based internal dependencies are not gated on an exact registry version', (t) => {
  const fixture = createFixtureRepo(t);
  const result = runHelper(fixture, '@fixture/range-consumer', { published: [] });

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.ok(
    !result.invocations.some((line) => line.startsWith('view @fixture/leaf@^1.0.0')),
    'caret ranges must not be looked up as exact versions',
  );
});

test('an already-published package is not re-published, only dist-tagged', (t) => {
  const fixture = createFixtureRepo(t);
  const result = runHelper(fixture, '@fixture/leaf', { published: ['@fixture/leaf@1.0.0'] });

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.ok(
    !result.invocations.some((line) => line.startsWith('publish')),
    'an existing version must never be re-published',
  );
  assert.ok(result.invocations.some((line) => line.startsWith('dist-tag add @fixture/leaf@1.0.0 develop')));
});
