# Adversarial Red-Team Review — `@a5c-ai/kip-sdk` SPEC v4 (iter-4)

> Reviewer stance: ruthless, specific, break-it. Round 4. v3 landed 3 CRITICAL (C3-1 ingest-gate makes
> membership replica-/time-local; C3-2 drift-ε rejection = data-loss/offline collapse; C3-3 revocation
> backdating band) + 5 MAJOR (M3-1..M3-5). v4 is an honest, well-targeted revision: it draws the bright
> line at the only defensible place — **signature validity is the SOLE membership predicate** — and
> moves *every* trust question (drift/backdating, key-registration, namespace-authority, revocation)
> into set-pure `proj`-time demotions keyed on author-HLC. **All three v3 CRITICALs are genuinely fixed
> at the locus they were broken.** The SEC theorem's antecedent (`S_A = S_B`) is now actually reachable
> (INV-13), offline-first and convergence are reconciled, and the commit-DAG regeneration contradiction
> is closed.
>
> **But the signature-only gate the fix demanded introduces exactly the risk the prompt anticipated: a
> wide-open availability hole.** With membership = signature-validity-only, a G-Set that is *never*
> dropped, and quarantine that *still stores*, ANY keyholder — including an **unregistered** key, since
> registration is proj-time not gate-time — can flood every replica with unlimited signature-valid facts
> that every replica MUST admit and store forever. There is **no rate, quota, spam, or resource bound
> anywhere in the spec.** This is the new headline (C4-1). Separately, the anti-backdating causal rule
> the whole v4 trust story rests on is **defeated by simply omitting `causedBy`** — and the spec *admits
> this in its own text* (§4b.1 lines 1057–1061) without recognizing that it guts rule (1) for the
> common case (C4-2).

---

## Verification of prior (iter-3) CRITICAL/MAJOR findings

Methodology: each prior finding checked for a *mechanism that survives its original counterexample*,
not a relabel.

| Prior | Status in v4 | Evidence (quoted) |
|---|---|---|
| **C3-1** (ingest-gate membership is replica-/time-local via drift-ε wall clock) | **GENUINELY FIXED** | The gate is now signature-validity ONLY. §3.2 step 2 (line 388): "THIS IS THE ONLY MEMBERSHIP PREDICATE… NOTHING else gates admission: NOT drift, NOT key-registration, NOT namespace authority, NOT revocation." The drift-ε wall-clock check is **deleted** from ingest (§4b.1 lines 1007–1024 replace it with a set-resident causal rule "**never at the gate and never against any receiver clock**"). §4b.4 proof step 1 (lines 1114–1126) now reads "admission is a pure function of the fact's bytes… reads no clock, no `rxFrom`, no partially-synced key log." INV-13 (line 1700) makes the convergence antecedent non-vacuous and **testable**. The C3-1 permanent-divergence counterexample is dead: every signature-valid fact is admitted everywhere. Sound. |
| **C3-2** (drift-ε rejection = silent durable data-loss; offline-first vs convergence mutually exclusive) | **GENUINELY FIXED** | §3.2 step 2 (line 391): "A signature-valid fact is ALWAYS admitted — even if old… All of those become proj-time DEMOTIONS, never drops." §4b.5/partition (lines 1167–1177): "signature-valid facts are never dropped… an offline replica that reconnects after an arbitrarily long partition has **all** its locally-authored facts accepted by every peer… with **no clock-skew / delivery-timing window**." Implausible facts are "**quarantined**… **never discarded**, and **re-evaluated as more facts arrive**." The offline/convergence contradiction is genuinely dissolved. Sound. (It is dissolved by *storing everything forever*, which is precisely what re-opens C4-1.) |
| **C3-3** (revocation keyed on self-stamped author-HLC ⇒ ε-width backdating band below `effectiveFrom`) | **FIXED for the revocation primitive, with a residual hole elsewhere (C4-2)** | §8.1 lines 1536–1567 add the **causal cutoff**: a revoked key's fact is demoted iff `author-HLC ≥ effectiveFrom` **OR** it is "**not a causal ancestor of the `revoke-key` fact**." A concurrent/backdated post-revocation fact "is **not** an ancestor of the revocation and is therefore demoted." This genuinely closes the band the prompt described *for a revoked key*: the attacker cannot insert a fact into the already-fixed causal history the revocation descends from. The "predict exactly" claim is corrected to include the causal-ancestor clause. **Sound for revoked keys.** (But backdating by a *non-revoked* registered key is still open — that is C4-2, a different and broader hole.) |
| **M3-1** (conflict-resolution non-termination / ping-pong) | **GENUINELY FIXED** | §3.4 lines 572–587 + §8.1 line 1508–1515: resolution is now **single-writer per `inputCids`** via the `resolve` scope; "among facts that strictly dominate both originals **and** carry the `resolve` scope, the cell takes the **`orderKey`-max** one." Termination argued: "any new dominating resolve must itself come from the single-writer authority… the set-pure `orderKey`-max among `resolve`-scoped dominators is the unique fixpoint." A non-`resolve` dominator "does **not** clear the conflict." Sound. |
| **M3-2** (`factSetDigest` pin unstable as set grows; no completeness predicate) | **GENUINELY FIXED** | §4c lines 1250–1270 + INV-14: a pin denotes `{ f ∈ S : f.authorHlc ≤ frontier[f.replicaId] }`; `factSetDigest` is the order-independent merkle root **of that subset**, recomputed from the current set. Typed `PinStatus = pin-incomplete | pin-complete`; "valid only when COMPLETE." Completion is monotone. Two complete replicas compute identical digests. The late-arriving sub-frontier hazard is explicitly handled. Sound. |
| **M3-3** (regenerated commit-DAG nondeterminism; signed-vs-unsigned contradiction) | **GENUINELY FIXED** | §4.5 lines 929–956: commit boundaries = deterministic `orderKey` rule pinned in manifest; timestamp = batch max author-HLC `wall`; committer = **fixed sentinel**; DAG is **UNSIGNED** (the "signed by regenerator" option is *dropped* — "it contradicts INV-12"). INV-12 (line 1688) asserts byte-identical regenerated DAG. The contradiction is resolved in favor of unsigned+sentinel. (Residual git-encoding nondeterminism is a MINOR, m4-3 below — not a reopening.) |
| **M3-4** (key-registration gate is a second membership-divergence axis) | **GENUINELY FIXED** | Registration is now a proj-time demotion: §3.6 lines 698–705 "Key-registration is a `proj`-time demotion, not an ingest gate… The moment the key's registration fact arrives… the fact **automatically becomes trusted** on re-fold… no fact is ever lost to a sync-order race." §8.1 lines 1499–1503 restate. INV-6 (line 1664) tests data-before-registration ordering. The gate is collapsed to the single byte-pure predicate. Sound. |
| **M3-5** (§4b.4 proof step 1 internally contradictory) | **GENUINELY FIXED** | Step 1 (lines 1114–1126) now claims only what signature-verification supports: "admission is a pure function of the fact's bytes… both [key-log + clock] are removed from membership and become proj-time demotions, step 2." The self-negating parenthetical is gone. The proof is now valid *as far as substrate convergence goes*. Sound. |
| **m3-1..m3-6** | **ADDRESSED** | m3-1 (no past-floor): moot — there is no clock gate at all now. m3-2 (`local_wall` undefined): moot — no receiver clock anywhere. m3-3 (frontier absent-replica): defined as `−∞`/excluded (§4c line 1214, INV-14). m3-4 (`fsck` ≠ convergence): stated explicitly (§8.3a lines 1619–1623). m3-5 (regen cost): incremental-from-excision-point (§4.5 lines 967–974). m3-6 (INV-2 vacuity): INV-13 added (line 1700). All have a stated mechanism. |

