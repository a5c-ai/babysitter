# NodeKinds: Terminology

> Cluster 14 — Terminology. The cluster that makes the glossary derivable from the
> graph. See [`README.md`](./README.md) for the full catalog and
> [`../../schema/meta-schema.md`](../../schema/meta-schema.md) for the standard node-kind file
> shape.

## Purpose

Every concept in atlas prose has a canonical anchor in the graph. `Term` names the
concept; `Definition` carries one (or many context-scoped) definitions; `Synonym`
records cross-vendor or cross-era equivalences without picking a winner; `Acronym`
expands abbreviations; `TermKind` classifies the term so glossary slices are easy
queries.

The cluster exists because two vendors using the same word for different concepts
is the rule, not the exception. The schema records the divergence as data —
separate `Term`s tied by `synonym_of` with `inContext` — instead of forcing a
single definition. Querying `Term`s with `kind=mux` produces the mux glossary;
querying `Term`s used in `Layer` 6 produces the layer-6 glossary; querying
`Term.deprecatedAt is set` produces the deprecation queue.

### The deprecation chain pattern

When a term is renamed or superseded, the schema records the chain rather than
mutating the original:

1. The old `Term` carries `deprecatedAt` (iso-date) and `replacedById` (ref to
   the successor `Term`).
2. The successor's `replaces` edge points back to the deprecated term, giving
   bidirectional traversal.
3. Surviving context-scoped `Definition`s on the old term SHOULD lead with
   `(Deprecated …)`.
4. Cross-rename synonymies are recorded via `Synonym` with `direction: a-to-b`
   from old to new, with `inContext` set to the era or vendor the rename applies
   to.

The chain is queryable: filtering on `Term.deprecatedAt is set AND replacedById
is set` returns the active deprecation queue; following `replacedById` walks any
multi-hop rename history. See the `term:harness` → `term:agent` example below.

---

## NodeKind: `Term`

A named term in the ontology.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `term:<slug>`, e.g. `term:invocation`, `term:run`, `term:agent-platform`. |
| `displayName` | string | yes | The canonical spelling. |
| `kind` | enum<concept,role,layer,primitive,mux,extension-shape,hook,capability,lifecycle-state,protocol,format,tool,operation> | yes | The term-kind classifier. Collapsed from former TermKind NodeKind (remodel 2026-04-29). |
| `canonicalDefinitionId` | ref<`Definition`> | yes | The default definition. |
| `usageContexts` | list<ref<`Domain` \| `Layer` \| NodeKind \| `AgentProduct`>> | no | Where the term is used. |
| `firstUseEvidenceId` | ref<`EvidenceSource`> | no | First-known use citation. |
| `references` | list<ref<NodeKind \| `Capability`>> | no | Schema entities the term anchors to. |
| `deprecatedAt` | iso-date | no | When the term was deprecated. |
| `replacedById` | ref<`Term`> | no | Successor term. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `defined_in_context_of` | `Domain` \| `Layer` \| NodeKind | N:N | Term-context anchoring. |
| `synonym_of` | `Term` | N:N | Carries `inContext`. Symmetric. |
| `subsumes` | `Term` | N:N | Broader/narrower. |
| `replaces` | `Term` | N:1 | Deprecation chain. |
| `references` | NodeKind \| `Capability` | N:N | Anchor to schema entity. |

### Evidence

`firstUseEvidenceId` is the evidence-bound first-use citation. The term's
`displayName` and `kind` are descriptive editorial values; vendor-specific terms
SHOULD carry `firstUseEvidenceId` at **vendor-doc-or-better**.

### Invariants

1. Every `Term` MUST have at least one associated `Definition` (V-6.1).
2. `canonicalDefinitionId` MUST resolve to an existing `Definition` (V-6.2).
3. When `deprecatedAt` is set, `replacedById` SHOULD be set unless the term is
   terminally deprecated (declared explicitly via the standard `deprecatedAt`
   handling in [`../../schema/versioning.md`](../../schema/versioning.md)).
