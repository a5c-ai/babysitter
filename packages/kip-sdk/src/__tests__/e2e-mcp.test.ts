/**
 * kip MCP server — SHIPPED-BINARY end-to-end suite (work item `e2e-binaries`).
 *
 * SOURCE OF TRUTH: `docs/design/kip-mcp.md` (the ten tools, the stdio JSON-RPC 2.0 lifecycle, read-only
 * gating, and the §9 error mapping). Every `it` maps to a documented tool/behavior.
 *
 * WHY THIS FILE EXISTS. `kip-mcp.test.ts` / `kip-mcp-lifecycle.test.ts` drive the server core
 * PROGRAMMATICALLY (`createKipMcpServer(...).handle()` / `.handleLine()` in-process with a spy `Repo`),
 * so the ACTUAL SHIPPED SERVER — `dist/mcp/server.js`, spawned as a child process reading/writing real
 * newline-delimited JSON-RPC frames over stdin/stdout against a real on-disk repo — has never been
 * exercised end-to-end. This suite BUILDS the package and SPAWNS the real `node dist/mcp/server.js
 * --dir <repo>`, drives the true stdio loop, and asserts the real JSON-RPC envelopes.
 *
 * BUILD-FIRST DISCIPLINE. `beforeAll` builds the package and asserts the shipped server bin + the
 * bundled graph-QA manifest landed in `dist` (the cold-build / zero-JS guard has its full form in
 * `e2e-cli.test.ts`; here we assert the artifacts this file depends on).
 *
 * REAL DATA. Read fixtures are seeded via the SDK `open()`/`assertFact` seam (raw signed facts at the
 * substrate layer). The write `putNode`/`putEdge` seams are IMPLEMENTED, so `kip_assert` round-trips
 * through the shipped server: the write-path test below asserts, then reads the node back. `kip_ask` is
 * driven over the real stdio loop on its non-live channels (abstain + dispatch-failure) — never a paid
 * ask. Everything else drives the shipped server against real facts.
 *
 * HYGIENE. Each server child is spawned with a timeout, driven by writing all request lines then
 * ending stdin (the readline loop drains and the process exits), and SIGKILLed by a watchdog if it
 * hangs — no orphaned processes. Temp repos live under `os.tmpdir()` (`kip-e2e-mcp-` prefix) and are
 * removed in `afterAll`. Adds ZERO runtime deps (node builtins only); never touches
 * `package-lock.json`; does not weaken/skip/delete any existing test.
 */
import { spawn } from "node:child_process";
import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { open } from "../index";
import type { NodeView, Provenance, PropValue } from "../index";

// ---------------------------------------------------------------------------
// Paths + build (see e2e-cli.test.ts for the full build-first rationale / cold-build guard).
// ---------------------------------------------------------------------------

const PACKAGE_ROOT = resolve(__dirname, "..", "..");
const REPO_ROOT = resolve(PACKAGE_ROOT, "..", "..");
const MCP_BIN = join(PACKAGE_ROOT, "dist", "mcp", "server.js");
const KIP_BIN = join(PACKAGE_ROOT, "dist", "cli", "kip.js");
const MANIFEST = join(PACKAGE_ROOT, "dist", "cli", "microagents", "graph-qa", "microagent.json");

function ensureBuilt(force = false): void {
  if (force || !existsSync(MCP_BIN) || !existsSync(KIP_BIN) || !existsSync(MANIFEST)) {
    execSync(`npm run build --workspace=@a5c-ai/kip-sdk`, { cwd: REPO_ROOT, stdio: "pipe", timeout: 300_000 });
  }
}

// ---------------------------------------------------------------------------
// stdio JSON-RPC driver — write all lines, end stdin, collect every response frame. A watchdog
// SIGKILLs a hung child; the child never outlives the call.
// ---------------------------------------------------------------------------

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: { code?: string; kipCode?: string } };
}

