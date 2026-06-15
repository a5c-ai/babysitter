import { describe, expect, it } from 'vitest';

import { buildNativeAgentFlowLane, buildNativeTranscript } from './session-flow.js';

describe('buildNativeAgentFlowLane', () => {
  it('creates a fallback lane from native session messages', () => {
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
  });

  it('normalizes structured content blocks into readable transcript text', () => {
    const transcript = buildNativeTranscript('session-2', [
      {
        role: 'assistant',
        content: [
          { type: 'thinking', thinking: 'hidden' },
          { type: 'text', text: 'Normalized text' },
          { type: 'tool_use', id: 'toolu_1', name: 'Read', input: { file_path: 'README.md' } },
        ],
      } as never,
      {
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: 'toolu_1', content: 'Tool output' }],
      } as never,
    ]);

    expect(transcript.map((node) => node.text)).toEqual(['Normalized text', 'Tool output']);
  });

  it('prefers normalized tool-result text over rendering the raw structured payload', () => {
    const transcript = buildNativeTranscript('session-3', [
      {
        role: 'tool',
        content: 'Readable tool summary',
        toolResult: {
          toolCallId: 'tool-1',
          toolName: 'Agent',
          output: [{ type: 'text', text: 'Readable tool summary' }],
        },
      } as never,
    ]);

    expect(transcript).toEqual([
      expect.objectContaining({
        kind: 'tool',
        text: 'Readable tool summary',
      }),
    ]);
  });
});
