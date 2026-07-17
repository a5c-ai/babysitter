/**
 * `kip ask` — the read-only graph-QA microagent dispatch seam (spec §4.11, §5; kip-graph-qa.md).
 *
 * `ask` runs the graph-QA microagent — a read-only genty microagent — turning an NL question into an
 * NL answer grounded in kip reads. It authors NOTHING (INV-A1): the handler resolves a `Repo` (to
 * bind the read-only tools + pass `repoDir`), dispatches the QA manifest via the genty seam, and maps
 * a clean result to the §4.11 stdout shape. Any dispatch failure maps to exit 5 (N5 — never
 * fabricates an answer, never authors a fact).
 *
 * SCOPE BOUNDARY (spec §1, AC-1): the DEFAULT dispatcher links the genty layers ONLY. It resolves
 * `createMicroagentSystem` from `@a5c-ai/genty-platform` at call time; no `@a5c-ai/babysitter-sdk` is
 * ever on this path.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  AsOf,
  DispatchMicroagentFn,
  MicroagentInvocation,
  MicroagentManifest,
  MicroagentResult,
  ScopeRef,
} from "../index";
import { KipError, open } from "../index";
import { answerQuestion } from "../graph-qa";
import type { Synthesize, SynthesisOutput } from "../graph-qa";

/** The genty-platform module specifier (spec §1/§5) — the documented seam a deploying host uses to
 *  own `runtime.model`. Held as a string constant (never a compile-time dependency: genty is a
 *  workspace sibling, not a package.json dep of this SDK). This literal is also the AC-1 conformance
 *  anchor: the CLI path references `@a5c-ai/genty`, never `@a5c-ai/babysitter-sdk`. */
const GENTY_PLATFORM_MODULE = "@a5c-ai/genty-platform";

/**
 * A graph-QA synthesis DISPATCH failure (kip-graph-qa.md §6.6): the retrieval/citation/abstention/
 * read-only pipeline ran, but the model-synthesis step could not run (no host model synthesizer is
 * bound). It is emphatically NOT a caller-input rejection (`ERR_MALFORMED_INPUT`); {@link runAsk} and
 * the MCP `kip_ask` handler map it to the exit-5 / `ERR_ASK_DISPATCH_FAILED` channel, never exit-1
 * malformed, and never a fabricated answer (N5).
 */
export class AskSynthesisUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AskSynthesisUnavailableError";
  }
}

/** The graph-QA output contract (kip-graph-qa.md §2 `outputSchema`). */
interface QaOutput {
  answer: string;
  abstained?: boolean;
  citations?: Array<{ factId: string; eid?: string; prop?: string; edgeKind?: string; quote?: string }>;
  usedFacts?: string[];
}

/** The §4.11 stdout shape. */
export interface AskResult {
  answer: string | null;
  status: "answered" | "unanswerable";
  citations: Array<{ eid?: string; factId?: string }>;
  model: string | undefined;
  asOf?: AsOf;
}

/**
 * The production SYNTHESIS seam (kip-graph-qa.md §3.3/§5) — the SINGLE accelerator-class step. Given
 * the assembled READ-ONLY context (`{ question, facts }`, each fact bound to its signed `factId`), a
 * model would write the prose answer + per-claim `factId` citations DRAWN ONLY FROM the supplied
 * facts, and `answerQuestion` then binds/validates every returned citation against `usedFacts` (§3.4).
 *
 * HONEST BOUNDARY (round-2 finding #1). This SDK ships the ENTIRE read-only pipeline in-process
 * (`answerQuestion`: recall → bounded expand → hydrate → per-datum `FactId` binding → abstain-on-empty
 * → citation validation) PLUS the documented `synthesize` INJECTION SEAM — but it ships NO model call,
 * because genty (the workspace sibling `@a5c-ai/genty-platform`, the documented seam host) exposes NO
 * in-process one-shot completion API for the SDK to call: genty's model invocation is its harness /
 * subprocess-microagent runtime, which owns `runtime.model` out-of-process. So a deploying host that
 * wants `kip ask` / `kip_ask` to produce PROSE must supply the model synthesizer — by injecting a
 * `synthesize` into `answerQuestion` (the seam the unit suite uses), or by dispatching the
 * `kip-graph-qa` manifest through a genty subprocess entrypoint that owns `runtime.model`.
 *
 * The production default binds NO such synthesizer. Rather than pretend (a phantom completion export)
 * or fabricate from parametric knowledge (N5, "fallbacks are evil"), it fails LOUD via the
 * DISPATCH-failure channel ({@link AskSynthesisUnavailableError}) — mapped upstream to CLI exit 5 /
 * MCP `ERR_ASK_DISPATCH_FAILED` (§6.6), NEVER `ERR_MALFORMED_INPUT` and NEVER an answer. The
 * substrate-faithful half (retrieval, citation binding, abstention, INV-A1 read-only) is fully real
 * and unit-tested regardless: a production `ask` genuinely retrieves and genuinely ABSTAINS when the
 * graph is silent (exit 0), and only the prose-answer path requires the host-supplied model.
 */
