#!/usr/bin/env node
/**
 * Published-consumer verification of an EXACT release version (FIX-010).
 *
 * The post-publication counterpart of scripts/verify-release-artifacts.mjs
 * (FIX-011). That gate proves the packed tarball is sound before publication;
 * this one proves what npm actually serves for one immutable version, from a
 * clean consumer project, BEFORE any channel tag is moved to it:
 *
 *   1. installs every public package at `@<exact-version>` — never a dist-tag —
 *      into a fresh temporary project outside the repository;
 *   2. proves each installed version IS the exact release version and records
 *      the resolved map for incident review;
 *   3. imports every package root;
 *   4. imports every exported runtime subpath;
 *      (3 and 4 are skipped — with a recorded reason — for a package that
 *      declares a bundler runtime in its own manifest, exactly as the
 *      pre-publication gate does; see bundlerOnlyRuntime in
 *      scripts/lib/package-surface.cjs);
 *   5. invokes every declared bin with a harmless allowlisted argument.
 *
 * Consumer surfaces come from the INSTALLED manifest (what a user really
 * receives), enumerated by the shared scripts/lib/package-surface.cjs so this
 * gate and the pre-publication gate can never check different surfaces.
 *
 * Output (all preserved as workflow artifacts):
 *   <report-dir>/install.log             raw npm install output
 *   <report-dir>/resolved-versions.json  exact version each package resolved to
 *   <report-dir>/packages/<pkg>.json     per-package check detail
 *   <report-dir>/checks.json             check statuses for the promotion gate
 *   <report-dir>/summary.json            full machine-readable summary
 *
 * `checks.json` is consumed by
 * `scripts/release-promotion.cjs record-validation --checks <file>`, whose
 * evidence is what unlocks channel promotion.
 *
 * Usage:
 *   node scripts/verify-published-release.mjs --version 6.0.4
 *   node scripts/verify-published-release.mjs --version 6.0.4 --package @a5c-ai/babysitter-sdk
 * Options:
 *   --version <exact>     REQUIRED exact immutable version under test
 *   --package <name>      verify one package (repeatable; default: the full
 *                         authoritative publishable inventory)
 *   --report-dir <dir>    default artifacts/published-consumer
 *   --npm <bin>           npm binary (tests inject a fake npm)
 *   --keep-temp           keep the temporary consumer for debugging
 *
 * Read-only with respect to the registry: it installs, never publishes, never
 * mutates a dist-tag.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { listPublishablePackages } = require('./lib/publishable-packages.cjs');
const { assertExactReleaseVersion, assertInstalledExactVersions } = require('./lib/release-promotion.cjs');
const {
  binEntries,
  binSmokeArgs,
  bundlerOnlyRuntime,
  consumerSurfaceProblem,
  runtimeImportSpecs,
  safeReportName,
} = require('./lib/package-surface.cjs');

const DEFAULT_REPORT_DIR = path.join('artifacts', 'published-consumer');
const INSTALL_TIMEOUT_MS = 20 * 60 * 1000;
const IMPORT_TIMEOUT_MS = 5 * 60 * 1000;
const BIN_TIMEOUT_MS = 2 * 60 * 1000;

/** Checks this gate records; the promotion gate requires all of them. */
const CHECK_PACKAGE_INSTALL = 'package-install';
const CHECK_ROOT_IMPORT = 'root-import';
const CHECK_SUBPATH_IMPORT = 'subpath-import';
const CHECK_BIN_SMOKE = 'bin-smoke';

function log(message) {
  process.stderr.write(`${message}\n`);
}

