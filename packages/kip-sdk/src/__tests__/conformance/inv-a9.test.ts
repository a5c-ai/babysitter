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

  /**
   * ROUND-2 ADDITION (CRITICAL #2 regression coverage): the two tests above both exercise "same
   * TARGET, different/same value" collisions — resolved for free by the pre-existing M1 `lww-hlc`
   * per-target reducer, since both `learn()` calls' accepted `AssertInput[]` name the SAME
   * `node-prop` cell. That is NOT the gap this test closes.
   *
   * Here, the two `learn()` calls at the SAME pinned key each accept a DISJOINT `AssertInput[]` set —
   * call 1 asserts a prop on eid A, call 2 asserts a DIFFERENT prop on a DIFFERENT eid B — so their
   * underlying node-prop facts never collide on any (eid,prop) cell at all; the ordinary M1 reducer
   * has nothing to adjudicate. Before this round's fix, BOTH accepted sets would silently commit (no
   * conflict ever surfaced) even though they are two competing claims for the SAME `kip:learn` key
   * (docs/32's correction-class-cell design). `getLearnResult` (the new read surface backed by
   * `proj.ts`'s `foldLearnCell`) is asserted here to surface the contradiction honestly as a
   * `kip:conflict`-shaped result, rather than silently letting both stand with no trace of the
   * disagreement.
   */
  it("INV-A9: same-key, DISJOINT accepted-set targets — genuine conflict surfaces via getLearnResult, never a silent dual-commit", async () => {
    const eidA = "tenant/ns/inv-a9-disjoint-a";
    const eidB = "tenant/ns/inv-a9-disjoint-b";
    const encode = buildManifest({ name: "inv-a9-disjoint-encode" });
    const decode = buildManifest({ name: "inv-a9-disjoint-decode" });
    const learner = buildManifest({ name: "inv-a9-disjoint-learner" });
    const loss = buildManifest({ name: "inv-a9-disjoint-loss" });

    let call = 0;
    const { dispatch } = makeScriptedDispatch({
      [encode.name]: () =>
        encodeOk(call === 0 ? [nodePropAssert(eidA, "propA", "valueA")] : [nodePropAssert(eidB, "propB", "valueB")]),
      [decode.name]: () => decodeOk(),
      [loss.name]: () => lossOk(0.1),
    });

    const replicaId = freshReplicaId("inv-a9-disjoint");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const selectors = {
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
    };
    const opts = baseLearnOptions({
      threshold: 1.0,
      asOf: FIXED_AS_OF, // PINNED — same key on every call (docs/32 keying caveat)
      ...selectors,
      loss: { name: loss.name, version: loss.version },
    });

    // Call 1: accepts a fact touching eidA/propA ONLY.
    call = 0;
    await expect(repo.learn(FIXED_RAW_REF, opts)).resolves.toMatchObject({ status: "accept" });

    // Call 2: SAME pinned key, but accepts a fact touching a DISJOINT cell (eidB/propB) — no shared
    // (eid,prop) target with call 1 at all.
    call = 1;
    await expect(repo.learn(FIXED_RAW_REF, opts)).resolves.toMatchObject({ status: "accept" });

    // Both underlying node-prop facts DO both take effect in the graph (each call's own target is
    // reachable) — that half is correct and unchanged (the M1 reducer for THOSE cells has nothing to
    // adjudicate, since the two calls never share a target).
    const viewA = await repo.getNode(eidA);
    const viewB = await repo.getNode(eidB);
    expect(viewA?.props.propA?.segments.some((s) => s.kind === "value" && s.value === "valueA")).toBe(true);
    expect(viewB?.props.propB?.segments.some((s) => s.kind === "value" && s.value === "valueB")).toBe(true);

    // But the KEY-LEVEL claim — "this is THE single accepted result for this (rawRef, ontologyAsOf,
    // manifest) key" — genuinely disagrees between the two calls (disjoint accepted sets), and MUST
    // be surfaced as a conflict rather than silently letting both stand with no contradiction ever
    // recorded (docs/32's correction-class-cell guarantee, INV-A9).
    const result = await repo.getLearnResult(FIXED_RAW_REF, FIXED_AS_OF, selectors);
    expect(result.status).toBe("conflict");
    if (result.status === "conflict") {
      expect(result.conflict.kind).toBe("kip:learn");
      expect(result.conflict.candidates.length).toBe(2);
    }
  });
});
