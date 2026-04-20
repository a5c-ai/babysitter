'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PLUGIN_NAME = 'babysitter';
const PLUGIN_CATEGORY = 'Coding';
const LEGACY_HOOK_SCRIPT_NAMES = [
  'session-start.sh',
  'stop-hook.sh',
  'user-prompt-submit.sh',
];
const HOOK_SCRIPT_NAMES = [
  'session-start.sh',
  'session-start.ps1',
  'session-end.sh',
  'session-end.ps1',
  'user-prompt-submitted.sh',
  'user-prompt-submitted.ps1',
];
const DEFAULT_MARKETPLACE = {
  name: 'local-plugins',
  interface: {
    displayName: 'Local Plugins',
  },
  plugins: [],
};
const PLUGIN_BUNDLE_ENTRIES = [
  'plugin.json',
  'hooks.json',
  'hooks',
  'skills',
  'versions.json',
  'AGENTS.md',
];
const CLOUD_AGENT_BUNDLE_ENTRIES = [
  '.github',
  'AGENTS.md',
  'README.md',
  'bin',
  'commands',
  'hooks',
  'hooks.json',
  'package.json',
  'plugin.json',
  'scripts',
  'skills',
  'versions.json',
];
const MANAGED_BLOCK_START = '<!-- BEGIN BABYSITTER GITHUB CLOUD AGENT -->';
const MANAGED_BLOCK_END = '<!-- END BABYSITTER GITHUB CLOUD AGENT -->';

function getCopilotHome() {
  if (process.env.COPILOT_HOME) return path.resolve(process.env.COPILOT_HOME);
  return path.join(os.homedir(), '.copilot');
}

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

function getHomePluginRoot() {
  if (process.env.BABYSITTER_GITHUB_PLUGIN_DIR) {
    return path.resolve(process.env.BABYSITTER_GITHUB_PLUGIN_DIR, PLUGIN_NAME);
  }
  return path.join(getCopilotHome(), 'plugins', PLUGIN_NAME);
}

function getHomeMarketplacePath() {
  if (process.env.BABYSITTER_GITHUB_MARKETPLACE_PATH) {
    return path.resolve(process.env.BABYSITTER_GITHUB_MARKETPLACE_PATH);
  }
  return path.join(getUserHome(), '.agents', 'plugins', 'marketplace.json');
}

function writeFileIfChanged(filePath, contents) {
  if (fs.existsSync(filePath)) {
    const current = fs.readFileSync(filePath, 'utf8');
    if (current === contents) {
      return false;
    }
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
  return true;
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
    if (fs.existsSync(src)) {
      copyRecursive(src, path.join(pluginRoot, entry));
    }
  }
}

