import { describe, it, expect } from 'vitest';
import { createAdapter } from '../adapter';

describe('createAdapter', () => {
  it('returns correct capability descriptor', () => {
    const caps = createAdapter('gemini');

    expect(caps.name).toBe('gemini');
    expect(caps.family).toBe('shell-hook');
    expect(caps.sessionIdQuality).toBe('derived');
    expect(caps.supportsBlock).toBe(true);
    expect(caps.supportsAsk).toBe(true);
    expect(caps.supportsToolInputMutation).toBe(true);
    expect(caps.supportsToolResultMutation).toBe(false);
    expect(caps.supportsNativeAdditionalContext).toBe(true);
    expect(caps.envPersistenceMode).toBe('wrapper_only');
    expect(caps.toolInterceptionScope).toBe('all');
  });

  it('includes union-style aggregation note', () => {
    const caps = createAdapter('gemini');
    expect(caps.notes).toContain('BeforeToolSelection has union-style aggregation');
  });

  it('includes stderr logging note', () => {
    const caps = createAdapter('gemini');
    expect(caps.notes).toContain('Logs must go to stderr; final JSON to stdout only');
  });
});
