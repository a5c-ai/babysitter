/**
 * INV-A6 — hop idempotence.
 *
 * docs/60-conformance-and-testability.md#inv-a6 (verbatim): "Asserts: Re-run an identical hop on
 * identical input -> second run is a factCID-dedup no-op (INV-7 linkage); identical instance
 * resolves to the same namespaced EID (node-merge). Violating build: re-minting distinct facts or a
 * second EID for the identical hop."
 *
 * docs/31-contextual-functionalities.md's "Intermediates and dedup are free" section (verbatim):
 * "Every hop's output is persisted as ordinary signed facts, so intermediates are reusable:
 * re-running the same hop on the same input is an idempotent no-op (byte-identical facts share a
 * factCID and merge by set-union, INV-7, INV-A6). Identical instances resolve to the same namespaced
 * EID (identity anchored by IdentityPolicy, §3.6)."
 *
 * Test methodology — `executeSegment` is called TWICE against the identical caller-chosen `Segment`
 * (same seed, same steps) on the same repo; INV-A6 asserts the second call is a no-op (identical
 * `AnswerGraph.result`/`.intermediates` EIDs, no additional `derivedFrom` entries minted for the same
 * cell).
 *
 * ROUND 2 FIX (CRITICAL finding #3): round 1's `mintFact` always stamped a fresh `hlc`/`seq` (hence a
 * fresh `factCID`) on every `executeSegment` call, so re-executing an IDENTICAL compiled `Segment`
 * against the SAME admitted set minted brand-new facts every time (a live repro showed the fact count
 * growing 3→5→7 across two "identical" executions) — only the read-side "pick the orderKey-max
 * winner" masked it, so the PROJECTED read looked unchanged while the underlying STORE kept growing.
 * The first test below now additionally asserts the underlying fact-STORE size directly (via
 * `provenanceOf`, which enumerates every admitted fact touching an address) is unchanged on the
 * second run — not merely that the projected read is unchanged.
 *
 * ROUND 3 FIX (CRITICAL finding #3): the materialized EID now also encodes WHICH realizer produced it
 * (`step.microagentName`/`.version`, index.ts's `executeSegment`) so two DIFFERENT realizers bound to
 * the same hop never collide onto one EID (INV-A7's typed-choice guarantee) — the hardcoded
 * `materializedEid` literal below is updated to match that format; the invariant under test
 * (re-running the IDENTICAL Segment/realizer mints no new facts) is unchanged.
 *
 * ROUND 4 FIX (finding #5's own pattern, applied here too): round 3's hardcoded literal
 * (`"derived:employed_by/person/tal/employed-by-lookup@1.0.0"`) went stale AGAIN the moment round 4
 * closed the edgeKind/producer separator-collision bug (every joined segment is now percent-encoded,
 * see contextual.ts's `materializedEidFor` doc comment) — `producer` here is the seed EID
 * `"person/tal"`, whose own `/` is now escaped to `%2F`. Rather than hand-updating another literal
 * that will go stale again on the NEXT identity-construction change, this now computes the expected
 * EIDs via the SAME `materializedEidFor`/`derivedFromEdgeEidFor` helpers `executeSegment` itself
 * calls — the assertion tracks the real construction rule instead of a frozen snapshot of it.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import { derivedFromEdgeEidFor, materializedEidFor } from "../../contextual";
import { assertNode, makeBindingOptions, makeManifest, makeQuery } from "./fixtures-m5";

describe("INV-A6: hop idempotence", () => {
  it("re-running an identical, caller-chosen Segment on identical input is a factCID-dedup no-op — the second executeSegment call mints NO new facts (verified against the underlying fact STORE, not just the projected read) and resolves to the SAME result/intermediate EIDs", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-lookup" }), makeBindingOptions({}));

    const query = makeQuery({ seed: "person/tal", target: "org", via: ["employed_by"] });
    const compiled = await repo.compileContextualQuery(query);

    const first = await repo.executeSegment(compiled);
    // Snapshot the REAL fact-store size for both the materialized node and the derived_from edge
    // BEFORE the second, redundant run — `provenanceOf` enumerates every currently-admitted fact
    // whose target addresses this EID, so its length IS the underlying store's fact count for this
    // cell (not merely a projected/reduced view of it).
    const materializedEid = materializedEidFor("employed_by", "person/tal", "employed-by-lookup", "1.0.0");
    const derivedFromEid = derivedFromEdgeEidFor("person/tal", materializedEid);
    const nodeFactCountBefore = (await repo.provenanceOf(materializedEid)).length;
    const edgeFactCountBefore = (await repo.provenanceOf(derivedFromEid)).length;
    expect(nodeFactCountBefore).toBeGreaterThan(0);
    expect(edgeFactCountBefore).toBeGreaterThan(0);

    const second = await repo.executeSegment(compiled);

    // Byte-identical AnswerGraph on the second, redundant run — no new EID, no new derivedFrom
    // growth for the identical hop.
    expect(second.result).toEqual(first.result);
    expect(second.intermediates).toEqual(first.intermediates);
    expect(second.derivedFrom.length).toBe(first.derivedFrom.length);

    // CRITICAL FIX #3's own empirical proof: the underlying fact STORE, not just the projected read,
    // is unchanged — a build that re-mints a distinct factCID on every run would grow these counts.
    const nodeFactCountAfter = (await repo.provenanceOf(materializedEid)).length;
    const edgeFactCountAfter = (await repo.provenanceOf(derivedFromEid)).length;
    expect(nodeFactCountAfter).toBe(nodeFactCountBefore);
    expect(edgeFactCountAfter).toBe(edgeFactCountBefore);
  });

  it("an identical hop dispatched via runContextualQuery twice resolves the SAME materialized instance to the SAME namespaced EID (node-merge) — never a second EID for the identical instance", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-lookup" }), makeBindingOptions({}));

    const query = makeQuery({ seed: "person/tal", target: "org", via: ["employed_by"] });

    const firstAnswer = await repo.runContextualQuery(query);
    const secondAnswer = await repo.runContextualQuery(query);

    if ("result" in firstAnswer && "result" in secondAnswer) {
      expect(secondAnswer.result.sort()).toEqual(firstAnswer.result.sort());
      expect(secondAnswer.result.length).toBe(firstAnswer.result.length);
    } else {
      // Only ONE realizer is registered for "employed_by" — compileContextualQuery can never surface
      // a multi-segment choice here (round-2 else-fail strengthening).
      expect.fail(
        `expected both runs to return a single executed AnswerGraph, got: ${JSON.stringify(firstAnswer)} / ${JSON.stringify(secondAnswer)}`,
      );
    }
  });
});
