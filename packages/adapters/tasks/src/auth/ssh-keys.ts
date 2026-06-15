import { generateKeyPairSync, createHash } from "node:crypto";

import type { SSHKeyPair } from "./types.js";

// ── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_ALGORITHM = "ed25519";

// ── Key Generation ────────────────────────────────────────────────────────

/**
 * Generate an Ed25519 SSH key pair.
 */
export function generateSSHKeyPair(): SSHKeyPair {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const fingerprint = calculateFingerprint(publicKey);

  return {
    publicKey,
    privateKey,
    fingerprint,
    algorithm: DEFAULT_ALGORITHM,
    createdAt: new Date().toISOString(),
  };
}

// ── Key Parsing ───────────────────────────────────────────────────────────

/**
 * Parse a public key string and return its algorithm and fingerprint.
 */
export function parsePublicKey(key: string): { algorithm: string; fingerprint: string } {
  const fingerprint = calculateFingerprint(key);

  // Detect algorithm from key content
  let algorithm = "unknown";
  if (key.includes("ssh-ed25519") || key.includes("ED25519")) {
    algorithm = "ed25519";
  } else if (key.includes("ssh-rsa") || key.includes("RSA")) {
    algorithm = "rsa";
  } else if (key.includes("ecdsa") || key.includes("EC")) {
    algorithm = "ecdsa";
  }

  return { algorithm, fingerprint };
}

// ── Fingerprint ───────────────────────────────────────────────────────────

/**
 * Calculate the SHA256 fingerprint of a public key (base64 encoded).
 */
export function calculateFingerprint(publicKey: string): string {
  const hash = createHash("sha256").update(publicKey.trim()).digest("base64");
  return `SHA256:${hash}`;
}

// ── Formatting ────────────────────────────────────────────────────────────

/**
 * Format a public key as an authorized_keys entry with an optional comment.
 */
export function formatAuthorizedKey(publicKey: string, comment?: string): string {
  const trimmed = publicKey.trim();
  if (comment) {
    return `${trimmed} ${comment}`;
  }
  return trimmed;
}
