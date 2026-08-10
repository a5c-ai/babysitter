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
 * A concept→code exact match becomes a typed reversible `documents` edge; two different-document
 * concepts sharing a distinctive (strong) name become a `same_as` pair. Matching is exact and
 * high-precision (N5): the resolver abstains rather than emit a fuzzy/incidental link, deferring
 * ambiguous cases (bare common nouns, all-caps acronyms, filename-shaped names) to the future
 * model-assisted Layer 2. See `isStrongName` for the distinctiveness rule (ADR-B11a).
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

/** The concept→code edge kind (ADR-B11a): a concept DOCUMENTS an implementation. Exported so other
 *  acquisition paths (e.g. the D-67 RDF reader) can enumerate it in their reserved-edge-kind guard
 *  from this single source of truth rather than re-hardcoding the literal (drift-proof). */
export const DOCUMENTS_EDGE_KIND = "documents";

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

/**
 * KNOWN FILE EXTENSIONS (round-5 precision fix, ADR-B11a). A curated, reasonably-complete set of
 * source/config/doc/data file extensions. A slash-free token whose FINAL dotted segment is one of
 * these (matched CASE-INSENSITIVELY, so `config.JSON` and `config.json` are both filenames, ANY
 * length) is treated as a generic FILENAME, not a distinctive identity. Kept explicit + lowercase so
 * the allowlist is auditable; the earlier lowercase-only `\.[a-z0-9]{1,6}$` regex let an
 * UPPERCASE/mixed-case (`config.JSON`, `index.TS`) or LONG (`foo.gitignore`, `foo.properties`)
 * extension escape the filename guard and false-link — this allowlist closes that class.
 */
const KNOWN_FILE_EXTENSIONS = new Set([
  // source
  "ts", "tsx", "js", "jsx", "mjs", "cjs", "py", "rb", "go", "rs", "java", "kt", "kts", "scala",
  "c", "cc", "cpp", "cxx", "h", "hh", "hpp", "cs", "php", "swift", "m", "mm", "clj", "ex", "exs",
  "erl", "hs", "lua", "pl", "pm", "r", "dart", "groovy", "gradle", "vue", "svelte", "sh", "bash",
  "zsh", "bat", "ps1", "psm1",
  // config / build
  "json", "yml", "yaml", "toml", "ini", "cfg", "conf", "config", "properties", "lock", "env",
  "editorconfig", "gitignore", "gitattributes", "gitmodules", "dockerignore", "npmignore",
  "eslintignore", "prettierignore", "htaccess", "proto", "graphql", "gql",
  // markup / style / doc
  "html", "htm", "xml", "xhtml", "svg", "css", "scss", "sass", "less", "md", "mdx", "rst", "adoc",
  "txt", "rtf", "pdf",
  // data
  "sql", "csv", "tsv", "ndjson", "parquet", "avro", "map", "d", "log", "bak", "backup", "tmp",
]);

/** The min-length + stopword FLOOR (round-1/2). A token is above the floor when it clears the min length
 *  AND is not a known generic stopword. Input is the `N_name`-normalized (lower-cased, whitespace-collapsed)
 *  token. This floor is retained under `isStrongName` (round 3) but is NOT sufficient on its own — a bare
 *  common noun (`manager`) clears the floor yet is not distinctive; `isStrongName` adds the positive rule. */
function isDistinctiveName(nName: string): boolean {
  return nName.length >= MIN_DISTINCTIVE_LEN && !NAME_STOPWORDS.has(nName);
}

