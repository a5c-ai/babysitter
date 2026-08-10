/**
 * kip CLI — FROZEN acceptance suite (spec-driven, pre-implementation).
 *
 * SOURCE OF TRUTH: `docs/design/kip-cli.md` §7 "Acceptance criteria" (AC-1..AC-32), grounded in
 * §1-§6 (packaging/`bin`, resolution/identity/keyring, the exit-code contract, the command surface,
 * the genty wiring for `kip ask`), plus `docs/design/kip-graph-qa.md` (the read-only graph-QA
 * microagent `kip ask` dispatches: INV-A1 "authors nothing", N5 abstention). Every `it` below maps to
 * a numbered acceptance criterion in kip-cli.md §7; the block-level `describe` names cite the AC id.
 *
 * TEST SURFACE (primary, per the run owner). The command handlers are exercised PROGRAMMATICALLY via
 * `runCli(argv, { cwd, stdout, stderr, ... })` — no subprocess is spawned. stdout/stderr are captured
 * as strings and the returned exit code asserted, so the JSON output shape + exit-code contract
 * (spec §3) is the machine-checkable contract. To stay deterministic and DECOUPLED from the concrete
 * SDK `Repo` (the command-dispatch criteria assert the argv→SDK-method wiring, not the substrate), the
 * dispatch criteria inject a SPY `Repo` through the `openRepo` seam and assert (a) which SDK method the
 * parsed argv drives, with what arguments, and (b) the rendered stdout/exit. `kip ask` is made
 * deterministic with an injected scripted `DispatchMicroagentFn` — the M6/M7 `makeScriptedDispatch`
 * idiom (see `fixtures-m6.ts`) — so no real genty subprocess runs. Pure-CLI behaviors (usage errors,
 * pre-flight resolution errors, the dependency boundary) are exercised directly, no repo required.
 *
 * STATUS: `src/cli/` and the SDK write seams (`putNode`/`putEdge`/`branch`) are IMPLEMENTED and this
 * suite is GREEN. (Historically this file was frozen pre-implementation, when `runCli` was a throwing
 * `unimplemented` stub and every test failed on its leading `await run(...)`; it now asserts the shipped
 * handler behavior.)
 *
 * Non-goal: these tests do NOT re-implement the CLI, and they add NO runtime dependency and NEVER
 * touch `package-lock.json`. They also do not weaken/skip any existing test.
 */
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { KipError, open } from "../index";
import type {
  DispatchMicroagentFn,
  EdgeView,
  FsckReport,
  MicroagentInvocation,
  MicroagentManifest,
  MicroagentResult,
  NodeView,
  OpenOptions,
  ReadView,
  RecallResult,
  Repo,
  SyncReport,
} from "../index";
import { runCli } from "../cli";
import type { RunCliOptions } from "../cli";

// ---------------------------------------------------------------------------
// Harness — programmatic invocation + capture (spec §7: "the CLI `main(argv)` entry, invoked
// in-process with a stub Repo/dispatcher").
// ---------------------------------------------------------------------------

interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/** Invoke `runCli`, capturing the two channels and the resolved exit code. */
async function run(
  argv: string[],
  opts: Partial<RunCliOptions> & { cwd: string },
): Promise<RunResult> {
  const out: string[] = [];
  const err: string[] = [];
  const code = await runCli(argv, {
    cwd: opts.cwd,
    env: opts.env ?? {},
    stdout: (c) => out.push(c),
    stderr: (c) => err.push(c),
    openRepo: opts.openRepo,
    dispatchMicroagent: opts.dispatchMicroagent,
    qaManifest: opts.qaManifest,
  });
  return { code, stdout: out.join(""), stderr: err.join("") };
}

/** Parse the single canonical JSON value stdout carries under `--json` (spec §3, AC-31). */
function json(stdout: string): unknown {
  return JSON.parse(stdout.trim());
}

// ---------------------------------------------------------------------------
// Spy `Repo` — records every method call + returns scripted values. Injected via `openRepo` so a
// test asserts the CLI→SDK dispatch contract without depending on the real (stubbed) method body.
// ---------------------------------------------------------------------------

interface RecordedCall {
  method: string;
  args: unknown[];
}

interface SpyRepo {
  repo: Repo;
  calls: RecordedCall[];
}

const WRITE_METHODS = new Set([
  "assertFact",
  "retractFact",
  "supersedeFact",
  "reAttestFact",
  "ingest",
  "putNode",
  "putEdge",
  "tombstone",
  "excise",
  "revokeKey",
  "registerFunctionality",
  "runContextualQuery",
  "runAcquisition",
  "learn",
  "commit",
  "txn",
]);

/** Build a spy `Repo`. `scripted[method]` supplies the return value for a call; unhandled methods
 *  record the call and return `undefined`. `withScope` returns the SAME spy (so a scoped command
 *  keeps recording) while still logging the scope argument (AC-10). */
function makeSpyRepo(scripted: Record<string, (...args: any[]) => any> = {}): SpyRepo {
  const calls: RecordedCall[] = [];
  const repo = new Proxy(
    {},
    {
      get(_t, prop) {
        if (typeof prop !== "string") return undefined;
        if (prop === "then") return undefined; // never a thenable
        return (...args: unknown[]) => {
          calls.push({ method: prop, args });
          if (prop === "withScope") return repo;
          const handler = scripted[prop];
          return handler ? handler(...args) : undefined;
        };
      },
    },
  ) as unknown as Repo;
  return { repo, calls };
}

/** Wrap a spy `Repo` as an `openRepo` seam, recording the `OpenOptions` the CLI resolved (AC-3/AC-5). */
function openSeam(repo: Repo): {
  openRepo: (o: OpenOptions) => Promise<Repo>;
  openOptions: OpenOptions[];
} {
  const openOptions: OpenOptions[] = [];
  return {
    openRepo: async (o: OpenOptions) => {
      openOptions.push(o);
      return repo;
    },
    openOptions,
  };
}

function methodsCalled(spy: SpyRepo): string[] {
  return spy.calls.map((c) => c.method);
}

function lastCall(spy: SpyRepo, method: string): RecordedCall | undefined {
  return [...spy.calls].reverse().find((c) => c.method === method);
}

// ---------------------------------------------------------------------------
// Scripted `kip ask` dispatch — the M6 idiom (`makeScriptedDispatch`), producing a
// `DispatchMicroagentFn` whose result the CLI maps to the §4.11 stdout shape.
// ---------------------------------------------------------------------------

