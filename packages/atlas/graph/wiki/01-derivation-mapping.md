---
id: page:01-derivation-mapping
nodeKind: Page
title: "Wiki Page Type → Graph Query Mapping"
slug: "01-derivation-mapping"
articlePath: "wiki/01-derivation-mapping.md"
documents: []
---
# Wiki Page Type → Graph Query Mapping

> Phase-4 deliverable. One row per page type. Each row is the contract a wiki generator template must satisfy.

`MATCH X` reads as "all nodes of NodeKind `X`". `→ edge_name → Y` reads "follow `edge_name` from each match to nodes of kind `Y`". Multi-hop chains are read left-to-right.

| Page type | URL pattern | Graph query | Notes |
|---|---|---|---|
| Stack overview | `/stack/` | `MATCH Layer ORDER BY position` | One row per Layer, links to per-layer pages. |
| Layer page | `/stack/<layer-id>/` | `MATCH Layer{id=$id}` plus reverse `realizes` edges | Lists layer scope, responsibilities, examples, fit notes, and every node that realizes the layer. |
| Product index | `/products/` | `MATCH AgentProduct ORDER BY displayName` | Card grid. |
| AgentProduct page | `/products/<product-id>/` | `MATCH AgentProduct{id=$id} → has_version → AgentVersion → supports → CapabilitySupport → for → Capability` | Full version timeline, capability matrix per version, evidence trail. |
| AgentVersion page | `/products/<product-id>/<version-id>/` | `MATCH AgentVersion{id=$id}` + outgoing `bound_to ModelVersion`, `realizes Layer`, incoming `version_of` | Per-version detail. |
| Capability index | `/capabilities/` | `MATCH Capability` | Sortable matrix. |
| Capability page | `/capabilities/<cap-id>/` | `MATCH Capability{id=$id} ← for ← CapabilitySupport ← supports ← (AgentVersion or Plugin or ToolDescriptor)` | Inverse traversal: who supports this capability. |
| Capability matrix | `/capabilities/matrix/` | `MATCH CapabilitySupport` joined to `AgentVersion` × `Capability` | 2D grid; cell content is `supportLevel`. |
| Hook taxonomy | `/hooks/` | `MATCH HookFamily → groups → Hook → has_surface → HookSurface` | Tree view. |
| Hook page | `/hooks/<surface-id>/` | `MATCH HookSurface{id=$id}` + incoming `fires_during PhaseTransition` and `fires_inside Invocation` | Lifecycle context. |
| Channel index | `/channels/` | `MATCH ChannelKind → has_channel → Channel` | Grouped by kind. |
| Channel page | `/channels/<channel-id>/` | `MATCH Channel{id=$id}` + `realizes Layer`, transport refs | Wire-protocol detail. |
| Plugin / Extension index | `/extensions/` | `MATCH (Plugin ∪ NativeExtension ∪ PortableExtension)` | Tabbed by kind. |
| Extension page | `/extensions/<ext-id>/` | per node + `provides Capability`, `installs_into AgentProduct` | Includes scaffolding hints. |
| Skill / Subagent / ToolServer pages | `/extensions/<kind>/<id>/` | `MATCH <Kind>{id=$id}` | Content-shape spec page. |
| Lifecycle index | `/lifecycle/` | `MATCH StateMachine` | One row per state machine. |
| State-machine page | `/lifecycle/<sm-id>/` | `MATCH StateMachine{id=$id} → has_state → LifecycleState`, `→ has_transition → PhaseTransition` | Mermaid diagram + state list. |
| Run / Invocation / Session pages | `/lifecycle/<kind>/<id>/` | per node + edges | Concrete instance pages. |
| Domain index | `/domain/` | `MATCH Domain → has_specialization → Specialization → has_topic → Topic` | Tree. |
| Term page (glossary entry) | `/glossary/<term-id>/` | `MATCH Term{id=$id} → has_canonical_definition → Definition` plus `Term{id=$id} ← synonym_of ← Term`, `Term{id=$id} → references → NodeKind` | Definition, synonyms, anchored entities, first-use evidence. |
| Glossary index | `/glossary/` | `MATCH Term ORDER BY displayName` | A–Z list with letter scrubber. |
| Role page | `/roles/<role-id>/` | `MATCH Role{id=$id} → has_responsibility → Responsibility` | `isAgentic` flagged. |
| Benchmark page | `/benchmarks/<bench-id>/` | `MATCH Benchmark{id=$id} ← targets ← EvalRun → produces → EvalResult` | Results matrix sorted by score. |
| Authority page | `/trust/authorities/<auth-id>/` | `MATCH Authority{id=$id} ← claimed_by ← Claim`, `← reviewOwner ← EvidenceSource` | Provenance trail. |
| Evidence dashboard | `/meta/evidence/` | `MATCH EvidenceSource WHERE freshness < window` | Stale-evidence triage view. |
| Gap dashboard | `/meta/gaps/` | `MATCH Gap ORDER BY priority, level, discoveredAt` | Grouped by `status`; opens link to per-gap page. |
| Gap page | `/meta/gaps/<gap-id>/` | `MATCH Gap{id=$id}` + edges (`affects`, `discovered_by`, `closed_by`, `blocks Phase`, `raised_question OpenQuestion`) | Mirrors the markdown form, regenerated from the YAML. |
| CatalogVersion page | `/meta/versions/<semver>/` | `MATCH CatalogVersion{semver=$semver}` | Release notes, added/removed kinds, migration spec. |
| Generator catalog | `/meta/wiki/generators/` | `MATCH Generator → derives → DerivedArtifact` | Lists every page type and which generator owns it. |

Page templates that need data not in this table must add a row here first; templates without a corresponding row fail Phase-5's wiki-coverage check.
