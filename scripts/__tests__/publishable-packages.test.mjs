import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { listPublishablePackages, resolveWorkspaceDirs } = require('../lib/publishable-packages.cjs');

// The authoritative census as of the 2026-08-13 audit baseline (see
// docs/release-incident-2026-08-13.md). Adding or removing a public package is
// an intentional act: update this list in the same change.
const EXPECTED_PACKAGES = [
  '@a5c-ai/adapters',
  '@a5c-ai/adapters-cli',
  '@a5c-ai/adapters-codecs',
  '@a5c-ai/adapters-gateway',
  '@a5c-ai/adapters-harness-mock',
  '@a5c-ai/adapters-observability',
  '@a5c-ai/atlas',
  '@a5c-ai/babysitter',
  '@a5c-ai/babysitter-observer-dashboard',
  '@a5c-ai/babysitter-sdk',
  '@a5c-ai/channels-adapter',
  '@a5c-ai/comm-adapter',
  '@a5c-ai/config-adapter',
  '@a5c-ai/extensions-adapter',
  '@a5c-ai/genty',
  '@a5c-ai/genty-core',
  '@a5c-ai/genty-platform',
  '@a5c-ai/genty-runtime',
  '@a5c-ai/genty-tui',
  '@a5c-ai/genty-ui',
  '@a5c-ai/hooks-adapter-antigravity',
  '@a5c-ai/hooks-adapter-claude',
  '@a5c-ai/hooks-adapter-cli',
  '@a5c-ai/hooks-adapter-codex',
  '@a5c-ai/hooks-adapter-copilot',
  '@a5c-ai/hooks-adapter-core',
  '@a5c-ai/hooks-adapter-cursor',
  '@a5c-ai/hooks-adapter-gemini',
  '@a5c-ai/hooks-adapter-genty',
  '@a5c-ai/hooks-adapter-hermes',
  '@a5c-ai/hooks-adapter-oh-my-pi',
  '@a5c-ai/hooks-adapter-openclaw',
  '@a5c-ai/hooks-adapter-opencode',
  '@a5c-ai/hooks-adapter-pi',
  '@a5c-ai/kradle',
  '@a5c-ai/kradle-installer',
  '@a5c-ai/launch-adapter',
  '@a5c-ai/policy-adapter',
  '@a5c-ai/tasks-adapter',
  '@a5c-ai/tools-adapter',
  '@a5c-ai/transport-adapter',
  '@a5c-ai/triggers-adapter',
  '@a5c-ai/trust-core',
];

test('all 43 currently identified public packages appear exactly once in the generated inventory', () => {
  const inventory = listPublishablePackages(repoRoot);
  assert.equal(inventory.length, 43, 'inventory must contain exactly 43 public packages');
  const names = inventory.map((entry) => entry.name).sort();
  assert.deepEqual(names, [...EXPECTED_PACKAGES].sort());
  assert.equal(new Set(names).size, names.length, 'package names must be unique');
  const dirs = inventory.map((entry) => entry.dir);
  assert.equal(new Set(dirs).size, dirs.length, 'package directories must be unique');
});

