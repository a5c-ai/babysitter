# 02 — Node Kinds

This file is the **catalog of all node kinds** defined by the atlas schema. It is a navigation
and summary surface, not the authoritative spec for each kind. Detailed specs (attributes,
edges, evidence rules, invariants, examples) live in sibling files within this directory;
some kinds get their own file, others are grouped by cluster.

The schema is organized into **15 clusters**. Clusters are an editorial grouping only —
they are not first-class graph entities. Cross-cluster edges are normal and expected; see
the relationship summary at the bottom.

For the meta-schema (how a node-kind file is structured), see
[`../../schema/meta-schema.md`](../../schema/meta-schema.md).

---

## Cluster index

### Cluster 1 — Stack layers (purely structural)

| NodeKind | Purpose |
|---|---|
| `Layer` | one of the 11 stack layers |

### Cluster 2 — Compute path entities

| NodeKind | Purpose |
|---|---|
| `ModelFamily` | a family of models (e.g., Claude Opus 4) |
| `ModelVersion` | a versioned model (e.g., `claude-opus-4-7`) |
| `Provider` | entity serving inference (e.g., Anthropic API) |
| `ModelTransportProtocol` | an LLM wire protocol (Anthropic Messages, OpenAI Responses, Gemini, …) |
| `MCPTransport` | an MCP wire transport (stdio, Streamable HTTP, …) |
| `AgentHostTransport` | how a host talks to an agent process (stdio, http, ws, …) |
| `TransportProxy` | optional interposer (recording, integrity, multiplexing) |

### Cluster 3 — Agent stack

| NodeKind | Purpose |
|---|---|
| `AgentProduct` | productized agent (Claude Code, Codex, …) — the umbrella |
| `AgentVersion` | a version of an AgentProduct |
| `AgentCoreImpl` | concrete loop+transport-client impl |
| `AgentRuntimeImpl` | concrete runtime+tools+hook-sockets impl |
| `AgentPlatformImpl` | concrete platform impl |
| `CapabilityProfile` | a swappable capability bundle |
| `LaunchConfig` | named spawn recipe |
| `SessionModel` | the persistence/control-plane/structured-transport triple |
| `AgentTeam` | named multi-agent team (set of `AgentVersion`s with role assignments + cooperation policy) |
| `Mux` | reified multiplexer entity (agent-mux, hooks-mux, plugins-mux, …) modeled as a first-class node so policies and decisions are queryable |
| `MemoryHierarchy` | layered memory model declared by an `AgentRuntimeImpl` (working / session / cross-session / cross-project tiers) |
| `BackgroundConsolidation` | scheduled compaction/summarization job that runs over a `Session` or `MemoryHierarchy` to reduce state |
| `ConsolidationLock` | mutual-exclusion record for an in-flight `BackgroundConsolidation` so concurrent runs do not double-write |
| `DecisionMemory` | persisted record of an agent decision (verb, rationale, evidence) used as long-term reasoning context |

### Cluster 4 — Surfacing path

| NodeKind | Purpose |
|---|---|
| `Workspace` | project context with sessions+repos |
| `Worktree` | git-worktree per-branch isolation |
| `Execution` | where/how work runs (local/docker/ssh/k8s/cloud/direct) |
| `Sandbox` | what work is allowed to do (policy primitive) |
| `InteractionPattern` | a high-level interaction pattern. _(graph-root: legitimately no parent — editorial top-level concept that classifies `InteractionPrimitive`s; catalog pass 23 hygiene 2026-05-01.)_ **catalog pass 19 addition**: optional `subtype: enum<multi-agent,...>` attribute (new attribute, not enum-extension — verified absent from prior atlas InteractionPattern schema). The `multi-agent` value subsumes the former `MultiAgentPattern` proposal (catalog pass 19 reviewer fold). |
| `InteractionPrimitive` | a concrete primitive (slash-command, @-mention, fork, steering, queueing, …); spec lives in [`../schema/ontology-schema.yaml`](../schema/ontology-schema.yaml) under `nodeKinds.InteractionPrimitive`. The full taxonomy of primitives (8 categories, ~56 entries) is in `wiki/legacy/universal/02-stack.md` Layer 10 pending derivation in Phase 3. |
| `Presentation` | a concrete app shell (TUI, IDE, web, mobile, CI) |
| `OutputStyle` | named formatting profile for agent output (verbosity / markdown / code-fence policy) selected per-session or per-mode |
| `OutputModeChange` | event marking a transition in agent output mode (e.g., switching from chat to plan-mode) — emitted to journal for replay |
| `ProactiveSurface` | UI surface where the agent volunteers content unprompted (suggestions, status banner, ambient panel) |
| `ResponderProfile` | named persona/policy bundle (tone, refusal style, citation rules) applied to an agent's responses |
| `TranscriptIngressEndpoint` | typed endpoint that receives transcript events (file sink, http POST, websocket, observer dashboard) |

