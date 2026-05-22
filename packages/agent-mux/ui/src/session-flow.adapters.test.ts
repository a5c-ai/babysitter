import { describe, expect, it } from 'vitest';

import { adaptSessionFlowEvent, adaptSessionFlowRun } from './session-flow.js';

describe('adaptSessionFlowEvent', () => {
  it('keeps supported events and drops malformed records', () => {
    expect(adaptSessionFlowEvent({ type: 'tool_call_ready', toolCallId: 'tool-1', toolName: 'Read', input: { path: 'src/app.tsx' } })).toEqual({
      type: 'tool_call_ready',
      toolCallId: 'tool-1',
      toolName: 'Read',
      input: { path: 'src/app.tsx' },
      timestamp: undefined,
    });

    expect(adaptSessionFlowEvent({ type: 'tool_call_ready', toolName: 'Read' })).toBeNull();
    expect(adaptSessionFlowEvent({ type: 'unknown_event' })).toBeNull();
  });
});

describe('adaptSessionFlowRun', () => {
  it('normalizes store run records into the projector seam', () => {
    expect(adaptSessionFlowRun({ runId: 'run-1', agent: 'codex', status: 'completed', startedAt: '2026-04-24T15:00:00.000Z' })).toEqual({
      runId: 'run-1',
      agent: 'codex',
      status: 'completed',
      startedAt: Date.parse('2026-04-24T15:00:00.000Z'),
    });
    expect(adaptSessionFlowRun({ agent: 'codex', startedAt: 0 })).toBeNull();
  });
});
