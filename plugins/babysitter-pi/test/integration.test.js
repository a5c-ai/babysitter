/**
 * Integration tests for the babysitter-pi plugin.
 *
 * Validates package structure, file presence, and SDK availability.
 * No test framework dependency -- uses Node.js built-in test runner.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGIN_ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pluginPath(...segments) {
  return path.join(PLUGIN_ROOT, ...segments);
}

function fileExists(...segments) {
  return fs.existsSync(pluginPath(...segments));
}

function readText(...segments) {
  return fs.readFileSync(pluginPath(...segments), 'utf-8');
}

// ---------------------------------------------------------------------------
// package.json structure
// ---------------------------------------------------------------------------

describe('package.json', () => {
  const pkgPath = pluginPath('package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  it('exists and is valid JSON', () => {
    assert.ok(fileExists('package.json'), 'package.json must exist');
    assert.ok(typeof pkg === 'object' && pkg !== null, 'package.json must be a valid object');
  });

  it('has correct name', () => {
    assert.strictEqual(pkg.name, '@a5c-ai/babysitter-pi');
  });

  it('has a version', () => {
    assert.ok(typeof pkg.version === 'string' && pkg.version.length > 0, 'version must be a non-empty string');
  });

  it('has omp manifest with extensions and skills', () => {
    assert.ok(pkg.omp, 'omp field must exist');
    assert.ok(Array.isArray(pkg.omp.extensions), 'omp.extensions must be an array');
    assert.ok(Array.isArray(pkg.omp.skills), 'omp.skills must be an array');
  });

  it('depends on @a5c-ai/babysitter-sdk', () => {
    assert.ok(
      pkg.dependencies && pkg.dependencies['@a5c-ai/babysitter-sdk'],
      'must depend on @a5c-ai/babysitter-sdk',
    );
  });

  it('declares type: module', () => {
    assert.strictEqual(pkg.type, 'module');
  });
});

// ---------------------------------------------------------------------------
// Extension module files
// ---------------------------------------------------------------------------

describe('extension module files', () => {
  const extensionModules = [
    'index.ts',
    'constants.ts',
    'session-binder.ts',
    'sdk-bridge.ts',
    'guards.ts',
    'task-interceptor.ts',
    'tui-widgets.ts',
    'status-line.ts',
    'todo-replacement.ts',
    'loop-driver.ts',
    'effect-executor.ts',
    'result-poster.ts',
    'tool-renderer.ts',
    'custom-tools.ts',
    'types.ts',
  ];

  for (const mod of extensionModules) {
    it(`extensions/babysitter/${mod} exists`, () => {
      assert.ok(
        fileExists('extensions', 'babysitter', mod),
        `extensions/babysitter/${mod} must exist`,
      );
    });
  }
});

// ---------------------------------------------------------------------------
// Command files
// ---------------------------------------------------------------------------

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

  it('command docs are synchronized with the PI command sync script', async () => {
    const { spawnSync } = await import('node:child_process');
    const result = spawnSync(
      process.execPath,
      [pluginPath('scripts', 'sync-command-docs.cjs'), '--check'],
      {
        cwd: PLUGIN_ROOT,
        encoding: 'utf8',
      },
    );
    assert.strictEqual(result.status, 0, result.stderr || result.stdout || 'PI command sync check failed');
  });
});

// ---------------------------------------------------------------------------
// Documentation and metadata files
// ---------------------------------------------------------------------------

describe('documentation and metadata', () => {
  it('SKILL.md exists (under skills/babysitter/)', () => {
    assert.ok(
      fileExists('skills', 'babysitter', 'SKILL.md'),
      'skills/babysitter/SKILL.md must exist',
    );
  });

  it('README documents active process-library bootstrapping', () => {
    const readme = readText('README.md');
    assert.match(readme, /babysitter process-library:active --json/);
  });

  it('README documents harness discovery as the supported oh-my-pi troubleshooting path', () => {
    const readme = readText('README.md');
    assert.match(readme, /babysitter harness:discover --json/);
    assert.match(readme, /where omp/);
  });

  it('AGENTS guidance does not advertise node as an active generated PI-family effect kind', () => {
    const agents = readText('AGENTS.md');
    assert.match(agents, /Do not present `node` as a generated PI-family effect kind\./);
  });
});

// ---------------------------------------------------------------------------
// Installer assets
// ---------------------------------------------------------------------------

describe('installer assets', () => {
  it('bin/cli.cjs exists', () => {
    assert.ok(fileExists('bin', 'cli.cjs'), 'bin/cli.cjs must exist');
  });

  it('bin/install.cjs exists', () => {
    assert.ok(fileExists('bin', 'install.cjs'), 'bin/install.cjs must exist');
  });

  it('bin/install.cjs bootstraps the shared active process library', () => {
    const installer = readText('bin', 'install.cjs');
    assert.match(installer, /process-library:active/);
    assert.match(installer, /--state-dir/);
    assert.match(installer, /getGlobalStateDir/);
  });

  it('bin/uninstall.cjs exists', () => {
    assert.ok(fileExists('bin', 'uninstall.cjs'), 'bin/uninstall.cjs must exist');
  });

  it('scripts/setup.sh exists', () => {
    assert.ok(fileExists('scripts', 'setup.sh'), 'scripts/setup.sh must exist');
  });
});

// ---------------------------------------------------------------------------
// SDK availability
// ---------------------------------------------------------------------------

describe('SDK availability', () => {
  it('@a5c-ai/babysitter-sdk can be imported', async () => {
    const sdk = await import('@a5c-ai/babysitter-sdk');
    assert.ok(sdk, 'SDK module must be importable');
  });

  it('SDK exports createRun', async () => {
    const sdk = await import('@a5c-ai/babysitter-sdk');
    assert.strictEqual(typeof sdk.createRun, 'function', 'createRun must be a function');
  });

  it('SDK exports orchestrateIteration', async () => {
    const sdk = await import('@a5c-ai/babysitter-sdk');
    assert.strictEqual(
      typeof sdk.orchestrateIteration,
      'function',
      'orchestrateIteration must be a function',
    );
  });

  it('SDK exports commitEffectResult', async () => {
    const sdk = await import('@a5c-ai/babysitter-sdk');
    assert.strictEqual(
      typeof sdk.commitEffectResult,
      'function',
      'commitEffectResult must be a function',
    );
  });

  it('SDK exports loadJournal', async () => {
    const sdk = await import('@a5c-ai/babysitter-sdk');
    assert.strictEqual(typeof sdk.loadJournal, 'function', 'loadJournal must be a function');
  });

  it('SDK exports readRunMetadata', async () => {
    const sdk = await import('@a5c-ai/babysitter-sdk');
    assert.strictEqual(
      typeof sdk.readRunMetadata,
      'function',
      'readRunMetadata must be a function',
    );
  });
});
