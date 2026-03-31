#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');
const {
  copyPluginBundle,
  ensureGlobalProcessLibrary,
  ensureMarketplaceEntry,
  getCopilotHome,
  getHomeMarketplacePath,
  getHomePluginRoot,
  installCopilotSurface,
  warnWindowsHooks,
} = require('./install-shared');

const PACKAGE_ROOT = path.resolve(__dirname, '..');

/**
 * Attempt to register the plugin via `copilot plugin install ./path`.
 * Falls back to manual config.json registration if the CLI is not available.
 */
function registerViaCopilotCli(pluginRoot) {
  const result = spawnSync('copilot', ['plugin', 'install', pluginRoot], {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    timeout: 30000,
  });

  if (result.status === 0) {
    console.log(`[babysitter-github] Registered plugin via 'copilot plugin install'`);
    return true;
  }

  // CLI not available or failed -- fall back to manual registration
  const stderr = (result.stderr || '').trim();
  if (result.error || stderr.includes('not found') || stderr.includes('not recognized')) {
    console.log(`[babysitter-github] Copilot CLI not found, using manual registration`);
  } else {
    console.warn(`[babysitter-github] 'copilot plugin install' failed: ${stderr || 'unknown error'}, using manual registration`);
  }
  return false;
}

function main() {
  const copilotHome = getCopilotHome();
  const pluginRoot = getHomePluginRoot();
  const marketplacePath = getHomeMarketplacePath();

  console.log(`[babysitter-github] Installing plugin to ${pluginRoot}`);

  try {
    copyPluginBundle(PACKAGE_ROOT, pluginRoot);
    ensureMarketplaceEntry(marketplacePath, pluginRoot);

    // Try native copilot CLI registration first; fall back to manual config.json
    if (!registerViaCopilotCli(pluginRoot)) {
      const { registerCopilotPlugin } = require('./install-shared');
      registerCopilotPlugin(pluginRoot);
    }

    installCopilotSurface(PACKAGE_ROOT, copilotHome);

    const active = ensureGlobalProcessLibrary(PACKAGE_ROOT);
    console.log(`[babysitter-github]   marketplace: ${marketplacePath}`);
    console.log(`[babysitter-github]   copilot config: ${path.join(copilotHome, 'config.json')}`);
    console.log(`[babysitter-github]   process library: ${active.binding?.dir}`);
    if (active.defaultSpec?.cloneDir) {
      console.log(`[babysitter-github]   process library clone: ${active.defaultSpec.cloneDir}`);
    }
    console.log(`[babysitter-github]   process library state: ${active.stateFile}`);
    warnWindowsHooks();
    console.log('[babysitter-github] Installation complete!');
    console.log('[babysitter-github] Restart GitHub Copilot CLI to pick up the installed plugin and config changes.');
  } catch (err) {
    console.error(`[babysitter-github] Failed to install plugin: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
