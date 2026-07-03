/**
 * Milestone D — PRODUCTION wiring of the tool-layer gates into the genty run
 * (§9.4 / AC-49 / AC-45).
 *
 * The genty session (`AgentCoreSessionOptions.policyToolGate`) and the genty MCP
 * dispatcher (`McpRoutingOptions.policyGate`) are LOAD-BEARING blocking gates, but they
 * were never populated in production — the `if (gate)` checks were dead. This helper
 * builds the gate ONCE per workspace (via the policy-adapter's `loadPolicyEnforcementGate`,
 * which verifies the pinned config manifest and constructs coverage + authorization
 * resolution from the verified config) and hands the run its `policyToolGate` /
 * `mcpPolicyGate` callbacks.
 *
 * POSTURE (mirrors Milestone C's loadTrustedBreakpointPolicy):
 *   - anchor pinned (`POLICY_CONFIG_ROOT_FP` set) → enforcement ACTIVE by default; a
 *     covered action without a valid CommandAuthorization is DENIED on the real path with
 *     no extra caller wiring, and a config error denies every covered action (fail closed).
 *   - anchor NOT pinned → `undefined` gate; the run paths are unchanged (back-compat).
 *
 * The gate is memoized per workspace so repeated session/effect construction within one
 * run does not re-verify the manifest each time.
 */
import type {
  PolicyEnforcementGate,
  AuthorizationResolver,
} from '@a5c-ai/policy-adapter';
import type { AgentCoreSessionOptions } from '@a5c-ai/genty-core';

type SessionToolGate = (ctx: {
  toolName: string;
  toolCallId: string;
  input: unknown;
  modelId?: string;
}) => { allowed: boolean; reason?: string };

type McpPolicyGate = (ctx: {
  toolName: string;
  input: unknown;
  runId?: string;
  sessionId?: string;
}) => { allowed: boolean; reason?: string };

export interface RunPolicyGates {
  /** The genty session tool-execution gate, or undefined when enforcement is inactive. */
  policyToolGate?: SessionToolGate;
  /** The genty MCP dispatcher gate, or undefined when enforcement is inactive. */
  mcpPolicyGate?: McpPolicyGate;
}

const cache = new Map<string, Promise<RunPolicyGates>>();

/**
 * Build a DENY-ALL pair of gates. Used only when the config anchor is pinned (enforcement
 * requested) but the policy adapter could not be loaded / reported inactive — a state that
 * MUST fail closed rather than silently disable enforcement. Both gates deny every call so
 * no covered action can slip through an unloadable adapter. Mirrors the adapter-side
 * `makeConfigErrorEvaluator` posture (a config/adapter error denies).
 */
function denyAllGates(reason: string): RunPolicyGates {
  const deny = () => ({ allowed: false, reason: `policy enforcement unavailable (fail closed): ${reason}` });
  return { policyToolGate: deny, mcpPolicyGate: deny };
}

/**
 * Resolve the run's policy gates for a workspace. Memoized per workspace. The optional
 * `resolveAuthorization` is the run's authorization store (the orchestrator issues a
 * CommandAuthorization when evidence is present; with no store a covered action DENIES).
 */
