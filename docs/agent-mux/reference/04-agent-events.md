# AgentEvent Union Type and Event Streaming

**Specification v1.0** | `@a5c-ai/agent-mux`

> **Note:** hermes-agent is included as a 10th supported agent per project requirements, extending the original scope's 9 agents. All ten built-in agents (claude, codex, gemini, copilot, cursor, opencode, pi, omp, openclaw, hermes) share the same event contract.

Last refreshed: 2026-04-25

---

## 1. Overview

This specification defines the complete `AgentEvent` union type -- 67 event types across 18 categories -- the streaming model that controls how events are emitted, event ordering guarantees, correlation keys for grouping related events, and the per-agent event support matrix.

Every agent run produces a stream of `AgentEvent` values. Regardless of the underlying agent's output format (JSON streaming, line-buffered text, PTY raw output, structured API responses), each adapter parses native output into the normalized event types defined here. Consumers never see agent-specific output formats.

### 1.1 Cross-References

| Type / Concept | Spec | Section |
|---|---|---|
| `AgentName`, `BuiltInAgentName` | `01-core-types-and-client.md` | 1.4 |
| `AgentMuxClient`, `createClient()` | `01-core-types-and-client.md` | 5 |
| `RunOptions`, `stream` option | `02-run-options-and-profiles.md` | 2, 5 |
| `RunHandle`, `AsyncIterable<AgentEvent>` | `03-run-handle-and-interaction.md` | 2 |
| `RunResult` | `03-run-handle-and-interaction.md` | 3 |
| `CostRecord` | `01-core-types-and-client.md` | 4.2.3 |
| `AgentCapabilities` | `06-capabilities-and-models.md` | 2 |
| `ErrorCode`, `AgentMuxError` | `01-core-types-and-client.md` | 3.1 |
| `InteractionChannel` | `03-run-handle-and-interaction.md` | 5 |

### 1.2 Design Principles

1. **Uniform shape.** Every event extends `BaseEvent`. Consumers can always access `type`, `runId`, `agent`, and `timestamp` without type narrowing.
2. **Additive-only.** New event types may be added in minor versions; existing types are never removed or changed in breaking ways.
3. **Same types in all modes.** Whether `stream` is `'auto'`, `true`, or `false`, the consumer always receives the same set of event types. The mode only controls granularity and timing.
4. **Correlation by key.** Related events share a correlation key (`toolCallId`, `subagentId`, `interactionId`, `pluginId`) so consumers can group them without position-based logic.
5. **No agent-specific events.** The union is closed for agent-specific data. The `raw` field on `BaseEvent` and the `debug` event provide escape hatches for agent-specific diagnostics.

---

## 2. BaseEvent Interface

```typescript
/**
 * Shared fields present on every AgentEvent.
 *
 * All 67 event types extend this interface. Consumers can read these
 * fields without narrowing to a specific event type.
 */
interface BaseEvent {
  /**
   * Discriminant field. Uniquely identifies the event type within the
   * AgentEvent union. Always a lowercase, underscore-separated string
   * literal (e.g., 'text_delta', 'tool_call_start').
   */
  type: string;

  /**
   * The ULID of the run that produced this event. Matches
   * `RunHandle.runId`. Format: 26-character Crockford Base32 string.
   *
   * @see RunHandle.runId in 03-run-handle-and-interaction.md, Section 2.
   */
  runId: string;

  /**
   * The agent that produced this event.
   *
   * @see AgentName in 01-core-types-and-client.md, Section 1.4.
   */
  agent: AgentName;

  /**
   * Unix epoch timestamp in milliseconds when this event was created
   * by the adapter. Uses `Date.now()` at event construction time.
   *
   * Events are emitted in causal order; timestamps are monotonically
   * non-decreasing within a single run.
   */
  timestamp: number;

  /**
   * The raw, unparsed output from the agent subprocess that produced
   * this event. Present only when the client was created with
   * `ClientOptions.debug: true` (see `01-core-types-and-client.md` §5.1.1).
   *
   * Format is agent-specific (JSON line, PTY escape sequence, etc.).
   * Intended for debugging adapter implementations, not for
   * production consumption.
   */
  raw?: string;
}
```

### 2.1 BaseEvent Field Constraints

| Field | Type | Required | Constraints |
|---|---|---|---|
| `type` | `string` (literal) | Yes | One of the 67 defined event type literals. |
| `runId` | `string` | Yes | ULID format, 26 characters, Crockford Base32. |
| `agent` | `AgentName` | Yes | One of the 10 built-in agents or a registered plugin adapter name. |
| `timestamp` | `number` | Yes | Positive integer, Unix epoch milliseconds, monotonically non-decreasing within a run. |
| `raw` | `string` | No | Present only in debug mode. Arbitrary string from the agent subprocess. |

---

## 3. CostRecord Type

Used by `session_end`, `turn_end`, `subagent_result`, `cost`, and `RunResult`. Defined canonically in `01-core-types-and-client.md` Section 4.2.3; reproduced here for reference.

```typescript
/**
 * Aggregated cost and token usage for a run, turn, or subagent invocation.
 *
 * All token counts are integers. Cost is a floating-point estimate in USD.
 * Fields are optional when the agent does not report the corresponding data.
 *
 * @see 01-core-types-and-client.md, Section 4.2.3.
 */
interface CostRecord {
  /** Total estimated cost in US dollars. */
  totalUsd: number;

  /** Input tokens consumed. */
  inputTokens: number;

  /** Output tokens generated. */
  outputTokens: number;

  /** Thinking/reasoning tokens consumed (if the model supports thinking). */
  thinkingTokens?: number;

  /** Cached input tokens reused from a previous turn or session (if applicable). */
  cachedTokens?: number;
}
```

### 3.1 CostRecord Field Constraints

| Field | Type | Required | Constraints |
|---|---|---|---|
| `totalUsd` | `number` | Yes | Non-negative. `0` when cost data is unavailable. |
| `inputTokens` | `number` | Yes | Non-negative integer. |
| `outputTokens` | `number` | Yes | Non-negative integer. |
| `thinkingTokens` | `number` | No | Non-negative integer. Omitted when thinking was not used. |
| `cachedTokens` | `number` | No | Non-negative integer. Omitted when caching is unsupported. |

---

## 4. AgentEvent Union Type

The `AgentEvent` type is a discriminated union of 67 event interfaces grouped into 18 categories. The `type` field is the discriminant.

```typescript
type AgentEvent =
  // Session lifecycle (5)
  | SessionStartEvent
  | SessionResumeEvent
  | SessionForkEvent
  | SessionCheckpointEvent
  | SessionEndEvent
  // Turn / step lifecycle (4)
  | TurnStartEvent
  | TurnEndEvent
  | StepStartEvent
  | StepEndEvent
  // Text / message streaming (3)
  | MessageStartEvent
  | TextDeltaEvent
  | MessageStopEvent
  // Thinking / reasoning (3)
  | ThinkingStartEvent
  | ThinkingDeltaEvent
  | ThinkingStopEvent
  // Tool calling (5)
  | ToolCallStartEvent
  | ToolInputDeltaEvent
  | ToolCallReadyEvent
  | ToolResultEvent
  | ToolErrorEvent
  // File operations (5)
  | FileReadEvent
  | FileWriteEvent
  | FileCreateEvent
  | FileDeleteEvent
  | FilePatchEvent
  // Shell operations (4)
  | ShellStartEvent
  | ShellStdoutDeltaEvent
  | ShellStderrDeltaEvent
  | ShellExitEvent
  // MCP tool calling (3)
  | McpToolCallStartEvent
  | McpToolResultEvent
  | McpToolErrorEvent
  // Subagent dispatch (3)
  | SubagentSpawnEvent
  | SubagentResultEvent
  | SubagentErrorEvent
  // Plugin events (3)
  | PluginLoadedEvent
  | PluginInvokedEvent
  | PluginErrorEvent
  // Skill / agent doc loading (3)
  | SkillLoadedEvent
  | SkillInvokedEvent
  | AgentdocReadEvent
  // Multimodal (2)
  | ImageOutputEvent
  | ImageInputAckEvent
  // Cost and tokens (2)
  | CostEvent
  | TokenUsageEvent
  // Interaction / waiting (4)
  | InputRequiredEvent
  | ApprovalRequestEvent
  | ApprovalGrantedEvent
  | ApprovalDeniedEvent
  // Rate / context limits (4)
  | RateLimitedEvent
  | ContextLimitWarningEvent
  | ContextCompactedEvent
  | RetryEvent
  // Run lifecycle / control (7)
  | InterruptedEvent
  | AbortedEvent
  | PausedEvent
  | ResumedEvent
  | TimeoutEvent
  | TurnLimitEvent
  | StreamFallbackEvent
  // Errors (5)
  | AuthErrorEvent
  | RateLimitErrorEvent
  | ContextExceededEvent
  | CrashEvent
  | ErrorEvent
  // Debug (2)
  | DebugEvent
  | LogEvent;
```

