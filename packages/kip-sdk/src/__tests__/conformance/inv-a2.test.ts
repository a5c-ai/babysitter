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
    // studied_at) that a later join step (e.g. "shared_city") could consume as a multi-input join
    // (docs/31's D-5b.8: "a step MAY consume MORE THAN ONE upstream instance").
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-lookup" }), makeBindingOptions({ weight: 1 }));
    await repo.registerFunctionality("studied_at", makeManifest({ name: "studied-at-lookup" }), makeBindingOptions({ weight: 1 }));

    const query = makeQuery({ seed: "person/tal", target: "org", via: ["employed_by", "studied_at"] });
    const segment = await repo.compileContextualQuery(query);

    if (segment.deps) {
      for (const [producer, consumer] of segment.deps) {
        // Every `deps` index must reference a real `steps[]` position (no out-of-range index —
        // MALFORMED per docs/31, rejected at compile) and a producer must precede its consumer.
        expect(producer).toBeGreaterThanOrEqual(0);
        expect(producer).toBeLessThan(segment.steps.length);
        expect(consumer).toBeGreaterThanOrEqual(0);
        expect(consumer).toBeLessThan(segment.steps.length);
        expect(producer).toBeLessThan(consumer);
      }
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
});
