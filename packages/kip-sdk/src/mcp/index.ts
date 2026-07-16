/**
 * kip MCP server — STANDALONE graph read/write + graph-QA tool surface (spec:
 * `docs/design/kip-mcp.md`, `docs/design/kip-graph-qa.md`).
 *
 * This is the programmatically-testable CORE of the standalone kip MCP server. It hand-rolls the MCP
 * stdio JSON-RPC 2.0 protocol (ZERO new runtime deps — no `@modelcontextprotocol/sdk`) and exposes a
 * pure request/response `handle()` so the frozen acceptance suite can drive `tools/list` + `tools/call`
 * DIRECTLY, with no subprocess or stdio round trip. `createKipMcpServer({ openRepo, dispatch,
 * readOnly, ... })` resolves the repo dir (spec §3.2), opens exactly one `Repo` via the injected
 * `openRepo` seam (spec §2.2), registers the bundled `kip-graph-qa` manifest, and returns a server that
 * maps each `tools/call` to exactly one `Repo` method (spec §8) or a graph-QA dispatch (spec §7).
 *
 * HARD ARCHITECTURAL BOUNDARY (N-mcp-1, spec §0). This server consumes `@a5c-ai/kip-sdk` (self) +
 * genty (`@a5c-ai/genty-core` / `@a5c-ai/genty-platform`) DIRECTLY. It MUST NOT import or route through
 * `@a5c-ai/babysitter-sdk`, and MUST NOT reuse babysitter-sdk's `src/mcp/` run-effect tool surface.
 */
import { KipError } from "../index";
import type {
  AsOf,
  DispatchMicroagentFn,
  EdgePut,
  KipErrorCode,
  MicroagentInvocation,
  MicroagentManifest,
  MicroagentResult,
  NodePut,
  OpenOptions,
  RecallQuery,
  Repo,
  RetractInput,
  ScopeRef,
  TraversalSpec,
} from "../index";

// --- Tool surface (spec §4) ------------------------------------------------

/** Read tools — never author a fact; always available, even under `--read-only` (spec §4/§10). */
export const KIP_MCP_READ_TOOLS = [
  "kip_get_node",
  "kip_get_edge",
  "kip_query",
  "kip_recall",
  "kip_asof",
  "kip_fsck",
] as const;

/** The graph-QA tool — read-classified despite dispatching an agent (spec §4/§7.2). */
export const KIP_MCP_ASK_TOOL = "kip_ask" as const;

/** Write tools — the ONLY tools that change substrate state; omitted/blocked under `--read-only`. */
export const KIP_MCP_WRITE_TOOLS = ["kip_assert", "kip_retract", "kip_sync"] as const;

/** The full advertised surface (read + ask + write) — the ten tools of spec §4 / criterion 1. */
export const KIP_MCP_ALL_TOOLS = [
  ...KIP_MCP_READ_TOOLS,
  KIP_MCP_ASK_TOOL,
  ...KIP_MCP_WRITE_TOOLS,
] as const;

export type KipMcpToolName = (typeof KIP_MCP_ALL_TOOLS)[number];

// --- JSON-RPC 2.0 wire shapes (hand-rolled, spec §2) -----------------------

/** JSON-RPC 2.0 error codes the server maps to (spec §9.1, plus the transport-level Parse error). */
export const MCP_JSONRPC_ERROR = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
} as const;

/** The machine `data.code` an MCP error carries so the calling agent can branch (spec §9). */
export type McpErrorDataCode =
  | "ERR_MALFORMED_INPUT"
  | "ERR_SIGNATURE_INVALID"
  | "ERR_SCOPE_DENIED"
  | "ERR_READ_ONLY"
  | "ERR_UNKNOWN_TOOL"
  | "ERR_UNKNOWN_METHOD"
  | "ERR_ASK_DISPATCH_FAILED"
  | "ERR_INTERNAL";

export interface JsonRpcRequest {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
}

export interface JsonRpcErrorBody {
  code: number;
  message: string;
  data?: { code?: McpErrorDataCode; kipCode?: KipErrorCode; [k: string]: unknown };
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: JsonRpcErrorBody;
}

/** One `tools/list` descriptor (spec §4/§5/§6/§7.3). */
export interface McpToolDescriptor {
  name: string;
  description: string;
  inputSchema: unknown;
}

/** A `tools/call` result envelope — a single `text` content item carrying JSON (spec §2.3). */
export interface McpToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

// --- Server factory --------------------------------------------------------

