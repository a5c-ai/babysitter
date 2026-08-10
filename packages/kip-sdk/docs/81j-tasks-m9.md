# Roadmap tasks — M9 — Conformance suite (full INV + INV-A)

> Part of the dependency-ordered work-breakdown structure indexed at [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) — see that file for the legend (id scheme, the Implements/Exit-criteria/Depends-on semantics, and the machine-checked anchor convention) and the full task-level dependency graph. This file carries the **E12** slice of the WBS. Realizes milestone **M9**; see [80-roadmap-and-milestones.md](./80-roadmap-and-milestones.md) for the milestone-level goal/dependencies/exit-criteria.

---

## E12: Conformance suite (full INV + INV-A)

**Goal.** Determinism-as-test-strategy: the full INV-1..19 + INV-A1..A14 catalog as a shippable, gating suite with random-permutation folds, adversarial perturbation recipes, and the accelerator recall-threshold boundary (M9).

**Detailed doc:** [./60-conformance-and-testability.md](./60-conformance-and-testability.md)

### <a id="T12.1"></a>T12.1 Determinism harness (random-permutation/partition replay)

Build the random-permutation fold and random-order/random-partition replay equality harness plus the adversarial-perturbation rig (`rxFrom`, commit grouping, simulated receiver clock, key-registration arrival order). **Split so milestone gates precede their harness (m7-27):** the single-process fold + perturbation rig (T12.1.1/T12.1.3) depends only on T2.2/T2.3 and is the harness that closes **M1**'s INV-1/INV-3 gate; only the multi-replica replay-across-merge rig (T12.1.2) additionally needs T4.3.

