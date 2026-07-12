/**
 * m6-round3-critic-fixes.test.ts — NON-FROZEN, additive coverage proving round-3's fixes for the two
 * corroborated crash-path bugs multiple independent critics found in round 2 (min adversarial score
 * 58 -> 70, target 88):
 *
 *  - CRITICAL #1: `learn()` threw an uncaught `TypeError` when a dispatch's `outputSchema` is
 *    permissive (e.g. `{}`, every fixture in this suite) and the dispatch genuinely returns
 *    `output: undefined` — `validateAgainstOutputSchema` trivially passes, so `dispatchOne` returned
 *    `undefined` verbatim, and the caller only guarded `=== null`, so `(candidateOutput as
 *    {...}).candidateFacts` (or `.reconstructed`) threw reading a property off `undefined`.
 *  - CRITICAL #2: `isAssertInputArray` only shallow-checked `type`/`target`, never `provenance`/
 *    `validFrom`/`validTo`/`replicaId` — a candidate array item missing `provenance` sailed through,
 *    got selected as `state.candidate`, and crashed at ACCEPT time reading
 *    `candidateInput.provenance.source` off `undefined`.
 *
 * Each `describe` block below reproduces the EXACT crash shape (not just the fixed happy path) so a
 * regression back to the round-2 behavior fails these tests even if the frozen M0-M5 conformance
 * suite and the round-2 critic-fix suite (`m6-round2-critic-fixes.test.ts`) both stay green.
 *
 * Built purely against the public `KipRepo`/`learn()`/`getNode` surface, per this milestone's own
 * house rule (`fixtures-m6.ts`).
 */
import { afterEach, describe, expect, it } from "vitest";
import { KipRepo } from "../index";
import {
  baseLearnOptions,
  buildManifest,
  decodeOk,
  encodeOk,
  freshReplicaId,
  learnerOk,
  lossOk,
  makeScriptedDispatch,
  nodePropAssert,
  registerManifest,
} from "./conformance/fixtures-m6";

