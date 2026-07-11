# Roadmap tasks — M6 — Active knowledge: autoencoding (learn)

> Part of the dependency-ordered work-breakdown structure indexed at [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) — see that file for the legend (id scheme, the Implements/Exit-criteria/Depends-on semantics, and the machine-checked anchor convention) and the full task-level dependency graph. This file carries the **E7** slice of the WBS. Realizes milestone **M6**; see [80-roadmap-and-milestones.md](./80-roadmap-and-milestones.md) for the milestone-level goal/dependencies/exit-criteria.

---

## E7: Active knowledge: autoencoding (learn)

**Goal.** The encode → decode → reconstruction-loss → learner loop run outside `proj` under a total disjunctive budget, recorded as signed `kip:learn` / `kip:learn-exhausted` facts with loss excluded from `orderKey`/reducers (M6).

**Detailed doc:** [./32-knowledge-autoencoding.md](./32-knowledge-autoencoding.md)

### <a id="T7.1"></a>T7.1 Explicit microagent selection (encode/decode/learner/loss)

Implement explicit selection of encode/decode/learner/loss microagents from `LearnOptions` by `(name, version)`, rejecting an unregistered/unsigned named manifest, never heuristically picking by `rawKind`.

- **Implements:** [FR-J2](./10-functional-requirements.md#fr-j2) · [NFR-H1](./11-non-functional-requirements.md#nfr-h1)
- **Exit criteria:** [INV-A13](./60-conformance-and-testability.md#inv-a13)
- **Depends on:** [T6.1](./81f-tasks-m5.md#T6.1)
- **Subtasks:**
  - [ ] T7.1.1 Select named (name,version) manifests from LearnOptions
  - [ ] T7.1.2 Reject unregistered/unsigned named manifest before the loop

### <a id="T7.2"></a>T7.2 Autoencoding loop with total disjunctive budget

Implement `learn(rawRef, opts)` running encode→decode→reconstruction-loss→learner outside `proj` under the total disjunctive budget so the first axis to cap trips exhausted — budget semantics per [FR-J1](./10-functional-requirements.md#fr-j1) / [§5b.2](./32-knowledge-autoencoding.md).

- **Implements:** [FR-J1](./10-functional-requirements.md#fr-j1) · [NFR-B4](./11-non-functional-requirements.md#nfr-b4), [NFR-H4](./11-non-functional-requirements.md#nfr-h4)
- **Exit criteria:** [INV-A5](./60-conformance-and-testability.md#inv-a5)
- **Depends on:** [T7.1](#T7.1)
- **Subtasks:**
  - [ ] T7.2.1 encode/decode/loss/learner loop outside proj
  - [ ] T7.2.2 Total disjunctive budget; first-cap trips exhausted

### <a id="T7.3"></a>T7.3 Accept-if-improved monotonicity & rawKind threading

Implement accept-if-improved learner state (monotone non-increasing `bestLoss`, candidate = best proposal, options↔state agreement) and thread the once-declared `rawKind` unchanged into every `DecodeAgent` invocation.

- **Implements:** [FR-J2](./10-functional-requirements.md#fr-j2) · [NFR-B4](./11-non-functional-requirements.md#nfr-b4)
- **Exit criteria:** [INV-A12](./60-conformance-and-testability.md#inv-a12), [INV-A14](./60-conformance-and-testability.md#inv-a14)
- **Depends on:** [T7.2](#T7.2)
- **Subtasks:**
  - [ ] T7.3.1 Monotone bestLoss; candidate never regresses
  - [ ] T7.3.2 LearnerLoopState budget/threshold == LearnOptions
  - [ ] T7.3.3 rawKind sourced once, threaded byte-identical into every decode

### <a id="T7.4"></a>T7.4 Record result as facts (kip:learn / kip:learn-exhausted)

On accept, commit a signed `kip:learn` fact (inputs + selected `(name,version)`s + achieved loss + accepted `AssertInput[]`); on exhaustion, commit a signed `kip:learn-exhausted` marker and no accept fact.

- **Implements:** [FR-J3](./10-functional-requirements.md#fr-j3) · [NFR-H4](./11-non-functional-requirements.md#nfr-h4), [NFR-G1](./11-non-functional-requirements.md#nfr-g1)
- **Exit criteria:** [INV-A5](./60-conformance-and-testability.md#inv-a5)
- **Depends on:** [T7.2](#T7.2)
- **Subtasks:**
  - [ ] T7.4.1 Signed kip:learn accept fact naming inputs + loss + AssertInput[]
  - [ ] T7.4.2 Signed kip:learn-exhausted marker; no accept on exhaustion

### <a id="T7.5"></a>T7.5 Loss-exclusion & replica-fold (proj never re-runs)

Ensure achieved loss is excluded from `orderKey` and every reducer/trust decision (the `kip:learn` winner is chosen by author-HLC `orderKey`), and that replicas fold the recorded result without re-running the loop.

- **Implements:** [FR-J3](./10-functional-requirements.md#fr-j3), [FR-J4](./10-functional-requirements.md#fr-j4) · [NFR-B4](./11-non-functional-requirements.md#nfr-b4), [NFR-A5](./11-non-functional-requirements.md#nfr-a5)
- **Exit criteria:** [INV-A4](./60-conformance-and-testability.md#inv-a4), [INV-A9](./60-conformance-and-testability.md#inv-a9)
- **Depends on:** [T7.4](#T7.4), [T2.3](./81b-tasks-m1.md#T2.3)
- **Subtasks:**
  - [ ] T7.5.1 Loss excluded from orderKey/reducers/trust (like rxFrom)
  - [ ] T7.5.2 Replica fold of recorded result; proj never re-runs loop
  - [ ] T7.5.3 Same-set/different-loss dedup as one no-op (not conflict)


---

**Navigation:** [↑ index](./81-roadmap-epics-and-tasks.md) · [← M5 — Contextual functionalities](./81f-tasks-m5.md) · [M7 — Acquisition families →](./81h-tasks-m7.md)
