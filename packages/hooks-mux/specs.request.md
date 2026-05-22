# A5C Hooks Proxy

## Requirements and Technical Specification

Version: Draft v0.1
Status: Ready for implementation planning
Audience: Core platform and CLI/runtime engineers

---

## 1. Purpose

Build a small, focused product that unifies hook execution across agent harnesses by acting as a proxy layer between harness-native hooks and portable hook implementations.

The product has two forms:

1. `@a5c-ai/hooks-mux` — npm library
2. `a5c-hooks-mux` — CLI entrypoint

The system must:

* normalize incoming hook payloads from different harnesses into one canonical event model
* normalize lifecycle event names into one canonical lifecycle model
* preserve and propagate execution context across the session lifecycle
* support multiple plugin-level hooks running within the same session without conflicting with each other
* translate portable hook results back into harness-native output contracts
* provide a no-op bootstrap path for session context initialization even when no real hook logic is needed
* work both as a CLI shell-hook proxy and as a programmatic library for runtimes that are not stdin/stdout hook systems

This spec intentionally covers only hook unification and execution-context propagation. It does not define a full plugin marketplace, unified plugin packaging format, or unified skills/agents/MCP abstraction.

---

## 2. Problem Statement

Hook systems across harnesses differ in important ways:

* lifecycle events are named differently and sit at different layers of the loop
* some hooks are shell subprocesses, others are in-process plugin APIs
* some can block, some can mutate, some are observer-only
* some expose a stable session id, some do not
* some support durable env/context propagation to later tool calls, some do not
* some allow multiple hook registrations, but their concurrency/ordering semantics make shared state unsafe

Without a proxy layer, each hook implementation must be rewritten per harness.

---

## 3. Product Scope

### In scope

* canonical lifecycle model
* canonical hook input/output schema
* harness adapters
* session/execution-context persistence
* env/context propagation for downstream shell/tool execution
* multi-hook fan-out orchestration for session bootstrap and related events
* CLI and library API
* adapter capability model
* deterministic merge rules for multiple logical hooks under one native hook registration

### Out of scope

* unified plugin marketplace
* unified on-disk plugin directory format beyond what is needed for proxy-managed hook execution
* non-hook extension surfaces such as skills, agents, commands, MCP, themes, renderers
* generalized remote control plane or distributed hook execution

---

## 4. Design Principles

1. **Harness owns registration, A5C owns normalization**
   The harness continues to own native `hooks.json` or equivalent registration. The proxy sits inside the configured command.

2. **Portable hook logic must be harness-agnostic**
   Real hook implementations should receive only normalized events and produce normalized results.

3. **Session context is first-class**
   Hook normalization is not enough. Durable session context and downstream execution context are part of the product.

4. **Aggregation over native fan-out for bootstrap events**
   Session bootstrap and context setup must use a single native hook entry that internally fans out to multiple logical hooks.

5. **Capability-driven degradation**
   The system must explicitly model where behavior is native, emulated, lossy, or unsupported.

6. **Small v1**
   Build the narrowest system that reliably works for real hook use cases.

---

## 5. Target Support Model

### Family A: Shell-hook adapters

Primary v1 targets:

* Claude Code
* OpenAI Codex CLI
* Gemini CLI
* GitHub Copilot CLI
* Cursor CLI / Cursor IDE hooks where stable enough

### Family B: Programmatic/in-process adapters

Secondary targets via library API:

* pi / mono-pi coding agent
* oh-my-pi
* OpenCode
* OpenClaw plugin hooks

### Family C: Non-blocking observer/gateway systems

Explicitly non-v1 targets:

* Hermes gateway hooks and similar systems that are observer-first or not yet stable enough for precise parity

---

## 6. Core User Stories

### Portable hook author

* I can write a hook once against a normalized event object.
* I do not need to know whether the caller was Claude, Codex, Gemini, or another supported harness.

### Plugin author with multiple bootstrap hooks

* I can register several logical session-start hooks for different plugins.
* They all see the same resolved `session_id` and current execution context.
* Their env/context outputs are merged without race conditions.

### Harness integrator

