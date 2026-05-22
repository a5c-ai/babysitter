# 03 — Edge Kinds

The complete catalog of relationships in the ontology. Each edge declares its source and target NodeKinds, cardinality from the source's perspective, an optional inverse, and any attributes carried on the edge itself.

Conventions:

- Names are `snake_case` verb phrases.
- Cardinality is read as `source : target`.
- `Many` is shorthand for "any of several NodeKinds"; specific lists are given.
- An edge attribute means the relationship itself carries data (e.g., `transitions_to` carries a `gate`).

---

## Composition / stack

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `composed_of` | An agent product/version (or stack profile) is composed of stack-layer implementations / languages / frameworks / tools | `AgentProduct` \| `AgentVersion` \| `StackProfile` | `AgentCoreImpl` \| `AgentRuntimeImpl` \| `AgentPlatformImpl` \| `Language` \| `Framework` \| `Tool` | 1:N | `role` (enum<core,runtime,platform>) | `composes` |
| `bundled_with` | A product or platform ships bundled with a presentation surface (e.g., Claude Code bundles a TUI) | `AgentProduct` \| `AgentPlatformImpl` \| `Presentation` | `Presentation` \| `AgentPlatformImpl` | N:N | `bundleType` (enum<default,optional>) | `bundled_into` |
| `realizes` | An implementation node realizes a stack layer | `AgentCoreImpl` \| `AgentRuntimeImpl` \| `AgentPlatformImpl` \| `AgentVersion` \| `Presentation` \| `Channel` \| `Hook` | `Layer` | N:N | — | `realized_by` |
| `realized_by` | Inverse of `realizes` | `Layer` | `AgentCoreImpl` \| `AgentRuntimeImpl` \| `AgentPlatformImpl` \| `AgentVersion` \| `Presentation` \| `Channel` \| `Hook` | N:N | — | `realizes` |

## Versioning

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `has_version` | Entity has a versioned instance | `AgentProduct` \| `ModelFamily` \| `Schema` | `AgentVersion` \| `ModelVersion` \| `CatalogVersion` | 1:N | — | `version_of` |
| `version_of` | Inverse of `has_version` | `AgentVersion` \| `ModelVersion` \| `CatalogVersion` | `AgentProduct` \| `ModelFamily` \| `Schema` | N:1 | — | `has_version` |
| `replaces` | **DEPRECATED — dropped in catalog pass 22.** Was: a newer entity supersedes an older one in a deprecation chain. Editorial provenance for renames is now carried by `REMODEL-NOTES.md` plus `deprecatedAt` / `replacedBy` attributes on the legacy node; no graph edge is required. See [`REMODEL-NOTES.md`](./REMODEL-NOTES.md) (catalog pass 22 hygiene) for rationale. | `Term` \| `NodeKind` \| `EdgeKind` \| `AttributeType` \| `AgentVersion` \| `ModelVersion` \| `MCPTransport` \| `HookSurface` | same kind | N:1 | `reason` (markdown) | `replaced_by` |
| `replaced_by` | **DEPRECATED — dropped in catalog pass 22 alongside `replaces`.** See note above. | same kind | same kind | 1:N | — | `replaces` |
| `deprecated_at` | Marks the date an entity entered deprecation | any deprecatable | `CatalogVersion` | N:1 | `date` (iso-date), `removalAt` (iso-date) | — |

## Capability and support

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `supports` | A versioned entity supports a capability (over a version range, at some level). catalog pass 35 widened the source set to include `ProviderVersion` and `TransportRuntime` (alongside the prior list: `AgentVersion`, `ModelVersion`, `AgentRuntimeImpl`, `AgentPlatformImpl`, `AgentCoreImpl`, `AgentProduct`, `ToolServer`, `Plugin`, `Provider`). | (any version-bearing entity) | `Capability` | N:N | `versionRange` (versionRange), `level` (enum<full,partial,experimental,unsupported,degraded,none>), `notes` (markdown), `evidenceSourceIds` (list<ref<EvidenceSource>>) | `supported_by` |
| `supported_by` | Inverse of `supports` | `Capability` | (matches `supports.source`) | N:N | — | `supports` |
| `requires_capability` | Extension/profile/launch/subagent/tool-server requires a host capability | `Skill` \| `Plugin` \| `InteractionPrimitive` \| `CapabilityProfile` \| `LaunchConfig` \| `SessionModel` \| `ToolDescriptor` \| `Subagent` \| `ToolServer` | `Capability` | N:N | `level` (enum<required,recommended>) | `required_by` |
| `applies_to_version` | A version-scoped behavior spec applies to an agent version | `CapabilityProfile` \| `LifecycleSemantics` \| `SessionSemantics` \| `CapabilitySupport` | `AgentVersion` | N:1 | — | — |

## Provider and model transport

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `served_by` | A model version or model transport protocol is served by a provider | `ModelVersion` \| `ModelTransportProtocol` | `Provider` | N:N | `firstParty` (bool), `regions` (list<string>) | `serves` |
| `serves` | Inverse of `served_by` | `Provider` | `ModelVersion` \| `ModelTransportProtocol` | N:N | — | `served_by` |
| `speaks` | A model version speaks a transport protocol | `ModelVersion` | `ModelTransportProtocol` | N:N | — | `spoken_by` |
| `bridges` | A transport proxy bridges one protocol to another | `TransportProxy` | `ModelTransportProtocol` | N:1 (source) + N:1 (target) | `direction` (enum<src,dst>) | — |
| `exposes` | An agent platform or runtime exposes a host transport or hook surface | `AgentPlatformImpl` \| `AgentRuntimeImpl` | `AgentHostTransport` \| `HookSurface` | N:N | — | `exposed_by` |
| `exposed_by` | Inverse of `exposes` | `AgentHostTransport` \| `HookSurface` | `AgentPlatformImpl` \| `AgentRuntimeImpl` | N:N | — | `exposes` |
| `spoken_by` | Inverse of `speaks` | `ModelTransportProtocol` \| `MCPTransport` | `ModelVersion` \| `AgentCoreImpl` \| `AgentRuntimeImpl` | N:N | — | `speaks` |

## MCP non-tool primitives (D1, planner 2026-05-01)

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `exposes_resource` | A tool server exposes an MCP read-only resource | `ToolServer` | `MCPResource` | N:N | — | — |
| `exposes_prompt` | A tool server exposes an MCP prompt template | `ToolServer` | `MCPPrompt` | N:N | — | — |
| `exposes_sampling` | A tool server advertises an MCP sampling capability | `ToolServer` | `MCPSampling` | N:1 | — | — |
| `exposes_root` | A tool server (host) advertises an MCP filesystem root scope | `ToolServer` | `MCPRoot` | N:N | — | — |

## Human-checkpoint (D4, planner 2026-05-01)

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `uses_checkpoint` | A Process / Skill / Subagent declares a human-in-the-loop checkpoint | `Skill` \| `Subagent` \| `Process` \| `ProcessDescriptor` | `HumanCheckpoint` | N:N | — | — |

## Channels and hooks

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `emits_hook` | A versioned agent, hook mapping, hook surface, or background monitor emits/anchors a hook surface | `AgentVersion` \| `HookMapping` \| `HookSurface` \| `BackgroundMonitor` | `HookSurface` \| `AgentVersion` | N:N | `since` (semver) | `emitted_by` |

## Lifecycle

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `transitions_to` | A lifecycle state may transition to another | `LifecycleState` | `LifecycleState` | N:N | `gate` (string), `event` (string) | — |
| `belongs_to_machine` | A lifecycle state is part of a state machine | `LifecycleState` | `StateMachine` | N:1 | — | `has_state` |
| `state_machine_for` | A state machine governs a node kind or runtime entity instance | `StateMachine` \| `SessionModel` | `NodeKind` \| `Effect` \| `Invocation` \| `Run` \| `Session` \| `Workspace` | N:N | — | `governed_by` |
| `phase_in` | A phase belongs to a state machine or phase machine | `Phase` | `StateMachine` \| `PhaseMachine` | N:1 | `order` (int) | `has_phase` |

Note: `terminal_state` is **not** an edge but a `bool` attribute on `LifecycleState`.

## Workspace, execution, sandbox

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `materializes_as` | A workspace materializes as a worktree on disk | `Workspace` | `Worktree` | 1:N | `path` (string) | `materialization_of` |
| `runs_via` | A workspace or invocation runs via an execution mode | `Workspace` \| `Invocation` | `Execution` | N:1 | — | `runs_for` |
| `sandboxed_by` | An execution applies a sandbox profile | `Execution` | `Sandbox` | N:1 | — | `sandboxes` |
| `spans` | A run spans many invocations | `Run` | `Invocation` | 1:N | — | — |
| `executes_in` | An invocation executes in a sandbox | `Invocation` | `Sandbox` | N:1 | — | — |