describe("M6 round-3 finding CRITICAL #1: a genuinely `undefined` dispatch output never crashes learn(), always scores infinite loss", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  it("an encode call returning `output: undefined` against a permissive `{}` outputSchema resolves to exhausted, never throws", async () => {
    const eid = "tenant/ns/m6-crit3-encode-undefined";
    const encode = buildManifest({ name: "m6-crit3-encode-undef" }); // outputSchema: {} (buildManifest default)
    const decode = buildManifest({ name: "m6-crit3-decode-undef" });
    const learner = buildManifest({ name: "m6-crit3-learner-undef" });
    const loss = buildManifest({ name: "m6-crit3-loss-undef" });

    const { dispatch } = makeScriptedDispatch({
      // A genuinely undefined output — `validateAgainstOutputSchema(undefined, {})` trivially
      // passes (permissive schema), so BEFORE this fix `dispatchOne` returned `undefined` verbatim
      // and the caller's `candidateOutput === null` guard missed it entirely, crashing on
      // `(candidateOutput as {candidateFacts?}).candidateFacts` reading off `undefined`.
      [encode.name]: () => ({ exitCode: 0, output: undefined, elapsedMs: 0 }),
      [decode.name]: () => decodeOk(),
      [learner.name]: () => ({ exitCode: 0, output: undefined, elapsedMs: 0 }),
      [loss.name]: () => lossOk(0.01), // would immediately converge if ever legitimately reached
    });

    const replicaId = freshReplicaId("m6-crit3-encode-undef");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: 0.5,
      maxIterations: 3,
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    // MUST resolve gracefully (never reject with an uncaught TypeError).
    const result = await repo.learn({ blob: "3".repeat(40) }, opts);
    expect(result.status).toBe("exhausted");
    expect(result.loss).toBe(Number.POSITIVE_INFINITY);
    expect(await repo.getNode(eid)).toBeNull();
  });

  it("a decode call returning `output: undefined` never crashes destructuring `.reconstructed`, resolves exhausted", async () => {
    const eid = "tenant/ns/m6-crit3-decode-undefined";
    const encode = buildManifest({ name: "m6-crit3b-encode" });
    const decode = buildManifest({ name: "m6-crit3b-decode" });
    const learner = buildManifest({ name: "m6-crit3b-learner" });
    const loss = buildManifest({ name: "m6-crit3b-loss" });

    const { dispatch } = makeScriptedDispatch({
      [encode.name]: () => encodeOk([nodePropAssert(eid, "prop", "v0")]),
      // Decode's `output` is genuinely `undefined` — before this fix,
      // `(reconstructedOutput as {reconstructed}).reconstructed` would throw reading off `undefined`.
      [decode.name]: () => ({ exitCode: 0, output: undefined, elapsedMs: 0 }),
      [learner.name]: () => encodeOk([nodePropAssert(eid, "prop", "v1")]),
      [loss.name]: () => lossOk(0.01),
    });

    const replicaId = freshReplicaId("m6-crit3-decode-undef");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: 0.5,
      maxIterations: 3,
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    const result = await repo.learn({ blob: "4".repeat(40) }, opts);
    expect(result.status).toBe("exhausted");
    expect(result.loss).toBe(Number.POSITIVE_INFINITY);
    expect(await repo.getNode(eid)).toBeNull();
  });

  it("a loss call returning a non-numeric `output` (or `undefined`) never silently corrupts the `<` comparison, scores infinite loss", async () => {
    const eid = "tenant/ns/m6-crit3-loss-nonnumeric";
    const encode = buildManifest({ name: "m6-crit3c-encode" });
    const decode = buildManifest({ name: "m6-crit3c-decode" });
    const learner = buildManifest({ name: "m6-crit3c-learner" });
    const loss = buildManifest({ name: "m6-crit3c-loss" });

    // ROUND-4 STRENGTHENING (test-quality finding): the ORIGINAL version of this test scripted a
    // single loss value ("not-a-number") for every call. JS's `<` operator coerces a non-numeric
    // string to `NaN`, and every `NaN` comparison is `false` — so the OLD buggy code (a bare
    // `lossOutput as number` cast, no `typeof`/`Number.isFinite` guard) never actually got exercised
    // by that scenario either: `"not-a-number" < Infinity` is `NaN < Infinity` = `false` regardless of
    // whether the guard exists, so `bestLoss` never updates either way and the test passed identically
    // under old and new code — a non-discriminating assertion.
    //
    // FIX: script two NUMERIC-LOOKING strings ("10" then "9") whose comparison order genuinely
    // diverges between numeric and lexicographic semantics: numerically `10 > 9`, but
    // lexicographically `"10" < "9"` (compare first char: '1' < '9'). Call 1 ("10") coerces cleanly
    // against the SEED `Infinity` (a real number) via JS's mixed-type `<` coercion, so the OLD
    // (bare-cast) code WOULD have accepted it as `state.bestLoss = "10"` (a STRING, silently
    // corrupting the state) — then call 2 ("9") compares STRING-vs-STRING against that corrupted
    // `bestLoss`, hitting the lexicographic branch and failing to recognize `9 < 10` numerically. The
    // OLD code's final `result.loss` would be the raw string `"10"`, never `Infinity` — a `typeof`/
    // value mismatch the FIXED code (which rejects every non-numeric loss output as infinite-loss,
    // never touching `bestLoss` at all) cannot exhibit.
    const { dispatch } = makeScriptedDispatch({
      [encode.name]: () => encodeOk([nodePropAssert(eid, "prop", "v0")]),
      [decode.name]: () => decodeOk(),
      [learner.name]: () => encodeOk([nodePropAssert(eid, "prop", "v1")]),
      [loss.name]: (_inv, idx) => ({
        exitCode: 0,
        output: (idx === 0 ? "10" : "9") as unknown as number,
        elapsedMs: 0,
      }),
    });

    const replicaId = freshReplicaId("m6-crit3-loss-nonnum");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: 0.5,
      maxIterations: 2, // exactly encode (idx 0: "10") + one learner call (idx 1: "9"), then exhausted
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    const result = await repo.learn({ blob: "5".repeat(40) }, opts);
    expect(result.status).toBe("exhausted");
    // Genuinely discriminating: the FIXED code never lets a non-numeric loss touch `bestLoss` at all,
    // so it stays the real number `Infinity`. The OLD (bare-cast) code would instead return the raw
    // string `"10"` here (see the scenario walkthrough above) — `typeof "10" === "string"`, failing
    // BOTH assertions below.
    expect(typeof result.loss).toBe("number");
    expect(result.loss).toBe(Number.POSITIVE_INFINITY);
    expect(await repo.getNode(eid)).toBeNull();
  });
});

