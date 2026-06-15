/**
 * ProcessTracker singleton for zombie prevention.
 *
 * Maintains a set of all active subprocess PIDs and their metadata.
 * On Node.js exit, all tracked processes are forcefully terminated.
 *
 * Per spec §6.4: handlers are installed once, on first register() call.
 */

// ---------------------------------------------------------------------------
// ProcessTracker interface
// ---------------------------------------------------------------------------

export interface ProcessTracker {
  /** Register a spawned process. Called by RunHandle during spawn. */
  register(pid: number, groupId: number, runId: string): void;

  /** Unregister a process after it exits. Called on process exit. */
  unregister(pid: number): void;

  /** Kill all tracked processes. Sends SIGTERM then SIGKILL after grace period. */
  killAll(): void;

  /** Number of currently tracked processes. */
  readonly activeCount: number;
}

// ---------------------------------------------------------------------------
// TrackedProcess
// ---------------------------------------------------------------------------

interface TrackedProcess {
  pid: number;
  groupId: number;
  runId: string;
}

// ---------------------------------------------------------------------------
// ProcessTrackerImpl
// ---------------------------------------------------------------------------

class ProcessTrackerImpl implements ProcessTracker {
  private readonly _tracked = new Map<number, TrackedProcess>();
  private _handlersInstalled = false;

  get activeCount(): number {
    return this._tracked.size;
  }

  register(pid: number, groupId: number, runId: string): void {
    this._tracked.set(pid, { pid, groupId, runId });

    if (!this._handlersInstalled) {
      this._installHandlers();
      this._handlersInstalled = true;
    }
  }

  unregister(pid: number): void {
    this._tracked.delete(pid);
  }

  killAll(): void {
    const isUnix = process.platform !== 'win32';

    // Phase 1: send SIGINT to each process group (Unix) or SIGTERM to PID (Windows).
    for (const proc of this._tracked.values()) {
      try {
        if (isUnix && proc.groupId > 0) {
          // Kill the entire process group on Unix (negative PID).
          process.kill(-proc.groupId, 'SIGINT');
        } else {
          process.kill(proc.pid, 'SIGTERM');
        }
      } catch {
        // Process may have already exited — ignore.
      }
    }

    // Phase 2: synchronous grace wait then SIGKILL.
    // In the `exit` handler context this is synchronous — we cannot
    // use setTimeout. We do a best-effort busy-wait then SIGKILL.
    // Real async two-phase shutdown is handled by RunHandleImpl.abort().
    // Here we are in the "process is dying" path — be aggressive.
    for (const proc of this._tracked.values()) {
      try {
        if (isUnix && proc.groupId > 0) {
          process.kill(-proc.groupId, 'SIGKILL');
        } else {
          process.kill(proc.pid, 'SIGKILL');
        }
      } catch {
        // Already exited — fine.
      }
    }

    this._tracked.clear();
  }

  private _installHandlers(): void {
    // Synchronous kill on exit
    process.on('exit', () => {
      this.killAll();
    });

    // Signal handlers — per spec §6.4, installed for SIGTERM and SIGINT.
    // On Windows, Node.js emits these for Ctrl+C and taskkill.
    const signalHandler = () => {
      this.killAll();
      process.exit(1);
    };
    process.on('SIGTERM', signalHandler);
    process.on('SIGINT', signalHandler);

    // Uncaught errors: cleanup then rethrow
    process.on('uncaughtException', (err) => {
      this.killAll();
      throw err;
    });

    process.on('unhandledRejection', (reason) => {
      this.killAll();
      if (reason instanceof Error) throw reason;
      throw new Error(String(reason));
    });
  }
}

// ---------------------------------------------------------------------------
// Module-level singleton
// ---------------------------------------------------------------------------

/** Global ProcessTracker singleton. */
export const processTracker: ProcessTracker = new ProcessTrackerImpl();
