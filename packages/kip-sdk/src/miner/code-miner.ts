/**
 * The bash-tool code-analysis Miner (M7 acquisition family) — ADR-B9/B9a/B9b/B9c.
 *
 * A standalone (sourceless, non-edge-bound) Miner microagent: given a repository directory it runs
 * static analysis over the tracked source tree and returns candidate objects-of-interest as an
 * `AcquisitionResult` payload. The orchestrator (`Repo.runAcquisition`) — NEVER this module — turns
 * that payload into signed, source-provenanced kip facts (INV-A1: the miner authors nothing).
 *
 * TWO TIERS (ADR-B9a):
 *   GUARANTEED — deterministic, cross-platform, NO spawn. The git HEAD sha + the tracked-file set are
 *     read synchronously from the on-disk git index/refs (`node:fs`); file contents via `node:fs`;
 *     ES `import`/CJS `require`/`export` extracted with regex; format from extension+shebang. Emits
 *     `code:repo`/`code:module`/`code:symbol`/`code:package` nodes, `code:contains`/`code:imports`
 *     (with a `spec` edge-prop)/`code:exports`/`code:depends_on` edges, and — per module — a `format`
 *     node-prop, a `linesOfCode` node-prop (the file's newline count, computed from the bytes already
 *     read, so it is present with ZERO external tools — ADR-B9a), and a `content` `BlobRef` node-prop
 *     (a git-blob-style SHA-1 content address of the file, ADR-B9b) — with deterministic path-derived
 *     EIDs so a re-index dedups by EID. The guaranteed `linesOfCode` is per-MODULE and is a distinct
 *     cell from any repo-level probed `linesOfCode` total, so the two never collide.
 *   PROBED (N5 loud-skip) — `rg`/`tokei`/`scc`/`cloc`/`ast-grep`/`tsc`/`eslint`, gated behind the
 *     opt-in env `KIP_INDEX_TOOLS` (mirroring `KIP_ASK_LIVE`). Resolution/spawn/env reuse the
 *     Windows-hardened primitives exported from `src/cli/ask.ts` (`resolveHarnessBinary`,
 *     `buildHarnessSpawn`, `buildHarnessEnv`, `probeVersionOf`). An absent/failed tool emits a
 *     recorded `skipped:<tool>` node-prop with a non-empty reason and NEVER fabricates its metric.
 *
 * SYNC CONTRACT NOTE. `buildCodeMinerResult` is SYNCHRONOUS by the frozen-test contract (the tests
 * destructure its result directly, without `await`). `isomorphic-git`'s API is async-only and cannot
 * satisfy that, so the guaranteed tier reads git state synchronously via `node:fs` instead (isomorphic-git
 * stays a package.json dependency, available for other, async uses — see ADR-B9a's reconciliation note);
 * likewise the probed tier uses `spawnSync` (with `maxBuffer`/`timeout`) rather than the async
 * `spawnHarnessCli`, while still routing through ask.ts's resolve/spawn/env helpers so the win32 `.cmd`
 * trampoline and env allowlist are reused verbatim.
 *
 * DETERMINISM (honest scope — round-2 finding #8). File CONTENT is read from the WORKING TREE, while
 * facts are provenance-anchored to `@<gitSha>`; the `gitSha` is either resolved from `.git/HEAD` or
 * taken verbatim from a caller-supplied `--git-sha` and is NOT verified against the bytes actually read
 * (a dirty working tree, or a mismatched `--git-sha`, is not detected). The guarantee is therefore
 * PER-RUN BYTE-IDENTITY OVER IDENTICAL ON-DISK STATE: two runs over the same on-disk repo state emit a
 * byte-identical candidate set. It is NOT a claim that the emitted facts provably reflect the committed
 * tree at `gitSha` — the `code-resource://<repoId>@<gitSha>` uri is a reproducibility ANCHOR, not a
 * verified content hash of the read bytes.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  join as joinNative,
  posix,
  relative,
  resolve as resolveNative,
  sep,
} from "node:path";
import type {
  AssertInput,
  BlobRef,
  CID,
  DispatchMicroagentFn,
  EID,
  Provenance,
  PropValue,
  RetractInput,
} from "../index";
// LAYERING NOTE (round-2 finding #12): the probed tier reuses the Windows-hardened spawn/resolve/env
// primitives exported from `../cli/ask`. This miner→cli import is one-directional (ask.ts imports
// nothing from this module), so it introduces NO cycle. The helpers are deliberately left in ask.ts
// rather than hoisted into a third shared module: a shared-spawn extraction would churn ask.ts's own
// imports/exports for zero behavioral gain on this slice. The platform-aware `ResolvedHarnessBinary`
// is threaded through the extractors verbatim (finding #11) so the `.cmd`-trampoline decision is never
// re-derived from a path extension here.
import {
  buildHarnessEnv,
  buildHarnessSpawn,
  probeVersionOf,
  resolveHarnessBinary,
  type ResolvedHarnessBinary,
} from "../cli/ask";

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

/** The miner agent id + version (ADR-B9b: `author` = the miner agent id + version). */
const MINER_AUTHOR = "code-miner@1.0.0";

/** The optional analysis binaries (ADR-B9a) — probed, never assumed present. */
const PROBED_TOOLS = ["rg", "tokei", "scc", "cloc", "ast-grep", "tsc", "eslint"] as const;
type ProbedTool = (typeof PROBED_TOOLS)[number];

