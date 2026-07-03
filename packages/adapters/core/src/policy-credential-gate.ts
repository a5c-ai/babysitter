/**
 * Milestone D — GATE 3: credential-injection backstop (§9.3 / AC-23a / AC-40 /
 * AC-40a / AC-50 / AC-55).
 *
 * Before env / credential injection, GATE 3 verifies a credential attestation: a
 * policy-bound (scoped) credential is delivered ONLY when a valid
 * CommandAuthorization covers its scope. It mediates every credential-delivery
 * channel `spawn-invocation.ts` constructs:
 *   - env injection: docker `-e`, ssh `K=V`, k8s `env` / `--env`  (`*-env`);
 *   - docker `-v` file mounts                                     (`docker-mount`);
 *   - k8s secret / serviceaccount references                     (`k8s-secret`,
 *                                                                  `k8s-serviceaccount`).
 * With NO valid authorization the channel is OMITTED (env dropped, mount omitted,
 * secret/serviceaccount ref stripped); if the policy marks the credential REQUIRED,
 * the spawn is DENIED.
 *
 * The credential→scope tag comes from a TRUSTED, out-of-agent source (AC-40) keyed
 * by a COLLISION-RESISTANT identity (AC-40a); aliases of one physical credential
 * canonicalize to one identity (AC-55). An absent / ambiguous identity, or no
 * mediated scope, → deny (fail closed) — never inject an untagged credential, never
 * pick the narrower of two candidate scopes.
 *
 * GATE 3 is the LAST point before exec, so it RECOMPUTES argsHash / commandHash from
 * the exact spawn (TOCTOU, AC-32) and re-checks them against the authorization.
 *
 * BOUNDED, WARNED NON-GOAL (AC-50): credentials the process obtains WITHOUT
 * spawn-invocation constructing the delivery — IMDS / IRSA / workload-identity,
 * pre-existing mounts, image creds — cannot be gated. For a scoped credential with
 * no GATE-3-mediated scope, the gate fails closed (does not inject) and surfaces a
 * warning; it does NOT claim a backstop for such an action.
 *
 * OVERRIDING RULE: fail closed. Any verification / parse / resolution error, or any
 * thrown exception, is a deny / no-injection. No fallbacks.
 */
import {
  verifyCommandAuthorization,
  resolveCredentialScope,
  argsHash as computeArgsHash,
  commandHash as computeCommandHash,
  type CommandAuthorizationPayload,
  type CredentialScopeSource,
  type TrustRoot,
} from '@a5c-ai/policy-adapter';
import type { SignedEnvelope } from '@a5c-ai/genty-core/trust';

/** A credential-delivery channel that `spawn-invocation.ts` controls (AC-23a/AC-50). */
export type CredentialChannel =
  | 'docker-env'
  | 'docker-mount'
  | 'ssh-env'
  | 'k8s-env'
  | 'k8s-secret'
  | 'k8s-serviceaccount';

/** A scoped credential about to be delivered by some channel spawn-invocation controls. */
export interface ScopedCredential {
  /** The env-var / mount / secret key name (AC-40a: NOT the identity). */
  name: string;
  value: string;
  /** The alias the agent supplies (ARN, key-id, secret name). */
  alias: string;
  /** The delivery channel spawn-invocation controls. */
  channel: CredentialChannel;
  /** Whether the policy marks this credential REQUIRED (spawn denied if undeliverable). */
  required?: boolean;
}

export interface GateCredentialInjectionInput {
  issuerRoots: TrustRoot[];
  policyDocHash: string;
  currentConfigEpoch: number;
  minEpochFloor: number;
  now: number;
  toolName: string;
  toolCallId: string;
  /** The exact command about to be spawned (GATE 3 recomputes its hash, AC-32). */
  command: string;
  /** The exact args about to be spawned (GATE 3 recomputes their hash, AC-32). */
  args: unknown;
  /** The trusted out-of-agent credential→scope source (AC-40/AC-40a/AC-55). */
  credentialSource: CredentialScopeSource;
  /** The scoped credentials about to be delivered. */
  credentials: ScopedCredential[];
  /** Resolve the CommandAuthorization for this spawn (or none). */
  resolveAuthorization: () => SignedEnvelope<CommandAuthorizationPayload> | undefined;
}

