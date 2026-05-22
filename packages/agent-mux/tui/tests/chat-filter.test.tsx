import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { ChatViewInner } from '../src/plugins/chat-view.js';
import { EventStream } from '../src/event-stream.js';
import type { EventRenderer } from '../src/plugin.js';
import type { AgentEvent } from '@a5c-ai/agent-mux';

const renderers: EventRenderer[] = [
  {
    id: 'text',
    match: (ev) => ev.type === 'text_delta',
    component: ({ event }) =>
      event.type === 'text_delta' ? <Text>{event.delta}</Text> : null,
  },
  {
    id: 'fallback',
    match: () => true,
    component: ({ event }) => <Text>{`· ${event.type}`}</Text>,
  },
];

const ev = (e: object): AgentEvent => ({ runId: 'r', agent: 'claude-code', timestamp: 't', ...e }) as AgentEvent;

describe('chat-view filter', () => {
  it('substring filter only renders matching events', async () => {
    const stream = new EventStream();
    stream.push(ev({ type: 'text_delta', delta: 'hello world' }));
    stream.push(ev({ type: 'text_delta', delta: 'goodbye world' }));
    const { lastFrame } = render(
      <ChatViewInner
        client={{} as never}
        active={true}
        eventStream={stream}
        emit={() => {}}
        renderers={renderers}
        filter="hello"
      />,
    );
    await new Promise((r) => setTimeout(r, 20));
    const f = lastFrame() ?? '';
    expect(f).toContain('hello world');
    expect(f).not.toContain('goodbye world');
  });

  it('type:<prefix> filter restricts by event type', async () => {
    const stream = new EventStream();
    stream.push(ev({ type: 'text_delta', delta: 'msg' }));
    stream.push(ev({ type: 'shell_start', command: 'ls', cwd: '/' }));
    const { lastFrame } = render(
      <ChatViewInner
        client={{} as never}
        active={true}
        eventStream={stream}
        emit={() => {}}
        renderers={renderers}
        filter="type:shell"
      />,
    );
    await new Promise((r) => setTimeout(r, 20));
    const f = lastFrame() ?? '';
    expect(f).not.toContain('msg');
    expect(f).toContain('shell_start');
  });

  it('shows no-match message when filter excludes all', async () => {
    const stream = new EventStream();
    stream.push(ev({ type: 'text_delta', delta: 'a' }));
    const { lastFrame } = render(
      <ChatViewInner
        client={{} as never}
        active={true}
        eventStream={stream}
        emit={() => {}}
        renderers={renderers}
        filter="zzzz"
      />,
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(lastFrame()).toContain('No events match');
  });
});
