import { describe, it, expect } from 'vitest';
import { resolveSessionId, deriveSessionId, isValidSessionId } from '../session-resolver';

describe('resolveSessionId', () => {
  it('returns AGENT_SESSION_ID from env with highest priority', () => {
    const result = resolveSessionId(
      { sessionId: 'native-id', cwd: '/project' },
      { AGENT_SESSION_ID: 'from-env', OMP_SESSION_ID: 'from-omp-env' },
    );
    expect(result.sessionId).toBe('from-env');
    expect(result.source).toBe('explicit_env');
    expect(result.isDerived).toBe(false);
  });

  it('returns native sessionId from context when no explicit env', () => {
    const result = resolveSessionId(
      { sessionId: 'pi-session-native', cwd: '/project' },
      {},
    );
    expect(result.sessionId).toBe('pi-session-native');
    expect(result.source).toBe('native');
    expect(result.isDerived).toBe(false);
  });

  it('returns OMP_SESSION_ID from env when no native session ID', () => {
    const result = resolveSessionId(
      { cwd: '/project' },
      { OMP_SESSION_ID: 'omp-env-id' },
    );
    expect(result.sessionId).toBe('omp-env-id');
    expect(result.source).toBe('harness_env');
    expect(result.isDerived).toBe(false);
  });

  it('derives session ID from workspace when no session IDs available', () => {
    const result = resolveSessionId(
      { workspace: '/home/user/project' },
      {},
    );
    expect(result.sessionId).toMatch(/^omp-[0-9a-f]{16}$/);
    expect(result.source).toBe('derived');
    expect(result.isDerived).toBe(true);
  });

  it('derives session ID from cwd when no workspace available', () => {
    const result = resolveSessionId(
      { cwd: '/home/user/project' },
      {},
    );
    expect(result.sessionId).toMatch(/^omp-[0-9a-f]{16}$/);
    expect(result.source).toBe('derived');
    expect(result.isDerived).toBe(true);
  });

  it('falls back to PWD env when no context cwd', () => {
    const result = resolveSessionId(
      {},
      { PWD: '/home/user/project' },
    );
    expect(result.sessionId).toMatch(/^omp-[0-9a-f]{16}$/);
    expect(result.source).toBe('derived');
  });

  it('returns null when no derivation source is available', () => {
    const result = resolveSessionId({}, {});
    expect(result.sessionId).toBeNull();
    expect(result.source).toBe('none');
    expect(result.isDerived).toBe(false);
  });

  it('ignores empty string AGENT_SESSION_ID', () => {
    const result = resolveSessionId(
      { workspace: '/project' },
      { AGENT_SESSION_ID: '' },
    );
    expect(result.source).toBe('derived');
  });

  it('ignores empty string native sessionId', () => {
    const result = resolveSessionId(
      { sessionId: '', workspace: '/project' },
      {},
    );
    expect(result.source).toBe('derived');
  });

  it('ignores non-string sessionId in context', () => {
    const result = resolveSessionId({ sessionId: 42, workspace: '/project' }, {});
    expect(result.source).toBe('derived');
  });

  it('ignores non-string workspace in context', () => {
    const result = resolveSessionId({ workspace: 42 }, {});
    expect(result.sessionId).toBeNull();
  });

  it('prefers workspace over cwd for derivation', () => {
    const wsResult = resolveSessionId(
      { workspace: '/ws', cwd: '/cwd' },
      {},
    );
    const wsOnlyResult = resolveSessionId(
      { workspace: '/ws' },
      {},
    );
    expect(wsResult.sessionId).toBe(wsOnlyResult.sessionId);
  });

  it('prefers native session ID over harness env var', () => {
    const result = resolveSessionId(
      { sessionId: 'native-session' },
      { OMP_SESSION_ID: 'env-session' },
    );
    expect(result.sessionId).toBe('native-session');
    expect(result.source).toBe('native');
  });
});

describe('deriveSessionId', () => {
  it('produces a stable hash for the same path', () => {
    const id1 = deriveSessionId('/home/user/project');
    const id2 = deriveSessionId('/home/user/project');
    expect(id1).toBe(id2);
  });

  it('produces different hashes for different paths', () => {
    const id1 = deriveSessionId('/home/user/project-a');
    const id2 = deriveSessionId('/home/user/project-b');
    expect(id1).not.toBe(id2);
  });

  it('prefixes with omp-', () => {
    const id = deriveSessionId('/any/path');
    expect(id).toMatch(/^omp-/);
  });

  it('produces a 20-character string (omp- + 16 hex chars)', () => {
    const id = deriveSessionId('/any/path');
    expect(id).toHaveLength(20);
  });
});

describe('isValidSessionId', () => {
  it('accepts normal strings', () => {
    expect(isValidSessionId('omp-abc123def456')).toBe(true);
  });

  it('accepts native Pi session IDs', () => {
    expect(isValidSessionId('pi-session-abc123')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidSessionId('')).toBe(false);
  });

  it('rejects strings over 256 chars', () => {
    expect(isValidSessionId('x'.repeat(257))).toBe(false);
  });

  it('accepts strings up to 256 chars', () => {
    expect(isValidSessionId('x'.repeat(256))).toBe(true);
  });
});