---

## 5. Session Lifecycle Events (5 events)

Session lifecycle events mark the creation, resumption, forking, checkpointing, and completion of an agent session. A session maps to the agent's native persistent conversation record.

### 5.1 SessionStartEvent

Emitted once at the beginning of every run. Always the first domain event (after any `debug` or `log` events from subprocess startup).

```typescript
interface SessionStartEvent extends BaseEvent {
  type: 'session_start';

  /**
   * The agent's native session identifier. Format is agent-dependent:
   * - Claude Code: UUID v4
   * - Codex CLI: session directory name
   * - Gemini CLI: conversation ID
   * - OpenCode: session file stem
   * - hermes: session UUID
   *
   * When `RunOptions.noSession` is true, this is a synthetic transient
   * ID generated by the adapter, prefixed with 'transient-'.
   */
  sessionId: string;

  /**
   * Whether this session is a continuation of a prior conversation.
   * True when `RunOptions.sessionId` was provided and the session
   * already existed. False for new sessions.
   */
  resumed: boolean;

  /**
   * When this session was created by forking another, the source
   * session's ID. Only present when `RunOptions.forkSessionId` was
   * set and the agent supports forking.
   *
   * @capability Requires `AgentCapabilities.canFork: true`.
   */
  forkedFrom?: string;
}
```

### 5.2 SessionResumeEvent

Emitted when an existing session is resumed. Provides context about the prior conversation state. Only emitted when `resumed` on `SessionStartEvent` is `true`.

```typescript
interface SessionResumeEvent extends BaseEvent {
  type: 'session_resume';

  /** The session being resumed. Matches `SessionStartEvent.sessionId`. */
  sessionId: string;

  /**
   * Number of turns in the session before this run's first turn.
   * Useful for UIs that display turn numbering.
   */
  priorTurnCount: number;
}
```

### 5.3 SessionForkEvent

Emitted when a session is created by forking an existing one. The new session inherits the conversation history of the source up to the fork point.

```typescript
interface SessionForkEvent extends BaseEvent {
  type: 'session_fork';

  /** The newly created session ID. */
  sessionId: string;

  /** The source session that was forked. */
  forkedFrom: string;
}
```

### 5.4 SessionCheckpointEvent

Emitted when the agent creates a checkpoint within a session. Checkpoints are agent-specific save points that can be restored later.

```typescript
interface SessionCheckpointEvent extends BaseEvent {
  type: 'session_checkpoint';

  /** The session that was checkpointed. */
  sessionId: string;

  /**
   * Agent-specific checkpoint identifier. Can be passed to future
   * runs to restore state to this point.
   */
  checkpointId: string;
}
```

### 5.5 SessionEndEvent

Emitted when the session completes. Always the last session lifecycle event. Contains optional aggregated cost data for the entire session.

```typescript
interface SessionEndEvent extends BaseEvent {
  type: 'session_end';

  /** The session that ended. */
  sessionId: string;

  /** Total number of turns completed in this session (including prior turns if resumed). */
  turnCount: number;

  /**
   * Aggregated cost for all turns in this run (not including prior
   * sessions if resumed). May be absent if the agent does not
   * report cost data.
   *
   * @see CostRecord in Section 3.
   */
  cost?: CostRecord;
}
```

### 5.6 Session Event Ordering

```
session_start
  -> session_resume?        (only if resumed)
  -> session_fork?          (only if forked)
  -> [turn events...]
  -> session_checkpoint*    (zero or more, at any point during turns)
  -> session_end
```

`session_start` is guaranteed before any turn, tool, text, or thinking events. `session_end` is guaranteed after all turn events have completed.

---

## 6. Turn / Step Lifecycle Events (4 events)

Turns represent complete request-response cycles with the agent. Steps are sub-units within a turn (e.g., thinking, generating text, calling a tool). Not all agents expose step-level granularity; adapters that lack step data emit turns without steps.

### 6.1 TurnStartEvent

Emitted at the beginning of each turn. Turn indices are zero-based within the current run.

```typescript
interface TurnStartEvent extends BaseEvent {
  type: 'turn_start';

  /**
   * Zero-based turn index within this run. The first turn is 0,
   * the second is 1, etc. Does not account for prior turns in
   * a resumed session.
   */
  turnIndex: number;
}
```

### 6.2 TurnEndEvent

Emitted when a turn completes. Contains optional per-turn cost data.

```typescript
interface TurnEndEvent extends BaseEvent {
  type: 'turn_end';

  /** Zero-based turn index. Matches the corresponding `TurnStartEvent.turnIndex`. */
  turnIndex: number;

  /**
   * Cost for this specific turn. Absent if the agent does not
   * provide per-turn cost breakdown.
   *
   * @see CostRecord in Section 3.
   */
  cost?: CostRecord;
}
```

### 6.3 StepStartEvent

Emitted at the beginning of a step within a turn. Steps represent distinct phases of agent processing.

```typescript
interface StepStartEvent extends BaseEvent {
  type: 'step_start';

  /** The turn this step belongs to. */
  turnIndex: number;

  /** Zero-based step index within the turn. */
  stepIndex: number;

  /**
   * The kind of step. Common values:
   * - 'thinking' -- reasoning/planning phase
   * - 'generation' -- text generation phase
   * - 'tool_use' -- tool execution phase
   * - 'review' -- agent reviewing its own output
   *
   * Agent-specific step types may appear; consumers should handle
   * unknown values gracefully.
   */
  stepType: string;
}
```

### 6.4 StepEndEvent

Emitted when a step within a turn completes.

```typescript
interface StepEndEvent extends BaseEvent {
  type: 'step_end';

  /** The turn this step belongs to. */
  turnIndex: number;

  /** Zero-based step index. Matches the corresponding `StepStartEvent.stepIndex`. */
  stepIndex: number;
}
```

### 6.5 Turn/Step Event Ordering

```
turn_start(turnIndex=0)
  -> step_start(turnIndex=0, stepIndex=0)?
  -> [thinking/text/tool events...]
  -> step_end(turnIndex=0, stepIndex=0)?
  -> step_start(turnIndex=0, stepIndex=1)?
  -> [more events...]
  -> step_end(turnIndex=0, stepIndex=1)?
  -> turn_end(turnIndex=0)
turn_start(turnIndex=1)
  -> ...
  -> turn_end(turnIndex=1)
```

Steps are optional. A turn always has exactly one `turn_start` followed by exactly one `turn_end`. Step events, when present, are always properly nested within their enclosing turn and never overlap.

---

## 7. Text / Message Streaming Events (3 events)

Text streaming events deliver the agent's textual response. In streaming mode, `text_delta` events arrive incrementally. In buffered mode, a single `text_delta` with the full text arrives before `message_stop`.

### 7.1 MessageStartEvent

Emitted when the agent begins generating a textual response. Precedes the first `text_delta` in the current generation.

```typescript
interface MessageStartEvent extends BaseEvent {
  type: 'message_start';
}
```

### 7.2 TextDeltaEvent

Emitted for each chunk of generated text. In streaming mode, `delta` contains a small fragment. In buffered mode (`stream: false`), a single `text_delta` is emitted with `delta` equal to the complete text.

```typescript
interface TextDeltaEvent extends BaseEvent {
  type: 'text_delta';

  /**
   * The new text fragment. In streaming mode, typically 1-50 characters.
   * In buffered mode, the complete response text.
   */
  delta: string;

  /**
   * All text generated so far in this message, including this delta.
   * Consumers can use this instead of manually concatenating deltas.
   */
  accumulated: string;
}
```

### 7.3 MessageStopEvent

Emitted when the agent finishes generating a textual response. The `text` field contains the complete generated text.

```typescript
interface MessageStopEvent extends BaseEvent {
  type: 'message_stop';

  /** The complete generated text for this message. */
  text: string;
}
```

### 7.4 Text Streaming Event Ordering

```
message_start
  -> text_delta+      (one or more)
  -> message_stop
```

`message_start` always precedes any `text_delta` events. `message_stop` always follows the last `text_delta` and contains the same text as the final `text_delta.accumulated`. Multiple message sequences can occur within a single turn (e.g., when the agent generates text, calls a tool, then generates more text).

---

## 8. Thinking / Reasoning Events (3 events)

Thinking events expose the agent's internal reasoning process. Only emitted when the agent and model support thinking and the user has enabled it via `RunOptions.thinkingEffort` or the model defaults to thinking.

### 8.1 ThinkingStartEvent

Emitted when the agent begins a thinking/reasoning phase.

```typescript
interface ThinkingStartEvent extends BaseEvent {
  type: 'thinking_start';

  /**
   * The effective thinking effort level for this invocation.
   * Absent if the agent does not report effort level.
   */
  effort?: string;
}
```

### 8.2 ThinkingDeltaEvent

Emitted for each chunk of thinking content. Follows the same streaming/buffered pattern as `text_delta`.

