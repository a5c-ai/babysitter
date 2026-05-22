import { describe, it, expect, beforeAll } from 'vitest';
import {
  normalizeOpenCode,
  parseEventData,
  buildPayload,
  buildExecutionContext,
  setAdapterName,
} from '../normalizer';
import {
  SESSION_CREATED_EVENT,
  TOOL_EXECUTE_BEFORE_EVENT,
  TOOL_EXECUTE_AFTER_EVENT,
  SHELL_ENV_EVENT,
  DEFAULT_ENV,
  ENV_WITH_EXPLICIT_SESSION,
  ENV_WITH_PERSISTED,
} from './fixtures/opencode-events';

beforeAll(() => {
  setAdapterName('opencode');
});

describe('parseEventData', () => {
  it('parses JSON string', () => {
    const result = parseEventData('{"key": "value"}');
    expect(result).toEqual({ key: 'value' });
  });

  it('passes through object directly', () => {
    const result = parseEventData({ key: 'value' });
    expect(result).toEqual({ key: 'value' });
  });

  it('wraps non-object JSON in raw field', () => {
    const result = parseEventData('"just a string"');
    expect(result).toEqual({ raw: 'just a string' });
  });

  it('wraps invalid JSON string in raw field', () => {
    const result = parseEventData('not json');
    expect(result).toEqual({ raw: 'not json' });
  });

  it('returns empty object for null', () => {
    expect(parseEventData(null)).toEqual({});
  });

  it('returns empty object for undefined', () => {
    expect(parseEventData(undefined)).toEqual({});
  });

  it('wraps arrays in raw field', () => {
    const result = parseEventData([1, 2, 3]);
    expect(result).toEqual({ raw: [1, 2, 3] });
  });
});

describe('buildExecutionContext', () => {
  it('uses native sessionId from event data', () => {
    const ctx = buildExecutionContext(
      SESSION_CREATED_EVENT,
      'session.created',
      DEFAULT_ENV,
    );
    expect(ctx.sessionId).toBe('opencode-session-abc');
    expect(ctx.adapter).toBe('opencode');
  });

  it('prefers AGENT_SESSION_ID over native sessionId', () => {
    const ctx = buildExecutionContext(
      SESSION_CREATED_EVENT,
      'session.created',
      ENV_WITH_EXPLICIT_SESSION,
    );
    expect(ctx.sessionId).toBe('explicit-session-456');
  });

  it('extracts tool metadata', () => {
    const ctx = buildExecutionContext(
      TOOL_EXECUTE_BEFORE_EVENT,
      'tool.execute.before',
      DEFAULT_ENV,
    );
    expect(ctx.toolName).toBe('write_file');
    expect(ctx.toolCallId).toBe('tc_001');
  });

  it('collects persisted env', () => {
    const ctx = buildExecutionContext(
      { cwd: '/project' },
      'session.created',
      ENV_WITH_PERSISTED,
    );
    expect(ctx.persistedEnv).toHaveProperty('HOOKS_PROXY_PERSIST_RUN_ID', 'run-789');
  });

  it('extracts model from event data', () => {
    const ctx = buildExecutionContext(
      SESSION_CREATED_EVENT,
      'session.created',
      DEFAULT_ENV,
    );
    expect(ctx.model).toBe('claude-sonnet-4-20250514');
  });

  it('falls back to env PWD for cwd', () => {
    const ctx = buildExecutionContext(
      {},
      'session.created',
      { PWD: '/fallback/path' },
    );
    expect(ctx.cwd).toBe('/fallback/path');
  });
});

