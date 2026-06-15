# Adversarial Red-Team Review — `@a5c-ai/kip-sdk` SPEC v5 (iter-6, round 6, FINAL)

> Reviewer stance: ruthless, specific, break-it — but FAIR, because this is the final round and the
> convergence core has survived five prior audits. The job: (1) verify the round-5 CRITICAL (C5-1
> compositional backdating-via-eviction) and the two MAJORs (M5-1 SEC-corollary over-claim, M5-2
> revocation impossibility) are *genuinely* fixed, not relabeled; (2) probe the C5-1 fix vs C4-1 fix
> composition hard, since "key-chain-durable / non-eviction-eligible for registered keys" is the most
> likely place a NEW compositional issue hides; (3) re-verify the convergence core once more
> (signature-only gate, proj-purity, eventual-once-complete); (4) spot-check the honest residual bounds;
> (5) hunt for any false/untestable INV-1..INV-19 or internal contradiction.
>
> **Verdict up front.** The three round-5 findings are genuinely fixed at mechanism level. The
> convergence core is intact for a fifth audit. The C5-1 fix is sound for *backdating safety* — and,
> importantly, sound for a subtler reason than the spec leans on (the chain-completeness gate alone
> closes the eviction route; `key-chain-durable` retention is a *liveness* aid, not a *safety*
> requirement). **One real MAJOR remains: the C5-1 retention fix (`key-chain-durable` = never-evicted for
> a registered key's *entire emission*) reopens the C4-1 storage DoS for registered keys, and the spec
> then asserts the contradictory bound "bounded by per-key quota" in three places while asserting "never
> quota-dropped / never eviction-eligible" in three others — an unresolved internal contradiction that is
> also a genuine unbounded-durable-storage residual.** No CRITICAL remains. With that one contradiction
> resolved (and two MINORs), the spec is ship-quality.

---

## Verification of prior (iter-5) findings — fixed, or relabeled?

Methodology unchanged: locate the *mechanism*, run it against the original counterexample, check the
fix did not merely migrate the defect to an adjacent claim.

| Prior | Status in v5 | Evidence (quoted) + verification |
|---|---|---|
| **C5-1** (compositional backdating: C4-1 eviction removes the higher same-key fact that C4-2's involuntary per-key monotonicity rule reads; a *registered* key backdates a fully-trusted fact onto a victim whose durable subset lacks `K`'s higher facts) | **GENUINELY FIXED — the eviction route is closed at the root, set-purely** | The fix is the round-5-recommended fix 1, landed precisely. §3.6 lines 911–926 add the **(i) chain-completeness gate**: `F` from `K` projects **trusted** only over a **complete gap-free `(wall,counter)` chain of `K` up to `F`**; "If any earlier same-key fact below `F` is **missing / evicted / not-yet-replicated** … `F` projects **`pending`** — *not* trusted, *not* rejected". This is the **exact** §4c/m4-1 pin-completeness contiguity rule (line 1616–1624), reused. Run the C5-1 counterexample: attacker evicts honest `F'` (higher stamp) from the victim, pushes backdate `F` (lower stamp). Victim's `S` now has a `(wall,counter)` gap in `K`'s chain *below* `F` → gate fires → `F` is **`pending`, never trusted**. The "silently flip a lower backdate to trusted" route is dead because **the very gap that hides `F'` also makes the chain incomplete**, and incomplete ⇒ `pending`. INV-16(C5-1 case) line 2220–2225 and INV-19 line 2262–2271 are the regression tests the iter-5 suite lacked: they evict `F'`, assert `F` is `pending` (not trusted), then deliver `F'`+chain and assert `F` flips to `demoted` exactly once. **Sound.** (See the §8.3b composition finding M6-1 below — the *safety* is sound; the *retention* half the spec couples to it over-reaches.) |
| **M5-1** (SEC corollary "not regressed" over-claim; value-neutrality of quarantined eviction false in the C5-1 case) | **GENUINELY FIXED** | §4b.4 lines 1433–1447 **retract** "not regressed" verbatim: "The earlier draft claimed 'the SEC core is **not** regressed'; that is **retracted** as over-stated." Replaced with: "the SEC core is PRESERVED ON THE COMPLETE DURABLE SUBSET; full-universe byte-identity is RELAXED to per-shared-subset — a deliberate, weaker guarantee that is the price of bounded storage." The value-neutrality premise is pinned with its C5-1 exception (lines 1439–1445): eviction is value-neutral "**only** for facts **outside any key's relied-upon completeness chain**," and the would-be-non-neutral case (evicting a pre-registration same-key fact) "is closed by the chain-completeness gate: the eviction produces a `(wall,counter)` gap, so the later fact projects **`pending`**, never a silently-flipped trusted value." The corollary itself (lines 1419–1421) is now scoped to "cells whose covering facts' authoring keys are **chain-complete on both**." INV-18(c) line 2252–2256 tests the exact regression (evicting a pre-registration same-key fact must NOT flip a later fact demoted→trusted; must yield `pending`). **Sound.** |
| **M5-2** (no revocation mode stops a compromised backdater *and* preserves honest concurrent work; impossibility never stated) | **GENUINELY FIXED** | §8.1 lines 1995–2013 add **"Impossibility (revocation, stated honestly — M5-2)"** essentially verbatim from the round-5 suggested text: "No **set-pure** revocation mode can *simultaneously* (a) demote a **compromised** key's **sub-`effectiveFrom` backdates** and (b) **preserve that key's honest concurrent sub-`effectiveFrom` work** — because both are 'past-stamped, non-ancestor-of-the-revocation' facts and are therefore **set-indistinguishable**." Both horns are named (`ordinary-cutoff` chooses (b), `causal-cutoff` chooses (a) + surfaces casualties), and the closing line — "a reader should not hunt for a mode that achieves both halves; there is none" — kills the "find the right mode" trap. The duplicate statement in the v5 headline (lines 116–118) is consistent. **Sound.** |

**MINOR carry-over verification:**

- **m5-1** (per-key cap → aggregate unbounded across `N` minted keys): **FIXED.** §3.5a lines 771–779 add
  the **global `quarantinePoolBytes` budget** with LRU/TTL eviction "across **all** unregistered keys,"
  explicitly distinguishing TTL=time-ceiling and `quarantinePoolBytes`=space-ceiling, with the per-key
  cap demoted to a "*fairness* sub-limit … **not** the aggregate bound." Pinned in `manifest.json` (line
  396) and tested by INV-18(b) line 2249–2251 (`N` distinct keys, assert aggregate ≤ budget; a per-key-
  only build **fails**). **Sound.**
- **m5-3** (`kip:revoked-concurrent` recovery used the wrong `resolve` primitive): **FIXED.** §8.1 lines
  2015–2026 define a dedicated **`re-attest` fact** (`reAttests: FactId`, signed by a currently-trusted
  non-revoked key) and **correct** the cross-reference "throughout (§8.1 mode (2), INV-17)." `reAttests`
  is added to the canonical payload field list (§2.4 line 342) so it is signed and CID-covered. INV-17
  lines 2233–2239 test that `re-attest` restores and a `resolve`-scoped `supersede` does **not** (wrong
  primitive). **Sound and well-integrated.**
- **m5-4** (registered-key transient anachronism → unbounded *durable* quarantine, not "bounded"):
  **STATED, but the stated bound is the contradiction in M6-1.** §4b.4 lines 1522–1527 concede it is
  "**not 'bounded' in the absolute sense — it is 'bounded per registered key by quota'**." This is the
  honest-statement the round-5 m5-4 asked for — but it collides with the `key-chain-durable` = never-
  evicted/never-quota-dropped guarantee the C5-1 fix simultaneously asserts. See M6-1.
- **m5-5** (INV-16 antecedent must be "no higher same-key fact **in the complete durable chain**"):
  **FIXED.** INV-16 line 2214 now reads "IN THE COMPLETE DURABLE CHAIN," and line 2220–2225 adds the
  eviction-distinguishing test case. §3.6 line 948–951 amends the residual wording identically. **Sound.**

**Net on prior findings:** the 1 CRITICAL + 2 MAJOR + 5 MINOR are all addressed at mechanism level with
new/amended INVs (16 amended, 18 amended, 19 added). This is genuine work, not relabeling. **Credit
where due — this is the cleanest single-round closure across all six iterations.** The recurring
"each fix pushes cost to an adjacent layer" pattern recurs once more, narrowly: the C5-1 *retention*
half (`key-chain-durable`) pushes a bounded-storage cost onto the registered-key durable pool and the
spec under-resolves it (M6-1) — but, crucially, the C5-1 *safety* half (the completeness gate) does
**not** depend on that retention half, so the residual is a storage/liveness wart, not a re-opened
backdating CRITICAL.

---

## The headline probe — does the C5-1 fix reopen the C4-1 DoS? (composition audit)

This is the probe the prompt flagged as most likely to hide a new compositional issue. Result: **the
*backdating safety* is sound and does NOT reopen C4-1; but the spec's chosen *retention mechanism* for
that safety (`key-chain-durable`) does create a registered-key storage residual the spec then describes
self-contradictorily.** Detailed below as M6-1. First, the part that is *not* broken, because it matters
for the verdict:

**Why C5-1 safety does NOT require `key-chain-durable` retention (and therefore does not depend on the
contradictory bound).** The spec presents two mechanisms as jointly closing C5-1 (§3.6 lines 935–939,
§8.3b lines 2090–2096):
- **(i) the chain-completeness gate** — gap ⇒ `pending`. This is **purely set-local and locally
  decidable** (§4c m4-1) and fires *regardless of why* a same-key fact is absent (evicted, withheld,
  never-replicated, or genuinely never-emitted-yet). It alone guarantees **no eviction of any fact can
  flip a same-key backdate to trusted** — an evicted higher fact yields a gap, and a gap is `pending`,
  full stop.
- **(ii) `key-chain-durable` retention** — a registered key's chain is never evicted, so the chain *can
  complete* and honest registered facts eventually project trusted rather than being stuck `pending`.

Mechanism (i) is the **safety** property (INV-19: "no eviction … flips a backdate from
`pending`/`demoted` to `trusted`"). Mechanism (ii) is a **liveness/availability** property (the chain is
retained so completion is reachable locally without re-fetch). The spec occasionally blurs these (e.g.
§3.5a line 745–749 frames `key-chain-durable` as *the* C5-1 root fix), but the safety regression test
that actually matters — INV-19 step (3) — passes on mechanism (i) alone. **This is why M6-1 below is a
MAJOR storage/consistency defect, not a re-opened CRITICAL:** even if one *relaxed* `key-chain-durable`
(allowed quota to drop a registered key's facts), C5-1 safety would survive via the gate — the only cost
would be liveness (a dropped chain link leaves later facts `pending` until re-fetched). The spec chose
never-evict to buy liveness, and that choice — not the safety — is where the unresolved residual lives.

---

## MAJOR findings (v6)

### M6-1. `key-chain-durable` (the C5-1 retention half) makes a *registered* key's ENTIRE emission non-evictable / "never quota-dropped," which reopens the C4-1 unbounded-durable-storage DoS for registered keys — and the spec then asserts the directly contradictory bound "bounded by per-key quota" in three places. This is both an internal contradiction (INV-18(d) vs §3.5a line 721 / §8.3b line 2089) and a real residual: a single registered (or compromised-registered) key can force unbounded non-evictable durable bytes on every replica.

**Location of the contradiction.**
- **"Never evicted / never quota-dropped" side:**
  - §3.5a line 721–722: facts from registered in-namespace keys "are **always durably stored** (**never
    quota-dropped**) — honest authors are never starved."
  - §3.5a line 742–745 (`key-chain-durable` definition): "**any fact authored by a key `K` that holds a
    set-resident `KeyAuthorization`** … **whether or not that individual fact projects trusted** … **It
    is NEVER eviction-eligible (C5-1 root fix).**"
  - §3.5a line 783–784: "a registered key's own chain is `key-chain-durable` (never evicted)."
  - **INV-18(d) line 2257–2259** makes it a *conformance gate*: "a **registered key's entire chain is
    `key-chain-durable`** (a build that **evicts any fact of a registered key** … **fails**)." So a
    conformant build is *forbidden* from evicting any registered-key fact.
- **"Bounded by per-key quota" side:**
  - §3.5a line 751: "This pool is **authenticated and quota-bounded** (per registered key, §8.1)."
  - §4b.4 line 1523–1524: "**'bounded per registered key by quota'** (the `key-chain-durable` pool is
    authenticated and per-key quota-limited … not TTL-evicted)."
  - §8.3b line 2089: the registered insider is "bounded **instead by per-key quota** (§3.5a)."

