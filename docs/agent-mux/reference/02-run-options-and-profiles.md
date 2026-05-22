# RunOptions, Profiles, and Run Configuration

**Specification v1.0** | `@a5c-ai/agent-mux`

> **Note:** hermes-agent is included as a 10th supported agent per project requirements, extending the original scope's 9 agents.

---

## 1. Overview

This specification defines the complete parameter surface for invoking agents through agent-mux: the `RunOptions` interface, supporting types (`Attachment`, `RetryPolicy`, `McpServerConfig`), the profile system for storing and resolving named option presets, and the validation, capability-gating, and resolution rules that govern how options flow from source to subprocess.

All ten built-in agents are covered: claude, codex, gemini, copilot, cursor, opencode, pi, omp, openclaw, and hermes.

### 1.1 Cross-References

| Type / Concept | Spec | Section |
|---|---|---|
| `AgentName`, `BuiltInAgentName` | `01-core-types-and-client.md` | 1.4 |
| `AgentMuxClient`, `createClient()` | `01-core-types-and-client.md` | 5 |
| `RunHandle`, `RunResult` | `03-run-handle-and-interaction.md` | 1 |
| `AgentEvent` union type | `04-agent-events.md` | 4 |
| `AgentCapabilities`, `ModelCapabilities` | `04-capabilities-and-models.md` | 1 |
| `ConfigManager` | `08-config-and-auth.md` | 17 |
| `CapabilityError`, `ValidationError` | `01-core-types-and-client.md` | 3.2, 3.3 |
| `ErrorCode` | `01-core-types-and-client.md` | 3.1 |
| `GlobalConfig` | `01-core-types-and-client.md` | 4.1.2 |
| `RetryPolicy` | `01-core-types-and-client.md` | 5.1.1 |
| Storage layout | `01-core-types-and-client.md` | 4 |
| Adapter contract | `05-adapter-system.md` | 1 |
| CLI commands | `10-cli-reference.md` | 1 |

---

## 2. RunOptions Interface

`RunOptions` is the single configuration object passed to `mux.run()`. It controls every aspect of an agent invocation: which agent and model to use, how to prompt it, how to handle streaming, thinking, sessions, approval, execution context, retry behavior, and metadata.

