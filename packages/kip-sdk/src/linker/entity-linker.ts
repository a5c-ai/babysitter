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

/** The placeholder replicaId on every emitted candidate — the orchestrator re-stamps it (INV-A1). */
const LINKER_REPLICA = "kip-linker";

/** The concept→code edge kind (ADR-B11a): a concept DOCUMENTS an implementation. */
const DOCUMENTS_EDGE_KIND = "documents";

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

// --- normalization (ADR-B11, pinned) -----------------------------------------------------------

/**
 * `N_path` — NFC + trim + `\`→`/` + strip ONE leading `./`, CASE PRESERVED. Paths/symbols/packages are
 * case-significant (folding would collide `Foo.ts`/`foo.ts`), so the concept→code match keeps case.
 */
function normPath(s: string): string {
  const t = s.normalize("NFC").trim().replace(/\\/g, "/");
  return t.startsWith("./") ? t.slice(2) : t;
}

/**
 * `N_name` — NFC + trim + collapse internal whitespace + `toLowerCase` (non-locale). Used for the
 * cross-doc same-entity name case ONLY (a real-world name is case/whitespace-insensitive).
 */
function normName(s: string): string {
  return s.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

// --- identifier parsing (ADR-B11: code nodes carry NO name prop → parse out of the hashed eid) -----

/**
 * Recover the code identifier from a `code:*` eid (case-preserved `N_path`), or `null` for an eid whose
 * shape does not match its declared kind (abstain, N5). Code eids embed a hashed `repoId`:
 *   `code:module:<repoId>:<relPath>`  → relPath (verbatim after the first-`:`-delimited repoId).
 *   `code:symbol:<repoId>:<relPath>#<sym>` → the symbol after the FINAL `#`.
 *   `code:package:<repoId>:<pkg>`     → pkg (verbatim after the repoId).
 * git paths are `/`-separated and colon-free, so splitting the repoId at the FIRST `:` is unambiguous.
 */
function codeIdentifier(kind: string, eid: EID): string | null {
  const afterRepoId = (prefix: string): string | null => {
    if (!eid.startsWith(prefix)) return null;
    const rest = eid.slice(prefix.length);
    const c = rest.indexOf(":");
    return c < 0 ? null : rest.slice(c + 1);
  };
  switch (kind) {
    case "code:module": {
      const rel = afterRepoId("code:module:");
      return rel === null ? null : normPath(rel);
    }
    case "code:package": {
      const pkg = afterRepoId("code:package:");
      return pkg === null ? null : normPath(pkg);
    }
    case "code:symbol": {
      if (!eid.startsWith("code:symbol:")) return null;
      const h = eid.lastIndexOf("#");
      return h < 0 ? null : normPath(eid.slice(h + 1));
    }
    default:
      return null;
  }
}

/** A concept node is a `doc:<blob>#<slug>` node. */
function isConceptEid(eid: EID): boolean {
  return eid.startsWith("doc:");
}

/** The slug of a `doc:<blob>#<slug>` concept eid (empty for a malformed eid). */
function conceptSlug(eid: EID): string {
  const h = eid.lastIndexOf("#");
  return h < 0 ? "" : eid.slice(h + 1);
}

/** The raw blob of a `doc:<blob>#<slug>` concept eid — the same-blob test for cross-doc `same_as`. */
function conceptBlob(eid: EID): string {
  const h = eid.lastIndexOf("#");
  const body = h < 0 ? eid : eid.slice(0, h);
  return body.startsWith("doc:") ? body.slice("doc:".length) : body;
}

/**
 * The RAW (un-normalized) identifiers to match for a doc concept (ADR-B11): its slug AND every
 * string-valued prop value (doc props are arbitrary model-authored, so any string may be an identifier).
 */
function conceptRawIdentifiers(entry: NodeInventoryEntry): string[] {
  const ids: string[] = [conceptSlug(entry.eid)];
  for (const p of entry.props) {
    if (typeof p.value === "string") ids.push(p.value);
  }
  return ids;
}

/** A `documents` edge `AssertInput` (concept→code), keyed by a deterministic content-derived eid so a
 *  byte-identical re-link folds onto the SAME cell (idempotence). */
function documentsEdge(from: EID, to: EID): AssertInput {
  return {
    type: "assert",
    v: 1,
    target: { kind: "edge", eid: `${DOCUMENTS_EDGE_KIND}:${from}=>${to}`, edgeKind: DOCUMENTS_EDGE_KIND, from, to },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId: LINKER_REPLICA,
    provenance: placeholderProvenance(),
  };
}

/**
 * The pure, deterministic Layer-1 linker (ADR-B11/B11a). Reads ONLY its `NodeInventory` input and
 * authors nothing (INV-A1). Emits, by EXACT whole-string equality only (abstain otherwise, N5):
 *   - a typed `documents` edge (concept→code) into `proposed` when a concept identifier (slug or a
 *     string prop value), normalized under `N_path`, equals a `code:module`/`code:symbol`/`code:package`
 *     identifier;
 *   - a `{ candidate, existing }` into `sameAs` when two DIFFERENT-blob concepts share an `N_name`.
 * Deterministic: `proposed` sorted by (edgeKind, from, to); `sameAs` sorted by (candidate, existing).
 */
export function linkResolver(inventory: NodeInventory): LinkResolverResult {
  // (1) Index every code node by its case-preserved N_path identifier → the code eids that carry it.
  const codeByPath = new Map<string, Set<EID>>();
  const concepts: NodeInventoryEntry[] = [];
  for (const entry of inventory) {
    if (isConceptEid(entry.eid)) {
      concepts.push(entry);
      continue;
    }
    const id = codeIdentifier(entry.kind, entry.eid);
    if (id === null || id === "") continue; // unparsable / empty ⇒ abstain (N5).
    let set = codeByPath.get(id);
    if (!set) {
      set = new Set<EID>();
      codeByPath.set(id, set);
    }
    set.add(entry.eid);
  }

  // (2) concept→code `documents` edges: a concept identifier that EXACTLY equals a code identifier.
  const proposed: AssertInput[] = [];
  const seenDocPair = new Set<string>();
  for (const c of concepts) {
    for (const raw of conceptRawIdentifiers(c)) {
      const id = normPath(raw);
      if (id === "") continue;
      const codes = codeByPath.get(id);
      if (!codes) continue; // no exact whole-string match ⇒ abstain (N5).
      for (const codeEid of codes) {
        const key = `${c.eid} ${codeEid}`;
        if (seenDocPair.has(key)) continue; // dedupe (slug + a prop value may both match the same code).
        seenDocPair.add(key);
        proposed.push(documentsEdge(c.eid, codeEid));
      }
    }
  }

  // (3) cross-doc `same_as`: two DIFFERENT-blob concepts whose N_name identifiers are exactly equal.
  const byName = new Map<string, Map<EID, string>>(); // N_name → (conceptEid → blob)
  for (const c of concepts) {
    const blob = conceptBlob(c.eid);
    const names = new Set<string>();
    for (const raw of conceptRawIdentifiers(c)) {
      const n = normName(raw);
      if (n !== "") names.add(n);
    }
    for (const n of names) {
      let m = byName.get(n);
      if (!m) {
        m = new Map<EID, string>();
        byName.set(n, m);
      }
      if (!m.has(c.eid)) m.set(c.eid, blob);
    }
  }
  const sameAs: Array<{ candidate: EID; existing: EID }> = [];
  const seenSamePair = new Set<string>();
  for (const members of byName.values()) {
    const list = [...members.entries()]; // [conceptEid, blob]
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const [ea, ba] = list[i]!;
        const [eb, bb] = list[j]!;
        if (ba === bb) continue; // SAME blob ⇒ not a cross-doc duplicate (never a same_as).
        const candidate = ea < eb ? ea : eb; // deterministic min-first ordering.
        const existing = ea < eb ? eb : ea;
        const key = `${candidate} ${existing}`;
        if (seenSamePair.has(key)) continue;
        seenSamePair.add(key);
        sameAs.push({ candidate, existing });
      }
    }
  }

  // (4) STABLE ORDER (ADR-B11 determinism): proposed by (edgeKind, from, to); sameAs by (candidate, existing).
  proposed.sort((a, b) => {
    const ta = a.target as { edgeKind: string; from: EID; to: EID };
    const tb = b.target as { edgeKind: string; from: EID; to: EID };
    return (
      cmp(ta.edgeKind, tb.edgeKind) || cmp(ta.from, tb.from) || cmp(ta.to, tb.to)
    );
  });
  sameAs.sort((a, b) => cmp(a.candidate, b.candidate) || cmp(a.existing, b.existing));

  return { proposed, source: placeholderProvenance(), sameAs };
}

/** A total, deterministic string comparator (no locale). */
function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
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
