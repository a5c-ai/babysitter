#!/usr/bin/env node
// Generate all babysitter target plugins from the unified source
// Usage: node scripts/generate-plugins.mjs [--output <dir>] [--marketplace <path>] [--compare <dir>]

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const UNIFIED_SOURCE = join(ROOT, 'plugins/babysitter-unified');
const DEFAULT_OUTPUT = join(ROOT, 'artifacts', 'generated-plugins');
const COMPILER_PKG = join(ROOT, 'packages/extension-mux');

const args = process.argv.slice(2);
const outputDir = resolve(ROOT, getArg('--output') || DEFAULT_OUTPUT);
const compareDir = getArg('--compare') ? resolve(ROOT, getArg('--compare')) : null;
const marketplacePath = getArg('--marketplace') ? resolve(ROOT, getArg('--marketplace')) : null;
const compareOnly = args.includes('--compare-only');

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : null;
}

function resolveUnifiedPluginVersion() {
  const versionsPath = join(UNIFIED_SOURCE, 'versions.json');
  if (existsSync(versionsPath)) {
    const versions = JSON.parse(readFileSync(versionsPath, 'utf8'));
    if (typeof versions.sdkVersion === 'string' && versions.sdkVersion.trim() !== '') {
      return versions.sdkVersion;
    }
  }
  const compilerPkg = JSON.parse(readFileSync(join(COMPILER_PKG, 'package.json'), 'utf8'));
  if (typeof compilerPkg.version === 'string' && compilerPkg.version.trim() !== '') {
    return compilerPkg.version;
  }
  throw new Error('Unable to resolve a unified plugin version.');
}

function syncUnifiedPluginVersion() {
  const manifestPath = join(UNIFIED_SOURCE, 'plugin.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const nextVersion = resolveUnifiedPluginVersion();
  if (manifest.version === nextVersion) {
    return nextVersion;
  }
  manifest.version = nextVersion;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`[generate] Synced plugins/babysitter-unified/plugin.json version -> ${nextVersion}`);
  return nextVersion;
}

