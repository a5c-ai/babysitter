import type { ToolDescriptor, ToolServer } from './types.js';
import type { ToolSource } from './types.js';

export interface DeferredToolEntry {
  name: string;
  description: string;
  source: ToolSource;
  sourceQualifier?: string;
  metadata?: Record<string, unknown>;
}

export interface ToolSchema {
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface ResolvedToolEntry extends DeferredToolEntry {
  schema: ToolSchema;
}

export type SchemaLoader = (entry: DeferredToolEntry) => Promise<ToolSchema>;

/**
 * In-memory registry of tool descriptors, indexed by tool name.
 *
 * Tools are optionally scoped to a server.  The registry never reaches
 * out to the network — callers are responsible for populating it from
 * whatever discovery mechanism they use (MCP enumeration, plugin
 * manifests, built-in definitions, etc.).
 */
export class ToolRegistry {
  private readonly tools = new Map<string, ToolDescriptor>();
  private readonly servers = new Map<string, ToolServer>();
  private readonly schemas = new Map<string, ToolSchema>();
  private readonly loaders = new Map<ToolSource, SchemaLoader>();

  /* ------------------------------------------------------------------ */
  /*  Tool-level operations                                              */
  /* ------------------------------------------------------------------ */

  /** Register (or replace) a single tool descriptor. */
  register(tool: ToolDescriptor): void {
    this.tools.set(this.key(tool), tool);
  }

  /** Register every tool in the supplied array. */
  registerAll(tools: ToolDescriptor[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  /** Remove a tool by name.  Returns `true` if it existed. */
  unregister(name: string, source?: ToolSource, sourceQualifier?: string): boolean {
    const key = source ? this.findKey(name, source, sourceQualifier) : this.findKeyByName(name);
    if (!key) {
      return false;
    }
    this.schemas.delete(key);
    return this.tools.delete(key);
  }

  /** Look up a single tool by exact name. */
  get(name: string, source?: ToolSource, sourceQualifier?: string): ToolDescriptor | undefined {
    if (source) {
      return this.tools.get(this.key({ name, source, sourceQualifier }));
    }
    return this.tools.get(name) ?? this.tools.get(this.findKeyByName(name) ?? '');
  }

  /** Return every registered tool descriptor. */
  list(): ToolDescriptor[] {
    return [...this.tools.values()];
  }

  /** Return tools that belong to a specific server id. */
  listByServer(serverId: string): ToolDescriptor[] {
    return [...this.tools.values()].filter((t) => t.server === serverId);
  }

  /** Check whether a tool is registered. */
  has(name: string, source?: ToolSource, sourceQualifier?: string): boolean {
    return Boolean(this.get(name, source, sourceQualifier));
  }

  /** Number of registered tools. */
  get size(): number {
    return this.tools.size;
  }

  /* ------------------------------------------------------------------ */
  /*  Server-level operations                                            */
  /* ------------------------------------------------------------------ */

  /** Register a server and all of its tools in one shot. */
  registerServer(server: ToolServer): void {
    this.servers.set(server.id, server);
    for (const tool of server.tools) {
      // Ensure every tool carries the server association.
      this.register({ ...tool, server: server.id });
    }
  }

  /** Remove a server and optionally all of its associated tools. */
  unregisterServer(serverId: string, removeTools = true): boolean {
    if (removeTools) {
      for (const tool of this.listByServer(serverId)) {
        this.unregister(tool.name, tool.source, tool.sourceQualifier);
      }
    }
    return this.servers.delete(serverId);
  }

  /** Look up a server by id. */
  getServer(serverId: string): ToolServer | undefined {
    return this.servers.get(serverId);
  }

  /** Return all registered servers. */
  listServers(): ToolServer[] {
    return [...this.servers.values()];
  }

  /** Remove everything. */
  clear(): void {
    this.tools.clear();
    this.servers.clear();
    this.schemas.clear();
    this.loaders.clear();
  }

  registerLoader(source: ToolSource, loader: SchemaLoader): void {
    this.loaders.set(source, loader);
  }

  registerTools(entries: DeferredToolEntry[]): void {
    for (const entry of entries) {
      this.register({
        name: entry.name,
        description: entry.description,
        source: entry.source,
        sourceQualifier: entry.sourceQualifier,
        metadata: entry.metadata,
      });
    }
  }

  removeToolsBySource(source: ToolSource, sourceQualifier?: string): number {
    let removed = 0;
    for (const tool of this.list()) {
      const qualifier = tool.sourceQualifier ?? tool.server;
      if (tool.source === source && (!sourceQualifier || qualifier === sourceQualifier)) {
        if (this.unregister(tool.name, tool.source, qualifier)) {
          removed++;
        }
      }
    }
    return removed;
  }

  getAllEntries(): DeferredToolEntry[] {
    return this.list().map((tool) => this.toDeferredEntry(tool));
  }

  getEntriesBySource(source: ToolSource, sourceQualifier?: string): DeferredToolEntry[] {
    return this.getAllEntries().filter(
      (entry) => entry.source === source && (!sourceQualifier || entry.sourceQualifier === sourceQualifier),
    );
  }

  searchTools(query: string, maxResults = 20): DeferredToolEntry[] {
    const lower = query.toLowerCase();
    const scored: Array<{ entry: DeferredToolEntry; score: number }> = [];

    for (const tool of this.list()) {
      const entry = this.toDeferredEntry(tool);
      let score = 0;
      const nameLower = entry.name.toLowerCase();
      const descLower = entry.description.toLowerCase();

      if (nameLower === lower) {
        score += 100;
      } else if (nameLower.includes(lower)) {
        score += 50;
        if (nameLower.startsWith(lower)) score += 20;
      }

      if (descLower.includes(lower)) {
        score += 10;
      }

      if (score > 0) {
        scored.push({ entry, score });
      }
    }

    scored.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));
    return scored.slice(0, maxResults).map((item) => item.entry);
  }