describe('buildPayload', () => {
  it('extracts session.created fields', () => {
    const payload = buildPayload('session.created', SESSION_CREATED_EVENT);
    expect(payload.initialPrompt).toBe('Help me refactor the auth module');
  });

  it('extracts tool.execute.before fields', () => {
    const payload = buildPayload('tool.execute.before', TOOL_EXECUTE_BEFORE_EVENT);
    expect(payload.toolName).toBe('write_file');
    expect(payload.toolInput).toEqual({ path: 'src/config.ts', content: 'export const config = {}' });
    expect(payload.toolCallId).toBe('tc_001');
  });

  it('extracts tool.execute.after fields', () => {
    const payload = buildPayload('tool.execute.after', TOOL_EXECUTE_AFTER_EVENT);
    expect(payload.toolName).toBe('write_file');
    expect(payload.toolResponse).toEqual({ success: true, bytesWritten: 28 });
    expect(payload.toolCallId).toBe('tc_001');
  });

  it('extracts shell.env fields', () => {
    const payload = buildPayload('shell.env', SHELL_ENV_EVENT);
    expect(payload.env).toEqual({
      AGENT_SESSION_ID: 'opencode-session-abc',
      AGENT_WORKSPACE_ROOT: '/home/user/project',
      CUSTOM_VAR: 'hello',
    });
  });

  it('passes through unknown event fields excluding common keys', () => {
    const payload = buildPayload('CustomEvent', {
      sessionId: 'x',
      cwd: '/x',
      model: 'y',
      custom: 'data',
    });
    expect(payload).toHaveProperty('custom', 'data');
    expect(payload).not.toHaveProperty('sessionId');
    expect(payload).not.toHaveProperty('cwd');
    expect(payload).not.toHaveProperty('model');
  });
});

describe('normalizeOpenCode', () => {
  it('normalizes a session.created event', () => {
    const event = normalizeOpenCode('session.created', SESSION_CREATED_EVENT, DEFAULT_ENV);

    expect(event.version).toBe('a5c.hooks.v1');
    expect(event.adapter).toBe('opencode');
    expect(event.phase).toBe('session.start');
    expect(event.rawEventName).toBe('session.created');
    expect(event.supportLevel).toBe('native');
    expect(event.execution.sessionId).toBe('opencode-session-abc');
    expect(event.payload.initialPrompt).toBe('Help me refactor the auth module');
    expect(event.raw).toBe(SESSION_CREATED_EVENT);
  });

  it('normalizes a tool.execute.before event', () => {
    const event = normalizeOpenCode(
      'tool.execute.before',
      TOOL_EXECUTE_BEFORE_EVENT,
      DEFAULT_ENV,
    );

    expect(event.phase).toBe('tool.before');
    expect(event.execution.toolName).toBe('write_file');
    expect(event.payload.toolInput).toBeDefined();
  });

  it('normalizes a tool.execute.after event', () => {
    const event = normalizeOpenCode(
      'tool.execute.after',
      TOOL_EXECUTE_AFTER_EVENT,
      DEFAULT_ENV,
    );

    expect(event.phase).toBe('tool.after');
    expect(event.payload.toolName).toBe('write_file');
    expect(event.payload.toolResponse).toEqual({ success: true, bytesWritten: 28 });
  });

  it('normalizes a shell.env event as lossy session.start', () => {
    const event = normalizeOpenCode('shell.env', SHELL_ENV_EVENT, DEFAULT_ENV);

    expect(event.phase).toBe('session.start');
    expect(event.supportLevel).toBe('lossy');
    expect(event.rawEventName).toBe('shell.env');
    expect(event.payload.env).toBeDefined();
  });

  it('handles unknown event names gracefully', () => {
    const event = normalizeOpenCode('UnknownEvent', { foo: 'bar' }, DEFAULT_ENV);

    expect(event.phase).toBe('unknown');
    expect(event.supportLevel).toBe('unsupported');
    expect(event.payload).toHaveProperty('foo', 'bar');
  });

  it('normalizes from JSON string input', () => {
    const event = normalizeOpenCode(
      'session.created',
      JSON.stringify(SESSION_CREATED_EVENT),
      DEFAULT_ENV,
    );

    expect(event.phase).toBe('session.start');
    expect(event.payload.initialPrompt).toBe('Help me refactor the auth module');
  });

  it('splits env into input and persisted buckets', () => {
    const event = normalizeOpenCode('session.created', SESSION_CREATED_EVENT, ENV_WITH_PERSISTED);

    expect(event.env.persisted).toHaveProperty('HOOKS_PROXY_PERSIST_RUN_ID', 'run-789');
    expect(event.env.input).toHaveProperty('HOOKS_PROXY_MODEL', 'claude-sonnet-4-20250514');
  });

  it('handles null input', () => {
    const event = normalizeOpenCode('session.created', null, DEFAULT_ENV);

    expect(event.phase).toBe('session.start');
    expect(event.payload).toEqual({});
  });
});
