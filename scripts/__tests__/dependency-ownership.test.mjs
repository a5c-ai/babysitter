import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const {
  scanPackageDependencyOwnership,
  collectDependencyOwnershipViolations,
  matchKnownDefects,
} = require('../lib/dependency-ownership.cjs');
const { listPublishablePackages } = require('../lib/publishable-packages.cjs');

const NPM_NAME_PATTERN = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i;

function makeFixturePackage(structure) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fix011-ownership-'));
  for (const [relPath, contents] of Object.entries(structure)) {
    const full = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents, 'utf8');
  }
  return dir;
}

test('flags an undeclared static runtime import and ignores type-only/test/declared imports', () => {
  const dir = makeFixturePackage({
    'package.json': JSON.stringify({
      name: 'fix011-ownership-fixture',
      version: '1.0.0',
      dependencies: { 'declared-dep': '^1.0.0' },
    }),
    'src/index.ts': [
      "import { helper } from 'undeclared-dep';",
      "import type { OnlyTypes } from 'undeclared-type-only-dep';",
      "import { ok } from 'declared-dep';",
      "import { local } from './local.js';",
      "import fs from 'node:fs';",
      "import path from 'path';",
      'export { helper, ok, local };',
    ].join('\n'),
    'src/feature.test.ts': "import { anything } from 'test-only-undeclared-dep';",
    'src/__tests__/more.ts': "import { anything } from 'test-dir-undeclared-dep';",
  });

  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    const violations = scanPackageDependencyOwnership({ packageDir: dir, manifest });
    const flagged = violations.map((violation) => violation.dependency).sort();
    assert.deepEqual(flagged, ['undeclared-dep']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('accepts optionalDependencies and peerDependencies as ownership', () => {
  const dir = makeFixturePackage({
    'package.json': JSON.stringify({
      name: 'fix011-ownership-optional-fixture',
      version: '1.0.0',
      optionalDependencies: { 'optional-dep': '^1.0.0' },
      peerDependencies: { 'peer-dep': '^1.0.0' },
    }),
    'src/index.ts': [
      "import { a } from 'optional-dep';",
      "import { b } from 'peer-dep';",
      'export { a, b };',
    ].join('\n'),
  });

  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    const violations = scanPackageDependencyOwnership({ packageDir: dir, manifest });
    assert.deepEqual(violations, []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('FIX-002 regression: the tasks adapter owns its MCP SDK runtime dependency', () => {
  // Before FIX-002 this assertion was inverted: the check DETECTED that
  // @a5c-ai/tasks-adapter imports @modelcontextprotocol/sdk (src/mcp/server.ts,
  // src/mcp/http-transport.ts, re-exported from the package root) without
  // declaring it, so the published tarball was unusable in a clean consumer.
  // The ownership must never regress, so the assertion now guards the fix.
  const manifest = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'packages', 'adapters', 'tasks', 'package.json'), 'utf8'),
  );
  assert.ok(
    typeof manifest.dependencies?.['@modelcontextprotocol/sdk'] === 'string',
    '@a5c-ai/tasks-adapter must declare @modelcontextprotocol/sdk in its direct dependencies (FIX-002)',
  );

  const inventory = listPublishablePackages(repoRoot);
  const violations = collectDependencyOwnershipViolations({ repoRoot, packages: inventory });
  const tasksViolations = violations.filter(
    (violation) => violation.package === '@a5c-ai/tasks-adapter',
  );
  assert.deepEqual(
    tasksViolations.map((violation) => violation.dependency),
    [],
    '@a5c-ai/tasks-adapter must not import any undeclared runtime dependency (FIX-002)',
  );
});

test('detects the FIX-006 undeclared Atlas imports in hooks leaves and CLI in the real repository', () => {
  const inventory = listPublishablePackages(repoRoot);
  const violations = collectDependencyOwnershipViolations({ repoRoot, packages: inventory });
  for (const pkg of ['@a5c-ai/hooks-adapter-claude', '@a5c-ai/hooks-adapter-cli']) {
    const atlasViolations = violations.filter(
      (violation) => violation.package === pkg && violation.dependency === '@a5c-ai/atlas',
    );
    assert.ok(
      atlasViolations.length > 0,
      `the dependency-ownership check must detect that ${pkg} imports @a5c-ai/atlas without declaring it (FIX-006)`,
    );
  }
});

test('reports only well-formed package names (no template-literal or path-alias noise)', () => {
  const inventory = listPublishablePackages(repoRoot);
  const violations = collectDependencyOwnershipViolations({ repoRoot, packages: inventory });
  for (const violation of violations) {
    assert.match(
      violation.dependency,
      NPM_NAME_PATTERN,
      `violation dependency ${JSON.stringify(violation.dependency)} must be a valid npm package name`,
    );
  }
});

test('matchKnownDefects separates unexpected violations from stale allowlist entries', () => {
  const violations = [
    { package: 'pkg-a', dependency: 'dep-1', files: ['a.ts'] },
    { package: 'pkg-b', dependency: 'dep-2', files: ['b.ts'] },
  ];
  const known = [
    { fixId: 'FIX-002', package: 'pkg-a', dependency: 'dep-1' },
    { fixId: 'FIX-006', package: 'pkg-c', dependency: 'dep-3' },
  ];
  const result = matchKnownDefects(violations, known);
  assert.deepEqual(
    result.unexpected.map((violation) => `${violation.package}:${violation.dependency}`),
    ['pkg-b:dep-2'],
  );
  assert.deepEqual(
    result.stale.map((entry) => `${entry.fixId}:${entry.package}:${entry.dependency}`),
    ['FIX-006:pkg-c:dep-3'],
  );
  assert.deepEqual(
    result.tolerated.map((violation) => `${violation.package}:${violation.dependency}`),
    ['pkg-a:dep-1'],
  );
});

test('every known dependency-ownership defect entry still reproduces (no stale allowlist entries)', () => {
  const knownDefects = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'scripts', 'known-package-defects.json'), 'utf8'),
  );
  const inventory = listPublishablePackages(repoRoot);
  const violations = collectDependencyOwnershipViolations({ repoRoot, packages: inventory });
  const { unexpected, stale } = matchKnownDefects(violations, knownDefects.dependencyOwnership);
  assert.deepEqual(
    stale.map((entry) => `${entry.fixId}:${entry.package}:${entry.dependency}`),
    [],
    'stale allowlist entries must be removed as their fixes land',
  );
  assert.deepEqual(
    unexpected.map((violation) => `${violation.package}:${violation.dependency}`),
    [],
    'new dependency-ownership violations must be fixed, not accumulated',
  );
  for (const entry of knownDefects.dependencyOwnership) {
    assert.match(entry.fixId, /^FIX-\d+$/, 'every allowlist entry must reference its FIX id');
  }
});
