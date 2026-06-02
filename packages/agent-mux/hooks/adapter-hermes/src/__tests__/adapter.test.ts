import { describe, it, expect } from 'vitest';
import { createAdapter } from '../adapter';

describe('createAdapter', () => {
  const caps = createAdapter('hermes');

  it('returns shell-hook family', () => {
    expect(caps.family).toBe('shell-hook');
  });

  it('has native sessionIdQuality', () => {
    expect(caps.sessionIdQuality).toBe('native');
  });

  it('does not support blocking or ask', () => {
    expect(caps.supportsBlock).toBe(false);
    expect(caps.supportsAsk).toBe(false);
  });

  it('does not support ordered fanout', () => {
    expect(caps.supportsOrderedFanout).toBe(false);
  });

  it('does not support tool input or result mutation', () => {
    expect(caps.supportsToolInputMutation).toBe(false);
    expect(caps.supportsToolResultMutation).toBe(false);
  });

  it('has none tool interception scope', () => {
    expect(caps.toolInterceptionScope).toBe('none');
  });

  it('uses wrapper_only env persistence', () => {
    expect(caps.envPersistenceMode).toBe('wrapper_only');
  });

  it('documents non-blocking nature', () => {
    expect(caps.notes).toContain('single onEvent hook, non-blocking');
  });

  it('documents inability to block tool calls', () => {
    expect(caps.notes).toContain('cannot block or deny tool calls');
  });

  it('documents post-direction only limitation', () => {
    expect(caps.notes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('post-direction'),
      ]),
    );
  });

  it('documents HERMES_SESSION env var usage', () => {
    expect(caps.notes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('HERMES_SESSION'),
      ]),
    );
  });
});
