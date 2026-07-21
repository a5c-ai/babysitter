/**
 * `kip` CLI — the standalone command-line surface over the kip SDK (spec: `docs/design/kip-cli.md`).
 *
 * `runCli(argv, opts)` parses argv with a zero-dependency internal parser (spec §1), dispatches the
 * named subcommand against a resolved `Repo` (the SDK's `open()` — or the injected `openRepo` seam),
 * writes the result to `opts.stdout`/`opts.stderr` (spec §3's two-channel discipline), and RESOLVES
 * with the process exit code (spec §3's 0-6 contract). It never calls `process.exit`, so the frozen
 * acceptance suite can invoke it in-process with a spy `Repo` and a scripted `DispatchMicroagentFn`.
 *
 * SCOPE BOUNDARY (spec §1, AC-1): every module under `src/cli/` links `@a5c-ai/kip-sdk` (self) +, for
 * `ask`, the genty layers — NEVER `@a5c-ai/babysitter-sdk`. The CLI is a memory client, not a run
 * orchestrator: it stands up no `OrchestrationProvider`/`JournalProvider` registry.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { KipError, open } from "../index";
import { codeMinerDispatch } from "../miner/code-miner";
import { linkResolver, linkResolverDispatch, type NodeInventory } from "../linker/entity-linker";
import {
  LEARN_MANIFEST_NAMES,
  makeLearnDispatch,
  resolveLearnLiveGate,
  resolveLearnManifests,
  type LearnDiagnostic,
} from "../learn";
import type {
  AsOf,
  AssertInput,
  BlobRef,
  DispatchMicroagentFn,
  EdgePut,
  EdgeView,
  HlcOrTime,
  HlcStamp,
  MicroagentManifest,
  NodePut,
  NodeView,
  OpenOptions,
  PropValue,
  RecallQuery,
  Repo,
  RetractInput,
  RollupOptions,
  SyncOptions,
  TraversalSpec,
} from "../index";
import { flagBool, flagList, flagStr, parseArgs } from "./args";
import type { FlagValue } from "./args";
import {
  ResolutionError,
  isInitializedRepo,
  manifestGenesisCid,
  resolveDir,
  resolveKeyringPath,
  resolveReplicaId,
  resolveRepo,
} from "./resolve";
import type { OpenRepoFn, ResolveContext } from "./resolve";
import { defaultDispatchMicroagent, probeHarnessCli, resolveQaManifest, runAsk } from "./ask";
import type { AskResult } from "./ask";

/**
 * The options bag passed to {@link runCli}. `stdout`/`stderr` are write-callbacks so a test can
 * capture the two channels independently (spec §3). The three optional seams (`openRepo`,
 * `dispatchMicroagent`, `qaManifest`) are the TEST-INJECTION points that make the CLI deterministically
 * unit-testable without a real repo on disk, a real signing key, or a real genty subprocess.
 */
export interface RunCliOptions {
  cwd: string;
  env?: Record<string, string | undefined>;
  stdout: (chunk: string) => void;
  stderr: (chunk: string) => void;
  openRepo?: (options: OpenOptions) => Promise<Repo>;
  dispatchMicroagent?: DispatchMicroagentFn;
  qaManifest?: MicroagentManifest;
}

type Write = (chunk: string) => void;

interface HandlerArgs {
  ctx: ResolveContext;
  positionals: string[];
  flags: Record<string, FlagValue>;
  json: boolean;
  write: Write;
  werr: Write;
  openRepo: OpenRepoFn;
  dispatch: DispatchMicroagentFn;
  qaManifest?: MicroagentManifest;
}

const USAGE =
  "usage: kip [GLOBAL_OPTS] <command> [ARGS]\n" +
  "commands: init, open, assert, retract, get, query, recall, asof, fsck, rollup, sync, ask, index, link, learn\n";

/**
 * Parse `argv` (already `process.argv.slice(2)`), dispatch the named subcommand, and resolve with the
 * process exit code (spec §3). Never calls `process.exit`.
 */
export async function runCli(argv: string[], opts: RunCliOptions): Promise<number> {
  const write = opts.stdout;
  const werr = opts.stderr;
  const env = opts.env ?? {};

  const parsed = parseArgs(argv);
  if (parsed.error) {
    werr(`kip: ${parsed.error}\n${USAGE}`);
    return 2;
  }
  const flags = parsed.flags;

  if (flagBool(flags, "version")) {
    write(`${readVersion()}\n`);
    return 0;
  }
  if (flagBool(flags, "help")) {
    write(USAGE);
    return 0;
  }

  const command = parsed.positionals[0];
  if (!command) {
    werr(`kip: no command given\n${USAGE}`);
    return 2;
  }

  const ctx: ResolveContext = { cwd: opts.cwd, env, flags };
  const json = flagBool(flags, "json");
  const args: HandlerArgs = {
    ctx,
    positionals: parsed.positionals,
    flags,
    json,
    write,
    werr,
    openRepo: opts.openRepo ?? ((o) => open(o)),
    dispatch: opts.dispatchMicroagent ?? defaultDispatchMicroagent,
    qaManifest: opts.qaManifest,
  };

  try {
    switch (command) {
      case "init":
        return await cmdInit(args);
      case "open":
        return await cmdOpen(args);
      case "assert":
        return await cmdAssert(args);
      case "retract":
        return await cmdRetract(args);
      case "get":
        return await cmdGet(args);
      case "query":
        return await cmdQuery(args);
      case "recall":
        return await cmdRecall(args);
      case "asof":
        return await cmdAsof(args);
      case "fsck":
        return await cmdFsck(args);
      case "rollup":
        return await cmdRollup(args);
      case "sync":
        return await cmdSync(args);
      case "ask":
        return await cmdAsk(args);
      case "index":
        return await cmdIndex(args);
      case "link":
        return await cmdLink(args);
      case "learn":
        return await cmdLearn(args);
      default:
        werr(`kip: unknown command '${command}'\n${USAGE}`);
        return 2;
    }
  } catch (e) {
    // Pre-flight resolution errors (spec §6, exit 3) are surfaced before any SDK call.
    if (e instanceof ResolutionError) {
      werr(`${e.message}\n`);
      return 3;
    }
    // A thrown typed KipError is a caller-input rejection (spec §3, exit 1).
    if (e instanceof KipError) {
      renderKipError(werr, json, e);
      return 1;
    }
    werr(`${e instanceof Error ? e.message : String(e)}\n`);
    return 1;
  }
}

// ===========================================================================
// init / open (spec §4.1)
// ===========================================================================

