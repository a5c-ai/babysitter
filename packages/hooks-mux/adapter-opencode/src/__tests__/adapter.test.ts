import { describe, it, expect } from 'vitest';
import { createAdapter } from '../adapter';

describe('createAdapter', () => {
  it('returns correct capability descriptor', () => {
    const caps = createAdapter('opencode');

    expect(caps.name).toBe('opencode');
    expect(caps.family).toBe('in-process');
    expect(caps.sessionIdQuality).toBe('native');
    expect(caps.supportsBlock).toBe(true);
    expect(caps.supportsAsk).toBe(false);
    expect(caps.supportsToolInputMutation).toBe(true);
    expect(caps.supportsToolResultMutation).toBe(false);
    expect(caps.supportsNativeAdditionalContext).toBe(false);
    expect(caps.supportsPersistedEnv).toBe(true);
    expect(caps.envPersistenceMode).toBe('runtime_hook');
    expect(caps.toolInterceptionScope).toBe('all');
  });

  it('includes library-only note', () => {
    const caps = createAdapter('opencode');
    expect(caps.notes).toContain('Library-only adapter; no CLI shell-hook mode');
  });

  it('includes native env injection note', () => {
    const caps = createAdapter('opencode');
    expect(caps.notes).toContain('Native env injection via shell.env hook');
  });

  it('includes native session ID note', () => {
    const caps = createAdapter('opencode');
    expect(caps.notes).toContain('Session ID provided natively by the OpenCode runtime');
  });
});