/**
 * The INTERNAL capitalized-word / camelCase distinctiveness signal (round-6 fix, ADR-B11a). Matches an
 * `[A-Z][a-z]` pair whose uppercase letter is NOT at index 0 — the leading `.` forces at least one
 * preceding character, so a lone leading capital (`Manager` → only `Ma` at index 0) never matches. This is
 * the signal that separates a genuinely proper-cased/compound name from an all-caps acronym/extension:
 *   - MATCHES (distinctive): `OrderPlaced` (`rPl`), `linkResolver` (`nkR`), `com.acme.Ledger` (`.Le`),
 *     `HTTPManager` (`PMa`) — a genuine camelCase hump or a segment-initial capitalized word.
 *   - NO MATCH (not distinctive): `Manager`/`Client`/`Api` (a single leading capital, only `Xy` at index 0),
 *     and `ZIG`/`JSON`/`API`/`HTTP`/`SQL`/`XML` (all-caps — only upper→upper runs, no `[A-Z][a-z]` at all).
 * The earlier "contains ANY uppercase after index 0" test wrongly read an all-caps final segment
 * (`config.ZIG`, `foo.XYZ`) as an internal capital and false-linked; requiring the `[A-Z][a-z]` transition
 * closes that class. (Tokens reach this test single-line — whitespace already collapsed — so the `.` never
 * spans a newline.)
 */
const INTERNAL_CAPITAL = /.[A-Z][a-z]/;

/**
 * A "STRONG name" — the round-3 principled distinctiveness rule (ADR-B11a) that GATES every cross-doc
 * `same_as` and every bare-token `documents` match (module matches use the path-qualified rule instead).
 * A denylist cannot enumerate every common noun, so instead of asking "is this token on a blocklist?" we
 * require a POSITIVE distinctiveness signal a bare common noun lacks. A single all-lowercase alphabetic
 * token (`manager`, `client`, `user`, `payment`, `handler`, `request`, `response`, `error`, …) is NOT
 * strong → NO deterministic link (it defers to the model-assisted Layer 2). A name is strong iff it clears
 * the min-length + stopword floor AND is EITHER:
 *   - multi-token — contains internal whitespace after `N_name` (`"Orchid checkout service"`,
 *     `"Reconciliation Ledger"`); OR
 *   - carries an internal distinctiveness marker a bare common noun lacks:
 *       . a hyphen / underscore / slash / colon (`::`) / `@` — a qualified name (`order-service`,
 *         `@scope/pkg`, `com::acme`);
 *       . a dot that is NOT part of a FILENAME shape (`com.acme.Ledger` yes; `index.ts`,
 *         `webpack.config.js`, `v2.ts` no — a filename-shaped token is a generic file, not an identity);
 *       . an internal digit (`oauth2`) — but a digit inside a filename stem/extension does NOT count;
 *       . an INTERNAL capitalized-word / camelCase transition in the ORIGINAL, pre-`toLowerCase` form —
 *         an `[A-Z][a-z]` pair whose uppercase letter is NOT at index 0 (`OrderPlaced` → `rPl`,
 *         `linkResolver` → `nkR`, or a segment-initial capital after a dot `com.acme.Ledger` → `.Le`). A
 *         LONE LEADING capital of a single-token word (`"Manager"` → only `Ma` at index 0) is a bare common
 *         noun and does NOT count, and an ALL-CAPS acronym/extension (`ZIG`, `API`, `JSON`) has NO
 *         `[A-Z][a-z]` transition at all — that `[A-Z][a-z]` signal is the whole distinction from a
 *         distinctive compound (round-6 fix, ADR-B11a).
 *
 * FILENAME SHAPE (round-4 fix + round-5 case/length hardening, ADR-B11a). A slash-free token is a
 * FILENAME — a generic file, not an identity — when it is a dotfile (leading `.`, e.g. `.env`), ends in a
 * trailing dot (`foo.`), or its FINAL dotted segment is a KNOWN file extension (`isFilenameShape` →
 * `KNOWN_FILE_EXTENSIONS`, matched CASE-INSENSITIVELY and of ANY length). Its dots are discounted
 * wholesale and any distinctiveness must live in the STEM (`isStrongStem`). The earlier lowercase-only
 * `\.[a-z0-9]{1,6}$` regex let an UPPERCASE/mixed-case (`config.JSON`, `index.TS`, `Foo.Js`) or LONG
 * (`foo.gitignore`, `foo.htaccess`, `foo.properties`) extension slip past the guard and false-link — the
 * same generic-filename over-linking class shifted by extension case/length; the known-extension allowlist
 * closes it. A dotted token whose final segment is NOT a known extension (`com.acme.Ledger`, a version
 * `v1.2.3`, an IP `10.0.0.1`, `file.backup2`) is NOT a filename: it is strong ONLY when a real
 * distinctiveness marker survives the dots — an internal capital (`com.acme.Ledger`) — so a pure
 * lowercase/digit/dot token (a version/IP/unknown-suffix) abstains (N5). The surviving distinctiveness
 * marker is an INTERNAL capitalized-word transition (`[A-Z][a-z]` not at index 0, `INTERNAL_CAPITAL`): it
 * fires on `com.acme.Ledger` (`.Le`) but NOT on an all-caps UNKNOWN-extension/acronym suffix (`config.ZIG`,
 * `foo.XYZ`, `data.SOL` — the round-6 residual: those have no `[A-Z][a-z]` transition, only upper→upper
 * runs, so they are NOT strong). Net: `config.JSON`, `index.TS`, `schema.SQL`, `config.ZIG`, `foo.XYZ`,
 * `foo.gitignore`, `.env`, `foo.`, `webpack.config.js`, `v2.ts`, and a bare all-caps `HTTP`/`API`/`SQL` are
 * NOT strong (no bare-token `documents`, no cross-blob `same_as`); `com.acme.Ledger`, `OrderPlaced`,
 * `order-service` stay strong; a path-qualified relPath (`src/foo/bar.ts`, contains `/`) is not a filename
 * token and still matches a module.
 *
 * Input is the RAW identity value (the internal-capital test needs the pre-lowercase form). Applied to
 * concept identity values, to a bare concept slug, AND to the code `code:symbol`/`code:package` token.
 */
