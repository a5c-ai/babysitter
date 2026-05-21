# Agent Stack Decomposition — babysitter-agent, agent-core, SDK, and agent-mux

The atlas graph models two AgentProducts (`babysitter-agent`, `agent-mux`) each decomposed into Core/Runtime/Platform/UI implementations. This document maps the graph's decomposition to the actual packages and identifies what needs to change.

## Graph Model: Two Agent Products

### babysitter-agent (full-cli-agent, stackScope: full)

The graph decomposes `agent:babysitter-agent` into 4 implementation layers:

| Graph Node | Kind | Layer | Description |
|-----------|------|-------|-------------|
| `agent-core-impl:babysitter-agent.core@current` | AgentCoreImpl | L4 | SDK-backed CLI loop — delegates to babysitter-sdk process functions |
| `agent-runtime-impl:babysitter-agent.runtime@current` | AgentRuntimeImpl | L5 | SDK runtime + daemon — daemon, observer, MCP server surfaces |
| `agent-platform-impl:babysitter-agent.platform@current` | AgentPlatformImpl | L6 | defineTask + plugin/skill registry |
| `agent-ui-impl:babysitter-agent.ui@current` | AgentUIImpl | L11 | CLI binary presentation |

### agent-mux (full-cli-agent + remote)

The graph has `agent:agent-mux` and `agent:agent-mux-remote`:

| Graph Node | Kind | Description |
|-----------|------|-------------|
| `agent-core-impl:agent-mux-remote.core@current` | AgentCoreImpl | Transport-only delegator |
| `presentation:agent-mux-tui` | Presentation | TUI |
| `presentation:agent-mux-cli` | Presentation | CLI |
| `presentation:agent-mux-webui` | Presentation | Web UI |
| `presentation:agent-mux-mobile-ios` | Presentation | iOS |
| `presentation:agent-mux-mobile-android` | Presentation | Android |
| + 4 more (TV, watch) | Presentation | ... |

---

## Current Package Reality

### Three "core" packages doing different things:

| Package | npm name | What it actually does |
|---------|----------|----------------------|
| `packages/sdk/` | `@a5c-ai/babysitter-sdk` | Orchestration engine: runs, replay, storage, tasks, hooks, plugins, profiles, session, compression, MCP, CLI commands |
| `packages/agent-core/` | `@a5c-ai/agent-core` | Thin: agentic tools, background process registry, session binding, deferred tool registry |
| `packages/babysitter-agent/` | `@a5c-ai/babysitter-agent` | Fat CLI: wraps SDK + agent-core, adds daemon, observer, governance, harness bridge, cost, interaction |

### The confusion:

1. **`agent-core` is tiny** — 6 source files. It's NOT the "core" of anything in the graph sense. The graph's `AgentCoreImpl` (SDK-backed CLI loop) lives in `babysitter-sdk`, not `agent-core`.

2. **`babysitter-sdk` is the real core** — runtime, replay, storage, tasks, hooks, process context, effect model. This is what the graph calls `agent-core-impl:babysitter-agent.core`.

3. **`babysitter-agent` is core + runtime + platform + UI** — it exports 14 sub-modules (api, cli, cost, daemon, governance, harness, interaction, observability, runtime, seams, session, storage, tasks). The graph correctly decomposes it into 4 layers but the code is one monolithic package.

---

## Target: Graph-Aligned Package Structure

### babysitter-agent decomposition

The graph says babysitter-agent has Core, Runtime, Platform, and UI. The code should reflect this:

| Graph Layer | Target Package | Current Location | What Moves |
|-------------|---------------|------------------|------------|
| L4 AgentCoreImpl | `@a5c-ai/babysitter-sdk` (stays) | `packages/sdk/` | Nothing — SDK IS the core. agent-core package contents fold into SDK or babysitter-agent. |
| L5 AgentRuntimeImpl | `@a5c-ai/babysitter-agent` (stays, slimmed) | `packages/babysitter-agent/` | Keep: daemon, session, harness bridge, runtime. Remove: things that belong in other layers. |
| L6 AgentPlatformImpl | `@a5c-ai/extension-mux` (renamed from agent-plugins-mux) + `@a5c-ai/agent-catalog` | `packages/agent-plugins-mux/`, `packages/agent-catalog/` | Plugin compilation, skill discovery, marketplace |
| L11 AgentUIImpl | `@a5c-ai/babysitter-agent` CLI entry | `packages/babysitter-agent/src/cli/` | CLI stays in babysitter-agent — it's the binary |

### agent-core package fate

`@a5c-ai/agent-core` is confusingly named — it's not the agent core, it's a small utility package. Options:

**Option A: Fold into babysitter-agent** (recommended)
- Move agentic tools, background process registry, session binding into babysitter-agent
- Delete agent-core package
- Update imports

