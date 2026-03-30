#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');

function printUsage() {
  console.error([
    'Usage:',
    '  babysitter-codex install [--global]',
    '  babysitter-codex install --workspace [path]',
    '  babysitter-codex uninstall',
  ].join('\n'));
}

function parseInstallArgs(argv) {
  let scope = 'global';
  let workspace = null;
  const passthrough = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--global') {
      if (scope === 'workspace') {
        throw new Error('install accepts either --global or --workspace, not both');
      }
      scope = 'global';
      continue;
    }
    if (arg === '--workspace') {
      if (scope === 'global' && workspace !== null) {
        throw new Error('install accepts either --global or --workspace, not both');
      }
      scope = 'workspace';
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        workspace = path.resolve(next);
        i += 1;
      } else {
        workspace = process.cwd();
      }
      continue;
    }
    passthrough.push(arg);
  }

  return {
    scope,
    workspace,
    passthrough,
  };
}

function runNodeScript(scriptPath, args, extraEnv = {}) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      ...extraEnv,
    },
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

  if (command === 'install') {
    const parsed = parseInstallArgs(rest);
    if (parsed.scope === 'workspace') {
      const args = [];
      if (parsed.workspace) {
        args.push('--workspace', parsed.workspace);
      }
      args.push(...parsed.passthrough);
      runNodeScript(
        path.join(PACKAGE_ROOT, 'scripts', 'team-install.js'),
        args,
        { BABYSITTER_PACKAGE_ROOT: PACKAGE_ROOT },
      );
      return;
    }
    runNodeScript(path.join(PACKAGE_ROOT, 'bin', 'install.js'), parsed.passthrough);
    return;
  }

  if (command === 'uninstall') {
    runNodeScript(path.join(PACKAGE_ROOT, 'bin', 'uninstall.js'), rest);
    return;
  }

  printUsage();
  process.exitCode = 1;
}

main();
