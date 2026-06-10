# Glossary / Terminology

> Authoritative definitions for every load-bearing term in the kip-sdk spec.

**Source:** SPEC §1 Terminology (lines ~209–240), plus terms used throughout (§2, §3, §4, §4b, §5b).

> SPEC.md remains the authoritative source. Each entry is a faithful condensation of the spec's
> own definition with its §-citation; consult the cited section for full normative detail.

---

## Core data & projection

**Fact** — The atomic, immutable, signed, bitemporal unit of change. Asserts or retracts one
statement about one node or edge. The *only* writable thing. (§1, §2.4)

**Fact set / substrate** — The grow-only set of all delivered facts. A CRDT under union (associative,
commutative, idempotent). The *state* that converges. (§1; see
[convergence](./24-synchronization-and-convergence.md))

**Node / Edge** — *Projected* graph entities, reconstructed by `proj` over the relevant facts. Not
stored directly. (§1, §2.1)

**Cell** — One property of one entity across valid-time; the granularity at which `proj` materializes
state. Produced **only** by `proj`, never authored or text-merged. Its segments are non-overlapping;
any uncovered valid-time sub-interval projects as an explicit `unknown` segment. (§2.1, §3.4)

**`proj`** — The deterministic, pure, total function `proj(factSet) → heads/graph`. Order-independent
by construction (sorts once by a total `orderKey`, then sweep-line folds). All trust decisions live
*inside* `proj`. (§3.4, §4b.4)

**Projection** — A derived, rebuildable read model. **Deterministic** projections (heads, graph
adjacency, salience-with-fixed-weights) are byte-identical across replicas; **accelerator**
projections (ANN/embeddings) are best-effort, *not* byte-identical (§5.3, INV-5). (§1)

**RRF (Reciprocal Rank Fusion)** — The rank-only fusion step of hybrid retrieval:
`score(d) = Σ_r 1/(rrfK + rank_r(d))` over the per-retriever ranks (vector / graph-proximity / salience).
Uses ranks only (never raw scores), so heterogeneous retrievers fuse without score calibration. (§5.1;
see [retrieval](./26-retrieval.md))

**`orderKey`** — The total order `proj` sorts the admitted fact set by before folding. Every reducer's
final tiebreak MUST terminate in `orderKey`, so resolution is always total and deterministic (INV-3).
Reads author-HLC only; never `rxFrom`, never reconstruction loss. (§3.4)

## Identity & addressing

**Entity id (EID)** — **Namespaced, cryptographically anchored** stable identity of a node/edge:
`<tenant>/<namespaceId>/<localId>`. `namespaceId` is a **FROZEN genesis id**, stable across key
rotation/revocation (M2-3). Equality requires equal namespace. (§3.6)

**Content id (CID)** — git object id (SHA-1 or SHA-256, fixed per convergence group) of an immutable
value. (§1, §2.1)

**Dual-id scheme** — EID (stable identity for equality) + CID (content addressing for
integrity/dedup/sync) layered together; resolves the identity-vs-content-addressing tension (T-1).
(§3.6; see [git substrate](./22-git-substrate.md))

## Time & clocks

**HLC (Hybrid Logical Clock)** — The stamp on every fact: `(wall, counter, replicaId)`. Author-stamped
and signed. (§4b.1)

**Author-HLC** — The fact's own author-stamped, signed `hlc`. The **only** time axis `proj` ever reads
— for `orderKey`, valid-time geometry, *and* authorization/revocation/plausibility. Set-resident ⇒
identical on every replica. (§4.1, §4b.1)

**Valid time** — When a fact is true *in the modeled world* (`validFrom`/`validTo`). MAY contain
**gaps** (Unknown). (§4.2; see [temporality](./23-temporality-and-bitemporality.md))

