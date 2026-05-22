import { colors, colorize } from "./ansi";

export type StatusType = "completed" | "failed" | "pending" | "running" | "waiting" | "created";

const STATUS_CONFIG: Record<StatusType, { symbol: string; color: string; label: string }> = {
  completed: { symbol: "\u2714", color: colors.green, label: "completed" },
  failed: { symbol: "\u2718", color: colors.red, label: "failed" },
  pending: { symbol: "\u25CB", color: colors.yellow, label: "pending" },
  running: { symbol: "\u25CF", color: colors.cyan, label: "running" },
  waiting: { symbol: "\u25CB", color: colors.yellow, label: "waiting" },
  created: { symbol: "\u2714", color: colors.green, label: "created" },
};

export function renderStatusBadge(status: StatusType): string {
  const config = STATUS_CONFIG[status];
  if (!config) return status;
  return colorize(`${config.symbol} ${config.label}`, config.color);
}

export function renderStatusSymbol(status: StatusType): string {
  const config = STATUS_CONFIG[status];
  if (!config) return "?";
  return colorize(config.symbol, config.color);
}