function isStrongName(raw: string): boolean {
  const original = raw.normalize("NFC").trim().replace(/\s+/g, " ");
  const nName = original.toLowerCase();
  if (!isDistinctiveName(nName)) return false; // min-length + stopword floor (retained).
  if (nName.includes(" ")) return true; // multi-token.
  // A FILENAME-shaped token (dotfile, trailing dot, or a KNOWN-extension basename — any dot count) is a
  // generic file, not a distinctive identity: discount ALL its dots, and require the STEM alone to clear
  // the strong bar (rejects `config.JSON`, `foo.gitignore`, `.env`, `webpack.config.js`, `v2.ts`, …).
  if (isFilenameShape(original)) return isStrongStem(filenameStem(original));
  if (/[-_/:@]/.test(original)) return true; // qualified-name separator (hyphen/underscore/slash/`::`/`@`).
  const hasInternalCapital = INTERNAL_CAPITAL.test(original);
  // A dotted NON-filename token (`com.acme.Ledger`) is a qualified identity ONLY when a genuine
  // capitalized-word transition (`[A-Z][a-z]` not at index 0) survives the dots — a segment-initial or
  // camelCase capital (`.Le` in `com.acme.Ledger`). An all-caps UNKNOWN-extension/acronym suffix
  // (`config.ZIG`, `foo.XYZ`) has only upper→upper runs, no `[A-Z][a-z]` transition, and a pure
  // lowercase/digit/dot token (a version `v1.2.3`, an IP `10.0.0.1`, `file.backup2`) carries no entity
  // signal ⇒ both abstain (N5). This is the round-6 fix for the uppercase-extension residual (ADR-B11a).
  if (original.includes(".")) return hasInternalCapital;
  if (/\d/.test(original)) return true; // internal digit in a dot-free token (`oauth2`, `s3bucket`).
  return hasInternalCapital; // internal camelCase/capitalized-word transition (`OrderPlaced`), not a lone leading capital.
}

