# NodeKinds: `VectorStore`, `EmbeddingModelProfile`, `MemoryStore`, `PromptTemplate`, `ContextBundle`

> Cluster — Context engineering. See [`README.md`](./README.md) for the full catalog.

## Purpose

This cluster makes the *context-construction surface* — the machinery that builds the prompt
an agent sends on every turn — first-class catalog entities. Without it, the graph can
describe an agent's model and capabilities but cannot anchor *which prompt template*,
*which memory store*, or *which embedding model* the agent's per-turn context is built
from. With it, the chain
`VectorStore + EmbeddingModelProfile → MemoryStore → ContextBundle ← PromptTemplate` is
queryable end to end.

The cluster consolidates two predecessor draft clusters (`memory` and `prompt-engineering`)
and incorporates the reviewer collapses from catalog pass 19 (`FewShotExampleSet` folded into
`PromptTemplate.examples`; `KnowledgeGraphRef` folded into `MemoryStore.kind`).

The five NodeKinds are:

1. **`VectorStore`** — a vector database (Pinecone, Weaviate, Qdrant, pgvector, Chroma,
   …).
2. **`EmbeddingModelProfile`** — a profile of one embedding model (provider, dimensions,
   max input, price).
3. **`MemoryStore`** — an addressable agent memory, `kind`-discriminated.
4. **`PromptTemplate`** — a parameterized prompt with embedded few-shot examples.
5. **`ContextBundle`** — the per-turn assembly recipe combining templates, memory draws,
   and tool catalogs.

This cluster is the surface that lets the schema answer:

- "Which `MemoryStore`s does `agent-version:symphony@1.4.0` draw from per turn?"
- "For `context-bundle:symphony-default`, what is the assembly order?"
- "Which embedding model and `VectorStore` back the symphony semantic memory?"

---

## `VectorStore`

A vector database.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `vector-store:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `homepageUrl` | url | yes, evidence: vendor-doc-or-better | Canonical homepage. |
| `hosting` | enum<saas,self-hosted,saas-or-self-hosted,embedded> | yes | Deployment posture. |
| `indexKinds` | list<string> | yes | Index types supported (e.g., `hnsw`, `ivf`, `flat`). |
| `metricKinds` | list<string> | yes | Distance metrics supported (e.g., `cosine`, `dotproduct`, `l2`, `euclidean`). |
| `description` | markdown | yes | One-paragraph description. |

### Edges

No outgoing edges by default. Inverse: `MemoryStore.backed_by`.

### Evidence

`homepageUrl` is required and evidence-bound at `vendor-doc-or-better`.

### Invariants

1. `indexKinds` and `metricKinds` are non-empty.
2. `id` MUST follow the form `vector-store:<kebab-slug>`.

---

## `EmbeddingModelProfile`

A profile of one embedding model.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `embedding-model-profile:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `modelRef` | string | yes | Provider-qualified model id (e.g., `"openai:text-embedding-3-large"`). |
| `dimensions` | int | yes | Embedding dimensionality. |
| `maxInputTokens` | tokens | yes | Maximum input tokens per call. |
| `pricePerMTokens` | cost-per-million-tokens | optional | Price per million tokens (input). |
| `currency` | enum<USD,EUR,GBP,JPY> | optional | Required when `pricePerMTokens` is set. |
| `description` | markdown | yes | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `produced_by` | `Provider` | N:1 | The provider serving the embedding model. |

### Evidence

No evidence-bound attributes by default.

### Invariants

1. `dimensions` ≥ 1; `maxInputTokens` ≥ 1.
2. `id` MUST follow the form `embedding-model-profile:<kebab-slug>`.

---

## `MemoryStore`

