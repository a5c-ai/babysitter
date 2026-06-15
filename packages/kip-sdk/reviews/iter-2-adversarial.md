# Adversarial Red-Team Review — `@a5c-ai/kip-sdk` SPEC v2 (iter-2)

> Reviewer stance: ruthless, specific, break-it. Round 2. The v1 review (`iter-1-adversarial.md`)
> landed 6 CRITICAL + 9 MAJOR. v2 is a serious, mostly-honest revision: it removes the unsound
> binary `merge(base,a,b)`, re-grounds convergence as *G-Set union of facts + a single pure
> projection*, and adds a real trust model. Most of the v1 CRITICALs are genuinely addressed.
>
> **But the v2 revision introduces a new, equally-fatal contradiction at the seam between the two
> fixes it is proudest of.** The C-1/C-3 fix says *`proj` is a pure total function of the fact SET,
> byte-identical across replicas*. The C-6 fix says *trust (which asserts `proj` keeps vs demotes)
> is decided against `rxFrom`, the receiver-assigned PER-REPLICA transaction time*. These cannot
> both be true. `proj` now reads a replica-local input, so the SEC theorem (§4b.4) is false again —
> for a *different reason* than v1, but just as load-bearing. This is C2-1 below and it is the
> headline finding.

---

## Verification of prior (iter-1) findings

Methodology: each prior CRITICAL/MAJOR was checked for a *mechanism*, not a *claim*. "Hand-waved"
means the spec asserts the fix without a mechanism that survives the original counterexample.

| Prior | Status in v2 | Evidence / caveat |
|---|---|---|
| **C-1** (interval-clipping fold not ACI) | **GENUINELY FIXED** | §3.4 removes `merge(base,a,b)`; `proj` is "one sort then one sweep" (line 396), valid-time geometry via "sweep-line over interval endpoints in `orderKey` order" (line 392). The A/B/C counterexample is killed *by construction* (no fold order). Sound. |
| **C-2** (binary merge iface / OR-Set-without-removal) | **GENUINELY FIXED** | `CellReducer.reduce(facts[])` is a whole-subset fold (line 376); `gset`/`pncounter` with per-member FactId tags = OR-Set semantics (§4b.2, line 757). The "G-Set that nonetheless removes" contradiction is resolved cleanly: substrate grow-only, *projected collection* uses OR-Set. Sound. |
| **C-3** (supersession order-sensitivity diverges) | **PARTIALLY FIXED — see C2-2** | LLM decision frozen into a `supersede` fact keyed by `inputCids` (line 563). Re-run = same CID = no-op (INV-7). This is real. BUT the "two replicas emit *different* supersede facts → resolved by orderKey" path (line 432–436) re-opens semantic divergence under a determinism fig-leaf. Downgraded to MAJOR, not eliminated. |
| **C-4** (excision breaks CID/as-of/SEC) | **MOSTLY FIXED — see C2-3, M2-2** | Re-fold `/heads` (C-4.1), nonce marker not PII hash (C-4.3), frontier-addressed pins (§4c), bounded divergence window named in theorem (§4b.4 line 816). Honest. BUT cross-replica *convergence after concurrent excision* is still not shown sound (C2-3), and commit-sig re-application (C-4.4) silently re-breaks idempotency/CID stability. |
| **C-5** (EID forgeable / hijack) | **GENUINELY FIXED (structurally)** | Namespaced EID `<tenant>/<authorityFpr>/<localId>` (§3.6); equality requires same namespace; write-authority cryptographically bound; `withScope` gates writes (line 525). The v1 hijack is closed. New issues are about *rotation/transfer*, not the base mechanism (M2-3). |
| **C-6** (no revocation / backdating / flat trust) | **FIXED FOR BACKDATING, BROKEN FOR DETERMINISM** | Revocation facts, scoped authority, root-of-trust in manifest, receiver-time checks — all present (§8.1). BUT the receiver-time check is *exactly* what makes `proj` replica-dependent → **C2-1**. The C-6 fix and the C-1 fix are mutually contradictory as written. |
| **M-1** (causedBy O(replicas)/unsound) | **GENUINELY FIXED** | §4b.1 line 732–747: commit-DAG ancestry (O(1) amortized), `causedBy` demoted to optional intra-batch hint, "absent ⇒ concurrent (safe)", "DVV-grade" claim removed. Honest and sound. |
| **M-2** (counter overflow / drift) | **GENUINELY FIXED** | Carry into `wall+1` on overflow (line 723); max-drift ε rejection promoted to core (line 728, OQ-7→core). Correct. |
| **M-3** (committed-AND-derived heads) | **GENUINELY FIXED** | `.gitattributes merge=kip-regen` driver discards both sides and recomputes (line 285); `headsCommitted=false` option offered. This is the exact fix M-3 asked for. |
| **M-4** (stamp-HLC vs idempotent CID) | **GENUINELY FIXED** | HLC author-stamped and signed, part of payload/CID (line 558); `rxFrom`/`commit` post-hoc annotations excluded from CID. INV-7 now holds — *except* the excision commit-sig re-application path quietly violates it (M2-2). |
| **M-5** (belief reconstruction lossy) | **FIXED, AT THE COST OF C2-1** | `rxFrom` receiver-assigned per-replica, `asOf` replica-relative, `believer` param. This is the *right* bitemporal model — but it is the very thing that contaminates `proj` (C2-1). The fix is correct in isolation and fatal in combination. |
| **M-6** (write amplification O(history)) | **GENUINELY FIXED (honestly)** | §3.5 separates read-latency from bytes, states storage grows monotonically, rollup ≠ byte reclamation, `headsCommitted=false` halves amplification. Honest, no longer overclaimed. |
| **M-7** (ANN not deterministic) | **GENUINELY FIXED** | §5.3 splits deterministic vs accelerator projections; INV-5 scoped; recall-equivalent test; embedding-model id recorded as a fact. Correct. |
| **M-8** (schema gate vs set-union) | **GENUINELY FIXED** | §2.2: facts always accepted if sig+authority verify; schema applied in `proj`; non-conforming → quarantine, never dropped; INV-8 weakened to "terminates with typed result". Correct and consistent with no-fallback. |
| **M-9** (no-gap invariant vs retract) | **GENUINELY FIXED** | Gaps first-class `{kind:"unknown"}`; INV-4 tests "non-overlap + gap-as-unknown". Correct. |
| **m-1..m-12** | **ADDRESSED** | BlobRef tagged (m-1), confidence advisory (m-2), commit post-hoc (m-3), conflict read semantics defined (m-4), frontier cursor (m-5), hash-algo hard error (m-6), salience bounded by asOf (m-7), shardDepth in manifest (m-8), pending/durable (m-9), DAG antichain not binary-search (m-10), excise scoped (m-11), cardinality/inverse projected (m-12). All have a stated mechanism. |

