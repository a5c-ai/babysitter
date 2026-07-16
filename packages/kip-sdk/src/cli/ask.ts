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
import type { Synthesize } from "../graph-qa";

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
