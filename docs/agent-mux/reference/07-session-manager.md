# Session Manager and Session Data Access

**Specification v1.0** | `@a5c-ai/agent-mux`

> **SCOPE EXTENSION:** hermes-agent (`@NousResearch/hermes-agent`) is included as a 10th supported agent per explicit project requirements from the project owner. It extends the original scope document's 9 built-in agents. All hermes-specific content in this spec is marked with this same scope extension note.

---

## 1. Overview

The `SessionManager` provides read-only access to agent session data stored in each agent's native format and location. agent-mux does not own, replicate, or migrate session data -- it reads on demand, normalizes into unified types, and exposes a consistent query surface across all ten supported agents.

The session subsystem addresses four primary concerns:

1. **Listing and retrieval.** Enumerate sessions for a given agent, filtered and sorted by various criteria, and retrieve full session content by ID.
2. **Cross-agent search.** Full-text search across sessions from any combination of agents, with unified result ranking.
3. **Cost aggregation.** Compute total spend across agents, models, time ranges, and tags.
4. **Session interop.** Unified session IDs that map bidirectionally to each agent's native session identifiers, plus diff and export capabilities for cross-agent session comparison.

### 1.1 Design Principles

- **Read-only by contract.** `SessionManager` never writes to agent session files. Session creation and mutation happen exclusively through `RunHandle` (which spawns the agent subprocess) or the agent's own CLI. This avoids corruption of agent-native formats.
- **Lazy parsing.** Session files are parsed on demand, not indexed eagerly. The `list()` method reads only metadata (file timestamps, lightweight header parsing) unless content is explicitly requested.
- **Adapter-delegated parsing.** Each agent adapter implements `parseSessionFile()` and `listSessionFiles()`. The `SessionManager` orchestrates; the adapter knows the format.
- **Unified ID scheme.** Every session gets a deterministic unified ID of the form `<agent>:<native-id>`. This enables cross-agent references without a central registry.

### 1.2 Cross-References

| Type / Concept | Spec | Section |
|---|---|---|
| `AgentName`, `BuiltInAgentName` | `01-core-types-and-client.md` | 1.4 |
| `AgentMuxClient`, `createClient()` | `01-core-types-and-client.md` | 5 |
| `RunOptions` | `02-run-options-and-profiles.md` | 2 |
| `RunHandle` | `03-run-handle-and-interaction.md` | 2 |
| `AgentEvent`, `BaseEvent` | `04-agent-events.md` | 2 |
| `CostRecord` | `01-core-types-and-client.md` | 4.2.3 |
| `AgentAdapter.parseSessionFile()` | `05-adapter-system.md` | 2 |
| `AgentAdapter.listSessionFiles()` | `05-adapter-system.md` | 2 |
| `AgentAdapter.sessionDir()` | `05-adapter-system.md` | 2 |
| `AgentCapabilities.sessionPersistence` | `06-capabilities-and-models.md` | 2 |
| `AgentCapabilities.canResume` | `06-capabilities-and-models.md` | 2 |
| `AgentCapabilities.canFork` | `06-capabilities-and-models.md` | 2 |
| `ErrorCode`, `AgentMuxError` | `01-core-types-and-client.md` | 3.1 |
| `ConfigManager` | `08-config-and-auth.md` | 2 |

### 1.3 Access Point

```typescript
const mux = createClient();

// All session operations via the sessions namespace:
const sessions = await mux.sessions.list('claude');
const session  = await mux.sessions.get('claude', 'abc123');
const results  = await mux.sessions.search({ text: 'refactor auth' });
const cost     = await mux.sessions.totalCost({ agent: 'claude' });
```

---

## 2. SessionManager Interface

