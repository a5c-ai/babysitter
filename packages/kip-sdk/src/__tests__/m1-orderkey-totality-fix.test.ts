/**
 * m1-orderkey-totality-fix.test.ts — NON-FROZEN, additive regression coverage for ROUND-2's two
 * required fixes to proj.ts (see this task's prompt / proj.ts's own "ROUND-2 CRITICAL FIX" /
 * "ROUND-2 FIX #2" doc comments):
 *
 *   1. `orderKey` is NOT actually a total order for externally-supplied facts: well-formed.ts's
 *      item-4 self-consistency check (`f.id === CID(canonicalPayload(f))`) is a documented,
 *      deliberately weak LENGTH-only bound (see well-formed.ts's own dispute comment), not a real
 *      hash-recompute-and-compare. So two facts with DIFFERENT `value` content can share an
 *      IDENTICAL orderKey tuple (same `validFrom`, `hlc.wall`, `hlc.counter`, `replicaId`,
 *      `publicKeyFingerprint`, AND `id`/factCID). Pre-fix, `maxByOrderKey`'s `reduce` silently kept
 *      whichever fact happened to be first in ingest order — a genuine, demonstrated SEC/
 *      convergence violation: two replicas holding the IDENTICAL admitted fact set produced
 *      DIFFERENT `getNode()` results depending on local ingest order. Post-fix, a genuine tie among
 *      DIFFERENT-content facts surfaces a `kip:conflict` segment instead (see `maxByOrderKey` in
 *      proj.ts); a tie among IDENTICAL-content facts still projects the same single `value` segment
 *      regardless of ingest order (order truly doesn't matter there).
 *
 *   2. `NodeView.props`/`EdgeView.props` key insertion order previously depended on ingest order
 *      (a `Set` scanning the facts array in ingest order) rather than being a pure function of the
 *      fact SET's content — fixed by sorting prop keys before populating `props` in both
 *      `getNode`/`getEdge`.
 *
 * These tests deliberately construct the EXACT scenario both round-2 critics used: an unregistered
 * fingerprint + the conformance suite's placeholder-signature convention (so `KipRepo.ingest`
 * admits both facts via the INV-13a unregistered-key fallback, `sig:<id>`), identical declared
 * `id`/`hlc`/`replicaId` across two facts with different `value`, ingested in different orders on
 * two independent `KipRepo` instances.
 */
import { describe, expect, it } from "vitest";
import type { Fact } from "../index";
import { KipRepo } from "../index";
import { KIP_CONFLICT_KIND, maxByOrderKey } from "../proj";
import { CANONICAL_SIGNED_FIELDS, makeWellFormedFact } from "./conformance/fixtures";

