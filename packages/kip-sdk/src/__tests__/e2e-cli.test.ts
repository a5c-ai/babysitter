/**
 * kip CLI — SHIPPED-BINARY end-to-end suite (work item `e2e-binaries`).
 *
 * SOURCE OF TRUTH: `docs/design/kip-cli.md` (all commands, flags, stdout shapes, the exit-code
 * contract 0-6, and the genty wiring for `kip ask`) + `docs/70-decision-records-adr.md` ADR-B8 (the
 * non-live `kip ask` dispatch-failure channel). Every `it` maps to a documented command/behavior.
 *
 * WHY THIS FILE EXISTS — the biggest coverage gap. `kip-cli.test.ts` drives the command handlers
 * PROGRAMMATICALLY (`runCli(argv, …)` in-process with a spy `Repo`), so the ACTUAL SHIPPED BINARY —
 * `dist/cli/kip.js`, spawned as a child process against a real on-disk repo — has never been exercised
 * by a test. That is exactly the blind spot that let the hand-staged-dist / zero-JS-build bugs slip
 * through (the bundled microagent manifest that `tsc` never emits, D-49(1)). This suite BUILDS the
 * package and SPAWNS the real `node dist/cli/kip.js <args>`, capturing real stdout/stderr/exit codes.
 *
 * BUILD-FIRST DISCIPLINE. `beforeAll` builds the package (`npm run build --workspace=@a5c-ai/kip-sdk`)
 * and asserts the shipped bin files + the bundled microagent manifest all landed in `dist`. One test
 * does a genuinely COLD build (`npm run clean` → rebuild) and re-asserts every declared `bin` + the
 * manifest — the zero-JS-clean-build regression guard: if `tsc` alone were relied on, the manifest
 * would be missing and that test MUST fail.
 *
 * REAL DATA WITHOUT A WORKING WRITE PATH. The SDK `putNode`/`putEdge`/`branch` methods are still
 * throwing `unimplemented` stubs in this tree, so `kip init` and `kip assert node/edge` cannot yet
 * round-trip through the binary (those tests fail HONESTLY — a real implementation gap, not a test
 * defect). But `assertFact` IS implemented and persists signed facts to the on-disk substrate, so the
 * read fixtures are seeded via the SDK `open()`/`assertFact` seam (the same idiom `kip-cli.test.ts`'s
 * `initRepoDir` uses) and then read back THROUGH THE SPAWNED BINARY — genuine end-to-end read coverage.
 *
 * SAFETY. `kip ask` never spends money here: the empty-graph case abstains before any model spawn, and
 * the dispatch-failure case forces the ADR-B8 probe to fail by pointing `KIP_CLAUDE_BIN` at a
 * nonexistent path (so no `claude` process is ever launched). The one paid live ask belongs to
 * `graph-qa-live.test.ts`'s single gated test — never here.
 *
 * HYGIENE. Every child is spawned with a timeout and cannot outlive the test (stdin ends → the process
 * exits; a watchdog SIGKILLs a hung child). Temp repos live under `os.tmpdir()` with a distinct
 * `kip-e2e-cli-` prefix and are removed in `afterAll`. Adds ZERO runtime deps (node builtins only) and
 * never touches `package-lock.json`; it does not weaken/skip/delete any existing test.
 */
import { execSync } from "node:child_process";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { open } from "../index";
import type { EdgeView, NodeView, Provenance, PropValue, RecallResult } from "../index";

// ---------------------------------------------------------------------------
// Paths — the shipped artifacts (spec §1 packaging / `bin`) + the build roots.
// ---------------------------------------------------------------------------

const PACKAGE_ROOT = resolve(__dirname, "..", ".."); // packages/kip-sdk
const REPO_ROOT = resolve(PACKAGE_ROOT, "..", ".."); // repo root (npm workspace root)
const KIP_BIN = join(PACKAGE_ROOT, "dist", "cli", "kip.js");
const MCP_BIN = join(PACKAGE_ROOT, "dist", "mcp", "server.js");
const MANIFEST = join(PACKAGE_ROOT, "dist", "cli", "microagents", "graph-qa", "microagent.json");

