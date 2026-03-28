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
import { loadCompressionConfig } from "../compression/config-loader";
import { createSecureBashBackend } from "./piSecureSandbox";

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_BASH_SANDBOX_MODE: NonNullable<PiSessionOptions["bashSandbox"]> = "local";
const AGENT_END_PROMPT_SETTLE_GRACE_MS = 250;

/** Listener for Pi session events. */
export type PiEventListener = (event: PiSessionEvent) => void;

// ---------------------------------------------------------------------------
// Dynamic import helper — keeps @mariozechner/pi-coding-agent optional
// ---------------------------------------------------------------------------

interface PiModelRegistry {
  find(provider: string, modelId: string): PiModelEntry | undefined;
  getAll(): PiModelEntry[];
  getApiKey?(model: PiModelEntry): Promise<string | null>;
  hasConfiguredAuth?(model: PiModelEntry): boolean;
  getApiKeyAndHeaders?(model: PiModelEntry): Promise<{
    ok: boolean;
    apiKey?: string;
    headers?: Record<string, string>;
    error?: string;
  }>;
  getApiKeyForProvider?(provider: string): Promise<string | undefined>;
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
  DefaultResourceLoader: new (options?: Record<string, unknown>) => {
    reload(): Promise<void>;
  };
  AuthStorage: PiAuthStorage & { create(path?: string): PiAuthStorage };
  ModelRegistry: new (auth: PiAuthStorage, modelsPath?: string) => PiModelRegistry;
  SessionManager: {
    inMemory(): unknown;
  };
  SettingsManager: {
    inMemory(settings?: Record<string, unknown>): unknown;
  };
  codingTools?: unknown[];
  readOnlyTools?: unknown[];
  createCodingTools?: (cwd: string, options?: Record<string, unknown>) => unknown[];
  createReadOnlyTools?: (cwd: string, options?: Record<string, unknown>) => unknown[];
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

function normalizeAzureOpenAiBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const normalizedPath = parsed.pathname.replace(/\/+$/, "");
    const isAzureOpenAiHost = /\.openai\.azure\.com$/i.test(parsed.hostname);

    if (normalizedPath === "/openai/v1") {
      return `${parsed.origin}${normalizedPath}`;
    }
    if (normalizedPath === "/openai") {
      return `${parsed.origin}/openai/v1`;
    }
    if (isAzureOpenAiHost && (normalizedPath === "" || normalizedPath === "/")) {
      return `${parsed.origin}/openai/v1`;
    }
  } catch {
    // Fall back to the raw value when the URL cannot be parsed.
  }

  return trimmed;
}

function configureAzureOpenAiEnvDefaults(requestedModel?: string): void {
  const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME || process.env.AZURE_OPENAI_PROJECT_NAME;
  if (!process.env.AZURE_OPENAI_RESOURCE_NAME && process.env.AZURE_OPENAI_PROJECT_NAME) {
    process.env.AZURE_OPENAI_RESOURCE_NAME = process.env.AZURE_OPENAI_PROJECT_NAME;
  }
  if (process.env.AZURE_OPENAI_BASE_URL) {
    process.env.AZURE_OPENAI_BASE_URL = normalizeAzureOpenAiBaseUrl(process.env.AZURE_OPENAI_BASE_URL);
  } else if (resourceName) {
    process.env.AZURE_OPENAI_BASE_URL = normalizeAzureOpenAiBaseUrl(`https://${resourceName}.openai.azure.com`);
  }
  if (
    requestedModel &&
    !requestedModel.includes(":") &&
    process.env.AZURE_OPENAI_DEPLOYMENT &&
    !process.env.AZURE_OPENAI_DEPLOYMENT_NAME_MAP
  ) {
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME_MAP = `${requestedModel}=${process.env.AZURE_OPENAI_DEPLOYMENT}`;
  }
}

function synthesizeAzureModelEntry(modelId: string): PiModelEntry | undefined {
  if (!process.env.AZURE_OPENAI_API_KEY) {
    return undefined;
  }
  const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME || process.env.AZURE_OPENAI_PROJECT_NAME;
  const baseUrl = process.env.AZURE_OPENAI_BASE_URL
    ? normalizeAzureOpenAiBaseUrl(process.env.AZURE_OPENAI_BASE_URL)
    : (resourceName ? normalizeAzureOpenAiBaseUrl(`https://${resourceName}.openai.azure.com`) : undefined);
  if (!baseUrl) {
    return undefined;
  }

  return {
    id: modelId,
    name: modelId,
    provider: "azure-openai-responses",
    api: "openai-responses",
    baseUrl,
    reasoning: true,
    input: ["text"],
    contextWindow: 128000,
    maxTokens: 16384,
    cost: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
    },
  };
}