async function cmdInit(a: HandlerArgs): Promise<number> {
  const { flags, ctx, write, werr, json } = a;
  const dir = resolveDir(ctx);

  if (!flagBool(flags, "create")) {
    werr("kip init requires --create to create a repo\n");
    return 3;
  }
  const replicaId = resolveReplicaId(ctx); // throws ResolutionError → exit 3

  // Guard accidental re-init: a non-empty dir that is not already a kip repo (spec §4.1).
  if (isNonEmptyNonRepo(dir)) {
    werr(`refusing to init: ${dir} is non-empty and not a kip repo\n`);
    return 3;
  }

  const keyringPath = resolveKeyringPath(ctx, dir);
  let keyring: unknown = {};
  if (keyringPath) {
    try {
      keyring = JSON.parse(readFileSync(keyringPath, "utf8"));
    } catch {
      keyring = {};
    }
  }

  const genesis = buildGenesis(flags);
  const repo = await a.openRepo({ dir, replicaId, keyring, createIfMissing: true, genesis });
  const branch = repo.branch();
  const out = { dir, created: true, manifestGenesisCid: manifestGenesisCid(dir), branch };
  if (json) emitJson(write, out);
  else write(`initialized kip repo at ${dir} (genesis ${out.manifestGenesisCid}, branch ${branch})\n`);
  return 0;
}

async function cmdOpen(a: HandlerArgs): Promise<number> {
  const { write, json } = a;
  const resolved = await resolveRepo(a.ctx, a.openRepo, { requireInitialized: true, requireKeyring: false });
  const branch = resolved.repo.branch();
  const out = {
    dir: resolved.dir,
    created: false,
    branch,
    manifestGenesisCid: manifestGenesisCid(resolved.dir),
  };
  if (json) emitJson(write, out);
  else write(`opened kip repo at ${resolved.dir} (branch ${branch})\n`);
  return 0;
}

// ===========================================================================
// assert (spec §4.2)
// ===========================================================================

async function cmdAssert(a: HandlerArgs): Promise<number> {
  const { flags, positionals, write, werr, json } = a;
  const form = positionals[1];
  if (form !== "node" && form !== "edge" && form !== "fact") {
    werr(`kip: assert requires a form: node | edge | fact\n${USAGE}`);
    return 2;
  }
  const resolved = await resolveRepo(a.ctx, a.openRepo, { requireInitialized: true, requireKeyring: true });
  const repo = resolved.repo;

  if (form === "node") {
    const eid = flagStr(flags, "eid");
    const kind = flagStr(flags, "kind");
    if (!eid || !kind) {
      werr("kip: assert node requires --eid and --kind\n");
      return 2;
    }
    const node: NodePut = { eid, kind, props: parseProps(flagList(flags, "prop")) };
    const vf = flagStr(flags, "valid-from");
    if (vf !== undefined) node.validFrom = parseHlcOrTime(vf);
    const vt = flagStr(flags, "valid-to");
    if (vt !== undefined) node.validTo = parseHlcOrTime(vt);
    const returnedEid = await repo.putNode(node);
    // `putNode` is sugar that compiles to MULTIPLE facts and returns only the entity `EID` (docs/40),
    // so there is no single stamped fact identity to echo. Echo the truthful `{ eid, status }` — never
    // a null `id`/`hlc`/`seq` masquerading as a real stamp (N5). `status` is `"pending"` by the M1
    // write invariant: `kip assert` performs no commit, so the write is not yet durable (a `kip commit`/
    // txn boundary is what flips `pending`→`durable`, §4.2).
    emitStampedEcho(write, json, { eid: returnedEid, status: "pending" });
    return 0;
  }

  if (form === "edge") {
    const kind = flagStr(flags, "kind");
    const from = flagStr(flags, "from");
    const to = flagStr(flags, "to");
    const vf = flagStr(flags, "valid-from");
    if (!kind || !from || !to) {
      werr("kip: assert edge requires --kind, --from and --to\n");
      return 2;
    }
    if (vf === undefined) {
      werr("kip: assert edge requires --valid-from\n");
      return 2;
    }
    const edge: EdgePut = { kind, from, to, validFrom: parseHlcOrTime(vf), props: parseProps(flagList(flags, "prop")) };
    const eid = flagStr(flags, "eid");
    if (eid !== undefined) edge.eid = eid;
    const vt = flagStr(flags, "valid-to");
    if (vt !== undefined) edge.validTo = parseHlcOrTime(vt);
    const returnedEid = await repo.putEdge(edge);
    // Same truthful sugar echo as the node form: `putEdge` returns only the `EID` (docs/40) — no single
    // stamped fact identity — so echo `{ eid, status }`, never a fabricated null `id`/`hlc`/`seq`.
    emitStampedEcho(write, json, { eid: returnedEid, status: "pending" });
    return 0;
  }

  // form === "fact"
  const input = readFactInput(a) as AssertInput;
  const stamped = await repo.assertFact(input);
  emitStampedEcho(write, json, { ...stamped });
  return 0;
}

// ===========================================================================
// retract (spec §4.3)
// ===========================================================================

async function cmdRetract(a: HandlerArgs): Promise<number> {
  const { flags, positionals, write, werr, json } = a;
  const resolved = await resolveRepo(a.ctx, a.openRepo, { requireInitialized: true, requireKeyring: true });
  const repo = resolved.repo;

  if (positionals[1] === "fact") {
    const input = readFactInput(a) as RetractInput;
    const stamped = await repo.retractFact(input);
    emitStampedEcho(write, json, { ...stamped });
    return 0;
  }

  // Targeted form: build a RetractInput over the named cell.
  const eid = flagStr(flags, "eid");
  if (!eid) {
    werr("kip: retract requires --eid (or the `retract fact` form)\n");
    return 2;
  }
  const validTo = flagStr(flags, "valid-to");
  if (validTo === undefined) {
    werr("kip: retract requires --valid-to\n");
    return 2;
  }
  const prop = flagStr(flags, "prop");
  const target = prop ? { kind: "node-prop" as const, eid, prop } : { kind: "node" as const, eid };
  const input = {
    v: 1,
    type: "retract",
    target,
    validFrom: 0,
    validTo: parseHlcOrTime(validTo),
    replicaId: resolved.replicaId,
    // The targeted form builds the RetractInput inline (unlike `retract fact`, whose provenance comes
    // from the file/stdin input), so it MUST supply a provenance for the signed mint-then-admit path:
    // `retractFact`→`mintFact` reads `provenance.author` and REBUILDS signature/fingerprint/publicKey
    // from the repo keyPair (INV-A1), exactly as `putNode`/`putEdge` do for their inline provenance.
    provenance: {
      author: `kip:retract:${resolved.replicaId}`,
      signature: "",
      publicKeyFingerprint: "",
      signedFields: [],
    },
  } as unknown as RetractInput;
  const stamped = await repo.retractFact(input);
  emitStampedEcho(write, json, { ...stamped });
  return 0;
}

