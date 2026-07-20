/**
 * `src/learn/compile.ts` — the SHARED narrow-graph → `AssertInput[]` compiler (ADR-B10, ADR-B10b).
 *
 * The crux of ADR-B10: **the model NEVER emits `AssertInput`.** Encode and the learner ask the model
 * for a narrow `{nodes, edges}` JSON and the BODY compiles it into well-formed `AssertInput[]` using
 * the same four constructors `miner/code-miner.ts:476-526` uses, shared here so the two roles'
 * well-formedness can never drift.
 *
 * Well-formedness is achieved BY CONSTRUCTION here, never by hope: every envelope field
 * (`type`/`v`/`validFrom`/`validTo`/`replicaId`/`provenance`) is supplied by this compiler, so
 * `isAssertInputArray` (`kip-repo.ts:5619-5659`) passes field by field. The model is asked for
 * nothing but `{nodes, edges}`.
 */
import type { AssertInput, PropValue, Provenance } from "../index";

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
export function compileGraphToAssertInputs(graph: LearnGraph, opts: CompileGraphOptions): AssertInput[] {
  if (!isRecord(graph)) throw new Error("compileGraphToAssertInputs: the graph must be an object");
  const { nodes, edges } = graph;
  if (!Array.isArray(nodes)) throw new Error("compileGraphToAssertInputs: `nodes` must be an array");
  if (!Array.isArray(edges)) throw new Error("compileGraphToAssertInputs: `edges` must be an array");
  // An EMPTY node set would compile to an empty candidate array, which `learn()` would happily score
  // and — at a lax threshold — "accept", committing nothing while reporting success. Refuse it.
  if (nodes.length === 0) {
    throw new Error("compileGraphToAssertInputs: `nodes` is empty — refusing to compile an empty graph");
  }

  const provenance = (): Provenance => ({
    // The orchestrator OVERWRITES this at commit time (`kip-repo.ts:5222-5233`); it is a placeholder
    // that never becomes authoritative identity (INV-A1).
    author: opts.replicaId,
    signature: "",
    publicKeyFingerprint: "",
    signedFields: [],
    source: { uri: opts.source },
  });

  const out: AssertInput[] = [];
  const nodeEids = new Set<string>();

  for (const node of nodes) {
    if (!isRecord(node)) throw new Error("compileGraphToAssertInputs: every node must be an object");
    const eid = requireNonEmptyString(node.eid, "node.eid");
    const nodeKind = requireNonEmptyString(node.kind, `node ${eid}: kind`);
    if (nodeEids.has(eid)) {
      throw new Error(`compileGraphToAssertInputs: duplicate node eid ${JSON.stringify(eid)}`);
    }
    nodeEids.add(eid);
    // ADR-B10d trap 5: the EXPLICIT existence candidate carrying `nodeKind`. Without it,
    // `ensureExistenceFor` mints a kind-LESS existence fact that folds over and blanks `NodeView.kind`.
    out.push({
      type: "assert",
      v: 1,
      target: { kind: "node", eid, nodeKind },
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: opts.replicaId,
      provenance: provenance(),
    });
    for (const [prop, value] of propEntries(node.props, `node ${eid}`)) {
      out.push({
        type: "assert",
        v: 1,
        target: { kind: "node-prop", eid, prop },
        value,
        validFrom: 0,
        validTo: null,
        replicaId: opts.replicaId,
        provenance: provenance(),
      });
    }
  }

  const edgeCandidates: AssertInput[] = [];
  const edgeEids = new Set<string>();
  for (const edge of edges) {
    if (!isRecord(edge)) throw new Error("compileGraphToAssertInputs: every edge must be an object");
    const eid = requireNonEmptyString(edge.eid, "edge.eid");
    const edgeKind = requireNonEmptyString(edge.edgeKind, `edge ${eid}: edgeKind`);
    const from = requireNonEmptyString(edge.from, `edge ${eid}: from`);
    const to = requireNonEmptyString(edge.to, `edge ${eid}: to`);
    if (edgeEids.has(eid)) {
      throw new Error(`compileGraphToAssertInputs: duplicate edge eid ${JSON.stringify(eid)}`);
    }
    edgeEids.add(eid);
    // ADR-B10d trap 6 — THE one integrity check the core does not do: a dangling `from`/`to` passes
    // `isWellFormedTarget` (it only checks the edge's OWN eid) and commits an edge into nothing.
    // REJECTED here, naming the offending endpoint — never silently repaired and never silently dropped.
    for (const [role, endpoint] of [["from", from], ["to", to]] as const) {
      if (!nodeEids.has(endpoint)) {
        throw new Error(
          `compileGraphToAssertInputs: edge ${JSON.stringify(eid)} has a dangling ${role} endpoint ` +
            `${JSON.stringify(endpoint)} — no node with that eid is present in this graph ` +
            "(committing it would create an edge into a non-existent node)",
        );
      }
    }
    edgeCandidates.push({
      type: "assert",
      v: 1,
      target: { kind: "edge", eid, edgeKind, from, to },
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: opts.replicaId,
      provenance: provenance(),
    });
    for (const [prop, value] of propEntries(edge.props, `edge ${eid}`)) {
      edgeCandidates.push({
        type: "assert",
        v: 1,
        target: { kind: "edge-prop", eid, prop },
        value,
        validFrom: 0,
        validTo: null,
        replicaId: opts.replicaId,
        provenance: provenance(),
      });
    }
  }

  return [...out, ...edgeCandidates];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(value: unknown, what: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`compileGraphToAssertInputs: ${what} must be a non-empty string, got ${JSON.stringify(value)}`);
  }
  return value;
}

/** `props` entries, each validated as a real `PropValue` with a non-empty KEY (`well-formed.ts:139`). */
function propEntries(props: unknown, what: string): Array<[string, PropValue]> {
  if (props === undefined || props === null) return [];
  if (!isRecord(props)) throw new Error(`compileGraphToAssertInputs: ${what}: props must be an object`);
  return Object.entries(props).map(([prop, value]) => {
    if (prop.length === 0) throw new Error(`compileGraphToAssertInputs: ${what}: a prop key is empty`);
    if (!isPropValue(value)) {
      throw new Error(
        `compileGraphToAssertInputs: ${what}: prop ${JSON.stringify(prop)} is not a PropValue ` +
          `(string | number | boolean | null | BlobRef), got ${JSON.stringify(value)}`,
      );
    }
    return [prop, value] as [string, PropValue];
  });
}

function isPropValue(value: unknown): value is PropValue {
  if (value === null) return true;
  const t = typeof value;
  if (t === "string" || t === "boolean") return true;
  if (t === "number") return Number.isFinite(value as number);
  // The one object-shaped `PropValue`: a `BlobRef` (`types.ts:88`).
  return isRecord(value) && typeof value.blob === "string" && value.blob.length > 0;
}
