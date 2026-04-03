/**
 * harness:resume-run command handler.
 *
 * Uses an agentic Pi session to discover existing runs, present them to the
 * user, assess state, and resume orchestration by delegating to
 * handleHarnessCreateRun.
 *
 * The Pi agent has access to three domain-specific tools
 * (babysitter_list_runs, babysitter_assess_run, babysitter_resume_run) plus
 * the full agentic tool set (read/write/edit/grep/bash/etc.) for ad-hoc
 * inspection of run directories.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { Type } from "@sinclair/typebox";
import { readRunMetadata } from "../../storage/runFiles";
import { loadJournal } from "../../storage/journal";
import { readStateCache } from "../../runtime/replay/stateCache";
import { createPiSession, PiSessionHandle } from "../../harness/piWrapper";
import { createAgenticToolDefinitions } from "../../harness/agenticTools";
import type { PiSessionEvent } from "../../harness/types";
import { handleHarnessCreateRun } from "./harnessCreateRun";

const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";
const MAGENTA = "\x1b[35m";
const VERBOSE_LOG_LIMIT = 4_000;

export interface SessionResumeArgs {
  runId?: string;
  harness?: string;
  workspace?: string;
  model?: string;
  maxIterations?: number;
  runsDir: string;
  json: boolean;
  verbose: boolean;
  interactive?: boolean;
}

interface RunSummary {
  runId: string;
  runDir: string;
  processId: string;
  prompt?: string;
  createdAt: string;
  status: string;
  pendingEffects: Record<string, number>;
  totalEffects: number;
  resolvedEffects: number;
  entrypoint: { importPath: string; exportName: string };
}

// ---------------------------------------------------------------------------
// Utility functions (retained — used as backing implementations for tools)
// ---------------------------------------------------------------------------

/**
 * Determine high-level run status from journal events and state cache.
 */
function deriveRunStatus(
  journal: Array<{ type: string }>,
  pendingEffects: Record<string, number>,
): string {
  const types = new Set(journal.map((e) => e.type));
  if (types.has("RUN_COMPLETED")) return "completed";
  if (types.has("RUN_FAILED")) return "failed";
  const totalPending = Object.values(pendingEffects).reduce((a, b) => a + b, 0);
  if (totalPending > 0) return "waiting";
  if (types.has("EFFECT_REQUESTED")) return "in-progress";
  if (types.has("RUN_CREATED")) return "created";
  return "unknown";
}

/**
 * Discover runs from the runs directory.
 */
async function discoverRuns(runsDir: string, verbose: boolean): Promise<RunSummary[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(runsDir);
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "ENOENT") return [];
    throw err;
  }

  const runs: RunSummary[] = [];
  for (const entry of entries) {
    const runDir = path.join(runsDir, entry);
    try {
      const stat = await fs.stat(runDir);
      if (!stat.isDirectory()) continue;

      const metadata = await readRunMetadata(runDir);
      const journal = await loadJournal(runDir);
      const stateCache = await readStateCache(runDir);

      const pendingEffects = stateCache?.pendingEffectsByKind ?? {};
      const totalEffects = stateCache
        ? Object.keys(stateCache.effectsByInvocation).length
        : 0;
      const totalPending = Object.values(pendingEffects).reduce((a, b) => a + b, 0);
      const resolvedEffects = totalEffects - totalPending;

      const status = deriveRunStatus(journal, pendingEffects);

      runs.push({
        runId: metadata.runId,
        runDir,
        processId: metadata.processId,
        prompt: metadata.prompt,
        createdAt: metadata.createdAt,
        status,
        pendingEffects,
        totalEffects,
        resolvedEffects,
        entrypoint: metadata.entrypoint,
      });
    } catch {
      if (verbose) {
        process.stderr.write(`${DIM}  skipping ${entry}: unable to read metadata${RESET}\n`);
      }
    }
  }

  // Sort by createdAt descending
  runs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return runs.slice(0, 20);
}

/**
 * Build a detailed state assessment for a single run.
 */
