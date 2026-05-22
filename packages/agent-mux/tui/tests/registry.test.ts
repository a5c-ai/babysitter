import { describe, it, expect } from 'vitest';
import { createRegistry, createContext, loadPlugins } from '../src/registry.js';
import { EventStream } from '../src/event-stream.js';
import type { TuiPlugin } from '../src/plugin.js';

describe('tui registry', () => {
  it('collects views, renderers, and commands from plugins', async () => {
    const reg = createRegistry();
    const emitted: unknown[] = [];
    const stream = new EventStream();
    const ctx = createContext({} as never, reg, (e) => emitted.push(e), stream);

    const plugin: TuiPlugin = {
      name: 'test',
      register(c) {
        c.registerView({ id: 'v1', title: 'V1', component: () => null });
        c.registerEventRenderer({
          id: 'r1',
          match: () => true,
          component: () => null,
        });
        c.registerCommand({ id: 'c1', hotkey: 'x', label: 'X', run: () => {} });
      },
    };

    await loadPlugins([plugin], ctx);

    expect(reg.views).toHaveLength(1);
    expect(reg.renderers).toHaveLength(1);
    expect(reg.commands).toHaveLength(1);
    expect(reg.views[0].id).toBe('v1');
  });

  it('emit() forwards status events to the host', () => {
    const reg = createRegistry();
    const emitted: unknown[] = [];
    const stream = new EventStream();
    const ctx = createContext({} as never, reg, (e) => emitted.push(e), stream);
    ctx.emit({ type: 'status', message: 'hi' });
    expect(emitted).toEqual([{ type: 'status', message: 'hi' }]);
  });

  it('exposes the optional kanban control plane on the plugin context', () => {
    const reg = createRegistry();
    const stream = new EventStream();
    const kanban = { loadOverview: async () => ({}) } as never;
    const ctx = createContext({} as never, reg, () => {}, stream, kanban);

    expect(ctx.kanban).toBe(kanban);
  });
});
