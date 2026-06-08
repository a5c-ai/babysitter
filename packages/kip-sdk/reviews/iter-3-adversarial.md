# Adversarial Red-Team Review — `@a5c-ai/kip-sdk` SPEC v3 (iter-3)

> Reviewer stance: ruthless, specific, break-it. Round 3. v2 landed 3 CRITICAL (C2-1 proj-not-pure-
> via-rxFrom, C2-2 supersede hash-fallback, C2-3 excision DAG non-confluence) + 5 MAJOR. v3 is a
> careful, mostly-honest revision: it draws a bright **INGEST-GATE / PROJ** line, moves all
> authorization/revocation into author-HLC comparisons over the set, makes the default `supersede`
> reducer surface `kip:conflict`, and regenerates the commit DAG from the ordered set instead of
> rebasing. **All three v2 CRITICALs are genuinely fixed at the place they were broken.**
>
> **But v3's headline fix relocated the non-determinism rather than removing it.** The bright line
> says PROJ is set-pure "because every input proj reads lives in S, and the admitted set is identical
> on equal-set replicas" (line 38–40). The load-bearing clause is *"the admitted set is identical."*
> v3 makes admission depend on the receiver's **physical wall clock at ingest time** (gate predicate
> iii, the drift-ε bound). That is a **replica-local, time-local** quantity — exactly the class of
> input v2 was crucified for letting into `proj`. v3 didn't admit it into `proj`; it admitted it into
> **set membership itself**. The result is that `S_A ≠ S_B` can be *permanent*, which makes the SEC
> theorem ("equal sets ⇒ equal heads") **true but vacuous**: the sets are no longer guaranteed to
> become equal. This is **C3-1** and it is the round-3 headline, precisely as the prompt suspected.

---

## Verification of prior (iter-2) CRITICAL/MAJOR findings

Methodology: each prior finding checked for a *mechanism that survives its original counterexample*,
not a relabel.

| Prior | Status in v3 | Evidence (quoted) |
|---|---|---|
| **C2-1** (`proj` reads `rxFrom` via revocation) | **GENUINELY FIXED** (at proj) | `rxFrom` is excluded from `proj`, `orderKey`, and every trust decision (lines 36, 113, 252). Revocation `effectiveFrom` is now **author-HLC** compared to each fact's **own author-HLC**: line 1339 "Compared to author-HLC, NEVER to receiver rxFrom"; line 1348 "demoted to untrusted iff its OWN signed author-HLC ≥ `effectiveFrom`". `orderKey` (line 440–446) reads only author-stamped set-resident fields. The v2 byte-divergence counterexample (a fact straddling a revocation, merged late on one replica) **is dead at the proj layer** — both operands are set-resident. INV-1/INV-11 add explicit `rxFrom`-perturbation tests. Sound *as a proj-purity fix*. (It reopens a *different* hole at the gate — C3-1 — but that is a new defect, not C2-1 unfixed.) |
| **C2-2** (concurrent supersede silently hash-tiebroken) | **GENUINELY FIXED** | The default reducer table (line 509) now reads: `supersede` concurrent different outcomes ⇒ "**NON-commutative ⇒ `kip:conflict` surfaced by the DEFAULT reducer (C2-2). Never `factCID`-tiebroken.**" Lines 531–544 restate: "the **default** supersede reducer does **not** pick one by `factCID`… emits a typed `kip:conflict`… Resolution requires a new authored `supersede` fact whose author-HLC strictly dominates both." This is exactly fix (b) the v2 review demanded. The hash-laundering path is closed in the *default* reducer, not only custom ones. Sound. (One residual edge — conflict-marker convergence under partial visibility — is C3-4 below, MAJOR, not a reopening.) |
| **C2-3** (concurrent excision DAG non-confluent; `dagTips` dangling) | **GENUINELY FIXED** (as specified) | v3 takes fix (b)+(c) jointly: line 853–864 "the commit DAG is treated as a **deterministic projection of the ordered fact set**: after any excision, kip **regenerates** the canonical commit sequence by folding the remaining admitted set in `orderKey` order… rather than *rebasing*." `dagTips` is **dropped** from the durable pin contract (lines 848, 1064, 1071–1072); `asOf` resolves against the fact frontier (line 791). INV-12 forces the test. The confluence argument is valid *iff* regeneration is a total deterministic function of the ordered set — which v3 asserts but under-specifies (C3-5, MAJOR). The *structure* of the fix is correct and the dangling-`dagTips` problem is genuinely gone. |
| **M2-1** (`orderKey` not total) | **GENUINELY FIXED** | Normative canonical-payload field list now given (lines 256–269) **including** `publicKeyFingerprint`, `replicaId`, `v`; `publicKeyFingerprint` added as an explicit `orderKey` component *before* `factCID` (line 444). INV-3 asserts "no two distinct admitted facts share an `orderKey`" (line 1420). Closed. |
| **M2-2** (commit-sig re-application re-breaks idempotency) | **GENUINELY FIXED** | "**Commit-level signatures are NOT a trust anchor and `fsck` does not check them**" (line 867); regenerator does NOT re-sign as original authors (line 870); commit-author ≠ fact-author "explicitly allowed" (line 869). `fsck` checks fact sigs only (line 1257, 1399). Closed. |
| **M2-3** (EID embeds revocable key-fpr → rotation orphans namespace) | **GENUINELY FIXED** | `namespaceId` is now the **frozen genesis** id (lines 107, 130, 600–617); "write authority over that fixed namespace moves across keys via the key-authorization chain"; "revoking the old key never retroactively invalidates facts it signed before `effectiveFrom`". Closed structurally. |
| **M2-4** (`asOf` routes validTime through replica-local DAG) | **GENUINELY FIXED** | `asOf({validTime})` is now "proj-pure and convergent… never walks a commit DAG and never reads `rxFrom`" (lines 782–785); INV-11 added (line 1454). `txTime` lens explicitly non-convergent (line 786). Closed. |
| **M2-5** (`revokeKey` author-HLC arg vs receiver-`rxFrom` check) | **GENUINELY FIXED** | `revokeKey(keyFpr, effectiveFrom: HlcStamp, …)` "effectiveFrom is AUTHOR-HLC, compared to each fact's author-HLC in proj… NOT rxFrom" (line 1256); `KeyRevocation.effectiveFrom` comment corrected (line 1339). Now in one clock space. Closed. |
| **m2-1..m2-7** | **ADDRESSED** | Reducer tiebreak terminates in `orderKey` (line 284, INV-3); node-existence gate (lines 489–495); pncounter excised-input flag (line 846); INV-12 (concurrent-excision pins); manifest immutable + regen-merge (lines 342–351); `FactDelta.affected` includes revocation/excision re-demotions (lines 1077–1079); centrality byte-identity gated on exact-algorithm-or-accelerator (lines 1185–1194). All have a stated mechanism. |

