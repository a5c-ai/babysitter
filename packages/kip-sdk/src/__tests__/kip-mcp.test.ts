/**
 * kip MCP server — FROZEN acceptance suite (spec-driven, pre-implementation).
 *
 * SOURCE OF TRUTH: `docs/design/kip-mcp.md` §11 "Acceptance criteria" (criteria 1..22), grounded in
 * §2 (stdio JSON-RPC + the §2.3 result envelope), §3 (repo-dir resolution), §4 (the read/write gate
 * table), §5-§7 (per-tool contracts), §9 (the MCP error mapping), and §10 (`--read-only` capability
 * gating); plus `docs/design/kip-graph-qa.md` (the read-only graph-QA microagent `kip_ask` dispatches:
 * INV-A1 "authors nothing", N5 abstention). Every `it` maps to one numbered criterion; each `describe`
 * cites the criterion id.
 *
 * TEST SURFACE (primary, per the run owner). The server core is exercised PROGRAMMATICALLY via
 * `createKipMcpServer({ openRepo, dispatch, readOnly, ... })` → `server.handle(request)` — the
 * hand-rolled JSON-RPC 2.0 request/response boundary — with NO subprocess and NO stdio. To stay
 * deterministic and DECOUPLED from which `Repo` methods are still throwing stubs, the tool-dispatch
 * criteria inject a SPY `Repo` through the `openRepo` seam (asserting which SDK method a `tools/call`
 * drives, with what args) and a scripted `DispatchMicroagentFn` for `kip_ask` (the M6
 * `makeScriptedDispatch` idiom) so no real genty subprocess runs and `kip_ask`'s ZERO-write guarantee
 * is assertable by counting write-seam calls.
 *
 * EXPECTED-FAIL CONVENTION (identical to `kip-cli.test.ts`): `createKipMcpServer` is a throwing
 * `unimplemented` stub (`src/mcp/index.ts`) this round, so every behavioral test FAILS on its leading
 * `await createKipMcpServer(...)` (a rejected promise) — never on a type/syntax/import error (the file
 * type-checks and every imported value symbol exists on the real `src/mcp` surface). They become GREEN
 * once `src/mcp/` lands with the documented handler semantics.
 *
 * Non-goals: this file does NOT implement the server, adds NO runtime dependency, NEVER touches
 * `package-lock.json`, and does not weaken/skip any existing test.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { KipError } from "../index";
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
import { createKipMcpServer } from "../mcp";
import type {
  CreateKipMcpServerOptions,
  JsonRpcRequest,
  JsonRpcResponse,
  KipMcpServer,
  McpToolDescriptor,
} from "../mcp";

// ---------------------------------------------------------------------------
// The ten advertised tools (spec §4/§11 criterion 1) — hardcoded here so the suite is the AUTHORITY on
// the surface, independent of the module's own exported list.
// ---------------------------------------------------------------------------

const READ_TOOLS = ["kip_get_node", "kip_get_edge", "kip_query", "kip_recall", "kip_asof", "kip_fsck"];
const WRITE_TOOLS = ["kip_assert", "kip_retract", "kip_sync"];
const ASK_TOOL = "kip_ask";
const ALL_TOOLS = [...READ_TOOLS, ASK_TOOL, ...WRITE_TOOLS];

/** The `Repo` write/mutation methods `kip_ask` (and a `--read-only` gate) must NEVER reach (spec §4,
 *  §7.2; kip-graph-qa.md §8.7). */
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
  "sync",
]);

// ---------------------------------------------------------------------------
// Spy `Repo` — records every method call + returns scripted values (the kip-cli.test.ts idiom).
// ---------------------------------------------------------------------------

interface RecordedCall {
  method: string;
  args: unknown[];
}

interface SpyRepo {
  repo: Repo;
  calls: RecordedCall[];
}

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

function methodsCalled(spy: SpyRepo): string[] {
  return spy.calls.map((c) => c.method);
}

function lastCall(spy: SpyRepo, method: string): RecordedCall | undefined {
  return [...spy.calls].reverse().find((c) => c.method === method);
}

/** The operational "fact-set frontier" proxy (spec §6/§10, criterion 6/16): the ordered list of
 *  write-seam calls the spy has seen. Byte-identical before/after a read (incl. `kip_ask`); changed by
 *  a real write. This is the deterministic stand-in for the `/heads` digest the run owner names. */
function frontierDigest(spy: SpyRepo): string {
  return JSON.stringify(methodsCalled(spy).filter((m) => WRITE_METHODS.has(m)));
}

// ---------------------------------------------------------------------------
// Scripted `kip_ask` dispatch — the M6 idiom (`makeScriptedDispatch`).
// ---------------------------------------------------------------------------

function makeAskDispatch(
  result: MicroagentResult | ((inv: MicroagentInvocation) => MicroagentResult),
): { dispatch: DispatchMicroagentFn; log: MicroagentInvocation[] } {
  const log: MicroagentInvocation[] = [];
  const dispatch: DispatchMicroagentFn = async (inv) => {
    log.push(inv);
    return typeof result === "function" ? result(inv) : result;
  };
  return { dispatch, log };
}

