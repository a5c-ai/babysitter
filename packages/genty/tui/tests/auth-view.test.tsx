import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import AuthPlugin from '../src/plugins/auth-view.js';
import { EventStream } from '../src/event-stream.js';

function extract() {
  const views: { component: React.ComponentType<unknown> }[] = [];
  AuthPlugin.register({
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

describe('auth-view', () => {
  it('renders status rows for each adapter', async () => {
    const View = extract();
    const stream = new EventStream();
    const client = {
      adapters: { list: () => [{ agent: 'claude' }, { agent: 'codex' }] },
      auth: {
        check: async (a: string) =>
          a === 'claude'
            ? { status: 'authenticated', method: 'oauth', identity: 'me@x.com' }
            : { status: 'unauthenticated', method: '-', identity: '' },
      },
    } as never;
    const { lastFrame, rerender } = render(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    await new Promise((r) => setTimeout(r, 20));
    rerender(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    const f = lastFrame() ?? '';
    expect(f).toContain('Authentication status');
    expect(f).toContain('claude');
    expect(f).toContain('me@x.com');
    expect(f).toContain('unauthenticated');
  });

  it('captures errors per agent without crashing', async () => {
    const View = extract();
    const stream = new EventStream();
    const client = {
      adapters: { list: () => [{ agent: 'broken' }] },
      auth: { check: async () => { throw new Error('nope'); } },
    } as never;
    const { lastFrame, rerender } = render(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    await new Promise((r) => setTimeout(r, 20));
    rerender(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    const f = lastFrame() ?? '';
    expect(f).toContain('error');
    expect(f).toContain('nope');
  });
});
