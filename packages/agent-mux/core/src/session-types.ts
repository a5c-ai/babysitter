/**
 * Session-related types for @a5c-ai/agent-mux.
 *
 * Defines the data structures for session summaries, messages, tool calls,
 * queries, cost aggregation, and session diffs.
 *
 * @see 07-session-manager.md
 */

import type { AgentName, CostRecord } from './types.js';
import type { WorkspaceSessionContext } from './workspaces.js';

// ---------------------------------------------------------------------------
// SessionToolCall
// ---------------------------------------------------------------------------

/** A tool call within a session message. */
export interface SessionToolCall {
  /** Tool call ID (agent-assigned). */
  readonly toolCallId: string;

  /** Name of the tool that was called. */
  readonly toolName: string;

  /** Input arguments passed to the tool. */
  readonly input: unknown;

  /** Tool output, if available. */
  readonly output?: unknown;

  /** Duration of the tool call in milliseconds, if recorded. */
  readonly durationMs?: number;
}

// ---------------------------------------------------------------------------
// SessionMessage
// ---------------------------------------------------------------------------

/** A single message within a session. */
export interface SessionMessage {
  /** Role of the message author. */
  readonly role: 'user' | 'assistant' | 'system' | 'tool';

  /** Text content of the message. Empty string for tool-only messages. */
  readonly content: string;

  /** Timestamp when this message was recorded. */
  readonly timestamp?: Date;

  /** Tool calls initiated by this message (assistant role only). */
  readonly toolCalls?: SessionToolCall[];

  /** Tool result (tool role only). */
  readonly toolResult?: {
    readonly toolCallId: string;
    readonly toolName: string;
    readonly output: unknown;
  };

  /** Token usage for this message, if available. */
  readonly tokenUsage?: {
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly thinkingTokens?: number;
    readonly cachedTokens?: number;
  };

  /** Cost for this individual message, if available. */
  readonly cost?: CostRecord;

  /** Thinking/reasoning content, if the agent exposed it. */
  readonly thinking?: string;

  /** Model used for this specific message (may differ within a session). */
  readonly model?: string;
}

// ---------------------------------------------------------------------------
// Workspace runtime surfaces
// ---------------------------------------------------------------------------

export interface WorkspaceRuntimeDeviceProfile {
  readonly id: 'desktop' | 'tablet' | 'mobile';
  readonly label: string;
  readonly width: number;
  readonly height: number;
}

export interface WorkspaceRuntimeLogLine {
  readonly timestamp: number;
  readonly stream: 'stdout' | 'stderr' | 'system';
  readonly text: string;
}

export interface WorkspaceTerminalCommand {
  readonly id: string;
  readonly runId: string;
  readonly source: 'shell' | 'tool';
  readonly toolName?: string;
  readonly command: string;
  readonly status: 'running' | 'completed' | 'failed';
  readonly startedAt: number;
  readonly endedAt?: number;
  readonly exitCode?: number;
  readonly logs: readonly WorkspaceRuntimeLogLine[];
}

export interface WorkspacePreviewSurface {
  readonly status: 'ready' | 'unavailable';
  readonly primaryUrl?: string;
  readonly urls: readonly string[];
  readonly detectedAt?: number;
  readonly deviceProfiles: readonly WorkspaceRuntimeDeviceProfile[];
}

export interface WorkspaceTerminalSurface {
  readonly status: 'active' | 'idle';
  readonly commands: readonly WorkspaceTerminalCommand[];
}

export interface WorkspaceDevServerSurface {
  readonly status: 'running' | 'starting' | 'idle' | 'error';
  readonly command?: string;
  readonly primaryUrl?: string;
  readonly urls: readonly string[];
  readonly port?: number;
  readonly detectedAt?: number;
  readonly logs: readonly WorkspaceRuntimeLogLine[];
}

export type WorkspaceRebaseStatus =
  | 'idle'
  | 'rebase-needed'
  | 'rebase-conflicts'
  | 'ready-for-review'
  | 'ready-for-merge';

export type WorkspaceRebaseLastAction =
  | 'start'
  | 'auto-resolve'
  | 'open-in-editor'
  | 'manual-resolve'
  | 'abort';

export interface WorkspaceRebaseSurface {
  readonly status: WorkspaceRebaseStatus;
  readonly branch?: string;
  readonly targetBranch?: string;
  readonly attemptCount: number;
  readonly unresolvedFiles: readonly string[];
  readonly resolvedFiles: readonly string[];
  readonly followUpInstructions: readonly string[];
  readonly manualResolutionSuggested: boolean;
  readonly readyFor: 'review' | 'merge';
  readonly editorHref?: string;
  readonly lastAction?: WorkspaceRebaseLastAction;
  readonly persistedAt?: number;
}

