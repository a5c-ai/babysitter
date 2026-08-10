/**
 * signing.ts — ADR-B2: "use node:crypto's native Ed25519 (generateKeyPairSync/sign/verify), zero
 * new dependency, matching packages/trust-core/src/signing.ts's existing pattern exactly."
 *
 * This module is the REAL cryptographic path: it is exercised end-to-end whenever kip mints and
 * ingests its own facts (`assertFact`/`retractFact` sign with a repo-held keypair, and
 * `KeyRegistry.verify` below checks the signature against that SAME keypair's real public key —
 * see src/__tests__/m0-signing.test.ts).
 *
 * `Provenance.publicKeyFingerprint` (docs/21 §5.1: "SHA-256 of pubkey DER") is a ONE-WAY hash of
 * the public key, never the key material itself, so verifying an externally-supplied `Fact` needs
 * a registry mapping fingerprint -> public key. `KeyRegistry` is that registry, scoped per
 * `KipRepo` instance; ingest()'s handling of a fingerprint that ISN'T in the registry (a key this
 * replica has genuinely never seen) is documented at its one call site in index.ts and flagged in
 * this task's `disputes` output — the current `Fact`/`Provenance` wire shape has no field carrying
 * the raw public key, so a never-before-seen key's signature cannot be verified by real asymmetric
 * math without one.
 */
import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify, type KeyObject } from "node:crypto";

export interface Ed25519KeyPair {
  publicKey: KeyObject;
  privateKey: KeyObject;
  /** SHA-256 hex digest of the public key's SPKI DER encoding (docs/21 §5.1). */
  fingerprint: string;
}

export function fingerprintOf(publicKey: KeyObject): string {
  const der = publicKey.export({ type: "spki", format: "der" }) as Buffer;
  return createHash("sha256").update(der).digest("hex");
}

export function generateEd25519KeyPair(): Ed25519KeyPair {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return { publicKey, privateKey, fingerprint: fingerprintOf(publicKey) };
}

/** Import a keypair from PEM strings (e.g. an `OpenOptions.keyring` supplying real key material). */
export function importEd25519KeyPair(privateKeyPem: string, publicKeyPem?: string): Ed25519KeyPair {
  const privateKey = createPrivateKey(privateKeyPem);
  const publicKey = publicKeyPem ? createPublicKey(publicKeyPem) : createPublicKey(privateKey);
  return { publicKey, privateKey, fingerprint: fingerprintOf(publicKey) };
}

/**
 * Import a bare PUBLIC key (no private half) from a PEM string — this round's finding #1: wiring
 * `OpenOptions.genesis.rootKeys`/`manifest.rootKeys` (genesis-declared trusted peer keys, which
 * this replica never holds the private half of) into `KeyRegistry` on `open()`, so genesis-
 * declared trust actually enables real-crypto verification of matching-fingerprint facts instead
 * of silently doing nothing.
 */
export function importEd25519PublicKey(publicKeyPem: string): { publicKey: KeyObject; fingerprint: string } {
  const publicKey = createPublicKey(publicKeyPem);
  return { publicKey, fingerprint: fingerprintOf(publicKey) };
}

/** Real Ed25519 sign over UTF-8 `payload` bytes, base64-encoded (`Ed25519Sig`'s declared shape). */
export function signPayload(privateKey: KeyObject, payload: string): string {
  return sign(null, Buffer.from(payload, "utf8"), privateKey).toString("base64");
}

/** Real Ed25519 verify; never throws — a malformed base64/signature is simply `false`. */
export function verifyPayload(publicKey: KeyObject, payload: string, signatureB64: string): boolean {
  try {
    return verify(null, Buffer.from(payload, "utf8"), publicKey, Buffer.from(signatureB64, "base64"));
  } catch {
    return false;
  }
}

/**
 * A per-repo `fingerprint -> publicKey` registry (see file header re: the never-seen-key gap).
 * Deliberately exposes only `register`/`get` (a former dead `has(fingerprint)` method — this
 * round's finding #8 — was removed: every call site already needs the `KeyObject` itself, not just
 * a boolean, so `get(...) !== undefined` fully subsumes it with no loss of capability).
 */
export class KeyRegistry {
  private readonly byFingerprint = new Map<string, KeyObject>();

  register(fingerprint: string, publicKey: KeyObject): void {
    this.byFingerprint.set(fingerprint, publicKey);
  }

  get(fingerprint: string): KeyObject | undefined {
    return this.byFingerprint.get(fingerprint);
  }
}