function makeAskDispatch(
  result: MicroagentResult | ((inv: MicroagentInvocation) => MicroagentResult),
): { dispatchMicroagent: DispatchMicroagentFn; log: MicroagentInvocation[] } {
  const log: MicroagentInvocation[] = [];
  const dispatchMicroagent: DispatchMicroagentFn = async (inv) => {
    log.push(inv);
    return typeof result === "function" ? result(inv) : result;
  };
  return { dispatchMicroagent, log };
}

/** The bundled graph-QA manifest (spec §5 / kip-graph-qa.md §2), pinned so tests can assert the
 *  default `runtime.model` echo (AC-28) and the registered `(name,version)` `--manifest` validates
 *  against (AC-30). */
function qaManifest(model = "qa-default-model"): MicroagentManifest {
  return {
    name: "kip-graph-qa",
    version: "1.0.0",
    description: "Answers a natural-language question over the kip knowledge graph (READ-ONLY).",
    inputSchema: {},
    outputSchema: {},
    isolation: "subprocess",
    runtime: { entrypoint: "kip-graph-qa.mjs", model, timeout: 30_000, tools: ["kip-read"] },
    tags: ["kip", "qa", "read-only"],
    builtIn: false,
  };
}

/** A successful graph-QA `MicroagentResult` (output shape per kip-graph-qa.md §2 `outputSchema`). */
function askOk(fields: {
  answer: string;
  abstained?: boolean;
  citations?: Array<{ factId: string; eid?: string }>;
  usedFacts?: string[];
}): MicroagentResult {
  return {
    exitCode: 0,
    output: {
      answer: fields.answer,
      abstained: fields.abstained ?? false,
      citations: fields.citations ?? [],
      usedFacts: fields.usedFacts ?? [],
    },
    elapsedMs: 0,
  };
}

// ---------------------------------------------------------------------------
// Scripted read-view shapes.
// ---------------------------------------------------------------------------

function provenance(seed = "cli"): NodeView["provenance"] {
  return { author: `author-${seed}`, signature: `sig-${seed}`, publicKeyFingerprint: `fpr-${seed}`, signedFields: [] };
}

function nodeView(eid = "e1"): NodeView {
  return {
    eid,
    kind: "Person",
    props: {
      name: { segments: [{ kind: "value", value: "Ada", validFrom: 0, validTo: null, assertedBy: "F_name" }] },
    },
    provenance: provenance(eid),
  };
}

function edgeView(eid = "edge1"): EdgeView {
  return {
    eid,
    kind: "knows",
    from: "e1",
    to: "e2",
    props: {},
    validFrom: 0,
    validTo: null,
    provenance: provenance(eid),
  };
}

function recallResult(eid = "e1", conflicted = false): RecallResult {
  return {
    eid,
    view: nodeView(eid),
    score: 0.9,
    ranks: { vector: 1, graph: 1 },
    conflicted,
    provenance: provenance(eid),
  };
}

function fsckReport(ok: boolean): FsckReport {
  return {
    ok,
    headsMatch: ok,
    mergeDriverInstalled: true,
    manifestGenesisCidMatch: ok,
    badSignatures: ok ? [] : ["F_bad_sig"],
    authorityViolations: ok ? [] : ["F_bad_authority"],
    excisionResidue: [],
    missingDurable: [],
    missingNonDurable: [],
    promisorMissingDurable: [],
  };
}

function syncReport(withConflict: boolean): SyncReport {
  return {
    received: 2,
    sent: 1,
    merged: 1,
    conflicts: withConflict
      ? [{ cellId: "cell-1", eid: "e1", prop: "name", kind: "supersede", candidates: ["F_a", "F_b"] }]
      : [],
    tip: "digest-tip-1",
  };
}

// ---------------------------------------------------------------------------
// Filesystem fixtures.
// ---------------------------------------------------------------------------

const tmpDirs: string[] = [];
let fixtureSeq = 0;

function mkTmp(label: string): string {
  const dir = mkdtempSync(join(tmpdir(), `kip-cli-${label}-`));
  tmpDirs.push(dir);
  return dir;
}

/** An INITIALIZED kip repo dir (spec §2 "a git dir with a valid /manifest.json"), produced by the
 *  REAL SDK `open()` so the CLI's is-initialized pre-flight sees exactly what the SDK itself writes.
 *  No `keyring.json` is added (write commands' keyring policy is exercised separately, AC-6). */
async function initRepoDir(label: string): Promise<string> {
  const dir = mkTmp(label);
  fixtureSeq += 1;
  const repo = await open({
    dir,
    replicaId: `kip-cli-fixture-${label}-${fixtureSeq}-${Date.now()}`,
    keyring: {},
    createIfMissing: true,
  });
  repo.close();
  expect(existsSync(join(dir, "manifest.json"))).toBe(true);
  return dir;
}

/** Drop a resolvable `keyring.json` into an initialized dir so write-command keyring pre-flight
 *  (spec §2) passes. Content is opaque to the injected spy `openRepo`, so any readable JSON suffices. */
function addKeyring(dir: string): void {
  writeFileSync(join(dir, "keyring.json"), JSON.stringify({ note: "test keyring material" }));
}

/** Recursively list every source file under a dir (AC-1 static import-graph scan). */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

afterAll(() => {
  for (const dir of tmpDirs.splice(0)) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* best-effort tmp cleanup */
    }
  }
});

// ===========================================================================
// AC-1 — Dependency isolation.
// ===========================================================================

