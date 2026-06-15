/**
 * Permission and breakpoint approval UI — format approval prompts,
 * parse operator responses, and provide sensible defaults per risk
 * level (GAP-UX-001c).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ApprovalAction = 'approve' | 'deny' | 'modify';

export interface ApprovalPrompt {
  action: string;
  riskLevel: RiskLevel;
  context: string;
  options: string[];
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const RISK_ICON: Record<RiskLevel, string> = {
  low: '[LOW]',
  medium: '[MED]',
  high: '[HIGH]',
  critical: '[CRIT]',
};

/**
 * Render a styled approval request as text.
 */
export function formatApprovalPrompt(prompt: ApprovalPrompt): string {
  const lines: string[] = [];
  const divider = '─'.repeat(50);

  lines.push(divider);
  lines.push(`  ${RISK_ICON[prompt.riskLevel]} Approval Required`);
  lines.push(divider);
  lines.push(`  Action:  ${prompt.action}`);
  lines.push(`  Risk:    ${prompt.riskLevel}`);
  lines.push(`  Context: ${prompt.context}`);
  lines.push('');
  lines.push('  Options:');
  for (const opt of prompt.options) {
    lines.push(`    - ${opt}`);
  }
  lines.push(divider);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const APPROVE_TOKENS = new Set(['approve', 'yes', 'y', 'ok', 'allow', 'accept', 'proceed']);
const DENY_TOKENS = new Set(['deny', 'no', 'n', 'reject', 'block', 'cancel', 'abort']);
const MODIFY_TOKENS = new Set(['modify', 'edit', 'change', 'update', 'adjust']);

/**
 * Extract an approval action from free-form user input.
 * Returns undefined if the input cannot be classified.
 */
export function parseApprovalResponse(input: string): ApprovalAction | undefined {
  const normalised = input.trim().toLowerCase();

  // Exact match first
  if (APPROVE_TOKENS.has(normalised)) return 'approve';
  if (DENY_TOKENS.has(normalised)) return 'deny';
  if (MODIFY_TOKENS.has(normalised)) return 'modify';

  // Word-boundary match for multi-word input (e.g. "yes, approve it")
  // Only match tokens >= 2 chars to avoid false positives from "y"/"n"
  const words = normalised.split(/\W+/).filter(Boolean);

  for (const word of words) {
    if (APPROVE_TOKENS.has(word)) return 'approve';
  }
  for (const word of words) {
    if (DENY_TOKENS.has(word)) return 'deny';
  }
  for (const word of words) {
    if (MODIFY_TOKENS.has(word)) return 'modify';
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/**
 * Return the default approval action for a given risk level.
 *
 * - low    → approve (auto-approve safe actions)
 * - medium → approve (lean towards progress)
 * - high   → deny   (require explicit approval)
 * - critical → deny (require explicit approval)
 */
export function getDefaultApprovalForRisk(riskLevel: RiskLevel): ApprovalAction {
  switch (riskLevel) {
    case 'low':
    case 'medium':
      return 'approve';
    case 'high':
    case 'critical':
      return 'deny';
  }
}