/** The declared `bin` map — every entry must resolve to a real file after a build (spec §1, AC-2). */
function declaredBins(): Record<string, string> {
  const pkg = JSON.parse(readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8")) as {
    bin: Record<string, string>;
  };
  return pkg.bin;
}

function packageVersion(): string {
  return (JSON.parse(readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8")) as { version: string })
    .version;
}

// ---------------------------------------------------------------------------
// Build helpers — the build-first discipline (this is the shipped-binary guard).
// ---------------------------------------------------------------------------

/** Run one workspace npm script against the real package build (a full `tsc` + asset bundle). */
function runBuildScript(script: string): void {
  execSync(`npm run ${script} --workspace=@a5c-ai/kip-sdk`, {
    cwd: REPO_ROOT,
    stdio: "pipe",
    timeout: 300_000,
  });
}

/** Ensure a usable built `dist` exists — build only when a shipped artifact is missing. Called from
 *  `beforeAll` (forced once) and defensively before each spawn so a concurrent cold-build in a sibling
 *  file self-heals rather than flaking. */
function ensureBuilt(force = false): void {
  if (force || !existsSync(KIP_BIN) || !existsSync(MCP_BIN) || !existsSync(MANIFEST)) {
    runBuildScript("build");
  }
}

// ---------------------------------------------------------------------------
// Child-process harness — spawn the REAL binary, capture stdout/stderr/exit, never orphan a child.
// ---------------------------------------------------------------------------

interface SpawnResult {
  code: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

/** Spawn `node dist/cli/kip.js <args>` and resolve with the captured channels + exit code. A watchdog
 *  SIGKILLs a child that overruns `timeoutMs` (generous, per the run owner's 5s-flake note); the child
 *  is always reaped. */
function spawnKip(
  args: string[],
  opts: { cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number } = {},
): Promise<SpawnResult> {
  ensureBuilt();
  return new Promise<SpawnResult>((resolveResult, reject) => {
    const child = spawn(process.execPath, [KIP_BIN, ...args], {
      cwd: opts.cwd ?? PACKAGE_ROOT,
      env: { ...process.env, ...opts.env },
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, opts.timeoutMs ?? 30_000);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (c: string) => (stdout += c));
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (c: string) => (stderr += c));
    child.on("error", (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolveResult({ code: code ?? -1, stdout, stderr, timedOut });
    });
  });
}

/** Parse the single canonical JSON value stdout carries under `--json` (spec §3, AC-31). */
function json(stdout: string): unknown {
  return JSON.parse(stdout.trim());
}

// ---------------------------------------------------------------------------
// Fixtures — a real on-disk repo seeded via the SDK `assertFact` seam (writes signed facts the spawned
// binary reads back). `putNode`/`putEdge` are not used: they are still unimplemented (see file header).
// ---------------------------------------------------------------------------

const tmpDirs: string[] = [];
let seedSeq = 0;

function mkTmp(label: string): string {
  const dir = mkdtempSync(join(tmpdir(), `kip-e2e-cli-${label}-`));
  tmpDirs.push(dir);
  return join(dir, "repo");
}

function fixtureProvenance(): Provenance {
  return { author: "e2e", signature: "sig", publicKeyFingerprint: "fpr", signedFields: [] };
}

/** Open a fresh on-disk repo, run `seed` against it, close it, and return the dir (an INITIALIZED kip
 *  repo the binary can read). */
async function seededRepo(
  label: string,
  seed: (assert: (target: unknown, value?: PropValue) => Promise<string>) => Promise<void>,
): Promise<string> {
  const dir = mkTmp(label);
  seedSeq += 1;
  const repo = await open({
    dir,
    replicaId: `e2e-cli-${label}-${seedSeq}-${Date.now()}`,
    keyring: {},
    createIfMissing: true,
  });
  const assert = (target: unknown, value: PropValue = true): Promise<string> =>
    repo
      .assertFact({
        type: "assert",
        v: 1,
        target,
        value,
        validFrom: 0,
        validTo: null,
        replicaId: "e2e-author",
        provenance: fixtureProvenance(),
      } as never)
      .then((r) => r.id);
  await seed(assert);
  repo.close();
  expect(existsSync(join(dir, "manifest.json"))).toBe(true);
  return dir;
}

/** An empty-but-initialized repo (no facts) — for pre-flight/abstain paths. */
async function emptyRepo(label: string): Promise<string> {
  return seededRepo(label, async () => {
    /* no facts */
  });
}

/** Seed the canonical employment graph: `person/tal --employed_by--> org/a5c`, with `content` cells so
 *  `recall({text: question})` deterministically retrieves (the graph-QA fixture idiom). */
async function seedEmployment(
  assert: (target: unknown, value?: PropValue) => Promise<string>,
): Promise<void> {
  await assert({ kind: "node", eid: "person/tal", nodeKind: "person" });
  await assert({ kind: "node-prop", eid: "person/tal", prop: "content" }, "Where does Tal work?");
  await assert({ kind: "node", eid: "org/a5c", nodeKind: "org" });
  await assert({ kind: "node-prop", eid: "org/a5c", prop: "content" }, "a5c");
  await assert({ kind: "edge", eid: "edge/tal-a5c", edgeKind: "employed_by", from: "person/tal", to: "org/a5c" });
}

// ---------------------------------------------------------------------------

beforeAll(() => {
  ensureBuilt(true);
}, 300_000);

afterAll(() => {
  for (const dir of tmpDirs.splice(0)) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* best-effort temp cleanup — never add to the D-38 leak */
    }
  }
});