* I can place one native session-start hook in the harness config and let the proxy fan out internally.
* I can also use the proxy in a no-op bootstrap mode to initialize session context even if no user hook script is present.

### Tool wrapper author

* I can execute a command through the proxy and have session context injected automatically into the subprocess environment.

### Runtime/extension integrator

* I can call the library programmatically from an in-process plugin system instead of shelling out.

---

## 7. High-Level Architecture

```text
native harness hook
    -> a5c-hooks-mux invoke
        -> adapter parses stdin/env/native metadata
        -> lifecycle event normalized
        -> session context resolved/loaded
        -> logical hook plan resolved
        -> one or more portable hook handlers executed
        -> results merged deterministically
        -> session context store updated
        -> env/context propagation applied via native or emulated mechanism
        -> adapter renders harness-native output
```

For downstream command execution:

```text
wrapped tool command
    -> a5c-hooks-mux exec
        -> resolve session context
        -> materialize environment/context for subprocess
        -> spawn target command
```

For programmatic environments:

```text
runtime event callback
    -> @a5c-ai/hooks-mux library
        -> normalize event
        -> run portable handlers
        -> return adapter-ready result object
```

---

## 8. Canonical Lifecycle Model

The proxy must normalize native event names into a layered lifecycle model.

### 8.1 Canonical lifecycle phases

#### Session lifecycle

* `session.start`
* `session.end`
* `session.cwd_changed`
* `session.file_changed`
* `session.config_changed`
* `session.compact.before`
* `session.compact.after`

#### Turn lifecycle

* `turn.user_prompt_submitted`
* `turn.before_agent`
* `turn.after_agent`
* `turn.stop`
* `turn.error`

#### Model/planner lifecycle

* `model.before_request`
* `model.after_response`
* `planner.before_tool_selection`

#### Tool lifecycle

* `tool.before`
* `tool.after`
* `tool.error`
* `tool.permission_request`
* `tool.permission_denied`

#### Subagent lifecycle

* `subagent.start`
* `subagent.end`

#### Notification / messaging lifecycle

* `notification`
* `message.received`
* `message.sending`
* `message.sent`

#### MCP / elicitation lifecycle

* `mcp.elicitation`
* `mcp.elicitation_result`

### 8.2 Canonical event mapping requirements

Each adapter must declare a mapping table:

* native event name
* canonical phase
* support level: `native | emulated | lossy | unsupported`
* block capability
* mutation capability
* scope: `session | turn | tool | model | planner | subagent | gateway`

### 8.3 Minimum v1 canonical phases

v1 must implement at least:

* `session.start`
* `session.end`
* `turn.user_prompt_submitted`
* `tool.before`
* `tool.after`
* `turn.stop`

---

## 9. Execution Context Model

Execution context is the durable data required to preserve continuity across the lifecycle and into downstream commands.

### 9.1 Canonical execution context

```ts
interface UnifiedExecutionContext {
  sessionId: string | null;
  turnId?: string | null;
  conversationId?: string | null;
  adapter: string;
  cwd?: string | null;
  worktree?: string | null;
  transcriptPath?: string | null;
  source?: string | null;
  model?: string | null;
  agentType?: string | null;
  permissionMode?: string | null;
  toolName?: string | null;
  toolCallId?: string | null;
  nativeEventName: string;
  rawEventScope?: string | null;
  persistedEnv: Record<string, string>;
  contextVars: Record<string, string>;
  metadata: Record<string, unknown>;
}
```

### 9.2 Session identity requirements

`sessionId` is the primary key for durable context.

Resolution precedence:

1. explicit CLI flag `--session-id`
2. explicit env `AGENT_SESSION_ID`
3. adapter-native session id from stdin/input context
4. adapter-derived session key from stable native identifiers
5. synthetic session id only if the adapter has no stable session id and the integration explicitly allows synthetic ids

### 9.3 Synthetic session ids

Synthetic ids are allowed only for adapters that do not expose a stable native session id.

Synthetic id derivation must be deterministic over the active native session where possible, but must not accidentally merge unrelated sessions.

Suggested derivation inputs:

* native conversation/session token if available
* cwd or workspace root
* launch timestamp/window
* adapter instance metadata

