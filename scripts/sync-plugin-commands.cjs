'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const UNIFIED_SOURCE = path.join(REPO_ROOT, 'plugins', 'babysitter-unified');
const COMPILER_PKG = path.join(REPO_ROOT, 'packages', 'agent-plugins-mux');
const COMPILER_CLI = path.join(COMPILER_PKG, 'dist', 'cli.js');
const COMPILER_SOURCE_CLI = path.join(COMPILER_PKG, 'src', 'cli.ts');
const check = process.argv.includes('--check');
const targetArgIndex = process.argv.indexOf('--target');
const requestedTarget = targetArgIndex >= 0 ? process.argv[targetArgIndex + 1] : null;

const TARGET_DIR_MAP = {
  codex: 'plugins/babysitter-codex',
  cursor: 'plugins/babysitter-cursor',
  gemini: 'plugins/babysitter-gemini',
  'github-copilot': 'plugins/babysitter-github',
  pi: 'plugins/babysitter-pi',
  'oh-my-pi': 'plugins/babysitter-omp',
  opencode: 'plugins/babysitter-opencode',
  openclaw: 'plugins/babysitter-openclaw',
};

function resolveNpxCommand() {
  return process.platform === 'win32'
    ? path.join(path.dirname(process.execPath), 'npx.cmd')
    : 'npx';
}

function runOrExit(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    ...options,
  });

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

function normalizeTarget(targetName) {
  if (!targetName) {
    return Object.keys(TARGET_DIR_MAP);
  }

  const aliases = {
    github: 'github-copilot',
    omp: 'oh-my-pi',
  };
  const normalized = aliases[targetName] || targetName;
  if (!TARGET_DIR_MAP[normalized]) {
    console.error(`Unknown target '${targetName}'. Valid targets: ${Object.keys(TARGET_DIR_MAP).join(', ')}`);
    process.exit(1);
  }
  return [normalized];
}

function ensureCompilerBuilt() {
  if (fs.existsSync(COMPILER_CLI)) return;
  const catalogDist = path.join(REPO_ROOT, 'packages', 'agent-catalog', 'dist', 'index.js');
  if (!fs.existsSync(catalogDist)) {
    spawnSync('npm', ['run', 'build', '--workspace=@a5c-ai/agent-catalog'], { cwd: REPO_ROOT, stdio: 'inherit' });
  }
  spawnSync('npm', ['run', 'build', '--workspace=@a5c-ai/agent-plugins-mux'], { cwd: REPO_ROOT, stdio: 'inherit' });
}

function compileTargets(outputDir, targets) {
  ensureCompilerBuilt();

  if (fs.existsSync(COMPILER_CLI)) {
    runOrExit(process.execPath, [
      COMPILER_CLI,
      'compile',
      '--target',
      'all',
      '--source',
      UNIFIED_SOURCE,
      '--output',
      outputDir,
    ]);
    return;
  }

  runOrExit(resolveNpxCommand(), [
    '--yes',
    'tsx',
    COMPILER_SOURCE_CLI,
    'compile',
    '--target',
    'all',
    '--source',
    UNIFIED_SOURCE,
    '--output',
    outputDir,
  ]);
}

function collectFiles(dir, prefix = '') {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, relativePath));
      continue;
    }
    results.push(relativePath);
  }
  return results.sort();
}

function isIgnoredGeneratedFile(relativePath) {
  return relativePath === 'versions.json';
}

function syncDirectory(sourceDir, targetDir) {
  for (const relativePath of collectFiles(sourceDir)) {
    if (isIgnoredGeneratedFile(relativePath)) {
      continue;
    }
    const sourcePath = path.join(sourceDir, relativePath);
    const targetPath = path.join(targetDir, relativePath);
    const sourceBytes = fs.readFileSync(sourcePath);
    const existingBytes = fs.existsSync(targetPath) ? fs.readFileSync(targetPath) : null;
    if (existingBytes && existingBytes.equals(sourceBytes)) {
      continue;
    }
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, sourceBytes);
    console.log(`[sync-plugin-commands] updated ${path.relative(REPO_ROOT, targetPath)}`);
  }
}

function checkDirectory(sourceDir, targetDir) {
  const stale = [];
  for (const relativePath of collectFiles(sourceDir)) {
    if (isIgnoredGeneratedFile(relativePath)) {
      continue;
    }
    const sourcePath = path.join(sourceDir, relativePath);
    const targetPath = path.join(targetDir, relativePath);
    const sourceBytes = fs.readFileSync(sourcePath);
    const existingBytes = fs.existsSync(targetPath) ? fs.readFileSync(targetPath) : null;
    if (!existingBytes || !existingBytes.equals(sourceBytes)) {
      stale.push(path.relative(REPO_ROOT, targetPath));
    }
  }
  return stale;
}

function main() {
  const targets = normalizeTarget(requestedTarget);
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'babysitter-plugin-sync-'));

  try {
    compileTargets(tempRoot, targets);

    let stale = [];
    for (const targetName of targets) {
      const generatedDir = path.join(tempRoot, targetName);
      const targetDir = path.join(REPO_ROOT, TARGET_DIR_MAP[targetName]);

      if (check) {
        stale = stale.concat(checkDirectory(generatedDir, targetDir));
        continue;
      }

      syncDirectory(generatedDir, targetDir);
    }

    if (check) {
      if (stale.length === 0) {
        console.log('[sync-plugin-commands] synchronized.');
        return;
      }

      console.error('[sync-plugin-commands] stale generated files detected:');
      for (const file of stale) {
        console.error(`  - ${file}`);
      }
      process.exitCode = 1;
    }
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

main();