  async fetchSchema(
    toolName: string,
    source?: ToolSource,
    sourceQualifier?: string,
  ): Promise<ResolvedToolEntry | undefined> {
    const tool = this.get(toolName, source, sourceQualifier);
    if (!tool) {
      return undefined;
    }
    const key = this.key(tool);
    const entry = this.toDeferredEntry(tool);
    const cached = this.schemas.get(key);
    if (cached) {
      return { ...entry, schema: cached };
    }
    if (tool.parameters) {
      const schema = {
        inputSchema: tool.parameters,
        ...(tool.outputSchema ? { outputSchema: tool.outputSchema } : {}),
      };
      this.schemas.set(key, schema);
      return { ...entry, schema };
    }
    const loader = this.loaders.get(tool.source);
    if (!loader) {
      return undefined;
    }
    const schema = await loader(entry);
    this.schemas.set(key, schema);
    return { ...entry, schema };
  }

  get loadedSchemaCount(): number {
    return this.schemas.size;
  }

  private key(tool: Pick<ToolDescriptor, 'name' | 'source' | 'sourceQualifier' | 'server'>): string {
    const qualifier = tool.sourceQualifier ?? tool.server;
    return qualifier ? `${tool.source}:${qualifier}:${tool.name}` : tool.name;
  }

  private findKeyByName(name: string): string | undefined {
    if (this.tools.has(name)) {
      return name;
    }
    for (const [key, tool] of this.tools) {
      if (tool.name === name) {
        return key;
      }
    }
    return undefined;
  }

  private findKey(name: string, source: ToolSource, sourceQualifier?: string): string | undefined {
    const direct = this.key({ name, source, sourceQualifier });
    if (this.tools.has(direct)) {
      return direct;
    }
    for (const [key, tool] of this.tools) {
      if (
        tool.name === name
        && tool.source === source
        && (!sourceQualifier || tool.sourceQualifier === sourceQualifier || tool.server === sourceQualifier)
      ) {
        return key;
      }
    }
    return undefined;
  }

  private toDeferredEntry(tool: ToolDescriptor): DeferredToolEntry {
    return {
      name: tool.name,
      description: tool.description ?? '',
      source: tool.source,
      sourceQualifier: tool.sourceQualifier ?? tool.server,
      metadata: tool.metadata as Record<string, unknown> | undefined,
    };
  }
}
