const LEGACY_MARKETPLACE_PLUGIN_NAMES = ['babysitter-codex'];
const LEGACY_SKILL_NAMES = [
  'babysit',
  'babysitter-codex',
  'assimilate',
  'call',
  'doctor',
  'forever',
  'help',
  'issue',
  'model',
  'observe',
  'plan',
  'project-install',
  'resume',
  'retrospect',
  'team-install',
  'user-install',
  'yolo',
];
const LEGACY_PROMPT_NAMES = [
  'assimilate.md',
  'call.md',
  'doctor.md',
  'forever.md',
  'help.md',
  'issue.md',
  'model.md',
  'observe.md',
  'plan.md',
  'project-install.md',
  'resume.md',
  'retrospect.md',
  'team-install.md',
  'user-install.md',
  'yolo.md',
  'babysit.md',
];
const LEGACY_HOOK_SCRIPT_NAMES = [
  'babysitter-session-start.sh',
  'babysitter-stop-hook.sh',
  'user-prompt-submit.sh',
];
const MANAGED_HOOK_SCRIPT_NAMES = [
  'babysitter-proxied-session-start.sh',
  'babysitter-proxied-stop.sh',
  'babysitter-proxied-user-prompt-submit.sh',
];
const DEFAULT_MARKETPLACE = {
  name: 'local-plugins',
  interface: {
    displayName: 'Local Plugins',
  },
  plugins: [],
};
const PLUGIN_BUNDLE_ENTRIES = [
  '.codex-plugin',
  'assets',
  'hooks',
  'hooks.json',
  'skills',
  '.app.json',
  'plugin.lock.json',
  'README.md',
];

function getCodexHome() {
  if (process.env.CODEX_HOME) return path.resolve(process.env.CODEX_HOME);
  return path.join(os.homedir(), '.codex');
}

function getHomePluginRoot() {
  if (process.env.BABYSITTER_CODEX_PLUGIN_DIR) {
    return path.resolve(process.env.BABYSITTER_CODEX_PLUGIN_DIR, PLUGIN_NAME);
  }
  return path.join(getUserHome(), '.agents', 'plugins', PLUGIN_NAME);
}

function getHomeMarketplacePath() {
  if (process.env.BABYSITTER_CODEX_MARKETPLACE_PATH) {
    return path.resolve(process.env.BABYSITTER_CODEX_MARKETPLACE_PATH);
  }
  return path.join(getUserHome(), '.agents', 'plugins', 'marketplace.json');
}

function getWorkspacePluginRoot(workspaceRoot) {
  return path.join(path.resolve(workspaceRoot), '.agents', 'plugins', PLUGIN_NAME);
}

function getWorkspaceMarketplacePath(workspaceRoot) {
  return path.join(path.resolve(workspaceRoot), '.agents', 'plugins', 'marketplace.json');
}

function renderCodexConfigToml() {
  return [
    'approval_policy = "on-request"',
    'sandbox_mode = "workspace-write"',
    'project_doc_max_bytes = 65536',
    '',
    '[sandbox_workspace_write]',
    'writable_roots = [".a5c", ".codex"]',
    '',
    '[features]',
    'hooks = true',
    'multi_agent = true',
    '',
    '[agents]',
    'max_depth = 3',
    'max_threads = 4',
    '',
  ].join('\n');
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
    copyRecursive(path.join(packageRoot, entry), path.join(pluginRoot, entry));
  }
}

function insertRootKey(content, key, line) {
  const keyPattern = new RegExp(`^\\s*${key}\\s*=`, 'm');
  if (keyPattern.test(content)) {
    return content;
  }
  const sectionMatch = content.match(/^\[[^\]]+\]\s*$/m);
  if (!sectionMatch || sectionMatch.index === undefined) {
    return content.trim() ? `${content.trimEnd()}\n${line}\n` : `${line}\n`;
  }
  const before = content.slice(0, sectionMatch.index).trimEnd();
  const after = content.slice(sectionMatch.index);
  return before ? `${before}\n${line}\n\n${after}` : `${line}\n\n${after}`;
}

