#!/usr/bin/env node
/**
 * Authoritative publishable-package inventory (FIX-011).
 *
 * The single source of truth for "which packages does this repository
 * publish": every WORKSPACE MEMBER manifest (resolved from the root
 * `package.json` `workspaces` globs) where `private !== true` and
 * `publishConfig.access === "public"`. Build, test, version, publish, and
 * documentation coverage must derive from this inventory instead of
 * hand-maintained lists (see docs/release-incident-2026-08-13.md, FIX-005).
 *
 * ## Why the workspace globs, and not `git ls-files`
 *
 * The inventory is consumed in two different execution contexts:
 *
 *   1. the repository checkout (PR gates, local runs);
 *   2. the extracted publication workspace — `.github/workflows/publish.yml`
 *      bundles the release tree with `tar --exclude=.git` and every publish job
 *      extracts THAT tarball without ever running `actions/checkout`.
 *
 * A `git ls-files` derivation crashes in context 2 (`fatal: not a git
 * repository`, exit 128), which is what took down `build:hooks-adapter` in the
 * `publish_staging_hooks_cli` job. There is deliberately NO "try git, else walk
 * the filesystem" fallback: one mechanism must produce identical results in
 * both contexts or the inventory is not authoritative.
 *
 * The chosen mechanism is the root manifest's `workspaces` globs — the same
 * declaration npm itself uses to decide what `npm publish --workspace <name>`
 * can publish. It needs no VCS, it is a committed artifact of the repository,
 * and it is exactly the set of directories a release can publish from.
 * `scripts/__tests__/publishable-packages.test.mjs` pins the equivalence with
 * the `git ls-files` derivation inside the repository AND exercises the
 * inventory in a `.git`-less copy of this repository's manifests.
 *
 * Run directly to print the generated inventory as JSON:
 *   node scripts/lib/publishable-packages.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');

/** Directory names a workspace glob never expands into. */
const NEVER_A_WORKSPACE = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', 'artifacts']);

function rel(p) {
  return p.split(path.sep).join('/');
}

function readRootWorkspacePatterns(repoRoot) {
  const rootManifestPath = path.join(repoRoot, 'package.json');
  if (!fs.existsSync(rootManifestPath)) {
    throw new Error(
      `No root package.json at ${rootManifestPath}; the publishable-package inventory is derived from ` +
        'the root manifest workspaces globs and cannot be generated without it.',
    );
  }
  const rootManifest = JSON.parse(fs.readFileSync(rootManifestPath, 'utf8'));
  const patterns = Array.isArray(rootManifest.workspaces)
    ? rootManifest.workspaces
    : Array.isArray(rootManifest.workspaces && rootManifest.workspaces.packages)
      ? rootManifest.workspaces.packages
      : null;
  if (!patterns || patterns.length === 0) {
    throw new Error(
      'The root package.json declares no `workspaces`; the publishable-package inventory has no source.',
    );
  }
  return patterns;
}

/**
 * Workspace member directories, resolved from the root `workspaces` globs the
 * same way npm resolves them. Deterministic and VCS-free: identical inside the
 * repository and inside the extracted publication tarball.
 *
 * Only the two glob shapes this repository uses are supported — a literal
 * directory and a single trailing `*` segment. An unsupported pattern is a hard
 * error: silently ignoring it would silently drop packages from the release.
 *
 * @param {string} repoRoot absolute path to the repository root
 * @returns {Set<string>} repo-relative directories, each containing a package.json
 */
function resolveWorkspaceDirs(repoRoot) {
  const dirs = new Set();
  for (const pattern of readRootWorkspacePatterns(repoRoot)) {
    const normalized = String(pattern).replace(/\/+$/, '');
    const starIndex = normalized.indexOf('*');
    if (starIndex === -1) {
      if (fs.existsSync(path.join(repoRoot, normalized, 'package.json'))) dirs.add(rel(normalized));
      continue;
    }
    if (normalized.endsWith('/*') && normalized.indexOf('*') === normalized.length - 1) {
      const base = normalized.slice(0, -2);
      const baseAbs = path.join(repoRoot, base);
      if (!fs.existsSync(baseAbs)) continue;
      for (const entry of fs.readdirSync(baseAbs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        if (NEVER_A_WORKSPACE.has(entry.name)) continue;
        if (fs.existsSync(path.join(baseAbs, entry.name, 'package.json'))) {
          dirs.add(rel(path.join(base, entry.name)));
        }
      }
      continue;
    }
    throw new Error(
      `Unsupported workspaces pattern ${JSON.stringify(pattern)} in the root package.json. ` +
        'The publishable-package inventory supports a literal directory or a single trailing "/*" ' +
        'segment; extend scripts/lib/publishable-packages.cjs (and its tests) before introducing a ' +
        'new glob shape, so the inventory can never silently drop a package.',
    );
  }
  return dirs;
}

/**
 * @param {string} repoRoot absolute path to the repository root
 * @returns {Array<{name: string, dir: string, version: string, manifestPath: string, manifest: object}>}
 *   sorted by package name; throws on duplicate names/dirs or unreadable
 *   workspace manifests — the inventory must never silently drop a package.
 */
function listPublishablePackages(repoRoot) {
  const inventory = [];
  const byName = new Map();

  for (const dir of [...resolveWorkspaceDirs(repoRoot)].sort()) {
    const manifestPath = `${dir}/package.json`;
    const fullPath = path.join(repoRoot, manifestPath);
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch (error) {
      throw new Error(`Workspace manifest ${manifestPath} is not valid JSON: ${error.message}`);
    }
    if (!manifest || typeof manifest !== 'object') continue;
    if (manifest.private === true) continue;
    if (!manifest.publishConfig || manifest.publishConfig.access !== 'public') continue;
    if (typeof manifest.name !== 'string' || manifest.name.length === 0) {
      throw new Error(`Public manifest ${manifestPath} has no package name`);
    }

    if (byName.has(manifest.name)) {
      throw new Error(
        `Duplicate publishable package name ${manifest.name}: ` +
          `${byName.get(manifest.name)} and ${manifestPath} both claim it.`,
      );
    }
    byName.set(manifest.name, manifestPath);

    inventory.push({
      name: manifest.name,
      dir,
      version: typeof manifest.version === 'string' ? manifest.version : '',
      manifestPath,
      manifest,
    });
  }

  inventory.sort((a, b) => a.name.localeCompare(b.name));
  return inventory;
}

module.exports = { listPublishablePackages, resolveWorkspaceDirs };

if (require.main === module) {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const inventory = listPublishablePackages(repoRoot).map(({ name, dir, version, manifestPath }) => ({
    name,
    dir,
    version,
    manifestPath,
  }));
  process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
}