**Net:** v1's convergence-soundness CRITICALs (C-1, C-2) are *actually* fixed — the projection is now
a real set function. The trust/identity CRITICALs (C-5, C-6) are *structurally* fixed but C-6's
mechanism **re-breaks** the convergence guarantee from a new angle. The revision traded one unsound
SEC proof for another.

---

## CRITICAL findings (v2)

### C2-1. `proj` is NOT a pure function of the fact set — revocation/authority demotion reads `rxFrom`, which is receiver-assigned and PER-REPLICA. The SEC theorem (§4b.4) is false again.

**Location.** The contradiction is spread across three sections that each look fine alone:

- §4b.4 Theorem (line 791): "If `S_A = S_B = S`, then A and B compute **byte-identical `/heads`**…"
- §3.4 (line 368): `OrderKey = [validFrom, hlcWall, hlcCounter, replicaId, factCID]` — **`rxFrom` is not in it.** `proj` is claimed to depend "**only** on `S`" (line 806).
- §8.1 line 1101: `KeyRevocation.effectiveFrom` — "facts whose **RECEIVER rxFrom** ≥ this are untrusted."
- §8.1 line 1062: "a revoked key's facts… are **demoted to untrusted by `proj`**."
- §3.6 line 519: "`proj` marks its segments `untrusted` and the default `lww-hlc` reducer **ignores untrusted asserts** when a trusted assert covers the interval."
- §4.2 line 589: "**Transaction time = `rxFrom`, RECEIVER-assigned and PER-REPLICA.**"

**Why it fails.** Put those five lines next to each other:

1. `proj` must decide, per fact, *trusted vs untrusted*, and that decision **changes the projected
   value** (untrusted asserts are *ignored* by `lww-hlc` when a trusted assert overlaps — line 519).
2. The trusted/untrusted decision for a revoked-key fact is made by comparing the fact's **`rxFrom`**
   to the revocation's `effectiveFrom` (line 1101).
3. `rxFrom` is **assigned by the receiving replica at ingest** and **differs across replicas** for the
   same fact (line 88, 589, 593: "A fact that arrives late via merge gets a *later* `rxFrom`").

Therefore `proj`'s output is a function of `(S, {rxFrom per fact on THIS replica})`, **not of `S`
alone.** The theorem's step (2) — "`proj(S)` depends only on `S`" (line 806) — is **false**.

**Concrete divergence (byte-level, not a propagation window).** Key `K` is authorized, writes fact
`F` (an assert that, if trusted, wins a cell under `lww-hlc`). Later `K` is compromised and a
`revoke-key` fact `R` with `effectiveFrom = T` is published.

- Replica **A** ingested `F` *early* (before `R`'s effective HLC reached A's clock): A stamps
  `F.rxFrom = 5`. Since `5 < T`, A treats `F` as **trusted** → `F` wins the cell.
