import { describe, it, expect, beforeAll } from 'vitest';
import { normalizeOhMyPiEvent, parseEventContext, ADAPTER_NAME, setAdapterName } from '../normalizer';
import {
  SESSION_START_PAYLOAD,
  SESSION_END_PAYLOAD,
  PROMPT_PAYLOAD,
  TOOL_CALL_PAYLOAD,
  TOOL_RESULT_PAYLOAD,
  ERROR_PAYLOAD,
  EMPTY_PAYLOAD,
  MALFORMED_JSON_STRING,
  BASE_ENV,
} from './fixtures/oh-my-pi-events';

beforeAll(() => {
  setAdapterName('oh-my-pi');
});

describe('parseEventContext', () => {
  it('parses a valid object', () => {
    const result = parseEventContext(SESSION_START_PAYLOAD);
    expect(result).toEqual(SESSION_START_PAYLOAD);
  });

  it('parses a JSON string', () => {
    const result = parseEventContext(JSON.stringify(SESSION_START_PAYLOAD));
    expect(result).toEqual(SESSION_START_PAYLOAD);
  });

  it('returns empty object for null', () => {
    expect(parseEventContext(null)).toEqual({});
  });

  it('returns empty object for undefined', () => {
    expect(parseEventContext(undefined)).toEqual({});
  });

  it('returns empty object for malformed JSON (fail-open)', () => {
    expect(parseEventContext(MALFORMED_JSON_STRING)).toEqual({});
  });

  it('returns empty object for array input', () => {
    expect(parseEventContext([1, 2, 3])).toEqual({});
  });

  it('returns empty object for primitive', () => {
    expect(parseEventContext(42)).toEqual({});
  });
});

