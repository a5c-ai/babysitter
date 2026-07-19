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

**Consequences.** Equal received sets ⇒ equal admitted sets ⇒ byte-identical `/heads` (the SEC antecedent). Offline-first and convergence become compatible (a fact authored offline and synced late still verifies, C3-2). The cost is the DoS surface (ADR-010) and the need to move *all* trust to `proj`.

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

**Decision.** Police drift **inside `proj` with set-resident causal rules, never at the gate, never against a receiver clock**. PRIMARY: **per-key author-HLC monotonicity gated on per-key chain completeness** — `F` from `K` projects trusted only over `K`'s complete gap-free `seq` chain (else `pending`), and is demoted `untrusted-anachronistic` if `S` holds a higher-HLC non-ancestor same-key fact in that complete chain. SECONDARY (tightening): voluntary `causedBy` dominance. Plus `causedBy` well-formedness demotion (M4-2).

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

---

## Implementation decisions (ADR-B1–B8)

The ADRs above distill decisions the spec already made. The ADRs below are **new implementation decisions** for the kip-sdk build itself — how M0-M3 (and the M8 boundary) get implemented in this repo. They do not introduce new spec semantics; they choose concrete tooling/module/test conventions to realize the spec. Each is **Status: proposed**, pending human approval via a breakpoint.

---

## ADR-B1: Git substrate access layer — isomorphic-git for M0-M3 plumbing, shell-out system git only for M8 promisor mechanics

**Status:** accepted

**Context.** M0-M3 need portable, content-addressed object/tree/commit/ref plumbing that is byte-deterministic and Windows-portable (INV-12). M8 additionally needs promisor/repack mechanics (`repackExcluding`, `markPromisor`, `configurePromisorRemote`) that are obscure, native-git-specific operations.

**Decision.** Hybrid — **isomorphic-git** (pure JS) for M0-M3's portable object/tree/commit/ref plumbing; **shell out to system git (>=2.38)** only for M8's promisor/repack mechanics, behind a small **`PackAdmin`** interface, checked at `kip init`/`fsck` time.

**Consequences.** M0-M3 stay dependency-light and Windows-portable with full control over byte-determinism; the M8 boundary is isolated behind one narrow interface so the system-git dependency is opt-in and only reached by promisor/repack code paths.

