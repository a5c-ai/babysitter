# Roadmap tasks — Cross-cutting: SDK surface & tooling/ops

> Part of the dependency-ordered work-breakdown structure indexed at [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) — see that file for the legend (id scheme, the Implements/Exit-criteria/Depends-on semantics, and the machine-checked anchor convention) and the full task-level dependency graph. This file carries the **E11, E13** slice of the WBS. These epics thread across milestones rather than mapping to one: **E11** (SDK surface) assembles each milestone's capabilities into the normative API shapes (each T11.x ships inside a named milestone, annotated per task below), and **E13** (CLI / fsck / rollup / packing-GC / observability) packages operational tooling over them — per the [80 milestone → epic map](./80-roadmap-and-milestones.md#milestone--epic-map).

---

## E11: SDK surface

**Goal.** The minimal, composable public API surface (write/read/sync/retrieval/provenance/forgetting/active-layer/security) assembling the subsystem capabilities into the normative SDK shapes.

**Detailed doc:** [./40-sdk-api-surface.md](./40-sdk-api-surface.md)

### <a id="T11.1"></a>T11.1 Write API surface (assert/retract/putNode/putEdge)

Assemble the accretion-only write surface: `assertFact`/`retractFact` returning `{factId, status}`, `txn`/`commit`, and `putNode`/`putEdge` convenience folds, with no delete/update path. **Ships inside M0.**