describe('normalizeOhMyPiEvent', () => {
  describe('session_start', () => {
    it('normalizes to session.start phase', () => {
      const event = normalizeOhMyPiEvent('session_start', SESSION_START_PAYLOAD, BASE_ENV);
      expect(event.version).toBe('a5c.hooks.v1');
      expect(event.adapter).toBe('oh-my-pi');
      expect(event.phase).toBe('session.start');
      expect(event.rawEventName).toBe('session_start');
      expect(event.supportLevel).toBe('native');
    });

    it('enriches execution context from payload', () => {
      const event = normalizeOhMyPiEvent('session_start', SESSION_START_PAYLOAD, BASE_ENV);
      expect(event.execution.cwd).toBe('/home/user/project');
      expect(event.execution.model).toBe('claude-4');
      expect(event.execution.source).toBe('startup');
    });

    it('extracts native session ID from context', () => {
      const event = normalizeOhMyPiEvent('session_start', SESSION_START_PAYLOAD, BASE_ENV);
      expect(event.execution.sessionId).toBe('pi-session-abc123');
    });

    it('preserves raw payload', () => {
      const event = normalizeOhMyPiEvent('session_start', SESSION_START_PAYLOAD, BASE_ENV);
      expect(event.payload).toEqual(expect.objectContaining({
        sessionId: 'pi-session-abc123',
        cwd: '/home/user/project',
        model: 'claude-4',
      }));
    });

    it('annotates with in-process adapter metadata', () => {
      const event = normalizeOhMyPiEvent('session_start', SESSION_START_PAYLOAD, BASE_ENV);
      expect(event.execution.metadata['adapterFamily']).toBe('in-process');
    });

    it('annotates tool input mutation as unsupported', () => {
      const event = normalizeOhMyPiEvent('session_start', SESSION_START_PAYLOAD, BASE_ENV);
      expect(event.execution.metadata['supportsToolInputMutation']).toBe(false);
    });

    it('annotates chained context and session-before short-circuit', () => {
      const event = normalizeOhMyPiEvent('session_start', SESSION_START_PAYLOAD, BASE_ENV);
      expect(event.execution.metadata['chainedContext']).toBe(true);
      expect(event.execution.metadata['sessionBeforeShortCircuit']).toBe(true);
    });
  });

  describe('session_end', () => {
    it('normalizes to session.end phase', () => {
      const event = normalizeOhMyPiEvent('session_end', SESSION_END_PAYLOAD, BASE_ENV);
      expect(event.phase).toBe('session.end');
      expect(event.supportLevel).toBe('native');
    });

    it('includes reason in payload', () => {
      const event = normalizeOhMyPiEvent('session_end', SESSION_END_PAYLOAD, BASE_ENV);
      expect(event.payload['reason']).toBe('user_exit');
    });
  });

  describe('prompt', () => {
    it('normalizes to turn.user_prompt_submitted phase', () => {
      const event = normalizeOhMyPiEvent('prompt', PROMPT_PAYLOAD, BASE_ENV);
      expect(event.phase).toBe('turn.user_prompt_submitted');
      expect(event.supportLevel).toBe('native');
    });

    it('includes prompt text in payload', () => {
      const event = normalizeOhMyPiEvent('prompt', PROMPT_PAYLOAD, BASE_ENV);
      expect(event.payload['text']).toBe('fix the build');
    });
  });

  describe('tool_call', () => {
    it('normalizes to tool.before with native support', () => {
      const event = normalizeOhMyPiEvent('tool_call', TOOL_CALL_PAYLOAD, BASE_ENV);
      expect(event.phase).toBe('tool.before');
      expect(event.supportLevel).toBe('native');
    });

    it('enriches execution context with tool name and call ID', () => {
      const event = normalizeOhMyPiEvent('tool_call', TOOL_CALL_PAYLOAD, BASE_ENV);
      expect(event.execution.toolName).toBe('bash');
      expect(event.execution.toolCallId).toBe('tc-omp-001');
    });
  });

  describe('tool_result', () => {
    it('normalizes to tool.after with native support', () => {
      const event = normalizeOhMyPiEvent('tool_result', TOOL_RESULT_PAYLOAD, BASE_ENV);
      expect(event.phase).toBe('tool.after');
      expect(event.supportLevel).toBe('native');
    });
  });

  describe('error', () => {
    it('normalizes to turn.error phase', () => {
      const event = normalizeOhMyPiEvent('error', ERROR_PAYLOAD, BASE_ENV);
      expect(event.phase).toBe('turn.error');
      expect(event.supportLevel).toBe('native');
    });

    it('includes error details in payload', () => {
      const event = normalizeOhMyPiEvent('error', ERROR_PAYLOAD, BASE_ENV);
      expect(event.payload['error']).toBe('Provider timeout');
      expect(event.payload['code']).toBe('TIMEOUT');
    });
  });

  describe('unknown events', () => {
    it('normalizes to unknown phase with unsupported level', () => {
      const event = normalizeOhMyPiEvent('SomeNewEvent', {}, BASE_ENV);
      expect(event.phase).toBe('unknown');
      expect(event.supportLevel).toBe('unsupported');
    });
  });

  describe('event context parsing', () => {
    it('handles string input', () => {
      const event = normalizeOhMyPiEvent(
        'session_start',
        JSON.stringify(SESSION_START_PAYLOAD),
        BASE_ENV,
      );
      expect(event.execution.sessionId).toBe('pi-session-abc123');
    });

    it('handles null context gracefully', () => {
      const event = normalizeOhMyPiEvent('session_start', null, BASE_ENV);
      expect(event.phase).toBe('session.start');
      expect(event.execution.cwd).toBe('/home/user/project');
    });

    it('handles empty payload gracefully', () => {
      const event = normalizeOhMyPiEvent('session_start', EMPTY_PAYLOAD, BASE_ENV);
      expect(event.phase).toBe('session.start');
      expect(event.adapter).toBe(ADAPTER_NAME);
    });
  });

  describe('env precedence', () => {
    it('prefers explicit env over context values', () => {
      const env = { ...BASE_ENV, HOOKS_PROXY_CWD: '/explicit/path' };
      const event = normalizeOhMyPiEvent('session_start', SESSION_START_PAYLOAD, env);
      expect(event.execution.cwd).toBe('/explicit/path');
    });

    it('prefers explicit model from env', () => {
      const env = { ...BASE_ENV, HOOKS_PROXY_MODEL: 'gpt-5' };
      const event = normalizeOhMyPiEvent('session_start', SESSION_START_PAYLOAD, env);
      expect(event.execution.model).toBe('gpt-5');
    });

    it('prefers explicit session ID from env', () => {
      const env = { ...BASE_ENV, HOOKS_PROXY_SESSION_ID: 'explicit-session' };
      const event = normalizeOhMyPiEvent('session_start', SESSION_START_PAYLOAD, env);
      expect(event.execution.sessionId).toBe('explicit-session');
    });
  });
});
