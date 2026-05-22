/**
 * Core types for @a5c-ai/agent-mux.
 *
 * Defines all foundational type aliases, interfaces, and union types
 * used across the agent-mux system.
 */

// ---------------------------------------------------------------------------
// Agent Names (§1.4)
// ---------------------------------------------------------------------------

/**
 * Agent names — derived from Atlas graph at runtime.
 * Any string is accepted; the adapter registry resolves names to implementations.
 */
export type BuiltInAgentName = string;
export type AgentName = string;

// ---------------------------------------------------------------------------
// Error Codes (§3.1)
// ---------------------------------------------------------------------------

/** Machine-readable error codes defined by agent-mux. */
export type ErrorCode =
  | 'CAPABILITY_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'AGENT_NOT_FOUND'
  | 'AGENT_NOT_INSTALLED'
  | 'AGENT_CRASH'
  | 'SPAWN_ERROR'
  | 'TIMEOUT'
  | 'INACTIVITY_TIMEOUT'
  | 'PARSE_ERROR'
  | 'CONFIG_ERROR'
  | 'CONFIG_LOCK_ERROR'
  | 'SESSION_NOT_FOUND'
  | 'PROFILE_NOT_FOUND'
  | 'PLUGIN_ERROR'
  | 'RATE_LIMITED'
  | 'CONTEXT_EXCEEDED'
  | 'ABORTED'
  | 'RUN_NOT_ACTIVE'
  | 'STDIN_NOT_AVAILABLE'
  | 'NO_PENDING_INTERACTION'
  | 'INTERACTION_NOT_FOUND'
  | 'INVALID_STATE_TRANSITION'
  | 'PTY_NOT_AVAILABLE'
  | 'UNKNOWN_AGENT'
  | 'INTERNAL';

// ---------------------------------------------------------------------------
// Validation (§3.3)
// ---------------------------------------------------------------------------

/** A single field-level validation error. */
export interface ValidationFieldError {
  /** Dot-path to the invalid field (e.g., "temperature"). */
  field: string;

  /** What went wrong. */
  message: string;

  /** The value that was provided. */
  received: unknown;

  /** The expected type or range. */
  expected: string;
}

// ---------------------------------------------------------------------------
// Events (§2.5)
// ---------------------------------------------------------------------------

/** Base shape shared by every event emitted on a RunHandle. */
export interface BaseEvent {
  /** Discriminator tag for the event union type. */
  type: string;

  /** ULID of the run that produced this event. */
  runId: string;

  /** Name of the agent that produced this event. */
  agent: AgentName;

  /**
   * Unix epoch milliseconds when this event was created by agent-mux.
   * This is the parse time, not the agent's internal timestamp.
   */
  timestamp: number;

  /**
   * Origin of the event inside agent-mux.
   * Omitted for legacy agent-originated events.
   */
  source?: string;

  /**
   * The raw, unparsed line from the agent's output.
   * Present only when the client is created with `debug: true`
   * or the run is started with `debug: true`.
   * Omitted in production to reduce memory pressure.
   */
  raw?: string;
}

// ---------------------------------------------------------------------------
// Global Configuration (§4.1.2)
// ---------------------------------------------------------------------------

/** Schema for `~/.agent-mux/config.json`. */
export interface GlobalConfig {
  /**
   * Default agent used when `RunOptions.agent` is not specified
   * and no profile overrides it.
   */
  defaultAgent?: AgentName;

  /**
   * Default model used when `RunOptions.model` is not specified.
   * Agent-specific; ignored if the agent does not support this model.
   */
  defaultModel?: string;

  /**
   * Default approval mode for tool calls and file operations.
   * @default 'prompt'
   */
  approvalMode?: 'yolo' | 'prompt' | 'deny';

  /**
   * Default run timeout in milliseconds. 0 means no timeout.
   * @default 0
   */
  timeout?: number;

  /**
   * Default inactivity timeout in milliseconds. 0 means no timeout.
   * @default 0
   */
  inactivityTimeout?: number;

  /** Default retry policy. */
  retryPolicy?: RetryPolicy;

