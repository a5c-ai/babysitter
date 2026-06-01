# NodeKinds: Catalog Meta

> Cluster 13 (with provenance pieces from Cluster 15). Specifies the node kinds
> that make the catalog self-describing: claims and the evidence behind them, the
> policies that gate them, the schema versions, the generators that derive
> artifacts, the scope-boundary helpers, and the open-questions queue. See
> [`README.md`](./README.md) for the full catalog and
> [`../../schema/meta-schema.md`](../../schema/meta-schema.md) for the standard node-kind file
> shape.

## Purpose

Cluster 13 contains the *catalog-meta* nodes — the entities that describe the
catalog itself. Every other cluster's data is anchored here: claims hang off
attributes, evidence sources back claims, policies gate which claims need evidence,
catalog versions stamp every node with what schema they were authored against,
generators derive prose / types / scaffolds from the graph, and out-of-scope
reasons + open questions record what we *cannot* yet say. Without this cluster the
schema would be a static dictionary; with it, the schema is auditable, versioned,
and generative.

The full attribute spec for `Claim`, `EvidenceSource`, `EvidencePolicy`, and
`TrustLevel` lives in [`../../schema/evidence-model.md`](../../schema/evidence-model.md). This
file is the canonical NodeKind spec — the markdown <-> YAML parity check (V-12.5)
binds against the tables below.

---

## NodeKind: `Claim`

A typed assertion about `(subject, attribute, value)` backed by one or more
`EvidenceSource` records. See [`../../schema/evidence-model.md`](../../schema/evidence-model.md)
for rationale, freshness rules, and worked examples.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `claim:<slug>`. |
| `claimId` | string | no | Stable claim identifier (typically equals `id`). Mirrors the legacy `claimId` field. |
| `subjectId` | ref<NodeKind> | yes | The entity the claim is about. |
| `subjectKind` | string | yes | The NodeKind name of the subject (e.g. `AgentVersion`, `ModelVersion`). Redundant with `subjectId` but indexed for query. |
| `attribute` | string | yes | The attribute name on the subject. |
| `value` | any | yes | The claimed value, typed by the subject's attribute spec. |
| `statement` | markdown | yes | Natural-language form of the claim (e.g. "Claude Code 1.x supports MCP stdio transport since 1.0.0"). |
| `evidenceSourceIds` | list<ref<`EvidenceSource`>> | yes | At least one (V-2.1). |
| `evidenceIds` | list<string> | no | Legacy alias for `evidenceSourceIds` for cross-walk with the legacy agent-catalog. |
| `confidence` | enum<high,medium,low,unverified> | yes | Confidence in the claim. Defaults to `medium` if a single vendor-doc evidence source backs it. |
| `provenanceKind` | enum<vendor-doc,repo-inspection,community,benchmark,observation> | yes | What kind of provenance the evidence rests on. |
| `evidenceStrength` | enum<strong,adequate,weak> | yes | Strength of the evidence chain (independent of confidence). |
| `status` | enum<open,accepted,challenged,superseded> | yes | Lifecycle of the claim itself. |
| `unresolvedGaps` | list<markdown> | no | Outstanding uncertainties (e.g. "vendor doc does not pin the first version"). |
| `claimedAt` | iso-timestamp | yes | When authored. |
| `claimedBy` | string | yes | Opaque principal identifier. (Was ref<`Authority`> before Trust Chain was de-scoped from Phase 1 ontology.) |
| `expiresAt` | iso-timestamp | no | Defaults from policy `freshnessWindowDays`. |
| `supersededBy` | ref<`Claim`> | no | Newer claim replacing this one. |
| `note` | markdown | no | Reviewer commentary. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `evidenced_by` | `EvidenceSource` | N:N | Inverse of `produced_evidence_for`. |
| `claims` | (`NodeKind`, attribute, value) | N:1 | Logical edge; modeled via `subjectId` + `attribute`. |
<!-- attested_by edge removed: Attestation NodeKind is out-of-scope (Trust Chain de-scoped from Phase 1 ontology). -->

### Invariants

1. `evidenceSourceIds` is non-empty (V-2.1).
2. When `supersededBy` is set, the successor MUST share `subjectId` and `attribute`
   (V-2.7).