```typescript
interface SessionManager {
  /**
   * List sessions for a specific agent, with optional filtering and sorting.
   *
   * Returns lightweight SessionSummary objects. Full session content is not
   * loaded -- use get() for that.
   *
   * @param agent - The agent whose sessions to list.
   * @param options - Filtering, sorting, and pagination options.
   * @returns Array of session summaries, sorted per options.sort (default: date descending).
   * @throws AgentMuxError with code 'AGENT_NOT_FOUND' if agent is unknown.
   */
  list(agent: AgentName, options?: SessionListOptions): Promise<SessionSummary[]>;

  /**
   * Retrieve the full content of a single session.
   *
   * Delegates to the agent adapter's parseSessionFile() to read and normalize
   * the native session format into the unified Session type.
   *
   * @param agent - The agent that owns the session.
   * @param sessionId - The native session ID (agent-specific format).
   * @returns The full session with all messages, tool calls, and cost data.
   * @throws AgentMuxError with code 'SESSION_NOT_FOUND' if no session with that ID exists.
   * @throws AgentMuxError with code 'PARSE_ERROR' if the session file is corrupt or unreadable.
   */
  get(agent: AgentName, sessionId: string): Promise<Session>;

  /**
   * Full-text search across sessions from one or more agents.
   *
   * When query.agent is specified, searches only that agent's sessions.
   * When omitted, searches all agents that have detectable session storage.
   *
   * For agents with native search capabilities (hermes with FTS5), the adapter
   * delegates to the native search engine. For file-based agents, agent-mux
   * performs in-process text matching over parsed session content.
   *
   * @param query - Search criteria including text, agent filter, date range, and limit.
   * @returns Array of matching session summaries, ranked by relevance.
   */
  search(query: SessionQuery): Promise<SessionSummary[]>;

  /**
   * Aggregate cost data across sessions.
   *
   * Reads cost records from session metadata and run-index entries.
   * Supports grouping by agent, model, day, or tag.
   *
   * @param options - Filtering and grouping criteria.
   * @returns Aggregated cost summary with breakdowns per the requested grouping.
   */
  totalCost(options?: CostAggregationOptions): Promise<CostSummary>;

  /**
   * Export a session in the specified format.
   *
   * - 'json': Full Session object serialized as a JSON string.
   * - 'jsonl': One JSON object per message/event, one per line.
   * - 'markdown': Human-readable Markdown with message attribution, tool call
   *   formatting, and cost summary.
   *
   * @param agent - The agent that owns the session.
   * @param sessionId - The native session ID.
   * @param format - Output format.
   * @returns The exported session as a string in the requested format.
   * @throws AgentMuxError with code 'SESSION_NOT_FOUND' if no session exists.
   */
  export(agent: AgentName, sessionId: string, format: 'json' | 'jsonl' | 'markdown'): Promise<string>;

  /**
   * Compute a structural diff between two sessions.
   *
   * Sessions may belong to the same agent or different agents. The diff
   * compares normalized message sequences and identifies additions, removals,
   * and modifications at the message level.
   *
   * Primary use case: comparing a forked session against its parent, or
   * comparing how two different agents handled the same prompt.
   *
   * @param a - First session reference (agent + sessionId).
   * @param b - Second session reference (agent + sessionId).
   * @returns A SessionDiff describing the structural differences.
   * @throws AgentMuxError with code 'SESSION_NOT_FOUND' if either session is missing.
   */
  diff(
    a: { agent: AgentName; sessionId: string },
    b: { agent: AgentName; sessionId: string }
  ): Promise<SessionDiff>;

  /**
   * Map a native agent session ID to a unified cross-agent ID.
   *
   * The unified ID format is deterministic: `<agent>:<nativeSessionId>`.
   * This is a pure function with no I/O -- it does not verify the session exists.
   *
   * @param agent - The agent name.
   * @param nativeSessionId - The agent's native session identifier.
   * @returns The unified session ID string.
   */
  resolveUnifiedId(agent: AgentName, nativeSessionId: string): string;

  /**
   * Parse a unified session ID back into its agent and native ID components.
   *
   * Returns null if the string does not match the unified ID format or
   * references an unknown agent.
   *
   * @param unifiedId - A unified ID of the form `<agent>:<nativeSessionId>`.
   * @returns The parsed components, or null if the ID is invalid.
   */
  resolveNativeId(unifiedId: string): { agent: AgentName; nativeSessionId: string } | null;
}
```

### 2.1 Method Summary

| Method | I/O | Returns | Throws |
|---|---|---|---|
| `list()` | Reads session directory metadata | `SessionSummary[]` | `AGENT_NOT_FOUND` |
| `get()` | Parses full session file | `Session` | `SESSION_NOT_FOUND`, `PARSE_ERROR` |
| `search()` | Scans session content (or native FTS) | `SessionSummary[]` | -- |
| `totalCost()` | Reads cost records from sessions + run index | `CostSummary` | -- |
| `export()` | Parses and serializes session | `string` | `SESSION_NOT_FOUND` |
| `diff()` | Parses both sessions and compares | `SessionDiff` | `SESSION_NOT_FOUND` |
| `resolveUnifiedId()` | Pure (no I/O) | `string` | -- |
| `resolveNativeId()` | Pure (no I/O) | `{ agent, nativeSessionId } \| null` | -- |

---

## 3. Supporting Types

### 3.1 SessionSummary

A lightweight representation of a session, returned by `list()` and `search()`. Does not include full message content.

```typescript
interface SessionSummary {
  /** The agent that owns this session. */
  agent: AgentName;

  /** The agent's native session identifier. */
  sessionId: string;

  /** The deterministic unified ID: `<agent>:<sessionId>`. */
  unifiedId: string;

  /** Human-readable session title (first user message truncated, or agent-provided title). */
  title: string;

  /** When the session was created. */
  createdAt: Date;

  /** When the session was last modified. */
  updatedAt: Date;

  /** Total number of conversational turns (user-assistant pairs). */
  turnCount: number;

  /** Total number of messages (all roles). */
  messageCount: number;

  /** Model ID used in the session (the primary or most-used model). */
  model?: string;

  /** Aggregated cost for the entire session, if available. */
  cost?: CostRecord;

  /** Consumer-provided tags from RunOptions.tags, if any. */
  tags: string[];

  /** The working directory the session was started in, if detectable. */
  cwd?: string;

  /** Whether this session was forked from another. */
  forkedFrom?: string;

  /** Relevance score (0.0 to 1.0), present only in search results. */
  relevanceScore?: number;
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `agent` | `AgentName` | Yes | -- | The owning agent. |
| `sessionId` | `string` | Yes | -- | Native session ID. |
| `unifiedId` | `string` | Yes | -- | Unified cross-agent ID (`<agent>:<sessionId>`). |
| `title` | `string` | Yes | `''` | Session title or truncated first prompt. |
| `createdAt` | `Date` | Yes | -- | Session creation timestamp. |
| `updatedAt` | `Date` | Yes | -- | Last modification timestamp. |
| `turnCount` | `number` | Yes | `0` | Number of user-assistant turn pairs. |
| `messageCount` | `number` | Yes | `0` | Total message count across all roles. |
| `model` | `string` | No | `undefined` | Primary model used. |
| `cost` | `CostRecord` | No | `undefined` | Aggregated session cost. |
| `tags` | `string[]` | Yes | `[]` | Tags from run metadata. |
| `cwd` | `string` | No | `undefined` | Working directory at session start. |
| `forkedFrom` | `string` | No | `undefined` | Parent session ID if forked. |
| `relevanceScore` | `number` | No | `undefined` | Search relevance (0.0--1.0). |

### 3.2 Session

The full session object including all messages and metadata. Returned by `get()`.

```typescript
interface Session {
  /** The agent that owns this session. */
  agent: AgentName;

