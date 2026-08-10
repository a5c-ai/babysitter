# `@a5c-ai/kip-sdk` — M5+M6 Build Report

> Reports the run that built **M5 (active knowledge: contextual functionalities)** and **M6 (active
> knowledge: autoencoding — `learn()`)** on top of the M0-M3 build (`reviews/build-final-report.md`) and
> the subsequent 6-debt closure run (`reviews/debt-closure-report.md`). Covers: a pre-Phase-D dependency
> audit that found and closed a real M4/T5.4 gap M5 depends on, M5's 4 TDD rounds (acceptance: GAPS), M6's
> 4 TDD rounds (acceptance: PASS), and the integration gate. Everything below is drawn from this run's own
> journal/commit history — nothing is invented.

---

## 1. Dependency audit (before Phase D)

M5's T6.2 (`ContextualQuery` compile) depends on M4's T5.4 (bounded graph expansion). M4 was never built
as a whole milestone, so rather than skip the dependency, T5.4 specifically was audited before starting M5.

The audit found a **real gap**: `traverse()`/`edgesTouching()` treated "ever asserted" as sufficient for
edge crossability instead of "valid at the queried instant" — so expired/retracted edges still occupied
the bounded `maxFanout` budget and could be traversed at a later `asOf` instant. This was independently
reproduced live by the orchestrator both before and after the fix.

Closed via a new `edgeValidAt()`/`existsAtInstant()` predicate in `proj.ts` (`existsAtInstant` at
`proj.ts:1094`, `edgeValidAt` at `proj.ts:1295`/`1415-1416`), gating `traverse()`'s frontier expansion and
fanout counting by validity at the query instant (wired at `proj.ts:1815`). Verified: build clean, 30 files
/ 129 tests passed / 10 skipped, and the T5.4 gap fix independently reproduced closed.