**Why it fails.** These two are mutually exclusive. A "quota" that is *bounded* must be able to **refuse
or drop** bytes once the quota is hit. But INV-18(d) makes *any* eviction of a registered-key fact a
**conformance failure**, and §3.5a line 742 pins the **entire emission** (including untrusted/anachronistic
facts) non-evictable. So the "per-key quota" cannot actually be enforced by dropping bytes — it is named
as a bound but has no enforcement mechanism that the rest of the spec permits. Concretely:

- A registered service key (legitimately registered, then compromised — exactly the §8.1 insider/compromise
  threat) signs `N` distinct signature-valid facts. All `N` are `key-chain-durable` ⇒ **never evicted, never
  quota-dropped** on any conformant replica. Durable bytes grow without bound, on **every** replica, with
  **no** eviction path. This is the C4-1 DoS — the one the round-4 fix promised to bound — now reachable by
  a registered key, and **revocation does not reclaim the bytes** (§8.3b line 2073: revocation "demotes,
  does not delete"). Worse than the unregistered flood, because the unregistered flood is `quarantined-ttl`
  + global-pool-capped + LRU-evictable (m5-1); the registered flood is `key-chain-durable` and the spec
  forbids evicting it.
- The spec's own escape hatch (§4b.4 line 1523, "bounded per registered key by quota") is **unimplementable
  as written** because the quota mechanism (drop bytes past a cap) is exactly what INV-18(d) forbids for
  `key-chain-durable` facts.

**Why MAJOR not CRITICAL.** (a) It is an *availability/DoS* residual against an **authenticated** actor
(a registered, genesis-rooted key), not an integrity/convergence break — `/heads` stays correct and
convergent; only disk grows. (b) The threat actor is *bounded in identity* (must hold a registered key;
cannot mint fresh ones — that path is the bounded `quarantined-ttl` pool), so it is a true insider threat,
not an anonymous-flood. (c) It does **not** reopen the C5-1 *backdating* CRITICAL (the completeness gate
closes that independently — see the composition probe above). It is nonetheless MAJOR because it is a
**flat internal contradiction promoted to a conformance gate** (INV-18(d) vs the three "quota-bounded"
claims), and a conformant build literally cannot satisfy both "never evict any registered-key fact" and
"bounded per registered key by quota."

**Concrete fix (pick one — they are genuinely different design points, and the spec must commit):**

1. **Decouple safety from retention; allow bounded quota on registered keys, rely on the gate for safety
   (recommended — it is the cheaper and more honest option).** Relax `key-chain-durable` from "the entire
   emission is never-evictable" to "a registered key's chain is **preferentially retained up to a per-key
   `keyChainDurableCapBytes`**; past the cap, the *oldest* chain links may be evicted." C5-1 safety is
   **unaffected** because the completeness gate makes any resulting gap `pending` (never a silent trusted
   backdate) — the only cost is that an evicted-then-needed chain link must be **re-fetched on demand**
   (content-addressed; the spec already relies on this for late-registration, §3.5a line 769) before a
   dependent fact can leave `pending`. This makes "bounded per registered key by quota" **true** and
   removes the contradiction. Amend INV-18(d) to assert "a registered key's chain is retained up to its
   cap, and an evicted link forces dependent same-key facts `pending` (not trusted)" — i.e. fold it into
   the INV-19 `pending`-on-gap guarantee, which already holds for unregistered keys.
2. **Keep `key-chain-durable` strictly never-evictable and DELETE the false "quota-bounded" claims.** If
   the design intent is genuinely "never lose an authenticated key's chain," then §3.5a line 751, §4b.4
   line 1523–1524, and §8.3b line 2089 must stop calling it "bounded by quota" and instead state the
   honest residual: "**a registered key's durable pool is UNBOUNDED in bytes (the price of guaranteed
   chain retention); the only back-pressure is revocation-then-excision (§4.5), which is a manual,
   authorized history-rewrite, not automatic eviction.**" This is a legitimate choice but must be stated
   as the unbounded residual it is, in the §8.3b threat model, not laundered as "quota-bounded."

