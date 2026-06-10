# Vision & Scope

> The thesis, what kip is and is not, and the goals/non-goals that bound the project.

**Source:** SPEC §1 (Executive summary, lines ~154–240).

> SPEC.md remains the authoritative source. This document summarizes §1 faithfully; where it
> and the spec disagree, the spec wins.

---

## Thesis
<a id="thesis"></a>

> *kip is a git-substrate, bitemporal, signed-fact property-graph memory whose unit of
> synchronization is an append-only signed temporal fact, so that coordinator-free agent
> replicas converge mechanically at the substrate and supersede semantically above it, and a
> context-management layer can be built entirely on derived, rebuildable projections.*

kip-sdk (**K**nowledge / **I**nference / **P**rovenance) is the **ideal core** beneath a future
context-management product. It is a **library, not a runtime** — memory is a substrate, agents are
clients (the Letta pitfall). See [glossary](./glossary.md) for the precise meaning of every term
used below.

## What kip is

kip provides six things (SPEC §1):

1. A **typed property graph** (nodes, edges, properties, schema/ontology, dual identity) as the
   conceptual surface. See [data model](./21-data-model.md).
2. A **git object/ref layout** as the *only* durable store: every memory write is a commit;
   history, branching, merge, and sync are git operations specialized with typed semantics. See
   [git substrate](./22-git-substrate.md).
3. **Bitemporal signed temporal facts** as the *unit of change and the unit of synchronization* —
   the graph is a *projection* of the fact log, never an authoritative store of its own. See
   [temporality](./23-temporality-and-bitemporality.md).
4. **Coordinator-free convergence**: HLC-stamped, Ed25519-signed facts form a **grow-only fact
   set** (a CRDT under union); the read model is a **deterministic pure projection** of that set;
   semantic supersession is itself recorded as facts so all replicas fold the *same recorded
   decision*. Convergence = set-convergence + projection determinism. See
   [synchronization & convergence](./24-synchronization-and-convergence.md).
5. **Hybrid retrieval**: vector candidates → graph expansion → Reciprocal Rank Fusion (RRF), over content-addressed,
   incrementally rebuildable projections. See [retrieval](./26-retrieval.md).
6. **Memory semantics**: episodic vs semantic, salience/decay, consolidation, and forgetting via
   **logical tombstone** (signature-preserving) vs **physical excision** (the one authorized
   history-rewrite that frees bytes and breaks pure append-only — stated plainly). See
   [temporality](./23-temporality-and-bitemporality.md).

## Goals (G1–G8)

| ID | Goal |
|---|---|
| **G1** | Git is the **sole source of truth**. Any projection (graph adjacency, vector index, salience) is droppable and rebuildable from git objects alone, deterministically. |
| **G2** | Every change is an **append-only, signed, bitemporal fact** carrying its own version tag. |
| **G3** | **Coordinator-free convergence**: two replicas that have seen the same set of facts compute byte-identical **deterministic** projections (heads/graph), independent of ingestion order (HP-6, T-4, T-5). Non-deterministic accelerators (ANN/embeddings) are explicitly *out* of this byte-identity guarantee (§5.3, INV-5). |
| **G4** | **Stable entity identity** decoupled from content addressing (HP-4, T-1). |
| **G5** | **Incremental projections** keyed off git object hashes — never a monolithic full rebuild (HP-2, T-3). |
| **G6** | **Forgetting coexists with immutable history** via tombstone + excision (HP-7). |
| **G7** | **Schema/fact evolution** via versioned upcasters from day one (HP-8). |
| **G8** | A **small, composable, well-typed** core API (the "seams" the context layer plugs into). |

The HP-* and T-* references above are the hard problems and design tensions the design resolves;
see [prior art & hard problems](./prior-art.md).

## Non-goals (N1–N5)

| ID | Non-goal |
|---|---|
| **N1** | The context-management layer itself (assembly heuristics, prompt packing, token budgeting). kip specs the *seams* (§4c), not the layer. See [context enablement seams](./25-context-enablement-seams.md). |
| **N2** | The embedding model, LLM, or extraction pipeline. kip consumes embeddings/extracted facts; it does not produce them. |
| **N3** | A query language / SQL surface. kip exposes a typed traversal + retrieval API, not a DSL. |
| **N4** | A network server / replication daemon. kip provides the fact log, sync primitives, and transports; deployment topology is a client concern. |
| **N5** | **No fallbacks.** Ambiguous merges surface as typed conflicts; unverifiable facts are rejected. kip never silently "picks something." |

> **N5 is load-bearing.** It propagates through the entire spec: schema violations quarantine
> rather than drop; tied reducers surface a `conflict` segment; multiple matching segments surface
> a typed choice; exhausted autoencoding emits a marker and **no** accept fact. Nothing is silently
> chosen.

---

## Where to go next

- The correctness core: [synchronization & convergence](./24-synchronization-and-convergence.md).
- The full requirement set: [functional requirements](./10-functional-requirements.md) and
  [non-functional requirements](./11-non-functional-requirements.md).
- The shape of the whole system: [architecture overview](./20-architecture-overview.md).
- The decisions behind the scope: [decision records](./70-decision-records-adr.md).
