# Adapter Architecture — Graph vs Packages Deep Dive

The Atlas graph defines **9 canonical muxes** as the bridging abstractions of the a5c agent stack. Each adapter normalizes one concern across all supported agent products. This document maps each graph adapter to its implementing package(s) and identifies concrete gaps.

## The 9 Canonical Muxes (from `extensions/muxes/canonical-muxes.yaml`)

| Graph Adapter | Protocol Type | Canonical Side | Package(s) |
|-----------|--------------|----------------|------------|
| `agent-launch-adapter` | spawn | InvocationOptions → SpawnArgs → lifecycle | `adapters-cli` (launch.ts) |
| `agent-comm-adapter` | event-stream | Harness-specific events → canonical shape | `agent-comm-adapter` (client.ts) |
| `agent-config-adapter` | config | Per-agent config/auth/install → unified ops | `adapters-cli` (install.ts), `adapters-adapters` |
| `hooks-adapter` | lifecycle-hook | Native hook names → canonical taxonomy | `hooks-adapter-cli`, `hooks-adapter-core`, `hooks-adapter-adapter-*` |
| `transport-adapter` | inference | Wire protocols → canonical request/response | `transport-adapter` |
| `extensions-adapter` | plugin | Portable Extension → per-agent native formats | `extensions-adapter` |
| `session-storage-adapter` | storage | Session files at rest | `babysitter-sdk` (session module) |
| `tasks-adapter` | approval | Trust chain for breakpoint answers | `tasks-adapter` |
| `tools-adapter` | tool-dispatch | Tool calls across MCP, CLI, hooks | No dedicated package |

---

## Adapter-to-Package Detailed Mapping

### 1. agent-launch-adapter → `adapters-cli/src/commands/launch.ts`

**Graph description:** Spawns and supervises Invocations across all supported agent products. Owns the 9-state Invocation lifecycle (spawned → running → paused → interrupted → aborted | timed-out | completed | crashed | killed).

**Bridging concerns (from graph):**
- spawn args per agent (positional prompt vs --prompt, model flag formats)
- env-var conventions per agent (ANTHROPIC_API_KEY vs OPENAI_API_KEY)
- working-directory mapping
- subprocess management (Unix pgroups vs Windows Job Objects)
- signal propagation
- retry policy and lifecycle hooks
- min-version enforcement (semver gate)
- execution-mode dispatch (local / docker / ssh / k8s / cloud)

**Implementation reality:**
- `launch.ts` is ~1600 lines handling spawn, proxy, PTY, bridge modes
- Adapter-specific args come from `agent-catalog` graph data (getYoloLaunchArgs, getLaunchConfig)
- Subprocess management: Unix pgroups ✅, Windows Job Objects ❌ (uses taskkill)
- Signal propagation: basic SIGTERM/SIGKILL ✅, SSH/docker/k8s ❌
- Retry policy: not implemented
- Min-version enforcement: not implemented
- Execution-mode dispatch: local only, no docker/ssh/k8s

**Gaps:**
| ID | Severity | Gap |
|----|----------|-----|
| M-LAUNCH-01 | S2 | No 9-state lifecycle — only spawned/running/completed/crashed |
| M-LAUNCH-02 | S2 | No retry policy — process crash = immediate failure |
| M-LAUNCH-03 | S4 | No remote execution modes (docker, ssh, k8s) |
| M-LAUNCH-04 | S2 | Windows subprocess management uses taskkill instead of Job Objects |
| M-LAUNCH-05 | S3 | No semver min-version gate — any installed version is accepted |

---

### 2. agent-comm-adapter → `agent-comm-adapter/src/client.ts`

**Graph description:** Bridges every in-flight event shape. Channels are absorbed here because the underlying primitive is a structured communication channel between two participants.

**Implementation reality:**
- `AgentMuxClient` in agent-comm-adapter handles event streaming
- Events are normalized to a common shape across harnesses
- Session-flow projections in adapters-ui consume these events

**Gaps:**
| ID | Severity | Gap |
|----|----------|-----|
| M-COMM-01 | S3 | Graph defines "Channel" concept; code uses "event stream" — no first-class Channel abstraction |
| M-COMM-02 | S2 | Event schema not formalized — each adapter emits slightly different shapes |

---

