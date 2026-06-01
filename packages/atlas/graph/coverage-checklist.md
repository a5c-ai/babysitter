# Coverage Checklist

This document is the Phase 1 gate. Every concept in `wiki/legacy/` must trace to a schema element here, OR appear on the "Out of Scope" list with a reason.

## How to read

Each row records: `Concept | Source location | Schema mapping | Status | Notes`.

Status values:

- ✅ covered — has a clear schema home
- 🟡 partial — captured but with gaps; remediation noted
- ⏳ open — needs follow-up; an `OpenQuestion` entry should exist
- 🚫 out-of-scope — deliberately not in schema; reason given

Schema references use NodeKind names defined in `./schema/node-kinds/README.md` (15 clusters). Where a concept becomes a `Term` plus an entity, both are noted.

---

## Coverage table

### Stack layers (the 11-layer scheme)

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| 14-layer stack as the canonical frame | universal/00-overview.md, 02-stack.md, architecture/stack-diagram.md | NodeKind `Layer` (cluster 1); 14 instances `layer:1-model` … `layer:14-governance`; Term with kind=layer | ✅ | each layer reified as graph node; cross-cluster `realizes` edge from impl nodes |
| Layer 1 — Model | universal/02-stack.md §Layer 1 | `Layer` `layer:1-model`; `ModelFamily` + `ModelVersion` (cluster 2) `realizes` it | ✅ | model attributes (`contextWindowTokens`, `costPer1kInputTokens`, `costPer1kOutputTokens`, `supportsThinking`, `thinkingEffortLevels`, `supportsThinkingBudgetTokens`, `supportsToolCalling`, `supportsStreaming`, `supportsParallelToolCalls`, `modalities`, `releaseDate`, `deprecationDate`, `eolDate`, `regions`) live as `Claim`s on `ModelVersion` |
| Layer 2 — Provider | universal/02-stack.md §Layer 2 | `Layer` `layer:2-provider`; `Provider` (cluster 2); provider auth, endpoint, quota, pricing, and local-model-source concerns are represented as Provider attributes/related nodes, not nested layer nodes | ✅ | provider attributes (`authMethods`, `endpoints`, `pricing`, `regions`, `supportedModels`) as `Claim`s |
| Layer 3 — Model-Transport | universal/02-stack.md §Layer 3 | `Layer` `layer:3-transport`; transport protocol, client, and proxy are responsibilities/examples on the top-level Transport layer | ✅ | three responsibility boxes below |
| 3a Transport-Protocol | universal/02-stack.md §3a; 04-protocols.md §1 | `ModelTransportProtocol` instances (Anthropic Messages, OpenAI Responses, OpenAI ChatCompletions, Gemini generateContent, Bedrock Invoke, Bedrock Converse, Local-model OpenAI-compat, custom) | ✅ | `ModelVersion` `speaks` `ModelTransportProtocol` edge |
| 3b Transport-Client | universal/02-stack.md §3b | Transport-client behavior is represented by `AgentCoreImpl.speaks` and transport client attributes | ✅ | `AgentCoreImpl` `speaks` `ModelTransportProtocol` |
| 3c Transport-Proxy | universal/02-stack.md §3c | `TransportProxy` NodeKind (cluster 2) with kinds `recording` / `integrity` / `local-model` / `compression` | ✅ | optional interposer |
| MCP-Transport (sibling concept; not a layer) | universal/00-overview.md, 02-stack.md, 04-protocols.md §1.5 | `MCPTransport` NodeKind (cluster 2) with sub-types `stdio`, `Streamable HTTP`, `HTTP+SSE` (deprecated), `WebSocket` (community); `Term` with `kind=concept`, `synonym_of` distinguishes from Model-Transport | ✅ | per-sub-type `ScopeBoundary` flags `WebSocket` as not-in-spec |
| Agent Host Transport (per-product property) | universal/00-overview.md, 01-terminology.md §Agent Host Transport, 06-channels-sessions-hooks.md §4 | `AgentHostTransport` NodeKind (cluster 2) with values `stdio`, `stdio+pty`, `http`, `ws`, `grpc`, `MCP`; attached to `AgentVersion` via `exposes`; legacy name "Comm-Mode" recorded as deprecated `Synonym` via `replaces` | ✅ | three-boundary distinction encoded as `Term`s with cross-references |
| Layer 4 — Agent-Core | universal/02-stack.md §Layer 4 | `Layer` `layer:4-agent-core`; `AgentCoreImpl` realizes it; loop/context/tool/subagent/result/stop concerns are responsibilities/examples on the layer and attributes/edges on implementations | ✅ | seven named sub-components captured |
| Layer 5 — Agent-Runtime | universal/02-stack.md §Layer 5 | `Layer` `layer:5-agent-runtime`; `AgentRuntimeImpl` realizes it; built-in tools, session state, hooks, registry, approvals, MCP, and identity are runtime attributes/edges | ✅ | per-product built-in tool sets recorded as `ToolDescriptor` instances `provides` `AgentRuntimeImpl` |
| Layer 6 — Agent-Platform | universal/02-stack.md §Layer 6 | `Layer` `layer:6-agent-platform`; `AgentPlatformImpl` realizes it; plugin/skill/channel/identity/marketplace/update concerns are platform attributes/edges | ✅ | sub-components per row below |
| Capability Profile | universal/01-terminology.md §3, 02-stack.md §Layer 6 | `CapabilityProfile` NodeKind (cluster 3); `Term` with note on Cursor vs Codex divergence as separate `Synonym` records `inContext` | ✅ | divergence-as-data per design principle |
| Native Plugin loader | universal/02-stack.md §Layer 6 | Layer 6 responsibility: native plugin loader | ✅ | |
| Skill loader | universal/02-stack.md §Layer 6 | Layer 6 responsibility: skill loader | ✅ | |
| MCP-server bridge | universal/02-stack.md §Layer 6 | Layer 6 responsibility: MCP-server bridge | ✅ | speaks `MCPTransport` |
| A2A bridge | universal/02-stack.md §Layer 6 | Layer 6 responsibility: A2A bridge | ✅ | |
| Channel adapters | universal/02-stack.md §Layer 6, 06-channels-sessions-hooks.md | Layer 6 responsibility: channel adapters; per-`ChannelKind` adapter; see Channels section | ✅ | |
| Launch Config | universal/01-terminology.md §3, 02-stack.md §Layer 6 | `LaunchConfig` NodeKind (cluster 3) | ✅ | |
| Platform Identity | universal/02-stack.md §Layer 6 | Layer 6 responsibility: platform identity; consumed by `identity-interface` `ExtensionInterface` | ✅ | distinct from Provider auth and Run Principal |
| Marketplace Client | universal/02-stack.md §Layer 6 | Layer 6 responsibility: marketplace client | ✅ | |
| Plugin Manager | universal/02-stack.md §Layer 6 | Layer 6 responsibility: plugin manager | ✅ | |
| Update Channel | universal/02-stack.md §Layer 6 | Layer 6 responsibility: update channel | ✅ | |
| Tool-Server bridge | universal/02-stack.md §Layer 5 (Tool registry / MCP client) | covered by Layer 5 runtime tool-registry attributes plus Layer 6 MCP-server bridge responsibilities | ✅ | term "Tool-Server" recorded as `Term` `synonym_of` "MCP Server" `inContext=a5c-legacy`, deprecated |
| Layer 7 — Workspace | universal/02-stack.md §Layer 7 | `Layer` `layer:7-workspace`; `Workspace` NodeKind (cluster 4) | ✅ | workspace registry, repo records, session bindings, worktrees, materialization, and state machine are Workspace attributes/edges |
| Workspace state machine (active/idle/archived/cleaned/missing) | universal/02-stack.md §Layer 7 | `StateMachine` over `Workspace`; `LifecycleState` instances `active`, `idle`, `archived`, `cleaned`, `missing` | ✅ | |
| Workspace materialization modes (worktree, symlink, clone, copy, virtual) | universal/02-stack.md §Layer 7 | enum on `Workspace.materialization` with values `worktree`, `symlink`, `clone`, `copy`, `virtual`; `Term` for each | ✅ | extension modes resolved 2026-04-28 — `clone`/`copy`/`virtual` added to enum (clone=independent full git clone; copy=non-git filesystem snapshot; virtual=overlay/FUSE/in-memory). OQ `oq:workspace-materialization-extensions` closed. |
| Worktree | universal/01-terminology.md, 02-stack.md §Layer 7 | `Worktree` NodeKind (cluster 4) | ✅ | |
| Layer 8 — Execution | universal/02-stack.md §Layer 8 | `Layer` `layer:8-execution`; `Execution` NodeKind (cluster 4) | ✅ | |
| Execution modes (local-subprocess, sandboxed, docker, ssh-remote, k8s, cloud, direct-bypass) | universal/02-stack.md §Layer 8; a5c/02-muxes.md §2 | enum on `Execution.mode`; one `Term` per mode `kind=lifecycle-state` | ✅ | |
| Per-agent runtime constraints (`requiresGitRepo`, `requiresPty`, `supportedPlatforms`) | universal/02-stack.md §Layer 8 | `Capability` instances `cap:requires-git-repo`, `cap:requires-pty`, `cap:supported-platforms`; `CapabilitySupport` per `AgentPlatformImpl` | ✅ | platform-sub-impl per modeling rule in `./schema/node-kinds/agent-stack.md` |
| Layer 9 — Sandbox | universal/02-stack.md §Layer 9 | `Layer` `layer:9-sandbox`; `Sandbox` NodeKind (cluster 4) | ✅ | |
| Sandbox profile fields (filesystem allow/denylist, network allow/denylist, exec deniedBinaries / allowedPrefixes, env-var scope, secret access scope) | universal/02-stack.md §Layer 9, architecture/stack-diagram.md | attributes on `Sandbox`; one `Term` for each primitive | ✅ | enforcement-by-execution-mode encoded via `Execution` `enforces_via` `Sandbox` edge |
| Layer 10 — Interaction | universal/02-stack.md §Layer 10 | `Layer` `layer:10-interaction`; visible `InteractionPrimitive` affordances remain here while control-plane `OrchestrationPrimitive` nodes move to `layer:13-orchestration` | ✅ | nine categories captured (a–i) |
| Interaction primitives (~56+; nine categories) | universal/02-stack.md §Layer 10; graph/schema/node-kinds/interaction-primitives.md | `InteractionPrimitive` per primitive with `category` enum (command, context, conversation, approval-safety, configuration, visibility, plan-mode, multi-session, **steering-and-queueing**) | ✅ | per-product support recorded as `CapabilitySupport`; primitive matrix derivable |
| Steering primitive (new) | graph/schema/node-kinds/interaction-primitives.md (steering-and-queueing) | `InteractionPrimitive` `category=steering-and-queueing` `kind=steering` | ✅ | new in atlas |
| Queued message / next-tool-call | graph/schema/node-kinds/interaction-primitives.md | `InteractionPrimitive` `category=steering-and-queueing` `kind=queued-message` | ✅ | |
| Slash command (native / custom / plugin / MCP-prompt) | universal/01-terminology.md, 02-stack.md §Layer 10 | `InteractionPrimitive` `category=command`; `kind` sub-enum `native`, `custom`, `skill-invocation`, `subagent-invocation`, `plugin-command`, `mcp-prompt` | ✅ | |
| @-mention | universal/01-terminology.md, 02-stack.md §Layer 10 | `InteractionPrimitive` `category=context` `kind=at-mention` | ✅ | per-target subtypes (file/folder/code/docs/web/git/past-chats/symbol) as attributes |
| Plan mode | universal/01-terminology.md, 02-stack.md §Layer 10 | `InteractionPrimitive` `category=plan-mode` `kind=plan-entry`/`plan-view`/`plan-approval`/`plan-exit` | ✅ | |
| Fork / branch (conversation primitive) | universal/01-terminology.md, 02-stack.md §Layer 10 | `InteractionPrimitive` `category=conversation` `kind=fork` | ✅ | distinct from `context: fork` skill frontmatter — that is captured as `Skill.contextMode=fork` |
| Rewind / Checkpoint | universal/01-terminology.md, 02-stack.md §Layer 10 | `InteractionPrimitive` `category=conversation` `kind=rewind` | ✅ | |
| Replay | universal/01-terminology.md, 02-stack.md §Layer 10 | `InteractionPrimitive` `category=conversation` `kind=replay` | ✅ | |
| Approval Mode (yolo, prompt, deny) | universal/01-terminology.md §3, 02-stack.md §Layer 10 | enum on `CapabilityProfile.approvalMode`; `InteractionPrimitive` `category=approval-safety` `kind=approval-mode-toggle`; one `Term` per value | ✅ | |
| Sandbox-mode toggle | universal/01-terminology.md, 02-stack.md §Layer 10 | `InteractionPrimitive` `category=approval-safety` `kind=sandbox-mode-toggle` | ✅ | |
| Worktree-per-task | universal/01-terminology.md, 02-stack.md §Layer 10 | `InteractionPattern` `pattern:worktree-per-task`; composed of `worktree`+`background-task` primitives | ✅ | |
| Teleport (cross-shell continuation) | universal/01-terminology.md, 02-stack.md §Layer 10 | `InteractionPrimitive` `category=multi-session` `kind=teleport` | ✅ | |
| Routine / Scheduled prompt | universal/01-terminology.md, 02-stack.md §Layer 10 | `InteractionPrimitive` `category=multi-session` `kind=schedule`/`loop` | ✅ | |
| Layer 11 — Presentation | universal/02-stack.md §Layer 11 | `Layer` `layer:11-presentation`; `Presentation` NodeKind (cluster 4) | ✅ | values `tui`, `ide`, `web`, `mobile`, `desktop`, `ci-runner`, `headless-sdk` |