async function assessRun(runDir: string): Promise<{
  run: RunSummary;
  journalLength: number;
  lastEvent: { type: string; recordedAt: string } | null;
}> {
  const metadata = await readRunMetadata(runDir);
  const journal = await loadJournal(runDir);
  const stateCache = await readStateCache(runDir);

  const pendingEffects = stateCache?.pendingEffectsByKind ?? {};
  const totalEffects = stateCache
    ? Object.keys(stateCache.effectsByInvocation).length
    : 0;
  const totalPending = Object.values(pendingEffects).reduce((a, b) => a + b, 0);
  const resolvedEffects = totalEffects - totalPending;
  const status = deriveRunStatus(journal, pendingEffects);

  const lastEvent = journal.length > 0
    ? { type: journal[journal.length - 1].type, recordedAt: journal[journal.length - 1].recordedAt }
    : null;

  return {
    run: {
      runId: metadata.runId,
      runDir,
      processId: metadata.processId,
      prompt: metadata.prompt,
      createdAt: metadata.createdAt,
      status,
      pendingEffects,
      totalEffects,
      resolvedEffects,
      entrypoint: metadata.entrypoint,
    },
    journalLength: journal.length,
    lastEvent,
  };
}

// ---------------------------------------------------------------------------
// Verbose / progress helpers
// ---------------------------------------------------------------------------

function writeVerboseLine(enabled: boolean, json: boolean, message: string): void {
  if (!json && enabled) {
    process.stderr.write(`${DIM}${message}${RESET}\n`);
  }
}

function writeVerboseBlock(
  enabled: boolean,
  json: boolean,
  label: string,
  value: unknown,
  maxChars: number = VERBOSE_LOG_LIMIT,
): void {
  if (json || !enabled) {
    return;
  }
  let raw: string;
  try {
    raw = JSON.stringify(value, null, 2);
  } catch {
    raw = String(value);
  }
  if (raw.length > maxChars) {
    raw = raw.slice(0, maxChars) + `... (truncated, ${raw.length} chars total)`;
  }
  process.stderr.write(
    `${DIM}[${label}]${RESET}\n${DIM}${raw}${RESET}\n`,
  );
}

// ---------------------------------------------------------------------------
// Tool result helpers
// ---------------------------------------------------------------------------

interface ToolResultShape {
  content: Array<{ type: "text"; text: string }>;
  details?: unknown;
}

function formatToolResult(data: unknown, message?: string): ToolResultShape {
  if (typeof data === "string") {
    return {
      content: [{
        type: "text",
        text: message ? `${message}\n${data}` : data,
      }],
      details: data,
    };
  }
  const content = message
    ? `${message}\n${JSON.stringify(data, null, 2)}`
    : JSON.stringify(data, null, 2);
  return {
    content: [{
      type: "text",
      text: content,
    }],
    details: data,
  };
}

function errorResult(message: string): ToolResultShape {
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
  };
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildResumeSystemPrompt(runsDir: string, runIdHint?: string): string {
  const parts = [
    "You are an assistant that helps users find and resume babysitter orchestration runs.",
    "",
    "## Your workflow",
    "",
    "1. **Discover runs** -- call `babysitter_list_runs` to list recent runs.",
    runIdHint
      ? `2. The user has requested run ID "${runIdHint}". Call \`babysitter_assess_run\` with that run ID to inspect it.`
      : "2. Present the runs to the user. If there are multiple, use `AskUserQuestion` to let them pick one.",
    "3. **Assess** the selected run by calling `babysitter_assess_run` with the run ID.",
    "4. Show the user the run's state (status, pending effects, journal summary).",
    "5. If the run is resumable (not completed), call `babysitter_resume_run` to resume it.",
    "6. If the run is already completed, tell the user and stop.",
    "",
    "## Important rules",
    "",
    "- Always call `babysitter_list_runs` first to see what's available.",
    "- Use `AskUserQuestion` for interactive selection when there are multiple runs.",
    "- You may also use read, grep, bash and other tools to inspect run files in " + runsDir + " if more detail is needed.",
    "- Call `babysitter_resume_run` exactly once when ready to resume.",
    "- Do NOT attempt to modify run files yourself -- only use the provided resume tool.",
  ];
  return parts.join("\n");
}

