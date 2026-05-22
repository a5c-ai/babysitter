# @a5c-ai/agent-core

Built-in programmatic session wrapper and agentic tool surface for Babysitter runtime consumers.

<!-- docs-status:start -->
> Status: Public advanced/runtime package.
> Canonical docs home: [Package and Plugin Docs Map](../../docs/package-and-plugin-map.md).
> This README defines the package contract for runtime consumers and published dependents such as `@a5c-ai/babysitter-agent`.
<!-- docs-status:end -->

## Package role

`@a5c-ai/agent-core` sits between `@a5c-ai/babysitter-agent`, `@a5c-ai/agent-mux`, and `@a5c-ai/babysitter-sdk`:

- `createAgentCoreSession()` wraps an `@a5c-ai/agent-mux` client for in-process prompt execution.
- `createAgentCoreToolDefinitions()` assembles the built-in Babysitter-flavored tool surface that host runtimes can inject into planning, resume, or delegated-task flows.
- `@a5c-ai/babysitter-agent` re-exports these APIs from `src/harness/index.ts`, uses `createAgentCoreSession()` for direct `agent-core` harness invocation in `src/harness/invoker.ts`, and injects tool definitions into plan-process and resume-run flows.
- `@a5c-ai/babysitter-sdk` still owns run directories, journals, task/effect lifecycle, and config defaults. `agent-core` does not replace the SDK orchestration layer.

This package is published as a runtime dependency surface for higher-level Babysitter runtimes. It is still an advanced/operator-facing building block rather than the primary entrypoint for new users.

## Root exports

The package root exports the runtime surface assembled from `src/index.ts` and `src/tools.ts`:

```ts
import {
  AGENT_CORE_TOOL_NAMES,
  AgentCoreSessionHandle,
  DeferredToolRegistry,
  createAgentCoreSession,
  createAgentCoreToolDefinitions,
  disposeAgentCoreToolDefinitions,
  extractTextFromHtml,
  filterByRelevance,
  parseSearchResults,
  resetRunScopedConfig,
  stripHtmlTags,
  type AgentCoreEventListener,
  type AgentCorePromptResult,
  type AgentCoreSessionEvent,
  type AgentCoreSessionOptions,
  type AgentCoreToolOptions,
  type CustomToolDefinition,
  type ToolResult,
} from "@a5c-ai/agent-core";
```

Key exports:

- `createAgentCoreSession(options)` / `AgentCoreSessionHandle`: programmatic session API backed by `@a5c-ai/agent-mux`.
- `createAgentCoreToolDefinitions(options)` / `disposeAgentCoreToolDefinitions(definitions)`: built-in tool-definition assembly and teardown.
- `DeferredToolRegistry`: lazy registry for searchable/fetchable external tool schemas.
- `AGENT_CORE_TOOL_NAMES`: canonical bundled tool name list.
- `AgenticToolOptions` and `AGENTIC_TOOL_NAMES`: compatibility aliases for older host integrations.
- `resetRunScopedConfig()`: clears run-scoped state used by the `config` tool.
- `parseSearchResults()`, `stripHtmlTags()`, `extractTextFromHtml()`, `filterByRelevance()`: helper exports used by web/search integrations.

## Session API

`createAgentCoreSession()` returns an `AgentCoreSessionHandle` that wraps a shared `@a5c-ai/agent-mux` client with built-in adapters registered once per process.

Core handle methods:

- `initialize()`: currently a no-op placeholder for compatibility.
- `prompt(text, timeout?)`: starts a run, streams events to subscribers, and returns `{ output, duration, success, exitCode }`.
- `steer(text)`: sends immediate steering text while a prompt is active, or queues it for the next prompt.
- `followUp(text)`: queues a post-response follow-up when streaming, or appends it to the next prompt when idle.
- `subscribe(listener)`: receives normalized `AgentCoreSessionEvent` payloads, including `session_start`.
- `abort()`: aborts the active run if one is in progress.
- `dispose()`: aborts the active run, clears listeners, and drops queued follow-ups.
- `executeCommand()` / `executeBash()`: local shell helpers scoped to `options.workspace`.
- `sessionId` / `isStreaming`: getters for the active continued session id and current streaming state.

Session behavior that matters to host integrations:

