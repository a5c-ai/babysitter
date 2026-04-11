/**
 * StatusLine — persistent status bar for orchestration state (GAP-UX-001e).
 */
import { colors, colorize } from "../colors";

export interface StatusLineProps {
  runId: string;
  iteration: number;
  pendingEffects: number;
  elapsed: number; // milliseconds
  status: "running" | "waiting" | "completed" | "failed";
  tokenUsage?: number;
  cost?: number;
  pendingByKind?: Record<string, number>;
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function abbreviateRunId(runId: string): string {
  if (runId.length <= 12) return runId;
  return runId.slice(0, 8) + "..";
}

function statusColor(status: StatusLineProps["status"]): string {
  switch (status) {
    case "running": return colors.green;
    case "waiting": return colors.yellow;
    case "completed": return colors.green;
    case "failed": return colors.red;
  }
}

function elapsedColor(ms: number): string {
  if (ms > 5 * 60 * 1000) return colors.yellow; // >5 min
  if (ms > 15 * 60 * 1000) return colors.red; // >15 min
  return colors.dim;
}

export function renderStatusLine(props: StatusLineProps): string {
  const parts: string[] = [];

  // Status indicator
  const sColor = statusColor(props.status);
  parts.push(colorize(`[${props.status}]`, sColor, colors.bold));

  // Run ID
  parts.push(colorize(abbreviateRunId(props.runId), colors.cyan));

  // Iteration
  parts.push(`iter:${colorize(String(props.iteration), colors.bold)}`);

  // Pending effects
  if (props.pendingEffects > 0) {
    let pendingStr = `pending:${props.pendingEffects}`;
    if (props.pendingByKind) {
      const kinds = Object.entries(props.pendingByKind)
        .map(([k, v]) => `${k}:${v}`)
        .join(",");
      pendingStr += `(${kinds})`;
    }
    parts.push(colorize(pendingStr, colors.yellow));
  }

  // Elapsed
  parts.push(colorize(formatElapsed(props.elapsed), elapsedColor(props.elapsed)));

  // Token usage
  if (props.tokenUsage !== undefined) {
    parts.push(`tokens:${props.tokenUsage.toLocaleString()}`);
  }

  // Cost
  if (props.cost !== undefined) {
    parts.push(`$${props.cost.toFixed(4)}`);
  }

  return parts.join("  ");
}
