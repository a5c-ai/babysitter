import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import { promises as fs } from 'fs';
import {
  parseJournalDir,
  parseJournalDirIncremental,
  parseRunDir,
  parseTaskDetail,
  getRunDigest,
  getRunIds,
} from '../parser';
import type { JournalEvent } from '@/types';

// Use vi.spyOn to replace methods on the actual promises object
// This ensures both the test file and parser module share the same reference
const mockReadFile = vi.spyOn(fs, 'readFile');
const mockReaddir = vi.spyOn(fs, 'readdir');
const mockAccess = vi.spyOn(fs, 'access');

// ---------------------------------------------------------------------------
// Helpers for building realistic journal event files
// ---------------------------------------------------------------------------

function makeRunCreatedRaw(runId: string, processId: string, recordedAt: string) {
  return {
    type: 'RUN_CREATED',
    recordedAt,
    data: { runId, processId },
  };
}

function makeEffectRequestedRaw(
  effectId: string,
  kind: string,
  label: string,
  recordedAt: string,
  extras: Record<string, unknown> = {},
) {
  return {
    type: 'EFFECT_REQUESTED',
    recordedAt,
    data: {
      effectId,
      kind,
      label,
      invocationKey: `inv-${effectId}`,
      stepId: `step-${effectId}`,
      taskId: `task-${effectId}`,
      ...extras,
    },
  };
}

function makeEffectResolvedRaw(
  effectId: string,
  status: 'ok' | 'error',
  recordedAt: string,
  extras: Record<string, unknown> = {},
) {
  return {
    type: 'EFFECT_RESOLVED',
    recordedAt,
    data: {
      effectId,
      status,
      startedAt: '2024-01-15T10:00:01Z',
      finishedAt: '2024-01-15T10:00:05Z',
      ...extras,
    },
  };
}

function makeRunCompletedRaw(recordedAt: string) {
  return {
    type: 'RUN_COMPLETED',
    recordedAt,
    data: {},
  };
}

function makeRunFailedRaw(recordedAt: string) {
  return {
    type: 'RUN_FAILED',
    recordedAt,
    data: {},
  };
}

