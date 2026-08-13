import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const verifierPath = path.join(repoRoot, 'scripts', 'verify-release-artifacts.mjs');
const fixturesRoot = path.join(repoRoot, 'scripts', '__tests__', 'fixtures', 'fix011');

const VERIFY_TIMEOUT_MS = 240000;

async function runVerifier(fixtureName, reportDir) {
  const fixtureDir = path.join(fixturesRoot, fixtureName);
  try {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [verifierPath, '--package-dir', fixtureDir, '--report-dir', reportDir],
      { cwd: repoRoot, timeout: VERIFY_TIMEOUT_MS },
    );
    return { code: 0, stdout, stderr };
  } catch (error) {
    if (typeof error.code !== 'number') {
      throw error;
    }
    return { code: error.code, stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
  }
}

function readReport(reportDir, packageName) {
  const reportPath = path.join(reportDir, `${packageName}.json`);
  assert.ok(fs.existsSync(reportPath), `expected machine-readable report at ${reportPath}`);
  return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
}

function makeReportDir(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `fix011-report-${label}-`));
}

test('healthy fixture passes the full packed-artifact verification', { timeout: VERIFY_TIMEOUT_MS }, async () => {
  const reportDir = makeReportDir('good');
  const result = await runVerifier('good-package', reportDir);
  assert.equal(result.code, 0, `expected exit 0, got ${result.code}\n${result.stdout}\n${result.stderr}`);
  const report = readReport(reportDir, 'fix011-good-package');
  assert.equal(report.status, 'passed');
  assert.equal(report.failures.length, 0);
  assert.equal(report.steps.pack.status, 'passed');
  assert.equal(report.steps.surfaces.status, 'passed');
  assert.equal(report.steps.shebangs.status, 'passed');
  assert.equal(report.steps.install.status, 'passed');
  assert.equal(report.steps.imports.status, 'passed');
  assert.equal(report.steps.typecheck.status, 'passed');
  assert.equal(report.steps.bins.status, 'passed');
  assert.ok(Array.isArray(report.tarball.files) && report.tarball.files.length >= 4, 'report must record the tarball inventory');
});

test('a missing direct runtime dependency fails in the fresh temporary consumer (FIX-002 class)', { timeout: VERIFY_TIMEOUT_MS }, async () => {
  const reportDir = makeReportDir('missing-dep');
  const result = await runVerifier('missing-runtime-dep', reportDir);
  assert.notEqual(result.code, 0, 'verifier must fail a package with an undeclared runtime dependency');
  const report = readReport(reportDir, 'fix011-missing-runtime-dep');
  assert.equal(report.status, 'failed');
  assert.equal(report.steps.imports.status, 'failed');
  assert.ok(
    report.failures.some((failure) => failure.includes('fix011-undeclared-runtime-dependency')),
    `failures must name the unresolvable dependency: ${JSON.stringify(report.failures)}`,
  );
});

test('a missing main/types/bin surface target fails at the tarball check', { timeout: VERIFY_TIMEOUT_MS }, async () => {
  const reportDir = makeReportDir('missing-surface');
  const result = await runVerifier('missing-surface-target', reportDir);
  assert.notEqual(result.code, 0, 'verifier must fail a package whose declared surfaces are absent from the tarball');
  const report = readReport(reportDir, 'fix011-missing-surface-target');
  assert.equal(report.status, 'failed');
  assert.equal(report.steps.surfaces.status, 'failed');
  for (const target of ['dist/index.js', 'dist/index.d.ts', 'dist/cli.js']) {
    assert.ok(
      report.failures.some((failure) => failure.includes(target)),
      `failures must name missing surface target ${target}: ${JSON.stringify(report.failures)}`,
    );
  }
});

test('the FIX-004 extensions replica (package.json + README only tarball) fails at the tarball check', { timeout: VERIFY_TIMEOUT_MS }, async () => {
  const reportDir = makeReportDir('fix004');
  const result = await runVerifier('fix004-extensions-replica', reportDir);
  assert.notEqual(result.code, 0, 'verifier must fail the FIX-004 replica');
  const report = readReport(reportDir, 'fix011-fix004-extensions-replica');
  assert.equal(report.status, 'failed');
  assert.equal(report.steps.surfaces.status, 'failed');
  assert.deepEqual(
    report.tarball.files.slice().sort(),
    ['README.md', 'package.json'],
    'the replica tarball must contain only package.json and README.md, matching the published 6.0.0 artifact',
  );
  assert.ok(
    report.failures.some((failure) => failure.includes('dist/extensions-adapter.js')),
    'failures must include the missing compatibility bin target',
  );
});

