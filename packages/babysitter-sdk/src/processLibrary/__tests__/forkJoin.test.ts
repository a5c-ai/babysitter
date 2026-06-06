import { describe, it, expect } from 'vitest';
import {
  createForkSpec,
  mergeBranchResults,
  type ForkBranch,
  type BranchResult,
} from '../forkJoin';

describe('forkJoin', () => {
  const branches: ForkBranch[] = [
    { id: 'a', processId: 'process-alpha', inputs: { key: 'val' } },
    { id: 'b', processId: 'process-beta' },
  ];

  // -------------------------------------------------------------------------
  // createForkSpec
  // -------------------------------------------------------------------------

  describe('createForkSpec', () => {
    it('creates a valid fork spec', () => {
      const spec = createForkSpec(branches, 'all');
      expect(spec.branches).toHaveLength(2);
      expect(spec.joinStrategy).toBe('all');
    });

    it('throws on empty branches', () => {
      expect(() => createForkSpec([], 'all')).toThrow('at least one branch');
    });

    it('throws on duplicate branch IDs', () => {
      const dupes: ForkBranch[] = [
        { id: 'x', processId: 'p1' },
        { id: 'x', processId: 'p2' },
      ];
      expect(() => createForkSpec(dupes, 'all')).toThrow('Duplicate branch id');
    });

    it('throws on empty branch id', () => {
      const bad: ForkBranch[] = [{ id: '', processId: 'p1' }];
      expect(() => createForkSpec(bad, 'all')).toThrow('non-empty id');
    });
  });

  // -------------------------------------------------------------------------
  // mergeBranchResults
  // -------------------------------------------------------------------------

  describe('mergeBranchResults', () => {
    it('merges all-fulfilled results with "all" strategy', () => {
      const results = new Map<string, BranchResult>([
        ['a', { status: 'fulfilled', value: 42 }],
        ['b', { status: 'fulfilled', value: 'done' }],
      ]);
      const joined = mergeBranchResults(results, 'all');
      expect(joined.strategy).toBe('all');
      expect(joined.branchResults.size).toBe(2);
      expect(joined.joinedAt).toBeTruthy();
    });

    it('throws on rejected branch with "all" strategy', () => {
      const results = new Map<string, BranchResult>([
        ['a', { status: 'fulfilled', value: 1 }],
        ['b', { status: 'rejected', reason: 'timeout' }],
      ]);
      expect(() => mergeBranchResults(results, 'all')).toThrow('timeout');
    });

    it('returns first fulfilled for "race" strategy', () => {
      const results = new Map<string, BranchResult>([
        ['a', { status: 'fulfilled', value: 'fast' }],
        ['b', { status: 'fulfilled', value: 'slow' }],
      ]);
      const joined = mergeBranchResults(results, 'race');
      expect(joined.branchResults.size).toBe(1);
      expect(joined.branchResults.get('a')?.value).toBe('fast');
    });

    it('returns all rejected when no fulfilled in "race" strategy', () => {
      const results = new Map<string, BranchResult>([
        ['a', { status: 'rejected', reason: 'err1' }],
        ['b', { status: 'rejected', reason: 'err2' }],
      ]);
      const joined = mergeBranchResults(results, 'race');
      expect(joined.branchResults.size).toBe(2);
    });

    it('returns all results for "allSettled" strategy', () => {
      const results = new Map<string, BranchResult>([
        ['a', { status: 'fulfilled', value: 'ok' }],
        ['b', { status: 'rejected', reason: 'nope' }],
      ]);
      const joined = mergeBranchResults(results, 'allSettled');
      expect(joined.branchResults.size).toBe(2);
      expect(joined.branchResults.get('b')?.status).toBe('rejected');
    });
  });
});
