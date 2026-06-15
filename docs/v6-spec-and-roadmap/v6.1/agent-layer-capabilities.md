# Agent Layer Capabilities — What agent-core, agent-runtime, and agent-platform Should Actually Do

The renames and restructuring are plumbing. This document defines the **capabilities** each layer package needs to be a super-capable implementation, grounded in the atlas graph node kind definitions.

## Agent-Core (L4) — The Brain

**Graph node kind:** `AgentCoreImpl`
**Graph attributes:** loopIteratorPolicy, contextManagementStrategy, subagentInvokerPolicy, resultSynthesisPolicy, stopDetectionStrategy, parallelToolCallHandling, streamingFidelity, thinkingChannelHandling

**Current reality:** babysitter-sdk's `runtime/orchestrateIteration.ts` — replay engine + process function execution. Purely orchestration, no intelligence.

**What it should be:**

### Core Loop Engine
- **Multi-strategy loop iteration:** Not just "run process function until effect" — support sequential, concurrent, group-chat, and handoff orchestration patterns (per Microsoft Azure AI agent design patterns)
- **Context window management:** Automatic compaction, sliding window, priority-based context selection. Currently "user-managed" — should offer managed strategies
- **Thinking channel:** First-class thinking/reasoning token handling — route thinking to observer, compress thinking in context, toggle thinking effort per iteration
- **Streaming fidelity:** Full streaming pipeline from model through transport through agent core to presentation — not just "capture stdout"

### Subagent Orchestration
- **Agent-as-tool:** Invoke another agent as a tool call, with typed input/output contract
- **Handoff:** Transfer control from one agent to another with context passing
- **Group chat:** Multiple agents collaborating on a shared context with turn management
- **Delegation with oversight:** Parent agent delegates to child, reviews result, can reject and retry

