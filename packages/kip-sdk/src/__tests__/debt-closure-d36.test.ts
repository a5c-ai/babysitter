/**
 * debt-closure-d36.test.ts — ADDITIVE, FROZEN spec-driven TDD coverage for closing D-36, recorded
 * in `packages/kip-sdk/docs/DEBTS.md`:
 *
 * D-36 ("M6's residual partial-commit/atomicity gap — `isAssertInputArray` omits validation of
 * `AssertInput.v`, and the accept-commit sequence is not atomic"): `Repo.txn()`/`Tx` (index.ts, `Tx`
 * interface ~line 405, `KipRepo.txn()` stub ~line 1553-1558) are STILL an unimplemented throwing
 * stub (`throw new Error("unimplemented: txn")`) in this build. `learn()`'s accept-commit sequence
 * (index.ts ~3794-3936) therefore commits its accepted `AssertInput[]` ONE AT A TIME via ordinary
 * `assertFact` calls, never through a real transaction — a mid-batch failure leaves every
 * already-committed fact durably admitted, mitigated only by a defense-in-depth `try`/`catch` that
 * authors a `kip:learn-exhausted` marker naming the partial commit before re-throwing
 * `ERR_LEARN_COMMIT_FAILED`.
 *
 * EVERY test below is a RED-PHASE spec test: none of `Repo.txn()`'s real (non-throwing) behavior is
 * built yet, so most of these are EXPECTED TO FAIL on a rejected-promise-where-a-resolution-was-
 * expected (or similar) assertion — never on a type/syntax error. `Tx`/`KipRepo.txn()` are REAL,
 * already-declared exports/methods on `src/index.ts` (see `Repo.txn`, line ~1015, and the `Tx`
 * interface, line ~405) — nothing here is invented; only the METHOD BODY is still a stub.
 *
 * Test (5) below is the one EXPLICIT EXCEPTION named in this debt-closure pass's own instructions:
 * `m6-round4-critic-fixes.test.ts`'s frozen "part (b)" test (`FlakyOnNthAssertRepo`,
 * `partiallyCommittedFactIds.length` > 0) encodes the OLD, pre-D-36 expected behavior (partial
 * commits are tolerated, merely audited). That file is FROZEN and is not touched here. Test (5) is
 * this file's OWN equivalent case, asserting the NEW, POST-D-36 correct behavior instead: a
 * mid-batch accept-commit failure must leave ZERO facts committed (via a real `txn()`), not merely
 * an AUDITED partial commit. Once `Repo.txn()` is implemented and `learn()`'s accept-commit sequence
 * is refactored to use it, `m6-round4-critic-fixes.test.ts`'s part (b) test will need a follow-up
 * rewrite (out of scope for this authoring pass — that file is frozen and belongs to the
 * implementation agent to update once `txn()` exists).
 */
import { afterEach, describe, expect, it } from "vitest";
import { KipError, KipRepo, type AssertInput } from "../index";
import { assertNode, assertNodeProp } from "./conformance/fixtures-m5";
import {
  FIXED_AS_OF,
  baseLearnOptions,
  buildManifest,
  decodeOk,
  freshReplicaId,
  makeScriptedDispatch,
  nodePropAssert,
  registerManifest,
} from "./conformance/fixtures-m6";

/** A bare, minimal signed-provenance stub for facts authored directly by this test file (mirrors
 *  every other conformance fixture's convention — `mintFact` re-stamps `signature`/
 *  `publicKeyFingerprint`/`signedFields` regardless of what the caller supplies, so only `author`
 *  is meaningful here). */
function d36Provenance(author: string) {
  return { author, signature: "", publicKeyFingerprint: "", signedFields: [] };
}

