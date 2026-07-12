# Roadmap tasks — M4 — Retrieval & indexing

> Part of the dependency-ordered work-breakdown structure indexed at [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) — see that file for the legend (id scheme, the Implements/Exit-criteria/Depends-on semantics, and the machine-checked anchor convention) and the full task-level dependency graph. This file carries the **E5** slice of the WBS. Realizes milestone **M4**; see [80-roadmap-and-milestones.md](./80-roadmap-and-milestones.md) for the milestone-level goal/dependencies/exit-criteria.

---

## E5: Retrieval & indexing

**Goal.** Hybrid salience-ranked recall (vector ANN → bounded graph expansion → RRF) over the converged graph, with incrementally rebuildable indexes and the explicit accelerator boundary (M4).

**Detailed doc:** [./26-retrieval.md](./26-retrieval.md)

### <a id="T5.1"></a>T5.1 Incremental, content-addressed indexing

Implement derived projections that rebuild incrementally keyed off git object hashes (subtree-hash skip; embeddings recompute only for changed content), droppable and rebuildable from git alone.

- **Implements:** [FR-C3](./10-functional-requirements.md#fr-c3) · [NFR-A1](./11-non-functional-requirements.md#nfr-a1), [NFR-F2](./11-non-functional-requirements.md#nfr-f2), [NFR-B3](./11-non-functional-requirements.md#nfr-b3)
- **Exit criteria:** [INV-5](./60-conformance-and-testability.md#inv-5)
- **Depends on:** [T4.4](./81d-tasks-m3.md#T4.4)
- **Subtasks:**
  - [ ] T5.1.1 Subtree-hash-keyed incremental rebuild
  - [ ] T5.1.2 Embedding recompute only for changed content
  - [ ] T5.1.3 Cache key covers embedding-model identity

### <a id="T5.2"></a>T5.2 Vector ANN accelerator projection

Implement the pluggable vector index as an accelerator projection consuming caller-supplied embeddings, explicitly outside byte-identity (recall-equivalent only).

- **Implements:** [FR-C3](./10-functional-requirements.md#fr-c3) · [NFR-B1](./11-non-functional-requirements.md#nfr-b1), [NFR-B2](./11-non-functional-requirements.md#nfr-b2)
- **Exit criteria:** [INV-5](./60-conformance-and-testability.md#inv-5)
- **Depends on:** [T5.1](#T5.1)
- **Subtasks:**
  - [ ] T5.2.1 Pluggable ANN index over caller embeddings
  - [ ] T5.2.2 Accelerator boundary: recall-equivalent rebuild, not byte-identical

### <a id="T5.3"></a>T5.3 Salience projection (deterministic)

Implement `salience(eid)` as a derived deterministic projection over recency (HLC age), access frequency (read facts), confidence, and graph centrality with declared weights and a half-life, never an authored property.

- **Implements:** [FR-C4](./10-functional-requirements.md#fr-c4) · [NFR-B2](./11-non-functional-requirements.md#nfr-b2), [NFR-G3](./11-non-functional-requirements.md#nfr-g3)
- **Exit criteria:** [INV-5](./60-conformance-and-testability.md#inv-5)
- **Depends on:** [T5.1](#T5.1)
- **Subtasks:**
  - [ ] T5.3.1 Recency/frequency/confidence/centrality terms with declared weights
  - [ ] T5.3.2 Half-life discounting; deterministic over exact centrality

### <a id="T5.4"></a>T5.4 Bounded graph expansion

Implement opt-in bounded graph expansion (`hops`, `maxFanout`) over as-of-valid edges, never unbounded, to fight context dilution.

- **Implements:** [FR-C2](./10-functional-requirements.md#fr-c2) · [NFR-F4](./11-non-functional-requirements.md#nfr-f4)
- **Exit criteria:** —
- **Depends on:** [T2.7](./81b-tasks-m1.md#T2.7), [T4.4](./81d-tasks-m3.md#T4.4)
- **Subtasks:**
  - [x] T5.4.1 hops / maxFanout caps over as-of-valid edges

### <a id="T5.5"></a>T5.5 Hybrid recall pipeline (RRF)

Implement `recall(q)`: vector ANN candidates → bounded graph expansion → RRF over vector/graph-proximity/salience ranks with final salience/recency reweight, returning top-k with provenance and surfaced conflicts.

- **Implements:** [FR-C1](./10-functional-requirements.md#fr-c1) · [NFR-B2](./11-non-functional-requirements.md#nfr-b2), [NFR-F4](./11-non-functional-requirements.md#nfr-f4)
- **Exit criteria:** [INV-5](./60-conformance-and-testability.md#inv-5)
- **Depends on:** [T5.2](#T5.2), [T5.3](#T5.3), [T5.4](#T5.4)
- **Subtasks:**
  - [ ] T5.5.1 Vector candidates -> bounded expansion -> RRF fusion
  - [ ] T5.5.2 Final salience/recency reweight; provenance + conflict surfacing

### <a id="T5.6"></a>T5.6 Reproducible recall under fixed asOf

Ensure recall at a fixed `asOf` is a pure function of the as-of fact-set: salience inputs bounded by `asOf.txTime` (only read facts with `rxFrom <= asOf.txTime` count) so recall cannot observer-effect its ranking.

- **Implements:** [FR-C5](./10-functional-requirements.md#fr-c5) · [NFR-F6](./11-non-functional-requirements.md#nfr-f6)
- **Exit criteria:** [INV-5](./60-conformance-and-testability.md#inv-5)
- **Depends on:** [T5.5](#T5.5), [T3.2](./81c-tasks-m2.md#T3.2)
- **Subtasks:**
  - [ ] T5.6.1 Bound salience read-event inputs by asOf.txTime
  - [ ] T5.6.2 Pure recall under fixed asOf (no self-observer-effect)


---

**Navigation:** [↑ index](./81-roadmap-epics-and-tasks.md) · [← M3 — Sync & regeneration](./81d-tasks-m3.md) · [M5 — Contextual functionalities →](./81f-tasks-m5.md)