If the risk of accidental session merging is high, the adapter must mark session continuity as `lossy`.

### 9.4 Turn identity

`turnId` is optional but should be captured when available. Tool-level and stop-level logic may use it for traceability, but durable context is keyed by `sessionId`.

---

## 10. Canonical Hook Input Schema

```ts
interface UnifiedHookEvent {
  version: "a5c.hooks.v1";
  adapter: string;
  phase: string;
  rawEventName: string;
  supportLevel: "native" | "emulated" | "lossy" | "unsupported";
  execution: UnifiedExecutionContext;
  payload: Record<string, unknown>;
  env: {
    input: Record<string, string>;
    persisted: Record<string, string>;
  };
  raw: unknown;
}
```

### 10.1 Payload requirements

Payload should preserve native detail instead of collapsing too early.

Examples:

* `prompt`
* `toolInput`
* `toolResponse`
* `lastAssistantMessage`
* `initialPrompt`
* `reason`
* `source`
* `llmRequest`
* `llmResponse`

---

## 11. Canonical Hook Output Schema

```ts
interface UnifiedHookResult {
  decision?: "allow" | "deny" | "ask" | "continue" | "noop";
  reason?: string;
  systemMessage?: string;
  additionalContext?: string;
  followUpMessage?: string;
  continueSession?: boolean;
  stopReason?: string;
  suppressOutput?: boolean;

  toolMutation?: {
    mode: "replace" | "patch";
    value: unknown;
  };

  persistEnv?: Record<string, string>;
  unsetEnv?: string[];
  contextVars?: Record<string, string>;

  metadata?: Record<string, unknown>;
}
```

### 11.1 Output semantics

Not every adapter supports every output field.

Each adapter must define a result capability table for:

* block/deny
* ask/approve
* tool input mutation
* tool result mutation
* additional developer/model context
* follow-up message / retry behavior
* stop / continue override
* persisted env support

---

## 12. Multi-Plugin SessionStart Fan-Out

This is a core requirement.

### 12.1 Problem

Some harnesses allow multiple matching session-start hooks, but native multi-hook behavior is not safe for shared bootstrap state.

Examples of risks:

* hooks may run concurrently
* one hook may not be able to see outputs of another
* env writes may race
* outputs may be ignored by the harness

### 12.2 Required solution

For bootstrap-class events, the proxy must support **aggregated fan-out mode**.

That means the harness registers a **single native hook command**, and the proxy internally executes multiple logical hook handlers.

This is required at least for:

* `session.start`
* any no-op context bootstrap path
* any event that updates durable session context or persisted env intended for downstream tools

### 12.3 Hook plan resolution

The proxy must be able to resolve multiple logical handlers for one native event.

Sources may include:

* explicit CLI `--handler`
* registry file
* programmatic registration

Suggested model:

```ts
interface HookPlanEntry {
  id: string;
  pluginId: string;
  phase: string;
  priority: number;
  when?: Record<string, unknown>;
  handler: HandlerRef;
  timeoutMs?: number;
}
```

### 12.4 Shared input guarantees

All handlers in one fan-out execution must receive:

* the same resolved `sessionId`
* the same base normalized event
* the same initial persisted env/context snapshot

### 12.5 Visibility model during fan-out

Bootstrap fan-out must be **ordered**, not parallel, by default.

Reason:

* later handlers may need to see env/context outputs from earlier handlers
* deterministic ordering is more important than latency for bootstrap

Default execution order:

1. sort by priority ascending
2. tie-break by `pluginId`
3. tie-break by `id`

Optional future mode:

* `parallel-readonly`: only for handlers declared as pure observers

### 12.6 Merge semantics

At the end of fan-out, the proxy must produce one merged result.

#### Merge rules

* `persistEnv`: key-wise merge; later writer wins unless key is marked protected
* `unsetEnv`: union
* `contextVars`: key-wise merge; later writer wins unless protected
* `additionalContext`: concatenate in order with section delimiters
* `systemMessage`: concatenate in order or keep first, per adapter strategy
* `decision`: most restrictive wins (`deny` > `ask` > `allow` > `noop`)
* `toolMutation`: only one mutating writer allowed unless the adapter supports patch chaining
* `continueSession`: `false` dominates
* `stopReason`: first non-empty if stopping, else concatenate as metadata