  /** The agent's native session identifier. */
  sessionId: string;

  /** The deterministic unified ID: `<agent>:<sessionId>`. */
  unifiedId: string;

  /** Human-readable session title. */
  title: string;

  /** When the session was created. */
  createdAt: Date;

  /** When the session was last modified. */
  updatedAt: Date;

  /** Total number of conversational turns. */
  turnCount: number;

  /** Model ID used in the session. */
  model?: string;

  /** Aggregated cost for the entire session. */
  cost?: CostRecord;

  /** Consumer-provided tags. */
  tags: string[];

  /** Working directory at session start. */
  cwd?: string;

  /** Parent session ID if this session was forked. */
  forkedFrom?: string;

  /** The ordered list of messages in this session. */
  messages: SessionMessage[];

  /**
   * Raw session data in the agent's native format.
   * Preserved for consumers that need agent-specific fields not
   * captured in the normalized SessionMessage type.
   */
  raw?: unknown;
}

interface SessionMessage {
  /** Role of the message author. */
  role: 'user' | 'assistant' | 'system' | 'tool';

  /** Text content of the message. Empty string for tool-only messages. */
  content: string;

  /** Timestamp when this message was recorded. */
  timestamp?: Date;

  /** Tool calls initiated by this message (assistant role only). */
  toolCalls?: SessionToolCall[];

  /** Tool result (tool role only). */
  toolResult?: {
    toolCallId: string;
    toolName: string;
    output: unknown;
  };

  /** Token usage for this message, if available. */
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    thinkingTokens?: number;
    cachedTokens?: number;
  };

  /** Cost for this individual message, if available. */
  cost?: CostRecord;

  /** Thinking/reasoning content, if the agent exposed it. */
  thinking?: string;

  /** Model used for this specific message (may differ within a session). */
  model?: string;
}

interface SessionToolCall {
  /** Tool call ID (agent-assigned). */
  toolCallId: string;

  /** Name of the tool that was called. */
  toolName: string;

  /** Input arguments passed to the tool. */
  input: unknown;

  /** Tool output, if available. */
  output?: unknown;

  /** Duration of the tool call in milliseconds, if recorded. */
  durationMs?: number;
}
```

### 3.3 SessionQuery

Parameters for the `search()` method.

```typescript
interface SessionQuery {
  /** Free-text search string. Matched against message content and session titles. */
  text: string;

  /**
   * Restrict search to a single agent. When omitted, searches all agents
   * that have detectable session storage on the local machine.
   */
  agent?: AgentName;

  /** Only include sessions created on or after this date. */
  since?: Date;

  /** Only include sessions created on or before this date. */
  until?: Date;

  /** Filter to sessions that used a specific model. */
  model?: string;

  /** Filter to sessions with any of the specified tags. */
  tags?: string[];

  /** Maximum number of results to return. Default: 50. */
  limit?: number;

  /** Sort order for results. Default: 'relevance'. */
  sort?: 'relevance' | 'date' | 'cost';
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `text` | `string` | Yes | -- | Full-text search string. |
| `agent` | `AgentName` | No | all agents | Restrict to one agent. |
| `since` | `Date` | No | `undefined` | Lower bound on creation date. |
| `until` | `Date` | No | `undefined` | Upper bound on creation date. |
| `model` | `string` | No | `undefined` | Filter by model ID. |
| `tags` | `string[]` | No | `undefined` | Filter by tags (OR match). |
| `limit` | `number` | No | `50` | Max results. |
| `sort` | `string` | No | `'relevance'` | Result ordering. |

### 3.4 SessionListOptions

Parameters for the `list()` method.

```typescript
interface SessionListOptions {
  /** Only include sessions created on or after this date. */
  since?: Date;

  /** Only include sessions created on or before this date. */
  until?: Date;

  /** Filter to sessions that used a specific model. */
  model?: string;

  /** Filter to sessions with any of the specified tags. */
  tags?: string[];

  /** Maximum number of results to return. Default: 100. */
  limit?: number;

  /** Sort field and direction. Default: 'date'. */
  sort?: 'date' | 'cost' | 'turns';

  /** Sort direction. Default: 'desc'. */
  sortDirection?: 'asc' | 'desc';

  /** Filter to sessions started in a specific working directory. */
  cwd?: string;
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `since` | `Date` | No | `undefined` | Lower bound on creation date. |
| `until` | `Date` | No | `undefined` | Upper bound on creation date. |
| `model` | `string` | No | `undefined` | Filter by model ID. |
| `tags` | `string[]` | No | `undefined` | Filter by tags (OR match). |
| `limit` | `number` | No | `100` | Max results returned. |
| `sort` | `string` | No | `'date'` | Sort field. |
| `sortDirection` | `string` | No | `'desc'` | Sort direction. |
| `cwd` | `string` | No | `undefined` | Filter by working directory. |

### 3.5 CostAggregationOptions

Parameters for the `totalCost()` method.

```typescript
interface CostAggregationOptions {
  /** Restrict to a single agent. When omitted, aggregates across all agents. */
  agent?: AgentName;

  /** Only include sessions created on or after this date. */
  since?: Date;

  /** Only include sessions created on or before this date. */
  until?: Date;

  /** Filter to sessions that used a specific model. */
  model?: string;

  /** Filter to sessions with any of the specified tags. */
  tags?: string[];

