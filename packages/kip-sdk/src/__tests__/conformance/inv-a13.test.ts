/**
 * INV-A13 — explicit encode/decode/learner manifest selection (N5) (M6,
 * docs/60-conformance-and-testability.md#inv-a13).
 *
 * Asserts (verbatim, docs/60): "Register TWO distinct signed encode/decode/learner manifests;
 * `learn()` naming ONE of each by `(name,version)` → dispatches EXACTLY the named manifests, never
 * a heuristic/`rawKind` pick (perturb `rawKind`, selectors fixed → dispatch unchanged); naming an
 * UNREGISTERED (or registered-but-UNSIGNED, i.e. no signature-valid registration fact in `S`)
 * manifest → `learn()` REJECTED BEFORE THE LOOP RUNS by throwing a typed `KipError` with code
 * `ERR_UNREGISTERED_MANIFEST` — the test asserts the thrown code, no dispatch, no
 * `kip:learn`/`kip:learn-exhausted` fact, cells stay `Unknown`." Violating build: "selecting by
 * `rawKind`/heuristic when the named one is absent; silently substituting for an unregistered
 * name; running on an unselected manifest; rejecting via any channel other than the typed error."
 *
 * `learn()` is an unimplemented throwing stub this round — every assertion below is EXPECTED TO
 * FAIL on a real assertion (the current stub throws a generic `Error`, not a typed `KipError` with
 * `.code`, and rejects rather than resolving), never a type/syntax error.
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

describe("INV-A13: explicit (name,version) manifest selection — never a rawKind/heuristic pick (N5)", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  it("INV-A13: two registered encode manifests — learn() dispatches ONLY the one named in LearnOptions.encode, unchanged across a perturbed rawKind", async () => {
    const eid = "tenant/ns/inv-a13-doc";
    const encodeChosen = buildManifest({ name: "inv-a13-encode-chosen" });
    const encodeOther = buildManifest({ name: "inv-a13-encode-other" });
    const decode = buildManifest({ name: "inv-a13-decode" });
    const learner = buildManifest({ name: "inv-a13-learner" });
    const loss = buildManifest({ name: "inv-a13-loss" });

    const { dispatch, log } = makeScriptedDispatch({
      [encodeChosen.name]: () => encodeOk([nodePropAssert(eid, "content", "chosen")]),
      [encodeOther.name]: () => encodeOk([nodePropAssert(eid, "content", "wrong-heuristic-pick")]),
      [decode.name]: () => decodeOk(),
      [learner.name]: () => learnerOk([]),
      [loss.name]: () => lossOk(0.01), // converges immediately
    });

    const replicaId = freshReplicaId("inv-a13");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encodeChosen, encodeOther, decode, learner, loss]) await registerManifest(repo, m);

    const optsFor = (rawKind: string) =>
      baseLearnOptions({
        threshold: 0.5,
        rawKind,
        encode: { name: encodeChosen.name, version: encodeChosen.version }, // explicitly named
        decode: { name: decode.name, version: decode.version },
        learner: { name: learner.name, version: learner.version },
        loss: { name: loss.name, version: loss.version },
      });

    const learnPromise1 = repo.learn(FIXED_RAW_REF, optsFor("text/markdown"));
    await expect(learnPromise1).resolves.toMatchObject({ status: "accept" });

    // --- unreachable until the above resolves ---
    await learnPromise1;
    // Perturb rawKind, selectors held fixed — dispatch selection MUST be unchanged (never
    // re-derived from rawKind).
    const learnPromise2 = repo.learn(FIXED_RAW_REF, optsFor("image/png"));
    await expect(learnPromise2).resolves.toMatchObject({ status: "accept" });
    await learnPromise2;

    const encodeInvocations = log.filter((r) => r.invocation.manifest.name.startsWith("inv-a13-encode"));
    expect(encodeInvocations.every((r) => r.invocation.manifest.name === encodeChosen.name)).toBe(true);
    expect(log.some((r) => r.invocation.manifest.name === encodeOther.name)).toBe(false);
  });

  it("INV-A13: naming an UNREGISTERED encode manifest is rejected BEFORE the loop runs — a typed ERR_UNREGISTERED_MANIFEST KipError, zero dispatch, cell stays Unknown", async () => {
    const eid = "tenant/ns/inv-a13-unreg-doc";
    const decode = buildManifest({ name: "inv-a13-unreg-decode" });
    const learner = buildManifest({ name: "inv-a13-unreg-learner" });
    const loss = buildManifest({ name: "inv-a13-unreg-loss" });

    const { dispatch, log } = makeScriptedDispatch({
      [decode.name]: () => decodeOk(),
      [learner.name]: () => learnerOk([]),
      [loss.name]: () => lossOk(0.01),
    });

    const replicaId = freshReplicaId("inv-a13-unreg");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    // Deliberately do NOT register any "inv-a13-unreg-encode" manifest.
    for (const m of [decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: 0.5,
      encode: { name: "inv-a13-unreg-encode-NEVER-REGISTERED", version: "1.0.0" },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    const learnPromise = repo.learn(FIXED_RAW_REF, opts);
    await expect(learnPromise).rejects.toMatchObject({ code: "ERR_UNREGISTERED_MANIFEST" });

    // --- unreachable until the above resolves in the real build (currently rejects with a
    // generic, code-less Error instead — the assertion above is where this test fails today) ---
    expect(log).toHaveLength(0); // rejected BEFORE the loop ever dispatches anything
    expect(await repo.getNode(eid)).toBeNull(); // cell stays Unknown
  });
});
