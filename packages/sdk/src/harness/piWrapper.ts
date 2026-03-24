/**
 * Pi programmatic API wrapper.
 *
 * Wraps `@mariozechner/pi-coding-agent`'s `createAgentSession()` to expose
 * a persistent `AgentSession` through a babysitter-friendly interface.
 *
 * The session is lazily initialized on first use and reused across prompts.
 * Events are forwarded through the `subscribe()` method.
 */

import type { PiSessionOptions, PiPromptResult, PiSessionEvent } from "./types";
import {
  BabysitterRuntimeError,
  ErrorCategory,
} from "../runtime/exceptions";

const DEFAULT_TIMEOUT_MS = 120_000;

/** Listener for Pi session events. */
export type PiEventListener = (event: PiSessionEvent) => void;

// ---------------------------------------------------------------------------
// Dynamic import helper — keeps @mariozechner/pi-coding-agent optional
// ---------------------------------------------------------------------------

interface PiModelRegistry {
  find(provider: string, modelId: string): PiModelEntry | undefined;
  getAll(): PiModelEntry[];
  getApiKey(model: PiModelEntry): Promise<string | null>;
}

interface PiModelEntry {
  id: string;
  provider: string;
  api: string;
  baseUrl: string;
  [key: string]: unknown;
}

interface PiAuthStorage {
  create(path?: string): PiAuthStorage;
}

interface PiCodingAgentModule {
  createAgentSession: (options?: Record<string, unknown>) => Promise<{
    session: PiAgentSession;
    extensionsResult?: unknown;
    modelFallbackMessage?: string;
  }>;
  AuthStorage: PiAuthStorage & { create(path?: string): PiAuthStorage };
  ModelRegistry: new (auth: PiAuthStorage, modelsPath?: string) => PiModelRegistry;
}

/** Minimal subset of AgentSession we depend on. */
interface PiAgentSession {
  prompt(text: string, options?: Record<string, unknown>): Promise<void>;
  steer(text: string): Promise<void>;
  followUp(text: string): Promise<void>;
  subscribe(listener: (event: PiSessionEvent) => void): () => void;
  executeBash(
    command: string,
    onChunk?: (chunk: string) => void,
    options?: Record<string, unknown>,
  ): Promise<{ output: string; exitCode: number | undefined; cancelled: boolean; truncated: boolean }>;
  abort(): Promise<void>;
  dispose(): void;
  getLastAssistantText(): string | undefined;
  get sessionId(): string;
  get isStreaming(): boolean;
  get messages(): unknown[];
}

// Use a variable to prevent TypeScript from resolving the module at compile time.
// The package is optional — only needed when pi harness is actually used.
const PI_MODULE_ID = "@mariozechner/pi-coding-agent";

// Use an indirect dynamic import so TypeScript does not downlevel to require()
// in CommonJS builds.  The pi-coding-agent package is ESM-only so a real
// import() is required.  In Vitest, the standard import() works because mocks
// intercept it; in production builds we use the new Function trick to preserve
// the native import().
const dynamicImportPi: (specifier: string) => Promise<unknown> = (() => {
  if (process.env.VITEST) {
    return (specifier: string) => import(specifier);
  }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("id", "return import(id)") as (id: string) => Promise<unknown>;
})();

async function loadPiModule(): Promise<PiCodingAgentModule> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mod = await dynamicImportPi(PI_MODULE_ID);
    return mod as PiCodingAgentModule;
  } catch {
    throw new BabysitterRuntimeError(
      "PiModuleNotFound",
      "Cannot load @mariozechner/pi-coding-agent — is the package installed?",
      { category: ErrorCategory.Configuration },
    );
  }
}

// ---------------------------------------------------------------------------
// PiSessionHandle
// ---------------------------------------------------------------------------

/**
 * Handle for interacting with the Pi coding agent programmatically.
 *
 * Wraps `AgentSession` from `@mariozechner/pi-coding-agent`. The underlying
 * session is created lazily on first `prompt()` call and reused thereafter.
 */
export class PiSessionHandle {
  private readonly options: PiSessionOptions;
  private session: PiAgentSession | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(options: PiSessionOptions = {}) {
    this.options = options;
  }

  /**
   * Initialize the underlying AgentSession.
   *
   * Called automatically by `prompt()` if the session hasn't been created yet.
   * Safe to call multiple times — subsequent calls are no-ops.
   */
  async initialize(): Promise<void> {
    if (this.session) return;
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.doInitialize().catch((err: unknown) => {
      this.initPromise = null;
      throw err;
    });
    await this.initPromise;
  }

  /**
   * Send a prompt to the Pi agent and wait for completion.
   *
   * Initializes the session if needed, sends the prompt, waits for the
   * `agent_end` event, and returns collected output.
   */
  async prompt(text: string, timeout?: number): Promise<PiPromptResult> {
    await this.initialize();
    const session = this.requireSession();
    const effectiveTimeout = timeout ?? this.options.timeout ?? DEFAULT_TIMEOUT_MS;
    const start = Date.now();

    return new Promise<PiPromptResult>((resolve, reject) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;

      // Set up timeout
      if (effectiveTimeout > 0) {
        timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          unsubscribe();
          void session.abort();
          reject(
            new BabysitterRuntimeError(
              "PiTimeoutError",
              `Pi prompt timed out after ${effectiveTimeout}ms`,
              { category: ErrorCategory.External },
            ),
          );
        }, effectiveTimeout);
      }

