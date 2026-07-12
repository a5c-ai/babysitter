/**
 * m6-round4-critic-fixes.test.ts — NON-FROZEN, additive coverage for round 4's fix closing the
 * PARTIAL-COMMIT HAZARD BUG CLASS (round 3 scored min=58, a regression from round 2's min=70,
 * because round 3's fix only narrowed `isAssertInputArray` to check FIELD PRESENCE, never the
 * WELL-FORMEDNESS of `item.target` itself — reopened immediately via `target: null`).
 *
 * Two independently-reproduced round-3 critic findings trace to this ONE root cause
 * ("`isAssertInputArray` never validates `item.target` is well-formed"):
 *
 *  - `target: null` / `target: undefined` passes `"target" in item"` (true even for a null/undefined
 *    VALUE) and crashed `ensureExistenceFor` with an uncaught `TypeError` reading `.kind` of
 *    null/undefined.
 *  - `target: { kind: "nonsense", eid: "x" }` passes the same shallow check, then correctly fails
 *    `assertFact`'s own `checkWellFormed`/`isWellFormedTarget` — but only AFTER earlier items in the
 *    SAME accepted batch may already be durably committed via `assertFact`, producing an escaping
 *    typed `KipError` with NO `kip:learn`/`kip:learn-exhausted` fact ever authored — a silent,
 *    unaudited partial write.
 *
 * Part (a) below proves BOTH shapes are now rejected at the SAME earlier gate
 * (`isAssertInputArray` calling well-formed.ts's own `isWellFormedTarget` directly), before either
 * item ever reaches the accept-commit loop — so NEITHER scenario can leave a partial commit, because
 * NEITHER scenario ever partially commits anything at all.
 *
 * Part (b) proves the independent, defense-in-depth backstop: even an UNFORESEEN accept-commit
 * failure (one part (a) does not, and cannot, anticipate) never leaves a silent orphaned commit — the
 * failure is caught, a `kip:learn-exhausted` marker naming the failure + every already-committed fact
 * id is durably authored, and a typed `KipError` (`ERR_LEARN_COMMIT_FAILED`) is thrown to the caller.
 *
 * Built purely against the public `KipRepo`/`learn()`/`getNode()`/`getLearnResult()` surface, per this
 * milestone's own house rule (`fixtures-m6.ts`), with one exception in part (b): a minimal subclass
 * overriding the public `assertFact` method is used to INJECT an unforeseen failure partway through
 * the accept-commit sequence — the only way to exercise a failure mode neither `isAssertInputArray`
 * nor `well-formed.ts` would ever reject on their own.
 */
import { afterEach, describe, expect, it } from "vitest";
import { KipError, KipRepo, type AssertInput } from "../index";
import {
  FIXED_AS_OF,
  baseLearnOptions,
  buildManifest,
  decodeOk,
  freshReplicaId,
  learnerOk,
  lossOk,
  makeScriptedDispatch,
  nodePropAssert,
  registerManifest,
} from "./conformance/fixtures-m6";

