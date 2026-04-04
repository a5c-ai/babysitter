/**
 * Babysitter Paperclip plugin worker.
 *
 * Handles the server-side logic: event routing from Paperclip agent runs,
 * babysitter run lifecycle management, breakpoint resolution, and data
 * serving for the UI components.
 *
 * ## Breakpoint interception model
 *
 * Paperclip wraps underlying harnesses (Claude Code, OpenClaw, etc.). Each
 * harness has its own babysitter plugin that drives the orchestration loop:
 *
 *   - Claude Code: stop-hook pauses between iterations. When only breakpoints
 *     are pending, the stop hook allows exit (approve decision) because the
 *     user must approve externally.
 *   - OpenClaw: agent_end hook fires async iteration. before_prompt_build
 *     injects breakpoint context.
 *
 * The Paperclip plugin SUPPLEMENTS (not replaces) this by:
 *   1. Monitoring run state for pending breakpoints via run:status / task:list
 *   2. Reading full breakpoint metadata from task.json (question, options,
 *      expert routing, tags, strategy)
 *   3. Surfacing breakpoints in the Paperclip dashboard UI
 *   4. Allowing approve/reject through Paperclip action handlers
 *   5. Posting results via task:post --status ok (ALWAYS ok, even for reject)
 *   6. The underlying harness picks up the resolved effect on next iteration
 *
 * ## Harness plugin installation
 *
 * On agent.run.started, we detect the underlying harness and check if the
 * babysitter plugin is installed for that harness. If not, we log a warning
 * and attempt installation via `babysitter harness:install-plugin <name>`.
 */

import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import * as bridge from "./babysitter-bridge";
import { detectHarness } from "./delegating-adapter";
import {
  checkHarnessPluginStatus,
  installHarnessPlugin as installViaInstaller,
} from "./harness-plugin-installer";
import type {
  TrackedRun,
  RunsOverview,
  RunDetail,
  PendingBreakpoint,
} from "./types";

/** Interval for polling run state for breakpoints (ms). */
const BREAKPOINT_POLL_INTERVAL = 5_000;

/** Active breakpoint polling timers keyed by runId. */
const activePollers = new Map<string, ReturnType<typeof setInterval>>();

