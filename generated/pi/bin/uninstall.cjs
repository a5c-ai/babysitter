#!/usr/bin/env node
'use strict';

const fs = require('fs');
const shared = require('./install-shared');

function main() {
  const pluginRoot = shared.getHomePluginRoot();

  if (!fs.existsSync(pluginRoot)) {
    console.log(`[${shared.PLUGIN_NAME}] Plugin not installed at ${pluginRoot}`);
    return;
  }

  try {
    fs.rmSync(pluginRoot, { recursive: true, force: true });
    console.log(`[${shared.PLUGIN_NAME}] Uninstalled from ${pluginRoot}`);
  } catch (err) {
    console.error(`[${shared.PLUGIN_NAME}] Failed to uninstall: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