function gentyModelSynthesize(model: string | undefined, timeoutMs: number | undefined): Synthesize {
  return (_ctx) => {
    void model;
    void timeoutMs;
    throw new AskSynthesisUnavailableError(
      "graph-QA synthesis: no in-process model synthesizer is bound. The kip SDK ships the full " +
        "read-only retrieval/citation/abstention pipeline plus a documented `synthesize` injection " +
        "seam, but it ships NO model call — the model runtime is the deploying host's genty runtime " +
        `(${GENTY_PLATFORM_MODULE}), which exposes no in-process one-shot completion the SDK can call. ` +
        "Supply the model by injecting a `synthesize` into `answerQuestion`, or by dispatching the " +
        "kip-graph-qa manifest through a genty subprocess entrypoint that owns `runtime.model`. " +
        "Refusing to fabricate an answer (N5).",
    );
  };
}

// ────────────────────────────────────────────────────────────────────────────────────────────────
// ADR-B8 — the PRODUCTION synthesis seam: spawn the already-authenticated `claude` CLI via
// `node:child_process` (a Node BUILTIN — kip-sdk's dep set stays exactly `{isomorphic-git}`, the
// lockfile is untouched, and no `@a5c-ai/babysitter-sdk` / genty / adapters module is imported, so
// the AC-1 boundary and the string-specifier seam at the top of this file both survive).
//
// STATUS: the declarations below are the FROZEN CONTRACT (types + signatures) that
// `src/__tests__/graph-qa-live.test.ts` pins; the bodies are UNIMPLEMENTED throwing stubs this round
// (the established frozen-test convention — see `graph-qa.test.ts` / `kip-cli.test.ts` headers), so
// every test fails on a real ASSERTION, never on a type/import error. Implementation lands next
// round and rebinds {@link defaultDispatchMicroagent} from {@link gentyModelSynthesize} to
// {@link harnessCliSynthesize}; nothing on the existing path changes until then.
// ────────────────────────────────────────────────────────────────────────────────────────────────

/** The observed result of ONE harness-CLI process run (ADR-B8: `exitCode` is HALF the success gate). */
export interface HarnessCliRun {
  /** The child's exit code. Non-zero ⇒ dispatch failure, whatever the envelope claims. */
  exitCode: number;
  /** The child's raw stdout — a single `--output-format json` result envelope when the call worked. */
  stdout: string;
  /** The child's raw stderr (diagnostics only; never parsed as an answer). */
  stderr?: string;
}

/**
 * The ONE spawn the production synthesizer issues (ADR-B8's verified invocation contract). Injected
 * as {@link HarnessCliRunner} so the argv/stdin/cwd/timeout contract is assertable with ZERO spend and
 * zero machine dependence.
 */
export interface HarnessCliRequest {
  /** The harness binary (the `claude` on PATH — `claude-adapter.ts:42`'s `cliCommand = this.agent`). */
  command: string;
  /** The flags ONLY. The fact context MUST NOT appear here (Windows caps argv at ~32k). */
  args: string[];
  /** The rendered `{ question, facts }` context — STDIN, never argv (ADR-B8 prompt transport). */
  stdin: string;
  /** `os.tmpdir()` — never `repoDir` (no `CLAUDE.md` auto-discovery, no cwd-relative reach). */
  cwd: string;
  /** The effective per-call timeout (ADR-B8 flags the bundled 30s as too tight). */
  timeoutMs: number;
}