/** Extension → detected format (guaranteed tier; a non-empty classification, never a tool metric). */
const EXTENSION_FORMATS: Record<string, string> = {
  ts: "typescript",
  mts: "typescript",
  cts: "typescript",
  tsx: "tsx",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "jsx",
  json: "json",
  md: "markdown",
  markdown: "markdown",
  yml: "yaml",
  yaml: "yaml",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  cs: "csharp",
  php: "php",
  sh: "shell",
  bash: "shell",
  html: "html",
  css: "css",
  scss: "scss",
  sql: "sql",
  toml: "toml",
  xml: "xml",
};

/** Shebang interpreter → format (extensionless scripts). */
const SHEBANG_FORMATS: Array<[RegExp, string]> = [
  [/\bnode\b/, "javascript"],
  [/\bpython[0-9.]*\b/, "python"],
  [/\b(?:bash|sh|zsh)\b/, "shell"],
  [/\bruby\b/, "ruby"],
];

/** The JS/TS extensions whose import/export graph the guaranteed tier extracts. */
const JS_TS_EXTENSIONS = new Set(["ts", "mts", "cts", "tsx", "js", "mjs", "cjs", "jsx"]);

/** Module-resolution extension candidates (deterministic order). */
const RESOLVE_EXTENSIONS = ["", ".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".json"];

// ============================================================================================
// Guaranteed tier: synchronous git state (no spawn, no isomorphic-git — see the SYNC CONTRACT NOTE).
// ============================================================================================

/**
 * Locate the ENCLOSING git root by walking UP from `startDir` until a `.git` entry (a directory OR a
 * gitfile — submodules/linked worktrees) is found; return that enclosing directory. Reaching the
 * filesystem root without a `.git` throws N5-style, naming the path — the miner NEVER fabricates a sha
 * or scans a non-repo (round-4 DEFECT 1). Cross-platform via `node:path` (`dirname` fixpoint is the
 * platform-correct filesystem-root sentinel on win32 drive roots and POSIX `/` alike), synchronous
 * (keeps the SYNC CONTRACT). Called with an already-`resolveNative`d absolute path.
 */
function findGitRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    if (existsSync(joinNative(dir, ".git"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(
        `code-miner: no enclosing git repository found for ${startDir} ` +
          "(walked up to the filesystem root without finding a .git)",
      );
    }
    dir = parent;
  }
}

/**
 * The `.git` metadata directory for the enclosing root. A plain repo has a `.git` DIRECTORY; a
 * submodule / linked worktree has a `.git` FILE (`gitdir: <path>`) pointing at the real metadata dir,
 * which this resolves (relative targets are resolved against the root). A malformed gitfile throws
 * loudly (never a silent guess), consistent with the loud-failure ethos.
 */
function gitDirOf(gitRoot: string): string {
  const dotGit = joinNative(gitRoot, ".git");
  if (statSync(dotGit).isDirectory()) return dotGit;
  const contents = readFileSync(dotGit, "utf8").trim();
  const m = /^gitdir:\s*(.+)$/m.exec(contents);
  if (m === null) {
    throw new Error(`code-miner: ${dotGit} is a gitfile with no 'gitdir:' line (cannot locate .git metadata)`);
  }
  const target = m[1].trim();
  return isAbsolute(target) ? target : resolveNative(gitRoot, target);
}

/**
 * Scope the git-root-relative tracked-file set to files UNDER `givenPath` (a subdirectory of the repo).
 * When `givenPath` IS the git root the full set is returned unchanged (DEFECT 1: `kip index <root>`
 * behaves exactly as before). The git index stores POSIX (`/`) paths, so the platform-`sep` relative
 * prefix is normalized to POSIX before matching. `givenPath` is always inside (or equal to) `gitRoot`
 * because the root was found by walking UP from it, so the relative prefix never escapes with `..`.
 */
function scopeToSubdir(tracked: string[], gitRoot: string, givenPath: string): string[] {
  const rel = relative(gitRoot, givenPath);
  if (rel === "" || rel === ".") return tracked;
  const relPosix = rel.split(sep).join("/");
  const prefix = relPosix.endsWith("/") ? relPosix : `${relPosix}/`;
  return tracked.filter((f) => f.startsWith(prefix));
}

/**
 * Reject a non-SHA-1 object-format repo LOUDLY (round-2 finding #4). A SHA-256 repo stores 32-byte
 * object ids in its index (not the 20-byte SHA-1 stride `readTrackedFiles` walks), so parsing it under
 * the SHA-1 assumption silently mis-slices every entry. Git records the format in `.git/config`
 * (`[extensions] objectformat = sha256`), so this reads that authoritative signal and throws N5-style
 * — never a silent mis-parse — exactly like the unsupported-index-version rejection below.
 */
function assertSupportedObjectFormat(gitDir: string): void {
  const configPath = joinNative(gitDir, "config");
  if (!existsSync(configPath)) return;
  const m = /^\s*objectformat\s*=\s*(\S+)/im.exec(readFileSync(configPath, "utf8"));
  if (m !== null && m[1].toLowerCase() !== "sha1") {
    throw new Error(
      `code-miner: object-format '${m[1]}' repositories (32-byte object ids) are not supported — ` +
        `this miner reads SHA-1 DIRC indexes only`,
    );
  }
}

/** The git-blob SHA-1 content address of a file's raw bytes (`sha1("blob " + len + "\0" + bytes)`) —
 *  the deterministic, cross-platform content id carried as the guaranteed `content` `BlobRef`
 *  (ADR-B9b). A pure function of the read bytes, so a re-index over identical state yields the same oid. */
function gitBlobOid(raw: Buffer): CID {
  // The header terminator MUST be git's NUL byte (`\x00`), NOT a space: git hashes
  // `"blob " + len + "\0" + bytes`, so the emitted oid equals `git hash-object <file>` byte-for-byte.
  // A trailing space would produce a different, non-git digest (round-3 finding). The NUL is written
  // as an explicit `\x00` escape (never a raw NUL char in source, which editors/linters can silently
  // strip) via a Buffer so the header bytes are unambiguous.
  return createHash("sha1")
    .update(Buffer.from(`blob ${raw.length}\x00`, "utf8"))
    .update(raw)
    .digest("hex");
}

/** Newline LOC (round-2 finding #1): the count of `\n` bytes — a guaranteed-tier datum computed from
 *  the file's OWN bytes, needing NO external tool. */
function newlineLoc(raw: Buffer): number {
  let count = 0;
  for (let i = 0; i < raw.length; i += 1) if (raw[i] === 0x0a) count += 1;
  return count;
}

/**
 * Resolve HEAD to a 40-hex sha synchronously (used only when `input.gitSha` is absent): read
 * `.git/HEAD`, follow a symbolic ref to `.git/<ref>` or `packed-refs`, or accept a detached sha.
 */
function resolveHeadSha(gitDir: string): string {
  const head = readFileSync(joinNative(gitDir, "HEAD"), "utf8").trim();
  if (head.startsWith("ref:")) {
    const ref = head.slice(4).trim();
    const refPath = joinNative(gitDir, ref);
    if (existsSync(refPath)) return readFileSync(refPath, "utf8").trim();
    const packed = joinNative(gitDir, "packed-refs");
    if (existsSync(packed)) {
      for (const rawLine of readFileSync(packed, "utf8").split("\n")) {
        const line = rawLine.trim();
        if (line.length === 0 || line.startsWith("#") || line.startsWith("^")) continue;
        const sp = line.indexOf(" ");
        if (sp < 0) continue;
        if (line.slice(sp + 1) === ref) return line.slice(0, sp);
      }
    }
    throw new Error(`code-miner: could not resolve HEAD ref ${ref} in ${gitDir}`);
  }
  if (/^[0-9a-f]{7,40}$/.test(head)) return head;
  throw new Error(`code-miner: unrecognized .git/HEAD contents in ${gitDir}`);
}

/**
 * The tracked-file set, read synchronously from the git index (`.git/index`, DIRC v2/v3). The index
 * is git's authoritative staged/tracked set (`git ls-files`), needs no object inflation (so it works
 * on packed repos), and — for a clean checkout — equals the HEAD tree. v4 path-compression is not
 * supported (default git writes v2); a non-DIRC/unsupported index throws loudly (never a silent guess).
 */
function readTrackedFiles(gitDir: string): string[] {
  assertSupportedObjectFormat(gitDir); // N5: reject SHA-256 (32-byte oid) repos loudly, never mis-parse.
  const indexPath = joinNative(gitDir, "index");
  const buf = readFileSync(indexPath);
  if (buf.length < 12 || buf.toString("ascii", 0, 4) !== "DIRC") {
    throw new Error(`code-miner: ${indexPath} is not a valid git index (missing DIRC signature)`);
  }
  const version = buf.readUInt32BE(4);
  const count = buf.readUInt32BE(8);
  if (version < 2 || version > 3) {
    throw new Error(
      `code-miner: unsupported git index version ${version} (this miner reads DIRC v2/v3 only)`,
    );
  }
  const files: string[] = [];
  let pos = 12;
  for (let i = 0; i < count; i += 1) {
    const entryStart = pos;
    pos += 40; // ctime/mtime/dev/ino/mode/uid/gid/size (10 × uint32)
    pos += 20; // SHA-1 object id (SHA-256 repos use 32; unsupported here)
    const flags = buf.readUInt16BE(pos);
    pos += 2;
    const nameLen = flags & 0x0fff;
    const extended = (flags & 0x4000) !== 0;
    if (version >= 3 && extended) pos += 2; // extended flags block
    let nameEnd: number;
    if (nameLen < 0x0fff) {
      nameEnd = pos + nameLen;
    } else {
      nameEnd = pos;
      while (nameEnd < buf.length && buf[nameEnd] !== 0) nameEnd += 1;
    }
    files.push(buf.toString("utf8", pos, nameEnd));
    pos = nameEnd;
    // 1–8 NUL bytes pad the entry to a multiple of 8 (measured from entryStart, name NUL-terminated).
    const entryLen = pos - entryStart;
    pos += 8 - (entryLen % 8);
  }
  return files;
}

// ============================================================================================
// Guaranteed tier: format detection, import/export extraction.
// ============================================================================================

function extensionOf(relPath: string): string {
  const base = posix.basename(relPath);
  const dot = base.lastIndexOf(".");
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : "";
}

/** A non-empty format string per module (extension, else shebang, else the raw extension, else
 *  `plaintext`). This classifies the file from its OWN bytes — a guaranteed-tier datum, not a
 *  probed-tool metric — so it never carries a `<metric>Tool` companion (N5). */
function detectFormat(relPath: string, content: string): string {
  const ext = extensionOf(relPath);
  const known = EXTENSION_FORMATS[ext];
  if (known) return known;
  if (content.startsWith("#!")) {
    const eol = content.indexOf("\n");
    const firstLine = eol < 0 ? content : content.slice(0, eol);
    for (const [re, fmt] of SHEBANG_FORMATS) if (re.test(firstLine)) return fmt;
  }
  return ext.length > 0 ? ext : "plaintext";
}

const RE_IMPORT_FROM = /import\s+[^;'"]*?from\s*['"]([^'"]+)['"]/g;
const RE_IMPORT_BARE = /import\s*['"]([^'"]+)['"]/g;
const RE_EXPORT_FROM = /export\s+[^;'"]*?from\s*['"]([^'"]+)['"]/g;
const RE_REQUIRE = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const RE_DYNAMIC_IMPORT = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const RE_EXPORT_DECL =
  /export\s+(?:default\s+)?(?:async\s+)?(?:const|let|var|function|class|enum|interface|type)\s+([A-Za-z_$][\w$]*)/g;
const RE_EXPORT_NAMED = /export\s*\{([^}]*)\}/g;

