/**
 * Milestone D — PRODUCTION wiring of GATE 1 (§9.1 / AC-49 / AC-33) into the
 * `@a5c-ai/tools-adapter` `ToolDispatcher`.
 *
 * The GATE-1 PRIMITIVE (`PolicyVerifierHookBridge`) and its coverage helper
 * (`decideCoverage`) are shipped and fail-closed, but until now nothing CONSTRUCTED
 * or INSTALLED the bridge on a production `ToolDispatcher` hook chain — GATE 1 was a
 * dead `if (this.hooks)` no-op. This module is the single production seam that closes
 * that gap.
 *
 * It mirrors the genty-side `resolveRunPolicyGates` / `loadPolicyEnforcementGate`
 * posture EXACTLY:
 *   - Anchor pinned (`POLICY_CONFIG_ROOT_FP` set) → GATE 1 is ACTIVE BY DEFAULT: the
 *     shared `loadPolicyEnforcementGate` verifies the pinned config manifest, builds
 *     coverage + authorization resolution from the verified config, and a covered
 *     action WITHOUT a valid CommandAuthorization is DENIED before `executor` runs.
 *   - Anchor NOT pinned → `undefined` (no bridge); the dispatch path is unchanged
 *     (documented back-compat).
 *
 * FAIL CLOSED. With the anchor pinned, ANY failure to establish trust yields a bridge
 * that denies every COVERED action (the shared gate's `configError` evaluator). If the
 * adapter cannot even be loaded while the anchor is pinned, this returns a HARD DENY-ALL
 * bridge — enforcement was requested and MUST NOT be silently disabled. No fallbacks.
 */
import type { ToolHookBridge, ToolHookResult } from './hooks.js';
import { CompositeToolHookBridge } from './hooks.js';
import type { ToolCallContext, ToolDescriptor } from './types.js';

/** True when the off-workspace config anchor is pinned (enforcement requested). */
function anchorPinned(): boolean {
  const v = process.env.POLICY_CONFIG_ROOT_FP;
  return typeof v === 'string' && v.length > 0;
}

/** Extract the command STRING for command-bearing tools (mirrors dispatch-side helper). */
function commandStringOf(input: unknown): string {
  if (input && typeof input === 'object') {
    const cmd = (input as Record<string, unknown>).command;
    if (typeof cmd === 'string') return cmd;
  }
  return '';
}

/**
 * A GATE-1 bridge that delegates to the shared `PolicyEnforcementGate.evaluate` built by
 * `@a5c-ai/policy-adapter`. `evaluate` already applies the full covered/uncovered/
 * authorization decision (AC-23 / AC-38b / AC-49), recomputes hashes at the gate (TOCTOU,
 * AC-32), and binds the executing `toolCallId` (AC-34a — a covered action with no executing
 * id is DENIED). This bridge simply threads the `ToolCallContext` through it.
 */
class GateEvaluatorHookBridge implements ToolHookBridge {
  constructor(private readonly evaluate: (ctx: {
    toolName: string;
    input: unknown;
    toolCallId?: string;
    runId?: string;
    sessionId?: string;
    command?: string;
  }) => { allowed: boolean; reason?: string }) {}

  async beforeToolUse(
    context: ToolCallContext,
    _descriptor: ToolDescriptor,
  ): Promise<ToolHookResult | undefined> {
    try {
      const decision = this.evaluate({
        toolName: context.toolName,
        input: context.input,
        // AC-34a — the ACTUAL executing tool-call id; the gate DENIES a covered action
        // with an absent id (never binds to the authorization's own id).
        toolCallId: context.toolCallId,
        runId: context.runId,
        sessionId: context.sessionId,
        command: commandStringOf(context.input),
      });
      if (!decision.allowed) {
        return { decision: 'deny', reason: decision.reason ?? 'policy denied' };
      }
      return { decision: 'allow' };
    } catch (err) {
      // Fail closed — any exception is a denial, never a pass.
      return { decision: 'deny', reason: `exception during GATE 1: ${(err as Error)?.message ?? String(err)}` };
    }
  }

  async afterToolUse(): Promise<ToolHookResult | undefined> {
    return undefined;
  }
}

/** A bridge that DENIES every call (used when enforcement is requested but unavailable). */
class DenyAllHookBridge implements ToolHookBridge {
  constructor(private readonly reason: string) {}
  async beforeToolUse(): Promise<ToolHookResult | undefined> {
    return { decision: 'deny', reason: `policy enforcement unavailable (fail closed): ${this.reason}` };
  }
  async afterToolUse(): Promise<ToolHookResult | undefined> {
    return undefined;
  }
}

/**
 * Build the production GATE-1 policy hook bridge for a project, or `undefined` when the
 * anchor is not pinned (back-compat). When the anchor IS pinned but the adapter cannot be
 * loaded / reports inactive, returns a HARD DENY-ALL bridge (fail closed).
 *
 * `projectRoot` anchors the `.policy` dir (typically the run's workspace). The optional
 * `resolveAuthorization` is the run's authorization store — with none, a covered action
 * DENIES.
 */
export async function loadPolicyVerifierBridge(
  projectRoot: string,
  resolveAuthorization?: (context: {
    toolName: string;
    toolCallId: string | undefined;
    sessionId: string | undefined;
    runId: string | undefined;
  }) => unknown,
): Promise<ToolHookBridge | undefined> {
  const pinned = anchorPinned();
  try {
    const mod = await import('@a5c-ai/policy-adapter');
    const result = await mod.loadPolicyEnforcementGate(
      projectRoot,
      resolveAuthorization as never,
    );
    if (result.enforcementActive !== true) {
      // Adapter reports inactive. Anchor pinned → contradiction → deny-all; else no bridge.
      return pinned
        ? new DenyAllHookBridge('policy adapter reported enforcement inactive while anchor is pinned')
        : undefined;
    }
    return new GateEvaluatorHookBridge(result.evaluate);
  } catch (err) {
    // Loading the adapter failed. Anchor pinned → enforcement was requested, so fail closed
    // with a deny-all bridge; unpinned → enforcement never requested, leave dispatch alone.
    return pinned
      ? new DenyAllHookBridge(`policy adapter failed to load: ${(err as Error)?.message ?? String(err)}`)
      : undefined;
  }
}

/**
 * Compose the GATE-1 policy bridge in FRONT of an existing hooks bridge so a policy deny is
 * un-bypassable (§9.1). When `policyBridge` is undefined (anchor unpinned) the existing
 * bridge is returned unchanged; when there is no existing bridge the policy bridge stands
 * alone.
 */
export function composePolicyBridge(
  policyBridge: ToolHookBridge | undefined,
  existing: ToolHookBridge | undefined,
): ToolHookBridge | undefined {
  if (!policyBridge) return existing;
  if (!existing) return policyBridge;
  return new CompositeToolHookBridge(policyBridge, existing);
}
