import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parseJournalDir, parseRunDir, getTaskDetail } from '../../lib/parser';

describe('corrupt-data edge cases', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'corrupt-data-test-'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ---------------------------------------------------------------------------
  // Malformed JSON in journal
  // ---------------------------------------------------------------------------
  describe('malformed JSON in journal', () => {
    it('gracefully handles invalid JSON syntax', () => {
      const journalDir = path.join(tmpDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });

      // Invalid JSON
      fs.writeFileSync(path.join(journalDir, '000001.AAAA.json'), '{invalid json}}');
      fs.writeFileSync(path.join(journalDir, '000002.BBBB.json'), 'not json at all');
      fs.writeFileSync(path.join(journalDir, '000003.CCCC.json'), '');

      const events = parseJournalDir(journalDir);
      expect(events).toEqual([]);
    });

    it('handles truncated JSON', () => {
      const journalDir = path.join(tmpDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });

      // Truncated JSON
      fs.writeFileSync(path.join(journalDir, '000001.AAAA.json'), '{"type": "RUN_CREATED", "recordedAt":');

      const events = parseJournalDir(journalDir);
      expect(events).toEqual([]);
    });

    it('handles JSON with missing required fields', () => {
      const journalDir = path.join(tmpDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });

      // Missing type field
      fs.writeFileSync(path.join(journalDir, '000001.AAAA.json'), '{"recordedAt": "2026-01-01T00:00:00Z"}');

      const events = parseJournalDir(journalDir);
      // Should parse but type will default to UNKNOWN
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('UNKNOWN');
    });

    it('handles JSON with null values', () => {
      const journalDir = path.join(tmpDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });

      fs.writeFileSync(
        path.join(journalDir, '000001.AAAA.json'),
        JSON.stringify({ type: null, recordedAt: null, data: null }),
      );

      const events = parseJournalDir(journalDir);
      expect(events).toHaveLength(1);
      // Type is converted to string, null becomes "null" then falls back to UNKNOWN
      expect(events[0].type).toBe('UNKNOWN');
      expect(events[0].ts).toBeDefined();
    });

    it('handles deeply nested corrupt JSON', () => {
      const journalDir = path.join(tmpDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });

      // Valid JSON but with corrupt nested structure
      fs.writeFileSync(
        path.join(journalDir, '000001.AAAA.json'),
        '{"type":"RUN_CREATED","recordedAt":"2026-01-01T00:00:00Z","data":{"nested":{{{}}}}',
      );

      const events = parseJournalDir(journalDir);
      expect(events).toEqual([]);
    });

    it('handles binary data in JSON file', () => {
      const journalDir = path.join(tmpDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });

      // Write binary data
      fs.writeFileSync(path.join(journalDir, '000001.AAAA.json'), Buffer.from([0x00, 0x01, 0x02, 0xff]));

      const events = parseJournalDir(journalDir);
      expect(events).toEqual([]);
    });

    it('handles extremely large JSON payload', () => {
      const journalDir = path.join(tmpDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });

      // Create a large but valid JSON payload (1MB of data)
      const largeData = { type: 'RUN_CREATED', recordedAt: '2026-01-01T00:00:00Z', data: { payload: 'x'.repeat(1000000) } };
      fs.writeFileSync(path.join(journalDir, '000001.AAAA.json'), JSON.stringify(largeData));

      const events = parseJournalDir(journalDir);
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('RUN_CREATED');
    });
  });

  // ---------------------------------------------------------------------------
  // Missing run.json
  // ---------------------------------------------------------------------------
  describe('missing run.json', () => {
    it('returns null when run.json does not exist', () => {
      const runDir = path.join(tmpDir, 'run-no-metadata');
      fs.mkdirSync(runDir, { recursive: true });

      const run = parseRunDir(runDir);
      expect(run).toBeNull();
    });

    it('returns null when run.json is unreadable', () => {
      const runDir = path.join(tmpDir, 'run-bad-metadata');
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'run.json'), '{invalid}');

      const run = parseRunDir(runDir);
      expect(run).toBeNull();
    });

    it('returns null when run.json is empty', () => {
      const runDir = path.join(tmpDir, 'run-empty-metadata');
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'run.json'), '');

      const run = parseRunDir(runDir);
      expect(run).toBeNull();
    });

    it('handles run.json with only partial metadata', () => {
      const runDir = path.join(tmpDir, 'run-partial');
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId: 'test-001' }));

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.runId).toBe('test-001');
      expect(run!.processId).toBe('unknown');
    });
  });

  // ---------------------------------------------------------------------------
  // Missing journal directory
  // ---------------------------------------------------------------------------
  describe('missing journal directory', () => {
    it('handles runs with no journal directory', () => {
      const runDir = path.join(tmpDir, 'run-no-journal');
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId: 'test-001', processId: 'proc-001', createdAt: '2026-01-01T00:00:00Z' }),
      );

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.events).toEqual([]);
      expect(run!.tasks).toEqual([]);
      expect(run!.status).toBe('pending');
    });

    it('handles empty journal directory', () => {
      const runDir = path.join(tmpDir, 'run-empty-journal');
      fs.mkdirSync(path.join(runDir, 'journal'), { recursive: true });
      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId: 'test-001', processId: 'proc-001', createdAt: '2026-01-01T00:00:00Z' }),
      );

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.events).toEqual([]);
    });

    it('handles journal directory with only non-JSON files', () => {
      const runDir = path.join(tmpDir, 'run-non-json-journal');
      const journalDir = path.join(runDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId: 'test-001', processId: 'proc-001' }));
      fs.writeFileSync(path.join(journalDir, 'readme.txt'), 'not a journal file');
      fs.writeFileSync(path.join(journalDir, 'data.xml'), '<data/>');

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.events).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Missing tasks directory
  // ---------------------------------------------------------------------------
  describe('missing tasks directory', () => {
    it('handles runs with no tasks directory', () => {
      const runDir = path.join(tmpDir, 'run-no-tasks');
      const journalDir = path.join(runDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });
      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId: 'test-001', processId: 'proc-001', createdAt: '2026-01-01T00:00:00Z' }),
      );

      // Add journal event for a task
      fs.writeFileSync(
        path.join(journalDir, '000001.AAAA.json'),
        JSON.stringify({
          type: 'EFFECT_REQUESTED',
          recordedAt: '2026-01-01T00:00:01Z',
          data: { effectId: 'eff-001', kind: 'node', title: 'Test task' },
        }),
      );

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      expect(run!.tasks).toHaveLength(1);
      expect(run!.tasks[0].title).toBe('Test task');
    });

    it('handles task.json with corrupt data', () => {
      const runDir = path.join(tmpDir, 'run-corrupt-task');
      const taskDir = path.join(runDir, 'tasks', 'eff-001');
      fs.mkdirSync(taskDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId: 'test-001', processId: 'proc-001' }));
      fs.writeFileSync(path.join(taskDir, 'task.json'), '{corrupt json');

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      // Corrupt task.json should be skipped
      expect(run!.tasks).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getTaskDetail with missing files
  // ---------------------------------------------------------------------------
  describe('getTaskDetail with missing files', () => {
    it('returns null when task directory does not exist', () => {
      const runDir = path.join(tmpDir, 'run-001');
      fs.mkdirSync(runDir, { recursive: true });

      const detail = getTaskDetail(runDir, 'nonexistent-effect');
      expect(detail).toBeNull();
    });

    it('handles missing task.json', () => {
      const runDir = path.join(tmpDir, 'run-002');
      const taskDir = path.join(runDir, 'tasks', 'eff-001');
      fs.mkdirSync(taskDir, { recursive: true });

      const detail = getTaskDetail(runDir, 'eff-001');
      expect(detail).not.toBeNull();
      expect(detail!.kind).toBe('node');
      expect(detail!.title).toBe('eff-001'); // Falls back to effectId
    });

    it('handles missing result.json', () => {
      const runDir = path.join(tmpDir, 'run-003');
      const taskDir = path.join(runDir, 'tasks', 'eff-001');
      fs.mkdirSync(taskDir, { recursive: true });
      fs.writeFileSync(path.join(taskDir, 'task.json'), JSON.stringify({ kind: 'node', title: 'Test' }));

      const detail = getTaskDetail(runDir, 'eff-001');
      expect(detail).not.toBeNull();
      expect(detail!.status).toBe('requested');
      expect(detail!.result).toBeUndefined();
    });

    it('handles missing stdout and stderr', () => {
      const runDir = path.join(tmpDir, 'run-004');
      const taskDir = path.join(runDir, 'tasks', 'eff-001');
      fs.mkdirSync(taskDir, { recursive: true });
      fs.writeFileSync(path.join(taskDir, 'task.json'), JSON.stringify({ kind: 'node', title: 'Test' }));

      const detail = getTaskDetail(runDir, 'eff-001');
      expect(detail).not.toBeNull();
      expect(detail!.stdout).toBeUndefined();
      expect(detail!.stderr).toBeUndefined();
    });

    it('handles corrupt result.json', () => {
      const runDir = path.join(tmpDir, 'run-005');
      const taskDir = path.join(runDir, 'tasks', 'eff-001');
      fs.mkdirSync(taskDir, { recursive: true });
      fs.writeFileSync(path.join(taskDir, 'task.json'), JSON.stringify({ kind: 'node', title: 'Test' }));
      fs.writeFileSync(path.join(taskDir, 'result.json'), '{invalid}');

      const detail = getTaskDetail(runDir, 'eff-001');
      expect(detail).not.toBeNull();
      expect(detail!.status).toBe('requested'); // Falls back to requested
    });

    it('handles unreadable stdout/stderr files', () => {
      const runDir = path.join(tmpDir, 'run-006');
      const taskDir = path.join(runDir, 'tasks', 'eff-001');
      fs.mkdirSync(taskDir, { recursive: true });
      fs.writeFileSync(path.join(taskDir, 'task.json'), JSON.stringify({ kind: 'node', title: 'Test' }));
      // Create a directory instead of a file (will cause read error)
      fs.mkdirSync(path.join(taskDir, 'stdout.txt'));

      const detail = getTaskDetail(runDir, 'eff-001');
      expect(detail).not.toBeNull();
      expect(detail!.stdout).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Empty files
  // ---------------------------------------------------------------------------
  describe('empty files', () => {
    it('handles empty journal event files', () => {
      const journalDir = path.join(tmpDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });
      fs.writeFileSync(path.join(journalDir, '000001.AAAA.json'), '');

      const events = parseJournalDir(journalDir);
      expect(events).toEqual([]);
    });

    it('handles empty task.json', () => {
      const runDir = path.join(tmpDir, 'run-empty-task');
      const taskDir = path.join(runDir, 'tasks', 'eff-001');
      fs.mkdirSync(taskDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId: 'test-001', processId: 'proc-001' }));
      fs.writeFileSync(path.join(taskDir, 'task.json'), '');

      const run = parseRunDir(runDir);
      expect(run).not.toBeNull();
      // Empty task.json should be skipped
      expect(run!.tasks).toEqual([]);
    });

    it('handles empty result.json', () => {
      const runDir = path.join(tmpDir, 'run-empty-result');
      const taskDir = path.join(runDir, 'tasks', 'eff-001');
      fs.mkdirSync(taskDir, { recursive: true });
      fs.writeFileSync(path.join(taskDir, 'task.json'), JSON.stringify({ kind: 'node', title: 'Test' }));
      fs.writeFileSync(path.join(taskDir, 'result.json'), '');

      const detail = getTaskDetail(runDir, 'eff-001');
      expect(detail).not.toBeNull();
      expect(detail!.status).toBe('requested'); // Falls back
    });

    it('handles empty stdout.txt', () => {
      const runDir = path.join(tmpDir, 'run-empty-stdout');
      const taskDir = path.join(runDir, 'tasks', 'eff-001');
      fs.mkdirSync(taskDir, { recursive: true });
      fs.writeFileSync(path.join(taskDir, 'task.json'), JSON.stringify({ kind: 'node', title: 'Test' }));
      fs.writeFileSync(path.join(taskDir, 'stdout.txt'), '');

      const detail = getTaskDetail(runDir, 'eff-001');
      expect(detail).not.toBeNull();
      expect(detail!.stdout).toBe('');
    });
  });
});
