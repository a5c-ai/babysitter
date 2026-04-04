#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PLUGIN_NAME = 'babysitter';
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));

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

function getGlobalStateDir() {
  if (process.env.BABYSITTER_GLOBAL_STATE_DIR) {
    return path.resolve(process.env.BABYSITTER_GLOBAL_STATE_DIR);
  }
  return path.join(getUserHome(), '.a5c');
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

function writeFileIfChanged(filePath, contents) {
  if (fs.existsSync(filePath)) {
    const current = fs.readFileSync(filePath, 'utf8');
    if (current === contents) return false;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
  return true;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  writeFileIfChanged(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (['node_modules', '.git', 'test', '.a5c'].includes(entry)) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function ensureExecutable(filePath) {
  try {
    fs.chmodSync(filePath, 0o755);
  } catch {
    // Best-effort: Windows may ignore mode changes.
  }
}

// ── Plugin bundle ────────────────────────────────────────────────────────

const PLUGIN_BUNDLE_ENTRIES = [
  'plugin.json',
  'openclaw.plugin.json',
  'versions.json',
  'hooks.json',
  'hooks',
  'extensions',
  'skills',
  'commands',
];

function copyPluginBundle(packageRoot, pluginRoot) {
  if (path.resolve(packageRoot) === path.resolve(pluginRoot)) {
    console.log('[babysitter] Source and target are the same directory; skipping copy.');
    return;
  }
  // Idempotent: remove previous install and replace.
  fs.rmSync(pluginRoot, { recursive: true, force: true });
  fs.mkdirSync(pluginRoot, { recursive: true });
  for (const entry of PLUGIN_BUNDLE_ENTRIES) {
    const src = path.join(packageRoot, entry);
    if (fs.existsSync(src)) {
      copyRecursive(src, path.join(pluginRoot, entry));
    }
  }
}

// ── Hook registration ────────────────────────────────────────────────────

function ensureHooksRegistered(pluginRoot) {
  const hooksJsonSrc = path.join(PACKAGE_ROOT, 'hooks.json');
  if (!fs.existsSync(hooksJsonSrc)) return;

  const hooksJson = readJson(hooksJsonSrc);
  const hooksDir = path.join(pluginRoot, 'hooks');

  // Ensure hook scripts are executable
  if (fs.existsSync(hooksDir)) {
    for (const entry of fs.readdirSync(hooksDir)) {
      if (entry.endsWith('.sh')) {
        ensureExecutable(path.join(hooksDir, entry));
      }
    }
  }

  console.log(`[babysitter] Hook registration verified (${Object.keys(hooksJson.hooks || {}).length} event types).`);
}

// ── SDK dependency ───────────────────────────────────────────────────────

function ensureSdkInstalled() {
  try {
    require.resolve('@a5c-ai/babysitter-sdk', { paths: [PACKAGE_ROOT] });
    console.log('[babysitter] @a5c-ai/babysitter-sdk — OK');
    return true;
  } catch {
    console.log('[babysitter] Installing @a5c-ai/babysitter-sdk...');
    const sdkVersion = PACKAGE_JSON.dependencies?.['@a5c-ai/babysitter-sdk'] || 'latest';
    const result = spawnSync('npm', ['install', '--no-save', `@a5c-ai/babysitter-sdk@${sdkVersion}`], {
      cwd: PACKAGE_ROOT,
      stdio: 'inherit',
      env: process.env,
      shell: true,
    });
    if ((result.status ?? 1) !== 0) {
      console.warn('[babysitter] Warning: SDK installation failed. Some features may be unavailable.');
      return false;
    }
    console.log('[babysitter] @a5c-ai/babysitter-sdk installed.');
    return true;
  }
}

// ── Process library ──────────────────────────────────────────────────────

function resolveBabysitterCommand() {
  if (process.env.BABYSITTER_SDK_CLI) {
    return {
      command: process.execPath,
      argsPrefix: [path.resolve(process.env.BABYSITTER_SDK_CLI)],
    };
  }
  try {
    return {
      command: process.execPath,
      argsPrefix: [
        require.resolve('@a5c-ai/babysitter-sdk/dist/cli/main.js', {
          paths: [PACKAGE_ROOT],
        }),
      ],
    };
  } catch {
    return { command: 'babysitter', argsPrefix: [] };
  }
}

function ensureGlobalProcessLibrary() {
  const resolved = resolveBabysitterCommand();
  const result = spawnSync(
    resolved.command,
    [...resolved.argsPrefix, 'process-library:active', '--state-dir', getGlobalStateDir(), '--json'],
    {
      cwd: PACKAGE_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      env: process.env,
    },
  );
  if (result.status === 0) {
    try {
      return JSON.parse(result.stdout);
    } catch {
      // Non-critical
    }
  }
  console.log('[babysitter] Process library not yet active (will be set up on first run).');
  return null;
}

// ── Marketplace entry (for babysitter plugin:install path) ───────────────

function normalizeMarketplaceSourcePath(marketplacePath, pluginSourcePath) {
  let next = pluginSourcePath;
  if (path.isAbsolute(next)) {
    next = path.relative(path.dirname(marketplacePath), next);
  }
  next = String(next || '').replace(/\\/g, '/');
  if (!next.startsWith('./') && !next.startsWith('../')) {
    next = `./${next}`;
  }
  return next;
}

function ensureMarketplaceEntry(pluginRoot) {
  const marketplacePath = path.join(getUserHome(), '.a5c', 'marketplace', 'marketplace.json');
  const defaultMarketplace = {
    name: 'local-plugins',
    interface: { displayName: 'Local Plugins' },
    plugins: [],
  };

  const marketplace = fs.existsSync(marketplacePath)
    ? readJson(marketplacePath)
    : { ...defaultMarketplace };

  marketplace.name = marketplace.name || defaultMarketplace.name;
  marketplace.interface = marketplace.interface || defaultMarketplace.interface;
  if (!Array.isArray(marketplace.plugins)) {
    marketplace.plugins = [];
  }

  const nextEntry = {
    name: PLUGIN_NAME,
    source: {
      source: 'local',
      path: normalizeMarketplaceSourcePath(marketplacePath, pluginRoot),
    },
    policy: {
      installation: 'AVAILABLE',
      authentication: 'ON_INSTALL',
    },
    category: 'Coding',
  };

  const existingIndex = marketplace.plugins.findIndex((e) => e && e.name === PLUGIN_NAME);
  if (existingIndex >= 0) {
    marketplace.plugins[existingIndex] = nextEntry;
  } else {
    marketplace.plugins.push(nextEntry);
  }

  writeJson(marketplacePath, marketplace);
  console.log(`[babysitter] Marketplace entry written: ${marketplacePath}`);
}

// ── OpenClaw config placement ────────────────────────────────────────────

function ensureOpenClawConfig(workspace) {
  const configDir = workspace
    ? path.join(workspace, '.openclaw')
    : getOpenClawHome();

  const pluginsConfigPath = path.join(configDir, 'plugins.json');

  let config;
  if (fs.existsSync(pluginsConfigPath)) {
    config = readJson(pluginsConfigPath);
  } else {
    config = { plugins: {} };
  }

  if (!config.plugins) config.plugins = {};

  // Add or update babysitter plugin entry (idempotent)
  config.plugins[PLUGIN_NAME] = {
    enabled: true,
    version: PACKAGE_JSON.version,
    package: PACKAGE_JSON.name,
  };

  writeJson(pluginsConfigPath, config);
  console.log(`[babysitter] OpenClaw plugin config updated: ${pluginsConfigPath}`);
}

// ── State directory ──────────────────────────────────────────────────────

function ensureStateDirectory(workspace) {
  const stateDir = workspace
    ? path.join(workspace, '.a5c')
    : getGlobalStateDir();
  fs.mkdirSync(stateDir, { recursive: true });
  return stateDir;
}

// ── Main ─────────────────────────────────────────────────────────────────

function main() {
  const { workspace } = parseArgs(process.argv);
  const pluginRoot = getPluginRoot(workspace);
  const scope = workspace ? `project (${workspace})` : 'global';

  console.log(`[babysitter] Installing babysitter plugin for OpenClaw (${scope})`);
  console.log(`[babysitter]   plugin name: ${PLUGIN_NAME}`);
  console.log(`[babysitter]   package: ${PACKAGE_JSON.name}@${PACKAGE_JSON.version}`);
  console.log(`[babysitter]   target: ${pluginRoot}`);

  try {
    // 1. Copy plugin bundle
    copyPluginBundle(PACKAGE_ROOT, pluginRoot);
    console.log('[babysitter] Plugin bundle copied.');

    // 2. Ensure SDK dependency
    ensureSdkInstalled();

    // 3. Register hooks
    ensureHooksRegistered(pluginRoot);

    // 4. OpenClaw config placement
    ensureOpenClawConfig(workspace);

    // 5. Marketplace entry (global only)
    if (!workspace) {
      ensureMarketplaceEntry(pluginRoot);
    }

    // 6. State directory
    const stateDir = ensureStateDirectory(workspace);
    console.log(`[babysitter] State directory: ${stateDir}`);

    // 7. Process library (global only, best-effort)
    if (!workspace) {
      const active = ensureGlobalProcessLibrary();
      if (active?.binding?.dir) {
        console.log(`[babysitter] Process library: ${active.binding.dir}`);
      }
    }

    console.log('[babysitter] Installation complete!');
    console.log('[babysitter] Restart OpenClaw to pick up the installed plugin.');
  } catch (err) {
    console.error(`[babysitter] Failed to install plugin: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
