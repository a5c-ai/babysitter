/**
 * M7 (Active knowledge: mining / discovery / ingestion — `runAcquisition()`) shared test support.
 *
 * NEW for M7 — reuses ONLY the public surface declared in `src/index.ts` and the (already-frozen)
 * M6 dispatch idiom in `fixtures-m6.ts` (`makeScriptedDispatch`, `buildManifest`, `registerManifest`,
 * `freshReplicaId`, `FIXED_AS_OF`). Per this round's hard rule, nothing here reads or mirrors the
 * unimplemented `runAcquisition` impl body (it throws `unimplemented: runAcquisition`).
 *
 * The acquisition families (Miner / Discoverer / Ingestor / RDF Ingestor) are genty microagents
 * dispatched through the SAME injectable `dispatchMicroagent` seam M6's `learn()` uses. A scripted
 * dispatch returns a `MicroagentResult` whose `output` is an `AcquisitionResult` payload (docs/33
 * §"AcquisitionResult → facts data flow"): the microagent RETURNS data, and it is the orchestrator's
 * fact-authoring (INV-A1: only the orchestrator calls `assertFact`) that these tests exercise.
 *
 * Every `runAcquisition`-driven test here is EXPECTED TO FAIL on a real assertion (a rejected promise
 * where a `{ facts }` resolution was expected) — never on a type/syntax/import error — because
 * `runAcquisition` is still an unimplemented throwing stub. These frozen tests become the M7
 * acceptance criteria.
 */
import {
  type AssertInput,
  type EID,
  type MicroagentManifest,
  type MicroagentResult,
  type Provenance,
  type PropValue,
  type Repo,
  type RetractInput,
} from "../../index";
import { buildManifest, freshReplicaId, makeScriptedDispatch, registerManifest } from "./fixtures-m6";

// Re-export the M6 idiom helpers so an M7 test file has a single import site.
export { buildManifest, freshReplicaId, makeScriptedDispatch, registerManifest };
export { FIXED_AS_OF } from "./fixtures-m6";

/**
 * The `AcquisitionResult` shape — docs/33 §"AcquisitionResult → facts data flow (pinned)",
 * transcribed VERBATIM and typed against the exported `AssertInput`/`RetractInput`/`Provenance`/`EID`
 * surface. It is deliberately NOT a type on the public `Repo` surface (it is the microagent's OUTPUT
 * payload, validated by the orchestrator against the manifest `outputSchema`), so it is defined here.
 *
 *   proposed  — assert/retract entries, each committed IN ORDER with its OWN kind preserved (a mixed
 *               batch is committed verbatim, never coerced): an `AssertInput` mints a signed `assert`,
 *               a `RetractInput` a signed `retract` (INV-A10(e)).
 *   source    — source provenance recorded on EVERY emitted fact (data-resource id, fetch time, agent
 *               id+ver).
 *   sameAs    — EIDs the agent believes duplicate an existing instance (patent node-merge) — emitted
 *               as signed `same_as` facts, NEVER an in-place rewrite (INV-A10(b)).
 */
export interface AcquisitionResult {
  proposed: ReadonlyArray<AssertInput | RetractInput>;
  source: Provenance;
  sameAs?: ReadonlyArray<{ candidate: EID; existing: EID }>;
}

/**
 * A data-resource source `Provenance` (docs/33: "data-resource id, fetch time, agent id+ver"). The
 * `.source.uri` carries the data-resource id so the recorded `provenance.source` is observable via
 * `provenanceOf` on every minted fact. `signature`/`publicKeyFingerprint`/`signedFields` are empty
 * placeholders — the orchestrator re-stamps its OWN signature when it authors each fact (INV-A1).
 */
export function acqSource(uri = "data-resource://feed/m7-fixture", overrides: Partial<Provenance> = {}): Provenance {
  return {
    author: "m7-acquisition-agent",
    signature: "",
    publicKeyFingerprint: "",
    signedFields: [],
    source: { uri },
    ...overrides,
  };
}

/** A node-existence `AssertInput` — an object-of-interest a Miner surfaces (getNode(eid) resolves). */
export function acqNodeAssert(eid: EID, nodeKind = "candidate", replicaId = "m7-acq-candidate"): AssertInput {
  return {
    type: "assert",
    v: 1,
    target: { kind: "node", eid, nodeKind },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId,
    provenance: acqSource(),
  };
}

