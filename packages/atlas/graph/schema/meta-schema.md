# 01 — Meta-Schema

The schema for the schema. What primitives the ontology is built from.

## Primitives

The ontology has three primitive kinds:

| Primitive | What it is |
|---|---|
| **NodeKind** | a class of entity (e.g., `AgentVersion`, `Skill`, `Term`) |
| **EdgeKind** | a class of relationship (e.g., `has_version`, `applies_to`) |
| **AttributeType** | a primitive value type (string, semver, enum, etc.) |

A populated **graph** consists of nodes (each typed by a NodeKind), edges (each typed by an EdgeKind), and the attribute values on them — every claim of fact backed by an EvidenceSource.

## NodeKind

A NodeKind declares:

- `id` — schema-internal slug (e.g. `node:agent-version`)
- `name` — canonical PascalCase name (e.g. `AgentVersion`)
- `origin` — **required** — `standard` | `universal` | `a5c` | `derived`. Classifies the NodeKind itself: `standard` = concept canonical across multiple component implementations or industry standards adopted by many vendors (e.g. MCP, ModelTransportProtocol entries, AgentHostTransport modes, OAuth/MCP-Authorization); `universal` = documented for one specific component / cross-vendor industry concept (e.g. AgentCore/Runtime/Platform 3-tier model, has_version, applies_to); `a5c` = specific to the a5c product/codebase (Effect, Blueprint, AutomationRule, RunJournalEvent, Gap, Mux-family naming, etc.); `derived` = synthesized/derived from observation across vendors and not (yet) ratified into a formal standard (e.g. SKILL.md frontmatter conventions); `derived` requires connected evidence via `originContext`/`originDate`/`evidenceRefs`. NodeKinds that span pick the dominant origin and note the overload in `purpose`. Enforced by **V-1.9**; `derived` evidence requirement enforced by **V-1.12** (current). (current redefined this taxonomy: `standardized` → `standard`, `convergent` → `derived`.)
- `originDate` — **optional** — `iso-date`. The date this concept was first introduced (in the spec / vendor doc / our codebase). Editorial provenance: pin a release date, RFC publication date, or commit date when known.
- `originContext` — **optional** — `string`. The spec / RFC / blog post / commit / vendor doc that introduced the concept (e.g. `"MCP spec 2024-11-05"`, `"Anthropic Claude Code Subagents docs"`, `"Babysitter SDK"`). A short human-readable citation; full URLs may be carried via a paired `EvidenceSource` when needed.
- `cluster` — editorial cluster (single membership) — used for the bulk of NodeKinds that live in exactly one cluster.
- `clusters` — `list<string>` — editorial multi-cluster membership. Used for the small set of NodeKinds that legitimately span clusters (e.g. `Subagent` lives in both `7-extensions` and `3-agent-stack`; `ToolDescriptor` in `7-extensions` and `5-channels-hooks`; `Channel` in `5-communication` and `3-agent-stack`). Exactly one of `cluster` or `clusters` MUST be set; the validator treats `cluster: X` as equivalent to `clusters: [X]`. (Added in the 2026-04-29 remodel — Change H.)
- `purpose` — one sentence
- `attributes` — list of attribute specs (see below)
- `incomingEdges` / `outgoingEdges` — edge-kinds it participates in, with cardinality
- `evidenceRequirements` — which attributes need evidence and at which trust level minimum
- `invariants` — rules referenced from `../schema/validation-rules.md`
- `examples` — pointers to `graph/`

Every NodeKind in `../schema/node-kinds/` is described as both a markdown spec and a YAML record in `schema/ontology-schema.yaml`. The two must agree; the validator checks parity.

## EdgeKind

An EdgeKind declares:

