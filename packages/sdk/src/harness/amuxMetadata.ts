import { builtinModules } from "node:module";
import { resolveRunsDir } from "../config";
import { STATIC_FALLBACK_METADATA } from "./amuxFallbackMetadata";

/**
 * Resolves adapter metadata from @a5c-ai/agent-mux when available.
 *
 * Some environments used by validation and CI can load the babysitter SDK but
 * cannot load the full agent-mux runtime graph. In those cases we fall back to
 * a static metadata table so harness adapters can still resolve activation
 * signals, prompt capabilities, and session binding behavior.
 */

/**
 * Subset of agent-mux AgentCapabilities relevant to babysitter orchestration.
 */
export interface AmuxCapabilitiesSubset {
  supportsSkills: boolean;
  supportsThinking: boolean;
  supportsMCP: boolean;
  requiresToolApproval: boolean;
  supportsInteractiveMode: boolean;
  supportsStdinInjection: boolean;
  supportsSubagentDispatch: boolean;
  supportsParallelExecution: boolean;
  supportsImageInput: boolean;
  /** Whether the harness supports runtime hooks (stop-hook, pre-tool-use, etc.) */
  hasRuntimeHooks: boolean;
  /** Whether the harness has a blocking stop hook. */
  hasStopHook: boolean;
}

/**
 * Metadata resolved from an agent-mux adapter instance.
 */
export interface AmuxAdapterMetadata {
  /** The agent name in agent-mux (e.g. 'claude', 'codex', 'gemini'). */
  name: string;
  /** Env vars that indicate this harness is active. */
  hostEnvSignals: readonly string[];
  /** Subset of capabilities relevant to babysitter. */
  capabilities: AmuxCapabilitiesSubset;
  /** Session directory (resolved). */
  sessionDir: string;
}

// ---------------------------------------------------------------------------
// Name mapping (babysitter harness name -> agent-mux adapter name)
// ---------------------------------------------------------------------------

const HARNESS_TO_AMUX_NAME: Record<string, string> = {
  "claude-code": "claude",
  "gemini-cli": "gemini",
  "github-copilot": "copilot",
  "oh-my-pi": "omp",
};

function mapHarnessName(name: string): string {
  return HARNESS_TO_AMUX_NAME[name] || name;
}

// ---------------------------------------------------------------------------
// Internal types for the dynamic require from @a5c-ai/agent-mux
// ---------------------------------------------------------------------------

/** Minimal type for the adapter registry returned by createClient(). */
interface AmuxAdapterRegistry {
  get(agent: string): AmuxRawAdapter | undefined;
}

/** Minimal adapter shape we read from agent-mux. */
interface AmuxRawAdapter {
  agent?: string;
  hostEnvSignals?: readonly string[];
  capabilities?: AmuxRawCapabilities;
  sessionDir?: (cwd?: string) => string;
}

/** Minimal capabilities shape. */
interface AmuxRawCapabilities {
  supportsSkills?: boolean;
  supportsThinking?: boolean;
  supportsMCP?: boolean;
  requiresToolApproval?: boolean;
  supportsInteractiveMode?: boolean;
  supportsStdinInjection?: boolean;
  supportsSubagentDispatch?: boolean;
  supportsParallelExecution?: boolean;
  supportsImageInput?: boolean;
  runtimeHooks?: Record<string, string>;
}

/** Minimal client shape. */
interface AmuxClient {
  adapters: AmuxAdapterRegistry;
}

// ---------------------------------------------------------------------------
// Cached metadata lookup
// ---------------------------------------------------------------------------

let _metadataCache: Map<string, AmuxAdapterMetadata> | undefined;

function getCache(): Map<string, AmuxAdapterMetadata> {
  if (!_metadataCache) {
    _metadataCache = new Map();
  }
  return _metadataCache;
}

/**
 * Get metadata for a harness from agent-mux's adapter registry.
 *
 * @a5c-ai/agent-mux is a hard dependency — this function throws if it is
 * missing, broken, or does not contain the requested adapter.
 *
 * Results are cached for the lifetime of the process.
 */

let _amuxOverride: Record<string, unknown> | undefined;

function hasNodeSqliteBuiltin(): boolean {
  return builtinModules.includes("node:sqlite") || builtinModules.includes("sqlite");
}

function requireAmux(): Record<string, unknown> {
  if (_amuxOverride) return _amuxOverride;
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
  const mod: Record<string, unknown> = require("@a5c-ai/agent-mux");
  return mod;
}

/**
 * Override the agent-mux module for testing.
 * Pass `undefined` to restore require-based resolution.
 * @internal — test-only API, not part of the public surface.
 */
export function _setAmuxModuleForTesting(mod: Record<string, unknown> | undefined): void {
  _amuxOverride = mod;
}