export interface CreateKipMcpServerOptions {
  /** The injected repo-open seam (spec §2.2) — tests pass a spy `Repo`; prod passes `open`. */
  openRepo: (options: OpenOptions) => Promise<Repo>;
  /** The injected graph-QA dispatch seam (spec §7.1) — tests script it; prod links genty. */
  dispatch: DispatchMicroagentFn;
  /** `--read-only` / `KIP_READ_ONLY=1` capability gate (spec §10). */
  readOnly?: boolean;
  /** Resolved repo dir (spec §3.2 precedence 1). */
  dir?: string;
  /** argv the server was launched with — resolves `--dir` (spec §3.2 precedence 1). */
  argv?: string[];
  /** Process env — resolves `KIP_REPO_DIR` (spec §3.2 precedence 2). */
  env?: Record<string, string | undefined>;
  /** `--replica-id` / `KIP_REPLICA_ID` (spec §3.3). */
  replicaId?: string;
  /** Signing key material (spec §3.3); optional for a `--read-only` server. */
  keyring?: unknown;
  /** `--create-if-missing` → `OpenOptions.createIfMissing` (spec §3.2); requires `genesis`. */
  createIfMissing?: boolean;
  /** `--genesis <path>` (loaded) → `OpenOptions.genesis` (spec §3.2). */
  genesis?: OpenOptions["genesis"];
  /** `--tenant <t>` → initial `ScopeRef.tenant` lens via `Repo.withScope` (spec §3.3). */
  tenant?: string;
  /** `--namespace <ns>` → initial `ScopeRef.namespace` lens (spec §3.3). */
  namespace?: string;
  /** The bundled `kip-graph-qa` manifest (spec §7.1); tests inject a pinned one. */
  qaManifest?: MicroagentManifest;
}

/** The testable server core (spec §2). */
export interface KipMcpServer {
  /** Handle one JSON-RPC request (`tools/list` | `tools/call` | `initialize` | lifecycle notification) — spec §2.2. */
  handle(request: JsonRpcRequest): Promise<JsonRpcResponse>;
  /**
   * Handle one newline-delimited stdio line (spec §2.1): parse it, dispatch it, and return the
   * response frame to write to `stdout` — or `null` when there is NOTHING to write (a blank line, or a
   * JSON-RPC notification, which MUST receive no response). Malformed JSON yields a `-32700` Parse-error
   * frame (id `null`). This is the pure, testable core of the stdio loop; `server.ts` only wires it to
   * `process.stdin`/`process.stdout`.
   */
  handleLine(line: string): Promise<string | null>;
  /** The advertised tool descriptors under the current capability gate (spec §4/§10). */
  listTools(): McpToolDescriptor[];
}

// --- JSON-schema fragments for the advertised inputSchemas (spec §5-§7) -----

const ASOF_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    validTime: { type: ["string", "number", "object"] },
    txTime: { type: "object" },
    believer: { type: "string" },
  },
} as const;

