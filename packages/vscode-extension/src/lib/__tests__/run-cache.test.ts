import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { RunCache } from '../run-cache';

const FIXTURES = path.resolve(__dirname, '../../__fixtures__');

/**
 * Helper: create a temp workspace root with .a5c/runs/ containing copies of fixture runs.
 */
function createTempWorkspace(...fixtureNames: string[]): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runcache-test-'));
  const runsDir = path.join(tmpDir, '.a5c', 'runs');
  fs.mkdirSync(runsDir, { recursive: true });

  for (const name of fixtureNames) {
    const src = path.join(FIXTURES, name);
    const dest = path.join(runsDir, name);
    copyDirSync(src, dest);
  }

  return tmpDir;
}

function copyDirSync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

let tmpWorkspace: string;

afterEach(() => {
  if (tmpWorkspace && fs.existsSync(tmpWorkspace)) {
    fs.rmSync(tmpWorkspace, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Constructor & refreshAll
// ---------------------------------------------------------------------------
describe('RunCache', () => {
  describe('constructor and refreshAll', () => {
    it('creates cache with workspace root', () => {
      tmpWorkspace = createTempWorkspace('test-run-completed');
      const cache = new RunCache(tmpWorkspace);
      expect(cache.getAll()).toEqual([]);
    });

    it('refreshAll discovers and parses all runs', () => {
      tmpWorkspace = createTempWorkspace('test-run-completed', 'test-run-failed', 'test-run-waiting');
      const cache = new RunCache(tmpWorkspace);
      cache.refreshAll();
      expect(cache.getAll()).toHaveLength(3);
    });

    it('refreshAll clears previous cache', () => {
      tmpWorkspace = createTempWorkspace('test-run-completed');
      const cache = new RunCache(tmpWorkspace);
      cache.refreshAll();
      expect(cache.getAll()).toHaveLength(1);
      // Remove the run directory and refresh
      fs.rmSync(path.join(tmpWorkspace, '.a5c', 'runs', 'test-run-completed'), { recursive: true });
      cache.refreshAll();
      expect(cache.getAll()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getAll
  // ---------------------------------------------------------------------------
  describe('getAll', () => {
    it('returns runs sorted by updatedAt descending', () => {
      tmpWorkspace = createTempWorkspace('test-run-completed', 'test-run-failed', 'test-run-waiting');
      const cache = new RunCache(tmpWorkspace);
      cache.refreshAll();
      const runs = cache.getAll();
      for (let i = 0; i < runs.length - 1; i++) {
        expect(new Date(runs[i].updatedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(runs[i + 1].updatedAt).getTime(),
        );
      }
    });
  });

  // ---------------------------------------------------------------------------
  // getByStatus
  // ---------------------------------------------------------------------------
  describe('getByStatus', () => {
    it('filters runs by completed status', () => {
      tmpWorkspace = createTempWorkspace('test-run-completed', 'test-run-failed', 'test-run-waiting');
      const cache = new RunCache(tmpWorkspace);
      cache.refreshAll();
      const completed = cache.getByStatus('completed');
      expect(completed).toHaveLength(1);
      expect(completed[0].status).toBe('completed');
    });

    it('filters runs by failed status', () => {
      tmpWorkspace = createTempWorkspace('test-run-completed', 'test-run-failed');
      const cache = new RunCache(tmpWorkspace);
      cache.refreshAll();
      const failed = cache.getByStatus('failed');
      expect(failed).toHaveLength(1);
      expect(failed[0].status).toBe('failed');
    });

    it('returns empty array for status with no matching runs', () => {
      tmpWorkspace = createTempWorkspace('test-run-completed');
      const cache = new RunCache(tmpWorkspace);
      cache.refreshAll();
      const pending = cache.getByStatus('pending');
      expect(pending).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getById
  // ---------------------------------------------------------------------------
  describe('getById', () => {
    it('returns a run by its cache key (directory name)', () => {
      tmpWorkspace = createTempWorkspace('test-run-completed');
      const cache = new RunCache(tmpWorkspace);
      cache.refreshAll();
      // Cache key is the directory name, not the runId from run.json
      const run = cache.getById('test-run-completed');
      expect(run).toBeDefined();
      expect(run!.runId).toBe('test-run-001');
    });

    it('returns undefined for unknown runId', () => {
      tmpWorkspace = createTempWorkspace('test-run-completed');
      const cache = new RunCache(tmpWorkspace);
      cache.refreshAll();
      expect(cache.getById('nonexistent')).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // refresh (single run)
  // ---------------------------------------------------------------------------
  describe('refresh', () => {
    it('re-parses a single run and updates cache', () => {
      tmpWorkspace = createTempWorkspace('test-run-completed');
      const cache = new RunCache(tmpWorkspace);
      cache.refreshAll();
      const run = cache.refresh('test-run-completed');
      expect(run).not.toBeNull();
      expect(run!.runId).toBe('test-run-001');
    });

    it('removes run from cache when run.json is deleted', () => {
      tmpWorkspace = createTempWorkspace('test-run-completed');
      const cache = new RunCache(tmpWorkspace);
      cache.refreshAll();
      expect(cache.getAll()).toHaveLength(1);
      // Delete run.json
      fs.unlinkSync(path.join(tmpWorkspace, '.a5c', 'runs', 'test-run-completed', 'run.json'));
      const result = cache.refresh('test-run-completed');
      expect(result).toBeNull();
      expect(cache.getAll()).toEqual([]);
    });

    it('returns null for nonexistent run', () => {
      tmpWorkspace = createTempWorkspace('test-run-completed');
      const cache = new RunCache(tmpWorkspace);
      cache.refreshAll();
      const result = cache.refresh('nonexistent-run');
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getDigests
  // ---------------------------------------------------------------------------
  describe('getDigests', () => {
    it('returns lightweight digests for all runs', () => {
      tmpWorkspace = createTempWorkspace('test-run-completed', 'test-run-waiting');
      const cache = new RunCache(tmpWorkspace);
      cache.refreshAll();
      const digests = cache.getDigests();
      expect(digests).toHaveLength(2);
      const completedDigest = digests.find((d) => d.runId === 'test-run-001');
      expect(completedDigest).toBeDefined();
      expect(completedDigest!.status).toBe('completed');
      expect(completedDigest!.taskCount).toBe(1);
      expect(completedDigest!.completedTasks).toBe(1);
    });

    it('includes breakpoint info in digests', () => {
      tmpWorkspace = createTempWorkspace('test-run-waiting');
      const cache = new RunCache(tmpWorkspace);
      cache.refreshAll();
      const digests = cache.getDigests();
      expect(digests).toHaveLength(1);
      expect(digests[0].pendingBreakpoints).toBe(1);
      expect(digests[0].breakpointQuestion).toBe('Do you approve deploying version 2.0 to production?');
      expect(digests[0].waitingKind).toBe('breakpoint');
    });
  });

  // ---------------------------------------------------------------------------
  // getSummary
  // ---------------------------------------------------------------------------
  describe('getSummary', () => {
    it('returns aggregate summary of all cached runs', () => {
      tmpWorkspace = createTempWorkspace('test-run-completed', 'test-run-failed', 'test-run-waiting');
      const cache = new RunCache(tmpWorkspace);
      cache.refreshAll();
      const summary = cache.getSummary();
      expect(summary.total).toBe(3);
      expect(summary.completed).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.active).toBe(1); // waiting
      expect(summary.breakpoints).toBe(1);
    });

    it('returns zeros for empty cache', () => {
      tmpWorkspace = createTempWorkspace();
      const cache = new RunCache(tmpWorkspace);
      cache.refreshAll();
      const summary = cache.getSummary();
      expect(summary).toEqual({ total: 0, active: 0, completed: 0, failed: 0, breakpoints: 0 });
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles nonexistent runsDir gracefully', () => {
      const cache = new RunCache('/nonexistent/workspace');
      cache.refreshAll();
      expect(cache.getAll()).toEqual([]);
    });

    it('handles empty runsDir gracefully', () => {
      tmpWorkspace = createTempWorkspace();
      const cache = new RunCache(tmpWorkspace);
      cache.refreshAll();
      expect(cache.getAll()).toEqual([]);
    });
  });
});
