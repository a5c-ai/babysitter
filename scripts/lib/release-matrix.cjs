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

/**
 * A derived group selects members of the authoritative inventory. Workflows
 * consume a group through `scripts/release-matrix.cjs --group <id>`; the
 * metadata gate credits every member of a group to a workflow that invokes it.
 */
const GROUPS = {
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
 * @param {string} repoRoot absolute path to the repository root
 * @param {string} workflowContents raw workflow YAML text
 * @returns {Set<string>} covered package names
 */
function derivedWorkflowCoverage(repoRoot, workflowContents) {
  const covered = new Set();
  for (const groupId of listGroupIds()) {
    const invocation = new RegExp(
      `scripts/release-matrix\\.cjs[^\\n]*--group[= ]${escapeRegExp(groupId)}(?![\\w-])`,
    );
    if (!invocation.test(workflowContents)) continue;
    for (const member of listGroup(repoRoot, groupId)) {
      covered.add(member.name);
    }
  }
  return covered;
}

module.exports = {
  GROUPS,
  listGroupIds,
  listGroup,
  hooksBuildOrder,
  nonHoistedVerificationPackages,
  derivedWorkflowCoverage,
};
