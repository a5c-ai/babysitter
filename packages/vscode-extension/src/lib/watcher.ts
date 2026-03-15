import * as vscode from 'vscode';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WatcherEvent =
  | { type: 'run-changed'; runId: string }
  | { type: 'new-run'; runId: string }
  | { type: 'runs-changed' };

// ---------------------------------------------------------------------------
// RunWatcher
// ---------------------------------------------------------------------------

/**
 * File system watcher for run directory changes.
 * Watches .a5c/runs/ for new and updated run files, debouncing per-runId.
 */
export class RunWatcher implements vscode.Disposable {
  private readonly _onDidChange = new vscode.EventEmitter<WatcherEvent>();
  readonly onDidChange = this._onDidChange.event;

  private _watcher: vscode.FileSystemWatcher | undefined;
  private _debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private _knownRuns = new Set<string>();
  private _disposed = false;

  private static readonly DEBOUNCE_MS = 500;

  constructor(private readonly workspaceRoot: string) {}

  /**
   * Start watching .a5c/runs/ for file changes.
   */
  start(): void {
    if (this._disposed || this._watcher) {
      return;
    }

    const runsRelative = path.join('.a5c', 'runs');
    const pattern = new vscode.RelativePattern(
      this.workspaceRoot,
      `${runsRelative}/**/*.json`,
    );

    this._watcher = vscode.workspace.createFileSystemWatcher(pattern);

    this._watcher.onDidCreate((uri) => this._handleChange(uri, true));
    this._watcher.onDidChange((uri) => this._handleChange(uri, false));
    this._watcher.onDidDelete((uri) => this._handleDelete(uri));
  }

  /**
   * Clean up watchers and emitter.
   */
  dispose(): void {
    this._disposed = true;

    // Clear all pending debounce timers
    for (const timer of this._debounceTimers.values()) {
      clearTimeout(timer);
    }
    this._debounceTimers.clear();

    this._watcher?.dispose();
    this._watcher = undefined;

    this._onDidChange.dispose();
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private _handleChange(uri: vscode.Uri, isCreate: boolean): void {
    const runId = this._extractRunId(uri);
    if (!runId) {
      return;
    }

    // Detect new run: run.json creation for an unknown runId
    const filename = path.basename(uri.fsPath);
    if (isCreate && filename === 'run.json' && !this._knownRuns.has(runId)) {
      this._knownRuns.add(runId);
      this._emitDebounced(runId, { type: 'new-run', runId });
      return;
    }

    this._knownRuns.add(runId);
    this._emitDebounced(runId, { type: 'run-changed', runId });
  }

  private _handleDelete(uri: vscode.Uri): void {
    const runId = this._extractRunId(uri);
    if (!runId) {
      return;
    }

    const filename = path.basename(uri.fsPath);
    if (filename === 'run.json') {
      // Entire run may have been removed
      this._knownRuns.delete(runId);
      this._emitDebounced(runId, { type: 'runs-changed' });
    } else {
      this._emitDebounced(runId, { type: 'run-changed', runId });
    }
  }

  /**
   * Extract runId from a file path within .a5c/runs/<runId>/...
   */
  private _extractRunId(uri: vscode.Uri): string | null {
    const runsDir = path.join(this.workspaceRoot, '.a5c', 'runs');
    const filePath = uri.fsPath;

    if (!filePath.startsWith(runsDir)) {
      return null;
    }

    // The path after runsDir is /<runId>/...
    const relative = filePath.slice(runsDir.length);
    // Normalize separators and split
    const segments = relative.replace(/\\/g, '/').split('/').filter(Boolean);
    return segments.length > 0 ? segments[0] : null;
  }

  /**
   * Debounce event emission per runId (or a global key for runs-changed).
   */
  private _emitDebounced(key: string, event: WatcherEvent): void {
    const existing = this._debounceTimers.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      this._debounceTimers.delete(key);
      if (!this._disposed) {
        this._onDidChange.fire(event);
      }
    }, RunWatcher.DEBOUNCE_MS);

    this._debounceTimers.set(key, timer);
  }
}
