/**
 * INV-A9 — proj-totality over §5b cells + loss-exclusion (M6,
 * docs/60-conformance-and-testability.md#inv-a9).
 *
 * Asserts (verbatim, docs/60): "... Two competing `kip:learn` (same key, different accepted set,
 * lower-loss given LOWER `orderKey`) → winner is `orderKey`-max (or `kip:conflict`), NEVER the
 * lower-loss one. Two `kip:learn` same key + same accepted `AssertInput[]` + different loss → fold
 * as ONE no-op (NOT `kip:conflict`) — loss canonicalized out of the dedup key." Violating build:
 * "routing recorded loss into the reducer/tiebreak; or surfacing `kip:conflict` on a
 * same-set/different-loss pair."
 *
 * SCOPE NOTE: INV-A9's own text also covers "random-permutation fold ... for `kip:learn`,
 * `kip:learn-exhausted`, microagent-registration, `derived_from`, `same_as` cells" generically —
 * the microagent-registration/`derived_from`/`same_as` slices of that claim are M5 machinery
 * already exit-criteria for M5's own INV-A2/A6/A7/A8/A10/A11 frozen suite; this file scopes to the
 * NEW M6 cell type (`kip:learn`) per 81g-tasks-m6.md's T7.5 ("Same-set/different-loss dedup as one
 * no-op (not conflict)"), which is the slice M6 actually gates on.
 *
 * Two SEPARATE `learn()` calls on the SAME repo, same pinned key (same `rawRef`/`asOf`/selected
 * manifests — the keying caveat in docs/32 requires an EXPLICITLY PINNED `asOf`, never
 * default-`now`, for the same-key guarantee to hold at all), are used to mint the "two competing
 * facts" — HLC/`orderKey` advances monotonically call-to-call on one replica, so the SECOND call
 * deterministically gets the HIGHER `orderKey`.
 *
 * `learn()` is an unimplemented throwing stub this round — every assertion below is EXPECTED TO
 * FAIL on a real (rejected-promise) assertion, never a type/syntax error.
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

describe("INV-A9: kip:learn proj-totality + loss-exclusion from orderKey/reducer/dedup", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  it("INV-A9: same-key, DIFFERENT accepted sets — the orderKey-max fact wins, NEVER the lower-loss one", async () => {
    const eid = "tenant/ns/inv-a9-doc";
    const encode = buildManifest({ name: "inv-a9-encode" });
    const decode = buildManifest({ name: "inv-a9-decode" });
    const learner = buildManifest({ name: "inv-a9-learner" });
    const loss = buildManifest({ name: "inv-a9-loss" });

    let scriptedLoss = 0;
    let scriptedContent = "A";
    const { dispatch } = makeScriptedDispatch({
      [encode.name]: () => encodeOk([nodePropAssert(eid, "content", scriptedContent)]),
      [decode.name]: () => decodeOk(),
      [loss.name]: () => lossOk(scriptedLoss),
    });

    const replicaId = freshReplicaId("inv-a9");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: 1.0, // both scripted losses below converge immediately
      asOf: FIXED_AS_OF, // PINNED — same key on every call (docs/32 keying caveat)
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    // Call 1 (earlier orderKey): LOWER loss, accepts value "A".
    scriptedLoss = 0.1;
    scriptedContent = "A";
    const learnPromise1 = repo.learn(FIXED_RAW_REF, opts);
    await expect(learnPromise1).resolves.toMatchObject({ status: "accept" });

    // --- unreachable until the above resolves ---
    await learnPromise1;

    // Call 2 (later orderKey — sequential on the same replica): HIGHER (worse) loss, accepts "B".
    scriptedLoss = 0.9;
    scriptedContent = "B";
    const learnPromise2 = repo.learn(FIXED_RAW_REF, opts);
    await expect(learnPromise2).resolves.toMatchObject({ status: "accept" });
    await learnPromise2;

    const view = await repo.getNode(eid);
    // The LATER (orderKey-max) fact wins, DESPITE its higher recorded loss — a build that lets the
    // lower-loss call 1 win here (or surfaces this as an unresolved `kip:conflict`) fails.
    const contentSegments = view?.props.content?.segments ?? [];
    expect(contentSegments.some((s) => s.kind === "conflict")).toBe(false);
    expect(contentSegments.some((s) => s.kind === "value" && s.value === "B")).toBe(true);
    expect(contentSegments.some((s) => s.kind === "value" && s.value === "A")).toBe(false);
  });

  it("INV-A9: same-key, SAME accepted set, DIFFERENT loss — folds as ONE no-op, never a kip:conflict", async () => {
    const eid = "tenant/ns/inv-a9-dedup-doc";
    const encode = buildManifest({ name: "inv-a9-dedup-encode" });
    const decode = buildManifest({ name: "inv-a9-dedup-decode" });
    const learner = buildManifest({ name: "inv-a9-dedup-learner" });
    const loss = buildManifest({ name: "inv-a9-dedup-loss" });

    let scriptedLoss = 0;
    const { dispatch } = makeScriptedDispatch({
      [encode.name]: () => encodeOk([nodePropAssert(eid, "content", "same-value")]),
      [decode.name]: () => decodeOk(),
      [loss.name]: () => lossOk(scriptedLoss),
    });

    const replicaId = freshReplicaId("inv-a9-dedup");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: 1.0,
      asOf: FIXED_AS_OF,
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    scriptedLoss = 0.2;
    const learnPromise1 = repo.learn(FIXED_RAW_REF, opts);
    await expect(learnPromise1).resolves.toMatchObject({ status: "accept" });
    await learnPromise1;

    // Same key, SAME accepted set ("same-value" again), but a DIFFERENT recorded loss.
    scriptedLoss = 0.8;
    const learnPromise2 = repo.learn(FIXED_RAW_REF, opts);
    await expect(learnPromise2).resolves.toMatchObject({ status: "accept" });
    await learnPromise2;

    const view = await repo.getNode(eid);
    const contentSegments = view?.props.content?.segments ?? [];
    // Loss is canonicalized OUT of the dedup key — a divergent recorded loss on an otherwise
    // identical re-author is a NO-OP, never a surfaced `kip:conflict`.
    expect(contentSegments.some((s) => s.kind === "conflict")).toBe(false);
    expect(contentSegments.filter((s) => s.kind === "value" && s.value === "same-value")).toHaveLength(1);
  });
});