```typescript
/**
 * Complete parameter set for a single agent invocation via `mux.run()`.
 *
 * Fields fall into three categories:
 * - **Universal**: supported by all agents (may be ignored by agents that lack the feature).
 * - **Capability-gated**: throw `CapabilityError` if the target agent/model does not support them.
 * - **Metadata-only**: stored in `run-index.jsonl` but never sent to the agent.
 */
interface RunOptions {
  // ── Required ─────────────────────────────────────────────────────────

  /**
   * The agent to invoke.
   *
   * Must be a registered agent name: one of the ten built-in agents or
   * a plugin adapter registered via `mux.adapters.register()`.
   *
   * @throws {AgentMuxError} code `AGENT_NOT_FOUND` if no adapter is registered for this name.
   * @throws {AgentMuxError} code `AGENT_NOT_INSTALLED` if the adapter exists but the CLI binary
   *         is not found on `$PATH`.
   */
  agent: AgentName;

  // ── Prompt / Input ───────────────────────────────────────────────────

  /**
   * The prompt to send to the agent.
   *
   * When a `string`, it is sent as a single user message.
   * When a `string[]`, elements are concatenated with `\n\n` as the separator
   * before being sent to the agent. This is a convenience for multi-paragraph
   * prompts; it does not create multiple turns.
   *
   * An empty string or empty array throws `ValidationError`.
   */
  prompt: string | string[];

  /**
   * System prompt injected into the agent's context.
   *
   * How the system prompt is injected depends on `systemPromptMode` and the
   * agent's native support. Agents that support a native `--system-prompt` flag
   * (claude, codex, gemini, opencode, hermes) use it directly. Others receive
   * the system prompt prepended to the user prompt.
   */
  systemPrompt?: string;

  /**
   * How `systemPrompt` is combined with the agent's existing system prompt.
   *
   * - `'prepend'` -- insert before the agent's default system prompt.
   * - `'append'` -- insert after the agent's default system prompt.
   * - `'replace'` -- fully replace the agent's default system prompt.
   *
   * Not all agents support all modes natively. When the agent does not support
   * the requested mode, the adapter approximates it:
   * - `'prepend'` and `'append'` are simulated by concatenation in the prompt.
   * - `'replace'` may not be possible for agents with hardcoded system prompts;
   *   in that case, `'prepend'` behavior is used as a fallback.
   *
   * @default 'prepend'
   */
  systemPromptMode?: 'prepend' | 'append' | 'replace';

  /**
   * File attachments included with the prompt.
   *
   * @capability Requires `supportsFileAttachments: true` or `supportsImageInput: true`
   *             on the agent's capabilities. Throws `CapabilityError` if the agent
   *             supports neither.
   *
   * See Section 3 for the `Attachment` type definition.
   */
  attachments?: Attachment[];

  // ── Model ────────────────────────────────────────────────────────────

  /**
   * Model ID to use for this run.
   *
   * Must be a model ID recognized by the target agent. Use `mux.models.validate()`
   * to check ahead of time. If not specified, the agent's default model is used.
   *
   * Resolution order:
   * 1. This field (per-call).
   * 2. Profile's `model` field (if `profile` is set).
   * 3. Project config's `defaultModel` (if it matches the target agent).
   * 4. Global config's `defaultModel` (if it matches the target agent).
   * 5. Adapter's `defaultModelId`.
   */
  model?: string;

  // ── Thinking / Reasoning ─────────────────────────────────────────────

  /**
   * Normalized thinking effort level.
   *
   * Translated by each adapter to the agent's native thinking parameters.
   * See Section 8 for per-adapter translation tables.
   *
   * @capability Requires the selected model to have `supportsThinking: true`.
   *             Throws `CapabilityError` if the model does not support thinking.
   */
  thinkingEffort?: 'low' | 'medium' | 'high' | 'max';

  /**
   * Thinking budget in tokens.
   *
   * For Claude Code, this maps directly to `budget_tokens`.
   * For other agents, it is translated to the closest native equivalent.
   * When both `thinkingEffort` and `thinkingBudgetTokens` are set,
   * `thinkingBudgetTokens` takes precedence.
   *
   * @capability Requires the selected model to have `supportsThinking: true`
   *             AND the agent to have `supportsThinkingBudgetTokens: true`.
   *             Throws `CapabilityError` if either is false.
   */
  thinkingBudgetTokens?: number; // Minimum 1024 derived from Claude's documented budget_tokens minimum.

  /**
   * Full escape hatch for thinking configuration.
   *
   * An arbitrary key-value map merged over the normalized thinking parameters
   * after adapter translation. This allows consumers to pass native,
   * agent-specific thinking parameters that the normalized interface does
   * not cover.
   *
   * Merged last, overriding both `thinkingEffort` and `thinkingBudgetTokens`.
   *
   * @capability Same gating as `thinkingEffort`.
   */
  thinkingOverride?: Record<string, unknown>;

  // ── Sampling ─────────────────────────────────────────────────────────

  /**
   * Sampling temperature.
   *
   * Controls randomness: 0.0 is deterministic, higher values increase
   * randomness. Not all agents expose temperature control via CLI.
   * When the agent does not support it, this field is silently ignored
   * (no error thrown).
   *
   * @valid [0.0, 2.0]
   * @throws {ValidationError} if outside the valid range.
   */
  temperature?: number;

  /**
   * Top-P (nucleus) sampling parameter.
   *
   * Limits token selection to the smallest set whose cumulative probability
   * exceeds this threshold. Silently ignored by agents that do not support it.
   *
   * @valid [0.0, 1.0]
   * @throws {ValidationError} if outside the valid range.
   */
  topP?: number;

  /**
   * Top-K sampling parameter.
   *
   * Limits token selection to the top K most probable tokens.
   * Silently ignored by agents that do not support it.
   *
   * @valid >= 1 (integer)
   * @throws {ValidationError} if less than 1 or not an integer.
   */
  topK?: number;

  /**
   * Maximum total tokens for the response.
   *
   * This is the maximum number of tokens the model may generate in its
   * response. Mapped to the agent's native `--max-tokens` or equivalent.
   * Silently ignored if the agent does not support it.
   *
   * @valid >= 1 (integer)
   * @throws {ValidationError} if less than 1.
   */
  maxTokens?: number;

  /**
   * Maximum output tokens.
   *
   * Alias for `maxTokens` with identical semantics. When both `maxTokens`
   * and `maxOutputTokens` are set, `maxOutputTokens` takes precedence.
   *
   * @valid >= 1 (integer)
   * @throws {ValidationError} if less than 1.
   */
  maxOutputTokens?: number;

  // ── Session ──────────────────────────────────────────────────────────

  /**
   * Resume an existing session by its native session ID.
   *
   * The agent must support session resumption (`canResume: true`).
   * If the session does not exist, the agent may create a new one or throw
   * an error, depending on its native behavior.
   *
   * @mutuallyExclusive Cannot be set together with `noSession`.
   *                    Cannot be set together with `forkSessionId`.
   * @capability Silently ignored (not an error) if the agent does not support sessions.
   */
  sessionId?: string;

  /**
   * Fork an existing session, creating a new branch from the specified
   * session's state.
   *
   * @mutuallyExclusive Cannot be set together with `sessionId`.
   *                    Cannot be set together with `noSession`.
   * @capability Requires `canFork: true`. Throws `CapabilityError` if false.
   */
  forkSessionId?: string;

  /**
   * Run without session persistence. The conversation is ephemeral and
   * not saved to disk.
   *
   * @mutuallyExclusive Cannot be set together with `sessionId`.
   *                    Cannot be set together with `forkSessionId`.
   * @default false
   */
  noSession?: boolean;

  // ── Streaming ────────────────────────────────────────────────────────

  /**
   * Streaming mode for this run.
   *
   * - `'auto'` -- stream text output if the adapter supports it; fall back
   *   to buffered for capabilities the adapter lacks. Emits `stream_fallback`
   *   events when fallback activates.
   * - `true` -- require text streaming. Throws `CapabilityError` if the
   *   adapter has `supportsTextStreaming: false`. Tool call and thinking
   *   streaming still fall back silently.
   * - `false` -- all output is buffered. A single `text_delta` with full
   *   accumulated text fires on completion, followed by `message_stop`.
   *
   * Consumers always receive the same event types regardless of mode.
   *
   * @default 'auto'
   */
  stream?: boolean | 'auto';

  // ── Output Format ────────────────────────────────────────────────────

  /**
   * Output format for the agent's response.
   *
   * - `'text'` -- plain text output (default).
   * - `'json'` -- request JSON-formatted output from the agent.
   * - `'jsonl'` -- request JSON Lines formatted output.
   *
   * @capability `'json'` requires `supportsJsonMode: true` on the agent.
   *             Throws `CapabilityError` if false.
   * @capability `'jsonl'` requires `supportsJsonMode: true` on the agent.
   *             Throws `CapabilityError` if false.
   */
  outputFormat?: 'text' | 'json' | 'jsonl';

  // ── Execution Context ────────────────────────────────────────────────

  /**
   * Working directory for the agent subprocess.
   *
   * Must be an absolute path. The directory must exist.
   *
   * @default process.cwd()
   * @throws {ValidationError} if the path is not absolute or the directory
   *         does not exist.
   */
  cwd?: string;

  /**
   * Additional environment variables passed to the agent subprocess.
   *
   * Merged with the current process environment. Keys in this map override
   * `process.env` values. Values must be strings; non-string values throw
   * `ValidationError`.
   */
  env?: Record<string, string>;

  /**
   * Maximum wall-clock time for the entire run, in milliseconds.
   *
   * When exceeded, the agent subprocess is terminated and a `timeout` event
   * with `kind: 'run'` is emitted. 0 means no timeout.
   *
   * @default 0
   * @valid >= 0 (integer)
   * @throws {ValidationError} if negative.
   */
  timeout?: number;

  /**
   * Maximum time between agent output events, in milliseconds.
   *
   * If the agent produces no output for this duration, the subprocess is
   * terminated and a `timeout` event with `kind: 'inactivity'` is emitted.
   * 0 means no inactivity timeout.
   *
   * @default 0
   * @valid >= 0 (integer)
   * @throws {ValidationError} if negative.
   */
  inactivityTimeout?: number;

  /**
   * Maximum number of agentic turns (tool-use loops) allowed.
   *
   * When the agent reaches this limit, it is instructed to stop (if
   * the agent supports turn limiting) or forcefully interrupted. A
   * `turn_limit` event is emitted.
   *
   * @valid >= 1 (integer)
   * @throws {ValidationError} if less than 1.
   */
  maxTurns?: number;

  // ── Approval / Interaction ───────────────────────────────────────────

  /**
   * How tool calls and file operations are approved.
   *
   * - `'yolo'` -- auto-approve all actions. Maps to the agent's equivalent
   *   of unrestricted mode (e.g., `--dangerously-skip-permissions` for Claude,
   *   `--full-auto` for Codex, `--yolo` for others).
   * - `'prompt'` -- emit `approval_request` events and wait for consumer
   *   response via `onApprovalRequest` or `RunHandle.approve()`/`deny()`.
   * - `'deny'` -- auto-deny all actions requiring approval. The agent can
   *   only perform read-only operations.
   *
   * @default 'prompt'
   */
  approvalMode?: 'yolo' | 'prompt' | 'deny';

  /**
   * Callback invoked when the agent requires free-form text input
   * (not a tool approval).
   *
   * If not provided and the agent requests input, a `input_required` event
   * is emitted on the `RunHandle`. If no handler is registered on the
   * `RunHandle` either, the run blocks until `RunHandle.send()` is called.
   *
   * This field is per-run and cannot be stored in a profile.
   */
  onInputRequired?: (event: InputRequiredEvent) => Promise<string>;

  /**
   * Callback invoked when the agent requests approval for an action.
   *
   * Interaction with `approvalMode` is asymmetric by design:
   *
   * - **`'deny'` mode**: `onApprovalRequest` is **never invoked**. All approval
   *   requests are auto-denied before the callback is consulted. `deny` mode
   *   overrides the callback entirely.
   * - **`'yolo'` mode**: `onApprovalRequest` **is invoked** for each request.
   *   This allows the callback to selectively approve or deny individual actions,
   *   effectively narrowing yolo to per-request approval. If no callback is set,
   *   all actions are auto-approved.
   * - **`'prompt'` mode**: `onApprovalRequest` **is invoked** for each request,
   *   replacing the default UI prompt. If no callback is set, an
   *   `approval_request` event is emitted on the `RunHandle` instead.
   *
   * This field is per-run and cannot be stored in a profile.
   */
  onApprovalRequest?: (event: ApprovalRequestEvent) => Promise<'approve' | 'deny'>;

  // ── Skills / Agent Docs ──────────────────────────────────────────────

  /**
   * Skills to load for this run.
   *
   * The meaning of "skill" is agent-specific: for Claude Code, these are
   * skill directories loaded via `--add-dir`; for hermes, these are skills
   * from `~/.hermes/skills/` or agentskills.io; for opencode, pi, and omp,
   * these are npm package names or file paths.
   *
   * @capability Requires `supportsSkills: true`. Throws `CapabilityError` if false.
   */
  skills?: string[];

  /**
   * Path to an agents.md or equivalent agent documentation file.
   *
   * Loaded by agents that support custom agent documentation
   * (Claude Code's `CLAUDE.md` pattern, hermes skill definitions).
   *
   * @capability Requires `supportsAgentsMd: true`. Throws `CapabilityError` if false.
   */
  agentsDoc?: string;

  // ── MCP ──────────────────────────────────────────────────────────────

  /**
   * MCP server configurations to connect for this run.
   *
   * Each entry defines a server the agent should connect to for additional
   * tool capabilities. See Section 4 for the `McpServerConfig` type.
   *
   * @capability Requires `supportsMCP: true`. Throws `CapabilityError` if false.
   */
  mcpServers?: McpServerConfig[];

  // ── Retry ────────────────────────────────────────────────────────────

  /**
   * Retry policy for transient failures during this run.
   *
   * Overrides the client-level and config-level retry policies.
   * See Section 5 for the `RetryPolicy` type definition.
   */
  retryPolicy?: RetryPolicy;

  // ── Metadata ─────────────────────────────────────────────────────────

  /**
   * Custom run ID.
   *
   * If not provided, a ULID is generated automatically. Must be a valid
   * ULID string if provided.
   *
   * Stored in `run-index.jsonl`. Not sent to the agent.
   */
  runId?: string;

  /**
   * Tags for categorizing and filtering runs.
   *
   * Stored in `run-index.jsonl`. Not sent to the agent.
   * Used by `amux sessions search --tag` and `amux cost report --tag`.
   */
  tags?: string[];

  /**
   * Project identifier for cost roll-ups and session grouping.
   *
   * Stored in `run-index.jsonl`. Not sent to the agent.
   */
  projectId?: string;

  // ── Profile ──────────────────────────────────────────────────────────

  /**
   * Name of a saved profile to apply as the base for this run.
   *
   * Profile values are merged beneath per-call values: any field explicitly
   * set in the `RunOptions` object takes precedence over the profile.
   *
   * @throws {AgentMuxError} code `PROFILE_NOT_FOUND` if the named profile
   *         does not exist in either global or project profile directories.
   */
  profile?: string;
}
```