- `id` — schema-internal slug (e.g. `edge:has-version`)
- `name` — canonical snake_case name (e.g. `has_version`)
- `description` — one sentence
- `source` — allowed source NodeKinds (one or many)
- `target` — allowed target NodeKinds (one or many)
- `cardinality` — `1:1`, `1:N`, `N:1`, `N:N` from source's perspective
- `attributes` — edges may carry attributes (e.g., a `holds_responsibility` edge can carry a `weight`)
- `inverse` — optional inverse edge name (e.g., `version_of` is the inverse of `has_version`)
- `aliasOf` — optional canonical edge-kind name. When present, this EdgeKind is an ergonomic alias of the named canonical edge; the two are interchangeable in examples and the validator MUST resolve aliases to their canonical edge when checking source/target/cardinality constraints (see `../schema/validation-rules.md` rule **V-3.5**). Aliasing is single-hop: an alias MUST point at a canonical edge, never at another alias. Formalized in the 2026-04-29 remodel — Change D.
- `origin` — **required** — `standard` | `universal` | `a5c` | `derived`. Classifies the EdgeKind itself, mirroring the NodeKind `origin` semantics: `standard` = concept canonical across multiple component implementations or industry standards (e.g. MCP-named `exposes_resource` / `exposes_prompt`, OTel `spans`); `universal` = applies to the agentic stack at large for one component / cross-vendor (e.g. `has_version`, `transitions_to`, `applies_to`); `a5c` = specific to the a5c product/codebase (e.g. babysitter run/effect predicates); `derived` = synthesized / cross-vendor consensus not yet ratified (e.g. `uses_checkpoint`); `derived` requires connected evidence (originContext/originDate/evidenceRefs). EdgeKinds that span pick the dominant origin and note the overload in `description`. Enforced by **V-1.9** (extended); `derived` evidence requirement enforced by **V-1.12** (current). (current redefined this taxonomy: `standardized` → `standard`, `convergent` → `derived`.)
- `originDate` — **optional** — `iso-date`. The date this relation was first introduced (in the spec / vendor doc / our codebase). Editorial provenance; mirrors NodeKind.originDate.
- `originContext` — **optional** — `string`. The spec / RFC / blog post / commit / vendor doc that introduced the relation; mirrors NodeKind.originContext.

All edge kinds live in `../schema/edge-kinds.md`.

## AttributeType

The primitive types attributes can hold:

| Type | Example |
|---|---|
| `string` | `"Claude Code"` |
| `slug` | `"claude-code"` (lowercase, hyphenated, no spaces) |
| `id` | `"agent:claude-code"` (a `<kind-prefix>:<slug>` reference) |
| `semver` | `"1.2.3"` |
| `versionRange` | `">=1.0.0 <2.0.0"` |
| `iso-date` | `"2026-04-29"` |
| `iso-timestamp` | `"2026-04-29T12:00:00Z"` |
| `url` | `"https://docs.anthropic.com/..."` |
| `enum<...>` | one of declared values |
| `bool` | `true` / `false` |
| `int` | integer |
| `float` | float |
| `tokens` | non-negative integer (token count) |
| `cost-per-million-tokens` | float, USD by default |
| `markdown` | a string containing markdown |
| `code` | a string containing code, with `language` annotation |
| `list<T>` | ordered list of T |
| `set<T>` | unordered unique set of T |
| `map<K,V>` | key-value map |
| `ref<NodeKind>` | typed reference to another node by its `id` |
| `evidence-bound<T>` | a value of type T that requires an EvidenceSource |

All types are defined in `schema/attribute-types.yaml`.

## Attribute spec

Each attribute on a NodeKind declares:

```yaml
- name: displayName
  type: string
  required: true
  description: human-readable name
- name: versionRange
  type: versionRange
  required: true
  evidence: vendor-doc-or-better      # optional; otherwise no evidence required
  description: semver range over which the claims hold
- name: thinkingEffortLevels
  type: list<enum<low,medium,high,max>>
  required: false
  evidence: vendor-doc-or-better
  description: discrete reasoning levels supported
```

Evidence levels referenced here come from `../schema/evidence-model.md`.

## Identity

A node has an `id` of the form `<kind-prefix>:<slug>`:

```
agent:claude-code
agent-version:claude-code@1.x
model:claude-opus-4-7@current
provider:anthropic
term:invocation
skill:react-tdd
mcp-server:github-issues
benchmark:swe-bench
role:code-reviewer
language:typescript
framework:react
```

The `<kind-prefix>` is declared per NodeKind. Every NodeKind has exactly one prefix.

The slug is lower-kebab-case and stable. Renames go through deprecation: a new node is created and a `replaces` edge is drawn from new to old; the old node carries `deprecatedAt` and `replacedBy` and remains queryable until removed in a major schema bump.