describe("D-36 (1): a Tx callback that throws leaves ZERO facts durably admitted — txn() itself rejects, no partial commit", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  it("stages an assertFact + a retractFact inside the callback, then throws — both must be rolled back, never partially admitted", async () => {
    const replicaId = "d36-txn-abort";
    const repo = new KipRepo({ replicaId });
    repos.push(repo);

    // Pre-existing state, asserted OUTSIDE the txn under test — used to prove a staged retractFact
    // inside the aborted txn never actually truncates it.
    const existingEid = "d36-txn-abort:node/existing";
    await assertNode(repo, existingEid, "person", replicaId);
    await assertNodeProp(repo, existingEid, "note", "original", replicaId);

    const freshNodeEid = "d36-txn-abort:node/fresh";
    const freshEdgeEid = "d36-txn-abort:edge/fresh";
    let callbackRan = false;

    await expect(
      repo.txn(async (tx) => {
        callbackRan = true;
        // Zero-or-more assertFact/retractFact calls staged before the throw (per this debt's own
        // spec item (1)) — one assertFact for a brand-new node, one for a brand-new edge, and one
        // retractFact narrowing an ALREADY-DURABLE prop cell.
        await tx.assertFact({
          type: "assert",
          v: 1,
          target: { kind: "node", eid: freshNodeEid, nodeKind: "person" },
          value: true,
          validFrom: 0,
          validTo: null,
          replicaId,
          provenance: d36Provenance("d36-test"),
        });
        await tx.assertFact({
          type: "assert",
          v: 1,
          target: {
            kind: "edge",
            eid: freshEdgeEid,
            edgeKind: "derived_from",
            from: existingEid,
            to: freshNodeEid,
          },
          value: true,
          validFrom: 0,
          validTo: null,
          replicaId,
          provenance: d36Provenance("d36-test"),
        });
        await tx.retractFact({
          type: "retract",
          v: 1,
          target: { kind: "node-prop", eid: existingEid, prop: "note" },
          validFrom: 500,
          validTo: null,
          replicaId,
          provenance: d36Provenance("d36-test"),
        });
        throw new Error("d36 simulated mid-txn abort");
      }),
    ).rejects.toThrow("d36 simulated mid-txn abort");

    // The callback must have genuinely RUN (not merely had the outer txn() call reject before ever
    // invoking it) — otherwise "zero facts committed" would hold vacuously rather than proving a real
    // rollback. Currently FAILS: today's stub throws "unimplemented: txn" before `fn` is ever called.
    expect(callbackRan).toBe(true);

    // Neither staged assert ever became durably visible.
    expect(await repo.getNode(freshNodeEid)).toBeNull();
    expect(await repo.getEdge(freshEdgeEid)).toBeNull();

    // The staged retraction never took effect either — the pre-existing prop cell must still show
    // its ORIGINAL, un-truncated segment (validTo still null, value still "original").
    const existingView = await repo.getNode(existingEid);
    expect(existingView).not.toBeNull();
    const noteSegments = existingView?.props.note?.segments ?? [];
    expect(
      noteSegments.some((s) => s.kind === "value" && s.value === "original" && s.validTo === null),
    ).toBe(true);
  });
});

describe("D-36 (2): a Tx callback that resolves successfully commits ALL of its staged facts durably", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  it("a two-write txn (a node existence assert + a node-prop assert) commits both, and returns the callback's own result", async () => {
    const replicaId = "d36-txn-commit";
    const repo = new KipRepo({ replicaId });
    repos.push(repo);
    const nodeEid = "d36-txn-commit:node/a";

    const outcome = await repo.txn(async (tx) => {
      await tx.assertFact({
        type: "assert",
        v: 1,
        target: { kind: "node", eid: nodeEid, nodeKind: "person" },
        value: true,
        validFrom: 0,
        validTo: null,
        replicaId,
        provenance: d36Provenance("d36-test"),
      });
      await tx.assertFact({
        type: "assert",
        v: 1,
        target: { kind: "node-prop", eid: nodeEid, prop: "name" },
        value: "Tal",
        validFrom: 0,
        validTo: null,
        replicaId,
        provenance: d36Provenance("d36-test"),
      });
      return "committed-by-caller-callback";
    });

    // The callback's own return value is threaded back out as `result`.
    expect(outcome.result).toBe("committed-by-caller-callback");

    // Both staged facts are durably visible after `txn()` resolves.
    const view = await repo.getNode(nodeEid);
    expect(view).not.toBeNull();
    expect(view?.kind).toBe("person");
    expect(
      view?.props.name?.segments.some((s) => s.kind === "value" && s.value === "Tal"),
    ).toBe(true);
  });
});

