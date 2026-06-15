import { describe, it, expect } from 'vitest';
import { resolveSessionId, isValidSessionId } from '../session-resolver';

describe('resolveSessionId', () => {
  it('returns AGENT_SESSION_ID from env with highest priority', () => {
    const result = resolveSessionId(
      {},
      { AGENT_SESSION_ID: 'from-agent-env', HERMES_SESSION: 'from-hermes', HERMES_RUN_ID: 'from-run' },
    );
    expect(result).toBe('from-agent-env');
  });

  it('returns HERMES_SESSION when no AGENT_SESSION_ID', () => {
    const result = resolveSessionId(
      {},
      { HERMES_SESSION: 'hermes-session-id' },
    );
    expect(result).toBe('hermes-session-id');
  });

  it('falls back to HERMES_RUN_ID', () => {
    const result = resolveSessionId(
      {},
      { HERMES_RUN_ID: 'hermes-run-id' },
    );
    expect(result).toBe('hermes-run-id');
  });

  it('returns null when no session ID is available', () => {
    expect(resolveSessionId({}, {})).toBeNull();
  });

  it('ignores empty string AGENT_SESSION_ID', () => {
    const result = resolveSessionId(
      {},
      { AGENT_SESSION_ID: '', HERMES_SESSION: 'fallback' },
    );
    expect(result).toBe('fallback');
  });

  it('ignores empty string HERMES_SESSION', () => {
    const result = resolveSessionId(
      {},
      { HERMES_SESSION: '', HERMES_RUN_ID: 'run-fallback' },
    );
    expect(result).toBe('run-fallback');
  });

  it('ignores empty string HERMES_RUN_ID', () => {
    const result = resolveSessionId(
      {},
      { HERMES_RUN_ID: '' },
    );
    expect(result).toBeNull();
  });

  it('ignores stdin payload (session is env-driven for Hermes)', () => {
    const result = resolveSessionId(
      { session_id: 'from-payload' },
      { HERMES_SESSION: 'from-env' },
    );
    expect(result).toBe('from-env');
  });

  it('uses default empty env when not provided', () => {
    const result = resolveSessionId({});
    expect(result).toBeNull();
  });
});

describe('isValidSessionId', () => {
  it('accepts normal opaque strings', () => {
    expect(isValidSessionId('hermes-abc-123-def')).toBe(true);
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