/** A node-prop `AssertInput` — a scalar prop assert readable back via `getNode(eid).props[prop]`. */
export function acqPropAssert(eid: EID, prop: string, value: PropValue, replicaId = "m7-acq-candidate"): AssertInput {
  return {
    type: "assert",
    v: 1,
    target: { kind: "node-prop", eid, prop },
    value,
    validFrom: 0,
    validTo: null,
    replicaId,
    provenance: acqSource(),
  };
}

/** A node-prop `RetractInput` — a retract entry in a mixed `proposed` batch (clears the cell to
 *  `unknown`, docs/21 retract-split; a build that COERCES this to an `assert` fails INV-A10(e)). */
export function acqPropRetract(eid: EID, prop: string, replicaId = "m7-acq-candidate"): RetractInput {
  return {
    type: "retract",
    v: 1,
    target: { kind: "node-prop", eid, prop },
    validFrom: 0,
    validTo: null,
    replicaId,
    provenance: acqSource(),
  };
}

/** Wraps an `AcquisitionResult` as a successful (`exitCode: 0`) `MicroagentResult.output` — the
 *  scripted family microagent's return value the orchestrator validates + maps. */
export function acquisitionOk(result: AcquisitionResult): MicroagentResult {
  return { exitCode: 0, output: result, elapsedMs: 0 };
}

/**
 * Builds AND registers a standalone acquisition-family manifest (a Miner/Discoverer/Ingestor/RDF
 * microagent — none is edge-bound), returning it. Registration mints the signature-valid
 * `(name,version)` registration fact `runAcquisition` requires (ERR_UNREGISTERED_MANIFEST, docs/40).
 */
export async function registerAcquisitionManifest(repo: Repo, name: string): Promise<MicroagentManifest> {
  const manifest = buildManifest({ name });
  await registerManifest(repo as unknown as import("../../index").KipRepo, manifest);
  return manifest;
}

/** Seeds a bare node-existence fact directly (the M0 mint-then-ingest path) — used to build the
 *  Discoverer fixture graph and to pre-seed a cell a later `retract` clears (INV-A10(e)). */
export async function seedNode(repo: Repo, eid: EID, nodeKind = "candidate", replicaId = "m7-seed"): Promise<void> {
  await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "node", eid, nodeKind },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId,
    provenance: acqSource(),
  });
}

/** Seeds a node-prop fact directly (pre-seed a value a later acquisition `retract` must clear). */
export async function seedProp(repo: Repo, eid: EID, prop: string, value: PropValue, replicaId = "m7-seed"): Promise<void> {
  await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "node-prop", eid, prop },
    value,
    validFrom: 0,
    validTo: null,
    replicaId,
    provenance: acqSource(),
  });
}

/** Seeds a signed edge-existence fact directly (builds the Discoverer bounded-traversal fixture
 *  graph). `edgeKind` is a plain string (docs/31: a `same_as`/relation edge is an ordinary edge). */
export async function seedEdge(
  repo: Repo,
  from: EID,
  to: EID,
  edgeKind = "related",
  replicaId = "m7-seed",
): Promise<void> {
  await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "edge", eid: `${edgeKind}/${from}/${to}`, edgeKind, from, to },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId,
    provenance: acqSource(),
  });
}

/** A signed `not_same_as(a,b)` edge from a SECOND key — contradicts a Miner-emitted `same_as(a,b)`
 *  merge so the disputed pair surfaces `kip:conflict` (INV-A10(b), mirrors inv-a11.test.ts). */
export async function seedNotSameAs(repo: Repo, a: EID, b: EID, replicaId = "m7-second-key"): Promise<void> {
  await repo.assertFact({
    type: "assert",
    v: 1,
    target: { kind: "edge", eid: `not_same_as/${replicaId}/${a}/${b}`, edgeKind: "not_same_as", from: a, to: b },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId,
    provenance: { author: "m7-second-key", signature: "", publicKeyFingerprint: "", signedFields: [] },
  });
}

/** Drains an async-iterable traversal into an array (INV-A10(c) bounded-crawl assertion). */
export async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const item of iter) out.push(item);
  return out;
}
