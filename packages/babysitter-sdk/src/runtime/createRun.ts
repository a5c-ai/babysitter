import path from "path";
import crypto from "crypto";
import { createRunDir } from "../storage/createRunDir";
import { appendEvent } from "../storage/journal";
import { acquireRunLock, releaseRunLock } from "../storage/lock";
import { INPUTS_FILE, getRunDir } from "../storage/paths";
import { RunEntrypointMetadata, type JournalEvent } from "../storage/types";
import { nextUlid } from "../storage/ulids";
import type { CreateRunOptions, CreateRunResult } from "./types";
import { callRuntimeHook } from "./hooks/runtime";
import { validateAgainstSchema } from "./schemaValidator";
import { BabysitterRuntimeError } from "./exceptions";
import { resolveProjectRootForRun, resolveRunsDir } from "../config";
import { hashProcessCodeFile } from "./processCodeHash";

export async function createRun(options: CreateRunOptions): Promise<CreateRunResult> {
  const result = await initializeRun(options);
  let lockAcquired = false;
  try {
    await acquireRunLock(result.runDir, options.lockOwner ?? "runtime:createRun");
    lockAcquired = true;
    await appendRunCreatedEvent({ result, options });
  } finally {
    if (lockAcquired) {
      await releaseRunLock(result.runDir);
    }
  }

  await invokeRunStartHook({ result, options });

  return result;
}

export async function initializeRun(options: CreateRunOptions): Promise<CreateRunResult> {
  const runId = options.runId ?? nextUlid();
  validateRunId(runId);
  const runsDir = path.resolve(options.runsDir ?? resolveRunsDir());
  const runDir = getRunDir(runsDir, runId);
  const normalizedEntrypoint = options.process
    ? normalizeEntrypoint(runDir, options.process.importPath, options.process.exportName)
    : { importPath: "bare-run", exportName: undefined };
  const requestId = options.request ?? options.process?.processId ?? runId;
  const providedProof =
    typeof options.metadata?.completionProof === "string" ? options.metadata.completionProof : undefined;
  const completionProof = providedProof ?? crypto.randomBytes(16).toString("hex");
  const nestedMetadata = options.nested
    ? {
        parentRunId: options.nested.parentRunId,
        ...(options.nested.parentEffectId ? { parentEffectId: options.nested.parentEffectId } : {}),
        ...(options.nested.parentInvocationKey ? { parentInvocationKey: options.nested.parentInvocationKey } : {}),
        ...(options.nested.sessionId ? { sessionId: options.nested.sessionId } : {}),
        ...(options.nested.shareSession !== undefined ? { shareSession: options.nested.shareSession } : {}),
      }
    : undefined;
  // Validate inputs against inputSchema if both are provided
  if (options.inputSchema && options.inputs !== undefined) {
    const validation = validateAgainstSchema(options.inputs, options.inputSchema);
    if (!validation.valid) {
      throw new BabysitterRuntimeError(
        "InputValidationError",
        `Input validation failed against inputSchema: ${validation.errors.join("; ")}`,
      );
    }
  }

  const extraMetadata = {
    ...options.metadata,
    ...(options.governance ? { governance: options.governance } : {}),
    ...(options.process ? { processCodeHash: await hashProcessCodeFile(options.process.importPath) } : {}),
    completionProof,
  };
  const { metadata } = await createRunDir({
    runsRoot: runsDir,
    runId,
    request: requestId,
    processId: options.process?.processId ?? "bare-run",
    harness: options.harness,
    nested: nestedMetadata,
    processRevision: options.processRevision,
    layoutVersion: options.layoutVersion,
    inputs: options.inputs,
    entrypoint: normalizedEntrypoint,
    processPath: normalizedEntrypoint.importPath,
    extraMetadata,
    prompt: options.prompt,
    inputSchema: options.inputSchema,
    outputSchema: options.outputSchema,
  });

  return {
    runId,
    runDir,
    metadata,
  };
}

export type AppendRunCreatedEventArgs = {
  readonly result: CreateRunResult;
  readonly options: CreateRunOptions;
  readonly sessionId?: string;
};

export async function appendRunCreatedEvent(args: AppendRunCreatedEventArgs): Promise<JournalEvent> {
  const { result, options, sessionId } = args;
  const eventPayload: Record<string, unknown> = {
    runId: result.runId,
    processId: result.metadata.processId,
    entrypoint: result.metadata.entrypoint,
  };
  if (result.metadata.harness) eventPayload.harness = result.metadata.harness;
  if (result.metadata.nested) eventPayload.nested = result.metadata.nested;
  if (result.metadata.processRevision) eventPayload.processRevision = result.metadata.processRevision;
  if (result.metadata.processCodeHash) eventPayload.processCodeHash = result.metadata.processCodeHash;
  if (options.inputs !== undefined) eventPayload.inputsRef = INPUTS_FILE;
  if (options.prompt !== undefined) eventPayload.prompt = options.prompt;
  if (sessionId !== undefined) eventPayload.sessionId = sessionId;
  const appended = await appendEvent({
    runDir: result.runDir,
    eventType: "RUN_CREATED",
    event: eventPayload,
  });
  return {
    ...appended,
    data: eventPayload,
    type: "RUN_CREATED",
  };
}

export type InvokeRunStartHookArgs = {
  readonly result: CreateRunResult;
  readonly options: CreateRunOptions;
};

export async function invokeRunStartHook(args: InvokeRunStartHookArgs): Promise<Awaited<ReturnType<typeof callRuntimeHook>>> {
  const { result, options } = args;
  const entryString = result.metadata.entrypoint.exportName
    ? `${result.metadata.entrypoint.importPath}#${result.metadata.entrypoint.exportName}`
    : result.metadata.entrypoint.importPath;
  const projectRoot = resolveProjectRootForRun(result.runDir, result.metadata.entrypoint.importPath);
  if (options.nested?.skipRunStartHook) {
    return {
      hookType: "on-run-start",
      success: true,
      output: null,
      executedHooks: [],
    };
  }
  return await callRuntimeHook(
    "on-run-start",
    {
      runId: result.runId,
      processId: result.metadata.processId,
      entry: entryString,
      inputs: options.inputs,
    },
    {
      cwd: projectRoot,
      logger: options.logger,
    },
  );
}

function validateRunId(runId: string) {
  if (typeof runId !== "string" || runId.trim() === "") {
    throw new Error("runId must be a non-empty string");
  }
}

function normalizeEntrypoint(runDir: string, importPath: string, exportName?: string): RunEntrypointMetadata {
  const entryImport = toRunRelativePosix(runDir, importPath);
  return {
    importPath: entryImport,
    exportName: exportName,
  };
}

function toRunRelativePosix(runDir: string, importPath: string): string {
  const relative = path.isAbsolute(importPath) ? path.relative(runDir, importPath) : importPath;
  if (!relative || relative === ".") {
    throw new Error("Entrypoint import path must reference a file");
  }
  return path.posix.normalize(relative.replace(/\\/g, "/"));
}