// Build the compiler if needed
const distCli = join(COMPILER_PKG, 'dist/cli.js');
if (!existsSync(distCli)) {
  console.log('[generate] Building extension-mux compiler...');
  execSync('npm run build --workspace=@a5c-ai/agent-catalog', {
    cwd: ROOT,
    stdio: 'inherit',
  });
  execSync('npm run build --workspace=@a5c-ai/extension-mux', {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

// Compile all targets
const unifiedVersion = syncUnifiedPluginVersion();
console.log(`[generate] Source: ${relative(ROOT, UNIFIED_SOURCE)}`);
console.log(`[generate] Output: ${relative(ROOT, outputDir) || '.'}`);
console.log(`[generate] Unified plugin version: ${unifiedVersion}`);

if (!compareOnly) {
  resetOutputDir(outputDir);

  const cliArgs = [
    'compile',
    '--target', 'all',
    '--source', UNIFIED_SOURCE,
    '--output', outputDir,
    '--verbose',
    '--verify',
  ];

  if (marketplacePath) {
    cliArgs.push('--marketplace', marketplacePath);
  }

  try {
    execSync(`node ${distCli} ${cliArgs.join(' ')}`, {
      cwd: ROOT,
      stdio: 'inherit',
    });
  } catch {
    console.error('[generate] Compilation failed');
    process.exit(1);
  }

  console.log('[generate] Compilation complete.');
} else if (!existsSync(outputDir)) {
  console.error('[compare] Output directory does not exist. Run generation first.');
  process.exit(1);
}

// Compare if requested
if (compareDir) {
  console.log(`\n[compare] Comparing generated output to ${relative(ROOT, compareDir) || '.'}`);
  const targets = readdirSync(outputDir).filter(
    (d) => statSync(join(outputDir, d)).isDirectory()
  );

  let totalGaps = 0;

  for (const target of targets) {
    const generatedDir = join(outputDir, target);
    const originalDir = join(compareDir, target);
    if (!existsSync(originalDir)) {
      console.log(`  [${target}] SKIP — comparison dir not found: ${relative(ROOT, originalDir)}`);
      continue;
    }

    const generatedFiles = collectFiles(generatedDir, '');
    const originalFiles = collectFiles(originalDir, '');

    const inGenNotOrig = generatedFiles.filter((f) => !originalFiles.includes(f));
    const inOrigNotGen = originalFiles.filter(
      (f) => !generatedFiles.includes(f) && !isIgnoredFile(f)
    );

    const matching = generatedFiles.filter(
      (f) => originalFiles.includes(f) && !isIgnoredFile(f)
    );
    let contentDiffs = 0;
    for (const f of matching) {
      const genContent = readFileSync(join(generatedDir, f), 'utf-8');
      const origContent = readFileSync(join(originalDir, f), 'utf-8');
      if (genContent !== origContent) contentDiffs++;
    }

    const gaps = inGenNotOrig.length + inOrigNotGen.length + contentDiffs;
    totalGaps += gaps;

    if (gaps === 0) {
      console.log(`  [${target}] MATCH ✓ (${matching.length} files)`);
    } else {
      console.log(`  [${target}] GAPS: +${inGenNotOrig.length} new, -${inOrigNotGen.length} missing, ~${contentDiffs} different`);
      if (inGenNotOrig.length > 0) {
        console.log(`    Generated but not in original: ${inGenNotOrig.slice(0, 5).join(', ')}${inGenNotOrig.length > 5 ? ` (+${inGenNotOrig.length - 5} more)` : ''}`);
      }
      if (inOrigNotGen.length > 0) {
        console.log(`    In original but not generated: ${inOrigNotGen.slice(0, 5).join(', ')}${inOrigNotGen.length > 5 ? ` (+${inOrigNotGen.length - 5} more)` : ''}`);
      }
    }
  }

  // Compare marketplace files
  const MARKETPLACE_MAP = {
    '.claude-plugin/marketplace.json': '.claude-plugin/marketplace.json',
    '.agents/plugins/marketplace.json': '.agents/plugins/marketplace.json',
  };

  console.log('\n[compare] Marketplace files:');
  for (const [genRel, origRel] of Object.entries(MARKETPLACE_MAP)) {
    const genPath = join(outputDir, genRel);
    const origPath = join(compareDir, origRel);
    if (!existsSync(genPath)) {
      console.log(`  ${origRel}: NOT GENERATED`);
      continue;
    }
    if (!existsSync(origPath)) {
      console.log(`  ${origRel}: GENERATED (no original to compare)`);
      continue;
    }
    const genContent = readFileSync(genPath, 'utf-8');
    const origContent = readFileSync(origPath, 'utf-8');
    if (genContent === origContent) {
      console.log(`  ${origRel}: MATCH`);
    } else {
      console.log(`  ${origRel}: DIFFERENT (path-only, expected)`);
    }
  }

  console.log(`\n[compare] Total gaps: ${totalGaps}`);
  process.exit(totalGaps > 0 ? 1 : 0);
}

function collectFiles(dir, prefix) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
    const full = join(dir, entry);
    const rel = prefix ? `${prefix}/${entry}` : entry;
    if (statSync(full).isDirectory()) {
      results.push(...collectFiles(full, rel));
    } else {
      results.push(rel);
    }
  }
  return results;
}

function isIgnoredFile(f) {
  return (
    f.startsWith('.a5c/') ||
    f.startsWith('node_modules/') ||
    f.startsWith('dist/') ||
    f.startsWith('test/') ||
    f === 'package-lock.json' ||
    f === 'plugin.lock.json' ||
    f === '.npmrc' ||
    f === '.cursorrules' ||
    f === 'CHANGELOG.md' ||
    f === 'hooks/proxied-hooks.json' ||
    f === 'hooks/hooks.json' ||
    f === 'proxied-hooks.json' ||
    f === '.babysitter-install-attempted' ||
    f.endsWith('.legacy') ||
    f.endsWith('.legacy.ts') ||
    f.includes('sync-command') ||
    f.endsWith('.png') ||
    f.endsWith('.svg')
  );
}

function resetOutputDir(targetDir) {
  const safeRoot = `${ROOT}${sep}`;
  if (targetDir === ROOT || !targetDir.startsWith(safeRoot)) {
    throw new Error(`Refusing to clear unsafe output directory: ${targetDir}`);
  }

  rmSync(targetDir, { recursive: true, force: true });
}
