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
 *   node install.cjs --accomplish        # Install only to Accomplish AI data dir
 */

const path = require('path');
const {
  copyPluginBundle,
  ensureGlobalProcessLibrary,
  ensureMarketplaceEntry,
  getAccomplishOpenCodeHome,
  getHomeMarketplacePath,
  getHomePluginRoot,
  getOpenCodeHome,
  installAccomplishSurface,
  installOpenCodeSurface,
  isAccomplishInstalled,
  writeIndexJs,
} = require('./install-shared.cjs');

const PACKAGE_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  let workspace = process.env.OPENCODE_WORKSPACE || process.cwd();
  let accomplish = false;
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
    if (arg === '--accomplish') {
      accomplish = true;
      continue;
    }
    throw new Error(`unknown argument: ${arg}`);
  }
  return { workspace, accomplish };
}

function installStandardOpenCode(workspace) {
  const openCodeHome = getOpenCodeHome(workspace);
  const pluginRoot = getHomePluginRoot(workspace);
  const marketplacePath = getHomeMarketplacePath(workspace);

  console.log(`[babysitter] Installing OpenCode plugin to ${pluginRoot}`);

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
}

function installToAccomplish() {
  const accomplishHome = getAccomplishOpenCodeHome();
  console.log(`[babysitter] Installing plugin to Accomplish AI: ${accomplishHome}`);

  installAccomplishSurface(PACKAGE_ROOT, accomplishHome);

  console.log('[babysitter]   Copied plugin bundle to Accomplish');
  console.log('[babysitter]   Created index.js entry point for Accomplish');
  console.log('[babysitter]   Installed hooks and skills for Accomplish');
  console.log('[babysitter] Accomplish AI installation complete.');
  console.log('[babysitter] Restart Accomplish to pick up the installed plugin.');
}

function main() {
  const { workspace, accomplish } = parseArgs(process.argv);

  try {
    // If --accomplish is used without --global/--workspace, install only to Accomplish
    if (accomplish && workspace !== null) {
      installToAccomplish();
      return;
    }

    // Standard OpenCode install
    installStandardOpenCode(workspace);

    // Auto-detect Accomplish and install there too (unless --accomplish was explicit)
    if (!accomplish) {
      try {
        if (isAccomplishInstalled()) {
          console.log('[babysitter] Detected Accomplish AI installation.');
          installToAccomplish();
        }
      } catch (err) {
        console.warn(`[babysitter]   Warning: Accomplish AI detection failed: ${err.message}`);
      }
    } else {
      // --accomplish combined with --global: install to both
      installToAccomplish();
    }

    console.log('[babysitter] Installation complete!');
    console.log('[babysitter] Restart OpenCode to pick up the installed plugin.');
  } catch (err) {
    console.error(`[babysitter] Failed to install plugin: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
