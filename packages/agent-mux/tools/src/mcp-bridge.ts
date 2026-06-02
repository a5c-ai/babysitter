import type { ToolRegistry } from './registry.js';
import type { ToolDescriptor } from './types.js';

/* ------------------------------------------------------------------ */
/*  MCP server configuration types                                     */
/* ------------------------------------------------------------------ */

export type McpTransport = 'stdio' | 'sse' | 'http' | 'streamable-http';

export interface McpServerConfig {
  id: string;
  name: string;
  transport: McpTransport;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

export interface McpToolDefinition {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/*  McpBridge                                                          */
/* ------------------------------------------------------------------ */

/**
 * Translates MCP tool definitions into ToolDescriptors and registers
 * them in a ToolRegistry.
 *
 * This bridge is purely declarative — it does NOT start MCP processes
 * or connect to servers.  Actual MCP execution is handled elsewhere
 * (e.g. babysitter-sdk).
 */
export class McpBridge {
  private readonly registry: ToolRegistry;
  private readonly servers = new Map<string, McpServerConfig>();

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  /* ---------------------------------------------------------------- */
  /*  Server lifecycle                                                 */
  /* ---------------------------------------------------------------- */

  /**
   * Register an MCP server and all of its advertised tools.
   *
   * Each tool is converted to a {@link ToolDescriptor} with
   * `source: 'mcp'` and `server` set to the config's `id`, then
   * inserted into the shared {@link ToolRegistry}.
   */
  registerServer(config: McpServerConfig, tools: McpToolDefinition[]): void {
    this.servers.set(config.id, config);

    const descriptors = tools.map((t) =>
      McpBridge.mcpToolToDescriptor(t, config.id),
    );

    // Use the registry's own server-level registration so the
    // ToolServer entry is also tracked.
    this.registry.registerServer({
      id: config.id,
      name: config.name,
      type: 'mcp',
      tools: descriptors,
    });
  }

  /**
   * Remove an MCP server and all tools that belong to it.
   */
  unregisterServer(serverId: string): void {
    this.servers.delete(serverId);
    this.registry.unregisterServer(serverId, /* removeTools */ true);
  }

  /* ---------------------------------------------------------------- */
  /*  Queries                                                          */
  /* ---------------------------------------------------------------- */

  /** Return all currently-registered MCP server configs. */
  listServers(): McpServerConfig[] {
    return [...this.servers.values()];
  }

  /** Return the tools currently registered for a specific server. */
  getServerTools(serverId: string): ToolDescriptor[] {
    return this.registry.listByServer(serverId);
  }

  /* ---------------------------------------------------------------- */
  /*  Static conversion helper                                         */
  /* ---------------------------------------------------------------- */

  /**
   * Convert a single MCP tool definition into a ToolDescriptor.
   *
   * The MCP `inputSchema` is stored as the descriptor's `parameters`
   * field (both are JSON Schema objects).
   */
  static mcpToolToDescriptor(
    tool: McpToolDefinition,
    serverId: string,
  ): ToolDescriptor {
    return {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
      source: 'mcp',
      sourceQualifier: serverId,
      server: serverId,
    };
  }
}
