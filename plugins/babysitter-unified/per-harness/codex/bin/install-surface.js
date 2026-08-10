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
// Prefixes identifying files/commands the managed .codex surface owns:
// babysitter-codex-* are the compiler-generated entry shims + runtime lib,
// babysitter-proxied-* are the handler scripts (and the command format used
// by older releases, which the idempotent merge must also replace).
const MANAGED_HOOK_FILE_PREFIXES = ['babysitter-codex-', 'babysitter-proxied-'];
// Marker consumed by the hook runtime lib: when a managed .codex surface is
// installed, exactly one copy (the owning surface) handles each event.
const MANAGED_SURFACE_MARKER = '.babysitter-managed-surface';
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
  'versions.json',
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
    const src = path.join(packageRoot, entry);
    if (!fs.existsSync(src)) continue;
    copyRecursive(src, path.join(pluginRoot, entry));
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
  if (!marketplace || !Array.isArray(marketplace.plugins)) {
    return;
  }
  marketplace.plugins = marketplace.plugins.filter((entry) => (
    entry &&
    entry.name !== PLUGIN_NAME &&
    !LEGACY_MARKETPLACE_PLUGIN_NAMES.includes(entry.name)
  ));
  writeJson(marketplacePath, marketplace);
}

function isManagedOrLegacyHook(hook) {
  const command = String((hook && hook.command) || '');
  return MANAGED_HOOK_FILE_PREFIXES.some((prefix) => command.includes(prefix)) ||
    LEGACY_HOOK_SCRIPT_NAMES.some((name) => command.includes(name));
}

// Removes our hook entries from a matcher-group list. Entries with a shape we
// do not recognize are not ours and pass through untouched.
function stripManagedHooks(matchers) {
  return (Array.isArray(matchers) ? matchers : [])
    .map((matcher) => {
      if (!matcher || typeof matcher !== 'object' || !Array.isArray(matcher.hooks)) {
        return matcher;
      }
      const keptHooks = matcher.hooks.filter((hook) => !isManagedOrLegacyHook(hook));
      return keptHooks.length > 0 ? { ...matcher, hooks: keptHooks } : null;
    })
    .filter(Boolean);
}

// Deletion guard for legacy skill/prompt names: only remove an artifact when
// its content identifies it as ours, so a user's unrelated ~/.codex/skills/plan
// or prompts/plan.md never gets purged just for sharing a generic name.
function looksLikeBabysitterArtifact(artifactPath) {
  try {
    const stat = fs.statSync(artifactPath);
    const probe = stat.isDirectory() ? path.join(artifactPath, 'SKILL.md') : artifactPath;
    return /babysitter|a5c/i.test(fs.readFileSync(probe, 'utf8'));
  } catch {
    return false;
  }
}