// ===========================================================================
// BUILD GUARDS — the shipped-binary / zero-JS-clean-build regression net (spec §1, D-49(1)).
// ===========================================================================

describe("build guards — the shipped dist carries every declared bin + the bundled microagent manifest (spec §1)", () => {
  it("a normal `npm run build` produces dist/cli/kip.js, dist/mcp/server.js AND the graph-qa manifest", () => {
    expect(existsSync(KIP_BIN)).toBe(true);
    expect(existsSync(MCP_BIN)).toBe(true);
    // The manifest `tsc` provably NEVER emits — its presence proves the asset-bundle step ran (D-49(1)).
    expect(existsSync(MANIFEST)).toBe(true);
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as { name: string; runtime: { entrypoint: string } };
    expect(manifest.name).toBe("kip-graph-qa");
  });

  it("COLD build (npm run clean → rebuild) lands EVERY declared `bin` + the manifest — the zero-JS guard", () => {
    // This is the exact bug class: a `tsc`-only build ships no `dist/cli/microagents/`, so the built
    // `kip ask` dies at ERR_UNREGISTERED_MANIFEST for every consumer. A clean rebuild MUST restore it.
    runBuildScript("clean");
    ensureBuilt(true); // force a full rebuild
    for (const [name, relPath] of Object.entries(declaredBins())) {
      const abs = join(PACKAGE_ROOT, relPath);
      expect(existsSync(abs), `declared bin '${name}' → ${relPath} must exist after a cold build`).toBe(true);
    }
    expect(existsSync(MANIFEST), "the bundled graph-qa manifest must survive a cold build").toBe(true);
  }, 300_000);
});

// ===========================================================================
// CLI meta — version / usage / pre-flight (no repo needed; spec §2, §3).
// ===========================================================================

