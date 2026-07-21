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

// --- distinctiveness gate (round-2 precision hardening, ADR-B11a) --------------------------------
//
// Layer 1 is deterministic exact-match; a link must be DISTINCTIVE evidence, not an incidental
// coincidence (three critics scored round-1 89/32/56 on a CRITICAL false-merge — a concept sharing
// ANY string prop value merged with an unrelated concept). A generic/too-short/stopword token is not
// distinctive, so matching on it fans out false links. Abstain over guess (N5).

/** Dedicated IDENTITY prop keys (compared case-insensitively). ONLY these props may carry a match
 *  identifier — arbitrary props (`status`, `example_file`, …) are incidental and NEVER matched. */
const IDENTITY_PROP_KEYS = new Set(["name", "title", "label"]);

/** A distinctive token must be at least this many chars (`N_name`-normalized). Short tokens (`api`,
 *  `foo`, `add`) are ambiguous across unrelated entities. `≥ 4` still admits `beta`, `left-pad`, … */
const MIN_DISTINCTIVE_LEN = 4;

/**
 * Generic terms that recur across unrelated documents/code and therefore carry NO entity-identity
 * signal — a `same_as` or bare-name `documents` match on one of these is a false merge (round-1
 * merged two `overview` sections). Kept explicit + documented so the gate is auditable. Compared
 * against the `N_name`-normalized (lower-cased) token.
 */
const NAME_STOPWORDS = new Set([
  "overview", "introduction", "intro", "index", "readme", "about", "home",
  "api", "service", "services", "note", "notes", "doc", "docs", "section",
  "guide", "reference", "summary", "misc", "other", "others", "main", "core",
  "common", "util", "utils", "module", "modules", "package", "packages",
  "code", "test", "tests", "example", "examples", "config", "data", "info",
  "todo", "changelog", "license", "contributing", "readme.md",
]);

/** A token is DISTINCTIVE (usable as a match identifier) when it clears the min length AND is not a
 *  known generic stopword. Input is the `N_name`-normalized (lower-cased, whitespace-collapsed) token. */
function isDistinctiveName(nName: string): boolean {
  return nName.length >= MIN_DISTINCTIVE_LEN && !NAME_STOPWORDS.has(nName);
}

// --- identifier parsing (ADR-B11: code nodes carry NO name prop → parse out of the hashed eid) -----

/** A parsed `code:*` node reference — the identifier the linker matches against, by kind. */
type CodeRef =
  | { kind: "module"; relPath: string }
  | { kind: "symbol"; symbolName: string }
  | { kind: "package"; pkg: string };

/**
 * The segment after a `code:*` prefix's hashed `repoId` (`${basename}-${sha1(absPath).slice(0,12)}`,
 * which is itself colon-free), or `null` when the eid shape is unexpected (abstain, N5 — NEVER a
 * mis-split). Code eids are `code:<kind>:<repoId>:<rest>`; the FIRST `:` after the prefix ends the
 * repoId (any `:` in `rest`/relPath comes strictly after it, so the split is unambiguous). Requires a
 * NON-EMPTY repoId and a NON-EMPTY remainder — a malformed eid (no repoId delimiter, empty repoId, or
 * empty remainder) yields `null` and is skipped, never silently mis-parsed into a wrong identifier (C).
 */
function afterRepoId(eid: EID, prefix: string): string | null {
  if (!eid.startsWith(prefix)) return null;
  const rest = eid.slice(prefix.length);
  const c = rest.indexOf(":");
  if (c <= 0) return null; // no repoId delimiter, or empty repoId ⇒ unexpected shape ⇒ abstain.
  const remainder = rest.slice(c + 1);
  return remainder === "" ? null : remainder;
}

/**
 * Recover the parsed identifier from a `code:*` eid (case-preserved `N_path`), or `null` for an eid
 * whose shape does not match its declared kind (abstain, N5). Code eids embed a hashed `repoId`:
 *   `code:module:<repoId>:<relPath>`       → { module, relPath }.
 *   `code:symbol:<repoId>:<relPath>#<sym>` → { symbol, symbolName = after the FINAL `#` }.
 *   `code:package:<repoId>:<pkg>`          → { package, pkg }.
 */
