import { AsyncLocalStorage } from "node:async_hooks";
import { createHash, randomUUID } from "node:crypto";
import { constants as fsConstants, promises as fs } from "node:fs";
import * as path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fromJSONSchema } from "zod";

export const DRIVER_SCHEMA_VERSION = "2026.07.omp-driver-v1";
export const DEFAULT_SHELL_TIMEOUT_MS = 120_000;
export const MAX_CAPTURE_BYTES = 1024 * 1024;
export const MAX_DRIVER_STEPS = 100;
export const SHELL_HEARTBEAT_INTERVAL_MS = 5_000;

export async function assertOmpRunOwnership(runDirInput: string, sessionId: string): Promise<void> {
  if (!/^[A-Za-z0-9._:-]{1,256}$/.test(sessionId)) {
    throw new Error("Authoritative OMP session binding is unavailable or invalid");
  }
  if (!path.isAbsolute(runDirInput)) {
    throw new Error("Babysitter run directory must be absolute");
  }
  const runDir = await fs.realpath(runDirInput);
  let metadata: Record<string, unknown>;
  try {
    const parsed = JSON.parse(await fs.readFile(path.join(runDir, "run.json"), "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("run.json must contain an object");
    }
    metadata = parsed as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Babysitter run ownership metadata is unavailable or invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
  const binding = metadata.sessionBinding;
  if (
    metadata.runId !== path.basename(runDir)
    || metadata.harness !== "oh-my-pi"
    || !binding
    || typeof binding !== "object"
    || Array.isArray(binding)
  ) {
    throw new Error("Babysitter run does not declare valid OMP session ownership");
  }
  const owner = binding as Record<string, unknown>;
  if (owner.harness !== "oh-my-pi" || owner.sessionId !== sessionId) {
    throw new Error("Babysitter run is owned by a different OMP session");
  }
}

export async function assertOmpLiveSessionOwnership(payload: unknown, runDirInput: string): Promise<void> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("OMP session state response is malformed");
  }
  const response = payload as Record<string, unknown>;
  const state = response.state;
  if (response.found !== true || !state || typeof state !== "object" || Array.isArray(state)) {
    throw new Error("OMP session has no authoritative live run binding");
  }
  const sessionState = state as Record<string, unknown>;
  const runDir = await fs.realpath(runDirInput);
  let stateRunDir: string | undefined;
  if (typeof sessionState.runDir === "string") {
    try {
      stateRunDir = await fs.realpath(sessionState.runDir);
    } catch {
      stateRunDir = undefined;
    }
  }
  if (
    sessionState.active !== true
    || sessionState.runId !== path.basename(runDir)
    || stateRunDir !== runDir
  ) {
    throw new Error("OMP session state does not own the selected active run");
  }
}

interface JsonObject {
  [key: string]: unknown;
}

interface EffectAction {
  effectId: string;
  invocationKey: string;
  kind: string;
  label?: string;
  taskId?: string;
  taskDef?: JsonObject;
}

interface IterationResult {
  status: string;
  reason?: string;
  completionProof?: string;
  nextActions?: EffectAction[];
}

interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
  killed?: boolean;
}

interface ShellHostExecOptions {
  cwd: string;
  timeout: number;
  signal?: AbortSignal;
}

interface ShellHostExecResult extends CliResult {
  killed: boolean;
}

export type ShellHostExecutor = (
  command: string,
  args: string[],
  options: ShellHostExecOptions,
) => Promise<ShellHostExecResult>;

interface ShellExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
  startedAt: string;
  finishedAt: string;
}
export interface ShellExecutionProgress {
  state: "running";
  reason: "start" | "output" | "heartbeat";
  elapsedMs: number;
  stdoutBytes: number;
  stderrBytes: number;
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
}

export interface ShellProgressScheduler {
  setInterval(callback: () => void, intervalMs: number): unknown;
  clearInterval(handle: unknown): void;
}

export interface ShellExecutionProgressOptions {
  onProgress?: (progress: ShellExecutionProgress) => void;
  now?: () => number;
  scheduler?: ShellProgressScheduler;
}

interface ShellCommandOutput {
  path: string;
  ref: string;
  before: string | null;
  beforeBytes: Buffer | null;
  kind: "canonical_output" | "canonical_result" | "external";
}

interface ShellOutputClassification {
  kind: ShellCommandOutput["kind"];
  canonicalRealPath?: string;
}

interface ResolvedShellValue {
  value: unknown;
  outputAlreadyDurable: boolean;
  outputBytes?: Buffer;
}

export type DriverProgressStage =
  | "iteration"
  | "discovery"
  | "recovery"
  | "shell_start"
  | "shell_progress"
  | "shell_finish"
  | "post"
  | "agent_preparation"
  | "agent_claim"
  | "agent_completion"
  | "interaction"
  | "waiting"
  | "retry_authorized"
  | "failure"
  | "attention";

export type DriverProgressState =
  | "running"
  | "waiting"
  | "completed"
  | "failed"
  | "aborted"
  | "cancelled"
  | "awaiting_late_owner"
  | "operator_attention";

export interface DriverProgress {
  schemaVersion: typeof DRIVER_SCHEMA_VERSION;
  key: string;
  sequence: number;
  runId: string;
  runDir: string;
  operationId?: string;
  effectId?: string;
  stage: DriverProgressStage;
  state: DriverProgressState;
  message: string;
  observedAt: string;
  elapsedMs?: number;
  stdoutBytes?: number;
  stderrBytes?: number;
  stdoutTruncated?: boolean;
  stderrTruncated?: boolean;
}

export type DriverProgressListener = (progress: DriverProgress) => void | Promise<void>;

interface DriverDependencies {
  cwd: string;
  runCli(args: string[], timeoutMs?: number, signal?: AbortSignal): Promise<CliResult>;
  executeShell?: (
    action: EffectAction,
    cwd: string,
    signal?: AbortSignal,
    progress?: ShellExecutionProgressOptions,
  ) => Promise<ShellExecutionResult>;
  now?: () => Date;
  randomId?: () => string;
  onProgress?: DriverProgressListener;
  onProgressError?: (error: unknown, progress: DriverProgress) => void | Promise<void>;
}

interface ProgressOperationScope {
  operationId?: string;
  sequenceKeys: Set<string>;
  signatureKeys: Set<string>;
}

interface ExecutionCheckpoint {
  schemaVersion: string;
  effectId: string;
  invocationKey: string;
  kind: "shell" | "agent" | "breakpoint";
  state: "in_progress" | "completed";
  startedAt: string;
  finishedAt?: string;
  outputRef?: string;
  outputSha256?: string;
  authenticatedOutputSha256?: string;
  stdoutRef?: string;
  stderrRef?: string;
  resultStatus?: "ok" | "error";
  postedAt?: string;
  ownerName?: string;
  dispatchToken?: string;
  requestedModel?: string;
  outputSchema?: JsonObject;
  taskEnvelopeSha256?: string;
  attempt?: number;
  attemptState?:
    | "prepared"
    | "dispatched"
    | "claimed"
    | "completion_authenticated"
    | "failed"
    | "aborted"
    | "cancelled"
    | "awaiting_late_owner"
    | "orphaned"
    | "retry_authorized"
    | "completed";
  lastOwnerOutcome?: "failed" | "aborted" | "cancelled";
  attemptUpdatedAt?: string;
  retryAuthorizedAt?: string;
  retryReason?: string;
}

interface AgentOwner {
  schemaVersion: string;
  effectId: string;
  invocationKey: string;
  ownerName: string;
  dispatchToken: string;
  attempt: number;
  toolCallId: string;
  claimedAt: string;
  /** Host-issued opaque subagent reference. Never contains transcript content. */
  agentRef?: `agent://${string}`;
}

interface AgentBridgeDescriptor {
  runDir: string;
  effectId: string;
  invocationKey: string;
  ownerName: string;
  dispatchToken: string;
  attempt?: number;
  model?: string;
}

export type DriverResult =
  | { state: "completed"; completionProof?: string }
  | { state: "waiting"; reason?: string }
  | { state: "operator_attention"; effectId?: string; reason: string }
  | { state: "interaction"; effect: EffectAction }
  | {
      state: "agent";
      effectId: string;
      invocationKey: string;
      task: {
        context: string;
        tasks: Array<{
          name: string;
          agent: "babysitter-task";
          task: string;
          model?: string;
          outputSchema?: JsonObject;
          schemaMode?: "strict";
        }>;
      };
    };

export interface BreakpointResponseInput {
  runDir: string;
  effectId: string;
  invocationKey: string;
  approved: boolean;
}

export interface BreakpointResponseResult {
  handled: boolean;
  reason?: string;
}

export interface AgentToolCallDecision {
  handled: boolean;
  block?: boolean;
  reason?: string;
  modelOverride?: string;
  ownerName?: string;
  envelopeSha256?: string;
}

export interface AgentToolResultEvent {
  toolCallId: string;
  input: JsonObject;
  details?: unknown;
  isError: boolean;
}

export interface AgentToolCompletion {
  handled: boolean;
  posted?: boolean;
  continuationRunDir?: string;
  reason?: string;
}



export interface AgentRetryInput extends AgentBridgeDescriptor {
  reason: string;
}

export interface AgentCancelInput extends AgentBridgeDescriptor {
  reason: string;
}

export interface AgentAttemptTransition {
  handled: boolean;
  dispatch?: Extract<DriverResult, { state: "agent" }>;
  reason?: string;
}

export type AgentRetryAuthorization = AgentAttemptTransition;

class DriverError extends Error {
  constructor(
    message: string,
    readonly effectId?: string,
    readonly publicDiagnostic?: string,
  ) {
    super(message);
    this.name = "DriverError";
  }
}

export class OmpDeterministicDriver {
  private readonly executeShell: (
    action: EffectAction,
    cwd: string,
    signal?: AbortSignal,
    progress?: ShellExecutionProgressOptions,
  ) => Promise<ShellExecutionResult>;
  private readonly now: () => Date;
  private readonly randomId: () => string;
  private readonly progressListeners = new Set<DriverProgressListener>();
  private readonly progressSequences = new Map<string, number>();
  private readonly progressSignatures = new Map<string, string>();
  private readonly progressOperation = new AsyncLocalStorage<ProgressOperationScope>();
  private readonly effectLocks = new Map<string, Promise<void>>();
  private workspaceCwd: string;

  constructor(private readonly dependencies: DriverDependencies) {
    this.workspaceCwd = path.resolve(dependencies.cwd);
    this.executeShell = dependencies.executeShell ?? missingHostShellExecutor;
    this.now = dependencies.now ?? (() => new Date());
    this.randomId = dependencies.randomId ?? randomUUID;
  }

  setWorkspaceCwd(cwd: string): void {
    this.workspaceCwd = path.resolve(cwd);
  }