function collectMatches(re: RegExp, content: string): string[] {
  const out: string[] = [];
  re.lastIndex = 0;
  let m: RegExpExecArray | null = re.exec(content);
  while (m !== null) {
    if (m[1] !== undefined) out.push(m[1]);
    m = re.exec(content);
  }
  return out;
}

/** The unique, sorted import specifiers of a JS/TS module (deterministic). */
function extractImportSpecifiers(content: string): string[] {
  const specs = new Set<string>();
  for (const re of [RE_IMPORT_FROM, RE_IMPORT_BARE, RE_EXPORT_FROM, RE_REQUIRE, RE_DYNAMIC_IMPORT]) {
    for (const spec of collectMatches(re, content)) specs.add(spec);
  }
  return [...specs].sort();
}

/** The unique, sorted exported symbol names of a JS/TS module (deterministic). */
function extractExportedSymbols(content: string): string[] {
  const symbols = new Set<string>();
  for (const name of collectMatches(RE_EXPORT_DECL, content)) symbols.add(name);
  for (const clause of collectMatches(RE_EXPORT_NAMED, content)) {
    for (const part of clause.split(",")) {
      const trimmed = part.trim();
      if (trimmed.length === 0) continue;
      // `X` or `X as Y` → the EXPORTED name is the last token.
      const asMatch = /(?:\bas\s+)([A-Za-z_$][\w$]*)\s*$/.exec(trimmed);
      const name = asMatch ? asMatch[1] : /^([A-Za-z_$][\w$]*)/.exec(trimmed)?.[1];
      if (name !== undefined && name !== "default") symbols.add(name);
    }
  }
  return [...symbols].sort();
}