interface McpRun {
  frames: JsonRpcResponse[];
  code: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

/** Spawn `node dist/mcp/server.js <serverArgs>`, write each `line` (object → JSON, or raw string) to
 *  stdin, end stdin, and resolve with every newline-delimited response frame. */
function driveMcp(
  serverArgs: string[],
  lines: Array<Record<string, unknown> | string>,
  opts: { env?: NodeJS.ProcessEnv; timeoutMs?: number } = {},
): Promise<McpRun> {
  ensureBuilt();
  return new Promise<McpRun>((resolveResult, reject) => {
    const child = spawn(process.execPath, [MCP_BIN, ...serverArgs], {
      cwd: PACKAGE_ROOT,
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
    const finish = (code: number): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const frames = stdout
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((l) => JSON.parse(l) as JsonRpcResponse);
      resolveResult({ frames, code, stdout, stderr, timedOut });
    };
    child.on("error", (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => finish(code ?? -1));

    for (const line of lines) {
      child.stdin.write(`${typeof line === "string" ? line : JSON.stringify(line)}\n`);
    }
    child.stdin.end();
  });
}

let idSeq = 0;
function rpc(method: string, params?: unknown): Record<string, unknown> {
  idSeq += 1;
  return { jsonrpc: "2.0", id: idSeq, method, ...(params !== undefined ? { params } : {}) };
}
function frameById(run: McpRun, id: number): JsonRpcResponse | undefined {
  return run.frames.find((f) => f.id === id);
}

// ---------------------------------------------------------------------------
// Fixtures — a real on-disk repo seeded via the SDK `assertFact` seam.
// ---------------------------------------------------------------------------

const tmpDirs: string[] = [];
let seedSeq = 0;

function mkTmp(label: string): string {
  const dir = mkdtempSync(join(tmpdir(), `kip-e2e-mcp-${label}-`));
  tmpDirs.push(dir);
  return join(dir, "repo");
}

function fixtureProvenance(): Provenance {
  return { author: "e2e", signature: "sig", publicKeyFingerprint: "fpr", signedFields: [] };
}

async function seededRepo(
  label: string,
  seed: (assert: (target: unknown, value?: PropValue) => Promise<string>) => Promise<void>,
): Promise<string> {
  const dir = mkTmp(label);
  seedSeq += 1;
  const repo = await open({
    dir,
    replicaId: `e2e-mcp-${label}-${seedSeq}-${Date.now()}`,
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

async function emptyRepo(label: string): Promise<string> {
  return seededRepo(label, async () => {
    /* no facts */
  });
}

async function seedEmployment(
  assert: (target: unknown, value?: PropValue) => Promise<string>,
): Promise<void> {
  await assert({ kind: "node", eid: "person/tal", nodeKind: "person" });
  await assert({ kind: "node-prop", eid: "person/tal", prop: "content" }, "Where does Tal work?");
  await assert({ kind: "node", eid: "org/a5c", nodeKind: "org" });
  await assert({ kind: "node-prop", eid: "org/a5c", prop: "content" }, "a5c");
  await assert({ kind: "edge", eid: "edge/tal-a5c", edgeKind: "employed_by", from: "person/tal", to: "org/a5c" });
}

/** The ten advertised tools (spec §4 / criterion 1). */
const TEN_TOOLS = [
  "kip_get_node", "kip_get_edge", "kip_query", "kip_recall", "kip_asof", "kip_fsck",
  "kip_ask", "kip_assert", "kip_retract", "kip_sync",
];
const WRITE_TOOLS = ["kip_assert", "kip_retract", "kip_sync"];

// ---------------------------------------------------------------------------

beforeAll(() => {
  ensureBuilt(true);
  expect(existsSync(MCP_BIN)).toBe(true);
  expect(existsSync(MANIFEST)).toBe(true);
}, 300_000);

afterAll(() => {
  for (const dir of tmpDirs.splice(0)) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* best-effort temp cleanup */
    }
  }
});

// ===========================================================================
// Lifecycle — initialize / tools/list over the real stdio loop (spec §2.1, §4, criterion 1).
// ===========================================================================

describe("lifecycle — the shipped server speaks the stdio JSON-RPC handshake (spec §2.1, §2.2)", () => {
  it("initialize returns the MCP handshake (protocolVersion, serverInfo.name = kip-mcp)", async () => {
    const dir = await emptyRepo("init");
    const run = await driveMcp(["--dir", dir, "--replica-id", "r1"], [rpc("initialize", {})]);
    const res = frameById(run, idSeq)!;
    expect(res.error).toBeUndefined();
    const result = res.result as { protocolVersion?: string; serverInfo?: { name?: string } };
    expect(result.protocolVersion).toBe("2024-11-05");
    expect(result.serverInfo?.name).toBe("kip-mcp");
  });

  it("tools/list advertises EXACTLY the ten tools, each with a non-empty inputSchema (criterion 1)", async () => {
    const dir = await emptyRepo("tools-list");
    const listReq = rpc("tools/list");
    const run = await driveMcp(["--dir", dir, "--replica-id", "r1"], [listReq]);
    const res = frameById(run, listReq.id as number)!;
    const tools = (res.result as { tools: Array<{ name: string; inputSchema: unknown }> }).tools;
    expect(tools.map((t) => t.name).sort()).toEqual([...TEN_TOOLS].sort());
    for (const t of tools) {
      expect(t.inputSchema).toBeTypeOf("object");
      expect(t.inputSchema).not.toBeNull();
    }
  });
});

// ===========================================================================
// Read tools — driven against real seeded facts (spec §5, §8; criteria 2/3/9/12/22).
// ===========================================================================

describe("read tools — kip_get_node / kip_query / kip_fsck against real facts (spec §5, §8)", () => {
  it("kip_get_node on an existing eid returns a text content item whose JSON body is the NodeView (§2.3 envelope)", async () => {
    const dir = await seededRepo("get-node", async (assert) => {
      await assert({ kind: "node", eid: "person/ada", nodeKind: "Person" });
      await assert({ kind: "node-prop", eid: "person/ada", prop: "name" }, "Ada");
    });
    const call = rpc("tools/call", { name: "kip_get_node", arguments: { eid: "person/ada" } });
    const run = await driveMcp(["--dir", dir, "--replica-id", "r1"], [call]);
    const res = frameById(run, call.id as number)!;
    expect(res.error).toBeUndefined();
    const content = (res.result as { content: Array<{ type: string; text: string }> }).content;
    expect(content[0].type).toBe("text");
    const body = JSON.parse(content[0].text) as NodeView;
    expect(body.eid).toBe("person/ada");
    expect(body.props.name.segments[0]).toMatchObject({ kind: "value", value: "Ada" });
  });

  it("kip_get_node on a non-existent eid returns a NORMAL result whose body is null (not an MCP error)", async () => {
    const dir = await emptyRepo("get-node-null");
    const call = rpc("tools/call", { name: "kip_get_node", arguments: { eid: "ghost" } });
    const run = await driveMcp(["--dir", dir, "--replica-id", "r1"], [call]);
    const res = frameById(run, call.id as number)!;
    expect(res.error).toBeUndefined();
    const content = (res.result as { content: Array<{ text: string }> }).content;
    expect(JSON.parse(content[0].text)).toBeNull();
  });

  it("kip_query with a valid spec returns { results } drained from Repo.query; the seed is a member", async () => {
    const dir = await seededRepo("query", seedEmployment);
    const call = rpc("tools/call", {
      name: "kip_query",
      arguments: { seed: "person/tal", direction: "out", depth: 2, maxFanout: 8 },
    });
    const run = await driveMcp(["--dir", dir, "--replica-id", "r1"], [call]);
    const res = frameById(run, call.id as number)!;
    expect(res.error).toBeUndefined();
    const body = JSON.parse((res.result as { content: Array<{ text: string }> }).content[0].text) as {
      results: Array<{ eid: string }>;
    };
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results.some((v) => v.eid === "person/tal")).toBe(true);
  });

  it("kip_query missing maxFanout returns an InvalidParams (-32602) error with data.code ERR_MALFORMED_INPUT", async () => {
    const dir = await emptyRepo("query-missing-bound");
    const call = rpc("tools/call", {
      name: "kip_query",
      arguments: { seed: "e1", direction: "out", depth: 1 },
    });
    const run = await driveMcp(["--dir", dir, "--replica-id", "r1"], [call]);
    const res = frameById(run, call.id as number)!;
    expect(res.error?.code).toBe(-32602);
    expect(res.error?.data?.code).toBe("ERR_MALFORMED_INPUT");
  });

  it("kip_fsck on a healthy repo returns a normal result with ok:true (an fsck verdict is data, never an MCP error)", async () => {
    const dir = await seededRepo("fsck", seedEmployment);
    const call = rpc("tools/call", { name: "kip_fsck", arguments: {} });
    const run = await driveMcp(["--dir", dir, "--replica-id", "r1"], [call]);
    const res = frameById(run, call.id as number)!;
    expect(res.error).toBeUndefined();
    const report = JSON.parse((res.result as { content: Array<{ text: string }> }).content[0].text) as {
      ok: boolean;
    };
    expect(report.ok).toBe(true);
  });
});

// ===========================================================================
// Error mapping + gating (spec §9, §10; criteria 6/7/19/21).
// ===========================================================================

describe("errors + gating — unknown tool, read-only, notifications, malformed JSON, startup (spec §9, §10)", () => {
  it("an unknown tool name returns a MethodNotFound (-32601) error with data.code ERR_UNKNOWN_TOOL", async () => {
    const dir = await emptyRepo("unknown-tool");
    const call = rpc("tools/call", { name: "kip_bogus", arguments: {} });
    const run = await driveMcp(["--dir", dir, "--replica-id", "r1"], [call]);
    const res = frameById(run, call.id as number)!;
    expect(res.error?.code).toBe(-32601);
    expect(res.error?.data?.code).toBe("ERR_UNKNOWN_TOOL");
  });

  it("--read-only tools/list OMITS the three write tools while still listing all read tools + kip_ask (criterion 7)", async () => {
    const dir = await emptyRepo("read-only-list");
    const listReq = rpc("tools/list");
    const run = await driveMcp(["--dir", dir, "--replica-id", "r1", "--read-only"], [listReq]);
    const res = frameById(run, listReq.id as number)!;
    const names = (res.result as { tools: Array<{ name: string }> }).tools.map((t) => t.name);
    for (const w of WRITE_TOOLS) expect(names).not.toContain(w);
    for (const r of ["kip_get_node", "kip_get_edge", "kip_query", "kip_recall", "kip_asof", "kip_fsck", "kip_ask"]) {
      expect(names).toContain(r);
    }
    expect(names).toHaveLength(7);
  });

  it("a write tool invoked against a --read-only server returns an InvalidRequest error with data.code ERR_READ_ONLY (criterion 6)", async () => {
    const dir = await emptyRepo("read-only-write");
    const call = rpc("tools/call", { name: "kip_assert", arguments: { kind: "node", node: { eid: "x", kind: "K" } } });
    const run = await driveMcp(["--dir", dir, "--replica-id", "r1", "--read-only"], [call]);
    const res = frameById(run, call.id as number)!;
    expect(res.error?.code).toBe(-32600);
    expect(res.error?.data?.code).toBe("ERR_READ_ONLY");
  });

  it("a JSON-RPC NOTIFICATION (no id) receives NO response frame (spec §2.1)", async () => {
    const dir = await emptyRepo("notification");
    const listReq = rpc("tools/list");
    // Send a notification (no id) FOLLOWED by a real request; only the request must produce a frame.
    const run = await driveMcp(
      ["--dir", dir, "--replica-id", "r1"],
      [{ jsonrpc: "2.0", method: "notifications/initialized" }, listReq],
    );
    expect(run.frames).toHaveLength(1);
    expect(run.frames[0].id).toBe(listReq.id);
  });

  it("malformed JSON at the stdio layer yields a Parse-error (-32700) frame with id null (spec §2.1)", async () => {
    const dir = await emptyRepo("malformed");
    const run = await driveMcp(["--dir", dir, "--replica-id", "r1"], ["this is not json {"]);
    expect(run.frames).toHaveLength(1);
    expect(run.frames[0].error?.code).toBe(-32700);
    expect(run.frames[0].id).toBeNull();
  });

  it("startup with neither --dir nor KIP_REPO_DIR fails BEFORE advertising tools (non-zero exit, no frames) (criterion 21)", async () => {
    const run = await driveMcp([], [rpc("initialize", {}), rpc("tools/list")], {
      env: { KIP_REPO_DIR: "" },
    });
    expect(run.code).not.toBe(0);
    expect(run.frames).toHaveLength(0);
    expect(run.stderr.toLowerCase()).toContain("repo dir is required");
  });
});

// ===========================================================================
// WRITE PATH — kip_assert then read-back (spec §6.1, criterion 4). The SDK putNode/putEdge seams are
// IMPLEMENTED, so the assert authors real facts and the subsequent kip_get_node reads them back.
// ===========================================================================

describe("write path — kip_assert node then read-back round-trips through the shipped server (spec §6.1)", () => {
  it("kip_assert {kind:'node', node:{eid,kind,props}} returns { eid } and a subsequent kip_get_node returns the NodeView", async () => {
    const dir = await emptyRepo("assert-node");
    const assertCall = rpc("tools/call", {
      name: "kip_assert",
      arguments: { kind: "node", node: { eid: "team/eng", kind: "Team", props: { name: "Eng" } } },
    });
    const getCall = rpc("tools/call", { name: "kip_get_node", arguments: { eid: "team/eng" } });
    const run = await driveMcp(["--dir", dir, "--replica-id", "r1"], [assertCall, getCall]);

    const assertRes = frameById(run, assertCall.id as number)!;
    expect(assertRes.error).toBeUndefined();
    const assertBody = JSON.parse(
      (assertRes.result as { content: Array<{ text: string }> }).content[0].text,
    ) as { eid: string };
    expect(assertBody.eid).toBe("team/eng");

    const getRes = frameById(run, getCall.id as number)!;
    const readBack = JSON.parse((getRes.result as { content: Array<{ text: string }> }).content[0].text) as NodeView;
    expect(readBack.eid).toBe("team/eng");
    expect(readBack.kind).toBe("Team");
  });
});

// ===========================================================================
// kip_ask over the REAL stdio loop — the NON-LIVE channels only (spec §5, §7.4, §9.1; ADR-B8). NEVER
// spends money: the abstain case short-circuits before any model spawn, and the dispatch-failure case
// forces the availability probe to fail by pointing KIP_CLAUDE_BIN at a nonexistent path (no `claude`
// process is ever launched). The one paid live ask belongs to graph-qa-live.test.ts's single gated test.
// ===========================================================================

describe("ask over stdio — non-live abstain + dispatch-failure through the shipped server (spec §7.4, §9.1)", () => {
  it("kip_ask on an EMPTY graph returns a NORMAL result frame that abstains (abstained:true, no citations, no model spawn)", async () => {
    const dir = await emptyRepo("ask-abstain");
    const call = rpc("tools/call", { name: "kip_ask", arguments: { question: "Where does Tal work?" } });
    const run = await driveMcp(["--dir", dir, "--replica-id", "r1"], [call], {
      // Belt-and-braces: an empty retrieval abstains before synthesis, but pin the model binary to a
      // nonexistent path so this test can NEVER spend money on any machine.
      env: { KIP_CLAUDE_BIN: join(tmpdir(), "definitely-no-claude-here-mcp-e2e"), KIP_ASK_LIVE: "" },
    });
    const res = frameById(run, call.id as number)!;
    expect(res.error).toBeUndefined();
    const body = JSON.parse((res.result as { content: Array<{ text: string }> }).content[0].text) as {
      abstained?: boolean;
      citations?: unknown[];
    };
    expect(body.abstained).toBe(true);
    expect(body.citations).toEqual([]);
  });

  it("kip_ask WITH facts but NO model available fails via ERR_ASK_DISPATCH_FAILED (InternalError -32603) — never fabricates", async () => {
    const dir = await seededRepo("ask-dispatch-fail", seedEmployment);
    const call = rpc("tools/call", { name: "kip_ask", arguments: { question: "Where does Tal work?" } });
    const run = await driveMcp(["--dir", dir, "--replica-id", "r1"], [call], {
      // Force the ADR-B8 availability probe to fail WITHOUT launching any process (nonexistent path):
      // retrieval finds facts, synthesis has no model → dispatch failure → ERR_ASK_DISPATCH_FAILED.
      env: { KIP_CLAUDE_BIN: join(tmpdir(), "definitely-no-claude-here-mcp-e2e"), KIP_ASK_LIVE: "" },
    });
    const res = frameById(run, call.id as number)!;
    expect(res.error?.code).toBe(-32603);
    expect(res.error?.data?.code).toBe("ERR_ASK_DISPATCH_FAILED");
    // Nothing fabricated: the failure is an error frame, so there is no result envelope carrying an answer.
    expect(res.result).toBeUndefined();
  });
});
