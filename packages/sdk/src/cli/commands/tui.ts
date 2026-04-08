/**
 * tui command — Interactive terminal dashboard for babysitter.
 *
 * Provides a main menu with:
 * - Browse runs (list recent runs with state, metadata)
 * - View run details (events, effect tree, status)
 * - Start a new run (harness selection, prompt input)
 * - Resume a session
 * - Quit
 *
 * Non-TTY or --json mode: outputs a JSON listing of runs.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import { readRunMetadata } from "../../storage/runFiles";
import { loadJournal } from "../../storage/journal";
import { getRunDir } from "../../storage/paths";
import { renderEffectTree, type EffectNode } from "../../dashboard/components/EffectTree";
import { renderEventMessage } from "../../dashboard/components/messages/EventMessage";
import { type StatusType } from "../../dashboard/components/StatusBadge";
import { renderTable } from "../../dashboard/components/Table";
import { isTTY } from "../../dashboard/render";
import { buildEffectIndex } from "../../runtime/replay/effectIndex";

// Re-use the ParsedArgs type from main — we receive it via the dispatch.
interface TuiParsedArgs {
  runsDir: string;
  json: boolean;
  verbose: boolean;
  positional?: string[];
  harness?: string;
  workspace?: string;
  prompt?: string;
}

interface RunSummary {
  runId: string;
  runDir: string;
  state: string;
  processId: string;
  createdAt: string;
  eventCount: number;
  pendingCount: number;
  prompt?: string;
}

// ---------------------------------------------------------------------------
// Core: scan runs directory
// ---------------------------------------------------------------------------

async function scanRuns(runsDir: string): Promise<RunSummary[]> {
  const resolvedDir = path.resolve(runsDir);
  let entries: string[];
  try {
    entries = await fs.readdir(resolvedDir);
  } catch {
    return [];
  }

  const summaries: RunSummary[] = [];

  for (const entry of entries) {
    const runDir = path.join(resolvedDir, entry);
    const metadataPath = path.join(runDir, "run.json");
    try {
      await fs.access(metadataPath);
    } catch {
      continue; // Not a run directory
    }

    try {
      const metadata = await readRunMetadata(runDir);
      let journal: Array<{ type: string; recordedAt: string; seq: number; data?: unknown }> = [];
      try {
        journal = await loadJournal(runDir);
      } catch {
        // Journal may not exist yet
      }

      // Derive state from journal events
      const lastLifecycleType = [...journal].reverse().find(
        (e) => e.type === "RUN_COMPLETED" || e.type === "RUN_FAILED"
      )?.type;
      const pendingCount = journal.filter((e) => e.type === "EFFECT_REQUESTED").length
        - journal.filter((e) => e.type === "EFFECT_RESOLVED").length;

      let state: string;
      if (lastLifecycleType === "RUN_COMPLETED") state = "completed";
      else if (lastLifecycleType === "RUN_FAILED") state = "failed";
      else if (pendingCount > 0) state = "waiting";
      else state = "created";

      summaries.push({
        runId: metadata.runId ?? entry,
        runDir,
        state,
        processId: metadata.processId ?? "unknown",
        createdAt: metadata.createdAt ?? "",
        eventCount: journal.length,
        pendingCount: Math.max(0, pendingCount),
        prompt: (metadata as Record<string, unknown>).prompt as string | undefined,
      });
    } catch {
      // Skip malformed runs
    }
  }

  // Sort by createdAt descending (most recent first)
  summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return summaries;
}

// ---------------------------------------------------------------------------
// Run detail
// ---------------------------------------------------------------------------

async function getRunDetail(runDir: string) {
  const metadata = await readRunMetadata(runDir);
  const journal = await loadJournal(runDir);
  const index = await buildEffectIndex({ runDir, events: journal });

  const lastLifecycleType = [...journal].reverse().find(
    (e) => e.type === "RUN_COMPLETED" || e.type === "RUN_FAILED"
  )?.type;
  const pendingEffects = index.listPendingEffects();
  let state: string;
  if (lastLifecycleType === "RUN_COMPLETED") state = "completed";
  else if (lastLifecycleType === "RUN_FAILED") state = "failed";
  else if (pendingEffects.length > 0) state = "waiting";
  else state = "created";

  const allEffects = index.listEffects();
  const effectNodes: EffectNode[] = allEffects.map((rec) => ({
    effectId: rec.effectId,
    kind: rec.kind ?? "unknown",
    status: (rec.status === "resolved_ok" || rec.status === "resolved_error"
      ? "completed" : rec.status === "requested" ? "pending" : "running") as StatusType,
    title: rec.taskId ?? rec.effectId,
    progress: rec.progressPercent !== undefined ? {
      percent: rec.progressPercent,
      label: rec.progressLabel,
    } : undefined,
  }));

  return { metadata, journal, state, effectNodes, pendingEffects };
}

// ---------------------------------------------------------------------------
// JSON output mode (non-TTY fallback)
// ---------------------------------------------------------------------------

async function handleJsonMode(args: TuiParsedArgs): Promise<number> {
  // If a run ID is specified as positional arg, show detail
  const runIdArg = args.positional?.[0];
  if (runIdArg) {
    const runDir = getRunDir(args.runsDir, runIdArg);
    try {
      const detail = await getRunDetail(runDir);
      console.log(JSON.stringify({
        runId: runIdArg,
        state: detail.state,
        processId: detail.metadata.processId,
        createdAt: detail.metadata.createdAt,
        events: detail.journal.map((e) => ({
          type: e.type,
          recordedAt: e.recordedAt,
          seq: e.seq,
        })),
        effects: detail.effectNodes.map((n) => ({
          effectId: n.effectId,
          kind: n.kind,
          status: n.status,
          title: n.title,
        })),
        pendingCount: detail.pendingEffects.length,
      }, null, 2));
    } catch (err) {
      console.error(`[tui] unable to read run ${runIdArg}: ${(err as Error).message}`);
      return 1;
    }
    return 0;
  }

  // List all runs
  const runs = await scanRuns(args.runsDir);
  console.log(JSON.stringify({
    runs: runs.map((r) => ({
      runId: r.runId,
      state: r.state,
      processId: r.processId,
      createdAt: r.createdAt,
      eventCount: r.eventCount,
      pendingCount: r.pendingCount,
      prompt: r.prompt,
    })),
  }, null, 2));
  return 0;
}

// ---------------------------------------------------------------------------
// Interactive helpers
// ---------------------------------------------------------------------------

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const HIDE_CURSOR = "\x1b[?25l";
const SHOW_CURSOR = "\x1b[?25h";
const CLEAR_LINE = "\x1b[2K";
const CURSOR_COL1 = "\x1b[G";
const CURSOR_UP = "\x1b[A";

function stateColor(state: string): string {
  switch (state) {
    case "completed": return GREEN;
    case "failed": return RED;
    case "waiting": return YELLOW;
    default: return DIM;
  }
}

function stateSymbol(state: string): string {
  switch (state) {
    case "completed": return `${GREEN}\u2714${RESET}`;
    case "failed": return `${RED}\u2718${RESET}`;
    case "waiting": return `${YELLOW}\u25CB${RESET}`;
    default: return `${DIM}\u2500${RESET}`;
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "\u2026";
}

function formatTimestamp(iso: string): string {
  if (!iso) return "???";
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 60_000) return "just now";
    if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
    if (diffMs < 86400_000) return `${Math.floor(diffMs / 3600_000)}h ago`;
    return `${Math.floor(diffMs / 86400_000)}d ago`;
  } catch {
    return iso.slice(0, 19);
  }
}

/** Simple readline-based arrow-key selector (borrowed from interaction module pattern). */
function interactiveSelect(
  output: NodeJS.WriteStream,
  input: NodeJS.ReadStream,
  title: string,
  options: string[],
): Promise<number | undefined> {
  return new Promise((resolve) => {
    let cursor = 0;
    let renderedLines = 0;
    let resolved = false;

    output.write(`\n${BOLD}${title}${RESET}\n`);

    const cleanup = (): void => {
      if (resolved) return;
      resolved = true;
      input.removeListener("data", onData);
      try { input.setRawMode(false); } catch { /* ignore */ }
      output.write(SHOW_CURSOR);
    };

    const finish = (value: number | undefined): void => {
      cleanup();
      resolve(value);
    };

    const render = (): void => {
      // Move up to overwrite previous render
      if (renderedLines > 0) {
        output.write(`${CURSOR_UP}`.repeat(renderedLines));
      }
      renderedLines = 0;
      for (const [i, label] of options.entries()) {
        const isCurrent = i === cursor;
        const prefix = isCurrent ? `${CYAN}${BOLD} \u276F ${RESET}` : `   `;
        const text = isCurrent ? `${CYAN}${BOLD}${label}${RESET}` : label;
        output.write(`${CLEAR_LINE}${CURSOR_COL1}${prefix}${text}\n`);
        renderedLines++;
      }
      output.write(`${CLEAR_LINE}${CURSOR_COL1}${DIM}  (Up/Down to move, Enter to select, q to quit)${RESET}\n`);
      renderedLines++;
    };

    const onData = (data: Buffer): void => {
      if (resolved) return;
      const key = data.toString("utf8");

      if (key === "\x03" || key === "\x1b" || key === "q" || key === "Q") {
        finish(undefined);
        return;
      }

      if (key === "\r" || key === "\n") {
        finish(cursor);
        return;
      }

      if (key === "\x1b[A") {
        cursor = cursor > 0 ? cursor - 1 : options.length - 1;
        render();
        return;
      }

      if (key === "\x1b[B") {
        cursor = cursor < options.length - 1 ? cursor + 1 : 0;
        render();
        return;
      }

      // Number shortcuts
      if (/^[1-9]$/.test(key)) {
        const idx = Number(key) - 1;
        if (idx < options.length) {
          finish(idx);
        }
      }
    };

    output.write(HIDE_CURSOR);
    try {
      input.setRawMode(true);
      input.resume();
    } catch {
      // Not a TTY — fall back
      finish(undefined);
      return;
    }
    input.on("data", onData);
    render();
  });
}