  /**
   * Group results by the specified dimension.
   * When omitted, returns a single aggregate CostSummary.
   */
  groupBy?: 'agent' | 'model' | 'day' | 'tag';
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `agent` | `AgentName` | No | all agents | Restrict to one agent. |
| `since` | `Date` | No | `undefined` | Lower bound on session date. |
| `until` | `Date` | No | `undefined` | Upper bound on session date. |
| `model` | `string` | No | `undefined` | Filter by model ID. |
| `tags` | `string[]` | No | `undefined` | Filter by tags (OR match). |
| `groupBy` | `string` | No | `undefined` | Dimension for grouped breakdowns. |

### 3.6 CostSummary

The return type of `totalCost()`.

```typescript
interface CostSummary {
  /** Total aggregated cost in USD. */
  totalUsd: number;

  /** Total input tokens across all matching sessions. */
  inputTokens: number;

  /** Total output tokens across all matching sessions. */
  outputTokens: number;

  /** Total thinking/reasoning tokens, if applicable. */
  thinkingTokens: number;

  /** Total cached tokens, if applicable. */
  cachedTokens: number;

  /** Number of sessions included in this aggregation. */
  sessionCount: number;

  /** Number of runs included (a session may span multiple runs). */
  runCount: number;

  /**
   * Grouped breakdowns, present when CostAggregationOptions.groupBy is set.
   * Keys are the group values (agent names, model IDs, date strings, or tag strings).
   */
  breakdowns?: Record<string, CostBreakdown>;
}

interface CostBreakdown {
  /** The group key (agent name, model ID, ISO date string, or tag). */
  key: string;

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
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `totalUsd` | `number` | Yes | -- | Total cost in USD. |
| `inputTokens` | `number` | Yes | -- | Total input tokens. |
| `outputTokens` | `number` | Yes | -- | Total output tokens. |
| `thinkingTokens` | `number` | Yes | `0` | Total thinking tokens. |
| `cachedTokens` | `number` | Yes | `0` | Total cached tokens. |
| `sessionCount` | `number` | Yes | -- | Sessions in aggregation. |
| `runCount` | `number` | Yes | -- | Runs in aggregation. |
| `breakdowns` | `Record<string, CostBreakdown>` | No | `undefined` | Per-group breakdowns when `groupBy` is set. |

### 3.7 SessionDiff

The return type of `diff()`.

```typescript
interface SessionDiff {
  /** Reference to the first session (left side). */
  a: { agent: AgentName; sessionId: string; unifiedId: string };

  /** Reference to the second session (right side). */
  b: { agent: AgentName; sessionId: string; unifiedId: string };

  /** Ordered list of diff operations describing structural differences. */
  operations: DiffOperation[];

  /** Summary statistics. */
  stats: {
    /** Messages only in session A. */
    removals: number;
    /** Messages only in session B. */
    additions: number;
    /** Messages present in both but with different content. */
    modifications: number;
    /** Messages identical in both sessions. */
    unchanged: number;
  };
}

interface DiffOperation {
  /** The type of difference. */
  type: 'addition' | 'removal' | 'modification' | 'unchanged';

  /** Zero-based index in session A (undefined for additions). */
  indexA?: number;

  /** Zero-based index in session B (undefined for removals). */
  indexB?: number;

  /** The message from session A (undefined for additions). */
  messageA?: SessionMessage;

