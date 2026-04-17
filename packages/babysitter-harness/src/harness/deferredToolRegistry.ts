/**
 * GAP-TOOLS-034: Deferred Tool Registry.
 *
 * Two-tier tool index: tier 1 stores name + description (lightweight),
 * tier 2 loads full JSON Schema on demand. Supports search across all
 * registered tools and categorization by source.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Source category for tool registration. */
export type ToolSource =
  | "builtin"
  | "mcp"
  | "plugin"
  | "custom";

/** Tier-1 entry: name + description (always loaded). */
export interface DeferredToolEntry {
  /** Tool name (unique within a source). */
  name: string;
  /** Short description used for search/matching. */
  description: string;
  /** Source category. */
  source: ToolSource;
  /** Optional source qualifier (e.g. MCP server name, plugin name). */
  sourceQualifier?: string;
}

/** Tier-2 data: full JSON Schema, loaded on demand. */
export interface ToolSchema {
  /** JSON Schema for the tool's input parameters. */
  inputSchema: Record<string, unknown>;
  /** Optional output schema. */
  outputSchema?: Record<string, unknown>;
}

/** Combined entry with schema (after fetch). */
export interface ResolvedToolEntry extends DeferredToolEntry {
  schema: ToolSchema;
}

/** Function that lazily loads a tool's full schema. */
export type SchemaLoader = (entry: DeferredToolEntry) => Promise<ToolSchema>;

// ---------------------------------------------------------------------------
// DeferredToolRegistry
// ---------------------------------------------------------------------------

export class DeferredToolRegistry {
  /** Tier-1 index: all tools with name + description. */
  private readonly _entries = new Map<string, DeferredToolEntry>();
  /** Tier-2 cache: loaded schemas keyed by registry key. */
  private readonly _schemas = new Map<string, ToolSchema>();
  /** Schema loaders keyed by source. */
  private readonly _loaders = new Map<string, SchemaLoader>();

  /**
   * Register a schema loader for a given source.
   * When a tool from this source needs its schema, the loader is called.
   */
  registerLoader(source: ToolSource, loader: SchemaLoader): void {
    this._loaders.set(source, loader);
  }

  /** Build a unique key for a tool entry. */
  private _key(entry: Pick<DeferredToolEntry, "source" | "sourceQualifier" | "name">): string {
    return entry.sourceQualifier
      ? `${entry.source}:${entry.sourceQualifier}:${entry.name}`
      : `${entry.source}:${entry.name}`;
  }

  /**
   * Register tier-1 entries (bulk).
   * Replaces existing entries with the same key.
   */
  registerTools(entries: DeferredToolEntry[]): void {
    for (const entry of entries) {
      this._entries.set(this._key(entry), entry);
    }
  }

  /** Remove all entries for a given source (and optional qualifier). */
  removeToolsBySource(source: ToolSource, sourceQualifier?: string): number {
    let removed = 0;
    for (const [key, entry] of this._entries) {
      if (entry.source === source && (!sourceQualifier || entry.sourceQualifier === sourceQualifier)) {
        this._entries.delete(key);
        this._schemas.delete(key);
        removed++;
      }
    }
    return removed;
  }

  /** Get all tier-1 entries. */
  getAllEntries(): DeferredToolEntry[] {
    return [...this._entries.values()];
  }

  /** Get entries filtered by source. */
  getEntriesBySource(source: ToolSource, sourceQualifier?: string): DeferredToolEntry[] {
    return [...this._entries.values()].filter(
      (e) => e.source === source && (!sourceQualifier || e.sourceQualifier === sourceQualifier),
    );
  }

  /**
   * Search tier-1 entries by query string (case-insensitive substring match
   * against name and description). Returns matching entries ranked by relevance.
   */
  searchTools(query: string, maxResults = 20): DeferredToolEntry[] {
    const lower = query.toLowerCase();
    const scored: Array<{ entry: DeferredToolEntry; score: number }> = [];

    for (const entry of this._entries.values()) {
      let score = 0;
      const nameLower = entry.name.toLowerCase();
      const descLower = entry.description.toLowerCase();

      // Exact name match
      if (nameLower === lower) {
        score += 100;
      } else if (nameLower.includes(lower)) {
        // Name contains query
        score += 50;
        // Bonus for prefix match
        if (nameLower.startsWith(lower)) score += 20;
      }

      // Description contains query
      if (descLower.includes(lower)) {
        score += 10;
      }

      if (score > 0) {
        scored.push({ entry, score });
      }
    }

    // Sort by score descending, then name ascending for stability
    scored.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));
    return scored.slice(0, maxResults).map((s) => s.entry);
  }

  /**
   * Fetch the full schema for a tool (tier-2 loading).
   * Uses cached schema if available, otherwise calls the registered loader.
   */
  async fetchSchema(toolName: string, source?: ToolSource, sourceQualifier?: string): Promise<ResolvedToolEntry | undefined> {
    // Find the entry
    let entry: DeferredToolEntry | undefined;
    if (source) {
      const key = sourceQualifier
        ? `${source}:${sourceQualifier}:${toolName}`
        : `${source}:${toolName}`;
      entry = this._entries.get(key);
    } else {
      // Search across all sources
      for (const e of this._entries.values()) {
        if (e.name === toolName) {
          entry = e;
          break;
        }
      }
    }

    if (!entry) return undefined;

    const key = this._key(entry);

    // Check cache
    const cached = this._schemas.get(key);
    if (cached) {
      return { ...entry, schema: cached };
    }

    // Load via registered loader
    const loader = this._loaders.get(entry.source);
    if (!loader) {
      return undefined;
    }

    const schema = await loader(entry);
    this._schemas.set(key, schema);
    return { ...entry, schema };
  }

  /** Clear all entries and cached schemas. */
  clear(): void {
    this._entries.clear();
    this._schemas.clear();
  }

  /** Total number of tier-1 entries. */
  get size(): number {
    return this._entries.size;
  }

  /** Number of loaded tier-2 schemas. */
  get loadedSchemaCount(): number {
    return this._schemas.size;
  }
}
