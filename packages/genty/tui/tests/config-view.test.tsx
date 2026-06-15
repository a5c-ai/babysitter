import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import ConfigPlugin from '../src/plugins/config-view.js';
import { EventStream } from '../src/event-stream.js';

function extract() {
  const views: { component: React.ComponentType<unknown> }[] = [];
  ConfigPlugin.register({
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

describe('config-view', () => {
  it('lists agents and renders selected config as JSON', async () => {
    const View = extract();
    const stream = new EventStream();
    const client = {
      adapters: { list: () => [{ agent: 'claude' }, { agent: 'codex' }] },
      config: {
        get: async (a: string) => ({ agent: a, model: 'sonnet' }),
      },
    } as never;
    const { lastFrame, rerender } = render(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    await new Promise((r) => setTimeout(r, 100));
    rerender(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    const f = lastFrame() ?? '';
    expect(f).toContain('Per-agent configuration');
    expect(f).toContain('claude');
    expect(f).toContain('codex');
    expect(f).toContain('sonnet');
  });

  it('shows error when config.get throws', async () => {
    const View = extract();
    const stream = new EventStream();
    const client = {
      adapters: { list: () => [{ agent: 'x' }] },
      config: { get: async () => { throw new Error('boom'); } },
    } as never;
    const { lastFrame, rerender } = render(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    await new Promise((r) => setTimeout(r, 100));
    rerender(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    expect(lastFrame() ?? '').toContain('boom');
  });
});
