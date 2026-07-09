# Functional Requirements

> Numbered, traceable functional requirements (FR-*) derived from the capabilities the spec
> normatively defines. Every FR cites the SPEC section that grounds it. RFC-2119 keywords
> (MUST / MUST NOT / SHALL / SHOULD / MAY) carry the spec's precision and are not softened.

**Source: SPEC §2–§6, §5b** (capabilities). Cross-cutting correctness is captured as non-functional
requirements in [non-functional requirements](./11-non-functional-requirements.md); the load-bearing
correctness mechanics live in [synchronization & convergence](./24-synchronization-and-convergence.md)
and the testable invariants in [conformance & testability](./60-conformance-and-testability.md).

---

## How to read this document

- An **FR** states *what the system does* (a capability/behavior). It does not restate the
  cross-replica correctness guarantees — those are NFRs.
- The single bright line that recurs throughout (and is enforced as an NFR, not duplicated per FR):
  **the only writable thing is a signed, append-only, bitemporal fact**; the read graph is
  `proj(factSet)`, a deterministic projection — never an authoritative store (§3.4, §4b.4).
- Where a normative TypeScript shape belongs to a sibling doc it is linked, not copied. The
  authoritative API shapes live in [SDK API surface](./40-sdk-api-surface.md) (§6).

---

## FR group A — Write & transaction operations

The substrate's *only* writable shapes are signed-fact authoring inputs (`AssertInput` /
`RetractInput`); everything else compiles to them (§6, §4.1).

- <a id="fr-a1"></a>**FR-A1 — Assert a fact.** The system MUST provide `assertFact(input: AssertInput)` that appends a
  single signed `assert` fact (one statement about one node-prop / edge / edge-prop / node-existence /
  schema / key / control target) and returns `{ factId, status }`. The caller (author) stamps and signs
  the fact including its author-HLC **and the schema version `v`** (both are in the canonical signed
  payload, §2.4); kip annotates only the post-hoc, non-signed fields (`id`=CID of the canonical
  payload, audit-only `rxFrom`). **Source: §2.4, §4.1, §6.**
- <a id="fr-a2"></a>**FR-A2 — Retract a fact.** The system MUST provide `retractFact(input: RetractInput)` that appends a
  signed `retract` fact (a bounded `validTo`) which closes or *splits* a valid-time interval; a retract
  in the middle of an interval MUST leave a first-class `unknown` gap, not an error and not an asserted
  `null`. **Source: §4.1, §4.2, §6.**
- <a id="fr-a3"></a>**FR-A3 — Durability signalling.** `assertFact`/`retractFact` MUST return `status ∈ {"pending","durable"}`.
  A buffered-but-uncommitted fact returns `"pending"`; the caller MUST treat a `pending` id as
  non-durable until a `commit()`/`txn` resolves. There MUST be no path where a `"durable"` ack precedes
  the commit. **Source: §3.2 (m-9), §6.**
- <a id="fr-a4"></a>**FR-A4 — Memory transactions.** The system MUST provide `txn(fn)` that batches many facts into
  **one** commit (one commit per transaction) and returns `{ result, commit }` only after the commit is
  the publish point (so all its facts are `"durable"`). A partially-written buffer MUST NOT be visible.
  **Source: §3.2 (commit granularity), §7 (atomicity), §6.**
- <a id="fr-a5"></a>**FR-A5 — Flush buffered facts.** The system MUST provide `commit(message?)` to flush auto-batched
  facts into a single commit on the replica branch. **Source: §6.**
- <a id="fr-a6"></a>**FR-A6 — Convenience folds.** The system MAY provide `putNode(node)` / `putEdge(edge)` as thin sugar
  that compile to `assert` node-existence + prop / edge + edge-prop facts. They MUST change state *only*
  by appending signed facts (there is exactly one way to change state). **Source: §6 (design notes).**
