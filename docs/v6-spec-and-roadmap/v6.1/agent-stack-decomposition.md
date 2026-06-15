# Agent Stack Decomposition — agent-platform, agent-core, SDK, and adapters

The atlas graph models two AgentProducts (`agent-platform`, `adapters`) each decomposed into Core/Runtime/Platform/UI implementations. This document maps the graph's decomposition to the actual packages and identifies what needs to change.

## Graph Model: Two Agent Products

### agent-platform (full-cli-agent, stackScope: full)

The graph decomposes `agent:agent-platform` into 4 implementation layers:

| Graph Node | Kind | Layer | Description |
|-----------|------|-------|-------------|
| `agent-core-impl:agent-platform.core@current` | AgentCoreImpl | L4 | SDK-backed CLI loop — delegates to babysitter-sdk process functions |
| `agent-runtime-impl:agent-platform.runtime@current` | AgentRuntimeImpl | L5 | SDK runtime + daemon — daemon, observer, MCP server surfaces |
| `agent-platform-impl:agent-platform.platform@current` | AgentPlatformImpl | L6 | defineTask + plugin/skill registry |
| `agent-ui-impl:agent-platform.ui@current` | AgentUIImpl | L11 | CLI binary presentation |

### adapters (full-cli-agent + remote)

The graph has `agent:adapters` and `agent:adapters-remote`:

| Graph Node | Kind | Description |
|-----------|------|-------------|
| `agent-core-impl:adapters-remote.core@current` | AgentCoreImpl | Transport-only delegator |
| `presentation:adapters-tui` | Presentation | TUI |
| `presentation:adapters-cli` | Presentation | CLI |
| `presentation:adapters-webui` | Presentation | Web UI |
| `presentation:adapters-mobile-ios` | Presentation | iOS |
| `presentation:adapters-mobile-android` | Presentation | Android |
| + 4 more (TV, watch) | Presentation | ... |

---

## Current Package Reality

### Three "core" packages doing different things:

| Package | npm name | What it actually does |
|---------|----------|----------------------|
| `packages/babysitter-sdk/` | `@a5c-ai/babysitter-sdk` | Orchestration engine: runs, replay, storage, tasks, hooks, plugins, profiles, session, compression, MCP, CLI commands |
| `packages/genty/core/` | `@a5c-ai/genty-core` | Thin: agentic tools, background process registry, session binding, deferred tool registry |
| `packages/genty/platform/` | `@a5c-ai/genty-platform` | Fat CLI: wraps SDK + agent-core, adds daemon, observer, governance, harness bridge, cost, interaction |

### The confusion:

1. **`genty-core` is tiny** — 6 source files. It's NOT the "core" of anything in the graph sense. The graph's `AgentCoreImpl` (SDK-backed CLI loop) lives in `babysitter-sdk`, not `genty-core`.

2. **`babysitter-sdk` is the real core** — runtime, replay, storage, tasks, hooks, process context, effect model. This is what the graph calls `agent-core-impl:agent-platform.core`.

3. **`agent-platform` is core + runtime + platform + UI** — it exports 14 sub-modules (api, cli, cost, daemon, governance, harness, interaction, observability, runtime, seams, session, storage, tasks). The graph correctly decomposes it into 4 layers but the code is one monolithic package.

---

## Target: Graph-Aligned Package Structure

### agent-platform decomposition

The graph says agent-platform has Core, Runtime, Platform, and UI. The code should reflect this:

| Graph Layer | Target Package | Current Location | What Moves |
|-------------|---------------|------------------|------------|
| L4 AgentCoreImpl | `@a5c-ai/babysitter-sdk` (stays) | `packages/babysitter-sdk/` | Nothing — SDK IS the core. agent-core package contents fold into SDK or agent-platform. |
| L5 AgentRuntimeImpl | `@a5c-ai/genty-platform` (stays, slimmed) | `packages/genty/platform/` | Keep: daemon, session, harness bridge, runtime. Remove: things that belong in other layers. |
| L6 AgentPlatformImpl | `@a5c-ai/extensions-adapter` (renamed from extensions-adapter) + `@a5c-ai/agent-catalog` | `packages/extensions-adapter/`, `packages/agent-catalog/` | Plugin compilation, skill discovery, marketplace |
| L11 AgentUIImpl | `@a5c-ai/genty-platform` CLI entry | `packages/genty/platform/src/cli/` | CLI stays in agent-platform — it's the binary |

### agent-core package fate

`@a5c-ai/genty-core` is confusingly named — it's not the agent core, it's a small utility package. Options:

**Option A: Fold into agent-platform** (recommended)
- Move agentic tools, background process registry, session binding into agent-platform
- Delete agent-core package
- Update imports