test('the package-specific verify:release gate is invoked by the generic verifier (FIX-004 wiring)', { timeout: VERIFY_TIMEOUT_MS }, async () => {
  const reportDir = makeReportDir('verify-release');
  const result = await runVerifier('failing-verify-release', reportDir);
  assert.notEqual(result.code, 0, 'verifier must fail a package whose verify:release gate rejects the artifact');
  const report = readReport(reportDir, 'fix011-failing-verify-release');
  assert.equal(report.status, 'failed');
  assert.equal(report.steps.surfaces.status, 'passed', 'the packed surfaces themselves are healthy');
  assert.equal(report.steps.verifyRelease.status, 'failed');
  assert.ok(
    report.failures.some((failure) => failure.includes('package-specific release gate rejected this artifact')),
    `failures must surface the package-specific gate output: ${JSON.stringify(report.failures)}`,
  );
});

test('a package without a verify:release gate records the step as skipped', { timeout: VERIFY_TIMEOUT_MS }, async () => {
  const reportDir = makeReportDir('no-verify-release');
  const result = await runVerifier('good-package', reportDir);
  assert.equal(result.code, 0, `expected exit 0, got ${result.code}\n${result.stdout}\n${result.stderr}`);
  const report = readReport(reportDir, 'fix011-good-package');
  assert.equal(report.steps.verifyRelease.status, 'skipped');
  assert.match(report.steps.verifyRelease.reason, /no verify:release script/);
});

test('a package that only works via the repository root node_modules fails in the temporary consumer', { timeout: VERIFY_TIMEOUT_MS }, async () => {
  const fixtureDir = path.join(fixturesRoot, 'hoist-only');
  // Prove the masking effect first: inside the repository the undeclared
  // dependency resolves through the root node_modules.
  const resolvedInsideRepo = require.resolve('typescript', { paths: [fixtureDir] });
  assert.ok(resolvedInsideRepo.includes(`${path.sep}node_modules${path.sep}typescript${path.sep}`));

  const reportDir = makeReportDir('hoist-only');
  const result = await runVerifier('hoist-only', reportDir);
  assert.notEqual(result.code, 0, 'verifier must fail a package that relies on workspace hoisting');
  const report = readReport(reportDir, 'fix011-hoist-only');
  assert.equal(report.status, 'failed');
  assert.equal(report.steps.imports.status, 'failed');
  assert.ok(
    report.failures.some((failure) => failure.includes('typescript')),
    `failures must name the hoisted-only dependency: ${JSON.stringify(report.failures)}`,
  );
});

// A bin-only metapackage (@a5c-ai/babysitter: no main, no module, no exports,
// files = bin/ + README.md) has NO importable root. The gate used to synthesize
// one anyway, so Node fell back to legacy main resolution, looked for an
// index.js the package deliberately never ships, and failed the release with
// ERR_MODULE_NOT_FOUND. Because scripts/verify-published-release.mjs shares
// runtimeImportSpecs, that false positive also blocked channel promotion.
test('a bin-only metapackage passes: no importable root means no synthesized root import', { timeout: VERIFY_TIMEOUT_MS }, async () => {
  const reportDir = makeReportDir('bin-only');
  const result = await runVerifier('bin-only-metapackage', reportDir);
  assert.equal(result.code, 0, `expected exit 0, got ${result.code}\n${result.stdout}\n${result.stderr}`);
  const report = readReport(reportDir, 'fix011-bin-only-metapackage');
  assert.equal(report.status, 'passed');
  assert.equal(report.steps.imports.status, 'skipped', 'a bin-only package has nothing to import');
  assert.match(report.steps.imports.reason, /no importable root/);
  assert.equal(report.steps.bins.status, 'passed', 'the bin IS the consumer surface and must be smoked');
  assert.ok(
    JSON.stringify(report.steps.bins).includes('fix011-bin-only'),
    `the declared bin must be exercised: ${JSON.stringify(report.steps.bins)}`,
  );
});

// Dropping the synthesized root import must not turn "nothing to check" into a
// pass. A package with neither an importable root nor a bin is unverifiable and
// unpublishable, and the gate must say so instead of reporting zero checks.
test('a package with no importable root AND no bin fails loudly instead of passing vacuously', { timeout: VERIFY_TIMEOUT_MS }, async () => {
  const reportDir = makeReportDir('no-surface');
  const result = await runVerifier('no-consumer-surface', reportDir);
  assert.notEqual(result.code, 0, 'verifier must fail a package with no consumer surface at all');
  const report = readReport(reportDir, 'fix011-no-consumer-surface');
  assert.equal(report.status, 'failed');
  assert.ok(
    report.failures.some((failure) => /no consumer surface/i.test(failure)),
    `failures must name the missing consumer surface: ${JSON.stringify(report.failures)}`,
  );
});

