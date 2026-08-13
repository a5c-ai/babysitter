#!/usr/bin/env node
/**
 * Candidate publication / validated channel promotion CLI (FIX-010).
 *
 * GitHub workflow YAML cannot be executed or tested locally, so every piece of
 * promotion reasoning lives here — with fixture tests in
 * scripts/__tests__/release-promotion.test.mjs — and the workflows are thin
 * wiring around it (the same shape FIX-001 used for
 * scripts/release-version.cjs).
 *
 * Subcommands:
 *   candidate-tag --version <exact>
 *       Print the non-production dist-tag this exact release publishes under.
 *
 *   assert-exact-version --version <exact> [--label <what>]
 *       Fail unless the value is one immutable version (not `latest`, not a
 *       range, not a partial version). Used by the published-consumer workflow
 *       to refuse a mutable dist-tag input.
 *
 *   record-validation --version <exact> [--candidate-tag <t>] [--run-url <u>]
 *                     [--checks <file>]
 *                     --check <name>=<success|failure|skipped>[:<detail>] ...
 *                     [--resolved <file>] --out <file>
 *       Write the machine-readable published-consumer validation evidence.
 *       Exits non-zero when the evidence is not a success, so the workflow step
 *       fails while the evidence artifact still exists for incident review.
 *
 *   assert-validated --version <exact> --dist-tag <channel> --evidence <file>
 *       The promotion gate on its own (no registry access) — proves the exact
 *       version passed every required check.
 *
 *   promote --version <exact> --dist-tag <channel> --evidence <file>
 *           [--npm <bin>] [--dry-run]
 *       Move every public package's channel tag to the validated version and
 *       re-assert it. The ONLY dist-tag mutation in the release pipeline.
 *
 *   assert-installed --version <exact> --packages <a,b,c> [--ls-json <file>]
 *                    [--npm <bin>] [--global] [--out <file>]
 *       Prove the packages a consumer actually installed are the exact release
 *       version, and preserve the resolved map as evidence.
 *
 * Only `promote` mutates anything; every other subcommand is read-only.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const {
  REQUIRED_VALIDATION_CHECKS,
  assertExactReleaseVersion,
  assertInstalledExactVersions,
  assertPromotionAllowed,
  buildValidationEvidence,
  candidateDistTagFor,
  planChannelPromotion,
  promoteChannelTags,
  readValidationEvidence,
} = require('./lib/release-promotion.cjs');

const repoRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const options = { _: [], check: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      options._.push(arg);
      continue;
    }
    const eq = arg.indexOf('=');
    let key;
    let value;
    if (eq !== -1) {
      key = arg.slice(2, eq);
      value = arg.slice(eq + 1);
    } else {
      key = arg.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        value = true;
      } else {
        value = next;
        i += 1;
      }
    }
    if (key === 'check') {
      options.check.push(value);
    } else {
      options[key] = value;
    }
  }
  return options;
}

function required(options, name) {
  const value = options[name];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`--${name} is required`);
  }
  return value;
}

function writeJson(filePath, value) {
  const absolute = path.resolve(repoRoot, filePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
  return absolute;
}

/** `--check name=status[:detail]` */
function parseCheck(raw) {
  const value = String(raw);
  const eq = value.indexOf('=');
  if (eq === -1) {
    throw new Error(`--check ${JSON.stringify(value)} must be <name>=<success|failure|skipped>[:<detail>]`);
  }
  const name = value.slice(0, eq);
  const rest = value.slice(eq + 1);
  const colon = rest.indexOf(':');
  return {
    name,
    status: colon === -1 ? rest : rest.slice(0, colon),
    detail: colon === -1 ? undefined : rest.slice(colon + 1),
  };
}

