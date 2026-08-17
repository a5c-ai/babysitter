import { promises as fs } from "node:fs";
import path from "node:path";
import { appendRunCreatedEvent, initializeRun } from "./createRun";
import { classifyConvergentRun, type ConvergentRunClassification } from "./convergentRun/classify";
import {
  sha256,
  validateSha256,
  type CreateRunConvergentOptions,
  type CreateRunConvergentResult,
} from "./convergentRun/contracts";
import { ConvergentRunError } from "./convergentRun/errors";
import { completionResult, invokeFromProvenBoundary, publishBoundaryAndInvoke, reopenRunCreatedContext } from "./convergentRun/execution";
import { withRunLock } from "../storage/lock";
import type { CreateRunOptions, CreateRunResult } from "./types";

type PreparedRequest = {
  readonly inputs: unknown;
  readonly options: CreateRunConvergentOptions;
};

type LockedTransition = {
  readonly classification: ConvergentRunClassification;
  readonly request: PreparedRequest;
};

export { ConvergentRunError } from "./convergentRun/errors";

export async function createRunConvergent(options: CreateRunConvergentOptions): Promise<CreateRunConvergentResult> {
  const request = await prepareRequest(options);
  const classification = await classifyConvergentRun(request.options);
  switch (classification.kind) {
    case "ABSENT":
      return await createAbsentRun(request);
    case "PRE_JOURNAL_EXACT":
    case "JOURNALED_PRE_HOOK_PROVEN":
      return await withRunLock(
        path.join(request.options.runsDir, request.options.runId),
        request.options.lockOwner ?? "runtime:createRunConvergent",
        async () => await resolveLockedTransition({
          classification: await classifyConvergentRun(request.options),
          request,
        }),
      );
    case "JOURNALED_HOOK_FINALIZATION_UNKNOWN":
    case "CREATED_COMPLETE":
    case "COMPLETION_MARKER_DIVERGED":
    case "PARTIAL_UNKNOWN":
      return resolveTerminalClassification(classification);
    default:
      return assertNever(classification);
  }
}

async function prepareRequest(options: CreateRunConvergentOptions): Promise<PreparedRequest> {
  requireNonEmpty(options.runId, "runId");
  requireNonEmpty(options.request, "request");
  requireNonEmpty(options.process.processId, "process.processId");
  requireNonEmpty(options.replacementSessionId, "replacementSessionId");
  validateSha256(options.canonicalInputSha256, "canonicalInputSha256");
  validateSha256(options.processSnapshotHash, "processSnapshotHash");
  if (options.expectedRunJsonSha256 !== undefined) validateSha256(options.expectedRunJsonSha256, "expectedRunJsonSha256");
  const normalized = {
    ...options,
    inputsPath: path.resolve(options.inputsPath),
    process: {
      ...options.process,
      importPath: path.resolve(options.process.importPath),
    },
    processSnapshotPath: path.resolve(options.processSnapshotPath),
    runsDir: path.resolve(options.runsDir),
  };
  if (normalized.process.importPath !== normalized.processSnapshotPath) {
    throw new ConvergentRunError("RUN_CREATE_PARTIAL_INVALID", "process.importPath must equal processSnapshotPath");
  }
  const inputBytes = await fs.readFile(normalized.inputsPath);
  if (sha256(inputBytes) !== normalized.canonicalInputSha256) {
    throw new ConvergentRunError("RUN_CREATE_PARTIAL_INVALID", "inputsPath does not match canonicalInputSha256");
  }
  const inputs = parseCanonicalInputs(inputBytes);
  const processSnapshot = await fs.readFile(normalized.processSnapshotPath);
  if (sha256(processSnapshot) !== normalized.processSnapshotHash) {
    throw new ConvergentRunError("RUN_CREATE_PARTIAL_INVALID", "processSnapshotPath does not match processSnapshotHash");
  }
  return { inputs, options: normalized };
}

async function createAbsentRun(request: PreparedRequest): Promise<CreateRunConvergentResult> {
  const runDir = path.join(request.options.runsDir, request.options.runId);
  await fs.mkdir(request.options.runsDir, { recursive: true });
  try {
    await fs.mkdir(runDir);
  } catch (error) {
    if (isAlreadyExists(error)) return await createRunConvergent(request.options);
    throw error;
  }
  const runOptions = toCreateRunOptions(request);
  const result = await initializeRun(runOptions);
  return await withRunLock(
    result.runDir,
    request.options.lockOwner ?? "runtime:createRunConvergent",
    async () => {
      const event = await appendRunCreatedEvent({
        result,
        options: runOptions,
        sessionId: request.options.replacementSessionId,
      });
      return await publishBoundaryAndInvoke({
        context: await reopenRunCreatedContext({ event, result }),
        options: request.options,
        runOptions,
      });
    },
  );
}