### 2.1 RunOptions Field Reference

The following table lists every field with its type, requirement status, default value, valid range, and which agents support it. Fields marked "All" are universal. Fields marked with specific agents are capability-gated.

| Field | Type | Required | Default | Valid Range | Agents | Category |
|---|---|---|---|---|---|---|
| `agent` | `AgentName` | Yes | -- | Registered agent name | All | Required |
| `prompt` | `string \| string[]` | Yes | -- | Non-empty | All | Prompt |
| `systemPrompt` | `string` | No | `undefined` | Any string | All | Prompt |
| `systemPromptMode` | `'prepend' \| 'append' \| 'replace'` | No | `'prepend'` | One of three literals | All | Prompt |
| `attachments` | `Attachment[]` | No | `undefined` | See Section 3 | claude, codex, gemini, cursor, opencode, openclaw | Prompt |
| `model` | `string` | No | Adapter default | Agent-specific model ID | All | Model |
| `thinkingEffort` | `'low' \| 'medium' \| 'high' \| 'max'` | No | `undefined` | One of four literals | claude, codex, gemini, omp + model-dep: cursor, opencode, pi, openclaw | Thinking |
| `thinkingBudgetTokens` | `number` | No | `undefined` | `>= 1024`, `<= model.maxThinkingTokens` | claude, codex, gemini | Thinking |
| `thinkingOverride` | `Record<string, unknown>` | No | `undefined` | Any key-value map | claude, codex, gemini, pi, omp | Thinking |
| `temperature` | `number` | No | `undefined` | `[0.0, 2.0]` | All (silently ignored if unsupported) | Sampling |
| `topP` | `number` | No | `undefined` | `[0.0, 1.0]` | All (silently ignored if unsupported) | Sampling |
| `topK` | `number` | No | `undefined` | `>= 1` (integer) | All (silently ignored if unsupported) | Sampling |
| `maxTokens` | `number` | No | `undefined` | `>= 1` (integer) | All (silently ignored if unsupported) | Sampling |
| `maxOutputTokens` | `number` | No | `undefined` | `>= 1` (integer) | All (silently ignored if unsupported) | Sampling |
| `sessionId` | `string` | No | `undefined` | Non-empty string | claude, codex, gemini, copilot, cursor, opencode, pi, omp, openclaw, hermes | Session |
| `forkSessionId` | `string` | No | `undefined` | Non-empty string | claude, opencode, pi, omp | Session |
| `noSession` | `boolean` | No | `false` | `true \| false` | All | Session |
| `stream` | `boolean \| 'auto'` | No | `'auto'` | `true`, `false`, `'auto'` | All | Streaming |
| `outputFormat` | `'text' \| 'json' \| 'jsonl'` | No | `'text'` | One of three literals | claude, codex, gemini, opencode | Output |
| `cwd` | `string` | No | `process.cwd()` | Absolute path to existing dir | All | Execution |
| `env` | `Record<string, string>` | No | `undefined` | String keys and values | All | Execution |
| `timeout` | `number` | No | `0` | `>= 0` (integer, ms) | All | Execution |
| `inactivityTimeout` | `number` | No | `0` | `>= 0` (integer, ms) | All | Execution |
| `maxTurns` | `number` | No | `undefined` | `>= 1` (integer) | claude, codex, gemini, opencode, pi, omp, hermes | Execution |
| `approvalMode` | `'yolo' \| 'prompt' \| 'deny'` | No | `'prompt'` | One of three literals | All | Approval |
| `onInputRequired` | `(event) => Promise<string>` | No | `undefined` | Function | All | Approval |
| `onApprovalRequest` | `(event) => Promise<'approve' \| 'deny'>` | No | `undefined` | Function | All | Approval |
| `skills` | `string[]` | No | `undefined` | Array of strings | claude, opencode, pi, omp, openclaw, hermes | Skills |
| `agentsDoc` | `string` | No | `undefined` | File path | claude, hermes | Skills |
| `mcpServers` | `McpServerConfig[]` | No | `undefined` | See Section 4 | claude, codex, gemini, cursor, opencode, openclaw, hermes | MCP |
| `retryPolicy` | `RetryPolicy` | No | `undefined` | See Section 5 | All | Retry |
| `runId` | `string` | No | Auto-generated ULID | Valid ULID string | All (metadata only) | Metadata |
| `tags` | `string[]` | No | `undefined` | Array of strings | All (metadata only) | Metadata |
| `projectId` | `string` | No | `undefined` | Any string | All (metadata only) | Metadata |
| `profile` | `string` | No | `undefined` | Profile name matching `^[a-zA-Z0-9_-]{1,64}$` | All | Profile |
| `collectEvents` | `boolean` | No | `false` | `true \| false` | All | Streaming |
| `gracePeriodMs` | `number` | No | `5000` | `>= 0` (integer, ms) | All | Execution |

> **Spec extensions:** `collectEvents` and `gracePeriodMs` are defined by `03-run-handle-and-interaction.md` (§1.2 and §6.2 respectively). `collectEvents` enables populating `RunResult.events` with all emitted events. `gracePeriodMs` configures the delay between `SIGTERM` and `SIGKILL` during two-phase shutdown.

---

## 3. Attachment Type

The `Attachment` type represents a file or image attached to a prompt. Attachments are sent to agents that support file or image input.

```typescript
/**
 * A file or image attachment included with a prompt.
 *
 * Exactly one of `filePath`, `url`, or `base64` must be provided.
 * Providing zero or more than one throws `ValidationError`.
 */
interface Attachment {
  /**
   * Absolute path to a local file.
   *
   * The file must exist and be readable. The adapter translates this to
   * the agent's native attachment mechanism (e.g., Claude Code's file
   * references, Gemini's `--file` flag).
   */
  filePath?: string;

  /**
   * URL to a remote resource.
   *
   * Support is agent-dependent. Agents that do not support URL attachments
   * will download the resource to a temp file and attach that instead.
   */
  url?: string;

  /**
   * Base64-encoded file content.
   *
   * Used for in-memory attachments that do not exist on disk.
   * Must be accompanied by `mimeType`.
   */
  base64?: string;

  /**
   * MIME type of the attachment.
   *
   * Required when `base64` is provided. Optional for `filePath` (inferred
   * from file extension) and `url` (inferred from Content-Type header).
   *
   * Common values: `'image/png'`, `'image/jpeg'`, `'image/gif'`,
   * `'image/webp'`, `'application/pdf'`, `'text/plain'`,
   * `'application/json'`.
   */
  mimeType?: string;

  /**
   * Display name for the attachment.
   *
   * Used in logging and events. If not provided, derived from `filePath`
   * basename, `url` last path segment, or `'attachment'` for `base64`.
   */
  name?: string;
}
```

### 3.1 Attachment Field Reference

| Field | Type | Required | Default | Valid Range | Description |
|---|---|---|---|---|---|
| `filePath` | `string` | Conditional | `undefined` | Absolute path to existing file | Local file attachment. |
| `url` | `string` | Conditional | `undefined` | Valid HTTP(S) URL | Remote resource attachment. |
| `base64` | `string` | Conditional | `undefined` | Valid base64 string | Inline content attachment. |
| `mimeType` | `string` | Conditional | Inferred | Valid MIME type string | Content type. Required with `base64`. |
| `name` | `string` | No | Derived | Any string | Display name. |

### 3.2 Attachment Support by Agent

| Agent | File Input | Image Input | URL Input | Base64 Input | Supported MIME Types |
|---|---|---|---|---|---|
| claude | Yes | Yes | No | Yes | Images: png, jpeg, gif, webp. Files: text/*, application/json, application/pdf |
| codex | No | No | No | No | -- |
| gemini | Yes | Yes | Yes | Yes | Images: png, jpeg, gif, webp. Files: text/*, application/json, application/pdf, audio/*, video/* |
| copilot | No | No | No | No | -- |
| cursor | No | Yes | No | No | Images: png, jpeg |
| opencode | Yes | Yes | No | Yes | Images: png, jpeg, gif, webp. Files: text/* |
| pi | No | No | No | No | -- |
| omp | No | No | No | No | -- |
| openclaw | No | No | No | No | -- |
| hermes | No | No | No | No | -- |

### 3.3 Attachment Validation Rules

1. Exactly one of `filePath`, `url`, or `base64` must be non-`undefined`. Zero or multiple sources throws `ValidationError` with field `'attachments[N]'` and message `"Exactly one of filePath, url, or base64 must be provided"`.
2. When `base64` is provided, `mimeType` is required. Omitting it throws `ValidationError`.
3. When `filePath` is provided, the path must be absolute. Relative paths throw `ValidationError`.
4. When `filePath` is provided, the file must exist and be readable. Missing files throw `ValidationError`.
5. Passing `attachments` to an agent where both `supportsFileAttachments` and `supportsImageInput` are `false` throws `CapabilityError` with capability `"attachments"`.
6. Passing an image attachment (MIME type `image/*`) to an agent where `supportsImageInput` is `false` throws `CapabilityError` with capability `"imageInput"`.
7. Passing a non-image attachment to an agent where `supportsFileAttachments` is `false` throws `CapabilityError` with capability `"fileAttachments"`.

---

## 4. McpServerConfig Type

MCP (Model Context Protocol) server configurations allow agents to connect to external tool servers. This type is used in `RunOptions.mcpServers` and in profile data.

```typescript
/**
 * Configuration for a single MCP server connection.
 *
 * The agent connects to this server during the run, making the server's
 * tools available to the agent. The agent must have `supportsMCP: true`.
 */
