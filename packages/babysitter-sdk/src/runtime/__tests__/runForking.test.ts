import { describe, it, expect } from 'vitest';
import {
  prepareFork,
  describeFork,
  type RunForkMetadata,
  type ForkOptions,
} from '../runForking';

describe('runForking', () => {
  const sourceRun: RunForkMetadata = {
    runId: 'run-abc123',
    createdAt: '2026-01-01T00:00:00Z',
    effectIds: ['eff-1', 'eff-2', 'eff-3'],
    status: 'running',
  };

  // -------------------------------------------------------------------------
  // prepareFork
  // -------------------------------------------------------------------------

  describe('prepareFork', () => {
    it('forks at a specific effect ID', () => {
      const opts: ForkOptions = {
        sourceRunId: 'run-abc123',
        forkPoint: 'eff-2',
        label: 'my-branch',
      };
      const result = prepareFork(sourceRun, opts);
      expect(result.forkPoint).toBe('eff-2');
      expect(result.branchLabel).toBe('my-branch');
      expect(result.parentRunId).toBe('run-abc123');
      expect(result.forkedRunId).toContain('run-abc123-fork-');
    });

    it('forks at latest effect', () => {
      const opts: ForkOptions = { sourceRunId: 'run-abc123', forkPoint: 'latest' };
      const result = prepareFork(sourceRun, opts);
      expect(result.forkPoint).toBe('eff-3');
    });

    it('throws on mismatched source run ID', () => {
      const opts: ForkOptions = { sourceRunId: 'wrong-id', forkPoint: 'latest' };
      expect(() => prepareFork(sourceRun, opts)).toThrow('Source run ID mismatch');
    });

    it('throws when fork point not found', () => {
      const opts: ForkOptions = { sourceRunId: 'run-abc123', forkPoint: 'eff-999' };
      expect(() => prepareFork(sourceRun, opts)).toThrow('not found in run');
    });

    it('throws on latest with no effects', () => {
      const empty: RunForkMetadata = { ...sourceRun, effectIds: [] };
      const opts: ForkOptions = { sourceRunId: 'run-abc123', forkPoint: 'latest' };
      expect(() => prepareFork(empty, opts)).toThrow('no effects recorded');
    });

    it('generates branch label when not provided', () => {
      const opts: ForkOptions = { sourceRunId: 'run-abc123', forkPoint: 'eff-1' };
      const result = prepareFork(sourceRun, opts);
      expect(result.branchLabel).toMatch(/^fork-run-abc1/);
    });
  });

  // -------------------------------------------------------------------------
  // describeFork
  // -------------------------------------------------------------------------

  describe('describeFork', () => {
    it('produces human-readable description', () => {
      const result = {
        forkedRunId: 'run-abc123-fork-001',
        forkPoint: 'eff-2',
        branchLabel: 'experiment',
        parentRunId: 'run-abc123',
      };
      const desc = describeFork(result);
      expect(desc).toContain('run-abc123');
      expect(desc).toContain('eff-2');
      expect(desc).toContain('experiment');
      expect(desc).toContain('run-abc123-fork-001');
    });
  });
});
