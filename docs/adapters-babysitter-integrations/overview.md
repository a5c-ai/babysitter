# Overview — Agent-Adapter Babysitter Integration

## Goal

Allow babysitter processes to discover what agents and models are available in the environment and dispatch work to them. When adapters is installed, processes gain access to external agents (claude-code, codex, gemini-cli, copilot, etc.) as first-class task targets alongside the internal genty-core session.

## Architecture

**tasks-adapter** is the unified routing hub. The SDK routes ALL task dispatch through tasks-adapter, which decides how to resolve each task based on responder type.

```
Process Definition (defineTask)
  │
  ctx.task(myTask)
  │
  ↓ tasks-adapter routes by responderType:
  │
  ├─ responderType: "internal"  → genty-core session (direct API)
  ├─ responderType: "human"     → breakpoint → human responder (existing)
  ├─ responderType: "agent"     → adapters adapter (claude-code, codex, etc.)
  ├─ responderType: "tracker"   → external issue tracker (Jira, Linear)
  └─ responderType: "auto"      → tasks-adapter picks best available
```

This works identically in both modes:
- **Standalone** (genty, agent-platform CLI): tasks-adapter resolves directly
- **Plugin** (inside claude-code, codex): tasks-adapter resolves agent/tracker tasks internally; host-resolvable tasks delegated via stop-hook

## Capability Layers

### Layer 1: Discovery (SDK)
SDK optionally detects adapters and queries available agents/models. This information is injected into process creation context so the LLM can make informed decisions about task routing.

### Layer 2: Task Definition (SDK)
`defineTask` gains `responderType` field. Tasks specify what kind of responder they need — internal, human, agent, tracker, or auto. tasks-adapter handles the routing.

### Layer 3: Routing (tasks-adapter)
tasks-adapter matches tasks to responders based on type, availability, capabilities, and priority. Agent responders wrap adapters adapters. Tracker responders wrap external issue tracker APIs. Human responders use existing breakpoint infrastructure.

### Layer 4: Effect Resolution (agent-platform + tasks-adapter)
When `orchestrateIteration` encounters a task effect, it delegates to tasks-adapter for routing. tasks-adapter resolves via the appropriate backend (adapters, breakpoint, tracker, internal).

### Layer 5: Process Authoring (SDK + agent-platform)
Process creation prompts include available responders (agents, humans, trackers) when detected. The LLM chooses routing based on task requirements.

## Key Constraint

Adapters is **optional**. The SDK must work without it. Discovery returns empty results when adapters is not installed. External agent tasks fail with a clear error if adapters is unavailable at runtime.

## Packages Affected

| Package | Changes |
|---------|---------|
| `packages/tasks-adapter` | Agent responder backend, task router, responder types, adapters integration |
| `packages/babysitter-sdk` | Discovery API, responderType on tasks, route through tasks-adapter |
| `packages/genty/platform` | Effect resolution delegates to tasks-adapter, process prompt updates |
| `packages/genty/core` | None (internal agent tasks unchanged) |
| `packages/adapters` | None (existing run/launch API consumed by tasks-adapter) |
| `packages/adapters/hooks` | Host tool discovery, capability extensions |

## Non-Goals (This Phase)

- Streaming subagent output back to parent in real-time
- Multi-agent orchestration patterns (group chat, voting across external agents)
- External agent session continuity (each dispatch is a fresh session)
- Cost budget enforcement across external dispatches (tracked but not enforced)
