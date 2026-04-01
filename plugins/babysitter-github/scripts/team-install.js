#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const {
  copyPluginBundle,
  ensureGlobalProcessLibrary,
  ensureMarketplaceEntry,
  installCopilotSurface,
  registerCopilotPlugin,
  warnWindowsHooks,
  writeJson,
} = require('../bin/install-shared');

function parseArgs(argv) {
  const args = {
    workspace: process.cwd(),
    dryRun: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--workspace' && argv[i + 1]) {
      args.workspace = path.resolve(argv[++i]);
    } else if (argv[i] === '--dry-run') {
      args.dryRun = true;
    }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  const packageRoot = path.resolve(process.env.BABYSITTER_PACKAGE_ROOT || path.join(__dirname, '..'));
  const workspaceRoot = args.workspace;
  const workspacePluginRoot = path.join(workspaceRoot, 'plugins', 'babysitter');
  const workspaceMarketplacePath = path.join(workspaceRoot, '.agents', 'plugins', 'marketplace.json');
  const workspaceCopilotDir = path.join(workspaceRoot, '.copilot');

  const installInfo = {
    installedAt: new Date().toISOString(),
    packageRoot,
    workspaceRoot,
    pluginRoot: workspacePluginRoot,
    marketplacePath: workspaceMarketplacePath,
    copilotDir: workspaceCopilotDir,
  };

  if (args.dryRun) {
    console.log(JSON.stringify({
      ok: true,
      dryRun: true,
      installInfo,
    }, null, 2));
    return;
  }

  copyPluginBundle(packageRoot, workspacePluginRoot);
  ensureMarketplaceEntry(workspaceMarketplacePath, workspacePluginRoot);
  registerCopilotPlugin(workspacePluginRoot);
  installCopilotSurface(packageRoot, workspaceCopilotDir);

  const active = ensureGlobalProcessLibrary(packageRoot);
  installInfo.processLibraryStateFile = active.stateFile;
  installInfo.processLibraryRoot = active.binding?.dir || '';
  installInfo.processLibraryCloneDir = active.defaultSpec?.cloneDir || '';

  const outDir = path.join(workspaceRoot, '.a5c', 'team');
  fs.mkdirSync(outDir, { recursive: true });
  writeJson(path.join(outDir, 'install.json'), installInfo);

  const profilePath = path.join(outDir, 'profile.json');
  if (!fs.existsSync(profilePath)) {
    writeJson(profilePath, {
      teamName: 'default',
      pluginRoot: workspacePluginRoot,
      marketplacePath: workspaceMarketplacePath,
      copilotDir: workspaceCopilotDir,
      processLibraryLookupCommand: 'babysitter process-library:active --json',
    });
  }

  warnWindowsHooks();
  console.log('[team-install] complete');
}

main();