/**
 * Is a slash-free `original` a FILENAME shape (round-5, ADR-B11a)? True when it is a dotfile (leading `.`
 * like `.env`), ends in a trailing dot (`foo.`), or its final dotted segment is a `KNOWN_FILE_EXTENSIONS`
 * member matched case-INSENSITIVELY (`config.JSON`, `index.TS`, `foo.gitignore`, `webpack.config.js`). A
 * token containing a slash/backslash is a PATH, never a filename token (`src/foo/bar.ts` matches a module).
 */
function isFilenameShape(original: string): boolean {
  if (/[/\\]/.test(original)) return false; // a path, not a bare filename token.
  if (!original.includes(".")) return false; // no dot ⇒ not a filename.
  if (original.startsWith(".")) return true; // dotfile (`.env`, `.gitignore`).
  if (original.endsWith(".")) return true; // trailing dot (`foo.`).
  const lastDot = original.lastIndexOf(".");
  return KNOWN_FILE_EXTENSIONS.has(original.slice(lastDot + 1).toLowerCase());
}

/**
 * The distinctive STEM of a filename token (round-5, ADR-B11a) — everything before the final extension
 * dot. A dotfile (`.env`) has NO distinctive stem (the whole token is extension-like) ⇒ empty stem.
 */
function filenameStem(original: string): string {
  if (original.startsWith(".")) return ""; // dotfile: no distinctive stem.
  const lastDot = original.lastIndexOf(".");
  return lastDot <= 0 ? original : original.slice(0, lastDot);
}

/**
 * The STRONG bar for a FILENAME STEM (round-4 + round-6, ADR-B11a). A filename's dots and version digits are
 * generic, so a stem is distinctive ONLY through a name-shaped marker a bare/versioned filename lacks: a
 * hyphen/underscore/slash/`::`/`@` qualifier (`order-service`) or an INTERNAL capitalized-word transition
 * (`[A-Z][a-z]` not at index 0, `INTERNAL_CAPITAL` — `OrderPlaced`). A LONE dot, a LONE digit, a LONE leading
 * capital (`Foo`), or an all-caps stem (`HTTP`) does NOT qualify — `webpack.config`, `index.test`, `v2`,
 * `vec3`, `config`, `foo`, `Foo`, `HTTP` are NOT strong stems. (Multi-token is impossible in a slash-free
 * filename token.)
 */
