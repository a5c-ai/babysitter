#!/usr/bin/env node
/**
 * FIX-004 — package-specific release gate for @a5c-ai/extensions-adapter.
 *
 * Runs before publication (scripts/publish-package-from-tag.mjs calls
 * `npm run verify:release` for every workspace that declares it, even when the
 * build is skipped) and from the generic FIX-011 release verifier
 * (scripts/verify-release-artifacts.mjs, `verifyRelease` step).
 *
 * It asserts the things the published 6.0.0 artifact got wrong:
 *
 *   - the build output declared by the manifest actually EXISTS, so the package
 *     cannot be published when `dist/` is missing or stale (the 6.0.0 tarball
 *     shipped only package.json and README.md);
 *   - the compatibility bin points at `dist/extension-adapter.js`, the file tsc
 *     emits from the singular authoritative source `src/extension-adapter.ts`
 *     (the manifest previously declared a plural file nothing ever emitted);
 *   - every declared surface is inside the packed file list;
 *   - both bins are executable: the canonical CLI prints usage and exits 0, and
 *     the compatibility bin delegates to it, prints the deprecation warning on
 *     stderr, and returns the delegated exit code (0 for --help, 1 for an
 *     unknown command);
 *   - the compiler is wired: `list-targets` prints the target registry.
 *
 * Never publishes and never mutates the npm registry.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(packageRoot, 'package.json');

const CANONICAL_BIN = 'adapters-extensions';
const COMPAT_BIN = 'extensions-adapter';
const CANONICAL_TARGET = 'dist/cli.js';
const COMPAT_TARGET = 'dist/extension-adapter.js';
const COMPAT_SOURCE = 'src/extension-adapter.ts';
const DEPRECATION_WARNING = `[adapters] "${COMPAT_BIN}" is deprecated, use "${CANONICAL_BIN}" instead.`;
const UNKNOWN_COMMAND = 'definitely-not-a-command';

const REQUIRED_BUILD_PATHS = [
  'dist/index.js',
  'dist/index.d.ts',
  CANONICAL_TARGET,
  'dist/cli.d.ts',
  COMPAT_TARGET,
];

const REQUIRED_PACKED_PATHS = ['package.json', 'README.md', ...REQUIRED_BUILD_PATHS];

const failures = [];

function expect(condition, message) {
  if (!condition) {
    failures.push(message);
  }
  return condition;
}

function readManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function normalizePackPath(value) {
  return typeof value === 'string' ? value.replace(/^package\//, '') : '';
}

function runNode(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: packageRoot,
    encoding: 'utf8',
    timeout: 120000,
  });
  if (result.error) {
    failures.push(`node ${args.join(' ')} could not be executed: ${result.error.message}`);
    return { status: null, stdout: '', stderr: '' };
  }
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function verifyManifest(manifest) {
  expect(
    manifest.name === '@a5c-ai/extensions-adapter',
    'packages/adapters/extensions/package.json name must stay @a5c-ai/extensions-adapter',
  );
  expect(
    manifest.publishConfig?.access === 'public',
    'packages/adapters/extensions/package.json publishConfig.access must stay public',
  );
  expect(
    manifest.main === 'dist/index.js' && manifest.types === 'dist/index.d.ts',
    'packages/adapters/extensions/package.json must keep main=dist/index.js and types=dist/index.d.ts',
  );
  const bin = manifest.bin ?? {};
  expect(
    bin[CANONICAL_BIN] === `./${CANONICAL_TARGET}`,
    `package.json bin.${CANONICAL_BIN} must be ./${CANONICAL_TARGET}, found ${bin[CANONICAL_BIN] ?? '<missing>'}`,
  );
  expect(
    bin[COMPAT_BIN] === `./${COMPAT_TARGET}`,
    `package.json bin.${COMPAT_BIN} must be ./${COMPAT_TARGET} (emitted from ${COMPAT_SOURCE}), found ${
      bin[COMPAT_BIN] ?? '<missing>'
    }`,
  );
  expect(
    fs.existsSync(path.join(packageRoot, COMPAT_SOURCE)),
    `the compatibility bin source ${COMPAT_SOURCE} must exist (it is the authoritative singular source)`,
  );
}

function verifyBuildOutput() {
  for (const relativePath of REQUIRED_BUILD_PATHS) {
    expect(
      fs.existsSync(path.join(packageRoot, relativePath)),
      `missing build output ${relativePath} — run \`npm run build --workspace=@a5c-ai/extensions-adapter\` before publishing`,
    );
  }
  for (const binTarget of [CANONICAL_TARGET, COMPAT_TARGET]) {
    const binPath = path.join(packageRoot, binTarget);
    if (!fs.existsSync(binPath)) continue;
    const head = fs.readFileSync(binPath, 'utf8').slice(0, 64);
    expect(head.startsWith('#!'), `${binTarget} must start with a shebang so npm can install it as a bin`);
  }
}

function verifyPackedSurface() {
  const result = spawnSync('npm', ['pack', '--json', '--dry-run', '--ignore-scripts'], {
    cwd: packageRoot,
    encoding: 'utf8',
    timeout: 300000,
  });
  if (result.status !== 0) {
    failures.push(`npm pack --dry-run failed: ${(result.stderr ?? '').trim().slice(0, 2000)}`);
    return;
  }
  const output = result.stdout ?? '';
  const jsonStart = output.search(/(?:^|\n)\s*\[\s*\{/);
  if (jsonStart === -1) {
    failures.push('npm pack --json --dry-run did not emit a JSON array');
    return;
  }
  const [packResult] = JSON.parse(output.slice(jsonStart).trim());
  const packed = new Set((packResult.files ?? []).map((entry) => normalizePackPath(entry.path)));
  for (const relativePath of REQUIRED_PACKED_PATHS) {
    expect(packed.has(relativePath), `packed tarball is missing ${relativePath}`);
  }
}

function verifyBinBehavior() {
  const canonicalHelp = runNode([CANONICAL_TARGET, '--help']);
  expect(canonicalHelp.status === 0, `node ${CANONICAL_TARGET} --help exited ${canonicalHelp.status}, expected 0`);
  expect(
    canonicalHelp.stdout.includes('Cross-harness plugin compiler'),
    `node ${CANONICAL_TARGET} --help must print the compiler usage banner`,
  );
  expect(
    !canonicalHelp.stderr.includes(DEPRECATION_WARNING),
    `node ${CANONICAL_TARGET} must not print the compatibility deprecation warning`,
  );

  const compatHelp = runNode([COMPAT_TARGET, '--help']);
  expect(compatHelp.status === 0, `node ${COMPAT_TARGET} --help exited ${compatHelp.status}, expected 0`);
  expect(
    compatHelp.stdout.includes('Cross-harness plugin compiler'),
    `node ${COMPAT_TARGET} --help must delegate to the canonical CLI`,
  );
  expect(
    compatHelp.stderr.includes(DEPRECATION_WARNING),
    `node ${COMPAT_TARGET} --help must print: ${DEPRECATION_WARNING}`,
  );

  const canonicalUnknown = runNode([CANONICAL_TARGET, UNKNOWN_COMMAND]);
  const compatUnknown = runNode([COMPAT_TARGET, UNKNOWN_COMMAND]);
  expect(
    canonicalUnknown.status === 1,
    `node ${CANONICAL_TARGET} ${UNKNOWN_COMMAND} exited ${canonicalUnknown.status}, expected 1`,
  );
  expect(
    compatUnknown.status === canonicalUnknown.status,
    `node ${COMPAT_TARGET} ${UNKNOWN_COMMAND} exited ${compatUnknown.status} but the canonical CLI exited ${canonicalUnknown.status}; the compatibility bin must return the delegated status`,
  );
  expect(
    compatUnknown.stderr.includes(DEPRECATION_WARNING),
    `node ${COMPAT_TARGET} ${UNKNOWN_COMMAND} must print the deprecation warning`,
  );
}

function verifyCompilerSurface() {
  const listTargets = runNode([CANONICAL_TARGET, 'list-targets']);
  expect(listTargets.status === 0, `node ${CANONICAL_TARGET} list-targets exited ${listTargets.status}, expected 0`);
  expect(
    listTargets.stdout.includes('Available targets:'),
    `node ${CANONICAL_TARGET} list-targets must print the target registry`,
  );
  for (const target of ['claude-code', 'codex', 'cursor', 'opencode']) {
    expect(
      listTargets.stdout.includes(target),
      `node ${CANONICAL_TARGET} list-targets must list the ${target} target`,
    );
  }
}

const manifest = readManifest();
verifyManifest(manifest);
verifyBuildOutput();
verifyPackedSurface();
verifyBinBehavior();
verifyCompilerSurface();

if (failures.length > 0) {
  console.error('verify:release failed for @a5c-ai/extensions-adapter:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `verify:release passed for ${manifest.name}@${manifest.version}: build output, packed surface, ` +
    `${CANONICAL_BIN}/${COMPAT_BIN} behavior and the compiler target registry are intact.`,
);
