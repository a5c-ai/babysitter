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
} from "@a5c-ai/babysitter-sdk";
import { createSecureBashBackend } from "./piSecureSandbox";
import {
  buildCompactionSettings,
  loadCompressionConfigSafe,
} from "./piWrapper/compaction";
import { discoverRepoInstructionPrompts } from "./piWrapper/instructionPrompts";
import {
  configureAzureOpenAiEnvDefaults,
  extractAssistantFailure,
  loadPiModule,
  resolvePiModel,
} from "./piWrapper/moduleSupport";
import type { PiAgentSession } from "./piWrapper/moduleSupport";

const DEFAULT_TIMEOUT_MS = 900_000;
const DEFAULT_BASH_SANDBOX_MODE: NonNullable<PiSessionOptions["bashSandbox"]> = "local";
const AGENT_END_PROMPT_SETTLE_GRACE_MS = 250;

/** Listener for Pi session events. */
export type PiEventListener = (event: PiSessionEvent) => void;

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
      const session = this.session;
      if (session.isStreaming) {
        void session.abort().catch(() => undefined);
      }
      session.dispose();
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
      ...discoverRepoInstructionPrompts(cwd),
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
      const resolved = await resolvePiModel(mod, this.options.model);
      if (resolved) {
        createOpts.model = resolved;
      }
      // If not resolved, let createAgentSession handle default model selection
    }

    try {
      const { session } = await mod.createAgentSession(createOpts);
      if (this.options.uiContext && typeof session.bindExtensions === "function") {
        await session.bindExtensions({ uiContext: this.options.uiContext });
      }
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
