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
    return execFileSync(cmd, args, { ...execOptions, shell: true });
  }
  return execFileSync(cmd, args, execOptions);
}

function resolveNpmCommand() {
  return process.platform === 'win32'
    ? path.join(path.dirname(process.execPath), 'npm.cmd')
    : 'npm';
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assertExists(root, relativePath) {
  const full = path.join(root, relativePath);
  assert.ok(fs.existsSync(full), `Missing packaged asset: ${relativePath}`);
  return full;
}

console.log('Packaged install tests:');

let tmpRoot;
let packedTgzPath;
try {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'babysitter-omp-pack-'));
  const extractDir = path.join(tmpRoot, 'extract');
  fs.mkdirSync(extractDir, { recursive: true });

  const packInfo = JSON.parse(run(resolveNpmCommand(), ['pack', '--json']).trim());
  packedTgzPath = path.join(PROJECT_ROOT, packInfo[0].filename);
  const tarArgs = process.platform === 'win32'
    ? ['--force-local', '-xf', packedTgzPath.replace(/\\/g, '/'), '-C', extractDir.replace(/\\/g, '/')]
    : ['-xf', packedTgzPath, '-C', extractDir];
  run('tar', tarArgs);

  const packagedRoot = path.join(extractDir, 'package');
  const pkg = readJson(path.join(packagedRoot, 'package.json'));
  assert.strictEqual(pkg.name, '@a5c-ai/babysitter-omp');
  assert.deepStrictEqual(pkg.omp.extensions, ['./extensions']);
  assert.deepStrictEqual(pkg.omp.skills, ['./skills']);

  [
    'package.json',
    'versions.json',
    'README.md',
    'AGENTS.md',
    'extensions/index.ts',
    'skills/babysit/SKILL.md',
    'skills/call/SKILL.md',
    'commands/call.md',
    'bin/cli.cjs',
    'bin/install.cjs',
    'bin/uninstall.cjs',
    'scripts/sync-command-docs.cjs',
  ].forEach((relativePath) => assertExists(packagedRoot, relativePath));

  const skillText = fs.readFileSync(path.join(packagedRoot, 'skills', 'babysit', 'SKILL.md'), 'utf8');
  assert.ok(skillText.includes('instructions:babysit-skill'));
  assert.ok(skillText.includes('OMP_PLUGIN_ROOT'));
  const extensionText = fs.readFileSync(path.join(packagedRoot, 'extensions', 'index.ts'), 'utf8');
  assert.ok(extensionText.includes('/skill:'));

  const commandFiles = fs.readdirSync(path.join(packagedRoot, 'commands')).filter((name) => name.endsWith('.md'));
  assert.strictEqual(commandFiles.length, 15, 'expected 15 mirrored command files');

  [
    'extensions/babysitter',
    'hooks',
    'hooks.json',
    'skills/babysitter',
    'commands/babysitter-call.md',
    'test',
  ].forEach((relativePath) => {
    assert.ok(!fs.existsSync(path.join(packagedRoot, relativePath)), `Unexpected legacy asset: ${relativePath}`);
  });

  console.log('  ok npm pack includes only the thin oh-my-pi package surface');
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