### 12.7 Conflict policy

The proxy must support conflict policies:

* `last-writer-wins` (default for env/context vars)
* `fail-on-conflict`
* `protected-prefixes`
* `namespace-required`

Recommended default:

* env keys under `AGENT_*` reserved for proxy
* plugin-specific keys should be namespaced, for example `PLUGIN_X_*`
* protected keys cannot be overwritten unless explicitly allowed

---

## 13. No-Op Session Bootstrap

This is also a core requirement.

### 13.1 Goal

Allow a session-start native hook to exist purely to initialize shared session context and env propagation, even if there is no actual plugin hook logic to run.

### 13.2 Required behavior

The proxy must support a no-op bootstrap mode such as:

```bash
a5c-hooks-mux invoke --adapter claude --bootstrap-only
```

or

```bash
a5c-hooks-mux bootstrap --adapter claude
```

This mode must:

* resolve and persist `sessionId`
* initialize the session store if absent
* materialize baseline execution context
* apply available native env propagation mechanism if configured
* produce a valid adapter-native success result
* not require a user-provided handler command

### 13.3 Use cases

* context needs to exist for later `tool.before` hooks
* downstream wrapped commands need access to `AGENT_SESSION_ID`
* session bootstrap is required but plugin logic will be added later
* a project wants shared context/env without custom session-start scripts

---

## 14. Context Propagation Model

### 14.1 Context categories

The proxy must distinguish between:

1. **Persisted env**
   Values intended to appear in downstream shell/tool process environments.

2. **Context vars**
   Structured key-value metadata stored in the session store and available to later hooks and wrappers.

3. **Injected model context**
   Free-text or structured context sent back to the harness as additional model/developer context when supported.

### 14.2 Propagation backends

The system must support multiple propagation modes.

#### Mode A: native env-file persistence

Harness natively supports writing env exports for later shell commands.

#### Mode B: runtime shell env hook

Runtime natively supports injecting env into all shell execution.

#### Mode C: tool-input rewrite / wrapper execution

The proxy rewrites shell commands or wraps them to inject env.

#### Mode D: session-store only

No native downstream execution injection exists. Context is durable only inside later proxy-managed hooks or wrapped commands.

### 14.3 Adapter support requirement

Each adapter must declare one of:

* `envPersistence: native_env_file`
* `envPersistence: runtime_hook`
* `envPersistence: wrapper_only`
* `envPersistence: none`

### 14.4 Portable environment variables

The proxy should always inject these into child processes when possible:

* `AGENT_SESSION_ID`
* `AGENT_TURN_ID` when available
* `AGENT_ADAPTER`
* `AGENT_WORKSPACE_ROOT` when available
* `AGENT_TRANSCRIPT_PATH` when available
* `AGENT_CONTEXT_FILE` when materialized

---

## 15. Session Store

### 15.1 Purpose

Store durable context required across hook invocations.

### 15.2 Storage location

Default:

* POSIX: `${XDG_STATE_HOME:-~/.local/state}/a5c-hooks/sessions/<session-id>.json`
* fallback: `~/.a5c/state/hooks/sessions/<session-id>.json`

### 15.3 Session file schema

```json
{
  "version": "a5c.hooks.session.v1",
  "sessionId": "...",
  "adapter": "claude",
  "createdAt": "...",
  "updatedAt": "...",
  "cwd": "...",
  "transcriptPath": "...",
  "persistedEnv": {},
  "contextVars": {},
  "contextFragments": [],
  "metadata": {}
}
```

### 15.4 Write rules

* atomic writes only
* file lock during update
* corruption detection with fallback backup
* best-effort recovery with warning path

### 15.5 Context fragments

`contextFragments` should support ordered accumulation of free-text snippets that may later be re-emitted into model context.

---

## 16. Adapter Capability Model

Each adapter must publish a capability descriptor.

