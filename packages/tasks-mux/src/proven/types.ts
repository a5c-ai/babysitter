// ── Proven-specific types ───────────────────────────────────────────────
// These types are used internally by the proven subsystem for key management.
// The ProvenBreakpointAnswer and ProvenVerificationResult schemas live in
// src/types.ts as they are part of the public domain model.

export interface KeyPairMetadata {
  /** Hex-encoded fingerprint (SHA-256 of public key DER). */
  fingerprint: string;
  /** Responder identity associated with this key. */
  responderId: string;
  responderName: string;
  /** ISO timestamp of key creation. */
  createdAt: string;
  /** ISO timestamp when this key should no longer be used for signing. */
  expiresAt?: string;
  /** Human-readable note. */
  note?: string;
}

export interface PublicKeyRecord {
  /** Base64-encoded Ed25519 public key (DER/SPKI format). */
  publicKey: string;
  metadata: KeyPairMetadata;
}

export interface PrivateKeyRecord {
  /** Base64-encoded Ed25519 private key (PKCS8 format). */
  privateKey: string;
  /** Fingerprint linking to the corresponding public key. */
  fingerprint: string;
  responderId: string;
}