describe("M6 round-4 part (a): full target validation closes target:null AND target:{kind:nonsense} at the SAME earlier gate", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  it("a sole candidate with `target: null` never crashes learn(), and is never partially (or fully) committed", async () => {
    const eid = "tenant/ns/m6-r4-target-null";
    const encode = buildManifest({ name: "m6-r4a-encode" });
    const decode = buildManifest({ name: "m6-r4a-decode" });
    const learner = buildManifest({ name: "m6-r4a-learner" });
    const loss = buildManifest({ name: "m6-r4a-loss" });

    // The EXACT round-3 critic repro: a `node-prop` assert whose `target` is `null` — passes the old
    // shallow `"target" in item` check, and previously crashed `ensureExistenceFor` reading `.kind`
    // off `null`. Scripted with a LOW loss (well under threshold) so the OLD buggy code would have
    // raced straight to the accept-commit loop and crashed there.
    const malformed = { ...nodePropAssert(eid, "prop", "v0"), target: null } as unknown as AssertInput;

    const { dispatch } = makeScriptedDispatch({
      [encode.name]: () => ({ exitCode: 0, output: { candidateFacts: [malformed] }, elapsedMs: 0 }),
      [decode.name]: () => decodeOk(),
      [learner.name]: () => ({ exitCode: 0, output: { next: [] }, elapsedMs: 0 }),
      [loss.name]: () => lossOk(0.01), // would immediately converge if the malformed candidate were ever accepted
    });

    const replicaId = freshReplicaId("m6-r4-target-null");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: 0.5,
      maxIterations: 1, // encode's malformed candidate is scored infinite-loss; budget then exhausts
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    // MUST resolve gracefully — never reject with an uncaught TypeError reading `.kind` off `null`.
    const result = await repo.learn({ blob: "9".repeat(40) }, opts);
    expect(result.status).toBe("exhausted");
    expect(result.loss).toBe(Number.POSITIVE_INFINITY);
    expect(await repo.getNode(eid)).toBeNull();
    // Only the ONE ordinary kip:learn-exhausted marker was committed — no candidate fact, no
    // existence fact, snuck through despite the malformed batch (proves no partial commit, not just
    // that ONE specific eid stayed null).
    expect(result.facts.length).toBe(1);
  });

  it("a sole candidate with `target: undefined` is likewise rejected before ever reaching the accept-commit loop", async () => {
    const eid = "tenant/ns/m6-r4-target-undefined";
    const encode = buildManifest({ name: "m6-r4b-encode" });
    const decode = buildManifest({ name: "m6-r4b-decode" });
    const learner = buildManifest({ name: "m6-r4b-learner" });
    const loss = buildManifest({ name: "m6-r4b-loss" });

    const malformed = { ...nodePropAssert(eid, "prop", "v0") } as Record<string, unknown>;
    delete malformed.target; // `"target" in item` is false here too, but assert the `undefined`-value case explicitly
    (malformed as { target?: unknown }).target = undefined;

    const { dispatch } = makeScriptedDispatch({
      [encode.name]: () => ({ exitCode: 0, output: { candidateFacts: [malformed] }, elapsedMs: 0 }),
      [decode.name]: () => decodeOk(),
      [learner.name]: () => ({ exitCode: 0, output: { next: [] }, elapsedMs: 0 }),
      [loss.name]: () => lossOk(0.01),
    });

    const replicaId = freshReplicaId("m6-r4-target-undefined");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: 0.5,
      maxIterations: 1,
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    const result = await repo.learn({ blob: "10".padStart(40, "0") }, opts);
    expect(result.status).toBe("exhausted");
    expect(result.loss).toBe(Number.POSITIVE_INFINITY);
    expect(await repo.getNode(eid)).toBeNull();
    expect(result.facts.length).toBe(1);
  });

  it("a 2-item batch where item 0 is well-formed and item 1 carries `target: {kind: \"nonsense\"}` commits NEITHER item — not even the valid one", async () => {
    const eidGood = "tenant/ns/m6-r4-batch-good";
    const eidBad = "tenant/ns/m6-r4-batch-bad";
    const encode = buildManifest({ name: "m6-r4c-encode" });
    const decode = buildManifest({ name: "m6-r4c-decode" });
    const learner = buildManifest({ name: "m6-r4c-learner" });
    const loss = buildManifest({ name: "m6-r4c-loss" });

    const goodItem = nodePropAssert(eidGood, "prop", "v0");
    // The EXACT second round-3 critic repro: a well-formed-LOOKING item whose `target.kind` is not a
    // recognized `Target` discriminant. Round-3's shallow check only verified `"target" in item`, so
    // this sailed through; `assertFact`'s own `checkWellFormed`/`isWellFormedTarget` would correctly
    // reject it, but only AFTER `goodItem` (item 0) may already have committed — the mid-batch
    // partial-commit hazard this round closes at the EARLIER `isAssertInputArray` gate instead.
    const nonsenseItem = {
      ...nodePropAssert(eidBad, "prop", "v0"),
      target: { kind: "nonsense", eid: eidBad } as unknown as AssertInput["target"],
    };

    const { dispatch } = makeScriptedDispatch({
      [encode.name]: () => ({
        exitCode: 0,
        output: { candidateFacts: [goodItem, nonsenseItem] },
        elapsedMs: 0,
      }),
      [decode.name]: () => decodeOk(),
      [learner.name]: () => ({ exitCode: 0, output: { next: [] }, elapsedMs: 0 }),
      // A LOW scripted loss — well under threshold — so the OLD buggy code would have raced straight
      // to the accept-commit loop (committing `goodItem` first) before crashing/throwing on
      // `nonsenseItem`.
      [loss.name]: () => lossOk(0.01),
    });

    const replicaId = freshReplicaId("m6-r4-batch-nonsense");
    const repo = new KipRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);

    const opts = baseLearnOptions({
      threshold: 0.5,
      maxIterations: 1,
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    const result = await repo.learn({ blob: "11".padStart(40, "0") }, opts);
    expect(result.status).toBe("exhausted");
    expect(result.loss).toBe(Number.POSITIVE_INFINITY);
    // Neither item was committed — critically, NOT EVEN the well-formed `goodItem` (proving the whole
    // 2-item batch is rejected as ONE unit at the earlier gate, never partially accepted).
    expect(await repo.getNode(eidGood)).toBeNull();
    expect(await repo.getNode(eidBad)).toBeNull();
    expect(result.facts.length).toBe(1);
  });

  it("recovers to accept a later genuinely well-formed candidate after an earlier target:null iteration (never crashes, never partially commits the malformed one)", async () => {
    const eid = "tenant/ns/m6-r4-recover-target-null";
    const encode = buildManifest({ name: "m6-r4d-encode" });
    const decode = buildManifest({ name: "m6-r4d-decode" });
    const learner = buildManifest({ name: "m6-r4d-learner" });
    const loss = buildManifest({ name: "m6-r4d-loss" });

    const malformed = { ...nodePropAssert(eid, "prop", "encode-seed"), target: null } as unknown as AssertInput;

    const { dispatch } = makeScriptedDispatch({
      // Iteration 0 (encode): target:null — must NOT crash, must NOT become state.candidate.
      [encode.name]: () => ({ exitCode: 0, output: { candidateFacts: [malformed] }, elapsedMs: 0 }),
      [decode.name]: () => decodeOk(),
      // Iteration 1+ (learner): a genuinely well-formed candidate, reachable and acceptable despite
      // the prior iteration's malformed one.
      [learner.name]: () => learnerOk([nodePropAssert(eid, "prop", "learner-fixed")]),
      // A single low scripted loss, well under threshold. Under the OLD (round-3) shallow check,
      // `target: null` passes `isAssertInputArray` (every round-3-checked field IS present), so
      // iteration 0 reaches decode/loss FIRST, measures this loss, and — being below threshold —
      // immediately ACCEPTS the malformed candidate (crashing in the accept-commit loop) before
      // iteration 1's learner ever runs. Under the FIXED code, iteration 0's malformed candidate is
      // rejected at `isAssertInputArray` BEFORE decode/loss are ever dispatched, so this SAME scripted
      // loss value instead measures iteration 1's genuinely valid candidate — which converges cleanly.
      [loss.name]: () => lossOk(0.05),
    });

    const replicaId = freshReplicaId("m6-r4-recover");
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

    const result = await repo.learn({ blob: "12".padStart(40, "0") }, opts);
    expect(result.status).toBe("accept");
    expect(result.loss).toBe(0.05);
    const view = await repo.getNode(eid);
    expect(view?.props.prop?.segments.some((s) => s.kind === "value" && s.value === "learner-fixed")).toBe(true);
  });
});

