import { createPrivateKey, sign as cryptoSign } from "node:crypto";
import type { BreakpointAnswer, ProvenBreakpointAnswer } from "../types.js";
import { loadPrivateKey } from "./keys.js";
import type { PrivateKeyRecord } from "./types.js";

/**
 * Fields included in the signature. The order is canonical.
 */
const SIGNED_FIELDS = [
  "id",
  "breakpointId",
  "responderId",
  "text",
  "approved",
  "confidence",
  "answeredAt",
] as const;

/**
 * Build the canonical signing payload from an answer.
 * Fields are sorted, null/undefined serialized as empty string.
 */
function buildSigningPayload(answer: BreakpointAnswer): Buffer {
  const parts: string[] = [];
  for (const field of SIGNED_FIELDS) {
    const value = answer[field as keyof BreakpointAnswer];
    parts.push(`${field}=${value ?? ""}`);
  }
  return Buffer.from(parts.join("\n"), "utf-8");
}

/**
 * Sign a BreakpointAnswer with the responder's private key.
 *
 * Returns a ProvenBreakpointAnswer with the signature and key metadata.
 */
export async function signAnswer(
  answer: BreakpointAnswer,
  fingerprint: string,
  baseDir?: string,
): Promise<ProvenBreakpointAnswer> {
  const keyRecord = await loadPrivateKey(fingerprint, baseDir);
  if (!keyRecord) {
    throw new Error(`Private key not found for fingerprint: ${fingerprint}`);
  }

  return signAnswerWithKeyRecord(answer, keyRecord);
}

/**
 * Sign a BreakpointAnswer using an already-loaded PrivateKeyRecord.
 *
 * This avoids requiring the key to be persisted on disk and is useful
 * for backends that load the key from a configured path.
 */
export function signAnswerWithKeyRecord(
  answer: BreakpointAnswer,
  keyRecord: PrivateKeyRecord,
): ProvenBreakpointAnswer {
  const privateKey = createPrivateKey({
    key: Buffer.from(keyRecord.privateKey, "base64"),
    format: "der",
    type: "pkcs8",
  });

  const payload = buildSigningPayload(answer);
  const signature = cryptoSign(null, payload, privateKey);

  return {
    ...answer,
    signature: signature.toString("base64"),
    publicKeyFingerprint: keyRecord.fingerprint,
    signedAt: new Date().toISOString(),
    signedFields: [...SIGNED_FIELDS],
  };
}
