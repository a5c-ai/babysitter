/**
 * Optional integration with @a5c-ai/tasks-adapter proven subsystem.
 *
 * Provides cryptographic verification of breakpoint answers when the
 * adapters-tasks package is available as an optional peer dependency.
 * Never throws -- always returns a graceful result.
 */

/**
 * Configuration for breakpoint answer verification.
 */
export interface BreakpointVerificationConfig {
  /** Whether verification is enabled. When false, verification is skipped. */
  enabled: boolean;
  /** Directory containing trusted public keys. Passed to adapters-tasks verifyAnswer. */
  trustedKeysDir?: string;
}

/**
 * Result of a breakpoint answer verification attempt.
 */
export interface BreakpointVerificationResult {
  /** Whether the answer was successfully verified as authentic. */
  verified: boolean;
  /** Detailed verification result from adapters-tasks (when available). */
  verificationResult?: {
    valid: boolean;
    publicKeyFingerprint?: string;
    responderName?: string;
    reason?: string;
    verifiedAt: string;
  };
  /** Reason verification was skipped or failed (when verified is false). */
  reason?: string;
}

/**
 * Signature fields expected on a proven breakpoint result.
 * If all four are present, the result is considered signed.
 */
const SIGNATURE_FIELDS = [
  "signature",
  "publicKeyFingerprint",
  "signedAt",
  "signedFields",
] as const;

/**
 * Check whether a breakpoint result carries signature fields,
 * indicating it was cryptographically signed via the proven subsystem.
 */
export function hasSignatureFields(result: Record<string, unknown>): boolean {
  return SIGNATURE_FIELDS.every(
    (field) => result[field] !== undefined && result[field] !== null
  );
}

/**
 * Verify a breakpoint result's cryptographic signature using the
 * adapters-tasks proven subsystem.
 *
 * This function never throws. If adapters-tasks is not installed,
 * verification is disabled, or the result is unsigned, it returns
 * a graceful { verified: false } result with an explanatory reason.
 *
 * @param result - The breakpoint result (may or may not contain signature fields).
 * @param config - Verification configuration. If omitted, defaults to { enabled: true }.
 */
export async function verifyBreakpointResult(
  result: Record<string, unknown>,
  config?: BreakpointVerificationConfig,
): Promise<BreakpointVerificationResult> {
  const effectiveConfig = config ?? { enabled: true };

  // Short-circuit if verification is disabled
  if (!effectiveConfig.enabled) {
    return { verified: false, reason: "verification disabled" };
  }

  // Short-circuit if result does not carry signature fields
  if (!hasSignatureFields(result)) {
    return { verified: false, reason: "result is not signed" };
  }

  // Attempt to dynamically import adapters-tasks proven subsystem.
  // The module is an optional peer dependency -- the import may fail at runtime.
  // We use a string variable to prevent TypeScript from statically resolving the import.
  try {
    const modulePath = "@a5c-ai/tasks-adapter/proven";
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const proven = await import(/* webpackIgnore: true */ modulePath) as {
      verifyAnswer?: (
        provenAnswer: Record<string, unknown>,
        baseDir?: string,
      ) => Promise<{
        valid: boolean;
        publicKeyFingerprint?: string;
        responderName?: string;
        reason?: string;
        verifiedAt: string;
      }>;
    };
    const { verifyAnswer } = proven;

    if (typeof verifyAnswer !== "function") {
      return {
        verified: false,
        reason: "adapters-tasks/proven does not export verifyAnswer",
      };
    }

    const verificationResult = await verifyAnswer(
      result,
      effectiveConfig.trustedKeysDir,
    );

    return {
      verified: verificationResult.valid === true,
      verificationResult,
    };
  } catch (err: unknown) {
    // Dynamic import failed -- adapters-tasks is not installed or broken
    const message =
      err instanceof Error ? err.message : String(err);

    if (
      message.includes("Cannot find module") ||
      message.includes("MODULE_NOT_FOUND") ||
      message.includes("ERR_MODULE_NOT_FOUND") ||
      message.includes("Could not resolve")
    ) {
      return {
        verified: false,
        reason: "tasks-adapter not installed",
      };
    }

    return {
      verified: false,
      reason: `verification failed: ${message}`,
    };
  }
}
