#!/usr/bin/env node
'use strict';

const fs = require('fs');
const {
  getCodexHome,
  getHomeMarketplacePath,
  getHomePluginRoot,
  removeLegacyCodexSurface,
  removeMarketplaceEntry,
} = require('./install-shared');

function main() {
  const codexHome = getCodexHome();
  const pluginRoot = getHomePluginRoot();
  const marketplacePath = getHomeMarketplacePath();
  let removedPlugin = false;

  if (fs.existsSync(pluginRoot)) {
    try {
      fs.rmSync(pluginRoot, { recursive: true, force: true });
      console.log(`[babysitter-codex] Removed ${pluginRoot}`);
      removedPlugin = true;
    } catch (err) {
      console.warn(`[babysitter-codex] Warning: Could not remove plugin directory ${pluginRoot}: ${err.message}`);
    }
  }

  removeMarketplaceEntry(marketplacePath);
  removeLegacyCodexSurface(codexHome);

  if (!removedPlugin) {
    console.log('[babysitter-codex] Plugin directory not found, legacy Codex surface cleaned if present.');
    return;
  }

  console.log('[babysitter-codex] Restart Codex to complete uninstallation.');
}

main();