  /** The message from session B (undefined for removals). */
  messageB?: SessionMessage;
}
```

---

## 4. Native Session File Locations

agent-mux reads session data from each agent's native storage location. The `SessionManager` never writes to these locations. Each agent adapter implements `sessionDir()`, `listSessionFiles()`, and `parseSessionFile()` to handle its native format.

### 4.1 Session Storage by Agent

| Agent | Session Storage Path | Format | Persistence |
|---|---|---|---|
| Claude Code | `~/.claude/projects/<hash>/` | JSONL per session | file |
| Codex CLI | `~/.codex/sessions/` | JSONL | file |
| Gemini CLI | `~/.gemini/sessions/` | JSONL | file |
| Copilot CLI | `~/.config/github-copilot/sessions/` | JSON | file |
| Cursor | `~/.cursor/sessions/` | SQLite | sqlite |
| OpenCode | `~/.local/share/opencode/` | SQLite | sqlite |
| Pi | `~/.pi/agent/sessions/` | JSONL tree (id + parentId) | file |
| omp | `~/.omp/agent/sessions/` | JSONL tree (id + parentId) | file |
| OpenClaw | `~/.openclaw/sessions/` | JSON per channel/session | file |
| Hermes | `~/.hermes/` | SQLite with FTS5 | sqlite |

### 4.2 Per-Agent Session Parsing Notes

#### 4.2.1 Claude Code (`claude`)

- **Path pattern:** `~/.claude/projects/<project-hash>/<session-id>.jsonl`
- **Format:** Each line is a JSON object representing one event (message, tool call, cost record, etc.).
- **Project hash:** Derived from the absolute path of the working directory. The adapter computes this hash to locate sessions for a given project.
- **Session ID:** The filename stem (without `.jsonl` extension).
- **Cost data:** Embedded as `cost` events within the JSONL stream; aggregated by summing all `cost` entries.
- **Fork support:** Forked sessions reference a `forkedFrom` field in the first line's metadata object.
- **Title extraction:** First user message content, truncated to 100 characters.

#### 4.2.2 Codex CLI (`codex`)

- **Path pattern:** `~/.codex/sessions/<session-id>.jsonl`
- **Format:** JSONL with one event per line. Similar structure to Claude Code but with OpenAI-specific field names.
- **Session ID:** The filename stem.
- **Cost data:** Token counts are present per-message; cost in USD is computed using the model registry's `estimateCost()` when not natively provided.
- **Fork support:** Not supported (`canFork: false`).
- **Title extraction:** First user message content, truncated to 100 characters.

#### 4.2.3 Gemini CLI (`gemini`)

- **Path pattern:** `~/.gemini/sessions/<session-id>.jsonl`
- **Format:** JSONL with one event per line. Uses Google-specific message role names (`user`, `model` mapped to `assistant`).
- **Session ID:** The filename stem.
- **Cost data:** Token counts present; USD cost estimated via model registry.
- **Fork support:** Not supported.
- **Title extraction:** First user message content, truncated to 100 characters.
- **Special handling:** Gemini's `model` role is normalized to `assistant` during parsing. Safety-filter metadata is preserved in `raw`.

#### 4.2.4 Copilot CLI (`copilot`)

- **Path pattern:** `~/.config/github-copilot/sessions/<session-id>.json`
- **Format:** Single JSON file per session containing the full conversation as an array of messages.
- **Session ID:** The filename stem.
- **Cost data:** Not natively provided. Token counts may be absent; cost estimation is best-effort via model registry.
- **Fork support:** Not supported.
- **Title extraction:** First user message content, truncated to 100 characters.
- **Special handling:** The `gh copilot` CLI stores sessions as complete JSON documents rather than append-only streams. The adapter reads the entire file on each access.

#### 4.2.5 Cursor (`cursor`)

- **Path pattern:** `~/.cursor/sessions/sessions.db` (single SQLite database)
- **Format:** SQLite database with tables for sessions and messages.
- **Session ID:** Integer primary key or UUID from the sessions table, depending on Cursor version.
- **Cost data:** Token usage stored per-message in the messages table; cost estimated via model registry.
- **Fork support:** Not supported.
- **Title extraction:** From the `title` column in the sessions table, falling back to first user message.
- **Special handling:** The adapter opens the SQLite database in read-only mode (`SQLITE_OPEN_READONLY`). Concurrent access is safe because SQLite supports multiple readers. The `watch()` method uses polling (default interval: 2 seconds) since filesystem watch on a SQLite WAL file is unreliable.

#### 4.2.6 OpenCode (`opencode`)

- **Path pattern:** `~/.local/share/opencode/opencode.db` (single SQLite database)
- **Format:** SQLite database with sessions, messages, and tool_calls tables.
- **Session ID:** UUID from the sessions table.
- **Cost data:** Token usage and cost stored per-message.
- **Fork support:** Supported (`canFork: true`). Forked sessions reference parent via a `parent_id` column.
- **Title extraction:** From the `title` column in the sessions table.
- **Special handling:** Opened in read-only mode. OpenCode uses WAL mode; the adapter respects this by never acquiring write locks. The `watch()` method polls at 2-second intervals.

#### 4.2.7 Pi (`pi`)

- **Path pattern:** `~/.pi/agent/sessions/<session-id>/`
- **Format:** JSONL tree structure. Each session is a directory containing one or more `.jsonl` files. Messages have `id` and `parentId` fields forming a tree (branching conversations).
- **Session ID:** The directory name.
- **Cost data:** Token counts per-message; cost estimated via model registry.
- **Fork support:** Supported via the tree structure. Forked branches share a common ancestor identified by `parentId` chains.
- **Title extraction:** Content of the root message (the message with no `parentId`).
- **Special handling:** The adapter linearizes the message tree by following the most recent branch (highest timestamp at each fork point) when constructing `Session.messages`. The full tree structure is preserved in `Session.raw` for consumers that need branch-aware access.

#### 4.2.8 omp (`omp`)

- **Path pattern:** `~/.omp/agent/sessions/<session-id>/`
- **Format:** JSONL tree structure, identical format to Pi (shared codebase heritage). Messages have `id` and `parentId` fields.
- **Session ID:** The directory name.
- **Cost data:** Token counts per-message; cost estimated via model registry.
- **Fork support:** Supported via tree structure, same as Pi.
- **Title extraction:** Content of the root message.
- **Special handling:** Same tree linearization strategy as Pi. The adapter shares the tree-parsing implementation with the Pi adapter via a common `JsonlTreeParser` utility in `BaseAgentAdapter`.

#### 4.2.9 OpenClaw (`openclaw`)

- **Path pattern:** `~/.openclaw/sessions/<channel>/<session-id>.json`
- **Format:** Single JSON file per session, organized by channel (e.g., `cli`, `telegram`, `discord`, `slack`). Each file contains the complete conversation as a structured JSON document.
- **Session ID:** The filename stem. The channel is part of the path but not part of the session ID.
- **Cost data:** Token usage and cost stored per-message within the JSON structure.
- **Fork support:** Not supported.
- **Title extraction:** From the `title` field in the JSON root, falling back to first user message.
- **Special handling:** The channel subdirectory is detected and included in `SessionSummary` metadata (via `raw`). Multi-channel sessions (same conversation across channels) are treated as separate sessions. The `list()` method scans all channel subdirectories.

#### 4.2.10 Hermes (`hermes`)

- **Path pattern:** `~/.hermes/` (SQLite database with FTS5 extensions; exact filename derived from the project's default config)
- **Format:** SQLite database using FTS5 full-text search virtual tables for session and memory content. Session data includes conversation turns, tool calls, and agent-curated memory entries.
- **Session ID:** UUID from the sessions table.
- **Cost data:** Token usage stored per-turn; cost estimated via model registry when not natively provided.
- **Fork support:** Not supported.
- **Title extraction:** From the session metadata table or LLM-generated session summary stored by Hermes.
- **Special handling:** Hermes is the only agent that uses FTS5, which provides native full-text search with relevance ranking. The `search()` method delegates directly to Hermes' FTS5 `MATCH` queries when `query.agent === 'hermes'`, avoiding in-process text scanning. The adapter uses the `fts5` SQLite extension and issues `SELECT ... FROM sessions_fts WHERE sessions_fts MATCH ?` queries for search. The database is opened in read-only mode. Memory entries (agent-curated persistent notes stored in a separate FTS5 table) are excluded from session listing but included in search results when relevant. The Honcho dialectic user modeling data, if present, is not exposed through the session interface. The `watch()` method polls at 2-second intervals. Hermes requires Python >= 3.11 and is installed via pip/uv rather than npm; the adapter handles this difference in detection and version checking.

---

## 5. Unified Session ID Scheme

### 5.1 Format

Every session is addressable by a unified ID of the form:

```
<agent>:<nativeSessionId>
```

Examples:
- `claude:a1b2c3d4`
- `codex:session-2025-01-15-001`
- `cursor:42`
- `hermes:550e8400-e29b-41d4-a716-446655440000`
- `pi:proj-xyz/branch-main`

### 5.2 resolveUnifiedId()

```typescript
// Pure function, no I/O, no validation of session existence.
const unifiedId = mux.sessions.resolveUnifiedId('claude', 'a1b2c3d4');
// => 'claude:a1b2c3d4'
```

The unified ID is constructed by joining the agent name and native session ID with a single colon. The agent name portion always matches one of the `BuiltInAgentName` values or a registered plugin adapter name.

### 5.3 resolveNativeId()

```typescript
const result = mux.sessions.resolveNativeId('claude:a1b2c3d4');
// => { agent: 'claude', nativeSessionId: 'a1b2c3d4' }

const invalid = mux.sessions.resolveNativeId('not-a-valid-id');
// => null
```

Parsing rules:
1. Split on the first colon only (native IDs may contain colons).
2. Validate the agent portion against registered adapter names.
3. Return `null` if no colon is present or the agent is unknown.

---

## 6. Method Behaviors

### 6.1 list()

```typescript
const recent = await mux.sessions.list('claude', {
  since: new Date('2025-01-01'),
  sort: 'cost',
  sortDirection: 'desc',
  limit: 20,
});
```

**Behavior:**

1. Resolves the agent adapter via the `AdapterRegistry`.
2. Calls `adapter.listSessionFiles(options?.cwd)` to enumerate session file paths.
3. For each file, reads lightweight metadata (file timestamps, header lines for JSONL, or summary queries for SQLite) without parsing full content.
4. Applies filters (`since`, `until`, `model`, `tags`, `cwd`) in-memory after metadata extraction.
5. Sorts results per `options.sort` and `options.sortDirection`.
6. Truncates to `options.limit`.
7. Returns `SessionSummary[]`.

**Performance considerations:**
- For file-based agents (claude, codex, gemini, copilot, openclaw), metadata extraction reads only the first and last few lines of each file (or file stat for timestamps).
- For SQLite agents (cursor, opencode, hermes), a single SQL query retrieves all summaries with filtering and sorting pushed down to the database.
- For tree-based agents (pi, omp), the adapter reads directory entries and the root message of each session.

### 6.2 get()

```typescript
const session = await mux.sessions.get('opencode', 'abc-def-123');
console.log(session.messages.length); // Full message history
console.log(session.cost?.totalUsd);  // Aggregated cost
```

**Behavior:**

1. Resolves the adapter.
2. Calls `adapter.parseSessionFile(filePath)` where `filePath` is resolved from `adapter.sessionDir()` and the session ID.
3. The adapter returns a fully parsed `Session` object with all messages, tool calls, and cost records.
4. The `SessionManager` sets `unifiedId` on the returned object.
5. Returns the `Session`.

**Error handling:**
- Throws `SESSION_NOT_FOUND` if the session file/record does not exist.
- Throws `PARSE_ERROR` if the file exists but cannot be parsed (corrupt JSONL, invalid JSON, SQLite read error).

### 6.3 search()

```typescript
const results = await mux.sessions.search({
  text: 'refactor authentication middleware',
  since: new Date('2025-01-01'),
  limit: 10,
  sort: 'relevance',
});
```

**Behavior:**

1. If `query.agent` is specified, searches only that agent. Otherwise, iterates all agents with detected session storage.
2. **For hermes:** Delegates to FTS5 via `SELECT ... FROM sessions_fts WHERE sessions_fts MATCH ?`. Relevance scores are BM25-based, provided natively by FTS5.
3. **For SQLite agents (cursor, opencode):** Uses `LIKE` queries or application-level matching against message content columns.
4. **For file-based agents (claude, codex, gemini, copilot, openclaw, pi, omp):** Performs in-process text matching. Loads session content lazily, scanning files line-by-line and checking for substring or regex matches. Stops early when `limit` is reached.
5. Results from multiple agents are merged and re-ranked. When `sort` is `'relevance'`, scores are normalized to [0.0, 1.0] across agents.
6. Applies `since`, `until`, `model`, and `tags` filters.
7. Returns `SessionSummary[]` with `relevanceScore` populated.

### 6.4 totalCost()

```typescript
const cost = await mux.sessions.totalCost({
  since: new Date('2025-03-01'),
  groupBy: 'agent',
});
console.log(cost.totalUsd);                    // Total across all agents
console.log(cost.breakdowns?.['claude'].totalUsd); // Claude-only cost
```

**Behavior:**

1. Enumerates sessions matching the filter criteria (delegates to `list()` internally for each agent, or a single agent if `options.agent` is set).
2. Reads cost records from session metadata. Also reads the agent-mux run index (`~/.agent-mux/run-index.jsonl`) for runs that have cost data not captured in session files.
3. Aggregates `totalUsd`, `inputTokens`, `outputTokens`, `thinkingTokens`, and `cachedTokens`.
4. When `groupBy` is set, produces per-group `CostBreakdown` entries in `breakdowns`.
5. Returns a single `CostSummary`.

**Cost data sources (in priority order):**
1. Native session cost records (most accurate -- reported by the agent itself).
2. Agent-mux run index entries (captures cost events emitted during runs).
3. Model registry estimation (fallback: `estimateCost(agent, model, inputTokens, outputTokens)` from the `ModelRegistry`).

### 6.5 export()

```typescript
const markdown = await mux.sessions.export('claude', 'abc123', 'markdown');
// Write to file, pipe to stdout, etc.
```

**Behavior:**

1. Calls `get()` to retrieve the full session.
2. Serializes to the requested format:
   - **`json`:** `JSON.stringify(session, null, 2)` with `Date` objects serialized as ISO 8601 strings.
   - **`jsonl`:** One JSON object per `SessionMessage`, one line per message. The first line is a metadata header containing session-level fields.
   - **`markdown`:** Structured Markdown document with:
     - Session metadata header (agent, model, dates, cost).
     - Messages formatted with role headers (`### User`, `### Assistant`, `### System`, `### Tool`).
     - Tool calls in fenced code blocks.
     - Thinking content in collapsible `<details>` blocks.
     - Cost summary at the end.
3. Returns the serialized string.

### 6.6 diff()

```typescript
const d = await mux.sessions.diff(
  { agent: 'claude', sessionId: 'original' },
  { agent: 'claude', sessionId: 'forked' },
);
console.log(d.stats); // { removals: 0, additions: 3, modifications: 1, unchanged: 10 }
```

**Behavior:**

1. Calls `get()` for both sessions.
2. Aligns messages using a longest-common-subsequence (LCS) algorithm on `(role, content)` pairs.
3. Classifies each position as `addition`, `removal`, `modification`, or `unchanged`.
4. A `modification` is detected when messages at aligned positions share the same role but differ in content (using string equality on `content`).
5. Produces the `operations` array and `stats` summary.
6. Works across agents: comparing a Claude session against a Codex session is valid and produces meaningful diffs on the normalized message structure.

### 6.7 Live Watching

Live session watching is **not** part of the public `SessionManager` API.

Earlier drafts and placeholder code attempted to expose `watch(agent, sessionId)` as an
`AsyncIterable<AgentEvent>`, but the implementation could not provide truthful cross-adapter
semantics. In particular, persisted session files do not expose a generic mapping from file
growth to:

1. a real `runId`
2. adapter-accurate `AgentEvent` types
3. meaningful `text_delta.delta` / `text_delta.accumulated` payloads

`SessionManager` therefore remains a read-only inspection surface: `list()`, `get()`,
`search()`, `totalCost()`, `export()`, `diff()`, `resolveUnifiedId()`, and `resolveNativeId()`.
Any future live-watch feature must be specified as a separate adapter capability with explicit
event semantics instead of reusing `AgentEvent` opportunistically.

### 6.8 resolveUnifiedId()

```typescript
const id = mux.sessions.resolveUnifiedId('hermes', '550e8400-e29b-41d4-a716-446655440000');
// => 'hermes:550e8400-e29b-41d4-a716-446655440000'
```

Pure synchronous function. Concatenates `agent + ':' + nativeSessionId`. No I/O, no existence check.

### 6.9 resolveNativeId()

```typescript
const parsed = mux.sessions.resolveNativeId('hermes:550e8400-e29b-41d4-a716-446655440000');
// => { agent: 'hermes', nativeSessionId: '550e8400-e29b-41d4-a716-446655440000' }

const bad = mux.sessions.resolveNativeId('unknown-agent:123');
// => null (agent not registered)
```

Pure synchronous function. Splits on the first colon, validates the agent portion against registered adapters. Returns `null` for malformed or unknown-agent IDs.

---

## 7. CLI Commands

The `SessionManager` is surfaced through the `amux sessions` and `amux cost` CLI commands.

### 7.1 amux sessions

```
amux sessions list <agent> [options]
  --since, --until       Date range filters (ISO 8601)
  --model                Filter by model ID
  --tag                  Filter by tag (repeatable)
  --limit                Max results (default: 100)
  --sort                 date | cost | turns (default: date)
  --json                 Output as JSON array

amux sessions show <agent> <session-id>
  --format               json | jsonl | markdown (default: markdown)

amux sessions search <query> [--agent <a>] [--since] [--until]
  --limit                Max results (default: 50)
  --json                 Output as JSON array

amux sessions export <agent> <session-id> [--format]
  # Exports session to stdout in the specified format.

amux sessions diff <agent>:<id> <agent>:<id>
  # Displays structural diff between two sessions.

amux sessions resume <agent> <session-id>
  # Starts a new run resuming the given session (delegates to amux run --session).

amux sessions fork <agent> <session-id>
  # Starts a new run forking the given session (delegates to amux run --fork).
```

### 7.2 amux cost

```
amux cost report
  --agent                Filter by agent
  --since, --until       Date range
  --model                Filter by model
  --tag                  Filter by tag (repeatable)
  --group-by             agent | model | day | tag
  --json                 Output as JSON
```

---

## 8. Error Handling

### 8.1 Error Codes

| Error Code | Thrown By | Description |
|---|---|---|
| `AGENT_NOT_FOUND` | `list()`, `get()`, `export()`, `diff()` | The specified agent name does not match any registered adapter. (`search()` does not throw this -- when `query.agent` is omitted, all agents are searched; when `query.agent` is set to an unknown agent, `search()` returns an empty array rather than throwing.) |
| `SESSION_NOT_FOUND` | `get()`, `export()`, `diff()` | No session with the given ID exists in the agent's session storage. |
| `PARSE_ERROR` | `get()`, `export()`, `diff()` | The session file exists but cannot be parsed (corrupt data, schema mismatch, incompatible format version). |

### 8.2 Graceful Degradation

- `list()` returns an empty array (not an error) when the agent's session directory does not exist (agent installed but never used).
- `search()` silently skips agents whose session storage is not detectable when searching across all agents.
- `totalCost()` returns zero-valued aggregates when no matching sessions are found.

---

## 9. Platform Considerations

### 9.1 Path Resolution

Session paths use `~` (home directory) notation in this specification. At runtime, `~` is resolved to:
- **macOS / Linux:** `$HOME`
- **Windows:** `%USERPROFILE%` (typically `C:\Users\<username>`)

For XDG-aware agents (OpenCode at `~/.local/share/opencode/`), the adapter respects `$XDG_DATA_HOME` when set, falling back to `~/.local/share/` on Linux and the platform default on other operating systems.

### 9.2 SQLite Access

Agents using SQLite storage (cursor, opencode, hermes) are accessed via a lightweight SQLite binding (`better-sqlite3`). All connections are opened in read-only mode to prevent interference with the agent's own database operations.

For hermes, the FTS5 extension must be available in the SQLite build. `better-sqlite3` ships with FTS5 enabled by default.

### 9.3 Concurrency

- Multiple `SessionManager` operations can run concurrently. File reads use non-exclusive handles; SQLite connections use `SQLITE_OPEN_READONLY`.
- The `watch()` method creates one file watcher or poll timer per active watch. Consumers should break from the iterator when no longer interested to free resources.
- The run index file (`~/.agent-mux/run-index.jsonl`) is read with shared access; writes are managed exclusively by the `RunHandle` with file locking.

---

## 10. Integration with Adapter System

The `SessionManager` delegates all format-specific work to the agent adapter. The relevant adapter methods are:

```typescript
// From AgentAdapter (see 05-adapter-system.md, Section 2):

/** Returns the root directory where this agent stores session files. */
sessionDir(cwd?: string): string;

/** Parses a single session file into the unified Session type. */
parseSessionFile(filePath: string): Promise<Session>;

/** Lists all session file paths for this agent. */
listSessionFiles(cwd?: string): Promise<string[]>;
```

The `SessionManager` is the public API; adapters are the parsing engine. Consumers interact exclusively with `SessionManager` via `mux.sessions`. The adapter methods are not exposed on the public API surface.

### 10.1 Adapter Session Persistence Mapping

The `AgentCapabilities.sessionPersistence` field (see `06-capabilities-and-models.md`, Section 2) determines how the `SessionManager` accesses session data:

| `sessionPersistence` | Agents | Access Strategy |
|---|---|---|
| `'file'` | claude, codex, gemini, copilot, openclaw | File system reads (JSONL line-by-line or JSON parse) |
| `'sqlite'` | cursor, opencode, hermes | Read-only SQLite queries |
| `'file'` (tree) | pi, omp | Directory enumeration + JSONL tree parsing |
| `'none'` | (future agents) | `list()` returns `[]`; `get()` throws `SESSION_NOT_FOUND` |
| `'in-memory'` | (future agents) | Same as `'none'` after process exit |

---

## 11. Complete Type Index

All types defined or referenced in this specification:

| Type | Defined In | Section |
|---|---|---|
| `SessionManager` | This spec | 2 |
| `SessionSummary` | This spec | 3.1 |
| `Session` | This spec | 3.2 |
| `SessionMessage` | This spec | 3.2 |
| `SessionToolCall` | This spec | 3.2 |
| `SessionQuery` | This spec | 3.3 |
| `SessionListOptions` | This spec | 3.4 |
| `CostAggregationOptions` | This spec | 3.5 |
| `CostSummary` | This spec | 3.6 |
| `CostBreakdown` | This spec | 3.6 |
| `SessionDiff` | This spec | 3.7 |
| `DiffOperation` | This spec | 3.7 |
| `AgentName` | `01-core-types-and-client.md` | 1.4 |
| `CostRecord` | `01-core-types-and-client.md` | 4.2.3 |
| `AgentEvent` | `04-agent-events.md` | 2 |
| `AgentAdapter` | `05-adapter-system.md` | 2 |
| `AgentCapabilities` | `06-capabilities-and-models.md` | 2 |

---

## Implementation Status (2026-04-12)

`SessionManagerImpl` in `packages/core/src/session-manager.ts` is now a real filesystem implementation:

- **`list(agent, opts?)`** and **`get(agent, sessionId)`** read through each adapter's `listSessionFiles()` + `parseSessionFile()`. Each adapter rooted at its own on-disk directory — see `docs/12-built-in-adapters.md` for the per-adapter paths.
- **`search(query)`** performs a full-text scan across sessions with structured filters.
- **`export(agent, sessionId, format)`** accepts `'json' | 'jsonl' | 'markdown'`. JSONL emits one `SessionMessage` per line; markdown renders a human-readable transcript.
- **`diff(agentA, idA, agentB, idB)`** returns a `SessionDiff` of message-level insertions, deletions, and updates.
- **Live watching is intentionally not public.** The earlier placeholder `watch()` API was removed because it could not provide truthful cross-adapter `AgentEvent` semantics.

Session files are written atomically by adapters via the tmp-then-rename helper in `packages/adapters/src/session-fs.ts`.
