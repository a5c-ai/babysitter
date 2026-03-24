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
  fs.mkdirSync(extractDir, { recursive: true });
  fs.mkdirSync(codexHome, { recursive: true });
  fs.mkdirSync(workspaceRoot, { recursive: true });

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
      CODEX_HOME: codexHome,
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
    'config',
    'docs',
    'scripts',
    'upstream',
    'babysitter.lock.json',
  ].forEach((relativePath) => assertExists(installedSkillRoot, relativePath));

  const skillBytes = fs.readFileSync(path.join(installedSkillRoot, 'SKILL.md'));
  const hasBom = skillBytes.length >= 3 && skillBytes[0] === 0xef && skillBytes[1] === 0xbb && skillBytes[2] === 0xbf;
  assert.strictEqual(hasBom, false, 'Installed SKILL.md should not contain a UTF-8 BOM');
  const installedSkill = fs.readFileSync(path.join(installedSkillRoot, 'SKILL.md'), 'utf8');
  assert.ok(installedSkill.includes('SessionStart'));
  assert.ok(installedSkill.includes('Stop'));

  const verifyOutput = run(process.execPath, [path.join(installedSkillRoot, 'scripts', 'verify-content-manifest.js')], {
    cwd: workspaceRoot,
    env: {
      ...process.env,
      BABYSITTER_PACKAGE_ROOT: installedSkillRoot,
    },
  });
  assert.ok(verifyOutput.includes('[content-manifest] verified'));

  const teamInstallOutput = run(process.execPath, [path.join(installedSkillRoot, 'scripts', 'team-install.js')], {
    cwd: workspaceRoot,
    env: {
      ...process.env,
      BABYSITTER_PACKAGE_ROOT: installedSkillRoot,
    },
  });
  assert.ok(teamInstallOutput.includes('[team-install] complete'));

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
  assert.strictEqual(
    path.resolve(installJson.bundledProcessLibraryFallbackRoot),
    path.resolve(path.join(installedSkillRoot, 'upstream', 'babysitter', 'skills', 'babysit', 'process')),
  );
  assert.strictEqual(path.resolve(profileJson.installedSkillRoot), path.resolve(installedSkillRoot));
  assert.ok(!('processLibraryRoot' in profileJson), 'team profile should not pin an active process-library root');
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
  assert.ok(fs.existsSync(profileJson.rulesLayer), `Missing rules layer: ${profileJson.rulesLayer}`);

  console.log('  ✓ packed install includes full skill payload and portable team-install paths');
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
