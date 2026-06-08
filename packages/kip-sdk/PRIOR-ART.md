# Prior-Art Brief — `@a5c-ai/kip-sdk`

Git-based graph memory: git as the storage substrate (content-addressed objects, refs,
history, branches, merges) for a typed property graph used as agent memory (episodic +
semantic) with graph + semantic/vector retrieval. The core must make **temporal facts +
distributed synchronization** first-class, so a context-management layer can be built on top.

This brief grounds the design in (1) reusable in-repo patterns, (2) external systems
(one borrowable idea + one pitfall each), (3) the hard problems any such core must solve,
and (4) the explicit design tensions.

---

## 1. In-repo patterns to reuse

### 1.1 `packages/atlas` — graph-over-git-tracked-YAML with a derived index

A working "typed property graph stored as files in git, queried via a derived index." This
is the closest existing model to kip-sdk's read path.

**Node/edge model** (`packages/atlas/src/types.ts`):
- `AtlasRecord = { id, _kind, _file, _cluster, ...attributes }` — a node is a typed bag of
  attributes plus provenance fields (`_file` = source path, `_cluster` = top-level dir).
- `Edge = { from, to, kind, attributes? }` — directed, typed, attributed. Edge kinds are
  schema-defined (`schema/edge-kinds.yaml`) with `source`/`target`/`cardinality`/`inverse`.
- Node kinds are schema-defined (`schema/node-kinds/*.yaml`) and counted but not strictly
  enforced at index time — schema is descriptive, not a hard gate.

**Index build** (`packages/atlas/src/indexer.ts`, `buildIndex`):
- Walks git-tracked `graph/**` YAML (a blocklist excludes `schema/tools/wiki/...`), plus
  markdown `wiki/**` (front-matter → `Page` nodes, body → `article` attribute).
- Two node-document shapes supported: a `NodeDocument` with a `nodes: []` array, or a single
  `{ id, kind|nodeKind, attributes, edges }` doc. Edges are extracted from several shapes
  (array form, `{kind: to}` map form, string/array/object values) — `extractEdges`.
- **Identity is author-assigned string ids** (`evidence:*`, `provider:*`, `package:*`, …),
  not content hashes. Duplicate ids: first-wins, except an `agent-catalog` cluster record
  replaces a non-catalog one (a deterministic override rule).
- **Patch/merge records**: a record with `patch: true` / `mergeStrategy: "patch"` is shallow-
  merged onto the base record (`mergeRecordPatch`); patches arriving before their base are
  queued in `pendingRecordPatches` and applied on base arrival; unresolved patches throw.
  This is a hand-rolled, deterministic, order-independent merge — a precursor to what kip
  needs for fact-superseding.
- **Derived edges**: `deriveAttributeEdges` synthesizes edges from attributes (e.g.
  `EvidenceSource.trustLevel → has_trust_level`, `ModelProviderVersion.providerId →
  model_provider_version_of`). Edges are partly *projected* from node data, not only authored.
- Output is one big `index.json` (`IndexShape`: records map, edges array, kind/cluster
  counts, stats) **rebuilt from scratch on every run** — no incremental indexing.

**Query layer** (`packages/atlas/src/index.ts`, `AtlasGraph`):
- Loads `index.json` once; lazily builds in-memory adjacency maps (`incomingByTarget`,
  `outgoingBySource`, `recordsByKind`) on first access and caches them.
- `getNeighbors(id, depth)` = BFS over the union of in/out edges with a seen-set.
- `searchRecords` = naive term-scoring over `JSON.stringify(record)` (id exact > displayName
  > kind > substring). **No vector/semantic search exists yet** — this is the gap kip fills.

**Reuse for kip:** the typed-record + typed-edge + schema-kinds shape; provenance fields on
every node (`_file`/`_cluster` → kip should carry commit/blob/author/clock); the
order-independent patch-merge idea; the derived-edge projection; and the "git is the source
of truth, the index is a rebuildable derivative" contract. **Do not** copy: single-file
full-rebuild indexing (won't scale), author-assigned-id-only identity (kip needs
content-addressing too), or `JSON.stringify` search.

### 1.2 `packages/kradle` — "company brain" agent memory subsystem