  onProgress(listener: DriverProgressListener): () => void {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  async withProgressOperation<T>(operationId: string | undefined, operation: () => Promise<T>): Promise<T> {
    const scope: ProgressOperationScope = {
      ...(operationId ? { operationId } : {}),
      sequenceKeys: new Set(),
      signatureKeys: new Set(),
    };
    try {
      return await this.progressOperation.run(scope, operation);
    } finally {
      for (const key of scope.sequenceKeys) this.progressSequences.delete(key);
      for (const key of scope.signatureKeys) this.progressSignatures.delete(key);
    }
  }

  async drive(runDirInput: string, signal?: AbortSignal, operationId?: string): Promise<DriverResult> {
    return await this.withProgressOperation(operationId, () => this.driveScoped(runDirInput, signal));
  }

  async resolveBreakpointResponse(
    input: BreakpointResponseInput,
    signal?: AbortSignal,
  ): Promise<BreakpointResponseResult> {
    const runDir = path.resolve(input.runDir);
    return await this.withEffectLock(runDir, input.effectId, async () => {
      const task = await readJsonIfExists<JsonObject>(
        effectArtifactPath(runDir, input.effectId, "task.json"),
      );
      if (
        !task
        || task.kind !== "breakpoint"
        || task.effectId !== input.effectId
        || task.invocationKey !== input.invocationKey
      ) {
        return {
          handled: false,
          reason: `No matching pending breakpoint exists for effect ${input.effectId}`,
        };
      }

      await ensureEffectTaskDir(runDir, input.effectId);
      const existing = await readCheckpoint(runDir, input.effectId);
      const value = { approved: input.approved };
      const isPending = async (): Promise<boolean> => {
        const iteration = await this.runIteration(runDir, signal);
        const pending = iteration.nextActions?.find((action) =>
          action.kind === "breakpoint"
          && action.effectId === input.effectId
          && action.invocationKey === input.invocationKey
        );
        if (!pending) return false;
        validateEffectIdentity(pending);
        return true;
      };
      if (existing) {
        if (existing.kind !== "breakpoint" || existing.invocationKey !== input.invocationKey) {
          return {
            handled: false,
            reason: `Durable checkpoint identity conflicts with breakpoint ${input.effectId}`,
          };
        }
        const recovered = await this.recoverCompletedOutput(runDir, existing, signal);
        if (!recovered) {
          return {
            handled: false,
            reason: `Breakpoint ${input.effectId} has an incomplete durable response`,
          };
        }
        const output = JSON.parse(
          (await readCheckpointOutputBytes(runDir, recovered)).toString("utf8"),
        ) as JsonObject;
        if (output.approved !== input.approved) {
          return {
            handled: false,
            reason: `Breakpoint ${input.effectId} already has a conflicting durable response`,
          };
        }
        if (await this.hasCommittedResult(runDir, recovered, signal)) {
          return { handled: true };
        }
        if (!await isPending()) {
          return {
            handled: false,
            reason: `No matching pending breakpoint exists for effect ${input.effectId}`,
          };
        }
        await this.postCompletedCheckpoint(runDir, recovered, signal);
        return { handled: true };
      }

      if (!await isPending()) {
        return {
          handled: false,
          reason: `No matching pending breakpoint exists for effect ${input.effectId}`,
        };
      }

      const startedAt = this.now().toISOString();
      const checkpoint: ExecutionCheckpoint = {
        schemaVersion: DRIVER_SCHEMA_VERSION,
        effectId: input.effectId,
        invocationKey: input.invocationKey,
        kind: "breakpoint",
        state: "in_progress",
        startedAt,
      };
      await writeJsonExclusive(executionPath(runDir, input.effectId), checkpoint);
      const outputPath = await resolveRunRelativeReal(
        runDir,
        taskRelativeRef(input.effectId, "output.json"),
      );
      await writeImmutableJson(outputPath, value);
      const outputBytes = await fs.readFile(outputPath);
      const completed: ExecutionCheckpoint = {
        ...checkpoint,
        state: "completed",
        finishedAt: this.now().toISOString(),
        outputRef: taskRelativeRef(input.effectId, "output.json"),
        outputSha256: sha256(outputBytes),
        resultStatus: "ok",
      };
      await writeJsonAtomic(executionPath(runDir, input.effectId), completed);
      await this.postCompletedCheckpoint(runDir, completed, signal);
      await this.emitProgress(
        runDir,
        "interaction",
        "completed",
        "Breakpoint response committed durably",
        {
          effectId: input.effectId,
          invocationKey: input.invocationKey,
          kind: "breakpoint",
        },
      );
      return { handled: true };
    });
  }

  private async driveScoped(runDirInput: string, signal?: AbortSignal): Promise<DriverResult> {
    const runDir = path.resolve(runDirInput);
    try {
      for (let step = 0; step < MAX_DRIVER_STEPS; step += 1) {
        signal?.throwIfAborted();
        const iteration = await this.runIteration(runDir, signal);
        await this.emitProgress(runDir, "iteration", "running", `Iteration ${step + 1} observed`);
        if (iteration.status === "completed") {
          await this.emitProgress(runDir, "iteration", "completed", "Run completed");
          return { state: "completed", completionProof: iteration.completionProof };
        }
        if (iteration.status === "halted" || iteration.status === "failed") {
          const reason = `Babysitter iteration stopped with status ${iteration.status}${iteration.reason ? `: ${iteration.reason}` : ""}`;
          await this.emitProgress(
            runDir,
            "attention",
            "operator_attention",
            "Babysitter iteration requires operator attention",
          );
          return { state: "operator_attention", reason };
        }

        const actions = iteration.nextActions ?? [];
        await this.emitProgress(
          runDir,
          "discovery",
          actions.length > 0 ? "running" : "waiting",
          actions.length > 0 ? `Discovered ${actions.length} durable action${actions.length === 1 ? "" : "s"}` : "No runnable action discovered",
        );
        if (actions.length === 0) {
          await this.emitProgress(runDir, "waiting", "waiting", "Waiting for Babysitter state to advance");
          return { state: "waiting", reason: iteration.reason };
        }

        let progressed = false;
        for (const action of actions) {
          validateEffectIdentity(action);
          signal?.throwIfAborted();
          if (action.kind === "shell") {
            await this.resolveShellEffect(runDir, action, signal);
            progressed = true;
            continue;
          }
          if (action.kind === "agent" || action.kind === "skill") {
            const dispatch = await this.prepareAgentEffect(runDir, action, signal);
            if (dispatch) return dispatch;
            progressed = true;
            continue;
          }
          await this.emitProgress(
            runDir,
            "interaction",
            "waiting",
            "Interaction required for unsupported effect kind",
            { effectId: action.effectId, invocationKey: "", kind: "interaction" },
          );
          return { state: "interaction", effect: action };
        }
        if (!progressed) {
          await this.emitProgress(runDir, "waiting", "waiting", "Waiting for Babysitter state to advance");
          return { state: "waiting", reason: iteration.reason };
        }
      }
      const reason = `Deterministic driver exceeded its ${MAX_DRIVER_STEPS}-step safety bound`;
      await this.emitProgress(runDir, "attention", "operator_attention", reason);
      return { state: "operator_attention", reason };
    } catch (error) {
      await this.emitProgress(
        runDir,
        "failure",
        "failed",
        driverFailureDiagnostic(error),
        error instanceof DriverError && error.effectId ? { effectId: error.effectId, invocationKey: "", kind: "unknown" } : undefined,
      );
      throw error;
    }
  }

  async claimAgentToolCall(input: JsonObject, toolCallId: string): Promise<AgentToolCallDecision> {
    const descriptor = parseAgentBridgeInput(input);
    if (!descriptor) {
      return containsAgentBridgeMarker(input)
        ? { handled: true, block: true, reason: "Malformed Babysitter bridge task envelope" }
        : { handled: false };
    }
    return await this.withEffectLock(descriptor.runDir, descriptor.effectId, async () => {

    const checkpoint = await readCheckpoint(descriptor.runDir, descriptor.effectId);
    if (!checkpoint || checkpoint.kind !== "agent") {
      return { handled: true, block: true, reason: `No durable agent claim exists for effect ${descriptor.effectId}` };
    }
    const mismatch = validateDescriptor(checkpoint, descriptor);
    if (mismatch) return { handled: true, block: true, reason: mismatch };
    if (checkpoint.state === "completed") {
      return { handled: true, block: true, reason: `Effect ${descriptor.effectId} already has an immutable completed result` };
    }

    const item = readTaskItem(input);
    const model = descriptor.model;
    if (checkpoint.requestedModel !== model) {
      return {
        handled: true,
        block: true,
        reason: `Model mismatch for effect ${descriptor.effectId}: expected ${checkpoint.requestedModel ?? "default"}, received ${typeof model === "string" ? model : "default"}`,
      };
    }
    const expectedSchema = checkpoint.outputSchema;
    const receivedSchema = readObject(item?.outputSchema);
    const schemaMatches = expectedSchema
      ? item?.schemaMode === "strict" && isDeepStrictEqual(receivedSchema, expectedSchema)
      : item?.outputSchema === undefined && item?.schemaMode === undefined;
    if (!schemaMatches) {
      return {
        handled: true,
        block: true,
        reason: `Output schema mismatch for effect ${descriptor.effectId}`,
      };
    }
    if (
      !checkpoint.taskEnvelopeSha256 ||
      checkpoint.taskEnvelopeSha256 !== sha256(Buffer.from(stableJsonStringify(input), "utf8"))
    ) {
      return {
        handled: true,
        block: true,
        reason: `Task envelope mismatch for effect ${descriptor.effectId}`,
      };
    }

    const owner: AgentOwner = {
      schemaVersion: DRIVER_SCHEMA_VERSION,
      effectId: descriptor.effectId,
      invocationKey: descriptor.invocationKey,
      ownerName: descriptor.ownerName,
      dispatchToken: descriptor.dispatchToken,
      attempt: checkpoint.attempt ?? descriptor.attempt ?? 1,
      toolCallId,
      claimedAt: this.now().toISOString(),
    };
    const ownerPath = agentOwnerPath(descriptor.runDir, descriptor.effectId);
    try {
      await writeJsonExclusive(ownerPath, owner);
      await writeJsonAtomic(executionPath(descriptor.runDir, descriptor.effectId), {
        ...checkpoint,
        attempt: owner.attempt,
        attemptState: "claimed",
        attemptUpdatedAt: owner.claimedAt,
      } satisfies ExecutionCheckpoint);
      await this.emitProgress(
        descriptor.runDir,
        "agent_claim",
        "running",
        `Agent attempt ${owner.attempt} claimed`,
        checkpoint,
      );
      return {
        handled: true,
        ...(checkpoint.requestedModel ? { modelOverride: checkpoint.requestedModel } : {}),
        ownerName: checkpoint.ownerName,
        envelopeSha256: checkpoint.taskEnvelopeSha256,
      };
    } catch (error) {
      if (!isAlreadyExists(error)) throw error;
      const existing = await readJson<AgentOwner>(ownerPath);
      if (existing.toolCallId === toolCallId && existing.dispatchToken === descriptor.dispatchToken) {
        return { handled: true };
      }
      return {
        handled: true,
        block: true,
        reason: `Effect ${descriptor.effectId} is already owned by blocking tool call ${existing.toolCallId}`,
      };
    }
    });
  }

  async completeAgentToolCall(event: AgentToolResultEvent): Promise<AgentToolCompletion> {
    const descriptor = parseAgentBridgeInput(event.input);
    if (!descriptor) return { handled: false };
    return await this.withEffectLock(descriptor.runDir, descriptor.effectId, async () => {

    const owner = await readJsonIfExists<AgentOwner>(agentOwnerPath(descriptor.runDir, descriptor.effectId));
    if (!owner || owner.toolCallId !== event.toolCallId || owner.dispatchToken !== descriptor.dispatchToken) {
      return {
        handled: true,
        reason: `Ignoring non-owner result for effect ${descriptor.effectId}`,
      };
    }
    const identity = owningAgentRef(event.details, owner);
    if (identity.invalid) {
      return {
        handled: true,
        reason: `Ignoring forged or non-owner agent reference for effect ${descriptor.effectId}`,
      };
    }
    if (identity.ref && owner.agentRef !== identity.ref) {
      owner.agentRef = identity.ref;
      await writeJsonAtomic(agentOwnerPath(descriptor.runDir, descriptor.effectId), owner);
    }

    const currentCheckpoint = await readCheckpoint(descriptor.runDir, descriptor.effectId);
    if (
      currentCheckpoint?.kind === "agent" &&
      !validateDescriptor(currentCheckpoint, descriptor) &&
      (currentCheckpoint.attemptState === "failed" ||
        currentCheckpoint.attemptState === "aborted" ||
        currentCheckpoint.attemptState === "cancelled")
    ) {
      return {
        handled: true,
        reason: `Ignoring owner result for effect ${descriptor.effectId}: attempt is terminal (${currentCheckpoint.attemptState})`,
      };
    }


    const extracted = extractSingleAgentResult(event.details);
    if (event.isError || !extracted.ok) {
      const checkpoint = await readCheckpoint(descriptor.runDir, descriptor.effectId);
      if (!checkpoint || checkpoint.kind !== "agent") {
        throw new DriverError(`Missing durable agent checkpoint for effect ${descriptor.effectId}`, descriptor.effectId);
      }
      const mismatch = validateDescriptor(checkpoint, descriptor);
      if (mismatch) {
        return { handled: true, reason: `Ignoring stale owner result for effect ${descriptor.effectId}: ${mismatch}` };
      }
      const outcome = classifyOwnerOutcome(event);
      const updated: ExecutionCheckpoint = {
        ...checkpoint,
        attemptState: outcome,
        ...(outcome === "awaiting_late_owner"
          ? { lastOwnerOutcome: undefined }
          : { lastOwnerOutcome: outcome }),
        attemptUpdatedAt: this.now().toISOString(),
      };
      await writeJsonAtomic(executionPath(descriptor.runDir, descriptor.effectId), updated);
      await this.emitProgress(
        descriptor.runDir,
        "agent_completion",
        outcome,
        outcome === "awaiting_late_owner"
          ? `Agent attempt ${updated.attempt ?? 1} lost its blocking task result`
          : `Agent attempt ${updated.attempt ?? 1} ${outcome}`,
        updated,
      );
      if (outcome === "awaiting_late_owner") {
        await this.emitProgress(
          descriptor.runDir,
          "waiting",
          "awaiting_late_owner",
          `Awaiting late completion from retained owner for attempt ${updated.attempt ?? 1}`,
          updated,
        );
      }
      return {
        handled: true,
        reason: "reason" in extracted
          ? extracted.reason
          : outcome === "awaiting_late_owner"
            ? `Blocking agent call ${event.toolCallId} lost its result; effect remains unresolved and awaits its retained owner`
            : `Blocking agent call ${event.toolCallId} ${outcome}; explicit retry authorization is required`,
      };
    }

    const checkpoint = await readCheckpoint(descriptor.runDir, descriptor.effectId);
    if (!checkpoint || checkpoint.kind !== "agent") {
      throw new DriverError(`Missing durable agent checkpoint for effect ${descriptor.effectId}`, descriptor.effectId);
    }
    const mismatch = validateDescriptor(checkpoint, descriptor);
    if (mismatch) throw new DriverError(mismatch, descriptor.effectId);

    return await this.persistAgentCompletion(descriptor, extracted.value);
    });
  }



  async authorizeAgentRetry(input: AgentRetryInput): Promise<AgentRetryAuthorization> {
    const descriptor = parseAgentOwnerControlInput(input);
    if (!descriptor || typeof input.reason !== "string" || input.reason.trim().length === 0) {
      return { handled: false, reason: "A complete owner descriptor and retry reason are required" };
    }
    return await this.withEffectLock(descriptor.runDir, descriptor.effectId, async () => {
    const checkpoint = await readCheckpoint(descriptor.runDir, descriptor.effectId);
    if (!checkpoint || checkpoint.kind !== "agent") {
      return { handled: true, reason: `No durable agent checkpoint exists for effect ${descriptor.effectId}` };
    }
    const mismatch = validateDescriptor(checkpoint, descriptor);
    if (mismatch) return { handled: true, reason: `Retry rejected: ${mismatch}` };
    if (checkpoint.state === "completed") {
      return { handled: true, reason: `Retry rejected: effect ${descriptor.effectId} is already completed` };
    }
    if (
      checkpoint.attemptState !== "failed" &&
      checkpoint.attemptState !== "aborted" &&
      checkpoint.attemptState !== "cancelled" &&
      checkpoint.attemptState !== "awaiting_late_owner" &&
      checkpoint.attemptState !== "orphaned"
    ) {
      return {
        handled: true,
        reason: `Retry rejected: effect ${descriptor.effectId} is ${checkpoint.attemptState ?? "in progress"}, not in a retryable terminal state`,
      };
    }
    const ownerPath = agentOwnerPath(descriptor.runDir, descriptor.effectId);
    const owner = await readJsonIfExists<AgentOwner>(ownerPath);
    if (
      owner &&
      (
        owner.invocationKey !== descriptor.invocationKey ||
        owner.ownerName !== descriptor.ownerName ||
        owner.dispatchToken !== descriptor.dispatchToken
      )
    ) {
      return { handled: true, reason: `Retry rejected: retained owner identity does not match effect ${descriptor.effectId}` };
    }
    if (!owner && checkpoint.attemptState !== "orphaned") {
      return { handled: true, reason: `Retry rejected: retained owner identity does not match effect ${descriptor.effectId}` };
    }

    const attempt = checkpoint.attempt ?? owner?.attempt ?? 1;
    if (owner) {
      await writeImmutableJson(
        effectArtifactPath(descriptor.runDir, descriptor.effectId, `agent-owner.attempt-${attempt}.json`),
        owner,
      );
    }
    const updatedAt = this.now().toISOString();
    const updated: ExecutionCheckpoint = {
      ...checkpoint,
      attempt: attempt + 1,
      attemptState: "retry_authorized",
      attemptUpdatedAt: updatedAt,
      retryAuthorizedAt: updatedAt,
      retryReason: sanitizeProgressText(input.reason),
      dispatchToken: this.randomId(),
      finishedAt: undefined,
      lastOwnerOutcome: undefined,
    };
    await writeJsonAtomic(executionPath(descriptor.runDir, descriptor.effectId), updated);
    if (owner) await fs.unlink(ownerPath);
    await this.emitProgress(
      descriptor.runDir,
      "retry_authorized",
      "running",
      `Retry authorized for agent attempt ${updated.attempt}`,
      updated,
    );
    return { handled: true };
    });
  }

  private async persistAgentCompletion(
    descriptor: AgentBridgeDescriptor,
    value: unknown,
  ): Promise<AgentToolCompletion> {
    const checkpoint = await readCheckpoint(descriptor.runDir, descriptor.effectId);
    if (!checkpoint || checkpoint.kind !== "agent") {
      throw new DriverError(`Missing durable agent checkpoint for effect ${descriptor.effectId}`, descriptor.effectId);
    }
    const mismatch = validateDescriptor(checkpoint, descriptor);
    if (mismatch) throw new DriverError(mismatch, descriptor.effectId);
    const validationErrors = validateJsonSchema(value, checkpoint.outputSchema);
    if (validationErrors.length > 0) {
      throw new DriverError(
        `Agent result failed output schema validation for effect ${descriptor.effectId}: ${validationErrors.join("; ")}`,
        descriptor.effectId,
      );
    }

    const outputPath = await resolveRunRelativeReal(
      descriptor.runDir,
      taskRelativeRef(descriptor.effectId, "output.json"),
    );
    const authenticatedOutputSha256 = sha256(Buffer.from(JSON.stringify(value, null, 2) + "\n", "utf8"));
    const authenticated: ExecutionCheckpoint = {
      ...checkpoint,
      attemptState: "completion_authenticated",
      attemptUpdatedAt: this.now().toISOString(),
      authenticatedOutputSha256,
    };
    await writeJsonAtomic(executionPath(descriptor.runDir, descriptor.effectId), authenticated);
    await writeImmutableJson(outputPath, value);
    const outputBytes = await fs.readFile(outputPath);
    const outputSha256 = sha256(outputBytes);
    if (outputSha256 !== authenticatedOutputSha256) {
      throw new DriverError(`Authenticated output checksum mismatch for effect ${descriptor.effectId}`, descriptor.effectId);
    }
    const completed: ExecutionCheckpoint = {
      ...authenticated,
      state: "completed",
      attemptState: "completed",
      attemptUpdatedAt: this.now().toISOString(),
      finishedAt: checkpoint.finishedAt ?? this.now().toISOString(),
      outputRef: taskRelativeRef(descriptor.effectId, "output.json"),
      outputSha256,
    };
    await writeJsonAtomic(executionPath(descriptor.runDir, descriptor.effectId), completed);
    await this.emitProgress(
      descriptor.runDir,
      "agent_completion",
      "completed",
      `Agent attempt ${completed.attempt ?? 1} completed durably`,
      completed,
    );
    const posted = await this.postCompletedCheckpoint(descriptor.runDir, completed);
    return { handled: true, posted, continuationRunDir: descriptor.runDir };
  }

  async cancelAgentAttempt(input: AgentCancelInput): Promise<AgentAttemptTransition> {
    const descriptor = parseAgentOwnerControlInput(input);
    if (!descriptor || typeof input.reason !== "string" || input.reason.trim().length === 0) {
      return { handled: false, reason: "A complete owner descriptor and cancellation reason are required" };
    }
    return await this.withEffectLock(descriptor.runDir, descriptor.effectId, async () => {
      const checkpoint = await readCheckpoint(descriptor.runDir, descriptor.effectId);
      if (!checkpoint || checkpoint.kind !== "agent") {
        return { handled: true, reason: `No durable agent checkpoint exists for effect ${descriptor.effectId}` };
      }
      const mismatch = validateDescriptor(checkpoint, descriptor);
      if (mismatch) return { handled: true, reason: `Cancellation rejected: ${mismatch}` };
      if (checkpoint.state === "completed") {
        return { handled: true, reason: `Cancellation rejected: effect ${descriptor.effectId} is already completed` };
      }
      if (checkpoint.attemptState === "cancelled") return { handled: true };
      if (checkpoint.attemptState !== "claimed" && checkpoint.attemptState !== "awaiting_late_owner") {
        return {
          handled: true,
          reason: `Cancellation rejected: effect ${descriptor.effectId} is ${checkpoint.attemptState ?? "in progress"}`,
        };
      }
      const owner = await readJsonIfExists<AgentOwner>(agentOwnerPath(descriptor.runDir, descriptor.effectId));
      if (
        !owner ||
        owner.invocationKey !== descriptor.invocationKey ||
        owner.ownerName !== descriptor.ownerName ||
        owner.dispatchToken !== descriptor.dispatchToken
      ) {
        return { handled: true, reason: `Cancellation rejected: retained owner identity does not match effect ${descriptor.effectId}` };
      }
      const updated: ExecutionCheckpoint = {
        ...checkpoint,
        attemptState: "cancelled",
        lastOwnerOutcome: "cancelled",
        attemptUpdatedAt: this.now().toISOString(),
      };
      await writeJsonAtomic(executionPath(descriptor.runDir, descriptor.effectId), updated);
      await this.emitProgress(
        descriptor.runDir,
        "agent_completion",
        "cancelled",
        `Agent attempt ${updated.attempt ?? 1} cancelled: ${sanitizeProgressText(input.reason)}`,
        updated,
      );
      return { handled: true };
    });
  }

  private async runIteration(runDir: string, signal?: AbortSignal): Promise<IterationResult> {
    const result = await this.dependencies.runCli(["run:iterate", runDir, "--json"], undefined, signal);
    if (result.code !== 0) {
      throw new DriverError(`run:iterate failed: ${boundedDiagnostic(result.stderr || result.stdout)}`);
    }
    return parseCliJson<IterationResult>(result.stdout, "run:iterate");
  }

  private async resolveShellEffect(runDir: string, action: EffectAction, signal?: AbortSignal): Promise<void> {
    await ensureEffectTaskDir(runDir, action.effectId);
    const checkpointFile = executionPath(runDir, action.effectId);
    const startedAt = this.now().toISOString();
    const inProgress: ExecutionCheckpoint = {
      schemaVersion: DRIVER_SCHEMA_VERSION,
      effectId: action.effectId,
      invocationKey: action.invocationKey,
      kind: "shell",
      state: "in_progress",
      startedAt,
    };

    let checkpoint: ExecutionCheckpoint;
    try {
      await writeJsonExclusive(checkpointFile, inProgress);
      checkpoint = inProgress;
      await this.emitProgress(runDir, "shell_start", "running", "Shell effect started durably", action);
    } catch (error) {
      if (!isAlreadyExists(error)) throw error;
      const existingCheckpoint = await readCheckpoint(runDir, action.effectId);
      if (!existingCheckpoint) {
        throw new DriverError(`Missing durable shell checkpoint for effect ${action.effectId}`, action.effectId);
      }
      checkpoint = existingCheckpoint;
      validateCheckpointIdentity(checkpoint, action);
      const recovered = await this.recoverCompletedOutput(runDir, checkpoint, signal);
      if (!recovered) {
        const state = checkpoint.state === "completed" ? "completed" : "in-progress";
        throw new DriverError(
          `Shell effect ${action.effectId} has a ${state} execution checkpoint but no authoritative durable output; refusing to rerun`,
          action.effectId,
        );
      }
      checkpoint = recovered;
      await this.emitProgress(runDir, "recovery", "completed", "Recovered durable shell output", action);
      await this.postCompletedCheckpoint(runDir, checkpoint, signal);
      if (checkpoint.resultStatus === "error") {
        throw new DriverError(`Shell effect ${action.effectId} failed; refusing deterministic continuation`, action.effectId);
      }
      return;
    }

    await this.emitProgress(runDir, "shell_start", "running", "Starting bounded shell effect", action);
    const commandOutput = await shellCommandOutputFingerprint(runDir, action);
    let progressInFlight: Promise<void> | undefined;
    let pendingProgress: ShellExecutionProgress | undefined;
    const startProgressDrain = (): void => {
      if (progressInFlight) return;
      const running = Promise.resolve().then(async () => {
        while (pendingProgress) {
          const next = pendingProgress;
          pendingProgress = undefined;
          await this.emitProgress(
            runDir,
            "shell_progress",
            "running",
            shellProgressMessage(next),
            action,
            next,
          );
        }
      });
      const settled = running.finally(() => {
        if (progressInFlight !== settled) return;
        progressInFlight = undefined;
        if (pendingProgress) startProgressDrain();
      });
      progressInFlight = settled;
    };
    let shellResult: ShellExecutionResult;
    try {
      shellResult = await this.executeShell(action, this.workspaceCwd, signal, {
        now: () => this.now().getTime(),
        onProgress: (progress) => {
          pendingProgress = progress;
          startProgressDrain();
        },
      });
    } finally {
      while (progressInFlight) await progressInFlight;
    }
    const stdoutPath = effectArtifactPath(runDir, action.effectId, "stdout.log");
    const stderrPath = effectArtifactPath(runDir, action.effectId, "stderr.log");
    await writeTextAtomic(stdoutPath, shellResult.stdout);
    await writeTextAtomic(stderrPath, shellResult.stderr);

    const outputPath = await resolveRunRelativeReal(runDir, taskRelativeRef(action.effectId, "output.json"));
    const resolvedValue = await shellResultValue(runDir, action, shellResult, commandOutput);
    const shell = readObject(action.taskDef?.shell) ?? readObject(action.taskDef?.metadata) ?? {};
    const expectedExitCode = typeof shell.expectedExitCode === "number" ? shell.expectedExitCode : 0;
    const resultStatus = shellResult.timedOut || shellResult.exitCode !== expectedExitCode ? "error" : "ok";
    const durableOutputBytes = resolvedValue.outputBytes
      ?? Buffer.from(JSON.stringify(resolvedValue.value, null, 2) + "\n", "utf8");
    await writeImmutableBytes(outputPath, durableOutputBytes);
    checkpoint = {
      ...checkpoint,
      state: "completed",
      finishedAt: shellResult.finishedAt,
      outputRef: taskRelativeRef(action.effectId, "output.json"),
      outputSha256: sha256(durableOutputBytes),
      stdoutRef: taskRelativeRef(action.effectId, "stdout.log"),
      stderrRef: taskRelativeRef(action.effectId, "stderr.log"),
      resultStatus,
    };
    await writeJsonAtomic(checkpointFile, checkpoint);
    await this.emitProgress(
      runDir,
      "shell_finish",
      shellResult.timedOut || shellResult.exitCode !== expectedExitCode ? "failed" : "completed",
      shellResult.timedOut
        ? "Shell effect timed out and was captured durably"
        : `Shell effect finished with exit code ${shellResult.exitCode}`,
      action,
    );
    await this.postCompletedCheckpoint(runDir, checkpoint, signal);
    if (resultStatus === "error") {
      throw new DriverError(`Shell effect ${action.effectId} failed; refusing deterministic continuation`, action.effectId);
    }
  }

  private async prepareAgentEffect(runDir: string, action: EffectAction, signal?: AbortSignal): Promise<DriverResult | null> {
    await ensureEffectTaskDir(runDir, action.effectId);
    const checkpointFile = executionPath(runDir, action.effectId);
    const taskDef = action.taskDef ?? {};
    const requestedModel = readRequestedModel(taskDef);
    const ownerName = stableAgentName(action.effectId);
    let checkpoint: ExecutionCheckpoint;

    try {
      checkpoint = await writeJsonExclusiveFactory(checkpointFile, () => ({
        schemaVersion: DRIVER_SCHEMA_VERSION,
        effectId: action.effectId,
        invocationKey: action.invocationKey,
        kind: "agent",
        state: "in_progress",
        startedAt: this.now().toISOString(),
        ownerName,
        dispatchToken: this.randomId(),
        requestedModel,
        outputSchema: readOutputSchema(taskDef),
        attempt: 1,
        attemptState: "prepared",
        attemptUpdatedAt: this.now().toISOString(),
      }));
      await this.emitProgress(runDir, "agent_preparation", "running", "Agent attempt 1 prepared durably", action);
    } catch (error) {
      if (!isAlreadyExists(error)) throw error;
      const existing = await readCheckpoint(runDir, action.effectId);
      if (!existing) {
        throw new DriverError(`Missing durable agent checkpoint for effect ${action.effectId}`, action.effectId);
      }
      validateCheckpointIdentity(existing, action);
      const recovered = await this.recoverCompletedOutput(runDir, existing);
      if (recovered) {
        await this.emitProgress(runDir, "recovery", "completed", "Recovered durable agent output", action);
        await this.postCompletedCheckpoint(runDir, recovered, signal);
        return null;
      }
      const owner = await readJsonIfExists<AgentOwner>(agentOwnerPath(runDir, action.effectId));
      if (
        owner &&
        owner.dispatchToken === existing.dispatchToken &&
        owner.invocationKey === existing.invocationKey &&
        owner.attempt === (existing.attempt ?? 1)
      ) {
        const terminalOwnerState = existing.attemptState === "failed" ||
          existing.attemptState === "aborted" ||
          existing.attemptState === "cancelled"
          ? existing.attemptState
          : undefined;
        await this.emitProgress(
          runDir,
          terminalOwnerState ? "attention" : "waiting",
          terminalOwnerState ?? (existing.attemptState === "awaiting_late_owner" ? "awaiting_late_owner" : "waiting"),
          terminalOwnerState
            ? `Agent attempt ${existing.attempt ?? 1} ${terminalOwnerState}; explicit retry authorization is required`
            : existing.attemptState === "awaiting_late_owner"
              ? `Awaiting late completion from retained owner for attempt ${existing.attempt ?? 1}`
              : `Agent attempt ${existing.attempt ?? 1} remains owned`,
          existing,
        );
        if (terminalOwnerState) {
          return {
            state: "operator_attention",
            effectId: action.effectId,
            reason: `Agent attempt ${existing.attempt ?? 1} ${terminalOwnerState}; authorize retry or resolve the effect explicitly`,
          };
        }
        return {
          state: "waiting",
          reason: `Agent effect ${action.effectId} remains owned by ${owner.ownerName} through blocking tool call ${owner.toolCallId}; awaiting that invocation's result`,
        };
      }
      if (existing.attemptState === "retry_authorized") {
        await this.emitProgress(
          runDir,
          "agent_preparation",
          "running",
          `Dispatching explicitly authorized agent attempt ${existing.attempt ?? 1}`,
          existing,
        );
        return await this.buildAgentDispatch(runDir, action, existing);
      }
      const orphaned = existing.attemptState === "orphaned"
        ? existing
        : {
            ...existing,
            attemptState: "orphaned" as const,
            attemptUpdatedAt: this.now().toISOString(),
          };
      if (orphaned !== existing) {
        await writeJsonAtomic(executionPath(runDir, action.effectId), orphaned);
      }
      await this.emitProgress(
        runDir,
        "attention",
        "operator_attention",
        `Agent attempt ${orphaned.attempt ?? 1} is orphaned; explicit retry authorization or supersession is required`,
        orphaned,
      );
      return {
        state: "operator_attention",
        effectId: action.effectId,
        reason: `Agent effect ${action.effectId} has an orphaned durable dispatch checkpoint with no matching live owner; authorize retry or supersede it explicitly`,
      };
    }

    return await this.buildAgentDispatch(runDir, action, checkpoint);
  }

  private async buildAgentDispatch(
    runDir: string,
    action: EffectAction,
    checkpoint: ExecutionCheckpoint,
  ): Promise<DriverResult> {
    if (!checkpoint.ownerName || !checkpoint.dispatchToken) {
      return {
        state: "operator_attention",
        effectId: action.effectId,
        reason: `Agent effect ${action.effectId} has an incomplete durable dispatch checkpoint`,
      };
    }
    const descriptor: AgentBridgeDescriptor = {
      runDir,
      effectId: action.effectId,
      invocationKey: action.invocationKey,
      ownerName: checkpoint.ownerName,
      dispatchToken: checkpoint.dispatchToken,
      attempt: checkpoint.attempt ?? 1,
      model: checkpoint.requestedModel,
    };
    const outputSchema = readOutputSchema(action.taskDef ?? {});
    const taskItem = {
      name: checkpoint.ownerName,
      agent: "babysitter-task" as const,
      task: buildAgentPrompt(action, descriptor),
      ...(outputSchema ? { outputSchema, schemaMode: "strict" as const } : {}),
    };
    const dispatch: Extract<DriverResult, { state: "agent" }> = {
      state: "agent",
      effectId: action.effectId,
      invocationKey: action.invocationKey,
      task: {
        context: `Execute exactly one Babysitter effect for run ${path.basename(runDir)}. The plugin owns posting and continuation; do not call Babysitter CLI commands.`,
        tasks: [taskItem],
      },
    };
    const taskEnvelopeSha256 = sha256(Buffer.from(stableJsonStringify(dispatch.task), "utf8"));
    if (checkpoint.taskEnvelopeSha256 !== taskEnvelopeSha256 || checkpoint.attemptState !== "dispatched") {
      await writeJsonAtomic(executionPath(runDir, action.effectId), {
        ...checkpoint,
        taskEnvelopeSha256,
        attemptState: "dispatched",
        attemptUpdatedAt: this.now().toISOString(),
      } satisfies ExecutionCheckpoint);
    }
    return dispatch;
  }

  private async recoverCompletedOutput(
    runDir: string,
    checkpoint: ExecutionCheckpoint,
    signal?: AbortSignal,
  ): Promise<ExecutionCheckpoint | null> {
    const outputPath = await resolveRunRelativeReal(runDir, taskRelativeRef(checkpoint.effectId, "output.json"));
    const hasAuthenticatedAgentOutput = checkpoint.authenticatedOutputSha256 !== undefined && (
      checkpoint.attemptState === "completion_authenticated" ||
      checkpoint.attemptState === "completed"
    );
    if (checkpoint.kind === "agent" && !hasAuthenticatedAgentOutput) {
      if (checkpoint.state === "completed" && await hasMatchingCommittedArtifact(runDir, checkpoint)) {
        return checkpoint;
      }
      try {
        await fs.access(outputPath);
      } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
      }
      throw new DriverError(
        `Unauthenticated durable output exists for agent effect ${checkpoint.effectId}; refusing recovery`,
        checkpoint.effectId,
      );
    }
    let bytes: Buffer;
    try {
      bytes = await fs.readFile(outputPath);
      JSON.parse(bytes.toString("utf8"));
    } catch (error) {
      if (isNotFound(error)) return null;
      throw new DriverError(`Durable output for effect ${checkpoint.effectId} is unreadable: ${String(error)}`, checkpoint.effectId);
    }
    if (bytes.length === 0) return null;
    const outputSha256 = sha256(bytes);
    if (checkpoint.outputSha256 && checkpoint.outputSha256 !== outputSha256) {
      throw new DriverError(`Durable output checksum mismatch for effect ${checkpoint.effectId}`, checkpoint.effectId);
    }
    if (checkpoint.authenticatedOutputSha256 && checkpoint.authenticatedOutputSha256 !== outputSha256) {
      throw new DriverError(`Authenticated output checksum mismatch for effect ${checkpoint.effectId}`, checkpoint.effectId);
    }
    const completed: ExecutionCheckpoint = {
      ...checkpoint,
      state: "completed",
      attemptState: checkpoint.kind === "agent" ? "completed" : checkpoint.attemptState,
      finishedAt: checkpoint.finishedAt ?? this.now().toISOString(),
      outputRef: checkpoint.outputRef ?? taskRelativeRef(checkpoint.effectId, "output.json"),
      outputSha256,
    };
    if (checkpoint.kind === "shell" && checkpoint.state !== "completed") {
      if (!await this.hasCommittedResult(runDir, completed, signal)) return null;
    }
    if (checkpoint.state !== "completed" || checkpoint.outputRef !== completed.outputRef || !checkpoint.outputSha256) {
      await writeJsonAtomic(executionPath(runDir, checkpoint.effectId), completed);
    }
    return completed;
  }