### Version-qualified ids

Version-qualified entities — `AgentVersion`, `ModelVersion`, and `ModelProviderVersion` — MUST use the form `<prefix>:<product-slug>@<version-spec>`. The `<version-spec>` is typically:

- a major-version range (`1.x`, `2.x`),
- a specific version (`1.2.3`, `2026-01-15`), or
- a named ref (`current`, `next`, `latest`).

Examples (canonical):

```
agent-version:claude-code@1.x
agent-version:codex@1.x
model:claude-opus-4-7@1.x
catalog-version:agent-catalog@2026-04
```

Bare `<prefix-version>:<slug>` ids without an `@<version-spec>` (e.g. `agent-version:codex`) are **invalid**. If they appear in legacy data they SHOULD be interpreted as references to the most recent canonical version of that product, and linters MUST flag them for migration. See `../schema/validation-rules.md` rule **V-1.8**.

## Evidence binding (preview)

An attribute marked `evidence: <level>` is evidence-bound and must reach the
declared trust floor. **Two paths satisfy the binding** (current remodel):

1. **Direct** — supply `evidenceSourceIds: list<ref<EvidenceSource>>` on the
   bearer of the fact (either as a NodeKind attribute or, on edges that
   declare it, as an edge attribute). This is the default. Every NodeKind
   whose attributes carry evidence-bound values may also carry
   `evidenceSourceIds` as an explicit optional attribute formalizing the
   direct-reference pattern that examples already use.
2. **Reified `Claim`** — mint a `Claim` node referencing the subject,
   attribute, value, and `EvidenceSource`s. Use this **only** when the fact
   is disputed, time-banded, or has been superseded.

The full bifurcation rule and the `Claim` / `EvidenceSource` model live in
[`../schema/evidence-model.md`](../schema/evidence-model.md).

A node attribute without evidence binding can still be claimed; it's just not gated. Examples: `displayName` (descriptive) typically doesn't need evidence; `supportsThinking` (factual, vendor-driven) typically does.

## Validity

A graph is **valid** when:

- Every node has a NodeKind from the schema
- Every edge has an EdgeKind from the schema and connects allowed source/target NodeKinds within declared cardinality
- Every required attribute has a value
- Every evidence-bound attribute has a Claim with at least one EvidenceSource at the required trust level, within the freshness window
- Every invariant in `../schema/validation-rules.md` passes

Validators run in CI; broken graphs do not merge.

## Version-tracking pattern

Some entities in the catalog have a **Concept / Version split** — a long-lived umbrella node plus one node per released version with full lineage:

| Concept NodeKind | Version NodeKind |
|---|---|
| `AgentProduct` | `AgentVersion` |
| `ModelFamily` | `ModelVersion` |
| `ModelProvider` | `ModelProviderVersion` |

The split is **reserved** for entities with frequent versioned releases that downstream catalog consumers query by version: agents, models, providers, and the catalog itself. These are first-class long-lived products with public lineage; their version history is itself catalog data.

**All other content kinds** — `Skill`, `Subagent`, `Plugin`, `ToolServer` — track versioning *on the entity itself*, with three optional attributes (remodel 2026-04-29 — change B):

| Attribute | Type | Purpose |
|---|---|---|
| `version` | semver | The current canonical version of this entity. |
| `releasedAt` | iso-date | When the current version was released. |
| `supersededBy` | ref<self> | When the entity has been deprecated in favor of another entity (rename, fork, replacement), points to the replacement. |

Rationale: most user-installable extension content is single-version-at-a-time per source — an installed `Skill` is whichever revision the source manifest currently resolves to, not a node-per-revision. Older revisions are recoverable from the source's own history (`SourceRef`), not from the catalog graph. Splitting `Skill` / `Subagent` / `Plugin` / `ToolServer` into Concept + Version would multiply node counts without giving consumers any query they cannot answer through the source manifest.

If a Skill / Subagent / Plugin / ToolServer is genuinely retired and replaced by a different entity (different `id`), draw a `supersededBy` ref from the old to the new and (optionally) set `deprecatedAt` on the old.

## Partial node representation (partial-node)

A graph instance node may be declared in multiple files. Two flavors:

1. **Merge mode** — multiple full declarations of the same `(nodeKind, id)` are merged. Edges concatenate (de-duplicated by `target`); scalar attributes MUST agree across files (else fail V-1.14); list attributes concatenate (de-duplicated); map attributes deep-merge with no overlapping keys; `displayName` / `description` follow first-non-empty-wins. Used when a node has many edges that naturally split (e.g. by source-cluster).

2. **Sidecar mode** — files starting with the `extendsNode:` envelope add edges to a previously-declared canonical node. Sidecars cannot redefine attributes (V-1.13). Useful for cross-cluster wiring without owning the canonical node.

   Sidecar file shape:

   ```yaml
   extendsNode:
     id: foo:bar
     nodeKind: Foo
   edges:
     some_edge:
       - target: baz:qux
   ```

   The loader merges sidecars into the canonical node in file-name-sorted order. Multiple sidecars per node are allowed. If a sidecar references an `id` with no canonical declaration, the validator fails with `extendsNode references undefined id` (V-1.13).

File naming: prefer suffixing sidecars with `-sidecar.yaml` or organizing under a `<canonical-base-dir>/sidecar/` subdir (convention, not enforced).

File-size soft warn (V-13.5): the validator emits an informational `largeFiles:` entry for any YAML file under `graph/` exceeding 30 KB or 800 lines. The remediation is to apply this pattern (file split or sidecar).

## How node-kind files relate to the YAML

A node-kind markdown file (e.g. `../schema/node-kinds/agent-stack.md`) is the *human-readable spec*. The YAML in `schema/ontology-schema.yaml` is the *machine-readable spec*. The two are kept in lockstep by the validator, which parses both and reports drift.

If a markdown attribute doesn't appear in YAML, validator fails. If a YAML attribute isn't documented in markdown, validator fails. Authoring is expected to update both in the same change.

## Id-prefix policy

Every NodeKind declares exactly one `prefix:` in `schema/ontology-schema.yaml`,
and every node id MUST carry the form `<prefix>:<slug>` (or `<prefix>:<slug>@<version-spec>`
for version-qualified entities). New prefixes registered in current:

| NodeKind | Prefix | Cluster |
|---|---|---|
| `RunAttempt` | `run-attempt` | lifecycle |
| `LiveSession` | `live-session` | lifecycle |
| `OrchestratorState` | `orchestrator-state` | lifecycle |
| `DispatchPreflight` | `dispatch-preflight` | lifecycle |
| `Reconciliation` | `reconciliation` | lifecycle |
| `WorkflowDefinition` | `workflow` | agent-stack |
| `LaunchContract` | `launch-contract` | agent-stack |
| `ErrorCategory` | `error-category` | lifecycle |
| `FailureClass` | `failure-class` | lifecycle |
| `RecoveryStrategy` | `recovery-strategy` | lifecycle |
| `PartialStateRecovery` | `partial-state-recovery` | lifecycle |
| `OperatorInterventionPoint` | `operator-intervention` | lifecycle |
| `RuntimeSnapshot` | `runtime-snapshot` | channels-hooks |
| `Dashboard` | `dashboard` | channels-hooks |
| `HTTPServerExtension` | `http-server` | channels-hooks |
| `APIEndpoint` | `api-endpoint` | channels-hooks |
| `OperationalTrigger` | `operational-trigger` | channels-hooks |
| `IssueTracker` | `issue-tracker` | transport |
| `IssueTrackerProtocol` | `issue-tracker-protocol` | transport |
| `Issue` | `issue` | transport |
| `FilesystemSafetyInvariant` | `fs-safety-invariant` | security-descriptors |
| `SecretHandlingPolicy` | `secret-handling` | security-descriptors |
| `HarnessHardening` | `harness-hardening` | security-descriptors |

New prefixes registered in current:

| NodeKind | Prefix | Cluster |
|---|---|---|
| `CostModel` | `cost-model` | cost-quota |
| `Quota` | `quota` | cost-quota |
| `UsageRecord` | `usage-record` | cost-quota |
| `BudgetPolicy` | `budget-policy` | cost-quota |
| `Tenant` | `tenant` | role-ontology |
| `Customer` | `customer` | role-ontology |
| `EndUser` | `end-user` | role-ontology |
| `VendorRelationship` | `vendor-relationship` | role-ontology |
| `ObservabilityBackend` | `observability-backend` | observability-pipeline |
| `Span` | `span` | observability-pipeline |
| `EvalHarness` | `eval-harness` | benchmarks |
| `Judge` | `judge` | benchmarks |
| `Rubric` | `rubric` | benchmarks |
| `VCSHost` | `vcs-host` | vcs-ci |
| `PullRequest` | `pull-request` | vcs-ci |
| `CodeReview` | `code-review` | vcs-ci |
| `CIWorkflow` | `ci-workflow` | vcs-ci |
| `ComplianceFramework` | `compliance-framework` | compliance-safety |
| `Regulator` | `regulator` | compliance-safety |
| `ContentPolicy` | `content-policy` | compliance-safety |
| `JailbreakPattern` | `jailbreak-pattern` | compliance-safety |
| `VectorStore` | `vector-store` | context-engineering |
| `EmbeddingModelProfile` | `embedding-model-profile` | context-engineering |
| `MemoryStore` | `memory-store` | context-engineering |
| `PromptTemplate` | `prompt-template` | context-engineering |
| `ContextBundle` | `context-bundle` | context-engineering |

New prefixes registered for the catalog meta-shape registry (cluster 15):

| NodeKind | Prefix | Cluster |
|---|---|---|
| `MetaNodeKind` | `meta-node-kind` | catalog-provenance |
| `MetaEdgeKind` | `meta-edge-kind` | catalog-provenance |
| `MetaCluster` | `meta-cluster` | catalog-provenance |
| `MetaAttribute` | `meta-attribute` | catalog-provenance |
| `MetaEnum` | `meta-enum` | catalog-provenance |

New prefixes registered for the planning / board surfaces (board-first, issue-first product model surveyed from `packages/agent-mux/webui` and `packages/agent-mux/ui/src/session-flow`):

| NodeKind | Prefix | Cluster |
|---|---|---|
| `Project` | `project` | extensions |
| `BoardSnapshot` | `board-snapshot` | extensions |
| `BoardColumn` | `board-column` | extensions |
| `BacklogSnapshot` | `backlog-snapshot` | extensions |
| `AcceptanceCriterion` | `acceptance-criterion` | extensions |
| `IssueDecomposition` | `issue-decomposition` | extensions |
| `SessionFlowProjection` | `session-flow` | extensions |
| `AgentFlowLane` | `agent-flow-lane` | extensions |
| `AgentFlowSegment` | `agent-flow-segment` | extensions |
| `FileAttention` | `file-attention` | extensions |
| `DevicePair` | `device-pair` | extensions |

New prefixes registered in current (compute-path expansion for capability-support pinning):

| NodeKind | Prefix | Cluster |
|---|---|---|
| `TransportRuntime` | `transport-runtime` | 2-compute-path |
| `ProviderVersion` | `provider-version` | 2-compute-path |

New prefixes registered for the agent-stack 4-layer refinement (AgentUIImpl as 4th layer alongside core / runtime / platform):

| NodeKind | Prefix | Cluster |
|---|---|---|
| `AgentUIImpl` | `agent-ui-impl` | 3-agent-stack |

current prefix registration (ChildSession as first-class lifecycle entity):

| NodeKind | Prefix | Cluster |
|---|---|---|
| `ChildSession` | `child-session` | 6-lifecycle |

current prefix registration (kanban entities extracted from
agent-mux's `packages/agent-mux/core/src/kanban.ts`):

| NodeKind | Prefix | Cluster |
|---|---|---|
| `TaskTag` | `task-tag` | 7-extensions |
| `Label` | `label` | 7-extensions |
| `ActivityEntry` | `activity-entry` | 6-lifecycle |
| `IssueDispatchState` | `issue-dispatch-state` | 6-lifecycle |

Prefixes are stable and reserved. A prefix may not be reused or aliased. The
validator (rule **V-id-prefix-1**) checks that every node `id` matches the
declared prefix of its NodeKind and that no two NodeKinds share a prefix.

## Current-Only Schema Policy

The active graph does not model schema history, build-pass mechanics, or placeholders for future work. Removed or renamed concepts are deleted from current graph data, and incomplete future work is tracked only in process/run carry-over artifacts outside `graph/` until concrete nodes can be authored.
