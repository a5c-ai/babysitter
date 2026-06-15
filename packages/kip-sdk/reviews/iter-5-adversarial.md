# Adversarial Red-Team Review — `@a5c-ai/kip-sdk` SPEC v4-final (iter-5, round 5)

> Reviewer stance: ruthless, specific, break-it. Round 5. v4-final's job was to resolve the two
> round-4 CRITICALs (C4-1 unbounded-DoS, C4-2 backdating-via-omitted-`causedBy`) and three MAJORs
> (M4-1 honest-concurrent revocation loss, M4-2 unenforced `causedBy` well-formedness, M4-3 git
> byte-recipe). **Verdict up front: all five round-4 findings are genuinely fixed at mechanism level,
> not relabeled.** The convergence core (signature-only gate, proj-purity, SEC) survives a fourth
> audit intact. But the *form* of the round-4 fixes — separating LOGICAL membership from DURABLE
> STORAGE, and weakening SEC to "per-shared-subset" — opens a **new headline weakness the prompt
> predicted**: the C4-1 retention power and the C4-2 residual **compose**. A holder of a *registered*
> service key whose facts a victim replica is induced to evict/never-replicate can backdate against
> that victim with the per-key monotonicity check **silently disabled**, because the higher-stamped
> honest facts that would trip the involuntary rule are not in *that replica's* `S`. The set-pure
> primary defense is only as strong as the weakest replica's durable subset — and v4 just made the
> durable subset replica-dependent by design.

---

## Verification of prior (iter-4) findings — fixed, or relabeled?

Methodology: for each finding, locate the *mechanism* claimed to fix it, check it survives the original
counterexample, and check it did not merely move the defect to an adjacent claim.

| Prior | Status in v4-final | Evidence (quoted) + verification |
|---|---|---|
| **C4-1** (unbounded resource-exhaustion DoS: signature-only admit + never-drop + quarantine-still-stores) | **GENUINELY FIXED (for the unregistered-key flood; residual honestly stated)** | §3.5a introduces the **second bright line**: LOGICAL membership stays signature-only (G-Set, SEC verbatim), DURABLE STORAGE is a transport-layer policy. The set-pure `RetentionClass` (line 705) has `durable | quarantined-ttl | evicted`; an unregistered key's facts are `quarantined-ttl` (per-key cap + TTL, line 714), eviction-eligible. The key soundness claim — line 717: "an evicted unregistered fact contributes **nothing** to `/heads` whether stored or evicted (it projected `quarantined`, which never covers a cell), so dropping its bytes **cannot change `proj`** of any *trusted* fact" — is **correct**: a `quarantined` fact is ignored by `lww-hlc` when a trusted assert covers the cell (§3.6 line 807), so its presence/absence is value-neutral. §8.3b adds the missing DoS threat-model section. The bound is honestly scoped (line 741): "**no UNREGISTERED key can force unbounded DURABLE growth on any replica that applies the default retention policy.**" The residual (registered insider; opt-out replica) is stated, not hidden. This is the round-4 fix landed at the right layer. **Sound.** |
| **C4-2** (anti-backdating defeated by omitting optional author-controlled `causedBy`) | **GENUINELY FIXED (primary defense is now involuntary; residual conceded precisely)** | §3.6 lines 819–841 + §4b.1 lines 1184–1193 + §8.1 lines 1804–1809 make the **PRIMARY** rule **per-key author-HLC monotonicity**: a fact `F` from key `K` is demoted iff `S` holds a higher-author-HLC non-ancestor fact from the **same** `K`. This reads `K`'s *involuntary* footprint — "`K` cannot un-emit its higher-stamped facts" (line 830) — so it is **not** evadable by omitting `causedBy`. `causedBy` is demoted to a *secondary tightening* check (line 842) explicitly labeled "a **lower bound** on real causality" (line 848). The over-strong v3 claim is **retracted** (line 841, line 1821). INV-16 (line 2004) is the regression test the v4-iter-4 suite lacked: it authors a higher-stamped fact, then a `causedBy`-less backdate from the same key, and asserts demotion. The omission attack from iter-4 is dead. **Sound** — within its honestly-stated bound (a key with no higher same-key fact can still self-date; see new finding C5-1 for why that bound is load-bearing under partial replication). |
| **M4-1** (revocation causal-cutoff demotes honest concurrent work indistinguishably) | **GENUINELY FIXED** | §8.1 lines 1740–1751 add `mode: "ordinary-cutoff" | "causal-cutoff"`. Default is `ordinary-cutoff` (demote only author-HLC ≥ effectiveFrom, line 1758) which **preserves honest concurrent pre-`T` work**. `causal-cutoff` is opt-in for compromise and **surfaces** honest casualties with the distinct status `kip:revoked-concurrent` (line 1779) — not the generic untrusted bucket — re-adjudicable via a `resolve`-scoped re-assert. The honest-loss cost is stated explicitly (lines 1772–1777), reversing iter-4's "presented purely as a security win." INV-17 (line 2012) tests both modes. **Sound.** |
| **M4-2** (`causedBy` ≤-author-HLC consistency asserted but unenforced/untested; forged ancestry) | **GENUINELY FIXED** | §3.6 lines 849–855 + §4b.1 lines 1232–1235 add a **set-pure `causedBy` well-formedness demotion**: a fact whose any resolved-in-`S` `causedBy` parent has author-HLC > the child's is demoted `untrusted-malformed`; a cycle is demoted; an unresolved parent leaves the fact **pending**, not trusted. INV-15 (line 1998) tests forward edge, cycle, and dangling parent. The forged-ancestry concern (iter-4 M4-2 case 1/2) is structurally neutralized because the **primary** rule no longer reads `causedBy` at all — forging `causedBy` cannot help an attacker pass the involuntary per-key check. **Sound.** |
| **M4-3** (git byte-recipe: TZ, line endings, encoding header, gpgsig) | **GENUINELY FIXED** | §4.5 lines 1093–1118 pin the full recipe: timestamp = `floor(wall/1000)` integer-seconds, **fixed `+0000`**, never local `$TZ`; identical sentinel author==committer; **unsigned** (no `gpgsig`); message UTF-8 no-`encoding`-header, LF-only, `core.autocrlf=false`. Line 1114 names the exact git env normalization (`TZ=UTC`, `core.autocrlf=false`, `commit.gpgSign=false`, `i18n.commitEncoding=UTF-8`, sentinel user). INV-12 (lines 1971–1976) runs the regenerator cross-OS/cross-TZ (`+0200` vs `+0000`, mismatched autocrlf/locale) and asserts byte-identity. **Sound.** |

