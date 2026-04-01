#!/usr/bin/env node
'use strict';

const fs = require('fs');
const {
  getCursorHome,
  getHomeMarketplacePath,
  getHomePluginRoot,
  removeManagedHooks,
  removeMarketplaceEntry,
} = require('./install-shared');

function main() {
  const cursorHome = getCursorHome();
  const pluginRoot = getHomePluginRoot();
  const marketplacePath = getHomeMarketplacePath();
  let removedPlugin = false;

  if (fs.existsSync(pluginRoot)) {
    try {
      fs.rmSync(pluginRoot, { recursive: true, force: true });
      console.log(`[babysitter] Removed ${pluginRoot}`);
      removedPlugin = true;
    } catch (err) {
      console.warn(`[babysitter] Warning: Could not remove plugin directory ${pluginRoot}: ${err.message}`);
    }
  }

  removeMarketplaceEntry(marketplacePath);
  removeManagedHooks(cursorHome);

  if (!removedPlugin) {
    console.log('[babysitter] Plugin directory not found, config and hooks cleaned if present.');
    return;
  }

  console.log('[babysitter] Restart Cursor to complete uninstallation.');
}

main();
