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
} from "../index";
import { KipError } from "../index";

/** The genty-platform module specifier (spec §1/§5). Held as a string constant so the default
 *  dispatcher can `import()` it at runtime WITHOUT declaring a compile-time dependency (the closure
 *  the standalone binary carries; genty is a workspace sibling, not a package.json dep of this SDK).
 *  This literal is also the AC-1 conformance anchor: the CLI path references `@a5c-ai/genty`, never
 *  `@a5c-ai/babysitter-sdk`. */
const GENTY_PLATFORM_MODULE = "@a5c-ai/genty-platform";

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
 * The DEFAULT dispatcher (real CLI): a thin adapter over
 * `createMicroagentSystem(...).dispatcher.dispatch` from `@a5c-ai/genty-platform` (spec §5.1). The
 * frozen suite always injects a scripted `DispatchMicroagentFn`, so this path is exercised only in
 * real use.
 */
export const defaultDispatchMicroagent: DispatchMicroagentFn = async (
  invocation: MicroagentInvocation,
): Promise<MicroagentResult> => {
  const manifestDir = join(__dirname, "microagents", "graph-qa");
  // eslint-disable-next-line @typescript-eslint/no-var-requires -- dynamic, dependency-free link
  const platform = (await import(GENTY_PLATFORM_MODULE)) as {
    createMicroagentSystem: (opts?: { discoveryDirs?: string[] }) => {
      dispatcher: {
        dispatch: (
          name: string,
          input: unknown,
          opts?: { timeout?: number },
        ) => Promise<MicroagentResult>;
      };
    };
  };
  const system = platform.createMicroagentSystem({ discoveryDirs: [manifestDir] });
  const started = Date.now();
  const result = await system.dispatcher.dispatch(invocation.manifest.name, invocation.input, {
    timeout: invocation.timeout,
  });
  const elapsedMs = result.elapsedMs ?? Date.now() - started;
  return { exitCode: result.exitCode, output: result.output, elapsedMs };
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
  };
  if (input.asOf) invocationInput.asOf = input.asOf;
  if (input.k !== undefined) invocationInput.k = input.k;

  const invocation: MicroagentInvocation = {
    id: `kip-ask-${Date.now()}`,
    manifest: { name: dispatchedManifest.name, version: dispatchedManifest.version },
    input: invocationInput,
    timeout: effectiveTimeout,
  };

  const result = await input.dispatch(invocation);

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
