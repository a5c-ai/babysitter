# @a5c-ai/tula-core

Tula core programmatic session wrapper and agentic tool surface for Babysitter runtime consumers.

<!-- docs-status:start -->
> Status: Public advanced/runtime package.
> Canonical docs home: [Package and Plugin Docs Map](../../docs/package-and-plugin-map.md).
> This README defines the package contract for runtime consumers and published dependents such as `@a5c-ai/agent-platform`.
<!-- docs-status:end -->

## Package role

`@a5c-ai/tula-core` sits between `@a5c-ai/agent-platform`, `@a5c-ai/agent-mux`, and `@a5c-ai/babysitter-sdk`:

- `createAgentCoreSession()` wraps an `@a5c-ai/agent-mux` client for in-process prompt execution.
- `createAgentCoreToolDefinitions()` assembles the built-in Babysitter-flavored tool surface that host runtimes can inject into planning, resume, or delegated-task flows.
- `@a5c-ai/agent-platform` re-exports these APIs from `src/harness/index.ts`, uses `createAgentCoreSession()` for direct `tula-core` harness invocation in `src/harness/invoker.ts`, and injects tool definitions into plan-process and resume-run flows.
- `@a5c-ai/babysitter-sdk` still owns run directories, journals, task/effect lifecycle, and config defaults. `tula-core` does not replace the SDK orchestration layer.

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
  type AgentCoreImageBase64PromptPart,
  type AgentCoreImageUrlPromptPart,
  type AgentCoreJsonSchema,
  type AgentCoreOutputFormat,
  type AgentCorePromptInput,
  type AgentCorePromptOptions,
  type AgentCorePromptPart,
  type AgentCorePromptResult,
  type AgentCoreSessionEvent,
  type AgentCoreSessionOptions,
  type AgentCoreStructuredOutputOptions,
  type AgentCoreTextPromptPart,
  type AgentCoreToolOptions,
  type CustomToolDefinition,
  type ToolResult,
} from "@a5c-ai/tula-core";
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
- `prompt(input, options?)`: accepts text or multimodal prompt parts and optional structured-output settings.
- `steer(text)`: sends immediate steering text while a prompt is active, or queues it for the next prompt.
- `followUp(text)`: queues a post-response follow-up when streaming, or appends it to the next prompt when idle.
- `getHistory()`: returns a defensive copy of persisted user/assistant turns for the session handle.
- `clearHistory()`: clears persisted user/assistant turns without changing listeners, options, or the current session id.
- `subscribe(listener)`: receives normalized `AgentCoreSessionEvent` payloads, including `session_start`.
- `abort()`: aborts the active run if one is in progress.
- `dispose()`: aborts the active run, clears listeners, and drops queued follow-ups.
- `executeCommand()` / `executeBash()`: local shell helpers scoped to `options.workspace`.
- `sessionId` / `isStreaming`: getters for the active continued session id and current streaming state.

Session behavior that matters to host integrations:

- Agent-core reuses the `sessionId` learned from prior runs, so later prompts continue the same agent-mux session when the backend supports it.
- Agent-core also keeps successful user/assistant turns on the session handle and includes bounded prior history in later direct provider prompts. System prompts are rebuilt from options for each request and are not stored in mutable history.
- Failed prompts, timed-out requests, aborted requests, and malformed streams do not append partial assistant output to history.
- Concurrent `prompt()` calls on the same handle are rejected.
- Event payloads are normalized before subscribers see them. Non-object payloads become `{ type: "unknown", value }`.
- Approval mode is `prompt` only when `uiContext` is present; otherwise tula-core uses `yolo`.

### Supported runtime options

