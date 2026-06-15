#!/usr/bin/env node
/**
 * Pre-push / CI guard for the recurring "added a package or changed deps without
 * updating the lockfile / metadata" class of failures that break shared-branch CI.
 *
 * Runs three fast, offline checks:
 *   1. Workspace ⟷ lockfile sync — every on-disk workspace package.json has a
 *      matching entry in package-lock.json (catches "npm ci out of sync:
 *      Missing <pkg> from lock file").
 *   2. No platform-specific native binding pinned as a NON-optional lockfile node
 *      (catches the Windows `npm install` pollution that breaks Linux `npm ci`
 *      with EBADPLATFORM).
 *   3. Package metadata / public-surface coverage (delegates to
 *      check-package-metadata.cjs — catches new public packages missing a
 *      README or a coverage-doc entry).
 *
 * Exit non-zero with an actionable message on any failure.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const failures = [];

function rel(p) {
  return p.split(path.sep).join('/');
}

// Resolve the actual workspace member directories from the root package.json
// `workspaces` array — handling explicit entries and single-level `dir/*`
// globs the same way npm does. Only these are managed by the lockfile; other
// tracked package.json files (examples, blueprints, non-workspace packages)
// must NOT be treated as out-of-sync.
function resolveWorkspaceDirs() {
  const rootManifest = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  );
  const patterns = Array.isArray(rootManifest.workspaces)
    ? rootManifest.workspaces
    : [];
  const dirs = new Set();
  for (const pattern of patterns) {
    if (pattern.includes('*')) {
      const base = pattern.replace(/\/\*+$/, '');
      const baseAbs = path.join(repoRoot, base);
      if (!fs.existsSync(baseAbs)) continue;
      for (const entry of fs.readdirSync(baseAbs, { withFileTypes: true })) {
        if (
          entry.isDirectory() &&
          fs.existsSync(path.join(baseAbs, entry.name, 'package.json'))
        ) {
          dirs.add(rel(path.join(base, entry.name)));
        }
      }
    } else if (fs.existsSync(path.join(repoRoot, pattern, 'package.json'))) {
      dirs.add(rel(pattern));
    }
  }
  return [...dirs];
}

// 1 + 3 source data
const lock = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'package-lock.json'), 'utf8'),
);
const lockPackages = lock.packages || {};

// --- Check 1: every workspace member is present in the lockfile ---
const missingFromLock = [];
for (const dir of resolveWorkspaceDirs()) {
  if (!lockPackages[dir]) {
    let name = dir;
    try {
      name =
        JSON.parse(
          fs.readFileSync(path.join(repoRoot, dir, 'package.json'), 'utf8'),
        ).name || dir;
    } catch {
      /* keep dir as label */
    }
    missingFromLock.push(`${dir} (${name})`);
  }
}
if (missingFromLock.length) {
  failures.push(
    'Lockfile out of sync — these workspace packages are missing from package-lock.json:\n' +
      missingFromLock.map((m) => `    - ${m}`).join('\n') +
      '\n  Fix: run `npm install` (or, on Windows, regenerate cleanly to avoid\n' +
      '  pinning win32 bindings: move node_modules aside, `npm install --package-lock-only`).',
  );
}

// --- Check 2: no NON-optional platform-specific native binding in the lockfile ---
const nonOptionalNative = [];
for (const [p, e] of Object.entries(lockPackages)) {
  if (p.endsWith('package.json')) continue;
  if ((Array.isArray(e.os) || Array.isArray(e.cpu)) && !e.optional) {
    nonOptionalNative.push(`${p} v${e.version || '?'} os=${JSON.stringify(e.os || [])}`);
  }
}
if (nonOptionalNative.length) {
  failures.push(
    'package-lock.json pins platform-specific native binding(s) as NON-optional —\n' +
      'this breaks `npm ci` on other platforms (EBADPLATFORM):\n' +
      nonOptionalNative.map((m) => `    - ${m}`).join('\n') +
      '\n  Cause: usually a direct dep on a platform binding, or `npm install` run on\n' +
      '  Windows. Fix: remove any direct dep on an `@*/binding-<os>-*` package and\n' +
      '  regenerate the lockfile (node_modules aside + `npm install --package-lock-only`).',
  );
}

// --- Check 3: package metadata / public-surface coverage ---
try {
  execFileSync('node', ['./scripts/check-package-metadata.cjs'], {
    cwd: repoRoot,
    stdio: 'pipe',
  });
} catch (err) {
  const msg = (err.stdout || err.stderr || '').toString().trim();
  failures.push(
    'Package metadata check failed (`npm run verify:metadata`):\n' +
      (msg ? `    ${msg.split('\n').join('\n    ')}` : `    ${err.message}`) +
      '\n  Fix: new public packages need a README.md and an entry in\n' +
      '  docs/generated/package-plugin-docs-coverage.json (or mark the package private).',
  );
}

// --- Check 4: architecture-boundary classification ---
// New repo packages must be classified in check-architecture-boundaries.cjs
// (same "new package not registered" class as the lockfile/metadata gaps).
try {
  execFileSync('node', ['./scripts/check-architecture-boundaries.cjs'], {
    cwd: repoRoot,
    stdio: 'pipe',
  });
} catch (err) {
  const msg = (err.stdout || err.stderr || '').toString().trim();
  failures.push(
    'Architecture boundary check failed:\n' +
      (msg ? `    ${msg.split('\n').join('\n    ')}` : `    ${err.message}`) +
      '\n  Fix: classify the new package in scripts/check-architecture-boundaries.cjs.',
  );
}

if (failures.length) {
  console.error('\n✖ package-integrity guard failed:\n');
  for (const f of failures) console.error(`• ${f}\n`);
  console.error(
    'These would break shared-branch CI (Build All / Lint). Resolve them before pushing.\n',
  );
  process.exit(1);
}

console.log(
  '✓ package-integrity guard passed (lockfile sync, native bindings, metadata, arch boundaries).',
);
