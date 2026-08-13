/**
 * FIX-006: hooks packages own their Atlas imports directly.
 *
 * Every harness leaf (`src/adapter.ts` under `packages/adapters/hooks`) and the
 * hooks CLI (`src/cli/adapter-loader.ts`) resolve `@a5c-ai/atlas/catalog`
 * at runtime while declaring only `@a5c-ai/hooks-adapter-core`. Inside the
 * workspace — and in a hoisted `node_modules` — Atlas arrives transitively
 * through hooks core, which masks the defect: the moment hooks core stops
 * depending on Atlas, or a consumer installs with a non-hoisted layout, every
 * leaf fails to resolve its own import.
 *
 * The chosen ownership model (one model, no mixing) is: THE IMPORTER DECLARES
 * IT. This suite proves that model three ways:
 *
 *   1. statically, for every hooks package (the model is consistent and the
 *      Atlas pin follows the family's exact lockstep convention);
 *   2. against the tracked known-defects allowlist (no FIX-006 tolerance left);
 *   3. dynamically, by installing a representative leaf's exact tarball into a
 *      fresh temporary consumer OUTSIDE the repository with
 *      `--install-strategy=nested` (no hoisting at all) and then surgically
 *      removing Atlas from hooks core's nested dependency tree — the leaf must
 *      still import, because it resolves Atlas through its OWN dependency.
 *
 * Coverage split (deliberate, to keep the PR gate fast): the dynamic proof runs
 * here for ONE representative leaf and for the hooks CLI, plus
 * `@a5c-ai/hooks-adapter-genty` in
 * scripts/__tests__/hooks-adapter-genty-packed.test.mjs. The FULL twelve-leaf
 * non-hoisted matrix runs in the release verifier
 * (`npm run verify:release-artifacts`), which derives the non-hoisted package
 * set from scripts/lib/release-matrix.cjs — asserted below so a leaf can never
 * drop out of that matrix silently.
 *
 * Read-only with respect to the registry: it installs, never publishes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { listGroup, nonHoistedVerificationPackages } = require('../lib/release-matrix.cjs');
const { listPublishablePackages } = require('../lib/publishable-packages.cjs');
const { scanPackageDependencyOwnership } = require('../lib/dependency-ownership.cjs');

const ATLAS = '@a5c-ai/atlas';
const HOOKS_CORE = '@a5c-ai/hooks-adapter-core';
const HOOKS_CLI = '@a5c-ai/hooks-adapter-cli';
const HOOKS_DIR_PREFIX = 'packages/adapters/hooks/';
// Imports Atlas from both src/adapter.ts and src/mappings.ts, so it exercises
// the whole leaf shape rather than a single import site.
const REPRESENTATIVE_LEAF = '@a5c-ai/hooks-adapter-claude';

function hooksPackages() {
  return listPublishablePackages(repoRoot).filter((pkg) => pkg.dir.startsWith(HOOKS_DIR_PREFIX));
}

function manifestOf(packageName) {
  const pkg = listPublishablePackages(repoRoot).find((entry) => entry.name === packageName);
  assert.ok(pkg, `${packageName} must be a public package in the authoritative inventory`);
  return pkg.manifest;
}

/**
 * Does this package resolve Atlas at runtime from its own shipped sources?
 * Reuses the shared ownership scanner (non-type imports, shipped sources only)
 * by asking it what it would report if the package declared nothing.
 */
function importsAtlasAtRuntime(pkg) {
  const strippedManifest = { ...pkg.manifest, dependencies: {}, optionalDependencies: {}, peerDependencies: {} };
  const violations = scanPackageDependencyOwnership({
    packageDir: path.join(repoRoot, pkg.dir),
    manifest: strippedManifest,
    repoRoot,
  });
  return violations.some((violation) => violation.dependency === ATLAS);
}

/**
 * Every installed copy of Atlas anywhere in a consumer's node_modules tree,
 * as paths relative to the consumer root.
 */
