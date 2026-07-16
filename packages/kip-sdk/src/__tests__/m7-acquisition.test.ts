/**
 * M7 method-acceptance — `runAcquisition(manifest, input, opts?)` and the AcquisitionResult → facts
 * mapping (docs/33-mining-discovery-ingestion.md, docs/40-sdk-api-surface.md §"runAcquisition").
 *
 * runAcquisition is the SOURCELESS (non-edge-bound) seam for the Miner / Discoverer / Ingestor / RDF
 * Ingestor families — "privilege-equal genty-microagent clients" (docs/33). The orchestrator
 * dispatches the family microagent through the injectable `dispatchMicroagent` seam, then commits its
 * `AcquisitionResult.proposed` as signed facts (quarantined until trusted), maps `sameAs → same_as`,
 * records `source` on every fact, and returns the ordered `{ facts: FactId[] }` (proposed order then
 * sameAs order). INV-A1 holds throughout: the microagent RETURNS data; only the orchestrator calls
 * `assertFact`.
 *
 * These acceptance tests are the frozen criteria for the M7 implementation. `runAcquisition` is an
 * unimplemented throwing stub this round — every test is EXPECTED TO FAIL on the leading
 * `await expect(p).resolves...` guard (a rejected promise), never on a type/syntax/import error. The
 * acquisition family is scripted via `makeScriptedDispatch` (the M6 idiom): the handler returns an
 * `AcquisitionResult` payload as `MicroagentResult.output`, so what is under test is the
 * orchestrator's fact-authoring, not any real crawler (docs/33 D-5b.3: "kip provides the
 * recall/traversal/dedup primitives, not the crawlers").
 */
import { afterEach, describe, expect, it } from "vitest";
import { KipRepo } from "../index";
import type { RecordedInvocation } from "./conformance/fixtures-m6";
import {
  FIXED_AS_OF,
  acqNodeAssert,
  acqPropAssert,
  acqSource,
  acquisitionOk,
  buildManifest,
  freshReplicaId,
  makeScriptedDispatch,
  registerAcquisitionManifest,
  seedNode,
} from "./conformance/fixtures-m7";