- Replica **B** received `F` *late via merge* (after it had already advanced past `T`): B stamps
  `F.rxFrom = 9`. Since `9 ≥ T`, B treats `F` as **untrusted** → `F` is ignored, a different (or
  `unknown`) value wins the cell.

Now `S_A = S_B = {F, R, …}` (both hold the identical fact set, excision-free, all markers propagated)
yet **`/heads_A ≠ /heads_B`**. This is exactly the antecedent of the theorem (equal non-excised sets,
no excision in play) with the consequent (byte-identical heads) **violated**. It is *not* the bounded
excision window of C-4.2 — there is no excision here, and the divergence is **permanent**: `rxFrom` is
frozen per replica, so the sets never produce equal heads no matter how long they sync.

This is the precise circular dependency the prompt suspected: **`proj` → trust-verification →
revocation-fact → `rxFrom` → replica-local ingest order.** The C-6 backdating defense
(check against receiver time, not author time — line 1114) is *security-correct* but
*convergence-fatal*, because it injects a replica-local quantity into the one function the entire
SEC theorem requires to be set-pure.

**Secondary blast radius:** the same defect hits **authority** demotion, not just revocation. §3.6
line 519 demotes out-of-namespace asserts to `untrusted` and `lww-hlc` ignores them — that part is
set-pure (authority membership is in `S` via key-authorization facts). But §3.2 step 2 (line 306)
checks authority "**as-of THIS replica's current ingest HLC**" and rejects vs records-untrusted *at
ingest*, which is again replica-time-relative. If a key-authorization fact and a target fact race
across replicas, two replicas can disagree on whether the target was authorized "at ingest" → same
divergence.

**Concrete fix.** You must make trust a **function of the set, evaluated at a set-derived time, not
`rxFrom`.** Options, in order of preference:

1. **Check revocation against `orderKey`/author-HLC, and defend backdating differently.** Make
   `proj` demote `F` iff `F`'s *author HLC* (the signed, set-resident, deterministic ordering field)
   is ≥ `R.effectiveFrom`. This is set-pure. The backdating attack this re-opens (compromised key
   backdates `F.hlc` to before `R.effectiveFrom`) is then defended by the **bounded-drift bound ε**
   (M-2, already core): an honest receiver rejects a fact whose `hlc.wall` is more than ε from
   physical time, so an attacker cannot stamp an arbitrarily old HLC and *also* have it accepted by
   honest replicas at ingest. Revocation effective-time should be expressed in the *same author-HLC
   space* the rest of `proj` already totally-orders, so the comparison is set-deterministic.
   **Critically, ingest-time rejection (which may differ per replica) must be separated from
   proj-time demotion (which must be set-pure):** a fact rejected at ingest on one replica but
   accepted on another already breaks set-equality `S_A = S_B`, so ingest rejection must *never* be
   the thing that decides a value `proj` would otherwise keep. Make ingest rejection only for
   *signature failure* (objective, set-pure); make *all* authority/revocation handling a
   demotion **inside `proj`** keyed on author-HLC.
2. If you insist on receiver-time semantics for *belief* queries, **scope them to `asOf`/audit reads
   only** and explicitly exclude `rxFrom` from `proj`/`/heads`. State that `/heads` is the
   author-HLC projection (convergent) and `rxFrom`-based belief is a *separate, admittedly
   replica-local, non-convergent* read lens. Then the theorem must be restated: "`/heads` is
   byte-identical; per-replica belief views are *not* and are not claimed to be."
3. Add `rxFrom` to the SEC theorem's explicit non-guarantees, the way ANN was excluded (§5.3). But
   note this *guts the headline*: `/heads` itself (not an accelerator) would then be non-convergent,
   which contradicts G3, INV-1, INV-2.

Until one of these is in the text, **INV-1, INV-2, and the §4b.4 theorem are false**, and `fsck`'s
"`heads == proj(facts)`" is ill-defined (proj of which replica's `rxFrom`?).

---

### C2-2. Concurrent `supersede` facts: "resolved by orderKey" is determinism of *bytes*, not of *meaning* — two replicas converge on a head that asserts a contradiction, and nothing ever resolves it.

**Location.** §3.4 line 430–436 and §4b.3 line 783:

> "If two replicas *do* emit different `supersede` facts over overlapping inputs (e.g. different LLM
> outputs from different model versions), both enter the set and `proj` resolves them by `orderKey`
> like any other concurrent asserts — deterministically, surfacing a `kip:conflict` if a custom
> reducer declares them irreconcilable."

**Why it still fails (this is the C-3 residue).** The v1 finding was "divergent corrective facts both
enter the substrate; the union is a garbage superset." v2's answer is: *both enter, `orderKey` picks
one deterministically.* That makes the **bytes** converge but does **not** deliver the thesis ("agents
converge their contexts"). Concretely:

- Replica A's supersede `S_A`: "fact F1 (Ada@Acme) is superseded; assert Ada@Beta."
- Replica B's supersede `S_B`: "fact F1 is superseded; assert Ada@Gamma." (different model version,
  line 432 explicitly permits this).
