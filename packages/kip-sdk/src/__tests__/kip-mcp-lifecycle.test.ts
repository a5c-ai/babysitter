/**
 * kip MCP server — JSON-RPC 2.0 lifecycle + stdio-line coverage (round-2 additions).
 *
 * This suite covers the transport/dispatch layer the frozen acceptance suite (`kip-mcp.test.ts`) does
 * NOT: the `initialize` handshake, the MCP lifecycle notification (`notifications/initialized`), the
 * "servers MUST NOT reply to a notification" rule, unknown-method routing (-32601), the -32700 Parse
 * error for malformed JSON, and a normal `tools/call` round-trip driven THROUGH the newline-delimited
 * `handleLine` layer (spec `docs/design/kip-mcp.md` §2.1). It also covers the round-2 fixes:
 * server-side `TraversalSpec` bounds enforcement, the `kip_ask` `repoDir`/`scope` wiring (kip-graph-qa.md
 * §7.2 — no `seed`/`maxHops`), and the `--create-if-missing`/`--genesis`/`--tenant`/`--namespace`
 * launch flags (§3.2/§3.3). It ADDS tests only — it never weakens the frozen suite.
 */
import { describe, expect, it } from "vitest";
import { KipError } from "../index";
import type {
  DispatchMicroagentFn,
  MicroagentInvocation,
  MicroagentManifest,
  MicroagentResult,
  NodeView,
  OpenOptions,
  Repo,
  ScopeRef,
} from "../index";
import { createKipMcpServer } from "../mcp";
import type { CreateKipMcpServerOptions, JsonRpcRequest, JsonRpcResponse, KipMcpServer } from "../mcp";

// ---------------------------------------------------------------------------
// Minimal self-contained harness (mirrors the frozen suite's idiom; kept local so this file adds
// coverage without importing test-only helpers the frozen file does not export).
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
        if (prop === "then") return undefined;
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

function askOk(fields: { answer: string; citations?: string[] }): MicroagentResult {
  return { exitCode: 0, output: { answer: fields.answer, citations: fields.citations ?? [] }, elapsedMs: 0 };
}

function makeAskDispatch(
  result: MicroagentResult,
): { dispatch: DispatchMicroagentFn; log: MicroagentInvocation[] } {
  const log: MicroagentInvocation[] = [];
  const dispatch: DispatchMicroagentFn = async (inv) => {
    log.push(inv);
    return result;
  };
  return { dispatch, log };
}

function nodeView(eid = "e1", kind = "Person"): NodeView {
  return {
    eid,
    kind,
    props: {
      name: { segments: [{ kind: "value", value: "Ada", validFrom: 0, validTo: null, assertedBy: "F_name" }] },
    },
    provenance: { author: `a-${eid}`, signature: `s-${eid}`, publicKeyFingerprint: `f-${eid}`, signedFields: [] },
  };
}

const DEFAULT_DIR = "/tmp/kip-mcp-lifecycle-repo";

interface BuiltServer {
  server: KipMcpServer;
  spy: SpyRepo;
  openOptions: OpenOptions[];
  askLog: MicroagentInvocation[];
}

async function build(
  opts: {
    scripted?: Record<string, (...a: any[]) => any>;
    readOnly?: boolean;
    dispatch?: DispatchMicroagentFn;
    askLog?: MicroagentInvocation[];
    dir?: string | null;
    env?: Record<string, string | undefined>;
    tenant?: string;
    namespace?: string;
    createIfMissing?: boolean;
    genesis?: OpenOptions["genesis"];
  } = {},
): Promise<BuiltServer> {
  const spy = makeSpyRepo(opts.scripted);
  const openOptions: OpenOptions[] = [];
  const openRepo = async (o: OpenOptions): Promise<Repo> => {
    openOptions.push(o);
    return spy.repo;
  };
  const dispatch = opts.dispatch ?? makeAskDispatch(askOk({ answer: "unused" })).dispatch;

  const createOptions: CreateKipMcpServerOptions = {
    openRepo,
    dispatch,
    readOnly: opts.readOnly,
    env: opts.env ?? {},
    replicaId: "kip-mcp-lifecycle-replica",
    keyring: {},
    tenant: opts.tenant,
    namespace: opts.namespace,
    createIfMissing: opts.createIfMissing,
    genesis: opts.genesis,
    qaManifest: qaManifest(),
  };
  if (opts.dir !== null) createOptions.dir = opts.dir ?? DEFAULT_DIR;

  const server = await createKipMcpServer(createOptions);
  return { server, spy, openOptions, askLog: opts.askLog ?? [] };
}