3. A claim past `expiresAt` is treated as missing for V-2.1 (V-2.6).
4. Safety-critical claims (capability binding, install method, sandbox profile)
   MUST NOT be backed solely by `synthetic` evidence (V-2.4).

---

## NodeKind: `EvidenceSource`

A discrete piece of evidence — a doc page, a file, a package metadata entry, an
observation, an attestation. See [`../../schema/evidence-model.md`](../../schema/evidence-model.md)
for the full conditional-required matrix.

> **Deprecated alias:** `Evidence` was previously used as a NodeKind label for
> the same concept and appears in some legacy examples and docs. It is a
> deprecated alias of `EvidenceSource` (canonical) as of 2026-04-28. Authors
> MUST emit `nodeKind: EvidenceSource`; linters MUST flag `nodeKind: Evidence`.
> The id prefix `evidence:` is unchanged — it is the declared prefix for
> `EvidenceSource` (see `schema/ontology-schema.yaml`, `node:evidence-source`).
> See `term:evidence` (synonym of `term:evidence-source`) in
> `graph/terminology/terms/term-stubs.yaml`.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `evidence:<slug>`. |
| `evidenceId` | string | no | Vendor-stable id when available (e.g. doc page slug, packaged manifest hash). |
| `kindLabel` | enum<web,file,package,observation,attestation> | yes | What sort of source. |
| `trustLevel` | ref<`TrustLevel`> | yes | One of the four levels. |
| `sourcePathOrUrl` | string | no | Unified source pointer (URL for `web`, path for `file`, package coord for `package`). Used for cross-walk with the legacy agent-catalog. |
| `sourceUrl` | url | conditional | Required when `kindLabel = web`. |
| `filePath` | string | conditional | Required when `kindLabel = file`. |
| `packageId` | string | conditional | Required when `kindLabel = package`. |
| `locator` | string | no | Fragment / page / heading / section anchor within the source (e.g. `#extended-thinking`, `chap:hooks`, `line:42`). |
| `capturedAt` | iso-timestamp | no | When the evidence was captured (alias of `observedAt` retained for legacy cross-walk). |
| `observedAt` | iso-timestamp | yes | When the evidence was captured. |
| `observedBy` | string | yes | Opaque principal identifier. (Was ref<`Authority`> before Trust Chain was de-scoped from Phase 1 ontology.) |
| `reachabilityCheck` | map<string,any> | no | `{lastChecked, status, statusCode, redirects}`. |
| `reviewOwner` | string | no | Opaque principal identifier. (Was ref<`Authority`> before Trust Chain was de-scoped from Phase 1 ontology.) |
| `reviewedAt` | iso-timestamp | no | Last manual review. |
| `freshnessWindowDays` | int | no | Overrides policy default. |
| `excerpt` | markdown | no | Relevant snippet. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `produced_evidence_for` | `Claim` | N:N | Inverse of `evidenced_by`. |
| `at_trust_level` | `TrustLevel` | N:1 | Carried `TrustLevel` reference. |

### Invariants

1. `kindLabel = web` requires `sourceUrl`; `file` requires `filePath`; `package`
   requires `packageId` (V-1.4).
2. `kindLabel = web` requires a `reachabilityCheck` whose `status = ok` within the
   freshness window (V-2.5).
3. `freshnessWindowDays` (when set) overrides the policy default.

---

## NodeKind: `EvidencePolicy`

The rule that gates an evidence-bound attribute. Policies live as nodes so they
can be composed and version-bumped.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `policy:<slug>`. |
| `minimumTrustLevel` | ref<`TrustLevel`> | yes | The floor for accepted evidence. |
| `freshnessWindowDays` | int | yes | Default freshness in days. |
| `requiresAttestation` | bool | no | Defaults `false`. |
| `reviewOwnerPattern` | string | no | Regex constraint on `reviewOwner`. |
| `vendorBackedSelector` | string | no | Selector for vendor-backed claims. |
| `appliesTo` | list<string> | yes | Attribute selectors gated by this policy. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `gates` | (attribute selectors) | N:N | Logical; encoded via `appliesTo`. |