describe("AC-1 dependency isolation: the CLI closure is kip-sdk + genty only; NEVER @a5c-ai/babysitter-sdk (spec §1)", () => {
  it("no source file under src/cli/** imports/requires @a5c-ai/babysitter-sdk, and the ask path references @a5c-ai/genty", () => {
    const cliDir = resolve(__dirname, "..", "cli");
    // Expected to fail NOW iff src/cli/ has no files yet — becomes true once the CLI lands.
    expect(existsSync(cliDir)).toBe(true);
    const files = walk(cliDir).filter((f) => f.endsWith(".ts") || f.endsWith(".js") || f.endsWith(".mjs"));
    expect(files.length).toBeGreaterThan(0);

    const combined = files.map((f) => readFileSync(f, "utf8")).join("\n");
    // The load-bearing AC-1 conformance claim: no babysitter-sdk MODULE SPECIFIER anywhere on the
    // CLI path. Scoped to quoted import/require targets (`"@a5c-ai/babysitter-sdk"`) so a prose
    // mention of the forbidden package in a comment is not a false positive.
    expect(combined).not.toMatch(/['"]@a5c-ai\/babysitter-sdk/);
    // And the ask dispatch seam (spec §1/§5) links the genty layers (an actual import specifier).
    expect(combined).toMatch(/['"]@a5c-ai\/genty/);
  });
});

// ===========================================================================
// AC-2 — version / unknown command.
// ===========================================================================

describe("AC-2 version + unknown command (spec §2, §3 exit 2)", () => {
  it("`kip --version` prints the @a5c-ai/kip-sdk package version and exits 0", async () => {
    const version = JSON.parse(readFileSync(resolve(__dirname, "..", "..", "package.json"), "utf8")).version as string;
    const cwd = mkTmp("version");
    const r = await run(["--version"], { cwd });
    expect(r.code).toBe(0);
    expect(r.stdout).toContain(version);
  });

  it("`kip -V` behaves identically to `--version` (exit 0)", async () => {
    const version = JSON.parse(readFileSync(resolve(__dirname, "..", "..", "package.json"), "utf8")).version as string;
    const cwd = mkTmp("version-short");
    const r = await run(["-V"], { cwd });
    expect(r.code).toBe(0);
    expect(r.stdout).toContain(version);
  });

  it("an unknown command (`kip frobnicate`) exits 2 with a usage message on stderr", async () => {
    const cwd = mkTmp("unknown");
    const r = await run(["frobnicate"], { cwd });
    expect(r.code).toBe(2);
    expect(r.stderr.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// AC-3 — kip init.
// ===========================================================================

describe("AC-3 `kip init --create` assembles genesis, calls open(createIfMissing), prints {created,manifestGenesisCid,branch} (spec §4.1)", () => {
  it("creates over an empty dir: open() called with createIfMissing:true and a genesis carrying --root-key; prints created:true; exit 0", async () => {
    const dir = mkTmp("init-empty");
    const spy = makeSpyRepo({ branch: () => "main" });
    const seam = openSeam(spy.repo);
    const r = await run(
      ["init", "--create", "--dir", dir, "--replica", "r1", "--root-key", "fpr-root-1", "--json"],
      { cwd: dir, openRepo: seam.openRepo },
    );
    expect(r.code).toBe(0);
    expect(seam.openOptions.length).toBe(1);
    expect(seam.openOptions[0].createIfMissing).toBe(true);
    expect(seam.openOptions[0].genesis?.rootKeys).toContain("fpr-root-1");

    const out = json(r.stdout) as Record<string, unknown>;
    expect(out.created).toBe(true);
    expect(typeof out.branch).toBe("string");
    expect((out.branch as string).length).toBeGreaterThan(0);
    expect(out).toHaveProperty("manifestGenesisCid");
  });

  it("a second `kip init --create` over a now-non-empty dir exits 3 WITHOUT calling open() (guards accidental re-init)", async () => {
    const dir = mkTmp("init-nonempty");
    writeFileSync(join(dir, "stray.txt"), "not empty");
    const spy = makeSpyRepo();
    const seam = openSeam(spy.repo);
    const r = await run(["init", "--create", "--dir", dir, "--replica", "r1"], {
      cwd: dir,
      openRepo: seam.openRepo,
    });
    expect(r.code).toBe(3);
    expect(seam.openOptions.length).toBe(0);
  });
});

// ===========================================================================
// AC-4 — kip open.
// ===========================================================================

describe("AC-4 `kip open` prints {created:false, branch, manifestGenesisCid}; empty dir exits 3 pre-flight (spec §4.1, §6)", () => {
  it("on an initialized repo: prints created:false + branch (from repo.branch()); exit 0", async () => {
    const dir = await initRepoDir("open-ok");
    const spy = makeSpyRepo({ branch: () => "trunk" });
    const seam = openSeam(spy.repo);
    const r = await run(["open", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
    });
    expect(r.code).toBe(0);
    const out = json(r.stdout) as Record<string, unknown>;
    expect(out.created).toBe(false);
    expect(out.branch).toBe("trunk");
    expect(out).toHaveProperty("manifestGenesisCid");
  });

  it("`kip open` on an empty dir exits 3 (`repo not initialized`) BEFORE any SDK call", async () => {
    const dir = mkTmp("open-empty");
    const spy = makeSpyRepo();
    const seam = openSeam(spy.repo);
    const r = await run(["open", "--dir", dir, "--replica", "r1"], { cwd: dir, openRepo: seam.openRepo });
    expect(r.code).toBe(3);
    expect(seam.openOptions.length).toBe(0);
    expect(r.stderr.toLowerCase()).toContain("not initialized");
  });
});

// ===========================================================================
// AC-5 — missing identity.
// ===========================================================================

describe("AC-5 missing replicaId: a repo-opening command with neither --replica nor KIP_REPLICA_ID exits 3, never opening (spec §2, §6)", () => {
  it("`kip open` with no --replica and empty env exits 3 with a `replicaId required` message; open() not called", async () => {
    const dir = await initRepoDir("no-replica");
    const spy = makeSpyRepo({ branch: () => "main" });
    const seam = openSeam(spy.repo);
    const r = await run(["open", "--dir", dir], { cwd: dir, env: {}, openRepo: seam.openRepo });
    expect(r.code).toBe(3);
    expect(seam.openOptions.length).toBe(0);
    expect(r.stderr.toLowerCase()).toContain("replicaid required");
  });

  it("KIP_REPLICA_ID satisfies the identity requirement (env fallback) — the same command then opens; exit 0", async () => {
    const dir = await initRepoDir("env-replica");
    const spy = makeSpyRepo({ branch: () => "main" });
    const seam = openSeam(spy.repo);
    const r = await run(["open", "--dir", dir, "--json"], {
      cwd: dir,
      env: { KIP_REPLICA_ID: "r-from-env" },
      openRepo: seam.openRepo,
    });
    expect(r.code).toBe(0);
    expect(seam.openOptions.length).toBe(1);
    expect(seam.openOptions[0].replicaId).toBe("r-from-env");
  });
});

// ===========================================================================
// AC-6 — keyring policy.
// ===========================================================================

describe("AC-6 keyring policy: writes require a keyring (exit 3); reads do not (exit 0) (spec §2)", () => {
  it("`kip assert node ...` with no resolvable keyring exits 3 (`keyring required to author facts`)", async () => {
    const dir = await initRepoDir("keyring-write-missing"); // deliberately NO keyring.json
    const spy = makeSpyRepo({ putNode: async () => "e1" });
    const seam = openSeam(spy.repo);
    const r = await run(
      ["assert", "node", "--eid", "e1", "--kind", "Person", "--dir", dir, "--replica", "r1"],
      { cwd: dir, openRepo: seam.openRepo },
    );
    expect(r.code).toBe(3);
    expect(r.stderr.toLowerCase()).toContain("keyring required");
    expect(methodsCalled(spy)).not.toContain("putNode");
  });

  it("`kip get <eid>` with no keyring proceeds (reads verify signatures, they do not sign) — exit 0", async () => {
    const dir = await initRepoDir("keyring-read-optional"); // no keyring.json
    const spy = makeSpyRepo({ getNode: async () => nodeView("e1") });
    const seam = openSeam(spy.repo);
    const r = await run(["get", "e1", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
    });
    expect(r.code).toBe(0);
    expect(json(r.stdout)).toMatchObject({ eid: "e1" });
  });
});

// ===========================================================================
// AC-7 — kip assert node.
// ===========================================================================

describe("AC-7 `kip assert node` parses NodePut, calls putNode, prints the sugar echo (spec §4.2)", () => {
  it("calls putNode with the parsed --eid/--kind/--prop and prints { eid, status } (no fabricated id/hlc/seq); exit 0", async () => {
    const dir = await initRepoDir("assert-node");
    addKeyring(dir);
    const spy = makeSpyRepo({ putNode: async () => "e1" });
    const seam = openSeam(spy.repo);
    const r = await run(
      ["assert", "node", "--eid", "e1", "--kind", "Person", "--prop", "name=\"Ada\"", "--dir", dir, "--replica", "r1", "--json"],
      { cwd: dir, openRepo: seam.openRepo },
    );
    expect(r.code).toBe(0);
    const putNode = lastCall(spy, "putNode");
    expect(putNode).toBeDefined();
    const nodePut = putNode!.args[0] as { eid: string; kind: string; props?: Record<string, unknown> };
    expect(nodePut.eid).toBe("e1");
    expect(nodePut.kind).toBe("Person");
    expect(nodePut.props?.name).toBe("Ada"); // --prop value parsed as a JSON scalar

    const out = json(r.stdout) as Record<string, unknown>;
    expect(out.eid).toBe("e1");
    expect(["pending", "durable"]).toContain(out.status);
    // `putNode` compiles to MULTIPLE facts and returns only the `EID` (docs/40) — there is no single
    // stamped fact identity, so the CLI echoes NONE (a null `id`/`hlc`/`seq` would be a value masquerade,
    // N5). The full stamped envelope is the raw-fact form's contract (AC-… `assert fact`), not this sugar.
    expect(out).not.toHaveProperty("id");
    expect(out).not.toHaveProperty("hlc");
    expect(out).not.toHaveProperty("seq");
  });
});

// ===========================================================================
// AC-8 — kip assert edge.
// ===========================================================================

describe("AC-8 `kip assert edge` parses EdgePut, calls putEdge, prints the sugar echo (spec §4.2)", () => {
  it("calls putEdge with parsed --kind/--from/--to/--valid-from and prints { eid, status } (no fabricated id/hlc/seq); exit 0", async () => {
    const dir = await initRepoDir("assert-edge");
    addKeyring(dir);
    const spy = makeSpyRepo({ putEdge: async () => "knows/e1/e2" });
    const seam = openSeam(spy.repo);
    const r = await run(
      ["assert", "edge", "--kind", "knows", "--from", "e1", "--to", "e2", "--valid-from", "0", "--dir", dir, "--replica", "r1", "--json"],
      { cwd: dir, openRepo: seam.openRepo },
    );
    expect(r.code).toBe(0);
    const putEdge = lastCall(spy, "putEdge");
    expect(putEdge).toBeDefined();
    const edgePut = putEdge!.args[0] as { kind: string; from: string; to: string };
    expect(edgePut.kind).toBe("knows");
    expect(edgePut.from).toBe("e1");
    expect(edgePut.to).toBe("e2");

    const out = json(r.stdout) as Record<string, unknown>;
    expect(out).toHaveProperty("eid");
    expect(["pending", "durable"]).toContain(out.status);
    // Same EID-only sugar contract as AC-7: no fabricated stamped identity on the edge form (N5).
    expect(out).not.toHaveProperty("id");
    expect(out).not.toHaveProperty("hlc");
    expect(out).not.toHaveProperty("seq");
  });
});

// ===========================================================================
// AC-9 — malformed assert fact throws → exit 1.
// ===========================================================================

describe("AC-9 `kip assert fact --file bad.json` surfaces ERR_MALFORMED_INPUT → exit 1 (spec §3, §4.2)", () => {
  it("exits 1 and prints {error:{code:'ERR_MALFORMED_INPUT'}} to stderr under --json", async () => {
    const dir = await initRepoDir("assert-bad-fact");
    addKeyring(dir);
    const badFile = join(dir, "bad.json");
    writeFileSync(badFile, JSON.stringify({ v: 1 })); // well-formed JSON, ill-formed fact
    const spy = makeSpyRepo({
      assertFact: async () => {
        throw new KipError("ERR_MALFORMED_INPUT", "assert: fact is not well-formed");
      },
    });
    const seam = openSeam(spy.repo);
    const r = await run(
      ["assert", "fact", "--file", badFile, "--dir", dir, "--replica", "r1", "--json"],
      { cwd: dir, openRepo: seam.openRepo },
    );
    expect(r.code).toBe(1);
    const errObj = json(r.stderr) as { error?: { code?: string } };
    expect(errObj.error?.code).toBe("ERR_MALFORMED_INPUT");
  });
});

// ===========================================================================
// AC-10 — scope denial → exit 1.
// ===========================================================================

describe("AC-10 scope denial: `kip --tenant t1 assert node ...` surfaces ERR_SCOPE_DENIED → exit 1 (spec §2, §3)", () => {
  it("lenses the repo via withScope({tenant}) then surfaces ERR_SCOPE_DENIED from the scoped write; exit 1", async () => {
    const dir = await initRepoDir("scope-denied");
    addKeyring(dir);
    const spy = makeSpyRepo({
      putNode: async () => {
        throw new KipError("ERR_SCOPE_DENIED", "withScope refuses to author EID outside scope");
      },
    });
    const seam = openSeam(spy.repo);
    const r = await run(
      ["--tenant", "t1", "assert", "node", "--eid", "other/out-of-scope", "--kind", "Person", "--dir", dir, "--replica", "r1", "--json"],
      { cwd: dir, openRepo: seam.openRepo },
    );
    expect(r.code).toBe(1);
    const withScope = lastCall(spy, "withScope");
    expect(withScope).toBeDefined();
    expect((withScope!.args[0] as { tenant?: string }).tenant).toBe("t1");
    const errObj = json(r.stderr) as { error?: { code?: string } };
    expect(errObj.error?.code).toBe("ERR_SCOPE_DENIED");
  });
});

// ===========================================================================
// AC-11 — kip retract.
// ===========================================================================

describe("AC-11 `kip retract --eid e1 --prop name --valid-to <t>` calls retractFact, prints the stamped echo (spec §4.3)", () => {
  it("builds a RetractInput over the named cell and prints {id,hlc,seq,status}; exit 0", async () => {
    const dir = await initRepoDir("retract");
    addKeyring(dir);
    const spy = makeSpyRepo({
      retractFact: async () => ({ id: "F_retract", hlc: { wall: 5, counter: 0 }, seq: 3, status: "pending" }),
    });
    const seam = openSeam(spy.repo);
    const r = await run(
      ["retract", "--eid", "e1", "--prop", "name", "--valid-to", "100", "--dir", dir, "--replica", "r1", "--json"],
      { cwd: dir, openRepo: seam.openRepo },
    );
    expect(r.code).toBe(0);
    const retract = lastCall(spy, "retractFact");
    expect(retract).toBeDefined();
    const input = retract!.args[0] as { target?: { kind?: string; eid?: string; prop?: string } };
    expect(input.target?.eid).toBe("e1");
    expect(input.target?.prop).toBe("name");

    const out = json(r.stdout) as Record<string, unknown>;
    expect(out.id).toBe("F_retract");
    expect(out.seq).toBe(3);
    expect(["pending", "durable"]).toContain(out.status);
  });
});

// ===========================================================================
// AC-12 / AC-13 / AC-14 — kip get.
// ===========================================================================

describe("AC-12 `kip get e1 --json` prints the NodeView (props as Record<PropKey,PropCell>) (spec §4.4)", () => {
  it("calls getNode('e1') and prints the NodeView whose props.name.segments carry the resolved value; exit 0", async () => {
    const dir = await initRepoDir("get-node");
    const spy = makeSpyRepo({ getNode: async (eid: string) => nodeView(eid) });
    const seam = openSeam(spy.repo);
    const r = await run(["get", "e1", "--dir", dir, "--replica", "r1", "--json"], { cwd: dir, openRepo: seam.openRepo });
    expect(r.code).toBe(0);
    expect((lastCall(spy, "getNode")!.args[0] as string)).toBe("e1");
    const out = json(r.stdout) as NodeView;
    expect(out.eid).toBe("e1");
    expect(out.props.name.segments[0]).toMatchObject({ kind: "value", value: "Ada" });
  });
});

describe("AC-13 `kip get <unknown-eid> --json` prints null and exits 0 (unknown EID is DATA) (spec §4.4)", () => {
  it("prints the literal `null` and exits 0", async () => {
    const dir = await initRepoDir("get-unknown");
    const spy = makeSpyRepo({ getNode: async () => null });
    const seam = openSeam(spy.repo);
    const r = await run(["get", "ghost", "--dir", dir, "--replica", "r1", "--json"], { cwd: dir, openRepo: seam.openRepo });
    expect(r.code).toBe(0);
    expect(json(r.stdout)).toBeNull();
  });
});

describe("AC-14 `kip get e1 --edge --json` prints the EdgeView (spec §4.4)", () => {
  it("calls getEdge and prints {eid,kind,from,to,props,validFrom,validTo,provenance}; exit 0", async () => {
    const dir = await initRepoDir("get-edge");
    const spy = makeSpyRepo({ getEdge: async (eid: string) => edgeView(eid) });
    const seam = openSeam(spy.repo);
    const r = await run(["get", "edge1", "--edge", "--dir", dir, "--replica", "r1", "--json"], { cwd: dir, openRepo: seam.openRepo });
    expect(r.code).toBe(0);
    expect(methodsCalled(spy)).toContain("getEdge");
    const out = json(r.stdout) as EdgeView;
    expect(out).toMatchObject({ eid: "edge1", kind: "knows", from: "e1", to: "e2" });
    expect(out).toHaveProperty("validFrom");
    expect(out).toHaveProperty("provenance");
  });
});

// ===========================================================================
// AC-15 / AC-16 — kip query.
// ===========================================================================

describe("AC-15 `kip query --seed e1 --direction out --depth 2 --max-fanout 8 --json` drains query() into an ordered array (spec §4.5)", () => {
  it("calls query with a TraversalSpec {depth:2,maxFanout:8}, prints the yielded views in traversal order; exit 0", async () => {
    const dir = await initRepoDir("query");
    const a = nodeView("n-a");
    const b = nodeView("n-b");
    const spy = makeSpyRepo({
      query: () =>
        (async function* () {
          yield a;
          yield b;
        })(),
    });
    const seam = openSeam(spy.repo);
    const r = await run(
      ["query", "--seed", "e1", "--direction", "out", "--depth", "2", "--max-fanout", "8", "--dir", dir, "--replica", "r1", "--json"],
      { cwd: dir, openRepo: seam.openRepo },
    );
    expect(r.code).toBe(0);
    const spec = lastCall(spy, "query")!.args[0] as { seed?: unknown; direction?: string; depth?: number; maxFanout?: number };
    expect(spec.depth).toBe(2);
    expect(spec.maxFanout).toBe(8);
    expect(spec.direction).toBe("out");

    const out = json(r.stdout) as NodeView[];
    expect(Array.isArray(out)).toBe(true);
    expect(out.map((v) => v.eid)).toEqual(["n-a", "n-b"]); // traversal order preserved
  });
});

describe("AC-16 mandatory bound: `kip query` without --depth/--max-fanout exits 2 and never calls query() (spec §4.5, §6)", () => {
  it("exits 2 (usage error) with query() uncalled — the bound is mandatory, no unbounded default", async () => {
    const dir = await initRepoDir("query-unbounded");
    const spy = makeSpyRepo({ query: () => (async function* () {})() });
    const seam = openSeam(spy.repo);
    const r = await run(["query", "--seed", "e1", "--direction", "out", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
    });
    expect(r.code).toBe(2);
    expect(methodsCalled(spy)).not.toContain("query");
  });
});

// ===========================================================================
// AC-17 — kip recall.
// ===========================================================================

describe("AC-17 `kip recall \"who knows Ada\" --k 5 --json` calls recall and prints RecallResult[] (spec §4.6)", () => {
  it("calls recall with the query text seed + k:5 and prints the fused RecallResult[]; exit 0", async () => {
    const dir = await initRepoDir("recall");
    const spy = makeSpyRepo({ recall: async () => [recallResult("e1")] });
    const seam = openSeam(spy.repo);
    const r = await run(["recall", "who knows Ada", "--k", "5", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
    });
    expect(r.code).toBe(0);
    const q = lastCall(spy, "recall")!.args[0] as Record<string, unknown>;
    expect(q.k).toBe(5);
    expect(JSON.stringify(q)).toContain("who knows Ada"); // positional threaded into the query text seed

    const out = json(r.stdout) as RecallResult[];
    expect(Array.isArray(out)).toBe(true);
    expect(out[0]).toMatchObject({ eid: "e1", conflicted: false });
    expect(out[0]).toHaveProperty("score");
    expect(out[0]).toHaveProperty("ranks");
  });

  it("an empty result prints `[]` and exits 0 (empty is valid data)", async () => {
    const dir = await initRepoDir("recall-empty");
    const spy = makeSpyRepo({ recall: async () => [] });
    const seam = openSeam(spy.repo);
    const r = await run(["recall", "nobody", "--k", "3", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
    });
    expect(r.code).toBe(0);
    expect(json(r.stdout)).toEqual([]);
  });
});

// ===========================================================================
// AC-18 — --fail-on-conflict.
// ===========================================================================

describe("AC-18 --fail-on-conflict: conflicted data is still printed; exit 6 only WITH the flag (spec §3, §4.6)", () => {
  it("without --fail-on-conflict, a conflicted recall result prints and exits 0", async () => {
    const dir = await initRepoDir("conflict-off");
    const spy = makeSpyRepo({ recall: async () => [recallResult("e1", true)] });
    const seam = openSeam(spy.repo);
    const r = await run(["recall", "q", "--k", "3", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
    });
    expect(r.code).toBe(0);
    expect((json(r.stdout) as RecallResult[])[0].conflicted).toBe(true);
  });

  it("with --fail-on-conflict, the same data is printed AND the process exits 6", async () => {
    const dir = await initRepoDir("conflict-on");
    const spy = makeSpyRepo({ recall: async () => [recallResult("e1", true)] });
    const seam = openSeam(spy.repo);
    const r = await run(["recall", "q", "--k", "3", "--fail-on-conflict", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
    });
    expect(r.code).toBe(6);
    expect((json(r.stdout) as RecallResult[])[0].conflicted).toBe(true); // data printed first
  });
});

// ===========================================================================
// AC-19 — kip asof.
// ===========================================================================

describe("AC-19 `kip asof --valid-time <t> get e1` reads through a fixed AsOf ReadView (spec §4.7)", () => {
  it("calls asOf({validTime}) then view.getNode('e1') and prints the NodeView; exit 0", async () => {
    const dir = await initRepoDir("asof-get");
    const viewCalls: RecordedCall[] = [];
    const view: ReadView = {
      getNode: async (eid) => {
        viewCalls.push({ method: "getNode", args: [eid] });
        return nodeView(eid);
      },
      getEdge: async () => null,
      query: () => (async function* () {})(),
      recall: async () => [],
    };
    const spy = makeSpyRepo({ asOf: async () => view });
    const seam = openSeam(spy.repo);
    const r = await run(
      ["asof", "--valid-time", "1700", "get", "e1", "--dir", dir, "--replica", "r1", "--json"],
      { cwd: dir, openRepo: seam.openRepo },
    );
    expect(r.code).toBe(0);
    const asOf = lastCall(spy, "asOf");
    expect(asOf).toBeDefined();
    expect(String((asOf!.args[0] as { validTime?: unknown }).validTime)).toContain("1700");
    expect(viewCalls.map((c) => c.method)).toContain("getNode");
    expect((json(r.stdout) as NodeView).eid).toBe("e1");
  });

  it("`kip asof --valid-time <t>` with NO sub-read selector exits 2 (usage error)", async () => {
    const dir = await initRepoDir("asof-no-subread");
    const spy = makeSpyRepo({ asOf: async () => ({ getNode: async () => null, getEdge: async () => null, query: () => (async function* () {})(), recall: async () => [] }) });
    const seam = openSeam(spy.repo);
    const r = await run(["asof", "--valid-time", "1700", "--dir", dir, "--replica", "r1"], { cwd: dir, openRepo: seam.openRepo });
    expect(r.code).toBe(2);
  });
});

// ===========================================================================
// AC-20 — kip fsck.
// ===========================================================================

describe("AC-20 `kip fsck --json` prints the FsckReport; ok→exit 0, !ok→exit 1 (report still on stdout) (spec §4.8)", () => {
  it("report.ok === true → exit 0 with the full report on stdout", async () => {
    const dir = await initRepoDir("fsck-ok");
    const spy = makeSpyRepo({ fsck: async () => fsckReport(true) });
    const seam = openSeam(spy.repo);
    const r = await run(["fsck", "--dir", dir, "--replica", "r1", "--json"], { cwd: dir, openRepo: seam.openRepo });
    expect(r.code).toBe(0);
    expect(json(r.stdout)).toMatchObject({ ok: true, headsMatch: true, badSignatures: [] });
  });

  it("report.ok === false → exit 1 with the report (incl. non-empty badSignatures/authorityViolations) STILL on stdout", async () => {
    const dir = await initRepoDir("fsck-bad");
    const spy = makeSpyRepo({ fsck: async () => fsckReport(false) });
    const seam = openSeam(spy.repo);
    const r = await run(["fsck", "--dir", dir, "--replica", "r1", "--json"], { cwd: dir, openRepo: seam.openRepo });
    expect(r.code).toBe(1);
    const report = json(r.stdout) as FsckReport;
    expect(report.ok).toBe(false);
    expect(report.badSignatures.length).toBeGreaterThan(0);
    expect(report.authorityViolations.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// AC-21 — kip rollup.
// ===========================================================================

describe("AC-21 `kip rollup --through-hlc <hlc> --json` calls rollup, prints {rollup,throughHlc}; omit → exit 2 (spec §4.9)", () => {
  it("calls rollup with RollupOptions.throughHlc and prints {rollup:<CID>, throughHlc}; exit 0", async () => {
    const dir = await initRepoDir("rollup");
    const spy = makeSpyRepo({ rollup: async () => "cid-rollup-1" });
    const seam = openSeam(spy.repo);
    const r = await run(["rollup", "--through-hlc", "100", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
    });
    expect(r.code).toBe(0);
    expect(methodsCalled(spy)).toContain("rollup");
    const out = json(r.stdout) as Record<string, unknown>;
    expect(out.rollup).toBe("cid-rollup-1");
    expect(out).toHaveProperty("throughHlc");
  });

  it("omitting --through-hlc exits 2 (usage error) without calling rollup", async () => {
    const dir = await initRepoDir("rollup-missing");
    const spy = makeSpyRepo({ rollup: async () => "cid-rollup-1" });
    const seam = openSeam(spy.repo);
    const r = await run(["rollup", "--dir", dir, "--replica", "r1", "--json"], { cwd: dir, openRepo: seam.openRepo });
    expect(r.code).toBe(2);
    expect(methodsCalled(spy)).not.toContain("rollup");
  });
});

// ===========================================================================
// AC-22 / AC-23 — kip sync.
// ===========================================================================

describe("AC-22 `kip sync <remote> --json` prints the SyncReport; conflicts still exit 0 (spec §4.10)", () => {
  it("calls sync and prints {received,sent,merged,conflicts,tip}; a conflict-bearing sync STILL exits 0", async () => {
    const dir = await initRepoDir("sync");
    const spy = makeSpyRepo({ sync: async () => syncReport(true) });
    const seam = openSeam(spy.repo);
    const r = await run(["sync", "origin", "--dir", dir, "--replica", "r1", "--json"], { cwd: dir, openRepo: seam.openRepo });
    expect(r.code).toBe(0);
    const report = json(r.stdout) as SyncReport;
    expect(report).toMatchObject({ received: 2, sent: 1, merged: 1, tip: "digest-tip-1" });
    expect(report.conflicts.length).toBe(1); // surfaced as data, never auto-picked
  });
});

describe("AC-23 sync transport failure → exit 4 (not 1), with the wrapped cause on stderr (spec §4.10, §6)", () => {
  it("when the underlying transport throws (a non-KipError), the CLI exits 4", async () => {
    const dir = await initRepoDir("sync-transport-fail");
    const spy = makeSpyRepo({
      sync: async () => {
        throw new Error("ECONNREFUSED: cannot reach remote");
      },
    });
    const seam = openSeam(spy.repo);
    const r = await run(["sync", "origin", "--dir", dir, "--replica", "r1", "--json"], { cwd: dir, openRepo: seam.openRepo });
    expect(r.code).toBe(4);
    expect(r.stderr.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// AC-24..AC-30, AC-32 — kip ask (the read-only graph-QA microagent).
// ===========================================================================

describe("AC-24 `kip ask \"...\" --json` dispatches the graph-QA microagent and prints {answer,status,citations,model} (spec §4.11, §5)", () => {
  it("dispatches via the injected DispatchMicroagentFn with the question and, on a clean answer, prints status:'answered'; exit 0", async () => {
    const dir = await initRepoDir("ask-answered");
    const spy = makeSpyRepo({ getNode: async (eid: string) => nodeView(eid) });
    const seam = openSeam(spy.repo);
    const { dispatchMicroagent, log } = makeAskDispatch(
      askOk({ answer: "Tal works at a5c.", citations: [{ factId: "F_e", eid: "org/a5c" }], usedFacts: ["F_e"] }),
    );
    const r = await run(["ask", "Where does Tal work?", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
      dispatchMicroagent,
      qaManifest: qaManifest(),
    });
    expect(r.code).toBe(0);
    expect(log.length).toBe(1);
    expect((log[0].input as { question?: string }).question).toBe("Where does Tal work?");

    const out = json(r.stdout) as Record<string, unknown>;
    expect(out.status).toBe("answered");
    expect(String(out.answer)).toContain("a5c");
    expect(Array.isArray(out.citations)).toBe(true);
    expect((out.citations as unknown[]).length).toBeGreaterThan(0);
    expect(out).toHaveProperty("model");
  });
});

describe("AC-25 `ask` authors NOTHING (read-only, INV-A1) (spec §4.11, §5.2; kip-graph-qa.md §5,§8.7)", () => {
  it("after a successful `kip ask`, the resolved Repo saw ZERO write-seam calls (no assertFact/putNode/runAcquisition/...)", async () => {
    const dir = await initRepoDir("ask-readonly");
    const spy = makeSpyRepo({ getNode: async (eid: string) => nodeView(eid) });
    const seam = openSeam(spy.repo);
    const { dispatchMicroagent } = makeAskDispatch(
      askOk({ answer: "Tal works at a5c.", citations: [{ factId: "F_e", eid: "org/a5c" }], usedFacts: ["F_e"] }),
    );
    const r = await run(["ask", "Where does Tal work?", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
      dispatchMicroagent,
      qaManifest: qaManifest(),
    });
    expect(r.code).toBe(0);
    const wrote = methodsCalled(spy).filter((m) => WRITE_METHODS.has(m));
    expect(wrote).toEqual([]);
  });
});

describe("AC-26 `ask` unanswerable is DATA: {answer:null, status:'unanswerable'} → exit 0 (spec §4.11; N5)", () => {
  it("when the QA agent abstains (empty/null answer), prints answer:null + status:'unanswerable'; exit 0", async () => {
    const dir = await initRepoDir("ask-unanswerable");
    const seam = openSeam(makeSpyRepo().repo);
    const { dispatchMicroagent } = makeAskDispatch(
      askOk({ answer: "No supporting facts in the knowledge graph.", abstained: true, citations: [], usedFacts: [] }),
    );
    const r = await run(["ask", "Where does nobody work?", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
      dispatchMicroagent,
      qaManifest: qaManifest(),
    });
    expect(r.code).toBe(0);
    const out = json(r.stdout) as Record<string, unknown>;
    expect(out.status).toBe("unanswerable");
    expect(out.answer).toBeNull();
  });
});

describe("AC-27 `ask` dispatch failure → exit 5, no fabricated answer printed (spec §4.11, §5; N5)", () => {
  it("a non-zero MicroagentResult.exitCode → CLI exit 5, and stdout carries NO `answer` field", async () => {
    const dir = await initRepoDir("ask-dispatch-fail");
    const seam = openSeam(makeSpyRepo().repo);
    const { dispatchMicroagent } = makeAskDispatch({ exitCode: 7, output: null, elapsedMs: 0 });
    const r = await run(["ask", "Where does Tal work?", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
      dispatchMicroagent,
      qaManifest: qaManifest(),
    });
    expect(r.code).toBe(5);
    // Nothing fabricated: no answer on stdout (either empty stdout, or a JSON object without `answer`).
    if (r.stdout.trim().length > 0) {
      expect(json(r.stdout)).not.toHaveProperty("answer");
    }
  });

  it("an output whose duration exceeds the effective --timeout → exit 5 (timeout is a dispatch failure)", async () => {
    const dir = await initRepoDir("ask-timeout");
    const seam = openSeam(makeSpyRepo().repo);
    const { dispatchMicroagent } = makeAskDispatch({
      exitCode: 0,
      output: { answer: "x", abstained: false, citations: [], usedFacts: [] },
      elapsedMs: 999_999,
    });
    const r = await run(["ask", "Where does Tal work?", "--timeout", "10", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
      dispatchMicroagent,
      qaManifest: qaManifest(),
    });
    expect(r.code).toBe(5);
  });
});

describe("AC-28 model override: `--model <id>` clones the manifest so runtime.model===<id>; stdout `model` echoes it (spec §4.11, §5.3)", () => {
  it("with --model, stdout.model === the override; without --model, stdout.model === the manifest default (no silent substitution)", async () => {
    const dir = await initRepoDir("ask-model");
    const seam = openSeam(makeSpyRepo().repo);
    const clean = () => askOk({ answer: "a5c", citations: [{ factId: "F_e", eid: "org/a5c" }], usedFacts: ["F_e"] });

    const override = makeAskDispatch(clean());
    const rOverride = await run(["ask", "q", "--model", "over-9000", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
      dispatchMicroagent: override.dispatchMicroagent,
      qaManifest: qaManifest("qa-default-model"),
    });
    expect(rOverride.code).toBe(0);
    expect((json(rOverride.stdout) as Record<string, unknown>).model).toBe("over-9000");

    const def = makeAskDispatch(clean());
    const rDefault = await run(["ask", "q", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
      dispatchMicroagent: def.dispatchMicroagent,
      qaManifest: qaManifest("qa-default-model"),
    });
    expect(rDefault.code).toBe(0);
    expect((json(rDefault.stdout) as Record<string, unknown>).model).toBe("qa-default-model");
  });
});

describe("AC-29 as-of grounding: `--as-of <t>` threads into QA input.asOf and is echoed in stdout (spec §4.11, §5.4)", () => {
  it("the dispatched invocation input carries asOf at the frontier, and stdout echoes the resolved AsOf", async () => {
    const dir = await initRepoDir("ask-asof");
    const seam = openSeam(makeSpyRepo({ getNode: async (eid: string) => nodeView(eid) }).repo);
    const { dispatchMicroagent, log } = makeAskDispatch(
      askOk({ answer: "a5c", citations: [{ factId: "F_e", eid: "org/a5c" }], usedFacts: ["F_e"] }),
    );
    const r = await run(["ask", "q", "--as-of", "1700000000000", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
      dispatchMicroagent,
      qaManifest: qaManifest(),
    });
    expect(r.code).toBe(0);
    const input = log[0].input as { asOf?: { validTime?: unknown } };
    expect(input.asOf).toBeDefined();
    expect(String(input.asOf?.validTime)).toContain("1700000000000");
    expect((json(r.stdout) as Record<string, unknown>)).toHaveProperty("asOf");
  });
});

describe("AC-30 unknown manifest: `--manifest nope@1.0.0` → ERR_UNREGISTERED_MANIFEST, exit 1, no subprocess spawned (spec §4.11)", () => {
  it("exits 1 without dispatching any microagent when --manifest names an unregistered (name,version)", async () => {
    const dir = await initRepoDir("ask-unknown-manifest");
    const seam = openSeam(makeSpyRepo().repo);
    const { dispatchMicroagent, log } = makeAskDispatch(askOk({ answer: "should never run" }));
    const r = await run(["ask", "q", "--manifest", "nope@1.0.0", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
      dispatchMicroagent,
      qaManifest: qaManifest(), // registered as kip-graph-qa@1.0.0 — 'nope@1.0.0' does not match
    });
    expect(r.code).toBe(1);
    expect(log.length).toBe(0); // rejected before any dispatch
    const errObj = json(r.stderr) as { error?: { code?: string } };
    expect(errObj.error?.code).toBe("ERR_UNREGISTERED_MANIFEST");
  });
});

// ===========================================================================
// AC-31 — human vs JSON parity.
// ===========================================================================

describe("AC-31 human vs JSON parity: --json stdout is exactly one JSON value; non-json render is human text (spec §3)", () => {
  it("`kip get e1 --json` stdout parses as a single JSON value equal to the NodeView (stdout not polluted by logs)", async () => {
    const dir = await initRepoDir("parity-json");
    const spy = makeSpyRepo({ getNode: async (eid: string) => nodeView(eid) });
    const seam = openSeam(spy.repo);
    const r = await run(["get", "e1", "--dir", dir, "--replica", "r1", "--json"], { cwd: dir, openRepo: seam.openRepo });
    expect(r.code).toBe(0);
    expect(() => json(r.stdout)).not.toThrow();
    expect((json(r.stdout) as NodeView).eid).toBe("e1");
  });

  it("`kip get e1` WITHOUT --json writes a human render (not the raw JSON value) to stdout", async () => {
    const dir = await initRepoDir("parity-human");
    const spy = makeSpyRepo({ getNode: async (eid: string) => nodeView(eid) });
    const seam = openSeam(spy.repo);
    const r = await run(["get", "e1", "--dir", dir, "--replica", "r1"], { cwd: dir, openRepo: seam.openRepo });
    expect(r.code).toBe(0);
    // Human render mentions the entity; it is NOT the machine JSON contract.
    expect(r.stdout).toContain("e1");
    let parsedAsJson = true;
    try {
      JSON.parse(r.stdout.trim());
    } catch {
      parsedAsJson = false;
    }
    expect(parsedAsJson).toBe(false);
  });
});

// ===========================================================================
// AC-32 — no auto-pick.
// ===========================================================================

describe("AC-32 no auto-pick: `ask` is the non-authoring QA path — it never triggers a runContextualQuery-style multi-match resolution (spec §4.11, §6)", () => {
  it("a successful `kip ask` calls NEITHER runContextualQuery NOR runAcquisition on the resolved Repo", async () => {
    const dir = await initRepoDir("ask-no-autopick");
    const spy = makeSpyRepo({ getNode: async (eid: string) => nodeView(eid) });
    const seam = openSeam(spy.repo);
    const { dispatchMicroagent } = makeAskDispatch(
      askOk({ answer: "a5c", citations: [{ factId: "F_e", eid: "org/a5c" }], usedFacts: ["F_e"] }),
    );
    const r = await run(["ask", "q", "--dir", dir, "--replica", "r1", "--json"], {
      cwd: dir,
      openRepo: seam.openRepo,
      dispatchMicroagent,
      qaManifest: qaManifest(),
    });
    expect(r.code).toBe(0);
    const called = methodsCalled(spy);
    expect(called).not.toContain("runContextualQuery");
    expect(called).not.toContain("runAcquisition");
  });
});
