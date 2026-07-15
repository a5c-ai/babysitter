/**
 * M2-surface — method-acceptance suite for the bitemporal write/read surface (work item
 * `M2-surface`): `supersedeFact`, `reAttestFact`, `tombstone`, and `asOf(): ReadView`.
 *
 * SOURCE OF TRUTH: docs/40-sdk-api-surface.md (the `Repo` method signatures, the authoring-input
 * shapes, and the per-method throws/returns table), docs/23-temporality-and-bitemporality.md
 * (§1 the fact envelope; §2.1 the two read lenses; §5 tombstone-as-logical-forget, mechanism #2),
 * and docs/25-context-enablement-seams.md (the `asOf` / as-of-read seam). These are the ONLY
 * source of truth; assertions below are derived strictly from the documented method CONTRACTS,
 * never from the private method bodies (index.ts is read only to import against the real public
 * surface, for type-correctness).
 *
 * EXPECTED-FAIL CONVENTION (identical to every M0/M1/M2 conformance file in
 * ./conformance): `supersedeFact`/`reAttestFact`/`tombstone` are currently throwing
 * `unimplemented` stubs (index.ts) — the tests that drive them are EXPECTED TO FAIL right now, and
 * the failure surfaces as the thrown `unimplemented` error propagating through the `await`, NOT as
 * an import/type/compile error (the file type-checks and the imported symbols all exist on the
 * public surface). They pass once M2-surface lands. `asOf()` IS implemented in the current tree
 * (getNode/getEdge/query), so the `asOf`-surface tests exercise its real behavior.
 *
 * Non-overlap with the frozen conformance files: the INV-4/INV-11/INV-14a conformance files
 * (./conformance/inv-4*.test.ts etc.) assert the bitemporal INVARIANTS over the projected segment
 * geometry; THIS file asserts the METHOD-LEVEL contracts of the four surface entry points (return
 * shapes, the curried `ReadView` seam, logical-tombstone semantics) — no assertion here duplicates
 * one there.
 */
import { describe, expect, it } from "vitest";
import type {
  Fact,
  Provenance,
  ReAttestInput,
  ReadView,
  SupersedeInput,
} from "../index";
import { KipRepo } from "../index";
import { CANONICAL_SIGNED_FIELDS, makeWellFormedFact } from "./conformance/fixtures";

/** A placeholder-signed `Provenance` matching the fixtures' well-formed baseline (fixtures.ts). */
function provenance(seed: string): Provenance {
  return {
    author: "test-actor",
    signature: `sig:${seed}`,
    publicKeyFingerprint: "known-fpr-1",
    signedFields: [...CANONICAL_SIGNED_FIELDS],
  };
}

describe("M2-surface: supersedeFact — supersession recorded as a set-pure fact (docs/40 authoring inputs; docs/23 §1)", () => {
  it("supersedeFact(input) echoes the kip-stamped envelope fields (id/hlc/seq) and a pending|durable status — the author supplies ONLY the intent fields; kip stamps id/hlc/seq (docs/40 authoring inputs + Repo.supersedeFact)", async () => {
    const replicaId = "replica-m2-supersede";
    const repo = new KipRepo({ replicaId });

    const input: SupersedeInput = {
      v: 1,
      type: "supersede",
      target: { kind: "node-prop", eid: "person/m2-supersede", prop: "status" },
      value: "v2",
      validFrom: 0,
      validTo: null,
      supersedes: ["cid-superseded-input-1"], // the input-CID set the supersede keys on (docs/23 §1)
      replicaId,
      provenance: provenance("m2-supersede"),
    };

    const result = await repo.supersedeFact(input);

    expect(typeof result.id).toBe("string");
    expect(result.id.length).toBeGreaterThan(0);
    expect(typeof result.seq).toBe("number");
    expect(typeof result.hlc.wall).toBe("number");
    expect(typeof result.hlc.counter).toBe("number");
    expect(["pending", "durable"]).toContain(result.status);
  });

  it("supersede is authored as a NEW fact (accretion-only), never an in-place update — the returned FactId is a distinct content address, not one of the superseded inputCids (docs/23 §1 'Accretion-only'; docs/40 'facts are the ONLY writable thing')", async () => {
    const replicaId = "replica-m2-supersede-accretion";
    const repo = new KipRepo({ replicaId });

    const supersededCid = "cid-superseded-input-accretion";
    const input: SupersedeInput = {
      v: 1,
      type: "supersede",
      target: { kind: "node-prop", eid: "person/m2-supersede-accretion", prop: "status" },
      value: "v2",
      validFrom: 0,
      validTo: null,
      supersedes: [supersededCid],
      replicaId,
      provenance: provenance("m2-supersede-accretion"),
    };

    const result = await repo.supersedeFact(input);
    expect(result.id).not.toBe(supersededCid);
  });
});

