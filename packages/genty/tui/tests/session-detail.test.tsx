import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { SessionDetailView } from '../src/plugins/session-detail-view.js';
import { EventStream } from '../src/event-stream.js';

const flush = () => new Promise((r) => setTimeout(r, 20));

function makeClient(opts: { get?: unknown; export?: unknown } = {}) {
  return {
    sessions: {
      get: vi.fn().mockResolvedValue(
        opts.get ?? {
          sessionId: 's1',
          turnCount: 4,
          totalCost: 0.1234,
          createdAt: '2026-04-13T00:00:00Z',
          title: 'demo',
        },
      ),
      export: vi.fn().mockResolvedValue(opts.export ?? '{"ok":true}'),
    },
  } as never;
}

describe('SessionDetailView', () => {
  it('shows loading then renders metadata', async () => {
    const client = makeClient();
    const stream = new EventStream();
    const { lastFrame, rerender } = render(
      <SessionDetailView
        client={client}
        active={true}
        eventStream={stream}
        emit={() => {}}
        selection={{ agent: 'claude-code', sessionId: 's1' }}
      />,
    );
    expect(lastFrame()).toContain('Loading');
    await flush();
    rerender(
      <SessionDetailView
        client={client}
        active={true}
        eventStream={stream}
        emit={() => {}}
        selection={{ agent: 'claude-code', sessionId: 's1' }}
      />,
    );
    const f = lastFrame() ?? '';
    expect(f).toContain('claude-code');
    expect(f).toContain('s1');
    expect(f).toContain('turns: 4');
    expect(f).toContain('$0.1234');
    expect(f).toContain('demo');
    expect(f).toContain('m: export markdown');
    expect(f).toContain('w: follow in chat');
    expect(f).toContain('r: resume');
  });

  it('shows hint when no selection', () => {
    const client = makeClient();
    const stream = new EventStream();
    const { lastFrame } = render(
      <SessionDetailView
        client={client}
        active={true}
        eventStream={stream}
        emit={() => {}}
      />,
    );
    expect(lastFrame()).toContain('No session selected');
  });

  it('e key triggers export json and emits status', async () => {
    const client = makeClient();
    const stream = new EventStream();
    const emit = vi.fn();
    const { stdin, rerender } = render(
      <SessionDetailView
        client={client}
        active={true}
        eventStream={stream}
        emit={emit}
        selection={{ agent: 'claude-code', sessionId: 's1' }}
      />,
    );
    await flush();
    rerender(
      <SessionDetailView
        client={client}
        active={true}
        eventStream={stream}
        emit={emit}
        selection={{ agent: 'claude-code', sessionId: 's1' }}
      />,
    );
    stdin.write('e');
    await flush();
    expect(client.sessions.export).toHaveBeenCalledWith('claude-code', 's1', 'json');
    const statusCall = emit.mock.calls.find((c) => c[0]?.type === 'status');
    expect(statusCall?.[0]?.message).toMatch(/Exported json/);
  });

  it('m key triggers markdown export, updates the status, and renders the export note', async () => {
    const client = makeClient({ export: '# Session s1' });
    const stream = new EventStream();
    const emit = vi.fn();
    const { stdin, lastFrame, rerender } = render(
      <SessionDetailView
        client={client}
        active={true}
        eventStream={stream}
        emit={emit}
        selection={{ agent: 'claude-code', sessionId: 's1' }}
      />,
    );
    await flush();
    rerender(
      <SessionDetailView
        client={client}
        active={true}
        eventStream={stream}
        emit={emit}
        selection={{ agent: 'claude-code', sessionId: 's1' }}
      />,
    );
    stdin.write('m');
    await flush();
    expect(client.sessions.export).toHaveBeenCalledWith('claude-code', 's1', 'markdown');
    expect(emit).toHaveBeenCalledWith({
      type: 'status',
      message: 'Exported markdown (12 chars)',
    });
    expect(lastFrame()).toContain('exported markdown (12 chars)');
  });

  it('w key follows the selected session in chat via session selection', async () => {
    const client = makeClient();
    const stream = new EventStream();
    const emit = vi.fn<(event: unknown) => void>();
    const { stdin, rerender, lastFrame } = render(
      <SessionDetailView
        client={client}
        active={true}
        eventStream={stream}
        emit={emit}
        selection={{ agent: 'claude-code', sessionId: 's1' }}
      />,
    );
    await flush();
    rerender(
      <SessionDetailView
        client={client}
        active={true}
        eventStream={stream}
        emit={emit}
        selection={{ agent: 'claude-code', sessionId: 's1' }}
      />,
    );
    stdin.write('w');
    await flush();
    expect(lastFrame()).toContain('live watch follows the selected session in chat');
    expect(emit.mock.calls.map((c) => c[0])).toContainEqual({
      type: 'status',
      message: 'Following claude-code/s1 in chat…',
    });
    expect(emit.mock.calls.map((c) => c[0])).toContainEqual({
      type: 'session:select',
      agent: 'claude-code',
      sessionId: 's1',
    });
    expect(emit.mock.calls.map((c) => c[0])).toContainEqual({
      type: 'view:switch',
      id: 'chat',
    });
    expect(stream.snapshot()).toEqual([]);
  });

  it('r key emits session selection and switches to chat', async () => {
    const client = makeClient();
    const stream = new EventStream();
    const emit = vi.fn();
    const { stdin, rerender } = render(
      <SessionDetailView
        client={client}
        active={true}
        eventStream={stream}
        emit={emit}
        selection={{ agent: 'claude-code', sessionId: 's1' }}
      />,
    );
    await flush();
    rerender(
      <SessionDetailView
        client={client}
        active={true}
        eventStream={stream}
        emit={emit}
        selection={{ agent: 'claude-code', sessionId: 's1' }}
      />,
    );
    stdin.write('r');
    await flush();
    expect(emit.mock.calls.map((c) => c[0])).toContainEqual({
      type: 'session:select',
      agent: 'claude-code',
      sessionId: 's1',
    });
    expect(emit.mock.calls.map((c) => c[0])).toContainEqual({
      type: 'view:switch',
      id: 'chat',
    });
  });

  it('Esc emits view:switch back to sessions', async () => {
    const client = makeClient();
    const stream = new EventStream();
    const emit = vi.fn();
    const { stdin, rerender } = render(
      <SessionDetailView
        client={client}
        active={true}
        eventStream={stream}
        emit={emit}
        selection={{ agent: 'claude-code', sessionId: 's1' }}
      />,
    );
    await flush();
    rerender(
      <SessionDetailView
        client={client}
        active={true}
        eventStream={stream}
        emit={emit}
        selection={{ agent: 'claude-code', sessionId: 's1' }}
      />,
    );
    stdin.write('\u001B');
    await new Promise((r) => setTimeout(r, 60));
    const sw = emit.mock.calls.find((c) => c[0]?.type === 'view:switch');
    expect(sw?.[0]?.id).toBe('sessions');
  });

  it('uses the supplied return view when backing out of detail mode', async () => {
    const client = makeClient();
    const stream = new EventStream();
    const emit = vi.fn();
    const { stdin, rerender } = render(
      <SessionDetailView
        client={client}
        active={true}
        eventStream={stream}
        emit={emit}
        selection={{ agent: 'claude-code', sessionId: 's1' }}
        returnViewId="kanban"
      />,
    );
    await flush();
    rerender(
      <SessionDetailView
        client={client}
        active={true}
        eventStream={stream}
        emit={emit}
        selection={{ agent: 'claude-code', sessionId: 's1' }}
        returnViewId="kanban"
      />,
    );
    stdin.write('b');
    await flush();
    expect(emit.mock.calls.map((c) => c[0])).toContainEqual({
      type: 'view:switch',
      id: 'kanban',
    });
  });
});
