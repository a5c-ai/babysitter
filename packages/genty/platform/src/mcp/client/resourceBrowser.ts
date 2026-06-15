/**
 * MCP Resource Browser — list, read, and search resources exposed by MCP
 * servers with a TTL-based cache (TOOLS-031).
 *
 * The browser wraps a transport-level resource fetch function and adds
 * in-memory caching so repeated lookups within the TTL window avoid
 * redundant round-trips.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface McpResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

/** Adapter function that the browser delegates to for actual I/O. */
export interface ResourceFetcher {
  listResources(): Promise<McpResource[]>;
  readResource(uri: string): Promise<McpResourceContent>;
}

export interface McpResourceBrowserOptions {
  /** Cache TTL in milliseconds. Default: 60 000 (1 minute). */
  cacheTtlMs?: number;
}

// ---------------------------------------------------------------------------
// Cache entry
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class McpResourceBrowser {
  private readonly fetcher: ResourceFetcher;
  private readonly cacheTtlMs: number;

  private listCache: CacheEntry<McpResource[]> | null = null;
  private readCache = new Map<string, CacheEntry<McpResourceContent>>();

  constructor(fetcher: ResourceFetcher, options?: McpResourceBrowserOptions) {
    this.fetcher = fetcher;
    this.cacheTtlMs = options?.cacheTtlMs ?? 60_000;
  }

  // -------------------------------------------------------------------------
  // List
  // -------------------------------------------------------------------------

  /**
   * List all resources. Results are cached for `cacheTtlMs`.
   */
  async listResources(now?: number): Promise<McpResource[]> {
    const ts = now ?? Date.now();
    if (this.listCache && this.listCache.expiresAt > ts) {
      return this.listCache.value;
    }

    const resources = await this.fetcher.listResources();
    this.listCache = { value: resources, expiresAt: ts + this.cacheTtlMs };
    return resources;
  }

  // -------------------------------------------------------------------------
  // Read
  // -------------------------------------------------------------------------

  /**
   * Read a single resource by URI. The result is cached per-URI for `cacheTtlMs`.
   */
  async readResource(uri: string, now?: number): Promise<McpResourceContent> {
    const ts = now ?? Date.now();
    const cached = this.readCache.get(uri);
    if (cached && cached.expiresAt > ts) {
      return cached.value;
    }

    const content = await this.fetcher.readResource(uri);
    this.readCache.set(uri, { value: content, expiresAt: ts + this.cacheTtlMs });
    return content;
  }

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  /**
   * Search resources whose name or description contains the query string
   * (case-insensitive). Operates on the cached list (fetching if stale).
   */
  async searchResources(query: string, now?: number): Promise<McpResource[]> {
    const resources = await this.listResources(now);
    const lowerQuery = query.toLowerCase();
    return resources.filter((r) => {
      const nameMatch = r.name.toLowerCase().includes(lowerQuery);
      const descMatch = r.description?.toLowerCase().includes(lowerQuery) ?? false;
      return nameMatch || descMatch;
    });
  }

  // -------------------------------------------------------------------------
  // Cache management
  // -------------------------------------------------------------------------

  /** Invalidate all cached data. */
  clearCache(): void {
    this.listCache = null;
    this.readCache.clear();
  }
}