describe("Round-2 critical fix: orderKey totality residual surfaces kip:conflict instead of an ingest-order-dependent silent pick", () => {
  /**
   * Two facts, deliberately colliding on EVERY `orderKey` component (`validFrom`, `hlc.wall`,
   * `hlc.counter`, `replicaId`, `publicKeyFingerprint`, `id`) but asserting DIFFERENT `value`s for
   * the SAME node-prop cell. This is only possible because well-formed.ts's item-4 check never
   * verifies `id` against a real content hash for externally-supplied facts (a documented, frozen-
   * suite-driven scope boundary) — it is exactly the shape both round-1 adversarial critics
   * live-reproduced.
   */
  function makeTiedFact(value: string): Fact {
    return makeWellFormedFact({
      id: "cid-tied-shared-id",
      target: { kind: "node-prop", eid: "person/tied-orderkey", prop: "name" },
      value,
      hlc: { wall: 5_000, counter: 0 },
      replicaId: "peer-replica-tied",
      provenance: { publicKeyFingerprint: "unregistered-fpr-tied" },
    });
  }

  function makeExistFact(): Fact {
    return makeWellFormedFact({
      id: "cid-tied-exist",
      target: { kind: "node", eid: "person/tied-orderkey", nodeKind: "person" },
      value: true,
      // Same `validFrom` as the tied prop facts (both default to `hlc.wall`) so the existence cell
      // and the prop cell share the same single breakpoint — no separate "not-yet-existing" gap
      // segment to account for; this test is about the tie-conflict fix, not existence-gating.
      hlc: { wall: 5_000, counter: 0 },
      replicaId: "peer-replica-tied",
      provenance: { publicKeyFingerprint: "unregistered-fpr-tied" },
    });
  }

  it("both tied facts are admitted (unregistered fingerprint + placeholder signature convention)", async () => {
    const repo = new KipRepo();
    const exist = makeExistFact();
    const alice = makeTiedFact("Alice");
    const bob = makeTiedFact("Bob");
    expect(alice.id).toBe(bob.id); // the exact totality residual: same declared id, different content
    await expect(repo.ingest(exist)).resolves.toEqual({ admitted: true });
    await expect(repo.ingest(alice)).resolves.toEqual({ admitted: true });
    await expect(repo.ingest(bob)).resolves.toEqual({ admitted: true });
  });

  it("two replicas ingesting the SAME tied fact set in OPPOSITE orders converge on the SAME kip:conflict result (not a silent, ingest-order-dependent value pick)", async () => {
    const exist = makeExistFact();
    const alice = makeTiedFact("Alice");
    const bob = makeTiedFact("Bob");

    const repoAliceFirst = new KipRepo();
    await repoAliceFirst.ingest(exist);
    await repoAliceFirst.ingest(alice);
    await repoAliceFirst.ingest(bob);

    const repoBobFirst = new KipRepo();
    await repoBobFirst.ingest(exist);
    await repoBobFirst.ingest(bob);
    await repoBobFirst.ingest(alice);

    const viewAliceFirst = await repoAliceFirst.getNode("person/tied-orderkey");
    const viewBobFirst = await repoBobFirst.getNode("person/tied-orderkey");

    expect(viewAliceFirst).not.toBeNull();
    expect(viewBobFirst).not.toBeNull();

    const segAliceFirst = viewAliceFirst!.props.name.segments;
    const segBobFirst = viewBobFirst!.props.name.segments;

    // BOTH replicas must agree, regardless of which fact was ingested first.
    expect(JSON.stringify(segAliceFirst)).toBe(JSON.stringify(segBobFirst));

    // And the agreed-upon answer must be an HONEST conflict surface, never a silently-chosen value
    // (which pre-fix would have been "Alice" on one replica and "Bob" on the other).
    expect(segAliceFirst).toHaveLength(1);
    expect(segAliceFirst[0].kind).toBe("conflict");
  });

  it("when the tied facts are byte-identical in content (same value), picking either is fine and BOTH replicas still converge on ONE value segment regardless of ingest order", async () => {
    const exist = makeExistFact();
    const dup1 = makeTiedFact("SameValue");
    const dup2 = makeTiedFact("SameValue");

    const repoA = new KipRepo();
    await repoA.ingest(exist);
    await repoA.ingest(dup1);
    await repoA.ingest(dup2);

    const repoB = new KipRepo();
    await repoB.ingest(exist);
    await repoB.ingest(dup2);
    await repoB.ingest(dup1);

    const viewA = await repoA.getNode("person/tied-orderkey");
    const viewB = await repoB.getNode("person/tied-orderkey");

    expect(JSON.stringify(viewA!.props.name.segments)).toBe(JSON.stringify(viewB!.props.name.segments));
    expect(viewA!.props.name.segments).toHaveLength(1);
    expect(viewA!.props.name.segments[0]).toMatchObject({ kind: "value", value: "SameValue" });
  });
});

describe("Round-2 fix #2: NodeView/EdgeView prop-key order is a pure function of prop name, not ingest order", () => {
  function makeNodeFacts(eid: string): { exist: Fact; zebra: Fact; apple: Fact; middle: Fact } {
    const base = { hlc: { wall: 10_000, counter: 0 }, replicaId: `replica-propkeys-${eid}` };
    return {
      exist: makeWellFormedFact({
        ...base,
        id: `exist-${eid}`,
        target: { kind: "node", eid, nodeKind: "person" },
        value: true,
      }),
      zebra: makeWellFormedFact({
        ...base,
        id: `zebra-${eid}`,
        target: { kind: "node-prop", eid, prop: "zebra" },
        value: "z",
      }),
      apple: makeWellFormedFact({
        ...base,
        id: `apple-${eid}`,
        target: { kind: "node-prop", eid, prop: "apple" },
        value: "a",
      }),
      middle: makeWellFormedFact({
        ...base,
        id: `middle-${eid}`,
        target: { kind: "node-prop", eid, prop: "middle" },
        value: "m",
      }),
    };
  }

  it("JSON.stringify of the SAME fact set ingested in two different orders on two different KipRepo instances is byte-identical (prop key order included)", async () => {
    const eid = "person/propkey-order";
    const { exist, zebra, apple, middle } = makeNodeFacts(eid);

    const repoZebraFirst = new KipRepo();
    await repoZebraFirst.ingest(exist);
    await repoZebraFirst.ingest(zebra);
    await repoZebraFirst.ingest(apple);
    await repoZebraFirst.ingest(middle);

    const repoAppleFirst = new KipRepo();
    await repoAppleFirst.ingest(middle);
    await repoAppleFirst.ingest(apple);
    await repoAppleFirst.ingest(exist);
    await repoAppleFirst.ingest(zebra);

    const viewZebraFirst = await repoZebraFirst.getNode(eid);
    const viewAppleFirst = await repoAppleFirst.getNode(eid);

    expect(Object.keys(viewZebraFirst!.props)).toEqual(["apple", "middle", "zebra"]);
    expect(Object.keys(viewAppleFirst!.props)).toEqual(["apple", "middle", "zebra"]);
    expect(JSON.stringify(viewZebraFirst)).toBe(JSON.stringify(viewAppleFirst));
  });
});