Pure-ESM JS controllers (`packages/kradle/core/src/agent-memory-*.js`). The memory model is
**git-repo-backed, K8s-resource-described, snapshot-pinned**.

**Memory model** (`agent-memory-repository-source-controller.js`):
- `AgentMemoryRepository` = an org-level pointer to a **git repo URL** (`spec.repoUrl`,
  validated against https/ssh/git/scp schemes) plus a **retention policy**
  (`maxAgeDays: 90`, `maxSizeMb: 500` defaults). Memory *lives in a git repo* — the controller
  explicitly `mustNotOwn: ['git operations', 'memory search']` (those are downstream).
- `AgentMemorySource` = a read policy over paths into that repo: `paths`/`excludedPaths`
  globs, `readPolicy { mode: 'allow-all', maxDepth: 5 }`, access control. Memory is
  **path-scoped and access-gated**, not a flat store.
- `AgentMemoryOntology` (`agent-memory-import.js`, `validateOntology`) = org-scoped
  `nodeKinds`/`edgeKinds` arrays with duplicate-name detection — i.e. a per-tenant typed
  graph schema, exactly like atlas's schema dir but tenant-owned and mutable.

**Snapshot / sync approach** (`agent-memory-import.js`):
- `parseJournalForImport(journal)` = lossy, **summary-only** projection of a babysitter `.a5c`
  journal into episodic memory: run metadata, structural `keyEvents` (task_completed /
  breakpoint / run_end), and an `effectSummary` (success/failure counts, effect kinds). Raw
  task content and arbitrary effect payloads are deliberately stripped. This is the
  **episodic-memory ingestion contract** — derive structured facts from an append-only event
  log, never copy raw content.
- `createMemorySnapshot({ sessionRef, organizationRef, recordRefs, queryCriteria })` =
  **dispatch-time pinning**: a snapshot is a set of `recordRefs` (pointers to memory records)
  selected by `queryCriteria`, frozen with an id + `createdAt`. An agent run reads from a
  pinned, immutable snapshot rather than live memory — the read-time isolation primitive.
- MCP surface exposes `kradle_sync_external` and `kradle_resolve_conflict` — sync and
  conflict resolution are already modeled as first-class operations (currently for external
  forge sync, but the conceptual slot is the same one kip needs for replica convergence).

**Reuse for kip:** memory = a git repo + a mutable per-tenant ontology; **snapshot-pinning**
as the read-isolation primitive (pin a refset/commit per agent session); **summary-only
episodic ingestion** from journals; retention policy as a forgetting knob; the explicit
sync + conflict-resolution operation slots.

### 1.3 `packages/adapters/tasks` — git-native records + Ed25519 signed facts

The signed-fact-in-git pattern, directly applicable to kip's temporal facts.

**Git-as-store** (`src/backends/git-native.ts`, `GitNativeBackend`):
- Each record is one JSON file in `.breakpoints/<id>.json`; answers in `<id>.answer.json`;
  signed answers in `<id>.proven.json`. **One file per record, committed to git** — history,
  branching, and merge come free from git itself.
- Every record carries an append-only `history[]` (typed transitions with `from/toStatus`,
  actor, timestamp) and an `auditLog[]` — an **embedded per-record event log**, the
  file-level analog of event sourcing.
- State transitions are validated (`validateBreakpointTransition`) and blocking dependencies
  enforced before write — a small state machine over an accreting record.
- `waitForAnswer` polls the filesystem — git is the substrate and the message bus
  (write-a-file → other process sees it). Convergence today is "whoever committed wins,"
  with no causal merge.
- Export **redacts secrets** by key-name regex (`token|secret|password|...`) — a built-in
  redaction pass relevant to kip's forgetting/privacy story.

**Signed facts / provenance** (`src/proven/*`):
- `signAnswer` (`proven/sign.ts`): Ed25519 over a **canonical payload** — a fixed, ordered
  `SIGNED_FIELDS` list joined as `field=value\n`, null/undefined → empty string. The set of
  signed fields is explicit and recorded on the fact (`signedFields`), so verification rebuilds
  the exact payload. **Canonical serialization is the crux of verifiable facts.**
- `ProvenBreakpointAnswer` = the fact + `signature`, `publicKeyFingerprint`, `signedAt`,
  `signedFields`. Keys are Ed25519, fingerprint = SHA-256 of public-key DER (`proven/types.ts`).