**Option B: Rename to agent-tools**
- If it grows to own tool dispatch, rename to `@a5c-ai/agent-tools`
- But tools-adapter is the graph concept for this — so it would become part of tools-adapter

**Option C: Fold into tools-adapter**
- When tools-adapter is created (Phase 2.1), merge agent-core into it
- agent-core's agentic tools + deferred tool registry are tools-adapter concerns

**Recommendation: Option C** — agent-core becomes the seed of tools-adapter.

### tasks-adapter (renamed from tasks-adapter)

Per user direction: `tasks-adapter` becomes part of `tasks-adapter`.

The graph's `adapter:tasks-adapter` description: "The lone live Trust Chain primitive — ProvenBreakpointAnswer signs decision answers with the named Authority of the responder. Bridges every backend."

| Current Package | Target | What Changes |
|----------------|--------|-------------|
| `@a5c-ai/tasks-adapter` | `@a5c-ai/tasks-adapter` | Rename package, keep all functionality (approval routing, cryptographic signing, pluggable backends, MCP) |

The tasks-adapter scope is broader than breakpoints — it's the trust chain for ALL task resolutions, not just breakpoints. Future: Linear/GitHub/Slack task backends, task routing policies, multi-responder coordination.

---

## Detailed Task List

### T1: Dissolve agent-core into tools-adapter seed

| Task | Effort |
|------|--------|
| Create `packages/tools-adapter/` with seed from agent-core | Medium |
| Move `agenticTools/` from agent-core to tools-adapter | Small |
| Move `deferredToolRegistry.ts` from agent-core to tools-adapter | Small |
| Move `backgroundProcessRegistry.ts` to agent-platform (runtime concern) | Small |
| Move `session.ts` to agent-platform (runtime concern) | Small |
| Update all imports from `@a5c-ai/genty-core` across monorepo | Medium |
| Deprecate `@a5c-ai/genty-core` on npm | Small |
| Update graph: remove agent-core SourceRef, add tools-adapter SourceRef | Small |

### T2: Slim agent-platform to match graph Runtime+UI scope

agent-platform currently exports 14 modules. Per graph, it should own Runtime (L5) and UI (L11):

| Module | Current | Target Owner | Reason |
|--------|---------|-------------|--------|
| `api` | agent-platform | agent-platform | Runtime API surface |
| `cli` | agent-platform | agent-platform | UI (L11) |
| `cost` | agent-platform | agent-platform | Runtime telemetry |
| `daemon` | agent-platform | agent-platform | Runtime (L5) |
| `governance` | agent-platform | agent-platform or tasks-adapter | Governance could move to tasks-adapter if it's approval-centric |
| `harness` | agent-platform | agent-platform | Runtime harness bridge |
| `interaction` | agent-platform | agent-platform | UI (L11) |
| `observability` | agent-platform | agent-platform | Runtime telemetry |
| `runtime` | agent-platform | agent-platform | Core runtime (L5) |
| `seams` | agent-platform | agent-platform | Architecture seam contracts |
| `session` | agent-platform | agent-platform | Runtime session (L5) |
| `storage` | agent-platform | agent-platform | Runtime storage |
| `tasks` | agent-platform | agent-platform | Task execution |

**Result:** agent-platform keeps most modules — they ARE runtime/UI concerns. The `governance` module is the only candidate for extraction (to tasks-adapter), but only if it's purely about approval policies.

### T3: babysitter-sdk layer annotation

The SDK is intentionally monolithic. Don't split it — annotate what graph concepts it implements:

| SDK Module | Graph Layer | Graph Node Kind |
|-----------|-------------|-----------------|
| `runtime/` | L4 (Agent-Core) + L13 (Orchestration) | AgentCoreImpl, OrchestrationPrimitive, Run, Phase |
| `storage/` | L7 (Workspace) | Workspace (partial) |
| `tasks/` | L8 (Execution) | Effect, Execution, Invocation |
| `hooks/` | Cross-cutting | HookSurface (via hooks-adapter) |
| `plugins/` | L6 (Agent-Platform) | Plugin, PluginMarketplace |
| `session/` | L5 (Agent-Runtime) | Session, session-storage-adapter |
| `mcp/` | Tool-adapter concern | ToolDescriptor, ToolServer |
| `harness/` | L5 (Agent-Runtime) | AgentRuntimeImpl (adapter detection) |
| `profiles/` | L12 (Knowledge-Fabric) | (user/project knowledge) |
| `compression/` | L4 (Agent-Core) | CompactionPolicy |
| `prompts/` | L4 (Agent-Core) | PromptTemplate |
| `breakpoints/` | L9 (Sandbox) + L14 (Governance) | HumanCheckpoint |

**Tasks:**
- [ ] Add `"atlas"` field to sdk `package.json` listing all layers and node kinds
- [ ] Add module-level JSDoc comments referencing graph layer and node kind
- [ ] Create `docs/sdk-layer-map.md` documenting which source directory maps to which layer