An addressable agent memory.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `memory-store:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `kind` | enum<vector,document,knowledge-graph,prompt-cache,conversation-buffer,summarized-history> | yes | Discriminator. `knowledge-graph` collapses the former `KnowledgeGraphRef` proposal (catalog pass 19 reviewer fold). |
| `windowTurns` | int | optional | For `conversation-buffer`: number of recent turns retained. |
| `description` | markdown | yes | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `backed_by` | `VectorStore` | N:1 | For `kind=vector`, the backing store. |
| `uses_embedding` | `EmbeddingModelProfile` | N:1 | For `kind=vector`, the embedding model profile. |

### Evidence

No evidence-bound attributes by default.

### Invariants

1. When `kind = vector`, both `backed_by` and `uses_embedding` SHOULD be set.
2. `id` MUST follow the form `memory-store:<kebab-slug>`.

---

## `PromptTemplate`

A parameterized prompt with embedded few-shot examples.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `prompt-template:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `templateKind` | enum<system,user,assistant,tool> | yes | Role the rendered output plays. |
| `body` | markdown | yes | The template body, with `{{variable}}` placeholders. |
| `variables` | list<string> | yes | Names of `{{...}}` variables consumed by `body` (may be empty). |
| `examples` | list<map<input:string,output:string,description:string>> | yes | Embedded few-shot examples. (catalog pass 19 reviewer fold: replaces the former `FewShotExampleSet` NodeKind.) May be empty. |
| `description` | markdown | yes | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `used_by` | `AgentVersion` \| `Subagent` | N:N | The entity that renders / sends the prompt. |

### Evidence

No evidence-bound attributes by default.

### Invariants

1. Every `{{variable}}` referenced in `body` MUST appear in `variables`.
2. `id` MUST follow the form `prompt-template:<kebab-slug>`.

---

## `ContextBundle`

The per-turn assembly recipe.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `context-bundle:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `description` | markdown | yes | One-paragraph description. |
| `ordering` | list<string> | yes | Section names in render order (e.g., `[system, tools, memory, history, user]`). |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `composes` | `PromptTemplate` | N:N | Templates rendered into the bundle. |
| `draws_from` | `MemoryStore` | N:N | Memory stores read on each turn. |
| `cached_in` | `MemoryStore` | N:1 | Optional prompt-cache store. |

### Evidence

No evidence-bound attributes by default.

### Invariants

1. `ordering` is non-empty; entries are unique.
2. `id` MUST follow the form `context-bundle:<kebab-slug>`.

---

## Examples

See [`graph/extensions/memory/`](../graph/extensions/memory/) and
[`graph/extensions/prompt-engineering/`](../graph/extensions/prompt-engineering/).

## Related

- [`README.md`](./README.md) — the full node-kind catalog and cluster index.
- [`agent-stack.md`](./agent-stack.md) — `AgentVersion` and `Subagent` are the typical
  consumers of `PromptTemplate.used_by` and indirectly of `ContextBundle`.
- [`../../schema/edge-kinds.md`](../../schema/edge-kinds.md) — `produced_by`, `backed_by`,
  `uses_embedding`, `used_by`, `composes`, `draws_from`, `cached_in` edge specs.

## catalog pass 53 — CompactionPolicy

Promotes the inline `AgentRuntimeImpl.contextManagementStrategy` /
`compactionTriggerThresholdTokens` attributes to a first-class shared NodeKind
that can be cited by multiple runtimes / sessions / RunJournalEvents. Sourced
from claude-code auto-compaction (PreCompact hook + reactive image-stripping) and
pi-mono branch-summarization plus file-operation tracking.

### NodeKind: `CompactionPolicy`

#### Attributes

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | |
| `displayName` | string | yes | |
| `strategy` | enum&lt;rolling-summary,branch-summarization,hierarchical,cumulative-summary,truncate,none,platform-managed,user-managed&gt; | yes | Mirrors `AgentRuntimeImpl.contextManagementStrategy` plus pi-mono `branch-summarization`. |
| `trigger` | enum&lt;token-threshold,turn-count,explicit-tool,pre-compact-hook,context-overflow,manual,hybrid&gt; | yes | |
| `triggerThresholdTokens` | int | no | |
| `triggerThresholdFraction` | float | no | |
| `preserveRecentTurns` | int | no | |
| `preserveFileOperations` | bool | no | pi-mono `CompactionDetails.readFiles` / `modifiedFiles`. |
| `summarizationPromptTemplateId` | ref&lt;PromptTemplate&gt; | no | |
| `summarizerModelVersionId` | ref&lt;ModelVersion&gt; | no | |
| `hookSurfaceId` | ref&lt;HookSurface&gt; | no | |
| `stripsImagesOnRetry` | bool | no | claude-code reactive-compact branch. |
| `description` | markdown | no | |

#### Invariants

1. `id` MUST start with `compaction-policy:`.

#### Relationships

- `applies_compaction_policy` → `AgentRuntimeImpl | AgentVersion | Session` (inverse `compaction_policy_applied_by`, N:N)
- `compacts_into_bundle` → `ContextBundle` (inverse `bundle_produced_by_compaction`, N:N)