**Net on prior findings:** all 2 CRITICAL + 3 MAJOR are fixed at mechanism level, with new INVs
(15–18) covering each. This is genuine work, not relabeling. **Credit where due.** The recurring
pattern across five rounds also recurs here, though: each fix purifies one layer by pushing cost to an
adjacent one (v1 fold → v2 proj → v3 membership → v4 storage/availability → **v4-final: the SEC
*guarantee itself* weakens to per-shared-subset, and that weakening composes with the C4-2 residual**).
That composition is the round-5 headline.

---

## CRITICAL findings (v5)

### C5-1. The C4-1 retention power and the C4-2 residual COMPOSE into a real backdating attack against a victim replica. An attacker holding a *registered, in-namespace, non-revoked* service key can backdate a fully-trusted fact onto a victim replica whenever that replica's durable subset does not contain the attacker's own higher-stamped honest facts — which §3.5a now makes *normal and replica-chosen*. The involuntary per-key monotonicity check (the C4-2 primary defense) is a pure function of the *local* set, and partial replication makes the local set an attacker-influenceable subset.

**Location.**
- §3.6 lines 825–833 (primary rule): "A fact `F` from key `K` is demoted `untrusted-anachronistic`
  **iff `S` contains** another admitted fact `F'` from the **same key `K`** with `author-HLC(F') >
  author-HLC(F)`…" — the rule quantifies over `S`, the *replica-local* held set.
- §4b.4 corollary, lines 1297–1309: "When replicas apply admission-control/retention policies (§3.5a)
  they may hold **different subsets**… SEC is then stated **per-shared-subset**." So `S` is, by design,
  not the same across replicas.
- §3.5a lines 722–725: "**Eviction is local and policy-driven, so two replicas may hold different
  SUBSETS** of the `quarantined-ttl` facts… This is a **partial-replication** model."
- §8.3b line 1887: the residual insider "registered key is the insider threat, bounded instead by
  per-key quota (§3.5a) + revocation (§8.1)" — but **neither quota nor revocation is the per-key
  monotonicity check**, and the spec never re-examines whether the monotonicity check itself survives
  partial replication.