- Both have distinct `inputCids`-derived… **no.** Read line 563: `supersede` is *keyed by
  `inputCids`*. `S_A` and `S_B` act on the *same* `inputCids = [F1]`. INV-7's "re-run = same CID =
  no-op" only fires if the *outputs* are identical. They are not (Beta vs Gamma), so the CIDs differ
  and **both** persist. The keying-by-inputCids claim (the C-3 fix) only deduplicates *identical*
  decisions; it does nothing for *conflicting* ones.

Now `proj` "resolves by orderKey" → picks (say) `S_A`'s Beta on **every** replica. Byte-convergent,
yes. But:

1. The default `lww-hlc` reducer does **not** "surface a conflict" here — line 414 says a `conflict`
   segment arises "**only** when a *custom reducer deliberately declares irreconcilability*." The
   default silently picks Beta over Gamma by `factCID` tiebreak. So the spec's own escape hatch
   ("surfacing a `kip:conflict`") **does not apply to the default reducer**, which is what everyone
   uses. Two genuinely contradictory LLM supersessions get **silently arbitrated by a hash tiebreak**
   — a fallback in all but name, violating N5 ("kip never silently picks something") and the repo's
   "fallbacks are evil" rule.
2. The "deterministic" framing conflates *replica agreement* with *correctness of meaning*. The
   system has agreed on an answer it has no basis to believe (the loser, Gamma, may be the correct
   supersession). For a context-memory whose purpose is agent belief, a hash-tiebroken winner among
   contradictory LLM corrections is **arbitrary truth presented as consensus.**

**Why CRITICAL not MAJOR.** The v1 C-3 was downgraded *as fixed* in the verification table only for
the *identical-decision* case. For the *conflicting-decision* case — the one that actually matters —
v2's mechanism is "factCID tiebreak under the default reducer," which is precisely the "arbitrary
HLC-tiebroken winner" the v1 review flagged as the failure mode (iter-1 C-3, "an arbitrary
HLC-tiebroken winner"). It was not fixed; it was relabeled "deterministic."

**Concrete fix.** Pick one and say it:
(a) **Single-writer supersession** for a given `inputCids` set: the first `supersede` over an input
set *closes* it (a later supersede over the same inputs that is not a strict descendant is **rejected
or auto-promoted to a `kip:conflict`** by the *default* reducer, not only custom ones). This restores
the C-3 intent (recorded decision is authoritative) and makes contradictory re-decisions visible.
(b) Make the **default reducer surface `kip:conflict` when two `supersede` facts target overlapping
`inputCids` with different outputs** — i.e. supersession conflicts are *never* silently tiebroken.
Right now the text grants the conflict-surfacing only to custom reducers (line 414), which is the gap.

---

### C2-3. Concurrent excision on different replicas: convergence is asserted but the rewrite is path-dependent, and the "re-resolve to the rebased commit" claim has no canonical rebase.

**Location.** §4.5 line 697–699 (SEC bound), line 689 ("Pins… re-resolving to the rebased commit"),
§4b.4 line 816 ("bounded divergence window… restored once the excision has propagated"), §4c
SnapshotRef.factSetDigest line 862 ("re-resolves after rewrite").

**Why it fails.** v2 honestly admits excision breaks append-only and names a *bounded* divergence
window. Good. But it only analyzes **one excision propagating to a passive replica.** It never
analyzes **two replicas excising concurrently**, which is the genuinely hard case:

- Replica A excises fact `F1` → rewrites its DAG → new commit chain `A'`.
- Replica B *concurrently* excises fact `F2` → rewrites its DAG → new commit chain `B'`.
- Now A and B must reconcile. The excision *markers* (`type:"excision"` facts) are append-only and
  converge as a G-Set — fine. But the **physical rewrites do not commute**: A's rewrite was computed
  over a history that still contained `F2`; B's over one that still contained `F1`. There is no
  defined operation that takes `A'` and `B'` and produces a canonical history with *both* `F1` and
  `F2` excised. git's `filter-repo`/`replace-object` rewrites are **not confluent**: replaying B's
  excision on top of A's rewritten history yields different commit CIDs than replaying A's on B's.

The spec's convergence story (§4b.4) is "equal fact-sets ⇒ equal heads." After concurrent excision,
the two replicas' **fact sets are equal** (both have markers for F1 and F2, both lack F1 and F2's
blobs) so `/heads` *will* re-fold identically — **that part survives** because heads come from
`proj(remaining facts)`. **But the commit DAG / object store does not converge**, and the spec relies
on the commit DAG for:

- `asOf({txTime})` resolution "against the **commit DAG of the replica being queried**" (line 600,
  636). Two replicas now have non-isomorphic DAGs with different commit CIDs ⇒ `asOf` answers differ
  in *which commit* is the frontier even if heads agree.