interface McpServerConfig {
  /**
   * Unique name for this MCP server within the run.
   *
   * Used as a namespace for tools (e.g., `mcp__<name>__<toolName>`)
   * and in MCP-related events.
   */
  name: string;

  /**
   * Transport type for connecting to the server.
   *
   * - `'stdio'` -- spawn the server as a subprocess and communicate
   *   via stdin/stdout.
   * - `'sse'` -- connect to a running server via Server-Sent Events
   *   over HTTP.
   * - `'streamable-http'` -- connect via the Streamable HTTP transport.
   */
  transport: 'stdio' | 'sse' | 'streamable-http';

  /**
   * Command to spawn the MCP server (stdio transport only).
   *
   * Required when `transport` is `'stdio'`. Ignored otherwise.
   */
  command?: string;

  /**
   * Arguments for the spawn command (stdio transport only).
   */
  args?: string[];

  /**
   * Environment variables for the spawned server process (stdio transport only).
   */
  env?: Record<string, string>;

  /**
   * URL of the MCP server (sse and streamable-http transports only).
   *
   * Required when `transport` is `'sse'` or `'streamable-http'`.
   */
  url?: string;

  /**
   * HTTP headers to include when connecting (sse and streamable-http transports only).
   */
  headers?: Record<string, string>;
}
```

### 4.1 McpServerConfig Field Reference

| Field | Type | Required | Default | Valid Range | Description |
|---|---|---|---|---|---|
| `name` | `string` | Yes | -- | Non-empty, matches `^[a-zA-Z0-9_-]+$` | Server identifier. |
| `transport` | `'stdio' \| 'sse' \| 'streamable-http'` | Yes | -- | One of three literals | Connection transport. |
| `command` | `string` | Conditional | `undefined` | Non-empty string | Spawn command. Required for `stdio`. |
| `args` | `string[]` | No | `[]` | Array of strings | Command arguments. `stdio` only. |
| `env` | `Record<string, string>` | No | `undefined` | String keys and values | Server environment. `stdio` only. |
| `url` | `string` | Conditional | `undefined` | Valid URL | Server URL. Required for `sse`/`streamable-http`. |
| `headers` | `Record<string, string>` | No | `undefined` | String keys and values | HTTP headers. `sse`/`streamable-http` only. |

### 4.2 MCP Support by Agent

| Agent | supportsMCP | Native Flag / Config | Notes |
|---|---|---|---|
| claude | Yes | `--mcp-config`, settings.json `mcpServers` | Full MCP client support |
| codex | Yes | Config-based MCP | MCP client support |
| gemini | Yes | Config-based MCP | MCP client support |
| copilot | No | -- | No MCP support |
| cursor | Yes | settings.json `mcpServers` | MCP client support |
| opencode | Yes | `opencode.json` MCP config | MCP client support |
| pi | No | -- | No MCP support |
| omp | No | -- | No MCP support |
| openclaw | Yes | Config-based MCP | MCP client support |
| hermes | Yes | Config-based MCP, `mcp_serve.py` | MCP client and server (via `hermes-acp`) |

---

## 5. RetryPolicy Type

The `RetryPolicy` type controls automatic retry behavior for transient failures. It can be set at three levels: client defaults (via `createClient()`), global/project config, and per-run (via `RunOptions.retryPolicy`). Per-run takes precedence.

```typescript
/**
 * Configuration for automatic retry on transient failures.
 *
 * Uses exponential backoff with optional jitter:
 *   delay = min(baseDelayMs * 2^(attempt-1), maxDelayMs) * (1 + random(0, jitterFactor))
 */
interface RetryPolicy {
  /**
   * Maximum number of retry attempts.
   *
   * The total number of invocations is `maxAttempts + 1` (initial + retries).
   * Setting to 0 disables retries.
   *
   * @default 3
   */
  maxAttempts: number;

  /**
   * Base delay between retries in milliseconds.
   *
   * The actual delay uses exponential backoff: `baseDelayMs * 2^(attempt-1)`,
   * capped by `maxDelayMs`.
   *
   * @default 1000
   */
  baseDelayMs: number;

  /**
   * Maximum delay between retries in milliseconds.
   *
   * Caps the exponential backoff to prevent excessively long waits.
   *
   * @default 30000
   */
  maxDelayMs: number;

  /**
   * Jitter factor applied to the computed delay.
   *
   * 0.0 means no jitter (deterministic delays).
   * 1.0 means up to 100% random jitter is added to the delay.
   * Jitter helps prevent thundering-herd effects when multiple clients
   * retry simultaneously.
   *
   * @default 0.1
   */
  jitterFactor: number;

