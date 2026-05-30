import type {
  ResolvedToolDescriptor,
  SchemaLoader,
  ToolDescriptor,
  ToolLookupOptions,
  ToolSchema,
  ToolServer,
  ToolSource,
} from './types.js';

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
  private readonly keysByName = new Map<string, Set<string>>();
  private readonly servers = new Map<string, ToolServer>();
  private readonly schemas = new Map<string, ToolSchema>();
  private readonly loaders = new Map<ToolSource, SchemaLoader>();

  /* ------------------------------------------------------------------ */
  /*  Tool-level operations                                              */
  /* ------------------------------------------------------------------ */

  /** Register (or replace) a single tool descriptor. */
  register(tool: ToolDescriptor): void {
    const normalized = this.normalizeTool(tool);
    const key = this.keyFor(normalized);
    const previous = this.tools.get(key);
    if (previous && previous.name !== normalized.name) {
      this.keysByName.get(previous.name)?.delete(key);
    }
    this.tools.set(key, normalized);
    let keys = this.keysByName.get(normalized.name);
    if (!keys) {
      keys = new Set<string>();
      this.keysByName.set(normalized.name, keys);
    }
    keys.add(key);
  }

  /** Register every tool in the supplied array. */
  registerAll(tools: ToolDescriptor[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  /** Remove a tool by name.  Returns `true` if it existed. */
  unregister(name: string, options?: ToolLookupOptions): boolean {
    const key = this.findKey(name, options);
    if (!key) {
      return false;
    }
    this.deleteByKey(key);
    return true;
  }

  /** Look up a single tool by exact name. */
  get(name: string, options?: ToolLookupOptions): ToolDescriptor | undefined {
    const key = this.findKey(name, options);
    return key ? this.tools.get(key) : undefined;
  }

  getByQualifiedName(qualifiedName: string): ToolDescriptor | undefined {
    return this.tools.get(qualifiedName);
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
  has(name: string, options?: ToolLookupOptions): boolean {
    return this.get(name, options) !== undefined;
  }

  registerLoader(source: ToolSource, loader: SchemaLoader): void {
    this.loaders.set(source, loader);
  }

  getEntriesBySource(source: ToolSource, sourceQualifier?: string): ToolDescriptor[] {
    return [...this.tools.values()].filter(
      (tool) => tool.source === source && (!sourceQualifier || this.qualifierFor(tool) === sourceQualifier),
    );
  }

  removeToolsBySource(source: ToolSource, sourceQualifier?: string): number {
    let removed = 0;
    for (const [key, tool] of [...this.tools.entries()]) {
      if (tool.source === source && (!sourceQualifier || this.qualifierFor(tool) === sourceQualifier)) {
        this.deleteByKey(key);
        removed++;
      }
    }
    return removed;
  }

  searchTools(query: string, maxResults = 20): ToolDescriptor[] {
    const lower = query.toLowerCase();
    const scored: Array<{ tool: ToolDescriptor; key: string; score: number }> = [];

    for (const [key, tool] of this.tools.entries()) {
      let score = 0;
      const nameLower = tool.name.toLowerCase();
      const descLower = (tool.description ?? '').toLowerCase();

      if (nameLower === lower) {
        score += 100;
      } else if (nameLower.includes(lower)) {
        score += 50;
        if (nameLower.startsWith(lower)) {
          score += 20;
        }
      }
      if (descLower.includes(lower)) {
        score += 10;
      }
      if (score > 0) {
        scored.push({ tool, key, score });
      }
    }

    scored.sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name) || a.key.localeCompare(b.key));
    return scored.slice(0, maxResults).map((item) => item.tool);
  }

  async fetchSchema(
    toolName: string,
    source?: ToolSource,
    sourceQualifier?: string,
  ): Promise<ResolvedToolDescriptor | undefined> {
    const key = this.findKey(toolName, { source, sourceQualifier });
    if (!key) {
      return undefined;
    }
    const tool = this.tools.get(key);
    if (!tool) {
      return undefined;
    }

    const cached = this.schemas.get(key);
    if (cached) {
      return { ...tool, schema: cached };
    }

    if (tool.parameters) {
      const schema = {
        inputSchema: tool.parameters,
        outputSchema: tool.metadata?.['outputSchema'] as Record<string, unknown> | undefined,
      };
      this.schemas.set(key, schema);
      return { ...tool, schema };
    }

    const loader = this.loaders.get(tool.source);
    if (!loader) {
      return undefined;
    }
    const schema = await loader(tool);
    this.schemas.set(key, schema);
    this.tools.set(key, { ...tool, parameters: schema.inputSchema });
    return { ...this.tools.get(key)!, schema };
  }

  get loadedSchemaCount(): number {
    return this.schemas.size;
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
        this.unregister(tool.name, {
          source: tool.source,
          sourceQualifier: this.qualifierFor(tool),
          server: tool.server,
        });
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
    this.keysByName.clear();
    this.servers.clear();
    this.schemas.clear();
  }

  private normalizeTool(tool: ToolDescriptor): ToolDescriptor {
    return {
      ...tool,
      sourceQualifier: tool.sourceQualifier ?? tool.server,
    };
  }

  private qualifierFor(tool: Pick<ToolDescriptor, 'sourceQualifier' | 'server'>): string | undefined {
    return tool.sourceQualifier ?? tool.server;
  }

  private keyFor(tool: Pick<ToolDescriptor, 'source' | 'sourceQualifier' | 'server' | 'name'>): string {
    const qualifier = this.qualifierFor(tool);
    return qualifier ? `${tool.source}:${qualifier}:${tool.name}` : `${tool.source}:${tool.name}`;
  }

  private findKey(nameOrQualifiedName: string, options?: ToolLookupOptions): string | undefined {
    if (!options && this.tools.has(nameOrQualifiedName)) {
      return nameOrQualifiedName;
    }
    if (options?.source) {
      const key = this.keyFor({
        name: nameOrQualifiedName,
        source: options.source,
        sourceQualifier: options.sourceQualifier,
        server: options.server,
      });
      return this.tools.has(key) ? key : undefined;
    }
    const keys = this.keysByName.get(nameOrQualifiedName);
    if (!keys) {
      return undefined;
    }
    if (options?.server || options?.sourceQualifier) {
      for (const key of keys) {
        const tool = this.tools.get(key);
        if (
          tool &&
          (!options.server || tool.server === options.server) &&
          (!options.sourceQualifier || this.qualifierFor(tool) === options.sourceQualifier)
        ) {
          return key;
        }
      }
      return undefined;
    }
    return keys.values().next().value;
  }

  private deleteByKey(key: string): void {
    const tool = this.tools.get(key);
    if (!tool) {
      return;
    }
    this.tools.delete(key);
    this.schemas.delete(key);
    const keys = this.keysByName.get(tool.name);
    keys?.delete(key);
    if (keys?.size === 0) {
      this.keysByName.delete(tool.name);
    }
  }
}