**Transaction time (`rxFrom`)** — **Receiver-assigned, AUDIT-ONLY**: the HLC the *receiving* replica
stamps when it first verifies and ingests a fact. Used **only** for per-replica "believed-then" audit
reads, which are explicitly **non-convergent**. **Excluded from `proj`, `orderKey`, and every
trust/revocation decision** (C2-1). (§4.2, §4.3)

**Replica** — An independent kip instance (one agent / one process) with its own branch and its own
ingest order. (§1)

## Membership & trust (the convergence core)

**INGEST-GATE** — The **signature-validity-only** admission predicate (well-formed ∧ Ed25519 signature
verifies over the canonical payload). Decides set *membership* only; a pure function of the fact's
bytes ⇒ identical on every honest replica. **Never** decides a projected value, and **never** consults
drift, key-registration, authority, or revocation (C2-1, C3-1, M3-4). (§3.2)

**PROJ-demotion** (also written **`proj`-demotion** / **proj-time demotion**) — All trust decisions —
key-registration, namespace-authorization, revocation, *and* author-HLC causal plausibility
(anti-backdating) — made **inside `proj`**, keyed on author-HLC over the admitted set. Set-pure ⇒
convergent. A demoted fact is `untrusted`/`quarantined`, never dropped, and re-evaluated monotonically
as facts arrive. (§3.6, §8.1)

**Projection trust states** — The trust label `proj` stamps on each admitted fact (the core output
vocabulary of a PROJ-demotion):
`trusted | pending | untrusted-anachronistic | untrusted-malformed | quarantined`. **`trusted`** —
projects over a complete, authorized, non-anachronistic chain. **`pending`** — chain not yet complete
(e.g. a `(wall,counter)` gap from a missing/evicted same-key link), held back, never silently trusted.
**`untrusted-anachronistic`** — a same-key higher-author-HLC non-ancestor fact exists in the complete
chain (backdating). **`untrusted-malformed`** — a forward (`> child`) or cyclic `causedBy` edge (§3.6).
**`quarantined`** — demoted for trust (e.g. unregistered/unauthorized key), retained not dropped. This
is a **trust** axis stamped by `proj`; it is **orthogonal** to the byte-retention `RetentionClass`
axis, and the trust state `quarantined` is **not** the retention class `quarantined-ttl`. (§3.6, §8.1)

**Causal plausibility** — A set-pure anti-backdating rule (replaces the v2 receiver-clock drift gate). A
fact `F` from key `K` projects **trusted** only over `K`'s **complete gap-free `(wall,counter)` chain**
up to `F` (else **`pending`**); once complete it is demoted `untrusted-anachronistic` if `S` holds a
**higher-author-HLC, non-ancestor** fact from the **same** `K` in that complete chain (per-key
monotonicity — reads `K`'s involuntary footprint, not forgeable by omitting `causedBy`, C4-2; not
defeatable by eviction — an evicted link yields a `(wall,counter)` gap ⇒ `pending`, C5-1). Compared
only to set-resident author-HLCs, never to a receiver clock. (§3.6, §8.1, §4b.1)

**Authority** — A key (Ed25519) authorized, by a signed chain rooted in the tenant root key, to write a
given EID **namespace** and/or perform scoped ops (excise, revoke), **as of an author-HLC interval**.
Key-registration, namespace authority, and revocation are **all** proj decisions keyed on author-HLC;
**only** signature validity is an ingest-gate predicate. (§2.4, §8)

**SEC (Strong Eventual Consistency)** — The convergence guarantee: convergence = **set-convergence** (the fact set is a G-Set/CRDT
under union) **+ projection determinism** (`proj` is pure and total). Under partial replication it is
stated **per-shared-subset** / on the complete durable subset (C4-1, M5-1, C5-1). (§4b.4, §7; see
[convergence](./24-synchronization-and-convergence.md))

## Forgetting