  /**
   * Which error codes are eligible for automatic retry.
   *
   * Only runs that fail with one of these error codes are retried.
   * All other errors propagate immediately.
   *
   * @default ['RATE_LIMITED', 'AGENT_CRASH', 'TIMEOUT']
   */
  retryOn: ErrorCode[];
}
```

### 5.1 RetryPolicy Field Reference

| Field | Type | Required | Default | Valid Range | Description |
|---|---|---|---|---|---|
| `maxAttempts` | `number` | No | `3` | `>= 1` (integer) | Maximum retry attempts. |
| `baseDelayMs` | `number` | No | `1000` | `>= 0` (integer, ms) | Base delay for exponential backoff. |
| `maxDelayMs` | `number` | No | `30000` | `>= baseDelayMs` (integer, ms) | Maximum delay cap. |
| `jitterFactor` | `number` | No | `0.1` | `[0.0, 1.0]` | Random jitter factor. |
| `retryOn` | `ErrorCode[]` | No | `['RATE_LIMITED', 'AGENT_CRASH', 'TIMEOUT']` | Array of valid `ErrorCode` values | Retryable error codes. |

### 5.2 RetryPolicy Validation Rules

1. `maxDelayMs` must be `>= baseDelayMs`. Setting `maxDelayMs < baseDelayMs` throws `ValidationError`.
2. `jitterFactor` outside `[0.0, 1.0]` throws `ValidationError`.
3. `retryOn` values must be valid `ErrorCode` strings. Unknown error codes throw `ValidationError`.
4. When a `retry` event is emitted, it includes `attempt`, `maxAttempts`, `reason`, and `delayMs` fields for consumer observability.

### 5.3 Retry Behavior

When a run fails with an error code listed in `retryOn`:

1. agent-mux emits a `retry` event on the `RunHandle`.
2. The computed delay is applied: `min(baseDelayMs * 2^(attempt-1), maxDelayMs) * (1 + random(0, jitterFactor))`.
3. A new subprocess is spawned with identical `RunOptions`.
4. The new subprocess's events are emitted on the same `RunHandle` (the consumer sees a continuous event stream).
5. If all retry attempts are exhausted, the final error propagates to the `RunResult`.

---

## 6. Mutual Exclusivity Constraints

Certain `RunOptions` fields cannot be set simultaneously. Setting mutually exclusive fields throws `ValidationError` before the agent is spawned.

### 6.1 Session Constraints

| Fields | Rule | Error Message |
|---|---|---|
| `sessionId` + `noSession` | Cannot set both | `"sessionId and noSession are mutually exclusive"` |
| `sessionId` + `forkSessionId` | Cannot set both | `"sessionId and forkSessionId are mutually exclusive"` |
| `forkSessionId` + `noSession` | Cannot set both | `"forkSessionId and noSession are mutually exclusive"` |

These three constraints mean that at most one of `sessionId`, `forkSessionId`, or `noSession: true` may be specified per run.

### 6.2 Token Constraints

| Fields | Rule | Error Message |
|---|---|---|
| `maxTokens` + `maxOutputTokens` | Both can be set, but `maxOutputTokens` wins | No error; `maxOutputTokens` takes precedence. |
| `thinkingEffort` + `thinkingBudgetTokens` | Both can be set, but `thinkingBudgetTokens` wins | No error; `thinkingBudgetTokens` takes precedence. |

### 6.3 Approval Constraints

| Fields | Rule | Error Message |
|---|---|---|
| `approvalMode: 'yolo'` + `onApprovalRequest` | Allowed | No error. The callback **is invoked** for each request, enabling selective per-request approval even in yolo mode. |
| `approvalMode: 'prompt'` + `onApprovalRequest` | Allowed | No error. The callback **is invoked** and replaces the default UI prompt. |
| `approvalMode: 'deny'` + `onApprovalRequest` | Allowed | No error. The callback is **never invoked**; deny mode overrides the callback and auto-denies all requests. |

### 6.4 Validation Order

Mutual exclusivity checks are performed in this order, and validation stops at the first failure:

1. Session mutual exclusivity (`sessionId`, `forkSessionId`, `noSession`).
2. Required field validation (`agent`, `prompt`).
3. Range validation (temperature, topP, topK, maxTokens, etc.).
4. Capability gating (thinkingEffort, stream, mcpServers, skills, etc.).
5. Type coercion and normalization.

---

## 7. Capability Gating

Capability gating prevents consumers from requesting features that the target agent or model does not support. Gated fields are checked after option resolution (profile merge, config defaults) but before subprocess spawning.

### 7.1 Capability Gating Matrix

The following table shows which `RunOptions` fields are capability-gated, the capability they require, and the `CapabilityError` thrown when the requirement is not met.

| RunOptions Field | Required Capability | Capability Level | Error Capability String |
|---|---|---|---|
| `thinkingEffort` | `model.supportsThinking: true` | Model | `"thinking"` |
| `thinkingBudgetTokens` | `model.supportsThinking: true` AND `agent.supportsThinkingBudgetTokens: true` | Both | `"thinkingBudgetTokens"` |
| `thinkingOverride` | `model.supportsThinking: true` | Model | `"thinking"` |
| `stream: true` | `agent.supportsTextStreaming: true` | Agent | `"textStreaming"` |
| `outputFormat: 'json'` | `agent.supportsJsonMode: true` | Agent | `"jsonMode"` |
| `outputFormat: 'jsonl'` | `agent.supportsJsonMode: true` | Agent | `"jsonMode"` |
| `mcpServers` (non-empty) | `agent.supportsMCP: true` | Agent | `"mcp"` |
| `skills` (non-empty) | `agent.supportsSkills: true` | Agent | `"skills"` |
| `agentsDoc` | `agent.supportsAgentsMd: true` | Agent | `"agentsMd"` |
| `attachments` (non-empty) | `agent.supportsFileAttachments: true` OR `agent.supportsImageInput: true` | Agent | `"attachments"` |
| `forkSessionId` | `agent.canFork: true` | Agent | `"sessionFork"` |
| `sessionId` | `agent.canResume: true` | Agent | `"sessionResume"` |

### 7.2 Capability Support by Agent

| Capability | claude | codex | gemini | copilot | cursor | opencode | pi | omp | openclaw | hermes |
|---|---|---|---|---|---|---|---|---|---|---|
| `supportsThinking` | Yes | Yes | Yes | No | Model-dep | Model-dep | Model-dep | Yes | Model-dep | No |
| `supportsThinkingBudgetTokens` | Yes | No | Yes | No | No | No | No | No | No | No |
| `supportsTextStreaming` | Yes | Yes | Yes | Yes | Partial | Yes | Yes | Yes | Partial | Yes |
| `supportsJsonMode` | Yes | Yes | No | No | No | Yes | No | No | Yes | No |
| `supportsMCP` | Yes | Yes | Yes | No | Yes | Yes | No | No | Yes | Yes |
| `supportsSkills` | Yes | No | No | No | No | Yes | Yes | Yes | Yes | Yes |
| `supportsAgentsMd` | Yes | No | No | No | No | No | No | No | Yes | No |
| `supportsFileAttachments` | Yes | No | Yes | No | No | Yes | No | No | Yes | No |
| `supportsImageInput` | Yes | Yes | Yes | No | Yes | Yes | No | No | Yes | No |
| `canFork` | Yes | No | No | No | No | Yes | Yes | Yes | No | No |
| `canResume` | Yes | No | No | No | No | Yes | Yes | Yes | No | Yes |

> **Cross-reference:** All values in this table are derived from `06-capabilities-and-models.md` §12 (authoritative capability profiles). Spec 06 is the source of truth for any discrepancies.

### 7.3 Non-Gated Fields (Silently Ignored)

The following fields are not capability-gated. If the agent does not support them, they are silently ignored without throwing an error:

- `temperature`, `topP`, `topK` -- sampling parameters not supported by all agent CLIs.
- `maxTokens`, `maxOutputTokens` -- not all agents expose token limits via CLI.
- `systemPrompt`, `systemPromptMode` -- approximated by prompt concatenation when native support is missing.
- `maxTurns` -- agent may not support turn limiting natively; the adapter enforces it by counting `turn_end` events and interrupting.

---

## 8. Thinking Effort Translation Tables

Each adapter translates the normalized `thinkingEffort` levels to the agent's native thinking parameters. The `thinkingBudgetTokens` field provides a direct numeric override that bypasses these translations.

### 8.1 Claude Code

| Effort Level | Native Parameter | Value |
|---|---|---|
| `'low'` | `--thinking-budget` | `1024` |
| `'medium'` | `--thinking-budget` | `8192` |
| `'high'` | `--thinking-budget` | `32768` |
| `'max'` | `--thinking-budget` | Model's `maxThinkingTokens` (e.g., `131072` for Claude Opus) |

When `thinkingBudgetTokens` is set, it is passed directly as `--thinking-budget <value>`.

### 8.2 Codex CLI

| Effort Level | Native Parameter | Value |
|---|---|---|
| `'low'` | `--thinking-effort` | `'low'` |
| `'medium'` | `--thinking-effort` | `'medium'` |
| `'high'` | `--thinking-effort` | `'high'` |
| `'max'` | `--thinking-effort` | `'high'` (capped; Codex does not have a `'max'` level) |

### 8.3 Gemini CLI

| Effort Level | Native Parameter | Value |
|---|---|---|
| `'low'` | `thinkingConfig.thinkingBudget` | `1024` |
| `'medium'` | `thinkingConfig.thinkingBudget` | `8192` |
| `'high'` | `thinkingConfig.thinkingBudget` | `32768` |
| `'max'` | `thinkingConfig.thinkingBudget` | Model's maximum thinking budget |

### 8.4 Copilot CLI

Copilot CLI does not support thinking/reasoning. Setting `thinkingEffort` throws `CapabilityError`.

### 8.5 Cursor

Thinking support is model-dependent. When the selected model supports thinking:

| Effort Level | Native Parameter | Value |
|---|---|---|
| `'low'` | `--thinking` | `'concise'` |
| `'medium'` | `--thinking` | `'normal'` |
| `'high'` | `--thinking` | `'verbose'` |
| `'max'` | `--thinking` | `'verbose'` (capped) |

### 8.6 OpenCode

Thinking support is model-dependent. When the selected model supports thinking:

| Effort Level | Native Parameter | Value |
|---|---|---|
| `'low'` | Provider-level param | Low effort equivalent |
| `'medium'` | Provider-level param | Medium effort equivalent |
| `'high'` | Provider-level param | High effort equivalent |
| `'max'` | Provider-level param | Maximum effort equivalent |

Translation depends on the configured provider (Anthropic, OpenAI, etc.) and is handled by the adapter.

### 8.7 Pi

Thinking support is model-dependent. Translation is passed as a provider-level parameter determined by the model's provider (Anthropic, OpenAI, Google, etc.).

| Effort Level | Native Mapping |
|---|---|
| `'low'` | Provider-specific low |
| `'medium'` | Provider-specific medium |
| `'high'` | Provider-specific high |
| `'max'` | Provider-specific max |

### 8.8 omp (oh-my-pi)

| Effort Level | Native Parameter | Value |
|---|---|---|
| `'low'` | `budget_tokens` | `1024` |
| `'medium'` | `budget_tokens` | `8192` |
| `'high'` | `budget_tokens` | `32768` |
| `'max'` | `budget_tokens` | `max_budget_tokens` |

omp unconditionally supports all thinking effort levels regardless of model. The `budget_tokens` parameter is passed directly to the provider. When `thinkingBudgetTokens` is set, it is passed directly as `budget_tokens`.

### 8.9 OpenClaw

Thinking support is model-dependent. When the selected model supports thinking, the effort level is passed through the model's provider configuration.

| Effort Level | Native Mapping |
|---|---|
| `'low'` | Provider-specific low |
| `'medium'` | Provider-specific medium |
| `'high'` | Provider-specific high |
| `'max'` | Provider-specific max |

### 8.10 Hermes

Hermes does not expose an explicit extended-thinking/reasoning mode. Setting `thinkingEffort` throws `CapabilityError`. Hermes focuses on skill creation and procedural learning rather than chain-of-thought reasoning controls.

### 8.11 thinkingOverride Merge Behavior

When `thinkingOverride` is set alongside `thinkingEffort` or `thinkingBudgetTokens`:

1. The adapter first translates `thinkingEffort` (or `thinkingBudgetTokens`) to native parameters.
2. The `thinkingOverride` map is shallow-merged over the translated parameters.
3. Keys in `thinkingOverride` replace keys from the translation; keys not in `thinkingOverride` are preserved.

This gives consumers full escape-hatch control over the native thinking configuration.

---

## 9. Approval Mode Translation

Each adapter maps the normalized `approvalMode` values to the agent's native approval flags.

| Agent | `'yolo'` | `'prompt'` | `'deny'` |
|---|---|---|---|
| claude | `--dangerously-skip-permissions` | (default behavior) | `--permission-mode deny` |
| codex | `--approval-mode full-auto` | `--approval-mode suggest` | `--approval-mode deny` |
| gemini | `--sandbox none` | (default behavior) | `--sandbox strict` |
| copilot | (not supported; silently uses default) | (default behavior) | (not supported; silently uses default) |
| cursor | `--yolo` | (default behavior) | `--read-only` |
| opencode | `--auto-approve` | (default behavior) | `--deny-all` |
| pi | `--yolo` | (default behavior) | `--deny` |
| omp | `--yolo` | (default behavior) | `--deny` |
| openclaw | `--auto-approve` | (default behavior) | `--read-only` |
| hermes | Command allowlist config | Command approval prompt (default) | Deny-all via config |

### 9.1 Approval Mode Capability

| Agent | Supported Modes |
|---|---|
| claude | `'yolo'`, `'prompt'`, `'deny'` |
| codex | `'yolo'`, `'prompt'`, `'deny'` |
| gemini | `'yolo'`, `'prompt'`, `'deny'` |
| copilot | `'prompt'` only |
| cursor | `'yolo'`, `'prompt'`, `'deny'` |
| opencode | `'yolo'`, `'prompt'`, `'deny'` |
| pi | `'yolo'`, `'prompt'`, `'deny'` |
| omp | `'yolo'`, `'prompt'`, `'deny'` |
| openclaw | `'yolo'`, `'prompt'`, `'deny'` |
| hermes | `'yolo'`, `'prompt'`, `'deny'` |

When an unsupported approval mode is requested for copilot, the adapter silently falls back to `'prompt'` and emits a `debug` event noting the fallback.

---

## 10. ProfileManager API

The `ProfileManager` provides CRUD operations for named `RunOptions` presets. Accessed via `mux.profiles` or `mux.config.profiles()`.

```typescript
/**
 * Manages named RunOptions presets (profiles).
 *
 * Profiles are stored as JSON files in `~/.agent-mux/profiles/` (global)
 * and `.agent-mux/profiles/` (project-local). Project profiles override
 * global profiles of the same name via deep merge.
 */
