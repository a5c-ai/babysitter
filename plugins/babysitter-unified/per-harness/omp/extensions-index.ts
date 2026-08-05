import type { ExtensionAPI, ExtensionContext } from "@oh-my-pi/pi-coding-agent";
import * as path from "node:path";
import { initI18n, t } from "./i18n.js";
import {
  type DriverProgress,
  type DriverResult,
  type ProjectionTodoPhase,
  OmpDeterministicDriver,
  reconstructBabysitterProjection,
  sanitizeDiagnosticText,
} from "./driver.js";

const PLUGIN_ROOT = path.resolve(__dirname, "..");

const PROJECTION_NAMESPACE = "babysitter";
export const TODO_PROJECTION_MIN_OMP_VERSION = "16.5.2";

export type TodoProjectionGate = "available" | "missing_capability" | "version_mismatch";

export function getTodoProjectionGate(
  api: ProjectionExtensionAPI,
  hostVersion = api.hostVersion ?? TODO_PROJECTION_MIN_OMP_VERSION,
): TodoProjectionGate {
  if (typeof api.setTodoProjection !== "function") return "missing_capability";
  const parse = (value: string): [number, number, number] | null => {
    const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(value);
    return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
  };
  const actual = parse(hostVersion);
  const minimum = parse(TODO_PROJECTION_MIN_OMP_VERSION)!;
  if (!actual) return "version_mismatch";
  for (let index = 0; index < minimum.length; index += 1) {
    if (actual[index] > minimum[index]) return "available";
    if (actual[index] < minimum[index]) return "version_mismatch";
  }
  return "available";
}


type ProjectionExtensionAPI = ExtensionAPI & {
  setTodoProjection?: (namespace: string, phases: readonly ProjectionTodoPhase[] | undefined) => void;
  /** Optional host-declared version used to reject incompatible backports. */
  hostVersion?: string;
};

interface DriverToolDetails {
  state: "running" | DriverResult["state"];
  progress?: DriverProgress;
  result?: DriverResult;
}

interface SessionStatePayload {
  found?: boolean;
  state?: {
    runId?: string;
    runDir?: string;
  };
}

interface SessionStateCommandResult {
  code: number;
  stdout: string;
}

function progressText(progress: DriverProgress): string {
  const effect = progress.effectId ? ` ${progress.effectId}` : "";
  return `Babysitter${effect} · ${progress.stage.replaceAll("_", " ")} · ${progress.message}`;
}

class ReadOnlyProjectionText {
  constructor(private readonly text: string) {}

  render(_width: number): string[] {
    return this.text.split("\n");
  }

  invalidate(): void {}
}

const COMMANDS = [
  "assimilate",
  "call",
  "cleanup",
  "contrib",
  "doctor",
  "forever",
  "help",
  "observe",
  "plan",
  "plugins",
  "project-install",
  "resume",
  "retrospect",
  "user-install",
  "yolo",
] as const;

function toSkillPrompt(name: string, args: string): string {
  return `/skill:${name}${args ? ` ${args}` : ""}`;
}


