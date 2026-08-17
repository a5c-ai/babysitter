/**
 * FIX-010: exact-version published-consumer validation must gate channel
 * promotion.
 *
 * The defect these tests pin down: publication moved the production channel
 * dist-tag (`latest` / `staging` / `develop`) the instant a package was
 * published, and nothing had ever installed that release FROM npm first.
 * `.github/workflows/live-stack-published.yml` — the only workflow that
 * installs the published packages and exercises the live stack — auto-ran only
 * when its own file changed, took a mutable dist-tag rather than an exact
 * version, and `publish.yml` neither dispatched nor depended on it.
 *
 * The model implemented here: publish candidates under a non-production
 * candidate dist-tag, validate that EXACT immutable version from npm, and only
 * then move the channel — leaving the candidate versions installable for
 * diagnosis when validation fails.
 *
 * GitHub workflow YAML cannot be executed locally, so the reasoning lives in
 * scripts/lib/release-promotion.cjs + scripts/release-promotion.cjs (driven
 * here against fixture repositories with a fake `npm` on PATH) and the workflow
 * GRAPH itself is asserted structurally. Nothing here contacts or mutates the
 * npm registry.
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
const promotion = require(path.join(repoRoot, 'scripts', 'lib', 'release-promotion.cjs'));
const { parse: parseYaml } = require('yaml');

const RELEASE_VERSION = '6.0.4';

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// The exact-version contract: validation and promotion never accept a mutable
// reference.
// ---------------------------------------------------------------------------

test('FIX-010: mutable references are rejected as the version under test', () => {
  for (const mutable of ['latest', 'staging', 'develop', '^6.0.4', '~6.0.4', '>=6.0.4', '6.0', '6.0.x', '*', 'v6.0.4', '']) {
    assert.throws(
      () => promotion.assertExactReleaseVersion(mutable),
      /exact|required/i,
      `${JSON.stringify(mutable)} must not be accepted as an exact release version`,
    );
  }
});

test('FIX-010: exact immutable versions — including channel prereleases — are accepted', () => {
  assert.equal(promotion.assertExactReleaseVersion('6.0.4'), '6.0.4');
  assert.equal(
    promotion.assertExactReleaseVersion('6.0.4-staging.abc123def456'),
    '6.0.4-staging.abc123def456',
  );
});

test('FIX-010: candidates publish under a non-production dist-tag derived from the exact version', () => {
  const candidate = promotion.candidateDistTagFor(RELEASE_VERSION);
  assert.equal(candidate, 'candidate-6.0.4');
  assert.equal(promotion.isChannelDistTag(candidate), false);
  assert.deepEqual(promotion.listChannelDistTags(), ['develop', 'latest', 'staging']);
  for (const channel of promotion.listChannelDistTags()) {
    assert.throws(() => promotion.assertCandidateDistTag(channel), /production channel/);
  }
  assert.throws(
    () => promotion.assertCandidateDistTag('candidate-6.0.3', { releaseVersion: RELEASE_VERSION }),
    /does not belong to release version/,
  );
});

// ---------------------------------------------------------------------------
// The promotion gate.
// ---------------------------------------------------------------------------

function evidenceFor(overrides = {}) {
  const checks = overrides.checks
    || promotion.REQUIRED_VALIDATION_CHECKS.map((name) => ({ name, status: 'success' }));
  return promotion.buildValidationEvidence({
    releaseVersion: overrides.releaseVersion || RELEASE_VERSION,
    candidateDistTag: promotion.candidateDistTagFor(overrides.releaseVersion || RELEASE_VERSION),
    checks,
  });
}

test('FIX-010: promotion is refused without published-consumer validation evidence', () => {
  assert.throws(
    () => promotion.assertPromotionAllowed({ releaseVersion: RELEASE_VERSION, distTag: 'latest', evidence: null }),
    /without published-consumer validation evidence/,
  );
});

test('FIX-010: evidence for another version cannot promote this one', () => {
  assert.throws(
    () =>
      promotion.assertPromotionAllowed({
        releaseVersion: RELEASE_VERSION,
        distTag: 'latest',
        evidence: evidenceFor({ releaseVersion: '6.0.3' }),
      }),
    /evidence covers "6\.0\.3"/,
  );
});

test('FIX-010: a missing install, import, bin or live-stack check blocks promotion', () => {
  for (const omitted of promotion.REQUIRED_VALIDATION_CHECKS) {
    const evidence = evidenceFor({
      checks: promotion.REQUIRED_VALIDATION_CHECKS.filter((name) => name !== omitted).map((name) => ({
        name,
        status: 'success',
      })),
    });
    assert.equal(evidence.status, 'failure');
    assert.throws(
      () => promotion.assertPromotionAllowed({ releaseVersion: RELEASE_VERSION, distTag: 'latest', evidence }),
      new RegExp(`missing required check\\(s\\) ${omitted}`),
    );
  }
});

test('FIX-010: a failed check blocks promotion and names the candidate tag kept for diagnosis', () => {
  const evidence = evidenceFor({
    checks: promotion.REQUIRED_VALIDATION_CHECKS.map((name) => ({
      name,
      status: name === 'bin-smoke' ? 'failure' : 'success',
      detail: name === 'bin-smoke' ? 'babysitter: command not found' : undefined,
    })),
  });
  assert.equal(evidence.status, 'failure');
  assert.throws(
    () => promotion.assertPromotionAllowed({ releaseVersion: RELEASE_VERSION, distTag: 'latest', evidence }),
    /bin-smoke: failure.*candidate-6\.0\.4 for diagnosis; latest was not moved/s,
  );
});

test('FIX-010: complete successful evidence unlocks the channel', () => {
  assert.equal(
    promotion.assertPromotionAllowed({
      releaseVersion: RELEASE_VERSION,
      distTag: 'latest',
      evidence: evidenceFor(),
    }),
    true,
  );
});

test('FIX-010: promotion targets a release channel, never a candidate tag', () => {
  assert.throws(
    () =>
      promotion.assertPromotionAllowed({
        releaseVersion: RELEASE_VERSION,
        distTag: promotion.candidateDistTagFor(RELEASE_VERSION),
        evidence: evidenceFor(),
      }),
    /promotion moves a release channel/,
  );
});

test('FIX-010: installed versions are proven to be the exact release, not whatever a tag resolved to', () => {
  const packages = ['@a5c-ai/babysitter-sdk', '@a5c-ai/adapters'];
  const good = promotion.assertInstalledExactVersions({
    releaseVersion: RELEASE_VERSION,
    packages,
    tree: { dependencies: { '@a5c-ai/babysitter-sdk': { version: '6.0.4' }, '@a5c-ai/adapters': { version: '6.0.4' } } },
  });
  assert.deepEqual(good.problems, []);

  const stale = promotion.assertInstalledExactVersions({
    releaseVersion: RELEASE_VERSION,
    packages,
    tree: { dependencies: { '@a5c-ai/babysitter-sdk': { version: '6.0.4' } } },
  });
  assert.deepEqual(stale.problems, [
    { package: '@a5c-ai/adapters', expected: '6.0.4', actual: null },
  ]);
});

// ---------------------------------------------------------------------------
// The CLI against a fixture repository with a stateful fake npm.
// ---------------------------------------------------------------------------

/**
 * Fixture monorepo with two public packages, a fake `npm` that answers from —
 * and records dist-tag mutations into — a JSON state file. The real promotion
 * scripts are copied in so they resolve the fixture as their repository root.
 */