/** Resolve a relative import specifier to a tracked module path, or `undefined` (external/unresolved). */
function resolveRelativeImport(fromRel: string, spec: string, tracked: ReadonlySet<string>): string | undefined {
  if (!spec.startsWith(".")) return undefined;
  const base = posix.normalize(posix.join(posix.dirname(fromRel), spec));
  for (const ext of RESOLVE_EXTENSIONS) {
    if (tracked.has(base + ext)) return base + ext;
  }
  for (const ext of RESOLVE_EXTENSIONS) {
    const indexed = posix.join(base, `index${ext}`);
    if (tracked.has(indexed)) return indexed;
  }
  return undefined;
}

/** The npm-style package name of a bare specifier (`@scope/name/sub` → `@scope/name`; `pkg/sub` → `pkg`). */
function packageNameOf(spec: string): string {
  const parts = spec.split("/");
  if (spec.startsWith("@")) return parts.slice(0, 2).join("/");
  return parts[0];
}

// ============================================================================================
// EID scheme (ADR-B9b: path-derived, deterministic → re-index dedups by EID). The tenant/namespace
// prefix is NOT pinned by the spec; the git-relative-path SUFFIX is (the frozen tests assert
// `endsWith`). All EIDs are a pure function of `(repoId, path[, symbol])`.
// ============================================================================================

/**
 * The repoId that namespaces every EID (round-2 finding #5). The basename ALONE collides two distinct
 * same-named directories into one EID namespace — a false-dedup hazard (two different `/tmp/x/repo` and
 * `/tmp/y/repo` would fold onto the same `code:module:repo:...` cells). So the id is anchored to a
 * STABLE per-path identity: the human-readable basename PLUS a 12-hex SHA-1 of the ABSOLUTE, normalized
 * repo path. Dedup is thus deliberately PATH-SCOPED — a re-index of the SAME directory dedups (same
 * path ⇒ same hash ⇒ same EIDs), while two different directories never collide. The hash is hex-only,
 * so the `code-resource://<repoId>@<gitSha>` uri stays well-formed (no `@`).
 */
function repoIdOf(repoDir: string): string {
  const base = basename(repoDir).replace(/[@\s]+/g, "_");
  const name = base.length > 0 ? base : "repo";
  const pathHash = createHash("sha1").update(resolveNative(repoDir)).digest("hex").slice(0, 12);
  return `${name}-${pathHash}`;
}