const TOOL_INPUT_SCHEMAS: Record<string, unknown> = {
  kip_get_node: {
    type: "object",
    required: ["eid"],
    additionalProperties: false,
    properties: { eid: { type: "string", description: "entity id (EID)" }, asOf: ASOF_SCHEMA },
  },
  kip_get_edge: {
    type: "object",
    required: ["eid"],
    additionalProperties: false,
    properties: { eid: { type: "string" }, asOf: ASOF_SCHEMA },
  },
  kip_query: {
    type: "object",
    required: ["seed", "direction", "depth", "maxFanout"],
    additionalProperties: false,
    properties: {
      seed: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
      direction: { enum: ["out", "in", "both"] },
      edgeKinds: { type: "array", items: { type: "string" } },
      depth: { type: "integer", minimum: 0 },
      maxFanout: { type: "integer", minimum: 1 },
      kinds: { type: "array", items: { type: "string" } },
      asOf: ASOF_SCHEMA,
    },
  },
  kip_recall: {
    type: "object",
    additionalProperties: false,
    properties: {
      query: { type: "string" },
      embedding: { type: "array", items: { type: "number" } },
      k: { type: "integer", minimum: 1 },
      asOf: ASOF_SCHEMA,
    },
  },
  kip_asof: {
    type: "object",
    required: ["asOf", "read"],
    additionalProperties: false,
    properties: {
      asOf: ASOF_SCHEMA,
      read: {
        oneOf: [
          { type: "object", required: ["op", "eid"], properties: { op: { const: "getNode" }, eid: { type: "string" } } },
          { type: "object", required: ["op", "eid"], properties: { op: { const: "getEdge" }, eid: { type: "string" } } },
          { type: "object", required: ["op", "spec"], properties: { op: { const: "query" }, spec: { type: "object" } } },
          { type: "object", required: ["op", "q"], properties: { op: { const: "recall" }, q: { type: "object" } } },
        ],
      },
    },
  },
  kip_fsck: { type: "object", additionalProperties: false, properties: {} },
  // The kip_ask surface IS the kip-graph-qa manifest inputSchema (kip-graph-qa.md §2/§7):
  // `{ question, asOf?, scope? }`. It deliberately does NOT advertise `seed`/`maxHops` — the real
  // manifest inputSchema (`additionalProperties:false`) rejects them, so forwarding them would fail the
  // genty runner's pre-dispatch validation (SCHEMA_MISMATCH → ERR_ASK_DISPATCH_FAILED).
  kip_ask: {
    type: "object",
    required: ["question"],
    additionalProperties: false,
    properties: {
      question: { type: "string", description: "natural-language question over the graph" },
      asOf: ASOF_SCHEMA,
      scope: {
        type: "object",
        additionalProperties: false,
        properties: {
          tenant: { type: "string" },
          namespace: { type: "string" },
          snapshot: { type: "object" },
        },
      },
    },
  },
  kip_assert: {
    type: "object",
    required: ["kind"],
    oneOf: [
      {
        properties: {
          kind: { const: "node" },
          node: {
            type: "object",
            required: ["eid", "kind"],
            properties: {
              eid: { type: "string" },
              kind: { type: "string" },
              props: { type: "object" },
              validFrom: {},
              validTo: {},
            },
          },
        },
        required: ["node"],
      },
      {
        properties: {
          kind: { const: "edge" },
          edge: {
            type: "object",
            required: ["kind", "from", "to", "validFrom"],
            properties: {
              eid: { type: "string" },
              kind: { type: "string" },
              from: { type: "string" },
              to: { type: "string" },
              props: { type: "object" },
              validFrom: {},
              validTo: {},
            },
          },
        },
        required: ["edge"],
      },
    ],
  },
  kip_retract: {
    type: "object",
    required: ["mode"],
    oneOf: [
      {
        properties: { mode: { const: "tombstone" }, eid: { type: "string" }, reason: { type: "string" } },
        required: ["eid", "reason"],
      },
      {
        properties: { mode: { const: "cell" }, target: { type: "object" }, validTo: {} },
        required: ["target"],
      },
    ],
  },
  kip_sync: {
    type: "object",
    required: ["remote"],
    additionalProperties: false,
    properties: {
      remote: { type: "string", description: "git remote name or URL" },
      fetch: { type: "boolean" },
      push: { type: "boolean" },
      remoteBranches: { type: "array", items: { type: "string" } },
      retention: { enum: ["default", "permissive"] },
    },
  },
};

const TOOL_DESCRIPTIONS: Record<string, string> = {
  kip_get_node: "Read a node projection (NodeView | null) at an optional as-of selector (Repo.getNode).",
  kip_get_edge: "Read an edge projection (EdgeView | null) at an optional as-of selector (Repo.getEdge).",
  kip_query: "Typed as-of graph traversal; drains Repo.query into { results }. depth+maxFanout required.",
  kip_recall: "Hybrid vector+graph+salience RRF retrieval (Repo.recall) → { results }, conflicts surfaced.",
  kip_asof: "Pin a bitemporal AsOf ReadView and run one sub-read (getNode|getEdge|query|recall) against it.",
  kip_fsck: "Integrity check (Repo.fsck); an ok:false report is data, never an MCP error.",
  kip_ask: "Read-only graph-QA: answer a natural-language question over the graph with cited factIds.",
  kip_assert: "Author a signed node/edge fact (Repo.putNode / Repo.putEdge) → { eid }.",
  kip_retract: "Author a forgetting fact: tombstone (Repo.tombstone) or bounded cell retract (Repo.retractFact).",
  kip_sync: "Fetch/push + set-union merge with a remote (Repo.sync); conflicts surfaced, never auto-picked.",
};

// --- Internal error typing -------------------------------------------------

/** A graph-QA dispatch failure (spec §7.4 / §9.1) — mapped to InternalError / ERR_ASK_DISPATCH_FAILED. */
class AskDispatchError extends Error {}

// --- Small validation helpers (hand-rolled, no JSON-schema engine) ---------

function malformed(message: string): never {
  throw new KipError("ERR_MALFORMED_INPUT", message);
}

function asObject(args: unknown, tool: string): Record<string, unknown> {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    malformed(`${tool}: arguments must be an object`);
  }
  return args as Record<string, unknown>;
}

