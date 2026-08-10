# D-60: cross-document contradictions surface as conflicts in graph-QA retrieval — build report

**Item:** `d60-cross-doc-conflict` · **Closes:** D-60 (retrieval-layer) · **ADR:** B12c correction · **Branch:** `staging`
**Status:** shipped after an adversarial round that caught a partial-closure-presented-as-full and forced the real fix.

## Problem

Two documents' facts about one entity, joined by a `same_as` edge, that DISAGREE on a scalar prop
(`doc:A#e` employer="Acme", `doc:B#e` employer="Globex") were never surfaced as a contradiction. Verified
empirically: `getNode(A)` is a canonical **redirect** (returns only the canonical member's cells), so B's
"Globex" sits in a disjoint cell and proj's per-cell conflict never fires across documents. **ADR-B12c
overclaimed** that a confirmed merge already surfaced this via proj — false; corrected here.

## The fix (graph-QA retrieval layer; proj untouched, `getNode` stays a redirect)

Extends the D-66 §3a `same_as` prop-union: a pre-pass enumerates each retrieved seed's `same_as` class,
reads each member's own cells RAW, and flags any prop with **≥2 distinct covering scalar values across
distinct members of ONE class** (per-class — two unrelated classes sharing a prop key are never cross-flagged;
free-text props excluded; class-of-one never self-conflicts; agreeing props stay plain D-66-union datums).

## The adversarial round that mattered

The first implementation passed its own tests (966 green) but a **demo + critic both independently found it
did not robustly surface** (critic score **60, not shippable**):
- "Acme" survived as **two plain, authoritative-looking** datums — including `getNode(B)` mis-attributing
  "Acme" to blobB (which actually asserts Globex);
- the conflicted datum was **valueless**, and the fix had **removed** the pre-existing plain "Globex" datum, so
  the losing value appeared **nowhere** — a **soft D-66 regression**;
- so a value-reading synthesizer would answer "Acme" authoritatively and couldn't even name "Globex".
The tests passed only because the positive test asserted `conflicted.length > 0` and never asserted the
**absence** of a plain authoritative value.

**The corrected fix** makes the surfacing **symmetric and nameable**: for a contradicted prop, the main node
loop's plain value datum is **suppressed on every member** (including the redirect duplicate), and §3a records
**one conflicted datum per member carrying that member's own competing value** + `conflicted:true` + the shared
sorted candidate FactIds. Independently re-verified against the exact fixture:

```
{eid:doc:blobA#ed, prop:employer, value:"Acme",   conflicted:true, candidates:[FA,FB]}
{eid:doc:blobB#ed, prop:employer, value:"Globex", conflicted:true, candidates:[FA,FB]}
→ both values present; ZERO plain authoritative datums; agreeing `name` prop unflagged.
```

A synthesizer now sees "sources disagree: Acme (A) vs Globex (B)" and cannot take one as authoritative — at
least as recoverable as the within-cell conflict case, and strictly more so (the within-cell datum carries no
value; the cross-doc datum carries each competing value).

## Honest residuals (disclosed in DEBTS, not overclaimed)

1. Whether the answer **prose** frames the dispute is model-dependent — the substrate guarantees only that both
   values + the conflict flag are in the citable context.
2. A member whose covering segment is itself a **within-cell** conflict does not fold its candidate values into
   the cross-member scalar comparison (documented non-goal).
3. `getNode`-direct cross-document conflict surfacing (making proj itself expose it, not only retrieval) remains
   a follow-on.

## Quality

Adversarial critic 60 → fixed → independently re-verified (symmetry, both values recoverable, per-class
detection, no plain authoritative value, agreeing props unflagged, determinism). A latent per-class detection
bug was also fixed in the process. Suite `966 passed | 8 skipped`; proj.ts untouched; lockfile clean; LF; zero
new deps; only 4 files changed (graph-qa + test + ADR + DEBTS).

## Files

- `src/graph-qa/index.ts` — §3-pre cross-conflict pass + suppression + per-member value-carrying conflicted datums.
- `src/__tests__/graph-qa.test.ts` — `graph-qa D-60` block (positive now asserts no-plain-datum + both values recoverable; honest negatives).
- `docs/70-decision-records-adr.md` (ADR-B12c correction) · `docs/DEBTS.md` (D-60 resolved-with-residuals).
