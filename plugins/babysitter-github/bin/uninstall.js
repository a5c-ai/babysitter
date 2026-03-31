#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { spawnSync } = require('child_process');
const {
  deregisterCopilotPlugin,
  getCopilotHome,
  getHomeMarketplacePath,
  getHomePluginRoot,
  removeLegacyHooks,
  removeMarketplaceEntry,
} = require('./install-shared');

const PLUGIN_NAME = 'babysitter-github';

/**
 * Attempt to unregister the plugin via `copilot plugin uninstall`.
 * Falls back to manual config.json cleanup if the CLI is not available.
 */
function unregisterViaCopilotCli() {
  const result = spawnSync('copilot', ['plugin', 'uninstall', PLUGIN_NAME], {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    timeout: 30000,
  });

  if (result.status === 0) {
    console.log(`[${PLUGIN_NAME}] Unregistered plugin via 'copilot plugin uninstall'`);
    return true;
  }

  // CLI not available or failed
  const stderr = (result.stderr || '').trim();
  if (result.error || stderr.includes('not found') || stderr.includes('not recognized')) {
    console.log(`[${PLUGIN_NAME}] Copilot CLI not found, using manual cleanup`);
  } else {
    console.warn(`[${PLUGIN_NAME}] 'copilot plugin uninstall' failed: ${stderr || 'unknown error'}, using manual cleanup`);
  }
  return false;
}

function main() {
  const copilotHome = getCopilotHome();
  const pluginRoot = getHomePluginRoot();
  const marketplacePath = getHomeMarketplacePath();
  let removedPlugin = false;

  if (fs.existsSync(pluginRoot)) {
    try {
      fs.rmSync(pluginRoot, { recursive: true, force: true });
      console.log(`[${PLUGIN_NAME}] Removed ${pluginRoot}`);
      removedPlugin = true;
    } catch (err) {
      console.warn(`[${PLUGIN_NAME}] Warning: Could not remove plugin directory ${pluginRoot}: ${err.message}`);
    }
  }

  removeMarketplaceEntry(marketplacePath);

  // Try native copilot CLI unregistration first; fall back to manual config.json
  if (!unregisterViaCopilotCli()) {
    deregisterCopilotPlugin(pluginRoot);
  }

  removeLegacyHooks(copilotHome);

  if (!removedPlugin) {
    console.log(`[${PLUGIN_NAME}] Plugin directory not found, config and hooks cleaned if present.`);
    return;
  }

  console.log(`[${PLUGIN_NAME}] Restart GitHub Copilot CLI to complete uninstallation.`);
}

main();