- Agent-core reuses the `sessionId` learned from prior runs, so later prompts continue the same agent-mux session when the backend supports it.
- Concurrent `prompt()` calls on the same handle are rejected.
- Event payloads are normalized before subscribers see them. Non-object payloads become `{ type: "unknown", value }`.
- Approval mode is `prompt` only when `uiContext` is present; otherwise agent-core uses `yolo`.

### Supported runtime options

| Option | Runtime effect |
| --- | --- |
| `workspace` | Forwarded to agent-mux as `cwd`. |
| `model` | Forwarded to agent-mux as `model`. |
| `timeout` | Forwarded to agent-mux as `timeout`. |
| `thinkingLevel` | Translated to agent-mux `thinkingEffort` (`minimal`/`low` -> `low`, `medium` -> `medium`, `high` -> `high`, `xhigh` -> `max`). |
| `systemPrompt` | Used as the base `systemPrompt`. |
| `appendSystemPrompt` | Appended to the final `systemPrompt` before dispatch. |
| `uiContext` | Switches run approval mode to `prompt`; when omitted, agent-core uses `yolo`. |
| `backend` | Selects the agent-mux adapter/backend forwarded as `agent`. |

### Deprecated compatibility fields

These fields remain on `AgentCoreSessionOptions` for compatibility, but the current runtime ignores them:

| Option | Status | Migration note |
| --- | --- | --- |
| `toolsMode` | Deprecated, ignored by agent-core | Use backend-native configuration, or the PI wrapper in `@a5c-ai/babysitter-agent`, if you still need tool-surface control. |
| `customTools` | Deprecated, ignored by agent-core | Register host-side tools with `createAgentCoreToolDefinitions()` or use the PI wrapper for runtime custom-tool injection. |
| `isolated` | Deprecated, ignored by agent-core | Use the PI wrapper if you still need extension/skills isolation controls. |
| `ephemeral` | Deprecated, ignored by agent-core | Session persistence is determined by the selected agent-mux backend. |
| `bashSandbox` | Deprecated, ignored by agent-core | Sandbox behavior belongs to the selected backend. |
| `enableCompaction` | Deprecated, ignored by agent-core | Compaction behavior belongs to the selected backend/runtime. |
| `agentDir` | Deprecated, ignored by agent-core | Configure agent directories through the target backend instead. |

If you still need the PI-era controls above, use the PI wrapper exposed from `@a5c-ai/babysitter-agent` rather than `@a5c-ai/agent-core`.

## Tool-definition API

`createAgentCoreToolDefinitions(options)` returns a wrapped `CustomToolDefinition[]` assembled from:

- file-system tools: `read`, `write`, `edit`, `grep`, `find`
- execution tools: `bash`, `python`, `ssh`, `fetch`
- browser/config tools: `browser`, `config`
- delegation tools: `AskUserQuestion`, `task`, `skill`
- code tools: `calc`, `ast_grep`, `ast_edit`, `render_mermaid`, `notebook`
- background/discovery/web tools: `background_status`, `background_list`, `tool_search`, `tool_fetch`, `web_search`, `fetch_process`
- optional programmatic tool calling: `code_executor` when `programmaticToolCalling` is enabled

`AgentCoreToolOptions` controls how those definitions are wired into a host runtime:

- `workspace`: base directory for filesystem and execution tools.
- `interactive`: gates interactive tool behavior.
- `askUserQuestionHandler`, `taskHandler`, `skillHandler`: host-owned handlers for delegated tool calls.
- `onToolUse`: observer callback fired after tool wrapping.
- `onBackgroundComplete`, `maxBackgroundProcesses`, `backgroundRegistry`: background-process lifecycle hooks and limits.
- `deferredToolRegistry`: enables `tool_search` and `tool_fetch`.
- `programmaticToolCalling`: opt-in Code Mode / Programmatic Tool Calling surface. When enabled, `code_executor` runs a bounded JavaScript async body with `tools.<name>(params)` and `callTool(name, params)` helpers for batching existing agent-core tools behind one model-level tool call.

Example:

```ts
const tools = createAgentCoreToolDefinitions({
  workspace: process.cwd(),
  interactive: false,
  deferredToolRegistry,
  programmaticToolCalling: { maxToolCalls: 10, timeout: 60_000 },
});
```

### Interactive and cancellation contract

