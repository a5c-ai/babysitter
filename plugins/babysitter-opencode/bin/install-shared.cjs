#!/usr/bin/env node
'use strict';

/**
 * Shared installation utilities for babysitter-opencode plugin.
 *
 * Handles plugin bundle copying, OpenCode config registration,
 * marketplace entry management, and process library bootstrapping.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PLUGIN_NAME = 'babysitter';

const PLUGIN_BUNDLE_ENTRIES = [
  'plugin.json',
  'versions.json',
  'hooks',
  'skills',
  'commands',
];

const HOOK_SCRIPT_NAMES = [
  'session-created.js',
  'session-idle.js',
  'shell-env.js',
  'tool-execute-before.js',
  'tool-execute-after.js',
];

const DEFAULT_MARKETPLACE = {
  name: 'local-plugins',
  interface: {
    displayName: 'Local Plugins',
  },
  plugins: [],
};

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

function getUserHome() {
  if (process.env.USERPROFILE) return path.resolve(process.env.USERPROFILE);
  if (process.env.HOME) return path.resolve(process.env.HOME);
  return os.homedir();
}

function getGlobalStateDir() {
  if (process.env.BABYSITTER_GLOBAL_STATE_DIR) {
    return path.resolve(process.env.BABYSITTER_GLOBAL_STATE_DIR);
  }
  return path.join(getUserHome(), '.a5c');
}

/**
 * Resolve the OpenCode config root.
 * OpenCode uses `.opencode/` in the workspace directory by default.
 * Respect OPENCODE_HOME env var if set.
 */
function getOpenCodeHome(workspace) {
  if (process.env.OPENCODE_HOME) return path.resolve(process.env.OPENCODE_HOME);
  return path.join(workspace || process.cwd(), '.opencode');
}

function getHomePluginRoot(workspace) {
  if (process.env.BABYSITTER_OPENCODE_PLUGIN_DIR) {
    return path.resolve(process.env.BABYSITTER_OPENCODE_PLUGIN_DIR, PLUGIN_NAME);
  }
  return path.join(getOpenCodeHome(workspace), 'plugins', PLUGIN_NAME);
}

function getHomeMarketplacePath(workspace) {
  if (process.env.BABYSITTER_OPENCODE_MARKETPLACE_PATH) {
    return path.resolve(process.env.BABYSITTER_OPENCODE_MARKETPLACE_PATH);
  }
  return path.join(getUserHome(), '.agents', 'plugins', 'marketplace.json');
}

// ---------------------------------------------------------------------------
// File utilities
// ---------------------------------------------------------------------------

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
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (['node_modules', '.git', 'test', '.a5c'].includes(entry)) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }

  // Strip BOM from SKILL.md files
  if (path.basename(src) === 'SKILL.md') {
    const file = fs.readFileSync(src);
    const hasBom = file.length >= 3 && file[0] === 0xef && file[1] === 0xbb && file[2] === 0xbf;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, hasBom ? file.subarray(3) : file);
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// ---------------------------------------------------------------------------
// Plugin bundle
// ---------------------------------------------------------------------------

function copyPluginBundle(packageRoot, pluginRoot) {
  if (path.resolve(packageRoot) === path.resolve(pluginRoot)) {
    return;
  }
  fs.rmSync(pluginRoot, { recursive: true, force: true });
  fs.mkdirSync(pluginRoot, { recursive: true });
  for (const entry of PLUGIN_BUNDLE_ENTRIES) {
    const src = path.join(packageRoot, entry);
    if (fs.existsSync(src)) {
      copyRecursive(src, path.join(pluginRoot, entry));
    }
  }
}

// ---------------------------------------------------------------------------
// OpenCode index.js entry point generation
// ---------------------------------------------------------------------------

