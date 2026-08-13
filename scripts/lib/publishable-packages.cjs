#!/usr/bin/env node
/**
 * Authoritative publishable-package inventory (FIX-011).
 *
 * The single source of truth for "which packages does this repository
 * publish": every git-TRACKED workspace manifest where `private !== true` and
 * `publishConfig.access === "public"`. Build, test, version, publish, and
 * documentation coverage must derive from this inventory instead of
 * hand-maintained lists (see docs/release-incident-2026-08-13.md, FIX-005).
 *
 * Run directly to print the generated inventory as JSON:
 *   node scripts/lib/publishable-packages.cjs
 */
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function rel(p) {
  return p.split(path.sep).join('/');
}

function listTrackedManifests(repoRoot) {
  const output = execFileSync('git', ['ls-files', '--', 'package.json', '*/package.json', '**/package.json'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return [...new Set(output.split('\n').map((line) => line.trim()).filter(Boolean))].filter(
    (line) => line === 'package.json' || line.endsWith('/package.json'),
  );
}

// Workspace member directories resolved the same way npm resolves the root
// `workspaces` globs. Used to decide how loud a broken manifest must be.
function resolveWorkspaceDirs(repoRoot) {
  const rootManifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const patterns = Array.isArray(rootManifest.workspaces) ? rootManifest.workspaces : [];
  const dirs = new Set();
  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      const base = pattern.replace(/\/\*+$/, '');
      const baseAbs = path.join(repoRoot, base);
      if (!fs.existsSync(baseAbs)) continue;
      for (const entry of fs.readdirSync(baseAbs, { withFileTypes: true })) {
        if (entry.isDirectory() && fs.existsSync(path.join(baseAbs, entry.name, 'package.json'))) {
          dirs.add(rel(path.join(base, entry.name)));
        }
      }
    } else if (fs.existsSync(path.join(repoRoot, pattern, 'package.json'))) {
      dirs.add(rel(pattern));
    }
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
  const workspaceDirs = resolveWorkspaceDirs(repoRoot);
  const inventory = [];
  const byName = new Map();

  for (const manifestPath of listTrackedManifests(repoRoot)) {
    const dir = manifestPath === 'package.json' ? '.' : rel(path.dirname(manifestPath));
    const fullPath = path.join(repoRoot, manifestPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(
        `Tracked manifest ${manifestPath} is missing from the working tree; ` +
          'restore it or commit its removal before generating the package inventory.',
      );
    }
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    } catch (error) {
      if (workspaceDirs.has(dir)) {
        throw new Error(`Workspace manifest ${manifestPath} is not valid JSON: ${error.message}`);
      }
      // Non-workspace tracked manifests (templates, fixtures) may legitimately
      // not parse; they can never be published, so they are not inventoried.
      continue;
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

module.exports = { listPublishablePackages };

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
