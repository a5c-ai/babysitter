import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import McpPlugin from '../src/plugins/mcp-view.js';
import { EventStream } from '../src/event-stream.js';

function extract() {
  const views: { component: React.ComponentType<unknown> }[] = [];
  McpPlugin.register({
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
    emit: () => void;
  }>;
}

const flush = () => new Promise((r) => setTimeout(r, 30));

describe('mcp-view', () => {
  it('lists installed plugins from client.plugins.list per agent', async () => {
    const View = extract();
    const stream = new EventStream();
    const client = {
      adapters: { list: () => [{ agent: 'claude-code' }, { agent: 'codex' }] },
      plugins: {
        list: vi.fn(async (agent: string) =>
          agent === 'claude-code'
            ? [{ pluginId: 'filesystem', enabled: true }, { pluginId: 'github', enabled: true }]
            : [],
        ),
      },
    } as never;
    const { lastFrame, rerender } = render(
      <View client={client} active={true} eventStream={stream} emit={() => {}} />,
    );
    await flush();
    rerender(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    const f = lastFrame() ?? '';
    expect(f).toContain('filesystem');
    expect(f).toContain('github');
    expect(f).toContain('claude-code');
    // codex throws capability error → suppressed (not surfaced as "(error)" row)
    expect(f).not.toContain('(error)');
  });

  it('shows install hint when no plugins installed', async () => {
    const View = extract();
    const stream = new EventStream();
    const client = {
      adapters: { list: () => [{ agent: 'claude-code' }] },
      plugins: { list: vi.fn(async () => []) },
    } as never;
    const { lastFrame, rerender } = render(
      <View client={client} active={true} eventStream={stream} emit={() => {}} />,
    );
    await flush();
    rerender(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    expect(lastFrame()).toContain('amux mcp install');
  });
});
