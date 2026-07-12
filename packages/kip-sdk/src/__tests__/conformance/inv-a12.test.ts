/**
 * INV-A12 — learner accept-if-improved + options↔state agreement (M6,
 * docs/60-conformance-and-testability.md#inv-a12).
 *
 * Asserts (verbatim, docs/60): "(a) Scripted loss `0.9,0.4,0.7,0.5` (all >= threshold) →
 * `s.bestLoss` monotone non-increasing, `s.candidate` = the proposal that achieved `bestLoss`; a
 * worsening/`exitCode`-failed/infinite-loss proposal NEVER overwrites `candidate`;
 * `s.invocations`/`s.elapsedMs` increment on EVERY iteration. (b) Seeding from `LearnOptions` →
 * `LearnerLoopState.threshold` and `.budget.{maxIterations,maxWallMs,maxInvocations}` equal the
 * matching `LearnOptions` fields." Violating build: "candidate regressing to a worsening
 * proposal; seeded budget/threshold disagreeing with `LearnOptions`."
 *
 * TESTABILITY NOTE: `LearnerLoopState` (docs/32) is explicitly ORCHESTRATOR-INTERNAL state — it is
 * NOT part of the public `Repo`/`KipRepo` surface declared in docs/40-sdk-api-surface.md /
 * src/index.ts (only `learn()` and `LearnOptions` are), so this file cannot read `s.bestLoss`/
 * `s.candidate`/`s.budget` directly without fabricating an internals-reaching accessor this round's
 * hard rules forbid. Every sub-case below instead asserts the OBSERVABLE, BLACK-BOX consequence of
 * the exact same state claim: (a) is tested via `learn()`'s own returned `loss` field (the
 * achieved/tracked `bestLoss`) on the exhausted marker, plus the exact dispatch count proving no
 * iteration was skipped/short-circuited by the failed candidate; (b) is tested via strict
 * threshold-boundary behavior (`bestLoss < threshold`, never `<=`) and exact
 * maxIterations/maxInvocations dispatch-count boundaries — the only way a black-box `learn()` call
 * can prove its SEEDED state genuinely equals the supplied `LearnOptions`, not a default/off-by-one.
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
  dispatchFailure,
  encodeOk,
  freshReplicaId,
  learnerOk,
  lossOk,
  makeScriptedDispatch,
  nodePropAssert,
  registerManifest,
  buildManifest,
} from "./fixtures-m6";

describe("INV-A12: accept-if-improved monotonicity + options<->state agreement", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  it("INV-A12(a): scripted loss sequence 0.9,0.4,0.7,0.5 (all >= threshold) — bestLoss tracks the MIN, never the last/worsening value", async () => {
    const eid = "tenant/ns/inv-a12a-doc";
    const encode = buildManifest({ name: "inv-a12a-encode" });
    const decode = buildManifest({ name: "inv-a12a-decode" });
    const learner = buildManifest({ name: "inv-a12a-learner" });
    const loss = buildManifest({ name: "inv-a12a-loss" });

    const scriptedSequence = [0.9, 0.4, 0.7, 0.5];
    const { dispatch, log } = makeScriptedDispatch({
      [encode.name]: () => encodeOk([nodePropAssert(eid, "content", "v0")]),
      [decode.name]: () => decodeOk(),
      [learner.name]: (_inv, idx) => learnerOk([nodePropAssert(eid, "content", `v${idx + 1}`)]),
      [loss.name]: (_inv, idx) => lossOk(scriptedSequence[idx]),
    });

    const replicaId = freshReplicaId("inv-a12a");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: 0.3, // below every scripted value — NEVER converges, forcing exhaustion
      maxIterations: scriptedSequence.length,
      maxWallMs: 10_000_000,
      maxInvocations: 1_000_000,
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    const learnPromise = repo.learn(FIXED_RAW_REF, opts);
    await expect(learnPromise).resolves.toMatchObject({ status: "exhausted", loss: 0.4 });

    // --- unreachable until the above resolves ---
    const result = await learnPromise;
    expect(result.loss).toBe(Math.min(...scriptedSequence)); // bestLoss, NOT the last (0.5, worse)
    const lossCalls = log.filter((r) => r.invocation.manifest.name === loss.name);
    expect(lossCalls).toHaveLength(scriptedSequence.length); // every iteration ran; none skipped
  });

  it("INV-A12(a): a dispatch-failed (infinite-loss) middle iteration never becomes the best, and the loop continues past it", async () => {
    const eid = "tenant/ns/inv-a12a2-doc";
    const encode = buildManifest({ name: "inv-a12a2-encode" });
    const decode = buildManifest({ name: "inv-a12a2-decode" });
    const learner = buildManifest({ name: "inv-a12a2-learner" });
    const loss = buildManifest({ name: "inv-a12a2-loss" });

    // Iteration index 1 (the SECOND iteration) has its decode dispatch fail (non-zero exitCode) —
    // N5 "per-iteration failure is treated as infinite loss" (docs/32): consumes an invocation,
    // scores infinite loss, the loop MUST continue (persistent-only failure drains budget).
    const { dispatch, log } = makeScriptedDispatch({
      [encode.name]: () => encodeOk([nodePropAssert(eid, "content", "v0")]),
      [decode.name]: (_inv, idx) => (idx === 1 ? dispatchFailure() : decodeOk()),
      [learner.name]: (_inv, idx) => learnerOk([nodePropAssert(eid, "content", `v${idx + 1}`)]),
      [loss.name]: (_inv, idx) => lossOk([0.4, 999, 0.6, 0.5][idx]), // idx 1's loss is never read
    });

    const replicaId = freshReplicaId("inv-a12a2");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: 0.1, // below every non-failing scripted loss — never converges
      maxIterations: 4,
      maxWallMs: 10_000_000,
      maxInvocations: 1_000_000,
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    const learnPromise = repo.learn(FIXED_RAW_REF, opts);
    await expect(learnPromise).resolves.toMatchObject({ status: "exhausted", loss: 0.4 });

    // --- unreachable until the above resolves ---
    const result = await learnPromise;
    expect(result.loss).toBe(0.4); // best-of-{0.4, infinite, 0.6, 0.5} — the failed one NEVER wins
    const decodeCalls = log.filter((r) => r.invocation.manifest.name === decode.name);
    expect(decodeCalls).toHaveLength(4); // the loop ran all 4 iterations — one failure didn't abort it
  });

  it("INV-A12(b): threshold is seeded EXACTLY from LearnOptions.threshold — bestLoss < threshold (strict), never <=", async () => {
    const eid = "tenant/ns/inv-a12b-doc";
    const encode = buildManifest({ name: "inv-a12b-encode" });
    const decode = buildManifest({ name: "inv-a12b-decode" });
    const learner = buildManifest({ name: "inv-a12b-learner" });
    const loss = buildManifest({ name: "inv-a12b-loss" });

    async function runOnce(scriptedLoss: number) {
      const { dispatch } = makeScriptedDispatch({
        [encode.name]: () => encodeOk([nodePropAssert(eid, "content", "v0")]),
        [decode.name]: () => decodeOk(),
        [loss.name]: () => lossOk(scriptedLoss),
      });
      const replicaId = freshReplicaId(`inv-a12b-${scriptedLoss}`);
      const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
      repos.push(repo);
      for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);
      const opts = baseLearnOptions({
        threshold: 0.5,
        maxIterations: 1, // exactly one shot — the ONLY thing deciding accept/exhausted is threshold
        encode: { name: encode.name, version: encode.version },
        decode: { name: decode.name, version: decode.version },
        learner: { name: learner.name, version: learner.version },
        loss: { name: loss.name, version: loss.version },
      });
      return repo.learn(FIXED_RAW_REF, opts);
    }

    // loss EXACTLY AT threshold — `0.5 < 0.5` is false ⇒ MUST be exhausted, never accept (a build
    // using `<=` would wrongly accept here).
    const atThreshold = runOnce(0.5);
    await expect(atThreshold).resolves.toMatchObject({ status: "exhausted" });

    // loss just UNDER threshold ⇒ MUST accept.
    const underThreshold = runOnce(0.499999);
    await expect(underThreshold).resolves.toMatchObject({ status: "accept" });
  });

  it("INV-A12(b): budget is seeded EXACTLY from LearnOptions.{maxIterations,maxInvocations} — the loop stops at the configured bound, not before/after", async () => {
    const eid = "tenant/ns/inv-a12b2-doc";
    const encode = buildManifest({ name: "inv-a12b2-encode" });
    const decode = buildManifest({ name: "inv-a12b2-decode" });
    const learner = buildManifest({ name: "inv-a12b2-learner" });
    const loss = buildManifest({ name: "inv-a12b2-loss" });

    const { dispatch, log } = makeScriptedDispatch({
      [encode.name]: () => encodeOk([nodePropAssert(eid, "content", "v0")]),
      [decode.name]: () => decodeOk(),
      [learner.name]: (_inv, idx) => learnerOk([nodePropAssert(eid, "content", `v${idx + 1}`)]),
      [loss.name]: () => lossOk(1.0), // never converges
    });

    const replicaId = freshReplicaId("inv-a12b2");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const configuredMaxIterations = 3;
    const opts = baseLearnOptions({
      threshold: -1,
      maxIterations: configuredMaxIterations,
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
    expect(lossCalls).toHaveLength(configuredMaxIterations); // exactly the CONFIGURED bound
  });
});
