# Roadmap tasks — M0 — Git substrate, fact envelope & signature-only gate

> Part of the dependency-ordered work-breakdown structure indexed at [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) — see that file for the legend (id scheme, the Implements/Exit-criteria/Depends-on semantics, and the machine-checked anchor convention) and the full task-level dependency graph. This file carries the **E1** slice of the WBS. Realizes milestone **M0**; see [80-roadmap-and-milestones.md](./80-roadmap-and-milestones.md) for the milestone-level goal/dependencies/exit-criteria.

---

## E1: Git substrate, fact envelope & signature-only gate

**Goal.** A signed, content-addressed, append-only fact log over git with the bright-line signature-only membership gate and batched-commit durability (M0).

**Detailed doc:** [./22-git-substrate.md](./22-git-substrate.md)

### <a id="T1.1"></a>T1.1 Object & ref layout + frozen manifest

Define the git object/ref layout (`/facts/**`, `refs/kip/replicas/*`, `refs/kip/sessions/*`) and the immutable `manifest.json` pinning the tenant genesis root key set.

- **Implements:** [FR-D4](./10-functional-requirements.md#fr-d4) · [NFR-A1](./11-non-functional-requirements.md#nfr-a1), [NFR-D1](./11-non-functional-requirements.md#nfr-d1)
- **Exit criteria:** —
- **Depends on:** — (root)
- **Subtasks:**
  - [ ] T1.1.1 Define /facts/** and refs/kip/replicas/* layout
  - [ ] T1.1.2 Define refs/kip/sessions/* short-lived read pins
  - [ ] T1.1.3 Define frozen manifest.json with pinned genesis root key set

### <a id="T1.2"></a>T1.2 Fact envelope & canonical signed payload

Implement the fact envelope: author-stamped signed HLC, schema version `v`, `provenance.signedFields`, canonical payload, `validFrom`/`validTo`, and the `factCID` (CID over the canonical payload).

- **Implements:** [FR-A1](./10-functional-requirements.md#fr-a1) · [NFR-A6](./11-non-functional-requirements.md#nfr-a6), [NFR-G1](./11-non-functional-requirements.md#nfr-g1)
- **Exit criteria:** —
- **Depends on:** [T1.1](#T1.1)
- **Subtasks:**
  - [ ] T1.2.1 Canonical payload encoding covering pubkeyFpr, replicaId, v
  - [ ] T1.2.2 Author-stamped signed HLC + signedFields provenance
  - [ ] T1.2.3 factCID derivation including signed author-HLC
  - [ ] T1.2.4 Post-hoc audit-only fields (id, rxFrom) annotation
  - [ ] T1.2.5 Per-(replicaId,key) chain sequence `seq`: author-side stamping (minted at txn commit
        boundary, never at buffer time), durable per-key seq-tip persistence (crash recovery replays the
        chain tip from `/facts`, never a lower resume point) (§4b.1/m7-1, A-3/A-5). **Exit-gating note
        (honest gap):** T1.2.5 itself has no dedicated exit criterion for seq-stamping correctness
        (monotonic, non-wrapping, crash-recovery-resumes-at-true-tip) — it is only indirectly exercised
        at M3 via [T4.1.3](./81d-tasks-m3.md#T4.1)'s fork/inversion demotion tests; no new INV is proposed to close this,
        it is simply documented here.

### <a id="T1.3"></a>T1.3 Signature-only ingest gate

Implement the signature-only ingest gate — the sole membership predicate, spelled out canonically in [§3.2](./22-git-substrate.md).

- **Implements:** — · [NFR-A2](./11-non-functional-requirements.md#nfr-a2), [NFR-D5](./11-non-functional-requirements.md#nfr-d5), [NFR-I1](./11-non-functional-requirements.md#nfr-i1)
- **Exit criteria:** [INV-6a](./60-conformance-and-testability.md#inv-6a), [INV-13a](./60-conformance-and-testability.md#inv-13a)
- **Depends on:** [T1.2](#T1.2)
- **Subtasks:**
  - [ ] T1.3.1 Ed25519 verify over canonical payload
  - [ ] T1.3.2 Well-formedness validation; reject malformed/invalid-signature only
  - [ ] T1.3.3 Identical gate behavior across replicas (membership convergence)

### <a id="T1.4"></a>T1.4 Dual-id scheme: CID + namespaced EID

Implement the dual-id structure: git-object CID for content addressing and a namespaced, cryptographically anchored stable EID decoupled from content so identity survives key rotation/revocation.

- **Implements:** — · [NFR-F1](./11-non-functional-requirements.md#nfr-f1)
- **Exit criteria:** —
- **Depends on:** [T1.2](#T1.2)
- **Subtasks:**
  - [ ] T1.4.1 Namespaced EID structure (namespaceId, localId)
  - [ ] T1.4.2 EID/CID decoupling and identity-survival under rotation

### <a id="T1.5"></a>T1.5 Batched commit granularity & durability signalling

Implement one-commit-per-transaction batching with `{factId, status}` durability so a buffered fact is pending until commit and no durable ack precedes the commit.

- **Implements:** [FR-A3](./10-functional-requirements.md#fr-a3), [FR-A4](./10-functional-requirements.md#fr-a4), [FR-A5](./10-functional-requirements.md#fr-a5) · [NFR-F3](./11-non-functional-requirements.md#nfr-f3)
- **Exit criteria:** —
- **Depends on:** [T1.2](#T1.2), [T1.3](#T1.3)
- **Subtasks:**
  - [ ] T1.5.1 Auto-batched buffer with pending/durable status
  - [ ] T1.5.2 txn(fn) -> one commit as the publish point
  - [ ] T1.5.3 commit(message?) flush of buffered facts

### <a id="T1.6"></a>T1.6 Idempotent ingestion (CID dedup)

Ensure re-ingesting an already-held fact is a strict no-op via CID dedup (CID includes the signed author-HLC), with no double-count and no duplicate valid-time intervals.

- **Implements:** [FR-D7](./10-functional-requirements.md#fr-d7) · [NFR-A8](./11-non-functional-requirements.md#nfr-a8)
- **Exit criteria:** [INV-7a](./60-conformance-and-testability.md#inv-7a) (B-3 — the gate-level, M0-runnable sub-case: one blob per CID in `/facts`, verified via `ingest()` re-offer, no `pncounter`/reducer machinery required yet). The full [INV-7](./60-conformance-and-testability.md#inv-7) (no double-count under `pncounter`) closes at M1 once the reducer exists ([80 M1](./80-roadmap-and-milestones.md)).
- **Depends on:** [T1.2](#T1.2), [T1.3](#T1.3)
- **Subtasks:**
  - [ ] T1.6.1 CID-keyed dedup on ingest
  - [ ] T1.6.2 No double-count under pncounter; no duplicate intervals


---

**Navigation:** [↑ index](./81-roadmap-epics-and-tasks.md) · [M1 — Projection & convergence →](./81b-tasks-m1.md)
