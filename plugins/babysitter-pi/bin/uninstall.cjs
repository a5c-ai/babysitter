#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

function parseArgs(argv) {
  const args = {
    workspace: null,
  };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--workspace' && argv[i + 1]) {
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
  return path.join(base, '.pi', 'plugins', 'babysitter');
}

function main() {
  const args = parseArgs(process.argv);
  const pluginRoot = getPluginRoot(args);
  if (!fs.existsSync(pluginRoot)) {
    console.log('[babysitter] Nothing to uninstall.');
    return;
  }
  fs.rmSync(pluginRoot, { recursive: true, force: true });
  console.log(`[babysitter] Removed ${pluginRoot}`);
}

main();