- **Implements:** — · [NFR-A3](./11-non-functional-requirements.md#nfr-a3), [NFR-A4](./11-non-functional-requirements.md#nfr-a4)
- **Exit criteria:** [INV-1](./60-conformance-and-testability.md#inv-1), [INV-2](./60-conformance-and-testability.md#inv-2), [INV-3](./60-conformance-and-testability.md#inv-3)
- **Depends on:** [T2.2](./81b-tasks-m1.md#T2.2), [T2.3](./81b-tasks-m1.md#T2.3) (T12.1.1/T12.1.3 — the M1-blocking rig); [T4.3](./81d-tasks-m3.md#T4.3) (T12.1.2 only)
- **Subtasks:**
  - [ ] T12.1.1 Random-permutation fold byte-identity assertions (needs T2.2/T2.3 only — M1's gating rig)
  - [ ] T12.1.2 Random-order/partition replay-across-merge equality (additionally needs T4.3)
  - [ ] T12.1.3 Adversarial perturbation rig (rxFrom/clock/key-order) (needs T2.2/T2.3 only — M1's gating rig)

### <a id="T12.2"></a>T12.2 Convergence & substrate INV suite (INV-2/6/7/13)

Assert the convergence/substrate invariants: SEC over the signature-valid admitted set, gate/proj separation, idempotent ingestion, and signature-valid-eventually-admitted-on-receipt under skew/partition/key-ordering.

- **Implements:** — · [NFR-A2](./11-non-functional-requirements.md#nfr-a2), [NFR-A7](./11-non-functional-requirements.md#nfr-a7), [NFR-A8](./11-non-functional-requirements.md#nfr-a8), [NFR-D5](./11-non-functional-requirements.md#nfr-d5)
- **Exit criteria:** [INV-2](./60-conformance-and-testability.md#inv-2), [INV-6](./60-conformance-and-testability.md#inv-6), [INV-7](./60-conformance-and-testability.md#inv-7), [INV-13](./60-conformance-and-testability.md#inv-13)
- **Depends on:** [T12.1](#T12.1), [T1.6](./81a-tasks-m0.md#T1.6), [T9.2](./81i-tasks-m8.md#T9.2)
- **Subtasks:**
  - [ ] T12.2.1 INV-2 SEC partition/permutation equality
  - [ ] T12.2.2 INV-6/INV-13 gate + eventual-admission recipes
  - [ ] T12.2.3 INV-7 idempotent re-ingest

### <a id="T12.3"></a>T12.3 Bitemporal & projection INV suite (INV-4/5/8/11)

Assert belief-consistency, validTime convergence, projection rebuildability (deterministic byte-identical / accelerator recall-equivalent), and upcaster soundness.

- **Implements:** — · [NFR-B2](./11-non-functional-requirements.md#nfr-b2), [NFR-H1](./11-non-functional-requirements.md#nfr-h1)
- **Exit criteria:** [INV-4](./60-conformance-and-testability.md#inv-4), [INV-5](./60-conformance-and-testability.md#inv-5), [INV-8](./60-conformance-and-testability.md#inv-8), [INV-11](./60-conformance-and-testability.md#inv-11)
- **Depends on:** [T12.1](#T12.1), [T3.2](./81c-tasks-m2.md#T3.2), [T5.1](./81e-tasks-m4.md#T5.1)
- **Subtasks:**
  - [ ] T12.3.1 INV-4/INV-11 belief + validTime convergence
  - [ ] T12.3.2 INV-5 deterministic byte-identity vs accelerator recall-equivalence
  - [ ] T12.3.3 INV-8 upcaster termination/typed-result

### <a id="T12.4"></a>T12.4 Excision & regenerated-DAG INV suite (INV-9/12)

Assert gc/excision safety and concurrent-excision pin/as-of convergence with a byte-identical regenerated DAG, including the cross-OS/cross-TZ byte recipe.

- **Implements:** — · [NFR-A9](./11-non-functional-requirements.md#nfr-a9), [NFR-E2](./11-non-functional-requirements.md#nfr-e2), [NFR-F5](./11-non-functional-requirements.md#nfr-f5)
- **Exit criteria:** [INV-9](./60-conformance-and-testability.md#inv-9), [INV-12](./60-conformance-and-testability.md#inv-12)
- **Depends on:** [T12.1](#T12.1), [T4.6](./81d-tasks-m3.md#T4.6)
- **Subtasks:**
  - [ ] T12.4.1 INV-9 gc/excision result-stability
  - [ ] T12.4.2 INV-12 concurrent excision + cross-OS/TZ byte recipe — TZ/locale/core.autocrlf perturbed in-process per test; PLUS a named CI matrix job (windows-latest + ubuntu-latest) asserting commit-object bytes equal a committed golden digest (m7-26, [60 INV-12](./60-conformance-and-testability.md))

### <a id="T12.5"></a>T12.5 Trust, anti-backdating & retention INV suite (INV-10/15/16/17/18/19)

Assert authority chaining, `causedBy` well-formedness, per-key chain-completeness-gated anti-backdating, revocation intent + re-attest, and admission-control/retention + partial-replication SEC.

- **Implements:** — · [NFR-C7](./11-non-functional-requirements.md#nfr-c7), [NFR-D3](./11-non-functional-requirements.md#nfr-d3), [NFR-D4](./11-non-functional-requirements.md#nfr-d4), [NFR-I2](./11-non-functional-requirements.md#nfr-i2), [NFR-I3](./11-non-functional-requirements.md#nfr-i3)
- **Exit criteria:** [INV-10](./60-conformance-and-testability.md#inv-10), [INV-15](./60-conformance-and-testability.md#inv-15), [INV-16](./60-conformance-and-testability.md#inv-16), [INV-17](./60-conformance-and-testability.md#inv-17), [INV-18](./60-conformance-and-testability.md#inv-18), [INV-19](./60-conformance-and-testability.md#inv-19)
- **Depends on:** [T12.1](#T12.1), [T9.4](./81i-tasks-m8.md#T9.4), [T9.3](./81i-tasks-m8.md#T9.3), [T10.5](./81i-tasks-m8.md#T10.5)
- **Subtasks:**
  - [ ] T12.5.1 INV-10/15/16 authority + anti-backdating recipes
  - [ ] T12.5.2 INV-17 revocation intent + re-attest
  - [ ] T12.5.3 INV-18/19 retention bound + eviction-route backdate

### <a id="T12.6"></a>T12.6 Active-layer INV-A suite (INV-A1..A14)

Assert the active-layer invariants mirroring the core: microagents-are-clients, compile-determinism, dispatch no-fallback, learner replica-fold/budget/selection/rawKind, multi-realizer choice, answer-graph projection, `same_as` closure, acquisition lifecycle.

- **Implements:** — · [NFR-H1](./11-non-functional-requirements.md#nfr-h1), [NFR-H3](./11-non-functional-requirements.md#nfr-h3), [NFR-H4](./11-non-functional-requirements.md#nfr-h4)
- **Exit criteria:** [INV-A1](./60-conformance-and-testability.md#inv-a1), [INV-A2](./60-conformance-and-testability.md#inv-a2), [INV-A3](./60-conformance-and-testability.md#inv-a3), [INV-A4](./60-conformance-and-testability.md#inv-a4), [INV-A5](./60-conformance-and-testability.md#inv-a5), [INV-A6](./60-conformance-and-testability.md#inv-a6), [INV-A7](./60-conformance-and-testability.md#inv-a7), [INV-A8](./60-conformance-and-testability.md#inv-a8), [INV-A9](./60-conformance-and-testability.md#inv-a9), [INV-A10](./60-conformance-and-testability.md#inv-a10), [INV-A11](./60-conformance-and-testability.md#inv-a11), [INV-A12](./60-conformance-and-testability.md#inv-a12), [INV-A13](./60-conformance-and-testability.md#inv-a13), [INV-A14](./60-conformance-and-testability.md#inv-a14)
- **Depends on:** [T12.1](#T12.1), [T6.7](./81f-tasks-m5.md#T6.7), [T7.5](./81g-tasks-m6.md#T7.5), [T8.4](./81h-tasks-m7.md#T8.4)
- **Subtasks:**
  - [ ] T12.6.1 INV-A1/A2/A3/A6/A7/A8/A11 contextual-layer recipes
  - [ ] T12.6.2 INV-A4/A5/A9/A12/A13/A14 autoencoding recipes
  - [ ] T12.6.3 INV-A10 acquisition lifecycle + divergent-registration


---

**Navigation:** [↑ index](./81-roadmap-epics-and-tasks.md) · [← M8 — Security, trust & tenancy](./81i-tasks-m8.md) · [Cross-cutting: SDK surface & tooling/ops →](./81k-tasks-cross-cutting.md)