interface ProfileManager {
  /**
   * List all available profiles.
   *
   * Returns profiles from both global and project directories, merged
   * by name. When a profile exists in both directories, the returned
   * entry reflects the merged result with `scope: 'project'`.
   *
   * @param options - Optional filter criteria.
   * @returns Array of profile metadata entries, sorted by name.
   */
  list(options?: ProfileListOptions): Promise<ProfileEntry[]>;

  /**
   * Show the resolved contents of a named profile.
   *
   * If the profile exists in both global and project directories, the
   * returned data is the deep-merged result (project overrides global).
   *
   * @param name - Profile name. Must match `^[a-zA-Z0-9_-]{1,64}$`.
   * @returns The resolved profile data.
   * @throws {AgentMuxError} code `PROFILE_NOT_FOUND` if no profile with
   *         this name exists in either directory.
   */
  show(name: string): Promise<ResolvedProfile>;

  /**
   * Create or update a named profile.
   *
   * Writes the profile to the specified scope directory. If a profile
   * with this name already exists in the target scope, it is overwritten
   * entirely (not merged).
   *
   * @param name - Profile name. Must match `^[a-zA-Z0-9_-]{1,64}$`.
   * @param data - Profile data to write. Validated against `ProfileData` schema.
   * @param options - Write options including target scope.
   * @throws {ValidationError} if `name` does not match the naming pattern.
   * @throws {ValidationError} if `data` contains invalid field values.
   * @throws {ValidationError} if `data` contains prohibited per-run fields
   *         (see Section 10.2).
   */
  set(name: string, data: ProfileData, options?: ProfileSetOptions): Promise<void>;

  /**
   * Delete a named profile.
   *
   * Deletes the profile file from the specified scope. If `scope` is not
   * specified, the method uses scope-preference logic: it checks project scope
   * first and, if the profile is found there, deletes it from project scope and
   * returns. If not found in project scope, it falls back to global scope.
   * Only one scope is modified per call — the method never deletes from both
   * scopes in a single invocation.
   *
   * @param name - Profile name.
   * @param options - Delete options including target scope.
   * @throws {AgentMuxError} code `PROFILE_NOT_FOUND` if the profile does
   *         not exist in the target scope (or in either scope when scope is
   *         unspecified).
   */
  delete(name: string, options?: ProfileDeleteOptions): Promise<void>;

  /**
   * Apply a profile to a partial `RunOptions` object, returning the
   * merged result.
   *
   * This is the programmatic equivalent of setting `profile` in `RunOptions`.
   * Fields present in `overrides` take precedence over the profile.
   *
   * @param name - Profile name to apply.
   * @param overrides - Per-call `RunOptions` fields that override the profile.
   * @returns Merged `RunOptions` with profile as base and overrides on top.
   * @throws {AgentMuxError} code `PROFILE_NOT_FOUND` if the profile does
   *         not exist.
   */
  apply(name: string, overrides?: Partial<RunOptions>): Promise<Partial<RunOptions>>;
}
```

### 10.1 Supporting Types

```typescript
/**
 * Options for filtering profile listings.
 */
interface ProfileListOptions {
  /**
   * Filter by scope.
   * - `'global'` -- only profiles from `~/.agent-mux/profiles/`.
   * - `'project'` -- only profiles from `.agent-mux/profiles/`.
   * - `undefined` -- profiles from both directories (default).
   */
  scope?: 'global' | 'project';
}

/**
 * Metadata for a single profile entry in a listing.
 */
interface ProfileEntry {
  /** Profile name (filename without `.json` extension). */
  name: string;

  /** Where this profile is stored. `'project'` if present in both. */
  scope: 'global' | 'project';

  /** Whether a global profile is also present (only relevant for project scope). */
  hasGlobalOverride: boolean;

  /** The agent specified in this profile, if any. */
  agent?: AgentName;

  /** The model specified in this profile, if any. */
  model?: string;

  /**
   * `true` if the profile file exists on disk but could not be parsed.
   *
   * When `true`, `agent` and `model` will be `undefined` (the file content
   * could not be read). `ProfileManager.list()` includes corrupt entries so
   * consumers can detect and report them without throwing.
   */
  corrupt?: boolean;
}

/**
 * A resolved profile: the merged result of global + project data.
 */
interface ResolvedProfile {
  /** Profile name. */
  name: string;

  /** The resolved profile data after merging global and project layers. */
  data: ProfileData;

  /** Source scope of the resolved profile. */
  scope: 'global' | 'project';

  /** Absolute path to the global profile file, if it exists. */
  globalPath?: string;

  /** Absolute path to the project profile file, if it exists. */
  projectPath?: string;
}

/**
 * Options for writing a profile.
 */
interface ProfileSetOptions {
  /**
   * Target scope for the profile file.
   * @default 'project' (if a project directory exists, else 'global')
   */
  scope?: 'global' | 'project';
}

/**
 * Options for deleting a profile.
 */
interface ProfileDeleteOptions {
  /**
   * Target scope to delete from.
   *
   * - `'project'` -- delete only from `.agent-mux/profiles/`.
   * - `'global'` -- delete only from `~/.agent-mux/profiles/`.
   * - `undefined` (default) -- prefer project scope: delete from project scope
   *   if the profile exists there; otherwise delete from global scope. Only one
   *   scope is affected per call.
   */
  scope?: 'global' | 'project';
}
```

### 10.2 ProfileData Type

`ProfileData` is a strict subset of `RunOptions`. Certain per-run ephemeral fields are prohibited in profiles because they are inherently tied to a single invocation.

```typescript
/**
 * A named set of RunOptions fields that can be stored on disk.
 *
 * Excludes per-run ephemeral fields that cannot be meaningfully persisted.
 */