const plugin = definePlugin({
  async setup(ctx) {
    // ---------------------------------------------------------------
    // Event handlers — react to Paperclip agent lifecycle events
    // ---------------------------------------------------------------

    ctx.events.on("agent.run.started", async (event) => {
      const agentId = event.entityId as string;
      const companyId = (event as Record<string, unknown>).companyId as string;

      ctx.logger.info("Agent run started", { agentId, companyId });

      // Look up agent to determine adapter type
      let adapterType: string | undefined;
      try {
        const agent = await ctx.agents.read(agentId, companyId);
        adapterType = (agent as Record<string, unknown>).adapterType as
          | string
          | undefined;
      } catch (err) {
        ctx.logger.warn("Could not read agent metadata", { agentId, err });
      }

      // Detect underlying harness
      const detection = detectHarness(adapterType, {
        defaultHarness: ctx.config?.defaultHarness as string | undefined,
      });

      ctx.logger.info("Detected harness", {
        agentId,
        harnessName: detection.harnessName,
        tier: detection.detectionTier,
        confidence: detection.confidence,
      });

      // Store detection result for this agent session
      await ctx.state.set(`agent:${agentId}:harness`, {
        ...detection,
        agentId,
        companyId,
        startedAt: new Date().toISOString(),
      });

      // Check if babysitter plugin is installed for the detected harness.
      // The underlying harness plugin is what drives the stop-hook iteration
      // loop and breakpoint presentation. Without it, orchestration won't work.
      try {
        const status = await checkHarnessPluginStatus(detection.harnessName);
        if (!status.pluginInstalled) {
          ctx.logger.warn(
            `Babysitter plugin not installed for harness ${detection.harnessName}. ` +
              `Attempting installation...`,
            { harnessName: detection.harnessName, installCommand: status.installCommand }
          );

          const installResult = await installViaInstaller(detection.harnessName);
          if (installResult.success) {
            ctx.logger.info("Harness plugin installed", {
              harnessName: detection.harnessName,
            });
          } else {
            ctx.logger.warn(
              `Could not auto-install babysitter plugin for ${detection.harnessName}. ` +
                `Run: ${status.installCommand}`,
              { output: installResult.output }
            );
          }
        } else {
          ctx.logger.info("Harness plugin already installed", {
            harnessName: detection.harnessName,
          });
        }
      } catch (err) {
        ctx.logger.warn("Harness plugin check failed", { err });
      }
    });

    ctx.events.on("agent.run.finished", async (event) => {
      const agentId = event.entityId as string;
      ctx.logger.info("Agent run finished", { agentId });
      await ctx.state.delete(`agent:${agentId}:harness`);
      stopBreakpointPolling(agentId);
    });

    ctx.events.on("agent.run.failed", async (event) => {
      const agentId = event.entityId as string;
      ctx.logger.warn("Agent run failed", { agentId });
      await ctx.state.delete(`agent:${agentId}:harness`);
      stopBreakpointPolling(agentId);
    });

    ctx.events.on("agent.run.cancelled", async (event) => {
      const agentId = event.entityId as string;
      ctx.logger.info("Agent run cancelled", { agentId });
      await ctx.state.delete(`agent:${agentId}:harness`);
      stopBreakpointPolling(agentId);
    });

    // ---------------------------------------------------------------
    // Data handlers — serve state to UI components
    // ---------------------------------------------------------------

    ctx.data.register("runs-overview", async () => {
      const tracked = await getTrackedRuns(ctx);

      const pendingBreakpoints = tracked.reduce(
        (sum, r) => sum + r.pendingBreakpoints.length,
        0
      );

      return {
        activeRuns: tracked.filter(
          (r) => r.status === "running" || r.status === "waiting"
        ),
        pendingBreakpoints,
        totalRuns: tracked.length,
      } satisfies RunsOverview;
    });

    ctx.data.register("run-detail", async (params) => {
      const runId = params.runId as string;
      const runsDir = (ctx.config?.runsDir as string) ?? ".a5c/runs";
      const runDir = bridge.buildRunDir(runsDir, runId);

      const [status, events, pendingTasks] = await Promise.all([
        bridge.getRunStatus(runDir),
        bridge.getRunEvents(runDir, 50),
        bridge.listPendingTasks(runDir),
      ]);

      // Get full breakpoint metadata from task.json files
      const breakpoints = await bridge.getPendingBreakpoints(runDir);

      const tracked = (await ctx.state.get(`run:${runId}`)) as TrackedRun | null;

      return {
        run: tracked ?? {
          runId,
          processId: "unknown",
          agentId: "unknown",
          companyId: "unknown",
          harnessName: "unknown",
          status: status.state as TrackedRun["status"],
          createdAt: "unknown",
          pendingBreakpoints: breakpoints,
        },
        events,
        pendingEffects: pendingTasks,
      } satisfies RunDetail;
    });

    ctx.data.register("pending-breakpoints", async () => {
      const runsDir = (ctx.config?.runsDir as string) ?? ".a5c/runs";
      const tracked = await getTrackedRuns(ctx);
      const allBreakpoints: Array<PendingBreakpoint & { runId: string }> = [];

      for (const run of tracked) {
        if (run.status !== "waiting") continue;

        // Fetch live breakpoint data with full metadata from task.json
        try {
          const runDir = bridge.buildRunDir(runsDir, run.runId);
          const bps = await bridge.getPendingBreakpoints(runDir);
          for (const bp of bps) {
            allBreakpoints.push({ ...bp, runId: run.runId });
          }
        } catch {
          // Fall back to cached data
          for (const bp of run.pendingBreakpoints) {
            allBreakpoints.push({ ...bp, runId: run.runId });
          }
        }
      }

      return allBreakpoints;
    });

    // ---------------------------------------------------------------
    // Action handlers — respond to UI interactions
    // ---------------------------------------------------------------

    ctx.actions.register("approve-breakpoint", async (params) => {
      const { runId, effectId, response } = params as {
        runId: string;
        effectId: string;
        response?: string;
        companyId?: string;
      };
      const runsDir = (ctx.config?.runsDir as string) ?? ".a5c/runs";
      const runDir = bridge.buildRunDir(runsDir, runId);

      // Approve: --status ok with { approved: true }
      // CRITICAL: Always use --status ok. Never --status error.
      const result = await bridge.approveBreakpoint(runDir, effectId, response);

      ctx.events.emit(
        "plugin.babysitter.breakpoint.resolved",
        (params as Record<string, unknown>).companyId as string,
        { runId, effectId, approved: true }
      );

      // Auto-iterate if enabled — the underlying harness will pick up the
      // resolved effect and continue the orchestration loop
      if (ctx.config?.autoIterate !== false) {
        await iterateAndStream(ctx, runId, runDir);
      }

      return result;
    });

    ctx.actions.register("reject-breakpoint", async (params) => {
      const { runId, effectId, feedback } = params as {
        runId: string;
        effectId: string;
        feedback: string;
        companyId?: string;
      };
      const runsDir = (ctx.config?.runsDir as string) ?? ".a5c/runs";
      const runDir = bridge.buildRunDir(runsDir, runId);

      // Reject: --status ok with { approved: false, feedback }
      // CRITICAL: Rejection uses --status ok, NOT --status error.
      // --status error signals a task execution failure and triggers RUN_FAILED,
      // requiring manual journal surgery to recover.
      const result = await bridge.rejectBreakpoint(runDir, effectId, feedback);

      ctx.events.emit(
        "plugin.babysitter.breakpoint.resolved",
        (params as Record<string, unknown>).companyId as string,
        { runId, effectId, approved: false, feedback }
      );

      // Auto-iterate — process will loop back with the rejection feedback
      // via the retry/refine pattern (previousFeedback, attempt fields)
      if (ctx.config?.autoIterate !== false) {
        await iterateAndStream(ctx, runId, runDir);
      }

      return result;
    });

    ctx.actions.register("create-run", async (params) => {
      const { processId, entry, inputsFile, agentId, companyId } = params as {
        processId: string;
        entry: string;
        inputsFile: string;
        agentId: string;
        companyId: string;
      };
      const runsDir = (ctx.config?.runsDir as string) ?? ".a5c/runs";

      const result = await bridge.createRun({
        processId,
        entry,
        inputsFile,
        runsDir,
      });

      // Track the run
      const harnessState = (await ctx.state.get(
        `agent:${agentId}:harness`
      )) as { harnessName: string } | null;

      const tracked: TrackedRun = {
        runId: result.runId,
        processId,
        agentId,
        companyId,
        harnessName: harnessState?.harnessName ?? "unknown",
        status: "running",
        createdAt: new Date().toISOString(),
        pendingBreakpoints: [],
      };

      await ctx.state.set(`run:${result.runId}`, tracked);

      ctx.events.emit("plugin.babysitter.run.created", companyId, {
        runId: result.runId,
        processId,
        agentId,
      });

      // Start breakpoint polling for this run
      startBreakpointPolling(ctx, result.runId, companyId, runsDir);

      return result;
    });

    // ---------------------------------------------------------------
    // Action: check and install harness plugin
    // ---------------------------------------------------------------

    ctx.actions.register("check-harness-plugin", async (params) => {
      const { harnessName } = params as { harnessName: string };
      return checkHarnessPluginStatus(harnessName);
    });

    ctx.actions.register("install-harness-plugin", async (params) => {
      const { harnessName } = params as { harnessName: string };
      return installViaInstaller(harnessName);
    });

    // ---------------------------------------------------------------
    // Stream handler — real-time run events
    // ---------------------------------------------------------------

    ctx.actions.register("subscribe-run-events", async (params) => {
      const { runId, companyId } = params as {
        runId: string;
        companyId: string;
      };

      const channel = `run-events:${runId}`;
      ctx.streams.open(channel, companyId);

      const runsDir = (ctx.config?.runsDir as string) ?? ".a5c/runs";
      const runDir = bridge.buildRunDir(runsDir, runId);

      // Emit current state
      try {
        const status = await bridge.getRunStatus(runDir);
        ctx.streams.emit(channel, { type: "status", data: status });

        const events = await bridge.getRunEvents(runDir, 20);
        for (const event of events) {
          ctx.streams.emit(channel, { type: "event", data: event });
        }

        // Check for pending breakpoints and emit them
        const bpCheck = await bridge.hasOnlyBreakpointsPending(runDir);
        if (bpCheck.onlyBreakpoints) {
          const breakpoints = await bridge.getPendingBreakpoints(runDir);
          ctx.streams.emit(channel, {
            type: "breakpoints-pending",
            data: { breakpoints, onlyBreakpoints: true },
          });
        }
      } catch (err) {
        ctx.streams.emit(channel, {
          type: "error",
          data: { message: String(err) },
        });
      }

      return { channel };
    });

    // ---------------------------------------------------------------
    // Tool handler — babysitter status for agents
    // ---------------------------------------------------------------

    ctx.tools.register(
      "babysitter-status",
      {
        displayName: "Babysitter Status",
        description:
          "Check the status of babysitter orchestration runs, including pending breakpoints and effects.",
        parametersSchema: {
          type: "object",
          properties: {
            runId: {
              type: "string",
              description:
                "Specific run ID to check. If omitted, returns overview.",
            },
          },
        },
      },
      async (params) => {
        const runId = (params as { runId?: string }).runId;
        const runsDir = (ctx.config?.runsDir as string) ?? ".a5c/runs";

        if (runId) {
          const runDir = bridge.buildRunDir(runsDir, runId);
          const [status, breakpoints] = await Promise.all([
            bridge.getRunStatus(runDir),
            bridge.getPendingBreakpoints(runDir),
          ]);

          const bpSummary =
            breakpoints.length > 0
              ? `\nPending breakpoints: ${breakpoints.map((b) => b.title).join(", ")}`
              : "";

          return {
            content:
              `Run ${runId}: ${status.state}. ` +
              `Pending: ${JSON.stringify(status.pendingByKind)}${bpSummary}`,
            data: { ...status, breakpoints },
          };
        }

        const tracked = await getTrackedRuns(ctx);
        const active = tracked.filter(
          (r) => r.status === "running" || r.status === "waiting"
        );
        const totalBps = tracked.reduce(
          (sum, r) => sum + r.pendingBreakpoints.length,
          0
        );
        return {
          content:
            `${active.length} active runs, ${tracked.length} total. ` +
            `${totalBps} pending breakpoints.`,
          data: {
            activeRuns: active.length,
            totalRuns: tracked.length,
            pendingBreakpoints: totalBps,
          },
        };
      }
    );
  },
});

