import { describe, it, expect, expectTypeOf } from "vitest";
import * as kip from "../index";

/**
 * ADR-B5 "modularize" refactor guard — pins the PUBLIC SURFACE of the barrel.
 *
 * This package's `index.ts` is being split (per ADR-B5) into `types.ts` + per-concern
 * sibling modules re-exported from an `index.ts` barrel, with ZERO behavior change. The
 * ~79-file conformance/method suite guards behavior; THIS file guards that the split does
 * not accidentally drop or rename anything the public barrel exposes today.
 *
 * Enforcement note (accurate to this repo's build):
 *  - `tsc` (npm run build) EXCLUDES `src/** /*.test.ts`, and `vitest run` transpiles without
 *    type-checking. TypeScript `type`/`interface` exports are therefore erased and NOT
 *    observable at runtime — the runtime-enforcing assertions below cover the *value* exports
 *    and the documented `Repo` method surface (the parts a module split is most likely to
 *    break and that are verifiable at runtime). The exported *type* surface is documented and
 *    compile-referenced via `expectTypeOf` so a dropped type is caught under type-checking.
 */

// -- The exact set of RUNTIME (value) exports the public barrel exposes today. ------------
// (generateEd25519KeyPair/importEd25519KeyPair re-exported from ./signing; KipError/KipRepo
// classes; open() entrypoint. Enumerated from index.ts `export` statements.)
const EXPECTED_VALUE_EXPORTS = [
  "KipError",
  "KipRepo",
  "generateEd25519KeyPair",
  "importEd25519KeyPair",
  "open",
].sort();

// -- Every method the documented `Repo` interface promises (index.ts `interface Repo`). ----
// KipRepo `implements Repo`, so each must be a function on its prototype.
const EXPECTED_REPO_METHODS = [
  // lifecycle / scope
  "branch",
  "withScope",
  "txn",
  "commit",
  // fact authoring
  "assertFact",
  "retractFact",
  "supersedeFact",
  "reAttestFact",
  "ingest",
  // graph writes
  "putNode",
  "putEdge",
  // reads
  "getNode",
  "getEdge",
  "query",
  "recall",
  "asOf",
  // read-only graph-QA citation seam (edge analogue of a PropCell value segment's `assertedBy`;
  // added deliberately for kip-graph-qa.md §3.2/§4 — recorded here so the guard enumerates the
  // FULL documented Repo surface, never silently hides an added method).
  "edgeExistenceFactId",
  // distribution
  "pin",
  "resolvePin",
  "sync",
  "merge",
  "subscribe",
  // provenance / ops
  "provenanceOf",
  "rollup",
  "tombstone",
  "excise",
  "revokeKey",
  "fsck",
  // active layer (§5b)
  "registerFunctionality",
  "compileContextualQuery",
  "executeSegment",
  "runContextualQuery",
  "runAcquisition",
  "learn",
].sort();