interface ProfileData {
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

  /**
   * Override thinking behavior entirely: arbitrary native thinking
   * parameters passed directly to the underlying provider.
   */
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

  /** System prompt to inject. */
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
```

### 10.3 Prohibited Profile Fields

The following `RunOptions` fields must not appear in a `ProfileData` object. If present, `ProfileManager.set()` throws `ValidationError`:

| Prohibited Field | Reason |
|---|---|
| `prompt` | Per-invocation input; not reusable across runs. |
| `onInputRequired` | Function; cannot be serialized to JSON. |
| `onApprovalRequest` | Function; cannot be serialized to JSON. |
| `env` | Environment-specific; security risk if persisted. |
| `cwd` | Working directory is per-invocation context. |
| `sessionId` | Per-run session identity; not meaningful as a default. |
| `forkSessionId` | Session fork is a one-time operation. |
| `noSession` | Session ephemerality is a per-run decision. |
| `attachments` | File references are per-invocation. |
| `runId` | Auto-generated per run. |
| `projectId` | Per-project metadata, not a run preset. |
| `profile` | Self-referential; profiles cannot reference other profiles. |
| `agentsDoc` | Path reference is per-invocation context. |

---

## 11. Profile Resolution Order

When `mux.run()` is called, `RunOptions` are resolved through a five-level cascade. Each level overrides the one below it, at the individual field level (not wholesale replacement).

### 11.1 Resolution Cascade

```
Priority (highest to lowest):
  1. Per-call RunOptions fields  (explicitly set by the consumer)
  2. Named profile               (if RunOptions.profile is set)
  3. Project config               (.agent-mux/config.json)
  4. Global config                (~/.agent-mux/config.json)
  5. Adapter defaults             (hardcoded in the adapter)
```

### 11.2 Resolution Algorithm

```typescript
/**
 * Pseudocode for RunOptions resolution.
 * Executed inside mux.run() before validation and capability gating.
 */
function resolveRunOptions(
  perCall: RunOptions,
  client: AgentMuxClient
): ResolvedRunOptions {
  // Step 1: Start with adapter defaults
  const adapter = client.adapters.get(perCall.agent);
  let resolved = { ...adapter.defaults };

  // Step 2: Merge global config defaults
  const globalConfig = client.config.getGlobalConfig();
  resolved = deepMerge(resolved, extractRunOptionFields(globalConfig));

  // Step 3: Merge project config defaults
  const projectConfig = client.config.getProjectConfig();
  if (projectConfig) {
    resolved = deepMerge(resolved, extractRunOptionFields(projectConfig));
  }

  // Step 4: Merge named profile (if specified)
  if (perCall.profile) {
    const profile = client.profiles.show(perCall.profile);
    resolved = deepMerge(resolved, profile.data);
  }

  // Step 5: Merge per-call fields (highest priority)
  // Only fields explicitly set (not undefined) override.
  resolved = deepMerge(resolved, stripUndefined(perCall));

  return resolved as ResolvedRunOptions;
}
```

### 11.3 Deep Merge Rules

- **Scalar fields** (string, number, boolean): higher-priority value replaces lower-priority value entirely.
- **Array fields** (`tags`, `skills`, `mcpServers`): higher-priority array replaces lower-priority array entirely (no concatenation).
- **Object fields** (`retryPolicy`, `thinkingOverride`, `env`): shallow-merged at the top level of the object. Keys in the higher-priority object replace keys in the lower-priority object; keys not present in the higher-priority object are preserved.
- **`undefined` fields**: an `undefined` value in a higher-priority layer does not override a lower-priority value. Only explicitly set (non-`undefined`) values participate in the merge.

### 11.4 Resolution Examples

**Example 1: Profile overrides global config, per-call overrides profile.**

```json
// ~/.agent-mux/config.json (global config)
{
  "defaultAgent": "claude",
  "approvalMode": "prompt",
  "timeout": 60000
}
```

```json
// ~/.agent-mux/profiles/fast.json (global profile)
{
  "agent": "codex",
  "approvalMode": "yolo",
  "thinkingEffort": "low",
  "maxTurns": 5
}
```

```typescript
// Per-call RunOptions
mux.run({
  agent: 'claude',       // overrides profile's "codex"
  prompt: 'Fix the bug',
  profile: 'fast',       // applies the "fast" profile
  maxTurns: 10,          // overrides profile's 5
});

// Resolved result:
// agent: 'claude'        (per-call wins over profile)
// approvalMode: 'yolo'   (profile wins over global config)
// thinkingEffort: 'low'  (from profile)
// maxTurns: 10           (per-call wins over profile)
// timeout: 60000         (from global config, nothing above overrides)
```

**Example 2: Project profile overrides global profile.**

```json
// ~/.agent-mux/profiles/careful.json (global)
{
  "thinkingEffort": "high",
  "approvalMode": "prompt",
  "maxTurns": 20,
  "timeout": 300000
}
```

```json
// .agent-mux/profiles/careful.json (project)
{
  "thinkingEffort": "max",
  "maxTurns": 50
}
```

```
// Resolved "careful" profile (deep merge, project over global):
// thinkingEffort: 'max'       (project overrides global)
// approvalMode: 'prompt'      (from global, project doesn't set it)
// maxTurns: 50                (project overrides global)
// timeout: 300000             (from global, project doesn't set it)
```

---

## 12. Profile Storage Format and Locations

### 12.1 File Locations

| Scope | Directory | Example Path |
|---|---|---|
| Global | `~/.agent-mux/profiles/` | `~/.agent-mux/profiles/fast.json` |
| Project | `.agent-mux/profiles/` | `.agent-mux/profiles/careful.json` |

Platform-specific home directory resolution follows the rules defined in `01-core-types-and-client.md` Section 4.1.1.

### 12.2 File Format

- **Encoding**: UTF-8, no BOM.
- **Format**: Strict JSON (no comments, no trailing commas).
- **Trailing newline**: Permitted.
- **Schema**: `ProfileData` interface (Section 10.2).

### 12.3 Naming Rules

Profile names must match the regular expression `^[a-zA-Z0-9_-]{1,64}$`:

- Allowed characters: alphanumeric, underscore, hyphen.
- Length: 1 to 64 characters.
- Case-sensitive: `Fast` and `fast` are different profiles.
- File extension `.json` is appended automatically and must not be included in the name.

Invalid profile names throw `ValidationError` with field `'name'` and expected value `"string matching ^[a-zA-Z0-9_-]{1,64}$"`.

### 12.4 File Discovery

Files in the profiles directory that do not match the naming pattern (e.g., `.backup.json`, `README.md`, `profile with spaces.json`) are silently ignored by `ProfileManager.list()`.

### 12.5 Corrupt File Handling

If a profile JSON file exists but cannot be parsed:

- `ProfileManager.show()` throws `AgentMuxError` with code `CONFIG_ERROR` and a message identifying the file path and parse error location.
- `ProfileManager.list()` includes the entry with a flag indicating the parse error, but does not throw. This allows the consumer to see which profiles exist even if some are corrupt.
- `ProfileManager.apply()` throws the same `CONFIG_ERROR` as `show()`.

### 12.6 Example Profile Files

**`~/.agent-mux/profiles/fast.json`**:
```json
{
  "agent": "codex",
  "approvalMode": "yolo",
  "thinkingEffort": "low",
  "maxTurns": 5,
  "timeout": 30000,
  "stream": true
}
```

**`~/.agent-mux/profiles/careful.json`**:
```json
{
  "agent": "claude",
  "model": "claude-opus-4-0520",
  "approvalMode": "prompt",
  "thinkingEffort": "max",
  "maxTurns": 50,
  "timeout": 600000,
  "retryPolicy": {
    "maxAttempts": 5,
    "baseDelayMs": 2000,
    "maxDelayMs": 60000,
    "jitterFactor": 0.2,
    "retryOn": ["RATE_LIMITED", "AGENT_CRASH", "TIMEOUT"]
  }
}
```

**`.agent-mux/profiles/ci.json`** (project-specific):
```json
{
  "approvalMode": "yolo",
  "thinkingEffort": "medium",
  "maxTurns": 30,
  "timeout": 120000,
  "tags": ["ci", "automated"],
  "stream": false
}
```

---

## 13. CLI Integration

The `amux profiles` subcommand maps directly to the `ProfileManager` API.

### 13.1 CLI Commands

```
amux profiles list [--scope global|project]
amux profiles show <name>
amux profiles set <name> [run flags]
amux profiles delete <name> [--scope global|project]
amux profiles apply <name>
```

### 13.2 CLI Flag to Profile Field Mapping

When using `amux profiles set`, run flags are translated to `ProfileData` fields:

| CLI Flag | ProfileData Field |
|---|---|
| `--agent`, `-a` | `agent` |
| `--model`, `-m` | `model` |
| `--yolo` | `approvalMode: 'yolo'` |
| `--deny` | `approvalMode: 'deny'` |
| `--thinking-effort <level>` | `thinkingEffort` |
| `--thinking-budget <tokens>` | `thinkingBudgetTokens` |
| `--max-tokens <n>` | `maxTokens` |
| `--max-turns <n>` | `maxTurns` |
| `--timeout <ms>` | `timeout` |
| `--inactivity-timeout <ms>` | `inactivityTimeout` |
| `--stream` / `--no-stream` | `stream: true` / `stream: false` |
| `--output-format <fmt>` | `outputFormat` |
| `--system <prompt>` | `systemPrompt` |
| `--system-mode <mode>` | `systemPromptMode` |
| `--tag <tag>` | `tags` (repeatable, builds array) |

### 13.3 Using Profiles with `amux run`

```bash
# Apply a profile to a run
amux run claude "Fix the bug" --profile careful

# Profile values can be overridden by explicit flags
amux run --profile fast --model gpt-4o "Explain this code"
# Uses profile "fast" as base, but overrides model to gpt-4o
```

---

## 14. Edge Cases and Error Conditions

### 14.1 Invalid Combinations

| Scenario | Behavior |
|---|---|
| `agent` is not registered | Throws `AgentMuxError` code `AGENT_NOT_FOUND`. |
| `agent` is registered but CLI binary not found on `$PATH` | Throws `AgentMuxError` code `AGENT_NOT_INSTALLED`. |
| `prompt` is empty string or empty array | Throws `ValidationError`. |
| `prompt` is `string[]` with all empty strings | Throws `ValidationError` (concatenated result is empty). |
| `temperature: -0.5` | Throws `ValidationError` (below valid range `[0.0, 2.0]`). |
| `temperature: 3.0` | Throws `ValidationError` (above valid range `[0.0, 2.0]`). |
| `topP: 1.5` | Throws `ValidationError` (above valid range `[0.0, 1.0]`). |
| `topK: 0` | Throws `ValidationError` (below valid minimum `1`). |
| `topK: 3.5` | Throws `ValidationError` (not an integer). |
| `maxTokens: 0` | Throws `ValidationError` (below valid minimum `1`). |
| `maxTokens: -100` | Throws `ValidationError` (below valid minimum `1`). |
| `thinkingBudgetTokens: 512` | Throws `ValidationError` (below minimum `1024`). |
| `thinkingBudgetTokens` exceeds model's `maxThinkingTokens` | Throws `ValidationError`. |
| `timeout: -1` | Throws `ValidationError` (negative not allowed). |
| `inactivityTimeout: -1` | Throws `ValidationError` (negative not allowed). |
| `maxTurns: 0` | Throws `ValidationError` (below valid minimum `1`). |
| `cwd` is a relative path | Throws `ValidationError`. |
| `cwd` directory does not exist | Throws `ValidationError`. |
| `sessionId` + `noSession: true` | Throws `ValidationError` (mutually exclusive). |
| `sessionId` + `forkSessionId` | Throws `ValidationError` (mutually exclusive). |
| `forkSessionId` + `noSession: true` | Throws `ValidationError` (mutually exclusive). |
| `profile` references non-existent name | Throws `AgentMuxError` code `PROFILE_NOT_FOUND`. |
| `runId` is not a valid ULID | Throws `ValidationError`. |
| `outputFormat: 'json'` on agent without `supportsJsonMode` | Throws `CapabilityError`. |
| `stream: true` on agent without `supportsTextStreaming` | Throws `CapabilityError`. |
| `thinkingEffort` on model without `supportsThinking` | Throws `CapabilityError`. |
| `forkSessionId` on agent without `canFork` | Throws `CapabilityError`. |
| `mcpServers` on agent without `supportsMCP` | Throws `CapabilityError`. |
| `skills` on agent without `supportsSkills` | Throws `CapabilityError`. |
| `agentsDoc` on agent without `supportsAgentsMd` | Throws `CapabilityError`. |
| `attachments` on agent without file/image support | Throws `CapabilityError`. |

### 14.2 Type Coercion Rules

agent-mux does not perform implicit type coercion on `RunOptions` fields. All values must be the correct type as specified in the interface. Passing incorrect types (e.g., `temperature: "0.5"` as a string instead of number) throws `ValidationError`.

The only exception is `prompt`: when passed as a `string[]`, elements are concatenated with `\n\n` into a single string before being sent to the agent. This is normalization, not coercion.

### 14.3 Missing Required Fields

| Missing Field | Behavior |
|---|---|
| `agent` not set and no `defaultAgent` in config or profile | Throws `ValidationError` with field `'agent'` and message `"agent is required: set it in RunOptions, a profile, or defaultAgent in config"`. |
| `prompt` not set | Throws `ValidationError` with field `'prompt'` and message `"prompt is required"`. |

The `agent` field has a special resolution path: it can come from the per-call `RunOptions`, the applied profile, or the `defaultAgent` config field. If none provides it, validation fails.

### 14.4 Undefined vs. Null

- `undefined`: the field is not set; it does not participate in resolution/merge.
- `null`: treated as an explicit value. For most fields, `null` throws `ValidationError` because the field type does not include `null`. There is no "unset a profile field" semantic via `null`; to remove a field from a profile, call `ProfileManager.set()` with the field omitted.

### 14.5 Empty Arrays vs. Undefined

- `skills: []` (empty array) is treated as "explicitly no skills". It overrides a profile that sets skills. No `CapabilityError` is thrown for empty arrays (capability gating only triggers on non-empty arrays).
- `skills: undefined` (not set) defers to the profile or lower-priority layer.
- The same logic applies to `tags`, `mcpServers`, and `attachments`.

### 14.6 Model Validation Timing

Model validation (checking that the specified `model` is known to the target agent) occurs after option resolution but before capability gating. If the model is unknown:

- The adapter's `mux.models.validate()` returns `{ valid: false }`.
- agent-mux emits a `debug` event with a warning but does not throw. The model string is passed through to the agent CLI, which may accept it (e.g., for newly released models not yet in the bundled model list).

---

## 15. Complete Type Summary

All types defined or referenced in this specification:

| Type | Defined In | Section |
|---|---|---|
| `RunOptions` | This spec | 2 |
| `Attachment` | This spec | 3 |
| `McpServerConfig` | This spec | 4 |
| `RetryPolicy` | `01-core-types-and-client.md` (reproduced in this spec) | 5 |
| `ProfileData` | This spec | 10.2 |
| `ProfileManager` | This spec | 10 |
| `ProfileEntry` | This spec | 10.1 |
| `ResolvedProfile` | This spec | 10.1 |
| `ProfileListOptions` | This spec | 10.1 |
| `ProfileSetOptions` | This spec | 10.1 |
| `ProfileDeleteOptions` | This spec | 10.1 |
| `AgentName` | `01-core-types-and-client.md` | 1.4 |
| `ErrorCode` | `01-core-types-and-client.md` | 3.1 |
| `CapabilityError` | `01-core-types-and-client.md` | 3.2 |
| `ValidationError` | `01-core-types-and-client.md` | 3.3 |
| `InputRequiredEvent` | `03-run-handle-and-interaction.md` | 2 |
| `ApprovalRequestEvent` | `03-run-handle-and-interaction.md` | 2 |

### 15.1 Method Summary

| Interface | Method | Returns | Throws |
|---|---|---|---|
| `ProfileManager` | `list(options?)` | `Promise<ProfileEntry[]>` | -- |
| `ProfileManager` | `show(name)` | `Promise<ResolvedProfile>` | `PROFILE_NOT_FOUND`, `CONFIG_ERROR` |
| `ProfileManager` | `set(name, data, options?)` | `Promise<void>` | `ValidationError` |
| `ProfileManager` | `delete(name, options?)` | `Promise<void>` | `PROFILE_NOT_FOUND` |
| `ProfileManager` | `apply(name, overrides?)` | `Promise<Partial<RunOptions>>` | `PROFILE_NOT_FOUND`, `CONFIG_ERROR` |

---

## Implementation Status (2026-04-12)

### RunOptions.invocation

`RunOptions` now carries an optional `invocation?: InvocationMode` — a discriminated union of `LocalInvocation | DockerInvocation | SshInvocation | K8sInvocation`. When omitted or set to `{ mode: 'local' }` the harness runs in-process on the host; other modes rewrap the spawn args via `buildInvocationCommand()`. See `docs/13-invocation-modes.md` for field definitions and semantics.

Profiles may include an `invocation` field; it is merged onto `RunOptions` like any other field with caller overrides winning.
