#!/usr/bin/env node
/**
 * Derived release matrix groups (FIX-005).
 *
 * Release workflows must not carry hand-maintained package lists: every list
 * that decides "which packages are built / published" is derived here from the
 * authoritative publishable-package inventory
 * (scripts/lib/publishable-packages.cjs). A new public package therefore joins
 * the release paths by existing, not by being remembered.
 *
 * The 2026-08-13 release incident (docs/release-incident-2026-08-13.md) was
 * caused by exactly that omission class: `@a5c-ai/hooks-adapter-genty` was
 * public, documented, and depended on by the hooks CLI, yet absent from
 * scripts/hooks-adapter-build.cjs, .github/workflows/publish.yml and
 * .github/workflows/publish-packages-from-tag.yml, so it was never published;
 * `@a5c-ai/hooks-adapter-antigravity` and `@a5c-ai/hooks-adapter-hermes` were
 * missing from the tag workflow for the same reason.
 *
 * Consumers:
 *   - scripts/release-matrix.cjs           CLI used by both release workflows
 *   - scripts/hooks-adapter-build.cjs      aggregate hooks build/test/lint
 *   - scripts/check-package-metadata.cjs   release-matrix coverage gate
 */
'use strict';

const { listPublishablePackages } = require('./publishable-packages.cjs');
const { stripYamlComments } = require('./workflow-text.cjs');

/**
 * A derived group selects members of the authoritative inventory. Workflows
 * consume a group through `scripts/release-matrix.cjs --group <id>`; the
 * metadata gate credits every member of a group to a workflow that invokes it.
 */
const GROUPS = {
  'all-publishable': {
    description:
      'Every package this repository publishes. Consumed as dependency-ordered ' +
      'publication waves (--format waves) so a package is never published before ' +
      'the internal dependencies it pins (FIX-001).',
    selects: () => true,
  },
  'hooks-leaves': {
    description:
      'Public hooks harness adapter leaves (packages/adapters/hooks/adapter-*). ' +
      'Independent of each other; each depends only on @a5c-ai/hooks-adapter-core.',
    selects: (entry) => /^packages\/adapters\/hooks\/adapter-[^/]+$/.test(entry.dir),
  },
};

const ATLAS_DIR = 'packages/atlas';
const HOOKS_CORE_DIR = 'packages/adapters/hooks/core';
const HOOKS_CLI_DIR = 'packages/adapters/hooks/cli';

function listGroupIds() {
  return Object.keys(GROUPS).sort();
}

/**
 * @param {string} repoRoot absolute path to the repository root
 * @param {string} groupId one of {@link listGroupIds}
 * @returns {Array<{name: string, dir: string, version: string, jobName: string}>}
 *   inventory members of the group, sorted by package name. Throws for unknown
 *   groups and for groups that resolve to nothing — a silently empty release
 *   matrix is the failure mode this module exists to prevent.
 */
function listGroup(repoRoot, groupId) {
  const group = GROUPS[groupId];
  if (!group) {
    throw new Error(
      `Unknown release-matrix group ${JSON.stringify(groupId)}; known groups: ${listGroupIds().join(', ')}`,
    );
  }
  const members = listPublishablePackages(repoRoot)
    .filter((entry) => group.selects(entry))
    .map((entry) => ({
      name: entry.name,
      dir: entry.dir,
      version: entry.version,
      jobName: entry.dir.slice(entry.dir.lastIndexOf('/') + 1),
    }));
  if (members.length === 0) {
    throw new Error(
      `Release-matrix group ${groupId} resolved to zero publishable packages; ` +
        'the inventory or the group selector is broken.',
    );
  }
  return members;
}

/**
 * Dependency-ordered directories for the aggregate hooks build/test/lint
 * command: the Atlas catalog foundation, hooks core, every public hooks leaf,
 * then the hooks CLI (which pins every leaf at an exact version and must be
 * built — and published — last).
 *
 * @param {string} repoRoot absolute path to the repository root
 * @returns {string[]} repo-relative package directories
 */
function hooksBuildOrder(repoRoot) {
  const inventory = listPublishablePackages(repoRoot);
  const dirs = new Set(inventory.map((entry) => entry.dir));
  for (const required of [ATLAS_DIR, HOOKS_CORE_DIR, HOOKS_CLI_DIR]) {
    if (!dirs.has(required)) {
      throw new Error(`Expected ${required} to be a public package in the authoritative inventory`);
    }
  }
  return [
    ATLAS_DIR,
    HOOKS_CORE_DIR,
    ...listGroup(repoRoot, 'hooks-leaves').map((entry) => entry.dir),
    HOOKS_CLI_DIR,
  ];
}

/**
 * Dependency-ordered publication waves for the WHOLE publishable inventory
 * (FIX-001).
 *
 * `scripts/publish-package-from-tag.mjs` hard-fails a package whose exactly
 * pinned internal dependency is not on the registry yet, so publication order
 * is a correctness requirement, not an optimization. Deriving it from the
 * authoritative dependency graph — instead of a hand-curated sequence of
 * `publish_many` groups — is what keeps a new package from being published
 * before its dependencies (or forgotten entirely, as
 * `@a5c-ai/hooks-adapter-genty` was).
 *
 * Every package in wave N depends only on packages in waves < N, so a wave may
 * be published in parallel.
 *
 * @param {string} repoRoot absolute path to the repository root
 * @returns {Array<Array<{name: string, dir: string, version: string}>>}
 */
