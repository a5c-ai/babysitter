# Context-management enablement seams

Purpose: the read/snapshot/stream/provenance seams kip exposes so an on-top context-management layer can assemble run context — kip provides the **seams**, not the layer.

Source: SPEC §4c (1670–1761).

---

## Scope: seams, not the layer (N1)

kip exposes exactly the seams the on-top context layer needs; it does **not** implement context
assembly. Context assembly — deciding what to place in a working window, how to compress it, how to
order it — is a **client concern** and out of scope (non-goal **N1**). The seams below are the entire
surface the context layer consumes; everything it builds, it builds as a pure consumer of the fact
stream.

The context layer is a **pure consumer of the fact stream**: sync across replicas delivers the same
facts, so distributed agents converge their *contexts*, not just their stores.

---

## The seam table

| Seam | kip primitive | Context layer uses it to… |
|---|---|---|
| **Scoped snapshot** | `pin(scope, asOf) → SnapshotRef` (content-addresses the fact-set frontier) | Freeze a deterministic, immutable read-set per run that **survives excision rebase** (C-4). |
| **As-of read** | `asOf({txTime, validTime, believer})` | Reconstruct "what *this replica* believed at point T" (per-replica, M-5). |
| **Salience-ranked recall** | `recall(query, { scope, asOf, k, rank })` | Pull the top-k most relevant memories; conflicted cells surfaced explicitly (m-4). |
| **Incremental update stream** | `subscribe(scope, since) → AsyncIterable<FactDelta>` | Receive only the *new facts* since the cursor frontier → incrementally patch the working context. |
| **Compaction hint** | `salience(eid)` + `summarizeRange(hlcRange)` | Decide what to keep vs. drop vs. consolidate. |
| **Provenance trace** | `provenanceOf(eid\|factId)` | Cite/justify every item placed in context. |

These primitives are surfaced on the SDK `Repo` interface — see
[SDK API surface](./40-sdk-api-surface.md). `recall` is detailed in [Retrieval](./26-retrieval.md);
`asOf` and the bitemporal model in
[Temporality & bitemporality](./23-temporality-and-bitemporality.md); `provenanceOf` traces the
provenance envelope of [the data model](./21-data-model.md).

---

## Frontier-addressed snapshots (`pin`)

The **durable frontier is author-HLC space only** — there are **no commit CIDs** in the pin contract
(C2-3, M2-2). Commit CIDs are transport, not identity; under concurrent excision they diverge per
replica, so they **MUST NOT** be a durable pin target. `dagTips` is intentionally absent.

```ts
// The DURABLE frontier is author-HLC space only — NO commit CIDs (C2-3, M2-2). dagTips dropped.
type PinStatus = "pin-complete" | "pin-incomplete";  // (M3-2) incomplete until all sub-frontier facts present
type Frontier = { perReplicaHlc: Record<ReplicaId, HlcStamp> }; // author-HLC frontier; survives concurrent excision
// A replicaId ABSENT from perReplicaHlc means "−∞ for that replica" (m3-3): facts authored by a replica
// not in the map are NOT ≤-frontier and are EXCLUDED. A pin thus captures exactly the replicas it
// enumerated at pin time; a later-joining replica's low-author-HLC facts fall OUTSIDE the pin (they are
// absent ⇒ −∞ ⇒ excluded), so the pinned subset is deterministic and not silently grown by new replicas.

interface SnapshotRef {
  scope: ScopeRef;
  frontier: Frontier;                 // author-HLC frontier of the pinned fact-set (no commit CIDs)
  // (M3-2) A pin DENOTES the deterministically-selected subset { f ∈ S : f.authorHlc ≤ frontier[f.replicaId] }
  //   (replicaId absent ⇒ excluded, m3-3). factSetDigest is the order-independent merkle root (over orderKey)
  //   of THAT subset — recomputed from the current set, NOT a snapshot hash of "the set as it was when pinned".
  factSetDigest: CID;                 // merkle root of the sub-frontier subset; THE durable resolution target — re-resolves after any rewrite (C-4, C2-3, M3-2)
  // NOTE: dagTips: CID[] is intentionally ABSENT. Commit CIDs are transport, not identity; under
  // concurrent excision they diverge per replica (C2-3), so they cannot be a durable pin target.
}
```

A pin **does not** denote "the bytes of the set at pin time"; it denotes the
**deterministically-selected subset**

```
{ f ∈ S_current : f.authorHlc ≤ frontier[f.replicaId] }
```

