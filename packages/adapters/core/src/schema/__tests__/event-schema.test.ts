import { describe, it, expect } from 'vitest';
import {
  validateEvent,
  eventSchemaRegistry,
  EVENT_SCHEMA_COUNT,
} from '../event-schema.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal base fields present on every valid event. */
function base(type: string) {
  return {
    type,
    runId: 'run-001',
    agent: 'claude',
    timestamp: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// All 67 event type discriminants (from events.ts + events-control.ts)
// ---------------------------------------------------------------------------

const ALL_EVENT_TYPES = [
  // Session lifecycle (5)
  'session_start', 'session_resume', 'session_fork', 'session_checkpoint', 'session_end',
  // Turn / step lifecycle (4)
  'turn_start', 'turn_end', 'step_start', 'step_end',
  // Text / message streaming (3)
  'message_start', 'text_delta', 'message_stop',
  // Thinking / reasoning (3)
  'thinking_start', 'thinking_delta', 'thinking_stop',
  // Tool calling (5)
  'tool_call_start', 'tool_input_delta', 'tool_call_ready', 'tool_result', 'tool_error',
  // File operations (5)
  'file_read', 'file_write', 'file_create', 'file_delete', 'file_patch',
  // Shell operations (4)
  'shell_start', 'shell_stdout_delta', 'shell_stderr_delta', 'shell_exit',
  // MCP tool calling (3)
  'mcp_tool_call_start', 'mcp_tool_result', 'mcp_tool_error',
  // Subagent dispatch (3)
  'subagent_spawn', 'subagent_result', 'subagent_error',
  // Plugin events (3)
  'plugin_loaded', 'plugin_invoked', 'plugin_error',
  // Skill / agent doc loading (3)
  'skill_loaded', 'skill_invoked', 'agentdoc_read',
  // Multimodal (2)
  'image_output', 'image_input_ack',
  // Cost and tokens (2)
  'cost', 'token_usage',
  // Interaction / waiting (4)
  'input_required', 'approval_request', 'approval_granted', 'approval_denied',
  // Rate / context limits (4)
  'rate_limited', 'context_limit_warning', 'context_compacted', 'retry',
  // Run lifecycle / control (7)
  'interrupted', 'aborted', 'paused', 'resumed', 'timeout', 'turn_limit', 'stream_fallback',
  // Errors (5)
  'auth_error', 'rate_limit_error', 'context_exceeded', 'crash', 'error',
  // Debug (2)
  'debug', 'log',
] as const;

// ===========================================================================
// 1. Registry completeness
// ===========================================================================

describe('Registry completeness', () => {
  it('eventSchemaRegistry has exactly EVENT_SCHEMA_COUNT (67) entries', () => {
    expect(Object.keys(eventSchemaRegistry)).toHaveLength(67);
    expect(EVENT_SCHEMA_COUNT).toBe(67);
  });

  it('every AgentEventType discriminant has a corresponding schema in the registry', () => {
    for (const type of ALL_EVENT_TYPES) {
      expect(eventSchemaRegistry).toHaveProperty(type);
    }
  });

  it('registry contains no extra types beyond the 67 defined', () => {
    const registryKeys = new Set(Object.keys(eventSchemaRegistry));
    const expectedKeys = new Set<string>(ALL_EVENT_TYPES);
    expect(registryKeys).toEqual(expectedKeys);
  });
});

// ===========================================================================
// 2. Valid event validation (representative subset of ~15 event types)
// ===========================================================================

describe('Valid event validation', () => {
  it('session_start', () => {
    const result = validateEvent({
      ...base('session_start'),
      sessionId: 'sess-1',
      resumed: false,
    });
    expect(result.valid).toBe(true);
    expect(result.eventType).toBe('session_start');
  });

  it('text_delta', () => {
    const result = validateEvent({
      ...base('text_delta'),
      delta: 'hello',
      accumulated: 'hello',
    });
    expect(result.valid).toBe(true);
    expect(result.eventType).toBe('text_delta');
  });

  it('tool_call_start', () => {
    const result = validateEvent({
      ...base('tool_call_start'),
      toolCallId: 'tc-1',
      toolName: 'read_file',
      inputAccumulated: '{}',
    });
    expect(result.valid).toBe(true);
    expect(result.eventType).toBe('tool_call_start');
  });

  it('tool_result', () => {
    const result = validateEvent({
      ...base('tool_result'),
      toolCallId: 'tc-1',
      toolName: 'read_file',
      output: { content: 'file contents' },
      durationMs: 42,
    });
    expect(result.valid).toBe(true);
    expect(result.eventType).toBe('tool_result');
  });

  it('file_write', () => {
    const result = validateEvent({
      ...base('file_write'),
      path: '/tmp/test.txt',
      byteCount: 1024,
    });
    expect(result.valid).toBe(true);
    expect(result.eventType).toBe('file_write');
  });

  it('shell_exit', () => {
    const result = validateEvent({
      ...base('shell_exit'),
      exitCode: 0,
      durationMs: 150,
    });
    expect(result.valid).toBe(true);
    expect(result.eventType).toBe('shell_exit');
  });

  it('error', () => {
    const result = validateEvent({
      ...base('error'),
      code: 'INTERNAL',
      message: 'Something went wrong',
      recoverable: false,
    });
    expect(result.valid).toBe(true);
    expect(result.eventType).toBe('error');
  });

  it('cost', () => {
    const result = validateEvent({
      ...base('cost'),
      cost: { totalUsd: 0.05, inputTokens: 2000, outputTokens: 500 },
    });
    expect(result.valid).toBe(true);
    expect(result.eventType).toBe('cost');
  });

  it('approval_request', () => {
    const result = validateEvent({
      ...base('approval_request'),
      interactionId: 'ia-1',
      action: 'write file',
      detail: 'Writing to /tmp/test.txt',
      riskLevel: 'medium',
    });
    expect(result.valid).toBe(true);
    expect(result.eventType).toBe('approval_request');
  });

  it('subagent_spawn', () => {
    const result = validateEvent({
      ...base('subagent_spawn'),
      subagentId: 'sub-1',
      agentName: 'codex',
      prompt: 'Refactor the module',
    });
    expect(result.valid).toBe(true);
    expect(result.eventType).toBe('subagent_spawn');
  });

  it('mcp_tool_result', () => {
    const result = validateEvent({
      ...base('mcp_tool_result'),
      toolCallId: 'mcp-tc-1',
      server: 'atlas',
      toolName: 'search',
      output: [{ id: '1' }],
    });
    expect(result.valid).toBe(true);
    expect(result.eventType).toBe('mcp_tool_result');
  });

  it('plugin_loaded', () => {
    const result = validateEvent({
      ...base('plugin_loaded'),
      pluginId: 'plg-1',
      pluginName: 'peon-ping',
      version: '1.0.0',
    });
    expect(result.valid).toBe(true);
    expect(result.eventType).toBe('plugin_loaded');
  });

  it('thinking_delta', () => {
    const result = validateEvent({
      ...base('thinking_delta'),
      delta: 'Let me think...',
      accumulated: 'Let me think...',
    });
    expect(result.valid).toBe(true);
    expect(result.eventType).toBe('thinking_delta');
  });

  it('input_required', () => {
    const result = validateEvent({
      ...base('input_required'),
      interactionId: 'ir-1',
      question: 'What is the target?',
      source: 'agent',
    });
    expect(result.valid).toBe(true);
    expect(result.eventType).toBe('input_required');
  });

  it('debug', () => {
    const result = validateEvent({
      ...base('debug'),
      level: 'info',
      message: 'Processing step 3',
    });
    expect(result.valid).toBe(true);
    expect(result.eventType).toBe('debug');
  });
});

// ===========================================================================
// 3. Invalid event rejection
// ===========================================================================

describe('Invalid event rejection', () => {
  it('rejects when missing type field', () => {
    const result = validateEvent({
      runId: 'run-001',
      agent: 'claude',
      timestamp: Date.now(),
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.includes('type'))).toBe(true);
  });

  it('rejects when missing runId', () => {
    const result = validateEvent({
      type: 'text_delta',
      agent: 'claude',
      timestamp: Date.now(),
      delta: 'hi',
      accumulated: 'hi',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('rejects when missing timestamp', () => {
    const result = validateEvent({
      type: 'text_delta',
      runId: 'run-001',
      agent: 'claude',
      delta: 'hi',
      accumulated: 'hi',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('rejects unknown type discriminant', () => {
    const result = validateEvent({
      ...base('totally_fake_event'),
    });
    expect(result.valid).toBe(false);
    expect(result.eventType).toBe('totally_fake_event');
    expect(result.errors).toBeDefined();
    expect(result.errors!.some((e) => e.includes('Unknown event type'))).toBe(true);
  });

  it('rejects wrong field type (timestamp as string)', () => {
    const result = validateEvent({
      type: 'text_delta',
      runId: 'run-001',
      agent: 'claude',
      timestamp: 'not a number',
      delta: 'hi',
      accumulated: 'hi',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('rejects null input', () => {
    const result = validateEvent(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain('non-null object');
  });

  it('rejects non-object input', () => {
    const result = validateEvent('a string');
    expect(result.valid).toBe(false);
  });

  it('rejects event with missing required extra fields', () => {
    // text_delta requires delta and accumulated
    const result = validateEvent({
      ...base('text_delta'),
      // missing delta and accumulated
    });
    expect(result.valid).toBe(false);
    expect(result.eventType).toBe('text_delta');
    expect(result.errors).toBeDefined();
  });

  it('rejects error event with invalid error code', () => {
    const result = validateEvent({
      ...base('error'),
      code: 'NOT_A_REAL_CODE',
      message: 'oops',
      recoverable: true,
    });
    expect(result.valid).toBe(false);
    expect(result.eventType).toBe('error');
  });

  it('rejects approval_request with invalid riskLevel', () => {
    const result = validateEvent({
      ...base('approval_request'),
      interactionId: 'ia-1',
      action: 'delete',
      detail: 'Deleting everything',
      riskLevel: 'extreme', // not a valid literal
    });
    expect(result.valid).toBe(false);
    expect(result.eventType).toBe('approval_request');
  });
});

// ===========================================================================
// 4. Optional fields
// ===========================================================================

describe('Optional fields', () => {
  it('session_start passes without optional forkedFrom', () => {
    const result = validateEvent({
      ...base('session_start'),
      sessionId: 'sess-1',
      resumed: false,
    });
    expect(result.valid).toBe(true);
  });

  it('session_start passes with optional forkedFrom', () => {
    const result = validateEvent({
      ...base('session_start'),
      sessionId: 'sess-1',
      resumed: true,
      forkedFrom: 'sess-0',
    });
    expect(result.valid).toBe(true);
  });

  it('session_end passes without optional cost', () => {
    const result = validateEvent({
      ...base('session_end'),
      sessionId: 'sess-1',
      turnCount: 5,
    });
    expect(result.valid).toBe(true);
  });

  it('session_end passes with optional cost', () => {
    const result = validateEvent({
      ...base('session_end'),
      sessionId: 'sess-1',
      turnCount: 5,
      cost: { totalUsd: 0.1, inputTokens: 500, outputTokens: 200 },
    });
    expect(result.valid).toBe(true);
  });

  it('cost record with optional thinkingTokens and cachedTokens', () => {
    const result = validateEvent({
      ...base('cost'),
      cost: {
        totalUsd: 0.02,
        inputTokens: 1000,
        outputTokens: 300,
        thinkingTokens: 100,
        cachedTokens: 200,
        cacheCreationTokens: 50,
        cacheReadTokens: 150,
      },
    });
    expect(result.valid).toBe(true);
  });

  it('image_output passes without optional base64 and filePath', () => {
    const result = validateEvent({
      ...base('image_output'),
      mimeType: 'image/png',
    });
    expect(result.valid).toBe(true);
  });

  it('image_output passes with optional base64', () => {
    const result = validateEvent({
      ...base('image_output'),
      mimeType: 'image/png',
      base64: 'iVBORw0KGgo=',
    });
    expect(result.valid).toBe(true);
  });

  it('base event optional source field accepted', () => {
    const result = validateEvent({
      ...base('text_delta'),
      source: 'adapter',
      delta: 'hi',
      accumulated: 'hi',
    });
    expect(result.valid).toBe(true);
  });

  it('approval_denied passes without optional reason', () => {
    const result = validateEvent({
      ...base('approval_denied'),
      interactionId: 'ia-1',
    });
    expect(result.valid).toBe(true);
  });

  it('approval_denied passes with optional reason', () => {
    const result = validateEvent({
      ...base('approval_denied'),
      interactionId: 'ia-1',
      reason: 'Too risky',
    });
    expect(result.valid).toBe(true);
  });

  it('rate_limited passes without optional retryAfterMs', () => {
    const result = validateEvent({
      ...base('rate_limited'),
    });
    expect(result.valid).toBe(true);
  });

  it('rate_limited passes with optional retryAfterMs', () => {
    const result = validateEvent({
      ...base('rate_limited'),
      retryAfterMs: 5000,
    });
    expect(result.valid).toBe(true);
  });

  it('thinking_start passes without optional effort', () => {
    const result = validateEvent({
      ...base('thinking_start'),
    });
    expect(result.valid).toBe(true);
  });

  it('thinking_start passes with optional effort', () => {
    const result = validateEvent({
      ...base('thinking_start'),
      effort: 'high',
    });
    expect(result.valid).toBe(true);
  });

  it('token_usage passes without optional thinkingTokens and cachedTokens', () => {
    const result = validateEvent({
      ...base('token_usage'),
      inputTokens: 1000,
      outputTokens: 500,
    });
    expect(result.valid).toBe(true);
  });

  it('token_usage passes with optional thinkingTokens and cachedTokens', () => {
    const result = validateEvent({
      ...base('token_usage'),
      inputTokens: 1000,
      outputTokens: 500,
      thinkingTokens: 200,
      cachedTokens: 100,
    });
    expect(result.valid).toBe(true);
  });

  it('input_required passes without optional context', () => {
    const result = validateEvent({
      ...base('input_required'),
      interactionId: 'ir-1',
      question: 'What next?',
      source: 'tool',
    });
    expect(result.valid).toBe(true);
  });

  it('input_required passes with optional context', () => {
    const result = validateEvent({
      ...base('input_required'),
      interactionId: 'ir-1',
      question: 'What next?',
      context: 'We need a decision about the merge strategy',
      source: 'tool',
    });
    expect(result.valid).toBe(true);
  });
});
