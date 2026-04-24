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