export default function activate(pi: ExtensionAPI): void {
  initI18n(pi);
  const projectionApi = pi as ProjectionExtensionAPI;
  let activeContext: ExtensionContext | undefined;
  let ownedSessionId: string | undefined;
  let projectionGeneration = 0;
  let projectionOperationSequence = 0;
  let projectionWarningReported = false;
  let latestProgress: DriverProgress | undefined;
  let projectionOwner: { runDir: string; generation: number; operationId: string } | undefined;
  let pendingProjectionProgress: DriverProgress | undefined;

  const reportProjectionFailure = (
    error: unknown,
    stage: "clear" | "session_restore" | "operation_flush",
  ): void => {
    try {
      pi.logger.warn("Babysitter todo projection refresh was skipped", {
        category: "todo_projection_refresh_failed",
        stage,
        diagnostic: sanitizeDiagnosticText(error instanceof Error ? error.message : String(error)),
        fatal: false,
      });
    } catch {
      // Display diagnostics must not replace host lifecycle or tool outcomes.
    }
  };

  const clearNativeProjection = (stage: "clear" | "session_restore" | "operation_flush"): void => {
    if (getTodoProjectionGate(projectionApi) !== "available") return;
    try {
      projectionApi.setTodoProjection!(PROJECTION_NAMESPACE, undefined);
    } catch (error) {
      reportProjectionFailure(error, stage);
    }
  };

  const clearProjection = (): void => {
    projectionOwner = undefined;
    latestProgress = undefined;
    pendingProjectionProgress = undefined;
    projectionGeneration += 1;
    clearNativeProjection("clear");
    const ui = activeContext?.ui;
    try {
      ui?.setStatus(PROJECTION_NAMESPACE, undefined);
      ui?.setWidget(PROJECTION_NAMESPACE, undefined);
    } catch (error) {
      reportProjectionFailure(error, "clear");
    }
  };

  const refreshProjection = async (
    runDir: string,
    generation: number,
    stage: "session_restore" | "operation_flush",
  ): Promise<boolean> => {
    try {
      const gate = getTodoProjectionGate(projectionApi);
      const phases = await reconstructBabysitterProjection(runDir);
      if (generation !== projectionGeneration) return false;
      if (gate !== "available") {
        const fallback = latestProgress && latestProgress.runDir === runDir
          ? progressText(latestProgress)
          : `Babysitter ${path.basename(runDir)} · ${phases[0]?.tasks.length ?? 0} effects`;
        activeContext?.ui.setStatus(PROJECTION_NAMESPACE, fallback);
        activeContext?.ui.setWidget(PROJECTION_NAMESPACE, [fallback]);
        if (!projectionWarningReported) {
          projectionWarningReported = true;
          pi.logger.warn("Babysitter todo projection is unavailable in this OMP version", {
            category: gate === "missing_capability" ? "todo_projection_unavailable" : "todo_projection_version_mismatch",
            hostVersion: projectionApi.hostVersion ?? "undeclared",
            minimumVersion: TODO_PROJECTION_MIN_OMP_VERSION,
            fatal: false,
          });
        }
        return true;
      }
      projectionApi.setTodoProjection?.(PROJECTION_NAMESPACE, phases);
      return true;
    } catch (error) {
      if (generation === projectionGeneration) {
        clearNativeProjection(stage);
        reportProjectionFailure(error, stage);
      }
      return false;
    }
  };

  const flushProjectionProgress = async (operationId: string | undefined): Promise<void> => {
    const progress = pendingProjectionProgress;
    if (!progress || !operationId || progress.operationId !== operationId) return;
    pendingProjectionProgress = undefined;
    const owner = projectionOwner;
    if (
      !owner ||
      owner.generation !== projectionGeneration ||
      owner.operationId !== operationId ||
      owner.runDir !== path.resolve(progress.runDir)
    ) return;
    latestProgress = progress;
    const text = progressText(progress);
    try {
      activeContext?.ui.setStatus(PROJECTION_NAMESPACE, text);
      activeContext?.ui.setWidget(PROJECTION_NAMESPACE, [text]);
    } catch (error) {
      reportProjectionFailure(error, "operation_flush");
    }
    await refreshProjection(progress.runDir, owner.generation, "operation_flush");
  };

  const driver = new OmpDeterministicDriver({
    cwd: process.cwd(),
    runCli: async (args, timeoutMs, signal) => {
      const result = await pi.exec("babysitter", args, {
        cwd: activeContext?.cwd ?? process.cwd(),
        timeout: timeoutMs ?? 120_000,
        signal,
      });
      return {
        code: result.code,
        stdout: result.stdout,
        stderr: result.stderr,
        killed: result.killed,
      };
    },
    onProgress: (progress) => {
      const owner = projectionOwner;
      if (
        !owner ||
        owner.generation !== projectionGeneration ||
        owner.operationId !== progress.operationId ||
        owner.runDir !== path.resolve(progress.runDir)
      ) return;
      pendingProjectionProgress = progress;
    },
    onProgressError: (error, progress) => {
      try {
        pi.logger.warn("Babysitter progress listener failed without affecting orchestration", {
          category: "progress_listener_failed",
          stage: progress.stage,
          diagnostic: sanitizeDiagnosticText(error instanceof Error ? error.message : String(error)),
        });
      } catch {
        // Host diagnostics must never fail the deterministic driver.
      }
    },
  });

  const agentCompleteParameters = pi.zod.object({
    runDir: pi.zod.string(),
    effectId: pi.zod.string(),
    invocationKey: pi.zod.string(),
    ownerName: pi.zod.string(),
    dispatchToken: pi.zod.string(),
    bridgeEnvelopeSha256: pi.zod.string(),
    model: pi.zod.string().optional(),
    value: pi.zod.unknown(),
  });
  pi.registerTool<typeof agentCompleteParameters>({
    name: "babysitter_agent_complete",
    label: "Complete owned Babysitter agent effect",
    description: "Durably deliver the final value for the one Babysitter agent effect identified by a BABYSITTER_OMP_BRIDGE descriptor. Call only when the assignment explicitly provides that descriptor.",
    parameters: agentCompleteParameters,
    approval: "exec",
    async execute(_toolCallId, params) {
      const operationId = projectionOwner?.operationId;
      try {
        const completion = await driver.withProgressOperation(
          operationId,
          () => driver.completeAgentOwnerValue(params),
        );
        return {
          content: [{ type: "text", text: JSON.stringify(completion, null, 2) }],
          details: completion,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: sanitizeDiagnosticText(error instanceof Error ? error.message : String(error)),
          }],
          details: { handled: true },
          isError: true,
        };
      } finally {
        await flushProjectionProgress(operationId);
      }
    },
  });

  const agentRetryParameters = pi.zod.object({
    runDir: pi.zod.string(),
    effectId: pi.zod.string(),
    invocationKey: pi.zod.string(),
    ownerName: pi.zod.string(),
    dispatchToken: pi.zod.string(),
    bridgeEnvelopeSha256: pi.zod.string(),
    model: pi.zod.string().optional(),
    reason: pi.zod.string(),
  });
  pi.registerTool<typeof agentRetryParameters>({
    name: "babysitter_agent_retry",
    label: "Authorize Babysitter agent retry",
    description: "Explicitly supersede a failed, aborted, or cancelled retained owner attempt. The prior owner becomes stale and cannot complete the new attempt.",
    parameters: agentRetryParameters,
    approval: "exec",
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      activeContext = ctx;
      driver.setWorkspaceCwd(typeof ctx?.cwd === "string" ? ctx.cwd : activeContext?.cwd ?? process.cwd());
      const operationId = projectionOwner?.operationId;
      try {
        const authorization = await driver.withProgressOperation(
          operationId,
          () => driver.authorizeAgentRetry(params),
        );
        if (!authorization.handled || authorization.reason) {
          return {
            content: [{ type: "text", text: authorization.reason ?? "Retry authorization was not handled" }],
            details: authorization,
            isError: true,
          };
        }
        const continuation = await driver.drive(params.runDir, undefined, operationId);
        return {
          content: [{ type: "text", text: JSON.stringify(continuation, null, 2) }],
          details: { ...authorization, continuation },
        };
      } finally {
        await flushProjectionProgress(operationId);
      }
    },
  });

  pi.registerTool<typeof agentRetryParameters>({
    name: "babysitter_agent_cancel",
    label: "Cancel owned Babysitter agent attempt",
    description: "Explicitly mark the current retained owner attempt cancelled. A subsequent retry still requires babysitter_agent_retry authorization.",
    parameters: agentRetryParameters,
    approval: "exec",
    async execute(_toolCallId, params) {
      const operationId = projectionOwner?.operationId;
      try {
        const cancellation = await driver.withProgressOperation(
          operationId,
          () => driver.cancelAgentAttempt(params),
        );
        return {
          content: [{ type: "text", text: cancellation.reason ?? JSON.stringify(cancellation, null, 2) }],
          details: cancellation,
          ...(!cancellation.handled || cancellation.reason ? { isError: true } : {}),
        };
      } finally {
        await flushProjectionProgress(operationId);
      }
    },
  });

  const driveParameters = pi.zod.object({
    i: pi.zod.string().describe("Concise intent"),
    runDir: pi.zod.string().describe("Absolute Babysitter run directory"),
  });
  pi.registerTool<typeof driveParameters, DriverToolDetails>({
    name: "babysitter_drive",
    label: "Babysitter deterministic driver",
    description: "Deterministically execute and checkpoint Babysitter shell effects, post completed results, and iterate until an agent or human decision is required.",
    parameters: driveParameters,
    approval: "exec",
    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      activeContext = ctx;
      driver.setWorkspaceCwd(typeof ctx?.cwd === "string" ? ctx.cwd : activeContext?.cwd ?? process.cwd());
      latestProgress = undefined;
      pendingProjectionProgress = undefined;
      const operationId = `drive:${projectionGeneration}:${++projectionOperationSequence}`;
      projectionOwner = {
        runDir: path.resolve(params.runDir),
        generation: projectionGeneration,
        operationId,
      };
      let toolProgress: DriverProgress | undefined;
      const unsubscribe = driver.onProgress((progress) => {
        if (progress.operationId !== operationId) return;
        toolProgress = progress;
        onUpdate?.({
          content: [{ type: "text", text: progressText(progress) }],
          details: { state: "running", progress } satisfies DriverToolDetails,
        });
      });
      try {
        const result = await driver.drive(params.runDir, signal, operationId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          details: {
            state: result.state,
            ...(toolProgress ? { progress: toolProgress } : {}),
          } satisfies DriverToolDetails,
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: sanitizeDiagnosticText(error instanceof Error ? error.message : String(error)),
          }],
          details: {
            state: "operator_attention",
            ...(toolProgress ? { progress: toolProgress } : {}),
          } satisfies DriverToolDetails,
          isError: true,
        };
      } finally {
        await flushProjectionProgress(operationId);
        unsubscribe();
      }
    },
    renderCall(args) {
      return new ReadOnlyProjectionText(`Babysitter deterministic driver · ${path.basename(args.runDir)}`);
    },
    renderResult(result, options) {
      const details = result.details as DriverToolDetails | undefined;
      const progress = details?.progress;
      const summary = progress
        ? progressText(progress)
        : `Babysitter · ${details?.result?.state ?? details?.state ?? (result.isError ? "operator attention" : "completed")}`;
      const text = options.expanded && progress
        ? `${summary}\n${progress.key} · update ${progress.sequence}`
        : summary;
      return new ReadOnlyProjectionText(text);
    },
  });

  pi.on("tool_call", async (event) => {
    if (event.toolName !== "task") return;
    const operationId = projectionOwner?.operationId;
    try {
      const decision = await driver.withProgressOperation(
        operationId,
        () => driver.claimAgentToolCall(event.input, event.toolCallId),
      );
      if (decision.block) return { block: true, reason: decision.reason };
    } finally {
      await flushProjectionProgress(operationId);
    }
  });

  pi.on("tool_result", async (event) => {
    if (event.toolName !== "task") return;
    const operationId = projectionOwner?.operationId;
    try {
      const completion = await driver.withProgressOperation(
        operationId,
        () => driver.completeAgentToolCall({
          toolCallId: event.toolCallId,
          input: event.input,
          details: event.details,
          isError: event.isError,
        }),
      );
      if (!completion.handled) return;
      const message = completion.continuation
        ? `Babysitter deterministic continuation:\n${JSON.stringify(completion.continuation, null, 2)}`
        : completion.reason;
      if (!message) return;
      return {
        content: [...event.content, { type: "text", text: message }],
      };
    } catch (error) {
      return {
        content: [
          ...event.content,
          { type: "text", text: `Babysitter driver stopped: ${sanitizeDiagnosticText(error instanceof Error ? error.message : String(error))}` },
        ],
        isError: true,
      };
    } finally {
      await flushProjectionProgress(operationId);
    }
  });

  const restoreAssociatedProjection = async (
    sessionId: string,
    ctx: ExtensionContext,
    generation: number,
  ): Promise<void> => {
    let result: SessionStateCommandResult;
    try {
      result = await pi.exec("babysitter", ["session:state", "--session-id", sessionId, "--json"], {
        cwd: ctx.cwd,
        timeout: 30_000,
      });
    } catch {
      if (generation === projectionGeneration) {
        pi.logger.warn("Babysitter session projection restore was skipped", {
          category: "session_state_execution_failed",
          fatal: false,
        });
      }
      return;
    }
    if (generation !== projectionGeneration) return;
    if (result.code !== 0) {
      pi.logger.warn("Babysitter session projection restore was skipped", {
        category: "session_state_command_failed",
        fatal: false,
      });
      return;
    }
    let payload: SessionStatePayload;
    try {
      payload = JSON.parse(result.stdout) as SessionStatePayload;
    } catch {
      pi.logger.warn("Babysitter session projection restore was skipped", {
        category: "invalid_session_state",
        fatal: false,
      });
      return;
    }
    const runDir = payload.found === true && typeof payload.state?.runDir === "string"
      ? payload.state.runDir
      : undefined;
    if (runDir && generation === projectionGeneration) {
      projectionOwner = {
        runDir: path.resolve(runDir),
        generation,
        operationId: `restore:${generation}:${++projectionOperationSequence}`,
      };
    }
    if (runDir) {
      const restored = await refreshProjection(runDir, generation, "session_restore");
      if (
        !restored &&
        projectionOwner?.generation === generation &&
        projectionOwner.runDir === path.resolve(runDir)
      ) {
        projectionOwner = undefined;
        latestProgress = undefined;
        pendingProjectionProgress = undefined;
      }
    }
  };

  const clearOwnedSessionEnvironment = (): void => {
    const sessionId = ownedSessionId;
    if (!sessionId) return;
    if (process.env.OMP_SESSION_ID === sessionId) delete process.env.OMP_SESSION_ID;
    if (process.env.BABYSITTER_SESSION_ID === sessionId) delete process.env.BABYSITTER_SESSION_ID;
    ownedSessionId = undefined;
  };

  const syncSessionEnvironment = (ctx: ExtensionContext): string | undefined => {
    activeContext = ctx;
    driver.setWorkspaceCwd(ctx.cwd);
    const sessionId = ctx.sessionManager.getSessionId();
    process.env.OMP_PLUGIN_ROOT = PLUGIN_ROOT;
    if (!sessionId) {
      clearOwnedSessionEnvironment();
      return undefined;
    }
    process.env.OMP_SESSION_ID = sessionId;
    process.env.BABYSITTER_SESSION_ID = sessionId;
    ownedSessionId = sessionId;
    return sessionId;
  };
  const initializeSession = async (ctx: ExtensionContext): Promise<void> => {
    clearProjection();
    const generation = projectionGeneration;
    const sessionId = syncSessionEnvironment(ctx);
    if (!sessionId) {
      pi.logger.warn("Babysitter OMP session binding was skipped", {
        category: "missing_session",
        fatal: false,
      });
      return;
    }
    await restoreAssociatedProjection(sessionId, ctx, generation);
  };

  pi.on("session_start", (_event, ctx) => initializeSession(ctx));
  pi.on("session_switch", (_event, ctx) => initializeSession(ctx));
  pi.on("session_branch", (_event, ctx) => initializeSession(ctx));
  pi.on("session_tree", (_event, ctx) => initializeSession(ctx));
  pi.on("session_shutdown", (_event, ctx) => {
    const sessionId = ctx.sessionManager.getSessionId();
    if (sessionId && ownedSessionId !== sessionId) return;
    clearProjection();
    clearOwnedSessionEnvironment();
    activeContext = undefined;
  });

  // Register slash commands after lifecycle binding. Merely loading the
  // extension must never invoke session setup or create a session-less run.
  const forwardBabysit = async (args: unknown, ctx: ExtensionContext) => {
    syncSessionEnvironment(ctx);
    pi.sendUserMessage(toSkillPrompt("babysit", String(args ?? "").trim()));
  };

  pi.registerCommand("babysit", {
    description: "Load the Babysitter orchestration skill",
    handler: forwardBabysit,
  });

  pi.registerCommand("babysitter", {
    description: "Alias for /babysit",
    handler: forwardBabysit,
  });

  for (const name of COMMANDS) {
    const forward = async (args: unknown, ctx: ExtensionContext) => {
      syncSessionEnvironment(ctx);
      pi.sendUserMessage(toSkillPrompt(name, String(args ?? "").trim()));
    };

    pi.registerCommand(name, {
      description: name === "doctor"
        ? t("command.doctor.description", "Open the Babysitter doctor skill")
        : `Open the Babysitter ${name} skill`,
      handler: forward,
    });

    pi.registerCommand(`babysitter:${name}`, {
      description: name === "doctor"
        ? t("command.doctor.aliasDescription", "Alias for /doctor")
        : `Alias for /${name}`,
      handler: forward,
    });
  }
}
