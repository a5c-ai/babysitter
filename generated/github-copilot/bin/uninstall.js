#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const shared = require('./install-shared');

function main() {
  const pluginRoot = shared.getHomePluginRoot();
  const marketplacePath = typeof shared.getHomeMarketplacePath === 'function'
    ? shared.getHomeMarketplacePath()
    : null;
  const copilotHome = typeof shared.getCopilotHome === 'function'
    ? shared.getCopilotHome()
    : null;

  if (!fs.existsSync(pluginRoot)) {
    console.log(`[${shared.PLUGIN_NAME}] Plugin not installed at ${pluginRoot}`);
  } else {
    try {
      fs.rmSync(pluginRoot, { recursive: true, force: true });
      console.log(`[${shared.PLUGIN_NAME}] Uninstalled from ${pluginRoot}`);
    } catch (err) {
      console.error(`[${shared.PLUGIN_NAME}] Failed to uninstall: ${err.message}`);
      process.exitCode = 1;
      return;
    }
  }

  try {
    if (typeof shared.deregisterCopilotPlugin === 'function') {
      shared.deregisterCopilotPlugin(pluginRoot);
    }
    if (copilotHome && typeof shared.removeManagedHooks === 'function') {
      shared.removeManagedHooks(copilotHome);
    }
    if (marketplacePath && typeof shared.removeMarketplaceEntry === 'function') {
      shared.removeMarketplaceEntry(marketplacePath);
    }
  } catch (err) {
    console.error(`[${shared.PLUGIN_NAME}] Failed to clean up uninstall state: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
