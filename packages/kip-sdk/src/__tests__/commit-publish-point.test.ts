/**
 * commit-publish-point.test.ts — m-9: `KipRepo.commit(message?)`, the standalone PUBLISH POINT.
 *
 * Outside a `txn()`, the ordinary `assertFact` path ingests each fact durably (a substrate blob) but
 * returns `status:"pending"` and leaves the COMMIT tip un-advanced (ADR-012: no durable ack precedes
 * the commit). `commit()` is the operation that publishes that pending, durable state as a new
 * parent-chained git commit and advances the `CommitTipStore` tip, returning the commit's CID.
 *
 * The load-bearing behaviours under test:
 *  - PUBLISH: commit() returns a real content-addressed oid AND durably advances the tip to it.
 *  - CUMULATIVE SNAPSHOT: the tree is one blob per admitted content fact (assert/retract/supersede/
 *    re-attest), so schema facts and retracts are published too.
 *  - CHAIN: a later commit() parents onto the previous tip.
 *  - IDEMPOTENT no-op: committing again with nothing new returns the SAME CID and does not grow the
 *    chain.
 *  - SAME RECIPE AS txn(): a `txn()` commit followed by a `commit()` over the now-identical fact set is
 *    a no-op that returns the txn's own commit oid — proving both build the identical tree.
 *  - LOUD on empty: committing an empty repo throws `ERR_MALFORMED_INPUT` (N5 — no honest CID for an
 *    empty publish), never a silent success.
 *  - DURABLE across reopen: a fresh KipRepo against the same dir sees the published tip.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as git from "isomorphic-git";
import { afterEach, describe, expect, it } from "vitest";
import { KipError, KipRepo } from "../index";
import { CommitTipStore } from "../substrate";

function prov(author: string) {
  return { author, signature: "", publicKeyFingerprint: "", signedFields: [] };
}

async function assertNode(repo: KipRepo, replicaId: string, eid: string, nodeKind = "person"): Promise<void> {
  await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "node", eid, nodeKind },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId,
    provenance: prov("commit-test"),
  });
}

const dirs: string[] = [];
const repos: KipRepo[] = [];
function freshDir(label: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `kip-commit-${label}-`));
  dirs.push(dir);
  return dir;
}
function repo(dir: string, replicaId: string): KipRepo {
  const r = new KipRepo({ dir, replicaId });
  repos.push(r);
  return r;
}
afterEach(() => {
  for (const r of repos.splice(0)) r.close();
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe("m-9 commit() — publishes the pending durable state as a parent-chained commit", () => {
  it("returns a real content-addressed oid AND durably advances the CommitTipStore tip to it", async () => {
    const dir = freshDir("publish");
    const r = repo(dir, "commit-publish");
    await assertNode(r, "commit-publish", "commit-publish:node/a");

    const cid = await r.commit();
    expect(cid).toMatch(/^[0-9a-f]{40}$/);
    expect(new CommitTipStore(dir).load().tip).toBe(cid); // tip durably advanced
  });

  it("the published tree is the CUMULATIVE content-fact snapshot (one blob per fact — schema + retract included)", async () => {
    const dir = freshDir("snapshot");
    const r = repo(dir, "commit-snap");
    // 1 node existence assert + 1 schema fact (type:assert) + 1 retract = 3 content facts.
    await assertNode(r, "commit-snap", "commit-snap:node/a");
    await r.registerSchema({ kind: "person", version: 1, props: [{ name: "name", type: "string" }] });
    await r.retractFact({
      type: "retract",
      v: 1,
      target: { kind: "node", eid: "commit-snap:node/a", nodeKind: "person" },
      validFrom: 0,
      validTo: null,
      replicaId: "commit-snap",
      provenance: prov("commit-test"),
    });

    const cid = await r.commit();
    const { tree } = (await git.readCommit({ fs, dir, gitdir: path.join(dir, ".git"), oid: cid })).commit;
    const entries = (await git.readTree({ fs, dir, gitdir: path.join(dir, ".git"), oid: tree })).tree;
    expect(entries.length).toBe(3); // every admitted content fact is published, none dropped
    for (const e of entries) expect(e.path).toMatch(/^f-[0-9a-f]{40}\.json$/);
  });

  it("a later commit() parents onto the previous tip (a whole-history chain)", async () => {
    const dir = freshDir("chain");
    const r = repo(dir, "commit-chain");
    await assertNode(r, "commit-chain", "commit-chain:node/a");
    const first = await r.commit();

    await assertNode(r, "commit-chain", "commit-chain:node/b");
    const second = await r.commit();

    expect(second).not.toBe(first);
    const secondCommit = (await git.readCommit({ fs, dir, gitdir: path.join(dir, ".git"), oid: second })).commit;
    expect(secondCommit.parent).toEqual([first]);
  });
});

describe("m-9 commit() — idempotency, recipe-parity with txn(), and loud-on-empty", () => {
  it("is an IDEMPOTENT no-op when nothing changed: same CID, tip not advanced, no empty-delta commit", async () => {
    const dir = freshDir("idempotent");
    const r = repo(dir, "commit-idem");
    await assertNode(r, "commit-idem", "commit-idem:node/a");

    const first = await r.commit();
    const second = await r.commit(); // nothing new asserted
    expect(second).toBe(first);
    expect(new CommitTipStore(dir).load().tip).toBe(first); // tip unmoved
  });

  it("shares txn()'s tree recipe: a txn() commit followed by commit() over the same fact set is a no-op returning the txn's oid", async () => {
    const dir = freshDir("recipe");
    const r = repo(dir, "commit-recipe");
    const txnOut = await r.txn(async (tx) => {
      await tx.assertFact({
        type: "assert",
        v: 1,
        target: { kind: "node", eid: "commit-recipe:node/a", nodeKind: "person" },
        value: true,
        validFrom: 0,
        validTo: null,
        replicaId: "commit-recipe",
        provenance: prov("commit-test"),
      });
    });
    // commit() sees the identical cumulative content-fact set txn just published → identical tree → no-op.
    const cid = await r.commit();
    expect(cid).toBe(txnOut.commit);
  });

  it("throws ERR_MALFORMED_INPUT on an empty repo (no content facts) — never a silent success", async () => {
    const dir = freshDir("empty");
    const r = repo(dir, "commit-empty");
    await expect(r.commit()).rejects.toMatchObject({ code: "ERR_MALFORMED_INPUT" });
    expect(new CommitTipStore(dir).load().tip).toBeNull(); // nothing published
  });

  // Adversarial-critic G1: the shallow single-fact parity test can't surface sort/prior-set drift. This
  // exercises the REAL case — a MULTI-fact, mixed assert+retract txn onto an ALREADY-committed base — so
  // commit()'s cumulative-snapshot tree must byte-match txn()'s over the same fact set (no-op → txn oid).
  it("recipe parity holds for a MULTI-fact, mixed assert+retract txn onto an already-committed repo (G1)", async () => {
    const dir = freshDir("parity-multi");
    const r = repo(dir, "commit-parity");
    await assertNode(r, "commit-parity", "commit-parity:node/a");
    const base = await r.commit(); // non-empty prior committed state

    const txnOut = await r.txn(async (tx) => {
      await tx.assertFact({
        type: "assert",
        v: 1,
        target: { kind: "node", eid: "commit-parity:node/b", nodeKind: "person" },
        value: true,
        validFrom: 0,
        validTo: null,
        replicaId: "commit-parity",
        provenance: prov("commit-test"),
      });
      await tx.assertFact({
        type: "assert",
        v: 1,
        target: { kind: "node-prop", eid: "commit-parity:node/b", prop: "name" },
        value: "Tal",
        validFrom: 0,
        validTo: null,
        replicaId: "commit-parity",
        provenance: prov("commit-test"),
      });
      await tx.retractFact({
        type: "retract",
        v: 1,
        target: { kind: "node", eid: "commit-parity:node/a", nodeKind: "person" },
        validFrom: 0,
        validTo: null,
        replicaId: "commit-parity",
        provenance: prov("commit-test"),
      });
    });
    expect(txnOut.commit).not.toBe(base);
    // commit() over the now-identical cumulative content set (prior ∪ txn's 3 facts) is a no-op.
    expect(await r.commit()).toBe(txnOut.commit);
  });

  // Adversarial-critic M1: commit() must NOT run during an in-flight txn() — its staged (not-yet-durable)
  // writes are invisible to commit()'s currentFacts() snapshot, so publishing mid-txn would emit a stale
  // commit and clobber the txn's tip. It rejects with the same single-flight code txn() uses for re-entry.
  it("rejects with ERR_TXN_ALREADY_ACTIVE when called during an in-flight txn() (M1)", async () => {
    const dir = freshDir("mid-txn");
    const r = repo(dir, "commit-midtxn");
    await assertNode(r, "commit-midtxn", "commit-midtxn:node/pre"); // durable, pre-txn

    const txnOut = await r.txn(async (tx) => {
      await tx.assertFact({
        type: "assert",
        v: 1,
        target: { kind: "node", eid: "commit-midtxn:node/staged", nodeKind: "person" },
        value: true,
        validFrom: 0,
        validTo: null,
        replicaId: "commit-midtxn",
        provenance: prov("commit-test"),
      });
      // Mid-flight commit() must reject rather than publish {pre} and clobber the tip.
      await expect(r.commit()).rejects.toMatchObject({ code: "ERR_TXN_ALREADY_ACTIVE" });
      return "ok";
    });
    expect(txnOut.result).toBe("ok");
    // The txn still committed cleanly; its published tip includes the staged fact, and commit() now no-ops.
    expect(new CommitTipStore(dir).load().tip).toBe(txnOut.commit);
    expect(await r.commit()).toBe(txnOut.commit);
  });

  it("uses a caller-supplied message when given", async () => {
    const dir = freshDir("message");
    const r = repo(dir, "commit-msg");
    await assertNode(r, "commit-msg", "commit-msg:node/a");
    const cid = await r.commit("my custom publish message");
    const { message } = (await git.readCommit({ fs, dir, gitdir: path.join(dir, ".git"), oid: cid })).commit;
    expect(message).toContain("my custom publish message");
  });
});

describe("m-9 commit() — durability across reopen", () => {
  it("a fresh KipRepo against the same dir sees the published tip", async () => {
    const dir = freshDir("reopen");
    const r1 = repo(dir, "commit-reopen");
    await assertNode(r1, "commit-reopen", "commit-reopen:node/a");
    const cid = await r1.commit();
    r1.close();
    repos.splice(repos.indexOf(r1), 1);

    // A brand-new instance against the same directory reads the durably-persisted tip.
    expect(new CommitTipStore(dir).load().tip).toBe(cid);
    const r2 = repo(dir, "commit-reopen");
    // G4: a no-op commit() on the reopened instance reads the PERSISTED parent tree via readCommit and
    // returns the existing tip unchanged (nothing new to publish).
    expect(await r2.commit()).toBe(cid);
    // And it can chain a further commit onto that published tip.
    await assertNode(r2, "commit-reopen", "commit-reopen:node/b");
    const cid2 = await r2.commit();
    const c2 = (await git.readCommit({ fs, dir, gitdir: path.join(dir, ".git"), oid: cid2 })).commit;
    expect(c2.parent).toEqual([cid]);
  });
});
