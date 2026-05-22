/**
 * AgentMuxClient and createClient factory for @a5c-ai/agent-mux.
 */

import * as path from 'node:path';
import { createComponentLogger, telemetry } from '@a5c-ai/agent-mux-observability';

import type { AgentName, ErrorCode, RetryPolicy } from './types.js';
import { AgentMuxError, ValidationError } from './errors.js';
import { resolveStoragePaths } from './storage.js';
import type { StoragePaths } from './storage.js';
import type { RunOptions, RunHandle } from './run-options.js';
import { RunHandleImpl } from './run-handle-impl.js';
import { startSpawnLoop } from './spawn-runner.js';
import { startProgrammaticLoop } from './programmatic-runner.js';
import { startRemoteLoop } from './remote-runner.js';
import { ProfileManagerImpl } from './profiles.js';
import type { ProfileManager } from './profiles.js';
import type { AdapterRegistry } from './adapter-registry.js';
import { AdapterRegistryImpl } from './adapter-registry.js';
import type { ModelRegistry } from './model-registry.js';
import { ModelRegistryImpl } from './model-registry.js';
import type { SessionManager } from './session-manager.js';
import { SessionManagerImpl } from './session-manager.js';
import type { ConfigManager } from './config-manager.js';
import { ConfigManagerImpl } from './config-manager.js';
import type { AuthManager } from './auth-manager.js';
import { AuthManagerImpl } from './auth-manager.js';
import type { PluginManager } from './plugin-manager.js';
import { PluginManagerImpl } from './plugin-manager-impl.js';
import { detectHostHarness, type HostHarnessInfo, type DetectHostHarnessOptions, type HostMetadataReader } from './host-detection.js';

// ---------------------------------------------------------------------------
// ClientOptions (§5.1.1)
// ---------------------------------------------------------------------------

/** Options for creating an AgentMuxClient. */
export interface ClientOptions {
  /** Default agent for runs when `RunOptions.agent` is not specified. */
  defaultAgent?: AgentName;

  /** Default model for runs when `RunOptions.model` is not specified. */
  defaultModel?: string;

  /**
   * Default approval mode for tool calls and file operations.
   * @default 'prompt'
   */
  approvalMode?: 'yolo' | 'prompt' | 'deny';

  /**
   * Default run timeout in milliseconds. 0 means no timeout.
   * Must be a non-negative integer.
   * @default 0
   */
  timeout?: number;

  /**
   * Default inactivity timeout in milliseconds. 0 means no timeout.
   * Must be a non-negative integer.
   * @default 0
   */
  inactivityTimeout?: number;

  /** Default retry policy for transient failures. */
  retryPolicy?: RetryPolicy;

  /**
   * Default streaming mode.
   * @default 'auto'
   */
  stream?: boolean | 'auto';

  /**
   * Override the global config directory path.
   * Must be an absolute path.
   */
  configDir?: string;

  /**
   * Override the project config directory path.
   * Must be an absolute path.
   */
  projectConfigDir?: string;

  /**
   * Enable debug mode.
   * @default false
   */
  debug?: boolean;
}

// ---------------------------------------------------------------------------
// Re-export manager interfaces from their modules
// ---------------------------------------------------------------------------

export type { SessionManager } from './session-manager.js';
export type { ConfigManager } from './config-manager.js';
export type { AuthManager } from './auth-manager.js';
export type { PluginManager } from './plugin-manager.js';

// ---------------------------------------------------------------------------
// AgentMuxClient
// ---------------------------------------------------------------------------

/** The main entry point for interacting with agent-mux. */
export class AgentMuxClient {
  /** Resolved storage paths. */
  readonly storagePaths: StoragePaths;

  /** The options this client was created with (after defaults). */
  readonly options: Readonly<ClientOptions>;

  /** Adapter registry — discovery, capabilities, installation info. */
  readonly adapters: AdapterRegistry;

  /** Model registry — per-agent model lists and metadata. */
  readonly models: ModelRegistry;

  /** Session manager — read native session files. */
  readonly sessions: SessionManager;

  /** Config manager — read/write agent config files. */
  readonly config: ConfigManager;

  /** Auth manager — detect and surface authentication state. */
  readonly auth: AuthManager;

