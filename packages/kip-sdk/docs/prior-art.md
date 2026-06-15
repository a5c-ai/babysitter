# Prior Art & Hard Problems

> The hard problems and design tensions the spec resolves, and where the design borrows from.

**Source:** `../PRIOR-ART.md` and `../SCORECARD.md`. No new claims — this is a navigational summary.

> SPEC.md remains the authoritative source for *how* each problem is resolved. The two companion
> documents named above are authoritative for the prior-art survey and the convergence scorecard
> respectively; read them for full detail and citations.

---

## Why this document exists

kip-sdk's [goals G1–G8](./00-vision-and-scope.md) each cite a hard problem (`HP-n`) or a design
tension (`T-n`). This page restates those problems and tensions so a reader can trace each goal
and invariant back to the motivating difficulty, without re-deriving the survey.

## Hard problems any git-graph-memory core MUST solve (HP-1…HP-8)

From `../PRIOR-ART.md` §3. The numbering below matches that document.

| ID | Hard problem | Where the spec addresses it |
|---|---|---|
| **HP-1** | **Merge/conflict for a *mutable* graph on an *immutable* substrate.** Git merges text lines; a property graph needs semantic merge over nodes/edges/attributes. | Set-union substrate + deterministic `proj`; per-prop reducers. See [git substrate](./22-git-substrate.md), [convergence](./24-synchronization-and-convergence.md). |
| **HP-2** | **Index/embedding rebuild cost.** Monolithic full rebuilds don't scale; embeddings are expensive to recompute. | Incremental, content-addressed projections keyed off git object hashes (G5). See [retrieval](./26-retrieval.md). |
| **HP-3** | **History bloat on the git substrate.** Fact-per-file accretion → millions of small loose objects. | Packing/GC, retention, admission control. See [git substrate](./22-git-substrate.md). |
| **HP-4** | **Identity vs content-addressing.** Git addresses content; memory needs stable entity identity across mutations. | Dual-id scheme: frozen genesis EID + content CID (G4). See [data model](./21-data-model.md). |
| **HP-5** | **Bitemporal soundness.** Valid + transaction time with no gaps/overlaps, late-arriving and corrected facts, under concurrency. | Bitemporal fact envelope, first-class `unknown` segments. See [temporality](./23-temporality-and-bitemporality.md). |
| **HP-6** | **Distributed temporal-fact synchronization / convergence.** Replicas must converge without a coordinator; convergence must be *provable*. | HLC + signed append-only facts + set-pure `proj`; SEC theorem (G3). See [convergence](./24-synchronization-and-convergence.md). |
| **HP-7** | **Forgetting vs immutable history.** Retention, redaction, erasure, decay must coexist with append-only signed history. | Logical tombstone vs physical excision (G6). See [temporality](./23-temporality-and-bitemporality.md), [security](./50-security-trust-tenancy.md). |
| **HP-8** | **Schema/ontology evolution.** Per-tenant mutable ontologies + un-rewritable appended facts. | Versioned upcasters applied in `proj`; fact-version tag from day one (G7). See [data model](./21-data-model.md). |

## Explicit design tensions (T-1…T-5)

From `../PRIOR-ART.md` §4. These are tradeoffs to *design for*, not away.

| ID | Tension | Spec resolution (summary) |
|---|---|---|
| **T-1** | **Content-addressing vs mutable identity.** | Both layers: stable EID is authoritative for equality, CID for dedup/integrity/sync. |
| **T-2** | **Branch-per-memory vs single-trunk + temporal facts.** | Branch-per-agent replicas over a set-union substrate; supersession recorded as facts. See [convergence](./24-synchronization-and-convergence.md). |
| **T-3** | **In-git index vs derived/rebuildable index.** | Index is purely derived and rebuildable (G1/G5); never the source of truth. |
| **T-4** | **Fact-superseding vs CRDT merge.** | Mechanical CRDT convergence at the substrate; semantic supersession recorded *as facts* above it, so all replicas fold the same recorded decision. |
| **T-5** | **Clock / causality model.** | HLC (`wall, counter, replicaId`), author-stamped and signed; the only time axis `proj` reads. |

