# Plugin Mode — Babysitter SDK Running Inside Host Agents

## Summary

When babysitter runs as a plugin inside another agent (claude-code, codex, gemini-cli, copilot), the SDK operates in "plugin mode" — effects are delegated to the host agent, capabilities are discovered via environment variables, and the hook lifecycle is driven by hooks-mux.

This document covers gaps in the plugin integration surface and what's needed to enable cross-agent dispatch from within plugin mode.

## Current Architecture

```
Host Agent (claude-code, codex, etc.)
  ↓ turn.stop hook fires
hooks-mux adapter (per-agent normalizer)
  ↓ injects AGENT_CAPABILITIES_JSON + AGENT_SESSION_ID
Babysitter SDK (unified adapter)
  ↓ runs process iteration
  ↓ ctx.task() creates effects → throws EffectRequestedError
  ↓ stop-hook handler: {"decision": "block", "pendingEffects": [...]}
hooks-mux renders response back to host
  ↓
Host agent resolves effects (file edits, bash, etc.)
  ↓ calls babysitter MCP server task_post
SDK journals resolution → next iteration
```

## Gaps

### 1. No agent-mux dispatch from plugin mode

**Current:** When babysitter runs as a plugin inside claude-code, it can only delegate effects to claude-code itself. It cannot ask codex or gemini-cli to do something.

**Needed:** Process definitions running in plugin mode should be able to create `external: true` agent tasks that dispatch through agent-mux, just like the standalone omni path.

**Implementation:**
- The stop-hook handler must distinguish between "host-resolvable" effects and "external agent" effects
- Host-resolvable effects: file edits, bash, breakpoints → delegated to host agent
- External agent effects: `kind: "agent", agent.external: true` → resolved by babysitter itself via agent-mux
- The SDK's `stopHookHandler.ts` needs a branch: if effect is external-agent, resolve it internally before returning control to host

**Files affected:**
- `packages/sdk/src/harness/hooks/stopHookHandler.ts:152-186` — detect external effects
- `packages/sdk/src/harness/hooks/stopHookContinuation.ts` — include external dispatch results
- `packages/agent-platform/src/harness/internal/createRun/orchestration/externalAgentEffect.ts` — shared resolution logic

### 2. No host tool discovery

**Current:** The SDK knows the host agent's *capabilities* (file-edit, bash, browser) via `AGENT_CAPABILITIES_JSON`, but doesn't know the specific *tools* available.

**Needed:** The SDK should be able to query the host agent's tool inventory so process definitions can make informed decisions about what to delegate vs. what to dispatch externally.

**Implementation:**
- Extend `AGENT_CAPABILITIES_JSON` to include tool inventory (or add `AGENT_TOOLS_JSON`)
- hooks-mux adapters would populate this from the host agent's tool list
- SDK's promptContext would include available host tools

**Files affected:**
- `packages/hooks-mux/core/src/types/adapter.ts` — extend AdapterCapabilities
- `packages/hooks-mux/adapter-claude/src/adapter.ts` — populate tool list
- `packages/sdk/src/harness/unified/capabilities.ts` — parse tool inventory
- `packages/sdk/src/harness/unified/promptContext.ts` — include in process context

### 3. No effect cancellation from host

**Current:** Host agent can resolve effects via `task_post` but cannot cancel pending effects.

**Needed:** `task_cancel` MCP tool so the host agent can abandon effects it can't or doesn't want to resolve.

**Files affected:**
- `packages/sdk/src/mcp/tools/tasks.ts` — add `task_cancel` tool
- `packages/sdk/src/runtime/intrinsics/task.ts` — handle cancellation in journal

### 4. No cross-plugin coordination

**Current:** Each plugin instance is isolated. Babysitter plugin in claude-code can't coordinate with babysitter plugin in codex running in a different session.

**Needed (future):** Shared task queue across plugin instances via tasks-mux. When babysitter in claude-code creates a breakpoint, a babysitter instance in codex could pick it up.

**Files affected:**
- `packages/tasks-mux/src/backend.ts` — backend needs multi-session support
- `packages/sdk/src/harness/hooks/stopHookHandler.ts` — check for cross-session tasks

### 5. Subprocess support in plugin mode

**Current:** `subprocessSupport` is set to `"agent-platform"` only when agent-platform drives orchestration. In plugin mode, subprocess effects are blocked.

**Needed:** Plugin mode should support subprocess effects by spawning them locally (the plugin process has access to the workspace).

**Files affected:**
- `packages/sdk/src/runtime/intrinsics/subprocess.ts:53-54` — remove agent-platform gate
- `packages/sdk/src/runtime/types.ts:228-229` — extend subprocess support detection

### 6. Process creation context lacks host agent identity

**Current:** Process creation prompts mention harness capabilities but don't clearly state "you are running inside claude-code" or "codex is your host."

**Needed:** The process definition prompt should explicitly say what agent it's running inside, what that agent can do, and what it can't do. This helps the LLM choose between host delegation and external dispatch.

**Files affected:**
- `packages/agent-platform/src/harness/internal/createRun/planProcess/phase.ts` — inject host identity
- `packages/agent-platform/src/harness/internal/createRun/prompts.ts` — host-aware prompt section

## Integration with External Agent Tasks

When an external agent task is dispatched from plugin mode:

```
Process running in claude-code plugin:
  ctx.task(externalCodexTask)  // kind: "agent", external: true, adapter: "codex"
    ↓
  SDK creates effect with externalDispatch: true
    ↓
  Stop-hook handler detects external effect
    ↓
  Instead of delegating to host, resolves internally:
    - Checks agent-mux availability
    - Calls amuxBridge.invokeViaAgentMux("codex", { prompt, model })
    - Journals result + cost
    ↓
  Returns to host with external effect already resolved
    ↓
  Host sees only remaining host-resolvable effects
```

This means external dispatch is **transparent to the host agent** — the host never needs to know about agent-mux.

## Test Strategy

| Test | Description |
|------|-------------|
| Plugin stop-hook with external effects | Mock host hook → SDK creates external effect → verify it's resolved internally, not delegated to host |
| Plugin stop-hook with mixed effects | Some host-resolvable + some external → verify external resolved, host effects returned |
| Host tool discovery | Mock AGENT_CAPABILITIES_JSON with tools → verify promptContext includes them |
| task_cancel MCP tool | Cancel a pending effect → verify journal has cancellation event |
| Subprocess in plugin mode | Create subprocess effect in plugin mode → verify it works (currently blocked) |