  /** Profile manager — named RunOptions presets. */
  readonly profiles: ProfileManager;

  /** Plugin manager — install, list, remove plugins per agent. */
  readonly plugins: PluginManager;

  /** Logger instance for this client. */
  private readonly logger = createComponentLogger('client');

  /** @internal — use `createClient()` instead. */
  constructor(options: ClientOptions, storagePaths: StoragePaths) {
    this.options = Object.freeze({ ...options });
    this.storagePaths = storagePaths;
    this.profiles = new ProfileManagerImpl(storagePaths);
    const adapterRegistry = new AdapterRegistryImpl();
    this.adapters = adapterRegistry;
    this.models = new ModelRegistryImpl(adapterRegistry);
    this.sessions = new SessionManagerImpl(adapterRegistry);
    this.config = new ConfigManagerImpl(adapterRegistry, this.profiles);
    this.auth = new AuthManagerImpl(adapterRegistry);
    this.plugins = new PluginManagerImpl(adapterRegistry);
  }

  /**
   * Start an agent run and return a handle for streaming events,
   * interaction, and control.
   *
   * @param options - Run configuration. `agent` and `prompt` are required.
   * @returns RunHandle (not yet implemented — throws)
   * @throws AgentMuxError with code INTERNAL until fully implemented.
   *
   * @see 01-core-types-and-client.md §5.2
   */
  run(options: RunOptions): RunHandle {
    try {
      if (!options || typeof options !== 'object') {
        throw new AgentMuxError('VALIDATION_ERROR', 'run() requires RunOptions');
      }
      if (!options.agent) {
        throw new AgentMuxError('VALIDATION_ERROR', 'RunOptions.agent is required');
      }
      if (options.prompt === undefined || options.prompt === null
          || (typeof options.prompt === 'string' && options.prompt.length === 0)
          || (Array.isArray(options.prompt) && options.prompt.length === 0)) {
        throw new AgentMuxError('VALIDATION_ERROR', 'RunOptions.prompt is required and non-empty');
      }

      // Merge client-level defaults onto options (options win).
      const merged: RunOptions = {
        ...options,
        approvalMode: options.approvalMode ?? this.options.approvalMode,
        timeout: options.timeout ?? this.options.timeout,
        inactivityTimeout: options.inactivityTimeout ?? this.options.inactivityTimeout,
        retryPolicy: options.retryPolicy ?? this.options.retryPolicy,
        stream: options.stream ?? this.options.stream,
        model: options.model ?? this.options.defaultModel,
        cwd: options.cwd ?? process.cwd(),
      };

      const adapter = this.adapters.get(merged.agent);
      if (!adapter) {
        throw new AgentMuxError('UNKNOWN_AGENT', `No adapter registered for agent "${merged.agent}"`);
      }

      const runId = merged.runId ?? generateRunId();
      const handle = new RunHandleImpl({
        runId,
        agent: merged.agent,
        model: merged.model,
        approvalMode: merged.approvalMode ?? 'prompt',
        collectEvents: merged.collectEvents ?? false,
        tags: merged.tags,
      });

      // Log and trace the agent run
      this.logger.runStart({
        runId,
        agent: merged.agent,
        prompt: Array.isArray(merged.prompt) ? merged.prompt.join('\n') : merged.prompt,
        model: merged.model,
      });

      telemetry.recordRunStart(merged.agent, merged.model);

      const multiAdapter = adapter as {
        adapterType?: 'subprocess' | 'remote' | 'programmatic';
      };
      if (multiAdapter.adapterType === 'programmatic') {
        startProgrammaticLoop(handle, adapter as never, merged);
      } else if (multiAdapter.adapterType === 'remote') {
        startRemoteLoop(handle, adapter as never, merged);
      } else if (multiAdapter.adapterType === 'subprocess' || multiAdapter.adapterType === undefined) {
        startSpawnLoop(handle, adapter, merged);
      } else {
        throw new AgentMuxError('CAPABILITY_ERROR', `Unsupported adapter type for "${merged.agent}"`, false);
      }

      return handle;
    } catch (err: any) {
      this.logger.runError({
        runId: (options as any)?.runId ?? 'unknown',
        agent: options?.agent ?? 'unknown',
        error: err,
      });
      throw err;
    }
  }