function parseCodeEid(kind: string, eid: EID): CodeRef | null {
  switch (kind) {
    case "code:module": {
      const rel = afterRepoId(eid, "code:module:");
      if (rel === null) return null;
      const relPath = normPath(rel);
      return relPath === "" ? null : { kind: "module", relPath };
    }
    case "code:package": {
      const pkg = afterRepoId(eid, "code:package:");
      if (pkg === null) return null;
      const p = normPath(pkg);
      return p === "" ? null : { kind: "package", pkg: p };
    }
    case "code:symbol": {
      const body = afterRepoId(eid, "code:symbol:"); // `<relPath>#<sym>`
      if (body === null) return null;
      const h = body.lastIndexOf("#");
      if (h < 0) return null; // a symbol eid must carry a `#sym` suffix ⇒ else abstain.
      const sym = normPath(body.slice(h + 1));
      return sym === "" ? null : { kind: "symbol", symbolName: sym };
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

/** The values of a concept's dedicated IDENTITY props (`name`/`title`/`label`), string-valued only. */
function conceptIdentityPropValues(entry: NodeInventoryEntry): string[] {
  const ids: string[] = [];
  for (const p of entry.props) {
    if (typeof p.value === "string" && IDENTITY_PROP_KEYS.has(p.key.toLowerCase())) ids.push(p.value);
  }
  return ids;
}

/**
 * The `documents` (concept→code) match identifiers — drawn ONLY from the concept's IDENTITY fields:
 * the eid slug and dedicated identity props (`name`/`title`/`label`). Arbitrary prop values
 * (`example_file`, `status`, …) are incidental and NEVER matched (round-1 linked `{example_file:
 * 'index.ts'}` to `code:module …/index.ts`). Raw (un-normalized) — the caller applies `N_path`.
 */
function conceptDocIdentifiers(entry: NodeInventoryEntry): string[] {
  const slug = conceptSlug(entry.eid);
  const ids = conceptIdentityPropValues(entry);
  if (slug !== "") ids.push(slug);
  return ids;
}

/**
 * The cross-doc `same_as` match identifiers — drawn ONLY from dedicated IDENTITY props
 * (`name`/`title`/`label`). NEVER the generic eid slug (round-1 merged two props-less `shared-slug-x`
 * concepts) and NEVER an arbitrary prop value (round-1 merged `{status:'draft'}` with `{state:'Draft'}`).
 * Raw (un-normalized) — the caller applies `N_name` + the distinctiveness gate.
 */
function conceptNameIdentifiers(entry: NodeInventoryEntry): string[] {
  return conceptIdentityPropValues(entry);
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
 * authors nothing (INV-A1). High-precision: a match must be DISTINCTIVE evidence, not an incidental
 * coincidence. Emits, by EXACT whole-string equality only (abstain otherwise, N5):
 *   - a typed `documents` edge (concept-to-code) into `proposed` when a concept IDENTITY identifier
 *     (its slug or a `name`/`title`/`label` prop value), normalized under `N_path`, matches a code node:
 *       . `code:module`  - the identifier EXACTLY equals the module's FULL git-relative relPath AND is
 *                          path-qualified (contains `/`); a bare basename (`index.ts`) is generic and
 *                          NEVER matches a module;
 *       . `code:symbol`  - the identifier EXACTLY equals the symbol name AND is DISTINCTIVE (clears the
 *                          length + stopword gate);
 *       . `code:package` - the identifier EXACTLY equals the package name AND is DISTINCTIVE.
 *     Resolution across kinds is DETERMINISTIC, most-specific first (module then package for a
 *     path-shaped id; symbol then package for a bare distinctive id); a single identifier never fans
 *     out to every kind.
 *   - a `{ candidate, existing }` into `sameAs` when two DIFFERENT-blob concepts share a DISTINCTIVE
 *     `name`/`title`/`label` identity value under `N_name` (NEVER the slug, NEVER an arbitrary prop).
 * Deterministic: `proposed` sorted by (edgeKind, from, to); `sameAs` sorted by (candidate, existing).
 *
 * Residual ambiguity (documented, ADR-B11a): two genuinely-distinct entities that share a distinctive
 * name across documents can still false-`same_as` here - this deterministic layer is deliberately
 * conservative (distinctive identity prop only), and a wrong `same_as` stays fully reversible (a signed
 * `not_same_as` contradicts it and surfaces `kip:conflict` instead of merging, proj.ts:2197-2237);
 * disambiguating true homonyms is the job of the future model-assisted Layer 2.
 */
export function linkResolver(inventory: NodeInventory): LinkResolverResult {
  // (1) Index every code node by its case-preserved N_path identifier → the code eids that carry it.
  const moduleByPath = new Map<string, Set<EID>>();
  const symbolByName = new Map<string, Set<EID>>();
  const packageByName = new Map<string, Set<EID>>();
  const addTo = (map: Map<string, Set<EID>>, key: string, eid: EID): void => {
    let set = map.get(key);
    if (!set) {
      set = new Set<EID>();
      map.set(key, set);
    }
    set.add(eid);
  };
  const concepts: NodeInventoryEntry[] = [];
  for (const entry of inventory) {
    if (isConceptEid(entry.eid)) {
      concepts.push(entry);
      continue;
    }
    const ref = parseCodeEid(entry.kind, entry.eid);
    if (!ref) continue; // unparsable / unexpected shape: abstain (N5), never a mis-split (C).
    if (ref.kind === "module") addTo(moduleByPath, ref.relPath, entry.eid);
    else if (ref.kind === "symbol") addTo(symbolByName, ref.symbolName, entry.eid);
    else addTo(packageByName, ref.pkg, entry.eid);
  }

  // Resolve the code targets for ONE concept identity identifier (case-preserved N_path), by the
  // deterministic most-specific-first precedence. Returns [] (abstain, N5) when nothing distinctive
  // matches - a single identifier never fans out to every kind.
  const resolveDocTargets = (id: string): EID[] => {
    if (id.includes("/")) {
      // A path-shaped identifier denotes a module (full relPath) - most specific. Fall back to a
      // scoped package (@scope/pkg) only if no module carries the path.
      const mods = moduleByPath.get(id);
      if (mods && mods.size) return [...mods];
      const pkgs = packageByName.get(id);
      if (pkgs && pkgs.size && isDistinctiveName(normName(id))) return [...pkgs];
      return [];
    }
    // A bare identifier must be DISTINCTIVE to match a symbol/package (rejects foo, api, index).
    if (!isDistinctiveName(normName(id))) return [];
    const syms = symbolByName.get(id);
    if (syms && syms.size) return [...syms]; // symbol is more specific than a coarse package.
    const pkgs = packageByName.get(id);
    if (pkgs && pkgs.size) return [...pkgs];
    return [];
  };

  // (2) concept-to-code documents edges: a concept IDENTITY identifier resolving to code targets.
  const proposed: AssertInput[] = [];
  const seenDocPair = new Set<string>();
  for (const c of concepts) {
    for (const raw of conceptDocIdentifiers(c)) {
      const id = normPath(raw);
      if (id === "") continue;
      for (const codeEid of resolveDocTargets(id)) {
        const key = `${c.eid} ${codeEid}`; // NUL separator (collision-safe; eids never contain NUL).
        if (seenDocPair.has(key)) continue; // dedupe (slug + a prop value may resolve the same code).
        seenDocPair.add(key);
        proposed.push(documentsEdge(c.eid, codeEid));
      }
    }
  }

  // (3) cross-doc same_as: two DIFFERENT-blob concepts sharing a DISTINCTIVE identity-prop name.
  const byName = new Map<string, Map<EID, string>>(); // N_name -> (conceptEid -> blob)
  for (const c of concepts) {
    const blob = conceptBlob(c.eid);
    const names = new Set<string>();
    for (const raw of conceptNameIdentifiers(c)) {
      const n = normName(raw);
      if (n !== "" && isDistinctiveName(n)) names.add(n); // distinctive identity names only.
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
