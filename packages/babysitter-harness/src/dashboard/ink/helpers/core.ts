import type {
  MessageKind,
  ThemeColors,
  EffectKind,
  TuiEffectStatus,
  EffectSummary,
  OrchestrationPhase,
  OrchestrationStatus,
  TokenUsage,
} from "../types.js";
import type { TreeNode } from "../components/primitives/Tree.js";

export function truncateRunId(id: string): string {
  if (id.length <= 12) return id;
  return id.slice(0, 12);
}

export function formatCost(cost: number): string {
  if (cost < 1) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

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

export function formatElapsedCompact(ms: number): string {
  if (ms < 0) ms = 0;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m${seconds}s`;
}

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

const MESSAGE_ICONS: Record<MessageKind, string> = {
  user: ">",
  assistant: "",
  tool_call: "\u2699",
  subagent: "\u25C8",
  system: "\u2139",
  error: "\u2717",
};

export function getMessageIcon(kind: MessageKind): string {
  return MESSAGE_ICONS[kind] ?? "";
}

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

export function shouldShowTimestamp(kind: MessageKind): boolean {
  return kind === "user" || kind === "assistant" || kind === "error";
}

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

export function formatShellOutput(
  stdout: string,
  stderr: string,
  exitCode: number,
): { lines: string[]; hasError: boolean } {
  const lines: string[] = [];
  if (stdout) {
    lines.push(...stdout.replace(/\n$/, "").split("\n"));
  }
  if (stderr) {
    for (const line of stderr.replace(/\n$/, "").split("\n")) {
      lines.push(`stderr: ${line}`);
    }
  }

  const hasError = exitCode !== 0;
  if (hasError) {
    lines.push(`Exit code: ${exitCode}`);
  }
  return { lines, hasError };
}

export function formatToolOutput(output: unknown): string[] {
  if (output === null || output === undefined) return [];
  if (typeof output === "string") {
    if (output === "") return [];
    return output.split("\n");
  }
  if (typeof output === "number" || typeof output === "boolean") {
    return [String(output)];
  }
  return JSON.stringify(output, null, 2).split("\n");
}

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

export function derivePhase(effects: EffectSummary[]): OrchestrationPhase {
  if (effects.length === 0) return "waiting";
  if (effects.some((e) => e.status === "pending")) return "executing";
  if (effects.some((e) => e.status === "failed")) return "failed";
  return "complete";
}

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

export interface PendingGroupSummary {
  readonly kind: EffectKind;
  readonly count: number;
  readonly titles: string[];
}

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
