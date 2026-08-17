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
  // The helper reconciles the release version through scripts/lib/release-version.cjs.
  fs.cpSync(path.join(repoRoot, 'scripts', 'lib'), path.join(root, 'scripts', 'lib'), { recursive: true });

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
      // A registry that is reachable but broken (5xx / auth / DNS): a non-zero
      // exit that is NOT an E404, which must never read as "unpublished".
      '  if [ -n "$NPM_FAKE_VIEW_ERROR" ]; then echo "$NPM_FAKE_VIEW_ERROR" >&2; exit 1; fi',
      // Read-after-write lag: this spec 404s for the first N queries and is
      // then visible, exactly as a dependency published seconds earlier behaves.
      '  if [ -n "$NPM_FAKE_APPEAR_AFTER_SPEC" ] && [ "$2" = "$NPM_FAKE_APPEAR_AFTER_SPEC" ]; then',
      '    COUNT=$(cat "$NPM_FAKE_COUNTER" 2>/dev/null || echo 0)',
      '    COUNT=$((COUNT + 1))',
      '    echo "$COUNT" > "$NPM_FAKE_COUNTER"',
      '    if [ "$COUNT" -gt "$NPM_FAKE_APPEAR_AFTER_COUNT" ]; then echo "1.0.0"; exit 0; fi',
      '    echo "npm error code E404" >&2; exit 1',
      '  fi',
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

  return {
    root,
    binDir,
    logPath: path.join(root, 'npm-invocations.log'),
    counterPath: path.join(root, 'npm-view-counter'),
  };
}

function runHelper(
  fixture,
  workspace,
  {
    published = [],
    refName = 'develop',
    releaseVersion = '1.0.0',
    args = [],
    viewError = '',
    appearAfter = null,
  } = {},
) {
  fs.writeFileSync(fixture.logPath, '');
  fs.rmSync(fixture.counterPath, { force: true });
  const env = {
    ...process.env,
    PATH: `${fixture.binDir}${path.delimiter}${process.env.PATH}`,
    NODE_AUTH_TOKEN: 'fixture-token',
    GITHUB_REF_NAME: refName,
    NPM_FAKE_LOG: fixture.logPath,
    NPM_FAKE_PUBLISHED: published.join(':'),
    NPM_FAKE_VIEW_ERROR: viewError,
    NPM_FAKE_COUNTER: fixture.counterPath,
    NPM_FAKE_APPEAR_AFTER_SPEC: appearAfter ? appearAfter.spec : '',
    NPM_FAKE_APPEAR_AFTER_COUNT: appearAfter ? String(appearAfter.after) : '0',
    // The real backoff is 5s/10s/20s/40s; the suite exercises the schedule, not
    // the wall clock.
    PUBLISH_PACKAGE_FROM_TAG_DEPENDENCY_RETRY_BASE_MS: '1',
  };
  delete env.RELEASE_VERSION;
  if (releaseVersion !== null) env.RELEASE_VERSION = releaseVersion;
  const result = spawnSync(
    process.execPath,
    ['scripts/publish-package-from-tag.mjs', `--workspace=${workspace}`, '--skip-build', ...args],
    { cwd: fixture.root, encoding: 'utf8', env },
  );
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

// ---------------------------------------------------------------------------
// The dependency gate must survive the registry's read-after-write lag.
//
// Publication waves are seconds apart: wave N+1 queries a dependency wave N
// published moments earlier, and npm's read path is eventually consistent. A
// stale 404 there aborted the run HALF-PUBLISHED — earlier waves live, later
// waves missing. The retry is bounded and the gate still hard-fails after it.
// ---------------------------------------------------------------------------

test('a dependency that 404s twice and then appears is published, not treated as missing', (t) => {
  const fixture = createFixtureRepo(t);
  const result = runHelper(fixture, '@fixture/consumer', {
    appearAfter: { spec: '@fixture/leaf@1.0.0', after: 2 },
  });

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.equal(
    result.invocations.filter((line) => line.startsWith('view @fixture/leaf@1.0.0')).length,
    3,
    `the gate must retry the just-published dependency; saw: ${result.invocations.join(' | ')}`,
  );
  assert.ok(
    result.invocations.some((line) => line.startsWith('publish --workspace @fixture/consumer')),
    `publication must proceed once the dependency is visible; saw: ${result.invocations.join(' | ')}`,
  );
});

test('a dependency that never appears still fails with the dependency-order message, after a bounded retry', (t) => {
  const fixture = createFixtureRepo(t);
  const result = runHelper(fixture, '@fixture/consumer', { published: [] });

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Required internal dependency @fixture\/leaf@1\.0\.0 is not published yet/);
  assert.equal(
    result.invocations.filter((line) => line.startsWith('view @fixture/leaf@1.0.0')).length,
    5,
    `the retry must be bounded at 5 attempts; saw: ${result.invocations.join(' | ')}`,
  );
  assert.ok(!result.invocations.some((line) => line.startsWith('publish')));
});

