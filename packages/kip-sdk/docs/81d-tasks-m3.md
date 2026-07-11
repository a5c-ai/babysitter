# Roadmap tasks — M3 — Synchronization, merge & deterministic regeneration

> Part of the dependency-ordered work-breakdown structure indexed at [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) — see that file for the legend (id scheme, the Implements/Exit-criteria/Depends-on semantics, and the machine-checked anchor convention) and the full task-level dependency graph. This file carries the **E4** slice of the WBS. Realizes milestone **M3**; see [80-roadmap-and-milestones.md](./80-roadmap-and-milestones.md) for the milestone-level goal/dependencies/exit-criteria.

---

## E4: Synchronization, merge & deterministic regeneration

**Goal.** The correctness core: HLC, content-addressed set-union sync, regenerated `/heads`, SEC over the signature-valid admitted set, and concurrent-excision confluence with a byte-identical regenerated DAG (M3).

**Detailed doc:** [./24-synchronization-and-convergence.md](./24-synchronization-and-convergence.md)

### <a id="T4.1"></a>T4.1 HLC fully wired

Implement the Hybrid Logical Clock: counter overflow carries (never wraps), author-stamped, feeding `orderKey` and the per-replica frontier.

- **Implements:** — · [NFR-A5](./11-non-functional-requirements.md#nfr-a5), [NFR-D5](./11-non-functional-requirements.md#nfr-d5)
- **Exit criteria:** [INV-2a](./60-conformance-and-testability.md#inv-2a) (substrate-only SEC sub-invariant — full INV-2's trust-overlay permutations gate M8)
- **Depends on:** [T2.2](./81b-tasks-m1.md#T2.2), [T1.2](./81a-tasks-m0.md#T1.2)
- **Subtasks:**
  - [ ] T4.1.1 HLC (wall, counter) advance rules
  - [ ] T4.1.2 Counter overflow -> carry, never wrap
  - [ ] T4.1.3 Fork/inversion demotion in `proj` (m7-1) — author-side `seq` stamping and durable tip
        persistence moved to [T1.2.5](./81a-tasks-m0.md#T1.2) (M0, author-side envelope stamping); this task covers only
        the `proj`-time fork (equal-`seq`, distinct-`factCID`) and inversion (`seq` order inverting
        author-HLC order) demotions to `untrusted-malformed`, scoped to the fork point/inverting fact and
        every same-pair fact with higher `seq` (A-2/A-12)

### <a id="T4.2"></a>T4.2 Sync: content-addressed set-union delta

Implement `sync(remote, opts?)` exchanging only missing fact objects (git content-addressed delta), applying set-union merge, and returning a typed `SyncReport`.

- **Implements:** [FR-D1](./10-functional-requirements.md#fr-d1), [FR-D7](./10-functional-requirements.md#fr-d7) · [NFR-A8](./11-non-functional-requirements.md#nfr-a8)
- **Exit criteria:** [INV-13a](./60-conformance-and-testability.md#inv-13a) (gate-level admitted-on-receipt, re-run under sync — the full INV-13's quarantine/untrusted assertions need M8's trust overlay)
- **Depends on:** [T4.1](#T4.1), [T1.6](./81a-tasks-m0.md#T1.6)
- **Subtasks:**
  - [ ] T4.2.1 Missing-blob fetch/push (git content-addressed delta)
  - [ ] T4.2.2 Set-union merge; typed SyncReport
  - [ ] T4.2.3 Idempotent re-ingestion on sync

### <a id="T4.3"></a>T4.3 Explicit merge & /heads regeneration

Implement `merge(from, opts?)` as a typed set-union merge where `/heads` is regenerated (never text-merged), convergent under any topology, returning typed conflicts never auto-picked.

- **Implements:** [FR-D2](./10-functional-requirements.md#fr-d2), [FR-D3](./10-functional-requirements.md#fr-d3) · [NFR-A3](./11-non-functional-requirements.md#nfr-a3), [NFR-A4](./11-non-functional-requirements.md#nfr-a4), [NFR-H1](./11-non-functional-requirements.md#nfr-h1)
- **Exit criteria:** [INV-2](./60-conformance-and-testability.md#inv-2)
- **Depends on:** [T4.2](#T4.2), [T2.6](./81b-tasks-m1.md#T2.6)
- **Subtasks:**
  - [ ] T4.3.1 Set-union merge with /heads regenerated, not merged
  - [ ] T4.3.2 Typed Conflict[] surfacing (no silent auto-resolve)

### <a id="T4.4"></a>T4.4 Branch-per-replica topology

Implement branch-per-agent writes (`refs/kip/replicas/<id>`), a convenience main trunk, and session pins, so any merge topology (star or peer mesh) converges coordinator-free.

- **Implements:** [FR-D4](./10-functional-requirements.md#fr-d4) · [NFR-A4](./11-non-functional-requirements.md#nfr-a4)
- **Exit criteria:** [INV-2](./60-conformance-and-testability.md#inv-2)
- **Depends on:** [T4.3](#T4.3)
- **Subtasks:**
  - [ ] T4.4.1 Per-replica branch writes (no cross-agent serialization)
  - [ ] T4.4.2 Trunk anchor + session read-pins
  - [ ] T4.4.3 Topology-independent convergence

### <a id="T4.5"></a>T4.5 Two-layer reconciliation & supersede

Implement the two-layer reconciliation: substrate G-Set vs recorded semantic supersession, with `supersede` keyed by input CIDs.

- **Implements:** [FR-D3](./10-functional-requirements.md#fr-d3) · [NFR-A3](./11-non-functional-requirements.md#nfr-a3)
- **Exit criteria:** [INV-2](./60-conformance-and-testability.md#inv-2)
- **Depends on:** [T4.3](#T4.3)
- **Subtasks:**
  - [ ] T4.5.1 G-Set substrate layer vs semantic supersession layer
  - [ ] T4.5.2 supersede keyed by input CIDs

### <a id="T4.6"></a>T4.6 Excision & deterministic DAG regeneration

Implement `excise(factId, reason)` as an authorized history rewrite re-folding `/heads` with no residue, and the deterministic, set-derived, byte-identical commit-DAG regeneration (incremental from the excision point).

- **Implements:** [FR-F2](./10-functional-requirements.md#fr-f2), [FR-F3](./10-functional-requirements.md#fr-f3), [FR-F4](./10-functional-requirements.md#fr-f4) · [NFR-A9](./11-non-functional-requirements.md#nfr-a9), [NFR-E2](./11-non-functional-requirements.md#nfr-e2), [NFR-F5](./11-non-functional-requirements.md#nfr-f5)
- **Exit criteria:** [INV-9](./60-conformance-and-testability.md#inv-9), [INV-12](./60-conformance-and-testability.md#inv-12)
- **Depends on:** [T4.4](#T4.4), [T3.5](./81c-tasks-m2.md#T3.5)
- **Subtasks:**
  - [ ] T4.6.1 Authorized excision marker (privacy-safe nonce, re-fold set)
  - [ ] T4.6.2 Set-derived commit boundaries/timestamp/sentinel/unsigned DAG
  - [ ] T4.6.3 Cross-OS/cross-TZ byte-identity (LF-only, +0000, no gpgsig)
  - [ ] T4.6.4 Incremental regeneration from earliest excised orderKey
  - [ ] T4.6.5 kip:excised-input aggregate flagging

### <a id="T4.7"></a>T4.7 As-of across excision & excised placeholders

Ensure reads resolving through an excised fact return a typed excised placeholder segment (or error if `excised:error`), never silently fabricated data.

- **Implements:** [FR-B4](./10-functional-requirements.md#fr-b4) · [NFR-E2](./11-non-functional-requirements.md#nfr-e2), [NFR-H1](./11-non-functional-requirements.md#nfr-h1)
- **Exit criteria:** [INV-9](./60-conformance-and-testability.md#inv-9), [INV-12](./60-conformance-and-testability.md#inv-12)
- **Depends on:** [T4.6](#T4.6)
- **Subtasks:**
  - [ ] T4.7.1 Typed excised placeholder segment on resolve-through
  - [ ] T4.7.2 excised:error mode

### <a id="T4.8"></a>T4.8 Incremental update stream (subscribe)

Implement `subscribe(scope, since?)` yielding an `AsyncIterable<FactDelta>` keyed by a per-replica author-HLC frontier cursor, whose `affected` lists every entity whose head changed (including revocation/excision re-folds).

- **Implements:** [FR-D6](./10-functional-requirements.md#fr-d6) · [NFR-A5](./11-non-functional-requirements.md#nfr-a5)
- **Exit criteria:** [INV-2](./60-conformance-and-testability.md#inv-2)
- **Depends on:** [T4.4](#T4.4)
- **Subtasks:**
  - [ ] T4.8.1 Frontier-cursor keyed delta stream (never a scalar HLC)
  - [ ] T4.8.2 affected lists every changed entity incl. re-folds


---

**Navigation:** [↑ index](./81-roadmap-epics-and-tasks.md) · [← M2 — Bitemporality & as-of](./81c-tasks-m2.md) · [M4 — Retrieval & indexing →](./81e-tasks-m4.md)
