# Non-Functional Requirements

> Numbered, traceable non-functional requirements (NFR-*): the cross-cutting correctness, convergence,
> storage, performance, security, auditability, and discipline guarantees the spec is built around.
> Every NFR cites the SPEC §/INV that grounds it. RFC-2119 keywords carry the spec's precision and are
> not softened (MUST stays MUST).

**Source: SPEC Goals (G1–G8), §3.4, §3.5, §3.5a, §4.5, §4b.4, §5.3, §7, §8.1, §8.3a, §8.3b, §8.4
(INV-*) + non-goal N5.**

The load-bearing correctness mechanics are detailed in
[synchronization & convergence](./24-synchronization-and-convergence.md); the testable form of every
guarantee below lives in [conformance & testability](./60-conformance-and-testability.md). The threat
model and trust model are in [security, trust & tenancy](./50-security-trust-tenancy.md). The
capabilities these constraints govern are in [functional requirements](./10-functional-requirements.md).

---

## NFR group A — Convergence & determinism (the correctness core)

> These are the *non-negotiable* core the rest of the spec is forbidden to contradict.

- **NFR-A1 — Git is the sole source of truth.** Any projection (graph adjacency, vector index, salience)
  MUST be droppable and rebuildable from git objects alone, deterministically. **Source: G1, §5.3
  (INV-5).**
