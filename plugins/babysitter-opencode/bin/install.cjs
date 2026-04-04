#!/usr/bin/env node
'use strict';

/**
 * Babysitter OpenCode Plugin Installer
 *
 * Copies the babysitter plugin bundle into the OpenCode plugins directory:
 *   <workspace>/.opencode/plugins/babysitter/
 *
 * Registers hooks in OpenCode config, creates the index.js entry point
 * for plugin discovery, and bootstraps the global process library.
 *
 * Usage:
 *   node install.cjs                     # Install into cwd workspace
 *   node install.cjs --workspace /path   # Install into specified workspace
 *   node install.cjs --global            # Global install (user home)
 */

const path = require('path');
const {
  copyPluginBundle,
  ensureGlobalProcessLibrary,
  ensureMarketplaceEntry,
  getHomeMarketplacePath,
  getHomePluginRoot,
  getOpenCodeHome,
  installOpenCodeSurface,
  writeIndexJs,
} = require('./install-shared.cjs');

const PACKAGE_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  let workspace = process.env.OPENCODE_WORKSPACE || process.cwd();
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

function main() {
  const { workspace } = parseArgs(process.argv);
  const openCodeHome = getOpenCodeHome(workspace);
  const pluginRoot = getHomePluginRoot(workspace);
  const marketplacePath = getHomeMarketplacePath(workspace);

  console.log(`[babysitter] Installing OpenCode plugin to ${pluginRoot}`);

  try {
    // 1. Copy plugin bundle
    copyPluginBundle(PACKAGE_ROOT, pluginRoot);
    console.log('[babysitter]   Copied plugin bundle');

    // 2. Write index.js entry point for OpenCode plugin discovery
    writeIndexJs(pluginRoot);
    console.log('[babysitter]   Created index.js entry point');

    // 3. Register in marketplace
    ensureMarketplaceEntry(marketplacePath, pluginRoot);
    console.log(`[babysitter]   Marketplace: ${marketplacePath}`);

    // 4. Install OpenCode surfaces (skills, hooks config)
    installOpenCodeSurface(PACKAGE_ROOT, openCodeHome);
    console.log('[babysitter]   Installed hooks and skills');

    // 5. Bootstrap global process library
    try {
      const active = ensureGlobalProcessLibrary(PACKAGE_ROOT);
      console.log(`[babysitter]   Process library: ${active.binding?.dir || '(default)'}`);
      if (active.defaultSpec?.cloneDir) {
        console.log(`[babysitter]   Process library clone: ${active.defaultSpec.cloneDir}`);
      }
      console.log(`[babysitter]   Process library state: ${active.stateFile}`);
    } catch (err) {
      console.warn(`[babysitter]   Warning: Could not bootstrap process library: ${err.message}`);
      console.warn('[babysitter]   Run "babysitter process-library:clone" manually if needed.');
    }

    console.log('[babysitter] Installation complete!');
    console.log('[babysitter] Restart OpenCode to pick up the installed plugin.');
  } catch (err) {
    console.error(`[babysitter] Failed to install plugin: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