**Net:** All three v3 CRITICALs and all five MAJORs are *actually* fixed at the locus they were broken
— this is real mechanism-level work, not relabeling. The bright line is now drawn at the only sound
place (signature = sole membership predicate), the SEC antecedent is reachable, offline-first is
reconciled, and DAG regeneration is deterministic. **Credit where due.** The cost is that the spec
adopted "admit and store everything signature-valid, forever, never dropped" as its substrate
invariant — and never bounded the resource consequences. That, plus an anti-backdating rule that the
spec's own text shows is bypassable, are the round-4 defects.

---

## CRITICAL findings (v4)

### C4-1. Signature-only admission + grow-only-never-dropped + quarantine-still-stores = **unbounded resource-exhaustion DoS with no rate/quota/spam bound anywhere**. Any holder of any key — including an *unregistered* key, because registration is proj-time, not gate-time — can force every replica to admit and store unlimited facts forever. This is an availability/scalability hole that the v4 convergence fix *structurally created*.

**Location.**
- §3.2 step 2, line 388–391: "**THIS IS THE ONLY MEMBERSHIP PREDICATE**… NOTHING else gates admission…
  A signature-valid fact is ALWAYS admitted — **even if its key is not yet registered here, even if its
  key is revoked.** All of those become proj-time DEMOTIONS… **never drops**."
- §4b.5 / partition, lines 1167–1177: "**signature-valid facts are never dropped**… any fact that is
  still *causally implausible*… is **quarantined**… **never discarded**."
- §8.1 lines 1499–1503: "A fact signed by an **unregistered** key… is **admitted** by signature alone
  and **demoted `untrusted`/`quarantined` by `proj`**."
- §4b.2 line 1065: "The fact set `/facts/**` is a **grow-only set (G-Set)**… facts are only ever
  **added**, never removed."