function removeLegacyCodexSurface(codexHome) {
  for (const skillName of LEGACY_SKILL_NAMES) {
    const skillPath = path.join(codexHome, 'skills', skillName);
    if (looksLikeBabysitterArtifact(skillPath)) {
      fs.rmSync(skillPath, { recursive: true, force: true });
    }
  }
  for (const promptName of LEGACY_PROMPT_NAMES) {
    const promptPath = path.join(codexHome, 'prompts', promptName);
    if (looksLikeBabysitterArtifact(promptPath)) {
      fs.rmSync(promptPath, { force: true });
    }
  }
  for (const hookName of LEGACY_HOOK_SCRIPT_NAMES) {
    fs.rmSync(path.join(codexHome, 'hooks', hookName), { force: true });
  }
  // Legacy hooks.json entries are cleaned by mergeManagedHooksConfig
  // (isManagedOrLegacyHook covers LEGACY_HOOK_SCRIPT_NAMES) in a single
  // read-modify-write, so no separate pass happens here.
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

// Rewrites a managed hook command so a surface install references its own
// entry-shim copy (the shipped command targets the plugin bundle via
// ${CLAUDE_PLUGIN_ROOT}, which Codex only sets for plugin-sourced hooks).
// Throws rather than writing a broken command into the user's hooks.json.
function rewriteManagedHookCommand(command, hooksDir) {
  const match = String(command || '').match(/babysitter-codex-[A-Za-z0-9_-]+\.sh/);
  if (!match) {
    throw new Error(`Managed hook command references no babysitter-codex-*.sh entry shim: ${command}`);
  }
  const normalizedDir = String(hooksDir).replace(/\\/g, '/');
  if (/["$`\\]/.test(normalizedDir)) {
    throw new Error(`Hooks directory contains characters unsafe for a shell command: ${normalizedDir}`);
  }
  return `bash "${normalizedDir}/${match[0]}"`;
}

// Merges the managed hook entries from hooks.json into <codexHome>/hooks.json.
// Idempotent: previously installed managed/legacy entries are replaced, user
// entries — including event values with shapes we don't recognize — are
// preserved, as are unrelated top-level keys of the document.
function mergeManagedHooksConfig(packageRoot, codexHome, hooksDir) {
  const managedHooks = (readJson(path.join(packageRoot, 'hooks.json')) || {}).hooks || {};
  const hooksConfigPath = path.join(codexHome, 'hooks.json');
  const existing = readJson(hooksConfigPath) || { hooks: {} };
  if (!existing.hooks || typeof existing.hooks !== 'object') {
    existing.hooks = {};
  }

  const eventNames = new Set([
    ...Object.keys(existing.hooks),
    ...Object.keys(managedHooks),
  ]);
  for (const eventName of eventNames) {
    const existingValue = existing.hooks[eventName];
    if (existingValue !== undefined && !Array.isArray(existingValue)) {
      continue;
    }
    const keptMatchers = stripManagedHooks(existingValue || []);
    const managedMatchers = (managedHooks[eventName] || []).map((matcher) => ({
      ...matcher,
      hooks: (Array.isArray(matcher.hooks) ? matcher.hooks : []).map((hook) => (
        hook && hook.command
          ? { ...hook, command: rewriteManagedHookCommand(hook.command, hooksDir) }
          : hook
      )),
    }));
    const nextMatchers = [...keptMatchers, ...managedMatchers];
    if (nextMatchers.length > 0) {
      existing.hooks[eventName] = nextMatchers;
    } else if (existingValue !== undefined) {
      delete existing.hooks[eventName];
    }
  }

  writeJson(hooksConfigPath, existing);
}

function isManagedHookFileName(fileName) {
  return MANAGED_HOOK_FILE_PREFIXES.some((prefix) => fileName.startsWith(prefix)) ||
    fileName === 'versions.json';
}

function installManagedHooks(packageRoot, codexHome) {
  const sourceRoot = path.join(packageRoot, 'hooks');
  const targetRoot = path.join(codexHome, 'hooks');
  fs.mkdirSync(targetRoot, { recursive: true });

  // Copy everything the bundle ships under hooks/ (entry shims, the runtime
  // lib, and the handler scripts the shims delegate to) so the surface can
  // never reference a script that was not installed.
  const copied = [];
  for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const targetPath = path.join(targetRoot, entry.name);
    fs.copyFileSync(path.join(sourceRoot, entry.name), targetPath);
    if (entry.name.endsWith('.sh')) ensureExecutable(targetPath);
    copied.push(entry.name);
  }

  // The hook runtime reads the pinned SDK version from versions.json next to
  // the scripts when a surface copy runs outside the plugin bundle.
  const versionsSource = path.join(packageRoot, 'versions.json');
  if (fs.existsSync(versionsSource)) {
    fs.copyFileSync(versionsSource, path.join(targetRoot, 'versions.json'));
    copied.push('versions.json');
  }
  writeJson(path.join(targetRoot, MANAGED_SURFACE_MARKER), {
    installedBy: '@a5c-ai/babysitter-codex',
    files: copied,
  });

  // Commands are absolute: <codexHome>/hooks.json is evaluated against the
  // Codex session cwd, which may be anywhere (including a workspace subdir).
  // These files are machine-local — teammates rerun the installer.
  mergeManagedHooksConfig(packageRoot, codexHome, targetRoot);
}

function removeManagedCodexSurface(codexHome, packageRoot) {
  const targetRoot = path.join(codexHome, 'hooks');
  const markerPath = path.join(targetRoot, MANAGED_SURFACE_MARKER);
  const marker = readJson(markerPath);
  // Marker first: if a later removal fails partway, the plugin-bundle hook
  // copies stop deferring to this surface and events keep firing.
  fs.rmSync(markerPath, { force: true });

  const installedFiles = marker && Array.isArray(marker.files) ? marker.files : [];
  const candidates = new Set(installedFiles.map((name) => path.basename(String(name))));
  if (fs.existsSync(targetRoot)) {
    for (const entry of fs.readdirSync(targetRoot)) {
      if (isManagedHookFileName(entry)) candidates.add(entry);
    }
  }
  for (const name of candidates) {
    fs.rmSync(path.join(targetRoot, name), { force: true });
  }

  if (packageRoot) {
    const skillsRoot = path.join(packageRoot, 'skills');
    if (fs.existsSync(skillsRoot)) {
      for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const installedSkill = path.join(codexHome, 'skills', entry.name);
        if (looksLikeBabysitterArtifact(installedSkill)) {
          fs.rmSync(installedSkill, { recursive: true, force: true });
        }
      }
    }
  }

  const hooksConfigPath = path.join(codexHome, 'hooks.json');
  const hooksConfig = readJson(hooksConfigPath);
  if (!hooksConfig || !hooksConfig.hooks || typeof hooksConfig.hooks !== 'object') {
    return;
  }
  for (const eventName of Object.keys(hooksConfig.hooks)) {
    const existingValue = hooksConfig.hooks[eventName];
    if (!Array.isArray(existingValue)) continue;
    const keptMatchers = stripManagedHooks(existingValue);
    if (keptMatchers.length > 0) {
      hooksConfig.hooks[eventName] = keptMatchers;
    } else {
      delete hooksConfig.hooks[eventName];
    }
  }
  // Write the document back even when hooks is empty: deleting the file would
  // discard unrelated top-level keys the user (or Codex) may keep in it.
  writeJson(hooksConfigPath, hooksConfig);
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
  const codexHome = getCodexHome();
  const codexConfigPath = path.join(codexHome, 'config.toml');
  mergeCodexConfigFile(codexConfigPath);
  // Global surface: install hooks into the Codex home so they fire even when
  // the plugin bundle is only registered (not added) in the marketplace.
  installCodexSurface(packageRoot, codexHome);
  ensureGlobalProcessLibrary(packageRoot);
  warnWindowsHooks();
}

function harnessUninstall(packageRoot) {
  removeMarketplaceEntry(getHomeMarketplacePath());
  removeManagedCodexSurface(getCodexHome(), packageRoot);
  console.log('[' + PLUGIN_NAME + '] Removed managed Codex hooks and skills.');
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