  /**
   * Default streaming mode.
   * @default 'auto'
   */
  stream?: boolean | 'auto';
}

// ---------------------------------------------------------------------------
// Auth Hints (§4.1.4)
// ---------------------------------------------------------------------------

/** Schema for `~/.agent-mux/auth-hints.json`. */
export interface AuthHintsFile {
  /** Schema version for forward compatibility. */
  version: 1;

  /** Per-agent cached auth state. */
  agents: Record<AgentName, AuthHintEntry>;
}

/** A single cached auth-state entry. */
export interface AuthHintEntry {
  /** Last detected auth status. */
  status: 'authenticated' | 'unauthenticated' | 'expired' | 'unknown';

  /** Auth method that was detected. */
  method?: string;

  /** Identity string (e.g., email or username). */
  identity?: string;

  /** When this hint expires and should be re-checked. */
  expiresAt?: string;

  /** ISO 8601 timestamp of when this hint was last updated. */
  checkedAt: string;
}

// ---------------------------------------------------------------------------
// Run Index (§4.2.3)
// ---------------------------------------------------------------------------

/** A single entry in `.agent-mux/run-index.jsonl`. */
export interface RunIndexEntry {
  /** Schema version for the entry format. */
  v: 1;

  /** ULID of the run. Globally unique, time-sortable. */
  runId: string;

  /** Agent that was invoked. */
  agent: AgentName;

  /** Model that was used (if known). */
  model?: string;

  /** The agent's native session ID (if applicable). */
  sessionId?: string;

  /**
   * ISO 8601 timestamp when the run started.
   * Always in UTC with 'Z' suffix.
   */
  timestamp: string;

  /** Cost record, if cost data was available. */
  cost?: CostRecord;

  /** Consumer-provided tags for filtering and grouping. */
  tags: string[];
}

/** Aggregated cost data for a single run. */
export interface CostRecord {
  /** Total cost in USD. */
  totalUsd: number;

  /** Input tokens consumed. */
  inputTokens: number;

  /** Output tokens generated. */
  outputTokens: number;

  /** Thinking/reasoning tokens (if applicable). */
  thinkingTokens?: number;

  /** Cached input tokens (if applicable). @deprecated Use cacheCreationTokens + cacheReadTokens for granular attribution. */
  cachedTokens?: number;

  /** Cache creation tokens - tokens used to create new cache entries. */
  cacheCreationTokens?: number;

  /** Cache read tokens - tokens read from existing cache entries. */
  cacheReadTokens?: number;
}

// ---------------------------------------------------------------------------
// Profiles (§2.7)
// ---------------------------------------------------------------------------

/** Data stored in a profile JSON file. All fields are optional. */
export interface ProfileData {
  /** The agent to use. */
  agent?: AgentName;

  /** The model to use. */
  model?: string;

  /** Approval mode. */
  approvalMode?: 'yolo' | 'prompt' | 'deny';

  /** Run timeout in milliseconds. */
  timeout?: number;

  /** Inactivity timeout in milliseconds. */
  inactivityTimeout?: number;

  /** Maximum turns. */
  maxTurns?: number;

  /** Thinking effort level. */
  thinkingEffort?: 'low' | 'medium' | 'high' | 'max';

  /** Thinking budget in tokens. */
  thinkingBudgetTokens?: number;

  /** Override thinking behavior entirely. */
  thinkingOverride?: Record<string, unknown>;

  /** Temperature for sampling. */
  temperature?: number;

  /** Top-P for sampling. */
  topP?: number;

  /** Top-K for sampling. */
  topK?: number;

  /** Maximum output tokens. */
  maxTokens?: number;

  /** Maximum output tokens (alias). */
  maxOutputTokens?: number;

  /** Streaming mode. */
  stream?: boolean | 'auto';

  /** Output format. */
  outputFormat?: 'text' | 'json' | 'jsonl';

  /** Retry policy. */
  retryPolicy?: RetryPolicy;

  /** System prompt. */
  systemPrompt?: string;

