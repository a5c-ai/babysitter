/**
 * The deterministic Layer-1 entity linker (ADR-B11/B11a/B11b/B11c) — connects a kip repo's `code:*`
 * island (from `kip index`) and its `doc:*` concept island (from `kip learn`) by ASSERTING signed,
 * reversible link edges through the existing `runAcquisition` write path — NEVER by merging identities.
 *
 * `linkResolver(inventory) → AcquisitionResult` is a PURE, deterministic function (INV-A1): it reads
 * ONLY its `NodeInventory` input and authors nothing. The `kip link` CLI performs every graph read
 * (enumerating live nodes via `Repo.nodeEids`, hydrating props via `getNode`), hands the inventory to
 * this resolver as `MicroagentInvocation.input`, and authors the returned link facts via
 * `runAcquisition` — exactly the code-miner lifecycle.
 *
 * UNIMPLEMENTED STUB (this round): both `linkResolver` and `linkResolverDispatch` return an EMPTY
 * `AcquisitionResult`, and `Repo.nodeEids` throws. These are frozen inputs to the implementation phase:
 * the acceptance tests in `src/__tests__/entity-linker.test.ts` assert the REAL behavior and therefore
 * FAIL on their own diffs here (a resolver that emits nothing where a `documents`/`same_as` link is
 * required), never on a type/import error.
 */
import type {
  AssertInput,
  DispatchMicroagentFn,
  EID,
  Provenance,
  PropValue,
  RetractInput,
} from "../index";

/**
 * One hydrated node in the inventory the CLI hands the resolver (ADR-B11): the node's `eid`, its
 * `kind` (`code:*`/`doc:*`), and its projected props as `{ key, value }` entries. The resolver parses
 * code identifiers out of the (hashed-repoId) code eid and reads slugs/prop values off doc concepts.
 */
export interface NodeInventoryEntry {
  eid: EID;
  kind: string;
  props: Array<{ key: string; value: PropValue }>;
}

/** The `NodeInventory` the resolver consumes — a plain array of hydrated nodes (INV-A1: its ONLY input). */
export type NodeInventory = NodeInventoryEntry[];

/**
 * The resolver's output payload — structurally an `AcquisitionResult` (docs/33): `proposed` link edges
 * (`documents` for concept→code), a `source` `Provenance` stamped on every committed fact, and
 * optional `sameAs` cross-doc same-entity pairs. Returned as `MicroagentResult.output`, validated +
 * committed by `runAcquisition`.
 */
export interface LinkResolverResult {
  proposed: Array<AssertInput | RetractInput>;
  source: Provenance;
  sameAs?: Array<{ candidate: EID; existing: EID }>;
}

/** The resolver's dispatch input (ADR-B11: the CLI calls `runAcquisition(manifest, { nodes }, {})`). */
export interface LinkResolverInput {
  nodes: NodeInventory;
}

/** The linker agent id + version (the miner-style `author` on the placeholder provenance). */
const LINKER_AUTHOR = "kip-linker@1.0.0";

/** A placeholder source `Provenance` — the orchestrator re-stamps its own signature at commit (INV-A1). */
function placeholderProvenance(): Provenance {
  return {
    author: LINKER_AUTHOR,
    signature: "",
    publicKeyFingerprint: "",
    signedFields: [],
    source: { uri: "link-resolver://kip-linker" },
  };
}

/**
 * The pure, deterministic Layer-1 linker (ADR-B11). UNIMPLEMENTED: returns an empty `AcquisitionResult`.
 * The real function will emit typed `documents` edges (concept→code exact identifier match) into
 * `proposed` and cross-doc `same_as` pairs into `sameAs`, exact-whole-string-equality only (abstain
 * otherwise, N5), ordered deterministically.
 */
export function linkResolver(_inventory: NodeInventory): LinkResolverResult {
  return { proposed: [], source: placeholderProvenance(), sameAs: [] };
}

/**
 * The injectable dispatch seam (`DispatchMicroagentFn`) `runAcquisition` calls — reads the node
 * inventory off `invocation.input` and returns the `LinkResolverResult` as a successful
 * `MicroagentResult`. It receives ONLY a `MicroagentInvocation` (never a `Repo`), so it structurally
 * cannot write the graph (INV-A1 by construction).
 */
export const linkResolverDispatch: DispatchMicroagentFn = (invocation) => {
  const started = Date.now();
  const input = (invocation.input ?? {}) as Partial<LinkResolverInput>;
  const nodes = Array.isArray(input.nodes) ? input.nodes : [];
  const output = linkResolver(nodes);
  return Promise.resolve({ exitCode: 0, output, elapsedMs: Date.now() - started });
};
