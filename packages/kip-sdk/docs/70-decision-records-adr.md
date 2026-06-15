# Architecture decision records

> The spec's load-bearing decisions distilled into ADR form (Context / Decision / Consequences / Rejected alternatives). **No new decisions are introduced here** — every ADR traces to a spec decision marker (`Decision (D-…)`, a bare `**Decision:**` block, or a resolved `C-…`/`M-…` item) via its traceability line.

**Source:** SPEC — all `Decision (D-5b.*)` blocks (§5b.1–§5b.3), the bare `**Decision:**` blocks (§2.2, §3.2, §4b.1, §4b.5), and the major `C-…`/`M-…` resolutions across §3, §4, §4b, §8.

---

## How to read these

Each ADR distills one decision the spec already made and defends. **Status is Accepted** for all of them (the spec is hardened/v4-final). The *Decision* and *Rejected alternatives* are faithful summaries of the spec's own wording; the *Consequences* are the spec's stated implications. The **Traceability** line maps the ADR back to its SPEC anchor(s). Cross-links point to the doc that owns each topic.

---

## ADR-001: Membership is decided by SIGNATURE ALONE

**Status:** Accepted

**Context.** For two replicas to converge, the *admitted set* must be a pure function of the bytes received. Any membership predicate that reads a replica-/time-local quantity (drift, key-registration state, namespace authority, revocation) makes admitted sets diverge permanently (C3-1, M3-4).

**Decision.** The INGEST-GATE admits a fact **iff** it is well-formed and its Ed25519 signature verifies over the canonical payload — **and nothing else**. A signature-valid fact is **always** admitted, even if old, unregistered, out-of-namespace, or revoked; all of those become **`proj`-time demotions**, never drops. Schema is likewise **not** a gate (M-8): non-conforming facts quarantine in `proj`, never rejected.

**Consequences.** Equal received sets ⇒ equal admitted sets ⇒ byte-identical `/heads` (the SEC antecedent). Offline-first and convergence become compatible (a fact authored offline and synced late still verifies, C3-2). The cost is the DoS surface (ADR-013) and the need to move *all* trust to `proj`.

**Rejected alternatives.** A receiver-physical-clock drift-ε ingest gate (made membership replica-local, dropped honest offline facts, still left a backdating band — C3-1/C3-2/C3-3); a key-log gate at ingest (second membership-divergence axis, M3-4).

*Traceability: SPEC §3.2 `ingest(f)` + NOTE blocks; §4b.4 proof step 1; C2-1/C3-1/M3-4/M3-5.*

---

## ADR-002: Merge is set-union; heads are a deterministic projection `proj`

**Status:** Accepted

**Context.** The v1 binary `merge(base,a,b)` cell-merge operator could not express valid-time geometry and its associativity claim was unsound — `(A⊕B)⊕C ≠ A⊕(B⊕C)` (C-1/C-2).

**Decision.** Two cleanly separated things: (a) the substrate state is a **grow-only fact set**, and merge is **set union of fact blobs** (associative/commutative/idempotent — the only CRDT); (b) `/heads` is `proj(S)`, **one total pure function of the whole set** — sort by `orderKey` → group by cell → upcast → reduce — order-independent *by construction*. There is **no** binary cell-merge operator. Valid-time geometry is a sweep-line over interval endpoints in `orderKey` order.

**Consequences.** Equal sets ⇒ identical sorted sequence ⇒ byte-identical `/heads`, regardless of fold order (no fold order exists). Gaps are first-class `unknown` segments (M-9). The full data-flow lives in the [convergence](./24-synchronization-and-convergence.md) and [git substrate](./22-git-substrate.md) docs.

**Rejected alternatives.** A pairwise binary merge operator (removed, C-1/C-2 — unsound and inexpressive).

*Traceability: SPEC §3.4 (a)/(b); §4b.2; §4b.3 table; §4b.4 proof step 2; C-1/C-2/C2-1.*

---

## ADR-003: The clock is an author-stamped HLC