### How layers compose

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Compute path / Surfacing path framing | universal/00-overview.md, 02-stack.md | derivable from `Layer.position` (1–11) + `Layer.path` enum (`compute`, `surfacing`) | ✅ | |
| End-to-end run flow (13-step composition) | universal/02-stack.md §How the layers compose | derivable diagram; not stored as a node — each step is an edge already (`InteractionPattern` `composes` primitives, `AgentVersion` `bound_to` `ModelVersion` etc.) | ✅ | derived view per design principle |

### Mux family (a5c-flavored — the 9 muxes)

A `Mux` is treated as `ExtensionInterface` (a5c-flavored contract) plus implementation attached to the relevant top-level `Layer`. Each mux has a `Term` `kind=mux`.

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Mux concept (a5c-coinage) | a5c/00-overview.md, 02-muxes.md | `Term` `term:mux` `kind=concept`; `Synonym` of industry `adapter`/`gateway`/`bridge` | ✅ | |
| transport-mux (#1) | a5c/02-muxes.md §1 | `ExtensionInterface` `iface:transport-mux`; `ProcessDescriptor` `pkg:@a5c-ai/transport-mux` | ✅ | |
| agent-launch-mux (#2) | a5c/02-muxes.md §2 | `ExtensionInterface` `iface:agent-launch-mux`; realized in `agent-mux/core` + adapters | ✅ | |
| agent-comm-mux (#3) | a5c/02-muxes.md §3 | `ExtensionInterface` `iface:agent-comm-mux` | ✅ | |
| session-storage-mux (#4) | a5c/02-muxes.md §4 | `ExtensionInterface` `iface:session-storage-mux` | ✅ | |
| agent-config-mux (#5) | a5c/02-muxes.md §5 | `ExtensionInterface` `iface:agent-config-mux` | ✅ | |
| hooks-mux (#6) | a5c/02-muxes.md §6 | `ExtensionInterface` `iface:hooks-mux`; `ProcessDescriptor` `pkg:@a5c-ai/hooks-mux` | ✅ | |
| extension-mux (#7) | a5c/02-muxes.md §7 | `ExtensionInterface` `iface:extension-mux`; `ProcessDescriptor` `pkg:@a5c-ai/extension-mux` | ✅ | |
| tool-mux (#8) | a5c/02-muxes.md §8 | `ExtensionInterface` `iface:tool-mux` | ✅ | |
| tasks-mux (#9) | a5c/02-muxes.md §9 | `ExtensionInterface` `iface:tasks-mux`; `ProcessDescriptor` `pkg:@a5c-ai/tasks-mux` | ✅ | |
| Mux native side / canonical side framing | a5c/02-muxes.md preamble | attributes `nativeProtocols` and `canonicalProtocol` on `ExtensionInterface` (kind=mux) | ✅ | |
| "What is not a mux" rejected list (identity, secrets, memory, trust, policy, blueprints, install, events, observability) | a5c/02-muxes.md §What is not a mux | each captured as `Term` with note + `replaces` to corresponding `ExtensionInterface` (or `OutOfScopeReason`) | ✅ | |
| Mux bridging concerns (per-mux: spawn args, env-vars, signal propagation, etc.) | a5c/02-muxes.md (each section) | attributes on `ExtensionInterface` (kind=mux) `bridgingConcerns[]` | ✅ | |
| Invocation lifecycle (9 states) — captured under tasks-mux/launch-mux | a5c/02-muxes.md §2; a5c/05-sdk.md | see Lifecycle section below | ✅ | |
| Hook merge policies (most-restrictive-wins, single-writer-only, concat, keep-first, union, key-wise) | a5c/02-muxes.md §6, universal/06-channels-sessions-hooks.md §3.4 | enum on `Hook.mergePolicy`; per-policy `Term` | ✅ | |
| DECISION_PRECEDENCE (deny < ask < allow < continue < noop) | a5c/02-muxes.md §6, a5c/04-reliability.md | ordered enum `DecisionVerb` with rank attribute; orthogonal `block` flag declared as separate attribute (not part of enum) | ✅ | |
| Hook error policies (`fail-open`, `fail-on-conflict`, `fail-closed-bootstrap-only`) | a5c/02-muxes.md §6 | enum `Hook.errorPolicy` | ✅ | |
| MergeDiagnostics output | a5c/02-muxes.md §6 | attribute schema `Hook.mergeDiagnosticsShape` | 🟡 | structure named; full attribute spec is detail for `./schema/validation-rules.md` |
| Per-PluginTarget metadata (adapterFamily, distribution, distributionModel, marketplacePath, installLayout, packageMetadata, componentSupport, npmPublishable, scriptVariants, pluginRootEnvVar) | a5c/02-muxes.md §7 | attributes on `NativeExtension`/`PluginTarget` (cluster 7) | ✅ | live binding to `packages/agent-catalog/graph/nodes/hooks-and-plugins/plugin-targets.yaml` |
| Per-agent generators (generateClaudeCodeHooksJson, generateCodexHooksJson, generateCursorHooksJson [bash + powershell], generateGeminiHooksJson, generatePiHooksJson, …) | a5c/02-muxes.md §7 | `Generator` NodeKind (cluster 15) instances; `DerivedArtifact` per output | ✅ | |
| Tool-calling nuances — see "Tool calling nuances" section below | a5c/02-muxes.md §8 | see dedicated section | ✅ | |
| Cursor capability-profile mid-session switches (with bash + powershell hook variants) | a5c/02-muxes.md §3 | `CapabilityProfile.runtimeSwitchable=true`; `NativeExtension.scriptVariants=[bash, powershell]` | ✅ | |

### Extension interfaces (a5c — 14 contracts)

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| ExtensionInterface concept | a5c/03-extension-interfaces.md preamble | `ExtensionInterface` NodeKind (cluster 7); `Term` `kind=extension-shape` | ✅ | |
| reliability-interface (#1) | a5c/03-extension-interfaces.md §1, 04-reliability.md | `ExtensionInterface` `iface:reliability-interface` | ✅ | |
| memory-interface (#2) | a5c/03-extension-interfaces.md §2 | `ExtensionInterface` `iface:memory-interface` | ✅ | |
| secrets-interface (#3) | a5c/03-extension-interfaces.md §3 | `ExtensionInterface` `iface:secrets-interface` (planned-status flag) | ✅ | live read-only auth-manager surface noted as `Claim` `liveStatus=partial` |
| identity-interface (#4) | a5c/03-extension-interfaces.md §4 | `ExtensionInterface` `iface:identity-interface` | ✅ | |
| trust-interface (#5) | a5c/03-extension-interfaces.md §5 | (removed — Trust Chain de-scoped from Phase 1 ontology) | 🚫 | Out-of-scope-for-ontology: Trust Chain (cross-stack signing) is not in the ontology / Phase 1 scope; defer to a separate trust-and-signing initiative if pursued. ExtensionInterface count is now 13. |
| governance-interface (#6) | a5c/03-extension-interfaces.md §6 | `ExtensionInterface` `iface:governance-interface` | ✅ | |
| telemetry-interface (#7) | a5c/03-extension-interfaces.md §7 | `ExtensionInterface` `iface:telemetry-interface` | ✅ | event categories `run.*`, `effect.*`, `hook.*`, `phase.*`, `decision.*`, `cost.*` as enum |
| sandbox-interface (#8) | a5c/03-extension-interfaces.md §8 | `ExtensionInterface` `iface:sandbox-interface` | ✅ | |
| reflection-interface (#9) | a5c/03-extension-interfaces.md §9 | `ExtensionInterface` `iface:reflection-interface` | ✅ | |
| orchestration-interface (#10) | a5c/03-extension-interfaces.md §10 | `ExtensionInterface` `iface:orchestration-interface` | ✅ | |
| reactor-interface (#11) | a5c/03-extension-interfaces.md §11 | `ExtensionInterface` `iface:reactor-interface` | ✅ | |
| sleep-cycle-interface (#12) | a5c/03-extension-interfaces.md §12 | `ExtensionInterface` `iface:sleep-cycle-interface` | ✅ | |
| compression-interface (#13, lifecycle-scoped during-run) | a5c/03-extension-interfaces.md §13 | `ExtensionInterface` `iface:compression-interface`; attribute `scope=during-run` | ✅ | |
| optimization-interface (#14, lifecycle-scoped between-runs) | a5c/03-extension-interfaces.md §14 | `ExtensionInterface` `iface:optimization-interface`; attribute `scope=between-runs` | ✅ | |
| Multi-interface extension declaration | a5c/03-extension-interfaces.md §Multi-interface, 07-extensions.md | edge `PortableExtension` `implements` `ExtensionInterface` (many) | ✅ | |
| Built-in default impl per interface | a5c/03-extension-interfaces.md (each section) | attribute `ExtensionInterface.builtInDefault` (ref to a `NativeExtension` or `Claim` describing it) | ✅ | |
| Heavyweight impl examples per interface | a5c/03-extension-interfaces.md (each section) | `NativeExtension`/`PortableExtension` `implements` `ExtensionInterface` with `weight=heavy` | ✅ | |

### Shared Context (a5c-construct)

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Shared Context fabric (a5c-named) | a5c/03-extension-interfaces.md §Shared Context | `Term` `term:shared-context` `kind=concept`; not an `ExtensionInterface` (per source); attributes recorded on a `SharedContextSpec` Claim attached to `iface:reliability-interface` and consumers | 🟡 | considered out-of-scope as a NodeKind (it is a fabric, not a contract); covered as a structured `Claim`. If queryability becomes important, promote to `Term`-anchored `Spec` node. |
| Shared Context scopes (per-tool-call, per-turn, per-run, per-session, per-agent-instance, per-process, global) | a5c/03-extension-interfaces.md §Shared Context | enum `SharedContextScope`; one `Term` per value `kind=lifecycle-state` | ✅ | |
| Shared Context operations (`get`, `set`, `delete`, `namespace`) | a5c/03-extension-interfaces.md | attribute on Claim | ✅ | |
| Shared Context naming conventions (camelCase, `/` namespacing, `_a5c/*` reserved) | a5c/03-extension-interfaces.md | attribute on Claim | ✅ | |
| Distinct-from-memory and distinct-from-secrets clarifications | a5c/03-extension-interfaces.md | recorded as `Term.notes` | ✅ | |

### Lifecycle (state machines)

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Session lifecycle (universal) `created → active → suspended → terminated` | universal/01-terminology.md, 06-channels-sessions-hooks.md §5.1 | `StateMachine` over `Session`; `LifecycleState` instances | ✅ | |
| Agent invocation lifecycle (universal) `spawned → running → (paused | interrupted) → (completed | aborted | timed-out | crashed | killed)` | universal/01-terminology.md, 06-channels-sessions-hooks.md §5.2 | `StateMachine` over `Invocation`; 9 `LifecycleState`s | ✅ | matches a5c/02-muxes.md §2 transition map |
| Invocation 9-state strict transition map | a5c/02-muxes.md §2, a5c/05-sdk.md | `PhaseTransition`/transition records on `StateMachine`; `assertTransition` invariant in `./schema/validation-rules.md` | ✅ | terminal: aborted, timed-out, completed, crashed, killed |
| Run vs Invocation distinction (a5c) | universal/01-terminology.md (run-name conflict), a5c/02-muxes.md §2, a5c/05-sdk.md | `Run` and `Invocation` separate NodeKinds; `Term` `term:run` notes a5c-reservation; `Term` `term:invocation` is canonical | ✅ | resolved per "what is the canonical name" Open Question |
| Babysitter Process Run lifecycle (created/waiting/completed/failed) | a5c/05-sdk.md §Process Runs | `StateMachine` over `Run`; states derived from journal — encoded as `Run.statePredicate` | ✅ | source-of-truth = journal; `waiting ⇔ pending-effect-count > 0` |
| Run journal events (`RUN_CREATED`, `EFFECT_REQUESTED`, `EFFECT_RESOLVED`, `EFFECT_CANCELLED`, `RUN_COMPLETED`, `RUN_FAILED`) | a5c/04-reliability.md, a5c/05-sdk.md | enum `RunJournalEvent`; one `Term` per | ✅ | iteration markers `iteration-start`/`iteration-end` also recorded |
| Effect statuses (`requested`, `pending`, `ok`, `error`, `cancelled`) | a5c/00-overview.md, 04-reliability.md, 05-sdk.md | `LifecycleState` instances on `Effect` | ✅ | status↔journal-event mapping captured |
| Effect concept (algebraic-effects framing) | a5c/05-sdk.md §Effects | `Effect` NodeKind (cluster 6); `Term` `term:effect` notes industry analogues (Activity/Step/Task) as `Synonym` `inContext` | ✅ | |
| Invocation key (hash of processId+stepId+taskId+args) | a5c/04-reliability.md, a5c/05-sdk.md | attribute `Effect.invocationKey` with hash spec | ✅ | |
| Atomic Write Protocol | a5c/04-reliability.md §Run engine integrity | `Claim` `runEngineInvariant=atomic-write-protocol` on `Run` | ✅ | |
| ReplayCursor (`S000001`, `S000002`, …) | a5c/04-reliability.md, a5c/05-sdk.md | attribute `Run.replayCursor`; `Term` `term:replay-cursor` | ✅ | |
| completionProof artifact | a5c/04-reliability.md, 05-sdk.md, 08-trust-chain.md | attribute `Run.completionProof`; reachable as Trust Chain attachment point | ✅ | live in repo |
| Run dir layout (`.a5c/runs/<runId>/`: `journal.ndjson`, `effects/`, `locks/`, `completion-proof.json`, `metadata.json`) | a5c/05-sdk.md §Run directory layout | `PathDescriptor` per file; attribute `Run.directoryLayout` | ✅ | |
| Layout version (`layoutVersion`) | a5c/05-sdk.md | attribute `Run.layoutVersion`; gated by versioning subsystem | ✅ | |
| Run metadata fields (runId, request, processId, harness/agent, nested, entrypoint, processPath, processRevision, layoutVersion, createdAt, completionProof, prompt, inputSchema, outputSchema) | a5c/04-reliability.md, 05-sdk.md | attribute schema on `Run` | ✅ | |
| Harness → Agent rename | a5c/04-reliability.md §Harness rename note, 05-sdk.md | `Term` `term:harness` `replaced_by term:agent` with `status=deprecated`; per-product migration recorded via `replaces` edges between Term nodes | ✅ | resolved 2026-04-28 — Term graph is the canonical source; no separate ADR needed. OQ `oq:harness-agent-rename-migration` closed. |
| Phase / PhaseChange / PhaseChangeCheck | universal/01-terminology.md §Phase, a5c/04-reliability.md | `Phase` and `PhaseTransition` NodeKinds (cluster 6) | ✅ | |
| Common phase machines (intake→plan→execute→review→done; triage→reproduce→diagnose→fix→verify→done; read→analyze→propose→answer→done) | a5c/04-reliability.md | `StateMachine` instances `sm:general-dev`, `sm:debug`, `sm:research` | ✅ | |
| Phase machines in the wild (process library + repo overrides) | a5c/04-reliability.md §Phase machines in the wild | edge `Run.phaseMachine` resolved from process library; `Claim` records repo-override invariants | ✅ | |
| Decision-Point (universal) | universal/01-terminology.md §Decision-Point, a5c/02-muxes.md §9 | `Term` `term:decision-point` `kind=concept`; surfaced as `Phase` gate or as `tasks-mux` Decision (legacy=Breakpoint) | ✅ | |

### Hooks (canonical taxonomy)

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Hook (universal pattern) | universal/01-terminology.md §6, 06-channels-sessions-hooks.md §3 | `Hook` NodeKind (cluster 5) | ✅ | |
| Canonical hook surfaces (14) | universal/06-channels-sessions-hooks.md §3.0, a5c/02-muxes.md §6 | `HookSurface` instances: `SessionStart`, `Stop`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `AfterAgent`, `SessionEnd`, `SessionIdle`, `ShellEnv`, `BeforePromptBuild`, `SubagentStop`, `Notification`, `PreCompact`, `BeforeProviderRequest` | ✅ | matches catalog `hook-surfaces.yaml` |
| a5c-introduced canonical hooks (`PhaseChange`, `PhaseChangeCheck`, `Wake`, `DecisionPoint`) | universal/04-protocols.md §3 (gaps), a5c/04-reliability.md | `HookSurface` instances marked `origin=a5c-orchestration` | ✅ | distinct from native canonical hooks |
| BreakpointLegacy hook (legacy → DecisionPoint mapping) | a5c/02-muxes.md §9 (rename), a5c/05-sdk.md (`on-breakpoint` → `on-decision`) | `HookSurface` `BreakpointLegacy` `replaces` (synonym) `DecisionPoint` `inContext=sdk-legacy` | ✅ | |
| Per-product native hook names | universal/06-channels-sessions-hooks.md §3.1, a5c/02-muxes.md §6 | `HookMapping` edge `AgentVersion → HookSurface` with `nativeName` attribute | ✅ | claude, codex, gemini, copilot, cursor, opencode, pi/omp/openclaw/hermes |
| Hook delivery families (`shell-hook`, `in-process`, `observer`) | universal/01-terminology.md, 06-channels-sessions-hooks.md §3.2 | `HookFamily` NodeKind (cluster 5) with three values | ✅ | |
| Hook semantics: blocking vs non-blocking | universal/06-channels-sessions-hooks.md §3.3 | attribute `Hook.blocking: boolean` | ✅ | |
| Hook merge concerns | universal/06-channels-sessions-hooks.md §3.4 | covered above (mux family) | ✅ | |
| Hook support level (`supported`, `degraded`, `unsupported`) | universal/06-channels-sessions-hooks.md §3.5 | attribute on `HookMapping.supportLevel` | ✅ | |
| Run-event hooks (SDK) — `on-run-start`, `on-iteration-start`, `on-iteration-end`, `on-task-start`, `on-task-complete`, `on-breakpoint`, `on-step-dispatch`, `on-run-complete`, `on-run-fail`, `on-score`, `post-planning`, `pre-branch`, `pre-commit` | a5c/05-sdk.md §Hook integration | `HookSurface` instances `origin=sdk-run-event` | ✅ | |

### Channels

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Channel concept | universal/01-terminology.md, 06-channels-sessions-hooks.md §1 | `Channel` NodeKind (cluster 5); `Term` `term:channel` | ✅ | default unqualified meaning = chat-channel encoded as `Term.defaultKind=chat-channel` |
| MCP-channel | universal/06-channels-sessions-hooks.md §1.1, a5c/02-muxes.md §3 | `ChannelKind` value `mcp-channel` | ✅ | |
| A2A-channel | universal/06-channels-sessions-hooks.md §1.1, a5c/02-muxes.md §3 | `ChannelKind` value `a2a-channel` | ✅ | |
| chat-channel (default) | universal/06-channels-sessions-hooks.md §1.1 | `ChannelKind` value `chat-channel` | ✅ | |
| mailbox-channel | universal/06-channels-sessions-hooks.md §1.1 | `ChannelKind` value `mailbox-channel` | ✅ | |
| Channels-vs-Presentations distinction | universal/06-channels-sessions-hooks.md §1.3 | recorded as `Term.notes` and as edge `Presentation renders Channel` | ✅ | |

### Sessions / Worktrees / Workspaces

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Session (concept) | universal/06-channels-sessions-hooks.md §2 | `Session` NodeKind (cluster 6) | ✅ | |
| Session Model (3 axes: persistence, control-plane, structured-transport) | universal/01-terminology.md, 02-stack.md §Layer 6, 06-channels-sessions-hooks.md §2 | `SessionModel` NodeKind (cluster 3) with three enum attributes | ✅ | |
| sessionPersistence values (none, file, sqlite, in-memory) | universal/02-stack.md §Layer 6 | enum on `SessionModel.persistence` | ✅ | |
| sessionControlPlane values (self-managed, external-host, mcp-mediated) | universal/02-stack.md §Layer 6 | enum on `SessionModel.controlPlane` | ✅ | |
| structuredSessionTransport values (none, restart-per-turn, persistent) | universal/02-stack.md §Layer 6 | enum on `SessionModel.structuredTransport` | ✅ | |
| Per-product session directory conventions | universal/06-channels-sessions-hooks.md §2.4 | `internalSessionStateLocation` / `sessionFilePathConvention` on `AgentRuntimeImpl`; `PathDescriptor` binds `SessionSemantics` (catalog) | ✅ | runtime-sub-impl per modeling rule in `./schema/node-kinds/agent-stack.md` |
| Per-agent session-id sources (env vars + paths) | universal/04-protocols.md §7.1 | attributes on `SessionSemantics.sessionIdSources` | ✅ | |
| Resume / Fork (universal) | universal/06-channels-sessions-hooks.md §2.5 | `Capability` `cap:can-resume`, `cap:can-fork`; `CapabilitySupport` per `AgentPlatformImpl` (backed by runtime session-format) | ✅ | re-targeted to platform sub-impl per modeling rule in `./schema/node-kinds/agent-stack.md` |
| Session lifecycle states (created, active, suspended/resumable, terminated) | universal/06-channels-sessions-hooks.md §5.1 | `LifecycleState` on `StateMachine`-of-Session | ✅ | |
| Babysitter session bindings (control-plane vs data-plane) | a5c/05-sdk.md §Babysitter session bindings | `Run.sessionBinding` edge; `Term` `term:session-binding` | ✅ | distinct from agent session per source |
| `babysitter session:*` CLI surface | a5c/05-sdk.md | `ProcessDescriptor` carries CLI subcommands; one per command | ✅ | |
| Workspace ↔ Worktree relationship | universal/01-terminology.md, 02-stack.md §Layer 7 | edge `Workspace materializes_as Worktree` (1:N) | ✅ | |
| Workspace ↔ Invocation many-to-many | universal/01-terminology.md, 02-stack.md §Layer 7, 06-channels-sessions-hooks.md §5.4 | edge `Workspace hosts Invocation` (N:N); `Invocation` `executes_in Execution` | ✅ | |

### Sandbox / Execution

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Sandbox-Execution composition (Layer 9 policy enforced by Layer 8 mode) | universal/02-stack.md §Layer 8/9, a5c/03-extension-interfaces.md §8 | edge `Execution enforces Sandbox`; per-mode enforcement attributes | ✅ | |
| sandbox-interface impls (agentsh, container/docker, VM/firecracker/lima, browser-iframe, wasm-sandbox) | a5c/03-extension-interfaces.md §8 | `NativeExtension` instances `implements iface:sandbox-interface` | ✅ | |
| Per-spawn protocol (docker run wrap, ssh remote invocation, kubectl exec/run) | universal/04-protocols.md §6 | attributes on `Execution.spawnPattern` per mode | ✅ | |

### Interaction primitives matrix

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Per-product primitive matrix | universal/02-stack.md §Per-product primitive matrix | derivable from `CapabilitySupport`(`AgentVersion`, `InteractionPrimitive`) with values ✓/~/— mapped to `support-level=full|partial|unsupported` | ✅ | |
| Emerging cross-product primitives (plan-mode, worktree-per-task, custom-commands-as-md, cross-shell continuation) | universal/02-stack.md | `InteractionPattern` `convergenceLevel` attribute | ✅ | |
| Single-product outliers (schedule/routines, voice dictation, fewer-permission-prompts auto-allowlister, sandbox-mode toggle as slash) | universal/02-stack.md | recorded as `InteractionPrimitive` with attribute `singleProductOutlier=true` | ✅ | |

### Tool calling nuances (the 13+ nuances)

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Tool-call modes: direct vs normal | a5c/02-muxes.md §8 | enum on `ToolDescriptor.callMode` `direct`/`normal` | ✅ | |
| Background tool calls (pending status, follow-up event resolution) | a5c/02-muxes.md §8 | `Capability` `cap:supports-background-tool-call`; pending-status modeled in tool-call envelope | ✅ | |
| Per-tool timeouts (separate from Invocation timeout) | a5c/02-muxes.md §8 | attribute `ToolDescriptor.timeoutMs` | ✅ | |
| MCP support per agent (`supportsMcpStdio` / `supportsMcpSse` / `supportsMcpStreamableHttp`) | a5c/02-muxes.md §8 | `Capability` instances; `CapabilitySupport` per `AgentRuntimeImpl` | ✅ | runtime-sub-impl per modeling rule in `./schema/node-kinds/agent-stack.md` |
| Native built-in tools per agent (Claude Code: bash/edit/read/write/glob/grep/ls/web-fetch/web-search; Codex: shell/apply_patch; Gemini: own set) | universal/02-stack.md §Layer 5, a5c/05-sdk.md | `ToolDescriptor` per tool; edge `provides AgentRuntimeImpl` | ✅ | |
| Anycli wrapping pattern | a5c/02-muxes.md §8 | `ToolServer` `protocol=anycli`; `Term` `term:anycli` | ✅ | |
| MCP→CLI gateway | a5c/02-muxes.md §8 | `ToolServer.gatewayKind=mcp-to-cli` | ✅ | |
| CLI→MCP gateway | a5c/02-muxes.md §8 | `ToolServer.gatewayKind=cli-to-mcp` | ✅ | |
| Tool-level hooks layered on PreToolUse/PostToolUse | a5c/02-muxes.md §8 | edge `ToolDescriptor` `gated_by` `HookSurface` (PreToolUse/PostToolUse) | ✅ | |
| Argument schema translation (tool-call JSON ↔ CLI flags) | a5c/02-muxes.md §8 | attribute `ToolDescriptor.argSchema` + translator hint | ✅ | |
| Streaming tool output (some MCP tools stream; most CLIs don't) | a5c/02-muxes.md §8 | `Capability` `cap:streams-output` per tool | ✅ | |
| Error envelope mapping | a5c/02-muxes.md §8 | attribute `ToolDescriptor.errorEnvelopeShape` | ✅ | |
| Secret redaction in tool args/output | a5c/02-muxes.md §8 | invariant in `iface:secrets-interface`; recorded as Claim on `ToolDescriptor` | ✅ | |
| Attestation envelope (Trust Chain link for tool call) | a5c/02-muxes.md §8, a5c/08-trust-chain.md | edge `ToolDescriptor.signedBy iface:trust-interface`; per-mux signing point | ✅ | tool-mux signs (input + output + sandbox-profile-used) |
| Tool Provider / Tool Server / MCP Server terminology | universal/05-plugins-and-extensions.md §9, universal/01-terminology.md | `Term`s with `synonym_of` and `replaces`: MCP Server (preferred); Tool Provider (generic synonym); Tool Server (deprecated, a5c-flavored coinage) | ✅ | |

### Plugins / extensions

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Plugin (umbrella term) | universal/00-overview.md, 05-plugins-and-extensions.md | `Plugin` NodeKind (cluster 7) | ✅ | |
| Three universal primitives (Skills, MCP servers, Hook scripts) | universal/05-plugins-and-extensions.md | `Skill`, `ToolServer`, `Hook` NodeKinds; edge `Plugin contains` each | ✅ | |
| Skill structure (SKILL.md + scripts + references; YAML frontmatter `name`, `description`, trigger conditions) | universal/05-plugins-and-extensions.md §1 | attribute schema on `Skill` | ✅ | |
| Skill loading (progressive disclosure) | universal/05-plugins-and-extensions.md §1 | attribute `Skill.loadingMode=progressive` | ✅ | |
| Skill distribution (bundled / standalone / git/npm/marketplace) | universal/05-plugins-and-extensions.md §1 | `SourceRef` + `installMethods` on `Skill` | ✅ | |
| Per-product Skill support (Claude Code first-class; Codex; Gemini bundled; Cursor/Continue/Cline equivalent under different names; Pi/OMP/OpenClaw/Hermes none) | universal/05-plugins-and-extensions.md §1 | `Capability` `cap:supports-skills`; `skillsFormat` enum | ✅ | |
| MCP Server (definition, structure, transport sub-types) | universal/05-plugins-and-extensions.md §2 | `ToolServer` `protocol=mcp` | ✅ | |
| MCP discovery & config (`.mcp.json`, `mcpServers` blocks, `~/.continue/config.yaml`) | universal/05-plugins-and-extensions.md §2 | `PathDescriptor` per product | ✅ | |
| MCP lifecycle (spawn at session start / lazy / introspect / shutdown) | universal/05-plugins-and-extensions.md §2 | attribute `ToolServer.lifecycle` | ✅ | |
| MCP universality (portable across products) | universal/05-plugins-and-extensions.md §2 | `Capability` `cap:supports-mcp` per `AgentRuntimeImpl`; `Claim` `mcp-portable=true` | ✅ | runtime-sub-impl per modeling rule in `./schema/node-kinds/agent-stack.md` |
| Hook script structure (event binding + global/project/enterprise scope; payload JSON) | universal/05-plugins-and-extensions.md §3 | attribute schema on `Hook` (subscribed `HookSurface` + `scope` enum) | ✅ | |
| Per-product plugin format table | universal/05-plugins-and-extensions.md §4 | `NativeExtension` per product with attributes (manifest, bundles, distribution) | ✅ | |
| Distribution channels (npm, marketplaces, git clone, manual, curl one-liners) | universal/05-plugins-and-extensions.md §5 | enum `Plugin.distributionChannel` | ✅ | |
| Plugin lifecycle (discover → install → load → run → update → uninstall) | universal/05-plugins-and-extensions.md §6 | `StateMachine` over `Plugin` | ✅ | |
| Native vs Portable distinction | universal/05-plugins-and-extensions.md §7, a5c/07-extensions.md | `NativeExtension` vs `PortableExtension` NodeKinds | ✅ | |
| Subagent (definition: role + restricted tools + model preference + triggers) | universal/01-terminology.md, 05-plugins-and-extensions.md §8 | `Subagent` NodeKind (cluster 7) with attributes `name`, `description`, `systemPrompt`, `tools`, `model`, `triggers` | ✅ | |
| Subagent declaration fields (name, description, systemPrompt, tools, model, triggers) | universal/05-plugins-and-extensions.md §8, universal/01-terminology.md | attribute schema on `Subagent` | ✅ | |
| Subagent vs MCP server distinction | universal/05-plugins-and-extensions.md §8 | `Term.notes` and `ScopeBoundary` on each | ✅ | |
| MCP Server vs Tool Provider vs Tool Server (terminology) | universal/05-plugins-and-extensions.md §9 | covered above | ✅ | |
| Plugins are NOT channels / NOT settings files | universal/05-plugins-and-extensions.md §10 | `OutOfScopeReason` records: channels (live in cluster 5), settings files (out-of-schema) | ✅ | |
| Provenance & ontology tags on plugins (SourceRef, Domain/Specialization/Topic/Language/Framework/StackProfile, Role/Responsibility, ScopeBoundary) | universal/05-plugins-and-extensions.md §11 | covered in cluster 9, 10, 13 | ✅ | |
| Portable Extension manifest fields (name, version, implements, hooks, hookFilePattern, hookConfig, targets, content/{skills,subagents,toolServers}) | a5c/07-extensions.md | attribute schema on `PortableExtension` | ✅ | |
| `implements:` extension-interface declaration | a5c/07-extensions.md | edge `PortableExtension implements ExtensionInterface` | ✅ | |
| Hook proxy command resolution (`Stop: proxy` → `npx @a5c-ai/hooks-mux-cli`) | a5c/07-extensions.md, 02-muxes.md §7 | attribute `PortableExtension.hookProxyCommand` | ✅ | |
| A5c-specific extension lifecycle (resolution+interface parsing, compilation through extension-mux, registration with resolver, hook proxying) | a5c/07-extensions.md | recorded on `PortableExtension.lifecycle` | ✅ | |
| Old vocabulary mapping (agent-native plugin / agent plugin / uniplugin / metaplugin / babysitter plugin / Agent-Recipe / harness extension / skill-directory plugin / MCP server install) | a5c/07-extensions.md | `Term.replaces` chain to canonical shapes | ✅ | |

### Blueprints

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Blueprint (a5c-coined) | a5c/00-overview.md, 06-blueprints.md | `Blueprint` NodeKind (cluster 7); `Term` `term:blueprint` `replaces term:agent-recipe` | ✅ | |
| Blueprint canonical layout (install.md / configure.md / uninstall.md / marketplace.json / versions.json / plugin.lock.json / migrations / scripts / install-process.js / configure-process.js / uninstall-process.js) | a5c/06-blueprints.md | attribute schema on `Blueprint` | ✅ | |
| Blueprint marketplace.json shape (name, version, description, supportedAgents, scopes, homepage, tags) | a5c/06-blueprints.md | sub-schema on `Blueprint.marketplace` | ✅ | |
| Per-scope registries (project `.a5c/plugins/`, user `~/.a5c/plugins/`); resolution project→user | a5c/06-blueprints.md | `PathDescriptor`s + `Blueprint.scope` enum | ✅ | |
| Blueprint lifecycle (discover → resolve → install → configure → upgrade → uninstall) | a5c/06-blueprints.md | `StateMachine` over `Blueprint` | ✅ | |
| Migration BFS over migration graph | a5c/06-blueprints.md | attribute `Blueprint.migrationGraph` + algorithm note | ✅ | |
| Blueprint SDK CLI commands (plugin:list/search/install/configure/upgrade/uninstall/lock/doctor/create) | a5c/06-blueprints.md | `ProcessDescriptor` for `babysitter plugin` with subcommands | ✅ | |
| Repo example blueprints (`plugins/babysitter-codex`, `plugins/babysitter`, `plugins/babysitter-pi`, `babysitter-cursor`, `babysitter-gemini`, `babysitter-omp`, `babysitter-openclaw`, `babysitter-opencode`, `babysitter-paperclip`, `babysitter-unified`, `babysitter-github`) | a5c/00-overview.md, 06-blueprints.md | `Blueprint` instances; populated in Phase 2 | ✅ | |
| Blueprints are NOT extensions | a5c/00-overview.md, 06-blueprints.md, 07-extensions.md | `ScopeBoundary` on `Blueprint`: `outOfScope=ExtensionInterface` | ✅ | |

### Trust Chain (a5c-composition)

> **Status: out-of-scope for the atlas Phase 1 ontology.** Trust Chain
> (cross-stack signing / attestation) is unrelated to the catalog/ontology
> effort. The `Authority` and `Attestation` NodeKinds and the `trust-interface`
> ExtensionInterface have been removed. Defer to a separate trust-and-signing
> initiative if pursued. The evidence-grading primitive `TrustLevel` is kept
> because it grades evidence quality and is unrelated to chain-signing.

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Trust Chain (composed) | universal/00-overview.md, 07-cross-cutting.md §2, a5c/08-trust-chain.md | (removed) | 🚫 | Out-of-scope-for-ontology: Trust Chain (cross-stack signing) is not in the ontology / Phase 1 scope; defer to a separate trust-and-signing initiative if pursued. |
| Per-mux signing points (transport-mux, agent-launch-mux, agent-comm-mux, hooks-mux, tool-mux, tasks-mux) | a5c/08-trust-chain.md | (removed) | 🚫 | Out-of-scope-for-ontology: Trust Chain (cross-stack signing) is not in the ontology / Phase 1 scope; defer to a separate trust-and-signing initiative if pursued. |
| Authority (catalog node) | universal/01-terminology.md, a5c/00-overview.md, 08-trust-chain.md | (removed) | 🚫 | Out-of-scope-for-ontology: Trust Chain (cross-stack signing) is not in the ontology / Phase 1 scope; defer to a separate trust-and-signing initiative if pursued. Replaced by opaque-string principal ids on `Claim.claimedBy`, `EvidenceSource.observedBy`, `OpenQuestion.owner`, `Gap.owner`. |
| Attestation envelope | a5c/08-trust-chain.md, universal/07-cross-cutting.md | (removed) | 🚫 | Out-of-scope-for-ontology: Trust Chain (cross-stack signing) is not in the ontology / Phase 1 scope; defer to a separate trust-and-signing initiative if pursued. |
| ProvenBreakpointAnswer (live primitive) | a5c/02-muxes.md §9, 08-trust-chain.md | (removed) | 🚫 | Out-of-scope-for-ontology: Trust Chain (cross-stack signing) is not in the ontology / Phase 1 scope; defer to a separate trust-and-signing initiative if pursued. |
| Trust primitives building blocks (HMAC, JWS, Sigstore, SLSA, mTLS, x509, GPG, OIDC) | universal/00-overview.md, 04-protocols.md §10, 07-cross-cutting.md §2 | (removed) | 🚫 | Out-of-scope-for-ontology: Trust Chain (cross-stack signing) is not in the ontology / Phase 1 scope; defer to a separate trust-and-signing initiative if pursued. |
| TrustLevel (`official-web`, `vendor-doc`, `community`, `synthetic`) | universal/07-cross-cutting.md §1.3 | `TrustLevel` NodeKind (cluster 12) with four enum instances; grades evidence quality (NOT chain-signing) | ✅ | Kept — evidence-quality grading, distinct from Trust Chain. |
| evidencePolicy gates (vendorBackedEvidence, reviewOwnerPattern, maxFreshnessWindowDays=45, reachability checks) | universal/07-cross-cutting.md §1.3 | `EvidencePolicy` NodeKind (cluster 13) with attributes | ✅ | |
| End-to-end chain example (provider response → transport-proxy → tool call → sandbox attestation → hook → decision → answer → run journal → completion) | a5c/08-trust-chain.md | (removed) | 🚫 | Out-of-scope-for-ontology: Trust Chain (cross-stack signing) is not in the ontology / Phase 1 scope; defer to a separate trust-and-signing initiative if pursued. |
| Trust Chain deferred items (per-instance signing-key issuance, transport-proxy + transport-mux signing, tool-call attestation envelope, hook-delivery signing, run completion attestation, end-to-end CLI) | a5c/08-trust-chain.md §What's deferred | (removed) | 🚫 | Out-of-scope-for-ontology: Trust Chain (cross-stack signing) is not in the ontology / Phase 1 scope; defer to a separate trust-and-signing initiative if pursued. |

### Catalog ontology (the schema describing itself)

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Catalog / Ontology concept (cross-cutting; not a layer) | universal/00-overview.md, 07-cross-cutting.md §1 | `Term` `term:catalog` `kind=concept`; cluster 13/15 NodeKinds | ✅ | |
| Eight subsystems (Ontology, Library, Evidence, Policies, Generators, Validators, Discovery, Versioning) | universal/07-cross-cutting.md §1 | `Term` per subsystem; mapped to NodeKinds: Ontology=`OntologySchema`/cluster 1–11 schema; Library=instance set; Evidence=`EvidenceSource`+`EvidencePolicy`; Policies=enums on relevant nodes; Generators=`Generator`; Validators=`./schema/validation-rules.md`; Discovery=runtime concern (out-of-schema as runtime API); Versioning=`CatalogVersion` | ✅ | Discovery runtime queries marked 🚫 in out-of-scope as not-a-design-artifact |
| 22 live node kinds in `agent-catalog` | universal/07-cross-cutting.md §1.1, a5c/00-overview.md (catalog node-kind glossary), a5c/01-component-map.md | each live node kind has a `Term` `kind=concept` `references` to its atlas schema NodeKind counterpart; atlas expanded to 99 NodeKinds across 14 clusters | ✅ | resolved 2026-04-28 — mapping table in `./schema/node-kinds/README.md` (legacy `TransportProtocol`+`TransportRuntime` → atlas `ModelTransportProtocol`+`Provider`; legacy `Harness` → atlas `AgentRuntimeImpl`+`AgentCoreImpl`+`AgentPlatformImpl`; legacy `Tool` → atlas `ToolDescriptor`+`ToolServer`; legacy `Plugin` retained, gains `NativeExtension`/`ExtensionInterface`). |
| 18 live edge kinds in agent-catalog | universal/07-cross-cutting.md §1.1, a5c/00-overview.md | edge mapping recorded; full table in `./schema/edge-kinds.md`; atlas expanded to 139 edges | ✅ | resolved 2026-04-28 — legacy 18 absorbed (served_by/speaks/spoken_by, supported_by, bridges, replaces/replaced_by, evidenced_by); remaining 121 edges represent newly-modeled relations. |
| versionScopingRules (capability bindings on version-fact nodes) | universal/07-cross-cutting.md §1.1, a5c/00-overview.md | invariant in `./schema/validation-rules.md`; encoded by Cluster 8 design (`CapabilitySupport` binds to `AgentVersion`/`ModelVersion` not `AgentProduct`/`ModelFamily`) | ✅ | |
| deprecationRules (`supersedes` canonical edge) | a5c/00-overview.md | edge `replaces` (and `supersedes` synonym) on cluster 13 + entity nodes | ✅ | |
| Conceptual product → version pattern | a5c/00-overview.md | edge `AgentProduct has_version AgentVersion` (and per family product) | ✅ | |
| Claim & EvidenceSource (provenance backbone) | universal/07-cross-cutting.md §1.1 | `Claim` and `EvidenceSource` NodeKinds (cluster 13) | ✅ | with `confidence`, `provenanceKind`, `evidenceStrength`, `status`, `unresolvedGaps` |
| EvidenceSource shape (kindLabel, sourcePathOrUrl, capturedAt, locator, trustLevel) | universal/07-cross-cutting.md §1.3 | attribute schema on `EvidenceSource` | ✅ | |
| OpenQuestion (TBD list) | graph/./schema/design-principles.md | `OpenQuestion` NodeKind (cluster 13) | ✅ | |
| ScopeBoundary / InScope / OutOfScope | universal/01-terminology.md §8, 07-cross-cutting.md §9 | `ScopeBoundary` NodeKind (cluster 13) with `inScope`, `outOfScope`, `evidence` | ✅ | |
| OutOfScopeReason | graph/./schema/design-principles.md, ./schema/versioning.md (concept) | `OutOfScopeReason` NodeKind (cluster 13) | ✅ | structured reason for out-of-scope |
| SourceRef shape (repoUrl, ref, path, packageManager?, packageName?, version?) | universal/01-terminology.md §8, 07-cross-cutting.md §5 | `SourceRef` NodeKind (cluster 13) with that attribute set | ✅ | |
| Which entities carry SourceRef (Skill, Tool, Plugin, Subagent, MCP Server, Process, Benchmark, TestSet, Agent-when-open) | universal/07-cross-cutting.md §5 | edge `<entity> sourced_from SourceRef` constrained per `./schema/validation-rules.md` | ✅ | |
| CatalogVersion / Generator / DerivedArtifact | graph/schema/node-kinds/README.md cluster 15 | `CatalogVersion`, `Generator`, `DerivedArtifact` NodeKinds (cluster 15) | ✅ | |
| Validators subsystem (schema compliance, evidence freshness, URL reachability, internal consistency) | universal/07-cross-cutting.md §1.6 | `./schema/validation-rules.md` invariants list | ✅ | |
| Versioning (semver, deprecationDate, eolDate, capability-version pairing) | universal/01-terminology.md, 02-stack.md, 07-cross-cutting.md §4 | attributes `versionRange`, `deprecationDate`, `eolDate` on entity nodes | ✅ | |
| Origin tagging (universal / a5c / standardized) on every NodeKind | graph/./schema/meta-schema.md §NodeKind, ./schema/validation-rules.md V-1.9 | NodeKind-level `origin` field in `schema/ontology-schema.yaml` (analogous to `cluster`/`prefix`); enforced by V-1.9 (as of 2026-04-28 V-1.9 is now coded in `tools/validator/validate.py` as a graph-level pass over `nodeKinds`; 0 violations across all 107 NodeKinds); 92 universal / 11 a5c / 4 standardized as of 2026-04-28 | ✅ | distinguishes universal agentic-stack concepts (incl. a5c framing) from a5c product coinage (Effect, Blueprint, RunJournalEvent, Gap, AutomationRule, MergePolicy, ExtensionInterface, PhaseMachine, HookMergeDiagnostic, ProcessLibrary, SharedContextSpec) and adopted external specs (ModelTransportProtocol, MCPTransport, AgentHostTransport, TransportProxy). Run is flagged overloaded — universal lifecycle vs. a5c event-sourced run engine — and may need a future split. |

### Domain / Role / Benchmark / SourceRef / ScopeBoundary (the 5 areas)

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Domain | universal/01-terminology.md §8, 07-cross-cutting.md §6 | `Domain` NodeKind (cluster 9) | ✅ | |
| Specialization | same | `Specialization` NodeKind | ✅ | sub-of-Domain |
| Topic | same | `Topic` NodeKind | ✅ | sub-of-Specialization |
| Language | same | `Language` NodeKind | ✅ | |
| Framework | same | `Framework` NodeKind | ✅ | `belongs_to` Language |
| ExpertiseLevel (novice/intermediate/expert/authoritative) | same | `ExpertiseLevel` NodeKind (enum) | ✅ | applied to (entity, domain) tuples |
| StackProfile (composition of Language+Framework+tooling) | same | `StackProfile` NodeKind | ✅ | |
| Role (with isAgentic flag) | universal/01-terminology.md, 07-cross-cutting.md §7 | `Role` NodeKind (cluster 10) | ✅ | |
| Responsibility | same | `Responsibility` NodeKind | ✅ | |
| OrgUnit | same | `OrgUnit` NodeKind | ✅ | |
| Role relationships (holds_responsibility, requires_skill, delegates_to, member_of) | universal/07-cross-cutting.md §7 | edges in `./schema/edge-kinds.md` | ✅ | |
| Benchmark | universal/01-terminology.md, 07-cross-cutting.md §8 | `Benchmark` NodeKind (cluster 11) | ✅ | |
| TestSet | same | `TestSet` NodeKind | ✅ | |
| EvalRun | same | `EvalRun` NodeKind | ✅ | |
| EvalResult (signed, pinned to SourceRef) | same | `EvalResult` NodeKind; signed via `Attestation` | ✅ | |
| Public benchmarks (SWE-bench, HumanEval, MMLU, GAIA, MLE-bench) | universal/07-cross-cutting.md §8 | populated `Benchmark` instances in Phase 2 | ✅ | |
| Benchmark scoping (targets Skill / Plugin / Subagent / Agent / ModelVersion / Domain / Specialization / Topic / StackProfile / stack-layer / agent-platform) | universal/07-cross-cutting.md §8 | edge `Benchmark targets <NodeKind>` | ✅ | |
| Benchmark planned at SDK layer (benchmark-run primitives) | a5c/05-sdk.md §Planned | `OpenQuestion` `oq:benchmark-run-sdk-primitives` | ⏳ | not live |
| ScopeBoundary universality (HuggingFace model cards "Intended Use" + "Limitations" pattern) | universal/01-terminology.md, 07-cross-cutting.md §9 | covered above; `Term.notes` references industry pattern | ✅ | |

### Secret Store

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Secret Store concept (industry-generic) | universal/00-overview.md, 07-cross-cutting.md §3 | `Term` `term:secret-store`; surface in `iface:secrets-interface` | ✅ | |
| Backend list (env vars, OS keychain [macOS Keychain/Windows DPAPI/Linux libsecret], HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, Infisical, Doppler, OpenBao, sops, 1Password CLI, direnv) | universal/07-cross-cutting.md §3 | enum `SecretStoreBackend`; one `Term` per | ✅ | |
| Vendor specifics (`ANTHROPIC_API_KEY`, Claude Code OAuth/browser-login token paths; `OPENAI_API_KEY`, `~/.codex/auth.json`; `GOOGLE_API_KEY`, GCP ADC; `GITHUB_TOKEN`/`gh auth login`) | universal/07-cross-cutting.md §3 | `PathDescriptor` and `AuthMethodDescriptor` on each `AgentVersion`/`Provider` | ✅ | |
| Operations (`secrets.get(name, scope)`, redaction, audit log, scope-bound) | universal/07-cross-cutting.md §3, a5c/03-extension-interfaces.md §3 | surface attribute on `iface:secrets-interface` | ✅ | |
| Live binding (`packages/agent-mux/core/src/auth-types.ts` AuthMethodDescriptor, authFiles[]) | universal/07-cross-cutting.md §3, a5c/02-muxes.md §5 | `Claim.liveStatus=partial` on `iface:secrets-interface` | ✅ | |
| Auth methods (api-key env-var, OAuth 2.0 file, OAuth device flow RFC 8628, browser-login session-token files, gh-auth state, OS-keychain credentials, service-account JSON, IAM role) | universal/04-protocols.md §9, a5c/02-muxes.md §5 | enum `AuthMethod`; `Term` per | ✅ | |

### Protocols

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Model-Transport protocols list (Anthropic Messages, OpenAI Responses, OpenAI ChatCompletions, Gemini generateContent, Bedrock Invoke, Bedrock Converse, Local-model OpenAI-compat) | universal/04-protocols.md §1 | `ModelTransportProtocol` instances | ✅ | |
| MCP-Transport sub-types | universal/04-protocols.md §1.5 | covered above | ✅ | |
| Agent communication protocols (Claude stream-json, Codex JSONL events, Gemini CLI JSONL, Cursor SQLite events, OpenCode SQLite events, Copilot plain-text + JSON sidecar, A2A, ACP, MCP-as-agent) | universal/04-protocols.md §2 | `Term` per protocol; attached as `Capability` on `AgentVersion` | ✅ | |
| A2A handshake surface (capability advertisement, session brokering, message exchange, termination) | universal/04-protocols.md §2.1 | sub-attributes on Term | ✅ | |
| ACP discovery + invocation + streaming | universal/04-protocols.md §2.2 | sub-attributes on Term | ✅ | |
| MCP-as-agent rebinding (tools/* → tool-frames; resources/* → context frames; prompts/* → system frames; sampling/* → subagent invocation; notifications → list-changed refresh) | universal/04-protocols.md §2.3 | rebinding table on `Term term:mcp-as-agent` | ✅ | |
| Hook event protocols (claude/codex/gemini/copilot/cursor/opencode) | universal/04-protocols.md §3 | covered in Hooks section | ✅ | |
| Tool protocols (MCP, A2A tool channels, Native agent tools) | universal/04-protocols.md §4 | enum `ToolProtocol`; `ToolServer.protocol` | ✅ | |
| MCP sub-protocols (Handshake, Capabilities advertisement, Tools, Resources, Prompts, Sampling, Roots, Logging, Notifications, Elicitation, Completion, Pagination) | universal/04-protocols.md §4.1 | sub-attribute on `MCPTransport.subProtocol` enum | ✅ | |
| Plugin manifest protocols (Claude Code / Codex / Cursor / OpenCode) | universal/04-protocols.md §5 | attributes on `NativeExtension.manifestProtocol` | ✅ | |
| Spawn / launch protocols (per-agent CLI, docker run wrap, ssh remote, kubectl exec/run) | universal/04-protocols.md §6 | covered in Execution | ✅ | |
| Session storage protocols (JSONL, SQLite, JSON, JSONL-tree) | universal/04-protocols.md §7 | enum `SessionStorageFormat` | ✅ | |
| Task / decision protocols (Claude AskUserQuestion, MCP elicitation, GitHub Issues API, Linear API, Jira API, CLI prompt, email, webhook) | universal/04-protocols.md §8 | enum `TaskBackendProtocol`; `Term` per | ✅ | |
| Auth protocols (API-key env, OAuth 2.0, OAuth device flow, gh auth, browser-login token, GitHub token, service-account/IAM, mTLS, OIDC) | universal/04-protocols.md §9 | covered in Secret Store | ✅ | |
| Trust / attestation protocols (HMAC, JWS, Sigstore, GPG, mTLS-cert envelopes, x509) | universal/04-protocols.md §10 | covered in Trust Chain | ✅ | |
| Discovery protocols (env-var detection, binary on PATH, Windows registry, file presence) | universal/04-protocols.md §11 | enum `DiscoverySignal.kind` (cluster 13 carry-over) | ✅ | covered by `DiscoverySignal` (live in agent-catalog) |
| Standards deliberately not adopted (LangChain, AutoGen, vendor SDKs as canonical) | universal/04-protocols.md §12 | each as `OutOfScopeReason` in Out-of-Scope section below | ✅ | |
| Protocol gaps (no thinking/reasoning channel standard, no cost/usage envelope standard, no fork/resume standard, no thinking-streaming standard, no industry hook event standard, no cross-protocol tool-call streaming, no industry plugin format, signal propagation brittle, process-lifecycle Unix-vs-Windows differences, no resume/fork uniformity, format fidelity loss, no task-dependency representation, no comment-sync semantics, no unified auth envelope, no agent-instance authority assertion) | universal/04-protocols.md (Gaps subsections) | each as `OpenQuestion` `oq:gap-<topic>`; recorded as `Claim.gap=true` | ⏳ | |

### Tasks-mux taxonomy

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Task kinds bridged: `decision` (renamed from breakpoint), `task`, `external-task` | a5c/02-muxes.md §9 | enum `TaskKind` on `Effect`/`Decision` carrier; `Term` `term:breakpoint` `replaces` `term:decision` `inContext=sdk-legacy` | ✅ | |
| Cross-cutting axes (actor: human/agent/system; mode: sync/deferred; backend; dependencies DAG) | a5c/02-muxes.md §9 | attributes on `Decision`/`Task` records | ✅ | |
| Tasks-mux lifecycle (`open → assigned → in-progress → answered/done → closed`) | a5c/02-muxes.md §9 | `StateMachine` over Decision | ✅ | |
| Live decision schema (BreakpointStrategy, Urgency, InteractionKind, BreakpointContext sections/artifacts/links, BreakpointRouting, ResponderProfile, BreakpointAnswer with Rating and DecisionMemory, ProvenBreakpointAnswer) | a5c/02-muxes.md §9 | sub-attribute schema on `Decision`; `ProvenBreakpointAnswer` is `Attestation` | ✅ | |
| Auto-approval pattern DSL (glob decision IDs, attribute predicates, AND combinator, consecutive-approval escalation, named pattern presets) | a5c/02-muxes.md §9 | attribute `Decision.autoApprovalPattern`; evaluated by `iface:governance-interface` | ✅ | |
| Tasks-mux backends (auth/, backends/, harness/, mcp/, client/) | a5c/02-muxes.md §9 | per-backend `NativeExtension implements iface:tasks-mux` | ✅ | |
| Task-completion attestations (planned) | a5c/02-muxes.md §9, a5c/08-trust-chain.md | `OpenQuestion` `oq:task-completion-attestation` | ⏳ | |

### Babysitter SDK process library / processes

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Process library concept (git-backed, scoped, version-pinned, methodology-shared) | a5c/00-overview.md, 04-reliability.md, 05-sdk.md | `Term` `term:process-library` `kind=concept`; modeled as `ProcessLibrary` (instance is a `SourceRef` with subpath); state at `~/.a5c/active/process-library.json` recorded as `PathDescriptor` | ✅ | |
| Process library binding scopes (default, run, session) | a5c/05-sdk.md | enum `ProcessLibraryBinding.scope`; resolution rule recorded | ✅ | |
| Library layout convention (methodologies/ generic only; specializations/<domain>/; specializations/shared/) | a5c/05-sdk.md §Library layout convention | invariant in validation rules | ✅ | |
| Default upstream (`github.com/a5c-ai/babysitter.git#library/`) | a5c/00-overview.md, 05-sdk.md | `Claim` on default binding | ✅ | |
| `defineProcess` / `defineTask` | a5c/05-sdk.md | `ProcessDescriptor` schema; `Term` per | ✅ | |
| `process(inputs, ctx)` entrypoint API | a5c/05-sdk.md | attribute schema on `ProcessDescriptor` | ✅ | |
| `ctx.task` / `ctx.parallel.{all,race,bounded,…}` / `ctx.subprocess` / `ctx.breakpoint`/`ctx.decision` / `ctx.log` / `ctx.now` | a5c/05-sdk.md | sub-API attribute set on `ProcessDescriptor` | ✅ | |
| Authoring conventions (no shell subtasks unless asked, sparse breakpoints, interview phase when unclear) | a5c/05-sdk.md, CLAUDE.md, docs/agent-reference/process-authoring.md | invariants in `./schema/validation-rules.md` | ✅ | repo-level conventions |
| Task taxonomy KnownTaskKind (`node`, `breakpoint`, `orchestrator_task`, `sleep`, `subprocess`) | a5c/05-sdk.md | enum on `Effect.kind` | ✅ | |
| User-facing authoring kinds (`agent`, `skill`, `shell`) routed to `orchestrator_task` | a5c/05-sdk.md | enum on `Task.authoringKind` with router rule | ✅ | |
| Custom TaskKind extensibility (`TaskKind = string`) | a5c/05-sdk.md | attribute notes `TaskKind.openSet=true` | ✅ | |
| SubprocessTaskOptions full field list (processPath, processId, prompt, inputs, inputSchema, outputSchema, harness/agent, model, maxIterations, shareSession) | a5c/05-sdk.md | sub-schema | ✅ | |
| TaskIOHints (inputJsonPath, outputJsonPath, stdoutPath, stderrPath) | a5c/05-sdk.md | sub-schema | ✅ | |
| Per-task lifecycle hooks (`on-task-start`, `on-task-complete`) | a5c/05-sdk.md | `HookSurface` instances | ✅ | |
| Profiles (user/project) and `babysitter profile:*` CLI (`profile:read/write/merge/render`) | a5c/00-overview.md, 05-sdk.md | `ProcessDescriptor`; `PathDescriptor` for `~/.a5c/` and `.a5c/`; `Term`s | ✅ | |
| User profile fields (specialties, expertise levels, preferences, communication style, breakpointTolerance, alwaysBreakOn, toolPreferences) | a5c/05-sdk.md | sub-schema on `Term term:user-profile` | ✅ | |
| Project profile (per-project preferences and constraints) | a5c/05-sdk.md | sub-schema on `Term term:project-profile` | ✅ | |
| CLI commands (run:create/status/events/iterate/rebuild-state/repair-journal; task:post/list/show; skill:discover; session:init/associate/resume/state/update/whoami/cleanup; process-library:active; harness:discover/install/install-plugin; instructions:babysit-skill) | a5c/05-sdk.md | `ProcessDescriptor` for `babysitter` with subcommands | ✅ | |

### Specific products (Phase 2 will populate)

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| Claude Code | universal/03-products.md | `AgentProduct id=agent:claude-code`; `AgentVersion`s | ✅ | |
| Claude Agent SDK | universal/03-products.md | `AgentProduct id=agent:claude-agent-sdk` | ✅ | AC+AR only (not a Platform) |
| Codex CLI | universal/03-products.md | `AgentProduct id=agent:codex-cli` | ✅ | |
| Cursor (IDE + CLI) | universal/03-products.md | `AgentProduct id=agent:cursor` | ✅ | |
| OpenCode | universal/03-products.md | `AgentProduct id=agent:opencode` | ✅ | subprocess + HTTP variants |
| Gemini CLI | universal/03-products.md | `AgentProduct id=agent:gemini-cli` | ✅ | |
| GitHub Copilot CLI | universal/03-products.md | `AgentProduct id=agent:copilot-cli` | ✅ | |
| Pi | universal/03-products.md | `AgentProduct id=agent:pi` | ✅ | |
| OMP | universal/03-products.md | `AgentProduct id=agent:omp` | ✅ | |
| OpenClaw | universal/03-products.md | `AgentProduct id=agent:openclaw` | ✅ | |
| Hermes | universal/03-products.md | `AgentProduct id=agent:hermes` | ✅ | |
| Sourcegraph Amp | universal/03-products.md | `AgentProduct id=agent:amp` | ✅ | |
| Factory Droid | universal/03-products.md | `AgentProduct id=agent:droid` | ✅ | |
| Aider | universal/03-products.md | `AgentProduct id=agent:aider` | ✅ | |
| Continue | universal/03-products.md | `AgentProduct id=agent:continue` | ✅ | |
| Roo Code | universal/03-products.md | `AgentProduct id=agent:roo-code` | ✅ | |
| Cline | universal/03-products.md | `AgentProduct id=agent:cline` | ✅ | |
| Goose | universal/03-products.md | `AgentProduct id=agent:goose` | ✅ | |
| Devin | universal/03-products.md | `AgentProduct id=agent:devin` | ✅ | cloud-hosted |
| agent-platform (special Layer-6 entry) | a5c/00-overview.md, 01-component-map.md, ADR-001 | `AgentProduct id=agent:agent-platform` | ✅ | semantic contract per ADR-001 |
| a5c integration column (catalog / adapter / none) | universal/03-products.md (table footnote) | attribute `AgentVersion.a5cIntegration` enum | ✅ | |
| Per-product comparison-table fields (Vendor, Layers, Surface, Plugin formats, MCP, Hooks, Execution typical, Sandbox default, Resume, Fork) | universal/03-products.md | populated as `Claim`s on `AgentVersion`/`AgentProduct` | ✅ | derivable matrix |

### a5c packages (PackageSurface + CiSurface lifted in from legacy ontology — see graph/catalog-meta/package-surfaces/ and ci-surfaces/)

| Concept | Source | Schema mapping | Status | Notes |
|---|---|---|---|---|
| `@a5c-ai/agent-catalog` | a5c/01-component-map.md | `PackageSurface` + `CiSurface` (both populated; example: graph/catalog-meta/package-surfaces/agent-catalog.yaml) | ✅ | promoted from stub |
| `@a5c-ai/catalog` (UI) | a5c/01-component-map.md | `PackageSurface` + `CiSurface` | ✅ | |
| `@a5c-ai/tula-core` | a5c/01-component-map.md | `PackageSurface` | ✅ | |
| `@a5c-ai/agent-comm-mux/adapters/cli/sdk/gateway/harness-mock/observability/tui/webui` | a5c/01-component-map.md | one `PackageSurface` each | ✅ | |
| `@a5c-ai/agent-platform` | a5c/01-component-map.md, ADR-001 | covered above as AgentProduct | ✅ | |
| `@a5c-ai/transport-mux` | a5c/01-component-map.md | `ProcessDescriptor` | ✅ | |
| `@a5c-ai/hooks-mux` | a5c/01-component-map.md | `ProcessDescriptor` | ✅ | |
| `@a5c-ai/extension-mux` | a5c/01-component-map.md | `ProcessDescriptor` | ✅ | |
| `@a5c-ai/tasks-mux` | a5c/01-component-map.md | `ProcessDescriptor` | ✅ | |
| `@a5c-ai/babysitter-sdk` | a5c/01-component-map.md, 05-sdk.md | `ProcessDescriptor` | ✅ | |
| `@a5c-ai/babysitter` (top-level npm) | a5c/01-component-map.md | `ProcessDescriptor` | ✅ | |
| `@a5c-ai/babysitter-tui-plugins` | a5c/01-component-map.md | `ProcessDescriptor` | ✅ | |
| `@a5c-ai/cloud` | a5c/01-component-map.md | `ProcessDescriptor` | ✅ | |
| `@a5c-ai/observer-dashboard` | a5c/01-component-map.md | `ProcessDescriptor` | ✅ | |
| `@a5c-ai/kanban` | a5c/01-component-map.md | `ProcessDescriptor` | ✅ | |
| Adapter list (~20 adapters under `agent-mux/adapters/src/`) | a5c/01-component-map.md | one `ProcessDescriptor` each; some without `AgentProduct` flagged via Claim | ✅ | |

### Terminology (every named concept in legacy as a `Term`)

The following are first-class `Term` nodes (cluster 14) with anchors to the corresponding NodeKind/instance. Status is ✅ unless noted.

| Term | Source | `kind` | `references` | Status |
|---|---|---|---|---|
| Run (babysitter SDK sense) | universal/01-terminology.md, a5c/05-sdk.md | concept | `Run` | ✅ |
| Invocation | universal/01-terminology.md, a5c/02-muxes.md, a5c/05-sdk.md | concept | `Invocation` | ✅ |
| Turn | universal/01-terminology.md, 06-channels-sessions-hooks.md | concept | `Turn`-conceptual (sub-state of Invocation) | ✅ |
| Agentic loop | universal/01-terminology.md, 06-channels-sessions-hooks.md | concept | `AgentCoreImpl` (loop iterator) | ✅ |
| Decision-Point | universal/01-terminology.md | concept | `Phase`-gate / `Decision` | ✅ |
| Phase | universal/01-terminology.md, a5c/04-reliability.md | lifecycle-state | `Phase` | ✅ |
| Sleep Cycle | universal/01-terminology.md, a5c/03-extension-interfaces.md §12 | concept | `iface:sleep-cycle-interface` | ✅ |
| Cross-Agent Communication | universal/01-terminology.md | concept | `Channel` (a2a-channel/mailbox/MCP-channel) | ✅ |
| Local Model Source | universal/01-terminology.md | concept | `Provider` sub-entity | ✅ |
| Run Principal | universal/01-terminology.md | concept | `iface:identity-interface` | ✅ |
| Agent-Instance | universal/01-terminology.md | concept | `Invocation`/`AgentVersion`-instance | ✅ |
| Agent (umbrella) | universal/01-terminology.md, 02-stack.md | concept | `AgentProduct` | ✅ |
| Comm-Mode | universal/01-terminology.md, 06-channels-sessions-hooks.md | concept (deprecated) | `replaces` `Agent Host Transport` | ✅ |
| Transport-Mode | a5c/02-muxes.md (retired drafts) | concept (deprecated) | `replaces` `Agent Host Transport` | ✅ |
| Mux | a5c/02-muxes.md | mux | `ExtensionInterface` | ✅ |
| Skill | universal/05-plugins-and-extensions.md | extension-shape | `Skill` | ✅ |
| Subagent | universal/05-plugins-and-extensions.md | extension-shape | `Subagent` | ✅ |
| Native Plugin / Native Extension | universal/05-plugins-and-extensions.md, a5c/07-extensions.md | extension-shape | `NativeExtension` | ✅ |
| Portable Extension | a5c/07-extensions.md | extension-shape | `PortableExtension` | ✅ |
| Plugin (umbrella) | universal/05-plugins-and-extensions.md | extension-shape | `Plugin` | ✅ |
| Tool Server | (legacy a5c) | concept (deprecated) | `replaces` `MCP Server` `inContext=a5c-legacy` | ✅ |
| MCP Server | universal/05-plugins-and-extensions.md, 04-protocols.md | extension-shape | `ToolServer` `protocol=mcp` | ✅ |
| Tool Provider | universal/05-plugins-and-extensions.md | extension-shape | `ToolServer` (generic) | ✅ |
| Channel | universal/06-channels-sessions-hooks.md | primitive | `Channel` | ✅ |
| MCP-channel / A2A-channel / chat-channel / mailbox-channel | universal/06-channels-sessions-hooks.md | primitive | `ChannelKind` instance | ✅ |
| Hook | universal/06-channels-sessions-hooks.md | hook | `Hook` | ✅ |
| Hook Family | universal/01-terminology.md, 06-channels-sessions-hooks.md | hook | `HookFamily` | ✅ |
| Worktree | universal/01-terminology.md | primitive | `Worktree` | ✅ |
| Workspace | universal/01-terminology.md, 02-stack.md | primitive | `Workspace` | ✅ |
| Session | universal/06-channels-sessions-hooks.md | primitive | `Session` | ✅ |
| Capability Profile | universal/01-terminology.md | primitive | `CapabilityProfile` | ✅ |
| Launch Config | universal/01-terminology.md | primitive | `LaunchConfig` | ✅ |
| Approval Mode | universal/01-terminology.md | primitive | enum | ✅ |
| Plan mode | universal/01-terminology.md | primitive | `InteractionPrimitive` | ✅ |
| Fork (conversation) | universal/01-terminology.md | primitive | `InteractionPrimitive` | ✅ |
| Rewind / Checkpoint | universal/01-terminology.md | primitive | `InteractionPrimitive` | ✅ |
| Replay | universal/01-terminology.md | primitive | `InteractionPrimitive` | ✅ |
| Teleport | universal/01-terminology.md | primitive | `InteractionPrimitive` | ✅ |
| Routine / Scheduled prompt | universal/01-terminology.md | primitive | `InteractionPrimitive` | ✅ |
| Slash command | universal/01-terminology.md | primitive | `InteractionPrimitive` | ✅ |
| @-mention | universal/01-terminology.md | primitive | `InteractionPrimitive` | ✅ |
| Sandbox-mode toggle | universal/01-terminology.md | primitive | `InteractionPrimitive` | ✅ |
| Worktree-per-task | universal/01-terminology.md | pattern | `InteractionPattern` | ✅ |
| Steering | graph/schema/node-kinds/interaction-primitives.md | primitive | `InteractionPrimitive` | ✅ |
| Queued message | graph/schema/node-kinds/interaction-primitives.md | primitive | `InteractionPrimitive` | ✅ |
| Catalog / Ontology | universal/00-overview.md, 07-cross-cutting.md §1 | concept | `OntologySchema` | ✅ |
| Authority | universal/01-terminology.md, a5c/00-overview.md, 08-trust-chain.md | concept | (removed) | 🚫 Out-of-scope-for-ontology: Trust Chain de-scoped from Phase 1. |
| Attestation | a5c/08-trust-chain.md, universal/07-cross-cutting.md | concept | (removed) | 🚫 Out-of-scope-for-ontology: Trust Chain de-scoped from Phase 1. |
| ProvenBreakpointAnswer | a5c/02-muxes.md, 08-trust-chain.md | concept | (removed) | 🚫 Out-of-scope-for-ontology: Trust Chain de-scoped from Phase 1. |
| Trust Chain | universal/07-cross-cutting.md, a5c/08-trust-chain.md | concept | (removed) | 🚫 Out-of-scope-for-ontology: Trust Chain de-scoped from Phase 1. |
| Effect (algebraic-effects framing) | a5c/05-sdk.md | concept | `Effect` | ✅ |
| Process Run | a5c/05-sdk.md | concept | `Run` | ✅ |
| Agent Invocation | a5c/02-muxes.md, 05-sdk.md | concept | `Invocation` | ✅ |
| Process Library | a5c/00-overview.md, 05-sdk.md | concept | sub-schema | ✅ |
| Blueprint | a5c/00-overview.md, 06-blueprints.md | extension-shape | `Blueprint` | ✅ |
| Agent-Recipe | a5c/06-blueprints.md (renamed) | concept (deprecated) | `replaces` `Blueprint` | ✅ |
| Agent Host Transport | universal/01-terminology.md, 06-channels-sessions-hooks.md §4 | primitive | `AgentHostTransport` | ✅ |
| Model-Transport | universal/02-stack.md | layer | `Layer 3` | ✅ |
| MCP-Transport | universal/00-overview.md, 04-protocols.md §1.5 | concept | `MCPTransport` | ✅ |
| Layer (1..11) names | universal/02-stack.md | layer | `Layer` instance | ✅ |
| Domain / Specialization / Topic / Language / Framework / ExpertiseLevel / StackProfile | universal/01-terminology.md §8, 07-cross-cutting.md §6 | concept | one Term per | ✅ |
| Role / Responsibility / OrgUnit | universal/01-terminology.md §8, 07-cross-cutting.md §7 | role | one Term per | ✅ |
| Benchmark / TestSet / EvalRun / EvalResult / CapabilityClaim | universal/01-terminology.md §8, 07-cross-cutting.md §8 | concept | one Term per | ✅ |
| ScopeBoundary / InScope / OutOfScope | universal/01-terminology.md §8, 07-cross-cutting.md §9 | concept | one Term per | ✅ |
| SourceRef | universal/01-terminology.md §8, 07-cross-cutting.md §5 | concept | `SourceRef` | ✅ |
| Discovery (concept) | universal/00-overview.md, 07-cross-cutting.md §1.7 | concept | `DiscoverySignal` | ✅ |
| Versioning (concept) | universal/01-terminology.md §4, 07-cross-cutting.md §4 | concept | attribute set | ✅ |
| Provenance / signing primitives | universal/00-overview.md, 04-protocols.md §10, 07-cross-cutting.md §2 | concept | enum on `Attestation.signingPrimitive` | ✅ |
| Shared Context | a5c/03-extension-interfaces.md | concept | recorded as Claim | ✅ |
| Anycli | a5c/02-muxes.md §8 | concept | `ToolServer.protocol=anycli` | ✅ |

---

## Out-of-Scope items

Concepts deliberately left out of the schema, with reason. Each row corresponds to an `OutOfScopeReason` node.

| Concept | Source | Reason |
|---|---|---|
| Vendor pricing tables (cost-per-1k-token live values) | universal/02-stack.md §Layer 1, 04-protocols.md | volatile; tracked only as evidence-source attributes (URL to vendor pricing page) on `ModelVersion` claims, not as authoritative schema values |
| Operational runbooks | (would-be docs) | runtime concern; not a design artifact |
| Project history / changelogs | (would-be docs) | git is the source of truth |
| Implementation code paths | (would-be docs) | Phase 4 derivation; not Phase 1 |
| Live runtime state (running runs, live sessions, in-flight invocations) | graph/./schema/design-principles.md | runtime concerns; the schema is a design artifact, not a runtime database |
| Vendor opinions on best agent / best model | universal/03-products.md | the schema records data, not opinions; disagreements are recorded as data |
| Discovery runtime queries (`detectHostAgent`, `listInstalledAgents`, `resolveProvidersFor`, `resolveAgentsFor`) | universal/07-cross-cutting.md §1.7 | runtime API; the catalog *describes* the data such queries consume; the queries themselves are not schema |
| LangChain protocol | universal/04-protocols.md §12 | not adopted as canonical — multi-agent / chain shapes vary too widely |
| AutoGen protocol | universal/04-protocols.md §12 | same logic — multi-agent flows can be modeled compositionally |
| Specific vendor SDKs as canonical shape | universal/04-protocols.md §12 | vendor SDKs are reference implementations, not canonical shapes |
| Specific Trust Chain composition (universal scope only) | universal/07-cross-cutting.md §2 | universal docs document only building blocks; chain composition is implementation-specific (a5c is one such composition) |
| Concrete sandbox-implementation internals (firecracker mem layout, seccomp BPF programs, etc.) | universal/02-stack.md §Layer 9, a5c/03-extension-interfaces.md §8 | implementation detail of `sandbox-interface` impls; not a schema concern |
| Runbooks for k8s deployment of agent-mux-gateway | a5c/01-component-map.md | runtime/deployment concern |
| Per-vendor secret-store backend SDKs (Vault SDK calls, AWS SM SDK calls, …) | universal/07-cross-cutting.md §3 | implementation of `secrets-interface` backends; backends are catalog data, but their SDK details are not |
| Settings files as plugins | universal/05-plugins-and-extensions.md §10 | configuration, not extension content |
| Industry hook event-name standard | universal/06-channels-sessions-hooks.md §3 | does not exist; per-product event names are recorded as `HookMapping`, no canonical universal cross-product event-name standard claimed |
| Agent-specific quirks below the AgentVersion granularity | universal/03-products.md | recorded as Claims, not their own NodeKind |
| Live operator preferences / per-installation tuning | a5c/05-sdk.md profiles | profiles are stored in `~/.a5c/` and `.a5c/` at runtime; the schema records the *shape* of profiles, not specific user data |

---

## Open Questions

OpenQuestion entries that need data or decision before a claim can be made. Each is an `OpenQuestion` node.

| Question | Owner | Raised at | Notes |
|---|---|---|---|
| Is "Comm-Mode" fully retired or does it survive as a synonym? | tbd | Phase 1 | Resolved: `Term term:comm-mode` `replaces` `Agent Host Transport`, kept as deprecated synonym. Closed; row kept for traceability. |
| What is the canonical name of the agent-mux Run → Invocation rename in user-facing docs? | tbd | Phase 1 | Resolved: "Invocation" everywhere; "Run" reserved for babysitter Process Run. Closed. |
| Should "Shared Context" be a NodeKind or remain a structured Claim? | tbd (defer to Phase 2) | Phase 1 | Currently a `Term` + structured `Claim` attached to `iface:reliability-interface`. Promotion-criterion: if Phase-2 cross-extension query patterns demand graph-level traversal of shared-context bindings (e.g., "all extensions that read scope `per-run`"), promote to `SharedContextSpec` NodeKind. Deferred — depends on extension catalog growth. Owner: graph maintainers. |

| How do live agent-catalog 22 NodeKinds collapse into atlas schema NodeKinds? (e.g. `TransportProtocol` + `TransportRuntime` vs atlas `ModelTransportProtocol`) | tbd | Phase 1 | Resolved: atlas expanded to 99 NodeKinds across 14 clusters (Cluster 0–13). The legacy 22 collapse as: legacy `TransportProtocol`+`TransportRuntime` → atlas `ModelTransportProtocol` (+ `Provider` for the runtime endpoint); legacy `Harness` → atlas `AgentRuntimeImpl` (+ `AgentCoreImpl`/`AgentPlatformImpl` split); legacy `Tool` → atlas `ToolDescriptor`+`ToolServer`; legacy `Plugin` stays as `Plugin` but gains `NativeExtension`/`ExtensionInterface`. Mapping table tracked in `./schema/node-kinds/README.md`. Closed. |
| How do the live 18 edge kinds map to atlas edges in `./schema/edge-kinds.md`? | tbd | Phase 1 | Resolved: atlas expanded to 139 edges. Legacy 18 absorbed as: `served_by`/`speaks`/`spoken_by` (transport↔provider/model), `supported_by` (capability↔entity, version-ranged), `bridges` (proxy↔protocol), `replaces`/`replaced_by` (deprecation chains), `evidenced_by` (universal evidence binding). The remaining 121 edges represent newly-modeled relations (CapabilitySupport, TrustChain participation, hook-merge, lifecycle transitions, etc.). See `./schema/edge-kinds.md` for the full table. Closed. |
| Workspace materialization extensions beyond `worktree`/`symlink` (clone, copy, virtual)? | tbd | Phase 1 | Resolved 2026-04-28: `Workspace.materialization` extended to `enum<worktree,symlink,clone,copy,virtual>`. `clone`=independent full git clone (decoupled from primary repo); `copy`=non-git filesystem snapshot for non-git workspaces; `virtual`=overlay/FUSE/in-memory projection (copy-on-write or remote-mounted). Closed. |
| Harness → Agent rename migration ADR | tbd | Phase 1 | Resolved: tracked in the terminology graph — `Term term:harness` is `replaced_by Term term:agent` with `status: deprecated`. Per-product migration is recorded as `replaces` edges between Term nodes; no separate ADR needed because the Term graph is the canonical source. Closed. |
| Benchmark-run primitives at SDK layer | tbd (defer to Phase 2) | Phase 1 | Deferred — depends on `iface:reflection-interface` benchmark surface landing in `@a5c-ai/babysitter-sdk`. Dependency: `Benchmark`/`TestSet`/`EvalRun`/`EvalResult` NodeKinds already modeled (cluster 11); only the SDK-side `ctx.benchmark.run()` primitive is pending. Owner: SDK team. |
| Task-completion attestation envelope shape | tbd | Phase 1 | 🚫 Out-of-scope: Trust Chain (cross-stack signing) is not in the ontology / Phase 1 scope; defer to a separate trust-and-signing initiative if pursued. |
| Per-instance signing-key issuance pipeline | tbd | Phase 1 | 🚫 Out-of-scope: Trust Chain (cross-stack signing) is not in the ontology / Phase 1 scope; defer to a separate trust-and-signing initiative if pursued. |
| transport-proxy + transport-mux signing wire-up | tbd | Phase 1 | 🚫 Out-of-scope: Trust Chain (cross-stack signing) is not in the ontology / Phase 1 scope; defer to a separate trust-and-signing initiative if pursued. |
| Tool-call attestation envelope finalization | tbd | Phase 1 | 🚫 Out-of-scope: Trust Chain (cross-stack signing) is not in the ontology / Phase 1 scope; defer to a separate trust-and-signing initiative if pursued. |
| Hook-delivery signing envelope spec | tbd | Phase 1 | 🚫 Out-of-scope: Trust Chain (cross-stack signing) is not in the ontology / Phase 1 scope; defer to a separate trust-and-signing initiative if pursued. |
| Run completion attestation under named Authority | tbd | Phase 1 | 🚫 Out-of-scope: Trust Chain (cross-stack signing) is not in the ontology / Phase 1 scope; defer to a separate trust-and-signing initiative if pursued. |
| End-to-end Trust Chain verification CLI | tbd | Phase 1 | 🚫 Out-of-scope: Trust Chain (cross-stack signing) is not in the ontology / Phase 1 scope; defer to a separate trust-and-signing initiative if pursued. |
| Industry standard for thinking/reasoning channel mapping | tbd | Phase 1 | Resolved (per-protocol, no industry standard): captured per-`ModelTransportProtocol.thinkingChannel` (enum<content-block,item,part,none>) — Anthropic Messages=`content-block`, OpenAI Responses=`item`, Gemini=`part`. Same shape as OQ `oq:thinking-streaming-envelopes`. Recorded as gap-of-record. Closed. |
| Industry standard for cost/usage envelope across providers | tbd | Phase 1 | Resolved (per-protocol, no industry standard): captured per-`ModelTransportProtocol.usageEnvelope` (enum<anthropic-usage,openai-usage,gemini-usage-metadata,bedrock-usage,none>). Anthropic emits `usage{input_tokens,output_tokens,cache_creation_input_tokens,cache_read_input_tokens}`; OpenAI emits `usage{prompt_tokens,completion_tokens,total_tokens,reasoning_tokens?}`; Gemini emits `usageMetadata{promptTokenCount,candidatesTokenCount,totalTokenCount}`; Bedrock Converse emits `usage{inputTokens,outputTokens,totalTokens}`. Recorded as gap-of-record. Closed. |
| Industry standard for fork/resume semantics | tbd | Phase 1 | Resolved (per-product, no industry standard exists): captured per-product on `AgentRuntimeImpl` via `forkSemantics` and `resumeSemantics` attributes plus `CapabilitySupport` bindings to `capability:can-fork` / `capability:can-resume`. The schema records the absence of a cross-vendor envelope as a `Claim` rather than an OpenQuestion. Closed as gap-of-record. |
| Industry standard for thinking-streaming envelopes | tbd | Phase 1 | Resolved (per-protocol, no industry standard): captured per-`ModelTransportProtocol` via `thinkingChannel` (enum<content-block,item,part,none>) — Anthropic Messages uses `content-block`, OpenAI Responses uses `item`, Gemini uses `part`. CapabilitySupport bindings to `capability:thinking-streaming` record per-product surfacing. Recorded as cross-vendor gap-of-record. Closed. |
| Industry standard for cross-protocol tool-call streaming | tbd | Phase 1 | Resolved (per-transport, no industry standard): captured on `MCPTransport.streaming` (enum<none,partial,full>) — `mcp-transport:stdio` = partial (single-channel framing), `mcp-transport:streamable-http` = full (bidirectional with server-push). On the model side, captured per-`ModelTransportProtocol.streamingFraming` (sse/jsonl/grpc-stream/custom). Cross-vendor unification recorded as gap-of-record. Closed. |
| Industry standard for cross-agent plugin format | tbd | Phase 1 | Resolved (per-product, no industry standard): captured per-`NativeExtension.manifestProtocol` plus the `PortableExtension`/`Blueprint` shapes (a5c-flavored cross-product portability layer). No vendor-neutral plugin manifest standard exists. Recorded as gap-of-record. Closed. |
| Cross-platform signal propagation (docker/ssh/k8s) reliability | tbd | Phase 1 | Resolved (per-execution-mode, no industry standard): captured per-`Execution.signalPropagation` (enum<best-effort,reliable,degraded,unsupported>). Local/docker=reliable; ssh=best-effort (TTY-dependent); k8s=reliable+grace-period; cloud=degraded. Recorded as gap-of-record. Closed. |
| Platform-specific process-lifecycle (Unix pgroups vs Windows Job Objects) standardization | tbd | Phase 1 | Resolved (per-execution-mode, no industry standard): captured per-`Execution.processLifecycleModel` (enum<unix-pgroup,windows-job-object,docker-stop,k8s-grace,ssh-tty,direct>). Unix uses process-groups; Windows uses Job Objects; docker translates SIGTERM through PID-1; k8s honours `terminationGracePeriodSeconds`. Recorded as gap-of-record. Closed. |
| Standard for fidelity-preserving session-format round-trip | tbd | Phase 1 | Resolved (per-product, no industry standard): captured per-`SessionStorageFormat` enum (jsonl,sqlite,json,jsonl-tree) and per-`AgentRuntimeImpl.sessionFilePathConvention`. Round-trip fidelity is per-format (e.g. Claude jsonl preserves tool_use blocks; Cursor SQLite tables omit ephemeral state). Recorded as gap-of-record. Closed. |
| Cross-backend task-dependency representation | tbd | Phase 1 | Resolved: covered by `Decision.dependencies[]` DAG attribute already in tasks-mux taxonomy (see row "Cross-cutting axes (actor: human/agent/system; mode: sync/deferred; backend; dependencies DAG)"). Per-backend translation lives on each `NativeExtension` that implements `iface:tasks-mux`. Closed. |
| Bidirectional comment-sync semantics across task backends | tbd | Phase 1 | Resolved (per-backend, no industry standard): captured per-`TaskBackendProtocol`-implementing `NativeExtension` via `commentSyncMode` claim (enum<read-only,write-only,bidirectional-best-effort,bidirectional-strict,none>). GitHub Issues, Linear, and Jira all support bidirectional-best-effort; CLI/email/webhook backends are write-only or read-only. Recorded as gap-of-record. Closed. |
| Unified auth envelope across providers | tbd | Phase 1 | Resolved (per-platform, no universal spec): captured per-`AgentPlatformImpl.platformIdentityStrategy` and per-`Provider.authMethods` (enum<api-key,oauth,browser-login,service-account,iam,device-code>). MCP server auth captured separately via `ToolServer.authProfile` referencing OAuth Resource Server classification (RFC 6749 §1.4 + RFC 8707 — see `capability:mcp-oauth-resource-server`). No universal envelope exists; recorded as gap-of-record. Closed. |
| Standard for "agent-instance authority assertion" | tbd | Phase 1 | Resolved (per-impl, no industry standard): captured per-`Authority.assertionMethod` (enum<oidc-jwt,jws-detached,mtls-cert,api-key-bearer,sigstore-cosign,none>) referencing the chosen Trust Chain primitive. Live primitive today is `ProvenBreakpointAnswer` (HMAC-signed). Universal building blocks (HMAC/JWS/Sigstore/SLSA/mTLS/x509/GPG/OIDC) are catalogued; chain-composition is a5c-flavored. Recorded as gap-of-record. Closed. |
| MergeDiagnostics full attribute spec | tbd | Phase 1 | Resolved: full attribute spec lives in `./schema/validation-rules.md` and is realized as `HookMergeDiagnostic` (Cluster 5) with attributes `mergeStrategy`, `conflictResolution`, `precedenceChain`, `evidencedBy`. Closed. |

---

## Reconciliations log

Duplicate-id and naming reconciliations applied to the catalog. Each entry preserves referential integrity by marking the deprecated form (not deleting it) and adding `replacedBy` on the deprecated node.

| Date | Issue | Canonical | Deprecated | Notes |
|---|---|---|---|---|
| 2026-04-28 | NodeKind label duplication | `EvidenceSource` | `Evidence` | `Evidence` is now a deprecated alias label. The `evidence:` id prefix is unchanged (it is the declared prefix for `EvidenceSource`). Examples migrated from `examples/catalog-meta/evidence/` into `examples/catalog-meta/evidence-sources/`. Term entries `term:evidence` and `term:evidence-source` added with bidirectional synonym. |
| 2026-04-28 | Gemini transport triple | `model-transport:gemini-generate-content` | `model-transport:google-gemini`, `model-transport:google-generative-language` | Both deprecated ids retained as alias stubs with `replacedBy` and `deprecatedAt`. References in `agent-stack/core-impls/{cursor-core-current,opencode-core-1-x,gemini-cli-core-current}.yaml` updated to canonical id. Term entries for the deprecated names added. |
| 2026-04-28 | Django specialization duplicate | `specialization:backend-python-django` | `specialization:backend-django` | Deprecated alias retained with `replacedBy`. `extensions/skills/python-django-debug.yaml` updated to canonical id. |
| 2026-04-28 | Version-qualified id form | guidance added | n/a | New rule **V-1.8** in `./schema/validation-rules.md` and § "Version-qualified ids" in `./schema/meta-schema.md` require `<prefix>:<product-slug>@<version-spec>` for `AgentVersion`, `ModelVersion`, `ModelProviderVersion`, `CatalogVersion`. Phase-2 cleanup will sweep example refs that use bare unqualified forms. |
| 2026-04-28 | NodeKind origin enforcement | rule **V-1.9** now coded | n/a | `tools/validator/validate.py` runs a graph-level `run_origin_check` over `schema/ontology-schema.yaml` that fails if any NodeKind is missing the top-level `origin` field, or if its value is not in `{universal, a5c, standardized}`. 0 violations across all 107 NodeKinds. Also added missing `raised_by_gap` inverse edge declaration (closes inverse-pair gap). |

---

## Gate criteria

Phase 1 cannot be declared complete until:

- Every row in the coverage table has Status ∈ {✅, 🟡, ⏳, 🚫}
- No row left blank
- All 🟡 rows have a remediation plan (recorded inline in Notes)
- All ⏳ rows have an `OpenQuestion` entry in the section above
- All 🚫 rows have a reason (recorded in the Out-of-Scope section)

Until then, this document tracks the gap. The schema-validator step in `./schema/validation-rules.md` will assert each of the four bullets above and fail CI on regression.
