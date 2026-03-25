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
  const processLibraryRepoRoot = path.join(tmpRoot, 'process-library-source');
  fs.mkdirSync(extractDir, { recursive: true });
  fs.mkdirSync(codexHome, { recursive: true });
  fs.mkdirSync(workspaceRoot, { recursive: true });
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
  const installOutput = run(process.execPath, ['bin/postinstall.js'], {
    cwd: packagedRoot,
    env: {
      ...process.env,
      BABYSITTER_SDK_CLI: path.join(PROJECT_ROOT, '..', '..', 'packages', 'sdk', 'dist', 'cli', 'main.js'),
      BABYSITTER_PROCESS_LIBRARY_REPO: processLibraryRepoRoot,
      CODEX_HOME: codexHome,
      INIT_CWD: workspaceRoot,
    },
  });
  assert.ok(installOutput.includes('Installation complete!'));

  const installedSkillRoot = path.join(codexHome, 'skills', 'babysitter-codex');
  [
    'SKILL.md',
    'AGENTS.md',
    'README.md',
    'agents',
    '.codex',
    'bin',
    'commands',
    'scripts',
    'babysitter.lock.json',
  ].forEach((relativePath) => assertExists(installedSkillRoot, relativePath));
  assert.ok(!fs.existsSync(path.join(installedSkillRoot, 'upstream')), 'installed package should not bundle upstream content');
  assert.ok(!fs.existsSync(path.join(installedSkillRoot, 'config')), 'installed package should not ship redundant config payload');
  assert.ok(!fs.existsSync(path.join(installedSkillRoot, 'docs')), 'installed package should not ship redundant docs payload');

  const skillBytes = fs.readFileSync(path.join(installedSkillRoot, 'SKILL.md'));
  const hasBom = skillBytes.length >= 3 && skillBytes[0] === 0xef && skillBytes[1] === 0xbb && skillBytes[2] === 0xbf;
  assert.strictEqual(hasBom, false, 'Installed SKILL.md should not contain a UTF-8 BOM');
  const installedSkill = fs.readFileSync(path.join(installedSkillRoot, 'SKILL.md'), 'utf8');
  assert.ok(installedSkill.includes('SessionStart'));
  assert.ok(installedSkill.includes('Stop'));
  const homeConfig = fs.readFileSync(path.join(codexHome, 'config.toml'), 'utf8');
  assert.ok(homeConfig.includes('codex_hooks = true'));
  assert.ok(homeConfig.includes('multi_agent = true'));

  const teamInstallOutput = run(process.execPath, [path.join(installedSkillRoot, 'scripts', 'team-install.js')], {
    cwd: workspaceRoot,
    env: {
      ...process.env,
      BABYSITTER_PACKAGE_ROOT: installedSkillRoot,
      BABYSITTER_SDK_CLI: path.join(PROJECT_ROOT, '..', '..', 'packages', 'sdk', 'dist', 'cli', 'main.js'),
      BABYSITTER_PROCESS_LIBRARY_REPO: processLibraryRepoRoot,
    },
  });
  assert.ok(teamInstallOutput.includes('[team-install] complete'));
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.codex', 'hooks.json')));
  assert.ok(fs.existsSync(path.join(workspaceRoot, '.codex', 'config.toml')));

  const installJson = readJson(path.join(workspaceRoot, '.a5c', 'team', 'install.json'));
  const profileJson = readJson(path.join(workspaceRoot, '.a5c', 'team', 'profile.json'));

  assert.strictEqual(path.resolve(installJson.packageRoot), path.resolve(installedSkillRoot));
  assert.strictEqual(path.resolve(installJson.workspaceRoot), path.resolve(workspaceRoot));
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
    path.resolve(path.join(installedSkillRoot, '.codex', 'hooks')),
  );
  assert.strictEqual(path.resolve(installJson.processLibraryCloneDir), path.resolve(path.join(workspaceRoot, '.a5c', 'process-library', 'babysitter-repo')));
  assert.strictEqual(path.resolve(installJson.processLibraryRoot), path.resolve(path.join(installJson.processLibraryCloneDir, 'library')));
  assert.strictEqual(path.resolve(installJson.processLibraryReferenceRoot), path.resolve(path.join(installJson.processLibraryCloneDir, 'library', 'reference')));
  assert.strictEqual(
    path.resolve(installJson.processLibraryStateFile),
    path.resolve(path.join(workspaceRoot, '.a5c', 'active', 'process-library.json')),
  );
  assert.strictEqual(path.resolve(profileJson.installedSkillRoot), path.resolve(installedSkillRoot));
  assert.ok(!('processLibraryRoot' in profileJson), 'team profile should not pin an active process-library root');
  assert.ok(!('rulesLayer' in profileJson), 'team profile should not emit a missing rules layer path');
  assert.ok(String(profileJson.processLibraryLookupCommand || '').includes('process-library:active'));
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
    path.resolve(path.join(installedSkillRoot, '.codex', 'hooks')),
  );

  console.log('  ok packed install includes the portable skill payload and team-install paths');
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