describe("M7 runAcquisition — dispatches a standalone family microagent and commits its AcquisitionResult as orchestrator-signed facts", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  it("dispatches the family microagent EXACTLY once with the caller's input, and commits proposed as signed facts (returns { facts })", async () => {
    const eid = "tenant/ns/miner-obj";
    const log: RecordedInvocation[] = [];
    const { dispatch } = makeScriptedDispatch(
      { miner: () => acquisitionOk({ proposed: [acqNodeAssert(eid, "person")], source: acqSource() }) },
      log,
    );
    const repo = new KipRepo({ replicaId: freshReplicaId("m7-dispatch"), dispatchMicroagent: dispatch });
    repos.push(repo);
    const manifest = await registerAcquisitionManifest(repo, "miner");
    const input = { dataResource: "api://people/page/1" };

    const p = repo.runAcquisition(manifest, input, { asOf: FIXED_AS_OF });
    await expect(p).resolves.toMatchObject({ facts: expect.any(Array) });

    // --- live acceptance criteria (unreachable until M7 lands) ---
    const { facts } = await p;
    expect(facts.length).toBe(1);
    // The microagent was dispatched exactly once, through the SAME injectable seam, with the caller's
    // input threaded verbatim.
    expect(log.length).toBe(1);
    expect(log[0]?.invocation.manifest.name).toBe(manifest.name);
    expect(log[0]?.invocation.input).toEqual(input);
    // The proposed object-of-interest is now an ordinary projected node.
    expect(await repo.getNode(eid)).not.toBeNull();
  });

  it("maps each proposed AssertInput → exactly one signed assert fact (one FactId per proposed entry)", async () => {
    const e1 = "tenant/ns/multi-1";
    const e2 = "tenant/ns/multi-2";
    const e3 = "tenant/ns/multi-3";
    const { repo } = mkRepo("miner-multi", () =>
      acquisitionOk({
        proposed: [acqPropAssert(e1, "p", 1), acqPropAssert(e2, "p", 2), acqPropAssert(e3, "p", 3)],
        source: acqSource(),
      }),
    );
    const manifest = await registerAcquisitionManifest(repo, "miner-multi");

    const p = repo.runAcquisition(manifest, {}, { asOf: FIXED_AS_OF });
    await expect(p).resolves.toMatchObject({ facts: expect.any(Array) });

    const { facts } = await p;
    expect(facts.length).toBe(3);
    // Content-addressed FactIds are distinct for the three distinct facts.
    expect(new Set(facts).size).toBe(3);
    expect((await repo.getNode(e1))?.props.p?.segments.some((s) => s.kind === "value" && s.value === 1)).toBe(true);
    expect((await repo.getNode(e3))?.props.p?.segments.some((s) => s.kind === "value" && s.value === 3)).toBe(true);
  });

  it("maps each sameAs entry → exactly one signed same_as(candidate, existing) fact appended AFTER the proposed facts", async () => {
    const existing = "tenant/ns/aaa-canon";
    const candidate = "tenant/ns/zzz-dup";
    const obj = "tenant/ns/mid-obj";
    const { repo } = mkRepo("miner-sameas", () =>
      acquisitionOk({
        proposed: [acqPropAssert(obj, "p", "x")],
        source: acqSource(),
        sameAs: [{ candidate, existing }],
      }),
    );
    await seedNode(repo, existing, "person");
    const manifest = await registerAcquisitionManifest(repo, "miner-sameas");

    const p = repo.runAcquisition(manifest, {}, { asOf: FIXED_AS_OF });
    await expect(p).resolves.toMatchObject({ facts: expect.any(Array) });

    const { facts } = await p;
    // 1 proposed + 1 sameAs.
    expect(facts.length).toBe(2);
    // sameAs folded to the canonical merge (patent node-merge) — a signed same_as fact, not a rewrite.
    expect((await repo.getNode(candidate))?.eid).toBe(existing);
  });

  it("records AcquisitionResult.source as provenance.source on EVERY minted fact (proposed and sameAs alike)", async () => {
    const existing = "tenant/ns/aaa-src-canon";
    const candidate = "tenant/ns/zzz-src-dup";
    const obj = "tenant/ns/src-obj";
    const uri = "data-resource://feed/provenanced";
    const { repo } = mkRepo("miner-source", () =>
      acquisitionOk({
        proposed: [acqPropAssert(obj, "p", "y")],
        source: acqSource(uri),
        sameAs: [{ candidate, existing }],
      }),
    );
    await seedNode(repo, existing, "person");
    const manifest = await registerAcquisitionManifest(repo, "miner-source");

    const p = repo.runAcquisition(manifest, {}, { asOf: FIXED_AS_OF });
    await expect(p).resolves.toMatchObject({ facts: expect.any(Array) });

    const { facts } = await p;
    expect(facts.length).toBe(2);
    for (const f of facts) {
      // eslint-disable-next-line no-await-in-loop -- sequential provenance reads
      const prov = await repo.provenanceOf(f);
      expect(prov.length).toBeGreaterThan(0);
      expect(prov[0]?.signature).toBeTruthy(); // orchestrator-signed (INV-A1)
      expect(prov[0]?.source?.uri).toBe(uri); // source recorded on every fact (docs/33 step 3)
    }
  });

  it("is privilege-equal across families — Miner / Discoverer / Ingestor / RDF-Ingestor all commit through the SAME runAcquisition seam", async () => {
    // The open-set rule (docs/33): ANY manifest whose output validates as an AcquisitionResult is a
    // valid, sourceless acquisition family member — invoked via the SAME runAcquisition seam, with the
    // SAME orchestrator-commits-the-facts lifecycle. Parameterizing over the four named families
    // proves none is special-cased.
    for (const family of ["miner", "discoverer", "ingestor", "rdf-ingestor"]) {
      const eid = `tenant/ns/${family}-out`;
      const { repo } = mkRepo(family, () =>
        acquisitionOk({ proposed: [acqPropAssert(eid, "family", family)], source: acqSource() }),
      );
      // eslint-disable-next-line no-await-in-loop -- distinct repo per family
      const manifest = await registerAcquisitionManifest(repo, family);
      const p = repo.runAcquisition(manifest, { family }, { asOf: FIXED_AS_OF });
      // eslint-disable-next-line no-await-in-loop
      await expect(p).resolves.toMatchObject({ facts: expect.any(Array) });
      // eslint-disable-next-line no-await-in-loop
      const { facts } = await p;
      expect(facts.length).toBe(1);
      // eslint-disable-next-line no-await-in-loop
      const view = await repo.getNode(eid);
      expect(view?.props.family?.segments.some((s) => s.kind === "value" && s.value === family)).toBe(true);
    }
  });

  it("threads opts.asOf as the reproducibility pin (R5) — an explicit frontier drives a reproducible mining run", async () => {
    const eid = "tenant/ns/asof-obj";
    const log: RecordedInvocation[] = [];
    const { dispatch } = makeScriptedDispatch(
      { miner: () => acquisitionOk({ proposed: [acqNodeAssert(eid, "person")], source: acqSource() }) },
      log,
    );
    const repo = new KipRepo({ replicaId: freshReplicaId("m7-asof"), dispatchMicroagent: dispatch });
    repos.push(repo);
    const manifest = await registerAcquisitionManifest(repo, "miner");

    const p = repo.runAcquisition(manifest, {}, { asOf: FIXED_AS_OF });
    // The explicit asOf frontier is accepted (R5) — no throw for a pinned reproducible run.
    await expect(p).resolves.toMatchObject({ facts: expect.any(Array) });
    const { facts } = await p;
    expect(facts.length).toBe(1);
  });

  it("N5 (fail loud, never a best-effort accept): a dispatched microagent returning a non-zero exitCode is rejected with ERR_MALFORMED_INPUT and authors NO facts", async () => {
    const eid = "tenant/ns/failed-dispatch-obj";
    const { dispatch } = makeScriptedDispatch({
      // The handler "wants" `eid` in the graph but reports failure (exitCode !== 0) — its output must
      // NOT be committed.
      miner: () => ({ exitCode: 3, output: { proposed: [acqNodeAssert(eid, "person")], source: acqSource() }, elapsedMs: 0 }),
    });
    const repo = new KipRepo({ replicaId: freshReplicaId("m7-fail"), dispatchMicroagent: dispatch });
    repos.push(repo);
    const manifest = await registerAcquisitionManifest(repo, "miner");

    const p = repo.runAcquisition(manifest, {}, { asOf: FIXED_AS_OF });
    await expect(p).rejects.toMatchObject({ code: "ERR_MALFORMED_INPUT" });
    expect(await repo.getNode(eid)).toBeNull();
  });

  it("N5: an UNREGISTERED (name,version) is rejected with ERR_UNREGISTERED_MANIFEST BEFORE any dispatch — no microagent runs, no fact is authored", async () => {
    const log: RecordedInvocation[] = [];
    const { dispatch } = makeScriptedDispatch(
      { miner: () => acquisitionOk({ proposed: [], source: acqSource() }) },
      log,
    );
    const repo = new KipRepo({ replicaId: freshReplicaId("m7-unreg"), dispatchMicroagent: dispatch });
    repos.push(repo);
    // Build a manifest but DELIBERATELY do not register it.
    const manifest = { ...(await unregisteredManifest()) };

    const p = repo.runAcquisition(manifest, {}, { asOf: FIXED_AS_OF });
    await expect(p).rejects.toMatchObject({ code: "ERR_UNREGISTERED_MANIFEST" });
    expect(log.length).toBe(0); // rejected before dispatch
  });

  function mkRepo(handlerName: string, result: () => ReturnType<typeof acquisitionOk>): { repo: KipRepo } {
    const { dispatch } = makeScriptedDispatch({ [handlerName]: () => result() });
    const repo = new KipRepo({ replicaId: freshReplicaId("m7"), dispatchMicroagent: dispatch });
    repos.push(repo);
    return { repo };
  }

  async function unregisteredManifest(): Promise<import("../index").MicroagentManifest> {
    // A structurally-valid manifest that is never registered (no signature-valid registration fact).
    return buildManifest({ name: "miner", version: "9.9.9" });
  }
});