function requireString(v: unknown, tool: string, field: string): string {
  if (typeof v !== "string") malformed(`${tool}: '${field}' must be a string`);
  return v as string;
}

const DIRECTIONS = ["out", "in", "both"] as const;

/**
 * Enforce the advertised `TraversalSpec` bounds server-side (spec §5.3 / §9.1 row 1) BEFORE any
 * `Repo.query` call: `seed` present, `direction ∈ {out,in,both}`, `depth` an integer `>= 0`, and
 * `maxFanout` an integer `>= 1` (the SDK has no unbounded default, m7-21). A missing or out-of-contract
 * bound is `ERR_MALFORMED_INPUT` — a well-typed-but-out-of-range spec never reaches an unbounded
 * traversal. Shared by `kip_query` and the `kip_asof` `query` sub-read.
 */
function validateTraversalBounds(spec: Record<string, unknown>, tool: string): void {
  if (spec.seed === undefined) malformed(`${tool}: 'seed' is required`);
  if (!DIRECTIONS.includes(spec.direction as (typeof DIRECTIONS)[number])) {
    malformed(`${tool}: 'direction' must be one of out|in|both`);
  }
  if (typeof spec.depth !== "number" || !Number.isInteger(spec.depth) || (spec.depth as number) < 0) {
    malformed(`${tool}: 'depth' must be an integer >= 0 (no unbounded default)`);
  }
  if (
    typeof spec.maxFanout !== "number" ||
    !Number.isInteger(spec.maxFanout) ||
    (spec.maxFanout as number) < 1
  ) {
    malformed(`${tool}: 'maxFanout' must be an integer >= 1 (no unbounded default)`);
  }
}

// --- Handler context + registry --------------------------------------------

interface HandlerCtx {
  repo: Repo;
  dispatch: DispatchMicroagentFn;
  qaManifest: MicroagentManifest;
  /** The resolved repo dir (spec §3.2) — handed to the graph-QA microagent as `repoDir` so it can open
   *  a READ-ONLY projection of the same repo and actually retrieve (spec §7.2, mirrors `runAsk`). */
  repoDir: string;
  /** The server's resolved tenant/namespace lens (spec §3.3), forwarded to `kip_ask` when a call omits
   *  its own `scope` so the graph-QA read runs under the same lens as the direct read tools. */
  scope?: ScopeRef;
}

async function drain(iterable: AsyncIterable<unknown>): Promise<unknown[]> {
  const out: unknown[] = [];
  for await (const v of iterable) out.push(v);
  return out;
}

/** True iff a graph-QA `MicroagentResult.output` satisfies the kip_ask output schema (spec §7.3:
 *  required `answer`(string) + `citations`(array)). A malformed object is a dispatch failure. */
function isValidAskOutput(output: unknown): boolean {
  if (!output || typeof output !== "object") return false;
  const o = output as Record<string, unknown>;
  return typeof o.answer === "string" && Array.isArray(o.citations);
}

