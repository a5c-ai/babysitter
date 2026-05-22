import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveSessionId, deriveSessionId } from '../session-resolver';

describe('resolveSessionId', () => {
  it('prefers AGENT_SESSION_ID', () => {
    const id = resolveSessionId({}, {
      AGENT_SESSION_ID: 'explicit-123',
      GEMINI_SESSION_ID: 'gemini-456',
    });
    expect(id).toBe('explicit-123');
  });

  it('uses HOOKS_PROXY_SESSION_ID as second priority', () => {
    const id = resolveSessionId({}, {
      HOOKS_PROXY_SESSION_ID: 'proxy-789',
      GEMINI_SESSION_ID: 'gemini-456',
    });
    expect(id).toBe('proxy-789');
  });

  it('uses GEMINI_SESSION_ID when no explicit override', () => {
    const id = resolveSessionId({}, {
      GEMINI_SESSION_ID: 'gemini-456',
    });
    expect(id).toBe('gemini-456');
  });

  it('derives from cwd in stdin when no session env vars', () => {
    const id = resolveSessionId({ cwd: '/home/user/project' }, {});
    expect(id).toBeDefined();
    expect(id!.startsWith('gemini-derived-')).toBe(true);
  });

  it('derives from PWD env when no session env vars and no cwd in stdin', () => {
    const id = resolveSessionId({}, { PWD: '/home/user/project' });
    expect(id).toBeDefined();
    expect(id!.startsWith('gemini-derived-')).toBe(true);
  });

  it('returns null when no session signals available', () => {
    const id = resolveSessionId({}, {});
    expect(id).toBeNull();
  });
});

describe('deriveSessionId', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('produces a deterministic ID for same cwd within same time bucket', () => {
    const id1 = deriveSessionId('/home/user/project');
    const id2 = deriveSessionId('/home/user/project');
    expect(id1).toBe(id2);
  });

  it('produces different IDs for different cwds', () => {
    const id1 = deriveSessionId('/home/user/project-a');
    const id2 = deriveSessionId('/home/user/project-b');
    expect(id1).not.toBe(id2);
  });

  it('has gemini-derived- prefix', () => {
    const id = deriveSessionId('/tmp/test');
    expect(id).toMatch(/^gemini-derived-[0-9a-f]{16}$/);
  });

  it('produces different IDs across time buckets', () => {
    // Mock Date.now to get different time buckets (15 min apart)
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const id1 = deriveSessionId('/project');

    vi.spyOn(Date, 'now').mockReturnValue(now + 16 * 60 * 1000);
    const id2 = deriveSessionId('/project');

    expect(id1).not.toBe(id2);
  });
});