function parseArgs(argv) {
  const options = { packages: [], reportDir: DEFAULT_REPORT_DIR, npmBin: 'npm', keepTemp: false, version: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) throw new Error(`${arg} requires a value`);
      i += 1;
      return next;
    };
    switch (arg) {
      case '--version':
        options.version = value();
        break;
      case '--package':
        options.packages.push(value());
        break;
      case '--report-dir':
        options.reportDir = value();
        break;
      case '--npm':
        options.npmBin = value();
        break;
      case '--keep-temp':
        options.keepTemp = true;
        break;
      case '--help':
      case '-h':
        process.stdout.write('See the header comment of scripts/verify-published-release.mjs for usage.\n');
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function run(command, args, { cwd, timeout }) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    timeout,
    maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === 'win32',
  });
  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    text: `${result.stdout || ''}${result.stderr || ''}`.trim().slice(0, 8000),
  };
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const releaseVersion = assertExactReleaseVersion(options.version, { context: 'version under test' });

  const inventory = listPublishablePackages(repoRoot).map((entry) => entry.name);
  const selected = options.packages.length ? options.packages : inventory;
  const unknown = selected.filter((name) => !inventory.includes(name));
  if (unknown.length) {
    throw new Error(`Not publishable packages: ${unknown.join(', ')}`);
  }

  const reportDir = path.resolve(repoRoot, options.reportDir);
  fs.mkdirSync(path.join(reportDir, 'packages'), { recursive: true });

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fix010-published-consumer-'));
  const consumerDir = path.join(tempRoot, 'consumer');
  fs.mkdirSync(consumerDir, { recursive: true });
  writeJson(path.join(consumerDir, 'package.json'), { name: 'fix010-published-consumer', private: true });

  const checks = [];
  const packageReports = [];
  const failures = [];

  // --- 1. install every package at the EXACT version ------------------------
  const specs = selected.map((name) => `${name}@${releaseVersion}`);
  log(`Installing ${specs.length} package(s) at exact version ${releaseVersion}`);
  const install = run(
    options.npmBin,
    ['install', '--no-package-lock', '--no-audit', '--no-fund', '--loglevel=error', ...specs],
    { cwd: consumerDir, timeout: INSTALL_TIMEOUT_MS },
  );
  fs.writeFileSync(path.join(reportDir, 'install.log'), `npm install ${specs.join(' ')}\n\n${install.stdout}${install.stderr}`);

  let resolved = {};
  if (install.status !== 0) {
    checks.push({ name: CHECK_PACKAGE_INSTALL, status: 'failure', detail: install.text.slice(0, 2000) });
    failures.push(`install: exited ${install.status}`);
  } else {
    // --- 2. the installed versions ARE the exact release version ------------
    const ls = run(options.npmBin, ['ls', '--depth=0', '--json'], { cwd: consumerDir, timeout: IMPORT_TIMEOUT_MS });
    let tree;
    try {
      tree = JSON.parse(ls.stdout || '{}');
    } catch (error) {
      throw new Error(`Could not read the installed dependency tree: ${error.message}\n${ls.stderr}`);
    }
    const installed = assertInstalledExactVersions({ releaseVersion, packages: selected, tree });
    resolved = installed.resolved;
    if (installed.problems.length) {
      checks.push({
        name: CHECK_PACKAGE_INSTALL,
        status: 'failure',
        detail: installed.problems
          .map((problem) => `${problem.package}: ${problem.actual ?? 'not installed'} (expected ${problem.expected})`)
          .join('; ')
          .slice(0, 2000),
      });
      failures.push(`installed versions: ${installed.problems.length} package(s) are not ${releaseVersion}`);
    } else {
      checks.push({ name: CHECK_PACKAGE_INSTALL, status: 'success', detail: `${selected.length} package(s)` });
    }
  }
  writeJson(path.join(reportDir, 'resolved-versions.json'), { releaseVersion, resolved });

  // --- 3-5. imports and bins, per package ----------------------------------
  const rootImportFailures = [];
  const subpathImportFailures = [];
  const binFailures = [];

  if (install.status === 0) {
    for (const packageName of selected) {
      const manifestPath = path.join(consumerDir, 'node_modules', ...packageName.split('/'), 'package.json');
      const report = { package: packageName, version: resolved[packageName] ?? null, checks: {} };
      if (!fs.existsSync(manifestPath)) {
        report.checks.installed = { status: 'failure', detail: `${manifestPath} is missing after install` };
        rootImportFailures.push(`${packageName}: not present in node_modules`);
        packageReports.push(report);
        writeJson(path.join(reportDir, 'packages', `${safeReportName(packageName)}.json`), report);
        continue;
      }
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      // A bin-only package legitimately has no importable root, but a package
      // with neither an importable root NOR a bin verifies nothing at all — and
      // "nothing to check" must never unlock channel promotion.
      const surfaceProblem = consumerSurfaceProblem(manifest);
      if (surfaceProblem) {
        report.checks[CHECK_ROOT_IMPORT] = { status: 'failure', detail: surfaceProblem };
        rootImportFailures.push(`${packageName}: ${surfaceProblem}`);
        packageReports.push(report);
        writeJson(path.join(reportDir, 'packages', `${safeReportName(packageName)}.json`), report);
        continue;
      }
      // A package that declares a bundler runtime in its own manifest (the
      // standard `"react-native"` resolution field) is resolved by Metro /
      // webpack / Vite, never by bare Node — its entrypoint statically imports
      // `react-native`, whose own entrypoint is Flow source. Asking "does bare
      // Node import this?" asserts something the package never promised, and no
      // publishing change can make it true. The pre-publication gate
      // (scripts/verify-release-artifacts.mjs) already narrows exactly this one
      // step for exactly this declaration; this gate must narrow it identically,
      // or the first full release blocks promotion on `@a5c-ai/genty-ui`
      // forever. The escape is a per-manifest declaration — never a name-keyed
      // allowlist — and it narrows ONLY the Node import steps: install, exact
      // version, and bin smoke still run.
      const bundlerOnly = bundlerOnlyRuntime(manifest);
      if (bundlerOnly) {
        const reason =
          `package declares a bundler runtime via the "${bundlerOnly.field}" manifest field ` +
          `(-> ${bundlerOnly.target}); bare Node cannot evaluate it`;
        report.checks[CHECK_ROOT_IMPORT] = { status: 'skipped', detail: reason, declaredRuntimeField: bundlerOnly.field };
        report.checks[CHECK_SUBPATH_IMPORT] = { status: 'skipped', detail: reason, declaredRuntimeField: bundlerOnly.field };
      } else {
        const specsToImport = runtimeImportSpecs(manifest);
        const rootSpecs = specsToImport.filter((spec) => spec.id === packageName);
        const subpathSpecs = specsToImport.filter((spec) => spec.id !== packageName);

        report.checks[CHECK_ROOT_IMPORT] = importCheck(consumerDir, packageName, rootSpecs, rootImportFailures);
        report.checks[CHECK_SUBPATH_IMPORT] = importCheck(consumerDir, packageName, subpathSpecs, subpathImportFailures);
      }

      const declaredBins = binEntries(manifest);
      if (declaredBins.length === 0) {
        report.checks[CHECK_BIN_SMOKE] = { status: 'skipped', detail: 'package declares no bin' };
      } else {
        const smoked = [];
        for (const [binName] of declaredBins) {
          const shimPath = path.join(consumerDir, 'node_modules', '.bin', binName);
          if (!fs.existsSync(shimPath)) {
            binFailures.push(`${packageName}: bin ${binName} was not linked by the install`);
            smoked.push({ bin: binName, status: 'failure', detail: 'not linked into node_modules/.bin' });
            continue;
          }
          const args = binSmokeArgs(packageName, binName);
          const result = run(shimPath, args, { cwd: consumerDir, timeout: BIN_TIMEOUT_MS });
          if (result.status !== 0) {
            binFailures.push(`${packageName}: ${binName} ${args.join(' ')} exited ${result.status}`);
            smoked.push({ bin: binName, status: 'failure', args, detail: result.text.slice(0, 1000) });
          } else {
            smoked.push({ bin: binName, status: 'success', args });
          }
        }
        report.checks[CHECK_BIN_SMOKE] = {
          status: smoked.some((entry) => entry.status === 'failure') ? 'failure' : 'success',
          bins: smoked,
        };
      }

      packageReports.push(report);
      writeJson(path.join(reportDir, 'packages', `${safeReportName(packageName)}.json`), report);
    }

    pushCheck(checks, CHECK_ROOT_IMPORT, rootImportFailures, `${selected.length} package root(s)`);
    pushCheck(checks, CHECK_SUBPATH_IMPORT, subpathImportFailures, 'every exported runtime subpath');
    pushCheck(checks, CHECK_BIN_SMOKE, binFailures, 'every declared bin');
  } else {
    for (const name of [CHECK_ROOT_IMPORT, CHECK_SUBPATH_IMPORT, CHECK_BIN_SMOKE]) {
      checks.push({ name, status: 'failure', detail: 'the exact-version install failed; nothing could be verified' });
    }
  }

  failures.push(...rootImportFailures, ...subpathImportFailures, ...binFailures);

  const summary = {
    releaseVersion,
    packages: selected,
    resolved,
    checks,
    failures,
    status: checks.every((check) => check.status !== 'failure') ? 'success' : 'failure',
    consumerDir: options.keepTemp ? consumerDir : undefined,
    recordedAt: new Date().toISOString(),
  };
  writeJson(path.join(reportDir, 'checks.json'), checks);
  writeJson(path.join(reportDir, 'summary.json'), summary);
  writeJson(path.join(reportDir, 'package-reports.json'), packageReports);

  if (!options.keepTemp) fs.rmSync(tempRoot, { recursive: true, force: true });

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (summary.status !== 'success') {
    throw new Error(
      `Published-consumer verification of ${releaseVersion} FAILED (${failures.length} problem(s)). ` +
        `Evidence is preserved in ${path.relative(repoRoot, reportDir)}; the channel tag must not move.`,
    );
  }
  log(`Published-consumer verification of ${releaseVersion} passed for ${selected.length} package(s).`);
}

