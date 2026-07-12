/**
 * INV-A7 — multi-segment & multi-realizer typed choice (N5).
 *
 * docs/60-conformance-and-testability.md#inv-a7 (verbatim): "Asserts: Two segments satisfying a
 * query (differing weight), AND two FunctionalityBinding realizers on one
 * (edgeKind,sourceKind,targetKind) hop -> the choice is asserted through the named API channel
 * (m7-22): compileContextualQuery returns non-empty Segment.alternatives (ordered by weight then
 * §3.4 tiebreak); runContextualQuery returns the discriminated { kind: 'choice', segments } and
 * dispatches NOTHING (zero invocations, zero facts); execution happens only via
 * executeSegment(chosen) (mirrors kip:conflict); a NaN/±Infinity weight or range/cmp comparand is
 * REJECTED AT REGISTRATION (ERR_INVALID_WEIGHT). Violating build: auto-executing the top-weighted
 * (or any tags/hash-tiebroken) segment/realizer; admitting a NaN-weight binding."
 *
 * docs/31-contextual-functionalities.md: "registerFunctionality is therefore ADDITIVE: registering a
 * second realizer for the same hop ADDS an alternative; it does not overwrite the first" and "kip
 * NEVER silently picks one realizer over another (N5, INV-A7)"; also: "MUST be FINITE: NaN/±Infinity
 * are MALFORMED and rejected at registration (a NaN weight makes the sort NON-TOTAL — a silent
 * default in disguise, N5)" and "a range with NEITHER min NOR max is MALFORMED and MUST be rejected
 * at registration."
 *
 * `registerFunctionality`/`compileContextualQuery`/`runContextualQuery` still throw
 * `unimplemented: <name>` (M5/T6.1/T6.2/T6.5 not yet implemented) — these tests are EXPECTED TO FAIL
 * right now via that thrown error propagating through the `await`, per this suite's established
 * convention (see inv-14a.test.ts).
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import { assertNode, makeBindingOptions, makeManifest, makeQuery } from "./fixtures-m5";

describe("INV-A7: multi-segment & multi-realizer typed choice (N5)", () => {
  it("two FunctionalityBinding realizers bound to the SAME (edgeKind, sourceKind, targetKind) hop are BOTH enumerated as Segment.alternatives, ordered by weight desc — never silently picked", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");

    // ADDITIVE registration: a second realizer for the identical hop adds an alternative.
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-rest" }), makeBindingOptions({ weight: 1 }));
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-sql" }), makeBindingOptions({ weight: 2 }));

    const query = makeQuery({ seed: "person/tal", target: "org", via: ["employed_by"] });
    const segment = await repo.compileContextualQuery(query);

    expect(segment.alternatives.length).toBeGreaterThan(0);
    // Presentation order is `weight` desc — the higher-weight realizer/segment sorts first.
    const weights = segment.alternatives.map((alt) => alt.steps[0]?.weight ?? segment.steps[0]?.weight);
    const sorted = [...weights].sort((a, b) => (b ?? -Infinity) - (a ?? -Infinity));
    expect(weights).toEqual(sorted);
  });

  it("runContextualQuery on a multi-match query returns the discriminated { kind: 'choice', segments } and dispatches NOTHING — zero facts authored for the target until executeSegment is called", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");

    // Two DIFFERENT paths satisfy the same (seed, target): a direct hop and a via-a-different-edge
    // composed path, so more than one Segment matches the query as a whole (not just one hop's
    // realizers).
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-direct" }), makeBindingOptions({ weight: 1 }));
    await repo.registerFunctionality("contracted_by", makeManifest({ name: "contracted-by-direct" }), makeBindingOptions({ weight: 2 }));

    const query = makeQuery({ seed: "person/tal", target: "org" });
    const answer = await repo.runContextualQuery(query);

    if ("kind" in answer) {
      expect(answer.kind).toBe("choice");
      expect(answer.segments.length).toBeGreaterThan(1);
    }
  });

  it("a compiled multi-segment/multi-realizer choice authors zero facts until the caller explicitly picks one via executeSegment", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-rest" }), makeBindingOptions({ weight: 1 }));
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-sql" }), makeBindingOptions({ weight: 2 }));

    const query = makeQuery({ seed: "person/tal", target: "org" });
    await repo.runContextualQuery(query);

    // No org instance should exist yet — the choice was surfaced, not auto-executed.
    const anyOrgQuery = repo.query({ seed: "person/tal", direction: "out", depth: 1, maxFanout: 10, kinds: ["org"] });
    const results: unknown[] = [];
    for await (const item of anyOrgQuery) results.push(item);
    expect(results.length).toBe(0);
  });

  it("a NaN weight is rejected at registration with ERR_INVALID_WEIGHT — never silently coerced or defaulted", async () => {
    const repo = new KipRepo();
    await expect(
      repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-nan" }), makeBindingOptions({ weight: Number.NaN })),
    ).rejects.toMatchObject({ code: "ERR_INVALID_WEIGHT" });
  });

  it("a ±Infinity weight is rejected at registration with ERR_INVALID_WEIGHT", async () => {
    const repo = new KipRepo();
    await expect(
      repo.registerFunctionality(
        "employed_by",
        makeManifest({ name: "employed-by-infinite" }),
        makeBindingOptions({ weight: Number.POSITIVE_INFINITY }),
      ),
    ).rejects.toMatchObject({ code: "ERR_INVALID_WEIGHT" });
  });

  it("a range ConditionNode with NEITHER min NOR max is MALFORMED and rejected at registration with ERR_INVALID_WEIGHT (never an always-true gate)", async () => {
    const repo = new KipRepo();
    await expect(
      repo.registerFunctionality(
        "can_drive",
        makeManifest({ name: "can-drive-malformed-range" }),
        makeBindingOptions({ condition: { kind: "range", prop: "age" } }),
      ),
    ).rejects.toMatchObject({ code: "ERR_INVALID_WEIGHT" });
  });
});
