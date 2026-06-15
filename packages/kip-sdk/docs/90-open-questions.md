# Open questions

> The spec's explicitly-deferred non-core questions, faithfully restated with §-cites: the six **accepted residuals** (R1–R6, intrinsic to set-purity — NOT bugs) and the genuinely-deferred **ops/context-layer questions** (OQ-*). Includes the two former OQs the spec **promoted to core**.

**Source:** SPEC §9 (Open questions). Cross-references the [security](./50-security-trust-tenancy.md), [convergence](./24-synchronization-and-convergence.md), [retrieval](./26-retrieval.md), and [active-knowledge](./32-knowledge-autoencoding.md) docs.

---

## Accepted residual bounds (honest, intrinsic to set-purity — NOT bugs, NOT unresolved CRITICALs)

These are stated plainly throughout the spec and are the irreducible floor of a coordinator-free, set-pure, bounded-storage design. **They never yield a wrong *trusted* value**; the worst case is a labeled `pending` or a self-dated lone first-emission. They are **accepted, not open**. (Verified non-CRITICAL in the round-6 adversarial audit.)

### R1 — lone-first-emission self-dating (§3.6 / §8.1)

A key that has emitted **nothing higher in its chain** can self-date a genuine first-emission fact freely (no conflicting same-key history to poison; resolved against other authors by ordinary `orderKey`). The irreducible floor of any set-pure anti-backdating rule. **NOT eviction-reachable** — the C5-1 chain-completeness gate closes the eviction route. (See [anti-backdating, ADR-007](./70-decision-records-adr.md).)

### R2 — `ordinary-cutoff` sub-`effectiveFrom` backdate (§8.1, M5-2 impossibility)

No set-pure revocation mode both demotes a compromised key's sub-`effectiveFrom` backdates **and** preserves that key's honest concurrent sub-`effectiveFrom` work — they are **set-indistinguishable**. `ordinary-cutoff` lets the backdate through (mitigated, not eliminated, by R1's per-key chain rule); `causal-cutoff` catches it but demotes honest concurrent work (surfaced as `kip:revoked-concurrent` for [`re-attest`](./50-security-trust-tenancy.md#re-adjudicating-a-kiprevoked-concurrent-casualty--the-re-attest-mechanism-m5-3)). An explicit, stated **impossibility**, not a missing feature.

### R3 — re-fetch liveness cliff (§3.5a / §8.3b, m6-3 / M6-1)

Under cap-bounded `key-chain-durable` retention, a pre-registration or cap-evicted chain link that has aged out of **every** replica is unreconstructible, so dependent same-key facts stay **`pending` permanently** — **safe** (never a wrong trusted value), but a permanent liveness loss. Mitigation: size `keyChainDurableCapBytes` / `quarantineTtlMs` to the working set; register keys before pre-registration facts age out. (See [DoS threat model](./50-security-trust-tenancy.md#83b-resource-exhaustion--dos-threat-model-c4-1-m4-5).)

### R4 — accelerator (embedding/ANN) non-determinism (§5.3, INV-5)

ANN/embedding projections are **best-effort, recall-equivalent, NOT byte-identical** across replicas — explicitly excluded from the convergence (byte-identity) guarantee. Deterministic projections (heads/graph/salience-with-fixed-weights) are byte-identical; accelerators are not, **by design** (N2). (See [retrieval](./26-retrieval.md).)

### R5 — contextual-answer reproducibility is `asOf`-relative (§5b.1)

With default-`now`, two replicas resolve different frontiers and author different intermediate/result fact sets, so the returned `AnswerGraph` is replica-local. The emitted facts still **converge** under union+`proj` (proj is not broken); only *which* facts get authored is replica-relative. Reproducible mining requires an explicit pinned `asOf` (recorded in every emitted fact's provenance). **Safe** (never a wrong trusted value) — an explicit residual of letting the active layer author off the live frontier.

### R6 — `learn()` accept-vs-exhausted is accelerator-class (§5b.2)

Because `budget` includes `maxWallMs`, whether a run accepts or exhausts (and which candidate it accepts) is model-speed-dependent and **outside `proj`**. Two replicas may legitimately commit different `kip:learn` facts (or one `accept` + one `kip:learn-exhausted`); both fold into the union. Two competing `accept`s on the same **pinned** key surface a `kip:conflict` (resolved by a dominating `resolve`-scoped supersede); an `accept` + an `exhausted`-marker do **not** conflict (different cells — the accept takes the head, the marker is inert provenance). Under default-`now` keying the two `accept`s land in different cells and coexist (benign dual-acceptance — pin `asOf` for a single authoritative result). `proj` **never** re-runs the loop. **Safe**; only the recorded fact is substrate. (See [knowledge autoencoding](./32-knowledge-autoencoding.md).)

> These six are the only honestly-accepted residuals; **none hides a CRITICAL**. The genuinely deferred (ops/context-layer) questions follow.

---

## Genuinely deferred (ops / context-layer) questions

These are out of the **core** and belong to the context layer or to ops tuning; **the core is complete without resolving them.**

- **OQ-1 — default embedding model & dimensionality** (caller-supplied, N2). Core fixes the *index contract* and requires the model id be recorded as a fact (§5.4); it does **not** pick the model.
- **OQ-3 — consolidation *heuristics*** (which episodes promote to semantic, when) — above-core (§4.4).
- **OQ-4 — rollup/gc *scheduling* policy** (after-N-commits vs size vs time) — ops tuning; core fixes the mechanism (§3.5), not the trigger.
- **OQ-5 — cross-tenant federation transport** (beyond git remotes) — deployment concern (N4).
- **OQ-6 — concrete ANN index choice** (HNSW vs IVF vs DiskANN) per scale tier — core fixes the pluggable index interface, not the implementation.

> (OQ-2 and OQ-7 were **promoted to core** — see below; they are no longer open.)

---

## Promoted to core (no longer deferred — they are correctness, not ops)

These were previously open questions but are now **core guarantees**. Captured as decisions in [ADR-004/ADR-005](./70-decision-records-adr.md) (OQ-2) and [ADR-007](./70-decision-records-adr.md) (OQ-7).

- **~~OQ-2~~ → core (§4b.3, C-3, C2-2).** Supersession's convergence is a *core* guarantee: the LLM decision is recorded as a `supersede` fact keyed by input CIDs, so `proj` folds the same recorded decision on every replica. **Concurrent contradictory supersessions surface a `kip:conflict` by the DEFAULT reducer (never a hash tiebreak, C2-2)** and require a new dominating supersede to resolve. Only the *prompt design* (when to fire) remains above-core; the convergence — and the no-silent-arbitration guarantee — are core.
- **~~OQ-7~~ → core (§4b.1, M-2, C3-1, C4-2).** Anti-poisoning / anti-backdating is a *core fairness/correctness* concern for `lww-hlc` (unbounded drift causes monotonic poisoning), not mere human-readability. It is enforced **inside `proj`** keyed on author-HLC, **never** by a receiver-clock ingest gate — so set membership stays a pure function of received bytes (C3-1) and honest offline facts are never dropped (C3-2). The **PRIMARY** bound is the **involuntary per-key author-HLC monotonicity** rule (a fact is demoted if its own key already emitted a higher-stamped non-ancestor fact, C4-2) — *not* the optional author-controlled `causedBy` field, which is a *secondary tightening* check only. The precise bound (it constrains backdating relative to the key's own observed activity; a key that has emitted nothing higher can self-date freely — the acknowledged R1 residual) is stated honestly in §3.6/§8.1 rather than over-claimed. Implausible facts are **quarantined in `proj` and re-evaluated**, never rejected at the gate.