**Net:** All three v2 CRITICALs are *actually* fixed at the locus they were broken — this is not
relabeling. The projection is set-pure with respect to `rxFrom`; the default reducer surfaces
supersede conflicts; the commit DAG is regenerated, not rebased. **The cost of the C2-1 fix is that
the anti-backdating defense had to move somewhere, and v3 put it at the ingest gate using physical
wall-clock — which makes *set membership* replica-and-time-dependent.** v3 traded a non-pure `proj`
for a non-deterministic *set*. The SEC theorem's antecedent (`S_A = S_B`) is no longer something the
protocol guarantees will hold.

---

## CRITICAL findings (v3)

### C3-1. The INGEST-GATE makes set **membership** replica-local and time-local (drift-ε vs the *receiver's* wall clock at ingest). Admitted sets can differ **permanently** across replicas, so the SEC theorem ("equal sets ⇒ equal heads") is **true but vacuous** — the sets are not guaranteed to become equal. Non-determinism was *moved*, not removed.

**Location.**
- §3.2 step 3 (line 367): "bounded-drift check (M-2): **reject iff f.hlc.wall > local_wall + ε**".
- §4b.1 (lines 909–912): "on ingest, a fact whose `wall` exceeds the **receiver's physical clock** by
  more than ε is **rejected and surfaced**".
- §4b.4 proof step 1 (lines 988–993): "The INGEST-GATE admits a fact iff (signature ∧ key-registered
  ∧ drift-within-ε) — three **objective functions of the fact's signed bytes** (plus the registered-
  key log and **physical clock**)…"
- The bright-line claim, lines 26–29: predicate (iii) is "the author-HLC `wall` is within the bounded
  drift ε of the **receiver's physical clock**. These three predicates are **objective functions of
  the fact's own signed bytes** — every honest replica admits exactly the same set."

**Why it fails.** The proof's step 1 quietly contradicts itself. It calls the gate predicates
"objective functions of the fact's signed bytes" and then, in the same sentence, appends
"**(plus … physical clock)**." A function of "the fact's bytes **and the receiver's physical clock at
the moment of ingest**" is **not** an objective function of the bytes. `local_wall` (line 367) is:

1. **Replica-local** — replica A's clock and replica B's clock differ (the very clock skew the drift
   bound exists to police).
2. **Time-local** — `local_wall` is read *at the instant of ingest*. The same fact arriving at the
   same replica *earlier vs later* is evaluated against a *different* `local_wall`.

So predicate (iii) is `f.hlc.wall > local_wall(replica, t_ingest) + ε`. Two honest replicas do **not**
necessarily admit the same set:

**Concrete permanent divergence (no excision, no revocation, no malice):**
- Author key `K` (registered, in-namespace) signs fact `F` with `F.hlc.wall = W` honestly (its own
  clock read W; it is within ε of *its* physical time).
- The author's clock runs ε-fast relative to replica B (allowed: ε is the *bound*, and two honest
  clocks may each be within ε of "true" time yet ~2ε apart from each other).
- Replica **A** is online and well-synced; `F` arrives promptly; `A.local_wall ≈ W`; `W > A.local_wall
  + ε` is **false** ⇒ **A admits F**.
- Replica **B** is partitioned for a long time, *or* B's clock lags, *or* `F` simply reaches B after a
  delay. When `F` reaches B, `B.local_wall` was advanced by *B's own* fast traffic, or B evaluated `F`
  while its own clock was behind — in the lagging-clock case `F.hlc.wall = W > B.local_wall + ε` is
  **true** ⇒ **B rejects F**.

Now `S_A = {F, …}` and `S_B = {…}` with `F ∉ S_B`. The §4b.4 theorem's antecedent `S_A = S_B` is
**false**, so the theorem says nothing — and crucially, **the spec provides no mechanism that ever
makes the sets equal.** Grep for `re-offer`, `re-admit`, `retry`, `gossip` in the spec returns
nothing relevant (the only `re-ingest` hits are the idempotent-dedup no-op at line 955 and the
*rejected* schema-gate alternative at line 212). A fact rejected by the gate is **rejected durably**:
nothing re-presents it, and §3.2 step 5's "blob already present → no-op" only fires for facts that
*were* admitted. So:

- `proj(S_A) ≠ proj(S_B)` **permanently** for the cell `F` covers.
- The SEC theorem is *technically* still true (it is a conditional whose antecedent is now sometimes
  unsatisfiable) but **operationally vacuous**: "if the sets are equal the heads are equal" is worth
  nothing when the protocol cannot guarantee the sets become equal. v2's defect was "equal sets,
  different heads." v3's defect is "the sets never become equal." **Both break G3 / INV-2** ("two
  replicas that have seen the same set of facts compute byte-identical projections") — in v3's case by
  making "have seen the same set" unreachable.

This is the prompt's exact hypothesis confirmed: the gate's `rxFrom`-free *value* purity was bought by
pushing a replica-local/time-local quantity **one layer down**, into membership. INV-1's
"`rxFrom`-perturbation" test (line 1409) will **pass** — because it perturbs `rxFrom`/ingest-order
*holding the admitted set fixed*. It never perturbs *whether a fact is admitted at all*. INV-2
delivers "random fact-set partitions" (line 1412) but assumes every partition's facts are admitted by
every replica — it does not model a replica whose clock or delivery timing causes a *different
admitted set*. **The conformance suite cannot catch C3-1**, exactly as the suite couldn't catch C2-1
in v2.

**Why CRITICAL.** It is the v3 analogue of v1's C-1 and v2's C2-1: the foundational convergence claim
is unsound, now because the *substrate G-Set itself* is non-deterministic across replicas. The G-Set
CRDT property (lines 941–950) requires that union be over the *same element universe*; if admission is
a per-replica predicate, the "grow-only set" is a *different set per replica* and union does not
reconcile them.

**Concrete fix (pick one; (1) is strongly preferred).**
1. **Make the drift-ε bound a `proj`-time *demotion*, not an ingest-time *rejection*** — mirroring
   exactly the C2-1 fix v3 already applied to revocation. Admit *every* signature-valid, key-registered
   fact into the set (membership becomes a pure function of bytes + the set-resident key log, with **no
   clock term**). Inside `proj`, demote a fact to `untrusted`/`quarantined-backdated` iff its author-HLC
   is **inconsistent with set-resident evidence** — e.g. its `wall` exceeds the max author-HLC `wall`
   of any fact that *causally precedes it in the commit DAG* by more than ε, or exceeds a set-resident,
   author-signed "heartbeat" frontier. The comparison must be against **set-resident** quantities only,
   never `local_wall`. Then membership converges (pure G-Set) **and** backdating is still defended
   (set-pure), with no replica-local clock anywhere. This is the only fix that preserves both halves of
   the bright line.
2. If ingest-time rejection is kept for DoS/flood control, it **MUST be retryable and eventually
   admitting**: a gate-rejected-but-signature-valid fact must be **buffered and re-evaluated** (on
   clock advance / on gossip re-offer) until either admitted or proven permanently-backdated by a
   *set-resident* rule. State the re-offer protocol and prove the set converges. (Strictly weaker than
   (1); still needs a set-resident permanence criterion or it never terminates.)
3. At absolute minimum, **state the truth in the theorem**: SEC holds only over the set of facts
   *admitted by every replica*, and admission is replica-local, so kip provides **no guarantee that
   two replicas converge on the same `/heads`** unless their clocks stayed within ε and every fact
   reached every replica within the ε window. That guts G3 and INV-2 and should be stated, not buried
   under "objective functions of the signed bytes (plus physical clock)."

Until one of these is in the text, **INV-2, G3, and the §4b.4 theorem's operational content are
false**, and the headline "coordinator-free replicas converge to byte-identical heads" is unproven.

---

### C3-2. Drift-ε rejection of a validly-signed in-namespace fact is silent, durable **data loss / censorship-by-clock-skew**, with no recovery path — and it violates N5 ("never silently picks/ drops") and "fallbacks are evil."

**Location.** §3.2 step 3 (line 367) "reject"; §4b.1 (line 911) "rejected and surfaced (per N5 — never
silently accepted)". §9 OQ-7→core (line 1493) "Facts beyond ε are rejected and surfaced."

**Why it fails.** The spec frames ε-rejection as N5-compliant because it is "surfaced, never silently
*accepted*." But N5's hazard is the opposite direction too: a fact that is **valid, signed, in-
namespace, and authored in good faith** is **dropped from the set** on the rejecting replica. The
spec's own anti-fallback posture (line 96–97: "unverifiable facts are rejected. kip never silently
'picks something'") is about *unverifiable* facts. An ε-rejected fact is **fully verifiable** — its
signature is good, its key is registered. It is rejected purely because the *receiver's clock* and the
*delivery latency* put `f.hlc.wall` outside a window. That is:

- **Data loss**: the fact is gone from `S_B` with no durable record that it was offered (the spec says
  "surfaced" but never says *persisted* — a surfaced-then-discarded rejection is not auditable, and a
  rejected fact whose blob is *not* written, per step 5 only writing admitted blobs, leaves no trace).
- **A censorship / liveness attack**: an adversary who can delay delivery (hold `F` until `B`'s clock
  advances past `F.hlc.wall + ε`) can **deterministically cause B to reject F** while A keeps it —
  weaponizing C3-1 into targeted state suppression on chosen replicas. The §4.5 excision threat model
  ("a replica never deletes data on an unauthorized peer's say-so", line 836) is carefully defended;
  this is the *same outcome* (a replica lacks data others have) achieved with **zero authorization**,
  just by controlling timing.
