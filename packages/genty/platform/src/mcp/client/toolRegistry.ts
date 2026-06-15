/**
 * Status: Integrated with agent-platform MCP orchestration wiring.
 * Moved from @a5c-ai/babysitter-sdk.
 * GAP-TOOLS-025: MCP Tool Registry.
 *
 * Maintains a cached index of tools across all connected MCP servers.
 * Supports refresh, search, and lookup by qualified name (server:tool).
 */

import type { McpToolInfo } from "./types";
import type { McpClientManager } from "./manager";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface McpToolRegistryOptions {
  /** TTL for cached tool listings (ms). 0 = never expire (infinite cache). Default: 60000. */
  cacheTtlMs?: number;
  unifiedRegistry?: UnifiedToolRegistryLike;
  mcpBridge?: McpBridgeLike;
}

interface CachedToolSet {
  tools: McpToolInfo[];
  fetchedAt: number;
}

interface UnifiedToolRegistryLike {
  registerServer(server: {
    id: string;
    name: string;
    type: "mcp";
    tools: Array<{
      name: string;
      description?: string;
      parameters?: Record<string, unknown>;
      source: "mcp";
      sourceQualifier?: string;
      server?: string;
    }>;
  }): void;
  unregisterServer?(serverId: string, removeTools?: boolean): boolean;
  list?(): Array<{ name: string; description?: string; source: string; sourceQualifier?: string; server?: string }>;
  listByServer?(serverId: string): Array<{
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
    source: string;
    sourceQualifier?: string;
    server?: string;
  }>;
  searchTools?(query: string): Array<{ name: string; description?: string; source: string; sourceQualifier?: string }>;
  get?(name: string, source?: "mcp", sourceQualifier?: string): {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
    source: string;
    sourceQualifier?: string;
    server?: string;
  } | undefined;
}

interface McpBridgeLike {
  registerServer(
    config: { id: string; name: string; transport: "stdio" },
    tools: Array<{ name: string; description?: string; inputSchema?: Record<string, unknown> }>,
  ): void;
  unregisterServer?(serverId: string): void;
}

// ---------------------------------------------------------------------------
// McpToolRegistry
// ---------------------------------------------------------------------------

export class McpToolRegistry {
  private readonly _manager: McpClientManager;
  private readonly _cacheTtlMs: number;
  private readonly _unifiedRegistry: UnifiedToolRegistryLike | undefined;
  private readonly _mcpBridge: McpBridgeLike | undefined;
  private readonly _cache = new Map<string, CachedToolSet>();

  constructor(manager: McpClientManager, options?: McpToolRegistryOptions) {
    this._manager = manager;
    this._cacheTtlMs = options?.cacheTtlMs ?? 60_000;
    this._unifiedRegistry = options?.unifiedRegistry;
    this._mcpBridge = options?.mcpBridge;
  }

  /**
   * Refresh tool listings from all connected servers.
   * Returns the total number of tools indexed.
   */
  async refreshAll(): Promise<number> {
    const connections = this._manager.listConnections();
    let total = 0;
    for (const conn of connections) {
      if (conn.status !== "connected") continue;
      try {
        const tools = await this._manager.listTools(conn.name);
        this._cache.set(conn.name, { tools, fetchedAt: Date.now() });
        this._registerUnifiedServer(conn.name, tools);
        total += tools.length;
      } catch {
        // Skip servers that fail to list tools
      }
    }
    return total;
  }

  /** Refresh tools for a specific server. */
  async refreshServer(serverName: string): Promise<McpToolInfo[]> {
    const tools = await this._manager.listTools(serverName);
    this._cache.set(serverName, { tools, fetchedAt: Date.now() });
    this._registerUnifiedServer(serverName, tools);
    return tools;
  }

  /**
   * Get all known tools across all servers.
   * Returns cached data when available and not expired.
   */
  getAllTools(): McpToolInfo[] {
    if (this._unifiedRegistry?.list) {
      return this._unifiedRegistry.list()
        .filter((tool) => tool.source === "mcp")
        .map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: undefined,
          serverName: tool.sourceQualifier ?? tool.server ?? "",
        }));
    }
    const result: McpToolInfo[] = [];
    for (const cached of this._cache.values()) {
      if (this._isExpired(cached)) continue;
      result.push(...cached.tools);
    }
    return result;
  }

  /** Get tools for a specific server from cache. */
  getToolsForServer(serverName: string): McpToolInfo[] {
    const unifiedTools = this._unifiedRegistry?.listByServer?.(serverName);
    if (unifiedTools) {
      return unifiedTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.parameters as McpToolInfo["inputSchema"],
        serverName,
      }));
    }
    const cached = this._cache.get(serverName);
    if (!cached || this._isExpired(cached)) return [];
    return cached.tools;
  }

  /**
   * Search tools by name or description substring (case-insensitive).
   * Searches across all cached servers.
   */
  searchTools(query: string): McpToolInfo[] {
    const unifiedMatches = this._unifiedRegistry?.searchTools?.(query);
    if (unifiedMatches) {
      return unifiedMatches
        .filter((tool) => tool.source === "mcp")
        .map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: undefined,
          serverName: tool.sourceQualifier ?? "",
        }));
    }
    const lower = query.toLowerCase();
    const all = this.getAllTools();
    return all.filter(
      (t) =>
        t.name.toLowerCase().includes(lower) ||
        (t.description?.toLowerCase().includes(lower) ?? false),
    );
  }

  /**
   * Look up a tool by qualified name "serverName:toolName".
   * Returns undefined if not found in cache.
   */
  getToolByQualifiedName(qualifiedName: string): McpToolInfo | undefined {
    const colonIdx = qualifiedName.indexOf(":");
    if (colonIdx < 0) {
      // Unqualified: search all servers
      return this.getAllTools().find((t) => t.name === qualifiedName);
    }
    const serverName = qualifiedName.slice(0, colonIdx);
    const toolName = qualifiedName.slice(colonIdx + 1);
    const unifiedTool = this._unifiedRegistry?.get?.(toolName, "mcp", serverName);
    if (unifiedTool) {
      return {
        name: unifiedTool.name,
        description: unifiedTool.description,
        inputSchema: unifiedTool.parameters as McpToolInfo["inputSchema"],
        serverName,
      };
    }
    const tools = this.getToolsForServer(serverName);
    return tools.find((t) => t.name === toolName);
  }

  /** Clear the entire cache. */
  clearCache(): void {
    for (const serverName of this._cache.keys()) {
      this._unifiedRegistry?.unregisterServer?.(serverName, true);
      this._mcpBridge?.unregisterServer?.(serverName);
    }
    this._cache.clear();
  }

  /** Number of non-expired tools currently in cache (across all servers). */
  get cachedToolCount(): number {
    let count = 0;
    for (const cached of this._cache.values()) {
      if (this._isExpired(cached)) continue;
      count += cached.tools.length;
    }
    return count;
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private _isExpired(cached: CachedToolSet): boolean {
    if (this._cacheTtlMs <= 0) return false; // 0 = never expire
    return Date.now() - cached.fetchedAt > this._cacheTtlMs;
  }

  private _registerUnifiedServer(serverName: string, tools: McpToolInfo[]): void {
    this._mcpBridge?.registerServer(
      { id: serverName, name: serverName, transport: "stdio" },
      tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    );
    if (this._mcpBridge || !this._unifiedRegistry) {
      return;
    }
    this._unifiedRegistry.registerServer({
      id: serverName,
      name: serverName,
      type: "mcp",
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
        source: "mcp",
        sourceQualifier: serverName,
        server: serverName,
      })),
    });
  }
}