describe("meta — `kip --version` / `-V` / unknown command (spec §2, §3)", () => {
  it("`kip --version` prints the @a5c-ai/kip-sdk package version and exits 0", async () => {
    const r = await spawnKip(["--version"]);
    expect(r.code).toBe(0);
    expect(r.stdout.trim()).toBe(packageVersion());
  });

  it("`kip -V` behaves identically to --version (exit 0)", async () => {
    const r = await spawnKip(["-V"]);
    expect(r.code).toBe(0);
    expect(r.stdout).toContain(packageVersion());
  });

  it("an unknown command exits 2 with a usage message on stderr (nothing on stdout)", async () => {
    const r = await spawnKip(["frobnicate"]);
    expect(r.code).toBe(2);
    expect(r.stderr.toLowerCase()).toContain("unknown command");
    expect(r.stdout).toBe("");
  });
});

describe("pre-flight — resolution errors are surfaced before any SDK call, exit 3 (spec §2, §6)", () => {
  it("`kip open` on an uninitialized dir exits 3 with `repo not initialized`", async () => {
    const dir = join(mkdtempSync(join(tmpdir(), "kip-e2e-cli-uninit-")), "nope");
    tmpDirs.push(dir);
    const r = await spawnKip(["open", "--dir", dir, "--replica", "r1"]);
    expect(r.code).toBe(3);
    expect(r.stderr.toLowerCase()).toContain("not initialized");
  });

  it("a repo-opening command with no --replica and empty env exits 3 (`replicaId required`)", async () => {
    const dir = await emptyRepo("no-replica");
    const r = await spawnKip(["fsck", "--dir", dir], { env: { KIP_REPLICA_ID: "" } });
    expect(r.code).toBe(3);
    expect(r.stderr.toLowerCase()).toContain("replicaid required");
  });

  it("`kip get` with no <EID> is a usage error, exit 2", async () => {
    const dir = await emptyRepo("get-no-eid");
    const r = await spawnKip(["get", "--dir", dir, "--replica", "r1", "--json"]);
    expect(r.code).toBe(2);
    expect(r.stdout).toBe("");
  });
});

// ===========================================================================
// READ LIFECYCLE — spawned binary reading SDK-seeded on-disk facts (spec §4.4-§4.9).
// ===========================================================================

describe("get — reads a real NodeView / EdgeView / null through the shipped binary (spec §4.4)", () => {
  it("`kip get <eid> --json` prints the NodeView whose props.segments carry the resolved value; exit 0", async () => {
    const dir = await seededRepo("get-node", async (assert) => {
      await assert({ kind: "node", eid: "person/ada", nodeKind: "Person" });
      await assert({ kind: "node-prop", eid: "person/ada", prop: "name" }, "Ada");
    });
    const r = await spawnKip(["get", "person/ada", "--dir", dir, "--replica", "r1", "--json"]);
    expect(r.code).toBe(0);
    const out = json(r.stdout) as NodeView;
    expect(out.eid).toBe("person/ada");
    expect(out.kind).toBe("Person");
    expect(out.props.name.segments[0]).toMatchObject({ kind: "value", value: "Ada" });
  });

  it("`kip get <unknown-eid> --json` prints the literal null and exits 0 (unknown EID is DATA)", async () => {
    const dir = await emptyRepo("get-unknown");
    const r = await spawnKip(["get", "ghost", "--dir", dir, "--replica", "r1", "--json"]);
    expect(r.code).toBe(0);
    expect(json(r.stdout)).toBeNull();
  });

  it("`kip get <eid> --edge --json` prints the EdgeView (from/to/kind); exit 0", async () => {
    const dir = await seededRepo("get-edge", seedEmployment);
    const r = await spawnKip(["get", "edge/tal-a5c", "--edge", "--dir", dir, "--replica", "r1", "--json"]);
    expect(r.code).toBe(0);
    const out = json(r.stdout) as EdgeView;
    expect(out).toMatchObject({ eid: "edge/tal-a5c", kind: "employed_by", from: "person/tal", to: "org/a5c" });
    expect(out).toHaveProperty("validFrom");
    expect(out).toHaveProperty("provenance");
  });

  it("`kip get <eid>` WITHOUT --json prints a human render (not the machine JSON contract)", async () => {
    const dir = await seededRepo("get-human", async (assert) => {
      await assert({ kind: "node", eid: "person/ada", nodeKind: "Person" });
    });
    const r = await spawnKip(["get", "person/ada", "--dir", dir, "--replica", "r1"]);
    expect(r.code).toBe(0);
    expect(r.stdout).toContain("person/ada");
    let parsedAsJson = true;
    try {
      JSON.parse(r.stdout.trim());
    } catch {
      parsedAsJson = false;
    }
    expect(parsedAsJson).toBe(false);
  });
});

