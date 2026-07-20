import type { TObject } from "@sinclair/typebox";
import type { BackgroundProcessRegistry } from "@a5c-ai/genty-runtime";
import type { DeferredToolRegistry } from "./deferredToolRegistry";
import type { SignedEnvelope } from "./trust/types";
import type { ModelDecisionPayload } from "./trust/model-decision";

export type AgentCoreOutputFormat = "text" | "json_object" | "json_schema";

export interface AgentCoreJsonSchema {
  [key: string]: unknown;
}

export interface AgentCoreStructuredOutputOptions {
  /**
   * Optional structured-output mode. The default `"text"` preserves the
   * historical plain-string result path.
   */
  outputFormat?: AgentCoreOutputFormat;
  /** JSON Schema used when `outputFormat` is `"json_schema"`. */
  outputSchema?: AgentCoreJsonSchema;
  /** Provider-visible schema name. Defaults to `agent_core_response`. */
  outputSchemaName?: string;
  /** Provider strictness flag for APIs that support schema strictness. */
  outputSchemaStrict?: boolean;
}

export type AgentCorePromptInput = string | AgentCorePromptPart[];

export type AgentCorePromptPart =
  | AgentCoreTextPromptPart
  | AgentCoreImageUrlPromptPart
  | AgentCoreImageBase64PromptPart;

export interface AgentCoreTextPromptPart {
  type: "text";
  text: string;
}

export interface AgentCoreImageUrlPromptPart {
  type: "image_url";
  imageUrl: string;
  mediaType?: string;
}

export interface AgentCoreImageBase64PromptPart {
  type: "image_base64";
  data: string;
  mediaType: string;
}

export interface AgentCorePromptOptions extends AgentCoreStructuredOutputOptions {
  timeout?: number;
}

export interface AgentCorePromptResult<TParsed = unknown> {
  output: string;
  duration: number;
  success: boolean;
  exitCode: number;
  /** Parsed JSON when a structured output mode is requested and parsing succeeds. */
  parsed?: TParsed;
  /** JSON parse or schema validation failure detail for structured output modes. */
  validationError?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    provider?: string;
    model?: string;
    /** Tokens served from a vendor prompt cache (Anthropic `cache_read_input_tokens`, OpenAI/Azure `cached_tokens`). */
    cacheReadTokens?: number;
    /** Tokens written to a vendor prompt cache (Anthropic `cache_creation_input_tokens` only; OpenAI/Azure don't report writes). */
    cacheWriteTokens?: number;
  };
}

export interface AgentCoreHistoryEntry {
  role: "user" | "assistant";
  content: string;
}

export interface AgentCoreSessionEvent {
  type: string;
  [key: string]: unknown;
}