- **No recovery**: per C3-1 there is no re-offer. A legitimately late fact (the spec elsewhere prizes
  "late-arriving 'yesterday X was true'" facts, line 727) whose **author-HLC** is old is exactly the
  case ε rejects — yet valid-time lateness and author-HLC lateness are conflated. A fact asserting
  about *valid-time* 2025 can be *authored* (author-HLC) in 2026; but a fact **authored** long ago and
  delivered late (author offline for a week, then syncs) has a *low author-HLC wall* and will be
  ε-rejected on arrival even though it is perfectly honest. **kip's flagship offline/partition story
  (line 1028: "Replicas operate fully offline… on reconnect sync exchanges missing objects") directly
  collides with ε-rejection**: a replica offline for > ε that comes back and pushes its locally-authored
  facts will have those facts **rejected by every peer** whose clock advanced past `author_wall + ε`.
  This is a direct, central contradiction, not an edge case.

**Why CRITICAL (not MAJOR).** It is not a quality nit — it makes the spec's two headline properties
(coordinator-free convergence + offline-first partition tolerance) **mutually exclusive** for any
partition longer than ε. ε is a small drift bound (seconds–minutes, to police clock skew); offline
agents partition for hours–days. The fix in C3-1 option (1) dissolves this too (no rejection ⇒ no loss);
if rejection is retained, the spec must distinguish "**clock-skew backdating** (police it)" from
"**honest offline lateness** (admit it)" — which is *impossible at the gate* because the gate sees only
`f.hlc.wall` and cannot tell a malicious backdate from an honest stale author. Only a set-resident,
causal criterion (C3-1 fix 1) can make that distinction. **This is the strongest argument that the
defense belongs in `proj`, not the gate.**

**Concrete fix.** Adopt C3-1 fix (1): no fact loss, ever; backdating demoted in `proj` by a causal
(DAG-ancestor author-HLC) rule that *can* distinguish an honest old-but-causally-consistent fact from a
forged backdate. If any ingest-time rejection survives, the rejected blob MUST be durably persisted in
a `/quarantine/` shard (auditable, re-evaluable) so rejection is reversible and never silent loss.

---

### C3-3. Backdating-within-ε is still open, and revocation keyed on the *self-stamped* author-HLC cannot stop a compromised key from signing "valid" facts dated just before `effectiveFrom`. Moving off `rxFrom` **reopened the exact backdating hole the v2 `rxFrom` check closed.**

**Location.** §8.1 lines 1359–1369 (backdating defense = drift-ε gate); §8.1 line 1348 (demote iff
author-HLC ≥ `effectiveFrom`); §3.2 step 3; the prompt's precise question.

**Why it fails.** Walk the attacker's loop. Author-HLC is **self-stamped and self-signed** (line 689,
"AUTHOR-STAMPED and SIGNED"). The gate accepts any `f.hlc.wall ≤ local_wall + ε` — i.e. it accepts
author-HLCs **up to ε in the past with no lower bound at all** (the gate only bounds the *future*
side: "reject iff `f.hlc.wall > local_wall + ε`", line 367 — there is **no `<` floor**). Revocation
demotes iff `author-HLC ≥ effectiveFrom`. Therefore:

- Key `K` is compromised and revoked with `effectiveFrom = T`.
- The attacker, every tick, signs facts with `f.hlc.wall = (now − ε + δ)` for tiny δ — always within
  the gate's accepted window (it is in the *past*, and the gate has no past-floor).
- As long as `(now − ε) < T`, those facts carry `author-HLC < effectiveFrom`, so `proj` rules them
  **trusted** (demotion needs `≥ effectiveFrom`).
- So for a window of duration ≈ ε *after* the revocation's `effectiveFrom` in real time, the attacker
  can **keep minting trusted facts dated just-before-T**, because honest replicas' `local_wall` is
  still within ε of T and the gate happily accepts a `wall` up to ε below `local_wall`.

Concretely: revocation at author-HLC `T`; attacker continues to author trusted facts with author-HLC
in `[T−ε, T)` for as long as real time is within ε of `T`. The drift-ε gate bounds **how far in the
past** a *single* stamp can be (≈ ε), but it does **not** stop a compromised key from **continuously
re-stamping** facts at the top of that backdate window. The window the v2 `rxFrom` check closed (it
compared against *receiver* time, which keeps advancing and is not author-controlled) is **reopened**:
the v3 author-HLC comparison is against a quantity the **attacker stamps**, bounded only by a gate that
permits ε of backdating.

**Severity nuance.** This is bounded to an ε-width real-time window after `effectiveFrom`, not an
unbounded forge-the-past. But: (a) ε must be *large enough to absorb honest clock skew and the offline
lateness of C3-2* — the spec wants ε generous for liveness, which directly widens this attack window;
(b) the spec claims (line 1353–1354) a revoker can "**predict exactly** which facts a revocation
catches — all and only those whose author-HLC ≥ `effectiveFrom`." That claim is **false in the
presence of a compromised key**: the attacker chooses author-HLCs < `effectiveFrom` at will (within ε),
so the revocation provably **misses** a band of malicious facts the revoker intended to catch. The
"predict exactly" guarantee holds only for *honest* authors who stamp truthfully — i.e. exactly the
authors you don't need to revoke.

