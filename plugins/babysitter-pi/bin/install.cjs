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

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main() {
  const { workspace } = parseArgs(process.argv);
  const packageSpec = `npm:${PACKAGE_JSON.name}@${PACKAGE_JSON.version}`;
  if (workspace) {
    console.log(`[babysitter] installing ${packageSpec} into project settings for ${workspace}`);
    run('pi', ['install', '-l', packageSpec], workspace);
    return;
  }

  console.log(`[babysitter] installing ${packageSpec} into global pi settings`);
  run('pi', ['install', packageSpec], process.cwd());
}

main();
