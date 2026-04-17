import type {
  BreakpointState,
  OrchestrationStatus,
  RunStatus,
} from "../types.js";
import type { RunSummary } from "../data/runScanner.js";
import { formatCost, formatElapsedCompact } from "./core.js";

export interface SlashCommandDef {
  readonly name: string;
  readonly description: string;
}

export function parseSlashCommand(input: string): { command: string; args: string } | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;

  const match = trimmed.match(/^\/(\S+)(?:\s+(.*))?$/);
  if (!match) return null;

  return {
    command: match[1].toLowerCase(),
    args: (match[2] ?? "").trim(),
  };
}

export function isValidSlashCommand(command: string, validCommands: string[]): boolean {
  if (!command) return false;
  const lower = command.toLowerCase();
  return validCommands.some((c) => c.toLowerCase() === lower);
}

export function getSlashCompletions(partial: string, commands: SlashCommandDef[]): SlashCommandDef[] {
  if (!partial.startsWith("/")) return [];
  const lower = partial.toLowerCase();
  return commands.filter((cmd) => cmd.name.toLowerCase().startsWith(lower));
}

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

export function getBreakpointStatusColor(approved: boolean | null): string {
  if (approved === null) return "warning";
  if (approved) return "success";
  return "error";
}

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

export interface InputHistory {
  readonly entries: string[];
  readonly cursor: number;
  readonly maxSize: number;
}

export function createInputHistory(maxSize = 100): InputHistory {
  return { entries: [], cursor: 0, maxSize };
}

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

export function formatCostRate(cost: number, elapsedMs: number): string {
  if (elapsedMs <= 0 || cost <= 0) return "$0.0000/min";
  const minutes = elapsedMs / 60_000;
  const rate = cost / minutes;
  const formatted = rate < 1 ? rate.toFixed(4) : rate.toFixed(2);
  return `$${formatted}/min`;
}

export function estimateRemainingCost(currentCost: number, progress: number): number {
  if (currentCost <= 0 || progress <= 0 || progress >= 1) return 0;
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const projectedTotal = currentCost / clampedProgress;
  return Math.max(0, projectedTotal - currentCost);
}

export interface CostSummary {
  readonly currentCost: string;
  readonly rate: string;
  readonly estimatedTotal: string;
  readonly estimatedRemaining: string;
}

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

const RESUMABLE_STATES: ReadonlySet<RunSummary["state"]> = new Set(["waiting", "created"]);

export function getResumableRuns(runs: readonly RunSummary[]): RunSummary[] {
  return runs.filter((r) => RESUMABLE_STATES.has(r.state));
}

const STATE_PRIORITY: Record<RunSummary["state"], number> = {
  waiting: 0,
  created: 1,
  completed: 2,
  failed: 3,
};

export function rankRunsForResume(runs: readonly RunSummary[]): RunSummary[] {
  return getResumableRuns(runs).sort((a, b) => {
    const stateDiff = STATE_PRIORITY[a.state] - STATE_PRIORITY[b.state];
    if (stateDiff !== 0) return stateDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function formatRunSummaryLine(run: RunSummary): string {
  const id = run.runId.length > 12 ? run.runId.slice(0, 12) : run.runId;
  const proc = run.processId.length > 20 ? run.processId.slice(0, 19) + "\u2026" : run.processId;
  const pending = run.pendingCount > 0 ? ` [${run.pendingCount} pending]` : "";
  const promptExcerpt = run.prompt
    ? ` \u2014 ${run.prompt.length > 60 ? run.prompt.slice(0, 57) + "..." : run.prompt}`
    : "";
  return `${id} ${run.state} ${proc}${pending}${promptExcerpt}`;
}

export interface StatusSection {
  readonly title: string;
  readonly entries: readonly StatusEntry[];
}

export interface StatusEntry {
  readonly label: string;
  readonly value: string;
}

export function buildStatusSections(status: OrchestrationStatus): StatusSection[] {
  const sections: StatusSection[] = [
    {
      title: "Run",
      entries: [
        { label: "ID", value: status.runId },
        { label: "Phase", value: status.phase },
        { label: "Iteration", value: String(status.iteration) },
        { label: "Elapsed", value: formatElapsedCompact(status.elapsedMs) },
      ],
    },
    {
      title: "Effects",
      entries: [
        { label: "Total", value: String(status.totalEffects) },
        { label: "Resolved", value: String(status.resolvedEffects) },
        { label: "Pending", value: String(status.pendingEffects) },
      ],
    },
  ];

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

export function formatStatusSection(section: StatusSection): string[] {
  const lines: string[] = [`[${section.title}]`];
  const maxLabel = section.entries.reduce((max, e) => Math.max(max, e.label.length), 0);
  for (const entry of section.entries) {
    lines.push(`  ${entry.label.padEnd(maxLabel)}  ${entry.value}`);
  }
  return lines;
}

export function clampScrollOffset(
  offset: number,
  contentLength: number,
  viewportHeight: number,
): number {
  if (contentLength <= viewportHeight || viewportHeight <= 0) return 0;
  const maxOffset = contentLength - viewportHeight;
  return Math.max(0, Math.min(offset, maxOffset));
}

export function computeVisibleRange(
  offset: number,
  contentLength: number,
  viewportHeight: number,
): { start: number; end: number } {
  const clamped = clampScrollOffset(offset, contentLength, viewportHeight);
  const end = Math.min(clamped + viewportHeight, contentLength);
  return { start: clamped, end };
}

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

export function buildAlternateScreenEnter(): string {
  return "\x1b[?1049h";
}

export function buildAlternateScreenLeave(): string {
  return "\x1b[?1049l";
}

export type TabStatusPreset = "idle" | "busy" | "waiting" | "completed" | "failed";

export const TERMINAL_BELL = "\x07";

const TAB_STATUS_COLORS: Record<TabStatusPreset, string> = {
  idle: "0;128;0",
  busy: "255;165;0",
  waiting: "255;255;0",
  completed: "0;200;0",
  failed: "255;50;50",
};

export function buildTabStatusSequence(preset: TabStatusPreset): string {
  const rgb = TAB_STATUS_COLORS[preset];
  const [r, g, b] = rgb.split(";");
  return `\x1b]6;1;bg;red;brightness;${r}\x07\x1b]6;1;bg;green;brightness;${g}\x07\x1b]6;1;bg;blue;brightness;${b}\x07`;
}

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
