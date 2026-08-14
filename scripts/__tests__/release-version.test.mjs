/**
 * FIX-001: one exact release version must flow through validation,
 * publication, tag creation and channel promotion.
 *
 * GitHub workflow YAML cannot be executed locally, so the release version
 * resolution, validation and assertion logic lives in
 * scripts/lib/release-version.cjs + scripts/release-version.cjs and the
 * workflows are thin wiring around it. These tests drive those scripts against
 * temporary fixture repositories with a fake `npm` on PATH; they never contact
 * or mutate the npm registry.
 *
 * The reproduced incident (docs/release-incident-2026-08-13.md): root
 * package.json was 6.0.3, publication ran from a temporary workspace
 * synchronized to 6.0.3, but the release tag was created from the ORIGINAL
 * commit whose workspace manifests were still 6.0.0 — so the tag-triggered run
 * promoted `latest` back to 6.0.0.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const lib = require(path.join(repoRoot, 'scripts', 'lib', 'release-version.cjs'));

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

const COMMIT = 'abc123def456';

// ---------------------------------------------------------------------------
// Resolution: one version per branch/commit, no guessing.
// ---------------------------------------------------------------------------

test('main resolves the exact root version and the latest channel', () => {
  const plan = lib.resolveReleaseVersion({ branch: 'main', rootVersion: '6.0.3', shortSha: COMMIT });
  assert.deepEqual(plan, {
    branch: 'main',
    releaseVersion: '6.0.3',
    distTag: 'latest',
    releaseTag: 'babysitter/main/v6.0.3',
    shortSha: COMMIT,
  });
});

test('staging and develop resolve commit-pinned prereleases on their own channels', () => {
  const staging = lib.resolveReleaseVersion({ branch: 'staging', rootVersion: '6.0.3', shortSha: COMMIT });
  assert.equal(staging.releaseVersion, `6.0.4-staging.${COMMIT}`);
  assert.equal(staging.distTag, 'staging');
  assert.equal(staging.releaseTag, `babysitter/staging/v6.0.4-staging.${COMMIT}`);

  const develop = lib.resolveReleaseVersion({ branch: 'develop', rootVersion: '6.0.3', shortSha: COMMIT });
  assert.equal(develop.releaseVersion, `6.0.4-develop.${COMMIT}`);
  assert.equal(develop.distTag, 'develop');
});

test('a prerelease root version resolves from its release core, not its prerelease suffix', () => {
  const plan = lib.resolveReleaseVersion({ branch: 'main', rootVersion: '6.0.3-staging.deadbeef1234', shortSha: COMMIT });
  assert.equal(plan.releaseVersion, '6.0.3');
});

test('an unreleasable branch is a hard error rather than an invented channel', () => {
  assert.throws(
    () => lib.resolveReleaseVersion({ branch: 'feature/x', rootVersion: '6.0.3', shortSha: COMMIT }),
    /Unsupported release branch/,
  );
});

// ---------------------------------------------------------------------------
// Tag naming: the tag must name the exact published version.
// ---------------------------------------------------------------------------

test('every channel round-trips through its release tag', () => {
  for (const branch of ['main', 'staging', 'develop']) {
    const plan = lib.resolveReleaseVersion({ branch, rootVersion: '6.0.3', shortSha: COMMIT });
    const parsed = lib.parseReleaseTag(plan.releaseTag);
    assert.equal(parsed.releaseVersion, plan.releaseVersion, branch);
    assert.equal(parsed.branch, branch);
    assert.equal(parsed.distTag, plan.distTag);
  }
});

test('the ambiguous pre-FIX-001 main tag format is rejected instead of reinterpreted', () => {
  // `babysitter/main/v6.0.3-120926cf0abc` parses as the prerelease version
  // `6.0.3-120926cf0abc`, which was never published. Acting on it would
  // publish or promote a version nobody released.
  assert.throws(() => lib.parseReleaseTag('babysitter/main/v6.0.3-120926cf0abc'), /ambiguous/);
});

test('a staging tag must carry its own channel prerelease', () => {
  assert.throws(() => lib.parseReleaseTag('babysitter/staging/v6.0.4'), /must encode a staging prerelease/);
  assert.throws(() => lib.parseReleaseTag('babysitter/staging/v6.0.4-develop.abc123def456'), /must encode a staging prerelease/);
});

test('tags outside the release namespace are rejected', () => {
  assert.throws(() => lib.parseReleaseTag('v6.0.3'), /does not match/);
  assert.throws(() => lib.parseReleaseTag('babysitter/feature/v6.0.3'), /Unsupported release branch/);
});

// ---------------------------------------------------------------------------
// Reconciliation: independently derived versions must agree.
// ---------------------------------------------------------------------------

test('reconciliation refuses to guess and refuses to pick a winner', () => {
  assert.throws(() => lib.reconcileReleaseVersion([]), /No release version was supplied/);
  assert.throws(
    () =>
      lib.reconcileReleaseVersion([
        { origin: 'tag', version: '6.0.3' },
        { origin: 'plan', version: '6.0.4' },
      ]),
    /Conflicting release versions/,
  );
  assert.equal(
    lib.reconcileReleaseVersion([
      { origin: 'tag', version: '6.0.4' },
      { origin: 'plan', version: '6.0.4' },
    ]),
    '6.0.4',
  );
});

test('backward channel movement is detectable by version ordering', () => {
  assert.ok(lib.compareVersions('6.0.0', '6.0.3') < 0);
  assert.ok(lib.compareVersions('6.0.4', '6.0.4') === 0);
  assert.ok(lib.compareVersions('6.0.4', '6.0.4-staging.abc123def456') > 0);
  assert.ok(lib.compareVersions('6.0.4-staging.2', '6.0.4-staging.10') < 0);
});

// ---------------------------------------------------------------------------
// A commit sha is IDENTITY, not ORDER.
//
// staging/develop releases are `<base>-<channel>.<12-hex-sha>`. Plain semver
// compares those identifiers lexically, so `6.0.4-staging.f0aa...` "outranks"
// `6.0.4-staging.0b12...` purely because `f` sorts after `0` — which would have
// rejected roughly half of all successive staging releases as "backward".
// ---------------------------------------------------------------------------

test('successive commit-pinned prereleases of the same base are never a backward move, in either direction', () => {
  const low = '6.0.4-staging.0b12ab34cd56';
  const high = '6.0.4-staging.f0aa11bb22cc';
  // Plain semver precedence really does order these (the defect being pinned).
  assert.ok(lib.compareVersions(high, low) > 0);
  // The channel predicate does not.
  assert.equal(lib.isBackwardChannelMove(high, low), false);
  assert.equal(lib.isBackwardChannelMove(low, high), false);
  assert.equal(lib.isBackwardChannelMove(low, low), false);
});

test('an all-digit commit sha is unordered against a hex one, not "older"', () => {
  const digits = '6.0.4-develop.123456789012';
  const hex = '6.0.4-develop.abcdef123456';
  // Semver ranks numeric identifiers below alphanumeric ones — meaningless for shas.
  assert.ok(lib.compareVersions(hex, digits) > 0);
  assert.equal(lib.isBackwardChannelMove(hex, digits), false);
  assert.equal(lib.isBackwardChannelMove(digits, hex), false);
});

test('a base bump is forward and a base regression is backward, prerelease or not', () => {
  assert.equal(lib.isBackwardChannelMove('6.0.4-staging.abc1234def56', '6.0.5-staging.0000000000aa'), false);
  assert.equal(lib.isBackwardChannelMove('6.0.5-staging.abc1234def56', '6.0.4-staging.ffffffffffff'), true);
  assert.equal(lib.isBackwardChannelMove('6.0.5', '6.0.3'), true);
  assert.equal(lib.isBackwardChannelMove('6.0.0', '6.0.3'), false);
});

test('a channel already on the final release must not move to a prerelease of the same base', () => {
  assert.equal(lib.isBackwardChannelMove('6.0.4', '6.0.4-staging.abc123def456'), true);
  assert.equal(lib.isBackwardChannelMove('6.0.4-staging.abc123def456', '6.0.4'), false);
});

// ---------------------------------------------------------------------------
// Manifest synchronization contract, exercised through the real CLI.
// ---------------------------------------------------------------------------

/**
 * Fixture monorepo reproducing the incident checkout: root at the released
 * version, workspace manifests left behind at the previous one. The real
 * release scripts are copied in so they resolve the fixture as their root.
 */