function buildResumeUserPrompt(runIdHint?: string): string {
  if (runIdHint) {
    return `Resume the run with ID "${runIdHint}". Assess it and proceed.`;
  }
  return "Help me find and resume a babysitter run. Start by listing the available runs.";
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function handleHarnessResumeRun(args: SessionResumeArgs): Promise<number> {
  const {
    runsDir,
    json,
    verbose,
    interactive = true,
  } = args;

  const writeVerbose = (message: string): void => {
    writeVerboseLine(verbose, json, message);
  };
  const writeVerboseData = (label: string, value: unknown, maxChars?: number): void => {
    writeVerboseBlock(verbose, json, label, value, maxChars);
  };

  // Track whether the agent has triggered a resume (set by the resume tool).
  let resumeTriggered = false;
  let resumeExitCode = 0;

  // -----------------------------------------------------------------
  // Define domain-specific tools
  // -----------------------------------------------------------------

  const customTools: unknown[] = [
    {
      name: "babysitter_list_runs",
      label: "List Runs",
      description:
        "List recent runs in the runs directory with status and metadata. " +
        "Returns up to 20 runs sorted by most recent first.",
      parameters: Type.Object({
        statusFilter: Type.Optional(
          Type.String({ description: "Optional status filter: created, in-progress, waiting, failed, completed" }),
        ),
      }),
      execute: async (
        _toolCallId: string,
        params: { statusFilter?: string },
      ): Promise<ToolResultShape> => {
        writeVerboseData("resume tool babysitter_list_runs", params);
        try {
          let runs = await discoverRuns(runsDir, verbose);
          if (params.statusFilter) {
            runs = runs.filter((r) => r.status === params.statusFilter);
          }
          if (runs.length === 0) {
            return formatToolResult(
              { runs: [], runsDir },
              "No runs found.",
            );
          }
          const summary = runs.map((r) => ({
            runId: r.runId,
            processId: r.processId,
            status: r.status,
            createdAt: r.createdAt,
            prompt: r.prompt
              ? r.prompt.length > 80 ? r.prompt.slice(0, 77) + "..." : r.prompt
              : undefined,
            effects: `${r.resolvedEffects}/${r.totalEffects} resolved`,
            pendingEffects: r.pendingEffects,
          }));
          return formatToolResult(
            { count: runs.length, runs: summary },
            `Found ${runs.length} run(s).`,
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return errorResult(`Failed to list runs: ${msg}`);
        }
      },
    },
    {
      name: "babysitter_assess_run",
      label: "Assess Run",
      description:
        "Get detailed state assessment for a specific run by ID. " +
        "Returns status, effects, journal summary, and entrypoint info.",
      parameters: Type.Object({
        runId: Type.String({ description: "The run ID (or prefix) to assess" }),
      }),
      execute: async (
        _toolCallId: string,
        params: { runId: string },
      ): Promise<ToolResultShape> => {
        writeVerboseData("resume tool babysitter_assess_run", params);
        const runDir = path.join(runsDir, params.runId);
        try {
          const assessment = await assessRun(runDir);
          return formatToolResult(
            {
              runId: assessment.run.runId,
              processId: assessment.run.processId,
              status: assessment.run.status,
              createdAt: assessment.run.createdAt,
              prompt: assessment.run.prompt,
              totalEffects: assessment.run.totalEffects,
              resolvedEffects: assessment.run.resolvedEffects,
              pendingEffects: assessment.run.pendingEffects,
              journalEvents: assessment.journalLength,
              lastEvent: assessment.lastEvent,
              entrypoint: assessment.run.entrypoint,
              runDir: assessment.run.runDir,
              resumable: assessment.run.status !== "completed",
            },
            `Run ${assessment.run.runId} assessed.`,
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return errorResult(`Failed to assess run "${params.runId}": ${msg}`);
        }
      },
    },
    {
      name: "babysitter_resume_run",
      label: "Resume Run",
      description:
        "Resume orchestration for a specific run. Call this exactly once " +
        "after assessing the run and confirming it should be resumed.",
      parameters: Type.Object({
        runId: Type.String({ description: "The run ID to resume" }),
      }),
      execute: async (
        _toolCallId: string,
        params: { runId: string },
      ): Promise<ToolResultShape> => {
        writeVerboseData("resume tool babysitter_resume_run", params);
        if (resumeTriggered) {
          return errorResult("Resume has already been triggered for this session.");
        }

        const runDir = path.join(runsDir, params.runId);
        try {
          const assessment = await assessRun(runDir);
          const selectedRun = assessment.run;

          if (selectedRun.status === "completed") {
            return formatToolResult(
              { runId: selectedRun.runId, status: "completed" },
              "Run is already completed. Nothing to resume.",
            );
          }

          resumeTriggered = true;

          if (!json) {
            process.stderr.write(
              `${MAGENTA}Resuming run ${BOLD}${selectedRun.runId}${RESET}${MAGENTA}...${RESET}\n\n`,
            );
          }

          // Resolve the process entry path
          const entryImportPath = selectedRun.entrypoint.importPath;
          const processPath = path.isAbsolute(entryImportPath)
            ? entryImportPath
            : path.resolve(entryImportPath);

          resumeExitCode = await handleHarnessCreateRun({
            processPath,
            prompt: selectedRun.prompt,
            harness: args.harness,
            workspace: args.workspace,
            model: args.model,
            maxIterations: args.maxIterations,
            runsDir: args.runsDir,
            json: args.json,
            verbose: args.verbose,
            interactive: args.interactive,
            existingRunId: selectedRun.runId,
            existingRunDir: selectedRun.runDir,
          });

          return formatToolResult(
            { runId: selectedRun.runId, exitCode: resumeExitCode },
            resumeExitCode === 0
              ? "Run resumed successfully."
              : `Run resume completed with exit code ${resumeExitCode}.`,
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return errorResult(`Failed to resume run "${params.runId}": ${msg}`);
        }
      },
    },
  ];

  // -----------------------------------------------------------------
  // Build agentic tools (read/write/edit/grep/bash/etc.)
  // -----------------------------------------------------------------

  const agenticTools = createAgenticToolDefinitions({
    workspace: args.workspace ?? process.cwd(),
    interactive: interactive,
    askUserQuestionHandler: interactive
      ? undefined // Let the default AskUserQuestion handler work
      : undefined,
  });

  const mergedCustomTools: unknown[] = [...customTools, ...agenticTools];

  writeVerbose(
    `[resume setup] runsDir=${runsDir} workspace=${path.resolve(args.workspace ?? process.cwd())} model=${args.model ?? "(default)"}`,
  );
  writeVerboseData(
    "resume tools",
    (mergedCustomTools as Array<{ name?: string; label?: string }>).map((tool) => ({
      name: tool.name,
      label: tool.label,
    })),
  );

  // -----------------------------------------------------------------
  // Create Pi session
  // -----------------------------------------------------------------

  const systemPrompt = buildResumeSystemPrompt(runsDir, args.runId);
  const userPrompt = buildResumeUserPrompt(args.runId);

  writeVerboseData("resume system prompt", systemPrompt);
  writeVerboseData("resume user prompt", userPrompt);

  let session: PiSessionHandle | null = null;

  try {
    session = createPiSession({
      workspace: args.workspace,
      model: args.model,
      thinkingLevel: "low",
      toolsMode: "coding",
      customTools: mergedCustomTools,
      systemPrompt,
      isolated: true,
      ephemeral: true,
    });

    await session.initialize();

    // Subscribe to stream text output to stderr in non-JSON mode
    let unsubscribe: (() => void) | null = null;
    if (!json) {
      process.stderr.write(
        `\n${BOLD}${MAGENTA}Run Discovery${RESET} ${DIM}Agent is searching for runs...${RESET}\n\n`,
      );
      unsubscribe = session.subscribe((event: PiSessionEvent) => {
        if (event.type === "text_delta") {
          const text = (event as { text?: string }).text;
          if (text) process.stderr.write(text);
        }
      });
    }

    // Prompt the agent
    const result = await session.prompt(userPrompt, 300_000);

    if (unsubscribe) unsubscribe();
    if (!json) process.stderr.write("\n");

    writeVerboseData("resume agent result", {
      success: result.success,
      outputPreview: result.output.length > 500
        ? result.output.slice(0, 497) + "..."
        : result.output,
      resumeTriggered,
    });

    if (!result.success && !resumeTriggered) {
      if (json) {
        process.stdout.write(
          JSON.stringify({ ok: false, error: "Resume agent failed", details: result.output }) + "\n",
        );
      } else {
        process.stderr.write(`${RED}Resume agent failed:${RESET} ${result.output}\n`);
      }
      return 1;
    }

    // If the agent never triggered resume, it decided not to (e.g., no runs or user quit)
    if (!resumeTriggered) {
      if (json) {
        process.stdout.write(
          JSON.stringify({ ok: true, resumed: false, message: "No run was resumed" }) + "\n",
        );
      }
      return 0;
    }

    return resumeExitCode;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (json) {
      process.stdout.write(
        JSON.stringify({ ok: false, error: "Resume session failed", details: message }) + "\n",
      );
    } else {
      process.stderr.write(`${RED}Error:${RESET} ${message}\n`);
    }
    return 1;
  } finally {
    if (session) {
      try {
        session.dispose();
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