// ===========================================================================
// get (spec §4.4)
// ===========================================================================

async function cmdGet(a: HandlerArgs): Promise<number> {
  const { flags, positionals, write, werr, json } = a;
  const eid = positionals[1];
  if (!eid) {
    werr("kip: get requires an <EID>\n");
    return 2;
  }
  const resolved = await resolveRepo(a.ctx, a.openRepo, { requireInitialized: true, requireKeyring: false });
  const repo = resolved.repo;
  const asOf = asOfFromFlag(flags);

  let view: NodeView | EdgeView | null;
  if (flagBool(flags, "edge")) {
    view = asOf ? await repo.getEdge(eid, asOf) : await repo.getEdge(eid);
  } else {
    view = asOf ? await repo.getNode(eid, asOf) : await repo.getNode(eid);
  }

  if (json) emitJson(write, view);
  else write(humanView(view, eid));

  if (view === null && flagBool(flags, "fail-on-unknown")) return 6;
  return 0;
}

// ===========================================================================
// query (spec §4.5)
// ===========================================================================

async function cmdQuery(a: HandlerArgs): Promise<number> {
  const { flags, write, werr, json } = a;
  const depthRaw = flagStr(flags, "depth");
  const fanoutRaw = flagStr(flags, "max-fanout");
  const direction = flagStr(flags, "direction");
  // Mandatory bounds — usage errors, emitted BEFORE any resolution (spec §4.5, §6).
  if (depthRaw === undefined || fanoutRaw === undefined) {
    werr("kip: query requires --depth and --max-fanout (the bound is mandatory)\n");
    return 2;
  }
  if (direction === undefined || !["out", "in", "both"].includes(direction)) {
    werr("kip: query requires --direction <out|in|both>\n");
    return 2;
  }

  const resolved = await resolveRepo(a.ctx, a.openRepo, { requireInitialized: true, requireKeyring: false });
  const seeds = flagList(flags, "seed");
  const spec: TraversalSpec = {
    seed: seeds.length === 1 ? seeds[0] : seeds,
    direction: direction as "out" | "in" | "both",
    depth: Number(depthRaw),
    maxFanout: Number(fanoutRaw),
  };
  const edgeKinds = flagList(flags, "edge-kind");
  if (edgeKinds.length) spec.edgeKinds = edgeKinds;
  const kinds = flagList(flags, "kind");
  if (kinds.length) spec.kinds = kinds;
  const asOf = asOfFromFlag(flags);
  if (asOf) spec.asOf = asOf;

  const results = await drain(resolved.repo.query(spec));
  if (flagBool(flags, "ndjson")) {
    for (const v of results) write(`${JSON.stringify(v)}\n`);
  } else if (json) {
    emitJson(write, results);
  } else {
    write(results.map((v) => `${(v as NodeView).kind} ${v.eid}\n`).join(""));
  }
  return 0;
}

// ===========================================================================
// recall (spec §4.6)
// ===========================================================================

async function cmdRecall(a: HandlerArgs): Promise<number> {
  const { flags, positionals, write, werr, json } = a;
  const queryText = positionals[1];
  if (queryText === undefined) {
    werr('kip: recall requires a "<query text>" positional\n');
    return 2;
  }
  const kRaw = flagStr(flags, "k");
  if (kRaw === undefined) {
    werr("kip: recall requires --k <n>\n");
    return 2;
  }
  const resolved = await resolveRepo(a.ctx, a.openRepo, { requireInitialized: true, requireKeyring: false });
  const q: RecallQuery = { text: queryText, k: Number(kRaw) };
  const embedding = readEmbedding(a);
  if (embedding) q.embedding = embedding;
  const asOf = asOfFromFlag(flags);
  if (asOf) q.asOf = asOf;

  const results = await resolved.repo.recall(q);
  if (json) emitJson(write, results);
  else write(humanRecall(results));

  if (flagBool(flags, "fail-on-conflict") && results.some((r) => r.conflicted)) return 6;
  return 0;
}

// ===========================================================================
// asof (spec §4.7)
// ===========================================================================

async function cmdAsof(a: HandlerArgs): Promise<number> {
  const { flags, positionals, write, werr, json } = a;
  const subread = positionals[1];
  if (subread === undefined || !["get", "query", "recall"].includes(subread)) {
    werr("kip: asof requires a sub-read selector: get | query | recall\n");
    return 2;
  }
  const resolved = await resolveRepo(a.ctx, a.openRepo, { requireInitialized: true, requireKeyring: false });
  const asOf = asOfFromAsofCmd(flags);
  const view = await resolved.repo.asOf(asOf);

  if (subread === "get") {
    const eid = positionals[2];
    if (!eid) {
      werr("kip: asof get requires an <EID>\n");
      return 2;
    }
    const v = flagBool(flags, "edge") ? await view.getEdge(eid) : await view.getNode(eid);
    if (json) emitJson(write, v);
    else write(humanView(v, eid, asOf));
    return 0;
  }

  if (subread === "query") {
    const depthRaw = flagStr(flags, "depth");
    const fanoutRaw = flagStr(flags, "max-fanout");
    const direction = flagStr(flags, "direction");
    if (depthRaw === undefined || fanoutRaw === undefined) {
      werr("kip: asof query requires --depth and --max-fanout\n");
      return 2;
    }
    if (direction === undefined || !["out", "in", "both"].includes(direction)) {
      werr("kip: asof query requires --direction <out|in|both>\n");
      return 2;
    }
    const seeds = flagList(flags, "seed");
    const spec: Omit<TraversalSpec, "asOf"> = {
      seed: seeds.length === 1 ? seeds[0] : seeds,
      direction: direction as "out" | "in" | "both",
      depth: Number(depthRaw),
      maxFanout: Number(fanoutRaw),
    };
    const edgeKinds = flagList(flags, "edge-kind");
    if (edgeKinds.length) (spec as TraversalSpec).edgeKinds = edgeKinds;
    const kinds = flagList(flags, "kind");
    if (kinds.length) (spec as TraversalSpec).kinds = kinds;
    const results = await drain(view.query(spec));
    if (json) emitJson(write, results);
    else write(results.map((v) => `${(v as NodeView).kind} ${v.eid}\n`).join(""));
    return 0;
  }

  // subread === "recall"
  const queryText = positionals[2];
  const kRaw = flagStr(flags, "k");
  if (queryText === undefined || kRaw === undefined) {
    werr('kip: asof recall requires a "<query>" positional and --k <n>\n');
    return 2;
  }
  const q: Omit<RecallQuery, "asOf"> = { text: queryText, k: Number(kRaw) };
  const embedding = readEmbedding(a);
  if (embedding) (q as RecallQuery).embedding = embedding;
  const results = await view.recall(q);
  if (json) emitJson(write, results);
  else write(humanRecall(results));
  return 0;
}