- `verifyAnswer` (`proven/verify.ts`): loads trusted public keys from `.keys/trusted/`, matches
  by fingerprint, **checks key expiry against `signedAt`** (a temporal validity check on the
  key itself), then verifies the signature. Unknown key → invalid.

**Reuse for kip:** Ed25519-signed, canonically-serialized facts with an explicit signed-field
set and key-fingerprint provenance; per-record append-only history embedded in the record;
trusted-key directory with temporal key validity; secret redaction on export. This is the
ready-made **signed-temporal-fact** envelope — kip facts should be signed this way so
distributed replicas can verify provenance before merging.

---

## 2. External systems — one borrowable idea + one pitfall each

### Git-as-database

**Dolt** — "Git for Data," versioned SQL tables.
- *Borrow:* **Prolly trees** (content-addressed probabilistic B-trees) give cell-level history,
  structural sharing across versions, and fast structural diff/3-way merge by skipping subtrees
  whose content hashes match. This is the right data structure for a git-substrate graph that
  must diff/merge cheaply rather than rebuild a monolithic index.
- *Pitfall:* Merge granularity bottoms out at the cell — two branches changing the *same* cell
  produce an **unresolvable conflict requiring a policy**; and full history retention plus
  structural-sharing metadata is a real storage cost, with tree rebalancing degrading sharing.
- https://github.com/dolthub/dolt · https://www.dolthub.com/blog/2020-06-16-efficient-diff-on-prolly-trees/ · https://www.dolthub.com/blog/2025-05-16-millions-of-versions/

**TerminusDB** — git-for-data document *graph* database (RDF triples).
- *Borrow:* **Immutable, content-addressed delta layers**: each change is an append/delta-only
  layer; queries traverse the layer stack; periodic **rollup** compresses the stack to keep
  reads fast (~13 bytes/triple via succinct structures). A clean model for "append facts, read
  through a stack, compact periodically" — directly maps to temporal-fact accretion.
- *Pitfall:* An ever-growing layer stack degrades read latency until rollup runs; rollup is a
  global compaction step with its own cost/scheduling problem (the same shape as git-gc).
- https://terminusdb.com/blog/succinct-data-structures-for-modern-databases/ · https://github.com/terminusdb/terminusdb

**Datomic** — accretion-only immutable datoms `[entity, attribute, value, tx]` with as-of.
- *Borrow:* **Accretion-only facts + `as-of` time travel**: never update/delete, only assert
  (and retract via a new fact); query the DB "as of" any past tx point. This *is* the temporal-
  fact model kip needs — every change is a new immutable datom carrying its transaction time.
- *Pitfall:* You **cannot branch from the past** / cheaply fork an alternate history — Datomic's
  single growing log gives time-travel but not git-style divergent timelines; and unbounded
  accretion needs excision/retention tooling that fights the immutability story.
- https://docs.datomic.com/transactions/model.html · https://www.infoq.com/articles/Datomic-Information-Model/ · https://blog.danieljanus.pl/2025/04/22/datomic-forking-the-past/

**Noms** — versioned, forkable, syncable content-addressed database (origin of prolly trees).
- *Borrow:* **Content-addressed chunking + declarative state**: "don't INSERT/UPDATE/DELETE,
  declare what the data ought to be," and identical chunks dedupe automatically — near-identical
  commits write only the diff. Efficient sync falls out of content-addressing (send only missing
  chunks), which is exactly kip's replica-convergence transport.
- *Pitfall:* Pure content-addressing means **identity == content**: a node's "address" changes
  whenever its content changes, so stable *entity* identity must be layered on top (a separate
  id → latest-hash mapping), or you lose the ability to say "the same entity over time."
- https://github.com/attic-labs/noms/blob/master/doc/intro.md

**Irmin** — OCaml git-like distributed store with user-defined merge functions.
- *Borrow:* **Pluggable per-type merge functions + CRDT-backed mergeable structures**: the store
  is git-shaped (clone/push/pull/branch/rebase) but the *merge policy is a parameter*, including
  CRDTs with formal convergence. kip should expose merge as a per-node-kind / per-edge-kind
  strategy rather than hard-coding "last-write-wins."
