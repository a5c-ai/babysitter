import { describe, it, expect } from 'vitest';
import { mergeResults } from '../../merge-engine/merge';
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

describe('reserved-prefix security: protected-prefixes policy', () => {
  it('rejects handler overwriting AGENT_SESSION_ID in persistEnv when protected-prefixes is active', () => {
    // First handler sets the protected key, second tries to overwrite
    const merged = mergeResults(
      [
        result({ persistEnv: { AGENT_SESSION_ID: 'legitimate-session-id' } }),
        result({ persistEnv: { AGENT_SESSION_ID: 'malicious-session-id' } }),
      ],
      { conflictPolicy: 'protected-prefixes' },
    );

    // The original value should be preserved
    expect(merged.persistEnv.AGENT_SESSION_ID).toBe('legitimate-session-id');
  });

  it('records the protection in diagnostics', () => {
    const merged = mergeResults(
      [
        result({ persistEnv: { AGENT_SESSION_ID: 'original' } }),
        result({ persistEnv: { AGENT_SESSION_ID: 'attacker' } }),
      ],
      { conflictPolicy: 'protected-prefixes' },
    );

    expect(merged.diagnostics.conflicts).toHaveLength(1);
    expect(merged.diagnostics.conflicts[0].field).toBe('persistEnv.AGENT_SESSION_ID');
    expect(merged.diagnostics.conflicts[0].resolution).toBe('protected');
    expect(merged.diagnostics.conflicts[0].existingValue).toBe('original');
    expect(merged.diagnostics.conflicts[0].incomingValue).toBe('attacker');
  });

  it('protects all AGENT_ prefixed keys: AGENT_ADAPTER, AGENT_TOKEN, etc.', () => {
    const protectedKeys = ['AGENT_ADAPTER', 'AGENT_TOKEN', 'AGENT_WORKSPACE_ROOT', 'AGENT_TURN_ID'];

    for (const key of protectedKeys) {
      const merged = mergeResults(
        [
          result({ persistEnv: { [key]: 'original' } }),
          result({ persistEnv: { [key]: 'overwritten' } }),
        ],
        { conflictPolicy: 'protected-prefixes' },
      );
      expect(merged.persistEnv[key]).toBe('original');
    }
  });

  it('allows non-AGENT_ prefixed keys to be overwritten', () => {
    const merged = mergeResults(
      [
        result({ persistEnv: { MY_PLUGIN_KEY: 'old' } }),
        result({ persistEnv: { MY_PLUGIN_KEY: 'new' } }),
      ],
      { conflictPolicy: 'protected-prefixes' },
    );

    expect(merged.persistEnv.MY_PLUGIN_KEY).toBe('new');
  });

  it('allows setting AGENT_ key when no prior handler set it (no conflict)', () => {
    const merged = mergeResults(
      [
        result({ persistEnv: { SOME_OTHER_KEY: 'val' } }),
        result({ persistEnv: { AGENT_SESSION_ID: 'new-value' } }),
      ],
      { conflictPolicy: 'protected-prefixes' },
    );

    // No conflict -- only one handler wrote AGENT_SESSION_ID
    expect(merged.persistEnv.AGENT_SESSION_ID).toBe('new-value');
  });

  it('protects with custom prefixes', () => {
    const merged = mergeResults(
      [
        result({ persistEnv: { SECRET_TOKEN: 'real' } }),
        result({ persistEnv: { SECRET_TOKEN: 'fake' } }),
      ],
      { conflictPolicy: 'protected-prefixes', protectedPrefixes: ['SECRET_'] },
    );

    expect(merged.persistEnv.SECRET_TOKEN).toBe('real');
  });

  it('does not strip AGENT_ keys under default last-writer-wins policy (protection is policy-dependent)', () => {
    // Under default policy, AGENT_ keys are NOT protected
    const merged = mergeResults([
      result({ persistEnv: { AGENT_SESSION_ID: 'original' } }),
      result({ persistEnv: { AGENT_SESSION_ID: 'overwritten' } }),
    ]);

    // Last writer wins is the default
    expect(merged.persistEnv.AGENT_SESSION_ID).toBe('overwritten');
  });
});