function writeIndexJs(pluginRoot) {
  const indexContent = `#!/usr/bin/env node
/**
 * Babysitter plugin entry point for OpenCode.
 *
 * OpenCode discovers plugins by looking for JS/TS modules in
 * .opencode/plugins/. This file registers the babysitter hooks
 * with the OpenCode plugin system.
 */

"use strict";

const path = require("path");

const PLUGIN_DIR = __dirname;

module.exports = {
  name: "babysitter",
  version: require(path.join(PLUGIN_DIR, "plugin.json")).version,

  hooks: {
    "session.created": require(path.join(PLUGIN_DIR, "hooks", "session-created.js")),
    "session.idle": require(path.join(PLUGIN_DIR, "hooks", "session-idle.js")),
    "shell.env": require(path.join(PLUGIN_DIR, "hooks", "shell-env.js")),
    "tool.execute.before": require(path.join(PLUGIN_DIR, "hooks", "tool-execute-before.js")),
    "tool.execute.after": require(path.join(PLUGIN_DIR, "hooks", "tool-execute-after.js")),
  },
};
`;
  fs.writeFileSync(path.join(pluginRoot, 'index.js'), indexContent, 'utf8');
}

// ---------------------------------------------------------------------------
// OpenCode hooks.json config registration
// ---------------------------------------------------------------------------

function mergeHooksConfig(packageRoot, openCodeHome) {
  const hooksJsonPath = path.join(packageRoot, 'hooks', 'hooks.json');
  if (!fs.existsSync(hooksJsonPath)) return;
  const managedConfig = readJson(hooksJsonPath);
  const managedHooks = managedConfig.hooks || {};
  const hooksConfigPath = path.join(openCodeHome, 'hooks.json');
  const existing = fs.existsSync(hooksConfigPath)
    ? readJson(hooksConfigPath)
    : { version: 1, hooks: {} };
  existing.version = existing.version || 1;
  if (!existing.hooks || typeof existing.hooks !== 'object') {
    existing.hooks = {};
  }

  for (const [eventName, entries] of Object.entries(managedHooks)) {
    const existingEntries = Array.isArray(existing.hooks[eventName]) ? existing.hooks[eventName] : [];
    const filteredEntries = existingEntries.filter((entry) => {
      const script = String(entry.script || entry.command || entry.bash || '');
      return !HOOK_SCRIPT_NAMES.some((name) => script.includes(name));
    });
    existing.hooks[eventName] = [...filteredEntries, ...entries];
  }

  writeJson(hooksConfigPath, existing);
}

function removeManagedHooks(openCodeHome) {
  const hooksConfigPath = path.join(openCodeHome, 'hooks.json');
  if (!fs.existsSync(hooksConfigPath)) return;

  let hooksConfig;
  try {
    hooksConfig = readJson(hooksConfigPath);
  } catch {
    return;
  }
  if (!hooksConfig.hooks || typeof hooksConfig.hooks !== 'object') return;

  for (const eventName of Object.keys(hooksConfig.hooks)) {
    const eventHooks = Array.isArray(hooksConfig.hooks[eventName]) ? hooksConfig.hooks[eventName] : [];
    const filtered = eventHooks.filter((entry) => {
      const script = String(entry.script || entry.command || entry.bash || '');
      return !HOOK_SCRIPT_NAMES.some((name) => script.includes(name));
    });
    if (filtered.length > 0) {
      hooksConfig.hooks[eventName] = filtered;
    } else {
      delete hooksConfig.hooks[eventName];
    }
  }
  if (Object.keys(hooksConfig.hooks).length === 0) {
    fs.rmSync(hooksConfigPath, { force: true });
  } else {
    writeJson(hooksConfigPath, hooksConfig);
  }
}

// ---------------------------------------------------------------------------
// Marketplace
// ---------------------------------------------------------------------------

function normalizeMarketplaceName(name) {
  const raw = String(name || '').trim();
  const sanitized = raw
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return sanitized || DEFAULT_MARKETPLACE.name;
}

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

