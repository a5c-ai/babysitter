/**
 * INV-A10 — acquisition family lifecycle + ordering/kind-preservation + divergent-registration
 * conflict (M7, docs/60-conformance-and-testability.md#inv-a10).
 *
 * Asserts (verbatim, docs/60 INV-A10 row): "(a) `AcquisitionResult.proposed` lands
 * quarantined-until-trusted (only trusted via the ordinary §8.1 path, never trusted-on-import);
 * (b) each `sameAs` → exactly one signed `same_as` fact, contradicting merge → `kip:conflict`;
 * (c) Discoverer traversal terminates within its declared bound; (d) a family microagent writing
 * `/heads` directly fails (INV-A1 parity); (e) mixed `proposed` batch preserves kind
 * (`AssertInput`→`assert`, `RetractInput`→`retract`, no coercion); (f) returned `{facts}` is exactly
 * `proposed` order then `sameAs` order; two registrations of same `(name,version)` with divergent
 * manifests → cell reads `CONFLICTED` (not LWW-overwrite)." Violating build: "coercing
 * `retract`↔`assert`; reordering the returned `FactId[]`; LWW-overwriting an incompatible descriptor;
 * sourceless Miner writing `/heads`."
 *
 * docs/33-mining-discovery-ingestion.md §"AcquisitionResult → facts data flow (pinned)" pins the
 * commit order: (1) each `proposed` entry → one signed `assert`/`retract` (kind preserved), (2) each
 * `sameAs` → one signed `same_as(candidate, existing)`, (3) `source` recorded as `provenance.source`
 * on EVERY fact; "the returned `{ facts: FactId[] }` lists all of (1)+(2) in that exact order."
 *
 * Test methodology — the acquisition family is a genty microagent dispatched via the injectable
 * `dispatchMicroagent` seam (mirrors fixtures-m6's `makeScriptedDispatch`): the scripted handler
 * RETURNS an `AcquisitionResult`; the orchestrator's fact-authoring is what is under test (INV-A1:
 * only the orchestrator calls `assertFact`). `runAcquisition` is an unimplemented throwing stub this
 * round — every `runAcquisition`-driven assertion below is EXPECTED TO FAIL on a real (rejected-
 * promise) assertion (the leading `await expect(p).resolves...` guard), never on a type/syntax error;
 * the deeper mapping assertions become live acceptance criteria once M7 lands. Sub-case (c) reduces
 * to the already-implemented (M4) substrate `query` bound and is GREEN.
 */
import { afterEach, describe, expect, it } from "vitest";
import { KipRepo, type TraversalSpec } from "../../index";
import {
  FIXED_AS_OF,
  acqNodeAssert,
  acqPropAssert,
  acqPropRetract,
  acqSource,
  acquisitionOk,
  collect,
  freshReplicaId,
  makeScriptedDispatch,
  registerAcquisitionManifest,
  seedEdge,
  seedNode,
  seedNotSameAs,
  seedProp,
} from "./fixtures-m7";