export interface AgentCoreSessionOptions extends AgentCoreStructuredOutputOptions {
  /** Working directory forwarded to adapters as `cwd`. */
  workspace?: string;
  /** Model identifier forwarded to adapters as `model`. */
  model?: string;
  /** Prompt timeout in milliseconds forwarded to adapters as `timeout`. */
  timeout?: number;
  /** Maximum persisted history entries retained on the session handle. Defaults to 20. */
  maxHistoryTurns?: number;
  /** Maximum estimated tokens from prior history sent with a prompt. */
  maxHistoryTokens?: number;
  /** Translated to adapters `thinkingEffort`. */
  thinkingLevel?: "minimal" | "low" | "medium" | "high" | "xhigh";
  /**
   * Reserved tool-surface mode hint. The agent-core completion runtime forwards
   * whatever `customTools` are supplied; this flag is advisory for hosts that
   * curate the tool list themselves.
   */
  toolsMode?: "default" | "coding" | "readonly";
  /**
   * Custom tool definitions exposed to the model via the provider's native
   * tool-calling API. When present, agent-core runs a tool-calling loop:
   * each tool call invokes the matching definition's `execute()` and the
   * resulting `ToolResult` is fed back to the model until it emits plain text.
   * When empty/omitted, no tools are sent and the plain-text/structured-output
   * path is preserved.
   */
  customTools?: CustomToolDefinition[];
  /** Enables interactive approval mode when a host UI context is present. */
  uiContext?: unknown;
  /** Base system prompt text forwarded to adapters. */
  systemPrompt?: string;
  /** Additional system prompt segments appended before dispatch. */
  appendSystemPrompt?: string[];
  /**
   * @deprecated Ignored by the adapters-backed agent-core runtime.
   * Use the PI wrapper in `@a5c-ai/genty-platform` if you still need
   * extension and skills isolation controls.
   */
  isolated?: boolean;
  /**
   * @deprecated Ignored by the adapters-backed agent-core runtime.
   * Session persistence is controlled by the selected adapters backend.
   */
  ephemeral?: boolean;
  /**
   * @deprecated Ignored by the adapters-backed agent-core runtime.
   * Sandbox behavior now belongs to the selected adapters backend.
   */
  bashSandbox?: "auto" | "secure" | "local";
  /**
   * @deprecated Ignored by the adapters-backed agent-core runtime.
   * Compaction behavior now belongs to the selected adapters backend.
   */
  enableCompaction?: boolean;
  /**
   * @deprecated Ignored by the adapters-backed agent-core runtime.
   * Use the target backend's native configuration if you need a custom agents
   * directory.
   */
  agentDir?: string;
  /** Adapters adapter/backend name forwarded as `agent`. */
  backend?: string;
  /**
   * Milestone C (AC-15) — the genty adapter identity key used to sign the
   * IN-PROCESS, correlation-grade model-decision attestation for each model turn.
   * When present, the session signs ONE `ModelDecisionPayload` per turn binding
   * every tool call and attaches it (plus `endpoint.model`) to each call's
   * `ToolExecutionContext`. When absent, no in-process attestation is produced and
   * the tool-execution path is unchanged (back-compat).
   *
   * This key is held INSIDE the agent process, so the attestation it produces is
   * correlation-grade only (AC-39) — NOT the authoritative out-of-agent proxy
   * attestation. A policy step requiring proxy attestation rejects it.
   */
  modelAttestationKey?: {
    privateKey: string;
    publicKey: string;
    fingerprint: string;
  };
  /** sha256 over the turn's input messages, bound into the in-process attestation. */
  modelAttestationInputMessagesHash?: string;
  /**
   * Milestone D (§9.4 / AC-23b / AC-49) — the genty session tool-execution GATE.
   * When present, it is consulted BEFORE `definition.execute` for each tool call: a
   * COVERED action without a valid CommandAuthorization is denied before execution
   * (this seam is a LOAD-BEARING, un-bypassable blocking gate). A denial short-
   * circuits the call with an error tool-result. When absent, the tool-execution
   * path is unchanged (no covered actions configured). Never a fallback: any thrown
   * exception is treated as a denial by the gate implementation.
   */
  policyToolGate?: (context: {
    toolName: string;
    toolCallId: string;
    input: unknown;
    modelId?: string;
  }) => { allowed: boolean; reason?: string };
  /**
   * Opt-in vendor-aware prompt caching. When absent, no caching directives are
   * added to any provider request body (current behavior, byte-identical).
   * Per-provider knobs are independent because each vendor's cache mechanism
   * has a different shape (Anthropic: explicit breakpoints; OpenAI/Azure:
   * automatic, config is advisory only; Gemini: implicit + optional explicit
   * resource).
   *
   * The `anthropic`, `openai`, and `azure` sub-configs are wired up in
   * `callCompletionApi`. The `gemini` sub-config is declared but unsupported:
   * genty-core has no Gemini endpoint today, so setting it throws rather than
   * being silently ignored (see the plan's §3.4).
   */
  promptCaching?: {
    /** Master switch. Defaults to false. When false, all sub-options are ignored. */
    enabled: boolean;
    anthropic?: {
      /**
       * Where to place cache_control breakpoints. See genty-core's
       * `docs/research/genty-llm-prompt-caching-plan.md` §4 for placement
       * rationale. Defaults to `["system", "tools"]` when enabled.
       */
      breakpoints?: Array<"tools" | "system" | "history">;
      /** cache_control.ttl. Anthropic supports "5m" (default) or "1h". */
      ttl?: "5m" | "1h";
    };
    openai?: {
      /** Forwarded as prompt_cache_key (routing hint only, no-op if unsupported by model). */
      promptCacheKey?: string;
    };
    azure?: {
      /** Forwarded as prompt_cache_key where the deployment supports it. */
      promptCacheKey?: string;
    };
    gemini?: {
      /**
       * "implicit" relies on automatic server-side caching (no request
       * change). "explicit" requires an out-of-band CachedContent resource.
       * Defaults to "implicit" when enabled.
       */
      mode?: "implicit" | "explicit";
      /** Required when mode === "explicit". */
      cachedContentName?: string;
      ttl?: string; // e.g. "3600s"
    };
  };
}

