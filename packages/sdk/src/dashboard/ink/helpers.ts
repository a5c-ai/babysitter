/**
 * Shared pure helpers for the Babysitter TUI components.
 *
 * Centralises formatting functions used by multiple components
 * (StatusBar, StatusLine) to avoid duplication.
 */

import type {
  MessageKind,
  ThemeColors,
  EffectKind,
  TuiEffectStatus,
  EffectSummary,
  OrchestrationPhase,
  OrchestrationStatus,
  TokenUsage,
  BreakpointState,
  RunStatus,
} from "./types.js";
import type { TreeNode } from "./components/primitives/Tree.js";
import type { RunSummary } from "./data/runScanner.js";

/**
 * Truncate a run ID to at most 12 characters for display.
 */
export function truncateRunId(id: string): string {
  if (id.length <= 12) return id;
  return id.slice(0, 12);
}

/**
 * Format a monetary cost for display.
 * Sub-dollar amounts use 4 decimal places; dollar+ uses 2.
 */
export function formatCost(cost: number): string {
  if (cost < 1) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// formatElapsedClock
// ---------------------------------------------------------------------------

/**
 * Format milliseconds into a clock-style duration string (MM:SS or HH:MM:SS).
 * Used by StatusBar for the elapsed time display.
 */
export function formatElapsedClock(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// truncateOutput
// ---------------------------------------------------------------------------

/**
 * Truncate text by line count, returning metadata about truncation.
 */
export function truncateOutput(
  text: string,
  maxLines = 50,
): { text: string; truncated: boolean; totalLines: number } {
  if (text === "") {
    return { text: "", truncated: false, totalLines: 0 };
  }

  const allLines = text.split("\n");
  const totalLines = allLines.length;

  if (totalLines <= maxLines) {
    return { text, truncated: false, totalLines };
  }

  const kept = allLines.slice(0, maxLines);
  const omitted = totalLines - maxLines;
  return {
    text: kept.join("\n") + `\n[... ${omitted} more lines]`,
    truncated: true,
    totalLines,
  };
}

// ---------------------------------------------------------------------------
// formatTimestamp
// ---------------------------------------------------------------------------

/**
 * Format an ISO date string as HH:MM:SS in local time.
 */
export function formatTimestamp(isoString: string | undefined | null): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// ---------------------------------------------------------------------------
// formatElapsedCompact
// ---------------------------------------------------------------------------

/**
 * Format milliseconds into a compact duration string.
 */
export function formatElapsedCompact(ms: number): string {
  if (ms < 0) ms = 0;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m${seconds}s`;
}

// ---------------------------------------------------------------------------
// briefArgs
// ---------------------------------------------------------------------------

/**
 * Serialize tool arguments into a short preview string.
 */
export function briefArgs(input: unknown): string {
  if (input === null || input === undefined) return "";
  if (typeof input === "string") {
    if (input.length <= 60) return input;
    return input.slice(0, 60) + "...";
  }
  if (typeof input === "number" || typeof input === "boolean") {
    return String(input);
  }
  try {
    const json = JSON.stringify(input);
    if (json.length <= 80) return json;
    return json.slice(0, 80) + "...";
  } catch {
    return "[object]";
  }
}

// ---------------------------------------------------------------------------
// getMessageIcon
// ---------------------------------------------------------------------------

const MESSAGE_ICONS: Record<MessageKind, string> = {
  user: ">",
  assistant: "",
  tool_call: "\u2699",
  subagent: "\u25C8",
  system: "\u2139",
  error: "\u2717",
};

/**
 * Map a MessageKind to its display icon.
 */
export function getMessageIcon(kind: MessageKind): string {
  return MESSAGE_ICONS[kind] ?? "";
}

// ---------------------------------------------------------------------------
// getMessageColor
// ---------------------------------------------------------------------------

/**
 * Map a MessageKind to its theme color.
 */
export function getMessageColor(kind: MessageKind, colors: ThemeColors): string {
  switch (kind) {
    case "user":
      return colors.primary;
    case "assistant":
      return colors.foreground;
    case "tool_call":
      return colors.toolCall;
    case "subagent":
      return colors.subagent;
    case "system":
      return colors.muted;
    case "error":
      return colors.error;
    default:
      return colors.foreground;
  }
}

// ---------------------------------------------------------------------------
// shouldShowTimestamp
// ---------------------------------------------------------------------------

/**
 * Whether a given message kind should display a timestamp.
 */
export function shouldShowTimestamp(kind: MessageKind): boolean {
  return kind === "user" || kind === "assistant" || kind === "error";
}

// ---------------------------------------------------------------------------
// formatToolCallSummary
// ---------------------------------------------------------------------------

/**
 * One-line tool call summary string.
 */
export function formatToolCallSummary(
  toolName: string,
  input: unknown,
  elapsedMs?: number,
  output?: string,
): string {
  let summary = `\u2699 ${toolName}`;
  const args = briefArgs(input);
  if (args) {
    summary += ` ${args}`;
  }
  if (elapsedMs !== undefined) {
    summary += ` (${formatElapsedCompact(elapsedMs)})`;
  }
  if (output !== undefined && output !== "") {
    let preview = output.replace(/\n/g, " ");
    if (preview.length > 40) {
      preview = preview.slice(0, 40) + "...";
    }
    summary += ` \u2192 ${preview}`;
  }
  return summary;
}

// ---------------------------------------------------------------------------
// formatShellOutput
// ---------------------------------------------------------------------------

/**
 * Format shell command output into display lines.
 */
export function formatShellOutput(
  stdout: string,
  stderr: string,
  exitCode: number,
): { lines: string[]; hasError: boolean } {
  const lines: string[] = [];

  if (stdout) {
    const stdoutLines = stdout.replace(/\n$/, "").split("\n");
    lines.push(...stdoutLines);
  }

  if (stderr) {
    const stderrLines = stderr.replace(/\n$/, "").split("\n");
    for (const line of stderrLines) {
      lines.push(`stderr: ${line}`);
    }
  }

  const hasError = exitCode !== 0;

  if (hasError) {
    lines.push(`Exit code: ${exitCode}`);
  }

  return { lines, hasError };
}

// ---------------------------------------------------------------------------
// formatToolOutput
// ---------------------------------------------------------------------------

/**
 * Format arbitrary tool output into display lines.
 */
export function formatToolOutput(output: unknown): string[] {
  if (output === null || output === undefined) return [];
  if (typeof output === "string") {
    if (output === "") return [];
    return output.split("\n");
  }
  if (typeof output === "number" || typeof output === "boolean") {
    return [String(output)];
  }
  const json = JSON.stringify(output, null, 2);
  return json.split("\n");
}

// ---------------------------------------------------------------------------
// Phase 3: Effect Visualization helpers
// ---------------------------------------------------------------------------

/**
 * Map an effect kind to its display icon glyph.
 */
export function getEffectIcon(kind: EffectKind): string {
  switch (kind) {
    case "node":
      return "\u2699";
    case "breakpoint":
      return "\u23F8";
    case "orchestrator_task":
      return "\u25C8";
    case "sleep":
      return "\u23F3";
    default:
      return "\u25CB";
  }
}

/**
 * Map a TUI effect status to a theme color key.
 */
export function getEffectStatusColor(status: TuiEffectStatus): string {
  switch (status) {
    case "pending":
      return "warning";
    case "resolved":
      return "success";
    case "failed":
      return "error";
    default:
      return "muted";
  }
}

const STATUS_ORDER: Record<TuiEffectStatus, number> = {
  pending: 0,
  resolved: 1,
  failed: 2,
};

const STATUS_ICON: Record<TuiEffectStatus, string> = {
  pending: "\u25CC",
  resolved: "\u2713",
  failed: "\u2717",
};

/**
 * Convert a flat array of EffectSummary objects into TreeNode[] suitable
 * for the Tree primitive. Produces a flat list (no children) sorted by
 * status: pending first, then resolved, then failed.
 */
export function buildEffectTree(effects: EffectSummary[]): TreeNode[] {
  const sorted = [...effects].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  );

  return sorted.map((eff) => {
    let label = eff.effectId;
    if (eff.title) {
      label += ` ${eff.title}`;
    }
    if (eff.elapsedMs !== undefined) {
      label += ` ${(eff.elapsedMs / 1000).toFixed(1)}s`;
    }
    if (eff.error) {
      label += ` ${eff.error}`;
    }

    return {
      label,
      icon: STATUS_ICON[eff.status],
      color: getEffectStatusColor(eff.status),
    };
  });
}

/**
 * Derive orchestration phase from effect statuses.
 */
export function derivePhase(effects: EffectSummary[]): OrchestrationPhase {
  if (effects.length === 0) return "waiting";

  const hasPending = effects.some((e) => e.status === "pending");
  if (hasPending) return "executing";

  const hasFailed = effects.some((e) => e.status === "failed");
  if (hasFailed) return "failed";

  return "complete";
}

/**
 * Build a full OrchestrationStatus from effects and run metadata.
 */
export function aggregateOrchestrationStatus(opts: {
  runId: string;
  effects: EffectSummary[];
  iteration?: number;
  startedAt?: number;
  tokenUsage?: TokenUsage;
  cost?: number;
  now?: number;
}): OrchestrationStatus {
  const { runId, effects, iteration = 0, startedAt, tokenUsage, cost, now = Date.now() } = opts;

  const totalEffects = effects.length;
  const pendingEffects = effects.filter((e) => e.status === "pending").length;
  const resolvedEffects = effects.filter((e) => e.status === "resolved").length;
  const phase = derivePhase(effects);
  const elapsedMs = startedAt ? now - startedAt : 0;

  return {
    runId,
    iteration,
    phase,
    totalEffects,
    pendingEffects,
    resolvedEffects,
    elapsedMs,
    ...(tokenUsage !== undefined ? { tokenUsage } : {}),
    ...(cost !== undefined ? { cost } : {}),
  };
}

/**
 * Group pending effects by kind, sorting within each group by effectId.
 */
export function groupPendingEffects(
  effects: EffectSummary[],
): Map<EffectKind, EffectSummary[]> {
  const result = new Map<EffectKind, EffectSummary[]>();

  for (const eff of effects) {
    if (eff.status !== "pending") continue;
    let group = result.get(eff.kind);
    if (!group) {
      group = [];
      result.set(eff.kind, group);
    }
    group.push(eff);
  }

  for (const group of result.values()) {
    group.sort((a, b) => a.effectId.localeCompare(b.effectId));
  }

  return result;
}

/**
 * Summary of a pending effect group for display.
 */
export interface PendingGroupSummary {
  readonly kind: EffectKind;
  readonly count: number;
  readonly titles: string[];
}

/**
 * Summarize grouped pending effects, sorted by count descending.
 */
export function summarizePendingGroups(
  groups: Map<EffectKind, EffectSummary[]>,
): PendingGroupSummary[] {
  const summaries: PendingGroupSummary[] = [];

  for (const [kind, effects] of groups.entries()) {
    summaries.push({
      kind,
      count: effects.length,
      titles: effects.map((e) => e.title ?? e.effectId),
    });
  }

  summaries.sort((a, b) => b.count - a.count);

  return summaries;
}

// ---------------------------------------------------------------------------
// Phase 4: Breakpoint & Interaction UI helpers
// ---------------------------------------------------------------------------

// --- Slash Commands ---

export interface SlashCommandDef {
  readonly name: string;
  readonly description: string;
}

/**
 * Parse a slash command string into its command name and arguments.
 * Returns null if the input is not a valid slash command.
 */
export function parseSlashCommand(input: string): { command: string; args: string } | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;

  const match = trimmed.match(/^\/(\S+)(?:\s+(.*))?$/);
  if (!match) return null;

  const command = match[1].toLowerCase();
  const args = (match[2] ?? "").trim();
  return { command, args };
}

/**
 * Check whether a command name is in the list of valid commands (case-insensitive).
 */
export function isValidSlashCommand(command: string, validCommands: string[]): boolean {
  if (!command) return false;
  const lower = command.toLowerCase();
  return validCommands.some((c) => c.toLowerCase() === lower);
}

/**
 * Return slash command definitions that match a partial input prefix.
 * The partial must start with "/" to produce any results.
 */
export function getSlashCompletions(partial: string, commands: SlashCommandDef[]): SlashCommandDef[] {
  if (!partial.startsWith("/")) return [];
  const lower = partial.toLowerCase();
  return commands.filter((cmd) => cmd.name.toLowerCase().startsWith(lower));
}

// --- Breakpoint Helpers ---

/**
 * Format a breakpoint into a human-readable prompt string.
 */
export function formatBreakpointPrompt(bp: BreakpointState): string {
  let icon: string;
  let status: string;
  if (bp.approved === true) {
    icon = "\u2713";
    status = "Approved";
  } else if (bp.approved === false) {
    icon = "\u2717";
    status = "Rejected";
  } else {
    icon = "\u23F8";
    status = "Awaiting approval";
  }

  let result = `${icon} ${bp.title} - ${status}`;

  if (bp.feedback) {
    result += ` (feedback: ${bp.feedback})`;
  }

  if (bp.expert !== undefined) {
    const expertStr = Array.isArray(bp.expert) ? bp.expert.join(", ") : bp.expert;
    result += ` [expert: ${expertStr}]`;
  }

  if (bp.tags && bp.tags.length > 0) {
    result += " " + bp.tags.map((t) => `#${t}`).join(" ");
  }

  if (bp.autoApproval?.recommended) {
    result += " (auto-approve recommended)";
  }

  return result;
}

/**
 * Map a breakpoint approved state to a theme color key.
 */
export function getBreakpointStatusColor(approved: boolean | null): string {
  if (approved === null) return "warning";
  if (approved) return "success";
  return "error";
}

/**
 * Generate the list of action options for a breakpoint.
 * Approve and Reject are always first; conditional options follow.
 */
export function formatBreakpointOptions(bp: BreakpointState): string[] {
  const options: string[] = ["Approve", "Reject"];

  if (bp.autoApproval?.recommended) {
    options.push("Always Approve");
  }

  if (bp.feedback) {
    options.push("Approve with feedback");
  }

  return options;
}

// --- Input History ---

export interface InputHistory {
  readonly entries: string[];
  readonly cursor: number;
  readonly maxSize: number;
}

/**
 * Create a new empty input history.
 */
export function createInputHistory(maxSize = 100): InputHistory {
  return { entries: [], cursor: 0, maxSize };
}

/**
 * Add an entry to the history, returning a new InputHistory.
 * Skips empty/whitespace-only strings and consecutive duplicates.
 * Trims to maxSize by dropping oldest entries.
 */
export function addToHistory(history: InputHistory, entry: string): InputHistory {
  if (!entry.trim()) return history;

  const lastEntry = history.entries.length > 0 ? history.entries[history.entries.length - 1] : undefined;
  if (lastEntry === entry) {
    return { ...history, cursor: history.entries.length };
  }

  let entries = [...history.entries, entry];
  if (entries.length > history.maxSize) {
    entries = entries.slice(entries.length - history.maxSize);
  }

  return { entries, cursor: entries.length, maxSize: history.maxSize };
}

/**
 * Navigate through history in the given direction.
 * Returns the new history state and the entry at the new cursor (or null if past end).
 */
export function navigateHistory(
  history: InputHistory,
  direction: "up" | "down",
): { history: InputHistory; entry: string | null } {
  if (history.entries.length === 0) {
    return { history, entry: null };
  }

  if (direction === "up") {
    const newCursor = Math.max(0, history.cursor - 1);
    return {
      history: { ...history, cursor: newCursor },
      entry: history.entries[newCursor],
    };
  }

  // direction === "down"
  const newCursor = Math.min(history.entries.length, history.cursor + 1);
  if (newCursor >= history.entries.length) {
    return {
      history: { ...history, cursor: newCursor },
      entry: null,
    };
  }

  return {
    history: { ...history, cursor: newCursor },
    entry: history.entries[newCursor],
  };
}

// ---------------------------------------------------------------------------
// Phase 6: Cost Tracking helpers
// ---------------------------------------------------------------------------

/**
 * Format cost rate as dollars per minute.
 * Returns "$X.XXXX/min" for sub-dollar rates, "$X.XX/min" for dollar+ rates.
 */
export function formatCostRate(cost: number, elapsedMs: number): string {
  if (elapsedMs <= 0 || cost <= 0) return "$0.0000/min";
  const minutes = elapsedMs / 60_000;
  const rate = cost / minutes;
  const formatted = rate < 1 ? rate.toFixed(4) : rate.toFixed(2);
  return `$${formatted}/min`;
}

/**
 * Estimate remaining cost based on current spend and progress fraction (0-1).
 * Returns 0 if progress is 0 (no data), >= 1 (complete), or cost is 0.
 */
export function estimateRemainingCost(currentCost: number, progress: number): number {
  if (currentCost <= 0 || progress <= 0 || progress >= 1) return 0;
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const projectedTotal = currentCost / clampedProgress;
  return Math.max(0, projectedTotal - currentCost);
}

/**
 * Summary of cost tracking data for display.
 */
export interface CostSummary {
  readonly currentCost: string;
  readonly rate: string;
  readonly estimatedTotal: string;
  readonly estimatedRemaining: string;
}

/**
 * Build a structured cost summary from current cost, elapsed time, and progress.
 */
export function formatCostSummary(opts: {
  currentCost: number;
  elapsedMs: number;
  progress: number;
}): CostSummary {
  const { currentCost, elapsedMs, progress } = opts;
  const remaining = estimateRemainingCost(currentCost, progress);
  const total = currentCost + remaining;

  return {
    currentCost: formatCost(currentCost),
    rate: formatCostRate(currentCost, elapsedMs),
    estimatedTotal: formatCost(total),
    estimatedRemaining: formatCost(remaining),
  };
}

// ---------------------------------------------------------------------------
// Phase 6: Resume Dashboard helpers
// ---------------------------------------------------------------------------

const RESUMABLE_STATES: ReadonlySet<RunSummary["state"]> = new Set(["waiting", "created"]);

/**
 * Filter runs to only those that can be resumed (waiting or created).
 */
export function getResumableRuns(runs: readonly RunSummary[]): RunSummary[] {
  return runs.filter((r) => RESUMABLE_STATES.has(r.state));
}

const STATE_PRIORITY: Record<RunSummary["state"], number> = {
  waiting: 0,
  created: 1,
  completed: 2,
  failed: 3,
};

/**
 * Rank runs for the resume dashboard: waiting first, then created,
 * within each state sorted by most recent first.
 * Excludes completed and failed runs.
 */
export function rankRunsForResume(runs: readonly RunSummary[]): RunSummary[] {
  return getResumableRuns(runs).sort((a, b) => {
    const stateDiff = STATE_PRIORITY[a.state] - STATE_PRIORITY[b.state];
    if (stateDiff !== 0) return stateDiff;
    // More recent first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Format a single-line summary for a run in the resume picker.
 */
export function formatRunSummaryLine(run: RunSummary): string {
  const id = run.runId.length > 12 ? run.runId.slice(0, 12) : run.runId;
  const proc = run.processId.length > 20 ? run.processId.slice(0, 19) + "\u2026" : run.processId;
  const pending = run.pendingCount > 0 ? ` [${run.pendingCount} pending]` : "";
  const promptExcerpt = run.prompt
    ? ` \u2014 ${run.prompt.length > 60 ? run.prompt.slice(0, 57) + "..." : run.prompt}`
    : "";
  return `${id} ${run.state} ${proc}${pending}${promptExcerpt}`;
}

// ---------------------------------------------------------------------------
// Phase 6: Structured Status View helpers
// ---------------------------------------------------------------------------

/**
 * A section in the structured status view.
 */
export interface StatusSection {
  readonly title: string;
  readonly entries: readonly StatusEntry[];
}

/**
 * A key-value entry in a status section.
 */
export interface StatusEntry {
  readonly label: string;
  readonly value: string;
}

/**
 * Build structured status sections from orchestration status.
 */
export function buildStatusSections(status: OrchestrationStatus): StatusSection[] {
  const sections: StatusSection[] = [];

  // Run section
  sections.push({
    title: "Run",
    entries: [
      { label: "ID", value: status.runId },
      { label: "Phase", value: status.phase },
      { label: "Iteration", value: String(status.iteration) },
      { label: "Elapsed", value: formatElapsedCompact(status.elapsedMs) },
    ],
  });

  // Effects section
  sections.push({
    title: "Effects",
    entries: [
      { label: "Total", value: String(status.totalEffects) },
      { label: "Resolved", value: String(status.resolvedEffects) },
      { label: "Pending", value: String(status.pendingEffects) },
    ],
  });

  // Token section
  if (status.tokenUsage) {
    sections.push({
      title: "Tokens",
      entries: [
        { label: "Input", value: String(status.tokenUsage.input) },
        { label: "Output", value: String(status.tokenUsage.output) },
        { label: "Total", value: String(status.tokenUsage.total) },
      ],
    });
  }

  // Cost section
  if (status.cost !== undefined) {
    sections.push({
      title: "Cost",
      entries: [
        { label: "Current", value: formatCost(status.cost) },
        { label: "Rate", value: formatCostRate(status.cost, status.elapsedMs) },
      ],
    });
  }

  return sections;
}

/**
 * Format a status section as text lines for display.
 * Returns an array of strings: title line followed by indented entries.
 */
export function formatStatusSection(section: StatusSection): string[] {
  const lines: string[] = [`[${section.title}]`];
  const maxLabel = section.entries.reduce(
    (max, e) => Math.max(max, e.label.length),
    0,
  );
  for (const entry of section.entries) {
    lines.push(`  ${entry.label.padEnd(maxLabel)}  ${entry.value}`);
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Phase 7: ScrollBox math
// ---------------------------------------------------------------------------

/**
 * Clamp a scroll offset to valid bounds.
 * @param offset  Current scroll offset (items from top)
 * @param contentLength  Total number of items
 * @param viewportHeight  Number of visible items
 */
export function clampScrollOffset(
  offset: number,
  contentLength: number,
  viewportHeight: number,
): number {
  if (contentLength <= viewportHeight || viewportHeight <= 0) return 0;
  const maxOffset = contentLength - viewportHeight;
  return Math.max(0, Math.min(offset, maxOffset));
}

/**
 * Compute the visible range [start, end) for a given scroll offset.
 */
export function computeVisibleRange(
  offset: number,
  contentLength: number,
  viewportHeight: number,
): { start: number; end: number } {
  const clamped = clampScrollOffset(offset, contentLength, viewportHeight);
  const end = Math.min(clamped + viewportHeight, contentLength);
  return { start: clamped, end };
}

/**
 * Determine whether auto-scroll (sticky scroll) should be active.
 * Returns true when the scroll position is at or near the bottom.
 * @param threshold  Number of items from the bottom to consider "near" (default 1)
 */
export function shouldAutoScroll(
  offset: number,
  contentLength: number,
  viewportHeight: number,
  threshold = 1,
): boolean {
  if (contentLength <= viewportHeight) return true;
  const maxOffset = contentLength - viewportHeight;
  return offset >= maxOffset - threshold;
}

// ---------------------------------------------------------------------------
// Phase 7: Alternate screen mode
// ---------------------------------------------------------------------------

/** Build the CSI sequence to enter the alternate screen buffer. */
export function buildAlternateScreenEnter(): string {
  return "\x1b[?1049h";
}

/** Build the CSI sequence to leave the alternate screen buffer. */
export function buildAlternateScreenLeave(): string {
  return "\x1b[?1049l";
}

// ---------------------------------------------------------------------------
// Phase 7: Terminal tab status
// ---------------------------------------------------------------------------

export type TabStatusPreset = "idle" | "busy" | "waiting" | "completed" | "failed";

/** Terminal bell character — emit to process.stderr to notify user. */
export const TERMINAL_BELL = "\x07";

const TAB_STATUS_COLORS: Record<TabStatusPreset, string> = {
  idle: "0;128;0",        // green
  busy: "255;165;0",      // orange
  waiting: "255;255;0",   // yellow
  completed: "0;200;0",   // bright green
  failed: "255;50;50",    // red
};

/**
 * Build an OSC sequence for setting terminal tab status color.
 * Uses OSC 21337 (iTerm2 tab color protocol).
 */
export function buildTabStatusSequence(preset: TabStatusPreset): string {
  const rgb = TAB_STATUS_COLORS[preset];
  const [r, g, b] = rgb.split(";");
  return `\x1b]6;1;bg;red;brightness;${r}\x07\x1b]6;1;bg;green;brightness;${g}\x07\x1b]6;1;bg;blue;brightness;${b}\x07`;
}

/**
 * Map a RunStatus to a tab status preset.
 */
export function mapRunStatusToTabPreset(status: RunStatus): TabStatusPreset {
  switch (status) {
    case "running":
      return "busy";
    case "waiting_effect":
      return "waiting";
    case "complete":
      return "completed";
    case "failed":
      return "failed";
    case "idle":
    default:
      return "idle";
  }
}

// ---------------------------------------------------------------------------
// Phase 7: Paste detection
// ---------------------------------------------------------------------------

/** Bracketed paste mode start sequence. */
export const PASTE_START = "\x1b[200~";
/** Bracketed paste mode end sequence. */
export const PASTE_END = "\x1b[201~";

/** Check if a string contains a bracketed paste sequence. */
export function isPasteSequence(input: string): boolean {
  return input.includes(PASTE_START);
}

export interface PasteDetectionResult {
  readonly isPaste: boolean;
  readonly content?: string;
}

/** Detect bracketed paste and extract content. */
export function detectBracketedPaste(input: string): PasteDetectionResult {
  if (!isPasteSequence(input)) {
    return { isPaste: false };
  }
  const content = extractPasteContent(input);
  return { isPaste: true, content };
}

/** Strip bracketed paste sequences and extract the pasted content. */
export function extractPasteContent(input: string): string {
  return input.replace(PASTE_START, "").replace(PASTE_END, "");
}

// ---------------------------------------------------------------------------
// Phase 7: Search highlighting
// ---------------------------------------------------------------------------

export interface SearchMatch {
  readonly start: number;
  readonly end: number;
}

export interface SearchOptions {
  readonly ignoreCase?: boolean;
}

/**
 * Find all non-overlapping matches of a pattern in text.
 */
export function findMatches(
  text: string,
  pattern: string,
  options?: SearchOptions,
): SearchMatch[] {
  if (!pattern || !text) return [];

  const flags = options?.ignoreCase ? "gi" : "g";
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, flags);
  const matches: SearchMatch[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length });
    // Prevent infinite loop on zero-length matches
    if (match[0].length === 0) regex.lastIndex++;
  }

  return matches;
}

/**
 * Wrap matched regions with marker strings.
 */
export function highlightText(
  text: string,
  matches: readonly SearchMatch[],
  startMarker: string,
  endMarker: string,
): string {
  if (matches.length === 0) return text;

  const sorted = [...matches].sort((a, b) => a.start - b.start);
  let result = "";
  let lastEnd = 0;

  for (const m of sorted) {
    result += text.slice(lastEnd, m.start);
    result += startMarker + text.slice(m.start, m.end) + endMarker;
    lastEnd = m.end;
  }
  result += text.slice(lastEnd);

  return result;
}

/**
 * Navigate to the next or previous match index, wrapping around.
 */
export function navigateMatch(
  currentIndex: number,
  totalMatches: number,
  direction: "next" | "prev",
): number {
  if (totalMatches <= 0) return 0;
  if (totalMatches === 1) return 0;

  if (direction === "next") {
    return (currentIndex + 1) % totalMatches;
  }
  return (currentIndex - 1 + totalMatches) % totalMatches;
}

// ---------------------------------------------------------------------------
// Markdown-lite parser for TUI message rendering
// ---------------------------------------------------------------------------

export interface MarkdownSpan {
  readonly text: string;
  readonly style: "plain" | "bold" | "italic" | "code" | "codeBlock" | "blockquote" | "listItem";
  readonly language?: string;
}

/**
 * Parse basic markdown into styled spans for terminal rendering.
 * Supports: **bold**, *italic*, `inline code`, ```code blocks```,
 * > blockquotes, - / * / 1. list items.
 *
 * This is intentionally limited — no nested formatting, no links, no headers.
 * The goal is readable terminal output, not full markdown compliance.
 */
export function parseMarkdownLite(input: string): MarkdownSpan[] {
  if (!input) return [];

  const spans: MarkdownSpan[] = [];
  const lines = input.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block: ```[language]
    if (line.trimStart().startsWith("```")) {
      const langMatch = line.trimStart().match(/^```(\w*)/);
      const language = langMatch?.[1] || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      // Skip closing ```
      if (i < lines.length) i++;

      // Add newline before code block if there are preceding spans
      if (spans.length > 0 && spans[spans.length - 1].style !== "codeBlock") {
        const last = spans[spans.length - 1];
        if (!last.text.endsWith("\n")) {
          spans[spans.length - 1] = { ...last, text: last.text + "\n" };
        }
      }

      spans.push({
        text: codeLines.join("\n"),
        style: "codeBlock",
        language,
      });
      continue;
    }

    // Blockquote: > text
    if (line.match(/^>\s?/)) {
      if (i > 0 && spans.length > 0) {
        const last = spans[spans.length - 1];
        if (!last.text.endsWith("\n")) {
          spans[spans.length - 1] = { ...last, text: last.text + "\n" };
        }
      }
      spans.push({
        text: line.replace(/^>\s?/, ""),
        style: "blockquote",
      });
      i++;
      continue;
    }

    // Bullet list: - item, * item
    if (line.match(/^\s*[-*]\s+/)) {
      if (i > 0 && spans.length > 0) {
        const last = spans[spans.length - 1];
        if (!last.text.endsWith("\n")) {
          spans[spans.length - 1] = { ...last, text: last.text + "\n" };
        }
      }
      spans.push({
        text: line.replace(/^\s*[-*]\s+/, ""),
        style: "listItem",
      });
      i++;
      continue;
    }

    // Numbered list: 1. item, 2. item
    if (line.match(/^\s*\d+\.\s+/)) {
      if (i > 0 && spans.length > 0) {
        const last = spans[spans.length - 1];
        if (!last.text.endsWith("\n")) {
          spans[spans.length - 1] = { ...last, text: last.text + "\n" };
        }
      }
      spans.push({
        text: line.replace(/^\s*\d+\.\s+/, ""),
        style: "listItem",
      });
      i++;
      continue;
    }

    // Regular line — parse inline formatting
    const lineText = i > 0 ? "\n" + line : line;
    parseInlineMarkdown(lineText, spans);
    i++;
  }

  return spans;
}

/**
 * Parse inline markdown (bold, italic, code) and append spans.
 */
function parseInlineMarkdown(text: string, spans: MarkdownSpan[]): void {
  // Regex for inline patterns: **bold**, *italic*, `code`
  // Order matters: ** before * to avoid conflicts
  const inlineRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text)) !== null) {
    // Plain text before the match
    if (match.index > lastIndex) {
      appendPlain(spans, text.slice(lastIndex, match.index));
    }

    if (match[2] !== undefined) {
      // **bold**
      spans.push({ text: match[2], style: "bold" });
    } else if (match[3] !== undefined) {
      // *italic*
      spans.push({ text: match[3], style: "italic" });
    } else if (match[4] !== undefined) {
      // `code`
      spans.push({ text: match[4], style: "code" });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last match
  if (lastIndex < text.length) {
    appendPlain(spans, text.slice(lastIndex));
  }
}

/** Merge adjacent plain spans or add a new one. */
function appendPlain(spans: MarkdownSpan[], text: string): void {
  if (spans.length > 0 && spans[spans.length - 1].style === "plain") {
    spans[spans.length - 1] = {
      ...spans[spans.length - 1],
      text: spans[spans.length - 1].text + text,
    };
  } else {
    spans.push({ text, style: "plain" });
  }
}

// ---------------------------------------------------------------------------
// Phase 7: Diff helpers
// ---------------------------------------------------------------------------

export type DiffLineKind = "add" | "remove" | "context" | "hunk-header" | "header";

/**
 * Classify a single diff line by its prefix.
 */
export function classifyDiffLine(line: string): DiffLineKind {
  if (line.startsWith("@@")) return "hunk-header";
  if (line.startsWith("+++") || line.startsWith("---")) return "header";
  if (line.startsWith("+")) return "add";
  if (line.startsWith("-")) return "remove";
  return "context";
}

export interface DiffHunk {
  readonly header: string;
  readonly lines: readonly string[];
}

/**
 * Parse a unified diff into hunks.
 */
export function parseDiffHunks(diff: string): DiffHunk[] {
  if (!diff.trim()) return [];

  const allLines = diff.split("\n");
  const hunks: DiffHunk[] = [];
  let currentHeader: string | null = null;
  let currentLines: string[] = [];

  for (const line of allLines) {
    if (line.startsWith("@@")) {
      if (currentHeader !== null) {
        hunks.push({ header: currentHeader, lines: currentLines });
      }
      currentHeader = line;
      currentLines = [];
    } else if (currentHeader !== null) {
      // Skip file headers within a hunk
      if (!line.startsWith("+++") && !line.startsWith("---")) {
        currentLines.push(line);
      }
    }
  }

  if (currentHeader !== null) {
    hunks.push({ header: currentHeader, lines: currentLines });
  }

  return hunks;
}

export interface DiffStats {
  readonly additions: number;
  readonly deletions: number;
  readonly summary: string;
}

/**
 * Count additions and deletions from diff lines.
 */
export function formatDiffStats(lines: readonly string[]): DiffStats {
  let additions = 0;
  let deletions = 0;

  for (const line of lines) {
    if (line.startsWith("+") && !line.startsWith("+++")) additions++;
    if (line.startsWith("-") && !line.startsWith("---")) deletions++;
  }

  return {
    additions,
    deletions,
    summary: `+${additions} -${deletions}`,
  };
}

// ---------------------------------------------------------------------------
// Phase 7: Viewport-aware animation
// ---------------------------------------------------------------------------

export interface ViewportState {
  readonly visible: boolean;
  readonly focused: boolean;
}

/**
 * Determine if an animation tick should run based on viewport state.
 */
export function shouldAnimateTick(state: ViewportState): boolean {
  return state.visible;
}

/**
 * Compute the current animation frame index from elapsed time.
 * @param elapsedMs  Time since animation start
 * @param intervalMs  Duration per frame
 * @param frameCount  Total frames in the cycle
 */
export function computeFrameIndex(
  elapsedMs: number,
  intervalMs: number,
  frameCount: number,
): number {
  if (intervalMs <= 0 || frameCount <= 0 || elapsedMs <= 0) return 0;
  const totalFrames = Math.floor(elapsedMs / intervalMs);
  return totalFrames % frameCount;
}

// ---------------------------------------------------------------------------
// Run detail event formatting
// ---------------------------------------------------------------------------

const EVENT_TYPE_LABELS: Record<string, string> = {
  RUN_CREATED: "Run Created",
  EFFECT_REQUESTED: "Effect Requested",
  EFFECT_RESOLVED: "Effect Resolved",
  RUN_COMPLETED: "Run Completed",
  RUN_FAILED: "Run Failed",
};

/** Map a journal event type string to a human-readable label. */
export function formatEventType(type: string): string {
  return EVENT_TYPE_LABELS[type] ?? type;
}

const EVENT_ICONS: Record<string, string> = {
  RUN_CREATED: "\u25B6",    // ▶
  EFFECT_REQUESTED: "\u25CB", // ○
  EFFECT_RESOLVED: "\u25CF",  // ●
  RUN_COMPLETED: "\u2713",   // ✓
  RUN_FAILED: "\u2717",      // ✗
};

/** Return an icon glyph for a journal event type. */
export function getEventIcon(type: string): string {
  return EVENT_ICONS[type] ?? "\u00B7"; // · fallback
}

/** Return a theme color key for a journal event type. */
export function getEventColor(type: string, colors: ThemeColors): string {
  switch (type) {
    case "RUN_CREATED":
      return colors.primary;
    case "EFFECT_REQUESTED":
      return colors.warning;
    case "EFFECT_RESOLVED":
      return colors.success;
    case "RUN_COMPLETED":
      return colors.success;
    case "RUN_FAILED":
      return colors.error;
    default:
      return colors.muted;
  }
}

/**
 * Format a list of journal events into timeline display lines.
 * Each line: "#seq  HH:MM:SS  icon Label"
 */
export function formatEventTimeline(
  events: ReadonlyArray<{ type: string; recordedAt: string; seq: number }>,
): string[] {
  return events.map((e) => {
    const label = formatEventType(e.type);
    const icon = getEventIcon(e.type);
    const time = formatTimestamp(e.recordedAt);
    return `#${String(e.seq)}  ${time}  ${icon} ${label}`;
  });
}

// ---------------------------------------------------------------------------
// Keyboard help overlay
// ---------------------------------------------------------------------------

/** Keyboard shortcut definitions for each view. */
const KEYBOARD_HELP: Record<string, ReadonlyArray<readonly [string, string]>> = {
  "run-detail": [
    ["Esc", "Go back to dashboard"],
    ["s", "Open session for this run"],
    ["r", "Refresh run data"],
    ["\u2191/\u2193", "Scroll events up/down"],
    ["PgUp/PgDn", "Scroll one page"],
    ["g/G", "Jump to top/bottom"],
    ["?", "Toggle this help"],
  ],
  "session": [
    ["Esc", "Go back to dashboard (when not typing)"],
    ["Ctrl+F", "Toggle search bar"],
    ["Enter", "Submit message"],
    ["\u2191/\u2193", "Scroll messages / navigate history"],
    ["PgUp/PgDn", "Scroll one page"],
    ["g/G", "Jump to top/bottom of messages"],
    ["Tab", "Complete slash command"],
    ["/help", "Show available slash commands"],
    ["/effects", "Toggle effects panel"],
    ["/search", "Search messages"],
    ["/verbosity", "Cycle verbosity level"],
    ["?", "Toggle this help"],
  ],
};

/**
 * Return formatted keyboard help lines for a given view.
 */
export function formatKeyboardHelp(view: string): string[] {
  const shortcuts = KEYBOARD_HELP[view];
  if (!shortcuts) return [];
  return shortcuts.map(([key, desc]) => `  ${key.padEnd(12)} ${desc}`);
}

// ---------------------------------------------------------------------------
// Streaming line parser
// ---------------------------------------------------------------------------

/** Discriminated union for events extracted from harness streaming output. */
export type StreamingEvent =
  | { readonly kind: "tool_start"; readonly toolName: string; readonly toolId: string }
  | { readonly kind: "tool_end"; readonly toolName: string; readonly toolId: string }
  | { readonly kind: "token_update"; readonly inputTokens: number; readonly outputTokens: number; readonly cacheReadTokens?: number; readonly cacheWriteTokens?: number }
  | { readonly kind: "cost_update"; readonly cost: number }
  | { readonly kind: "text"; readonly text: string };

/** Streaming output format identifier for each harness type. */
export type HarnessStreamingFormat = "anthropic-sse" | "plain-text" | "codex-json" | "generic-json";

/** Maps harness names to their expected streaming output format. */
export const HARNESS_STREAMING_FORMATS: Record<string, HarnessStreamingFormat> = {
  "claude-code": "anthropic-sse",
  "internal": "anthropic-sse",
  "codex": "codex-json",
  "gemini-cli": "plain-text",
  "cursor": "plain-text",
  "github-copilot": "plain-text",
  "opencode": "plain-text",
  "oh-my-pi": "plain-text",
  "pi": "plain-text",
  "openclaw": "plain-text",
};

/** Look up the streaming format for a harness, defaulting to plain-text. */
export function getHarnessStreamingFormat(harness: string): HarnessStreamingFormat {
  return HARNESS_STREAMING_FORMATS[harness] ?? "plain-text";
}

/**
 * Attempt to parse a streaming output line as a structured event.
 *
 * Accepts an optional format parameter to handle different harness output
 * formats. When omitted, defaults to "anthropic-sse" for backward compatibility.
 *
 * Returns null for plain text, malformed JSON, or unrecognized event types.
 * Never throws — safe for use in hot streaming callbacks.
 */
export function parseStreamingLine(line: string, format?: HarnessStreamingFormat): StreamingEvent | null {
  const fmt = format ?? "anthropic-sse";

  // Plain-text format: wrap every non-empty line as a text event
  if (fmt === "plain-text") {
    if (!line) return null;
    return { kind: "text", text: line };
  }

  // Codex-json format: handle codex-specific event types first
  if (fmt === "codex-json") {
    if (!line || !line.startsWith("{")) return null;
    let codexParsed: Record<string, unknown>;
    try {
      codexParsed = JSON.parse(line) as Record<string, unknown>;
    } catch {
      return null;
    }
    if (typeof codexParsed !== "object" || codexParsed === null || Array.isArray(codexParsed)) return null;
    const codexType = codexParsed.type as string | undefined;
    if (codexType === "message" && typeof codexParsed.content === "string") {
      return { kind: "text", text: codexParsed.content };
    }
    if (codexType === "tool_result") {
      return {
        kind: "tool_end",
        toolName: (codexParsed.name as string) ?? "unknown",
        toolId: (codexParsed.id as string) ?? "",
      };
    }
    // Fall through to anthropic-sse parsing for tool_use, usage, cost, etc.
  }

  // Generic-json format: try to extract text from common fields first
  if (fmt === "generic-json") {
    if (!line || !line.startsWith("{")) return null;
    let genericParsed: Record<string, unknown>;
    try {
      genericParsed = JSON.parse(line) as Record<string, unknown>;
    } catch {
      return null;
    }
    if (typeof genericParsed !== "object" || genericParsed === null || Array.isArray(genericParsed)) return null;
    // Check for text or content fields (common in various harness outputs)
    if (typeof genericParsed.text === "string" && genericParsed.text) {
      // But not if it's a recognized anthropic-sse type — let those through
      const gType = genericParsed.type as string | undefined;
      if (gType && !["content_block_start", "content_block_stop", "content_block_delta", "message_start", "message_delta", "usage", "tool_use"].includes(gType)) {
        return { kind: "text", text: genericParsed.text };
      }
    }
    if (typeof genericParsed.content === "string" && genericParsed.content) {
      const gType = genericParsed.type as string | undefined;
      if (gType && !["content_block_start", "content_block_stop", "content_block_delta", "message_start", "message_delta", "usage", "tool_use"].includes(gType)) {
        return { kind: "text", text: genericParsed.content };
      }
    }
    // Fall through to anthropic-sse parsing for recognized types
  }

  // anthropic-sse format (default): original implementation
  if (!line || !line.startsWith("{")) return null;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(line) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;

  // Cost events (check before type guard — cost events may lack a type field)
  if (typeof parsed.cost === "number") {
    return { kind: "cost_update", cost: parsed.cost };
  }

  const type = parsed.type as string | undefined;
  if (!type) return null;

  // Tool use events
  if (type === "tool_use") {
    return {
      kind: "tool_start",
      toolName: (parsed.name as string) ?? "unknown",
      toolId: (parsed.id as string) ?? "",
    };
  }

  if (type === "content_block_start") {
    const block = parsed.content_block as Record<string, unknown> | undefined;
    if (block?.type === "tool_use") {
      return {
        kind: "tool_start",
        toolName: (block.name as string) ?? "unknown",
        toolId: (block.id as string) ?? "",
      };
    }
  }

  if (type === "content_block_stop") {
    const block = parsed.content_block as Record<string, unknown> | undefined;
    if (block?.type === "tool_use") {
      return {
        kind: "tool_end",
        toolName: (block.name as string) ?? "unknown",
        toolId: (block.id as string) ?? "",
      };
    }
  }

  // Text delta
  if (type === "content_block_delta") {
    const delta = parsed.delta as Record<string, unknown> | undefined;
    if (delta?.type === "text_delta" && typeof delta.text === "string") {
      return { kind: "text", text: delta.text };
    }
  }

  // Token usage events
  if (type === "message_delta" || type === "message_start") {
    const usage = type === "message_start"
      ? (parsed.message as Record<string, unknown> | undefined)?.usage as Record<string, unknown> | undefined
      : parsed.usage as Record<string, unknown> | undefined;
    if (usage) {
      return {
        kind: "token_update",
        inputTokens: (usage.input_tokens as number) ?? 0,
        outputTokens: (usage.output_tokens as number) ?? 0,
        cacheReadTokens: usage.cache_read_input_tokens as number | undefined,
        cacheWriteTokens: usage.cache_creation_input_tokens as number | undefined,
      };
    }
  }

  if (type === "usage") {
    return {
      kind: "token_update",
      inputTokens: (parsed.input_tokens as number) ?? 0,
      outputTokens: (parsed.output_tokens as number) ?? 0,
      cacheReadTokens: parsed.cache_read_input_tokens as number | undefined,
      cacheWriteTokens: parsed.cache_creation_input_tokens as number | undefined,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Stateful streaming parser (tracks active blocks for tool_end detection)
// ---------------------------------------------------------------------------

/** Tracked content block info for stateful tool_end resolution. */
interface TrackedBlock {
  readonly type: string;
  readonly name?: string;
  readonly id?: string;
}

/** A stateful streaming parser that tracks content blocks by index. */
export interface StreamingParser {
  /** Parse a line, using tracked block state for tool_end resolution. */
  parse(line: string): StreamingEvent | null;
  /** Reset all tracked block state (e.g., between messages). */
  reset(): void;
}

/**
 * Create a stateful streaming parser that tracks content blocks by index.
 *
 * Unlike the stateless `parseStreamingLine`, this parser correctly resolves
 * `tool_end` events from `content_block_stop` by tracking which blocks were
 * started at each index.
 */
export function createStreamingParser(format?: HarnessStreamingFormat): StreamingParser {
  const activeBlocks = new Map<number, TrackedBlock>();
  const fmt = format ?? "anthropic-sse";

  return {
    parse(line: string): StreamingEvent | null {
      // For non-anthropic formats, delegate directly
      if (fmt !== "anthropic-sse") {
        return parseStreamingLine(line, fmt);
      }

      if (!line || !line.startsWith("{")) return null;

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(line) as Record<string, unknown>;
      } catch {
        return null;
      }
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;

      const type = parsed.type as string | undefined;
      const index = typeof parsed.index === "number" ? parsed.index : -1;

      // Track content_block_start — store block info by index
      if (type === "content_block_start" && index >= 0) {
        const block = parsed.content_block as Record<string, unknown> | undefined;
        if (block) {
          activeBlocks.set(index, {
            type: (block.type as string) ?? "unknown",
            name: block.name as string | undefined,
            id: block.id as string | undefined,
          });
        }
      }

      // Resolve content_block_stop via tracked state
      if (type === "content_block_stop" && index >= 0) {
        const tracked = activeBlocks.get(index);
        if (tracked) {
          activeBlocks.delete(index);
          if (tracked.type === "tool_use") {
            return {
              kind: "tool_end",
              toolName: tracked.name ?? "unknown",
              toolId: tracked.id ?? "",
            };
          }
          return null;
        }
      }

      // Delegate everything else to stateless parser
      return parseStreamingLine(line, fmt);
    },

    reset(): void {
      activeBlocks.clear();
    },
  };
}

// ---------------------------------------------------------------------------
// Turn elapsed formatting
// ---------------------------------------------------------------------------

/**
 * Format turn elapsed time in a compact form: "5s", "1m30s", "61m1s".
 */
export function formatTurnElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m${seconds}s`;
}

// ---------------------------------------------------------------------------
// Token summary formatting
// ---------------------------------------------------------------------------

/** Format a count to compact string: 300, 1.5k, 1.5M */
function formatCompactCount(count: number): string {
  if (count < 1000) return `${count}`;
  if (count < 1_000_000) {
    const k = count / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  const m = count / 1_000_000;
  return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
}

/**
 * Format a TokenUsage into a compact one-line summary.
 * Example: "1.5kin/300out" or "2kin/500out(+1kcache)"
 */
export function formatTokenSummary(usage: TokenUsage): string {
  const inStr = formatCompactCount(usage.input);
  const outStr = formatCompactCount(usage.output);
  let result = `${inStr}in/${outStr}out`;

  const cacheRead = usage.cacheRead ?? 0;
  const cacheWrite = usage.cacheWrite ?? 0;
  if (cacheRead > 0 || cacheWrite > 0) {
    const parts: string[] = [];
    if (cacheRead > 0) parts.push(`${formatCompactCount(cacheRead)}r`);
    if (cacheWrite > 0) parts.push(`${formatCompactCount(cacheWrite)}w`);
    result += `(${parts.join("/")}cache)`;
  }

  return result;
}
