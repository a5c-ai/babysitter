import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parseJournalDir, parseRunDir, getTaskDetail } from '../../lib/parser';
import { RunCache } from '../../lib/run-cache';

describe('large-data edge cases', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'large-data-test-'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ---------------------------------------------------------------------------
  // Large journal with many events
  // ---------------------------------------------------------------------------
  describe('large journal with many events', () => {
    it('handles journal with 100+ events efficiently', () => {
      const journalDir = path.join(tmpDir, 'journal');
      fs.mkdirSync(journalDir, { recursive: true });

      // Generate 150 journal events
      for (let i = 1; i <= 150; i++) {
        const seq = String(i).padStart(6, '0');
        const ulid = `ULID${String(i).padStart(20, '0')}`;
        const eventType = i % 3 === 0 ? 'EFFECT_RESOLVED' : i % 3 === 1 ? 'EFFECT_REQUESTED' : 'RUN_CREATED';

        const event = {
          type: eventType,
          recordedAt: new Date(2026, 0, 1, 0, 0, i).toISOString(),
          data: {
            effectId: `eff-${i}`,
            kind: 'node',
            title: `Task ${i}`,
          },
          checksum: `checksum-${i}`,
        };

        fs.writeFileSync(path.join(journalDir, `${seq}.${ulid}.json`), JSON.stringify(event));
      }

      const events = parseJournalDir(journalDir);

      expect(events).toHaveLength(150);
      expect(events[0].seq).toBe(1);
      expect(events[149].seq).toBe(150);
      // Verify ordering is preserved
      for (let i = 1; i < events.length; i++) {
        expect(events[i].seq).toBeGreaterThan(events[i - 1].seq);
      }
    }, 10000); // 10s timeout

    it('handles journal with large individual event payloads', () => {
      const journalDir = path.join(tmpDir, 'journal-large-payload');
      fs.mkdirSync(journalDir, { recursive: true });

      // Create event with 1MB payload
      const largePayload = 'x'.repeat(1000000);
      const event = {
        type: 'EFFECT_REQUESTED',
        recordedAt: '2026-01-01T00:00:00Z',
        data: {
          effectId: 'eff-001',
          kind: 'node',
          title: 'Large task',
          largeField: largePayload,
        },
      };

      fs.writeFileSync(path.join(journalDir, '000001.ULID001.json'), JSON.stringify(event));

      const events = parseJournalDir(journalDir);

      expect(events).toHaveLength(1);
      expect(events[0].payload.largeField).toBe(largePayload);
    }, 10000);
  });

  // ---------------------------------------------------------------------------
  // Run with many tasks
  // ---------------------------------------------------------------------------
  describe('run with many tasks', () => {
    it('parses run with 50+ tasks efficiently', () => {
      const runDir = path.join(tmpDir, 'run-many-tasks');
      const journalDir = path.join(runDir, 'journal');
      const tasksDir = path.join(runDir, 'tasks');

      fs.mkdirSync(journalDir, { recursive: true });
      fs.mkdirSync(tasksDir, { recursive: true });

      // Create run.json
      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId: 'run-001', processId: 'proc-001', createdAt: '2026-01-01T00:00:00Z' }),
      );

      // Create 60 tasks
      let seq = 1;
      for (let i = 1; i <= 60; i++) {
        const effectId = `eff-${String(i).padStart(3, '0')}`;

        // EFFECT_REQUESTED event
        const requestedEvent = {
          type: 'EFFECT_REQUESTED',
          recordedAt: new Date(2026, 0, 1, 0, 0, seq).toISOString(),
          data: {
            effectId,
            kind: 'node',
            title: `Task ${i}`,
            taskId: `task-${i}`,
          },
        };
        fs.writeFileSync(
          path.join(journalDir, `${String(seq).padStart(6, '0')}.ULID${String(seq).padStart(20, '0')}.json`),
          JSON.stringify(requestedEvent),
        );
        seq++;

        // EFFECT_RESOLVED event (for half of them)
        if (i % 2 === 0) {
          const resolvedEvent = {
            type: 'EFFECT_RESOLVED',
            recordedAt: new Date(2026, 0, 1, 0, 0, seq).toISOString(),
            data: {
              effectId,
              output: `Result ${i}`,
            },
          };
          fs.writeFileSync(
            path.join(journalDir, `${String(seq).padStart(6, '0')}.ULID${String(seq).padStart(20, '0')}.json`),
            JSON.stringify(resolvedEvent),
          );
          seq++;
        }

        // Create task directory with task.json
        const taskDir = path.join(tasksDir, effectId);
        fs.mkdirSync(taskDir, { recursive: true });
        fs.writeFileSync(
          path.join(taskDir, 'task.json'),
          JSON.stringify({
            kind: 'node',
            title: `Task ${i}`,
            taskId: `task-${i}`,
            input: { data: `input-${i}` },
          }),
        );

        // Add result.json for resolved tasks
        if (i % 2 === 0) {
          fs.writeFileSync(
            path.join(taskDir, 'result.json'),
            JSON.stringify({
              output: `Result ${i}`,
              resolvedAt: new Date(2026, 0, 1, 0, 0, i + 30).toISOString(),
            }),
          );
        }
      }

      const run = parseRunDir(runDir);

      expect(run).not.toBeNull();
      expect(run!.tasks).toHaveLength(60);
      expect(run!.totalTasks).toBe(60);
      expect(run!.completedTasks).toBe(30); // Half are resolved
      expect(run!.events.length).toBeGreaterThan(60);
    }, 15000); // 15s timeout
  });

  // ---------------------------------------------------------------------------
  // RunCache with many runs
  // ---------------------------------------------------------------------------
  describe('RunCache with many runs', () => {
    it('handles 50+ runs efficiently', () => {
      const workspaceRoot = path.join(tmpDir, 'workspace-many-runs');
      const runsDir = path.join(workspaceRoot, '.a5c', 'runs');
      fs.mkdirSync(runsDir, { recursive: true });

      // Create 75 runs
      for (let i = 1; i <= 75; i++) {
        const runId = `run-${String(i).padStart(3, '0')}`;
        const runDir = path.join(runsDir, runId);
        const journalDir = path.join(runDir, 'journal');

        fs.mkdirSync(journalDir, { recursive: true });

        // Create run.json
        fs.writeFileSync(
          path.join(runDir, 'run.json'),
          JSON.stringify({
            runId,
            processId: `proc-${i}`,
            createdAt: new Date(2026, 0, i).toISOString(),
          }),
        );

        // Add a couple of journal events
        fs.writeFileSync(
          path.join(journalDir, '000001.ULIDA.json'),
          JSON.stringify({
            type: 'RUN_CREATED',
            recordedAt: new Date(2026, 0, i).toISOString(),
            data: { runId, processId: `proc-${i}` },
          }),
        );

        // Mark some as completed
        if (i % 3 === 0) {
          fs.writeFileSync(
            path.join(journalDir, '000002.ULIDB.json'),
            JSON.stringify({
              type: 'RUN_COMPLETED',
              recordedAt: new Date(2026, 0, i, 1).toISOString(),
              data: {},
            }),
          );
        }
      }

      const cache = new RunCache(workspaceRoot);
      cache.refreshAll();

      const allRuns = cache.getAll();
      expect(allRuns).toHaveLength(75);

      // Verify sorting by updatedAt (most recent first)
      for (let i = 1; i < allRuns.length; i++) {
        const prevTime = new Date(allRuns[i - 1].updatedAt).getTime();
        const currTime = new Date(allRuns[i].updatedAt).getTime();
        expect(prevTime).toBeGreaterThanOrEqual(currTime);
      }

      const summary = cache.getSummary();
      expect(summary.total).toBe(75);
      expect(summary.completed).toBe(25); // Every 3rd run
    }, 15000); // 15s timeout

    it('refreshes individual run efficiently', () => {
      const workspaceRoot = path.join(tmpDir, 'workspace-refresh');
      const runsDir = path.join(workspaceRoot, '.a5c', 'runs');
      const runDir = path.join(runsDir, 'run-001');
      const journalDir = path.join(runDir, 'journal');

      fs.mkdirSync(journalDir, { recursive: true });

      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId: 'run-001', processId: 'proc-001', createdAt: '2026-01-01T00:00:00Z' }),
      );

      fs.writeFileSync(
        path.join(journalDir, '000001.ULIDA.json'),
        JSON.stringify({
          type: 'RUN_CREATED',
          recordedAt: '2026-01-01T00:00:00Z',
          data: {},
        }),
      );

      const cache = new RunCache(workspaceRoot);
      cache.refreshAll();

      expect(cache.getAll()).toHaveLength(1);

      // Add more journal events
      for (let i = 2; i <= 100; i++) {
        fs.writeFileSync(
          path.join(journalDir, `${String(i).padStart(6, '0')}.ULID${String(i).padStart(20, '0')}.json`),
          JSON.stringify({
            type: 'EFFECT_REQUESTED',
            recordedAt: new Date(2026, 0, 1, 0, 0, i).toISOString(),
            data: { effectId: `eff-${i}`, kind: 'node', title: `Task ${i}` },
          }),
        );
      }

      // Refresh single run
      const refreshed = cache.refresh('run-001');

      expect(refreshed).not.toBeNull();
      expect(refreshed!.events).toHaveLength(100);
    }, 10000);
  });

  // ---------------------------------------------------------------------------
  // Large stdout/stderr files
  // ---------------------------------------------------------------------------
  describe('large stdout/stderr files', () => {
    it('handles large stdout.txt', () => {
      const runDir = path.join(tmpDir, 'run-large-stdout');
      const taskDir = path.join(runDir, 'tasks', 'eff-001');
      fs.mkdirSync(taskDir, { recursive: true });

      fs.writeFileSync(
        path.join(taskDir, 'task.json'),
        JSON.stringify({ kind: 'node', title: 'Test' }),
      );

      // Create 500KB stdout
      const largeStdout = 'Line of output\n'.repeat(35000);
      fs.writeFileSync(path.join(taskDir, 'stdout.txt'), largeStdout);

      const detail = getTaskDetail(runDir, 'eff-001');

      expect(detail).not.toBeNull();
      expect(detail!.stdout).toBeDefined();
      expect(detail!.stdout!.length).toBeGreaterThan(400000);
    }, 10000);

    it('handles large stderr.txt', () => {
      const runDir = path.join(tmpDir, 'run-large-stderr');
      const taskDir = path.join(runDir, 'tasks', 'eff-002');
      fs.mkdirSync(taskDir, { recursive: true });

      fs.writeFileSync(
        path.join(taskDir, 'task.json'),
        JSON.stringify({ kind: 'node', title: 'Test' }),
      );

      // Create 500KB stderr
      const largeStderr = 'Error message\n'.repeat(40000);
      fs.writeFileSync(path.join(taskDir, 'stderr.txt'), largeStderr);

      const detail = getTaskDetail(runDir, 'eff-002');

      expect(detail).not.toBeNull();
      expect(detail!.stderr).toBeDefined();
      expect(detail!.stderr!.length).toBeGreaterThan(400000);
    }, 10000);
  });

  // ---------------------------------------------------------------------------
  // Deeply nested data structures
  // ---------------------------------------------------------------------------
  describe('deeply nested data structures', () => {
    it('handles deeply nested JSON in task.json', () => {
      const runDir = path.join(tmpDir, 'run-deep-nested');
      const taskDir = path.join(runDir, 'tasks', 'eff-001');
      fs.mkdirSync(taskDir, { recursive: true });

      // Create deeply nested object
      let nested: Record<string, unknown> = { value: 'leaf' };
      for (let i = 0; i < 50; i++) {
        nested = { level: i, child: nested };
      }

      fs.writeFileSync(
        path.join(taskDir, 'task.json'),
        JSON.stringify({
          kind: 'node',
          title: 'Deeply nested task',
          input: nested,
        }),
      );

      const detail = getTaskDetail(runDir, 'eff-001');

      expect(detail).not.toBeNull();
      expect(detail!.input).toBeDefined();
    });

    it('handles large arrays in result.json', () => {
      const runDir = path.join(tmpDir, 'run-large-array');
      const taskDir = path.join(runDir, 'tasks', 'eff-002');
      fs.mkdirSync(taskDir, { recursive: true });

      fs.writeFileSync(
        path.join(taskDir, 'task.json'),
        JSON.stringify({ kind: 'node', title: 'Test' }),
      );

      // Create result with large array (10k items)
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({ id: i, value: `item-${i}` }));
      fs.writeFileSync(
        path.join(taskDir, 'result.json'),
        JSON.stringify({
          items: largeArray,
          resolvedAt: '2026-01-01T00:00:01Z',
        }),
      );

      const detail = getTaskDetail(runDir, 'eff-002');

      expect(detail).not.toBeNull();
      expect(detail!.result).toBeDefined();
      expect((detail!.result as { items: unknown[] }).items).toHaveLength(10000);
    }, 10000);
  });
});
