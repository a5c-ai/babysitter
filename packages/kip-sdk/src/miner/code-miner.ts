/**
 * The bash-tool code-analysis Miner (M7 acquisition family) — ADR-B9/B9a/B9b/B9c.
 *
 * A standalone (sourceless, non-edge-bound) Miner microagent: given a repository directory it runs
 * static analysis over the tracked source tree and returns candidate objects-of-interest as an
 * `AcquisitionResult` payload. The orchestrator (`Repo.runAcquisition`) — NEVER this module — turns
 * that payload into signed, source-provenanced kip facts (INV-A1: the miner authors nothing).
 *
 * ============================================================================================
 * FROZEN-TESTS ROUND — UNIMPLEMENTED STUB.
 * ============================================================================================
 * This file is a MINIMAL typed placeholder so the frozen acceptance tests
 * (`src/__tests__/code-miner.test.ts`) COMPILE and FAIL ON THEIR ASSERTIONS, never on an
 * import/type error. `buildCodeMinerResult` returns an EMPTY candidate set with a placeholder
 * `source` that carries NO `code-resource://` uri, so every acceptance assertion fails on its diff.
 * The real implementation (guaranteed git+node-builtin scan + probed-and-skipped external tools,
 * ADR-B9a; `code:`-namespaced path-derived-EID facts, ADR-B9b) replaces this body in a later phase.
 */
import type { AssertInput, DispatchMicroagentFn, EID, Provenance, RetractInput } from "../index";

/** The Miner's dispatch input (ADR-B9: `{ repoDir, gitSha?, include?, exclude? }`). */
export interface CodeMinerInput {
  /** The repository directory to scan. */
  repoDir: string;
  /** The git HEAD sha the scan is anchored to (the `code-resource://<repoId>@<gitSha>` anchor). */
  gitSha?: string;
  /** Optional include globs (advisory). */
  include?: string[];
  /** Optional exclude globs (advisory). */
  exclude?: string[];
}

/**
 * The Miner's output payload — structurally an `AcquisitionResult` (docs/33 §"AcquisitionResult →
 * facts data flow"): `proposed` candidate facts, a single `source` `Provenance` recorded on every
 * committed fact, and optional `sameAs` node-merge pairs. Returned as `MicroagentResult.output` and
 * validated + committed by `runAcquisition`.
 */
export interface CodeMinerResult {
  proposed: Array<AssertInput | RetractInput>;
  source: Provenance;
  sameAs?: Array<{ candidate: EID; existing: EID }>;
}

/**
 * UNIMPLEMENTED placeholder — see the file header. Returns an empty candidate set with a source that
 * carries no `code-resource://` uri, so the frozen acceptance assertions fail on their diffs.
 */
export function buildCodeMinerResult(_input: CodeMinerInput): CodeMinerResult {
  return {
    proposed: [],
    source: {
      author: "code-miner@1.0.0",
      signature: "",
      publicKeyFingerprint: "",
      signedFields: [],
    },
  };
}

/**
 * The injectable dispatch seam (`DispatchMicroagentFn`) `runAcquisition` calls — reads the Miner
 * input off `invocation.input` and returns the `CodeMinerResult` as a successful `MicroagentResult`.
 * It receives ONLY a `MicroagentInvocation` — never a `Repo` — so it structurally cannot write the
 * graph (INV-A1 by construction).
 */
export const codeMinerDispatch: DispatchMicroagentFn = (invocation) =>
  Promise.resolve({ exitCode: 0, output: buildCodeMinerResult(invocation.input as CodeMinerInput), elapsedMs: 0 });