Either fix is small. The defect is that the spec currently asserts **both** mutually-exclusive claims and
gates one of them (INV-18(d)) into the conformance suite.

---

## MINOR findings (v6)

### m6-1. The chain-completeness gate keys on `(wall,counter)` contiguity "up to `F`," but the §4c/m4-1 contiguity rule it reuses is defined **per-`(replicaId, key)`**, and a key may sign from multiple `replicaId`s — the spec never pins whether "`K`'s chain" is per-`(replicaId,key)` or per-`key`-across-replicas, leaving the gate's contiguity predicate ambiguous in the multi-device-key case.
§4c line 1618–1621 defines contiguity as "**per-(replicaId,key) monotone and gap-free**" — an unbroken
`(wall,counter)` chain **from `R`'s genesis**, i.e. *per replica*. But §3.6 line 913–916 speaks of "`K`'s
facts form a per-key `(wall,counter)` sequence" and "the complete gap-free `(wall,counter)` chain of
`K`'s facts" — *per key*. If one key `K` authors from two replicas `R1`, `R2` (a shared service key, or a
rotated-in key used on two agents), there is **no single `(wall,counter)` chain for `K`** — there are two
interleaved `(replicaId,counter)` chains, and "gap-free for `K`" is undefined across them. The fix is one
sentence: pin that the gate's contiguity is decided **per-`(replicaId, key)`** (matching m4-1 exactly),
and that the monotonicity demotion (ii) compares author-HLCs across **all** of `K`'s `(replicaId,key)`
chains (it already quantifies over "`S` holds a higher … fact from the same key `K`," which is
key-wide — so demotion is key-wide while *completeness* is per-`(replicaId,key)`-wide-union). State this
explicitly so a build does not implement a single-`replicaId` chain and miss a gap on `K`'s other replica.
(Does not threaten convergence — both readings are set-pure — but it is a genuine under-specification of
the load-bearing gate.)

