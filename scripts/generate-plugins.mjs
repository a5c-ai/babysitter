#!/usr/bin/env node
// Generate all babysitter target plugins from the unified source
// Usage: node scripts/generate-plugins.mjs [--output <dir>] [--marketplace <path>] [--compare <dir>]

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const UNIFIED_SOURCE = join(ROOT, 'plugins/babysitter-unified');
const DEFAULT_OUTPUT = join(ROOT, 'generated');
const COMPILER_PKG = join(ROOT, 'packages/agent-plugins-mux');

const args = process.argv.slice(2);
const outputDir = resolve(ROOT, getArg('--output') || DEFAULT_OUTPUT);
const compareDir = getArg('--compare') ? resolve(ROOT, getArg('--compare')) : null;
const marketplacePath = getArg('--marketplace') ? resolve(ROOT, getArg('--marketplace')) : null;
const compareOnly = args.includes('--compare-only');

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : null;
}

// Build the compiler if needed
const distCli = join(COMPILER_PKG, 'dist/cli.js');
if (!existsSync(distCli)) {
  console.log('[generate] Building agent-plugins-mux compiler...');
  execSync('npm run build --workspace=@a5c-ai/agent-plugins-mux', {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

// Compile all targets
console.log(`[generate] Source: ${relative(ROOT, UNIFIED_SOURCE)}`);
console.log(`[generate] Output: ${relative(ROOT, outputDir) || '.'}`);

if (!compareOnly) {
  resetOutputDir(outputDir);

  const cliArgs = [
    'compile',
    '--target', 'all',
    '--source', UNIFIED_SOURCE,
    '--output', outputDir,
    '--verbose',
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

  const ORIGINAL_DIR_MAP = {
    'claude-code': 'plugins/babysitter',
    'codex': 'plugins/babysitter-codex',
    'cursor': 'plugins/babysitter-cursor',
    'gemini': 'plugins/babysitter-gemini',
    'github-copilot': 'plugins/babysitter-github',
    'pi': 'plugins/babysitter-pi',
    'oh-my-pi': 'plugins/babysitter-omp',
    'opencode': 'plugins/babysitter-opencode',
    'openclaw': 'plugins/babysitter-openclaw',
  };

  let totalGaps = 0;

  for (const target of targets) {
    const generatedDir = join(outputDir, target);
    const originalRelPath = ORIGINAL_DIR_MAP[target];
    if (!originalRelPath) continue;

    const originalDir = join(compareDir, originalRelPath);
    if (!existsSync(originalDir)) {
      console.log(`  [${target}] SKIP — original dir not found: ${originalRelPath}`);
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
    f === 'versions.json' ||
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
