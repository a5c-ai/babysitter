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
    .readdirSync(path.join(root, '.codex', 'skills'), { withFileTypes: true })
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

function cliPath(filePath) {
  return process.platform === 'win32' ? String(filePath).replace(/\\/g, '/') : filePath;
}

function hookCommand(filePath) {
  const normalized = cliPath(filePath);
  return normalized.includes(' ') ? `"${normalized}"` : normalized;
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
  const processLibraryRepoRoot = path.join(tmpRoot, 'process-library-source');
  fs.mkdirSync(extractDir, { recursive: true });
  fs.mkdirSync(codexHome, { recursive: true });
  fs.mkdirSync(workspaceRoot, { recursive: true });
  fs.mkdirSync(userHome, { recursive: true });
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
    ? ['--force-local', '-xf', cliPath(packedTgzPath), '-C', cliPath(extractDir)]
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

  const installedSkillRoot = path.join(codexHome, 'skills', 'babysit');
  [
    'SKILL.md',
    '.codex',
    'scripts',
    'babysitter.lock.json',
  ].forEach((relativePath) => assertExists(installedSkillRoot, relativePath));
  for (const skillName of listModeSkillNames(PROJECT_ROOT)) {
    assertExists(codexHome, path.join('skills', skillName, 'SKILL.md'));
    assertExists(installedSkillRoot, path.join('.codex', 'skills', skillName, 'SKILL.md'));
  }
  assert.ok(!fs.existsSync(path.join(codexHome, 'prompts', 'babysit.md')), 'legacy prompt aliases should not survive install');
  assert.ok(!fs.existsSync(path.join(installedSkillRoot, 'README.md')), 'installed skill should not ship package README content');
  assert.ok(!fs.existsSync(path.join(installedSkillRoot, 'upstream')), 'installed package should not bundle upstream content');
  assert.ok(!fs.existsSync(path.join(installedSkillRoot, 'config')), 'installed package should not ship redundant config payload');
  assert.ok(!fs.existsSync(path.join(installedSkillRoot, 'docs')), 'installed package should not ship redundant docs payload');
  assert.ok(!fs.existsSync(path.join(installedSkillRoot, 'prompts')), 'installed skill should not embed Codex custom prompts');
  assert.ok(!fs.existsSync(path.join(installedSkillRoot, 'bin')), 'installed skill should not ship installer binaries');
  assert.ok(fs.existsSync(path.join(installedSkillRoot, '.codex', 'skills', 'babysit', 'SKILL.md')), 'installed skill should carry the repo-local skill template');
  assert.ok(!fs.existsSync(path.join(installedSkillRoot, '.codex', 'skills', 'babysit', 'call')), 'installed skill should not embed nested mode directories');
  assert.ok(!fs.existsSync(path.join(installedSkillRoot, '.codex', 'plugin.json')), 'installed package should not ship fake plugin-manifest metadata');
  assert.ok(!fs.existsSync(path.join(installedSkillRoot, '.codex', 'command-catalog.json')), 'installed package should not ship fake command-catalog metadata');

  const skillBytes = fs.readFileSync(path.join(installedSkillRoot, 'SKILL.md'));
  const hasBom = skillBytes.length >= 3 && skillBytes[0] === 0xef && skillBytes[1] === 0xbb && skillBytes[2] === 0xbf;
  assert.strictEqual(hasBom, false, 'Installed SKILL.md should not contain a UTF-8 BOM');
  const installedSkill = fs.readFileSync(path.join(installedSkillRoot, 'SKILL.md'), 'utf8');
  assert.ok(installedSkill.includes('SessionStart'));
  assert.ok(installedSkill.includes('Stop'));
  assert.ok(installedSkill.includes('name: babysit'));
  const installedCallSkill = fs.readFileSync(path.join(codexHome, 'skills', 'call', 'SKILL.md'), 'utf8');
  assert.ok(installedCallSkill.includes('Load and use the installed `babysit` skill.'));
  const homeConfig = fs.readFileSync(path.join(codexHome, 'config.toml'), 'utf8');
  assert.ok(homeConfig.includes('project_doc_max_bytes = 65536'));
  assert.ok(homeConfig.includes('writable_roots = [".a5c", ".codex"]'));
  assert.ok(homeConfig.includes('codex_hooks = true'));
  assert.ok(homeConfig.includes('multi_agent = true'));
  assert.ok(homeConfig.includes('max_depth = 3'));
  assert.ok(homeConfig.includes('max_threads = 4'));
  assert.ok(fs.existsSync(path.join(codexHome, 'hooks.json')));
  assert.ok(fs.existsSync(path.join(codexHome, 'hooks', 'babysitter-session-start.sh')));
  assert.ok(fs.existsSync(path.join(codexHome, 'hooks', 'user-prompt-submit.sh')));
  assert.ok(fs.existsSync(path.join(codexHome, 'hooks', 'babysitter-stop-hook.sh')));
  const globalHooks = readJson(path.join(codexHome, 'hooks.json'));
  assert.strictEqual(
    globalHooks.hooks.SessionStart[0].hooks[0].command,
    hookCommand(path.join(codexHome, 'hooks', 'babysitter-session-start.sh')),
  );
  assert.strictEqual(
    globalHooks.hooks.UserPromptSubmit[0].hooks[0].command,
    hookCommand(path.join(codexHome, 'hooks', 'user-prompt-submit.sh')),
  );
  assert.strictEqual(
    globalHooks.hooks.Stop[0].hooks[0].command,
    hookCommand(path.join(codexHome, 'hooks', 'babysitter-stop-hook.sh')),
  );
  const globalProcessLibraryState = readJson(path.join(userHome, '.a5c', 'active', 'process-library.json'));
  assert.strictEqual(path.resolve(globalProcessLibraryState.defaultBinding.dir), path.resolve(path.join(userHome, '.a5c', 'process-library', 'babysitter-repo', 'library')));
  assert.ok(!fs.existsSync(path.join(workspaceRoot, '.codex', 'hooks.json')), 'global install should not write workspace hooks');
  assert.ok(!fs.existsSync(path.join(workspaceRoot, '.codex', 'config.toml')), 'global install should not write workspace config');
  assert.ok(!fs.existsSync(path.join(workspaceRoot, '.codex', 'skills', 'babysit', 'SKILL.md')), 'global install should not install workspace skills');
  assert.ok(!fs.existsSync(path.join(workspaceRoot, '.codex', 'skills', 'call', 'SKILL.md')), 'global install should not install workspace mode skills');

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
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.codex', 'hooks.json')));
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.codex', 'config.toml')));
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.codex', 'skills', 'babysit', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.codex', 'skills', 'call', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.codex', 'skills', 'plan', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.codex', 'skills', 'resume', 'SKILL.md')));
  assert.ok(!fs.existsSync(path.join(workspaceRoot, '.codex', 'skills', 'babysit', 'README.md')), 'workspace skill install should not copy package README content');
  assert.ok(!fs.existsSync(path.join(workspaceRoot, '.codex', 'skills', 'babysit', '.codex', 'skills')), 'workspace skill install should not contain nested alias/skill trees');
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.codex', 'hooks', 'babysitter-stop-hook.sh')));
  const workspaceHooks = readJson(path.join(workspaceRoot, '.codex', 'hooks.json'));
  assert.strictEqual(workspaceHooks.hooks.SessionStart[0].hooks[0].command, '.codex/hooks/babysitter-session-start.sh');
  assert.strictEqual(workspaceHooks.hooks.UserPromptSubmit[0].hooks[0].command, '.codex/hooks/user-prompt-submit.sh');
  assert.strictEqual(workspaceHooks.hooks.Stop[0].hooks[0].command, '.codex/hooks/babysitter-stop-hook.sh');

  const installJson = readJson(path.join(workspaceRoot, '.a5c', 'team', 'install.json'));
  const profileJson = readJson(path.join(workspaceRoot, '.a5c', 'team', 'profile.json'));

  assert.strictEqual(path.resolve(installJson.packageRoot), path.resolve(packagedRoot));
  assert.strictEqual(path.resolve(installJson.workspaceRoot), path.resolve(workspaceRoot));
  assert.strictEqual(
    path.resolve(installJson.workspaceSkillRoot),
    path.resolve(path.join(workspaceRoot, '.codex', 'skills', 'babysit')),
  );
  assert.strictEqual(
    path.resolve(installJson.workspaceHooksConfigPath),
    path.resolve(path.join(workspaceRoot, '.codex', 'hooks.json')),
  );
  assert.strictEqual(
    path.resolve(installJson.workspaceConfigPath),
    path.resolve(path.join(workspaceRoot, '.codex', 'config.toml')),
  );
  assert.strictEqual(
    path.resolve(installJson.hookScriptsRoot),
    path.resolve(path.join(workspaceRoot, '.codex', 'hooks')),
  );
  assert.strictEqual(path.resolve(installJson.processLibraryCloneDir), path.resolve(path.join(userHome, '.a5c', 'process-library', 'babysitter-repo')));
  assert.strictEqual(path.resolve(installJson.processLibraryRoot), path.resolve(path.join(installJson.processLibraryCloneDir, 'library')));
  assert.strictEqual(path.resolve(installJson.processLibraryReferenceRoot), path.resolve(path.join(installJson.processLibraryCloneDir, 'library', 'reference')));
  assert.strictEqual(
    path.resolve(installJson.processLibraryStateFile),
    path.resolve(path.join(userHome, '.a5c', 'active', 'process-library.json')),
  );
  assert.strictEqual(path.resolve(profileJson.installedSkillRoot), path.resolve(path.join(workspaceRoot, '.codex', 'skills', 'babysit')));
  assert.ok(!('processLibraryRoot' in profileJson), 'team profile should not pin an active process-library root');
  assert.ok(!('rulesLayer' in profileJson), 'team profile should not emit a missing rules layer path');
  assert.strictEqual(String(profileJson.processLibraryLookupCommand || ''), 'babysitter process-library:active --json');
  assert.strictEqual(
    path.resolve(profileJson.workspaceHooksConfigPath),
    path.resolve(path.join(workspaceRoot, '.codex', 'hooks.json')),
  );
  assert.strictEqual(
    path.resolve(profileJson.workspaceConfigPath),
    path.resolve(path.join(workspaceRoot, '.codex', 'config.toml')),
  );
  assert.strictEqual(
    path.resolve(profileJson.hookScriptsRoot),
    path.resolve(path.join(workspaceRoot, '.codex', 'hooks')),
  );

  console.log('  ok packed install uses the explicit CLI, omits README baggage, installs global hooks/config, and installs mode-wrapper skills through explicit workspace onboarding');
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
