import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { isDeepStrictEqual } from "node:util";

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

interface DriverDependencies {
  cwd: string;
  runCli(args: string[], timeoutMs?: number): Promise<CliResult>;
  executeShell?: (action: EffectAction, cwd: string) => Promise<ShellExecutionResult>;
  now?: () => Date;
  randomId?: () => string;
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
  stdoutRef?: string;
  stderrRef?: string;
  postedAt?: string;
  ownerName?: string;
  dispatchToken?: string;
  requestedModel?: string;
  outputSchema?: JsonObject;
}

interface AgentOwner {
  schemaVersion: string;
  effectId: string;
  invocationKey: string;
  ownerName: string;
  dispatchToken: string;
  toolCallId: string;
  claimedAt: string;
}

interface AgentBridgeDescriptor {
  runDir: string;
  effectId: string;
  invocationKey: string;
  ownerName: string;
  dispatchToken: string;
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

export interface AgentOwnerCompletionInput extends AgentBridgeDescriptor {
  value: unknown;
}

class DriverError extends Error {
  constructor(message: string, readonly effectId?: string) {
    super(message);
    this.name = "DriverError";
  }
}

export class OmpDeterministicDriver {
  private readonly executeShell: (action: EffectAction, cwd: string) => Promise<ShellExecutionResult>;
  private readonly now: () => Date;
  private readonly randomId: () => string;

  constructor(private readonly dependencies: DriverDependencies) {
    this.executeShell = dependencies.executeShell ?? executeBoundedShell;
    this.now = dependencies.now ?? (() => new Date());
    this.randomId = dependencies.randomId ?? randomUUID;
  }

  async drive(runDirInput: string): Promise<DriverResult> {
    const runDir = path.resolve(runDirInput);
    for (let step = 0; step < MAX_DRIVER_STEPS; step += 1) {
      const iteration = await this.runIteration(runDir);
      if (iteration.status === "completed") {
        return { state: "completed", completionProof: iteration.completionProof };
      }
      if (iteration.status === "halted" || iteration.status === "failed") {
        return {
          state: "operator_attention",
          reason: `Babysitter iteration stopped with status ${iteration.status}${iteration.reason ? `: ${iteration.reason}` : ""}`,
        };
      }

      const actions = iteration.nextActions ?? [];
      if (actions.length === 0) {
        return { state: "waiting", reason: iteration.reason };
      }

      let progressed = false;
      for (const action of actions) {
        if (action.kind === "shell") {
          await this.resolveShellEffect(runDir, action);
          progressed = true;
          continue;
        }
        if (action.kind === "agent" || action.kind === "skill") {
          const dispatch = await this.prepareAgentEffect(runDir, action);
          if (dispatch) return dispatch;
          progressed = true;
          continue;
        }
        return { state: "interaction", effect: action };
      }
      if (!progressed) return { state: "waiting", reason: iteration.reason };
    }
    return {
      state: "operator_attention",
      reason: `Deterministic driver exceeded its ${MAX_DRIVER_STEPS}-step safety bound`,
    };
  }

