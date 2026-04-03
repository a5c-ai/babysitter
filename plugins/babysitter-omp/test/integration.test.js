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
});

describe('command files', () => {
  const commands = [
    'babysitter-call.md',
    'babysitter-status.md',
    'babysitter-resume.md',
    'babysitter-doctor.md',
  ];

  for (const cmd of commands) {
    it(`commands/${cmd} exists`, () => {
      assert.ok(fileExists('commands', cmd), `commands/${cmd} must exist`);
    });
  }

  it('command docs are synchronized with the OMP command sync script', async () => {
    const { spawnSync } = await import('node:child_process');
    const result = spawnSync(
      process.execPath,
      [pluginPath('scripts', 'sync-command-docs.cjs'), '--check'],
      { cwd: PLUGIN_ROOT, encoding: 'utf8' },
    );
    assert.strictEqual(result.status, 0, result.stderr || result.stdout || 'OMP command sync check failed');
  });
});

describe('documentation and metadata', () => {
  it('README documents active process-library bootstrapping', () => {
    assert.match(readText('README.md'), /babysitter process-library:active --json/);
  });

  it('README documents harness discovery as the supported oh-my-pi troubleshooting path', () => {
    const readme = readText('README.md');
    assert.match(readme, /babysitter harness:discover --json/);
    assert.match(readme, /where omp/);
  });
});

describe('installer assets', () => {
  it('bin scripts exist', () => {
    assert.ok(fileExists('bin', 'cli.cjs'));
    assert.ok(fileExists('bin', 'install.cjs'));
    assert.ok(fileExists('bin', 'uninstall.cjs'));
  });

  it('bin/install.cjs bootstraps the shared active process library', () => {
    const installer = readText('bin', 'install.cjs');
    assert.match(installer, /process-library:active/);
    assert.match(installer, /--state-dir/);
  });
});