/** Import a set of specifiers from the clean consumer, recording failures. */
function importCheck(consumerDir, packageName, specs, failureSink) {
  if (specs.length === 0) {
    return { status: 'skipped', detail: 'no runtime entrypoint of this kind' };
  }
  const scriptPath = path.join(consumerDir, `fix010-import-${safeReportName(packageName)}-${specs.length}.mjs`);
  fs.writeFileSync(
    scriptPath,
    [
      "import { createRequire } from 'node:module';",
      'const cjsRequire = createRequire(import.meta.url);',
      `const specs = ${JSON.stringify(specs.map(({ id, json }) => ({ id, json })))};`,
      'for (const spec of specs) {',
      '  if (spec.json) { cjsRequire(spec.id); } else { await import(spec.id); }',
      "  process.stderr.write(`imported ${spec.id}\\n`);",
      '}',
      '',
    ].join('\n'),
  );
  const result = run(process.execPath, [scriptPath], { cwd: consumerDir, timeout: IMPORT_TIMEOUT_MS });
  if (result.status !== 0) {
    failureSink.push(`${packageName}: ${result.text.slice(0, 600)}`);
    return { status: 'failure', specs: specs.map((spec) => spec.id), detail: result.text.slice(0, 2000) };
  }
  return { status: 'success', specs: specs.map((spec) => spec.id) };
}

function pushCheck(checks, name, failures, successDetail) {
  checks.push(
    failures.length
      ? { name, status: 'failure', detail: failures.slice(0, 20).join('; ').slice(0, 2000) }
      : { name, status: 'success', detail: successDetail },
  );
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
