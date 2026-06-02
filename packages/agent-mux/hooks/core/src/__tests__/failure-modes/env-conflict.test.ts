import { describe, it, expect } from 'vitest';
import { mergeResults, MergeConflictError } from '../../merge-engine/merge';
import type { UnifiedHookResult } from '../../types/result';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function result(overrides: Partial<UnifiedHookResult> = {}): UnifiedHookResult {
  return { ...overrides };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('env-conflict failure modes', () => {
  describe('fail-on-conflict policy', () => {
    it('throws MergeConflictError when two handlers write same env key with different values', () => {
      expect(() =>
        mergeResults(
          [
            result({ persistEnv: { SHARED_KEY: 'value-from-handler-a' } }),
            result({ persistEnv: { SHARED_KEY: 'value-from-handler-b' } }),
          ],
          { conflictPolicy: 'fail-on-conflict' },
        ),
      ).toThrow(MergeConflictError);
    });

    it('includes key name in the error message', () => {
      try {
        mergeResults(
          [
            result({ persistEnv: { MY_TOKEN: 'abc' } }),
            result({ persistEnv: { MY_TOKEN: 'xyz' } }),
          ],
          { conflictPolicy: 'fail-on-conflict' },
        );
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(MergeConflictError);
        expect((err as MergeConflictError).message).toContain('MY_TOKEN');
      }
    });

    it('throws MergeConflictError for contextVars conflict', () => {
      expect(() =>
        mergeResults(
          [
            result({ contextVars: { mode: 'dev' } }),
            result({ contextVars: { mode: 'prod' } }),
          ],
          { conflictPolicy: 'fail-on-conflict' },
        ),
      ).toThrow(MergeConflictError);
    });

    it('does not throw when values are identical', () => {
      const merged = mergeResults(
        [
          result({ persistEnv: { KEY: 'same-value' } }),
          result({ persistEnv: { KEY: 'same-value' } }),
        ],
        { conflictPolicy: 'fail-on-conflict' },
      );
      expect(merged.persistEnv.KEY).toBe('same-value');
    });

    it('does not throw for non-overlapping keys', () => {
      const merged = mergeResults(
        [
          result({ persistEnv: { KEY_A: 'a' } }),
          result({ persistEnv: { KEY_B: 'b' } }),
        ],
        { conflictPolicy: 'fail-on-conflict' },
      );
      expect(merged.persistEnv).toEqual({ KEY_A: 'a', KEY_B: 'b' });
    });
  });

  describe('last-writer-wins policy (default)', () => {
    it('keeps the last writer value for conflicting env keys', () => {
      const merged = mergeResults([
        result({ persistEnv: { SHARED_KEY: 'first' } }),
        result({ persistEnv: { SHARED_KEY: 'second' } }),
      ]);
      expect(merged.persistEnv.SHARED_KEY).toBe('second');
    });

    it('records the conflict in diagnostics', () => {
      const merged = mergeResults([
        result({ persistEnv: { SHARED_KEY: 'first' } }),
        result({ persistEnv: { SHARED_KEY: 'second' } }),
      ]);
      expect(merged.diagnostics.conflicts).toHaveLength(1);
      expect(merged.diagnostics.conflicts[0].field).toBe('persistEnv.SHARED_KEY');
      expect(merged.diagnostics.conflicts[0].resolution).toBe('last-writer-wins');
      expect(merged.diagnostics.conflicts[0].existingValue).toBe('first');
      expect(merged.diagnostics.conflicts[0].incomingValue).toBe('second');
    });

    it('last writer wins for contextVars too', () => {
      const merged = mergeResults([
        result({ contextVars: { mode: 'dev' } }),
        result({ contextVars: { mode: 'prod' } }),
      ]);
      expect(merged.contextVars.mode).toBe('prod');
    });

    it('handles three-way conflict: last writer wins', () => {
      const merged = mergeResults([
        result({ persistEnv: { KEY: 'alpha' } }),
        result({ persistEnv: { KEY: 'beta' } }),
        result({ persistEnv: { KEY: 'gamma' } }),
      ]);
      expect(merged.persistEnv.KEY).toBe('gamma');
    });
  });

  describe('protected-prefixes policy', () => {
    it('protects AGENT_ prefixed keys from being overwritten', () => {
      const merged = mergeResults(
        [
          result({ persistEnv: { AGENT_SECRET: 'original' } }),
          result({ persistEnv: { AGENT_SECRET: 'attacker-value' } }),
        ],
        { conflictPolicy: 'protected-prefixes' },
      );
      expect(merged.persistEnv.AGENT_SECRET).toBe('original');
    });

    it('records protected resolution in diagnostics', () => {
      const merged = mergeResults(
        [
          result({ persistEnv: { AGENT_TOKEN: 'original' } }),
          result({ persistEnv: { AGENT_TOKEN: 'new-value' } }),
        ],
        { conflictPolicy: 'protected-prefixes' },
      );
      expect(merged.diagnostics.conflicts[0].resolution).toBe('protected');
    });

    it('allows overwriting non-protected keys under protected-prefixes policy', () => {
      const merged = mergeResults(
        [
          result({ persistEnv: { MY_KEY: 'old' } }),
          result({ persistEnv: { MY_KEY: 'new' } }),
        ],
        { conflictPolicy: 'protected-prefixes' },
      );
      expect(merged.persistEnv.MY_KEY).toBe('new');
    });
  });

  describe('toolMutation conflict with two replace modes', () => {
    it('throws MergeConflictError when two handlers both return toolMutation with mode=replace', () => {
      expect(() =>
        mergeResults([
          result({ toolMutation: { mode: 'replace', value: { a: 1 } } }),
          result({ toolMutation: { mode: 'replace', value: { b: 2 } } }),
        ]),
      ).toThrow(MergeConflictError);
    });

    it('error message mentions replace mode specifically', () => {
      try {
        mergeResults([
          result({ toolMutation: { mode: 'replace', value: 'x' } }),
          result({ toolMutation: { mode: 'replace', value: 'y' } }),
        ]);
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(MergeConflictError);
        expect((err as MergeConflictError).message).toContain('replace');
      }
    });

    it('throws for replace+patch combination too', () => {
      expect(() =>
        mergeResults([
          result({ toolMutation: { mode: 'replace', value: 'x' } }),
          result({ toolMutation: { mode: 'patch', value: 'y' } }),
        ]),
      ).toThrow(MergeConflictError);
    });
  });
});