/** A successful graph-QA `MicroagentResult` (output shape per kip-mcp.md §7.3 `outputSchema`:
 *  required `answer`/`citations`, optional `nodes`). */
function askOk(fields: {
  answer: string;
  citations?: string[];
  nodes?: string[];
  elapsedMs?: number;
}): MicroagentResult {
  return {
    exitCode: 0,
    output: {
      answer: fields.answer,
      citations: fields.citations ?? [],
      ...(fields.nodes ? { nodes: fields.nodes } : {}),
    },
    elapsedMs: fields.elapsedMs ?? 0,
  };
}

/** The bundled graph-QA manifest (spec §7.1 / kip-graph-qa.md §2), pinned so a test can assert the
 *  dispatched `(name, version)` and effective timeout without a real genty registry. */
function qaManifest(model = "qa-default-model"): MicroagentManifest {
  return {
    name: "kip-graph-qa",
    version: "1.0.0",
    description: "Answers a natural-language question over the kip knowledge graph (READ-ONLY).",
    inputSchema: { type: "object", required: ["question"], properties: { question: { type: "string" } } },
    outputSchema: { type: "object", required: ["answer", "citations"] },
    isolation: "subprocess",
    runtime: { entrypoint: "kip-graph-qa.mjs", model, timeout: 30_000, tools: ["kip-read"] },
    tags: ["kip", "qa", "read-only"],
    builtIn: false,
  };
}

// ---------------------------------------------------------------------------
// Scripted read-view shapes.
// ---------------------------------------------------------------------------

function provenance(seed = "mcp"): NodeView["provenance"] {
  return {
    author: `author-${seed}`,
    signature: `sig-${seed}`,
    publicKeyFingerprint: `fpr-${seed}`,
    signedFields: [],
  };
}

function nodeView(eid = "e1", kind = "Person"): NodeView {
  return {
    eid,
    kind,
    props: {
      name: { segments: [{ kind: "value", value: "Ada", validFrom: 0, validTo: null, assertedBy: "F_name" }] },
    },
    provenance: provenance(eid),
  };
}