async function resolveLockedTransition(transition: LockedTransition): Promise<CreateRunConvergentResult> {
  const { classification, request } = transition;
  switch (classification.kind) {
    case "PRE_JOURNAL_EXACT":
      if (request.options.expectedRunJsonSha256 === undefined) {
        throw new ConvergentRunError("RUN_CREATE_RESUME_UNSUPPORTED", "expectedRunJsonSha256 is required to resume a pre-journal run");
      }
      return await resumePreJournalRun({ classification, request });
    case "JOURNALED_PRE_HOOK_PROVEN":
      return await invokeFromProvenBoundary({
        context: classification.context,
        options: request.options,
        runOptions: toCreateRunOptions(request),
      });
    case "JOURNALED_HOOK_FINALIZATION_UNKNOWN":
      throw new ConvergentRunError("RUN_CREATE_HOOK_FINALIZATION_UNKNOWN", "on-run-start may have started without a valid completion marker");
    case "CREATED_COMPLETE":
      return completionResult(classification.context, classification.completion);
    case "COMPLETION_MARKER_DIVERGED":
      throw new ConvergentRunError("RUN_CREATE_COMPLETION_MARKER_DIVERGED", "completion marker diverges from the convergent creation inputs");
    case "PARTIAL_UNKNOWN":
      throw new ConvergentRunError("RUN_CREATE_PARTIAL_INVALID", "run directory does not match a convergent creation state");
    case "ABSENT":
      return await createAbsentRun(request);
    default:
      return assertNever(classification);
  }
}

function resolveTerminalClassification(
  classification: Exclude<ConvergentRunClassification, { readonly kind: "ABSENT" | "PRE_JOURNAL_EXACT" | "JOURNALED_PRE_HOOK_PROVEN" }>,
): CreateRunConvergentResult {
  switch (classification.kind) {
    case "JOURNALED_HOOK_FINALIZATION_UNKNOWN":
      throw new ConvergentRunError("RUN_CREATE_HOOK_FINALIZATION_UNKNOWN", "on-run-start may have started without a valid completion marker");
    case "CREATED_COMPLETE":
      return completionResult(classification.context, classification.completion);
    case "COMPLETION_MARKER_DIVERGED":
      throw new ConvergentRunError("RUN_CREATE_COMPLETION_MARKER_DIVERGED", "completion marker diverges from the convergent creation inputs");
    case "PARTIAL_UNKNOWN":
      throw new ConvergentRunError("RUN_CREATE_PARTIAL_INVALID", "run directory does not match a convergent creation state");
    default:
      return assertNever(classification);
  }
}

async function resumePreJournalRun(args: {
  readonly classification: Extract<ConvergentRunClassification, { readonly kind: "PRE_JOURNAL_EXACT" }>;
  readonly request: PreparedRequest;
}): Promise<CreateRunConvergentResult> {
  const { classification, request } = args;
  const result: CreateRunResult = {
    metadata: classification.metadata,
    runDir: classification.runDir,
    runId: request.options.runId,
  };
  const event = await appendRunCreatedEvent({
    result,
    options: toCreateRunOptions(request),
    sessionId: request.options.replacementSessionId,
  });
  return await publishBoundaryAndInvoke({
    context: await reopenRunCreatedContext({ event, result }),
    options: request.options,
    runOptions: toCreateRunOptions(request),
  });
}

function toCreateRunOptions(request: PreparedRequest): CreateRunOptions {
  return {
    harness: request.options.harness,
    inputs: request.inputs,
    lockOwner: request.options.lockOwner,
    logger: request.options.logger,
    process: request.options.process,
    processRevision: request.options.processRevision,
    prompt: request.options.prompt,
    request: request.options.request,
    runId: request.options.runId,
    runsDir: request.options.runsDir,
  };
}

function parseCanonicalInputs(bytes: Buffer): unknown {
  try {
    const inputs: unknown = JSON.parse(bytes.toString("utf8"));
    const canonicalBytes = Buffer.from(`${JSON.stringify(inputs, null, 2)}\n`, "utf8");
    if (!bytes.equals(canonicalBytes)) {
      throw new ConvergentRunError("RUN_CREATE_PARTIAL_INVALID", "inputsPath is not canonical JSON bytes");
    }
    return inputs;
  } catch (error) {
    if (error instanceof ConvergentRunError) throw error;
    if (error instanceof SyntaxError) {
      throw new ConvergentRunError("RUN_CREATE_PARTIAL_INVALID", "inputsPath must contain valid JSON");
    }
    throw error;
  }
}

function requireNonEmpty(value: string, label: string): void {
  if (value.trim() === "") throw new ConvergentRunError("RUN_CREATE_PARTIAL_INVALID", `${label} must be non-empty`);
}

function isAlreadyExists(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "EEXIST";
}

function assertNever(value: never): never {
  throw new ConvergentRunError("RUN_CREATE_PARTIAL_INVALID", `Unhandled convergent state: ${JSON.stringify(value)}`);
}
