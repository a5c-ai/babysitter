# Roadmap tasks — M1 — Projection & convergence: proj, /heads, reducers

> Part of the dependency-ordered work-breakdown structure indexed at [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) — see that file for the legend (id scheme, the Implements/Exit-criteria/Depends-on semantics, and the machine-checked anchor convention) and the full task-level dependency graph. This file carries the **E2** slice of the WBS. Realizes milestone **M1**; see [80-roadmap-and-milestones.md](./80-roadmap-and-milestones.md) for the milestone-level goal/dependencies/exit-criteria.

---

## E2: Projection & convergence: proj, /heads, reducers

**Goal.** The deterministic, set-pure whole-set projection `proj(S)` materializing byte-identical `/heads` via orderKey ordering, reducers, upcasters, interval geometry, and conflict surfacing (M1).

**Detailed doc:** [./24-synchronization-and-convergence.md](./24-synchronization-and-convergence.md)

### <a id="T2.1"></a>T2.1 orderKey total order

Implement `orderKey` as the total order over set-resident fields (the canonical [`OrderKey` type](./22-git-substrate.md#orderkey)) with guaranteed totality across distinct admitted facts.

- **Implements:** — · [NFR-A5](./11-non-functional-requirements.md#nfr-a5), [NFR-A6](./11-non-functional-requirements.md#nfr-a6)
- **Exit criteria:** [INV-3](./60-conformance-and-testability.md#inv-3)
- **Depends on:** [T1.6](./81a-tasks-m0.md#T1.6)
- **Subtasks:**
  - [ ] T2.1.1 orderKey field composition over set-resident fields
  - [ ] T2.1.2 factCID final tiebreak; assert orderKey totality

### <a id="T2.2"></a>T2.2 proj fold pipeline (sort -> group -> upcast -> reduce)

Implement `proj(S)` as a single total, pure, whole-set fold producing byte-identical `/heads`, reading only author-stamped set-resident fields and never `rxFrom` or any receiver clock.

- **Implements:** — · [NFR-A3](./11-non-functional-requirements.md#nfr-a3), [NFR-A4](./11-non-functional-requirements.md#nfr-a4), [NFR-A5](./11-non-functional-requirements.md#nfr-a5)
- **Exit criteria:** [INV-1](./60-conformance-and-testability.md#inv-1)
- **Depends on:** [T2.1](#T2.1)
- **Subtasks:**
  - [ ] T2.2.1 Sort by orderKey, group by cell
  - [ ] T2.2.2 Whole-set fold (no pairwise merge)
  - [ ] T2.2.3 Replica-local-input independence (no rxFrom/clock leak)

### <a id="T2.3"></a>T2.3 Cell reducers (lww-hlc, max, min, gset, pncounter, custom)

Implement the registered `CellReducers` as deterministic, total, pure folds whose final tiebreak terminates in `orderKey`.

- **Implements:** — · [NFR-A3](./11-non-functional-requirements.md#nfr-a3), [NFR-A6](./11-non-functional-requirements.md#nfr-a6)
- **Exit criteria:** [INV-3](./60-conformance-and-testability.md#inv-3)
- **Depends on:** [T2.2](#T2.2)
- **Subtasks:**
  - [ ] T2.3.1 lww-hlc, max, min reducers
  - [ ] T2.3.2 gset, pncounter reducers
  - [ ] T2.3.3 custom reducer registration; final tiebreak terminates in orderKey

### <a id="T2.4"></a>T2.4 Versioned upcasters

Implement versioned upcasters applied in `proj` keyed to each fact's `validFrom`/version, yielding a typed `value | quarantine` result that terminates, never throws, and never invents data.

- **Implements:** [FR-G1](./10-functional-requirements.md#fr-g1), [FR-G2](./10-functional-requirements.md#fr-g2), [FR-G3](./10-functional-requirements.md#fr-g3) · [NFR-H1](./11-non-functional-requirements.md#nfr-h1)
- **Exit criteria:** [INV-8](./60-conformance-and-testability.md#inv-8)
- **Depends on:** [T2.2](#T2.2)
- **Subtasks:**
  - [ ] T2.4.1 Per-tenant /ontology versioned schema as facts
  - [ ] T2.4.2 Upcast keyed to fact validFrom/version; typed value|quarantine
  - [ ] T2.4.3 Unknown-version passthrough-as-opaque; never invent data
  - [ ] T2.4.4 Projected cardinality/inverse (not gated)

### <a id="T2.5"></a>T2.5 Interval geometry & first-class unknown

Implement non-overlapping valid-time segments with gaps projecting as first-class `unknown` (distinct from asserted null) and existence-gates-properties (no ghost nodes).

- **Implements:** [FR-A2](./10-functional-requirements.md#fr-a2), [FR-B1](./10-functional-requirements.md#fr-b1) · [NFR-H2](./11-non-functional-requirements.md#nfr-h2)
- **Exit criteria:** [INV-4a](./60-conformance-and-testability.md#inv-4a) (the asOf-free segment-geometry sub-invariant — full INV-4 needs T3.2's belief oracle and gates M2)
- **Depends on:** [T2.2](#T2.2)
- **Subtasks:**
  - [ ] T2.5.1 Non-overlapping segment geometry per cell
  - [ ] T2.5.2 Gap-as-unknown; retract mid-interval leaves unknown gap
  - [ ] T2.5.3 Existence-gates-properties (no ghost nodes)

### <a id="T2.6"></a>T2.6 Conflict surfacing (kip:conflict)

Surface non-commutative contradictions and tied/ambiguous resolutions as explicit `kip:conflict` cells per the resolution table, never silently auto-picked.

- **Implements:** [FR-B5](./10-functional-requirements.md#fr-b5) · [NFR-H1](./11-non-functional-requirements.md#nfr-h1)
- **Exit criteria:** [INV-3](./60-conformance-and-testability.md#inv-3)
- **Depends on:** [T2.3](#T2.3)
- **Subtasks:**
  - [ ] T2.6.1 Resolution table for non-commutative contradictions
  - [ ] T2.6.2 kip:conflict cell surfacing (no silent hash tiebreak)

### <a id="T2.7"></a>T2.7 Read API: getNode/getEdge & typed traversal

Implement `getNode`/`getEdge` returning projected `NodeView`/`EdgeView` with per-property `PropCell` provenance/temporality, and `query(spec)` typed directional as-of BFS/DFS crossing only valid/known edges.

- **Implements:** [FR-B1](./10-functional-requirements.md#fr-b1), [FR-B2](./10-functional-requirements.md#fr-b2) · [NFR-H2](./11-non-functional-requirements.md#nfr-h2)
- **Exit criteria:** [INV-1](./60-conformance-and-testability.md#inv-1)
- **Depends on:** [T2.5](#T2.5)
- **Subtasks:**
  - [ ] T2.7.1 getNode/getEdge projecting PropCell views
  - [ ] T2.7.2 query(TraversalSpec) typed directional as-of BFS/DFS
  - [ ] T2.7.3 Quarantine/untrusted/schema-violation segments visible on read


---

**Navigation:** [↑ index](./81-roadmap-epics-and-tasks.md) · [← M0 — Git substrate](./81a-tasks-m0.md) · [M2 — Bitemporality & as-of →](./81c-tasks-m2.md)
