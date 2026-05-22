import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { normalizeCursorEvent, parseStdin, ADAPTER_NAME, setAdapterName } from '../normalizer';
import { resetProfile } from '../capability-profile';
import {
  SESSION_START_PAYLOAD,
  STOP_PAYLOAD,
  PRE_TOOL_USE_PAYLOAD,
  POST_TOOL_USE_PAYLOAD,
  EMPTY_PAYLOAD,
  MALFORMED_JSON_STRING,
  BASE_ENV,
} from './fixtures/cursor-events';

beforeAll(() => {
  setAdapterName('cursor');
});

beforeEach(() => {
  resetProfile();
});

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

describe('normalizeCursorEvent', () => {
  describe('sessionStart', () => {
    it('normalizes to session.start phase', () => {
      const event = normalizeCursorEvent('sessionStart', SESSION_START_PAYLOAD, BASE_ENV);
      expect(event.version).toBe('a5c.hooks.v1');
      expect(event.adapter).toBe('cursor');
      expect(event.phase).toBe('session.start');
      expect(event.rawEventName).toBe('sessionStart');
      expect(event.supportLevel).toBe('native');
    });

    it('enriches execution context from payload', () => {
      const event = normalizeCursorEvent('sessionStart', SESSION_START_PAYLOAD, BASE_ENV);
      expect(event.execution.cwd).toBe('/home/user/project');
      expect(event.execution.model).toBe('gpt-4');
      expect(event.execution.source).toBe('startup');
    });

    it('preserves raw payload', () => {
      const event = normalizeCursorEvent('sessionStart', SESSION_START_PAYLOAD, BASE_ENV);
      expect(event.payload).toEqual(expect.objectContaining({
        cwd: '/home/user/project',
        model: 'gpt-4',
      }));
    });

    it('annotates with experimental metadata', () => {
      const event = normalizeCursorEvent('sessionStart', SESSION_START_PAYLOAD, BASE_ENV);
      expect(event.execution.metadata['experimental']).toBe(true);
    });

    it('includes cursor diagnostics in metadata', () => {
      const event = normalizeCursorEvent('sessionStart', SESSION_START_PAYLOAD, BASE_ENV);
      const diagnostics = event.execution.metadata['cursorDiagnostics'] as Record<string, unknown>;
      expect(diagnostics).toBeDefined();
      expect(diagnostics['isReliable']).toBe(true);
      expect(diagnostics['isKnown']).toBe(true);
      expect(diagnostics['profileName']).toBe('default');
    });
  });

  describe('stop', () => {
    it('normalizes to turn.stop phase', () => {
      const event = normalizeCursorEvent('stop', STOP_PAYLOAD, BASE_ENV);
      expect(event.phase).toBe('turn.stop');
    });

    it('includes reason and stop_hook_active in payload', () => {
      const event = normalizeCursorEvent('stop', STOP_PAYLOAD, BASE_ENV);
      expect(event.payload['reason']).toBe('task_complete');
      expect(event.payload['stop_hook_active']).toBe(false);
    });
  });

  describe('preToolUse (native)', () => {
    it('normalizes to tool.before with native support', () => {
      const event = normalizeCursorEvent('preToolUse', PRE_TOOL_USE_PAYLOAD, BASE_ENV);
      expect(event.phase).toBe('tool.before');
      expect(event.supportLevel).toBe('native');
    });

    it('enriches env with tool name and call ID', () => {
      const event = normalizeCursorEvent('preToolUse', PRE_TOOL_USE_PAYLOAD, BASE_ENV);
      expect(event.execution.toolName).toBe('bash');
      expect(event.execution.toolCallId).toBe('tc-cursor-001');
    });

    it('marks event as reliable in diagnostics', () => {
      const event = normalizeCursorEvent('preToolUse', PRE_TOOL_USE_PAYLOAD, BASE_ENV);
      const diagnostics = event.execution.metadata['cursorDiagnostics'] as Record<string, unknown>;
      expect(diagnostics['isReliable']).toBe(true);
      expect(diagnostics['isKnown']).toBe(true);
    });
  });

  describe('postToolUse (native)', () => {
    it('normalizes to tool.after with native support', () => {
      const event = normalizeCursorEvent('postToolUse', POST_TOOL_USE_PAYLOAD, BASE_ENV);
      expect(event.phase).toBe('tool.after');
      expect(event.supportLevel).toBe('native');
    });
  });

  describe('unknown events', () => {
    it('normalizes to unknown phase with unsupported level', () => {
      const event = normalizeCursorEvent('SomeNewEvent', {}, BASE_ENV);
      expect(event.phase).toBe('unknown');
      expect(event.supportLevel).toBe('unsupported');
    });

    it('marks unknown event in diagnostics', () => {
      const event = normalizeCursorEvent('SomeNewEvent', {}, BASE_ENV);
      const diagnostics = event.execution.metadata['cursorDiagnostics'] as Record<string, unknown>;
      expect(diagnostics['isKnown']).toBe(false);
      expect((diagnostics['warnings'] as string[]).length).toBeGreaterThan(0);
    });
  });

  describe('stdin parsing', () => {
    it('handles string stdin input', () => {
      const event = normalizeCursorEvent(
        'sessionStart',
        JSON.stringify(SESSION_START_PAYLOAD),
        BASE_ENV,
      );
      expect(event.execution.cwd).toBe('/home/user/project');
    });

    it('handles null stdin gracefully', () => {
      const event = normalizeCursorEvent('sessionStart', null, BASE_ENV);
      expect(event.phase).toBe('session.start');
      // Session ID should still be derivable from env PWD
      expect(event.execution.cwd).toBe('/home/user/project');
    });

    it('handles empty payload gracefully', () => {
      const event = normalizeCursorEvent('sessionStart', EMPTY_PAYLOAD, BASE_ENV);
      expect(event.phase).toBe('session.start');
      expect(event.adapter).toBe(ADAPTER_NAME);
    });
  });

  describe('env precedence', () => {
    it('prefers explicit env over payload values', () => {
      const env = { ...BASE_ENV, HOOKS_PROXY_CWD: '/explicit/path' };
      const event = normalizeCursorEvent('sessionStart', SESSION_START_PAYLOAD, env);
      expect(event.execution.cwd).toBe('/explicit/path');
    });

    it('prefers explicit model from env', () => {
      const env = { ...BASE_ENV, HOOKS_PROXY_MODEL: 'claude-4' };
      const event = normalizeCursorEvent('sessionStart', SESSION_START_PAYLOAD, env);
      expect(event.execution.model).toBe('claude-4');
    });
  });
});
