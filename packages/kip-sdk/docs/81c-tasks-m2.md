# Roadmap tasks — M2 — Bitemporality & as-of

> Part of the dependency-ordered work-breakdown structure indexed at [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) — see that file for the legend (id scheme, the Implements/Exit-criteria/Depends-on semantics, and the machine-checked anchor convention) and the full task-level dependency graph. This file carries the **E3** slice of the WBS. Realizes milestone **M2**; see [80-roadmap-and-milestones.md](./80-roadmap-and-milestones.md) for the milestone-level goal/dependencies/exit-criteria.

---

## E3: Bitemporality & as-of

**Goal.** Valid-time / transaction-time geometry, the convergent valid-time lens vs the per-replica belief lens, tombstone definition, and frontier-addressed pins (M2).

**Detailed doc:** [./23-temporality-and-bitemporality.md](./23-temporality-and-bitemporality.md)

### <a id="T3.1"></a>T3.1 Bitemporal envelope (valid time vs transaction time)

Wire the two independent temporal axes: valid time (`validFrom`/`validTo`, gaps legal) vs transaction time (`rxFrom`, audit-only, excluded from `proj`).

- **Implements:** [FR-E4](./10-functional-requirements.md#fr-e4) · [NFR-A5](./11-non-functional-requirements.md#nfr-a5)
- **Exit criteria:** [INV-11](./60-conformance-and-testability.md#inv-11)
- **Depends on:** [T2.5](./81b-tasks-m1.md#T2.5)
- **Subtasks:**
  - [ ] T3.1.1 Valid-time axis with legal gaps
  - [ ] T3.1.2 Transaction-time axis (rxFrom) excluded from proj

### <a id="T3.2"></a>T3.2 asOf reads (valid-time lens & belief lens)

Implement `asOf(asOf)`: the proj-pure convergent valid-time world-truth lens and the per-replica, explicitly non-convergent belief-audit txTime lens resolved against the believer's rxFrom-ordered frontier.

- **Implements:** [FR-B3](./10-functional-requirements.md#fr-b3), [FR-E4](./10-functional-requirements.md#fr-e4) · [NFR-A5](./11-non-functional-requirements.md#nfr-a5)
- **Exit criteria:** [INV-4](./60-conformance-and-testability.md#inv-4), [INV-11](./60-conformance-and-testability.md#inv-11)
- **Depends on:** [T3.1](#T3.1)
- **Subtasks:**
  - [ ] T3.2.1 asOf({validTime}) convergent valid-time lens
  - [ ] T3.2.2 asOf({txTime, believer}) per-replica belief-audit lens
  - [ ] T3.2.3 Belief oracle agreement at every rxTime slice

### <a id="T3.3"></a>T3.3 Tombstone (logical forgetting)

Implement `tombstone(eid, reason)`: append a signed tombstone/retract fact closing/splitting valid-time and removing from default reads while keeping bytes and signatures (auditable, reversible).

- **Implements:** [FR-F1](./10-functional-requirements.md#fr-f1) · [NFR-E1](./11-non-functional-requirements.md#nfr-e1)
- **Exit criteria:** —
- **Depends on:** [T2.5](./81b-tasks-m1.md#T2.5)
- **Subtasks:**
  - [ ] T3.3.1 Signed tombstone/retract fact closing/splitting valid-time
  - [ ] T3.3.2 Default-read removal; bytes & signatures preserved

### <a id="T3.4"></a>T3.4 Soft-forget (decay/eviction from hot projections)

Implement reversible soft-forget that drops entities from hot projections without touching git.

- **Implements:** [FR-F5](./10-functional-requirements.md#fr-f5) · —
- **Exit criteria:** —
- **Depends on:** [T3.3](#T3.3)
- **Subtasks:**
  - [ ] T3.4.1 Reversible hot-projection eviction (no git write)

### <a id="T3.5"></a>T3.5 Frontier-addressed pins (SnapshotRef)

Implement `pin(scope, asOf?)` returning a `SnapshotRef` that content-addresses the chain-seq + author-HLC frontier + `factSetDigest` with no commit CIDs, and `resolvePin(ref)` reporting pin-incomplete until every sub-frontier fact is present.

- **Implements:** [FR-D5](./10-functional-requirements.md#fr-d5) · [NFR-A5](./11-non-functional-requirements.md#nfr-a5)
- **Exit criteria:** [INV-14a](./60-conformance-and-testability.md#inv-14a) (single-replica pin sub-invariant — the cross-replica half of INV-14 needs T4.2's sync and gates M3)
- **Depends on:** [T3.2](#T3.2)
- **Subtasks:**
  - [ ] T3.5.1 SnapshotRef over chain-seq + author-HLC frontier + factSetDigest
  - [ ] T3.5.2 No commit CIDs; re-resolvable after excision (resolvePin)
  - [ ] T3.5.3 pin-incomplete via per-(replicaId,key) seq-contiguity rule (m7-1/m7-2)

### <a id="T3.6"></a>T3.6 Memory dynamics over time (decay/salience/consolidation seams)

Stage decay, salience recomputation, and consolidation as time-discounted recomputations / fact-emitting operations, with read events as facts so the salience input is auditable.

- **Implements:** [FR-H1](./10-functional-requirements.md#fr-h1), [FR-H2](./10-functional-requirements.md#fr-h2), [FR-H3](./10-functional-requirements.md#fr-h3) · [NFR-G3](./11-non-functional-requirements.md#nfr-g3)
- **Exit criteria:** —
- **Depends on:** [T3.1](#T3.1)
- **Subtasks:**
  - [ ] T3.6.1 Co-resident episodic/semantic layers (memoryClass facet)
  - [ ] T3.6.2 consolidate control fact + derived_from provenance edge
  - [ ] T3.6.3 Decay as scheduled salience recomputation (writes no facts)


---

**Navigation:** [↑ index](./81-roadmap-epics-and-tasks.md) · [← M1 — Projection & convergence](./81b-tasks-m1.md) · [M3 — Sync & regeneration →](./81d-tasks-m3.md)