describe("D-36 (3): txn()'s returned commit is a real content-addressed oid, not merely an implementation placeholder", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  it("the resolved { commit } matches this repo's configured hashAlgo's hex-digest shape (sha1 default: 40 lowercase hex chars)", async () => {
    // Default hashAlgo (no override passed to the constructor) is "sha1" (index.ts's own
    // `this.hashAlgo = options?.hashAlgo ?? "sha1"`), which mints 40-lowercase-hex-char digests
    // everywhere else this module computes one (`computeFactSetDigest` via `createHash("sha1")
    // .digest("hex")`) — the loosest genuinely spec-shaped assertion available without asserting on
    // txn()'s own not-yet-built internal mechanism (a real git commit object vs. some other
    // content-addressed commit-DAG representation).
    const replicaId = "d36-txn-oid";
    const repo = new KipRepo({ replicaId });
    repos.push(repo);
    const nodeEid = "d36-txn-oid:node/a";

    const outcome = await repo.txn(async (tx) => {
      await tx.assertFact({
        type: "assert",
        v: 1,
        target: { kind: "node", eid: nodeEid, nodeKind: "person" },
        value: true,
        validFrom: 0,
        validTo: null,
        replicaId,
        provenance: d36Provenance("d36-test"),
      });
    });

    expect(typeof outcome.commit).toBe("string");
    expect(outcome.commit.length).toBeGreaterThan(0);
    expect(outcome.commit).toMatch(/^[0-9a-f]{40}$/);
  });

  it("two DIFFERENT txn() calls (committing different facts) return DIFFERENT commit oids — the oid is a real per-commit identity, not a constant placeholder", async () => {
    const replicaId = "d36-txn-oid-distinct";
    const repo = new KipRepo({ replicaId });
    repos.push(repo);

    const first = await repo.txn(async (tx) => {
      await tx.assertFact({
        type: "assert",
        v: 1,
        target: { kind: "node", eid: "d36-txn-oid-distinct:node/first", nodeKind: "person" },
        value: true,
        validFrom: 0,
        validTo: null,
        replicaId,
        provenance: d36Provenance("d36-test"),
      });
    });
    const second = await repo.txn(async (tx) => {
      await tx.assertFact({
        type: "assert",
        v: 1,
        target: { kind: "node", eid: "d36-txn-oid-distinct:node/second", nodeKind: "person" },
        value: true,
        validFrom: 0,
        validTo: null,
        replicaId,
        provenance: d36Provenance("d36-test"),
      });
    });

    expect(first.commit).not.toBe(second.commit);
  });
});

