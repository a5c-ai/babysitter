#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));

function main() {
  const result = spawnSync('omp', ['plugin', 'uninstall', PACKAGE_JSON.name], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });
  process.exitCode = result.status ?? 1;
}

main();
