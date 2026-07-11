# Roadmap tasks — M5 — Active knowledge: contextual functionalities

> Part of the dependency-ordered work-breakdown structure indexed at [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) — see that file for the legend (id scheme, the Implements/Exit-criteria/Depends-on semantics, and the machine-checked anchor convention) and the full task-level dependency graph. This file carries the **E6** slice of the WBS. Realizes milestone **M5**; see [80-roadmap-and-milestones.md](./80-roadmap-and-milestones.md) for the milestone-level goal/dependencies/exit-criteria.

---

## E6: Active knowledge: contextual functionalities

**Goal.** EdgeKinds carrying microagents: `registerFunctionality`, `ContextualQuery` compile to a Segment DAG (pure proj read), deterministic topological execution dispatching client microagents while the orchestrator commits signed `assert` + `derived_from` facts (M5).

**Detailed doc:** [./31-contextual-functionalities.md](./31-contextual-functionalities.md)

### <a id="T6.1"></a>T6.1 Microagent manifests & FunctionalityBinding

Implement signed microagent-registration + `FunctionalityBinding` facts binding a microagent to an EdgeKind, additively (N realizers enumerated as alternatives, never silently picked), as advisory selection metadata only.

- **Implements:** [FR-I1](./10-functional-requirements.md#fr-i1) · [NFR-H1](./11-non-functional-requirements.md#nfr-h1)
- **Exit criteria:** [INV-A7](./60-conformance-and-testability.md#inv-a7)
- **Depends on:** [T4.4](./81d-tasks-m3.md#T4.4), [T2.4](./81b-tasks-m1.md#T2.4)
- **Subtasks:**
  - [ ] T6.1.1 registerFunctionality emits signed registration + binding facts
  - [ ] T6.1.2 Additive N-realizer binding; reject NaN/Inf weight/comparand at registration
  - [ ] T6.1.3 Descriptor is advisory; does not gate fact membership

### <a id="T6.2"></a>T6.2 ContextualQuery compile -> Segment DAG

Implement the compile+match phase: a pure read over `proj` at `q.asOf` producing a `Segment` (steps + deps DAG) with byte-identical topological order, rejecting cyclic/out-of-range deps at compile.

- **Implements:** [FR-I2](./10-functional-requirements.md#fr-i2) · [NFR-A3](./11-non-functional-requirements.md#nfr-a3)
- **Exit criteria:** [INV-A2](./60-conformance-and-testability.md#inv-a2)
- **Depends on:** [T6.1](#T6.1), [T5.4](./81e-tasks-m4.md#T5.4)
- **Subtasks:**
  - [ ] T6.2.1 Pure proj read at q.asOf -> Segment(steps + deps)
  - [ ] T6.2.2 Byte-identical topological order (steps-index then §3.4 tiebreak)
  - [ ] T6.2.3 Reject cyclic/out-of-range deps at compile

### <a id="T6.3"></a>T6.3 Step execution & orchestrator-only authoring (INV-A1)

Implement the execute phase: walk steps in topological order, dispatch the bound microagent (client only), validate output against the manifest `outputSchema`, and have the orchestrator author signed `assert` + `derived_from` facts.

- **Implements:** [FR-I2](./10-functional-requirements.md#fr-i2) · [NFR-G1](./11-non-functional-requirements.md#nfr-g1)
- **Exit criteria:** [INV-A1](./60-conformance-and-testability.md#inv-a1), [INV-A8](./60-conformance-and-testability.md#inv-a8)
- **Depends on:** [T6.2](#T6.2)
- **Subtasks:**
  - [ ] T6.3.1 Topological-order microagent dispatch (clients only)
  - [ ] T6.3.2 outputSchema validation before authoring
  - [ ] T6.3.3 Orchestrator-only assert + derived_from authoring

### <a id="T6.4"></a>T6.4 N5-safe step outcomes & pure-proj guards

Implement the five N5-safe step outcomes (success / dispatch-failure / constraint-violation / pending-guard / upstream-stop) leaving the cell Unknown and emitting no fact on failure, with guards/inheritance as pure proj reads.

- **Implements:** [FR-I4](./10-functional-requirements.md#fr-i4), [FR-I5](./10-functional-requirements.md#fr-i5) · [NFR-H3](./11-non-functional-requirements.md#nfr-h3), [NFR-H2](./11-non-functional-requirements.md#nfr-h2)
- **Exit criteria:** [INV-A3](./60-conformance-and-testability.md#inv-a3)
- **Depends on:** [T6.3](#T6.3)
- **Subtasks:**
  - [ ] T6.4.1 Five N5-safe outcomes; zero facts + Unknown on failure
  - [ ] T6.4.2 requires/constraint/condition + is_a as pure proj reads
  - [ ] T6.4.3 Unknown PropCells propagate Unknown, never defaulted

### <a id="T6.5"></a>T6.5 Multi-segment / multi-realizer typed choice

Surface all satisfying segments and all realizers binding a hop as a typed choice (alternatives), where declared weight/tags may order presentation but never collapse to a silent winner.

- **Implements:** [FR-I3](./10-functional-requirements.md#fr-i3) · [NFR-H1](./11-non-functional-requirements.md#nfr-h1)
- **Exit criteria:** [INV-A7](./60-conformance-and-testability.md#inv-a7)
- **Depends on:** [T6.2](#T6.2)
- **Subtasks:**
  - [ ] T6.5.1 Segment.alternatives ordered by weight then §3.4 tiebreak
  - [ ] T6.5.2 Execute nothing until caller chooses

### <a id="T6.6"></a>T6.6 AnswerGraph from derived_from projection

Return an `AnswerGraph` read back from the `derived_from` subgraph at the recorded `asOf`, byte-identical to `proj`'s projection and with every result/intermediate EID reachable from the seed.

- **Implements:** [FR-I2](./10-functional-requirements.md#fr-i2) · [NFR-A3](./11-non-functional-requirements.md#nfr-a3)
- **Exit criteria:** [INV-A8](./60-conformance-and-testability.md#inv-a8)
- **Depends on:** [T6.3](#T6.3)
- **Subtasks:**
  - [ ] T6.6.1 Project derived_from subgraph at recorded asOf
  - [ ] T6.6.2 Every result/intermediate reachable from seed

### <a id="T6.7"></a>T6.7 Hop idempotence & node-merge (same_as closure)

Ensure an identical hop on identical input is a factCID-dedup no-op resolving to the same namespaced EID, and implement `same_as` equivalence-closure with canonical-EID selection and disputed-merge conflicts.

- **Implements:** [FR-I1](./10-functional-requirements.md#fr-i1) · [NFR-A8](./11-non-functional-requirements.md#nfr-a8), [NFR-H1](./11-non-functional-requirements.md#nfr-h1)
- **Exit criteria:** [INV-A6](./60-conformance-and-testability.md#inv-a6), [INV-A11](./60-conformance-and-testability.md#inv-a11)
- **Depends on:** [T6.3](#T6.3), [T1.6](./81a-tasks-m0.md#T1.6)
- **Subtasks:**
  - [ ] T6.7.1 Identical-hop factCID-dedup no-op; same EID node-merge
  - [ ] T6.7.2 same_as closure + canonical EID (min by namespaceId,localId)
  - [ ] T6.7.3 not_same_as contradiction -> kip:conflict on (min,max) cell


---

**Navigation:** [↑ index](./81-roadmap-epics-and-tasks.md) · [← M4 — Retrieval & indexing](./81e-tasks-m4.md) · [M6 — Autoencoding →](./81g-tasks-m6.md)