/** Runs one {@link HarnessCliRequest}. The default spawns via `node:child_process`; tests inject. */
export type HarnessCliRunner = (req: HarnessCliRequest) => Promise<HarnessCliRun>;

/**
 * The AVAILABILITY probe result (ADR-B8 testability). `available: false` carries the human REASON a
 * live test reports through `ctx.skip(reason)` — never a silent pass, and never a fabricated answer.
 */
export type HarnessCliProbe = { available: true } | { available: false; reason: string };

/** Injection seams for {@link probeHarnessCli} — both real probes are unpaid and spend nothing. */
export interface HarnessCliProbeDeps {
  /** Exit code of `claude --version` (0 ⇒ the binary is on PATH). Non-zero on ENOENT. */
  probeVersion?: () => number;
  /** Defaults to `process.env` — read for `ANTHROPIC_API_KEY`. */
  env?: NodeJS.ProcessEnv;
  /** Defaults to `existsSync(join(homedir(), ".claude", ".credentials.json"))` — the adapters'
   *  own `authFiles` pattern (`claude-agent-sdk-adapter.ts:189`/`:483`). */
  credentialsExist?: () => boolean;
}

/**
 * Probe whether the local harness CLI can serve a live synthesis: the binary answers `--version` at
 * exit 0 AND a credential is present (`ANTHROPIC_API_KEY` or `~/.claude/.credentials.json`).
 *
 * HONEST BOUNDARY (ADR-B8): the credential check proves credentials EXIST, not that they are VALID —
 * an expired token still leaves the file on disk. That asymmetry is deliberate and drives the
 * load-bearing rule: **the probe decides SKIP; everything after the probe decides PASS/FAIL.**
 */
export function probeHarnessCli(deps?: HarnessCliProbeDeps): HarnessCliProbe {
  void deps;
  throw new Error(
    "unimplemented: probeHarnessCli — ADR-B8 (probe `claude --version` exit 0 + ANTHROPIC_API_KEY or " +
      "~/.claude/.credentials.json)",
  );
}

/**
 * Map the effective `runtime.model` to a concrete harness model id (ADR-B8 "MODEL ALIAS MISMATCH").
 * The bundled manifest ships the SENTINEL `"kip-graph-qa-default"` (`microagent.json:59`), which is
 * NOT a claude model id — passing it to `--model` would fail. An explicit `--model` override
 * (`runAsk`'s `effectiveModel`) passes through untouched.
 */
export function resolveHarnessModel(model: string | undefined): string {
  void model;
  throw new Error("unimplemented: resolveHarnessModel — ADR-B8 (map the `kip-graph-qa-default` sentinel)");
}

/**
 * Parse one harness-CLI run into a {@link SynthesisOutput} — the TWO-STAGE parse and the critical
 * SAFETY GATE (ADR-B8):
 *
 *   1. `JSON.parse(stdout)` → the result envelope;
 *   2. **gate on `exitCode === 0 && is_error === false`** — *** NEVER on `env.subtype` ***: the
 *      verified auth-failure envelope is `{"subtype":"success","is_error":true,"result":"Not logged
 *      in · Please run /login"}`, i.e. subtype claims success while `is_error` is true. Gating on
 *      `subtype` would hand that string to the citation filter and emit it AS AN ANSWER with zero
 *      citations — precisely the N5 fabrication this design exists to prevent;
 *   3. `JSON.parse(env.result)` — `result` is a JSON *string*, not an object;
 *   4. validate `{ answer: string, citations: Array<{ factId: string }> }`.
 *
 * ANY deviation throws {@link AskSynthesisUnavailableError} (→ exit 5 / `ERR_ASK_DISPATCH_FAILED`).
 * It NEVER coerces, and it NEVER surfaces an error string as prose.
 */