  private async hasCommittedResult(
    runDir: string,
    checkpoint: ExecutionCheckpoint,
    signal?: AbortSignal,
  ): Promise<boolean> {
    if (!await hasMatchingCommittedArtifact(runDir, checkpoint)) return false;
    const shown = await this.dependencies.runCli(["task:show", runDir, checkpoint.effectId, "--json"], undefined, signal);
    if (shown.code !== 0) {
      throw new DriverError(
        `Cannot verify committed state for effect ${checkpoint.effectId}: ${boundedDiagnostic(shown.stderr || shown.stdout)}`,
        checkpoint.effectId,
      );
    }
    const payload = parseCliJson<JsonObject>(shown.stdout, "task:show");
    const shownEffect = readObject(payload.effect);
    const status = shownEffect?.status;
    if (status !== "resolved_ok" && status !== "resolved_error") return false;
    const canonicalResultRef = taskRelativeRef(checkpoint.effectId, "result.json");
    if (
      shownEffect?.effectId !== checkpoint.effectId ||
      shownEffect.invocationKey !== checkpoint.invocationKey
    ) {
      throw new DriverError(
        `task:show identity conflicts with committed result for effect ${checkpoint.effectId}`,
        checkpoint.effectId,
      );
    }
    if (shownEffect.resultRef !== canonicalResultRef) {
      throw new DriverError(
        `task:show resultRef conflicts with canonical committed result for effect ${checkpoint.effectId}`,
        checkpoint.effectId,
      );
    }
    const expectedStatus = checkpoint.resultStatus === "error" ? "resolved_error" : "resolved_ok";
    if (status !== expectedStatus) {
      throw new DriverError(
        `task:show status conflicts with committed result for effect ${checkpoint.effectId}`,
        checkpoint.effectId,
      );
    }
    return true;
  }

