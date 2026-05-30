import type { TObject } from "@sinclair/typebox";
import type { BackgroundProcessRegistry } from "@a5c-ai/agent-runtime";
import type { DeferredToolRegistry } from "./deferredToolRegistry";

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
  /** Working directory forwarded to agent-mux as `cwd`. */
  workspace?: string;
  /** Model identifier forwarded to agent-mux as `model`. */
  model?: string;
  /** Prompt timeout in milliseconds forwarded to agent-mux as `timeout`. */
  timeout?: number;
  /** Maximum persisted history entries retained on the session handle. Defaults to 20. */
  maxHistoryTurns?: number;
  /** Maximum estimated tokens from prior history sent with a prompt. */
  maxHistoryTokens?: number;
  /** Translated to agent-mux `thinkingEffort`. */
  thinkingLevel?: "minimal" | "low" | "medium" | "high" | "xhigh";
  /**
   * @deprecated Ignored by the agent-mux-backed agent-core runtime.
   * Use agent-mux-specific configuration, or the PI wrapper in
   * `@a5c-ai/agent-platform`, if you still need tool-surface control.
   */
  toolsMode?: "default" | "coding" | "readonly";
  /**
   * @deprecated Ignored by the agent-mux-backed agent-core runtime.
   * Use `createAgentCoreToolDefinitions()` in the host integration or the PI
   * wrapper in `@a5c-ai/agent-platform` for custom tool injection.
   */
  customTools?: unknown[];
  /** Enables interactive approval mode when a host UI context is present. */
  uiContext?: unknown;
  /** Base system prompt text forwarded to agent-mux. */
  systemPrompt?: string;
  /** Additional system prompt segments appended before dispatch. */
  appendSystemPrompt?: string[];
  /**
   * @deprecated Ignored by the agent-mux-backed agent-core runtime.
   * Use the PI wrapper in `@a5c-ai/agent-platform` if you still need
   * extension and skills isolation controls.
   */
  isolated?: boolean;
  /**
   * @deprecated Ignored by the agent-mux-backed agent-core runtime.
   * Session persistence is controlled by the selected agent-mux backend.
   */
  ephemeral?: boolean;
  /**
   * @deprecated Ignored by the agent-mux-backed agent-core runtime.
   * Sandbox behavior now belongs to the selected agent-mux backend.
   */
  bashSandbox?: "auto" | "secure" | "local";
  /**
   * @deprecated Ignored by the agent-mux-backed agent-core runtime.
   * Compaction behavior now belongs to the selected agent-mux backend.
   */
  enableCompaction?: boolean;
  /**
   * @deprecated Ignored by the agent-mux-backed agent-core runtime.
   * Use the target backend's native configuration if you need a custom agents
   * directory.
   */
  agentDir?: string;
  /** Agent-mux adapter/backend name forwarded as `agent`. */
  backend?: string;
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
