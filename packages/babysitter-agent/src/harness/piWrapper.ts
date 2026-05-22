/**
 * Pi programmatic API wrapper.
 *
 * Wraps `@mariozechner/pi-coding-agent`'s `createAgentSession()` to expose
 * a persistent `AgentSession` through a babysitter-friendly interface.
 *
 * The session is lazily initialized on first use and reused across prompts.
 * Events are forwarded through the `subscribe()` method.
 */

import { homedir } from "node:os";
import { join } from "node:path";
import type { AgentCoreSessionOptions, AgentCorePromptResult, AgentCoreSessionEvent } from "./types";
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
  describePiModelResolutionFailure,
  extractAssistantFailure,
  loadPiModule,
  resolvePiModel,
} from "./piWrapper/moduleSupport";
import type { PiAgentSession } from "./piWrapper/moduleSupport";

const DEFAULT_TIMEOUT_MS = 900_000;
const DEFAULT_BASH_SANDBOX_MODE: NonNullable<AgentCoreSessionOptions["bashSandbox"]> = "local";
const AGENT_END_PROMPT_SETTLE_GRACE_MS = 250;
const PI_AGENT_DIR_ENV = "PI_CODING_AGENT_DIR";
const DEFAULT_PI_AGENT_DIR = join(homedir(), ".pi", "agent");
const CODING_TOOL_NAMES = ["read", "bash", "edit", "write"] as const;
const READONLY_TOOL_NAMES = ["read", "grep", "find", "ls"] as const;

/** Listener for Pi session events. */
export type AgentCoreEventListener = (event: AgentCoreSessionEvent) => void;

function resolvePiAgentDir(agentDir?: string): string {
  const configured = agentDir?.trim() || process.env[PI_AGENT_DIR_ENV]?.trim();
  if (!configured) {
    return DEFAULT_PI_AGENT_DIR;
  }
  if (configured === "~") {
    return homedir();
  }
  if (configured.startsWith("~/")) {
    return join(homedir(), configured.slice(2));
  }
  return configured;
}

// ---------------------------------------------------------------------------
// AgentCoreSessionHandle
// ---------------------------------------------------------------------------

/**
 * Handle for interacting with the Pi coding agent programmatically.
 *
 * Wraps `AgentSession` from `@mariozechner/pi-coding-agent`. The underlying
 * session is created lazily on first `prompt()` call and reused thereafter.
 */
export class AgentCoreSessionHandle {
  private readonly options: AgentCoreSessionOptions;
  private session: PiAgentSession | null = null;
  private initPromise: Promise<void> | null = null;
  private readonly cleanupTasks: Array<() => Promise<void> | void> = [];
  constructor(options: AgentCoreSessionOptions = {}) {
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
  async prompt(text: string, timeout?: number): Promise<AgentCorePromptResult> {
    await this.initialize();
    const session = this.requireSession();
    const effectiveTimeout = timeout ?? this.options.timeout ?? DEFAULT_TIMEOUT_MS;
    const start = Date.now();
    return new Promise<AgentCorePromptResult>((resolve, reject) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let agentEndGraceTimer: ReturnType<typeof setTimeout> | undefined;
      let agentEndResult: AgentCorePromptResult | null = null;
      let promptSettled = false;
      const finishWithResult = (result: AgentCorePromptResult): void => {
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
      const unsubscribe = session.subscribe((event: AgentCoreSessionEvent) => {
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
  /** Queue a follow-up message for after the current turn completes. */
  async followUp(text: string): Promise<void> {
    const session = this.requireSession();
    await session.followUp(text);
  }
  /**
   * Subscribe to session events.
   *
   * Returns an unsubscribe function.
   */
  subscribe(listener: AgentCoreEventListener): () => void {
    const session = this.requireSession();
    return session.subscribe(listener);
  }
  /** Execute a bash command through the agent's sandbox. */
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
  /** Abort the current prompt execution. */
  async abort(): Promise<void> {
    if (this.session) {
      await this.session.abort();
    }
  }
  /** Dispose of the session and release resources. */
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
  private async cleanupPendingTasks(): Promise<void> {
    while (this.cleanupTasks.length > 0) {
      const cleanup = this.cleanupTasks.pop();
      if (cleanup) {
        await cleanup();
      }
    }
  }
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
    const agentDir = resolvePiAgentDir(this.options.agentDir);
    const compressionConfig = loadCompressionConfigSafe(cwd);
    const compactionEnabled = this.options.enableCompaction ??
      Boolean(compressionConfig?.enabled && compressionConfig.layers.sdkContextHook.enabled);
    const compactionSettings = buildCompactionSettings(compactionEnabled);
    createOpts.cwd = cwd;
    createOpts.agentDir = agentDir;
    if (this.options.thinkingLevel) createOpts.thinkingLevel = this.options.thinkingLevel;
    const customTools = [...(this.options.customTools ?? [])];
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
    if (this.options.toolsMode === "coding") {
      createOpts.tools = [...CODING_TOOL_NAMES];
    } else if (this.options.toolsMode === "readonly") {
      createOpts.tools = [...READONLY_TOOL_NAMES];
    }
    if (secureBashBackend && typeof mod.createBashToolDefinition === "function") {
      customTools.unshift(mod.createBashToolDefinition(cwd, {
        operations: secureBashBackend.operations,
      }));
    }
    if (customTools.length > 0) {
      createOpts.customTools = customTools;
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
          agentDir,
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
      } else {
        await this.cleanupPendingTasks();
        throw new BabysitterRuntimeError(
          "PiModelResolutionFailed",
          describePiModelResolutionFailure(this.options.model),
          { category: ErrorCategory.Configuration },
        );
      }
    }
    try {
      const { session } = await mod.createAgentSession(createOpts);
      if (this.options.uiContext && typeof session.bindExtensions === "function") {
        await session.bindExtensions({ uiContext: this.options.uiContext });
      }
      this.session = session;
    } catch (error: unknown) {
      await this.cleanupPendingTasks();
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
export function createAgentCoreSession(options?: AgentCoreSessionOptions): AgentCoreSessionHandle {
  return new AgentCoreSessionHandle(options);
}