- *Pitfall:* Custom merge functions must be **provably associative/commutative/idempotent** to
  actually converge; a naive merge function silently breaks convergence under reordering — the
  burden of correctness moves onto whoever writes the merge function.
- https://github.com/mirage/irmin · https://mirage.io/blog/introducing-irmin

### Agent memory / temporal KG

**Zep / Graphiti** — bi-temporal knowledge graph for agent memory.
- *Borrow:* **Bi-temporal edges with invalidation, not deletion**: every edge carries
  `created_at`/`expired_at` (transaction time) and `valid_at`/`invalid_at` (valid time). On a
  conflicting new fact, the system sets `expired_at` and rewrites the old fact as historical
  ("works as" → "used to work as") instead of deleting it — incremental, no full-graph
  recompute. This is the canonical temporal-fact-superseding model for kip.
- *Pitfall:* **Out-of-order (non-chronological) episode ingestion** must be reconciled via
  `valid_at` alignment, and conflict detection/invalidation runs an LLM "invalidation prompt" —
  i.e. supersession decisions can be probabilistic and order-sensitive, not purely mechanical.
- https://arxiv.org/html/2501.13956v1 · https://blog.getzep.com/beyond-static-knowledge-graphs/ · https://neo4j.com/blog/developer/graphiti-knowledge-graph-memory/

**Mem0** — bolt-on memory layer; vector store + optional graph.
- *Borrow:* **Automatic fact extraction + consolidation** from raw conversation into compact
  stored facts ("memory in 3 lines"), with vector retrieval as the default and graph as an
  opt-in for multi-hop — keep the ingestion contract low-friction and the graph optional.
- *Pitfall:* Mem0 **removed its own graph variant** after it lost on single- and multi-hop
  recall, ran ~3× slower, and cost ~2× tokens — a warning that bolting a graph onto a vector
  store without earning its keep adds cost without accuracy. Graph must be justified per workload.
- https://vectorize.io/articles/mem0-vs-letta · https://arxiv.org/pdf/2504.19413

**Letta / MemGPT** — agent runtime treating context as virtual memory.
- *Borrow:* **Self-managed memory blocks + sleep-time consolidation**: the agent edits its own
  memory via tool calls (read/write/search), and a background "sleep-time" process distills and
  reorganizes asynchronously. The async-consolidation pattern fits kip's "write fast, compact/
  promote episodic→semantic later" lifecycle.
- *Pitfall:* Giving the agent explicit control over its own memory makes correctness depend on
  the agent's behavior; it tightly couples memory to a specific runtime (Letta), reducing
  portability — kip should keep memory a substrate, not a runtime.
- https://vectorize.io/articles/mem0-vs-letta

**cognee** — ECL (Extract → Cognify → Load) memory pipeline; vector + graph.
- *Borrow:* **Memory-as-data-engineering (ECL)**: a repeatable pipeline that extracts entities,
  "cognifies" into a typed knowledge graph, and loads into *both* a vector store (semantic) and
  a graph store (traversal). The explicit pipeline boundary is a clean place to put schema and
  provenance enforcement.
- *Pitfall:* The Cognify entity-extraction step is an extra heavyweight stage; pipeline-built
  graphs can drift from source unless ingestion is re-runnable and idempotent — kip ingestion
  must be deterministic and replayable from the git log.
- https://github.com/topoteretes/cognee · https://codepointer.substack.com/p/agent-memory-systems-and-knowledge

### Foundations

**Event sourcing** — state as a replayable append-only event log + projections.
- *Borrow:* **Rebuildable projections + snapshots**: the log is the source of truth; read models
  are projections that can be dropped and rebuilt; snapshot every N events to bound replay. Maps
  perfectly: git history = the event log; kip's index/embeddings = projections; commit pins =
  snapshots.
- *Pitfall:* **Event schema evolution is the hardest long-term problem** — you can't alter
  appended events, so you need *upcasters* (versioned transforms keyed by event type+version)
  applied on read; renaming a field breaks all prior events. kip facts need a version tag + an
  upcaster registry from day one.
- https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/event-sourcing.html · https://letsbuildsolutions.com/blog/system-design/event-sourcing-in-practice-building-an-append-only-event-store-with-projections-and-snapshots/