**Why CRITICAL.** Revocation that cannot reliably stop a *compromised* key from authoring trusted facts
in the neighborhood of the revocation instant is a broken revocation primitive for the threat model it
exists to address (key compromise, line 1345). The v2→v3 move "off `rxFrom`" was correct for
convergence but **silently sacrificed a security property** v2 had, and the spec advertises the
opposite ("predict exactly").

**Concrete fix.**
1. Set `effectiveFrom` semantics to **`effectiveFrom − ε`** for trust purposes (revoke everything from
   the key dated after `T − ε`), explicitly trading a small honest-tail loss for closing the backdate
   band; *or*
2. Better, combine with C3-1 fix (1): demote any fact whose author-HLC is **not causally supported** —
   a post-revocation real-time fact backdated to `< T` will have **DAG/causal predecessors with
   author-HLC ≥ T** (it was actually authored after honest facts that already passed T), exposing the
   backdate as causally inconsistent and demotable by a set-pure rule. This is the only defense that
   distinguishes the *malicious* backdate (causally inconsistent) from the *honest* late fact (causally
   consistent) — and it is the same machinery C3-1/C3-2 need.
3. At minimum, **delete the "predict exactly" claim** (line 1353) and state that revocation against a
   compromised key has an **ε-width backdating blind spot** at the revocation boundary.

---

## MAJOR findings (v3)

### M3-1. `kip:conflict` surfacing converges only if the conflict marker is a pure function of the *full* set — but under C3-1's divergent admitted sets, and under partial visibility, two replicas can disagree on *whether* a cell is conflicted, and the spec never proves auto-resolution is itself convergent.

**Location.** §3.4 lines 531–544 (concurrent supersede ⇒ `kip:conflict`, resolved by a "new authored
`supersede` fact whose author-HLC **strictly dominates both**"); line 519 (`CONFLICTED` read
semantics).

**Why it's MAJOR.** Two sub-issues:

1. **Conflict markers are set-pure *given the same set* — but the prompt asks whether they "leak into
   convergence."** They do, transitively: if replica A has admitted both supersede facts `S_A, S_B` and
   replica B (per C3-1, or simply mid-sync) has admitted only `S_A`, then A projects `CONFLICTED` and B
   projects `S_A`'s value as clean. That is the expected propagation window *only if* the sets re-
   converge — which C3-1 says they may not. So the conflict marker's convergence is **contingent on
   C3-1**, and the spec asserts it unconditionally. Until C3-1 is fixed, "the conflict marker is a pure
   function of the set" (line 537) is true but the *set* isn't shared.

2. **Auto-resolution convergence is asserted, not shown.** Resolution = "a new authored `supersede`
   fact whose author-HLC **strictly dominates both**" (line 538). But *two* adjudicators can
   concurrently author *two different* dominating supersedes (A's human picks Beta, B's human picks
   Gamma, both with author-HLC > both originals). Now you have two *new* concurrent contradictory
   supersedes over the same `inputCids` — which recurse into `kip:conflict` again. The spec gives **no
   termination argument** for the adjudication ladder. It can ping-pong indefinitely; nothing makes the
   *resolution* single-writer. This is the C2-2 fix's residue: surfacing the conflict is correct, but
   "resolution requires a dominating supersede" doesn't converge if dominating supersedes can themselves
   be concurrent and contradictory.

**Concrete fix.** (a) State that `kip:conflict` convergence is contingent on admitted-set convergence
(forces C3-1). (b) For adjudication, designate resolution as **single-writer per `inputCids`** (e.g.
only a key holding a `resolve`/`adjudicate` scope, or the namespace-owner key, may author a dominating
supersede), so two concurrent resolutions cannot both be authoritative; or define a deterministic
*pure-set* tiebreak **among dominating supersedes only** (e.g. orderKey-max **among facts that strictly
dominate both originals**) and state that this is the one place a total-order pick is semantically
defensible (the adjudicators explicitly claimed authority to override). Either way, prove termination.

### M3-2. `factSetDigest` as a durable pin target is unstable as the set grows: it is "merkle digest of the **pinned** fact-set" (a snapshot), but the set is grow-only, so a pin taken at frontier F₁ and a pin taken at F₂ have *different* digests for *overlapping logical state* — and the spec never defines how a pin "re-resolves" against a *larger current* set.

**Location.** §4c line 1070 "`factSetDigest`: merkle digest of the **pinned** fact-set; THE durable
resolution target — re-resolves after any rewrite"; line 1065 `Frontier = { perReplicaHlc }`; §4.5
line 847–851 "Pins… content-address the `factSetDigest` + author-HLC frontier… a pin survives any
rewrite by re-resolving the fact frontier."

**Why it's MAJOR.** The mechanism is under-defined exactly where the prompt probes:

- A pin is `{ frontier: perReplicaHlc, factSetDigest }`. The `factSetDigest` is a hash of **the set as
  it was when pinned**. As new facts arrive, the *current* set's digest changes. So to "re-resolve" a
  pin you must reconstruct **the subset of the current (larger) set that is ≤ the pinned frontier** and
  re-hash *that subset*, then check it equals `factSetDigest`. The spec never says this. It says
  "re-resolves against `factSetDigest`" as if the digest is a stable address into a growing store — but
  a merkle digest of a *subset selected by an author-HLC frontier* is only stable if **the subset is
  deterministically reconstructible from the frontier**. That requires: (i) every fact's membership in
  "≤ frontier" is decidable purely from its author-HLC vs the per-replica frontier — OK; **but** (ii)
  the frontier is `perReplicaHlc: Record<ReplicaId, HlcStamp>`, and a *late-arriving* fact with author-
  HLC ≤ the pinned frontier for its replica (HLC is not globally monotone, line 1084) **was not in the
  set when the pin was taken but IS ≤ the frontier now**. So re-resolving the same frontier against the
  grown set yields a **different (larger) subset** than the original pin captured ⇒ **different digest**
  ⇒ the pin's `factSetDigest` no longer matches. The pin is **not stable as the set grows** — the very
  property the prompt asked about.

