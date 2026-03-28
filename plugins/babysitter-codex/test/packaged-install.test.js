'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');

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

function listModeSkillNames(root) {
  return fs
    .readdirSync(path.join(root, 'skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'babysit')
    .map((entry) => entry.name)
    .sort();
}

function copyTree(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

function assertExists(root, relativePath) {
  const full = path.join(root, relativePath);
  assert.ok(fs.existsSync(full), `Missing installed payload: ${relativePath}`);
  return full;
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
  const homePluginsRoot = path.join(codexHome, 'plugins');
  const homeMarketplacePath = path.join(userHome, '.agents', 'plugins', 'marketplace.json');
  const processLibraryRepoRoot = path.join(tmpRoot, 'process-library-source');
  fs.mkdirSync(extractDir, { recursive: true });
  fs.mkdirSync(codexHome, { recursive: true });
  fs.mkdirSync(workspaceRoot, { recursive: true });
  fs.mkdirSync(userHome, { recursive: true });
  fs.mkdirSync(homePluginsRoot, { recursive: true });
  copyTree(
    path.join(PROJECT_ROOT, '..', '..', 'library'),
    path.join(processLibraryRepoRoot, 'library'),
  );
  run('git', ['init'], { cwd: processLibraryRepoRoot });
  run('git', ['config', 'gc.auto', '0'], { cwd: processLibraryRepoRoot });
  run('git', ['config', 'maintenance.auto', 'false'], { cwd: processLibraryRepoRoot });
  run('git', ['add', '.'], { cwd: processLibraryRepoRoot });
  run(
    'git',
    ['-c', 'user.name=Babysitter Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'seed process library'],
    { cwd: processLibraryRepoRoot },
  );

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

  const installedPluginRoot = path.join(homePluginsRoot, 'babysitter-codex');
  [
    '.codex-plugin',
    'hooks',
    'hooks.json',
    'skills',
    'babysitter.lock.json',
  ].forEach((relativePath) => assertExists(installedPluginRoot, relativePath));
  for (const skillName of listModeSkillNames(PROJECT_ROOT)) {
    assertExists(installedPluginRoot, path.join('skills', skillName, 'SKILL.md'));
  }

  assert.ok(!fs.existsSync(path.join(codexHome, 'skills', 'babysit')), 'global install should not create legacy skill folders');
  assert.ok(!fs.existsSync(path.join(codexHome, 'hooks.json')), 'global install should not write legacy hooks.json');
  assert.ok(fs.existsSync(path.join(installedPluginRoot, '.codex-plugin', 'plugin.json')), 'installed plugin should carry a plugin manifest');
  assert.ok(fs.existsSync(path.join(installedPluginRoot, 'hooks', 'babysitter-stop-hook.sh')), 'installed plugin should carry hook scripts');
  assert.ok(fs.existsSync(path.join(installedPluginRoot, 'skills', 'babysit', 'SKILL.md')), 'installed plugin should carry the core skill');
  assert.ok(!fs.existsSync(path.join(installedPluginRoot, 'bin')), 'installed plugin should not ship installer binaries');

  const skillBytes = fs.readFileSync(path.join(installedPluginRoot, 'skills', 'babysit', 'SKILL.md'));
  const hasBom = skillBytes.length >= 3 && skillBytes[0] === 0xef && skillBytes[1] === 0xbb && skillBytes[2] === 0xbf;
  assert.strictEqual(hasBom, false, 'Installed babysit skill should not contain a UTF-8 BOM');
  const installedSkill = fs.readFileSync(path.join(installedPluginRoot, 'skills', 'babysit', 'SKILL.md'), 'utf8');
  assert.ok(installedSkill.includes('SessionStart'));
  assert.ok(installedSkill.includes('Stop'));
  assert.ok(installedSkill.includes('name: babysit'));
  const installedCallSkill = fs.readFileSync(path.join(installedPluginRoot, 'skills', 'call', 'SKILL.md'), 'utf8');
  assert.ok(installedCallSkill.includes('Load and use the installed `babysit` skill.'));

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
  const homeEntry = homeMarketplace.plugins.find((entry) => entry.name === 'babysitter-codex');
  assert.ok(homeEntry, 'home marketplace should register the plugin');
  assert.strictEqual(homeEntry.source.path, './plugins/babysitter-codex');

  const globalProcessLibraryState = readJson(path.join(userHome, '.a5c', 'active', 'process-library.json'));
  assert.strictEqual(
    path.resolve(globalProcessLibraryState.defaultBinding.dir),
    path.resolve(path.join(userHome, '.a5c', 'process-library', 'babysitter-repo', 'library')),
  );

  assert.ok(!fs.existsSync(path.join(workspaceRoot, '.codex', 'hooks.json')), 'global install should not write workspace hooks');
  assert.ok(!fs.existsSync(path.join(workspaceRoot, '.codex', 'config.toml')), 'global install should not write workspace config');
  assert.ok(!fs.existsSync(path.join(workspaceRoot, 'plugins', 'babysitter-codex')), 'global install should not install workspace plugin files');

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
  assert.ok(fs.existsSync(path.join(workspaceRoot, 'plugins', 'babysitter-codex', '.codex-plugin', 'plugin.json')));
  assert.ok(fs.existsSync(path.join(workspaceRoot, 'plugins', 'babysitter-codex', 'skills', 'babysit', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.agents', 'plugins', 'marketplace.json')));

  const workspaceMarketplace = readJson(path.join(workspaceRoot, '.agents', 'plugins', 'marketplace.json'));
  const workspaceEntry = workspaceMarketplace.plugins.find((entry) => entry.name === 'babysitter-codex');
  assert.ok(workspaceEntry, 'workspace marketplace should register the plugin');
  assert.strictEqual(workspaceEntry.source.path, './plugins/babysitter-codex');

  const installJson = readJson(path.join(workspaceRoot, '.a5c', 'team', 'install.json'));
  const profileJson = readJson(path.join(workspaceRoot, '.a5c', 'team', 'profile.json'));
  assert.strictEqual(path.resolve(installJson.packageRoot), path.resolve(packagedRoot));
  assert.strictEqual(path.resolve(installJson.workspaceRoot), path.resolve(workspaceRoot));
  assert.strictEqual(path.resolve(installJson.pluginRoot), path.resolve(path.join(workspaceRoot, 'plugins', 'babysitter-codex')));
  assert.strictEqual(path.resolve(installJson.marketplacePath), path.resolve(path.join(workspaceRoot, '.agents', 'plugins', 'marketplace.json')));
  assert.strictEqual(path.resolve(installJson.codexConfigPath), path.resolve(path.join(workspaceRoot, '.codex', 'config.toml')));
  assert.strictEqual(path.resolve(installJson.processLibraryCloneDir), path.resolve(path.join(userHome, '.a5c', 'process-library', 'babysitter-repo')));
  assert.strictEqual(path.resolve(installJson.processLibraryStateFile), path.resolve(path.join(userHome, '.a5c', 'active', 'process-library.json')));
  assert.strictEqual(path.resolve(profileJson.pluginRoot), path.resolve(path.join(workspaceRoot, 'plugins', 'babysitter-codex')));
  assert.strictEqual(path.resolve(profileJson.marketplacePath), path.resolve(path.join(workspaceRoot, '.agents', 'plugins', 'marketplace.json')));
  assert.strictEqual(path.resolve(profileJson.codexConfigPath), path.resolve(path.join(workspaceRoot, '.codex', 'config.toml')));
  assert.strictEqual(String(profileJson.processLibraryLookupCommand || ''), 'babysitter process-library:active --json');

  console.log('  ok packed install installs a real plugin bundle, registers marketplace entries, and avoids the old fake ~/.codex skill/hook surface');
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
