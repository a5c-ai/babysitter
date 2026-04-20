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
  installCloudAgentSurface,
  installCopilotSurface,
  warnWindowsHooks,
} = require('./install-shared');

const PACKAGE_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {
    cloudAgent: false,
    workspace: process.cwd(),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--cloud-agent') {
      args.cloudAgent = true;
      continue;
    }
    if (arg === '--workspace') {
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) {
        args.workspace = path.resolve(next);
        i += 1;
      } else {
        args.workspace = process.cwd();
      }
    }
  }

  return args;
}

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
    console.log(`[babysitter] Registered plugin via 'copilot plugin install'`);
    return true;
  }

  // CLI not available or failed -- fall back to manual registration
  const stderr = (result.stderr || '').trim();
  if (result.error || stderr.includes('not found') || stderr.includes('not recognized')) {
    console.log(`[babysitter] Copilot CLI not found, using manual registration`);
  } else {
    console.warn(`[babysitter] 'copilot plugin install' failed: ${stderr || 'unknown error'}, using manual registration`);
  }
  return false;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const copilotHome = getCopilotHome();
  const pluginRoot = getHomePluginRoot();
  const marketplacePath = getHomeMarketplacePath();

  if (args.cloudAgent) {
    const active = ensureGlobalProcessLibrary(PACKAGE_ROOT);
    const installed = installCloudAgentSurface(PACKAGE_ROOT, args.workspace);
    console.log(`[babysitter] Installed Copilot cloud-agent support into ${args.workspace}`);
    console.log(`[babysitter]   plugin bundle: ${installed.bundleRoot}`);
    console.log(`[babysitter]   skills: ${path.join(args.workspace, '.github', 'skills')}`);
    console.log(`[babysitter]   instructions: ${installed.copilotInstructionsPath}`);
    console.log(`[babysitter]   agents: ${installed.agentsPath}`);
    if (installed.setupWorkflow.needsManualMerge) {
      console.warn(`[babysitter] Existing copilot-setup-steps workflow preserved: ${installed.setupWorkflow.workflowPath}`);
      console.warn(`[babysitter] Merge Babysitter setup steps from: ${installed.setupWorkflow.examplePath}`);
    } else {
      console.log(`[babysitter]   setup workflow: ${installed.setupWorkflow.workflowPath}`);
    }
    console.log(`[babysitter]   process library: ${active.binding?.dir}`);
    console.log(`[babysitter]   process library state: ${active.stateFile}`);
    console.log('[babysitter] Cloud-agent installation complete!');
    return;
  }

  console.log(`[babysitter] Installing plugin to ${pluginRoot}`);

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
    console.log(`[babysitter]   marketplace: ${marketplacePath}`);
    console.log(`[babysitter]   copilot config: ${path.join(copilotHome, 'config.json')}`);
    console.log(`[babysitter]   process library: ${active.binding?.dir}`);
    if (active.defaultSpec?.cloneDir) {
      console.log(`[babysitter]   process library clone: ${active.defaultSpec.cloneDir}`);
    }
    console.log(`[babysitter]   process library state: ${active.stateFile}`);
    warnWindowsHooks();
    console.log('[babysitter] Installation complete!');
    console.log('[babysitter] Restart GitHub Copilot CLI to pick up the installed plugin and config changes.');
  } catch (err) {
    console.error(`[babysitter] Failed to install plugin: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