describe("Round-3 root-cause fix: kindWinner (NodeView.kind) surfaces kip:conflict on a genuine tie, instead of a parallel un-fixed maxByOrderKey pick", () => {
  /**
   * Round-2 fixed ONLY `reduceRawCell`'s own prop-value sweep (via the round-2 `maxByOrderKey`), leaving
   * `getNode`'s `kindWinner` (derived directly from the existence facts via the OLD bare-Fact-
   * returning `maxByOrderKey`) independently vulnerable to the exact same ingest-order-dependent
   * silent pick — three critics live-reproduced two node-existence facts sharing a colliding `id`
   * (well-formed.ts's item-4 weak check) projecting DIFFERENT `NodeKind`s ('person' vs
   * 'organization') depending on which replica ingested them in which order.
   */
  function makeTiedExistFact(nodeKind: string): Fact {
    return makeWellFormedFact({
      id: "cid-tied-kind",
      target: { kind: "node", eid: "person/tied-kind", nodeKind },
      value: true,
      validFrom: 0,
      validTo: null,
      hlc: { wall: 9_000, counter: 0 },
      replicaId: "peer-replica-tied-kind",
      provenance: { publicKeyFingerprint: "unregistered-fpr-tied-kind" },
    });
  }

  it("two replicas ingesting two existence facts tied on orderKey but declaring DIFFERENT nodeKind, in opposite orders, converge on the SAME kip:conflict kind (not diverging 'person' vs 'organization')", async () => {
    const person = makeTiedExistFact("person");
    const org = makeTiedExistFact("organization");
    expect(person.id).toBe(org.id); // the exact totality residual this fix closes

    const repoPersonFirst = new KipRepo();
    await repoPersonFirst.ingest(person);
    await repoPersonFirst.ingest(org);

    const repoOrgFirst = new KipRepo();
    await repoOrgFirst.ingest(org);
    await repoOrgFirst.ingest(person);

    const viewPersonFirst = await repoPersonFirst.getNode("person/tied-kind");
    const viewOrgFirst = await repoOrgFirst.getNode("person/tied-kind");

    expect(viewPersonFirst).not.toBeNull();
    expect(JSON.stringify(viewPersonFirst)).toBe(JSON.stringify(viewOrgFirst));
    expect(viewPersonFirst!.kind).toBe(KIP_CONFLICT_KIND);
  });

  it("two existence facts tied on orderKey but declaring the SAME nodeKind still project that kind normally (a harmless tie is never mistaken for a conflict)", async () => {
    const dup1 = makeTiedExistFact("person");
    const dup2: Fact = { ...makeTiedExistFact("person"), id: dup1.id };

    const repoA = new KipRepo();
    await repoA.ingest(dup1);
    await repoA.ingest(dup2);
    const view = await repoA.getNode("person/tied-kind");
    expect(view!.kind).toBe("person");
  });
});

describe("Round-3 root-cause fix: kindWinner (EdgeView.kind/from/to) surfaces kip:conflict on a genuine topology tie", () => {
  /**
   * The edge variant of the same bug: two edge-existence facts sharing a colliding `id` can
   * disagree not just on `edgeKind` but on the edge's OWN topology (`from`/`to`) — a critic
   * live-reproduced two replicas diverging on which nodes an edge actually connects.
   */
  function makeTiedEdgeFact(edgeKind: string, from: string, to: string): Fact {
    return makeWellFormedFact({
      id: "cid-tied-edge",
      target: { kind: "edge", eid: "edge/tied-topology", edgeKind, from, to },
      value: true,
      validFrom: 0,
      validTo: null,
      hlc: { wall: 9_500, counter: 0 },
      replicaId: "peer-replica-tied-edge",
      provenance: { publicKeyFingerprint: "unregistered-fpr-tied-edge" },
    });
  }

  it("two replicas ingesting two edge-existence facts tied on orderKey but declaring DIFFERENT from/to topology, in opposite orders, converge on the SAME kip:conflict kind (never silently picking one topology)", async () => {
    const topologyA = makeTiedEdgeFact("works_at", "person/alice", "org/acme");
    const topologyB = makeTiedEdgeFact("works_at", "person/bob", "org/globex");
    expect(topologyA.id).toBe(topologyB.id);

    const repoAFirst = new KipRepo();
    await repoAFirst.ingest(topologyA);
    await repoAFirst.ingest(topologyB);

    const repoBFirst = new KipRepo();
    await repoBFirst.ingest(topologyB);
    await repoBFirst.ingest(topologyA);

    const viewAFirst = await repoAFirst.getEdge("edge/tied-topology");
    const viewBFirst = await repoBFirst.getEdge("edge/tied-topology");

    expect(viewAFirst).not.toBeNull();
    expect(JSON.stringify(viewAFirst)).toBe(JSON.stringify(viewBFirst));
    expect(viewAFirst!.kind).toBe(KIP_CONFLICT_KIND);
  });
});