export function parseHarnessCliResult(run: HarnessCliRun): SynthesisOutput {
  void run;
  throw new Error(
    "unimplemented: parseHarnessCliResult — ADR-B8 (two-stage parse; gate on exitCode + is_error, " +
      "NEVER subtype)",
  );
}

/** Construction options for {@link harnessCliSynthesize}. `run`/`probe` are test-injection seams. */
export interface HarnessCliSynthesizeOptions {
  /** The effective `runtime.model` (`runAsk`'s `effectiveModel`), mapped by {@link resolveHarnessModel}. */
  model?: string;
  /** The effective per-call timeout; absent ⇒ the ADR-B8 default (the bundled 30s is too tight). */
  timeoutMs?: number;
  /** Defaults to a `node:child_process` spawn of the {@link HarnessCliRequest}. */
  run?: HarnessCliRunner;
  /** Defaults to {@link probeHarnessCli} with real deps. */
  probe?: () => HarnessCliProbe;
}

/**
 * The PRODUCTION `Synthesize` (ADR-B8) — take the CONTRACT, not the dependency. Renders the READ-ONLY
 * `{ question, facts }` context, spawns the authenticated `claude` CLI (prompt on STDIN, `cwd =
 * os.tmpdir()`, `--disallowedTools`), and returns the parsed `{ answer, citations }`.
 *
 * Safety is STRUCTURAL, not promised: it is handed only `{ question, facts }` and never the `Repo`
 * (INV-A1 by construction — the model physically cannot write); `answerQuestion` never calls it on
 * empty retrieval (no model spend on a silent graph); and every citation it returns is filtered
 * against `usedFacts` before it can surface. When the binary is absent or unauthenticated — or ANY
 * step of the contract deviates — it degrades to the EXISTING loud failure
 * ({@link AskSynthesisUnavailableError} → exit 5), never to a guess (N5).
 */
export function harnessCliSynthesize(options?: HarnessCliSynthesizeOptions): Synthesize {
  return (_ctx) => {
    void options;
    throw new Error(
      "unimplemented: harnessCliSynthesize — ADR-B8 (spawn the authenticated `claude` CLI via " +
        "node:child_process; prompt on stdin, cwd=os.tmpdir())",
    );
  };
}

/**
 * The DEFAULT dispatcher (real CLI / MCP) — the PRODUCTION graph-QA entrypoint (kip-graph-qa.md
 * §1/§3/§7). It opens the repo named by `input.repoDir` READ-ONLY and calls the fully-real,
 * unit-tested {@link answerQuestion} retrieval→synthesis core with a genty-model `synthesize`
 * ({@link gentyModelSynthesize}). It authors NOTHING (INV-A1): a read-only `open` + `answerQuestion`,
 * which touches only the kip read seams. Abstention is DATA (exit 0); a model/read failure surfaces as
 * a non-zero `exitCode` (mapped to exit 5 upstream, N5 — no fabricated answer). The frozen CLI/MCP
 * suites always inject a scripted `DispatchMicroagentFn`, so THIS path runs only in real use.
 */