export function resolveRunPolicyGates(
  workspace: string | undefined,
  resolveAuthorization?: AuthorizationResolver,
): Promise<RunPolicyGates> {
  const key = workspace ?? '';
  const existing = cache.get(key);
  if (existing) return existing;

  // Whether the off-workspace config anchor is pinned. When it IS pinned, enforcement is
  // meant to be active and ANY failure to load the adapter is fail-closed (deny-all covered
  // actions), NEVER a silent disable. When it is NOT pinned, we are in the documented
  // back-compat posture and the absence of a gate leaves the run unchanged.
  const anchorPinned = typeof process.env.POLICY_CONFIG_ROOT_FP === 'string'
    && process.env.POLICY_CONFIG_ROOT_FP.length > 0;

  // Fast path (back-compat): with NO anchor pinned, enforcement is inactive by design. Skip
  // the dynamic policy-adapter import entirely — no gate is constructed and the run paths are
  // unchanged. This keeps the un-enforced default free of any adapter load cost. (The adapter
  // itself returns `enforcementActive: false` in this case; short-circuiting here is a pure
  // optimization that does not change the fail-closed semantics — those apply only when the
  // anchor IS pinned, handled below.)
  if (!anchorPinned) {
    const empty = Promise.resolve<RunPolicyGates>({});
    cache.set(key, empty);
    return empty;
  }

  const built = (async (): Promise<RunPolicyGates> => {
    try {
      // Dynamic import keeps the policy-adapter (ESM) out of any CJS build graph, matching
      // the SDK's proven-verification.ts / trusted-breakpoint-policy.ts pattern.
      const mod = await import('@a5c-ai/policy-adapter');
      const result = await mod.loadPolicyEnforcementGate(workspace ?? process.cwd(), resolveAuthorization);
      if (result.enforcementActive !== true) {
        // Adapter reports inactive. If the anchor is pinned this is a contradiction (the
        // adapter fails closed when pinned), so install a deny-all gate; otherwise no gate.
        if (anchorPinned) {
          return denyAllGates('policy adapter reported enforcement inactive while anchor is pinned');
        }
        return {};
      }
      const gate = result as PolicyEnforcementGate;
      return {
        policyToolGate: gate.policyToolGate,
        mcpPolicyGate: gate.mcpPolicyGate,
      };
    } catch (err) {
      // The policy-adapter failing to LOAD is NOT a silent pass when the anchor is pinned:
      // enforcement was requested, so we cannot silently disable it. Install a deny-all gate
      // for covered actions (fail closed). Only when the anchor is UNPINNED (back-compat) do
      // we return no gate — enforcement was never requested.
      if (anchorPinned) {
        return denyAllGates(
          `policy adapter failed to load while anchor is pinned: ${(err as Error)?.message ?? String(err)}`,
        );
      }
      return {};
    }
  })();

  cache.set(key, built);
  return built;
}

/** Test-only: clear the per-workspace memo so a test can re-resolve with a fresh env. */
export function __resetRunPolicyGatesCache(): void {
  cache.clear();
}

/**
 * The subset of `AgentCoreSessionOptions` the gate helpers touch. Kept as an alias of the
 * real type so call sites get correct contextual typing (no literal widening) and every
 * tool-executing `createAgentCoreSession` construction can route through one funnel.
 */
export type PolicyGatedSessionOptions = AgentCoreSessionOptions;

/**
 * CENTRALIZED session-gate attachment (§9.4 / AC-49). EVERY tool-executing
 * `createAgentCoreSession` construction MUST route its options through this helper so no
 * site can silently omit the load-bearing `policyToolGate`. It resolves the run's gate for
 * the session's workspace (memoized) and attaches `policyToolGate` when enforcement is
 * active; when the config anchor is not pinned the options are returned unchanged
 * (back-compat). Idempotent — re-applying to already-gated options is a no-op.
 *
 * `workspaceOverride` lets a caller pin the run's workspace when the session options carry
 * a different/absent `workspace` (e.g. worker sessions whose workspace is the run root).
 */
export async function withPolicyGate(
  options: AgentCoreSessionOptions,
  workspaceOverride?: string,
  resolveAuthorization?: AuthorizationResolver,
): Promise<AgentCoreSessionOptions> {
  // Already gated (e.g. the orchestrator session set it explicitly) — do not re-resolve.
  if (options.policyToolGate) return options;
  const workspace = workspaceOverride ?? options.workspace;
  const { policyToolGate } = await resolveRunPolicyGates(workspace, resolveAuthorization);
  return applyPolicyGateSync(options, policyToolGate);
}

/**
 * Synchronous applier for a PRE-RESOLVED gate. Sites that construct sessions inside a
 * synchronous factory (e.g. the retry `piSessionFactory`) resolve the run's gate once
 * (async) up front, then apply it synchronously to every session they build so no
 * tool-executing session omits the gate. Idempotent.
 */
export function applyPolicyGateSync(
  options: AgentCoreSessionOptions,
  policyToolGate: SessionToolGate | undefined,
): AgentCoreSessionOptions {
  if (options.policyToolGate) return options;
  if (!policyToolGate) return options;
  return { ...options, policyToolGate };
}
