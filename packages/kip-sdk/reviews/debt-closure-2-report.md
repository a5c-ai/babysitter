# kip-sdk Debt-Closure Run 2 — Final Report

**Run:** `kip-debt-closure-2` (`01KXC278A836P3MNZR5AFM5XT4`)
**Scope:** Close the six debts left open after the M0–M6 build and the first debt-closure run — **D-32, D-33, D-34, D-35, D-36, D-37**.
**Outcome:** All six closed. Integration gate green end-to-end. One new tracked follow-up debt (**D-38**) opened for explicitly-deferred residuals.

---

## Result summary

| Debt | Title (short) | Path | Convergence | Acceptance |
|---|---|---|---|---|
| D-33 | M5 INV-A2 — `asOf.txTime` leaks per-replica state into the compile seam | mechanical-fix + review | ✅ score **95** | resolved in-fix |
| D-34 | M5 INV-A8 — `readAnswerGraph` not `asOf`-scoped | mechanical-fix + review | ✅ score **96** | resolved in-fix |
| D-35 | M5 ill-typed-chain check is self-loop-only (doc-accuracy) | mechanical-fix + review | ✅ score **92** | resolved in-fix |
| D-37 | M6 `rawRef.blob` unverified key (doc-accuracy) | mechanical-fix + review | ✅ score **92** | resolved in-fix |
| D-32 | Signing-identity persistence across `close()`/`open()` | full TDD (2 rounds) | ✅ reviewMin **91** | **PASS** |
| D-36 | Atomic `Repo.txn()` / accept-commit atomicity / `AssertInput.v` | full TDD (2 recorded rounds; extended out-of-band) | ✅ reviewMin **93** | **PASS** |

Review target was **min ≥ 85** across three independent adversarial critics (correctness / convergence-safety / code-quality) per round. Every debt converged above target; every claim was independently re-verified (build, test, `git diff`, direct test execution) rather than trusted from any agent self-report.

---

## Phase 1 — mechanical fixes (D-33, D-34, D-35, D-37)

Each was a targeted fix guarded by a single adversarial-review pass.

- **D-33 (score 95):** INV-A2 violation — `ContextualQuery.asOf.txTime` resolved through this replica's own non-convergent `rxFromByOid` history, so two replicas could compile byte-different `Segment` sets from a nominally-identical `asOf`. Closed by adding `ERR_ASOF_TXTIME_NOT_SUPPORTED_FOR_COMPILE` at the compile-determinism seam. **Whack-a-mole lesson:** the first two rounds patched only one call site at a time (`compileContextualQuery` → `executeSegment` → `learn()`); closure required an exhaustive grep-sweep of every `selectFactsForContextualAsOf` call site (6 reachable paths, all guarded).
- **D-34 (score 96):** INV-A8 — `readAnswerGraph` threaded `resolvedAsOf` via `selectFactsForContextualAsOf(asOf)` instead of unconditional `currentFacts()`; both `executeSegment` call sites updated. The D-33 lesson was briefed into this fix, which proactively checked both call sites and closed in one round.
- **D-35 (score 92):** doc-accuracy — `ERR_ILL_TYPED_SEGMENT`'s `KipErrorCode` doc comment rewritten to state intended-vs-actual scope (self-loop-only heuristic pending a real schema-registration API). No code behavior changed.
- **D-37 (score 92):** doc-accuracy — `docs/32`'s residuals section reworded so the provenance names the *declared* `rawRef` (caller-declared, not content-verified), cross-referencing the existing `BlobRef` doc comment and bounding tests. No code behavior changed.

## Phase 2 — full spec-driven TDD builds (D-32, D-36)

### D-32 — durable signing-identity persistence (reviewMin 91)

Surfaced by real on-disk `open()`/keyring lifecycle testing (not the internal `ingest()` bypass): there was no durable signing-identity persistence across `close()`/`open()`, so facts authored before a restart failed signature verification and were silently dropped on re-sync.

- Round 1 (min 74): convergence-safety found `exportKeyring()` returned a plaintext private key with zero security warning, and `SyncReport.signatureInvalid` didn't count `malformed` rejections (a silent-drop reintroduced for a different reason).
- Round 2 (min 91): both closed — thorough SECURITY doc comment + a new `docs/50` subsection; `SyncReport.malformed` counter added mirroring `signatureInvalid`.
- Delivered: `generateEd25519KeyPair`/`importEd25519KeyPair`/`Ed25519KeyPair` re-exported on the public surface; `KipRepo.exportKeyring(): {privateKeyPem, publicKeyPem}` implemented (PEM-serialized via `pkcs8`/`spki`); `SyncReport.signatureInvalid`/`malformed` counters wired into `sync()`.
- **Acceptance: PASS.** Residuals: a Status-line bookkeeping omission (since resolved) and a multi-tenant key-reuse documentation note.

### D-36 — atomic `Repo.txn()` / accept-commit atomicity / `AssertInput.v` (reviewMin 93)

The debt's own three concerns: `isAssertInputArray` never validated `AssertInput.v`; `learn()`'s accept-commit sequence committed facts one at a time with no rollback on mid-batch failure; and `Repo.txn()`/`Tx` were unimplemented throwing stubs. Owner chose the root-cause fix (a real, working `Repo.txn()`) over the cheaper `v`-only patch.