let seq = 0;
function req(method: string, params?: unknown): JsonRpcRequest {
  seq += 1;
  return { jsonrpc: "2.0", id: seq, method, params };
}

// A minimal valid genesis config (spec §3.2) for the create-a-fresh-repo path.
const GENESIS: NonNullable<OpenOptions["genesis"]> = {
  hashAlgo: "sha256",
  shardDepth: 2,
  clockEpoch: 0,
  epsilonCausalMs: 0,
  regenBoundaryRule: "author-hlc-contiguous",
  rootKeys: [],
  quarantineTtlMs: 0,
  quarantineKeyCapBytes: 0,
  quarantinePoolBytes: 0,
  keyChainDurableCapBytes: 0,
};

// ===========================================================================
// initialize handshake (spec §2.2)
// ===========================================================================

describe("lifecycle — initialize returns protocolVersion/capabilities/serverInfo (spec §2.2)", () => {
  it("handle(initialize) returns the MCP handshake body with no error", async () => {
    const { server } = await build();
    const res = await server.handle(req("initialize"));
    expect(res.error).toBeUndefined();
    const result = res.result as { protocolVersion?: string; capabilities?: unknown; serverInfo?: { name?: string } };
    expect(result.protocolVersion).toBe("2024-11-05");
    expect(result.capabilities).toBeTypeOf("object");
    expect(result.serverInfo?.name).toBe("kip-mcp");
  });

  it("handleLine(initialize) emits exactly the serialized response frame", async () => {
    const { server } = await build();
    const frame = await server.handleLine(JSON.stringify(req("initialize")));
    expect(frame).not.toBeNull();
    const parsed = JSON.parse(frame as string) as JsonRpcResponse;
    expect((parsed.result as { serverInfo?: { name?: string } }).serverInfo?.name).toBe("kip-mcp");
  });
});

// ===========================================================================
// notifications MUST get NO response (spec §2.1)
// ===========================================================================

describe("lifecycle — a JSON-RPC notification (no id) receives NO response frame (spec §2.1)", () => {
  it("handleLine(notifications/initialized) with NO id returns null (nothing written)", async () => {
    const { server } = await build();
    const frame = await server.handleLine(
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
    );
    expect(frame).toBeNull();
  });

  it("handle(notifications/initialized) is a no-op success, NEVER a -32601 error (idful edge case)", async () => {
    const { server } = await build();
    const res = await server.handle(req("notifications/initialized"));
    expect(res.error).toBeUndefined();
  });

  it("an arbitrary notification (no id) is suppressed even for an unknown method", async () => {
    const { server } = await build();
    const frame = await server.handleLine(JSON.stringify({ jsonrpc: "2.0", method: "notifications/cancelled" }));
    expect(frame).toBeNull();
  });

  it("a tools/call sent WITH an id still gets a response frame (not suppressed)", async () => {
    const { server } = await build({ scripted: { getNode: async (e: string) => nodeView(e) } });
    const frame = await server.handleLine(
      JSON.stringify(req("tools/call", { name: "kip_get_node", arguments: { eid: "e1" } })),
    );
    expect(frame).not.toBeNull();
  });
});

// ===========================================================================
// unknown method → -32601 (spec §2.1)
// ===========================================================================

describe("lifecycle — an unknown top-level method returns MethodNotFound -32601 (spec §2.1)", () => {
  it("handleLine(unknown method WITH id) emits a -32601 / ERR_UNKNOWN_METHOD frame", async () => {
    const { server } = await build();
    const frame = await server.handleLine(JSON.stringify(req("resources/list")));
    expect(frame).not.toBeNull();
    const parsed = JSON.parse(frame as string) as JsonRpcResponse;
    expect(parsed.error?.code).toBe(-32601);
    expect(parsed.error?.data?.code).toBe("ERR_UNKNOWN_METHOD");
  });
});

// ===========================================================================
// malformed JSON → -32700 (spec §2.1)
// ===========================================================================

describe("lifecycle — malformed JSON at the stdio layer → JSON-RPC Parse error -32700, id null (spec §2.1)", () => {
  it("handleLine('{ not json') returns a -32700 frame with id null", async () => {
    const { server } = await build();
    const frame = await server.handleLine("{ this is not json ");
    expect(frame).not.toBeNull();
    const parsed = JSON.parse(frame as string) as JsonRpcResponse;
    expect(parsed.error?.code).toBe(-32700);
    expect(parsed.id).toBeNull();
  });

  it("handleLine('') and a whitespace-only line return null (blank lines skipped)", async () => {
    const { server } = await build();
    expect(await server.handleLine("")).toBeNull();
    expect(await server.handleLine("   \t  ")).toBeNull();
  });
});

