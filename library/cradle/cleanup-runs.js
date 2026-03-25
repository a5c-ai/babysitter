/**
 * @process cleanup-runs
 * @description Scan .a5c/runs and .a5c/processes, aggregate insights from completed/failed runs, summarize to docs, then clean up old data.
 * @inputs { repoRoot: string, runsDir: string, processesDir: string, dryRun: boolean, keepRecentDays: number }
 * @outputs { success: boolean, summary: string, scan: object, aggregation: object, cleanup: object }
 */

import { defineTask } from "@a5c-ai/babysitter-sdk";

// ─── Phase 1: Scan all runs and classify ───────────────────────────────────────

const scanRuns = defineTask("scan-runs", (args) => ({
  kind: "agent",
  title: "Scan and classify all runs",
  agent: {
    name: "general-purpose",
    prompt: {
      role: "DevOps engineer analyzing babysitter run history",
      task: `At ${args.repoRoot}, scan the runs directory at ${args.runsDir} and the processes directory at ${args.processesDir}.

For each run directory in ${args.runsDir}:
1. Read run.json to get: runId, processId, createdAt, prompt
2. Read journal files to determine state: completed (has RUN_COMPLETED), failed (has RUN_FAILED), or active (neither)
3. Calculate age in days from createdAt
4. Count tasks and their statuses

For processes in ${args.processesDir}:
1. List all .js process files
2. Check which ones are referenced by existing runs (match processId or entry path)
3. Identify orphaned processes (not referenced by any run)

Return a structured JSON report with:
- runs: array of { runId, processId, state, createdAt, ageDays, prompt (first 100 chars), taskCount }
- processes: array of { filename, referencedByRuns: string[], isOrphaned: boolean }
- stats: { totalRuns, completedRuns, failedRuns, activeRuns, orphanedProcesses, totalDiskEstimate }

Keep ${args.keepRecentDays} days threshold in mind — runs newer than this should be marked as "keep".`,
      outputFormat: "JSON with runs, processes, stats"
    },
    outputSchema: {
      type: "object",
      required: ["runs", "processes", "stats"],
    }
  }
}));

// ─── Phase 2: Aggregate insights from terminal runs ────────────────────────────

const aggregateInsights = defineTask("aggregate-insights", (args) => ({
  kind: "agent",
  title: "Aggregate insights from completed/failed runs",
  agent: {
    name: "general-purpose",
    prompt: {
      role: "Technical writer extracting insights from babysitter run history",
      task: `At ${args.repoRoot}, analyze the terminal runs (completed and failed) from the scan results.

Scan results:
${JSON.stringify(args.scan, null, 2)}

For each terminal run older than ${args.keepRecentDays} days:
1. Read the run's journal events to understand what happened
2. Read task results (result.json files) for key outcomes
3. Extract: what the run was about (from prompt and processId), whether it succeeded, key decisions made, lessons learned

Then aggregate into a summary document with these sections:
- **Run History Summary**: Table of all processed runs with dates, process types, and outcomes
- **Key Decisions & Insights**: Important decisions, architectural choices, and patterns that emerged
- **What Worked**: Successful patterns, methodologies, and approaches
- **What Didn't Work**: Failures, dead ends, and things to avoid
- **Recommendations**: Actionable suggestions for future runs

Write this as a markdown file at ${args.repoRoot}/docs/run-history-insights.md

Also prepare a compact summary (3-5 bullet points) suitable for appending to CLAUDE.md under a "## Run History Notes" section.

Return JSON with: insightsFile (path written), claudeMdSummary (string), runsProcessed (count), keyInsights (array of strings).`,
      outputFormat: "JSON with insightsFile, claudeMdSummary, runsProcessed, keyInsights"
    },
    outputSchema: {
      type: "object",
      required: ["insightsFile", "runsProcessed", "keyInsights"],
    }
  }
}));

// ─── Phase 3: Clean up old runs and orphaned processes ─────────────────────────