- `interactive: false` disables `AskUserQuestion` even if `askUserQuestionHandler` is supplied. Both simple and structured calls return `Error: AskUserQuestion is unavailable when interactive=false.` and the handler is never invoked.
- `CustomToolDefinition.execute()` does not receive a shared `AbortSignal`. Long-running tools must own their own timeout/cancellation behavior.
- Synchronous throws and rejected promises are normalized into `Error: ...` tool results.
- Timeout-driven aborts are normalized to `Error: Tool execution was cancelled.`

### Background-task lifecycle caveats

Background tasks are scoped to the returned tool-definition array, not to a module-global singleton.

- `background_list` and `background_status` only expose tasks started by that same definition set.
- `maxBackgroundProcesses` is enforced per scoped registry.
- `disposeAgentCoreToolDefinitions(definitions)` kills still-running background tasks and clears retained stdout/stderr/task records for that definition set.
- If you inject a custom `backgroundRegistry`, ownership moves to the caller and you must dispose it yourself.

### Config tool state

The `config` tool reads Babysitter defaults from `@a5c-ai/babysitter-sdk` and also supports run-scoped in-memory overrides plus selected global env-var writes.

Call `resetRunScopedConfig()` between independent runs if your host process reuses the same agent-core module instance and you do not want config overrides to leak across runs.

## DeferredToolRegistry API

`DeferredToolRegistry` is the package's lazy schema registry for non-bundled tools.

Typical flow:

1. Register tier-1 entries with `registerTools()`.
2. Register per-source loaders with `registerLoader()`.
3. Use `tool_search` or `searchTools()` for lightweight discovery by name/description.
4. Use `tool_fetch` or `fetchSchema()` to lazily load and cache a full schema.

Useful methods:

- `registerTools(entries)`
- `registerLoader(source, loader)`
- `getAllEntries()`
- `getEntriesBySource(source, sourceQualifier?)`
- `searchTools(query, maxResults?)`
- `fetchSchema(toolName, source?, sourceQualifier?)`
- `removeToolsBySource(source, sourceQualifier?)`
- `clear()`
- `size` / `loadedSchemaCount`

Source disambiguation uses `(source, sourceQualifier, name)`, so duplicate tool names from different MCP servers or plugins can coexist safely.

## Integration points

Current downstream integration boundaries in this repo:

- `@a5c-ai/babysitter-agent`
  - re-exports the session/tool APIs from `src/harness/index.ts`
  - uses `createAgentCoreSession()` for the direct `agent-core` harness path in `src/harness/invoker.ts`
  - injects `createAgentCoreToolDefinitions()` into plan-process and delegated-task flows in `src/harness/internal/createRun/planProcess/*`
  - uses both session and tool-definition APIs in `src/cli/commands/harness/resumeRun.ts` to inspect and resume existing runs
- `@a5c-ai/agent-mux`
  - provides the actual client, built-in adapters, session continuation, approval mode, and backend selection that agent-core forwards into
- `@a5c-ai/babysitter-sdk`
  - provides config defaults/env wiring used by the `config` tool and remains the owner of orchestration/run-state semantics outside this package

In practice, use `agent-core` when you need an in-process runtime wrapper or bundled tool surface. Use `babysitter-agent` when you need the higher-level harness CLI/runtime entrypoints.

## Build, test, and CI

From the repo root:

```bash
npm run build --workspace=@a5c-ai/agent-core
npm run test --workspace=@a5c-ai/agent-core
```

The package `build` script invokes the root `build:runtime:agent-core-deps` entrypoint before `tsc --build`, so fresh-checkout builds do not depend on prebuilt upstream `dist/` output.

Package-local `test` runs `vitest` against:

- `src/session.test.ts` for session option/event/continuation behavior
- `src/tools.test.ts` for tool-surface behavior, background-task scoping, AskUserQuestion gating, and helper exports
- `src/deferredToolRegistry.test.ts` for registry search, fetch, cache, and removal behavior

For the shared runtime chain used by release-oriented workflows, run:

```bash
npm run build:runtime
```

Per [Workspace Validation Map](../../docs/workspace-validation.md), `packages/agent-core` is a public advanced/runtime package validated by `.github/workflows/ci.yml` job `test` and by the release/staging workflows. Keep README claims aligned with those validation paths rather than inventing package-specific CI jobs that do not exist.