// ===========================================================================
// fsck (spec §4.8)
// ===========================================================================

async function cmdFsck(a: HandlerArgs): Promise<number> {
  const { flags, write, json } = a;
  const resolved = await resolveRepo(a.ctx, a.openRepo, { requireInitialized: true, requireKeyring: false });
  const report = await resolved.repo.fsck();
  if (json) emitJson(write, report);
  else if (!flagBool(flags, "quiet")) write(humanFsck(report));
  return report.ok ? 0 : 1;
}

// ===========================================================================
// rollup (spec §4.9)
// ===========================================================================

async function cmdRollup(a: HandlerArgs): Promise<number> {
  const { flags, write, werr, json } = a;
  const throughRaw = flagStr(flags, "through-hlc");
  if (throughRaw === undefined) {
    werr("kip: rollup requires --through-hlc <hlc>\n");
    return 2;
  }
  const resolved = await resolveRepo(a.ctx, a.openRepo, { requireInitialized: true, requireKeyring: false });
  const opts: RollupOptions = { throughHlc: parseHlcStamp(throughRaw, resolved.replicaId) };
  if (resolved.scope) opts.scope = resolved.scope;
  const cid = await resolved.repo.rollup(opts);
  const out: Record<string, unknown> = { rollup: cid, throughHlc: opts.throughHlc };
  if (resolved.scope) out.scope = resolved.scope;
  if (json) emitJson(write, out);
  else write(`rolled up through ${JSON.stringify(opts.throughHlc)} → ${cid}\n`);
  return 0;
}

// ===========================================================================
// sync (spec §4.10)
// ===========================================================================

async function cmdSync(a: HandlerArgs): Promise<number> {
  const { flags, positionals, write, werr, json } = a;
  const remote = positionals[1];
  if (!remote) {
    werr("kip: sync requires a <remote>\n");
    return 2;
  }
  // A keyring is required only when --push is explicitly set (spec §2).
  const requireKeyring = flagBool(flags, "push");
  const resolved = await resolveRepo(a.ctx, a.openRepo, { requireInitialized: true, requireKeyring });

  const opts: SyncOptions = {};
  const fetch = flagBool(flags, "fetch");
  const push = flagBool(flags, "push");
  if (fetch || push) {
    opts.fetch = fetch;
    opts.push = push;
  }
  const remoteBranches = flagList(flags, "remote-branch");
  if (remoteBranches.length) opts.remoteBranches = remoteBranches;
  const retention = flagStr(flags, "retention");
  if (retention === "default" || retention === "permissive") opts.retention = retention;

  try {
    const report = await resolved.repo.sync(remote, opts);
    if (json) emitJson(write, report);
    else
      write(
        `synced ${remote}: +${report.received}/-${report.sent}, merged ${report.merged}, ${report.conflicts.length} conflict(s), tip ${report.tip}\n`,
      );
    if (flagBool(flags, "fail-on-conflict") && report.conflicts.length > 0) return 6;
    return 0;
  } catch (e) {
    // A typed caller-input KipError (other than a promisor-peer transport gap) is exit 1; every
    // transport/sync failure — including ERR_NO_PROMISOR_PEER — is exit 4 (spec §4.10, §6).
    if (e instanceof KipError && e.code !== "ERR_NO_PROMISOR_PEER") throw e;
    werr(`kip: sync transport failure: ${e instanceof Error ? e.message : String(e)}\n`);
    return 4;
  }
}

// ===========================================================================
// ask (spec §4.11, §5)
// ===========================================================================

async function cmdAsk(a: HandlerArgs): Promise<number> {
  const { flags, positionals, write, werr, json } = a;
  const question = positionals[1];
  const resolved = await resolveRepo(a.ctx, a.openRepo, { requireInitialized: true, requireKeyring: false });
  const manifest = resolveQaManifest(a.qaManifest);

  const asOfRaw = flagStr(flags, "as-of");
  const asOf: AsOf | undefined = asOfRaw !== undefined ? { validTime: asOfRaw } : undefined;
  const timeoutRaw = flagStr(flags, "timeout");
  const kRaw = flagStr(flags, "k");

  const outcome = await runAsk({
    question: question ?? "",
    manifest,
    manifestSelector: flagStr(flags, "manifest"),
    model: flagStr(flags, "model"),
    timeoutMs: timeoutRaw !== undefined ? Number(timeoutRaw) : undefined,
    k: kRaw !== undefined ? Number(kRaw) : undefined,
    asOf,
    scope: resolved.scope,
    repoDir: resolved.dir,
    dispatch: a.dispatch,
  });

  if (outcome.kind === "dispatch-failure") {
    werr(`kip: ${outcome.message}\n`);
    return 5;
  }
  if (json) emitJson(write, outcome.result);
  else write(humanAsk(outcome.result));
  return 0;
}

// ===========================================================================
// index (ADR-B9c) — acquire code facts through the signed runAcquisition lifecycle.
// ===========================================================================

/**
 * `kip index <path> [--include <glob>] [--exclude <glob>] [--git-sha <sha>] [--json]` — resolve the
 * repo (keyring required, it authors signed facts), idempotently register the bundled `code-miner`
 * manifest, and call `runAcquisition` with `codeMinerDispatch` wired through `open()` (ADR-B9c). The
 * miner NEVER writes the graph (INV-A1); only `runAcquisition` commits its returned candidates.
 */