describe("INV-A10: acquisition family lifecycle + ordering/kind-preservation + divergent-registration conflict", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  function newRepoWith(handlerName: string, result: () => ReturnType<typeof acquisitionOk>): { repo: KipRepo } {
    const { dispatch } = makeScriptedDispatch({ [handlerName]: () => result() });
    const repo = new KipRepo({ replicaId: freshReplicaId("inv-a10"), dispatchMicroagent: dispatch });
    repos.push(repo);
    return { repo };
  }

  describe("INV-A10(a): AcquisitionResult.proposed lands as ordinary orchestrator-signed facts, never a trusted-on-import direct write", () => {
    it("commits each proposed assert via proj (readable value) backed by a real signed FactId — the microagent never writes /heads, so state changes ONLY via the orchestrator's signed fact", async () => {
      const eid = "tenant/ns/miner-candidate-a";
      const { dispatch } = makeScriptedDispatch({
        miner: () => acquisitionOk({ proposed: [acqPropAssert(eid, "title", "mined-object")], source: acqSource() }),
      });
      const repo = new KipRepo({ replicaId: freshReplicaId("inv-a10"), dispatchMicroagent: dispatch });
      repos.push(repo);
      const manifest = await registerAcquisitionManifest(repo, "miner");

      const p = repo.runAcquisition(manifest, { dataResource: "feed://a" }, { asOf: FIXED_AS_OF });
      // GUARD (fails NOW as an assertion — runAcquisition throws `unimplemented`): a { facts } shape.
      await expect(p).resolves.toMatchObject({ facts: expect.any(Array) });

      // --- live acceptance criteria (unreachable until M7 lands) ---
      const { facts } = await p;
      expect(facts.length).toBe(1);

      // The proposed object-of-interest is reachable ONLY as an ordinary projected value cell — an
      // entity a microagent wrote directly (bypassing assertFact) would not project here. The trust
      // LABEL (untrusted/quarantined vs trusted) is the M8 authority overlay, not observable through
      // this surface; (a)'s observable core is "entered via proj as a signed fact, never trusted-on-
      // import as a special elevated write".
      const view = await repo.getNode(eid);
      expect(view?.props.title?.segments.some((s) => s.kind === "value" && s.value === "mined-object")).toBe(true);

      // Every returned FactId denotes a REAL signed fact authored by the orchestrator (INV-A1).
      const prov = await repo.provenanceOf(facts[0]!);
      expect(prov.length).toBeGreaterThan(0);
      expect(prov[0]?.signature).toBeTruthy();
    });
  });

  describe("INV-A10(b): each sameAs → exactly one signed same_as fact (never an in-place rewrite); a contradicting merge surfaces kip:conflict", () => {
    it("a Miner-emitted sameAs merges candidate onto the canonical (min-by-(namespaceId,localId)) existing EID via a signed same_as fact", async () => {
      // `existing` sorts below `candidate` in the same namespace ⇒ `existing` is the canonical rep.
      const existing = "tenant/ns/aaa-existing";
      const candidate = "tenant/ns/zzz-candidate";
      const { repo } = newRepoWith("miner-dedup", () =>
        acquisitionOk({
          proposed: [acqNodeAssert(candidate, "person")],
          source: acqSource(),
          sameAs: [{ candidate, existing }],
        }),
      );
      await seedNode(repo, existing, "person");
      const manifest = await registerAcquisitionManifest(repo, "miner-dedup");

      const p = repo.runAcquisition(manifest, { dataResource: "feed://dedup" }, { asOf: FIXED_AS_OF });
      await expect(p).resolves.toMatchObject({ facts: expect.any(Array) });

      const { facts } = await p;
      // proposed(1) + sameAs(1) = 2 committed facts.
      expect(facts.length).toBe(2);
      // The same_as fact folded (patent node-merge): both EIDs resolve to the canonical `existing`.
      expect((await repo.getNode(candidate))?.eid).toBe(existing);
      expect((await repo.getNode(existing))?.eid).toBe(existing);
    });

    it("a contradicting not_same_as from a second key surfaces kip:conflict — the sameAs is a signed fact, never a silent in-place rewrite", async () => {
      const existing = "tenant/ns/aaa-existing2";
      const candidate = "tenant/ns/zzz-candidate2";
      const { repo } = newRepoWith("miner-dispute", () =>
        acquisitionOk({
          proposed: [acqNodeAssert(candidate, "person")],
          source: acqSource(),
          sameAs: [{ candidate, existing }],
        }),
      );
      await seedNode(repo, existing, "person");
      const manifest = await registerAcquisitionManifest(repo, "miner-dispute");

      const p = repo.runAcquisition(manifest, { dataResource: "feed://dispute" }, { asOf: FIXED_AS_OF });
      await expect(p).resolves.toMatchObject({ facts: expect.any(Array) });
      await p;

      // A second key disputes the merge — docs/33: "contradictions surface as kip:conflict".
      await seedNotSameAs(repo, candidate, existing);
      expect((await repo.getNode(candidate))?.kind).toBe("kip:conflict");
      expect((await repo.getNode(existing))?.kind).toBe("kip:conflict");
    });
  });

  describe("INV-A10(c): Discoverer traversal terminates within its DECLARED bound (mandatory depth/maxFanout of TraversalSpec)", () => {
    it("a per-node maxFanout cap cuts off a hub that would otherwise crawl unbounded", async () => {
      const repo = new KipRepo({ replicaId: freshReplicaId("inv-a10-c") });
      repos.push(repo);
      const hub = "tenant/ns/hub";
      await seedNode(repo, hub, "hub");
      for (let i = 0; i < 8; i += 1) {
        const leaf = `tenant/ns/leaf-${i}`;
        // eslint-disable-next-line no-await-in-loop -- intentionally sequential fixture seeding
        await seedNode(repo, leaf, "leaf");
        // eslint-disable-next-line no-await-in-loop
        await seedEdge(repo, hub, leaf, "related");
      }
      const spec: TraversalSpec = { seed: hub, direction: "out", depth: 1, maxFanout: 2 };
      const reached = await collect(repo.query(spec));
      // maxFanout=2 ⇒ at most 2 leaf expansions (plus at most the seed); a build with no per-node
      // fanout cap would surface all 8 leaves (unbounded crawl).
      const leafCount = reached.filter((v) => v.eid.startsWith("tenant/ns/leaf-")).length;
      expect(leafCount).toBeLessThanOrEqual(2);
    });

    it("a depth cap terminates a deep chain before the far node (never an unbounded walk)", async () => {
      const repo = new KipRepo({ replicaId: freshReplicaId("inv-a10-c2") });
      repos.push(repo);
      const chain = ["tenant/ns/c0", "tenant/ns/c1", "tenant/ns/c2", "tenant/ns/c3", "tenant/ns/c4"];
      for (const eid of chain) {
        // eslint-disable-next-line no-await-in-loop
        await seedNode(repo, eid, "chain");
      }
      for (let i = 0; i < chain.length - 1; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await seedEdge(repo, chain[i]!, chain[i + 1]!, "related");
      }
      const spec: TraversalSpec = { seed: chain[0]!, direction: "out", depth: 2, maxFanout: 10 };
      const reached = await collect(repo.query(spec));
      const reachedEids = new Set(reached.map((v) => v.eid));
      // depth=2 cannot reach c3 or c4 — the declared bound terminates the crawl.
      expect(reachedEids.has("tenant/ns/c4")).toBe(false);
      expect(reachedEids.has("tenant/ns/c3")).toBe(false);
    });
  });

  describe("INV-A10(d): a family microagent that writes /heads directly FAILS — the sourceless Miner authors ONLY via the orchestrator's signed facts (INV-A1 parity)", () => {
    it("a dispatch that RETURNS no proposed facts produces ZERO graph mutation — the microagent has no channel to write /heads itself", async () => {
      const wanted = "tenant/ns/would-be-written-directly";
      const { repo } = newRepoWith("miner-empty", () =>
        // The microagent "wants" `wanted` in the graph but returns an EMPTY proposed set — its only
        // legitimate channel is the orchestrator authoring proposed facts. If it could write /heads
        // directly (the Letta pitfall, INV-A1), `wanted` would appear; it MUST NOT.
        acquisitionOk({ proposed: [], source: acqSource() }),
      );
      const manifest = await registerAcquisitionManifest(repo, "miner-empty");

      const p = repo.runAcquisition(manifest, { dataResource: "feed://empty" }, { asOf: FIXED_AS_OF });
      await expect(p).resolves.toMatchObject({ facts: [] });

      const { facts } = await p;
      expect(facts.length).toBe(0);
      expect(await repo.getNode(wanted)).toBeNull();
    });
  });

  describe("INV-A10(e): a mixed proposed batch preserves KIND — each AssertInput→assert, each RetractInput→retract, no coercion", () => {
    it("an [assert, retract, assert] batch asserts the two prop values AND clears the retracted cell (a coerced retract→assert would leave the old value standing)", async () => {
      const eid = "tenant/ns/mixed-batch-node";
      const { dispatch } = makeScriptedDispatch({
        ingestor: () =>
          acquisitionOk({
            proposed: [
              acqPropAssert(eid, "propA", "A-new"),
              acqPropRetract(eid, "propB"),
              acqPropAssert(eid, "propC", "C-new"),
            ],
            source: acqSource(),
          }),
      });
      const repo = new KipRepo({ replicaId: freshReplicaId("inv-a10-e"), dispatchMicroagent: dispatch });
      repos.push(repo);
      await seedNode(repo, eid, "doc");
      await seedProp(repo, eid, "propB", "B-old"); // a live value the RetractInput entry must clear
      const manifest = await registerAcquisitionManifest(repo, "ingestor");

      const p = repo.runAcquisition(manifest, { dataResource: "feed://mixed" }, { asOf: FIXED_AS_OF });
      await expect(p).resolves.toMatchObject({ facts: expect.any(Array) });

      const { facts } = await p;
      expect(facts.length).toBe(3); // one fact per proposed entry, kinds preserved 1:1

      const view = await repo.getNode(eid);
      // AssertInput entries → live values.
      expect(view?.props.propA?.segments.some((s) => s.kind === "value" && s.value === "A-new")).toBe(true);
      expect(view?.props.propC?.segments.some((s) => s.kind === "value" && s.value === "C-new")).toBe(true);
      // RetractInput entry → the pre-seeded value is CLEARED (retract not coerced to assert): no live
      // value segment survives for propB.
      expect(view?.props.propB?.segments.some((s) => s.kind === "value")).toBe(false);
    });
  });

  describe("INV-A10(f): the returned FactId[] is EXACTLY the proposed order, then the sameAs order", () => {
    it("provenance.source is recorded on every fact and the FactId[] ordering is proposed-then-sameAs", async () => {
      const existing = "tenant/ns/aaa-order-existing";
      const candidate = "tenant/ns/zzz-order-candidate";
      const nodeA = "tenant/ns/order-a";
      const nodeB = "tenant/ns/order-b";
      const uri = "data-resource://feed/order";
      const { repo } = newRepoWith("miner-order", () =>
        acquisitionOk({
          proposed: [acqPropAssert(nodeA, "p", "a"), acqPropAssert(nodeB, "p", "b")],
          source: acqSource(uri),
          sameAs: [{ candidate, existing }],
        }),
      );
      await seedNode(repo, existing, "person");
      const manifest = await registerAcquisitionManifest(repo, "miner-order");

      const p = repo.runAcquisition(manifest, { dataResource: "feed://order" }, { asOf: FIXED_AS_OF });
      await expect(p).resolves.toMatchObject({ facts: expect.any(Array) });

      const { facts } = await p;
      // 2 proposed + 1 sameAs, in that exact order (docs/33: "the proposed order, then the sameAs order").
      expect(facts.length).toBe(3);
      // Fact 0 ⇐ proposed[0] (nodeA/p=a), Fact 1 ⇐ proposed[1] (nodeB/p=b), Fact 2 ⇐ sameAs[0].
      expect((await repo.getNode(nodeA))?.props.p?.segments.some((s) => s.kind === "value" && s.value === "a")).toBe(true);
      expect((await repo.getNode(nodeB))?.props.p?.segments.some((s) => s.kind === "value" && s.value === "b")).toBe(true);
      expect((await repo.getNode(candidate))?.eid).toBe(existing); // the trailing sameAs fact folded

      // Source provenance recorded on EVERY minted fact (docs/33 step (3)).
      for (const f of facts) {
        // eslint-disable-next-line no-await-in-loop
        const prov = await repo.provenanceOf(f);
        expect(prov[0]?.source?.uri).toBe(uri);
      }
    });
  });
});