### Replay & Determinism
- **Stable invocation keys:** (PR #178 — in progress) Deterministic replay across code changes
- **Checkpoint/restore:** Save and restore execution state for long-running processes
- **Speculative execution:** Try multiple paths, keep the best result
- **Time-travel debugging:** Replay to any point in the journal, inspect state

### Context Engineering
- **Structured context injection:** Process-defined context that gets injected into every prompt
- **Memory-augmented prompting:** Pull relevant memories from knowledge fabric into context
- **Tool result summarization:** Compress large tool outputs before injecting into context
- **Dynamic system prompt:** System prompt evolves based on process phase and accumulated context

---

## Agent-Runtime (L5) — The Host

**Graph node kind:** `AgentRuntimeImpl`
**Graph attributes:** daemon, observer, MCP-server surfaces

**Current reality:** `agent-platform` — CLI binary with daemon, observer, MCP server, harness bridge

**What it should be:**

### Process Lifecycle
- **Daemon mode:** Long-running service that manages multiple concurrent runs
- **Hot reload:** Process definitions can be updated without restarting — next iteration uses new code
- **Graceful shutdown:** In-flight effects complete, state is checkpointed, can resume later
- **Health monitoring:** Self-diagnosis, stuck-run detection, automatic recovery

### Session Management
- **Multi-session:** Multiple agent sessions running concurrently with isolated state
- **Session persistence:** Sessions survive process restart (currently: filesystem, target: pluggable backends)
- **Session sharing:** Multiple operators can observe/interact with the same session
- **Session handoff:** Transfer a session from one runtime to another (local → cloud, dev → CI)

### Resource Management
- **Token budgets:** Per-run and per-session token limits with early warning
- **Cost tracking:** Real-time cost accumulation across all model calls in a run
- **Concurrency limits:** Max parallel effects, max parallel runs, queue overflow policy
- **Timeout cascade:** Per-effect, per-iteration, per-run timeouts with escalation

### Observability
- **Structured telemetry:** OpenTelemetry spans for every effect, iteration, model call
- **Live streaming:** Real-time event stream to observer dashboard, mobile, watch
- **Audit log:** Immutable record of every decision, approval, and state change
- **Performance profiling:** Per-effect latency, model response time, replay overhead

### Execution Modes
- **Local:** Current behavior — runs in the host process
- **Docker:** Spawn agent in a container with mounted workspace
- **SSH:** Run agent on a remote machine
- **Kubernetes:** Submit agent run as a K8s Job with resource requests
- **Cloud (managed):** Submit to a5c cloud service

---

## Agent-Platform (L6) — The Ecosystem

**Graph node kind:** `AgentPlatformImpl`
**Graph attributes:** defineTask + plugin/skill registry

**Current reality:** `extensions-adapter` (plugin compiler) + `agent-catalog` (metadata) + agent-platform platform module

**What it should be:**

### Plugin System
- **Hot-loadable plugins:** Plugins can be added/removed/updated without restart
- **Plugin sandboxing:** Each plugin runs with declared permissions, can't access unauthorized resources
- **Plugin marketplace:** Browse, search, install plugins from multiple registries
- **Plugin versioning:** Semantic versioning with compatibility checks and migration scripts
- **Plugin composition:** Plugins can depend on and extend other plugins

### Skill System
- **Skill discovery:** Automatic discovery from local files, installed plugins, remote registries
- **Skill routing:** Intelligent skill selection based on task type, context, and capabilities
- **Skill chaining:** Skills can invoke other skills with typed interfaces
- **Skill marketplace:** Share and distribute skills across teams and organizations
- **Skill testing:** Built-in test harness for skill development

### Process Library
- **Curated library:** Pre-built processes for common workflows (TDD, code review, debugging, etc.)
- **Process composition:** Combine processes with phases, branching, and error handling
- **Process versioning:** Track process evolution with quality scores per version
- **Process recommendation:** Suggest appropriate process based on task description and repo context

### Agent Teams
- **Team composition:** Define teams of agents with roles and responsibilities
- **Team coordination:** Shared context, handoff protocols, conflict resolution
- **Team scaling:** Dynamic team size based on workload
- **Team governance:** Approval chains, escalation paths, authority delegation

### Distribution
- **Cross-harness compilation:** Single plugin → Claude Code + Codex + Gemini + Copilot + Cursor + Pi + OMP + OpenCode + OpenClaw + Hermes (current: extensions-adapter does this)
- **Package publishing:** Automated npm publish with staging/production tags
- **Install verification:** Post-install health check per harness
- **Telemetry:** Plugin usage analytics, error rates, user satisfaction

---

## Implementation Priority

### Tier 1: Core capabilities that unlock everything else

| Capability | Layer | Why first |
|-----------|-------|-----------|
| Multi-strategy loop | L4 | Every other capability depends on a flexible loop |
| Subagent orchestration (agent-as-tool, handoff) | L4 | Enables team agents and complex workflows |
| Token budgets + cost tracking | L5 | Without this, agents burn money unchecked |
| Structured telemetry | L5 | Can't improve what you can't measure |
| Skill routing | L6 | Makes the 2000+ library skills actually discoverable |

### Tier 2: Capabilities that improve quality

| Capability | Layer | Why |
|-----------|-------|-----|
| Context window management | L4 | Long conversations degrade without it |
| Session handoff | L5 | Local dev → CI → cloud workflow |
| Plugin sandboxing | L6 | Security prerequisite for marketplace |
| Process recommendation | L6 | Reduces onboarding friction |
| Docker/SSH execution | L5 | Sandboxed execution for untrusted code |

### Tier 3: Capabilities that enable scale

| Capability | Layer | Why |
|-----------|-------|-----|
| Group chat / team agents | L4+L6 | Multi-agent collaboration |
| Speculative execution | L4 | Parallel exploration |
| K8s execution | L5 | Cloud-native scaling |
| Plugin marketplace | L6 | Ecosystem growth |
| Memory-augmented prompting | L4+L12 | Long-term learning |

---

## Mapping to Process Phases

The v6.1-graph-alignment.mjs process should be extended with:

| New Phase | Capabilities | Depends On |
|-----------|-------------|------------|
| Phase 6: Core loop upgrade | Multi-strategy loop, subagent orchestration, context management | Phase 1.3 (adapters decomposition) |
| Phase 7: Runtime hardening | Token budgets, cost tracking, health monitoring, graceful shutdown | Phase 3.1 (lifecycle), Phase 2.1 (tools-adapter) |
| Phase 8: Platform maturation | Skill routing, process recommendation, plugin sandboxing | Phase 1.1 (extensions-adapter), Phase 1.2 (tasks-adapter) |
| Phase 9: Execution modes | Docker, SSH, K8s execution | Phase 3.1 (9-state lifecycle) |
| Phase 10: Team agents | Group chat, delegation, coordination | Phase 6 (core loop) |