describe('parser', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // -----------------------------------------------------------------------
  // parseJournalDir
  // -----------------------------------------------------------------------
  describe('parseJournalDir', () => {
    it('returns empty array when journal directory does not exist', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const events = await parseJournalDir('/nonexistent/journal');

      expect(events).toEqual([]);
    });

    it('returns empty array when journal directory has no json files', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(['readme.txt', '.gitkeep'] as any);

      const events = await parseJournalDir('/run/journal');

      expect(events).toEqual([]);
    });

    it('parses journal event files sorted by sequence number', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue([
        '000002.ULID2.json',
        '000001.ULID1.json',
      ] as any);

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.includes('000001')) {
          return JSON.stringify(
            makeRunCreatedRaw('run-1', 'process-1', '2024-01-15T10:00:00Z'),
          );
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-1', 'node', 'step-label', '2024-01-15T10:00:01Z'),
          );
        }
        return '{}';
      });

      const events = await parseJournalDir('/run/journal');

      expect(events).toHaveLength(2);
      expect(events[0].seq).toBe(1);
      expect(events[0].type).toBe('RUN_CREATED');
      expect(events[0].id).toBe('ULID1');
      expect(events[1].seq).toBe(2);
      expect(events[1].type).toBe('EFFECT_REQUESTED');
    });

    it('normalizes recordedAt to ts field', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(['000001.ABC.json'] as any);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          type: 'RUN_CREATED',
          recordedAt: '2024-01-15T10:00:00Z',
          data: { runId: 'r1' },
        }),
      );

      const events = await parseJournalDir('/run/journal');

      expect(events[0].ts).toBe('2024-01-15T10:00:00Z');
    });

    it('normalizes data field to payload', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(['000001.ABC.json'] as any);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          type: 'RUN_CREATED',
          recordedAt: '2024-01-15T10:00:00Z',
          data: { runId: 'r1', processId: 'p1' },
        }),
      );

      const events = await parseJournalDir('/run/journal');

      expect(events[0].payload).toEqual({ runId: 'r1', processId: 'p1' });
    });

    it('skips entries with no type field', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue([
        '000001.A.json',
        '000002.B.json',
      ] as any);

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.includes('000001')) {
          return JSON.stringify({ noType: true });
        }
        return JSON.stringify({
          type: 'RUN_CREATED',
          recordedAt: '2024-01-15T10:00:00Z',
          data: {},
        });
      });

      const events = await parseJournalDir('/run/journal');

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('RUN_CREATED');
    });

    it('skips entries with malformed JSON', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue([
        '000001.A.json',
        '000002.B.json',
      ] as any);

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.includes('000001')) {
          return 'not valid json{{{';
        }
        return JSON.stringify({
          type: 'RUN_CREATED',
          recordedAt: '2024-01-15T10:00:00Z',
          data: {},
        });
      });

      const events = await parseJournalDir('/run/journal');

      expect(events).toHaveLength(1);
    });

    it('handles ts field as fallback when recordedAt is missing', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(['000001.A.json'] as any);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          type: 'RUN_CREATED',
          ts: '2024-06-01T12:00:00Z',
          payload: { runId: 'r1' },
        }),
      );

      const events = await parseJournalDir('/run/journal');

      expect(events[0].ts).toBe('2024-06-01T12:00:00Z');
    });

    it('handles payload field as fallback when data is missing', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(['000001.A.json'] as any);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          type: 'RUN_CREATED',
          ts: '2024-06-01T12:00:00Z',
          payload: { runId: 'r1' },
        }),
      );

      const events = await parseJournalDir('/run/journal');

      expect(events[0].payload).toEqual({ runId: 'r1' });
    });
  });

  // -----------------------------------------------------------------------
  // parseRunDir
  // -----------------------------------------------------------------------
  describe('parseRunDir', () => {
    function setupCompleteRun() {
      // run.json
      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();

        if (p.endsWith('run.json')) {
          return JSON.stringify({ processId: 'data-pipeline' });
        }

        // Journal files
        if (p.includes('000001')) {
          return JSON.stringify(
            makeRunCreatedRaw('run-123', 'data-pipeline', '2024-01-15T10:00:00Z'),
          );
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-1', 'node', 'fetch-data', '2024-01-15T10:00:01Z'),
          );
        }
        if (p.includes('000003')) {
          return JSON.stringify(
            makeEffectResolvedRaw('eff-1', 'ok', '2024-01-15T10:00:05Z'),
          );
        }
        if (p.includes('000004')) {
          return JSON.stringify(
            makeRunCompletedRaw('2024-01-15T10:00:06Z'),
          );
        }

        // task.json for eff-1
        if (p.includes(path.join('tasks', 'eff-1', 'task.json'))) {
          return JSON.stringify({
            title: 'Fetch Data',
            kind: 'node',
          });
        }

        throw new Error('ENOENT');
      });

      // Journal dir exists
      mockAccess.mockImplementation(async (p: any) => {
        const pathStr = p.toString();
        if (pathStr.includes('journal')) return undefined;
        throw new Error('ENOENT');
      });

      // Journal file listing
      mockReaddir.mockImplementation(async (dir: any) => {
        const d = typeof dir === 'string' ? dir : dir.toString();
        if (d.includes('journal')) {
          return [
            '000001.ULID1.json',
            '000002.ULID2.json',
            '000003.ULID3.json',
            '000004.ULID4.json',
          ] as any;
        }
        return [];
      });
    }

    it('parses a completed run with tasks', async () => {
      setupCompleteRun();

      const run = await parseRunDir('/runs/run-123');

      expect(run.runId).toBe('run-123');
      expect(run.processId).toBe('data-pipeline');
      expect(run.status).toBe('completed');
      expect(run.tasks).toHaveLength(1);
      expect(run.tasks[0].effectId).toBe('eff-1');
      expect(run.tasks[0].status).toBe('resolved');
      expect(run.totalTasks).toBe(1);
      expect(run.completedTasks).toBe(1);
      expect(run.failedTasks).toBe(0);
    });

    it('§15.1 AC-83: a run whose newest event is an unresolved sleep effect parses as driver "scheduled", never stale, with the wake time', async () => {
      // Real shape: RUN_CREATED then an unresolved sleep EFFECT_REQUESTED whose
      // label carries `sleep:<ISO>` (wc26 nightly-finalize). recordedAt is very
      // old so, absent the scheduled guard, it WOULD be flagged stale.
      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.endsWith('run.json')) return JSON.stringify({ processId: 'nightly-finalize' });
        if (p.includes('000001')) {
          return JSON.stringify(
            makeRunCreatedRaw('run-sleep', 'nightly-finalize', '2024-01-15T10:00:00Z'),
          );
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw(
              'sleep-1',
              'sleep',
              'sleep:2024-01-15T11:00:00.000Z',
              '2024-01-15T10:00:01Z',
            ),
          );
        }
        if (p.includes(path.join('tasks', 'sleep-1', 'task.json'))) {
          return JSON.stringify({ title: 'sleep', kind: 'sleep' });
        }
        throw new Error('ENOENT');
      });
      mockAccess.mockImplementation(async (p: any) => {
        if (p.toString().includes('journal')) return undefined;
        throw new Error('ENOENT');
      });
      mockReaddir.mockImplementation(async (dir: any) => {
        const d = typeof dir === 'string' ? dir : dir.toString();
        if (d.includes('journal')) return ['000001.A.json', '000002.B.json'] as any;
        return [];
      });

      const run = await parseRunDir('/runs/run-sleep');

      expect(run.status).toBe('waiting');
      expect(run.driver).toBe('scheduled');
      expect(run.isStale).toBeFalsy();
      expect(run.sleepWakeAt).toBe('2024-01-15T11:00:00.000Z');
    });

    it('computes duration from created to completed event', async () => {
      setupCompleteRun();

      const run = await parseRunDir('/runs/run-123');

      // 2024-01-15T10:00:00Z to 2024-01-15T10:00:06Z = 6000ms
      expect(run.duration).toBe(6000);
    });

    it('sets status to failed when RUN_FAILED event exists', async () => {
      mockAccess.mockImplementation(async (p: any) => {
        if (p.toString().includes('journal')) return undefined;
        throw new Error('ENOENT');
      });

      mockReaddir.mockImplementation(async (dir: any) => {
        if (dir.toString().includes('journal')) {
          return ['000001.A.json', '000002.B.json', '000003.C.json'] as any;
        }
        return [];
      });

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.endsWith('run.json')) return JSON.stringify({});
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('run-f', 'proc', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-f', 'node', 'fail-step', '2024-01-15T10:00:01Z'),
          );
        }
        if (p.includes('000003')) {
          return JSON.stringify(makeRunFailedRaw('2024-01-15T10:00:05Z'));
        }
        throw new Error('ENOENT');
      });

      const run = await parseRunDir('/runs/run-fail');

      expect(run.status).toBe('failed');
    });

    it('sets status to waiting when there are requested tasks and no completion event', async () => {
      mockAccess.mockImplementation(async (p: any) => {
        if (p.toString().includes('journal')) return undefined;
        throw new Error('ENOENT');
      });

      mockReaddir.mockImplementation(async (dir: any) => {
        if (dir.toString().includes('journal')) {
          return ['000001.A.json', '000002.B.json'] as any;
        }
        return [];
      });

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.endsWith('run.json')) return JSON.stringify({});
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('run-w', 'proc', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-w', 'agent', 'waiting-step', '2024-01-15T10:00:01Z'),
          );
        }
        throw new Error('ENOENT');
      });

      const run = await parseRunDir('/runs/run-waiting');

      expect(run.status).toBe('waiting');
    });

    it('sets status to pending when no events exist', async () => {
      // No journal access
      mockAccess.mockRejectedValue(new Error('ENOENT'));
      mockReadFile.mockImplementation(async (filePath: any) => {
        if (filePath.toString().endsWith('run.json')) return JSON.stringify({});
        throw new Error('ENOENT');
      });
      mockReaddir.mockResolvedValue([] as any);

      const run = await parseRunDir('/runs/run-empty');

      expect(run.status).toBe('pending');
      expect(run.tasks).toHaveLength(0);
    });

    it('extracts failedStep from first error task', async () => {
      mockAccess.mockImplementation(async (p: any) => {
        if (p.toString().includes('journal')) return undefined;
        throw new Error('ENOENT');
      });

      mockReaddir.mockImplementation(async (dir: any) => {
        if (dir.toString().includes('journal')) {
          return [
            '000001.A.json',
            '000002.B.json',
            '000003.C.json',
            '000004.D.json',
          ] as any;
        }
        return [];
      });

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.endsWith('run.json')) return JSON.stringify({});
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('run-err', 'proc', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-err', 'shell', 'deploy-step', '2024-01-15T10:00:01Z'),
          );
        }
        if (p.includes('000003')) {
          return JSON.stringify(
            makeEffectResolvedRaw('eff-err', 'error', '2024-01-15T10:00:03Z', {
              error: { name: 'Error', message: 'deploy failed', stack: '' },
            }),
          );
        }
        if (p.includes('000004')) {
          return JSON.stringify(makeRunFailedRaw('2024-01-15T10:00:04Z'));
        }
        throw new Error('ENOENT');
      });

      const run = await parseRunDir('/runs/run-err');

      expect(run.failedStep).toBeDefined();
      expect(run.failedTasks).toBe(1);
    });

    it('extracts breakpointQuestion from pending breakpoint task', async () => {
      mockAccess.mockImplementation(async (p: any) => {
        if (p.toString().includes('journal')) return undefined;
        throw new Error('ENOENT');
      });

      mockReaddir.mockImplementation(async (dir: any) => {
        if (dir.toString().includes('journal')) {
          return ['000001.A.json', '000002.B.json'] as any;
        }
        return [];
      });

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.endsWith('run.json')) return JSON.stringify({});
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('run-bp', 'proc', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-bp', 'breakpoint', 'approval', '2024-01-15T10:00:01Z'),
          );
        }
        if (p.includes(path.join('tasks', 'eff-bp', 'task.json'))) {
          return JSON.stringify({
            kind: 'breakpoint',
            inputs: { question: 'Proceed with deployment?' },
          });
        }
        throw new Error('ENOENT');
      });

      const run = await parseRunDir('/runs/run-bp');

      expect(run.status).toBe('waiting');
      expect(run.breakpointQuestion).toBe('Proceed with deployment?');
      // The unresolved breakpoint (no result.json) is counted as pending, so the
      // flat "needs you" list can align with the badge/banner.
      expect(run.pendingBreakpoints).toBe(1);
    });

    it('falls back to path.basename for runId when no RUN_CREATED event', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));
      mockReadFile.mockImplementation(async (filePath: any) => {
        if (filePath.toString().endsWith('run.json')) return JSON.stringify({});
        throw new Error('ENOENT');
      });
      mockReaddir.mockResolvedValue([] as any);

      const run = await parseRunDir('/runs/my-run-id');

      expect(run.runId).toBe('my-run-id');
    });

    it('computes task duration from startedAt and finishedAt', async () => {
      mockAccess.mockImplementation(async (p: any) => {
        if (p.toString().includes('journal')) return undefined;
        throw new Error('ENOENT');
      });

      mockReaddir.mockImplementation(async (dir: any) => {
        if (dir.toString().includes('journal')) {
          return ['000001.A.json', '000002.B.json', '000003.C.json'] as any;
        }
        return [];
      });

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.endsWith('run.json')) return JSON.stringify({});
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('r', 'p', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-t', 'node', 'step', '2024-01-15T10:00:01Z'),
          );
        }
        if (p.includes('000003')) {
          return JSON.stringify(
            makeEffectResolvedRaw('eff-t', 'ok', '2024-01-15T10:00:05Z', {
              startedAt: '2024-01-15T10:00:01Z',
              finishedAt: '2024-01-15T10:00:05Z',
            }),
          );
        }
        throw new Error('ENOENT');
      });

      const run = await parseRunDir('/runs/r');

      expect(run.tasks[0].duration).toBe(4000);
    });

    it('stores error details on failed tasks', async () => {
      mockAccess.mockImplementation(async (p: any) => {
        if (p.toString().includes('journal')) return undefined;
        throw new Error('ENOENT');
      });

      mockReaddir.mockImplementation(async (dir: any) => {
        if (dir.toString().includes('journal')) {
          return ['000001.A.json', '000002.B.json', '000003.C.json'] as any;
        }
        return [];
      });

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.endsWith('run.json')) return JSON.stringify({});
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('r', 'p', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-e', 'shell', 'cmd', '2024-01-15T10:00:01Z'),
          );
        }
        if (p.includes('000003')) {
          return JSON.stringify(
            makeEffectResolvedRaw('eff-e', 'error', '2024-01-15T10:00:03Z', {
              error: {
                name: 'ExecError',
                message: 'command not found',
                stack: 'at line 1',
              },
            }),
          );
        }
        throw new Error('ENOENT');
      });

      const run = await parseRunDir('/runs/r');

      expect(run.tasks[0].status).toBe('error');
      expect(run.tasks[0].error).toEqual({
        name: 'ExecError',
        message: 'command not found',
        stack: 'at line 1',
      });
    });

    it('extracts agent info from task.json', async () => {
      mockAccess.mockImplementation(async (p: any) => {
        if (p.toString().includes('journal')) return undefined;
        throw new Error('ENOENT');
      });

      mockReaddir.mockImplementation(async (dir: any) => {
        if (dir.toString().includes('journal')) {
          return ['000001.A.json', '000002.B.json'] as any;
        }
        return [];
      });

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.endsWith('run.json')) return JSON.stringify({});
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('r', 'p', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-agent', 'agent', 'ai-step', '2024-01-15T10:00:01Z'),
          );
        }
        if (p.includes(path.join('tasks', 'eff-agent', 'task.json'))) {
          return JSON.stringify({
            title: 'AI Analysis',
            kind: 'agent',
            agent: {
              name: 'analyst',
              prompt: { role: 'analyzer', task: 'analyze data', instructions: ['be thorough'] },
            },
          });
        }
        throw new Error('ENOENT');
      });

      const run = await parseRunDir('/runs/r');

      expect(run.tasks[0].title).toBe('AI Analysis');
      expect(run.tasks[0].agent).toEqual({
        name: 'analyst',
        prompt: { role: 'analyzer', task: 'analyze data', instructions: ['be thorough'] },
      });
    });
  });

  // -----------------------------------------------------------------------
  // UX-R3 wave 3 — in-progress liveness derivation (journal-activity freshness)
  // Root cause: 0 of 308 real run dirs carry a run.lock, so getDriverLiveness is
  // always "none" and every non-terminal run classifies as Orphaned (WORKING is
  // structurally 0). parseRunDir/getRunDigest now promote a non-terminal run with
  // FRESH journal activity (no lock) to driver "live" so it lands in Working.
  // -----------------------------------------------------------------------
  describe('in-progress liveness (UX-R3 wave 3)', () => {
    // Wire a lock-less waiting run whose newest journal event is `msAgo` old.
    function setupWaitingRun(msAgo: number) {
      const requestedAt = new Date(Date.now() - msAgo).toISOString();
      mockAccess.mockImplementation(async (p: any) => {
        if (p.toString().includes('journal')) return undefined;
        throw new Error('ENOENT'); // no run.lock, no other files
      });
      mockReaddir.mockImplementation(async (dir: any) => {
        if (dir.toString().includes('journal')) {
          return ['000001.A.json', '000002.B.json'] as any;
        }
        return [];
      });
      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.endsWith('run.json')) return JSON.stringify({});
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('run-live', 'proc', requestedAt));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-live', 'agent', 'working-step', requestedAt),
          );
        }
        throw new Error('ENOENT'); // run.lock read → getDriverLiveness "none"
      });
    }

    it('parseRunDir promotes a lock-less run with FRESH activity to driver "live" (not stale)', async () => {
      setupWaitingRun(30_000); // 30s ago — well within the 1h stale window
      const run = await parseRunDir('/runs/run-live');
      expect(run.status).toBe('waiting');
      expect(run.isStale).toBeUndefined();
      expect(run.driver).toBe('live');
    });

    it('parseRunDir keeps a lock-less run with STALE activity as driver "none" (reads as Stalled)', async () => {
      setupWaitingRun(2 * 3_600_000); // 2h ago — past the stale window
      const run = await parseRunDir('/runs/run-stale');
      expect(run.status).toBe('waiting');
      expect(run.isStale).toBe(true);
      expect(run.driver).toBe('none');
    });

    it('getRunDigest mirrors the derivation: fresh → "live", stale → "none"', async () => {
      setupWaitingRun(30_000);
      const freshDigest = await getRunDigest('/runs/run-live');
      expect(freshDigest.status).toBe('waiting');
      expect(freshDigest.driver).toBe('live');

      setupWaitingRun(2 * 3_600_000);
      const staleDigest = await getRunDigest('/runs/run-stale');
      expect(staleDigest.isStale).toBe(true);
      expect(staleDigest.driver).toBe('none');
    });
  });

  // -----------------------------------------------------------------------
  // parseTaskDetail
  // -----------------------------------------------------------------------
  describe('parseTaskDetail', () => {
    it('returns null when task directory does not exist', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const detail = await parseTaskDetail('/run', 'nonexistent-effect');

      expect(detail).toBeNull();
    });

    it('parses a complete task detail with all fields', async () => {
      mockAccess.mockImplementation(async (_p: any) => {
        // task dir exists, journal dir exists
        return undefined;
      });

      mockReaddir.mockImplementation(async (dir: any) => {
        if (dir.toString().includes('journal')) {
          return ['000001.A.json', '000002.B.json', '000003.C.json'] as any;
        }
        return [];
      });

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.includes(path.join('tasks', 'eff-1', 'task.json'))) {
          return JSON.stringify({
            title: 'Fetch Data',
            kind: 'node',
            invocationKey: 'inv-1',
            stepId: 'step-1',
            taskId: 'task-1',
          });
        }
        if (p.includes(path.join('tasks', 'eff-1', 'input.json'))) {
          return JSON.stringify({ url: 'https://api.example.com' });
        }
        if (p.includes(path.join('tasks', 'eff-1', 'result.json'))) {
          return JSON.stringify({
            output: { data: [1, 2, 3] },
            status: 'ok',
            startedAt: '2024-01-15T10:00:01Z',
            finishedAt: '2024-01-15T10:00:04Z',
          });
        }
        if (p.includes(path.join('tasks', 'eff-1', 'stdout.log'))) {
          return 'Fetching data...\nDone.';
        }
        if (p.includes(path.join('tasks', 'eff-1', 'stderr.log'))) {
          return '';
        }
        // Journal files
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('run-1', 'proc', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-1', 'node', 'Fetch Data', '2024-01-15T10:00:01Z'),
          );
        }
        if (p.includes('000003')) {
          return JSON.stringify(
            makeEffectResolvedRaw('eff-1', 'ok', '2024-01-15T10:00:05Z'),
          );
        }
        throw new Error('ENOENT');
      });

      const detail = await parseTaskDetail('/run', 'eff-1');

      expect(detail).not.toBeNull();
      expect(detail!.effectId).toBe('eff-1');
      expect(detail!.kind).toBe('node');
      expect(detail!.title).toBe('Fetch Data');
      expect(detail!.status).toBe('resolved');
      expect(detail!.input).toEqual({ url: 'https://api.example.com' });
      expect(detail!.result).toBeDefined();
      expect(detail!.stdout).toBe('Fetching data...\nDone.');
      expect(detail!.stderr).toBe('');
      // duration from result startedAt/finishedAt: 3000ms
      expect(detail!.duration).toBe(3000);
    });

    it('sets status to error when result has error status', async () => {
      mockAccess.mockResolvedValue(undefined);

      mockReaddir.mockImplementation(async (dir: any) => {
        if (dir.toString().includes('journal')) {
          return ['000001.A.json', '000002.B.json', '000003.C.json'] as any;
        }
        return [];
      });

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.includes('task.json')) {
          return JSON.stringify({ title: 'Fail Task', kind: 'shell' });
        }
        if (p.includes('input.json')) throw new Error('ENOENT');
        if (p.includes('result.json')) {
          return JSON.stringify({ status: 'error', error: 'timeout' });
        }
        if (p.includes('stdout.log')) throw new Error('ENOENT');
        if (p.includes('stderr.log')) throw new Error('ENOENT');
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('r', 'p', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-err', 'shell', 'cmd', '2024-01-15T10:00:01Z'),
          );
        }
        if (p.includes('000003')) {
          return JSON.stringify(
            makeEffectResolvedRaw('eff-err', 'error', '2024-01-15T10:00:03Z'),
          );
        }
        throw new Error('ENOENT');
      });

      const detail = await parseTaskDetail('/run', 'eff-err');

      expect(detail).not.toBeNull();
      expect(detail!.status).toBe('error');
    });

    it('sets status to requested when no resolved event exists', async () => {
      mockAccess.mockResolvedValue(undefined);

      mockReaddir.mockImplementation(async (dir: any) => {
        if (dir.toString().includes('journal')) {
          return ['000001.A.json', '000002.B.json'] as any;
        }
        return [];
      });

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.includes('task.json')) {
          return JSON.stringify({ title: 'Pending Task', kind: 'agent' });
        }
        if (p.includes('input.json')) throw new Error('ENOENT');
        if (p.includes('result.json')) throw new Error('ENOENT');
        if (p.includes('stdout.log')) throw new Error('ENOENT');
        if (p.includes('stderr.log')) throw new Error('ENOENT');
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('r', 'p', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-pending', 'agent', 'analysis', '2024-01-15T10:00:01Z'),
          );
        }
        throw new Error('ENOENT');
      });

      const detail = await parseTaskDetail('/run', 'eff-pending');

      expect(detail).not.toBeNull();
      expect(detail!.status).toBe('requested');
    });

    it('extracts breakpoint payload for breakpoint tasks', async () => {
      mockAccess.mockResolvedValue(undefined);

      mockReaddir.mockImplementation(async (dir: any) => {
        if (dir.toString().includes('journal')) {
          return ['000001.A.json', '000002.B.json'] as any;
        }
        return [];
      });

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.includes('task.json')) {
          return JSON.stringify({
            title: 'Approval Gate',
            kind: 'breakpoint',
            inputs: {
              question: 'Deploy to production?',
              title: 'Deploy Approval',
              context: { files: [{ path: 'deploy.yaml', format: 'yaml' }] },
            },
          });
        }
        if (p.includes('input.json')) throw new Error('ENOENT');
        if (p.includes('result.json')) throw new Error('ENOENT');
        if (p.includes('stdout.log')) throw new Error('ENOENT');
        if (p.includes('stderr.log')) throw new Error('ENOENT');
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('r', 'p', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-bp', 'breakpoint', 'approval', '2024-01-15T10:00:01Z'),
          );
        }
        throw new Error('ENOENT');
      });

      const detail = await parseTaskDetail('/run', 'eff-bp');

      expect(detail).not.toBeNull();
      expect(detail!.kind).toBe('breakpoint');
      expect(detail!.breakpoint).toBeDefined();
      expect(detail!.breakpoint!.question).toBe('Deploy to production?');
      expect(detail!.breakpoint!.title).toBe('Deploy Approval');
      expect(detail!.breakpointQuestion).toBe('Deploy to production?');
    });

    it('uses inputs from task.json when input.json does not exist', async () => {
      mockAccess.mockResolvedValue(undefined);

      mockReaddir.mockImplementation(async (dir: any) => {
        if (dir.toString().includes('journal')) {
          return ['000001.A.json'] as any;
        }
        return [];
      });

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.includes('task.json')) {
          return JSON.stringify({
            title: 'Task',
            kind: 'node',
            inputs: { key: 'value' },
          });
        }
        if (p.includes('input.json')) throw new Error('ENOENT');
        if (p.includes('result.json')) throw new Error('ENOENT');
        if (p.includes('stdout.log')) throw new Error('ENOENT');
        if (p.includes('stderr.log')) throw new Error('ENOENT');
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('r', 'p', '2024-01-15T10:00:00Z'));
        }
        throw new Error('ENOENT');
      });

      const detail = await parseTaskDetail('/run', 'eff-inp');

      expect(detail).not.toBeNull();
      expect(detail!.input).toEqual({ key: 'value' });
    });

    it('falls back to journal wall-clock for duration when result timestamps are equal', async () => {
      mockAccess.mockResolvedValue(undefined);

      mockReaddir.mockImplementation(async (dir: any) => {
        if (dir.toString().includes('journal')) {
          return ['000001.A.json', '000002.B.json', '000003.C.json'] as any;
        }
        return [];
      });

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.includes('task.json')) {
          return JSON.stringify({ title: 'Task', kind: 'node' });
        }
        if (p.includes('input.json')) throw new Error('ENOENT');
        if (p.includes('result.json')) {
          return JSON.stringify({
            status: 'ok',
            startedAt: '2024-01-15T10:00:02Z',
            finishedAt: '2024-01-15T10:00:02Z', // same time
          });
        }
        if (p.includes('stdout.log')) throw new Error('ENOENT');
        if (p.includes('stderr.log')) throw new Error('ENOENT');
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('r', 'p', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-dur', 'node', 'step', '2024-01-15T10:00:01Z'),
          );
        }
        if (p.includes('000003')) {
          return JSON.stringify(
            makeEffectResolvedRaw('eff-dur', 'ok', '2024-01-15T10:00:05Z'),
          );
        }
        throw new Error('ENOENT');
      });

      const detail = await parseTaskDetail('/run', 'eff-dur');

      expect(detail).not.toBeNull();
      // Since startedAt == finishedAt (0ms), it should fall back to journal timestamps
      // requestedAt: 10:00:01, resolvedAt: 10:00:05 => 4000ms
      expect(detail!.duration).toBe(4000);
    });
  });

  // -----------------------------------------------------------------------
  // getRunDigest
  // -----------------------------------------------------------------------
  describe('getRunDigest', () => {
    it('returns default digest when journal does not exist', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const digest = await getRunDigest('/runs/empty-run');

      expect(digest.runId).toBe('empty-run');
      expect(digest.latestSeq).toBe(0);
      expect(digest.status).toBe('pending');
      expect(digest.taskCount).toBe(0);
      expect(digest.completedTasks).toBe(0);
    });

    it('returns accurate counts for a completed run', async () => {
      mockAccess.mockResolvedValue(undefined);

      mockReaddir.mockResolvedValue([
        '000001.A.json',
        '000002.B.json',
        '000003.C.json',
        '000004.D.json',
      ] as any);

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('r', 'p', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-1', 'node', 'step1', '2024-01-15T10:00:01Z'),
          );
        }
        if (p.includes('000003')) {
          return JSON.stringify(
            makeEffectResolvedRaw('eff-1', 'ok', '2024-01-15T10:00:03Z'),
          );
        }
        if (p.includes('000004')) {
          return JSON.stringify(makeRunCompletedRaw('2024-01-15T10:00:05Z'));
        }
        throw new Error('ENOENT');
      });

      const digest = await getRunDigest('/runs/run-complete');

      expect(digest.runId).toBe('run-complete');
      expect(digest.latestSeq).toBe(4);
      expect(digest.status).toBe('completed');
      expect(digest.taskCount).toBe(1);
      expect(digest.completedTasks).toBe(1);
      expect(digest.updatedAt).toBe('2024-01-15T10:00:05Z');
    });

    it('sets status to waiting when tasks exist but run is not completed', async () => {
      mockAccess.mockResolvedValue(undefined);

      mockReaddir.mockResolvedValue([
        '000001.A.json',
        '000002.B.json',
      ] as any);

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('r', 'p', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-1', 'agent', 'step1', '2024-01-15T10:00:01Z'),
          );
        }
        throw new Error('ENOENT');
      });

      const digest = await getRunDigest('/runs/run-wait');

      expect(digest.status).toBe('waiting');
      expect(digest.taskCount).toBe(1);
      expect(digest.completedTasks).toBe(0);
    });

    it('counts pending breakpoints correctly', async () => {
      mockAccess.mockResolvedValue(undefined);

      mockReaddir.mockImplementation(async (dir: any) => {
        const d = dir.toString();
        if (d.includes('journal')) {
          return [
            '000001.A.json',
            '000002.B.json',
            '000003.C.json',
          ] as any;
        }
        return [];
      });

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('r', 'p', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-bp1', 'breakpoint', 'approval', '2024-01-15T10:00:01Z'),
          );
        }
        if (p.includes('000003')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-bp2', 'breakpoint', 'review', '2024-01-15T10:00:02Z'),
          );
        }
        // task.json for breakpoint question
        if (p.includes(path.join('tasks', 'eff-bp1', 'task.json'))) {
          return JSON.stringify({
            kind: 'breakpoint',
            inputs: { question: 'Approve deployment?' },
          });
        }
        if (p.includes(path.join('tasks', 'eff-bp2', 'task.json'))) {
          return JSON.stringify({
            kind: 'breakpoint',
            inputs: { question: 'Review changes?' },
          });
        }
        throw new Error('ENOENT');
      });

      const digest = await getRunDigest('/runs/run-bp');

      expect(digest.pendingBreakpoints).toBe(2);
      expect(digest.breakpointQuestion).toBeDefined();
    });

    it('does not count resolved breakpoints as pending', async () => {
      mockAccess.mockResolvedValue(undefined);

      mockReaddir.mockResolvedValue([
        '000001.A.json',
        '000002.B.json',
        '000003.C.json',
      ] as any);

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('r', 'p', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-bp', 'breakpoint', 'approval', '2024-01-15T10:00:01Z'),
          );
        }
        if (p.includes('000003')) {
          return JSON.stringify(
            makeEffectResolvedRaw('eff-bp', 'ok', '2024-01-15T10:00:03Z'),
          );
        }
        throw new Error('ENOENT');
      });

      const digest = await getRunDigest('/runs/run-bp-resolved');

      expect(digest.pendingBreakpoints).toBe(0);
    });

    it('sets status to failed when RUN_FAILED event exists', async () => {
      mockAccess.mockResolvedValue(undefined);

      mockReaddir.mockResolvedValue([
        '000001.A.json',
        '000002.B.json',
      ] as any);

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('r', 'p', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(makeRunFailedRaw('2024-01-15T10:00:05Z'));
        }
        throw new Error('ENOENT');
      });

      const digest = await getRunDigest('/runs/run-failed');

      expect(digest.status).toBe('failed');
    });
  });

  // -----------------------------------------------------------------------
  // getRunIds
  // -----------------------------------------------------------------------
  describe('getRunIds', () => {
    it('returns empty array when directory does not exist', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const ids = await getRunIds('/nonexistent');

      expect(ids).toEqual([]);
    });

    it('returns directory names sorted in reverse order', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue([
        { name: 'run-001', isDirectory: () => true },
        { name: 'run-003', isDirectory: () => true },
        { name: 'run-002', isDirectory: () => true },
        { name: 'status.json', isDirectory: () => false },
      ] as any);

      const ids = await getRunIds('/runs');

      expect(ids).toEqual(['run-003', 'run-002', 'run-001']);
    });

    it('filters out non-directory entries', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue([
        { name: 'run-001', isDirectory: () => true },
        { name: 'readme.md', isDirectory: () => false },
        { name: '.gitkeep', isDirectory: () => false },
      ] as any);

      const ids = await getRunIds('/runs');

      expect(ids).toEqual(['run-001']);
    });
  });

  // -----------------------------------------------------------------------
  // parseJournalDirIncremental
  // -----------------------------------------------------------------------
  describe('parseJournalDirIncremental', () => {
    it('returns all events and fileCount on first call (no previous state)', async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue([
        '000001.ULID1.json',
        '000002.ULID2.json',
      ] as any);

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.includes('000001')) {
          return JSON.stringify(
            makeRunCreatedRaw('run-1', 'process-1', '2024-01-15T10:00:00Z'),
          );
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-1', 'node', 'step', '2024-01-15T10:00:01Z'),
          );
        }
        return '{}';
      });

      const result = await parseJournalDirIncremental('/run/journal');

      expect(result.events).toHaveLength(2);
      expect(result.fileCount).toBe(2);
      expect(result.events[0].type).toBe('RUN_CREATED');
      expect(result.events[1].type).toBe('EFFECT_REQUESTED');
    });

    it('incrementally reads only new files when previous state is provided', async () => {
      mockAccess.mockResolvedValue(undefined);

      // Simulate: 3 files now exist, but 2 were already parsed
      mockReaddir.mockResolvedValue([
        '000001.ULID1.json',
        '000002.ULID2.json',
        '000003.ULID3.json',
      ] as any);

      const readFileCalls: string[] = [];
      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        readFileCalls.push(p);
        if (p.includes('000003')) {
          return JSON.stringify(
            makeRunCompletedRaw('2024-01-15T10:00:05Z'),
          );
        }
        // These should NOT be called during incremental reads
        if (p.includes('000001')) {
          return JSON.stringify(
            makeRunCreatedRaw('run-1', 'proc', '2024-01-15T10:00:00Z'),
          );
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-1', 'node', 'step', '2024-01-15T10:00:01Z'),
          );
        }
        return '{}';
      });

      const previousEvents: JournalEvent[] = [
        { seq: 1, id: 'ULID1', ts: '2024-01-15T10:00:00Z', type: 'RUN_CREATED', payload: { runId: 'run-1' } },
        { seq: 2, id: 'ULID2', ts: '2024-01-15T10:00:01Z', type: 'EFFECT_REQUESTED', payload: { effectId: 'eff-1' } },
      ];

      const result = await parseJournalDirIncremental('/run/journal', previousEvents, 2);

      // Should have all 3 events merged
      expect(result.events).toHaveLength(3);
      expect(result.fileCount).toBe(3);
      expect(result.events[2].type).toBe('RUN_COMPLETED');

      // Only file 000003 should have been read (not 000001 or 000002)
      const journalReads = readFileCalls.filter(
        (p) => p.includes('000001') || p.includes('000002'),
      );
      expect(journalReads).toHaveLength(0);
    });

    it('resets and re-reads from beginning when journal is truncated (fewer files than offset)', async () => {
      mockAccess.mockResolvedValue(undefined);

      // Simulate: journal was truncated — only 1 file exists now, but we had 3
      mockReaddir.mockResolvedValue([
        '000001.NEW1.json',
      ] as any);

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.includes('000001')) {
          return JSON.stringify(
            makeRunCreatedRaw('run-new', 'proc', '2024-02-01T12:00:00Z'),
          );
        }
        return '{}';
      });

      const previousEvents: JournalEvent[] = [
        { seq: 1, id: 'OLD1', ts: '2024-01-15T10:00:00Z', type: 'RUN_CREATED', payload: {} },
        { seq: 2, id: 'OLD2', ts: '2024-01-15T10:00:01Z', type: 'EFFECT_REQUESTED', payload: {} },
        { seq: 3, id: 'OLD3', ts: '2024-01-15T10:00:02Z', type: 'RUN_COMPLETED', payload: {} },
      ];

      const result = await parseJournalDirIncremental('/run/journal', previousEvents, 3);

      // Should have done a full re-read — only 1 event from the new file
      expect(result.events).toHaveLength(1);
      expect(result.fileCount).toBe(1);
      expect(result.events[0].payload).toEqual({ runId: 'run-new', processId: 'proc' });
    });

    it('returns previous events unchanged when no new files are appended (empty append)', async () => {
      mockAccess.mockResolvedValue(undefined);

      // Same number of files as before
      mockReaddir.mockResolvedValue([
        '000001.ULID1.json',
        '000002.ULID2.json',
      ] as any);

      // readFile should NOT be called at all for incremental empty-append case
      const readFileCalls: string[] = [];
      mockReadFile.mockImplementation(async (filePath: any) => {
        readFileCalls.push(filePath.toString());
        return '{}';
      });

      const previousEvents: JournalEvent[] = [
        { seq: 1, id: 'ULID1', ts: '2024-01-15T10:00:00Z', type: 'RUN_CREATED', payload: {} },
        { seq: 2, id: 'ULID2', ts: '2024-01-15T10:00:01Z', type: 'EFFECT_REQUESTED', payload: {} },
      ];

      const result = await parseJournalDirIncremental('/run/journal', previousEvents, 2);

      expect(result.events).toHaveLength(2);
      expect(result.fileCount).toBe(2);
      // The events should be the exact same references
      expect(result.events).toBe(previousEvents);
      // No files should have been read
      expect(readFileCalls).toHaveLength(0);
    });

    it('handles concurrent incremental reads producing consistent results', async () => {
      mockAccess.mockResolvedValue(undefined);

      mockReaddir.mockResolvedValue([
        '000001.ULID1.json',
        '000002.ULID2.json',
        '000003.ULID3.json',
      ] as any);

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.includes('000003')) {
          return JSON.stringify(
            makeEffectResolvedRaw('eff-1', 'ok', '2024-01-15T10:00:05Z'),
          );
        }
        if (p.includes('000001')) {
          return JSON.stringify(
            makeRunCreatedRaw('run-1', 'proc', '2024-01-15T10:00:00Z'),
          );
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw('eff-1', 'node', 'step', '2024-01-15T10:00:01Z'),
          );
        }
        return '{}';
      });

      const previousEvents: JournalEvent[] = [
        { seq: 1, id: 'ULID1', ts: '2024-01-15T10:00:00Z', type: 'RUN_CREATED', payload: { runId: 'run-1' } },
        { seq: 2, id: 'ULID2', ts: '2024-01-15T10:00:01Z', type: 'EFFECT_REQUESTED', payload: { effectId: 'eff-1' } },
      ];

      // Launch two concurrent incremental reads with the same state
      const [result1, result2] = await Promise.all([
        parseJournalDirIncremental('/run/journal', previousEvents, 2),
        parseJournalDirIncremental('/run/journal', previousEvents, 2),
      ]);

      // Both should produce identical results
      expect(result1.events).toHaveLength(3);
      expect(result2.events).toHaveLength(3);
      expect(result1.fileCount).toBe(3);
      expect(result2.fileCount).toBe(3);

      // Both should have the same event types in the same order
      expect(result1.events.map((e) => e.type)).toEqual(result2.events.map((e) => e.type));

      // Neither should have corrupted the original previousEvents array
      expect(previousEvents).toHaveLength(2);
    });

    it('returns empty events and fileCount=0 when journal directory does not exist', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const result = await parseJournalDirIncremental('/nonexistent/journal');

      expect(result.events).toEqual([]);
      expect(result.fileCount).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // UX-R2 §13.1 — breakpoint question from task.json metadata.payload
  // (AC-30, AC-31, AC-32). Evidence run: demo-client-project/
  // 01KWE8RYQEHJ7BATR3V88AQVSD — v6 ctx.breakpoint writes the question/title/
  // context ONLY into task.json → metadata.payload.* (mirrored under
  // inputs.payload); inputs carries NO direct question/title keys and no
  // input.json exists on disk.
  // -----------------------------------------------------------------------
  describe('breakpoint metadata.payload extraction (UX-R2 §13.1)', () => {
    // Multi-line question, asserted verbatim (AC-30) — same shape as the
    // evidence payload ("COORDINATION GATE — …" with embedded newlines).
    const EVIDENCE_QUESTION =
      'COORDINATION GATE — confirm the table partition + reconcile decisions BEFORE writing code.\n\n' +
      'Dana already pushed: 1655ec3 surgical-writehole (deployed); d9f2231 lockdown (abandoned, excluded)\n\n' +
      'Approve this partition + reconcile plan? (Confirm the boundary is agreed with Dana.)';

    // AC-32 honest last-resort copy — frozen verbatim here on purpose (the
    // test must not import the constant it is meant to pin down).
    const HONEST_FALLBACK =
      // owner 2026-07-08: de-AI copy (no em-dashes) + answer-flow clarity
      'Approval required: this breakpoint has no question text on disk.';

    // metadata.payload keys byte-replicate the evidence run:
    // [context, expert, question, tags, title].
    const EVIDENCE_PAYLOAD = {
      context: {
        fresh: {
          collision: false,
          note: 'depp-dev unchanged since rebase; no new Dana pushes into scope',
        },
      },
      expert: 'owner',
      question: EVIDENCE_QUESTION,
      tags: ['approval-gate', 'destructive-git'],
      title: 'Gate 1 — Coordinate partition with Dana',
    };

    /** task.json exactly as the v6 SDK writes it for ctx.breakpoint. */
    function makeEvidenceTaskJson(effectId: string) {
      return {
        kind: 'breakpoint',
        metadata: {
          label: 'breakpoint',
          payload: EVIDENCE_PAYLOAD,
          requestedAt: '2026-07-01T11:45:43.573Z',
        },
        title: 'breakpoint',
        schemaVersion: '2026.01.tasks-v1',
        effectId,
        taskId: '__sdk.breakpoint',
        invocationKey: `proc:S000008:__sdk.breakpoint`,
        stepId: 'S000008',
        // NO question/title directly under inputs — only the mirrored payload.
        inputs: { label: 'breakpoint', payload: EVIDENCE_PAYLOAD },
      };
    }

    /** Wire up a run with one pending breakpoint whose task.json is `taskJson`.
     *  `inputJson` (optional) is served as tasks/<effectId>/input.json. */
    function setupBreakpointRun(
      effectId: string,
      taskJson: Record<string, unknown>,
      inputJson?: Record<string, unknown>,
    ) {
      mockAccess.mockImplementation(async (p: any) => {
        const s = p.toString();
        if (s.includes('journal') || s.includes(path.join('tasks', effectId))) return undefined;
        throw new Error('ENOENT');
      });

      mockReaddir.mockImplementation(async (dir: any) => {
        if (dir.toString().includes('journal')) {
          return ['000001.A.json', '000002.B.json'] as any;
        }
        return [];
      });

      mockReadFile.mockImplementation(async (filePath: any) => {
        const p = filePath.toString();
        if (p.endsWith('run.json')) return JSON.stringify({});
        if (p.includes('000001')) {
          return JSON.stringify(makeRunCreatedRaw('run-uxr2', 'proc', '2024-01-15T10:00:00Z'));
        }
        if (p.includes('000002')) {
          return JSON.stringify(
            makeEffectRequestedRaw(effectId, 'breakpoint', 'breakpoint', '2024-01-15T10:00:01Z'),
          );
        }
        if (p.includes(path.join('tasks', effectId, 'task.json'))) {
          return JSON.stringify(taskJson);
        }
        if (inputJson && p.includes(path.join('tasks', effectId, 'input.json'))) {
          return JSON.stringify(inputJson);
        }
        throw new Error('ENOENT');
      });
    }

    // ---------------------------------------------------------------------
    // AC-30 — evidence shape resolves the payload question at ALL THREE
    // extraction sites (multi-line preserved, asserted verbatim).
    // ---------------------------------------------------------------------
    it('AC-30: parseRunDir reads the breakpoint question from metadata.payload (evidence shape)', async () => {
      setupBreakpointRun('eff-uxr2', makeEvidenceTaskJson('eff-uxr2'));

      const run = await parseRunDir('/runs/run-uxr2');

      expect(run.status).toBe('waiting');
      expect(run.breakpointQuestion).toBe(EVIDENCE_QUESTION);
      expect(run.tasks[0].breakpointQuestion).toBe(EVIDENCE_QUESTION);
    });

    it('AC-30: parseTaskDetail reads question/title from metadata.payload (evidence shape)', async () => {
      setupBreakpointRun('eff-uxr2', makeEvidenceTaskJson('eff-uxr2'));

      const detail = await parseTaskDetail('/runs/run-uxr2', 'eff-uxr2');

      expect(detail).not.toBeNull();
      expect(detail!.breakpoint).toBeDefined();
      expect(detail!.breakpoint!.question).toBe(EVIDENCE_QUESTION);
      expect(detail!.breakpoint!.title).toBe('Gate 1 — Coordinate partition with Dana');
      expect(detail!.breakpointQuestion).toBe(EVIDENCE_QUESTION);
      // A real on-disk question is flagged with its source (AC-32 flag).
      expect(detail!.breakpoint!.questionSource).toBe('metadataPayload');
    });

    it('AC-30: getRunDigest reads the breakpoint question from metadata.payload (evidence shape)', async () => {
      setupBreakpointRun('eff-uxr2', makeEvidenceTaskJson('eff-uxr2'));

      const digest = await getRunDigest('/runs/run-uxr2');

      expect(digest.status).toBe('waiting');
      expect(digest.breakpointQuestion).toBe(EVIDENCE_QUESTION);
      expect(digest.breakpointEffectId).toBe('eff-uxr2');
    });

    // ---------------------------------------------------------------------
    // AC-31 — precedence per field: input.json > taskDef.inputs >
    // metadata.payload; fields resolve independently.
    // ---------------------------------------------------------------------
    it('AC-31: input.json wins over taskDef.inputs and metadata.payload for every field', async () => {
      const taskJson = {
        ...makeEvidenceTaskJson('eff-prec'),
        inputs: {
          question: 'inputs question?',
          title: 'inputs title',
          options: ['inputs-opt'],
          context: { files: [{ path: 'inputs.md', format: 'markdown' }] },
        },
      };
      setupBreakpointRun('eff-prec', taskJson, {
        question: 'input.json question?',
        title: 'input.json title',
        options: ['input-json-opt'],
        context: { files: [{ path: 'input-json.md', format: 'markdown' }] },
      });

      const detail = await parseTaskDetail('/runs/run-uxr2', 'eff-prec');

      expect(detail!.breakpoint!.question).toBe('input.json question?');
      expect(detail!.breakpoint!.title).toBe('input.json title');
      expect(detail!.breakpoint!.options).toEqual(['input-json-opt']);
      expect(detail!.breakpoint!.context).toEqual({
        files: [{ path: 'input-json.md', format: 'markdown' }],
      });
    });

    it('AC-31: taskDef.inputs wins over metadata.payload when input.json is absent', async () => {
      const taskJson = {
        ...makeEvidenceTaskJson('eff-prec2'),
        inputs: {
          question: 'inputs question?',
          title: 'inputs title',
          options: ['inputs-opt'],
        },
      };
      setupBreakpointRun('eff-prec2', taskJson);

      const detail = await parseTaskDetail('/runs/run-uxr2', 'eff-prec2');

      expect(detail!.breakpoint!.question).toBe('inputs question?');
      expect(detail!.breakpoint!.title).toBe('inputs title');
      expect(detail!.breakpoint!.options).toEqual(['inputs-opt']);
      // context exists ONLY in metadata.payload — fields resolve independently.
      expect(detail!.breakpoint!.context).toEqual(EVIDENCE_PAYLOAD.context);
    });

    it('AC-31: fields resolve independently (title from payload may accompany a question from inputs)', async () => {
      const taskJson = {
        ...makeEvidenceTaskJson('eff-mix'),
        inputs: { question: 'inputs question?' }, // no title/options/context here
      };
      setupBreakpointRun('eff-mix', taskJson);

      const detail = await parseTaskDetail('/runs/run-uxr2', 'eff-mix');

      expect(detail!.breakpoint!.question).toBe('inputs question?');
      expect(detail!.breakpoint!.title).toBe('Gate 1 — Coordinate partition with Dana');
    });

    it('AC-31: input.json question wins at the parseRunDir and getRunDigest sites too', async () => {
      setupBreakpointRun('eff-prec3', makeEvidenceTaskJson('eff-prec3'), {
        question: 'input.json question?',
      });

      const run = await parseRunDir('/runs/run-uxr2');
      expect(run.breakpointQuestion).toBe('input.json question?');

      const digest = await getRunDigest('/runs/run-uxr2');
      expect(digest.breakpointQuestion).toBe('input.json question?');
    });

    // ---------------------------------------------------------------------
    // AC-32 — honest last resort: no question anywhere.
    // ---------------------------------------------------------------------
    it('AC-32: with no question in any source the resolved question is the honest fallback, flagged', async () => {
      const questionless = {
        kind: 'breakpoint',
        metadata: { label: 'breakpoint' }, // no payload
        title: 'breakpoint',
        schemaVersion: '2026.01.tasks-v1',
        effectId: 'eff-noq',
        taskId: '__sdk.breakpoint',
        invocationKey: 'proc:S000009:__sdk.breakpoint',
        stepId: 'S000009',
        inputs: { label: 'breakpoint' }, // no question/title
      };
      setupBreakpointRun('eff-noq', questionless);

      const detail = await parseTaskDetail('/runs/run-uxr2', 'eff-noq');

      expect(detail!.breakpoint).toBeDefined();
      expect(detail!.breakpoint!.question).toBe(HONEST_FALLBACK);
      expect(detail!.breakpoint!.questionSource).toBe('fallback');
      // Run-level extraction stays honest too: no fabricated question.
      const run = await parseRunDir('/runs/run-uxr2');
      expect(run.breakpointQuestion).toBeUndefined();
      const digest = await getRunDigest('/runs/run-uxr2');
      expect(digest.breakpointQuestion).toBeUndefined();
      // The pending breakpoint is still surfaced as answerable.
      expect(digest.breakpointEffectId).toBe('eff-noq');
      expect(digest.pendingBreakpoints).toBe(1);
    });
  });
});
