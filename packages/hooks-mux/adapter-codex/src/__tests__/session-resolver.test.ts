import { describe, it, expect } from 'vitest';
import { resolveSessionId, isValidSessionId } from '../session-resolver';

describe('resolveSessionId', () => {
  it('returns AGENT_SESSION_ID from env with highest priority', () => {
    const result = resolveSessionId(
      { session_id: 'from-payload' },
      { AGENT_SESSION_ID: 'from-env', CODEX_THREAD_ID: 'from-codex-thread' },
    );
    expect(result).toBe('from-env');
  });

  it('returns native session_id from payload if no env override', () => {
    const result = resolveSessionId(
      { session_id: 'native-id' },
      {},
    );
    expect(result).toBe('native-id');
  });

  it('falls back to CODEX_THREAD_ID env var', () => {
    const result = resolveSessionId(
      {},
      { CODEX_THREAD_ID: 'codex-thread-id' },
    );
    expect(result).toBe('codex-thread-id');
  });

  it('returns null when no session ID is available', () => {
    expect(resolveSessionId({}, {})).toBeNull();
  });

  it('ignores empty string AGENT_SESSION_ID', () => {
    const result = resolveSessionId(
      { session_id: 'payload-id' },
      { AGENT_SESSION_ID: '' },
    );
    expect(result).toBe('payload-id');
  });

  it('ignores non-string session_id in payload', () => {
    const result = resolveSessionId({ session_id: 42 }, {});
    expect(result).toBeNull();
  });

  it('uses default empty env when not provided', () => {
    const result = resolveSessionId({ session_id: 'id-from-payload' });
    expect(result).toBe('id-from-payload');
  });
});

describe('isValidSessionId', () => {
  it('accepts normal UUID-like strings', () => {
    expect(isValidSessionId('abc-123-def')).toBe(true);
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
