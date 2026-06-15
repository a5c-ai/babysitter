# Adversarial Red-Team Review — `@a5c-ai/kip-sdk` SPEC v1 (iter-1)

> Reviewer stance: ruthless, specific, break-it. Every finding quotes the offending text,
> says why it fails, classifies CRITICAL / MAJOR / MINOR, and gives a concrete fix direction.
> The spec is well-written and internally confident; that confidence is exactly the problem —
> several "resolved" / "provably convergent" claims are **hand-waved**, and the load-bearing
> SEC theorem is **not sound as stated**. The context-management layer (the whole point) is
> being built on top of these claims, so a wrong convergence claim is a foundational defect,
> not a footnote.

---

## CRITICAL findings

### C-1. The SEC theorem is unsound: `lww-hlc` over a **valid-time-clipping fold** is not commutative/associative

**Location:** §3.4 ("Default strategy `lww-hlc`… This is associative/commutative/idempotent because
HLC induces a total order on facts"), §4.2 ("overlapping concurrent asserts are reconciled by the
cell's merge strategy (default `lww-hlc` keeps the HLC-max, **clipping the loser's interval**)"),
§4b.4 Theorem + Sketch step (2).

**Why it fails.** The theorem's soundness rests on "per-cell fold is a deterministic function of the
fact-set… using a total order (HLC+replicaId) and an ACI merge strategy." But the cell is **not** a
single scalar under LWW — §4.2 defines the cell as a **partition of valid-time into intervals**, and
the fold **mutates the geometry of other facts' intervals** ("clipping the loser's interval"). Interval
clipping is *not* a pairwise ACI lattice join:

- A scalar `lww-hlc` (`merge(a,b) = max_hlc(a,b)`) is genuinely ACI — fine.
- But "keep HLC-max **and clip the loser's valid interval**" is a function of *which other intervals
  exist and in what valid-time positions*. Clipping fact B because fact A overlaps it, then later
  receiving fact C that overlaps both, does **not** decompose into pairwise merges. The result depends
  on the *set geometry*, and the spec never proves the geometric reduction is order-independent. It
  asserts it ("the partition is the same on every replica") without sketch.

Concretely: three concurrent asserts on the same (eid,prop) with valid intervals
`A=[0,10) hlc=3`, `B=[5,15) hlc=2`, `C=[8,12) hlc=1`. Pairwise "max-hlc-clips-loser" gives different
partitions depending on whether you fold (A⊕B)⊕C vs A⊕(B⊕C), because clipping B against A changes
what C overlaps. The spec's own §4.2 invariant ("no gaps/overlaps") is the thing that breaks: clipping
can leave a gap that a different fold order fills. **The G-Set union converges (that part is true), but
the *projection* of the union into `/heads` — which is what the theorem claims is byte-identical — does
not, unless the fold is specified as a pure function of the whole fact-set with a deterministic interval
resolution algorithm.**

The spec conflates two different claims and proves only the easy one:
1. "Replicas hold the same fact-set" — TRUE (G-Set union is ACI). Sketch step (1) is sound.
2. "Replicas compute byte-identical `/heads`" — **NOT ESTABLISHED**. Sketch step (2) hand-waves "equal
   fact-sets ⇒ equal cells" by treating the cell as a scalar lattice element, which §4.2 contradicts.

**Fix direction.** Re-specify the fold as a **deterministic total function over the entire fact-set for
a cell**, not a pairwise `merge(a,b)`. Define a canonical algorithm: (a) take all non-retracted asserts
for the cell sorted by HLC total order; (b) compute the valid-time arrangement (sweep-line over interval
endpoints); (c) at each elementary valid-time sub-interval, the winning value is the HLC-max assert whose
interval covers it. This is order-independent **by construction** because it is a pure function of the
set, and it must be stated that way. Then `MergeStrategy.merge(base,a,b)` as a *binary* signature
(§3.4) is the **wrong interface** — it cannot express set-geometry resolution and should be replaced with
`fold(cell, facts: Fact[]): CellState`. Until this is fixed, INV-2/INV-3/INV-4 are testing a model the
spec doesn't actually define.

---

### C-2. The binary `MergeStrategy.merge(base, a, b)` interface is structurally unable to support the convergence claim, and the ACI conformance test is the wrong test

**Location:** §3.4 (`interface MergeStrategy { merge(base: V | undefined, a: Cell<V>, b: Cell<V>): MergeResult<V> }`),
§8.4 INV-3 ("property-tested over generated cell triples"), §7 ("Custom strategies MUST satisfy ACI").

**Why it fails.** A binary merge `merge(base,a,b)` only yields an order-independent global fold **if the
operation forms a semilattice** (ACI). The spec demands custom strategies be ACI and "rejects non-ACI
strategies" via property testing on triples. But:

1. **ACI on triples is necessary but not sufficient** for global convergence when the fold also clips
   intervals (C-1) — the binary op is no longer the real reconciliation function, so testing the binary
   op proves nothing about the actual `/heads`.