function edgeView(eid = "knows/e1/e2"): EdgeView {
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
// Server harness — build a server over a spy repo + scripted dispatch, and drive `handle()`.
// ---------------------------------------------------------------------------

interface BuiltServer {
  server: KipMcpServer;
  spy: SpyRepo;
  openOptions: OpenOptions[];
  openCalls: number;
  askLog: MicroagentInvocation[];
}

const DEFAULT_DIR = "/tmp/kip-mcp-fixture-repo";

/** Build a server. `dir` defaults to a non-empty fixture path (openRepo is mocked, so no real repo is
 *  needed on disk); pass `dir: null` to exercise the "no repo dir resolvable" startup path (criterion
 *  21). Returns rejected-promise-transparent handles so a test can `await build(...)`. */
async function build(
  opts: {
    scripted?: Record<string, (...a: any[]) => any>;
    readOnly?: boolean;
    dispatch?: DispatchMicroagentFn;
    askLog?: MicroagentInvocation[];
    qa?: MicroagentManifest;
    dir?: string | null;
    env?: Record<string, string | undefined>;
  } = {},
): Promise<BuiltServer> {
  const spy = makeSpyRepo(opts.scripted);
  const openOptions: OpenOptions[] = [];
  let openCalls = 0;
  const openRepo = async (o: OpenOptions): Promise<Repo> => {
    openCalls += 1;
    openOptions.push(o);
    return spy.repo;
  };
  const dispatch =
    opts.dispatch ?? makeAskDispatch(askOk({ answer: "unused", citations: [] })).dispatch;

  const createOptions: CreateKipMcpServerOptions = {
    openRepo,
    dispatch,
    readOnly: opts.readOnly,
    env: opts.env ?? {},
    replicaId: "kip-mcp-fixture-replica",
    keyring: {},
    qaManifest: opts.qa ?? qaManifest(),
  };
  if (opts.dir !== null) createOptions.dir = opts.dir ?? DEFAULT_DIR;

  const server = await createKipMcpServer(createOptions);
  return { server, spy, openOptions, openCalls, askLog: opts.askLog ?? [] };
}

let rpcSeq = 0;

function req(method: string, params?: unknown): JsonRpcRequest {
  rpcSeq += 1;
  return { jsonrpc: "2.0", id: rpcSeq, method, params };
}

/** Drive `tools/call` for a named tool with the given arguments. */
function callTool(server: KipMcpServer, name: string, args: unknown): Promise<JsonRpcResponse> {
  return server.handle(req("tools/call", { name, arguments: args }));
}

/** Drive `tools/list`. */
async function listTools(server: KipMcpServer): Promise<McpToolDescriptor[]> {
  const res = await server.handle(req("tools/list"));
  const result = res.result as { tools?: McpToolDescriptor[] } | undefined;
  return result?.tools ?? [];
}

/** Parse the §2.3 envelope: the single `text` content item's JSON body. */
function toolBody(res: JsonRpcResponse): unknown {
  const result = res.result as { content?: Array<{ type: string; text: string }> } | undefined;
  if (!result?.content) throw new Error(`no tool content on response: ${JSON.stringify(res)}`);
  return JSON.parse(result.content[0].text);
}

/** Recursively list every source file under a dir (criterion 20 static import-graph scan). */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

// ===========================================================================
// Criterion 1 — tools/list advertises exactly the ten tools, each with a non-empty inputSchema.
// ===========================================================================

describe("criterion 1 — tools/list advertises exactly the ten tools, each with a non-empty inputSchema (spec §4, §11.1)", () => {
  it("lists all ten tool names (no more, no fewer) and every descriptor carries a non-empty object inputSchema", async () => {
    const { server } = await build();
    const tools = await listTools(server);
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([...ALL_TOOLS].sort());

    for (const tool of tools) {
      expect(tool.inputSchema, `${tool.name} inputSchema`).toBeTypeOf("object");
      expect(tool.inputSchema).not.toBeNull();
      expect(Object.keys(tool.inputSchema as object).length, `${tool.name} inputSchema keys`).toBeGreaterThan(0);
    }
  });

  it("server.listTools() returns the same surface as the tools/list JSON-RPC method", async () => {
    const { server } = await build();
    const direct = server.listTools().map((t) => t.name).sort();
    const overRpc = (await listTools(server)).map((t) => t.name).sort();
    expect(direct).toEqual(overRpc);
    expect(direct).toEqual([...ALL_TOOLS].sort());
  });
});

// ===========================================================================
// Criterion 2 / 3 — kip_get_node existing → NodeView, non-existent → null (not error).
// ===========================================================================

describe("criterion 2 — kip_get_node on an existing eid returns a content result whose JSON body is the NodeView (spec §5.1, §11.2)", () => {
  it("calls Repo.getNode(eid) and returns { eid, kind, props, provenance } as the JSON body", async () => {
    const { server, spy } = await build({ scripted: { getNode: async (eid: string) => nodeView(eid) } });
    const res = await callTool(server, "kip_get_node", { eid: "e1" });
    expect(res.error).toBeUndefined();
    expect((lastCall(spy, "getNode")!.args[0] as string)).toBe("e1");
    const body = toolBody(res) as NodeView;
    expect(body.eid).toBe("e1");
    expect(body.kind).toBe("Person");
    expect(body.props.name.segments[0]).toMatchObject({ kind: "value", value: "Ada" });
    expect(body).toHaveProperty("provenance");
  });
});

describe("criterion 3 — kip_get_node on a non-existent eid returns a NORMAL result whose JSON body is null, not an MCP error (spec §2.3, §11.3)", () => {
  it("returns null as data (no response.error) when Repo.getNode resolves null", async () => {
    const { server } = await build({ scripted: { getNode: async () => null } });
    const res = await callTool(server, "kip_get_node", { eid: "ghost" });
    expect(res.error).toBeUndefined();
    expect(toolBody(res)).toBeNull();
  });
});

// ===========================================================================
// Criterion 4 / 5 — kip_assert node/edge → { eid } + read-back.
// ===========================================================================

describe("criterion 4 — kip_assert node returns { eid } and a subsequent kip_get_node returns the asserted NodeView (spec §6.1, §11.4)", () => {
  it("routes node → Repo.putNode(NodePut), returns { eid }, and the write reached the substrate (read-back)", async () => {
    const { server, spy } = await build({
      scripted: { putNode: async () => "e1", getNode: async (eid: string) => nodeView(eid) },
    });
    const assertRes = await callTool(server, "kip_assert", {
      kind: "node",
      node: { eid: "e1", kind: "Person", props: { name: "Ada" } },
    });
    expect(assertRes.error).toBeUndefined();
    const put = lastCall(spy, "putNode");
    expect(put).toBeDefined();
    const nodePut = put!.args[0] as { eid: string; kind: string };
    expect(nodePut.eid).toBe("e1");
    expect(nodePut.kind).toBe("Person");
    expect(toolBody(assertRes)).toMatchObject({ eid: "e1" });

    const getRes = await callTool(server, "kip_get_node", { eid: "e1" });
    expect((toolBody(getRes) as NodeView).eid).toBe("e1");
  });
});

describe("criterion 5 — kip_assert edge returns { eid } and kip_get_edge returns the EdgeView (spec §6.1, §11.5)", () => {
  it("routes edge → Repo.putEdge(EdgePut), returns { eid }, and kip_get_edge reflects from/to/kind", async () => {
    const { server, spy } = await build({
      scripted: { putEdge: async () => "knows/e1/e2", getEdge: async (eid: string) => edgeView(eid) },
    });
    const assertRes = await callTool(server, "kip_assert", {
      kind: "edge",
      edge: { kind: "knows", from: "e1", to: "e2", validFrom: 0 },
    });
    expect(assertRes.error).toBeUndefined();
    const put = lastCall(spy, "putEdge");
    expect(put).toBeDefined();
    const edgePut = put!.args[0] as { kind: string; from: string; to: string };
    expect(edgePut).toMatchObject({ kind: "knows", from: "e1", to: "e2" });
    expect(toolBody(assertRes)).toMatchObject({ eid: "knows/e1/e2" });

    const getRes = await callTool(server, "kip_get_edge", { eid: "knows/e1/e2" });
    expect(toolBody(getRes)).toMatchObject({ eid: "knows/e1/e2", kind: "knows", from: "e1", to: "e2" });
  });
});

// ===========================================================================
// Criterion 6 — write tool under --read-only → ERR_READ_ONLY + frontier unchanged.
// ===========================================================================

describe("criterion 6 — a write tool under --read-only returns an MCP error data.code === 'ERR_READ_ONLY' and the frontier is unchanged (spec §10, §11.6)", () => {
  it("kip_assert on a --read-only server errors with ERR_READ_ONLY, never calls putNode, and the would-be eid still reads null", async () => {
    const { server, spy } = await build({
      readOnly: true,
      scripted: { putNode: async () => "e1", getNode: async () => null },
    });
    const before = frontierDigest(spy);
    const res = await callTool(server, "kip_assert", {
      kind: "node",
      node: { eid: "e1", kind: "Person", props: {} },
    });
    expect(res.error).toBeDefined();
    expect(res.error!.code).toBe(-32600); // InvalidRequest
    expect(res.error!.data?.code).toBe("ERR_READ_ONLY");
    // The gate fires BEFORE the Repo is touched (spec §10) — no write seam invoked.
    expect(methodsCalled(spy)).not.toContain("putNode");
    expect(frontierDigest(spy)).toBe(before); // frontier byte-identical

    const getRes = await callTool(server, "kip_get_node", { eid: "e1" });
    expect(toolBody(getRes)).toBeNull(); // no fact was authored
  });
});

// ===========================================================================
// Criterion 7 — --read-only tools/list omits the write tools.
// ===========================================================================

describe("criterion 7 — in --read-only mode tools/list omits kip_assert/kip_retract/kip_sync but keeps all reads + kip_ask (spec §10, §11.7)", () => {
  it("advertises exactly the six read tools + kip_ask, and none of the three write tools", async () => {
    const { server } = await build({ readOnly: true });
    const names = (await listTools(server)).map((t) => t.name);
    for (const w of WRITE_TOOLS) expect(names, `write tool ${w} must be omitted`).not.toContain(w);
    for (const r of READ_TOOLS) expect(names, `read tool ${r} must remain`).toContain(r);
    expect(names).toContain(ASK_TOOL);
    expect(names.sort()).toEqual([...READ_TOOLS, ASK_TOOL].sort());
  });
});

// ===========================================================================
// Criterion 8 — kip_query missing depth/maxFanout → InvalidParams + never calls Repo.query.
// ===========================================================================

describe("criterion 8 — kip_query missing depth or maxFanout returns InvalidParams / ERR_MALFORMED_INPUT and never calls Repo.query (spec §5.3, §9.1, §11.8)", () => {
  it("missing depth → error -32602 / ERR_MALFORMED_INPUT, Repo.query uncalled", async () => {
    const { server, spy } = await build({ scripted: { query: () => (async function* () {})() } });
    const res = await callTool(server, "kip_query", { seed: "e1", direction: "out", maxFanout: 8 });
    expect(res.error).toBeDefined();
    expect(res.error!.code).toBe(-32602);
    expect(res.error!.data?.code).toBe("ERR_MALFORMED_INPUT");
    expect(methodsCalled(spy)).not.toContain("query");
  });

  it("missing maxFanout → error -32602 / ERR_MALFORMED_INPUT, Repo.query uncalled", async () => {
    const { server, spy } = await build({ scripted: { query: () => (async function* () {})() } });
    const res = await callTool(server, "kip_query", { seed: "e1", direction: "out", depth: 2 });
    expect(res.error).toBeDefined();
    expect(res.error!.code).toBe(-32602);
    expect(res.error!.data?.code).toBe("ERR_MALFORMED_INPUT");
    expect(methodsCalled(spy)).not.toContain("query");
  });
});

// ===========================================================================
// Criterion 9 — kip_query drains the async-iterable into { results: [] } in order.
// ===========================================================================

describe("criterion 9 — kip_query with a valid TraversalSpec returns { results } equal to the fully drained Repo.query iterable (spec §5.3, §11.9)", () => {
  it("passes depth/maxFanout/direction through and drains the iterable in traversal order", async () => {
    const a = nodeView("n-a");
    const b = nodeView("n-b");
    const { server, spy } = await build({
      scripted: {
        query: () =>
          (async function* () {
            yield a;
            yield b;
          })(),
      },
    });
    const res = await callTool(server, "kip_query", {
      seed: "e1",
      direction: "out",
      depth: 2,
      maxFanout: 8,
    });
    expect(res.error).toBeUndefined();
    const spec = lastCall(spy, "query")!.args[0] as { depth?: number; maxFanout?: number; direction?: string };
    expect(spec).toMatchObject({ depth: 2, maxFanout: 8, direction: "out" });
    const body = toolBody(res) as { results: NodeView[] };
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results.map((v) => v.eid)).toEqual(["n-a", "n-b"]); // count + order preserved
  });
});

