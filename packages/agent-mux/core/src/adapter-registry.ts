/**
 * AdapterRegistry interface and implementation for @a5c-ai/agent-mux.
 *
 * @see 05-adapter-system.md §5
 */

import type { AgentName } from './types.js';
import type { AgentCapabilities, InstallMethod } from './capabilities.js';
import type {
  AgentAdapter,
  AgentAdapterInfo,
  InstalledAgentInfo,
} from './adapter.js';
import { AgentMuxError, ValidationError } from './errors.js';

// ---------------------------------------------------------------------------
// AdapterRegistry Interface
// ---------------------------------------------------------------------------

/**
 * Registry of agent adapters. Manages discovery, detection, capability
 * queries, and plugin adapter registration.
 */
export interface AdapterRegistry {
  /** Returns metadata for all registered adapters. Synchronous. */
  list(): AgentAdapterInfo[];

  /** Detects all registered agents and returns installation status. */
  installed(): Promise<InstalledAgentInfo[]>;

  /** Detects whether a specific agent is installed. */
  detect(agent: AgentName): Promise<InstalledAgentInfo | null>;

  /** Returns the capabilities manifest for a specific agent. */
  capabilities(agent: AgentName): AgentCapabilities;

  /** Returns platform-specific installation instructions for an agent. */
  installInstructions(agent: AgentName, platform?: NodeJS.Platform): InstallMethod[];

  /** Retrieves the adapter instance for a given agent. */
  get(agent: AgentName): AgentAdapter | undefined;

  /** Registers a new adapter or replaces an existing one. */
  register(adapter: AgentAdapter): void;

