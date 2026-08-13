#!/usr/bin/env node
/**
 * Full packed-artifact release verifier (FIX-011).
 *
 * Verifies every public package as a CLEAN CONSUMER ARTIFACT — the exact
 * tarball intended for publication, never the workspace:
 *
 *   1. runs the package's explicit build step (dependency-ordered);
 *   2. packs the exact tarball (`npm pack --ignore-scripts`, mirroring the
 *      lifecycle-disabled publish helper);
 *   3. verifies every `main`, `module`, `types`, `exports`, and `bin` target
 *      exists in the tarball;
 *   4. checks bin shebangs in the extracted tarball;
 *   5. installs the tarball into a fresh temporary npm project outside the
 *      repository (no workspace links; lifecycle scripts disabled by default —
 *      packages that genuinely need install scripts must be allowlisted in
 *      scripts/known-package-defects.json `installScripts`). Packages listed by
 *      `nonHoistedVerificationPackages` (scripts/lib/release-matrix.cjs) are
 *      installed with `--install-strategy=nested` so a hoisted `node_modules`
 *      cannot supply an undeclared dependency (FIX-006);
 *   6. imports the package root and every exported runtime subpath;
 *   7. typechecks a minimal consumer against the exported declarations;
 *   8. invokes each bin with a harmless allowlisted argument (`--help`);
 *   9. runs the package's own `verify:release` gate when it declares one (the
 *      same package-specific gate scripts/publish-package-from-tag.mjs runs
 *      before publishing);
 *  10. records a machine-readable per-package report plus a summary.
 *
 * This is the RELEASE gate: it is expected to be slower than the fast PR gate
 * (`npm run guard:packages`) and may legitimately fail on packages with known,
 * tracked artifact defects (see `packedArtifact` in
 * scripts/known-package-defects.json) until their fixes land.
 *
 * Usage:
 *   node scripts/verify-release-artifacts.mjs                  # full matrix
 *   node scripts/verify-release-artifacts.mjs --package @a5c-ai/atlas
 *   node scripts/verify-release-artifacts.mjs --package-dir path/to/pkg
 *   node scripts/verify-release-artifacts.mjs --list
 * Options:
 *   --package <name>         verify one inventory package (repeatable)
 *   --package-dir <path>     verify a package directory outside the inventory
 *                            (used by fixture tests; repeatable)
 *   --report-dir <dir>       report output dir (default artifacts/release-verifier)
 *   --skip-build             skip the build step (trust existing build output)
 *   --install-strategy <s>   force the npm install strategy of the temporary
 *                            consumer for every verified package (`nested`
 *                            disables hoisting entirely); by default only the
 *                            derived non-hoisted set uses `nested`
 *   --allow-known-failures   tolerate packages listed under `packedArtifact`
 *                            in scripts/known-package-defects.json; a listed
 *                            package that PASSES fails the run as stale
 *   --keep-temp              keep temporary consumers for debugging
 *   --list                   print the authoritative inventory JSON and exit
 *
 * Never publishes, never mutates the registry. Installing a tarball may fetch
 * its (declared) dependencies from the npm registry read-only.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { listPublishablePackages } = require('./lib/publishable-packages.cjs');
const { nonHoistedVerificationPackages } = require('./lib/release-matrix.cjs');
// Shared with scripts/verify-published-release.mjs (FIX-010) so the
// pre-publication tarball gate and the post-publication registry gate check
// exactly the same consumer surface.
const {
  binEntries,
  binSmokeArgs,
  collectSurfaceTargets,
  consumerSurfaceProblem,
  normalizeTarget,
  runtimeImportSpecs,
  safeReportName,
} = require('./lib/package-surface.cjs');

const KNOWN_DEFECTS_PATH = path.join(repoRoot, 'scripts', 'known-package-defects.json');
const DEFAULT_REPORT_DIR = path.join('artifacts', 'release-verifier');
const EXEC_TIMEOUT_MS = 15 * 60 * 1000;
const BIN_TIMEOUT_MS = 2 * 60 * 1000;

// npm's supported node_modules layouts. `nested` is the FIX-006 ownership
// layout: nothing is hoisted, so every package resolves only what it declares.
const INSTALL_STRATEGIES = new Set(['hoisted', 'nested', 'shallow', 'linked']);

function log(message) {
  process.stderr.write(`${message}\n`);
}

function parseArgs(argv) {
  const options = {
    packages: [],
    packageDirs: [],
    reportDir: DEFAULT_REPORT_DIR,
    installStrategy: null,
    skipBuild: false,
    allowKnownFailures: false,
    keepTemp: false,
    list: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--package':
        options.packages.push(requireValue(argv, ++i, arg));
        break;
      case '--package-dir':
        options.packageDirs.push(requireValue(argv, ++i, arg));
        break;
      case '--report-dir':
        options.reportDir = requireValue(argv, ++i, arg);
        break;
      case '--install-strategy': {
        const strategy = requireValue(argv, ++i, arg);
        if (!INSTALL_STRATEGIES.has(strategy)) {
          throw new Error(
            `--install-strategy must be one of ${[...INSTALL_STRATEGIES].join(', ')}; got ${strategy}`,
          );
        }
        options.installStrategy = strategy;
        break;
      }
      case '--skip-build':
        options.skipBuild = true;
        break;
      case '--allow-known-failures':
        options.allowKnownFailures = true;
        break;
      case '--keep-temp':
        options.keepTemp = true;
        break;
      case '--list':
        options.list = true;
        break;
      case '--help':
      case '-h':
        process.stdout.write('See the header comment of scripts/verify-release-artifacts.mjs for usage.\n');
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function exec(command, args, { cwd, timeout = EXEC_TIMEOUT_MS, env } = {}) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
    timeout,
    maxBuffer: 64 * 1024 * 1024,
    env: env ?? process.env,
  });
}

function execErrorText(error) {
  const parts = [error.stderr, error.stdout, error.message]
    .map((part) => (part == null ? '' : String(part).trim()))
    .filter(Boolean);
  return parts.join('\n').slice(0, 4000);
}

function topoSortInventory(inventory, selectedNames) {
  const byName = new Map(inventory.map((pkg) => [pkg.name, pkg]));
  const closure = new Set();
  const visit = (name) => {
    if (closure.has(name) || !byName.has(name)) return;
    closure.add(name);
    const manifest = byName.get(name).manifest;
    for (const dep of Object.keys({
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
      ...manifest.peerDependencies,
    })) {
      if (byName.has(dep)) visit(dep);
    }
  };
  for (const name of selectedNames) visit(name);

  const ordered = [];
  const marks = new Map();
  const visitOrdered = (name, chain) => {
    const mark = marks.get(name);
    if (mark === 'done') return;
    if (mark === 'visiting') {
      // Dependency cycles inside the workspace are tolerated for build
      // ordering; npm workspaces already build these today.
      return;
    }
    marks.set(name, 'visiting');
    const manifest = byName.get(name).manifest;
    for (const dep of Object.keys({
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
      ...manifest.peerDependencies,
    })) {
      if (closure.has(dep)) visitOrdered(dep, [...chain, name]);
    }
    marks.set(name, 'done');
    ordered.push(name);
  };
  for (const name of [...closure].sort()) visitOrdered(name, []);
  return ordered.map((name) => byName.get(name));
}

function parseNpmPackJson(output) {
  const jsonStart = output.search(/(?:^|\n)\s*\[\s*\{/);
  if (jsonStart === -1) {
    throw new Error(`npm pack --json did not emit a JSON array: ${output.slice(0, 2000)}`);
  }
  return JSON.parse(output.slice(jsonStart).trim());
}

function loadKnownDefects() {
  return JSON.parse(fs.readFileSync(KNOWN_DEFECTS_PATH, 'utf8'));
}

function createStepRecorder(report) {
  return function step(name, fn) {
    if (report.status === 'failed') {
      report.steps[name] = { status: 'skipped', reason: 'previous step failed' };
      return null;
    }
    try {
      const detail = fn();
      if (detail && detail.skipped) {
        report.steps[name] = { status: 'skipped', reason: detail.reason };
        return detail;
      }
      report.steps[name] = { status: 'passed', ...(detail || {}) };
      return detail;
    } catch (error) {
      const message = error instanceof StepFailure ? error.message : execErrorText(error);
      report.steps[name] = { status: 'failed', error: message };
      report.status = 'failed';
      report.failures.push(`${name}: ${message}`);
      return null;
    }
  };
}

class StepFailure extends Error {}

function verifyPackage({ pkg, options, tempRoot, installScriptAllowlist, nonHoistedPackages }) {
  const packageDir = path.resolve(repoRoot, pkg.dir);
  const manifest = pkg.manifest;
  const report = {
    package: manifest.name,
    dir: path.relative(repoRoot, packageDir).split(path.sep).join('/'),
    version: manifest.version ?? '',
    verifiedAt: new Date().toISOString(),
    status: 'passed',
    failures: [],
    steps: {},
    tarball: { filename: null, files: [] },
  };
  const step = createStepRecorder(report);
  const workDir = fs.mkdtempSync(path.join(tempRoot, `${safeReportName(manifest.name)}-`));

  // --- 1. explicit build step -------------------------------------------
  step('build', () => {
    if (options.skipBuild) return { skipped: true, reason: '--skip-build' };
    if (!manifest.scripts || !manifest.scripts.build) {
      return { skipped: true, reason: 'package declares no build script' };
    }
    if (pkg.fromInventory) {
      exec('npm', ['run', 'build', `--workspace=${manifest.name}`], { cwd: repoRoot });
    } else {
      exec('npm', ['run', 'build'], { cwd: packageDir });
    }
    return { command: 'npm run build' };
  });

  // --- 2. pack the exact tarball ----------------------------------------
  const packDir = path.join(workDir, 'pack');
  let tarballPath = null;
  step('pack', () => {
    fs.mkdirSync(packDir, { recursive: true });
    const output = exec(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', packDir],
      { cwd: packageDir },
    );
    const [packResult] = parseNpmPackJson(output);
    if (!packResult || !packResult.filename) {
      throw new StepFailure('npm pack produced no tarball');
    }
    tarballPath = path.join(packDir, packResult.filename);
    if (!fs.existsSync(tarballPath)) {
      throw new StepFailure(`npm pack reported ${packResult.filename} but the tarball is missing`);
    }
    report.tarball.filename = packResult.filename;
    report.tarball.files = (packResult.files ?? []).map((file) => file.path).sort();
    return { filename: packResult.filename, fileCount: report.tarball.files.length };
  });

  // --- 3. every declared surface target exists in the tarball ------------
  step('surfaces', () => {
    const tarballFiles = new Set(report.tarball.files);
    if (!tarballFiles.has('package.json')) {
      throw new StepFailure('tarball does not contain package.json');
    }
    // A package with neither an importable root nor a bin would otherwise pass
    // every remaining step vacuously once the bin-only-package root import is
    // no longer synthesized. Refuse it here instead.
    const surfaceProblem = consumerSurfaceProblem(manifest);
    if (surfaceProblem) {
      throw new StepFailure(surfaceProblem);
    }
    const missing = collectSurfaceTargets(manifest).filter(({ target }) => !tarballFiles.has(target));
    if (missing.length > 0) {
      throw new StepFailure(
        `declared surface targets missing from tarball: ${missing
          .map(({ kind, target }) => `${kind} -> ${target}`)
          .join(', ')}`,
      );
    }
    return { checkedTargets: collectSurfaceTargets(manifest).length };
  });

  // --- 4. bin shebangs in the extracted tarball ---------------------------
  const extractDir = path.join(workDir, 'extracted');
  step('shebangs', () => {
    const declaredBins = binEntries(manifest);
    if (declaredBins.length === 0) {
      return { skipped: true, reason: 'package declares no bin' };
    }
    fs.mkdirSync(extractDir, { recursive: true });
    exec('tar', ['-xzf', tarballPath, '-C', extractDir]);
    const badBins = [];
    for (const [binName, binTarget] of declaredBins) {
      const target = normalizeTarget(binTarget);
      const binPath = path.join(extractDir, 'package', target);
      if (!fs.existsSync(binPath)) {
        badBins.push(`${binName}: ${target} missing from extracted tarball`);
        continue;
      }
      const head = fs.readFileSync(binPath, 'utf8').slice(0, 64);
      if (!head.startsWith('#!')) {
        badBins.push(`${binName}: ${target} has no shebang`);
      }
    }
    if (badBins.length > 0) {
      throw new StepFailure(badBins.join('; '));
    }
    return { checkedBins: declaredBins.length };
  });

  // --- 5. fresh temporary consumer install (no workspace links) ----------
  const consumerDir = path.join(workDir, 'consumer');
  step('install', () => {
    fs.mkdirSync(consumerDir, { recursive: true });
    fs.writeFileSync(
      path.join(consumerDir, 'package.json'),
      JSON.stringify({ name: 'fix011-clean-consumer', private: true }, null, 2),
      'utf8',
    );
    const installArgs = [
      'install',
      '--no-package-lock',
      '--no-audit',
      '--no-fund',
      '--loglevel=error',
    ];
    if (!installScriptAllowlist.includes(manifest.name)) {
      installArgs.push('--ignore-scripts');
    }
    // FIX-006: packages whose ownership contract must hold without hoisting are
    // installed nested, so an undeclared runtime import cannot be satisfied by
    // a sibling's dependency sitting at the consumer root.
    const installStrategy =
      options.installStrategy ?? (nonHoistedPackages.has(manifest.name) ? 'nested' : 'hoisted');
    installArgs.push(`--install-strategy=${installStrategy}`);
    installArgs.push(tarballPath);
    exec('npm', installArgs, { cwd: consumerDir });
    return { ignoreScripts: !installScriptAllowlist.includes(manifest.name), installStrategy };
  });

  // --- 6. import the root and every exported runtime subpath -------------
  const importSpecs = runtimeImportSpecs(manifest);
  step('imports', () => {
    if (importSpecs.length === 0) {
      // A bin-only package (no main/module/exports). The `surfaces` step already
      // proved it declares a bin, and the `bins` step below exercises it.
      return {
        skipped: true,
        reason: 'package declares no importable root or exported runtime subpath',
      };
    }
    const scriptLines = [
      "import { createRequire } from 'node:module';",
      'const cjsRequire = createRequire(import.meta.url);',
      `const specs = ${JSON.stringify(importSpecs.map(({ id, json }) => ({ id, json })))};`,
      'for (const spec of specs) {',
      '  if (spec.json) {',
      '    cjsRequire(spec.id);',
      '  } else {',
      '    await import(spec.id);',
      '  }',
      "  process.stderr.write(`imported ${spec.id}\\n`);",
      '}',
    ];
    const scriptPath = path.join(consumerDir, 'fix011-import-check.mjs');
    fs.writeFileSync(scriptPath, scriptLines.join('\n'), 'utf8');
    exec(process.execPath, [scriptPath], { cwd: consumerDir });
    return { importedSubpaths: importSpecs.map((spec) => spec.id) };
  });

  // --- 7. typecheck a minimal consumer against exported declarations -----
  step('typecheck', () => {
    const typedSpecs = importSpecs.filter((spec) => spec.types && !spec.json);
    if (typedSpecs.length === 0) {
      return { skipped: true, reason: 'package ships no type declarations' };
    }
    const tscPath = path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');
    if (!fs.existsSync(tscPath)) {
      throw new StepFailure(
        'typescript is not installed at the repository root; run npm ci before the release verifier',
      );
    }
    const consumerSource = typedSpecs
      .map((spec, index) => `import * as fix011Consumer${index} from ${JSON.stringify(spec.id)};`)
      .concat(typedSpecs.map((_, index) => `void fix011Consumer${index};`))
      .join('\n');
    const consumerPath = path.join(consumerDir, 'fix011-typecheck.mts');
    fs.writeFileSync(consumerPath, `${consumerSource}\n`, 'utf8');
    exec(
      process.execPath,
      [
        tscPath,
        '--noEmit',
        '--skipLibCheck',
        '--esModuleInterop',
        '--module',
        'nodenext',
        '--moduleResolution',
        'nodenext',
        '--target',
        'es2022',
        'fix011-typecheck.mts',
      ],
      { cwd: consumerDir },
    );
    return { typecheckedSubpaths: typedSpecs.map((spec) => spec.id) };
  });

  // --- 8. bin smoke tests -------------------------------------------------
  step('bins', () => {
    const declaredBins = binEntries(manifest);
    if (declaredBins.length === 0) {
      return { skipped: true, reason: 'package declares no bin' };
    }
    const results = [];
    for (const [binName] of declaredBins) {
      const shimPath = path.join(consumerDir, 'node_modules', '.bin', binName);
      if (!fs.existsSync(shimPath)) {
        throw new StepFailure(`bin ${binName} was not linked into node_modules/.bin by the install`);
      }
      const smokeArgs = binSmokeArgs(manifest.name, binName);
      try {
        exec(shimPath, smokeArgs, { cwd: consumerDir, timeout: BIN_TIMEOUT_MS });
      } catch (error) {
        throw new StepFailure(`bin ${binName} ${smokeArgs.join(' ')} failed: ${execErrorText(error)}`);
      }
      results.push({ bin: binName, args: smokeArgs });
    }
    return { smoked: results };
  });

  // --- 9. package-specific release gate ----------------------------------
  // Packages that own behavioral release checks expose `verify:release`
  // (e.g. @a5c-ai/extensions-adapter asserts its build output, packed surface
  // and both bin behaviors, FIX-004). The publish helper already runs it before
  // `npm publish`; running it here keeps the generic gate and the publish path
  // on the same contract.
  step('verifyRelease', () => {
    if (!manifest.scripts || !manifest.scripts['verify:release']) {
      return { skipped: true, reason: 'package declares no verify:release script' };
    }
    if (pkg.fromInventory) {
      exec('npm', ['run', 'verify:release', `--workspace=${manifest.name}`], { cwd: repoRoot });
    } else {
      exec('npm', ['run', 'verify:release'], { cwd: packageDir });
    }
    return { command: 'npm run verify:release' };
  });

  if (!options.keepTemp) {
    fs.rmSync(workDir, { recursive: true, force: true });
  } else {
    report.tempDir = workDir;
    // Documented contract for package-specific gates that layer assertions on
    // the retained clean consumer (see the extensions adapter parity gate).
    report.consumerDir = consumerDir;
  }
  return report;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const inventory = listPublishablePackages(repoRoot).map((pkg) => ({ ...pkg, fromInventory: true }));

  if (options.list) {
    process.stdout.write(
      `${JSON.stringify(
        inventory.map(({ name, dir, version }) => ({ name, dir, version })),
        null,
        2,
      )}\n`,
    );
    return 0;
  }

  const knownDefects = loadKnownDefects();
  const installScriptAllowlist = (knownDefects.installScripts ?? []).map((entry) =>
    typeof entry === 'string' ? entry : entry.package,
  );

  let selected;
  if (options.packageDirs.length > 0 || options.packages.length > 0) {
    selected = [];
    const byName = new Map(inventory.map((pkg) => [pkg.name, pkg]));
    for (const name of options.packages) {
      const pkg = byName.get(name);
      if (!pkg) {
        throw new Error(
          `--package ${name} is not in the publishable inventory; run with --list to see the inventory`,
        );
      }
      selected.push(pkg);
    }
    for (const dirArg of options.packageDirs) {
      const packageDir = path.resolve(repoRoot, dirArg);
      const manifestPath = path.join(packageDir, 'package.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error(`--package-dir ${dirArg} has no package.json`);
      }
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      selected.push({
        name: manifest.name,
        dir: path.relative(repoRoot, packageDir).split(path.sep).join('/'),
        version: manifest.version ?? '',
        manifest,
        fromInventory: false,
      });
    }
  } else {
    selected = inventory;
  }

  // Build dependency-ordered list for inventory members so each package's
  // internal dependencies are built before it is packed.
  const inventorySelected = selected.filter((pkg) => pkg.fromInventory);
  const orderedInventory = topoSortInventory(inventory, inventorySelected.map((pkg) => pkg.name));
  const selectedNames = new Set(inventorySelected.map((pkg) => pkg.name));
  if (!options.skipBuild) {
    for (const pkg of orderedInventory) {
      if (selectedNames.has(pkg.name)) continue; // built inside verifyPackage
      if (!pkg.manifest.scripts || !pkg.manifest.scripts.build) continue;
      log(`[deps] building internal dependency ${pkg.name}`);
      exec('npm', ['run', 'build', `--workspace=${pkg.name}`], { cwd: repoRoot });
    }
  }
  const orderedSelected = [
    ...orderedInventory.filter((pkg) => selectedNames.has(pkg.name)),
    ...selected.filter((pkg) => !pkg.fromInventory),
  ];

  const reportDir = path.resolve(repoRoot, options.reportDir);
  fs.mkdirSync(reportDir, { recursive: true });
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fix011-release-verifier-'));

  const nonHoistedPackages = new Set(nonHoistedVerificationPackages(repoRoot));

  const results = [];
  for (const pkg of orderedSelected) {
    log(`[verify] ${pkg.name} (${pkg.dir})`);
    const report = verifyPackage({ pkg, options, tempRoot, installScriptAllowlist, nonHoistedPackages });
    fs.writeFileSync(
      path.join(reportDir, `${safeReportName(pkg.name)}.json`),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8',
    );
    results.push(report);
    log(`[verify] ${pkg.name}: ${report.status}${report.failures.length ? ` — ${report.failures[0]}` : ''}`);
  }

  if (!options.keepTemp) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }

  const knownFailurePackages = new Set((knownDefects.packedArtifact ?? []).map((entry) => entry.package));
  const failed = results.filter((report) => report.status === 'failed');
  const unexpectedFailures = failed.filter((report) => !knownFailurePackages.has(report.package));
  const toleratedFailures = options.allowKnownFailures
    ? failed.filter((report) => knownFailurePackages.has(report.package))
    : [];
  const staleKnownFailures = options.allowKnownFailures
    ? results.filter((report) => report.status === 'passed' && knownFailurePackages.has(report.package))
    : [];

  const summary = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    passed: results.filter((report) => report.status === 'passed').length,
    failed: failed.length,
    allowKnownFailures: options.allowKnownFailures,
    toleratedKnownFailures: toleratedFailures.map((report) => report.package),
    staleKnownFailureEntries: staleKnownFailures.map((report) => report.package),
    results: results.map((report) => ({
      package: report.package,
      dir: report.dir,
      version: report.version,
      status: report.status,
      failures: report.failures,
      tarball: report.tarball.filename,
    })),
  };
  fs.writeFileSync(path.join(reportDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  log(`[verify] reports written to ${reportDir}`);

  for (const report of failed) {
    const tolerated = options.allowKnownFailures && knownFailurePackages.has(report.package);
    log(
      `${tolerated ? '[known-failure]' : '[FAILED]'} ${report.package}: ${report.failures.join(' | ')}`,
    );
  }
  for (const report of staleKnownFailures) {
    log(
      `[stale-known-failure] ${report.package} passed but is still listed under packedArtifact in ` +
        'scripts/known-package-defects.json — remove its entry.',
    );
  }

  if (options.allowKnownFailures) {
    return unexpectedFailures.length > 0 || staleKnownFailures.length > 0 ? 1 : 0;
  }
  return failed.length > 0 ? 1 : 0;
}

try {
  process.exit(main());
} catch (error) {
  log(`verify-release-artifacts failed: ${error.message}`);
  process.exit(1);
}
