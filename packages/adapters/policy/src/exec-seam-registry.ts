/**
 * Milestone D — Checked-in exec-seam registry (AC-56) + load-bearing-gate
 * classification (AC-49 / AC-49a / AC-33).
 *
 * This is the CHECKED-IN source of truth enumerating every tool-execution /
 * dispatch / spawn ENTRY SEAM in genty + adapters, with each seam's declared
 * enforcement role. The AC-49a enumeration test is structured as an
 * EXHAUSTIVENESS assertion over this registry: a NEW exec entry point not present
 * here (and not added to the spec-derived enumeration after design review) breaks
 * CI rather than silently bypassing enforcement.
 *
 * ROLES (AC-49):
 *   - `blocking`         — evaluates policy and CAN return deny BEFORE execution.
 *                          The load-bearing, un-bypassable line for a covered
 *                          action (GATE 1 beforeToolUse; the genty dispatcher and
 *                          session execute seams).
 *   - `defense-in-depth` — advisory (GATE 2 non-blocking preToolUse) or
 *                          credential-only (GATE 3 spawn-invocation). NEVER the
 *                          sole line for a covered action.
 *
 * OVERRIDING RULE: the registry MUST NOT downgrade a load-bearing seam to
 * defense-in-depth. Every entry's `role` is asserted against the spec by the
 * frozen enumeration test.
 */

/** The enforcement role a seam plays for a covered action (AC-49). */
export type ExecSeamRole = 'blocking' | 'defense-in-depth';

/**
 * One tool-execution / dispatch / spawn entry seam. `file` is a repo-root-relative
 * path so the enumeration test can confirm the seam file still exists (a rename
 * without updating the registry fails the build, AC-56).
 */
export interface ExecSeamEntry {
  /** Stable id (matches the spec-enumerated seam id). */
  id: string;
  /** Repo-root-relative path to the file that hosts the seam. */
  file: string;
  /** True when this seam is on the covered-action execution path (AC-49a). */
  onCoveredPath: boolean;
  /** The enforcement role this seam plays (AC-49). */
  role: ExecSeamRole;
  /** Human-readable description of the seam (for audit / review). */
  description: string;
}

/**
 * The frozen registry. It MUST match the spec-derived enumeration exactly
 * (research §4 genty decision/execution points; §5 the three adapters gates;
 * §6.3 dispatcher seam). Adding a new exec entry point is a reviewed change:
 * a new row here AND in the design's enumeration.
 */
export const EXEC_SEAM_REGISTRY: readonly ExecSeamEntry[] = [
  {
    id: 'genty-session-execute',
    file: 'packages/genty/core/src/session.ts',
    onCoveredPath: true,
    role: 'blocking',
    description:
      'genty session tool-execution point (definition.execute) — verifies authorization ' +
      'before execution using the in-process model attestation on ToolExecutionContext (AC-23b).',
  },
  {
    id: 'genty-mcp-dispatcher',
    file: 'packages/genty/platform/src/harness/internal/createRun/orchestration/effects.ts',
    onCoveredPath: true,
    role: 'blocking',
    description:
      'genty MCP dispatcher seam (dispatcher.dispatch) — verifies authorization before ' +
      'execution via verifyDispatchAuthorization (AC-23b / AC-49).',
  },
  {
    id: 'adapters-gate1-dispatch',
    file: 'packages/adapters/tools/src/dispatch.ts',
    onCoveredPath: true,
    role: 'blocking',
    description:
      'GATE 1 — ToolDispatcher.beforeToolUse policy verifier (PolicyVerifierHookBridge). ' +
      'The LOAD-BEARING, un-bypassable gate for ALL covered actions (AC-23 / AC-49). ' +
      'Production wiring: ToolDispatcher.create installs the bridge from policy-verifier-wiring.',
  },
  {
    id: 'adapters-gate1-production-wiring',
    file: 'packages/adapters/tools/src/policy-verifier-wiring.ts',
    onCoveredPath: true,
    role: 'blocking',
    description:
      'GATE 1 PRODUCTION wiring — loadPolicyVerifierBridge constructs the GATE-1 bridge from ' +
      'the shared loadPolicyEnforcementGate and composePolicyBridge installs it in front of ' +
      'the existing hooks bridge (AC-49). The bridge delegates to the verified gate.evaluate.',
  },
  {
    id: 'adapters-gate2-spawn-runtime-hooks',
    file: 'packages/adapters/core/src/spawn-runtime-hooks.ts',
    onCoveredPath: true,
    role: 'defense-in-depth',
    description:
      'GATE 2 — runtime preToolUse blocking dispatch. Hard-enforces ONLY in blocking mode; ' +
      'advisory for non-blocking adapters, so it is defense-in-depth, not the sole line (AC-49).',
  },
  {
    id: 'adapters-gate3-spawn-invocation',
    file: 'packages/adapters/core/src/spawn-invocation.ts',
    onCoveredPath: true,
    role: 'defense-in-depth',
    description:
      'GATE 3 — credential-injection backstop. Only mediates scoped credential delivery ' +
      '(env / docker -v / k8s secret/serviceaccount), so it is defense-in-depth (AC-50 / AC-49).',
  },
  {
    id: 'adapters-gate3-spawn-runner',
    file: 'packages/adapters/core/src/spawn-runner.ts',
    onCoveredPath: true,
    role: 'defense-in-depth',
    description:
      'GATE 3 PRODUCTION wiring — spawn-runner builds a Gate3Options via resolveSpawnGate3 ' +
      'and passes it as the 4th arg to buildInvocationCommand so the live spawn gates every ' +
      'credential channel (env / docker -v / k8s serviceaccount) (AC-23a / AC-50).',
  },
  {
    id: 'adapters-gate3-spawn-gate-resolver',
    file: 'packages/adapters/core/src/policy-spawn-gate.ts',
    onCoveredPath: true,
    role: 'defense-in-depth',
    description:
      'GATE 3 PRODUCTION resolver — resolveSpawnGate3 loads the Gate3Context from the shared ' +
      'loadPolicyEnforcementGate and builds a Gate3Options for the spawn (AC-40 / AC-50).',
  },
  {
    id: 'genty-code-executor-nested-dispatch',
    file: 'packages/genty/core/src/agenticTools/tools/programmaticToolCalling.ts',
    onCoveredPath: true,
    role: 'blocking',
    description:
      'genty code_executor nested tool-call seam. A nested callTool runs tool.execute( ' +
      'either through the policy-gated toolDispatcher.dispatch (GATE 1 re-entry) or, when no ' +
      'dispatcher is wired AND the policy anchor is pinned, is REFUSED (fail closed) so a nested ' +
      'covered action cannot escape the session policyToolGate (AC-49 / AC-33).',
  },
];