export const defaultDispatchMicroagent: DispatchMicroagentFn = async (
  invocation: MicroagentInvocation,
): Promise<MicroagentResult> => {
  const started = Date.now();
  const input = (invocation.input ?? {}) as {
    question?: unknown;
    asOf?: AsOf;
    scope?: ScopeRef;
    repoDir?: unknown;
    model?: unknown;
  };
  // Round-2 finding #6: a missing/empty `question` is a CALLER-INPUT rejection — the THROW channel the
  // core enforces (kip-graph-qa.md §6.5), NEVER an abstention (a domain OUTCOME, never an error signal).
  if (typeof input.question !== "string" || input.question.trim().length === 0) {
    throw new KipError(
      "ERR_MALFORMED_INPUT",
      "graph-QA: a non-empty `question` is required (kip-graph-qa.md §2 inputSchema)",
    );
  }
  // `repoDir` is runtime WIRING the call site injects (never caller input). Its absence is a
  // dispatch/wiring failure (§6.6), surfaced as a non-zero exitCode → exit 5 upstream, never abstain.
  if (typeof input.repoDir !== "string") {
    return {
      exitCode: 1,
      output: { answer: "", abstained: false, citations: [], usedFacts: [] },
      elapsedMs: Date.now() - started,
    };
  }
  // READ-ONLY open (spec §2: reads verify signatures, they do not sign — no keyring required).
  const repo = await open({ dir: input.repoDir, replicaId: "kip-ask-reader", keyring: {}, createIfMissing: false });
  try {
    const model = typeof input.model === "string" ? input.model : undefined;
    const result = await answerQuestion(
      { question: input.question, asOf: input.asOf, scope: input.scope },
      { repo, synthesize: gentyModelSynthesize(model, invocation.timeout) },
    );
    return {
      exitCode: 0,
      output: {
        answer: result.answer,
        abstained: result.abstained,
        citations: result.citations,
        usedFacts: result.usedFacts,
      },
      elapsedMs: Date.now() - started,
    };
  } catch (e) {
    // A caller-input rejection (missing/empty question reaching the core) stays on the THROW channel
    // (→ exit 1). Any OTHER throw — a synthesis/model-dispatch or read failure (§6.6) — is surfaced as
    // a non-zero-exitCode `MicroagentResult` so runAsk / kip_ask map it to exit 5 /
    // `ERR_ASK_DISPATCH_FAILED`, never a fabricated answer (N5) and never exit-1/malformed.
    if (e instanceof KipError && e.code === "ERR_MALFORMED_INPUT") throw e;
    return {
      exitCode: 1,
      output: { answer: "", abstained: false, citations: [], usedFacts: [] },
      elapsedMs: Date.now() - started,
    };
  } finally {
    repo.close();
  }
};

/**
 * Resolve the bundled graph-QA `MicroagentManifest` (spec §5.3). Read from the CLI's bundled
 * `microagents/graph-qa/microagent.json` when no manifest is injected — the standalone binary carries
 * its own QA manifest. Throws (never fabricates a manifest) if the bundle is missing.
 */
export function resolveQaManifest(injected: MicroagentManifest | undefined): MicroagentManifest {
  if (injected) return injected;
  const path = join(__dirname, "microagents", "graph-qa", "microagent.json");
  if (!existsSync(path)) {
    throw new KipError(
      "ERR_UNREGISTERED_MANIFEST",
      "graph-QA manifest not found; the kip CLI bundle is incomplete",
    );
  }
  return JSON.parse(readFileSync(path, "utf8")) as MicroagentManifest;
}

/** Validate the graph-QA output shape (kip-graph-qa.md §2 `outputSchema`: required `answer`(string)
 *  / `citations`(array) / `usedFacts`(array)). A malformed object is a dispatch failure (exit 5). */
function isValidQaOutput(output: unknown): output is QaOutput {
  if (!output || typeof output !== "object") return false;
  const o = output as Record<string, unknown>;
  return (
    typeof o.answer === "string" &&
    Array.isArray(o.citations) &&
    Array.isArray(o.usedFacts)
  );
}

export interface AskDispatchInput {
  question: string;
  manifest: MicroagentManifest;
  /** `--manifest name@version` selector (advanced), or `undefined`. */
  manifestSelector?: string;
  model?: string;
  timeoutMs?: number;
  k?: number;
  asOf?: AsOf;
  scope?: ScopeRef;
  repoDir: string;
  dispatch: DispatchMicroagentFn;
}

/** The result of an `ask` dispatch: either a mapped §4.11 payload (exit 0) or a dispatch failure
 *  (exit 5, N5 — no answer emitted). */
export type AskOutcome =
  | { kind: "ok"; result: AskResult }
  | { kind: "dispatch-failure"; message: string };

/**
 * Run one graph-QA dispatch. Resolves the effective manifest (validating a `--manifest` selector →
 * `ERR_UNREGISTERED_MANIFEST` on a mismatch, before any dispatch), clones it with the `--model`
 * override (spec §5.3), builds the `MicroagentInvocation`, dispatches, and maps the result. Throws a
 * `KipError` on caller-input rejection (empty question / unknown manifest → exit 1).
 */