4. Every entity in `references` MUST resolve in the current schema version (V-6.4).

---

## NodeKind: `Definition`

A definition of a `Term`. A term may carry many definitions for different
contexts — e.g., "session" in MCP vs. in agent-mux.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `definition:<slug>`. |
| `termId` | ref<`Term`> | yes | The term this defines. |
| `text` | markdown | yes | The definition text. |
| `inContext` | ref<`Domain` \| `Layer` \| NodeKind> | no | The context this definition applies to. |
| `evidenceSourceIds` | list<ref<`EvidenceSource`>> | no | Optional backing evidence. |
| `authoredAt` | iso-timestamp | yes | When written. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `defines` | `Term` | N:1 | Inverse of "term has definitions". |
| `defined_in_context_of` | `Domain` \| `Layer` \| NodeKind | N:N | Mirrors `inContext`. |

### Evidence

`text` may be backed by `evidenceSourceIds` when sourced from vendor docs.
Catalog-internal definitions are descriptive and gated by the default policy only.

### Invariants

1. `termId` MUST resolve to a known `Term`.
2. Two `Definition`s for the same `termId` MUST NOT share the same `inContext`.

---

## NodeKind: `Synonym` (graph-root: legitimately no parent)

_(graph-root: legitimately no parent — terminology vocabulary entity (paired with `Acronym`) referenced via attributes; catalog pass 23 hygiene 2026-05-01.)_

A term that means the same as another in a stated context. Synonyms are recorded
as graph data so cross-vendor equivalences are auditable.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `synonym:<slug>`. |
| `termAId` | ref<`Term`> | yes | First term. |
| `termBId` | ref<`Term`> | yes | Second term. |
| `inContext` | ref<`Domain` \| `Layer` \| NodeKind> | no | Context where the synonymy holds. |
| `direction` | enum<bidirectional,a-to-b,b-to-a> | yes | Defaults to `bidirectional`. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `synonym_of` | `Term` | N:N | Drawn from each end of the synonym record. |

### Evidence

Cross-vendor synonymies SHOULD be backed by an `EvidenceSource` at
**vendor-doc-or-better** for at least one side of the equivalence. Catalog-internal
synonyms (e.g. terms that exist only in atlas prose) are editorial and policy-default-gated.

### Invariants

1. `termAId` and `termBId` MUST be distinct.
2. Within the same `inContext`, the `synonym_of` graph forms a valid equivalence
   class — symmetric, transitive, no contradictory `subsumes` claims (V-6.3).

---

## NodeKind: `Acronym` (graph-root: legitimately no parent)

_(graph-root: legitimately no parent — terminology vocabulary entity referenced via attributes (e.g. `fullForm`); catalog pass 23 hygiene 2026-05-01.)_

An abbreviation expanding to a term.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `acronym:<slug>`. |
| `acronym` | string | yes | The abbreviation, as written (case-preserving). |
| `expandsToTermId` | ref<`Term`> | yes | The term the acronym expands to. |
| `inContext` | ref<`Domain` \| `Layer` \| NodeKind> | no | Optional disambiguation context. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `expands_to` | `Term` | N:1 | The expanded term. |

### Evidence

No evidence-bound attributes by default. Domain-specific acronyms (e.g. vendor
abbreviations) SHOULD reference the term's `firstUseEvidenceId`.

### Invariants

1. `acronym` MUST be non-empty.
2. `expandsToTermId` MUST resolve to a known `Term`.

---

> **Remodel 2026-04-29:** the former `TermKind` NodeKind was collapsed into the
> `Term.kind` enum attribute (values: `concept`, `role`, `layer`, `primitive`, `mux`,
> `extension-shape`, `hook`, `capability`, `lifecycle-state`, `protocol`, `format`,
> `tool`, `operation`). The `classifies` edge and the standalone `term-kind:*`
> example files were removed.

## Edges (cluster summary)