async function cmdIndex(a: HandlerArgs): Promise<number> {
  const { flags, positionals, write, werr, json } = a;
  const repoPath = positionals[1];
  if (!repoPath) {
    werr("kip: index requires a <path>\n");
    return 2;
  }
  const targetRepoDir = isAbsolute(repoPath) ? repoPath : join(a.ctx.cwd, repoPath);

  // Thread the code miner as the repo's dispatch seam via OpenOptions (ADR-B9c's one core change).
  const openRepoWithMiner: OpenRepoFn = (o) => a.openRepo({ ...o, dispatchMicroagent: codeMinerDispatch });
  const resolved = await resolveRepo(a.ctx, openRepoWithMiner, { requireInitialized: true, requireKeyring: true });
  const repo = resolved.repo;

  // Idempotently register the bundled manifest (a byte-identical re-registration is a no-op, INV-7).
  const manifest = resolveCodeMinerManifest();
  await repo.registerFunctionality(`kip-code-miner:${manifest.name}`, manifest);

  const input: { repoDir: string; gitSha?: string; include?: string[]; exclude?: string[] } = {
    repoDir: targetRepoDir,
  };
  const gitSha = flagStr(flags, "git-sha");
  if (gitSha !== undefined) input.gitSha = gitSha;
  const include = flagList(flags, "include");
  if (include.length) input.include = include;
  const exclude = flagList(flags, "exclude");
  if (exclude.length) input.exclude = exclude;

  const { facts } = await repo.runAcquisition(manifest, input, {});
  if (json) emitJson(write, { facts });
  else write(`indexed ${targetRepoDir}: ${facts.length} fact(s)\n`);
  return 0;
}

// ===========================================================================
// link (ADR-B11) — join the code and docs islands by asserting signed, reversible link edges.
// ===========================================================================

/**
 * `kip link [--dry-run] [--json]` — the deterministic Layer-1 entity linker (ADR-B11). Resolve the repo
 * (keyring required, it authors signed facts), enumerate every live `code:*`/`doc:*` node through the
 * read-only `nodeEids` seam (ADR-B11b), hydrate each node's props via the public `getNode`, and hand the
 * inventory to `linkResolver` through the `runAcquisition` write path with `linkResolverDispatch` wired
 * on `open()`. Concept→code exact matches become `documents` edges; cross-doc same-entity exact matches
 * become `same_as` pairs. The resolver reads only its input and authors nothing (INV-A1); only
 * `runAcquisition` commits.
 *
 * Honest reporting (ADR-B10e/B11): the honest zero-link case (`0 documents, 0 same_as`) is SUCCESS
 * (exit 0), not failure — abstention is correct when nothing matches (N5). `--dry-run` computes and
 * prints the would-be links without authoring anything.
 */
async function cmdLink(a: HandlerArgs): Promise<number> {
  const { flags, write, json } = a;

  // Thread the linker as the repo's dispatch seam via OpenOptions (mirrors cmdIndex's code miner).
  const openRepoWithLinker: OpenRepoFn = (o) => a.openRepo({ ...o, dispatchMicroagent: linkResolverDispatch });
  const resolved = await resolveRepo(a.ctx, openRepoWithLinker, { requireInitialized: true, requireKeyring: true });
  const repo = resolved.repo;

  // Idempotently register the bundled manifest (a byte-identical re-registration is a no-op, INV-7).
  const manifest = resolveLinkerManifest();
  await repo.registerFunctionality(`kip-linker:${manifest.name}`, manifest);

  // Enumerate every live node (ADR-B11b) and hydrate its props via the public getNode. `--include
  // <prefix>` (repeatable) REPLACES the default `code:`/`doc:` enumerated prefixes when given;
  // `--exclude <prefix>` (repeatable) then drops any node whose eid starts with an excluded prefix
  // (D-64: ADR-B11 declared these flags — they are now honored, not inert).
  const include = flagList(flags, "include");
  const exclude = flagList(flags, "exclude");
  const prefixes = include.length > 0 ? include : ["code:", "doc:"];
  const enumerated = await repo.nodeEids({ prefixes });
  const eids = exclude.length > 0 ? enumerated.filter((eid) => !exclude.some((p) => eid.startsWith(p))) : enumerated;
  const nodes: NodeInventory = [];
  for (const eid of eids) {
    // eslint-disable-next-line no-await-in-loop -- a bounded per-node read; order is already sorted.
    const view = await repo.getNode(eid);
    if (!view) continue; // raced/absent — the resolver never sees a node getNode cannot resolve (N5).
    const props: Array<{ key: string; value: PropValue }> = [];
    for (const [key, cell] of Object.entries(view.props ?? {})) {
      const seg = cell.segments?.find((s) => s.kind === "value");
      if (seg && seg.kind === "value") props.push({ key, value: seg.value });
    }
    nodes.push({ eid: view.eid, kind: view.kind, props });
  }

  // The resolver is PURE — compute the would-be links for the by-kind report/examples either way.
  const preview = linkResolver(nodes);
  const documents = preview.proposed.length;
  const sameAs = preview.sameAs?.length ?? 0;
  const docExamples = preview.proposed
    .slice(0, 5)
    .map((c) => {
      const t = c.target as { from: string; to: string };
      return `${t.from} --documents--> ${t.to}`;
    });
  const sameExamples = (preview.sameAs ?? []).slice(0, 5).map((p) => `${p.candidate} <-same_as-> ${p.existing}`);
  const examples = [...docExamples, ...sameExamples];

  if (flagBool(flags, "dry-run")) {
    if (json) emitJson(write, { facts: [], documents, same_as: sameAs, examples, dryRun: true });
    else write(renderLink(documents, sameAs, examples, true));
    return 0;
  }

  const { facts } = await repo.runAcquisition(manifest, { nodes }, {});
  if (json) emitJson(write, { facts, documents, same_as: sameAs, examples });
  else write(renderLink(documents, sameAs, examples, false));
  return 0;
}

/** The human render for `kip link` — counts by kind plus up to 5 examples per kind (ADR-B11). */
function renderLink(documents: number, sameAs: number, examples: string[], dryRun: boolean): string {
  let s = `${dryRun ? "would link" : "linked"}: documents: ${documents}, same_as: ${sameAs}\n`;
  for (const ex of examples) s += `  ${ex}\n`;
  return s;
}

/**
 * Resolve the bundled `kip-linker` `MicroagentManifest`, read from the CLI's bundled
 * `microagents/kip-linker/microagent.json` (mirrors `resolveCodeMinerManifest`). Throws (never
 * fabricates a manifest) if the bundle is incomplete.
 */
function resolveLinkerManifest(): MicroagentManifest {
  const p = join(__dirname, "microagents", "kip-linker", "microagent.json");
  if (!existsSync(p)) {
    throw new KipError(
      "ERR_UNREGISTERED_MANIFEST",
      "kip-linker manifest not found; the kip CLI bundle is incomplete",
    );
  }
  return JSON.parse(readFileSync(p, "utf8")) as MicroagentManifest;
}

// ===========================================================================
// learn (ADR-B10e) — turn a document into graph through the knowledge-autoencoding loop.
// ===========================================================================

