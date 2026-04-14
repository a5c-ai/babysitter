'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const INSTALLED_PLUGIN_NAME = 'babysitter';

function run(cmd, args, options = {}) {
  const execOptions = {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  };
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(cmd)) {
    return execFileSync(cmd, args, {
      ...execOptions,
      shell: true,
    });
  }
  return execFileSync(cmd, args, execOptions);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function listModeSkillNames(root) {
  return fs
    .readdirSync(path.join(root, 'skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'babysit')
    .map((entry) => entry.name)
    .sort();
}

function assertExists(root, relativePath) {
  const full = path.join(root, relativePath);
  assert.ok(fs.existsSync(full), `Missing installed payload: ${relativePath}`);
  return full;
}

function toMarketplaceRelativePath(marketplacePath, pluginRoot) {
  const marketplaceRoot = path.dirname(path.dirname(path.dirname(marketplacePath)));
  const rel = path.relative(marketplaceRoot, pluginRoot).replace(/\\/g, '/');
  return rel.startsWith('./') || rel.startsWith('../') ? rel : `./${rel}`;
}

function resolveNpmCommand() {
  if (process.platform !== 'win32') return 'npm';
  return path.join(path.dirname(process.execPath), 'npm.cmd');
}

console.log('Packaged Install Tests:');

let tmpRoot;
let packedTgzPath;
try {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'babysitter-codex-pack-'));
  const extractDir = path.join(tmpRoot, 'extract');
  const codexHome = path.join(tmpRoot, 'codex-home');
  const workspaceRoot = path.join(tmpRoot, 'workspace');
  const userHome = path.join(tmpRoot, 'home');
  const homePluginsRoot = path.join(userHome, '.agents', 'plugins');
  const homeMarketplacePath = path.join(userHome, '.agents', 'plugins', 'marketplace.json');
  // Use the monorepo itself as the process library source — the default
  // subpath is "library/" which matches the monorepo layout.
  const processLibraryRepoRoot = path.resolve(PROJECT_ROOT, '..', '..');
  fs.mkdirSync(extractDir, { recursive: true });
  fs.mkdirSync(codexHome, { recursive: true });
  fs.mkdirSync(workspaceRoot, { recursive: true });
  fs.mkdirSync(userHome, { recursive: true });
  fs.mkdirSync(homePluginsRoot, { recursive: true });
  writeJson(homeMarketplacePath, {
    name: 'local-plugins',
    interface: {
      displayName: 'Local Plugins',
    },
    plugins: [
      {
        name: 'babysitter-codex',
        source: {
          source: 'local',
          path: '../../.codex/plugins/babysitter-codex',
        },
        policy: {
          installation: 'AVAILABLE',
          authentication: 'ON_INSTALL',
        },
        category: 'Coding',
      },
    ],
  });

  const packInfo = JSON.parse(run(resolveNpmCommand(), ['pack', '--json']).trim());
  packedTgzPath = path.join(PROJECT_ROOT, packInfo[0].filename);
  const tarArgs = process.platform === 'win32'
    ? ['--force-local', '-xf', packedTgzPath.replace(/\\/g, '/'), '-C', extractDir.replace(/\\/g, '/')]
    : ['-xf', packedTgzPath, '-C', extractDir];
  run('tar', tarArgs);

  const packagedRoot = path.join(extractDir, 'package');
  const installOutput = run(process.execPath, ['bin/cli.js', 'install', '--global'], {
    cwd: packagedRoot,
    env: {
      ...process.env,
      BABYSITTER_SDK_CLI: path.join(PROJECT_ROOT, '..', '..', 'packages', 'sdk', 'dist', 'cli', 'main.js'),
      BABYSITTER_PROCESS_LIBRARY_REPO: processLibraryRepoRoot,

      CODEX_HOME: codexHome,
      HOME: userHome,
      USERPROFILE: userHome,
    },
  });
  assert.ok(installOutput.includes('Installation complete!'));

  const installedPluginRoot = path.join(homePluginsRoot, INSTALLED_PLUGIN_NAME);
  [
    '.codex-plugin',
    'assets',
    'hooks',
    'hooks.json',
    'skills',
    '.app.json',
    'plugin.lock.json',
    'README.md',
  ].forEach((relativePath) => assertExists(installedPluginRoot, relativePath));
  for (const skillName of listModeSkillNames(PROJECT_ROOT)) {
    assertExists(installedPluginRoot, path.join('skills', skillName, 'SKILL.md'));
  }

  assert.ok(fs.existsSync(path.join(installedPluginRoot, '.codex-plugin', 'plugin.json')), 'installed plugin should carry a plugin manifest');
  assert.ok(fs.existsSync(path.join(installedPluginRoot, 'assets', 'icon.svg')), 'installed plugin should carry composer icon asset');
  assert.ok(fs.existsSync(path.join(installedPluginRoot, 'assets', 'logo.png')), 'installed plugin should carry logo asset');
  assert.ok(fs.existsSync(path.join(installedPluginRoot, 'README.md')), 'installed plugin should carry a README');
  assert.ok(fs.existsSync(path.join(installedPluginRoot, 'hooks', 'babysitter-stop-hook.sh')), 'installed plugin should carry hook scripts');
  assert.ok(fs.existsSync(path.join(installedPluginRoot, 'skills', 'babysit', 'SKILL.md')), 'installed plugin should carry the core skill');
  assert.ok(!fs.existsSync(path.join(installedPluginRoot, 'bin')), 'installed plugin should not ship installer binaries');

  const skillBytes = fs.readFileSync(path.join(installedPluginRoot, 'skills', 'babysit', 'SKILL.md'));
  const hasBom = skillBytes.length >= 3 && skillBytes[0] === 0xef && skillBytes[1] === 0xbb && skillBytes[2] === 0xbf;
  assert.strictEqual(hasBom, false, 'Installed babysit skill should not contain a UTF-8 BOM');
  const installedSkill = fs.readFileSync(path.join(installedPluginRoot, 'skills', 'babysit', 'SKILL.md'), 'utf8');
  assert.ok(installedSkill.includes('name: babysit'));
  assert.ok(installedSkill.includes('instructions:babysit-skill'), 'babysit skill should reference instructions:babysit-skill command');
  const installedCallSkill = fs.readFileSync(path.join(installedPluginRoot, 'skills', 'call', 'SKILL.md'), 'utf8');
  assert.ok(installedCallSkill.includes('Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md).'));

  const homeConfig = fs.readFileSync(path.join(codexHome, 'config.toml'), 'utf8');
  assert.ok(homeConfig.includes('project_doc_max_bytes = 65536'));
  assert.ok(homeConfig.includes('writable_roots = [".a5c", ".codex"]'));
  assert.ok(homeConfig.includes('codex_hooks = true'));
  assert.ok(homeConfig.includes('multi_agent = true'));
  assert.ok(homeConfig.includes('max_depth = 3'));
  assert.ok(homeConfig.includes('max_threads = 4'));

  const pluginHooks = readJson(path.join(installedPluginRoot, 'hooks.json'));
  assert.strictEqual(pluginHooks.hooks.SessionStart[0].hooks[0].command, './hooks/babysitter-session-start.sh');
  assert.strictEqual(pluginHooks.hooks.UserPromptSubmit[0].hooks[0].command, './hooks/user-prompt-submit.sh');
  assert.strictEqual(pluginHooks.hooks.Stop[0].hooks[0].command, './hooks/babysitter-stop-hook.sh');

  assert.ok(fs.existsSync(homeMarketplacePath));
  const homeMarketplace = readJson(homeMarketplacePath);
  assert.ok(!homeMarketplace.plugins.some((entry) => entry.name === 'babysitter-codex'), 'home marketplace should drop the legacy invalid babysitter-codex entry');
  const homeEntry = homeMarketplace.plugins.find((entry) => entry.name === INSTALLED_PLUGIN_NAME);
  assert.ok(homeEntry, 'home marketplace should register the plugin');
  assert.strictEqual(homeEntry.source.path, toMarketplaceRelativePath(homeMarketplacePath, installedPluginRoot));

  const globalProcessLibraryState = readJson(path.join(userHome, '.a5c', 'active', 'process-library.json'));
  assert.ok(globalProcessLibraryState.defaultBinding, 'process-library state should have a defaultBinding');
  assert.ok(
    fs.existsSync(globalProcessLibraryState.defaultBinding.dir),
    `process-library bound dir should exist: ${globalProcessLibraryState.defaultBinding.dir}`,
  );

  assert.ok(!fs.existsSync(path.join(codexHome, 'skills')), 'global install should not materialize legacy Codex skills');
  assert.ok(!fs.existsSync(path.join(codexHome, 'hooks.json')), 'global install should not materialize legacy Codex hooks config');
  assert.ok(!fs.existsSync(path.join(codexHome, 'hooks')), 'global install should not materialize legacy Codex hook scripts');
  assert.ok(!fs.existsSync(path.join(codexHome, 'prompts')), 'global install should not restore deprecated prompt aliases');
  assert.ok(!fs.existsSync(path.join(workspaceRoot, '.codex', 'hooks.json')), 'global install should not write workspace hooks');
  assert.ok(!fs.existsSync(path.join(workspaceRoot, '.codex', 'config.toml')), 'global install should not write workspace config');
  assert.ok(!fs.existsSync(path.join(workspaceRoot, 'plugins', INSTALLED_PLUGIN_NAME)), 'global install should not install legacy workspace plugin files');

  const teamInstallOutput = run(process.execPath, ['bin/cli.js', 'install', '--workspace', workspaceRoot], {
    cwd: packagedRoot,
    env: {
      ...process.env,
      BABYSITTER_SDK_CLI: path.join(PROJECT_ROOT, '..', '..', 'packages', 'sdk', 'dist', 'cli', 'main.js'),
      BABYSITTER_PROCESS_LIBRARY_REPO: processLibraryRepoRoot,

      HOME: userHome,
      USERPROFILE: userHome,
    },
  });
  assert.ok(teamInstallOutput.includes('[team-install] complete'));

  assert.ok(fs.existsSync(path.join(workspaceRoot, '.codex', 'config.toml')));
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.codex', 'hooks.json')));
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.codex', 'hooks', 'babysitter-stop-hook.sh')));
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.codex', 'skills', 'call', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.agents', 'plugins', INSTALLED_PLUGIN_NAME, '.codex-plugin', 'plugin.json')));
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.agents', 'plugins', INSTALLED_PLUGIN_NAME, 'skills', 'babysit', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.agents', 'plugins', 'marketplace.json')));

  const workspaceMarketplace = readJson(path.join(workspaceRoot, '.agents', 'plugins', 'marketplace.json'));
  const workspaceEntry = workspaceMarketplace.plugins.find((entry) => entry.name === INSTALLED_PLUGIN_NAME);
  assert.ok(workspaceEntry, 'workspace marketplace should register the plugin');
  assert.strictEqual(
    workspaceEntry.source.path,
    toMarketplaceRelativePath(
      path.join(workspaceRoot, '.agents', 'plugins', 'marketplace.json'),
      path.join(workspaceRoot, '.agents', 'plugins', INSTALLED_PLUGIN_NAME),
    ),
  );

  const installJson = readJson(path.join(workspaceRoot, '.a5c', 'team', 'install.json'));
  const profileJson = readJson(path.join(workspaceRoot, '.a5c', 'team', 'profile.json'));
  assert.strictEqual(path.resolve(installJson.packageRoot), path.resolve(packagedRoot));
  assert.strictEqual(path.resolve(installJson.workspaceRoot), path.resolve(workspaceRoot));
  assert.strictEqual(path.resolve(installJson.pluginRoot), path.resolve(path.join(workspaceRoot, '.agents', 'plugins', INSTALLED_PLUGIN_NAME)));
  assert.strictEqual(path.resolve(installJson.marketplacePath), path.resolve(path.join(workspaceRoot, '.agents', 'plugins', 'marketplace.json')));
  assert.strictEqual(path.resolve(installJson.codexConfigPath), path.resolve(path.join(workspaceRoot, '.codex', 'config.toml')));
  assert.strictEqual(path.resolve(installJson.processLibraryCloneDir), path.resolve(path.join(userHome, '.a5c', 'process-library', 'babysitter-repo')));
  assert.strictEqual(path.resolve(installJson.processLibraryStateFile), path.resolve(path.join(userHome, '.a5c', 'active', 'process-library.json')));
  assert.strictEqual(path.resolve(profileJson.pluginRoot), path.resolve(path.join(workspaceRoot, '.agents', 'plugins', INSTALLED_PLUGIN_NAME)));
  assert.strictEqual(path.resolve(profileJson.marketplacePath), path.resolve(path.join(workspaceRoot, '.agents', 'plugins', 'marketplace.json')));
  assert.strictEqual(path.resolve(profileJson.codexConfigPath), path.resolve(path.join(workspaceRoot, '.codex', 'config.toml')));
  assert.strictEqual(String(profileJson.processLibraryLookupCommand || ''), 'babysitter process-library:active --json');

  console.log('  ok packed install installs the plugin under ~/.agents/plugins, registers marketplace entries, and avoids the old ~/.codex skill/hook surface');
  console.log('\nPackaged install tests passed!');
} catch (err) {
  console.error('\nTest failed:', err.message);
  process.exitCode = 1;
} finally {
  if (packedTgzPath && fs.existsSync(packedTgzPath)) {
    fs.rmSync(packedTgzPath, { force: true });
  }
  if (tmpRoot) {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}
