import { describe, it, expect } from 'vitest';
import { normalizeEvent } from '../../normalizer/normalize';
import { NormalizationError } from '../../normalizer/errors';
import type { PhaseMapping } from '../../types/lifecycle';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ADAPTER_MAPPINGS: PhaseMapping[] = [
  {
    canonicalPhase: 'tool.before',
    nativeHook: 'PreToolUse',
    supportLevel: 'native',
    blockCapability: true,
    mutationCapability: true,
    scope: 'tool',
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('malformed-input failure modes', () => {
  it('throws NormalizationError when adapter is empty string', () => {
    expect(() =>
      normalizeEvent({
        adapter: '',
        rawEventName: 'PreToolUse',
        adapterMappings: ADAPTER_MAPPINGS,
      }),
    ).toThrow(NormalizationError);
  });

  it('throws NormalizationError when rawEventName is empty string', () => {
    expect(() =>
      normalizeEvent({
        adapter: 'claude',
        rawEventName: '',
        adapterMappings: ADAPTER_MAPPINGS,
      }),
    ).toThrow(NormalizationError);
  });

  it('handles null stdinPayload gracefully (wraps as empty payload)', () => {
    const event = normalizeEvent({
      adapter: 'claude',
      rawEventName: 'PreToolUse',
      stdinPayload: null,
      adapterMappings: ADAPTER_MAPPINGS,
    });

    // null is not object, so it gets wrapped as { raw: null }
    expect(event.payload).toEqual({ raw: null });
  });

  it('handles empty object stdinPayload', () => {
    const event = normalizeEvent({
      adapter: 'claude',
      rawEventName: 'PreToolUse',
      stdinPayload: {},
      adapterMappings: ADAPTER_MAPPINGS,
    });

    expect(event.payload).toEqual({});
  });

  it('wraps non-object stdinPayload (string) in { raw }', () => {
    const event = normalizeEvent({
      adapter: 'claude',
      rawEventName: 'PreToolUse',
      stdinPayload: 'just a string',
      adapterMappings: ADAPTER_MAPPINGS,
    });

    expect(event.payload).toEqual({ raw: 'just a string' });
  });

  it('wraps array stdinPayload in { raw }', () => {
    const event = normalizeEvent({
      adapter: 'claude',
      rawEventName: 'PreToolUse',
      stdinPayload: [1, 2, 3],
      adapterMappings: ADAPTER_MAPPINGS,
    });

    expect(event.payload).toEqual({ raw: [1, 2, 3] });
  });

  it('wraps number stdinPayload in { raw }', () => {
    const event = normalizeEvent({
      adapter: 'claude',
      rawEventName: 'PreToolUse',
      stdinPayload: 42,
      adapterMappings: ADAPTER_MAPPINGS,
    });

    expect(event.payload).toEqual({ raw: 42 });
  });

  it('handles undefined stdinPayload as empty payload', () => {
    const event = normalizeEvent({
      adapter: 'claude',
      rawEventName: 'PreToolUse',
      stdinPayload: undefined,
      adapterMappings: ADAPTER_MAPPINGS,
    });

    expect(event.payload).toEqual({});
  });

  it('handles missing env gracefully (defaults to {})', () => {
    const event = normalizeEvent({
      adapter: 'claude',
      rawEventName: 'PreToolUse',
      adapterMappings: ADAPTER_MAPPINGS,
    });

    expect(event.execution.sessionId).toBeNull();
    expect(event.env.input).toEqual({});
    expect(event.env.persisted).toEqual({});
  });

  it('handles unknown rawEventName by mapping to "unknown" phase with "unsupported" support', () => {
    const event = normalizeEvent({
      adapter: 'claude',
      rawEventName: 'NonExistentHook',
      adapterMappings: ADAPTER_MAPPINGS,
    });

    expect(event.phase).toBe('unknown');
    expect(event.supportLevel).toBe('unsupported');
  });

  it('error code is set correctly for missing adapter', () => {
    try {
      normalizeEvent({
        adapter: '',
        rawEventName: 'PreToolUse',
        adapterMappings: [],
      });
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(NormalizationError);
      expect((err as NormalizationError).code).toBe('MISSING_ADAPTER');
    }
  });

  it('error code is set correctly for missing event name', () => {
    try {
      normalizeEvent({
        adapter: 'claude',
        rawEventName: '',
        adapterMappings: [],
      });
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(NormalizationError);
      expect((err as NormalizationError).code).toBe('MISSING_EVENT_NAME');
    }
  });
});
