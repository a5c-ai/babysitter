# `@a5c-ai/kip-sdk` — SPEC Convergence Scorecard

> Companion to `SPEC.md` and `reviews/latest-adversarial.md` (round-6, FINAL).
> Records the 6-iteration adversarial-convergence history, the final per-aspect scores, the
> resolved-critical ledger, and the honestly-accepted residual (non-blocking) bounds.
> **Spec-only** convergence — no implementation was scored.

---

## 1. Convergence trend (overall score per iteration)

The spec was driven through six adversarial red-team / fix rounds. Each iteration's "overall" is the
aggregate score the round's adversarial audit assigned.

| Iteration | Label | Overall | Δ vs prev |
|---|---|---|---|
| v1 | draft | **0.557** | — |
| iter-1 | round-1 fixes | **0.696** | +0.139 |
| iter-2 | round-2 fixes | **0.734** | +0.038 |
| iter-3 | round-3 fixes | **0.808** | +0.074 |
| iter-4 | round-4 fixes | **0.852** | +0.044 |
| iter-5 | round-5 fixes (= round-6 audit score) | **0.870** | +0.018 |
| **final pass** | round-6 findings closed (M6-1 + m6-1/m6-2/m6-3) | **— (re-scoring deferred)** | — |

```
0.557 ─▶ 0.696 ─▶ 0.734 ─▶ 0.808 ─▶ 0.852 ─▶ 0.870 ─▶ [M6-1 + 3 minors closed]
  v1      iter1    iter2    iter3    iter4    iter5     final consistency pass
```

Trend: monotone improvement across every round, with diminishing deltas as the convergence core
stabilized — the classic shape of an adversarial process approaching a fixpoint. The final pass lands
**past** the 0.870 snapshot (it closed the one remaining MAJOR and all three round-6 MINORs), but
**no new number is fabricated**: re-scoring is deferred.

> **Final-pass note.** This pass additionally **CLOSED M6-1 + the three round-6 minors** (m6-1/m6-2/m6-3)
> in the SPEC. The shipped spec is therefore strictly past the 0.870 snapshot. **M6-1 and round-6 minors
> resolved in the final consistency pass; re-scoring deferred.**

---

## 2. Final per-aspect scores (round-6 audit)

Overall **0.870** — `blocking = false`, **0 unresolved CRITICAL**.

| Aspect | Score |
|---|---|
| completeness | 89 |
| correctness | 88 |
| git_fit | 90 |
| graph_model | 90 |
| memory_semantics | 86 |
| query_retrieval | 84 |
| scalability | 83 |
| security_privacy | 83 |
| sdk_ergonomics | 82 |
| testability | 86 |
| clarity | 88 |
| **overall** | **0.870** |

Highest: `git_fit` / `graph_model` (90) — the git-substrate + projected-property-graph fit is the
spec's strongest, most-audited surface. Lowest: `sdk_ergonomics` (82) and `scalability` /
`security_privacy` (83) — the surfaces where honest residual bounds (re-fetch liveness, registered-key
durable pool, ANN non-determinism) legitimately cap the score; these are *stated tradeoffs*, not gaps.

---

## 3. Round-6 closure (this final pass)

The round-6 adversarial audit found **0 CRITICAL, 1 MAJOR (M6-1), 3 MINOR (m6-1/m6-2/m6-3)**, assessment
*"ship-quality pending one MAJOR."* All four are resolved in the final consistency pass:

| Finding | Severity | Resolution (in `SPEC.md`) |
|---|---|---|
| **M6-1** | MAJOR | `key-chain-durable` vs "bounded by per-key quota" internal contradiction closed by **decoupling safety from retention**: backdating-safety rests on the chain-completeness gate alone; retention is now **cap-bounded by per-key `keyChainDurableCapBytes` with on-demand content-addressed re-fetch**. An evicted-then-needed chain link forces dependent same-key facts `pending` (SAFE) until re-fetch — never silently trusted. INV-18(d) amended (retained UP TO the cap, not never-evict; unbounded registered-key pool now also fails conformance). Removes the unbounded-durable-storage residual AND the contradiction; convergence core untouched. §3.5a, §3.6, §4b.4, §8.1, §8.3b, INV-18(d), v6 headline. |
| **m6-1** | MINOR | Per-key chain disambiguated as **per-key** (an author key may emit from multiple replicas), with `(wall,counter)` **contiguity decided per-`(replicaId,key)`** (matching §4c/m4-1), completeness as the **union** over `K`'s replicas, and the monotonicity demotion **key-wide**. §3.6 gate (i), §4c, terminology. |
| **m6-2** | MINOR | INV-19's `pending → demoted/trusted` **non-reversal preserved under cap-bounded retention** via **completed-chain-frontier pinning**: a link backing a non-`pending` dependent is not re-evictable while that dependent is non-`pending`. The M6-1 cap does not contradict INV-19. §3.5a, §4b.4, §8.1, INV-19. |
| **m6-3** | MINOR | **Re-fetch liveness residual stated honestly**: a pre-registration (or cap-evicted) chain link LRU-dropped from *every* replica leaves dependent facts `pending` **permanently** (SAFE, never wrong-trusted). Mitigation: size the cap / `quarantineTtlMs` to the working set; register keys before facts age out. §3.5a, §8.3b, §9 (R3). |

