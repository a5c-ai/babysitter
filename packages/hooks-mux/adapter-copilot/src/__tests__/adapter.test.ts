import { describe, it, expect } from 'vitest';
import { createAdapter } from '../adapter';

describe('createAdapter', () => {
  const caps = createAdapter('copilot');

  it('should return copilot as the name', () => {
    expect(caps.name).toBe('copilot');
  });

  it('should be a shell-hook family adapter', () => {
    expect(caps.family).toBe('shell-hook');
  });

  it('should use synthetic session ID quality', () => {
    expect(caps.sessionIdQuality).toBe('synthetic');
  });

  it('should support blocking (pre-tool deny only)', () => {
    expect(caps.supportsBlock).toBe(true);
  });

  it('should not support ask', () => {
    expect(caps.supportsAsk).toBe(false);
  });

  it('should not support native additional context', () => {
    expect(caps.supportsNativeAdditionalContext).toBe(false);
  });

  it('should not support tool input or result mutation', () => {
    expect(caps.supportsToolInputMutation).toBe(false);
    expect(caps.supportsToolResultMutation).toBe(false);
  });

  it('should use wrapper_only env persistence mode', () => {
    expect(caps.envPersistenceMode).toBe('wrapper_only');
  });

  it('should intercept all tools', () => {
    expect(caps.toolInterceptionScope).toBe('all');
  });

  it('should include notes about Copilot limitations', () => {
    expect(caps.notes).toContain('session-start output ignored');
    expect(caps.notes).toContain('only deny processed for permissionDecision');
  });
});
