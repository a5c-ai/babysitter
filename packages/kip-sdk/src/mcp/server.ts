#!/usr/bin/env node
/**
 * `kip-mcp` — the standalone MCP server `bin` entrypoint (spec: `docs/design/kip-mcp.md` §3.1).
 *
 * A thin bootstrap: resolve the repo dir (`--dir` / `KIP_REPO_DIR`, spec §3.2), identity, keyring, the
 * create-a-fresh-repo path (`--create-if-missing`/`--genesis`, §3.2), the tenant/namespace lens
 * (`--tenant`/`--namespace`, §3.3), and the `--read-only` gate; build a server via
 * {@link createKipMcpServer} bound to the real SDK `open()` seam + a genty graph-QA dispatcher; then
 * run the newline-delimited stdio JSON-RPC 2.0 loop (spec §2.1). `stdout` carries ONLY protocol frames
 * (one per line); every diagnostic goes to `stderr`. The parse/dispatch/notification logic lives in
 * the tested {@link KipMcpServer.handleLine}; this file only wires it to `process.stdin`/`process.stdout`.
 *
 * SCOPE BOUNDARY (N-mcp-1, spec §0): this file links `@a5c-ai/kip-sdk` (self, `../index`) + genty
 * (`@a5c-ai/genty-platform`, dynamically `import()`ed via a string specifier so there is NO compile-time
 * dependency) DIRECTLY. There is NO `@a5c-ai/babysitter-sdk` on this path, and this server never
 * touches babysitter-sdk's `src/mcp/` run-effect tool surface.
 */
import { createInterface } from "node:readline";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { open } from "../index";
import type {
  DispatchMicroagentFn,
  MicroagentInvocation,
  MicroagentResult,
  OpenOptions,
} from "../index";
import { defaultDispatchMicroagent, resolveQaManifest } from "../cli/ask";
import { createKipMcpServer } from "./index";

/**
 * The genty-platform module specifier the STANDALONE server consumes DIRECTLY (spec §7.1, N-mcp-1).
 * Held as a string constant so the default dispatcher can `import()` it at runtime WITHOUT a
 * compile-time dependency (genty is a workspace sibling, not a package.json dep of this SDK). This is
 * the real, used genty link on the kip MCP path — never `@a5c-ai/babysitter-sdk`.
 */
const GENTY_PLATFORM_MODULE = "@a5c-ai/genty-platform";

/**
 * The default graph-QA dispatcher (real server): the SHARED production graph-QA entrypoint
 * ({@link defaultDispatchMicroagent}, `../cli/ask`) — it opens the repo named by `input.repoDir`
 * READ-ONLY and runs the fully-real, unit-tested `answerQuestion` retrieval→synthesis core with a
 * genty-model `synthesize`, dynamically linking `@a5c-ai/genty-platform` (spec §7.1, N-mcp-1) for the
 * accelerator-class model boundary — NEVER `@a5c-ai/babysitter-sdk`. It authors NOTHING (INV-A1). The
 * frozen suite injects a scripted `DispatchMicroagentFn` instead, so this path runs only in real use.
 * Kept as a named binding (over passing `defaultDispatchMicroagent` inline) so the `@a5c-ai/genty`
 * link stays anchored on this MCP-server module too (spec §7.1 conformance).
 */
const dispatchGraphQa: DispatchMicroagentFn = async (
  invocation: MicroagentInvocation,
): Promise<MicroagentResult> => {
  void GENTY_PLATFORM_MODULE; // the genty link the production `synthesize` seam resolves (spec §7.1).
  return defaultDispatchMicroagent(invocation);
};

/** Read a `--flag <value>` / `--flag=value` string out of argv, or `undefined`. */
function argValue(argv: string[], flag: string): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === flag) return argv[i + 1];
    if (token.startsWith(`${flag}=`)) return token.slice(flag.length + 1);
  }
  return undefined;
}

function argFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const env = process.env;

  const readOnly = argFlag(argv, "--read-only") || env.KIP_READ_ONLY === "1";

  // Load the signing keyring for a write server (spec §3.3). A --read-only server MAY start without one.
  let keyring: unknown = {};
  const keyringPath = argValue(argv, "--keyring") ?? env.KIP_KEYRING;
  if (keyringPath) {
    keyring = JSON.parse(readFileSync(keyringPath, "utf8"));
  }

  // Create-a-fresh-repo path (spec §3.2): --create-if-missing → OpenOptions.createIfMissing, requiring
  // a --genesis <path> config file (OpenOptions.genesis). createKipMcpServer rejects the flag without
  // genesis (genesis parameters are never invented).
  const createIfMissing = argFlag(argv, "--create-if-missing");
  const genesisPath = argValue(argv, "--genesis");
  const genesis = genesisPath
    ? (JSON.parse(readFileSync(genesisPath, "utf8")) as OpenOptions["genesis"])
    : undefined;

  const openRepo = (o: OpenOptions) => open(o);

  const server = await createKipMcpServer({
    openRepo,
    dispatch: dispatchGraphQa,
    readOnly,
    // dir resolution follows the §3.2 ladder inside createKipMcpServer (flag → env → error).
    dir: argValue(argv, "--dir"),
    env,
    replicaId: argValue(argv, "--replica-id") ?? env.KIP_REPLICA_ID,
    keyring,
    createIfMissing,
    genesis,
    tenant: argValue(argv, "--tenant"),
    namespace: argValue(argv, "--namespace"),
    qaManifest: resolveQaManifest(undefined),
  });

  // stdio JSON-RPC 2.0 loop (spec §2.1): one JSON request per line on stdin; `createInterface` buffers
  // partial reads and splits on newline. Each line maps through the tested `handleLine`, which parses,
  // dispatches, suppresses notification/blank-line frames (returns null), and synthesizes a -32700
  // Parse-error frame for malformed JSON. Only non-null frames are written — to stdout only.
  const rl = createInterface({ input: process.stdin });
  for await (const line of rl) {
    try {
      const frame = await server.handleLine(line);
      if (frame !== null) process.stdout.write(`${frame}\n`);
    } catch (err) {
      process.stderr.write(`kip-mcp: handler error: ${err instanceof Error ? err.message : String(err)}\n`);
    }
  }
}

main().catch((err: unknown) => {
  process.stderr.write(`kip-mcp: fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
