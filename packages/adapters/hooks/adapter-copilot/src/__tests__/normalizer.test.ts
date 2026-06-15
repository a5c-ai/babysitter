import { describe, it, expect, beforeAll } from 'vitest';
import { parseStdin, normalizeCopilotEvent, setAdapterName } from '../normalizer';
import {
  SESSION_START,
  PRE_TOOL_USE,
  USER_PROMPT_SUBMITTED,
  ERROR_EVENT,
} from './fixtures/copilot-events';

beforeAll(() => {
  setAdapterName('copilot');
});

describe('parseStdin', () => {
  it('should parse valid JSON', () => {
    const result = parseStdin('{"event":"sessionStart","cwd":"/tmp"}');
    expect(result).toEqual({ event: 'sessionStart', cwd: '/tmp' });
  });

  it('should return null for empty input', () => {
    expect(parseStdin('')).toBeNull();
    expect(parseStdin('   ')).toBeNull();
  });

  it('should return null for invalid JSON', () => {
    expect(parseStdin('not json')).toBeNull();
  });

  it('should return null for non-object JSON', () => {
    expect(parseStdin('"just a string"')).toBeNull();
    expect(parseStdin('[1,2,3]')).toBeNull();
    expect(parseStdin('null')).toBeNull();
  });

  it('should handle whitespace around JSON', () => {
    const result = parseStdin('  {"event":"test"}  \n');
    expect(result).toEqual({ event: 'test' });
  });
});

describe('normalizeCopilotEvent', () => {
  it('should normalize a sessionStart event', () => {
    const event = normalizeCopilotEvent(SESSION_START, 'sessionStart');

    expect(event.version).toBe('a5c.hooks.v1');
    expect(event.adapter).toBe('copilot');
    expect(event.phase).toBe('session.start');
    expect(event.rawEventName).toBe('sessionStart');
    expect(event.supportLevel).toBe('native');
    expect(event.execution.sessionId).toBeTruthy();
    expect(event.execution.sessionId).toMatch(/^copilot-/);
  });

  it('should normalize a preToolUse event with tool metadata', () => {
    const event = normalizeCopilotEvent(PRE_TOOL_USE, 'preToolUse');

    expect(event.phase).toBe('tool.before');
    expect(event.execution.toolName).toBe('bash');
    expect(event.execution.toolCallId).toBe('call-abc-123');
    expect(event.payload['toolInput']).toEqual({ command: 'rm -rf /' });
  });

  it('should normalize a userPromptSubmitted event', () => {
    const event = normalizeCopilotEvent(USER_PROMPT_SUBMITTED, 'userPromptSubmitted');

    expect(event.phase).toBe('turn.user_prompt_submitted');
    expect(event.payload['prompt']).toBe('Fix the login bug in auth.ts');
  });

  it('should normalize an error event', () => {
    const event = normalizeCopilotEvent(ERROR_EVENT, 'errorOccurred');

    expect(event.phase).toBe('turn.error');
    expect(event.payload['error']).toBe('Connection timeout to model endpoint');
  });

  it('should use env session ID when provided', () => {
    const event = normalizeCopilotEvent(SESSION_START, 'sessionStart', {
      AGENT_SESSION_ID: 'explicit-session-42',
    });

    expect(event.execution.sessionId).toBe('explicit-session-42');
  });

  it('should derive synthetic session ID from workspace', () => {
    const event1 = normalizeCopilotEvent(SESSION_START, 'sessionStart');
    const event2 = normalizeCopilotEvent(SESSION_START, 'sessionStart');

    // Same input -> same session ID (deterministic)
    expect(event1.execution.sessionId).toBe(event2.execution.sessionId);
  });

  it('should produce different session IDs for different workspaces', () => {
    const input1 = { ...SESSION_START, workspace: '/project-a' };
    const input2 = { ...SESSION_START, workspace: '/project-b' };

    const event1 = normalizeCopilotEvent(input1, 'sessionStart');
    const event2 = normalizeCopilotEvent(input2, 'sessionStart');

    expect(event1.execution.sessionId).not.toBe(event2.execution.sessionId);
  });

  it('should not include event name in payload', () => {
    const event = normalizeCopilotEvent(SESSION_START, 'sessionStart');
    expect(event.payload).not.toHaveProperty('event');
  });

  it('should handle unknown event names gracefully', () => {
    const event = normalizeCopilotEvent({ event: 'unknownEvent' }, 'unknownEvent');
    expect(event.phase).toBe('unknown');
    expect(event.supportLevel).toBe('unsupported');
  });
});