function findAtlasInstallations(nodeModulesDir, found = [], consumerRoot = path.dirname(nodeModulesDir)) {
  if (!fs.existsSync(nodeModulesDir)) return found;
  for (const entry of fs.readdirSync(nodeModulesDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const scoped = entry.name.startsWith('@');
    const children = scoped
      ? fs
          .readdirSync(path.join(nodeModulesDir, entry.name), { withFileTypes: true })
          .filter((child) => child.isDirectory())
          .map((child) => path.join(entry.name, child.name))
      : [entry.name];
    for (const child of children) {
      const packageDir = path.join(nodeModulesDir, child);
      if (child.split(path.sep).join('/') === ATLAS) {
        found.push(path.relative(consumerRoot, packageDir));
      }
      findAtlasInstallations(path.join(packageDir, 'node_modules'), found, consumerRoot);
    }
  }
  return found;
}

test('one ownership model: every hooks package that imports Atlas declares it directly', () => {
  const packages = hooksPackages();
  const importers = packages.filter(importsAtlasAtRuntime).map((pkg) => pkg.name).sort();

  const expectedImporters = [
    ...listGroup(repoRoot, 'hooks-leaves').map((entry) => entry.name),
    HOOKS_CORE,
    HOOKS_CLI,
  ].sort();
  assert.deepEqual(
    importers,
    expectedImporters,
    'the twelve harness leaves, hooks core and the hooks CLI all resolve @a5c-ai/atlas directly; ' +
      'if that changed, the ownership model changed and this suite must be revisited',
  );

  const atlasVersion = manifestOf(ATLAS).version;
  for (const name of importers) {
    const manifest = manifestOf(name);
    assert.equal(
      manifest.dependencies?.[ATLAS],
      atlasVersion,
      `${name} imports ${ATLAS} at runtime and must declare it in dependencies at the exact ` +
        `lockstep version ${atlasVersion} (FIX-006)`,
    );
    assert.equal(
      manifest.devDependencies?.[ATLAS],
      undefined,
      `${name} must not declare ${ATLAS} as a devDependency: consumers do not install devDependencies`,
    );
  }
});

test('no hooks package imports any undeclared runtime dependency', () => {
  const violations = hooksPackages().flatMap((pkg) =>
    scanPackageDependencyOwnership({
      packageDir: path.join(repoRoot, pkg.dir),
      manifest: pkg.manifest,
      repoRoot,
    }),
  );
  assert.deepEqual(
    violations.map((violation) => `${violation.package} -> ${violation.dependency}`),
    [],
    'the generic dependency-ownership check must pass with zero violations for hooks packages (FIX-006)',
  );
});

test('the FIX-006 dependency-ownership tolerances are gone from the tracked allowlist', () => {
  const knownDefects = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'scripts', 'known-package-defects.json'), 'utf8'),
  );
  const remaining = (knownDefects.dependencyOwnership ?? [])
    .filter((entry) => entry.fixId === 'FIX-006')
    .map((entry) => `${entry.package}:${entry.dependency}`);
  assert.deepEqual(remaining, [], 'FIX-006 has landed: its allowlist entries must be deleted');
});

test('the release verifier runs the FULL twelve-leaf matrix with a non-hoisted layout', () => {
  const leaves = listGroup(repoRoot, 'hooks-leaves').map((entry) => entry.name).sort();
  assert.equal(leaves.length, 12, 'the hooks-leaves group must resolve to the twelve public leaves');
  assert.deepEqual(
    nonHoistedVerificationPackages(repoRoot),
    [...leaves, HOOKS_CLI].sort(),
    'every hooks leaf and the hooks CLI must be verified from an isolated tarball under a ' +
      'non-hoisted install layout',
  );

  // The derivation is only worth anything if the verifier consumes it.
  const verifier = fs.readFileSync(path.join(repoRoot, 'scripts', 'verify-release-artifacts.mjs'), 'utf8');
  assert.match(
    verifier,
    /nonHoistedVerificationPackages/,
    'scripts/verify-release-artifacts.mjs must derive its non-hoisted package set, not hand-list it',
  );
  assert.match(
    verifier,
    /--install-strategy=/,
    'the verifier must install non-hoisted packages with an explicit npm install strategy',
  );
});

