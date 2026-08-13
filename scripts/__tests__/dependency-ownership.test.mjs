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

test('FIX-006 regression: every hooks package that imports Atlas owns it directly', () => {
  // Before FIX-006 this assertion was inverted: the check DETECTED that the
  // twelve harness leaves and the hooks CLI import @a5c-ai/atlas/catalog while
  // declaring only @a5c-ai/hooks-adapter-core, so Atlas arrived transitively
  // through hooks core and any non-hoisted consumer layout broke. The chosen
  // ownership model is "the importer declares it", so the assertion now guards
  // the fix. The non-hoisted install proof lives in
  // scripts/__tests__/hooks-atlas-ownership.test.mjs.
  const inventory = listPublishablePackages(repoRoot);
  const hooksPackages = inventory.filter((pkg) => pkg.dir.startsWith('packages/adapters/hooks/'));
  assert.ok(hooksPackages.length >= 14, 'the hooks family must be present in the inventory');

  const violations = collectDependencyOwnershipViolations({ repoRoot, packages: hooksPackages });
  assert.deepEqual(
    violations.map((violation) => `${violation.package}:${violation.dependency}`),
    [],
    'no hooks package may import an undeclared runtime dependency (FIX-006)',
  );
});

test('FIX-013/FIX-014/FIX-015 regression: the last tolerated ownership gaps are declared, not allowlisted', () => {
  // These three were surfaced by the FIX-011 ownership audit itself and were
  // the only remaining `dependencyOwnership` tolerances. Each is now declared
  // by the importing package under the contract its code actually expresses:
  //
  //   FIX-013 @a5c-ai/adapters-cli    -> react, ink        (hard dependencies:
  //           src/commands/tui.ts awaits both unguarded once the TUI loads)
  //   FIX-014 @a5c-ai/comm-adapter    -> @opentelemetry/api (hard dependency:
  //           src/run-handle-impl.ts imports `context`/`trace` statically; it
  //           previously arrived only through @a5c-ai/adapters-observability's
  //           hoisting — the exact FIX-002 defect class)
  //   FIX-015 @a5c-ai/genty-core,
  //           @a5c-ai/genty-platform  -> @vscode/ripgrep    (optional: the
  //           require is guarded and falls back to `rg` on PATH)
  const expectations = [
    { dir: ['packages', 'adapters', 'cli'], field: 'dependencies', deps: ['react', 'ink'] },
    { dir: ['packages', 'adapters', 'core'], field: 'dependencies', deps: ['@opentelemetry/api'] },
    { dir: ['packages', 'genty', 'core'], field: 'optionalDependencies', deps: ['@vscode/ripgrep'] },
    { dir: ['packages', 'genty', 'platform'], field: 'optionalDependencies', deps: ['@vscode/ripgrep'] },
  ];
  for (const expectation of expectations) {
    const manifestPath = path.join(repoRoot, ...expectation.dir, 'package.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    for (const dependency of expectation.deps) {
      assert.ok(
        typeof manifest[expectation.field]?.[dependency] === 'string',
        `${manifest.name} must declare ${dependency} in ${expectation.field}`,
      );
    }
  }

  const knownDefects = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'scripts', 'known-package-defects.json'), 'utf8'),
  );
  assert.deepEqual(
    knownDefects.dependencyOwnership,
    [],
    'the dependencyOwnership allowlist has reached its enforced end-state (empty) and must stay there: ' +
      'a new undeclared runtime import is a defect to fix, not an entry to add',
  );
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