## Domain ontology

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `contains` | Domain contains specializations; specialization contains topics | `Domain` \| `Specialization` | `Specialization` \| `Topic` | 1:N | — | `contained_in` |
| `belongs_to_language` | A framework belongs to one (or a family of) languages | `Framework` | `Language` | N:1 | — | `has_framework` |
| `composes` | A stack profile composes languages, frameworks, and tools | `StackProfile` | `Language` \| `Framework` \| `Tool` | N:N | `role` (string) | `composed_in` |
| `composes_stack` | Alias of `composes` (stack-profile sense) for disambiguation in YAML | `StackProfile` | `Language` \| `Framework` \| `Tool` | N:N | `role` (string) | `composed_in` |
| `applies_to` | An extension, blueprint, discovery signal, or piece of expertise applies to a domain area or product | `Skill` \| `Plugin` \| `Subagent` \| `Blueprint` \| `DiscoverySignal` \| `SkillArea` | `Domain` \| `Specialization` \| `Topic` \| `AgentProduct` \| `AgentVersion` | N:N | `confidence` (enum<primary,secondary>); `expertiseLevel` (enum<novice,intermediate,expert,authoritative>, optional — carries the former `ExpertiseLevel` NodeKind, Change A.6) | `applied_by` |
| `addresses` | A `Skill`, `Subagent`, or `Plugin` addresses a `SkillArea` (descriptive layer parallel to `applies_to`) | `Skill` \| `Subagent` \| `Plugin` | `SkillArea` | N:N | — | `addressed_by` |
| `requires_expertise` | A role or responsibility requires expertise in a `SkillArea` (parallel to `requires_skill` but targets the descriptive ontology) | `Role` \| `Responsibility` | `SkillArea` | N:N | `level` (enum<novice,intermediate,expert,authoritative>) | `expertise_required_by` |
| `requires_skill_area` | A `SkillArea` requires a prerequisite `SkillArea` | `SkillArea` | `SkillArea` | N:N | — | `prerequisite_for` |
| `uses_language` | A `SkillArea` uses a `Language` as a typical implementation substrate | `SkillArea` | `Language` | N:N | — | `used_by_skill_area` |
| `uses_framework` | A `SkillArea` uses a `Framework` | `SkillArea` | `Framework` | N:N | — | `used_by_skill_area` |
| `uses_library` | A `SkillArea` or `Framework` uses a `Library` | `SkillArea` \| `Framework` | `Library` | N:N | — | `used_by` |
| `uses_stack_part` | A `SkillArea` or `StackProfile` uses a `StackPart` | `SkillArea` \| `StackProfile` | `StackPart` | N:N | — | `used_by` |
| `uses_tool` | A `SkillArea` uses a `Tool` | `SkillArea` | `Tool` | N:N | — | `used_by` |
| `used_for` | A `Library` or `Tool` is used for a `SkillArea` | `Library` \| `Tool` | `SkillArea` | N:N | — | `uses_library` / `uses_tool` |
| `implemented_by` | A `StackPart` is implemented by a `Library`, `Framework`, or `Tool` | `StackPart` | `Library` \| `Framework` \| `Tool` | N:N | — | `implements_stack_part` |
| `implements_stack_part` | A `Library`, `Framework`, or `Tool` fills the role of a `StackPart` | `Library` \| `Framework` \| `Tool` | `StackPart` | N:N | — | `implemented_by` |

## Role ontology

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `holds_responsibility` | A role holds a responsibility | `Role` | `Responsibility` | N:N | `weight` (float, 0..1) | `held_by` |
| `requires_skill` | A role or responsibility requires a skill or domain expertise | `Role` \| `Responsibility` | `Skill` \| `Domain` \| `Specialization` | N:N | `level` (enum<novice,intermediate,expert,authoritative> — carries the former `ExpertiseLevel` NodeKind, Change A.6) | `required_for` |
| `delegates_to` | A role delegates work to another role | `Role` | `Role` | N:N | `condition` (markdown) | `delegated_from` |
| `member_of` | A role is a member of an org unit | `Role` | `OrgUnit` | N:1 | — | `has_member` |
| `roles_played_by` | A subagent fulfills a role | `Subagent` | `Role` | N:N | — | `played_by` |

Note: `is_agentic` is **not** an edge but a `bool` attribute on `Role`.

## Benchmarks

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `targets` | A benchmark targets a catalog entity | `Benchmark` | `Skill` \| `Plugin` \| `Domain` \| `Specialization` \| `StackProfile` \| `AgentVersion` \| `ModelVersion` \| `Layer` \| `Capability` \| `ExtensionInterface` | N:N | — | `targeted_by` |
| `tests_in_scope` | A test set declares the entities in scope for testing | `TestSet` | any catalog entity | N:N | — | `in_test_scope_of` |
| `evaluated_by` | An eval run was performed against a benchmark | `EvalRun` | `Benchmark` | N:1 | `runAt` (iso-timestamp) | `evaluations` |
| `produced_result` | An eval run produced a result record | `EvalRun` | `EvalResult` | 1:N | — | `produced_by` |
| `scored_against` | An eval result is scored against a benchmark | `EvalResult` | `Benchmark` | N:1 | `score` (float), `unit` (string) | `scores_of` |

## Extensions and plugins

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `installs_into` | A plugin installs into an agent product | `Plugin` | `AgentProduct` | N:N | `installMethod` (enum<marketplace,git,local>) | `accepts_plugin` |
| `compiles_to` | A portable extension or plugin compiles to a native extension or host-specific artifact | `PortableExtension` \| `Plugin` | `NativeExtension` \| `AgentVersion` | 1:N | `host` (id) | `compiled_from` |
| `contains_skill` | A plugin contains a skill | `Plugin` | `Skill` | 1:N | — | `contained_in_plugin` |
| `contains_subagent` | A plugin contains a subagent | `Plugin` | `Subagent` | 1:N | — | `contained_in_plugin` |
| `contains_tool_server` | A plugin contains a tool server | `Plugin` | `ToolServer` | 1:N | — | `contained_in_plugin` |
| `implements` | An extension implements an a5c extension interface | `Skill` \| `Plugin` \| `Subagent` \| `ToolServer` | `ExtensionInterface` | N:N | — | `implemented_by` |

## Agent UI layer (catalog pass 42 / catalog pass 45)

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `supports_interaction_primitive` | An `AgentUIImpl` exposes a user-facing interaction primitive. catalog pass 45 adds edge attributes capturing the integration mechanism (tool-call, slash-command, keybinding, ui-control, mcp-tool, native-api, deep-link, voice-command), an optional canonical `toolCallName` (when `mechanism` is tool-call/mcp-tool), and an optional literal `invocationToken` (when `mechanism` is slash-command/keybinding/deep-link). | `AgentUIImpl` | `InteractionPrimitive` | N:N | `mechanism` (enum<tool-call,slash-command,keybinding,ui-control,mcp-tool,native-api,deep-link,voice-command>, **required**), `toolCallName` (string, optional), `invocationToken` (string, optional) | `supported_by_agent_ui` |
| `supported_by_agent_ui` | Inverse of `supports_interaction_primitive`. | `InteractionPrimitive` | `AgentUIImpl` | N:N | — | `supports_interaction_primitive` |

**Surface vs mechanism distinction.** `InteractionPrimitive.surface` records WHERE the primitive is perceived/rendered to the user (the UI surface — `prompt-ui`, `editor-ui`, `slash-command`, `cli`, etc.). The `mechanism` attribute on `supports_interaction_primitive` records HOW the primitive is invoked at runtime (`tool-call`, `slash-command`, `keybinding`, `ui-control`, `mcp-tool`, `native-api`, `deep-link`, `voice-command`). A primitive emitted via `tool-call` whose result renders in the response area has `surface: editor-ui` on the node and `mechanism: tool-call` on the edge — these are orthogonal axes.

## Terminology

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `defined_in_context_of` | A term is defined in the context of a domain, layer, or node kind | `Term` | `Domain` \| `Layer` \| `NodeKind` | N:N | — | `defines_term` |
| `synonym_of` | One term is a synonym of another within a context | `Term` | `Term` | N:N | `inContext` (id) | — (symmetric) |
| `subsumes` | A broader term subsumes a narrower one | `Term` | `Term` | N:N | — | `subsumed_by` |
| `references` | A term anchors to a schema entity | `Term` | `NodeKind` \| `Capability` | N:N | — | `referenced_by` |
| `expands_to` | An acronym expands to a term | `Acronym` | `Term` | N:1 | — | — |
| `defines` | A definition defines a term | `Definition` | `Term` | N:1 | — | — |

Note: `Term.kind` is an enum attribute (collapsed from former `TermKind` NodeKind in the 2026-04-29 remodel), not an edge.

## Trust and evidence

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `produced_evidence_for` | An evidence source produced evidence for a claim | `EvidenceSource` | `Claim` \| `CapabilitySupport` \| `LifecycleSemantics` \| `SessionSemantics` | N:N | — | `evidenced_by` |
| `claims` | A claim asserts (subject, attribute, value) | `Claim` | (`NodeKind`, attribute name, value) | N:1 | `attribute` (string), `value` (any) | — |
| `signed_by` | An attestation is signed by an authority | `Attestation` | `Authority` | N:1 | `signedAt` (iso-timestamp), `signature` (string) | `signed` |
| `attests_to` | An attestation attests to an entity (claim, run, invocation, eval result, …) | `Attestation` | `Claim` \| `Run` \| `Invocation` \| `EvalResult` \| any catalog entity | N:N | `statement` (markdown) | `attested_by` |
| `at_trust_level` | An evidence source carries a trust level | `EvidenceSource` | `TrustLevel` | N:1 | — | `evidence_at_level` |
| `evidence_at_level` | Inverse of `at_trust_level` | `TrustLevel` | `EvidenceSource` | 1:N | — | `at_trust_level` |

## Scope

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `in_scope` | An entity declares itself within a scope boundary | any entity | `ScopeBoundary` | N:N | `note` (markdown) | `scopes_in` |
| `out_of_scope` | An entity declares itself outside a scope boundary | any entity | `ScopeBoundary` | N:N | `note` (markdown) | `scopes_out` |
| `out_of_scope_reason` | A scope boundary's out-of-scope items are tagged with reasons | `ScopeBoundary` | `OutOfScopeReason` | 1:N | — | `reason_for` |

## SourceRef

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `sourced_from` | An imported entity tracks its upstream source | `Skill` \| `Plugin` \| `Subagent` \| `ToolServer` \| `MCPServer` \| `AgentVersion` \| `Process` \| `BackgroundMonitor` \| `Blueprint` \| `LSPServer` \| `PluginArtifact` | `SourceRef` | N:1 | `importedAt` (iso-timestamp) | `source_for` |

## Catalog provenance (generators)

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `derives` | A generator derives an artifact from the graph | `Generator` | `DerivedArtifact` | 1:N | — | `derived_by` |
| `consumes_node_kind` | A generator depends on a node kind in its inputs | `Generator` | `NodeKind` | N:N | — | `consumed_by_generator` |
| `consumes_edge_kind` | A generator depends on an edge kind in its inputs | `Generator` | `EdgeKind` | N:N | — | `consumed_by_generator` |

## Legacy NodeKinds backfill (Phase 2)

