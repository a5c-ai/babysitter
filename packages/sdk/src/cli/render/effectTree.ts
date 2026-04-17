import { colors, colorize } from "./ansi";
import { renderStatusSymbol, type StatusType } from "./statusBadge";

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
  costUsd?: number;
  children?: EffectNode[];
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function renderNode(node: EffectNode, prefix: string, isLast: boolean): string[] {
  const connector = isLast ? "\u2514\u2500\u2500 " : "\u251C\u2500\u2500 ";
  const duration = node.duration !== undefined
    ? colorize(` (${formatDuration(node.duration)})`, colors.dim)
    : "";

  let progress = "";
  if (node.progress?.percent !== undefined) {
    const pct = Math.max(0, Math.min(100, Math.round(node.progress.percent)));
    const label = node.progress.label ? ` ${node.progress.label}` : "";
    progress = colorize(` [${pct}%${label}]`, colors.cyan);
  }

  const cost = node.costUsd !== undefined
    ? colorize(` $${node.costUsd.toFixed(4)}`, colors.yellow)
    : "";

  const lines = [
    `${prefix}${connector}${renderStatusSymbol(node.status)} ${colorize(`[${node.kind}]`, colors.dim)} ${node.title}${duration}${progress}${cost}`,
  ];

  const childPrefix = prefix + (isLast ? "    " : "\u2502   ");
  const children = node.children ?? [];
  for (let index = 0; index < children.length; index += 1) {
    lines.push(...renderNode(children[index], childPrefix, index === children.length - 1));
  }
  return lines;
}

export function renderEffectTree(effects: EffectNode[]): string {
  if (effects.length === 0) {
    return colorize("(no effects)", colors.dim);
  }

  const lines: string[] = [];
  for (let index = 0; index < effects.length; index += 1) {
    lines.push(...renderNode(effects[index], "", index === effects.length - 1));
  }
  return lines.join("\n");
}