### 3. agent-config-adapter → `adapters-cli` + `adapters-adapters`

**Graph description:** Wraps each agent's idiosyncratic config/auth/install conventions into one set of operations callable from orchestrator or user.

**Implementation reality:**
- `install.ts` handles install/uninstall/update/detect per adapter
- Each adapter in `adapters-adapters` defines install methods, config paths
- `agent-catalog` provides install metadata from the graph

**Gaps:**
| ID | Severity | Gap |
|----|----------|-----|
| M-CONFIG-01 | S2 | Install error reporting is opaque — `installed: false` with no error details (#207) |
| M-CONFIG-02 | S2 | Windows shell spawn issue — `spawn('npm')` needs `shell: true` (fixed) |
| M-CONFIG-03 | S3 | No unified auth verification — each adapter has its own auth check |

---

### 4. hooks-adapter → `hooks-adapter-cli` + `hooks-adapter-core` + `hooks-adapter-adapter-*`

**Graph description:** Bridges per-product native hook names to the canonical hook taxonomy + applies per-axis merge policies.

**Implementation reality:**
- hooks-adapter-core: canonical hook taxonomy, merge policies
- hooks-adapter-cli: CLI binary (`a5c-hooks-adapter invoke`)
- 10 adapter packages: claude, codex, gemini, copilot, cursor, pi, oh-my-pi, opencode, openclaw, hermes

**Gaps:**
| ID | Severity | Gap |
|----|----------|-----|
| M-HOOKS-01 | S2 | Version hash inconsistency — adapters published with different SHA lengths |
| M-HOOKS-02 | S2 | Hook script path resolution — `.codex/hooks/` vs `./hooks/` (fixed) |
| M-HOOKS-03 | S2 | npx install failures block hooks in CI — binary must be on PATH |
| M-HOOKS-04 | S3 | Channel concept from graph not reflected in hook API |

---

### 5. transport-adapter → `transport-adapter`

**Graph description:** Bridges between concrete LLM wire protocols and one canonical inference request/response shape. Adding a new native impl is a Catalog edit.

**Implementation reality:**
- HTTP proxy translating between exposed transport (what harness speaks) and target transport (what provider expects)
- Supports: OpenAI Chat, OpenAI Responses, Anthropic, Google, Bedrock
- Codec architecture planned but incomplete

**Gaps:**
| ID | Severity | Gap |
|----|----------|-----|
| M-TRANSPORT-01 | S2 | Codec refactor incomplete — tool schema translation not implemented |
| M-TRANSPORT-02 | S2 | Codex websocket bypass (#200) — WS connections don't go through proxy |
| M-TRANSPORT-03 | S2 | Cost/token normalization not end-to-end |
| M-TRANSPORT-04 | S3 | No streaming codec — SSE/NDJSON translation is ad-hoc |

---

### 6. extensions-adapter → `extensions-adapter`

**Graph description:** Compiles one Portable Extension manifest into per-agent native formats via per-target generators.

**Implementation reality:**
- Mature compiler: plugin.json → 10 target formats (claude-code, codex, gemini, etc.)
- Handles hooks, skills, commands, agents, settings per target
- sharedSets for per-harness overrides

**Gaps:**
| ID | Severity | Gap |
|----|----------|-----|
| M-EXTENSION-01 | S3 | Graph uses "extensions-adapter"; package is "extensions-adapter" — naming mismatch |
| M-EXTENSION-02 | S3 | "Portable Extension" concept exists in graph but API is "plugin manifest" in code |

---

### 7. session-storage-adapter → `babysitter-sdk` (session module)

**Graph description:** Unified abstraction for reading and writing session files at rest.

**Implementation reality:**
- `packages/babysitter-sdk/src/session/` handles init, associate, resume, update, state
- YAML frontmatter session state management
- Tied to `.a5c/` state directory

**Gaps:**
| ID | Severity | Gap |
|----|----------|-----|
| M-SESSION-01 | S2 | No session storage backend abstraction — filesystem only |
| M-SESSION-02 | S2 | Session resume writes to wrong path (#138) |
| M-SESSION-03 | S3 | Graph concept is "adapter" (multiple backends); implementation is single-backend |

---

### 8. tasks-adapter → `tasks-adapter`

**Graph description:** The lone live Trust Chain primitive — ProvenBreakpointAnswer signs decision answers with the named Authority of the responder. Bridges every backend (Linear, GitHub, Slack, etc.)

**Implementation reality:**
- tasks-adapter: pluggable backends, cryptographic signing
- Server-backed breakpoint routing
- MCP integration for remote approval

**Gaps:**
| ID | Severity | Gap |
|----|----------|-----|
| M-TASKS-01 | S3 | Graph name "tasks-adapter" ≠ package name "tasks-adapter" |
| M-TASKS-02 | S4 | Linear, Slack backends mentioned in graph — not implemented |

---

### 9. tools-adapter → **No dedicated package**

**Graph description:** CLI→MCP gateway, CLI→MCP gateway, and tool-level hooks layered on hooks-adapter PreToolUse / PostToolUse.

**Implementation reality:**
- Tool dispatch is embedded in agent-comm-adapter and agent-platform
- MCP tool serving is in babysitter-sdk (mcp module)
- No unified tools-adapter abstraction

**Gaps:**
| ID | Severity | Gap |
|----|----------|-----|
| M-TOOL-01 | S2 | No dedicated package — tool dispatch scattered across 3 packages |
| M-TOOL-02 | S2 | No tool schema translation (MCP ↔ OpenAI function calling ↔ Anthropic tools) |
| M-TOOL-03 | S3 | Tool routing policies (which tool server for which tool) are implicit |

---

## Agent Stack Implementation Layers (L4-L6)

### agent-core vs agent-comm-adapter vs agent-platform

The graph defines three implementation node kinds for the agent stack:

| Node Kind | Layer | Package | Role |
|-----------|-------|---------|------|
| AgentCoreImpl | L4 | `agent-core` | Unified agent loop (babysitter-native) |
| AgentRuntimeImpl | L5 | `agent-platform` | Host process, CLI, seam contracts |
| AgentPlatformImpl | L6 | `extensions-adapter` + `agent-catalog` | Extensions, distribution, ecosystem |

But `agent-comm-adapter` also implements L4-L5 concerns (event dispatch, session management, adapter registry) without being an "AgentCoreImpl" in the graph.

**Gap:** `agent-comm-adapter` is the de facto agent core for harness-mediated scenarios but isn't represented as an AgentCoreImpl in the graph. The graph has `agent:adapters` as an AgentProduct but its internal decomposition (core/cli/adapters/gateway/tui/ui) isn't modeled.

### Package Decomposition vs Graph Model

| adapters Package | Graph Adapter | Graph Layer | Notes |
|-------------------|-----------|-------------|-------|
| agent-comm-adapter | agent-comm-adapter | L4-L5 | Event streaming, client, types |
| adapters-cli | agent-launch-adapter + agent-config-adapter | L5-L10 | Launch, install, detect |
| adapters-adapters | (part of agent-config-adapter) | L5 | Per-harness adapters |
| adapters-gateway | (no direct adapter) | L6 | Remote API surface |
| adapters-tui | (no direct adapter) | L11 | TUI presentation |
| adapters-ui | (no direct adapter) | L11 | Shared UI |
| adapters-webui | (no direct adapter) | L11 | Web presentation |
| adapters-observability | (no direct adapter) | Cross-cutting | Logging, telemetry |

**Gap:** 4 of 7 adapters packages have no corresponding adapter in the graph. They implement presentation (L11) and observability concerns that the adapter model doesn't cover.

---

## Summary of Critical Gaps

| Priority | Gap | Impact |
|----------|-----|--------|
| P0 | tools-adapter has no package (M-TOOL-01) | Tool dispatch is fragmented |
| P1 | agent-launch-adapter lifecycle is 2-state not 9-state (M-LAUNCH-01) | No pause/resume/retry for agent invocations |
| P1 | transport-adapter codec incomplete (M-TRANSPORT-01) | Tool schemas dropped, cost tracking missing |
| P1 | agent-comm-adapter event schema not formalized (M-COMM-02) | Each adapter emits different shapes |
| P2 | agent-comm-adapter not represented in graph (decomposition gap) | Graph doesn't reflect reality |
| P2 | extensions-adapter ≠ extensions-adapter naming (M-EXTENSION-01) | Confusing for contributors |
| P2 | tasks-adapter ≠ tasks-adapter naming (M-TASKS-01) | Confusing for contributors |
