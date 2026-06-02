# Stack Layer Map — Atlas Graph to Package Mapping

## The 14 Layers

The atlas graph defines 14 stack layers (`stack-layers` cluster). Each layer represents an architectural concern in the a5c agent stack. This document maps each layer to its implementing packages, primary graph node kinds, and current implementation maturity.

## Layer Mapping

### L1: Model
**Scope:** Trained artifact and declared capability surface

| Aspect | Value |
|--------|-------|
| Packages | `@a5c-ai/agent-catalog` (metadata only) |
| Node Kinds | ModelVersion, ModelFamily, Modality (capabilities-and-models cluster) |
| Graph Cluster | capabilities-and-models |
| Maturity | Metadata only — no execution package |
| Spec Coverage | Implicit in agent-catalog contract |

**Gap:** Model capabilities are cataloged but not executable. No package owns model selection, routing, or capability negotiation at this layer.

---

### L2: Provider
**Scope:** Hosted or self-hosted serving boundary

| Aspect | Value |
|--------|-------|
| Packages | `@a5c-ai/agent-mux-transport` (proxy), `@a5c-ai/agent-mux-cli` (provider config) |
| Node Kinds | Provider, ModelProviderProduct, ModelProviderVersion (compute + capabilities-and-models) |
| Graph Cluster | compute |
| Maturity | Partial — provider routing implemented in transport-mux proxy |
| Spec Coverage | v6.0 package-specs.md mentions transport-mux |

**Gap:** Provider concepts are split between transport-mux (proxy) and agent-mux-cli (provider translation). No unified provider abstraction package.

---

### L3: Transport
**Scope:** Wire and client path between agent core and provider

| Aspect | Value |
|--------|-------|
| Packages | `@a5c-ai/agent-mux-transport` |
| Node Kinds | TransportProxy, TransportClient, ModelTransportProtocol, TransportProtocol (compute + capabilities-and-models) |
| Graph Cluster | compute |
| Maturity | Implemented — HTTP proxy with codec translation |
| Spec Coverage | transport-mux README (marked deferred for full codec refactor) |

**Gap:** Codec capabilities (tool schema translation, cost normalization) are planned but not fully implemented. The v6.0 plan had a codec architecture refactor that was started but not completed.

---

### L4: Agent-Core
**Scope:** Inner loop and graph/turn semantics for one agent brain

| Aspect | Value |
|--------|-------|
| Packages | `@a5c-ai/tula-core`, `@a5c-ai/agent-mux-comm` |
| Node Kinds | AgentCoreImpl (agent-stack) |
| Graph Cluster | agent-stack |
| Maturity | **Mature** — Dual implementation path (unified + harness-neutral) |
| Spec Coverage | v6.0 unified-stack-architecture.md, v6-architecture-specification.md |

**Note:** Two packages implement this layer for different concerns: `tula-core` (unified babysitter loop) and `agent-comm-mux` (harness-neutral dispatch). This is intentional per v6.0 spec.

---

### L5: Agent-Runtime
**Scope:** Host process and operational runtime for an agent core

| Aspect | Value |
|--------|-------|
| Packages | `@a5c-ai/agent-platform`, `@a5c-ai/agent-mux-comm` |
| Node Kinds | AgentRuntimeImpl (agent-stack) |
| Graph Cluster | agent-stack |
| Maturity | **Mature** — agent-platform hosts the unified runtime; agent-comm-mux hosts harness dispatch |
| Spec Coverage | v6.0 unified-stack-architecture.md |

---

### L6: Agent-Platform
**Scope:** Extension, distribution, launch, and ecosystem surface

| Aspect | Value |
|--------|-------|
| Packages | `@a5c-ai/agent-mux-extensions`, `@a5c-ai/agent-catalog`, `@a5c-ai/agent-platform` |
| Node Kinds | AgentPlatformImpl, Plugin, PluginTarget, PluginMarketplace, PluginArtifact (agent-stack + extensions) |
| Graph Cluster | agent-stack, extensions |
| Maturity | Partial — plugin compiler mature; deeper platform (team agents, marketplace identity) deferred |
| Spec Coverage | v6.0 plugin-ecosystem.md |

**Gap:** AgentPlatformImpl is defined in graph but has no standalone implementation package. Platform concerns are scattered across agent-platform, extension-mux, and agent-catalog.

---

### L7: Workspace
**Scope:** Materialized working context the agent reads/writes/indexes

| Aspect | Value |
|--------|-------|
| Packages | `@a5c-ai/babysitter-sdk` (run dirs), `@a5c-ai/agent-platform` (workspace management) |
| Node Kinds | Workspace, Worktree, WorktreeSession (lifecycle) |
| Graph Cluster | lifecycle |
| Maturity | Partial — SDK owns `.a5c/runs/` layout; workspace materialization policy not formalized |
| Spec Coverage | Implicit in SDK storage docs |

**Gap:** No dedicated workspace abstraction. The concept of "what the agent can see/modify" is implicit in the SDK's run directory layout rather than an explicit workspace contract.

---

### L8: Execution
**Scope:** Invocation environment for agent-driven tools and commands