  private async postCompletedCheckpoint(
    runDir: string,
    checkpoint: ExecutionCheckpoint,
    signal?: AbortSignal,
  ): Promise<boolean> {
    if (checkpoint.state !== "completed" || !checkpoint.outputRef) {
      throw new DriverError(`Effect ${checkpoint.effectId} has no completed durable output`, checkpoint.effectId);
    }
    if (await this.hasCommittedResult(runDir, checkpoint, signal)) {
      await this.emitProgress(runDir, "post", "completed", "Journal already contains the committed effect result", checkpoint);
      return false;
    }

    await readCheckpointOutputBytes(runDir, checkpoint);
    const resultStatus = checkpoint.resultStatus ?? "ok";
    const outputPath = await resolveRunRelativeReal(runDir, checkpoint.outputRef);
    const fileFlag = resultStatus === "error" ? "--error" : "--value";
    const checksumFlag = resultStatus === "error" ? "--error-sha256" : "--value-sha256";
    const args = [
      "task:post",
      runDir,
      checkpoint.effectId,
      "--status",
      resultStatus,
      fileFlag,
      outputPath,
      checksumFlag,
      checkpoint.outputSha256!,
      "--invocation-key",
      checkpoint.invocationKey,
      "--started-at",
      checkpoint.startedAt,
      "--finished-at",
      checkpoint.finishedAt ?? this.now().toISOString(),
      "--json",
    ];
    if (checkpoint.stdoutRef) {
      args.push("--stdout-file", await resolveRunRelativeReal(runDir, checkpoint.stdoutRef));
    }
    if (checkpoint.stderrRef) {
      args.push("--stderr-file", await resolveRunRelativeReal(runDir, checkpoint.stderrRef));
    }

    const result = await this.dependencies.runCli(args, undefined, signal);
    if (result.code !== 0) {
      if (await this.hasCommittedResult(runDir, checkpoint, signal)) {
        await this.emitProgress(runDir, "post", "completed", "Recovered a concurrently committed effect result", checkpoint);
        return false;
      }
      throw new DriverError(`task:post failed for effect ${checkpoint.effectId}: ${boundedDiagnostic(result.stderr || result.stdout)}`, checkpoint.effectId);
    }
    if (!await this.hasCommittedResult(runDir, checkpoint, signal)) {
      throw new DriverError(
        `task:post exited successfully without a checkpoint-matching committed result for effect ${checkpoint.effectId}`,
        checkpoint.effectId,
      );
    }
    const posted = { ...checkpoint, postedAt: this.now().toISOString() };
    await writeJsonAtomic(executionPath(runDir, checkpoint.effectId), posted);
    await this.emitProgress(
      runDir,
      "post",
      resultStatus === "error" ? "failed" : "completed",
      resultStatus === "error"
        ? "Effect failure committed to the authoritative journal"
        : "Effect result committed to the authoritative journal",
      posted,
    );
    return true;
  }
  private async emitProgress(
    runDir: string,
    stage: DriverProgressStage,
    state: DriverProgressState,
    message: string,
    identity?: Pick<EffectAction, "effectId" | "invocationKey" | "kind">,
    shellProgress?: ShellExecutionProgress,
  ): Promise<void> {
    const runId = path.basename(runDir);
    const key = `${runId}:${identity?.effectId ?? "$run"}`;
    const scope = this.progressOperation.getStore();
    const operationId = scope?.operationId;
    const safeMessage = sanitizeProgressText(message);
    const signature = [
      stage,
      state,
      safeMessage,
      shellProgress?.elapsedMs ?? "",
      shellProgress?.stdoutBytes ?? "",
      shellProgress?.stderrBytes ?? "",
      shellProgress?.stdoutTruncated ?? "",
      shellProgress?.stderrTruncated ?? "",
      identity?.invocationKey ?? "",
    ].join("\u0000");
    const stateKey = `${operationId ?? "$unowned"}:${key}`;
    if (this.progressSignatures.get(stateKey) === signature) return;
    this.progressSignatures.set(stateKey, signature);
    scope?.signatureKeys.add(stateKey);
    const progress: DriverProgress = {
      schemaVersion: DRIVER_SCHEMA_VERSION,
      key,
      sequence: (this.progressSequences.get(stateKey) ?? 0) + 1,
      runId,
      runDir,
      ...(identity?.effectId ? { effectId: identity.effectId } : {}),
      ...(operationId ? { operationId } : {}),
      stage,
      state,
      message: safeMessage,
      ...(shellProgress ? {
        elapsedMs: shellProgress.elapsedMs,
        stdoutBytes: shellProgress.stdoutBytes,
        stderrBytes: shellProgress.stderrBytes,
        stdoutTruncated: shellProgress.stdoutTruncated,
        stderrTruncated: shellProgress.stderrTruncated,
      } : {}),
      observedAt: this.now().toISOString(),
    };
    this.progressSequences.set(stateKey, progress.sequence);
    scope?.sequenceKeys.add(stateKey);
    await this.notifyProgressListener(this.dependencies.onProgress, progress);
    for (const listener of this.progressListeners) {
      await this.notifyProgressListener(listener, progress);
    }
  }
  private async notifyProgressListener(
    listener: DriverProgressListener | undefined,
    progress: DriverProgress,
  ): Promise<void> {
    if (!listener) return;
    try {
      await listener(progress);
    } catch (error) {
      if (this.dependencies.onProgressError) {
        try {
          await this.dependencies.onProgressError(error, progress);
          return;
        } catch {
          // Fall through to the non-throwing diagnostic sink.
        }
      }
      console.warn(
        `Babysitter progress listener failed: ${sanitizeProgressText(error instanceof Error ? error.message : String(error))}`,
      );
    }
  }
  private async withEffectLock<T>(
    runDir: string,
    effectId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const key = `${path.resolve(runDir)}\u0000${effectId}`;
    const predecessor = this.effectLocks.get(key) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const tail = predecessor.catch(() => undefined).then(() => gate);
    this.effectLocks.set(key, tail);
    await predecessor.catch(() => undefined);
    try {
      return await operation();
    } finally {
      release();
      if (this.effectLocks.get(key) === tail) this.effectLocks.delete(key);
    }
  }
}

