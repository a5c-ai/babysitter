#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));

function parseArgs(argv) {
  let workspace = null;
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--workspace') {
      const next = argv[i + 1];
      workspace = next && !next.startsWith('-') ? path.resolve(argv[++i]) : process.cwd();
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

function main() {
  const { workspace } = parseArgs(process.argv);
  const result = workspace
    ? spawnSync('omp', ['plugin', 'link', path.resolve(workspace, 'plugins', 'babysitter-omp')], {
        cwd: workspace,
        stdio: 'inherit',
        env: process.env,
      })
    : spawnSync('omp', ['plugin', 'install', `${PACKAGE_JSON.name}@${PACKAGE_JSON.version}`], {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: process.env,
      });
  process.exitCode = result.status ?? 1;
}

main();
