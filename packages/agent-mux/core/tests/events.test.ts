import { describe, it, expect } from 'vitest';
import type {
  AgentEvent,
  AgentEventType,
  EventOfType,
  TextDeltaEvent,
  ToolCallStartEvent,
  SessionStartEvent,
  CrashEvent,
  DebugEvent,
  TimeoutEvent,
  ApprovalRequestEvent,
  InputRequiredEvent,
  CostEvent,
  TokenUsageEvent,
} from '../src/events.js';

/** Create a minimal event of a given type for type-checking tests. */
function makeEvent<T extends AgentEventType>(type: T, extra: Record<string, unknown> = {}): EventOfType<T> {
  return {
    type,
    runId: 'test-run-001',
    agent: 'claude',
    timestamp: Date.now(),
    ...extra,
  } as EventOfType<T>;
}

describe('AgentEvent types', () => {
  it('TextDeltaEvent has delta and accumulated fields', () => {
    const event = makeEvent('text_delta', { delta: 'hello', accumulated: 'hello' });
    const typed: TextDeltaEvent = event;
    expect(typed.type).toBe('text_delta');
    expect(typed.delta).toBe('hello');
    expect(typed.accumulated).toBe('hello');
  });

  it('SessionStartEvent has sessionId and resumed', () => {
    const event = makeEvent('session_start', { sessionId: 'sess-1', resumed: false });
    const typed: SessionStartEvent = event;
    expect(typed.sessionId).toBe('sess-1');
    expect(typed.resumed).toBe(false);
  });

  it('ToolCallStartEvent has toolCallId and toolName', () => {
    const event = makeEvent('tool_call_start', { toolCallId: 'tc-1', toolName: 'read', inputAccumulated: '' });
    const typed: ToolCallStartEvent = event;
    expect(typed.toolCallId).toBe('tc-1');
    expect(typed.toolName).toBe('read');
  });

  it('CrashEvent has exitCode and stderr', () => {
    const event = makeEvent('crash', { exitCode: 1, stderr: 'oops' });
    const typed: CrashEvent = event;
    expect(typed.exitCode).toBe(1);
    expect(typed.stderr).toBe('oops');
  });

  it('DebugEvent has level and message', () => {
    const event = makeEvent('debug', { level: 'info', message: 'test debug' });
    const typed: DebugEvent = event;
    expect(typed.level).toBe('info');
    expect(typed.message).toBe('test debug');
  });

  it('TimeoutEvent has kind discriminant', () => {
    const event = makeEvent('timeout', { kind: 'inactivity' });
    const typed: TimeoutEvent = event;
    expect(typed.kind).toBe('inactivity');
  });

  it('ApprovalRequestEvent has interaction fields', () => {
    const event = makeEvent('approval_request', {
      interactionId: 'ia-1',
      action: 'write file',
      detail: 'Writing to test.txt',
      riskLevel: 'medium',
    });
    const typed: ApprovalRequestEvent = event;
    expect(typed.interactionId).toBe('ia-1');
    expect(typed.riskLevel).toBe('medium');
  });

  it('InputRequiredEvent has question and source', () => {
    const event = makeEvent('input_required', {
      interactionId: 'ir-1',
      question: 'What is your name?',
      source: 'agent',
    });
    const typed: InputRequiredEvent = event;
    expect(typed.question).toBe('What is your name?');
    expect(typed.source).toBe('agent');
  });

  it('CostEvent has cost record', () => {
    const event = makeEvent('cost', {
      cost: { totalUsd: 0.01, inputTokens: 100, outputTokens: 50 },
    });
    const typed: CostEvent = event;
    expect(typed.cost.totalUsd).toBe(0.01);
  });

  it('TokenUsageEvent has token counts', () => {
    const event = makeEvent('token_usage', {
      inputTokens: 1000,
      outputTokens: 500,
      thinkingTokens: 200,
    });
    const typed: TokenUsageEvent = event;
    expect(typed.inputTokens).toBe(1000);
    expect(typed.outputTokens).toBe(500);
    expect(typed.thinkingTokens).toBe(200);
  });

  it('type discriminant narrowing works at runtime', () => {
    const event: AgentEvent = makeEvent('text_delta', { delta: 'x', accumulated: 'x' });
    if (event.type === 'text_delta') {
      expect(event.delta).toBe('x');
    } else {
      expect.unreachable('Should have narrowed to text_delta');
    }
  });

  it('EventOfType extracts the correct interface', () => {
    // This is a compile-time check — if it compiles, the type works
    const _check: EventOfType<'crash'> = makeEvent('crash', { exitCode: 1, stderr: '' });
    expect(_check.type).toBe('crash');
  });
});
