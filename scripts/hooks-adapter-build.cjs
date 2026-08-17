#!/usr/bin/env node
/**
 * Aggregate hooks build / test / lint command.
 *
 * FIX-005: the package list is DERIVED from the authoritative publishable
 * package inventory (scripts/lib/release-matrix.cjs -> hooksBuildOrder), in
 * dependency order: Atlas catalog foundation, hooks core, every public hooks
 * leaf, then the hooks CLI. It used to be hand-maintained here, which is how
 * `@a5c-ai/hooks-adapter-genty` — a public, documented package the hooks CLI
 * pins exactly — was never built, tested or published
 * (docs/release-incident-2026-08-13.md).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { hooksBuildOrder } = require('./lib/release-matrix.cjs');

const repoRoot = path.resolve(__dirname, '..');
const packages = hooksBuildOrder(repoRoot);
const HOOKS_PREFIX = 'packages/adapters/hooks/';

const mode = process.argv[2] || 'build';

function runScript(dir, pkg, scriptName, label = scriptName) {
  console.log(`\n=== ${pkg} (${label}) ===`);
  try {
    execSync(`npm run ${scriptName}`, { cwd: dir, stdio: 'inherit' });
  } catch {
    process.exit(1);
  }
}

if (mode === 'test') {
  for (const pkg of packages) {
    if (!pkg.startsWith(HOOKS_PREFIX)) {
      continue;
    }
    const dir = path.resolve(repoRoot, pkg);
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    if (manifest.scripts?.build) {
      runScript(dir, pkg, 'build', 'build');
    }
  }
}

for (const pkg of packages) {
  if (mode === 'test' && !pkg.startsWith(HOOKS_PREFIX)) {
    console.log(`\n=== ${pkg} (${mode}) skipped: hooks-adapter test mode only runs hooks packages ===`);
    continue;
  }
  const dir = path.resolve(repoRoot, pkg);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const scriptName = mode === 'lint' ? 'lint' : mode;
  if (!manifest.scripts?.[scriptName]) {
    console.log(`\n=== ${pkg} (${mode}) skipped: no ${scriptName} script ===`);
    continue;
  }
  runScript(dir, pkg, scriptName);
}