test('a package that declares a bundler runtime skips ONLY the Node import step', { timeout: VERIFY_TIMEOUT_MS }, async () => {
  // React Native component libraries statically import react-native, whose own
  // entrypoint is Flow source. No publishing change makes that evaluable by
  // bare Node, so requiring a Node root import is the same false positive class
  // as synthesizing one for a bin-only metapackage. The escape is a per-package
  // declaration IN THE MANIFEST (the standard "react-native" resolution field),
  // never a name-keyed allowlist, and it must narrow exactly one step.
  const reportDir = makeReportDir('bundler-runtime');
  const { code } = await runVerifier('bundler-runtime', reportDir);
  assert.equal(code, 0);
  const report = readReport(reportDir, 'fix011-bundler-runtime');
  assert.equal(report.status, 'passed');

  const imports = report.steps.imports;
  assert.equal(imports.status, 'skipped');
  assert.match(imports.reason, /react-native/);
  assert.match(imports.reason, /bare Node cannot evaluate it/);

  // Everything else still had to run and pass.
  for (const stepName of ['pack', 'surfaces', 'install', 'typecheck']) {
    const step = report.steps[stepName];
    assert.ok(step, `the ${stepName} step must still run for a bundler-runtime package`);
    assert.equal(step.status, 'passed', `${stepName} must still be enforced`);
  }
});

test('the bundler-runtime escape requires the manifest declaration', { timeout: VERIFY_TIMEOUT_MS }, async () => {
  // Same fixture without the declaration: the verifier must fail on the Node
  // import rather than guessing that the package is bundler-only.
  const { bundlerOnlyRuntime } = require(path.join(repoRoot, 'scripts', 'lib', 'package-surface.cjs'));
  const manifest = JSON.parse(
    fs.readFileSync(path.join(fixturesRoot, 'bundler-runtime', 'package.json'), 'utf8'),
  );
  assert.deepEqual(bundlerOnlyRuntime(manifest), { field: 'react-native', target: 'index.js' });
  const { ['react-native']: _declared, ...withoutDeclaration } = manifest;
  assert.equal(bundlerOnlyRuntime(withoutDeclaration), null);
});

test('verifier writes a machine-readable summary covering every verified package', { timeout: VERIFY_TIMEOUT_MS }, async () => {
  const reportDir = makeReportDir('summary');
  await runVerifier('good-package', reportDir);
  const summaryPath = path.join(reportDir, 'summary.json');
  assert.ok(fs.existsSync(summaryPath), 'summary.json must be written');
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  assert.equal(summary.total, 1);
  assert.equal(summary.passed, 1);
  assert.equal(summary.failed, 0);
  assert.deepEqual(summary.results.map((entry) => entry.package), ['fix011-good-package']);
});

test('verifier --list prints the 43-package inventory without verifying anything', async () => {
  const { stdout } = await execFileAsync(process.execPath, [verifierPath, '--list'], {
    cwd: repoRoot,
    timeout: 60000,
  });
  const inventory = JSON.parse(stdout);
  assert.equal(inventory.length, 43);
  assert.ok(inventory.some((entry) => entry.name === '@a5c-ai/tasks-adapter'));
  assert.ok(inventory.some((entry) => entry.name === '@a5c-ai/hooks-adapter-genty'));
});

test('the release path runs the packed-artifact gate with no tolerance left', () => {
  // scripts/known-package-defects.json `packedArtifact` is empty and its
  // enforced end-state is empty, so `allow_known_failures: 'true'` in the
  // release path was a latent tolerance: it would have silently absorbed any
  // future entry. The release call now demands a fully clean matrix.
  const { parse: parseYaml } = require('yaml');
  const knownDefects = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'scripts', 'known-package-defects.json'), 'utf8'),
  );
  assert.deepEqual(
    knownDefects.packedArtifact,
    [],
    'the packedArtifact allowlist must stay at its enforced end-state (empty)',
  );

  const publishWorkflow = parseYaml(
    fs.readFileSync(path.join(repoRoot, '.github', 'workflows', 'publish.yml'), 'utf8'),
  );
  const job = publishWorkflow.jobs.verify_release_artifacts;
  assert.ok(job, 'publish.yml must call the release-artifact verifier');
  assert.equal(job.uses, './.github/workflows/release-artifact-verifier.yml');
  assert.equal(
    String(job.with.allow_known_failures),
    'false',
    'the release path must not tolerate known packed-artifact failures while the allowlist is empty',
  );
});