### Invariants

1. `appliesTo` is non-empty.
2. `minimumTrustLevel` MUST resolve to a known `TrustLevel`.

---

## NodeKind: `OutOfScopeReason`

A structured reason why an entity, attribute, or capability is explicitly out of
scope. Referenced from `ScopeBoundary` (see
[`sourceref-and-scope.md`](./sourceref-and-scope.md)).

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `out-of-scope-reason:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `reasonKind` | enum<volatile-data,runtime-only,not-design-artifact,implementation-detail,future-phase,governance-deferred> | yes | The category. |
| `description` | markdown | yes | Fuller explanation. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `reason_for` | `ScopeBoundary` | N:N | Inverse of `out_of_scope_reason`. |

### Invariants

1. The set of `reasonKind` values is fixed; new values require a schema bump (V-9.3).
2. `OutOfScopeReason` is `isolatedAllowed: true` for V-12.1.

---

## NodeKind: `OpenQuestion`

A named TBD with an owner, raised when an attribute can't yet be claimed because
evidence is missing or contested. The validator surfaces open questions as the
queue of *what we still owe*.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `open-question:<slug>`. |
| `displayName` | string | yes | Human-readable summary. |
| `description` | markdown | yes | What is unknown and why. |
| `owner` | string | yes | Opaque principal identifier (accountable reviewer). (Was ref<`Authority`> \| string before Trust Chain was de-scoped from Phase 1 ontology.) |
| `raisedAt` | iso-timestamp | yes | When the question was raised. |
| `affectedEntities` | list<ref<any catalog entity>> | yes | Entities whose attributes are blocked. |
| `status` | enum<open,answered,deferred,obsolete> | yes | Current state. |
| `resolution` | markdown | no | Required when `status != open`. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `affects` | any catalog entity | N:N | Carried via `affectedEntities`. |

### Invariants

1. `affectedEntities` is non-empty.
2. When `status` ∈ `{answered, deferred, obsolete}`, `resolution` MUST be set.

---

## NodeKind: `Gap`

A tracked debt-loop finding. First-class graph entity so gap state is queryable.

Attributes:
- id (id) — e.g. `gap:level-1-p1-anthropic-extended-thinking`
- title (string)
- level (int 1-7)
- priority (enum: P0 | P1 | P2 | P3)
- discoveredAt (iso-timestamp)
- source (markdown)
- currentState (markdown)
- desiredState (markdown)
- propagationStatus (map<level,enum<not-started,in-progress,done,not-applicable>>)
- owner (string, optional) — opaque principal id; was ref Authority before Trust Chain de-scope
- evidenceLinks (list<ref EvidenceSource>)
- status (enum: open | in-progress | closed | deferred)
- closedAt (iso-timestamp, optional)
- notes (markdown)
- propagationChain (list<map<level,fix,by,at>>)
- markdownRef (string) — path to the human-readable form at wiki/process/gaps/GAP-...md

Edges:
- `Gap affects NodeKind|EdgeKind|EvidencePolicy|<entity>` — what the gap is about
- `Gap blocks Phase` — when a gap blocks phase advancement
- `Gap raised_question OpenQuestion` — bridge to existing OpenQuestion entity

Examples: see `wiki/process/gaps/_template.md` and `graph/catalog-meta/gaps/` (Phase 2 work to populate).

> **Schema parity note.** A corresponding entry has been added (or, if the YAML edit failed, MUST be added) to `../schema/ontology-schema.yaml` under `nodeKinds:`. The markdown / YAML parity check (V-12.5) will fail until both sides agree.

---

---

## NodeKind: `PackageSurface`

Workspace package tracking. Records a workspace package — ours or a third-party —
its module type, the surface kinds it exposes, and its source-of-truth role.
Used by the catalog to track which packages produce / consume the graph and how
they're published.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `package:<name>`, e.g. `package:@a5c-ai/atlas/catalog`. |
| `packageId` | string | yes | Stable id (typically equals the npm/PyPI package name). |
| `packageName` | string | yes | Human-readable / publishable name. |
| `workspacePath` | string | yes | Repo-relative path to the package root (e.g. `packages/agent-catalog`). |
| `moduleType` | enum<typescript,commonjs,esm,nextjs,python,rust,go,other> | yes | Module / build flavor. |
| `surfaceKinds` | list<string> | yes | Surface kinds the package exposes (e.g. `graph-source`, `sdk`, `cli`, `ui`, `internal-workspace-package`, `sdk-consumer`, `discovery-consumer`, `plugin-consumer`, `host-detection-consumer`, `invocation-consumer`, `ui-consumer`, `api-consumer`, `transport-runtime`, `provider-ontology-source`). |
| `sourceOfTruthRole` | enum<graph-source-of-truth,wrapper-over-graph,ontology-input,application,external> | yes | Role the package plays w.r.t. the graph. |
| `publishedTo` | enum<npm,pypi,crates,none> | no | Where the package is published, if at all. |
| `versionPolicy` | enum<semver,date,hash> | no | Versioning policy. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `references_path` | `PathDescriptor` | N:N | Paths the package occupies. |
| `wraps_graph` | `GraphDocument` | N:1 | When the package wraps the graph. |
| `validated_by_ci` | `CiSurface` | N:1 | The package's CI surface. |
| `surfaces_process` | `ProcessDescriptor` | N:N | Processes surfaced by the package. |

### Invariants

1. `id` MUST start with `package:`.
2. `surfaceKinds` MUST be non-empty.
3. `sourceOfTruthRole = graph-source-of-truth` requires at least one
   `wraps_graph` edge.

---

## NodeKind: `CiSurface`

CI/CD tracking for a `PackageSurface`. Records the scripts, publish strategy,
release channels, validation commands, artifact expectations, and trigger
events for a package's CI pipeline.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `ci:<package>`, e.g. `ci:@a5c-ai/atlas/catalog`. |
| `ciId` | string | yes | Stable id (typically the package name). |
| `packageId` | ref<`PackageSurface`> | yes | The package this CI surface validates. |
| `scripts` | list<string> | yes | Top-level npm/pnpm scripts (e.g. `build`, `test`, `validate:evidence:freshness`, `ci:evidence`, `policy:check`, `ci:test`, `version:check`). |
| `publishStrategy` | enum<internal-workspace,npm-public,application,container-image,none> | yes | How the package's outputs are released. |
| `releaseChannels` | list<string> | yes | Channels (e.g. `ci`, `prod`, `staging`). |
| `validationCommands` | list<string> | yes | Concrete validation commands (e.g. `npm run ci:test --workspace=@a5c-ai/atlas`). |
| `artifactExpectations` | list<string> | no | Glob patterns for expected build artifacts (e.g. `dist/**`, `graph/**`, `evidence/**`, `.next/**`). |
| `triggerEvents` | list<enum<push,pr,tag,schedule>> | no | Events that trigger this pipeline. |
| `requiredApprovals` | int | no | Number of human approvals required before publish. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `validates_package` | `PackageSurface` | N:1 | Inverse of `validated_by_ci`. |

### Invariants

1. `packageId` MUST resolve.
2. `scripts` MUST be non-empty.
3. `publishStrategy = none` implies `releaseChannels` is empty.

---

## NodeKind: `DiscoverySignal`

A host-detection signal — env var, binary on PATH, file presence, registry key,
argv match, exit code, or a combination — used by `agent-mux` to detect whether a
particular agent harness is the active host or installed on the machine.

Sourced from the legacy agent-catalog ontology
(`packages/agent-catalog/graph/schema/ontology-schema.yaml :: DiscoverySignal`)
and the runtime probe in
`packages/agent-mux/core/src/host-detection.ts`.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `discovery-signal:<slug>`, e.g. `discovery-signal:claude-code-host-env`. |
| `signalId` | string | yes | Stable signal id (typically equals `id`). |
| `signalKind` | enum<env-var,env-any,binary-on-path,file-presence,registry-key,argv-match,exit-code,combination> | yes | **Evidence-bound at vendor-doc-or-better.** atlas keeps the legacy `env-var` and adds `env-any` (at least one of a list of env vars is set), as used by every imported `*-host-env` example. |
| `key` | string | yes | Lookup key — agent slug, env-var name, or binary basename. |
| `matchMode` | enum<exact,substring,regex,semver-range,contains-array,any,all> | yes | How `signals` are evaluated. atlas adds `any`/`all` set-quantifiers to cover the imported `env-any` mode. |
| `confidence` | enum<low,medium,high> | yes | Detector confidence when this signal fires alone. |
| `scope` | enum<user,system,shell,process,host-detection> | yes | Lexical scope of the signal. atlas retains the legacy lexical scopes plus `host-detection` as used by `agent-mux/core`. |
| `signals` | list<string> | yes | Concrete probes the signal evaluates (env var names, binary names, file paths, argv tokens). |
| `argvMatches` | list<string> | no | Argv tokens this signal matches when `scope = host-detection`. Optional in atlas (legacy schema marked required but several imported signals omit it). |
| `consumer` | string | no | Subsystem that consumes the signal (e.g. `agent-comm-mux`). |
| `metadataFields` | list<map<string,any>> | no | Per-signal metadata extraction recipe: `{ key, envVars: [...] }`. |
| `notes` | markdown | no | |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `detects` | `AgentVersion` \| `AgentProduct` | N:1 | The target this signal detects. |
| `signals_via` | `PathDescriptor` | N:N | When the signal targets a known typed path (binary on PATH, file-presence probe). |
| `applies_to` | `AgentProduct` | N:N | Used by every imported example to bind the signal to its target agent. (Existing `applies_to` edge — extended to accept `DiscoverySignal` source and `AgentProduct` target.) |
| `sourced_from` | `SourceRef` | N:1 | Source-of-truth for the signal recipe (typically `packages/agent-mux/core/src/host-detection.ts`). |

### Evidence

`signalKind` is evidence-bound at **vendor-doc-or-better** when the signal claims
to detect a vendor-published agent (the env var convention or argv banner usually
appears in the vendor's launch documentation). Community-contributed signals may
carry community-trust evidence on the same attribute.

### Invariants

1. `id` MUST start with `discovery-signal:`.
2. `signals` MUST be non-empty.
3. `scope = host-detection` implies at least one of (`signals`, `argvMatches`) is
   non-empty.

### Examples

The 10 imported signals in `graph/extensions/discovery-signals/`:
`claude-code-host-env.yaml`, `codex-host-env.yaml`,
`copilot-cli-host-env.yaml`, `cursor-host-env.yaml`,
`gemini-cli-host-env.yaml`, `hermes-host-env.yaml`, `omp-host-env.yaml`,
`openclaw-host-env.yaml`, `opencode-host-env.yaml`, `pi-host-env.yaml`.

### Related

- `AgentProduct` / `AgentVersion` — what the signal detects.
- `PathDescriptor` — typed path target for binary / file-presence signals.

---

---

## Stub NodeKinds (Phase 1 parity holders)

The following NodeKinds were declared as stubs in `../schema/ontology-schema.yaml`
to satisfy `V-12.5` markdown↔YAML parity for references already present in
[`../coverage-checklist.md`](../coverage-checklist.md). Each carries the
minimum required attributes (id, purpose, partial attribute table) and is
flagged for Phase 2 follow-up where the full attribute / edge / invariant
spec will be authored in the appropriate cluster file.

### NodeKind: `PathDescriptor` (full spec — Phase 2 lift-in complete)

Cluster 13. A typed pointer to a path on a host filesystem (run dir, session
dir, MCP config path, plugin scope dir, vendor auth path, plugin artifact
location). Distinct from `SourceRef`, which points to source-of-truth in a
repo; `PathDescriptor` describes a *runtime* filesystem path used by an agent
or by a packaged artifact.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `path:<slug>`. |
| `pathId` | string | yes | Stable identifier (typically equals `id`). |
| `displayName` | string | no | Human-readable label. |
| `path` | string | yes | The literal or templated path (e.g. `.a5c/runs`, `~/.claude/projects/<hash>/`, `ghcr.io/anthropics/claude-code`). |
| `pathPattern` | string | no | Glob form when the path is a pattern. |
| `pathKind` | enum<session-state-dir,source-of-truth-dir,api-surface,ontology-source,repo-path,manifest,container-image,run-dir,plugin-scope,mcp-config,vendor-auth,settings-file,other> | yes | The semantic kind of path. |
| `ownerKind` | string | yes | NodeKind name of the owner (e.g. `PluginArtifact`, `PackageSurface`, `ProcessDescriptor`, `GraphDocument`). |
| `ownerId` | id | yes | Owning entity id. |
| `platform` | enum<cross-platform,repo,linux,macos,windows,container> | yes | Platform context. |
| `scope` | enum<user,project,session,run,system> | no | Lifecycle scope. |
| `evaluationContext` | enum<project,user,system> | no | When and how the path is evaluated. |
| `expansion` | enum<literal,home,env-var,hash-suffix> | no | Path-expansion semantics (e.g. `~` → home, `${runId}` → env-var, `<hash>` → hash-suffix). |
| `notes` | markdown | no | Free-form notes (e.g. "Shared fallback run/session directory for harness metadata."). |

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `path_for` | any catalog entity | N:N | Inverse of `references_path`. |

#### Invariants

1. `ownerKind` MUST be a known NodeKind and `ownerId` MUST resolve.
2. When `pathKind = container-image`, `path` MUST be a valid OCI image reference.
3. When `expansion = home`, `path` MUST start with `~` or `$HOME`.

### NodeKind: `OntologySchema`

Cluster 15. The catalog ontology modeled as a first-class entity so it can
be claimed about and versioned via `CatalogVersion`. Now references
MetaClusters (the meta-shape registry) so the ontology becomes
self-describing — generators and the wiki enumerate the schema by querying
the graph rather than re-parsing `schema/ontology-schema.yaml`.

Attributes: `id`, `displayName`, `catalogVersionId`, `metaClusters`
(`list<ref<MetaCluster>>`), `metaNodeKindCount` (int), `metaEdgeKindCount`
(int). Outgoing edges: `version_of`, `defines_meta_cluster`.

### NodeKind: `MetaNodeKind`

Cluster 15 (meta-shape registry). A first-class record describing one
NodeKind in the catalog ontology. Mirrors the NodeKind declaration fields
from `../../schema/meta-schema.md` (name, cluster, prefix, origin, purpose,
invariants) so the catalog can enumerate, query, and version its own
meta-shape without re-parsing `schema/ontology-schema.yaml`. Outgoing
edges: `contains_meta_attribute`, `has_outgoing_edge`, `has_incoming_edge`,
`in_cluster`, `has_example`. Incoming edges: `contains_meta_node_kind`,
`source_of_meta_edge`, `target_of_meta_edge`. Id-prefix `meta-node-kind:`.

### NodeKind: `MetaEdgeKind`

Cluster 15 (meta-shape registry). A first-class record describing one
EdgeKind in the catalog ontology. Mirrors EdgeKind declaration fields
(`source`, `target`, `cardinality`, `origin`, `inverse`, `description`).
Outgoing edges: `source_of_meta_edge`, `target_of_meta_edge`, `inverse_of`.
Incoming edges: `contains_meta_edge_kind`, `has_outgoing_edge`,
`has_incoming_edge`, `inverse_of`. Id-prefix `meta-edge-kind:`.

### NodeKind: `MetaCluster`

Cluster 15 (meta-shape registry). A first-class record describing one
editorial cluster of the catalog ontology (e.g. `10-roles`,
`15-catalog-provenance`). Carries `clusterNumber`, `scope`, optional
`parentClusterId`. Outgoing edges: `contains_meta_node_kind`,
`contains_meta_edge_kind`. Incoming edges: `in_cluster`,
`defines_meta_cluster` (from `OntologySchema`). Id-prefix `meta-cluster:`.

### NodeKind: `MetaAttribute`

Cluster 15 (meta-shape registry). A first-class record describing one
attribute on a NodeKind. Carries `name`, `parentNodeKindId`, `type`
(AttributeType expression), `required`, optional `evidenceTier`,
`description`, `notes`. Outgoing edge: `defined_on`, `enum_value_for`.
Incoming edges: `contains_meta_attribute`, `used_on_attribute`. Id-prefix
`meta-attribute:`.

### NodeKind: `MetaEnum`

Cluster 15 (meta-shape registry). A first-class record describing one
named enum used in attribute types across the ontology (e.g. the `origin`
enum `universal|standardized|convergent|a5c`). Carries `values`
(`list<map<string,string>>` — each map has `value` + `description`) so the
wiki can enumerate enum values cleanly. Outgoing edge: `used_on_attribute`.
Incoming edge: `enum_value_for`. Id-prefix `meta-enum:`.


### NodeKind: `SharedContextSpec` (stub) (graph-root: legitimately no parent)

_(graph-root: legitimately no parent — catalog-meta root describing structured-output shape; catalog pass 23 hygiene 2026-05-01.)_

Cluster 13. The shape of an a5c shared-context fabric record. Stub
attributes: `id`, `contextKind`, `producerIface`, `consumerIfaces`. Full
spec deferred to Phase 2 (extension-interfaces track).

### NodeKind: `DeploymentTarget`

Cluster 13. A named Kubernetes-cluster (or local minikube) target that the
babysitter cloud package can deploy the kanban / gateway / agent-platform
components to. Reifies the union of `TargetConfig` variants
(`minikube` | `existing` | `eks` | `aks` | `gke`) declared in
`packages/cloud/src/types.ts` so cluster fleets, cost reports, and multi-tenant
deployment plans become queryable as graph data.

Key attributes: `targetType`, `environment`, `kubeContext`, `namespace`,
`cloudRegion`, `cloudProjectId`, `cloudSubscriptionId`, `cloudResourceGroup`,
`clusterName`, `ingressHostnames`, `ingressTls`, `ingressClassName`,
`authMode`, `storageClassName`, `autoApplyTerraform`, `autoApplyKubernetes`.

Invariants enforce that vendor-required fields are present per `targetType`
(EKS requires `cloudRegion` + `clusterName`; AKS additionally requires
`cloudSubscriptionId` + `cloudResourceGroup`; GKE requires `cloudProjectId` +
`cloudRegion` + `clusterName`).

Examples:

- `graph/catalog-meta/deployment-targets/minikube-local.yaml`
- `graph/catalog-meta/deployment-targets/eks-prod.yaml`

### NodeKind: `RunJournalEvent` (graph-root: legitimately no parent)

_(graph-root: legitimately no parent — catalog-meta value-set enum of journal event names; catalog pass 23 hygiene 2026-05-01.)_

Cluster 13. The enum of run journal event names emitted by the babysitter
runtime and persisted to `<runDir>/journal/` as sequenced + ULID-tagged +
sha256-checksummed JSON files. Sourced from `packages/sdk/src/storage/journal.ts`
(`appendEvent`, `JournalEvent`).

Attributes: `id`, `eventName` (evidence-bound), `category` ∈ {`run-lifecycle`,
`effect-lifecycle`, `iteration`, `hook`, `cost`, `custom`}, `emittedByPhase`,
`terminal`, `payloadShape` (JSON Schema, optional).

Canonical events observed in the runtime:

- **run-lifecycle:** `RUN_CREATED`, `RUN_COMPLETED` (terminal), `RUN_FAILED` (terminal),
  `RUN_ITERATION`
- **effect-lifecycle:** `EFFECT_REQUESTED`, `EFFECT_RESOLVED`, `EFFECT_CANCELLED`,
  `EFFECT_PROGRESS`
- **hook:** `STOP_HOOK_INVOKED`
- **cost:** `COST_TRACKED`

Examples:

- `graph/catalog-meta/run-journal-events/run-created.yaml`
- `graph/catalog-meta/run-journal-events/effect-requested.yaml`
- `graph/catalog-meta/run-journal-events/effect-resolved.yaml`
- `graph/catalog-meta/run-journal-events/run-completed.yaml`
- `graph/catalog-meta/run-journal-events/run-failed.yaml`

### NodeKind: `DecisionVerb` (stub) (graph-root: legitimately no parent)

_(graph-root: legitimately no parent — catalog-meta value-set enum referenced by hook decisions via attributes; catalog pass 23 hygiene 2026-05-01.)_

Cluster 13. The ordered enum of hook decision verbs (`deny`, `ask`,
`allow`, `continue`, `noop`) with `rank` attribute and orthogonal `block`
flag. Stub attributes: `id`, `verb`, `rank`, `block`. Full spec deferred to
Phase 2 (channels-hooks / hook-merge track).

> **Cascade note (Phase 1 only).** Levels 4-7 propagation (process docs,
> generators, examples, tests) is deferred until those phases land; the gap
> entry at `../wiki/process/gaps/GAP-L2-P0-pathdescriptor-undeclared-but-referenced.md`
> tracks the carry-forward.

---

## Edges (cluster summary)

| Edge | Description |
|---|---|
| `produced_evidence_for` | `EvidenceSource` produced evidence for a `Claim`. |
| `claims` | `Claim` asserts (subject, attribute, value). |
| `consumes_node_kind` | `Generator` depends on a `NodeKind`. |
| `consumes_edge_kind` | `Generator` depends on an `EdgeKind`. |
| `derives` | `Generator` derives a `DerivedArtifact`. |
| `in_scope` | An entity is within a `ScopeBoundary`. |
| `out_of_scope` | An entity is outside a `ScopeBoundary`. |
| `out_of_scope_reason` | A `ScopeBoundary`'s exclusion is tagged with a reason. |

---

## Examples

```yaml
# A Claim + EvidenceSource pair
- id: evidence:anthropic-api-thinking-2026-01
  kindLabel: web
  trustLevel: trust-level:official-web
  sourceUrl: https://docs.anthropic.com/en/api/messages#extended-thinking
  observedAt: "2026-01-15T09:32:00Z"
  observedBy: authority:a5c-ai-catalog
  reachabilityCheck:
    lastChecked: "2026-04-20T03:00:00Z"
    status: ok
    statusCode: 200
    redirects: 0
  reviewOwner: authority:a5c-ai-catalog
  reviewedAt: "2026-01-15T09:32:00Z"
  freshnessWindowDays: 180

- id: claim:claude-opus-4-7-thinking-budget
  subjectId: model:claude-opus-4-7
  attribute: supportsThinkingBudgetTokens
  value: true
  evidenceSourceIds:
    - evidence:anthropic-api-thinking-2026-01
  claimedAt: "2026-01-15T09:35:00Z"
  claimedBy: authority:a5c-ai-catalog
  expiresAt: "2026-07-14T00:00:00Z"
```

```yaml
# An OpenQuestion record
- id: open-question:codex-mcp-stdio-since
  displayName: "When did Codex start supporting MCP stdio transport?"
  description: |
    Codex 0.8 release notes mention MCP support but do not specify the transport.
    Need a vendor-doc citation pinning the first version that supports stdio.
  owner: authority:a5c-ai-catalog
  raisedAt: "2026-04-20T11:00:00Z"
  affectedEntities:
    - agent-version:codex@0.x
    - capability:mcp-stdio
  status: open
```

```yaml
# A Generator declaration
- id: generator:layer-doc
  displayName: "Layer prose generator"
  consumesNodeKindIds:
    - node:layer
  consumesEdgeKindIds:
  outputs:
    - path: docs/derived/layers.md
      format: markdown
  invariants:
    - "every Layer.position 1..11 appears in output"
```

## Related

- [`../../schema/evidence-model.md`](../../schema/evidence-model.md) — full Claim / Evidence /
  Policy spec.
- [`../../schema/versioning.md`](../../schema/versioning.md) — `CatalogVersion` lifecycle.
- [`trust.md`](./trust.md) — `TrustLevel` (evidence-quality grading). The Trust Chain (`Authority`, `Attestation`) is out-of-scope for the Phase 1 ontology.
- [`sourceref-and-scope.md`](./sourceref-and-scope.md) — `ScopeBoundary` consumes
  `OutOfScopeReason`.
- [`../../schema/validation-rules.md`](../../schema/validation-rules.md) — V-2 evidence rules,
  V-9 scope rules, V-12.5 markdown/YAML parity.