- **Implements:** [FR-A1](./10-functional-requirements.md#fr-a1), [FR-A2](./10-functional-requirements.md#fr-a2), [FR-A4](./10-functional-requirements.md#fr-a4), [FR-A5](./10-functional-requirements.md#fr-a5), [FR-A6](./10-functional-requirements.md#fr-a6), [FR-A7](./10-functional-requirements.md#fr-a7) · [NFR-A2](./11-non-functional-requirements.md#nfr-a2)
- **Exit criteria:** API-shape snapshot test (api-extractor / `tsd`) asserting the write-surface signatures ([§6](../SPEC.md) / [40](./40-sdk-api-surface.md) incl. `Tx`, `OpenOptions`, the narrowed `AssertInput`/`RetractInput`) compile and match the committed snapshot
- **Depends on:** [T1.5](./81a-tasks-m0.md#T1.5), [T1.6](./81a-tasks-m0.md#T1.6)
- **Subtasks:**
  - [ ] T11.1.1 assertFact/retractFact compiling to signed facts
  - [ ] T11.1.2 txn/commit transaction surface
  - [ ] T11.1.3 putNode/putEdge sugar; no delete/update exposed

### <a id="T11.2"></a>T11.2 Read & query API surface

Assemble the read surface: `getNode`/`getEdge`, `query(TraversalSpec)`, and `asOf` into the normative SDK shapes from §6. **Ships inside M2.**

- **Implements:** [FR-B1](./10-functional-requirements.md#fr-b1), [FR-B2](./10-functional-requirements.md#fr-b2), [FR-B3](./10-functional-requirements.md#fr-b3) · [NFR-H2](./11-non-functional-requirements.md#nfr-h2)
- **Exit criteria:** API-shape snapshot test asserting the read-surface signatures (`TraversalSpec` with mandatory `depth`/`maxFanout`, `ReadView`, `AsOf`) compile and match the committed snapshot
- **Depends on:** [T2.7](./81b-tasks-m1.md#T2.7), [T3.2](./81c-tasks-m2.md#T3.2)
- **Subtasks:**
  - [ ] T11.2.1 getNode/getEdge/query SDK shapes
  - [ ] T11.2.2 asOf read-view SDK shape

### <a id="T11.3"></a>T11.3 Sync, pin & subscribe API surface

Assemble the distribution surface: `sync`/`merge` returning typed reports/conflicts, `pin`/`resolvePin` over `SnapshotRef`, and `subscribe` yielding the `FactDelta` stream. **Ships inside M3.**

- **Implements:** [FR-D1](./10-functional-requirements.md#fr-d1), [FR-D2](./10-functional-requirements.md#fr-d2), [FR-D5](./10-functional-requirements.md#fr-d5), [FR-D6](./10-functional-requirements.md#fr-d6) · [NFR-H1](./11-non-functional-requirements.md#nfr-h1)
- **Exit criteria:** API-shape snapshot test asserting the distribution-surface signatures (`SyncReport`/`MergeReport`/`Conflict`, `pin`/`resolvePin`, `Frontier.chainSeq`) compile and match the committed snapshot
- **Depends on:** [T4.2](./81d-tasks-m3.md#T4.2), [T4.8](./81d-tasks-m3.md#T4.8), [T3.5](./81c-tasks-m2.md#T3.5)
- **Subtasks:**
  - [ ] T11.3.1 sync/merge SDK shapes (SyncReport, Conflict[])
  - [ ] T11.3.2 pin/subscribe SDK shapes

### <a id="T11.4"></a>T11.4 Retrieval & provenance API surface

Assemble the retrieval/provenance surface: `recall`, `salience`, `provenanceOf`, `rollup` into the normative SDK shapes. **Ships inside M4.**

- **Implements:** [FR-C1](./10-functional-requirements.md#fr-c1), [FR-C4](./10-functional-requirements.md#fr-c4), [FR-E1](./10-functional-requirements.md#fr-e1), [FR-E3](./10-functional-requirements.md#fr-e3) · [NFR-F6](./11-non-functional-requirements.md#nfr-f6)
- **Exit criteria:** API-shape snapshot test asserting the retrieval/provenance signatures (`RecallQuery` incl. caller-supplied `embedding`, `RecallResult`, `RollupOptions`) compile and match the committed snapshot
- **Depends on:** [T5.5](./81e-tasks-m4.md#T5.5), [T9.6](./81i-tasks-m8.md#T9.6)
- **Subtasks:**
  - [ ] T11.4.1 recall/salience SDK shapes
  - [ ] T11.4.2 provenanceOf/rollup SDK shapes

### <a id="T11.5"></a>T11.5 Forgetting & security API surface

Assemble the forgetting and security surface: `tombstone`/`excise`, `registerFunctionality`/`compileContextualQuery`/`executeSegment`/`runContextualQuery`/`learn`/`runAcquisition`, `revokeKey`/`withScope` into the SDK shapes, plus the typed `KipError` model. **Ships inside M8** (the active-layer shapes land with M5–M7 but the surface closes at M8).

- **Implements:** [FR-F1](./10-functional-requirements.md#fr-f1), [FR-F2](./10-functional-requirements.md#fr-f2), [FR-I1](./10-functional-requirements.md#fr-i1), [FR-I2](./10-functional-requirements.md#fr-i2), [FR-J1](./10-functional-requirements.md#fr-j1), [FR-K1](./10-functional-requirements.md#fr-k1), [FR-L2](./10-functional-requirements.md#fr-l2), [FR-L4](./10-functional-requirements.md#fr-l4) · [NFR-E1](./11-non-functional-requirements.md#nfr-e1)
- **Exit criteria:** API-shape snapshot test asserting the forgetting/security/active-layer signatures (incl. the compile/execute split, the discriminated `runContextualQuery` return, and the `KipError` code union) compile and match the committed snapshot
- **Depends on:** [T4.6](./81d-tasks-m3.md#T4.6), [T6.3](./81f-tasks-m5.md#T6.3), [T7.2](./81g-tasks-m6.md#T7.2), [T8.1](./81h-tasks-m7.md#T8.1), [T9.4](./81i-tasks-m8.md#T9.4), [T9.5](./81i-tasks-m8.md#T9.5)
- **Subtasks:**
  - [ ] T11.5.1 tombstone/excise SDK shapes
  - [ ] T11.5.2 Active-layer SDK shapes (registerFunctionality/runContextualQuery/learn/runAcquisition)
  - [ ] T11.5.3 Security SDK shapes (revokeKey/withScope)


---

## E13: Tooling & ops (CLI, fsck, packing/GC, observability)

**Goal.** Operational tooling around the substrate: a CLI surface, fsck integrity checks, rollup, packing/GC of unreachable objects, and observability over runs and projections.

**Detailed doc:** [./22-git-substrate.md](./22-git-substrate.md)

### <a id="T13.1"></a>T13.1 CLI surface

Build a CLI exposing the core operations (write/sync/recall/pin/provenance/forget) over the SDK surface for operators.

- **Implements:** [FR-A1](./10-functional-requirements.md#fr-a1), [FR-D1](./10-functional-requirements.md#fr-d1) · —
- **Exit criteria:** —
- **Depends on:** [T11.1](#T11.1), [T11.3](#T11.3)
- **Subtasks:**
  - [ ] T13.1.1 Core command set over the SDK surface
  - [ ] T13.1.2 Scoped/tenant CLI flags

### <a id="T13.2"></a>T13.2 fsck CLI & integrity reporting

Expose `fsck` as a CLI integrity check reporting `heads==proj(facts)`, fact-signature verification, author-HLC chaining, and post-excision no-residue, clearly labeled local-not-convergence.

- **Implements:** [FR-E2](./10-functional-requirements.md#fr-e2) · [NFR-G2](./11-non-functional-requirements.md#nfr-g2)
- **Exit criteria:** [INV-6](./60-conformance-and-testability.md#inv-6)
- **Depends on:** [T9.6](./81i-tasks-m8.md#T9.6)
- **Subtasks:**
  - [ ] T13.2.1 fsck CLI command + structured report
  - [ ] T13.2.2 Local-integrity (not convergence) labeling

### <a id="T13.3"></a>T13.3 Rollup & read-latency snapshots

Implement `rollup(opts)` writing a `kip:rollup` marker (covered HLC range + pre-rollup tip CID) and materializing a `/heads` snapshot to bound traversal cost, without freeing bytes.

- **Implements:** [FR-E3](./10-functional-requirements.md#fr-e3) · [NFR-C1](./11-non-functional-requirements.md#nfr-c1), [NFR-F4](./11-non-functional-requirements.md#nfr-f4)
- **Exit criteria:** [INV-9](./60-conformance-and-testability.md#inv-9) — this task carries the **rollup half** of INV-9 deferred out of M3's excision-half gate ([80 M3](./80-roadmap-and-milestones.md))
- **Depends on:** [T4.4](./81d-tasks-m3.md#T4.4)
- **Subtasks:**
  - [ ] T13.3.1 kip:rollup marker + /heads snapshot materialization
  - [ ] T13.3.2 Bytes remain reachable/auditable (no byte free)

### <a id="T13.4"></a>T13.4 Packing & GC of unreachable objects

Implement packing/gc that reclaims bytes only for unreachable objects (post-excision), never altering query results for any non-excised `asOf`.

- **Implements:** — · [NFR-C1](./11-non-functional-requirements.md#nfr-c1)
- **Exit criteria:** [INV-9](./60-conformance-and-testability.md#inv-9) — this task carries the **gc/repack half** of INV-9 deferred out of M3's excision-half gate ([80 M3](./80-roadmap-and-milestones.md))
- **Depends on:** [T4.6](./81d-tasks-m3.md#T4.6)
- **Subtasks:**
  - [ ] T13.4.1 GC of unreachable post-excision objects
  - [ ] T13.4.2 Result-stability for non-excised asOf

### <a id="T13.5"></a>T13.5 Observability over runs & projections

Build observability surfaces (metrics/logs over admitted-set size, projection rebuilds, retention/eviction, conflict/quarantine counts) for operating a kip deployment.

- **Implements:** — · [NFR-F2](./11-non-functional-requirements.md#nfr-f2)
- **Exit criteria:** —
- **Depends on:** [T11.4](#T11.4), [T10.5](./81i-tasks-m8.md#T10.5)
- **Subtasks:**
  - [ ] T13.5.1 Admitted-set/projection-rebuild metrics
  - [ ] T13.5.2 Retention/eviction + conflict/quarantine observability


---

**Navigation:** [↑ index](./81-roadmap-epics-and-tasks.md) · [← M9 — Conformance suite](./81j-tasks-m9.md)
