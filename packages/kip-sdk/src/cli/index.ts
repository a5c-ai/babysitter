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
import { readFileSync, readdirSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { KipError, open } from "../index";
import type {
  AsOf,
  AssertInput,
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
import { defaultDispatchMicroagent, resolveQaManifest, runAsk } from "./ask";
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
  "commands: init, open, assert, retract, get, query, recall, asof, fsck, rollup, sync, ask\n";

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
    emitStampedEcho(write, json, { id: null, hlc: null, seq: null, status: "pending", eid: returnedEid });
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
    emitStampedEcho(write, json, { id: null, hlc: null, seq: null, status: "pending", eid: returnedEid });
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
// Rendering helpers (spec §3, cont.).
// ===========================================================================

/** JSON mode: the ONLY thing on stdout is one canonical JSON value (spec §3, AC-31). */
function emitJson(write: Write, value: unknown): void {
  write(`${JSON.stringify(value)}\n`);
}

/** The `assert`/`retract` stamped-echo shape (spec §4.2/§4.3). `putNode`/`putEdge` return only an
 *  `EID`, so `id`/`hlc`/`seq` are `null` on those forms (see this work item's `disputes`). */
function emitStampedEcho(write: Write, json: boolean, echo: Record<string, unknown>): void {
  if (json) {
    emitJson(write, echo);
    return;
  }
  const label = (echo.eid as string | undefined) ?? (echo.id as string | undefined) ?? "(fact)";
  write(`asserted ${label} (seq ${String(echo.seq)}, ${String(echo.status)})\n`);
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
