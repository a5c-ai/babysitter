/**
 * ConfigManager interface and implementation for @a5c-ai/agent-mux.
 *
 * Provides unified configuration access for all supported agents.
 * Reads and writes each agent's native config through the adapter layer.
 *
 * @see 08-config-and-auth.md
 */

import type { AgentName, McpServerConfig } from './types.js';
import type { AdapterRegistry } from './adapter-registry.js';
import type { ProfileManager } from './profiles.js';
import type { AgentConfig, AgentConfigSchema } from './config-types.js';
import { AgentMuxError } from './errors.js';
import { deepMerge } from './merge.js';

// Re-export all config types from the dedicated module
export type {
  AgentConfig,
  AgentConfigSchema,
  ConfigField,
  ValidationResult,
  ConfigValidationError,
  ConfigValidationWarning,
  ModelSelection,
} from './config-types.js';

import type { ModelSelection, ValidationResult } from './config-types.js';

// ---------------------------------------------------------------------------
// ConfigManager Interface
// ---------------------------------------------------------------------------

/** Unified configuration access for all supported agents. */
export interface ConfigManager {
  /** Read the full merged configuration for an agent. */
  get(agent: AgentName): AgentConfig;

  /** Read a single field from the merged configuration. */
  getField(agent: AgentName, field: string): unknown;

  /** Write partial configuration updates to the agent's native config file. */
  set(agent: AgentName, fields: Partial<AgentConfig>): Promise<void>;

  /** Write a single field to the agent's native config file. */
  setField(agent: AgentName, field: string, value: unknown): Promise<void>;

  /** Returns the configuration schema for an agent. */
  schema(agent: AgentName): AgentConfigSchema;

  /** Validate a partial config against the agent's schema. */
  validate(agent: AgentName, config: Partial<AgentConfig>): ValidationResult;

  /** Returns all MCP server configurations from the agent's config. */
  getMcpServers(agent: AgentName): McpServerConfig[];

  /** Returns configured/default/effective model selection for an agent. */
  getModelSelection(agent: AgentName): ModelSelection;

  /** Update model/provider selection fields in the agent config. */
  setModelSelection(
    agent: AgentName,
    selection: { model?: string | null; provider?: string | null },
  ): Promise<void>;

  /** Add an MCP server to the agent's config. */
  addMcpServer(agent: AgentName, server: McpServerConfig): Promise<void>;

  /** Remove an MCP server from the agent's config by name. */
  removeMcpServer(agent: AgentName, serverName: string): Promise<void>;

  /** Invalidate cache and re-read from disk. */
  reload(agent?: AgentName): Promise<void>;

  /** Returns the ProfileManager instance. */
  profiles(): ProfileManager;
}

// ---------------------------------------------------------------------------
// ConfigManagerImpl
// ---------------------------------------------------------------------------

/**
 * Implementation of ConfigManager.
 *
 * Delegates file I/O to agent adapters. Provides caching,
 * deep merge, field-level access, and schema introspection.
 */
export class ConfigManagerImpl implements ConfigManager {
  private readonly _adapters: AdapterRegistry;
  private readonly _profileManager: ProfileManager;
  private readonly _cache = new Map<string, AgentConfig>();
  /**
   * Per-agent write serialisation. All `.set()` / `.setField()` / MCP mutation
   * calls for a given agent queue onto the same promise so concurrent callers
   * cannot interleave read-modify-write sequences. File-level atomicity is
   * additionally enforced by the adapter writing through `writeJsonAtomic`
   * from `atomic-fs.ts`, which uses a tmp+fsync+rename + advisory lockfile.
   */
  private readonly _writeQueue = new Map<string, Promise<unknown>>();

  constructor(adapters: AdapterRegistry, profileManager: ProfileManager) {
    this._adapters = adapters;
    this._profileManager = profileManager;
  }

  // -- Helper ------------------------------------------------------------------

  private _getAdapter(agent: AgentName) {
    const adapter = this._adapters.get(agent);
    if (!adapter) {
      throw new AgentMuxError('AGENT_NOT_FOUND', `Unknown agent: "${agent}"`);
    }
    return adapter;
  }

  // -- get() -------------------------------------------------------------------

  get(agent: AgentName): AgentConfig {
    const cached = this._cache.get(agent);
    if (cached) return cached;

    this._getAdapter(agent); // Validates the agent exists

    // Return a default config when cache is cold and no file has been read
    const defaultConfig: AgentConfig = {
      agent,
      source: 'merged',
      filePaths: [],
    };
    this._cache.set(agent, defaultConfig);
    return defaultConfig;
  }

  // -- getField() --------------------------------------------------------------

  getField(agent: AgentName, field: string): unknown {
    const config = this.get(agent);
    return getNestedField(config, field);
  }

  // -- set() -------------------------------------------------------------------

