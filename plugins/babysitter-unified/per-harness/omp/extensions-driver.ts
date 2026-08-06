import { AsyncLocalStorage } from "node:async_hooks";
import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fromJSONSchema } from "zod";

export const DRIVER_SCHEMA_VERSION = "2026.07.omp-driver-v1";
export const DEFAULT_SHELL_TIMEOUT_MS = 120_000;
export const MAX_CAPTURE_BYTES = 1024 * 1024;
export const SHELL_TERMINATION_GRACE_MS = 250;
export const MAX_DRIVER_STEPS = 100;

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

export type DriverProgressStage =
  | "iteration"
  | "discovery"
  | "recovery"
  | "shell_start"
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
  invocationKey?: string;
  kind?: string;
  stage: DriverProgressStage;
  state: DriverProgressState;
  message: string;
  observedAt: string;
}

export type DriverProgressListener = (progress: DriverProgress) => void | Promise<void>;

interface DriverDependencies {
  cwd: string;
  runCli(args: string[], timeoutMs?: number, signal?: AbortSignal): Promise<CliResult>;
  executeShell?: (action: EffectAction, cwd: string, signal?: AbortSignal) => Promise<ShellExecutionResult>;
  now?: () => Date;
  randomId?: () => string;
  onProgress?: DriverProgressListener;
  onProgressError?: (error: unknown, progress: DriverProgress) => void | Promise<void>;
}

interface ExecutionCheckpoint {
  schemaVersion: string;
  effectId: string;
  invocationKey: string;
  kind: "shell" | "agent";
  state: "in_progress" | "completed";
  startedAt: string;
  finishedAt?: string;
  outputRef?: string;
  outputSha256?: string;
  authenticatedOutputSha256?: string;
  stdoutRef?: string;
  stderrRef?: string;
  postedAt?: string;
  ownerName?: string;
  dispatchToken?: string;
  requestedModel?: string;
  outputSchema?: JsonObject;
  taskEnvelopeSha256?: string;
  attempt?: number;
  attemptState?:
    | "prepared"
    | "claimed"
    | "completion_authenticated"
    | "failed"
    | "aborted"
    | "cancelled"
    | "awaiting_late_owner"
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

export interface AgentToolCallDecision {
  handled: boolean;
  block?: boolean;
  reason?: string;
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
  continuation?: DriverResult;
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
  constructor(message: string, readonly effectId?: string) {
    super(message);
    this.name = "DriverError";
  }
}

export class OmpDeterministicDriver {
  private readonly executeShell: (action: EffectAction, cwd: string, signal?: AbortSignal) => Promise<ShellExecutionResult>;
  private readonly now: () => Date;
  private readonly randomId: () => string;
  private readonly progressListeners = new Set<DriverProgressListener>();
  private readonly progressSequences = new Map<string, number>();
  private readonly progressSignatures = new Map<string, string>();
  private readonly progressOperation = new AsyncLocalStorage<string>();
  private readonly effectLocks = new Map<string, Promise<void>>();
  private workspaceCwd: string;

  constructor(private readonly dependencies: DriverDependencies) {
    this.workspaceCwd = path.resolve(dependencies.cwd);
    this.executeShell = dependencies.executeShell ?? executeBoundedShell;
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
    if (!operationId) return await operation();
    return await this.progressOperation.run(operationId, operation);
  }

  async drive(runDirInput: string, signal?: AbortSignal, operationId?: string): Promise<DriverResult> {
    return await this.withProgressOperation(operationId, () => this.driveScoped(runDirInput, signal));
  }