  /**
   * Detect whether the current process is running under a supported harness.
   *
   * Aggregates env signals contributed by each registered adapter's
   * `hostEnvSignals` array with the built-in defaults.
   *
   * @returns HostHarnessInfo if a harness is detected, else null.
   */
  detectHost(opts: DetectHostHarnessOptions = {}): HostHarnessInfo | null {
    // Merge adapter-provided signals & metadata readers over defaults.
    const mergedSignals: Record<string, readonly string[]> = {};
    const mergedMeta: Record<string, HostMetadataReader> = {};
    for (const info of this.adapters.list()) {
      const adapter = this.adapters.get(info.agent) as unknown as {
        hostEnvSignals?: readonly string[];
        readHostMetadata?: HostMetadataReader;
      } | undefined;
      const sigs = adapter?.hostEnvSignals;
      if (Array.isArray(sigs) && sigs.length > 0) {
        mergedSignals[info.agent] = sigs;
      }
      if (typeof adapter?.readHostMetadata === 'function') {
        mergedMeta[info.agent] = adapter.readHostMetadata.bind(adapter);
      }
    }
    return detectHostHarness({
      ...opts,
      signals: { ...mergedSignals, ...(opts.signals ?? {}) },
      metadata: { ...mergedMeta, ...(opts.metadata ?? {}) },
    });
  }
}

// ---------------------------------------------------------------------------
// Run ID generator (Crockford base32, 26 chars, ULID-compatible pattern)
// ---------------------------------------------------------------------------

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function generateRunId(): string {
  let out = '';
  for (let i = 0; i < 26; i++) {
    out += CROCKFORD[Math.floor(Math.random() * CROCKFORD.length)];
  }
  return out;
}

// ---------------------------------------------------------------------------
// createClient() factory (§5.1)
// ---------------------------------------------------------------------------

/**
 * Create an AgentMuxClient instance.
 *
 * Synchronous. Validates options and returns the client immediately.
 * No I/O is performed during construction.
 *
 * @throws ValidationError if any option value is invalid.
 */