**Why it fails.** The C4-2 fix rests entirely on this sentence (§3.6 line 830): "`K` **cannot un-emit**
its higher-stamped facts, so the bound reads only `K`'s involuntary same-key facts **in `S`**." That is
true for the *global* fact universe. But `proj` is defined as a pure function of **whatever set the
replica holds** (§3.5a line 681: "`proj` stays a pure function of whatever set a replica holds"), and
v4 *deliberately* makes the held set a replica-chosen subset. The monotonicity rule therefore fires
**only if the contradicting higher-stamped fact `F'` is in the *victim replica's local `S`***. If it is
not, the backdate `F` projects **trusted** on that replica — fully, with no demotion — exactly the
outcome C4-2 was created to prevent.

The attacker does not need to "un-emit" `F'`; the attacker needs `F'` to be **absent from the victim's
durable subset**. Two concrete, in-spec routes to that absence:

1. **Eviction of the contradicting fact.** Whether `F'` is `durable` or `quarantined-ttl` depends on
   *whether `K` is a registered key at `F'`'s author-HLC* (§3.5a line 706). Consider a key `K` that was
   **registered late**: `F'` (the honest high-stamped fact) was authored *before* `K`'s
   `KeyAuthorization.effectiveFrom`. By the registration rule (§3.6 line 798: authorized iff author-HLC
   ≥ effectiveFrom), `F'` projects **untrusted** (pre-registration) and therefore computes
   `RetentionClass = quarantined-ttl` (§3.5a line 707 — "unregistered / untrusted / anachronistic"),
   making it **eviction-eligible**. The victim replica, applying the default retention policy under disk
   pressure, **evicts `F'`**. Now the attacker pushes a backdated `F` (author-HLC below `F'`, but ≥
   `effectiveFrom`, so `F` is *registered-trusted*). On the victim, `S` no longer holds `F'`, the
   per-key monotonicity rule finds no higher same-key fact, and `F` projects **trusted** and wins its
   `lww-hlc` cell. The honest `F'` (evicted) cannot contradict it. Convergence is not violated — both
   replicas are "correct" over their own sets — but the victim's `/heads` now carries an attacker's
   backdate as trusted truth.

