import { describe, it, expect, beforeAll } from 'vitest';
import { normalizeGemini, parseStdin, buildPayload, buildExecutionContext, setAdapterName } from '../normalizer';
import {
  SESSION_START_STDIN,
  BEFORE_TOOL_SELECTION_STDIN,
  BEFORE_MODEL_STDIN,
  AFTER_MODEL_STDIN,
  BEFORE_AGENT_STDIN,
  AFTER_AGENT_STDIN,
  BEFORE_TOOL_STDIN,
  AFTER_TOOL_STDIN,
  DEFAULT_ENV,
  ENV_WITH_EXPLICIT_SESSION,
  ENV_WITH_PERSISTED,
} from './fixtures/gemini-events';

beforeAll(() => {
  setAdapterName('gemini');
});

describe('parseStdin', () => {
  it('parses JSON string', () => {
    const result = parseStdin('{"key": "value"}');
    expect(result).toEqual({ key: 'value' });
  });

  it('passes through object directly', () => {
    const result = parseStdin({ key: 'value' });
    expect(result).toEqual({ key: 'value' });
  });

  it('wraps non-object JSON in raw field', () => {
    const result = parseStdin('"just a string"');
    expect(result).toEqual({ raw: 'just a string' });
  });

  it('wraps invalid JSON string in raw field', () => {
    const result = parseStdin('not json');
    expect(result).toEqual({ raw: 'not json' });
  });

  it('returns empty object for null', () => {
    expect(parseStdin(null)).toEqual({});
  });

  it('returns empty object for undefined', () => {
    expect(parseStdin(undefined)).toEqual({});
  });

  it('wraps arrays in raw field', () => {
    const result = parseStdin([1, 2, 3]);
    expect(result).toEqual({ raw: [1, 2, 3] });
  });
});

describe('buildExecutionContext', () => {
  it('uses GEMINI_SESSION_ID from env', () => {
    const ctx = buildExecutionContext(
      { cwd: '/project' },
      'SessionStart',
      DEFAULT_ENV,
    );
    expect(ctx.sessionId).toBe('gemini-test-session-123');
    expect(ctx.adapter).toBe('gemini');
  });

  it('prefers AGENT_SESSION_ID over GEMINI_SESSION_ID', () => {
    const ctx = buildExecutionContext(
      { cwd: '/project' },
      'SessionStart',
      ENV_WITH_EXPLICIT_SESSION,
    );
    expect(ctx.sessionId).toBe('explicit-session-456');
  });

  it('extracts tool metadata', () => {
    const ctx = buildExecutionContext(
      BEFORE_TOOL_STDIN,
      'BeforeTool',
      DEFAULT_ENV,
    );
    expect(ctx.toolName).toBe('write_file');
    expect(ctx.toolCallId).toBe('tc_001');
  });

  it('collects persisted env', () => {
    const ctx = buildExecutionContext(
      { cwd: '/project' },
      'SessionStart',
      ENV_WITH_PERSISTED,
    );
    expect(ctx.persistedEnv).toHaveProperty('HOOKS_PROXY_PERSIST_RUN_ID', 'run-789');
  });

  it('stores extensionPath in metadata', () => {
    const ctx = buildExecutionContext(
      SESSION_START_STDIN,
      'SessionStart',
      DEFAULT_ENV,
    );
    expect(ctx.metadata).toHaveProperty('extensionPath', '/home/user/.gemini/extensions/babysitter');
  });
});

