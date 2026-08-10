/**
 * Milestone D — PRODUCTION wiring of GATE 3 (§9.3 / AC-23a / AC-40 / AC-50) into the
 * adapters spawn path (`spawn-runner.ts` → `buildInvocationCommand`).
 *
 * GATE 3's PRIMITIVE (`gateCredentialInjection` + `applyGate3ToEnv/Mounts/ServiceAccount`)
 * was shipped and fail-closed, but `spawn-runner.ts` called `buildInvocationCommand` with
 * only 3 args, so `gate3` was `undefined` and every credential channel emitted
 * unconditionally. This module resolves a `Gate3Options` from the SAME manifest-verified
 * config that drives GATE 1 / the session gate (via `loadPolicyEnforcementGate`), so the
 * production spawn path actually gates scoped-credential delivery.
 *
 * POSTURE (mirrors resolveRunPolicyGates):
 *   - Anchor pinned (`POLICY_CONFIG_ROOT_FP` set) → a Gate3Context is resolved from the
 *     verified config; a scoped credential with no valid CommandAuthorization is DROPPED
 *     (channel omitted) and, if required, the spawn is denied.
 *   - Anchor NOT pinned, OR no scoped credentials declared for this spawn → `undefined`;
 *     `buildInvocationCommand` runs with no gate (back-compat, channels emit as before).
 *
 * FAIL CLOSED: with the anchor pinned but the adapter unloadable / config untrusted, the
 * resolved context has NO issuer roots, so every scoped credential fails authorization and
 * is dropped (required → denied). No fallbacks — any thrown error yields no injection.
 */
import type { Gate3Options } from './spawn-invocation.js';

/** Per-spawn declaration of which delivery-channel credentials are SCOPED (from AC-40 source). */
export interface SpawnScopedCredentials {
  /** env-var key → trusted alias (ARN/key-id/secret-name) + required flag. */
  scopedEnvKeys?: Record<string, { alias: string; required?: boolean }>;
  /** docker `-v` mount spec → trusted alias + required flag (AC-50). */
  scopedMounts?: Record<string, { alias: string; required?: boolean }>;
  /** k8s `--serviceaccount` name → trusted alias + required flag (AC-50). */
  scopedServiceAccount?: { name: string; alias: string; required?: boolean };
}

/** The per-spawn binding context GATE 3 recomputes the authorization hash against (AC-32). */
export interface SpawnGateBinding {
  toolName: string;
  toolCallId: string;
  /** The exact command about to be spawned. */
  command: string;
  /** The exact args about to be spawned. */
  args: unknown;
  /** Resolve the CommandAuthorization for this spawn (or none → drop scoped creds). */
  resolveAuthorization: () => unknown;
}

// Memoize the resolved Gate3Context per project root so repeated spawns in one run do not
// re-verify the manifest.
const cache = new Map<string, Promise<unknown | undefined>>();

function anchorPinned(): boolean {
  const v = process.env.POLICY_CONFIG_ROOT_FP;
  return typeof v === 'string' && v.length > 0;
}

interface Gate3ContextLike {
  issuerRoots: unknown[];
  currentConfigEpoch: number;
  minEpochFloor: number;
  credentialSource?: {
    scopedCredentials?: {
      scopedEnvKeys?: Record<string, { alias: string; required?: boolean }>;
      scopedMounts?: Record<string, { alias: string; required?: boolean }>;
      scopedServiceAccount?: { name: string; alias: string; required?: boolean };
    };
  };
  policyDocHashFor: (toolName: string, command: string) => string;
}

async function resolveGate3Context(projectRoot: string): Promise<Gate3ContextLike | undefined> {
  const key = projectRoot;
  const existing = cache.get(key);
  if (existing) return existing as Promise<never>;
  const built = (async () => {
    try {
      const mod = await import('@a5c-ai/policy-adapter');
      const result = await mod.loadPolicyEnforcementGate(projectRoot);
      if (result.enforcementActive !== true) return undefined;
      return result.gate3Context as Gate3ContextLike | undefined;
    } catch {
      // Anchor pinned but adapter unloadable → return a trust-empty context so scoped creds
      // fail authorization (fail closed). Unpinned → undefined (no gating).
      if (anchorPinned()) {
        return {
          issuerRoots: [],
          currentConfigEpoch: 0,
          minEpochFloor: Number(process.env.POLICY_CONFIG_MIN_EPOCH ?? '1') || 1,
          policyDocHashFor: () => '',
        };
      }
      return undefined;
    }
  })();
  cache.set(key, built);
  return built as Promise<never>;
}