```typescript
interface ThinkingDeltaEvent extends BaseEvent {
  type: 'thinking_delta';

  /** The new thinking text fragment. */
  delta: string;

  /** All thinking text generated so far, including this delta. */
  accumulated: string;
}
```

### 8.3 ThinkingStopEvent

Emitted when the thinking phase completes.

```typescript
interface ThinkingStopEvent extends BaseEvent {
  type: 'thinking_stop';

  /** The complete thinking/reasoning text. */
  thinking: string;
}
```

### 8.4 Thinking Event Ordering

```
thinking_start
  -> thinking_delta+    (one or more)
  -> thinking_stop
```

Thinking events always precede the corresponding text generation events within the same step. When thinking is used, the sequence within a turn is:

```
thinking_start -> thinking_delta+ -> thinking_stop -> message_start -> text_delta+ -> message_stop
```

---

## 9. Tool Calling Events (5 events)

Tool calling events track the lifecycle of native tool invocations (as opposed to MCP tools, which have their own event group). Events are correlated by `toolCallId`.

### 9.1 Correlation Key: `toolCallId`

All tool calling events for a single invocation share the same `toolCallId`. This is a unique identifier generated by the adapter, typically derived from the agent's native tool call ID. Format is adapter-dependent but guaranteed unique within a run.

### 9.2 ToolCallStartEvent

Emitted when the agent begins constructing a tool call. In streaming mode, the input may still be accumulating.

```typescript
interface ToolCallStartEvent extends BaseEvent {
  type: 'tool_call_start';

  /** Unique identifier for this tool call. Correlates all events for this invocation. */
  toolCallId: string;

  /** The name of the tool being called. */
  toolName: string;

  /**
   * The tool input accumulated so far. In streaming mode, this may be
   * a partial JSON string. In buffered mode, this is the complete input.
   */
  inputAccumulated: string;
}
```

### 9.3 ToolInputDeltaEvent

Emitted for each chunk of tool input as it streams in. Only emitted in streaming mode when the agent supports tool call streaming.

```typescript
interface ToolInputDeltaEvent extends BaseEvent {
  type: 'tool_input_delta';

  /** Correlates to the `ToolCallStartEvent` for this tool call. */
  toolCallId: string;

  /** The new input fragment. */
  delta: string;

  /** All input accumulated so far, including this delta. */
  inputAccumulated: string;
}
```

### 9.4 ToolCallReadyEvent

Emitted when the tool input is fully assembled and the tool is ready to execute (or is executing). The `input` field contains the parsed, complete input.

```typescript
interface ToolCallReadyEvent extends BaseEvent {
  type: 'tool_call_ready';

  /** Correlates to the `ToolCallStartEvent` for this tool call. */
  toolCallId: string;

  /** The name of the tool being called. */
  toolName: string;

  /**
   * The complete, parsed tool input. Type depends on the tool's schema;
   * typically a plain object but may be any JSON-serializable value.
   */
  input: unknown;
}
```

### 9.5 ToolResultEvent

Emitted when a tool call completes successfully.

```typescript
interface ToolResultEvent extends BaseEvent {
  type: 'tool_result';

  /** Correlates to the `ToolCallStartEvent` for this tool call. */
  toolCallId: string;

  /** The name of the tool that was called. */
  toolName: string;

  /**
   * The tool's output. Type depends on the tool; typically a string
   * or plain object. May be any JSON-serializable value.
   */
  output: unknown;

  /** Wall-clock duration of the tool execution in milliseconds. */
  durationMs: number;
}
```

### 9.6 ToolErrorEvent

Emitted when a tool call fails.

```typescript
interface ToolErrorEvent extends BaseEvent {
  type: 'tool_error';

  /** Correlates to the `ToolCallStartEvent` for this tool call. */
  toolCallId: string;

  /** The name of the tool that failed. */
  toolName: string;

  /** Human-readable error message. */
  error: string;
}
```

### 9.7 Tool Event Ordering

```
tool_call_start(toolCallId='tc-1')
  -> tool_input_delta(toolCallId='tc-1')*    (zero or more, streaming only)
  -> tool_call_ready(toolCallId='tc-1')
  -> tool_result(toolCallId='tc-1')          (success path)
     OR tool_error(toolCallId='tc-1')        (failure path)
```

A tool call always begins with `tool_call_start` and terminates with exactly one of `tool_result` or `tool_error`. `tool_call_ready` is guaranteed between the last `tool_input_delta` and the result/error. Parallel tool calls may interleave events from different `toolCallId` values, but events for a single `toolCallId` are always in order.

---

## 10. File Operations Events (5 events)

File operation events are emitted when the agent reads, writes, creates, deletes, or patches files. These are high-level semantic events; the underlying tool call events are emitted separately.

```typescript
interface FileReadEvent extends BaseEvent {
  type: 'file_read';

  /** Absolute or workspace-relative path of the file that was read. */
  path: string;
}

interface FileWriteEvent extends BaseEvent {
  type: 'file_write';

  /** Absolute or workspace-relative path of the file that was written. */
  path: string;

  /** Number of bytes written to the file. */
  byteCount: number;
}

interface FileCreateEvent extends BaseEvent {
  type: 'file_create';

  /** Absolute or workspace-relative path of the newly created file. */
  path: string;

  /** Number of bytes in the newly created file. */
  byteCount: number;
}

interface FileDeleteEvent extends BaseEvent {
  type: 'file_delete';

  /** Absolute or workspace-relative path of the deleted file. */
  path: string;
}

interface FilePatchEvent extends BaseEvent {
  type: 'file_patch';

  /** Absolute or workspace-relative path of the patched file. */
  path: string;

  /**
   * Unified diff of the changes applied. Format follows the standard
   * unified diff format (--- a/file, +++ b/file, @@ hunks).
   */
  diff: string;
}
```

### 10.1 File Event Ordering

File events are emitted after the corresponding `tool_result` or `tool_call_ready` event. They are informational projections of tool activity, not a separate execution stream. A single tool call may produce multiple file events (e.g., a multi-file edit tool).

```
tool_call_ready(toolName='file_write') -> tool_result -> file_write
tool_call_ready(toolName='edit_file')  -> tool_result -> file_patch
```

---

## 11. Shell Operations Events (4 events)

Shell events track command execution by the agent. The `shell_start` event identifies the command; stdout/stderr deltas stream the output; `shell_exit` marks completion.

### 11.1 ShellStartEvent

```typescript
interface ShellStartEvent extends BaseEvent {
  type: 'shell_start';

  /** The command string as executed by the agent. */
  command: string;

  /** The working directory for the command. */
  cwd: string;
}
```

### 11.2 ShellStdoutDeltaEvent

```typescript
interface ShellStdoutDeltaEvent extends BaseEvent {
  type: 'shell_stdout_delta';

  /** A chunk of stdout output from the running command. */
  delta: string;
}
```

### 11.3 ShellStderrDeltaEvent

```typescript
interface ShellStderrDeltaEvent extends BaseEvent {
  type: 'shell_stderr_delta';

  /** A chunk of stderr output from the running command. */
  delta: string;
}
```

### 11.4 ShellExitEvent

```typescript
interface ShellExitEvent extends BaseEvent {
  type: 'shell_exit';

  /**
   * The exit code of the command. 0 indicates success; non-zero
   * indicates failure. -1 indicates the process was killed by a signal.
   */
  exitCode: number;

  /** Wall-clock duration of the command execution in milliseconds. */
  durationMs: number;
}
```

### 11.5 Shell Event Ordering

```
shell_start
  -> shell_stdout_delta*     (zero or more, interleaved with stderr)
  -> shell_stderr_delta*     (zero or more, interleaved with stdout)
  -> shell_exit
```

`shell_start` always precedes any stdout/stderr deltas. `shell_exit` is always the final shell event for a given command. Stdout and stderr deltas may interleave in any order. Shell events are nested within the corresponding tool call events (the shell execution is a tool invocation).

---

## 12. MCP Tool Calling Events (3 events)

MCP (Model Context Protocol) tool events track invocations of tools provided by MCP servers configured via `RunOptions.mcpServers`. They are distinct from native tool events to allow consumers to differentiate between built-in and MCP-provided tools.

### 12.1 Correlation Key: `toolCallId`

MCP tool events share the `toolCallId` correlation key with native tool events. The `server` field distinguishes MCP tool calls from native ones.

```typescript
interface McpToolCallStartEvent extends BaseEvent {
  type: 'mcp_tool_call_start';

  /** Unique identifier for this tool call. */
  toolCallId: string;

  /** The name of the MCP server providing the tool. */
  server: string;

  /** The tool name within the MCP server's namespace. */
  toolName: string;

  /** The complete parsed input for the tool call. */
  input: unknown;
}

interface McpToolResultEvent extends BaseEvent {
  type: 'mcp_tool_result';

  /** Correlates to the `McpToolCallStartEvent`. */
  toolCallId: string;

  /** The MCP server name. */
  server: string;

  /** The tool name. */
  toolName: string;

  /** The tool's output value. */
  output: unknown;
}

interface McpToolErrorEvent extends BaseEvent {
  type: 'mcp_tool_error';

  /** Correlates to the `McpToolCallStartEvent`. */
  toolCallId: string;

  /** The MCP server name. */
  server: string;

  /** The tool name. */
  toolName: string;

  /** Human-readable error message from the MCP server or transport layer. */
  error: string;
}
```

