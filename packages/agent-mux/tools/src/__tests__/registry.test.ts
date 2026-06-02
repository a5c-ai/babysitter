import { describe, expect, it, beforeEach } from 'vitest';

import { ToolRegistry } from '../registry.js';
import type { ToolDescriptor, ToolServer } from '../types.js';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function makeTool(overrides: Partial<ToolDescriptor> = {}): ToolDescriptor {
  return {
    name: 'test_tool',
    description: 'A test tool',
    parameters: { type: 'object', properties: {} },
    source: 'builtin',
    ...overrides,
  };
}

function makeServer(
  id: string,
  tools: ToolDescriptor[],
  overrides: Partial<ToolServer> = {},
): ToolServer {
  return {
    id,
    name: `Server ${id}`,
    type: 'native',
    tools,
    ...overrides,
  };
}

/* ========================================================================== */
/*  ToolRegistry                                                              */
/* ========================================================================== */

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  /* ---------------------------------------------------------------------- */
  /*  Tool-level operations                                                  */
  /* ---------------------------------------------------------------------- */

  it('registers a tool and retrieves it by name', () => {
    const tool = makeTool({ name: 'file_read' });
    registry.register(tool);

    const result = registry.get('file_read');
    expect(result).toBeDefined();
    expect(result!.name).toBe('file_read');
    expect(result!.source).toBe('builtin');
  });

  it('registers multiple tools and lists all of them', () => {
    registry.register(makeTool({ name: 'tool_a' }));
    registry.register(makeTool({ name: 'tool_b' }));
    registry.register(makeTool({ name: 'tool_c' }));

    const all = registry.list();
    expect(all).toHaveLength(3);
    expect(all.map((t) => t.name).sort()).toEqual(['tool_a', 'tool_b', 'tool_c']);
  });

  it('registerAll registers an array of tools at once', () => {
    registry.registerAll([
      makeTool({ name: 'batch_a' }),
      makeTool({ name: 'batch_b' }),
    ]);

    expect(registry.size).toBe(2);
    expect(registry.has('batch_a')).toBe(true);
    expect(registry.has('batch_b')).toBe(true);
  });

  it('unregisters a tool and returns true when it existed', () => {
    registry.register(makeTool({ name: 'doomed' }));
    expect(registry.has('doomed')).toBe(true);

    const removed = registry.unregister('doomed');
    expect(removed).toBe(true);
    expect(registry.has('doomed')).toBe(false);
    expect(registry.get('doomed')).toBeUndefined();
  });

  it('unregister returns false for a non-existent tool', () => {
    expect(registry.unregister('ghost')).toBe(false);
  });

  it('returns undefined for an unknown tool name', () => {
    expect(registry.get('does_not_exist')).toBeUndefined();
  });

  it('has() returns false for missing tools', () => {
    expect(registry.has('missing')).toBe(false);
  });

  it('listByServer filters tools by server id', () => {
    registry.register(makeTool({ name: 'mcp_a', server: 'srv-1', source: 'mcp' }));
    registry.register(makeTool({ name: 'mcp_b', server: 'srv-1', source: 'mcp' }));
    registry.register(makeTool({ name: 'local_a', server: 'srv-2', source: 'builtin' }));
    registry.register(makeTool({ name: 'no_server', source: 'custom' }));

    const srv1Tools = registry.listByServer('srv-1');
    expect(srv1Tools).toHaveLength(2);
    expect(srv1Tools.map((t) => t.name).sort()).toEqual(['mcp_a', 'mcp_b']);

    const srv2Tools = registry.listByServer('srv-2');
    expect(srv2Tools).toHaveLength(1);
    expect(srv2Tools[0].name).toBe('local_a');

    expect(registry.listByServer('unknown')).toHaveLength(0);
  });

  it('duplicate name overwrites the previous descriptor', () => {
    registry.register(makeTool({ name: 'dup', description: 'original' }));
    expect(registry.get('dup')!.description).toBe('original');

    registry.register(makeTool({ name: 'dup', description: 'replaced' }));
    expect(registry.get('dup')!.description).toBe('replaced');
    expect(registry.size).toBe(1);
  });

  it('keeps duplicate tool names isolated by source qualifier', () => {
    registry.register(makeTool({ name: 'read', source: 'mcp', sourceQualifier: 'server-a', description: 'A' }));
    registry.register(makeTool({ name: 'read', source: 'mcp', sourceQualifier: 'server-b', description: 'B' }));

    expect(registry.size).toBe(2);
    expect(registry.get('read', 'mcp', 'server-a')!.description).toBe('A');
    expect(registry.get('read', 'mcp', 'server-b')!.description).toBe('B');
  });

  it('searches lightweight entries and lazily fetches schemas', async () => {
    registry.registerLoader('plugin', async (entry) => ({
      inputSchema: { type: 'object', properties: { plugin: { const: entry.sourceQualifier } } },
      outputSchema: { type: 'object' },
    }));
    registry.registerTools([
      {
        name: 'deploy',
        description: 'Deploy a plugin',
        source: 'plugin',
        sourceQualifier: 'shipper',
        metadata: { tags: ['release'] },
      },
    ]);

    expect(registry.searchTools('deploy')).toEqual([
      expect.objectContaining({ name: 'deploy', source: 'plugin', sourceQualifier: 'shipper' }),
    ]);

    const resolved = await registry.fetchSchema('deploy', 'plugin', 'shipper');
    expect(resolved).toEqual(expect.objectContaining({
      name: 'deploy',
      schema: {
        inputSchema: { type: 'object', properties: { plugin: { const: 'shipper' } } },
        outputSchema: { type: 'object' },
      },
    }));
    expect(registry.loadedSchemaCount).toBe(1);
  });

  it('size reflects the current tool count', () => {
    expect(registry.size).toBe(0);
    registry.register(makeTool({ name: 'a' }));
    expect(registry.size).toBe(1);
    registry.register(makeTool({ name: 'b' }));
    expect(registry.size).toBe(2);
    registry.unregister('a');
    expect(registry.size).toBe(1);
  });

  /* ---------------------------------------------------------------------- */
  /*  Server-level operations                                                */
  /* ---------------------------------------------------------------------- */

  it('registerServer adds server entry and all its tools', () => {
    const tools = [
      makeTool({ name: 'srv_tool_a', source: 'mcp' }),
      makeTool({ name: 'srv_tool_b', source: 'mcp' }),
    ];
    const server = makeServer('s1', tools);

    registry.registerServer(server);

    // Server is retrievable
    expect(registry.getServer('s1')).toBeDefined();
    expect(registry.getServer('s1')!.name).toBe('Server s1');

    // All tools are registered with server association
    expect(registry.has('srv_tool_a')).toBe(true);
    expect(registry.has('srv_tool_b')).toBe(true);
    expect(registry.get('srv_tool_a')!.server).toBe('s1');
    expect(registry.get('srv_tool_b')!.server).toBe('s1');
  });

  it('unregisterServer removes server and all its tools by default', () => {
    const tools = [
      makeTool({ name: 'remove_a', source: 'mcp' }),
      makeTool({ name: 'remove_b', source: 'mcp' }),
    ];
    registry.registerServer(makeServer('s2', tools));

    expect(registry.has('remove_a')).toBe(true);
    expect(registry.has('remove_b')).toBe(true);

    const removed = registry.unregisterServer('s2');
    expect(removed).toBe(true);
    expect(registry.getServer('s2')).toBeUndefined();
    expect(registry.has('remove_a')).toBe(false);
    expect(registry.has('remove_b')).toBe(false);
  });

  it('unregisterServer with removeTools=false keeps tools', () => {
    const tools = [makeTool({ name: 'keep_me', source: 'mcp' })];
    registry.registerServer(makeServer('s3', tools));

    registry.unregisterServer('s3', false);
    expect(registry.getServer('s3')).toBeUndefined();
    expect(registry.has('keep_me')).toBe(true);
  });

  it('listServers returns all registered servers', () => {
    registry.registerServer(makeServer('a', []));
    registry.registerServer(makeServer('b', []));

    const servers = registry.listServers();
    expect(servers).toHaveLength(2);
    expect(servers.map((s) => s.id).sort()).toEqual(['a', 'b']);
  });

  it('clear removes all tools and servers', () => {
    registry.register(makeTool({ name: 'solo' }));
    registry.registerServer(makeServer('x', [makeTool({ name: 'grouped' })]));

    registry.clear();

    expect(registry.size).toBe(0);
    expect(registry.list()).toHaveLength(0);
    expect(registry.listServers()).toHaveLength(0);
  });
});