// ===========================================================================
// Criterion 10 — kip_recall preserves conflicted + provenance verbatim.
// ===========================================================================

describe("criterion 10 — kip_recall returns { results } and each row preserves conflicted + provenance verbatim (spec §5.4, §11.10)", () => {
  it("a conflicted recall row surfaces conflicted:true (never resolved) and keeps its provenance", async () => {
    const { server } = await build({ scripted: { recall: async () => [recallResult("e1", true)] } });
    const res = await callTool(server, "kip_recall", { query: "who knows Ada", k: 5 });
    expect(res.error).toBeUndefined();
    const body = toolBody(res) as { results: RecallResult[] };
    expect(body.results).toHaveLength(1);
    expect(body.results[0].conflicted).toBe(true);
    expect(body.results[0]).toHaveProperty("provenance");
    expect(body.results[0].provenance).toMatchObject({ author: "author-e1" });
  });
});

// ===========================================================================
// Criterion 11 — kip_asof reads through a fixed AsOf ReadView (before assertion → null).
// ===========================================================================

describe("criterion 11 — kip_asof { asOf, read:{op:'getNode', eid} } reads against the AsOf ReadView; a validTime before assertion returns null (spec §5.5, §11.11)", () => {
  it("routes through Repo.asOf(asOf).getNode(eid): after-assertion validTime → NodeView, before-assertion validTime → null", async () => {
    const T_ASSERT = 1000;
    // The as-of ReadView projects the node only for validTime >= its assertion time.
    const spy = makeSpyRepo({
      asOf: async (asOf: { validTime?: number }) => {
        const vt = Number(asOf?.validTime ?? 0);
        const view: ReadView = {
          getNode: async (eid) => (vt >= T_ASSERT ? nodeView(eid) : null),
          getEdge: async () => null,
          query: () => (async function* () {})(),
          recall: async () => [],
        };
        return view;
      },
    });
    const openOptions: OpenOptions[] = [];
    const server = await createKipMcpServer({
      openRepo: async (o) => {
        openOptions.push(o);
        return spy.repo;
      },
      dispatch: makeAskDispatch(askOk({ answer: "x" })).dispatch,
      env: {},
      dir: DEFAULT_DIR,
      replicaId: "r1",
      keyring: {},
      qaManifest: qaManifest(),
    });

    const after = await callTool(server, "kip_asof", {
      asOf: { validTime: 2000 },
      read: { op: "getNode", eid: "e1" },
    });
    expect(after.error).toBeUndefined();
    expect((toolBody(after) as NodeView).eid).toBe("e1");
    expect(methodsCalled(spy)).toContain("asOf");

    const before = await callTool(server, "kip_asof", {
      asOf: { validTime: 500 },
      read: { op: "getNode", eid: "e1" },
    });
    expect(before.error).toBeUndefined();
    expect(toolBody(before)).toBeNull(); // not yet valid at that AsOf
  });
});

