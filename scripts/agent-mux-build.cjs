#!/usr/bin/env node
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const packages = [
  'packages/atlas',
  'packages/agent-mux/observability',
  'packages/agent-mux/core',
  'packages/agent-mux/adapters',
  'packages/agent-mux/harness-mock',
  'packages/agent-mux/ui',
  'packages/agent-mux/gateway',
  'packages/transport-mux',
  'packages/agent-mux/cli',
  'packages/agent-mux/sdk',
  'packages/agent-mux/tui',
  'packages/agent-mux/webui',
];

function parseCliArgs(argv = process.argv.slice(2)) {
  const separatorIndex = argv.indexOf('--');
  const positionalArgs = separatorIndex === -1 ? argv : argv.slice(0, separatorIndex);
  const extraArgs = separatorIndex === -1 ? [] : argv.slice(separatorIndex + 1);

  return {
    mode: positionalArgs[0] || 'build',
    targetPackage: positionalArgs[1],
    extraArgs,
  };
}

function selectPackages(mode, targetPackage, packageList = packages) {
  if (!targetPackage) {
    return packageList;
  }

  const targetIndex = packageList.indexOf(targetPackage);
  if (targetIndex === -1) {
    throw new Error(`Unknown agent-mux package target: ${targetPackage}`);
  }

  return mode === 'build' ? packageList.slice(0, targetIndex + 1) : [targetPackage];
}

function quote(value) {
  return `"${value.replace(/(["$`\\])/g, '\\$1')}"`;
}

function collectTestFiles(rootDir, fsImpl = fs, root = repoRoot) {
  if (!fsImpl.existsSync(rootDir)) {
    return [];
  }

  const entries = fsImpl.readdirSync(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(fullPath, fsImpl, root));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!entry.name.endsWith('.test.ts') && !entry.name.endsWith('.test.tsx')) {
      continue;
    }

    files.push(path.relative(root, fullPath).split(path.sep).join('/'));
  }

  return files.sort();
}

function getTestRoots(pkg) {
  if (pkg === 'packages/agent-mux/sdk') {
    return ['packages/agent-mux/tests', `${pkg}/tests`, `${pkg}/src`];
  }

  return [
    `${pkg}/tests`,
    `${pkg}/src`,
  ];
}

function resolveTestSelection(pkg, extraArgs, root = repoRoot, fsImpl = fs) {
  if (extraArgs.length > 0) {
    return {
      testFiles: [extraArgs[0]],
      forwardedArgs: extraArgs.slice(1),
    };
  }

  return {
    testFiles: [...new Set(getTestRoots(pkg).flatMap((testRoot) => collectTestFiles(path.join(root, testRoot), fsImpl, root)))],
    forwardedArgs: [],
  };
}

function buildVitestCommand(testFiles, forwardedArgs = []) {
  const args = [
    'npx vitest run --config vitest.config.ts',
    ...testFiles.map(quote),
    ...forwardedArgs.map(quote),
  ];

  return args.join(' ');
}

function run(argv = process.argv.slice(2), options = {}) {
  const {
    repoRoot: root = repoRoot,
    packageList = packages,
    execSyncImpl = execSync,
    fsImpl = fs,
    log = console.log,
    error = console.error,
  } = options;
  const { mode, targetPackage, extraArgs } = parseCliArgs(argv);

  if (mode !== 'build' && mode !== 'test') {
    error(`Unknown agent-mux mode: ${mode}`);
    return 1;
  }

  if (mode !== 'test' && extraArgs.length > 0) {
    error('Extra arguments are only supported for test mode after `--`.');
    return 1;
  }

  let selectedPackages;
  try {
    selectedPackages = selectPackages(mode, targetPackage, packageList);
  } catch (err) {
    error(err.message);
    return 1;
  }

  for (const pkg of selectedPackages) {
    const dir = path.join(root, pkg);
    const manifest = JSON.parse(fsImpl.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    const scriptName = mode === 'test' ? 'test' : (manifest.scripts?.['build:local'] ? 'build:local' : 'build');

    if (mode === 'test') {
      // `test <pkg> -- <file> [vitest args...]` opts into an explicit focused target.
      const { testFiles, forwardedArgs } = resolveTestSelection(pkg, extraArgs, root, fsImpl);
      const vitestCommand = buildVitestCommand(testFiles, forwardedArgs);

      if (testFiles.length === 0) {
        log(`\n=== ${pkg} (${mode}) skipped: no test files ===`);
        continue;
      }

      log(`\n=== ${pkg} (${mode}) ===`);
      try {
        execSyncImpl(vitestCommand, {
          cwd: root,
          stdio: 'inherit',
        });
      } catch {
        return 1;
      }
      continue;
    }

    if (!manifest.scripts?.[scriptName]) {
      log(`\n=== ${pkg} (${mode}) skipped: no ${scriptName} script ===`);
      continue;
    }

    log(`\n=== ${pkg} (${mode}) ===`);
    try {
      execSyncImpl(`npm run ${scriptName}`, { cwd: dir, stdio: 'inherit' });
    } catch {
      return 1;
    }
  }

  return 0;
}

if (require.main === module) {
  process.exitCode = run();
}

module.exports = {
  buildVitestCommand,
  collectTestFiles,
  getTestRoots,
  packages,
  parseCliArgs,
  quote,
  resolveTestSelection,
  run,
  selectPackages,
};