**Rejected alternatives.** isomorphic-git alone (no promisor-marking API; a high-risk bet on an unverified reimplementation of obscure git internals); system git for everything (loses INV-12's byte-determinism control and reintroduces a hard system dependency for the 95% of ops that don't need it); a custom codec from scratch (multi-month reimplementation duplicating isomorphic-git's already-tested work).

**M0 implementation note (added this round):** `packages/kip-sdk/src/substrate.ts` currently hand-rolls loose-object writes (`zlib.deflateSync("blob <len>\0<content>")` under `objects/<hh>/<rest>`, hashed via `node:crypto`) INSTEAD OF isomorphic-git, because adding the dependency requires an `npm install` that remains forbidden for this implementation round (ADR-B6's zero-new-runtime-dependency policy; see ADR-B6's ADR text for the documented Linux/CI-consistent install procedure once it's actually exercised). This does not change this ADR's Accepted status or its decision — isomorphic-git remains the target for tree/commit/ref assembly in a follow-up round once the dependency can be installed from a Linux/CI-consistent environment per ADR-B6.

*Traceability: docs/22-git-substrate.md §6.2a (m7-3), §1.4-1.5 (m7-4); docs/60 INV-12; docs/80 M0-M3 vs M8 scoping.*

---

## ADR-B2: Ed25519 signing/verification — node:crypto native implementation

**Status:** accepted

**Decision.** Use `node:crypto`'s native Ed25519 (`generateKeyPairSync`/`sign`/`verify`), zero new dependency, matching `packages/trust-core/src/signing.ts`'s existing pattern exactly.

**Consequences.** A standard, well-understood operation with the dependency surface held at zero, sidestepping the Windows-lockfile-pollution risk; kip-sdk's signing code mirrors the closest sibling package's already-proven pattern.

**Rejected alternatives.** `@noble/ed25519` (strong, audited, zero-dep, but a net-new dependency when `node:crypto` already does the job and the closest sibling package already proves the pattern; its main edge — pure-JS portability to non-OpenSSL runtimes — isn't a kip-sdk requirement).

*Traceability: SPEC.md §2.4; docs/22 §2.1; packages/trust-core/src/signing.ts.*

---

## ADR-B3: Canonical payload encoding — in-house canonical JSON encoder modeled on trust-core, with a fixed version-invariant field list

**Status:** accepted

**Decision.** An in-house canonical JSON encoder modeled on `packages/trust-core/src/signing.ts`'s `canonicalize`/`deepSortKeys`/`extractFields`, adapted to SPEC §2.4's **fixed, VERSION-INVARIANT field list** (a hardcoded array per A-10, not derived from payload keys).

**Consequences.** A proven implementation pattern already exists in-repo as a template; canonical JSON keeps conformance fixtures debuggable and adds zero dependencies, while the hardcoded field list keeps the byte recipe pinned to the spec rather than to whatever keys a payload happens to carry.

**Rejected alternatives.** CBOR (new dependency, no functional gain, worse debuggability for INV-6 fixtures); custom binary TLV (pure complexity for a requirement canonical JSON already satisfies); importing trust-core's `canonicalize()` directly as a dependency (bakes in a different envelope shape and a fields-fallback pattern that doesn't match kip-sdk's fixed version-invariant list — risks silently diverging from the spec's pinned byte recipe; best used as a template to mirror, not a dependency).

*Traceability: SPEC.md §2.4; docs/22 §2.1 clause 4 (A-10); packages/trust-core/src/signing.ts:74-95.*

---

## ADR-B4: Hybrid logical clock implementation — in-house HLC module with a fully separate ChainSequencer

**Status:** accepted

**Decision.** An in-house HLC module (`HlcStamp = {wall, counter, replicaId}`) with standard `tick()`/`receiveTick()` send/receive-advance semantics, plus a fully separate **`ChainSequencer`** per `(replicaId,key)` minting the `seq` field (`seq=0` at genesis, strictly previous+1, durably persisted, never advanced by receipt, never reset by wall rollover) — two independent counters sharing no state.

**Consequences.** The shape is simple and fully spec-pinned (overflow/carry semantics, seq/hlc separation rationale); in-house gives the tight control INV-14/16/19's conformance tests need.

**Rejected alternatives.** Existing npm HLC packages (none implement kip's project-specific `seq` chain-sequencer axis, which the spec explicitly separates from HLC; importing the generic half buys little since the `seq` machinery still needs hand-rolling and the send/receive-advance logic is only a few dozen lines).

*Traceability: docs/24 §1, §1.2 (M-2), §1.2a (m7-1); docs/60 INV-14/16/19.*

---

## ADR-B5: Module/build conventions — match packages/trust-core exactly

**Status:** accepted

**Decision.** Match `packages/trust-core` exactly — commonjs, plain `tsc` build, vitest with colocated `*.test.ts` files, tsconfig ES2022/strict/composite, `types.ts`+`index.ts` barrel layout with per-concern modules (`hlc.ts`, `canonical-payload.ts`, `signing.ts`, `substrate.ts`).

**Consequences.** Identical consumption model to trust-core, keeping monorepo tooling consistent; no new build tooling to maintain.

**Rejected alternatives.** A dual ESM+CJS build via tsup/rollup (every other internal-consumption-only package in this monorepo ships CJS-only; no stated ESM/browser/standalone-publish requirement exists in M0-M3 scope; adds a bundler dependency and more Windows-lockfile-pollution surface for no current benefit).

**M0 implementation note (added round 3):** `types.ts` does not exist as a separate file — `packages/kip-sdk/src` currently has no `types.ts`+`index.ts` barrel split; every type declared by this ADR's decision (scalar/branded types, the fact envelope, `Repo`/`Tx`, the full supporting-API type catalog) lives inline at the top of `index.ts` (roughly its first 540 lines), followed by the `KipRepo` implementation and the `open()` entrypoint in the SAME file. This does not change this ADR's Accepted status or its decision — the target module layout is still "`types.ts`+`index.ts` barrel with per-concern modules", and M0 already did split OUT the per-concern modules the decision calls for (`hlc.ts`, `canonical-payload.ts`, `signing.ts`, `substrate.ts`, `chain-sequencer.ts`, `well-formed.ts` all exist as intended). Only the `types.ts` extraction step was skipped this milestone: M0's surface was built and adversarially reviewed under tight round-over-round iteration (three rounds of critic review against a single `index.ts`), and mechanically hoisting ~540 lines of type declarations into a new file at this stage would touch every export's import path for a purely organizational win with no behavioral payoff, while risking a repeat of this repo's documented directory/file-rename failure mode (relative import breakage that `build:sdk` doesn't always catch). Deferred to a dedicated follow-up task once M0's surface stabilizes past its adversarial-review cycle, rather than bundled into a round whose sole mandate was closing a critical authentication-bypass bug.

*Traceability: packages/trust-core/package.json, tsconfig.json, vitest.config.ts; root package.json workspaces + build:sdk chain (kip-sdk not yet present — scaffolding TODO).*

---

## ADR-B6: Dependency / lockfile policy — zero new runtime dependencies for M0-M3

**Status:** accepted

**Decision.** Zero new runtime dependencies for M0-M3. Reuse confirmed-present devDeps (`typescript`, `vitest`, `rimraf`, `@types/node` matching trust-core's versions). No new `npm install` needed beyond registering the new workspace member itself, which must be done from a Linux/CI-consistent environment (WSL2 or CI container), never native Windows.

**Consequences.** This repo has a documented failure mode where a Windows `npm install` pins win32 native bindings as non-optional, breaking Linux `npm ci`; ADR-B2/B3/B4 already eliminate every candidate new dependency, so M0-M3 needs no exception to this policy.

**Rejected alternatives.** `@noble/ed25519` (moot given ADR-B2; documented as a fallback procedure only — if reconsidered later, install from Linux, verify `npm ci` on both platforms, diff the lockfile for any os/cpu-scoped optional-dependency blocks pinned non-optional before committing).

*Traceability: packages/trust-core/package.json devDependencies; root package.json (kip-sdk absent from workspaces).*

---

## ADR-B7: Test layout for conformance invariants — one file per invariant under src/__tests__/conformance/

**Status:** accepted

**Decision.** One test file per invariant (including milestone sub-invariants as their own files) under `src/__tests__/conformance/`, named `inv-<id>.test.ts`, each with a single top-level `describe('INV-<id>: <verbatim short title>', ...)` block. Each milestone gets a named test-gate script (e.g. `test:conformance:m0`) running exactly its exit-criteria file set via vitest's file-glob.

**Consequences.** "Which files satisfy M0's exit gate" becomes a mechanical, greppable question matching the roadmap's own per-milestone INV-id lists.

**Rejected alternatives.** Grouping related invariants into fewer files (breaks milestone-gated structure — exit criteria are precise per-milestone INV-id lists); describe-block naming alone with no file-name binding (loses file-glob milestone selection, a weaker than compile/glob-time signal).

*Traceability: docs/60 §0 and the full INV catalog; docs/80 per-milestone Exit criteria rows.*

---

## ADR-B8: graph-QA model wiring — the production `synthesize` spawns the authenticated `claude` CLI via `node:child_process`

**Status:** accepted

**Context.** `kip ask` / `kip_ask` ship the entire read-only half for real (recall → bounded expand → hydrate → `FactId` binding → abstain-on-empty → citation validation), but the production `synthesize` default (`gentyModelSynthesize`, `src/cli/ask.ts:89-103`, bound at `:148`) is an **unconditional throw** — so the answer path can only ever exit 5. Its doc comment is accurate, not an excuse: genty exposes no in-process completion API to call. `packages/genty/core/src/microagents/runner.ts:49` does `spawn("node", [manifest.runtime.entrypoint])`, and its `completion` (`:76`) is a `{kind:'exit'|'timeout'|'error'}` union settled by `child.on("close")` (`:94`) — a **process** exit, not a model completion. Nor is there a key to call a provider with: an env grep for `ANTHROPIC|OPENAI|AZURE|FOUNDRY|GEMINI|GOOGLE_API` returns nothing; the only credential present is the Claude Code CLI's own OAuth store at `~/.claude/.credentials.json`. The stack's **only** real model access is therefore a child process running an authenticated harness CLI — `packages/adapters/codecs/src/claude-adapter.ts:42` sets `cliCommand = this.agent` (literally the `claude` binary on PATH) and `:139` `buildSpawnArgs` assembles the flags.

**Decision.** Take that **contract, not that dependency**. Replace the body of `gentyModelSynthesize` with a `harnessCliSynthesize` that spawns the already-authenticated `claude` CLI using **only `node:child_process`** — a Node builtin, exactly as genty itself does (`runner.ts:1`). kip-sdk's deps stay exactly `{isomorphic-git}`, the lockfile is untouched, and there is no `@a5c-ai/babysitter-sdk` / genty / adapters import: the AC-1 boundary and the string-specifier seam (`ask.ts:32`) both survive intact. The contract, **verified live 2026-07-17 against claude 2.1.195 at exit 0**:

```
claude -p --output-format json --model <m> \
       --json-schema '{answer, citations[{factId}]}' \
       --disallowedTools 'Bash Edit Write Read Glob Grep WebFetch WebSearch' \
       --max-turns 3          # structured output consumes 2 turns (stop_reason 'tool_use')
```

with the binary **resolved explicitly to an absolute path** (PATH order, then PATHEXT order — a bare-name spawn is wrong twice on win32: it appends only `.exe`, so an npm `claude.cmd` shim is unspawnable AND a stale `claude.exe` later on PATH silently wins; a `.cmd` shim is reached through a `cmd.exe /d /s /c` trampoline whose every argv element is VALIDATED metacharacter-free, never `shell: true`), `cwd = os.tmpdir()` (no `CLAUDE.md` auto-discovery from the target repo, no cwd-relative reach), an **allowlisted child `env`** (never a copy of `process.env`), and the rendered `{question, facts}` context on **STDIN, never argv** — the fact context is unbounded and Windows caps the command line at ~32k. (This deliberately diverges from the adapters' non-interactive branch, `claude-adapter.ts:189`, which pushes the prompt as argv.) Parsing is **two-stage**, because the payload is a JSON *string* inside the envelope: `JSON.parse(stdout)` → **gate on `exitCode === 0 && is_error === false`** → `JSON.parse(env.result)` → validate `{answer: string, citations: Array<{factId: string}>}`; anything else throws `AskSynthesisUnavailableError` (`ask.ts:41`) → exit 5. **The gate MUST NOT read `env.subtype`** — verified quirk: on auth failure the envelope is `{"subtype":"success","is_error":true,"result":"Not logged in · Please run /login"}`, i.e. *subtype says success while `is_error` is true*. Gating on `subtype` would hand that string to the citation filter and emit it **as an answer** with zero citations — precisely the N5 fabrication this design exists to prevent. `exitCode` and `is_error` are the only reliable signals, pinned by a parser test over the captured envelopes. The sentinel `runtime.model` (`microagent.json:59`, `"kip-graph-qa-default"`) is not a claude model id and must be mapped to a concrete alias, passing through only an explicit `--model` override (`ask.ts:250`). Injection is **retained as the primary override seam** — the change is strictly additive: only the DEFAULT moves from "always throw" to "try the authenticated local harness CLI, else throw the same error".

**Consequences.** `kip ask` genuinely answers, and safety is **structural rather than promised**: `Synthesize` (`graph-qa/index.ts:114`) receives only `{question, facts}` and **never the `Repo`**, so the model physically cannot write (INV-A1 by construction); `answerQuestion` never calls `synthesize` on empty retrieval (`:283-285`), so a silent graph still exits 0 with **zero model spend**; and every citation **`answerQuestion` returns** is both filtered against `usedFacts` AND **rebound to the retrieved fact** (`graph-qa/index.ts` §3.4), so a hallucinated `factId` can never surface and a real one cannot be re-pointed at an entity it is not about. **The scope of that claim is exactly `answerQuestion`** — every kip-owned dispatcher and the recommended `synthesize` injection seam route through it, so it covers `kip ask` and `kip_ask` end to end. It does NOT extend to a host that replaces the whole `DispatchMicroagentFn`, bypassing the core: that host supplies its own retrieval, so kip has no facts to rebind against. The `kip ask`/`kip_ask` MAPPING seams therefore run the same shared guard (`bindAndValidateCitations`) over a dispatcher's output for what IS checkable without the graph — the abstention invariant (absolute: it reads the answer string) and the `usedFacts` envelope filter, which closes the realistic case of a host dispatcher forwarding its own model's output. `eid` CONTENT is not re-derivable there, and the check would be self-referential in any case (a dispatcher that fabricates a citation also authors the `usedFacts` it would be validated against), so hosts holding facts should call the exported guard or use `synthesize`. (Round-2 review: before this scoping, the word "always" was simply false one layer up — both forgeries reproduced through a non-default dispatcher.) (Round-2 review: the filter ALONE did not deliver this ADR’s "cannot manufacture provenance" claim — it validated `factId` and passed the citation OBJECT through verbatim, so a model could bind a real signed `factId` to an invented `eid`/`prop`/`edgeKind`. Rebinding makes those fields a deterministic function of retrieval: the model chooses WHICH fact and never what the fact says.) The model contributes **prose only** and cannot touch `proj`/byte-identity — [§5.3 accelerator-class](../SPEC.md) holds. The costs are real and are not hidden. **Cost:** the OAuth path forces ~20k-22k cache-creation tokens of Claude Code system prompt per ask *before the question is read* — **$0.023-$0.045 observed on haiku for trivial prompts**; the documented fix (`--bare`) is empirically unusable here (see below), so this floor is unavoidable without an API key. Live asks are therefore gated behind an explicit `KIP_ASK_LIVE=1` opt-in, so a default `test:sdk` never spends and never depends on machine state. **Environment coupling, not package coupling:** kip now depends on a `claude` binary being on PATH *and authenticated* — invisible to `package.json` and to CI; it MUST degrade to the existing loud failure (exit 5), never to a guess. **Non-determinism at the seam:** the ask answer path can no longer be a byte-comparison test — deterministic suites keep injecting a scripted `synthesize`; the live test asserts structure only (`citations ⊆ usedFacts`, non-empty answer, git HEAD/refs byte-identical before/after). **Timeout:** the bundled `runtime.timeout: 30000` (`microagent.json:60`) is likely too tight — one-fact probes took 5.5s and 7.9s, so a full fact set plus process startup could produce a spurious exit-5 misread as "no model"; raise to 60-90s. **Prompt injection via graph content** is bounded but not eliminated: a hostile fact cannot write (no `Repo`) and cannot manufacture provenance (citations are filtered against `usedFacts` and rebound from retrieval, `graph-qa/index.ts` §3.4), but it can influence prose — hence `--disallowedTools`, `--strict-mcp-config` with an empty `--mcp-config`, an allowlisted child `env`, and `cwd=tmpdir`. Two bounds are stated honestly rather than overclaimed: `--disallowedTools` is a DENYLIST over an open, versioned tool namespace (it bounds the known tool surface; it is not an absolute "cannot touch a file or the network"), and a model can always decline to answer in prose — suppression is reportable, not preventable. What IS structural: the canonical abstention phrase is the substrate’s signal and is not forgeable by model output (`abstained === (answer === ABSTENTION_ANSWER)` always), so a hostile fact cannot make a populated graph report `status:"answered"` while carrying the unanswerable phrase. Testability: probe `claude --version` (exit 0) plus `ANTHROPIC_API_KEY` or `~/.claude/.credentials.json` — the adapters' own `authFiles` pattern (`claude-agent-sdk-adapter.ts:189`/`:483`) — and skip via `ctx.skip(reason)` (confirmed on vitest 4.1.6 to report `Tests 1 skipped (1)`, never a silent pass). **The load-bearing rule: the probe decides skip; everything after the probe decides pass/fail.** Once the probes pass, any model failure (exit≠0, `is_error`, unparseable envelope, bad payload shape) **FAILS** — never catch-and-skip, which is the exact move that lets a real regression masquerade as "environment not available" forever.

**Rejected alternatives.** **(b) A direct provider API call** (`@anthropic-ai/sdk` or hand-rolled fetch) — two hard blockers: no credential exists to call with (only the CLI's OAuth store, which is not an API key), and an SDK client is a new runtime dependency while a fetch still needs the key; empirically confirmed by the `--bare` result below — strip the OAuth path and there is **no** model access at all. **(c) Reusing an adapters module programmatically** (`@a5c-ai/adapters-codecs` `buildSpawnArgs` + `@a5c-ai/comm-adapter` spawn-runner) — correct-looking but dep-prohibitive *and* transport-mismatched: codecs deps `@a5c-ai/atlas`, `@a5c-ai/comm-adapter`, `@anthropic-ai/claude-agent-sdk`, `ws`, and comm-adapter drags four more, into a package whose **entire** dep set is one library (exactly the ADR-B6 lockfile-pollution rule); and the adapters path is a long-lived streaming session engine (`claude-adapter.ts:148-151` hardcodes `--output-format stream-json --verbose --include-partial-messages`, consumed by `startSpawnLoop`, `adapters/core/src/spawn-runner.ts:37`/`:107`) — the wrong transport for one blocking call. Its value here is as a **documented reference for the invocation contract**, not a linked module. **(d) Host-injected `synthesize` only (status quo)** — not rejected as *wrong*: it is correct and is **retained** as the primary programmatic seam (it is what the deterministic suites inject, and what an embedding host with its own model should use). It is rejected only as the answer to *this* goal — it guarantees the CLI can never do anything but exit 5 on the answer path. **(a-alt) `codex exec` instead of `claude -p`** — viable and kept as a documented secondary (its help confirms stdin transport and `-m/--model`), but it has no `--json-schema` equivalent, so it needs prose-fencing + brittle extraction; prefer claude, fall back only where a host lacks it. **(a-variant) `claude -p --bare` to cut the ~20k-token overhead** — **empirically broken here and must not be used**: `--bare` restricts auth to `ANTHROPIC_API_KEY`/`apiKeyHelper` and never reads OAuth, so it returns `{"is_error":true,"result":"Not logged in · Please run /login"}` at exit 1, versus the identical call *without* `--bare` returning `"result":"OK"` at exit 0.

*Traceability: docs/design/kip-graph-qa.md §3.3 (prompt the model — `runtime.model`), §3.4 (bind & validate citations — the rebinding this ADR relies on for "cannot manufacture provenance"), §5 (determinism & provenance stance), §6.1 (the abstention sentinel is the substrate's), §6.6 (dispatch failure → exit 5, N5); docs/design/kip-cli.md §5.3 + AC-28 (model selection — reconciled with this ADR's sentinel mapping: the resolution is REPORTED, so nothing is SILENTLY substituted); SPEC.md §5.3 accelerator boundary; docs/60 INV-A1; ADR-021 (accelerator-class, model results never re-run in `proj`); ADR-B6 (zero-new-runtime-dependency / lockfile policy — satisfied: `node:child_process` is a builtin); packages/kip-sdk/src/cli/ask.ts:32/:41/:89/:148/:250; packages/kip-sdk/src/graph-qa/index.ts:114/:283/:290/:295; packages/kip-sdk/src/cli/microagents/graph-qa/microagent.json:59-60; packages/adapters/codecs/src/claude-adapter.ts:42/:139/:189; packages/adapters/codecs/src/claude-agent-sdk-adapter.ts:189/:483; packages/adapters/core/src/spawn-runner.ts:37/:107; packages/genty/core/src/microagents/runner.ts:49/:76/:94.*

---

## ADR-B9: The code-analysis Miner reuses the existing `runAcquisition` seam — no new write path

**Status:** proposed *(pending an owner decision gate)*

**Context.** A code-analysis Miner must grow the graph from a repository scan without becoming an authoritative writer or baking source-specific ETL into the core (ADR-022/ADR-023, D-5b.3/D-5b.5, N1/N2/N4). The substrate already has a complete, privilege-equal acquisition lifecycle: `Repo.runAcquisition(manifest, input, opts?)` (declared `types.ts:1200`; impl `kip-repo.ts:4580`) dispatches the named family microagent **exactly once** via the injectable `this.dispatchMicroagent` seam (`kip-repo.ts:4637`, type `DispatchMicroagentFn` `types.ts:785`), validates the `MicroagentResult` (non-zero exit → `ERR_MALFORMED_INPUT` `kip-repo.ts:4642`; `outputSchema` `kip-repo.ts:4650`; `isAcquisitionResultShape` `kip-repo.ts:4659`), guards control-plane targets (`ERR_ACQUISITION_TARGET_FORBIDDEN` `kip-repo.ts:4679`), commits `proposed` then `sameAs` in one kind-preserved transaction (`kip-repo.ts:4720-4769`), stamps `AcquisitionResult.source` as `provenance.source` on every fact (`kip-repo.ts:4697`), and returns `{facts: FactId[]}` in order (INV-A1/INV-A10, `kip-repo.ts:4773`).

**Decision.** Do **not** invent a new write path — ride the existing `runAcquisition` seam. BUILD three things and change one core line (ADR-B9c): (1) a bundled `MicroagentManifest` `code-miner@1.0.0` under `src/cli/microagents/code-miner/microagent.json`, copied to dist by `scripts/bundle-microagents.cjs`, resolved like `resolveQaManifest` (`ask.ts:1140`); (2) a `codeMinerDispatch: DispatchMicroagentFn` (new module `src/miner/code-miner.ts`) reading input `{repoDir, gitSha?, include?, exclude?}` and returning `{exitCode: 0, output: AcquisitionResult}`; (3) a thin `kip index <path>` CLI command that registers the manifest and calls `runAcquisition`. The miner **never holds write seams** (INV-A1) — the orchestrator re-stamps `replicaId` + Ed25519 signature on every committed fact (`kip-repo.ts:4695`). Sub-decisions ADR-B9a/b/c fix the tool strategy, fact schema, and CLI surface + the one required core change.

**Consequences.** Code acquisition becomes one more privilege-equal member of the open acquisition family — no core semantics change, the orchestrator-commits-the-facts lifecycle is identical to every other acquisition agent, and INV-A1 holds by construction (the miner is a pure client, never the substrate).

**Rejected alternatives.** (a) A built-in ingestion daemon writing trusted state directly (breaks INV-A1 / the authority guard, D-5b.3, docs/33:92). (b) Modeling the miner as an `EdgeKind`-bound contextual functionality (a repo scan is sourceless; the standalone family has its own `runAcquisition` seam, docs/33:94-96). (c) Adding a static-analysis library dependency such as tree-sitter/ts-morph (violates ADR-B6's zero-new-dependency + Windows-lockfile rule; precise parsing is delegated to probed external binaries instead). (d) Having the miner subprocess open the repo for writing or call `assertFact` itself (breaks INV-A1; the orchestrator re-stamps `replicaId` + signature, `kip-repo.ts:4695`).

*Traceability: SPEC §5b.3 Decision (D-5b.3/D-5b.5); ADR-022/ADR-023; docs/60 INV-A1/INV-A10; docs/33-mining-discovery-ingestion.md:92/94-96; packages/kip-sdk/src/types.ts:785/1200; packages/kip-sdk/src/kip-repo.ts:4580/4637/4642/4650/4659/4679/4695/4697/4720-4769/4773; packages/kip-sdk/src/cli/ask.ts:1140.*

---

## ADR-B9a: Tool strategy — git + node builtins are guaranteed; `rg`/`tokei`/`scc`/`cloc`/`ast-grep`/`tsc`/`eslint` are probed-and-skipped (never guessed)

**Status:** accepted *(owner approved; round-2 reconciliation below)*

**Context.** The miner must run deterministically and portably (including on Windows), yet richer metrics want external accelerators that may or may not be installed. A missing tool must never be filled in with an estimate (N5 — emit nothing, surface the skip).

**Decision.** Two tiers. **GUARANTEED** (no spawn, deterministic): the git HEAD sha + tracked-file set read **synchronously via `node:fs`** from the on-disk `.git` (HEAD/refs/`packed-refs` for the sha, the DIRC `index` for the tracked set — see the reconciliation note), `node:fs` walk/read, regex import/require/export extraction, extension + shebang format detection, newline LOC (guaranteed — computed from the already-read bytes, so present with ZERO external tools), and a git-blob-style `content` `BlobRef` per module (ADR-B9b). **PROBED-and-skipped**: `rg`/`tokei`/`scc`/`cloc`/`ast-grep`/`tsc`/`eslint` — resolved via exported `resolveOnPath` (`ask.ts:221`), probed `<bin> --version` via `probeVersionOf` (`ask.ts:547`) returning a `HarnessCliProbe`, spawned via `buildHarnessSpawn` (Windows `.cmd` trampoline, `ask.ts:448`) with `buildHarnessEnv` (`ask.ts:356`), under timeout + output cap. Each probed extractor is scoped to the tracked file set (the analyzed module set), and a tool whose clean result is a non-zero exit (ripgrep exits 1 on zero matches) is read as that empty result, not a failure. An absent/failed tool omits **only** its own metric facts, reported not guessed (N5). External tools are behind an opt-in env gate `KIP_INDEX_TOOLS` (mirroring `KIP_ASK_LIVE`).

**Reconciliation note (round-2 finding #2 — isomorphic-git deviation).** An earlier draft of this decision nominated **isomorphic-git** for the guaranteed HEAD-sha + tracked-file read. The frozen acceptance contract, however, pins `buildCodeMinerResult` as **synchronous** (the tests destructure its result without `await`), and isomorphic-git's API is async-only, so it cannot satisfy the synchronous fact-building contract. The guaranteed tier therefore reads `.git` state **synchronously via `node:builtins`** (`node:fs`): `.git/HEAD` → refs/`packed-refs` for the sha, and the `.git/index` DIRC v2/v3 record for the tracked set (git's authoritative staged set, needing no object inflation so it works on packed repos). This is the honest, contract-preserving choice; **isomorphic-git remains a `package.json` dependency, available for other (async) uses** — it is not removed. SHA-256 (32-byte oid) indexes are out of scope and rejected loudly (N5), never mis-parsed under the SHA-1 stride.

**Determinism (honest scope — round-2 finding #8).** File content is read from the **working tree**, while facts are anchored to `@<gitSha>` (resolved from HEAD, or taken verbatim from `--git-sha`) WITHOUT verifying that sha against the bytes actually read. The guarantee is therefore **per-run byte-identity over identical on-disk state**: two runs over the same on-disk repo state emit a byte-identical candidate set, and a re-index dedups by path-derived EID. It is deliberately NOT the stronger claim that the facts provably reflect the committed tree at `gitSha` — a dirty working tree or a mismatched `--git-sha` is not detected; the `code-resource://<repoId>@<gitSha>` uri is a reproducibility ANCHOR, not a verified content hash. The probed accelerator set adds a second axis (present-tool set), so the full output is `f(on-disk state, resolved-tool set)`.

**Consequences.** The guaranteed tier always produces a byte-stable core scan on any platform with no spawns; the accelerator tier adds metrics only when its tool is actually present, and the resulting graph is a pure function of the on-disk state and the resolved tool set — a machine without `tokei` simply has no `tokei`-derived facts, never fabricated ones.

**Rejected alternatives.** Assuming bash/coreutils are present (the miner runs on Windows); hard-requiring `rg`/`tokei` (must degrade, not fail); estimating a metric when its tool is absent (N5 — emit nothing and surface the skip); isomorphic-git for the guaranteed read (async-only, cannot satisfy the synchronous `buildCodeMinerResult` contract — see the reconciliation note; kept as a dependency for other uses).

*Traceability: docs/60 N5; ADR-B6 (zero-new-dependency / Windows-lockfile policy); ADR-B8 (probe-decides-skip / everything-after-probe-decides-pass); packages/kip-sdk/src/cli/ask.ts:221/:356/:448/:547; packages/kip-sdk/src/miner/code-miner.ts.*

---

## ADR-B9b: Fact schema — `code:`-namespaced nodes/edges/props with deterministic path-derived EIDs and `code-resource://` git-sha provenance

**Status:** accepted *(owner approved; round-2: the `content` `BlobRef` prop is now implemented)*

**Context.** The miner emits `AssertInput`s only; schema targets are FORBIDDEN for acquisition (`kip-repo.ts:4679`), and re-indexing the same repo must dedup rather than duplicate. `NodeKind`/`EdgeKind` are free strings (`types.ts:26`), so no ontology registration is needed or allowed.

**Decision.** Emit `code:`-namespaced node/edge/prop `AssertInput`s only, with **deterministic path-derived EIDs** (`types.ts:14`) so a re-index dedups by EID (docs/33:69). **nodeKinds:** `code:repo`, `code:module` (a file; EID = git-relative path), `code:package`, `code:symbol` (path#symbol). **edgeKinds:** `code:contains`, `code:imports` (with a `spec` prop for the unresolved specifier), `code:exports`, `code:depends_on`, `same_as` (authored by `runAcquisition`), and `derived_from` (reserved). **Provenance:** `source.uri = code-resource://<repoId>@<gitSha>` (the EID-dedup + reproducibility anchor; `source` is only `{uri, cid}`, `types.ts:169`); `author` = the miner agent id + version; frontier on HLC plus advisory `resolvedAsOf` (`types.ts:196`); `replicaId` + Ed25519 re-stamped by the orchestrator; file content carried as a guaranteed **`content` `BlobRef` node-prop per module** (`types.ts:87`) — a git-blob-style SHA-1 (`sha1("blob "+len+"\0"+bytes)`) content address computed from the read bytes with no external tool (round-2 finding #3, implemented in `code-miner.ts`); a guaranteed **`linesOfCode` node-prop per module** (newline count); and **each accelerator metric prop that came from an actual spawn is paired with a `<metric>Tool` prop** recording which binary produced it (the guaranteed-0 empty-tracked-set fast path invokes no binary, so it carries no companion — round-3). Multiple tools that count into the SAME repo-node metric cell (tokei/scc/cloc all → `linesOfCode`) are resolved **first-available-wins**: the first present tool writes the cell, the rest loud-skip with `skipped:<tool> = "<metric> already provided by <tool>"`, so no probed metric is silently overwritten (round-3). On win32 a tracked path bearing a cmd metacharacter loud-skips with a miner-attributed `skipped:<tool> = "unsafe path for argv on win32: <path>"` reason (never ask.ts's claude-CLI message — round-3).

**Consequences.** Identity is a pure function of the repo path, so re-indexing an unchanged tree is a signed `same_as`-dedup, not a duplicate; provenance is a reproducible content anchor tied to the exact git sha; and every accelerator-derived metric is self-describing (its `<metric>Tool` companion records the source), so a metric can never be silently mistaken for a guaranteed-tier fact.

**Rejected alternatives.** Registering a code ontology via schema facts (`ERR_ACQUISITION_TARGET_FORBIDDEN`); a bespoke provenance sub-object (`source` is only `{uri, cid}`); an in-place rewrite on re-index (the substrate is append-only — dedup by EID plus a signed `same_as`, never mutation).

*Traceability: docs/60 INV-A1; docs/33-mining-discovery-ingestion.md:69; packages/kip-sdk/src/kip-repo.ts:4679; packages/kip-sdk/src/types.ts:14/:26/:87/:169/:196.*

---

## ADR-B9c: CLI surface `kip index <path>` — and the ONE required core change (thread `dispatchMicroagent` through `open()`)

**Status:** proposed *(pending an owner decision gate)*

**Context.** The acquisition lifecycle is fully built, but there is a latent core gap: `open()` currently drops `dispatchMicroagent` when constructing `KipRepo` (`kip-repo.ts:6116`) even though the constructor accepts it (`kip-repo.ts:542/567`) — so `runAcquisition` would hit the always-succeeds stub (`kip-repo.ts:456`) and fail `ERR_MALFORMED_INPUT`. The miner is otherwise a pure CLI-surface + manifest + dispatch-fn addition.

**Decision.** Add `kip index <path> [--include <glob>] [--exclude <glob>] [--git-sha <sha>] [--json]`: a `case "index"` in the `runCli` switch (`cli/index.ts:132`) plus a `USAGE` entry (`cli/index.ts:82`); `resolveRepo` with `requireKeyring: true` (`cli/index.ts:242`); resolve + **idempotently register** the bundled manifest (`types.ts:1192` `registerFunctionality`, else `ERR_UNREGISTERED_MANIFEST` `kip-repo.ts:4603`); call `runAcquisition`; print `{facts}`. **MUST-FIX CORE GAP (the one required core change):** thread an optional `dispatchMicroagent` through `OpenOptions` (`types.ts:346`) → `open()` → `new KipRepo`, and expose it on the CLI options exactly like the existing `ask` dispatch seam (`cli/index.ts:64`). **Isolation:** the manifest declares `isolation: "subprocess"` + `runtime {entrypoint, tools: ["kip-read", "static-analysis"], timeout}` (`types.ts:717-736`); tools/scripts/processes are ADVISORY — `runAcquisition` reads only `name`/`version`/`outputSchema`/`runtime.timeout`. At M7 the `DispatchMicroagentFn` seam is what actually runs; isolation is NOT an enforced sandbox (same as graph-QA). kip enforces isolation **structurally** — the miner never receives write seams (INV-A1) — not via the enum. **Testability:** deterministic tests inject a scripted `DispatchMicroagentFn` returning a canned `AcquisitionResult` (`fixtures-m7.ts`) and assert ordered commit + provenance + EID-dedup on re-index + git-HEAD-unchanged; the external-tool layer is live-gated on opt-in (`KIP_INDEX_TOOLS`) like graph-qa-live, asserting structure only because it is accelerator-class (§5.3). Every failure path asserts a typed error or a recorded skip-reason, never a fabricated fact.

**Consequences.** `kip index` genuinely acquires code facts through the same signed, orchestrator-committed lifecycle as every other acquisition agent; the single `open()` change closes the only gap that would otherwise route `runAcquisition` into the always-succeeds stub; and the deterministic-inject / live-opt-in split keeps `test:sdk` byte-stable and spend-free while still exercising the accelerator tier under an explicit gate.

**Rejected alternatives.** (Sub-decision scoped to wiring — no design alternative beyond the ADR-B9 rejections.) Leaving `open()` as-is is not viable: it silently defeats `runAcquisition` for every acquisition CLI surface, not just `kip index`.

*Traceability: SPEC §5.3 accelerator boundary; docs/60 INV-A1; ADR-B7 (conformance test layout); ADR-B8 (deterministic-inject + live-opt-in pattern); packages/kip-sdk/src/kip-repo.ts:456/:542/:567/:4603/:6116; packages/kip-sdk/src/types.ts:346/:717-736/:1192; packages/kip-sdk/src/cli/index.ts:64/:82/:132/:242.*