| Option | Runtime effect |
| --- | --- |
| `workspace` | Forwarded to agent-mux as `cwd`. |
| `model` | Forwarded to agent-mux as `model`. |
| `timeout` | Forwarded to agent-mux as `timeout`. |
| `maxHistoryTurns` | Maximum persisted user/assistant history entries retained on the session handle. Defaults to 20. |
| `maxHistoryTokens` | Maximum estimated tokens from prior history sent with a prompt. Uses the package's provider/model-aware rough token estimator and drops oldest entries first. |
| `thinkingLevel` | Translated to agent-mux `thinkingEffort` (`minimal`/`low` -> `low`, `medium` -> `medium`, `high` -> `high`, `xhigh` -> `max`). |
| `systemPrompt` | Used as the base `systemPrompt`. |
| `appendSystemPrompt` | Appended to the final `systemPrompt` before dispatch. |
| `uiContext` | Switches run approval mode to `prompt`; when omitted, tula-core uses `yolo`. |
| `backend` | Selects the agent-mux adapter/backend forwarded as `agent`. |
| `outputFormat` | Optional structured-output mode: `text`, `json_object`, or `json_schema`. |
| `outputSchema` | JSON Schema used when `outputFormat` is `json_schema`. |
| `outputSchemaName` | Provider-visible schema name. Defaults to `agent_core_response`. |
| `outputSchemaStrict` | Provider strictness flag for schema-capable APIs. Defaults to `true` for `json_schema`. |

### Structured Output

Structured output is opt-in. Plain `prompt(text, timeout?)` remains the default and returns only the text output fields used by existing callers.

```ts
const session = createAgentCoreSession({
  model: "gpt-5.5",
  outputFormat: "json_schema",
  outputSchemaName: "answer_payload",
  outputSchema: {
    type: "object",
    required: ["answer"],
    properties: {
      answer: { type: "string" },
    },
  },
});

const result = await session.prompt<{ answer: string }>("Answer as JSON");
if (result.success) {
  console.log(result.parsed?.answer);
} else {
  console.error(result.validationError ?? result.output);
}
```

OpenAI-compatible and Azure endpoints receive `response_format` with either `{ type: "json_object" }` or a `json_schema` payload. Anthropic does not expose the same response-format field through this direct Messages API path, so tula-core injects a system instruction that requires JSON-only output and still parses/validates the returned text locally.

`json_object` requires the model to return a JSON object. `json_schema` requires `outputSchema` and validates the parsed object for common JSON Schema constraints used by this package contract (`type`, `required`, `properties`, `items`, and `enum`). Parse or schema failures return `success: false`, `exitCode: 1`, the raw `output`, and `validationError`.

Prompt-level options can override session defaults:

```ts
const result = await session.prompt<{ ok: boolean }>("Return status", {
  outputFormat: "json_object",
});
```

### Multimodal Input

`prompt()` accepts an array of prompt parts for text plus image URL/base64 input:

```ts
await session.prompt([
  { type: "text", text: "Describe the relevant details in these images." },
  { type: "image_url", imageUrl: "https://example.com/screenshot.png" },
  { type: "image_base64", mediaType: "image/png", data: rawBase64Png },
]);
```

OpenAI-compatible and Azure endpoints receive Chat Completions content parts using `text` and `image_url`. Base64 images are converted to `data:<mediaType>;base64,...` URLs for those providers. Anthropic receives Messages API content blocks with `image` sources using either `url` or `base64`.

Agent-core validates image URLs before dispatch (`http`/`https` only), requires `image/*` media types for base64 images, rejects data URLs in the base64 field, and caps raw base64 image payloads at 20 MiB. Image-bearing `ToolResult` support remains owned by #588; this API only covers direct session prompt input.

### Deprecated compatibility fields

These fields remain on `AgentCoreSessionOptions` for compatibility, but the current runtime ignores them:

| Option | Status | Migration note |
| --- | --- | --- |
| `toolsMode` | Deprecated, ignored by tula-core | Use backend-native configuration, or the PI wrapper in `@a5c-ai/agent-platform`, if you still need tool-surface control. |
| `customTools` | Deprecated, ignored by tula-core | Register host-side tools with `createAgentCoreToolDefinitions()` or use the PI wrapper for runtime custom-tool injection. |
| `isolated` | Deprecated, ignored by tula-core | Use the PI wrapper if you still need extension/skills isolation controls. |
| `ephemeral` | Deprecated, ignored by tula-core | Session persistence is determined by the selected agent-mux backend. |
| `bashSandbox` | Deprecated, ignored by tula-core | Sandbox behavior belongs to the selected backend. |
| `enableCompaction` | Deprecated, ignored by tula-core | Compaction behavior belongs to the selected backend/runtime. |
| `agentDir` | Deprecated, ignored by tula-core | Configure agent directories through the target backend instead. |