// ---------------------------------------------------------------
// Breakpoint polling
// ---------------------------------------------------------------

/**
 * Start polling a run for pending breakpoints.
 *
 * This is how the Paperclip plugin intercepts breakpoints from the underlying
 * harness. The harness's stop hook has already paused the orchestration loop
 * (because only breakpoints are pending). We poll run:status to detect this
 * state and stream breakpoint details to the UI.
 */
function startBreakpointPolling(
  ctx: {
    streams: { open: (ch: string, id: string) => void; emit: (ch: string, evt: unknown) => void };
    state: { get: (k: string) => Promise<unknown>; set: (k: string, v: unknown) => Promise<void> };
    events: { emit: (name: string, companyId: string, payload: unknown) => void };
    logger: { info: (msg: string, data?: Record<string, unknown>) => void };
  },
  runId: string,
  companyId: string,
  runsDir: string
): void {
  if (activePollers.has(runId)) return;

  const runDir = bridge.buildRunDir(runsDir, runId);
  const channel = `run-events:${runId}`;
  let lastBreakpointIds = new Set<string>();

  const timer = setInterval(async () => {
    try {
      const bpCheck = await bridge.hasOnlyBreakpointsPending(runDir);

      if (bpCheck.onlyBreakpoints) {
        const breakpoints = await bridge.getPendingBreakpoints(runDir);
        const currentIds = new Set(breakpoints.map((b) => b.effectId));

        // Emit only newly discovered breakpoints
        const newBreakpoints = breakpoints.filter(
          (b) => !lastBreakpointIds.has(b.effectId)
        );

        if (newBreakpoints.length > 0) {
          ctx.streams.emit(channel, {
            type: "breakpoints-pending",
            data: { breakpoints: newBreakpoints, onlyBreakpoints: true },
          });

          for (const bp of newBreakpoints) {
            ctx.events.emit(
              "plugin.babysitter.breakpoint.requested",
              companyId,
              { runId, effectId: bp.effectId, title: bp.title, question: bp.question }
            );
          }

          ctx.logger.info("New breakpoints detected", {
            runId,
            count: newBreakpoints.length,
          });
        }

        lastBreakpointIds = currentIds;
      }

      // Check for completion
      const status = await bridge.getRunStatus(runDir);
      if (status.completionProof || status.state === "completed" || status.state === "failed") {
        stopBreakpointPolling(runId);
      }
    } catch {
      // Poll failures are non-fatal - run may not exist yet or may have been cleaned up
    }
  }, BREAKPOINT_POLL_INTERVAL);

  activePollers.set(runId, timer);
}

