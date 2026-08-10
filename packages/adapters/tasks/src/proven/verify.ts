import { createHash, createPublicKey, verify as cryptoVerify } from "node:crypto";
import type { ProvenBreakpointAnswer, ProvenVerificationResult } from "../types.js";
import { loadTrustedPublicKeys } from "./keys.js";
import { buildHardenedSigningPayload, buildLegacySigningPayload } from "./sign.js";

/**
 * Verify a proven breakpoint answer against trusted public keys.
 */
export async function verifyAnswer(
  provenAnswer: ProvenBreakpointAnswer,
  baseDir?: string,
): Promise<ProvenVerificationResult> {
  const trustedKeys = await loadTrustedPublicKeys(baseDir);
  const matchingKey = trustedKeys.find(
    (k) => k.metadata.fingerprint === provenAnswer.publicKeyFingerprint,
  );

  if (!matchingKey) {
    return {
      valid: false,
      publicKeyFingerprint: provenAnswer.publicKeyFingerprint,
      reason: "Public key not found in trusted keys",
      verifiedAt: new Date().toISOString(),
    };
  }

  // Bind the fingerprint to the key material BEFORE trusting the key. The stored
  // key is resolved by `metadata.fingerprint === publicKeyFingerprint`, but that
  // metadata field is attacker-influenceable — a malicious trusted-key record
  // could claim a victim's fingerprint while carrying attacker key material, or a
  // record's metadata could be desynced from its bytes. Recompute the fingerprint
  // as sha256(public-key DER) — the exact rule the key generator uses
  // (`keys.ts:18`) and that `verify-envelope-trusted.ts:252` enforces — and deny
  // unless it equals the claimed fingerprint. This is the signature check behind
  // bridgeProvenAnswer's human guarantee; fail closed on any mismatch.
  const publicKeyDer = Buffer.from(matchingKey.publicKey, "base64");
  const boundFingerprint = createHash("sha256").update(publicKeyDer).digest("hex");
  if (boundFingerprint !== provenAnswer.publicKeyFingerprint) {
    return {
      valid: false,
      publicKeyFingerprint: provenAnswer.publicKeyFingerprint,
      responderName: matchingKey.metadata.responderName,
      reason: "Public key fingerprint does not match key material (sha256(DER) mismatch)",
      verifiedAt: new Date().toISOString(),
    };
  }

  // Check key expiration
  if (matchingKey.metadata.expiresAt) {
    const expiresAt = new Date(matchingKey.metadata.expiresAt);
    const signedAt = new Date(provenAnswer.signedAt);
    if (signedAt > expiresAt) {
      return {
        valid: false,
        publicKeyFingerprint: provenAnswer.publicKeyFingerprint,
        responderName: matchingKey.metadata.responderName,
        reason: "Key was expired at time of signing",
        verifiedAt: new Date().toISOString(),
      };
    }
  }

  // Verify signature
  const publicKey = createPublicKey({
    key: publicKeyDer,
    format: "der",
    type: "spki",
  });

  const signatureBuffer = Buffer.from(provenAnswer.signature, "base64");

  // Dual-read (AC-54): accept the hardened canonical form (produced by the
  // current signer) OR the legacy `field=value\n` form (for signatures produced
  // before hardening). This is NOT a security fallback — both are exact,
  // cryptographically verified byte forms; a tampered answer matches neither.
  const hardenedPayload = buildHardenedSigningPayload(provenAnswer, provenAnswer.signedFields);
  const legacyPayload = buildLegacySigningPayload(provenAnswer, provenAnswer.signedFields);
  const isValid =
    cryptoVerify(null, hardenedPayload, publicKey, signatureBuffer) ||
    cryptoVerify(null, legacyPayload, publicKey, signatureBuffer);

  return {
    valid: isValid,
    publicKeyFingerprint: provenAnswer.publicKeyFingerprint,
    responderName: matchingKey.metadata.responderName,
    reason: isValid ? "Signature verified successfully" : "Signature verification failed",
    verifiedAt: new Date().toISOString(),
  };
}