### T4: adapters internal decomposition

As described in graph-alignment-tasks.md Phase 1.3, split into graph-aligned sub-packages:

| Current | Target | Graph Adapter |
|---------|--------|-----------|
| `adapters/core` | `adapters/comm` (or `agent-comm-adapter`) | `adapter:agent-comm-adapter` |
| `adapters/cli` launch.ts | `adapters/launch` | `adapter:agent-launch-adapter` |
| `adapters/cli` install.ts + `adapters/adapters` | `adapters/config` | `adapter:agent-config-adapter` |
| `adapters/cli` (composition) | `adapters/cli` (thin, wires muxes) | No adapter — composition |
| `adapters/gateway` | `adapters/gateway` | No adapter — presentation |
| `adapters/tui` | `adapters/tui` | No adapter — presentation |
| `adapters/ui` | `adapters/ui` | No adapter — presentation |
| `adapters/webui` | `adapters/webui` | No adapter — presentation |
| `adapters/observability` | `adapters/observability` | No adapter — cross-cutting |

---

## Execution Order (combined with graph-alignment-tasks.md)

```
1. Rename tasks-adapter → tasks-adapter
2. Rename extensions-adapter → extensions-adapter  
3. Dissolve agent-core → tools-adapter seed + agent-platform
   ↓
4. Extract agent-launch-adapter from adapters-cli
5. Extract agent-config-adapter from adapters-cli + adapters-adapters
6. Rename agent-comm-adapter → agent-comm-adapter
   ↓
7. Annotate babysitter-sdk with layer metadata
8. Annotate agent-platform with layer metadata
   ↓
9. Implement tools-adapter: schema translation, dispatch policies
10. Implement agent-launch-adapter: 9-state lifecycle, retry
11. Implement agent-comm-adapter: formalized event schema
12. Complete transport-adapter: codecs
   ↓
13. Update graph: SourceRef nodes, decomposition edges, cluster moves
```

## Final Package Landscape (Target)

| Package | Graph Alignment | Layer(s) |
|---------|----------------|----------|
| `@a5c-ai/babysitter-sdk` | Orchestration engine (annotated, not renamed) | L4, L7, L8, L13 |
| `@a5c-ai/genty-platform` | AgentRuntimeImpl + AgentUIImpl | L5, L11 |
| `@a5c-ai/babysitter` | Metapackage (unchanged) | — |
| `@a5c-ai/launch-adapter` | `adapter:agent-launch-adapter` | L8 |
| `@a5c-ai/comm-adapter` | `adapter:agent-comm-adapter` | L4-L5 |
| `@a5c-ai/config-adapter` | `adapter:agent-config-adapter` | L5-L6 |
| `@a5c-ai/adapters-cli` | Composition CLI (`adapters`) | L10 |
| `@a5c-ai/adapters-gateway` | Remote API | L6 |
| `@a5c-ai/genty-tui` | Presentation | L11 |
| `@a5c-ai/genty-ui` | Shared UI | L11 |
| `@a5c-ai/genty-web-app` | Web UI | L11 |
| `@a5c-ai/adapters-observability` | Telemetry | Cross-cutting |
| `@a5c-ai/hooks-adapter-*` | `adapter:hooks-adapter` | Cross-cutting |
| `@a5c-ai/transport-adapter` | `adapter:transport-adapter` | L3 |
| `@a5c-ai/extensions-adapter` | `adapter:extensions-adapter` (renamed from extensions-adapter) | L6 |
| `@a5c-ai/tasks-adapter` | `adapter:tasks-adapter` (renamed from tasks-adapter) | L9, L14 |
| `@a5c-ai/tools-adapter` | `adapter:tools-adapter` (new, seeded from agent-core) | L8 |
| `@a5c-ai/agent-catalog` | Knowledge catalog | L12 |
| `@a5c-ai/atlas` | Graph data + indexer | Cross-cutting |
| `@a5c-ai/triggers-adapter` | Automation triggers | Cross-cutting |
| `@a5c-ai/cloud` | Deployment | Cross-cutting |
| `@a5c-ai/observer-dashboard` | Observability UI | L11 |
| `@a5c-ai/kradle-*` | Project management | L6 |

**Dissolved:**
- `@a5c-ai/genty-core` → absorbed into `@a5c-ai/tools-adapter` (tools) + `@a5c-ai/genty-platform` (session/registry)
- `@a5c-ai/adapters-codecs` → absorbed into `@a5c-ai/config-adapter`
- `@a5c-ai/extensions-adapter` → renamed to `@a5c-ai/extensions-adapter`
- `@a5c-ai/tasks-adapter` → renamed to `@a5c-ai/tasks-adapter`
