/**
 * INV-A14 — rawKind declared once, threaded unchanged (M6,
 * docs/60-conformance-and-testability.md#inv-a14).
 *
 * Asserts (verbatim, docs/60): "Multi-iteration `learn()` → the `rawKind` arg of EVERY
 * `DecodeAgent` invocation is byte-identical to the single `LearnOptions.rawKind` sourced at
 * entry — never re-inferred per-iteration, never caller-asserted mid-loop." Violating build:
 * "re-inferring or mutating `rawKind` between iterations (two decode calls seeing different
 * kinds)."
 *
 * `learn()` is an unimplemented throwing stub this round — every assertion below is EXPECTED TO
 * FAIL on a real (rejected-promise) assertion, never a type/syntax error.
 */
import { afterEach, describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import {
  FIXED_RAW_REF,
  baseLearnOptions,
  decodeOk,
  encodeOk,
  freshReplicaId,
  learnerOk,
  lossOk,
  makeScriptedDispatch,
  nodePropAssert,
  registerManifest,
  buildManifest,
} from "./fixtures-m6";

describe("INV-A14: rawKind sourced ONCE at learn() entry, threaded byte-identical into every DecodeAgent call", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  it("INV-A14: a multi-iteration (never-converging-until-the-last-step) learn() call passes the SAME rawKind to every DecodeAgent invocation", async () => {
    const eid = "tenant/ns/inv-a14-doc";
    const encode = buildManifest({ name: "inv-a14-encode" });
    const decode = buildManifest({ name: "inv-a14-decode" });
    const learner = buildManifest({ name: "inv-a14-learner" });
    const loss = buildManifest({ name: "inv-a14-loss" });

    const declaredRawKind = "text/markdown";
    // Never converges until the 3rd (last) scripted loss — forces >= 3 DecodeAgent invocations.
    const scriptedSequence = [0.9, 0.6, 0.01];
    const { dispatch, log } = makeScriptedDispatch({
      [encode.name]: () => encodeOk([nodePropAssert(eid, "content", "v0")]),
      [decode.name]: () => decodeOk(),
      [learner.name]: (_inv, idx) => learnerOk([nodePropAssert(eid, "content", `v${idx + 1}`)]),
      [loss.name]: (_inv, idx) => lossOk(scriptedSequence[idx]),
    });

    const replicaId = freshReplicaId("inv-a14");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: 0.5, // only the 3rd scripted loss (0.01) is below this
      maxIterations: scriptedSequence.length,
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
      rawKind: declaredRawKind,
    });

    const learnPromise = repo.learn(FIXED_RAW_REF, opts);
    await expect(learnPromise).resolves.toMatchObject({ status: "accept" });

    // --- unreachable until the above resolves ---
    await learnPromise;
    const decodeCalls = log.filter((r) => r.invocation.manifest.name === decode.name);
    expect(decodeCalls.length).toBeGreaterThanOrEqual(3); // genuinely multi-iteration
    for (const call of decodeCalls) {
      const input = call.invocation.input as { rawKind?: unknown };
      expect(input.rawKind).toBe(declaredRawKind); // byte-identical on EVERY call, never re-inferred
    }
    // Every recorded rawKind is the SAME value, not merely each equal to the option (defends
    // against a build that mutates a shared object between iterations).
    const distinctRawKinds = new Set(decodeCalls.map((c) => (c.invocation.input as { rawKind?: unknown }).rawKind));
    expect(distinctRawKinds.size).toBe(1);
  });
});