describe('buildPayload', () => {
  it('extracts SessionStart fields', () => {
    const payload = buildPayload('SessionStart', SESSION_START_STDIN);
    expect(payload.initialPrompt).toBe('Help me refactor the auth module');
  });

  it('extracts BeforeToolSelection fields', () => {
    const payload = buildPayload('BeforeToolSelection', BEFORE_TOOL_SELECTION_STDIN);
    expect(payload.availableTools).toEqual(['read_file', 'write_file', 'run_command', 'search']);
    expect(payload.prompt).toBe('Read the config file and update the database settings');
  });

  it('extracts BeforeModel fields', () => {
    const payload = buildPayload('BeforeModel', BEFORE_MODEL_STDIN);
    expect(payload.llmRequest).toBeDefined();
    expect(payload.messages).toBeDefined();
  });

  it('extracts AfterModel fields', () => {
    const payload = buildPayload('AfterModel', AFTER_MODEL_STDIN);
    expect(payload.llmResponse).toBeDefined();
    expect(payload.usage).toEqual({
      promptTokens: 150,
      completionTokens: 80,
      totalTokens: 230,
    });
  });

  it('extracts BeforeAgent fields', () => {
    const payload = buildPayload('BeforeAgent', BEFORE_AGENT_STDIN);
    expect(payload.prompt).toBe('Analyze the codebase and suggest improvements');
  });

  it('extracts AfterAgent fields', () => {
    const payload = buildPayload('AfterAgent', AFTER_AGENT_STDIN);
    expect(payload.lastAssistantMessage).toBe(
      'I have completed the analysis and made the following changes...',
    );
    expect(payload.reason).toBe('completed');
  });

  it('extracts BeforeTool fields', () => {
    const payload = buildPayload('BeforeTool', BEFORE_TOOL_STDIN);
    expect(payload.toolName).toBe('write_file');
    expect(payload.toolInput).toEqual({ path: 'src/config.ts', content: 'export const config = {}' });
    expect(payload.toolCallId).toBe('tc_001');
  });

  it('extracts AfterTool fields', () => {
    const payload = buildPayload('AfterTool', AFTER_TOOL_STDIN);
    expect(payload.toolName).toBe('write_file');
    expect(payload.toolResponse).toEqual({ success: true, bytesWritten: 28 });
    expect(payload.toolCallId).toBe('tc_001');
  });

  it('passes through unknown event fields excluding common keys', () => {
    const payload = buildPayload('CustomEvent', { cwd: '/x', model: 'y', custom: 'data' });
    expect(payload).toHaveProperty('custom', 'data');
    expect(payload).not.toHaveProperty('cwd');
    expect(payload).not.toHaveProperty('model');
  });
});

describe('normalizeGemini', () => {
  it('normalizes a SessionStart event', () => {
    const event = normalizeGemini('SessionStart', SESSION_START_STDIN, DEFAULT_ENV);

    expect(event.version).toBe('a5c.hooks.v1');
    expect(event.adapter).toBe('gemini');
    expect(event.phase).toBe('session.start');
    expect(event.rawEventName).toBe('SessionStart');
    expect(event.supportLevel).toBe('native');
    expect(event.execution.sessionId).toBe('gemini-test-session-123');
    expect(event.payload.initialPrompt).toBe('Help me refactor the auth module');
    expect(event.raw).toBe(SESSION_START_STDIN);
  });

  it('normalizes a BeforeToolSelection event', () => {
    const event = normalizeGemini('BeforeToolSelection', BEFORE_TOOL_SELECTION_STDIN, DEFAULT_ENV);

    expect(event.phase).toBe('planner.before_tool_selection');
    expect(event.payload.availableTools).toEqual(
      ['read_file', 'write_file', 'run_command', 'search'],
    );
  });

  it('normalizes an AfterAgent event', () => {
    const event = normalizeGemini('AfterAgent', AFTER_AGENT_STDIN, DEFAULT_ENV);

    expect(event.phase).toBe('turn.after_agent');
    expect(event.payload.lastAssistantMessage).toBeDefined();
    expect(event.payload.reason).toBe('completed');
  });

  it('normalizes a BeforeTool event', () => {
    const event = normalizeGemini('BeforeTool', BEFORE_TOOL_STDIN, DEFAULT_ENV);

    expect(event.phase).toBe('tool.before');
    expect(event.execution.toolName).toBe('write_file');
    expect(event.payload.toolInput).toBeDefined();
  });

  it('handles unknown event names gracefully', () => {
    const event = normalizeGemini('UnknownEvent', { foo: 'bar' }, DEFAULT_ENV);

    expect(event.phase).toBe('unknown');
    expect(event.supportLevel).toBe('unsupported');
    expect(event.payload).toHaveProperty('foo', 'bar');
  });

  it('normalizes from JSON string stdin', () => {
    const event = normalizeGemini(
      'SessionStart',
      JSON.stringify(SESSION_START_STDIN),
      DEFAULT_ENV,
    );

    expect(event.phase).toBe('session.start');
    expect(event.payload.initialPrompt).toBe('Help me refactor the auth module');
  });

  it('splits env into input and persisted buckets', () => {
    const event = normalizeGemini('SessionStart', SESSION_START_STDIN, ENV_WITH_PERSISTED);

    expect(event.env.persisted).toHaveProperty('HOOKS_PROXY_PERSIST_RUN_ID', 'run-789');
    expect(event.env.input).toHaveProperty('HOOKS_PROXY_MODEL', 'gemini-2.5-pro');
  });

  it('handles null stdin', () => {
    const event = normalizeGemini('SessionStart', null, DEFAULT_ENV);

    expect(event.phase).toBe('session.start');
    expect(event.payload).toEqual({});
  });
});