- **NFR-A2 — Signature-only membership gate.** The ingest gate MUST admit a fact **iff** it is
  well-formed *and* its Ed25519 signature verifies over the canonical payload — and **nothing else**:
  NOT drift, NOT key-registration, NOT namespace authority, NOT revocation. Signature validity is the
  **sole** membership predicate (a pure function of the fact's bytes), so every honest replica admits the
  same G-Set. **Source: §3.2, §2.4, §7, INV-6, INV-13.**
- **NFR-A3 — Set-pure deterministic projection.** `proj(S)` MUST be a single total, pure function of the
  whole fact set, order-independent by construction (sort by `orderKey` → group → upcast → reduce). Equal
  admitted sets MUST yield **byte-identical** `/heads` and byte-identical deterministic projections.
  **Source: §3.4, §4b.4, G3, INV-1, INV-3.**
- **NFR-A4 — Strong Eventual Consistency (SEC).** Two replicas holding the same non-excised admitted set
  `S` (after excision markers propagate) MUST compute byte-identical `/heads` and deterministic
  projections, regardless of delivery order, batching, `rxFrom`, commit-order, wall-clock-at-read, or
  which replica authored which fact. **Source: §4b.4, G3, INV-2.**
- **NFR-A5 — `proj` reads no replica-local quantity.** `orderKey`, every reducer, and every trust
  decision MUST read **only** author-stamped, set-resident fields. `rxFrom`, commit-order,
  wall-clock-at-read, the receiver's physical clock, and local key-log sync state MUST NOT appear in any
  of them. **Source: §3.4, §4b.4 (INV-1/INV-2), §2.4 (C2-1), §4.2.**
- **NFR-A6 — `orderKey` totality.** No two distinct admitted facts may share an `orderKey`; the canonical
  payload MUST cover every author/replica/version-distinguishing field
  (`publicKeyFingerprint`, `replicaId`, `v`), so `factCID` is a genuine always-unique final tiebreak and
  every reducer's final tiebreak terminates in `orderKey`. **Source: §2.4 (M2-1), §3.4, INV-3.**
- **NFR-A7 — Trust as set-pure `proj`-demotion, never a gate.** Key-registration,
  namespace-authorization, revocation, and author-HLC causal-plausibility (anti-backdating) MUST be made
  **inside `proj`**, keyed on author-HLC over the admitted set — never as ingest gates and never against
  `rxFrom` or any receiver clock. A demoted fact projects `untrusted`/`quarantined` (surfaced, never
  dropped) and is re-evaluated monotonically as facts arrive. **Source: §3.2, §3.6, §8.1, §7, INV-6,
  INV-10.**
- **NFR-A8 — Idempotent ingestion.** Re-ingesting any fact set MUST be a no-op; a fact's CID includes its
  signed author-HLC, so the same logical fact has one CID on every replica (no double-count under
  `pncounter`). **Source: §4b.2, INV-7.**
- **NFR-A9 — Convergent excision (deterministic DAG regeneration).** After excision, the canonical commit
  DAG MUST be **regenerated** as a pure function of the ordered remaining set (deterministic
  `orderKey`-based commit boundaries; commit timestamp = the batch's max author-HLC `wall` as integer
  Unix seconds `+0000`; fixed sentinel committer == author; **unsigned** DAG; LF-only UTF-8 message; no
  `gpgsig`/`encoding` header), so concurrent excision converges byte-identically — never via path-
  dependent rebase. Identity/as-of/pins MUST address the fact set, never commit CIDs. **Source: §4.5
  (C2-3, M3-3, M4-3), §4b.4, INV-12.**
- **NFR-A10 — Bounded divergence window.** SEC is stated over the non-excised set *after* markers
  propagate; the in-flight excision-propagation window is an explicit, bounded, expected divergence
  window — not a counterexample to SEC. **Source: §4.5 (C-4.2), §4b.4.**

---

## NFR group B — Accelerator non-determinism boundary

- **NFR-B1 — Accelerators are explicitly outside byte-identity.** ANN indexes (HNSW/IVF), embedding
  vectors, and any salience whose centrality term uses a floating/iterative-tolerance algorithm MUST be
  declared **accelerator** projections: best-effort ranked, reproducible only given the same build, and
  **explicitly NOT** guaranteed byte-identical across replicas. **Source: §5.3, G3, INV-5.**
- **NFR-B2 — Accelerator conformance is recall-based.** Dropping and rebuilding accelerators MUST yield
  **recall-equivalent** (a recall@k threshold), not byte-identical, results. Only deterministic
  projections (`/heads`, graph adjacency, salience-with-fixed-weights over an exact integer/rational
  centrality) MUST rebuild byte-identical. **Source: §5.3 (M-7), §5.4 (m2-7), INV-5.**
- **NFR-B3 — Accelerator cache keys cover the model identity.** An accelerator projection chunk's cache
  key MUST include the embedding-model identity (recorded as a `kip:embedding-model` fact) in addition to
  the source hash, so "same source, different model" is a detectable cache miss, not silent staleness.
  **Source: §5.3 (M-7.2), §5.4.**
- **NFR-B4 — The learner loop is accelerator-class, outside `proj`.** The autoencoding search and its
  reconstruction loss are accelerator-class and MUST run outside `proj`; only the *recorded result* (a
  signed `kip:learn` fact) enters the set, and the achieved loss MUST be excluded from `orderKey` and
  every trust/reducer decision (exactly as `rxFrom`). **Source: §5b.2, §5.3.**

---

## NFR group C — Storage bounds & admission control

- **NFR-C1 — Honest monotone storage model.** kip storage is monotonically growing by design. Read
  latency (facts `proj` traverses) MUST be reclaimable by rollup/snapshots; **bytes on disk** are
  reclaimable **only** by excision/gc of unreachable objects. Rollup MUST NOT be claimed to free bytes
  while old commits remain reachable. **Source: §3.5 (M-6).**
- **NFR-C2 — Admission control / retention is transport-layer, never a `proj` input.** A replica MAY
  apply a local resource policy deciding which signature-valid facts it replicates/stores bytes for. This
  policy MUST be enforced at the transport layer (accept-push/fetch) and MUST be excluded from `proj`,
  `orderKey`, and every trust decision (exactly as `rxFrom`). It changes *which bytes a replica keeps*,
  never logical membership or `proj` purity. **Source: §3.5a (C4-1), §4b.4 corollary, INV-18.**
- **NFR-C3 — Set-pure RetentionClass.** `proj` MUST compute, as a pure function of `S`, a per-fact
  `RetentionClass ∈ {durable, key-chain-durable, quarantined-ttl, evicted}` that the transport layer
  reads to decide eviction. The same fact MUST compute the same class on every replica. A `durable`
  (trusted-author) fact MUST NOT be evicted. **Source: §3.5a, INV-18(d).**
- **NFR-C4 — Bounded unregistered-key quarantine.** Facts from an unregistered key MUST be stored as
  `quarantined-ttl` under a bounded per-key byte-cap (`quarantineKeyCapBytes`), a TTL (`quarantineTtlMs`),
  **and** a manifest-pinned **global** `quarantinePoolBytes` aggregate budget (LRU/TTL over the whole
  pool), so an `N`-fresh-key flood cannot exceed the global ceiling. A per-key cap alone MUST NOT be the
  only ceiling. **Source: §3.5a (m5-1), §8.3b, INV-18(b).**
- **NFR-C5 — Cap-bounded registered-key chain retention.** A registered key's `key-chain-durable` chain
  MUST be preferentially retained **up to** a per-key `keyChainDurableCapBytes` cap (not never-evicted);
  past the cap the oldest non-load-bearing links MAY be evicted and re-fetched on demand. A registered or
  compromised key therefore MUST NOT be able to force unbounded non-evictable durable bytes. **Source:
  §3.5a (M6-1), §8.3b, INV-18(d).**
- **NFR-C6 — Eviction never flips a backdate to trusted.** Eviction or partial replication MUST NOT flip
  a same-key backdate from `pending`/`demoted` to `trusted`: an absent same-key chain link yields a
  `(wall,counter)` gap that projects **`pending`** (never silently trusted), and the dependent
  transitions `pending → trusted/demoted` **at most once, never reversing** (the completed-chain frontier
  is pinned while a non-`pending` dependent relies on it). **Source: §3.5a (C5-1, M6-1, m6-2), §8.1,
  INV-19.**
- **NFR-C7 — Per-shared-subset SEC under partial replication.** When replicas hold different evicted
  subsets, SEC MUST hold **per-shared-subset**: on `S_A ∩ S_B`, restricted to cells whose covering keys
  are chain-complete on both, `proj` MUST agree byte-identically; divergence MUST surface as `pending`,
  never as two different trusted heads. Full-universe byte-identity is the cited, deliberate relaxation
  that is the price of bounded storage. **Source: §4b.4 corollary (C4-1, M5-1/C5-1), §3.5a, INV-18(c).**

---

## NFR group D — Security, trust & revocation

- **NFR-D1 — Root of trust.** Each tenant MUST have a genesis root key set pinned in the immutable
  `manifest.json` (never edited). A key-authorization fact is trusted by `proj` **only if** its
  authorizing key chains, at the key-add's author-HLC, to the genesis root for that namespace. A push-only
  replica MUST NOT be able to self-authorize forgery. **Source: §8.1 (C-6.4), INV-10.**
- **NFR-D2 — Scoped authority.** Authority MUST be scoped: a key authorization binds `key → { namespaces,
  ops }` where `excise`/`revoke`/`resolve` are **separately scoped** capabilities (a write key cannot
  excise, revoke, or adjudicate). Multi-tenant isolation MUST be structural (a tenant-A key is never an
  authority for a tenant-B namespace). **Source: §8.1 (C-6.3, C-5, M3-1), §8.2.**
- **NFR-D3 — Revocation is set-pure, author-HLC-keyed, and byte-identical.** Revocation MUST be a `proj`
  decision comparing each fact's signed author-HLC to the revocation's `effectiveFrom` (and, in
  `causal-cutoff`, the set-resident `causedBy` closure) — **never** a receiver clock or `rxFrom` — so the
  demotion is byte-identical across replicas, and it **demotes, does not delete** (N5). **Source: §8.1
  (C-6.1, M2-5, M4-1), INV-17.**
- **NFR-D4 — Set-pure anti-backdating (no clock gate).** Backdating MUST be defended **inside `proj`** by
  set-resident rules — primarily **involuntary per-key author-HLC monotonicity gated on chain
  completeness** (not evadable by omitting `causedBy`, not defeatable by inducing eviction) — never by a
  receiver clock or drift gate. The acknowledged residual (a genuine lone first-emission below a key's own
  chain) MUST NOT be attacker-reachable by eviction/partial replication. **Source: §3.6, §8.1 (C-6.2,
  C4-2, C5-1), §4b.1, INV-16, INV-19.**
- **NFR-D5 — Offline-first ⇔ convergence compatible.** Replicas MUST operate fully offline (local branch
  writes); on reconnect, every signature-valid fact (regardless of age) MUST be admitted by every peer
  that receives it — there MUST be no clock-skew / delivery-timing window that rejects honest offline
  facts. A still-implausible fact is quarantined (never lost logically) and re-evaluated as facts arrive.
  **Source: §4b.4 (C3-2), §3.2, INV-13.**
- **NFR-D6 — Verifiability ≠ trustworthiness.** A revoked or unregistered key's facts MUST remain
  *verifiable* (history intact) while being *demoted* by `proj` — surfaced, never silently dropped (N5),
  re-evaluated as facts arrive. **Source: §7, §8.1, INV-6.**
- **NFR-D7 — Honest tradeoffs stated, not hidden.** The two revocation modes (`ordinary-cutoff` /
  `causal-cutoff`) are the two horns of an explicit set-purity impossibility (no set-pure mode both
  demotes a compromised key's sub-`effectiveFrom` backdates *and* preserves its honest concurrent
  sub-`effectiveFrom` work); honest-concurrent casualties MUST be surfaced as `kip:revoked-concurrent`
  (re-adjudicable via `re-attest`), not silently dropped. **Source: §8.1 (M5-2, M4-1, m5-3).**

---

## NFR group E — Privacy & erasure

- **NFR-E1 — Tombstone vs excision distinctness.** Logical tombstone (signature-preserving, reversible,
  byte-keeping) and physical excision (authorized history-rewrite, byte-freeing, the one operation that
  breaks pure append-only) MUST be distinct mechanisms with the strength/cost tradeoff stated plainly.
  **Source: §4.5, §8.3.**
- **NFR-E2 — Authorized, privacy-safe, residue-free excision.** An `excision` fact MUST be `excise`-scoped
  (unauthorized markers rejected), MUST use a non-content-derived nonce (not a PII fingerprint), and MUST
  re-fold `/heads` so no excised residue survives in the materialized projection. **Source: §4.5 (C-4.1,
  C-4.3, m-11), §8.3, INV-9.**
- **NFR-E3 — Read-time redaction.** Secret-named cells MUST be redacted at read for unprivileged scopes
  (a lightweight per-read form that does not rewrite history). **Source: §8.3, §4.5.**

---

## NFR group F — Performance (incremental & bounded)

- **NFR-F1 — Stable entity identity decoupled from content.** EID MUST be a namespaced,
  cryptographically anchored stable identity decoupled from content addressing (CID), so identity
  survives key rotation/revocation. **Source: G4, §3.6, §1 (terminology).**
- **NFR-F2 — Incremental projections.** Projections MUST rebuild incrementally, keyed off git object
  hashes (subtree-hash skip; embeddings recompute only for entities whose embedded content changed) —
  never a monolithic full rebuild. **Source: G5, §5.3.**
- **NFR-F3 — Lazy `/heads`, batched commits.** `/heads` MUST be rebuilt lazily (on read/snapshot/merge),
  not eagerly per fact; a memory transaction MUST be one commit for many facts (bounding write
  amplification and git object churn). **Source: §3.2, §3.5 (M-6).**
- **NFR-F4 — Bounded traversal & expansion.** Graph expansion in retrieval MUST be bounded and opt-in
  (`hops`/`maxFanout` caps); rollup MUST bound read-latency traversal cost from a snapshot forward.
  **Source: §5.1, §3.5.**
- **NFR-F5 — Incremental excision cost.** Excision regeneration MUST be incremental from the earliest
  excised fact's `orderKey` position (`O(facts after the excision point)`), reusing all byte-identical
  prior commits — never whole-history regeneration. **Source: §4.5 (m3-5).**
- **NFR-F6 — Reproducible recall.** A `recall` at a fixed `asOf` MUST be a pure function of the as-of
  fact-set (salience inputs bounded by `asOf.txTime`), so it does not observer-effect its own ranking.
  **Source: §5.4 (m-7).**

---

## NFR group G — Auditability

- **NFR-G1 — Every change is a signed, provenance-bearing fact.** Every state change MUST be a signed
  fact carrying provenance, an author HLC, and (post-hoc, audit-only) `rxFrom` + commit — so history is a
  verifiable audit log. `provenanceOf` MUST trace any value to its asserting fact, actor, authority
  chain, and source. **Source: §8.3a, §2.4.**
- **NFR-G2 — `fsck` proves local integrity, not convergence.** `fsck` MUST prove `heads == proj(facts)`,
  verify all **fact** signatures, verify each fact's author key chains to the genesis root at its
  author-HLC, and (post-excision) that no residue survives — and MUST NOT check commit signatures (commit
  objects are transport, not trust; commit-author ≠ fact-author on a regenerated DAG is expected). `fsck`
  is explicitly a **local** check; a green local `fsck` MUST NOT be read as a convergence guarantee.
  **Source: §8.3a (m3-4), INV-6.**
- **NFR-G3 — Memory dynamics are auditable facts.** Decay/salience/consolidation and access (`read`)
  events MUST be facts (or rebuildable projections), so the salience input is auditable and
  as-of-queryable and consolidation is replayable from the log (same inputs ⇒ same facts). **Source:
  §4.4, §5.4.**

---

## NFR group H — No fallbacks (N5)

- **NFR-H1 — No silent picks.** kip MUST NOT silently "pick something." Ambiguous merges MUST surface as
  typed conflicts (`kip:conflict`); unverifiable (signature-invalid) facts MUST be rejected;
  multi-segment / multi-realizer matches MUST surface a typed choice; a non-conforming fact MUST
  quarantine, never default or invent data. **Source: N5, §3.4, §2.2, §5b.1 (INV-A7).**
- **NFR-H2 — Unknown is first-class, never defaulted.** Valid-time gaps and `unknown` PropCells MUST
  project explicitly as `unknown` (distinct from an asserted `null`) and MUST propagate `unknown` through
  guards/conditions — never be coerced to a default. **Source: §2.1, §4.2 (M-9), §5b.1.**
- **NFR-H3 — No fabricated active-layer output.** A dispatch failure, timeout, constraint-violation, or
  pending guard MUST leave the target cell `Unknown` and emit **no** fact; a fabricated plausible output
  is the banned fallback. **Source: §5b.1 (INV-A3), N5.**
- **NFR-H4 — Bounded loops only.** The autoencoding loop MUST terminate under a *total*, disjunctive
  budget (`maxIterations ∨ maxWallMs ∨ maxInvocations`); on exhaustion it MUST emit a
  `kip:learn-exhausted` marker and no accept fact. **Source: §5b.2 (INV-A5), N5.**

---

## NFR group I — DoS / resource-exhaustion resistance

- **NFR-I1 — Cheap, byte-pure membership without unbounded durable growth.** The signature-only gate
  deliberately makes logical admission the cheapest byte-pure predicate (one Ed25519 verify). Because
  excision/revocation *demote* (do not reclaim bytes) and an attacker can mint unlimited fresh
  unregistered keys, **durable STORAGE** (not membership) MUST be the bounded resource — fixed at the
  transport layer (§3.5a), never by re-introducing a membership gate. **Source: §8.3b (C4-1), §3.2.**
- **NFR-I2 — Unregistered-key flood bounded in aggregate.** An unregistered key's flood MUST be
  `quarantined-ttl`, bounded per-key **and** by the global `quarantinePoolBytes` budget (LRU/TTL), and
  MUST NOT affect `/heads` (those facts project `quarantined`). An `N`-key flood MUST NOT multiply the
  ceiling. **Source: §8.3b (m5-1), §3.5a, INV-18(b).**
- **NFR-I3 — Registered/insider DoS bounded by quota + revocation + chain gate.** A registered-key
  insider MUST be bounded by the per-key `keyChainDurableCapBytes` eviction cap, by revocation (§8.1), and
  by the per-key chain-completeness anti-backdating gate (so an insider cannot silently backdate a trusted
  fact by inducing eviction). **Source: §8.3b (M6-1), §8.1, §3.6.**
- **NFR-I4 — Admission control is a MAY mechanism, not a mandate.** A replica that opts out of retention
  (stores everything) re-exposes itself to disk growth (an honest, stated bound) — but opting out MUST NOT
  re-open the C5-1 safety hole, because the chain-completeness gate is part of `proj`, independent of the
  retention aggressiveness knob. **Source: §8.3b, §3.5a.**
- **NFR-I5 — Excision authorization resists censorship/DoS.** A replica MUST NOT delete data on an
  unauthorized peer's say-so: an unauthorized `excision` marker MUST be rejected. **Source: §4.5 (m-11),
  §8.3.**
- **NFR-I6 — Accepted re-fetch liveness residual.** The cap's cost is a narrow, *safe* liveness residual:
  a pre-registration / cap-evicted chain link that has aged out of **every** replica leaves dependent
  same-key facts `pending` permanently — never a wrong *trusted* value. This MUST be stated honestly (size
  caps/TTLs to the working set; register keys before pre-registration facts age out), not hidden.
  **Source: §3.5a (m6-3), §8.3b, §9.**

---

## Traceability summary

| Group | NFR area | Primary SPEC sources |
|---|---|---|
| A | Convergence & determinism | G1/G3, §3.2, §3.4, §4.5, §4b.4, §8.1; INV-1/2/3/6/7/10/12/13 |
| B | Accelerator non-determinism boundary | §5.3, §5.4, §5b.2; INV-5 |
| C | Storage bounds & admission control | §3.5, §3.5a, §4b.4 corollary, §8.3b; INV-18/19 |
| D | Security, trust & revocation | §3.2, §3.6, §8.1, §8.2; INV-10/13/16/17/19 |
| E | Privacy & erasure | §4.5, §8.3; INV-9 |
| F | Performance (incremental & bounded) | G4/G5, §3.2, §3.5, §3.6, §5.1, §5.3, §5.4 |
| G | Auditability | §2.4, §4.4, §5.4, §8.3a; INV-6 |
| H | No fallbacks (N5) | N5, §2.2, §3.4, §4.2, §5b.1, §5b.2 |
| I | DoS / resource-exhaustion | §3.5a, §4.5, §8.1, §8.3b; INV-18/19 |

> Every NFR traces to a normative spec guarantee, goal, or invariant. No NFR introduces a new guarantee
> beyond the cited sections, softens a spec MUST, or contradicts the convergence core (§3.2 signature-only
> gate, §3.4 set-pure `proj`, §4b.4 SEC, §5.3 accelerator boundary, N5 no-fallbacks, INV-A1).
