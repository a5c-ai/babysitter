/**
 * Status: Integrated with agent-platform MCP orchestration wiring.
 * Moved from @a5c-ai/babysitter-sdk.
 * GAP-TOOLS-025: MCP Tool Registry.
 *
 * Maintains a cached index of tools across all connected MCP servers.
 * Supports refresh, search, and lookup by qualified name (server:tool).
 */

import {
  McpBridge,
  ToolRegistry,
  type McpServerConfig as MuxMcpServerConfig,
} from "@a5c-ai/tool-mux";
import type { McpToolInfo } from "./types";
import type { McpClientManager } from "./manager";

export interface McpToolRegistryOptions {
  cacheTtlMs?: number;
}

interface CachedToolSet {
  tools: McpToolInfo[];
  fetchedAt: number;
}

/**
 * Compatibility facade over the unified tool-mux registry.
 * MCP lifecycle stays owned by McpClientManager; this class only indexes listings.
 */
export class McpToolRegistry {
  private readonly manager: McpClientManager;
  private readonly cacheTtlMs: number;
  private readonly cache = new Map<string, CachedToolSet>();
  private readonly toolRegistry = new ToolRegistry();
  private readonly bridge = new McpBridge(this.toolRegistry);

  constructor(manager: McpClientManager, options?: McpToolRegistryOptions) {
    this.manager = manager;
    this.cacheTtlMs = options?.cacheTtlMs ?? 60_000;
  }

  async refreshAll(): Promise<number> {
    const connections = this.manager.listConnections();
    let total = 0;
    for (const conn of connections) {
      if (conn.status !== "connected") continue;
      try {
        const tools = await this.refreshServer(conn.name);
        total += tools.length;
      } catch {
        // Preserve previous behavior: skip servers that fail to list tools.
      }
    }
    return total;
  }

  async refreshServer(serverName: string): Promise<McpToolInfo[]> {
    const tools = await this.manager.listTools(serverName);
    this.cache.set(serverName, { tools, fetchedAt: Date.now() });
    this.bridge.unregisterServer(serverName);
    this.bridge.registerServer(this.toMuxServerConfig(serverName), tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })));
    return tools;
  }

  getAllTools(): McpToolInfo[] {
    const result: McpToolInfo[] = [];
    for (const [serverName, cached] of this.cache.entries()) {
      if (this.isExpired(cached)) {
        this.bridge.unregisterServer(serverName);
        continue;
      }
      result.push(...cached.tools);
    }
    return result;
  }

  getToolsForServer(serverName: string): McpToolInfo[] {
    const cached = this.cache.get(serverName);
    if (!cached || this.isExpired(cached)) {
      this.bridge.unregisterServer(serverName);
      return [];
    }
    return cached.tools;
  }

  searchTools(query: string): McpToolInfo[] {
    const lower = query.toLowerCase();
    return this.getAllTools().filter(
      (tool) =>
        tool.name.toLowerCase().includes(lower) ||
        (tool.description?.toLowerCase().includes(lower) ?? false),
    );
  }

  getToolByQualifiedName(qualifiedName: string): McpToolInfo | undefined {
    const colonIdx = qualifiedName.indexOf(":");
    if (colonIdx < 0) {
      return this.getAllTools().find((tool) => tool.name === qualifiedName);
    }
    const serverName = qualifiedName.slice(0, colonIdx);
    const toolName = qualifiedName.slice(colonIdx + 1);
    return this.getToolsForServer(serverName).find((tool) => tool.name === toolName);
  }

  clearCache(): void {
    this.cache.clear();
    this.toolRegistry.clear();
  }

  get cachedToolCount(): number {
    return this.getAllTools().length;
  }

  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  private isExpired(cached: CachedToolSet): boolean {
    if (this.cacheTtlMs <= 0) return false;
    return Date.now() - cached.fetchedAt > this.cacheTtlMs;
  }

  private toMuxServerConfig(serverName: string): MuxMcpServerConfig {
    return {
      id: serverName,
      name: serverName,
      transport: "stdio",
    };
  }
}
