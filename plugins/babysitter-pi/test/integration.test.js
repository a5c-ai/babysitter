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
    assert.strictEqual(pkg.name, 'babysitter-pi');
  });

  it('has a version', () => {
    assert.ok(typeof pkg.version === 'string' && pkg.version.length > 0, 'version must be a non-empty string');
  });

  it('has omp manifest with extensions, skills, tools', () => {
    assert.ok(pkg.omp, 'omp field must exist');
    assert.ok(Array.isArray(pkg.omp.extensions), 'omp.extensions must be an array');
    assert.ok(Array.isArray(pkg.omp.skills), 'omp.skills must be an array');
    assert.ok(Array.isArray(pkg.omp.tools), 'omp.tools must be an array');
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
});

// ---------------------------------------------------------------------------
// Documentation and metadata files
// ---------------------------------------------------------------------------

describe('documentation and metadata', () => {
  it('AGENTS.md exists', () => {
    assert.ok(fileExists('AGENTS.md'), 'AGENTS.md must exist');
  });

  it('SKILL.md exists (under skills/babysitter/)', () => {
    assert.ok(
      fileExists('skills', 'babysitter', 'SKILL.md'),
      'skills/babysitter/SKILL.md must exist',
    );
  });
});

// ---------------------------------------------------------------------------
// Scripts
// ---------------------------------------------------------------------------

describe('scripts', () => {
  it('scripts/postinstall.js exists', () => {
    assert.ok(fileExists('scripts', 'postinstall.js'), 'scripts/postinstall.js must exist');
  });

  it('scripts/preuninstall.js exists', () => {
    assert.ok(fileExists('scripts', 'preuninstall.js'), 'scripts/preuninstall.js must exist');
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

// ---------------------------------------------------------------------------
// SDK harness registry includes "pi" adapter
// ---------------------------------------------------------------------------

describe('SDK harness registry', () => {
  it('includes "pi" in supported harnesses', async () => {
    const harness = await import('@a5c-ai/babysitter-sdk');
    // The harness exports are re-exported from the SDK index
    const { listSupportedHarnesses } = harness;
    assert.ok(
      typeof listSupportedHarnesses === 'function',
      'listSupportedHarnesses must be exported',
    );
    const harnesses = listSupportedHarnesses();
    assert.ok(
      harnesses.includes('pi'),
      `Supported harnesses must include "pi", got: [${harnesses.join(', ')}]`,
    );
  });

  it('createPiAdapter returns an adapter with name "pi"', async () => {
    const { createPiAdapter } = await import('@a5c-ai/babysitter-sdk');
    assert.ok(typeof createPiAdapter === 'function', 'createPiAdapter must be exported');
    const adapter = createPiAdapter();
    assert.strictEqual(adapter.name, 'pi');
  });
});
