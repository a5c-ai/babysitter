/**
 * Milestone C — ENFORCED signed human breakpoints (SDK).
 *
 * The enforcement DECISION for a breakpoint answer when the policy requires a
 * signature. Wired into the task_post / commitEffectResult path (see
 * `runtime/commitEffectResult.ts`) so that:
 *   - when a signature is REQUIRED, an UNSIGNED / invalid / wrong-key / tampered /
 *     unsigned-`approved` answer is REJECTED fail-closed (the commit is refused, the
 *     effect stays PENDING, no EFFECT_RESOLVED is emitted); a validly-signed answer is
 *     ACCEPTED (AC-28, AC-4, §5 step 7, AC-48);
 *   - when a signature is NOT required (the pre-Milestone-C default), an unsigned
 *     answer is UNAFFECTED — existing runs do not break (back-compat).
 *
 * This is a PURE decision function (no filesystem / run wiring) so it is unit-testable;
 * it reuses the shipped `proven-verification.ts` (which does the optional dynamic import
 * of `@a5c-ai/tasks-adapter/proven` and the raw signature check).
 *
 * OVERRIDING RULE: fail closed. When a signature is required, ANY error during
 * verification — verifier throws, the proven module is not installed, an exception in
 * the completeness check — is a REJECTION, never a silent accept. No fallbacks.
 */
import {
  verifyBreakpointResult,
  hasSignatureFields,
} from "./proven-verification";

/**
 * The security-critical fields that MUST be inside the human-signed set for an
 * `approved` bit to be honored as a human approval (AC-48 / AC-2 completeness rule
 * applied to the legacy proven answer). An answer whose `signedFields` omits any of
 * these — or names one that is absent from the answer — is treated as UNSIGNED for
 * that field and rejected, even if the raw signature otherwise verifies.
 */
const REQUIRED_SIGNED_FIELDS = ["breakpointId", "approved", "responderId"] as const;

export interface SignedBreakpointEnforcementConfig {
  /** Whether a valid human signature is REQUIRED for this breakpoint answer. */
  signatureRequired: boolean;
  /** Directory of trusted public keys, forwarded to proven `verifyAnswer`. */
  trustedKeysDir?: string;
  /**
   * The set of trusted `human` root fingerprints (AC-35), sourced ONLY from the
   * integrity-protected, manifest-verified trust-roots config (never task.json). When
   * provided (non-undefined), the answer's raw signature MUST resolve to a fingerprint
   * in THIS set, else the answer is rejected — so a key an attacker drops into a run-dir
   * directory is not trusted even if the raw signature otherwise verifies (defect 2).
   * When `undefined`, no membership check is applied (legacy pure-decision callers /
   * unit tests that assert only the raw-verify + completeness behavior).
   */
  trustedHumanFingerprints?: string[];
}

export interface SignedBreakpointEnforcementDecision {
  /** True iff the answer may be committed (resolve the effect); false → reject. */
  accepted: boolean;
  /** Human-readable reason (always set when rejected; fail-closed diagnostics). */
  reason?: string;
  /** The resolved human fingerprint, on a verified accept (for attribution). */
  publicKeyFingerprint?: string;
}

/**
 * AC-48 completeness: every REQUIRED_SIGNED_FIELDS entry must appear in the answer's
 * `signedFields` AND be present on the answer object. Returns a deny-reason string, or
 * null when the answer's signed set is complete.
 */
function completenessDenyReason(answer: Record<string, unknown>): string | null {
  const signedFields = answer.signedFields;
  if (!Array.isArray(signedFields)) return "signedFields is not an array";
  const signed = new Set(signedFields.map((f) => String(f)));
  for (const field of REQUIRED_SIGNED_FIELDS) {
    if (!signed.has(field)) return `required field not signed: ${field}`;
    if (!(field in answer)) return `signed field absent from answer: ${field}`;
  }
  return null;
}

/**
 * Decide whether a breakpoint answer may be committed under the signed-breakpoint
 * enforcement policy. Fail-closed for every adversarial / error case when a signature
 * is required.
 */
export async function enforceSignedBreakpointAnswer(
  answer: Record<string, unknown>,
  config: SignedBreakpointEnforcementConfig,
): Promise<SignedBreakpointEnforcementDecision> {
  // Back-compat: no signature required → the answer is unaffected (accept).
  if (!config || config.signatureRequired !== true) {
    return { accepted: true };
  }

  try {
    // An unsigned answer (missing signature fields) can NEVER satisfy a signature
    // requirement — reject before touching the verifier (AC-28 spoofed approval).
    if (!hasSignatureFields(answer)) {
      return { accepted: false, reason: "signature required but answer is unsigned" };
    }

    // AC-48: the `approved`/identity/target fields MUST be inside the signed set, else
    // the `approved` bit is unsigned and must not be honored — reject.
    const completenessDeny = completenessDenyReason(answer);
    if (completenessDeny) {
      return { accepted: false, reason: `signed set incomplete: ${completenessDeny}` };
    }

    // Raw signature verification via the proven subsystem (optional dynamic import).
    // Any thrown exception / module-not-found is caught below → reject (fail closed).
    const verification = await verifyBreakpointResult(answer, {
      enabled: true,
      trustedKeysDir: config.trustedKeysDir,
    });

    if (!verification.verified) {
      return {
        accepted: false,
        reason: verification.reason ?? "signature verification failed",
      };
    }

    // AC-35 (defect 2): WHICH keys are trusted must come from the integrity-protected
    // trust-roots config, NOT from wherever proven happened to resolve a key. Even
    // though the raw signature verified, require the resolving fingerprint to be a
    // trusted `human` root — so a self-signed answer using a key the attacker dropped
    // into a run-dir directory is rejected.
    if (config.trustedHumanFingerprints !== undefined) {
      const resolvedFp = verification.verificationResult?.publicKeyFingerprint;
      if (typeof resolvedFp !== "string" || resolvedFp.length === 0) {
        return { accepted: false, reason: "signer fingerprint could not be resolved" };
      }
      if (!config.trustedHumanFingerprints.includes(resolvedFp)) {
        return {
          accepted: false,
          reason: `signer ${resolvedFp} is not a trusted human root`,
        };
      }
    }

    // The signature verified AND the security-critical fields were signed; only honor
    // an actual approval (a signed rejection never yields an accepted approval).
    if (answer.approved !== true) {
      return { accepted: false, reason: "answer is not an approval (approved !== true)" };
    }

    return {
      accepted: true,
      publicKeyFingerprint: verification.verificationResult?.publicKeyFingerprint,
    };
  } catch (err) {
    // Fail closed: never a pass-through on error.
    return {
      accepted: false,
      reason: `enforcement error: ${(err as Error)?.message ?? String(err)}`,
    };
  }
}
