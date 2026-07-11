# Roadmap tasks — M7 — Active knowledge: acquisition families

> Part of the dependency-ordered work-breakdown structure indexed at [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) — see that file for the legend (id scheme, the Implements/Exit-criteria/Depends-on semantics, and the machine-checked anchor convention) and the full task-level dependency graph. This file carries the **E8** slice of the WBS. Realizes milestone **M7**; see [80-roadmap-and-milestones.md](./80-roadmap-and-milestones.md) for the milestone-level goal/dependencies/exit-criteria.

---

## E8: Active knowledge: acquisition families (miner / discoverer / ingestor)

**Goal.** The data-resource → objects-of-interest → query → acquire pipeline as privilege-equal clients via `runAcquisition`, emitting signed source-provenanced facts that dedup by EID, with open-set extensibility (M7).

**Detailed doc:** [./33-mining-discovery-ingestion.md](./33-mining-discovery-ingestion.md)

### <a id="T8.1"></a>T8.1 runAcquisition dispatch & orchestrator-only authoring

Implement `runAcquisition(manifest, input, opts?)` dispatching a standalone Miner/Discoverer/Ingestor/RDF family microagent and committing `AcquisitionResult.proposed` as signed facts via the orchestrator-only `assertFact` path.

- **Implements:** [FR-K1](./10-functional-requirements.md#fr-k1) · [NFR-G1](./11-non-functional-requirements.md#nfr-g1)
- **Exit criteria:** [INV-A1](./60-conformance-and-testability.md#inv-a1), [INV-A10](./60-conformance-and-testability.md#inv-a10)
- **Depends on:** [T6.3](./81f-tasks-m5.md#T6.3), [T7.4](./81g-tasks-m6.md#T7.4)
- **Subtasks:**
  - [ ] T8.1.1 Dispatch sourceless family microagent
  - [ ] T8.1.2 Orchestrator-only signed authoring of proposed facts

### <a id="T8.2"></a>T8.2 AcquisitionResult -> facts mapping (kind-preserving)

Map `AcquisitionResult.proposed` to signed facts preserving kind (`AssertInput`→assert, `RetractInput`→retract, no coercion), `sameAs` → exactly one signed `same_as` fact, with returned `FactId[]` exactly proposed-order then sameAs-order.

- **Implements:** [FR-K1](./10-functional-requirements.md#fr-k1), [FR-K2](./10-functional-requirements.md#fr-k2) · [NFR-H1](./11-non-functional-requirements.md#nfr-h1)
- **Exit criteria:** [INV-A10](./60-conformance-and-testability.md#inv-a10)
- **Depends on:** [T8.1](#T8.1), [T6.7](./81f-tasks-m5.md#T6.7)
- **Subtasks:**
  - [ ] T8.2.1 Kind-preserving assert/retract mapping (no coercion)
  - [ ] T8.2.2 Each sameAs -> one signed same_as fact
  - [ ] T8.2.3 Returned FactId[] = proposed order then sameAs order

### <a id="T8.3"></a>T8.3 Source provenance, EID dedup & quarantine-until-trusted

Ensure all acquisition-family facts carry source provenance, dedup by EID (node-merge), and land quarantined-until-trusted (trusted only via the ordinary §8.1 path, never trusted-on-import).

- **Implements:** [FR-K2](./10-functional-requirements.md#fr-k2) · [NFR-G1](./11-non-functional-requirements.md#nfr-g1)
- **Exit criteria:** [INV-A10](./60-conformance-and-testability.md#inv-a10)
- **Depends on:** [T8.2](#T8.2)
- **Subtasks:**
  - [ ] T8.3.1 Source provenance on every emitted fact
  - [ ] T8.3.2 EID dedup (patent node-merge)
  - [ ] T8.3.3 Quarantined-until-trusted landing

### <a id="T8.4"></a>T8.4 Open-set extensibility & divergent-registration conflict

Make the family set open (any manifest validating as `AcquisitionResult`/binding `outputSchema` is a member) and surface two registrations of the same `(name,version)` with divergent manifests as CONFLICTED, not LWW-overwrite.

- **Implements:** [FR-K3](./10-functional-requirements.md#fr-k3) · [NFR-H1](./11-non-functional-requirements.md#nfr-h1)
- **Exit criteria:** [INV-A10](./60-conformance-and-testability.md#inv-a10)
- **Depends on:** [T8.1](#T8.1)
- **Subtasks:**
  - [ ] T8.4.1 Open-set membership via outputSchema validation
  - [ ] T8.4.2 Divergent same-(name,version) registration -> CONFLICTED
  - [ ] T8.4.3 Discoverer traversal terminates within declared bound


---

**Navigation:** [↑ index](./81-roadmap-epics-and-tasks.md) · [← M6 — Autoencoding](./81g-tasks-m6.md) · [M8 — Security, trust & tenancy →](./81i-tasks-m8.md)