2. **Selective non-replication.** §3.5a line 690 lets a replica gate *which signature-valid facts it
   replicates* "when accepting a push or fetching." An attacker who controls a relay/peer in the victim's
   sync path (or the victim's own permissive-but-capped policy) can simply **never deliver `F'`** to the
   victim while delivering `F`. There is no completeness obligation on the *durable* subset — only the
   *pin* contract has a completeness predicate (§4c, INV-14), and trust-time `proj` does **not** require
   pin-completeness. So `proj` will happily project a backdate trusted over an incomplete local set.

**Why this is the headline and not a restatement of C4-2.** C4-2 (iter-4) was: "omit the optional field,
defeat the rule." v4 fixed that by making the rule read involuntary same-key facts. **C5-1 is: the
involuntary same-key facts are no longer guaranteed to be in the set the rule quantifies over, because
v4-final itself made the held set a replica-dependent subset.** The two round-4 fixes are individually
sound but **mutually undermining**: C4-1's fix (partial replication / eviction) removes the very
substrate evidence C4-2's fix depends on. The spec's own proof of the primary rule's soundness
("reads only `K`'s involuntary same-key facts in `S`") silently assumes `S` is complete for `K` — an
assumption the SEC corollary explicitly **abandons**.

**Why CRITICAL.** It re-opens the exact threat C4-2 was promoted-to-core to close (trusted backdating to
win `lww-hlc` / forge history, OQ-7→core), now reachable by a *registered* key (so revocation has
nothing concurrent to bite, and the §8.3b "insider bounded by revocation" mitigation does not apply to
backdating that predates suspicion), and it is reachable through **in-spec, default-policy** behavior
(late registration + eviction under disk pressure), not an exotic deployment. The anti-backdating
guarantee, which the spec presents as a set-pure invariant (INV-16), is in fact only a *per-replica,
per-held-subset* property — and the spec never states that bound.

**Concrete fix.** The per-key monotonicity rule must be made **completeness-gated**, exactly as the pin
contract already is (INV-14), or the anti-backdating claim must be explicitly scoped to a complete
durable subset:

1. **Gate trust on per-key completeness.** A fact `F` from `K` may project **trusted** only if the
   replica holds a **gap-free `(wall,counter)` chain for `K` up to `F`'s author-HLC** (the same
   contiguity rule §4c/m4-1 already defines for pins). If the chain has a gap below `F` (a same-key
   fact is missing/evicted), `F` is `pin-incomplete`-style **pending-trust**, not trusted — so an
   evicted/withheld `F'` makes `F` *pending*, never *trusted-by-default*. This closes the route while
   staying set-pure (it reads only local-chain contiguity, which is locally decidable).
2. **Make a key's own facts NEVER eviction-eligible relative to that key's later facts.** Strengthen
   §3.5a: a `quarantined-ttl` fact from key `K` MUST NOT be evicted while the replica also holds a
   *trusted* fact from `K` whose monotonicity check would otherwise read it. (Couples retention to the
   trust evidence it underwrites — narrower than fix 1 but addresses route 1.)
3. **At minimum, state the bound honestly.** INV-16 and §3.6 must say: anti-backdating holds **only over
   a durable subset that is complete for the authoring key**; under partial replication a replica
   missing a key's higher-stamped facts may project a backdate from that key as trusted. Right now the
   spec asserts the involuntary rule as unconditional (INV-16) while the SEC corollary quietly makes its
   premise (complete `S` for `K`) false.

---

## MAJOR findings (v5)

### M5-1. The per-shared-subset SEC corollary is **honest about durable convergence but quietly weaker than v3**, and the spec presents it as "SEC core not regressed" — it IS regressed for any cell whose covering facts are not all durable. The prompt's A={1,2,3} / B={2,3,4} disagreement is real and only neutralized by the (load-bearing, under-stated) claim that all non-shared facts project nothing.

**Location.** §4b.4 corollary, lines 1297–1309: "on the INTERSECTION `S_A ∩ S_B`… `proj` agrees…
because… **eviction only ever removes `quarantined-ttl` (non-durable, `proj`-`quarantined`) facts**…
Membership purity (signature-only) is preserved; availability is bounded; the SEC core is **not**
regressed."

**Why it's MAJOR.** The corollary's correctness rests *entirely* on one load-bearing premise: **only
`proj`-`quarantined` facts are ever evicted, and quarantined facts cover no cell.** Verify the premise
and you find it is exactly as strong as C5-1 is weak:

- For **durable** facts the claim holds — they are never evicted (§3.5a line 712), so the durable subset
  behaves as the full-replication theorem. **This part is sound and honestly stated.**
- But "the SEC core is **not** regressed" is **over-stated**. v3's SEC was: equal *received* sets ⇒
  byte-identical heads, full stop. v4-final's SEC is: equal *durable* subsets ⇒ identical heads on the
  durable subset, **and** held subsets may legitimately differ on everything else. For any cell whose
  authoritative value depends on a fact that is `quarantined-ttl` on one replica and evicted on another,
  the two replicas **can** read differently — and per C5-1, a `quarantined-ttl` fact is **not** always
  value-neutral (a *pre-registration* fact is quarantined-ttl *and* would have been the
  monotonicity-contradicting evidence; evicting it changes whether a *later* trusted fact is demoted).
  So "evicting a quarantined fact never changes a trusted projection" is **false in the precise case
  C5-1 exploits**: the quarantined fact's *absence* flips a different (trusted) fact from
  demoted-anachronistic to trusted. The corollary's premise (ii) — "eviction… cannot make a *trusted*
  cell differ" — is the exact statement C5-1 falsifies.

The prompt's A={1,2,3}/B={2,3,4} framing is answered correctly *for fully-durable facts* (both compute
heads over their own set, but disagreement is confined to non-durable facts that project nothing) — but
the spec should not claim "not regressed." It IS a strictly weaker guarantee than v3, and the honest
statement is: **convergence is now guaranteed only on the durable subset, and only when the durable
subset is per-key complete (C5-1).**

**Concrete fix.** (a) Reword line 1308 from "the SEC core is **not** regressed" to "the SEC core is
**preserved on the durable subset**; full-universe byte-identity is **relaxed** to per-shared-subset —
a deliberate, weaker guarantee that is the price of bounded storage." (b) Add the C5-1 caveat: the
per-shared-subset corollary holds for *value-neutral* eviction; pin the invariant that an evicted
quarantined fact is value-neutral **only if it is not the monotonicity-contradicting evidence for a
trusted same-key fact** (the C5-1 coupling). (c) INV-18(c) tests "two replicas with different evicted
subsets agree on `S_A ∩ S_B`" — extend it to assert that eviction of a *pre-registration same-key*
fact does **not** flip a later same-key fact from demoted to trusted (the C5-1 regression test).