### Cluster 5 — Communication primitives

| NodeKind | Purpose |
|---|---|
| `Channel` | brokered communication surface (carries `kind` enum: mcp-channel / a2a-channel / chat-channel / mailbox-channel / http-sse-channel — collapsed from former ChannelKind NodeKind) |
| `HookSurface` | a concrete hook event name (PreToolUse, PhaseChange, etc.); carries `family` enum: shell-hook / in-process / observer (collapsed from former HookFamily NodeKind) |
| `HookMapping` | per-(agent, canonical-hook) mapping recording the agent's native event name, version range, payload shape, and delivery |
| `MergePolicy` | named conflict-resolution policy applied by hooks-mux when fanning out one hook event across many handlers (decision precedence + env-merge rule + system-message strategy) |
| `ProtocolMessage` | a single message at the LLM-protocol layer (Anthropic Messages, OpenAI Responses, …) — distinct from `JournalEvent` (orchestration layer) |
| `JournalEvent` | orchestration-layer event emitted by `AgentRuntimeImpl` / `AgentPlatformImpl` during a run lifecycle — distinct from `ProtocolMessage` (LLM-protocol layer) |
| `Workflow` | a named, declaratively-composed multi-step process orchestrated by an agent runtime (workflows are reusable across runs and may compose `Run`s and `Effect`s) |
| `TransportClient` | concrete client implementation that speaks a `ModelTransportProtocol` or `MCPTransport` (per-agent / per-runtime impl entity) |
| `Grammar` | a named output grammar / structured-output schema enforced on protocol responses (JSON-schema, regex, EBNF) |

### Cluster 6 — Lifecycle (state machines)

| NodeKind | Purpose |
|---|---|
| `Run` | bounded orchestration unit (event-sourced; journaled) — a5c-flavored |
| `Invocation` | bounded agent execution (one process spawn or equivalent) |
| `Session` | persisted conversational state |
| `Phase` | a named state in a phase machine |
| `PhaseTransition` | transition between two phases (gateable) |
| `Effect` | unit of external work in a Run (a5c-flavored) |
| `LifecycleState` | a state in a state machine |
| `StateMachine` | a named state machine over a NodeKind |
| `PhaseMachine` | a finite-state machine over `Phase` nodes declared by a reliability-interface impl (distinct from `StateMachine`, which is general over any NodeKind) |
| `SessionSemantics` | per-agent session behavior (dir strategy, id sources, resume/fork/prune semantics) |
| `LifecycleSemantics` | per-agent runtime lifecycle (hook mode, stop-hook mode, background tasks, checkpoints, plugin context) |
| `AutomationRule` | reactor rule that, on a timer cron or webhook delivery, creates a canonical kanban issue from a fixed task template and routes it onto a derived board |
| `BreakpointStrategy` | named policy controlling when an orchestration pauses for human input (always-pause / timeout / threshold / never) |
| `BreakpointAnswer` | persisted human response to a breakpoint, replayable on resume |
| `WorktreeSession` | a `Session` bound to a specific git `Worktree` for branch-isolated work |
| `EffortLevel` | enum-valued node tagging an `Invocation` or `Effect` with relative compute / time budget (low / medium / high / xlarge) |
| `AgentControlMode` | enum of agent autonomy levels (interactive / supervised / yolo / dry-run) selected per-run |
| `PermissionMode` | enum of permission gating modes for tool use (ask / auto / deny-by-default / allowlist) |
| `PermissionDenialReason` | enum of structured reasons an agent's tool call was denied (sandbox / policy / user-rejected / quota) |
| `MCPConnectionState` | enum of an `MCPTransport` connection's lifecycle state (connecting / ready / degraded / closed) |