**RetentionClass** — The per-fact **byte-retention** class `proj` computes as a pure function of `S`,
read by the transport layer to decide eviction:
`{durable, key-chain-durable, quarantined-ttl, evicted}`. **`durable`** — a trusted-author fact, MUST
NOT be evicted. **`key-chain-durable`** — a registered key's chain, preferentially retained up to
`keyChainDurableCapBytes` (M6-1). **`quarantined-ttl`** — an unregistered-key fact stored under a
bounded per-key cap + TTL + global pool budget (m5-1). **`evicted`** — bytes freed. This is a
**byte-retention** axis, **orthogonal** to the projection-trust axis (Projection trust states); the
retention class `quarantined-ttl` is **not** the trust state `quarantined`. (§3.5a, INV-18)

**Tombstone (logical)** — Signature-preserving forgetting via a retraction fact; pure append-only,
keeps verifiability of what remains. (§4.5; see [temporality](./23-temporality-and-bitemporality.md))

**Excision (physical)** — The one authorized history-rewrite that frees bytes and breaks pure
append-only; stated plainly and scoped (the SEC theorem is stated over the non-excised admitted set).
(§4.5, §4b.4)

## Active knowledge (§5b)

**Functionality / Microagent** — A genty microagent (`IsolationMode` `subprocess`/`worker`/`container`)
with a declared `inputSchema`/`outputSchema`, invoked as a `MicroagentInvocation` returning a
`MicroagentResult`. The patent's "functionality." A **client** of kip, **never the substrate**: its
output is wrapped as signed facts, never written to the graph directly (**INV-A1**). (§5b.1; see
[active knowledge overview](./30-active-knowledge-overview.md))

**Functionality descriptor** — A `MicroagentManifest` (`name`, `version`, `description`, `inputSchema`,
`outputSchema`, `isolation`, `runtime{…}`, `tags`, `builtIn`). Advisory **selection** metadata only — it
ranks *which* microagent to dispatch; it **never** gates fact membership (only the Ed25519 signature
does, C2-1). (§5b.1)

**Contextual relation** — An `EdgeKind` whose ontology definition references one or more bound
microagent functionalities (`FunctionalityBinding`). The edge is both a navigation edge and a unit of
computation. (§5b.1; see
[contextual functionalities](./31-contextual-functionalities.md))

**Query graph / Segment match** — A **contextual query** (known seed + desired target `NodeKind` +
linkage expression) compiles to a small **query graph** matched against a **segment** over the ontology
graph. A segment is an ordered path in the linear case and MAY be a dependency **DAG** (`Segment.deps`),
executed in deterministic topological order read purely over `proj`. Compilation is a pure read over
`proj`; only execution emits facts. Multiple matching segments surface as a typed choice, never silently
picked (N5). (§5b.1)

