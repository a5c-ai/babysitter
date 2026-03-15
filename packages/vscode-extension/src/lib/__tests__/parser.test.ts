import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parseJournalDir, parseJournalDirIncremental, parseRunDir, getTaskDetail } from '../parser';

const FIXTURES = path.resolve(__dirname, '../../__fixtures__');
const COMPLETED_FIXTURE = path.join(FIXTURES, 'test-run-completed');
const FAILED_FIXTURE = path.join(FIXTURES, 'test-run-failed');
const WAITING_FIXTURE = path.join(FIXTURES, 'test-run-waiting');

// ---------------------------------------------------------------------------
// parseJournalDir
// ---------------------------------------------------------------------------
describe('parseJournalDir', () => {
  it('returns sorted events from completed fixture', () => {
    const journalPath = path.join(COMPLETED_FIXTURE, 'journal');
    const events = parseJournalDir(journalPath);
    expect(events).toHaveLength(4);
    // Should be sorted by seq
    expect(events[0].seq).toBe(1);
    expect(events[1].seq).toBe(2);
    expect(events[2].seq).toBe(3);
    expect(events[3].seq).toBe(4);
  });

  it('extracts seq and id from filenames', () => {
    const journalPath = path.join(COMPLETED_FIXTURE, 'journal');
    const events = parseJournalDir(journalPath);
    expect(events[0].id).toBe('01TEST00000000000000001');
    expect(events[0].seq).toBe(1);
    expect(events[3].id).toBe('01TEST00000000000000004');
    expect(events[3].seq).toBe(4);
  });

  it('normalizes recordedAt to ts', () => {
    const journalPath = path.join(COMPLETED_FIXTURE, 'journal');
    const events = parseJournalDir(journalPath);
    expect(events[0].ts).toBe('2026-03-10T08:00:00.000Z');
    expect(events[1].ts).toBe('2026-03-10T08:00:01.000Z');
  });

  it('extracts event type from type field', () => {
    const journalPath = path.join(COMPLETED_FIXTURE, 'journal');
    const events = parseJournalDir(journalPath);
    expect(events[0].type).toBe('RUN_CREATED');
    expect(events[1].type).toBe('EFFECT_REQUESTED');
    expect(events[2].type).toBe('EFFECT_RESOLVED');
    expect(events[3].type).toBe('RUN_COMPLETED');
  });

  it('extracts payload from data field', () => {
    const journalPath = path.join(COMPLETED_FIXTURE, 'journal');
    const events = parseJournalDir(journalPath);
    expect(events[0].payload).toEqual({ runId: 'test-run-001', processId: 'test-process' });
    expect(events[1].payload['effectId']).toBe('effect-001');
  });

  it('extracts checksum field', () => {
    const journalPath = path.join(COMPLETED_FIXTURE, 'journal');
    const events = parseJournalDir(journalPath);
    expect(events[0].checksum).toBe('abc123');
  });

  it('returns empty array for nonexistent directory', () => {
    const events = parseJournalDir('/nonexistent/path/journal');
    expect(events).toEqual([]);
  });

  it('returns empty array for empty directory', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parser-test-'));
    try {
      const events = parseJournalDir(tmpDir);
      expect(events).toEqual([]);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('skips malformed JSON files gracefully', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parser-test-'));
    try {
      // Write a valid file
      fs.writeFileSync(
        path.join(tmpDir, '000001.AAAAAAAAAA.json'),
        JSON.stringify({ type: 'RUN_CREATED', recordedAt: '2026-01-01T00:00:00Z', data: {} }),
      );
      // Write a malformed file
      fs.writeFileSync(path.join(tmpDir, '000002.BBBBBBBBBB.json'), 'not-json{{{');
      const events = parseJournalDir(tmpDir);
      expect(events).toHaveLength(1);
      expect(events[0].seq).toBe(1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('skips files that do not match the filename pattern', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parser-test-'));
    try {
      fs.writeFileSync(path.join(tmpDir, 'readme.json'), '{}');
      fs.writeFileSync(
        path.join(tmpDir, '000001.AAAAAAAAAA.json'),
        JSON.stringify({ type: 'RUN_CREATED', recordedAt: '2026-01-01T00:00:00Z', data: {} }),
      );
      const events = parseJournalDir(tmpDir);
      expect(events).toHaveLength(1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('supports skipCount parameter', () => {
    const journalPath = path.join(COMPLETED_FIXTURE, 'journal');
    const events = parseJournalDir(journalPath, 2);
    expect(events).toHaveLength(2);
    expect(events[0].seq).toBe(3);
    expect(events[1].seq).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// parseJournalDirIncremental
// ---------------------------------------------------------------------------
describe('parseJournalDirIncremental', () => {
  it('returns all events when previousFileCount is 0', () => {
    const journalPath = path.join(COMPLETED_FIXTURE, 'journal');
    const result = parseJournalDirIncremental(journalPath, 0);
    expect(result.events).toHaveLength(4);
    expect(result.totalFileCount).toBe(4);
  });

  it('returns only new events after previousFileCount', () => {
    const journalPath = path.join(COMPLETED_FIXTURE, 'journal');
    const result = parseJournalDirIncremental(journalPath, 2);
    expect(result.events).toHaveLength(2);
    expect(result.events[0].seq).toBe(3);
    expect(result.totalFileCount).toBe(4);
  });

  it('returns empty events when no new files', () => {
    const journalPath = path.join(COMPLETED_FIXTURE, 'journal');
    const result = parseJournalDirIncremental(journalPath, 4);
    expect(result.events).toEqual([]);
    expect(result.totalFileCount).toBe(4);
  });

  it('returns empty for nonexistent directory', () => {
    const result = parseJournalDirIncremental('/nonexistent/path', 0);
    expect(result.events).toEqual([]);
    expect(result.totalFileCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// parseRunDir
// ---------------------------------------------------------------------------
describe('parseRunDir', () => {
  it('parses a completed run', () => {
    const run = parseRunDir(COMPLETED_FIXTURE);
    expect(run).not.toBeNull();
    expect(run!.runId).toBe('test-run-001');
    expect(run!.processId).toBe('test-process');
    expect(run!.status).toBe('completed');
    expect(run!.prompt).toBe('Test run prompt');
  });

  it('calculates duration for completed run', () => {
    const run = parseRunDir(COMPLETED_FIXTURE);
    expect(run).not.toBeNull();
    // createdAt: 08:00:00, last event (RUN_COMPLETED): 08:00:10 => 10000ms
    expect(run!.duration).toBe(10000);
  });

  it('builds tasks from journal events', () => {
    const run = parseRunDir(COMPLETED_FIXTURE);
    expect(run).not.toBeNull();
    expect(run!.tasks).toHaveLength(1);
    expect(run!.tasks[0].effectId).toBe('effect-001');
    expect(run!.tasks[0].kind).toBe('node');
    expect(run!.tasks[0].status).toBe('resolved');
    expect(run!.tasks[0].title).toBe('Run node task');
  });

  it('calculates task duration from requested to resolved', () => {
    const run = parseRunDir(COMPLETED_FIXTURE);
    expect(run).not.toBeNull();
    // EFFECT_REQUESTED at 08:00:01, EFFECT_RESOLVED at 08:00:05 => 4000ms
    expect(run!.tasks[0].duration).toBe(4000);
  });

  it('counts completed and failed tasks', () => {
    const run = parseRunDir(COMPLETED_FIXTURE);
    expect(run).not.toBeNull();
    expect(run!.totalTasks).toBe(1);
    expect(run!.completedTasks).toBe(1);
    expect(run!.failedTasks).toBe(0);
  });

  it('parses a failed run', () => {
    const run = parseRunDir(FAILED_FIXTURE);
    expect(run).not.toBeNull();
    expect(run!.runId).toBe('test-run-002');
    expect(run!.status).toBe('failed');
    expect(run!.failureError).toBe('Process failed due to task error');
    expect(run!.failureMessage).toBe('Task execution failed: timeout exceeded');
  });

  it('tracks error tasks in failed run', () => {
    const run = parseRunDir(FAILED_FIXTURE);
    expect(run).not.toBeNull();
    expect(run!.failedTasks).toBe(1);
    expect(run!.tasks[0].status).toBe('error');
    expect(run!.tasks[0].error).toBe('Task execution failed: timeout exceeded');
  });

  it('parses a waiting run with breakpoint', () => {
    const run = parseRunDir(WAITING_FIXTURE);
    expect(run).not.toBeNull();
    expect(run!.runId).toBe('test-run-003');
    expect(run!.status).toBe('waiting');
    expect(run!.waitingKind).toBe('breakpoint');
    expect(run!.breakpointQuestion).toBe('Do you approve deploying version 2.0 to production?');
    expect(run!.breakpointEffectId).toBe('effect-bp-001');
  });

  it('returns null for nonexistent directory', () => {
    const run = parseRunDir('/nonexistent/path');
    expect(run).toBeNull();
  });

  it('returns null for directory without run.json', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parser-test-'));
    try {
      const run = parseRunDir(tmpDir);
      expect(run).toBeNull();
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('sets isStale=false for recent completed runs', () => {
    const run = parseRunDir(COMPLETED_FIXTURE);
    // Completed runs are never stale (only pending/waiting can be stale)
    expect(run!.isStale).toBe(false);
  });

  it('includes events in the run object', () => {
    const run = parseRunDir(COMPLETED_FIXTURE);
    expect(run!.events).toHaveLength(4);
    expect(run!.events[0].type).toBe('RUN_CREATED');
    expect(run!.events[3].type).toBe('RUN_COMPLETED');
  });

  it('enriches task title from task.json', () => {
    const run = parseRunDir(COMPLETED_FIXTURE);
    expect(run!.tasks[0].title).toBe('Run node task');
  });
});

// ---------------------------------------------------------------------------
// getTaskDetail
// ---------------------------------------------------------------------------
describe('getTaskDetail', () => {
  it('returns full task detail for existing task', () => {
    const detail = getTaskDetail(COMPLETED_FIXTURE, 'effect-001');
    expect(detail).not.toBeNull();
    expect(detail!.effectId).toBe('effect-001');
    expect(detail!.kind).toBe('node');
    expect(detail!.title).toBe('Run node task');
    expect(detail!.label).toBe('test-label');
    expect(detail!.taskId).toBe('my-task');
  });

  it('reads result.json and sets status to resolved', () => {
    const detail = getTaskDetail(COMPLETED_FIXTURE, 'effect-001');
    expect(detail!.status).toBe('resolved');
    expect(detail!.result).toEqual({ output: 'Task completed successfully', resolvedAt: '2026-03-10T08:00:05.000Z' });
    expect(detail!.resolvedAt).toBe('2026-03-10T08:00:05.000Z');
    expect(detail!.error).toBeUndefined();
  });

  it('reads input from task.json', () => {
    const detail = getTaskDetail(COMPLETED_FIXTURE, 'effect-001');
    expect(detail!.input).toEqual({ command: 'echo hello' });
  });

  it('includes full taskDef', () => {
    const detail = getTaskDetail(COMPLETED_FIXTURE, 'effect-001');
    expect(detail!.taskDef).toBeDefined();
    expect(detail!.taskDef!['taskId']).toBe('my-task');
  });

  it('returns error status for failed task', () => {
    const detail = getTaskDetail(FAILED_FIXTURE, 'effect-fail-001');
    expect(detail!.status).toBe('error');
    expect(detail!.error).toBe('Task execution failed: timeout exceeded');
  });

  it('reads breakpoint task with question', () => {
    const detail = getTaskDetail(WAITING_FIXTURE, 'effect-bp-001');
    expect(detail!.kind).toBe('breakpoint');
    expect(detail!.breakpointQuestion).toBe('Do you approve deploying version 2.0 to production?');
  });

  it('returns null for nonexistent effectId', () => {
    const detail = getTaskDetail(COMPLETED_FIXTURE, 'nonexistent-effect');
    expect(detail).toBeNull();
  });

  it('returns null for nonexistent runDir', () => {
    const detail = getTaskDetail('/nonexistent/path', 'effect-001');
    expect(detail).toBeNull();
  });

  it('reads stdout.txt if present', () => {
    // Create a temp run dir with stdout.txt
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parser-test-'));
    const taskDir = path.join(tmpDir, 'tasks', 'eff-stdout');
    fs.mkdirSync(taskDir, { recursive: true });
    fs.writeFileSync(path.join(taskDir, 'task.json'), JSON.stringify({ kind: 'node', title: 'test' }));
    fs.writeFileSync(path.join(taskDir, 'stdout.txt'), 'hello stdout');
    fs.writeFileSync(path.join(taskDir, 'stderr.txt'), 'hello stderr');
    try {
      const detail = getTaskDetail(tmpDir, 'eff-stdout');
      expect(detail!.stdout).toBe('hello stdout');
      expect(detail!.stderr).toBe('hello stderr');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