2. **`set-union` and `counter` are not LWW and interact badly with `retract`.** A grow-only set under
   union is ACI, but the spec also supports `retract` facts (§4.1) that *remove* a member. A G-Set with
   removes is no longer a G-Set; you need an OR-Set with tombstones and unique tags, which the cell
   model (`assertedBy: FactId`, single `value`) does not carry. The spec literally calls the log
   "OR-Set without removal" (§4b.2) yet defines `retract` as a first-class fact type that removes. **An
   OR-Set *without* removal that nonetheless supports removal is a contradiction.** Counter under
   concurrent retract/re-assert is even worse — there is no PN-Counter structure specified.
3. **`base` is passed but its provenance is undefined.** In a true 3-way merge `base` is the merge-base
   commit's value, but with a grow-only fact-set there is no single "base value" — the base cell is
   itself a fold. Passing one scalar `base` discards the base's own multi-interval structure.

**Fix direction.** Either (a) restrict custom strategies to **true scalar CRDT lattices** (LWW-register,
G-Counter, PN-Counter, OR-Set with explicit tags) and forbid them from touching valid-time geometry
(geometry handled by the core fold of C-1), or (b) define the merge as `fold(facts) → CellState` and
make ACI conformance test the **fold over random permutations of the full fact multiset**, not triples.
Specify OR-Set tagging for `set-union` (each member tagged by asserting FactId; retract carries the tag
set it removes). Without this, INV-3 gives false confidence.

---

### C-3. Semantic supersession is order-sensitive and the "always converges mechanically" claim does not survive it — replicas *can* diverge