describe("M2-surface: reAttestFact — honest content re-asserted under a trusted key (docs/40; docs/23 §1)", () => {
  it("reAttestFact(input) naming the demoted fact via reAttests echoes the kip-stamped envelope (id/hlc/seq) + pending|durable status — a trusted-key re-assertion recorded as a `re-attest` fact (docs/23 §1; docs/60 INV-17 re-attest restoration)", async () => {
    const replicaId = "replica-m2-reattest";
    const repo = new KipRepo({ replicaId });

    const demotedFactId = "cid-kip-revoked-concurrent-casualty";
    const input: ReAttestInput = {
      v: 1,
      type: "re-attest",
      target: { kind: "node-prop", eid: "person/m2-reattest", prop: "status" },
      value: "honest-content",
      validFrom: 0,
      validTo: null,
      reAttests: demotedFactId, // the kip:revoked-concurrent fact whose content this re-asserts (docs/23 §1)
      replicaId,
      provenance: provenance("m2-reattest"),
    };

    const result = await repo.reAttestFact(input);

    expect(typeof result.id).toBe("string");
    expect(result.id.length).toBeGreaterThan(0);
    expect(typeof result.seq).toBe("number");
    expect(typeof result.hlc.wall).toBe("number");
    expect(["pending", "durable"]).toContain(result.status);
    // Accretion-only: the re-attest is a NEW fact, distinct from the demoted fact it re-asserts.
    expect(result.id).not.toBe(demotedFactId);
  });
});

describe("M2-surface: tombstone — logical, signature-preserving forgetting (docs/23 §5 mechanism #2; docs/40)", () => {
  it("tombstone(eid, reason) returns a FactId — a signed tombstone fact (the append-only default for 'forgetting') that removes the entity from default reads (docs/23 §5)", async () => {
    const replicaId = "replica-m2-tombstone";
    const repo = new KipRepo({ replicaId });

    const factId = await repo.tombstone("person/m2-tombstone", "gdpr-erasure-request");

    expect(typeof factId).toBe("string");
    expect(factId.length).toBeGreaterThan(0);
  });

  it("history BEFORE the tombstone stays as-of-queryable — a tombstone closes/splits valid-time and drops the entity from default reads, but the pre-tombstone state is still readable via asOf({validTime}) (docs/23 §5: 'History before the tombstone is still as-of-queryable')", async () => {
    const replicaId = "replica-m2-tombstone-history";
    const eid = "person/m2-tombstone-history";
    const repo = new KipRepo({ replicaId });

    const existence = makeWellFormedFact({
      replicaId,
      target: { kind: "node", eid, nodeKind: "person" },
      id: "m2-tombstone-history-existence",
    });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const prop = makeWellFormedFact({
      replicaId,
      target: { kind: "node-prop", eid, prop: "status" },
      id: "m2-tombstone-history-status",
    });
    prop.value = "active";
    prop.validFrom = 0;
    prop.validTo = null;

    await repo.ingest(existence);
    await repo.ingest(prop);

    // The M2-surface deliverable under test: tombstone the entity (currently throws `unimplemented`).
    await repo.tombstone(eid, "forget-by-default");

    // After the tombstone lands, the DEFAULT (live) read drops the entity...
    const liveView = await repo.getNode(eid);
    expect(liveView).toBeNull();

    // ...but a historical asOf({validTime}) BEFORE the tombstone still reconstructs the value
    // (signature-preserving logical forget keeps the original fact + its bytes).
    const historical = await (await repo.asOf({ validTime: 0 })).getNode(eid);
    expect(historical?.props.status.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "active" })]),
    );
  });
});