```ts
interface AdapterCapabilities {
  name: string;
  family: "shell-hook" | "in-process" | "observer";
  sessionIdQuality: "native" | "derived" | "synthetic" | "none";
  supportsOrderedFanout: boolean;
  supportsNativeAdditionalContext: boolean;
  supportsBlock: boolean;
  supportsAsk: boolean;
  supportsToolInputMutation: boolean;
  supportsToolResultMutation: boolean;
  supportsPersistedEnv: boolean;
  envPersistenceMode: "native_env_file" | "runtime_hook" | "wrapper_only" | "none";
  toolInterceptionScope: "all" | "shell_only" | "partial_shell_only" | "none";
  notes?: string[];
}
```

`notes` is the machine-readable source of truth for experimental, lossy, or setup-sensitive
adapter caveats. Diagnostics such as `doctor` should surface these notes directly, and prose
docs must not contradict them.

---

## 17. Adapter Requirements by Harness

## 17.1 Claude adapter

### Required behavior

* map Claude event names to canonical phases
* read common stdin JSON fields and event-specific fields
* use native env-file persistence when available
* support adapter-native additional context output where relevant
* support stop semantics, permission semantics, and tool lifecycle mappings

### Special notes

* `session.start` source values include at least `startup`, `resume`, `clear`, `compact`
* `CLAUDE_ENV_FILE` is only available on specific events and must be used with append semantics
* `turn.stop` can recurse if not guarded; `stop_hook_active` must be surfaced in normalized payload

## 17.2 Codex adapter

### Required behavior

* respect feature-flagged/experimental status in diagnostics
* model tool interception as partial shell-only, not full tool interception
* support only documented output fields per event
* use aggregated single-hook registration for session bootstrap to avoid native multi-hook concurrency races
* provide wrapper-based env propagation for downstream shell execution

### Special notes

* matching hooks from multiple files all run
* multiple matching command hooks for the same event can launch concurrently
* current `tool.before` / `tool.after` coverage is Bash-only and incomplete
* many parsed output fields currently fail open

## 17.3 Gemini adapter

### Required behavior

* map richer planner/model/agent/tool lifecycle to canonical phases
* support command-hook stdin/stdout conventions
* preserve `BeforeToolSelection`, `BeforeModel`, `AfterModel`, `BeforeAgent`, `AfterAgent` distinctions
* support hook aggregation semantics carefully, especially where Gemini unions results

### Special notes

* logs must be sent to stderr, final JSON to stdout only
* `BeforeToolSelection` has unique union-style aggregation semantics natively

## 17.4 GitHub Copilot adapter

### Required behavior

* support session/prompt/tool/error lifecycle events
* model session bootstrap as observer-only plus session-store initialization
* expose that session-start output is ignored
* support pre-tool deny where available
* use synthetic or derived session id strategy if no stable native session id is exposed

### Special notes

* `permissionDecision` supports `allow | deny | ask` in schema, but only `deny` is processed currently
* many hook outputs are ignored on non-preTool events

## 17.5 Cursor adapter

### Required behavior

* support only documented/stable subset per configured capability profile
* guard against assuming event availability across IDE and CLI
* allow adapter version/profile overrides if Cursor behavior changes rapidly

### Special notes

* hook surface is moving and may differ between CLI and IDE
* the adapter must expose uncertainty explicitly in diagnostics

## 17.6 pi / mono-pi adapter

### Required behavior

* library-only adapter, not shell proxy adapter
* map `session_start`, `tool_call`, `context`, `before_provider_request`, etc. to canonical phases
* support session persistence via native extension-state mechanisms
* support mutable tool input semantics

### Special notes

* tool input mutation is in-place and later handlers see earlier mutations
* session persistence is available but does not automatically enter model context

## 17.7 oh-my-pi adapter

### Required behavior

* library-only adapter
* preserve chained context behavior and session-before short-circuit semantics
* expose mutability limitations explicitly

## 17.8 OpenCode adapter

### Required behavior

* library-only adapter
* map `session.created`, `tool.execute.before`, `tool.execute.after`, and `shell.env`
* support native runtime env injection backend via `shell.env`

## 17.9 OpenClaw adapter

### Required behavior

* library-first adapter
* distinguish internal gateway hooks from plugin hooks
* map plugin lifecycle hooks to canonical phases without pretending gateway hooks are equivalent

