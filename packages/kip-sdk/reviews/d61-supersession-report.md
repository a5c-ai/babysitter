# D-61: temporal supersession surfaces in graph-QA retrieval — build report

**Item:** `d61-supersession` · **Closes:** D-61's deterministic core (partially addressed) · **ADR:** B16 · **Branch:** `staging`
**Status:** shipped after an adversarial round that caught a `same_as`-class leak (the D-60-class failure again).

## Problem

A learned graph retains a superseded design-choice edge as `status:"current"`, so `kip ask` presents a
superseded choice as present-tense (the live demo saw a pre-decision "Orchid writes Ledger" edge marked
`status:"current"` after the document's later decision superseded it). No modeling of temporal supersession.

## What shipped (graph-QA retrieval layer; proj untouched, `getNode` unchanged — owner-chosen)

- **Convention:** a `supersedes` edge — `edgeKind:"supersedes"`, `from`=superseding (new) node, `to`=superseded
  (old) node. An ordinary signed fact (not a reserved kip kind).
- **Retrieval semantics:** a node X reached as the `to` of a **LIVE** supersedes edge (liveness via the
  D-68-correct `edgeExistenceFactId`) is superseded. X's own `status:"current"` and its **outgoing** claim
  edges' `status:"current"` are **overridden to `"superseded"`** in the assembled context — not merely flagged
  (the D-60 lesson: a flag a value-reading synthesizer ignores is not a fix) — plus `superseded`/`supersededBy`
  markers and the citable supersedes edge. A **retracted** supersedes edge reverts the target to `"current"`.
- **`same_as`-class expansion:** supersession expands across `repo.sameAsClass` so every class member (mapped to
  the min live supersedes factId) is superseded — no leak via aliasing.

## The adversarial round that mattered

The first cut passed its own 5 tests and my own base-case empirical check (a superseded `writes` edge read
`"superseded"`; a retracted supersedes reverted it). But the critic found a real, empirically-confirmed
**D-60-class leak** (score 72): supersession was keyed by the **literal** `supersedes.to` eid and **not
expanded across the `same_as` class**. Because `getNode(alias)` returns the canonical merged view and §3a reads
each member's own cells, a superseded decision described across two `same_as`-merged documents leaked
`status:"current"` under the alias eid — un-overridden — in **both** target directions. Since `same_as`
cross-doc merge is first-class (D-66 / `kip link` / Layer-2 resolver), that's a realistic reachable graph, and
it defeated the central robustness guarantee; ADR-B16/DEBTS also overclaimed "never reads current".

**The corrected fix** expands supersession across the whole `same_as` equivalence class. Independently
re-verified in both directions:

```
supersedes → canonical A: [A:superseded, B:superseded, B:superseded, writesA:superseded, writesB:superseded]  → 0 "current" leaks
supersedes → alias B:     [A:superseded, B:superseded, B:superseded, writesA:superseded, writesB:superseded]  → 0 "current" leaks
```

The D-60 composition (a prop both cross-doc-conflicted **and** superseded) applies the same override to the
conflicted-with-value datum, so no `"current"` survives even there while D-60's conflict flag + candidates and
non-status nameability are preserved. The overclaim was removed; the "never reads current" guarantee is now
accurate for the merged case. (Lesson captured to memory: any graph-QA per-eid overlay must expand across the
`same_as` class — the same masking bit D-60 and D-61.)

## Honest scope (PARTIALLY ADDRESSED — no overclaim)

- **Deterministic core SHIPPED:** the retrieval-layer surfacing (convention + override + class expansion) is
  deterministic, read-only (INV-A1), N5 (only a real live supersedes edge marks historical).
- **Model extraction is LIVE-GATED + nondeterministic:** the `encode`/`learner` prompt now instructs the model
  to emit a `supersedes` edge when a document records a superseding decision — best-effort, `KIP_LEARN_LIVE`,
  efficacy model-dependent.
- **Follow-ons (not claimed closed):** getNode-direct / proj-level projection; true **bitemporal `validTo`**
  invalidation (the learn path has no real valid-time — `validFrom` is 0, so supersession is surfaced via the
  relationship graph, not a valid-time interval).

## Quality

Adversarial critic 72 → fixed → independently re-verified (both directions, no leak; retract reverts;
determinism tie-break now tested). Suite `974 passed | 8 skipped` (+8 D-61 tests, incl. both same_as
directions); proj.ts untouched; lockfile clean; LF; zero new deps; only 5 files changed.

## Files

- `src/graph-qa/index.ts` — supersession pre-pass (literal live targets → `sameAsClass` expansion) + the status override across node/§3a/edge loops.
- `src/learn/index.ts` — live-gated `supersedes`-emission prompt.
- `src/__tests__/graph-qa.test.ts` — `graph-qa D-61` block (base, both same_as directions, N5 negatives, retract-reverts, determinism tie-break).
- `docs/70-decision-records-adr.md` (ADR-B16) · `docs/DEBTS.md` (D-61 partially addressed, honest residuals).