export interface ProjectionTodoItem {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled" | "abandoned";
}

export interface ProjectionTodoPhase {
  id: string;
  name: string;
  tasks: ProjectionTodoItem[];
}

interface ProjectedEffect {
  effectId: string;
  invocationKey?: string;
  kind: string;
  label: string;
  status: ProjectionTodoItem["status"];
}

export async function reconstructBabysitterProjection(runDirInput: string): Promise<ProjectionTodoPhase[]> {
  const runDir = path.resolve(runDirInput);
  const journalDir = path.join(runDir, "journal");
  let journalFiles: string[];
  try {
    journalFiles = (await fs.readdir(journalDir))
      .filter((name) => name.endsWith(".json"))
      .sort((left, right) => left.localeCompare(right));
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }

  const effects = new Map<string, ProjectedEffect>();
  let runState: "active" | "completed" | "failed" | "halted" = "active";
  for (const filename of journalFiles) {
    const event = await readJsonIfExists<JsonObject>(path.join(journalDir, filename));
    const data = readObject(event?.data);
    const type = typeof event?.type === "string" ? event.type : "";
    const effectId = typeof data?.effectId === "string" ? data.effectId : undefined;
    if (type === "EFFECT_REQUESTED" && effectId) {
      const kind = typeof data?.kind === "string" ? data.kind : "effect";
      const taskId = typeof data?.taskId === "string" ? data.taskId : effectId;
      effects.set(effectId, {
        effectId,
        ...(typeof data?.invocationKey === "string" ? { invocationKey: data.invocationKey } : {}),
        kind,
        label: `${kind}: ${taskId}`,
        status: "pending",
      });
      continue;
    }
    if (type === "EFFECT_RESOLVED" && effectId) {
      const effect = effects.get(effectId);
      if (effect) effect.status = data?.status === "ok" ? "completed" : "abandoned";
      continue;
    }
    if (type === "EFFECT_CANCELLED" && effectId) {
      const effect = effects.get(effectId);
      if (effect) effect.status = "abandoned";
      continue;
    }
    if (type === "RUN_COMPLETED") runState = "completed";
    else if (type === "RUN_FAILED") runState = "failed";
    else if (type === "RUN_HALTED") runState = "halted";
  }

  for (const effect of effects.values()) {
    if (effect.status !== "pending") continue;
    const checkpoint = await readCheckpoint(runDir, effect.effectId);
    if (
      !checkpoint ||
      checkpoint.schemaVersion !== DRIVER_SCHEMA_VERSION ||
      checkpoint.effectId !== effect.effectId ||
      checkpoint.kind !== (effect.kind === "skill" ? "agent" : effect.kind) ||
      (effect.invocationKey !== undefined && checkpoint.invocationKey !== effect.invocationKey)
    ) continue;
    if (checkpoint.state === "completed") {
      effect.status = "in_progress";
    } else if (checkpoint.attemptState === "failed" || checkpoint.attemptState === "aborted") {
      effect.status = "failed";
      effect.label += ` (${checkpoint.attemptState}, attempt ${checkpoint.attempt ?? 1})`;
    } else if (checkpoint.attemptState === "cancelled") {
      effect.status = "cancelled";
      effect.label += ` (cancelled, attempt ${checkpoint.attempt ?? 1})`;
    } else if (checkpoint.attemptState) {
      effect.status = "in_progress";
      if (checkpoint.attemptState === "awaiting_late_owner") {
        effect.label += ` (awaiting late owner, attempt ${checkpoint.attempt ?? 1})`;
      } else if (checkpoint.attempt && checkpoint.attempt > 1) {
        effect.label += ` (attempt ${checkpoint.attempt})`;
      }
    }
  }

  if (effects.size === 0) return [];
  const stateLabel = runState === "active" ? "" : ` — ${runState}`;
  return [{
    id: `run:${path.basename(runDir)}`,
    name: `Babysitter ${path.basename(runDir)}${stateLabel}`,
    tasks: [...effects.values()].map(({ effectId, label, status }) => ({ id: effectId, content: label, status })),
  }];
}