Committed as `24b7b5ff1` ("feat(kip-sdk): close M4/T5.4 gap (bounded graph expansion) — M5 dependency
audit").

---

## 2. M5 — active knowledge: contextual functionalities

**Frozen tests first** (commit `9509fbd46`): 7 new conformance files covering INV-A1, A2, A3, A6, A7, A8,
A11. 22 new tests failed honestly on unimplemented-throw; 30 pre-existing files stayed green.

### Round 1 (min=27)

Implemented `registerFunctionality`/`compileContextualQuery`/`executeSegment`/`runContextualQuery`/
`provenanceOf` + `same_as` union-find closure. 3 critics found:

- A multi-hop realizer was silently picked instead of surfaced as `alternatives` (N5/INV-A7 violation).
- `q.asOf` was accepted but never actually scoped reads.
- No real microagent dispatch (fabricated output).
- The ill-typed-chain check was curve-fit to one test.
- A constraint (claim-8) was structurally unreachable.
- A swallowed JSON-parse fallback in `readAnswerGraph`.
- `not_same_as` unimplemented.

### Round 2 (min=34)

Fixed all 3 criticals plus 4 of 5 majors:

- A real, injectable `dispatchMicroagent` seam with `outputSchema` validation.
- `q.asOf` now genuinely scopes reads via `selectFactsForContextualAsOf` (`index.ts:1789-1795`).
- Multi-hop cross-product alternatives (no more silent single-realizer pick).
- The constraint was made reachable.
- `readAnswerGraph`'s swallowed-JSON fallback replaced with a distinguishable sentinel
  (`KIP_MALFORMED_DERIVED_FROM_EDGE_KIND`, `index.ts:3132-3139`).
- `not_same_as`/`kip:conflict` implemented.

Ill-typed-chain was left as an honestly-documented gap (no schema/`is_a` API exists at M5) — this becomes
D-35 below.

### Round 3 (min=31, a regression)

2 of 3 round-2 criticals held, but the hop-identity-collision fix (percent-encoding only the realizer
suffix) was incomplete — `edgeKind`/producer segments were left unencoded, independently reproduced as a
live collision by the orchestrator and 2 of 3 critics.

### Round 4 (min=33, final round)

Fully closed the EID-collision bug class via new `materializedEidFor`/`derivedFromEdgeEidFor` helpers
percent-encoding EVERY joined segment — independently reproduced by the orchestrator as fixed via the real
helper.

Round-4 critics scored spec-fidelity=58, convergence-safety=33, code-quality=85 — **min=33** is M5's true
final round-4 floor.

### M5 acceptance: GAPS

5 of 7 invariants (INV-A1, A3, A6, A7, A11) genuinely pass. Two fail:

- **INV-A2 fails**: `ContextualQuery.asOf.txTime` (a replica-local, non-convergent audit axis) is not
  rejected/stripped from the compile-determinism seam, letting two replicas compile contradictory `Segment`
  sets at a nominally-"same" `txTime` pin — live-reproduced.
- **INV-A8 fails**: `readAnswerGraph` never threads the resolved/pinned `asOf`, so a pinned-`asOf`
  `AnswerGraph` is not actually reproducible against unrelated intervening activity — live-reproduced
  independently by 2 critics and the acceptance reviewer.

Committed as `87f65b505` ("feat(kip-sdk): M5 implementation (TDD converged min=33, acceptance GAPS)" — the
commit message says min=33; this report confirms 33 is the correct final round-4 min for M5, not to be
confused with M6's round-4 min of 63, below).

---

## 3. M6 — active knowledge: autoencoding (`learn()`)

**Frozen tests first** (commit `7084b4cc0`): 6 new conformance files covering INV-A4, A5, A9, A12, A13,
A14. 13 new tests failed honestly; 37 pre-existing files stayed green.

### Round 1 (min=58)

Implemented `learn()` — explicit manifest selection, disjunctive budget loop, accept-if-improved,
`kip:learn`/`kip:learn-exhausted` fact recording. 3 critics found:

- `kip:learn` facts excluded from ALL cell-folding (no real reducer, so disjoint competing accepted sets at
  the same key could silently dual-commit).
- `Date.now` used as a "monotonic" clock default.
- Unverified `rawRef.blob` trusted as key material.
- `ensureExistenceFor`'s staleness bug (ignores retraction).
- A `?? []` fallback silently coercing malformed encode/learner output into an empty accepted set instead
  of infinite-loss.

### Round 2 (min=70)

Fixed the `?? []` fallback (role-based branching + structural guard), added a real `foldLearnCell` reducer
in `proj.ts` (keyed on `rawRef`/`ontologyAsOf`/manifest, loss excluded, surfacing genuine conflict for
disjoint accepted sets via new `getLearnResult()`), fixed the clock (`performance.timeOrigin+performance.now()`,
genuinely monotonic), documented the `rawRef.blob` limitation honestly with bounding tests (`index.ts:131-148`).

New critical found: `learn()` crashes with an uncaught `TypeError` on legitimately undefined dispatch
output (worse than the round-1 silent-`[]` bug) — and a related crash when a candidate is missing the
`provenance` field.

### Round 3 (min=58, a regression)

Fixed both named crash scenarios (undefined dispatch output; missing provenance) via explicit guards + a
strengthened `isAssertInputArray`. But this fix was narrow — a `target: null` (which passes the shallow
`"target" in item` check, true even for `null`) reopened the identical partial-commit hazard: an earlier
valid item in a batch could commit durably before a later malformed item crashed uncaught, with no
`kip:learn`/`kip:learn-exhausted` audit fact ever authored. Independently reproduced by 2 of 3 critics.

### Round 4 (min=63, final round)

Closed the bug class structurally — exported `well-formed.ts`'s real `isWellFormedTarget` and had
`isAssertInputArray` call it directly (`index.ts:4147-4180`), closing both `target:null`/`undefined` and
`target:{kind:nonsense}` at the same gate, plus added a defense-in-depth `try`/`catch` around the whole
accept-commit sequence (`index.ts:3794-3936`) that authors a durable `kip:learn-exhausted` marker naming
any partially-committed facts before throwing a new typed `ERR_LEARN_COMMIT_FAILED` — converting any
REMAINING unforeseen commit failure from silent to fully audited (never silent), though not fully atomic
(`Repo.txn()` remains an unimplemented M0/T1.5 stub, `index.ts:1459-1461`).

Round-4 critics still found: `isAssertInputArray` omits validation of the `v` field (a required `Fact`
envelope field) — confirmed against source: `isAssertInputArray` (`index.ts:4147-4180`) checks `type`,
`target` (via `isWellFormedTarget`), `validFrom`, `validTo` (presence), `replicaId`, and `provenance`, but
never checks `item.v` — so a malformed-`v` candidate could still cause the same class of mid-batch partial
commit. Narrower than before, but not zero, and honestly acknowledged as tied to the pre-existing lack of a
real `Repo.txn()`.

### M6 acceptance: PASS

All 6 exit-criteria invariants (INV-A4, A5, A9, A12, A13, A14) genuinely pass with concrete evidence. The
residual partial-commit/atomicity gap is correctly scoped as a general robustness property tied to the
pre-existing `Repo.txn()` stub (not unique to M6), NOT a violation of any of the six named invariants — an
honestly-disclosed residual outside the literal exit criteria, not a hidden defect.

Committed as `3891f6d2f` ("feat(kip-sdk): M6 implementation (TDD converged min=63, acceptance PASS)").

---

## 4. Integration gate

Full `build:sdk` chain, kip-sdk build+test (**46 files / 194 tests passed / 10 skipped**),
`verify:metadata`, and doc-link check — **ALL PASS**.

Note: the first `run:iterate` attempt at this gate produced a spurious/orphaned failure artifact in the
run's journal with no actual command execution behind it. The orchestrator independently re-ran the exact
same gate command chain by hand and confirmed it genuinely passes end-to-end. This was a run-tooling
anomaly, not a real regression, and is noted here for transparency, not as a debt.

---

## 5. New debts logged

Five new implementation-era debts were opened in `docs/DEBTS.md` under "Audit round 6" — D-33 through
D-37 — each verified against the actual current source before being recorded (see that file for full
evidence/fix/status). Summary:

| Debt | Milestone | Severity | Status |
|---|---|---|---|
| D-33 | M5 (INV-A2) | Major | Open |
| D-34 | M5 (INV-A8) | Major | Open |
| D-35 | M5 (ill-typed-chain scope) | Minor | Open (honestly disclosed since round 2, not a regression) |
| D-36 | M6 (partial-commit/atomicity residual) | Major | Open |
| D-37 | M6 (`rawRef.blob` advisory-only identity) | Minor | Open (honestly documented + bounded by tests since round 2) |

D-32 (signing-identity persistence across `close()`/`open()`, logged earlier this session, round 5) is
**unaffected by this run** — it is unrelated to M5/M6 and was explicitly out of scope for this build. It
remains `Open` and was not touched.

---

## 6. Summary scorecard

| Phase | Rounds | Min progression | Final round min | Acceptance | Status |
|---|---|---|---|---|---|
| M4/T5.4 dependency audit | 1 (mechanical fix) | — | — | n/a | Closed (real bounded-fanout validity-at-instant gap fixed) |
| M5 — contextual functionalities | 4 | 27 → 34 → 31 → 33 | 33 | GAPS (5/7 invariants pass; INV-A2, INV-A8 fail) | Converged with disclosed gaps |
| M6 — autoencoding (`learn()`) | 4 | 58 → 70 → 58 → 63 | 63 | PASS (6/6 invariants pass) | Converged |
| Integration gate | — | — | — | build:sdk / test (194 passed, 10 skipped) / verify:metadata / doc-link check all PASS | PASS |