test('a non-404 registry failure aborts immediately instead of being retried as "unpublished"', (t) => {
  const fixture = createFixtureRepo(t);
  const result = runHelper(fixture, '@fixture/consumer', {
    viewError: 'npm error code E500\nnpm error 500 Internal Server Error - GET https://registry.npmjs.org/...',
  });

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /without reporting E404/);
  assert.equal(
    result.invocations.filter((line) => line.startsWith('view')).length,
    1,
    `a failed query is not a 404 and must not be retried; saw: ${result.invocations.join(' | ')}`,
  );
  assert.ok(!result.invocations.some((line) => line.startsWith('publish')));
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

test('an already-published package is not re-published, only candidate dist-tagged', (t) => {
  const fixture = createFixtureRepo(t);
  const result = runHelper(fixture, '@fixture/leaf', { published: ['@fixture/leaf@1.0.0'] });

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.ok(
    !result.invocations.some((line) => line.startsWith('publish')),
    'an existing version must never be re-published',
  );
  assert.ok(
    result.invocations.some((line) => line.startsWith('dist-tag add @fixture/leaf@1.0.0 candidate-1.0.0')),
    `expected the candidate dist-tag; saw: ${result.invocations.join(' | ')}`,
  );
  assert.ok(
    !result.invocations.some((line) => /dist-tag add \S+ (latest|staging|develop)$/.test(line)),
    'FIX-010: publication must never write a release channel tag',
  );
});

// ---------------------------------------------------------------------------
// FIX-001: one exact release version through publication and tagging.
//
// Reproduction of the 2026-08-13 incident (docs/release-incident-2026-08-13.md):
// publish.yml synchronized a TEMPORARY workspace to 6.0.3 and published it,
// then created a release tag from the ORIGINAL commit, whose checked-in
// workspace manifests were still 6.0.0. The tag-triggered run checked that
// commit out, this helper read `@pkg@6.0.0` from the stale manifest, found it
// already on the registry, and ran `npm dist-tag add @pkg@6.0.0 latest` —
// moving the production channel BACK to the stale artifacts.
// ---------------------------------------------------------------------------

/** Rewrites fixture manifest versions, emulating a checkout at a given state. */
function setFixtureVersions(fixture, { root, packages = {} }) {
  const rootManifestPath = path.join(fixture.root, 'package.json');
  const rootManifest = JSON.parse(fs.readFileSync(rootManifestPath, 'utf8'));
  rootManifest.version = root;
  writeJson(rootManifestPath, rootManifest);
  for (const [dir, version] of Object.entries(packages)) {
    const manifestPath = path.join(fixture.root, 'packages', dir, 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.version = version;
    if (manifest.dependencies?.['@fixture/leaf']) manifest.dependencies['@fixture/leaf'] = version;
    writeJson(manifestPath, manifest);
  }
}

test('FIX-001: a main release tag cannot reassign the channel tag to the stale version in a divergent checkout', (t) => {
  const fixture = createFixtureRepo(t);
  // Exactly the incident state: root released 6.0.3, workspace manifests 6.0.0.
  setFixtureVersions(fixture, { root: '6.0.3', packages: { leaf: '6.0.0' } });

  const result = runHelper(fixture, '@fixture/leaf', {
    // Both versions exist on the registry: 6.0.0 from the previous release,
    // 6.0.3 published minutes earlier from the synchronized temp workspace.
    published: ['@fixture/leaf@6.0.0', '@fixture/leaf@6.0.3'],
    refName: 'babysitter/main/v6.0.3',
    releaseVersion: null,
  });

  assert.ok(
    !result.invocations.some((line) => line.startsWith('dist-tag add @fixture/leaf@6.0.0')),
    `the stale version must never be promoted to a channel tag; saw: ${result.invocations.join(' | ')}`,
  );
  assert.equal(
    result.status,
    1,
    `a divergent workspace must fail the publication helper, got ${result.status}\n${result.stdout}${result.stderr}`,
  );
  assert.match(result.stderr, /6\.0\.0/);
  assert.match(result.stderr, /6\.0\.3/);
});

test('FIX-001: the same tag re-tags the release version once the workspace is synchronized to it', (t) => {
  const fixture = createFixtureRepo(t);
  setFixtureVersions(fixture, { root: '6.0.3', packages: { leaf: '6.0.3' } });

  const result = runHelper(fixture, '@fixture/leaf', {
    published: ['@fixture/leaf@6.0.0', '@fixture/leaf@6.0.3'],
    refName: 'babysitter/main/v6.0.3',
    releaseVersion: null,
  });

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.ok(
    result.invocations.some((line) => line.startsWith('dist-tag add @fixture/leaf@6.0.3 candidate-6.0.3')),
    `the release version must carry its candidate tag; saw: ${result.invocations.join(' | ')}`,
  );
  // FIX-010: `latest` is moved by scripts/release-promotion.cjs promote, only
  // after the published-consumer validation of 6.0.3 succeeded.
  assert.ok(
    !result.invocations.some((line) => line.includes(' latest')),
    `publication must not move the production channel; saw: ${result.invocations.join(' | ')}`,
  );
  assert.ok(
    !result.invocations.some((line) => line.startsWith('publish')),
    're-running a completed release must be idempotent, never a re-publish',
  );
});

test('FIX-001: an explicit release version that disagrees with the tag version is a hard failure', (t) => {
  const fixture = createFixtureRepo(t);
  setFixtureVersions(fixture, { root: '6.0.4', packages: { leaf: '6.0.4' } });

  const result = runHelper(fixture, '@fixture/leaf', {
    published: [],
    refName: 'babysitter/main/v6.0.3',
    releaseVersion: '6.0.4',
  });

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Conflicting release versions/);
  assert.ok(!result.invocations.some((line) => line.startsWith('publish')));
});

test('FIX-001: publication without any explicit release version is refused', (t) => {
  const fixture = createFixtureRepo(t);

  const result = runHelper(fixture, '@fixture/leaf', {
    published: [],
    refName: 'main',
    releaseVersion: null,
  });

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /No release version was supplied/);
  assert.ok(!result.invocations.some((line) => line.startsWith('publish')));
});

