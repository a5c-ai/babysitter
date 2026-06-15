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