- Two replicas at different sync points have different current sets; resolving the *same* pin
  (`frontier`, `factSetDigest`) gives the *same logical subset* **only if** both have received every
  fact ≤ the frontier. Before that, replica B re-resolving the pin gets a *smaller* subset (missing a
  not-yet-synced fact ≤ frontier) ⇒ different digest ⇒ either a false "pin broken" or a non-reproducible
  read. The spec's claim "a pin remains valid as the set grows" is unproven and, as written, false for
  late-arriving sub-frontier facts.

**Concrete fix.** Define pin resolution precisely: a pin resolves to `{ f ∈ S_current : f.authorHlc ≤
frontier[f.replicaId] }`, and `factSetDigest` is the merkle root of **that deterministically-selected
subset** (order-independent merkle over `orderKey`). State that the pin is **valid iff every fact ≤
frontier has been received** (i.e. the pin is "complete"), and that re-resolution before completeness
returns a typed `pin-incomplete` status, never a silent partial read. Then prove: two replicas that
have both reached completeness for the frontier compute the *same* subset ⇒ same digest ⇒ stable pin.
Without the completeness predicate, `factSetDigest` is not a durable address and the C2-3/C-4 "pins
survive excision" claim rests on it.

### M3-3. Commit-DAG regeneration is asserted deterministic but its inputs are under-specified — any non-set-derived field in a regenerated commit (timestamp, committer, message formatting, parent-set selection for the antichain) reintroduces the C2-3 divergence the regeneration was supposed to kill.

**Location.** §4.5 lines 853–864 (regenerate canonical commit sequence from ordered set); INV-12 line
1461 ("equal regenerated DAG given the equal remaining ordered set").

**Why it's MAJOR.** "Regenerate the canonical commit sequence by folding the remaining admitted set in
`orderKey` order" (line 855) is necessary but not sufficient for byte-identical commit CIDs. A git
commit object hashes over: tree, **parent(s)**, **author name+email+timestamp+tz**, **committer
name+email+timestamp+tz**, and **message**. For two replicas to regenerate **byte-identical commit
CIDs** (which INV-12 line 1461 demands), *every one* of those must be a pure function of the ordered
set:

- **author/committer timestamp**: §3.2 line 374 sets `commit.author = f.provenance.author` but says
  nothing about the commit *timestamp*. If the regenerator stamps "now" (git default), the CID diverges
  immediately. The spec never says the regenerated commit timestamp is derived from the fact's author-
  HLC (the only set-resident time).
- **committer identity**: line 868–870 allows the regenerated DAG to be "signed by the regenerating
  replica's own key" — but a commit *signed by* or *committed by* replica A vs replica B has **different
  committer bytes ⇒ different CID**. So the spec **simultaneously** says (line 869) the regenerator may
  sign with its own key **and** (INV-12, line 1461) the regenerated DAG is identical across replicas.
  **These contradict**: if A signs with A's key and B with B's key, the DAGs are *not* byte-identical.
  The "unsigned (deterministic transport)" alternative (line 868) is the only one that can satisfy
  INV-12, but the text offers both as equally acceptable.
- **batching / parent-set**: the original DAG batched many facts per commit (§3.2, "txn → one commit").
  The regenerated DAG must choose a **deterministic batching** of the ordered set into commits;
  line 855 says "fold in `orderKey` order" but never specifies commit boundaries (one-commit-per-fact?
  re-create original batches? — original batch membership is itself a transport artifact, possibly not
  set-derivable after excision removed some facts). Undefined batching ⇒ different commit objects ⇒
  different CIDs.

**Concrete fix.** Specify the regeneration as a **fully deterministic, set-derived** function: (a)
commit boundaries = a deterministic rule over `orderKey` (e.g. one commit per distinct
`(replicaId, hlcWall-bucket)` or simply one commit per fact — pick one and pin it); (b) commit
author **and** committer timestamp = the fact's author-HLC `wall` (the only set-resident time); (c)
committer identity = a **fixed sentinel** (e.g. `kip-regen <regen@kip>`), **not** the regenerating
replica's key; (d) the regenerated DAG is **unsigned** — drop the "may be signed by the regenerator's
key" option, which contradicts INV-12. State explicitly that any per-replica field in a commit object
breaks INV-12, so none may appear.

### M3-4. Gate predicate (ii) "key is a **registered** key in the tenant key log" is itself a *set-resident* lookup whose answer changes as the set grows — so gate admission is not even a pure function of "bytes + clock," it also depends on **which key-authorization facts this replica has synced**, adding a *second* membership-divergence axis on top of C3-1.

**Location.** §3.2 step 2 (lines 364–366); §2.4 line 273; bright-line (ii) line 25.

