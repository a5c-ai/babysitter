import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import type { AgentMuxClient } from '@a5c-ai/agent-mux';
import { App } from '../src/app.js';
import { definePlugin, type TuiPlugin } from '../src/plugin.js';

const flush = () => new Promise((resolve) => setTimeout(resolve, 30));

function createClient(): AgentMuxClient {
  return {
    adapters: {
      list: () => [],
    },
    models: {
      models: () => [],
    },
    profiles: {
      list: vi.fn(async () => []),
      apply: vi.fn(async () => ({})),
    },
    sessions: {
      get: vi.fn(async () => ({ messages: [] })),
      diff: vi.fn(async () => ({
        summary: { added: 0, removed: 0, modified: 0, unchanged: 0 },
        operations: [],
      })),
    },
    run: vi.fn(),
  } as unknown as AgentMuxClient;
}

const chatPlugin: TuiPlugin = definePlugin({
  name: 'test:chat',
  register(ctx) {
    ctx.registerView({
      id: 'chat',
      title: 'Chat',
      hotkey: '1',
      component: () => <Text>Chat body</Text>,
    });
  },
});

const menuPlugin: TuiPlugin = definePlugin({
  name: 'test:menu',
  register(ctx) {
    ctx.registerView({
      id: 'menu',
      title: 'Menu',
      hotkey: '2',
      component: () => <Text>Menu body</Text>,
    });
  },
});

describe('App chat composer UX', () => {
  it('preserves the chat draft across a single escape and clears it on double escape', async () => {
    const { stdin, lastFrame } = render(
      <App client={createClient()} plugins={[chatPlugin, menuPlugin]} />,
    );

    await flush();
    stdin.write('hello');
    await flush();
    expect(lastFrame()).toContain('hello');

    stdin.write('\u001B');
    await flush();
    stdin.write('!');
    await flush();
    expect(lastFrame()).toContain('hello!');

    stdin.write('\u001B');
    await flush();
    stdin.write('\u001B');
    await flush();
    expect(lastFrame()).toContain('Menu body');

    stdin.write('1');
    await flush();
    expect(lastFrame()).toContain('Chat body');
    expect(lastFrame()).not.toContain('hello!');
  });
});
