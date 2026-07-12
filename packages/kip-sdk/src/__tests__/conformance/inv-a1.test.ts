/**
 * INV-A1 — microagents-are-clients (load-bearing).
 *
 * docs/60-conformance-and-testability.md#inv-a1 (verbatim): "Asserts: No active-layer path
 * (registerFunctionality/runContextualQuery/runAcquisition/learn) mutates /heads except by
 * appending a signed fact; run against a harness whose only mutation primitive is assertFact; every
 * state change attributable to a signed fact authored by the orchestrator. Violating build: a bound
 * functionality, encode/decode/learner, or Miner/Ingestor that writes the graph directly."
 *
 * docs/31-contextual-functionalities.md's own "Execution = two phases with a hard determinism
 * boundary" section names this exact rule for phase 2: "the ONLY side effect: signed facts" — the
 * orchestrator "authors signed assert + derived_from facts (provenance names invocation + resolved
 * asOf)"; and decision D-5b.1: "an EdgeKind MAY carry executable functionalities, but traversal
 * results enter kip only as orchestrator-authored signed facts... Rejected: let the bound microagent
 * write the edge/node directly (bypasses the §3.2 ingest gate, lets replicas diverge by execution
 * order, re-introduces the Letta pitfall, N2)."
 *
 * Test methodology — this SDK's public `Repo` surface has no generic "list every fact"/"count
 * mutations" introspection method (out of scope for this file to invent one), so INV-A1 is exercised
 * via the two READ-side consequences the invariant's own text implies: (1) `registerFunctionality`'s
 * returned `FactId` denotes a real, provenance-bearing fact (checked via `provenanceOf`, the seam
 * docs/40 itself names for this exact purpose); (2) every EID `runContextualQuery`/`executeSegment`
 * produces is reachable ONLY as an ordinary projected `NodeView`/`EdgeView` with real signed
 * provenance (checked via `getNode`/`getEdge`) — i.e. nothing appears in the graph that isn't a
 * projectable, signed fact. Both are real, already-implemented M0 read paths (`assertFact`/
 * `getNode`); `registerFunctionality`/`runContextualQuery`/`provenanceOf` themselves still throw
 * `unimplemented: <name>` (M5/T6.x not yet implemented) — these tests are EXPECTED TO FAIL right now,
 * surfacing as that thrown error propagating through the `await`, not as an import/type error (the
 * same documented expectation inv-14a.test.ts's own file-level comment establishes for this suite).
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import { assertNode, makeBindingOptions, makeManifest, makeQuery } from "./fixtures-m5";

describe("INV-A1: microagents-are-clients — no active-layer path mutates state except by appending a signed fact", () => {
  it("registerFunctionality's only observable effect is a signed, provenance-bearing microagent-registration/binding fact", async () => {
    const repo = new KipRepo();
    const manifest = makeManifest({ name: "employed-by-lookup", version: "1.0.0" });

    const factId = await repo.registerFunctionality("employed_by", manifest, makeBindingOptions({ weight: 1 }));

    // The registration seam (docs/40) is documented to return a real FactId — provenanceOf (the
    // named introspection seam) MUST resolve it to a real, signed provenance record, never a
    // synthesized/in-memory-only handle with no backing fact.
    const provenance = await repo.provenanceOf(factId);
    expect(provenance.length).toBeGreaterThan(0);
    expect(provenance[0]?.signature).toBeTruthy();
    expect(provenance[0]?.author).toBeTruthy();
  });

  it("runContextualQuery's every result/intermediate EID is reachable only via an ordinary, signed projected fact — never an out-of-band graph mutation", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");

    const manifest = makeManifest({ name: "employed-by-lookup", version: "1.0.0" });
    await repo.registerFunctionality("employed_by", manifest, makeBindingOptions({ weight: 1 }));

    const query = makeQuery({ seed: "person/tal", target: "org" });
    const answer = await repo.runContextualQuery(query);

    if ("result" in answer) {
      for (const eid of [...answer.result, ...answer.intermediates]) {
        const node = await repo.getNode(eid);
        const edge = node ? null : await repo.getEdge(eid);
        const view = node ?? edge;
        // Whatever the query materialized, it MUST be readable back as an ordinary projected view
        // with real signed provenance — an entity that exists only because a bound microagent wrote
        // it directly (bypassing assertFact/ingest) would not be reachable through this read path.
        expect(view).not.toBeNull();
        expect(view?.provenance.signature).toBeTruthy();
      }
    } else {
      // A multi-segment typed choice is itself zero-dispatch/zero-fact (INV-A7) — vacuously
      // consistent with INV-A1 (nothing was mutated at all).
      expect(Array.isArray(answer.segments)).toBe(true);
    }
  });
});