export function createClient(options?: ClientOptions): AgentMuxClient {
  const opts = options ?? {};
  validateClientOptions(opts);

  const storagePaths = resolveStoragePaths({
    configDir: opts.configDir,
    projectConfigDir: opts.projectConfigDir,
  });

  return new AgentMuxClient(opts, storagePaths);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Set of all valid ErrorCode values for runtime validation. */
const VALID_ERROR_CODES = new Set<ErrorCode>([
  'CAPABILITY_ERROR', 'VALIDATION_ERROR', 'AUTH_ERROR',
  'AGENT_NOT_FOUND', 'AGENT_NOT_INSTALLED', 'AGENT_CRASH',
  'SPAWN_ERROR', 'TIMEOUT', 'INACTIVITY_TIMEOUT',
  'PARSE_ERROR', 'CONFIG_ERROR', 'CONFIG_LOCK_ERROR',
  'SESSION_NOT_FOUND', 'PROFILE_NOT_FOUND', 'PLUGIN_ERROR',
  'RATE_LIMITED', 'CONTEXT_EXCEEDED', 'ABORTED',
  'RUN_NOT_ACTIVE', 'STDIN_NOT_AVAILABLE', 'NO_PENDING_INTERACTION',
  'INVALID_STATE_TRANSITION', 'PTY_NOT_AVAILABLE', 'UNKNOWN_AGENT', 'INTERNAL',
]);

function validateClientOptions(options: ClientOptions): void {
  const errors: Array<{
    field: string;
    message: string;
    received: unknown;
    expected: string;
  }> = [];

  if (options.timeout !== undefined) {
    if (typeof options.timeout !== 'number' || !Number.isFinite(options.timeout) || options.timeout < 0 || !Number.isInteger(options.timeout)) {
      errors.push({
        field: 'timeout',
        message: 'must be a non-negative integer',
        received: options.timeout,
        expected: '>= 0 (integer, ms)',
      });
    }
  }

  if (options.inactivityTimeout !== undefined) {
    if (
      typeof options.inactivityTimeout !== 'number' ||
      !Number.isFinite(options.inactivityTimeout) ||
      options.inactivityTimeout < 0 ||
      !Number.isInteger(options.inactivityTimeout)
    ) {
      errors.push({
        field: 'inactivityTimeout',
        message: 'must be a non-negative integer',
        received: options.inactivityTimeout,
        expected: '>= 0 (integer, ms)',
      });
    }
  }

  if (options.configDir !== undefined) {
    if (!path.isAbsolute(options.configDir)) {
      errors.push({
        field: 'configDir',
        message: 'must be an absolute path',
        received: options.configDir,
        expected: 'Absolute path',
      });
    }
  }

  if (options.projectConfigDir !== undefined) {
    if (!path.isAbsolute(options.projectConfigDir)) {
      errors.push({
        field: 'projectConfigDir',
        message: 'must be an absolute path',
        received: options.projectConfigDir,
        expected: 'Absolute path',
      });
    }
  }

  if (options.approvalMode !== undefined) {
    const valid = ['yolo', 'prompt', 'deny'];
    if (!valid.includes(options.approvalMode)) {
      errors.push({
        field: 'approvalMode',
        message: 'must be one of: yolo, prompt, deny',
        received: options.approvalMode,
        expected: "'yolo' | 'prompt' | 'deny'",
      });
    }
  }

  if (options.retryPolicy !== undefined) {
    const rp = options.retryPolicy;
    if (rp.maxAttempts !== undefined && (typeof rp.maxAttempts !== 'number' || !Number.isFinite(rp.maxAttempts) || rp.maxAttempts < 1 || !Number.isInteger(rp.maxAttempts))) {
      errors.push({ field: 'retryPolicy.maxAttempts', message: 'must be an integer >= 1', received: rp.maxAttempts, expected: '>= 1 (integer)' });
    }
    if (rp.baseDelayMs !== undefined && (typeof rp.baseDelayMs !== 'number' || !Number.isFinite(rp.baseDelayMs) || rp.baseDelayMs < 0 || !Number.isInteger(rp.baseDelayMs))) {
      errors.push({ field: 'retryPolicy.baseDelayMs', message: 'must be a non-negative integer', received: rp.baseDelayMs, expected: '>= 0 (integer)' });
    }
    if (rp.maxDelayMs !== undefined && (typeof rp.maxDelayMs !== 'number' || !Number.isFinite(rp.maxDelayMs) || rp.maxDelayMs < 0 || !Number.isInteger(rp.maxDelayMs))) {
      errors.push({ field: 'retryPolicy.maxDelayMs', message: 'must be a non-negative integer', received: rp.maxDelayMs, expected: '>= 0 (integer)' });
    }
    // Cross-field: maxDelayMs must be >= baseDelayMs (using defaults when not provided)
    {
      const effectiveBase = rp.baseDelayMs ?? 1000;
      const effectiveMax = rp.maxDelayMs ?? 30_000;
      if (effectiveMax < effectiveBase) {
        errors.push({ field: 'retryPolicy.maxDelayMs', message: 'must be >= baseDelayMs', received: rp.maxDelayMs ?? effectiveMax, expected: `>= ${effectiveBase}` });
      }
    }
    if (rp.jitterFactor !== undefined && (typeof rp.jitterFactor !== 'number' || !Number.isFinite(rp.jitterFactor) || rp.jitterFactor < 0 || rp.jitterFactor > 1)) {
      errors.push({ field: 'retryPolicy.jitterFactor', message: 'must be between 0.0 and 1.0', received: rp.jitterFactor, expected: '[0.0, 1.0]' });
    }
    if (rp.retryOn !== undefined) {
      if (!Array.isArray(rp.retryOn)) {
        errors.push({ field: 'retryPolicy.retryOn', message: 'must be an array of ErrorCode strings', received: rp.retryOn, expected: 'ErrorCode[]' });
      } else {
        for (const code of rp.retryOn) {
          if (!VALID_ERROR_CODES.has(code as ErrorCode)) {
            errors.push({ field: 'retryPolicy.retryOn', message: `invalid error code: ${String(code)}`, received: code, expected: 'ErrorCode' });
          }
        }
      }
    }
  }

  if (options.stream !== undefined) {
    if (options.stream !== true && options.stream !== false && options.stream !== 'auto') {
      errors.push({
        field: 'stream',
        message: "must be true, false, or 'auto'",
        received: options.stream,
        expected: "boolean | 'auto'",
      });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}