describe("D-36 (4): learn()'s accept path dedups existence facts for two accepted candidates targeting the SAME fresh eid within one batch", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  it("a batch of two node-prop candidates on the SAME fresh eid mints exactly ONE existence fact for that eid (not two)", async () => {
    const eid = "tenant/ns/d36-dedup-same-eid";
    const encode = buildManifest({ name: "d36-dedup-encode" });
    const decode = buildManifest({ name: "d36-dedup-decode" });
    const learner = buildManifest({ name: "d36-dedup-learner" });
    const loss = buildManifest({ name: "d36-dedup-loss" });

    const candidateA = nodePropAssert(eid, "propA", "v-a");
    const candidateB = nodePropAssert(eid, "propB", "v-b");

    const { dispatch } = makeScriptedDispatch({
      [encode.name]: () => ({
        exitCode: 0,
        output: { candidateFacts: [candidateA, candidateB] },
        elapsedMs: 0,
      }),
      [decode.name]: () => decodeOk(),
      [learner.name]: () => ({ exitCode: 0, output: { next: [] }, elapsedMs: 0 }),
      [loss.name]: () => ({ exitCode: 0, output: 0.01, elapsedMs: 0 }), // below threshold: accepts iteration 0
    });

    const replicaId = freshReplicaId("d36-dedup-same-eid");
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

    const result = await repo.learn({ blob: "d1".padStart(40, "0") }, opts);
    expect(result.status).toBe("accept");

    const view = await repo.getNode(eid);
    expect(view).not.toBeNull();
    expect(view?.props.propA?.segments.some((s) => s.kind === "value" && s.value === "v-a")).toBe(true);
    expect(view?.props.propB?.segments.some((s) => s.kind === "value" && s.value === "v-b")).toBe(true);

    // Exactly 4 facts committed for this accepted batch: ONE existence fact (shared by both
    // candidates, since they target the SAME eid) + the two accepted prop facts + the ONE kip:learn
    // audit fact. If the existence fact were minted twice (once per candidate, un-deduped), this
    // would be 5 instead. This is the dedup-within-a-single-batch/txn property this debt's item (4)
    // requires.
    expect(result.facts.length).toBe(4);
  });
});

