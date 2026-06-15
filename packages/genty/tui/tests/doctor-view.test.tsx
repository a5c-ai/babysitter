import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import DoctorPlugin from '../src/plugins/doctor-view.js';
import { EventStream } from '../src/event-stream.js';

function extract() {
  const views: { component: React.ComponentType<unknown> }[] = [];
  DoctorPlugin.register({
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

describe('doctor-view', () => {
  it('renders capability matrix per agent', async () => {
    const View = extract();
    const stream = new EventStream();
    const client = {
      adapters: {
        list: () => [{ agent: 'claude-code' }, { agent: 'codex' }],
        capabilities: (a: string) =>
          a === 'claude-code'
            ? { supportsMCP: true, supportsPlugins: true, supportsThinking: true }
            : { supportsMCP: false, supportsPlugins: false },
      },
    } as never;
    const { lastFrame, rerender } = render(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    await new Promise((r) => setTimeout(r, 20));
    rerender(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    const f = lastFrame() ?? '';
    expect(f).toContain('Adapter capability matrix');
    expect(f).toContain('claude-code');
    expect(f).toContain('codex');
    expect(f).toContain('mcp');
    expect(f).toContain('yes');
    expect(f).toContain('no');
  });
});