function createFixtureRepo(t, { rootVersion = '6.0.3', packageVersion = '6.0.0' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fix001-release-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  writeJson(path.join(root, 'package.json'), {
    name: 'fixture-root',
    version: rootVersion,
    private: true,
    workspaces: ['packages/*'],
  });
  writeJson(path.join(root, 'packages', 'leaf', 'package.json'), {
    name: '@a5c-ai/fixture-leaf',
    version: packageVersion,
    publishConfig: { access: 'public' },
  });
  writeJson(path.join(root, 'packages', 'consumer', 'package.json'), {
    name: '@a5c-ai/fixture-consumer',
    version: packageVersion,
    publishConfig: { access: 'public' },
    dependencies: { '@a5c-ai/fixture-leaf': packageVersion },
  });

  // Plugin surfaces carry the released version too and are part of the same
  // synchronization contract.
  for (const plugin of ['babysitter-unified', 'atlas-unified']) {
    writeJson(path.join(root, 'plugins', plugin, 'plugin.json'), { name: plugin, version: packageVersion });
    writeJson(path.join(root, 'plugins', plugin, 'versions.json'), { sdkVersion: packageVersion });
  }

  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  for (const file of [
    'release-version.cjs',
    'release-matrix.cjs',
    'sync-workspace-versions.mjs',
    'plugin-marketplace-version-sync.mjs',
  ]) {
    fs.copyFileSync(path.join(repoRoot, 'scripts', file), path.join(root, 'scripts', file));
  }
  fs.cpSync(path.join(repoRoot, 'scripts', 'lib'), path.join(root, 'scripts', 'lib'), { recursive: true });

  // The publishable-package inventory is derived from git-tracked manifests.
  execFileSync('git', ['init', '--quiet'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'fixture@example.com'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'fixture'], { cwd: root });
  execFileSync('git', ['add', '-A'], { cwd: root });
  execFileSync('git', ['commit', '--quiet', '-m', 'fixture'], { cwd: root });

  // Fake npm: answers `npm view <pkg> dist-tags --json` from NPM_FAKE_DIST_TAGS
  // and records every invocation. Nothing here touches the network.
  const binDir = path.join(root, 'fake-bin');
  fs.mkdirSync(binDir, { recursive: true });
  const npmShim = path.join(binDir, 'npm');
  fs.writeFileSync(
    npmShim,
    [
      '#!/bin/sh',
      'echo "$*" >> "$NPM_FAKE_LOG"',
      'if [ "$1" = "view" ]; then',
      // A registry that is reachable but broken (5xx, auth, DNS): non-zero exit,
      // and NOT an E404. The gate must abort rather than read it as "unpublished".
      '  if [ -n "$NPM_FAKE_VIEW_ERROR" ]; then echo "$NPM_FAKE_VIEW_ERROR" >&2; exit 1; fi',
      '  RESULT=$(node -e "const t=JSON.parse(process.env.NPM_FAKE_DIST_TAGS||\'{}\');const v=t[process.argv[1]];if(!v){process.exit(1)}process.stdout.write(JSON.stringify(v))" "$2")',
      '  STATUS=$?',
      '  if [ "$STATUS" != "0" ]; then echo "npm error code E404" >&2; exit 1; fi',
      '  echo "$RESULT"',
      '  exit 0',
      'fi',
      'exit 0',
      '',
    ].join('\n'),
  );
  fs.chmodSync(npmShim, 0o755);

  return { root, binDir, logPath: path.join(root, 'npm-invocations.log') };
}

function runCli(fixture, args, { distTags = {}, viewError = '' } = {}) {
  fs.writeFileSync(fixture.logPath, '');
  const result = spawnSync(process.execPath, ['scripts/release-version.cjs', ...args], {
    cwd: fixture.root,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fixture.binDir}${path.delimiter}${process.env.PATH}`,
      NPM_FAKE_LOG: fixture.logPath,
      NPM_FAKE_DIST_TAGS: JSON.stringify(distTags),
      NPM_FAKE_VIEW_ERROR: viewError,
    },
  });
  const invocations = fs.readFileSync(fixture.logPath, 'utf8').split('\n').filter(Boolean);
  return { ...result, invocations };
}

test('FIX-001: the incident checkout (root 6.0.3, manifests 6.0.0) fails the release-version gate', (t) => {
  const fixture = createFixtureRepo(t);
  const result = runCli(fixture, ['verify-manifests', '--version', '6.0.3']);

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /diverge from release version 6\.0\.3/);
  assert.match(result.stderr, /@a5c-ai\/fixture-leaf/);
  // The internal dependency pin is part of the same contract.
  assert.match(result.stderr, /dependencies @a5c-ai\/fixture-leaf: 6\.0\.0/);
});

test('FIX-001: main and staging tag paths share one synchronization contract', (t) => {
  for (const releaseVersion of ['6.0.3', '6.0.4-staging.abc123def456']) {
    const fixture = createFixtureRepo(t);
    assert.equal(
      runCli(fixture, ['verify-manifests', '--version', releaseVersion]).status,
      1,
      `${releaseVersion} must be rejected before synchronization`,
    );

    const sync = spawnSync(
      process.execPath,
      ['scripts/sync-workspace-versions.mjs', '--version', releaseVersion],
      { cwd: fixture.root, encoding: 'utf8' },
    );
    assert.equal(sync.status, 0, `${sync.stdout}${sync.stderr}`);

    const verified = runCli(fixture, ['verify-manifests', '--version', releaseVersion]);
    assert.equal(verified.status, 0, `${verified.stdout}${verified.stderr}`);
    assert.match(verified.stdout, new RegExp(`at release version ${releaseVersion.replace(/[.\\]/g, '\\$&')}`));
  }
});

test('FIX-001: resolve produces the release identity once and persists it for the publication workspace', (t) => {
  const fixture = createFixtureRepo(t);
  const result = runCli(fixture, [
    'resolve',
    '--branch',
    'main',
    '--sha',
    COMMIT,
    '--write',
    'release-version.json',
  ]);

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const plan = JSON.parse(fs.readFileSync(path.join(fixture.root, 'release-version.json'), 'utf8'));
  assert.equal(plan.releaseVersion, '6.0.3');
  assert.equal(plan.distTag, 'latest');
  assert.equal(plan.releaseTag, 'babysitter/main/v6.0.3');
});

test('FIX-001: release-tags validation accepts the passed version and rejects a re-derived one', (t) => {
  const fixture = createFixtureRepo(t);

  const accepted = runCli(fixture, ['verify', '--branch', 'main', '--sha', COMMIT, '--version', '6.0.3']);
  assert.equal(accepted.status, 0, `${accepted.stdout}${accepted.stderr}`);

  const rejected = runCli(fixture, ['verify', '--branch', 'main', '--sha', COMMIT, '--version', '6.0.0']);
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /Release version mismatch/);
});

test('FIX-001: from-tag derives the exact version and channel a tag-triggered run may act on', (t) => {
  const fixture = createFixtureRepo(t);
  const result = runCli(fixture, ['from-tag', '--tag', 'babysitter/main/v6.0.4']);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.releaseVersion, '6.0.4');
  assert.equal(parsed.distTag, 'latest');

  const legacy = runCli(fixture, ['from-tag', '--tag', 'babysitter/main/v6.0.3-120926cf0abc']);
  assert.equal(legacy.status, 1);
  assert.match(legacy.stderr, /ambiguous/);
});

// ---------------------------------------------------------------------------
// Tag provenance: a tag created by the publish workflow must not trigger a
// second, conflicting publication.
// ---------------------------------------------------------------------------

function createTag(fixture, tag, message) {
  if (message === null) {
    execFileSync('git', ['tag', tag], { cwd: fixture.root });
    return;
  }
  execFileSync('git', ['tag', '-a', tag, '-m', message], { cwd: fixture.root });
}

test('FIX-001: a tag created by the publish workflow is reported as already published', (t) => {
  const fixture = createFixtureRepo(t);
  const message = lib.formatTagMessage({
    releaseVersion: '6.0.3',
    branch: 'main',
    commit: COMMIT,
    source: lib.TAG_SOURCE_PUBLISH_WORKFLOW,
    runUrl: 'https://example.invalid/run/1',
  });
  createTag(fixture, 'babysitter/main/v6.0.3', message);

  const result = runCli(fixture, ['tag-source', '--tag', 'babysitter/main/v6.0.3']);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.publishedByReleaseWorkflow, 'true');
  assert.equal(parsed.releaseVersion, '6.0.3');
  assert.equal(parsed.distTag, 'latest');
});

test('FIX-001: a hand-created tag stays available for manual recovery publication', (t) => {
  const fixture = createFixtureRepo(t);
  createTag(fixture, 'babysitter/main/v6.0.4', null);

  const result = runCli(fixture, ['tag-source', '--tag', 'babysitter/main/v6.0.4']);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.equal(JSON.parse(result.stdout).publishedByReleaseWorkflow, 'false');
});

test('FIX-001: a tag whose name and recorded version disagree is refused', (t) => {
  const fixture = createFixtureRepo(t);
  createTag(
    fixture,
    'babysitter/main/v6.0.4',
    lib.formatTagMessage({
      releaseVersion: '6.0.3',
      branch: 'main',
      source: lib.TAG_SOURCE_PUBLISH_WORKFLOW,
    }),
  );

  const result = runCli(fixture, ['tag-source', '--tag', 'babysitter/main/v6.0.4']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /ambiguous tag/);
});

// ---------------------------------------------------------------------------
// Channel-tag assertion over the FULL inventory (never a sample).
// ---------------------------------------------------------------------------

test('FIX-001: the final assertion fails while any public package still resolves the stale version', (t) => {
  const fixture = createFixtureRepo(t, { packageVersion: '6.0.3' });
  const result = runCli(fixture, ['assert-channel-tags', '--version', '6.0.3', '--dist-tag', 'latest'], {
    distTags: {
      // Exactly the incident state: one package promoted, the rest stale.
      '@a5c-ai/fixture-leaf': { latest: '6.0.3', staging: '6.0.3' },
      '@a5c-ai/fixture-consumer': { latest: '6.0.0', staging: '6.0.3' },
    },
  });

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /@a5c-ai\/fixture-consumer/);
  assert.match(result.stderr, /found 6\.0\.0/);
  assert.ok(
    !result.stderr.includes('@a5c-ai/fixture-leaf:'),
    'an already-correct package must not be reported as a problem',
  );
  // Coverage is the whole inventory, not a sample.
  assert.equal(result.invocations.filter((line) => line.startsWith('view ')).length, 2);
});

test('FIX-001: the final assertion fails for a package that was never published', (t) => {
  const fixture = createFixtureRepo(t, { packageVersion: '6.0.3' });
  const result = runCli(fixture, ['assert-channel-tags', '--version', '6.0.3', '--dist-tag', 'latest'], {
    distTags: { '@a5c-ai/fixture-leaf': { latest: '6.0.3' } },
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /@a5c-ai\/fixture-consumer: not published/);
});

test('FIX-001: re-running a completed release is idempotent', (t) => {
  const fixture = createFixtureRepo(t, { packageVersion: '6.0.3' });
  const distTags = {
    '@a5c-ai/fixture-leaf': { latest: '6.0.3' },
    '@a5c-ai/fixture-consumer': { latest: '6.0.3' },
  };
  for (const attempt of [1, 2]) {
    const result = runCli(fixture, ['assert-channel-tags', '--version', '6.0.3', '--dist-tag', 'latest'], { distTags });
    assert.equal(result.status, 0, `attempt ${attempt}: ${result.stdout}${result.stderr}`);
    assert.match(result.stdout, /2 public package\(s\) satisfy the final channel-tag assertion latest=6\.0\.3/);
    assert.ok(
      !result.invocations.some((line) => line.startsWith('dist-tag') || line.startsWith('publish')),
      'the assertion is read-only and must never mutate the registry',
    );
  }
});

test('FIX-001: the preflight assertion refuses a release that would move a channel backward', (t) => {
  const fixture = createFixtureRepo(t, { packageVersion: '6.0.3' });
  const backward = runCli(fixture, ['assert-channel-tags', '--version', '6.0.3', '--dist-tag', 'latest', '--mode', 'preflight'], {
    distTags: {
      '@a5c-ai/fixture-leaf': { latest: '6.0.5' },
      '@a5c-ai/fixture-consumer': { latest: '6.0.0' },
    },
  });
  assert.equal(backward.status, 1, `${backward.stdout}${backward.stderr}`);
  assert.match(backward.stderr, /move the channel backward/);
  assert.match(backward.stderr, /@a5c-ai\/fixture-leaf/);

  const forward = runCli(fixture, ['assert-channel-tags', '--version', '6.0.3', '--dist-tag', 'latest', '--mode', 'preflight'], {
    distTags: {
      '@a5c-ai/fixture-leaf': { latest: '6.0.0' },
      '@a5c-ai/fixture-consumer': {},
    },
  });
  assert.equal(forward.status, 0, `${forward.stdout}${forward.stderr}`);
});

test('FIX-001: the preflight admits the next staging release whose sha sorts BELOW the current one', (t) => {
  const fixture = createFixtureRepo(t, { packageVersion: '6.0.4-staging.0b12ab34cd56' });
  const next = runCli(
    fixture,
    ['assert-channel-tags', '--version', '6.0.4-staging.0b12ab34cd56', '--dist-tag', 'staging', '--mode', 'preflight'],
    {
      distTags: {
        '@a5c-ai/fixture-leaf': { staging: '6.0.4-staging.f0aa11bb22cc' },
        '@a5c-ai/fixture-consumer': { staging: '6.0.4-staging.f0aa11bb22cc' },
      },
    },
  );
  assert.equal(
    next.status,
    0,
    `a commit sha is identity, not order: the next staging release must not be rejected\n${next.stdout}${next.stderr}`,
  );
});

test('FIX-001: a registry query that fails for any reason other than E404 aborts the preflight', (t) => {
  const fixture = createFixtureRepo(t, { packageVersion: '6.0.3' });
  const outage = runCli(
    fixture,
    ['assert-channel-tags', '--version', '6.0.3', '--dist-tag', 'latest', '--mode', 'preflight'],
    { viewError: 'npm error code E500\nnpm error 500 Internal Server Error - GET https://registry.npmjs.org/...' },
  );

  assert.equal(
    outage.status,
    1,
    `a registry outage must abort the never-move-backward gate, not silently pass it\n${outage.stdout}${outage.stderr}`,
  );
  assert.match(outage.stderr, /without reporting E404/);
  assert.match(outage.stderr, /E500/);
});

test('FIX-001: a genuinely unpublished package (E404) still leaves the preflight free to pass', (t) => {
  const fixture = createFixtureRepo(t, { packageVersion: '6.0.3' });
  const unpublished = runCli(
    fixture,
    ['assert-channel-tags', '--version', '6.0.3', '--dist-tag', 'latest', '--mode', 'preflight'],
    { distTags: {} },
  );
  assert.equal(unpublished.status, 0, `${unpublished.stdout}${unpublished.stderr}`);
});

// ---------------------------------------------------------------------------
// Tag creation: idempotent, immutable, never pushed by the script itself.
// ---------------------------------------------------------------------------

test('FIX-001: re-running the same release neither duplicates nor moves the release tag', (t) => {
  const fixture = createFixtureRepo(t, { packageVersion: '6.0.3' });
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fixture.root, encoding: 'utf8' }).trim();
  const args = [
    'ensure-tag',
    '--version',
    '6.0.3',
    '--branch',
    'main',
    '--commit',
    commit,
    '--source',
    'publish-workflow',
  ];

  const first = runCli(fixture, args);
  assert.equal(first.status, 0, `${first.stdout}${first.stderr}`);
  assert.equal(JSON.parse(first.stdout).created, 'true');

  const second = runCli(fixture, args);
  assert.equal(second.status, 0, `${second.stdout}${second.stderr}`);
  assert.equal(JSON.parse(second.stdout).created, 'false', 're-running a release must not recreate its tag');

  const tags = execFileSync('git', ['tag', '--list'], { cwd: fixture.root, encoding: 'utf8' }).trim().split('\n');
  assert.deepEqual(tags, ['babysitter/main/v6.0.3']);
  assert.equal(
    execFileSync('git', ['rev-list', '-n', '1', 'babysitter/main/v6.0.3'], { cwd: fixture.root, encoding: 'utf8' }).trim(),
    commit,
  );

  // The recorded provenance is what stops the tag workflow from publishing again.
  const source = runCli(fixture, ['tag-source', '--tag', 'babysitter/main/v6.0.3']);
  assert.equal(JSON.parse(source.stdout).publishedByReleaseWorkflow, 'true');
});

test('FIX-001: an existing release tag is never re-pointed at another commit', (t) => {
  const fixture = createFixtureRepo(t, { packageVersion: '6.0.3' });
  const firstCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fixture.root, encoding: 'utf8' }).trim();
  assert.equal(
    runCli(fixture, ['ensure-tag', '--version', '6.0.3', '--branch', 'main', '--commit', firstCommit]).status,
    0,
  );

  fs.writeFileSync(path.join(fixture.root, 'NOTES.md'), 'second commit\n');
  execFileSync('git', ['add', '-A'], { cwd: fixture.root });
  execFileSync('git', ['commit', '--quiet', '-m', 'second'], { cwd: fixture.root });
  const secondCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: fixture.root, encoding: 'utf8' }).trim();

  const result = runCli(fixture, ['ensure-tag', '--version', '6.0.3', '--branch', 'main', '--commit', secondCommit]);
  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /immutable/);
  assert.equal(
    execFileSync('git', ['rev-list', '-n', '1', 'babysitter/main/v6.0.3'], { cwd: fixture.root, encoding: 'utf8' }).trim(),
    firstCommit,
  );
});
