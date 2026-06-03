# Missing Hook Capabilities — Agent Stack Gaps

Beyond the 13 missing events, the agent stack lacks several hook capabilities that Claude Code supports.

## 1. Handler Types (core support implemented; platform executors pending)

Claude Code supports 5 hook handler types. hooks-mux core now models and dispatches all 5 handler types. `command` remains the legacy default when `type` is omitted.

| Handler Type | Claude Code | Agent Stack | Gap |
|-------------|------------|-------------|-----|
| `command` | ✅ Shell subprocess | ✅ hooks-mux runner.ts | — |
| `http` | ✅ POST to webhook URL | ✅ hooks-mux core | Platform policy may still restrict private URLs; local/private endpoints require explicit opt-in |
| `mcp_tool` | ✅ Call MCP server tool | Partial | hooks-mux has the typed handler and injectable executor seam; live tool-mux/MCP registry wiring remains tied to #576 |
| `prompt` | ✅ LLM evaluates prompt | Partial | hooks-mux has the typed handler and bounded executor seam; host model invocation must be supplied by agent-platform/agent-mux |
| `agent` | ✅ Spawn subagent to evaluate | Partial | hooks-mux has the typed handler and bounded executor seam; host agent spawning must be supplied by agent-platform/agent-mux |

### Implemented

**hooks-mux/core:**
- `src/normalizer/runner.ts` — Dispatches by handler type and preserves command fail-open/fail-closed semantics
- `src/types/plan.ts` — `HandlerRef` is a backward-compatible typed union; omitted `type` behaves as `command`
- `src/handlers/http.ts` — HTTP POST handler with allowed-env header interpolation, URL validation, timeout, and JSON result parsing
- `src/handlers/mcp-tool.ts` — MCP tool handler through an injected executor seam
- `src/handlers/prompt.ts` — Prompt handler through an injected, timeout/depth-bounded executor seam
- `src/handlers/agent.ts` — Agent handler through an injected, timeout/depth/max-turn bounded executor seam

### Remaining integration work

**agent-platform:**
- `src/harness/adapters/amuxBridge.ts` already forwards opaque hook config to agent-mux. Live `mcp_tool`, `prompt`, and `agent` execution still needs platform wiring that supplies hooks-mux executor seams from the unified tool registry/model/agent invocation surfaces.

## 2. Decision Types (3 missing)

| Decision | Claude Code | Agent Stack | Gap |
|----------|------------|-------------|-----|
| `allow` | ✅ PreToolUse | ✅ hooks-mux | — |
| `deny` | ✅ PreToolUse | ✅ hooks-mux | — |
| `ask` | ✅ PreToolUse | ✅ hooks-mux | — |
| `defer` | ✅ Let normal flow decide | ✅ hooks-mux | First-class decision; renders as normal flow where native adapters have no explicit field |
| `block` | ✅ Block action with reason | ✅ hooks-mux + agent-platform bridge | Precedence and audit bridge implemented; Claude PreToolUse renders as `deny` |
| `retry` | ✅ PermissionDenied recovery | Partial | First-class decision with bounded/audited agent-platform metadata; native Claude retry rendering is deferred until a stable event contract exists |

### Changes needed

**hooks-mux/core:**
- `src/types/result.ts` — `defer`, `block`, `retry` are in the decision union
- `src/merge-engine/merge.ts` and `src/sdk-interface/parser.ts` — Handle precedence and validation for the decision types

**hooks-mux/adapter-claude:**
- `src/renderer.ts` — Renders `block` as PreToolUse `deny`; `defer` and unsupported `retry` omit native decisions explicitly

**agent-platform:**
- `src/harness/internal/createRun/orchestration/effects.ts` — Handles hook decision metadata for block/retry/session abort
- `src/governance/` — Existing permission events audit hook block/retry bridge decisions

## 3. Matcher Patterns (regex, negation, OR missing)

| Capability | Claude Code | Agent Stack | Gap |
|-----------|------------|-------------|-----|
| Exact match | ✅ `"Bash"` | ✅ dot-path equality | — |
| Pipe-separated OR | ✅ `"Edit\|Write"` | ❌ AND-only | Need OR logic |
| Regex patterns | ✅ `"mcp__.*"` | ❌ exact only | Need regex support |
| Negation | ✅ (via regex `^(?!rm)`) | ❌ | Need negation operator |
| `if` conditional | ✅ `"Bash(rm *)"` permission syntax | ❌ | Need `if` field parsing |

### Changes needed

**hooks-mux/core:**
- `src/normalizer/plan-resolver.ts` — Extend `evaluateWhen()` with regex, OR, negation
- `src/types/plan.ts` — Add `if` field to HookPlanEntry

## 4. Async Execution (fully missing)