test(
  'a hooks leaf resolves Atlas through its OWN dependency in a non-hoisted clean consumer',
  { timeout: 10 * 60 * 1000 },
  (t) => {
    const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fix006-nested-'));
    t.after(() => fs.rmSync(reportDir, { recursive: true, force: true }));

    const result = spawnSync(
      process.execPath,
      [
        'scripts/verify-release-artifacts.mjs',
        '--package',
        REPRESENTATIVE_LEAF,
        '--report-dir',
        reportDir,
        '--keep-temp',
      ],
      { cwd: repoRoot, encoding: 'utf8' },
    );
    assert.equal(
      result.status,
      0,
      `packed verification of ${REPRESENTATIVE_LEAF} must pass\n${result.stdout}\n${result.stderr}`,
    );

    const report = JSON.parse(
      fs.readFileSync(path.join(reportDir, 'a5c-ai__hooks-adapter-claude.json'), 'utf8'),
    );
    t.after(() => {
      if (report.tempDir) fs.rmSync(path.dirname(report.tempDir), { recursive: true, force: true });
    });
    assert.equal(report.status, 'passed');
    assert.equal(
      report.steps.install.installStrategy,
      'nested',
      'the leaf must be installed with a non-hoisted layout so transitive Atlas cannot mask the import',
    );

    const consumerDir = report.consumerDir;
    assert.ok(consumerDir && fs.existsSync(consumerDir), 'the verifier must retain the clean consumer');
    const leafDir = path.join(consumerDir, 'node_modules', REPRESENTATIVE_LEAF);
    const ownAtlas = path.join(leafDir, 'node_modules', ATLAS);
    const coreDir = path.join(leafDir, 'node_modules', HOOKS_CORE);

    assert.ok(fs.existsSync(coreDir), 'hooks core must be installed as a nested dependency of the leaf');
    assert.ok(fs.existsSync(ownAtlas), `${REPRESENTATIVE_LEAF} must install its OWN copy of ${ATLAS}`);
    assert.ok(
      !fs.existsSync(path.join(consumerDir, 'node_modules', ATLAS)),
      'nothing may be hoisted to the consumer root, or the proof is vacuous',
    );

    // Acceptance criterion: removing Atlas from hooks core's dependency tree
    // does not break leaf resolution. Under the chosen model the ONLY Atlas
    // copy in the installed layout is the one the leaf itself declared — hooks
    // core contributes none, so it has nothing left to take away.
    assert.deepEqual(
      findAtlasInstallations(path.join(consumerDir, 'node_modules')),
      [path.relative(consumerDir, ownAtlas)],
      'the leaf-owned copy must be the only Atlas in the tree: hooks core supplies nothing',
    );

    const importLeaf = () =>
      spawnSync(
        process.execPath,
        ['-e', `require(${JSON.stringify(REPRESENTATIVE_LEAF)}).createAdapter;`],
        { cwd: consumerDir, encoding: 'utf8' },
      );

    assert.equal(importLeaf().status, 0, 'the leaf must import from its packed tarball');

    // Reproduce the PRE-FIX arrangement inside the same layout: Atlas reachable
    // only through hooks core, never owned by the leaf. Node walks up from the
    // leaf, and hooks core's own node_modules is not on that path, so the leaf
    // must fail — which is exactly what the undeclared import shipped.
    const transitiveOnlyAtlas = path.join(coreDir, 'node_modules', ATLAS);
    fs.mkdirSync(path.dirname(transitiveOnlyAtlas), { recursive: true });
    fs.renameSync(ownAtlas, transitiveOnlyAtlas);
    const transitiveOnly = importLeaf();
    assert.notEqual(
      transitiveOnly.status,
      0,
      'a leaf that only reaches Atlas through hooks core must fail in a non-hoisted consumer',
    );
    assert.match(
      transitiveOnly.stderr,
      /@a5c-ai\/atlas/,
      'the pre-fix failure must name the unresolvable Atlas package',
    );

    // ...and restoring ownership — nothing else — makes it work again.
    fs.renameSync(transitiveOnlyAtlas, ownAtlas);
    assert.equal(
      importLeaf().status,
      0,
      'the leaf-owned Atlas copy is what makes the non-hoisted install work',
    );
  },
);

test(
  'the hooks CLI installs, imports and runs from its packed tarball in a non-hoisted consumer',
  { timeout: 10 * 60 * 1000 },
  (t) => {
    const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fix006-cli-'));
    t.after(() => fs.rmSync(reportDir, { recursive: true, force: true }));

    const result = spawnSync(
      process.execPath,
      ['scripts/verify-release-artifacts.mjs', '--package', HOOKS_CLI, '--report-dir', reportDir, '--keep-temp'],
      { cwd: repoRoot, encoding: 'utf8' },
    );
    assert.equal(
      result.status,
      0,
      `packed verification of ${HOOKS_CLI} must pass\n${result.stdout}\n${result.stderr}`,
    );

    const report = JSON.parse(fs.readFileSync(path.join(reportDir, 'a5c-ai__hooks-adapter-cli.json'), 'utf8'));
    t.after(() => {
      if (report.tempDir) fs.rmSync(path.dirname(report.tempDir), { recursive: true, force: true });
    });
    assert.equal(report.status, 'passed');
    assert.deepEqual(report.failures, []);
    assert.equal(report.steps.install.installStrategy, 'nested');
    // The CLI resolves the Atlas catalog in src/cli/adapter-loader.ts, and its
    // adapter leaves are installed as registry dependencies underneath it: the
    // one Atlas copy in the layout must be the CLI's own declaration.
    assert.deepEqual(
      findAtlasInstallations(path.join(report.consumerDir, 'node_modules')),
      [path.join('node_modules', HOOKS_CLI, 'node_modules', ATLAS)],
      'the CLI must own the Atlas copy it resolves in a non-hoisted consumer',
    );
    assert.deepEqual(report.steps.imports.importedSubpaths, [HOOKS_CLI]);
    // Both documented bins are executed from the clean consumer by the verifier.
    assert.deepEqual(
      report.steps.bins.smoked.map((entry) => entry.bin).sort(),
      ['a5c-hooks-adapter', 'adapters-hooks'],
    );
  },
);