where a `replicaId` **absent** from the frontier map is treated as `−∞` ⇒ that replica's facts are
excluded (m3-3). `factSetDigest` is the **order-independent merkle root over `orderKey`** of *that
subset*, recomputed from whatever set the resolving replica currently holds. Because it re-resolves
against the current set rather than dangling on a stale or non-canonical commit CID, a pin
**re-resolves after any excision rewrite — including concurrent excision** (C-4, C2-3). See
[synchronization & convergence](./24-synchronization-and-convergence.md) for the excision/rewrite
mechanics.

### The pin-completeness rule

Because HLC is **not globally monotone**, a *late-arriving* fact whose author-HLC is ≤ the pinned
frontier was not present when the pin was taken but **is** ≤-frontier once received. A pin is
therefore **valid only when COMPLETE**: every fact ≤ frontier has been received. kip defines a typed
`PinStatus`:

- **`pin-incomplete`** — the replica has **not** yet received every sub-frontier fact (it cannot yet
  prove the subset is final). Resolution **MUST** return the `pin-incomplete` status, **never a silent
  partial read** (N5). Completion is **monotone**: once a sub-frontier fact arrives it is never
  removed, so a pin transitions `incomplete → complete` exactly once and never back.
  - **Completeness is LOCALLY DECIDABLE** via the per-replica HLC-counter contiguity rule (m4-1). A
    replica decides "I hold every fact `≤ frontier[R]` from replica `R`" **without** enumerating facts
    it has never seen, because HLC counters are **per-(replicaId, key) monotone and gap-free by
    construction**. Completeness for `R` holds **iff** the replica holds an **unbroken `(wall, counter)`
    chain from `R`'s genesis up to `frontier[R]`** with no missing counter. A detected gap (a missing
    counter below the frontier) ⇒ `pin-incomplete`; a contiguous chain ⇒ complete for `R`. This makes
    `pin-incomplete → pin-complete` decidable from local state alone, so INV-14 is testable (see
    [conformance & testability](./60-conformance-and-testability.md)).
- **`pin-complete`** — every fact ≤ frontier is present; the subset is final and its `factSetDigest`
  matches. **Two replicas that have both reached completeness for the same frontier compute the
  identical subset ⇒ identical `factSetDigest` ⇒ the pin resolves to the same logical state on every
  replica** — the stability the durable-pin contract requires, and what excision-survival rests on.

So `factSetDigest` **is** a stable, durable address — but only as the digest of the frontier-selected
subset, **gated by completeness** — not as a one-time snapshot hash of a growing store.

---

## Incremental update stream (`subscribe` + `FactDelta`)

```ts
interface FactDelta {                 // the incremental, synchronized context-update unit
  facts: Fact[];                      // new facts since `cursor`
  affected: EID[];                    // ALL entities whose head changed since `cursor` — INCLUDING heads
                                      // re-folded due to a REVOCATION or EXCISION re-demotion, not only
                                      // those touched by newly-arrived asserts (m2-6)
  cursor: Frontier;                   // resume point — an author-HLC FRONTIER, not a scalar HLC (m-5)
}
```

**The cursor is an author-HLC frontier, not a scalar HLC (m-5).** A scalar HLC cursor would *miss* a
late-merged fact whose author `hlc` is lower than the cursor (HLC is not globally monotone).
`subscribe` therefore advances a **per-replica author-HLC frontier**: a delta **MUST** include every
admitted fact not already ≤ the cursor frontier, so causally-late deliveries are **never skipped**.

**`affected` lists every entity whose head changed** — including entities re-folded because a
**revocation or excision** re-demoted a previously-trusted fact, not only entities touched by new
asserts (m2-6) — so a subscriber **never misses a revocation-induced head change**. Demotion
mechanics (signature-only gate vs. proj-time demotion) live in
[synchronization & convergence](./24-synchronization-and-convergence.md).

**Temporal facts drive incremental synchronized context updates.** The context layer maintains a
frontier cursor and pulls `FactDelta`s; sync across replicas delivers the same facts, so distributed
agents converge their *contexts*, not just their stores.

---

## Compaction hints

`salience(eid)` and `summarizeRange(hlcRange)` are advisory hints the context layer consults to decide
what to **keep vs. drop vs. consolidate**. Salience itself is a **derived projection**, never an
authored property — see [Retrieval §5.4](./26-retrieval.md). kip supplies the signal; the
keep/drop/consolidate policy is the context layer's (N1).

---

## Cross-links

- [SDK API surface](./40-sdk-api-surface.md) — where `pin` / `subscribe` / `asOf` / `recall` /
  `provenanceOf` appear on `Repo`.
- [Retrieval](./26-retrieval.md) — `recall`, the hybrid pipeline, and the salience projection.
- [Synchronization & convergence](./24-synchronization-and-convergence.md) — HLC frontiers,
  proj-time demotion, excision rewrite.
- [Temporality & bitemporality](./23-temporality-and-bitemporality.md) — the `asOf` axes.