function ensureExecutable(filePath) {
  try {
    fs.chmodSync(filePath, 0o755);
  } catch {
    // Best-effort only. Windows and some filesystems may ignore mode changes.
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  writeFileIfChanged(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function replaceManagedMarkdownBlock(existing, block) {
  const normalized = String(existing || '').replace(/\r\n/g, '\n');
  const managedBlock = `${MANAGED_BLOCK_START}\n${block.trim()}\n${MANAGED_BLOCK_END}`;
  const escapedStart = MANAGED_BLOCK_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedEnd = MANAGED_BLOCK_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const managedPattern = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`, 'm');

  if (managedPattern.test(normalized)) {
    return normalized.replace(managedPattern, managedBlock).replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
  }

  if (normalized.trim().length === 0) {
    return `${managedBlock}\n`;
  }

  return `${normalized.trimEnd()}\n\n${managedBlock}\n`;
}

function writeManagedMarkdown(filePath, block) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  return writeFileIfChanged(filePath, replaceManagedMarkdownBlock(existing, block));
}

function readSdkVersion(packageRoot) {
  const versionsPath = path.join(packageRoot, 'versions.json');
  if (!fs.existsSync(versionsPath)) {
    return 'latest';
  }
  try {
    const parsed = readJson(versionsPath);
    return typeof parsed.sdkVersion === 'string' && parsed.sdkVersion.trim() !== ''
      ? parsed.sdkVersion.trim()
      : 'latest';
  } catch {
    return 'latest';
  }
}

function toLowerHyphenName(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function rewriteCloudSkill(skillId, contents) {
  const normalized = String(contents).replace(/\r\n/g, '\n');
  const prefixedName = `babysitter-${skillId}`;
  let next = normalized;

  if (next.startsWith('---\n')) {
    next = next.replace(/^---\n([\s\S]*?)\n---\n?/, (_match, frontmatter) => {
      const lines = String(frontmatter).split('\n');
      let sawName = false;
      const updatedLines = lines.map((line) => {
        if (/^name:\s*/.test(line)) {
          sawName = true;
          return `name: ${prefixedName}`;
        }
        return line;
      });
      if (!sawName) {
        updatedLines.push(`name: ${prefixedName}`);
      }
      return `---\n${updatedLines.join('\n')}\n---\n`;
    });
  }

  next = next.replace(/^#\s+.+$/m, `# ${prefixedName}`);
  return next.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
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

/**
 * Registers the plugin in ~/.copilot/config.json.
 */
function registerCopilotPlugin(pluginRoot) {
  const copilotHome = getCopilotHome();
  const configPath = path.join(copilotHome, 'config.json');

  fs.mkdirSync(copilotHome, { recursive: true });

  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      config = {};
    }
  }

  if (!config.plugins) {
    config.plugins = [];
  }

  const existing = config.plugins.findIndex(
    (p) => (typeof p === 'string' ? p : p.path) === pluginRoot
  );

  if (existing === -1) {
    config.plugins.push({
      path: pluginRoot,
      enabled: true,
    });
  } else {
    config.plugins[existing] = {
      path: pluginRoot,
      enabled: true,
    };
  }

  writeFileIfChanged(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

/**
 * Removes the plugin entry from ~/.copilot/config.json.
 */
function deregisterCopilotPlugin(pluginRoot) {
  const configPath = path.join(getCopilotHome(), 'config.json');
  if (!fs.existsSync(configPath)) return;

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (Array.isArray(config.plugins)) {
      config.plugins = config.plugins.filter(
        (p) => (typeof p === 'string' ? p : p.path) !== pluginRoot
      );
      writeFileIfChanged(configPath, `${JSON.stringify(config, null, 2)}\n`);
      console.log(`[${PLUGIN_NAME}] Removed plugin entry from config.json`);
    }
  } catch (err) {
    console.warn(`[${PLUGIN_NAME}] Warning: Could not update config.json: ${err.message}`);
  }
}

function installManagedSkills(packageRoot, copilotHome) {
  const sourceRoot = path.join(packageRoot, 'skills');
  if (!fs.existsSync(sourceRoot)) return;
  const targetRoot = path.join(copilotHome, 'skills');
  fs.mkdirSync(targetRoot, { recursive: true });

  for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    copyRecursive(
      path.join(sourceRoot, entry.name),
      path.join(targetRoot, entry.name),
    );
  }
}

function mergeManagedHooksConfig(packageRoot, copilotHome) {
  const hooksJsonPath = path.join(packageRoot, 'hooks.json');
  if (!fs.existsSync(hooksJsonPath)) return;
  const managedConfig = readJson(hooksJsonPath);
  const managedHooks = managedConfig.hooks || {};
  const hooksConfigPath = path.join(copilotHome, 'hooks.json');
  const existing = fs.existsSync(hooksConfigPath)
    ? readJson(hooksConfigPath)
    : { version: 1, hooks: {} };
  // Ensure version field is present per Copilot CLI spec
  existing.version = existing.version || 1;
  if (!existing.hooks || typeof existing.hooks !== 'object') {
    existing.hooks = {};
  }

  // Remove legacy PascalCase event entries that are no longer valid
  for (const legacyEvent of ['SessionStart', 'UserPromptSubmit', 'Stop']) {
    delete existing.hooks[legacyEvent];
  }

  const allScriptNames = [...LEGACY_HOOK_SCRIPT_NAMES, ...HOOK_SCRIPT_NAMES];
  for (const [eventName, entries] of Object.entries(managedHooks)) {
    const existingEntries = Array.isArray(existing.hooks[eventName]) ? existing.hooks[eventName] : [];
    const filteredEntries = existingEntries
      .filter((entry) => {
        const bash = String(entry.bash || entry.command || '');
        const ps = String(entry.powershell || '');
        return !allScriptNames.some((name) => bash.includes(name) || ps.includes(name));
      });
    existing.hooks[eventName] = [...filteredEntries, ...entries];
  }

  writeJson(hooksConfigPath, existing);
}

function installManagedHooks(packageRoot, copilotHome) {
  const sourceRoot = path.join(packageRoot, 'hooks');
  if (!fs.existsSync(sourceRoot)) return;
  const targetRoot = path.join(copilotHome, 'hooks');
  fs.mkdirSync(targetRoot, { recursive: true });

  for (const scriptName of HOOK_SCRIPT_NAMES) {
    const sourcePath = path.join(sourceRoot, scriptName);
    if (!fs.existsSync(sourcePath)) continue;
    const targetPath = path.join(targetRoot, scriptName);
    copyRecursive(sourcePath, targetPath);
    ensureExecutable(targetPath);
  }

  mergeManagedHooksConfig(packageRoot, copilotHome);
}

function removeLegacyHooks(copilotHome) {
  for (const hookName of LEGACY_HOOK_SCRIPT_NAMES) {
    fs.rmSync(path.join(copilotHome, 'hooks', hookName), { force: true });
  }

  const hooksConfigPath = path.join(copilotHome, 'hooks.json');
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
  for (const eventName of ['SessionStart', 'UserPromptSubmit', 'Stop', 'sessionStart', 'sessionEnd', 'userPromptSubmitted']) {
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

function installCopilotSurface(packageRoot, copilotHome) {
  removeLegacyHooks(copilotHome);
  installManagedSkills(packageRoot, copilotHome);
  installManagedHooks(packageRoot, copilotHome);
}

function renderCloudAgentAgentsBlock() {
  return [
    '## Babysitter Cloud Agent',
    '',
    'This repository is configured to let GitHub Copilot cloud agent use Babysitter orchestration assets.',
    '',
    '- For complex multi-step work, use the Babysitter skills installed under `.github/skills/` when relevant.',
    '- The cloud-agent setup workflow installs the Babysitter SDK before work begins.',
    '- If you need the full orchestration instructions, run `babysitter instructions:babysit-skill --harness github-copilot --json`.',
    '- Execute requested shell and Node tasks directly and report the results instead of describing what should be done.',
    '- Do not revert unrelated user changes.',
  ].join('\n');
}

function renderCloudAgentCopilotInstructionsBlock() {
  return [
    '# Babysitter Copilot Cloud Agent Support',
    '',
    'This repository includes Babysitter support for GitHub Copilot cloud agent.',
    '',
    '- Read the nearest `AGENTS.md` instructions before making changes.',
    '- Consider the Babysitter skills under `.github/skills/` when the task is a multi-step workflow, orchestration run, diagnosis, planning, or retrospective.',
    '- The `copilot-setup-steps` workflow installs the Babysitter SDK and initializes the active process library before the agent starts working.',
    '- Add repository-specific build, test, and validation commands below this managed section if they are not already documented elsewhere in the repo.',
  ].join('\n');
}

function renderCloudAgentSetupWorkflow(packageRoot) {
  const sdkVersion = readSdkVersion(packageRoot);
  return [
    'name: "Copilot Setup Steps"',
    '',
    'on:',
    '  workflow_dispatch:',
    '  push:',
    '    paths:',
    '      - .github/workflows/copilot-setup-steps.yml',
    '      - .github/copilot-instructions.md',
    '      - .github/skills/**',
    '      - AGENTS.md',
    '  pull_request:',
    '    paths:',
    '      - .github/workflows/copilot-setup-steps.yml',
    '      - .github/copilot-instructions.md',
    '      - .github/skills/**',
    '      - AGENTS.md',
    '',
    'jobs:',
    '  copilot-setup-steps:',
    '    runs-on: ubuntu-latest',
    '    permissions:',
    '      contents: read',
    '    steps:',
    '      - name: Check out repository',
    '        uses: actions/checkout@v4',
    '',
    '      - name: Set up Node.js',
    '        uses: actions/setup-node@v4',
    '        with:',
    '          node-version: 22',
    '          cache: npm',
    '',
    '      - name: Install Babysitter SDK',
    `        run: npm install -g @a5c-ai/babysitter-sdk@${sdkVersion}`,
    '',
    '      - name: Initialize active process library',
    '        run: babysitter process-library:active --json',
  ].join('\n') + '\n';
}

function installCloudAgentBundle(packageRoot, workspaceRoot) {
  const bundleRoot = path.join(workspaceRoot, '.github', 'babysitter', 'github-plugin');
  fs.rmSync(bundleRoot, { recursive: true, force: true });
  fs.mkdirSync(bundleRoot, { recursive: true });
  for (const entry of CLOUD_AGENT_BUNDLE_ENTRIES) {
    const sourcePath = path.join(packageRoot, entry);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }
    copyRecursive(sourcePath, path.join(bundleRoot, entry));
  }
  return bundleRoot;
}

function installCloudAgentSkills(packageRoot, workspaceRoot) {
  const sourceRoot = path.join(packageRoot, 'skills');
  if (!fs.existsSync(sourceRoot)) return [];

  const targetRoot = path.join(workspaceRoot, '.github', 'skills');
  fs.mkdirSync(targetRoot, { recursive: true });
  const installed = [];

  for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const sourceDir = path.join(sourceRoot, entry.name);
    const skillId = toLowerHyphenName(entry.name);
    const targetDir = path.join(targetRoot, `babysitter-${skillId}`);
    fs.rmSync(targetDir, { recursive: true, force: true });
    copyRecursive(sourceDir, targetDir);
    const skillPath = path.join(targetDir, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      const rewritten = rewriteCloudSkill(skillId, fs.readFileSync(skillPath, 'utf8'));
      fs.writeFileSync(skillPath, rewritten, 'utf8');
    }
    installed.push(targetDir);
  }

  return installed;
}

function installCloudAgentInstructions(packageRoot, workspaceRoot) {
  const agentsPath = path.join(workspaceRoot, 'AGENTS.md');
  const copilotInstructionsPath = path.join(workspaceRoot, '.github', 'copilot-instructions.md');

  writeManagedMarkdown(agentsPath, renderCloudAgentAgentsBlock(packageRoot));
  writeManagedMarkdown(copilotInstructionsPath, renderCloudAgentCopilotInstructionsBlock(packageRoot));

  return {
    agentsPath,
    copilotInstructionsPath,
  };
}

function installCloudAgentSetupSteps(packageRoot, workspaceRoot) {
  const workflowsDir = path.join(workspaceRoot, '.github', 'workflows');
  const workflowPath = path.join(workflowsDir, 'copilot-setup-steps.yml');
  const examplePath = path.join(workflowsDir, 'copilot-setup-steps.babysitter.generated.yml');
  const contents = renderCloudAgentSetupWorkflow(packageRoot);

  fs.mkdirSync(workflowsDir, { recursive: true });

  if (!fs.existsSync(workflowPath)) {
    writeFileIfChanged(workflowPath, contents);
    fs.rmSync(examplePath, { force: true });
    return { workflowPath, examplePath: null, managed: true, needsManualMerge: false };
  }

  const existing = fs.readFileSync(workflowPath, 'utf8');
  if (existing.includes('copilot-setup-steps') && existing.includes('@a5c-ai/babysitter-sdk')) {
    writeFileIfChanged(workflowPath, contents);
    fs.rmSync(examplePath, { force: true });
    return { workflowPath, examplePath: null, managed: true, needsManualMerge: false };
  }

  writeFileIfChanged(examplePath, contents);
  return { workflowPath, examplePath, managed: false, needsManualMerge: true };
}

function installCloudAgentSurface(packageRoot, workspaceRoot) {
  const bundleRoot = installCloudAgentBundle(packageRoot, workspaceRoot);
  const skillDirs = installCloudAgentSkills(packageRoot, workspaceRoot);
  const instructions = installCloudAgentInstructions(packageRoot, workspaceRoot);
  const setupWorkflow = installCloudAgentSetupSteps(packageRoot, workspaceRoot);
  return {
    bundleRoot,
    skillDirs,
    ...instructions,
    setupWorkflow,
  };
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
  return JSON.parse(
    runBabysitterCli(
      packageRoot,
      ['process-library:active', '--state-dir', getGlobalStateDir(), '--json'],
      { cwd: packageRoot },
    ),
  );
}

function warnWindowsHooks() {
  if (process.platform !== 'win32') {
    return;
  }
  console.warn(`[${PLUGIN_NAME}] Note: On Windows, Copilot CLI will use .ps1 PowerShell hooks.`);
  console.warn(`[${PLUGIN_NAME}] Both bash (.sh) and PowerShell (.ps1) hook scripts are included.`);
}

module.exports = {
  copyPluginBundle,
  deregisterCopilotPlugin,
  ensureGlobalProcessLibrary,
  ensureMarketplaceEntry,
  getCopilotHome,
  getHomeMarketplacePath,
  getHomePluginRoot,
  installCopilotSurface,
  installCloudAgentSurface,
  registerCopilotPlugin,
  removeLegacyHooks,
  removeMarketplaceEntry,
  warnWindowsHooks,
  writeJson,
};