| Capability | Claude Code | Agent Stack | Gap |
|-----------|------------|-------------|-----|
| `async: true` | ✅ Background, non-blocking | ❌ | Need async handler spawn |
| `asyncRewake: true` | ✅ Background + rewake on exit 2 | ❌ | Need rewake mechanism |
| `once: true` | ✅ Run only once per session | ❌ | Need per-session dedup |

### Changes needed

**hooks-mux/core:**
- `src/normalizer/runner.ts` — Add async spawn mode (don't await)
- `src/normalizer/runner.ts` — Add rewake: monitor exit code, inject stderr as system reminder
- New: `src/state/hook-execution-tracker.ts` — Track `once` per session

**agent-platform:**
- Background hook results need to feed back into orchestration context

## 5. Environment Variables (2 missing)

| Variable | Claude Code | Agent Stack | Gap |
|----------|------------|-------------|-----|
| `CLAUDE_PROJECT_DIR` | ✅ | ❌ | Map to `AGENT_WORKSPACE_ROOT` or add |
| `CLAUDE_ENV_FILE` | ✅ Persist env vars | ❌ | Need env file mechanism |
| `CLAUDE_PLUGIN_ROOT` | ✅ | ✅ via `PI_PLUGIN_ROOT` | Naming mismatch |
| `CLAUDE_PLUGIN_DATA` | ✅ | ❌ | Need plugin data dir |
| `CLAUDE_EFFORT` | ✅ | ❌ | Need effort level propagation |
| `CLAUDE_CODE_REMOTE` | ✅ | ❌ | Need remote detection |

### Changes needed

**hooks-mux/core:**
- `src/propagation/materialize.ts` — Add missing env vars to injection
- New: env file mechanism for SessionStart/Setup/CwdChanged/FileChanged hooks

**agent-platform:**
- Propagate `CLAUDE_EFFORT` from session options

## 6. Hook Output Processing (partial)

| Capability | Claude Code | Agent Stack | Gap |
|-----------|------------|-------------|-----|
| `continue: false` | ✅ Stop entire session | Partial | Core merge and Claude Stop rendering exist; agent-platform hook metadata bridge treats it as an abort signal |
| `stopReason` | ✅ Message on stop | ✅ hooks-mux + Claude renderer | Core merge and Claude Stop reason rendering exist |
| `suppressOutput` | ✅ Hide hook output | ✅ hooks-mux + Claude renderer | MessageDisplay can render empty display content |
| `systemMessage` | ✅ Warning to user | Partial | Exists but not all events |
| `terminalSequence` | ✅ Terminal escape codes | ❌ | Need terminal sequence injection |
| `additionalContext` | ✅ Context for Claude | Partial | Some events only |
| `updatedInput` | ✅ Modify tool input | ✅ hooks-mux + Claude PreToolUse | Adapter/parser alias over canonical `toolMutation`; platform mutation only applies where a live tool invocation can be proven |
| `sessionTitle` | ✅ Set session name | ✅ Claude SessionStart renderer | Existing hook-specific output propagates `sessionTitle` |
| `watchPaths` | ✅ Add file watchers | Deferred | Current daemon watchers have static trigger config and expose no safe dynamic registration API |

### Changes needed

**hooks-mux/core:**
- `src/types/result.ts` — Continue to keep supported output fields as typed top-level fields
- `src/sdk-interface/parser.ts` and `src/merge-engine/merge.ts` — Normalize `updatedInput` to canonical `toolMutation`

**agent-platform:**
- `src/harness/internal/createRun/orchestration/` — Handles hook metadata `continueSession:false` as session abort
- `src/session/` — No new API required for current Claude `sessionTitle`; it is emitted through SessionStart hook-specific output
- `src/harness/` — `updatedInput` remains canonicalized to `toolMutation`; live tool input mutation requires a provable pending tool invocation boundary

**agent-runtime:**
- `src/daemon/` — Dynamic file watcher registration for `watchPaths` remains deferred until watcher handles support safe runtime registration

## 7. Hook Configuration (partial)

| Capability | Claude Code | Agent Stack | Gap |
|-----------|------------|-------------|-----|
| `disableAllHooks` | ✅ Global kill switch | ❌ | Need in hooks-mux config |
| `statusMessage` | ✅ Custom spinner text | ❌ | Need in hook UI |
| `timeout` per hook | ✅ Configurable | ❌ | Need per-hook timeout in runner |
| `shell` selection | ✅ bash/powershell | ❌ | Need in hook command config |
| Header env interpolation | ✅ `$VAR` in headers | ❌ | Need for HTTP handler |
| `allowedEnvVars` | ✅ Restrict env leaks | ❌ | Need for HTTP handler |

### Changes needed

**hooks-mux/core:**
- `src/config.ts` — Add `disableAllHooks` support
- `src/normalizer/runner.ts` — Per-hook timeout, shell selection
- New HTTP handler: header interpolation with allowedEnvVars