// ===========================================================================
// Criterion 12 — kip_fsck: healthy → ok:true; bad-signature → ok:false (both NORMAL results).
// ===========================================================================

describe("criterion 12 — kip_fsck returns the FsckReport as DATA: ok:true when healthy, ok:false + non-empty badSignatures when not (never an MCP error) (spec §5.6, §11.12)", () => {
  it("healthy repo → normal result with ok:true", async () => {
    const { server } = await build({ scripted: { fsck: async () => fsckReport(true) } });
    const res = await callTool(server, "kip_fsck", {});
    expect(res.error).toBeUndefined();
    expect(toolBody(res)).toMatchObject({ ok: true, headsMatch: true, badSignatures: [] });
  });

  it("injected bad-signature fact → normal result with ok:false and non-empty badSignatures (NOT an MCP error)", async () => {
    const { server } = await build({ scripted: { fsck: async () => fsckReport(false) } });
    const res = await callTool(server, "kip_fsck", {});
    expect(res.error).toBeUndefined();
    const report = toolBody(res) as FsckReport;
    expect(report.ok).toBe(false);
    expect(report.badSignatures.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// Criterion 13 — kip_retract tombstone → { factId } + read-back reflects the tombstone.
// ===========================================================================

describe("criterion 13 — kip_retract {mode:'tombstone', eid, reason} returns { factId } and a subsequent kip_get_node reflects the tombstone (spec §6.2, §11.13)", () => {
  it("routes to Repo.tombstone(eid, reason), returns { factId }, and the tombstoned node then reads null", async () => {
    const { server, spy } = await build({
      scripted: { tombstone: async () => "F_tomb", getNode: async () => null },
    });
    const res = await callTool(server, "kip_retract", { mode: "tombstone", eid: "e1", reason: "gdpr" });
    expect(res.error).toBeUndefined();
    const tomb = lastCall(spy, "tombstone");
    expect(tomb).toBeDefined();
    expect(tomb!.args[0]).toBe("e1");
    expect(tomb!.args[1]).toBe("gdpr");
    expect(toolBody(res)).toMatchObject({ factId: "F_tomb" });

    const getRes = await callTool(server, "kip_get_node", { eid: "e1" });
    expect(toolBody(getRes)).toBeNull();
  });
});

// ===========================================================================
// Criterion 14 — kip_sync returns a SyncReport whose conflicts array is present, never auto-resolved.
// ===========================================================================

describe("criterion 14 — kip_sync returns a SyncReport whose conflicts array is present and not auto-resolved (spec §6.3, §11.14)", () => {
  it("a divergent remote surfaces entries in conflicts (never auto-picked)", async () => {
    const { server, spy } = await build({ scripted: { sync: async () => syncReport(true) } });
    const res = await callTool(server, "kip_sync", { remote: "origin" });
    expect(res.error).toBeUndefined();
    expect(lastCall(spy, "sync")!.args[0]).toBe("origin");
    const report = toolBody(res) as SyncReport;
    expect(report).toMatchObject({ received: 2, sent: 1, merged: 1, tip: "digest-tip-1" });
    expect(Array.isArray(report.conflicts)).toBe(true);
    expect(report.conflicts.length).toBe(1);
  });
});

// ===========================================================================
// Criterion 15 — kip_ask returns a content result validating against { answer, citations }.
// ===========================================================================

describe("criterion 15 — kip_ask returns a content result whose JSON body validates against the graph-QA output schema { answer, citations } (spec §7.3, §11.15)", () => {
  it("dispatches the kip-graph-qa manifest with the question and returns { answer, citations } (citations an array of graph ids)", async () => {
    const { dispatch, log } = makeAskDispatch(
      askOk({ answer: "Tal works at a5c.", citations: ["F_e"], nodes: ["org/a5c"] }),
    );
    const { server } = await build({ dispatch });
    const res = await callTool(server, "kip_ask", { question: "Where does Tal work?" });
    expect(res.error).toBeUndefined();
    expect(log).toHaveLength(1);
    expect(log[0].manifest).toMatchObject({ name: "kip-graph-qa", version: "1.0.0" });
    expect((log[0].input as { question?: string }).question).toBe("Where does Tal work?");

    const body = toolBody(res) as { answer: string; citations: string[] };
    expect(typeof body.answer).toBe("string");
    expect(body.answer).toContain("a5c");
    expect(Array.isArray(body.citations)).toBe(true);
    expect(body.citations).toContain("F_e");
  });
});

// ===========================================================================
// Criterion 16 — kip_ask authors NO facts (INV-A1): frontier digest byte-identical before/after.
// ===========================================================================

describe("criterion 16 — kip_ask authors no facts; the frontier digest is byte-identical before and after (read-only, N-mcp-2) (spec §7.2, §11.16)", () => {
  it("after a successful kip_ask the spy Repo saw ZERO write-seam calls and the frontier digest is unchanged", async () => {
    const { dispatch } = makeAskDispatch(askOk({ answer: "Tal works at a5c.", citations: ["F_e"] }));
    const { server, spy } = await build({ dispatch, scripted: { getNode: async (e: string) => nodeView(e) } });
    const before = frontierDigest(spy);
    const res = await callTool(server, "kip_ask", { question: "Where does Tal work?" });
    expect(res.error).toBeUndefined();
    const wrote = methodsCalled(spy).filter((m) => WRITE_METHODS.has(m));
    expect(wrote).toEqual([]);
    expect(frontierDigest(spy)).toBe(before); // frontier byte-identical
  });
});

// ===========================================================================
// Criterion 17 — kip_ask with no evidence → explicit abstention sentinel + citations:[].
// ===========================================================================

describe("criterion 17 — kip_ask with no supporting evidence returns a NORMAL result whose answer is the explicit insufficient-evidence sentinel and citations is [] (spec §7.4, §11.17; N5)", () => {
  it("an abstaining dispatch surfaces as data (no MCP error): answer is the sentinel, citations empty", async () => {
    const SENTINEL = "<insufficient graph evidence>";
    const { dispatch } = makeAskDispatch(askOk({ answer: SENTINEL, citations: [] }));
    const { server } = await build({ dispatch });
    const res = await callTool(server, "kip_ask", { question: "Where does nobody work?" });
    expect(res.error).toBeUndefined(); // abstention is DATA, not an error
    const body = toolBody(res) as { answer: string; citations: string[] };
    expect(body.answer).toBe(SENTINEL);
    expect(body.citations).toEqual([]);
  });
});

// ===========================================================================
// Criterion 18 — kip_ask dispatch failure → ERR_ASK_DISPATCH_FAILED, authors nothing.
// ===========================================================================

describe("criterion 18 — kip_ask whose dispatched microagent fails returns an MCP error data.code === 'ERR_ASK_DISPATCH_FAILED' and authors nothing (spec §7.4, §9.1, §11.18)", () => {
  it("non-zero exitCode → InternalError / ERR_ASK_DISPATCH_FAILED, zero write-seam calls", async () => {
    const { dispatch } = makeAskDispatch({ exitCode: 7, output: null, elapsedMs: 0 });
    const { server, spy } = await build({ dispatch });
    const res = await callTool(server, "kip_ask", { question: "Where does Tal work?" });
    expect(res.error).toBeDefined();
    expect(res.error!.code).toBe(-32603); // InternalError
    expect(res.error!.data?.code).toBe("ERR_ASK_DISPATCH_FAILED");
    expect(methodsCalled(spy).filter((m) => WRITE_METHODS.has(m))).toEqual([]);
  });

  it("schema-invalid output (missing required answer/citations) → ERR_ASK_DISPATCH_FAILED", async () => {
    const { dispatch } = makeAskDispatch({ exitCode: 0, output: { bogus: true }, elapsedMs: 0 });
    const { server } = await build({ dispatch });
    const res = await callTool(server, "kip_ask", { question: "q" });
    expect(res.error).toBeDefined();
    expect(res.error!.data?.code).toBe("ERR_ASK_DISPATCH_FAILED");
  });

  it("elapsed beyond the effective timeout → ERR_ASK_DISPATCH_FAILED (a timeout is a dispatch failure)", async () => {
    const { dispatch } = makeAskDispatch(
      askOk({ answer: "late", citations: ["F_e"], elapsedMs: 999_999 }),
    );
    const { server } = await build({ dispatch, qa: qaManifest("m") });
    const res = await callTool(server, "kip_ask", { question: "q" });
    expect(res.error).toBeDefined();
    expect(res.error!.data?.code).toBe("ERR_ASK_DISPATCH_FAILED");
  });
});

// ===========================================================================
// Criterion 19 — unknown tool name → MethodNotFound / ERR_UNKNOWN_TOOL.
// ===========================================================================

describe("criterion 19 — calling an unknown tool name returns MethodNotFound with data.code === 'ERR_UNKNOWN_TOOL' (spec §9.1, §11.19)", () => {
  it("an unregistered tool name → error -32601 / ERR_UNKNOWN_TOOL", async () => {
    const { server } = await build();
    const res = await callTool(server, "kip_frobnicate", {});
    expect(res.error).toBeDefined();
    expect(res.error!.code).toBe(-32601);
    expect(res.error!.data?.code).toBe("ERR_UNKNOWN_TOOL");
  });
});

// ===========================================================================
// Criterion 20 — src/mcp/** imports kip-sdk + genty but NOT babysitter-sdk.
// ===========================================================================

describe("criterion 20 — the server module imports @a5c-ai/kip-sdk + genty (@a5c-ai/genty-*) but NEVER @a5c-ai/babysitter-sdk (N-mcp-1, spec §11.20)", () => {
  it("a static scan over src/mcp/** finds a genty reference, the kip-sdk surface, and no babysitter-sdk module specifier", () => {
    const mcpDir = resolve(__dirname, "..", "mcp");
    const files = walk(mcpDir).filter((f) => f.endsWith(".ts") || f.endsWith(".js") || f.endsWith(".mjs"));
    expect(files.length).toBeGreaterThan(0);
    const combined = files.map((f) => readFileSync(f, "utf8")).join("\n");

    // The load-bearing N-mcp-1 claim: no babysitter-sdk MODULE SPECIFIER on the kip MCP path.
    expect(combined).not.toMatch(/['"]@a5c-ai\/babysitter-sdk/);
    // The ask dispatch path links the genty layers (an actual module specifier).
    expect(combined).toMatch(/['"]@a5c-ai\/genty/);
    // And it consumes the kip SDK surface (self-import barrel or scoped package).
    expect(combined).toMatch(/from ['"]\.\.\/index['"]|['"]@a5c-ai\/kip-sdk['"]/);
  });
});

// ===========================================================================
// Criterion 21 — startup without --dir/KIP_REPO_DIR fails before advertising tools (no cwd default).
// ===========================================================================

describe("criterion 21 — startup with neither --dir nor KIP_REPO_DIR fails before advertising tools, never defaulting to cwd (spec §3.2, §11.21)", () => {
  it("createKipMcpServer with no dir and no KIP_REPO_DIR rejects with ERR_MALFORMED_INPUT and never opens a repo", async () => {
    let opened = 0;
    const openRepo = async (o: OpenOptions): Promise<Repo> => {
      opened += 1;
      void o;
      return makeSpyRepo().repo;
    };
    await expect(
      createKipMcpServer({
        openRepo,
        dispatch: makeAskDispatch(askOk({ answer: "x" })).dispatch,
        env: {}, // no KIP_REPO_DIR
        replicaId: "r1",
        keyring: {},
        qaManifest: qaManifest(),
        // no `dir`, no `argv` --dir
      }),
    ).rejects.toBeInstanceOf(KipError);
    expect(opened).toBe(0); // never reached open() — failed at dir resolution
  });

  it("the rejection carries the ERR_MALFORMED_INPUT KipError code (a memory repo is never guessed)", async () => {
    let error: unknown;
    try {
      await createKipMcpServer({
        openRepo: async () => makeSpyRepo().repo,
        dispatch: makeAskDispatch(askOk({ answer: "x" })).dispatch,
        env: {},
        replicaId: "r1",
        keyring: {},
        qaManifest: qaManifest(),
      });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(KipError);
    expect((error as KipError).code).toBe("ERR_MALFORMED_INPUT");
  });
});

// ===========================================================================
// Criterion 22 — the §2.3 envelope: a single text content item carrying valid JSON.
// ===========================================================================

describe("criterion 22 — kip_get_node output is a single text content item containing valid JSON (the §2.3 envelope, spec §11.22)", () => {
  it("result.content is exactly one { type:'text' } item whose text parses to the NodeView", async () => {
    const { server } = await build({ scripted: { getNode: async (e: string) => nodeView(e) } });
    const res = await callTool(server, "kip_get_node", { eid: "e1" });
    expect(res.error).toBeUndefined();
    const result = res.result as { content: Array<{ type: string; text: string }> };
    expect(Array.isArray(result.content)).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const parsed = JSON.parse(result.content[0].text) as NodeView;
    expect(parsed.eid).toBe("e1");
    expect(parsed).toHaveProperty("provenance");
  });
});

// ===========================================================================
// Round-2 review, finding #1 "one layer up" — `kip_ask` is a MAPPING SEAM, and it used to return a
// dispatcher's output VERBATIM. Both round-1 forgeries therefore reproduced here through a
// NON-DEFAULT dispatcher (unreachable via the shipped `kip-mcp`, which wires
// `defaultDispatchMicroagent`, but reachable through the host-dispatcher seam ADR-B8 recommends —
// which falsified the ADR's own "always"). The seam now runs the SAME shared guard the core and the
// CLI run. Every test below drives a non-default dispatcher.
// ===========================================================================

/** The canonical abstention phrase (kip-graph-qa.md §6.1) — the substrate's signal, not the model's. */
const MCP_ABSTENTION_ANSWER = "No supporting facts in the knowledge graph.";

describe("round-2 #1 (one layer up) — kip_ask guards a dispatcher's output instead of trusting it", () => {
  it("THE FORGED SENTINEL: a dispatcher reporting the canonical unanswerable phrase with abstained:false is corrected to an abstention, not surfaced as an answer", async () => {
    const { dispatch } = makeAskDispatch({
      exitCode: 0,
      output: {
        answer: MCP_ABSTENTION_ANSWER,
        abstained: false, // the forgery: the substrate's signal, reported as an ANSWER
        citations: ["F_e"],
        usedFacts: ["F_e"],
      },
      elapsedMs: 0,
    });
    const { server } = await build({ dispatch });
    const res = await callTool(server, "kip_ask", { question: "Where does Tal work?" });

    const body = toolBody(res) as { answer: string; abstained?: boolean; citations: unknown[] };
    // The invariant is absolute here because it reads the answer STRING — an envelope a dispatcher
    // authors itself cannot defeat it.
    expect(body.abstained).toBe(true); // ← was false, contradicting its own prose
    expect(body.citations).toEqual([]);
    expect(body.answer).toBe(MCP_ABSTENTION_ANSWER);
  });

  it("A HALLUCINATED CITATION is dropped against the dispatcher's own usedFacts envelope — in the §7.3 bare-id shape", async () => {
    const { dispatch } = makeAskDispatch({
      exitCode: 0,
      output: {
        answer: "Tal works at a5c.",
        citations: ["F_e", "cid-invented-by-the-model"],
        usedFacts: ["F_e"],
      },
      elapsedMs: 0,
    });
    const { server } = await build({ dispatch });
    const res = await callTool(server, "kip_ask", { question: "Where does Tal work?" });

    const body = toolBody(res) as { citations: string[] };
    expect(body.citations).toEqual(["F_e"]); // the id shape is PRESERVED, never coerced
    expect(body.citations).not.toContain("cid-invented-by-the-model");
  });

  it("…and in the Citation-OBJECT shape the production dispatcher actually emits (both shapes are real; neither is coerced into the other)", async () => {
    const { dispatch } = makeAskDispatch({
      exitCode: 0,
      output: {
        answer: "Tal works at a5c.",
        citations: [
          { factId: "F_e", eid: "edge/tal-a5c", edgeKind: "employed_by" },
          { factId: "cid-invented", eid: "org/evil-corp" },
        ],
        usedFacts: ["F_e"],
      },
      elapsedMs: 0,
    });
    const { server } = await build({ dispatch });
    const res = await callTool(server, "kip_ask", { question: "Where does Tal work?" });

    const body = toolBody(res) as { citations: Array<Record<string, unknown>> };
    expect(body.citations).toHaveLength(1);
    expect(body.citations[0].factId).toBe("F_e");
    expect(JSON.stringify(body.citations)).not.toContain("org/evil-corp");
  });

  it("an unknown key a dispatcher attaches to an object citation does not reach the MCP client", async () => {
    const { dispatch } = makeAskDispatch({
      exitCode: 0,
      output: {
        answer: "Tal works at a5c.",
        citations: [{ factId: "F_e", eid: "org/a5c", verified: true, signature: "forged-sig" }],
        usedFacts: ["F_e"],
      },
      elapsedMs: 0,
    });
    const { server } = await build({ dispatch });
    const res = await callTool(server, "kip_ask", { question: "Where does Tal work?" });
    expect(JSON.stringify(toolBody(res))).not.toContain("forged-sig");
  });

  it("NO usedFacts envelope ⇒ citations pass through UNTOUCHED: with nothing to validate against, inventing an empty envelope would silently delete real citations (fabricating absence, N5)", async () => {
    // This is the §7.3 shape criterion 15 pins: `{ answer, citations }` with no `usedFacts`.
    const { dispatch } = makeAskDispatch(
      askOk({ answer: "Tal works at a5c.", citations: ["F_e"], nodes: ["org/a5c"] }),
    );
    const { server } = await build({ dispatch });
    const res = await callTool(server, "kip_ask", { question: "Where does Tal work?" });

    const body = toolBody(res) as { citations: string[] };
    expect(body.citations).toEqual(["F_e"]);
  });
});
