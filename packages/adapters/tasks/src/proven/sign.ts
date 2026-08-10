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
 * Build the LEGACY canonical signing payload from an answer.
 * Fields are sorted, null/undefined serialized as empty string.
 *
 * Retained for dual-read verification of signatures produced before AC-54
 * hardening. This form is ambiguous: a `\n` (or `=`) inside a field value can
 * shift the field/value boundary so two distinct assignments collide to the same
 * bytes. New signatures MUST use `buildHardenedSigningPayload`.
 */
export function buildLegacySigningPayload(
  answer: BreakpointAnswer,
  fields: readonly string[] = SIGNED_FIELDS,
): Buffer {
  const parts: string[] = [];
  for (const field of fields) {
    const value = answer[field as keyof BreakpointAnswer];
    parts.push(`${field}=${value ?? ""}`);
  }
  return Buffer.from(parts.join("\n"), "utf-8");
}

/**
 * Build the HARDENED canonical signing payload from an answer (AC-54).
 *
 * The legacy `field=value\n` concatenation is ambiguous under delimiter
 * injection: a value containing `\n` or `=` can be reinterpreted as another
 * `field=value` pair, so two distinct field assignments can collide to the same
 * signing bytes. This form removes the ambiguity with an unambiguous,
 * length-prefixed, type-tagged framing:
 *
 *   for each field, in the given order:
 *     <len(field)>:<field>=<tag>:<len(valueBytes)>:<valueBytes>;
 *
 * Because every field name and value is length-prefixed (its exact byte length
 * precedes it), no byte inside a value — including `\n`, `=`, `:`, or `;` — can
 * shift a boundary; the parse is driven entirely by the counted lengths, never
 * by scanning for a delimiter. A leading domain tag binds this to the proven
 * answer form. Distinct assignments therefore always produce distinct bytes.
 */
export function buildHardenedSigningPayload(
  answer: BreakpointAnswer,
  fields: readonly string[] = SIGNED_FIELDS,
): Buffer {
  const chunks: Buffer[] = [];
  // Domain tag so these bytes are non-transferable to any other length-prefixed form.
  chunks.push(Buffer.from("proven-answer-v1\n", "utf-8"));
  for (const field of fields) {
    const raw = answer[field as keyof BreakpointAnswer];
    // Preserve value TYPE distinctly so `false` (boolean) cannot collide with
    // "false" (string) or an absent field (empty string). null/undefined -> absent.
    let tag: string;
    let valueBytes: Buffer;
    if (raw === null || raw === undefined) {
      tag = "n"; // absent
      valueBytes = Buffer.alloc(0);
    } else if (typeof raw === "string") {
      tag = "s";
      valueBytes = Buffer.from(raw, "utf-8");
    } else if (typeof raw === "boolean") {
      tag = "b";
      valueBytes = Buffer.from(raw ? "1" : "0", "utf-8");
    } else if (typeof raw === "number") {
      tag = "d";
      valueBytes = Buffer.from(String(raw), "utf-8");
    } else {
      // Arrays/objects (e.g. references, followUpQuestions) are not in the
      // default SIGNED_FIELDS, but frame them deterministically if ever added.
      tag = "j";
      valueBytes = Buffer.from(JSON.stringify(raw), "utf-8");
    }
    const fieldBytes = Buffer.from(field, "utf-8");
    chunks.push(
      Buffer.from(`${fieldBytes.length}:`, "utf-8"),
      fieldBytes,
      Buffer.from(`=${tag}:${valueBytes.length}:`, "utf-8"),
      valueBytes,
      Buffer.from(";", "utf-8"),
    );
  }
  return Buffer.concat(chunks);
}

/**
 * Build the canonical signing payload for NEW signatures (hardened, AC-54).
 */
function buildSigningPayload(answer: BreakpointAnswer): Buffer {
  return buildHardenedSigningPayload(answer, SIGNED_FIELDS);
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
