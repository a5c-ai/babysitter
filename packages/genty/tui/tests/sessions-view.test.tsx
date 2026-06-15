import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { EventStream } from '../src/event-stream.js';
import { createViewport, type TuiViewport } from '../src/layout.js';
import SessionsViewPlugin from '../src/plugins/sessions-view.js';
import type { TuiInternalEvent } from '../src/plugin.js';

function makeClient(sessions: { sessionId: string; agent: string }[]) {
  const agents = [...new Set(sessions.map((s) => s.agent))];
  return {
    adapters: { list: () => agents.map((agent) => ({ agent })) },
    sessions: {
      list: vi.fn(async (agent: string) =>
        sessions.filter((s) => s.agent === agent).map((s) => ({ sessionId: s.sessionId })),
      ),
    },
  } as unknown as Parameters<NonNullable<typeof SessionsViewPlugin>['register']>[0]['client'];
}

async function flush() {
  await new Promise((r) => setTimeout(r, 20));
}

function extractView() {
  // Re-register plugin into a local registry to grab the view component.
  const views: { component: React.ComponentType<unknown> }[] = [];
  SessionsViewPlugin.register({
    client: {} as never,
    eventStream: new EventStream(),
    registerView: (v) => views.push(v as never),
    registerEventRenderer: () => {},
    registerCommand: () => {},
    registerPromptHandler: () => {},
    emit: () => {},
  });
  return views[0]!.component as React.ComponentType<{
    client: unknown;
    active: boolean;
    eventStream: EventStream;
    emit: (e: TuiInternalEvent) => void;
    viewport?: TuiViewport;
  }>;
}

describe('sessions-view selection + resume', () => {
  it('highlights the first session by default and moves selection with arrow keys', async () => {
    const View = extractView();
    const client = makeClient([
      { sessionId: 'sess-a', agent: 'claude-code' },
      { sessionId: 'sess-b', agent: 'claude-code' },
    ]);
    const stream = new EventStream();
    const emit = vi.fn();
    const { stdin, lastFrame, rerender } = render(
      <View client={client} active={true} eventStream={stream} emit={emit} />,
    );
    await flush();
    rerender(<View client={client} active={true} eventStream={stream} emit={emit} />);
    expect(lastFrame()).toContain('sess-a');
    expect(lastFrame()).toContain('sess-b');
    // Highlight marker on first row
    expect(lastFrame()).toMatch(/>\s*.*sess-a/);
    stdin.write('\u001B[B'); // down arrow
    await flush();
    expect(lastFrame()).toMatch(/>\s*.*sess-b/);
  });

  it('emits session:select and view:switch to chat on Enter', async () => {
    const View = extractView();
    const client = makeClient([{ sessionId: 'sess-a', agent: 'claude-code' }]);
    const stream = new EventStream();
    const emit = vi.fn();
    const { stdin, rerender } = render(
      <View client={client} active={true} eventStream={stream} emit={emit} />,
    );
    await flush();
    rerender(<View client={client} active={true} eventStream={stream} emit={emit} />);
    stdin.write('\r'); // Enter
    await flush();
    const calls = emit.mock.calls.map((c) => c[0]);
    expect(calls).toContainEqual({
      type: 'session:select',
      agent: 'claude-code',
      sessionId: 'sess-a',
    });
    expect(calls).toContainEqual({ type: 'view:switch', id: 'chat' });
  });

  it('renders sessions from faster agents before slower listings finish', async () => {
    const View = extractView();
    const client = {
      adapters: { list: () => [{ agent: 'claude-code' }, { agent: 'codex' }] },
      sessions: {
        list: vi.fn((agent: string) => {
          if (agent === 'claude-code') {
            return Promise.resolve([{ sessionId: 'sess-a' }]);
          }
          return new Promise((resolve) => setTimeout(() => resolve([{ sessionId: 'sess-b' }]), 100));
        }),
      },
    } as unknown as Parameters<NonNullable<typeof SessionsViewPlugin>['register']>[0]['client'];
    const stream = new EventStream();
    const emit = vi.fn();
    const { lastFrame, rerender } = render(
      <View client={client} active={true} eventStream={stream} emit={emit} />,
    );
    await flush();
    rerender(<View client={client} active={true} eventStream={stream} emit={emit} />);
    expect(lastFrame()).toContain('sess-a');
    expect(lastFrame()).not.toContain('No sessions found.');
  });

  it('compacts and windows the list for narrow, short terminals', async () => {
    const View = extractView();
    const client = makeClient([
      { sessionId: 'sess-a', agent: 'claude-code' },
      { sessionId: 'sess-b', agent: 'claude-code' },
      { sessionId: 'sess-long-session-id-1234567890', agent: 'claude-code' },
      { sessionId: 'sess-d', agent: 'claude-code' },
      { sessionId: 'sess-e', agent: 'claude-code' },
      { sessionId: 'sess-f', agent: 'claude-code' },
    ]);
    const stream = new EventStream();
    const emit = vi.fn();
    const viewport = createViewport(42, 14);
    const { lastFrame, rerender } = render(
      <View
        client={client}
        active={true}
        eventStream={stream}
        emit={emit}
        viewport={viewport}
      />,
    );
    await flush();
    rerender(
      <View
        client={client}
        active={true}
        eventStream={stream}
        emit={emit}
        viewport={viewport}
      />,
    );
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Enter resume · d details · D diff · R refresh');
    expect(frame).toContain('… 2 more');
    expect(frame).toMatch(/sess.*….*7890/);
    expect(frame).not.toContain('sess-f');
  });
});