---

## 18. CLI Specification

### 18.1 `invoke`

Primary entrypoint for native hook commands.

```bash
a5c-hooks-mux invoke \
  --adapter <adapter> \
  [--handler <command...>] \
  [--registry <path>] \
  [--bootstrap-only] \
  [--session-id <id>] \
  [--json]
```

Behavior:

* read stdin when adapter expects stdin
* normalize event
* resolve/load session context
* run one handler or fan-out plan
* merge results
* persist session store
* apply propagation backend
* emit adapter-native output

### 18.2 `exec`

Run a command with restored session context.

```bash
a5c-hooks-mux exec \
  --session-id <id> \
  -- <command...>
```

Behavior:

* load session state
* materialize env/context into subprocess
* optionally generate temp env file if needed
* exec target command

### 18.3 `bootstrap`

Dedicated no-op context bootstrap.

```bash
a5c-hooks-mux bootstrap --adapter <adapter>
```

### 18.4 `show-session`

Inspect current session state.

### 18.5 `clear-session`

Delete one session state file.

### 18.6 `doctor`

Report adapter capability profile and integration warnings.

---

## 19. Library Specification

### 19.1 Core library API

```ts
normalizeEvent(input): UnifiedHookEvent
runHandler(event, handler): Promise<UnifiedHookResult>
runPlan(event, plan): Promise<MergedExecutionResult>
adaptOutput(adapter, mergedResult, nativeInput): AdapterRenderedOutput
loadSession(sessionId): Promise<SessionState | null>
saveSession(session): Promise<void>
materializeExecContext(session, opts): Promise<ExecMaterialization>
```

### 19.2 Programmatic integration API

```ts
createAdapter(name, capabilities, impl)
registerHandler(planEntry)
runNormalized(event)
```

---

## 20. Result Merge and Rendering

### 20.1 Merge stages

1. collect per-handler result
2. validate each result against adapter constraints
3. merge by canonical rules
4. record diagnostics
5. render native output

### 20.2 Diagnostics

Merged execution must track:

* handler order
* time spent per handler
* conflicts encountered
* degraded or unsupported output fields
* any native rendering loss

---

## 21. Error Handling

### 21.1 Handler failures

Policy levels:

* `fail-open`
* `fail-closed`
* `fail-open-bootstrap-only`

Default by phase:

* `session.start`: fail-open with warning unless explicitly hardened
* `tool.before`: configurable, default fail-open except policy hooks
* `tool.after`: fail-open
* `turn.stop`: fail-open

### 21.2 Adapter rendering failures

If rendering to harness-native format fails:

* log structured error
* return safest native fallback
* never emit malformed JSON on stdout

### 21.3 Session store failures

If session persistence fails:

* continue hook execution if possible
* mark context propagation as degraded
* emit warning diagnostics

---

## 22. Security Requirements

* no arbitrary shell interpolation from normalized payload without explicit escaping
* protected reserved env prefixes for proxy internals
* opt-in allowlist for which persisted env keys may be rehydrated into subprocess env
* safe temp-file handling for env materialization
* clear separation between logs (stderr) and hook outputs (stdout)
* no leaking raw secrets into debug logs

---

## 23. Observability Requirements

The proxy must support structured logs with:

* adapter
* canonical phase
* native event name
* session id quality (`native`, `derived`, `synthetic`)
* handler ids executed
* merge decisions
* output degradation flags

Optional future support:

* JSONL trace files
* OpenTelemetry spans

---

## 24. Example Integration Patterns

## 24.1 Claude SessionStart aggregated bootstrap

Harness config registers one command hook only.

That command invokes:

```bash
npx -y @a5c-ai/hooks-mux invoke --adapter claude
```

The registry contains multiple logical `session.start` handlers.

The proxy:

* resolves Claude `session_id`
* loads/creates session state
* executes handlers in deterministic order
* merges env/context outputs
* appends exports to `CLAUDE_ENV_FILE`
* stores full merged state in session store
* returns a valid Claude-native response

## 24.2 Codex SessionStart bootstrap-only

Harness config registers one command hook:

```bash
npx -y @a5c-ai/hooks-mux invoke --adapter codex --bootstrap-only
```

The proxy:

* resolves native `session_id`
* initializes session store
* stores baseline env/context
* returns success without requiring a user handler

## 24.3 Wrapped tool execution

A tool command can be wrapped as:

```bash
npx -y @a5c-ai/hooks-mux exec --session-id "$AGENT_SESSION_ID" -- npm test
```

This restores proxy-managed env/context even on harnesses without native persistent shell env.

---

## 25. Testing Requirements

### 25.1 Unit tests

* event normalization per adapter
* session id resolution precedence
* merge semantics
* env/context persistence logic
* adapter rendering logic

### 25.2 Fixture tests

Store real native hook payload fixtures for each adapter and event.

### 25.3 Integration tests

For each shell-hook adapter:

* session.start bootstrap-only
* session.start fan-out with 3 handlers
* tool.before deny
* tool.after additional context
* downstream `exec` context rehydration

### 25.4 Compatibility tests

Track adapter behavior drift over versions where possible.

### 25.5 Failure-mode tests

* malformed stdin JSON
* handler crash
* session store corruption
* conflicting env keys
* unsupported output fields
* concurrent native invocation of same session

---

## 26. Implementation Plan

### Phase 1: Core runtime

* canonical schemas
* session store
* merge engine
* CLI skeleton
* library API skeleton

### Phase 2: Primary adapters

* Claude adapter
* Codex adapter
* Gemini adapter
* Copilot adapter

### Phase 3: Cursor adapter

* capability-profiled integration
* explicit warnings around unstable support

### Phase 4: Programmatic adapters

* pi adapter
* oh-my-pi adapter
* OpenCode adapter
* OpenClaw adapter

### Phase 5: Tooling and hardening

* doctor command
* richer diagnostics
* docs/examples
* version-compat fixtures

---

## 27. Open Questions

1. Should the registry format be JSON-only in v1, or also support JS/TS config?
2. Should `additionalContext` always concatenate, or should adapters choose first/last depending on native semantics?
3. How aggressive should the proxy be about synthetic session ids for Copilot/Cursor-class adapters?
4. Should `exec` support shell-string mode and argv mode, or argv-only in v1 for safety?
5. Do we want a persistent materialized env file path in the session store, or always regenerate on demand?
6. Should bootstrap fan-out be strictly sequential in v1, with no parallel observer mode yet?

---

## 28. Recommended v1 Decisions

* registry format: JSON only
* bootstrap fan-out: sequential only
* shell command execution: argv-first, shell-string optional behind explicit flag
* session-start native registration: one native hook entry per harness integration
* no-op bootstrap: required
* programmatic adapters: library API only
* Cursor support: experimental profile with hard capability warnings

---

## 29. Deliverables

### Code

* `packages/hooks-mux/core`
* `packages/hooks-mux/cli`
* `packages/hooks-mux/adapter-claude`
* `packages/hooks-mux/adapter-codex`
* `packages/hooks-mux/adapter-gemini`
* `packages/hooks-mux/adapter-copilot`
* `packages/hooks-mux/adapter-cursor`

Next phase programmatic adapters:
* `packages/hooks-mux/adapter-pi`
* `packages/hooks-mux/adapter-oh-my-pi`
* `packages/hooks-mux/adapter-opencode`
* `packages/hooks-mux/adapter-openclaw`

### Docs

* adapter integration guide per harness
* portable hook authoring guide
* session context propagation guide
* examples for bootstrap-only, multi-plugin fan-out, and wrapped command execution

### Test assets

* fixture corpus of real hook payloads
* golden native-output snapshots

---

## 30. Bottom Line

The product is a **hooks normalization and context-propagation runtime**, not a general plugin framework.

The most important engineering choices are:

* canonical lifecycle phases instead of raw event names
* durable execution context keyed by session id
* single native bootstrap hook with internal fan-out
* explicit no-op bootstrap mode
* adapter capability profiles that admit native vs emulated vs lossy behavior

If these are implemented cleanly, portable hooks become realistic across the shell-hook family, and the same core can later power programmatic adapters for richer runtimes.

