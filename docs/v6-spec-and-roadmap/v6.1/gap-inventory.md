# Gap Inventory — Graph vs Implementation

Complete inventory of gaps between the Atlas graph (source of truth) and the current implementation. Each gap is classified by severity and type.

## Gap Classification

- **S1 (Critical):** Graph defines a core concept with no implementation — blocks production use
- **S2 (Major):** Graph defines a concept with partial/fragmented implementation — causes friction
- **S3 (Minor):** Naming or organizational mismatch — doesn't block functionality
- **S4 (Deferred):** Graph defines a future concept explicitly marked as out-of-scope for current version

## Gaps by Layer

### L1: Model — Metadata Only

| ID | Severity | Gap | Description |
|----|----------|-----|-------------|
| G-L1-01 | S4 | No model selection engine | Graph defines ModelVersion, ModelFamily, Modality but no package performs runtime model selection or capability negotiation. Models are specified by the user or hardcoded in launch configs. |
| G-L1-02 | S3 | AdapterModel in extensions cluster | AdapterModel records live in the `extensions` cluster but conceptually belong to L1 (Model) or L2 (Provider). |

### L2: Provider — Split Ownership

| ID | Severity | Gap | Description |
|----|----------|-----|-------------|
| G-L2-01 | S2 | Provider abstraction fragmented | Provider concepts are split: transport-adapter owns the proxy, adapters-cli owns provider translation, agent-catalog owns provider metadata. No unified provider interface. |
| G-L2-02 | S2 | ProviderTranslation in extensions cluster | ProviderTranslation records describe how to route provider X through transport Y, but they're in `extensions` rather than a dedicated provider cluster. |

### L3: Transport — Codec Architecture Incomplete

