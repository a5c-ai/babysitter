#!/usr/bin/env node
'use strict';

const path = require('path');
const shared = require('./install-shared');

const PACKAGE_ROOT = path.resolve(__dirname, '..');

function main() {
  const pluginRoot = shared.getHomePluginRoot();
  const marketplacePath = shared.getHomeMarketplacePath();

  console.log(`[${shared.PLUGIN_NAME}] Installing plugin to ${pluginRoot}`);

  try {
    shared.copyPluginBundle(PACKAGE_ROOT, pluginRoot);
    shared.ensureMarketplaceEntry(marketplacePath, pluginRoot);
    if (typeof shared.harnessInstall === 'function') {
      shared.harnessInstall(PACKAGE_ROOT, pluginRoot);
    }
    shared.runPostInstall && shared.runPostInstall(pluginRoot);
    console.log(`[${shared.PLUGIN_NAME}] Installation complete!`);
    console.log(`[${shared.PLUGIN_NAME}] Restart your IDE/CLI to pick up the plugin.`);
  } catch (err) {
    console.error(`[${shared.PLUGIN_NAME}] Failed to install: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
