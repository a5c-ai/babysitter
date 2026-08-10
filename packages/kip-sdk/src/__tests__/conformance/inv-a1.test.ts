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
import { generateEd25519KeyPair } from "../../signing";
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
      // Only ONE realizer is registered for the only registered EdgeKind here ("employed_by"), so
      // compileContextualQuery's composition-discovery branch can never surface more than one
      // candidate segment — a `{ kind: "choice" }` return would be a genuine regression, not a
      // vacuously-consistent alternative outcome (round-2 else-fail strengthening).
      expect.fail(`expected a single executed AnswerGraph, got a multi-segment choice: ${JSON.stringify(answer)}`);
    }
  });

  it("ACCEPTED M5-ONLY RESIDUAL (MAJOR finding, round 3, PINNED — no authority/root-of-trust check on registration facts): a functionality registered by a replica whose OWN key is NOT among the declared genesis rootKeys is compiled and dispatched exactly like a genesis-rooted registration", async () => {
    // `rootKeys` explicitly names a DIFFERENT (placeholder) operator key — this replica's own
    // self-generated signing identity (ADR-B2) is NOT among the declared trusted roots. A real
    // authority-chain check (INV-10, M8 scope) would need to demote/reject this registration; today
    // `collectRegisteredBindings`/`findRegisteredManifest` (contextual.ts) consult ONLY signature
    // validity + admission, never which key signed it relative to genesis `rootKeys` — see
    // `collectRegisteredBindings`'s own doc comment for the honest scope note (no un-spec'd M8
    // authority-chain machinery is invented here).
    //
    // ROUND 4 FIX (finding #4): round 3's placeholder string
    // `"-----BEGIN PUBLIC KEY-----\nSOME-OTHER-OPERATORS-KEY\n-----END PUBLIC KEY-----"` is NOT valid
    // PEM key material — `createPublicKey` (node:crypto, via `importEd25519PublicKey`, signing.ts)
    // throws on it, and a malformed `rootKeys` entry is silently dropped at `open()`/the constructor
    // (see index.ts's own "a malformed genesis rootKeys entry is a manifest-authoring error, not an
    // ingest-time" comment), so this test's `rootKeys` array never actually populated the key registry
    // with anything — functionally IDENTICAL to a bare `new KipRepo()`, even though the assertion still
    // happened to land on the correct (accepted-residual) conclusion for the wrong reason. Using a
    // REAL generated Ed25519 keypair's real public-key PEM (a genuinely different, valid, non-self
    // operator key this replica does not hold the private half of) makes `rootKeys` genuinely populate
    // the registry with a different, valid key before the assertion below, so the "rogue registration
    // is accepted anyway" conclusion is now actually exercised against a real non-matching root key,
    // not a no-op.
    const otherOperatorKeyPair = generateEd25519KeyPair();
    const otherOperatorPublicKeyPem = otherOperatorKeyPair.publicKey.export({ type: "spki", format: "pem" }) as string;
    const repo = new KipRepo({ rootKeys: [otherOperatorPublicKeyPem] });
    await assertNode(repo, "person/tal", "person");

    const manifest = makeManifest({ name: "rogue-employed-by-lookup", version: "1.0.0" });
    await repo.registerFunctionality("employed_by", manifest, makeBindingOptions({ weight: 1 }));

    const query = makeQuery({ seed: "person/tal", target: "org" });
    const answer = await repo.runContextualQuery(query);

    // PINS the current (accepted) behavior: the "rogue" (non-genesis-rooted) registration is
    // compiled/dispatched/materialized exactly as if it were trusted — this assertion is expected to
    // start FAILING (forcing a conscious update, never a silent widening) once M8's authority-chain
    // overlay (INV-10) is wired into the active-knowledge registration path.
    if ("result" in answer) {
      expect(answer.result.length).toBe(1);
    } else {
      expect.fail(`expected a single executed AnswerGraph, got a multi-segment choice: ${JSON.stringify(answer)}`);
    }
  });
});
