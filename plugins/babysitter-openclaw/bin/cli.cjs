#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');

function printUsage() {
  console.error([
    'Usage:',
    '  babysitter-openclaw install [--global]',
    '  babysitter-openclaw install --workspace [path]',
    '  babysitter-openclaw uninstall [--global]',
    '  babysitter-openclaw uninstall --workspace [path]',
    '  babysitter-openclaw version',
    '  babysitter-openclaw help',
  ].join('\n'));
}

function parseArgs(argv) {
  let workspace = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--workspace') {
      const next = argv[i + 1];
      workspace = next && !next.startsWith('-') ? path.resolve(next) : process.cwd();
      if (next && !next.startsWith('-')) {
        i += 1;
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

  if (command === 'version' || command === '--version' || command === '-v') {
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
    console.log(`${pkg.name}@${pkg.version}`);
    return;
  }

  if (command !== 'install' && command !== 'uninstall') {
    console.error(`[babysitter] Unknown command: ${command}`);
    printUsage();
    process.exitCode = 1;
    return;
  }

  const parsed = parseArgs(rest);
  const args = parsed.workspace ? ['--workspace', parsed.workspace] : ['--global'];
  runNodeScript(path.join(PACKAGE_ROOT, 'bin', `${command}.cjs`), args);
}

main();
