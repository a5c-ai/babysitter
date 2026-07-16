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
 *
 * STATUS: THIS ROUND ships a minimal typed STUB only (the frozen tests are authored first, TDD). Every
 * behavioral test fails on its `createKipMcpServer(...)`/`handle(...)` call (a thrown "unimplemented"),
 * NEVER on a type/import error — the file type-checks and every exported symbol below is real.
 */
import { KipError } from "../index";
import type {
  DispatchMicroagentFn,
  KipErrorCode,
  MicroagentManifest,
  OpenOptions,
  Repo,
} from "../index";

/**
 * The genty module specifiers this server links at runtime (spec §7.1). Held as string constants
 * (mirroring `src/cli/ask.ts`) so the standalone binary can `import()` genty WITHOUT a compile-time
 * dependency, and so the AC (criterion 20) dependency scan finds `@a5c-ai/genty` on this path and
 * NEVER `@a5c-ai/babysitter-sdk`.
 */
export const GENTY_PLATFORM_MODULE = "@a5c-ai/genty-platform";
export const GENTY_CORE_MODULE = "@a5c-ai/genty-core";

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

/** JSON-RPC 2.0 error codes the server maps to (spec §9.1). */
export const MCP_JSONRPC_ERROR = {
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
  /** The bundled `kip-graph-qa` manifest (spec §7.1); tests inject a pinned one. */
  qaManifest?: MicroagentManifest;
}

/** The testable server core (spec §2). */
export interface KipMcpServer {
  /** Handle one JSON-RPC request (`tools/list` | `tools/call` | `initialize`) — spec §2.2. */
  handle(request: JsonRpcRequest): Promise<JsonRpcResponse>;
  /** The advertised tool descriptors under the current capability gate (spec §4/§10). */
  listTools(): McpToolDescriptor[];
}

/**
 * Build a kip MCP server bound to one repo (spec §2.2). Resolves the repo dir (spec §3.2), opens the
 * `Repo` via `openRepo`, registers the graph-QA manifest, and returns the request handler.
 *
 * STUB (this round): throws `unimplemented`. The frozen acceptance suite therefore fails on this call,
 * not on an import/type error. Replaced by the real bootstrap in the implementation milestone.
 */
export async function createKipMcpServer(
  options: CreateKipMcpServerOptions,
): Promise<KipMcpServer> {
  void options;
  void GENTY_PLATFORM_MODULE;
  void GENTY_CORE_MODULE;
  throw new Error(
    "createKipMcpServer: unimplemented (kip MCP server stub — frozen tests precede implementation)",
  );
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

/** Resolve the repo dir by the fixed precedence ladder (spec §3.2); throws when unset (no cwd default). */
export function resolveRepoDir(
  dir: string | undefined,
  argv: string[] | undefined,
  env: Record<string, string | undefined> | undefined,
): string {
  void dir;
  void argv;
  void env;
  throw new KipError(
    "ERR_MALFORMED_INPUT",
    "resolveRepoDir: unimplemented (kip MCP server stub)",
  );
}
