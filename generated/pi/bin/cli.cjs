#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
let shared;
try { shared = require('./install-shared'); } catch {}

function printUsage() {
  console.error([
    'Usage:',
    '  babysitter-pi install [--global]',
    '  babysitter-pi install --workspace [path]',
    '  babysitter-pi uninstall',
  ].join('\n'));
}

function parseInstallArgs(argv) {
  let scope = 'global';
  let workspace = null;
  const passthrough = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--global') {
      scope = 'global';
      continue;
    }
    if (arg === '--workspace') {
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

  return { scope, workspace, passthrough };
}

function runNodeScript(scriptPath, args, extraEnv = {}) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
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
    if (shared && typeof shared.harnessCliRoute === 'function' && shared.harnessCliRoute(rest, PACKAGE_ROOT, runNodeScript)) {
      return;
    }
    const parsed = parseInstallArgs(rest);
    if (parsed.scope === 'workspace') {
      const args = [];
      if (parsed.workspace) {
        args.push('--workspace', parsed.workspace);
      }
      args.push(...parsed.passthrough);
      runNodeScript(
        path.join(PACKAGE_ROOT, 'scripts', 'team-install.cjs'),
        args,
        { PLUGIN_PACKAGE_ROOT: PACKAGE_ROOT },
      );
      return;
    }
    runNodeScript(path.join(PACKAGE_ROOT, 'bin', 'install.cjs'), parsed.passthrough);
    return;
  }

  if (command === 'uninstall') {
    runNodeScript(path.join(PACKAGE_ROOT, 'bin', 'uninstall.cjs'), rest);
    return;
  }

  printUsage();
  process.exitCode = 1;
}

main();