describe("query — typed bounded traversal drained to an array; mandatory bound (spec §4.5)", () => {
  it("`kip query --seed <eid> --direction out --depth 2 --max-fanout 8 --json` prints a JSON array; exit 0", async () => {
    const dir = await seededRepo("query", seedEmployment);
    const r = await spawnKip([
      "query", "--seed", "person/tal", "--direction", "out", "--depth", "2", "--max-fanout", "8",
      "--dir", dir, "--replica", "r1", "--json",
    ]);
    expect(r.code).toBe(0);
    const out = json(r.stdout) as Array<NodeView | EdgeView>;
    expect(Array.isArray(out)).toBe(true);
    // The seed node is a member of the traversal (order/content is the SDK's; membership is the contract).
    expect(out.some((v) => v.eid === "person/tal")).toBe(true);
  });

  it("`kip query` without --depth/--max-fanout exits 2 (usage error — the bound is mandatory)", async () => {
    const dir = await emptyRepo("query-unbounded");
    const r = await spawnKip(["query", "--seed", "e1", "--direction", "out", "--dir", dir, "--replica", "r1", "--json"]);
    expect(r.code).toBe(2);
    expect(r.stdout).toBe("");
  });
});

describe("recall — hybrid retrieval prints RecallResult[] (spec §4.6)", () => {
  it("`kip recall \"<q>\" --k 5 --json` prints a RecallResult[] (each {eid,view,score,ranks,conflicted}); exit 0", async () => {
    const dir = await seededRepo("recall", seedEmployment);
    const r = await spawnKip(["recall", "Where does Tal work?", "--k", "5", "--dir", dir, "--replica", "r1", "--json"]);
    expect(r.code).toBe(0);
    const out = json(r.stdout) as RecallResult[];
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBeGreaterThan(0);
    expect(out[0]).toHaveProperty("score");
    expect(out[0]).toHaveProperty("ranks");
    expect(out[0]).toHaveProperty("conflicted");
  });

  it("an empty result prints `[]` and exits 0 (empty is valid data)", async () => {
    const dir = await emptyRepo("recall-empty");
    const r = await spawnKip(["recall", "nobody at all", "--k", "3", "--dir", dir, "--replica", "r1", "--json"]);
    expect(r.code).toBe(0);
    expect(json(r.stdout)).toEqual([]);
  });
});

describe("asof — a fixed-AsOf sub-read (spec §4.7)", () => {
  it("`kip asof --valid-time <t> get <unknown-eid> --json` prints null at the frontier; exit 0", async () => {
    const dir = await emptyRepo("asof-get");
    const r = await spawnKip(["asof", "--valid-time", "1000", "get", "ghost", "--dir", dir, "--replica", "r1", "--json"]);
    expect(r.code).toBe(0);
    expect(json(r.stdout)).toBeNull();
  });

  it("`kip asof --valid-time <t>` with NO sub-read selector exits 2 (usage error)", async () => {
    const dir = await emptyRepo("asof-no-subread");
    const r = await spawnKip(["asof", "--valid-time", "1000", "--dir", dir, "--replica", "r1"]);
    expect(r.code).toBe(2);
  });
});

