'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const check = process.argv.includes('--check');

const tasks = [
  {
    label: 'sdk-command-templates',
    cmd: process.execPath,
    args: [path.join(REPO_ROOT, 'scripts', 'sync-sdk-command-templates.cjs')],
  },
  {
    label: 'babysitter-codex',
    cmd: process.execPath,
    args: [path.join(REPO_ROOT, 'plugins', 'babysitter-codex', 'scripts', 'sync-command-skills.js')],
  },
  {
    label: 'babysitter-github',
    cmd: process.execPath,
    args: [path.join(REPO_ROOT, 'plugins', 'babysitter-github', 'scripts', 'sync-command-surfaces.js')],
  },
  {
    label: 'babysitter-cursor',
    cmd: process.execPath,
    args: [path.join(REPO_ROOT, 'plugins', 'babysitter-cursor', 'scripts', 'sync-command-surfaces.js')],
  },
  {
    label: 'babysitter-gemini',
    cmd: process.execPath,
    args: [path.join(REPO_ROOT, 'plugins', 'babysitter-gemini', 'scripts', 'sync-command-surfaces.js')],
  },
  {
    label: 'babysitter-pi',
    cmd: process.execPath,
    args: [path.join(REPO_ROOT, 'plugins', 'babysitter-pi', 'scripts', 'sync-command-docs.cjs')],
  },
];

for (const task of tasks) {
  const result = spawnSync(task.cmd, check ? [...task.args, '--check'] : task.args, {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}