function ensureSectionLine(content, sectionName, lineKey, line) {
  const keyPattern = new RegExp(`^\\s*${lineKey}\\s*=`, 'm');
  if (keyPattern.test(content)) {
    return content;
  }
  const sectionHeader = `[${sectionName}]`;
  const escapedSection = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sectionPattern = new RegExp(`^\\[${escapedSection}\\]\\s*$`, 'm');
  if (sectionPattern.test(content)) {
    return content.replace(sectionPattern, `${sectionHeader}\n${line}`);
  }
  return content.trim()
    ? `${content.trimEnd()}\n\n${sectionHeader}\n${line}\n`
    : `${sectionHeader}\n${line}\n`;
}

function ensureWritableRoots(content) {
  const sectionPattern = /^\[sandbox_workspace_write\]\s*$/m;
  const rootsPattern = /^writable_roots\s*=\s*\[(.*?)\]\s*$/m;
  const requiredRoots = ['.a5c', '.codex'];

  if (!sectionPattern.test(content)) {
    return content.trim()
      ? `${content.trimEnd()}\n\n[sandbox_workspace_write]\nwritable_roots = [".a5c", ".codex"]\n`
      : '[sandbox_workspace_write]\nwritable_roots = [".a5c", ".codex"]\n';
  }

  if (!rootsPattern.test(content)) {
    return content.replace(
      sectionPattern,
      '[sandbox_workspace_write]\nwritable_roots = [".a5c", ".codex"]',
    );
  }

  return content.replace(rootsPattern, (_match, inner) => {
    const values = inner
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => part.replace(/^"(.*)"$/, '$1'));
    const merged = [...new Set([...values, ...requiredRoots])];
    return `writable_roots = [${merged.map((value) => `"${value}"`).join(', ')}]`;
  });
}

function mergeCodexConfig(existing) {
  let content = existing.trim() ? existing : '';
  content = insertRootKey(content, 'approval_policy', 'approval_policy = "on-request"');
  content = insertRootKey(content, 'sandbox_mode', 'sandbox_mode = "workspace-write"');
  content = insertRootKey(content, 'project_doc_max_bytes', 'project_doc_max_bytes = 65536');
  content = ensureWritableRoots(content);
  content = ensureSectionLine(content, 'features', 'hooks', 'hooks = true');
  content = ensureSectionLine(content, 'features', 'multi_agent', 'multi_agent = true');
  content = ensureSectionLine(content, 'agents', 'max_depth', 'max_depth = 3');
  content = ensureSectionLine(content, 'agents', 'max_threads', 'max_threads = 4');
  return `${content.trimEnd()}\n`;
}

function mergeCodexConfigFile(configPath) {
  const current = fs.existsSync(configPath)
    ? fs.readFileSync(configPath, 'utf8')
    : renderCodexConfigToml();
  writeFileIfChanged(configPath, mergeCodexConfig(current));
}

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
  const stateDir = getGlobalStateDir();
  const activeFile = path.join(stateDir, 'active', 'process-library.json');
  const current = readJson(activeFile);
  if (current && current.defaultBinding && current.defaultBinding.dir) {
    return {
      stateFile: activeFile,
      binding: current.defaultBinding,
      defaultSpec: {
        stateDir,
        repo: current.defaultBinding.repoUrl,
        cloneDir: current.defaultBinding.dir,
      },
    };
  }

  const cloneDir = path.join(stateDir, 'process-library', `${PLUGIN_NAME}-repo`);
  runBabysitterCli(
    packageRoot,
    [
      'process-library:clone',
      '--dir', cloneDir,
      '--state-dir', stateDir,
      '--json',
    ],
    { cwd: packageRoot },
  );
  runBabysitterCli(
    packageRoot,
    [
      'process-library:use',
      '--dir', cloneDir,
      '--state-dir', stateDir,
      '--json',
    ],
    { cwd: packageRoot },
  );

  const active = JSON.parse(
    runBabysitterCli(
      packageRoot,
      ['process-library:active', '--state-dir', stateDir, '--json'],
      { cwd: packageRoot },
    ),
  );

  return {
    stateFile: active.stateFile || activeFile,
    binding: active.binding || active.defaultBinding || { dir: cloneDir },
    defaultSpec: active.defaultSpec || {
      stateDir,
      repo: process.env.BABYSITTER_PROCESS_LIBRARY_REPO || null,
      cloneDir,
    },
  };
}

