/**
 * TUI widget rendering tests for the babysitter-pi plugin.
 *
 * Tests formatElapsed, formatTodoWidget, buildTodoItems, formatRunStatus,
 * formatEffectResult, and updateStatusLine.
 *
 * Run with: node --experimental-strip-types --test test/tui.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// Extension module imports (TypeScript source)
import {
  formatElapsed,
  renderRunWidget,
  renderEffectsWidget,
  renderQualityWidget,
  clearWidgets,
} from '../extensions/babysitter/tui-widgets.ts';

import {
  buildTodoItems,
  formatTodoWidget,
} from '../extensions/babysitter/todo-replacement.ts';

import {
  formatRunStatus,
  formatEffectResult,
  formatIterationSummary,
} from '../extensions/babysitter/tool-renderer.ts';

import {
  updateStatusLine,
  clearStatusLine,
} from '../extensions/babysitter/status-line.ts';

// ---------------------------------------------------------------------------
// formatElapsed tests
// ---------------------------------------------------------------------------

describe('formatElapsed', () => {
  it('returns seconds for times under a minute', () => {
    // Use a timestamp 30 seconds ago
    const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString();
    const result = formatElapsed(thirtySecondsAgo);
    // Should be something like "30s" (give or take a second for test execution time)
    assert.ok(/^\d+s$/.test(result), `Expected seconds-only format, got: "${result}"`);
    const secs = parseInt(result, 10);
    assert.ok(secs >= 29 && secs <= 32, `Expected ~30s, got: ${secs}s`);
  });

  it('returns minutes and seconds for times under an hour', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000 - 32_000).toISOString();
    const result = formatElapsed(fiveMinutesAgo);
    assert.ok(/^\d+m \d+s$/.test(result), `Expected "Nm Ns" format, got: "${result}"`);
    assert.ok(result.startsWith('5m'), `Expected to start with "5m", got: "${result}"`);
  });

  it('returns hours, minutes, and seconds for times over an hour', () => {
    const oneHourAgo = new Date(Date.now() - 3600_000 - 12 * 60_000 - 5_000).toISOString();
    const result = formatElapsed(oneHourAgo);
    assert.ok(/^\d+h \d+m \d+s$/.test(result), `Expected "Nh Nm Ns" format, got: "${result}"`);
    assert.ok(result.startsWith('1h'), `Expected to start with "1h", got: "${result}"`);
  });

  it('returns "0s" for a timestamp in the future', () => {
    const futureTime = new Date(Date.now() + 60_000).toISOString();
    const result = formatElapsed(futureTime);
    assert.strictEqual(result, '0s', 'Future timestamps should clamp to 0s');
  });

  it('returns "0s" for current time', () => {
    const now = new Date().toISOString();
    const result = formatElapsed(now);
    // Could be 0s or 1s depending on timing
    assert.ok(/^[01]s$/.test(result), `Expected "0s" or "1s", got: "${result}"`);
  });
});

// ---------------------------------------------------------------------------
// formatTodoWidget tests
// ---------------------------------------------------------------------------

describe('formatTodoWidget', () => {
  it('produces correct checkbox lines for each status', () => {
    const items = [
      { id: '1', title: 'Build app', status: 'completed', kind: 'node' },
      { id: '2', title: 'Run tests', status: 'in-progress', kind: 'shell' },
      { id: '3', title: 'Deploy', status: 'failed', kind: 'agent' },
    ];

    const lines = formatTodoWidget(items);
    assert.strictEqual(lines.length, 3);
    assert.strictEqual(lines[0], '[x] Build app (node)');
    assert.strictEqual(lines[1], '[ ] Run tests (shell)');
    assert.strictEqual(lines[2], '[!] Deploy (agent)');
  });

  it('returns empty array for empty items', () => {
    const lines = formatTodoWidget([]);
    assert.strictEqual(lines.length, 0);
  });

  it('handles single item', () => {
    const items = [{ id: 'a', title: 'Task A', status: 'in-progress', kind: 'node' }];
    const lines = formatTodoWidget(items);
    assert.strictEqual(lines.length, 1);
    assert.strictEqual(lines[0], '[ ] Task A (node)');
  });
});

// ---------------------------------------------------------------------------
// buildTodoItems tests
// ---------------------------------------------------------------------------

describe('buildTodoItems', () => {
  it('extracts items from EFFECT_REQUESTED events', () => {
    const events = [
      {
        type: 'EFFECT_REQUESTED',
        data: { effectId: 'e1', label: 'Build project', kind: 'node' },
      },
      {
        type: 'EFFECT_REQUESTED',
        data: { effectId: 'e2', label: 'Run tests', kind: 'shell' },
      },
    ];

    const items = buildTodoItems(events);
    assert.strictEqual(items.length, 2);
    assert.strictEqual(items[0].id, 'e1');
    assert.strictEqual(items[0].title, 'Build project');
    assert.strictEqual(items[0].kind, 'node');
    assert.strictEqual(items[0].status, 'in-progress');
    assert.strictEqual(items[1].id, 'e2');
  });

  it('marks items as completed on EFFECT_RESOLVED with status ok', () => {
    const events = [
      {
        type: 'EFFECT_REQUESTED',
        data: { effectId: 'e1', label: 'Build', kind: 'node' },
      },
      {
        type: 'EFFECT_RESOLVED',
        data: { effectId: 'e1', status: 'ok' },
      },
    ];

    const items = buildTodoItems(events);
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].status, 'completed');
  });

  it('marks items as failed on EFFECT_RESOLVED with error status', () => {
    const events = [
      {
        type: 'EFFECT_REQUESTED',
        data: { effectId: 'e1', label: 'Deploy', kind: 'agent' },
      },
      {
        type: 'EFFECT_RESOLVED',
        data: { effectId: 'e1', status: 'error' },
      },
    ];

    const items = buildTodoItems(events);
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].status, 'failed');
  });

  it('returns empty array for empty events', () => {
    const items = buildTodoItems([]);
    assert.strictEqual(items.length, 0);
  });

  it('ignores non-effect events', () => {
    const events = [
      { type: 'RUN_CREATED', data: {} },
      { type: 'EFFECT_REQUESTED', data: { effectId: 'e1', label: 'Task', kind: 'node' } },
      { type: 'RUN_COMPLETED', data: {} },
    ];

    const items = buildTodoItems(events);
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].id, 'e1');
  });

  it('handles mixed requested and resolved events correctly', () => {
    const events = [
      { type: 'EFFECT_REQUESTED', data: { effectId: 'e1', label: 'A', kind: 'node' } },
      { type: 'EFFECT_REQUESTED', data: { effectId: 'e2', label: 'B', kind: 'shell' } },
      { type: 'EFFECT_RESOLVED', data: { effectId: 'e1', status: 'ok' } },
      { type: 'EFFECT_REQUESTED', data: { effectId: 'e3', label: 'C', kind: 'agent' } },
      { type: 'EFFECT_RESOLVED', data: { effectId: 'e3', status: 'error' } },
    ];

    const items = buildTodoItems(events);
    assert.strictEqual(items.length, 3);

    const e1 = items.find((i) => i.id === 'e1');
    const e2 = items.find((i) => i.id === 'e2');
    const e3 = items.find((i) => i.id === 'e3');

    assert.strictEqual(e1.status, 'completed');
    assert.strictEqual(e2.status, 'in-progress');
    assert.strictEqual(e3.status, 'failed');
  });
});

// ---------------------------------------------------------------------------
// formatRunStatus tests
// ---------------------------------------------------------------------------

describe('formatRunStatus', () => {
  it('produces formatted output with all fields', () => {
    const data = {
      runId: 'run-abc-123',
      processId: 'my-process',
      iteration: 5,
      status: 'running',
      pendingEffectsCount: 3,
    };

    const output = formatRunStatus(data);
    assert.ok(output.includes('run-abc-123'), 'Should include run ID');
    assert.ok(output.includes('my-process'), 'Should include process ID');
    assert.ok(output.includes('5'), 'Should include iteration');
    assert.ok(output.includes('running'), 'Should include status');
    assert.ok(output.includes('3'), 'Should include pending effects count');
    assert.ok(output.includes('Run Status'), 'Should include header');
  });

  it('handles missing/null data gracefully', () => {
    const output = formatRunStatus(null);
    assert.ok(output.includes('unknown'), 'Should use "unknown" for missing runId');
    assert.ok(typeof output === 'string', 'Should return a string');
  });

  it('handles empty object', () => {
    const output = formatRunStatus({});
    assert.ok(output.includes('unknown'), 'Should use defaults for empty object');
  });

  it('uses box-drawing characters', () => {
    const output = formatRunStatus({ runId: 'test' });
    // Check for Unicode box chars
    assert.ok(output.includes('\u250C') || output.includes('\u2500'), 'Should contain box-drawing characters');
  });
});

// ---------------------------------------------------------------------------
// formatEffectResult tests
// ---------------------------------------------------------------------------

describe('formatEffectResult', () => {
  it('produces compact line with all fields', () => {
    const data = { effectId: 'eff-42', kind: 'node', status: 'ok' };
    const line = formatEffectResult(data);
    assert.strictEqual(line, 'Effect eff-42 (node): ok');
  });

  it('handles missing fields with defaults', () => {
    const line = formatEffectResult({});
    assert.strictEqual(line, 'Effect unknown (unknown): unknown');
  });

  it('handles null input', () => {
    const line = formatEffectResult(null);
    assert.strictEqual(line, 'Effect unknown (unknown): unknown');
  });

  it('handles error status', () => {
    const data = { effectId: 'eff-99', kind: 'shell', status: 'error' };
    const line = formatEffectResult(data);
    assert.strictEqual(line, 'Effect eff-99 (shell): error');
  });
});

// ---------------------------------------------------------------------------
// formatIterationSummary tests
// ---------------------------------------------------------------------------

describe('formatIterationSummary', () => {
  it('formats iteration summary correctly', () => {
    const data = { iteration: 7, status: 'waiting', pendingCount: 2 };
    const line = formatIterationSummary(data);
    assert.strictEqual(line, 'Iteration 7: waiting | 2 pending effects');
  });

  it('uses defaults for missing fields', () => {
    const line = formatIterationSummary({});
    assert.strictEqual(line, 'Iteration 0: unknown | 0 pending effects');
  });
});

// ---------------------------------------------------------------------------
// updateStatusLine tests
// ---------------------------------------------------------------------------

describe('updateStatusLine', () => {
  it('sets idle text when runState is null', () => {
    let capturedKey = '';
    let capturedText = '';
    const mockPi = {
      setStatus(key, text) {
        capturedKey = key;
        capturedText = text;
      },
    };

    updateStatusLine(null, mockPi);
    assert.strictEqual(capturedKey, 'babysitter');
    assert.strictEqual(capturedText, 'Babysitter: idle');
  });

  it('sets done text for completed status', () => {
    let capturedText = '';
    const mockPi = {
      setStatus(_key, text) {
        capturedText = text;
      },
    };

    updateStatusLine(
      {
        sessionId: 'test',
        runId: 'r1',
        runDir: '/tmp/r1',
        iteration: 5,
        maxIterations: 256,
        iterationTimes: [],
        startedAt: new Date().toISOString(),
        processId: 'p1',
        status: 'completed',
      },
      mockPi,
    );

    assert.strictEqual(capturedText, 'Babysitter: done');
  });

  it('sets FAILED text for failed status', () => {
    let capturedText = '';
    const mockPi = {
      setStatus(_key, text) {
        capturedText = text;
      },
    };

    updateStatusLine(
      {
        sessionId: 'test',
        runId: 'r1',
        runDir: '/tmp/r1',
        iteration: 3,
        maxIterations: 256,
        iterationTimes: [],
        startedAt: new Date().toISOString(),
        processId: 'p1',
        status: 'failed',
      },
      mockPi,
    );

    assert.strictEqual(capturedText, 'Babysitter: FAILED');
  });

  it('sets running text with iteration info for running status', () => {
    let capturedText = '';
    const mockPi = {
      setStatus(_key, text) {
        capturedText = text;
      },
    };

    updateStatusLine(
      {
        sessionId: 'test',
        runId: 'r1',
        runDir: '/tmp/r1',
        iteration: 7,
        maxIterations: 256,
        iterationTimes: [],
        startedAt: new Date().toISOString(),
        processId: 'p1',
        status: 'running',
      },
      mockPi,
    );

    assert.ok(capturedText.includes('iter 7'), `Should include iteration count, got: "${capturedText}"`);
    assert.ok(capturedText.includes('Babysitter:'), `Should include Babysitter prefix, got: "${capturedText}"`);
  });

  it('sets idle text for unknown status', () => {
    let capturedText = '';
    const mockPi = {
      setStatus(_key, text) {
        capturedText = text;
      },
    };

    updateStatusLine(
      {
        sessionId: 'test',
        runId: 'r1',
        runDir: '/tmp/r1',
        iteration: 0,
        maxIterations: 256,
        iterationTimes: [],
        startedAt: new Date().toISOString(),
        processId: 'p1',
        status: 'idle',
      },
      mockPi,
    );

    assert.strictEqual(capturedText, 'Babysitter: idle');
  });
});

// ---------------------------------------------------------------------------
// clearStatusLine tests
// ---------------------------------------------------------------------------

describe('clearStatusLine', () => {
  it('clears the babysitter status', () => {
    let capturedText = '';
    const mockPi = {
      setStatus(_key, text) {
        capturedText = text;
      },
    };

    clearStatusLine(mockPi);
    assert.strictEqual(capturedText, '');
  });
});

// ---------------------------------------------------------------------------
// renderRunWidget tests
// ---------------------------------------------------------------------------

describe('renderRunWidget', () => {
  it('passes correct lines to pi.setWidget', () => {
    let capturedKey = '';
    let capturedLines = [];
    const mockPi = {
      setWidget(key, lines) {
        capturedKey = key;
        capturedLines = lines;
      },
    };

    renderRunWidget(
      {
        sessionId: 'test',
        runId: 'run-widget-test',
        runDir: '/tmp/r1',
        iteration: 3,
        maxIterations: 100,
        iterationTimes: [],
        startedAt: new Date().toISOString(),
        processId: 'my-proc',
        status: 'running',
      },
      mockPi,
    );

    assert.strictEqual(capturedKey, 'babysitter:run');
    assert.ok(capturedLines.length >= 3, 'Should produce at least 3 lines');
    assert.ok(capturedLines[0].includes('run-widget-test'), 'First line should include run ID');
    assert.ok(capturedLines[1].includes('my-proc'), 'Second line should include process ID');
    assert.ok(capturedLines[2].includes('3/100'), 'Third line should include iteration info');
  });
});

// ---------------------------------------------------------------------------
// renderEffectsWidget tests
// ---------------------------------------------------------------------------

describe('renderEffectsWidget', () => {
  it('shows zero count for empty effects', () => {
    let capturedLines = [];
    const mockPi = {
      setWidget(_key, lines) {
        capturedLines = lines;
      },
    };

    renderEffectsWidget([], mockPi);
    assert.strictEqual(capturedLines.length, 1);
    assert.ok(capturedLines[0].includes('0'), 'Should show zero count');
  });

  it('lists effects with kind and title', () => {
    let capturedLines = [];
    const mockPi = {
      setWidget(_key, lines) {
        capturedLines = lines;
      },
    };

    renderEffectsWidget(
      [
        { kind: 'node', title: 'Build' },
        { kind: 'shell', label: 'Test' },
      ],
      mockPi,
    );

    assert.ok(capturedLines.length >= 3, 'Should have header + effect lines');
    assert.ok(capturedLines[0].includes('2'), 'Header should show count');
    assert.ok(capturedLines[1].includes('node'), 'Should include node kind');
    assert.ok(capturedLines[1].includes('Build'), 'Should include Build title');
    assert.ok(capturedLines[2].includes('shell'), 'Should include shell kind');
  });
});

// ---------------------------------------------------------------------------
// clearWidgets tests
// ---------------------------------------------------------------------------

describe('clearWidgets', () => {
  it('clears all widget keys', () => {
    const clearedKeys = [];
    const mockPi = {
      setWidget(key, lines) {
        if (lines.length === 0) clearedKeys.push(key);
      },
    };

    clearWidgets(mockPi);
    assert.ok(clearedKeys.includes('babysitter:run'), 'Should clear run widget');
    assert.ok(clearedKeys.includes('babysitter:effects'), 'Should clear effects widget');
    assert.ok(clearedKeys.includes('babysitter:quality'), 'Should clear quality widget');
  });
});