### Cluster 7 — Extension primitives

| NodeKind | Purpose |
|---|---|
| `Plugin` | universal plugin (union of skills/MCP/hooks) |
| `NativeExtension` | extension built for one product |
| `PortableExtension` | one source compiled to many products |
| `Skill` | directory-of-markdown content shape |
| `Subagent` | specialized worker content shape |
| `ToolServer` | external process speaking a tool protocol |
| `ToolDescriptor` | a callable tool with schema |
| `Blueprint` | markdown bundle agent reads to install/configure projects (a5c-flavored). Marketplaces a blueprint is published in are recorded via `sourced_from` to a `SourceRef` with `kind: git-marketplace` (the former dedicated `Marketplace` NodeKind was folded into `SourceRef` in the 2026-04-29 remodel). |
| `ExtensionInterface` | a contract an extension fulfills (a5c-flavored: reliability-interface, memory-interface, …) |
| `PluginArtifact` | a single deliverable file (manifest, command, hook script, MCP config, container image, …) emitted by a `PluginTarget` / `AgentVersion` |
| `PluginTarget` | per-agent target spec used by the extension-mux / extension-mux to compile a `Plugin` / `PortableExtension` into a `NativeExtension` (manifest format, command format, install layout, package metadata, distribution model) |
| `LSPServer` | language server bundled in a plugin (Claude Code `.lsp.json`) |
| `BackgroundMonitor` | long-running monitor bundled in a plugin (Claude Code `monitors/monitors.json`) |
| `BinaryProvider` | `bin/` executables added to `PATH` on install |
| `SettingsTemplate` | plugin-shipped settings fragment merged into host settings |
| `PluginMarketplace` | a plugin marketplace registry (a5c, Cursor extension marketplace, etc.) — distinct from `SourceRef`-modeled `git-marketplace` references |
| `PluginInstallScope` | enum of where a plugin is installed (user / project / workspace / global) |
| `MCPConfigScope` | enum of where an MCP server config lives (user / project / per-session) |
| `EnvVar` | a named environment variable consumed by an agent / plugin / runtime — first-class so config provenance is queryable |
| `FrontmatterField` | a recognized YAML frontmatter field on `Skill` / `Subagent` / `Blueprint` content (name, type, required-by, default) |
| `SkillDiscoveryScope` | enum of how a `Skill` is discovered (always / on-demand / triggered-by-pattern) |
| `ToolDispatchPolicy` | named policy for routing tool calls (parallel / serial / first-match / failover) |
| `InteractionPrimitiveCategory` | enum partitioning `InteractionPrimitive`s (slash-command / mention / steering / queueing / confirmation / output-mode / mode-switch / fork) |
| `HarnessHardeningGuidance` | catalog-meta record describing a recommended harness hardening (sandbox, permission default, auth flow) — referenced from a `HarnessHardening` term |
| `CapacityCascadeSignal` | structured event signaling capacity exhaustion in one runtime that should cascade to upstream throttling |
| `HookMergeDiagnostic` | per-event record of how the hooks-mux resolved a multi-handler conflict (decision precedence chain, dropped handlers, env-merge winners) |

### Cluster 8 — Capability descriptors

| NodeKind | Purpose |
|---|---|
| `Capability` | a named capability (streaming, MCP-support, parallel-tool-call, …) |
| `CapabilitySupport` | binding of (entity, capability, version-range, support-level) |
| `InstallMethod` | a canonical install method (npm, brew, gh-extension, curl, winget, scoop, manual, pip, nix, cargo, go-install) referenced by `AgentVersion.installMethods` and plugin/blueprint install records |

### Cluster 9 — Domain ontology