**`AnswerGraph`** — The result of `runContextualQuery`: the union of the `derived_from` edge facts a
segment's steps author, read back via `proj` (INV-A8). On any active-layer failure (an
[upstream-stop](./27-failure-and-conflict-model.md#1-the-canonical-outcome-taxonomy), outcome #7) the
query returns an `AnswerGraph` with `result = []` — never a fabricated terminal answer (N5). Defined and
declared (`interface AnswerGraph`) in [31-contextual-functionalities §5b.1](./31-contextual-functionalities.md). (§5b.1)

**Learner microagent** — A microagent that proposes graph edits by running the knowledge-autoencoding
loop and emits the converged result as **signed `kip:learn` facts** naming inputs + achieved loss. It is
a client that *proposes*; `proj` decides what becomes effective. (§5b.2)

**Knowledge autoencoding** — The agentic loop `raw → ENCODE → candidate graph facts → DECODE →
reconstructed raw → loss → LEARNER proposes edits`, iterated until `loss < threshold` **or** any budget
axis caps (`maxIterations` ∨ `maxWallMs` ∨ `maxInvocations` — the budget is **disjunctive** and total,
so no unbounded loops). The *search* is accelerator-class; the *output* is a deterministic set of signed
facts. (§5b.2; see [autoencoding](./32-knowledge-autoencoding.md))

**Reconstruction loss** — A model-relative, **accelerator-class** (non-deterministic, §5.3) distance
between a raw artifact and the artifact reconstructed by a decode microagent from candidate graph facts.
Used **only** as a convergence/search signal; **never** a `proj` input. The *achieved* loss is recorded
inside a signed `kip:learn` fact for audit, and is **EXCLUDED from `orderKey` and every reducer/trust
decision exactly as `rxFrom` is** (C2-1) — the `kip:learn` winner is chosen by ordinary author-HLC
`orderKey`, NEVER by loss. (§5b.2)

**`kip:learn` / `kip:learn-exhausted`** — Reserved `kip:*` system-kinds authored by the autoencoding
loop: on **accept**, a signed `kip:learn` fact naming inputs + achieved loss + accepted `AssertInput[]`;
on **exhaustion**, a signed `kip:learn-exhausted` marker and **NO** accept fact (N5). (§5b.2, §6)

**Microagent families** — Three **core** families realizing the patent
`data-resource → objects-of-interest → query → acquire` pipeline — **Miner** (pulls candidate instances
from external sources), **Discoverer** (expands a query via recall + bounded traversal), **Ingestor**
(normalizes a raw resource into episodic facts) — plus RDF import/export (an Ingestor specialization)
and the **Learner** as a peer grow-the-map family. All emit **signed** source-provenanced facts; dedup
by EID. The set is **open**. (§5b.3; see
[mining, discovery & ingestion](./33-mining-discovery-ingestion.md))

## System-kind facts

**`kip:*` system kinds** — Reserved typed facts `proj` emits for non-silent outcomes: `kip:conflict`
(tied reducer candidates, §3.4), `kip:schema-violation` (non-conforming under current ontology, §2.2),
`kip:cardinality-violation` (multi-cell constraint breach, §2.2), `kip:revoked-concurrent` (causal-cutoff
revocation, §8.1), plus `kip:learn`/`kip:learn-exhausted` (§5b.2). All visible and queryable — the
machinery of N5 (no silent fallback).

## Cross-stack terms (external components referenced by kip)

> These are **external** entities from other a5c packages, not kip types. They appear in kip docs
> either as a model/naming **analogy** or as a real **integration** seam. See
> [stack integration](./28-stack-integration.md) for the full per-component treatment.

**`AtlasRecord` / `Edge`** — The node/edge shapes of `packages/atlas` (`packages/atlas/src/types.ts`):
`AtlasRecord` = `{ id, _kind, _file, _cluster, [key]: unknown }`; `Edge` = `{ from, to, kind,
attributes? }` — **flat and non-temporal**. kip's `NodeView`/`EdgeView` deliberately **mirror** these
(`../SPEC.md:246`) but every field is the *fold of facts*, and kip **adds** bitemporality + provenance
that atlas lacks. atlas `getNeighbors(id,depth)` (bounded BFS) is the "lineage" kip's `TraversalSpec`
makes as-of-valid (`../SPEC.md:1790`). External component referenced by **analogy + ingestion**, not a
kip type. (See [data model §1](./21-data-model.md), [stack integration](./28-stack-integration.md).)

**`AgentMemoryOntology`** — A real kradle CRD kind (`packages/kradle/core/src/resource-model.js:70`,
validated by `validateOntology`) declaring `nodeKinds`/`edgeKinds`/required fields. kip's per-tenant
mutable ontology is **modeled on it** (`../SPEC.md:293` "cf. kradle `AgentMemoryOntology`"), but kip
stores schema **as facts** rather than a Git CRD pointer. External component referenced **by analogy
only — no code dependency**. (See [data model §3](./21-data-model.md).)

**`parseJournalForImport` / kradle snapshot** — `parseJournalForImport`
(`packages/kradle/core/src/agent-memory-import.js:32`) parses a babysitter `.a5c` journal into a
**summary-only** payload; the kradle `AgentMemorySnapshot` (`resource-model.js:72`) pins a **commit CID
+ digests**. kip cites both **by analogy** (`../SPEC.md:352`, `:1677`): kip's episodic import is
summary-only "à la `parseJournalForImport`", and kip's `pin()` is frontier-addressed (drops commit
CIDs) so it survives excision where a commit-pin dangles. External components referenced **by analogy
only**. (See [context-enablement seams](./25-context-enablement-seams.md), [stack integration](./28-stack-integration.md).)

