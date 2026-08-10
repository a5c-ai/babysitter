/**
 * debt-closure-d34.test.ts — ADDITIVE regression coverage for closing D-34, recorded in
 * `packages/kip-sdk/docs/DEBTS.md`:
 *
 * D-34 ("M5's INV-A8 violation — readAnswerGraph never threads the resolved/pinned asOf"):
 * `readAnswerGraph`'s own doc comment claims it is "a PURE READ over currently-admitted facts"
 * (INV-A8), but it unconditionally called `this.currentFacts()` — the LIVE, unpinned admitted set —
 * regardless of whether the enclosing `executeSegment`/`runContextualQuery` call was made with a
 * pinned `asOf`. `executeSegment` already threads its own resolved `asOf` (`resolvedAsOf`) through
 * every OTHER guard read (`anyEdgeOfKindExists`, `resolvedGetNode`, `findRegisteredManifest`,
 * `findMatchingFact`), but never into `readAnswerGraph` itself — so a pinned-`asOf` read-back could
 * silently grow to include facts asserted (at a validFrom on or before the SAME pinned validTime,
 * but recorded LATER in real/ingest time) by unrelated, intervening activity, breaking INV-A8's own
 * "re-running at the same pinned asOf is byte-identical" promise.
 *
 * FIX: `readAnswerGraph` now accepts an optional `asOf` and folds
 * `this.selectFactsForContextualAsOf(asOf)` (the SAME pinned-frontier fact-set selector every other
 * guard read in `executeSegment` already uses) instead of the unconditional `this.currentFacts()`.
 * `selectFactsForContextualAsOf` itself already returns `this.currentFacts()` unchanged when its
 * `asOf` argument is `undefined` (see that method's own doc comment) — so the unpinned/live case
 * (the vast majority of the frozen M0-M6 suite, which never passes an `asOf`) is completely
 * unaffected; this is not a fallback masking an error, it is the SAME selector `findMatchingFact`
 * already calls unconditionally, now applied here too. `executeSegment` threads its own
 * `resolvedAsOf` into BOTH of its `readAnswerGraph` call sites — the `steps.length === 0` early
 * return AND the end-of-method return — closing both reachable paths at once (per this debt's own
 * warning about D-33's first attempt missing an adjacent call site: `grep -n "readAnswerGraph("
 * src/index.ts` was re-run against the CURRENT source before this fix, confirming exactly these two
 * call sites, both inside `executeSegment`).
 *
 * REPRODUCIBILITY NOTE on how test (a) below actually exercises the fix: this SDK's bitemporal model
 * pins reproducibility to the CONVERGENT `validTime` (business-time) axis, never to real/ingest
 * (wall-clock) order — the non-convergent `txTime` axis is explicitly forbidden at this seam by
 * D-33's own fix. Because `selectFactsForContextualAsOf` filters fact-set MEMBERSHIP by
 * `fact.validFrom <= asOf.validTime` (see that method's own doc comment), the "unrelated intervening
 * activity" this debt worries about must be modeled as a fact asserted with a validFrom AFTER the
 * pinned validTime — exactly the same convention `inv-a2.test.ts`'s own "ROUND 3 FIX (CRITICAL
 * finding #2)" test already establishes for the sibling `compileContextualQuery` seam (a
 * FunctionalityBinding fact asserted at a far-later `validFrom` to simulate "a binding some other
 * party registers afterward"). `executeSegment`'s own microagent-materialization path hardcodes
 * `validFrom: 0` for every fact it authors (docs/31's "valid from the beginning of time" convention
 * for freshly-materialized instances), so the "unrelated later fact" here is authored directly via
 * `repo.assertFact` (mirroring `inv-a8.test.ts`'s own "MINOR addition (round 3)" test, which also
 * hand-authors a `derived_from` edge directly to exercise `readAnswerGraph` without needing a real
 * microagent dispatch) rather than via a second `executeSegment` materialization call, so its
 * `validFrom` can be placed AFTER the pinned `validTime` — the one shape that actually distinguishes
 * pre-fix (`this.currentFacts()`, unconditionally including it) from post-fix
 * (`selectFactsForContextualAsOf(asOf)`, excluding it).
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../index";
import { assertNode } from "./conformance/fixtures-m5";

describe("D-34: readAnswerGraph threads the resolved/pinned asOf into its own fact-set read (INV-A8 reproducibility)", () => {
  it("(a) re-executing the SAME Segment at the SAME pinned asOf.validTime after an unrelated, later-validFrom derived_from fact is asserted against the SAME seed returns a byte-identical AnswerGraph — it does NOT grow to include the unrelated edge", async () => {
    const repo = new KipRepo({ replicaId: "d34-repro" });
    await assertNode(repo, "person/tal", "person");

    // The "early" derived_from edge — present at (and before) the pinned validTime below.
    await repo.assertFact({
      type: "assert",
      v: 1,
      target: {
        kind: "edge",
        eid: "derived_from:person/tal->derived:org-early",
        edgeKind: "derived_from",
        from: "person/tal",
        to: "derived:org-early",
      },
      value: JSON.stringify({ edgeKind: "employed_by", output: {} }),
      validFrom: 0,
      validTo: null,
      replicaId: "d34-repro",
      provenance: { author: "d34-fixture", signature: "sig:early", publicKeyFingerprint: "fpr:early", signedFields: [] },
    });
    await assertNode(repo, "derived:org-early", "org", "d34-repro");

    const pinnedAsOf = { validTime: 500 };

    // A pinned-asOf read via `executeSegment` on a Segment with NO steps — a pure read straight
    // through to `readAnswerGraph(seed, [], resolvedAsOf)` (the `steps.length === 0` early-return
    // path this fix also threads `resolvedAsOf` into), exactly mirroring `inv-a8.test.ts`'s own
    // "MINOR addition (round 3)" test convention for exercising `readAnswerGraph` directly.
    const firstAnswer = await repo.executeSegment({ steps: [], alternatives: [], seed: "person/tal" }, { asOf: pinnedAsOf });
    expect(firstAnswer.intermediates).toContain("derived:org-early");
    expect(firstAnswer.intermediates).not.toContain("derived:org-late");

    // Unrelated, intervening activity against the SAME seed: a THIRD derived_from edge, asserted
    // with a validFrom FAR AFTER the pinned validTime above (2_000_000 > 500) — the bitemporal
    // shape of "asserted afterward" this SDK's own `validTime` reproducibility axis recognizes (see
    // this file's own top doc comment for why a second `executeSegment` materialization call could
    // not construct this — its hardcoded `validFrom: 0` would be indistinguishable from the early
    // edge for this filter).
    await repo.assertFact({
      type: "assert",
      v: 1,
      target: {
        kind: "edge",
        eid: "derived_from:person/tal->derived:org-late",
        edgeKind: "derived_from",
        from: "person/tal",
        to: "derived:org-late",
      },
      value: JSON.stringify({ edgeKind: "headquartered_in", output: {} }),
      validFrom: 2_000_000,
      validTo: null,
      replicaId: "d34-repro",
      provenance: { author: "d34-fixture", signature: "sig:late", publicKeyFingerprint: "fpr:late", signedFields: [] },
    });
    await assertNode(repo, "derived:org-late", "org", "d34-repro");

    // Re-executing the IDENTICAL Segment at the SAME pinned asOf must be byte-identical to the
    // first read — the unrelated later edge must not leak in.
    const secondAnswer = await repo.executeSegment({ steps: [], alternatives: [], seed: "person/tal" }, { asOf: pinnedAsOf });
    expect(secondAnswer).toEqual(firstAnswer);
    expect(secondAnswer.intermediates).not.toContain("derived:org-late");

    // Sanity check that the divergence hazard is real absent this fix: a LIVE read (no asOf) taken
    // AFTER the same intervening activity DOES pick up the unrelated edge — confirming
    // `readAnswerGraph`'s fold genuinely differs between the pinned and live fact sets, so a build
    // that (pre-fix) always folded `this.currentFacts()` regardless of the caller's pinned `asOf`
    // would have returned THIS grown shape for `secondAnswer` too, rather than staying identical to
    // `firstAnswer`.
    const liveAnswer = await repo.executeSegment({ steps: [], alternatives: [], seed: "person/tal" });
    expect(liveAnswer.intermediates).toContain("derived:org-late");
    expect(liveAnswer).not.toEqual(firstAnswer);
  });

  it("(b) the steps.length === 0 early-return path also rejects asOf.txTime — resolvedAsOf is computed (and guarded) BEFORE that early return, not only on the main execution path", async () => {
    const repo = new KipRepo({ replicaId: "d34-emptysteps-txtime" });
    await assertNode(repo, "person/tal", "person");

    await expect(
      repo.executeSegment(
        { steps: [], alternatives: [], seed: "person/tal" },
        { asOf: { txTime: { wall: Date.now(), counter: 0, replicaId: "d34-emptysteps-txtime" } } },
      ),
    ).rejects.toMatchObject({ code: "ERR_ASOF_TXTIME_NOT_SUPPORTED_FOR_COMPILE" });
  });

  it("(c) an unpinned (no asOf) executeSegment call is completely unaffected — readAnswerGraph still folds the full live set by default", async () => {
    const repo = new KipRepo({ replicaId: "d34-live-unaffected" });
    await assertNode(repo, "person/tal", "person");
    await repo.assertFact({
      type: "assert",
      v: 1,
      target: {
        kind: "edge",
        eid: "derived_from:person/tal->derived:org-live",
        edgeKind: "derived_from",
        from: "person/tal",
        to: "derived:org-live",
      },
      value: JSON.stringify({ edgeKind: "employed_by", output: {} }),
      validFrom: 0,
      validTo: null,
      replicaId: "d34-live-unaffected",
      provenance: { author: "d34-fixture", signature: "sig:live", publicKeyFingerprint: "fpr:live", signedFields: [] },
    });
    await assertNode(repo, "derived:org-live", "org", "d34-live-unaffected");

    const answer = await repo.executeSegment({ steps: [], alternatives: [], seed: "person/tal" });
    expect(answer.intermediates).toContain("derived:org-live");
  });
});
