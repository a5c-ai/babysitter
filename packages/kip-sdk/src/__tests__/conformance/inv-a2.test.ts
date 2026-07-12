/**
 * INV-A2 — compile-determinism + DAG order.
 *
 * docs/60-conformance-and-testability.md#inv-a2 (verbatim): "Asserts: Two replicas compiling the
 * same ContextualQuery at the same asOf produce byte-identical Segment sets (steps + deps + ordered
 * alternatives), under perturbed sync state / key-log order / wall clock; a branching deps DAG
 * yields a byte-identical TOPOLOGICAL order (ties: ascending steps[] index then §3.4 tiebreak); a
 * cyclic or out-of-range deps is rejected at compile. Violating build: compile reading replica-local
 * sync state or a wall clock; replica-dependent topo order; admitting a cyclic deps."
 *
 * docs/31-contextual-functionalities.md's "Phase 1 — Compile + match" section: "Two replicas at the
 * same asOf MUST compile the byte-identical segment set (INV-A2)"; and "Composition — the patent's
 * combine-relations technique": "for every adjacent pair, steps[i].targetKind MUST equal (or be an
 * is_a supertype-compatible match of) steps[i+1].sourceKind; a Segment violating this is ill-typed
 * and MUST NOT be compiled or surfaced" (ERR_ILL_TYPED_SEGMENT, docs/40's Errors table).
 *
 * Test methodology — "two replicas" is realized as two independent `KipRepo` instances that
 * register the SAME set of `FunctionalityBinding`s via the real `registerFunctionality` seam, in
 * OPPOSITE call order (the closest honest proxy for "perturbed... key-log order" reachable through
 * the public surface alone, without hand-forging the internal registration-fact bytes
 * `registerFunctionality` itself is responsible for minting — see fixtures-m5.ts's own doc comment).
 * `compileContextualQuery`/`registerFunctionality` still throw `unimplemented: <name>` (M5/T6.1-T6.2
 * not yet implemented) — these tests are EXPECTED TO FAIL right now via that thrown error
 * propagating through the `await`, per this suite's established convention (see inv-14a.test.ts).
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import { ontologyRefForBinding, serializeBindingPayload } from "../../contextual";
import { assertNode, makeBindingOptions, makeManifest, makeQuery } from "./fixtures-m5";

describe("INV-A2: compile-determinism + DAG order", () => {
  it("two replicas registering the same alternative bindings in OPPOSITE order compile the same ContextualQuery to a byte-identical Segment (steps + deps + ordered alternatives)", async () => {
    const repoA = new KipRepo();
    const repoB = new KipRepo();
    await assertNode(repoA, "person/tal", "person");
    await assertNode(repoB, "person/tal", "person");

    const manifestLow = makeManifest({ name: "employed-by-rest", version: "1.0.0" });
    const manifestHigh = makeManifest({ name: "employed-by-sql", version: "1.0.0" });

    // repoA: register the low-weight realizer first, then the high-weight one.
    await repoA.registerFunctionality("employed_by", manifestLow, makeBindingOptions({ weight: 1 }));
    await repoA.registerFunctionality("employed_by", manifestHigh, makeBindingOptions({ weight: 2 }));
    // repoB: the identical two realizers, registered in the OPPOSITE order.
    await repoB.registerFunctionality("employed_by", manifestHigh, makeBindingOptions({ weight: 2 }));
    await repoB.registerFunctionality("employed_by", manifestLow, makeBindingOptions({ weight: 1 }));

    const query = makeQuery({ seed: "person/tal", target: "org" });
    const segmentA = await repoA.compileContextualQuery(query);
    const segmentB = await repoB.compileContextualQuery(query);

    // Byte-identical regardless of registration-call order — presentation order is `weight` desc
    // (then the §3.4 tiebreak), never registration order.
    expect(segmentA).toEqual(segmentB);
  });

  it("compiling the identical ContextualQuery twice on the same replica is deterministic (repeat-call stability, the single-replica half of byte-identity)", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");
    const manifest = makeManifest({ name: "employed-by-lookup", version: "1.0.0" });
    await repo.registerFunctionality("employed_by", manifest, makeBindingOptions({ weight: 1 }));

    const query = makeQuery({ seed: "person/tal", target: "org" });
    const first = await repo.compileContextualQuery(query);
    const second = await repo.compileContextualQuery(query);
    expect(first).toEqual(second);
  });

  it("a branching deps DAG (two producers feeding one consumer) yields a deterministic topological order over Segment.deps, never a cycle", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");

    // Two independent hops off the seed (person -> org via employed_by; person -> school via
    // studied_at), with `studied_at` declaring a CLAIM-12 `requires` on `employed_by` (the patent's
    // "a step MAY consume MORE THAN ONE upstream instance" multi-input join, docs/31 D-5b.8) — a
    // ROUND-2 STRENGTHENING (finding: "vacuous `if (segment.deps)` guard"): round 1 registered NO
    // `requires` at all, so `segment.deps` was always empty/absent and the `if` below never actually
    // ran its body against a real dependency edge. Registering a genuine `requires` link makes `deps`
    // NON-EMPTY for real, so the assertions below are no longer vacuous.
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-lookup" }), makeBindingOptions({ weight: 1 }));
    await repo.registerFunctionality(
      "studied_at",
      makeManifest({ name: "studied-at-lookup" }),
      makeBindingOptions({ weight: 1, requires: ["employed_by"] }),
    );

    const query = makeQuery({ seed: "person/tal", target: "org", via: ["employed_by", "studied_at"] });
    const segment = await repo.compileContextualQuery(query);

    // The `requires` link above MUST have produced a genuinely non-empty `deps` — a build that
    // silently drops it (or never wires `requires` into `deps` at all) would fail here instead of
    // vacuously skipping the loop below.
    expect(segment.deps).toBeDefined();
    expect((segment.deps ?? []).length).toBeGreaterThan(0);
    for (const [producer, consumer] of segment.deps ?? []) {
      // Every `deps` index must reference a real `steps[]` position (no out-of-range index —
      // MALFORMED per docs/31, rejected at compile) and a producer must precede its consumer.
      expect(producer).toBeGreaterThanOrEqual(0);
      expect(producer).toBeLessThan(segment.steps.length);
      expect(consumer).toBeGreaterThanOrEqual(0);
      expect(consumer).toBeLessThan(segment.steps.length);
      expect(producer).toBeLessThan(consumer);
    }
  });

  it("a cyclic FunctionalityBinding.requires dependency is rejected at compile with ERR_COMPILE_CYCLIC_DEPS (malformed deps MUST NOT be compiled or surfaced)", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");

    // Binding A `requires` edge B's presence, and binding B `requires` edge A's presence — a
    // circular CLAIM-12 dependency that cannot resolve to any topological order.
    await repo.registerFunctionality(
      "edge_a",
      makeManifest({ name: "edge-a-agent" }),
      makeBindingOptions({ requires: ["edge_b"] }),
    );
    await repo.registerFunctionality(
      "edge_b",
      makeManifest({ name: "edge-b-agent" }),
      makeBindingOptions({ requires: ["edge_a"] }),
    );

    const query = makeQuery({ seed: "person/tal", target: "org", via: ["edge_a", "edge_b"] });
    await expect(repo.compileContextualQuery(query)).rejects.toMatchObject({ code: "ERR_COMPILE_CYCLIC_DEPS" });
  });

  it("an ill-typed chain (steps[i].targetKind incompatible with steps[i+1].sourceKind) is rejected at compile with ERR_ILL_TYPED_SEGMENT", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");

    // person -[employed_by]-> org, then a SECOND hop declared FROM "vehicle" (never "org") ->
    // person — the two hops cannot chain type-compatibly (org != vehicle, no is_a relation declared).
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-lookup" }), makeBindingOptions({}));
    await repo.registerFunctionality("owned_by", makeManifest({ name: "owned-by-lookup" }), makeBindingOptions({}));

    const query = makeQuery({ seed: "person/tal", target: "person", via: ["employed_by", "owned_by"] });
    await expect(repo.compileContextualQuery(query)).rejects.toMatchObject({ code: "ERR_ILL_TYPED_SEGMENT" });
  });

  it("ROUND 3 FIX (CRITICAL finding #1): a multi-hop via position with ZERO registered bindings contributes ZERO candidate chains — never a fabricated FunctionalityBinding for the unregistered position", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");

    // Only "employed_by" is registered; "totally_unregistered_edge" (the second `via` position) has
    // NO FunctionalityBinding at all — the exact live repro the round-3 critics reported: round 2's
    // multi-hop branch mapped the unregistered position to `[undefined]` and `buildChain` synthesized
    // a FAKE binding (`microagentName: "totally_unregistered_edge", version: "0.0.0"`), so
    // `compileContextualQuery` returned a materializable segment for a functionality NO ONE
    // registered.
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-lookup" }), makeBindingOptions({}));

    const query = makeQuery({
      seed: "person/tal",
      target: "org",
      via: ["employed_by", "totally_unregistered_edge"],
    });
    const segment = await repo.compileContextualQuery(query);

    // The fix: NO combination can be built touching the unregistered position, so the whole compile
    // collapses to the empty segment (mirroring the 0-hop/1-hop branches' own `emptySegment()`
    // behavior) — never a step naming the unregistered edgeKind as a fabricated microagentName.
    expect(segment.steps).toEqual([]);
    expect(segment.alternatives).toEqual([]);
    for (const alt of [segment, ...segment.alternatives]) {
      for (const step of alt.steps) {
        expect(step.microagentName).not.toBe("totally_unregistered_edge");
      }
    }

    // The live repro's own assertion: executing this (empty) segment must never materialize a real
    // "org" result for the unregistered hop.
    const answer = await repo.executeSegment(segment);
    expect(answer.result).toEqual([]);
    expect(answer.intermediates).toEqual([]);
  });

  it("ROUND 3 FIX (CRITICAL finding #2): compileContextualQuery pinned to an EARLY asOf.validTime does not see a FunctionalityBinding registered at a LATER validFrom — the same pinned validTime is byte-identical regardless of what gets asserted afterward", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");

    // An "early" realizer, asserted at validFrom=0 (registerFunctionality's own convention).
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-early" }), makeBindingOptions({}));

    // A SECOND realizer for the SAME hop, hand-asserted directly (registerFunctionality itself has no
    // caller-supplied validFrom seam) at a FAR LATER validFrom — simulating "a binding some other
    // caller registers after the frontier this query wants pinned to."
    const futureProvenance = { author: "m5-fixture", signature: "sig:future", publicKeyFingerprint: "future-fpr", signedFields: [] };
    await repo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "schema", ontologyRef: ontologyRefForBinding("employed_by", "employed-by-future", "1.0.0") },
      value: serializeBindingPayload({ edgeKind: "employed_by", microagentName: "employed-by-future", version: "1.0.0" }),
      validFrom: 1_000_000,
      validTo: null,
      replicaId: "m5-fixture-replica",
      provenance: futureProvenance,
    });

    // Pinned BEFORE the later realizer's own validFrom: only the early realizer is visible, and this
    // is STABLE — a build that (per round 2) ignored `validTime` entirely for fact-set membership
    // would see BOTH realizers regardless of which validTime was requested.
    const earlyQuery = makeQuery({ seed: "person/tal", target: "org", via: ["employed_by"], asOf: { validTime: 500 } });
    const earlySegment = await repo.compileContextualQuery(earlyQuery);
    const earlyRealizers = [earlySegment, ...earlySegment.alternatives].map((s) => s.steps[0]?.microagentName);
    expect(earlyRealizers).toEqual(["employed-by-early"]);

    // Pinned AFTER the later realizer's own validFrom: both are now visible.
    const lateQuery = makeQuery({ seed: "person/tal", target: "org", via: ["employed_by"], asOf: { validTime: 2_000_000 } });
    const lateSegment = await repo.compileContextualQuery(lateQuery);
    const lateRealizers = new Set([lateSegment, ...lateSegment.alternatives].map((s) => s.steps[0]?.microagentName));
    expect(lateRealizers).toEqual(new Set(["employed-by-early", "employed-by-future"]));

    // Reproducibility: re-compiling the SAME early pin again (as if more time had passed / more facts
    // had been asserted in the interim) is still byte-identical — never drifting toward the enlarged
    // live set.
    const earlySegmentAgain = await repo.compileContextualQuery(earlyQuery);
    expect(earlySegmentAgain).toEqual(earlySegment);
  });
});
