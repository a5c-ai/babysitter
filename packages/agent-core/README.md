# @a5c-ai/agent-core

Built-in programmatic runtime and agentic tool surface for Babysitter.

## Session options contract

`createAgentCoreSession()` now reflects the agent-mux-backed runtime surface.

Supported runtime knobs:

| Option | Runtime effect |
| --- | --- |
| `workspace` | Forwarded to agent-mux as `cwd`. |
| `model` | Forwarded to agent-mux as `model`. |
| `timeout` | Forwarded to agent-mux as `timeout`. |
| `thinkingLevel` | Translated to agent-mux `thinkingEffort` (`minimal`/`low` -> `low`, `medium` -> `medium`, `high` -> `high`, `xhigh` -> `max`). |
| `systemPrompt` | Becomes the base `systemPrompt`. |
| `appendSystemPrompt` | Appended to the final `systemPrompt` string before dispatch. |
| `uiContext` | Switches run approval mode to `prompt`; when omitted, agent-core uses `yolo`. |
| `backend` | Selects the agent-mux adapter/backend forwarded as `agent`. |

Deprecated compatibility fields:

| Option | Status | Migration note |
| --- | --- | --- |
| `toolsMode` | Deprecated, ignored by `@a5c-ai/agent-core` | Use agent-mux/backend-native configuration, or the PI wrapper in `@a5c-ai/babysitter-agent`, if you still need tool-surface control. |
| `customTools` | Deprecated, ignored by `@a5c-ai/agent-core` | Register host-side tools with `createAgentCoreToolDefinitions()` or use the PI wrapper if you need runtime custom-tool injection. |
| `isolated` | Deprecated, ignored by `@a5c-ai/agent-core` | Use the PI wrapper for extension/skills isolation semantics. |
| `ephemeral` | Deprecated, ignored by `@a5c-ai/agent-core` | Session persistence is determined by the selected agent-mux backend. |
| `bashSandbox` | Deprecated, ignored by `@a5c-ai/agent-core` | Sandbox behavior now belongs to the selected backend. |
| `enableCompaction` | Deprecated, ignored by `@a5c-ai/agent-core` | Compaction now belongs to the selected backend/runtime. |
| `agentDir` | Deprecated, ignored by `@a5c-ai/agent-core` | Configure agent directories through the target backend instead. |

If you still need the PI-era controls above, use the PI wrapper exposed from `@a5c-ai/babysitter-agent` rather than `@a5c-ai/agent-core`.

## Background task lifecycle

Background tasks created through `createAgentCoreToolDefinitions()` are scoped to that returned tool-definition set, not to a module-global singleton. `background_list` and `background_status` only expose tasks started by the same tool-definition array, and `maxBackgroundProcesses` is enforced per scoped registry.

Call `disposeAgentCoreToolDefinitions(definitions)` when the owning run or session ends. That teardown kills any still-running background tasks and releases retained task records, including captured stdout/stderr for completed tasks. If you pass a custom `backgroundRegistry` in the tool options, that registry is caller-owned and you should dispose it yourself.

## Interactive tool contract

`AgentCoreToolOptions.interactive` also gates the delegation tool surface. When
`interactive: false`, the `AskUserQuestion` tool is unavailable even if
`askUserQuestionHandler` is injected. Both simple and structured
`AskUserQuestion` calls return `Error: AskUserQuestion is unavailable when
interactive=false.` and agent-core never invokes the handler.

Host integrations that inject `askUserQuestionHandler` should only expect calls
when `interactive: true`.

## Tool execution and cancellation

`CustomToolDefinition.execute()` now exposes the supported execution contract:

```ts
execute(
  toolCallId: string,
  params: Record<string, unknown>,
  onUpdate?: unknown,
  toolContext?: unknown,
): Promise<ToolResult> | ToolResult
```

Agent-core does not inject a shared `AbortSignal` into custom tools. Tool
authors should only advertise cancellation they actually implement:

- Shell/code tools should bound long-running work with explicit timeouts or
  background-task handles.
- Network tools should use tool-owned `AbortController` or timeout paths and
  convert aborted work into a normal `ToolResult`.
- Rejected promises and synchronous throws are normalized by the wrapper into
  `Error: ...` results. Aborted operations use the canonical message
  `Error: Tool execution was cancelled.`

## Local Build

From the repo root, run:

```bash
npm run build --workspace=@a5c-ai/agent-core
```

This package now builds with `tsc --build` project references for workspace-owned TypeScript packages, and it explicitly invokes the root `build:runtime:agent-core-deps` entrypoint to prepare the `@a5c-ai/agent-mux` SDK surface. A fresh-checkout build no longer depends on prebuilt upstream `dist/` output.

For the full runtime chain used in CI and releases, run:

```bash
npm run build:runtime
```