| NodeKind | Purpose |
|---|---|
| `Domain` | broad area (web-development, devops, …) |
| `Specialization` | sub-domain (frontend-react, backend-python-django, …) |
| `Topic` | granular topic (oauth-flows, ssl-certs, …) |
| `Language` | programming language |
| `Framework` | framework (inverts control — calls your code) |
| `Library` | callable code dependency (your code calls it) — distinct from Framework and Tool |
| `Tool` | dev/build/infra tool (bundlers, linters, IaC, CI, observability, …) — distinct from `ToolDescriptor` (agent-callable) and `ToolServer` (MCP) |
| `SkillArea` | named area of expertise (descriptive layer, distinct from `Skill` which carries SKILL.md content) |
| `StackPart` | abstract role a stack component fills (orm, message-queue, vector-database, …); implemented by Library/Framework/Tool |
| `StackProfile` | named composition of language + framework + library + tool + stack-part |

### Cluster 10 — Role ontology

| NodeKind | Purpose |
|---|---|
| `Role` | human or agentic role (with `isAgentic` flag) |
| `Responsibility` | atomic accountable unit |
| `OrgUnit` | team/department/squad |

### Cluster 11 — Benchmarks & evaluation

| NodeKind | Purpose |
|---|---|
| `Benchmark` | named test/test-suite (SWE-bench, HumanEval, GAIA, …) |
| `TestSet` | named collection of test cases |
| `EvalRun` | one execution of a benchmark against a target |
| `EvalResult` | scored result of an EvalRun |
| `ClaimTest` | catalog-meta test that asserts properties of a `Claim` (well-formedness, evidence resolves, freshness) |
| `ClaimTestRun` | one execution of a `ClaimTest` against the live catalog (pass/fail + diagnostics) |

### Cluster 12 — Trust

> **Scope note:** the Trust Chain (cross-stack signing / attestation) is
> out-of-scope for the atlas Phase 1 ontology. The `Authority` and `Attestation`
> NodeKinds (and the `trust-interface` ExtensionInterface) have been removed
> from the Phase 1 catalog and deferred to a separate trust-and-signing
> initiative. Only the evidence-grading primitive `TrustLevel` remains.

| NodeKind | Purpose |
|---|---|
| `TrustLevel` | enum: official-web, vendor-doc, community, synthetic — grades evidence quality (NOT a chain-signing concept) |

### Cluster 13 — Catalog meta

| NodeKind | Purpose |
|---|---|
| `Claim` | a claim of fact about an entity attribute |
| `EvidenceSource` | source backing a claim (URL, file, package, etc.) |
| `EvidencePolicy` | which claims need evidence, freshness windows, reviewer rules |
| `SourceRef` | repo+ref+path pointer to source-of-truth for an artifact |
| `ScopeBoundary` | inScope / outOfScope declaration with optional evidence |
| `OutOfScopeReason` | structured reason for out-of-scope |
| `OpenQuestion` | named TBD with owner, raised when an attribute can't yet be claimed |
| `Gap` | tracked debt-loop finding (level 1-7, priority, propagation status); first-class so gap state is queryable from the graph |
| `PathDescriptor` | typed pointer to a host filesystem path (run dir, session dir, MCP config, plugin scope, vendor auth) |
| `PackageSurface` | workspace package tracking (module type, surface kinds, source-of-truth role, publish target) |
| `CiSurface` | CI/CD spec for a `PackageSurface` (scripts, publish strategy, release channels, validation, artifact expectations) |
| `DiscoverySignal` | host-detection signal (env var, binary on PATH, file presence, registry key, argv match, exit code, combination) used by `agent-mux` to detect installed / active agent harnesses |
| `DeploymentTarget` | named Kubernetes / minikube cluster target the babysitter cloud package deploys onto (minikube / existing / EKS / AKS / GKE) — drives terraform + manifest apply |
| `RunJournalEvent` | enum of run journal event names emitted by the babysitter runtime (RUN_CREATED, EFFECT_REQUESTED / RESOLVED / CANCELLED / PROGRESS, RUN_COMPLETED / FAILED, COST_TRACKED, STOP_HOOK_INVOKED) — categorized + terminal-flagged |
| `SharedContextSpec` (stub) | shape of an a5c shared-context fabric record — full spec Phase 2 |
| `DecisionVerb` (stub) | ordered enum of hook decision verbs (deny<ask<allow<continue<noop) with `rank` and `block` — full spec Phase 2 |
| `GithubActionStep` | one step in a GitHub Actions workflow (uses / run / with-args), modeled so CI provenance is queryable |
| `APIErrorClass` | a named class of API error (rate-limit, auth, 5xx, transport) used by retry/backoff policies and observability |