**`MicroagentManifest` (genty-core)** — The descriptor of a kip "functionality" (see the
**Functionality descriptor** entry under *Active knowledge (§5b)* above). It is the real
`@a5c-ai/genty-core` type (`packages/genty/core/src/microagents/types.ts:36`), reused verbatim by kip
(`../SPEC.md:1914`, "do not invent fields"). The genty-platform `MicroagentDispatcher` /
`createMicroagentSystem` (`packages/genty/platform/src/microagents/`) are the **real dispatch path** kip
reuses (GROUNDED-NEW). External component referenced by **direct contract reuse**.

**`OrchestrationProvider` / `JournalProvider` / `OrchestrationRegistry` (genty-platform)** — The
**pluggable-backend seam** kip's babysitter/genty integration depends on. `OrchestrationProvider`
(`createRun`/`iterateRun`/`postEffectResult`/…) and `JournalProvider` (`loadEvents`/`appendEvent`) are
the backend interfaces (`packages/genty/platform/src/orchestration/interfaces.ts:89`, `:137`) that let a
backend plug in **without importing babysitter-sdk**. `OrchestrationRegistry`
(`.../orchestration/registry.ts:58`) holds named `ProviderMap`s: `get(name)` throws on an unregistered
name (no fallback, `:99`), `get()` with no name returns the **first-inserted** provider among distinct
names (`:107`), and a same-name re-registration **overwrites** (`Map.set`, last-write-wins, `:92`).
External component referenced as a **GROUNDED-NEW** integration seam. (See
[stack integration](./28-stack-integration.md).)

**babysitter run journal (`JournalEvent` / `RunMetadata` / `StoredTaskResult`)** — The episodic unit kip
ingests from `@a5c-ai/babysitter-sdk` (`packages/babysitter-sdk/src/storage/types.ts`), read via
`loadJournal`. An ordered, ULID-sequenced log
(`RUN_CREATED → EFFECT_REQUESTED/EFFECT_RESOLVED* → RUN_COMPLETED|HALTED|FAILED`). Ingested
**summary-only** as episodic facts (`../SPEC.md:352`). External component referenced by **ingestion**.

**`UnifiedHookEvent` / hooks-mux** — The canonical harness hook event of `packages/adapters/hooks/core`
(`types/event.ts`): `{ version:'a5c.hooks.v1', adapter, phase, supportLevel, payload, env, … }` with a
`UnifiedExecutionContext` (`sessionId`/`turnId`/`adapter`/`model`/`toolName`). A candidate episodic
source for kip (hook event → episodic `event`/`observation` fact, session/turn as episode keys).
External component referenced as a **GROUNDED-NEW ingest channel**.

**extension-mux** — The plugin compiler of `packages/adapters/extensions` (`compile`/`compileAll`,
`HarnessOutputAdapter.generateMcpConfig`/`generateProgrammaticExtension`) that ships a skill/command/MCP
bundle to every harness target. The path that would **distribute the kip client** (e.g. a kip MCP server
or `/skill:kip-recall`) across harnesses — the same path atlas already feeds. External component
referenced as a **GROUNDED-NEW distribution channel** for kip's client, not a kip type.

---

> For the hard problems (HP-*) and design tensions (T-*) these terms resolve, see
> [prior art & hard problems](./prior-art.md). For the invariant catalog (INV-*, INV-A*) that tests
> them, see [conformance & testability](./60-conformance-and-testability.md).
