import { describe, expect, it } from 'vitest';

import { buildAgentFlowLanes, buildNativeAgentFlowLane } from '@a5c-ai/agent-mux-ui/session-flow';

describe('buildAgentFlowLanes', () => {
  it('groups streamed transcript and tool events into flow segments', () => {
    const runs = [
      {
        runId: 'run-1',
        agent: 'codex',
        status: 'completed',
        startedAt: 1000,
      },
    ];

    const eventBuffers = {
      'run-1': {
        events: [
          { type: 'user_message', text: 'Ship the feature', timestamp: 1000 },
          { type: 'thinking_delta', delta: 'Need a plan', timestamp: 1100 },
          { type: 'thinking_stop', thinking: 'Need a plan before editing', timestamp: 1200 },
          { type: 'text_delta', delta: 'Working on it', timestamp: 1300 },
          { type: 'message_stop', text: 'Working on it now', timestamp: 1400 },
          { type: 'tool_call_ready', toolCallId: 'tool-1', toolName: 'Read', input: { path: 'src/app.tsx' }, timestamp: 1500 },
          { type: 'tool_result', toolCallId: 'tool-1', toolName: 'Read', output: { ok: true }, timestamp: 1900 },
          { type: 'cost', cost: { totalUsd: 0.42 }, timestamp: 2000 },
        ],
      },
    };

    const lanes = buildAgentFlowLanes(runs, eventBuffers);

    expect(lanes).toHaveLength(1);
    expect(lanes[0]).toMatchObject({
      runId: 'run-1',
      agent: 'codex',
      status: 'completed',
      toolCount: 1,
      totalUsd: 0.42,
    });
    expect(lanes[0].segments.map((segment) => segment.kind)).toEqual([
      'user',
      'thinking',
      'assistant',
      'tool',
    ]);
    expect(lanes[0].segments[3].title).toBe('Read');
  });
});

describe('buildNativeAgentFlowLane', () => {
  it('creates a fallback flow lane from native session messages', () => {
    const lane = buildNativeAgentFlowLane(
      'session-1',
      [
        { role: 'user', content: 'Hello' },
        { thinking: 'Reasoning' },
        { role: 'assistant', content: 'Done' },
      ],
      'claude',
      'inactive',
    );

    expect(lane).not.toBeNull();
    expect(lane?.segments.map((segment) => segment.kind)).toEqual([
      'user',
      'thinking',
      'assistant',
    ]);
    expect(lane?.segmentCount).toBe(3);
  });
});
