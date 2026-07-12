/**
 * INV-A5 — budget termination (3 axes) + exhausted marker (M6,
 * docs/60-conformance-and-testability.md#inv-a5).
 *
 * Asserts (verbatim, docs/60): "Three sub-cases forcing `loss >= threshold` forever — (a) tiny
 * `maxIterations`, (b) tiny `maxWallMs` + hung decode, (c) tiny `maxInvocations` + high fan-out →
 * each: `converged()` = "exhausted", no `accept` fact, a single signed `kip:learn-exhausted`
 * marker, cells stay `Unknown`. Sub-case (b) is driven deterministically, never by sleeping, via
 * the two declared test seams (m7-18): the loop's injectable monotonic clock and a
 * harness-registered stub microagent manifest with scripted hang behavior." Violating build:
 * "`converged` ignoring `maxWallMs` or `maxInvocations` (so (b)/(c) loop unbounded); a
 * sleep-based (b)."
 *
 * TESTABILITY NOTE (see this round's `untestable`/scope report): the current public `Repo` surface
 * has no generic "read an arbitrary fact by target/kind" accessor (`getNode`/`getEdge` cover only
 * node/edge cells) — there is no way to directly retrieve/count the `kip:learn-exhausted` marker
 * fact itself through the declared surface. Each sub-case below instead asserts the marker's
 * OBSERVABLE consequences: `status: "exhausted"`, the candidate cell staying `Unknown` (no accept
 * fact ever touches it), and — the actual "which budget axis tripped" proof — a bounded dispatch
 * count consistent with ONLY the axis under test being capable of stopping the loop that early.
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

describe("INV-A5: bounded disjunctive budget — the loop ALWAYS terminates", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  it("INV-A5(a): tiny maxIterations forces exhausted with a bounded iteration count, never accept", async () => {
    const eid = "tenant/ns/inv-a5a-doc";
    const encode = buildManifest({ name: "inv-a5a-encode" });
    const decode = buildManifest({ name: "inv-a5a-decode" });
    const learner = buildManifest({ name: "inv-a5a-learner" });
    const loss = buildManifest({ name: "inv-a5a-loss" });

    const { dispatch, log } = makeScriptedDispatch({
      [encode.name]: () => encodeOk([nodePropAssert(eid, "content", "v0")]),
      [decode.name]: () => decodeOk(),
      [learner.name]: (_inv, idx) => learnerOk([nodePropAssert(eid, "content", `v${idx + 1}`)]),
      // NEVER converges — loss is always far above threshold.
      [loss.name]: () => lossOk(1.0),
    });

    const replicaId = freshReplicaId("inv-a5a");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: -1, // unreachable: bestLoss (>= 0 always) can never be < -1
      maxIterations: 2, // the tiny axis under test
      maxWallMs: 10_000_000,
      maxInvocations: 1_000_000,
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    const learnPromise = repo.learn(FIXED_RAW_REF, opts);
    await expect(learnPromise).resolves.toMatchObject({ status: "exhausted" });

    // --- unreachable until the above resolves ---
    await learnPromise;
    const lossCalls = log.filter((r) => r.invocation.manifest.name === loss.name);
    expect(lossCalls).toHaveLength(2); // bounded EXACTLY at maxIterations, never one more
    expect(await repo.getNode(eid)).toBeNull(); // no accept fact ever touched this cell
  });

  it("INV-A5(b): tiny maxWallMs + a hung decode (driven by the injectable clock seam, never sleep) forces exhausted", async () => {
    const eid = "tenant/ns/inv-a5b-doc";
    const encode = buildManifest({ name: "inv-a5b-encode" });
    const decode = buildManifest({ name: "inv-a5b-decode" });
    const learner = buildManifest({ name: "inv-a5b-learner" });
    const loss = buildManifest({ name: "inv-a5b-loss" });

    const { dispatch, log } = makeScriptedDispatch({
      [encode.name]: () => encodeOk([nodePropAssert(eid, "content", "v0")]),
      // "hung" decode: returns immediately (no real sleep) — the HANG is entirely simulated via
      // the injectable clock below, per docs/32's m7-18 declared seam.
      [decode.name]: () => decodeOk(),
      [learner.name]: (_inv, idx) => learnerOk([nodePropAssert(eid, "content", `v${idx + 1}`)]),
      [loss.name]: () => lossOk(1.0), // never converges
    });

    // The injectable monotonic clock seam (docs/32 §5b.2, m7-18): each call jumps 5s forward, so
    // even a SINGLE iteration's worth of clock reads blows straight through a 100ms maxWallMs —
    // deterministic, zero real elapsed wall-clock time spent in this test.
    let fakeNowMs = 0;
    const clock = () => {
      fakeNowMs += 5_000;
      return fakeNowMs;
    };

    const replicaId = freshReplicaId("inv-a5b");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch, clock });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: -1,
      maxIterations: 1_000_000,
      maxWallMs: 100, // the tiny axis under test
      maxInvocations: 1_000_000,
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    const learnPromise = repo.learn(FIXED_RAW_REF, opts);
    await expect(learnPromise).resolves.toMatchObject({ status: "exhausted" });

    // --- unreachable until the above resolves ---
    await learnPromise;
    const lossCalls = log.filter((r) => r.invocation.manifest.name === loss.name);
    // The scripted clock jumps 5s per read — with a 100ms budget this MUST trip within the very
    // first iteration (never anywhere close to iteration/invocation exhaustion).
    expect(lossCalls.length).toBeLessThanOrEqual(1);
    expect(await repo.getNode(eid)).toBeNull();
  });

  it("INV-A5(c): tiny maxInvocations + high fan-out forces exhausted with a bounded total invocation count", async () => {
    const eid = "tenant/ns/inv-a5c-doc";
    const encode = buildManifest({ name: "inv-a5c-encode" });
    const decode = buildManifest({ name: "inv-a5c-decode" });
    const learner = buildManifest({ name: "inv-a5c-learner" });
    const loss = buildManifest({ name: "inv-a5c-loss" });

    const { dispatch, log } = makeScriptedDispatch({
      [encode.name]: () => encodeOk([nodePropAssert(eid, "content", "v0")]),
      [decode.name]: () => decodeOk(),
      [learner.name]: (_inv, idx) => learnerOk([nodePropAssert(eid, "content", `v${idx + 1}`)]),
      [loss.name]: () => lossOk(1.0), // never converges
    });

    const replicaId = freshReplicaId("inv-a5c");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: -1,
      maxIterations: 1_000_000,
      maxWallMs: 10_000_000,
      maxInvocations: 1, // the tiny axis under test — smaller than even one full iteration's fan-out
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    const learnPromise = repo.learn(FIXED_RAW_REF, opts);
    await expect(learnPromise).resolves.toMatchObject({ status: "exhausted" });

    // --- unreachable until the above resolves ---
    await learnPromise;
    expect(log.length).toBeLessThanOrEqual(1);
    expect(await repo.getNode(eid)).toBeNull();
  });
});
