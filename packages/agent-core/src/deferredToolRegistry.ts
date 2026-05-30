import {
  ToolRegistry,
  type SchemaLoader as MuxSchemaLoader,
  type ToolDescriptor,
} from "@a5c-ai/tool-mux";

export type ToolSource = "builtin" | "mcp" | "plugin" | "custom";

export interface DeferredToolEntry {
  name: string;
  description: string;
  source: ToolSource;
  sourceQualifier?: string;
  /** Optional unified metadata used by discovery, policy, approval, and cache planning. */
  metadata?: {
    category?: string;
    tags?: string[];
    cost?: Record<string, unknown>;
    rateLimit?: Record<string, unknown>;
    requiresApproval?: "never" | "on-risk" | "always";
    cache?: Record<string, unknown>;
  };
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
 * Compatibility facade for the historical agent-core deferred registry.
 * Tool storage and lookup semantics are delegated to tool-mux ToolRegistry.
 */
export class DeferredToolRegistry {
  private readonly registry = new ToolRegistry();

  registerLoader(source: ToolSource, loader: SchemaLoader): void {
    const muxLoader: MuxSchemaLoader = async (tool: ToolDescriptor) =>
      loader(this.toDeferredEntry(tool));
    this.registry.registerLoader(source, muxLoader);
  }

  registerTools(entries: DeferredToolEntry[]): void {
    this.registry.registerAll(entries.map((entry) => ({
      name: entry.name,
      description: entry.description,
      source: entry.source,
      sourceQualifier: entry.sourceQualifier,
      server: entry.source === "mcp" ? entry.sourceQualifier : undefined,
    })));
  }

  removeToolsBySource(source: ToolSource, sourceQualifier?: string): number {
    return this.registry.removeToolsBySource(source, sourceQualifier);
  }

  getAllEntries(): DeferredToolEntry[] {
    return this.registry.list().map((tool) => this.toDeferredEntry(tool));
  }

  getEntriesBySource(source: ToolSource, sourceQualifier?: string): DeferredToolEntry[] {
    return this.registry.getEntriesBySource(source, sourceQualifier).map((tool) => this.toDeferredEntry(tool));
  }

  searchTools(query: string, maxResults = 20): DeferredToolEntry[] {
    return this.registry.searchTools(query, maxResults).map((tool) => this.toDeferredEntry(tool));
  }

  async fetchSchema(
    toolName: string,
    source?: ToolSource,
    sourceQualifier?: string,
  ): Promise<ResolvedToolEntry | undefined> {
    const resolved = await this.registry.fetchSchema(toolName, source, sourceQualifier);
    if (!resolved) {
      return undefined;
    }
    return {
      ...this.toDeferredEntry(resolved),
      schema: resolved.schema,
    };
  }

  clear(): void {
    this.registry.clear();
  }

  get size(): number {
    return this.registry.size;
  }

  get loadedSchemaCount(): number {
    return this.registry.loadedSchemaCount;
  }

  getToolRegistry(): ToolRegistry {
    return this.registry;
  }

  private toDeferredEntry(tool: ToolDescriptor): DeferredToolEntry {
    return {
      name: tool.name,
      description: tool.description ?? "",
      source: tool.source,
      sourceQualifier: tool.sourceQualifier ?? tool.server,
    };
  }
}