function isStrongStem(stem: string): boolean {
  if (/[-_/:@]/.test(stem)) return true; // qualified-name separator.
  return INTERNAL_CAPITAL.test(stem); // internal camelCase/capitalized-word transition in the stem (not a lone leading capital, not all-caps).
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
 *
 * The eid SLUG is included but subject to the SAME distinctiveness bar as every other identifier: a
 * module match needs a path-qualified id (contains `/`) and a symbol/package match needs a STRONG slug
 * (`isStrongName`). So an auto-generated bare-token slug (`overview`, `intro`) NEVER links — it is not
 * a privileged signal, just another candidate identifier held to the same rule.
 */
function conceptDocIdentifiers(entry: NodeInventoryEntry): string[] {
  const slug = conceptSlug(entry.eid);
  const ids = conceptIdentityPropValues(entry);
  if (slug !== "") ids.push(slug);
  return ids;
}

/**
 * ALL string prop values of a concept, from ANY prop key (identity or arbitrary). Used ONLY by the
 * concept→`code:module` `documents` case (ADR-B11a round 7): a FULL, path-qualified git-relative relPath
 * is a DISTINCTIVE, high-precision identifier no matter which prop holds it, so a path candidate is drawn
 * from any prop and linked ONLY when it EXACTLY equals a module's full relPath AND is path-qualified
 * (`resolveModuleFromAnyProp`). This closes the learn→link composition gap where `kip learn` files the
 * file path under a `path` prop with empty identity fields. NEVER used for symbol/package or same_as —
 * those stay identity-field-only (a bare basename / arbitrary token there is collision-prone). Raw
 * (un-normalized) — the caller applies `N_path`.
 */
function conceptAnyStringPropValues(entry: NodeInventoryEntry): string[] {
  const vals: string[] = [];
  for (const p of entry.props) {
    if (typeof p.value === "string") vals.push(p.value);
  }
  return vals;
}

/**
 * The cross-doc `same_as` match identifiers — drawn ONLY from dedicated IDENTITY props
 * (`name`/`title`/`label`). NEVER the generic eid slug (round-1 merged two props-less `shared-slug-x`
 * concepts) and NEVER an arbitrary prop value (round-1 merged `{status:'draft'}` with `{state:'Draft'}`).
 * Raw (un-normalized) — the caller applies `N_name` + the STRONG-name gate (`isStrongName`).
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
 *   - a typed `documents` edge (concept-to-code) into `proposed`, normalized under `N_path`, matching a
 *     code node:
 *       . `code:module`  - the identifier EXACTLY equals the module's FULL git-relative relPath AND is
 *                          path-qualified (contains `/`); a bare basename (`index.ts`) is generic and
 *                          NEVER matches a module. The module candidate is drawn from a concept IDENTITY
 *                          identifier (slug or `name`/`title`/`label`) OR from ANY string prop value
 *                          (round 7, ADR-B11a) — a full path-qualified relPath is distinctive no matter
 *                          which prop holds it, which closes the learn→link gap where `kip learn` files
 *                          the path under a `path` prop (identity fields empty);
 *       . `code:symbol`  - a concept IDENTITY identifier (slug/`name`/`title`/`label`) EXACTLY equals the
 *                          symbol name AND is a STRONG name (`isStrongName`: multi-token, or an internal
 *                          digit/capital/qualifier). NOT widened to arbitrary props (collision-prone);
 *       . `code:package` - an IDENTITY identifier EXACTLY equals the package name AND is a STRONG name.
 *                          NOT widened to arbitrary props.
 *     Resolution across kinds is DETERMINISTIC, most-specific first (module then package for a
 *     path-shaped id; symbol then package for a bare strong id); a single identifier never fans
 *     out to every kind.
 *   - a `{ candidate, existing }` into `sameAs` when two DIFFERENT-blob concepts share a STRONG
 *     `name`/`title`/`label` identity value under `N_name` (NEVER the slug, NEVER an arbitrary prop). A
 *     bare common noun (`manager`/`client`/`user`) is NOT strong → NO same_as; single-common-noun
 *     cross-doc resolution is deferred to the model-assisted Layer 2.
 * Deterministic: `proposed` sorted by (edgeKind, from, to); `sameAs` sorted by (candidate, existing).
 *
 * Residual ambiguity (documented, ADR-B11a): two genuinely-distinct entities that share a STRONG
 * distinctive name across documents (a true homonym) can still false-`same_as` here - this deterministic
 * layer is deliberately conservative (strong identity name only), and a wrong `same_as` stays fully
 * reversible (a signed `not_same_as` contradicts it and surfaces `kip:conflict` instead of merging,
 * proj.ts:2197-2237); disambiguating true homonyms is the job of the future model-assisted Layer 2.
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
    if (ref.kind === "module") {
      // Only index PATH-QUALIFIED module relPaths. This is INTENTIONAL defense-in-depth with the
      // `id.includes("/")` routing in `resolveDocTargets`: a bare, `/`-less concept id is routed to
      // symbol/package (never `moduleByPath`), so a bare-basename module (`index.ts`) is already
      // unreachable by that route — but we ALSO refuse to index it here so no future lookup path can ever
      // reach a bare-basename module. Either gate alone blocks a bare-basename `documents` link; keeping
      // BOTH is a deliberate belt-and-suspenders invariant (a bare basename is not distinctive evidence),
      // and it removes the otherwise-dead bare-basename entries by construction.
      if (ref.relPath.includes("/")) addTo(moduleByPath, ref.relPath, entry.eid);
    } else if (ref.kind === "symbol") {
      // The code TOKEN is held to the same STRONG bar as the concept identifier: a dotted bare basename
      // (`index.ts`) or a bare common noun is not distinctive evidence and must not seed a match.
      if (isStrongName(ref.symbolName)) addTo(symbolByName, ref.symbolName, entry.eid);
    } else if (isStrongName(ref.pkg)) addTo(packageByName, ref.pkg, entry.eid);
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
      if (pkgs && pkgs.size && isStrongName(id)) return [...pkgs];
      return [];
    }
    // A bare identifier must be a STRONG name to match a symbol/package (rejects foo, api, index, manager).
    if (!isStrongName(id)) return [];
    const syms = symbolByName.get(id);
    if (syms && syms.size) return [...syms]; // symbol is more specific than a coarse package.
    const pkgs = packageByName.get(id);
    if (pkgs && pkgs.size) return [...pkgs];
    return [];
  };

  // (2) concept-to-code documents edges: a concept IDENTITY identifier resolving to code targets.
  const proposed: AssertInput[] = [];
  const seenDocPair = new Set<string>();
  const emitDoc = (codeEid: EID, conceptEid: EID): void => {
    const key = `${conceptEid}\0${codeEid}`; // NUL (`\0`) separator — collision-safe: an eid never contains a NUL byte, whereas a space could (a relPath may contain spaces).
    if (seenDocPair.has(key)) return; // dedupe (slug + a prop value may resolve the same code).
    seenDocPair.add(key);
    proposed.push(documentsEdge(conceptEid, codeEid));
  };
  // A FULL path-qualified relPath in ANY prop resolves ONLY a `code:module` (round 7, ADR-B11a). A path is a
  // distinctive, high-precision identifier regardless of which prop holds it, so this reads any string prop —
  // but ONLY the module map (never symbol/package, never same_as), and ONLY on an EXACT full-relPath match
  // that is path-qualified (contains `/`; `moduleByPath` itself only holds path-qualified relPaths). A bare
  // basename (`index.ts`) has no `/` and matches no real module relPath ⇒ abstain (N5).
  const resolveModuleFromAnyProp = (id: string): EID[] => {
    if (!id.includes("/")) return [];
    const mods = moduleByPath.get(id);
    return mods && mods.size ? [...mods] : [];
  };
  for (const c of concepts) {
    // (2a) IDENTITY identifiers (slug + name/title/label) → module/symbol/package, most-specific-first.
    for (const raw of conceptDocIdentifiers(c)) {
      const id = normPath(raw);
      if (id === "") continue;
      for (const codeEid of resolveDocTargets(id)) emitDoc(codeEid, c.eid);
    }
    // (2b) MODULE ONLY, from ANY string prop: a full path-qualified relPath exact match (the learn→link
    // path-prop fix). Symbol/package matching is NOT widened this way (identity fields only, above).
    for (const raw of conceptAnyStringPropValues(c)) {
      const id = normPath(raw);
      if (id === "") continue;
      for (const codeEid of resolveModuleFromAnyProp(id)) emitDoc(codeEid, c.eid);
    }
  }

  // (3) cross-doc same_as: two DIFFERENT-blob concepts sharing a STRONG identity-prop name (round 3).
  const byName = new Map<string, Map<EID, string>>(); // N_name -> (conceptEid -> blob)
  for (const c of concepts) {
    const blob = conceptBlob(c.eid);
    const names = new Set<string>();
    for (const raw of conceptNameIdentifiers(c)) {
      const n = normName(raw);
      // STRONG identity names ONLY (ADR-B11a): a bare common noun (`manager`/`client`/`user`) is not
      // strong and must NOT merge — it defers to Layer 2. `isStrongName` reads the RAW value (the
      // camelCase/PascalCase test needs the pre-`toLowerCase` form) but we key the class by `N_name`.
      if (n !== "" && isStrongName(raw)) names.add(n);
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
        const key = `${candidate}\0${existing}`;
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