export interface WorkspaceRuntimeSurface {
  readonly workspacePath?: string;
  readonly updatedAt: number;
  readonly preview: WorkspacePreviewSurface;
  readonly terminal: WorkspaceTerminalSurface;
  readonly devServer: WorkspaceDevServerSurface;
  readonly rebase?: WorkspaceRebaseSurface;
}

// ---------------------------------------------------------------------------
// SessionSummary
// ---------------------------------------------------------------------------

/** Lightweight session summary returned by list() and search(). */
export interface SessionSummary {
  /** The agent that owns this session. */
  readonly agent: AgentName;

  /** The agent's native session identifier. */
  readonly sessionId: string;

  /** The deterministic unified ID: `<agent>:<sessionId>`. */
  readonly unifiedId: string;

  /** Human-readable session title. */
  readonly title: string;

  /** When the session was created. */
  readonly createdAt: Date;

  /** When the session was last modified. */
  readonly updatedAt: Date;

  /** Total number of conversational turns (user-assistant pairs). */
  readonly turnCount: number;

  /** Total number of messages (all roles). */
  readonly messageCount: number;

  /** Model ID used in the session. */
  readonly model?: string;

  /** Aggregated cost for the entire session, if available. */
  readonly cost?: CostRecord;

  /** Consumer-provided tags. */
  readonly tags: string[];

  /** Working directory at session start. */
  readonly cwd?: string;

  /** Workspace/worktree binding inferred or wrapped for this session. */
  readonly workspace?: WorkspaceSessionContext;

  /** Convenience alias for the bound workspace identifier, when known. */
  readonly workspaceId?: string;

  /** Whether this session was forked from another. */
  readonly forkedFrom?: string;

  /** Relevance score (0.0 to 1.0), present only in search results. */
  readonly relevanceScore?: number;

  /** Derived runtime surfaces for the session's workspace, when available. */
  readonly runtime?: WorkspaceRuntimeSurface;
}

// ---------------------------------------------------------------------------
// FullSession (the complete Session type)
// ---------------------------------------------------------------------------

/** Full session object with all messages and metadata. */
export interface FullSession {
  /** The agent that owns this session. */
  readonly agent: AgentName;

  /** The agent's native session identifier. */
  readonly sessionId: string;

  /** The deterministic unified ID: `<agent>:<sessionId>`. */
  readonly unifiedId: string;

  /** Human-readable session title. */
  readonly title: string;

  /** When the session was created. */
  readonly createdAt: Date;

  /** When the session was last modified. */
  readonly updatedAt: Date;

  /** Total number of conversational turns. */
  readonly turnCount: number;

  /** Model ID used in the session. */
  readonly model?: string;

  /** Aggregated cost for the entire session. */
  readonly cost?: CostRecord;

  /** Consumer-provided tags. */
  readonly tags: string[];

  /** Working directory at session start. */
  readonly cwd?: string;

  /** Workspace/worktree binding inferred or wrapped for this session. */
  readonly workspace?: WorkspaceSessionContext;

  /** Convenience alias for the bound workspace identifier, when known. */
  readonly workspaceId?: string;

  /** Parent session ID if forked. */
  readonly forkedFrom?: string;

  /** Derived runtime surfaces for the session's workspace, when available. */
  readonly runtime?: WorkspaceRuntimeSurface;

  /** The ordered list of messages in this session. */
  readonly messages: SessionMessage[];

  /** Raw session data in the agent's native format. */
  readonly raw?: unknown;
}

// ---------------------------------------------------------------------------
// Session (adapter-level parsed session)
// ---------------------------------------------------------------------------

/**
 * Parsed session data returned by adapter.parseSessionFile().
 *
 * This is the adapter-level type. The SessionManager wraps it into
 * a FullSession with unified IDs.
 */
export interface Session {
  /** Session identifier. */
  readonly sessionId: string;

  /** Agent that owns this session. */
  readonly agent: AgentName;

  /** Number of turns in the session. */
  readonly turnCount: number;

  /** When the session was created (ISO 8601). */
  readonly createdAt: string;

  /** When the session was last updated (ISO 8601). */
  readonly updatedAt: string;

  /** Human-readable session title. */
  readonly title?: string;

  /** Model used in the session. */
  readonly model?: string;

  /** Aggregated cost for the session. */
  readonly cost?: CostRecord;

  /** Consumer-provided tags. */
  readonly tags?: string[];

  /** Working directory at session start. */
  readonly cwd?: string;

  /** Workspace/worktree binding inferred or wrapped for this session. */
  readonly workspace?: WorkspaceSessionContext;

  /** Convenience alias for the bound workspace identifier, when known. */
  readonly workspaceId?: string;

