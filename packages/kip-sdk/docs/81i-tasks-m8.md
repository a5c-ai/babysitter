# Roadmap tasks — M8 — Security, trust, tenancy & retention

> Part of the dependency-ordered work-breakdown structure indexed at [81-roadmap-epics-and-tasks.md](./81-roadmap-epics-and-tasks.md) — see that file for the legend (id scheme, the Implements/Exit-criteria/Depends-on semantics, and the machine-checked anchor convention) and the full task-level dependency graph. This file carries the **E9, E10** slice of the WBS. Realizes milestone **M8**; see [80-roadmap-and-milestones.md](./80-roadmap-and-milestones.md) for the milestone-level goal/dependencies/exit-criteria.

---

## E9: Security, trust & tenancy

**Goal.** The full set-pure trust overlay: genesis-root authority chaining at author-HLC, revocation modes + re-attest, set-resident anti-backdating, tenancy scoping, secret redaction, provenance and fsck (M8).

**Detailed doc:** [./50-security-trust-tenancy.md](./50-security-trust-tenancy.md)

### <a id="T9.1"></a>T9.1 Signed scoped key authorization & genesis-root chaining

Implement signed key-authorization facts binding `key -> {namespaces, ops}` with author-HLC `effectiveFrom`, trusted by `proj` only if the authorizing key chains to the tenant genesis root at the key-add's author-HLC.

