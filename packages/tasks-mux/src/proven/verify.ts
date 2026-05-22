import { createPublicKey, verify as cryptoVerify } from "node:crypto";
import type { ProvenBreakpointAnswer, ProvenVerificationResult, BreakpointAnswer } from "../types.js";
import { loadTrustedPublicKeys } from "./keys.js";

/**
 * Rebuild the canonical signing payload for verification.
 */
function buildSigningPayload(answer: BreakpointAnswer, signedFields: string[]): Buffer {
  const parts: string[] = [];
  for (const field of signedFields) {
    const value = answer[field as keyof BreakpointAnswer];
    parts.push(`${field}=${value ?? ""}`);
  }
  return Buffer.from(parts.join("\n"), "utf-8");
}

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
    key: Buffer.from(matchingKey.publicKey, "base64"),
    format: "der",
    type: "spki",
  });

  const payload = buildSigningPayload(provenAnswer, provenAnswer.signedFields);
  const signatureBuffer = Buffer.from(provenAnswer.signature, "base64");

  const isValid = cryptoVerify(null, payload, publicKey, signatureBuffer);

  return {
    valid: isValid,
    publicKeyFingerprint: provenAnswer.publicKeyFingerprint,
    responderName: matchingKey.metadata.responderName,
    reason: isValid ? "Signature verified successfully" : "Signature verification failed",
    verifiedAt: new Date().toISOString(),
  };
}