describe("Round-3 root-cause fix: pickProvenance surfaces an honest conflicted:true flag on a genuine CROSS-CELL tie, instead of silently flipping provenance.publicKeyFingerprint by ingest order", () => {
  /**
   * The exact cross-cell shape a critic live-reproduced: an existence fact and an UNRELATED prop
   * fact for the SAME node sharing a colliding `id` (and therefore, since `id` is orderKey's own
   * final tiebreak, a full orderKey tie) but asserting completely different content/authorship. A
   * node's overall `provenance` is picked across ALL of its cells' latest asserts (see proj.ts's
   * `pickProvenance`), so this tie is visible at the NODE level even though the two colliding facts
   * target different cells entirely.
   */
  function makeCollidingExistFact(): Fact {
    return makeWellFormedFact({
      id: "cid-cross-cell-collide",
      target: { kind: "node", eid: "person/cross-cell-tie", nodeKind: "person" },
      value: true,
      validFrom: 0,
      validTo: null,
      hlc: { wall: 12_000, counter: 0 },
      replicaId: "peer-replica-cross-cell",
      provenance: { publicKeyFingerprint: "unregistered-fpr-cross-cell", author: "exist-author" },
    });
  }

  function makeCollidingPropFact(): Fact {
    return makeWellFormedFact({
      id: "cid-cross-cell-collide", // SAME id as the existence fact above, DIFFERENT cell/content
      target: { kind: "node-prop", eid: "person/cross-cell-tie", prop: "status" },
      value: "active",
      validFrom: 0,
      validTo: null,
      hlc: { wall: 12_000, counter: 0 },
      replicaId: "peer-replica-cross-cell",
      provenance: { publicKeyFingerprint: "unregistered-fpr-cross-cell", author: "prop-author" },
    });
  }

  it("two replicas ingesting the colliding existence+prop facts in opposite orders converge on the IDENTICAL provenance, honestly flagged conflicted:true", async () => {
    const exist = makeCollidingExistFact();
    const prop = makeCollidingPropFact();
    expect(exist.id).toBe(prop.id);

    const repoExistFirst = new KipRepo();
    await repoExistFirst.ingest(exist);
    await repoExistFirst.ingest(prop);

    const repoPropFirst = new KipRepo();
    await repoPropFirst.ingest(prop);
    await repoPropFirst.ingest(exist);

    const viewExistFirst = await repoExistFirst.getNode("person/cross-cell-tie");
    const viewPropFirst = await repoPropFirst.getNode("person/cross-cell-tie");

    expect(viewExistFirst).not.toBeNull();
    expect(JSON.stringify(viewExistFirst)).toBe(JSON.stringify(viewPropFirst));
    expect(viewExistFirst!.provenance.conflicted).toBe(true);
  });
});