  async claimAgentToolCall(input: JsonObject, toolCallId: string): Promise<AgentToolCallDecision> {
    const descriptor = parseAgentBridgeInput(input);
    if (!descriptor) return { handled: false };

    const checkpoint = await readCheckpoint(descriptor.runDir, descriptor.effectId);
    if (!checkpoint || checkpoint.kind !== "agent") {
      return { handled: true, block: true, reason: `No durable agent claim exists for effect ${descriptor.effectId}` };
    }
    const mismatch = validateDescriptor(checkpoint, descriptor);
    if (mismatch) return { handled: true, block: true, reason: mismatch };
    if (checkpoint.state === "completed") {
      return { handled: true, block: true, reason: `Effect ${descriptor.effectId} already has an immutable completed result` };
    }

    const model = readTaskItem(input)?.model;
    if (checkpoint.requestedModel !== model) {
      return {
        handled: true,
        block: true,
        reason: `Model mismatch for effect ${descriptor.effectId}: expected ${checkpoint.requestedModel ?? "default"}, received ${model ?? "default"}`,
      };
    }

    const owner: AgentOwner = {
      schemaVersion: DRIVER_SCHEMA_VERSION,
      effectId: descriptor.effectId,
      invocationKey: descriptor.invocationKey,
      ownerName: descriptor.ownerName,
      dispatchToken: descriptor.dispatchToken,
      toolCallId,
      claimedAt: this.now().toISOString(),
    };
    const ownerPath = agentOwnerPath(descriptor.runDir, descriptor.effectId);
    try {
      await writeJsonExclusive(ownerPath, owner);
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
  }

  async completeAgentToolCall(event: AgentToolResultEvent): Promise<AgentToolCompletion> {
    const descriptor = parseAgentBridgeInput(event.input);
    if (!descriptor) return { handled: false };

    const owner = await readJsonIfExists<AgentOwner>(agentOwnerPath(descriptor.runDir, descriptor.effectId));
    if (!owner || owner.toolCallId !== event.toolCallId || owner.dispatchToken !== descriptor.dispatchToken) {
      return {
        handled: true,
        reason: `Ignoring non-owner result for effect ${descriptor.effectId}`,
      };
    }

    const extracted = extractSingleAgentResult(event.details);
    if (event.isError) {
      return {
        handled: true,
        reason: `Blocking agent call ${event.toolCallId} failed; effect remains unresolved`,
      };
    }
    if (!extracted.ok) {
      return {
        handled: true,
        reason: extracted.reason,
      };
    }

    const checkpoint = await readCheckpoint(descriptor.runDir, descriptor.effectId);
    if (!checkpoint || checkpoint.kind !== "agent") {
      throw new DriverError(`Missing durable agent checkpoint for effect ${descriptor.effectId}`, descriptor.effectId);
    }
    const mismatch = validateDescriptor(checkpoint, descriptor);
    if (mismatch) throw new DriverError(mismatch, descriptor.effectId);

    return await this.persistAgentCompletion(descriptor, extracted.value);
  }

  async completeAgentOwnerValue(input: AgentOwnerCompletionInput): Promise<AgentToolCompletion> {
    const descriptor = parseAgentOwnerCompletionInput(input);
    if (!descriptor) return { handled: false };
    const owner = await readJsonIfExists<AgentOwner>(agentOwnerPath(descriptor.runDir, descriptor.effectId));
    if (
      !owner ||
      owner.effectId !== descriptor.effectId ||
      owner.invocationKey !== descriptor.invocationKey ||
      owner.ownerName !== descriptor.ownerName ||
      owner.dispatchToken !== descriptor.dispatchToken
    ) {
      return {
        handled: true,
        reason: `Ignoring completion from a non-owner agent for effect ${descriptor.effectId}`,
      };
    }
    return await this.persistAgentCompletion(descriptor, input.value);
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
    await writeImmutableJson(outputPath, value);
    const outputBytes = await fs.readFile(outputPath);
    const completed: ExecutionCheckpoint = {
      ...checkpoint,
      state: "completed",
      finishedAt: checkpoint.finishedAt ?? this.now().toISOString(),
      outputRef: taskRelativeRef(descriptor.effectId, "output.json"),
      outputSha256: sha256(outputBytes),
    };
    await writeJsonAtomic(executionPath(descriptor.runDir, descriptor.effectId), completed);

    const posted = await this.postCompletedCheckpoint(descriptor.runDir, completed);
    const continuation = await this.drive(descriptor.runDir);
    return { handled: true, posted, continuation };
  }

  private async runIteration(runDir: string): Promise<IterationResult> {
    const result = await this.dependencies.runCli(["run:iterate", runDir, "--json"]);
    if (result.code !== 0) {
      throw new DriverError(`run:iterate failed: ${boundedDiagnostic(result.stderr || result.stdout)}`);
    }
    return parseCliJson<IterationResult>(result.stdout, "run:iterate");
  }

  private async resolveShellEffect(runDir: string, action: EffectAction): Promise<void> {
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
      await this.postCompletedCheckpoint(runDir, checkpoint);
      return;
    }

    const shellResult = await this.executeShell(action, this.dependencies.cwd);
    const stdoutPath = effectArtifactPath(runDir, action.effectId, "stdout.log");
    const stderrPath = effectArtifactPath(runDir, action.effectId, "stderr.log");
    await writeTextAtomic(stdoutPath, shellResult.stdout);
    await writeTextAtomic(stderrPath, shellResult.stderr);

    const value = await shellResultValue(runDir, action, shellResult);
    const outputPath = effectArtifactPath(runDir, action.effectId, "output.json");
    const shell = readObject(action.taskDef?.shell) ?? readObject(action.taskDef?.metadata) ?? {};
    const expectedExitCode = typeof shell.expectedExitCode === "number" ? shell.expectedExitCode : 0;
    const configuredOutput = readObject(action.taskDef?.io)?.outputJsonPath;
    const shellProducedDurableOutput = (
      !shellResult.timedOut &&
      shellResult.exitCode === expectedExitCode &&
      typeof configuredOutput === "string" &&
      path.resolve(resolveRunRelative(runDir, configuredOutput)) === path.resolve(outputPath)
    );
    if (!shellProducedDurableOutput) await writeImmutableJson(outputPath, value);
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
    await this.postCompletedCheckpoint(runDir, checkpoint);
  }

