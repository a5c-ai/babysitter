import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { createRegistry, createContext, loadPlugins } from '../src/registry.js';
import { EventStream } from '../src/event-stream.js';
import { FallbackRenderer } from '../src/plugins/fallback.js';
import type { TuiPlugin } from '../src/plugin.js';
import type { AgentEvent } from '@a5c-ai/agent-mux';

describe('event bus', () => {
  it('pushes events to subscribers', async () => {
    const stream = new EventStream();
    const seen: AgentEvent[] = [];
    const unsub = stream.subscribe((ev) => seen.push(ev));
    const ev: AgentEvent = {
      type: 'text_delta',
      runId: 'r1',
      agent: 'claude-code',
      timestamp: new Date().toISOString(),
      messageId: 'm1',
      contentIndex: 0,
      delta: 'hi',
    } as AgentEvent;
    stream.push(ev);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toBe(ev);
    unsub();
    stream.push(ev);
    expect(seen).toHaveLength(1);
  });

  it('ctx.emit("event") forwards to the stream', async () => {
    const reg = createRegistry();
    const stream = new EventStream();
    const ctx = createContext({} as never, reg, () => {}, stream);
    const seen: AgentEvent[] = [];
    stream.subscribe((ev) => seen.push(ev));

    const plugin: TuiPlugin = {
      name: 'emitter',
      register(c) {
        c.emit({
          type: 'event',
          event: {
            type: 'text_delta',
            runId: 'r',
            agent: 'claude-code',
            timestamp: 't',
            messageId: 'm',
            contentIndex: 0,
            delta: 'hi',
          } as AgentEvent,
        });
      },
    };
    await loadPlugins([plugin], ctx);
    expect(seen).toHaveLength(1);
  });

  it('FallbackRenderer renders a dim one-liner for unknown event types', () => {
    const ev = { type: 'mcp_tool_call_start', runId: 'r', agent: 'claude-code', timestamp: 't', server: 'x', toolName: 'y' } as unknown as AgentEvent;
    const { lastFrame } = render(<FallbackRenderer event={ev} />);
    expect(lastFrame()).toMatch(/mcp_tool_call_start/);
  });
});

describe('prompt command', () => {
  it('exposes a registerPromptHandler extension point', () => {
    const reg = createRegistry();
    const stream = new EventStream();
    const ctx = createContext({} as never, reg, () => {}, stream);
    let called = false;
    ctx.registerPromptHandler((prompt) => {
      called = prompt === 'hello';
    });
    expect(reg.promptHandlers).toHaveLength(1);
    reg.promptHandlers[0]('hello');
    expect(called).toBe(true);
  });
});
