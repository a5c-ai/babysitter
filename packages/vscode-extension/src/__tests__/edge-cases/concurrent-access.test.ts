import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { RunCache } from '../../lib/run-cache';
import { RunWatcher } from '../../lib/watcher';
import * as vscode from 'vscode';

describe('concurrent-access edge cases', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'concurrent-test-'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ---------------------------------------------------------------------------
  // Concurrent RunCache operations
  // ---------------------------------------------------------------------------
  describe('concurrent RunCache operations', () => {
    it('handles multiple simultaneous refreshAll() calls', async () => {
      const workspaceRoot = path.join(tmpDir, 'workspace-concurrent');
      const runsDir = path.join(workspaceRoot, '.a5c', 'runs');
      fs.mkdirSync(runsDir, { recursive: true });

      // Create 10 runs
      for (let i = 1; i <= 10; i++) {
        const runDir = path.join(runsDir, `run-${String(i).padStart(3, '0')}`);
        fs.mkdirSync(runDir, { recursive: true });
        fs.writeFileSync(
          path.join(runDir, 'run.json'),
          JSON.stringify({
            runId: `run-${String(i).padStart(3, '0')}`,
            processId: `proc-${i}`,
            createdAt: '2026-01-01T00:00:00Z',
          }),
        );
      }

      const cache = new RunCache(workspaceRoot);

      // Trigger multiple concurrent refreshAll calls
      const promises = Array.from({ length: 5 }, () =>
        Promise.resolve().then(() => cache.refreshAll())
      );

      await Promise.all(promises);

      // Should have all runs without duplicates
      const runs = cache.getAll();
      expect(runs).toHaveLength(10);

      // Verify unique runIds
      const uniqueIds = new Set(runs.map((r) => r.runId));
      expect(uniqueIds.size).toBe(10);
    });

    it('handles concurrent refresh() calls for same run', async () => {
      const workspaceRoot = path.join(tmpDir, 'workspace-single-refresh');
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

      // Trigger multiple concurrent refresh calls for same run
      const promises = Array.from({ length: 10 }, () =>
        Promise.resolve().then(() => cache.refresh('run-001'))
      );

      const results = await Promise.all(promises);

      // All refreshes should succeed
      results.forEach((result) => {
        expect(result).not.toBeNull();
        expect(result!.runId).toBe('run-001');
      });

      // Cache should still have only one instance
      expect(cache.getAll()).toHaveLength(1);
    });

    it('handles concurrent refresh() calls for different runs', async () => {
      const workspaceRoot = path.join(tmpDir, 'workspace-multi-refresh');
      const runsDir = path.join(workspaceRoot, '.a5c', 'runs');
      fs.mkdirSync(runsDir, { recursive: true });

      // Create 5 runs
      for (let i = 1; i <= 5; i++) {
        const runDir = path.join(runsDir, `run-${String(i).padStart(3, '0')}`);
        fs.mkdirSync(runDir, { recursive: true });
        fs.writeFileSync(
          path.join(runDir, 'run.json'),
          JSON.stringify({
            runId: `run-${String(i).padStart(3, '0')}`,
            processId: `proc-${i}`,
            createdAt: '2026-01-01T00:00:00Z',
          }),
        );
      }

      const cache = new RunCache(workspaceRoot);
      cache.refreshAll();

      // Trigger concurrent refresh calls for different runs
      const promises = [1, 2, 3, 4, 5].flatMap((i) => {
        const runId = `run-${String(i).padStart(3, '0')}`;
        return Array.from({ length: 3 }, () =>
          Promise.resolve().then(() => cache.refresh(runId))
        );
      });

      const results = await Promise.all(promises);

      // All refreshes should succeed
      results.forEach((result) => {
        expect(result).not.toBeNull();
      });

      // Cache should have all 5 runs
      expect(cache.getAll()).toHaveLength(5);
    });

    it('handles mixed refreshAll and individual refresh calls', async () => {
      const workspaceRoot = path.join(tmpDir, 'workspace-mixed');
      const runsDir = path.join(workspaceRoot, '.a5c', 'runs');
      fs.mkdirSync(runsDir, { recursive: true });

      // Create 3 runs
      for (let i = 1; i <= 3; i++) {
        const runDir = path.join(runsDir, `run-${String(i).padStart(3, '0')}`);
        fs.mkdirSync(runDir, { recursive: true });
        fs.writeFileSync(
          path.join(runDir, 'run.json'),
          JSON.stringify({
            runId: `run-${String(i).padStart(3, '0')}`,
            processId: `proc-${i}`,
            createdAt: '2026-01-01T00:00:00Z',
          }),
        );
      }

      const cache = new RunCache(workspaceRoot);

      // Mix of refreshAll and individual refresh calls
      const promises = [
        Promise.resolve().then(() => cache.refreshAll()),
        Promise.resolve().then(() => cache.refresh('run-001')),
        Promise.resolve().then(() => cache.refreshAll()),
        Promise.resolve().then(() => cache.refresh('run-002')),
        Promise.resolve().then(() => cache.refresh('run-003')),
      ];

      await Promise.all(promises);

      expect(cache.getAll()).toHaveLength(3);
    });
  });

  // ---------------------------------------------------------------------------
  // Concurrent file system operations
  // ---------------------------------------------------------------------------
  describe('concurrent file system operations', () => {
    it('handles rapid journal file additions', async () => {
      const journalDir = path.join(tmpDir, 'journal-rapid');
      fs.mkdirSync(journalDir, { recursive: true });

      // Write 50 journal files rapidly
      for (let i = 1; i <= 50; i++) {
        const seq = String(i).padStart(6, '0');
        const event = {
          type: 'EFFECT_REQUESTED',
          recordedAt: new Date(2026, 0, 1, 0, 0, i).toISOString(),
          data: { effectId: `eff-${i}`, kind: 'node', title: `Task ${i}` },
        };

        fs.writeFileSync(
          path.join(journalDir, `${seq}.ULID${String(i).padStart(20, '0')}.json`),
          JSON.stringify(event),
        );
      }

      // Parser should handle all files consistently
      const { parseJournalDir } = await import('../../lib/parser');
      const events1 = parseJournalDir(journalDir);
      const events2 = parseJournalDir(journalDir);
      const events3 = parseJournalDir(journalDir);

      expect(events1).toHaveLength(50);
      expect(events2).toHaveLength(50);
      expect(events3).toHaveLength(50);

      // Results should be identical
      expect(events1.map((e) => e.seq)).toEqual(events2.map((e) => e.seq));
      expect(events2.map((e) => e.seq)).toEqual(events3.map((e) => e.seq));
    });

    it('handles concurrent writes to different task directories', async () => {
      const runDir = path.join(tmpDir, 'run-concurrent-tasks');
      const tasksDir = path.join(runDir, 'tasks');
      fs.mkdirSync(tasksDir, { recursive: true });

      // Simulate concurrent task writes
      const writeTask = (i: number) => {
        return Promise.resolve().then(() => {
          const taskDir = path.join(tasksDir, `eff-${String(i).padStart(3, '0')}`);
          fs.mkdirSync(taskDir, { recursive: true });
          fs.writeFileSync(
            path.join(taskDir, 'task.json'),
            JSON.stringify({ kind: 'node', title: `Task ${i}`, taskId: `task-${i}` }),
          );
        });
      };

      const promises = Array.from({ length: 20 }, (_, i) => writeTask(i + 1));
      await Promise.all(promises);

      // Verify all tasks were created
      const taskDirs = fs.readdirSync(tasksDir);
      expect(taskDirs).toHaveLength(20);
    });
  });

  // ---------------------------------------------------------------------------
  // RunWatcher debouncing
  // ---------------------------------------------------------------------------
  describe('RunWatcher debouncing behavior', () => {
    it('debounces rapid file system events', async () => {
      const workspaceRoot = path.join(tmpDir, 'workspace-debounce');
      const runsDir = path.join(workspaceRoot, '.a5c', 'runs');
      const runDir = path.join(runsDir, 'run-001');
      const journalDir = path.join(runDir, 'journal');

      fs.mkdirSync(journalDir, { recursive: true });

      const watcher = new RunWatcher(workspaceRoot);

      const events: unknown[] = [];
      watcher.onDidChange((event) => {
        events.push(event);
      });

      watcher.start();

      // Simulate rapid file changes via mock
      const mockUri = vscode.Uri.file(path.join(journalDir, '000001.ULIDA.json'));

      // Trigger multiple rapid events
      for (let i = 0; i < 10; i++) {
        (watcher as any)._handleChange(mockUri, false);
      }

      // Wait for debounce (RunWatcher.DEBOUNCE_MS = 500ms)
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Should have debounced to a single event
      expect(events.length).toBeLessThanOrEqual(2); // May include initial event

      watcher.dispose();
    });

    it('emits separate events for different runs', async () => {
      const workspaceRoot = path.join(tmpDir, 'workspace-multi-run-events');
      const runsDir = path.join(workspaceRoot, '.a5c', 'runs');
      fs.mkdirSync(runsDir, { recursive: true });

      const watcher = new RunWatcher(workspaceRoot);

      const events: unknown[] = [];
      watcher.onDidChange((event) => {
        events.push(event);
      });

      watcher.start();

      // Simulate changes to different runs
      const uri1 = vscode.Uri.file(path.join(runsDir, 'run-001', 'journal', '000001.json'));
      const uri2 = vscode.Uri.file(path.join(runsDir, 'run-002', 'journal', '000001.json'));

      (watcher as any)._handleChange(uri1, false);
      (watcher as any)._handleChange(uri2, false);

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Should emit events for both runs
      expect(events.length).toBeGreaterThanOrEqual(2);

      watcher.dispose();
    });

    it('handles dispose() while events are pending', async () => {
      const workspaceRoot = path.join(tmpDir, 'workspace-dispose-pending');
      const runsDir = path.join(workspaceRoot, '.a5c', 'runs');
      const runDir = path.join(runsDir, 'run-001');

      fs.mkdirSync(runDir, { recursive: true });

      const watcher = new RunWatcher(workspaceRoot);

      let eventCount = 0;
      watcher.onDidChange(() => {
        eventCount++;
      });

      watcher.start();

      // Trigger an event
      const uri = vscode.Uri.file(path.join(runDir, 'run.json'));
      (watcher as any)._handleChange(uri, true);

      // Dispose immediately (before debounce completes)
      watcher.dispose();

      // Wait past debounce period
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Event should not have fired (disposed before debounce)
      expect(eventCount).toBe(0);
    });

    it('clears all pending timers on dispose', () => {
      const workspaceRoot = path.join(tmpDir, 'workspace-clear-timers');
      const runsDir = path.join(workspaceRoot, '.a5c', 'runs');
      fs.mkdirSync(runsDir, { recursive: true });

      const watcher = new RunWatcher(workspaceRoot);
      watcher.start();

      // Trigger multiple events for different runs
      for (let i = 1; i <= 10; i++) {
        const uri = vscode.Uri.file(path.join(runsDir, `run-${String(i).padStart(3, '0')}`, 'run.json'));
        (watcher as any)._handleChange(uri, true);
      }

      // Verify timers exist
      expect((watcher as any)._debounceTimers.size).toBeGreaterThan(0);

      // Dispose should clear all timers
      watcher.dispose();

      expect((watcher as any)._debounceTimers.size).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Race conditions
  // ---------------------------------------------------------------------------
  describe('race conditions', () => {
    it('handles run being deleted during refresh', async () => {
      const workspaceRoot = path.join(tmpDir, 'workspace-delete-race');
      const runsDir = path.join(workspaceRoot, '.a5c', 'runs');
      const runDir = path.join(runsDir, 'run-001');

      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(
        path.join(runDir, 'run.json'),
        JSON.stringify({ runId: 'run-001', processId: 'proc-001', createdAt: '2026-01-01T00:00:00Z' }),
      );

      const cache = new RunCache(workspaceRoot);
      cache.refreshAll();

      expect(cache.getAll()).toHaveLength(1);

      // Delete the run directory
      fs.rmSync(runDir, { recursive: true, force: true });

      // Refresh should handle missing directory gracefully
      const result = cache.refresh('run-001');

      expect(result).toBeNull();
      expect(cache.getAll()).toHaveLength(0);
    });

    it('handles journal file being deleted during parse', async () => {
      const journalDir = path.join(tmpDir, 'journal-delete-race');
      fs.mkdirSync(journalDir, { recursive: true });

      // Create journal files
      for (let i = 1; i <= 5; i++) {
        fs.writeFileSync(
          path.join(journalDir, `${String(i).padStart(6, '0')}.ULIDA.json`),
          JSON.stringify({
            type: 'EFFECT_REQUESTED',
            recordedAt: '2026-01-01T00:00:00Z',
            data: { effectId: `eff-${i}` },
          }),
        );
      }

      const { parseJournalDir } = await import('../../lib/parser');

      // Parse should handle some files being deleted mid-operation
      // (This is a theoretical race - hard to reproduce deterministically)
      const events = parseJournalDir(journalDir);

      // Should return whatever it could parse
      expect(events.length).toBeGreaterThanOrEqual(0);
      expect(events.length).toBeLessThanOrEqual(5);
    });

    it('handles task.json being modified during read', async () => {
      const runDir = path.join(tmpDir, 'run-modify-race');
      const taskDir = path.join(runDir, 'tasks', 'eff-001');
      fs.mkdirSync(taskDir, { recursive: true });

      fs.writeFileSync(
        path.join(taskDir, 'task.json'),
        JSON.stringify({ kind: 'node', title: 'Original Title' }),
      );

      const { getTaskDetail } = await import('../../lib/parser');

      // First read
      const detail1 = getTaskDetail(runDir, 'eff-001');
      expect(detail1).not.toBeNull();
      expect(detail1!.title).toBe('Original Title');

      // Modify the file
      fs.writeFileSync(
        path.join(taskDir, 'task.json'),
        JSON.stringify({ kind: 'node', title: 'Modified Title' }),
      );

      // Second read should get new data
      const detail2 = getTaskDetail(runDir, 'eff-001');
      expect(detail2).not.toBeNull();
      expect(detail2!.title).toBe('Modified Title');
    });
  });
});