describe("fsck — integrity gate; the ok path exits 0 with the full report (spec §4.8)", () => {
  it("`kip fsck --json` on a healthy repo prints the FsckReport and exits 0", async () => {
    const dir = await seededRepo("fsck-ok", seedEmployment);
    const r = await spawnKip(["fsck", "--dir", dir, "--replica", "r1", "--json"]);
    expect(r.code).toBe(0);
    const report = json(r.stdout) as { ok: boolean; badSignatures: unknown[] };
    expect(report.ok).toBe(true);
    expect(report).toHaveProperty("headsMatch");
    expect(report.badSignatures).toEqual([]);
  });
});

describe("rollup — materialize a snapshot through an author-HLC (spec §4.9)", () => {
  it("`kip rollup --through-hlc <hlc> --json` prints {rollup:<CID>, throughHlc}; exit 0", async () => {
    const dir = await seededRepo("rollup", seedEmployment);
    const r = await spawnKip(["rollup", "--through-hlc", "100", "--dir", dir, "--replica", "r1", "--json"]);
    expect(r.code).toBe(0);
    const out = json(r.stdout) as Record<string, unknown>;
    expect(typeof out.rollup).toBe("string");
    expect(out).toHaveProperty("throughHlc");
  });

  it("omitting --through-hlc exits 2 (usage error)", async () => {
    const dir = await emptyRepo("rollup-missing");
    const r = await spawnKip(["rollup", "--dir", dir, "--replica", "r1", "--json"]);
    expect(r.code).toBe(2);
  });
});

describe("sync — graceful typed error without a real transport (spec §4.10; see report: full sync e2e is untestable)", () => {
  it("`kip sync <remote> --json` surfaces a typed error via the two-channel contract (no crash, no stack dump)", async () => {
    // NOTE: this round's SDK resolves a RemoteRef against an IN-PROCESS replica registry (real
    // network/git-remote transport is out of scope), so an unknown remote is a typed rejection rather
    // than a completed sync. What the shipped binary MUST do is fail on a typed channel — never crash —
    // with a machine-readable error and a non-zero exit; the happy-path SyncReport (exit 0) and the
    // exit-4 transport-failure path are not reachable e2e until transport lands.
    const dir = await emptyRepo("sync");
    const r = await spawnKip(["sync", "origin", "--dir", dir, "--replica", "r1", "--json"]);
    expect(r.code).not.toBe(0);
    expect([1, 4]).toContain(r.code);
    const errObj = json(r.stderr) as { error?: { code?: string } };
    expect(typeof errObj.error?.code).toBe("string");
    expect(r.stdout).toBe(""); // stdout is not polluted on the error channel
  });
});

// ===========================================================================
// ask — the non-live graph-QA channels (spec §4.11, §5; ADR-B8). NEVER spends money (see file header).
// ===========================================================================

describe("ask — non-live behavior is deterministic and never fabricates (spec §4.11, §5; ADR-B8)", () => {
  it("on an EMPTY graph, `kip ask` abstains: {answer:null, status:'unanswerable'} at exit 0 (no model spawn)", async () => {
    const dir = await emptyRepo("ask-abstain");
    const r = await spawnKip(["ask", "Where does Tal work?", "--dir", dir, "--replica", "r1", "--json"], {
      // Belt-and-braces: even though an empty retrieval short-circuits before synthesis, pin the model
      // binary to a nonexistent path so this test can NEVER spend money on any machine.
      env: { KIP_CLAUDE_BIN: join(tmpdir(), "definitely-no-claude-here-e2e"), KIP_ASK_LIVE: "" },
    });
    expect(r.code).toBe(0);
    const out = json(r.stdout) as Record<string, unknown>;
    expect(out.status).toBe("unanswerable");
    expect(out.answer).toBeNull();
  });

  it("with facts to synthesize but NO model available, `kip ask` fails via the dispatch-failure channel (exit 5) — never crashes, never fabricates", async () => {
    const dir = await seededRepo("ask-dispatch-fail", seedEmployment);
    const r = await spawnKip(["ask", "Where does Tal work?", "--dir", dir, "--replica", "r1", "--json"], {
      // Force the ADR-B8 availability probe to fail WITHOUT launching any process: point the harness
      // binary at a nonexistent path. `claude --version` "exits 127" → no model → exit 5, no spend.
      env: { KIP_CLAUDE_BIN: join(tmpdir(), "definitely-no-claude-here-e2e"), KIP_ASK_LIVE: "" },
    });
    expect(r.code).toBe(5);
    // N5: nothing fabricated — no `answer` field on stdout (either empty, or a JSON without `answer`).
    if (r.stdout.trim().length > 0) {
      expect(json(r.stdout)).not.toHaveProperty("answer");
    }
    // The failure is the typed dispatch-failure error, not a raw crash / stack trace.
    expect(r.stderr.toLowerCase()).toContain("dispatch");
  });
});

