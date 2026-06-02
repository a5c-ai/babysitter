import { describe, it, expect } from 'vitest';
import { resolveSessionId, deriveSessionId, isValidSessionId } from '../session-resolver';

describe('resolveSessionId', () => {
  it('returns AGENT_SESSION_ID from env with highest priority', () => {
    const result = resolveSessionId(
      { cwd: '/project' },
      { AGENT_SESSION_ID: 'from-env', CURSOR_SESSION_ID: 'from-cursor-env' },
    );
    expect(result.sessionId).toBe('from-env');
    expect(result.source).toBe('explicit_env');
    expect(result.isDerived).toBe(false);
  });

  it('returns CURSOR_SESSION_ID from env if no explicit override', () => {
    const result = resolveSessionId(
      { cwd: '/project' },
      { CURSOR_SESSION_ID: 'cursor-env-id' },
    );
    expect(result.sessionId).toBe('cursor-env-id');
    expect(result.source).toBe('cursor_env');
    expect(result.isDerived).toBe(false);
  });

  it('derives session ID from workspace when no env vars set', () => {
    const result = resolveSessionId(
      { workspace: '/home/user/project' },
      {},
    );
    expect(result.sessionId).toMatch(/^cursor-[0-9a-f]{16}$/);
    expect(result.source).toBe('derived');
    expect(result.isDerived).toBe(true);
  });

  it('derives session ID from cwd when no workspace available', () => {
    const result = resolveSessionId(
      { cwd: '/home/user/project' },
      {},
    );
    expect(result.sessionId).toMatch(/^cursor-[0-9a-f]{16}$/);
    expect(result.source).toBe('derived');
    expect(result.isDerived).toBe(true);
  });

  it('falls back to PWD env when no stdin cwd', () => {
    const result = resolveSessionId(
      {},
      { PWD: '/home/user/project' },
    );
    expect(result.sessionId).toMatch(/^cursor-[0-9a-f]{16}$/);
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

  it('ignores non-string workspace in payload', () => {
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

  it('prefixes with cursor-', () => {
    const id = deriveSessionId('/any/path');
    expect(id).toMatch(/^cursor-/);
  });

  it('produces a 23-character string (cursor- + 16 hex chars)', () => {
    const id = deriveSessionId('/any/path');
    expect(id).toHaveLength(23);
  });
});

describe('isValidSessionId', () => {
  it('accepts normal strings', () => {
    expect(isValidSessionId('cursor-abc123def456')).toBe(true);
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