### m6-2. INV-19 step (4) asserts the `pending → demoted` transition "happens **at most once** and never reverses," but `key-chain-durable` retention is what guarantees non-reversal, and under fix-1 (cap-bounded retention) a re-fetched-then-re-evicted chain link could oscillate `pending → demoted → pending`.
Line 2266–2267 asserts monotonicity (transition at most once, never reverses). This holds under the
**strict** never-evict `key-chain-durable` model. If M6-1 is closed via fix 1 (cap-bounded retention with
on-demand re-fetch), a chain link could be evicted *after* a fact left `pending`, momentarily re-opening
the gap. The spec should pin that **a same-key fact, once it has contributed to completing a chain for a
*trusted/demoted* dependent fact, is itself promoted to retained (not re-evictable) for as long as that
dependent is non-`pending`** — i.e. retention follows the *frontier of completed-chain evidence*, not the
whole emission. This keeps INV-19's "never reverses" true while still bounding bytes (only the
completion-frontier links are pinned, not every historical link). If fix 2 (strict never-evict) is chosen,
this is moot. Flag so the two fixes are not silently incompatible with INV-19.

### m6-3. §3.5a line 753–756 says a pre-registration fact is `quarantined-ttl` and "an eviction of a pre-registration fact instead forces `pending` trust on later same-key facts via the completeness gate" — but if the key later registers, ALL its facts flip to `key-chain-durable` and are "re-fetched on demand" (line 769). The re-fetch depends on "any peer that still holds them" — there is no guarantee any peer does, after global-pool LRU eviction drained that pre-registration fact everywhere.
Line 768–770 promises "no honest late-registered fact — or its chain — is lost" via on-demand re-fetch,
"any peer that still holds them serves the blob." But the pre-registration facts are `quarantined-ttl`
under the **global** `quarantinePoolBytes` LRU (m5-1), which can evict them on **every** replica
simultaneously (the budget is per-replica but the flood/pressure is correlated). If all peers have
LRU-drained that blob, the re-fetch fails and the chain **cannot complete** — the later registered facts
are stuck `pending` **forever** (safe, but a permanent liveness loss for an honest late-registered key
whose early facts aged out before registration arrived). This is a real (if narrow) liveness residual:
state it honestly — "a key registered *after* its pre-registration facts have aged out of every replica's
quarantine pool may have its early chain permanently unreconstructible, leaving later facts permanently
`pending`; register keys before their facts' `quarantineTtlMs` elapses." It is safe (never a wrong trusted
value) but it is an un-stated liveness cliff at the C4-1/C5-1 seam.

