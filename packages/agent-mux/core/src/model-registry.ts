/**
 * ModelRegistry interface and implementation for @a5c-ai/agent-mux.
 *
 * @see 06-capabilities-and-models.md §4
 */

import type { AgentName } from './types.js';
import type { ModelCapabilities, ModelValidationResult } from './capabilities.js';
import type { AdapterRegistry } from './adapter-registry.js';

// ---------------------------------------------------------------------------
// ModelRegistry Interface
// ---------------------------------------------------------------------------

export interface ModelCatalogEntry extends ModelCapabilities {
  /** Whether this entry is the adapter's default model. */
  isDefault: boolean;
}

/**
 * Per-agent model introspection registry.
 */
export interface ModelRegistry {
  /** Return all known models for an agent. */
  models(agent: AgentName): ModelCapabilities[];

  /** Return known models plus default-selection metadata for an agent. */
  catalog(agent: AgentName): ModelCatalogEntry[];

  /** Return capabilities for a specific model, or null if not found. */
  model(agent: AgentName, modelId: string): ModelCapabilities | null;

  /** Return the default model for an agent, or null. */
  defaultModel(agent: AgentName): ModelCapabilities | null;

  /** Validate a model identifier against the agent's known model list. */
  validate(agent: AgentName, modelId: string): ModelValidationResult;

  /** Estimate the cost (in USD) for given token usage on a specific model. */
  estimateCost(
    agent: AgentName,
    modelId: string,
    inputTokens: number,
    outputTokens: number,
  ): number;

  /** Refresh model data for a specific agent (no-op in current implementation). */
  refresh(agent: AgentName): Promise<void>;

  /** Refresh model data for all registered agents. */
  refreshAll(): Promise<void>;

  /** Return the timestamp of the last successful model data update. */
  lastUpdated(agent: AgentName): Date;
}

// ---------------------------------------------------------------------------
// ModelRegistryImpl
// ---------------------------------------------------------------------------

/**
 * Implementation of ModelRegistry backed by the AdapterRegistry.
 * Reads model data from adapter.models arrays.
 */
export class ModelRegistryImpl implements ModelRegistry {
  private readonly _adapters: AdapterRegistry;
  private readonly _lastUpdated = new Map<string, Date>();
  private readonly _modelsCache = new Map<string, ModelCapabilities[]>();

  constructor(adapters: AdapterRegistry) {
    this._adapters = adapters;
  }

  models(agent: AgentName): ModelCapabilities[] {
    return this._getModels(agent);
  }

  catalog(agent: AgentName): ModelCatalogEntry[] {
    const defaultModelId = this._adapters.get(agent)?.defaultModelId ?? null;
    return this._getModels(agent).map((model) => ({
      ...model,
      isDefault: defaultModelId === model.modelId,
    }));
  }

  model(agent: AgentName, modelId: string): ModelCapabilities | null {
    return (
      this._getModels(agent).find(
        (m) => m.modelId === modelId || m.modelAlias === modelId,
      ) ?? null
    );
  }

  defaultModel(agent: AgentName): ModelCapabilities | null {
    const adapter = this._adapters.get(agent);
    if (!adapter || !adapter.defaultModelId) return null;

    return (
      this._getModels(agent).find((m) => m.modelId === adapter.defaultModelId) ?? null
    );
  }

