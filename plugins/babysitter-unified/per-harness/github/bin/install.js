#!/usr/bin/env node
'use strict';

const path = require('path');
const shared = require('./install-shared');

const PACKAGE_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  let workspace = null;
  let cloudAgent = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--cloud-agent') {
      cloudAgent = true;
      continue;
    }
    if (arg === '--workspace') {
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        workspace = path.resolve(next);
        i += 1;
      } else {
        workspace = process.cwd();
      }
    }
  }

  return { cloudAgent, workspace };
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.cloudAgent) {
    if (!options.workspace) {
      console.error(`[${shared.PLUGIN_NAME}] Failed to install: --cloud-agent requires --workspace <path>.`);
      process.exitCode = 1;
      return;
    }

    try {
      const installResult = shared.installCloudAgentSurface(PACKAGE_ROOT, options.workspace);
      shared.ensureGlobalProcessLibrary(PACKAGE_ROOT);
      console.log(`[${shared.PLUGIN_NAME}] Installed cloud-agent support into ${options.workspace}`);
      if (installResult.setupWorkflow && installResult.setupWorkflow.examplePath) {
        console.log(
          `[${shared.PLUGIN_NAME}] Existing copilot setup workflow preserved; merge candidate written to ${installResult.setupWorkflow.examplePath}`,
        );
      }
      return;
    } catch (err) {
      console.error(`[${shared.PLUGIN_NAME}] Failed to install cloud-agent support: ${err.message}`);
      process.exitCode = 1;
      return;
    }
  }

  const pluginRoot = shared.getHomePluginRoot();
  const marketplacePath = shared.getHomeMarketplacePath();

  console.log(`[${shared.PLUGIN_NAME}] Installing plugin to ${pluginRoot}`);

  try {
    shared.copyPluginBundle(PACKAGE_ROOT, pluginRoot);
    shared.ensureMarketplaceEntry(marketplacePath, pluginRoot);
    if (typeof shared.registerCopilotPlugin === 'function') {
      shared.registerCopilotPlugin(pluginRoot);
    }
    if (typeof shared.installCopilotSurface === 'function' && typeof shared.getCopilotHome === 'function') {
      shared.installCopilotSurface(PACKAGE_ROOT, shared.getCopilotHome());
    }
    if (typeof shared.warnWindowsHooks === 'function') {
      shared.warnWindowsHooks();
    }
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
