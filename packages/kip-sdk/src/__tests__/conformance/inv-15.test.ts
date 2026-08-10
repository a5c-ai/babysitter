/**
 * INV-15 — `causedBy` well-formedness (set-pure, M4-2).
 *
 * docs/60-conformance-and-testability.md#inv-15 (verbatim): "a fact whose any `causedBy` parent
 * resolved in `S` has author-HLC > the fact's own author-HLC is demoted `untrusted-malformed`; a
 * `causedBy` cycle is demoted-malformed; an unresolved (not-yet-in-`S`) `causedBy` parent leaves the
 * fact PENDING (not trusted), never silently trusted. The suite feeds (a) a forward `causedBy` edge,
 * (b) a `causedBy` cycle, (c) a dangling `causedBy`, and asserts each demotes/pends rather than
 * projecting trusted, on every replica identically."  docs/50 §8.1: "A forward (parent > child) or
 * cyclic `causedBy` edge demotes the fact `untrusted-malformed`."
 *
 * The signing key is AUTHORIZED (a KeyAuthorization chaining to a genesis root) so the ONLY reason a
 * fact under test can be demoted is its malformed `causedBy`; a well-formed control from the SAME key
 * stays trusted. A separate AUTHORIZED SEEDER supplies the node-existence fact, so a demoted prop is
 * observed against a PRESENT node (non-vacuous). NOTE the modeled KeyAuthorization carrier
 * (fixtures-m8.ts MODELING CONVENTIONS #2).
 *
 * EXPECTED TO FAIL NOW: `causedBy` is carried in the signed payload but read by no proj trust path,
 * so a forward/cyclic/dangling `causedBy` fact projects a TRUSTED value today. Failures are assertion
 * mismatches, never type/import errors.
 */
import { describe, expect, it } from "vitest";
import type { Fact } from "../../index";
import {
  freshFactId,
  hasTrustedValueHead,
  hlc,
  ingestAll,
  keyAuthFact,
  m8Repo,
  propFact,
  seederAuthFact,
  seederExistence,
} from "./fixtures-m8";

const rootFpr = "genesis-root-inv15";
const fpr = "authorized-key-inv15";
const eid = "person/inv15";

function preamble(): Fact[] {
  return [
    seederAuthFact(freshFactId("inv15-seeder-auth")),
    seederExistence(eid, "person", freshFactId("inv15-seeder-ex")),
    keyAuthFact(
      { keyFpr: fpr, namespaces: ["person"], ops: ["write"], authorizedBy: rootFpr, effectiveFrom: hlc(0) },
      { id: freshFactId("inv15-keyauth"), signerFpr: rootFpr, wall: 100 },
    ),
  ];
}

describe("INV-15: causedBy well-formedness (set-pure demotion)", () => {
  it("CONTROL: a well-formed (backward) causedBy edge from the authorized key projects TRUSTED", async () => {
    const repo = m8Repo("inv15-control");
    const parentId = "inv15-control-parent";
    const parent = propFact(eid, "parent", "p", { id: parentId, fpr, wall: 1000, replicaId: "chain-inv15-ctl", seq: 0 });
    // child author-HLC (2000) > parent author-HLC (1000): a valid backward edge.
    const child = propFact(eid, "child", "ok", { id: freshFactId("inv15-control-child"), fpr, wall: 2000, replicaId: "chain-inv15-ctl", seq: 1, causedBy: [parentId] });
    await ingestAll(repo, [...preamble(), parent, child]);
    expect(hasTrustedValueHead(await repo.getNode(eid), "child", "ok")).toBe(true);
    repo.close();
  });

  it("(a) FORWARD causedBy edge (parent author-HLC > child) is demoted untrusted-malformed — NOT a trusted value head", async () => {
    const repo = m8Repo("inv15-forward");
    const parentId = "inv15-forward-parent";
    // Chain order (seq): child at seq 0 (wall 2000), parent at seq 1 (wall 5000) — child's own chain is
    // author-HLC-monotone (no anti-backdating demotion), isolating the FORWARD causedBy as the sole defect.
    const child = propFact(eid, "child", "forward-loser", { id: freshFactId("inv15-forward-child"), fpr, wall: 2000, replicaId: "chain-inv15-fwd", seq: 0, causedBy: [parentId] });
    const parent = propFact(eid, "parent", "p", { id: parentId, fpr, wall: 5000, replicaId: "chain-inv15-fwd", seq: 1 });
    await ingestAll(repo, [...preamble(), child, parent]);
    expect(hasTrustedValueHead(await repo.getNode(eid), "child", "forward-loser")).toBe(false);
    repo.close();
  });

  it("(b) a causedBy CYCLE is demoted-malformed — neither fact in the cycle projects a trusted value head", async () => {
    const repo = m8Repo("inv15-cycle");
    const aId = "inv15-cycle-a";
    const bId = "inv15-cycle-b";
    // a → b and b → a: a cycle (each names the other as a causedBy parent).
    const a = propFact(eid, "a", "cycle-a", { id: aId, fpr, wall: 1000, replicaId: "chain-inv15-cyc", seq: 0, causedBy: [bId] });
    const b = propFact(eid, "b", "cycle-b", { id: bId, fpr, wall: 1001, replicaId: "chain-inv15-cyc", seq: 1, causedBy: [aId] });
    await ingestAll(repo, [...preamble(), a, b]);
    const node = await repo.getNode(eid);
    expect(hasTrustedValueHead(node, "a", "cycle-a")).toBe(false);
    expect(hasTrustedValueHead(node, "b", "cycle-b")).toBe(false);
    repo.close();
  });

  it("(c) a DANGLING causedBy (parent not yet in S) leaves the fact PENDING — not a trusted value head — until the parent arrives", async () => {
    const repo = m8Repo("inv15-dangling");
    // The named parent CID is never delivered: the child must project pending, not trusted.
    const child = propFact(eid, "child", "dangling", { id: freshFactId("inv15-dangling-child"), fpr, wall: 2000, replicaId: "chain-inv15-dan", seq: 0, causedBy: ["inv15-never-delivered-parent"] });
    await ingestAll(repo, [...preamble(), child]);
    expect(hasTrustedValueHead(await repo.getNode(eid), "child", "dangling")).toBe(false);
    repo.close();
  });
});