### Cluster 14 — Terminology

| NodeKind | Purpose |
|---|---|
| `Term` | a named term in the ontology |
| `Definition` | a definition of a term (a term may have many definitions in different contexts) |
| `Synonym` | a term that means the same as another in a stated context |
| `Acronym` | abbreviation expanding to a term |

`Term` carries: `displayName`, `kind` (enum: concept / role / layer / primitive / mux / extension-shape / hook / capability / lifecycle-state / protocol / format / tool / operation — collapsed from former TermKind NodeKind), `canonicalDefinition` (ref
`Definition`), `usageContexts` (list of refs to `Domain` | `Layer` | `AgentProduct`),
`firstUseEvidence` (`EvidenceSource`).

Edges from `Term`: `defined_in_context_of` → `Domain` | `Layer` | NodeKind;
`synonym_of` → `Term` (with `inContext`); `replaces` → `Term` (deprecation chain);
`subsumes` → `Term` (broader/narrower); `references` → NodeKind | `Capability`
(anchors terms to actual schema entities).

This makes the glossary derivable: querying `Term`s with `kind=mux` produces the mux
glossary; querying `Term`s used in `Layer` 6 produces the layer-6 glossary.

### Cluster 15 — Catalog provenance (cross-cutting)

| NodeKind | Purpose |
|---|---|
| `OntologySchema` (stub) | the catalog ontology itself, modeled as a first-class entity for claims/versioning — full spec Phase 2 |

---

## Cross-cluster relationship summary

The clusters are an editorial frame; the real wiring is the edges between them.

- **Compute path → Agent stack**: `AgentCoreImpl` `speaks` `ModelTransportProtocol`;
  `AgentRuntimeImpl` `speaks` `MCPTransport`; `AgentPlatformImpl` `exposes`
  `AgentHostTransport`. `AgentVersion` `bound_to` `ModelVersion` (via
  `LaunchConfig` / `CapabilityProfile`).
- **Stack layers → everything else**: every implementation node (`AgentCoreImpl`,
  `AgentRuntimeImpl`, …, `Presentation`, `Channel`, `Hook`) `realizes` one or more
  `Layer` nodes. This is how the 11-layer stack is reified.
- **Surfacing path → Lifecycle**: `Workspace` `contains` `Session`; `Session` `runs_in`
  `Execution`; `Invocation` `executes_in` `Sandbox`; `Run` `spans` many `Invocation`s.
- **Extension primitives → Capability**: `Plugin` / `NativeExtension` / `PortableExtension`
  `provides` `Capability`; `ToolDescriptor` `requires` `Capability`. `CapabilitySupport`
  is the n-ary binding that records *which entity* supports *which capability* at
  *which version range* and *what support level*.
- **Communication ↔ Lifecycle**: `HookSurface` is fired during `PhaseTransition`s and
  inside `Invocation`s; `Channel`s carry messages between `Invocation`s and external
  peers.
- **Catalog meta is cross-cutting**: any attribute on any node can carry one or more
  `Claim`s, each backed by `EvidenceSource`s under an `EvidencePolicy`. `OpenQuestion`s
  hang off attributes that can't yet be claimed; `ScopeBoundary` declares whether an
  attribute is in or out of scope at all.
- **Terminology is cross-cutting**: a `Term` `references` any NodeKind or `Capability`,
  giving every concept in prose a canonical anchor in the graph.
- **Provenance is cross-cutting**: every node carries a `catalogVersion` (ref
  `CatalogVersion`); `DerivedArtifact`s record which `Generator` produced them from
  which graph snapshot, so docs, types, and scaffolds stay traceable.

For the full attribute / edge / evidence / invariant spec of any kind, open its
corresponding file in this directory.

