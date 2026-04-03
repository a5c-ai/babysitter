#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');

function printUsage() {
  console.error([
    'Usage:',
    '  babysitter-omp install [--global]',
    '  babysitter-omp install --workspace [path]',
    '  babysitter-omp uninstall [--global]',
    '  babysitter-omp uninstall --workspace [path]',
  ].join('\n'));
}

function parseArgs(argv) {
  let workspace = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--workspace') {
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        workspace = path.resolve(next);
        i += 1;
      } else {
        workspace = process.cwd();
      }
      continue;
    }
    if (arg === '--global') {
      workspace = null;
      continue;
    }
    throw new Error(`unknown argument: ${arg}`);
  }

  return { workspace };
}

function runNodeScript(scriptPath, args) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });
  process.exitCode = result.status ?? 1;
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printUsage();
    process.exitCode = command ? 0 : 1;
    return;
  }

  if (command !== 'install' && command !== 'uninstall') {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const parsed = parseArgs(rest);
  const args = [];
  if (parsed.workspace) {
    args.push('--workspace', parsed.workspace);
  } else {
    args.push('--global');
  }

  runNodeScript(path.join(PACKAGE_ROOT, 'bin', `${command}.cjs`), args);
}

main();
