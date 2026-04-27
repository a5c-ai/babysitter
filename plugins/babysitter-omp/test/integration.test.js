/**
 * Integration tests for the babysitter-omp plugin.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGIN_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PLUGIN_ROOT, '..', '..');

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
    assert.strictEqual(pkg.name, '@a5c-ai/babysitter-omp');
  });

  it('has omp manifest with extensions and skills', () => {
    assert.ok(pkg.omp);
    assert.ok(Array.isArray(pkg.omp.extensions));
    assert.ok(Array.isArray(pkg.omp.skills));
  });

  it('does not expose plugin-local sync scripts in package metadata', () => {
    assert.strictEqual(pkg.scripts['sync:commands'], undefined);
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

  it('generated command docs stay aligned with the unified compiler output', async () => {
    const { spawnSync } = await import('node:child_process');
    const result = spawnSync(
      process.execPath,
      [path.join(REPO_ROOT, 'scripts', 'sync-plugin-commands.cjs'), '--target', 'oh-my-pi', '--check'],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    );
    assert.strictEqual(result.status, 0, result.stderr || result.stdout || 'OMP compiler surface check failed');
  });
});

describe('documentation and metadata', () => {
  it('README documents the recommended omp install flow', () => {
    const readme = readText('README.md');
    assert.match(readme, /omp plugin install @a5c-ai\/babysitter-omp/);
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