| Edge | Description |
|---|---|
| `defined_in_context_of` | A `Term` is defined in the context of a `Domain`/`Layer`/NodeKind. |
| `synonym_of` | One `Term` is a synonym of another within a context. |
| `subsumes` | A broader `Term` subsumes a narrower one. |
| `replaces` | A `Term` replaces a deprecated predecessor. |
| `references` | A `Term` anchors to a NodeKind or `Capability`. |

---

## Examples

```yaml
# term:invocation referring to NodeKind:Invocation
- id: term:invocation
  displayName: "Invocation"
  kind: term-kind:lifecycle-state
  canonicalDefinitionId: definition:invocation-default
  usageContexts:
    - layer:6-orchestration
    - node:invocation
  references:
    - node:invocation
- id: definition:invocation-default
  termId: term:invocation
  text: |
    A bounded agent execution — one process spawn or its protocol equivalent —
    with a single conversation transcript and a single set of tool grants.
  inContext: node:invocation
  authoredAt: "2026-04-01T00:00:00Z"
```

```yaml
# term:run with multiple definitions in different contexts
- id: term:run
  displayName: "Run"
  kind: term-kind:concept
  canonicalDefinitionId: definition:run-babysitter-sdk
  usageContexts:
    - node:run
    - agent:babysitter
  references:
    - node:run
- id: definition:run-babysitter-sdk
  termId: term:run
  text: |
    A bounded orchestration unit in the babysitter SDK — event-sourced and
    journaled, spanning many Invocations.
  inContext: node:run
  authoredAt: "2026-04-01T00:00:00Z"
- id: definition:run-agent-mux-deprecated
  termId: term:run
  text: |
    (Deprecated) In agent-mux 0.x, "Run" referred to a single Invocation. This
    usage has been replaced by `term:invocation`.
  inContext: agent:agent-mux
  authoredAt: "2026-04-01T00:00:00Z"
```

```yaml
# term:harness deprecated, replaced by term:agent
- id: term:harness
  displayName: "Harness"
  kind: term-kind:concept
  canonicalDefinitionId: definition:harness-default
  deprecatedAt: "2026-02-01"
  replacedById: term:agent
- id: definition:harness-default
  termId: term:harness
  text: |
    (Deprecated) Earlier name for the agent runtime + platform layers; now
    superseded by `term:agent` and the explicit `AgentRuntimeImpl` /
    `AgentPlatformImpl` decomposition.
  authoredAt: "2026-04-01T00:00:00Z"
```

```yaml
# A Synonym between agent-mux Run and Invocation, direction=a-to-b
- id: synonym:agent-mux-run-to-invocation
  termAId: term:run
  termBId: term:invocation
  inContext: agent:agent-mux
  direction: a-to-b
```

```yaml
# An Acronym for "MCP" expanding to term:model-context-protocol
- id: acronym:mcp
  acronym: "MCP"
  expandsToTermId: term:model-context-protocol
```

```yaml
# TermKind enum records (subset)
- id: term-kind:concept
  displayName: "Concept"
  kind: concept
  description: A general concept in the ontology not bound to a specific implementation.
- id: term-kind:lifecycle-state
  displayName: "Lifecycle state"
  kind: lifecycle-state
  description: A named state in a state machine governing a NodeKind.
- id: term-kind:mux
  displayName: "Mux"
  kind: mux
  description: A multiplexer or switching primitive bridging two surfaces.
- id: term-kind:extension-shape
  displayName: "Extension shape"
  kind: extension-shape
  description: A content shape an extension may take (Skill, Subagent, Plugin, ToolServer).
```

## Related

- [`catalog-meta.md`](./catalog-meta.md) — `EvidenceSource` referenced by
  `Definition.evidenceSourceIds` and `Term.firstUseEvidenceId`.
- [`../../schema/edge-kinds.md`](../../schema/edge-kinds.md) — `defined_in_context_of`,
  `synonym_of`, `subsumes`, `replaces`, `references`.
- [`../../schema/validation-rules.md`](../../schema/validation-rules.md) — V-6 terminology rules.

