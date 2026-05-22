import { describe, it, expect } from 'vitest';
import { mergeResults, MergeConflictError } from '../merge';
import type { UnifiedHookResult } from '../../types/result';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal result with optional overrides using typed fields. */
function result(overrides: Partial<UnifiedHookResult> = {}): UnifiedHookResult {
  return { ...overrides };
}

// ---------------------------------------------------------------------------
// Empty / single passthrough
// ---------------------------------------------------------------------------

describe('mergeResults', () => {
  it('returns defaults for an empty results array', () => {
    const merged = mergeResults([]);
    expect(merged.decision).toBe('noop');
    expect(merged.reason).toBe('');
    expect(merged.persistEnv).toEqual({});
    expect(merged.unsetEnv).toEqual([]);
    expect(merged.contextVars).toEqual({});
    expect(merged.additionalContext).toBe('');
    expect(merged.systemMessage).toBe('');
    expect(merged.toolMutation).toBeUndefined();
    expect(merged.continueSession).toBe(true);
    expect(merged.stopReason).toBe('');
    expect(merged.metadata).toEqual({});
    expect(merged.diagnostics.handlerCount).toBe(0);
  });

  it('passes through a single result unchanged', () => {
    const single = result({
      decision: 'allow',
      reason: 'ok',
      persistEnv: { FOO: 'bar' },
      unsetEnv: ['OLD'],
      contextVars: { ctx: 'val' },
      additionalContext: 'extra',
      systemMessage: 'sys',
      continueSession: true,
      stopReason: 'done',
      metadata: { key: 1 },
    });

    const merged = mergeResults([single]);
    expect(merged.decision).toBe('allow');
    expect(merged.reason).toBe('ok');
    expect(merged.persistEnv).toEqual({ FOO: 'bar' });
    expect(merged.unsetEnv).toEqual(['OLD']);
    expect(merged.contextVars).toEqual({ ctx: 'val' });
    expect(merged.additionalContext).toBe('extra');
    expect(merged.systemMessage).toBe('sys');
    expect(merged.continueSession).toBe(true);
    expect(merged.stopReason).toBe('done');
    expect(merged.metadata).toEqual({ key: 1 });
    expect(merged.diagnostics.handlerCount).toBe(1);
  });

  // -----------------------------------------------------------------------
  // persistEnv: key-wise merge, last-writer-wins (default)
  // -----------------------------------------------------------------------

  describe('persistEnv merge', () => {
    it('merges non-overlapping keys', () => {
      const merged = mergeResults([
        result({ persistEnv: { A: '1' } }),
        result({ persistEnv: { B: '2' } }),
      ]);
      expect(merged.persistEnv).toEqual({ A: '1', B: '2' });
    });

    it('last writer wins for overlapping keys by default', () => {
      const merged = mergeResults([
        result({ persistEnv: { A: '1' } }),
        result({ persistEnv: { A: '2' } }),
      ]);
      expect(merged.persistEnv).toEqual({ A: '2' });
      expect(merged.diagnostics.conflicts.length).toBe(1);
      expect(merged.diagnostics.conflicts[0].resolution).toBe('last-writer-wins');
    });
  });

  // -----------------------------------------------------------------------
  // unsetEnv: union
  // -----------------------------------------------------------------------

  describe('unsetEnv merge', () => {
    it('unions all arrays, deduplicating', () => {
      const merged = mergeResults([
        result({ unsetEnv: ['A', 'B'] }),
        result({ unsetEnv: ['B', 'C'] }),
      ]);
      expect(merged.unsetEnv.sort()).toEqual(['A', 'B', 'C']);
    });
  });

  // -----------------------------------------------------------------------
  // contextVars: key-wise merge
  // -----------------------------------------------------------------------

  describe('contextVars merge', () => {
    it('merges non-overlapping keys', () => {
      const merged = mergeResults([
        result({ contextVars: { x: '1' } }),
        result({ contextVars: { y: '2' } }),
      ]);
      expect(merged.contextVars).toEqual({ x: '1', y: '2' });
    });

    it('last writer wins for overlapping context vars', () => {
      const merged = mergeResults([
        result({ contextVars: { x: '1' } }),
        result({ contextVars: { x: '9' } }),
      ]);
      expect(merged.contextVars).toEqual({ x: '9' });
    });
  });

  // -----------------------------------------------------------------------
  // additionalContext: concatenate with delimiters
  // -----------------------------------------------------------------------

  describe('additionalContext concatenation', () => {
    it('concatenates with \\n---\\n delimiters', () => {
      const merged = mergeResults([
        result({ additionalContext: 'first' }),
        result({ additionalContext: 'second' }),
        result({ additionalContext: 'third' }),
      ]);
      expect(merged.additionalContext).toBe('first\n---\nsecond\n---\nthird');
    });

    it('skips empty additional context', () => {
      const merged = mergeResults([
        result({ additionalContext: 'only' }),
        result({}),
      ]);
      expect(merged.additionalContext).toBe('only');
    });
  });

  // -----------------------------------------------------------------------
  // systemMessage: concatenate (default) or keep-first
  // -----------------------------------------------------------------------

  describe('systemMessage merge', () => {
    it('concatenates by default', () => {
      const merged = mergeResults([
        result({ systemMessage: 'msg1' }),
        result({ systemMessage: 'msg2' }),
      ]);
      expect(merged.systemMessage).toBe('msg1\n---\nmsg2');
    });

    it('keeps first when strategy is keep-first', () => {
      const merged = mergeResults(
        [
          result({ systemMessage: 'first' }),
          result({ systemMessage: 'second' }),
        ],
        { systemMessageStrategy: 'keep-first' },
      );
      expect(merged.systemMessage).toBe('first');
    });
  });

  // -----------------------------------------------------------------------
  // decision: most restrictive wins
  // -----------------------------------------------------------------------

  describe('decision precedence', () => {
    it('deny > ask > allow > continue > noop', () => {
      const merged = mergeResults([
        result({ decision: 'allow' }),
        result({ decision: 'noop' }),
        result({ decision: 'ask' }),
        result({ decision: 'continue' }),
      ]);
      expect(merged.decision).toBe('ask');
    });

    it('deny wins over everything', () => {
      const merged = mergeResults([
        result({ decision: 'allow' }),
        result({ decision: 'deny' }),
      ]);
      expect(merged.decision).toBe('deny');
    });

    it('allow when explicitly set', () => {
      const merged = mergeResults([
        result({ decision: 'allow' }),
      ]);
      expect(merged.decision).toBe('allow');
    });

    it('noop when no decision provided', () => {
      const merged = mergeResults([result()]);
      expect(merged.decision).toBe('noop');
    });
  });

  // -----------------------------------------------------------------------
  // toolMutation: single mutating writer
  // -----------------------------------------------------------------------

  describe('toolMutation merge', () => {
    it('allows a single handler with mutation', () => {
      const merged = mergeResults([
        result({
          toolMutation: { mode: 'replace', value: { a: 1 } },
        }),
        result({}),
      ]);
      expect(merged.toolMutation).toEqual({ mode: 'replace', value: { a: 1 } });
    });

    it('throws MergeConflictError for multiple mutating writers', () => {
      expect(() =>
        mergeResults([
          result({
            toolMutation: { mode: 'replace', value: { a: 1 } },
          }),
          result({
            toolMutation: { mode: 'patch', value: { b: 2 } },
          }),
        ]),
      ).toThrow(MergeConflictError);
    });
  });

  // -----------------------------------------------------------------------
  // continueSession: false dominates
  // -----------------------------------------------------------------------

  describe('continueSession merge', () => {
    it('false dominates over true', () => {
      const merged = mergeResults([
        result({ continueSession: true }),
        result({ continueSession: false }),
        result({ continueSession: true }),
      ]);
      expect(merged.continueSession).toBe(false);
    });

    it('defaults to true when not specified', () => {
      const merged = mergeResults([result(), result()]);
      expect(merged.continueSession).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // stopReason: first non-empty if stopping
  // -----------------------------------------------------------------------

  describe('stopReason merge', () => {
    it('takes first non-empty when session is stopping', () => {
      const merged = mergeResults([
        result({ stopReason: 'reason-a', continueSession: false }),
        result({ stopReason: 'reason-b' }),
      ]);
      expect(merged.stopReason).toBe('reason-a');
    });

    it('concatenates when session continues', () => {
      const merged = mergeResults([
        result({ stopReason: 'a' }),
        result({ stopReason: 'b' }),
      ]);
      expect(merged.stopReason).toBe('a; b');
    });
  });

  // -----------------------------------------------------------------------
  // reason: concatenate
  // -----------------------------------------------------------------------

  describe('reason merge', () => {
    it('concatenates reasons', () => {
      const merged = mergeResults([
        result({ decision: 'allow', reason: 'fine' }),
        result({ decision: 'deny', reason: 'nope' }),
      ]);
      expect(merged.reason).toBe('fine; nope');
    });
  });

  // -----------------------------------------------------------------------
  // metadata: deep merge
  // -----------------------------------------------------------------------

  describe('metadata merge', () => {
    it('deep merges nested objects', () => {
      const merged = mergeResults([
        result({ metadata: { a: { x: 1 }, b: 2 } }),
        result({ metadata: { a: { y: 3 }, c: 4 } }),
      ]);
      expect(merged.metadata).toEqual({ a: { x: 1, y: 3 }, b: 2, c: 4 });
    });
  });

  // -----------------------------------------------------------------------
  // Conflict policies
  // -----------------------------------------------------------------------

  describe('conflict policy: protected-prefixes', () => {
    it('protects AGENT_ prefixed env keys', () => {
      const merged = mergeResults(
        [
          result({ persistEnv: { AGENT_TOKEN: 'original' } }),
          result({ persistEnv: { AGENT_TOKEN: 'overwrite' } }),
        ],
        { conflictPolicy: 'protected-prefixes' },
      );
      expect(merged.persistEnv.AGENT_TOKEN).toBe('original');
      expect(merged.diagnostics.conflicts[0].resolution).toBe('protected');
    });

    it('allows overwriting non-protected keys', () => {
      const merged = mergeResults(
        [
          result({ persistEnv: { MY_KEY: 'old' } }),
          result({ persistEnv: { MY_KEY: 'new' } }),
        ],
        { conflictPolicy: 'protected-prefixes' },
      );
      expect(merged.persistEnv.MY_KEY).toBe('new');
    });

    it('respects custom protected prefixes', () => {
      const merged = mergeResults(
        [
          result({ persistEnv: { CUSTOM_X: 'a' } }),
          result({ persistEnv: { CUSTOM_X: 'b' } }),
        ],
        { conflictPolicy: 'protected-prefixes', protectedPrefixes: ['CUSTOM_'] },
      );
      expect(merged.persistEnv.CUSTOM_X).toBe('a');
    });
  });

  describe('conflict policy: fail-on-conflict', () => {
    it('throws on env key conflict', () => {
      expect(() =>
        mergeResults(
          [
            result({ persistEnv: { KEY: 'a' } }),
            result({ persistEnv: { KEY: 'b' } }),
          ],
          { conflictPolicy: 'fail-on-conflict' },
        ),
      ).toThrow(MergeConflictError);
    });

    it('does not throw when values are identical', () => {
      const merged = mergeResults(
        [
          result({ persistEnv: { KEY: 'same' } }),
          result({ persistEnv: { KEY: 'same' } }),
        ],
        { conflictPolicy: 'fail-on-conflict' },
      );
      expect(merged.persistEnv.KEY).toBe('same');
    });

    it('throws on contextVars conflict', () => {
      expect(() =>
        mergeResults(
          [
            result({ contextVars: { V: 'a' } }),
            result({ contextVars: { V: 'b' } }),
          ],
          { conflictPolicy: 'fail-on-conflict' },
        ),
      ).toThrow(MergeConflictError);
    });
  });

  describe('conflict policy: namespace-required', () => {
    it('throws when env key lacks namespace prefix', () => {
      expect(() =>
        mergeResults(
          [result({ persistEnv: { NONS: 'val' } })],
          { conflictPolicy: 'namespace-required' },
        ),
      ).toThrow(MergeConflictError);
    });

    it('accepts properly namespaced keys', () => {
      const merged = mergeResults(
        [result({ persistEnv: { PLUGIN_X_KEY: 'val' } })],
        { conflictPolicy: 'namespace-required' },
      );
      expect(merged.persistEnv.PLUGIN_X_KEY).toBe('val');
    });
  });

  // -----------------------------------------------------------------------
  // Diagnostics
  // -----------------------------------------------------------------------

  describe('diagnostics', () => {
    it('tracks handler count and order', () => {
      const merged = mergeResults([result(), result(), result()]);
      expect(merged.diagnostics.handlerCount).toBe(3);
      expect(merged.diagnostics.handlerOrder).toEqual([0, 1, 2]);
    });

    it('records conflicts', () => {
      const merged = mergeResults([
        result({ persistEnv: { K: 'a' } }),
        result({ persistEnv: { K: 'b' } }),
      ]);
      expect(merged.diagnostics.conflicts).toHaveLength(1);
      expect(merged.diagnostics.conflicts[0].field).toBe('persistEnv.K');
    });

    it('has a mergedAt timestamp', () => {
      const merged = mergeResults([]);
      expect(merged.diagnostics.mergedAt).toBeDefined();
      // Should be a valid ISO string
      expect(() => new Date(merged.diagnostics.mergedAt)).not.toThrow();
    });

    it('initializes handler timings array', () => {
      const merged = mergeResults([result()]);
      expect(merged.diagnostics.handlerTimings).toBeDefined();
      expect(Array.isArray(merged.diagnostics.handlerTimings)).toBe(true);
    });

    it('initializes unsupported output fields array', () => {
      const merged = mergeResults([]);
      expect(merged.diagnostics.unsupportedOutputFields).toEqual([]);
    });

    it('initializes native rendering losses array', () => {
      const merged = mergeResults([]);
      expect(merged.diagnostics.nativeRenderingLosses).toEqual([]);
    });
  });
});