describe("M6 round-3 finding CRITICAL #2: a candidate array item missing `provenance` never becomes state.candidate, never crashes at accept", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  it("an encode candidate array whose sole item is missing `provenance` is scored infinite loss, learn() resolves (never throws)", async () => {
    const eid = "tenant/ns/m6-crit3-missing-provenance";
    const encode = buildManifest({ name: "m6-crit3d-encode" });
    const decode = buildManifest({ name: "m6-crit3d-decode" });
    const learner = buildManifest({ name: "m6-crit3d-learner" });
    const loss = buildManifest({ name: "m6-crit3d-loss" });

    // A well-formed `nodePropAssert` MINUS its `provenance` field — the exact shape that, before
    // this fix, sailed through the old shallow `isAssertInputArray` (which only checked
    // `type === "assert"` and `"target" in item`), got selected as `state.candidate`, and crashed at
    // ACCEPT time reading `candidateInput.provenance.source` off `undefined`.
    const malformedCandidate = { ...nodePropAssert(eid, "prop", "v0") } as Record<string, unknown>;
    delete malformedCandidate.provenance;

    const { dispatch } = makeScriptedDispatch({
      [encode.name]: () => ({ exitCode: 0, output: { candidateFacts: [malformedCandidate] }, elapsedMs: 0 }),
      [decode.name]: () => decodeOk(),
      [learner.name]: () => encodeOk([nodePropAssert(eid, "prop", "v1")]),
      [loss.name]: () => lossOk(0.01), // would immediately converge if the malformed candidate were ever accepted
    });

    const replicaId = freshReplicaId("m6-crit3-missing-prov");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: 0.5,
      maxIterations: 3,
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    // MUST resolve gracefully (never reject with an uncaught TypeError reading `.provenance.source`).
    const result = await repo.learn({ blob: "6".repeat(40) }, opts);
    expect(result.status).toBe("exhausted");
    expect(result.loss).toBe(Number.POSITIVE_INFINITY);
    // The malformed candidate was NEVER accepted/committed to the graph.
    expect(await repo.getNode(eid)).toBeNull();
  });

  it("the SAME missing-provenance candidate array, mixed with a later genuinely valid one, still eventually accepts the VALID candidate (never crashes mid-way)", async () => {
    const eid = "tenant/ns/m6-crit3-recover-after-malformed";
    const encode = buildManifest({ name: "m6-crit3e-encode" });
    const decode = buildManifest({ name: "m6-crit3e-decode" });
    const learner = buildManifest({ name: "m6-crit3e-learner" });
    const loss = buildManifest({ name: "m6-crit3e-loss" });

    const malformedCandidate = { ...nodePropAssert(eid, "prop", "encode-seed") } as Record<string, unknown>;
    delete malformedCandidate.provenance;

    // ROUND-4 STRENGTHENING (test-quality finding): the ORIGINAL version of this test scripted the
    // malformed (encode) iteration's loss at `0.9` — ABOVE `threshold` (0.5) — so it never converged
    // even if it HAD reached the accept-commit step, meaning this test passed identically whether
    // `isAssertInputArray` correctly rejected the malformed item (the fix) or incorrectly admitted it
    // (the old bug): either way `0.9` never triggers accept, so the crash path this test claims to
    // guard was never actually exercised.
    //
    // FIX: give the malformed candidate the LOWER scripted loss (BELOW threshold), so the OLD buggy
    // `isAssertInputArray` (which never validated `provenance`'s presence) is FORCED down the
    // crash-reachable path: under the old code, the malformed item would sail through the guard,
    // reach decode/loss at iteration 0, measure this low loss, and — being below threshold — accept
    // IMMEDIATELY (before iteration 1's learner ever runs), then crash reading
    // `candidateInput.provenance.source` off the `undefined` `provenance` at ACCEPT time. Under the
    // FIXED code, the malformed item is rejected at `isAssertInputArray` BEFORE decode/loss are ever
    // dispatched for iteration 0, so this SAME low loss value instead measures iteration 1's
    // genuinely valid candidate, which converges cleanly with no crash.
    const { dispatch } = makeScriptedDispatch({
      // Iteration 0 (encode): malformed (missing provenance) — must NOT crash, must NOT become
      // state.candidate.
      [encode.name]: () => ({ exitCode: 0, output: { candidateFacts: [malformedCandidate] }, elapsedMs: 0 }),
      [decode.name]: () => decodeOk(),
      // Iteration 1+ (learner): a genuinely well-formed candidate — MUST still be reachable and
      // acceptable after the prior iteration's malformed candidate.
      [learner.name]: () => learnerOk([nodePropAssert(eid, "prop", "learner-fixed")]),
      [loss.name]: () => lossOk(0.05), // below threshold — see the scenario walkthrough above
    });

    const replicaId = freshReplicaId("m6-crit3-recover");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: 0.5,
      maxIterations: 3,
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    const result = await repo.learn({ blob: "7".repeat(40) }, opts);
    expect(result.status).toBe("accept");
    expect(result.loss).toBe(0.05);
    const view = await repo.getNode(eid);
    expect(view?.props.prop?.segments.some((s) => s.kind === "value" && s.value === "learner-fixed")).toBe(true);
  });

  it("a candidate array item missing `validTo`/`replicaId` is likewise scored infinite loss, never reaches assertFact's own well-formed() throw", async () => {
    const eid = "tenant/ns/m6-crit3-missing-validto-replicaid";
    const encode = buildManifest({ name: "m6-crit3f-encode" });
    const decode = buildManifest({ name: "m6-crit3f-decode" });
    const learner = buildManifest({ name: "m6-crit3f-learner" });
    const loss = buildManifest({ name: "m6-crit3f-loss" });

    const missingValidTo = { ...nodePropAssert(eid, "prop", "v0") } as Record<string, unknown>;
    delete missingValidTo.validTo;
    const missingReplicaId = { ...nodePropAssert(eid, "prop", "v1") } as Record<string, unknown>;
    delete missingReplicaId.replicaId;

    const { dispatch } = makeScriptedDispatch({
      [encode.name]: (_inv, idx) => ({
        exitCode: 0,
        output: { candidateFacts: [idx === 0 ? missingValidTo : missingReplicaId] },
        elapsedMs: 0,
      }),
      [decode.name]: () => decodeOk(),
      [learner.name]: (_inv, idx) => ({
        exitCode: 0,
        output: { next: [idx === 0 ? missingValidTo : missingReplicaId] },
        elapsedMs: 0,
      }),
      [loss.name]: () => lossOk(0.01),
    });

    const replicaId = freshReplicaId("m6-crit3-missing-fields");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: 0.5,
      maxIterations: 3,
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    const result = await repo.learn({ blob: "8".repeat(40) }, opts);
    expect(result.status).toBe("exhausted");
    expect(result.loss).toBe(Number.POSITIVE_INFINITY);
    expect(await repo.getNode(eid)).toBeNull();
  });
});