function extractAssistantFailure(messages: unknown[] | undefined): string | undefined {
  if (!Array.isArray(messages) || messages.length === 0) {
    return undefined;
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message || typeof message !== "object") {
      continue;
    }
    const candidate = message as {
      role?: unknown;
      stopReason?: unknown;
      errorMessage?: unknown;
    };
    if (candidate.role !== "assistant") {
      continue;
    }
    if (candidate.stopReason === "error" && typeof candidate.errorMessage === "string" && candidate.errorMessage.trim()) {
      return candidate.errorMessage.trim();
    }
  }

  return undefined;
}

async function modelHasUsableAuth(
  registry: PiModelRegistry,
  model: PiModelEntry,
): Promise<boolean> {
  if (typeof registry.hasConfiguredAuth === "function") {
    return registry.hasConfiguredAuth(model);
  }

  if (typeof registry.getApiKey === "function") {
    const key = await registry.getApiKey(model);
    return Boolean(key);
  }

  if (typeof registry.getApiKeyAndHeaders === "function") {
    const result = await registry.getApiKeyAndHeaders(model);
    return Boolean(
      result.ok &&
      ((typeof result.apiKey === "string" && result.apiKey.length > 0) ||
        (result.headers && Object.keys(result.headers).length > 0)),
    );
  }

  if (typeof registry.getApiKeyForProvider === "function") {
    const key = await registry.getApiKeyForProvider(model.provider);
    return Boolean(key);
  }

  return false;
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
  private readonly cleanupTasks: Array<() => Promise<void> | void> = [];

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
      let agentEndGraceTimer: ReturnType<typeof setTimeout> | undefined;
      let agentEndResult: PiPromptResult | null = null;
      let promptSettled = false;

      const finishWithResult = (result: PiPromptResult): void => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        if (agentEndGraceTimer) clearTimeout(agentEndGraceTimer);
        resolve(result);
      };

      const finishWithPromptError = (err: unknown): void => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        if (agentEndGraceTimer) clearTimeout(agentEndGraceTimer);
        const message = err instanceof Error ? err.message : String(err);
        resolve({
          output: message,
          exitCode: 1,
          duration: Date.now() - start,
          success: false,
        });
      };

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
          const messages = Array.isArray((event as { messages?: unknown[] }).messages)
            ? (event as { messages?: unknown[] }).messages
            : undefined;
          unsubscribe();

          const assistantFailure = extractAssistantFailure(messages);
          const assistantText = session.getLastAssistantText();
          const output = assistantText && assistantText.trim().length > 0
            ? assistantText
            : assistantFailure ?? "";
          agentEndResult = {
            output,
            exitCode: assistantFailure ? 1 : 0,
            duration: Date.now() - start,
            success: !assistantFailure,
          };
          if (promptSettled) {
            finishWithResult(agentEndResult);
            return;
          }
          agentEndGraceTimer = setTimeout(() => {
            if (agentEndResult) {
              finishWithResult(agentEndResult);
            }
          }, AGENT_END_PROMPT_SETTLE_GRACE_MS);
        }
      });

      // Fire the prompt — errors are caught and resolved as failures
      session.prompt(text)
        .then(() => {
          promptSettled = true;
          if (agentEndResult) {
            finishWithResult(agentEndResult);
          }
        })
        .catch((err: unknown) => {
          promptSettled = true;
          if (agentEndResult) {
            finishWithResult(agentEndResult);
            return;
          }
          unsubscribe();
          finishWithPromptError(err);
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
    await this.initialize();
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
    while (this.cleanupTasks.length > 0) {
      const cleanup = this.cleanupTasks.pop();
      if (cleanup) {
        void cleanup();
      }
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
    configureAzureOpenAiEnvDefaults(
      typeof this.options.model === "string" ? this.options.model : undefined,
    );

    const createOpts: Record<string, unknown> = {};
    const cwd = this.options.workspace ?? process.cwd();
    const compressionConfig = loadCompressionConfigSafe(cwd);
    const compactionEnabled = this.options.enableCompaction ??
      Boolean(compressionConfig?.enabled && compressionConfig.layers.sdkContextHook.enabled);
    const compactionSettings = buildCompactionSettings(compactionEnabled);
    createOpts.cwd = cwd;
    if (this.options.agentDir) createOpts.agentDir = this.options.agentDir;
    if (this.options.thinkingLevel) createOpts.thinkingLevel = this.options.thinkingLevel;
    if (this.options.customTools) createOpts.customTools = this.options.customTools;
    if (this.options.ephemeral) {
      createOpts.sessionManager = mod.SessionManager.inMemory();
    }

    const secureBashBackend = this.options.toolsMode === "coding" || this.options.toolsMode === "readonly"
      ? await createSecureBashBackend({
        workspace: cwd,
        mode: this.options.bashSandbox ?? DEFAULT_BASH_SANDBOX_MODE,
      })
      : null;
    if (secureBashBackend) {
      this.cleanupTasks.push(() => secureBashBackend.dispose());
    }
    const toolOptions = secureBashBackend
      ? {
        bash: {
          operations: secureBashBackend.operations,
        },
      }
      : undefined;

    if (this.options.toolsMode === "coding") {
      createOpts.tools = mod.createCodingTools
        ? mod.createCodingTools(cwd, toolOptions)
        : mod.codingTools;
    } else if (this.options.toolsMode === "readonly") {
      createOpts.tools = mod.createReadOnlyTools
        ? mod.createReadOnlyTools(cwd, toolOptions)
        : mod.readOnlyTools;
    }

    const appendedSystemPrompt = [
      ...(this.options.appendSystemPrompt ?? []),
      ...(secureBashBackend ? [secureBashBackend.promptNote] : []),
    ];

    if (
      this.options.systemPrompt ||
      appendedSystemPrompt.length > 0 ||
      this.options.isolated ||
      compactionEnabled
    ) {
      const settingsManager = mod.SettingsManager.inMemory({
        quietStartup: true,
        compaction: compactionSettings.compaction,
        branchSummary: compactionSettings.branchSummary,
      });
      createOpts.settingsManager = settingsManager;
      if (
        this.options.systemPrompt ||
        appendedSystemPrompt.length > 0 ||
        this.options.isolated
      ) {
        const resourceLoader = new mod.DefaultResourceLoader({
          cwd,
          agentDir: this.options.agentDir,
          settingsManager,
          noExtensions: this.options.isolated === true,
          noSkills: this.options.isolated === true,
          noPromptTemplates: this.options.isolated === true,
          noThemes: this.options.isolated === true,
          agentsFilesOverride: this.options.isolated === true
            ? () => ({ agentsFiles: [] })
            : undefined,
          systemPromptOverride: this.options.systemPrompt
            ? () => this.options.systemPrompt
            : undefined,
          appendSystemPromptOverride: appendedSystemPrompt.length > 0
            ? (base: string[]) => [...base, ...appendedSystemPrompt]
            : undefined,
        });
        await resourceLoader.reload();
        createOpts.resourceLoader = resourceLoader;
      }
    }

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
            if (await modelHasUsableAuth(registry, m)) {
              resolved = m;
              break;
            }
          }
        }
      }
      if (!resolved) {
        resolved = synthesizeAzureModelEntry(modelStr);
      }
      if (resolved) {
        createOpts.model = resolved;
      }
      // If not resolved, let createAgentSession handle default model selection
    }

    try {
      const { session } = await mod.createAgentSession(createOpts);
      this.session = session;
    } catch (error: unknown) {
      while (this.cleanupTasks.length > 0) {
        const cleanup = this.cleanupTasks.pop();
        if (cleanup) {
          await cleanup();
        }
      }
      throw error;
    }
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

function loadCompressionConfigSafe(cwd: string) {
  try {
    return loadCompressionConfig(cwd);
  } catch {
    return null;
  }
}

function readPositiveIntegerEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildCompactionSettings(enabled: boolean): {
  compaction: {
    enabled: boolean;
    reserveTokens?: number;
    keepRecentTokens?: number;
  };
  branchSummary?: {
    reserveTokens?: number;
    skipPrompt?: boolean;
  };
} {
  if (!enabled) {
    return {
      compaction: { enabled: false },
    };
  }

  return {
    compaction: {
      enabled: true,
      reserveTokens: readPositiveIntegerEnv("BABYSITTER_PI_COMPACTION_RESERVE_TOKENS", 8_192),
      keepRecentTokens: readPositiveIntegerEnv("BABYSITTER_PI_COMPACTION_KEEP_RECENT_TOKENS", 12_288),
    },
    branchSummary: {
      reserveTokens: readPositiveIntegerEnv("BABYSITTER_PI_BRANCH_SUMMARY_RESERVE_TOKENS", 4_096),
      skipPrompt: false,
    },
  };
}