export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
}

export type ToolUpdateEvent =
  | { type: "tool.stdout"; callId: string; chunk: string; sequence: number }
  | { type: "tool.stderr"; callId: string; chunk: string; sequence: number }
  | { type: "tool.progress"; callId: string; message?: string; current?: number; total?: number }
  | { type: "tool.cancelled"; callId: string; reason?: string };

export interface ToolExecutionContext {
  signal?: AbortSignal;
  limits?: {
    timeoutMs?: number;
    maxOutputBytes?: number;
  };
  cache?: {
    get(key: string, signal?: AbortSignal): Promise<unknown> | unknown;
  };
  /**
   * Milestone C (AC-15) — the model id (`endpoint.model`) that drove this turn,
   * flowed from `runCompletionLoop` into the per-call execution context so a gate
   * can correlate the executing tool call with the model decision that authorized it.
   */
  modelId?: string;
  /**
   * Milestone C (AC-15) — the IN-PROCESS (correlation-grade) model-decision
   * attestation signed once per model turn, binding EVERY tool call the model
   * emitted. The SAME signed envelope is attached to each call's context; each gate
   * matches its own `toolCallId` against the signed `toolCalls[]` (AC-34a).
   *
   * This producer's key is held INSIDE the agent process, so it is correlation-grade
   * only (AC-39) — NOT the authoritative out-of-agent proxy attestation.
   */
  modelAttestation?: SignedEnvelope<ModelDecisionPayload>;
}

export type UnifiedToolSource = "builtin" | "mcp" | "plugin" | "custom";

export interface UnifiedToolEntry {
  name: string;
  description: string;
  source: UnifiedToolSource;
  sourceQualifier?: string;
  metadata?: Record<string, unknown>;
}

