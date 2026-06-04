import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import ModelsPlugin from '../src/plugins/models-view.js';
import { EventStream } from '../src/event-stream.js';

function extract() {
  const views: { component: React.ComponentType<unknown> }[] = [];
  ModelsPlugin.register({
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

describe('models-view', () => {
  it('renders provider/protocol/source details for catalog entries', async () => {
    const View = extract();
    const stream = new EventStream();
    const client = {
      adapters: {
        list: () => [{ agent: 'claude' }],
      },
      models: {
        catalog: () => [
          {
            agent: 'claude',
            modelId: 'claude-sonnet-4-20250514',
            provider: 'anthropic',
            protocol: 'messages',
            source: 'bundled',
            isDefault: true,
          },
        ],
      },
    } as never;
    const { lastFrame, rerender } = render(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    await new Promise((r) => setTimeout(r, 20));
    rerender(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('Models per agent');
    expect(frame).toContain('claude');
    expect(frame).toContain('claude-sonnet-4-20250514');
    expect(frame).toContain('anthropic/messages/bundled');
    expect(frame).toContain('(default)');
  });
});
