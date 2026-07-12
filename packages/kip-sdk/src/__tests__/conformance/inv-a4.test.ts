/**
 * INV-A4 — learner replica-fold (M6, docs/60-conformance-and-testability.md#inv-a4).
 *
 * Asserts (verbatim, docs/60): "Commit a `kip:learn` fact on A, then drop & rebuild `proj` on B
 * that has the fact but lacks the models → B's learned heads byte-identical to A's (proj NEVER
 * re-runs the loop)." Violating build: "`proj` re-invoking any accelerator-class agent (so
 * model-less B diverges/errors)."
 *
 * `learn()` is an unimplemented throwing stub this round (M6 is TEST-FIRST TDD) — every test below
 * is EXPECTED TO FAIL on a real assertion (a rejected promise where "accept" was expected), never
 * on a type/syntax error. The full scenario is written as `learn()`'s frozen acceptance criterion.
 */
import { afterEach, describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import {
  FIXED_AS_OF,
  FIXED_RAW_REF,
  baseLearnOptions,
  decodeOk,
  encodeOk,
  freshReplicaId,
  lossOk,
  makeScriptedDispatch,
  nodePropAssert,
  registerManifest,
  buildManifest,
} from "./fixtures-m6";

describe("INV-A4: learner replica-fold — proj NEVER re-runs the loop", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  it("INV-A4: replica B, whose dispatch always fails (\"lacks the models\"), reads a byte-identical head to replica A after sync — without ever dispatching", async () => {
    const eid = "tenant/ns/inv-a4-doc";
    const encode = buildManifest({ name: "inv-a4-encode" });
    const decode = buildManifest({ name: "inv-a4-decode" });
    const learner = buildManifest({ name: "inv-a4-learner" });
    const loss = buildManifest({ name: "inv-a4-loss" });

    const { dispatch: dispatchA } = makeScriptedDispatch({
      [encode.name]: () => encodeOk([nodePropAssert(eid, "content", "learned-by-A")]),
      [decode.name]: () => decodeOk(),
      [loss.name]: () => lossOk(0.01), // converges immediately — threshold 0.5 below
    });

    const replicaAId = freshReplicaId("inv-a4-a");
    const repoA = new KipRepo({ replicaId: replicaAId, dispatchMicroagent: dispatchA });
    repos.push(repoA);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repoA, m);

    const opts = baseLearnOptions({
      threshold: 0.5,
      asOf: FIXED_AS_OF,
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    const learnPromiseA = repoA.learn(FIXED_RAW_REF, opts);
    // FIRST assertion — currently FAILS (learn() rejects with "unimplemented: learn" instead of
    // resolving "accept"). This is the expected red state for this frozen test.
    await expect(learnPromiseA).resolves.toMatchObject({ status: "accept" });

    // --- Below: the full frozen scenario, unreachable until the above resolves in the real build ---
    await learnPromiseA;
    const aView = await repoA.getNode(eid);

    const replicaBId = freshReplicaId("inv-a4-b");
    let dispatchCallsOnB = 0;
    const repoB = new KipRepo({
      replicaId: replicaBId,
      // B "lacks the models" — any dispatch attempt is itself a build-under-test failure (proj
      // must NEVER re-invoke an accelerator-class agent to regenerate/verify a recorded kip:learn
      // fact — it only ever reads recorded facts).
      dispatchMicroagent: async () => {
        dispatchCallsOnB += 1;
        throw new Error("replica B lacks the encode/decode/loss models — proj must never dispatch");
      },
    });
    repos.push(repoB);

    await repoB.sync(replicaAId);
    const bView = await repoB.getNode(eid);

    expect(dispatchCallsOnB).toBe(0);
    expect(bView).toEqual(aView);
  });
});