/** Test-only: clear the memo so a test can re-resolve with a fresh env. */
export function __resetSpawnGateCache(): void {
  cache.clear();
}

/**
 * Build a `Gate3Options` for a spawn, or `undefined` when GATE 3 should not gate this
 * spawn (anchor unpinned, or no scoped credentials declared). When the anchor is pinned and
 * this spawn declares scoped credentials, the returned options make `buildInvocationCommand`
 * gate every credential channel it constructs against a valid CommandAuthorization.
 */
export async function resolveSpawnGate3(
  projectRoot: string,
  scoped: SpawnScopedCredentials,
  binding: SpawnGateBinding,
): Promise<Gate3Options | undefined> {
  const hasScoped =
    (scoped.scopedEnvKeys && Object.keys(scoped.scopedEnvKeys).length > 0) ||
    (scoped.scopedMounts && Object.keys(scoped.scopedMounts).length > 0) ||
    scoped.scopedServiceAccount !== undefined;
  // Nothing scoped for this spawn → no gate needed (env/mounts/SA pass through unchanged).
  if (!hasScoped) return undefined;

  const ctx = await resolveGate3Context(projectRoot);
  if (!ctx) return undefined;

  const credentialSource = ctx.credentialSource as never;
  return {
    issuerRoots: ctx.issuerRoots as never,
    policyDocHash: ctx.policyDocHashFor(binding.toolName, binding.command),
    currentConfigEpoch: ctx.currentConfigEpoch,
    minEpochFloor: ctx.minEpochFloor,
    now: Date.now(),
    toolName: binding.toolName,
    toolCallId: binding.toolCallId,
    command: binding.command,
    args: binding.args,
    credentialSource,
    resolveAuthorization: binding.resolveAuthorization as never,
    scopedEnvKeys: scoped.scopedEnvKeys ?? {},
    ...(scoped.scopedMounts ? { scopedMounts: scoped.scopedMounts } : {}),
    ...(scoped.scopedServiceAccount ? { scopedServiceAccount: scoped.scopedServiceAccount } : {}),
  };
}

/**
 * Milestone E — AUTO-ACTIVATE GATE 3 from the SIGNED config (§9.3 / AC-23a / AC-40 / AC-50).
 *
 * The scoped-credential DECLARATION (which env keys / mounts / serviceaccount are scoped, and
 * to which trusted alias) is DEPLOYMENT CONFIGURATION, not agent-writable input. It lives in
 * the manifest-verified `credential-scope-source.json` (`scopedCredentials`), so a real spawn
 * is gated end-to-end WITHOUT a caller passing `RunOptions.policyGate3` and WITHOUT the agent
 * being able to declare its own scoping.
 *
 * When the anchor is pinned AND the signed source declares scoped credentials, this returns a
 * `Gate3Options` built from the SAME manifest-verified config that drives GATE 1 / the session
 * gate. When the anchor is unpinned, or the signed source declares no scoped credentials, this
 * returns `undefined` (GATE 3 gates only what a caller explicitly declared, back-compat).
 *
 * `resolveAuthorization` is the run's authorization-store resolver (the ALLOW path); with none,
 * a scoped credential fails authorization and its channel is dropped (fail closed).
 */
export async function resolveSpawnGate3FromConfig(
  projectRoot: string,
  binding: Omit<SpawnGateBinding, 'resolveAuthorization'> & {
    resolveAuthorization?: () => unknown;
  },
): Promise<Gate3Options | undefined> {
  if (!anchorPinned()) return undefined;
  const ctx = await resolveGate3Context(projectRoot);
  if (!ctx) return undefined;
  const declared = ctx.credentialSource?.scopedCredentials;
  if (!declared) return undefined;

  const scoped: SpawnScopedCredentials = {
    ...(declared.scopedEnvKeys ? { scopedEnvKeys: declared.scopedEnvKeys } : {}),
    ...(declared.scopedMounts ? { scopedMounts: declared.scopedMounts } : {}),
    ...(declared.scopedServiceAccount ? { scopedServiceAccount: declared.scopedServiceAccount } : {}),
  };
  return resolveSpawnGate3(projectRoot, scoped, {
    toolName: binding.toolName,
    toolCallId: binding.toolCallId,
    command: binding.command,
    args: binding.args,
    resolveAuthorization: binding.resolveAuthorization ?? (() => undefined),
  });
}