function ensureMarketplaceEntry(marketplacePath, pluginSourcePath) {
  const marketplace = fs.existsSync(marketplacePath)
    ? readJson(marketplacePath)
    : { ...DEFAULT_MARKETPLACE, plugins: [] };
  marketplace.name = normalizeMarketplaceName(marketplace.name);
  marketplace.interface = marketplace.interface || {};
  marketplace.interface.displayName =
    marketplace.interface.displayName || DEFAULT_MARKETPLACE.interface.displayName;
  const nextEntry = {
    name: PLUGIN_NAME,
    source: {
      source: 'local',
      path: normalizeMarketplaceSourcePath(marketplacePath, pluginSourcePath),
    },
    policy: {
      installation: 'AVAILABLE',
      authentication: 'ON_INSTALL',
    },
    category: 'Coding',
  };
  const existingIndex = Array.isArray(marketplace.plugins)
    ? marketplace.plugins.findIndex((entry) => entry && entry.name === PLUGIN_NAME)
    : -1;
  if (!Array.isArray(marketplace.plugins)) {
    marketplace.plugins = [nextEntry];
  } else if (existingIndex >= 0) {
    marketplace.plugins[existingIndex] = nextEntry;
  } else {
    marketplace.plugins.push(nextEntry);
  }
  writeJson(marketplacePath, marketplace);
  return nextEntry;
}

function removeMarketplaceEntry(marketplacePath) {
  if (!fs.existsSync(marketplacePath)) return;
  const marketplace = readJson(marketplacePath);
  if (!Array.isArray(marketplace.plugins)) return;
  marketplace.plugins = marketplace.plugins.filter((entry) => entry && entry.name !== PLUGIN_NAME);
  writeJson(marketplacePath, marketplace);
}

// ---------------------------------------------------------------------------
// Babysitter SDK CLI helpers
// ---------------------------------------------------------------------------

function resolveBabysitterCommand(packageRoot) {
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
          paths: [packageRoot],
        }),
      ],
    };
  } catch {
    return {
      command: 'babysitter',
      argsPrefix: [],
    };
  }
}

function runBabysitterCli(packageRoot, cliArgs, options = {}) {
  const resolved = resolveBabysitterCommand(packageRoot);
  const result = spawnSync(resolved.command, [...resolved.argsPrefix, ...cliArgs], {
    cwd: options.cwd || process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(options.env || {}),
    },
  });
  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    const stdout = (result.stdout || '').trim();
    throw new Error(
      `babysitter ${cliArgs.join(' ')} failed` +
      (stderr ? `: ${stderr}` : stdout ? `: ${stdout}` : ''),
    );
  }
  return result.stdout;
}

function ensureGlobalProcessLibrary(packageRoot) {
  return JSON.parse(
    runBabysitterCli(
      packageRoot,
      ['process-library:active', '--state-dir', getGlobalStateDir(), '--json'],
      { cwd: packageRoot },
    ),
  );
}

// ---------------------------------------------------------------------------
// OpenCode surface installation
// ---------------------------------------------------------------------------

function installOpenCodeSurface(packageRoot, openCodeHome) {
  // Copy skills into .opencode/skills/
  const sourceSkills = path.join(packageRoot, 'skills');
  if (fs.existsSync(sourceSkills)) {
    const targetSkills = path.join(openCodeHome, 'skills');
    fs.mkdirSync(targetSkills, { recursive: true });
    for (const entry of fs.readdirSync(sourceSkills, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      copyRecursive(
        path.join(sourceSkills, entry.name),
        path.join(targetSkills, entry.name),
      );
    }
  }

  // Merge hooks config
  mergeHooksConfig(packageRoot, openCodeHome);
}

module.exports = {
  copyPluginBundle,
  copyRecursive,
  ensureGlobalProcessLibrary,
  ensureMarketplaceEntry,
  getHomeMarketplacePath,
  getHomePluginRoot,
  getOpenCodeHome,
  installOpenCodeSurface,
  removeManagedHooks,
  removeMarketplaceEntry,
  writeIndexJs,
  writeJson,
};