describe("Round-3 root-cause fix: factsById collision no longer last-write-wins into causedByDominates' causal walk", () => {
  /**
   * `factsById`'s pre-fix plain `new Map(facts.map(f => [f.id, f]))` silently overwrote a colliding
   * id's entry with whichever fact was LAST in local ingest order. `causedByDominates`'s causal walk
   * reads `factsById.get(id)` while following a `causedBy` chain — so a `supersede` fact declaring
   * `causedBy: [<a colliding id>]` could spuriously "dominate" (or fail to dominate) another
   * `supersede` fact depending on WHICH content-variant of that colliding id happened to win the
   * Map, which depended on ingest order. This constructs exactly that: two different-content facts
   * ("phantomA"/"phantomB") sharing a colliding id, where only ONE of the two variants' `causedBy`
   * chain actually reaches the rival supersede fact.
   */
  function makeScenario() {
    const eid = "person/factsbyid-collision";
    const existence = makeWellFormedFact({ target: { kind: "node", eid, nodeKind: "person" }, value: true, validFrom: 0, validTo: null });
    const original = makeWellFormedFact({ id: "original-role-fbid", target: { kind: "node-prop", eid, prop: "role" }, value: "intern", validFrom: 0, validTo: null });

    // Two DIFFERENT-content facts sharing id "phantom-collide-fbid" — a forged collision, targeting
    // an UNRELATED prop cell so they don't otherwise interfere with the `role` cell under test.
    // Only `phantomB`'s `causedBy` actually reaches `supersedeB`'s id.
    const phantomA = makeWellFormedFact({ id: "phantom-collide-fbid", target: { kind: "node-prop", eid, prop: "unrelated" }, value: "phantom-a", validFrom: 0, validTo: null });
    const phantomB = makeWellFormedFact({ id: "phantom-collide-fbid", target: { kind: "node-prop", eid, prop: "unrelated" }, value: "phantom-b", validFrom: 0, validTo: null, causedBy: ["supersede-b-fbid"] });

    const supersedeA = makeWellFormedFact({
      id: "supersede-a-fbid",
      target: { kind: "node-prop", eid, prop: "role" },
      provenance: { publicKeyFingerprint: "author-a-fbid-fpr" },
      causedBy: ["phantom-collide-fbid"],
      validFrom: 1000,
      validTo: null,
    });
    supersedeA.type = "supersede";
    supersedeA.value = "senior-engineer";
    supersedeA.supersedes = [original.id];

    const supersedeB = makeWellFormedFact({
      id: "supersede-b-fbid",
      target: { kind: "node-prop", eid, prop: "role" },
      provenance: { publicKeyFingerprint: "author-b-fbid-fpr" },
      validFrom: 1000,
      validTo: null,
    });
    supersedeB.type = "supersede";
    supersedeB.value = "manager";
    supersedeB.supersedes = [original.id];

    return { existence, original, phantomA, phantomB, supersedeA, supersedeB };
  }

  it("two replicas ingesting phantomA/phantomB in opposite orders still converge on the SAME kip:conflict outcome for the role cell (never spuriously granting dominance through an ambiguous collided id)", async () => {
    const { existence, original, phantomA, phantomB, supersedeA, supersedeB } = makeScenario();

    const repoAFirst = new KipRepo();
    await repoAFirst.ingest(existence);
    await repoAFirst.ingest(original);
    await repoAFirst.ingest(phantomA);
    await repoAFirst.ingest(phantomB);
    await repoAFirst.ingest(supersedeA);
    await repoAFirst.ingest(supersedeB);

    const repoBFirst = new KipRepo();
    await repoBFirst.ingest(existence);
    await repoBFirst.ingest(original);
    await repoBFirst.ingest(phantomB);
    await repoBFirst.ingest(phantomA);
    await repoBFirst.ingest(supersedeB);
    await repoBFirst.ingest(supersedeA);

    const viewAFirst = await repoAFirst.getNode("person/factsbyid-collision");
    const viewBFirst = await repoBFirst.getNode("person/factsbyid-collision");

    expect(JSON.stringify(viewAFirst!.props.role.segments)).toBe(JSON.stringify(viewBFirst!.props.role.segments));
    const conflictSegments = viewAFirst!.props.role.segments.filter((s) => s.kind === "conflict");
    expect(conflictSegments.length).toBeGreaterThan(0);
  });
});

describe("Round-4 critical fix: compareByContent canonicalizes object key order (JSON.stringify(deepSortKeys(...))), never raw JSON.stringify insertion order", () => {
  /**
   * `compareByContent` is documented as "a deterministic, CONTENT-based (never array-position/
   * ingest-order-based) ordering" but was implemented as raw `JSON.stringify(a) < JSON.stringify(b)`
   * — sensitive to each `Fact` object's own property INSERTION order, not just its field VALUES.
   * `reorderTopLevelKeys` rebuilds a fact with the SAME field values but a reversed top-level key
   * insertion sequence, simulating an externally-supplied fact whose wire-level key order is
   * attacker-controlled (raw fact storage never canonicalizes key order the way
   * `canonicalPayloadString`/`ingest()`'s signature check does).
   */
  function reorderTopLevelKeys(f: Fact): Fact {
    const reordered = {} as Record<string, unknown>;
    for (const key of Object.keys(f).reverse()) {
      reordered[key] = (f as unknown as Record<string, unknown>)[key];
    }
    return reordered as Fact;
  }

  it("maxByOrderKey picks the SAME content-deterministic winner regardless of one tied fact's own incidental key insertion order", () => {
    const tieFields = {
      id: "cid-keyorder-tie",
      hlc: { wall: 6_000, counter: 0 },
      replicaId: "peer-replica-keyorder",
      provenance: { publicKeyFingerprint: "unregistered-fpr-keyorder" },
    };
    const factAlice = makeWellFormedFact({
      ...tieFields,
      target: { kind: "node-prop", eid: "person/keyorder-tie", prop: "name" },
      value: "Alice",
    });
    const factAliceReordered = reorderTopLevelKeys(factAlice);
    const factBob = makeWellFormedFact({
      ...tieFields,
      target: { kind: "node-prop", eid: "person/keyorder-tie", prop: "name" },
      value: "Bob",
    });

    // Sanity: deep-equal (same field values) but NOT byte-identical via raw JSON.stringify — exactly
    // the incidental-key-order divergence the fix must be immune to.
    expect(factAliceReordered).toEqual(factAlice);
    expect(JSON.stringify(factAliceReordered)).not.toBe(JSON.stringify(factAlice));
    expect(factAlice.id).toBe(factBob.id); // genuine orderKey tie (every component, including id)

    const { winner: winnerNaturalOrder } = maxByOrderKey([factAlice, factBob]);
    const { winner: winnerReorderedKeys } = maxByOrderKey([factAliceReordered, factBob]);

    // The SAME representative must win regardless of which key-order variant of the identical-content
    // fact was fed in — pre-fix, raw JSON.stringify comparison could flip depending on incidental key
    // insertion order even though factAlice/factAliceReordered are the same content.
    expect(winnerReorderedKeys.value).toBe(winnerNaturalOrder.value);
  });
});

