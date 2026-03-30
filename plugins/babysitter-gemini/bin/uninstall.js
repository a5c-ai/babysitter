#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const EXTENSION_DIR_NAME = 'babysitter-gemini';

function parseArgs(argv) {
  const args = { workspace: null };
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

function getExtensionRoot(workspace) {
  const base = workspace ? path.resolve(workspace) : os.homedir();
  return path.join(base, '.gemini', 'extensions', EXTENSION_DIR_NAME);
}

function main() {
  const args = parseArgs(process.argv);
  const extensionRoot = getExtensionRoot(args.workspace);
  if (!fs.existsSync(extensionRoot)) {
    console.log('[babysitter-gemini] Nothing to uninstall.');
    return;
  }
  fs.rmSync(extensionRoot, { recursive: true, force: true });
  console.log(`[babysitter-gemini] Removed ${extensionRoot}`);
}

main();
