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
 * cell). `registerFunctionality`/`compileContextualQuery`/`executeSegment` still throw
 * `unimplemented: <name>` (M5/T6.2-T6.7 not yet implemented) — these tests are EXPECTED TO FAIL
 * right now via that thrown error propagating through the `await`, per this suite's established
 * convention (see inv-14a.test.ts).
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import { assertNode, makeBindingOptions, makeManifest, makeQuery } from "./fixtures-m5";

describe("INV-A6: hop idempotence", () => {
  it("re-running an identical, caller-chosen Segment on identical input is a factCID-dedup no-op — the second executeSegment call mints no new facts and resolves to the SAME result/intermediate EIDs", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-lookup" }), makeBindingOptions({}));

    const query = makeQuery({ seed: "person/tal", target: "org", via: ["employed_by"] });
    const compiled = await repo.compileContextualQuery(query);

    const first = await repo.executeSegment(compiled);
    const second = await repo.executeSegment(compiled);

    // Byte-identical AnswerGraph on the second, redundant run — no new EID, no new derivedFrom
    // growth for the identical hop.
    expect(second.result).toEqual(first.result);
    expect(second.intermediates).toEqual(first.intermediates);
    expect(second.derivedFrom.length).toBe(first.derivedFrom.length);
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
    }
  });
});