describe("Round-4 major fix: kindWinner's tied-group conflict check also compares existence VALUE (isTruthyExistence), not just nodeKind", () => {
  /**
   * Pre-fix, `getNode`'s `kindConflict` check only compared `nodeKind` across the tied-for-max
   * existence-fact group — never the facts' own `value` (the actual existence datum: true = exists,
   * false = does not exist). Two existence facts sharing a forged colliding id with the SAME nodeKind
   * but OPPOSITE existence value tied on orderKey like every other site, yet `getNode` silently
   * returned a clean, non-conflicted kind even though whether the entity exists at all is genuinely
   * disputed.
   */
  function makeTiedExistFactWithValue(value: boolean): Fact {
    return makeWellFormedFact({
      id: "cid-tied-existence-value",
      target: { kind: "node", eid: "person/tied-existence-value", nodeKind: "person" },
      value,
      validFrom: 0,
      validTo: null,
      hlc: { wall: 9_800, counter: 0 },
      replicaId: "peer-replica-tied-existence-value",
      provenance: { publicKeyFingerprint: "unregistered-fpr-tied-existence-value" },
    });
  }

  it("two existence facts tied on orderKey with the SAME nodeKind but OPPOSITE existence value surface KIP_CONFLICT_KIND instead of a confident kind", async () => {
    const exists = makeTiedExistFactWithValue(true);
    const notExists = makeTiedExistFactWithValue(false);
    expect(exists.id).toBe(notExists.id); // the exact totality residual this fix closes

    const repo = new KipRepo();
    await repo.ingest(exists);
    await repo.ingest(notExists);

    const view = await repo.getNode("person/tied-existence-value");
    expect(view).not.toBeNull();
    expect(view!.kind).toBe(KIP_CONFLICT_KIND);
  });

  it("two existence facts tied on orderKey with the SAME nodeKind AND the SAME existence value still project that kind normally (a harmless tie is never mistaken for a conflict)", async () => {
    const dup1 = makeTiedExistFactWithValue(true);
    const dup2: Fact = { ...makeTiedExistFactWithValue(true), id: dup1.id };

    const repo = new KipRepo();
    await repo.ingest(dup1);
    await repo.ingest(dup2);

    const view = await repo.getNode("person/tied-existence-value");
    expect(view!.kind).toBe("person");
  });
});

describe("fixture module contract sanity (documents this suite's dependency on fixtures.ts's placeholder-signature convention)", () => {
  it("CANONICAL_SIGNED_FIELDS matches the envelope field list makeWellFormedFact stamps into provenance.signedFields", () => {
    const f = makeWellFormedFact();
    expect(f.provenance.signedFields).toEqual(CANONICAL_SIGNED_FIELDS);
  });
});

/**
 * Recursively rebuilds `value` with every object's OWN key insertion order reversed, at every
 * nesting depth (top-level `Fact` fields AND nested objects like `provenance`/`provenance.source`/
 * `hlc`/`target`) — unlike this file's existing `reorderTopLevelKeys` (round-4, top-level only),
 * this simulates an externally-supplied fact whose wire-level key order is attacker-controlled at
 * EVERY depth, not just the envelope's own top level. Field VALUES are completely unchanged (a
 * true deep-equal, content-identical copy) — only enumeration/insertion order differs, which is all
 * `JSON.stringify` is sensitive to beyond content.
 */
function deepReverseAllKeys<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => deepReverseAllKeys(v)) as unknown as T;
  const obj = value as Record<string, unknown>;
  const reversed: Record<string, unknown> = {};
  for (const key of Object.keys(obj).reverse()) {
    reversed[key] = deepReverseAllKeys(obj[key]);
  }
  return reversed as T;
}