| ID | Severity | Gap | Description |
|----|----------|-----|-------------|
| G-L3-01 | S2 | Codec refactor deferred | The transport-adapter codec architecture (TransportCodec interface, per-protocol codecs, tool schema translation) was planned in v6.0 but only partially implemented. |
| G-L3-02 | S2 | Codex websocket bypass | Codex CLI uses websockets that bypass OPENAI_BASE_URL proxy (#200). Transport layer can't intercept all connection types. |
| G-L3-03 | S3 | TransportRuntime in extensions | TransportRuntime node kind is in `extensions` cluster, should be in `compute`. |

### L4-L5: Agent-Core / Agent-Runtime — Mature, Minor Gaps

| ID | Severity | Gap | Description |
|----|----------|-----|-------------|
| G-L45-01 | S3 | Dual implementation paths | Two packages (agent-core, agent-comm-adapter) both implement L4 concerns. Intentional per v6.0 but increases cognitive load. |
| G-L45-02 | S4 | CapabilityProfile not runtime | Graph defines CapabilityProfile as a swappable bundle; no runtime mechanism to swap capability profiles at launch time. |

### L6: Agent-Platform — Plugin Compiler Mature, Platform Deferred

| ID | Severity | Gap | Description |
|----|----------|-----|-------------|
| G-L6-01 | S4 | No team agent platform | Graph defines AgentTeam; no implementation for multi-agent team coordination beyond subagents. |
| G-L6-02 | S4 | Marketplace identity deferred | PluginMarketplace is defined but marketplace authentication, billing, and identity are not implemented. |
| G-L6-03 | S2 | AgentPlatformImpl has no standalone package | The node kind exists but platform concerns are scattered across 3 packages. |

### L7: Workspace — Implicit, Not Explicit

| ID | Severity | Gap | Description |
|----|----------|-----|-------------|
| G-L7-01 | S2 | No workspace contract | The concept of "what the agent can see/modify" is implicit in `.a5c/runs/` layout. No explicit workspace materialization, indexing, or access-control API. |
| G-L7-02 | S3 | Worktree concept partially implemented | Graph defines Worktree and WorktreeSession; Claude Code worktrees exist but aren't managed through a babysitter workspace API. |

### L8: Execution — Effect Model Strong, Execution Environment Weak

| ID | Severity | Gap | Description |
|----|----------|-----|-------------|
| G-L8-01 | S2 | ESM process module loading | Process files using ESM imports fail in some contexts because Node.js ESM resolver doesn't find workspace packages from file:// URLs. Fixed with NODE_PATH hack but not architecturally clean (#196). |
| G-L8-02 | S3 | No execution environment abstraction | Effects run in the host process; no containerized or isolated execution environment. |

### L9: Sandbox — Approval Only

| ID | Severity | Gap | Description |
|----|----------|-----|-------------|
| G-L9-01 | S4 | No filesystem policy enforcement | Graph defines Sandbox and FilesystemSafetyInvariant; only human approval gates (tasks-adapter) are implemented. |
| G-L9-02 | S4 | No network policy enforcement | No network-level sandboxing for agent-driven HTTP requests. |
| G-L9-03 | S4 | No resource limit enforcement | No CPU/memory/time budgets for effect execution beyond timeouts. |

### L10-L11: Interaction / Presentation — Mature

| ID | Severity | Gap | Description |
|----|----------|-----|-------------|
| G-L1011-01 | S3 | Mobile/TV/watch platforms are stubs | adapters has mobile-android-app, mobile-ios-app, tv-*, watch-* directories but they're scaffolds, not production apps. |

### L12: Knowledge Fabric — Catalog Exists, Memory Deferred

| ID | Severity | Gap | Description |
|----|----------|-----|-------------|
| G-L12-01 | S4 | No durable agent memory | Graph defines MemorySystem, MemoryHierarchy, DecisionMemory; no package implements persistent agent memory across sessions. |
| G-L12-02 | S4 | No semantic retrieval / RAG | Graph defines RetrievalPipeline, VectorStore, EmbeddingModelProfile; no implementation. |
| G-L12-03 | S2 | agent-catalog is metadata-only | agent-catalog provides ontology and discovery but not runtime knowledge operations (query, update, learn). |

### L13: Orchestration — Monolithic Center (By Design)

| ID | Severity | Gap | Description |
|----|----------|-----|-------------|
| G-L13-01 | S3 | SDK is monolithic | babysitter-sdk contains runtime, storage, tasks, CLI, hooks, plugins, profiles, session, compression — intentional per v6.0 but limits independent evolution. |
| G-L13-02 | S2 | Process code drift (#169) | Process replay breaks when process code changes between iterations. Stable invocation keys (PR #178) address this. |

### L14: Governance — Scattered Controls

| ID | Severity | Gap | Description |
|----|----------|-----|-------------|
| G-L14-01 | S2 | No unified governance API | Governance concerns are in agent-platform (module), tasks-adapter (approval), atlas (evidence/claims). No unified governance interface. |
| G-L14-02 | S4 | NIST/OWASP frameworks aspirational | Graph references compliance frameworks; no implementation maps controls to these frameworks. |
| G-L14-03 | S3 | TrustLevel has 5 records, no runtime | Graph defines 5 trust levels; no runtime mechanism to evaluate or enforce trust decisions. |

## Summary by Severity

| Severity | Count | Description |
|----------|-------|-------------|
| S1 (Critical) | 0 | No blocking gaps |
| S2 (Major) | 10 | Fragmented ownership, missing abstractions, architectural debt |
| S3 (Minor) | 9 | Naming, organization, cognitive load |
| S4 (Deferred) | 10 | Explicitly out-of-scope for current version |

## Cross-Cutting Gaps

| ID | Severity | Gap | Description |
|----|----------|-----|-------------|
| G-X-01 | S2 | Graph clusters don't match layers | Some node kinds are in "extensions" or "domain" clusters rather than their architectural layer cluster. Makes graph navigation harder. |
| G-X-02 | S3 | No layer tags on packages | Package.json files don't reference which atlas layer(s) they implement. |
| G-X-03 | S2 | Windows support gaps | npm spawn, tar paths, TTY detection — multiple packages have Windows-specific issues that surface as CI failures. |
| G-X-04 | S2 | hooks-adapter-cli version inconsistency | Adapter sub-packages have inconsistent staging version hashes, blocking clean installs. |
