# D-68: read-level reversibility of identity links — build report

**Item:** `d68-read-level-unmerge` · **Closes:** D-68 · **ADR:** B15 · **Branch:** `staging`
**Status:** shipped, convergence-critiqued (93/100), gap-closed. A change to proj.ts (the CRDT core).

## Problem

The entity linker (ADR-B11), Layer-2 resolver (ADR-B12), and RDF ingestion (ADR-B14) all author identity
links as reversible `same_as` / `not_same_as` edge facts — but reversibility was **fact-level only**. proj's
`same_as` union-find and `not_same_as` dispute loop raw-iterated the assert facts (gated only on
`f.type !== "retract"` + `isTruthyExistence`), never consulting whether the edge's existence was currently
**live**. So retracting a `same_as` left `getNode` merged (no un-merge); retracting a `not_same_as` left
`getNode` returning `kip:conflict` (no un-veto). The read lagged the operator's latest fact.

## The fix

Both folds now iterate `[...edgeEids].sort()` and fold/dispute **only over live edges**, gated on
`edgeValidAt(eid, null)` — the segment-based existence authority (`existsAtInstant` →
`computeEdgeExistSegments`) that `getEdge`, `traverse`, and `edgeExistenceFactId` already share, and which
honours `retract`, an LWW-superseded-to-falsy existence, **and** M8 demotion. `kind`/`from`/`to` come from
`getEdge`'s LWW winner, so a conflicted-existence edge (→ `KIP_CONFLICT_KIND`) is skipped, never silently
merged. Liveness now lives in **one** place.

**Corrected premise:** the initial plan gated on `getEdge(eid) !== null`, but `getEdge`'s null gate only fires
for the all-retract/all-demoted case — an assert-then-retract edge still returns a non-null `getEdge` view
(kind from the assert-only LWW winner). The real read-level liveness authority is `edgeValidAt`/`existsAtInstant`,
which is what the fix uses.

## Convergence safety (the real risk in proj)

- **Determinism / byte-identity:** the fold iterates edge eids in **sorted** order; `getEdge`/`edgeValidAt` are
  pure over the pre-sorted `byCell` (no clock/random/Map-order). Union-find parent pointers are order-sensitive,
  but the canonical is chosen by `nsLocalKey`-min over class members and `sameAsClass` re-sorts, so the **output**
  is order-invariant across any fact permutation.
- **No perf regression:** `getEdge` is memoized (`edgeViewCache`); the fold merely warms the cache the later
  eager adjacency pass builds. No O(n²), no TDZ (hoisted decls; deps initialized before the fold).
- **Hygiene:** the `not_same_as` pair key's load-bearing NUL-byte separator is preserved (7 NULs, 0 CR — LF
  intact); ~45-line diff (29+/16-) localized to the two loops; no declaration reordering; only proj.ts + the new
  test changed; no frozen/conformance test weakened.

## Quality

Adversarial convergence critic **93/100 — shippable** (deterministic, liveness-correct, no over/under-un-merge,
no perf regression, NUL intact, no regression). Its one **minor** — the demotion/LWW-to-falsy parity that the
code comments claim was covered only indirectly via the shared `edgeValidAt` seam — was **closed** by a
dedicated LWW-superseded-to-falsy test (author a `same_as`, then a later falsy-existence assert supersedes it →
un-merged with no retract), plus a self-contained concrete assertion in the determinism test. The demotion path
rides the identical `edgeValidAt → computeEdgeExistSegments(demotedFacts)` seam and is covered by `getEdge`'s own
demotion conformance.

## Tests

`d68-read-level-unmerge.test.ts` (6): un-merge after a `same_as` retract (incl. `sameAsClass`); un-veto after a
`not_same_as` retract + full un-merge; `same_as` retract while a veto is live; 3-member-chain partial un-merge
(no over-un-merge); LWW-superseded-to-falsy (no retract) does not fold; permutation determinism with concrete
pinned projection. The retract/un-veto/partial and LWW cases genuinely fail on the pre-fix code.

## Suite

`959 passed | 8 skipped`. Build clean; cross-package `build:sdk` green; `package-lock.json` untouched; LF.

## Files

- `src/proj.ts` — the `same_as` fold (~2161-2179) and `not_same_as` dispute (~2233-2246) gated on `edgeValidAt`.
- `src/__tests__/d68-read-level-unmerge.test.ts`.
- `docs/70-decision-records-adr.md` (ADR-B15) · `docs/DEBTS.md` (D-68 resolved).
