import * as fs from 'fs';
import * as path from 'path';
import { Run, RunStatus, RunDigest } from '../types';
import { parseRunDir } from './parser';

// ---------------------------------------------------------------------------
// RunCache — in-memory cache of parsed runs with efficient refresh
// ---------------------------------------------------------------------------

export class RunCache {
  private cache = new Map<string, Run>();
  private readonly runsDir: string;

  constructor(workspaceRoot: string) {
    this.runsDir = path.join(workspaceRoot, '.a5c', 'runs');
  }

  /**
   * All cached runs, sorted by updatedAt descending.
   */
  getAll(): Run[] {
    return Array.from(this.cache.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  /**
   * Filter runs by status, sorted by updatedAt descending.
   */
  getByStatus(status: RunStatus): Run[] {
    return this.getAll().filter((r) => r.status === status);
  }

  /**
   * Get a single run by ID.
   */
  getById(runId: string): Run | undefined {
    return this.cache.get(runId);
  }

  /**
   * Re-parse a single run and update the cache. Returns null if run no longer exists.
   */
  refresh(runId: string): Run | null {
    const runDirPath = path.join(this.runsDir, runId);
    if (!fs.existsSync(path.join(runDirPath, 'run.json'))) {
      this.cache.delete(runId);
      return null;
    }

    try {
      const run = parseRunDir(runDirPath);
      if (run) {
        this.cache.set(runId, run);
        return run;
      } else {
        this.cache.delete(runId);
        return null;
      }
    } catch {
      this.cache.delete(runId);
      return null;
    }
  }

  /**
   * Discover and parse all runs. Clears existing cache.
   */
  refreshAll(): void {
    this.cache.clear();

    const runIds = this.discoverRuns();
    for (const runId of runIds) {
      const runDirPath = path.join(this.runsDir, runId);
      try {
        const run = parseRunDir(runDirPath);
        if (run) {
          this.cache.set(runId, run);
        }
      } catch {
        // skip corrupt runs
      }
    }
  }

  /**
   * Lightweight summaries of all cached runs.
   */
  getDigests(): RunDigest[] {
    return this.getAll().map((run) => ({
      runId: run.runId,
      processId: run.processId,
      status: run.status,
      taskCount: run.totalTasks,
      completedTasks: run.completedTasks,
      updatedAt: run.updatedAt,
      pendingBreakpoints: run.tasks.filter((t) => t.kind === 'breakpoint' && t.status === 'requested').length,
      breakpointQuestion: run.breakpointQuestion,
      breakpointEffectId: run.breakpointEffectId,
      waitingKind: run.waitingKind,
      isStale: run.isStale,
    }));
  }

  /**
   * Aggregate summary of all cached runs.
   */
  getSummary(): { total: number; active: number; completed: number; failed: number; breakpoints: number } {
    const runs = this.getAll();
    return {
      total: runs.length,
      active: runs.filter((r) => r.status === 'pending' || r.status === 'waiting').length,
      completed: runs.filter((r) => r.status === 'completed').length,
      failed: runs.filter((r) => r.status === 'failed').length,
      breakpoints: runs.filter((r) => r.waitingKind === 'breakpoint').length,
    };
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  /**
   * Discover run directories in .a5c/runs/ that contain a run.json file.
   */
  private discoverRuns(): string[] {
    if (!fs.existsSync(this.runsDir)) {
      return [];
    }

    try {
      const entries = fs.readdirSync(this.runsDir);
      return entries.filter((entry) => {
        const runJsonPath = path.join(this.runsDir, entry, 'run.json');
        try {
          return fs.existsSync(runJsonPath);
        } catch {
          return false;
        }
      });
    } catch {
      return [];
    }
  }
}
