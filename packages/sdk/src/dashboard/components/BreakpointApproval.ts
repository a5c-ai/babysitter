/**
 * BreakpointApproval — rich breakpoint approval dialog (GAP-UX-001c).
 * Renders a static representation of the approval prompt.
 */
import { colors, colorize } from "../colors";

export interface ApprovalOption {
  label: string;
  value: string;
  description?: string;
}

export interface AutoApprovalInfo {
  recommended: boolean;
  reason: string;
  matchedRule?: string;
  consecutiveApprovals?: number;
}

export interface BreakpointApprovalProps {
  breakpointId: string;
  title: string;
  description?: string;
  options: ApprovalOption[];
  autoApproval?: AutoApprovalInfo;
  risk?: "low" | "medium" | "high";
  expert?: string;
  tags?: string[];
  previousFeedback?: string;
  selectedIndex?: number;
}

function riskColor(risk: "low" | "medium" | "high"): string {
  switch (risk) {
    case "low": return colors.green;
    case "medium": return colors.yellow;
    case "high": return colors.red;
  }
}

export function renderBreakpointApproval(props: BreakpointApprovalProps): string {
  const lines: string[] = [];

  // Header
  lines.push(colorize(`\u2588 Breakpoint: ${props.title}`, colors.bold, colors.cyan));
  lines.push(colorize(`  ID: ${props.breakpointId}`, colors.dim));

  // Description
  if (props.description) {
    lines.push("");
    lines.push(`  ${props.description}`);
  }

  // Risk indicator
  if (props.risk) {
    const rc = riskColor(props.risk);
    lines.push(`  Risk: ${colorize(props.risk.toUpperCase(), rc, colors.bold)}`);
  }

  // Tags
  if (props.tags && props.tags.length > 0) {
    const tagStr = props.tags.map((t) => colorize(`[${t}]`, colors.dim)).join(" ");
    lines.push(`  Tags: ${tagStr}`);
  }

  // Expert
  if (props.expert) {
    lines.push(`  Expert: ${colorize(props.expert, colors.magenta)}`);
  }

  // Auto-approval recommendation
  if (props.autoApproval) {
    lines.push("");
    const recColor = props.autoApproval.recommended ? colors.green : colors.yellow;
    const recText = props.autoApproval.recommended ? "AUTO-APPROVE" : "MANUAL REVIEW";
    lines.push(`  ${colorize(`\u25B6 ${recText}`, recColor, colors.bold)}: ${props.autoApproval.reason}`);
    if (props.autoApproval.matchedRule) {
      lines.push(`    Rule: ${colorize(props.autoApproval.matchedRule, colors.dim)}`);
    }
    if (props.autoApproval.consecutiveApprovals !== undefined) {
      lines.push(`    Consecutive approvals: ${props.autoApproval.consecutiveApprovals}`);
    }
  }

  // Previous feedback
  if (props.previousFeedback) {
    lines.push("");
    lines.push(colorize("  Previous feedback:", colors.yellow));
    lines.push(`  ${props.previousFeedback}`);
  }

  // Options
  lines.push("");
  lines.push(colorize("  Options:", colors.bold));
  for (let i = 0; i < props.options.length; i++) {
    const opt = props.options[i];
    const isSelected = i === (props.selectedIndex ?? -1);
    const marker = isSelected
      ? colorize("\u25B8 ", colors.cyan)
      : "  ";
    const label = isSelected
      ? colorize(opt.label, colors.bold, colors.cyan)
      : opt.label;
    lines.push(`  ${marker}${label}`);
    if (opt.description) {
      lines.push(`      ${colorize(opt.description, colors.dim)}`);
    }
  }

  return lines.join("\n");
}