The delivered `KipRepo.txn()` is a genuine transaction: in-memory fact staging validated through a shared `computeIngestVerdict` (extracted from `ingest()`); a real content-addressed git commit written via `writeFactsTreeAndCommit` (sharing `regenerateHeads()`'s D-27/INV-12 byte-recipe) against the real substrate, chained through a new `CommitTipStore`; a per-txn shadow sequencer/HLC folded into real state only on commit success (so an aborted txn never burns a `seq`); `AsyncLocalStorage`-scoped per-txn token isolation (a direct write during another txn's in-flight callback is refused, never silently absorbed); `learn()`'s accept-commit refactored onto `txn()` with a shared `authorLearnExhaustedMarker`; `ensureExistenceFor` batch-scoped dedup; and the `AssertInput.v` gate.

**Convergence note (honest):** the run's own recorded loop shows round 1 min 38 → round 2 min 93, but D-36's true path was exceptionally long. A recurring bug *class* — an unguarded fallible call inside `txn()` throwing before cleanup ran, permanently poisoning the instance (`txnActive` stuck true → every future `txn()`/`assertFact`/`retractFact` rejects with `ERR_TXN_ALREADY_ACTIVE` forever) — was found and locally patched at **six** successive call sites by successive fresh critic passes. It was then closed **structurally, not with a seventh point-patch**: `txn()`'s entire post-`txnActive` body is now wrapped in one bare `try { … } finally { resetTxnState(); }`, making cleanup independent of *where or what* throws. The final independent 3-critic pass (correctness **96** / convergence-safety **97** / code-quality **93**) judged this a genuine structural closure of the bug class — the correctness critic ran four fresh throw-injection probes (`mintFact` throwing, a bare-string throw, an `undefined` throw, a top-of-`try` throw), all propagating cleanly with the instance surviving. Two adjacent tip-persistence criticals were closed in the same span (a `getSubstrate()` premature-publish silent-reseed-disable; non-atomic/unguarded tip side-file I/O, hardened with `writeJsonAtomic` + typed `CorruptTipFileError` + a self-healing per-chain seq cross-validation on reseed).

**Acceptance: PASS** (recency-anchored, all five criteria — `v`-validation, real `txn()`, atomic accept-commit, no permanent poisoning, no regression — verified against the current source, including an independent throw-injection scratch test).

---

## Integration gate (Phase 3)

Full gate run end-to-end, all green:

- `git diff --quiet -- package-lock.json` — lockfile untouched
- `npm run build:sdk` — clean
- `npm run build --workspace=@a5c-ai/kip-sdk` — clean (`tsc`)
- `npm run test --workspace=@a5c-ai/kip-sdk` — **51 files / 257 passed / 10 skipped / 0 failed**
- `npm run verify:metadata` — passed
- `check-doc-links.mjs` — OK (39 files, all relative links + anchors resolve)

The four frozen debt-closure test files (`debt-closure-d32/d33/d34/d36`) were confirmed byte-identical throughout every round.

---

## Deferred residuals → D-38

The following were explicitly scoped OUT of D-36's acceptance and rolled into a single tracked follow-up debt, **D-38** (see `docs/DEBTS.md`):

1. `KeyRegistryStore`/`SelfWitnessedExcisionStore` still use the pre-hardening bare-write/unguarded-`JSON.parse` pattern (a diagnostics/consistency gap now, not a silent-corruption hazard, since `getSubstrate()` fails loudly-and-retries).
2. `writeJsonAtomic()` leaks its temp file if the `rename` itself fails.
3. `getSubstrate()`'s per-chain max-seq fold duplicates `computeChainFrontier` (drift risk).
4. A ~1.4% flaky assertion in `round6-tip-persistence-crash-safety.test.ts` (parallel-worker/OS-fs timing, not fully root-caused).
5. **`Substrate.createTemp()`/`close()` never delete the per-instance temp directory** — the highest-impact item: it leaked tens of thousands of `kip-sdk-*` dirs during this run and exhausted the host `C:` drive (0 bytes free), causing spurious `ENOSPC` failures. The leftover dirs were cleaned up (with the owner's explicit authorization) during the run.

Two honest scope boundaries carried by `txn()` itself remain disclosed in `docs/DEBTS.md` (not silently resolved): direct non-`txn()` writes aren't swept into the commit-DAG until a later `txn()`/`regenerateHeads()`; and two `KipRepo` instances racing `txn()` against the same `substrate.dir` is unsupported (no cross-instance file locking).

---

## Process notes

- The session's Babysitter auto-binding never engaged (`session:whoami` → null), so every run step was driven manually via `run:iterate`/`task:post`, with each shell effect executed and re-verified by the orchestrator and each agent effect's claims independently re-run before posting.
- A run-tooling anomaly (a stale `integration-fix` agent effect co-pending with `integration-gate`/`final-report` after the gate already passed, `integrationOk: true`) was handled by executing the real gate, confirming it genuinely passes end-to-end, and posting the true result — the same benign anomaly seen in the M5+M6 build, not a regression.