export async function executeHostShell(
  action: EffectAction,
  defaultCwd: string,
  signal: AbortSignal | undefined,
  execute: ShellHostExecutor,
  progressOptions: ShellExecutionProgressOptions = {},
): Promise<ShellExecutionResult> {
  const shell = readObject(action.taskDef?.shell) ?? readObject(action.taskDef?.metadata) ?? {};
  const command = typeof shell.command === "string" && shell.command.trim() ? shell.command : "echo";
  const rawArgs = shell.args;
  const hasExplicitArgs = Array.isArray(rawArgs);
  if (hasExplicitArgs && rawArgs.some((value) => typeof value !== "string")) {
    throw new Error("Every shell argument must be a string");
  }
  const args = hasExplicitArgs ? rawArgs as string[] : [];
  const interpreter = shell.interpreter;
  if (interpreter !== undefined && interpreter !== "bash") {
    throw new Error('Deterministic shell task interpreter must be "bash" when provided');
  }
  if (interpreter === "bash" && hasExplicitArgs) {
    throw new Error('Deterministic Bash shell tasks must put the complete trusted program in command without args');
  }
  const trustedBashProgram = interpreter === "bash";
  if (!hasExplicitArgs && !trustedBashProgram && !/^[A-Za-z0-9_./:+-]+$/.test(command)) {
    throw new Error('Shell source requires interpreter: "bash" as an explicit trust boundary; otherwise provide structured command and args');
  }
  const executable = trustedBashProgram ? "/bin/bash" : command;
  const executableArgs = trustedBashProgram ? ["-lc", command] : args;
  const cwd = typeof shell.cwd === "string" ? path.resolve(defaultCwd, shell.cwd) : defaultCwd;
  if (shell.env !== undefined) {
    throw new Error("Deterministic shell task env overrides are unsupported by the host-owned OMP executor");
  }
  const timeoutMs = positiveInteger(shell.timeoutMs ?? shell.timeout, DEFAULT_SHELL_TIMEOUT_MS);
  const now = progressOptions.now ?? Date.now;
  const scheduler = progressOptions.scheduler ?? {
    setInterval: (callback: () => void, intervalMs: number) => {
      const timer = setInterval(callback, intervalMs);
      timer.unref();
      return timer;
    },
    clearInterval: (handle: unknown) => clearInterval(handle as NodeJS.Timeout),
  };
  const startedAtMs = now();
  const startedAt = new Date(startedAtMs).toISOString();
  const notifyProgress = (
    reason: ShellExecutionProgress["reason"],
    stdoutBytes = 0,
    stderrBytes = 0,
    stdoutTruncated = false,
    stderrTruncated = false,
  ): void => {
    try {
      progressOptions.onProgress?.({
        state: "running",
        reason,
        elapsedMs: Math.max(0, now() - startedAtMs),
        stdoutBytes,
        stderrBytes,
        stdoutTruncated,
        stderrTruncated,
      });
    } catch {
      // Observability is best-effort and must not alter shell execution.
    }
  };
  signal?.throwIfAborted();
  notifyProgress("start");
  const progressTimer = progressOptions.onProgress
    ? scheduler.setInterval(() => notifyProgress("heartbeat"), SHELL_HEARTBEAT_INTERVAL_MS)
    : undefined;
  try {
    const result = await execute(executable, executableArgs, { cwd, timeout: timeoutMs, signal });
    if (signal?.aborted) throw signal.reason ?? new DOMException("The operation was aborted", "AbortError");
    const boundedStdout = boundCapturedText(result.stdout, MAX_CAPTURE_BYTES);
    const boundedStderr = boundCapturedText(result.stderr, MAX_CAPTURE_BYTES);
    notifyProgress(
      "output",
      boundedStdout.totalBytes,
      boundedStderr.totalBytes,
      boundedStdout.truncated,
      boundedStderr.truncated,
    );
    return {
      exitCode: result.killed ? 124 : result.code,
      stdout: boundedStdout.text,
      stderr: boundedStderr.text,
      timedOut: result.killed,
      stdoutTruncated: boundedStdout.truncated,
      stderrTruncated: boundedStderr.truncated,
      startedAt,
      finishedAt: new Date(now()).toISOString(),
    };
  } finally {
    if (progressTimer !== undefined) scheduler.clearInterval(progressTimer);
  }
}

function missingHostShellExecutor(): Promise<ShellExecutionResult> {
  throw new Error("Deterministic shell execution requires an injected host executor");
}

function boundCapturedText(value: string, limit: number): {
  text: string;
  totalBytes: number;
  truncated: boolean;
} {
  const totalBytes = Buffer.byteLength(value, "utf8");
  if (totalBytes <= limit) return { text: value, totalBytes, truncated: false };
  let capturedBytes = 0;
  let end = 0;
  while (end < value.length) {
    const codePoint = value.codePointAt(end)!;
    const codePointBytes = codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
    if (capturedBytes + codePointBytes > limit) break;
    capturedBytes += codePointBytes;
    end += codePoint > 0xffff ? 2 : 1;
  }
  return { text: value.slice(0, end), totalBytes, truncated: true };
}
function buildAgentPrompt(action: EffectAction, descriptor: AgentBridgeDescriptor): string {
  const taskDef = action.taskDef ?? {};
  const agent = readObject(taskDef.agent) ?? {};
  const metadata = readObject(taskDef.metadata) ?? {};
  const prompt = typeof agent.prompt === "string"
    ? agent.prompt
    : readObject(agent.prompt)
      ? `Structured agent prompt (JSON):\n${stableJsonStringify(agent.prompt)}`
      : typeof metadata.prompt === "string"
        ? metadata.prompt
        : typeof taskDef.description === "string"
          ? taskDef.description
          : typeof taskDef.title === "string"
            ? taskDef.title
            : `Complete Babysitter effect ${action.effectId}`;
  const preview = humanTaskPreview(action, prompt);
  return [
    preview,
    "",
    "Complete only the assignment below. Return the final effect value through the required structured yield path.",
    "Do not call babysitter task:post or run:iterate; the deterministic driver is the sole result writer.",
    "Yield the final effect value normally through the required structured output contract. The authenticated blocking task tool result is the only completion channel.",
    `BABYSITTER_OMP_BRIDGE ${JSON.stringify(descriptor)}`,
    "",
    prompt,
  ].join("\n");
}

function humanTaskPreview(action: EffectAction, prompt: string): string {
  const taskDef = action.taskDef ?? {};
  const structuredPrompt = readObject(readObject(taskDef.agent)?.prompt);
  const metadata = readObject(taskDef.metadata);
  const candidates = [
    structuredPrompt?.task,
    structuredPrompt?.request,
    structuredPrompt?.goal,
    structuredPrompt?.title,
    structuredPrompt?.description,
    taskDef.description,
    taskDef.title,
    metadata?.prompt,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim().split(/\r?\n/, 1)[0];
  }
  if (!structuredPrompt) {
    const firstPromptLine = prompt.split(/\r?\n/).find((line) => line.trim());
    if (firstPromptLine) return firstPromptLine.trim();
  }
  return `Complete Babysitter effect ${action.effectId}`;
}

function parseAgentBridgeInput(input: JsonObject): AgentBridgeDescriptor | null {
  const item = readTaskItem(input);
  if (
    !item ||
    item.agent !== "babysitter-task" ||
    typeof item.name !== "string" ||
    typeof item.task !== "string"
  ) return null;
  const prefix = "BABYSITTER_OMP_BRIDGE ";
  const bridgeLines = item.task
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith(prefix));
  if (bridgeLines.length !== 1) return null;
  try {
    const parsed = JSON.parse(bridgeLines[0].slice(prefix.length)) as AgentBridgeDescriptor;
    if (
      typeof parsed.runDir !== "string" ||
      typeof parsed.effectId !== "string" ||
      typeof parsed.invocationKey !== "string" ||
      typeof parsed.ownerName !== "string" ||
      typeof parsed.dispatchToken !== "string" ||
      item.name !== parsed.ownerName
    ) return null;
    return { ...parsed, runDir: path.resolve(parsed.runDir) };
  } catch {
    return null;
  }
}

function containsAgentBridgeMarker(input: JsonObject): boolean {
  const candidates = [
    input,
    ...(Array.isArray(input.tasks) ? input.tasks.map((value) => readObject(value)).filter(Boolean) : []),
  ];
  return candidates.some((candidate) =>
    typeof candidate?.task === "string" &&
    candidate.task.split(/\r?\n/).some((line) => line.trim().startsWith("BABYSITTER_OMP_BRIDGE "))
  );
}



function parseAgentOwnerControlInput(
  input: AgentRetryInput | AgentCancelInput,
): AgentBridgeDescriptor | null {
  if (
    typeof input.runDir !== "string" ||
    typeof input.effectId !== "string" ||
    typeof input.invocationKey !== "string" ||
    typeof input.ownerName !== "string" ||
    typeof input.dispatchToken !== "string" ||
    (input.attempt !== undefined && (!Number.isInteger(input.attempt) || input.attempt < 1))
  ) return null;
  return {
    runDir: path.resolve(input.runDir),
    effectId: input.effectId,
    invocationKey: input.invocationKey,
    ownerName: input.ownerName,
    dispatchToken: input.dispatchToken,
    ...(typeof input.attempt === "number" ? { attempt: input.attempt } : {}),
    ...(typeof input.model === "string" ? { model: input.model } : {}),
  };
}

function readTaskItem(
  input: JsonObject,
): (JsonObject & { task?: string; agent?: string; model?: string; outputSchema?: unknown; schemaMode?: unknown }) | null {
  if (!Array.isArray(input.tasks) || input.tasks.length !== 1) return null;
  return readObject(input.tasks[0]);
}

function owningAgentRef(
  details: unknown,
  owner: AgentOwner,
): { ref?: `agent://${string}`; invalid: boolean } {
  const object = readObject(details);
  const results = Array.isArray(object?.results) ? object.results : [];
  if (results.length !== 1) return { invalid: false };
  const result = readObject(results[0]);
  if (!result) return { invalid: false };
  const hasIdentity = "id" in result || "agent" in result;
  if (!hasIdentity) return { invalid: false };
  const agentId = result.id;
  if (
    result.agent !== "babysitter-task" ||
    typeof agentId !== "string" ||
    !isAllocatedOwnerName(agentId, owner.ownerName)
  ) return { invalid: true };
  return { ref: `agent://${agentId}`, invalid: false };
}
function classifyOwnerOutcome(
  event: AgentToolResultEvent,
): "failed" | "aborted" | "cancelled" | "awaiting_late_owner" {
  const object = readObject(event.details);
  const results = Array.isArray(object?.results) ? object.results : [];
  const result = results.length === 1 ? readObject(results[0]) : null;
  const reason = `${typeof result?.error === "string" ? result.error : ""} ${typeof object?.error === "string" ? object.error : ""}`.toLowerCase();
  if (result?.cancelled === true || reason.includes("cancel")) return "cancelled";
  if (reason.includes("parent wait interrupted") || reason.includes("lost result")) {
    return "awaiting_late_owner";
  }
  if (result?.aborted === true || reason.includes("abort") || reason.includes("interrupt")) return "aborted";
  if (result && (
    typeof result.error === "string" ||
    (typeof result.exitCode === "number" && result.exitCode !== 0)
  )) return "failed";
  return "awaiting_late_owner";
}
function extractSingleAgentResult(details: unknown): { ok: true; value: unknown } | { ok: false; reason: string } {
  const object = readObject(details);
  const results = Array.isArray(object?.results) ? object.results : [];
  if (results.length !== 1) return { ok: false, reason: "Blocking task result did not contain exactly one subagent result" };
  const result = readObject(results[0]);
  if (!result) return { ok: false, reason: "Blocking task returned an invalid result payload" };
  if (result.aborted === true) return { ok: false, reason: "Blocking task was aborted; effect remains unresolved" };
  if (typeof result.exitCode === "number" && result.exitCode !== 0) {
    return { ok: false, reason: typeof result.error === "string" ? result.error : `Blocking task exited ${result.exitCode}` };
  }
  if (!("output" in result)) return { ok: false, reason: "Blocking task result is missing output" };
  const output = result.output;
  if (typeof output !== "string") return { ok: true, value: output };
  try {
    return { ok: true, value: JSON.parse(output) };
  } catch {
    return { ok: true, value: output };
  }
}


function stableJsonStringify(value: unknown): string {
  const normalize = (candidate: unknown): unknown => {
    if (Array.isArray(candidate)) return candidate.map(normalize);
    const object = readObject(candidate);
    if (!object) return candidate;
    return Object.fromEntries(Object.keys(object).sort().map((key) => [key, normalize(object[key])]));
  };
  return JSON.stringify(normalize(value), null, 2);
}