### 12.2 MCP Tool Event Ordering

```
mcp_tool_call_start(toolCallId='mcp-1')
  -> mcp_tool_result(toolCallId='mcp-1')     (success path)
     OR mcp_tool_error(toolCallId='mcp-1')   (failure path)
```

MCP tool events do not have input delta streaming. The full input is available at `mcp_tool_call_start`. Each MCP tool call produces exactly one start event followed by exactly one result or error event.

---

## 13. Subagent Dispatch Events (3 events)

Subagent events track when the primary agent spawns a secondary agent to handle a subtask. These events are emitted by agents that support parallel or delegated execution.

### 13.1 Correlation Key: `subagentId`

All subagent events for a single spawned agent share the same `subagentId`. This is generated by the adapter and is unique within the parent run.

```typescript
interface SubagentSpawnEvent extends BaseEvent {
  type: 'subagent_spawn';

  /** Unique identifier for this subagent invocation. */
  subagentId: string;

  /** The name of the agent being spawned as a subagent. */
  agentName: string;

  /** The prompt/task delegated to the subagent. */
  prompt: string;
}

interface SubagentResultEvent extends BaseEvent {
  type: 'subagent_result';

  /** Correlates to the `SubagentSpawnEvent`. */
  subagentId: string;

  /** The agent name. */
  agentName: string;

  /** A summary of the subagent's result. */
  summary: string;

  /**
   * Cost incurred by the subagent invocation.
   *
   * @see CostRecord in Section 3.
   */
  cost?: CostRecord;
}

interface SubagentErrorEvent extends BaseEvent {
  type: 'subagent_error';

  /** Correlates to the `SubagentSpawnEvent`. */
  subagentId: string;

  /** The agent name. */
  agentName: string;

  /** Human-readable error message from the subagent. */
  error: string;
}
```

### 13.2 Subagent Event Ordering

```
subagent_spawn(subagentId='sa-1')
  -> subagent_result(subagentId='sa-1')    (success path)
     OR subagent_error(subagentId='sa-1')  (failure path)
```

Subagent events do not stream intermediate results from the subagent. The parent adapter collects the subagent's output and emits a single result or error. Multiple subagents may run concurrently; their events may interleave but are correlated by `subagentId`.

---

## 14. Plugin Events (3 events)

Plugin events track the loading, invocation, and failure of agent plugins (skills, extensions, channel plugins, MCP servers managed as plugins).

### 14.1 Correlation Key: `pluginId`

All plugin events for a specific plugin share the same `pluginId`. The `pluginId` is the plugin's unique identifier as registered with the agent.

```typescript
interface PluginLoadedEvent extends BaseEvent {
  type: 'plugin_loaded';

  /** Unique identifier for the plugin (e.g., npm package name). */
  pluginId: string;

  /** Human-readable plugin name. */
  pluginName: string;

  /** Semantic version string of the loaded plugin. */
  version: string;
}

interface PluginInvokedEvent extends BaseEvent {
  type: 'plugin_invoked';

  /** The plugin being invoked. */
  pluginId: string;

  /** Human-readable plugin name. */
  pluginName: string;
}

interface PluginErrorEvent extends BaseEvent {
  type: 'plugin_error';

  /** The plugin that errored. */
  pluginId: string;

  /** Human-readable plugin name. */
  pluginName: string;

  /** Human-readable error message. */
  error: string;
}
```

### 14.2 Plugin Event Ordering

```
plugin_loaded(pluginId='p-1')             (during session startup)
  -> plugin_invoked(pluginId='p-1')*      (zero or more, during turns)
  -> plugin_error(pluginId='p-1')*        (zero or more, on failure)
```

`plugin_loaded` events are emitted during session initialization, before the first turn. `plugin_invoked` and `plugin_error` events occur during turn processing. A `plugin_error` does not necessarily terminate the run; the agent may continue with remaining plugins.

---

## 15. Skill / Agent Doc Loading Events (3 events)

Skill and agent doc events track the loading and invocation of skills (reusable prompt/tool bundles) and AGENTS.md-style documentation files.

```typescript
interface SkillLoadedEvent extends BaseEvent {
  type: 'skill_loaded';

  /** The name of the skill that was loaded. */
  skillName: string;

  /**
   * The source of the skill. Common values:
   * - File path for file-based skills
   * - npm package name for package skills
   * - 'built-in' for agent-native skills
   */
  source: string;
}

interface SkillInvokedEvent extends BaseEvent {
  type: 'skill_invoked';

  /** The name of the skill that was invoked. */
  skillName: string;
}

interface AgentdocReadEvent extends BaseEvent {
  type: 'agentdoc_read';

  /**
   * Path to the agent documentation file that was read.
   * Typically AGENTS.md or similar.
   */
  path: string;
}
```

### 15.1 Skill/Agentdoc Event Ordering

`skill_loaded` events are emitted during session initialization. `skill_invoked` events occur during turn processing. `agentdoc_read` events occur during session initialization, after `session_start` but before the first `turn_start`.

---

## 16. Multimodal Events (2 events)

Multimodal events handle image input acknowledgement and image output generation.

```typescript
interface ImageOutputEvent extends BaseEvent {
  type: 'image_output';

  /**
   * MIME type of the image (e.g., 'image/png', 'image/jpeg', 'image/svg+xml').
   */
  mimeType: string;

  /**
   * Base64-encoded image data. Present when the image is delivered inline.
   * Mutually exclusive with `filePath` in typical usage, though both may
   * be present if the adapter provides both.
   */
  base64?: string;

  /**
   * Absolute path to the generated image file on disk. Present when the
   * agent writes the image to a file rather than streaming it inline.
   */
  filePath?: string;
}

interface ImageInputAckEvent extends BaseEvent {
  type: 'image_input_ack';

  /**
   * MIME type of the acknowledged input image.
   */
  mimeType: string;
}
```

---

## 17. Cost and Token Events (2 events)

Cost and token events provide real-time cost tracking and token usage telemetry. These are emitted independently of `turn_end` cost data and may arrive at different granularities.

### 17.1 CostEvent

Emitted when the agent reports cumulative or incremental cost data. May be emitted multiple times per run as cost information becomes available.

```typescript
interface CostEvent extends BaseEvent {
  type: 'cost';

  /**
   * The cost record. Whether this is cumulative (total run cost so far)
   * or incremental (cost of the latest operation) is adapter-dependent.
   * Consumers should treat the final `cost` event as the authoritative
   * total, and the `session_end` cost as the canonical aggregate.
   *
   * @see CostRecord in Section 3.
   */
  cost: CostRecord;
}
```

### 17.2 TokenUsageEvent

Emitted when the agent reports token usage for a specific API call or turn.

```typescript
interface TokenUsageEvent extends BaseEvent {
  type: 'token_usage';

  /** Number of input tokens consumed in this API call. */
  inputTokens: number;

  /** Number of output tokens generated in this API call. */
  outputTokens: number;

  /** Number of thinking/reasoning tokens consumed (if applicable). */
  thinkingTokens?: number;

  /** Number of cached input tokens reused (if applicable). */
  cachedTokens?: number;
}
```

### 17.3 Cost/Token Event Ordering

Cost and token events are not ordered relative to text or tool events. They may arrive at any point during a turn, typically after the API call that generated the usage completes. The last `cost` event in a run contains the most up-to-date cumulative cost.

---

## 18. Interaction / Waiting Events (4 events)

Interaction events implement the bidirectional communication channel between the agent and the consumer. They enable approval workflows and free-form input prompts.

### 18.1 Correlation Key: `interactionId`

All interaction events for a single interaction share the same `interactionId`. This ID is used with `InteractionChannel.respond()` on the `RunHandle` to send a response back to the agent.

```typescript
interface InputRequiredEvent extends BaseEvent {
  type: 'input_required';

  /** Unique identifier for this interaction. Used with `RunHandle.interaction.respond()`. */
  interactionId: string;

  /** The question or prompt the agent is asking the user. */
  question: string;

  /** Additional context for the question (e.g., what the agent is trying to do). */
  context?: string;

  /**
   * Whether the input request originated from the agent itself or from
   * a tool the agent is using.
   */
  source: 'agent' | 'tool';
}

interface ApprovalRequestEvent extends BaseEvent {
  type: 'approval_request';

  /** Unique identifier for this approval interaction. */
  interactionId: string;

  /** Short description of the action requiring approval (e.g., 'Execute shell command'). */
  action: string;

  /** Detailed description of what will be done (e.g., the full command). */
  detail: string;

  /** The tool requesting approval, if applicable. */
  toolName?: string;

  /**
   * Assessed risk level of the action:
   * - 'low': read-only operations, safe transformations
   * - 'medium': file writes, non-destructive commands
   * - 'high': destructive operations, network access, privileged commands
   */
  riskLevel: 'low' | 'medium' | 'high';
}

interface ApprovalGrantedEvent extends BaseEvent {
  type: 'approval_granted';

  /** Correlates to the `ApprovalRequestEvent`. */
  interactionId: string;
}

interface ApprovalDeniedEvent extends BaseEvent {
  type: 'approval_denied';

  /** Correlates to the `ApprovalRequestEvent`. */
  interactionId: string;

  /** The reason the approval was denied, if provided. */
  reason?: string;
}
```