### M5-2. No mode of revocation both stops a compromised backdater AND preserves honest concurrent work. The spec ships the two horns (ordinary-cutoff loses to the backdater; causal-cutoff loses honest concurrency) and surfaces casualties — but never states the impossibility, leaving a reader to assume a "right" mode exists.

**Location.** §8.1 lines 1758–1771 (the two modes); the prompt asks directly whether any mode achieves
both.

**Why it's MAJOR (and why it's MAJOR-not-CRITICAL).** Walk both modes against a *compromised* key (the
attacker can stamp any author-HLC):

- **`ordinary-cutoff`** demotes only author-HLC ≥ `effectiveFrom`. A compromised key stamps the forged
  fact with author-HLC **< `effectiveFrom`** and it is **not demoted** — the attacker simply backdates
  below the cutoff. So ordinary-cutoff **does not stop a compromised backdater** (this is precisely the
  C3-3 band; it survives for ordinary-cutoff by construction).
- **`causal-cutoff`** demotes every non-ancestor of the revoke fact, which **does** catch the
  sub-`effectiveFrom` backdate — but also demotes honest concurrent pre-`T` work (M4-1, conceded).

These are the two horns of a genuine **impossibility**: to stop a backdater you must distinguish
"forged fact stamped in the past" from "honest fact stamped in the past," and the **only** set-resident
discriminator is causal-ancestry-of-the-revocation, which by definition cannot include facts the
revoker had not yet observed — i.e. honest concurrent work is *indistinguishable* from a concurrent
backdate to any set-pure rule. The C5-1 per-key monotonicity rule helps *only if* the compromised key
also emitted higher-stamped honest facts that are in `S` (and per C5-1 they may be evicted/withheld).
So: **there is no mode that both stops a compromised backdater and preserves all honest concurrent
work.** The spec implements the honest engineering response (two modes + surfaced casualties +
re-adjudication) but **never states the impossibility**, so a reader is left believing the "right" mode
choice avoids the tradeoff. It does not.

**Concrete fix.** Add one sentence to §8.1 after line 1794: "**Impossibility (stated honestly).** No
set-pure revocation mode can simultaneously (a) demote a compromised key's sub-`effectiveFrom`
backdates and (b) preserve that key's honest concurrent sub-`effectiveFrom` work, because both are
'past-stamped, non-ancestor-of-the-revocation' and are set-indistinguishable. `ordinary-cutoff`
chooses (b) over (a); `causal-cutoff` chooses (a) over (b) and surfaces the (b) casualties as
`kip:revoked-concurrent` for human re-adjudication. The choice is intrinsic, not a missing feature."

---

## MINOR findings (v5)

### m5-1. `quarantineKeyCapBytes` per-key cap is keyed on the signing-key fingerprint, which an attacker mints freely — so the *aggregate* quarantine ceiling is `capBytes × (#distinct keys)`, i.e. unbounded again.
§3.5a line 714 caps `quarantined-ttl` storage **per key**. But the C4-1 attack's whole premise (§8.3b
line 1873) is "unlimited **fresh unregistered keys**." A per-key cap of `C` bytes bounds *one* key but
the attacker uses `N` keys for `N×C` total. The TTL (line 714) is the real ceiling (time-bounded
eviction regardless of key count); the per-key *byte* cap alone is not. State that the **aggregate**
quarantine pool is bounded (a global `quarantined-ttl` byte budget with LRU/TTL eviction across all
keys), not only per-key — otherwise the multi-key flood refills the pool faster than TTL drains it.

### m5-2. INV-18(b) "durable bytes are bounded" is asserted but the bound is never quantified, and "applies the default retention policy" is the unstated antecedent of every C4-1 claim.
Lines 2024–2026 assert durable bytes stay bounded under flood, but §3.5a line 737–739 concedes a
permissive replica "is still exposed to disk growth — admission control is a **MAY**." So INV-18(b) is
true **only** for a replica running the (unspecified-aggressiveness) default policy. The INV should name
its antecedent ("under the default retention policy") so it is not read as an unconditional guarantee;
otherwise a conformant build with a permissive policy "passes" while remaining floodable.