  validate(agent: AgentName, modelId: string): ModelValidationResult {
    const adapter = this._adapters.get(agent);
    if (!adapter) {
      return {
        valid: false,
        status: 'unknown',
        message: `No adapter registered for agent "${agent}"`,
      };
    }

    const allModels = this._getModels(agent);

    // Exact modelId match
    const exact = allModels.find((m) => m.modelId === modelId);
    if (exact) {
      if (exact.deprecated) {
        return {
          valid: true,
          model: exact,
          status: 'deprecated',
          message: `Model "${modelId}" is deprecated`,
          successorModelId: exact.successorModelId,
        };
      }
      return {
        valid: true,
        model: exact,
        status: 'ok',
        message: `Model "${modelId}" is valid`,
      };
    }

    // Alias match
    const aliased = allModels.find((m) => m.modelAlias === modelId);
    if (aliased) {
      return {
        valid: true,
        model: aliased,
        status: 'alias',
        message: `"${modelId}" is an alias for "${aliased.modelId}"`,
        resolvedModelId: aliased.modelId,
      };
    }

    // Fuzzy matching — find suggestions
    const suggestions = this._fuzzyMatch(modelId, allModels);
    return {
      valid: false,
      status: 'unknown',
      message: `Model "${modelId}" not found for agent "${agent}"`,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }

  estimateCost(
    agent: AgentName,
    modelId: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    const m = this.model(agent, modelId);
    if (!m) return 0;

    const inputCost =
      m.inputPricePerMillion != null
        ? (inputTokens / 1_000_000) * m.inputPricePerMillion
        : 0;

    const outputCost =
      m.outputPricePerMillion != null
        ? (outputTokens / 1_000_000) * m.outputPricePerMillion
        : 0;

    return inputCost + outputCost;
  }

  async refresh(_agent: AgentName): Promise<void> {
    const adapter = this._adapters.get(_agent);
    if (!adapter) {
      this._lastUpdated.set(_agent, new Date());
      return;
    }

    const discovered = typeof adapter.discoverModels === 'function'
      ? await adapter.discoverModels()
      : adapter.models;

    this._modelsCache.set(_agent, this._normalizeModels(_agent, discovered));
    this._lastUpdated.set(_agent, new Date());
  }

  async refreshAll(): Promise<void> {
    const adapters = this._adapters.list();
    await Promise.all(adapters.map((a) => this.refresh(a.agent)));
  }

  lastUpdated(agent: AgentName): Date {
    return this._lastUpdated.get(agent) ?? new Date(0);
  }

  // ── Private helpers ──────────────────────────────────────────────

  /**
   * Simple fuzzy matching: find models whose IDs or aliases contain
   * parts of the query string. Returns up to 5 suggestions.
   */
  private _fuzzyMatch(query: string, models: ModelCapabilities[]): string[] {
    const lower = query.toLowerCase();
    const scored: Array<{ id: string; score: number }> = [];

    for (const m of models) {
      const idLower = m.modelId.toLowerCase();
      const aliasLower = (m.modelAlias ?? '').toLowerCase();

      let score = 0;

      // Substring match
      if (idLower.includes(lower) || lower.includes(idLower)) {
        score += 3;
      }
      if (aliasLower.includes(lower) || lower.includes(aliasLower)) {
        score += 3;
      }

      // Word overlap
      const queryParts = lower.split(/[-_.\s]+/);
      const idParts = idLower.split(/[-_.\s]+/);
      for (const qp of queryParts) {
        for (const ip of idParts) {
          if (qp === ip) score += 2;
          else if (ip.includes(qp) || qp.includes(ip)) score += 1;
        }
      }

      if (score > 0) {
        scored.push({ id: m.modelId, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 5).map((s) => s.id);
  }

  private _getModels(agent: AgentName): ModelCapabilities[] {
    const cached = this._modelsCache.get(agent);
    if (cached) return [...cached];

    const adapter = this._adapters.get(agent);
    if (!adapter) return [];

    const normalized = this._normalizeModels(agent, adapter.models);
    this._modelsCache.set(agent, normalized);
    return [...normalized];
  }

  private _normalizeModels(
    agent: AgentName,
    models: ModelCapabilities[],
  ): ModelCapabilities[] {
    const defaults = DEFAULT_MODEL_METADATA[agent] ?? DEFAULT_MODEL_METADATA.fallback;
    return models.map((model) => ({
      ...defaults,
      ...model,
      providerModelId: model.providerModelId ?? model.cliArgValue ?? model.modelId,
    }));
  }
}

const DEFAULT_MODEL_METADATA: Record<string, Pick<ModelCapabilities, 'provider' | 'protocol' | 'deployment' | 'supportsLocalModels'>> = {
  claude: { provider: 'anthropic', protocol: 'messages', deployment: 'hosted', supportsLocalModels: false },
  'claude-agent-sdk': { provider: 'anthropic', protocol: 'messages', deployment: 'hosted', supportsLocalModels: false },
  'claude-remote-control': { provider: 'anthropic', protocol: 'messages', deployment: 'gateway', supportsLocalModels: false },
  codex: { provider: 'openai', protocol: 'responses', deployment: 'hosted', supportsLocalModels: false },
  'codex-sdk': { provider: 'openai', protocol: 'responses', deployment: 'hosted', supportsLocalModels: false },
  'codex-websocket': { provider: 'openai', protocol: 'responses', deployment: 'hosted', supportsLocalModels: false },
  copilot: { provider: 'github', protocol: 'chat', deployment: 'hosted', supportsLocalModels: false },
  cursor: { provider: 'cursor', protocol: 'chat', deployment: 'hosted', supportsLocalModels: false },
  droid: { provider: 'openai', protocol: 'responses', deployment: 'hosted', supportsLocalModels: false },
  gemini: { provider: 'google', protocol: 'chat', deployment: 'hosted', supportsLocalModels: false },
  hermes: { provider: 'configurable', protocol: 'custom', deployment: 'hybrid', supportsLocalModels: true },
  omp: { provider: 'configurable', protocol: 'chat', deployment: 'hybrid', supportsLocalModels: true },
  opencode: { provider: 'configurable', protocol: 'chat', deployment: 'hybrid', supportsLocalModels: true },
  'opencode-http': { provider: 'configurable', protocol: 'chat', deployment: 'gateway', supportsLocalModels: true },
  openclaw: { provider: 'configurable', protocol: 'custom', deployment: 'hybrid', supportsLocalModels: true },
  pi: { provider: 'configurable', protocol: 'chat', deployment: 'hybrid', supportsLocalModels: true },
  'pi-sdk': { provider: 'configurable', protocol: 'chat', deployment: 'hybrid', supportsLocalModels: true },
  qwen: { provider: 'alibaba', protocol: 'chat', deployment: 'hosted', supportsLocalModels: false },
  'agent-mux-remote': { provider: 'delegated', protocol: 'custom', deployment: 'gateway', supportsLocalModels: false },
  fallback: { provider: 'unknown', protocol: 'custom', deployment: 'hosted', supportsLocalModels: false },
};