/** Stop polling for a run. */
function stopBreakpointPolling(key: string): void {
  const timer = activePollers.get(key);
  if (timer) {
    clearInterval(timer);
    activePollers.delete(key);
  }
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

/** Retrieve all tracked runs from plugin state. */
async function getTrackedRuns(ctx: {
  state: { get: (key: string) => Promise<unknown> };
}): Promise<TrackedRun[]> {
  const runs = (await ctx.state.get("tracked-runs")) as TrackedRun[] | null;
  return runs ?? [];
}

/** Iterate a run and stream events to the UI channel. */
async function iterateAndStream(
  ctx: {
    streams: { emit: (channel: string, event: unknown) => void };
    state: { set: (key: string, value: unknown) => Promise<void> };
    logger: { info: (msg: string, data?: Record<string, unknown>) => void };
  },
  runId: string,
  runDir: string
): Promise<void> {
  try {
    const result = await bridge.iterateRun(runDir);
    const channel = `run-events:${runId}`;

    ctx.streams.emit(channel, {
      type: "iteration",
      data: { status: result.status, nextActions: result.nextActions },
    });

    ctx.logger.info("Run iterated", { runId, status: result.status });
  } catch (err) {
    ctx.logger.info("Iteration failed", { runId, error: String(err) });
  }
}

export default plugin;
runWorker(plugin, import.meta.url);
