import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveSessionId, deriveSessionId } from '../session-resolver';

describe('resolveSessionId', () => {
  it('prefers AGENT_SESSION_ID', () => {
    const id = resolveSessionId(
      { sessionId: 'native-123' },
      {
        AGENT_SESSION_ID: 'explicit-123',
        OPENCODE_SESSION_ID: 'opencode-456',
      },
    );
    expect(id).toBe('explicit-123');
  });

  it('uses HOOKS_PROXY_SESSION_ID as second priority', () => {
    const id = resolveSessionId(
      { sessionId: 'native-123' },
      {
        HOOKS_PROXY_SESSION_ID: 'proxy-789',
        OPENCODE_SESSION_ID: 'opencode-456',
      },
    );
    expect(id).toBe('proxy-789');
  });

  it('uses native sessionId from event data as third priority', () => {
    const id = resolveSessionId(
      { sessionId: 'native-123' },
      { OPENCODE_SESSION_ID: 'opencode-456' },
    );
    expect(id).toBe('native-123');
  });

  it('uses OPENCODE_SESSION_ID when no explicit override or native ID', () => {
    const id = resolveSessionId({}, {
      OPENCODE_SESSION_ID: 'opencode-456',
    });
    expect(id).toBe('opencode-456');
  });

  it('derives from cwd in event data when no session signals', () => {
    const id = resolveSessionId({ cwd: '/home/user/project' }, {});
    expect(id).toBeDefined();
    expect(id!.startsWith('opencode-derived-')).toBe(true);
  });

  it('derives from PWD env when no session signals and no cwd in event data', () => {
    const id = resolveSessionId({}, { PWD: '/home/user/project' });
    expect(id).toBeDefined();
    expect(id!.startsWith('opencode-derived-')).toBe(true);
  });

  it('returns null when no session signals available', () => {
    const id = resolveSessionId({}, {});
    expect(id).toBeNull();
  });

  it('ignores empty string sessionId in event data', () => {
    const id = resolveSessionId(
      { sessionId: '' },
      { OPENCODE_SESSION_ID: 'opencode-456' },
    );
    expect(id).toBe('opencode-456');
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

  it('has opencode-derived- prefix', () => {
    const id = deriveSessionId('/tmp/test');
    expect(id).toMatch(/^opencode-derived-[0-9a-f]{16}$/);
  });

  it('produces different IDs across time buckets', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const id1 = deriveSessionId('/project');

    vi.spyOn(Date, 'now').mockReturnValue(now + 16 * 60 * 1000);
    const id2 = deriveSessionId('/project');

    expect(id1).not.toBe(id2);
  });
});
