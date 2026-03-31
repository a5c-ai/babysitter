#!/usr/bin/env node
'use strict';

const path = require('path');
const {
  copyPluginBundle,
  ensureGlobalProcessLibrary,
  ensureMarketplaceEntry,
  getCursorHome,
  getHomeMarketplacePath,
  getHomePluginRoot,
  installCursorSurface,
  warnWindowsHooks,
} = require('./install-shared');

const PACKAGE_ROOT = path.resolve(__dirname, '..');

function main() {
  const cursorHome = getCursorHome();
  const pluginRoot = getHomePluginRoot();
  const marketplacePath = getHomeMarketplacePath();

  console.log(`[babysitter-cursor] Installing plugin to ${pluginRoot}`);

  try {
    copyPluginBundle(PACKAGE_ROOT, pluginRoot);
    ensureMarketplaceEntry(marketplacePath, pluginRoot);
    installCursorSurface(PACKAGE_ROOT, cursorHome);

    const active = ensureGlobalProcessLibrary(PACKAGE_ROOT);
    console.log(`[babysitter-cursor]   marketplace: ${marketplacePath}`);
    console.log(`[babysitter-cursor]   process library: ${active.binding?.dir}`);
    if (active.defaultSpec?.cloneDir) {
      console.log(`[babysitter-cursor]   process library clone: ${active.defaultSpec.cloneDir}`);
    }
    console.log(`[babysitter-cursor]   process library state: ${active.stateFile}`);
    warnWindowsHooks();
    console.log('[babysitter-cursor] Installation complete!');
    console.log('[babysitter-cursor] Restart Cursor to pick up the installed plugin and config changes.');
  } catch (err) {
    console.error(`[babysitter-cursor] Failed to install plugin: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