### 18.2 Interaction Event Ordering

```
approval_request(interactionId='ia-1')
  -> approval_granted(interactionId='ia-1')    (approved path)
     OR approval_denied(interactionId='ia-1')  (denied path)

input_required(interactionId='ia-2')
  -> [consumer responds via InteractionChannel]
```

An `approval_request` is always followed by exactly one `approval_granted` or `approval_denied`. When `RunOptions.approvalMode` is `'yolo'`, no `approval_request` events are emitted; tools execute without approval. When `approvalMode` is `'deny'`, every tool call is auto-denied and an `approval_denied` event is emitted.

An `input_required` event pauses the run until the consumer responds. If `RunOptions.onInputRequired` is set, it is called automatically; otherwise the event is surfaced on `RunHandle.interaction.pending` for manual response.

---

## 19. Rate / Context Limit Events (4 events)

These events surface rate limiting, context window pressure, automatic compaction, and retry behavior.

```typescript
interface RateLimitedEvent extends BaseEvent {
  type: 'rate_limited';

  /**
   * Suggested delay before retrying, in milliseconds. Absent if the
   * agent/API did not provide retry-after guidance.
   */
  retryAfterMs?: number;
}

interface ContextLimitWarningEvent extends BaseEvent {
  type: 'context_limit_warning';

  /** Number of tokens currently used in the context window. */
  usedTokens: number;

  /** Maximum context window size in tokens for the current model. */
  maxTokens: number;

  /**
   * Percentage of context window used (0-100). Warnings are typically
   * emitted when this exceeds 80%.
   */
  pctUsed: number;
}

interface ContextCompactedEvent extends BaseEvent {
  type: 'context_compacted';

  /**
   * A human-readable summary of what was removed or compressed
   * during compaction.
   */
  summary: string;

  /** Number of tokens freed by compaction. */
  tokensSaved: number;
}

interface RetryEvent extends BaseEvent {
  type: 'retry';

  /** The current retry attempt number (1-based). */
  attempt: number;

  /** The maximum number of retry attempts configured. */
  maxAttempts: number;

  /** Human-readable reason for the retry (e.g., 'rate_limited', 'transient_error'). */
  reason: string;

  /** Delay in milliseconds before the retry will be attempted. */
  delayMs: number;
}
```

### 19.1 Rate/Context Event Ordering

`rate_limited` may occur at any point during a run, typically between API calls. A `retry` event follows a `rate_limited` event when auto-retry is enabled. `context_limit_warning` may occur at any point during a turn. `context_compacted` follows a `context_limit_warning` when the agent automatically compacts its context.

---

## 20. Run Lifecycle / Control Events (7 events)

Run lifecycle events reflect state transitions triggered by consumer control methods (`interrupt()`, `abort()`, `pause()`, `resume()`) or by system limits.

```typescript
interface InterruptedEvent extends BaseEvent {
  type: 'interrupted';
}

interface AbortedEvent extends BaseEvent {
  type: 'aborted';
}

interface PausedEvent extends BaseEvent {
  type: 'paused';
}

interface ResumedEvent extends BaseEvent {
  type: 'resumed';
}

interface TimeoutEvent extends BaseEvent {
  type: 'timeout';

  /**
   * Which timeout was hit:
   * - 'run': the overall run timeout (`RunOptions.timeout`)
   * - 'inactivity': the inactivity timeout (`RunOptions.inactivityTimeout`)
   */
  kind: 'run' | 'inactivity';
}

interface TurnLimitEvent extends BaseEvent {
  type: 'turn_limit';

  /** The maximum number of turns that was configured via `RunOptions.maxTurns`. */
  maxTurns: number;
}

interface StreamFallbackEvent extends BaseEvent {
  type: 'stream_fallback';

  /**
   * The streaming capability that fell back to buffered mode:
   * - 'text': text generation streaming
   * - 'tool_calls': tool input streaming
   * - 'thinking': thinking/reasoning streaming
   */
  capability: 'text' | 'tool_calls' | 'thinking';

  /** Human-readable reason for the fallback. */
  reason: string;
}
```

### 20.1 Run Lifecycle Event Ordering

`interrupted`, `aborted`, and `timeout` are terminal control events. After any of these, no further turn/text/tool events are emitted. The run transitions to a terminal state and emits `session_end`.

```
[running events...] -> interrupted -> session_end
[running events...] -> aborted -> session_end
[running events...] -> timeout -> session_end
[running events...] -> turn_limit -> session_end
```

`paused` and `resumed` are non-terminal. Events stop flowing after `paused` and resume after `resumed`.

```
[running events...] -> paused -> resumed -> [running events...]
```

`stream_fallback` is informational and non-terminal. It is emitted once per capability per run, at the point the adapter first detects that the capability must fall back to buffered mode.

---

## 21. Error Events (5 events)

Error events represent failures of varying severity. Some are recoverable (the run continues); others are terminal (the run ends).

```typescript
interface AuthErrorEvent extends BaseEvent {
  type: 'auth_error';

  /** Human-readable error message describing the auth failure. */
  message: string;

  /**
   * Actionable guidance for the user to resolve the auth issue.
   * E.g., 'Run "claude login" to authenticate' or 'Set OPENAI_API_KEY'.
   */
  guidance: string;
}

interface RateLimitErrorEvent extends BaseEvent {
  type: 'rate_limit_error';

  /** Human-readable error message. */
  message: string;

  /** Suggested retry delay in milliseconds, if provided by the API. */
  retryAfterMs?: number;
}

interface ContextExceededEvent extends BaseEvent {
  type: 'context_exceeded';

  /** Number of tokens used when the context was exceeded. */
  usedTokens: number;

  /** Maximum context window size in tokens. */
  maxTokens: number;
}

interface CrashEvent extends BaseEvent {
  type: 'crash';

  /** Exit code from the agent subprocess. */
  exitCode: number;

  /** Captured stderr output from the crashed subprocess. */
  stderr: string;
}

interface ErrorEvent extends BaseEvent {
  type: 'error';

  /**
   * Machine-readable error code from the ErrorCode enum.
   *
   * @see ErrorCode in 01-core-types-and-client.md, Section 3.1.
   */
  code: ErrorCode;

  /** Human-readable error message. */
  message: string;

  /**
   * Whether the run can continue after this error.
   * When false, the run will terminate after this event.
   */
  recoverable: boolean;
}
```

### 21.1 Error Event Ordering and Terminality

| Event | Terminal | Followed By |
|---|---|---|
| `auth_error` | Yes | `session_end` (if session was started) |
| `rate_limit_error` | No (if retries remain) / Yes (if exhausted) | `retry` (if retrying) or `session_end` |
| `context_exceeded` | Yes | `session_end` |
| `crash` | Yes | Nothing (subprocess is gone) |
| `error` (`recoverable: true`) | No | Normal event flow continues |
| `error` (`recoverable: false`) | Yes | `session_end` |

Terminal error events halt the run. After a terminal error, no further text, tool, or turn events are emitted. `session_end` follows when possible; `crash` events may not have a `session_end` if the subprocess died before session state could be finalized.

---

## 22. Debug Events (2 events)

Debug events provide adapter-level diagnostic information. They are emitted regardless of the `debug` flag, but the `raw` field on other events is only populated when `debug` is enabled.

```typescript
interface DebugEvent extends BaseEvent {
  type: 'debug';

  /**
   * Severity level:
   * - 'verbose': detailed tracing information (high volume)
   * - 'info': notable adapter-level information
   * - 'warn': potential issues that do not prevent operation
   */
  level: 'verbose' | 'info' | 'warn';

  /** Human-readable debug message. */
  message: string;
}

interface LogEvent extends BaseEvent {
  type: 'log';

  /**
   * Which output stream the line came from:
   * - 'stdout': standard output from the agent subprocess
   * - 'stderr': standard error from the agent subprocess
   */
  source: 'stdout' | 'stderr';

  /** A single line of output from the agent subprocess. */
  line: string;
}
```

### 22.1 Debug Event Ordering

Debug and log events may appear at any point in the event stream. They do not affect the ordering guarantees of other event categories. `log` events with `source: 'stderr'` during subprocess startup may appear before `session_start`.

