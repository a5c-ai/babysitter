/**
 * `src/learn/compile.ts` — the SHARED narrow-graph → `AssertInput[]` compiler (ADR-B10, ADR-B10b).
 *
 * The crux of ADR-B10: **the model NEVER emits `AssertInput`.** Encode and the learner ask the model
 * for a narrow `{nodes, edges}` JSON and the BODY compiles it into well-formed `AssertInput[]` using
 * the same four constructors `miner/code-miner.ts:476-526` uses, shared here so the two roles'
 * well-formedness can never drift.
 *
 * IMPLEMENTATION STATUS: this module is an UNIMPLEMENTED PLACEHOLDER for the `text-autoencoder`
 * work item. `compileGraphToAssertInputs` returns an EMPTY candidate set and validates nothing, so
 * every frozen assertion in `src/__tests__/text-autoencoder.test.ts` fails on its own diff (never on
 * a type/syntax/import error). Do not "fix" the tests to match this stub.
 */
import type { AssertInput, PropValue } from "../index";

/** One model-proposed node in the narrow `{nodes, edges}` reply shape (ADR-B10b, encode/learner). */
export interface LearnGraphNode {
  eid: string;
  kind: string;
  props?: Record<string, PropValue>;
}

/** One model-proposed edge in the narrow `{nodes, edges}` reply shape (ADR-B10b, encode/learner). */
export interface LearnGraphEdge {
  eid: string;
  edgeKind: string;
  from: string;
  to: string;
  props?: Record<string, PropValue>;
}

/** The exact narrow JSON both encode and the learner ask the model for (ADR-B10b). */
export interface LearnGraph {
  nodes: LearnGraphNode[];
  edges: LearnGraphEdge[];
}

/** Envelope fields the model is NEVER asked for — supplied by the compiler (ADR-B10). */
export interface CompileGraphOptions {
  /** `"kip-learn-encode"` / `"kip-learn-learner"` — re-stamped by `learn()` at commit time anyway. */
  replicaId: string;
  /** `provenance.source.uri`, `kip-learn://<rawRef.blob>` (ADR-B10b). */
  source: string;
}

/**
 * Validates the model's narrow graph and compiles it to well-formed `AssertInput[]`.
 *
 * MUST throw (never silently drop/repair) when: `nodes` is empty; any `eid` is not a non-empty
 * string; any prop KEY is empty; any prop VALUE is not a `PropValue`; or any edge `from`/`to` names
 * an eid **not present in `nodes`** (ADR-B10d trap 6 — the one integrity check the core does not do
 * for you: a dangling endpoint passes `isWellFormedTarget` and commits an edge into nothing).
 *
 * MUST emit an EXPLICIT `{kind:"node", eid, nodeKind}` / `{kind:"edge", eid, edgeKind, from, to}`
 * existence candidate alongside the props (ADR-B10d trap 5) so `learn()`'s D-39 pre-seed
 * (`kip-repo.ts:5210-5212`) does not mint a second, kind-LESS existence fact that blanks
 * `NodeView.kind`.
 */
export function compileGraphToAssertInputs(_graph: LearnGraph, _opts: CompileGraphOptions): AssertInput[] {
  // UNIMPLEMENTED PLACEHOLDER (text-autoencoder). Returns an empty set so the frozen tests fail on
  // their own value assertions rather than on a thrown "unimplemented".
  return [];
}
