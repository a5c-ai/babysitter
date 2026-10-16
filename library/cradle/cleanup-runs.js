/**
 * @process cleanup-runs
 * @description Scan .a5c/runs and .a5c/processes, aggregate insights from completed/failed runs, summarize to docs, confirm via breakpoint, then archive and remove old runs. Orphaned process files are reported only unless removeOrphanedProcesses is set.
 * @inputs { repoRoot: string, runsDir: string, processesDir: string, dryRun: boolean, keepRecentDays: number, removeOrphanedProcesses: boolean }
 * @outputs { success: boolean, summary: string, scan: object, aggregation: object, cleanup: object }
   * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:bug-fixing-from-issues, skill-area:code-review-practice]
 *   workflows: [workflow:bug-triage, workflow:feature-development]
 *   roles: [role:backend-engineer, role:devops-engineer]
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
- **Run History Summary**: Table of all processed runs with runId, dates, process types, and outcomes
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

// ─── Phase 2b: Verify insights before anything is removed ──────────────────────

// Single-quote a value for POSIX sh.
const shq = (v) => `'${String(v).replace(/'/g, `'\\''`)}'`;

const verifyInsights = defineTask("verify-insights", (args) => ({
  kind: "shell",
  title: "Verify insights file lists every removal candidate",
  shell: {
    command: `set -eu
cd ${shq(args.repoRoot)}
F=docs/run-history-insights.md
test -s "$F" || { echo "FAIL: $F missing or empty"; exit 1; }
MISSING=0
for id in ${args.runIds.map(shq).join(" ")}; do grep -qF -- "$id" "$F" || { echo "MISSING $id"; MISSING=$((MISSING+1)); }; done
test "$MISSING" = 0 || { echo "FAIL: $MISSING candidate(s) not in $F"; exit 1; }
echo INSIGHTS_OK`,
  }
}));

// ─── Phase 3: Archive, then remove confirmed runs ──────────────────────────────
// Deterministic shell task (not an agent): it removes exactly the run ids that
// were shown in the confirm breakpoint, after a tar archive of them has been
// written under <repoRoot>/.a5c/runs-archive/ and verified to list every one.
//
// Orphaned process files are only touched when removeOrphanedProcesses is true.
// processesDir is often a hand-written, git-tracked library whose shared
// modules (helpers, policies, sub-processes) are imported by other process
// files but never named in any run.json, so "not referenced by a run" does not
// mean "unused". Even when enabled, git-tracked files and files whose name
// appears in another process file are kept, and deleted files are archived too.

const archiveAndRemove = defineTask("archive-and-remove", (args) => ({
  kind: "shell",
  title: "Archive confirmed runs, verify the archive, then remove them",
  shell: {
    command: `set -eu
cd ${shq(args.repoRoot)}
WANT=""; GOT=""; DEL=""
trap 'rm -f -- "$WANT" "$GOT" "$DEL"' EXIT
RUNS=$(cd ${shq(args.runsDir)} && pwd)
mkdir -p .a5c/runs-archive
TS=$(date -u +%Y%m%dT%H%M%SZ)
WANT=$(mktemp)
GOT=$(mktemp)
for id in ${args.runIds.map(shq).join(" ")}; do test -d "$RUNS/$id" || { echo "FAIL: run $id missing"; exit 1; }; echo "$id" >> "$WANT"; done
if [ -s "$WANT" ]; then
  A="$(pwd)/.a5c/runs-archive/cleanup-$TS-runs.tar.gz"
  tar -czf "$A" -C "$RUNS" $(sed 's#^#./#' "$WANT")
  tar -tzf "$A" | sed 's#^\\./##' | cut -d/ -f1 | grep . | sort -u > "$GOT"
  sort -u "$WANT" | cmp -s - "$GOT" || { echo "FAIL: archive $A does not list every candidate; nothing removed"; exit 1; }
  echo "ARCHIVE=$A"
  while read -r id; do rm -rf -- "$RUNS/$id"; done < "$WANT"
fi
echo "REMOVED_RUNS=$(grep -c . "$WANT" || true)"
${args.removeOrphanedProcesses === true && args.orphanedProcesses.length > 0 ? `PROCS=$(cd ${shq(args.processesDir)} && pwd)
DEL=$(mktemp)
for f in ${args.orphanedProcesses.map(shq).join(" ")}; do
  P="$PROCS/$f"
  test -f "$P" || { echo "KEEP $f (missing)"; continue; }
  if git -C "$(dirname "$P")" ls-files --error-unmatch "$(basename "$P")" >/dev/null 2>&1; then echo "KEEP $f (git-tracked)"; continue; fi
  STEM=$(basename "$f"); STEM=\${STEM%.*}
  if grep -rlF -- "$STEM" "$PROCS" | grep -vFx -- "$P" | grep -q .; then echo "KEEP $f (named by another file in processesDir)"; continue; fi
  echo "$f" >> "$DEL"
done
if [ -s "$DEL" ]; then
  B="$(pwd)/.a5c/runs-archive/cleanup-$TS-processes.tar.gz"
  tar -czf "$B" -C "$PROCS" $(sed 's#^#./#' "$DEL")
  while read -r f; do tar -tzf "$B" | sed 's#^\\./##' | grep -qFx -- "$f" || { echo "FAIL: $f not in $B; no process file removed"; exit 1; }; done < "$DEL"
  echo "PROCESS_ARCHIVE=$B"
  while read -r f; do rm -f -- "$PROCS/$f"; echo "REMOVED_PROCESS $f"; done < "$DEL"
fi` : `echo "Orphaned process files: report-only (removeOrphanedProcesses not set)"`}
echo REMOVE_OK`,
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

// ─── No-op short-circuit helper ────────────────────────────────────────────────
// Returns true when nothing is eligible for removal. Saves ~2 heavy agent-task
// invocations on cleanup passes where the prior pass was thorough and nothing
// new has accumulated.
// Only plain names (no "..", no absolute paths) are ever passed to a shell task.
const SAFE_NAME = /^(?!.*(^|\/)\.\.?(\/|$))[A-Za-z0-9._][A-Za-z0-9._/-]*$/;

function removableRunIds(scan, keepRecentDays) {
  return (scan?.runs || [])
    .filter((r) => (r.state === "completed" || r.state === "failed") && r.ageDays > keepRecentDays)
    .map((r) => String(r.runId ?? ""))
    .filter((id) => SAFE_NAME.test(id) && !id.includes("/"));
}

function orphanedProcessFiles(scan) {
  return (scan?.processes || [])
    .filter((p) => p.isOrphaned)
    .map((p) => String(p.filename ?? ""))
    .filter((f) => SAFE_NAME.test(f));
}

function isNoopScan(scan, keepRecentDays, removeOrphanedProcesses) {
  // Orphaned process files only count when their removal was explicitly
  // requested; by default they are report-only and never make a pass non-noop.
  return removableRunIds(scan, keepRecentDays).length === 0
    && (!removeOrphanedProcesses || orphanedProcessFiles(scan).length === 0);
}

const writeNoopAuditEntry = defineTask("write-noop-audit", (args) => ({
  kind: "shell",
  title: "Write no-op audit entry to docs/run-history-insights.md",
  shell: {
    command: `cd "${args.repoRoot}" && mkdir -p docs && {
      DATE=$(date -u +%Y-%m-%d)
      RUNS_COUNT=${args.scan?.stats?.totalRuns ?? 0}
      ACTIVE=${args.scan?.stats?.activeRuns ?? 0}
      DISK=$(du -sh ${args.runsDir} 2>/dev/null | cut -f1)
      ENTRY=$(cat <<EOF
## Cleanup pass · $DATE (no-op)

Scan found nothing eligible for removal (no terminal runs older than ${args.keepRecentDays}d; orphaned process files are report-only unless removeOrphanedProcesses is set). Skipped Phase 2 (aggregate) and Phase 3 (cleanup) — both are heavy agent tasks that produce no value when nothing is removable.

| Snapshot | Value |
|---|---|
| Total runs | $RUNS_COUNT |
| Active / in-flight | $ACTIVE |
| .a5c/runs/ disk | $DISK |

---

EOF
      )
      if [ -f docs/run-history-insights.md ]; then
        # Prepend to existing file
        TMP=$(mktemp)
        printf "%s" "$ENTRY" > "$TMP"
        cat docs/run-history-insights.md >> "$TMP"
        mv "$TMP" docs/run-history-insights.md
      else
        printf "%s" "$ENTRY" > docs/run-history-insights.md
      fi
      echo "audit entry prepended to docs/run-history-insights.md"
    }`,
  }
}));

// ─── Main process ──────────────────────────────────────────────────────────────

export async function process(inputs, ctx) {
  const repoRoot = inputs.repoRoot || ".";
  const runsDir = inputs.runsDir || ".a5c/runs";
  const processesDir = (inputs.processesDir || ".a5c/processes").replace(/\/+$/, "") || "/";
  const dryRun = inputs.dryRun !== undefined ? inputs.dryRun : false;
  const keepRecentDays = inputs.keepRecentDays || 7;
  const removeOrphanedProcesses = inputs.removeOrphanedProcesses === true;

  // Phase 1: Scan
  ctx.log("Phase 1: Scanning runs and processes...");
  const scan = await ctx.task(scanRuns, {
    repoRoot,
    runsDir,
    processesDir,
    keepRecentDays,
  });
  const orphanedProcesses = orphanedProcessFiles(scan);

  // ── No-op short-circuit ──
  // If nothing is eligible for removal, skip the heavy Phase 2 (aggregate) and
  // Phase 3 (cleanup) agent tasks. Write a brief audit-trail entry instead and
  // exit cleanly. This pattern emerged from cookbook usage (2026-06-05) where
  // a thorough prior pass left nothing meaningful to reclaim — running full
  // ceremony burned ~2 agent invocations to produce no useful change.
  if (isNoopScan(scan, keepRecentDays, removeOrphanedProcesses)) {
    ctx.log("No-op scan detected — nothing eligible for removal. Skipping Phases 2-3.");
    await ctx.task(writeNoopAuditEntry, {
      repoRoot,
      runsDir,
      scan,
      keepRecentDays,
    });
    const verification = await ctx.task(verifyCleanup, { repoRoot });
    return {
      success: true,
      summary: `No-op cleanup pass. ${scan?.stats?.totalRuns ?? 0} total runs scanned, 0 removable, ${orphanedProcesses.length} orphaned process file(s) reported (not removed). Audit entry written to docs/run-history-insights.md.`,
      scan,
      orphanedProcesses,
      noop: true,
    };
  }

  const runIds = removableRunIds(scan, keepRecentDays);

  // Phase 2: Aggregate insights, then verify them before anything is removed
  ctx.log("Phase 2: Aggregating insights from terminal runs...");
  const aggregation = await ctx.task(aggregateInsights, {
    repoRoot,
    scan,
    keepRecentDays,
  });
  await ctx.task(verifyInsights, { repoRoot, runIds });

  const orphanNote = removeOrphanedProcesses
    ? `${orphanedProcesses.length} orphaned process file(s) may also be removed (git-tracked or imported files are kept; removed files are archived): ${orphanedProcesses.join(", ") || "none"}.`
    : `${orphanedProcesses.length} orphaned process file(s) reported only, not removed: ${orphanedProcesses.join(", ") || "none"}.`;

  // Phase 3: Dry run stops here, before the confirm breakpoint
  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      summary: `Dry run: would archive then remove ${runIds.length} run(s): ${runIds.join(", ") || "none"}. ${orphanNote} Nothing was removed.`,
      scan,
      aggregation,
      cleanup: { removedRuns: [], wouldRemoveRuns: runIds, orphanedProcesses, removedProcesses: [] },
    };
  }

  // Phase 3: Confirm. Nothing is removed unless the exact removal option is chosen.
  const nOrph = removeOrphanedProcesses ? orphanedProcesses.length : 0;
  const REMOVE = runIds.length > 0 && nOrph > 0
    ? `Remove ${runIds.length} runs and up to ${nOrph} orphaned process files (archive first)`
    : nOrph > 0
      ? `Remove up to ${nOrph} orphaned process files (archive first)`
      : `Remove ${runIds.length} runs (archive first)`;
  const runsNote = runIds.length > 0
    ? `${runIds.length} terminal run(s) older than ${keepRecentDays} days will be archived to ${repoRoot}/.a5c/runs-archive/ and then removed: ${runIds.join(", ")}.`
    : `No terminal runs are eligible for removal.`;
  const CANCEL = "Cancel";
  const bp = await ctx.breakpoint({
    title: "Confirm cleanup",
    question: `${runsNote} ${orphanNote} Insights were written to docs/run-history-insights.md. Nothing is removed unless you choose "${REMOVE}".`,
    options: [REMOVE, CANCEL],
    context: { runIds, orphanedProcesses, removeOrphanedProcesses },
  }, {
    label: "Confirm cleanup",
    breakpointId: "cleanup-runs.confirm-removal",
    tags: ["cleanup", "destructive", "approval-gate"],
  });
  const choice = String(bp?.selectedOption ?? bp?.response ?? "").trim();
  if (bp?.approved === false || choice !== REMOVE) {
    return {
      success: true,
      cancelled: true,
      summary: `Cleanup cancelled; nothing was removed. ${runIds.length} candidate run(s) kept. Insights saved to docs/run-history-insights.md.`,
      scan,
      aggregation,
      cleanup: { removedRuns: [], wouldRemoveRuns: runIds, orphanedProcesses, removedProcesses: [] },
    };
  }

  // Phase 4: Archive, verify, remove
  ctx.log("Phase 4: Archiving and removing confirmed runs...");
  const removal = await ctx.task(archiveAndRemove, {
    repoRoot,
    runsDir,
    processesDir,
    runIds,
    removeOrphanedProcesses,
    orphanedProcesses: removeOrphanedProcesses ? orphanedProcesses : [],
  });
  const out = typeof removal === "string" ? removal : String(removal?.stdout ?? JSON.stringify(removal ?? ""));
  if (!out.includes("REMOVE_OK")) {
    const archiveLine = (out.match(/^ARCHIVE=.+$/m) || [])[0];
    throw new Error(`archive-and-remove did not report REMOVE_OK${archiveLine ? ` (${archiveLine})` : ""}:\n${out}`);
  }
  const cleanup = {
    removedRuns: runIds,
    archive: (out.match(/^ARCHIVE=(.+)$/m) || [])[1] || null,
    processArchive: (out.match(/^PROCESS_ARCHIVE=(.+)$/m) || [])[1] || null,
    removedProcesses: [...out.matchAll(/^REMOVED_PROCESS (.+)$/gm)].map((m) => m[1]),
    orphanedProcesses,
  };

  // Phase 5: Verify
  ctx.log("Phase 5: Verifying cleanup...");
  const verification = await ctx.task(verifyCleanup, { repoRoot });

  return {
    success: true,
    summary: `Cleanup complete. ${cleanup.archive ? `${cleanup.removedRuns.length} runs archived to ${cleanup.archive} and removed` : "No runs removed"}, ${cleanup.removedProcesses.length} process file(s) removed${cleanup.processArchive ? ` (archived to ${cleanup.processArchive})` : ""}. Insights saved to docs/run-history-insights.md.`,
    scan,
    aggregation,
    cleanup,
  };
}