// ===========================================================================
// WRITE PATH — spec §4.1/§4.2 (init / assert). EXPECTED TO FAIL: the SDK putNode/putEdge/branch seams
// are still `unimplemented` in this tree (a real implementation gap the RED gate should surface).
// ===========================================================================

describe("write path — init / assert node / assert edge (spec §4.1, §4.2) [expected-fail: SDK write seams unimplemented]", () => {
  it("`kip init --create` prints {created:true, manifestGenesisCid, branch} and exits 0", async () => {
    const dir = mkTmp("init");
    const r = await spawnKip(["init", "--create", "--dir", dir, "--replica", "r1", "--root-key", "fpr-root-1", "--json"]);
    expect(r.code).toBe(0);
    const out = json(r.stdout) as Record<string, unknown>;
    expect(out.created).toBe(true);
    expect(out).toHaveProperty("branch");
    expect(out).toHaveProperty("manifestGenesisCid");
  });

  it("`kip assert node --eid e1 --kind Person --prop name=\"Ada\"` prints the stamped echo {id,hlc,seq,status,eid}; exit 0", async () => {
    const dir = await emptyRepo("assert-node");
    // The keyring is required for writes (spec §2): the SDK `open()` fixture wrote no keyring.json, so
    // supply one via env so the write pre-flight passes and the failure is the SDK seam, not resolution.
    const r = await spawnKip(
      ["assert", "node", "--eid", "e1", "--kind", "Person", "--prop", 'name="Ada"', "--dir", dir, "--replica", "r1", "--json"],
      { env: { KIP_KEYRING: writeTempKeyring() } },
    );
    expect(r.code).toBe(0);
    const out = json(r.stdout) as Record<string, unknown>;
    expect(out.eid).toBe("e1");
    expect(["pending", "durable"]).toContain(out.status);
  });

  it("`kip assert edge --kind knows --from e1 --to e2 --valid-from 0` prints the stamped echo; exit 0", async () => {
    const dir = await emptyRepo("assert-edge");
    const r = await spawnKip(
      ["assert", "edge", "--kind", "knows", "--from", "e1", "--to", "e2", "--valid-from", "0", "--dir", dir, "--replica", "r1", "--json"],
      { env: { KIP_KEYRING: writeTempKeyring() } },
    );
    expect(r.code).toBe(0);
    const out = json(r.stdout) as Record<string, unknown>;
    expect(out).toHaveProperty("eid");
    expect(["pending", "durable"]).toContain(out.status);
  });
});

/** Drop a readable keyring.json in a temp dir and return its path (satisfies the write keyring
 *  pre-flight; content is opaque to the SDK for this scaffold). */
function writeTempKeyring(): string {
  const dir = mkdtempSync(join(tmpdir(), "kip-e2e-cli-keyring-"));
  tmpDirs.push(dir);
  const path = join(dir, "keyring.json");
  writeFileSync(path, JSON.stringify({ note: "e2e keyring material" }));
  return path;
}