---

## 23. Complete Correlation Key Reference

Correlation keys allow consumers to group related events across the stream. Each key is unique within a single run.

| Correlation Key | Events Using It | Purpose |
|---|---|---|
| `toolCallId` | `tool_call_start`, `tool_input_delta`, `tool_call_ready`, `tool_result`, `tool_error`, `mcp_tool_call_start`, `mcp_tool_result`, `mcp_tool_error` | Groups all events for a single tool invocation (native or MCP). |
| `subagentId` | `subagent_spawn`, `subagent_result`, `subagent_error` | Groups all events for a single subagent invocation. |
| `interactionId` | `input_required`, `approval_request`, `approval_granted`, `approval_denied` | Groups all events for a single interaction prompt/approval cycle. |
| `pluginId` | `plugin_loaded`, `plugin_invoked`, `plugin_error` | Groups all events for a specific plugin. |
| `sessionId` | `session_start`, `session_resume`, `session_fork`, `session_checkpoint`, `session_end` | Groups all session lifecycle events. |

> **Note:** `turnIndex` is a positional index used for turn/step scoping (present on `turn_start`, `turn_end`, `step_start`, `step_end`) but is not a correlation identifier — it does not uniquely identify a resource across events the way the keys above do.

### 23.1 Key Format Conventions

| Key | Format | Example |
|---|---|---|
| `toolCallId` | Adapter-dependent; typically `toolu_` prefix (Claude), UUID (Codex), or numeric ID | `toolu_01ABcD`, `tc-a1b2c3` |
| `subagentId` | ULID or UUID generated by the adapter | `01HXYZ...` |
| `interactionId` | ULID generated by the adapter | `01HABC...` |
| `pluginId` | Plugin package name or adapter-assigned ID | `@scope/plugin-name`, `skill-file-hash` |
| `sessionId` | Agent-native format | `uuid-v4` (Claude), `session-dirname` (Codex) |

---

## 24. Streaming Model

The streaming model controls how events are emitted by adapters. It is configured via `RunOptions.stream` (or `ClientOptions.stream` for the default).

### 24.1 Streaming Modes

#### `stream: 'auto'` (default)

The adapter uses streaming for each output type that the agent and model support. For unsupported output types, the adapter silently falls back to buffered emission.

**Behavior per capability:**

| Capability | Supported | Not Supported |
|---|---|---|
| Text streaming (`supportsTextStreaming`) | Multiple `text_delta` events with small fragments | Single `text_delta` with complete text |
| Tool call streaming (`supportsToolCallStreaming`) | `tool_input_delta` events for tool input | `tool_call_start` with complete input, no `tool_input_delta` events |
| Thinking streaming (`supportsThinkingStreaming`) | Multiple `thinking_delta` events | Single `thinking_delta` with complete thinking text |

When fallback activates, a `stream_fallback` event is emitted once per capability. This event is informational; the consumer still receives the same event types with the same ordering guarantees.

#### `stream: true`

Requires text streaming. If the adapter has `supportsTextStreaming: false`, `mux.run()` throws `CapabilityError` synchronously before spawning the subprocess.

Tool call and thinking streaming still fall back silently (same as `'auto'`), because these are supplementary capabilities that should not block the run.

#### `stream: false`

All output is buffered. The adapter waits for the agent to complete its response, then emits events in rapid succession:

1. `message_start`
2. A single `text_delta` with `delta` equal to the complete text and `accumulated` equal to the complete text
3. `message_stop`

Tool events are emitted after all text. Tool call streaming never occurs. Thinking events, if present, are emitted as a single `thinking_delta` with the complete thinking text.

### 24.2 Stream Fallback Behavior

When `stream: 'auto'` detects that a capability is unsupported, the adapter:

1. Emits a `stream_fallback` event identifying the capability and reason.
2. Buffers the corresponding output internally.
3. Emits the buffered output as a single delta event when the agent completes that output segment.

The `stream_fallback` event is emitted at most once per capability per run. Multiple capabilities may fall back independently.

```typescript
// Example: adapter detects thinking streaming is not supported
// Emitted once when first thinking output arrives:
{
  type: 'stream_fallback',
  capability: 'thinking',
  reason: 'Model gpt-4o does not support thinking streaming',
  runId: '01HXYZ...',
  agent: 'codex',
  timestamp: 1712345678901
}
// Then a single thinking_delta with accumulated text:
{
  type: 'thinking_delta',
  delta: '<complete thinking text>',
  accumulated: '<complete thinking text>',
  ...
}
```

### 24.3 Backpressure

The event stream implements backpressure through the async iterator protocol. When a consumer is slow to consume events:

1. **AsyncIterable consumption** (`for await...of`): The adapter buffers events in an internal queue. The queue has no hard limit; extremely slow consumers may cause memory growth. Consumers should avoid blocking in event handlers.

2. **EventEmitter consumption** (`on`/`off`): Events are delivered synchronously to all listeners. No backpressure is applied. Listeners that perform async work should queue internally.

3. **Promise consumption** (`await`): No streaming occurs from the consumer's perspective. All events are processed internally by the `RunHandle` to build the `RunResult`.

**Adapter-side buffering:** Each adapter maintains an internal ring buffer for subprocess stdout/stderr. The buffer size is 64 KB per stream. When the buffer fills, the oldest data is discarded and a `debug` event with `level: 'warn'` is emitted indicating data loss. This situation indicates the consumer is not draining events fast enough.

### 24.4 Streaming Mode Summary

| Behavior | `'auto'` | `true` | `false` |
|---|---|---|---|
| Text streaming | If supported | Required (throws if not) | Buffered |
| Tool call streaming | If supported | If supported | Buffered |
| Thinking streaming | If supported | If supported | Buffered |
| `stream_fallback` emitted | Yes, per unsupported capability | Yes, for tool/thinking only | No |
| `CapabilityError` thrown | Never | Yes, if text streaming unsupported | Never |
| Event types received | All 67 | All 67 | All 67 |

---

## 25. Event Ordering Contracts

This section formally specifies the ordering guarantees that consumers can rely on.

### 25.1 Global Ordering

1. `session_start` is the first domain event in every run. Only `debug` and `log` events may precede it (from subprocess startup).
2. `session_end` is the last domain event in every successful run. Only `debug` and `log` events may follow it.
3. All turn events occur between `session_start` and `session_end`.
4. Events within a run are totally ordered. The async iterator yields them in emission order.

### 25.2 Turn-Level Ordering

1. `turn_start(N)` always precedes `turn_end(N)`.
2. `turn_end(N)` always precedes `turn_start(N+1)`.
3. All thinking, text, tool, file, shell, MCP, and subagent events for turn N occur between `turn_start(N)` and `turn_end(N)`.
4. Steps, when present, are properly nested: `step_start` precedes `step_end` and both are within the enclosing turn.

### 25.3 Within-Turn Ordering

1. Thinking events precede text events within the same generation cycle.
2. Text events and tool events may interleave across generation cycles (e.g., text -> tool call -> more text).
3. File events follow their corresponding tool result events.
4. Shell events are nested within their corresponding tool call events.

### 25.4 Interaction Ordering

1. `approval_request` always precedes `approval_granted` or `approval_denied` for the same `interactionId`.
2. The run pauses after emitting `input_required` or `approval_request` (when not auto-handled) until the consumer responds.
3. Tool execution events follow `approval_granted` for the approved tool call.

### 25.5 Error and Terminal Ordering

1. Terminal errors (`auth_error`, `context_exceeded`, `crash`, non-recoverable `error`) are followed only by `session_end` (when possible) and `debug`/`log` events.
2. `interrupted`, `aborted`, `timeout`, and `turn_limit` are followed by `session_end`.
3. After any terminal event, no further turn/text/tool events are emitted.

### 25.6 Complete Run Event Sequence

```
[debug/log]*                           -- subprocess startup noise
session_start                          -- always first domain event
  [session_resume]?                    -- if resuming
  [session_fork]?                      -- if forking
  [plugin_loaded]*                     -- zero or more during init
  [skill_loaded]*                      -- zero or more during init
  [agentdoc_read]*                     -- zero or more during init
  turn_start(0)
    [stream_fallback]*                 -- zero or more, when adapter first detects capability fallback
    [step_start(0,0)]?
      [thinking_start -> thinking_delta+ -> thinking_stop]?
      [message_start -> text_delta+ -> message_stop]*
      [tool_call_start -> tool_input_delta* -> tool_call_ready
        -> (tool_result | tool_error)
        -> (file_read | file_write | file_create | file_delete | file_patch)*
      ]*
      [mcp_tool_call_start -> (mcp_tool_result | mcp_tool_error)]*
      [shell_start -> shell_stdout_delta* -> shell_stderr_delta* -> shell_exit]*
      [subagent_spawn -> (subagent_result | subagent_error)]*
      [approval_request -> (approval_granted | approval_denied)]*
      [input_required]*
      [plugin_invoked | plugin_error]*
      [skill_invoked]*
      [image_output | image_input_ack]*
      [cost | token_usage]*
      [rate_limited -> retry?]*
      [context_limit_warning -> context_compacted?]*
    [step_end(0,0)]?
    [step_start(0,N) -> ... -> step_end(0,N)]*
    [session_checkpoint]?
  turn_end(0)
  [turn_start(N) -> ... -> turn_end(N)]*
  [interrupted | aborted | timeout | turn_limit]?    -- terminal control
  [auth_error | rate_limit_error | context_exceeded | crash | error]?
session_end                            -- always last domain event
[debug/log]*                           -- subprocess teardown noise
```