  /** Removes an adapter from the registry. */
  unregister(agent: AgentName): void;
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface RegistryEntry {
  adapter: AgentAdapter;
  source: 'built-in' | 'plugin';
}

interface DetectCacheEntry {
  info: InstalledAgentInfo;
  expiresAt: number;
}

function parseVersionParts(version: string): number[] | null {
  const match = version.match(/\d+(?:\.\d+)*/);
  if (!match) return null;

  return match[0].split('.').map((part) => Number.parseInt(part, 10));
}

function meetsMinVersion(version: string | null, minVersion: string | undefined): boolean {
  if (!minVersion) return true;
  if (!version) return false;

  const actual = parseVersionParts(version);
  const required = parseVersionParts(minVersion);
  if (!actual || !required) return false;

  const len = Math.max(actual.length, required.length);
  for (let i = 0; i < len; i += 1) {
    const actualPart = actual[i] ?? 0;
    const requiredPart = required[i] ?? 0;
    if (actualPart > requiredPart) return true;
    if (actualPart < requiredPart) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// AdapterRegistryImpl
// ---------------------------------------------------------------------------

/** Cache duration for detect() results in milliseconds. */
const DETECT_CACHE_TTL_MS = 30_000;

/**
 * Map-based implementation of AdapterRegistry.
 */
export class AdapterRegistryImpl implements AdapterRegistry {
  private readonly _adapters = new Map<string, RegistryEntry>();
  private readonly _detectCache = new Map<string, DetectCacheEntry>();

  /**
   * Registers an adapter as a built-in. Same as register() but marks
   * the source as 'built-in'.
   */
  registerBuiltIn(adapter: AgentAdapter): void {
    this._validateAdapter(adapter);
    this._adapters.set(adapter.agent, { adapter, source: 'built-in' });
    this._detectCache.delete(adapter.agent);
  }

  // ── AdapterRegistry interface ────────────────────────────────────

  list(): AgentAdapterInfo[] {
    const result: AgentAdapterInfo[] = [];
    for (const [, entry] of this._adapters) {
      result.push({
        agent: entry.adapter.agent,
        displayName: entry.adapter.displayName,
        cliCommand: entry.adapter.cliCommand,
        minVersion: entry.adapter.minVersion,
        source: entry.source,
      });
    }
    result.sort((a, b) => a.agent.localeCompare(b.agent));
    return result;
  }

  async installed(): Promise<InstalledAgentInfo[]> {
    const agents = Array.from(this._adapters.keys());
    const results = await Promise.all(
      agents.map((agent) => this.detect(agent)),
    );
    return results.filter((r): r is InstalledAgentInfo => r !== null);
  }

  async detect(agent: AgentName): Promise<InstalledAgentInfo | null> {
    const entry = this._adapters.get(agent);
    if (!entry) return null;

    // Check cache
    const cached = this._detectCache.get(agent);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.info;
    }

    // Perform detection
    const adapter = entry.adapter;
    let authState: 'authenticated' | 'unauthenticated' | 'expired' | 'unknown' = 'unknown';
    try {
      const auth = await adapter.detectAuth();
      authState = auth.status;
    } catch {
      // Detection failure is not fatal
    }

    const installation = typeof adapter.detectInstallation === 'function'
      ? await adapter.detectInstallation().catch(() => null)
      : null;

    const version = installation?.version ?? null;
    const minVersion = adapter.minVersion ?? '';

    const info: InstalledAgentInfo = {
      agent: adapter.agent,
      installed: installation?.installed ?? false,
      cliPath: installation?.path ?? null,
      version,
      meetsMinVersion: meetsMinVersion(version, adapter.minVersion),
      minVersion,
      authState,
      activeModel: adapter.defaultModelId ?? null,
    };

    // Cache result
    this._detectCache.set(agent, {
      info,
      expiresAt: Date.now() + DETECT_CACHE_TTL_MS,
    });

    return info;
  }

  capabilities(agent: AgentName): AgentCapabilities {
    const entry = this._adapters.get(agent);
    if (!entry) {
      throw new AgentMuxError(
        'UNKNOWN_AGENT',
        `No adapter registered for agent "${agent}"`,
      );
    }
    return entry.adapter.capabilities;
  }

  installInstructions(agent: AgentName, platform?: NodeJS.Platform): InstallMethod[] {
    const entry = this._adapters.get(agent);
    if (!entry) {
      throw new AgentMuxError(
        'UNKNOWN_AGENT',
        `No adapter registered for agent "${agent}"`,
      );
    }
    const plat = platform ?? process.platform;
    return entry.adapter.capabilities.installMethods.filter(
      (m) => m.platform === 'all' || m.platform === plat,
    );
  }

  get(agent: AgentName): AgentAdapter | undefined {
    return this._adapters.get(agent)?.adapter;
  }

  register(adapter: AgentAdapter): void {
    this._validateAdapter(adapter);
    this._adapters.set(adapter.agent, { adapter, source: 'plugin' });
    this._detectCache.delete(adapter.agent);
  }

  unregister(agent: AgentName): void {
    if (!this._adapters.has(agent)) {
      throw new AgentMuxError(
        'UNKNOWN_AGENT',
        `No adapter registered for agent "${agent}"`,
      );
    }
    this._adapters.delete(agent);
    this._detectCache.delete(agent);
  }

  // ── Validation ───────────────────────────────────────────────────

  private _validateAdapter(adapter: AgentAdapter): void {
    const errors: Array<{
      field: string;
      message: string;
      received: unknown;
      expected: string;
    }> = [];

    if (!adapter.agent || typeof adapter.agent !== 'string') {
      errors.push({
        field: 'agent',
        message: 'must be a non-empty string',
        received: adapter.agent,
        expected: 'non-empty string',
      });
    }

    if (!adapter.displayName || typeof adapter.displayName !== 'string') {
      errors.push({
        field: 'displayName',
        message: 'must be a non-empty string',
        received: adapter.displayName,
        expected: 'non-empty string',
      });
    }

    if (!adapter.cliCommand || typeof adapter.cliCommand !== 'string') {
      errors.push({
        field: 'cliCommand',
        message: 'must be a non-empty string',
        received: adapter.cliCommand,
        expected: 'non-empty string',
      });
    }

    if (!adapter.capabilities || typeof adapter.capabilities !== 'object') {
      errors.push({
        field: 'capabilities',
        message: 'must be a valid AgentCapabilities object',
        received: adapter.capabilities,
        expected: 'AgentCapabilities',
      });
    }

    if (!Array.isArray(adapter.models)) {
      errors.push({
        field: 'models',
        message: 'must be an array',
        received: adapter.models,
        expected: 'ModelCapabilities[]',
      });
    }

    if (typeof adapter.buildSpawnArgs !== 'function') {
      errors.push({
        field: 'buildSpawnArgs',
        message: 'must be a function',
        received: typeof adapter.buildSpawnArgs,
        expected: 'function',
      });
    }

    if (typeof adapter.parseEvent !== 'function') {
      errors.push({
        field: 'parseEvent',
        message: 'must be a function',
        received: typeof adapter.parseEvent,
        expected: 'function',
      });
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }
}