  private async driveScoped(runDirInput: string, signal?: AbortSignal): Promise<DriverResult> {
    const runDir = path.resolve(runDirInput);
    try {
      for (let step = 0; step < MAX_DRIVER_STEPS; step += 1) {
        signal?.throwIfAborted();
        const iteration = await this.runIteration(runDir, signal);
        await this.emitProgress(runDir, "iteration", "running", `Iteration ${step + 1} observed ${iteration.status}`);
        if (iteration.status === "completed") {
          await this.emitProgress(runDir, "iteration", "completed", "Run completed");
          return { state: "completed", completionProof: iteration.completionProof };
        }
        if (iteration.status === "halted" || iteration.status === "failed") {
          const reason = `Babysitter iteration stopped with status ${iteration.status}${iteration.reason ? `: ${iteration.reason}` : ""}`;
          await this.emitProgress(runDir, "attention", "operator_attention", reason);
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
          await this.emitProgress(runDir, "waiting", "waiting", iteration.reason ?? "Waiting for Babysitter state to advance");
          return { state: "waiting", reason: iteration.reason };
        }

        let progressed = false;
        for (const action of actions) {
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
          await this.emitProgress(runDir, "interaction", "waiting", `Interaction required for ${action.kind}`, action);
          return { state: "interaction", effect: action };
        }
        if (!progressed) {
          await this.emitProgress(runDir, "waiting", "waiting", iteration.reason ?? "Waiting for Babysitter state to advance");
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
        error instanceof Error ? error.message : "Driver failed",
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
    const model = item?.model;
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
      return { handled: true };
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
      checkpoint.attemptState !== "awaiting_late_owner"
    ) {
      return {
        handled: true,
        reason: `Retry rejected: effect ${descriptor.effectId} is ${checkpoint.attemptState ?? "in progress"}, not in a retryable terminal state`,
      };
    }
    const ownerPath = agentOwnerPath(descriptor.runDir, descriptor.effectId);
    const owner = await readJsonIfExists<AgentOwner>(ownerPath);
    if (
      !owner ||
      owner.invocationKey !== descriptor.invocationKey ||
      owner.ownerName !== descriptor.ownerName ||
      owner.dispatchToken !== descriptor.dispatchToken
    ) {
      return { handled: true, reason: `Retry rejected: retained owner identity does not match effect ${descriptor.effectId}` };
    }

    const attempt = checkpoint.attempt ?? owner.attempt ?? 1;
    await writeImmutableJson(
      effectArtifactPath(descriptor.runDir, descriptor.effectId, `agent-owner.attempt-${attempt}.json`),
      owner,
    );
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
    await fs.unlink(ownerPath);
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

    const outputPath = effectArtifactPath(descriptor.runDir, descriptor.effectId, "output.json");
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
    const continuation = await this.drive(descriptor.runDir);
    return { handled: true, posted, continuation };
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
    const taskDir = effectTaskDir(runDir, action.effectId);
    await fs.mkdir(taskDir, { recursive: true });
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
      checkpoint = await readJson<ExecutionCheckpoint>(checkpointFile);
      validateCheckpointIdentity(checkpoint, action);
      const recovered = await this.recoverCompletedOutput(runDir, checkpoint);
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
      return;
    }

    await this.emitProgress(runDir, "shell_start", "running", "Starting bounded shell effect", action);
    const commandOutputBefore = await shellCommandOutputFingerprint(runDir, action);
    const shellResult = await this.executeShell(action, this.workspaceCwd, signal);
    const stdoutPath = effectArtifactPath(runDir, action.effectId, "stdout.log");
    const stderrPath = effectArtifactPath(runDir, action.effectId, "stderr.log");
    await writeTextAtomic(stdoutPath, shellResult.stdout);
    await writeTextAtomic(stderrPath, shellResult.stderr);

    const value = await shellResultValue(runDir, action, shellResult, commandOutputBefore);
    const outputPath = effectArtifactPath(runDir, action.effectId, "output.json");
    const shell = readObject(action.taskDef?.shell) ?? readObject(action.taskDef?.metadata) ?? {};
    const expectedExitCode = typeof shell.expectedExitCode === "number" ? shell.expectedExitCode : 0;
    await writeImmutableJson(outputPath, value);
    const outputBytes = await fs.readFile(outputPath);
    checkpoint = {
      ...checkpoint,
      state: "completed",
      finishedAt: shellResult.finishedAt,
      outputRef: taskRelativeRef(action.effectId, "output.json"),
      outputSha256: sha256(outputBytes),
      stdoutRef: taskRelativeRef(action.effectId, "stdout.log"),
      stderrRef: taskRelativeRef(action.effectId, "stderr.log"),
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
  }

  private async prepareAgentEffect(runDir: string, action: EffectAction, signal?: AbortSignal): Promise<DriverResult | null> {
    const taskDir = effectTaskDir(runDir, action.effectId);
    await fs.mkdir(taskDir, { recursive: true });
    const checkpointFile = executionPath(runDir, action.effectId);
    const taskDef = action.taskDef ?? {};
    const requestedModel = readRequestedModel(taskDef);
    const ownerName = stableAgentName(action.effectId);
    const dispatchToken = this.randomId();
    const checkpoint: ExecutionCheckpoint = {
      schemaVersion: DRIVER_SCHEMA_VERSION,
      effectId: action.effectId,
      invocationKey: action.invocationKey,
      kind: "agent",
      state: "in_progress",
      startedAt: this.now().toISOString(),
      ownerName,
      dispatchToken,
      requestedModel,
      outputSchema: readOutputSchema(taskDef),
      attempt: 1,
      attemptState: "prepared",
      attemptUpdatedAt: this.now().toISOString(),
    };

    try {
      await writeJsonExclusive(checkpointFile, checkpoint);
      await this.emitProgress(runDir, "agent_preparation", "running", "Agent attempt 1 prepared durably", action);
    } catch (error) {
      if (!isAlreadyExists(error)) throw error;
      const existing = await readJson<ExecutionCheckpoint>(checkpointFile);
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
      if (owner) await fs.unlink(agentOwnerPath(runDir, action.effectId));
      await this.emitProgress(
        runDir,
        "agent_preparation",
        "running",
        `Agent attempt ${existing.attempt ?? 1} prepared durably`,
        existing,
      );
      return await this.buildAgentDispatch(runDir, action, existing);
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
      ...(checkpoint.requestedModel ? { model: checkpoint.requestedModel } : {}),
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
    if (checkpoint.taskEnvelopeSha256 !== taskEnvelopeSha256) {
      await writeJsonAtomic(executionPath(runDir, action.effectId), {
        ...checkpoint,
        taskEnvelopeSha256,
      } satisfies ExecutionCheckpoint);
    }
    return dispatch;
  }

  private async recoverCompletedOutput(
    runDir: string,
    checkpoint: ExecutionCheckpoint,
  ): Promise<ExecutionCheckpoint | null> {
    if (checkpoint.kind === "shell" && checkpoint.state !== "completed") return null;
    const outputPath = effectArtifactPath(runDir, checkpoint.effectId, "output.json");
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
    return readObject(payload.effect)?.status === "resolved_ok";
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

    const args = [
      "task:post",
      runDir,
      checkpoint.effectId,
      "--status",
      "ok",
      "--value",
      path.join(runDir, checkpoint.outputRef),
      "--invocation-key",
      checkpoint.invocationKey,
      "--started-at",
      checkpoint.startedAt,
      "--finished-at",
      checkpoint.finishedAt ?? this.now().toISOString(),
      "--json",
    ];
    if (checkpoint.stdoutRef) args.push("--stdout-file", path.join(runDir, checkpoint.stdoutRef));
    if (checkpoint.stderrRef) args.push("--stderr-file", path.join(runDir, checkpoint.stderrRef));

    const result = await this.dependencies.runCli(args, undefined, signal);
    if (result.code !== 0) {
      if (await this.hasCommittedResult(runDir, checkpoint, signal)) {
        await this.emitProgress(runDir, "post", "completed", "Recovered a concurrently committed effect result", checkpoint);
        return false;
      }
      throw new DriverError(`task:post failed for effect ${checkpoint.effectId}: ${boundedDiagnostic(result.stderr || result.stdout)}`, checkpoint.effectId);
    }
    const posted = { ...checkpoint, postedAt: this.now().toISOString() };
    await writeJsonAtomic(executionPath(runDir, checkpoint.effectId), posted);
    await this.emitProgress(runDir, "post", "completed", "Effect result committed to the authoritative journal", posted);
    return true;
  }
  private async emitProgress(
    runDir: string,
    stage: DriverProgressStage,
    state: DriverProgressState,
    message: string,
    identity?: Pick<EffectAction, "effectId" | "invocationKey" | "kind">,
  ): Promise<void> {
    const runId = path.basename(runDir);
    const key = `${runId}:${identity?.effectId ?? "$run"}`;
    const operationId = this.progressOperation.getStore();
    const safeMessage = sanitizeProgressText(message);
    const signature = `${stage}\u0000${state}\u0000${safeMessage}\u0000${identity?.invocationKey ?? ""}`;
    const signatureKey = `${operationId ?? "$unowned"}:${key}`;
    if (this.progressSignatures.get(signatureKey) === signature) return;
    this.progressSignatures.set(signatureKey, signature);
    const progress: DriverProgress = {
      schemaVersion: DRIVER_SCHEMA_VERSION,
      key,
      sequence: (this.progressSequences.get(key) ?? 0) + 1,
      runId,
      runDir,
      ...(identity?.effectId ? { effectId: identity.effectId } : {}),
      ...(operationId ? { operationId } : {}),
      ...(identity?.invocationKey ? { invocationKey: identity.invocationKey } : {}),
      ...(identity?.kind ? { kind: identity.kind } : {}),
      stage,
      state,
      message: safeMessage,
      observedAt: this.now().toISOString(),
    };
    this.progressSequences.set(key, progress.sequence);
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

export async function executeBoundedShell(
  action: EffectAction,
  defaultCwd: string,
  signal?: AbortSignal,
): Promise<ShellExecutionResult> {
  const shell = readObject(action.taskDef?.shell) ?? readObject(action.taskDef?.metadata) ?? {};
  const command = typeof shell.command === "string" && shell.command.trim() ? shell.command : "echo";
  const args = Array.isArray(shell.args) ? shell.args.filter((value): value is string => typeof value === "string") : [];
  const cwd = typeof shell.cwd === "string" ? path.resolve(defaultCwd, shell.cwd) : defaultCwd;
  const timeoutMs = positiveInteger(shell.timeoutMs ?? shell.timeout, DEFAULT_SHELL_TIMEOUT_MS);
  const env = readStringRecord(shell.env);
  const startedAt = new Date().toISOString();

  return await new Promise<ShellExecutionResult>((resolve, reject) => {
    signal?.throwIfAborted();
    const useShell = args.length === 0;
    const child = spawn(command, args, {
      cwd,
      env: env ? { ...process.env, ...env } : process.env,
      shell: useShell,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = new BoundedCapture(MAX_CAPTURE_BYTES);
    const stderr = new BoundedCapture(MAX_CAPTURE_BYTES);
    child.stdout?.on("data", (chunk: Buffer) => stdout.add(chunk));
    child.stderr?.on("data", (chunk: Buffer) => stderr.add(chunk));

    let timedOut = false;
    let settled = false;
    let closedCode: number | null = null;
    let escalationTimer: NodeJS.Timeout | undefined;
    let settleTimer: NodeJS.Timeout | undefined;
    const finish = (code: number | null): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      clearTimeout(escalationTimer);
      clearTimeout(settleTimer);
      signal?.removeEventListener("abort", abort);
      resolve({
        exitCode: timedOut ? 124 : (code ?? 1),
        stdout: stdout.text(),
        stderr: stderr.text(),
        timedOut,
        stdoutTruncated: stdout.truncated,
        stderrTruncated: stderr.truncated,
        startedAt,
        finishedAt: new Date().toISOString(),
      });
    };
    const abort = (): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      terminateProcessTree(child.pid, false, child.kill.bind(child));
      escalationTimer = setTimeout(
        () => terminateProcessTree(child.pid, true, child.kill.bind(child)),
        SHELL_TERMINATION_GRACE_MS,
      );
      escalationTimer.unref();
      signal?.removeEventListener("abort", abort);
      reject(signal?.reason ?? new DOMException("The operation was aborted", "AbortError"));
    };
    signal?.addEventListener("abort", abort, { once: true });
    const timeoutTimer = setTimeout(() => {
      timedOut = true;
      terminateProcessTree(child.pid, false, child.kill.bind(child));
      escalationTimer = setTimeout(() => {
        terminateProcessTree(child.pid, true, child.kill.bind(child));
        settleTimer = setTimeout(() => finish(closedCode), SHELL_TERMINATION_GRACE_MS);
        settleTimer.unref();
      }, SHELL_TERMINATION_GRACE_MS);
      escalationTimer.unref();
    }, timeoutMs);
    timeoutTimer.unref();

    child.once("error", (error) => {
      if (timedOut || settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      clearTimeout(escalationTimer);
      clearTimeout(settleTimer);
      signal?.removeEventListener("abort", abort);
      reject(error);
    });
    child.once("close", (code) => {
      closedCode = code;
      if (!timedOut) {
        finish(code);
        return;
      }
      if (settleTimer) finish(code);
    });
  });
}

class BoundedCapture {
  private readonly chunks: Buffer[] = [];
  private bytes = 0;
  truncated = false;

  constructor(private readonly limit: number) {}

  add(chunk: Buffer): void {
    if (this.bytes >= this.limit) {
      this.truncated = true;
      return;
    }
    const remaining = this.limit - this.bytes;
    const accepted = chunk.length > remaining ? chunk.subarray(0, remaining) : chunk;
    this.chunks.push(Buffer.from(accepted));
    this.bytes += accepted.length;
    if (accepted.length !== chunk.length) this.truncated = true;
  }

  text(): string {
    return Buffer.concat(this.chunks).toString("utf8");
  }
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

function terminateProcessTree(
  pid: number | undefined,
  force: boolean,
  killChild: (signal?: NodeJS.Signals | number) => boolean,
): void {
  if (!pid) return;
  if (process.platform === "win32") {
    const taskkill = spawn("taskkill", ["/pid", String(pid), "/T", ...(force ? ["/F"] : [])], {
      stdio: "ignore",
      windowsHide: true,
    });
    taskkill.once("error", () => {
      try { killChild(force ? "SIGKILL" : "SIGTERM"); } catch { /* process already exited */ }
    });
    return;
  }
  try {
    process.kill(-pid, force ? "SIGKILL" : "SIGTERM");
  } catch {
    try { killChild(force ? "SIGKILL" : "SIGTERM"); } catch { /* process already exited */ }
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
): Promise<string | null | undefined> {
  const io = readObject(action.taskDef?.io);
  if (typeof io?.outputJsonPath !== "string") return undefined;
  const outputPath = resolveRunRelative(runDir, io.outputJsonPath);
  const canonicalOutputPath = effectArtifactPath(runDir, action.effectId, "output.json");
  if (path.resolve(outputPath) === path.resolve(canonicalOutputPath)) return undefined;
  try {
    const stats = await fs.stat(outputPath, { bigint: true });
    return [
      stats.dev,
      stats.ino,
      stats.size,
      stats.mtimeNs,
      stats.ctimeNs,
    ].join(":");
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

async function shellResultValue(
  runDir: string,
  action: EffectAction,
  result: ShellExecutionResult,
  commandOutputBefore: string | null | undefined,
): Promise<unknown> {
  const shell = readObject(action.taskDef?.shell) ?? readObject(action.taskDef?.metadata) ?? {};
  const expectedExitCode = typeof shell.expectedExitCode === "number" ? shell.expectedExitCode : 0;
  if (!result.timedOut && result.exitCode === expectedExitCode) {
    const io = readObject(action.taskDef?.io);
    if (typeof io?.outputJsonPath === "string") {
      const outputPath = resolveRunRelative(runDir, io.outputJsonPath);
      const canonicalOutputPath = effectArtifactPath(runDir, action.effectId, "output.json");
      if (path.resolve(outputPath) === path.resolve(canonicalOutputPath)) return result.stdout;
      const commandOutputAfter = await shellCommandOutputFingerprint(runDir, action);
      if (commandOutputAfter === commandOutputBefore) {
        throw new DriverError(
          `Shell output JSON for effect ${action.effectId} was not created or updated by the command`,
          action.effectId,
        );
      }
      let bytes: Buffer;
      try {
        bytes = await fs.readFile(outputPath);
      } catch (error) {
        throw new DriverError(
          `Shell output JSON for effect ${action.effectId} could not be read: ${boundedDiagnostic(error instanceof Error ? error.message : String(error))}`,
          action.effectId,
        );
      }
      if (bytes.length > MAX_CAPTURE_BYTES) {
        throw new DriverError(`Shell output JSON for effect ${action.effectId} exceeds ${MAX_CAPTURE_BYTES} bytes`, action.effectId);
      }
      try {
        return JSON.parse(bytes.toString("utf8"));
      } catch (error) {
        throw new DriverError(
          `Shell output JSON for effect ${action.effectId} is invalid JSON: ${boundedDiagnostic(error instanceof Error ? error.message : String(error))}`,
          action.effectId,
        );
      }
    }
    return result.stdout;
  }
  return {
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
}

async function hasMatchingCommittedArtifact(runDir: string, checkpoint: ExecutionCheckpoint): Promise<boolean> {
  const result = await readJsonIfExists<JsonObject>(effectArtifactPath(runDir, checkpoint.effectId, "result.json"));
  if (!result) return false;
  if (
    result.status !== "ok" ||
    result.effectId !== checkpoint.effectId ||
    result.invocationKey !== checkpoint.invocationKey
  ) {
    throw new DriverError(
      `Committed result identity conflicts with execution checkpoint for effect ${checkpoint.effectId}`,
      checkpoint.effectId,
    );
  }

  const outputPath = checkpoint.outputRef
    ? resolveRunRelative(runDir, checkpoint.outputRef)
    : effectArtifactPath(runDir, checkpoint.effectId, "output.json");
  const durableOutput = await readJson<unknown>(outputPath);
  const committedValue = typeof result.resultRef === "string"
    ? await readJson<unknown>(resolveRunRelative(runDir, result.resultRef))
    : "result" in result
      ? result.result
      : result.value;
  if (!isDeepStrictEqual(committedValue, durableOutput)) {
    throw new DriverError(
      `Committed result conflicts with immutable durable output for effect ${checkpoint.effectId}`,
      checkpoint.effectId,
    );
  }
  return true;
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
  return path.isAbsolute(candidate) ? candidate : path.resolve(runDir, candidate);
}

async function readCheckpoint(runDir: string, effectId: string): Promise<ExecutionCheckpoint | null> {
  return await readJsonIfExists<ExecutionCheckpoint>(executionPath(runDir, effectId));
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
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temp = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  const handle = await fs.open(temp, "wx");
  try {
    await handle.writeFile(value, "utf8");
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

function readStringRecord(value: unknown): Record<string, string> | undefined {
  const object = readObject(value);
  if (!object) return undefined;
  const entries = Object.entries(object).filter((entry): entry is [string, string] => typeof entry[1] === "string");
  return Object.fromEntries(entries);
}

function positiveInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function parseCliJson<T>(stdout: string, operation: string): T {
  try {
    return JSON.parse(stdout) as T;
  } catch (error) {
    throw new DriverError(`${operation} returned invalid JSON: ${boundedDiagnostic(stdout)} (${String(error)})`);
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

export function sanitizeDiagnosticText(value: string): string {
  const normalized = redactSensitiveText(value).replace(/\s+/g, " ").trim();
  return normalized.length > 2000 ? `${normalized.slice(0, 2000)}…` : normalized;
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