function repoEid(repoId: string): EID {
  return `code:repo:${repoId}`;
}
function moduleEid(repoId: string, relPath: string): EID {
  return `code:module:${repoId}:${relPath}`;
}
function symbolEid(repoId: string, relPath: string, symbol: string): EID {
  return `code:symbol:${repoId}:${relPath}#${symbol}`;
}
function packageEid(repoId: string, pkg: string): EID {
  return `code:package:${repoId}:${pkg}`;
}

// ============================================================================================
// Candidate builders (each is a plain, deterministic `AssertInput` — the orchestrator re-stamps
// replicaId + signature, so the placeholders below never become authoritative identity, INV-A1).
// ============================================================================================

function placeholderProvenance(): Provenance {
  return { author: MINER_AUTHOR, signature: "", publicKeyFingerprint: "", signedFields: [] };
}

function nodeAssert(eid: EID, nodeKind: string): AssertInput {
  return {
    type: "assert",
    v: 1,
    target: { kind: "node", eid, nodeKind },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId: "code-miner",
    provenance: placeholderProvenance(),
  };
}

function nodePropAssert(eid: EID, prop: string, value: PropValue): AssertInput {
  return {
    type: "assert",
    v: 1,
    target: { kind: "node-prop", eid, prop },
    value,
    validFrom: 0,
    validTo: null,
    replicaId: "code-miner",
    provenance: placeholderProvenance(),
  };
}

function edgeAssert(eid: EID, edgeKind: string, from: EID, to: EID): AssertInput {
  return {
    type: "assert",
    v: 1,
    target: { kind: "edge", eid, edgeKind, from, to },
    value: true,
    validFrom: 0,
    validTo: null,
    replicaId: "code-miner",
    provenance: placeholderProvenance(),
  };
}

function edgePropAssert(eid: EID, prop: string, value: PropValue): AssertInput {
  return {
    type: "assert",
    v: 1,
    target: { kind: "edge-prop", eid, prop },
    value,
    validFrom: 0,
    validTo: null,
    replicaId: "code-miner",
    provenance: placeholderProvenance(),
  };
}

// ============================================================================================
// Probed tier (ADR-B9a, N5): gated behind KIP_INDEX_TOOLS; absent/failed → recorded skip, never a
// fabricated metric. Runs synchronously (spawnSync) but reuses ask.ts's resolve/spawn/env helpers.
// ============================================================================================

function toolsEnabled(env: NodeJS.ProcessEnv): boolean {
  const v = env.KIP_INDEX_TOOLS;
  return v !== undefined && v.length > 0 && v !== "0" && v.toLowerCase() !== "false";
}

/** One probed-tool outcome: an emitted metric (+ its `<metric>Tool` companion) or a recorded skip. */
interface ToolOutcome {
  /** node-prop entries to emit on the repo node (metric + `<metric>Tool` companion, or a skip). */
  props: Array<{ prop: string; value: PropValue }>;
}

/**
 * The repo-node metric prop each wired accelerator tool emits — declared STATICALLY so the LOC-collision
 * guard (round-3 finding) can be decided BEFORE spawning. tokei/scc/cloc all count into the SAME
 * `linesOfCode` cell, so only the FIRST available one may write it; the rest loud-skip. rg is orthogonal
 * (`todoMarkers`), so it never collides. Kept in lock-step with `TOOL_EXTRACTORS` below.
 */
const TOOL_METRIC_PROP: Partial<Record<ProbedTool, string>> = {
  tokei: "linesOfCode",
  scc: "linesOfCode",
  cloc: "linesOfCode",
  rg: "todoMarkers",
};

/**
 * Thrown by {@link runSync} when a win32 `.cmd` shim would be handed an argv element carrying a cmd
 * metacharacter (round-3 finding). Distinct from the generic tool-failure path so {@link probeTool}
 * records an HONEST, miner-attributed skip reason that NAMES the offending path — rather than surfacing
 * ask.ts's graph-QA/claude "refusing to spawn the claude CLI" message, which is about a DIFFERENT binary.
 */
class UnsafeArgvError extends Error {
  constructor(readonly offendingPath: string) {
    super(`unsafe path for argv on win32: ${offendingPath}`);
    this.name = "UnsafeArgvError";
  }
}

// The cmd metacharacter set (mirrors ask.ts's `CMD_METACHARACTERS`) used ONLY to attribute the skip
// reason correctly in the miner. This does NOT replace or weaken ask.ts's gate: `buildHarnessSpawn`
// still runs its own `assertShellSafeArgv`; the miner simply rejects first, with a truthful reason.
// eslint-disable-next-line no-control-regex -- CR/LF are exactly what must be rejected here.
const WIN32_CMD_METACHAR = /[&|<>^()%!\r\n]/;

/**
 * Probe (and, when present, run) one optional analysis tool over the tracked files. When
 * KIP_INDEX_TOOLS is off, or the tool is not on PATH, or it errors / yields no parseable metric, the
 * outcome is a single `skipped:<tool>` prop with a non-empty REASON — never a guessed metric.
 *
 * `providedBy` records which tool already wrote each repo-node metric cell; a later tool that would
 * write an already-provided cell loud-skips (first-available-wins) so no probed metric is silently
 * overwritten (round-3 finding).
 */