**Option B: Rename to agent-tools**
- If it grows to own tool dispatch, rename to `@a5c-ai/agent-tools`
- But tool-mux is the graph concept for this — so it would become part of tool-mux

**Option C: Fold into tool-mux**
- When tool-mux is created (Phase 2.1), merge agent-core into it
- agent-core's agentic tools + deferred tool registry are tool-mux concerns

**Recommendation: Option C** — agent-core becomes the seed of tool-mux.

### tasks-mux (renamed from breakpoints-mux)

Per user direction: `breakpoints-mux` becomes part of `tasks-mux`.

The graph's `mux:tasks-mux` description: "The lone live Trust Chain primitive — ProvenBreakpointAnswer signs decision answers with the named Authority of the responder. Bridges every backend."

| Current Package | Target | What Changes |
|----------------|--------|-------------|
| `@a5c-ai/breakpoints-mux` | `@a5c-ai/tasks-mux` | Rename package, keep all functionality (approval routing, cryptographic signing, pluggable backends, MCP) |

The tasks-mux scope is broader than breakpoints — it's the trust chain for ALL task resolutions, not just breakpoints. Future: Linear/GitHub/Slack task backends, task routing policies, multi-responder coordination.

---

## Detailed Task List

### T1: Dissolve agent-core into tool-mux seed

| Task | Effort |
|------|--------|
| Create `packages/tool-mux/` with seed from agent-core | Medium |
| Move `agenticTools/` from agent-core to tool-mux | Small |
| Move `deferredToolRegistry.ts` from agent-core to tool-mux | Small |
| Move `backgroundProcessRegistry.ts` to babysitter-agent (runtime concern) | Small |
| Move `session.ts` to babysitter-agent (runtime concern) | Small |
| Update all imports from `@a5c-ai/agent-core` across monorepo | Medium |
| Deprecate `@a5c-ai/agent-core` on npm | Small |
| Update graph: remove agent-core SourceRef, add tool-mux SourceRef | Small |

### T2: Slim babysitter-agent to match graph Runtime+UI scope

babysitter-agent currently exports 14 modules. Per graph, it should own Runtime (L5) and UI (L11):

| Module | Current | Target Owner | Reason |
|--------|---------|-------------|--------|
| `api` | babysitter-agent | babysitter-agent | Runtime API surface |
| `cli` | babysitter-agent | babysitter-agent | UI (L11) |
| `cost` | babysitter-agent | babysitter-agent | Runtime telemetry |
| `daemon` | babysitter-agent | babysitter-agent | Runtime (L5) |
| `governance` | babysitter-agent | babysitter-agent or tasks-mux | Governance could move to tasks-mux if it's approval-centric |
| `harness` | babysitter-agent | babysitter-agent | Runtime harness bridge |
| `interaction` | babysitter-agent | babysitter-agent | UI (L11) |
| `observability` | babysitter-agent | babysitter-agent | Runtime telemetry |
| `runtime` | babysitter-agent | babysitter-agent | Core runtime (L5) |
| `seams` | babysitter-agent | babysitter-agent | Architecture seam contracts |
| `session` | babysitter-agent | babysitter-agent | Runtime session (L5) |
| `storage` | babysitter-agent | babysitter-agent | Runtime storage |
| `tasks` | babysitter-agent | babysitter-agent | Task execution |

**Result:** babysitter-agent keeps most modules — they ARE runtime/UI concerns. The `governance` module is the only candidate for extraction (to tasks-mux), but only if it's purely about approval policies.

### T3: babysitter-sdk layer annotation

The SDK is intentionally monolithic. Don't split it — annotate what graph concepts it implements:

| SDK Module | Graph Layer | Graph Node Kind |
|-----------|-------------|-----------------|
| `runtime/` | L4 (Agent-Core) + L13 (Orchestration) | AgentCoreImpl, OrchestrationPrimitive, Run, Phase |
| `storage/` | L7 (Workspace) | Workspace (partial) |
| `tasks/` | L8 (Execution) | Effect, Execution, Invocation |
| `hooks/` | Cross-cutting | HookSurface (via hooks-mux) |
| `plugins/` | L6 (Agent-Platform) | Plugin, PluginMarketplace |
| `session/` | L5 (Agent-Runtime) | Session, session-storage-mux |
| `mcp/` | Tool-mux concern | ToolDescriptor, ToolServer |
| `harness/` | L5 (Agent-Runtime) | AgentRuntimeImpl (adapter detection) |
| `profiles/` | L12 (Knowledge-Fabric) | (user/project knowledge) |
| `compression/` | L4 (Agent-Core) | CompactionPolicy |
| `prompts/` | L4 (Agent-Core) | PromptTemplate |
| `breakpoints/` | L9 (Sandbox) + L14 (Governance) | HumanCheckpoint |

**Tasks:**
- [ ] Add `"atlas"` field to sdk `package.json` listing all layers and node kinds
- [ ] Add module-level JSDoc comments referencing graph layer and node kind
- [ ] Create `docs/sdk-layer-map.md` documenting which source directory maps to which layer