  private async prepareAgentEffect(runDir: string, action: EffectAction): Promise<DriverResult | null> {
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
    };

    try {
      await writeJsonExclusive(checkpointFile, checkpoint);
    } catch (error) {
      if (!isAlreadyExists(error)) throw error;
      const existing = await readJson<ExecutionCheckpoint>(checkpointFile);
      validateCheckpointIdentity(existing, action);
      const recovered = await this.recoverCompletedOutput(runDir, existing);
      if (recovered) {
        await this.postCompletedCheckpoint(runDir, recovered);
        return null;
      }
      const owner = await readJsonIfExists<AgentOwner>(agentOwnerPath(runDir, action.effectId));
      if (owner) {
        return {
          state: "waiting",
          reason: `Agent effect ${action.effectId} remains owned by ${owner.ownerName} through blocking tool call ${owner.toolCallId}; awaiting that invocation's result`,
        };
      }
      return this.buildAgentDispatch(runDir, action, existing);
    }

    return this.buildAgentDispatch(runDir, action, checkpoint);
  }

  private buildAgentDispatch(runDir: string, action: EffectAction, checkpoint: ExecutionCheckpoint): DriverResult {
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
    return {
      state: "agent",
      effectId: action.effectId,
      invocationKey: action.invocationKey,
      task: {
        context: `Execute exactly one Babysitter effect for run ${path.basename(runDir)}. The plugin owns posting and continuation; do not call Babysitter CLI commands.`,
        tasks: [taskItem],
      },
    };
  }

  private async recoverCompletedOutput(
    runDir: string,
    checkpoint: ExecutionCheckpoint,
  ): Promise<ExecutionCheckpoint | null> {
    if (checkpoint.kind === "shell" && checkpoint.state !== "completed") return null;
    const outputPath = effectArtifactPath(runDir, checkpoint.effectId, "output.json");
    let bytes: Buffer;
    try {
      bytes = await fs.readFile(outputPath);
      JSON.parse(bytes.toString("utf8"));
    } catch (error) {
      if (isNotFound(error)) return null;
      throw new DriverError(`Durable output for effect ${checkpoint.effectId} is unreadable: ${String(error)}`, checkpoint.effectId);
    }
    if (bytes.length === 0) return null;
    if (checkpoint.outputSha256 && checkpoint.outputSha256 !== sha256(bytes)) {
      throw new DriverError(`Durable output checksum mismatch for effect ${checkpoint.effectId}`, checkpoint.effectId);
    }
    const completed: ExecutionCheckpoint = {
      ...checkpoint,
      state: "completed",
      finishedAt: checkpoint.finishedAt ?? this.now().toISOString(),
      outputRef: checkpoint.outputRef ?? taskRelativeRef(checkpoint.effectId, "output.json"),
      outputSha256: checkpoint.outputSha256 ?? sha256(bytes),
    };
    if (checkpoint.state !== "completed" || checkpoint.outputRef !== completed.outputRef || !checkpoint.outputSha256) {
      await writeJsonAtomic(executionPath(runDir, checkpoint.effectId), completed);
    }
    return completed;
  }

