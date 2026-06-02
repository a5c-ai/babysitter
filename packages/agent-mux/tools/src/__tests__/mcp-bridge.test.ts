import { describe, expect, it, beforeEach } from 'vitest';

import { McpBridge } from '../mcp-bridge.js';
import type { McpServerConfig, McpToolDefinition } from '../mcp-bridge.js';
import { ToolRegistry } from '../registry.js';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function makeServerConfig(overrides: Partial<McpServerConfig> = {}): McpServerConfig {
  return {
    id: 'mcp-srv-1',
    name: 'Test MCP Server',
    transport: 'stdio',
    command: 'node',
    args: ['server.js'],
    ...overrides,
  };
}

function makeMcpTool(overrides: Partial<McpToolDefinition> = {}): McpToolDefinition {
  return {
    name: 'mcp_tool',
    description: 'An MCP tool',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
      },
    },
    ...overrides,
  };
}

/* ========================================================================== */
/*  McpBridge                                                                 */
/* ========================================================================== */

describe('McpBridge', () => {
  let registry: ToolRegistry;
  let bridge: McpBridge;

  beforeEach(() => {
    registry = new ToolRegistry();
    bridge = new McpBridge(registry);
  });

  it('registerServer adds tools to the underlying registry', () => {
    const config = makeServerConfig({ id: 'srv-a', name: 'Server A' });
    const tools = [
      makeMcpTool({ name: 'search' }),
      makeMcpTool({ name: 'fetch' }),
    ];

    bridge.registerServer(config, tools);

    expect(registry.has('search')).toBe(true);
    expect(registry.has('fetch')).toBe(true);
    expect(registry.size).toBe(2);
  });

  it('unregisterServer removes tools from the registry', () => {
    const config = makeServerConfig({ id: 'srv-b' });
    bridge.registerServer(config, [makeMcpTool({ name: 'tool_to_remove' })]);

    expect(registry.has('tool_to_remove')).toBe(true);

    bridge.unregisterServer('srv-b');

    expect(registry.has('tool_to_remove')).toBe(false);
    expect(registry.getServer('srv-b')).toBeUndefined();
  });

  it('listServers returns all registered MCP server configs', () => {
    bridge.registerServer(makeServerConfig({ id: 's1', name: 'S1' }), []);
    bridge.registerServer(makeServerConfig({ id: 's2', name: 'S2' }), []);

    const servers = bridge.listServers();
    expect(servers).toHaveLength(2);
    expect(servers.map((s) => s.id).sort()).toEqual(['s1', 's2']);
  });

  it('listServers returns empty array when nothing is registered', () => {
    expect(bridge.listServers()).toEqual([]);
  });

  it('getServerTools returns the correct tools for a server', () => {
    const config = makeServerConfig({ id: 'query-srv' });
    bridge.registerServer(config, [
      makeMcpTool({ name: 'q_search' }),
      makeMcpTool({ name: 'q_list' }),
    ]);

    const tools = bridge.getServerTools('query-srv');
    expect(tools).toHaveLength(2);
    expect(tools.map((t) => t.name).sort()).toEqual(['q_list', 'q_search']);
  });

  it('getServerTools returns empty array for unknown server', () => {
    expect(bridge.getServerTools('ghost-server')).toEqual([]);
  });

  /* ---------------------------------------------------------------------- */
  /*  mcpToolToDescriptor (static)                                           */
  /* ---------------------------------------------------------------------- */

  describe('mcpToolToDescriptor', () => {
    it('sets source to "mcp" and correct server id', () => {
      const mcpTool = makeMcpTool({ name: 'convert_me' });

      const descriptor = McpBridge.mcpToolToDescriptor(mcpTool, 'my-server');

      expect(descriptor.name).toBe('convert_me');
      expect(descriptor.source).toBe('mcp');
      expect(descriptor.server).toBe('my-server');
    });

    it('maps inputSchema to parameters', () => {
      const schema = {
        type: 'object',
        properties: {
          path: { type: 'string' },
          recursive: { type: 'boolean' },
        },
        required: ['path'],
      };

      const mcpTool = makeMcpTool({
        name: 'file_list',
        inputSchema: schema as Record<string, unknown>,
      });

      const descriptor = McpBridge.mcpToolToDescriptor(mcpTool, 'fs-server');

      expect(descriptor.parameters).toEqual(schema);
    });

    it('preserves description from MCP tool definition', () => {
      const mcpTool = makeMcpTool({
        name: 'described_tool',
        description: 'Does important things',
      });

      const descriptor = McpBridge.mcpToolToDescriptor(mcpTool, 'srv');

      expect(descriptor.description).toBe('Does important things');
    });

    it('handles MCP tool with no inputSchema', () => {
      const mcpTool: McpToolDefinition = {
        name: 'no_schema',
        description: 'Schemaless',
      };

      const descriptor = McpBridge.mcpToolToDescriptor(mcpTool, 'srv');

      expect(descriptor.name).toBe('no_schema');
      expect(descriptor.parameters).toBeUndefined();
      expect(descriptor.source).toBe('mcp');
    });
  });
});
