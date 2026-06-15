import { describe, it, expect, vi } from 'vitest';
import { ExtensionRegistry } from './registry.js';
import type { GentyExtension } from './types.js';

function makeExtension(name: string, activate?: (ctx: any) => void): GentyExtension {
  return {
    name,
    activate: activate ?? (() => {}),
  };
}

describe('ExtensionRegistry', () => {
  it('activates an extension and makes its tools available', async () => {
    const registry = new ExtensionRegistry();
    const ext = makeExtension('test-ext', (ctx) => {
      ctx.registerTool({
        name: 'greet',
        description: 'Say hello',
        inputSchema: { type: 'object', properties: { name: { type: 'string' } } },
        handler: async (input: Record<string, unknown>) => `Hello ${input.name}`,
      });
    });

    await registry.activate(ext);

    const tools = registry.getAllTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('ext:test-ext:greet');
    const result = await tools[0].handler({ name: 'World' });
    expect(result).toBe('Hello World');
  });

  it('registers commands with namespaced names', async () => {
    const registry = new ExtensionRegistry();
    const handler = vi.fn();
    await registry.activate(makeExtension('my-ext', (ctx) => {
      ctx.registerCommand('do-thing', handler);
    }));

    const cmd = registry.getCommand('ext:my-ext:do-thing');
    expect(cmd).toBe(handler);
  });

  it('fires events to registered listeners', async () => {
    const registry = new ExtensionRegistry();
    const listener = vi.fn();
    await registry.activate(makeExtension('evt-ext', (ctx) => {
      ctx.onEvent('turnStart', listener);
    }));

    await registry.emit({ type: 'turnStart', timestamp: new Date().toISOString(), data: { turn: 1 } });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'turnStart' }));
  });

  it('deactivates an extension and removes its artifacts', async () => {
    const registry = new ExtensionRegistry();
    const deactivate = vi.fn();
    await registry.activate({
      name: 'removable',
      activate: (ctx) => {
        ctx.registerTool({ name: 't', description: '', inputSchema: {}, handler: async () => null });
        ctx.registerCommand('c', () => {});
        ctx.registerStatusBarItem({ id: 's', text: 'test' });
      },
      deactivate,
    });

    expect(registry.getAllTools()).toHaveLength(1);
    expect(registry.getCommand('ext:removable:c')).toBeTruthy();

    await registry.deactivate('removable');

    expect(deactivate).toHaveBeenCalled();
    expect(registry.getAllTools()).toHaveLength(0);
    expect(registry.getCommand('ext:removable:c')).toBeUndefined();
    expect(registry.getExtensionNames()).not.toContain('removable');
  });

  it('prevents duplicate extension registration', async () => {
    const registry = new ExtensionRegistry();
    await registry.activate(makeExtension('dup'));
    await expect(registry.activate(makeExtension('dup'))).rejects.toThrow('already registered');
  });

  it('registers status bar items sorted by priority', async () => {
    const registry = new ExtensionRegistry();
    await registry.activate(makeExtension('bar', (ctx) => {
      ctx.registerStatusBarItem({ id: 'low', text: 'Low', priority: 1 });
      ctx.registerStatusBarItem({ id: 'high', text: 'High', priority: 10 });
      ctx.registerStatusBarItem({ id: 'mid', text: 'Mid', priority: 5 });
    }));

    const items = registry.getStatusBarItems();
    expect(items[0].text).toBe('High');
    expect(items[1].text).toBe('Mid');
    expect(items[2].text).toBe('Low');
  });

  it('context providers are accessible', async () => {
    const registry = new ExtensionRegistry();
    await registry.activate(makeExtension('ctx-ext', (ctx) => {
      ctx.injectContext({
        id: 'rag',
        provide: async (turn: { sessionId: string; turnNumber: number; messageHistory: unknown[]; pendingTools: string[] }) => ({
          messages: [{ role: 'system', content: `Turn ${turn.turnNumber} context` }],
        }),
      });
    }));

    const providers = registry.getContextProviders();
    expect(providers).toHaveLength(1);
    const injection = await providers[0].provide({ sessionId: 's', turnNumber: 3, messageHistory: [], pendingTools: [] });
    expect(injection.messages?.[0].content).toContain('Turn 3');
  });

  it('event handler errors do not crash the host', async () => {
    const registry = new ExtensionRegistry();
    await registry.activate(makeExtension('crasher', (ctx) => {
      ctx.onEvent('turnStart', () => { throw new Error('extension bug'); });
    }));

    await expect(registry.emit({ type: 'turnStart', timestamp: '', data: null })).resolves.toBeUndefined();
  });

  it('config is namespaced per extension', async () => {
    const registry = new ExtensionRegistry();
    registry.setConfig('ext:my-ext:theme', 'dark');

    await registry.activate(makeExtension('my-ext', (ctx) => {
      const theme = ctx.getConfig('theme', 'light');
      expect(theme).toBe('dark');
    }));
  });

  it('deactivateAll cleans up everything', async () => {
    const registry = new ExtensionRegistry();
    await registry.activate(makeExtension('a', (ctx) => { ctx.registerTool({ name: 't', description: '', inputSchema: {}, handler: async () => null }); }));
    await registry.activate(makeExtension('b', (ctx) => { ctx.registerCommand('c', () => {}); }));

    expect(registry.getExtensionNames()).toHaveLength(2);
    await registry.deactivateAll();
    expect(registry.getExtensionNames()).toHaveLength(0);
    expect(registry.getAllTools()).toHaveLength(0);
  });

  it('enforces permission policy on activation', async () => {
    const registry = new ExtensionRegistry();
    registry.setPermissionPolicy(new Set(['tools:register']));

    const ext: GentyExtension = {
      name: 'needs-network',
      permissions: ['network:outbound'],
      activate: () => {},
    };

    await expect(registry.activate(ext)).rejects.toThrow('requires permission "network:outbound"');
  });

  it('allows extensions with permitted permissions', async () => {
    const registry = new ExtensionRegistry();
    registry.setPermissionPolicy(new Set(['tools:register', 'events:listen']));

    const ext: GentyExtension = {
      name: 'safe-ext',
      permissions: ['tools:register'],
      activate: (ctx) => { ctx.registerTool({ name: 't', description: '', inputSchema: {}, handler: async () => null }); },
    };

    await expect(registry.activate(ext)).resolves.toBeUndefined();
    expect(registry.getAllTools()).toHaveLength(1);
  });

  it('detects key binding conflicts between extensions', async () => {
    const registry = new ExtensionRegistry();
    await registry.activate(makeExtension('ext-a', (ctx) => { ctx.registerKeyBinding('ctrl+p', () => {}); }));

    await expect(registry.activate(makeExtension('ext-b', (ctx) => {
      ctx.registerKeyBinding('ctrl+p', () => {});
    }))).rejects.toThrow('already registered by extension "ext-a"');
  });

  it('cleans up event listeners on deactivation', async () => {
    const registry = new ExtensionRegistry();
    const handler = vi.fn();
    await registry.activate(makeExtension('evt-ext', (ctx) => {
      ctx.onEvent('turnEnd', handler);
    }));

    await registry.emit({ type: 'turnEnd', timestamp: '', data: null });
    expect(handler).toHaveBeenCalledTimes(1);

    await registry.deactivate('evt-ext');
    handler.mockClear();

    await registry.emit({ type: 'turnEnd', timestamp: '', data: null });
    expect(handler).not.toHaveBeenCalled();
  });
});
