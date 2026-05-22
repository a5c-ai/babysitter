/**
 * Status: NOT INTEGRATED YET
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
}

interface CachedToolSet {
  tools: McpToolInfo[];
  fetchedAt: number;
}

// ---------------------------------------------------------------------------
// McpToolRegistry
// ---------------------------------------------------------------------------

export class McpToolRegistry {
  private readonly _manager: McpClientManager;
  private readonly _cacheTtlMs: number;
  private readonly _cache = new Map<string, CachedToolSet>();

  constructor(manager: McpClientManager, options?: McpToolRegistryOptions) {
    this._manager = manager;
    this._cacheTtlMs = options?.cacheTtlMs ?? 60_000;
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
    return tools;
  }

  /**
   * Get all known tools across all servers.
   * Returns cached data when available and not expired.
   */
  getAllTools(): McpToolInfo[] {
    const result: McpToolInfo[] = [];
    for (const cached of this._cache.values()) {
      if (this._isExpired(cached)) continue;
      result.push(...cached.tools);
    }
    return result;
  }

  /** Get tools for a specific server from cache. */
  getToolsForServer(serverName: string): McpToolInfo[] {
    const cached = this._cache.get(serverName);
    if (!cached || this._isExpired(cached)) return [];
    return cached.tools;
  }

  /**
   * Search tools by name or description substring (case-insensitive).
   * Searches across all cached servers.
   */
  searchTools(query: string): McpToolInfo[] {
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
    const tools = this.getToolsForServer(serverName);
    return tools.find((t) => t.name === toolName);
  }

  /** Clear the entire cache. */
  clearCache(): void {
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
}