If you still need the PI-era controls above, use the PI wrapper exposed from `@a5c-ai/agent-platform` rather than `@a5c-ai/tula-core`.

## Tool-definition API

`createAgentCoreToolDefinitions(options)` returns a wrapped `CustomToolDefinition[]` assembled from:

- file-system tools: `read`, `write`, `edit`, `grep`, `find`
- execution tools: `bash`, `python`, `ssh`, `fetch`
- browser/config tools: `browser`, `config`
- delegation tools: `AskUserQuestion`, `task`, `skill`
- code tools: `calc`, `ast_grep`, `ast_edit`, `render_mermaid`, `notebook`
- background/discovery/web tools: `background_status`, `background_list`, `tool_search`, `tool_fetch`, `web_search`, `fetch_process`
- optional programmatic tool calling: `code_executor` when `programmaticToolCalling` is enabled

The `calc` tool evaluates a constrained arithmetic language only: numeric literals, parentheses, unary `+`/`-`, and `+`, `-`, `*`, `/`, `%`, and `**`. It rejects identifiers, function calls, property access, assignment, malformed expressions, overlong input, and non-finite results. It does not use `eval`, `Function`, shell execution, or external processes.

`AgentCoreToolOptions` controls how those definitions are wired into a host runtime:

- `workspace`: base directory for filesystem and execution tools.
- `interactive`: gates interactive tool behavior.
- `askUserQuestionHandler`, `taskHandler`, `skillHandler`: host-owned handlers for delegated tool calls.
- `onToolUse`: observer callback fired after tool wrapping.
- `onBackgroundComplete`, `maxBackgroundProcesses`, `backgroundRegistry`: background-process lifecycle hooks and limits.
- `deferredToolRegistry`: enables `tool_search` and `tool_fetch`.
- `programmaticToolCalling`: opt-in Code Mode / Programmatic Tool Calling surface. When enabled, `code_executor` runs a bounded JavaScript async body with `tools.<name>(params)` and `callTool(name, params)` helpers for batching existing tula-core tools behind one model-level tool call.

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

Call `resetRunScopedConfig()` between independent runs if your host process reuses the same tula-core module instance and you do not want config overrides to leak across runs.

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

- `@a5c-ai/agent-platform`
  - re-exports the session/tool APIs from `src/harness/index.ts`
  - uses `createAgentCoreSession()` for the direct `tula-core` harness path in `src/harness/invoker.ts`
  - injects `createAgentCoreToolDefinitions()` into plan-process and delegated-task flows in `src/harness/internal/createRun/planProcess/*`
  - uses both session and tool-definition APIs in `src/cli/commands/harness/resumeRun.ts` to inspect and resume existing runs
- `@a5c-ai/agent-mux`
  - provides the actual client, built-in adapters, session continuation, approval mode, and backend selection that tula-core forwards into
- `@a5c-ai/babysitter-sdk`
  - provides config defaults/env wiring used by the `config` tool and remains the owner of orchestration/run-state semantics outside this package

In practice, use `tula-core` when you need an in-process runtime wrapper or bundled tool surface. Use `agent-platform` when you need the higher-level harness CLI/runtime entrypoints.

## Build, test, and CI

From the repo root:

```bash
npm run build --workspace=@a5c-ai/tula-core
npm run test --workspace=@a5c-ai/tula-core
```

The package `build` script invokes the root `build:runtime:tula-core-deps` entrypoint before `tsc --build`, so fresh-checkout builds do not depend on prebuilt upstream `dist/` output.

Package-local `test` runs `vitest` against:

- `src/session.test.ts` for session option/event/continuation behavior
- `src/tools.test.ts` for tool-surface behavior, background-task scoping, AskUserQuestion gating, and helper exports
- `src/deferredToolRegistry.test.ts` for registry search, fetch, cache, and removal behavior

For the shared runtime chain used by release-oriented workflows, run:

```bash
npm run build:runtime
```

Per [Workspace Validation Map](../../docs/workspace-validation.md), `packages/tula-core` is a public advanced/runtime package validated by `.github/workflows/ci.yml` job `test` and by the release/staging workflows. Keep README claims aligned with those validation paths rather than inventing package-specific CI jobs that do not exist.
