import { describe, it, expect, beforeAll } from 'vitest';
import { normalizeCodexEvent, parseStdin, extractSessionId, setAdapterName } from '../normalizer';

beforeAll(() => {
  setAdapterName('codex');
});
import {
  SESSION_START_PAYLOAD,
  USER_PROMPT_PAYLOAD,
  SESSION_END_PAYLOAD,
  STOP_PAYLOAD,
  TOOL_BEFORE_PAYLOAD,
  TOOL_AFTER_PAYLOAD,
  EMPTY_PAYLOAD,
  MALFORMED_JSON_STRING,
  BASE_ENV,
} from './fixtures/codex-events';

describe('parseStdin', () => {
  it('parses a valid object', () => {
    const result = parseStdin(SESSION_START_PAYLOAD);
    expect(result).toEqual(SESSION_START_PAYLOAD);
  });

  it('parses a JSON string', () => {
    const result = parseStdin(JSON.stringify(SESSION_START_PAYLOAD));
    expect(result).toEqual(SESSION_START_PAYLOAD);
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

describe('extractSessionId', () => {
  it('extracts session_id from payload', () => {
    expect(extractSessionId(SESSION_START_PAYLOAD)).toBe('codex-sess-abc123');
  });

  it('returns null for empty payload', () => {
    expect(extractSessionId(EMPTY_PAYLOAD)).toBeNull();
  });

  it('returns null for non-string session_id', () => {
    expect(extractSessionId({ session_id: 12345 })).toBeNull();
  });

  it('returns null for empty string session_id', () => {
    expect(extractSessionId({ session_id: '' })).toBeNull();
  });
});

describe('normalizeCodexEvent', () => {
  describe('SessionStart', () => {
    it('normalizes to session.start phase', () => {
      const event = normalizeCodexEvent('SessionStart', SESSION_START_PAYLOAD, BASE_ENV);
      expect(event.version).toBe('a5c.hooks.v1');
      expect(event.adapter).toBe('codex');
      expect(event.phase).toBe('session.start');
      expect(event.rawEventName).toBe('SessionStart');
      expect(event.supportLevel).toBe('native');
    });

    it('enriches execution context from payload', () => {
      const event = normalizeCodexEvent('SessionStart', SESSION_START_PAYLOAD, BASE_ENV);
      expect(event.execution.sessionId).toBe('codex-sess-abc123');
      expect(event.execution.cwd).toBe('/home/user/project');
      expect(event.execution.model).toBe('o3');
      expect(event.execution.source).toBe('startup');
    });

    it('preserves raw payload', () => {
      const event = normalizeCodexEvent('SessionStart', SESSION_START_PAYLOAD, BASE_ENV);
      expect(event.payload).toEqual(expect.objectContaining({
        session_id: 'codex-sess-abc123',
        model: 'o3',
      }));
    });
  });

  describe('UserPromptSubmit', () => {
    it('normalizes to turn.user_prompt_submitted phase', () => {
      const event = normalizeCodexEvent('UserPromptSubmit', USER_PROMPT_PAYLOAD, BASE_ENV);
      expect(event.phase).toBe('turn.user_prompt_submitted');
      expect(event.supportLevel).toBe('native');
    });

    it('includes prompt in payload', () => {
      const event = normalizeCodexEvent('UserPromptSubmit', USER_PROMPT_PAYLOAD, BASE_ENV);
      expect(event.payload['prompt']).toBe('Fix the bug in auth module');
    });
  });

  describe('SessionEnd', () => {
    it('normalizes to session.end phase with lossy support', () => {
      const event = normalizeCodexEvent('SessionEnd', SESSION_END_PAYLOAD, BASE_ENV);
      expect(event.phase).toBe('session.end');
      expect(event.supportLevel).toBe('lossy');
    });

    it('preserves end-of-session payload fields', () => {
      const event = normalizeCodexEvent('SessionEnd', SESSION_END_PAYLOAD, BASE_ENV);
      expect(event.payload['reason']).toBe('task_complete');
      expect(event.payload['summary']).toBe('Session completed successfully');
    });
  });

  describe('Stop', () => {
    it('normalizes to turn.stop phase', () => {
      const event = normalizeCodexEvent('Stop', STOP_PAYLOAD, BASE_ENV);
      expect(event.phase).toBe('turn.stop');
    });

    it('includes reason and stop_hook_active in payload', () => {
      const event = normalizeCodexEvent('Stop', STOP_PAYLOAD, BASE_ENV);
      expect(event.payload['reason']).toBe('task_complete');
      expect(event.payload['stop_hook_active']).toBe(false);
    });
  });

  describe('PreToolUse', () => {
    it('normalizes to tool.before with lossy support', () => {
      const event = normalizeCodexEvent('PreToolUse', TOOL_BEFORE_PAYLOAD, BASE_ENV);
      expect(event.phase).toBe('tool.before');
      expect(event.supportLevel).toBe('lossy');
    });

    it('enriches env with tool name and call ID', () => {
      const event = normalizeCodexEvent('PreToolUse', TOOL_BEFORE_PAYLOAD, BASE_ENV);
      expect(event.execution.toolName).toBe('bash');
      expect(event.execution.toolCallId).toBe('tc-001');
    });
  });

  describe('PostToolUse', () => {
    it('normalizes to tool.after with lossy support', () => {
      const event = normalizeCodexEvent('PostToolUse', TOOL_AFTER_PAYLOAD, BASE_ENV);
      expect(event.phase).toBe('tool.after');
      expect(event.supportLevel).toBe('lossy');
    });
  });

  describe('unknown events', () => {
    it('normalizes to unknown phase with unsupported level', () => {
      const event = normalizeCodexEvent('SomeNewEvent', {}, BASE_ENV);
      expect(event.phase).toBe('unknown');
      expect(event.supportLevel).toBe('unsupported');
    });
  });

  describe('stdin parsing', () => {
    it('handles string stdin input', () => {
      const event = normalizeCodexEvent(
        'SessionStart',
        JSON.stringify(SESSION_START_PAYLOAD),
        BASE_ENV,
      );
      expect(event.execution.sessionId).toBe('codex-sess-abc123');
    });

    it('handles null stdin gracefully', () => {
      const event = normalizeCodexEvent('SessionStart', null, BASE_ENV);
      expect(event.phase).toBe('session.start');
      expect(event.execution.sessionId).toBeNull();
    });

    it('handles string stdin input for SessionEnd', () => {
      const event = normalizeCodexEvent(
        'SessionEnd',
        JSON.stringify(SESSION_END_PAYLOAD),
        BASE_ENV,
      );
      expect(event.phase).toBe('session.end');
      expect(event.execution.sessionId).toBe('codex-sess-abc123');
    });
  });

  describe('env precedence', () => {
    it('prefers explicit env over payload values', () => {
      const env = { ...BASE_ENV, HOOKS_PROXY_SESSION_ID: 'explicit-session' };
      const event = normalizeCodexEvent('SessionStart', SESSION_START_PAYLOAD, env);
      expect(event.execution.sessionId).toBe('explicit-session');
    });
  });
});
