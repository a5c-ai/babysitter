#!/usr/bin/env node
'use strict';

/**
 * Babysitter OpenCode Plugin Uninstaller
 *
 * Removes the babysitter plugin from the OpenCode plugins directory
 * and cleans up hooks config and marketplace entries.
 *
 * Usage:
 *   node uninstall.cjs                     # Uninstall from cwd workspace
 *   node uninstall.cjs --workspace /path   # Uninstall from specified workspace
 *   node uninstall.cjs --global            # Global uninstall
 */

const fs = require('fs');
const path = require('path');
const {
  getHomeMarketplacePath,
  getHomePluginRoot,
  getOpenCodeHome,
  removeManagedHooks,
  removeMarketplaceEntry,
} = require('./install-shared.cjs');

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
  let removedPlugin = false;

  console.log(`[babysitter] Uninstalling OpenCode plugin from ${pluginRoot}`);

  // 1. Remove plugin directory
  if (fs.existsSync(pluginRoot)) {
    try {
      fs.rmSync(pluginRoot, { recursive: true, force: true });
      console.log(`[babysitter]   Removed ${pluginRoot}`);
      removedPlugin = true;
    } catch (err) {
      console.warn(`[babysitter]   Warning: Could not remove plugin directory: ${err.message}`);
    }
  }

  // 2. Remove marketplace entry
  removeMarketplaceEntry(marketplacePath);
  console.log('[babysitter]   Cleaned marketplace entry');

  // 3. Remove managed hooks from OpenCode config
  removeManagedHooks(openCodeHome);
  console.log('[babysitter]   Cleaned hooks config');

  // 4. Clean up empty parent directories
  const pluginsDir = path.dirname(pluginRoot);
  try {
    const remaining = fs.readdirSync(pluginsDir);
    if (remaining.length === 0) {
      fs.rmdirSync(pluginsDir);
      console.log('[babysitter]   Removed empty plugins/ directory');
    }
  } catch { /* best-effort */ }

  if (!removedPlugin) {
    console.log('[babysitter] Plugin directory not found; config and hooks cleaned if present.');
    return;
  }

  console.log('[babysitter] Uninstallation complete. Restart OpenCode to finish removal.');
}

main();