- `SnapshotRef.frontier.dagTips: CID[]` (line 857) — pins reference commit CIDs that, post-concurrent-
  rewrite, exist on neither replica's canonical chain. "Re-resolves to the rebased commit" (line 689)
  presumes a *single* rebase target; with two concurrent rewrites there are two, and no rule says
  which is canonical.

So the claim "pins survive excision rebase via `factSetDigest`" holds *only* for the
single-excision case. `factSetDigest` is a merkle digest of the *fact set* (line 862) — it re-resolves
the **fact frontier**, which does converge, but `dagTips` (the commit CIDs in the same struct) do
**not**, and `asOf`/audit reads that walk the DAG are left dangling.

**Concrete fix.** (a) State that excision **must be serialized through a designated authority** (the
`excise`-scoped key acts as a single-writer for rewrites within a tenant) so rewrites never race —
this contradicts coordinator-freedom *for excision only*, which is an acceptable, honest carve-out
(excision is already "the one operation that breaks append-only"). (b) OR define a **canonical
re-derivation**: after any excision, the commit DAG is *regenerated deterministically* from the
ordered fact set + excision markers (a function of the set), so concurrent excisions converge to one
canonical DAG by re-deriving rather than rebasing. This makes commit CIDs a *deterministic projection
of the set* too, which is cleaner but requires committing that the commit DAG itself is regenerable
(currently only `/heads` is). (c) At minimum, drop `dagTips: CID[]` from the *durable* pin contract
and pin **only** `factSetDigest` + frontier-in-author-HLC-space, since that is the only part that
provably survives. State that `asOf` resolves against the *fact frontier*, never a commit CID.

---

## MAJOR findings (v2)

### M2-1. `orderKey` is claimed total but two distinct facts CAN tie on all five components — `factCID` is not "always unique" across the cases that matter.

**Location.** §3.4 line 368–369:

> `OrderKey = [validFrom, hlcWall, hlcCounter, replicaId, factCID]` … "`factCID` is the final,
> **always-unique** tiebreak"; line 806: "ties broken by `factCID` — **always unique**."

**Why it fails.** `factCID = CID of the canonical SIGNED fact payload` (line 538, M-4). Two *distinct*
facts have distinct CIDs **only if their canonical payloads differ.** Consider two facts that are
byte-identical in payload *except for a field excluded from the canonical payload*:

- The payload **includes** `hlc` (line 558) but **excludes** `provenance.signature`? Check line 217:
  `signature` is over `signedFields`; `signedFields` is itself a field. If two authors sign the *same
  logical assertion* (same target, value, validFrom, hlc) the payloads are identical ⇒ **same CID** ⇒
  this is the *intended* idempotency (INV-7), so they are the *same fact*, fine.
- **But** the spec lets the *same author* assert the same `(target, value, validFrom)` with **two
  different HLCs** (two real writes at different times). Different `hlc` ⇒ different CID ⇒ distinct.
  Fine — they differ on `hlcWall`/`hlcCounter` *before* reaching `factCID`. Also fine.

