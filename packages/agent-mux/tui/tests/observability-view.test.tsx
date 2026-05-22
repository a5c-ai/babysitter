import React from 'react';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from 'ink-testing-library';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import {
  ObservabilityView,
  summarizeObservabilityEvents,
  filterObservabilityEvents,
  exportObservabilityEvents,
} from '../src/plugins/observability-view.js';
import { EventStream } from '../src/event-stream.js';

function makeEvent(overrides: Partial<AgentEvent> & Pick<AgentEvent, 'type'>): AgentEvent {
  return {
    type: overrides.type,
    runId: 'run-1',
    agent: 'codex',
    timestamp: 1_000,
    ...overrides,
  } as AgentEvent;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('observability-view', () => {
  it('aggregates metrics across buffered events', () => {
    const events = [
      makeEvent({ type: 'tool_call_start', timestamp: 1_000 }),
      makeEvent({ type: 'mcp_tool_call_start', timestamp: 1_500 }),
      makeEvent({ type: 'token_usage', timestamp: 2_000, inputTokens: 10, outputTokens: 4 }),
      makeEvent({ type: 'token_usage', timestamp: 2_500, inputTokens: 3, outputTokens: 8 }),
      makeEvent({
        type: 'cost',
        timestamp: 3_000,
        cost: { totalUsd: 0.25, inputTokens: 10, outputTokens: 4 },
      }),
      makeEvent({
        type: 'cost',
        timestamp: 4_000,
        cost: { totalUsd: 0.5, inputTokens: 3, outputTokens: 8 },
      }),
      makeEvent({ type: 'tool_error', timestamp: 4_500, toolCallId: 'tc-1', toolName: 'Read', error: 'boom' }),
      makeEvent({ type: 'error', timestamp: 5_000, message: 'bad' }),
    ];

    expect(summarizeObservabilityEvents(events)).toEqual({
      tokens: 25,
      input: 13,
      output: 12,
      cost: 0.75,
      latency: 4_000,
      errors: 2,
      tools: 2,
    });
  });

  it('filters logs by substring and type prefix', () => {
    const events = [
      makeEvent({ type: 'log', timestamp: 1_000, message: 'connected to stream' }),
      makeEvent({ type: 'tool_call_start', timestamp: 2_000, toolCallId: 'tc-1', toolName: 'Read', input: { file: 'a.ts' } }),
      makeEvent({ type: 'tool_result', timestamp: 3_000, toolCallId: 'tc-1', toolName: 'Read', output: { ok: true } }),
    ];

    expect(filterObservabilityEvents(events, 'connected')).toEqual([events[0]]);
    expect(filterObservabilityEvents(events, 'type:tool_call')).toEqual([events[1]]);
  });

  it('keeps header metrics on the full buffer while filtering visible log rows', () => {
    const stream = new EventStream();
    stream.push(makeEvent({ type: 'log', timestamp: 1_000, message: 'alpha' }));
    stream.push(makeEvent({ type: 'tool_result', timestamp: 2_000, toolCallId: 'tc-1', toolName: 'Read', output: { result: 'beta' } }));

    const { lastFrame } = render(
      <ObservabilityView
        client={{} as never}
        active={true}
        eventStream={stream}
        emit={() => {}}
        filter="alpha"
      />,
    );

    const frame = lastFrame() ?? '';
    expect(frame).toContain('2 events');
    expect(frame).toContain('alpha');
    expect(frame).not.toContain('beta');
  });

  it('exports the full buffered stream to a timestamped JSON file', () => {
    const events = [
      makeEvent({ type: 'log', timestamp: 1_000, message: 'alpha' }),
      makeEvent({ type: 'tool_result', timestamp: 2_000, toolCallId: 'tc-1', toolName: 'Read', output: { ok: true } }),
    ];
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'observability-export-'));

    const exportedPath = exportObservabilityEvents(events, {
      cwd: tmp,
      now: () => 123456,
    });

    expect(exportedPath).toBe(path.join(tmp, 'session-log-123456.json'));
    expect(fs.readFileSync(exportedPath, 'utf8')).toBe(JSON.stringify(events, null, 2));
  });
});
