import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { EventStream } from '../src/event-stream.js';
import AdaptersViewPlugin from '../src/plugins/adapters-view.js';
import ModelsViewPlugin from '../src/plugins/models-view.js';
import ProfilesViewPlugin from '../src/plugins/profiles-view.js';
import PluginsViewPlugin from '../src/plugins/plugins-view.js';

function extract(plugin: typeof AdaptersViewPlugin) {
  const views: { component: React.ComponentType<unknown> }[] = [];
  plugin.register({
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

const flush = () => new Promise((r) => setTimeout(r, 20));

describe('AdaptersView', () => {
  it('lists adapters with agent, displayName, source', () => {
    const View = extract(AdaptersViewPlugin);
    const client = {
      adapters: {
        list: () => [
          { agent: 'claude-code', displayName: 'Claude Code', cliCommand: 'claude', source: 'built-in' },
          { agent: 'codex', displayName: 'OpenAI Codex', cliCommand: 'codex', source: 'plugin' },
        ],
      },
    } as never;
    const stream = new EventStream();
    const { lastFrame, rerender } = render(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    rerender(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    const f = lastFrame() ?? '';
    expect(f).toContain('claude-code');
    expect(f).toContain('Claude Code');
    expect(f).toContain('built-in');
    expect(f).toContain('plugin');
  });
});

describe('ModelsView', () => {
  it('lists models per agent and marks default', () => {
    const View = extract(ModelsViewPlugin);
    const client = {
      adapters: { list: () => [{ agent: 'claude-code' }] },
      models: {
        catalog: () => [
          { modelId: 'opus', provider: 'anthropic', protocol: 'messages', source: 'bundled', isDefault: false },
          { modelId: 'sonnet', provider: 'anthropic', protocol: 'messages', source: 'bundled', isDefault: true },
        ],
      },
    } as never;
    const stream = new EventStream();
    const { lastFrame, rerender } = render(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    rerender(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    const f = lastFrame() ?? '';
    expect(f).toContain('opus');
    expect(f).toContain('sonnet');
    expect(f).toContain('anthropic/messages/bundled');
    expect(f).toContain('default');
  });
});

describe('ProfilesView', () => {
  it('renders profiles from client.profiles.list()', async () => {
    const View = extract(ProfilesViewPlugin);
    const client = {
      profiles: {
        list: vi.fn(async () => [
          { name: 'p1', scope: 'global', agent: 'claude-code', model: 'sonnet', hasGlobalOverride: false },
          { name: 'p2', scope: 'project', agent: 'codex', hasGlobalOverride: false, corrupt: true },
        ]),
      },
    } as never;
    const stream = new EventStream();
    const { lastFrame, rerender } = render(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    await flush();
    rerender(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    const f = lastFrame() ?? '';
    expect(f).toContain('p1');
    expect(f).toContain('p2');
    expect(f).toContain('corrupt');
  });
});

describe('PluginsView', () => {
  it('lists agent-native plugins per adapter, tolerating missing support', async () => {
    const View = extract(PluginsViewPlugin);
    const client = {
      adapters: {
        list: () => [{ agent: 'claude-code' }, { agent: 'codex' }],
      },
      plugins: {
        list: vi.fn(async (a: string) => {
          if (a === 'claude-code') return [{ name: 'fs-watcher', enabled: true, version: '1.2.0' }];
          throw new Error('not supported');
        }),
      },
    } as never;
    const stream = new EventStream();
    const { lastFrame, rerender } = render(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    await flush();
    rerender(<View client={client} active={true} eventStream={stream} emit={() => {}} />);
    const f = lastFrame() ?? '';
    expect(f).toContain('fs-watcher');
    expect(f).toContain('1.2.0');
    expect(f).not.toContain('codex'); // codex listing failed → skipped silently
  });
});
