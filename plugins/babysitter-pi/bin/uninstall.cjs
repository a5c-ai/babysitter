#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

function parseArgs(argv) {
  const args = {
    harness: 'pi',
    workspace: null,
  };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--harness' && argv[i + 1]) {
      const value = String(argv[++i]).trim();
      if (value !== 'pi' && value !== 'oh-my-pi') {
        throw new Error(`unsupported harness: ${value}`);
      }
      args.harness = value;
    } else if (argv[i] === '--workspace' && argv[i + 1]) {
      args.workspace = path.resolve(argv[++i]);
    } else if (argv[i] === '--global') {
      args.workspace = null;
    } else {
      throw new Error(`unknown argument: ${argv[i]}`);
    }
  }
  return args;
}

function getPluginRoot(args) {
  const base = args.workspace ? path.resolve(args.workspace) : os.homedir();
  const pluginsDir = args.harness === 'oh-my-pi'
    ? path.join(base, '.omp', 'plugins')
    : path.join(base, '.pi', 'plugins');
  return path.join(pluginsDir, 'babysitter-pi');
}

function main() {
  const args = parseArgs(process.argv);
  const pluginRoot = getPluginRoot(args);
  if (!fs.existsSync(pluginRoot)) {
    console.log('[babysitter-pi] Nothing to uninstall.');
    return;
  }
  fs.rmSync(pluginRoot, { recursive: true, force: true });
  console.log(`[babysitter-pi] Removed ${pluginRoot}`);
}

main();