function createFixtureRepo(t, { published = [], tags = {} } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fix010-promotion-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  writeJson(path.join(root, 'package.json'), {
    name: 'fixture-root',
    version: RELEASE_VERSION,
    private: true,
    workspaces: ['packages/*'],
  });
  writeJson(path.join(root, 'packages', 'leaf', 'package.json'), {
    name: '@a5c-ai/fixture-leaf',
    version: RELEASE_VERSION,
    publishConfig: { access: 'public' },
  });
  writeJson(path.join(root, 'packages', 'consumer', 'package.json'), {
    name: '@a5c-ai/fixture-consumer',
    version: RELEASE_VERSION,
    publishConfig: { access: 'public' },
    dependencies: { '@a5c-ai/fixture-leaf': RELEASE_VERSION },
  });

  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.copyFileSync(
    path.join(repoRoot, 'scripts', 'release-promotion.cjs'),
    path.join(root, 'scripts', 'release-promotion.cjs'),
  );
  fs.cpSync(path.join(repoRoot, 'scripts', 'lib'), path.join(root, 'scripts', 'lib'), { recursive: true });

  // The publishable-package inventory is derived from git-tracked manifests.
  execFileSync('git', ['init', '--quiet'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'fixture@example.com'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'fixture'], { cwd: root });
  execFileSync('git', ['add', '-A'], { cwd: root });
  execFileSync('git', ['commit', '--quiet', '-m', 'fixture'], { cwd: root });

  const statePath = path.join(root, 'npm-state.json');
  const versions = {};
  for (const spec of published) {
    const at = spec.lastIndexOf('@');
    const name = spec.slice(0, at);
    versions[name] = [...(versions[name] || []), spec.slice(at + 1)];
  }
  writeJson(statePath, { versions, tags });

  const binDir = path.join(root, 'fake-bin');
  fs.mkdirSync(binDir, { recursive: true });
  const npmShim = path.join(binDir, 'npm');
  fs.writeFileSync(
    npmShim,
    [
      '#!/usr/bin/env node',
      "const fs = require('fs');",
      'const args = process.argv.slice(2);',
      "fs.appendFileSync(process.env.NPM_FAKE_LOG, args.join(' ') + '\\n');",
      'const statePath = process.env.NPM_FAKE_STATE;',
      "const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));",
      'const split = (spec) => { const at = spec.lastIndexOf("@"); return [spec.slice(0, at), spec.slice(at + 1)]; };',
      "if (args[0] === 'view') {",
      "  if (args[2] === 'dist-tags') {",
      '    if (!state.versions[args[1]]) { console.error("npm error code E404"); process.exit(1); }',
      '    console.log(JSON.stringify(state.tags[args[1]] || {}));',
      '    process.exit(0);',
      '  }',
      '  const [name, version] = split(args[1]);',
      '  if ((state.versions[name] || []).includes(version)) { console.log(version); process.exit(0); }',
      '  console.error("npm error code E404"); process.exit(1);',
      '}',
      "if (args[0] === 'dist-tag' && args[1] === 'add') {",
      '  const [name, version] = split(args[2]);',
      '  if (!(state.versions[name] || []).includes(version)) { console.error("npm error: no such version"); process.exit(1); }',
      '  state.tags[name] = state.tags[name] || {};',
      '  state.tags[name][args[3]] = version;',
      '  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));',
      '  process.exit(0);',
      '}',
      'process.exit(0);',
      '',
    ].join('\n'),
  );
  fs.chmodSync(npmShim, 0o755);

  return { root, binDir, statePath, logPath: path.join(root, 'npm-invocations.log') };
}