The real tie hazard is **`replicaId` collision plus HLC collision plus identical validFrom with
*different signers*.** Two *different authority keys* assert the *same* `(target, value, validFrom,
hlc)` — e.g. two agents independently recording "Ada works at Acme from 2025-01-01" with a coincident
HLC. The canonical payload includes `provenance.publicKeyFingerprint` and `signature`? If `signature`
is **excluded** from `signedFields`-canonicalization (it must be — you can't sign over your own
signature), but `publicKeyFingerprint` (the authority key) **is** included, then the two facts differ
on the fingerprint field ⇒ different CID ⇒ no tie. **The spec never states that `publicKeyFingerprint`
is in the canonical payload.** Line 217 lists `signedFields` as "explicit ordered field set → verifier
rebuilds payload" but the *normative list* of what is in canonical payload is never given. If a
minimal `signedFields` (target, value, validFrom, hlc) is chosen, two distinct facts from two distinct
authors **collide on factCID** — `orderKey` is **not total**, and `proj` is non-deterministic on the
tie (which signer's value wins?).

**Why MAJOR.** This is a latent non-totality that depends entirely on an *unspecified* canonical-
payload field list. The spec asserts totality ("always unique") without pinning the input that makes
it true.

**Concrete fix.** Normatively specify the canonical payload as **including `publicKeyFingerprint`**
(and `replicaId`, and `v`), so two facts that differ in *any* author-distinguishing field get distinct
CIDs; OR add `publicKeyFingerprint` as an explicit `orderKey` component *before* `factCID`. State that
`factCID` totality is *contingent* on the canonical payload covering all author/replica-distinguishing
fields, and enumerate them. Add a conformance check (INV-3 extension) that no two distinct accepted
facts share an `orderKey`.

### M2-2. Excision re-applies commit signatures (C-4.4) — but that changes the commit objects, and any pin/`asOf`/`Kip-*` trailer keyed to the *old* commit CID is now stale; worse, re-signing is a *write by the excising actor* that is itself a fact with a NEW rxFrom, re-entering the C2-1 trap.

**Location.** §4.5 line 695 (C-4.4): "Commit-level signatures/trailers on rewritten commits… **MUST be
re-applied by the excising actor**"; INV-6 line 1170 ("commit signatures are re-applied post-rewrite").

**Why it fails.** (1) Re-applying commit signatures *changes the commit objects' bytes* → changes
their CIDs again (a signed commit's hash includes the signature). So "re-apply signatures" is a
*second* rewrite on top of the excision rewrite; the spec treats it as a touch-up but it compounds the
DAG-divergence of C2-3. (2) The excising actor's re-sign is performed at *their* `rxFrom`; if trust of
the *excising* key is itself later questioned, the C2-1 replica-local-time problem recurs for the
excision audit trail. (3) Most concretely: `fsck` (line 1143) must verify "every fact's author key
chains to the tenant root" — but after rewrite the **commit** author and the **fact** author differ
(the excising actor re-signed commits authored by others). The spec never says whether commit-author
≠ fact-author is allowed; INV-10 (line 1181) checks *fact* authority but the re-signed *commits* now
carry the excisor's signature over other authors' facts. An auditor cannot distinguish "excisor
legitimately re-signed" from "excisor rewrote content."

**Concrete fix.** Drop commit-level signatures as a trust anchor entirely — make **fact signatures the
sole trust anchor** (they already are, per line 694) and commit signatures purely advisory/optional,
explicitly *not* checked by `fsck`. Then excision need not "re-apply" them and the compounding rewrite
vanishes. State that commit objects are *transport*, not *trust*.

### M2-3. EID authority is bound to a key fingerprint *in the EID string itself* (`<tenant>/<authorityFpr>/<localId>`), so key rotation orphans the entire namespace — and there is no authority-transfer mechanism.

**Location.** §3.6 line 489–502 (`authorityNamespace = fingerprint of the AUTHORITY`), IdentityPolicy
`authority-local`.

**Why it fails.** The EID **embeds the authority key fingerprint** as its namespace component, and
equality requires the *full* EID to match (line 504). Now rotate the authority key (routine hygiene,
or forced by the C-6 revocation the spec just added):

- The old key `Kfpr1` is revoked. Every EID minted under it is `tenant/Kfpr1/localId`.
- The new key `Kfpr2` can only mint `tenant/Kfpr2/localId` — a **different namespace** ⇒ **different
  entity** by the equality rule. The new key **cannot assert about the old entities at all** (it is
  not an authority for `tenant/Kfpr1/*`).
- So after *any* key rotation, the entire historical entity population is **frozen** — no key can ever
  write to it again, because the only key that could is revoked. This is the direct collision of the
  C-5 fix (bind identity to key) with the C-6 fix (revoke keys).

The key-authorization chain (§8.1) authorizes a *new key for a namespace*, which suggests the intent
is "namespace is delegable across keys." But the EID **string** hard-codes `Kfpr1`. If
`authorityNamespace` is really "a *namespace owned by* an authority" (delegable), it must **not** be
the literal fingerprint of one key — otherwise rotation breaks it. The spec conflates "namespace
identity" with "current-authority-key fingerprint."

**Concrete fix.** Make `authorityNamespace` a **stable namespace id** (e.g. the fingerprint of the
*genesis* authority for that namespace, frozen) and let the **key-authorization chain** (§8.1) move
*write authority* over that fixed namespace from `Kfpr1` to `Kfpr2`. The EID never changes; the
authorized key does. Then: cross-tenant references (prompt's question) work iff a `grant` fact (§8.2)
authorizes a tenant-A key to *reference* (not write) tenant-B's namespace — references are by EID and
read-gated, which is fine since writes are still namespace-gated. State explicitly that **revoking the
authority key does NOT retroactively invalidate facts it signed** (they remain trusted up to
`effectiveFrom`); §8.1 line 1108 implies this but the EID-embeds-fingerprint design contradicts it
operationally.

### M2-4. `asOf` resolves against "the commit DAG of the replica being queried" using `rxFrom` — so as-of reads are non-reproducible across replicas AND across excision, and the conformance oracle (INV-4) is replica-specific, making INV-4 untestable as a *convergence* property.

**Location.** §4.3 line 636 (antichain frontier by `rxFrom`), INV-4 line 1163 ("agree with a
**per-replica** reference oracle built from R's ingest order").

**Why it fails.** INV-4 was strengthened to be *per-replica* (honest about M-5). But that means INV-4
tests *internal consistency of one replica's belief*, **not** that two replicas agree — and the spec
never provides an invariant asserting that `asOf({validTime})` (the *world-truth* axis, which should
be set-pure and convergent) is byte-identical across replicas. `asOf({validTime})` *should* be
convergent (it's `proj(S)` filtered by validTime, no `rxFrom` needed) but the spec routes **all** of
`asOf` through the `rxFrom`/DAG frontier (line 636), entangling the convergent validTime axis with the
non-convergent txTime axis. A caller asking purely "what was true at validTime V?" (no txTime) gets an
answer computed via the replica-local DAG walk, so it inherits replica-dependence it should not have.

**Concrete fix.** Split `asOf`: `validTime`-only reads are `proj(S)`-pure and **convergent** (add an
invariant: equal `S` ⇒ equal `asOf({validTime})` on all replicas). `txTime`/`believer` reads are
explicitly replica-relative (keep INV-4 per-replica but rename it "belief-consistency," not
"bitemporal soundness"). Add the missing convergent-valid-time invariant; without it the suite cannot
catch a regression where someone leaks `rxFrom` into the validTime path.

### M2-5. `revokeKey(keyFpr, asOf: HlcStamp, …)` takes an author-supplied `asOf` HLC, but §8.1 says revocation is checked against receiver `rxFrom` — the API and the semantics disagree on which clock `effectiveFrom` lives in.

**Location.** §6 line 1029 (`revokeKey(keyFpr, asOf: HlcStamp, reason)`); §8.1 line 1101
(`effectiveFrom` compared to receiver `rxFrom`); KeyRevocation.effectiveFrom line 1101.

**Why it fails.** `revokeKey` is called with an `asOf: HlcStamp` chosen by the *revoking actor* (an
author-space HLC). But §8.1 compares it to each fact's *receiver-assigned* `rxFrom` (a different
replica's clock). These are **two different clock spaces** (author HLC vs receiver HLC) that the spec
elsewhere is at pains to keep separate (M-4/M-5). Comparing a revocation's author-chosen `effectiveFrom`
against a fact's receiver-assigned `rxFrom` is comparing apples to oranges: the revoking actor has no
way to know what `rxFrom` any given replica will assign, so "facts with `rxFrom ≥ effectiveFrom` are
untrusted" is **unpredictable to the revoker** and **different on every replica** (this is the C2-1
mechanism again, surfaced at the API). A revoker cannot reason about which facts their revocation will
catch.

**Concrete fix.** Tied to C2-1: express `effectiveFrom` in **author-HLC space** and compare it to each
fact's **author HLC** (set-resident, deterministic), defended against backdating by drift-bound ε.
Then `revokeKey`'s `asOf` is meaningful and predictable, and the comparison is set-pure. Update line
1101's comment from "RECEIVER rxFrom" to "author HLC".

---

## MINOR findings (v2)

### m2-1. `confidence` advisory rule has a hole: a "custom reducer that reads confidence deterministically" (line 238) can still be non-convergent if confidence ties, and the spec offers no tiebreak guidance — INV-3 would catch non-determinism but not the *design* trap.
§2.4 line 238 permits confidence-weighted custom reducers "and document it." Fine, but two facts with
equal confidence and the reducer keying on confidence-then-? must fall back to `orderKey`; the spec
doesn't *require* custom reducers to terminate their tiebreak in `orderKey`. **Fix:** mandate that
every reducer's final tiebreak is `orderKey` (so totality is structural), not just "be deterministic."

### m2-2. `node-existence` retract vs prop facts: retracting existence while prop asserts remain — what does `proj` show?
§4.1 `Target` includes `node-existence` (line 544) and `node-prop` separately. If a `retract` of
`node-existence` lands but `node-prop` asserts for the same EID remain in `S`, does the node project as
gone, or as a propertied-but-nonexistent ghost? Undefined. **Fix:** specify existence as the gate
(`proj` suppresses props of a non-existent node) or as just-another-cell, and test it.

### m2-3. `pncounter` under excision: excising one increment fact silently changes a counter's value with no marker that the count is now "incomplete."
§4.5 re-folds heads after excision; a `pncounter` cell loses an increment ⇒ its value drops. The
nonce marker (C-4.3) records *that* something was excised but the counter cell shows no provenance
that it was altered. **Fix:** counter cells touched by excision should project a `kip:excised-input`
flag so a reader knows the aggregate is post-erasure.

### m2-4. INV-2 says "once non-excised fact-sets equalize **and** excision markers propagate" — but C2-3 shows the *commit DAG* never equalizes under concurrent excision; INV-2 only tests `/heads` + deterministic projections, so it would **pass while `asOf`/pins are broken.**
The invariant is scoped to heads-equality and silently excludes the DAG-equality that C2-3 breaks.
**Fix:** add INV-11: "after excision (incl. concurrent), `asOf` and pins resolve identically across
replicas via `factSetDigest`, independent of commit-CID divergence." This forces the C2-3 fix.

### m2-5. `manifest.json` "tenant root key set" is genesis-pinned (line 1078) but the spec never says how a *new tenant* is added to an existing repo, or whether manifest is itself a synced/merged file (a manifest merge conflict on `shardDepth`/`hashAlgo`/root-keys is a hard fork).
§3.1/§8.1. **Fix:** state manifest is immutable post-genesis (new tenants = new repos, or an
append-only `tenants/` fact log signed by a super-root), and that manifest is **never** 3-way-merged
(like `/heads`, bind it to a regenerate/reject driver).

### m2-6. `subscribe` frontier cursor (m-5 fix) plus `rxFrom`-demotion (C2-1) means a delta can flip a *previously-trusted* head to untrusted when a revocation arrives — but `FactDelta.affected` (line 868) only lists entities whose head changed *by new facts*, not entities whose head changed because a *revocation* re-demoted an old fact. Subscribers miss revocation-induced head changes.
**Fix:** `affected` must include entities re-folded due to revocation/excision, not only those touched
by newly-arrived asserts.

### m2-7. "salience-with-fixed-weights-and-seeds" is in the *deterministic* class (§5.3 line 933) but salience includes **centrality** (§5.4), a global graph property — incremental recompute of centrality on a partial graph is not generally byte-identical to a full recompute unless the algorithm is exactly specified.
§5.4 line 959. Centrality (e.g. PageRank/betweenness) is iterative and convergence-tolerance-dependent;
two incremental update paths can yield bytes differing in the last ULP. **Fix:** either pin an exact,
integer/rational centrality algorithm, or move centrality-bearing salience to the *accelerator* class
(recall-equivalent, not byte-identical) — it cannot be both "byte-identical" and "centrality-based."

---

## Cross-cutting assessment

- **The two flagship fixes collide.** C-1/C-3 demand `proj` be a pure set function; C-5/C-6 inject a
  per-replica quantity (`rxFrom`) into the trust decision `proj` makes. The revision fixed each in
  isolation and never re-checked their product. **C2-1 is the v2 analogue of v1's C-1: the SEC theorem
  is again unsound, now via trust-time rather than interval-clipping.** This is the biggest weakness.

- **Determinism-of-bytes is being used to launder absence-of-agreement.** C2-2 (concurrent supersede)
  and the default reducer's silent `factCID` tiebreak (line 414's conflict-surfacing applies only to
  *custom* reducers) mean genuinely contradictory states are resolved by hash order and presented as
  "deterministic convergence." That is a fallback wearing a determinism costume — against N5 and the
  repo rule.

- **Excision is honest about append-only but not about confluence.** C-4.x correctly admits the
  one-rewrite case; it never addresses concurrent rewrites (C2-3), and the commit DAG (which `asOf`
  and pins depend on, lines 636/857) does not converge under them. Pins survive via `factSetDigest`
  *only if* `dagTips` is dropped from the durable contract (M2-2/C2-3).

- **New internal contradictions found:** (C2-1: `proj` set-pure vs `rxFrom`-demotion), (M2-3: EID
  embeds key-fpr vs key-rotation/revocation), (M2-5: `revokeKey` author-HLC arg vs receiver-`rxFrom`
  check), (M2-2: fact-sig-is-sole-anchor vs commit-sig-must-be-re-applied), (m2-7: salience
  byte-identical vs centrality-based).

- **Genuinely resolved (verified, not hand-waved):** C-1, C-2, M-1, M-2, M-3, M-4, M-6, M-7, M-8, M-9,
  and the m-* series. The projection-as-set-function refactor is real and good; it is the *trust
  overlay* that re-breaks it.

- **Untestable/false invariants:** INV-1/INV-2 are **false** under C2-1 (heads not set-pure once
  revocation is in play). INV-4 is per-replica and so does not test convergence of the validTime axis
  (M2-4). INV-2 passes while `asOf`/pins break under concurrent excision (m2-4). The suite as written
  would **green-light a non-convergent build.**

---

## Biggest weakness

**`proj` is no longer a pure function of the fact set.** The v2 SEC theorem (§4b.4) stands on
"`proj(S)` depends only on `S`" (line 806), but the C-6 trust model makes `proj` demote facts to
`untrusted` based on revocation compared against **`rxFrom`, the receiver-assigned, per-replica
transaction time** (§8.1 line 1101; §3.6 line 519; §4.2 line 589). Two replicas holding the *identical*
non-excised fact set therefore compute *different* `/heads` whenever a fact crossed a revocation
boundary at a different `rxFrom` on each — a **permanent, byte-level** divergence with no excision
involved, i.e. a direct counterexample to the headline theorem and to INV-1/INV-2. The revision
eliminated v1's interval-clipping unsoundness and replaced it with a trust-time unsoundness of equal
severity. Until revocation/authority demotion is re-expressed in the **set-resident author-HLC space**
(defended against backdating by the already-core drift bound ε), and ingest-time rejection is
separated from set-pure proj-time demotion, the foundational "coordinator-free replicas converge to
byte-identical heads" claim remains **unproven and, as specified, false.**