const TOOL_HANDLERS: Record<string, (ctx: HandlerCtx, args: unknown) => Promise<unknown>> = {
  async kip_get_node(ctx, args) {
    const a = asObject(args, "kip_get_node");
    const eid = requireString(a.eid, "kip_get_node", "eid");
    return ctx.repo.getNode(eid, a.asOf as AsOf | undefined);
  },

  async kip_get_edge(ctx, args) {
    const a = asObject(args, "kip_get_edge");
    const eid = requireString(a.eid, "kip_get_edge", "eid");
    return ctx.repo.getEdge(eid, a.asOf as AsOf | undefined);
  },

  async kip_query(ctx, args) {
    const a = asObject(args, "kip_query");
    validateTraversalBounds(a, "kip_query");
    const spec = {
      seed: a.seed,
      direction: a.direction,
      depth: a.depth,
      maxFanout: a.maxFanout,
      ...(a.edgeKinds !== undefined ? { edgeKinds: a.edgeKinds } : {}),
      ...(a.kinds !== undefined ? { kinds: a.kinds } : {}),
      ...(a.asOf !== undefined ? { asOf: a.asOf } : {}),
    } as unknown as TraversalSpec;
    const results = await drain(ctx.repo.query(spec));
    return { results };
  },

  async kip_recall(ctx, args) {
    const a = asObject(args, "kip_recall");
    // Enforce the advertised bounds (spec §5.4 schema): `k` (when present) an integer `>= 1`.
    if (a.k !== undefined && (typeof a.k !== "number" || !Number.isInteger(a.k) || a.k < 1)) {
      malformed("kip_recall: 'k' must be an integer >= 1");
    }
    const q: Record<string, unknown> = {};
    if (typeof a.query === "string") q.text = a.query;
    if (Array.isArray(a.embedding)) q.embedding = a.embedding;
    if (typeof a.k === "number") q.k = a.k;
    if (a.asOf !== undefined) q.asOf = a.asOf;
    const results = await ctx.repo.recall(q as unknown as RecallQuery);
    return { results };
  },

  async kip_asof(ctx, args) {
    const a = asObject(args, "kip_asof");
    if (a.asOf === undefined) malformed("kip_asof: 'asOf' is required");
    const read = asObject(a.read, "kip_asof.read");
    const view = await ctx.repo.asOf(a.asOf as AsOf);
    switch (read.op) {
      case "getNode":
        return view.getNode(requireString(read.eid, "kip_asof", "read.eid"));
      case "getEdge":
        return view.getEdge(requireString(read.eid, "kip_asof", "read.eid"));
      case "query": {
        // The as-of `query` sub-read is bound by the SAME mandatory depth/maxFanout contract as the
        // top-level kip_query (spec §5.3) — a missing-bound spec is rejected here too, never forwarded.
        const spec = asObject(read.spec, "kip_asof.read.spec");
        validateTraversalBounds(spec, "kip_asof.read");
        return { results: await drain(view.query(spec as unknown as Omit<TraversalSpec, "asOf">)) };
      }
      case "recall": {
        const q = read.q as Omit<RecallQuery, "asOf">;
        return { results: await view.recall(q) };
      }
      default:
        return malformed("kip_asof: 'read.op' must be getNode|getEdge|query|recall");
    }
  },

  async kip_fsck(ctx) {
    return ctx.repo.fsck();
  },

  async kip_assert(ctx, args) {
    const a = asObject(args, "kip_assert");
    if (a.kind === "node") {
      // Enforce the advertised node schema (spec §6.1): required `eid`/`kind` strings.
      const node = asObject(a.node, "kip_assert.node");
      requireString(node.eid, "kip_assert.node", "eid");
      requireString(node.kind, "kip_assert.node", "kind");
      const eid = await ctx.repo.putNode(node as unknown as NodePut);
      return { eid };
    }
    if (a.kind === "edge") {
      // Enforce the advertised edge schema (spec §6.1): required `kind`/`from`/`to` strings + `validFrom`.
      const edge = asObject(a.edge, "kip_assert.edge");
      requireString(edge.kind, "kip_assert.edge", "kind");
      requireString(edge.from, "kip_assert.edge", "from");
      requireString(edge.to, "kip_assert.edge", "to");
      if (edge.validFrom === undefined) malformed("kip_assert.edge: 'validFrom' is required");
      const eid = await ctx.repo.putEdge(edge as unknown as EdgePut);
      return { eid };
    }
    return malformed("kip_assert: 'kind' must be 'node' or 'edge'");
  },

  async kip_retract(ctx, args) {
    const a = asObject(args, "kip_retract");
    if (a.mode === "tombstone") {
      const eid = requireString(a.eid, "kip_retract", "eid");
      const reason = requireString(a.reason, "kip_retract", "reason");
      const factId = await ctx.repo.tombstone(eid, reason);
      return { factId };
    }
    if (a.mode === "cell") {
      const target = asObject(a.target, "kip_retract.target");
      const input = {
        ...target,
        ...(a.validTo !== undefined ? { validTo: a.validTo } : {}),
      } as unknown as RetractInput;
      return ctx.repo.retractFact(input);
    }
    return malformed("kip_retract: 'mode' must be 'tombstone' or 'cell'");
  },

  async kip_sync(ctx, args) {
    const a = asObject(args, "kip_sync");
    const remote = requireString(a.remote, "kip_sync", "remote");
    // Enforce the advertised `retention` enum (spec §6.3 schema): default|permissive when present.
    if (a.retention !== undefined && a.retention !== "default" && a.retention !== "permissive") {
      malformed("kip_sync: 'retention' must be one of default|permissive");
    }
    const opts: Record<string, unknown> = {};
    if (typeof a.fetch === "boolean") opts.fetch = a.fetch;
    if (typeof a.push === "boolean") opts.push = a.push;
    if (Array.isArray(a.remoteBranches)) opts.remoteBranches = a.remoteBranches;
    if (a.retention !== undefined) opts.retention = a.retention;
    return ctx.repo.sync(remote, opts as never);
  },

  async kip_ask(ctx, args) {
    const a = asObject(args, "kip_ask");
    const question = requireString(a.question, "kip_ask", "question");

    // Build the invocation input aligned to the kip-graph-qa manifest inputSchema (kip-graph-qa.md §2:
    // `{ question, asOf?, scope?, repoDir }`), mirroring how `src/cli/ask.ts`'s `runAsk` wires it:
    // pass `repoDir` so the READ-ONLY microagent can open the same repo and actually retrieve (spec
    // §7.2). `seed`/`maxHops` are NOT forwarded — the manifest (`additionalProperties:false`) rejects
    // them. Read-only (INV-A1): nothing here authors a fact; the answer is returned verbatim.
    const input: Record<string, unknown> = {
      question,
      repoDir: ctx.repoDir,
      // The synthesis model the production dispatcher binds into the genty-model `synthesize` seam
      // (kip-graph-qa.md §3.3/§5.3); the manifest's declared `runtime.model` unless overridden.
      model: ctx.qaManifest.runtime.model,
    };
    if (a.asOf !== undefined) input.asOf = a.asOf;
    const scope = a.scope ?? ctx.scope;
    if (scope !== undefined) input.scope = scope;

    const effectiveTimeout = ctx.qaManifest.runtime.timeout;
    const invocation: MicroagentInvocation = {
      id: `kip-ask-${Date.now()}`,
      manifest: { name: ctx.qaManifest.name, version: ctx.qaManifest.version },
      input,
      timeout: effectiveTimeout,
    };

    // A dispatch that THROWS (e.g. the production synthesizer failing loud because no host model is
    // bound — kip-graph-qa.md §6.6) is a DISPATCH failure → ERR_ASK_DISPATCH_FAILED, NOT
    // ERR_MALFORMED_INPUT. A genuine caller-input `ERR_MALFORMED_INPUT` stays on its own channel
    // (InvalidParams), preserving the two-channel model.
    let result: MicroagentResult;
    try {
      result = await ctx.dispatch(invocation);
    } catch (e) {
      if (e instanceof KipError && e.code === "ERR_MALFORMED_INPUT") throw e;
      throw new AskDispatchError(
        `graph-QA dispatch failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    // Dispatch-failure detection (spec §7.4 / §9.1, N5): non-zero exit, timeout overrun, or
    // schema-invalid output ⇒ ERR_ASK_DISPATCH_FAILED, NO fabricated answer, NOTHING authored.
    if (result.exitCode !== 0) {
      throw new AskDispatchError(`graph-QA dispatch failed (exitCode ${result.exitCode})`);
    }
    if (
      effectiveTimeout !== undefined &&
      result.elapsedMs !== undefined &&
      result.elapsedMs > effectiveTimeout
    ) {
      throw new AskDispatchError(
        `graph-QA dispatch timed out (${result.elapsedMs}ms > ${effectiveTimeout}ms)`,
      );
    }
    if (!isValidAskOutput(result.output)) {
      throw new AskDispatchError("graph-QA output failed schema validation");
    }
    // Read-only tool (INV-A1): the answer is returned verbatim; no fact is ever authored here.
    return result.output;
  },
};

// --- Error mapping (spec §9.1) ---------------------------------------------

/** Map a thrown error from a tool handler to the §9.1 MCP error body. */
function mapErrorToJsonRpc(err: unknown): JsonRpcErrorBody {
  if (err instanceof AskDispatchError) {
    return mcpError(MCP_JSONRPC_ERROR.InternalError, err.message, "ERR_ASK_DISPATCH_FAILED");
  }
  if (err instanceof KipError) {
    switch (err.code) {
      case "ERR_MALFORMED_INPUT":
        return mcpError(MCP_JSONRPC_ERROR.InvalidParams, err.message, "ERR_MALFORMED_INPUT", err.code);
      case "ERR_SIGNATURE_INVALID":
        return mcpError(MCP_JSONRPC_ERROR.InvalidParams, err.message, "ERR_SIGNATURE_INVALID", err.code);
      case "ERR_SCOPE_DENIED":
        return mcpError(MCP_JSONRPC_ERROR.InvalidRequest, err.message, "ERR_SCOPE_DENIED", err.code);
      default:
        return mcpError(MCP_JSONRPC_ERROR.InternalError, err.message, "ERR_INTERNAL", err.code);
    }
  }
  const message = err instanceof Error ? err.message : String(err);
  return mcpError(MCP_JSONRPC_ERROR.InternalError, message, "ERR_INTERNAL");
}

// --- Server factory ---------------------------------------------------------

/**
 * Build a kip MCP server bound to one repo (spec §2.2). Resolves the repo dir (spec §3.2), opens the
 * `Repo` via `openRepo`, registers the graph-QA manifest, and returns the request handler.
 */
export async function createKipMcpServer(
  options: CreateKipMcpServerOptions,
): Promise<KipMcpServer> {
  const env = options.env ?? {};

  // Startup: resolve the repo dir BEFORE opening (spec §3.2). An unresolvable dir fails here — never
  // a cwd default — and the process never advertises tools (criterion 21).
  const dir = resolveRepoDir(options.dir, options.argv, env);

  // Identity (spec §3.3): replicaId is required and never invented.
  const replicaId = options.replicaId ?? env.KIP_REPLICA_ID;
  if (!replicaId) {
    throw new KipError("ERR_MALFORMED_INPUT", "kip-mcp: replicaId required (--replica-id or KIP_REPLICA_ID)");
  }

  const qaManifest = options.qaManifest;
  if (!qaManifest) {
    throw new KipError("ERR_MALFORMED_INPUT", "kip-mcp: graph-QA manifest is required");
  }

  const readOnly = options.readOnly === true;

  // Create-a-fresh-repo path (spec §3.2): `--create-if-missing` REQUIRES a `--genesis` config —
  // absent an existing repo AND genesis parameters, startup fails rather than inventing genesis (N5).
  if (options.createIfMissing && !options.genesis) {
    throw new KipError(
      "ERR_MALFORMED_INPUT",
      "kip-mcp: --create-if-missing requires --genesis <path> (genesis parameters are never invented)",
    );
  }

  const openOptions: OpenOptions = {
    dir,
    replicaId,
    keyring: options.keyring ?? {},
    ...(options.createIfMissing ? { createIfMissing: true } : {}),
    ...(options.genesis ? { genesis: options.genesis } : {}),
  };
  const opened = await options.openRepo(openOptions);

  // Optional tenant/namespace lens (spec §3.3): `--tenant`/`--namespace` (precedence) else env.
  const scope = resolveScope(options.tenant, options.namespace, env);
  const repo = scope ? opened.withScope(scope) : opened;

  const ctx: HandlerCtx = { repo, dispatch: options.dispatch, qaManifest, repoDir: dir, scope };

  function listTools(): McpToolDescriptor[] {
    const names: readonly string[] = readOnly
      ? [...KIP_MCP_READ_TOOLS, KIP_MCP_ASK_TOOL]
      : KIP_MCP_ALL_TOOLS;
    return names.map((name) => ({
      name,
      description: TOOL_DESCRIPTIONS[name] ?? name,
      inputSchema: TOOL_INPUT_SCHEMAS[name],
    }));
  }

  async function callTool(name: string, args: unknown): Promise<JsonRpcResponse["result"] | { error: JsonRpcErrorBody }> {
    // Unknown tool name (spec §9.1) — checked against the full ten-tool surface, so a --read-only
    // write-tool call is NOT "unknown" (it is gated below with ERR_READ_ONLY).
    if (!(KIP_MCP_ALL_TOOLS as readonly string[]).includes(name)) {
      return {
        error: mcpError(MCP_JSONRPC_ERROR.MethodNotFound, `unknown tool '${name}'`, "ERR_UNKNOWN_TOOL"),
      };
    }
    // Capability gate (spec §10): a write tool under --read-only errors BEFORE the Repo is touched.
    if (readOnly && isWriteTool(name)) {
      return {
        error: mcpError(
          MCP_JSONRPC_ERROR.InvalidRequest,
          `tool '${name}' is not available on a --read-only kip MCP server`,
          "ERR_READ_ONLY",
        ),
      };
    }
    try {
      const body = await TOOL_HANDLERS[name](ctx, args);
      const text = JSON.stringify(body === undefined ? null : body);
      const result: McpToolResult = { content: [{ type: "text", text }] };
      return result;
    } catch (err) {
      return { error: mapErrorToJsonRpc(err) };
    }
  }

  async function handle(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const id = request.id ?? null;
    const respond = (result: unknown): JsonRpcResponse => ({ jsonrpc: "2.0", id, result });
    const fail = (error: JsonRpcErrorBody): JsonRpcResponse => ({ jsonrpc: "2.0", id, error });

    switch (request.method) {
      case "initialize":
        return respond({
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "kip-mcp", version: "0.0.1" },
        });

      // The standard MCP lifecycle notification a client sends after `initialize` (spec §2.2). It is a
      // no-op with NO result to act on; `handleLine` suppresses the frame entirely for an id-less
      // notification, and this case guarantees it is NEVER answered with a `-32601` error.
      case "notifications/initialized":
        return respond({});

      case "tools/list":
        return respond({ tools: listTools() });

      case "tools/call": {
        const params = (request.params ?? {}) as { name?: unknown; arguments?: unknown };
        if (typeof params.name !== "string") {
          return fail(
            mcpError(MCP_JSONRPC_ERROR.InvalidParams, "tools/call requires a string 'name'", "ERR_MALFORMED_INPUT"),
          );
        }
        const outcome = await callTool(params.name, params.arguments);
        if (outcome && typeof outcome === "object" && "error" in outcome) {
          return fail((outcome as { error: JsonRpcErrorBody }).error);
        }
        return respond(outcome);
      }

      default:
        // Unknown top-level METHOD (distinct from an unknown TOOL, which is ERR_UNKNOWN_TOOL via
        // tools/call): a method-scoped MethodNotFound (spec §2.1).
        return fail(
          mcpError(MCP_JSONRPC_ERROR.MethodNotFound, `unknown method '${request.method}'`, "ERR_UNKNOWN_METHOD"),
        );
    }
  }

  async function handleLine(line: string): Promise<string | null> {
    const trimmed = line.trim();
    if (!trimmed) return null; // blank / whitespace-only line — nothing to dispatch (spec §2.1)

    let request: JsonRpcRequest;
    try {
      request = JSON.parse(trimmed) as JsonRpcRequest;
    } catch (err) {
      // Malformed JSON at the transport layer → JSON-RPC 2.0 Parse error (-32700), id null (the id is
      // unknowable on unparseable input). This is the ONLY frame the stdio loop synthesizes itself.
      const parseError: JsonRpcResponse = {
        jsonrpc: "2.0",
        id: null,
        error: { code: MCP_JSONRPC_ERROR.ParseError, message: `Parse error: ${(err as Error).message}` },
      };
      return JSON.stringify(parseError);
    }

    // A JSON-RPC Notification is a request with NO `id` member; a server MUST NOT reply to one (spec
    // §2.1). We still dispatch it (so `notifications/initialized` is a real no-op) but emit nothing.
    const isNotification = !request || typeof request !== "object" || !("id" in request);
    const response = await handle(request);
    return isNotification ? null : JSON.stringify(response);
  }

  return { handle, handleLine, listTools };
}

/** Construct a typed MCP error body (spec §9). Exported for the implementation + test reuse. */
export function mcpError(
  code: number,
  message: string,
  dataCode: McpErrorDataCode,
  kipCode?: KipErrorCode,
): JsonRpcErrorBody {
  return { code, message, data: { code: dataCode, ...(kipCode ? { kipCode } : {}) } };
}

/** True iff `name` is a write tool (spec §4 gate table) — the SINGLE `--read-only` gate (spec §10). */
export function isWriteTool(name: string): boolean {
  return (KIP_MCP_WRITE_TOOLS as readonly string[]).includes(name);
}

/** Parse a `--dir <path>` / `--dir=<path>` value out of a launch argv (spec §3.2 precedence 1). */
function parseDirFromArgv(argv: string[] | undefined): string | undefined {
  if (!argv) return undefined;
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--dir") return argv[i + 1];
    if (token.startsWith("--dir=")) return token.slice("--dir=".length);
  }
  return undefined;
}

/** Resolve the repo dir by the fixed precedence ladder (spec §3.2); throws when unset (no cwd default). */
export function resolveRepoDir(
  dir: string | undefined,
  argv: string[] | undefined,
  env: Record<string, string | undefined> | undefined,
): string {
  const resolved = dir ?? parseDirFromArgv(argv) ?? env?.KIP_REPO_DIR;
  if (!resolved) {
    throw new KipError(
      "ERR_MALFORMED_INPUT",
      "kip-mcp: repo dir is required (--dir or KIP_REPO_DIR); a memory repo is never guessed",
    );
  }
  return resolved;
}

/**
 * Build a `ScopeRef` from the `--tenant`/`--namespace` flags (precedence) or `KIP_TENANT`/
 * `KIP_NAMESPACE` env (spec §3.3), or `undefined` when no tenant is set (absent namespace = all
 * namespaces the key may read).
 */
function resolveScope(
  tenantFlag: string | undefined,
  namespaceFlag: string | undefined,
  env: Record<string, string | undefined>,
): ScopeRef | undefined {
  const tenant = tenantFlag ?? env.KIP_TENANT;
  if (!tenant) return undefined;
  const scope: ScopeRef = { tenant };
  const namespace = namespaceFlag ?? env.KIP_NAMESPACE;
  if (namespace) scope.namespace = namespace;
  return scope;
}