- **Implements:** [FR-L1](./10-functional-requirements.md#fr-l1) · [NFR-D1](./11-non-functional-requirements.md#nfr-d1), [NFR-D2](./11-non-functional-requirements.md#nfr-d2), [NFR-A7](./11-non-functional-requirements.md#nfr-a7)
- **Exit criteria:** [INV-10](./60-conformance-and-testability.md#inv-10)
- **Depends on:** [T4.4](./81d-tasks-m3.md#T4.4), [T2.2](./81b-tasks-m1.md#T2.2)
- **Subtasks:**
  - [ ] T9.1.1 target.kind:key authorization facts (namespaces, ops)
  - [ ] T9.1.2 Genesis-root chaining at key-add author-HLC
  - [ ] T9.1.3 Separately-scoped excise/revoke/resolve capabilities

### <a id="T9.2"></a>T9.2 Gate/proj separation & set-pure trust demotion

Confirm the ingest gate rejects only signature-invalid/malformed facts while unregistered/out-of-namespace/revoked/anachronistic facts are demoted-untrusted/quarantined inside `proj` keyed on author-HLC, re-evaluated monotonically.

- **Implements:** — · [NFR-A7](./11-non-functional-requirements.md#nfr-a7), [NFR-D6](./11-non-functional-requirements.md#nfr-d6)
- **Exit criteria:** [INV-6](./60-conformance-and-testability.md#inv-6)
- **Depends on:** [T9.1](#T9.1), [T1.3](./81a-tasks-m0.md#T1.3)
- **Subtasks:**
  - [ ] T9.2.1 Demote-not-reject for unregistered/out-of-namespace facts
  - [ ] T9.2.2 Monotone re-fold to trusted on key-registration arrival
  - [ ] T9.2.3 Commit signatures not a trust anchor (not checked)

### <a id="T9.3"></a>T9.3 Set-resident anti-backdating & causedBy well-formedness

Implement set-pure anti-backdating via per-key author-HLC monotonicity gated on chain completeness (pending on gap) plus `causedBy` well-formedness (forward edge / cycle → demoted-malformed, dangling → pending).

- **Implements:** — · [NFR-D4](./11-non-functional-requirements.md#nfr-d4), [NFR-C6](./11-non-functional-requirements.md#nfr-c6)
- **Exit criteria:** [INV-15](./60-conformance-and-testability.md#inv-15), [INV-16](./60-conformance-and-testability.md#inv-16)
- **Depends on:** [T9.2](#T9.2)
- **Subtasks:**
  - [ ] T9.3.1 Per-key author-HLC monotonicity gated on chain completeness
  - [ ] T9.3.2 pending on seq gap; demote once higher same-key fact in chain
  - [ ] T9.3.3 causedBy forward/cycle -> malformed; dangling -> pending

### <a id="T9.4"></a>T9.4 Revocation modes & re-attest

Implement `revokeKey(keyFpr, effectiveFrom, reason, mode?)` comparing author-HLC to `effectiveFrom` (never `rxFrom`), ordinary-cutoff vs causal-cutoff with `kip:revoked-concurrent` surfacing, and re-attest restoration.

- **Implements:** [FR-L2](./10-functional-requirements.md#fr-l2), [FR-L3](./10-functional-requirements.md#fr-l3), [FR-L5](./10-functional-requirements.md#fr-l5) · [NFR-D3](./11-non-functional-requirements.md#nfr-d3), [NFR-D7](./11-non-functional-requirements.md#nfr-d7)
- **Exit criteria:** [INV-17](./60-conformance-and-testability.md#inv-17)
- **Depends on:** [T9.2](#T9.2)
- **Subtasks:**
  - [ ] T9.4.1 revoke-key fact; author-HLC effectiveFrom comparison
  - [ ] T9.4.2 ordinary-cutoff vs causal-cutoff; kip:revoked-concurrent surfacing
  - [ ] T9.4.3 re-attest restoration; resolve-scoped supersede adjudication

### <a id="T9.5"></a>T9.5 Tenancy scoping (withScope) & secret redaction

Implement `withScope(scope)` returning a tenant/namespace-scoped `Repo` lens with structural isolation (advisory client write-guard + authoritative set-pure proj demotion) and read-time secret redaction for unprivileged scopes.

- **Implements:** [FR-L4](./10-functional-requirements.md#fr-l4), [FR-L6](./10-functional-requirements.md#fr-l6) · [NFR-D2](./11-non-functional-requirements.md#nfr-d2), [NFR-E3](./11-non-functional-requirements.md#nfr-e3)
- **Exit criteria:** [INV-10](./60-conformance-and-testability.md#inv-10)
- **Depends on:** [T9.1](#T9.1)
- **Subtasks:**
  - [ ] T9.5.1 Scoped Repo lens; structural tenant isolation
  - [ ] T9.5.2 Advisory client write-guard + authoritative proj demotion
  - [ ] T9.5.3 Read-time secret-named cell redaction

### <a id="T9.6"></a>T9.6 Provenance & fsck (local integrity)

Implement `provenanceOf(ref)` tracing any value to its asserting fact/actor/authority-chain/source, and `fsck()` proving `heads==proj(facts)`, verifying all fact signatures and author-key chaining at author-HLC (not commit signatures).

- **Implements:** [FR-E1](./10-functional-requirements.md#fr-e1), [FR-E2](./10-functional-requirements.md#fr-e2) · [NFR-G1](./11-non-functional-requirements.md#nfr-g1), [NFR-G2](./11-non-functional-requirements.md#nfr-g2)
- **Exit criteria:** [INV-6](./60-conformance-and-testability.md#inv-6)
- **Depends on:** [T9.1](#T9.1), [T4.6](./81d-tasks-m3.md#T4.6)
- **Subtasks:**
  - [ ] T9.6.1 provenanceOf trace (actor/signature/authority/source)
  - [ ] T9.6.2 fsck: heads==proj(facts), all fact signatures, author-HLC chaining
  - [ ] T9.6.3 No-residue check post-excision; commit signatures not checked


---

## E10: Admission control & retention

**Goal.** Transport-layer admission control and the storage bound: set-pure `RetentionClass`, per-key + global quarantine budgets, cap-bounded key-chain-durable retention with on-demand re-fetch, and per-shared-subset SEC under partial replication.

**Detailed doc:** [./22-git-substrate.md](./22-git-substrate.md)

### <a id="T10.1"></a>T10.1 Set-pure RetentionClass

Compute `RetentionClass ∈ {durable, key-chain-durable, quarantined-ttl, evicted}` as a pure function of `S`, identical on every replica, that the transport layer reads to decide eviction.

- **Implements:** — · [NFR-C2](./11-non-functional-requirements.md#nfr-c2), [NFR-C3](./11-non-functional-requirements.md#nfr-c3)
- **Exit criteria:** [INV-18](./60-conformance-and-testability.md#inv-18)
- **Depends on:** [T9.3](#T9.3)
- **Subtasks:**
  - [ ] T10.1.1 Per-fact RetentionClass computation (set-pure)
  - [ ] T10.1.2 durable (trusted-author) never evicted

### <a id="T10.2"></a>T10.2 Quarantine pool budgets (per-key + global)

Bound unregistered-key facts as quarantined-ttl under a per-key byte-cap, a TTL, and a manifest-pinned global `quarantinePoolBytes` aggregate budget (LRU/TTL) so an N-fresh-key flood cannot exceed the global ceiling.

- **Implements:** — · [NFR-C4](./11-non-functional-requirements.md#nfr-c4), [NFR-I2](./11-non-functional-requirements.md#nfr-i2)
- **Exit criteria:** [INV-18](./60-conformance-and-testability.md#inv-18)
- **Depends on:** [T10.1](#T10.1)
- **Subtasks:**
  - [ ] T10.2.1 Per-key quarantineKeyCapBytes + quarantineTtlMs
  - [ ] T10.2.2 Global quarantinePoolBytes aggregate budget (LRU/TTL)

### <a id="T10.3"></a>T10.3 Cap-bounded key-chain-durable retention

Implement cap-bounded key-chain-durable retention up to `keyChainDurableCapBytes` with on-demand re-fetch of evicted oldest non-load-bearing links, so a registered/compromised key cannot force unbounded durable bytes.

- **Implements:** — · [NFR-C5](./11-non-functional-requirements.md#nfr-c5), [NFR-I3](./11-non-functional-requirements.md#nfr-i3)
- **Exit criteria:** [INV-18](./60-conformance-and-testability.md#inv-18)
- **Depends on:** [T10.1](#T10.1)
- **Subtasks:**
  - [ ] T10.3.1 Preferential retention up to keyChainDurableCapBytes
  - [ ] T10.3.2 Evict oldest non-load-bearing links + on-demand re-fetch

### <a id="T10.4"></a>T10.4 Anti-backdating under eviction (C5-1 closure)

Ensure eviction/partial replication never flips a same-key backdate to trusted: an absent chain link yields a `seq` gap projecting pending, with pending→trusted/demoted transitions at most once and never reversing (completed-chain frontier pinned).

- **Implements:** — · [NFR-C6](./11-non-functional-requirements.md#nfr-c6), [NFR-I4](./11-non-functional-requirements.md#nfr-i4), [NFR-I6](./11-non-functional-requirements.md#nfr-i6)
- **Exit criteria:** [INV-19](./60-conformance-and-testability.md#inv-19)
- **Depends on:** [T10.3](#T10.3), [T9.3](#T9.3)
- **Subtasks:**
  - [ ] T10.4.1 Chain gap -> pending (never silently trusted)
  - [ ] T10.4.2 Monotone transition; completed-chain frontier pinning

### <a id="T10.5"></a>T10.5 Per-shared-subset SEC under partial replication

Ensure SEC holds per-shared-subset when replicas hold different evicted subsets: on `S_A ∩ S_B` restricted to chain-complete cells, `proj` agrees byte-identically; divergence surfaces as pending, never two trusted heads.

- **Implements:** — · [NFR-C7](./11-non-functional-requirements.md#nfr-c7), [NFR-I5](./11-non-functional-requirements.md#nfr-i5)
- **Exit criteria:** [INV-18](./60-conformance-and-testability.md#inv-18)
- **Depends on:** [T10.4](#T10.4)
- **Subtasks:**
  - [ ] T10.5.1 Byte-identical proj over complete-durable S_A ∩ S_B
  - [ ] T10.5.2 Divergence surfaces as pending, not two trusted heads


---

**Navigation:** [↑ index](./81-roadmap-epics-and-tasks.md) · [← M7 — Acquisition families](./81h-tasks-m7.md) · [M9 — Conformance suite →](./81j-tasks-m9.md)