**Location:** §4b.3 table ("Semantic (supersession) … possibly LLM, possibly order-sensitive … Emitted
*as new facts* … Once emitted, they re-enter the substrate and converge mechanically"), §4b.3 "Key
invariant," §1 Thesis ("supersede semantically above it"), OQ-2.

**Why it fails.** The claim is: even order-sensitive LLM supersession is safe because it only *emits*
new immutable facts, which then converge mechanically. This is sleight of hand. Convergence of the
*fact-set* is preserved, but **the content of the emitted facts depends on the order in which the
deciding replica saw the inputs.** Two replicas that each run their own supersession pass over the same
underlying facts in different delivery orders will **emit different corrective facts** (different
`retract`+`assert` pairs, different `validTo` clip points, possibly contradictory invalidations). Those
divergent corrective facts then both enter the substrate. The substrate converges on the *union* of
both replicas' contradictory corrections — i.e. both replicas end up holding **both** corrections, and
the `/heads` fold now has two concurrent `retract`/`assert` cells that produce a `kip:conflict` node or
an arbitrary HLC-tiebroken winner.

So "the substrate's convergence is therefore never at the mercy of the semantic layer's heuristics" is
**false in the sense that matters**: the *bytes* of `/heads` (which the SEC theorem promises are
identical) are now a function of which replicas ran supersession and in what order. The mechanical layer
converges on a *garbage-in superset*; it does not give you a single agreed semantic state. For a
**context-management layer that synchronizes agent contexts** (§4c), this means two agents can believe
contradictory things and the system has no mechanism to reconcile, only to surface a conflict node that
nobody resolves.

**Fix direction.** Make supersession **deterministic and replica-idempotent or single-writer**. Options:
(a) Only a designated replica (or main/trunk) may run supersession passes, so corrective facts have a
single author — gives convergence at the cost of coordinator-freedom (contradicting §4b "coordinator-
free"). (b) Make supersession a **pure function of fact CIDs** (no LLM in the deciding path, or LLM
output content-pinned and keyed by input CID set so re-runs are no-ops and all replicas derive the same
correction — the spec already wants this for consolidation in §4.4 "keyed by source CIDs," but does NOT
apply it to supersession). The spec must pick one and state the convergence guarantee **for the semantic
layer**, not just the substrate. As written, the headline thesis is not delivered.

---

### C-4. Excision breaks content-addressing, `as-of` reproducibility, and the SEC theorem — and the spec admits it only halfway

**Location:** §4.5 ("Excision … physically removes fact blobs from git history (filter-repo /
replace-object rewrite) … propagated to replicas as an excision marker so they excise the same CID"),
§3.5 ("the old fact blobs become GC-eligible"), §8.4 INV-6 / INV-9 ("excision preserves verifiability";
"gc/repack/rollup never change query results for any `asOf` *not excised*"), §4b.4 Theorem.

**Why it fails (multiple):**

1. **History rewrite changes every descendant commit hash.** filter-repo/replace-object rewrites the
   commit DAG; every commit after the excised fact gets a new CID. The spec's `as-of` is "pick the
   commit whose HLC tip ≤ txTime (commit DAG binary search)" (§4.3) and `SnapshotRef`/`pin` returns a
   ref to a commit (§4c). After excision, **every pinned snapshot ref and every `asOf` that resolved to
   a post-excision commit is dangling or now points at different content.** INV-9's escape hatch ("for
   any asOf *not excised*") is doing enormous undisclosed work — in a rewritten history, *every* commit
   downstream of the excised fact is "excised" in the sense of having a new hash. The spec never says
   pins must be rebased or that downstream commit identity is unstable.

2. **The SEC byte-identical claim is incompatible with per-replica excision races.** Replica A excises
   fact F and rewrites; replica B has not yet processed the excision marker and still holds F. During
   the window, `/heads` differ (B's fold includes F). The theorem says "delivered the same set of facts
   S ⇒ byte-identical" — but excision is a *removal* from S, and the marker-based propagation is
   eventually-consistent, so there is a divergence window the theorem does not cover. Worse: if F was
   load-bearing for a cell's interval partition, B's `/heads` is not just "has extra fact" but
   *structurally different* after fold.

3. **Excision marker carries "the CID of the removed fact" — which is exactly what GDPR forbids
   retaining as a linkage if the CID is derived from PII content.** `FactId = CID of the canonical fact
   payload` (§4.1). A content hash of a payload containing personal data is, under GDPR/EDPB guidance,
   potentially personal data itself (it's a stable pseudonymous identifier linkable back if the content
   space is small or known). The spec claims the marker "proves *that* something was removed without
   revealing *what*" — a hash of the removed PII does not robustly satisfy that for low-entropy content
   (e.g. excising "user X lives at <address>" — the CID is a fingerprint of the exact string).

4. **Signatures.** §4.5 claims "removing a fact does not invalidate others" because "each fact is
   self-signed." True for the *fact blobs*, but **commit signatures / trailers** (`commit trailers:
   Kip-Fact-Id, Kip-HLC, Kip-Sig-Fpr`, §3.2) and any signed commit objects are invalidated by the
   rewrite, and `/heads` blobs that *folded in* the excised fact's value are now lying (they still
   contain content derived from the excised fact unless re-folded). INV-6 only checks fact signatures,
   not head consistency post-excision.

**Fix direction.** (a) Specify that excision **re-folds and rewrites `/heads`** so no residue of excised
content survives in the materialized projection (currently unstated and contradicts "self-contained
heads"). (b) Specify pin/snapshot **rebasing** semantics after excision, or make pins content-address
the *fact-set* rather than a commit CID so they survive rewrite. (c) Use a **non-content-derived random
nonce** as the excision marker id (or a salted HMAC) so the marker is not a fingerprint of the erased
PII. (d) Bound the SEC theorem explicitly to "the non-excised fact-set, after excision markers have
propagated" and define the divergence-window behavior. (e) State that commit-level signatures must be
re-applied by the excising actor after rewrite. As written, excision silently violates four invariants.

---

### C-5. EID is author-assigned and trusted — cross-replica EID collision / forgery / hijack is unspecified, enabling cross-tenant identity takeover

**Location:** §3.6 ("EID (entity id) = author-assigned stable string … validated by the kind's
`IdentityPolicy`"), §2 Terminology ("Stable, author-assigned identity"), Equality decision ("two graph
references are the same entity iff equal EID"), §8.1 ("withScope … prefixes EIDs").

**Why it fails.** Identity equality is "iff equal EID," and EIDs are **author-assigned strings**. There
is no specified binding between an EID and the key/actor allowed to assert facts about it. Consequences:

1. **EID hijack / identity forgery.** Replica B (a different, possibly malicious or compromised agent)
   asserts a signed fact targeting `eid: "node:person/ada"` with a *different* value. The signature is
   valid (B has a trusted key — see C-6), the fact is accepted, and because equality is "iff equal EID,"
   B's fact now folds into Ada's node head and can win under `lww-hlc` (just publish with a higher
   wall-clock or counter). One trusted-but-low-privilege agent can overwrite **any** entity's
   properties. The spec has no concept of "who owns/may write this EID."

2. **EID collision across replicas is silent and merges them.** Two replicas independently create
   `node:concept/auth` meaning different things (one means authentication, one means authorization) —
   "merge of same-EID different-CID" is exactly the case the prompt flags. The spec's answer (§3.6) is
   that same-EID = same entity, so the fold **merges two semantically distinct entities into one
   conflicting head**. `IdentityPolicy` "natural-key / UUID / content-hash-seeded-then-frozen" is
   mentioned but never specified to *prevent* collision, and a "natural-key" policy *guarantees*
   collisions (two people named Ada).

3. **Cross-tenant leakage via EID prefix forgery.** §8.1 says scope "prefixes EIDs" and "cross-tenant
   reads require explicit grant facts." But if EID is an author-assigned string and a fact just *carries*
   its target EID, a malicious author in tenant A can assert a fact whose EID is prefixed for tenant B
   (`node:tenantB/secret`). Nothing in the fact envelope (§4.1 `Target`) binds the asserting key to the
   scope prefix. Scope is presented as a read-side lens, with no write-side enforcement that an actor
   may only mint EIDs within its own scope.

**Fix direction.** Specify an **EID authority model**: an EID's namespace must be cryptographically
bound to an owning key/scope (e.g. EID = `scope/kind/<authority-fingerprint>:<localname>` or a
capability/grant fact that authorizes a key to write a given EID namespace). Define the merge rule for
"same EID asserted by keys from different authorities" (reject, or conflict-node, never silent merge).
Specify that `withScope` **gates writes**, not just reads, and that EID prefixes are validated against
the asserting key's authorized scopes at `assertFact`. This is a security-critical gap for any
multi-tenant / multi-agent deployment — currently identity is forgeable.

---

### C-6. Trusted-key model has no revocation, no per-scope authorization, and temporal key validity is underspecified — key compromise is unrecoverable without rewriting immutable history

**Location:** §2.4 / §7 ("verify signatures against `refs/kip/keys/trusted` (with temporal key
validity)"), §3.1 (`kip/keys/trusted # trusted Ed25519 pubkeys + validity windows`), PRIOR-ART 1.3
("checks key expiry against signedAt").

**Why it fails.**

1. **No revocation story.** A compromised key can have signed thousands of valid facts. The only
   erasure mechanism is excision (C-4), which is per-fact and history-rewriting. There is no
   "distrust key K as of HLC T, invalidate all facts it signed after T" operation. Because facts are
   immutable and signature-valid, a compromised-key fact remains *verifiable* forever — verifiability
   is not the same as trustworthiness, and the spec conflates them ("replicas only converge over facts
   they can verify," §7).

2. **Temporal key validity vs HLC vs valid-time is a contradiction waiting to happen.** Key validity is
   checked against `signedAt` (PRIOR-ART) / presumably `txFrom`/HLC. But HLC `wall` is attacker-
   controllable on a compromised replica (the writer stamps its own HLC). A compromised key can backdate
   `wall` to fall **inside** its validity window even after it's been expired/revoked, and can backdate
   `validFrom` into the past (§4.1 "MAY be in the past") to forge historical facts ("Ada always worked
   at EvilCorp"). The spec explicitly allows past-dated facts and self-stamped HLC, which together
   defeat temporal key validity.

3. **No per-scope key authorization.** `refs/kip/keys/trusted` is a flat global trust set. Any trusted
   key can sign facts for any scope/EID (compounds C-5). Multi-tenant isolation requires keys scoped to
   tenants.

4. **`refs/kip/keys/trusted` is itself synced data with no specified merge/authority.** Who may add a
   key to the trusted set? If it's just another ref that syncs, then any replica that can push can add a
   trusted key and self-authorize forgery. The root-of-trust is unspecified.

**Fix direction.** Add: (a) **revocation facts** (`kip:revoke-key` with effective HLC) and define fold
semantics so revoked-key facts after the effective point are demoted to untrusted (surfaced, not
silently dropped, per N5). (b) **Anchor HLC `wall` for security checks to a trusted timestamp**, or use
`txFrom = receiving replica's HLC on first verified ingest` rather than the writer's self-stamp, so a
compromised writer can't backdate into a validity window. (c) **Scope keys**: trusted set maps key →
authorized scopes/EID-namespaces. (d) Specify the **root of trust** for `kip/keys/trusted` (e.g. a
genesis key set in `manifest.json`, changes require signature by an existing root key) so the trust set
isn't trivially writable. Without these, "trust composable" (§7) is aspirational.

---

## MAJOR findings

### M-1. `causedBy` for concurrency detection reintroduces the O(replicas) cost the spec rejected, or is unsound

**Location:** §4b.1 ("two facts are concurrent iff neither is in the other's `causedBy` closure and
their HLCs are mutually non-dominating … giving dotted-version-vector-grade detection only where a
writer opts in, without per-fact O(replicas) cost").

**Why it fails.** The spec rejects vector clocks for O(replicas) metadata, then reintroduces causal
detection via `causedBy: FactId[]`. To compute "is X in Y's `causedBy` closure" you must **traverse the
transitive closure of `causedBy` edges** — which is O(history) per comparison unless you precompute a
reachability index, and the closure can fan out to *every prior fact a writer depends on*. "Dotted-
version-vector-grade detection" is a strong claim: DVVs detect concurrency for **all** pairs; `causedBy`
detects it only for pairs where *the writer explicitly listed the parent*. A writer that forgets (or
maliciously omits) a `causedBy` edge makes two genuinely-causal facts **look concurrent**, invoking a
merge strategy where a linear supersession was intended — silently changing the result. So it's either
(a) as expensive as the thing it replaced, or (b) unsound because completeness depends on writer
diligence. HLC's own documented limitation ("HLC cannot detect concurrency alone," which the spec
admits) is not actually fixed; it's papered over with an optional, writer-trusted field.

**Fix direction.** State the actual guarantee precisely: "concurrency detection is **best-effort**,
complete only over explicitly declared `causedBy` edges; absent edges default to *concurrent* (safe
direction → invokes merge strategy)." Specify the reachability index as a projection with its cost.
Do not claim "DVV-grade." If true causal completeness is needed, bite the bullet on per-fact dotted
versions for the writer's own replica set.

### M-2. HLC `counter: uint32` overflow and `wall` skew bounds are unhandled; ordering can wrap or stall

**Location:** §4b.1 (`wall: int64ms, counter: uint32`), OQ-7 ("HLC wall-clock drift bound / NTP
assumptions … operational (correctness of *ordering* does not depend on it)").

**Why it fails.** (1) `counter: uint32` overflows after 4.29B events sharing a single `wall`
millisecond — unlikely per-ms, but the standard HLC algorithm advances `counter` whenever a received
event's `wall` is ahead of local `wall`; under sustained clock skew the counter can climb unboundedly
and overflow is **undefined behavior** in the spec (wrap → ordering violation → SEC break). (2) OQ-7
claims ordering correctness is independent of drift — **false for HLC**: if a replica's `wall` is far
ahead (skewed clock), every other replica must advance its HLC to match on receipt, dragging the whole
fleet's logical time forward and making the skewed replica effectively win all LWW races forever
(monotonic poisoning). Standard HLC requires a **bounded drift assumption** (`|wall - physical| ≤ ε`,
reject facts beyond ε); the spec waves this away as "operational" when it's a correctness/fairness
issue for `lww-hlc`.

**Fix direction.** Specify counter-overflow behavior (carry into `wall+1`, per canonical HLC), and a
**max-drift rejection bound** ε with facts beyond it rejected (per N5, surfaced not silently accepted).
Move OQ-7 from "operational, ordering-independent" to a core correctness parameter for `lww-hlc`
fairness.

### M-3. `/heads` is committed AND derived — this is a guaranteed self-conflicting merge that the merge section never addresses

**Location:** §3.1 ("`/heads/**` is a MATERIALIZED projection committed into git … derivable and
verified by replay"), §3.2 step 4 ("fold f into affected `/heads/<eid>.json` (new blob)"), §3.4
(merge described only over `/facts/**` union + per-cell fold).

**Why it fails.** `/heads` blobs are committed (so a clone needs no rebuild) **and** are deterministic
derivatives of facts. When two replicas merge, §3.4 specifies unioning `/facts` and re-folding cells —
but it **never says the committed `/heads` blobs are discarded and recomputed during merge**. If git's
default tree merge runs on `/heads/**`, you get **textual JSON conflicts on every head touched by both
sides** — precisely the "index↔source merge conflicts" pitfall the spec cites against committing
indexes (T-3). The spec committed heads *anyway* and then describes merge as if heads don't exist in the
tree. The two facts (heads are committed; merge only re-folds) are not reconciled: either heads cause
merge conflicts (bad), or the merge driver must **ignore committed heads and overwrite them from the
re-fold** (in which case committing them buys self-containment but they're authoritatively
untrustworthy mid-merge and INV-1 `fsck` is the only thing keeping them honest).

**Fix direction.** Specify a **custom git merge driver** for `/heads/**` that discards both sides and
recomputes from the unioned fact-set (never text-merges heads). State that committed heads are
*advisory* (fast-read cache) and always reconciled by re-fold on merge, with `fsck` as the audit. Make
explicit that a `.gitattributes` merge=kip-heads driver is part of the repo format. Currently a naive
implementer following §3.2/§3.4 literally will ship conflicting heads.

### M-4. Idempotent ingestion claim collides with HLC stamping: the same logical fact gets different CIDs on different replicas

**Location:** §4b.2 ("a fact's id *is* its content CID, so re-ingesting a fact is a no-op"),
§3.2 step 2 ("verify f.signature … **stamp HLC**"), §4.1 (`hlc: HlcStamp` is a signed field implicitly,
`FactId = CID of the canonical fact payload`).

**Why it fails.** `FactId = CID of canonical payload`, and the payload **includes the HLC** (`hlc` is
part of `Fact` and feeds ordering, so it must be signed/canonical). But §3.2 says kip **stamps the HLC
at assert time on the receiving replica**. So: if the HLC is part of the content, then the *author* must
stamp it before signing (kip can't stamp it post-hoc without breaking the signature) — contradicting
§3.2 step 2. Conversely, if kip stamps HLC after receipt, then HLC is **not** in the signed payload,
two replicas stamp different HLCs, the CID differs, and "re-ingesting is a no-op" is **false** — the
same logical assertion arriving via two paths produces two distinct FactIds/blobs that both enter the
G-Set, double-counting (catastrophic for `counter` strategy, duplicate intervals for valid-time).

**Fix direction.** Decide unambiguously: HLC is **author-stamped and signed** (part of payload/CID), so
idempotency holds and §3.2 step 2 must say "verify author-supplied HLC is monotone-valid," not "stamp
HLC." Then receiving-side HLC handling is only for the *receiver's* local clock advance, not the fact.
Alternatively separate identity (`FactId = CID of payload *excluding* HLC`) from ordering (HLC carried
alongside, signed separately) — but then two HLCs for one FactId must be reconciled. The current text is
internally contradictory and breaks INV-7.

### M-5. "Believed-then vs true-then" requires retroactive `txTo`, but the spec stores transaction time only as forward HLC — past belief reconstruction is lossy under concurrent/late facts

**Location:** §2 Terminology ("Transaction time … `txTo` set by a superseding fact"), §4.2
("`txTo` is set (logically) when a superseding fact arrives … append-only and monotone per replica"),
§4.3 ("pick the commit whose HLC tip ≤ txTime … no recompute for the txTime axis").

**Why it fails.** Transaction time per the bitemporal model must answer "what did we believe at txTime
T?" That requires knowing, **for each fact, the txTime interval during which it was the believed value**
— i.e. `txTo` = the txTime at which a *superseding fact was recorded*. The spec says `txTo` is "set
logically when a superseding fact arrives," derived from HLC. But under **late-arriving facts** (§4.2
explicitly supported), a fact F1 recorded at HLC=10 can be superseded by F2 with `validFrom` in the past
but `txFrom`=HLC=5 *if* F2 arrives from another replica with a lower HLC (HLC is not globally monotone —
only "monotone per replica"). Now "what did we believe at txTime 7?" is ill-defined: on replica A, F2
(txFrom=5) wasn't present until merge; the *belief* at A's wall-time-7 did not include F2, but the HLC
ordering now places F2 before F1. **Transaction time must be replica-local and append-only, but the spec
makes it a function of the globally-merged HLC order, which is NOT the order in which any single replica
actually believed things.** So "believed-then" reconstructs a *post-hoc rationalized* belief, not the
actual historical belief — defeating the auditability purpose. The §4.3 binary-search "commit whose HLC
tip ≤ txTime" assumes commit HLC tips are monotone along the DAG, which cross-replica merges violate.

**Fix direction.** Distinguish **per-replica transaction time** (the actual ingest order at *this*
replica, strictly monotone, the real "what did we believe") from **global causal order** (HLC, for
convergence). `txFrom` for belief queries should be the *local ingest HLC/commit*, recorded per replica,
not the author's HLC. State that "believed-then" is **replica-relative** (different replicas believed
different things at the same wall-time — that's correct and auditable), and that `asOf(txTime)` requires
specifying *whose* belief. The current single global txTime axis cannot represent divergent belief
histories, which is the whole point of a coordinator-free multi-replica system.

### M-6. History/storage bloat: the fact-per-file + committed-heads + per-commit head rewrite makes write amplification O(history), not O(change)

**Location:** §3.1 / §3.2 (one `/facts/<shard>/<id>.json` per fact + rewrite `/heads/<eid>.json` per
affecting fact + commit), §3.5 (packing/rollup), PRIOR-ART HP-3.

**Why it fails.** Every fact writes (a) a new fact blob, (b) a new head blob for each affected eid, (c)
new tree objects for every directory on the path from root to both blobs (root, `/facts`, shardHi,
shardLo; root, `/heads`, `/nodes`, eidShard). With sharded trees, a single fact mutates ~6–8 tree
objects **plus** the head blob. At agent write rates this is the loose-object explosion HP-3 warns
about, and **committed heads double it**. Batching (§3.2) amortizes within a txn but not across the
fleet. The rollup mitigation (§3.5) "materializes /heads at a chosen commit, writes a marker, old blobs
become GC-eligible **only after** excision policy permits" — meaning **rollup does NOT actually reclaim
space** unless excision (history rewrite, C-4) runs, because the old fact blobs remain reachable from
older commits. So the headline bloat solution is gated behind the most dangerous operation in the spec.
TerminusDB rollup compacts the *layer stack* for read speed but TerminusDB doesn't keep every historical
file reachable forever; kip's git history keeps everything reachable, so rollup helps read traversal but
**not storage** until you rewrite history. The spec conflates "fewer facts to traverse on read" with
"less storage," which are different.

**Fix direction.** Be explicit that **storage is monotonically growing by design** (immutable history)
and that the *only* space-reclaiming op is excision; rollup helps read latency, not bytes. Provide a
realistic packing analysis (delta compression effectiveness on JSON fact blobs that share envelope but
differ in payload is modest). Consider not committing `/heads` (make them a cache ref like vectors) to
halve write amplification, accepting a rebuild-on-clone cost — the T-3 "self-contained clone" benefit
should be measured against this amplification, which the spec never does. Quantify expected objects/
commit and gc cadence.

### M-7. Projection determinism for vector/ANN is asserted but ANN indexes (HNSW) are not deterministic, and embeddings are caller-supplied (nondeterministic)

**Location:** §5.3 ("Rebuildability invariant. Deleting all of `refs/kip/projections/*` and recomputing
yields **byte-identical** projections"), INV-5, §5.1 ("HNSW or IVF; pluggable index"), N2 / OQ-1
(embeddings caller-supplied).

**Why it fails.** (1) **HNSW graph construction is order-dependent and often uses randomized layer
assignment** — two builds over the same vectors in different insertion orders produce different graphs
(different neighbor lists), hence **not byte-identical**, even if recall is similar. IVF with k-means
has random init. INV-5 "byte-identical" is false for real ANN indexes. (2) **Embeddings are
caller-supplied (N2)** — if the caller's embedding model is nondeterministic (GPU nondeterminism,
model version drift), the vector projection is not reproducible at all, and kip has no way to detect it
because it only sees opaque vectors. The spec keys projections by source git hash, but the *embedding
content* isn't in git unless the vectors are committed (they're not — §3.1 vectors live in cache refs).
So "changed source ⇒ new hash ⇒ reproject" doesn't catch "same source, different embedding model
version ⇒ silently stale/incomparable vectors."

**Fix direction.** Scope INV-5's "byte-identical" to the **deterministic projections** (graph
adjacency, salience with fixed weights/seeds) and downgrade ANN to "**equivalent up to index
nondeterminism**" with a recall-based conformance test, not byte equality. Require embeddings to be
**content-addressed and committed** (or their model id + version recorded as a fact) so the vector
projection's source hash actually covers the embedding identity; otherwise staleness is not
"structurally impossible" (§5.3) — it's invisible. The §5.3 claim "staleness is structurally
impossible" is too strong and false for the embedding path.

### M-8. Schema gating at write + as-of-replayability is contradictory under ontology evolution and merge

**Location:** §2.2 ("a fact whose kind/props violate the *current* ontology is rejected at `assertFact`
… but a fact valid under the ontology *as-of its txFrom* is always replayable"), §8.4 INV-8 (upcaster
totality), §3.1 (`/ontology/...@<ver>.json`, schema stored as facts).

**Why it fails.** Schema is itself facts that sync and merge (§2.2, stored as data). So the "current
ontology" is **replica-relative and itself subject to convergence lag**. Replica A has ontology v2
(added a required prop); replica B still on v1 asserts a fact valid under v1 but **invalid under v2**.
On sync, A unions B's fact into the G-Set (set union is mandatory for SEC — you cannot reject during
merge without breaking convergence, since rejection is order-dependent). Now A holds a fact that
violates A's current ontology — contradicting "rejected at assertFact." The spec gates at `assertFact`
(local write) but merge ingests facts **without** re-gating (it must, to converge). So the invariant
"facts violating current ontology are rejected" holds for local writes but **not** for merged facts,
and the spec never says so. Worse: if A *does* reject B's fact on merge to honor the schema gate, A and
B diverge (SEC broken). This is a real tension between "no fallback / reject on violation" (N5) and
"set-union convergence" (C-1's only sound part).

Also INV-8 "upcast is **total** over all historical facts; reading old facts under a new schema never
throws" — but a v2 schema that **adds a required field with no default** cannot be made total without an
upcaster inventing data (a fallback — forbidden by the repo's "fallbacks are evil" rule and N5). The
spec asserts totality without showing it's achievable for non-additive schema changes (field removal,
type narrowing, required-field addition).

**Fix direction.** State that schema is gated **only at local assert**, and **merged facts are accepted
regardless of current ontology** (validated as-of their own txFrom ontology), with current-ontology
violations surfaced as a typed `kip:schema-violation` projection — never rejected on merge (that would
break SEC). Define upcaster semantics for **non-total** transforms explicitly (e.g. upcast MAY mark a
fact `quarantined` rather than invent values), and reconcile with the no-fallback rule. INV-8's
"never throws / total" must be weakened to "terminates with a typed result (value | quarantine)."

### M-9. The "no gaps" interval invariant is impossible to maintain under genuinely concurrent retracts + late asserts without an arbitrary policy (i.e., a fallback)

**Location:** §4.2 ("the set of non-superseded asserts MUST partition valid-time into non-overlapping
intervals … kip enforces this mechanically on fold … a `retract` clips/closes an interval"), INV-4.

**Why it fails.** "Partition" means **no gaps and no overlaps**. But a `retract` "closes an interval" —
retracting the middle of `[0,20)` leaves `[0,5)` and `[10,20)` with a **gap** `[5,10)`. Is the cell
"null" / "unknown" / "non-existent" in the gap? A partition with a hole is not a partition. The spec
demands "no gaps" yet the retract operation **creates** gaps. Either the invariant is wrong (gaps are
allowed, representing "unknown") or retract can't punch holes — the spec asserts both. Under concurrent
"assert [0,20)=X" and "retract [5,10)" the merged fold must decide whether the gap exists, and any
deterministic choice is fine **mechanically** but the spec's stated invariant (no gaps) is violated by
its own primitive.

**Fix direction.** Redefine the invariant as "**non-overlapping** intervals" only, and **explicitly
permit gaps** with a defined semantics for reads in a gap (`undefined`/`unknown`, distinct from `null`).
Update INV-4 to test "no overlaps + gaps read as unknown," not "partition." Specify retract's effect on
the interval set precisely (split, not just close).

---

## MINOR findings

### m-1. `PropValue = … | CID` conflates a value with a reference; dedup/equality is ambiguous

§2.1: a large value is "a blob, referenced by CID." But `PropValue` union includes `CID` directly, so a
prop literally equal to a hex string is indistinguishable from a blob reference. Two cells with the same
CID-typed value — are they "same value" (CID equality, §3.6) or coincidentally-equal strings? **Fix:**
wrap blob refs in a tagged type `{ blob: CID }`, never a bare string in the value union.

### m-2. `confidence` feeds both salience and supersession but its merge semantics are undefined

§2.4 `confidence?: number` "feeds salience + supersession," but when two concurrent asserts have
different confidence, `lww-hlc` ignores confidence entirely (picks HLC-max). So a high-confidence fact
loses to a later low-confidence one. **Fix:** specify whether a `confidence`-aware merge strategy exists,
or state confidence is advisory-only and never affects mechanical resolution.

### m-3. `Provenance.commit: CID` is a forward reference that cannot exist when the fact is signed

§2.4 `commit: CID` is "the commit that durably recorded the fact," but the commit hash depends on the
fact blob, which depends on the signature, which (if `commit` is a signed field) can't include the
not-yet-existing commit. Circular. **Fix:** exclude `commit` from `signedFields` and state it's a
post-hoc annotation, not part of fact identity.

### m-4. `kip:conflict` nodes are never resolved by the core, so conflicts accumulate unboundedly

§3.4 "reads as CONFLICTED until a human/agent asserts a resolving fact." In an autonomous agent fleet
nobody may ever resolve. The context layer reading a CONFLICTED cell gets... what? §4c `recall` has no
defined behavior for conflicted cells. **Fix:** define read semantics for CONFLICTED cells in
`recall`/`getNode` (return all candidates? omit? error?) — currently silent.

### m-5. `subscribe(scope) → AsyncIterable<FactDelta>` cursor is an `HlcStamp`, but HLC is not totally
ordered across replicas without replicaId, and deltas from N replicas can arrive with lower HLC than the
cursor

§4c `FactDelta.cursor: HlcStamp`. A monotone cursor assumes new facts always have higher HLC, but a
late-merged fact from another replica can have a *lower* HLC than the current cursor (§M-5), so the
subscriber **misses it** (it's "before" the cursor). **Fix:** cursor must be a per-replica vector or a
commit-DAG frontier, not a scalar HLC, to avoid missing causally-late deliveries.

### m-6. `manifest.json` pins "hash algo (SHA-1/SHA-256 per repo)" but cross-repo sync between SHA-1 and
SHA-256 repos is undefined

§2 CID = "git object id (SHA-1/SHA-256 per repo)" and §3.1 manifest fixes it. Two replicas on different
hash algos cannot share object CIDs → sync (content-addressed transfer) is impossible. **Fix:** state
all replicas in a convergence group MUST share one hash algo; cross-algo is a hard error.

### m-7. `recall` RRF over "salience rank" makes results time-varying and thus non-reproducible for a
fixed `asOf`

§5.1 fuses a "salience rank," and salience includes "access frequency (read-event facts)" (§5.4). Reads
emit read-event facts (§5.4) that change salience that changes future ranking — recall is **observer-
effecting** and not a pure function of `asOf`. Two identical `recall(asOf=T)` calls can rank
differently. **Fix:** specify whether read-events are inside or outside the `asOf` snapshot; for
reproducibility, salience input must be bounded by `asOf.txTime`.

### m-8. Sharding by "first 2 + next 2 hex" gives fixed 256×256 fan-out that doesn't adapt to scale

§3.1 fixed 2+2 hex sharding = 65,536 leaf dirs max. Below that, dirs are sparse (overhead); far above,
each leaf again holds tens of thousands of files (the very problem sharding solves). **Fix:** specify
adaptive/deeper sharding or document the scale band where 2+2 is valid.

### m-9. `txn` = "one commit (all-or-nothing)" but auto-batched `assertFact` "flushed on timeout"
(§3.2) means a crash mid-buffer loses acknowledged writes

§3.2 "auto-batches via a debounced write buffer flushed on `commit()` or timeout." If `assertFact`
returns a FactId before the buffer flushes and the process crashes, the "asserted" fact is lost despite
the caller holding its id. §7 says "partially-written buffer is never visible" — but the *return value*
already leaked the id. **Fix:** clarify durability semantics — either `assertFact` doesn't return until
committed, or returns a "pending" status distinct from durable.

### m-10. No specified bound on `causedBy` / DAG depth for `asOf` binary search; "commit DAG binary
search" assumes a linear history

§4.3 "commit DAG binary search" — a DAG (post-merge) is not linearly ordered, so binary search by HLC
tip is ill-defined across merge commits with incomparable tips. **Fix:** define the as-of resolution
over a DAG (topological + HLC), not "binary search."

### m-11. Excision propagation has no authorization model — any replica can broadcast an excision marker
and force others to delete data

§4.5 "propagated to replicas as an excision marker so they excise the same CID." A malicious replica
emits excision markers for arbitrary CIDs → **denial-of-service / censorship by forced deletion**.
**Fix:** excision markers must be authorized (signed by a key with excision capability, scoped), and
receiving replicas verify authority before excising.

### m-12. `inverse?: EdgeKind` and `cardinality` are declared but no fold enforces them

§2.2 edge kinds declare `inverse` and `cardinality` (e.g. `1:1`), but §3.4's per-cell fold operates on
single cells and never enforces cross-edge cardinality (a `1:1` edge asserted twice concurrently to
different targets). **Fix:** specify whether cardinality is enforced (and how, since it's a multi-cell
invariant that breaks the cell-local merge model) or is descriptive-only like atlas.

---

## Cross-cutting assessment

- **Is the core actually minimal/composable?** Mostly yes in API shape (§6), but the convergence
  *semantics* are under-specified exactly where the context layer depends on them (§4c builds on
  `FactDelta` cursors that don't work cross-replica — m-5; on `recall` over conflicted/observer-
  effecting salience — m-4, m-7). The seams are *named* but several are not *sufficient* as specified.

- **Internal contradictions found:** (C-1 vs the scalar lattice claim), (M-3 committed-heads vs
  merge-by-refold), (M-4 stamp-HLC vs idempotent-CID), (M-8 reject-on-violation vs set-union-merge),
  (M-9 retract-punches-gap vs no-gap invariant), (§4b.2 "OR-Set without removal" vs first-class
  `retract`). These are not nitpicks — they are load-bearing.

- **Remaining TBD in the "complete" core:** The OQ list (§9) defers OQ-2 (supersession policy) and OQ-7
  (drift bound) as "non-core," but C-3 and M-2 show both are **core correctness** concerns for the SEC
  guarantee, not ops tuning. The spec mislabels two correctness gaps as deferred.

---

## Biggest weakness

The headline claim — *"coordinator-free replicas converge mechanically at the substrate"* with a
**byte-identical SEC theorem** — is **not actually established**, because (a) the fold that produces
`/heads` clips valid-time intervals and is therefore a set-geometry function, not the pairwise-ACI
scalar join the theorem assumes (C-1/C-2), and (b) order-sensitive semantic supersession emits
*divergent* corrective facts whose union does not yield an agreed state (C-3). The spec proves the easy
half (the fact-set is a G-Set) and asserts the hard half (the projection of that set is order-
independent and semantically agreed). For a system whose entire purpose is to let distributed agents
**synchronize their contexts**, an unsound convergence theorem is a foundational, not cosmetic, defect.