// ===========================================================================
// normal tools/call round-trip THROUGH the line layer (spec §2.1 + §2.3)
// ===========================================================================

describe("lifecycle — a normal tools/call round-trips through handleLine to the §2.3 envelope (spec §2.1)", () => {
  it("handleLine(tools/call kip_get_node) drives Repo.getNode and returns the NodeView JSON body", async () => {
    const { server, spy } = await build({ scripted: { getNode: async (e: string) => nodeView(e) } });
    const frame = await server.handleLine(
      JSON.stringify(req("tools/call", { name: "kip_get_node", arguments: { eid: "e1" } })),
    );
    expect(frame).not.toBeNull();
    expect(lastCall(spy, "getNode")!.args[0]).toBe("e1");
    const parsed = JSON.parse(frame as string) as JsonRpcResponse;
    const content = (parsed.result as { content: Array<{ text: string }> }).content;
    const body = JSON.parse(content[0].text) as NodeView;
    expect(body.eid).toBe("e1");
  });

  it("handleLine(tools/list) returns the ten tools", async () => {
    const { server } = await build();
    const frame = await server.handleLine(JSON.stringify(req("tools/list")));
    const parsed = JSON.parse(frame as string) as JsonRpcResponse;
    const tools = (parsed.result as { tools: Array<{ name: string }> }).tools;
    expect(tools).toHaveLength(10);
  });
});

// ===========================================================================
// kip_query bounds enforced server-side (spec §5.3 / §9.1 row 1)
// ===========================================================================

describe("bounds — kip_query enforces the advertised direction/depth/maxFanout bounds before Repo.query (spec §5.3/§9.1)", () => {
  const queryStub = { query: () => (async function* () {})() };

  it("direction outside {out,in,both} → ERR_MALFORMED_INPUT, Repo.query uncalled", async () => {
    const { server, spy } = await build({ scripted: queryStub });
    const res = await server.handle(
      req("tools/call", { name: "kip_query", arguments: { seed: "e1", direction: "diagonal", depth: 1, maxFanout: 1 } }),
    );
    expect(res.error?.code).toBe(-32602);
    expect(res.error?.data?.code).toBe("ERR_MALFORMED_INPUT");
    expect(methodsCalled(spy)).not.toContain("query");
  });

  it("negative depth → ERR_MALFORMED_INPUT, Repo.query uncalled", async () => {
    const { server, spy } = await build({ scripted: queryStub });
    const res = await server.handle(
      req("tools/call", { name: "kip_query", arguments: { seed: "e1", direction: "out", depth: -1, maxFanout: 1 } }),
    );
    expect(res.error?.data?.code).toBe("ERR_MALFORMED_INPUT");
    expect(methodsCalled(spy)).not.toContain("query");
  });

  it("maxFanout < 1 → ERR_MALFORMED_INPUT, Repo.query uncalled", async () => {
    const { server, spy } = await build({ scripted: queryStub });
    const res = await server.handle(
      req("tools/call", { name: "kip_query", arguments: { seed: "e1", direction: "out", depth: 0, maxFanout: 0 } }),
    );
    expect(res.error?.data?.code).toBe("ERR_MALFORMED_INPUT");
    expect(methodsCalled(spy)).not.toContain("query");
  });

  it("a valid in-bounds spec still passes through to Repo.query", async () => {
    const { server, spy } = await build({ scripted: { query: () => (async function* () { yield nodeView("n"); })() } });
    const res = await server.handle(
      req("tools/call", { name: "kip_query", arguments: { seed: "e1", direction: "both", depth: 0, maxFanout: 1 } }),
    );
    expect(res.error).toBeUndefined();
    expect(methodsCalled(spy)).toContain("query");
  });
});