Edges introduced alongside the legacy NodeKinds backfill (`PathDescriptor`,
`PackageSurface`, `CiSurface`, `PluginArtifact`, `HookMapping`,
`SessionSemantics`, `LifecycleSemantics`).

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `references_path` | An entity references a runtime filesystem path | `ProcessDescriptor` \| `PackageSurface` \| `PluginArtifact` \| `SessionSemantics` \| `LifecycleSemantics` | `PathDescriptor` | N:N | — | `path_for` |
| `path_for` | A `PathDescriptor` describes a path used by some entity | `PathDescriptor` | `ProcessDescriptor` \| `PackageSurface` \| `PluginArtifact` \| `SessionSemantics` \| `LifecycleSemantics` | N:N | — | `references_path` |
| `emits_artifact` | A `PluginTarget` / `AgentVersion` emits a `PluginArtifact` (or a `PluginArtifact` references its emitting target — observed N:1 in examples) | `PluginTarget` \| `AgentVersion` \| `PluginArtifact` | `PluginArtifact` \| `PluginTarget` | N:N | — | — |
| `maps_hook` | A `HookMapping` realizes a canonical `HookSurface` on a target | `HookMapping` | `HookSurface` | N:1 | — | — |
| `wraps_graph` | A `PackageSurface` wraps a `GraphDocument` (the canonical agent-catalog graph) | `PackageSurface` | `GraphDocument` | N:1 | — | — |
| `surfaces_process` | A `PackageSurface` surfaces a `ProcessDescriptor` | `PackageSurface` | `ProcessDescriptor` | N:N | — | — |
| `validated_by_ci` | A `PackageSurface` is validated by a `CiSurface` | `PackageSurface` | `CiSurface` | N:1 | — | `validates_package` |
| `validates_package` | A `CiSurface` validates a `PackageSurface` | `CiSurface` | `PackageSurface` | N:1 | — | `validated_by_ci` |

## Gap tracking (debt-loop)

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `discovered_by` | A `Gap` was discovered by an authority | `Gap` | `Authority` | N:1 | — | — |
| `closed_by` | A `Gap` was closed by an authority | `Gap` | `Authority` | N:1 | — | — |
| `affects` | A `Gap` is about (affects) some catalog entity | `Gap` | `NodeKind` \| `EdgeKind` \| `EvidencePolicy` | N:N | — | — |
| `blocks` | A `Gap` blocks phase advancement | `Gap` | `Phase` | N:N | — | — |
| `raised_question` | A `Gap` raised an `OpenQuestion` (bridge to the existing OQ entity) | `Gap` | `OpenQuestion` | N:N | — | `raised_by_gap` |
| `raised_by_gap` | Inverse of `raised_question` | `OpenQuestion` | `Gap` | N:N | — | `raised_question` |

## Formalization pass — references, lifecycle, scoping, and runtime edges

Edges previously used in examples but missing from the formal declaration. Source/target lists derived from observed usage in `graph/`.

### References

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `references_capability` | A `CapabilitySupport` references the `Capability` it asserts support for | `CapabilitySupport` | `Capability` | N:1 | — | — |
| `references_entity` | A `CapabilitySupport` references the entity that the support claim is about | `CapabilitySupport` | `AgentVersion` \| `ModelVersion` \| `AgentCoreImpl` \| `AgentRuntimeImpl` \| `AgentPlatformImpl` \| `AgentProduct` | N:1 | — | — |
| `about_subject` | A `Claim` is about a particular subject entity (mirrors `Claim.subjectId`) | `Claim` | `AgentVersion` \| `ModelVersion` \| `AgentProduct` \| `AgentCoreImpl` \| `AgentRuntimeImpl` \| `AgentPlatformImpl` \| `Capability` | N:1 | — | — |
| `backed_by_evidence` | A `Claim` is backed by an `EvidenceSource` (alias of `evidenced_by`) | `Claim` | `EvidenceSource` | N:N | — | — |
| `references` (note) | See terminology section above. | | | | | |

### Containment / bundling

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `bundles` | A runtime/platform bundles a presentation, tool, or other artifact (built-ins) | `AgentRuntimeImpl` \| `AgentPlatformImpl` | `ToolDescriptor` \| `Presentation` | 1:N | — | `bundled_in` |
| `bundled_in` | Inverse of `bundles` | `ToolDescriptor` \| `Presentation` | `AgentRuntimeImpl` \| `AgentPlatformImpl` | N:1 | — | `bundles` |
| `hosted_by` | A `PluginTarget` is hosted by an agent product/platform | `PluginTarget` | `AgentProduct` \| `AgentPlatformImpl` | N:1 | — | — |
| `connects` | An agent runtime connects to MCP servers via a transport protocol | `AgentRuntimeImpl` | `MCPTransport` | N:N | — | — |
| `installs` | An `InstallMethod` installs an `AgentVersion` | `InstallMethod` | `AgentVersion` | N:N | — | — |
| `executable_by` | A `Blueprint` is executable by an agent product | `Blueprint` | `AgentProduct` | N:N | — | — |

### Lifecycle / state machines

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `belongs_to_state_machine` | A `LifecycleState` belongs to a `StateMachine` (synonym/longer form of `belongs_to_machine`) | `LifecycleState` | `StateMachine` | N:1 | — | — |
| `in_state` | A stateful entity instance is currently in a lifecycle state | `Effect` \| `Invocation` \| `Run` \| `Session` \| `Workspace` | `LifecycleState` | N:1 | — | — |
| `belongs_to_phase_machine` | A `Phase` belongs to a `PhaseMachine` (alias of `phase_in`) | `Phase` | `PhaseMachine` | N:1 | — | — |
| `from_phase` | A `PhaseTransition` originates from a `Phase` | `PhaseTransition` | `Phase` | N:1 | — | — |
| `to_phase` | A `PhaseTransition` targets a `Phase` | `PhaseTransition` | `Phase` | N:1 | — | — |
| `requested_by` | An `Effect` was requested by the `Invocation` that emitted it | `Effect` | `Invocation` | N:1 | — | — |
| `belongs_to_run` | An `Invocation` belongs to the `Run` that spans it (alias of `spans` inverse) | `Invocation` | `Run` | N:1 | — | — |
| `uses_session` | An `Invocation` uses a `Session` | `Invocation` | `Session` | N:1 | — | — |
| `ran_agent_version` | An `Invocation` ran a particular `AgentVersion` | `Invocation` | `AgentVersion` | N:1 | — | — |
| `agent_version` | A `Session` was driven by a particular `AgentVersion` | `Session` | `AgentVersion` | N:1 | — | — |
| `forked_from` | A `Session` was forked from another `Session` | `Session` | `Session` | N:1 | — | — |
| `spawned_invocation` | A `Run` spawned a particular `Invocation` | `Run` | `Invocation` | 1:N | — | — |
| `depends_on` | An entity declares a runtime dependency on another | `AgentCoreImpl` \| `AgentRuntimeImpl` \| `AgentPlatformImpl` \| `Plugin` \| `Skill` \| `Subagent` | `SourceRef` \| `AgentCoreImpl` \| `AgentRuntimeImpl` \| `AgentPlatformImpl` \| `Plugin` | N:N | — | — |
| `used_by` | An `AgentHostTransport` (or comparable surface) is used by an `AgentVersion` | `AgentHostTransport` \| `ModelTransportProtocol` \| `MCPTransport` | `AgentVersion` \| `AgentRuntimeImpl` \| `AgentPlatformImpl` | N:N | — | — |

### Scoping

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `bounds_subject` | A `ScopeBoundary` anchors to the subject entity it bounds (mirrors `subjectId`) | `ScopeBoundary` | `AgentProduct` \| `AgentVersion` \| `Benchmark` \| `Blueprint` \| `Skill` \| `Subagent` \| `ToolServer` \| `Plugin` \| `Capability` | N:1 | — | — |
| `requires_minimum_trust` | An `EvidencePolicy` requires a minimum trust level for accepted evidence | `EvidencePolicy` | `TrustLevel` | N:1 | — | — |
| `has_trust_level` | An `EvidenceSource` carries a trust level (alias of `at_trust_level`) | `EvidenceSource` | `TrustLevel` | N:1 | — | — |

### Domain / aliases / canonical mapping

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `specializes` | A `Specialization` specializes a `Domain` (alias of `contained_in`) | `Specialization` | `Domain` | N:1 | — | — |
| `applies_to_language` | A `Framework` applies to one or more `Language`s (alias of `belongs_to_language`) | `Framework` | `Language` | N:N | — | — |
| `alias_of` | An entity is an alias of another (typically same NodeKind) | `ModelTransportProtocol` \| `Term` \| `MCPTransport` \| `Specialization` \| `Domain` | same kind | N:1 | — | — |
| `canonicalized_to` | A vendor-specific `HookSurface` canonicalizes to the canonical `HookSurface` | `HookSurface` | `HookSurface` | N:1 | — | — |
| `bridged_by` | A `ModelTransportProtocol` is bridged by a `TransportProxy` (inverse of `bridges`) | `ModelTransportProtocol` | `TransportProxy` | N:N | — | — |
| `synonym_a` | The first term in a `Synonym` pair | `Synonym` | `Term` | N:1 | — | — |
| `synonym_b` | The second term in a `Synonym` pair | `Synonym` | `Term` | N:1 | — | — |
| `surfaced_by` | A `ProcessDescriptor` is surfaced by a `Blueprint` or `PackageSurface` | `ProcessDescriptor` | `Blueprint` \| `PackageSurface` | N:N | — | — |

### Benchmarks / evals

| Edge | Description | Source | Target | Cardinality | Attributes | Inverse |
|---|---|---|---|---|---|---|
| `belongs_to_benchmark` | A `TestSet` belongs to a `Benchmark` | `TestSet` | `Benchmark` | N:1 | — | — |
| `belongs_to_eval_run` | An `EvalResult` belongs to the `EvalRun` that produced it (alias of `produced_by`) | `EvalResult` | `EvalRun` | N:1 | — | — |
| `evaluates_target` | An `EvalRun` evaluates a target entity | `EvalRun` | `AgentVersion` \| `ModelVersion` \| `Plugin` \| `Skill` \| `Subagent` | N:N | — | — |
| `uses_test_set` | An `EvalRun` uses a `TestSet` | `EvalRun` | `TestSet` | N:N | — | — |
| `for_benchmark` | An `EvalRun` is for a particular `Benchmark` (alias of `evaluated_by`) | `EvalRun` | `Benchmark` | N:1 | — | — |
| `refines` | A `Benchmark` refines an earlier benchmark | `Benchmark` | `Benchmark` | N:1 | — | — |
| `split_of` | A `TestSet` is a split of a `Benchmark` | `TestSet` | `Benchmark` | N:1 | — | — |

---

## Canonical and aliases

Some EdgeKinds declare `aliasOf: <canonical-edge>` to record that they are an
ergonomic synonym of an existing canonical edge. Aliases were introduced for
domain-specific examples that read more naturally with a longer or differently
phrased name (`belongs_to_state_machine` for `belongs_to_machine`,
`for_benchmark` for `evaluated_by`, `backed_by_evidence` for `evidenced_by`,
`belongs_to_phase_machine` for `phase_in`, etc.).