function validateJsonSchema(value: unknown, schema: JsonObject | undefined): string[] {
  if (!schema) return [];
  try {
    const result = fromJSONSchema(schema).safeParse(value);
    if (result.success) return [];
    return result.error.issues.map((issue) => {
      const location = issue.path.length > 0 ? `root.${issue.path.join(".")}` : "root";
      return `${location}: ${issue.message}`;
    });
  } catch {
    return ["The configured output schema is invalid or unsupported"];
  }
}

async function shellCommandOutputFingerprint(
  runDir: string,
  action: EffectAction,
): Promise<ShellCommandOutput | null> {
  const io = readObject(action.taskDef?.io);
  const selectedRef = typeof io?.outputJsonPath === "string" ? io.outputJsonPath : undefined;
  if (!selectedRef) return null;

  const outputPath = await resolveRunRelativeReal(runDir, selectedRef);
  const beforeSnapshot = await shellOutputSnapshot(runDir, selectedRef, action.effectId);
  const classification = await classifyShellOutputTarget(runDir, action.effectId, beforeSnapshot ?? { realPath: outputPath });
  const { kind } = classification;
  if (beforeSnapshot && kind !== "external") {
    const expectedRealPath = await expectedRealPathWithoutInRunAliases(runDir, outputPath);
    if (beforeSnapshot.realPath !== expectedRealPath) {
      throw new DriverError(
        `Shell output JSON for effect ${action.effectId} is a symlink alias to canonical engine-owned ${kind === "canonical_output" ? "output.json" : "result.json"}`,
        action.effectId,
      );
    }
    if (beforeSnapshot.realPath !== classification.canonicalRealPath) {
      throw new DriverError(
        `Shell output JSON for effect ${action.effectId} is a hard-link alias to canonical engine-owned ${kind === "canonical_output" ? "output.json" : "result.json"}`,
        action.effectId,
      );
    }
  }
  return {
    ref: selectedRef,
    path: outputPath,
    before: beforeSnapshot?.fingerprint ?? null,
    beforeBytes: beforeSnapshot?.bytes ?? null,
    kind,
  };
}

async function shellOutputSnapshot(
  runDir: string,
  ref: string,
  effectId: string,
): Promise<{ fingerprint: string; bytes: Buffer; realPath: string; dev: number; ino: number } | null> {
  const filePath = await resolveRunRelativeReal(runDir, ref);
  let handle;
  try {
    handle = await fs.open(filePath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  } catch (error) {
    if (isNotFound(error)) return null;
    if ((error as NodeJS.ErrnoException)?.code === "ELOOP") {
      throw new DriverError(`Shell output JSON for effect ${effectId} is a forbidden final-component symlink alias`, effectId);
    }
    throw error;
  }
  try {
    const before = await handle.stat();
    const bytes = await fs.readFile(handle);
    const after = await handle.stat();
    await resolveRunRelativeReal(runDir, ref);
    const realPath = await fs.realpath(filePath);
    await assertRealPathWithinRun(runDir, realPath, ref);
    const current = await fs.stat(filePath);
    if (
      before.dev !== after.dev ||
      before.ino !== after.ino ||
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs ||
      before.ctimeMs !== after.ctimeMs ||
      current.dev !== after.dev ||
      current.ino !== after.ino
    ) {
      throw new DriverError(`Shell output JSON for effect ${effectId} changed or was replaced during authenticated read`, effectId);
    }
    if (bytes.length > MAX_CAPTURE_BYTES) {
      throw new DriverError(`Shell output JSON for effect ${effectId} exceeds ${MAX_CAPTURE_BYTES} bytes`, effectId);
    }
    return {
      fingerprint: `${after.dev}:${after.ino}:${after.size}:${after.mtimeMs}:${after.ctimeMs}:${sha256(bytes)}`,
      bytes,
      realPath,
      dev: after.dev,
      ino: after.ino,
    };
  } finally {
    await handle.close();
  }
}


async function shellResultValue(
  runDir: string,
  action: EffectAction,
  result: ShellExecutionResult,
  commandOutput: ShellCommandOutput | null,
): Promise<ResolvedShellValue> {
  const shell = readObject(action.taskDef?.shell) ?? readObject(action.taskDef?.metadata) ?? {};
  const expectedExitCode = typeof shell.expectedExitCode === "number" ? shell.expectedExitCode : 0;
  const failed = result.timedOut || result.exitCode !== expectedExitCode;
  const failedValue = {
    success: false,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.timedOut
      ? `Shell command timed out`
      : `Shell command exited with code ${result.exitCode}; expected ${expectedExitCode}`,
    timedOut: result.timedOut,
    stdoutTruncated: result.stdoutTruncated,
    stderrTruncated: result.stderrTruncated,
  };

  if (commandOutput) {
    const afterSnapshot = await shellOutputSnapshot(runDir, commandOutput.ref, action.effectId);
    const changed = afterSnapshot !== null && afterSnapshot.fingerprint !== commandOutput.before;
    const classification = afterSnapshot
      ? await classifyShellOutputTarget(runDir, action.effectId, afterSnapshot)
      : { kind: commandOutput.kind };
    const authenticatedKind = classification.kind;
    if (afterSnapshot && authenticatedKind !== "external") {
      const expectedRealPath = await expectedRealPathWithoutInRunAliases(runDir, commandOutput.path);
      if (afterSnapshot.realPath !== expectedRealPath) {
        throw new DriverError(
          `Shell output JSON for effect ${action.effectId} is a symlink alias to canonical engine-owned ${authenticatedKind === "canonical_output" ? "output.json" : "result.json"}`,
          action.effectId,
        );
      }
      if (afterSnapshot.realPath !== classification.canonicalRealPath) {
        throw new DriverError(
          `Shell output JSON for effect ${action.effectId} is a hard-link alias to canonical engine-owned ${authenticatedKind === "canonical_output" ? "output.json" : "result.json"}`,
          action.effectId,
        );
      }
    }
    if (authenticatedKind !== "external") {
      if (changed) await restoreTransientShellResult(commandOutput);
      if (failed) return { value: failedValue, outputAlreadyDurable: false };
    } else if (failed) {
      return { value: failedValue, outputAlreadyDurable: false };
    } else if (changed && afterSnapshot) {
      let value: unknown;
      try {
        value = JSON.parse(afterSnapshot.bytes.toString("utf8"));
      } catch (error) {
        throw new DriverError(
          `Shell output JSON for effect ${action.effectId} is invalid JSON: ${boundedDiagnostic(error instanceof Error ? error.message : String(error))}`,
          action.effectId,
        );
      }
      return { value, outputAlreadyDurable: false, outputBytes: afterSnapshot.bytes };
    }
    if (authenticatedKind === "external") {
      throw new DriverError(
        `Shell output JSON for effect ${action.effectId} was not created or updated by the command`,
        action.effectId,
      );
    }
  }

  if (failed) return { value: failedValue, outputAlreadyDurable: false };
  if (typeof readObject(action.taskDef?.io)?.outputJsonPath === "string") {
    let value: unknown;
    try {
      value = JSON.parse(result.stdout);
    } catch (error) {
      throw new DriverError(
        `Shell stdout for effect ${action.effectId} must be valid JSON when io.outputJsonPath is declared: ${boundedDiagnostic(error instanceof Error ? error.message : String(error))}`,
        action.effectId,
      );
    }
    return { value, outputAlreadyDurable: false };
  }
  return { value: result.stdout, outputAlreadyDurable: false };
}

async function restoreTransientShellResult(commandOutput: ShellCommandOutput): Promise<void> {
  if (commandOutput.beforeBytes) {
    await writeBytesAtomic(commandOutput.path, commandOutput.beforeBytes);
    return;
  }
  await fs.unlink(commandOutput.path).catch((error: unknown) => {
    if (!isNotFound(error)) throw error;
  });
}

async function classifyShellOutputTarget(
  runDir: string,
  effectId: string,
  authenticated: { realPath: string; dev?: number; ino?: number },
): Promise<ShellOutputClassification> {
  if (authenticated.dev === undefined || authenticated.ino === undefined) {
    for (const artifact of [
      { name: "output.json", kind: "canonical_output" },
      { name: "result.json", kind: "canonical_result" },
    ] as const) {
      const canonicalPath = effectArtifactPath(runDir, effectId, artifact.name);
      if (authenticated.realPath === canonicalPath) {
        return { kind: artifact.kind };
      }
    }
    return { kind: "external" };
  }
  const tasksDir = path.join(runDir, "tasks");
  const entries = await fs.readdir(tasksDir, { withFileTypes: true }).catch((error: unknown) => {
    if (isNotFound(error)) return [];
    throw error;
  });
  const effectDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const candidateEffectId of effectDirs) {
    for (const artifact of [
      { name: "output.json", kind: "canonical_output" },
      { name: "result.json", kind: "canonical_result" },
    ] as const) {
      const candidatePath = effectArtifactPath(runDir, candidateEffectId, artifact.name);
      const candidate = await fs.stat(candidatePath).catch((error: unknown) => {
        if (isNotFound(error)) return null;
        throw error;
      });
      if (
        candidate &&
        candidate.dev === authenticated.dev &&
        candidate.ino === authenticated.ino
      ) {
        return {
          kind: artifact.kind,
          canonicalRealPath: await fs.realpath(candidatePath),
        };
      }
    }
  }
  return { kind: "external" };
}


async function hasMatchingCommittedArtifact(runDir: string, checkpoint: ExecutionCheckpoint): Promise<boolean> {
  const canonicalOutputRef = taskRelativeRef(checkpoint.effectId, "output.json");
  if (checkpoint.outputRef && checkpoint.outputRef !== canonicalOutputRef) {
    throw new DriverError(
      `Execution checkpoint outputRef is not the canonical immutable output for effect ${checkpoint.effectId}`,
      checkpoint.effectId,
    );
  }
  if (checkpoint.stdoutRef) await resolveRunRelativeReal(runDir, checkpoint.stdoutRef);
  if (checkpoint.stderrRef) await resolveRunRelativeReal(runDir, checkpoint.stderrRef);

  const resultPath = await resolveRunRelativeReal(runDir, taskRelativeRef(checkpoint.effectId, "result.json"));
  const result = await readJsonIfExists<JsonObject>(resultPath);
  if (!result) return false;
  const expectedStatus = checkpoint.resultStatus ?? "ok";
  if (
    result.status !== expectedStatus ||
    result.effectId !== checkpoint.effectId ||
    result.invocationKey !== checkpoint.invocationKey
  ) {
    throw new DriverError(
      `Committed result identity conflicts with execution checkpoint for effect ${checkpoint.effectId}`,
      checkpoint.effectId,
    );
  }

  const outputBytes = await readCheckpointOutputBytes(runDir, checkpoint);
  const durableOutput = JSON.parse(outputBytes.toString("utf8")) as unknown;
  let committedValue: unknown;
  if (expectedStatus === "error") {
    committedValue = result.error;
  } else if (typeof result.resultRef === "string") {
    const resultRef = result.resultRef;
    const prefix = `tasks/${checkpoint.effectId}/blobs/result-`;
    const hash = resultRef.startsWith(prefix) && resultRef.endsWith(".json")
      ? resultRef.slice(prefix.length, -".json".length)
      : "";
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      throw new DriverError(
        `Committed resultRef is not a canonical serializer blob for effect ${checkpoint.effectId}`,
        checkpoint.effectId,
      );
    }
    const blobBytes = await fs.readFile(await resolveRunRelativeReal(runDir, resultRef));
    if (sha256(blobBytes) !== hash) {
      throw new DriverError(
        `Committed resultRef hash does not match blob bytes for effect ${checkpoint.effectId}`,
        checkpoint.effectId,
      );
    }
    committedValue = JSON.parse(blobBytes.toString("utf8"));
  } else {
    committedValue = "result" in result ? result.result : result.value;
  }
  const expectedDurableValue = expectedStatus === "error"
    ? serializeCommittedEffectError(durableOutput)
    : durableOutput;
  if (!isDeepStrictEqual(committedValue, expectedDurableValue)) {
    throw new DriverError(
      `Committed result conflicts with immutable durable output for effect ${checkpoint.effectId}`,
      checkpoint.effectId,
    );
  }
  return true;
}