function probeTool(
  tool: ProbedTool,
  repoDir: string,
  relPaths: string[],
  env: NodeJS.ProcessEnv,
  providedBy: Map<string, ProbedTool>,
): ToolOutcome {
  const skip = (reason: string): ToolOutcome => ({ props: [{ prop: `skipped:${tool}`, value: reason }] });

  if (!toolsEnabled(env)) {
    return skip("optional analysis tools are opt-in — set KIP_INDEX_TOOLS=1 to enable");
  }
  const binary = resolveHarnessBinary(tool, env);
  if (binary === undefined) return skip(`\`${tool}\` is not on PATH`);
  if (probeVersionOf(binary) !== 0) return skip(`\`${tool} --version\` did not exit 0 (${binary.path})`);

  const extractor = TOOL_EXTRACTORS[tool];
  if (extractor === undefined) {
    return skip(`\`${tool}\` is present (${binary.path}) but no metric extractor is wired in this build`);
  }
  // First-available-wins: skip (with a reason) any LOC tool whose metric cell a prior tool already filled.
  const willEmitProp = TOOL_METRIC_PROP[tool];
  if (willEmitProp !== undefined) {
    const owner = providedBy.get(willEmitProp);
    if (owner !== undefined) return skip(`${willEmitProp} already provided by ${owner}`);
  }
  try {
    const metric = extractor(binary, repoDir, relPaths, env);
    if (metric === undefined) return skip(`\`${tool}\` produced no parseable metric`);
    providedBy.set(metric.prop, tool); // claim the cell so later same-metric tools loud-skip.
    const props: Array<{ prop: string; value: PropValue }> = [{ prop: metric.prop, value: metric.value }];
    // ADR-B9b: pair the metric with a `<metric>Tool` prop naming the binary — but ONLY when the value
    // came from an ACTUAL spawn. The guaranteed-0 empty-tracked-set fast path never invokes the binary,
    // so it carries no provenance companion for a tool that never ran (round-3 finding / N5).
    if (metric.spawned) props.push({ prop: `${metric.prop}Tool`, value: tool });
    return { props };
  } catch (e) {
    if (e instanceof UnsafeArgvError) return skip(e.message);
    return skip(`\`${tool}\` failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** A parsed accelerator metric. Its `prop` gets a `<metric>Tool` companion ONLY when `spawned` is true. */
interface ToolMetric {
  prop: string;
  value: PropValue;
  /** True iff the value came from an actual binary spawn (false for the guaranteed-0 empty-set path). */
  spawned: boolean;
}

type ToolExtractor = (
  binary: ResolvedHarnessBinary,
  repoDir: string,
  relPaths: string[],
  env: NodeJS.ProcessEnv,
) => ToolMetric | undefined;

/**
 * Run a resolved binary synchronously via ask.ts's win32-safe spawn plan; capped + timed. Threads the
 * FULL `ResolvedHarnessBinary` (finding #11) so `buildHarnessSpawn` uses the platform-aware
 * `isWindowsShim` decision `resolveHarnessBinary` already made — never a path-extension re-guess.
 *
 * `okExitCodes` (finding #6) lists the SUCCESSFUL non-zero exit codes for tools whose "clean" result is
 * a non-zero status: e.g. ripgrep exits 1 on ZERO matches, which is a valid empty result, NOT a tool
 * failure. Any other non-zero status still throws (rg exit 2 = a real error). A `throw` here becomes an
 * N5 `skipped:<tool>` with the reason — never a fabricated metric.
 */
function runSync(
  binary: ResolvedHarnessBinary,
  args: string[],
  repoDir: string,
  env: NodeJS.ProcessEnv,
  okExitCodes: readonly number[] = [],
): string {
  // On a win32 `.cmd` shim, an argv element with a cmd metacharacter cannot be safely passed through
  // the cmd.exe trampoline. Reject it here with a miner-attributed reason that names the offending path
  // (round-3 finding) BEFORE `buildHarnessSpawn` would throw ask.ts's claude-CLI-specific message.
  if (binary.isWindowsShim) {
    for (const part of [binary.path, ...args]) {
      if (WIN32_CMD_METACHAR.test(part)) throw new UnsafeArgvError(part);
    }
  }
  const plan = buildHarnessSpawn(binary, args);
  const r = spawnSync(plan.command, plan.args, {
    cwd: repoDir,
    env: buildHarnessEnv(env),
    windowsHide: true,
    windowsVerbatimArguments: plan.windowsVerbatimArguments,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
    timeout: 60_000,
    killSignal: "SIGKILL",
  });
  if (r.error !== undefined) throw r.error;
  if (r.status !== 0 && !(r.status !== null && okExitCodes.includes(r.status))) {
    throw new Error(`exit ${r.status ?? "signal"}`);
  }
  return r.stdout ?? "";
}

/**
 * tokei/scc/cloc share a JSON "code lines" summary; each parses its own shape. Every extractor is
 * scoped to the tracked `relPaths` (finding #7) — passing the git-tracked file list as explicit path
 * args instead of `.`, so the probed metric covers EXACTLY the analyzed module set (the sha-anchored
 * provenance), never untracked or glob-excluded files. An empty tracked set ⇒ a real zero, no spawn.
 */
const TOOL_EXTRACTORS: Partial<Record<ProbedTool, ToolExtractor>> = {
  tokei: (bin, repoDir, rel, env) => {
    if (rel.length === 0) return { prop: "linesOfCode", value: 0, spawned: false };
    const out = JSON.parse(runSync(bin, ["--output", "json", ...rel], repoDir, env)) as Record<
      string,
      { code?: number } | undefined
    >;
    let code = 0;
    for (const [lang, stats] of Object.entries(out)) {
      if (lang === "Total") continue;
      if (stats && typeof stats.code === "number") code += stats.code;
    }
    return { prop: "linesOfCode", value: code, spawned: true };
  },
  scc: (bin, repoDir, rel, env) => {
    if (rel.length === 0) return { prop: "linesOfCode", value: 0, spawned: false };
    const out = JSON.parse(runSync(bin, ["--format", "json", ...rel], repoDir, env)) as Array<{ Code?: number }>;
    const code = out.reduce((sum, e) => sum + (typeof e.Code === "number" ? e.Code : 0), 0);
    return { prop: "linesOfCode", value: code, spawned: true };
  },
  cloc: (bin, repoDir, rel, env) => {
    if (rel.length === 0) return { prop: "linesOfCode", value: 0, spawned: false };
    const out = JSON.parse(runSync(bin, ["--json", ...rel], repoDir, env)) as { SUM?: { code?: number } };
    const code = out.SUM?.code;
    return typeof code === "number" ? { prop: "linesOfCode", value: code, spawned: true } : undefined;
  },
  rg: (bin, repoDir, rel, env) => {
    // A deterministic count of TODO/FIXME markers over the tracked set (STDIN-free; paths/flags only).
    // rg exits 1 on ZERO matches — a valid empty result, NOT a failure (finding #6): allow exit 1, whose
    // stdout is empty ⇒ count 0. rg exit ≥2 still throws → a recorded skip.
    if (rel.length === 0) return { prop: "todoMarkers", value: 0, spawned: false };
    const out = runSync(bin, ["--count-matches", "--no-heading", "TODO|FIXME", ...rel], repoDir, env, [1]);
    let count = 0;
    for (const line of out.split("\n")) {
      const colon = line.lastIndexOf(":");
      if (colon < 0) continue;
      const n = Number(line.slice(colon + 1).trim());
      if (Number.isFinite(n)) count += n;
    }
    return { prop: "todoMarkers", value: count, spawned: true };
  },
};

// ============================================================================================
// The fact-building core (ADR-B9b) — DETERMINISTIC, synchronous, graph-read-free (INV-A1).
// ============================================================================================

/** Minimal advisory glob (`*` = one segment, `**` = any, `?` = one char) → an anchored RegExp. */
function globToRegExp(glob: string): RegExp {
  let re = "";
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        re += ".*";
        i += 1;
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") {
      re += "[^/]";
    } else if ("\\^$.|+()[]{}".includes(c)) {
      re += `\\${c}`;
    } else {
      re += c;
    }
  }
  return new RegExp(`^${re}$`);
}

function applyGlobFilters(files: string[], include?: string[], exclude?: string[]): string[] {
  let out = files;
  if (include && include.length > 0) {
    const res = include.map(globToRegExp);
    out = out.filter((f) => res.some((re) => re.test(f)));
  }
  if (exclude && exclude.length > 0) {
    const res = exclude.map(globToRegExp);
    out = out.filter((f) => !res.some((re) => re.test(f)));
  }
  return out;
}

/**
 * The synchronous fact-building core (ADR-B9): read the git-tracked source tree and return an
 * `AcquisitionResult`. Reads the graph NOTHING (INV-A1) — it only inspects the repo dir. Fully
 * deterministic: a re-run over the same repo state returns a byte-identical candidate set.
 */
export function buildCodeMinerResult(input: CodeMinerInput): CodeMinerResult {
  const env = process.env;
  // DEFECT 1 fix: the given path may be a SUBDIRECTORY of a repo. Locate the enclosing git root by
  // walking up (throws N5 if none), read git metadata (HEAD sha, tracked set, repoId) from that root,
  // and scope the analyzed module set to files UNDER the given path. When the path IS the git root,
  // `scopeToSubdir` returns the full set, so behavior is unchanged.
  const givenPath = resolveNative(input.repoDir);
  const gitRoot = findGitRoot(givenPath);
  const gitDir = gitDirOf(gitRoot);
  const gitSha = input.gitSha ?? resolveHeadSha(gitDir);
  const repoId = repoIdOf(gitRoot);

  const trackedAll = readTrackedFiles(gitDir).sort();
  const scoped = scopeToSubdir(trackedAll, gitRoot, givenPath);
  const tracked = applyGlobFilters(scoped, input.include, input.exclude);
  const trackedSet = new Set(tracked);

  const proposed: Array<AssertInput | RetractInput> = [];

  // (1) The top-level code:repo node.
  const rEid = repoEid(repoId);
  proposed.push(nodeAssert(rEid, "code:repo"));

  // (2) Probed tools (recorded skip-with-reason when disabled/absent; a metric + companion when run).
  //     `providedBy` enforces first-available-wins per metric cell (tokei/scc/cloc all target the SAME
  //     repo-node `linesOfCode` cell): the first to fill it writes it; the rest loud-skip with a reason,
  //     so no probed metric is silently overwritten (round-3 finding).
  const providedBy = new Map<string, ProbedTool>();
  for (const tool of PROBED_TOOLS) {
    const outcome = probeTool(tool, gitRoot, tracked, env, providedBy);
    for (const p of outcome.props) proposed.push(nodePropAssert(rEid, p.prop, p.value));
  }

  // Per-module analysis, in deterministic (sorted) path order.
  const imports: Array<{ fromRel: string; spec: string; toRel: string }> = [];
  const dependsOn: Array<{ fromRel: string; spec: string; pkg: string }> = [];
  const exportsBy: Array<{ relPath: string; symbol: string }> = [];

  for (const relPath of tracked) {
    let raw: Buffer;
    try {
      raw = readFileSync(joinNative(gitRoot, relPath));
    } catch {
      // Tracked but not readable from the working tree (e.g. deleted) — surface nothing rather than
      // fabricate a module for a file we cannot read (N5). Skipped silently by omission of this path.
      continue;
    }
    const content = raw.toString("utf8");
    const mEid = moduleEid(repoId, relPath);
    // (3) code:module node + guaranteed node-props (format, newline linesOfCode, content BlobRef) +
    //     repo→module code:contains edge. `linesOfCode`/`content` are GUARANTEED-tier (computed from the
    //     bytes just read, ZERO external tools) — the per-module `linesOfCode` cell is distinct from any
    //     repo-level probed `linesOfCode` total, so they never collide (findings #1/#3).
    proposed.push(nodeAssert(mEid, "code:module"));
    proposed.push(nodePropAssert(mEid, "format", detectFormat(relPath, content)));
    proposed.push(nodePropAssert(mEid, "linesOfCode", newlineLoc(raw)));
    proposed.push(nodePropAssert(mEid, "content", { blob: gitBlobOid(raw) } satisfies BlobRef));
    proposed.push(edgeAssert(`code:contains:${repoId}:${relPath}`, "code:contains", rEid, mEid));

    if (!JS_TS_EXTENSIONS.has(extensionOf(relPath))) continue;

    for (const spec of extractImportSpecifiers(content)) {
      const toRel = resolveRelativeImport(relPath, spec, trackedSet);
      if (toRel !== undefined) imports.push({ fromRel: relPath, spec, toRel });
      else if (!spec.startsWith(".")) dependsOn.push({ fromRel: relPath, spec, pkg: packageNameOf(spec) });
    }
    for (const symbol of extractExportedSymbols(content)) {
      exportsBy.push({ relPath, symbol });
    }
  }

  // (4) code:package nodes (unique, sorted) for external dependencies.
  const packages = [...new Set(dependsOn.map((d) => d.pkg))].sort();
  for (const pkg of packages) {
    proposed.push(nodeAssert(packageEid(repoId, pkg), "code:package"));
  }

  // (5) code:imports edges (module→module) carrying the raw specifier as a `spec` edge-prop.
  for (const { fromRel, spec, toRel } of imports) {
    const eid = `code:imports:${repoId}:${fromRel}=>${toRel}`;
    proposed.push(edgeAssert(eid, "code:imports", moduleEid(repoId, fromRel), moduleEid(repoId, toRel)));
    proposed.push(edgePropAssert(eid, "spec", spec));
  }

  // (6) code:depends_on edges (module→package) carrying the raw specifier as a `spec` edge-prop.
  for (const { fromRel, spec, pkg } of dependsOn) {
    const eid = `code:depends_on:${repoId}:${fromRel}=>${pkg}`;
    proposed.push(edgeAssert(eid, "code:depends_on", moduleEid(repoId, fromRel), packageEid(repoId, pkg)));
    proposed.push(edgePropAssert(eid, "spec", spec));
  }

  // (7) code:symbol nodes + module→symbol code:exports edges.
  for (const { relPath, symbol } of exportsBy) {
    const sEid = symbolEid(repoId, relPath, symbol);
    proposed.push(nodeAssert(sEid, "code:symbol"));
    proposed.push(
      edgeAssert(`code:exports:${repoId}:${relPath}#${symbol}`, "code:exports", moduleEid(repoId, relPath), sEid),
    );
  }

  return {
    proposed,
    source: {
      author: MINER_AUTHOR,
      signature: "",
      publicKeyFingerprint: "",
      signedFields: [],
      // ADR-B9b provenance anchor: source.uri = code-resource://<repoId>@<gitSha> (source is {uri, cid}).
      source: { uri: `code-resource://${repoId}@${gitSha}` },
    },
  };
}