| Aspect | Value |
|--------|-------|
| Packages | `@a5c-ai/babysitter-sdk` (effects, tasks), `@a5c-ai/agent-platform` (tool dispatch) |
| Node Kinds | Execution, Effect, Invocation (lifecycle) |
| Graph Cluster | lifecycle |
| Maturity | **Mature** — Effect model, task dispatch, shell/agent/orchestrator task kinds |
| Spec Coverage | v6.0 v6-architecture-specification.md (effect lifecycle) |

---

### L9: Sandbox
**Scope:** Policy-enforcement perimeter around execution and side effects

| Aspect | Value |
|--------|-------|
| Packages | `@a5c-ai/agent-mux-tasks` (approval gates) |
| Node Kinds | Sandbox, PermissionMode (lifecycle + security) |
| Graph Cluster | lifecycle, security |
| Maturity | Partial — tasks-mux handles human approval; filesystem/network policy enforcement deferred |
| Spec Coverage | v6.0 security-architecture.md |

**Gap:** Sandbox as a policy enforcement layer (filesystem restrictions, network controls, resource limits) is aspirational. Only human approval gates are implemented.

---

### L10: Interaction
**Scope:** User-facing action primitives (commands, keybindings, controls)

| Aspect | Value |
|--------|-------|
| Packages | `@a5c-ai/agent-mux-cli`, `@a5c-ai/agent-mux-tui`, `@a5c-ai/babysitter-sdk` (interaction module) |
| Node Kinds | InteractionPrimitive, InteractionPattern, InteractionPrimitiveCategory (agent-stack + extensions) |
| Graph Cluster | agent-stack, extensions |
| Maturity | **Mature** — Rich interaction model across CLI, TUI, web surfaces |
| Spec Coverage | Implicit across multiple docs |

---

### L11: Presentation
**Scope:** Outermost rendering surface (TUI, CLI, web, IDE, API)

| Aspect | Value |
|--------|-------|
| Packages | `@a5c-ai/agent-mux-ui`, `@a5c-ai/agent-mux-tui`, `@a5c-ai/agent-mux-webui`, `@a5c-ai/babysitter-observer-dashboard`, `@a5c-ai/babysitter-tui-plugins` |
| Node Kinds | Presentation, AgentUIImpl, Dashboard (agent-stack + extensions) |
| Graph Cluster | agent-stack, extensions |
| Maturity | **Mature** — Multi-surface: TUI, CLI, web, mobile (Android/iOS), TV (Android TV/Apple TV), watch (watchOS/Wear OS) |
| Spec Coverage | v6.0 unified-stack-architecture.md |

---

### L12: Knowledge Fabric
**Scope:** Durable organizational knowledge, memory, retrieval, indexing

| Aspect | Value |
|--------|-------|
| Packages | `@a5c-ai/agent-catalog`, `@a5c-ai/atlas` |
| Node Kinds | KnowledgeFabricImpl, MemorySystem, RetrievalPipeline, KnowledgeSource, KnowledgeDomain (agent-stack + domain) |
| Graph Cluster | agent-stack, domain |
| Maturity | Partial — Atlas provides ontology/catalog; durable memory, RAG, and semantic retrieval are deferred |
| Spec Coverage | v6.0 mentions knowledge fabric as deferred (§8.2) |

**Gap:** The graph defines rich knowledge concepts (MemorySystem, RetrievalPipeline, VectorStore) but no package implements durable agent memory or semantic retrieval. agent-catalog is metadata-only.

---

### L13: Orchestration
**Scope:** Control-plane primitives for agent work coordination

| Aspect | Value |
|--------|-------|
| Packages | `@a5c-ai/babysitter-sdk`, `@a5c-ai/agent-platform` |
| Node Kinds | OrchestrationPrimitive, Run, Phase, PhaseMachine, PhaseTransition, OrchestratorState (lifecycle) |
| Graph Cluster | lifecycle |
| Maturity | **Mature** — SDK owns effect model, replay engine, deterministic execution, event sourcing |
| Spec Coverage | v6.0 v6-architecture-specification.md, unified-stack-architecture.md |

**Note:** babysitter-sdk is intentionally the monolithic center of orchestration per v6.0 decision. Splitting into smaller packages was evaluated and rejected for pragmatic reasons.

---

### L14: Governance
**Scope:** Policy, risk, compliance, audit, approval controls

| Aspect | Value |
|--------|-------|
| Packages | `@a5c-ai/agent-platform` (governance module), `@a5c-ai/agent-mux-tasks` (approval routing), `@a5c-ai/atlas` (evidence/claims) |
| Node Kinds | AgentGovernanceImpl, EvidencePolicy, Claim, TrustLevel (agent-stack + catalog-meta + trust) |
| Graph Cluster | agent-stack, catalog-meta, trust |
| Maturity | Partial — approval gates, evidence claims, trust levels defined; broader policy framework (NIST AI RMF, OWASP) aspirational |
| Spec Coverage | v6.0 security-architecture.md |

**Gap:** AgentGovernanceImpl is defined but implementation examples are sparse. The governance module in agent-platform exists but covers a narrow surface (plugin governance, hook validation).

## Maturity Summary

| Maturity | Layers | Count |
|----------|--------|-------|
| **Mature** | L4, L5, L8, L10, L11, L13 | 6 |
| **Partial** | L2, L3, L6, L7, L9, L12, L14 | 7 |
| **Metadata Only** | L1 | 1 |
