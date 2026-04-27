// ---------------------------------------------------------------------------
// Opencode harness-specific surface
//
// This file is appended by the unified plugin compiler after the generic
// install-shared base and the SDK surface.  It may reference any identifier
// already declared in those layers (PLUGIN_NAME, getUserHome, readJson,
// writeJson, writeFileIfChanged, getGlobalStateDir, resolveCliCommand,
// runCli, ensureGlobalProcessLibrary, etc.) and may re-declare functions
// to override the base implementation.
// ---------------------------------------------------------------------------

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
// Path helpers (override base)
// ---------------------------------------------------------------------------

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
// File utilities (override base — adds BOM stripping for SKILL.md)
// ---------------------------------------------------------------------------

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
// Plugin bundle (override base — uses PLUGIN_BUNDLE_ENTRIES allowlist)
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
    const installedEntries = entries.map((entry) => {
      const relativeScript = String(entry.script || '').trim();
      if (relativeScript) {
        const normalizedScript = relativeScript.replace(/\\/g, '/').replace(/^\.\//, '');
        return {
          ...entry,
          script: `npx -y -p @a5c-ai/hooks-mux-cli -c "a5c-hooks-mux invoke --adapter opencode --handler 'node ./plugins/${PLUGIN_NAME}/${normalizedScript}' --json"`,
        };
      }
      if (entry.command) {
        return {
          ...entry,
          script: entry.command,
        };
      }
      return entry;
    });
    existing.hooks[eventName] = [...filteredEntries, ...installedEntries];
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
// Marketplace (override base — opencode format with normalizeMarketplaceName)
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
// Accomplish AI detection and paths
// ---------------------------------------------------------------------------

/**
 * Returns the Accomplish user data directory for the current platform.
 * If OPENCODE_CONFIG_DIR is set, returns its parent (the Accomplish data dir).
 * Otherwise falls back to platform-specific defaults.
 */
function getAccomplishDataDir() {
  if (process.env.OPENCODE_CONFIG_DIR) {
    return path.resolve(process.env.OPENCODE_CONFIG_DIR, '..');
  }
  const home = getUserHome();
  switch (process.platform) {
    case 'darwin':
      return path.join(home, 'Library', 'Application Support', 'Accomplish');
    case 'win32': {
      const appData = process.env.APPDATA || process.env.LOCALAPPDATA;
      return appData
        ? path.join(appData, 'Accomplish')
        : path.join(home, 'AppData', 'Roaming', 'Accomplish');
    }
    default:
      return path.join(home, '.config', 'Accomplish');
  }
}

/**
 * Returns true if Accomplish AI appears to be installed or is running.
 * Checks for:
 *  - ACCOMPLISH_TASK_ID env var (running inside Accomplish)
 *  - Accomplish data dir with an opencode/ subdirectory on disk
 */
function isAccomplishInstalled() {
  if (process.env.ACCOMPLISH_TASK_ID) return true;
  try {
    const dataDir = getAccomplishDataDir();
    const openCodeDir = path.join(dataDir, 'opencode');
    return fs.existsSync(openCodeDir);
  } catch {
    return false;
  }
}

/**
 * Returns the OpenCode home directory inside the Accomplish data dir.
 */
function getAccomplishOpenCodeHome() {
  return path.join(getAccomplishDataDir(), 'opencode');
}

/**
 * Install the babysitter plugin into Accomplish's OpenCode directory.
 * Mirrors the standard OpenCode install: copies bundle, writes index.js,
 * installs skills and hooks.
 */
function installAccomplishSurface(packageRoot, accomplishOpenCodeHome) {
  const pluginRoot = path.join(accomplishOpenCodeHome, 'plugins', PLUGIN_NAME);

  // Copy plugin bundle
  copyPluginBundle(packageRoot, pluginRoot);

  // Create index.js entry point
  writeIndexJs(pluginRoot);

  // Install skills and hooks config
  installOpenCodeSurface(packageRoot, accomplishOpenCodeHome);
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