function runCli(fixture, args) {
  fs.writeFileSync(fixture.logPath, '');
  const result = spawnSync(process.execPath, ['scripts/release-promotion.cjs', ...args], {
    cwd: fixture.root,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fixture.binDir}${path.delimiter}${process.env.PATH}`,
      NPM_FAKE_LOG: fixture.logPath,
      NPM_FAKE_STATE: fixture.statePath,
    },
  });
  return {
    ...result,
    invocations: fs.readFileSync(fixture.logPath, 'utf8').split('\n').filter(Boolean),
    state: JSON.parse(fs.readFileSync(fixture.statePath, 'utf8')),
  };
}

function writeEvidence(fixture, evidence) {
  const evidencePath = path.join(fixture.root, 'artifacts', 'published-consumer', 'validation.json');
  writeJson(evidencePath, evidence);
  return evidencePath;
}

const ALL_PUBLISHED = ['@a5c-ai/fixture-leaf@6.0.4', '@a5c-ai/fixture-consumer@6.0.4'];
const STALE_CHANNEL = {
  '@a5c-ai/fixture-leaf': { latest: '6.0.0' },
  '@a5c-ai/fixture-consumer': { latest: '6.0.0' },
};

test('FIX-010: a failed published-consumer validation leaves the channel tag untouched', (t) => {
  const fixture = createFixtureRepo(t, { published: ALL_PUBLISHED, tags: structuredClone(STALE_CHANNEL) });
  const evidencePath = writeEvidence(
    fixture,
    evidenceFor({
      checks: promotion.REQUIRED_VALIDATION_CHECKS.map((name) => ({
        name,
        status: name === 'live-stack' ? 'failure' : 'success',
      })),
    }),
  );

  const result = runCli(fixture, [
    'promote',
    '--version',
    RELEASE_VERSION,
    '--dist-tag',
    'latest',
    '--evidence',
    evidencePath,
  ]);

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.ok(
    !result.invocations.some((line) => line.startsWith('dist-tag')),
    `no dist-tag may be touched by a failed validation; saw: ${result.invocations.join(' | ')}`,
  );
  assert.deepEqual(result.state.tags, STALE_CHANNEL);
});

test('FIX-010: missing validation evidence blocks promotion entirely', (t) => {
  const fixture = createFixtureRepo(t, { published: ALL_PUBLISHED, tags: structuredClone(STALE_CHANNEL) });

  const result = runCli(fixture, [
    'promote',
    '--version',
    RELEASE_VERSION,
    '--dist-tag',
    'latest',
    '--evidence',
    'artifacts/published-consumer/validation.json',
  ]);

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /No published-consumer validation evidence/);
  assert.ok(!result.invocations.some((line) => line.startsWith('dist-tag')));
  assert.deepEqual(result.state.tags, STALE_CHANNEL);
});

test('FIX-010: a mutable dist-tag can never be promoted as the version under test', (t) => {
  const fixture = createFixtureRepo(t, { published: ALL_PUBLISHED, tags: structuredClone(STALE_CHANNEL) });
  const evidencePath = writeEvidence(fixture, evidenceFor());

  const result = runCli(fixture, ['promote', '--version', 'latest', '--dist-tag', 'latest', '--evidence', evidencePath]);

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /mutable dist-tag/);
  assert.ok(!result.invocations.some((line) => line.startsWith('dist-tag')));
});

test('FIX-010: a package missing its exact release artifact blocks the whole promotion', (t) => {
  const fixture = createFixtureRepo(t, {
    published: ['@a5c-ai/fixture-leaf@6.0.4'],
    tags: structuredClone(STALE_CHANNEL),
  });
  const evidencePath = writeEvidence(fixture, evidenceFor());

  const result = runCli(fixture, [
    'promote',
    '--version',
    RELEASE_VERSION,
    '--dist-tag',
    'latest',
    '--evidence',
    evidencePath,
  ]);

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /@a5c-ai\/fixture-consumer/);
  assert.ok(
    !result.invocations.some((line) => line.startsWith('dist-tag')),
    'a partial release must not promote the packages that did publish',
  );
  assert.deepEqual(result.state.tags, STALE_CHANNEL);
});

test('FIX-010: a validated release promotes every public package and the channel then resolves the tested version', (t) => {
  const fixture = createFixtureRepo(t, { published: ALL_PUBLISHED, tags: structuredClone(STALE_CHANNEL) });
  const evidencePath = writeEvidence(fixture, evidenceFor());

  const result = runCli(fixture, [
    'promote',
    '--version',
    RELEASE_VERSION,
    '--dist-tag',
    'latest',
    '--evidence',
    evidencePath,
  ]);

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.deepEqual(result.state.tags, {
    '@a5c-ai/fixture-leaf': { latest: RELEASE_VERSION },
    '@a5c-ai/fixture-consumer': { latest: RELEASE_VERSION },
  });
  // Post-promotion assertion over the full inventory (FIX-001 contract).
  assert.ok(result.invocations.some((line) => line.startsWith('view @a5c-ai/fixture-leaf dist-tags')));
  assert.ok(result.invocations.some((line) => line.startsWith('view @a5c-ai/fixture-consumer dist-tags')));
  assert.match(result.stdout, /Promoted 2 public package\(s\) to latest=6\.0\.4/);
});

test('FIX-010: recorded validation evidence survives a failure for incident review', (t) => {
  const fixture = createFixtureRepo(t, { published: ALL_PUBLISHED });
  const outPath = 'artifacts/published-consumer/validation.json';

  const result = runCli(fixture, [
    'record-validation',
    '--version',
    RELEASE_VERSION,
    '--candidate-tag',
    'candidate-6.0.4',
    '--check',
    'package-install=success',
    '--check',
    'root-import=success',
    '--check',
    'subpath-import=success',
    '--check',
    'bin-smoke=failure:babysitter --version exited 127',
    '--check',
    'live-stack=skipped',
    '--out',
    outPath,
  ]);

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  const evidence = JSON.parse(fs.readFileSync(path.join(fixture.root, outPath), 'utf8'));
  assert.equal(evidence.status, 'failure');
  assert.deepEqual(evidence.failedChecks, ['bin-smoke', 'live-stack']);
  assert.equal(evidence.releaseVersion, RELEASE_VERSION);
});

test('FIX-010: the exact-version guard is available to the published-consumer workflow', (t) => {
  const fixture = createFixtureRepo(t);
  assert.equal(runCli(fixture, ['assert-exact-version', '--version', 'staging']).status, 1);
  assert.equal(runCli(fixture, ['assert-exact-version', '--version', '^6.0.4']).status, 1);
  const ok = runCli(fixture, ['assert-exact-version', '--version', RELEASE_VERSION]);
  assert.equal(ok.status, 0, `${ok.stdout}${ok.stderr}`);
  const candidate = runCli(fixture, ['candidate-tag', '--version', RELEASE_VERSION]);
  assert.equal(candidate.stdout.trim(), 'candidate-6.0.4');
});

// ---------------------------------------------------------------------------
// The release workflow GRAPH.
//
// These are the structural regressions: before FIX-010 the publish workflow
// moved channel tags with no published-consumer job anywhere in its graph, and
// the published-consumer workflow could not be called with an exact version.
// ---------------------------------------------------------------------------

function readWorkflow(relativePath) {
  const text = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const parsed = parseYaml(text);
  // `on:` parses as the string key under YAML 1.2 and as boolean true under
  // YAML 1.1 tooling; accept either so the assertion is about the graph.
  const triggers = parsed.on ?? parsed[true];
  return { text, parsed, triggers, jobs: parsed.jobs };
}

const PUBLISH_WORKFLOW = '.github/workflows/publish.yml';
const PUBLISHED_CONSUMER_WORKFLOW = '.github/workflows/live-stack-published.yml';
const PROMOTION_JOB = 'promote_release_channel';
const VALIDATION_JOB = 'published_consumer_validation';

function needsOf(job) {
  if (!job || job.needs === undefined) return [];
  return Array.isArray(job.needs) ? job.needs : [job.needs];
}

test('FIX-010: the publish workflow calls the published-consumer workflow with the exact release version', () => {
  const { jobs } = readWorkflow(PUBLISH_WORKFLOW);
  const validation = jobs[VALIDATION_JOB];
  assert.ok(validation, `${PUBLISH_WORKFLOW} must have a ${VALIDATION_JOB} job`);
  assert.equal(validation.uses, `./${PUBLISHED_CONSUMER_WORKFLOW}`);
  assert.match(
    String(validation.with.release_version),
    /needs\.prepare_staging_publish\.outputs\.release_version/,
    'the published-consumer workflow must be called with THE resolved release version (FIX-001)',
  );
  assert.ok(
    needsOf(validation).includes('publish_staging_metapackage'),
    'validation runs after every exact version exists on the registry',
  );
});

test('FIX-010: channel promotion is a separate job that depends on the published-consumer validation', () => {
  const { jobs, text } = readWorkflow(PUBLISH_WORKFLOW);
  const promote = jobs[PROMOTION_JOB];
  assert.ok(promote, `${PUBLISH_WORKFLOW} must move channel tags in a dedicated ${PROMOTION_JOB} job`);
  assert.ok(
    needsOf(promote).includes(VALIDATION_JOB),
    `${PROMOTION_JOB} must depend on ${VALIDATION_JOB}; promotion without published-consumer validation is the defect`,
  );
  const promoteSteps = JSON.stringify(promote.steps || []);
  assert.match(promoteSteps, /release-promotion\.cjs promote/);

  // The only channel mutation in the whole workflow lives in that job.
  const promoteCommandOccurrences = text.split('release-promotion.cjs promote').length - 1;
  assert.equal(
    promoteCommandOccurrences,
    1,
    'exactly one job may move the channel tags, and it must be the gated promotion job',
  );
});

test('FIX-010: the channel-tag assertion and the release tag follow the validated promotion', () => {
  const { jobs } = readWorkflow(PUBLISH_WORKFLOW);
  assert.ok(
    needsOf(jobs.assert_release_channel_tags).includes(PROMOTION_JOB),
    'the FIX-001 channel assertion must run after the validated promotion, not after publication',
  );
  assert.ok(needsOf(jobs.create_release_tag).includes('assert_release_channel_tags'));
});

test('FIX-010: the published-consumer workflow is callable and requires an exact version input', () => {
  const { triggers } = readWorkflow(PUBLISHED_CONSUMER_WORKFLOW);
  assert.ok(triggers.workflow_call, 'the published-consumer workflow must be workflow_call-able by publish.yml');
  const called = triggers.workflow_call.inputs.release_version;
  assert.ok(called, 'workflow_call must take the exact release version under test');
  assert.equal(called.required, true);
  assert.equal(called.type, 'string');

  // Manual recovery keeps working, with the same exact-version input.
  const dispatched = triggers.workflow_dispatch.inputs.release_version;
  assert.ok(dispatched, 'workflow_dispatch must keep manual recovery available with the same input');
  assert.equal(dispatched.required, true);

  assert.ok(
    !triggers.push,
    'a push trigger cannot name an exact version under test; the workflow is called by the release instead',
  );
});

test('FIX-010: the published-consumer workflow installs exact versions, never a mutable dist-tag', () => {
  const { text, jobs } = readWorkflow(PUBLISHED_CONSUMER_WORKFLOW);
  assert.doesNotMatch(
    text,
    /@\$\{NPM_TAG\}|@\$\{\{ *needs\.setup\.outputs\.npm_tag *\}\}/,
    'published packages must be installed by exact version, never by dist-tag',
  );
  assert.match(text, /@\$\{RELEASE_VERSION\}/, 'installs must pin the exact release version');
  assert.match(text, /release-promotion\.cjs assert-exact-version/, 'the input must be validated as exact');
  assert.match(text, /verify-published-release\.mjs/, 'install/import/bin-smoke of the exact version must run');

  const jobText = JSON.stringify(jobs);
  assert.match(jobText, /upload-artifact/, 'install/import/bin-smoke evidence must be preserved');
  assert.match(jobText, /assert-installed/, 'the exact installed versions must be recorded and asserted');
});