describe("public surface (ADR-B5 modularize guard)", () => {
  it("exposes exactly the current runtime value exports", () => {
    const actual = Object.keys(kip)
      .filter((k) => k !== "__esModule" && k !== "default")
      .sort();
    expect(actual).toEqual(EXPECTED_VALUE_EXPORTS);
  });

  it("open() is the async entrypoint", () => {
    expect(typeof kip.open).toBe("function");
  });

  it("KipRepo is a class implementing every documented Repo method", () => {
    expect(typeof kip.KipRepo).toBe("function");
    const proto = kip.KipRepo.prototype as unknown as Record<string, unknown>;
    const present = EXPECTED_REPO_METHODS.filter((m) => typeof proto[m] === "function").sort();
    expect(present).toEqual(EXPECTED_REPO_METHODS);
  });

  it("KipError is an Error subclass", () => {
    expect(typeof kip.KipError).toBe("function");
    expect(kip.KipError.prototype instanceof Error).toBe(true);
  });

  it("re-exports the Ed25519 key helpers", () => {
    expect(typeof kip.generateEd25519KeyPair).toBe("function");
    expect(typeof kip.importEd25519KeyPair).toBe("function");
  });

  // -- Exported TYPE surface (erased at runtime; compile-referenced so a dropped/renamed ---
  // type export is caught under type-checking). Enumerated from index.ts `export type`/
  // `export interface` statements. `expectTypeOf(...).not.toBeAny()` is a no-op at runtime.
  it("pins the exported type surface", () => {
    expectTypeOf<kip.Ed25519KeyPair>().not.toBeAny();
    expectTypeOf<kip.EID>().not.toBeAny();
    expectTypeOf<kip.CID>().not.toBeAny();
    expectTypeOf<kip.FactSetDigest>().not.toBeAny();
    expectTypeOf<kip.NodeKind>().not.toBeAny();
    expectTypeOf<kip.EdgeKind>().not.toBeAny();
    expectTypeOf<kip.PropKey>().not.toBeAny();
    expectTypeOf<kip.ReplicaId>().not.toBeAny();
    expectTypeOf<kip.ActorId>().not.toBeAny();
    expectTypeOf<kip.Ed25519Sig>().not.toBeAny();
    expectTypeOf<kip.FactId>().not.toBeAny();
    expectTypeOf<kip.ChainId>().not.toBeAny();
    expectTypeOf<kip.HlcStamp>().not.toBeAny();
    expectTypeOf<kip.HlcOrTime>().not.toBeAny();
    expectTypeOf<kip.BlobRef>().not.toBeAny();
    expectTypeOf<kip.PropValue>().not.toBeAny();
    expectTypeOf<kip.FactType>().not.toBeAny();
    expectTypeOf<kip.Target>().not.toBeAny();
    expectTypeOf<kip.Provenance>().not.toBeAny();
    expectTypeOf<kip.FactAnnotation>().not.toBeAny();
    expectTypeOf<kip.Fact>().not.toBeAny();
    expectTypeOf<kip.AssertInput>().not.toBeAny();
    expectTypeOf<kip.RetractInput>().not.toBeAny();
    expectTypeOf<kip.SupersedeInput>().not.toBeAny();
    expectTypeOf<kip.ReAttestInput>().not.toBeAny();
    expectTypeOf<kip.CellSegment>().not.toBeAny();
    expectTypeOf<kip.PropCell>().not.toBeAny();
    expectTypeOf<kip.NodeView>().not.toBeAny();
    expectTypeOf<kip.EdgeView>().not.toBeAny();
    expectTypeOf<kip.OpenOptions>().not.toBeAny();
    expectTypeOf<kip.Tx>().not.toBeAny();
    expectTypeOf<kip.ScopeRef>().not.toBeAny();
    expectTypeOf<kip.AsOf>().not.toBeAny();
    expectTypeOf<kip.NodePut>().not.toBeAny();
    expectTypeOf<kip.EdgePut>().not.toBeAny();
    expectTypeOf<kip.TraversalSpec>().not.toBeAny();
    expectTypeOf<kip.RecallQuery>().not.toBeAny();
    expectTypeOf<kip.RecallResult>().not.toBeAny();
    expectTypeOf<kip.ReadView>().not.toBeAny();
    expectTypeOf<kip.RemoteRef>().not.toBeAny();
    expectTypeOf<kip.BranchRef>().not.toBeAny();
    expectTypeOf<kip.SyncOptions>().not.toBeAny();
    expectTypeOf<kip.MergeOptions>().not.toBeAny();
    expectTypeOf<kip.MergeReport>().not.toBeAny();
    expectTypeOf<kip.SyncReport>().not.toBeAny();
    expectTypeOf<kip.Conflict>().not.toBeAny();
    expectTypeOf<kip.RollupOptions>().not.toBeAny();
    expectTypeOf<kip.ExcisionMarker>().not.toBeAny();
    expectTypeOf<kip.FsckReport>().not.toBeAny();
    expectTypeOf<kip.RegeneratedDagCommit>().not.toBeAny();
    expectTypeOf<kip.RegeneratedCommit>().not.toBeAny();
    expectTypeOf<kip.SnapshotRef>().not.toBeAny();
    expectTypeOf<kip.Frontier>().not.toBeAny();
    expectTypeOf<kip.FactDelta>().not.toBeAny();
    expectTypeOf<kip.IsolationMode>().not.toBeAny();
    expectTypeOf<kip.MicroagentManifest>().not.toBeAny();
    expectTypeOf<kip.MicroagentInvocation>().not.toBeAny();
    expectTypeOf<kip.MicroagentResult>().not.toBeAny();
    expectTypeOf<kip.DispatchMicroagentFn>().not.toBeAny();
    expectTypeOf<kip.ConditionNode>().not.toBeAny();
    expectTypeOf<kip.FunctionalityBinding>().not.toBeAny();
    expectTypeOf<kip.ContextualQuery>().not.toBeAny();
    expectTypeOf<kip.Segment>().not.toBeAny();
    expectTypeOf<kip.AnswerGraph>().not.toBeAny();
    expectTypeOf<kip.LearnOptions>().not.toBeAny();
    expectTypeOf<kip.BlobRefInput>().not.toBeAny();
    expectTypeOf<kip.KipErrorCode>().not.toBeAny();
    expectTypeOf<kip.Repo>().not.toBeAny();
    // KipError / KipRepo are also usable as types (class exports).
    expectTypeOf<kip.KipError>().not.toBeAny();
    expectTypeOf<kip.KipRepo>().not.toBeAny();
    expect(true).toBe(true);
  });
});
