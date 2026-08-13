/**
 * FIX-005 release matrix completeness.
 *
 * Proves that every PUBLIC hooks leaf is built, tested, versioned and
 * published — derived from the authoritative publishable-package inventory
 * rather than from hand-maintained lists. `@a5c-ai/hooks-adapter-genty` was
 * public, documented and depended on by the hooks CLI yet appeared in none of
 * those lists, so it was never published (docs/release-incident-2026-08-13.md).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { listGroup, listGroupIds, hooksBuildOrder, derivedWorkflowCoverage } = require('../lib/release-matrix.cjs');
const { listPublishablePackages } = require('../lib/publishable-packages.cjs');

const BRANCH_WORKFLOW = '.github/workflows/publish.yml';
const TAG_WORKFLOW = '.github/workflows/publish-packages-from-tag.yml';
const HOOKS_BUILD_SCRIPT = 'scripts/hooks-adapter-build.cjs';
const HOOKS_CLI = '@a5c-ai/hooks-adapter-cli';
const HOOKS_CORE = '@a5c-ai/hooks-adapter-core';
const GENTY_LEAF = '@a5c-ai/hooks-adapter-genty';
const ATLAS = '@a5c-ai/atlas';

// The public hooks harness leaves as of the 2026-08-13 audit baseline. Adding
// or removing a harness adapter is an intentional act: update this list in the
// same change.
const EXPECTED_HOOKS_LEAVES = [
  '@a5c-ai/hooks-adapter-antigravity',
  '@a5c-ai/hooks-adapter-claude',
  '@a5c-ai/hooks-adapter-codex',
  '@a5c-ai/hooks-adapter-copilot',
  '@a5c-ai/hooks-adapter-cursor',
  '@a5c-ai/hooks-adapter-gemini',
  '@a5c-ai/hooks-adapter-genty',
  '@a5c-ai/hooks-adapter-hermes',
  '@a5c-ai/hooks-adapter-oh-my-pi',
  '@a5c-ai/hooks-adapter-openclaw',
  '@a5c-ai/hooks-adapter-opencode',
  '@a5c-ai/hooks-adapter-pi',
];

function escapeForRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function leafNames() {
  return listGroup(repoRoot, 'hooks-leaves').map((entry) => entry.name);
}

function manifestOf(packageName) {
  const entry = listPublishablePackages(repoRoot).find((candidate) => candidate.name === packageName);
  assert.ok(entry, `${packageName} must be a public package in the authoritative inventory`);
  return entry;
}

test('the hooks-leaves group is derived from the inventory and contains every public hooks leaf', () => {
  assert.deepEqual(leafNames(), EXPECTED_HOOKS_LEAVES);
  assert.ok(leafNames().includes(GENTY_LEAF), 'the Genty leaf must be part of the derived group');
});

test('the release-matrix generator emits the derived group for workflow consumption', () => {
  const matrix = JSON.parse(
    execFileSync(process.execPath, ['scripts/release-matrix.cjs', '--group', 'hooks-leaves'], {
      cwd: repoRoot,
      encoding: 'utf8',
    }),
  );
  assert.deepEqual(
    matrix.map((entry) => entry.workspace),
    EXPECTED_HOOKS_LEAVES,
  );
  for (const entry of matrix) {
    assert.match(entry.name, /^adapter-[a-z0-9-]+$/, 'matrix job names must be usable in workflow job titles');
  }
  const workspaces = execFileSync(
    process.execPath,
    ['scripts/release-matrix.cjs', '--group', 'hooks-leaves', '--format', 'workspaces'],
    { cwd: repoRoot, encoding: 'utf8' },
  )
    .trim()
    .split('\n');
  assert.deepEqual(workspaces, EXPECTED_HOOKS_LEAVES);
});

test('the generator fails loudly on an unknown group instead of emitting an empty matrix', () => {
  assert.throws(
    () =>
      execFileSync(process.execPath, ['scripts/release-matrix.cjs', '--group', 'no-such-group'], {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      }),
    /Unknown release-matrix group/,
  );
  assert.throws(() => listGroup(repoRoot, 'no-such-group'), /Unknown release-matrix group/);
  assert.ok(listGroupIds().includes('hooks-leaves'));
});

test('every public hooks leaf is BUILT and TESTED by the aggregate hooks command', () => {
  const order = hooksBuildOrder(repoRoot);
  for (const leaf of listGroup(repoRoot, 'hooks-leaves')) {
    assert.ok(order.includes(leaf.dir), `${leaf.name} (${leaf.dir}) must be in the aggregate hooks build order`);
  }
  assert.ok(order.includes('packages/adapters/hooks/core'));
  assert.ok(order.includes('packages/adapters/hooks/cli'));
  assert.equal(order[order.length - 1], 'packages/adapters/hooks/cli', 'the hooks CLI builds last');

  for (const packageName of [...EXPECTED_HOOKS_LEAVES, HOOKS_CORE, HOOKS_CLI]) {
    const { manifest, dir } = manifestOf(packageName);
    assert.ok(manifest.scripts && manifest.scripts.build, `${packageName} (${dir}) must declare a build script`);
    assert.ok(manifest.scripts.test, `${packageName} (${dir}) must declare a test script`);
  }

  const script = readRepoFile(HOOKS_BUILD_SCRIPT);
  assert.match(
    script,
    /require\('\.\/lib\/release-matrix\.cjs'\)/,
    `${HOOKS_BUILD_SCRIPT} must derive its package list from the authoritative inventory`,
  );
  assert.doesNotMatch(
    script,
    /'packages\/adapters\/hooks\/adapter-/,
    `${HOOKS_BUILD_SCRIPT} must not hand-maintain hooks leaf directories`,
  );
});

test('every public hooks leaf is VERSIONED in lockstep with the rest of the hooks family', () => {
  const hooksFamily = [...EXPECTED_HOOKS_LEAVES, HOOKS_CORE, HOOKS_CLI].map((name) => manifestOf(name));
  const versions = new Set(hooksFamily.map((entry) => entry.version));
  assert.equal(
    versions.size,
    1,
    `hooks packages must share one release version, saw: ${[...versions].sort().join(', ')}`,
  );
  const [version] = [...versions];
  assert.match(version, /^\d+\.\d+\.\d+/);

  // Every hooks leaf pins hooks core exactly, which is what makes the derived
  // publication order (core -> leaves -> CLI) load-bearing: the publish helper
  // refuses to publish a package whose exact internal pin is missing from the
  // registry (scripts/__tests__/publish-package-from-tag.test.mjs).
  for (const leaf of EXPECTED_HOOKS_LEAVES) {
    const { manifest } = manifestOf(leaf);
    assert.equal(
      manifest.dependencies[HOOKS_CORE],
      version,
      `${leaf} must pin ${HOOKS_CORE} at the exact version ${version}`,
    );
  }

  // Every hooks leaf the CLI declares is pinned exactly. The CLI does not
  // currently declare the Genty leaf (verified on main and on this branch);
  // the remediation plan's evidence line claiming otherwise is inaccurate.
  // Declaring it is deliberately NOT done here: it would require either an
  // out-of-sync lockfile or a full unrelated `npm install --package-lock-only`
  // rewrite, and it would make the CLI uninstallable from a clean registry
  // until the Genty leaf is published for the first time.
  const cli = manifestOf(HOOKS_CLI);
  for (const [dependency, range] of Object.entries(cli.manifest.dependencies)) {
    if (!dependency.startsWith('@a5c-ai/hooks-adapter-')) continue;
    assert.equal(range, version, `${HOOKS_CLI} must pin ${dependency} at the exact version ${version}`);
  }

  // FIX-006: Atlas is a directly owned dependency of every hooks package that
  // imports it, and it publishes in the same lockstep release as the family, so
  // it follows the same exact-pin convention hooks core already uses.
  const atlasVersion = manifestOf(ATLAS).manifest.version;
  for (const packageName of [...EXPECTED_HOOKS_LEAVES, HOOKS_CORE, HOOKS_CLI]) {
    assert.equal(
      manifestOf(packageName).manifest.dependencies[ATLAS],
      atlasVersion,
      `${packageName} must pin ${ATLAS} at the exact version ${atlasVersion} (FIX-006)`,
    );
  }
});

test('both release workflows PUBLISH every public hooks leaf, derived from the inventory', () => {
  for (const workflow of [BRANCH_WORKFLOW, TAG_WORKFLOW]) {
    const contents = readRepoFile(workflow);
    const derived = derivedWorkflowCoverage(repoRoot, contents);
    for (const leaf of EXPECTED_HOOKS_LEAVES) {
      assert.ok(
        derived.has(leaf),
        `${workflow} must cover ${leaf} through the derived release matrix, not a hand-maintained list`,
      );
    }
    assert.doesNotMatch(
      contents,
      new RegExp(`workspace: '@a5c-ai/hooks-adapter-(?:${EXPECTED_HOOKS_LEAVES.map((n) => n.split('adapter-')[1]).join('|')})'`),
      `${workflow} must not re-introduce a hand-maintained hooks leaf matrix`,
    );
  }
});

test('both release workflows BUILD the derived hooks leaves before publishing them', () => {
  const branch = readRepoFile(BRANCH_WORKFLOW);
  // The branch workflow builds the whole hooks family through the aggregate
  // command and rebuilds the matrix workspace inside the per-leaf job.
  assert.match(branch, /npm run build:hooks-adapter/);
  assert.match(branch, /npm run build --workspace=\$\{\{ matrix\.workspace \}\}/);

  const tag = readRepoFile(TAG_WORKFLOW);
  const buildInvocation = tag.indexOf('scripts/release-matrix.cjs --group hooks-leaves');
  const publishStep = tag.indexOf('Publish packages from tag');
  assert.ok(buildInvocation !== -1, `${TAG_WORKFLOW} must derive the hooks leaves it builds`);
  assert.ok(
    buildInvocation < publishStep,
    `${TAG_WORKFLOW} must build the derived hooks leaves before the publish step`,
  );
});

test('publication order publishes the Genty leaf before the hooks CLI', () => {
  const branch = readRepoFile(BRANCH_WORKFLOW);
  const leafJob = branch.indexOf('publish_staging_hooks_adapters:');
  assert.ok(leafJob !== -1, 'the branch workflow must keep a hooks leaf publication job');
  const cliJob = branch.indexOf('publish_staging_hooks_cli:');
  assert.ok(cliJob !== -1, 'the branch workflow must keep a hooks CLI publication job');
  const cliJobBody = branch.slice(cliJob, cliJob + 400);
  assert.match(
    cliJobBody,
    /needs: publish_staging_hooks_adapters/,
    'the hooks CLI job must wait for every derived hooks leaf (including Genty) to publish',
  );

  const tag = readRepoFile(TAG_WORKFLOW);
  const publishStep = tag.indexOf('Publish packages from tag');
  const leafPublish = tag.indexOf('publish_many "Publish leaf adapter packages"', publishStep);
  const cliPublish = tag.indexOf('publish_many "Publish aggregate packages"', publishStep);
  assert.ok(leafPublish !== -1, `${TAG_WORKFLOW} must publish the derived hooks leaves`);
  assert.ok(cliPublish !== -1, `${TAG_WORKFLOW} must publish the aggregate group`);
  const leafBlock = tag.slice(leafPublish, cliPublish);
  const cliBlock = tag.slice(cliPublish, cliPublish + 400);
  assert.match(
    leafBlock,
    /"\$\{HOOKS_LEAVES\[@\]\}"/,
    `${TAG_WORKFLOW} must publish the derived hooks leaves in the leaf group`,
  );
  assert.match(cliBlock, new RegExp(escapeForRegExp(HOOKS_CLI)), `${TAG_WORKFLOW} must publish ${HOOKS_CLI}`);
  assert.ok(
    leafPublish < cliPublish,
    `${TAG_WORKFLOW} must publish every hooks leaf before ${HOOKS_CLI} (exact dependency order)`,
  );
});

test('the FIX-005 release-matrix gaps are no longer tolerated by the allowlist', () => {
  const known = JSON.parse(readRepoFile('scripts/known-package-defects.json'));
  const fix005 = (known.releaseMatrixCoverage || []).filter((entry) => entry.fixId === 'FIX-005');
  assert.deepEqual(fix005, [], 'FIX-005 release-matrix allowlist entries must be deleted once the fix lands');
});