/**
 * `kip learn <file> [--threshold] [--max-iterations] [--max-wall-ms] [--max-invocations]
 * [--raw-kind] [--as-of] [--model] [--json]` — store the document as a blob, register the four
 * bundled learn manifests, and run `learn()`.
 *
 * Honest reporting is the point (ADR-B10e): on `exhausted` the loop authored exactly ONE marker fact
 * and NO knowledge, so the render says so and the exit code is **5** — `kip learn` in a script must
 * never report success for a run that added nothing. An unmeasured loss prints `(none measured)`,
 * never `Infinity` (noise) and never `0` (a lie that reads as a perfect score).
 *
 * The outcome is NOT reproducible for a threshold near the model's variance: the loss is
 * model-graded and nondeterministic (ADR-B10c). That is stated, never hidden behind retries.
 */
async function cmdLearn(a: HandlerArgs): Promise<number> {
  const { flags, positionals, write, werr, json } = a;

  // ── USAGE VALIDATION OF `<file>` FIRST (round-3 finding #6). A missing/absent `<file>` is a USAGE
  // error (exit 2), and it must be REPORTED as one — not folded into the live-gate refusal below. The
  // round-2 ordering (gate first) meant `kip learn` with no file, or a typo'd path, on a machine
  // without `KIP_LEARN_LIVE` exited with the GATE's code and the GATE's message, hiding the real
  // (and more actionable) usage mistake behind an environment message. Presence + existence are
  // side-effect-free reads, so checking them before the gate still "costs nothing and changes
  // nothing" (ADR-B10f's refusal invariant) — no repo is opened, no document is blobbed. ────────────
  const file = positionals[1];
  if (!file) {
    werr("kip: learn requires a <file>\n");
    return 2;
  }
  const filePath = isAbsolute(file) ? file : join(a.ctx.cwd, file);
  if (!existsSync(filePath)) {
    werr(`kip: learn: no such file: ${filePath}\n`);
    return 2;
  }

  // ── THE OPT-IN GATE (ADR-B10f), with a DISTINCT exit code (round-3 finding #6) ───────────────────
  // `kip learn` is not one model call: it is up to `3 × maxIterations` spawns of the authenticated
  // local `claude` CLI, each with a multi-minute timeout — real, unbudgeted spend. The containment
  // ADR-B10f claims is only real if something ENFORCES it, so the gate is consulted here, before the
  // repo is opened, before the document is blobbed, and before any body can spawn anything. A refusal
  // costs nothing and changes nothing. Exit code 7 is the gate refusal's OWN code, distinct from the
  // usage-error 2 above: a script can now tell "you asked wrong" (2) from "the live path is disabled
  // in this environment" (7), which are different operator actions (fix the command vs. set the env).
  const gate = resolveLearnLiveGate({ env: a.ctx.env, probe: probeHarnessCli });
  if (!gate.enabled) {
    werr(`kip: learn: ${gate.reason ?? "the live kip learn path is disabled"}\n`);
    return 7;
  }

  let bytes: Buffer;
  try {
    bytes = readFileSync(filePath);
  } catch (e) {
    werr(`kip: learn: cannot read ${filePath}: ${e instanceof Error ? e.message : String(e)}\n`);
    return 2;
  }

  const numeric = (name: string, fallback: number): number | undefined => {
    const raw = flagStr(flags, name);
    if (raw === undefined) return fallback;
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) {
      werr(`kip: learn: --${name} must be a positive finite number, got ${JSON.stringify(raw)}\n`);
      return undefined;
    }
    return value;
  };
  const threshold = numeric("threshold", 0.25);
  const maxIterations = numeric("max-iterations", 5);
  const maxWallMs = numeric("max-wall-ms", 600_000);
  const maxInvocations = numeric("max-invocations", 30);
  if (
    threshold === undefined ||
    maxIterations === undefined ||
    maxWallMs === undefined ||
    maxInvocations === undefined
  ) {
    return 2;
  }
  const rawKind = flagStr(flags, "raw-kind") ?? inferRawKind(filePath);

  // ADR-B10's "mutable holder": the dispatcher needs the repo `open()` is still constructing. Open
  // with a dispatcher that READS the holder, then fill it before `learn()` is ever called.
  const holder: { repo?: Repo } = {};
  const learnDeps = {
    repo: {
      getBlob: async (ref: BlobRef) => requireOpenRepo(holder).getBlob(ref),
      putBlob: async (content: Uint8Array) => requireOpenRepo(holder).putBlob(content),
    },
    ...(flagStr(flags, "model") !== undefined ? { model: flagStr(flags, "model") } : {}),
    // ADR-B10b/B10e: the loss model's `missing`/`fabricated`/`rationale` are the loop's ONLY
    // fabrication signal. They are never persisted to a fact and never returned in-band (the loss
    // return value must stay a bare number, ADR-B10d trap 2) — they go here, to stderr, for the
    // operator, alongside the per-iteration loss line below.
    onDiagnostic: (d: LearnDiagnostic) => {
      if (d.missing.length > 0) werr(`  missing:    ${d.missing.join("; ")}\n`);
      if (d.fabricated.length > 0) werr(`  fabricated: ${d.fabricated.join("; ")}\n`);
      if (d.rationale !== undefined && d.rationale.length > 0) werr(`  rationale:  ${d.rationale}\n`);
    },
  };
  const learnDispatch = makeLearnDispatch(learnDeps);
  // Per-iteration progress goes to STDERR (spec §3/AC-31: `--json` stdout carries exactly ONE value).
  // The displayed number tracks the REAL loop iteration, not the number of loss calls: `learn()`
  // opens every iteration with exactly one candidate-producing dispatch (encode at iteration 0, the
  // learner on every later one), and an iteration whose candidate dispatch FAILS never reaches the
  // loss microagent. Counting loss calls therefore misnumbered every iteration after a failure
  // (a failed encode printed "iter 1: … failed" and the NEXT iteration also printed "iter 1/N");
  // counting the candidate dispatch is the loop's own iteration index.
  let iteration = 0;
  const dispatch: DispatchMicroagentFn = async (invocation) => {
    if (
      invocation.manifest.name === LEARN_MANIFEST_NAMES.encode ||
      invocation.manifest.name === LEARN_MANIFEST_NAMES.learner
    ) {
      iteration += 1;
    }
    const result = await learnDispatch(invocation);
    if (invocation.manifest.name === LEARN_MANIFEST_NAMES.loss) {
      const measured = result.exitCode === 0 && typeof result.output === "number" ? result.output : undefined;
      werr(
        `iter ${iteration}/${maxIterations}: ${measured === undefined ? "loss not measured (failed iteration)" : `loss ${measured}`}\n`,
      );
    } else if (result.exitCode !== 0) {
      const reason = (result.output as { error?: unknown } | null)?.error;
      werr(`iter ${iteration}: ${invocation.manifest.name} failed — ${String(reason ?? "no reason given")}\n`);
    }
    return result;
  };

  const openRepoWithLearn: OpenRepoFn = (o) => a.openRepo({ ...o, dispatchMicroagent: dispatch });
  const resolved = await resolveRepo(a.ctx, openRepoWithLearn, {
    requireInitialized: true,
    requireKeyring: true,
  });
  holder.repo = resolved.repo;
  const repo = resolved.repo;

  // Idempotently register all four (byte-identical re-registration is an INV-7 no-op) — MANDATORY
  // BEFORE `learn()`, which resolves all four and throws before any dispatch (INV-A13).
  const manifests = resolveLearnManifests();
  for (const manifest of Object.values(manifests)) {
    await repo.registerFunctionality(`kip-learn:${manifest.name}`, manifest);
  }

  const rawRef = await repo.putBlob(bytes);
  const asOfRaw = flagStr(flags, "as-of");
  const selector = (m: MicroagentManifest): { name: string; version: string } => ({
    name: m.name,
    version: m.version,
  });
  const result = await repo.learn(rawRef, {
    threshold,
    maxIterations,
    maxWallMs,
    maxInvocations,
    rawKind,
    encode: selector(manifests.encode),
    decode: selector(manifests.decode),
    learner: selector(manifests.learner),
    loss: selector(manifests.loss),
    ...(asOfRaw !== undefined ? { asOf: { validTime: asOfRaw } as AsOf } : {}),
  });

  const lossJson = Number.isFinite(result.loss) ? result.loss : null;
  if (json) {
    emitJson(write, {
      file: filePath,
      rawRef: { blob: rawRef.blob },
      status: result.status,
      loss: lossJson,
      facts: result.facts,
      // ROUND-3 FIX (MAJOR #5): the accepted reconstruction's fabrication indictment, now durable on
      // the audit fact AND surfaced here — `--json` was previously blind to the only fabrication
      // signal the loop computes.
      fabricated: result.fabricated,
    });
  } else {
    const lossText = lossJson === null ? "(none measured)" : String(lossJson);
    let out = `learned ${filePath} (blob ${rawRef.blob})\nstatus:   ${result.status}\n`;
    out +=
      result.status === "accept"
        ? `loss:     ${lossText} (threshold ${threshold} — met)\nfacts:    ${result.facts.length} committed\n`
        : `loss:     ${lossText} (threshold ${threshold} — NOT met)\n` +
          `facts:    ${result.facts.length} committed (a kip:learn-exhausted audit marker only — ` +
          "NO knowledge was added to the graph)\n";
    for (const id of result.facts) out += `  ${id}\n`;
    write(out);
  }
  // Exit 5 on `exhausted`: the loop ran honestly but never met the threshold.
  return result.status === "accept" ? 0 : 5;
}