Rules:

- The `aliasOf` value MUST name a canonical EdgeKind that exists in this
  schema; the canonical edge MUST NOT itself carry `aliasOf` (single-hop).
- Examples MAY use either the canonical or the alias name interchangeably.
- The validator (rule **V-3.5**) resolves aliases to the canonical edge when
  checking source/target/cardinality constraints.
- When in doubt, prefer the canonical name. New aliases are added sparingly
  and require a schema bump.

Current alias set (canonical `<-` aliases):

| Canonical | Aliases |
|---|---|
| `evaluated_by` | `for_benchmark` |
| `belongs_to_machine` | `belongs_to_state_machine` |
| `belongs_to_language` | `applies_to_language` |
| `surfaces_process` | `surfaced_by` |
| `composes` | `composes_stack` |
| `at_trust_level` | `has_trust_level` |
| `evidenced_by` | `backed_by_evidence` |
| `produced_by` | `belongs_to_eval_run` |
| `phase_in` | `belongs_to_phase_machine` |
| `contained_in` | `specializes` |
| `bridges` | `bridged_by` |
| `bundles` | `bundled_in` |
| `spans` | `belongs_to_run`, `workspace_spans` |

Formalized as part of the 2026-04-29 remodel — Change D.

---

## Edge attributes vs. node attributes

When in doubt, prefer node attributes for properties of an entity and edge attributes for properties of a relationship. `transitions_to.gate` is a property of the transition, not of either state. `supports.versionRange` is a property of the support relationship, not the agent or capability.

---

## catalog pass 16 edges (Platform / PlatformService / Benchmark coverage)

Five edge families were added in catalog pass 16 alongside the `Platform` and `PlatformService`
NodeKinds (see [`../schema/node-kinds/domain-ontology.md`](./schema/node-kinds/domain-ontology.md))
and the `covers` wiring from `Benchmark` to `SkillArea`.

| Edge | Source | Target | Cardinality | Inverse | Attributes | Notes |
|---|---|---|---|---|---|---|
| `provided_by` | `PlatformService` | `Platform` | N:1 | `provides` | — | Exactly one Platform per PlatformService (V-platform-1). |
| `provides` | `Platform` | `PlatformService` | 1:N | `provided_by` | — | Inverse direction. |
| `integrates_with` | `PlatformService` | `PlatformService` | N:N (symmetric) | `integrates_with` | `nature: enum<native,sdk,api,event>` | Documented integration. **Canonicalized as `(min(id), max(id))` — exactly one row per unordered pair (V-platform-2)**. |
| `depends_on` | `PlatformService` | `PlatformService` | N:N | `depended_on_by` | `kind: enum<required,optional,recommended>` | Runtime dependency (e.g. EKS depends_on IAM). |
| `depended_on_by` | `PlatformService` | `PlatformService` | N:N | `depends_on` | — | Inverse. |
| `covers` | `Benchmark` | `SkillArea` | N:N | `covered_by_benchmark` | `coverage: enum<full,partial,tangential>`, `weight: float` (optional, 0..1) | A Benchmark exercises a SkillArea, optionally weighted. |
| `covered_by_benchmark` | `SkillArea` | `Benchmark` | N:N | `covers` | — | Inverse. |

The existing `implemented_by` / `implements_stack_part` edge pair was **widened**
(not duplicated) in catalog pass 16: `PlatformService` is added to the `implemented_by` target
list and the `implements_stack_part` source list. This keeps the catalog's "what
implements stack-part:X?" query single-edge across libraries, frameworks, tools, and
platform services.

---

## catalog pass 18 edges (Symphony lifecycle, tracker integration, dashboard surfaces)

Fourteen new edge predicates were added in catalog pass 18 alongside the 20 new NodeKinds
spread across [`../schema/node-kinds/lifecycle.md`](./schema/node-kinds/lifecycle.md),
[`../schema/node-kinds/agent-stack.md`](./schema/node-kinds/agent-stack.md),
[`../schema/node-kinds/transport.md`](./schema/node-kinds/transport.md), and
[`../schema/node-kinds/channels-hooks.md`](./schema/node-kinds/channels-hooks.md). Every
predicate declares its inverse per the schema-conformance rule (V-edge-inverse-1).

| Edge | Source | Target | Cardinality | Inverse | Attributes | Notes |
|---|---|---|---|---|---|---|
| `targets_tracker` | `WorkflowDefinition` | `IssueTracker` | N:1 | `targeted_by_workflow` | — | Mirrors `WorkflowDefinition.trackerBinding`. |
| `targeted_by_workflow` | `IssueTracker` | `WorkflowDefinition` | N:N | `targets_tracker` | — | Inverse. |
| `invokes_agent` | `WorkflowDefinition` | `AgentVersion` | N:N | `invoked_by_workflow` | — | Agents the workflow may invoke. |
| `invoked_by_workflow` | `AgentVersion` | `WorkflowDefinition` | N:N | `invokes_agent` | — | Inverse. |
| `uses_workspace` | `RunAttempt` | `Workspace` | N:1 | `used_by_run_attempt` | — | The workspace bound for this attempt. |
| `used_by_run_attempt` | `Workspace` | `RunAttempt` | 1:N | `uses_workspace` | — | Inverse. |
| `for_issue` | `RunAttempt` | `Issue` | N:1 | `has_run_attempts` | — | The issue this attempt is working on. |
| `has_run_attempts` | `Issue` | `RunAttempt` | 1:N | `for_issue` | — | Inverse. |
| `has_live_session` | `RunAttempt` | `LiveSession` | N:1 | `driven_by_run_attempt` | — | The in-flight session for this attempt. |
| `driven_by_run_attempt` | `LiveSession` | `RunAttempt` | N:1 | `has_live_session` | — | Inverse. |
| `exposed_by` (extension) | `APIEndpoint` | `HTTPServerExtension` | N:1 | `exposes_endpoint` | — | An endpoint is exposed by an HTTP server extension. **Note:** widens the existing `exposed_by` edge (which currently maps `AgentHostTransport` / `HookSurface` -> `AgentPlatformImpl` / `AgentRuntimeImpl`); validators MUST resolve by source NodeKind. |
| `exposes_endpoint` | `HTTPServerExtension` | `APIEndpoint` | 1:N | `exposed_by` | — | Inverse. |
| `reads_endpoint` | `Dashboard` | `APIEndpoint` | N:N | `read_by_dashboard` | — | Runtime data binding. |
| `read_by_dashboard` | `APIEndpoint` | `Dashboard` | N:N | `reads_endpoint` | — | Inverse. |
| `derives_from` | `Dashboard` | `RuntimeSnapshot` | N:1 | `source_of_dashboard` | — | Catalog-shape provenance (distinct from `reads_endpoint` runtime binding). |
| `source_of_dashboard` | `RuntimeSnapshot` | `Dashboard` | 1:N | `derives_from` | — | Inverse. |
| `implements_protocol` | `IssueTracker` | `IssueTrackerProtocol` | N:1 | `implemented_by_tracker` | — | Mirrors `IssueTracker.protocolId`. |
| `implemented_by_tracker` | `IssueTrackerProtocol` | `IssueTracker` | 1:N | `implements_protocol` | — | Inverse. |
| `from_tracker` | `Issue` | `IssueTracker` | N:1 | `produces_issue` | — | Mirrors `Issue.trackerId`. |
| `produces_issue` | `IssueTracker` | `Issue` | 1:N | `from_tracker` | — | Inverse. |
| `handles_failure` | `RecoveryStrategy` | `FailureClass` | N:N | `handled_by_strategy` | — | Strategies registered for a layer. |
| `handled_by_strategy` | `FailureClass` | `RecoveryStrategy` | N:N | `handles_failure` | — | Inverse. |
| `categorized_as` | `ErrorCategory` | `FailureClass` | N:1 | `categorizes_errors` | — | Mirrors `ErrorCategory.failureClassId`. |
| `categorizes_errors` | `FailureClass` | `ErrorCategory` | 1:N | `categorized_as` | — | Inverse. |
| `fires_operational_trigger` | `APIEndpoint` | `OperationalTrigger` | N:N | `triggered_by_endpoint` | — | Renamed from the catalog pass 18 plan's bare `triggers` to avoid collision with hook/event trigger semantics. |
| `triggered_by_endpoint` | `OperationalTrigger` | `APIEndpoint` | N:N | `fires_operational_trigger` | — | Inverse. |
| `snapshots_state` | `RuntimeSnapshot` | `OrchestratorState` | N:1 | `snapshotted_by` | — | Which orchestrator-state shape the snapshot captures. |
| `snapshotted_by` | `OrchestratorState` | `RuntimeSnapshot` | 1:N | `snapshots_state` | — | Inverse. |

Counts: 14 new forward predicates + 14 inverses = 28 entries (the inverse pair
is canonical per V-edge-inverse-1; either direction may be authored, the
validator resolves the pair).

### Rename note

catalog pass 18's draft used a bare `triggers` predicate from `APIEndpoint` to
`OperationalTrigger`. The reviewer renamed it to `fires_operational_trigger` for
clarity and to avoid future ambiguity with hook/event triggers. Authors MUST use
the renamed predicate; legacy `triggers` references are not registered as an
alias.

### `exposed_by` widening (not duplication)

The existing `exposed_by` edge (mapping `AgentHostTransport` / `HookSurface` -> `AgentPlatformImpl` / `AgentRuntimeImpl`) is **widened**, not duplicated. Validator V-3.x resolves by source NodeKind: an `APIEndpoint` source picks the new `HTTPServerExtension` target binding; an `AgentHostTransport` / `HookSurface` source picks the original target binding. This mirrors the catalog pass 16 widening precedent for `implemented_by`.

---

## catalog pass 19 edges (cost/quota, role boundary, observability, vcs/ci, compliance, context-engineering, benchmarks)

Forty-six new edge predicates were added in catalog pass 19 alongside the 26 new NodeKinds spread
across [`../schema/node-kinds/cost-quota.md`](./schema/node-kinds/cost-quota.md),
[`../schema/node-kinds/role-ontology.md`](./schema/node-kinds/role-ontology.md),
[`../schema/node-kinds/observability-pipeline.md`](./schema/node-kinds/observability-pipeline.md),
[`../schema/node-kinds/vcs-ci.md`](./schema/node-kinds/vcs-ci.md),
[`../schema/node-kinds/compliance-safety.md`](./schema/node-kinds/compliance-safety.md),
[`../schema/node-kinds/context-engineering.md`](./schema/node-kinds/context-engineering.md), and
[`../schema/node-kinds/benchmarks.md`](./schema/node-kinds/benchmarks.md).