function getMarketplaceRootDir(marketplacePath) {
  const pluginsDir = path.dirname(marketplacePath);
  const dotAgentsDir = path.dirname(pluginsDir);
  return path.dirname(dotAgentsDir);
}

function normalizeMarketplaceSourcePath(marketplacePath, pluginSourcePath) {
  let next = path.relative(getMarketplaceRootDir(marketplacePath), pluginSourcePath);
  next = String(next || '').replace(/\\/g, '/');
  if (!next || next === '.' || next.startsWith('../')) {
    throw new Error(
      `Plugin source path must live under ${getMarketplaceRootDir(marketplacePath)} so Codex can load it via a ./-prefixed marketplace entry.`,
    );
  }
  if (!next.startsWith('./')) {
    next = `./${next}`;
  }
  return next;
}

function ensureMarketplaceEntry(marketplacePath, pluginSourcePath) {
  const marketplace = fs.existsSync(marketplacePath)
    ? readJson(marketplacePath)
    : { ...DEFAULT_MARKETPLACE, plugins: [] };
  marketplace.name = marketplace.name || DEFAULT_MARKETPLACE.name;
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
  if (!Array.isArray(marketplace.plugins)) {
    marketplace.plugins = [nextEntry];
  } else {
    const sanitized = marketplace.plugins.filter((entry) => (
      entry &&
      entry.name !== PLUGIN_NAME &&
      !LEGACY_MARKETPLACE_PLUGIN_NAMES.includes(entry.name)
    ));
    marketplace.plugins = [...sanitized, nextEntry];
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
  marketplace.plugins = marketplace.plugins.filter((entry) => (
    entry &&
    entry.name !== PLUGIN_NAME &&
    !LEGACY_MARKETPLACE_PLUGIN_NAMES.includes(entry.name)
  ));
  writeJson(marketplacePath, marketplace);
}

function removeLegacyCodexSurface(codexHome) {
  for (const skillName of LEGACY_SKILL_NAMES) {
    fs.rmSync(path.join(codexHome, 'skills', skillName), { recursive: true, force: true });
  }
  for (const promptName of LEGACY_PROMPT_NAMES) {
    fs.rmSync(path.join(codexHome, 'prompts', promptName), { force: true });
  }
  for (const hookName of LEGACY_HOOK_SCRIPT_NAMES) {
    fs.rmSync(path.join(codexHome, 'hooks', hookName), { force: true });
  }

  const hooksConfigPath = path.join(codexHome, 'hooks.json');
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
  for (const eventName of ['SessionStart', 'UserPromptSubmit', 'Stop']) {
    const eventHooks = Array.isArray(hooksConfig.hooks[eventName]) ? hooksConfig.hooks[eventName] : [];
    const filteredMatchers = eventHooks
      .map((matcher) => {
        const hooks = Array.isArray(matcher.hooks) ? matcher.hooks : [];
        const keptHooks = hooks.filter((hook) => {
          const command = String(hook.command || '');
          return !LEGACY_HOOK_SCRIPT_NAMES.some((name) => command.includes(name));
        });
        return keptHooks.length > 0 ? { ...matcher, hooks: keptHooks } : null;
      })
      .filter(Boolean);
    if (filteredMatchers.length > 0) {
      hooksConfig.hooks[eventName] = filteredMatchers;
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

function installManagedSkills(packageRoot, codexHome) {
  const sourceRoot = path.join(packageRoot, 'skills');
  const targetRoot = path.join(codexHome, 'skills');
  fs.mkdirSync(targetRoot, { recursive: true });

  for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    copyRecursive(
      path.join(sourceRoot, entry.name),
      path.join(targetRoot, entry.name),
    );
  }
}

function mergeManagedHooksConfig(packageRoot, codexHome) {
  const managedHooks = readJson(path.join(packageRoot, 'hooks.json')).hooks || {};
  const hooksConfigPath = path.join(codexHome, 'hooks.json');
  const existing = fs.existsSync(hooksConfigPath)
    ? readJson(hooksConfigPath)
    : { hooks: {} };
  if (!existing.hooks || typeof existing.hooks !== 'object') {
    existing.hooks = {};
  }

  for (const [eventName, matchers] of Object.entries(managedHooks)) {
    const existingMatchers = Array.isArray(existing.hooks[eventName]) ? existing.hooks[eventName] : [];
    const filteredMatchers = existingMatchers
      .map((matcher) => {
        const hooks = Array.isArray(matcher.hooks) ? matcher.hooks : [];
        const keptHooks = hooks.filter((hook) => {
          const command = String(hook.command || '');
          return !LEGACY_HOOK_SCRIPT_NAMES.some((name) => command.includes(name));
        });
        return keptHooks.length > 0 ? { ...matcher, hooks: keptHooks } : null;
      })
      .filter(Boolean);
    existing.hooks[eventName] = [...filteredMatchers, ...matchers];
  }

  writeJson(hooksConfigPath, existing);
}

function installManagedHooks(packageRoot, codexHome) {
  const sourceRoot = path.join(packageRoot, 'hooks');
  const targetRoot = path.join(codexHome, 'hooks');
  fs.mkdirSync(targetRoot, { recursive: true });

  for (const scriptName of MANAGED_HOOK_SCRIPT_NAMES) {
    const sourcePath = path.join(sourceRoot, scriptName);
    const targetPath = path.join(targetRoot, scriptName);
    copyRecursive(sourcePath, targetPath);
    ensureExecutable(targetPath);
  }

  mergeManagedHooksConfig(packageRoot, codexHome);
}

function installCodexSurface(packageRoot, codexHome) {
  removeLegacyCodexSurface(codexHome);
  installManagedSkills(packageRoot, codexHome);
  installManagedHooks(packageRoot, codexHome);
}

function harnessTeamInstall(packageRoot, pluginRoot, workspace) {
  var workspaceRoot = path.resolve(workspace);
  var resolvedPluginRoot = pluginRoot ? path.resolve(pluginRoot) : getWorkspacePluginRoot(workspaceRoot);
  var marketplacePath = getWorkspaceMarketplacePath(workspaceRoot);
  var codexHome = path.join(workspaceRoot, '.codex');
  var codexConfigPath = path.join(codexHome, 'config.toml');
  var teamDir = path.join(workspaceRoot, '.a5c', 'team');

  var processLibraryState = ensureGlobalProcessLibrary(packageRoot);
  ensureMarketplaceEntry(marketplacePath, resolvedPluginRoot);
  mergeCodexConfigFile(codexConfigPath);
  installCodexSurface(packageRoot, codexHome);
  warnWindowsHooks();

  writeJson(path.join(teamDir, 'install.json'), {
    packageRoot: packageRoot,
    workspaceRoot: workspaceRoot,
    pluginRoot: resolvedPluginRoot,
    marketplacePath: marketplacePath,
    codexConfigPath: codexConfigPath,
    processLibraryCloneDir: (processLibraryState.defaultSpec && processLibraryState.defaultSpec.cloneDir)
      || (processLibraryState.binding && processLibraryState.binding.dir),
    processLibraryStateFile: processLibraryState.stateFile
      || path.join(getGlobalStateDir(), 'active', 'process-library.json'),
  });
  writeJson(path.join(teamDir, 'profile.json'), {
    pluginRoot: resolvedPluginRoot,
    marketplacePath: marketplacePath,
    codexConfigPath: codexConfigPath,
    processLibraryLookupCommand: 'babysitter process-library:active --json',
  });
}

function harnessInstall(packageRoot, _pluginRoot) {
  const codexConfigPath = path.join(getCodexHome(), 'config.toml');
  mergeCodexConfigFile(codexConfigPath);
  ensureGlobalProcessLibrary(packageRoot);
  warnWindowsHooks();
}

function warnWindowsHooks() {
  if (process.platform !== 'win32') {
    return;
  }
  // Codex enabled Windows hooks in v0.119.0 (2026-04-10, openai/codex#17268).
  // Older Codex CLIs still skip hook execution on Windows; warn so users on
  // pinned/older versions know to upgrade.
  console.warn('[babysitter] Note: Codex hooks on Windows require Codex CLI >= 0.119.0.');
  console.warn('[babysitter] If hooks do not fire, run `codex --version` and upgrade if you are below 0.119.0.');
}
