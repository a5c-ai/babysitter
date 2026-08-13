import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { listPublishablePackages } = require('../lib/publishable-packages.cjs');

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