### T4: agent-mux internal decomposition

As described in graph-alignment-tasks.md Phase 1.3, split into graph-aligned sub-packages:

| Current | Target | Graph Mux |
|---------|--------|-----------|
| `agent-mux/core` | `agent-mux/comm` (or `agent-comm-mux`) | `mux:agent-comm-mux` |
| `agent-mux/cli` launch.ts | `agent-mux/launch` | `mux:agent-launch-mux` |
| `agent-mux/cli` install.ts + `agent-mux/adapters` | `agent-mux/config` | `mux:agent-config-mux` |
| `agent-mux/cli` (composition) | `agent-mux/cli` (thin, wires muxes) | No mux — composition |
| `agent-mux/gateway` | `agent-mux/gateway` | No mux — presentation |
| `agent-mux/tui` | `agent-mux/tui` | No mux — presentation |
| `agent-mux/ui` | `agent-mux/ui` | No mux — presentation |
| `agent-mux/webui` | `agent-mux/webui` | No mux — presentation |
| `agent-mux/observability` | `agent-mux/observability` | No mux — cross-cutting |

---

## Execution Order (combined with graph-alignment-tasks.md)

```
1. Rename breakpoints-mux → tasks-mux
2. Rename agent-plugins-mux → extension-mux  
3. Dissolve agent-core → tool-mux seed + babysitter-agent
   ↓
4. Extract agent-launch-mux from agent-mux-cli
5. Extract agent-config-mux from agent-mux-cli + agent-mux-adapters
6. Rename agent-mux-core → agent-comm-mux
   ↓
7. Annotate babysitter-sdk with layer metadata
8. Annotate babysitter-agent with layer metadata
   ↓
9. Implement tool-mux: schema translation, dispatch policies
10. Implement agent-launch-mux: 9-state lifecycle, retry
11. Implement agent-comm-mux: formalized event schema
12. Complete transport-mux: codecs
   ↓
13. Update graph: SourceRef nodes, decomposition edges, cluster moves
```

## Final Package Landscape (Target)

| Package | Graph Alignment | Layer(s) |
|---------|----------------|----------|
| `@a5c-ai/babysitter-sdk` | Orchestration engine (annotated, not renamed) | L4, L7, L8, L13 |
| `@a5c-ai/babysitter-agent` | AgentRuntimeImpl + AgentUIImpl | L5, L11 |
| `@a5c-ai/babysitter` | Metapackage (unchanged) | — |
| `@a5c-ai/agent-launch-mux` | `mux:agent-launch-mux` | L8 |
| `@a5c-ai/agent-comm-mux` | `mux:agent-comm-mux` | L4-L5 |
| `@a5c-ai/agent-config-mux` | `mux:agent-config-mux` | L5-L6 |
| `@a5c-ai/agent-mux-cli` | Composition CLI (`amux`) | L10 |
| `@a5c-ai/agent-mux-gateway` | Remote API | L6 |
| `@a5c-ai/agent-mux-tui` | Presentation | L11 |
| `@a5c-ai/agent-mux-ui` | Shared UI | L11 |
| `@a5c-ai/agent-mux-webui` | Web UI | L11 |
| `@a5c-ai/agent-mux-observability` | Telemetry | Cross-cutting |
| `@a5c-ai/hooks-mux-*` | `mux:hooks-mux` | Cross-cutting |
| `@a5c-ai/transport-mux` | `mux:transport-mux` | L3 |
| `@a5c-ai/extension-mux` | `mux:extension-mux` (renamed from agent-plugins-mux) | L6 |
| `@a5c-ai/tasks-mux` | `mux:tasks-mux` (renamed from breakpoints-mux) | L9, L14 |
| `@a5c-ai/tool-mux` | `mux:tool-mux` (new, seeded from agent-core) | L8 |
| `@a5c-ai/agent-catalog` | Knowledge catalog | L12 |
| `@a5c-ai/atlas` | Graph data + indexer | Cross-cutting |
| `@a5c-ai/triggers` | Automation triggers | Cross-cutting |
| `@a5c-ai/cloud` | Deployment | Cross-cutting |
| `@a5c-ai/observer-dashboard` | Observability UI | L11 |
| `@a5c-ai/krate-*` | Project management | L6 |

**Dissolved:**
- `@a5c-ai/agent-core` → absorbed into `@a5c-ai/tool-mux` (tools) + `@a5c-ai/babysitter-agent` (session/registry)
- `@a5c-ai/agent-mux-adapters` → absorbed into `@a5c-ai/agent-config-mux`
- `@a5c-ai/agent-plugins-mux` → renamed to `@a5c-ai/extension-mux`
- `@a5c-ai/breakpoints-mux` → renamed to `@a5c-ai/tasks-mux`
