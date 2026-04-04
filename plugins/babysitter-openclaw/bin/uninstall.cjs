#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const PLUGIN_NAME = 'babysitter';

// ── Directories ──────────────────────────────────────────────────────────

function getUserHome() {
  if (process.env.USERPROFILE) return path.resolve(process.env.USERPROFILE);
  if (process.env.HOME) return path.resolve(process.env.HOME);
  return os.homedir();
}

function getOpenClawHome() {
  if (process.env.OPENCLAW_HOME) return path.resolve(process.env.OPENCLAW_HOME);
  return path.join(getUserHome(), '.openclaw');
}

function getPluginRoot(workspace) {
  if (workspace) {
    return path.join(workspace, '.openclaw', 'plugins', PLUGIN_NAME);
  }
  return path.join(getOpenClawHome(), 'plugins', PLUGIN_NAME);
}

// ── Args ─────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  let workspace = null;
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--workspace') {
      const next = argv[i + 1];
      workspace = next && !next.startsWith('-') ? path.resolve(argv[++i]) : process.cwd();
      continue;
    }
    if (arg === '--global') {
      workspace = null;
      continue;
    }
    throw new Error(`unknown argument: ${arg}`);
  }
  return { workspace };
}

// ── File helpers ─────────────────────────────────────────────────────────

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

// ── Remove plugin directory ──────────────────────────────────────────────

function removePluginDir(pluginRoot) {
  if (!fs.existsSync(pluginRoot)) {
    console.log(`[babysitter] Plugin directory not found: ${pluginRoot}`);
    return false;
  }
  try {
    fs.rmSync(pluginRoot, { recursive: true, force: true });
    console.log(`[babysitter] Removed plugin directory: ${pluginRoot}`);
    return true;
  } catch (err) {
    console.warn(`[babysitter] Warning: Could not remove ${pluginRoot}: ${err.message}`);
    return false;
  }
}

// ── Remove OpenClaw config entry ─────────────────────────────────────────

function removeOpenClawConfig(workspace) {
  const configDir = workspace
    ? path.join(workspace, '.openclaw')
    : getOpenClawHome();

  const pluginsConfigPath = path.join(configDir, 'plugins.json');
  if (!fs.existsSync(pluginsConfigPath)) return;

  try {
    const config = readJson(pluginsConfigPath);
    if (config.plugins && config.plugins[PLUGIN_NAME]) {
      delete config.plugins[PLUGIN_NAME];
      writeJson(pluginsConfigPath, config);
      console.log(`[babysitter] Removed plugin entry from: ${pluginsConfigPath}`);
    }
  } catch (err) {
    console.warn(`[babysitter] Warning: Could not update config: ${err.message}`);
  }
}

// ── Remove marketplace entry ─────────────────────────────────────────────

function removeMarketplaceEntry() {
  const marketplacePath = path.join(getUserHome(), '.a5c', 'marketplace', 'marketplace.json');
  if (!fs.existsSync(marketplacePath)) return;

  try {
    const marketplace = readJson(marketplacePath);
    if (!Array.isArray(marketplace.plugins)) return;

    const before = marketplace.plugins.length;
    marketplace.plugins = marketplace.plugins.filter((e) => e && e.name !== PLUGIN_NAME);
    if (marketplace.plugins.length < before) {
      writeJson(marketplacePath, marketplace);
      console.log(`[babysitter] Removed marketplace entry: ${marketplacePath}`);
    }
  } catch (err) {
    console.warn(`[babysitter] Warning: Could not update marketplace: ${err.message}`);
  }
}

// ── Remove legacy hook scripts from OpenClaw hooks dir ───────────────────

function removeLegacyHookScripts(workspace) {
  const hooksDir = workspace
    ? path.join(workspace, '.openclaw', 'hooks')
    : path.join(getOpenClawHome(), 'hooks');

  const legacyScripts = [
    'babysitter-session-start.sh',
    'babysitter-stop-hook.sh',
  ];

  for (const script of legacyScripts) {
    const scriptPath = path.join(hooksDir, script);
    if (fs.existsSync(scriptPath)) {
      fs.rmSync(scriptPath, { force: true });
      console.log(`[babysitter] Removed hook script: ${scriptPath}`);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────

function main() {
  const { workspace } = parseArgs(process.argv);
  const pluginRoot = getPluginRoot(workspace);
  const scope = workspace ? `project (${workspace})` : 'global';

  console.log(`[babysitter] Uninstalling babysitter plugin for OpenClaw (${scope})`);

  // 1. Remove plugin directory
  const removed = removePluginDir(pluginRoot);

  // 2. Remove config entry
  removeOpenClawConfig(workspace);

  // 3. Remove marketplace entry (global only)
  if (!workspace) {
    removeMarketplaceEntry();
  }

  // 4. Remove legacy hook scripts
  removeLegacyHookScripts(workspace);

  if (removed) {
    console.log('[babysitter] Uninstallation complete. Restart OpenClaw to apply changes.');
  } else {
    console.log('[babysitter] Plugin was not installed; cleaned up config entries if present.');
  }
}

main();
