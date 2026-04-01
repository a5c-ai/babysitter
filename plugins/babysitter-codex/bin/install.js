#!/usr/bin/env node
'use strict';

const path = require('path');
const {
  copyPluginBundle,
  ensureGlobalProcessLibrary,
  ensureMarketplaceEntry,
  getCodexHome,
  getHomeMarketplacePath,
  getHomePluginRoot,
  installCodexSurface,
  mergeCodexConfigFile,
  warnWindowsHooks,
} = require('./install-shared');

const PACKAGE_ROOT = path.resolve(__dirname, '..');

function main() {
  const codexHome = getCodexHome();
  const pluginRoot = getHomePluginRoot();
  const marketplacePath = getHomeMarketplacePath();

  console.log(`[babysitter] Installing plugin to ${pluginRoot}`);

  try {
    copyPluginBundle(PACKAGE_ROOT, pluginRoot);
    ensureMarketplaceEntry(marketplacePath, pluginRoot);
    mergeCodexConfigFile(path.join(codexHome, 'config.toml'));
    installCodexSurface(PACKAGE_ROOT, codexHome);

    const active = ensureGlobalProcessLibrary(PACKAGE_ROOT);
    console.log(`[babysitter]   marketplace: ${marketplacePath}`);
    console.log(`[babysitter]   process library: ${active.binding?.dir}`);
    if (active.defaultSpec?.cloneDir) {
      console.log(`[babysitter]   process library clone: ${active.defaultSpec.cloneDir}`);
    }
    console.log(`[babysitter]   process library state: ${active.stateFile}`);
    warnWindowsHooks();
    console.log('[babysitter] Installation complete!');
    console.log('[babysitter] Restart Codex to pick up the installed plugin and config changes.');
  } catch (err) {
    console.error(`[babysitter] Failed to install plugin: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