test('every inventory entry is derived from a tracked public manifest', () => {
  const inventory = listPublishablePackages(repoRoot);
  for (const entry of inventory) {
    assert.notEqual(entry.manifest.private, true, `${entry.name} must not be private`);
    assert.equal(
      entry.manifest.publishConfig && entry.manifest.publishConfig.access,
      'public',
      `${entry.name} must declare publishConfig.access === "public"`,
    );
    assert.match(entry.dir, /^packages\//, `${entry.name} must live under packages/ (${entry.dir})`);
    assert.equal(typeof entry.version, 'string');
  }
});

test('known private workspaces are excluded from the inventory', () => {
  const inventory = listPublishablePackages(repoRoot);
  const dirs = new Set(inventory.map((entry) => entry.dir));
  assert.ok(!dirs.has('.'), 'the private monorepo root must not be inventoried');
  assert.ok(!dirs.has('packages/genty/web-app'), 'the private Genty web application must not be inventoried');
  const names = new Set(inventory.map((entry) => entry.name));
  assert.ok(!names.has('babysitter'), 'the private root manifest must not be inventoried');
});

// ---------------------------------------------------------------------------
// The inventory must be derivable WITHOUT a git repository.
//
// `.github/workflows/publish.yml` bundles the release tree with
// `tar --exclude=.git` and every publish job extracts that tarball without ever
// running `actions/checkout`. A `git ls-files` derivation exits 128 there
// ("fatal: not a git repository"), which crashed `npm run build:hooks-adapter`
// in `publish_staging_hooks_cli` on every branch release. The inventory is
// therefore derived from the root manifest's `workspaces` globs — one
// mechanism, identical results in both contexts, no fallback.
// ---------------------------------------------------------------------------

/** The pre-existing `git ls-files` derivation, kept here as the equivalence oracle. */
function gitTrackedPublicPackages() {
  const output = execFileSync(
    'git',
    ['ls-files', '--', 'package.json', '*/package.json', '**/package.json'],
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );
  const manifestPaths = [...new Set(output.split('\n').map((line) => line.trim()).filter(Boolean))].filter(
    (line) => line === 'package.json' || line.endsWith('/package.json'),
  );
  const names = [];
  for (const manifestPath of manifestPaths) {
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, manifestPath), 'utf8'));
    } catch {
      continue; // templates/fixtures that are not valid JSON can never be published
    }
    if (!manifest || typeof manifest !== 'object') continue;
    if (manifest.private === true) continue;
    if (!manifest.publishConfig || manifest.publishConfig.access !== 'public') continue;
    names.push(manifest.name);
  }
  return names.sort();
}

test('the workspace-glob inventory is IDENTICAL to the git-tracked derivation', () => {
  const inventoryNames = listPublishablePackages(repoRoot).map((entry) => entry.name).sort();
  assert.deepEqual(
    inventoryNames,
    gitTrackedPublicPackages(),
    'the tarball-safe derivation and the git-tracked derivation must agree exactly; a divergence ' +
      'means either an untracked public workspace exists or a tracked public manifest is outside ' +
      'the root workspaces globs',
  );
});

/**
 * A `.git`-less copy of this repository's manifest tree: exactly what the
 * publish jobs see after extracting `publish-source.tgz`.
 */
function extractedPublishWorkspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'publish-source-no-git-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const copy = (relativePath) => {
    const destination = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(repoRoot, relativePath), destination);
  };
  copy('package.json');
  for (const dir of resolveWorkspaceDirs(repoRoot)) copy(`${dir}/package.json`);
  assert.ok(!fs.existsSync(path.join(root, '.git')), 'the fixture must have no .git, like the tarball');
  return root;
}

test('the inventory is generated in an extracted publish workspace that has no .git at all', (t) => {
  const extracted = extractedPublishWorkspace(t);

  // The oracle: git really is unusable there, so a git-derived inventory would crash.
  const git = spawnSync('git', ['ls-files', '--', 'package.json'], { cwd: extracted, encoding: 'utf8' });
  assert.notEqual(git.status, 0, 'the fixture must be outside any git repository');

  const inventory = listPublishablePackages(extracted);
  assert.deepEqual(
    inventory.map((entry) => entry.name).sort(),
    listPublishablePackages(repoRoot).map((entry) => entry.name).sort(),
    'the extracted publication workspace must inventory exactly the same packages as the checkout',
  );
});

test('build:hooks-adapter derives its package list without a git repository', (t) => {
  const extracted = extractedPublishWorkspace(t);
  const { hooksBuildOrder } = require('../lib/release-matrix.cjs');
  assert.deepEqual(hooksBuildOrder(extracted), hooksBuildOrder(repoRoot));
});

test('an unsupported workspaces glob is a hard error, never a silently dropped package', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'publishable-glob-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'fixture-root', private: true, workspaces: ['packages/**/deep'] }),
  );
  assert.throws(() => listPublishablePackages(root), /Unsupported workspaces pattern/);
});