      // Subscribe to events to detect completion
      const unsubscribe = session.subscribe((event: PiSessionEvent) => {
        if (settled) return;

        if (event.type === "agent_end") {
          settled = true;
          if (timer) clearTimeout(timer);
          unsubscribe();

          const output = session.getLastAssistantText() ?? "";
          resolve({
            output,
            exitCode: 0,
            duration: Date.now() - start,
            success: true,
          });
        }
      });

      // Fire the prompt — errors are caught and resolved as failures
      session.prompt(text).catch((err: unknown) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        unsubscribe();

        const message = err instanceof Error ? err.message : String(err);
        resolve({
          output: message,
          exitCode: 1,
          duration: Date.now() - start,
          success: false,
        });
      });
    });
  }

  /**
   * Steer the running agent with an instruction.
   *
   * Steering messages are delivered immediately to the agent while it is
   * processing a prompt.
   */
  async steer(text: string): Promise<void> {
    const session = this.requireSession();
    await session.steer(text);
  }

  /**
   * Queue a follow-up message for after the current turn completes.
   */
  async followUp(text: string): Promise<void> {
    const session = this.requireSession();
    await session.followUp(text);
  }

  /**
   * Subscribe to session events.
   *
   * Returns an unsubscribe function.
   */
  subscribe(listener: PiEventListener): () => void {
    const session = this.requireSession();
    return session.subscribe(listener);
  }

  /**
   * Execute a bash command through the agent's sandbox.
   */
  async executeBash(
    command: string,
    onChunk?: (chunk: string) => void,
  ): Promise<{ output: string; exitCode: number | undefined; cancelled: boolean }> {
    const session = this.requireSession();
    const result = await session.executeBash(command, onChunk);
    return {
      output: result.output,
      exitCode: result.exitCode,
      cancelled: result.cancelled,
    };
  }

  /**
   * Abort the current prompt execution.
   */
  async abort(): Promise<void> {
    if (this.session) {
      await this.session.abort();
    }
  }

  /**
   * Dispose of the session and release resources.
   */
  dispose(): void {
    if (this.session) {
      this.session.dispose();
      this.session = null;
      this.initPromise = null;
    }
  }

  /** The underlying pi session ID, if initialized. */
  get sessionId(): string | undefined {
    return this.session?.sessionId;
  }

  /** Whether the session is currently streaming a response. */
  get isStreaming(): boolean {
    return this.session?.isStreaming ?? false;
  }

  /** Whether the session has been initialized. */
  get isInitialized(): boolean {
    return this.session !== null;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private async doInitialize(): Promise<void> {
    const mod = await loadPiModule();

    // Bridge common Azure env var aliases that pi-coding-agent doesn't know
    // about.  Pi expects AZURE_OPENAI_RESOURCE_NAME; the user's profile may
    // set AZURE_OPENAI_PROJECT_NAME instead.
    if (!process.env.AZURE_OPENAI_RESOURCE_NAME && process.env.AZURE_OPENAI_PROJECT_NAME) {
      process.env.AZURE_OPENAI_RESOURCE_NAME = process.env.AZURE_OPENAI_PROJECT_NAME;
    }

    const createOpts: Record<string, unknown> = {};
    if (this.options.workspace) createOpts.cwd = this.options.workspace;
    if (this.options.agentDir) createOpts.agentDir = this.options.agentDir;
    if (this.options.thinkingLevel) createOpts.thinkingLevel = this.options.thinkingLevel;
    if (this.options.customTools) createOpts.customTools = this.options.customTools;

    // Resolve model string to a model object from pi's ModelRegistry.
    // The `createAgentSession` API expects a model object (with provider,
    // api, baseUrl, etc.), not a plain string.  We accept formats:
    //   "provider:modelId"  e.g. "azure-openai-responses:gpt-4.1"
    //   "modelId"           e.g. "gpt-4.1" (searches all providers)
    if (typeof this.options.model === "string") {
      const modelStr = this.options.model;
      const auth = mod.AuthStorage.create();
      const registry = new mod.ModelRegistry(auth);

      let resolved: PiModelEntry | undefined;
      if (modelStr.includes(":")) {
        const [provider, modelId] = modelStr.split(":", 2);
        resolved = registry.find(provider, modelId);
      }
      if (!resolved) {
        // Search all models for a matching id
        const all = registry.getAll();
        // Prefer models with a working API key
        for (const m of all) {
          if (m.id === modelStr || m.id === modelStr.split(":").pop()) {
            const key = await registry.getApiKey(m);
            if (key) {
              resolved = m;
              break;
            }
          }
        }
      }
      if (resolved) {
        createOpts.model = resolved;
      }
      // If not resolved, let createAgentSession handle default model selection
    }

    const { session } = await mod.createAgentSession(createOpts);
    this.session = session;
  }

  private requireSession(): PiAgentSession {
    if (!this.session) {
      throw new BabysitterRuntimeError(
        "PiSessionNotInitialized",
        "Pi session has not been initialized — call initialize() or prompt() first",
        { category: ErrorCategory.Runtime },
      );
    }
    return this.session;
  }
}

/**
 * Create a new Pi session handle.
 *
 * The underlying `AgentSession` is created lazily on first use.
 */
export function createPiSession(options?: PiSessionOptions): PiSessionHandle {
  return new PiSessionHandle(options);
}