  private async hasCommittedResult(runDir: string, checkpoint: ExecutionCheckpoint): Promise<boolean> {
    if (!await hasMatchingCommittedArtifact(runDir, checkpoint)) return false;
    const shown = await this.dependencies.runCli(["task:show", runDir, checkpoint.effectId, "--json"]);
    if (shown.code !== 0) {
      throw new DriverError(
        `Cannot verify committed state for effect ${checkpoint.effectId}: ${boundedDiagnostic(shown.stderr || shown.stdout)}`,
        checkpoint.effectId,
      );
    }
    const payload = parseCliJson<JsonObject>(shown.stdout, "task:show");
    return readObject(payload.effect)?.status === "resolved_ok";
  }

  private async postCompletedCheckpoint(runDir: string, checkpoint: ExecutionCheckpoint): Promise<boolean> {
    if (checkpoint.state !== "completed" || !checkpoint.outputRef) {
      throw new DriverError(`Effect ${checkpoint.effectId} has no completed durable output`, checkpoint.effectId);
    }
    if (await this.hasCommittedResult(runDir, checkpoint)) return false;

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

    const result = await this.dependencies.runCli(args);
    if (result.code !== 0) {
      if (await this.hasCommittedResult(runDir, checkpoint)) return false;
      throw new DriverError(`task:post failed for effect ${checkpoint.effectId}: ${boundedDiagnostic(result.stderr || result.stdout)}`, checkpoint.effectId);
    }
    const posted = { ...checkpoint, postedAt: this.now().toISOString() };
    await writeJsonAtomic(executionPath(runDir, checkpoint.effectId), posted);
    return true;
  }
}

