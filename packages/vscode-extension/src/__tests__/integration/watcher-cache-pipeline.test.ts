import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import { RunWatcher } from '../../lib/watcher';
import { RunCache } from '../../lib/run-cache';
import type { WatcherEvent } from '../../lib/watcher';

/**
 * Integration test: RunWatcher -> RunCache pipeline
 *
 * Tests that file system changes detected by RunWatcher
 * correctly trigger cache updates in RunCache.
 *
 * Note: These tests manually invoke watcher handlers rather than relying on
 * actual file system events, since the VSCode mock doesn't fire real FS events.
 */

describe('Integration: RunWatcher -> RunCache', () => {
  let tmpDir: string;
  let runsDir: string;
  let watcher: RunWatcher;
  let cache: RunCache;
  let mockWatcher: {
    onDidCreate: (listener: (uri: vscode.Uri) => void) => vscode.Disposable;
    onDidChange: (listener: (uri: vscode.Uri) => void) => vscode.Disposable;
    onDidDelete: (listener: (uri: vscode.Uri) => void) => vscode.Disposable;
    dispose: () => void;
    _createListener?: (uri: vscode.Uri) => void;
    _changeListener?: (uri: vscode.Uri) => void;
    _deleteListener?: (uri: vscode.Uri) => void;
  };

  beforeEach(() => {
    // Create temporary workspace with .a5c/runs structure
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'watcher-cache-test-'));
    runsDir = path.join(tmpDir, '.a5c', 'runs');
    fs.mkdirSync(runsDir, { recursive: true });

    cache = new RunCache(tmpDir);

    // Create a mock watcher that we can control
    mockWatcher = {
      onDidCreate: (listener) => {
        mockWatcher._createListener = listener;
        return new vscode.Disposable(() => {});
      },
      onDidChange: (listener) => {
        mockWatcher._changeListener = listener;
        return new vscode.Disposable(() => {});
      },
      onDidDelete: (listener) => {
        mockWatcher._deleteListener = listener;
        return new vscode.Disposable(() => {});
      },
      dispose: () => {},
    };

    // Mock the createFileSystemWatcher to return our controlled watcher
    (vscode.workspace.createFileSystemWatcher as any).mockReturnValue(mockWatcher);

    watcher = new RunWatcher(tmpDir);
  });

  afterEach(() => {
    watcher.dispose();
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('watcher event triggers cache update for new run', async () => {
    const events: WatcherEvent[] = [];
    watcher.onDidChange((event) => {
      events.push(event);
      if (event.type === 'new-run') {
        cache.refresh(event.runId);
      }
    });

    watcher.start();

    // Create a new run
    const runId = 'run-new-001';
    const runDir = path.join(runsDir, runId);
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(
      path.join(runDir, 'run.json'),
      JSON.stringify({
        runId,
        processId: 'test-process',
        createdAt: new Date().toISOString(),
      }),
    );

    // Manually trigger the create event
    const uri = vscode.Uri.file(path.join(runDir, 'run.json'));
    mockWatcher._createListener!(uri);

    // Wait for debounced event (500ms + buffer)
    await new Promise((resolve) => setTimeout(resolve, 700));

    // Verify watcher detected the new run
    expect(events.some((e) => e.type === 'new-run' && e.runId === runId)).toBe(true);

    // Verify cache was updated
    const run = cache.getById(runId);
    expect(run).toBeDefined();
    expect(run!.runId).toBe(runId);
    expect(run!.processId).toBe('test-process');
  });

  it('watcher detects journal changes and cache reflects updates', async () => {
    // Set up initial run
    const runId = 'run-journal-001';
    const runDir = path.join(runsDir, runId);
    const journalDir = path.join(runDir, 'journal');
    fs.mkdirSync(journalDir, { recursive: true });

    fs.writeFileSync(
      path.join(runDir, 'run.json'),
      JSON.stringify({
        runId,
        processId: 'test-process',
        createdAt: '2026-03-10T10:00:00Z',
      }),
    );

    // Write initial journal event
    fs.writeFileSync(
      path.join(journalDir, '000001.01TEST001.json'),
      JSON.stringify({
        type: 'RUN_CREATED',
        recordedAt: '2026-03-10T10:00:00Z',
        data: { runId, processId: 'test-process' },
        checksum: 'abc',
      }),
    );

    cache.refresh(runId);
    let run = cache.getById(runId);
    expect(run!.events).toHaveLength(1);
    expect(run!.status).toBe('pending');

    // Wire watcher to cache
    const events: WatcherEvent[] = [];
    watcher.onDidChange((event) => {
      events.push(event);
      if (event.type === 'run-changed') {
        cache.refresh(event.runId);
      }
    });

    watcher.start();

    // Add a new journal event (task requested)
    const journalFile2 = path.join(journalDir, '000002.01TEST002.json');
    fs.writeFileSync(
      journalFile2,
      JSON.stringify({
        type: 'EFFECT_REQUESTED',
        recordedAt: '2026-03-10T10:00:01Z',
        data: {
          effectId: 'eff-001',
          kind: 'node',
          title: 'Test task',
          taskId: 'my-task',
        },
        checksum: 'def',
      }),
    );

    // Manually trigger the create event
    mockWatcher._createListener!(vscode.Uri.file(journalFile2));

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 700));

    // Verify watcher fired run-changed event
    expect(events.some((e) => e.type === 'run-changed' && e.runId === runId)).toBe(true);

    // Verify cache reflects the new event
    run = cache.getById(runId);
    expect(run!.events).toHaveLength(2);
    expect(run!.tasks).toHaveLength(1);
    expect(run!.tasks[0].effectId).toBe('eff-001');
    expect(run!.tasks[0].status).toBe('requested');
    expect(run!.status).toBe('waiting');
  });

  it('watcher detects task resolution and cache updates task status', async () => {
    // Set up run with requested task
    const runId = 'run-resolve-001';
    const runDir = path.join(runsDir, runId);
    const journalDir = path.join(runDir, 'journal');
    const tasksDir = path.join(runDir, 'tasks');
    fs.mkdirSync(journalDir, { recursive: true });
    fs.mkdirSync(tasksDir, { recursive: true });

    fs.writeFileSync(
      path.join(runDir, 'run.json'),
      JSON.stringify({ runId, processId: 'test', createdAt: '2026-03-10T10:00:00Z' }),
    );

    fs.writeFileSync(
      path.join(journalDir, '000001.01T001.json'),
      JSON.stringify({
        type: 'RUN_CREATED',
        recordedAt: '2026-03-10T10:00:00Z',
        data: { runId },
      }),
    );

    fs.writeFileSync(
      path.join(journalDir, '000002.01T002.json'),
      JSON.stringify({
        type: 'EFFECT_REQUESTED',
        recordedAt: '2026-03-10T10:00:01Z',
        data: { effectId: 'eff-001', kind: 'node', title: 'Build' },
      }),
    );

    cache.refresh(runId);
    let run = cache.getById(runId);
    expect(run!.tasks[0].status).toBe('requested');

    // Wire watcher
    watcher.onDidChange((event) => {
      if (event.type === 'run-changed') {
        cache.refresh(event.runId);
      }
    });
    watcher.start();

    // Simulate task resolution by adding EFFECT_RESOLVED event
    const journalFile3 = path.join(journalDir, '000003.01T003.json');
    fs.writeFileSync(
      journalFile3,
      JSON.stringify({
        type: 'EFFECT_RESOLVED',
        recordedAt: '2026-03-10T10:00:05Z',
        data: { effectId: 'eff-001', value: { result: 'success' } },
      }),
    );

    mockWatcher._createListener!(vscode.Uri.file(journalFile3));

    await new Promise((resolve) => setTimeout(resolve, 700));

    // Verify cache shows resolved task
    run = cache.getById(runId);
    expect(run!.tasks[0].status).toBe('resolved');
    expect(run!.tasks[0].duration).toBe(4000); // 10:00:05 - 10:00:01
    expect(run!.completedTasks).toBe(1);
  });

  it('multiple rapid changes are debounced', async () => {
    const runId = 'run-debounce-001';
    const runDir = path.join(runsDir, runId);
    const journalDir = path.join(runDir, 'journal');
    fs.mkdirSync(journalDir, { recursive: true });

    fs.writeFileSync(
      path.join(runDir, 'run.json'),
      JSON.stringify({ runId, processId: 'test', createdAt: '2026-03-10T10:00:00Z' }),
    );

    const events: WatcherEvent[] = [];
    let refreshCount = 0;

    watcher.onDidChange((event) => {
      events.push(event);
      if (event.type === 'run-changed') {
        refreshCount++;
        cache.refresh(event.runId);
      }
    });
    watcher.start();

    // Create multiple events in rapid succession
    for (let i = 1; i <= 5; i++) {
      const journalFile = path.join(journalDir, `00000${i}.01T00${i}.json`);
      fs.writeFileSync(
        journalFile,
        JSON.stringify({
          type: 'EFFECT_REQUESTED',
          recordedAt: `2026-03-10T10:00:0${i}Z`,
          data: { effectId: `eff-00${i}` },
        }),
      );
      // Trigger each event
      mockWatcher._createListener!(vscode.Uri.file(journalFile));
    }

    // Wait for debounce (should consolidate to 1-2 events)
    await new Promise((resolve) => setTimeout(resolve, 700));

    // Verify debouncing occurred (not 5 separate refreshes)
    expect(refreshCount).toBeLessThan(5);
    expect(refreshCount).toBeGreaterThanOrEqual(1);

    // Verify cache has all events despite debouncing
    const run = cache.getById(runId);
    expect(run).toBeDefined();
    expect(run!.events).toHaveLength(5);
  });

  it('cache handles run deletion when watcher detects removal', async () => {
    const runId = 'run-delete-001';
    const runDir = path.join(runsDir, runId);
    fs.mkdirSync(runDir, { recursive: true });

    const runJsonPath = path.join(runDir, 'run.json');
    fs.writeFileSync(
      runJsonPath,
      JSON.stringify({ runId, processId: 'test', createdAt: '2026-03-10T10:00:00Z' }),
    );

    cache.refresh(runId);
    expect(cache.getById(runId)).toBeDefined();

    watcher.onDidChange((event) => {
      if (event.type === 'runs-changed') {
        cache.refreshAll();
      } else if (event.type === 'run-changed') {
        const result = cache.refresh(event.runId);
        if (result === null) {
          // Run no longer exists, was deleted
        }
      }
    });
    watcher.start();

    // Delete run.json
    fs.rmSync(runJsonPath);

    // Trigger delete event
    mockWatcher._deleteListener!(vscode.Uri.file(runJsonPath));

    await new Promise((resolve) => setTimeout(resolve, 700));

    // Verify cache no longer has the run
    const result = cache.refresh(runId);
    expect(result).toBeNull();
    expect(cache.getById(runId)).toBeUndefined();
  });
});
