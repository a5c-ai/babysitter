import { describe, it, expect } from 'vitest';
import { createAdapter } from '../adapter';

describe('createAdapter', () => {
  const caps = createAdapter('cursor');

  it('returns shell-hook family', () => {
    expect(caps.family).toBe('shell-hook');
  });

  it('has derived sessionIdQuality', () => {
    expect(caps.sessionIdQuality).toBe('derived');
  });

  it('supports limited blocking but not ask', () => {
    expect(caps.supportsBlock).toBe(true);
    expect(caps.supportsAsk).toBe(false);
  });

  it('does not support tool input or result mutation', () => {
    expect(caps.supportsToolInputMutation).toBe(false);
    expect(caps.supportsToolResultMutation).toBe(false);
  });

  it('does not support persisted env', () => {
    expect(caps.supportsPersistedEnv).toBe(false);
  });

  it('uses wrapper_only env persistence', () => {
    expect(caps.envPersistenceMode).toBe('wrapper_only');
  });

  it('has all tool interception scope', () => {
    expect(caps.toolInterceptionScope).toBe('all');
  });

  it('notes stable hook surface', () => {
    expect(caps.notes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('stable as of Cursor 3.0'),
      ]),
    );
  });
});
