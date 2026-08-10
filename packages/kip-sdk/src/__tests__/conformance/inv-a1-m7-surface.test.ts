/**
 * INV-A1 (M7 acquisition-path surface) — microagents-are-clients, exercised specifically for the
 * mining/discovery/ingestion seam `runAcquisition` (docs/60-conformance-and-testability.md#inv-a1,
 * docs/33-mining-discovery-ingestion.md, docs/30-active-knowledge-overview.md §"INV-A1").
 *
 * INV-A1 (verbatim, docs/60): "No active-layer path
 * (registerFunctionality/runContextualQuery/runAcquisition/learn) mutates /heads except by appending
 * a signed fact; run against a harness whose only mutation primitive is assertFact; every state
 * change attributable to a signed fact authored by the orchestrator. Violating build: a bound
 * functionality, encode/decode/learner, or Miner/Ingestor that writes the graph directly."
 *
 * docs/33: "Every family emits signed source-provenanced facts and NEVER writes the graph directly";
 * "the orchestrator, never the agent, calls assertFact"; and D-5b.3's rejected alternative — "a
 * built-in ingestion daemon that writes 'trusted' graph state on import ... would make an unsigned
 * external boundary an authoritative writer (breaking §3.2)."
 *
 * The frozen inv-a1.test.ts already covers the M5 `registerFunctionality`/`runContextualQuery` path;
 * this `-m7-surface` file (mirroring the repo's `-m<N>-surface` milestone-sub-case convention) adds
 * the ACQUISITION path: a scripted family microagent RETURNS an AcquisitionResult, and every observed
 * state change is attributable to an orchestrator-signed fact — the microagent has no other channel.
 *
 * `runAcquisition` is an unimplemented throwing stub this round — the `await expect(p).resolves...`
 * guard makes each test fail NOW as a real assertion (rejected promise), never a type/syntax error.
 */
import { afterEach, describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import {
  FIXED_AS_OF,
  acqNodeAssert,
  acqPropAssert,
  acqSource,
  acquisitionOk,
  freshReplicaId,
  makeScriptedDispatch,
  registerAcquisitionManifest,
} from "./fixtures-m7";

describe("INV-A1 (M7 acquisition path): a family microagent authors ONLY via orchestrator-signed facts, never a direct graph write", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  function mkRepo(handlerName: string, result: () => ReturnType<typeof acquisitionOk>): { repo: KipRepo } {
    const { dispatch } = makeScriptedDispatch({ [handlerName]: () => result() });
    const repo = new KipRepo({ replicaId: freshReplicaId("inv-a1-m7"), dispatchMicroagent: dispatch });
    repos.push(repo);
    return { repo };
  }

  it("every EID runAcquisition materializes is reachable only as an ordinary projected view with real signed provenance", async () => {
    const eid = "tenant/ns/acq-materialized";
    const { repo } = mkRepo("miner", () =>
      acquisitionOk({ proposed: [acqPropAssert(eid, "title", "surfaced")], source: acqSource() }),
    );
    const manifest = await registerAcquisitionManifest(repo, "miner");

    const p = repo.runAcquisition(manifest, { dataResource: "feed://x" }, { asOf: FIXED_AS_OF });
    await expect(p).resolves.toMatchObject({ facts: expect.any(Array) });

    // --- live acceptance criteria (unreachable until M7 lands) ---
    const { facts } = await p;
    // Whatever the acquisition materialized is readable back as an ordinary projected node whose
    // provenance is a real signature — an entity a microagent wrote directly (bypassing assertFact)
    // would not be reachable through this path, nor carry orchestrator provenance.
    const view = await repo.getNode(eid);
    expect(view).not.toBeNull();
    expect(view?.provenance.signature).toBeTruthy();
    // And every returned FactId denotes a real, signed, provenance-bearing fact.
    for (const f of facts) {
      // eslint-disable-next-line no-await-in-loop -- sequential provenance reads
      const prov = await repo.provenanceOf(f);
      expect(prov.length).toBeGreaterThan(0);
      expect(prov[0]?.signature).toBeTruthy();
    }
  });

  it("a microagent that RETURNS nothing effects NO state change — its only mutation channel is the orchestrator authoring proposed facts (the Letta pitfall, N2)", async () => {
    // The scripted Miner "wants" `wanted` in the graph but returns an EMPTY proposed set. If a bound
    // microagent could write /heads directly, `wanted` would appear despite proposing nothing. It
    // MUST NOT — the ONLY substrate mutation primitive is the orchestrator's assertFact.
    const wanted = "tenant/ns/never-authored";
    const { repo } = mkRepo("miner-noop", () => acquisitionOk({ proposed: [], source: acqSource() }));
    const manifest = await registerAcquisitionManifest(repo, "miner-noop");

    const p = repo.runAcquisition(manifest, { dataResource: "feed://noop" }, { asOf: FIXED_AS_OF });
    await expect(p).resolves.toMatchObject({ facts: [] });

    const { facts } = await p;
    expect(facts.length).toBe(0);
    expect(await repo.getNode(wanted)).toBeNull();
  });

  it("acquisition is one privilege-equal client — its facts are the SAME signed facts a human operator authors by hand, never a trusted-on-import back door (D-5b.3)", async () => {
    // A hand-authored node (the "human operator grows the map" path) and a runAcquisition-authored
    // node land as the SAME kind of ordinary signed fact — the acquisition path claims no elevated
    // write privilege (D-5b.3 rejected alternative: an import daemon writing "trusted" graph state).
    const handEid = "tenant/ns/hand-authored";
    const acqEid = "tenant/ns/acq-authored";
    const { repo } = mkRepo("ingestor", () =>
      acquisitionOk({ proposed: [acqNodeAssert(acqEid, "person")], source: acqSource() }),
    );
    await repo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node", eid: handEid, nodeKind: "person" },
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: "human-operator",
      provenance: acqSource("operator://by-hand"),
    });
    const manifest = await registerAcquisitionManifest(repo, "ingestor");

    const p = repo.runAcquisition(manifest, {}, { asOf: FIXED_AS_OF });
    await expect(p).resolves.toMatchObject({ facts: expect.any(Array) });

    // Both nodes exist as ordinary signed projected views — the acquisition path is not a back door.
    const handView = await repo.getNode(handEid);
    const acqView = await repo.getNode(acqEid);
    expect(handView?.provenance.signature).toBeTruthy();
    expect(acqView?.provenance.signature).toBeTruthy();
  });
});