/**
 * The injectable dispatch seam (`DispatchMicroagentFn`) `runAcquisition` calls — reads the Miner
 * input off `invocation.input` and returns the `CodeMinerResult` as a successful `MicroagentResult`.
 * It receives ONLY a `MicroagentInvocation` — never a `Repo` — so it structurally cannot write the
 * graph (INV-A1 by construction). A build error is a typed dispatch failure (non-zero exit), never a
 * fabricated fact (N5).
 */
export const codeMinerDispatch: DispatchMicroagentFn = (invocation) => {
  const started = Date.now();
  try {
    const output = buildCodeMinerResult(invocation.input as CodeMinerInput);
    // `elapsedMs` is TRANSPORT-only (finding #9): it rides `MicroagentResult` (the dispatch envelope),
    // NOT `output` (the committed `AcquisitionResult`). `runAcquisition` commits only `output.proposed`/
    // `output.source`/`output.sameAs`, so this wall-clock value can never leak into a fact — no
    // fact-level nondeterminism. `buildCodeMinerResult` itself never reads a clock.
    return Promise.resolve({ exitCode: 0, output, elapsedMs: Date.now() - started });
  } catch (e) {
    return Promise.resolve({
      exitCode: 1,
      output: { error: e instanceof Error ? e.message : String(e) },
      elapsedMs: Date.now() - started,
    });
  }
};