Edge-target remappings applied per the adversarial reviewer (catalog pass 19):

- `Org` → `OrgUnit` (3 edges: `Tenant.owned_by`, `Customer.represents`,
  `VendorRelationship.with_organization`).
- `ModelProvider` → `Provider` (1 edge: `CostModel.provides_cost_for`).
- `ToolInvocation` → `Effect` (1 edge: `Span.emitted_by`).
- `Identity` → `Role` (1 edge: `CodeReview.submitted_by`); dropped from `Quota.constrains`
  (third union member removed pending an `Identity` NodeKind introduction).
- `Guardrail` → removed from `ContentPolicy.applied_by` union (only `AgentVersion` remains).

### Cost & quota

| Edge | Source | Target | Cardinality | Inverse | Attributes | Notes |
|---|---|---|---|---|---|---|
| `provides_cost_for` | `CostModel` | `Provider` | N:N | `priced_by` | — | The provider this price card prices. |
| `priced_by` | `UsageRecord` \| `Provider` | `CostModel` | N:1 | `provides_cost_for` | — | Inverse + the cost-model used to price one usage record. |
| `constrains` | `Quota` | `Tenant` \| `Customer` \| `Role` \| `OrgUnit` | N:N | `constrained_by` | — | The actor whose consumption the quota meters. |
| `constrained_by` | `Tenant` \| `Customer` \| `Role` \| `OrgUnit` | `Quota` | N:N | `constrains` | — | Inverse. |
| `measures_usage_of` | `UsageRecord` | `AgentVersion` \| `ModelVersion` \| `Run` \| `Invocation` \| `Effect` | N:1 | `usage_measured_by` | — | The runtime entity whose execution generated the usage. |
| `usage_measured_by` | `AgentVersion` \| `ModelVersion` \| `Run` \| `Invocation` \| `Effect` | `UsageRecord` | 1:N | `measures_usage_of` | — | Inverse. |
| `attributed_to` | `UsageRecord` | `Tenant` \| `Customer` \| `EndUser` \| `OrgUnit` | N:1 | `attributed_usage` | — | The actor billed for the usage. |
| `attributed_usage` | `Tenant` \| `Customer` \| `EndUser` \| `OrgUnit` | `UsageRecord` | 1:N | `attributed_to` | — | Inverse. |
| `governs` | `BudgetPolicy` | `Tenant` \| `Customer` \| `OrgUnit` | N:N | `governed_by_budget` | — | The actor whose spend the policy caps. |
| `governed_by_budget` | `Tenant` \| `Customer` \| `OrgUnit` | `BudgetPolicy` | N:N | `governs` | — | Inverse. |
| `enforces` | `BudgetPolicy` | `Quota` | N:N | `enforced_by_budget` | — | The quota(s) the policy aggregates / enforces. |
| `enforced_by_budget` | `Quota` | `BudgetPolicy` | N:N | `enforces` | — | Inverse. |

### Role boundary (commercial / operational)

| Edge | Source | Target | Cardinality | Inverse | Attributes | Notes |
|---|---|---|---|---|---|---|
| `owned_by` | `Tenant` | `OrgUnit` | N:1 | `owns_tenant` | — | Internal owner of a tenant. |
| `owns_tenant` | `OrgUnit` | `Tenant` | 1:N | `owned_by` | — | Inverse. |
| `represents` | `Customer` | `OrgUnit` | N:1 | `represented_by` | — | The internal org unit that owns the customer relationship. |
| `represented_by` | `OrgUnit` | `Customer` | 1:N | `represents` | — | Inverse. |
| `contracted_with` | `Customer` | `Tenant` | N:N | `contracts_with_customer` | — | The tenant(s) the customer's contract entitles to. |
| `contracts_with_customer` | `Tenant` | `Customer` | N:N | `contracted_with` | — | Inverse. |
| `belongs_to` | `EndUser` | `Tenant` | N:1 | `has_end_user` | — | The tenant the end-user is enrolled in. |
| `has_end_user` | `Tenant` | `EndUser` | 1:N | `belongs_to` | — | Inverse. |
| `with_organization` | `VendorRelationship` | `OrgUnit` | N:1 | `holds_vendor_relationship` | — | Internal org unit owning the vendor relationship. |
| `holds_vendor_relationship` | `OrgUnit` | `VendorRelationship` | 1:N | `with_organization` | — | Inverse. |
| `procures` | `VendorRelationship` | `Provider` | N:N | `procured_via` | — | The provider(s) the relationship purchases from. |
| `procured_via` | `Provider` | `VendorRelationship` | N:N | `procures` | — | Inverse. |

### Observability pipeline

| Edge | Source | Target | Cardinality | Inverse | Attributes | Notes |
|---|---|---|---|---|---|---|
| `emitted_by` (extension) | `Span` | `Effect` \| `Invocation` \| `Run` | N:1 | `emits_span` | — | The runtime entity that emitted the span. **Note:** widens the existing `emitted_by` edge (catalog pass 18 hook-emission widening precedent); validator resolves by source NodeKind. |
| `emits_span` | `Effect` \| `Invocation` \| `Run` | `Span` | 1:N | `emitted_by` | — | Inverse. |
| `reports_to` | `Span` | `ObservabilityBackend` | N:1 | `ingests_span` | — | The backend the span was shipped to. |
| `ingests_span` | `ObservabilityBackend` | `Span` | 1:N | `reports_to` | — | Inverse. |

### VCS & CI

| Edge | Source | Target | Cardinality | Inverse | Attributes | Notes |
|---|---|---|---|---|---|---|
| `hosted_on` | `PullRequest` | `VCSHost` | N:1 | `hosts_pull_request` | — | The host this PR lives on. |
| `hosts_pull_request` | `VCSHost` | `PullRequest` | 1:N | `hosted_on` | — | Inverse. |
| `authored_by` | `PullRequest` | `Role` \| `Subagent` \| `AgentVersion` | N:1 | `authored_pull_request` | — | The PR author entity. |
| `authored_pull_request` | `Role` \| `Subagent` \| `AgentVersion` | `PullRequest` | 1:N | `authored_by` | — | Inverse. |
| `reviews` | `CodeReview` | `PullRequest` | N:1 | `reviewed_by` | — | The PR being reviewed. |
| `reviewed_by` | `PullRequest` | `CodeReview` | 1:N | `reviews` | — | Inverse. |
| `submitted_by` | `CodeReview` | `Role` \| `Subagent` \| `AgentVersion` | N:1 | `submitted_review` | — | The reviewing actor. (Plan originally targeted `Identity`; remapped to `Role` per catalog pass 19 review.) |
| `submitted_review` | `Role` \| `Subagent` \| `AgentVersion` | `CodeReview` | 1:N | `submitted_by` | — | Inverse. |
| `runs_on_host` | `CIWorkflow` | `VCSHost` | N:1 | `hosts_ci_workflow` | — | The VCS host where this workflow's repo lives. |
| `hosts_ci_workflow` | `VCSHost` | `CIWorkflow` | 1:N | `runs_on_host` | — | Inverse. |

### Compliance & safety

| Edge | Source | Target | Cardinality | Inverse | Attributes | Notes |
|---|---|---|---|---|---|---|
| `published_by` | `ComplianceFramework` | `Regulator` | N:1 | `publishes_framework` | — | The regulator that publishes the framework. |
| `publishes_framework` | `Regulator` | `ComplianceFramework` | 1:N | `published_by` | — | Inverse. |
| `applied_by` (extension) | `ContentPolicy` | `AgentVersion` | N:N | `applies_policy` | — | The agent version that applies the policy at runtime. **Note:** plan originally also targeted `Guardrail`; dropped per catalog pass 19 review (Guardrail does not exist in atlas). |
| `applies_policy` | `AgentVersion` | `ContentPolicy` | N:N | `applied_by` | — | Inverse. |
| `implements_framework` | `ContentPolicy` | `ComplianceFramework` | N:N | `implemented_by_policy` | — | The framework(s) the policy operationalizes. |
| `implemented_by_policy` | `ComplianceFramework` | `ContentPolicy` | N:N | `implements_framework` | — | Inverse. |
| `detected_by` | `JailbreakPattern` | `ContentPolicy` | N:N | `detects_pattern` | — | The policy / detector that catches the pattern. |
| `detects_pattern` | `ContentPolicy` | `JailbreakPattern` | N:N | `detected_by` | — | Inverse. |

### Context engineering

| Edge | Source | Target | Cardinality | Inverse | Attributes | Notes |
|---|---|---|---|---|---|---|
| `produced_by` (extension) | `EmbeddingModelProfile` | `Provider` | N:1 | `produces_embedding_profile` | — | The provider serving the embedding model. **Note:** widens the existing `produced_by` edge (currently `EvalResult` -> `EvalRun`); validator resolves by source NodeKind. |
| `produces_embedding_profile` | `Provider` | `EmbeddingModelProfile` | 1:N | `produced_by` | — | Inverse. |
| `backed_by` | `MemoryStore` | `VectorStore` | N:1 | `backs_memory_store` | — | For `kind=vector`, the backing store. |
| `backs_memory_store` | `VectorStore` | `MemoryStore` | 1:N | `backed_by` | — | Inverse. |
| `uses_embedding` | `MemoryStore` | `EmbeddingModelProfile` | N:1 | `embedding_used_by` | — | For `kind=vector`, the embedding model. |
| `embedding_used_by` | `EmbeddingModelProfile` | `MemoryStore` | 1:N | `uses_embedding` | — | Inverse. |
| `used_by` (extension) | `PromptTemplate` | `AgentVersion` \| `Subagent` | N:N | `uses_prompt_template` | — | The entity that renders / sends the prompt. **Note:** widens the existing `used_by` edge (currently `AgentHostTransport` / `ModelTransportProtocol` / `MCPTransport` -> agent-stack-impls); validator resolves by source NodeKind. |
| `uses_prompt_template` | `AgentVersion` \| `Subagent` | `PromptTemplate` | N:N | `used_by` | — | Inverse. |
| `composes` (extension) | `ContextBundle` | `PromptTemplate` | N:N | `composed_into_bundle` | — | Templates rendered into the bundle. **Note:** widens the existing `composes` edge (currently `StackProfile` -> stack-parts); validator resolves by source NodeKind. |
| `composed_into_bundle` | `PromptTemplate` | `ContextBundle` | N:N | `composes` | — | Inverse. |
| `draws_from` | `ContextBundle` | `MemoryStore` | N:N | `drawn_into_bundle` | — | Memory stores read on each turn. |
| `drawn_into_bundle` | `MemoryStore` | `ContextBundle` | N:N | `draws_from` | — | Inverse. |
| `cached_in` | `ContextBundle` | `MemoryStore` | N:1 | `caches_bundle` | — | Optional prompt-cache store. |
| `caches_bundle` | `MemoryStore` | `ContextBundle` | 1:N | `cached_in` | — | Inverse. |