test('FIX-001: the release version may be carried by the publication workspace release plan', (t) => {
  const fixture = createFixtureRepo(t);
  setFixtureVersions(fixture, { root: '6.0.4', packages: { leaf: '6.0.4' } });
  writeJson(path.join(fixture.root, 'release-version.json'), {
    branch: 'main',
    releaseVersion: '6.0.4',
    distTag: 'latest',
    releaseTag: 'babysitter/main/v6.0.4',
    shortSha: 'abcdef123456',
  });

  const result = runHelper(fixture, '@fixture/leaf', {
    published: [],
    refName: 'main',
    releaseVersion: null,
  });

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.ok(
    result.invocations.some((line) => line.startsWith('publish --workspace @fixture/leaf')),
    `expected a publish invocation; saw: ${result.invocations.join(' | ')}`,
  );
  assert.ok(
    result.invocations.some((line) => line.includes('--tag candidate-6.0.4')),
    `the candidate tag is derived from the plan's release version; saw: ${result.invocations.join(' | ')}`,
  );
});

// ---------------------------------------------------------------------------
// FIX-010: publication publishes a CANDIDATE; it never promotes.
//
// Before this, `npm publish --tag latest` made publication and promotion the
// same event, so a release reached every consumer of the channel before
// anything had installed it from npm.
// ---------------------------------------------------------------------------

test('FIX-010: publication targets the candidate dist-tag and never a release channel', (t) => {
  const fixture = createFixtureRepo(t);
  const result = runHelper(fixture, '@fixture/leaf', { published: [], refName: 'main', releaseVersion: '1.0.0' });

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const publishInvocation = result.invocations.find((line) => line.startsWith('publish'));
  assert.ok(publishInvocation, `expected a publish invocation; saw: ${result.invocations.join(' | ')}`);
  assert.match(publishInvocation, /--tag candidate-1\.0\.0/);
  assert.doesNotMatch(publishInvocation, /--tag (latest|staging|develop)/);
  assert.ok(
    !result.invocations.some((line) => /dist-tag add \S+ (latest|staging|develop)$/.test(line)),
    'no channel dist-tag may be written by publication',
  );
});
