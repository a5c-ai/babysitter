import { describe, it, expect, beforeAll } from 'vitest';
import { normalizeHermesEvent, parseStdin, extractSessionId, extractInnerPayload, setAdapterName } from '../normalizer';

beforeAll(() => {
  setAdapterName('hermes');
});
import {
  ON_EVENT_TOOL_AFTER_PAYLOAD,
  ON_EVENT_MINIMAL_PAYLOAD,
  ON_EVENT_NO_PAYLOAD,
  EMPTY_PAYLOAD,
  MALFORMED_JSON_STRING,
  BASE_ENV,
  ENV_WITHOUT_SESSION,
} from './fixtures/hermes-events';

describe('parseStdin', () => {
  it('parses a valid object', () => {
    const result = parseStdin(ON_EVENT_TOOL_AFTER_PAYLOAD);
    expect(result).toEqual(ON_EVENT_TOOL_AFTER_PAYLOAD);
  });

  it('parses a JSON string', () => {
    const result = parseStdin(JSON.stringify(ON_EVENT_TOOL_AFTER_PAYLOAD));
    expect(result).toEqual(ON_EVENT_TOOL_AFTER_PAYLOAD);
  });

  it('returns empty object for null', () => {
    expect(parseStdin(null)).toEqual({});
  });

  it('returns empty object for undefined', () => {
    expect(parseStdin(undefined)).toEqual({});
  });

  it('returns empty object for malformed JSON (fail-open)', () => {
    expect(parseStdin(MALFORMED_JSON_STRING)).toEqual({});
  });

  it('returns empty object for array input', () => {
    expect(parseStdin([1, 2, 3])).toEqual({});
  });

  it('returns empty object for primitive', () => {
    expect(parseStdin(42)).toEqual({});
  });
});

describe('extractInnerPayload', () => {
  it('extracts nested payload object', () => {
    const result = extractInnerPayload(ON_EVENT_TOOL_AFTER_PAYLOAD);
    expect(result).toEqual(ON_EVENT_TOOL_AFTER_PAYLOAD.payload);
  });

  it('returns parsed object when no payload key', () => {
    const input = { event: 'test', data: 'value' };
    expect(extractInnerPayload(input)).toEqual(input);
  });

  it('returns parsed object when payload is not an object', () => {
    const input = { event: 'test', payload: 'not-an-object' };
    expect(extractInnerPayload(input)).toEqual(input);
  });

  it('returns parsed object when payload is null', () => {
    const input = { event: 'test', payload: null };
    expect(extractInnerPayload(input as Record<string, unknown>)).toEqual(input);
  });

  it('returns parsed object when payload is array', () => {
    const input = { event: 'test', payload: [1, 2] };
    expect(extractInnerPayload(input as Record<string, unknown>)).toEqual(input);
  });
});

describe('extractSessionId', () => {
  it('extracts HERMES_SESSION from env', () => {
    expect(extractSessionId(BASE_ENV)).toBe('hermes-sess-abc123');
  });

  it('returns null when HERMES_SESSION not in env', () => {
    expect(extractSessionId(ENV_WITHOUT_SESSION)).toBeNull();
  });

  it('returns null for empty HERMES_SESSION', () => {
    expect(extractSessionId({ HERMES_SESSION: '' })).toBeNull();
  });
});

describe('normalizeHermesEvent', () => {
  describe('onEvent with tool payload', () => {
    it('normalizes to tool.after phase', () => {
      const event = normalizeHermesEvent('onEvent', ON_EVENT_TOOL_AFTER_PAYLOAD, BASE_ENV);
      expect(event.version).toBe('a5c.hooks.v1');
      expect(event.adapter).toBe('hermes');
      expect(event.phase).toBe('tool.after');
      expect(event.rawEventName).toBe('onEvent');
    });

    it('enriches execution context from env', () => {
      const event = normalizeHermesEvent('onEvent', ON_EVENT_TOOL_AFTER_PAYLOAD, BASE_ENV);
      expect(event.execution.sessionId).toBe('hermes-sess-abc123');
    });

    it('enriches tool metadata from inner payload', () => {
      const event = normalizeHermesEvent('onEvent', ON_EVENT_TOOL_AFTER_PAYLOAD, BASE_ENV);
      expect(event.execution.toolName).toBe('bash');
      expect(event.execution.toolCallId).toBe('tc-hermes-001');
    });

    it('enriches cwd from inner payload', () => {
      const event = normalizeHermesEvent('onEvent', ON_EVENT_TOOL_AFTER_PAYLOAD, BASE_ENV);
      expect(event.execution.cwd).toBe('/home/user/project');
    });

    it('enriches model from inner payload', () => {
      const event = normalizeHermesEvent('onEvent', ON_EVENT_TOOL_AFTER_PAYLOAD, BASE_ENV);
      expect(event.execution.model).toBe('claude-sonnet');
    });

    it('preserves raw payload (envelope)', () => {
      const event = normalizeHermesEvent('onEvent', ON_EVENT_TOOL_AFTER_PAYLOAD, BASE_ENV);
      expect(event.payload).toEqual(expect.objectContaining({
        event: 'tool.completed',
      }));
    });
  });

  describe('onEvent with minimal payload', () => {
    it('normalizes to tool.after with native support', () => {
      const event = normalizeHermesEvent('onEvent', ON_EVENT_MINIMAL_PAYLOAD, BASE_ENV);
      expect(event.phase).toBe('tool.after');
      expect(event.supportLevel).toBe('native');
    });
  });

  describe('unknown events', () => {
    it('normalizes to unknown phase with unsupported level', () => {
      const event = normalizeHermesEvent('SomeNewEvent', {}, BASE_ENV);
      expect(event.phase).toBe('unknown');
      expect(event.supportLevel).toBe('unsupported');
    });
  });

  describe('stdin parsing', () => {
    it('handles string stdin input', () => {
      const event = normalizeHermesEvent(
        'onEvent',
        JSON.stringify(ON_EVENT_TOOL_AFTER_PAYLOAD),
        BASE_ENV,
      );
      expect(event.execution.sessionId).toBe('hermes-sess-abc123');
    });

    it('handles null stdin gracefully', () => {
      const event = normalizeHermesEvent('onEvent', null, BASE_ENV);
      expect(event.phase).toBe('tool.after');
      expect(event.execution.sessionId).toBe('hermes-sess-abc123');
    });

    it('handles empty payload gracefully', () => {
      const event = normalizeHermesEvent('onEvent', EMPTY_PAYLOAD, BASE_ENV);
      expect(event.phase).toBe('tool.after');
    });
  });

  describe('env precedence', () => {
    it('prefers explicit HOOKS_PROXY_SESSION_ID over HERMES_SESSION', () => {
      const env = { ...BASE_ENV, HOOKS_PROXY_SESSION_ID: 'explicit-session' };
      const event = normalizeHermesEvent('onEvent', ON_EVENT_TOOL_AFTER_PAYLOAD, env);
      expect(event.execution.sessionId).toBe('explicit-session');
    });

    it('works without HERMES_SESSION env var', () => {
      const event = normalizeHermesEvent('onEvent', ON_EVENT_TOOL_AFTER_PAYLOAD, ENV_WITHOUT_SESSION);
      expect(event.phase).toBe('tool.after');
      expect(event.execution.sessionId).toBeNull();
    });
  });
});