---

## 26. Per-Agent Event Support Matrix

Each built-in adapter emits a subset of the 67 event types based on the agent's capabilities and output format. This matrix shows which event categories each adapter supports.

### 26.1 Category Support

| Category | claude | codex | gemini | copilot | cursor | opencode | pi | omp | openclaw | hermes |
|---|---|---|---|---|---|---|---|---|---|---|
| Session lifecycle | Full | Partial | Partial | Minimal | Partial | Full | Full | Full | Full | Full |
| Turn / step | Full | Full | Full | Turn only | Turn only | Full | Full | Full | Full | Full |
| Text streaming | Full | Full | Full | Full | Full | Full | Full | Full | Full | Full |
| Thinking | Full | Full | Full | No | No | Full | Full | Full | Full | Full |
| Tool calling | Full | Full | Full | Partial | Full | Full | Full | Full | Full | Full |
| File operations | Full | Full | Full | Full | Partial | Full | Full | Full | Full | Full |
| Shell operations | Full | Full | Full | No | Partial | Full | Full | Full | Full | Full |
| MCP | Full | No | Partial | No | Full | Full | Full | Full | Full | Full |
| Subagent dispatch | Full | No | No | No | No | No | Partial | Partial | Full | No |
| Plugin events | Partial | No | No | No | Full | Full | Full | Full | Full | No |
| Skill / agentdoc | Full | No | No | No | Full | Full | Full | Full | Full | No |
| Multimodal | Full | Partial | Full | No | Full | Partial | Partial | Partial | Full | Partial |
| Cost / tokens | Full | Full | Full | No | No | Full | Full | Full | Full | Full |
| Interaction | Full | Full | Full | Partial | Full | Full | Full | Full | Full | Full |
| Rate / context | Full | Full | Full | Partial | Partial | Full | Full | Full | Full | Full |
| Run lifecycle | Full | Full | Full | Full | Full | Full | Full | Full | Full | Full |
| Errors | Full | Full | Full | Full | Full | Full | Full | Full | Full | Full |
| Debug | Full | Full | Full | Full | Full | Full | Full | Full | Full | Full |

### 26.2 Support Level Definitions

| Level | Meaning |
|---|---|
| **Full** | All events in the category are emitted with all fields populated. |
| **Partial** | Some events in the category are emitted, or some fields may be absent. See per-agent notes below. |
| **Minimal** | Only the bare minimum events are emitted (e.g., `session_start` and `session_end` with synthetic data). |
| **Turn only** | Only turn-level events are emitted; step events are not available. |
| **No** | No events in this category are emitted by this adapter. |

### 26.3 Per-Agent Notes

**claude:** Full support across all categories. Claude Code provides the richest event data of any adapter. Subagent dispatch maps to Claude Code's built-in Agent tool. Plugin events are partial because Claude Code's skill system does not emit explicit load/invoke signals; the adapter synthesizes these from tool call patterns.

**codex:** No MCP, subagent, plugin, or skill support. Session lifecycle is partial: no fork or checkpoint support. Multimodal is partial: supports image input acknowledgement but not image output.

**gemini:** No subagent, plugin, or skill support. MCP is partial: Gemini CLI has experimental MCP support with limited error reporting. Session lifecycle is partial: no fork support.

**copilot:** Minimal session lifecycle (no resume, fork, or checkpoint). No thinking, shell, MCP, subagent, plugin, skill, multimodal, or cost support. Interaction is partial: supports approval but not free-form input. Tool calling is partial: tool input streaming is not available.

**cursor:** No thinking, subagent, or cost/token support. Turn-level only (no steps). Shell operations are partial: command output is captured but cwd is not always available. File operations are partial: byte counts may be estimated.

**opencode:** Full support across most categories. No subagent dispatch. Multimodal is partial: image input only. MCP and plugin support depend on OpenCode version.

**pi:** Full support across most categories. Subagent dispatch is partial: limited to Pi's task delegation feature. Multimodal is partial: image input only, no image output.

**omp:** Same as Pi with additional support through oh-my-pi extensions. Subagent dispatch is partial: same as Pi.

**openclaw:** Full support across all categories including its multi-channel plugin system. The richest plugin event data among all adapters.

**hermes:** Full support for session, turn/step, text, thinking, tool calling, file ops, shell ops, interaction, rate/context, cost/tokens, run lifecycle, errors, debug, and MCP (both client and server mode via the `hermes-acp` entry point). No subagent, plugin, or skill support. Multimodal is partial: image input only. hermes-agent is installed via `pip install hermes-agent` (Python >= 3.11) and its output is parsed from JSON-lines format.

### 26.4 Unsupported Event Behavior

When an adapter does not support a category, it simply never emits those events. Consumers should not assume any event type will be present. The recommended pattern is:

```typescript
const handle = mux.run({ agent: 'copilot', prompt: 'Hello' });

for await (const event of handle) {
  switch (event.type) {
    case 'text_delta':
      // Always safe -- all adapters emit text events
      process.stdout.write(event.delta);
      break;
    case 'thinking_delta':
      // Only some adapters emit this; simply not reached for copilot
      displayThinking(event.delta);
      break;
    case 'cost':
      // Only emitted by adapters that track cost; absent for copilot
      updateCostDisplay(event.cost);
      break;
  }
}
```

---

## 27. Event Type Literal Constants

For convenience, the package exports a frozen object containing all event type literals:

```typescript
/**
 * All 67 event type string literals as a const object.
 * Useful for programmatic iteration and exhaustiveness checks.
 */
const AgentEventType = {
  // Session lifecycle
  SESSION_START: 'session_start',
  SESSION_RESUME: 'session_resume',
  SESSION_FORK: 'session_fork',
  SESSION_CHECKPOINT: 'session_checkpoint',
  SESSION_END: 'session_end',

  // Turn / step
  TURN_START: 'turn_start',
  TURN_END: 'turn_end',
  STEP_START: 'step_start',
  STEP_END: 'step_end',

  // Text / message streaming
  MESSAGE_START: 'message_start',
  TEXT_DELTA: 'text_delta',
  MESSAGE_STOP: 'message_stop',

  // Thinking / reasoning
  THINKING_START: 'thinking_start',
  THINKING_DELTA: 'thinking_delta',
  THINKING_STOP: 'thinking_stop',

  // Tool calling
  TOOL_CALL_START: 'tool_call_start',
  TOOL_INPUT_DELTA: 'tool_input_delta',
  TOOL_CALL_READY: 'tool_call_ready',
  TOOL_RESULT: 'tool_result',
  TOOL_ERROR: 'tool_error',

  // File operations
  FILE_READ: 'file_read',
  FILE_WRITE: 'file_write',
  FILE_CREATE: 'file_create',
  FILE_DELETE: 'file_delete',
  FILE_PATCH: 'file_patch',

  // Shell operations
  SHELL_START: 'shell_start',
  SHELL_STDOUT_DELTA: 'shell_stdout_delta',
  SHELL_STDERR_DELTA: 'shell_stderr_delta',
  SHELL_EXIT: 'shell_exit',

  // MCP tool calling
  MCP_TOOL_CALL_START: 'mcp_tool_call_start',
  MCP_TOOL_RESULT: 'mcp_tool_result',
  MCP_TOOL_ERROR: 'mcp_tool_error',

  // Subagent dispatch
  SUBAGENT_SPAWN: 'subagent_spawn',
  SUBAGENT_RESULT: 'subagent_result',
  SUBAGENT_ERROR: 'subagent_error',

  // Plugin events
  PLUGIN_LOADED: 'plugin_loaded',
  PLUGIN_INVOKED: 'plugin_invoked',
  PLUGIN_ERROR: 'plugin_error',

  // Skill / agent doc
  SKILL_LOADED: 'skill_loaded',
  SKILL_INVOKED: 'skill_invoked',
  AGENTDOC_READ: 'agentdoc_read',

  // Multimodal
  IMAGE_OUTPUT: 'image_output',
  IMAGE_INPUT_ACK: 'image_input_ack',

  // Cost / tokens
  COST: 'cost',
  TOKEN_USAGE: 'token_usage',

  // Interaction / waiting
  INPUT_REQUIRED: 'input_required',
  APPROVAL_REQUEST: 'approval_request',
  APPROVAL_GRANTED: 'approval_granted',
  APPROVAL_DENIED: 'approval_denied',

  // Rate / context limits
  RATE_LIMITED: 'rate_limited',
  CONTEXT_LIMIT_WARNING: 'context_limit_warning',
  CONTEXT_COMPACTED: 'context_compacted',
  RETRY: 'retry',

  // Run lifecycle / control
  INTERRUPTED: 'interrupted',
  ABORTED: 'aborted',
  PAUSED: 'paused',
  RESUMED: 'resumed',
  TIMEOUT: 'timeout',
  TURN_LIMIT: 'turn_limit',
  STREAM_FALLBACK: 'stream_fallback',

  // Errors
  AUTH_ERROR: 'auth_error',
  RATE_LIMIT_ERROR: 'rate_limit_error',
  CONTEXT_EXCEEDED: 'context_exceeded',
  CRASH: 'crash',
  ERROR: 'error',

  // Debug
  DEBUG: 'debug',
  LOG: 'log',
} as const;

type AgentEventTypeLiteral = typeof AgentEventType[keyof typeof AgentEventType];
```