- A full-text search for `rate`, `quota`, `spam`, `flood`, `back-pressure`, `admission control`,
  `resource`, `disk`, `DoS` across the entire SPEC returns **nothing** in this sense (§3.5 discusses
  *organic* growth and gc of *unreachable* objects only; line 610 "Bytes on disk… reclaimed **only by
  excision/gc of unreachable objects**" — and admitted facts are *reachable*, so gc never frees them).

**Why it fails.** The v4 trust model deliberately makes admission the cheapest possible predicate (one
Ed25519 verify) and makes the substrate **monotonic and irrevocable**: every signature-valid fact is
admitted on every replica and **never dropped** (it can only be *demoted in `proj`*, which still writes
the blob to `/facts/<shard>/<id>.json` and stores it forever; demotion changes the *projected value*,
not the *bytes on disk*). Combine the two and the attack writes itself:

1. **Generate a fresh Ed25519 keypair** (free, offline, no authorization needed). The key need **not**
   be registered, in-namespace, or chain to the genesis root — registration is a **proj-time** decision
   (M3-4 fix), so an *unregistered* key's facts are still **admitted to the set** (§8.1 line 1499–1503,
   verbatim). The gate cannot reject them; signature verifies.
2. **Sign and push millions of distinct facts.** Each distinct payload (vary `localId`, `value`,
   `validFrom`, `hlc.counter`) has a **distinct `factCID`** (§2.4 totality), so INV-7 idempotent dedup
   does **not** coalesce them — they are genuinely distinct G-Set elements.
3. Via Noms-style content-addressed sync (§4b.2), every peer fetches the missing blobs and **MUST admit
   them** (signature-only gate). Every replica's `/facts/**` grows without bound. The facts project
   `quarantined`/`untrusted` — *but the blobs are stored forever on every replica.* Quarantine is a
   projection label, **not** a storage decision; line 1175 says quarantined facts are "**never
   discarded**." Disk fills on every replica in the convergence group.

There is **no** rate limit, per-key quota, proof-of-work, stake, deposit, admission budget, or
backpressure anywhere in the spec. The only byte-reclaiming operation is `excise` (§4.5) — which
requires the `excise` **scope** (a privileged authorized key), is a *full history-rewrite* per
excision, regenerates the DAG `O(facts after excision point)`, and **cannot keep up** with an attacker
appending faster than an authorized operator can excise (and the attacker can append from unlimited
fresh unregistered keys, so there is no key to revoke that stops the flood — revocation demotes in
`proj` but **still does not drop the bytes**, §8.1 "demotes, does not delete (N5)", line 1525).

This is strictly **worse** than the censorship/DoS vectors the spec *does* carefully defend:

- §4.5 line 911–912 defends *unauthorized excision* ("a replica never deletes data on an unauthorized
  peer's say-so") — i.e. it protects against an attacker *removing* data. The spec spent real effort
  there. **It never protects against an attacker *adding* unlimited data**, which is the same
  availability outcome (replica unusable) achieved with **zero authorization**.
- The v3→v4 fix explicitly *chose* "never drop a signature-valid fact" to kill C3-2's data-loss. That
  choice is correct for honest offline facts but, **unbounded**, it converts every replica into an
  open, unauthenticated, append-only, never-GC'd public dump. Offline-first liveness and DoS-resistance
  are now in tension exactly where convergence and offline-first used to be (v3): the spec moved the
  contradiction, it did not retire it.

**Why CRITICAL.** It is a total availability break of every replica in a convergence group, reachable
by any network participant who can `push` (and §4b.5 line 1503 explicitly contemplates "a replica that
can merely `push`"). It defeats the system's purpose (a durable shared memory) and has no mitigation in
the current text. It is the direct, structural consequence of the v4 convergence fix and therefore
belongs to v4 specifically — v3's gate would have *rejected* unregistered-key facts at ingest
(wrongly, per M3-4, but it *did* bound this). v4 removed that bound to fix M3-4 and put **nothing** in
its place. This is the new headline weakness.

**Concrete fix (admission control WITHOUT re-breaking convergence — this is the hard part).** The
naive fix (reject unauthorized facts at the gate) re-opens C3-1/M3-4 (membership divergence). The fix
must keep membership a pure function of bytes while bounding resources. Options, in preference order:

1. **Make *durable storage* (not membership) the bounded resource, gated by set-resident authority — a
   "store-vs-admit" split that mirrors the gate-vs-proj split.** Define a deterministic, set-pure
   **retention predicate** in `proj`: a signature-valid fact whose signing key is **not** registered
   (no genesis-rooted `KeyAuthorization` ≤ its author-HLC) is admitted *logically* (so convergence and
   late-registration races are preserved — it counts as "received") but its blob is eligible for
   **bounded-buffer eviction** (a replica MAY drop the *bytes* of an unregistered-key fact under disk
   pressure, re-fetchable on demand if a registration later arrives). Crucially this must be specified
   so it does **not** make `proj` replica-dependent: eviction affects only *local storage of
   demoted-untrusted blobs*, never the projected value of any *trusted* fact, and an evicted unregistered
   fact projects identically (`quarantined`) whether stored or evicted. State precisely that trusted
   (registered-key) facts are never evicted and untrusted-unregistered facts contribute **nothing** to
   `/heads`, so dropping their bytes cannot change `proj`. This is the only fix that bounds the attack
   (unregistered keys are the unlimited-identity vector) while preserving the signature-only *membership*
   line for *registered* keys.
2. **Per-key admission budget enforced at the transport/sync layer (N4), explicitly out of `proj`.**
   Since deployment topology is already a client concern (N4), specify a normative **transport-layer
   rate/quota** keyed on the signing key fingerprint (and/or proof-of-work / deposit for unregistered
   keys) that a peer MAY apply when *accepting a push*, with the invariant that throttling only delays
   delivery and never permanently rejects a signature-valid fact from an *authorized* key (so eventual
   convergence among honest authorized replicas is preserved). State that this is a liveness/DoS control
   distinct from the convergence guarantee.
3. **At absolute minimum, state the threat in the security model.** §8 currently has no DoS/resource
   section. Add one acknowledging that signature-only admission + never-drop makes unbounded
   resource-exhaustion the residual attack, that excision/revocation do **not** bound it (they demote,
   not delete the bytes), and pin the chosen mitigation. The spec cannot claim "real PKI-style model"
   (§8.1 line 1490) while leaving every replica writable by unlimited unauthenticated keys.

Until one of these is in the text, kip is a coordinator-free convergent store that **any** participant
can render unusable by appending, and the §8 "Security" section is silent on it.

---

### C4-2. The anti-backdating causal-plausibility rule (rule 1, the load-bearing v4 replacement for the receiver-clock gate) **constrains nothing for a fact that omits `causedBy`** — and the spec *says so itself*. A registered, in-namespace, non-revoked key can backdate a `causedBy`-less fact to any author-HLC and it projects **fully trusted**. `causedBy` was demoted to OPTIONAL in rounds 1/3; v4 makes trust depend on it but left it optional and attacker-controlled.

**Location.**
- §4b.1 lines 1057–1061 (the spec's own admission): "(A fact may *omit* `causedBy`; then it has **no
  set-resident ancestry to violate, so causal-plausibility alone cannot demote it** — backdating of a
  `causedBy`-less fact is instead caught by the revocation causal-cutoff and by namespace/registration
  demotion.)"
- §4.1 line 761: "`causedBy?: FactId[];  // **OPTIONAL** same-replica causal parents`."
- §8.1 lines 1576–1579 (rule 1): "A fact's author-HLC must **dominate the author-HLC of every fact in
  its set-resident causal ancestry**; a fact stamped *before* facts it actually depends on is demoted."
- §3.6 lines 706–718: causal plausibility "iff its author-HLC does **not dominate** the author-HLC of
  every fact in its **set-resident causal ancestry** — i.e. the facts it causally depends on **via its
  signed `causedBy` edges**."

**Why it fails.** Walk the rule precisely. Rule (1)'s entire force is "author-HLC must dominate the
author-HLC of every fact in its **set-resident causal ancestry**," and the ancestry is **exactly** the
transitive closure of the fact's own **signed `causedBy` edges** (§4b.1 line 1051–1054 is explicit that
the trust rule reads the `causedBy` closure, *not* the transport DAG). `causedBy` is **author-supplied,
optional, and signed by the author**. Therefore the author controls its own ancestry set. Two trivial
evasions:

1. **Omit `causedBy` entirely.** Then the set-resident causal ancestry is **empty**. "Author-HLC
   dominates every fact in the empty set" is **vacuously true**. Rule (1) demotes **nothing**. The spec
   concedes this verbatim (lines 1057–1061). So a fact with no `causedBy` and an arbitrarily-low
   self-stamped author-HLC is **causally plausible by default**.
2. **Supply minimal/old ancestry.** Point `causedBy` only at genuinely-old facts (or the genesis fact),
   so the author-HLC still dominates them. Rule (1) is satisfied.

The spec's fallback — "backdating of a `causedBy`-less fact is instead caught by the revocation
causal-cutoff and by namespace/registration demotion" — **does not catch the common case**:

- **Revocation causal-cutoff** only fires for a key that has been **revoked**. A backdating attacker
  using a *legitimately registered, in-namespace, non-revoked* key (e.g. a compromised-but-not-yet-
  detected key, or an insider) is **never** subject to the revocation rule. There is nothing to revoke
  against.
- **Namespace/registration demotion** only fires for an *unregistered* or *out-of-namespace* key. A
  fact authored by a properly registered in-namespace key passes both.

So for the precise threat anti-backdating exists to stop — **a trusted key stamping a fact in the past
to win an `lww-hlc` race or forge history** (the "monotonic poisoning / backdating" concern OQ-7→core
explicitly names, §4b.1 line 1008–1010) — a `causedBy`-less backdated fact from a registered key
**sails through `proj` fully trusted** and, being `orderKey`-max'd by its (low or high) `wall`, can
either win or lose the cell deterministically — but it is **never demoted as anachronistic**, which is
the entire claimed defense. The rule that the whole v4 narrative calls "the only defense that
distinguishes a malicious backdate from an honest late fact" (§8.1 line 1585) is **inert against any
author who simply doesn't fill in the optional field they control.**

Worse, the dual case (**forward-poisoning**) is also unconstrained by rule (1) at authoring time: a
fact stamped with a far-future `wall` has no ancestry that *exceeds* it, so it trivially dominates its
(empty or old) `causedBy`. The spec hand-waves "a forward-poisoned fact's descendants expose it as it
accrues ancestry" (§4b.1 line 1019) — but (a) demotion of the poisoner depends on *other* honest
authors choosing to `causedBy`-link to it (writer diligence — which the spec elsewhere insists
correctness must *not* depend on, line 1040–1041, 1061), and (b) until/unless that happens the
forward-stamped fact **wins every `lww-hlc` race** in the interim, which is exactly the monotonic
poisoning the rule claims to prevent. There is no set-pure bound that the poisoner's own bytes violate.

**Why CRITICAL.** The anti-backdating/anti-poisoning rule is load-bearing for `lww-hlc` fairness
(OQ-7 was *promoted to core* as "correctness, not ops," line 1744) and for the v4 story that "backdating
is defended INSIDE proj" (§4.1 lines 775–789). The rule is **trivially evaded by omitting an optional,
author-controlled field**, and the spec's own text states this is the case while still presenting the
rule as the core defense. Either the defense is real (then `causedBy` cannot be optional/author-trusted
for in-namespace registered keys) or it is not (then the spec must retract the "backdating is defended
in proj" claim and state that a trusted key can freely backdate). As written it asserts a guarantee it
does not provide.

**Concrete fix (no clock may return — that was the whole point of v4).** A set-pure backdating bound
that does **not** depend on the author's own optional `causedBy`:

1. **Make the anti-backdating ancestry NON-author-controlled by deriving it from the substrate, not the
   author's self-declared edges.** Replace "the fact's *own* `causedBy` closure" with **a set-resident
   causal relation the author cannot under-declare** — e.g. the per-replica HLC monotonicity already
   guaranteed by the author's *own previous* facts: any fact `f` from replica `R`/key `K` must have
   `f.hlc` dominate the **max author-HLC of all prior facts from the same `(replicaId, key)`** in `S`.
   That is set-resident (all of `K`'s facts are in `S`), needs no `causedBy`, and a backdated fact from
   `K` is exposed because `K` *itself* already authored higher-HLC facts. (An attacker who never
   authored a higher-HLC fact has nothing to backdate *relative to*, which is the honest-late case —
   correctly admitted.) This is the per-author analogue of the revocation causal-cutoff, generalized to
   all facts, and it is **not** evadable by omitting an optional field because it reads the author's
   *involuntary* footprint in `S`.
2. **Require `causedBy` (or a signed `prevSelfHlc` back-pointer) on every fact, validated set-purely**,
   so "no ancestry" is itself a demotable malformation rather than a vacuous pass. State that a fact
   whose declared self-predecessor HLC is *below* a set-resident higher-HLC fact from the same key is
   demoted. (This is fix 1 made explicit on the envelope.)
3. **At minimum, retract the over-broad claim.** Delete "the only defense that distinguishes a malicious
   backdate from an honest late fact" (§8.1 line 1585) and state that anti-backdating for a *registered,
   non-revoked* key holds **only when the fact declares `causedBy` ancestry that actually covers its
   real predecessors** — i.e. it relies on author honesty for the field, and a `causedBy`-less fact from
   a trusted key is **not** anachronism-demoted. The reader must know the defense is opt-in by the
   attacker.

---

## MAJOR findings (v4)

### M4-1. The revocation causal-cutoff (the C3-3 fix) is sound against the attacker but produces **false-positive demotion of honest concurrent work**: a key's legitimately-authored facts that are merely *concurrent* with (not causal ancestors of) a revocation are demoted as if malicious. Honest in-flight writes are silently downgraded.

**Location.** §8.1 lines 1536–1549, rule 2: "an assert from a revoked key is demoted to untrusted iff…
it is **not a causal ancestor of the `revoke-key` fact**… any *concurrent*… fact from the compromised
key… is **not** an ancestor of the revocation and is therefore demoted." Line 1565: "Pre-`effectiveFrom`
facts that **the revoker causally observed** remain trusted forever."

**Why it's MAJOR.** The prompt asks both directions. The *malicious* direction is correctly closed
(good — verified above). But the rule demotes by a single criterion — "is this fact a causal ancestor
of the revoke fact?" — which **cannot distinguish a malicious concurrent backdate from an honest
concurrent write.** Concrete honest-loss scenario:

- Alice holds registered key `K`, authoring honest facts normally.
- Alice's laptop is *suspected* compromised; an admin revokes `K` with `effectiveFrom = T`, stamping
  `causedBy` to pin the causal frontier the admin observed.
- **Concurrently** (before Alice's machine received the revocation), Alice authors honest facts `F1..Fn`
  with author-HLC `< T`. These are genuinely honest, genuinely pre-`effectiveFrom` — but they are
  **not** causal ancestors of the revoke fact (the admin acted without having seen them; they're
  concurrent).
- Rule (2) demotes `F1..Fn` to **untrusted** — identical treatment to a malicious backdate.

The spec frames this as a feature ("only facts the revoker had already causally observed stay trusted,"
line 1547) — but in an offline-first system (the flagship property!) honest concurrent authorship
during the propagation window of a revocation is **normal**, not adversarial, and the rule has **no way
to tell them apart**. A precautionary revocation (revoke-on-suspicion, then investigate) therefore
**silently demotes an unbounded amount of honest concurrent work**, with the loss proportional to the
partition/propagation delay — which the spec elsewhere wants to be arbitrarily long (offline-first).
This is the symmetric cost of closing C3-3: the causal cutoff is a blunt instrument that treats
"concurrent with revocation" as "malicious."

This also interacts with N5 ("never silently picks/drops"): the honest facts are *demoted*, not
dropped, so they remain queryable — but the **default `lww-hlc` reducer ignores untrusted asserts when
a trusted assert covers the interval** (§3.6 line 695), so the honest concurrent value silently loses
to whatever else covers the cell. From the reader's perspective the honest data **vanishes from
`/heads`** with no signal that it was a false-positive revocation casualty rather than a genuine forgery.

**Concrete fix.** (a) Split revocation intent: a `revoke-key` SHOULD carry a flag distinguishing
**compromise-from-`effectiveFrom`** (demote only `author-HLC ≥ effectiveFrom`, the ordinary cutoff —
honest concurrent pre-`T` work survives) from **compromise-with-causal-cutoff** (the stronger rule 2,
used only when the revoker asserts the key was forging concurrently). Default to the weaker, less
destructive rule; require the stronger one to be explicit. (b) Where rule 2 *does* demote a concurrent
fact, project a distinct typed status (`untrusted-concurrent-with-revocation`, not generic
`untrusted-anachronistic`) so a reader/operator can re-adjudicate honest casualties via a `resolve`-scoped
re-assert, and so the loss is *surfaced* (N5) rather than buried in the generic untrusted bucket. (c)
State the honest-loss cost explicitly in §8.1; right now it is presented purely as a security win.

### M4-2. `causedBy` consistency ("a `causedBy` parent MUST have a ≤ author-HLC") is asserted as an invariant the rules rely on, but nothing **enforces** it set-purely, and it is not in any INV. A malicious author can forge `causedBy` edges to fabricate a "plausible" ancestry or to corrupt the closure other rules walk.

**Location.** §4b.1 lines 1055–1057: "Both `causedBy` and any diagnostic DAG-ancestry are constrained
to be **consistent with author-HLC order** (a `causedBy` parent MUST have a ≤ author-HLC), so they never
contradict the set-pure `orderKey`." §8.1 rule 2 walks "the signed `causedBy` closure" for revocation;
§3.6/§4b.1 rule 1 walks it for anti-backdating.

**Why it's MAJOR.** The trust rules (C4-2's revocation cutoff, the anti-backdating rule) **read the
`causedBy` closure as if it were a trustworthy causal relation.** But `causedBy` is author-supplied and
author-signed — the author can put **anything** in it (subject only to the asserted "≤ author-HLC"
constraint, which is itself unenforced in the text and absent from the INV list). Consequences:

1. **Manufactured plausibility.** An attacker backdating a fact to `wall = W` can populate `causedBy`
   with only facts whose author-HLC `≤ W` (genesis, or any old fact). Rule (1) then passes — the
   declared ancestry is dominated. The attacker *constructs* a consistent-looking ancestry that omits
   its real (higher-HLC) predecessors. This is the active-evasion version of C4-2's passive omission.
2. **Revocation-cutoff poisoning.** Rule (2) keeps a revoked key's fact trusted iff it is a causal
   ancestor of the revoke fact via the `causedBy` closure. The **revoke fact's** `causedBy` is authored
   by the revoker (fine), but the *closure* runs over **other facts' author-supplied `causedBy` edges**.
   A compromised key can author facts that **falsely claim** an honest high-HLC fact as a `causedBy`
   parent, splicing itself into ancestries to manipulate which facts count as "observed." The closure is
   only as trustworthy as the least-trustworthy `causedBy` edge in it.
3. **Unenforced "≤ author-HLC" constraint.** If a `causedBy` edge with a *parent author-HLC > child
   author-HLC* is admitted (signature-only gate admits it — the constraint is not a membership
   predicate), what does `proj` do? The text says such edges "never contradict orderKey" as if by
   assumption, but provides no demotion rule for a fact that *violates* it, and no INV tests it. The
   closure walk's termination and acyclicity also depend on this being enforced (a `causedBy` cycle, or
   a forward edge, could loop or invert the dominance check).

**Concrete fix.** (a) Add a set-pure **`causedBy` well-formedness demotion** to `proj`: a fact whose any
declared `causedBy` parent (resolved in `S`) has author-HLC **>** the fact's own author-HLC is demoted
(the edge is self-contradictory). State that unresolved `causedBy` parents (not yet in `S`) leave the
fact `pin-incomplete`-style pending, not trusted. (b) Acknowledge that `causedBy` is **author-asserted
and therefore only a *lower bound* on real causality** — it can omit real predecessors (C4-2) and can be
forged to include false ones; the trust rules that read it inherit this and **cannot** be stronger than
"the author truthfully declared its ancestry." Combined with C4-2's fix (derive anti-backdating from the
author's *involuntary* same-key footprint, not voluntary `causedBy`), the trust rules stop depending on
a field the attacker controls. (c) Add an INV asserting `causedBy` acyclicity + ≤-author-HLC + that a
violating fact is demoted.

### M4-3. Byte-identical regenerated-commit determinism (INV-12) depends on git object encoding details the spec never pins: commit-message encoding header, timezone representation of the author-HLC `wall`, and the absence of a GPG/SSH signature header. Any of these reintroduces per-replica CID divergence the regeneration was meant to kill.

**Location.** §4.5 lines 940–949 (timestamp = batch max author-HLC `wall`; sentinel committer; unsigned;
canonical message); INV-12 line 1688–1699 (byte-identical regenerated DAG).

**Why it's MAJOR.** v4 correctly nailed the *high-level* fields (timestamp source, committer identity,
unsigned, deterministic batching, canonical message). But a git commit object's bytes also depend on:

- **Timezone / offset rendering of the timestamp.** A git commit date is `<unix-seconds> <tz-offset>`.
  The author-HLC `wall` is `int64ms` — the spec says use it as the timestamp but never says **the offset
  MUST be a fixed `+0000`** and that sub-second precision is truncated deterministically (ms→s). A
  regenerator using local `$TZ` (git's default) yields `… +0200` on one replica and `… +0000` on
  another ⇒ different commit bytes ⇒ different CID. INV-12 would fail across replicas in different
  timezones, and the spec gives the implementer no instruction to prevent it.
- **Commit `encoding` header.** Git omits the `encoding` header for UTF-8 but writes `encoding <X>` for
  others. If a deterministic canonical message is ASCII this is moot, but the spec never *requires*
  ASCII/UTF-8-no-header, so a locale-influenced encoding header can differ.
- **Object hash algo interaction.** §3.1 fixes SHA-1-or-SHA-256 per group (good), but the regenerated
  commit must also be deterministic w.r.t. **line endings** in the message (CRLF vs LF — a Windows
  regenerator vs Linux). The spec's `.gitattributes` (§3.1) governs `/heads` and `/manifest.json` merge
  but says nothing about commit-message newline normalization.

These are exactly the "git env: TZ, line endings, commit encoding" residua the prompt names. None is
mentioned. INV-12 *asserts* byte-identity but the construction recipe (lines 940–949) omits the fields
that actually vary across environments.

**Concrete fix.** In §4.5, pin the full byte-level recipe: timestamp = `floor(wall/1000)` seconds with
a **fixed `+0000` offset**; commit message is **ASCII (or UTF-8 with no `encoding` header), LF-only, no
trailing-whitespace variance**; **no** GPG/SSH signature header (already implied by "unsigned" but state
it as "no `gpgsig` header"); author and committer **identical** (sentinel) so neither carries
per-replica bytes. Add these as explicit INV-12 sub-assertions so a cross-OS/cross-TZ test catches a
regenerator that leaks environment.

---

## MINOR findings (v4)

### m4-1. `pin-incomplete` decidability is unproven.
§4c line 1257 says a pin is complete iff "**every fact ≤ frontier has been received**." A replica
decides completeness by… what? It cannot enumerate facts it has never seen. The implicit assumption is
that `frontier[replicaId]` being an HLC and HLC being per-replica-monotone means "I have all of replica
R's facts ≤ `frontier[R]` iff I have R's fact at exactly `frontier[R]` and no gap below it" — but the
spec never states the **gap-freeness / contiguity** criterion that makes completeness *locally
decidable*. Without it, `pin-incomplete → pin-complete` cannot be evaluated. State the contiguity rule
(e.g. completeness for replica R requires an unbroken author-HLC counter chain up to `frontier[R]`),
or completeness is undecidable and INV-14 untestable.

### m4-2. Quarantine storage has no ceiling even for honest operation.
Independent of the C4-1 attack, honest causal-anachronism quarantine (line 1175 "quarantined… never
discarded… re-evaluated as more facts arrive") means every transiently-implausible honest fact is
stored pending re-evaluation **indefinitely** if the facts that would clear it never arrive (a
permanently-partitioned author). State a bound or a policy for quarantine that never clears.

### m4-3. `ε_causal` is a manifest parameter applied to the causal comparison but its semantics are under-specified.
§4b.1 line 1022–1024: "`ε_causal`… MAY be applied to the *causal* comparison to absorb honest
same-millisecond skew." Applied how — does a fact whose author-HLC is within `ε_causal` *below* a
causal ancestor pass (widening C4-2's evasion by `ε_causal`), or only same-`wall` ties? With C4-2 making
the causal rule evadable anyway this is secondary, but once C4-2 is fixed, `ε_causal`'s exact comparison
semantics determine the residual honest-tail and must be pinned.

### m4-4. INV-13's "within bounded time" is unbounded in an asynchronous model.
Line 1700–1709: "admitted by every replica that receives it, within bounded time." In a partition-
tolerant async system there is no bound on delivery; the honest claim is "admitted by every replica
**that receives it**, *upon receipt*" (eventual, not time-bounded). "Bounded time" overstates and is
untestable; restate as eventual-on-receipt.

### m4-5. `withScope` client-side write guard is the only thing stopping C4-1 from honest clients, and it is explicitly bypassable.
§3.6 line 719–722 / §8.2: `withScope` "refuses to *author* an EID outside the local key's authorized
namespaces" but "the authoritative cross-replica enforcement is the set-pure proj demotion… an
out-of-scope fact that nonetheless reaches the set is uniformly demoted." This correctly notes the
client guard is advisory — but it means the *only* gate on write volume is a client-side check the
attacker simply doesn't run (C4-1). Worth cross-referencing from the (missing) §8 DoS section.

---

## Cross-cutting assessment

- **All three v3 CRITICALs and all five v3 MAJORs are genuinely fixed at their locus.** Signature-only
  admission is the correct bright line; the SEC antecedent is now reachable and *testable* (INV-13);
  offline-first and convergence are reconciled; DAG regeneration is deterministic and the signed/unsigned
  contradiction is resolved; conflict resolution is single-writer-terminating; pins have a completeness
  predicate. This is the strongest revision in the series and most of the round-3 critique is
  satisfied. Credit where due.

- **The fix's cost is unbounded resources, and the spec never bounds them (C4-1).** "Admit and store
  every signature-valid fact forever, never drop" is exactly what makes convergence + offline-first
  compatible — and exactly what makes every replica an open, unauthenticated, never-GC'd append target.
  Membership purity was bought with availability. The pattern across all four rounds is the same: each
  revision purifies one layer by pushing the cost to an adjacent one (v1 fold→v2 proj→v3 membership→v4
  *storage/availability*). v4's push landed on resource-exhaustion. This is the new headline.

- **The anti-backdating rule rests on an attacker-controlled optional field (C4-2).** Rounds 1/3 demoted
  `causedBy` to an optional hint precisely because requiring it was unsound; v4 then made the core trust
  rule *depend* on it without re-promoting it or deriving ancestry from involuntary substrate evidence.
  The spec's own text (lines 1057–1061) concedes the `causedBy`-less bypass while still presenting the
  rule as "the only defense." For a registered, non-revoked key this is a clean backdating/poisoning
  escape.

- **Closing C3-3 opened a symmetric honest-loss hole (M4-1).** The revocation causal-cutoff cannot
  distinguish malicious-concurrent from honest-concurrent; in an offline-first system honest concurrent
  authorship during revocation propagation is normal and gets silently demoted.

- **Two trust rules read a forgeable, author-supplied causal relation (M4-2)** with the consistency
  constraint they rely on left unenforced and untested.

- **Determinism residue is now small but real (M4-3):** the *projection* and *trust overlay* are
  genuinely set-pure (re-audited: quarantine/untrusted labels, pin-status, conflict markers, existence
  gating are all pure functions of `S` — good); the residual nondeterminism is at the **git commit
  encoding** layer (TZ/line-endings/encoding header), which INV-12 asserts away without specifying the
  recipe that achieves it.

- **The conformance suite is much improved** (INV-13 makes the substrate-convergence antecedent testable;
  INV-14 tests pin completeness; INV-6 tests data-before-registration). **But no INV tests C4-1
  (resource bound), C4-2 (`causedBy`-less backdate stays trusted), M4-1 (honest-concurrent revocation
  casualty), or M4-2 (forged `causedBy`).** The suite would green-light a build with all four. The
  blind spot moved from "membership divergence" (v3) to "resource exhaustion + backdating-via-omission."

---

## Biggest weakness

**Signature-only admission combined with a grow-only, never-dropped substrate and quarantine-that-still-
stores makes every replica an unbounded, unauthenticated, never-GC'd append target: any holder of any
key — including unregistered keys, since registration is proj-time, not gate-time — can force every
replica to admit and store unlimited facts forever, with no rate, quota, spam, deposit, or resource
bound anywhere in the spec, and neither excision nor revocation reclaims the bytes (both demote, not
delete).** This is the structural cost of the (correct) v4 convergence fix: to make membership a pure
function of bytes and reconcile offline-first with convergence, v4 had to admit-and-keep everything
signature-valid — and it bounded the resource consequences nowhere. The §8 "real PKI-style" security
model is silent on the one attack that needs no authorization at all. The fix must bound *durable
storage* (a set-pure retention/eviction rule for unregistered-key facts, and/or a transport-layer
per-key quota out of `proj`) without re-introducing a membership gate, so that registered honest authors
still converge while the unlimited-identity flood vector is contained. A close second is C4-2: the
anti-backdating causal rule the entire v4 trust narrative rests on is defeated by omitting the optional,
author-controlled `causedBy` field — the spec concedes this in its own text — so a registered,
non-revoked key can backdate or forward-poison `lww-hlc` cells with a fully-trusted projection.