const COMMANDS = {
  'candidate-tag': (options) => {
    process.stdout.write(`${candidateDistTagFor(required(options, 'version'))}\n`);
  },

  'assert-exact-version': (options) => {
    const label = typeof options.label === 'string' ? options.label : 'release version';
    const version = assertExactReleaseVersion(required(options, 'version'), { context: label });
    process.stdout.write(`${label} ${version} is an exact immutable version.\n`);
  },

  'record-validation': (options) => {
    const releaseVersion = required(options, 'version');
    // Checks produced by scripts/verify-published-release.mjs (install, root
    // and subpath imports, bin smoke) plus the checks the workflow observes
    // itself (the live-stack lanes' result).
    const fileChecks =
      typeof options.checks === 'string'
        ? JSON.parse(fs.readFileSync(path.resolve(repoRoot, options.checks), 'utf8'))
        : [];
    if (!Array.isArray(fileChecks)) {
      throw new Error(`--checks ${options.checks} must contain a JSON array of {name, status} objects`);
    }
    const checks = [...fileChecks, ...options.check.map(parseCheck)];
    let resolvedVersions;
    if (typeof options.resolved === 'string') {
      resolvedVersions = JSON.parse(fs.readFileSync(path.resolve(repoRoot, options.resolved), 'utf8'));
    }
    const evidence = buildValidationEvidence({
      releaseVersion,
      candidateDistTag: typeof options['candidate-tag'] === 'string' ? options['candidate-tag'] : undefined,
      checks,
      workflowRunUrl: typeof options['run-url'] === 'string' ? options['run-url'] : undefined,
      resolvedVersions,
    });
    const out = writeJson(required(options, 'out'), evidence);
    process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
    if (evidence.status !== 'success') {
      throw new Error(
        `Published-consumer validation of ${releaseVersion} did NOT succeed ` +
          `(missing: ${evidence.missingChecks.join(', ') || 'none'}; failed: ${evidence.failedChecks.join(', ') || 'none'}). ` +
          `Evidence preserved at ${out}; the channel tag must not move. Required checks: ` +
          `${REQUIRED_VALIDATION_CHECKS.join(', ')}.`,
      );
    }
  },

  'assert-validated': (options) => {
    const releaseVersion = required(options, 'version');
    const distTag = required(options, 'dist-tag');
    assertPromotionAllowed({
      releaseVersion,
      distTag,
      evidence: readValidationEvidence(path.resolve(repoRoot, required(options, 'evidence'))),
    });
    process.stdout.write(
      `Published-consumer validation of ${releaseVersion} passed; ${distTag} may be moved to it.\n`,
    );
  },

  promote: (options) => {
    const releaseVersion = required(options, 'version');
    const distTag = required(options, 'dist-tag');
    const npmBin = typeof options.npm === 'string' ? options.npm : 'npm';
    const evidence = readValidationEvidence(path.resolve(repoRoot, required(options, 'evidence')));
    assertPromotionAllowed({ releaseVersion, distTag, evidence });

    if (options['dry-run']) {
      const plan = planChannelPromotion({ repoRoot, releaseVersion, distTag, npmBin });
      process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
      if (plan.missing.length) {
        throw new Error(
          `${plan.missing.length} of ${plan.packages.length} public package(s) have no published ` +
            `${releaseVersion} artifact: ${plan.missing.join(', ')}`,
        );
      }
      return;
    }

    const result = promoteChannelTags({ repoRoot, releaseVersion, distTag, evidence, npmBin });
    process.stdout.write(
      `Promoted ${result.promoted.length} public package(s) to ${distTag}=${releaseVersion} and asserted ` +
        `${result.assertion.checked} channel tag(s).\n`,
    );
  },

  'assert-installed': (options) => {
    const releaseVersion = required(options, 'version');
    const packages = required(options, 'packages')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    let tree;
    if (typeof options['ls-json'] === 'string') {
      tree = JSON.parse(fs.readFileSync(path.resolve(repoRoot, options['ls-json']), 'utf8'));
    } else {
      const npmBin = typeof options.npm === 'string' ? options.npm : 'npm';
      const args = ['ls', '--depth=0', '--json'];
      if (options.global) args.push('--global');
      const result = spawnSync(npmBin, args, {
        cwd: repoRoot,
        encoding: 'utf8',
        shell: process.platform === 'win32',
      });
      // `npm ls` exits non-zero for unrelated peer/extraneous complaints while
      // still emitting the tree; the tree is what this assertion judges, and a
      // missing/unparseable tree is a hard error below.
      try {
        tree = JSON.parse(result.stdout || '');
      } catch (error) {
        throw new Error(
          `Could not read the installed dependency tree from \`${npmBin} ${args.join(' ')}\`: ${error.message}\n` +
            (result.stderr || ''),
        );
      }
    }
    const report = assertInstalledExactVersions({ releaseVersion, packages, tree });
    if (typeof options.out === 'string') writeJson(options.out, { releaseVersion, ...report });
    process.stdout.write(`${JSON.stringify(report.resolved, null, 2)}\n`);
    if (report.problems.length) {
      throw new Error(
        `${report.problems.length} package(s) are not installed at the exact release version ${releaseVersion}:\n` +
          report.problems
            .map((problem) => `  - ${problem.package}: ${problem.actual ?? 'not installed'}`)
            .join('\n'),
      );
    }
  },
};

function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === '--help' || command === '-h') {
    process.stdout.write(
      `Usage: node scripts/release-promotion.cjs <${Object.keys(COMMANDS).join('|')}> [options]\n` +
        'See the header comment of scripts/release-promotion.cjs for the full contract.\n',
    );
    return;
  }
  const handler = COMMANDS[command];
  if (!handler) {
    throw new Error(`Unknown subcommand ${JSON.stringify(command)}; known: ${Object.keys(COMMANDS).join(', ')}`);
  }
  handler(parseArgs(rest));
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