function cloneMetadata(metadata: AmuxAdapterMetadata): AmuxAdapterMetadata {
  return {
    ...metadata,
    hostEnvSignals: [...metadata.hostEnvSignals],
    capabilities: { ...metadata.capabilities },
  };
}

function getFallbackAdapterMetadata(harnessName: string, amuxName: string): AmuxAdapterMetadata {
  const fallback = STATIC_FALLBACK_METADATA[amuxName];
  if (!fallback) {
    throw new Error(
      `No fallback adapter metadata is defined for harness "${harnessName}" ` +
      `(agent-mux adapter "${amuxName}").`,
    );
  }
  return cloneMetadata(fallback);
}

function shouldUseFallbackMetadata(error: unknown): boolean {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === "ERR_UNKNOWN_BUILTIN_MODULE" ||
    code === "ERR_MODULE_NOT_FOUND" ||
    code === "MODULE_NOT_FOUND" ||
    message.includes("node:sqlite")
  );
}

export function getAmuxAdapterMetadata(harnessName: string): AmuxAdapterMetadata {
  const cache = getCache();
  const amuxName = mapHarnessName(harnessName);

  const cached = cache.get(amuxName);
  if (cached) {
    return cached;
  }

  if (!hasNodeSqliteBuiltin()) {
    const fallback = getFallbackAdapterMetadata(harnessName, amuxName);
    cache.set(amuxName, fallback);
    return fallback;
  }

  let amux: Record<string, unknown>;
  let createClient: (() => AmuxClient) | undefined;
  let registerBuiltInAdapters: ((client: AmuxClient) => void) | undefined;

  try {
    amux = requireAmux();
    createClient = amux.createClient as (() => AmuxClient) | undefined;
    registerBuiltInAdapters = amux.registerBuiltInAdapters as ((client: AmuxClient) => void) | undefined;
  } catch (error) {
    if (shouldUseFallbackMetadata(error)) {
      const fallback = getFallbackAdapterMetadata(harnessName, amuxName);
      cache.set(amuxName, fallback);
      return fallback;
    }
    throw error;
  }

  if (!createClient || !registerBuiltInAdapters) {
    const fallback = getFallbackAdapterMetadata(harnessName, amuxName);
    cache.set(amuxName, fallback);
    return fallback;
  }

  let client: AmuxClient;
  try {
    client = createClient();
    registerBuiltInAdapters(client);
  } catch (error) {
    if (shouldUseFallbackMetadata(error)) {
      const fallback = getFallbackAdapterMetadata(harnessName, amuxName);
      cache.set(amuxName, fallback);
      return fallback;
    }
    throw error;
  }

  const adapter = client.adapters.get(amuxName);
  if (!adapter) {
    throw new Error(
      `@a5c-ai/agent-mux does not have an adapter named "${amuxName}" ` +
      `(requested harness: "${harnessName}"). Available adapters may need updating.`,
    );
  }

  const caps = adapter.capabilities;
  if (!caps) {
    throw new Error(
      `@a5c-ai/agent-mux adapter "${amuxName}" has no capabilities defined. ` +
      `Ensure @a5c-ai/agent-mux is up to date.`,
    );
  }

  // Determine if the adapter has a stop hook
  const runtimeHooks = caps.runtimeHooks;
  const hasStopHook = !!(
    runtimeHooks &&
    typeof runtimeHooks === "object" &&
    "stop" in runtimeHooks &&
    runtimeHooks.stop !== "none"
  );
  const hasRuntimeHooks = !!(
    runtimeHooks &&
    typeof runtimeHooks === "object" &&
    Object.values(runtimeHooks).some((v: unknown) => v !== "none")
  );

  const metadata: AmuxAdapterMetadata = {
    name: adapter.agent ?? amuxName,
    hostEnvSignals: adapter.hostEnvSignals ?? [],
    capabilities: {
      supportsSkills: caps.supportsSkills ?? false,
      supportsThinking: caps.supportsThinking ?? false,
      supportsMCP: caps.supportsMCP ?? false,
      requiresToolApproval: caps.requiresToolApproval ?? false,
      supportsInteractiveMode: caps.supportsInteractiveMode ?? false,
      supportsStdinInjection: caps.supportsStdinInjection ?? false,
      supportsSubagentDispatch: caps.supportsSubagentDispatch ?? false,
      supportsParallelExecution: caps.supportsParallelExecution ?? false,
      supportsImageInput: caps.supportsImageInput ?? false,
      hasRuntimeHooks,
      hasStopHook,
    },
    sessionDir: typeof adapter.sessionDir === "function"
      ? adapter.sessionDir()
      : resolveRunsDir(),
  };

  cache.set(amuxName, metadata);
  return metadata;
}

/**
 * Clear the metadata cache. Useful for testing.
 */
export function clearAmuxMetadataCache(): void {
  _metadataCache = undefined;
}
