import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import type { AgentEvent } from '@a5c-ai/agent-mux';
import toolCall from '../src/plugins/tool-call.js';
import { createContext, createRegistry, loadPlugins } from '../src/registry.js';
import { EventStream } from '../src/event-stream.js';
import type { EventRenderer } from '../src/plugin.js';

const base = { runId: 'r', agent: 'codex' as const, timestamp: 't' };

async function pickToolRenderer(event: AgentEvent): Promise<EventRenderer> {
  const registry = createRegistry();
  const ctx = createContext({} as never, registry, () => {}, new EventStream());
  await loadPlugins([toolCall], ctx);
  const renderer = registry.renderers.find((candidate) => candidate.match(event));
  if (!renderer) {
    throw new Error(`No renderer matched ${event.type}`);
  }
  return renderer;
}

describe('terminal-oriented tool renderers', () => {
  it('renders exec_command calls as terminal commands instead of generic JSON', async () => {
    const event = {
      ...base,
      type: 'tool_call_ready',
      toolCallId: 'tc1',
      toolName: 'exec_command',
      input: { cmd: 'npm test', cwd: '/repo' },
    } as AgentEvent;

    const renderer = await pickToolRenderer(event);
    const { lastFrame } = render(<renderer.component event={event} />);
    const frame = lastFrame() ?? '';

    expect(frame).toContain('$ npm test');
    expect(frame).toContain('/repo');
    expect(frame).not.toContain('{"cmd":"npm test"');
  });

  it('renders write_stdin calls as terminal stdin writes', async () => {
    const event = {
      ...base,
      type: 'tool_call_ready',
      toolCallId: 'tc2',
      toolName: 'write_stdin',
      input: { chars: 'y\\n' },
    } as AgentEvent;

    const renderer = await pickToolRenderer(event);
    const { lastFrame } = render(<renderer.component event={event} />);
    const frame = lastFrame() ?? '';

    expect(frame).toContain('stdin');
    expect(frame).toContain('y');
    expect(frame).not.toContain('{"chars"');
  });

  it('renders terminal tool results with exit summaries', async () => {
    const event = {
      ...base,
      type: 'tool_result',
      toolCallId: 'tc3',
      toolName: 'exec_command',
      output: { stdout: 'done', stderr: '', exitCode: 0 },
      durationMs: 55,
    } as AgentEvent;

    const renderer = await pickToolRenderer(event);
    const { lastFrame } = render(<renderer.component event={event} />);
    const frame = lastFrame() ?? '';

    expect(frame).toMatch(/exit\s+0/);
    expect(frame).toContain('done');
    expect(frame).not.toContain('{"stdout":"done"');
  });
});