  /** Parent session ID if forked. */
  readonly forkedFrom?: string;

  /** Parsed messages, if available. */
  readonly messages?: SessionMessage[];

  /** Raw session data. */
  readonly raw?: unknown;
}

// ---------------------------------------------------------------------------
// Query & Filter types
// ---------------------------------------------------------------------------

/** Options for the list() method. */
export interface SessionListOptions {
  /** Only include sessions created on or after this date. */
  readonly since?: Date;

  /** Only include sessions created on or before this date. */
  readonly until?: Date;

  /** Filter to sessions that used a specific model. */
  readonly model?: string;

  /** Filter to sessions with any of the specified tags. */
  readonly tags?: string[];

  /** Maximum number of results to return. Default: 100. */
  readonly limit?: number;

  /** Sort field. Default: 'date'. */
  readonly sort?: 'date' | 'cost' | 'turns';

  /** Sort direction. Default: 'desc'. */
  readonly sortDirection?: 'asc' | 'desc';

  /** Filter to sessions started in a specific working directory. */
  readonly cwd?: string;
}

/** Parameters for the search() method. */
export interface SessionQuery {
  /** Free-text search string. */
  readonly text: string;

  /** Restrict search to a single agent. */
  readonly agent?: AgentName;

  /** Only include sessions created on or after this date. */
  readonly since?: Date;

  /** Only include sessions created on or before this date. */
  readonly until?: Date;

  /** Filter by model ID. */
  readonly model?: string;

  /** Filter by tags (OR match). */
  readonly tags?: string[];

  /** Maximum number of results. Default: 50. */
  readonly limit?: number;

  /** Sort order. Default: 'relevance'. */
  readonly sort?: 'relevance' | 'date' | 'cost';
}

// ---------------------------------------------------------------------------
// Cost Aggregation
// ---------------------------------------------------------------------------

/** Parameters for cost aggregation. */
export interface CostAggregationOptions {
  /** Restrict to a single agent. */
  readonly agent?: AgentName;

  /** Only include sessions on or after this date. */
  readonly since?: Date;

  /** Only include sessions on or before this date. */
  readonly until?: Date;

  /** Filter by model ID. */
  readonly model?: string;

  /** Filter by tags. */
  readonly tags?: string[];

  /** Group results by dimension. */
  readonly groupBy?: 'agent' | 'model' | 'day' | 'tag';
}

/** Aggregated cost summary. */
export interface CostSummary {
  /** Total cost in USD. */
  totalUsd: number;

  /** Total input tokens. */
  inputTokens: number;

  /** Total output tokens. */
  outputTokens: number;

  /** Total thinking tokens. */
  thinkingTokens: number;

  /** Total cached tokens. */
  cachedTokens: number;

  /** Sessions in aggregation. */
  sessionCount: number;

  /** Runs in aggregation. */
  runCount: number;

  /** Per-group breakdowns when groupBy is set. */
  breakdowns?: Record<string, CostBreakdown>;
}

/** Cost breakdown for a single group. */
export interface CostBreakdown {
  /** Group key. */
  readonly key: string;

  /** Total cost in USD for this group. */
  totalUsd: number;

  /** Input tokens for this group. */
  inputTokens: number;

  /** Output tokens for this group. */
  outputTokens: number;

  /** Thinking tokens for this group. */
  thinkingTokens: number;

  /** Cached tokens for this group. */
  cachedTokens: number;

  /** Sessions in this group. */
  sessionCount: number;
}

// ---------------------------------------------------------------------------
// SessionDiff
// ---------------------------------------------------------------------------

/** Structural diff between two sessions. */
export interface SessionDiff {
  /** Reference to the first session. */
  readonly a: { readonly agent: AgentName; readonly sessionId: string; readonly unifiedId: string };

  /** Reference to the second session. */
  readonly b: { readonly agent: AgentName; readonly sessionId: string; readonly unifiedId: string };

  /** Ordered list of diff operations. */
  readonly operations: DiffOperation[];

  /** Summary statistics. */
  readonly summary: {
    readonly added: number;
    readonly removed: number;
    readonly modified: number;
    readonly unchanged: number;
  };
}

/** A single diff operation describing a structural difference. */
export interface DiffOperation {
  /** Type of change. */
  readonly type: 'added' | 'removed' | 'modified' | 'unchanged';

  /** Zero-based index in session A (undefined for additions). */
  readonly indexA?: number;

  /** Zero-based index in session B (undefined for removals). */
  readonly indexB?: number;

  /** Message from session A (undefined for additions). */
  readonly messageA?: SessionMessage;

  /** Message from session B (undefined for removals). */
  readonly messageB?: SessionMessage;
}