export async function runAsk(input: AskDispatchInput): Promise<AskOutcome> {
  if (!input.question || input.question.trim().length === 0) {
    throw new KipError("ERR_MALFORMED_INPUT", "ask: a non-empty question is required");
  }

  // `--manifest name@version` — select a non-default QA manifest by registered (name,version).
  if (input.manifestSelector !== undefined) {
    const at = input.manifestSelector.lastIndexOf("@");
    const selName = at >= 0 ? input.manifestSelector.slice(0, at) : input.manifestSelector;
    const selVersion = at >= 0 ? input.manifestSelector.slice(at + 1) : undefined;
    if (selName !== input.manifest.name || (selVersion && selVersion !== input.manifest.version)) {
      throw new KipError(
        "ERR_UNREGISTERED_MANIFEST",
        `no registered QA manifest matches '${input.manifestSelector}'`,
        { requested: input.manifestSelector, registered: `${input.manifest.name}@${input.manifest.version}` },
      );
    }
  }

  const effectiveModel = input.model ?? input.manifest.runtime.model;
  const effectiveTimeout = input.timeoutMs ?? input.manifest.runtime.timeout;

  // Clone the manifest with runtime.model := --model (spec §5.3), so the dispatched manifest carries
  // the override the stdout `model` field echoes.
  const dispatchedManifest: MicroagentManifest = {
    ...input.manifest,
    runtime: { ...input.manifest.runtime, model: effectiveModel },
  };

  const invocationInput: Record<string, unknown> = {
    question: input.question,
    repoDir: input.repoDir,
    // The effective synthesis model (spec §5.3) — carried on the invocation input so the production
    // in-process dispatcher can bind it into the genty-model `synthesize` seam (kip-graph-qa.md §3.3).
    model: effectiveModel,
  };
  if (input.asOf) invocationInput.asOf = input.asOf;
  if (input.scope) invocationInput.scope = input.scope;
  if (input.k !== undefined) invocationInput.k = input.k;

  const invocation: MicroagentInvocation = {
    id: `kip-ask-${Date.now()}`,
    manifest: { name: dispatchedManifest.name, version: dispatchedManifest.version },
    input: invocationInput,
    timeout: effectiveTimeout,
  };

  // A dispatch that THROWS (e.g. the production synthesizer failing loud because no host model is
  // bound — round-2 finding #1/§6.6) is a DISPATCH failure → exit 5, NOT exit-1/malformed. A genuine
  // caller-input rejection (`ERR_MALFORMED_INPUT`) stays on its own throw channel (exit 1), preserving
  // the two-channel model.
  let result: MicroagentResult;
  try {
    result = await input.dispatch(invocation);
  } catch (e) {
    if (e instanceof KipError && e.code === "ERR_MALFORMED_INPUT") throw e;
    return {
      kind: "dispatch-failure",
      message: `graph-QA dispatch failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // Dispatch-failure detection (spec §4.11 / §5, N5): non-zero exit, timeout overrun, or
  // schema-invalid output ⇒ exit 5, NO fabricated answer, NOTHING authored.
  if (result.exitCode !== 0) {
    return { kind: "dispatch-failure", message: `graph-QA dispatch failed (exitCode ${result.exitCode})` };
  }
  if (
    effectiveTimeout !== undefined &&
    result.elapsedMs !== undefined &&
    result.elapsedMs > effectiveTimeout
  ) {
    return {
      kind: "dispatch-failure",
      message: `graph-QA dispatch timed out (${result.elapsedMs}ms > ${effectiveTimeout}ms)`,
    };
  }
  if (!isValidQaOutput(result.output)) {
    return { kind: "dispatch-failure", message: "graph-QA output failed schema validation" };
  }

  const output = result.output;
  const abstained = output.abstained === true || !output.answer || output.answer.length === 0;

  const mapped: AskResult = abstained
    ? { answer: null, status: "unanswerable", citations: [], model: effectiveModel }
    : {
        answer: output.answer,
        status: "answered",
        citations: (output.citations ?? []).map((c) => ({ eid: c.eid, factId: c.factId })),
        model: effectiveModel,
      };
  if (input.asOf) mapped.asOf = input.asOf;

  return { kind: "ok", result: mapped };
}