async function readCheckpointOutputBytes(runDir: string, checkpoint: ExecutionCheckpoint): Promise<Buffer> {
  const canonicalOutputRef = taskRelativeRef(checkpoint.effectId, "output.json");
  if (checkpoint.outputRef !== canonicalOutputRef || !checkpoint.outputSha256) {
    throw new DriverError(
      `Execution checkpoint lacks canonical output identity for effect ${checkpoint.effectId}`,
      checkpoint.effectId,
    );
  }
  const snapshot = await shellOutputSnapshot(runDir, canonicalOutputRef, checkpoint.effectId);
  if (!snapshot) {
    throw new DriverError(
      `Execution checkpoint output is missing for effect ${checkpoint.effectId}`,
      checkpoint.effectId,
    );
  }
  if (sha256(snapshot.bytes) !== checkpoint.outputSha256) {
    throw new DriverError(
      `Immutable durable output hash conflicts with execution checkpoint for effect ${checkpoint.effectId}`,
      checkpoint.effectId,
    );
  }
  return snapshot.bytes;
}

function serializeCommittedEffectError(error: unknown): JsonObject {
  const object = readObject(error);
  if (object && "name" in object) {
    const serialized: JsonObject = {
      name: object.name ?? "Error",
      message: object.message ?? "Task failed",
    };
    if (typeof object.stack === "string") serialized.stack = object.stack;
    if (object.data !== undefined) serialized.data = object.data;
    return serialized;
  }
  if (error !== null && typeof error === "object") {
    return {
      name: Array.isArray(error) ? "Array" : "Object",
      message: JSON.stringify(error),
      data: error,
    };
  }
  return {
    name: "Error",
    message: String(error),
  };
}


function validateCheckpointIdentity(checkpoint: ExecutionCheckpoint, action: EffectAction): void {
  if (
    checkpoint.schemaVersion !== DRIVER_SCHEMA_VERSION ||
    checkpoint.effectId !== action.effectId ||
    checkpoint.invocationKey !== action.invocationKey ||
    checkpoint.kind !== (action.kind === "skill" ? "agent" : action.kind)
  ) {
    throw new DriverError(`Execution checkpoint identity mismatch for effect ${action.effectId}`, action.effectId);
  }
}

function validateEffectIdentity(action: EffectAction): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(action.effectId)) {
    throw new DriverError(`Unsafe effect identity ${JSON.stringify(action.effectId)}`, action.effectId);
  }
}

function validateDescriptor(checkpoint: ExecutionCheckpoint, descriptor: AgentBridgeDescriptor): string | null {
  if (
    checkpoint.schemaVersion !== DRIVER_SCHEMA_VERSION ||
    checkpoint.effectId !== descriptor.effectId ||
    checkpoint.invocationKey !== descriptor.invocationKey ||
    checkpoint.ownerName !== descriptor.ownerName ||
    checkpoint.dispatchToken !== descriptor.dispatchToken ||
    checkpoint.requestedModel !== descriptor.model ||
    (descriptor.attempt !== undefined && (checkpoint.attempt ?? 1) !== descriptor.attempt)
  ) return `Agent bridge identity mismatch for effect ${descriptor.effectId}`;
  return null;
}

function readRequestedModel(taskDef: JsonObject): string | undefined {
  const execution = readObject(taskDef.execution);
  if (typeof execution?.model === "string" && execution.model) return execution.model;
  const agent = readObject(taskDef.agent);
  if (typeof agent?.model === "string" && agent.model) return agent.model;
  return undefined;
}

function readOutputSchema(taskDef: JsonObject): JsonObject | undefined {
  const direct = readObject(taskDef.outputSchema);
  if (direct) return direct;
  return readObject(readObject(taskDef.agent)?.outputSchema) ?? undefined;
}

function stableAgentName(effectId: string): string {
  const safe = effectId.replace(/[^A-Za-z0-9_-]/g, "-");
  return `Babysitter-${safe}`;
}

function isAllocatedOwnerName(agentId: string, requestedName: string): boolean {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(agentId)) return false;
  if (agentId === requestedName) return true;
  if (!agentId.startsWith(`${requestedName}-`)) return false;
  const suffix = agentId.slice(requestedName.length);
  return /^-[2-9]\d*$/.test(suffix);
}

function effectTaskDir(runDir: string, effectId: string): string {
  return path.join(runDir, "tasks", effectId);
}

function effectArtifactPath(runDir: string, effectId: string, filename: string): string {
  return path.join(effectTaskDir(runDir, effectId), filename);
}

function executionPath(runDir: string, effectId: string): string {
  return effectArtifactPath(runDir, effectId, "execution.json");
}

function agentOwnerPath(runDir: string, effectId: string): string {
  return effectArtifactPath(runDir, effectId, "agent-owner.json");
}

function taskRelativeRef(effectId: string, filename: string): string {
  return `tasks/${effectId}/${filename}`;
}

function resolveRunRelative(runDir: string, candidate: string): string {
  if (
    !candidate ||
    candidate.includes("\0") ||
    path.isAbsolute(candidate) ||
    path.win32.isAbsolute(candidate)
  ) {
    throw new DriverError(`Artifact ref must be relative to the run directory: ${JSON.stringify(candidate)}`);
  }
  const normalizedCandidate = candidate.replaceAll("\\", "/");
  const resolved = path.resolve(runDir, normalizedCandidate);
  const relative = path.relative(path.resolve(runDir), resolved);
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new DriverError(`Artifact ref escapes the run directory: ${JSON.stringify(candidate)}`);
  }
  return resolved;
}

async function ensureEffectTaskDir(runDir: string, effectId: string): Promise<void> {
  const taskRef = `tasks/${effectId}`;
  const taskDir = await resolveRunRelativeReal(runDir, taskRef);
  await fs.mkdir(taskDir, { recursive: true });
  await resolveRunRelativeReal(runDir, taskRef);
}

async function expectedRealPathWithoutInRunAliases(runDir: string, lexicalPath: string): Promise<string> {
  const relative = path.relative(path.resolve(runDir), lexicalPath);
  return path.join(await fs.realpath(runDir), relative);
}

async function resolveRunRelativeReal(runDir: string, candidate: string): Promise<string> {
  const resolved = resolveRunRelative(runDir, candidate);
  const realRun = await fs.realpath(runDir);
  let probe = resolved;
  while (true) {
    try {
      const realProbe = await fs.realpath(probe);
      const relative = path.relative(realRun, realProbe);
      if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        throw new DriverError(`Artifact ref real path escapes the run directory: ${JSON.stringify(candidate)}`);
      }
      return resolved;
    } catch (error) {
      if (!isNotFound(error)) throw error;
      const parent = path.dirname(probe);
      if (parent === probe) throw error;
      probe = parent;
    }
  }
}

async function assertRealPathWithinRun(runDir: string, realPath: string, candidate: string): Promise<void> {
  const relative = path.relative(await fs.realpath(runDir), realPath);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new DriverError(`Artifact ref real path escapes the run directory: ${JSON.stringify(candidate)}`);
  }
}


async function readCheckpoint(runDir: string, effectId: string): Promise<ExecutionCheckpoint | null> {
  const checkpointPath = await resolveRunRelativeReal(runDir, taskRelativeRef(effectId, "execution.json"));
  return await readJsonIfExists<ExecutionCheckpoint>(checkpointPath);
}

async function writeJsonExclusive(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const handle = await fs.open(filePath, "wx");
  try {
    await handle.writeFile(JSON.stringify(value, null, 2) + "\n", "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function writeJsonExclusiveFactory<T>(filePath: string, create: () => T): Promise<T> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const handle = await fs.open(filePath, "wx");
  try {
    const value = create();
    await handle.writeFile(JSON.stringify(value, null, 2) + "\n", "utf8");
    await handle.sync();
    return value;
  } finally {
    await handle.close();
  }
}

async function writeImmutableJson(filePath: string, value: unknown): Promise<void> {
  const bytes = JSON.stringify(value, null, 2) + "\n";
  try {
    await writeTextExclusive(filePath, bytes);
  } catch (error) {
    if (!isAlreadyExists(error)) throw error;
    const existing = await fs.readFile(filePath, "utf8");
    if (existing !== bytes) {
      throw new DriverError(`Refusing to overwrite immutable result artifact ${filePath}`);
    }
  }
}

async function writeImmutableBytes(filePath: string, bytes: Buffer): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temp = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  const handle = await fs.open(temp, "wx");
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await fs.link(temp, filePath);
  } catch (error) {
    if (!isAlreadyExists(error)) throw error;
    const existing = await fs.readFile(filePath);
    if (!existing.equals(bytes)) {
      throw new DriverError(`Refusing to overwrite immutable result artifact ${filePath}`);
    }
  } finally {
    await fs.unlink(temp).catch((error: unknown) => {
      if (!isNotFound(error)) throw error;
    });
  }
}

async function writeTextExclusive(filePath: string, value: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const handle = await fs.open(filePath, "wx");
  try {
    await handle.writeFile(value, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  await writeTextAtomic(filePath, JSON.stringify(value, null, 2) + "\n");
}

async function writeTextAtomic(filePath: string, value: string): Promise<void> {
  await writeBytesAtomic(filePath, Buffer.from(value, "utf8"));
}

async function writeBytesAtomic(filePath: string, value: Buffer): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temp = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  const handle = await fs.open(temp, "wx");
  try {
    await handle.writeFile(value);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(temp, filePath);
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function readJsonIfExists<T>(filePath: string): Promise<T | null> {
  try {
    return await readJson<T>(filePath);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function readObject(value: unknown): JsonObject | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : null;
}


function positiveInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function parseCliJson<T>(stdout: string, operation: string): T {
  try {
    return JSON.parse(stdout) as T;
  } catch (error) {
    throw new DriverError(
      `${operation} returned invalid JSON: ${boundedDiagnostic(stdout)} (${String(error)})`,
      undefined,
      "Deterministic driver failed",
    );
  }
}

function redactSensitiveText(value: string): string {
  return value
    .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\b(token|secret|password|authorization|api[-_]?key)\s*[:=]\s*["']?[^"',;\s]+["']?/gi, "$1=[redacted]")
    .replace(/\b(command|cmd)\s*[:=]\s*["'][^"']*["']/gi, "$1=[redacted]");
}

function sanitizeProgressText(value: string): string {
  const normalized = redactSensitiveText(value).replace(/\s+/g, " ").trim();
  return normalized.length > 240 ? `${normalized.slice(0, 240)}…` : normalized;
}
function shellProgressMessage(progress: ShellExecutionProgress): string {
  if (progress.reason === "start") return "Shell command is running";
  if (progress.reason === "heartbeat") return `Shell command is still running after ${progress.elapsedMs} ms`;
  return `Shell command produced output after ${progress.elapsedMs} ms`;
}


export function sanitizeDiagnosticText(value: string): string {
  const normalized = redactSensitiveText(value).replace(/\s+/g, " ").trim();
  return normalized.length > 2000 ? `${normalized.slice(0, 2000)}…` : normalized;
}

export function driverFailureDiagnostic(error: unknown): string {
  const fallback = "Deterministic driver failed";
  if (!(error instanceof Error)) return fallback;
  const diagnostic = error instanceof DriverError && error.publicDiagnostic !== undefined
    ? error.publicDiagnostic
    : conciseSpawnDiagnostic(error);
  return boundedDiagnostic(diagnostic) || fallback;
}

function conciseSpawnDiagnostic(error: Error): string {
  const systemError = error as NodeJS.ErrnoException;
  if (systemError.code === "ENAMETOOLONG") {
    const syscall = systemError.syscall === "spawn" || systemError.syscall === "posix_spawn"
      ? `, ${systemError.syscall}`
      : "";
    return `ENAMETOOLONG: name too long${syscall} (command omitted)`;
  }
  const embeddedCommand = error.message.match(
    /(ENAMETOOLONG:\s*name too long,\s*(?:posix_spawn|spawn))\b/is,
  );
  return embeddedCommand ? `${embeddedCommand[1]} (command omitted)` : error.message;
}

function boundedDiagnostic(value: string): string {
  return sanitizeDiagnosticText(value);
}

function isAlreadyExists(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === "EEXIST";
}

function isNotFound(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === "ENOENT";
}
