# Roadmap & milestones

> A dependency-ordered, pre-development implementation roadmap (M0 → M9): what each milestone delivers, which docs/§ it implements, what it depends on, and the exit criteria (the conformance INVs that must pass).

**Source:** SPEC synthesis (architecture §2/§3/§4/§4b/§5/§5b/§6 + requirements + the §8.4 conformance catalog). This is a **DERIVED PLANNING VIEW**, faithful to scope.

> [!IMPORTANT]
> **This document is a DERIVED planning view, not a new specification.** It introduces **no** new scope, requirements, or guarantees. Every milestone implements pre-existing spec sections, and every exit criterion is an INV the spec already defines (§8.4 / [conformance](./60-conformance-and-testability.md)). Where a milestone says "deliver X," X is the spec's X. The milestone *ordering* is a synthesized dependency claim; it does not change what is built, only a plausible build sequence. Sequence may be adjusted; the **dependency edges** (what must exist before what) are the load-bearing part.

> [!TIP]
> **Looking for the detailed work-breakdown?** This page is the **high-level milestone view** (M0 → M9). The full **epic / task / subtask / dependency WBS** — 13 epics → 76 tasks → 193 subtasks, each task carrying its `Implements` (FR/NFR), `Exit criteria` (INV-\*/INV-A\*), and `Depends on` (task ids), plus a task-level mermaid dependency graph — lives in **[81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md)**. Each milestone below maps to one or more epics in that document; see the [milestone → epic map](#milestone--epic-map).

### Milestone → epic map

Each milestone M0–M9 is realized by the epic(s) below in the detailed WBS ([81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md)). The dependency ordering is consistent between the two views.

| Milestone | Realizing epic(s) in [81](./81-roadmap-epics-and-tasks.md) |
|---|---|
| **M0** substrate + envelope + gate | E1 |
| **M1** proj + heads + reducers | E2 |
| **M2** bitemporality + as-of | E3 |
| **M3** sync + convergence + regeneration | E4 |
| **M4** retrieval + indexing | E5 |
| **M5** contextual functionalities | E6 |
| **M6** knowledge autoencoding | E7 |
| **M7** acquisition families | E8 |
| **M8** security / tenancy / DoS hardening | E9, E10 |
| **M9** conformance suite | E12 |
| *(cross-cutting / operational)* | E11 (SDK surface), E13 (tooling & ops) |

> E11 (the public SDK surface) and E13 (CLI / fsck / packing-GC / observability) thread across the milestones rather than mapping to a single one: E11 assembles the capabilities each milestone delivers into the normative API shapes — **each T11.x ships inside a named milestone** (T11.1 → M0, T11.2 → M2, T11.3 → M3, T11.4 → M4, T11.5 → M8; annotated per task in [81](./81-roadmap-epics-and-tasks.md)) and is gated by an API-shape snapshot test — and E13 packages operational tooling over them (T13.3/T13.4 carry the gc/rollup half of INV-9).

---

## Dependency graph

```mermaid
graph TD
  M0["M0 · Git substrate + fact envelope + signature gate"] --> M1["M1 · proj + heads + reducers"]
  M1 --> M2["M2 · Bitemporality + as-of"]
  M1 --> M3["M3 · Sync + convergence + regeneration"]
  M2 --> M3
  M3 --> M4["M4 · Retrieval + indexing"]
  M3 --> M5["M5 · Active layer: contextual functionalities"]
  M4 --> M5
  M5 --> M6["M6 · Knowledge autoencoding"]
  M5 --> M7["M7 · Acquisition families"]
  M6 --> M7
  M3 --> M8["M8 · Security / tenancy / DoS hardening"]
  M0 --> M8
  M8 --> M9["M9 · Conformance suite (full INV + INV-A)"]
  M7 --> M9
```

The spine is **M0 → M1 → M3** (substrate → projection → convergence); everything else hangs off a converging substrate. Security (M8) threads through from M0 (genesis root in the manifest) but only fully closes after M3 (the set-pure trust overlay needs the converged set + author-HLC machinery).

---

## M0 — Git substrate, fact envelope, signature-only gate

**Goal.** A signed, content-addressed, append-only fact log over git with the bright-line membership gate.

**Key deliverables.**
- Object & ref layout: `/facts/**`, `refs/kip/replicas/*`, `refs/kip/sessions/*`, `manifest.json` (genesis root key set pinned, frozen).
- The **fact envelope** (§4.1): author-stamped signed `hlc`, `provenance.signedFields`, canonical payload, `validFrom`/`validTo`, `factCID`.
- The **signature-only INGEST-GATE** — the sole membership predicate; spelled out canonically in [§3.2](./22-git-substrate.md) (the [FR group A admission rule](./10-functional-requirements.md#fr-group-a--write--transaction-operations)).
- Batched commit granularity (`txn` → one commit) with `{factId, status}` durability (m-9).
- Dual-id scheme stubs: CID (git object id) + namespaced EID structure (§3.6).

**Implements.** [22-git-substrate](./22-git-substrate.md) (§3.1–§3.3, §3.6), [21-data-model](./21-data-model.md) (§2, envelope), the gate half of [24-convergence](./24-synchronization-and-convergence.md) (§3.2/§4b.2).

**Dependencies.** None (foundation).

**Exit criteria.** [INV-6a](./60-conformance-and-testability.md#inv-6a), [INV-13a](./60-conformance-and-testability.md#inv-13a), [INV-7a](./60-conformance-and-testability.md#inv-7a) (B-3) — the gate-only sub-invariants minted in [60](./60-conformance-and-testability.md) with M0-only recipes (assert on gate verdicts + `/facts` presence via [`ingest()`](./40-sdk-api-surface.md); no proj/trust/pncounter-reducer machinery). INV-7 (full, requires the `pncounter`/interval-dedup reducer) and the full [INV-6](./60-conformance-and-testability.md#inv-6)/[INV-13](./60-conformance-and-testability.md#inv-13) close at M1/M8 respectively — INV-7 is **not** an M0 exit criterion (it was previously mis-scoped here: it requires M1 reducer machinery that does not exist at M0). **INV-6a is satisfied at M0 WITH a documented residual:** the gate-only verdict for a *genuinely-unregistered* fingerprint legitimately depends on the replica's local key-registry (own identity, genesis `rootKeys`, imported peer keys) so that real Ed25519 verification always wins over the conformance suite's placeholder-signature convention for any fingerprint this replica has independently registered — an intentional, bounded exception to INV-6a's "no key-registration predicate" clause, tracked as accepted residual [R12](./90-open-questions.md#r12). **Full INV-6a/INV-6 byte-pure purity (independent of ANY replica-local state, including key registration) is an M8 exit criterion**, closing once M8's fact-based trust overlay (below) makes key-registration a set-pure function of the admitted fact set.

---

## M1 — `proj`, `/heads`, reducers

**Goal.** The deterministic projection: `proj(S)` materializes byte-identical `/heads`.

**Key deliverables.**
- `orderKey`: the total order over set-resident fields — see the canonical [`OrderKey` type](./22-git-substrate.md#orderkey).
- `proj`: sort → group by cell → upcast → reduce; **set-pure, whole-set fold**, no pairwise merge.
- Cell reducers: `lww-hlc`, `max`, `min`, `gset`, `pncounter`, `custom` — deterministic, total, pure (INV-3).
- Versioned **upcasters** (§2.2): typed `value | quarantine`, never throw, never invent (M-8).
- Interval geometry: non-overlapping segments, **gaps as first-class `unknown`** (M-9); existence-gates-properties (no ghost nodes, m2-2).
- Conflict surfacing: `kip:conflict` for non-commutative contradictions, per the §3.4 resolution table (no silent hash tiebreak, N5).

**Implements.** [data model](./21-data-model.md) (§2.2 schema/upcasters), the projection half of [convergence](./24-synchronization-and-convergence.md) (§3.4, §4b.3), [decision ADR-002/ADR-005/ADR-013](./70-decision-records-adr.md).

**Dependencies.** M0 (the fact set + envelope).

**Exit criteria.** [INV-1](./60-conformance-and-testability.md#inv-1), [INV-3](./60-conformance-and-testability.md#inv-3), [INV-4a](./60-conformance-and-testability.md#inv-4a) (the asOf-free segment-geometry sub-invariant — the full INV-4 needs M2's `asOf` belief oracle and gates M2), [INV-8](./60-conformance-and-testability.md#inv-8), [INV-7](./60-conformance-and-testability.md#inv-7) (full — B-3: needs the `pncounter`/interval-dedup reducer this milestone delivers; M0 exit gates only on the gate-level [INV-7a](./60-conformance-and-testability.md#inv-7a)). The gating harness is T12.1's single-process fold + perturbation rig, whose subtasks depend only on T2.2/T2.3 ([81 T12.1](./81j-tasks-m9.md#T12.1)).

---

## M2 — Bitemporality & as-of

**Goal.** Valid-time/transaction-time geometry and as-of reads.

**Key deliverables.**
- Bitemporal envelope: valid time (`validFrom`/`validTo`, gaps legal) vs transaction time (`rxFrom`, **audit-only, excluded from `proj`**).
- `asOf({txTime, validTime, believer})` reads; the per-replica belief axis vs the convergent valid-time axis.
- Decay/salience/consolidation as operations over time (§4.4).
- Forgetting: tombstone (logical) defined; excise hooks staged (full excision lands with M3's DAG regeneration).
- Pins / `SnapshotRef` content-addressing the `factSetDigest` + author-HLC frontier (`dagTips` dropped).

**Implements.** [temporality & bitemporality](./23-temporality-and-bitemporality.md) (§4), the pin/as-of seams of [context-enablement seams](./25-context-enablement-seams.md) (§4c).

**Dependencies.** M1 (`proj` computes the valid-time geometry).

**Exit criteria.** [INV-4](./60-conformance-and-testability.md#inv-4), [INV-11](./60-conformance-and-testability.md#inv-11), [INV-14a](./60-conformance-and-testability.md#inv-14a) (the single-replica pin sub-invariant — the cross-replica half of INV-14 needs M3's `sync` and gates M3).

---

## M3 — Sync, convergence & deterministic regeneration

**Goal.** The correctness core: HLC, set-union sync, the SEC guarantee, concurrent excision confluence.

**Key deliverables.**
- HLC fully wired (§4b.1): counter overflow → carry, never wrap (M-2).
- `sync` = content-addressed `git fetch`/`push` of missing fact blobs; **set-union** merge; **`/heads` regenerated, not merged**.
- Branch-per-agent topology (§4b.5): replica branches + trunk + session pins; any merge topology converges.
- Two-layer reconciliation (§4b.3): substrate G-Set vs recorded semantic supersession; `supersede` keyed by input CIDs.
- **Excision** (§4.5): authorized history rewrite + **deterministic DAG regeneration** (set-derived commit boundaries/timestamp/sentinel committer/unsigned), incremental from the excision point.
- Concurrency detection via the commit DAG (best-effort, safe-default-concurrent), never an input to `proj`'s value.

**Implements.** [synchronization & convergence](./24-synchronization-and-convergence.md) (§4b + §7), the regeneration parts of [git substrate](./22-git-substrate.md) (§3.5/§4.5), [decision ADR-003/ADR-004/ADR-006/ADR-011](./70-decision-records-adr.md).

**Dependencies.** M1 (`proj` is half the SEC theorem) + M2 (as-of/pins address the fact set, needed for excision-survivable pins).

**Exit criteria.** [INV-2a](./60-conformance-and-testability.md#inv-2a) (the substrate-only SEC sub-invariant: plain assert/retract permutations — the full INV-2's revocation/key-authorization/backdating permutations need M8's trust overlay and gate M8), [INV-12](./60-conformance-and-testability.md#inv-12), [INV-13a](./60-conformance-and-testability.md#inv-13a) (re-run under sync), [INV-14](./60-conformance-and-testability.md#inv-14) (full, cross-replica), [INV-9](./60-conformance-and-testability.md#inv-9) — excision half only (excision re-fold + `"excised"` placeholder); the gc/repack/rollup half of INV-9 gates E13's T13.3/T13.4 ([81k](./81k-tasks-cross-cutting.md#T13.3)), which map to no milestone.

---

## M4 — Retrieval & indexing

**Goal.** Hybrid recall over the converged graph, with rebuildable indexes.

**Key deliverables.**
- Hybrid pipeline (§5.1): vector candidates → bounded graph expansion → RRF fusion.
- Typed graph traversal (§5.2), as-of aware, bounded fanout.
- Derived, content-addressed, **incremental** indexing keyed off git object hashes (§5.3) — never a monolithic rebuild.
- Salience projection (§5.4) with fixed weights (a **deterministic** projection); the model id recorded as a fact.
- The **accelerator boundary** (§5.3): ANN/embeddings are best-effort, recall-equivalent, **NOT** byte-identical — explicitly outside the convergence guarantee.

**Implements.** [retrieval](./26-retrieval.md) (§5), the `recall`/`subscribe`/`salience` seams of [context-enablement seams](./25-context-enablement-seams.md) (§4c).

**Dependencies.** M3 (recall reads a converged graph; pins/as-of from M2/M3).

**Exit criteria.** [INV-5](./60-conformance-and-testability.md#inv-5) — parameterized (m7-25): `recall@10 ≥ 0.95` against the committed fixture corpus with caller-supplied fixed embedding vectors (no live model); the parameters are pinned in [60](./60-conformance-and-testability.md).

---

## M5 — Active layer: contextual-relation functionalities

**Goal.** EdgeKinds carrying microagents; `ContextualQuery → Segment(DAG) → signed-fact execution`.

**Key deliverables.**
- `FunctionalityBinding` on EdgeKinds; microagent manifests; `registerFunctionality` (additive, N realizers as `Segment.alternatives`).
- `ContextualQuery` compile → `Segment` (steps + `deps` DAG), a **pure read over `proj`**; deterministic topological execution order.
- Execution dispatches microagents (clients only); the **orchestrator** commits `assert` + `derived_from` facts (INV-A1).
- The three patent facets orthogonal: constraint (claim-8) / conditional (claim-12) / relation-type (claim-7).
- Weighted/conditional relations as `/ontology` facts (deterministic ordering/gating).
- Composition-discovery (cross-relation chain) as a compile-time `proj`-search; `same_as` equivalence-closure + canonical-EID; the answer graph (keyed back to the seed).

**Implements.** [active-knowledge overview](./30-active-knowledge-overview.md) (§5b intro), [contextual functionalities](./31-contextual-functionalities.md) (§5b.1), [decision ADR-014..ADR-020](./70-decision-records-adr.md).

**Dependencies.** M3 (signed-fact execution rides the converged substrate) + M4 (Discoverer/composition uses recall + bounded traversal).

**Exit criteria.** [INV-A1](./60-conformance-and-testability.md#inv-a1), [INV-A2](./60-conformance-and-testability.md#inv-a2), [INV-A3](./60-conformance-and-testability.md#inv-a3), [INV-A6](./60-conformance-and-testability.md#inv-a6), [INV-A7](./60-conformance-and-testability.md#inv-a7), [INV-A8](./60-conformance-and-testability.md#inv-a8), [INV-A11](./60-conformance-and-testability.md#inv-a11) (canonical titles + bodies in [60](./60-conformance-and-testability.md)).

---

## M6 — Knowledge autoencoding

**Goal.** The `encode → decode → reconstruction-loss → learner` loop, recorded as facts.

**Key deliverables.**
- The learner loop running **outside `proj`** under a hard **total disjunctive budget** — see [FR-J1](./10-functional-requirements.md#fr-j1) and [§5b.2](./32-knowledge-autoencoding.md).
- `kip:learn` (correction-class, accept) and `kip:learn-exhausted` (gset marker) facts; achieved loss recorded but **excluded from `orderKey`/reducers** (audit-only, like `rxFrom`).
- `LearnOptions` ↔ `LearnerLoopState` budget-agreement; accept-if-improved monotonicity.
- The accelerator-vs-substrate boundary honored: `proj` never re-runs the loop.

**Implements.** [knowledge autoencoding](./32-knowledge-autoencoding.md) (§5b.2), [decision ADR-021](./70-decision-records-adr.md).

**Dependencies.** M5 (the learner is a grow-the-map microagent family; uses the registration + signed-fact path).

**Exit criteria.** [INV-A4](./60-conformance-and-testability.md#inv-a4), [INV-A5](./60-conformance-and-testability.md#inv-a5), [INV-A9](./60-conformance-and-testability.md#inv-a9), [INV-A12](./60-conformance-and-testability.md#inv-a12), [INV-A13](./60-conformance-and-testability.md#inv-a13), [INV-A14](./60-conformance-and-testability.md#inv-a14) (canonical titles + bodies in [60](./60-conformance-and-testability.md)).

---

## M7 — Acquisition families (Miner / Discoverer / Ingestor)

**Goal.** The `data-resource → objects-of-interest → query → acquire` pipeline as privilege-equal clients.

**Key deliverables.**
- Miner / Discoverer / Ingestor + RDF (Ingestor specialization); all emit **signed, source-provenanced** facts, dedup by EID, none mutate the graph.
- `runAcquisition` seam for sourceless families; edge-bound members via `runContextualQuery`.
- `AcquisitionResult → facts` mapping (kind-preserving `assert`/`retract`, `sameAs` → `same_as`, source on every fact, ordered `FactId[]`).
- Open-set extensibility (any manifest validating as `AcquisitionResult`/binding `outputSchema` is a family member).

**Implements.** [mining, discovery & ingestion](./33-mining-discovery-ingestion.md) (§5b.3), [decision ADR-022/ADR-023](./70-decision-records-adr.md).

**Dependencies.** M5 (contextual dispatch path) + M6 (Learner is a peer grow-the-map family; consolidation is a learner pass).

**Exit criteria.** [INV-A10](./60-conformance-and-testability.md#inv-a10), reuse of [INV-A1](./60-conformance-and-testability.md#inv-a1) (canonical titles + bodies in [60](./60-conformance-and-testability.md)).

---

## M8 — Security / tenancy / DoS hardening

**Goal.** The full set-pure trust overlay, tenancy scoping, and the storage bound.

**Key deliverables.**
- `KeyAuthorization` / `KeyRevocation` interfaces; genesis-root chaining at author-HLC; rotation/delegation.
- Revocation modes: `ordinary-cutoff` (default) vs `causal-cutoff`; `kip:revoked-concurrent` surfacing; `re-attest` restoration.
- Set-resident anti-backdating: per-key author-HLC monotonicity gated on chain completeness (`pending` on gap); `causedBy` secondary + well-formedness.
- Tenancy: `withScope` (advisory client guard) + set-pure `proj` demotion (authoritative); `grant`/`allow`/`deny` policy facts.
- Privacy: secret-redaction-on-export; tombstone vs excise (from M3).
- **Admission control & retention** (§3.5a): `RetentionClass`; `quarantined-ttl` per-key cap + TTL + **global `quarantinePoolBytes` budget**; `key-chain-durable` cap + on-demand re-fetch.
- Auditability: `provenanceOf`, `fsck` (local integrity, not convergence).

**Implements.** [security, trust & tenancy](./50-security-trust-tenancy.md) (§8.1–§8.3b), the retention parts of [git substrate](./22-git-substrate.md) (§3.5a), [decision ADR-001/ADR-007/ADR-008/ADR-009/ADR-010](./70-decision-records-adr.md).

**Dependencies.** M0 (genesis root in manifest; the gate) + M3 (the set-pure overlay needs the converged set + author-HLC + regeneration; revocation/excision are author-HLC comparisons over `S`).

**Exit criteria.** [INV-6](./60-conformance-and-testability.md#inv-6) (full — closing M0's [R12](./90-open-questions.md#r12) residual by making key-registration a set-pure function of the admitted fact set, so gate-observable verdicts no longer depend on any replica-local registry), [INV-13](./60-conformance-and-testability.md#inv-13) (full), [INV-2](./60-conformance-and-testability.md#inv-2) (full — the revocation/key-authorization/backdating permutations deferred from M3's INV-2a land here), [INV-10](./60-conformance-and-testability.md#inv-10), [INV-15](./60-conformance-and-testability.md#inv-15), [INV-16](./60-conformance-and-testability.md#inv-16), [INV-17](./60-conformance-and-testability.md#inv-17), [INV-18](./60-conformance-and-testability.md#inv-18), [INV-19](./60-conformance-and-testability.md#inv-19) (canonical titles + bodies in [60](./60-conformance-and-testability.md)).

---

## M9 — Conformance suite (the suite kip ships)

**Goal.** Determinism-as-test-strategy: the full INV-1..19 + INV-A1..A14 catalog, green, as the gating proof.

**Key deliverables.**
- Random-order / random-partition replay equality harness (INV-2).
- Adversarial recipes per INV (clock skew, long offline partitions, data-before-key-registration, eviction-route backdates, cross-OS/cross-TZ regeneration, `N`-key floods).
- Accelerator tests are recall-threshold, not byte-equality (INV-5).
- The active-layer INV-A recipes mirroring INV-1..19.

**Implements.** [conformance & testability](./60-conformance-and-testability.md) (§8.4) — every INV across all prior milestones, assembled as one shippable suite.

**Dependencies.** All of M0–M8 (the suite asserts each milestone's exit criteria; the active-layer INV-A set needs M5–M7).

**Exit criteria.** The **entire** INV-1..19 and INV-A1..A14 catalog (including the milestone sub-invariants INV-2a/4a/6a/13a/14a) passes, with the bounded excision-propagation window and the accepted residuals ([R1–R10](./90-open-questions.md)) explicitly accounted for (never hiding a CRITICAL).

---

## Milestone → docs/§ → exit-INV summary

| Milestone | Implements (docs / §) | Exit INVs |
|---|---|---|
| **M0** substrate + envelope + gate | [22](./22-git-substrate.md) §3.1–3.3/3.6, [21](./21-data-model.md) §2, §3.2 | INV-6a, 13a, 7a |
| **M1** proj + heads + reducers | [21](./21-data-model.md) §2.2, [24](./24-synchronization-and-convergence.md) §3.4/§4b.3 | INV-1, 3, 4a, 8 |
| **M2** bitemporality + as-of | [23](./23-temporality-and-bitemporality.md) §4, [25](./25-context-enablement-seams.md) §4c | INV-4, 11, 14a |
| **M3** sync + convergence + regen | [24](./24-synchronization-and-convergence.md) §4b/§7, §4.5 | INV-2a, 9 (excision half), 12, 13a, 14 |
| **M4** retrieval + indexing | [26](./26-retrieval.md) §5 | INV-5 (recall@10 ≥ 0.95, pinned fixtures) |
| **M5** contextual functionalities | [30](./30-active-knowledge-overview.md)/[31](./31-contextual-functionalities.md) §5b.1 | INV-A1, A2, A3, A6, A7, A8, A11 |
| **M6** autoencoding | [32](./32-knowledge-autoencoding.md) §5b.2 | INV-A4, A5, A9, A12, A13, A14 |
| **M7** acquisition families | [33](./33-mining-discovery-ingestion.md) §5b.3 | INV-A10 (+ A1) |
| **M8** security / tenancy / DoS | [50](./50-security-trust-tenancy.md) §8.1–8.3b, §3.5a | INV-2 (full), 6 (full), 13 (full), 10, 15, 16, 17, 18, 19 |
| **M9** conformance suite | [60](./60-conformance-and-testability.md) §8.4 | all INV-1..19 + INV-A1..A14 |
