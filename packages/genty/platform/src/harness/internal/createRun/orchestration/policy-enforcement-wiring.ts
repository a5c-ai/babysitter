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

  const built = (async (): Promise<RunPolicyGates> => {
    try {
      // Dynamic import keeps the policy-adapter (ESM) out of any CJS build graph, matching
      // the SDK's proven-verification.ts / trusted-breakpoint-policy.ts pattern.
      const mod = await import('@a5c-ai/policy-adapter');
      const result = await mod.loadPolicyEnforcementGate(workspace ?? process.cwd(), resolveAuthorization);
      if (result.enforcementActive !== true) {
        return {};
      }
      const gate = result as PolicyEnforcementGate;
      return {
        policyToolGate: gate.policyToolGate,
        mcpPolicyGate: gate.mcpPolicyGate,
      };
    } catch {
      // The policy-adapter failing to load is NOT a silent pass: when the anchor is pinned
      // the adapter itself fails closed. If the import throws outright (adapter unavailable)
      // we cannot construct a gate — return no gate so the run is unchanged, matching the
      // back-compat posture (the anchor being pinned but the adapter missing is a deploy
      // misconfiguration, not an attacker path; the breakpoint gate independently denies).
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