const cleanupOldData = defineTask("cleanup-old-data", (args) => ({
  kind: "agent",
  title: "Remove old run directories and orphaned processes",
  agent: {
    name: "general-purpose",
    prompt: {
      role: "DevOps engineer performing cleanup of old babysitter data",
      task: `At ${args.repoRoot}, clean up old babysitter data based on the scan and aggregation results.

Scan results:
${JSON.stringify(args.scan, null, 2)}

Aggregation results:
${JSON.stringify(args.aggregation, null, 2)}

Dry run mode: ${args.dryRun}

Rules:
1. ONLY remove runs that are in a terminal state (completed or failed) AND older than ${args.keepRecentDays} days
2. NEVER remove active/in-progress runs
3. Remove orphaned process files in ${args.processesDir} that are not referenced by any remaining run
4. Keep process files that are referenced by active or recent runs
5. Keep all -inputs.json files that pair with kept process files
6. Keep all .diagram.md and .process.md files that pair with kept process files

If dryRun is true:
- List what WOULD be removed but do NOT actually delete anything
- Return the list of paths that would be deleted

If dryRun is false:
- Actually delete the run directories using rm -rf for each
- Actually delete orphaned process files
- Verify deletions succeeded

Return JSON with:
- removedRuns: array of runIds removed (or would-be-removed in dry run)
- removedProcesses: array of filenames removed
- freedBytes: estimated bytes freed (approximate from file counts)
- keptRuns: array of runIds kept (with reason: "active", "recent", etc.)
- dryRun: boolean
- summary: human-readable summary string`,
      outputFormat: "JSON with removedRuns, removedProcesses, freedBytes, keptRuns, dryRun, summary"
    },
    outputSchema: {
      type: "object",
      required: ["removedRuns", "removedProcesses", "summary"],
    }
  }
}));

// ─── Phase 4: Verify and report ────────────────────────────────────────────────

const verifyCleanup = defineTask("verify-cleanup", (args) => ({
  kind: "shell",
  title: "Verify cleanup results",
  shell: {
    command: `cd "${args.repoRoot}" && echo "=== Remaining runs ===" && ls .a5c/runs/ 2>/dev/null | wc -l && echo "=== Remaining processes ===" && ls .a5c/processes/*.js 2>/dev/null | wc -l && echo "=== Disk usage ===" && du -sh .a5c/runs/ 2>/dev/null || echo "No runs dir" && echo "=== Insights file ===" && test -f docs/run-history-insights.md && echo "EXISTS" || echo "NOT FOUND"`,
  }
}));

// ─── Main process ──────────────────────────────────────────────────────────────

export async function process(inputs, ctx) {
  const repoRoot = inputs.repoRoot || ".";
  const runsDir = inputs.runsDir || ".a5c/runs";
  const processesDir = inputs.processesDir || ".a5c/processes";
  const dryRun = inputs.dryRun !== undefined ? inputs.dryRun : false;
  const keepRecentDays = inputs.keepRecentDays || 7;

  // Phase 1: Scan
  ctx.log("Phase 1: Scanning runs and processes...");
  const scan = await ctx.task(scanRuns, {
    repoRoot,
    runsDir,
    processesDir,
    keepRecentDays,
  });

  // Phase 2: Aggregate insights
  ctx.log("Phase 2: Aggregating insights from terminal runs...");
  const aggregation = await ctx.task(aggregateInsights, {
    repoRoot,
    scan,
    keepRecentDays,
  });

  // Phase 3: Clean up
  ctx.log("Phase 3: Cleaning up old data...");
  const cleanup = await ctx.task(cleanupOldData, {
    repoRoot,
    scan,
    aggregation,
    dryRun,
    keepRecentDays,
    processesDir,
  });

  // Phase 4: Verify
  ctx.log("Phase 4: Verifying cleanup...");
  const verification = await ctx.task(verifyCleanup, { repoRoot });

  return {
    success: true,
    summary: `Cleanup complete. ${cleanup.removedRuns?.length || 0} runs removed, ${cleanup.removedProcesses?.length || 0} processes removed. Insights saved to docs/run-history-insights.md.`,
    scan,
    aggregation,
    cleanup,
  };
}