**Why it's MAJOR.** The gate's predicate (ii) — "signing key is a registered key in the tenant key log
**at all**" — reads `refs/kip/keys/<tenant>/trusted`, which is "**append-only and itself a fact log**"
(line 1313). That log is **synced like any other fact set** and is therefore *also* subject to per-
replica visibility: replica A may have synced the `KeyAuthorization` fact registering key `K` while
replica B has not yet. Then a fact signed by `K`:

- is **admitted** by A (K is registered in A's view of the key log), and
- is **rejected** by B (K not yet registered in B's view) — gate step 2 "reject if unknown key".

This is a **second, independent** source of `S_A ≠ S_B`, orthogonal to the clock issue (C3-1). And it
interacts badly: a brand-new agent's *first* facts and its *key-registration* fact may arrive at a peer
in either order (they're separate facts in separate shards); if the peer sees the agent's data facts
*before* the registration fact, it **rejects them at the gate** — and per C3-2 there is no re-offer, so
they are **permanently lost** on that peer even after the registration fact arrives.

This is the same disease as C3-1: a *membership* gate that consults a *growing, partially-synced* set
cannot be "objective and identical on every replica." The spec's claim (line 26) that predicate (ii) is
an "objective function of the fact's own signed bytes" is **false** — it is a function of bytes **and
this replica's current key-log view**.

**Concrete fix.** Same shape as C3-1 fix (1): **registration is a `proj`-time trust question, not an
ingest gate.** Admit any signature-valid fact into the set unconditionally (signature is the *only*
byte-pure predicate). Inside `proj`, a fact whose signing key has no set-resident registration **at its
author-HLC** projects `untrusted` (exactly as out-of-namespace facts already do, line 648). Then key-
registration ordering races resolve set-purely and no fact is lost to a sync-order race. (This also
collapses the gate to a *single* truly-objective predicate — signature validity — which is the only one
that is genuinely a function of the bytes alone.)

### M3-5. The §4b.4 proof step 1 is internally contradictory and the contradiction is load-bearing.

**Location.** §4b.4 lines 988–993.

**Why it's MAJOR (and partly a restatement that deserves its own line for the authors).** Step 1 reads:
"three **objective functions of the fact's signed bytes** (plus the registered-key log and physical
clock), so every honest replica admits **the same** facts." The parenthetical **negates** the claim it
is appended to: a function of "signed bytes **plus the registered-key log** (M3-4) **plus the physical
clock** (C3-1)" is *not* an objective function of the signed bytes, and does *not* guarantee every
replica admits the same facts. The proof asserts its conclusion ("admits the same facts") immediately
after listing two inputs (key-log view, physical clock) that are per-replica. **The proof is invalid as
written** — step 1 does not establish substrate convergence, on which steps 2–4 depend.

**Concrete fix.** Once C3-1/M3-4 are fixed (admission = signature-only), step 1 becomes *actually* true:
admission is a pure function of the fact's bytes (Ed25519 verify is deterministic and input-only), so
the G-Set element universe is identical, union converges, and the rest of the proof stands. Rewrite step
1 to claim only what signature-verification supports, and move key-registration + drift to step 2 as
*proj-time demotions*.

---

## MINOR findings (v3)

### m3-1. Drift-ε gate has no past-floor, only a future-ceiling.
Line 367: "reject iff `f.hlc.wall > local_wall + ε`." There is **no** `f.hlc.wall < local_wall − ε`
rejection. So arbitrarily-old author-HLCs are admitted (relevant to C3-3's backdate band). If the intent
is a symmetric window, state `|f.hlc.wall − local_wall| > ε`. If asymmetric-by-design (to allow honest
late facts), then C3-2's offline story is *partly* saved at the gate — **but** then the future-only
bound does nothing against a backdating attacker (who stamps in the past), undercutting C3-3's stated
defense. The spec must pick: it cannot both admit old facts (for C3-2 liveness) and reject old facts
(for C3-3 backdating). This tension is currently unaddressed and is the crux of why the defense belongs
in `proj`.

### m3-2. `local_wall` is undefined.
The gate compares to `local_wall` (line 367) / "receiver's physical clock" (line 911). Is it the raw OS
wall clock, or the replica's HLC wall (which is itself max(physical, max-seen-author-wall))? If the
latter, an attacker who already poisoned the HLC forward (the monotonic-poisoning the ε bound exists to
prevent) **raises `local_wall`**, *widening* the accepted backdate window for everyone — a feedback
loop. Specify `local_wall` = raw monotonic physical clock, never the HLC-advanced value, or the bound is
self-defeating.

### m3-3. `Frontier.perReplicaHlc` requires a known, bounded replica set.
`Frontier = { perReplicaHlc: Record<ReplicaId, HlcStamp> }` (line 1065). A pin/cursor must enumerate
*every* replica that authored a sub-frontier fact. A new replica that joins and authors a fact with a
low author-HLC is **absent from an older frontier's map** — is it ≤-frontier (admit) or not-in-map
(exclude)? Undefined, and it interacts with M3-2's pin-stability problem. Specify the semantics of a
replicaId absent from the frontier map (treat as `+∞`? `−∞`?) — the choice determines whether late new-
replica facts fall inside or outside a pin.

### m3-4. `fsck` "heads == proj(facts)" is well-defined again (good) but cannot detect C3-1 divergence.
`fsck` (line 1257, 1397) verifies `heads == proj(local facts)`. Post-C3-1, two replicas each pass
`fsck` locally while holding *different* admitted sets and *different* heads. `fsck` is a local integrity
check, not a convergence check; the spec should state that `fsck` passing on every replica does **not**
imply cross-replica convergence (that is INV-2's job, which C3-1 breaks). A reader may over-trust `fsck`.

### m3-5. Scalability of regeneration on every excision.
§4.5 regenerates the **entire** canonical commit DAG from the ordered set on every excision (line 854).
For a repo with millions of facts, one GDPR excision triggers a **full O(|S|) DAG rebuild** (re-create
every commit object downstream). The spec notes read-latency/byte tradeoffs (§3.5) but never the
**excision cost**: regeneration is O(remaining set), and concurrent excisions each trigger it. State the
cost and whether regeneration is incremental-from-excision-point (only commits after the earliest
excised fact's `orderKey` position need rebuild) rather than whole-history.

### m3-6. INV-2's "once admitted non-excised fact-sets equalize" hides C3-1.
Line 1412–1417: INV-2 tests convergence "once admitted… fact-sets equalize." Under C3-1 the admitted
sets **may never equalize** (clock/keylog-driven rejection). So INV-2 as phrased is **conditionally
vacuous** in exactly the failure mode — it tests the easy case (sets do equalize) and is silent on
whether they *can*. Add an invariant (INV-13): "every signature-valid, key-eventually-registered fact
is admitted by every replica within bounded time" — which is **only achievable after C3-1 fix (1)**
(signature-only admission). The fact that this invariant *can't currently be stated truthfully* is the
tell that C3-1 is real.

---

## Cross-cutting assessment

- **The three v2 CRITICALs are genuinely fixed at their locus.** `proj` no longer reads `rxFrom`;
  default supersede surfaces conflict; the DAG is regenerated not rebased. This is real, mechanism-
  level work, not relabeling. Credit where due: C2-1/C2-2/C2-3 and all five MAJORs (M2-1..M2-5) are
  closed as written.

- **The headline non-determinism MOVED, it did not leave.** v1: interval-clipping fold non-ACI. v2:
  `proj` reads replica-local `rxFrom`. v3: **set membership** reads replica-local *physical clock*
  (C3-1) **and** replica-local *key-log sync state* (M3-4). Each revision made `proj`/the-fold purer by
  pushing the replica-local quantity one layer down; v3 pushed it all the way into the G-Set's element
  universe, which is the worst place because the entire CRDT argument assumes a shared universe. The
  SEC theorem went from "false" (v2) to "true but vacuous" (v3) — an improvement in honesty, not in
  guarantee.

- **The bright line is real but drawn one notch too high.** v3 correctly identifies that
  authorization/revocation must be `proj`-time demotions. It then **failed to apply the same reasoning
  to backdating-defense and key-registration**, leaving those as ingest gates. The fix is uniform:
  *signature validity is the ONLY thing that can be an ingest gate* (it is the only predicate that is a
  pure function of the fact's bytes); **everything else — drift/backdating, key-registration,
  namespace-authority, revocation — must be a set-pure `proj`-time demotion keyed on author-HLC.** v3
  did this for two of the four and stopped.

- **Offline-first vs convergence are currently mutually exclusive** (C3-2): ε-rejection kills any
  partition longer than ε, which is the normal case for offline agents. This is a direct contradiction
  between two advertised headline properties, not an edge case.

- **Revocation lost a security property in the convergence fix** (C3-3): the v2 `rxFrom` comparison
  (receiver-time, attacker-uncontrollable) is gone; the v3 author-HLC comparison is against an
  attacker-stamped quantity, reopening an ε-width backdating band the spec wrongly claims to "predict
  exactly."

- **New under-specifications that are load-bearing:** `factSetDigest` pin stability (M3-2),
  regeneration determinism / signed-vs-unsigned contradiction (M3-3), conflict-resolution termination
  (M3-1). Each is a place where v3 asserts a convergence property the text does not establish.

- **The conformance suite still cannot catch the headline bug.** INV-1/INV-2/INV-11 all perturb
  `rxFrom`/order **holding the admitted set fixed**; none perturbs *admission* (clock skew, key-log
  sync order). The suite would green-light a build that diverges via C3-1/M3-4 — same blind spot as v2.

---

## Biggest weakness

**The INGEST-GATE makes set membership a function of the receiver's physical clock and the receiver's
key-log sync state, so two honest replicas can hold permanently-different admitted sets — and the spec
has no re-offer/recovery path, so the sets never reconcile.** The §4b.4 SEC theorem ("`S_A = S_B` ⇒
byte-identical heads") survives only because its antecedent is now sometimes unsatisfiable: v3 made the
*projection* pure by making the *substrate set* impure. Concretely, a fact validly signed by a
registered in-namespace key is admitted by a well-synced replica and **permanently rejected** by a
clock-lagging or partitioned-past-ε replica (C3-1), or by a replica that hasn't yet synced the signing
key's registration fact (M3-4); nothing re-presents it (C3-2), so `proj(S_A) ≠ proj(S_B)` forever. This
directly negates G3 and INV-2 — not in a bounded propagation window, but permanently — and it makes
kip's two flagship properties (coordinator-free convergence + offline-first partition tolerance)
mutually exclusive for any partition longer than ε. The fix is uniform and already proven viable by v3's
own C2-1 work: **admit on signature alone; demote drift/backdating, key-registration, authority, and
revocation all inside `proj` keyed on set-resident author-HLC** — never on a replica-local clock or a
partially-synced lookup at the gate. Until membership is a pure function of the fact's bytes, the
"coordinator-free replicas converge to byte-identical heads" headline is unproven and, as specified,
unreachable.
