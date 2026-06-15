'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const check = process.argv.includes('--check');

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

function main() {
  runOrExit(process.execPath, [
    path.join(REPO_ROOT, 'scripts', 'sync-sdk-command-templates.cjs'),
    ...(check ? ['--check'] : []),
  ]);

  if (!check) {
    console.log('[sync-plugin-commands] synchronized.');
  }
}

main();