  async set(agent: AgentName, fields: Partial<AgentConfig>): Promise<void> {
    return this._enqueueWrite(agent, async () => {
      const adapter = this._getAdapter(agent);
      const current = this.get(agent);
      const merged = deepMerge(
        current as Record<string, unknown>,
        fields as Record<string, unknown>,
      ) as AgentConfig;

      await adapter.writeConfig(fields);
      this._cache.set(agent, merged);
    });
  }

  /** Serialise writes per agent so concurrent `.set()` cannot interleave. */
  private async _enqueueWrite<T>(agent: AgentName, fn: () => Promise<T>): Promise<T> {
    const prev = this._writeQueue.get(agent) ?? Promise.resolve();
    const next = prev.catch(() => undefined).then(fn);
    this._writeQueue.set(agent, next);
    try {
      return await next;
    } finally {
      if (this._writeQueue.get(agent) === next) {
        this._writeQueue.delete(agent);
      }
    }
  }

  // -- setField() --------------------------------------------------------------

  async setField(agent: AgentName, field: string, value: unknown): Promise<void> {
    const partial = buildNestedObject(field, value);
    await this.set(agent, partial as Partial<AgentConfig>);
  }

  // -- schema() ----------------------------------------------------------------

  schema(agent: AgentName): AgentConfigSchema {
    const adapter = this._getAdapter(agent);
    return adapter.configSchema;
  }

  // -- validate() --------------------------------------------------------------

  validate(_agent: AgentName, _config: Partial<AgentConfig>): ValidationResult {
    this._getAdapter(_agent);
    // Basic validation: always returns valid for now.
    // Full schema validation will be implemented when adapters provide
    // detailed ConfigField descriptors.
    return {
      valid: true,
      errors: [],
      warnings: [],
    };
  }

  // -- getMcpServers() ---------------------------------------------------------

  getMcpServers(agent: AgentName): McpServerConfig[] {
    const config = this.get(agent);
    return config.mcpServers ?? [];
  }

  getModelSelection(agent: AgentName): ModelSelection {
    const adapter = this._getAdapter(agent);
    const config = this.get(agent);
    const configuredModel = typeof config.model === 'string' ? config.model : null;
    const configuredProvider = typeof config.provider === 'string' ? config.provider : null;
    const defaultModel = adapter.defaultModelId ?? null;
    return {
      configuredModel,
      configuredProvider,
      defaultModel,
      effectiveModel: configuredModel ?? defaultModel,
    };
  }

  async setModelSelection(
    agent: AgentName,
    selection: { model?: string | null; provider?: string | null },
  ): Promise<void> {
    const patch: Partial<AgentConfig> = {};
    if (Object.prototype.hasOwnProperty.call(selection, 'model')) {
      patch.model = selection.model ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(selection, 'provider')) {
      patch.provider = selection.provider ?? null;
    }
    await this.set(agent, patch);
  }

  // -- addMcpServer() ----------------------------------------------------------

  async addMcpServer(agent: AgentName, server: McpServerConfig): Promise<void> {
    const existing = this.getMcpServers(agent);
    const duplicate = existing.find((s) => s.name === server.name);
    if (duplicate) {
      throw new AgentMuxError(
        'CONFIG_ERROR',
        `MCP server "${server.name}" already exists in config for agent "${agent}"`,
      );
    }

    const updated = [...existing, server];
    await this.set(agent, { mcpServers: updated } as Partial<AgentConfig>);
  }

  // -- removeMcpServer() -------------------------------------------------------

  async removeMcpServer(agent: AgentName, serverName: string): Promise<void> {
    const existing = this.getMcpServers(agent);
    const index = existing.findIndex((s) => s.name === serverName);
    if (index === -1) {
      throw new AgentMuxError(
        'CONFIG_ERROR',
        `MCP server "${serverName}" not found in config for agent "${agent}"`,
      );
    }

    const updated = existing.filter((s) => s.name !== serverName);
    await this.set(agent, { mcpServers: updated } as Partial<AgentConfig>);
  }

  // -- reload() ----------------------------------------------------------------

  async reload(agent?: AgentName): Promise<void> {
    if (agent) {
      this._getAdapter(agent);
      this._cache.delete(agent);
    } else {
      this._cache.clear();
    }
  }

  // -- profiles() --------------------------------------------------------------

  profiles(): ProfileManager {
    return this._profileManager;
  }
}

// ---------------------------------------------------------------------------
// Helper: dot-notation field access
// ---------------------------------------------------------------------------

function getNestedField(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function buildNestedObject(path: string, value: unknown): Record<string, unknown> {
  const parts = path.split('.');
  if (parts.length === 1) {
    return { [parts[0]!]: value };
  }

  const result: Record<string, unknown> = {};
  let current = result;
  for (let i = 0; i < parts.length - 1; i++) {
    const next: Record<string, unknown> = {};
    current[parts[i]!] = next;
    current = next;
  }
  current[parts[parts.length - 1]!] = value;
  return result;
}
