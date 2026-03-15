import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import * as path from 'path';
import { RunWatcher, WatcherEvent } from '../watcher';

// Build fsPath values using path.join so separators match the platform
const WORKSPACE = path.resolve('/workspace');

function fsPath(...segments: string[]): string {
  return path.join(WORKSPACE, ...segments);
}

describe('RunWatcher', () => {
  let watcher: RunWatcher;

  // Capture the callbacks registered on the fs watcher
  let onCreateCallback: ((uri: { fsPath: string }) => void) | undefined;
  let onChangeCallback: ((uri: { fsPath: string }) => void) | undefined;
  let onDeleteCallback: ((uri: { fsPath: string }) => void) | undefined;

  beforeEach(() => {
    vi.useFakeTimers();

    onCreateCallback = undefined;
    onChangeCallback = undefined;
    onDeleteCallback = undefined;

    const mockFsWatcher = {
      onDidCreate: vi.fn((cb: (uri: { fsPath: string }) => void) => {
        onCreateCallback = cb;
        return new vscode.Disposable(() => {});
      }),
      onDidChange: vi.fn((cb: (uri: { fsPath: string }) => void) => {
        onChangeCallback = cb;
        return new vscode.Disposable(() => {});
      }),
      onDidDelete: vi.fn((cb: (uri: { fsPath: string }) => void) => {
        onDeleteCallback = cb;
        return new vscode.Disposable(() => {});
      }),
      dispose: vi.fn(),
    };

    // Override the mock to return our controllable watcher
    vi.mocked(vscode.workspace.createFileSystemWatcher).mockReturnValue(
      mockFsWatcher as unknown as vscode.FileSystemWatcher,
    );

    watcher = new RunWatcher(WORKSPACE);
  });

  afterEach(() => {
    watcher.dispose();
    vi.useRealTimers();
  });

  it('constructor sets up correctly without starting', () => {
    const callsBefore = vi.mocked(vscode.workspace.createFileSystemWatcher).mock.calls.length;
    const fresh = new RunWatcher(WORKSPACE);
    // Constructor alone should not call createFileSystemWatcher
    expect(vi.mocked(vscode.workspace.createFileSystemWatcher).mock.calls.length).toBe(callsBefore);
    fresh.dispose();
  });

  it('start() creates a file system watcher', () => {
    const callsBefore = vi.mocked(vscode.workspace.createFileSystemWatcher).mock.calls.length;
    watcher.start();
    expect(vi.mocked(vscode.workspace.createFileSystemWatcher).mock.calls.length).toBe(callsBefore + 1);
  });

  it('start() is idempotent - calling twice does not create a second watcher', () => {
    const callsBefore = vi.mocked(vscode.workspace.createFileSystemWatcher).mock.calls.length;
    watcher.start();
    watcher.start();
    expect(vi.mocked(vscode.workspace.createFileSystemWatcher).mock.calls.length).toBe(callsBefore + 1);
  });

  it('emits run-changed for file change events', () => {
    watcher.start();

    const events: WatcherEvent[] = [];
    watcher.onDidChange((e) => events.push(e));

    // Simulate a journal file change (use platform-correct paths)
    onChangeCallback?.({ fsPath: fsPath('.a5c', 'runs', 'run-abc', 'journal', '000001.AAAAAA.json') });

    // Advance past debounce
    vi.advanceTimersByTime(600);

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ type: 'run-changed', runId: 'run-abc' });
  });

  it('emits new-run for run.json creation', () => {
    watcher.start();

    const events: WatcherEvent[] = [];
    watcher.onDidChange((e) => events.push(e));

    // Simulate run.json creation
    onCreateCallback?.({ fsPath: fsPath('.a5c', 'runs', 'new-run-123', 'run.json') });

    vi.advanceTimersByTime(600);

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ type: 'new-run', runId: 'new-run-123' });
  });

  it('emits run-changed (not new-run) for subsequent run.json changes', () => {
    watcher.start();

    const events: WatcherEvent[] = [];
    watcher.onDidChange((e) => events.push(e));

    // First: create event for run.json -> new-run
    onCreateCallback?.({ fsPath: fsPath('.a5c', 'runs', 'run-xyz', 'run.json') });
    vi.advanceTimersByTime(600);

    // Second: another create on same runId -> should be run-changed because runId is now known
    onCreateCallback?.({ fsPath: fsPath('.a5c', 'runs', 'run-xyz', 'run.json') });
    vi.advanceTimersByTime(600);

    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('new-run');
    expect(events[1].type).toBe('run-changed');
  });

  it('debounces multiple rapid events into a single emission', () => {
    watcher.start();

    const events: WatcherEvent[] = [];
    watcher.onDidChange((e) => events.push(e));

    // Fire many changes rapidly for the same runId
    onChangeCallback?.({ fsPath: fsPath('.a5c', 'runs', 'run-debounce', 'journal', '000001.AAA.json') });
    vi.advanceTimersByTime(100);
    onChangeCallback?.({ fsPath: fsPath('.a5c', 'runs', 'run-debounce', 'journal', '000002.BBB.json') });
    vi.advanceTimersByTime(100);
    onChangeCallback?.({ fsPath: fsPath('.a5c', 'runs', 'run-debounce', 'journal', '000003.CCC.json') });
    vi.advanceTimersByTime(600);

    // Should only fire once due to debounce
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ type: 'run-changed', runId: 'run-debounce' });
  });

  it('dispose cleans up watchers and prevents further events', () => {
    watcher.start();

    const events: WatcherEvent[] = [];
    watcher.onDidChange((e) => events.push(e));

    // Trigger an event
    onChangeCallback?.({ fsPath: fsPath('.a5c', 'runs', 'run-disposed', 'journal', '000001.AAA.json') });

    // Dispose before debounce fires
    watcher.dispose();

    vi.advanceTimersByTime(600);

    // No events should have been emitted
    expect(events).toEqual([]);
  });

  it('ignores files outside the runs directory', () => {
    watcher.start();

    const events: WatcherEvent[] = [];
    watcher.onDidChange((e) => events.push(e));

    onChangeCallback?.({ fsPath: path.resolve('/other/path/file.json') });
    vi.advanceTimersByTime(600);

    expect(events).toEqual([]);
  });

  it('emits runs-changed when run.json is deleted', () => {
    watcher.start();

    const events: WatcherEvent[] = [];
    watcher.onDidChange((e) => events.push(e));

    // First make it known
    onCreateCallback?.({ fsPath: fsPath('.a5c', 'runs', 'run-del', 'run.json') });
    vi.advanceTimersByTime(600);

    // Now delete run.json
    onDeleteCallback?.({ fsPath: fsPath('.a5c', 'runs', 'run-del', 'run.json') });
    vi.advanceTimersByTime(600);

    expect(events).toHaveLength(2);
    expect(events[1].type).toBe('runs-changed');
  });
});