describe("D-36 (5): learn()'s defense-in-depth failure path commits ZERO facts on a mid-batch accept-commit failure (replaces the OLD partiallyCommittedFactIds>0 expectation)", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  /**
   * A minimal subclass injecting a failure into the PUBLIC `assertFact` seam on its Nth call — the
   * SAME technique `m6-round4-critic-fixes.test.ts`'s frozen `FlakyOnNthAssertRepo` uses (that file
   * is FROZEN and not modified here; this is this file's own, independent copy of the same pattern).
   */
  class FlakyOnNthAssertRepoD36 extends KipRepo {
    private counting = false;
    private assertCallCount = 0;
    private failOnCall = 0;
    private failureMessage = "";

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

  it("an unforeseen assertFact failure on item 1 (AFTER item 0 already committed under the OLD un-transacted loop) must, post-D-36, leave ZERO facts committed — not just item 1's", async () => {
    const eidFirst = "tenant/ns/d36-flaky-first";
    const eidSecond = "tenant/ns/d36-flaky-second";
    const encode = buildManifest({ name: "d36-flaky-encode" });
    const decode = buildManifest({ name: "d36-flaky-decode" });
    const learner = buildManifest({ name: "d36-flaky-learner" });
    const loss = buildManifest({ name: "d36-flaky-loss" });

    // Two well-formed candidates targeting DIFFERENT fresh eids — call 1 = existence(first),
    // call 2 = prop(first), call 3 = existence(second). Arming the failure on call 3 simulates the
    // failure landing on item 1, strictly AFTER item 0 has already fully committed under the OLD
    // (un-transacted, one-assertFact-call-at-a-time) accept-commit loop.
    const first = nodePropAssert(eidFirst, "prop", "v0");
    const second = nodePropAssert(eidSecond, "prop", "v0");

    const { dispatch } = makeScriptedDispatch({
      [encode.name]: () => ({ exitCode: 0, output: { candidateFacts: [first, second] }, elapsedMs: 0 }),
      [decode.name]: () => decodeOk(),
      [learner.name]: () => ({ exitCode: 0, output: { next: [] }, elapsedMs: 0 }),
      [loss.name]: () => ({ exitCode: 0, output: 0.01, elapsedMs: 0 }), // below threshold: converges at iteration 0
    });

    const replicaId = freshReplicaId("d36-flaky");
    const repo = new FlakyOnNthAssertRepoD36({ replicaId, dispatchMicroagent: dispatch });
    repos.push(repo);
    for (const m of [encode, decode, learner, loss]) await registerManifest(repo, m);
    repo.armFailure(3, "simulated unforeseen commit-time failure (D-36 zero-partial-commit test)");

    const rawRef = { blob: "d5".padStart(40, "0") };
    const opts = baseLearnOptions({
      threshold: 0.5,
      maxIterations: 3,
      asOf: FIXED_AS_OF,
      encode: { name: encode.name, version: encode.version },
      decode: { name: decode.name, version: decode.version },
      learner: { name: learner.name, version: learner.version },
      loss: { name: loss.name, version: loss.version },
    });

    let thrown: unknown;
    try {
      await repo.learn(rawRef, opts);
    } catch (e) {
      thrown = e;
    }
    // Still never a silent/untyped rejection — a typed KipError naming the failure (this part of the
    // OLD behavior is preserved, not replaced).
    expect(thrown).toBeInstanceOf(KipError);
    const kipErr = thrown as InstanceType<typeof KipError>;
    expect(kipErr.code).toBe("ERR_LEARN_COMMIT_FAILED");
    expect(kipErr.message).toContain("simulated unforeseen commit-time failure");

    // NEW, POST-D-36 expectation (replacing the OLD `partiallyCommittedFactIds.length > 0`
    // expectation `m6-round4-critic-fixes.test.ts`'s frozen part (b) test encodes): with a real
    // `txn()` wrapping the whole accept-commit sequence, item 0's existence+prop facts must NEVER
    // become durably visible either — the entire batch is one atomic unit. Currently FAILS: today's
    // un-transacted loop has ALREADY committed item 0's existence+prop facts (2 assertFact calls)
    // before the injected failure on call 3, so `getNode(eidFirst)` is non-null today.
    expect(await repo.getNode(eidFirst)).toBeNull();
    expect(await repo.getNode(eidSecond)).toBeNull();

    // A kip:learn-exhausted marker must still be durably authored (never silent/unaudited, N5) even
    // though NOTHING from the failed batch itself was committed — verified via the thrown error's own
    // typed `context`, mirroring `m6-round4-critic-fixes.test.ts`'s own verification technique
    // (`getLearnResult` cannot read back a `kip:learn-exhausted` marker directly — see that file's own
    // comment on this gap).
    expect(kipErr.context?.reason).toContain("simulated unforeseen commit-time failure");
    expect(kipErr.context?.markerFactId).toBeTruthy();

    // NEW, POST-D-36 expectation: the partially-committed fact id list itself must be EMPTY — there
    // is no partial commit left to name, because the whole batch rolled back atomically. Currently
    // FAILS: today's list contains item 0's already-committed fact ids.
    const partiallyCommittedFactIds = kipErr.context?.partiallyCommittedFactIds as string[];
    expect(Array.isArray(partiallyCommittedFactIds)).toBe(true);
    expect(partiallyCommittedFactIds.length).toBe(0);
  });
});