function askLine(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  return new Promise((resolve) => {
    rl.question(`${CYAN}?${RESET} ${prompt} `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ---------------------------------------------------------------------------
// Interactive flows
// ---------------------------------------------------------------------------

async function readVersion(): Promise<string> {
  try {
    const pkgPath = require.resolve("@a5c-ai/babysitter-sdk/package.json");
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8")) as { version?: string };
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

function renderHeader(runs: RunSummary[], version?: string): void {
  const completedCount = runs.filter((r) => r.state === "completed").length;
  const waitingCount = runs.filter((r) => r.state === "waiting").length;
  const failedCount = runs.filter((r) => r.state === "failed").length;

  const versionStr = version ? ` ${DIM}v${version}${RESET}` : "";
  process.stderr.write(`\n${BOLD}  babysitter tui${RESET}${versionStr}\n`);
  process.stderr.write(`${DIM}  ${"─".repeat(40)}${RESET}\n`);
  if (runs.length === 0) {
    process.stderr.write(`  ${DIM}No runs found.${RESET}\n`);
  } else {
    process.stderr.write(
      `  ${runs.length} runs: `
      + `${GREEN}${completedCount} done${RESET}  `
      + `${YELLOW}${waitingCount} waiting${RESET}  `
      + `${RED}${failedCount} failed${RESET}\n`
    );
  }
  process.stderr.write(`${DIM}  ${"─".repeat(40)}${RESET}\n`);
}

function renderRunList(runs: RunSummary[]): void {
  if (runs.length === 0) return;
  const display = runs.slice(0, 20);

  const headers = ["", "Run ID", "State", "Process", "When", "Pending"];
  const rows = display.map((run) => [
    stateSymbol(run.state),
    run.runId.slice(0, 12),
    run.state,
    truncate(run.processId, 20),
    formatTimestamp(run.createdAt),
    run.pendingCount > 0 ? String(run.pendingCount) : "",
  ]);

  const table = renderTable(headers, rows, { padding: 1 });
  for (const line of table.split("\n")) {
    process.stderr.write(`  ${line}\n`);
  }

  if (runs.length > 20) {
    process.stderr.write(`  ${DIM}...and ${runs.length - 20} more${RESET}\n`);
  }
}

async function browseRunDetail(runs: RunSummary[], _args: TuiParsedArgs): Promise<void> {
  if (runs.length === 0) {
    process.stderr.write(`\n${DIM}  No runs to browse.${RESET}\n`);
    return;
  }

  const options = runs.slice(0, 15).map((r) => {
    const sym = r.state === "completed" ? "\u2714" : r.state === "failed" ? "\u2718" : "\u25CB";
    return `${sym} ${r.runId.slice(0, 12)} [${r.state}] ${r.processId}`;
  });
  options.push("Back to menu");

  const idx = await interactiveSelect(
    process.stderr as unknown as NodeJS.WriteStream,
    process.stdin as unknown as NodeJS.ReadStream,
    "Select a run:",
    options,
  );

  if (idx === undefined || idx === options.length - 1) return;

  const run = runs[idx];
  try {
    const detail = await getRunDetail(run.runDir);

    process.stderr.write(`\n${BOLD}  Run: ${run.runId}${RESET}\n`);
    process.stderr.write(`  State: ${stateColor(detail.state)}${detail.state}${RESET}\n`);
    process.stderr.write(`  Process: ${detail.metadata.processId}\n`);
    process.stderr.write(`  Created: ${detail.metadata.createdAt}\n`);
    process.stderr.write(`  Events: ${detail.journal.length}\n\n`);

    if (detail.effectNodes.length > 0) {
      process.stderr.write(`${BOLD}  Effects:${RESET}\n`);
      process.stderr.write(renderEffectTree(detail.effectNodes).split("\n").map((l) => `  ${l}`).join("\n") + "\n");
    }

    process.stderr.write(`\n${BOLD}  Recent events:${RESET}\n`);
    const recentEvents = detail.journal.slice(-5);
    for (const event of recentEvents) {
      const msg = renderEventMessage({
        type: event.type,
        recordedAt: event.recordedAt,
        data: ((event as unknown as Record<string, unknown>).data ?? {}) as Record<string, unknown>,
      });
      process.stderr.write(`  ${msg}\n`);
    }
  } catch (err) {
    process.stderr.write(`  ${RED}Error reading run: ${(err as Error).message}${RESET}\n`);
  }
}

async function newRunFlow(args: TuiParsedArgs): Promise<void> {
  process.stderr.write(`\n${BOLD}  Create a new run${RESET}\n`);

  // Discover harnesses
  let harnesses: string[] = [];
  try {
    const { discoverHarnesses } = await import("../../harness/discovery");
    const results = await discoverHarnesses();
    harnesses = results.filter((h) => h.installed).map((h) => h.name);
  } catch {
    harnesses = ["claude-code"];
  }

  if (harnesses.length === 0) {
    process.stderr.write(`  ${RED}No harnesses available. Install one first.${RESET}\n`);
    return;
  }

  let harnessName: string;
  if (harnesses.length === 1) {
    harnessName = harnesses[0];
    process.stderr.write(`  Using harness: ${CYAN}${harnessName}${RESET}\n`);
  } else {
    const idx = await interactiveSelect(
      process.stderr as unknown as NodeJS.WriteStream,
      process.stdin as unknown as NodeJS.ReadStream,
      "Select harness:",
      [...harnesses, "Cancel"],
    );
    if (idx === undefined || idx === harnesses.length) return;
    harnessName = harnesses[idx];
  }

  const promptText = await askLine("Enter prompt/instruction:");
  if (!promptText) {
    process.stderr.write(`  ${DIM}Cancelled.${RESET}\n`);
    return;
  }

  process.stderr.write(`\n  ${DIM}Creating run with ${harnessName}...${RESET}\n`);

  try {
    const { handleHarnessCreateRun } = await import("./harnessCreateRun");
    await handleHarnessCreateRun({
      prompt: promptText,
      harness: harnessName,
      workspace: args.workspace ?? process.cwd(),
      runsDir: args.runsDir,
      json: false,
      verbose: args.verbose,
      interactive: true,
      outputMode: "tui",
    });
  } catch (err) {
    process.stderr.write(`  ${RED}Failed to create run: ${(err as Error).message}${RESET}\n`);
  }
}

async function resumeSessionFlow(args: TuiParsedArgs): Promise<void> {
  // Find runs that are in "waiting" state (resumable)
  const runs = await scanRuns(args.runsDir);
  const resumable = runs.filter((r) => r.state === "waiting");

  if (resumable.length === 0) {
    process.stderr.write(`\n  ${DIM}No resumable runs found (no runs in 'waiting' state).${RESET}\n`);
    return;
  }

  const options = resumable.slice(0, 10).map((r) => {
    const id = r.runId.slice(0, 12);
    const time = formatTimestamp(r.createdAt);
    const promptStr = r.prompt ? ` - ${truncate(r.prompt, 30)}` : "";
    return `${id} [${r.processId}] ${time}${promptStr}`;
  });
  options.push("Cancel");

  const idx = await interactiveSelect(
    process.stderr as unknown as NodeJS.WriteStream,
    process.stdin as unknown as NodeJS.ReadStream,
    "Select a run to resume:",
    options,
  );

  if (idx === undefined || idx === options.length - 1) return;

  const run = resumable[idx];
  process.stderr.write(`\n  ${DIM}Resuming run ${run.runId}...${RESET}\n`);

  try {
    const { handleHarnessResumeRun } = await import("./harnessResumeRun");
    await handleHarnessResumeRun({
      runId: run.runId,
      runsDir: args.runsDir,
      workspace: args.workspace ?? process.cwd(),
      json: false,
      verbose: args.verbose,
      outputMode: "tui",
    });
  } catch (err) {
    process.stderr.write(`  ${RED}Failed to resume: ${(err as Error).message}${RESET}\n`);
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function handleTui(args: TuiParsedArgs): Promise<number> {
  // JSON mode: non-interactive listing
  if (args.json || !isTTY()) {
    return handleJsonMode(args);
  }

  // Interactive TUI loop
  const menuOptions = [
    "Browse runs",
    "View run details",
    "New run",
    "Resume waiting run",
    "Quit",
  ];

  const version = await readVersion();
  let keepRunning = true;
  while (keepRunning) {
    const runs = await scanRuns(args.runsDir);
    renderHeader(runs, version);
    renderRunList(runs);

    const choice = await interactiveSelect(
      process.stderr as unknown as NodeJS.WriteStream,
      process.stdin as unknown as NodeJS.ReadStream,
      "What would you like to do?",
      menuOptions,
    );

    if (choice === undefined || choice === 4) {
      keepRunning = false;
      process.stderr.write(`\n${DIM}  Goodbye.${RESET}\n\n`);
      continue;
    }

    switch (choice) {
      case 0: // Browse runs
        renderRunList(runs);
        process.stderr.write(`\n${DIM}  Press Enter to continue...${RESET}`);
        await askLine("");
        break;

      case 1: // View run details
        await browseRunDetail(runs, args);
        process.stderr.write(`\n${DIM}  Press Enter to continue...${RESET}`);
        await askLine("");
        break;

      case 2: // New run
        await newRunFlow(args);
        break;

      case 3: // Resume session
        await resumeSessionFlow(args);
        break;
    }
  }

  return 0;
}
