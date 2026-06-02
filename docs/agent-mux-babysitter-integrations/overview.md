# Overview — Agent-Mux Babysitter Integration

## Goal

Allow babysitter processes to discover what agents and models are available in the environment and dispatch work to them. When agent-mux is installed, processes gain access to external agents (claude-code, codex, gemini-cli, copilot, etc.) as first-class task targets alongside the internal tula-core session.

## Architecture

**tasks-mux** is the unified routing hub. The SDK routes ALL task dispatch through tasks-mux, which decides how to resolve each task based on responder type.

```
Process Definition (defineTask)
  │
  ctx.task(myTask)
  │
  ↓ tasks-mux routes by responderType:
  │
  ├─ responderType: "internal"  → tula-core session (direct API)
  ├─ responderType: "human"     → breakpoint → human responder (existing)
  ├─ responderType: "agent"     → agent-mux adapter (claude-code, codex, etc.)
  ├─ responderType: "tracker"   → external issue tracker (Jira, Linear)
  └─ responderType: "auto"      → tasks-mux picks best available
```

This works identically in both modes:
- **Standalone** (tula, agent-platform CLI): tasks-mux resolves directly
- **Plugin** (inside claude-code, codex): tasks-mux resolves agent/tracker tasks internally; host-resolvable tasks delegated via stop-hook

## Capability Layers

### Layer 1: Discovery (SDK)
SDK optionally detects agent-mux and queries available agents/models. This information is injected into process creation context so the LLM can make informed decisions about task routing.

### Layer 2: Task Definition (SDK)
`defineTask` gains `responderType` field. Tasks specify what kind of responder they need — internal, human, agent, tracker, or auto. tasks-mux handles the routing.

### Layer 3: Routing (tasks-mux)
tasks-mux matches tasks to responders based on type, availability, capabilities, and priority. Agent responders wrap agent-mux adapters. Tracker responders wrap external issue tracker APIs. Human responders use existing breakpoint infrastructure.

### Layer 4: Effect Resolution (agent-platform + tasks-mux)
When `orchestrateIteration` encounters a task effect, it delegates to tasks-mux for routing. tasks-mux resolves via the appropriate backend (agent-mux, breakpoint, tracker, internal).

### Layer 5: Process Authoring (SDK + agent-platform)
Process creation prompts include available responders (agents, humans, trackers) when detected. The LLM chooses routing based on task requirements.

## Key Constraint

Agent-mux is **optional**. The SDK must work without it. Discovery returns empty results when agent-mux is not installed. External agent tasks fail with a clear error if agent-mux is unavailable at runtime.

## Packages Affected

| Package | Changes |
|---------|---------|
| `packages/tasks-mux` | Agent responder backend, task router, responder types, agent-mux integration |
| `packages/sdk` | Discovery API, responderType on tasks, route through tasks-mux |
| `packages/agent-platform` | Effect resolution delegates to tasks-mux, process prompt updates |
| `packages/tula-core` | None (internal agent tasks unchanged) |
| `packages/agent-mux` | None (existing run/launch API consumed by tasks-mux) |
| `packages/agent-mux/hooks` | Host tool discovery, capability extensions |

## Non-Goals (This Phase)

- Streaming subagent output back to parent in real-time
- Multi-agent orchestration patterns (group chat, voting across external agents)
- External agent session continuity (each dispatch is a fresh session)
- Cost budget enforcement across external dispatches (tracked but not enforced)