describe("bounds — kip_sync retention enum and kip_assert required fields are enforced (spec §6)", () => {
  it("kip_sync retention outside {default,permissive} → ERR_MALFORMED_INPUT, Repo.sync uncalled", async () => {
    const { server, spy } = await build({ scripted: { sync: async () => ({}) } });
    const res = await server.handle(
      req("tools/call", { name: "kip_sync", arguments: { remote: "origin", retention: "forever" } }),
    );
    expect(res.error?.data?.code).toBe("ERR_MALFORMED_INPUT");
    expect(methodsCalled(spy)).not.toContain("sync");
  });

  it("kip_assert edge missing 'from' → ERR_MALFORMED_INPUT, Repo.putEdge uncalled", async () => {
    const { server, spy } = await build({ scripted: { putEdge: async () => "x" } });
    const res = await server.handle(
      req("tools/call", { name: "kip_assert", arguments: { kind: "edge", edge: { kind: "knows", to: "e2", validFrom: 0 } } }),
    );
    expect(res.error?.data?.code).toBe("ERR_MALFORMED_INPUT");
    expect(methodsCalled(spy)).not.toContain("putEdge");
  });
});

// ===========================================================================
// kip_ask wiring: repoDir passed, seed/maxHops NOT forwarded, scope forwarded (kip-graph-qa.md §7.2)
// ===========================================================================

describe("kip_ask — hands the microagent repoDir + scope and never forwards seed/maxHops (spec §7.2, kip-graph-qa.md §2)", () => {
  it("forwards { question, repoDir } (the resolved --dir) so the QA agent can open the repo", async () => {
    const { dispatch, log } = makeAskDispatch(askOk({ answer: "a5c", citations: ["F_e"] }));
    const { server } = await build({ dispatch, dir: "/tmp/some-real-repo" });
    const res = await server.handle(req("tools/call", { name: "kip_ask", arguments: { question: "Where does Tal work?" } }));
    expect(res.error).toBeUndefined();
    const input = log[0].input as Record<string, unknown>;
    expect(input.question).toBe("Where does Tal work?");
    expect(input.repoDir).toBe("/tmp/some-real-repo");
  });

  it("does NOT forward seed/maxHops (the real manifest inputSchema rejects them)", async () => {
    const { dispatch, log } = makeAskDispatch(askOk({ answer: "x" }));
    const { server } = await build({ dispatch });
    await server.handle(
      req("tools/call", { name: "kip_ask", arguments: { question: "q", seed: "e1", maxHops: 3 } }),
    );
    const input = log[0].input as Record<string, unknown>;
    expect(input).not.toHaveProperty("seed");
    expect(input).not.toHaveProperty("maxHops");
  });

  it("forwards a per-call scope; else falls back to the server's --tenant/--namespace lens", async () => {
    const perCall = makeAskDispatch(askOk({ answer: "x" }));
    const s1 = await build({ dispatch: perCall.dispatch });
    await s1.server.handle(
      req("tools/call", { name: "kip_ask", arguments: { question: "q", scope: { tenant: "acme" } } }),
    );
    expect((perCall.log[0].input as { scope?: ScopeRef }).scope).toMatchObject({ tenant: "acme" });

    const fromServer = makeAskDispatch(askOk({ answer: "x" }));
    const s2 = await build({ dispatch: fromServer.dispatch, tenant: "globex", namespace: "eng" });
    await s2.server.handle(req("tools/call", { name: "kip_ask", arguments: { question: "q" } }));
    expect((fromServer.log[0].input as { scope?: ScopeRef }).scope).toMatchObject({ tenant: "globex", namespace: "eng" });
  });
});

// ===========================================================================
// launch flags: --create-if-missing/--genesis (§3.2), --tenant/--namespace (§3.3)
// ===========================================================================

describe("launch — --create-if-missing/--genesis and --tenant/--namespace are wired, not silently ignored (spec §3.2/§3.3)", () => {
  it("--create-if-missing WITH genesis threads createIfMissing + genesis into OpenOptions", async () => {
    const { openOptions } = await build({ createIfMissing: true, genesis: GENESIS });
    expect(openOptions[0].createIfMissing).toBe(true);
    expect(openOptions[0].genesis).toMatchObject({ hashAlgo: "sha256" });
  });

  it("--create-if-missing WITHOUT genesis rejects at startup with ERR_MALFORMED_INPUT (genesis never invented)", async () => {
    await expect(build({ createIfMissing: true })).rejects.toBeInstanceOf(KipError);
  });

  it("--tenant/--namespace lens the repo via Repo.withScope(scope)", async () => {
    const { spy } = await build({ tenant: "globex", namespace: "eng" });
    const withScope = lastCall(spy, "withScope");
    expect(withScope).toBeDefined();
    expect(withScope!.args[0]).toMatchObject({ tenant: "globex", namespace: "eng" });
  });

  it("no tenant → no withScope call (absent lens = all namespaces the key may read)", async () => {
    const { spy } = await build();
    expect(methodsCalled(spy)).not.toContain("withScope");
  });
});
