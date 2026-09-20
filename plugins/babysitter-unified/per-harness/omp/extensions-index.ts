import { AsyncLocalStorage } from "node:async_hooks";
import type { ExtensionAPI, ExtensionContext } from "@oh-my-pi/pi-coding-agent";
import * as path from "node:path";
import { initI18n, t } from "./i18n.js";
import {
  type DriverProgress,
  assertOmpLiveSessionOwnership,
  assertOmpRunOwnership,
  executeHostShell,
  type DriverResult,
  type ProjectionTodoPhase,
  driverFailureDiagnostic,
  OmpDeterministicDriver,
  reconstructBabysitterProjection,
  sanitizeDiagnosticText,
} from "./driver.js";

const PLUGIN_ROOT = path.resolve(__dirname, "..");

const PROJECTION_NAMESPACE = "babysitter";
const PROJECTION_PROGRESS_INTERVAL_MS = 250;

type ProjectionExtensionAPI = ExtensionAPI & {
  setTodoProjection: (namespace: string, phases: readonly ProjectionTodoPhase[] | undefined) => void;
  pi: ExtensionAPI["pi"] & {
    registerTrustedTaskInvocationModelOverride: (input: {
      scopeId: string;
      toolCallId: string;
      model: string;
      agent: "babysitter-task";
      name: string;
      envelopeSha256: string;
    }) => void;
    clearTrustedTaskInvocationModelOverride: (scopeId: string, toolCallId: string) => void;
  };
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
  const counters = progress.stdoutBytes !== undefined || progress.stderrBytes !== undefined
    ? ` · stdout ${progress.stdoutBytes ?? 0} B${progress.stdoutTruncated ? "+" : ""} · stderr ${progress.stderrBytes ?? 0} B${progress.stderrTruncated ? "+" : ""}`
    : "";
  return `Babysitter${effect} · ${progress.stage.replaceAll("_", " ")} · ${progress.message}${counters}`;
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
  let latestProgress: DriverProgress | undefined;
  let projectionOwner: { runDir: string; generation: number; operationId: string } | undefined;
  let pendingProjectionProgress: DriverProgress | undefined;
  let projectionFlushTimer: NodeJS.Timeout | undefined;
  let projectionFlushQueued = false;
  let projectionFlushPromise: Promise<void> | undefined;
  let projectionRefreshFailedOperationId: string | undefined;
  let driveQueue = Promise.resolve();
  const driveContext = new AsyncLocalStorage<ExtensionContext | undefined>();

  const enqueueDrive = async <T>(operation: () => Promise<T>): Promise<T> => {
    const predecessor = driveQueue;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    driveQueue = predecessor.catch(() => undefined).then(() => gate);
    await predecessor.catch(() => undefined);
    try {
      return await operation();
    } finally {
      release();
    }
  };
  let lastProjectionFlushAt = 0;

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
    try {
      projectionApi.setTodoProjection(PROJECTION_NAMESPACE, undefined);
    } catch (error) {
      reportProjectionFailure(error, stage);
    }
  };

  const clearProjection = (): void => {
    projectionOwner = undefined;
    latestProgress = undefined;
    pendingProjectionProgress = undefined;
    projectionFlushQueued = false;
    clearTimeout(projectionFlushTimer);
    projectionFlushTimer = undefined;
    projectionRefreshFailedOperationId = undefined;
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
    operationId: string,
    stage: "session_restore" | "operation_flush",
  ): Promise<boolean> => {
    const stillOwnsProjection = (): boolean => {
      const owner = projectionOwner;
      return generation === projectionGeneration &&
        owner?.generation === generation &&
        owner.operationId === operationId &&
        owner.runDir === path.resolve(runDir);
    };
    try {
      const phases = await reconstructBabysitterProjection(runDir);
      if (!stillOwnsProjection()) return false;
      projectionApi.setTodoProjection(PROJECTION_NAMESPACE, phases);
      return true;
    } catch (error) {
      if (stillOwnsProjection()) {
        clearNativeProjection(stage);
        reportProjectionFailure(error, stage);
      }
      return false;
    }
  };

  const performProjectionProgressFlush = async (operationId: string | undefined): Promise<void> => {
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
      activeContext?.ui.setWidget(PROJECTION_NAMESPACE, progress.stage === "failure" ? undefined : [text]);
    } catch (error) {
      reportProjectionFailure(error, "operation_flush");
    }
    if (projectionRefreshFailedOperationId === operationId) return;
    const refreshed = await refreshProjection(progress.runDir, owner.generation, owner.operationId, "operation_flush");
    if (!refreshed) projectionRefreshFailedOperationId = operationId;
  };

  const startProjectionProgressFlush = (operationId: string): Promise<void> => {
    if (projectionFlushPromise) return projectionFlushPromise;
    lastProjectionFlushAt = Date.now();
    const running = performProjectionProgressFlush(operationId).finally(() => {
      if (projectionFlushPromise === running) projectionFlushPromise = undefined;
      const pendingOperationId = pendingProjectionProgress?.operationId;
      if (pendingOperationId) scheduleProjectionProgressFlush(pendingOperationId);
    });
    projectionFlushPromise = running;
    return running;
  };

  const scheduleProjectionProgressFlush = (operationId: string): void => {
    if (projectionFlushPromise || projectionFlushQueued || projectionFlushTimer) return;
    const remaining = PROJECTION_PROGRESS_INTERVAL_MS - (Date.now() - lastProjectionFlushAt);
    if (lastProjectionFlushAt === 0 || remaining <= 0) {
      projectionFlushQueued = true;
      queueMicrotask(() => {
        if (!projectionFlushQueued) return;
        projectionFlushQueued = false;
        void startProjectionProgressFlush(operationId);
      });
      return;
    }
    projectionFlushTimer = setTimeout(() => {
      projectionFlushTimer = undefined;
      void startProjectionProgressFlush(operationId);
    }, remaining);
    projectionFlushTimer.unref();
  };

  const flushProjectionProgress = async (operationId: string | undefined): Promise<void> => {
    projectionFlushQueued = false;
    clearTimeout(projectionFlushTimer);
    projectionFlushTimer = undefined;
    if (projectionFlushPromise) await projectionFlushPromise;
    await performProjectionProgressFlush(operationId);
  };

  const driver = new OmpDeterministicDriver({
    cwd: process.cwd(),
    runCli: async (args, timeoutMs, signal) => {
      const cwd = driveContext.getStore()?.cwd ?? activeContext?.cwd ?? process.cwd();
      const result = await pi.exec("babysitter", args, {
        cwd,
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
    executeShell: async (action, cwd, signal, progress) =>
      await executeHostShell(action, cwd, signal, async (command, args, options) => {
        const result = await pi.exec(command, args, options);
        return {
          code: result.code,
          stdout: result.stdout,
          stderr: result.stderr,
          killed: result.killed,
        };
      }, progress),
    onProgress: (progress) => {
      const owner = projectionOwner;
      if (
        !owner ||
        owner.generation !== projectionGeneration ||
        owner.operationId !== progress.operationId ||
        owner.runDir !== path.resolve(progress.runDir)
      ) return;
      pendingProjectionProgress = progress;
      scheduleProjectionProgressFlush(owner.operationId);
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

  const assertAuthoritativeLiveRun = async (
    runDir: string,
    ctx: ExtensionContext | undefined,
    signal?: AbortSignal,
  ): Promise<void> => {
    const candidateSessionId = typeof ctx?.sessionManager?.getSessionId === "function"
      ? ctx.sessionManager.getSessionId()
      : ownedSessionId;
    const sessionId = typeof candidateSessionId === "string" &&
      /^[A-Za-z0-9._:-]{1,256}$/.test(candidateSessionId)
      ? candidateSessionId
      : undefined;
    if (!sessionId) throw new Error("Authoritative OMP session binding is unavailable or invalid");
    await assertOmpRunOwnership(runDir, sessionId);
    const sessionStateResult = await pi.exec("babysitter", [
      "session:state",
      "--session-id",
      sessionId,
      "--json",
    ], {
      cwd: typeof ctx?.cwd === "string" ? ctx.cwd : process.cwd(),
      timeout: 30_000,
      signal,
    });
    if (sessionStateResult.code !== 0) {
      throw new Error("Failed to verify authoritative OMP session state");
    }
    let sessionStatePayload: unknown;
    try {
      sessionStatePayload = JSON.parse(sessionStateResult.stdout);
    } catch {
      throw new Error("OMP session state response is malformed");
    }
    await assertOmpLiveSessionOwnership(sessionStatePayload, runDir);
  };



  const agentRetryParameters = pi.zod.object({
    runDir: pi.zod.string(),
    effectId: pi.zod.string(),
    invocationKey: pi.zod.string(),
    ownerName: pi.zod.string(),
    dispatchToken: pi.zod.string(),
    model: pi.zod.string().optional(),
    reason: pi.zod.string(),
  });
  pi.registerTool<typeof agentRetryParameters>({
    name: "babysitter_agent_retry",
    label: "Authorize Babysitter agent retry",
    description: "Explicitly supersede a failed, aborted, or cancelled retained owner attempt. The prior owner becomes stale and cannot complete the new attempt.",
    parameters: agentRetryParameters,
    approval: "exec",
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const authorizationOperationId = projectionOwner?.operationId;
      try {
        await assertAuthoritativeLiveRun(params.runDir, ctx, signal);
      } catch (error) {
        return {
          content: [{ type: "text", text: driverFailureDiagnostic(error) }],
          details: { handled: false },
          isError: true,
        };
      }
      const authorization = await driver.withProgressOperation(
        authorizationOperationId,
        () => driver.authorizeAgentRetry(params),
      );
      await flushProjectionProgress(authorizationOperationId);
      if (!authorization.handled || authorization.reason) {
        return {
          content: [{ type: "text", text: authorization.reason ?? "Retry authorization was not handled" }],
          details: authorization,
          isError: true,
        };
      }
      const continuation = await enqueueDrive(async () => {
        activeContext = ctx;
        driver.setWorkspaceCwd(typeof ctx?.cwd === "string" ? ctx.cwd : process.cwd());
        const continuationOperationId = projectionOwner?.operationId;
        try {
          return await driveContext.run(
            ctx,
            () => driver.drive(params.runDir, undefined, continuationOperationId),
          );
        } finally {
          await flushProjectionProgress(continuationOperationId);
        }
      });
      return {
        content: [{ type: "text", text: JSON.stringify(continuation, null, 2) }],
        details: { ...authorization, continuation },
      };
    },
  });

  pi.registerTool<typeof agentRetryParameters>({
    name: "babysitter_agent_cancel",
    label: "Cancel owned Babysitter agent attempt",
    description: "Explicitly mark the current retained owner attempt cancelled. A subsequent retry still requires babysitter_agent_retry authorization.",
    parameters: agentRetryParameters,
    approval: "exec",
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const operationId = projectionOwner?.operationId;
      try {
        await assertAuthoritativeLiveRun(params.runDir, ctx, signal);
      } catch (error) {
        return {
          content: [{ type: "text", text: driverFailureDiagnostic(error) }],
          details: { handled: false },
          isError: true,
        };
      }
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

  const breakpointResponseParameters = pi.zod.object({
    i: pi.zod.string().describe("Concise intent"),
    runDir: pi.zod.string().describe("Absolute Babysitter run directory"),
    effectId: pi.zod.string(),
    invocationKey: pi.zod.string(),
    answer: pi.zod.unknown().describe("Complete host-authenticated breakpoint answer, including signed evidence when policy requires it"),
  });
  pi.registerTool<typeof breakpointResponseParameters>({
    name: "babysitter_breakpoint_respond",
    label: "Respond to Babysitter breakpoint",
    description: "Durably record one explicit human approval or decline for the exact pending breakpoint, then continue deterministic execution.",
    parameters: breakpointResponseParameters,
    approval: "exec",
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      return await enqueueDrive(async () => {
        activeContext = ctx;
        driver.setWorkspaceCwd(typeof ctx?.cwd === "string" ? ctx.cwd : process.cwd());
        const sessionId = typeof ctx?.sessionManager?.getSessionId === "function"
          ? syncSessionEnvironment(ctx)
          : ownedSessionId;
        if (!sessionId) {
          return {
            content: [{ type: "text", text: "Authoritative OMP session binding is unavailable or invalid" }],
            details: { handled: false },
            isError: true,
          };
        }
        const answer = params.answer;
        if (!answer || typeof answer !== "object" || Array.isArray(answer) || typeof (answer as Record<string, unknown>).approved !== "boolean") {
          return {
            content: [{ type: "text", text: "Breakpoint response must provide a complete answer object with approved as a boolean" }],
            details: { handled: false },
            isError: true,
          };
        }
        try {
          await assertOmpRunOwnership(params.runDir, sessionId);
          const sessionStateResult = await pi.exec("babysitter", [
            "session:state",
            "--session-id",
            sessionId,
            "--json",
          ], {
            cwd: typeof ctx?.cwd === "string" ? ctx.cwd : process.cwd(),
            timeout: 30_000,
            signal,
          });
          if (sessionStateResult.code !== 0) {
            throw new Error("Failed to verify authoritative OMP session state");
          }
          await assertOmpLiveSessionOwnership(
            JSON.parse(sessionStateResult.stdout),
            params.runDir,
          );
          const operationId = projectionOwner?.operationId;
          const response = await driver.withProgressOperation(
            operationId,
            () => driver.resolveBreakpointResponse({ ...params, answer: answer as Record<string, unknown> }, signal),
          );
          if (!response.handled || response.reason) {
            return {
              content: [{
                type: "text",
                text: response.reason ?? "Breakpoint response was not handled",
              }],
              details: response,
              isError: true,
            };
          }
          const continuation = await driveContext.run(
            ctx,
            () => driver.drive(params.runDir, signal, operationId),
          );
          return {
            content: [{ type: "text", text: JSON.stringify(continuation, null, 2) }],
            details: { ...response, continuation },
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: driverFailureDiagnostic(error) }],
            details: { handled: false },
            isError: true,
          };
        } finally {
          await flushProjectionProgress(projectionOwner?.operationId);
        }
      });
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
      return await enqueueDrive(async () => {
        activeContext = ctx;
        driver.setWorkspaceCwd(typeof ctx?.cwd === "string" ? ctx.cwd : process.cwd());
        latestProgress = undefined;
        pendingProjectionProgress = undefined;
        projectionFlushQueued = false;
        clearTimeout(projectionFlushTimer);
        projectionFlushTimer = undefined;
        lastProjectionFlushAt = 0;
        projectionRefreshFailedOperationId = undefined;
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
          if (progress.stage === "failure") return;
          onUpdate?.({
            content: [{ type: "text", text: progressText(progress) }],
            details: { state: "running", progress } satisfies DriverToolDetails,
          });
        });
        try {
          const hasContextSession = typeof ctx?.sessionManager?.getSessionId === "function";
          const sessionId = hasContextSession ? syncSessionEnvironment(ctx) : ownedSessionId;
          if (!sessionId) throw new Error("Authoritative OMP session binding is unavailable or invalid");
          await assertOmpRunOwnership(params.runDir, sessionId);
          const sessionStateResult = await pi.exec("babysitter", [
            "session:state",
            "--session-id",
            sessionId,
            "--json",
          ], {
            cwd: typeof ctx?.cwd === "string" ? ctx.cwd : process.cwd(),
            timeout: 30_000,
            signal,
          });
          if (sessionStateResult.code !== 0) {
            throw new Error("Failed to verify authoritative OMP session state");
          }
          let sessionStatePayload: unknown;
          try {
            sessionStatePayload = JSON.parse(sessionStateResult.stdout);
          } catch {
            throw new Error("OMP session state response is malformed");
          }
          await assertOmpLiveSessionOwnership(sessionStatePayload, params.runDir);
          const result = await driveContext.run(
            ctx,
            () => driver.drive(params.runDir, signal, operationId),
          );
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
              text: driverFailureDiagnostic(error),
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
      });

    },
    renderCall(args) {
      return new ReadOnlyProjectionText(`Babysitter deterministic driver · ${path.basename(args.runDir)}`);
    },
    renderResult(result, options) {
      const details = result.details as DriverToolDetails | undefined;
      const progress = details?.progress;
      const terminalDiagnostic = result.isError
        ? result.content.find((part) => part.type === "text")?.text
        : undefined;
      const summary = terminalDiagnostic ?? (progress
        ? progressText(progress)
        : `Babysitter · ${details?.result?.state ?? details?.state ?? "completed"}`);
      const text = !terminalDiagnostic && options.expanded && progress
        ? `${summary}\n${progress.key} · update ${progress.sequence}`
        : summary;
      return new ReadOnlyProjectionText(text);
    },
  });

  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName !== "task") return;
    const operationId = projectionOwner?.operationId;
    try {
      const decision = await driver.withProgressOperation(
        operationId,
        () => driver.claimAgentToolCall(
          event.input,
          event.toolCallId,
          (runDir) => assertAuthoritativeLiveRun(runDir, ctx),
        ),
      );
      if (decision.block) return { block: true, reason: decision.reason };
      if (decision.modelOverride) {
        if (!decision.ownerName) return { block: true, reason: "Babysitter model override has no validated owner" };
        if (!decision.envelopeSha256) return { block: true, reason: "Babysitter model override has no validated envelope digest" };
        try {
          projectionApi.pi.registerTrustedTaskInvocationModelOverride({
            scopeId: ctx.sessionManager.getSessionId(),
            toolCallId: event.toolCallId,
            model: decision.modelOverride,
            agent: "babysitter-task",
            name: decision.ownerName,
            envelopeSha256: decision.envelopeSha256,
          });
        } catch (error) {
          return {
            block: true,
            reason: `Babysitter model override registration failed: ${sanitizeDiagnosticText(error instanceof Error ? error.message : String(error))}`,
          };
        }
      }
    } catch (error) {
      return {
        block: true,
        reason: driverFailureDiagnostic(error),
      };
    } finally {
      await flushProjectionProgress(operationId);
    }
  });

  pi.on("tool_result", async (event, ctx) => {
    if (event.toolName !== "task") return;
    const operationId = projectionOwner?.operationId;
    const completionContext = ctx ?? activeContext;
    try {
      const completion = await driver.withProgressOperation(
        operationId,
        () => driveContext.run(completionContext, () => driver.completeAgentToolCall({
          toolCallId: event.toolCallId,
          input: event.input,
          details: event.details,
          isError: event.isError,
        })),
      );
      if (!completion.handled) return;
      if (completion.continuationRunDir) {
        const continuationRunDir = completion.continuationRunDir;
        void enqueueDrive(async () => {
          activeContext = completionContext;
          driver.setWorkspaceCwd(
            typeof completionContext?.cwd === "string" ? completionContext.cwd : process.cwd(),
          );
          const continuationOperationId = projectionOwner?.operationId;
          try {
            await assertAuthoritativeLiveRun(continuationRunDir, completionContext);
            const continuation = await driveContext.run(
              completionContext,
              () => driver.drive(continuationRunDir, undefined, continuationOperationId),
            );
            await flushProjectionProgress(continuationOperationId);
            pi.sendUserMessage(
              `Babysitter deterministic continuation:\n${JSON.stringify(continuation, null, 2)}`,
            );
          } catch (error) {
            await flushProjectionProgress(continuationOperationId);
            pi.sendUserMessage(
              `Babysitter driver stopped: ${sanitizeDiagnosticText(error instanceof Error ? error.message : String(error))}`,
            );
          }
        });
      }
      if (!completion.reason) return;
      return {
        content: [...event.content, { type: "text", text: completion.reason }],
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
      projectionApi.pi.clearTrustedTaskInvocationModelOverride(
        completionContext.sessionManager.getSessionId(),
        event.toolCallId,
      );
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
    if (runDir && projectionOwner?.generation === generation) {
      const owner = projectionOwner;
      const restored = await refreshProjection(runDir, generation, owner.operationId, "session_restore");
      if (
        !restored &&
        projectionOwner?.generation === generation &&
        projectionOwner.operationId === owner.operationId &&
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
    if (!sessionId || !/^[A-Za-z0-9._:-]{1,256}$/.test(sessionId)) {
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
  const withSessionBinding = (prompt: string, sessionId: string | undefined): string => {
    if (!sessionId || !/^[A-Za-z0-9._:-]{1,256}$/.test(sessionId)) {
      return "Babysitter OMP operator attention: authoritative session binding is unavailable or invalid. Restart the OMP session before creating or resuming a run.";
    }
    const quotedSessionId = JSON.stringify(sessionId);
    return `${prompt}\n\nOMP session binding: prefix every Babysitter CLI command executed through a shell worker with \`OMP_SESSION_ID=${quotedSessionId} BABYSITTER_SESSION_ID=${quotedSessionId}\`.`;
  };
  const forwardBabysit = async (args: unknown, ctx: ExtensionContext) => {
    const sessionId = syncSessionEnvironment(ctx);
    pi.sendUserMessage(withSessionBinding(toSkillPrompt("babysit", String(args ?? "").trim()), sessionId));
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
      const sessionId = syncSessionEnvironment(ctx);
      pi.sendUserMessage(withSessionBinding(toSkillPrompt(name, String(args ?? "").trim()), sessionId));
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