  /** System prompt injection mode. */
  systemPromptMode?: 'prepend' | 'append' | 'replace';

  /** Skills to load. */
  skills?: string[];

  /** MCP server configurations. */
  mcpServers?: McpServerConfig[];

  /** Tags for run indexing. */
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Plugins (§2.8)
// ---------------------------------------------------------------------------

/** Supported plugin packaging formats across agents. */
export type PluginFormat =
  | 'npm-package'
  | 'skill-file'
  | 'skill-directory'
  | 'extension-ts'
  | 'channel-plugin'
  | 'mcp-server';

// ---------------------------------------------------------------------------
// Retry Policy (§5.1.1)
// ---------------------------------------------------------------------------

/** Configuration for automatic retry on transient failures. All fields are optional with spec-defined defaults. */
export interface RetryPolicy {
  /**
   * Maximum number of retry attempts. Must be an integer >= 1.
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Base delay between retries in milliseconds.
   * Actual delay uses exponential backoff: baseDelayMs * 2^(attempt-1).
   * @default 1000
   */
  baseDelayMs?: number;

  /**
   * Maximum delay between retries in milliseconds.
   * Caps the exponential backoff. Must be an integer >= baseDelayMs.
   * @default 30000
   */
  maxDelayMs?: number;

  /**
   * Jitter factor applied to the delay. 0 means no jitter; 1 means
   * up to 100% random jitter added. Must be in [0.0, 1.0].
   * @default 0.1
   */
  jitterFactor?: number;

  /**
   * Which error codes are retryable.
   * @default ['RATE_LIMITED', 'AGENT_CRASH', 'TIMEOUT']
   */
  retryOn?: ErrorCode[];
}

// ---------------------------------------------------------------------------
// Attachments (§3)
// ---------------------------------------------------------------------------

/** A file or data attachment for a run prompt. Exactly one source must be set. */
export interface Attachment {
  /** Absolute path to a local file. */
  filePath?: string;

  /** URL to fetch the attachment from. */
  url?: string;

  /** Base64-encoded content. Requires `mimeType` to be set. */
  base64?: string;

  /** MIME type of the attachment (required when `base64` is set). */
  mimeType?: string;

  /** Human-readable name for the attachment. */
  name?: string;
}

// ---------------------------------------------------------------------------
// Forward-reference event types for RunOptions callbacks
// ---------------------------------------------------------------------------

/** Event emitted when an agent requires user input during a run. */
export interface InputRequiredEvent {
  /** Discriminator. */
  type: 'input_required';

  /** ULID of the run. */
  runId: string;

  /** Agent that requires input. */
  agent: AgentName;

  /** Unix epoch milliseconds. */
  timestamp: number;

  /** Optional message describing what input is needed. */
  message?: string;
}

/** Event emitted when an agent requests approval for a tool call. */
export interface ApprovalRequestEvent {
  /** Discriminator. */
  type: 'approval_request';

  /** ULID of the run. */
  runId: string;

  /** Agent requesting approval. */
  agent: AgentName;

  /** Unix epoch milliseconds. */
  timestamp: number;

  /** Tool name that requires approval. */
  tool?: string;

  /** Arguments to the tool call. */
  arguments?: Record<string, unknown>;

  /** Human-readable description of the action. */
  description?: string;
}

// ---------------------------------------------------------------------------
// Forward declarations
// ---------------------------------------------------------------------------

/**
 * MCP server configuration.
 * Defines how to connect to a Model Context Protocol server.
 */
export interface McpServerConfig {
  /** The name of the MCP server. Must match `^[a-zA-Z0-9_-]{1,64}$`. */
  name: string;

  /** The transport type. */
  transport: 'stdio' | 'sse' | 'streamable-http';

  /** Command to spawn (for stdio transport). */
  command?: string;

  /** Arguments for the command. */
  args?: string[];

  /** Environment variables for the server process. */
  env?: Record<string, string>;

  /** URL for SSE or streamable-http transports. */
  url?: string;

  /** Additional HTTP headers for SSE or streamable-http transports. */
  headers?: Record<string, string>;
}