## Borrowed ideas and pitfalls (one each)

`../PRIOR-ART.md` §1–§2 surveys in-repo patterns (`atlas`, `kradle`, `adapters/tasks`) and external
systems. Each external system contributes **one borrowable idea + one pitfall**: Dolt (prolly-tree
structural diff / cell-merge bottleneck), TerminusDB (delta-layer rollup / read-latency drift),
Datomic (accretion + as-of / no branch-from-past), Noms (content-addressed sync / identity==content),
Irmin (pluggable convergent merge / merge must be provably ACI), Zep–Graphiti (bitemporal edge
invalidation / probabilistic out-of-order supersession), Mem0 (low-friction ingestion / graph must
earn its keep), Letta (sleep-time consolidation / memory ≠ runtime), cognee (ECL pipeline / drift
unless replayable), event sourcing (rebuildable projections + upcasters), HLC, bitemporal modeling,
content-addressed storage, and vector+graph hybrid retrieval. See `../PRIOR-ART.md` for the full
borrow/pitfall ledger and source links.

---

## Convergence scorecard (spec maturity)

From `../SCORECARD.md`. The spec was driven through **six adversarial red-team / fix rounds**;
overall score rose monotonically from **0.557 (v1 draft) → 0.870 (round-6 audit)**, with the final
consistency pass closing the last MAJOR (M6-1) and three MINORs (re-scoring deferred — no number
fabricated). Across all six rounds: **0 CRITICAL remain unresolved**, and the convergence core
(signature-only gate, `proj`-purity, `orderKey` totality, SEC theorem, "eventual-once-complete"
chain semantics) passed **five consecutive adversarial audits unbroken**.

### Resolved-CRITICAL ledger (headline fixes)

| Tag | The CRITICAL it closed |
|---|---|
| **C-1** | Order-dependent valid-time fold replaced with a **set-pure projection** (sort once by total `orderKey`, then sweep-line fold). |
| **C-5 / C-6** | Identity + trust: **dual-id scheme** + **genesis-rooted authority chain** keyed on author-HLC; identity stable across key rotation/revocation. |
| **C3-1** | Ingest gate reading replica-local state → divergence; fixed by the **signature-only ingest gate** (every other trust question is a set-pure `proj` demotion). |
| **C4-1** | Signature-only gate's unbounded storage split into **LOGICAL membership (signature-only)** vs **DURABLE storage (transport-layer retention policy)**; SEC restated per-shared-subset. |
| **C4-2** | Anti-backdating moved off the voluntary `causedBy` field to the **involuntary per-key author-HLC monotonicity rule**. |
| **C5-1** | Eviction × monotonicity backdating closed by the **per-key chain-completeness gate** (a `(wall,counter)` gap ⇒ `pending`, never a silent trusted backdate). |

### Honestly-accepted residual bounds (R1–R4 — NOT bugs)

None yields a wrong *trusted* value; the worst case is a labeled `pending` or a self-dated lone
first-emission.

| ID | Residual |
|---|---|
| **R1** | Lone-first-emission self-dating (irreducible floor of any set-pure anti-backdating rule). |
| **R2** | Ordinary-cutoff sub-`effectiveFrom` backdate (a stated impossibility, M5-2; `causal-cutoff` is the opt-in alternative). |
| **R3** | Re-fetch liveness cliff — a cap-evicted chain link aged out of every replica leaves dependents `pending` permanently (**safe**, never wrong-trusted). |
| **R4** | Embedding / ANN non-determinism — accelerator projections are recall-equivalent, not byte-identical (explicitly out of scope, N2, INV-5). |

These residuals are restated faithfully in SPEC §9; see [open questions](./90-open-questions.md). The
invariants that test the resolved problems are catalogued in
[conformance & testability](./60-conformance-and-testability.md).