- <a id="fr-a7"></a>**FR-A7 — Accretion-only surface.** The API MUST NOT expose `delete`/`update`. "Update" is a new
  assert; "delete" is a `retract`; byte-level forgetting is `tombstone`/`excise` (FR-F group).
  **Source: §4.1, §6.**

> The write path's *admission rule* (signature-only gate; key-registration / authority / revocation /
> backdating are NOT gates but proj-time demotions) is a correctness property — see
> [NFR-SEC group](./11-non-functional-requirements.md#nfr-group-d--security-trust--revocation).

---

## FR group B — Reads, traversal & bitemporal queries

- <a id="fr-b1"></a>**FR-B1 — Read a node / edge.** The system MUST provide `getNode(eid, asOf?)` and
  `getEdge(eid, asOf?)` returning a projected `NodeView`/`EdgeView` (or `null`). Each projected property
  is a `PropCell` carrying its own provenance and temporality; a cell projects to non-overlapping
  valid-time segments where uncovered sub-intervals read as `unknown`. **Source: §2.1, §6.**
- <a id="fr-b2"></a>**FR-B2 — Typed graph traversal.** The system MUST provide `query(spec: TraversalSpec)` — typed,
  directional, as-of BFS/DFS with a seen-set that crosses **only** edges valid at the query's
  `validTime` and known as-of its `txTime`. **Source: §5.2, §6.**
- <a id="fr-b3"></a>**FR-B3 — Bitemporal as-of read.** The system MUST provide `asOf(asOf)` returning a read-only graph
  view over the two independent temporal axes (valid time, transaction time). `asOf({validTime})` MUST
  be a proj-pure, convergent world-truth lens; `asOf({txTime, believer})` MUST be the per-replica,
  explicitly **non-convergent** belief-audit lens resolved against the believer's `rxFrom`-ordered fact
  frontier (never a commit CID). **Source: §4.2, §4.3, §6.**
- <a id="fr-b4"></a>**FR-B4 — As-of across excision.** A read that resolves *through* an excised fact MUST return a typed
  `"excised"` placeholder segment (or error if `excised:"error"`), never silently fabricated data.
  **Source: §4.3, §4.5.**
- <a id="fr-b5"></a>**FR-B5 — Conflict & quarantine visibility on read.** Reads MUST surface tied/ambiguous resolutions
  as explicit `conflict` cells / `kip:conflict` nodes and non-conforming or untrusted facts as typed
  `kip:schema-violation` / `quarantined` / `untrusted` segments — visible and queryable, never silently
  dropped or defaulted. **Source: §2.2, §3.4, §7 (N5).**

---

## FR group C — Hybrid retrieval & recall

- <a id="fr-c1"></a>**FR-C1 — Salience-ranked hybrid recall.** The system MUST provide `recall(q: RecallQuery)` realizing
  the hybrid pipeline: vector ANN candidates → bounded graph expansion (as-of-valid edges,
  `hops`/`maxFanout` caps) → Reciprocal Rank Fusion (RRF) over vector / graph-proximity / salience
  ranks, with final salience/recency reweight. Returns top-k results with provenance; conflicted cells
  MUST be surfaced explicitly. **Source: §5.1, §6.**
- <a id="fr-c2"></a>**FR-C2 — Bounded graph expansion.** Graph expansion MUST be bounded and opt-in (`hops`,
  `maxFanout`), never unbounded, to fight context dilution. **Source: §5.1.**
- <a id="fr-c3"></a>**FR-C3 — Caller-supplied embeddings.** kip consumes embeddings/extracted facts; it MUST NOT produce
  the embedding model, LLM, or extraction pipeline (a client concern, N2). The vector index is a
  pluggable accelerator projection. **Source: §1 (N2), §5.1, §5.3.**
- <a id="fr-c4"></a>**FR-C4 — Salience projection.** The system MUST compute salience as a *derived projection*
  (`salience(eid)`), never an authored property — a function of recency (HLC age), access frequency
  (`read`-event facts), confidence, and graph centrality with declared weights and a half-life.
  **Source: §5.4, §6.**
- <a id="fr-c5"></a>**FR-C5 — Reproducible recall under a fixed `asOf`.** A `recall` at a fixed `asOf` MUST be a pure
  function of the as-of fact-set: salience inputs MUST be bounded by `asOf.txTime` (only `read` facts
  with `rxFrom ≤ asOf.txTime` count), so a recall cannot observer-effect its own ranking.
  **Source: §5.4 (m-7).**

---

## FR group D — Synchronization, merge & distribution

- <a id="fr-d1"></a>**FR-D1 — Sync.** The system MUST provide `sync(remote, opts?)` that exchanges *only missing fact
  objects* (git content-addressed delta) and applies the set-union merge. It MUST return a typed
  `SyncReport` (`received`/`sent`/`merged`/`conflicts`/`tip`). **Source: §4b.2, §6.**
- <a id="fr-d2"></a>**FR-D2 — Explicit merge.** The system MUST provide `merge(from, opts?)` performing the typed
  set-union merge between branches/replicas. Merge is mechanically convergent under *any* topology
  (star-via-main or peer mesh); `/heads` is **regenerated**, not text-merged. **Source: §3.4, §4b.5, §6.**
- <a id="fr-d3"></a>**FR-D3 — Typed conflicts, never auto-picked.** `sync`/`merge` MUST return conflicts as typed values
  (`Conflict[]`); kip MUST NOT silently auto-resolve an ambiguous merge (N5). **Source: §6, §7 (N5).**
- <a id="fr-d4"></a>**FR-D4 — Branch-per-replica writes.** Each agent MUST write only to its own
  `refs/kip/replicas/<id>` branch (no cross-agent write serialization → coordinator-free); a shared
  `main` trunk is a convenience anchor, not a correctness requirement; `refs/kip/sessions/<runId>` are
  short-lived read pins. **Source: §4b.5, §3.3.**
- <a id="fr-d5"></a>**FR-D5 — Frontier-addressed snapshot pin.** The system MUST provide `pin(scope, asOf?)` returning a
  `SnapshotRef` that content-addresses the **author-HLC frontier + `factSetDigest`** (the durable
  resolution target) — and MUST carry **no commit CIDs**, so a pin re-resolves after any excision
  rewrite, including concurrent excision. A pin MUST report `pin-incomplete` (never a silent partial
  read) until every sub-frontier fact is present. **Source: §4c, §4.5, §6.**
- <a id="fr-d6"></a>**FR-D6 — Incremental update stream.** The system MUST provide `subscribe(scope, since?)` yielding an
  `AsyncIterable<FactDelta>` keyed by a per-replica author-HLC **frontier cursor** (never a scalar HLC,
  so causally-late deliveries are never skipped). A delta's `affected` MUST list **every** entity whose
  head changed since the cursor — including heads re-folded due to a revocation or excision re-demotion.
  **Source: §4c, §6.**
- <a id="fr-d7"></a>**FR-D7 — Idempotent ingestion.** Re-ingesting an already-held fact MUST be a strict no-op (the fact's
  id is its content CID including the signed author-HLC), with no double-counting and no duplicate
  valid-time intervals. **Source: §4b.2 (INV-7), §6.**

---

## FR group E — Provenance, audit & history operations

- <a id="fr-e1"></a>**FR-E1 — Provenance trace.** The system MUST provide `provenanceOf(ref: EID | FactId)` returning the
  asserting fact(s)' provenance — actor, signature, authority chain, and `source` — so any value can be
  cited/justified back to its asserting fact and source. **Source: §2.4, §4c, §6, §8.3a.**
- <a id="fr-e2"></a>**FR-E2 — Integrity check (`fsck`).** The system MUST provide `fsck()` that proves `heads ==
  proj(facts)`, verifies **all fact signatures**, and verifies every fact's author key chains to the
  tenant genesis root for its namespace **at the fact's author-HLC**, and (post-excision) that no excised
  residue survives in `/heads`. `fsck` MUST NOT check commit signatures (commits are transport, not
  trust). `fsck` is a **local** integrity check, not a convergence proof. **Source: §8.3a, §6.**
- <a id="fr-e3"></a>**FR-E3 — Read-latency rollup.** The system MUST provide `rollup(opts)` that writes a `kip:rollup`
  marker (covered HLC range + pre-rollup tip CID) and materializes a `/heads` snapshot to bound
  traversal cost. Rollup MUST NOT free bytes — old fact blobs remain reachable and auditable. **Source:
  §3.5, §6.**
- <a id="fr-e4"></a>**FR-E4 — As-of history.** The system MUST support reconstructing history along both temporal axes via
  `asOf` (FR-B3). The audit `txTime` lens addresses the **fact frontier** (`rxFrom ≤ T`), never a commit
  CID. **Source: §4.3.**

---

## FR group F — Forgetting (tombstone / excision)

Two logical (append-only, signature-preserving) mechanisms and one physical (authorized history-rewrite)
mechanism. The spec states plainly that **excision is the one operation that breaks pure append-only.**

- <a id="fr-f1"></a>**FR-F1 — Tombstone (logical forgetting).** The system MUST provide `tombstone(eid, reason)` that
  appends a signed `tombstone`/`retract` fact, closing/splitting valid-time and removing the entity from
  default reads while **keeping** the original fact, its bytes, and its signature. This is the default
  for "forgetting"; it is auditable, reversible, and does not break content-addressing or signatures.
  **Source: §4.5, §6.**
- <a id="fr-f2"></a>**FR-F2 — Excision (physical erasure).** The system MUST provide `excise(factId, reason)` performing
  an authorized history rewrite that frees the excised bytes and re-folds `/heads` over the remaining
  set so no residue survives. An `excision` fact MUST be signed by a key holding the **`excise` scope**
  for the target's tenant/namespace; an unauthorized excision marker MUST be rejected. **Source: §4.5,
  §8.1, §6.**
- <a id="fr-f3"></a>**FR-F3 — Privacy-safe excision marker.** The signed `excision` fact MUST record a random nonce id (or
  tenant-salted HMAC of the removed CID), the reason/actor/scope, and the set of `/heads` cells to
  re-fold — and MUST NOT carry the raw content CID of low-entropy PII as a stable fingerprint. **Source:
  §4.5 (C-4.3).**
- <a id="fr-f4"></a>**FR-F4 — Excised-aggregate flagging.** When excision removes an input to a `pncounter`/aggregate cell,
  `proj` MUST project a `kip:excised-input` provenance flag so a reader knows the aggregate is
  post-erasure and possibly incomplete. **Source: §4.5 (m2-3).**
- <a id="fr-f5"></a>**FR-F5 — Soft-forget (decay/eviction).** The system MAY drop entities from hot projections without
  touching git (reversible). **Source: §4.5.**

> Excision's confluence (deterministic DAG regeneration) and its convergence-window bound are correctness
> properties — see [convergence](./24-synchronization-and-convergence.md) and the relevant NFRs.

---

## FR group G — Schema / ontology evolution

- <a id="fr-g1"></a>**FR-G1 — Per-tenant versioned ontology stored as facts.** Schema (NodeKindDef / EdgeKindDef) MUST be
  a per-tenant, mutable ontology, itself versioned and stored as facts under `/ontology`, so schema
  history is auditable and as-of-queryable. **Source: §2.2.**
- <a id="fr-g2"></a>**FR-G2 — Upcasting in `proj`, not a write gate.** Ontology MUST be applied in `proj` via versioned
  upcasters keyed to each fact's own `validFrom`/version; it MUST NOT be a write-time gate that rejects
  facts. A non-conforming or unknown-version fact MUST project to a typed `kip:schema-violation` /
  quarantined segment (passthrough-as-opaque for future versions), never dropped, never inventing data.
  **Source: §2.2.**
- <a id="fr-g3"></a>**FR-G3 — Cardinality & inverse are projected, not gated.** `cardinality` and `inverse` MUST be
  surfaced by `proj` (a violation projects `kip:cardinality-violation`; an `inverse` declaration
  materializes the reciprocal adjacency), never enforced as a write gate. **Source: §2.2 (m-12).**

---

## FR group H — Memory dynamics (episodic / semantic / consolidation)

- <a id="fr-h1"></a>**FR-H1 — Co-resident episodic & semantic layers.** The system MUST represent episodic and semantic
  memory as two co-resident layers in **one** graph (distinguished by node kind and a `memoryClass`
  facet), not separate stores. **Source: §2.3.**
- <a id="fr-h2"></a>**FR-H2 — Consolidation as facts.** The system MUST provide a `consolidate` control fact type and the
  `derived_from` provenance edge so a background pass MAY assert semantic nodes/edges linked back to
  source episodes. Consolidation MUST be idempotently re-runnable (same inputs ⇒ same consolidation
  facts, keyed by source CIDs); *which* episodes to consolidate is an above-core concern. **Source: §4.4.**
- <a id="fr-h3"></a>**FR-H3 — Decay & salience recomputation.** Decay MUST be a scheduled recomputation of the salience
  projection with a time-discount (writing no facts); a node below a floor becomes a
  consolidation/forgetting candidate. **Source: §4.4, §5.4.**

---

## FR group I — Active knowledge: contextual functionalities

The active layer lets relations *carry computation*. Its single load-bearing rule is **INV-A1:
microagents are clients, never the substrate** — a microagent MUST NOT write the graph; its output
enters kip **only** as a signed fact authored by the orchestrator. **Source: §5b.**

- <a id="fr-i1"></a>**FR-I1 — Register a contextual functionality.** The system MUST provide
  `registerFunctionality(edgeKind, manifest)` that emits signed microagent-registration +
  `FunctionalityBinding` facts binding a microagent to an `EdgeKind`. Registration MUST be **additive**:
  N realizers MAY bind one `(edgeKind, sourceKind, targetKind)`, enumerated as `Segment.alternatives`
  and **never silently picked** (N5). The descriptor is advisory *selection* metadata only; it MUST NOT
  gate fact membership. **Source: §5b.1, §6.**
- <a id="fr-i2"></a>**FR-I2 — Run a contextual query.** The system MUST provide `runContextualQuery(q: ContextualQuery)`
  as a two-phase operation: **(a) compile + match** — a pure read over `proj` at `q.asOf` producing a
  `Segment` (and its `alternatives`); **(b) execute** — walk the steps in the deterministic topological
  order over `Segment.deps`, dispatch the bound microagent per step, validate its output against the
  manifest `outputSchema`, and author the results as signed `assert` + `derived_from` facts that record
  the resolved `asOf`. It returns an `AnswerGraph` read back from the `derived_from` subgraph. **Source:
  §5b.1, §6.**
- <a id="fr-i3"></a>**FR-I3 — Multi-segment / multi-realizer typed choice.** When more than one segment satisfies the
  linkage (or more than one realizer binds a hop), the system MUST surface **all** as a typed choice;
  declared `weight` and advisory `tags` MAY *order* the presentation but MUST NOT collapse it to a silent
  winner. **Source: §5b.1 (INV-A7), §6 (N5).**
- <a id="fr-i4"></a>**FR-I4 — N5-safe step outcomes.** Each executed step MUST resolve to one of the five N5-safe outcomes:
  *success* (author facts); *dispatch failure* (non-zero exitCode / outputSchema-validation failure /
  timeout — emit no fact, cell stays `Unknown`); *constraint-violation* (seed fails the binding's
  `constraint` over `proj` — no dispatch, no fact, violated constraint recorded in provenance);
  *pending guard* (`requires`/`condition` unmet over `proj` — no dispatch, `Unknown`, unmet guard
  recorded); *upstream stop* (any of the above on an upstream step halts the segment). A fabricated
  plausible output is the banned fallback. **Source: §5b.1 (INV-A3), §6.**
- <a id="fr-i5"></a>**FR-I5 — Guards & inheritance are pure proj reads.** Conditional (`requires`), constraint, condition
  guards, and `is_a` inheritance resolution MUST be evaluated as pure reads over `proj` (declared
  `/ontology` data, never runtime floats or an in-code class hierarchy); `unknown` PropCells propagate
  `unknown` and MUST NOT be defaulted. **Source: §5b.1.**

---

## FR group J — Active knowledge: autoencoding (learn)

- <a id="fr-j1"></a>**FR-J1 — Run the autoencoding loop.** The system MUST provide `learn(rawRef, opts)` that runs the
  `encode → decode → reconstruction-loss → learner` loop **outside `proj`** under an explicit, *total*
  disjunctive budget (`maxIterations ∨ maxWallMs ∨ maxInvocations` — the first axis to cap its limit
  trips `exhausted`), so there are no unbounded loops. **Source: §5b.2, §6.**
- <a id="fr-j2"></a>**FR-J2 — Explicit microagent selection.** `learn` MUST select the encode / decode / learner / loss
  microagents explicitly from `LearnOptions` (`(name, version)` of registered manifests); kip MUST NOT
  heuristically pick a manifest by `rawKind` (N5). An unregistered/unsigned named manifest MUST be
  rejected, never substituted. The `rawKind` MUST be threaded unchanged into every `DecodeAgent`.
  **Source: §5b.2, §6.**
- <a id="fr-j3"></a>**FR-J3 — Record the result as a fact.** On **accept**, `learn` MUST commit a signed `kip:learn` fact
  naming its inputs (`rawRef` + the selected `(name, version)`s) + achieved loss + accepted
  `AssertInput[]`; on **exhaustion**, it MUST commit a signed `kip:learn-exhausted` marker and **no**
  accept fact (N5). Replicas fold the recorded result and MUST NOT re-run the loop. **Source: §5b.2, §6.**
- <a id="fr-j4"></a>**FR-J4 — Loss is a search signal only.** The achieved loss is recorded for audit but MUST be excluded
  from `orderKey` and from every reducer/trust decision (exactly as `rxFrom` is); the `kip:learn` winner
  is chosen by ordinary author-HLC `orderKey`, never by loss. **Source: §5b.2.**

---

## FR group K — Active knowledge: mining, discovery & ingestion

- <a id="fr-k1"></a>**FR-K1 — Run a standalone acquisition family member.** The system MUST provide
  `runAcquisition(manifest, input, opts?)` that dispatches a standalone (non-edge-bound)
  Miner / Discoverer / Ingestor / RDF-import-export family microagent and commits its
  `AcquisitionResult.proposed` as **signed** facts (quarantined until trusted; `same_as` → signed
  `same_as` facts) via the orchestrator-only `assertFact` path (INV-A1). **Source: §5b.3, §6.**
- <a id="fr-k2"></a>**FR-K2 — Source provenance & EID dedup.** All acquisition-family microagents MUST emit signed facts
  carrying source provenance and MUST dedup by EID (the patent node-merge). **Source: §5b.3.**
- <a id="fr-k3"></a>**FR-K3 — Open-set extensibility.** The family set MUST be **open**: any manifest whose output
  validates as an `AcquisitionResult` / binding `outputSchema` is a family member (edge-bound ⇒
  `runContextualQuery`, sourceless ⇒ `runAcquisition`) with no core change needed. **Source: §5b.3.**

---

## FR group L — Security & trust operations

> The *correctness* of these operations (set-pure, author-HLC-keyed, byte-identical demotions) is an NFR
> — see [security & revocation NFRs](./11-non-functional-requirements.md#nfr-group-d--security-trust--revocation)
> and [security, trust & tenancy](./50-security-trust-tenancy.md).

- <a id="fr-l1"></a>**FR-L1 — Signed, scoped key authorization.** The system MUST record key authorizations as signed
  facts (`target.kind:"key"`) binding `key → { namespaces, ops: ("write"|"delegate"|"excise"|"revoke"|"resolve"|"excise-evidence") }`
  with an author-HLC `effectiveFrom`, valid (trusted by `proj`) only if the authorizing key chains to the
  tenant genesis root at the key-add's author-HLC. **Source: §8.1, §6.**
- <a id="fr-l2"></a>**FR-L2 — Revoke a key.** The system MUST provide `revokeKey(keyFpr, effectiveFrom, reason, mode?)`
  emitting a signed `revoke-key` fact. `effectiveFrom` is **author-HLC** (compared to each fact's
  author-HLC in `proj`, never `rxFrom`). `mode` declares revoker intent: `"ordinary-cutoff"` (the safe
  default — demote only facts with author-HLC ≥ `effectiveFrom`, preserving honest concurrent work) or
  opt-in `"causal-cutoff"` (also demote non-ancestors, surfacing honest-concurrent casualties as
  `kip:revoked-concurrent`). Revocation **demotes, does not delete** (N5). **Source: §8.1, §6.**
- <a id="fr-l3"></a>**FR-L3 — Re-attest a revoked-concurrent casualty.** The system MUST support a `re-attest` fact
  (`type:"assert"` carrying `reAttests: FactId`, signed by a currently-trusted, non-revoked key holding
  `write` scope) that restores a `kip:revoked-concurrent` casualty's honest content to a trusted head
  under fresh provenance while the original demoted fact stays verifiable in history. **Source: §8.1
  (m5-3), §4.1.**
- <a id="fr-l4"></a>**FR-L4 — Scoped tenancy lens.** The system MUST provide `withScope(scope)` returning a
  tenant/namespace-scoped `Repo` lens. A tenant-A key MUST never be an authority for a tenant-B
  namespace (structural isolation). The client-side write guard is **advisory** (not a DoS control); the
  authoritative cross-replica bound is the set-pure `proj` demotion plus retention. **Source: §8.1, §8.2,
  §8.3b (m4-5), §6.**
- <a id="fr-l5"></a>**FR-L5 — Conflict adjudication via `resolve` scope.** A key holding the `resolve` scope MUST be able
  to author a dominating `supersede` that clears a `kip:conflict` (single-writer adjudication); a
  re-attest (FR-L3), not a `resolve`-scoped re-assert, is the primitive for a revocation casualty.
  **Source: §8.1 (M3-1), §3.4.**
- <a id="fr-l6"></a>**FR-L6 — Secret redaction on export.** The system MUST redact secret-named cells
  (`token|secret|password|…`) at read for unprivileged scopes. **Source: §8.3.**

---

## Traceability summary

| Group | Capability area | Primary SPEC sources |
|---|---|---|
| A | Write & transaction ops | §3.2, §4.1, §6, §7 |
| B | Reads, traversal, bitemporal | §2.1, §4.2, §4.3, §5.2, §6 |
| C | Hybrid retrieval & recall | §5.1, §5.4, §6 |
| D | Sync, merge, distribution | §3.4, §4b.2, §4b.5, §4c, §6 |
| E | Provenance, audit, history | §2.4, §3.5, §4.3, §6, §8.3a |
| F | Forgetting (tombstone/excise) | §4.5, §8.1, §6 |
| G | Schema / ontology evolution | §2.2, §6 |
| H | Memory dynamics | §2.3, §4.4, §5.4 |
| I | Contextual functionalities | §5b.1, §6 |
| J | Autoencoding (learn) | §5b.2, §6 |
| K | Mining / discovery / ingestion | §5b.3, §6 |
| L | Security & trust ops | §8.1, §8.2, §8.3, §6 |

> Every FR traces to a normative spec capability. No FR introduces a new requirement, guarantee, or
> behavior beyond the cited sections, and none contradicts the convergence core (§3.2 signature-only
> gate, §3.4 set-pure `proj`, §4b.4 SEC, §5.3 accelerator boundary, N5 no-fallbacks, INV-A1).