describe("This task's CRITICAL fix: pickProvenance/getNode/getEdge canonicalize embedded Provenance (and EdgeView.validFrom/validTo) via deepSortKeys, never raw embedding", () => {
  /**
   * Live-reproduced by a critic through the real `KipRepo.ingest`/`getNode` round-trip: raw fact
   * storage never canonicalizes key order (`writeFactBlob(f.id, JSON.stringify(f))` persists
   * whatever in-memory key order `f` happens to have; `listFactBlobs` -> `JSON.parse` reads it back
   * unchanged) while admission verifies signatures against a `deepSortKeys`-canonicalized payload —
   * so an externally-supplied fact's wire-level key order (top-level AND nested, e.g.
   * `provenance`/`provenance.source`) is fully attacker-controlled and unconstrained by admission.
   * Pre-fix, `pickProvenance` returned `winner.provenance` VERBATIM into `NodeView`/
   * `EdgeView.provenance`, so two replicas holding byte-different-but-content-identical encodings of
   * the SAME admitted fact set produced `getNode()`/`getEdge()` results that differ under
   * `JSON.stringify` — reopening the exact SEC-breaking divergence class this milestone exists to
   * close, this time at the projected VIEW layer.
   */
  it("getNode: two replicas ingesting byte-different-but-content-identical (top-level AND nested-provenance key order reversed) encodings of the SAME fact set converge on a byte-identical NodeView, including provenance", async () => {
    const eid = "person/view-provenance-keyorder";
    const existFact = makeWellFormedFact({
      target: { kind: "node", eid, nodeKind: "person" },
      value: true,
      validFrom: 0,
      validTo: null,
      hlc: { wall: 20_000, counter: 0 },
      replicaId: "replica-view-keyorder-exist",
      provenance: {
        publicKeyFingerprint: "unregistered-fpr-view-keyorder-exist",
        author: "exist-author",
        source: { uri: "https://example.com/exist", cid: "cid-source-exist" },
        confidence: 0.9,
      },
    });
    const propFact = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "role" },
      value: "engineer",
      validFrom: 0,
      validTo: null,
      hlc: { wall: 25_000, counter: 3 }, // later than exist — this fact's provenance is the overall winner
      replicaId: "replica-view-keyorder-prop",
      provenance: {
        publicKeyFingerprint: "unregistered-fpr-view-keyorder-prop",
        author: "prop-author",
        source: { uri: "https://example.com/prop", cid: "cid-source-prop" },
        confidence: 0.5,
      },
    });

    const existReordered = deepReverseAllKeys(existFact);
    const propReordered = deepReverseAllKeys(propFact);

    // Sanity: deep-equal (same field values, including nested provenance/source) but NOT
    // byte-identical via raw JSON.stringify — exactly the incidental-key-order divergence the fix
    // must be immune to.
    expect(existReordered).toEqual(existFact);
    expect(propReordered).toEqual(propFact);
    expect(JSON.stringify(existReordered)).not.toBe(JSON.stringify(existFact));
    expect(JSON.stringify(propReordered)).not.toBe(JSON.stringify(propFact));

    const repoNormal = new KipRepo();
    await repoNormal.ingest(existFact);
    await repoNormal.ingest(propFact);

    const repoReordered = new KipRepo();
    await repoReordered.ingest(existReordered);
    await repoReordered.ingest(propReordered);

    const viewNormal = await repoNormal.getNode(eid);
    const viewReordered = await repoReordered.getNode(eid);

    expect(viewNormal).not.toBeNull();
    expect(viewNormal!.provenance.publicKeyFingerprint).toBe("unregistered-fpr-view-keyorder-prop");
    expect(viewNormal!.provenance.conflicted).toBeUndefined();
    // The core assertion: byte-identical views (including the embedded `provenance` object and its
    // nested `source`) regardless of which key-order variant of the identical-content fact set each
    // replica happened to ingest.
    expect(JSON.stringify(viewNormal)).toBe(JSON.stringify(viewReordered));
  });

  it("getEdge: two replicas ingesting byte-different-but-content-identical encodings of an edge fact (including an object-shaped HlcStamp validFrom) converge on a byte-identical EdgeView", async () => {
    const edgeEid = "edge/view-provenance-keyorder";
    const edgeFact = makeWellFormedFact({
      target: { kind: "edge", eid: edgeEid, edgeKind: "works_at", from: "person/alice", to: "org/acme" },
      value: true,
      // An object-shaped `HlcStamp` (not a plain number) — exercises the latent `EdgeView.validFrom`/
      // `validTo` embedding fix (this task's MINOR finding #4): a multi-key object whose OWN key
      // order is just as attacker-controlled as `provenance`'s.
      validFrom: { wall: 30_000, counter: 7, replicaId: "replica-edge-keyorder" },
      validTo: null,
      hlc: { wall: 30_000, counter: 0 },
      replicaId: "replica-edge-keyorder",
      provenance: {
        publicKeyFingerprint: "unregistered-fpr-edge-keyorder",
        author: "edge-author",
        source: { uri: "https://example.com/edge" },
      },
    });
    const edgeReordered = deepReverseAllKeys(edgeFact);

    expect(edgeReordered).toEqual(edgeFact);
    expect(JSON.stringify(edgeReordered)).not.toBe(JSON.stringify(edgeFact));

    const repoNormal = new KipRepo();
    await repoNormal.ingest(edgeFact);

    const repoReordered = new KipRepo();
    await repoReordered.ingest(edgeReordered);

    const viewNormal = await repoNormal.getEdge(edgeEid);
    const viewReordered = await repoReordered.getEdge(edgeEid);

    expect(viewNormal).not.toBeNull();
    expect(viewNormal!.validFrom).toEqual({ wall: 30_000, counter: 7, replicaId: "replica-edge-keyorder" });
    expect(viewNormal!.provenance.conflicted).toBeUndefined();
    expect(JSON.stringify(viewNormal)).toBe(JSON.stringify(viewReordered));
  });
});

