#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const syncScript = path.join(REPO_ROOT, 'scripts', 'sync-plugin-commands.cjs');
const args = [syncScript, '--target', 'github-copilot'];

if (process.argv.includes('--check')) {
  args.push('--check');
}

const result = spawnSync(process.execPath, args, {
  cwd: REPO_ROOT,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