function requireOpenRepo(holder: { repo?: Repo }): Repo {
  if (!holder.repo) {
    throw new KipError(
      "ERR_MALFORMED_INPUT",
      "kip learn: a microagent body was dispatched before the repo was open — refusing to guess",
    );
  }
  return holder.repo;
}

/** `--raw-kind`'s default, inferred ONCE from the extension and then threaded byte-identically into
 *  every decode call by `learn()` itself (INV-A14). Unknown extensions get `text/plain`, which is
 *  what an unrecognized text file demonstrably is — never a guessed richer type. */
function inferRawKind(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "text/markdown";
  if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html";
  if (lower.endsWith(".json")) return "application/json";
  return "text/plain";
}

/**
 * Resolve the bundled `code-miner` `MicroagentManifest`, read from the CLI's bundled
 * `microagents/code-miner/microagent.json` (mirrors `resolveQaManifest`). Throws (never fabricates a
 * manifest) if the bundle is incomplete.
 */
function resolveCodeMinerManifest(): MicroagentManifest {
  const p = join(__dirname, "microagents", "code-miner", "microagent.json");
  if (!existsSync(p)) {
    throw new KipError(
      "ERR_UNREGISTERED_MANIFEST",
      "code-miner manifest not found; the kip CLI bundle is incomplete",
    );
  }
  return JSON.parse(readFileSync(p, "utf8")) as MicroagentManifest;
}

// ===========================================================================
// Rendering helpers (spec §3, cont.).
// ===========================================================================

/** JSON mode: the ONLY thing on stdout is one canonical JSON value (spec §3, AC-31). */
function emitJson(write: Write, value: unknown): void {
  write(`${JSON.stringify(value)}\n`);
}

/** The `assert`/`retract` echo (spec §4.2/§4.3). Two truthful shapes, per the SDK method each form
 *  calls:
 *   - **Raw-fact form** (`assertFact`/`retractFact`, ONE fact): the full stamped envelope
 *     `{ id, hlc, seq, status }`.
 *   - **Node/edge sugar forms** (`putNode`/`putEdge`): these compile to MULTIPLE facts and return only
 *     the entity `EID` (docs/40), so there is no single stamped fact identity — the echo is
 *     `{ eid, status }`. The CLI never emits a null `id`/`hlc`/`seq` pretending to be a real stamp (N5).
 *  The human render therefore omits the `seq` clause when the echo carries no `seq`. */
function emitStampedEcho(write: Write, json: boolean, echo: Record<string, unknown>): void {
  if (json) {
    emitJson(write, echo);
    return;
  }
  const label = (echo.eid as string | undefined) ?? (echo.id as string | undefined) ?? "(fact)";
  const seqClause = echo.seq === undefined ? "" : `seq ${String(echo.seq)}, `;
  write(`asserted ${label} (${seqClause}${String(echo.status)})\n`);
}

function renderKipError(werr: Write, json: boolean, e: KipError): void {
  if (json) {
    const payload: { error: { code: string; message: string; context?: Record<string, unknown> } } = {
      error: { code: e.code, message: e.message },
    };
    if (e.context) payload.error.context = e.context;
    werr(`${JSON.stringify(payload)}\n`);
  } else {
    werr(`kip: ${e.code}: ${e.message}\n`);
  }
}

