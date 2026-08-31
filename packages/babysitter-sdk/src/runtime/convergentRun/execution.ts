import { promises as fs } from "node:fs";
import path from "node:path";
import { invokeRunStartHook } from "../createRun";
import { classifyConvergentRun } from "./classify";
import {
  COMPLETION_FILE,
  CONVERGENT_RUN_STATE_DIR,
  HOOK_MAY_HAVE_STARTED_FILE,
  HOOK_NOT_STARTED_FILE,
  canonicalJson,
  hookResultProjection,
  hookStatus,
  runCreatedEventSha256,
  sha256,
  type BoundaryMarker,
  type CompletionMarker,
  type ConvergentRunContext,
  type CreateRunConvergentOptions,
  type CreateRunConvergentResult,
} from "./contracts";
import { ensurePrivateDirectory, publishCreateOnce, renameNoReplace } from "./durable";
import { ConvergentRunError } from "./errors";
import { loadJournal } from "../../storage/journal";
import { RUN_METADATA_FILE } from "../../storage/paths";
import type { CreateRunOptions, CreateRunResult } from "../types";

export type ConvergentHookExecution = {
  readonly context: ConvergentRunContext;
  readonly options: CreateRunConvergentOptions;
  readonly runOptions: CreateRunOptions;
};

export async function publishBoundaryAndInvoke(args: ConvergentHookExecution): Promise<CreateRunConvergentResult> {
  const markerDirectory = path.join(args.context.runDir, "state", CONVERGENT_RUN_STATE_DIR);
  await ensurePrivateDirectory(markerDirectory);
  await publishCreateOnce(markerDirectory, HOOK_NOT_STARTED_FILE, markerBytes(boundaryMarker(args.context, args.options)));
  return await invokeFromProvenBoundary(args);
}

export async function invokeFromProvenBoundary(args: ConvergentHookExecution): Promise<CreateRunConvergentResult> {
  const markerDirectory = path.join(args.context.runDir, "state", CONVERGENT_RUN_STATE_DIR);
  await renameNoReplace(
    path.join(markerDirectory, HOOK_NOT_STARTED_FILE),
    path.join(markerDirectory, HOOK_MAY_HAVE_STARTED_FILE),
  );
  const result: CreateRunResult = {
    metadata: args.context.metadata,
    runDir: args.context.runDir,
    runId: args.options.runId,
  };
  let hook: Awaited<ReturnType<typeof invokeRunStartHook>>;
  try {
    hook = await invokeRunStartHook({ result, options: args.runOptions });
  } catch (error) {
    if (error instanceof Error) {
      throw new ConvergentRunError("RUN_CREATE_HOOK_FINALIZATION_UNKNOWN", "on-run-start threw after hook-may-have-started was published");
    }
    throw error;
  }
  try {
    await publishCreateOnce(markerDirectory, COMPLETION_FILE, markerBytes(completionMarker(args.context, args.options, hook)));
  } catch (error) {
    if (error instanceof Error) {
      throw new ConvergentRunError("RUN_CREATE_HOOK_FINALIZATION_UNKNOWN", "on-run-start returned before completion marker publication was proven");
    }
    throw error;
  }
  const classification = await classifyConvergentRun(args.options);
  switch (classification.kind) {
    case "CREATED_COMPLETE":
      return completionResult(classification.context, classification.completion);
    case "COMPLETION_MARKER_DIVERGED":
      throw new ConvergentRunError("RUN_CREATE_COMPLETION_MARKER_DIVERGED", "completion marker diverged after publication");
    case "ABSENT":
    case "PRE_JOURNAL_EXACT":
    case "JOURNALED_PRE_HOOK_PROVEN":
    case "JOURNALED_HOOK_FINALIZATION_UNKNOWN":
    case "PARTIAL_UNKNOWN":
      throw new ConvergentRunError("RUN_CREATE_HOOK_FINALIZATION_UNKNOWN", "completion marker was not revalidated after hook completion");
    default:
      return assertNever(classification);
  }
}

export async function reopenRunCreatedContext(args: {
  readonly event: ConvergentRunContext["event"];
  readonly result: CreateRunResult;
}): Promise<ConvergentRunContext> {
  const journal = await loadJournal(args.result.runDir);
  const reopened = journal[0];
  if (journal.length !== 1 || reopened === undefined || reopened.type !== "RUN_CREATED" || runCreatedEventSha256(reopened) !== runCreatedEventSha256(args.event)) {
    throw new ConvergentRunError("RUN_CREATE_PARTIAL_INVALID", "RUN_CREATED could not be reopened exactly");
  }
  return {
    event: reopened,
    metadata: args.result.metadata,
    runDir: args.result.runDir,
    runJsonSha256: sha256(await fs.readFile(path.join(args.result.runDir, RUN_METADATA_FILE))),
  };
}

export function completionResult(context: ConvergentRunContext, completion: CompletionMarker): CreateRunConvergentResult {
  return {
    completionMarkerPath: path.join(context.runDir, "state", CONVERGENT_RUN_STATE_DIR, COMPLETION_FILE),
    completionMarkerSelfHash: completion.selfHash,
    hookResultSha256: completion.hook.resultSha256,
    hookStatus: completion.hook.status,
    runCreatedEventSha256: completion.runCreated.eventSha256,
    runCreatedEventUlid: completion.runCreated.ulid,
    runId: completion.runId,
    runJsonSha256: completion.runJsonSha256,
  };
}

function boundaryMarker(context: ConvergentRunContext, options: CreateRunConvergentOptions): BoundaryMarker {
  const marker = {
    canonicalInputSha256: options.canonicalInputSha256,
    processSnapshotHash: options.processSnapshotHash,
    processSnapshotPath: options.processSnapshotPath,
    replacementSessionId: options.replacementSessionId,
    runCreatedEventSha256: runCreatedEventSha256(context.event),
    runCreatedEventUlid: context.event.ulid,
    runId: options.runId,
    runJsonSha256: context.runJsonSha256,
    schema: "babysitter-run-create-hook-boundary/v1" as const,
  };
  return { ...marker, selfHash: sha256(canonicalJson(marker)) };
}

function completionMarker(
  context: ConvergentRunContext,
  options: CreateRunConvergentOptions,
  hook: Awaited<ReturnType<typeof invokeRunStartHook>>,
): CompletionMarker {
  const marker = {
    canonicalInputSha256: options.canonicalInputSha256,
    hook: {
      resultSha256: sha256(canonicalJson(hookResultProjection(hook))),
      status: hookStatus(hook),
    },
    process: {
      snapshotHash: options.processSnapshotHash,
      snapshotPath: options.processSnapshotPath,
    },
    replacementSessionId: options.replacementSessionId,
    runCreated: {
      eventSha256: runCreatedEventSha256(context.event),
      ulid: context.event.ulid,
    },
    runId: options.runId,
    runJsonSha256: context.runJsonSha256,
    schema: "babysitter-run-create-completion/v1" as const,
  };
  return { ...marker, selfHash: sha256(canonicalJson(marker)) };
}

function markerBytes(marker: BoundaryMarker | CompletionMarker): Buffer {
  return Buffer.from(`${JSON.stringify(marker, null, 2)}\n`, "utf8");
}

function assertNever(value: never): never {
  throw new ConvergentRunError("RUN_CREATE_PARTIAL_INVALID", `Unhandled convergent state: ${JSON.stringify(value)}`);
}