**Status:** Accepted

**Context.** Convergence needs a deterministic total order over set-resident fields; the order must be human-anchorable and O(1) in metadata for high-fan-out fleets (T-5).

**Decision.** Every fact carries a signed author-stamped **HLC** `(wall:int64ms, counter:uint32, replicaId)`. `orderKey` compares `validFrom`, `wall`, `counter`, `replicaId`, then `publicKeyFingerprint`, then `factCID` — **set-resident fields only, never `rxFrom`**. On counter overflow within a `wall` ms, carry into `wall+1` and reset counter to 0 (never wrap — wrap would break the total order and SEC, M-2).

**Consequences.** A deterministic, human-anchored, causally-sound total order with O(1) metadata. The `factCID` final tiebreak is total because the canonical payload covers every author/replica/version field (M2-1, INV-3).

**Rejected alternatives.** Wall-clock alone (no cross-replica causal order); Lamport (not human-anchorable, can't bound drift); vector/dotted-version clocks (metadata grows O(replicas)).

*Traceability: SPEC §4b.1 "Clock — HLC (decision)"; M-2/M2-1.*

---

## ADR-004: Semantic supersession is recorded as a fact; `proj` never re-runs the LLM

**Status:** Accepted

**Context.** LLM/heuristic "this invalidates that" decisions are order-sensitive; if run inside `proj`, two replicas would diverge (T-4).

**Decision.** A supersession decision is **frozen into a signed `supersede` fact** keyed by its **input-CID set** *before* it can affect convergence; `proj` then folds that recorded decision by the same `orderKey`, never re-running the model. Re-running the pass over the same inputs yields the same CID (a no-op, INV-7). The semantic layer **never mutates a fact** and **never participates in `proj`** (C-3).

**Consequences.** The bytes of `/heads` are a function of the set only, never of which replica ran the pass when. Concurrent **contradictory** supersessions surface a `kip:conflict` (ADR-005), not a silent winner.

**Rejected alternatives.** Letting `proj` re-derive supersession non-deterministically (breaks byte-identity).

*Traceability: SPEC §4b.3 table + "Key invariant (C-3)"; §3.4 "Semantic supersession is also a pure function"; C-3.*

---

## ADR-005: Contradictory non-commutative decisions surface `kip:conflict`; resolution is single-writer `resolve`-scoped (no silent tiebreak)

**Status:** Accepted

**Context.** A total-order tiebreak among genuinely contradictory *authored* decisions is an arbitrary winner — a fallback in disguise, banned by N5 and the repo "fallbacks are evil" rule. Only genuinely commutative cell types may total-order silently.

**Decision.** A per-cell-type resolution table is normative. **Commutative** types (`lww-hlc` register, `gset`, `pncounter`) resolve by `orderKey`-max / union by definition. **Non-commutative** types (`supersede`, divergent `kip:learn` accepts, divergent microagent-registration on `(name,version)`, `not_same_as` vs derived equivalence, custom-declared-irreconcilable) surface a typed **`kip:conflict`**, never `factCID`-tiebroken (C2-2). A conflict leaves `CONFLICTED` **only** via a new dominating `supersede` signed by a key holding the **`resolve` scope** — single-writer per `inputCids`, so the adjudication ladder terminates and cannot ping-pong (M3-1).

**Consequences.** Convergence of the conflict marker is contingent on admitted-set convergence — guaranteed under the signature-only gate (ADR-001). `CONFLICTED` reads return all `candidates`; callers MUST handle them (m-4).

**Rejected alternatives.** A default `factCID`/`orderKey` tiebreak of contradictory adjudications (a laundered hash winner, N5); a non-single-writer resolution (re-openable ladder).

*Traceability: SPEC §3.4 resolution table + "Conflict surfacing"; §4b.3; C2-2/M3-1.*

---

## ADR-006: `/heads` is regenerated by `proj`, never branch-merged; identity addresses the FACT SET, not commit CIDs

**Status:** Accepted

**Context.** Git's tree-merge cannot express valid-time geometry, and commit CIDs change under excision rewrite (C2-3). Anything that addresses commit CIDs would dangle or diverge.

**Decision.** `/heads` is **regenerated** by folding `proj` over the set, **never** produced by a git content-merge of two `/heads`. Pins, `asOf`, and `SnapshotRef`s content-address the **`factSetDigest` + author-HLC frontier**; `dagTips` is **dropped** from the durable pin contract. The commit DAG is a **deterministic regeneration** of the ordered set (every regenerated commit field set-derived: deterministic batch boundaries, timestamp = batch-max author-HLC `wall` as integer Unix seconds `+0000`, fixed sentinel committer, **unsigned**), so concurrent excision converges (M3-3/M4-3).

**Consequences.** Pins survive any rewrite by re-resolving the fact frontier; concurrent excision is confluent by construction (INV-12). `commit-author ≠ fact-author` is allowed; `fsck` ignores commit signatures.

**Rejected alternatives.** Rebasing the old DAG (git rewrites don't commute); signing the regenerated DAG with the regenerator's key (per-replica bytes, contradicts INV-12, M3-3).

*Traceability: SPEC §4.5 "Concurrent excision is confluent…"; §4b.4 proof step 4; C2-3/M3-3/M4-3.*

---

## ADR-007: Anti-backdating / anti-poisoning is enforced inside `proj` on the author's INVOLUNTARY same-key footprint, gated on chain completeness

**Status:** Accepted

**Context.** A far-ahead `wall` stamp would win all `lww-hlc` races forever (monotonic poisoning); a compromised key could backdate. The v3 `causedBy`-only rule was author-forgeable (omit `causedBy` ⇒ vacuous ancestry ⇒ no demotion, C4-2), and an eviction route could silently flip a backdate to trusted (C5-1).

**Decision.** Police drift **inside `proj` with set-resident causal rules, never at the gate, never against a receiver clock**. PRIMARY: **per-key author-HLC monotonicity gated on per-key chain completeness** — `F` from `K` projects trusted only over `K`'s complete gap-free `(wall,counter)` chain (else `pending`), and is demoted `untrusted-anachronistic` if `S` holds a higher-HLC non-ancestor same-key fact in that complete chain. SECONDARY (tightening): voluntary `causedBy` dominance. Plus `causedBy` well-formedness demotion (M4-2).

**Consequences.** Backdating is bounded **relative to the key's own observed activity** — a key that emitted nothing higher can self-date a lone first-emission (acknowledged residual [R1](./90-open-questions.md)). Eviction-safe and monotone (INV-16/18/19). Honest late facts are kept (C3-2), unlike a clock gate. See [security](./50-security-trust-tenancy.md#83b-resource-exhaustion--dos-threat-model-c4-1-m4-5).

**Rejected alternatives.** A receiver-clock drift-ε ingest gate (C3-1/C3-2); a `causedBy`-only rule (forgeable by omission, C4-2); relying on never-evict retention for safety (replaced by the completeness gate, C5-1/M6-1).

*Traceability: SPEC §4b.1 "Anti-poisoning by SET-RESIDENT causal plausibility"; §3.6 PRIMARY/SECONDARY rules; OQ-7→core; C4-2/C5-1/M4-2.*

---

## ADR-008: Stable identity is a namespaced, genesis-anchored EID, distinct from the content CID (dual-id)

**Status:** Accepted

**Context.** Content-addressing gives integrity/dedup but cannot express "the same entity over time"; a bare-string EID is forgeable and a v2 key-fingerprint EID orphaned namespaces on every key rotation (T-1, C-5, M2-3).

**Decision.** Maintain **both** layers: **CID** (git object id) is authoritative for integrity/dedup/sync; **EID** = `"<tenant>/<namespaceId>/<localId>"` is authoritative for identity/equality. `namespaceId` is the fingerprint of the **GENESIS** authority **frozen at namespace creation** (M2-3), so key rotation/revocation never changes the EID; write authority moves across keys via the authorization chain. Equality requires equal full EID; cross-namespace `localId` collisions are distinct entities (kills the "equal string ⇒ same entity" hazard, C-5.2). Intentional collisions use a `natural-key` `IdentityPolicy`.

**Consequences.** Identity is stable across rotation; namespaces are never orphaned; revoking the old key never retroactively invalidates pre-`effectiveFrom` facts (M2-5). Write authority is cryptographically bound and demoted set-purely (C-5.1).

**Rejected alternatives.** A bare-string EID (forgeable, accidental cross-tenant merges); the current-key fingerprint in the EID (namespace orphaning on rotation, M2-3).

*Traceability: SPEC §3.6 "the dual-id scheme"; HP-4/T-1/C-5/M2-3.*

---

## ADR-009: Forgetting — tombstone (logical, default) vs excise (physical, the one append-only break)

**Status:** Accepted

**Context.** Immutable history must coexist with legal erasure (GDPR Art. 17). Excision breaks content hashes and changes commit CIDs (HP-7, C-4).

**Decision.** Three mechanisms: **soft-forget** (drop from hot projections, reversible), **tombstone** (signed `retract`/`tombstone` — closes/splits valid-time, **keeps bytes + signature**, the **default**), and **excise** (the **one** operation that breaks pure append-only — `excise`-scoped, re-folds `/heads`, marker is a **non-content-derived nonce** so it is not a PII fingerprint, C-4.3). Excision authorization is enforced (unauthorized markers rejected, m-11); regeneration is incremental from the earliest excision point (m3-5).

**Consequences.** Logical forgetting is auditable/reversible and signature-preserving; physical erasure is explicit, authorized, and confluent (ADR-006). The strength/cost tradeoff is stated plainly, not hidden.

**Rejected alternatives.** Pretending excision is free; carrying the raw content CID in the excision marker (re-exposes low-entropy PII, C-4.3).

*Traceability: SPEC §4.5 "Forgetting vs immutable history"; HP-7/C-4/m-11.*

---

## ADR-010: Storage is bounded at TRANSPORT (admission control & retention), never at membership

**Status:** Accepted

**Context.** Signature-only membership means a replica must not be forced to keep the bytes of unlimited facts from unlimited unregistered keys forever — but a membership gate to fix this re-opens divergence (C4-1).

**Decision.** Separate two layers: LOGICAL membership (`proj` reads, unchanged) and **ADMISSION CONTROL & RETENTION** (transport policy, explicitly excluded from `proj`/`orderKey`/trust, exactly as `rxFrom` is). `proj` computes a set-pure per-fact `RetentionClass` (`durable` / `key-chain-durable` / `quarantined-ttl` / `evicted`) the transport layer reads to decide eviction. Unregistered-key facts are `quarantined-ttl` (per-key cap + TTL + **global `quarantinePoolBytes` aggregate budget**, m5-1); a registered key's trusted facts are `durable` (never evicted); its chain links are `key-chain-durable` (cap-bounded by `keyChainDurableCapBytes` with on-demand re-fetch, M6-1).

**Consequences.** Membership purity AND bounded availability. SEC is restated **per-shared-subset** (equal *complete-durable* subsets ⇒ identical heads on that subset; not-yet-complete cells read `pending`, M5-1/C5-1). Admission control is a **MAY**; a permissive opt-out replica is not claimed bounded. Residual: the re-fetch liveness cliff ([R3](./90-open-questions.md)).

**Rejected alternatives.** Fixing the flood at the membership gate (re-opens C3-1/M3-4 divergence); a per-key cap with no aggregate budget (`N` keys ⇒ `N×` bytes, m5-1); a never-evict `key-chain-durable` pool (contradicts "bounded by quota", retracted in M6-1).

*Traceability: SPEC §3.5a "Admission control & retention"; §4b.4 SEC corollary; §8.3b; C4-1/m5-1/M6-1/C5-1.*

---

## ADR-011: Branch-per-agent + shared trunk + ephemeral session read-pins

**Status:** Accepted

**Context.** A single write trunk serializes agents (needs a coordinator); unbounded branch-per-memory is a gc/merge nightmare (T-2).

**Decision.** Hybrid — long-lived `refs/kip/replicas/<id>` per agent, a shared `main` trunk, and short-lived `refs/kip/sessions/<runId>` read-pins. Each agent writes only its own replica branch (no write serialization ⇒ coordinator-free); `sync` does the typed set-union merge in any topology (star or mesh) and converges identically — the trunk is a convenience anchor, not a correctness requirement.

**Consequences.** No coordinator, no quorum, no global lock. Branch proliferation is bounded (session branches ephemeral, replica branches O(agents)). As-of *and* divergent timelines coexist.

**Rejected alternatives.** Pure single-trunk (Datomic — serializes writes, can't branch-from-past); unbounded branch-per-memory (gc/merge nightmare).

*Traceability: SPEC §4b.5 "Branch-per-agent vs trunk (decision)"; T-2.*

---

## ADR-012: Commit granularity is batched (one commit per memory transaction); `/heads` rebuilt lazily

**Status:** Accepted

**Context.** Per-fact commits explode git object count and multiply `/heads` tree churn at agent write rates (HP-3, M-6).

**Decision.** Default is **batched** — a `txn([...facts])` produces **one commit** containing many facts; `/heads` and projections are rebuilt **lazily** (on read/snapshot/merge), not eagerly per fact. `proj` re-folds only the touched cells. `assertFact` returns `{factId, status: "pending"|"durable"}`; `txn` returns only after the commit (the publish point), so there is no `"durable"` ack before the commit (m-9).

**Consequences.** Per-fact tree churn is one fact blob + path trees, not a head-blob rewrite. Embedders may set `headsCommitted=false` to roughly halve write amplification at a clone-time rebuild cost.

**Rejected alternatives.** One-commit-per-fact (Datomic-tx-like — pathological git object count).

*Traceability: SPEC §3.2 "Commit granularity (decision)" + "Durability (m-9)"; §3.5; HP-3/M-6.*

---

## ADR-013: Schema is applied in `proj` via versioned upcasters, not as a write-time gate

**Status:** Accepted

**Context.** Rejecting facts at write against the current ontology is order-dependent and replica-relative — a v1-replica accepts what a v2-replica rejects (divergence, M-8).

**Decision.** Schema is a per-tenant, mutable, **versioned ontology stored as facts**. Facts are always accepted into the substrate if their signature verifies; ontology conformance is applied **inside `proj`** via versioned upcasters that **terminate with a typed result** (`value | quarantine`), pass unknown versions through as opaque-quarantined, and **never throw, never invent missing data** (INV-8, honoring the no-fallback rule).

**Consequences.** Schema history is auditable and as-of-queryable; schema evolution is supported from day one (G7/HP-8). `cardinality` is surfaced, not a write gate (m-12).

**Rejected alternatives.** A write-time ontology-validation gate (order-dependent divergence, M-8); an "always-total, never-quarantines" upcaster (corrected — it would invent data).

*Traceability: SPEC §2.2 "Decision: schema is applied in `proj`…"; INV-8; M-8/HP-8.*

---

## ADR-014: An `EdgeKind` MAY carry executable functionalities, but results enter only as orchestrator-signed facts (D-5b.1)

**Status:** Accepted

**Context.** Contextual relations want executable, computed hops (REST/SQL/search/transform) without surrendering `proj`-purity or convergence.

**Decision.** A contextual hop dispatches a microagent whose **validated output the orchestrator commits as `assert` + `derived_from` facts**; the projected edge/node materializes solely through `proj` over those facts. The microagent is a **pure client**, never the substrate (INV-A1).

**Consequences.** Executable relations *and* convergence. The full mechanism is in [contextual functionalities](./31-contextual-functionalities.md) and [active-knowledge overview](./30-active-knowledge-overview.md).

**Rejected alternatives.** Letting the bound microagent write the edge/node directly (an unsigned replica-local writer bypassing §3.2, graphs diverge by execution order — the Letta substrate-coupling pitfall, N2).

*Traceability: SPEC §5b.1 Decision (D-5b.1); INV-A1.*

---

## ADR-015: Weighted relations and condition nodes are declared `/ontology` facts, not runtime floats (D-5b.4)

**Status:** Accepted

**Context.** The patent's relation **weight** and **condition node** must order/gate hops deterministically across replicas.

**Decision.** Adapt them as a `weight?: number` and a `ConditionNode` on `FunctionalityBinding`, stored as set-resident `/ontology` facts and evaluated as **pure reads over `proj`**. Weight **orders** the presented multi-segment choice (never auto-picks, N5); a condition gates a hop byte-identically. Malformed declared data (a `range` with neither `min` nor `max`, any `NaN`/`±Infinity`) is **rejected at registration** to keep the order total.

**Consequences.** Segment ordering and hop-gating are replica-independent; a non-total order (a silent default in disguise) is impossible.

**Rejected alternatives.** Evaluating weight/condition at dispatch time as a live runtime score (per-replica float ⇒ irreproducible).

*Traceability: SPEC §5b.1 Decision (D-5b.4).*

---

## ADR-016: Three patent relation facets kept orthogonal — constraint / conditional / relation-type (D-5b.7)

**Status:** Accepted

**Context.** The patent's claim-8 constraint, claim-12 conditional, and claim-7 relation-type were previously conflated.

**Decision.** Keep them as separate set-resident binding fields: **constraint** (`constraint?: ConditionNode`, verified against the seed's own projected props before dispatch — a violation yields `constraint-violation`, no dispatch/no fact); **conditional** (`requires?`/`condition?`, gating on a required *other* instance); **relation type** (`relationClass?` — advisory selection metadata, never gating). N realizers per `(edgeKind,sourceKind,targetKind)` are enumerated as `Segment.alternatives`.

**Consequences.** Each facet is distinct and separately testable (INV-A3 constraint-violation; INV-A7 multi-realizer choice).

**Rejected alternatives.** Collapsing constraint into the conditional guard, dropping the relation-type facet, keeping a 1:1 binding (conflates "is the seed valid?" with "does a neighbor exist?", silently drops claim-7).

*Traceability: SPEC §5b.1 Decision (D-5b.7).*

---

## ADR-017: A matched segment is a dependency DAG executed in deterministic topological order (D-5b.8)

**Status:** Accepted

**Context.** A strictly-linear chain cannot express a multi-input join or two converging branches (the patent's "plurality of sub-graphs").

**Decision.** Compile divides the query into single-step queries (one per `Segment.steps` entry = one `MicroagentInvocation`); execute walks them in a **deterministic topological order over `Segment.deps`**, read purely over `proj` (ties by ascending `steps[]` index then §3.4 tiebreak) — byte-identical on every replica (INV-A2). A computed intermediate fans out to **every** declared downstream step. The linear chain is the degenerate DAG (`deps=[]`). Cyclic/out-of-range `deps` are malformed and **rejected at compile** (N5).

**Consequences.** Multi-input joins/converging branches are expressible; execution order (and which intermediates are authored first) is replica-independent.

**Rejected alternatives.** Strictly-linear execution; a replica-local heuristic topological sort (re-introduces a non-deterministic quantity into a must-compile-identically path).

*Traceability: SPEC §5b.1 Decision (D-5b.8).*

---

## ADR-018: Cross-relation composition-discovery is a pure compile-time `proj`-search (D-5b.9)

**Status:** Accepted

**Context.** The patent composes a "price in any currency" linkage from *separate* relations no single declared functionality covers.

**Decision.** The engine MAY discover a multi-relation **chain** of functionalities by a **pure compile-time `proj`-search over the ontology graph**, linking separate registered bindings across different contextual relations. The search reads only `proj` at `asOf`, is deterministic (ties via `weight` then §3.4 tiebreak), emits **no fact** until execution, and on execution signs ordinary `assert`/`derived_from` facts (INV-A1). Multiple discovered chains surface as a typed choice, never auto-picked (INV-A7, N5).

**Consequences.** Linkages the patent composes from separate relations are answerable, byte-identically (INV-A2), without a dispatch-time heuristic.

**Rejected alternatives.** Requiring every cross-relation linkage to be hand-declared as a single functionality (can't answer composed linkages); running the chain search at dispatch time (replica-local, irreproducible chain).

*Traceability: SPEC §5b.1 Decision (D-5b.9).*

---

## ADR-019: `same_as` node-merge is a deterministic equivalence closure with a total canonical-EID rule (D-5b.6)

**Status:** Accepted

**Context.** Native identity (EID-equality + `natural-key`) doesn't cover asserted "these are the same"; a silent class-representative pick would be non-total/replica-local (N5).

**Decision.** `same_as` is a *separate, additive* merge layer `proj` derives as a pure, total, order-independent read over the admitted `same_as` facts: compute the reflexive/symmetric/transitive **closure** (union-find over the gset); each class projects under a **total canonical EID = the class member minimum by `(namespaceId, localId)` byte-order** (`tenant` omitted because `namespaceId` is a globally-unique genesis fingerprint, so the 2-tuple is already total). A contradicting `not_same_as` surfaces a **`kip:conflict`** on a keyed correction cell canonicalized to the ordered `(min,max)` pair — never a silent merge or split.

**Consequences.** Identity merge is byte-identical across replicas with no hash-tiebreak and no LWW; the closure-vs-distinctness dispute is the one place a conflict can arise and it is surfaced (INV-A11).

**Rejected alternatives.** Folding `same_as` straight into EID-equality, or picking a class representative by insertion order / `factCID` hash (non-total, replica-local, or hash-tiebroken — the N5 silent pick).

*Traceability: SPEC §5b.1 Decision (D-5b.6); §3.4 `same_as` reducer row.*

---

## ADR-020: microagent-registration is a correction-class cell keyed on `(name, version)`, not `lww-hlc`

**Status:** Accepted

**Context.** A versioned descriptor is immutable; an `orderKey`-max silent overwrite of an incompatible descriptor would be the N5 fallback in disguise.

**Decision.** microagent-registration is a **`supersede`/correction-class** cell keyed on `(name, version)`. A byte-identical re-registration is a no-op (INV-7); two registrations of the same `(name,version)` with **divergent** manifests surface a **`kip:conflict`** (NON-commutative), never a silent LWW overwrite. A genuinely changed descriptor is published under a **new `version`**; an in-place divergence is resolved only by a dominating `resolve`-scoped supersede.

**Consequences.** Functionality descriptors are immutable per version; incompatible divergence is a hard, surfaced conflict (INV-A10), not a laundered winner. (Descriptors are advisory **selection** metadata only — never a fact-membership gate.)

**Rejected alternatives.** Treating registration as `lww-hlc` (silently total-orders contradictory scalars — the §3.4-reserved commutative-register behavior, forbidden here).

*Traceability: SPEC §5b.1 "microagent-registration" reducer bullet; §3.4 microagent-registration table row; INV-A10.*

---

## ADR-021: The autoencoding search is accelerator-class with a disjunctive budget; only the accepted loss-stamped fact is substrate (D-5b.2)

**Status:** Accepted

**Context.** Embedding `encode → decode → reconstruction-loss → learner` inside `proj` would put a non-deterministic, model-versioned, possibly-network-bound computation in the pure projection (§5.3).

**Decision.** The learner loop runs **outside `proj`** under a hard budget cap that is **total over all three axes** (`maxIterations` ∨ `maxWallMs` ∨ `maxInvocations` — **disjunctive**: the FIRST axis to cap yields `exhausted`, so the loop always terminates). Its accepted output is a signed **`kip:learn`** fact recording inputs + achieved loss; replicas fold the *result* and never re-execute the loop. The **loss is EXCLUDED from `orderKey`/reducers** (audit-only, like `rxFrom`) — the winner is chosen by ordinary author-HLC, never by loss.

**Consequences.** Byte-identical determinism preserved; replicas with different model builds don't diverge in `proj`. The accept-vs-exhausted outcome is itself accelerator-class (residual [R6](./90-open-questions.md)). See [knowledge autoencoding](./32-knowledge-autoencoding.md).

**Rejected alternatives.** Making `proj` re-run encode/decode to recompute the learned graph or its loss on demand (breaks byte-identity; model-version divergence).

*Traceability: SPEC §5b.2 Decision (D-5b.2); §5.3 accelerator boundary.*

---

## ADR-022: Acquisition is a family of privilege-equal clients emitting signed source-provenanced facts (D-5b.3)

**Status:** Accepted

**Context.** Mining/discovery/ingestion must grow the map without making an unsigned external boundary an authoritative writer or baking source-specific ETL into the core (N1/N2/N4).

**Decision.** Miner/Discoverer/Ingestor (+ RDF as an Ingestor specialization, Learner as a peer) are **microagents whose outputs the orchestrator commits as signed facts** (quarantined until trusted, deduped by EID — the patent node-merge); none mutate the graph. kip provides recall/traversal/dedup primitives, not the crawlers. The enumeration is **open** (any manifest whose output validates as an `AcquisitionResult`/binding `outputSchema` is a family member — no core change).

**Consequences.** kip stays a substrate, not an ETL engine; the acquisition path is one privilege-equal client, never a back door to authoritative writes. See [mining/discovery/ingestion](./33-mining-discovery-ingestion.md).

**Rejected alternatives.** A built-in ingestion daemon writing "trusted" graph state on import (unsigned authoritative writer, breaks §3.2; bakes ETL into core, N1/N2/N4).

*Traceability: SPEC §5b.3 Decision (D-5b.3).*

---

## ADR-023: A standalone acquisition family gets a callable `runAcquisition` seam; only the orchestrator commits its facts (D-5b.5)

**Status:** Accepted

**Context.** A sourceless (non-edge-bound) Miner/Discoverer/Ingestor/RDF agent has no contextual hop to ride.

**Decision.** §6 exposes `runAcquisition(manifest, input, opts?: { asOf? })`: the orchestrator dispatches the family microagent and commits its `AcquisitionResult.proposed` as signed facts (quarantined until trusted, deduped by EID), keeping INV-A1 intact. `opts.asOf` is the reproducibility pin ([R5](./90-open-questions.md)) — default-`now` yields a still-convergent but replica-local answer. The single dispatch decision is the **edge-bound-or-not** test (edge-bound ⇒ `runContextualQuery`; sourceless ⇒ `runAcquisition`).

**Consequences.** Sourceless acquisition is a first-class client with its own seam; the orchestrator-commits-the-facts lifecycle is identical either way. See [SDK API surface](./40-sdk-api-surface.md).

**Rejected alternatives.** Forcing every acquisition agent to be modeled as an EdgeKind-bound functionality (would require fabricating a synthetic seed/EdgeKind for a genuinely sourceless Miner).

*Traceability: SPEC §5b.3 Decision (D-5b.5).*

---

## Decisions promoted to core (no longer deferred)

The spec explicitly **promoted** two former open questions to the convergence core; they are recorded here as decisions, not open questions (see [open questions](./90-open-questions.md) for the original framing).

- **Supersession convergence (OQ-2 → core, §4b.3, C-3/C2-2)** — captured in **ADR-004/ADR-005**. The LLM decision is a recorded `supersede` fact keyed by input CIDs; concurrent contradictory supersessions surface `kip:conflict` by the default reducer, never a hash tiebreak.
- **Anti-poisoning / anti-backdating (OQ-7 → core, §4b.1, M-2/C3-1/C4-2)** — captured in **ADR-007**. Enforced inside `proj` keyed on author-HLC, with the involuntary per-key rule as the primary bound.
