# Open questions

> The spec's explicitly-deferred non-core questions, faithfully restated with §-cites: the **accepted residuals** (R1–R10 — R1–R6 intrinsic to set-purity, R7–R10 honest bounds named by the round-7 documentation-hardening pass; NOT bugs) and the genuinely-deferred **ops/context-layer questions** (OQ-*). Includes the two former OQs the spec **promoted to core**.

**Source:** SPEC §9 (Open questions). Cross-references the [security](./50-security-trust-tenancy.md), [convergence](./24-synchronization-and-convergence.md), [retrieval](./26-retrieval.md), and [active-knowledge](./32-knowledge-autoencoding.md) docs.

---

## Accepted residual bounds (honest, intrinsic to set-purity — NOT bugs, NOT unresolved CRITICALs)

These are stated plainly throughout the spec and are the irreducible floor of a coordinator-free, set-pure, bounded-storage design. **They never yield a wrong *trusted* value**; the worst case is a labeled `pending` or a self-dated lone first-emission. They are **accepted, not open**. (Verified non-CRITICAL in the round-6 adversarial audit.)

### <a id="r1"></a>R1 — lone-first-emission self-dating (§3.6 / §8.1)

A key that has emitted **nothing higher in its chain** can self-date a genuine first-emission fact freely (no conflicting same-key history to poison; resolved against other authors by ordinary `orderKey`). The irreducible floor of any set-pure anti-backdating rule. **NOT eviction-reachable** — the C5-1 chain-completeness gate closes the eviction route. (See [anti-backdating, ADR-007](./70-decision-records-adr.md).) **Key rotation cross-reference:** each rotation opens a fresh `(replicaId, key)` chain at `seq = 0`, re-opening this first-emission self-dating window for the new chain — the same irreducible floor applies again at every rotation, not just at genesis.

### <a id="r2"></a>R2 — `ordinary-cutoff` sub-`effectiveFrom` backdate (§8.1, M5-2 impossibility)