describe("This task's MAJOR fix: buildFactsById's id-collision detector canonicalizes key order (deepSortKeys) before comparing, so a key-order-only difference is never treated as a genuine collision", () => {
  /**
   * Live-reproduced by two critics: `buildFactsById`'s collision detector previously compared group
   * members via raw `JSON.stringify(f)` — the same fragile pattern `compareByContent`/
   * `tiedGroupDiffersOn` were fixed for in round 4. Two facts sharing an `id` but differing ONLY in
   * incidental key-insertion order (top-level and nested `provenance`/`source`) were spuriously
   * flagged as a genuine id COLLISION, so `pickProvenance`'s `collidedIds.has(winner.id)` check
   * force-flagged a harmless duplicate's provenance `conflicted: true` — an honest-looking but FALSE
   * ambiguity signal.
   */
  it("two facts sharing a colliding id via content-identical-but-key-order-different encodings are NOT flagged as a genuine collision (no spurious conflicted:true / kip:conflict)", async () => {
    const eid = "person/factsbyid-keyorder-collision";
    const existFact = makeWellFormedFact({
      target: { kind: "node", eid, nodeKind: "person" },
      value: true,
      validFrom: 0,
      validTo: null,
      hlc: { wall: 1_000, counter: 0 },
      replicaId: "replica-factsbyid-keyorder-exist",
      provenance: { publicKeyFingerprint: "unregistered-fpr-factsbyid-keyorder-exist" },
    });
    const roleFact = makeWellFormedFact({
      id: "cid-factsbyid-keyorder-role",
      target: { kind: "node-prop", eid, prop: "role" },
      value: "engineer",
      validFrom: 0,
      validTo: null,
      hlc: { wall: 50_000, counter: 0 }, // later than exist — this cell's assert is the overall provenance winner
      replicaId: "replica-factsbyid-keyorder-role",
      provenance: {
        publicKeyFingerprint: "unregistered-fpr-factsbyid-keyorder-role",
        author: "role-author",
        source: { uri: "https://example.com/role" },
      },
    });
    // SAME id (deep-reversing keys never changes any field's VALUE, only enumeration order) but a
    // byte-different encoding — exactly the forged-looking-but-harmless duplicate this fix concerns.
    const roleFactReordered = deepReverseAllKeys(roleFact);

    expect(roleFactReordered.id).toBe(roleFact.id);
    expect(roleFactReordered).toEqual(roleFact);
    expect(JSON.stringify(roleFactReordered)).not.toBe(JSON.stringify(roleFact));

    const repo = new KipRepo();
    await repo.ingest(existFact);
    await repo.ingest(roleFact);
    await repo.ingest(roleFactReordered);

    const view = await repo.getNode(eid);
    expect(view).not.toBeNull();

    // The cell itself resolves cleanly to one value segment (a harmless content-identical
    // duplicate, never a cell-level conflict — this half was already sound via round-4's
    // `distinctValues`/`tiedGroupDiffersOn` fixes).
    expect(view!.props.role.segments).toHaveLength(1);
    expect(view!.props.role.segments[0]).toMatchObject({ kind: "value", value: "engineer" });

    // The fix under test: the node's overall provenance must NOT be spuriously flagged
    // conflicted:true merely because `buildFactsById` saw two differently-key-ordered encodings of
    // the same id.
    expect(view!.provenance.conflicted).toBeUndefined();
    expect(view!.provenance.publicKeyFingerprint).toBe("unregistered-fpr-factsbyid-keyorder-role");
  });
});
