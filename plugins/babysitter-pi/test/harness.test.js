/**
 * Harness adapter and SDK bridge tests for the babysitter-pi plugin.
 *
 * Tests the pi harness adapter from the SDK, guards module, task
 * interceptor, and loop-driver utilities.
 *
 * Run with: node --experimental-strip-types --test test/harness.test.js
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

// SDK harness imports (compiled CJS, always available)
import {
  createPiAdapter,
  getAdapterByName,
} from '@a5c-ai/babysitter-sdk';

// Extension module imports (TypeScript source -- requires --experimental-strip-types)
import {
  checkGuards,
  isDoomLoop,
  resetGuardState,
  MAX_ITERATIONS_DEFAULT,
  DOOM_LOOP_THRESHOLD,
  DOOM_LOOP_MIN_DURATION_MS,
} from '../extensions/babysitter/guards.ts';

import {
  INTERCEPTED_TOOLS,
  shouldIntercept,
  interceptToolCall,
} from '../extensions/babysitter/task-interceptor.ts';

import {
  extractPromiseTag,
  buildContinuationPrompt,
} from '../extensions/babysitter/loop-driver.ts';

// ---------------------------------------------------------------------------
// Pi adapter tests
// ---------------------------------------------------------------------------

describe('Pi harness adapter', () => {
  it('has correct name "pi"', () => {
    const adapter = createPiAdapter();
    assert.strictEqual(adapter.name, 'pi');
  });

  it('is retrievable by name from registry', () => {
    const adapter = getAdapterByName('pi');
    assert.ok(adapter, 'getAdapterByName("pi") must return an adapter');
    assert.strictEqual(adapter.name, 'pi');
  });

  it('isActive() returns false without env vars', () => {
    // Ensure none of the Pi env vars are set
    const saved = {};
    const envKeys = ['OMP_SESSION_ID', 'PI_SESSION_ID', 'OMP_PLUGIN_ROOT', 'PI_PLUGIN_ROOT'];
    for (const key of envKeys) {
      saved[key] = process.env[key];
      delete process.env[key];
    }

    try {
      const adapter = createPiAdapter();
      assert.strictEqual(adapter.isActive(), false, 'isActive() should be false without Pi env vars');
    } finally {
      // Restore env
      for (const key of envKeys) {
        if (saved[key] !== undefined) {
          process.env[key] = saved[key];
        }
      }
    }
  });

  it('resolveSessionId returns sessionId from parsed args', () => {
    const adapter = createPiAdapter();
    const sessionId = adapter.resolveSessionId({ sessionId: 'test-session-42' });
    assert.strictEqual(sessionId, 'test-session-42');
  });

  it('resolveSessionId returns undefined when no args or env', () => {
    const saved = {
      OMP_SESSION_ID: process.env.OMP_SESSION_ID,
      PI_SESSION_ID: process.env.PI_SESSION_ID,
    };
    delete process.env.OMP_SESSION_ID;
    delete process.env.PI_SESSION_ID;

    try {
      const adapter = createPiAdapter();
      const sessionId = adapter.resolveSessionId({});
      assert.strictEqual(sessionId, undefined);
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v !== undefined) process.env[k] = v;
      }
    }
  });

  it('resolveSessionId picks up OMP_SESSION_ID from env', () => {
    const saved = process.env.OMP_SESSION_ID;
    process.env.OMP_SESSION_ID = 'env-session-99';

    try {
      const adapter = createPiAdapter();
      const sessionId = adapter.resolveSessionId({});
      assert.strictEqual(sessionId, 'env-session-99');
    } finally {
      if (saved !== undefined) {
        process.env.OMP_SESSION_ID = saved;
      } else {
        delete process.env.OMP_SESSION_ID;
      }
    }
  });

  it('exposes required adapter methods', () => {
    const adapter = createPiAdapter();
    const requiredMethods = [
      'isActive',
      'resolveSessionId',
      'resolveStateDir',
      'bindSession',
      'handleStopHook',
      'handleSessionStartHook',
    ];

    for (const method of requiredMethods) {
      assert.strictEqual(
        typeof adapter[method],
        'function',
        `adapter.${method} must be a function`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Guards module tests
// ---------------------------------------------------------------------------

describe('Guards module', () => {
  beforeEach(() => {
    resetGuardState();
  });

  it('checkGuards returns passed=true for fresh state', () => {
    const runState = {
      sessionId: 'test',
      runId: 'run-1',
      runDir: '/tmp/test-run',
      iteration: 0,
      maxIterations: MAX_ITERATIONS_DEFAULT,
      iterationTimes: [],
      startedAt: new Date().toISOString(),
      processId: 'test-process',
      status: 'running',
    };

    const result = checkGuards(runState);
    assert.strictEqual(result.passed, true, 'Guards should pass for fresh state');
    assert.strictEqual(result.reason, undefined);
  });

  it('checkGuards detects max iterations exceeded', () => {
    const runState = {
      sessionId: 'test',
      runId: 'run-1',
      runDir: '/tmp/test-run',
      iteration: 256,
      maxIterations: 256,
      iterationTimes: [],
      startedAt: new Date().toISOString(),
      processId: 'test-process',
      status: 'running',
    };

    const result = checkGuards(runState);
    assert.strictEqual(result.passed, false, 'Guards should fail when max iterations exceeded');
    assert.ok(result.reason.includes('Maximum iterations'), `Reason should mention max iterations, got: ${result.reason}`);
    assert.strictEqual(result.action, 'stop');
  });

  it('checkGuards passes when iteration is below max', () => {
    const runState = {
      sessionId: 'test',
      runId: 'run-1',
      runDir: '/tmp/test-run',
      iteration: 255,
      maxIterations: 256,
      iterationTimes: [],
      startedAt: new Date().toISOString(),
      processId: 'test-process',
      status: 'running',
    };

    const result = checkGuards(runState);
    assert.strictEqual(result.passed, true, 'Guards should pass when iteration < maxIterations');
  });

  it('checkGuards detects custom max iterations exceeded', () => {
    const runState = {
      sessionId: 'test',
      runId: 'run-1',
      runDir: '/tmp/test-run',
      iteration: 10,
      maxIterations: 10,
      iterationTimes: [],
      startedAt: new Date().toISOString(),
      processId: 'test-process',
      status: 'running',
    };

    const result = checkGuards(runState);
    assert.strictEqual(result.passed, false);
    assert.ok(result.reason.includes('10'));
  });
});

// ---------------------------------------------------------------------------
// isDoomLoop tests
// ---------------------------------------------------------------------------

describe('isDoomLoop detection', () => {
  beforeEach(() => {
    resetGuardState();
  });

  it('returns false when not enough iterations', () => {
    const runState = {
      sessionId: 'test',
      runId: 'run-1',
      runDir: '/tmp/test-run',
      iteration: 1,
      maxIterations: 256,
      iterationTimes: [100],
      startedAt: new Date().toISOString(),
      processId: 'test-process',
      status: 'running',
    };

    assert.strictEqual(isDoomLoop(runState), false, 'Should not detect doom loop with < threshold iterations');
  });

  it('returns false when iterations are slow enough', () => {
    const runState = {
      sessionId: 'test',
      runId: 'run-1',
      runDir: '/tmp/test-run',
      iteration: 5,
      maxIterations: 256,
      iterationTimes: [5000, 5000, 5000, 5000, 5000],
      startedAt: new Date().toISOString(),
      processId: 'test-process',
      status: 'running',
    };

    assert.strictEqual(isDoomLoop(runState), false, 'Should not detect doom loop with slow iterations');
  });

  it('returns true when last N iterations are suspiciously fast', () => {
    // All iterations under DOOM_LOOP_MIN_DURATION_MS (2000ms)
    const fastTimes = Array(DOOM_LOOP_THRESHOLD).fill(100);
    const runState = {
      sessionId: 'test',
      runId: 'run-1',
      runDir: '/tmp/test-run',
      iteration: DOOM_LOOP_THRESHOLD,
      maxIterations: 256,
      iterationTimes: fastTimes,
      startedAt: new Date().toISOString(),
      processId: 'test-process',
      status: 'running',
    };

    assert.strictEqual(isDoomLoop(runState), true, 'Should detect doom loop with fast iterations');
  });

  it('returns false with empty iterationTimes', () => {
    const runState = {
      sessionId: 'test',
      runId: 'run-1',
      runDir: '/tmp/test-run',
      iteration: 0,
      maxIterations: 256,
      iterationTimes: [],
      startedAt: new Date().toISOString(),
      processId: 'test-process',
      status: 'running',
    };

    assert.strictEqual(isDoomLoop(runState), false);
  });
});

// ---------------------------------------------------------------------------
// Task interceptor tests
// ---------------------------------------------------------------------------

describe('Task interceptor', () => {
  it('INTERCEPTED_TOOLS list is correct', () => {
    const expected = ['task', 'todo_write', 'TodoWrite', 'TaskCreate', 'sub_agent', 'quick_task'];
    assert.deepStrictEqual(INTERCEPTED_TOOLS, expected);
  });

  it('shouldIntercept returns true for intercepted tools', () => {
    for (const tool of INTERCEPTED_TOOLS) {
      assert.strictEqual(shouldIntercept(tool), true, `shouldIntercept("${tool}") should be true`);
    }
  });

  it('shouldIntercept returns false for non-intercepted tools', () => {
    const safeTool = 'Read';
    assert.strictEqual(shouldIntercept(safeTool), false, 'shouldIntercept("Read") should be false');
  });

  it('shouldIntercept returns false for empty string', () => {
    assert.strictEqual(shouldIntercept(''), false);
  });

  it('interceptToolCall returns null when no active run', () => {
    // No sessions are active, so interceptToolCall should allow the call
    const result = interceptToolCall('task', {}, null);
    assert.strictEqual(result, null, 'Should return null when no active run');
  });
});

// ---------------------------------------------------------------------------
// Loop driver: extractPromiseTag
// ---------------------------------------------------------------------------

describe('extractPromiseTag', () => {
  it('extracts tag content from valid promise tag', () => {
    const text = 'Some output <promise>task-completed-123</promise> more text';
    const result = extractPromiseTag(text);
    assert.strictEqual(result, 'task-completed-123');
  });

  it('returns null when no promise tag present', () => {
    const text = 'Just regular output with no special tags';
    const result = extractPromiseTag(text);
    assert.strictEqual(result, null);
  });

  it('returns null for empty string', () => {
    assert.strictEqual(extractPromiseTag(''), null);
  });

  it('extracts first promise tag when multiple present', () => {
    const text = '<promise>first</promise> <promise>second</promise>';
    const result = extractPromiseTag(text);
    assert.strictEqual(result, 'first');
  });

  it('handles promise tag at start of string', () => {
    const text = '<promise>hello</promise>';
    const result = extractPromiseTag(text);
    assert.strictEqual(result, 'hello');
  });

  it('returns null for empty promise tag', () => {
    // The regex [^<]+ requires at least one char
    const text = '<promise></promise>';
    const result = extractPromiseTag(text);
    assert.strictEqual(result, null);
  });
});

// ---------------------------------------------------------------------------
// Loop driver: buildContinuationPrompt
// ---------------------------------------------------------------------------

describe('buildContinuationPrompt', () => {
  it('produces prompt with no pending effects', () => {
    const iterResult = { status: 'waiting', nextActions: [] };
    const runState = { runId: 'run-abc', iteration: 3 };
    const prompt = buildContinuationPrompt(iterResult, runState);

    assert.ok(prompt.includes('run-abc'), 'Should include run ID');
    assert.ok(prompt.includes('3'), 'Should include iteration number');
    assert.ok(prompt.includes('No pending effects'), 'Should mention no pending effects');
  });

  it('produces prompt listing pending effects', () => {
    const iterResult = {
      status: 'waiting',
      nextActions: [
        { effectId: 'eff-1', invocationKey: 'key1', kind: 'node', label: 'Run tests' },
        { effectId: 'eff-2', invocationKey: 'key2', kind: 'shell', label: 'Build project' },
      ],
    };
    const runState = { runId: 'run-xyz', iteration: 5 };
    const prompt = buildContinuationPrompt(iterResult, runState);

    assert.ok(prompt.includes('eff-1'), 'Should include first effect ID');
    assert.ok(prompt.includes('eff-2'), 'Should include second effect ID');
    assert.ok(prompt.includes('node'), 'Should include node kind');
    assert.ok(prompt.includes('shell'), 'Should include shell kind');
    assert.ok(prompt.includes('Pending effects (2)'), 'Should show correct pending count');
  });

  it('includes instructions by effect kind', () => {
    const iterResult = {
      status: 'waiting',
      nextActions: [
        { effectId: 'eff-1', invocationKey: 'k', kind: 'breakpoint', label: 'Approve' },
      ],
    };
    const runState = { runId: 'run-1', iteration: 1 };
    const prompt = buildContinuationPrompt(iterResult, runState);

    assert.ok(prompt.includes('breakpoint'), 'Should include breakpoint kind');
    assert.ok(prompt.includes('approval'), 'Should include approval instruction for breakpoint');
  });
});