---

## 28. Type Guard Utilities

The package exports type guard functions for narrowing `AgentEvent` to specific types or categories:

```typescript
/**
 * Narrow an AgentEvent to a specific type.
 */
function isEventType<T extends AgentEvent['type']>(
  event: AgentEvent,
  type: T
): event is Extract<AgentEvent, { type: T }> {
  return event.type === type;
}

/**
 * Check if an event belongs to a category.
 */
function isSessionEvent(event: AgentEvent): event is
  SessionStartEvent | SessionResumeEvent | SessionForkEvent |
  SessionCheckpointEvent | SessionEndEvent {
  return event.type.startsWith('session_');
}

function isTurnEvent(event: AgentEvent): event is
  TurnStartEvent | TurnEndEvent | StepStartEvent | StepEndEvent {
  return event.type === 'turn_start' || event.type === 'turn_end'
    || event.type === 'step_start' || event.type === 'step_end';
}

function isTextEvent(event: AgentEvent): event is
  MessageStartEvent | TextDeltaEvent | MessageStopEvent {
  return event.type === 'message_start' || event.type === 'text_delta'
    || event.type === 'message_stop';
}

function isThinkingEvent(event: AgentEvent): event is
  ThinkingStartEvent | ThinkingDeltaEvent | ThinkingStopEvent {
  return event.type.startsWith('thinking_');
}

function isToolEvent(event: AgentEvent): event is
  ToolCallStartEvent | ToolInputDeltaEvent | ToolCallReadyEvent |
  ToolResultEvent | ToolErrorEvent {
  return event.type.startsWith('tool_');
}

function isFileEvent(event: AgentEvent): event is
  FileReadEvent | FileWriteEvent | FileCreateEvent |
  FileDeleteEvent | FilePatchEvent {
  return event.type.startsWith('file_');
}

function isShellEvent(event: AgentEvent): event is
  ShellStartEvent | ShellStdoutDeltaEvent | ShellStderrDeltaEvent |
  ShellExitEvent {
  return event.type.startsWith('shell_');
}

function isMcpEvent(event: AgentEvent): event is
  McpToolCallStartEvent | McpToolResultEvent | McpToolErrorEvent {
  return event.type.startsWith('mcp_');
}

function isSubagentEvent(event: AgentEvent): event is
  SubagentSpawnEvent | SubagentResultEvent | SubagentErrorEvent {
  return event.type.startsWith('subagent_');
}

function isPluginEvent(event: AgentEvent): event is
  PluginLoadedEvent | PluginInvokedEvent | PluginErrorEvent {
  return event.type.startsWith('plugin_');
}

function isSkillEvent(event: AgentEvent): event is
  SkillLoadedEvent | SkillInvokedEvent | AgentdocReadEvent {
  return event.type === 'skill_loaded' || event.type === 'skill_invoked'
    || event.type === 'agentdoc_read';
}

function isMultimodalEvent(event: AgentEvent): event is
  ImageOutputEvent | ImageInputAckEvent {
  return event.type === 'image_output' || event.type === 'image_input_ack';
}

function isCostEvent(event: AgentEvent): event is
  CostEvent | TokenUsageEvent {
  return event.type === 'cost' || event.type === 'token_usage';
}

function isInteractionEvent(event: AgentEvent): event is
  InputRequiredEvent | ApprovalRequestEvent |
  ApprovalGrantedEvent | ApprovalDeniedEvent {
  return event.type === 'input_required' || event.type === 'approval_request'
    || event.type === 'approval_granted' || event.type === 'approval_denied';
}

function isRateLimitEvent(event: AgentEvent): event is
  RateLimitedEvent | ContextLimitWarningEvent |
  ContextCompactedEvent | RetryEvent {
  return event.type === 'rate_limited' || event.type === 'context_limit_warning'
    || event.type === 'context_compacted' || event.type === 'retry';
}

function isRunLifecycleEvent(event: AgentEvent): event is
  InterruptedEvent | AbortedEvent | PausedEvent | ResumedEvent |
  TimeoutEvent | TurnLimitEvent | StreamFallbackEvent {
  return event.type === 'interrupted' || event.type === 'aborted'
    || event.type === 'paused' || event.type === 'resumed'
    || event.type === 'timeout' || event.type === 'turn_limit'
    || event.type === 'stream_fallback';
}

function isErrorEvent(event: AgentEvent): event is
  AuthErrorEvent | RateLimitErrorEvent | ContextExceededEvent |
  CrashEvent | ErrorEvent {
  return event.type === 'auth_error' || event.type === 'rate_limit_error'
    || event.type === 'context_exceeded' || event.type === 'crash'
    || event.type === 'error';
}

function isDebugEvent(event: AgentEvent): event is
  DebugEvent | LogEvent {
  return event.type === 'debug' || event.type === 'log';
}

/**
 * Check if an event is terminal (the run will end after this event).
 */
function isTerminalEvent(event: AgentEvent): boolean {
  return event.type === 'interrupted'
    || event.type === 'aborted'
    || event.type === 'timeout'
    || event.type === 'turn_limit'
    || event.type === 'auth_error'
    || event.type === 'context_exceeded'
    || event.type === 'crash'
    || (event.type === 'error' && !(event as ErrorEvent).recoverable);
}

/**
 * Check if an event carries a correlation key.
 */
function hasCorrelationKey(event: AgentEvent, key: string): boolean {
  return key in event;
}
```

---

## 29. Event Count Verification

Total event types by category:

| # | Category | Count | Event Types |
|---|---|---|---|
| 1 | Session lifecycle | 5 | `session_start`, `session_resume`, `session_fork`, `session_checkpoint`, `session_end` |
| 2 | Turn / step | 4 | `turn_start`, `turn_end`, `step_start`, `step_end` |
| 3 | Text / message streaming | 3 | `message_start`, `text_delta`, `message_stop` |
| 4 | Thinking / reasoning | 3 | `thinking_start`, `thinking_delta`, `thinking_stop` |
| 5 | Tool calling | 5 | `tool_call_start`, `tool_input_delta`, `tool_call_ready`, `tool_result`, `tool_error` |
| 6 | File operations | 5 | `file_read`, `file_write`, `file_create`, `file_delete`, `file_patch` |
| 7 | Shell operations | 4 | `shell_start`, `shell_stdout_delta`, `shell_stderr_delta`, `shell_exit` |
| 8 | MCP tool calling | 3 | `mcp_tool_call_start`, `mcp_tool_result`, `mcp_tool_error` |
| 9 | Subagent dispatch | 3 | `subagent_spawn`, `subagent_result`, `subagent_error` |
| 10 | Plugin events | 3 | `plugin_loaded`, `plugin_invoked`, `plugin_error` |
| 11 | Skill / agent doc | 3 | `skill_loaded`, `skill_invoked`, `agentdoc_read` |
| 12 | Multimodal | 2 | `image_output`, `image_input_ack` |
| 13 | Cost / tokens | 2 | `cost`, `token_usage` |
| 14 | Interaction / waiting | 4 | `input_required`, `approval_request`, `approval_granted`, `approval_denied` |
| 15 | Rate / context limits | 4 | `rate_limited`, `context_limit_warning`, `context_compacted`, `retry` |
| 16 | Run lifecycle / control | 7 | `interrupted`, `aborted`, `paused`, `resumed`, `timeout`, `turn_limit`, `stream_fallback` |
| 17 | Errors | 5 | `auth_error`, `rate_limit_error`, `context_exceeded`, `crash`, `error` |
| 18 | Debug | 2 | `debug`, `log` |
| | **Total** | **67** | |

---

## Implementation Status (2026-04-12)

The event union and parse-context contract are implemented as specified. The stream is produced by `StreamAssembler` and consumed by `RunHandleImpl.events()`. Adapters emit events by returning `AgentEvent | AgentEvent[] | null` from `parseEvent(line, context)`, driven by line buffering in `spawn-runner.ts`. No changes to the wire shape.
