'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PLUGIN_NAME = "babysitter";
const PLUGIN_CATEGORY = 'Coding';

function getUserHome() {
  return os.homedir();
}

function getHarnessHome() {
  return path.join(os.homedir(), ".cursor");
}

function getHomePluginRoot(scope) {
  if (scope === 'workspace') return path.join(process.cwd(), '.a5c', 'plugins', PLUGIN_NAME);
  return path.join(path.join(getHarnessHome(), 'plugins'), PLUGIN_NAME);
}

function getHomeMarketplacePath() {
  return path.join(getHarnessHome(), 'plugins', 'marketplace.json');
}

function writeFileIfChanged(filePath, contents) {
  try {
    const existing = fs.readFileSync(filePath, 'utf8');
    if (existing === contents) return false;
  } catch {}
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
  return true;
}

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function copyPluginBundle(packageRoot, pluginRoot) {
  const bundleEntries = fs.readdirSync(packageRoot).filter(
    e => !['node_modules', '.git', 'test', 'dist'].includes(e)
  );
  fs.mkdirSync(pluginRoot, { recursive: true });
  for (const entry of bundleEntries) {
    const src = path.join(packageRoot, entry);
    const dest = path.join(pluginRoot, entry);
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      copyRecursive(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
}

function ensureExecutable(filePath) {
  try {
    fs.chmodSync(filePath, 0o755);
  } catch {}
}

function normalizeMarketplaceSourcePath(source, marketplacePath) {
  if (typeof source === 'string') {
    return path.relative(path.dirname(marketplacePath), source).replace(/\\/g, '/');
  }
  return source;
}

function ensureMarketplaceEntry(marketplacePath, pluginRoot) {
  let marketplace = readJson(marketplacePath) || {
    name: "a5c.ai",
    plugins: [],
  };
  if (!Array.isArray(marketplace.plugins)) marketplace.plugins = [];
  const idx = marketplace.plugins.findIndex(p => p.name === PLUGIN_NAME);
  const relSource = './' + normalizeMarketplaceSourcePath(pluginRoot, marketplacePath);
  const entry = {
    name: PLUGIN_NAME,
    source: relSource,
    description: "Orchestrate complex, multi-step workflows with event-sourced state management, hook-based extensibility, and human-in-the-loop approval",
    version: "5.0.1-staging.dfac8e4a",
    author: { name: "a5c.ai" },
  };
  if (idx >= 0) marketplace.plugins[idx] = entry;
  else marketplace.plugins.push(entry);
  writeJson(marketplacePath, marketplace);
}

function removeMarketplaceEntry(marketplacePath) {
  const marketplace = readJson(marketplacePath);
  if (!marketplace || !Array.isArray(marketplace.plugins)) return;
  marketplace.plugins = marketplace.plugins.filter(p => p.name !== PLUGIN_NAME);
  writeJson(marketplacePath, marketplace);
}

function warnWindowsHooks() {
  if (process.platform === 'win32') {
    console.warn('[' + PLUGIN_NAME + '] Windows detected — shell hooks (.sh) require Git Bash or WSL.');
  }
}

function runPostInstall(pluginRoot) {
  const postInstall = path.join(pluginRoot, 'scripts', 'post-install.js');
  if (fs.existsSync(postInstall)) {
    spawnSync(process.execPath, [postInstall], {
      cwd: pluginRoot, stdio: 'inherit',
      env: { ...process.env, PLUGIN_ROOT: pluginRoot },
    });
  }
}

function getGlobalStateDir() {
  return process.env.BABYSITTER_GLOBAL_STATE_DIR || path.join(getUserHome(), '.a5c');
}

function resolveCliCommand(packageRoot) {
  try {
    const result = spawnSync('babysitter', ['--version'], { stdio: 'pipe', timeout: 10000 });
    if (result.status === 0) return 'babysitter';
  } catch {}
  const versionsPath = path.join(packageRoot, 'versions.json');
  const versions = readJson(versionsPath) || {};
  const ver = versions.sdkVersion || 'latest';
  return `npx -y @a5c-ai/babysitter-sdk@${ver}`;
}

function runCli(packageRoot, cliArgs, options = {}) {
  const cmd = resolveCliCommand(packageRoot);
  const parts = cmd.split(' ');
  const result = spawnSync(parts[0], [...parts.slice(1), ...cliArgs], {
    stdio: options.stdio || 'inherit',
    timeout: options.timeout || 120000,
    cwd: options.cwd || process.cwd(),
    env: { ...process.env, ...options.env },
  });
  return result;
}

function ensureGlobalProcessLibrary(packageRoot) {
  const stateDir = getGlobalStateDir();
  const activeFile = path.join(stateDir, 'active', 'process-library.json');
  let active = readJson(activeFile);
  if (active && active.binding && active.binding.dir) {
    return active;
  }
  const defaultSpec = readJson(path.join(stateDir, 'process-library-defaults.json'));
  const cloneDir = defaultSpec && defaultSpec.cloneDir
    ? defaultSpec.cloneDir
    : path.join(stateDir, 'process-library', PLUGIN_NAME + '-repo');
  runCli(packageRoot, [
    'process-library:clone',
    '--dir', cloneDir,
    '--state-dir', stateDir,
    '--json',
  ], { stdio: 'pipe' });
  runCli(packageRoot, [
    'process-library:use',
    '--dir', cloneDir,
    '--state-dir', stateDir,
    '--json',
  ], { stdio: 'pipe' });
  active = readJson(activeFile);
  return {
    binding: active && active.binding ? active.binding : { dir: cloneDir },
    defaultSpec: defaultSpec || { cloneDir },
    stateFile: activeFile,
  };
}


// Cursor-specific install surface.
// Appended after the compiler base and SDK surface — can override base functions.

const HOOK_SCRIPT_NAMES = [
  'babysitter-proxied-session-start.sh',
  'babysitter-proxied-session-start.ps1',
  'babysitter-proxied-stop.sh',
  'babysitter-proxied-stop.ps1',
];

const DEFAULT_MARKETPLACE = {
  name: 'local-plugins',
  interface: {
    displayName: 'Local Plugins',
  },
  plugins: [],
};

const MANAGED_HOOKS_CONFIG_PATHS = [
  path.join('hooks', 'hooks-cursor.json'),
  'hooks.json',
];

const PLUGIN_BUNDLE_ENTRIES = [
  '.cursor-plugin',
  'plugin.json',
  'hooks.json',
  'hooks',
  'skills',
  'commands',
  'versions.json',
  '.cursorrules',
];

function getCursorHome() {
  if (process.env.CURSOR_HOME) return path.resolve(process.env.CURSOR_HOME);
  return path.join(os.homedir(), '.cursor');
}

function getHomePluginRoot() {
  if (process.env.BABYSITTER_CURSOR_PLUGIN_DIR) {
    return path.resolve(process.env.BABYSITTER_CURSOR_PLUGIN_DIR, PLUGIN_NAME);
  }
  return path.join(getCursorHome(), 'plugins', 'local', PLUGIN_NAME);
}

function getHomeMarketplacePath() {
  if (process.env.BABYSITTER_CURSOR_MARKETPLACE_PATH) {
    return path.resolve(process.env.BABYSITTER_CURSOR_MARKETPLACE_PATH);
  }
  return path.join(getUserHome(), '.agents', 'plugins', 'marketplace.json');
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

  // Strip UTF-8 BOM from SKILL.md files
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

function normalizeMarketplaceName(name) {
  const raw = String(name || '').trim();
  const sanitized = raw
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return sanitized || DEFAULT_MARKETPLACE.name;
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
    category: PLUGIN_CATEGORY,
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
  if (!fs.existsSync(marketplacePath)) {
    return;
  }
  const marketplace = readJson(marketplacePath);
  if (!Array.isArray(marketplace.plugins)) {
    return;
  }
  marketplace.plugins = marketplace.plugins.filter((entry) => entry && entry.name !== PLUGIN_NAME);
  writeJson(marketplacePath, marketplace);
}

function getManagedHooksConfigPath(packageRoot) {
  for (const relativePath of MANAGED_HOOKS_CONFIG_PATHS) {
    const candidate = path.join(packageRoot, relativePath);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function mergeManagedHooksConfig(packageRoot, cursorHome) {
  const hooksJsonPath = getManagedHooksConfigPath(packageRoot);
  if (!hooksJsonPath) return;
  const managedConfig = readJson(hooksJsonPath);
  const managedHooks = managedConfig.hooks || {};
  const hooksConfigPath = path.join(cursorHome, 'hooks.json');
  const existing = fs.existsSync(hooksConfigPath)
    ? readJson(hooksConfigPath)
    : { version: 1, hooks: {} };
  existing.version = existing.version || 1;
  if (!existing.hooks || typeof existing.hooks !== 'object') {
    existing.hooks = {};
  }

  for (const [eventName, entries] of Object.entries(managedHooks)) {
    const existingEntries = Array.isArray(existing.hooks[eventName]) ? existing.hooks[eventName] : [];
    const filteredEntries = existingEntries
      .filter((entry) => {
        const bash = String(entry.bash || entry.command || '');
        const ps = String(entry.powershell || '');
        return !HOOK_SCRIPT_NAMES.some((name) => bash.includes(name) || ps.includes(name));
      });
    existing.hooks[eventName] = [...filteredEntries, ...entries];
  }

  writeJson(hooksConfigPath, existing);
}

function removeManagedHooks(cursorHome) {
  for (const hookName of HOOK_SCRIPT_NAMES) {
    fs.rmSync(path.join(cursorHome, 'hooks', hookName), { force: true });
  }

  const hooksConfigPath = path.join(cursorHome, 'hooks.json');
  if (!fs.existsSync(hooksConfigPath)) {
    return;
  }
  let hooksConfig;
  try {
    hooksConfig = readJson(hooksConfigPath);
  } catch {
    return;
  }
  if (!hooksConfig.hooks || typeof hooksConfig.hooks !== 'object') {
    return;
  }
  for (const eventName of Object.keys(hooksConfig.hooks)) {
    const eventHooks = Array.isArray(hooksConfig.hooks[eventName]) ? hooksConfig.hooks[eventName] : [];
    const filtered = eventHooks.filter((entry) => {
      const bash = String(entry.bash || entry.command || '');
      const ps = String(entry.powershell || '');
      return !HOOK_SCRIPT_NAMES.some((name) => bash.includes(name) || ps.includes(name));
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

function installCursorSurface(packageRoot, cursorHome) {
  // Install skills
  const sourceSkills = path.join(packageRoot, 'skills');
  if (fs.existsSync(sourceSkills)) {
    const targetSkills = path.join(cursorHome, 'skills');
    fs.mkdirSync(targetSkills, { recursive: true });
    for (const entry of fs.readdirSync(sourceSkills, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      copyRecursive(
        path.join(sourceSkills, entry.name),
        path.join(targetSkills, entry.name),
      );
    }
  }

  // Install hooks
  const sourceHooks = path.join(packageRoot, 'hooks');
  if (fs.existsSync(sourceHooks)) {
    const targetHooks = path.join(cursorHome, 'hooks');
    fs.mkdirSync(targetHooks, { recursive: true });
    for (const scriptName of HOOK_SCRIPT_NAMES) {
      const sourcePath = path.join(sourceHooks, scriptName);
      if (!fs.existsSync(sourcePath)) continue;
      const targetPath = path.join(targetHooks, scriptName);
      copyRecursive(sourcePath, targetPath);
      ensureExecutable(targetPath);
    }
  }

  // Merge hooks.json config
  mergeManagedHooksConfig(packageRoot, cursorHome);

  // Install .cursorrules
  const sourceRules = path.join(packageRoot, '.cursorrules');
  if (fs.existsSync(sourceRules)) {
    copyRecursive(sourceRules, path.join(cursorHome, '.cursorrules'));
  }
}

function warnWindowsHooks() {
  if (process.platform !== 'win32') {
    return;
  }
  console.warn(`[${PLUGIN_NAME}] Note: On Windows, Cursor will use .ps1 PowerShell hooks.`);
  console.warn(`[${PLUGIN_NAME}] Both bash (.sh) and PowerShell (.ps1) hook scripts are included.`);
}


module.exports = {
  PLUGIN_NAME,
  PLUGIN_CATEGORY,
  getUserHome,
  getHarnessHome,
  writeFileIfChanged,
  readJson,
  writeJson,
  ensureExecutable,
  runPostInstall,
  getGlobalStateDir,
  resolveCliCommand,
  runCli,
  ensureGlobalProcessLibrary,
  PLUGIN_BUNDLE_ENTRIES,
  copyRecursive,
  copyPluginBundle,
  DEFAULT_MARKETPLACE,
  normalizeMarketplaceSourcePath,
  normalizeMarketplaceName,
  ensureMarketplaceEntry,
  removeMarketplaceEntry,
  mergeManagedHooksConfig,
  warnWindowsHooks,
  HOOK_SCRIPT_NAMES,
  MANAGED_HOOKS_CONFIG_PATHS,
  getCursorHome,
  getHomePluginRoot,
  getHomeMarketplacePath,
  getManagedHooksConfigPath,
  removeManagedHooks,
  installCursorSurface,
};
