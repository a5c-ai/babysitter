'use strict';

/**
 * Packaged install tests for the babysitter-openclaw plugin.
 *
 * Runs `npm pack`, extracts the tarball, and validates that
 * the packaged artifact contains all required files and no
 * unexpected legacy assets.
 */

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
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'babysitter-openclaw-pack-'));
  const extractDir = path.join(tmpRoot, 'extract');
  fs.mkdirSync(extractDir, { recursive: true });

  // Pack the plugin
  const packInfo = JSON.parse(run(resolveNpmCommand(), ['pack', '--json']).trim());
  packedTgzPath = path.join(PROJECT_ROOT, packInfo[0].filename);
  const tarArgs = process.platform === 'win32'
    ? ['--force-local', '-xf', packedTgzPath.replace(/\\/g, '/'), '-C', extractDir.replace(/\\/g, '/')]
    : ['-xf', packedTgzPath, '-C', extractDir];
  run('tar', tarArgs);

  const packagedRoot = path.join(extractDir, 'package');

  // Validate package.json in tarball
  const pkg = readJson(path.join(packagedRoot, 'package.json'));
  assert.strictEqual(pkg.name, '@a5c-ai/babysitter-openclaw');
  assert.deepStrictEqual(pkg.openclaw.extensions, ['./extensions']);

  // Validate required files are present
  [
    'package.json',
    'versions.json',
    'plugin.json',
    'openclaw.plugin.json',
    'hooks.json',
    'README.md',
    'extensions/index.ts',
    'extensions/hooks/session-start.ts',
    'extensions/hooks/session-end.ts',
    'extensions/hooks/before-prompt-build.ts',
    'extensions/hooks/agent-end.ts',
    'hooks/babysitter-session-start.sh',
    'hooks/babysitter-stop-hook.sh',
    'skills/babysit/SKILL.md',
    'skills/call/SKILL.md',
    'commands/call.md',
    'bin/cli.cjs',
    'bin/install.cjs',
    'bin/uninstall.cjs',
    'scripts/sync-command-docs.cjs',
  ].forEach((relativePath) => assertExists(packagedRoot, relativePath));

  // Validate babysit skill content
  const skillText = fs.readFileSync(path.join(packagedRoot, 'skills', 'babysit', 'SKILL.md'), 'utf8');
  assert.ok(skillText.includes('instructions:babysit-skill'), 'babysit skill must reference instructions:babysit-skill');
  assert.ok(skillText.includes('OPENCLAW_PLUGIN_ROOT'), 'babysit skill must reference OPENCLAW_PLUGIN_ROOT');

  // Validate extension entrypoint content
  const extensionText = fs.readFileSync(path.join(packagedRoot, 'extensions', 'index.ts'), 'utf8');
  assert.ok(extensionText.includes('/skill:'), 'extension entrypoint must contain skill routing');

  // Validate command count
  const commandFiles = fs.readdirSync(path.join(packagedRoot, 'commands')).filter((name) => name.endsWith('.md'));
  assert.strictEqual(commandFiles.length, 15, `expected 15 command files, found ${commandFiles.length}`);

  // Validate skill count
  const skillDirs = fs
    .readdirSync(path.join(packagedRoot, 'skills'), { withFileTypes: true })
    .filter((e) => e.isDirectory());
  assert.strictEqual(skillDirs.length, 16, `expected 16 skill directories, found ${skillDirs.length}`);

  // Validate no BOM in skill files
  const skillBytes = fs.readFileSync(path.join(packagedRoot, 'skills', 'babysit', 'SKILL.md'));
  const hasBom = skillBytes.length >= 3 && skillBytes[0] === 0xef && skillBytes[1] === 0xbb && skillBytes[2] === 0xbf;
  assert.strictEqual(hasBom, false, 'babysit skill should not contain a UTF-8 BOM');

  // Validate no unexpected legacy assets
  [
    'test',
    '.git',
    'node_modules',
  ].forEach((relativePath) => {
    assert.ok(!fs.existsSync(path.join(packagedRoot, relativePath)), `Unexpected asset in tarball: ${relativePath}`);
  });

  console.log('  ok npm pack includes only the openclaw plugin surface');
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