export interface GateCredentialInjectionResult {
  /** True when the spawn must be DENIED (a REQUIRED scoped credential is undeliverable). */
  denied: boolean;
  /** Credentials that passed the gate and may be injected/mounted/referenced. */
  injected: ScopedCredential[];
  /** Credentials the gate DROPPED (channel omitted) for lack of a valid authorization. */
  dropped: ScopedCredential[];
  /** Non-goal / substrate warnings (AC-50), one per credential the gate cannot mediate. */
  warnings: string[];
  reason?: string;
}

/**
 * Gate credential injection at the last point before exec (AC-23a). Returns the
 * credentials that may be delivered, those dropped, whether the spawn is denied, and
 * any bounded-non-goal warnings.
 */
export function gateCredentialInjection(
  input: GateCredentialInjectionInput,
): GateCredentialInjectionResult {
  const injected: ScopedCredential[] = [];
  const dropped: ScopedCredential[] = [];
  const warnings: string[] = [];

  try {
    if (!input || typeof input !== 'object') {
      return { denied: true, injected, dropped, warnings, reason: 'missing gate input' };
    }
    if (!Array.isArray(input.credentials)) {
      return { denied: true, injected, dropped, warnings, reason: 'missing credentials' };
    }
    if (!input.credentialSource || typeof input.credentialSource !== 'object') {
      // No trusted source → cannot tag ANY scoped credential → drop all, fail closed.
      for (const cred of input.credentials) dropped.push(cred);
      return {
        denied: input.credentials.some((c) => c?.required === true),
        injected,
        dropped,
        warnings,
        reason: 'missing trusted credential scope source',
      };
    }

    // Recompute the authorization binding hashes from the EXACT spawn (TOCTOU, AC-32).
    const argsHash = computeArgsHash(input.args);
    const commandHash = computeCommandHash(input.command ?? '');

    // Resolve + verify the authorization ONCE per spawn against the recomputed binding.
    const authorization = input.resolveAuthorization?.();

    let denied = false;
    const denyReasons: string[] = [];

    for (const cred of input.credentials) {
      // (AC-40 / AC-40a / AC-55) Resolve the credential's scope from the trusted source
      // keyed by the collision-resistant canonical identity of its alias. An absent /
      // ambiguous alias, or an identity with no mediated scope → no scope.
      const scopeResolution = resolveCredentialScope(cred.alias, input.credentialSource);
      if (!scopeResolution.resolved || typeof scopeResolution.scope !== 'string') {
        // No GATE-3-mediated scope for a scoped credential: fail closed (do NOT inject
        // an untagged credential, AC-40) and surface the bounded-non-goal warning (AC-50)
        // — the credential may be substrate-delivered (IMDS/IRSA/pre-mount), which GATE 3
        // cannot mediate.
        dropped.push(cred);
        warnings.push(
          `credential '${cred.name}' (alias '${cred.alias}') has no GATE-3-mediated scope: ` +
            `${scopeResolution.reason ?? 'unresolved'} — not injected (bounded non-goal, AC-50)`,
        );
        if (cred.required === true) {
          denied = true;
          denyReasons.push(`required credential '${cred.name}' has no mediated scope`);
        }
        continue;
      }

      const scope = scopeResolution.scope;

      // A valid CommandAuthorization whose credentialScope matches is REQUIRED before
      // the credential may be delivered by its channel (AC-23a).
      let authorized = false;
      if (authorization) {
        const verification = verifyCommandAuthorization(authorization, {
          now: input.now,
          toolName: input.toolName,
          toolCallId: input.toolCallId,
          commandHash,
          argsHash,
          credentialScope: scope,
          policyDocHash: input.policyDocHash,
          currentConfigEpoch: input.currentConfigEpoch,
          minEpochFloor: input.minEpochFloor,
          issuerRoots: input.issuerRoots,
        });
        authorized = verification.valid;
      }

      if (authorized) {
        injected.push(cred);
      } else {
        // No valid authorization → the channel is OMITTED (env dropped, -v mount
        // omitted, secret/serviceaccount ref stripped). If required, deny the spawn.
        dropped.push(cred);
        if (cred.required === true) {
          denied = true;
          denyReasons.push(
            `required credential '${cred.name}' lacks a valid authorization for scope '${scope}'`,
          );
        }
      }
    }

    return {
      denied,
      injected,
      dropped,
      warnings,
      reason: denyReasons.length > 0 ? denyReasons.join('; ') : undefined,
    };
  } catch (err) {
    // Fail closed — any exception is a deny / no-injection, never a pass.
    return {
      denied: true,
      injected: [],
      dropped: [...injected, ...dropped],
      warnings,
      reason: `exception during GATE 3 evaluation: ${(err as Error)?.message ?? String(err)}`,
    };
  }
}