### Benchmarks (judges & rubrics)

| Edge | Source | Target | Cardinality | Inverse | Attributes | Notes |
|---|---|---|---|---|---|---|
| `judges_for` | `Judge` | `EvalHarness` | N:N | `uses_judge` | — | The harness(es) that invoke the judge. |
| `uses_judge` | `EvalHarness` | `Judge` | N:N | `judges_for` | — | Inverse. |
| `uses_model` | `Judge` | `Provider` \| `ModelVersion` | N:1 | `provides_judge_model` | — | The provider/model the judge is bound to. |
| `provides_judge_model` | `Provider` \| `ModelVersion` | `Judge` | 1:N | `uses_model` | — | Inverse. |
| `scored_by` | `Rubric` | `Judge` | N:N | `applies_rubric` | — | The judge(s) that apply this rubric. |
| `applies_rubric` | `Judge` | `Rubric` | N:N | `scored_by` | — | Inverse. |

Counts: 46 forward predicates + 46 inverses = 92 entries (the inverse pair is canonical
per V-edge-inverse-1; either direction may be authored, the validator resolves the pair).

### Notes on edge widening

Five catalog pass 19 edges *widen* existing edges rather than introducing new names:

- `emitted_by` widens with `(Span -> Effect|Invocation|Run)` source binding.
- `produced_by` widens with `(EmbeddingModelProfile -> Provider)` source binding.
- `used_by` widens with `(PromptTemplate -> AgentVersion|Subagent)` source binding.
- `composes` widens with `(ContextBundle -> PromptTemplate)` source binding.
- `applied_by` widens with `(ContentPolicy -> AgentVersion)` source binding (and DROPS
  the originally-planned `Guardrail` target per catalog pass 19 reviewer remap).

Validator V-3.x resolves widened edges by source NodeKind, mirroring the catalog pass 16
`implemented_by` and catalog pass 18 `exposed_by` widening precedents.

---

## catalog pass 22 — EdgeKind origin tagging (first batch)

catalog pass 22 introduces the `origin` attribute on EdgeKind (mirroring the long-standing
NodeKind `origin` field — see [`../schema/meta-schema.md`](../schema/meta-schema.md) for the
formal spec). This first batch tags **35 edges**; ~240 remaining edges will be
tagged in subsequent passes. The full audit and rationale per edge live in
[`REMODEL-NOTES.md`](./REMODEL-NOTES.md) (catalog pass 22 hygiene).

The `replaces` / `replaced_by` edges were originally proposed for a `universal`
tag but were instead **dropped** in this pass (see the Versioning table above for
the deprecation marker on those rows, and REMODEL-NOTES catalog pass 22 for rationale —
editorial provenance via REMODEL-NOTES + node-level `replacedBy` attribute is
sufficient; a graph edge is redundant).

### Universal (18 edges)

Generic relations that apply across the agentic stack and beyond:

| Edge | Notes |
|---|---|
| `has_version` | Generic versioning relation. |
| `version_of` | Inverse of `has_version`. |
| `composed_of` | Generic mereological relation. |
| `composes` | Inverse of `composed_of`. |
| `applies_to` | Generic scope/applicability relation. |
| `applied_by` | Inverse of `applies_to`. |
| `supports` | Generic capability relation. |
| `supported_by` | Inverse of `supports`. |
| `requires_capability` | Generic capability dependency. |
| `required_by` | Inverse of `requires_capability`. |
| `exposes` | Generic surface-exposure relation. |
| `exposed_by` | Inverse of `exposes`. |
| `transitions_to` | Generic state-machine relation. |
| `state_machine_for` | Generic state-machine binding. |
| `governed_by` | Generic governance relation. |
| `executes_in` | Generic execution-context relation. |
| `applies_to_version` | Generic version-applicability relation. |
| `deprecated_at` | Generic deprecation-marker relation. |

### Standardized (10 edges)

Relations that name a published external spec we adopt:

| Edge | Notes |
|---|---|
| `speaks` | Names a transport-protocol-speaking relation; bound to `ModelTransportProtocol` / `MCPTransport` registry of standardized protocols. |
| `spoken_by` | Inverse of `speaks`. |
| `exposes_resource` | Names MCP resource primitive. |
| `exposes_prompt` | Names MCP prompt primitive. |
| `exposes_sampling` | Names MCP sampling primitive. |
| `exposes_root` | Names MCP root primitive. |
| `emits_hook` | Names Claude Code hook surface. |
| `emitted_by` | Inverse of `emits_hook` (and widened in catalog pass 19 for OTel `Span` semantics). |
| `spans` | Names OTel span semantics. |
| `bridges` | Names protocol-bridge pattern (MCP/A2A). Borderline-universal; tagged standardized due to MCP/A2A naming. |
| `served_by` | Names MCP/HTTP server semantics. Borderline-universal; tagged standardized due to MCP/HTTP server framing. |
| `serves` | Inverse of `served_by`. |

### Convergent (1 edge)

Relations that capture an emerging consensus across multiple vendors not yet
ratified into a formal standard:

| Edge | Notes |
|---|---|
| `uses_checkpoint` | Babysitter checkpoint primitive; convergent because checkpoint shape is shared across DB / ML-training / agent-run domains while the relation here is babysitter-coined. |

### Counts

- universal: 18
- standardized: 12 (= the 10 in the table above is condensed; full count: `speaks`, `spoken_by`, `exposes_resource`, `exposes_prompt`, `exposes_sampling`, `exposes_root`, `emits_hook`, `emitted_by`, `spans`, `bridges`, `served_by`, `serves` — twelve listed; see also overload note below).
- convergent: 1
- dropped (originally proposed universal, removed in user override): 2 (`replaces`, `replaced_by`)

Note on count overload: the originally-approved batch totals **35** including the
2 dropped (`replaces` / `replaced_by`). With the user override that drops them,
the applied tag count is **33**. The remaining ~240 EdgeKinds in this file are
untagged pending future passes.

## catalog pass 23 — Universal-origin batch tagging

_Date: 2026-05-01_

