/**
 * Sandbox-to-governance bridge (GAP-SEC-002).
 * Converts sandbox decisions into interaction requests and governance events,
 * and derives child sandbox policies from mandate scopes.
 */

import type {
  SandboxDecision,
  SandboxOperation,
  SandboxPolicy,
  SandboxRule,
} from './sandboxPolicy';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SandboxEvent {
  kind: string;
  operation: SandboxOperation;
  decision: SandboxDecision;
  timestamp: string;
  source: string;
  mandateId?: string;
}

export interface SandboxInteraction {
  kind: 'approval';
  operationKind?: string;
  operationTarget?: string;
  reason?: string;
}

interface BuildSandboxEventOptions {
  mandateId?: string;
  source?: string;
}

interface MandateScopeLike {
  allowedEffectKinds: string[];
  maxIterations: number;
  maxConcurrentTasks: number;
  timeoutMs: number;
}

// ---------------------------------------------------------------------------
// Decision → Interaction
// ---------------------------------------------------------------------------

/**
 * Convert a sandbox decision to an interaction request.
 * Returns null for allow/block (no human input needed), returns an approval
 * interaction for prompt decisions.
 */
export function sandboxDecisionToInteraction(
  decision: SandboxDecision,
  operation?: SandboxOperation,
): SandboxInteraction | null {
  if (decision.action !== 'prompt') {
    return null;
  }

  const interaction: SandboxInteraction = {
    kind: 'approval',
  };

  if (operation) {
    interaction.operationKind = operation.kind;
    interaction.operationTarget = operation.target;
  }

  if (decision.reason) {
    interaction.reason = decision.reason;
  }

  return interaction;
}

// ---------------------------------------------------------------------------
// Event factory
// ---------------------------------------------------------------------------

/**
 * Build a SandboxEvent with auto-timestamp and default source.
 */
export function buildSandboxEvent(
  operation: SandboxOperation,
  decision: SandboxDecision,
  options?: BuildSandboxEventOptions,
): SandboxEvent {
  return {
    kind: `sandbox.${operation.kind}`,
    operation,
    decision,
    timestamp: new Date().toISOString(),
    source: options?.source ?? 'sandbox',
    ...(options?.mandateId ? { mandateId: options.mandateId } : {}),
  };
}

// ---------------------------------------------------------------------------
// Policy inheritance from mandate scope
// ---------------------------------------------------------------------------

/**
 * Derive a child sandbox policy from a parent policy respecting mandate scope.
 * - All parent block rules are always inherited.
 * - Allow/prompt rules are only inherited if their kind is within the mandate's
 *   allowedEffectKinds (or if allowedEffectKinds contains '*').
 */
export function inheritSandboxPolicy(
  parentPolicy: SandboxPolicy,
  mandateScope: MandateScopeLike,
): SandboxPolicy {
  const allowAll = mandateScope.allowedEffectKinds.includes('*');

  const childRules: SandboxRule[] = [];

  for (const rule of parentPolicy.rules) {
    if (rule.action === 'block') {
      // Always inherit blocks
      childRules.push({ ...rule });
    } else if (allowAll || mandateScope.allowedEffectKinds.includes(rule.kind)) {
      // Only inherit allow/prompt if mandate permits this kind
      childRules.push({ ...rule });
    }
  }

  return {
    rules: childRules,
    defaultAction: parentPolicy.defaultAction,
  };
}