### m5-3. `kip:revoked-concurrent` re-adjudication uses a `resolve`-scoped re-assert, but `resolve` scope was defined for `kip:conflict` adjudication (§3.4/M3-1), not for un-demoting a revocation casualty — the semantics of "resolve a revoked-concurrent fact" are unspecified.
§8.1 line 1781 says casualties are "re-adjudicable via a `resolve`-scoped re-assert," but a re-assert is
a *new fact from a new (non-revoked) key*, not a `supersede` over `inputCids` (which is what `resolve`
scope adjudicates). The mechanism by which a `resolve`-scoped actor restores a `kip:revoked-concurrent`
honest value to trusted is not specified. Either define a `re-attest` fact type (a trusted key
re-asserting the demoted value's content, so it projects trusted under the new key) or correct the
cross-reference; as written the recovery path is named but not mechanized.

### m5-4. m4-2 (permanently-partitioned honest author's never-clearing quarantine) is fixed for *unregistered* keys (quarantine-ttl) but a *registered* key's transiently-anachronistic fact is `durable` and `never evicted` (§4b.4 line 1377) — so an honest registered author whose clearing facts are permanently partitioned away keeps an unbounded `durable` anachronism quarantine with no ceiling.
The spec trades the m4-2 unbounded-quarantine for unregistered keys against an unbounded **durable**
quarantine for registered keys (line 1377: a quarantined fact from a registered key "is `durable` (never
evicted)"). That is the correct safety choice (never lose honest data), but it means the honest-operation
quarantine ceiling m4-2 asked for still does not exist for registered keys — it is only *moved* to the
durable pool. State this explicitly (it is a smaller, authenticated, quota-bounded pool, so acceptable —
but it is not "bounded," it is "bounded per registered key by quota").

### m5-5. INV-16's residual ("a lone self-dated fact from a key with no higher same-key fact projects trusted") is tested as acceptable, but C5-1 shows the residual is reachable by *eviction* of the higher fact, not only by genuine absence — so the INV's "no higher same-key fact" antecedent must be "no higher same-key fact **in the complete durable chain**," or the test passes a build vulnerable to C5-1.
Line 2009 asserts the lone-self-date case projects trusted "the acknowledged acceptable residual." But
C5-1 makes "no higher same-key fact" achievable by eviction/withholding, not only by the key genuinely
never emitting one. INV-16 must distinguish "key emitted nothing higher (genuine)" from "higher fact
exists but is not in this replica's set (C5-1)" — and assert the latter projects **pending**, not
trusted. As written, INV-16 green-lights C5-1.

---

## Re-verification of the convergence core (4th audit)

The prompt asked to re-verify the core once more. Result: **the core is intact.** Specifically:

- **Signature-only gate** (§3.2 lines 423–443, §4b.4 step 1 lines 1312–1324): admission still reads only
  well-formedness + Ed25519 over the canonical payload; no clock, no `rxFrom`, no key-log, no revocation.
  The canonical payload (§2.4 line 317) covers every author/replica/version field, so distinct facts
  never collide on `factCID`. **Sound.**
- **proj-purity** (§4b.4 step 2 lines 1325–1345): `orderKey` reads only author-stamped set-resident
  fields, ends in `publicKeyFingerprint` then `factCID` (total order, INV-3). All trust demotions
  (registration, namespace, revocation, anti-backdating) are keyed on author-HLC over `S`. **The
  newly-introduced `RetentionClass` is correctly excluded from `proj` values** (§3.5a line 701: "not a
  `proj` *value* and never feeds `/heads`") — it is set-pure *metadata*, so it does not break proj-purity.
  **Sound.** The one crack is not in proj-purity per se but in what `S` *is* under partial replication
  (C5-1/M5-1).
- **SEC theorem** (§4b.4 lines 1291–1296): correct for equal *durable* sets. The corollary correctly
  scopes partial replication — its only flaw is the over-stated "not regressed" (M5-1) and the unproven
  value-neutrality of quarantined eviction in the C5-1 case.
- **INV-15..18 testability:** INV-15 (causedBy well-formedness — forward/cycle/dangling), INV-17
  (revocation modes + `kip:revoked-concurrent` surfacing) are **concrete and testable** as written.
  INV-16 (per-key anti-backdating) is testable **but incomplete** (m5-5: must add the C5-1 eviction
  case). INV-18 (retention/partial-SEC) is testable but its (b)/(c) need the C5-1 and aggregate-cap
  amendments (M5-1/m5-1/m5-2). No INV is *false*; two are *incomplete* against the new attack.

No residual non-determinism in `proj` itself was found (quarantine/untrusted/`kip:revoked-concurrent`
labels, `RetentionClass`, pin-status, conflict markers, existence gating are all pure set functions).
The git-encoding residue (M4-3) is genuinely closed by recipe. The remaining weakness is **not**
determinism — it is that v4-final made `S` a per-replica subset and the anti-backdating defense reads
`S`.

---

## Cross-cutting assessment

- **All five round-4 findings are genuinely fixed at their locus** (verified mechanism-by-mechanism
  above), with new conformance invariants (INV-15..18) for each. Strongest revision since iter-3's gate
  fix. Credit where due.

- **The two round-4 fixes are individually sound but mutually undermining (C5-1).** C4-1's fix
  (partial-replication + eviction) removes the substrate evidence C4-2's fix (involuntary per-key
  monotonicity over `S`) depends on. The anti-backdating guarantee is silently downgraded from
  "set-pure invariant" to "per-replica, per-complete-durable-subset property," and the spec asserts the
  former (INV-16) while its own SEC corollary makes the latter's premise false. **This is the new
  headline.**

- **The partial-replication SEC is honestly bounded for durable facts but over-claims "not regressed"
  (M5-1).** It IS a weaker guarantee than v3; the honest statement is "preserved on the complete durable
  subset." The A/B-disagree case is answered correctly *modulo* the C5-1 hole in value-neutrality.

- **The revocation impossibility is implemented but not stated (M5-2).** Two modes + surfaced casualties
  is the right engineering answer; the spec should say plainly that no mode achieves both halves, so a
  reader does not hunt for a mode that does not exist.

- **Reward for honest bounds:** the spec is unusually candid — it concedes the C4-2 residual (line 836),
  the causal-cutoff honest-loss (line 1772), the permissive-policy exposure (line 737), the
  fsck≠convergence gap (line 1861). These are real and good. The gap is that **one** honestly-stated
  bound (the C4-2 residual: "a key with no higher same-key fact can self-date") becomes *attacker-
  reachable* under another honestly-stated mechanism (eviction) — and the spec never connects the two.

- **Ship-readiness:** the convergence core is ship-quality and has survived four audits. The blocking
  items are narrow and specific: **C5-1** (gate per-key trust on durable-chain completeness, or scope
  the anti-backdating claim), **M5-1** (correct the "not regressed" over-claim + the value-neutrality
  premise), **M5-2** (state the revocation impossibility). With C5-1 closed (fix 1 — completeness-gated
  per-key trust, which reuses the m4-1 contiguity machinery already in the spec), this spec is genuinely
  near ship-quality.

---

## Biggest weakness

**The two round-4 fixes compose into a new backdating attack (C5-1): C4-1's partial-replication/eviction
removes the very substrate evidence C4-2's involuntary per-key monotonicity rule reads.** The
anti-backdating primary defense is `iff S contains a higher-stamped same-key fact`, but v4-final
*deliberately* made `S` a replica-chosen subset (eviction of pre-registration `quarantined-ttl` facts;
selective non-replication). So a holder of a *registered* key can backdate a fully-trusted fact onto any
victim replica whose durable subset lacks that key's higher-stamped honest facts — reachable through
default-policy, in-spec behavior (late key registration + disk-pressure eviction), with revocation
powerless (the backdate predates suspicion) and the §8.3b "insider bounded by revocation" mitigation
inapplicable. The spec asserts the per-key rule as an unconditional invariant (INV-16) while its own SEC
corollary makes the rule's premise — a complete-for-`K` local set — false. The fix is available and
cheap: gate per-key *trust* on the same per-key `(wall,counter)` contiguity completeness the spec
already defines for *pins* (§4c/m4-1, INV-14) — an evicted/withheld higher-stamped fact then makes the
backdate *pending*, never *trusted*. A close second is M5-1: "the SEC core is **not** regressed" should
read "preserved on the complete durable subset," since per-shared-subset SEC is a genuinely weaker (and,
under C5-1, value-non-neutral) guarantee than v3's.