catalog pass 23 applied `origin: universal` to **242 EdgeKinds** in `schema/ontology-schema.yaml`
(high+medium-confidence universals; 2 of those were already tagged so 240 new
tags were written, 0 not-found). **8 low-confidence EdgeKinds** were deferred
to a future pass for individual review (see the plan task's `deferredItems`).

Scope: ontology only — schema/ontology-schema.yaml. The Markdown narrative for
individual edges is unchanged in this pass; the canonical machine-readable
origin tags now live alongside each EdgeKind in the YAML.

## catalog pass 23 — Orphan-fix new incoming edges

_Date: 2026-05-01_

catalog pass 23 added **12 new EdgeKinds** (plus their inverses, so 24 entries total in
`schema/ontology-schema.yaml`) to give graph parents to previously-orphan
NodeKinds. See plan task `01KQJMCJGP576WADQY1634B61F` (w23-plan) and review
task `01KQJMGD6448WXDCY0WN7HX3EB` (w23-review). 2 of the 12 are flagged-but-kept
(see notes below).

Note: the plan referenced "Harness" and "Workflow" as source NodeKinds. atlas
does not have a first-class `Harness` NodeKind; the closest analog is
`AgentRuntimeImpl` (the concrete runtime that drives an agent). Likewise
`Workflow` is realized as `WorkflowDefinition`. Both substitutions are recorded
in the YAML edge descriptions.

| Edge | Description | Source | Target | Cardinality | Inverse |
|---|---|---|---|---|---|
| `uses_async_job` | Run uses an AsyncJob primitive (batch / scheduled / webhook callback / streaming completion) | `Run` | `AsyncJob` | N:N | `async_job_used_by` |
| `defines_automation_rule` | AgentProduct defines an AutomationRule (timer/webhook reactor) | `AgentProduct` | `AutomationRule` | 1:N | `automation_rule_defined_by` |
| `has_preflight` | Run is gated by a DispatchPreflight validation pass | `Run` | `DispatchPreflight` | N:1 | `preflight_for` |
| `enforces_invariant` | AgentRuntimeImpl (Harness-analog) enforces a FilesystemSafetyInvariant **(flagged: also a candidate Sandbox/SafetyPolicy ownership)** | `AgentRuntimeImpl` | `FilesystemSafetyInvariant` | N:N | `invariant_enforced_by` |
| `installed_via` | AgentVersion is installed via one or more InstallMethods **(flagged: dual representation with `AgentVersion.installMethods` attribute)** | `AgentVersion` | `InstallMethod` | N:N | `install_method_for` |
| `has_launch_contract` | AgentRuntimeImpl (Harness-analog) declares its LaunchContract spawn shape | `AgentRuntimeImpl` | `LaunchContract` | N:1 | `launch_contract_for` |
| `uses_merge_policy` | HookSurface uses a MergePolicy (hooks-mux conflict-resolution) | `HookSurface` | `MergePolicy` | N:1 | `merge_policy_used_by` |
| `exposes_intervention_point` | Phase exposes one or more OperatorInterventionPoints | `Phase` | `OperatorInterventionPoint` | N:N | `intervention_point_exposed_by` |
| `has_transition` | Phase declares an outgoing PhaseTransition | `Phase` | `PhaseTransition` | 1:N | `transition_of` |
| `performs_reconciliation` | Run performs a Reconciliation pass | `Run` | `Reconciliation` | 1:N | `reconciliation_performed_by` |
| `issues_resume_token` | Run issues a ResumeToken for asynchronous resumption | `Run` | `ResumeToken` | 1:N | `resume_token_issued_by` |
| `applies_secret_policy` | WorkflowDefinition (Workflow-analog) applies a SecretHandlingPolicy | `WorkflowDefinition` | `SecretHandlingPolicy` | N:N | `secret_policy_applied_by` |

Inverse edges (`async_job_used_by`, `automation_rule_defined_by`, `preflight_for`,
`invariant_enforced_by`, `install_method_for`, `launch_contract_for`,
`merge_policy_used_by`, `intervention_point_exposed_by`, `transition_of`,
`reconciliation_performed_by`, `resume_token_issued_by`, `secret_policy_applied_by`)
are declared symmetrically in the YAML for query ergonomics.

Scope: ontology only — `schema/ontology-schema.yaml` and this parity table.
NodeKind `incomingEdges`/`outgoingEdges` lists were updated on both endpoints
of each new edge.

## catalog pass 25 — Meta-shape registry (catalog describes its own meta-shape)

catalog pass 25 introduces the meta-shape registry under cluster 15: five new
NodeKinds (`MetaCluster`, `MetaNodeKind`, `MetaEdgeKind`, `MetaAttribute`,
`MetaEnum`) plus the edges that wire them together. `OntologySchema` is
upgraded from stub to a meta-cluster registry root via the new
`defines_meta_cluster` edge.

| Edge | Description | Source | Target | Cardinality | Inverse |
|---|---|---|---|---|---|
| `contains_meta_node_kind` | A meta-cluster groups one or more `MetaNodeKind` records | `MetaCluster` | `MetaNodeKind` | N:N | `in_cluster` |
| `in_cluster` | A `MetaNodeKind` belongs to a `MetaCluster` | `MetaNodeKind` | `MetaCluster` | N:1 | `contains_meta_node_kind` |
| `contains_meta_edge_kind` | A meta-cluster groups one or more `MetaEdgeKind` records | `MetaCluster` | `MetaEdgeKind` | N:N | `in_meta_cluster` |
| `in_meta_cluster` | A `MetaEdgeKind` belongs to a `MetaCluster` | `MetaEdgeKind` | `MetaCluster` | N:1 | `contains_meta_edge_kind` |
| `contains_meta_attribute` | A `MetaNodeKind` contains a `MetaAttribute` | `MetaNodeKind` | `MetaAttribute` | N:N | `defined_on` |
| `defined_on` | A `MetaAttribute` is defined on a `MetaNodeKind` | `MetaAttribute` | `MetaNodeKind` | N:1 | `contains_meta_attribute` |
| `has_outgoing_edge` | A `MetaNodeKind` has a `MetaEdgeKind` as an outgoing edge | `MetaNodeKind` | `MetaEdgeKind` | N:N | `source_of_meta_edge` |
| `has_incoming_edge` | A `MetaNodeKind` has a `MetaEdgeKind` as an incoming edge | `MetaNodeKind` | `MetaEdgeKind` | N:N | `target_of_meta_edge` |
| `source_of_meta_edge` | A `MetaEdgeKind` has a `MetaNodeKind` as a source | `MetaEdgeKind` | `MetaNodeKind` | N:N | `has_outgoing_edge` |
| `target_of_meta_edge` | A `MetaEdgeKind` has a `MetaNodeKind` as a target | `MetaEdgeKind` | `MetaNodeKind` | N:N | `has_incoming_edge` |
| `inverse_of` | A `MetaEdgeKind` names its inverse `MetaEdgeKind` (symmetric) | `MetaEdgeKind` | `MetaEdgeKind` | N:1 | `inverse_of` |
| `used_on_attribute` | A `MetaEnum` is used as the value-set for one or more `MetaAttribute`s | `MetaEnum` | `MetaAttribute` | N:N | `enum_value_for` |
| `enum_value_for` | A `MetaAttribute` draws its values from a `MetaEnum` | `MetaAttribute` | `MetaEnum` | N:1 | `used_on_attribute` |
| `has_example` | A `MetaNodeKind` references an existing example demonstrating the underlying NodeKind | `MetaNodeKind` | `MetaNodeKind` \| `MetaEdgeKind` \| `MetaCluster` \| `MetaAttribute` \| `MetaEnum` | N:N | — |
| `defines_meta_cluster` | An `OntologySchema` defines (registers) a `MetaCluster` as part of its meta-shape | `OntologySchema` | `MetaCluster` | 1:N | — |

All edges carry `origin: universal`. Scope: ontology only.

## catalog pass 26 cross-cluster integration edges

catalog pass 26 adds **14 new EdgeKinds** (plus their inverses, 28 entries total in YAML)
that bridge newer clusters (Platform / observability-pipeline / vcs-ci /
compliance-safety / context-engineering / cost-quota / catalog-meta /
agent-stack additions / issue-tracker) with the existing core clusters
(agent-stack, lifecycle, role-ontology, evaluation). Two existing edges were
also widened (`exports_to`, `provides_cost_for`) rather than adding parallel
new names.

| Edge | Source | Target | Cardinality | Inverse | Rationale |
|---|---|---|---|---|---|
| `emits_signals_to` | `AgentRuntimeImpl` \| `AgentPlatformImpl` \| `PlatformService` | `ObservabilityBackend` | N:N | `receives_signals_from` | Runtime/platform-level telemetry pipe (distinct from per-span `Span.exports_to`). |
| `versioned_via` | `AgentVersion` \| `Workspace` \| `WorkflowDefinition` | `VCSHost` | N:1 | `versions` | Definitional artifact anchored to a VCS host (distinct from per-change `PullRequest.hosted_on_vcs`). |
| `triggered_by` | `Run` | `CIWorkflow` \| `PullRequest` \| `Issue` | N:1 | `triggers_run` | External event source spawns a Run (distinct from `triggered_by_endpoint` which targets `OperationalTrigger`). |
| `complies_with` | `AgentVersion` \| `Run` \| `Tenant` | `ComplianceFramework` | N:N | `compliance_for` | Operational compliance binding (distinct from `Claim.conforms_to` which is an attestation, and `governed_by` which targets state machines). |
| `owns_workspace` | `Tenant` | `Workspace` | 1:N | `workspace_owned_by` | Multi-tenant ownership of project context. |
| `records_usage` | `Run` \| `RunAttempt` \| `Invocation` | `UsageRecord` | 1:N | `usage_recorded_for` | Usage attribution at the unit-of-work level (`UsageRecord.recorded_against` retains the secondary edge to CostModel/Quota/BudgetPolicy). |
| `uses_template` | `Skill` \| `Subagent` | `PromptTemplate` | N:N | `template_used_by` | Extension-level templating (distinct from runtime-level `AgentVersion.governs_template`). |
| `uses_context_bundle` | `Run` \| `RunAttempt` \| `AgentVersion` | `ContextBundle` | N:N | `context_bundle_used_by` | Context binding for the unit of work. |
| `backed_by_memory` | `ContextBundle` | `MemoryStore` | N:N | `memory_backs_bundle` | Bundle's persistent recall surface. |
| `assesses_policy` | `ToolDescriptor` | `ContentPolicy` | N:N | `policy_assessed_by` | Security/safety tool evaluating content against a policy. |
| `evaluates_policy` | `Benchmark` | `ContentPolicy` | N:N | `policy_evaluated_by` | Safety benchmark targeting a specific policy (distinct from generic `Benchmark.targets`). |
| `escalates_to` | `HumanCheckpoint` | `Role` | N:N | `escalation_target_for` | Responsible role for the checkpoint (e.g. on-call-engineer, approver). |
| `notifies_via` | `HumanCheckpoint` | `Channel` | N:N | `notifies_checkpoint` | Notification mechanism (Slack / email / SMS / webhook / desktop-notification). |
| `scoped_to_tenant` | `Run` \| `Session` | `Tenant` | N:1 | `scopes_runs` | Multi-tenant attribution at the unit-of-work level (distinct from `owns_workspace` which is durable). |

All catalog pass 26 edges carry `origin: universal`.

### catalog pass 26 widenings

Two existing edges were widened to absorb candidate catalog pass 26 edges that would
otherwise have been parallel-named:

- `exports_to` — sources widened from `[Span]` to `[Span, AgentRuntimeImpl, AgentPlatformImpl, PlatformService]`. Allows runtime-level export bindings without a separate edge name. Inverse `ingests_from` widened symmetrically.
- `provides_cost_for` — targets widened from `[Provider, ModelVersion]` to `[Provider, ModelVersion, AgentVersion]`. Allows per-AgentVersion cost specs. Inverse `priced_by` widened symmetrically.

Inverse symmetry: every new EdgeKind is declared symmetrically in the YAML
(`emits_signals_to` / `receives_signals_from`, etc.) for query ergonomics.
NodeKind `incomingEdges` / `outgoingEdges` lists were updated on both endpoints
of each new edge.

Scope: ontology only — `schema/ontology-schema.yaml` and this parity table.
Trust Chain out of scope.

## catalog pass 33 planning-and-board edges

catalog pass 33 makes the planning/board NodeKinds introduced in catalog pass 32 (`Project`,
`BoardSnapshot`, `BoardColumn`, `BacklogSnapshot`, `AcceptanceCriterion`,
`IssueDecomposition`, `SessionFlowProjection`, `FileAttention`, `DevicePair`)
graph-traversable rather than FK-by-attribute. The catalog pass 32 NodeKinds shipped
with empty `incomingEdges` / `outgoingEdges` lists and FK-shaped attributes
(e.g. `BoardSnapshot.projectId`, `BoardSnapshot.columnIds`,
`AcceptanceCriterion.issueId`, `IssueDecomposition.parentIssueId`,
`IssueDecomposition.childIssueIds`, `SessionFlowProjection.sessionId`,
`FileAttention.sessionId`); catalog pass 33 adds 11 EdgeKind pairs (22 entries in YAML)
that mirror those FKs as first-class graph edges.

| Edge | Source | Target | Cardinality | Inverse | Rationale |
|---|---|---|---|---|---|
| `belongs_to_project` | `Issue` | `Project` | N:1 | `groups_issue` | Replaces `Issue.projectId` traversal — issues roll up under a project. |
| `groups_workspace` | `Project` | `Workspace` | 1:N | `workspace_in_project` | A project may map to one or more workspaces (primary, mirrors, gateway/ui split). |
| `has_column` | `BoardSnapshot` | `BoardColumn` | 1:N | `column_of` | Replaces `BoardSnapshot.columnIds` list. |
| `snapshots_project` | `BoardSnapshot` | `Project` | N:1 | `has_board_snapshot` | A project accumulates board snapshots over time. |
| `snapshots_project_backlog` | `BacklogSnapshot` | `Project` | N:1 | `has_backlog_snapshot` | Backlog-side equivalent (named-distinct so a project's two snapshot streams stay traversable independently). |
| `has_acceptance_criterion` | `Issue` | `AcceptanceCriterion` | 1:N | `criterion_of_issue` | Replaces `AcceptanceCriterion.issueId`. |
| `decomposes_into` | `Issue` | `IssueDecomposition` | 1:1 | `decomposition_of` | A parent issue points to its decomposition record (replaces `IssueDecomposition.parentIssueId`). |
| `child_issue_of_decomposition` | `Issue` | `IssueDecomposition` | N:1 | `has_child_issue` | A child issue belongs to one decomposition (replaces `IssueDecomposition.childIssueIds` list). |
| `projects_session` | `SessionFlowProjection` | `Session` | N:1 | `has_flow_projection` | Replaces `SessionFlowProjection.sessionId`. |
| `recorded_attention` | `Session` | `FileAttention` | 1:N | `attention_recorded_in` | Replaces `FileAttention.sessionId`. (`FileAttention` records a path string; atlas has no `File` NodeKind — this is the only edge needed.) |
| `paired_to` | `DevicePair` | `AgentVersion` | N:1 | `has_device_pair` | A paired mobile/desktop device is bound to a specific remote-control AgentVersion (e.g. `agent-mux` mobile ↔ `agent-mux-remote`). |
| `has_lane` | `SessionFlowProjection` | `AgentFlowLane` | 1:N | `lane_of_projection` | catalog pass 39 — replaces inline lanes attribute on `SessionFlowProjection`. |
| `contains_segment` | `AgentFlowLane` | `AgentFlowSegment` | 1:N | `segment_in_lane` | catalog pass 39 — replaces inline segments attribute. |
| `projects_span` | `AgentFlowSegment` | `Span` | N:1 | `projected_by_segment` | catalog pass 39 — observability bridge from a flow segment to its underlying tracing Span. |

All catalog pass 33 edges carry `origin: universal` except `paired_to` /
`has_device_pair`, which are `origin: derived` (DevicePair / agent-mux-style
remote-control surfaces are vendor-specific).

`incomingEdges` / `outgoingEdges` lists were updated on both endpoints of each
new edge — the 9 catalog pass 32 NodeKinds and the four cross-cluster targets they
reference (`Issue`, `Workspace`, `Session`, `AgentVersion`).

The FK-by-attribute attributes on the catalog pass 32 NodeKinds are retained for now
(unchanged); the new edges are the canonical graph-traversal representation
going forward.

## catalog pass 47 — ChildSession / Plugin-bundling edges

catalog pass 47 adds 14 new edges (7 forward + 7 inverse pairs, with one shared
inverse) to support `ChildSession` as a first-class NodeKind and to
clarify Plugin → bundled-extension relationships.

| Edge | Source | Target | Cardinality | Inverse | Rationale |
|---|---|---|---|---|---|
| `parent_session` | `ChildSession` | `Session` | N:1 | `has_child_session` | A ChildSession descends from one parent runtime Session. |
| `has_child_session` | `Session` | `ChildSession` | 1:N | `parent_session` | Inverse — Session enumerates its spawned ChildSessions. |
| `runs_subagent` | `ChildSession` | `Subagent` | N:1 | `dispatched_to_child_session` | The dispatched Subagent that runs in this child session. |
| `dispatched_to_child_session` | `Subagent` | `ChildSession` | 1:N | `runs_subagent` | Inverse — Subagent enumerates its dispatch instances. |
| `runs_skill` | `ChildSession` | `Skill` | N:1 | `executed_in_child_session` | The Skill executed in this child session. |
| `executed_in_child_session` | `Skill` | `ChildSession` | 1:N | `runs_skill` | Inverse. |
| `invoking_tool` | `ChildSession` | `ToolDescriptor` | N:1 | `triggers_child_session` | The ToolDescriptor that triggered the spawn (e.g. claude-code's Task tool). |
| `triggers_child_session` | `ToolDescriptor` | `ChildSession` | 1:N | `invoking_tool` | Inverse. |
| `dispatched_via_tool` | `Subagent` | `ToolDescriptor` | N:1 | `dispatches_subagent` | A Subagent is dispatched via a specific named tool (e.g. claude-code's `Task` tool). |
| `dispatches_subagent` | `ToolDescriptor` | `Subagent` | 1:N | `dispatched_via_tool` | Inverse. |

All catalog pass 47 edges carry `origin: universal`.

## catalog pass 49 — Run / RunAttempt / LiveSession / Session boundary edges

catalog pass 49 replaces FK-by-attribute (`RunAttempt.runId`,
`LiveSession.sessionId`) with explicit graph edges, following the
catalog pass 37 clean-break and catalog pass 39 FK-removal precedents. The
`has_live_session` / `driven_by_run_attempt` pair already existed from
catalog pass 18 and is reused for the RunAttempt <-> LiveSession direction.

| Edge | Source | Target | Cardinality | Inverse | Rationale |
|---|---|---|---|---|---|
| `attempt_of` | `RunAttempt` | `Run` | N:1 | `has_attempt` | A RunAttempt is one attempt within its parent Run (replaces FK). |
| `has_attempt` | `Run` | `RunAttempt` | 1:N | `attempt_of` | Inverse — Run enumerates its attempts. |
| `shadows_session` | `LiveSession` | `Session` | N:1 | `has_live_session_shadow` | A LiveSession shadows the durable Session it observes (replaces FK). |
| `has_live_session_shadow` | `Session` | `LiveSession` | 1:N | `shadows_session` | Inverse — Session enumerates LiveSession shadows. |

All catalog pass 49 edges carry `origin: universal`.

## catalog pass 50 — Plugin edge consolidation (clean break)

Per catalog pass 37 clean-break policy, the catalog pass 47 `bundles_*` family duplicated the
older `contains_*` family. The four catalog pass 47 edges (`bundles_subagent`,
`bundles_skill`, `bundles_tool_descriptor`, and the shared inverse
`bundled_in_plugin`) are deleted. `contains_tool_descriptor` is added (the
gap that justified catalog pass 47's `bundles_tool_descriptor`) so the canonical
family covers the full set of bundled extension kinds.

| Edge | Source | Target | Cardinality | Inverse | Rationale |
|---|---|---|---|---|---|
| `contains_tool_descriptor` | `Plugin` | `ToolDescriptor` | 1:N | `tool_descriptor_contained_in_plugin` | Plugin contains a ToolDescriptor (catalog pass 50 — fills the only `contains_*` gap left after catalog pass 22). |
| `tool_descriptor_contained_in_plugin` | `ToolDescriptor` | `Plugin` | N:1 | `contains_tool_descriptor` | Inverse. |

All catalog pass 50 edges carry `origin: universal`.

## catalog pass 52 — Kanban TaskTag / Label / ActivityEntry / IssueDispatchState edges

catalog pass 52 introduces edges binding the four new kanban NodeKinds
(`TaskTag`, `Label`, `ActivityEntry`, `IssueDispatchState`) to existing
catalog entities (`Issue`, `Project`, `Workspace`, `OrgUnit`,
`BoardSnapshot`, `RunAttempt`).

| Edge | Source | Target | Cardinality | Inverse | Rationale |
|---|---|---|---|---|---|
| `tagged_with` | `Issue` | `TaskTag` | N:N | `tags_issue` | An Issue carries free-form TaskTags. |
| `tags_issue` | `TaskTag` | `Issue` | N:N | `tagged_with` | Inverse. |
| `labeled_with` | `Issue` | `Label` | N:N | `labels_issue` | An Issue carries one or more Labels. |
| `labels_issue` | `Label` | `Issue` | N:N | `labeled_with` | Inverse. |
| `scoped_to_team` | `TaskTag` | `OrgUnit` | N:1 | `scopes_task_tag` | TaskTag with `scope=team`. |
| `scoped_to_project` | `TaskTag` | `Project` | N:1 | `scopes_task_tag_project` | TaskTag with `scope=project`. |
| `scoped_to_workspace` | `TaskTag` | `Workspace` | N:1 | `scopes_task_tag_workspace` | TaskTag with `scope=workspace`. |
| `scopes_task_tag` | `OrgUnit` | `TaskTag` | 1:N | `scoped_to_team` | Inverse. |
| `scopes_task_tag_project` | `Project` | `TaskTag` | 1:N | `scoped_to_project` | Inverse. |
| `scopes_task_tag_workspace` | `Workspace` | `TaskTag` | 1:N | `scoped_to_workspace` | Inverse. |
| `owned_by_project` | `Label` | `Project` | N:1 | `owns_label` | Label is owned by a Project. |
| `owns_label` | `Project` | `Label` | 1:N | `owned_by_project` | Inverse. |
| `activity_for_issue` | `ActivityEntry` | `Issue` | N:1 | `has_activity_entry` | ActivityEntry records action against an Issue. |
| `activity_for_project` | `ActivityEntry` | `Project` | N:1 | `has_activity_entry` | ActivityEntry records action against a Project. |
| `activity_for_workspace` | `ActivityEntry` | `Workspace` | N:1 | `has_activity_entry` | ActivityEntry records action against a Workspace. |
| `activity_for_board_snapshot` | `ActivityEntry` | `BoardSnapshot` | N:1 | `has_activity_entry` | ActivityEntry records action against a BoardSnapshot. |
| `has_activity_entry` | `Issue` / `Project` / `Workspace` / `BoardSnapshot` | `ActivityEntry` | 1:N | `activity_for_*` | Shared inverse for the activity-feed family. |
| `dispatch_state_of_issue` | `IssueDispatchState` | `Issue` | 1:1 | `has_dispatch_state` | IssueDispatchState attaches to its parent Issue. |
| `has_dispatch_state` | `Issue` | `IssueDispatchState` | 1:1 | `dispatch_state_of_issue` | Inverse. |
| `dispatched_as_run_attempt` | `IssueDispatchState` | `RunAttempt` | N:1 | `dispatch_origin` | Currently dispatched RunAttempt for the Issue. |
| `dispatch_origin` | `RunAttempt` | `IssueDispatchState` | 1:N | `dispatched_as_run_attempt` | Inverse. |

All catalog pass 52 edges carry `origin: derived` except the four core
TaskTag/Label edges (`tagged_with`, `tags_issue`, `labeled_with`,
`labels_issue`) which are `origin: universal` (parallels GitHub /
GitLab / Linear vocabulary).