function humanView(view: NodeView | EdgeView | null | undefined, eid: string, asOf?: AsOf): string {
  if (view === null || view === undefined) return `(no such node) ${eid}\n`;
  let s = "";
  if (asOf) s += `as-of ${JSON.stringify(asOf)}\n`;
  s += `eid: ${view.eid}\nkind: ${view.kind}\n`;
  const edge = view as EdgeView;
  if (typeof edge.from === "string") s += `from: ${edge.from}\nto: ${edge.to}\n`;
  for (const [k, cell] of Object.entries(view.props ?? {})) {
    const seg = cell.segments?.[0];
    const val = seg && seg.kind === "value" ? seg.value : "(unknown)";
    s += `${k} = ${typeof val === "object" ? JSON.stringify(val) : String(val)}\n`;
  }
  s += `provenance: ${view.provenance?.author ?? "(none)"}\n`;
  return s;
}

function humanRecall(results: ReadonlyArray<{ eid: string; score: number; view: { kind: string }; conflicted: boolean }>): string {
  if (results.length === 0) return "(no results)\n";
  return results
    .map((r, i) => `#${i + 1} ${r.score} ${r.eid} ${r.view?.kind ?? ""}${r.conflicted ? " ⚠ conflicted" : ""}\n`)
    .join("");
}

function humanFsck(report: { ok: boolean }): string {
  return `fsck: ${report.ok ? "OK" : "FAILED"}\n${JSON.stringify(report, null, 2)}\n`;
}

/** True iff `dir` exists, is non-empty, and is NOT an initialized kip repo (spec §4.1 re-init guard). */
function isNonEmptyNonRepo(dir: string): boolean {
  try {
    if (isInitializedRepo(dir)) return false;
    return readdirSync(dir).length > 0;
  } catch {
    // Missing dir → not "non-empty"; the SDK's `open(createIfMissing)` will create it.
    return false;
  }
}

function humanAsk(r: AskResult): string {
  let s = r.answer ?? "No supporting facts in the knowledge graph.";
  s += "\n";
  if (r.citations.length) {
    s += "Sources:\n";
    for (const c of r.citations) s += `  - ${c.eid ?? c.factId ?? "(fact)"}\n`;
  }
  return s;
}

// ===========================================================================
// Value parsing helpers.
// ===========================================================================

function asOfFromFlag(flags: Record<string, FlagValue>): AsOf | undefined {
  const raw = flagStr(flags, "as-of");
  return raw !== undefined ? { validTime: raw } : undefined;
}

function asOfFromAsofCmd(flags: Record<string, FlagValue>): AsOf {
  const asOf: AsOf = {};
  const validTime = flagStr(flags, "valid-time");
  if (validTime !== undefined) asOf.validTime = validTime;
  const txTime = flagStr(flags, "tx-time");
  if (txTime !== undefined) asOf.txTime = parseHlcStamp(txTime, flagStr(flags, "replica") ?? "cli");
  const believer = flagStr(flags, "believer");
  if (believer !== undefined) asOf.believer = believer;
  return asOf;
}

function parseProps(entries: string[]): Record<string, PropValue> {
  const props: Record<string, PropValue> = {};
  for (const entry of entries) {
    const eq = entry.indexOf("=");
    if (eq < 0) {
      props[entry] = null;
      continue;
    }
    props[entry.slice(0, eq)] = parsePropValue(entry.slice(eq + 1));
  }
  return props;
}

function parsePropValue(raw: string): PropValue {
  if (raw.startsWith("@")) return { blob: raw.slice(1) };
  try {
    return JSON.parse(raw) as PropValue;
  } catch {
    return raw;
  }
}

function parseHlcOrTime(raw: string): HlcOrTime {
  const n = Number(raw);
  if (raw.trim() !== "" && !Number.isNaN(n)) return n;
  try {
    const o = JSON.parse(raw);
    if (o && typeof o === "object") return o as HlcStamp;
  } catch {
    /* fall through to raw string */
  }
  return raw;
}

function parseHlcStamp(raw: string, replicaId: string): HlcStamp {
  try {
    const o = JSON.parse(raw);
    if (o && typeof o === "object" && typeof (o as HlcStamp).wall === "number") return o as HlcStamp;
  } catch {
    /* not a JSON object */
  }
  const n = Number(raw);
  if (raw.trim() !== "" && !Number.isNaN(n)) return { wall: n, counter: 0, replicaId };
  throw new KipError("ERR_MALFORMED_INPUT", `invalid HLC stamp: ${raw}`);
}

function buildGenesis(flags: Record<string, FlagValue>): NonNullable<OpenOptions["genesis"]> {
  const genesisFile = flagStr(flags, "genesis-file");
  if (genesisFile) {
    return JSON.parse(readFileSync(genesisFile, "utf8")) as NonNullable<OpenOptions["genesis"]>;
  }
  const num = (name: string, dflt: number): number => {
    const v = flagStr(flags, name);
    return v !== undefined ? Number(v) : dflt;
  };
  const hashAlgo = (flagStr(flags, "hash-algo") as "sha1" | "sha256" | undefined) ?? "sha256";
  return {
    hashAlgo,
    shardDepth: num("shard-depth", 2),
    clockEpoch: num("clock-epoch", 0),
    epsilonCausalMs: num("epsilon-causal-ms", 0),
    regenBoundaryRule: "author-hlc-contiguous",
    rootKeys: flagList(flags, "root-key"),
    quarantineTtlMs: num("quarantine-ttl-ms", 0),
    quarantineKeyCapBytes: num("quarantine-key-cap-bytes", 0),
    quarantinePoolBytes: num("quarantine-pool-bytes", 0),
    keyChainDurableCapBytes: num("key-chain-durable-cap-bytes", 0),
    headsCommitted: flagBool(flags, "heads-committed") ? true : undefined,
  };
}

function readFactInput(a: HandlerArgs): unknown {
  const file = flagStr(a.flags, "file");
  if (file) {
    const path = isAbsolute(file) ? file : join(a.ctx.cwd, file);
    return JSON.parse(readFileSync(path, "utf8"));
  }
  if (flagBool(a.flags, "stdin")) {
    return JSON.parse(readFileSync(0, "utf8"));
  }
  throw new KipError("ERR_MALFORMED_INPUT", "assert/retract fact requires --file <path> or --stdin");
}

function readEmbedding(a: HandlerArgs): number[] | undefined {
  const file = flagStr(a.flags, "embedding-file");
  if (!file) return undefined;
  const path = isAbsolute(file) ? file : join(a.ctx.cwd, file);
  return JSON.parse(readFileSync(path, "utf8")) as number[];
}

async function drain<T>(it: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const v of it) out.push(v);
  return out;
}

function readVersion(): string {
  const pkg = JSON.parse(readFileSync(join(__dirname, "..", "..", "package.json"), "utf8")) as { version: string };
  return pkg.version;
}