export interface UnifiedToolSchema {
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface ResolvedUnifiedToolEntry extends UnifiedToolEntry {
  schema: UnifiedToolSchema;
}

export interface UnifiedToolRegistryLike {
  registerAll?(tools: Array<{
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
    source: UnifiedToolSource;
    sourceQualifier?: string;
    metadata?: Record<string, unknown>;
  }>): void;
  searchTools(query: string, maxResults?: number): UnifiedToolEntry[];
  fetchSchema(
    toolName: string,
    source?: UnifiedToolSource,
    sourceQualifier?: string,
  ): Promise<ResolvedUnifiedToolEntry | undefined>;
}

export interface UnifiedToolDispatcherLike {
  dispatch(
    context: {
      toolName: string;
      input: unknown;
      caller?: string;
      /** Milestone D (AC-34a) — the executing tool-call id GATE 1 binds an authorization to. */
      toolCallId?: string;
      signal?: AbortSignal;
      onUpdate?: (event: ToolUpdateEvent) => void | Promise<void>;
    },
    executor: (
      tool: { name: string },
      context: { input: unknown },
    ) => Promise<unknown>,
  ): Promise<{ output: unknown; durationMs: number; error?: string | { message?: string } }>;
}

export interface ToolMetadata {
  category: string;
  tags?: string[];
  cost?: Record<string, unknown>;
  rateLimit?: Record<string, unknown>;
  requiresApproval?: "never" | "on-risk" | "always";
  cache?: Record<string, unknown>;
}

export interface CustomToolDefinition {
  name: string;
  label: string;
  description: string;
  promptSnippet?: string;
  parameters: TObject;
  metadata?: ToolMetadata;
  /**
   * Agent-core may pass a shared execution context as the fourth argument.
   * Long-running tools should honor its AbortSignal when present and still keep
   * any tool-specific timeout/background cleanup behavior they require.
   */
  execute: (
    toolCallId: string,
    params: Record<string, unknown>,
    onUpdate?: ((event: ToolUpdateEvent) => void | Promise<void>) | unknown,
    toolContext?: ToolExecutionContext | unknown,
  ) => Promise<ToolResult> | ToolResult;
}

export interface AgentCoreToolOptions {
  workspace: string;
  /**
   * Additional absolute directories that READ-ONLY file tools (read/grep/find)
   * may access in addition to the workspace. Write tools (write/edit) ignore
   * this and stay strictly workspace-bounded. Used to grant the planning agent
   * read access to the active process-library/reference roots its own prompt
   * tells it to search, so it cannot get trapped retrying an unreachable path.
   */
  readOnlyRoots?: string[];
  /**
   * Enables host interaction on the tool surface. When `false`,
   * `AskUserQuestion` returns an unavailable error and never invokes the
   * injected handler.
   */
  interactive: boolean;
  /** Only consulted when `interactive` is `true`. */
  askUserQuestionHandler?: (...args: unknown[]) => Promise<unknown>;
  taskHandler?: (...args: unknown[]) => Promise<unknown>;
  skillHandler?: (...args: unknown[]) => Promise<unknown>;
  onToolUse?: (toolName: string, params: unknown) => void;
  onBackgroundComplete?: (event: unknown) => void;
  maxBackgroundProcesses?: number;
  registryId?: string;
  signal?: AbortSignal;
  limits?: {
    defaultTimeoutMs?: number;
    defaultMaxOutputBytes?: number;
  };
  cache?: ToolExecutionContext["cache"];
  /** Optional externally managed registry. When provided, the caller owns disposal. */
  backgroundRegistry?: BackgroundProcessRegistry;
  /** Canonical unified registry from tools-adapter. */
  toolRegistry?: UnifiedToolRegistryLike;
  /** Canonical dispatcher from tools-adapter used by code_executor nested tool calls. */
  toolDispatcher?: UnifiedToolDispatcherLike;
  /** @deprecated Use toolRegistry from @a5c-ai/tools-adapter. */
  deferredToolRegistry?: DeferredToolRegistry;
  /**
   * Opt-in Programmatic Tool Calling / Code Mode surface. When enabled,
   * agent-core exposes a single `code_executor` tool that can execute a
   * JavaScript tool chain against the already configured agent-core tools.
   */
  programmaticToolCalling?: boolean | ProgrammaticToolCallingOptions;
}

export interface ProgrammaticToolCallingOptions {
  /** Maximum wall-clock time for one code_executor invocation. Default: 120000. */
  timeout?: number;
  /** Maximum nested tool calls allowed from one code_executor invocation. Default: 25. */
  maxToolCalls?: number;
}

export const AGENT_CORE_TOOL_NAMES: string[] = [
  "read",
  "write",
  "edit",
  "grep",
  "find",
  "bash",
  "python",
  "ssh",
  "browser",
  "fetch",
  "AskUserQuestion",
  "task",
  "create_todo",
  "assign_task",
  "search_tasks",
  "escalate",
  "skill",
  "calc",
  "ast_grep",
  "ast_edit",
  "render_mermaid",
  "notebook",
  "config",
  "background_status",
  "background_list",
  "tool_search",
  "tool_fetch",
  "code_executor",
  "web_search",
  "fetch_process",
];