describe("M2-surface: asOf(): ReadView — the curried bitemporal read lens (docs/40 ReadView; docs/23 §2.1/§3; docs/25 as-of-read seam)", () => {
  async function seedNode(repo: KipRepo, eid: string, value: string, idSeed: string): Promise<void> {
    const existence = makeWellFormedFact({
      target: { kind: "node", eid, nodeKind: "person" },
      id: `${idSeed}-existence`,
    });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const prop = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "status" },
      id: `${idSeed}-status`,
    });
    prop.value = value;
    prop.validFrom = 0;
    prop.validTo = null;

    await repo.ingest(existence);
    await repo.ingest(prop);
  }

  it("asOf(asOf) returns a curried ReadView exposing the full read sub-surface getNode/getEdge/query/recall (docs/40 ReadView)", async () => {
    const repo = new KipRepo({ replicaId: "replica-m2-asof-shape" });
    await seedNode(repo, "person/m2-asof-shape", "active", "m2-asof-shape");

    const view: ReadView = await repo.asOf({ validTime: 0 });
    expect(typeof view.getNode).toBe("function");
    expect(typeof view.getEdge).toBe("function");
    expect(typeof view.query).toBe("function");
    expect(typeof view.recall).toBe("function");
  });

  it("the returned ReadView is curried at a FIXED asOf — one view answers getNode for MULTIPLE distinct entities consistently (docs/40: 'The Repo read sub-surface curried at a FIXED AsOf')", async () => {
    const repo = new KipRepo({ replicaId: "replica-m2-asof-curried" });
    await seedNode(repo, "person/m2-asof-curried-a", "alpha", "m2-asof-curried-a");
    await seedNode(repo, "person/m2-asof-curried-b", "beta", "m2-asof-curried-b");

    const view = await repo.asOf({ validTime: 0 });
    const a = await view.getNode("person/m2-asof-curried-a");
    const b = await view.getNode("person/m2-asof-curried-b");

    expect(a?.props.status.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "alpha" })]),
    );
    expect(b?.props.status.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "beta" })]),
    );
  });

  it("asOf({}) with no validTime denotes 'now' — the full, unfiltered segment geometry (docs/40 design note: 'default is now (current local frontier)')", async () => {
    const eid = "person/m2-asof-default";
    const repo = new KipRepo({ replicaId: "replica-m2-asof-default" });
    await seedNode(repo, eid, "active", "m2-asof-default");

    const node = await (await repo.asOf({})).getNode(eid);
    expect(node?.props.status.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "value", value: "active" })]),
    );
  });

  it("ReadView.query(spec) is an as-of-fixed async-iterable traversal seam (docs/40 ReadView.query: Omit<TraversalSpec,'asOf'>)", async () => {
    const eid = "person/m2-asof-query";
    const repo = new KipRepo({ replicaId: "replica-m2-asof-query" });
    await seedNode(repo, eid, "active", "m2-asof-query");

    const view = await repo.asOf({ validTime: 0 });
    const iterable = view.query({ seed: eid, direction: "out", depth: 1, maxFanout: 8 });
    expect(typeof (iterable as AsyncIterable<unknown>)[Symbol.asyncIterator]).toBe("function");
  });
});
