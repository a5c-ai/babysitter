import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import { parseRunDir, getTaskDetail } from '../../lib/parser';
import { RunCache } from '../../lib/run-cache';
import { generateWebviewContent } from '../../panels/webview-content';
import { createTestWorkspace } from './__helpers__/test-fixtures';

/**
 * Integration test: Parser -> Cache -> Detail
 *
 * Tests that parseRunDir output correctly feeds into RunCache,
 * and that task details from parser match what the webview displays.
 */

describe('Integration: Parser -> Cache -> Detail', () => {
  let tmpDir: string;
  let cleanup: () => void;
  let cache: RunCache;
  let runsDir: string;

  beforeEach(() => {
    const workspace = createTestWorkspace();
    tmpDir = workspace.tmpDir;
    runsDir = workspace.runsDir;
    cleanup = workspace.cleanup;

    cache = new RunCache(tmpDir);
  });

  afterEach(() => {
    cleanup();
  });

  it('parseRunDir output feeds correctly into cache', () => {
    const runDir = path.join(runsDir, 'test-run-001');
    const parsedRun = parseRunDir(runDir);
    expect(parsedRun).not.toBeNull();

    // Manually add to cache (simulating what refresh does)
    const refreshedRun = cache.refresh('test-run-001');
    expect(refreshedRun).not.toBeNull();

    // Compare parser output with cache output
    expect(refreshedRun!.runId).toBe(parsedRun!.runId);
    expect(refreshedRun!.processId).toBe(parsedRun!.processId);
    expect(refreshedRun!.status).toBe(parsedRun!.status);
    expect(refreshedRun!.totalTasks).toBe(parsedRun!.totalTasks);
    expect(refreshedRun!.completedTasks).toBe(parsedRun!.completedTasks);
    expect(refreshedRun!.events.length).toBe(parsedRun!.events.length);
    expect(refreshedRun!.tasks.length).toBe(parsedRun!.tasks.length);
  });

  it('task details from parser match what webview would display', () => {
    const runDir = path.join(runsDir, 'test-run-001');
    const run = parseRunDir(runDir);
    expect(run).not.toBeNull();
    expect(run!.tasks.length).toBe(1);

    const taskFromRun = run!.tasks[0];
    const taskDetail = getTaskDetail(runDir, taskFromRun.effectId);

    expect(taskDetail).not.toBeNull();
    expect(taskDetail!.effectId).toBe(taskFromRun.effectId);
    expect(taskDetail!.kind).toBe(taskFromRun.kind);
    expect(taskDetail!.title).toBe(taskFromRun.title);
    expect(taskDetail!.status).toBe(taskFromRun.status);

    // TaskDetail has additional fields (input, result, taskDef) that TaskEffect doesn't
    expect(taskDetail!.input).toBeDefined();
    expect(taskDetail!.result).toBeDefined();
    expect(taskDetail!.taskDef).toBeDefined();
  });

  it('webview content generation uses data from cache', () => {
    const run = cache.refresh('test-run-001');
    expect(run).not.toBeNull();

    const html = generateWebviewContent(run!, 'test-nonce', 'mock-csp');

    // Verify HTML contains run data
    expect(html).toContain('test-run-001');
    expect(html).toContain('test-process');
    expect(html).toContain('completed');
    expect(html).toContain('1/1 tasks');

    // Verify task pipeline is rendered
    expect(html).toContain('effect-001');
    expect(html).toContain('Run node task');
  });

  it('breakpoint question flows from parser to cache to webview', () => {
    const run = cache.refresh('test-run-003');
    expect(run).not.toBeNull();

    expect(run!.breakpointQuestion).toBe('Do you approve deploying version 2.0 to production?');
    expect(run!.breakpointEffectId).toBe('effect-bp-001');

    const html = generateWebviewContent(run!, 'test-nonce', 'mock-csp');

    // Verify breakpoint banner is rendered
    expect(html).toContain('breakpoint-banner');
    expect(html).toContain('Do you approve deploying version 2.0 to production?');
    expect(html).toContain('effect-bp-001');
  });

  it('error information flows from parser to cache to webview', () => {
    const run = cache.refresh('test-run-002');
    expect(run).not.toBeNull();

    expect(run!.status).toBe('failed');
    expect(run!.failureError).toBe('Process failed due to task error');
    expect(run!.failedTasks).toBe(1);

    const errorTask = run!.tasks[0];
    expect(errorTask.status).toBe('error');
    expect(errorTask.error).toBe('Task execution failed: timeout exceeded');

    const html = generateWebviewContent(run!, 'test-nonce', 'mock-csp');

    // Verify failed status is shown
    expect(html).toContain('status-badge failed');
    expect(html).toContain('FAILED');
  });

  it('task durations calculated by parser appear in cache and webview', () => {
    const run = cache.refresh('test-run-001');
    expect(run).not.toBeNull();

    const task = run!.tasks[0];
    expect(task.duration).toBe(4000); // From fixture: 08:00:05 - 08:00:01

    const html = generateWebviewContent(run!, 'test-nonce', 'mock-csp');

    // Duration should be formatted in webview (4000ms = 4s)
    expect(html).toContain('4s');
  });

  it('journal events from parser are available in cache', () => {
    const run = cache.refresh('test-run-001');
    expect(run).not.toBeNull();

    expect(run!.events.length).toBe(4);
    expect(run!.events[0].type).toBe('RUN_CREATED');
    expect(run!.events[1].type).toBe('EFFECT_REQUESTED');
    expect(run!.events[2].type).toBe('EFFECT_RESOLVED');
    expect(run!.events[3].type).toBe('RUN_COMPLETED');

    // Events should maintain sequential order from parser
    expect(run!.events[0].seq).toBe(1);
    expect(run!.events[1].seq).toBe(2);
    expect(run!.events[2].seq).toBe(3);
    expect(run!.events[3].seq).toBe(4);
  });

  it('task detail reads input/output that parser embedded in taskDef', () => {
    const runDir = path.join(runsDir, 'test-run-001');
    const taskDetail = getTaskDetail(runDir, 'effect-001');
    expect(taskDetail).not.toBeNull();

    // Parser reads task.json and embeds it
    expect(taskDetail!.input).toEqual({ command: 'echo hello' });
    expect(taskDetail!.taskDef).toBeDefined();
    expect(taskDetail!.taskDef!['taskId']).toBe('my-task');
    expect(taskDetail!.taskDef!['kind']).toBe('node');
  });

  it('cache refresh handles multiple runs without interference', () => {
    const completed = cache.refresh('test-run-001');
    const failed = cache.refresh('test-run-002');
    const waiting = cache.refresh('test-run-003');

    expect(completed).not.toBeNull();
    expect(failed).not.toBeNull();
    expect(waiting).not.toBeNull();

    const allRuns = cache.getAll();
    expect(allRuns.length).toBe(3);

    // Each run maintains its own state
    const completedFromCache = cache.getById('test-run-001');
    const failedFromCache = cache.getById('test-run-002');
    const waitingFromCache = cache.getById('test-run-003');

    expect(completedFromCache!.status).toBe('completed');
    expect(failedFromCache!.status).toBe('failed');
    expect(waitingFromCache!.status).toBe('waiting');
  });

  it('cache summary aggregates data parsed from all runs', () => {
    cache.refresh('test-run-001');
    cache.refresh('test-run-002');
    cache.refresh('test-run-003');

    const summary = cache.getSummary();

    expect(summary.total).toBe(3);
    expect(summary.active).toBe(1); // waiting run
    expect(summary.completed).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.breakpoints).toBe(1); // waiting run with breakpoint
  });

  it('cache digests provide lightweight view of parsed runs', () => {
    cache.refresh('test-run-001');
    cache.refresh('test-run-002');
    cache.refresh('test-run-003');

    const digests = cache.getDigests();

    expect(digests.length).toBe(3);

    const completedDigest = digests.find((d) => d.runId === 'test-run-001');
    expect(completedDigest).toBeDefined();
    expect(completedDigest!.status).toBe('completed');
    expect(completedDigest!.taskCount).toBe(1);
    expect(completedDigest!.completedTasks).toBe(1);

    const waitingDigest = digests.find((d) => d.runId === 'test-run-003');
    expect(waitingDigest).toBeDefined();
    expect(waitingDigest!.status).toBe('waiting');
    expect(waitingDigest!.waitingKind).toBe('breakpoint');
    expect(waitingDigest!.pendingBreakpoints).toBe(1);
  });

  it('webview renders event stream from parsed journal', () => {
    const run = cache.refresh('test-run-001');
    expect(run).not.toBeNull();

    const html = generateWebviewContent(run!, 'test-nonce', 'mock-csp');

    // Events section should show count
    expect(html).toContain('Events (4)');

    // Event types should be rendered
    expect(html).toContain('RUN_CREATED');
    expect(html).toContain('EFFECT_REQUESTED');
    expect(html).toContain('EFFECT_RESOLVED');
    expect(html).toContain('RUN_COMPLETED');
  });

  it('parser-generated task metadata flows to webview tabs', () => {
    const run = cache.refresh('test-run-001');
    expect(run).not.toBeNull();

    const html = generateWebviewContent(run!, 'test-nonce', 'mock-csp');

    // Tabs should be present
    expect(html).toContain('data-tab="overview"');
    expect(html).toContain('data-tab="agent"');
    expect(html).toContain('data-tab="logs"');
    expect(html).toContain('data-tab="data"');
    expect(html).toContain('data-tab="breakpoint"');

    // Task can be selected via onclick
    expect(html).toContain('onclick="selectTask(\'effect-001\')"');
  });
});