function publicationOrder(repoRoot) {
  const inventory = listPublishablePackages(repoRoot);
  const names = new Set(inventory.map((entry) => entry.name));
  const internalDependencies = new Map(
    inventory.map((entry) => [
      entry.name,
      [
        ...new Set(
          ['dependencies', 'optionalDependencies', 'peerDependencies']
            .flatMap((field) => Object.keys(entry.manifest[field] || {}))
            .filter((dependency) => names.has(dependency) && dependency !== entry.name),
        ),
      ],
    ]),
  );

  const published = new Set();
  const waves = [];
  while (published.size < inventory.length) {
    const wave = inventory.filter(
      (entry) =>
        !published.has(entry.name) &&
        internalDependencies.get(entry.name).every((dependency) => published.has(dependency)),
    );
    if (wave.length === 0) {
      const blocked = inventory.filter((entry) => !published.has(entry.name)).map((entry) => entry.name);
      throw new Error(
        'The publishable-package dependency graph contains a cycle; no publication order exists for: ' +
          `${blocked.join(', ')}`,
      );
    }
    waves.push(wave.map((entry) => ({ name: entry.name, dir: entry.dir, version: entry.version })));
    for (const entry of wave) published.add(entry.name);
  }
  return waves;
}

/**
 * Packages whose clean-consumer verification MUST use a non-hoisted install
 * layout (`npm install --install-strategy=nested`) — FIX-006.
 *
 * Every hooks leaf — and the hooks CLI — resolves `@a5c-ai/atlas/catalog` from
 * its own shipped sources. A hoisted `node_modules` places Atlas at the
 * consumer root regardless of who declared it, so a hoisted install proves
 * nothing about ownership: it passed for months while the leaves declared only
 * `@a5c-ai/hooks-adapter-core`. Under a nested layout each package resolves
 * only what it declares, so the tarball import fails unless the importer owns
 * Atlas itself.
 *
 * Derived from the hooks-leaves group so a new leaf joins this matrix by
 * existing, not by being remembered.
 *
 * @param {string} repoRoot absolute path to the repository root
 * @returns {string[]} package names, sorted
 */
function nonHoistedVerificationPackages(repoRoot) {
  const cli = listPublishablePackages(repoRoot).find((entry) => entry.dir === HOOKS_CLI_DIR);
  if (!cli) {
    throw new Error(`Expected ${HOOKS_CLI_DIR} to be a public package in the authoritative inventory`);
  }
  return [...listGroup(repoRoot, 'hooks-leaves').map((entry) => entry.name), cli.name].sort();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Packages a workflow covers because it invokes the release-matrix generator
 * for a group, rather than naming the packages one by one.
 *
 * Comments are stripped first: a workflow that only MENTIONS the generator in a
 * comment (publish.yml does exactly that, next to the derived hooks-leaves
 * matrix) runs nothing, and must credit nothing.
 *
 * @param {string} repoRoot absolute path to the repository root
 * @param {string} workflowContents raw workflow YAML text
 * @returns {Set<string>} covered package names
 */
function derivedWorkflowCoverage(repoRoot, workflowContents) {
  const executable = stripYamlComments(workflowContents);
  const covered = new Set();
  for (const groupId of listGroupIds()) {
    const invocation = new RegExp(
      `scripts/release-matrix\\.cjs[^\\n]*--group[= ]${escapeRegExp(groupId)}(?![\\w-])`,
    );
    if (!invocation.test(executable)) continue;
    for (const member of listGroup(repoRoot, groupId)) {
      covered.add(member.name);
    }
  }
  return covered;
}

/**
 * The release-matrix coverage gate: which publishable packages a workflow does
 * NOT publish.
 *
 * A package is covered when the workflow either names it in an executable
 * position or derives it from a release-matrix group the workflow actually
 * invokes. Coverage is decided against the COMMENT-STRIPPED workflow, because a
 * package named only in a comment is published by nothing — crediting it is the
 * same silent omission (`@a5c-ai/hooks-adapter-genty` was public, documented and
 * pinned by the hooks CLI, yet published by no workflow) that this gate exists
 * to make impossible.
 *
 * @param {object} input
 * @param {string} input.repoRoot absolute path to the repository root
 * @param {Array<{name: string}>} input.packages authoritative inventory entries
 * @param {string} input.workflowContents raw workflow YAML text
 * @param {string} input.surface workflow path, echoed into each violation
 * @returns {Array<{package: string, surface: string}>}
 */
function releaseMatrixCoverageViolations({ repoRoot, packages, workflowContents, surface }) {
  const executable = stripYamlComments(workflowContents);
  const derived = derivedWorkflowCoverage(repoRoot, workflowContents);
  const violations = [];
  for (const entry of packages) {
    const named = new RegExp(`${escapeRegExp(entry.name)}(?![\\w.-])`).test(executable);
    if (!named && !derived.has(entry.name)) violations.push({ package: entry.name, surface });
  }
  return violations;
}

module.exports = {
  GROUPS,
  listGroupIds,
  listGroup,
  hooksBuildOrder,
  publicationOrder,
  nonHoistedVerificationPackages,
  derivedWorkflowCoverage,
  releaseMatrixCoverageViolations,
};