---

## Re-verification of the convergence core (5th audit)

The prompt asked to verify the core once more, with specific attention to proj-purity under the new
chain-completeness status. Result: **the core is intact, and `proj` remains pure with the `pending`
status correctly characterized as eventual-once-complete, not hidden non-determinism.**

- **Signature-only ingest gate** (§3.2 lines 448–484, §4b.4 proof step 1 lines 1450–1462): unchanged and
  sound. Admission reads only well-formedness + Ed25519 over the canonical payload — no clock, no
  `rxFrom`, no key-log, no revocation, no retention class. The canonical payload (§2.4 lines 338–351)
  covers every author/replica/version field including the new `reAttests`, so `factCID` is a genuine
  always-unique final tiebreak (INV-3). The `RetentionClass` is correctly **excluded** from membership
  and from `proj` values (§3.5a line 726: "not a `proj` *value* and never feeds `/heads`"). **Sound.**

- **proj-purity and the `pending` status — the key question.** Is the chain-completeness/`pending` label
  a pure function of *set data*, or does it read per-replica "which-facts-I-hold" state? **It reads the
  held set `S`, and that is exactly correct.** `proj` is — and has always been (§3.5a line 705) — a pure
  function of *whatever set the replica holds*. "Does `S` contain a gap-free `(wall,counter)` chain of
  `K` up to `F`?" is a **pure predicate over `S`** (it inspects only set-resident author-stamped HLC
  components; §4c m4-1 makes it *locally decidable* from set contents alone). So:
  - **`pending` IS replica-dependent** — two replicas holding different subsets of `K`'s chain compute
    different `pending`/`trusted` labels for the same `F`. The spec does **not** hide this; it is the
    explicit per-shared-subset SEC (§4b.4 lines 1419–1431).
  - **But this is NOT hidden non-determinism**, for two reasons the spec states correctly: (1) `pending`
    is a *labeled "not-yet-known,"* surfaced and queryable, never a silent divergent *trusted* value
    (§3.6 line 919, §4b.4 line 1427 "divergence is surfaced as `pending`, never as two different trusted
    heads"); (2) it is **monotone** — `pending` flips to `trusted`/`demoted` exactly once as the chain
    completes and never back (§3.6 line 920–926, line 814; INV-19 step 4). This is **identical in
    structure to the already-accepted `pin-incomplete` status** (§4c lines 1612–1628), which survived
    four audits. So `proj` is **still pure** ("`proj(S)` is a deterministic function of `S`"), and
    convergence is correctly characterized as **"eventual once complete"**: for any cell, once both
    replicas hold the complete-for-`K` chain of every covering key, they agree byte-identically; until
    then the lagging replica reads `pending` (a determinate function of its `S`), not a wrong trusted
    value. **This is the right characterization and the spec states it precisely.** No hidden
    non-determinism; no replica-local *input* (clock/rxFrom/ingest-order) leaks into the label — only
    *set membership* does, which is what every monotone CRDT-style "I haven't seen it yet" status does.
    **Sound.**

- **orderKey totality** (§3.4 lines 533–539, §4b.4 step 2 lines 1463–1467): reads only author-stamped
  set-resident fields, ends `publicKeyFingerprint` → `factCID`. Canonical payload covers every
  distinguishing field ⇒ no orderKey collision between distinct facts (INV-3). **Sound.**

- **SEC theorem + partial-replication corollary** (§4b.4 lines 1410–1447): the theorem (equal admitted
  sets ⇒ byte-identical heads) is unchanged and correct. The corollary is now honestly scoped to
  "complete durable subset" and "chain-complete on both," with the M5-1 value-neutrality exception pinned
  and closed by the gate. **Sound** (the only crack is the *retention* contradiction M6-1, which does not
  touch the theorem — it touches how many bytes a replica must keep, not what `proj` computes).

- **INV-1..INV-19 testability sweep.** No INV is *false*. INV-1..INV-15, INV-17 are concrete and testable
  as in iter-5. **INV-16** is now complete (the m5-5 C5-1 eviction case is added, line 2220–2225).
  **INV-19** is concrete and testable (author higher + backdate, evict, assert `pending`-not-trusted,
  deliver chain, assert flip-to-demoted exactly once) — its only caveat is m6-2 (the "never reverses"
  clause assumes strict never-evict; must be reconciled with whichever M6-1 fix is chosen). **INV-18** is
  testable; its sub-clause **(d)** is the half of the M6-1 contradiction that is *gated into conformance*
  ("a build that evicts any fact of a registered key **fails**") — so INV-18(d) as written would **fail a
  build that implements the bounded-quota** the same spec promises elsewhere. That is the conformance-level
  symptom of M6-1 and must be amended alongside it. No INV is untestable; one (INV-18(d)) encodes a
  contradiction.

**No residual non-determinism in `proj` itself was found.** `pending`/`trusted`/`demoted`,
`untrusted-anachronistic`, `untrusted-malformed`, `kip:revoked-concurrent`, `RetentionClass`, pin-status,
conflict markers, existence gating, and the `re-attest` projection are **all pure set functions**. The
git-encoding determinism (M4-3) remains closed by recipe (INV-12). The convergence core is ship-quality
for a fifth consecutive audit.

---

## Spot-check of the honestly-stated residual bounds

The prompt asked whether any "honestly stated residual" still hides a real CRITICAL. Checked each:

- **"A key that has emitted nothing higher in its chain can self-date a genuine first-emission freely"**
  (§3.6 line 944–947, §8.1 line 1979–1981). **Acceptable, and now NOT eviction-reachable.** The C5-1 fix
  correctly closes the *eviction route* to this residual (eviction yields a gap ⇒ `pending`, not a silent
  trusted self-date); what remains is only the genuine first-emission case (no conflicting same-key
  history to poison), resolved against other authors by ordinary `orderKey`. This is the irreducible
  floor of any set-pure anti-backdating rule — no hidden CRITICAL.
- **The revocation impossibility** (§8.1 lines 1995–2013). **Acceptable** — it is a stated impossibility,
  not a defect; both horns are surfaced (`ordinary-cutoff` lets sub-`effectiveFrom` backdates through;
  `causal-cutoff` demotes honest concurrent work + surfaces `kip:revoked-concurrent` for re-attest). No
  hidden CRITICAL; the residual is intrinsic to set-purity.
- **"A registered insider is bounded by per-key quota + revocation"** (§8.3b line 2088–2092). **This is
  the residual that DOES hide a problem — M6-1.** The "bounded by per-key quota" half is *false as
  written* (the quota cannot be enforced because `key-chain-durable` forbids the eviction that would
  enforce it). But the *integrity* consequence is nil (backdating stays closed by the gate); the
  *availability* consequence (unbounded durable bytes from a registered/compromised key with no automatic
  back-pressure) is the MAJOR. Not a CRITICAL because it is an authenticated-actor DoS that does not break
  convergence or trust.
- **Permissive-policy opt-out re-exposes disk growth but NOT C5-1** (§8.3b line 2093–2096). **Correct and
  sound** — the completeness gate + `key-chain-durable` are part of `proj`/the default retention model,
  not the optional aggressiveness knob, so opting out of *quarantine* eviction does not re-open the
  backdating gate. Good.

No honestly-stated residual hides a CRITICAL. One (the registered-insider "quota" bound) hides the MAJOR
M6-1.

---

## Cross-cutting assessment

- **All round-5 findings (1 CRITICAL + 2 MAJOR + 5 MINOR) are genuinely fixed at their locus**, with
  amended/new conformance invariants (INV-16 amended, INV-18 amended, INV-19 added). The C5-1 closure
  reuses existing machinery (the §4c/m4-1 pin-completeness contiguity rule) exactly as round-5 advised —
  the cheapest correct fix. **Strongest single-round closure of the six iterations.**

- **The convergence core is intact for a fifth audit.** Signature-only gate, proj-purity, orderKey
  totality, SEC theorem all sound. The new `pending`/chain-completeness status is a **pure function of
  the held set**, replica-dependent only in the same benign, monotone, surfaced way `pin-incomplete`
  already was — convergence is correctly **"eventual once complete,"** not hidden non-determinism.

- **The one remaining MAJOR (M6-1) is the C5-1↔C4-1 composition the prompt told me to probe hardest —
  and it is real, but it is a *storage/contradiction* defect, not a re-opened backdating CRITICAL.** The
  C5-1 *safety* (no eviction flips a backdate to trusted) holds on the completeness gate alone; the
  `key-chain-durable` *retention* half over-reaches into "never evict / never quota-drop a registered
  key's entire emission," which (a) reopens unbounded durable storage for a registered/compromised key
  and (b) directly contradicts the three "bounded by per-key quota" claims, with the contradiction gated
  into conformance via INV-18(d). Fix is small (commit to bounded-cap-with-refetch *or* delete the false
  "quota-bounded" claims and state the unbounded residual honestly).

- **Reward for honest bounds:** the spec remains unusually candid — it retracts the M5-1 over-claim
  verbatim, states the M5-2 impossibility plainly, concedes the m5-4 registered-pool tradeoff, and pins
  the value-neutrality exception. The single gap is that one honestly-*intended* bound (the registered-key
  "quota") is asserted as fact while another equally-honest mechanism (`key-chain-durable` never-evict)
  makes it unenforceable — the two were not reconciled.

- **Ship-readiness.** The convergence core is ship-quality and has survived five audits. **No CRITICAL
  remains.** The single blocking item is **M6-1** (resolve the `key-chain-durable` vs per-key-quota
  contradiction — choose bounded-cap-with-refetch, which keeps INV-19 honest, or delete the quota claim
  and state the unbounded residual). Three MINORs (m6-1 per-`(replicaId,key)` vs per-`key` chain
  ambiguity; m6-2 INV-19 non-reversal under cap-bounded retention; m6-3 re-fetch liveness cliff when a
  pre-registration chain ages out everywhere) are polish that should land with the M6-1 fix since they
  live at the same seam. **With M6-1 resolved, this spec is ship-quality.**

---

## Biggest weakness

**M6-1: the C5-1 retention fix (`key-chain-durable` = never-evict a registered key's *entire emission*)
reopens the C4-1 unbounded-durable-storage DoS for registered keys, and the spec then describes the bound
self-contradictorily — asserting "never quota-dropped / never eviction-eligible" (and gating it via
INV-18(d): "a build that evicts any registered-key fact **fails**") while simultaneously claiming the
pool is "bounded per registered key by quota" in three other places.** A quota that cannot drop bytes is
not a bound; INV-18(d) forbids exactly the eviction that would enforce the claimed quota. The consequence
is a real (if authenticated-actor) DoS: a single registered or compromised-registered key can force
unbounded non-evictable durable bytes on every replica, with revocation unable to reclaim them ("demotes,
does not delete"). Crucially this is **NOT** a re-opened backdating CRITICAL — the C5-1 completeness gate
closes the eviction-route backdate *independently* of `key-chain-durable` (an evicted chain link yields a
gap ⇒ `pending`, never a silent trusted backdate), so the safety property survives even if retention is
relaxed. That is precisely why the fix is cheap: **decouple safety from retention — bound `key-chain-
durable` to a per-key `keyChainDurableCapBytes` with on-demand re-fetch (the spec already relies on
content-addressed re-fetch for late registration), so an evicted-then-needed link forces dependent facts
`pending` (safe) rather than being un-evictable (unbounded).** That makes "bounded per registered key by
quota" *true*, removes the INV-18(d) contradiction, and leaves the convergence core — sound through five
audits — untouched. A close second is the under-specified gate contiguity (m6-1): "`K`'s chain" must be
pinned as per-`(replicaId,key)` (matching the m4-1 rule it reuses) so a multi-replica key's gap is not
missed.