describe("D-36 (6): a nested txn() call from inside an already-active txn's callback is rejected with a clear typed error", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  it("calling `this.txn()` again from inside an outer txn's own callback rejects (from the inner call) rather than silently nesting or corrupting the outer transaction", async () => {
    const replicaId = "d36-txn-nested";
    const repo = new KipRepo({ replicaId });
    repos.push(repo);

    let innerError: unknown;
    let innerRan = false;

    await expect(
      repo.txn(async (tx) => {
        await tx.assertFact({
          type: "assert",
          v: 1,
          target: { kind: "node", eid: "d36-txn-nested:outer-node", nodeKind: "person" },
          value: true,
          validFrom: 0,
          validTo: null,
          replicaId,
          provenance: d36Provenance("d36-test"),
        });
        try {
          innerRan = true;
          await repo.txn(async (innerTx) => {
            await innerTx.assertFact({
              type: "assert",
              v: 1,
              target: { kind: "node", eid: "d36-txn-nested:inner-node", nodeKind: "person" },
              value: true,
              validFrom: 0,
              validTo: null,
              replicaId,
              provenance: d36Provenance("d36-test"),
            });
          });
        } catch (e) {
          innerError = e;
          throw e; // propagate so the outer txn() call itself also rejects/aborts
        }
      }),
    ).rejects.toBeDefined();

    // The nested call must genuinely have been ATTEMPTED (not merely unreachable because the OUTER
    // txn() call itself already rejected before ever invoking its callback, which would make the
    // assertions below hold vacuously). Currently FAILS: today's stub throws
    // "unimplemented: txn" before ever calling the outer callback.
    expect(innerRan).toBe(true);

    // A clear, TYPED error — never a generic/untyped exception a caller could mistake for something
    // else — naming the nested-transaction condition specifically (not e.g. a KipErrorCode meant for
    // an unrelated concern).
    expect(innerError).toBeInstanceOf(KipError);
    const innerKipErr = innerError as InstanceType<typeof KipError>;
    expect(innerKipErr.code).toMatch(/NESTED_TXN|TXN_NESTED|TXN_ALREADY_ACTIVE/i);
    expect(innerKipErr.message).toMatch(/nest|already.*(active|open|progress)/i);

    // Neither the outer nor the inner write ever became durably visible — the outer txn aborted
    // (because the inner attempt's rejection propagated), and a real txn() must roll its OWN staged
    // writes back on abort exactly as test (1) above requires.
    expect(await repo.getNode("d36-txn-nested:outer-node")).toBeNull();
    expect(await repo.getNode("d36-txn-nested:inner-node")).toBeNull();
  });
});

describe("D-36 (7): existing single-fact assertFact/retractFact callers are unaffected by txn()'s existence — basic regression sanity check", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  it("a direct repo.assertFact call (never going through txn()) still commits exactly as before", async () => {
    const replicaId = "d36-regression-direct-assert";
    const repo = new KipRepo({ replicaId });
    repos.push(repo);
    const eid = "d36-regression-direct-assert:node/a";

    await assertNode(repo, eid, "person", replicaId);
    const view = await repo.getNode(eid);
    expect(view).not.toBeNull();
    expect(view?.kind).toBe("person");
  });

  it("a direct repo.retractFact call (never going through txn()) still narrows the targeted prop cell exactly as before", async () => {
    const replicaId = "d36-regression-direct-retract";
    const repo = new KipRepo({ replicaId });
    repos.push(repo);
    const eid = "d36-regression-direct-retract:node/a";

    await assertNode(repo, eid, "person", replicaId);
    await assertNodeProp(repo, eid, "note", "before-retract", replicaId);

    const beforeView = await repo.getNode(eid);
    expect(
      beforeView?.props.note?.segments.some(
        (s) => s.kind === "value" && s.value === "before-retract" && s.validTo === null,
      ),
    ).toBe(true);

    await repo.retractFact({
      type: "retract",
      v: 1,
      target: { kind: "node-prop", eid, prop: "note" },
      validFrom: 500,
      validTo: null,
      replicaId,
      provenance: d36Provenance("d36-test"),
    });

    const afterView = await repo.getNode(eid);
    const noteSegments = afterView?.props.note?.segments ?? [];
    // The retraction must have narrowed the ORIGINAL segment's validTo (it can no longer read as an
    // open-ended "value" segment with validTo:null all the way through) — a plain regression sanity
    // check unrelated to txn()'s own (still-unbuilt) behavior.
    expect(
      noteSegments.some((s) => s.kind === "value" && s.value === "before-retract" && s.validTo === null),
    ).toBe(false);
  });

  const asAssertInputCheck: AssertInput | undefined = undefined;
  void asAssertInputCheck; // referenced only to keep the `AssertInput` type import genuinely used
});
