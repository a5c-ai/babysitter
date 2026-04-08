/**
 * EffectTree — hierarchical tree rendering of effects (GAP-UX-001a).
 */
import { colors, colorize } from "../colors";
import { renderStatusSymbol, type StatusType } from "./StatusBadge";

export interface EffectNodeProgress {
  percent?: number;
  label?: string;
}

export interface EffectNode {
  effectId: string;
  kind: string;
  status: StatusType;
  title: string;
  duration?: number;
  progress?: EffectNodeProgress;
  children?: EffectNode[];
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function renderNode(
  node: EffectNode,
  prefix: string,
  isLast: boolean,
): string[] {
  const lines: string[] = [];
  const connector = isLast ? "\u2514\u2500\u2500 " : "\u251C\u2500\u2500 ";
  const statusSym = renderStatusSymbol(node.status);
  const kindTag = colorize(`[${node.kind}]`, colors.dim);
  const title = node.title;
  const duration = node.duration !== undefined
    ? colorize(` (${formatDuration(node.duration)})`, colors.dim)
    : "";

  let progressStr = "";
  if (node.progress?.percent !== undefined) {
    const pct = Math.max(0, Math.min(100, Math.round(node.progress.percent)));
    const label = node.progress.label ? ` ${node.progress.label}` : "";
    progressStr = colorize(` [${pct}%${label}]`, colors.cyan);
  }

  lines.push(`${prefix}${connector}${statusSym} ${kindTag} ${title}${duration}${progressStr}`);

  const childPrefix = prefix + (isLast ? "    " : "\u2502   ");
  const children = node.children ?? [];
  for (let i = 0; i < children.length; i++) {
    const childLines = renderNode(children[i], childPrefix, i === children.length - 1);
    lines.push(...childLines);
  }

  return lines;
}

export function renderEffectTree(effects: EffectNode[]): string {
  if (effects.length === 0) {
    return colorize("(no effects)", colors.dim);
  }
  const lines: string[] = [];
  for (let i = 0; i < effects.length; i++) {
    const nodeLines = renderNode(effects[i], "", i === effects.length - 1);
    lines.push(...nodeLines);
  }
  return lines.join("\n");
}
