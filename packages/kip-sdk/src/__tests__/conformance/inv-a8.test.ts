/**
 * INV-A8 — answer-graph = derived_from projection.
 *
 * docs/60-conformance-and-testability.md#inv-a8 (verbatim): "Asserts: Multi-hop query -> returned
 * AnswerGraph is byte-identical to proj's projection of the derived_from subgraph at the recorded
 * asOf; every result/intermediate EID is reachable from seed along derived_from. Violating build: an
 * AnswerGraph node with no derived_from path back to seed; authoring the graph as a separate
 * artifact instead of reading it back from facts."
 *
 * docs/31-contextual-functionalities.md's `AnswerGraph` doc comment (verbatim): "requested +
 * intermediate instances and the relation edges that produced them, expressed PURELY as
 * derived_from provenance over the emitted facts... A READ view (recall over the derived facts),
 * never a separately-authored authoritative artifact"; and the "N5-safe step outcomes" section:
 * "upstream-stop... leaves intermediates committed through step i-1 as ordinary facts while
 * runContextualQuery returns an AnswerGraph with result = [] (no terminal answer fabricated, N5)."
 *
 * `registerFunctionality`/`compileContextualQuery`/`executeSegment`/`runContextualQuery` still throw
 * `unimplemented: <name>` (M5/T6.2-T6.6 not yet implemented) — these tests are EXPECTED TO FAIL
 * right now via that thrown error propagating through the `await`, per this suite's established
 * convention (see inv-14a.test.ts).
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import { assertNode, makeBindingOptions, makeManifest, makeQuery } from "./fixtures-m5";

describe("INV-A8: answer-graph = derived_from projection", () => {
  it("every result/intermediate EID in a two-hop AnswerGraph is reachable from seed by walking .edges (the derived_from chain)", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-lookup" }), makeBindingOptions({}));
    await repo.registerFunctionality("headquartered_in", makeManifest({ name: "headquartered-in-lookup" }), makeBindingOptions({}));

    const query = makeQuery({ seed: "person/tal", target: "city", via: ["employed_by", "headquartered_in"] });
    const answer = await repo.runContextualQuery(query);

    if ("result" in answer) {
      const reachable = new Set<string>(["person/tal"]);
      // Fixed-point closure over `.edges` (from -> to), since edges may not arrive in from-first
      // order for a general DAG.
      let grew = true;
      while (grew) {
        grew = false;
        for (const edge of answer.edges) {
          if (reachable.has(edge.from) && !reachable.has(edge.to)) {
            reachable.add(edge.to);
            grew = true;
          }
        }
      }
      for (const eid of [...answer.result, ...answer.intermediates]) {
        expect(reachable.has(eid)).toBe(true);
      }
    } else {
      expect.fail(`expected a single executed AnswerGraph (one realizer per position), got a choice: ${JSON.stringify(answer)}`);
    }
  });

  it("every AnswerGraph node/edge is backed by a derivedFrom entry naming a real signed factId — the graph is a READ over facts, never a separately-authored artifact", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-lookup" }), makeBindingOptions({}));

    const query = makeQuery({ seed: "person/tal", target: "org", via: ["employed_by"] });
    const answer = await repo.runContextualQuery(query);

    if ("result" in answer) {
      for (const eid of [...answer.result, ...answer.intermediates]) {
        const entry = answer.derivedFrom.find((d) => d.eid === eid);
        expect(entry).toBeDefined();
        expect(entry?.factId).toBeTruthy();
        expect(entry?.producedBy).toBeDefined();
      }
    } else {
      expect.fail(`expected a single executed AnswerGraph (one realizer registered), got a choice: ${JSON.stringify(answer)}`);
    }
  });

  it("upstream-stop (a mid-segment step failure) leaves an AnswerGraph with result = [] while pre-failure intermediates remain committed as ordinary facts — no terminal answer fabricated (N5)", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-lookup" }), makeBindingOptions({}));
    // The second hop's guard can never be satisfied (requires a never-asserted edge instance),
    // forcing upstream-stop on step 2 of a 2-step segment.
    await repo.registerFunctionality(
      "headquartered_in",
      makeManifest({ name: "headquartered-in-lookup" }),
      makeBindingOptions({ requires: ["never_asserted_edge"] }),
    );

    const query = makeQuery({ seed: "person/tal", target: "city", via: ["employed_by", "headquartered_in"] });
    const answer = await repo.runContextualQuery(query);

    if ("result" in answer) {
      expect(answer.result).toEqual([]);
    } else {
      expect.fail(`expected a single executed AnswerGraph (one realizer per position), got a choice: ${JSON.stringify(answer)}`);
    }
  });

  it("MINOR addition (round 3): a derived_from fact with a corrupted (non-JSON) value projects the kip:malformed-derived-from sentinel edgeKind, never silently mislabeled as an ordinary derived_from edge", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");

    // A hand-asserted derived_from edge whose VALUE is not valid JSON — `readAnswerGraph`'s own
    // `JSON.parse` on the edge's value throws, which must surface a distinguishable sentinel label
    // rather than silently falling back to the plain "derived_from" edgeKind (which would make a
    // corrupted payload indistinguishable from an honestly-undecorated one).
    await repo.assertFact({
      type: "assert",
      v: 1,
      target: {
        kind: "edge",
        eid: "derived_from:person/tal->derived:corrupted",
        edgeKind: "derived_from",
        from: "person/tal",
        to: "derived:corrupted",
      },
      value: "{not-valid-json",
      validFrom: 0,
      validTo: null,
      replicaId: "m5-fixture-replica",
      provenance: { author: "m5-fixture", signature: "sig:corrupt", publicKeyFingerprint: "corrupt-fpr", signedFields: [] },
    });

    // `executeSegment` on a Segment with NO steps is a pure read straight through to
    // `readAnswerGraph(seed, [])` (index.ts: "if (steps.length === 0) return
    // this.readAnswerGraph(seed, [])"), letting this test exercise the derived_from projection
    // directly without needing a real microagent dispatch.
    const answer = await repo.executeSegment({ steps: [], alternatives: [], seed: "person/tal" });

    expect(answer.intermediates).toContain("derived:corrupted");
    const edge = answer.edges.find((e) => e.from === "person/tal" && e.to === "derived:corrupted");
    expect(edge).toBeDefined();
    expect(edge?.edgeKind).toBe("kip:malformed-derived-from");
  });
});
