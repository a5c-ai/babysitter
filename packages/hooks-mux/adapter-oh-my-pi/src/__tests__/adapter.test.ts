import { describe, it, expect } from 'vitest';
import { createAdapter } from '../adapter';

describe('createAdapter', () => {
  const caps = createAdapter('oh-my-pi');

  it('returns in-process family', () => {
    expect(caps.family).toBe('in-process');
  });

  it('has native sessionIdQuality', () => {
    expect(caps.sessionIdQuality).toBe('native');
  });

  it('does not support blocking or ask', () => {
    expect(caps.supportsBlock).toBe(false);
    expect(caps.supportsAsk).toBe(false);
  });

  it('explicitly does not support tool input mutation', () => {
    expect(caps.supportsToolInputMutation).toBe(false);
  });

  it('does not support tool result mutation', () => {
    expect(caps.supportsToolResultMutation).toBe(false);
  });

  it('supports persisted env via runtime_hook', () => {
    expect(caps.supportsPersistedEnv).toBe(true);
    expect(caps.envPersistenceMode).toBe('runtime_hook');
  });

  it('has no tool interception scope', () => {
    expect(caps.toolInterceptionScope).toBe('none');
  });

  it('documents library-only nature', () => {
    expect(caps.notes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('library-only'),
      ]),
    );
  });

  it('documents tool input mutation limitation explicitly', () => {
    expect(caps.notes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('supportsToolInputMutation is explicitly false'),
      ]),
    );
  });

  it('documents chained context behavior', () => {
    expect(caps.notes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('chained context'),
      ]),
    );
  });
});