describe("M6 round-4 part (b): defense-in-depth — an UNFORESEEN accept-commit failure never leaves a silent orphaned partial commit", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  /**
   * A minimal subclass injecting a failure into the PUBLIC `assertFact` seam on its Nth call — the
   * only way to exercise a commit-time failure mode that neither `isAssertInputArray` (part a) nor
   * `well-formed.ts`'s own `checkWellFormed` would ever reject on their own (both are already closed
   * by this round's fix), simulating the "some OTHER reason neither you nor 3 rounds of critics have
   * thought of yet" case part (b)'s doc comment names.
   */
  class FlakyOnNthAssertRepo extends KipRepo {
    private counting = false;
    private assertCallCount = 0;
    private failOnCall = 0;
    private failureMessage = "";

    /** Manifest registration (via `registerManifest`) also goes through `assertFact` (2 calls per
     *  manifest) — arming AFTER registration, right before the `learn()` call under test, means
     *  `failOnCall` counts only `learn()`'s OWN accept-commit `assertFact` calls, never the
     *  unrelated setup calls this test doesn't care about. */
    armFailure(failOnCall: number, failureMessage: string): void {
      this.counting = true;
      this.assertCallCount = 0;
      this.failOnCall = failOnCall;
      this.failureMessage = failureMessage;
    }

    override async assertFact(
      input: Parameters<KipRepo["assertFact"]>[0],
    ): ReturnType<KipRepo["assertFact"]> {
      if (this.counting) {
        this.assertCallCount += 1;
        if (this.assertCallCount === this.failOnCall) {
          throw new Error(this.failureMessage);
        }
      }
      return super.assertFact(input);
    }
  }

  it("catches an unforeseen assertFact failure mid-batch, authors a durable kip:learn-exhausted marker naming it, and throws a typed KipError (never a silent reject)", async () => {
    const eidFirst = "tenant/ns/m6-r4-flaky-first";
    const eidSecond = "tenant/ns/m6-r4-flaky-second";
    const encode = buildManifest({ name: "m6-r4e-encode" });
    const decode = buildManifest({ name: "m6-r4e-decode" });
    const learner = buildManifest({ name: "m6-r4e-learner" });
    const loss = buildManifest({ name: "m6-r4e-loss" });

    // Two well-formed candidates targeting DIFFERENT (fresh) eids, so the accept-commit loop mints
    // an existence fact + a prop fact for EACH — call 1 = existence(first), call 2 = prop(first),
    // call 3 = existence(second). Failing on call 3 simulates the failure landing on item 1, AFTER
    // item 0 has already committed in full.
    const first = nodePropAssert(eidFirst, "prop", "v0");
    const second = nodePropAssert(eidSecond, "prop", "v0");

    const { dispatch } = makeScriptedDispatch({
      [encode.name]: () => ({ exitCode: 0, output: { candidateFacts: [first, second] }, elapsedMs: 0 }),
      [decode.name]: () => decodeOk(),
      [learner.name]: () => ({ exitCode: 0, output: { next: [] }, elapsedMs: 0 }),
      [loss.name]: () => lossOk(0.01), // below threshold: converges immediately at iteration 0
    });

    const replicaId = freshReplicaId("m6-r4-flaky");
    const repo = new FlakyOnNthAssertRepo({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);
    // Arm the injected failure ONLY NOW — every assertFact call up to this point (manifest
    // registration) is irrelevant setup, never the target of this test.
    repo.armFailure(3, "simulated unforeseen commit-time failure (round-4 defense-in-depth test)");

    const rawRef = { blob: "13".padStart(40, "0") };
    const opts = baseLearnOptions({
      threshold: 0.5,
      maxIterations: 3,
      asOf: FIXED_AS_OF,
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    // Never a raw/untyped rejection — a typed KipError naming the failure.
    let thrown: unknown;
    try {
      await repo.learn(rawRef, opts);
      thrown = undefined;
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(KipError);
    const kipErr = thrown as InstanceType<typeof KipError>;
    expect(kipErr.code).toBe("ERR_LEARN_COMMIT_FAILED");
    expect(kipErr.message).toContain("simulated unforeseen commit-time failure");

    // Item 0 (existence + prop fact) already committed BEFORE the injected failure — it remains
    // ordinary substrate (never rolled back; no real txn() exists to do so), exactly as documented.
    expect(await repo.getNode(eidFirst)).not.toBeNull();
    // Item 1 never got its existence/prop fact — the failure landed before either could commit.
    expect(await repo.getNode(eidSecond)).toBeNull();

    // A kip:learn-exhausted marker WAS durably authored (never silent/unaudited, N5) BEFORE the
    // throw — `getLearnResult` only reads back the `kip:learn` (accept) cell, not the
    // `kip:learn-exhausted` one (see `inv-a5.test.ts`'s own documented gap: "there is no way to
    // directly retrieve/count the kip:learn-exhausted marker" via the public surface), so this is
    // verified via the thrown error's OWN typed `context` — populated from the SAME marker-authoring
    // call this method makes internally, naming the failure reason, the marker's real committed fact
    // id, and every fact id already committed before the failure.
    expect(kipErr.context?.reason).toContain("simulated unforeseen commit-time failure");
    expect(kipErr.context?.markerFactId).toBeTruthy();
    expect(kipErr.context?.markerFailureReason).toBeUndefined();
    const partiallyCommittedFactIds = kipErr.context?.partiallyCommittedFactIds as string[];
    expect(Array.isArray(partiallyCommittedFactIds)).toBe(true);
    expect(partiallyCommittedFactIds.length).toBeGreaterThan(0);
  });
});