**CRDTs & convergence / logical clocks.**
- *Borrow:* **Hybrid Logical Clocks (HLC)** — timestamps that combine physical wall-clock with a
  Lamport counter, staying close to real time while guaranteeing causal order. HLC is the right
  clock for kip facts: human-readable-ish *and* causally sound, far cheaper than vector clocks.
- *Pitfall:* **Convergence requires merge ops to be associative + commutative + idempotent**;
  Lamport timestamps can't even detect concurrency (only vector/dotted-version clocks can), so
  picking the wrong clock or a non-commutative merge silently breaks convergence under reordering.
- https://sookocheff.com/post/time/hybrid-logical-clocks/ · https://arxiv.org/pdf/1011.5808 (dotted version vectors) · https://www.taskade.com/blog/crdt-history

**Bitemporal modeling.**
- *Borrow:* **Two independent axes — valid time vs transaction time** — let you insert into the
  past, correct the record, and ask both "what did we believe then?" and "what was actually true
  then?" Foundational for an auditable memory that supports late-arriving and corrected facts.
- *Pitfall:* Maintaining valid-time intervals **without gaps or overlaps** under concurrent
  updates and **late-arriving data** is genuinely hard; naive implementations corrupt historical
  reconstruction.
- https://martinfowler.com/articles/bitemporal-history.html · https://www.juxt.pro/blog/value-of-bitemporality/

**Content-addressed storage (git substrate).**
- *Borrow:* git objects give **dedup, integrity, and cheap sync** for free; blobs/trees/commits
  are content-addressed, so identical content is stored once and sync transfers only missing
  objects.
- *Pitfall:* **Many small loose objects bloat the repo and slow every object-scanning operation**
  (inode exhaustion, no cross-object delta until `gc`/`repack`); a fact-per-file graph will need
  aggressive packing and a gc strategy, or it degrades.
- https://github.blog/engineering/architecture-optimization/scaling-gits-garbage-collection/ · https://git-scm.com/docs/git-gc

**Vector + graph hybrid retrieval.**
- *Borrow:* **Vector for candidates, graph for context expansion, fused with RRF**: semantic
  search finds entry nodes, graph traversal pulls in structurally-connected context; merge with
  Reciprocal Rank Fusion. This is exactly the retrieval shape kip should expose (atlas has the
  graph half, not the vector half yet).
- *Pitfall:* Hybrid retrieval can **lower context precision** — graph expansion injects verbose,
  tangentially-related context that dilutes relevance; and you must keep the vector index and the
  graph in sync as facts are superseded.
- https://aws.amazon.com/blogs/database/improving-generative-ai-accuracy-with-vector-and-graph-search-hybrid-queries/ · https://arxiv.org/html/2507.03608v1

---

## 3. Hard problems any git-graph-memory core MUST solve

1. **Merge/conflict for a *mutable* graph on an *immutable* substrate.** Git merges text lines;
   a property graph needs semantic 3-way merge over nodes/edges/attributes. Concurrent edits to
   the same node attribute or the same edge's validity interval can't be line-merged. Need a
   typed merge strategy per node-kind/edge-kind (cf. Irmin), with prolly-tree-style structural
   diff (cf. Dolt) so merge is cheap and conflicts are localized to the cell/attribute.

2. **Index/embedding rebuild cost.** atlas rebuilds one monolithic `index.json` every run and
   recomputes adjacency in-memory; vector embeddings are far more expensive to recompute. kip
   needs **incremental, content-addressed projections** keyed off git object hashes (rebuild only
   changed subtrees/embeddings) and snapshots to bound replay — projections must be derivable and
   never the source of truth.

3. **History bloat on the git substrate.** Fact-per-file accretion produces millions of small
   loose objects → repo bloat, slow scans, inode pressure. Need packing/gc strategy, possibly
   TerminusDB-style delta-layer rollup / compaction, and a policy for when commit granularity is
   per-fact vs batched.