No set-pure revocation mode both demotes a compromised key's sub-`effectiveFrom` backdates **and** preserves that key's honest concurrent sub-`effectiveFrom` work — they are **set-indistinguishable**. `ordinary-cutoff` lets the backdate through (mitigated, not eliminated, by R1's per-key chain rule); `causal-cutoff` catches it but demotes honest concurrent work (surfaced as `kip:revoked-concurrent` for [`re-attest`](./50-security-trust-tenancy.md#re-adjudicating-a-kiprevoked-concurrent-casualty--the-re-attest-mechanism-m5-3)). An explicit, stated **impossibility**, not a missing feature.

### <a id="r3"></a>R3 — re-fetch liveness cliff (§3.5a / §8.3b, m6-3 / M6-1)

Under cap-bounded `key-chain-durable` retention, a pre-registration or cap-evicted chain link that has aged out of **every** replica is unreconstructible, so dependent same-key facts stay **`pending` permanently** — **safe** (never a wrong trusted value), but a permanent liveness loss. Mitigation: size `keyChainDurableCapBytes` / `quarantineTtlMs` to the working set; register keys before pre-registration facts age out. (See [DoS threat model](./50-security-trust-tenancy.md#83b-resource-exhaustion--dos-threat-model-c4-1-m4-5).)

### <a id="r4"></a>R4 — accelerator (embedding/ANN) non-determinism (§5.3, INV-5)

ANN/embedding projections are **best-effort, recall-equivalent, NOT byte-identical** across replicas — explicitly excluded from the convergence (byte-identity) guarantee. Deterministic projections (heads/graph/salience-with-fixed-weights) are byte-identical; accelerators are not, **by design** (N2). (See [retrieval](./26-retrieval.md).)

### <a id="r5"></a>R5 — contextual-answer reproducibility is `asOf`-relative (§5b.1)

With default-`now`, two replicas resolve different frontiers and author different intermediate/result fact sets, so the returned `AnswerGraph` is replica-local. The emitted facts still **converge** under union+`proj` (proj is not broken); only *which* facts get authored is replica-relative. Reproducible mining requires an explicit pinned `asOf` (recorded in every emitted fact's provenance). **Safe** (never a wrong trusted value) — an explicit residual of letting the active layer author off the live frontier.

### <a id="r6"></a>R6 — `learn()` accept-vs-exhausted is accelerator-class (§5b.2)

Because `budget` includes `maxWallMs`, whether a run accepts or exhausts (and which candidate it accepts) is model-speed-dependent and **outside `proj`**. Two replicas may legitimately commit different `kip:learn` facts (or one `accept` + one `kip:learn-exhausted`); both fold into the union. Two competing `accept`s on the same **pinned** key surface a `kip:conflict` (resolved by a dominating `resolve`-scoped supersede); an `accept` + an `exhausted`-marker do **not** conflict (different cells — the accept takes the head, the marker is inert provenance). Under default-`now` keying the two `accept`s land in different cells and coexist (benign dual-acceptance — pin `asOf` for a single authoritative result). `proj` **never** re-runs the loop. **Safe**; only the recorded fact is substrate. (See [knowledge autoencoding](./32-knowledge-autoencoding.md).)

### <a id="r7"></a>R7 — genesis-root compromise is not in-band recoverable (§8.1 / m7-12)

Revocation chains terminate at the manifest-frozen genesis root, so the root itself cannot be revoked in-band; a compromised root key can mint authorizations/counter-revocations indefinitely. Recovery is the explicit **out-of-band re-genesis path** (new manifest/root set + `re-attest`/re-import migration — [security §8.1](./50-security-trust-tenancy.md#genesis-root-compromise--honest-bound-and-the-re-genesis-path-m7-12-r7)). Mitigations: offline, split-custody root used only to delegate.

### <a id="r8"></a>R8 — entirely-absent chain undetectability (§3.6 / m6-1, broadened by A-6)

The per-key trust gate can demand contiguity only of `(replicaId, key)` chains it has *evidence exist*: a chain withheld **in its entirety** is locally undetectable, so it can *delay* a demotion (hide higher same-key evidence) — never flip `pending` to `trusted` — and resolves monotonically when any link of the hidden chain arrives. The per-key analogue of R1. Pins are immune (a pin enumerates its chains explicitly, m7-2 — see [context seams](./25-context-enablement-seams.md)). **Extended:** an entirely-withheld chain on a **different** `(replicaId, key)` pair of the **same** key is equally undetectable as a totally-absent chain — the "never silently flip a backdate to trusted" guarantee is precise only **within the same `(replicaId, key)` pair** as the evidence actually held; this is the same undetectability class, not a new residual.

### <a id="r9"></a>R9 — pre-revocation forward-dating head capture (§8.1 / m7-13)

A far-future author-HLC stamp from a registered/compromised key captures `lww-hlc` heads (and wedges the key's own later honest facts anachronistic) until an `ordinary-cutoff` revocation with `effectiveFrom` below the forged stamp lands; casualties restore via `re-attest`. Bounded by revocation latency — visible in provenance, never silent, never unrecoverable. (See [security §8.1 forward-dating](./50-security-trust-tenancy.md).)

### <a id="r10"></a>R10 — capacity parameters are genesis-final (§3.1 / §3.5a)

`quarantineTtlMs`, `quarantineKeyCapBytes`, `quarantinePoolBytes`, `keyChainDurableCapBytes`, and `shardDepth` are manifest-pinned with **no in-repo migration/re-tuning path**; mis-sizing (including outgrowing R3's "size the cap to the working set" mitigation) requires **re-genesis + fact re-import**. Operators size every knob with headroom to the *ceiling* working set. (See [git substrate §1.5](./22-git-substrate.md).)

### <a id="r11"></a>R11 — fork demotion is a bounded, replica-local, resolvable divergence (§4b.1/m7-1)

Fork demotion is **per-shared-subset**, mirroring the ordinary SEC caveat ([convergence §4b.4](./24-synchronization-and-convergence.md)): a replica missing one fork branch under partial replication legitimately trusts the chain until the second branch propagates — an explicit, bounded divergence, not a broken guarantee — until the fork **resolves**, either by propagation or by excision (using the A-1 attested-hole treatment) of the fork/duplicate fact. This is the one case where a previously-**trusted** fact is expected to become **demoted** on later information; INV-19's non-reversal clause explicitly excludes fork-demoted cells. A key holder self-forking to repudiate their own history is a known, bounded, auditable instance of this same bound, not a new attack surface. **Acknowledged mitigation:** because fork-recovery excision physically destroys the fork fact — the very evidence of the misbehavior — SPEC.md now requires the higher-privileged `excise-evidence` capability (distinct from ordinary GDPR-erasure `excise`) to excise a fork/well-formedness-demoted fact, so the forking key (or a colluding ordinary-excise-scope holder) cannot unilaterally erase the evidence (see `ExcisionMarker.excisedReason`, [40-sdk-api-surface.md](./40-sdk-api-surface.md)). (See SPEC.md §4.5 and §4b.1 for the fork-demotion/excise-evidence mechanics.)

> R1–R6 were verified non-CRITICAL in the round-6 adversarial audit; R7–R11 were added by the round-7 documentation-hardening pass as honest namings of bounds the design already implied — **none hides a CRITICAL, none weakens an existing guarantee**. The genuinely deferred (ops/context-layer) questions follow.

---

## Genuinely deferred (ops / context-layer) questions

These are out of the **core** and belong to the context layer or to ops tuning; **the core is complete without resolving them.**

- **OQ-1 — default embedding model & dimensionality** (caller-supplied, N2). Core fixes the *index contract* and requires the model id be recorded as a fact (§5.4); it does **not** pick the model.
- **OQ-3 — consolidation *heuristics*** (which episodes promote to semantic, when) — above-core (§4.4).
- **OQ-4 — rollup/gc *scheduling* policy** (after-N-commits vs size vs time) — ops tuning; core fixes the mechanism (§3.5), not the trigger.
- **OQ-5 — cross-tenant federation transport** (beyond git remotes) — deployment concern (N4).
- **OQ-6 — concrete ANN index choice** (HNSW vs IVF vs DiskANN) per scale tier — core fixes the pluggable index interface, not the implementation.
- **OQ-8 — the re-fetch / promisor serving contract** (§3.5a/m7-3): peer selection and ask-order, authorization to serve, retry/backoff, and rate limits for on-demand chain-link re-fetch — including bounding the evict/re-fetch **churn-amplification** and late-registration **fetch-storm** costs noted in [§8.3b](./50-security-trust-tenancy.md). The *mechanism* (content-addressed lazy object fetch over promisor remotes) is core; the *protocol policy* is deployment-shaped and deferred. **Re-verification is not deferred, however:** any re-fetched object — regardless of peer, retry count, or protocol policy — MUST pass the same signature-only ingest gate (§3.2) as a first-arrival fact before it is admitted; a re-fetch is not a trust shortcut, and the deferred protocol-policy questions above bound only *how* the object is located, never *whether* it is re-verified.
- **OQ-9 — a quantitative capacity model**: target envelopes (facts, keys, tenants, replicas), per-mechanism complexity bounds (`proj` fold, chain-completeness gate cost per key, incremental excision worst case per m3-5, Ed25519 verify rate at ingest), and default sizings/formulas for the four retention caps and `shardDepth`. [NFR group F](./11-non-functional-requirements.md) is deliberately qualitative until this is resolved; the only pinned number today is the ≲10⁷-fact band of default 2+2 sharding. A capacity planner cannot yet size a replica, quarantine pool, or rollup cadence from these documents — **declared, not hidden**. **Also undetermined: repack cadence** — how often eviction's excluding-repack (A-11a, [git substrate §6](./22-git-substrate.md#6-admission-control--retention--bounding-storage-without-touching-membership-35a-c4-1)) runs is an operational parameter with no default pinned here; see the debounced-sweep recommendation cross-referenced from A-11a.

> (OQ-2 and OQ-7 were **promoted to core** — see below; they are no longer open.)

---

## Promoted to core (no longer deferred — they are correctness, not ops)

These were previously open questions but are now **core guarantees**. Captured as decisions in [ADR-004/ADR-005](./70-decision-records-adr.md) (OQ-2) and [ADR-007](./70-decision-records-adr.md) (OQ-7).

- **~~OQ-2~~ → core (§4b.3, C-3, C2-2).** Supersession's convergence is a *core* guarantee: the LLM decision is recorded as a `supersede` fact keyed by input CIDs, so `proj` folds the same recorded decision on every replica. **Concurrent contradictory supersessions surface a `kip:conflict` by the DEFAULT reducer (never a hash tiebreak, C2-2)** and require a new dominating supersede to resolve. Only the *prompt design* (when to fire) remains above-core; the convergence — and the no-silent-arbitration guarantee — are core.
- **~~OQ-7~~ → core (§4b.1, M-2, C3-1, C4-2).** Anti-poisoning / anti-backdating is a *core fairness/correctness* concern for `lww-hlc` (unbounded drift causes monotonic poisoning), not mere human-readability. It is enforced **inside `proj`** keyed on author-HLC, **never** by a receiver-clock ingest gate — so set membership stays a pure function of received bytes (C3-1) and honest offline facts are never dropped (C3-2). The **PRIMARY** bound is the **involuntary per-key author-HLC monotonicity** rule (a fact is demoted if its own key already emitted a higher-stamped non-ancestor fact, C4-2) — *not* the optional author-controlled `causedBy` field, which is a *secondary tightening* check only. The precise bound (it constrains backdating relative to the key's own observed activity; a key that has emitted nothing higher can self-date freely — the acknowledged R1 residual) is stated honestly in §3.6/§8.1 rather than over-claimed. Implausible facts are **quarantined in `proj` and re-evaluated**, never rejected at the gate.
