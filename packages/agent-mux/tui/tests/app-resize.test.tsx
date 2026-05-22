import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'ink-testing-library';
import { App } from '../src/app.js';
import SessionsViewPlugin from '../src/plugins/sessions-view.js';

function makeClient() {
  return {
    adapters: {
      list: () => [{ agent: 'tui-e2e' }],
    },
    sessions: {
      list: async () => [
        { sessionId: 'sess-a' },
        { sessionId: 'sess-b' },
        { sessionId: 'sess-long-session-id-1234567890' },
        { sessionId: 'sess-d' },
        { sessionId: 'sess-e' },
      ],
    },
  } as never;
}

async function flush(ms = 30) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

describe('App resize handling', () => {
  it('reflows the sessions view when stdout emits resize', async () => {
    const client = makeClient();
    const rendered = render(<App client={client} plugins={[SessionsViewPlugin]} />);
    let width = 100;
    let height = 24;
    Object.defineProperty(rendered.stdout, 'columns', {
      configurable: true,
      get: () => width,
    });
    Object.defineProperty(rendered.stdout, 'rows', {
      configurable: true,
      get: () => height,
    });

    await flush();
    expect(rendered.lastFrame()).toContain('↑/↓ navigate · Enter: resume · d: details · D: mark/diff · R: refresh');

    width = 44;
    height = 14;
    rendered.stdout.emit('resize');
    await flush();

    const frame = rendered.lastFrame() ?? '';
    expect(frame).toContain('Enter resume · d details · D diff · R');
    expect(frame).toContain('refresh');
    expect(frame).toContain('… 1 more');
    expect(frame).toMatch(/sess.*….*7890/);
  });
});