4. **Identity vs content-addressing.** Git addresses content; agent memory needs **stable entity
   identity across mutations** (Noms's lesson: content hash changes every edit). Need a dual
   scheme — author-assigned stable entity id (atlas-style) *plus* content hashes for
   dedup/integrity/sync — and a mapping from entity id → current/historical content addresses.

5. **Bitemporal soundness.** Correctly maintaining four timestamps (valid_at/invalid_at +
   created_at/expired_at) with no gaps/overlaps, supporting late-arriving and corrected facts,
   and answering both "believed-then" and "true-then" queries — under concurrency.

6. **Distributed temporal-fact synchronization / convergence.** Independent replicas (agents)
   must converge without a coordinator. Requires a causal clock (HLC), append-only signed facts,
   and merge ops that are associative+commutative+idempotent — otherwise replicas diverge under
   reordering. Convergence must be *provable*, not hoped-for.

7. **Forgetting vs immutable history.** Retention (kradle's maxAge/maxSize), redaction
   (adapters/tasks secret-redaction), GDPR-style erasure, and episodic→semantic decay must
   coexist with an append-only, signed, content-addressed history. True deletion fights
   immutability — need excision/tombstone semantics that preserve verifiability of what remains.

8. **Schema/ontology evolution.** Per-tenant mutable ontologies (kradle) plus appended facts that
   can't be rewritten ⇒ need **upcasters** (versioned fact transforms applied on read) and a
   fact-version tag on every record from day one; schema changes must not break historical facts.

---

## 4. Explicit design tensions

1. **Content-addressing vs mutable identity.** Content hashes give dedup, integrity, and trivial
   sync but make "the same entity over time" impossible without an overlay. Stable author-assigned
   ids give entity continuity but lose automatic dedup and require an id→hash index. kip almost
   certainly needs **both layers**, and must decide which is authoritative for equality.

2. **Branch-per-memory vs single-trunk + temporal facts.** Git-native branching (Irmin/Dolt/Noms)
   gives cheap divergent timelines and per-agent isolation, but branch proliferation is a gc and
   merge nightmare. A single trunk with bitemporal facts (Datomic/Graphiti) gives one auditable
   history and easy as-of queries but **can't branch from the past** and serializes writes.
   Hybrid (short-lived per-session branches that merge back via typed merge) is plausible but
   inherits both cost models.

3. **In-git index vs derived/rebuildable index.** Committing the index/embeddings into git makes
   reads self-contained and reproducible at any commit, but bloats history and creates
   index↔source merge conflicts. Keeping the index purely derived (atlas-style) keeps git clean
   but forces a rebuild/projection pipeline and a cache-invalidation story. Embeddings are
   expensive enough that "always rebuild" is not free.

4. **Fact-superseding vs CRDT merge.** Graphiti-style supersession (set `expired_at`, rewrite as
   historical, often via an LLM invalidation decision) is semantically rich and auditable but
   **order-sensitive and possibly non-deterministic**. CRDT merge (Irmin) is mechanically
   convergent and deterministic but semantically blunt (it converges *a* value, not necessarily
   the *right* superseded fact). The core must choose where each kind of conflict is resolved —
   mechanical merge at the substrate, semantic supersession at the temporal-fact layer.

5. **Clock / causality model.** Wall-clock timestamps are human-meaningful but unreliable for
   ordering across replicas; Lamport clocks order but can't detect concurrency; vector/dotted-
   version clocks detect concurrency but grow with replica count; HLC is the pragmatic middle.
   The choice dictates what convergence guarantees are even *possible* and how much metadata each
   fact carries — it must be fixed early because it's baked into the fact envelope.

---

## Synthesis

The repo already contains every half of the answer: **atlas** (typed graph over git-tracked
files + derived index + order-independent patch-merge), **kradle** (memory = a git repo + mutable
per-tenant ontology + snapshot-pinning + summary-only episodic ingestion + sync/conflict slots),
and **adapters/tasks** (Ed25519-signed, canonically-serialized facts with append-only per-record
history and trusted-key provenance). kip-sdk's job is to fuse them and add what none has:
**content-addressed incremental projections, a causal clock, bitemporal signed facts, provable
distributed convergence, and hybrid vector+graph retrieval.** The external prior art says: borrow
prolly-tree structural diff (Dolt/Noms), accretion + as-of (Datomic), delta-layer rollup
(TerminusDB), pluggable convergent merge (Irmin), bi-temporal edge invalidation (Graphiti), HLC
clocks, event-sourcing upcasters, and vector-candidate→graph-expansion retrieval — while staying
honest that merge granularity, history bloat, identity duality, and probabilistic supersession are
unavoidable costs to be designed for, not designed away.
