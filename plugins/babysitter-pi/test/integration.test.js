/**
 * Integration tests for the babysitter-pi plugin.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGIN_ROOT = path.resolve(__dirname, '..');

function pluginPath(...segments) {
  return path.join(PLUGIN_ROOT, ...segments);
}

function fileExists(...segments) {
  return fs.existsSync(pluginPath(...segments));
}

function readText(...segments) {
  return fs.readFileSync(pluginPath(...segments), 'utf-8');
}

describe('package.json', () => {
  const pkg = JSON.parse(fs.readFileSync(pluginPath('package.json'), 'utf-8'));

  it('has correct name', () => {
    assert.strictEqual(pkg.name, '@a5c-ai/babysitter-pi');
  });

  it('has pi manifest with extensions and skills', () => {
    assert.ok(pkg.pi);
    assert.ok(Array.isArray(pkg.pi.extensions));
    assert.ok(Array.isArray(pkg.pi.skills));
  });
});

describe('command files', () => {
  const commands = [
    'assimilate.md',
    'call.md',
    'cleanup.md',
    'contrib.md',
    'doctor.md',
    'forever.md',
    'help.md',
    'observe.md',
    'plan.md',
    'plugins.md',
    'project-install.md',
    'resume.md',
    'retrospect.md',
    'user-install.md',
    'yolo.md',
  ];

  for (const cmd of commands) {
    it(`commands/${cmd} exists`, () => {
      assert.ok(fileExists('commands', cmd), `commands/${cmd} must exist`);
    });
  }

  it('command docs are synchronized with the Pi command sync script', async () => {
    const { spawnSync } = await import('node:child_process');
    const result = spawnSync(
      process.execPath,
      [pluginPath('scripts', 'sync-command-docs.cjs'), '--check'],
      { cwd: PLUGIN_ROOT, encoding: 'utf8' },
    );
    assert.strictEqual(result.status, 0, result.stderr || result.stdout || 'Pi command sync check failed');
  });
});

describe('documentation and metadata', () => {
  it('README documents the recommended pi install flow', () => {
    const readme = readText('README.md');
    assert.match(readme, /pi install npm:@a5c-ai\/babysitter-pi/);
    assert.match(readme, /babysitter harness:discover --json/);
  });
});

describe('skills and extension assets', () => {
  it('ships the thin babysit skill and extension bridge', () => {
    assert.ok(fileExists('skills', 'babysit', 'SKILL.md'));
    assert.ok(fileExists('extensions', 'index.ts'));
    assert.match(readText('extensions', 'index.ts'), /\/skill:/);
  });
});
