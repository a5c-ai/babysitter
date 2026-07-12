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
import { materializedEidFor } from "../../contextual";
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
    } else {
      // Two DISTINCT edgeKinds are registered here ("employed_by", "contracted_by"), each with
      // exactly one realizer — compileContextualQuery's composition-discovery branch (no `via`) must
      // surface both as candidates, so a single executed AnswerGraph here would be a genuine
      // regression (round-2 else-fail strengthening).
      expect.fail(`expected a multi-segment { kind: "choice" }, got a single executed AnswerGraph: ${JSON.stringify(answer)}`);
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

  it("MAJOR FIX (round 2, finding #2): a MULTI-HOP query whose SECOND position has TWO registered realizers enumerates the full cross-product as alternatives — never silently narrowed to only the top-weighted realizer at that position", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");
    // Position 0 ("employed_by") has exactly one realizer; position 1 ("headquartered_in") has TWO —
    // round 1 discarded every realizer at a non-first multi-hop position except `[0]` (the
    // top-weighted one), the exact silent-pick N5 violation this fix closes.
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-lookup" }), makeBindingOptions({ weight: 1 }));
    await repo.registerFunctionality("headquartered_in", makeManifest({ name: "hq-rest" }), makeBindingOptions({ weight: 1 }));
    await repo.registerFunctionality("headquartered_in", makeManifest({ name: "hq-sql" }), makeBindingOptions({ weight: 2 }));

    const query = makeQuery({ seed: "person/tal", target: "city", via: ["employed_by", "headquartered_in"] });
    const segment = await repo.compileContextualQuery(query);

    // Two realizers at one position (with one realizer at the other) ⇒ 1 × 2 = 2 total candidate
    // chains ⇒ the primary segment plus exactly ONE alternative — never a single, silently-narrowed
    // chain with an empty `alternatives`.
    expect(segment.alternatives.length).toBe(1);
    const primaryRealizer = segment.steps[1]?.microagentName;
    const alternativeRealizer = segment.alternatives[0]?.steps[1]?.microagentName;
    expect(new Set([primaryRealizer, alternativeRealizer])).toEqual(new Set(["hq-rest", "hq-sql"]));
    // Presentation order: the higher-weighted realizer at the ambiguous position sorts into the
    // primary segment.
    expect(primaryRealizer).toBe("hq-sql");
  });

  it("ROUND 3 FIX (CRITICAL finding #3): executing BOTH realizers bound to the same hop (the primary segment, then its alternative) materializes TWO DISTINCT EIDs — never a silent collision on one materialized identity", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");

    // Two DIFFERENT realizers on the SAME (edgeKind, sourceKind, targetKind) hop — the exact INV-A7
    // typed-choice scenario: the caller may execute the primary segment, then later execute an
    // alternative from `Segment.alternatives`.
    await repo.registerFunctionality(
      "employed_by",
      makeManifest({ name: "employed-by-rest", outputSchema: { type: "object" } }),
      makeBindingOptions({ weight: 2 }),
    );
    await repo.registerFunctionality(
      "employed_by",
      makeManifest({ name: "employed-by-sql", outputSchema: { type: "object" } }),
      makeBindingOptions({ weight: 1 }),
    );

    const query = makeQuery({ seed: "person/tal", target: "org", via: ["employed_by"] });
    const compiled = await repo.compileContextualQuery(query);
    expect(compiled.alternatives.length).toBe(1);

    const primaryAnswer = await repo.executeSegment(compiled);
    const alternativeAnswer = await repo.executeSegment(compiled.alternatives[0]);

    expect(primaryAnswer.result.length).toBe(1);
    expect(alternativeAnswer.result.length).toBe(1);
    // ROUND 2's bug: both realizers derived the SAME `derived:${edgeKind}/${producer}` EID, so the
    // second execution's differing output either silently collided (read-side "pick the
    // orderKey-max winner") or minted a second, indistinguishable fact under the identical identity —
    // never surfaced as a genuine second, addressable instance. The fix: distinguishing by realizer
    // identity means the two results are NEVER the same EID.
    expect(alternativeAnswer.result[0]).not.toBe(primaryAnswer.result[0]);

    // Both materialized instances remain independently reachable/addressable — neither was silently
    // dropped nor conflict-collapsed away.
    const primaryProvenance = await repo.provenanceOf(primaryAnswer.result[0]);
    const alternativeProvenance = await repo.provenanceOf(alternativeAnswer.result[0]);
    expect(primaryProvenance.length).toBeGreaterThan(0);
    expect(alternativeProvenance.length).toBeGreaterThan(0);
  });

  it("ROUND 4 FIX (CRITICAL finding, the SAME bug class round 2/round 3 each patched at only one corner): materializedEidFor percent-encodes edgeKind/producer, so a `/` inside either can never make two DIFFERENT (edgeKind, producer) pairs collide onto the SAME materialized EID", () => {
    // The exact concrete collision the orchestrator's own repro named: BEFORE this round's fix,
    // `derived:${edgeKind}/${producer}/${realizerId}` raw-concatenated `edgeKind="owns/dept",
    // producer="acme"` and `edgeKind="owns", producer="dept/acme"` to the BYTE-IDENTICAL string
    // `derived:owns/dept/acme/<realizerId>` — two semantically different (edgeKind, producer) pairs,
    // one identity. Every joined segment is now percent-encoded, so the two must differ.
    const eidA = materializedEidFor("owns/dept", "acme", "realizer", "1.0.0");
    const eidB = materializedEidFor("owns", "dept/acme", "realizer", "1.0.0");
    expect(eidA).not.toBe(eidB);
    // Both must still decode to distinct EIDs regardless of which pair is checked first (commutative,
    // not merely "not literally equal by accident of string length").
    expect(new Set([eidA, eidB]).size).toBe(2);
  });

  it("ROUND 4 FIX (CRITICAL finding, exercised via the REAL executeSegment path, not just the isolated materializedEidFor helper): two independently-executed segments whose (edgeKind, producer) pairs raw-concatenate to the SAME string under the OLD (buggy) construction now materialize genuinely DISTINCT, independently-addressable EIDs", async () => {
    const repo = new KipRepo();

    // Two arbitrary seed EIDs (EID is just `string`, docs/21 §3.6 — no format is enforced), chosen so
    // that `edgeKind="owns/dept", producer="acme"` (segment A) and `edgeKind="owns",
    // producer="dept/acme"` (segment B) raw-concatenate to the IDENTICAL `owns/dept/acme` under the
    // pre-round-4 construction.
    await assertNode(repo, "acme", "org");
    await assertNode(repo, "dept/acme", "org");

    await repo.registerFunctionality("owns/dept", makeManifest({ name: "realizer", version: "1.0.0" }), makeBindingOptions({}));
    await repo.registerFunctionality("owns", makeManifest({ name: "realizer", version: "1.0.0" }), makeBindingOptions({}));

    const queryA = makeQuery({ seed: "acme", target: "dept", via: ["owns/dept"] });
    const segmentA = await repo.compileContextualQuery(queryA);
    const answerA = await repo.executeSegment(segmentA);

    const queryB = makeQuery({ seed: "dept/acme", target: "dept", via: ["owns"] });
    const segmentB = await repo.compileContextualQuery(queryB);
    const answerB = await repo.executeSegment(segmentB);

    expect(answerA.result.length).toBe(1);
    expect(answerB.result.length).toBe(1);
    // The genuine assertion: two semantically DIFFERENT (edgeKind, producer) pairs must NEVER
    // materialize onto the same EID — the pre-round-4 build would have made these IDENTICAL.
    expect(answerA.result[0]).not.toBe(answerB.result[0]);

    // Both materialized instances remain independently reachable — neither silently overwrote nor
    // conflict-collapsed the other (mirrors the realizer-collision test above's own reachability check).
    const provenanceA = await repo.provenanceOf(answerA.result[0]);
    const provenanceB = await repo.provenanceOf(answerB.result[0]);
    expect(provenanceA.length).toBeGreaterThan(0);
    expect(provenanceB.length).toBeGreaterThan(0);
  });
});