---

## 4. Resolved-CRITICAL ledger (headline criticals fixed across the six rounds)

| Tag | Round | CRITICAL (and the fix that closed it) |
|---|---|---|
| **C-1** | early | Valid-time-clipping fold was order-dependent (`(A⊕B)⊕C ≠ A⊕(B⊕C)`) ⇒ replaced the unsound pairwise `merge(base,a,b)` with a **set-pure projection**: `proj(S)` sorts once by a total `orderKey`, then sweep-line folds — order-independent by construction. |
| **C-5 / C-6** | early | Identity + trust: **dual-id scheme** (frozen genesis `namespaceId` for stable EID equality, content CID for integrity/dedup) and a **genesis-rooted authority chain** keyed on author-HLC — identity stable across key rotation/revocation. |
| **C3-1** | mid | The ingest gate was reading replica-local state (drift / key-log) ⇒ permanently-divergent membership. Fixed by the **signature-only ingest gate**: Ed25519-over-canonical-payload is the SOLE membership predicate; every other trust question is a set-pure `proj` demotion. |
| **C4-1** | round-4 | Signature-only gate bought purity with **unbounded storage** (any keyholder floods every replica). Fixed by splitting **LOGICAL membership (signature-only, unchanged)** from **DURABLE storage (a transport-layer retention policy)**: quarantine-TTL + per-key cap + global `quarantinePoolBytes`; SEC restated per-shared-subset. |
| **C4-2** | round-4 | Anti-backdating rested on the voluntary, omittable `causedBy` field. Fixed by the **involuntary per-key author-HLC monotonicity rule** (a key cannot un-emit its higher-stamped facts) — set-pure, not author-forgeable. |
| **C5-1** | round-5 | Composition of C4-1 eviction with C4-2 monotonicity let a registered key backdate a *trusted* fact onto a victim whose durable subset lacked the key's higher facts. Fixed by the **per-key chain-completeness gate**: a `(wall,counter)` gap ⇒ `pending` (never a silent trusted backdate), reusing the §4c/m4-1 pin-completeness contiguity rule. *(Final pass: its retention half was the source of M6-1, now cap-bounded — safety unchanged.)* |

Across all six rounds: **0 CRITICAL remain unresolved.** The convergence core (signature-only gate,
`proj`-purity, `orderKey` totality, SEC theorem, "eventual-once-complete" chain semantics) passed **five
consecutive adversarial audits** unbroken.

---

## 5. Residual non-blocking risks (honest, accepted bounds — NOT bugs)

These are intrinsic to a coordinator-free, set-pure, bounded-storage design. None yields a wrong
*trusted* value; the worst case is a labeled `pending` or a self-dated lone first-emission. Stated in
`SPEC.md` §9 (R1–R4) and at their loci.

| ID | Residual | Why accepted (never a CRITICAL) |
|---|---|---|
| **R1** | **Lone-first-emission self-dating** — a key that has emitted nothing higher in its chain can self-date a genuine first-emission fact freely. | The irreducible floor of any set-pure anti-backdating rule; no conflicting same-key history to poison. NOT eviction-reachable (C5-1 gate closes that route). |
| **R2** | **Ordinary-cutoff sub-`effectiveFrom` backdate** — `ordinary-cutoff` revocation lets a compromised key's sub-`effectiveFrom` backdate through to preserve honest concurrent work. | A stated **impossibility** (M5-2): no set-pure mode separates the two set-indistinguishable cases. `causal-cutoff` is the opt-in alternative (catches the backdate, demotes honest concurrent work → `kip:revoked-concurrent` for re-attest). |
| **R3** | **Re-fetch liveness cliff** — a pre-registration / cap-evicted chain link aged out of every replica leaves dependent facts `pending` permanently. | **Safe** (never wrong-trusted). Mitigated by sizing `keyChainDurableCapBytes` / `quarantineTtlMs` to the working set; an honest operational bound, not a correctness defect. (New with the M6-1 cap.) |
| **R4** | **Embedding / ANN non-determinism** — accelerator projections are recall-equivalent, not byte-identical across replicas. | Explicitly **out of scope** of the byte-identity convergence guarantee (N2, INV-5). Deterministic projections (heads/graph/salience-with-fixed-weights) remain byte-identical. |

---

## 6. Ship readiness

- **0 CRITICAL** across six adversarial audits; convergence core unbroken through five.
- Round-6's single MAJOR (M6-1) and all three MINORs (m6-1/m6-2/m6-3) **closed** in this final
  consistency pass — the shipped spec is past the 0.870 snapshot.
- Remaining items are **honestly-accepted residual bounds** (R1–R4), labeled as such, not bugs.
- **Status: ship-quality, spec-only.** Re-scoring after the final pass is **deferred** (no fabricated
  number).