export async function executeBoundedShell(action: EffectAction, defaultCwd: string): Promise<ShellExecutionResult> {
  const shell = readObject(action.taskDef?.shell) ?? readObject(action.taskDef?.metadata) ?? {};
  const command = typeof shell.command === "string" && shell.command.trim() ? shell.command : "echo";
  const args = Array.isArray(shell.args) ? shell.args.filter((value): value is string => typeof value === "string") : [];
  const cwd = typeof shell.cwd === "string" ? path.resolve(defaultCwd, shell.cwd) : defaultCwd;
  const timeoutMs = positiveInteger(shell.timeoutMs ?? shell.timeout, DEFAULT_SHELL_TIMEOUT_MS);
  const env = readStringRecord(shell.env);
  const startedAt = new Date().toISOString();

  return await new Promise<ShellExecutionResult>((resolve, reject) => {
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
      if (timedOut) return;
      settled = true;
      clearTimeout(timeoutTimer);
      clearTimeout(escalationTimer);
      clearTimeout(settleTimer);
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
  return [
    `BABYSITTER_OMP_BRIDGE ${JSON.stringify(descriptor)}`,
    "Complete only the assignment below. Return the final effect value through the required structured yield path.",
    "Do not call babysitter task:post or run:iterate; the deterministic driver is the sole result writer.",
    "Before yielding, call `babysitter_agent_complete` exactly once with the bridge descriptor fields above and your final effect value as `value`, then yield the identical value. This durable owner channel lets the original agent finish even if its parent task wait is interrupted.",
    "",
    prompt,
  ].join("\n");
}

function parseAgentBridgeInput(input: JsonObject): AgentBridgeDescriptor | null {
  const item = readTaskItem(input);
  if (!item || item.agent !== "babysitter-task" || typeof item.task !== "string") return null;
  const firstLine = item.task.split("\n", 1)[0];
  const prefix = "BABYSITTER_OMP_BRIDGE ";
  if (!firstLine.startsWith(prefix)) return null;
  try {
    const parsed = JSON.parse(firstLine.slice(prefix.length)) as AgentBridgeDescriptor;
    if (
      typeof parsed.runDir !== "string" ||
      typeof parsed.effectId !== "string" ||
      typeof parsed.invocationKey !== "string" ||
      typeof parsed.ownerName !== "string" ||
      typeof parsed.dispatchToken !== "string"
    ) return null;
    return { ...parsed, runDir: path.resolve(parsed.runDir) };
  } catch {
    return null;
  }
}

function parseAgentOwnerCompletionInput(input: AgentOwnerCompletionInput): AgentBridgeDescriptor | null {
  if (
    typeof input.runDir !== "string" ||
    typeof input.effectId !== "string" ||
    typeof input.invocationKey !== "string" ||
    typeof input.ownerName !== "string" ||
    typeof input.dispatchToken !== "string" ||
    !Object.hasOwn(input, "value")
  ) return null;
  return {
    runDir: path.resolve(input.runDir),
    effectId: input.effectId,
    invocationKey: input.invocationKey,
    ownerName: input.ownerName,
    dispatchToken: input.dispatchToken,
    ...(typeof input.model === "string" ? { model: input.model } : {}),
  };
}

function readTaskItem(input: JsonObject): (JsonObject & { task?: string; agent?: string; model?: string }) | null {
  if (Array.isArray(input.tasks) && input.tasks.length === 1) return readObject(input.tasks[0]);
  return input;
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

function validateJsonSchema(value: unknown, schema: JsonObject | undefined, location = "root"): string[] {
  if (!schema) return [];
  if (Array.isArray(schema.enum) && !schema.enum.some((candidate) => isDeepStrictEqual(candidate, value))) {
    return [`${location} is not one of the allowed values`];
  }
  const expected = schema.type;
  if (typeof expected === "string" && !matchesJsonType(value, expected)) {
    return [`Expected ${location} to be ${expected}`];
  }
  const errors: string[] = [];
  if (expected === "object" && readObject(value)) {
    const object = value as JsonObject;
    const required = Array.isArray(schema.required)
      ? schema.required.filter((field): field is string => typeof field === "string")
      : [];
    for (const field of required) {
      if (!Object.hasOwn(object, field)) errors.push(`Missing required field: ${location}.${field}`);
    }
    const properties = readObject(schema.properties) ?? {};
    for (const [key, propertySchema] of Object.entries(properties)) {
      const nestedSchema = readObject(propertySchema);
      if (nestedSchema && Object.hasOwn(object, key)) {
        errors.push(...validateJsonSchema(object[key], nestedSchema, `${location}.${key}`));
      }
    }
  }
  if (expected === "array" && Array.isArray(value)) {
    const itemSchema = readObject(schema.items);
    if (itemSchema) {
      value.forEach((item, index) => errors.push(...validateJsonSchema(item, itemSchema, `${location}[${index}]`)));
    }
  }
  return errors;
}

function matchesJsonType(value: unknown, expected: string): boolean {
  switch (expected) {
    case "null": return value === null;
    case "string": return typeof value === "string";
    case "number": return typeof value === "number" && Number.isFinite(value);
    case "integer": return typeof value === "number" && Number.isInteger(value);
    case "boolean": return typeof value === "boolean";
    case "array": return Array.isArray(value);
    case "object": return readObject(value) !== null;
    default: return false;
  }
}

async function shellResultValue(runDir: string, action: EffectAction, result: ShellExecutionResult): Promise<unknown> {
  const shell = readObject(action.taskDef?.shell) ?? readObject(action.taskDef?.metadata) ?? {};
  const expectedExitCode = typeof shell.expectedExitCode === "number" ? shell.expectedExitCode : 0;
  if (!result.timedOut && result.exitCode === expectedExitCode) {
    const io = readObject(action.taskDef?.io);
    if (typeof io?.outputJsonPath === "string") {
      const outputPath = resolveRunRelative(runDir, io.outputJsonPath);
      const bytes = await fs.readFile(outputPath);
      if (bytes.length > MAX_CAPTURE_BYTES) {
        throw new DriverError(`Shell output JSON for effect ${action.effectId} exceeds ${MAX_CAPTURE_BYTES} bytes`, action.effectId);
      }
      return JSON.parse(bytes.toString("utf8"));
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
  if (checkpoint.effectId !== action.effectId || checkpoint.invocationKey !== action.invocationKey || checkpoint.kind !== action.kind) {
    throw new DriverError(`Execution checkpoint identity mismatch for effect ${action.effectId}`, action.effectId);
  }
}

function validateDescriptor(checkpoint: ExecutionCheckpoint, descriptor: AgentBridgeDescriptor): string | null {
  if (
    checkpoint.effectId !== descriptor.effectId ||
    checkpoint.invocationKey !== descriptor.invocationKey ||
    checkpoint.ownerName !== descriptor.ownerName ||
    checkpoint.dispatchToken !== descriptor.dispatchToken
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

function boundedDiagnostic(value: string): string {
  const normalized = value.trim();
  return normalized.length > 2000 ? `${normalized.slice(0, 2000)}…` : normalized;
}

function isAlreadyExists(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === "EEXIST";
}

function isNotFound(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === "ENOENT";
}
