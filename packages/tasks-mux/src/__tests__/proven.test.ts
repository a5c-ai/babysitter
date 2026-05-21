import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";
import type {
  BreakpointAnswer,
  ProvenBreakpointAnswer,
  ProvenVerificationResult,
} from "../types.js";
import {
  BreakpointAnswerSchema,
  ProvenBreakpointAnswerSchema,
  ProvenVerificationResultSchema,
  BREAKPOINTS_KEYS_DIR,
  BREAKPOINTS_TRUSTED_KEYS_DIR,
  BREAKPOINTS_PRIVATE_KEYS_DIR,
} from "../types.js";
import {
  generateKeyPair,
  saveTrustedPublicKey,
  savePrivateKey,
  loadTrustedPublicKeys,
  loadPrivateKey,
  rotateKey,
} from "../proven/keys.js";
import type {
  PublicKeyRecord,
  PrivateKeyRecord,
  KeyPairMetadata,
} from "../proven/keys.js";
import { signAnswer } from "../proven/sign.js";
import { verifyAnswer } from "../proven/verify.js";

// ────────────────────────────────────────────────────────────────────────────
// Test Factories
// ────────────────────────────────────────────────────────────────────────────

const NOW = "2026-04-21T10:00:00.000Z";

function makeAnswer(overrides: Partial<BreakpointAnswer> = {}): BreakpointAnswer {
  return {
    id: "answer-001",
    breakpointId: "bp-001",
    responderId: "tal",
    responderName: "Tal M",
    text: "Yes, use connection pooling with ioredis.",
    approved: true,
    confidence: 90,
    references: ["https://github.com/redis/ioredis#cluster"],
    followUpQuestions: [],
    answeredAt: NOW,
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

let tmpDir: string;

async function createTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "proven-test-"));
}

async function cleanupTmpDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("Proven Breakpoints (Cryptographic Signing)", () => {
  beforeEach(async () => {
    tmpDir = await createTmpDir();
  });

  afterEach(async () => {
    await cleanupTmpDir(tmpDir);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 1: Key Management (src/proven/keys.ts)
  // ──────────────────────────────────────────────────────────────────────────

  describe("Key Management", () => {
    describe("generateKeyPair()", () => {
      it("returns publicKeyRecord and privateKeyRecord", () => {
        const result = generateKeyPair("tal", "Tal M");

        expect(result).toHaveProperty("publicKeyRecord");
        expect(result).toHaveProperty("privateKeyRecord");
      });

      it("publicKeyRecord contains base64-encoded public key", () => {
        const { publicKeyRecord } = generateKeyPair("tal", "Tal M");

        expect(typeof publicKeyRecord.publicKey).toBe("string");
        // Verify it's valid base64 by decoding it
        const decoded = Buffer.from(publicKeyRecord.publicKey, "base64");
        expect(decoded.length).toBeGreaterThan(0);
      });

      it("privateKeyRecord contains base64-encoded private key", () => {
        const { privateKeyRecord } = generateKeyPair("tal", "Tal M");

        expect(typeof privateKeyRecord.privateKey).toBe("string");
        const decoded = Buffer.from(privateKeyRecord.privateKey, "base64");
        expect(decoded.length).toBeGreaterThan(0);
      });

      it("generates Ed25519 keys that can be loaded as crypto KeyObjects", () => {
        const { publicKeyRecord, privateKeyRecord } = generateKeyPair("tal", "Tal M");

        // The public key should be importable as Ed25519 SPKI
        const pubKey = crypto.createPublicKey({
          key: Buffer.from(publicKeyRecord.publicKey, "base64"),
          format: "der",
          type: "spki",
        });
        expect(pubKey.type).toBe("public");
        expect(pubKey.asymmetricKeyType).toBe("ed25519");

        // The private key should be importable as Ed25519 PKCS8
        const privKey = crypto.createPrivateKey({
          key: Buffer.from(privateKeyRecord.privateKey, "base64"),
          format: "der",
          type: "pkcs8",
        });
        expect(privKey.type).toBe("private");
        expect(privKey.asymmetricKeyType).toBe("ed25519");
      });

      it("metadata includes fingerprint as hex SHA-256 of public key DER", () => {
        const { publicKeyRecord } = generateKeyPair("tal", "Tal M");
        const { fingerprint } = publicKeyRecord.metadata;

        // Fingerprint should be a hex string (64 chars for SHA-256)
        expect(fingerprint).toMatch(/^[0-9a-f]{64}$/);

        // Verify it matches SHA-256 of the public key DER bytes
        const pubDer = Buffer.from(publicKeyRecord.publicKey, "base64");
        const expectedFingerprint = crypto.createHash("sha256").update(pubDer).digest("hex");
        expect(fingerprint).toBe(expectedFingerprint);
      });

      it("metadata includes responderId and responderName", () => {
        const { publicKeyRecord } = generateKeyPair("tal", "Tal M");

        expect(publicKeyRecord.metadata.responderId).toBe("tal");
        expect(publicKeyRecord.metadata.responderName).toBe("Tal M");
      });

      it("metadata includes createdAt as ISO datetime", () => {
        const { publicKeyRecord } = generateKeyPair("tal", "Tal M");

        expect(() => new Date(publicKeyRecord.metadata.createdAt)).not.toThrow();
        // Should be a recent timestamp
        const createdAt = new Date(publicKeyRecord.metadata.createdAt);
        const now = new Date();
        expect(now.getTime() - createdAt.getTime()).toBeLessThan(5_000);
      });

      it("fingerprint on privateKeyRecord matches publicKeyRecord", () => {
        const { publicKeyRecord, privateKeyRecord } = generateKeyPair("tal", "Tal M");

        expect(privateKeyRecord.fingerprint).toBe(publicKeyRecord.metadata.fingerprint);
      });

      it("privateKeyRecord includes responderId", () => {
        const { privateKeyRecord } = generateKeyPair("tal", "Tal M");

        expect(privateKeyRecord.responderId).toBe("tal");
      });

      it("generates unique key pairs on each call", () => {
        const pair1 = generateKeyPair("tal", "Tal M");
        const pair2 = generateKeyPair("tal", "Tal M");

        expect(pair1.publicKeyRecord.metadata.fingerprint)
          .not.toBe(pair2.publicKeyRecord.metadata.fingerprint);
        expect(pair1.publicKeyRecord.publicKey)
          .not.toBe(pair2.publicKeyRecord.publicKey);
        expect(pair1.privateKeyRecord.privateKey)
          .not.toBe(pair2.privateKeyRecord.privateKey);
      });
    });

    describe("saveTrustedPublicKey() and loadTrustedPublicKeys()", () => {
      it("saves a public key file to the trusted directory", async () => {
        const { publicKeyRecord } = generateKeyPair("tal", "Tal M");

        const filePath = await saveTrustedPublicKey(publicKeyRecord, tmpDir);

        expect(filePath).toContain(path.join(".keys", "trusted"));
        expect(filePath).toContain(`${publicKeyRecord.metadata.fingerprint}.pub.json`);

        // Verify file exists
        const stat = await fs.stat(filePath);
        expect(stat.isFile()).toBe(true);
      });

      it("saved public key file is valid JSON matching the record", async () => {
        const { publicKeyRecord } = generateKeyPair("tal", "Tal M");

        const filePath = await saveTrustedPublicKey(publicKeyRecord, tmpDir);
        const raw = await fs.readFile(filePath, "utf-8");
        const parsed = JSON.parse(raw);

        expect(parsed.publicKey).toBe(publicKeyRecord.publicKey);
        expect(parsed.metadata.fingerprint).toBe(publicKeyRecord.metadata.fingerprint);
        expect(parsed.metadata.responderId).toBe(publicKeyRecord.metadata.responderId);
        expect(parsed.metadata.responderName).toBe(publicKeyRecord.metadata.responderName);
      });

      it("loadTrustedPublicKeys() loads all saved public keys", async () => {
        const pair1 = generateKeyPair("tal", "Tal M");
        const pair2 = generateKeyPair("alice", "Alice W");

        await saveTrustedPublicKey(pair1.publicKeyRecord, tmpDir);
        await saveTrustedPublicKey(pair2.publicKeyRecord, tmpDir);

        const loaded = await loadTrustedPublicKeys(tmpDir);

        expect(loaded).toHaveLength(2);
        const fingerprints = loaded.map((k) => k.metadata.fingerprint).sort();
        const expected = [
          pair1.publicKeyRecord.metadata.fingerprint,
          pair2.publicKeyRecord.metadata.fingerprint,
        ].sort();
        expect(fingerprints).toEqual(expected);
      });

      it("loadTrustedPublicKeys() returns empty array when directory does not exist", async () => {
        const nonExistentDir = path.join(tmpDir, "nonexistent");
        const loaded = await loadTrustedPublicKeys(nonExistentDir);

        expect(loaded).toEqual([]);
      });

      it("loadTrustedPublicKeys() ignores non-.pub.json files", async () => {
        const { publicKeyRecord } = generateKeyPair("tal", "Tal M");
        await saveTrustedPublicKey(publicKeyRecord, tmpDir);

        // Write a non-.pub.json file into the trusted directory
        const trustedDir = path.join(tmpDir, ".keys", "trusted");
        await fs.writeFile(
          path.join(trustedDir, "readme.txt"),
          "This should be ignored",
          "utf-8",
        );

        const loaded = await loadTrustedPublicKeys(tmpDir);
        expect(loaded).toHaveLength(1);
      });

      it("creates the trusted directory structure recursively", async () => {
        const deepDir = path.join(tmpDir, "deep", "nested", "repo");
        const { publicKeyRecord } = generateKeyPair("tal", "Tal M");

        const filePath = await saveTrustedPublicKey(publicKeyRecord, deepDir);

        const stat = await fs.stat(filePath);
        expect(stat.isFile()).toBe(true);
      });
    });

    describe("savePrivateKey() and loadPrivateKey()", () => {
      it("saves a private key file to the private directory", async () => {
        const { privateKeyRecord } = generateKeyPair("tal", "Tal M");

        const filePath = await savePrivateKey(privateKeyRecord, tmpDir);

        expect(filePath).toContain(path.join(".keys", "private"));
        expect(filePath).toContain(`${privateKeyRecord.fingerprint}.key.json`);

        const stat = await fs.stat(filePath);
        expect(stat.isFile()).toBe(true);
      });

      it("saved private key file is valid JSON matching the record", async () => {
        const { privateKeyRecord } = generateKeyPair("tal", "Tal M");

        const filePath = await savePrivateKey(privateKeyRecord, tmpDir);
        const raw = await fs.readFile(filePath, "utf-8");
        const parsed = JSON.parse(raw);

        expect(parsed.privateKey).toBe(privateKeyRecord.privateKey);
        expect(parsed.fingerprint).toBe(privateKeyRecord.fingerprint);
        expect(parsed.responderId).toBe(privateKeyRecord.responderId);
      });

      it("loadPrivateKey() loads a saved private key by fingerprint", async () => {
        const { privateKeyRecord } = generateKeyPair("tal", "Tal M");
        await savePrivateKey(privateKeyRecord, tmpDir);

        const loaded = await loadPrivateKey(privateKeyRecord.fingerprint, tmpDir);

        expect(loaded).not.toBeNull();
        expect(loaded!.privateKey).toBe(privateKeyRecord.privateKey);
        expect(loaded!.fingerprint).toBe(privateKeyRecord.fingerprint);
        expect(loaded!.responderId).toBe(privateKeyRecord.responderId);
      });

      it("loadPrivateKey() returns null for unknown fingerprint", async () => {
        const loaded = await loadPrivateKey("nonexistent-fingerprint", tmpDir);

        expect(loaded).toBeNull();
      });

      it("creates the private directory structure recursively", async () => {
        const deepDir = path.join(tmpDir, "deep", "nested", "repo");
        const { privateKeyRecord } = generateKeyPair("tal", "Tal M");

        const filePath = await savePrivateKey(privateKeyRecord, deepDir);

        const stat = await fs.stat(filePath);
        expect(stat.isFile()).toBe(true);
      });
    });

    describe("Key storage paths", () => {
      it("BREAKPOINTS_KEYS_DIR constant is .breakpoints/.keys", () => {
        expect(BREAKPOINTS_KEYS_DIR).toBe(".breakpoints/.keys");
      });

      it("BREAKPOINTS_TRUSTED_KEYS_DIR constant is .breakpoints/.keys/trusted", () => {
        expect(BREAKPOINTS_TRUSTED_KEYS_DIR).toBe(".breakpoints/.keys/trusted");
      });

      it("BREAKPOINTS_PRIVATE_KEYS_DIR constant is .breakpoints/.keys/private", () => {
        expect(BREAKPOINTS_PRIVATE_KEYS_DIR).toBe(".breakpoints/.keys/private");
      });

      it("trusted keys are stored as <fingerprint>.pub.json", async () => {
        const { publicKeyRecord } = generateKeyPair("tal", "Tal M");
        const filePath = await saveTrustedPublicKey(publicKeyRecord, tmpDir);

        const basename = path.basename(filePath);
        expect(basename).toBe(`${publicKeyRecord.metadata.fingerprint}.pub.json`);
      });

      it("private keys are stored as <fingerprint>.key.json", async () => {
        const { privateKeyRecord } = generateKeyPair("tal", "Tal M");
        const filePath = await savePrivateKey(privateKeyRecord, tmpDir);

        const basename = path.basename(filePath);
        expect(basename).toBe(`${privateKeyRecord.fingerprint}.key.json`);
      });
    });

    describe("rotateKey()", () => {
      it("generates a new key pair for the same responder", async () => {
        // Set up initial key pair
        const initial = generateKeyPair("tal", "Tal M");
        await saveTrustedPublicKey(initial.publicKeyRecord, tmpDir);
        await savePrivateKey(initial.privateKeyRecord, tmpDir);

        const newPair = await rotateKey(
          "tal",
          "Tal M",
          initial.publicKeyRecord.metadata.fingerprint,
          tmpDir,
        );

        expect(newPair.publicKeyRecord.metadata.responderId).toBe("tal");
        expect(newPair.publicKeyRecord.metadata.responderName).toBe("Tal M");
        expect(newPair.publicKeyRecord.metadata.fingerprint)
          .not.toBe(initial.publicKeyRecord.metadata.fingerprint);
      });

      it("marks old public key as expired with expiresAt", async () => {
        const initial = generateKeyPair("tal", "Tal M");
        await saveTrustedPublicKey(initial.publicKeyRecord, tmpDir);
        await savePrivateKey(initial.privateKeyRecord, tmpDir);

        await rotateKey(
          "tal",
          "Tal M",
          initial.publicKeyRecord.metadata.fingerprint,
          tmpDir,
        );

        // Re-read the old key file
        const trustedDir = path.join(tmpDir, ".keys", "trusted");
        const oldKeyPath = path.join(
          trustedDir,
          `${initial.publicKeyRecord.metadata.fingerprint}.pub.json`,
        );
        const raw = await fs.readFile(oldKeyPath, "utf-8");
        const oldKey = JSON.parse(raw) as PublicKeyRecord;

        expect(oldKey.metadata.expiresAt).toBeDefined();
        expect(typeof oldKey.metadata.expiresAt).toBe("string");
      });

      it("saves both new public and private keys", async () => {
        const initial = generateKeyPair("tal", "Tal M");
        await saveTrustedPublicKey(initial.publicKeyRecord, tmpDir);
        await savePrivateKey(initial.privateKeyRecord, tmpDir);

        const newPair = await rotateKey(
          "tal",
          "Tal M",
          initial.publicKeyRecord.metadata.fingerprint,
          tmpDir,
        );

        // Verify new public key is in trusted directory
        const trustedKeys = await loadTrustedPublicKeys(tmpDir);
        const newKeyInTrusted = trustedKeys.find(
          (k) => k.metadata.fingerprint === newPair.publicKeyRecord.metadata.fingerprint,
        );
        expect(newKeyInTrusted).toBeDefined();

        // Verify new private key is loadable
        const loadedPrivate = await loadPrivateKey(
          newPair.privateKeyRecord.fingerprint,
          tmpDir,
        );
        expect(loadedPrivate).not.toBeNull();
      });

      it("handles rotation when old key does not exist", async () => {
        // rotateKey should not throw when old key file is missing
        const newPair = await rotateKey(
          "tal",
          "Tal M",
          "nonexistent-fingerprint",
          tmpDir,
        );

        expect(newPair.publicKeyRecord.metadata.responderId).toBe("tal");
        expect(newPair.privateKeyRecord.responderId).toBe("tal");
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 2: Signing (src/proven/sign.ts)
  // ──────────────────────────────────────────────────────────────────────────

  describe("Signing", () => {
    describe("signAnswer()", () => {
      it("returns a ProvenBreakpointAnswer with all original answer fields", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        // All original fields should be preserved
        expect(proven.id).toBe(answer.id);
        expect(proven.breakpointId).toBe(answer.breakpointId);
        expect(proven.responderId).toBe(answer.responderId);
        expect(proven.responderName).toBe(answer.responderName);
        expect(proven.text).toBe(answer.text);
        expect(proven.approved).toBe(answer.approved);
        expect(proven.confidence).toBe(answer.confidence);
        expect(proven.references).toEqual(answer.references);
        expect(proven.followUpQuestions).toEqual(answer.followUpQuestions);
        expect(proven.answeredAt).toBe(answer.answeredAt);
      });

      it("signature is a base64-encoded string", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        expect(typeof proven.signature).toBe("string");
        expect(proven.signature.length).toBeGreaterThan(0);
        // Should be valid base64
        const decoded = Buffer.from(proven.signature, "base64");
        expect(decoded.length).toBeGreaterThan(0);
      });

      it("publicKeyFingerprint matches the key fingerprint used for signing", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        expect(proven.publicKeyFingerprint).toBe(pair.privateKeyRecord.fingerprint);
        expect(proven.publicKeyFingerprint).toBe(pair.publicKeyRecord.metadata.fingerprint);
      });

      it("signedAt is set to a valid ISO datetime", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        expect(typeof proven.signedAt).toBe("string");
        const signedDate = new Date(proven.signedAt);
        expect(signedDate.getTime()).not.toBeNaN();
        // Should be recent
        const now = new Date();
        expect(now.getTime() - signedDate.getTime()).toBeLessThan(5_000);
      });

      it("signedFields lists the canonical fields that were signed", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        expect(Array.isArray(proven.signedFields)).toBe(true);
        expect(proven.signedFields.length).toBeGreaterThan(0);

        // Per spec section 6.2, SIGNED_FIELDS includes these canonical fields:
        const expectedSignedFields = [
          "id",
          "breakpointId",
          "responderId",
          "text",
          "approved",
          "confidence",
          "answeredAt",
        ];
        expect(proven.signedFields).toEqual(expectedSignedFields);
      });

      it("result validates against ProvenBreakpointAnswerSchema", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        const parseResult = ProvenBreakpointAnswerSchema.safeParse(proven);
        expect(parseResult.success).toBe(true);
      });

      it("throws when private key not found for fingerprint", async () => {
        const answer = makeAnswer();

        await expect(
          signAnswer(answer, "nonexistent-fingerprint", tmpDir),
        ).rejects.toThrow(/private key not found/i);
      });

      it("produces different signatures for different answers", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer1 = makeAnswer({ id: "answer-001", text: "Use pooling" });
        const answer2 = makeAnswer({ id: "answer-002", text: "Do not use pooling" });

        const proven1 = await signAnswer(
          answer1,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );
        const proven2 = await signAnswer(
          answer2,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        expect(proven1.signature).not.toBe(proven2.signature);
      });

      it("produces the same signature for the same answer content signed with the same key", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();

        // Ed25519 signatures are deterministic for the same key+message
        const proven1 = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );
        const proven2 = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        expect(proven1.signature).toBe(proven2.signature);
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 3: Verification (src/proven/verify.ts)
  // ──────────────────────────────────────────────────────────────────────────

  describe("Verification", () => {
    describe("verifyAnswer()", () => {
      it("returns valid: true for a correctly signed answer with trusted key", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        const result = await verifyAnswer(proven, tmpDir);

        expect(result.valid).toBe(true);
      });

      it("returns publicKeyFingerprint in verification result", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        const result = await verifyAnswer(proven, tmpDir);

        expect(result.publicKeyFingerprint).toBe(pair.publicKeyRecord.metadata.fingerprint);
      });

      it("returns responderName in verification result for trusted key", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        const result = await verifyAnswer(proven, tmpDir);

        expect(result.responderName).toBe("Tal M");
      });

      it("returns verifiedAt as a valid ISO datetime", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        const result = await verifyAnswer(proven, tmpDir);

        expect(typeof result.verifiedAt).toBe("string");
        const verifiedDate = new Date(result.verifiedAt);
        expect(verifiedDate.getTime()).not.toBeNaN();
        const now = new Date();
        expect(now.getTime() - verifiedDate.getTime()).toBeLessThan(5_000);
      });

      it("result validates against ProvenVerificationResultSchema", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        const result = await verifyAnswer(proven, tmpDir);
        const parseResult = ProvenVerificationResultSchema.safeParse(result);
        expect(parseResult.success).toBe(true);
      });

      it("returns valid: false with reason for unknown public key", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        // Only save the private key, NOT the public key
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        const result = await verifyAnswer(proven, tmpDir);

        expect(result.valid).toBe(false);
        expect(result.reason).toBeDefined();
        expect(typeof result.reason).toBe("string");
        // Reason should indicate the key is not trusted/found
        expect(result.reason!.toLowerCase()).toMatch(/not found|unknown|untrusted/);
      });

      it("returns valid: false for tampered answer text", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        // Tamper with the answer text after signing
        const tampered: ProvenBreakpointAnswer = {
          ...proven,
          text: "TAMPERED: Actually, don't use connection pooling.",
        };

        const result = await verifyAnswer(tampered, tmpDir);

        expect(result.valid).toBe(false);
        expect(result.reason).toBeDefined();
        expect(result.reason!.toLowerCase()).toMatch(/signature|invalid|fail/);
      });

      it("returns valid: false for tampered confidence value", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer({ confidence: 90 });
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        // Tamper with a signed field
        const tampered: ProvenBreakpointAnswer = {
          ...proven,
          confidence: 10,
        };

        const result = await verifyAnswer(tampered, tmpDir);

        expect(result.valid).toBe(false);
      });

      it("returns valid: false for tampered approved value", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer({ approved: true });
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        // Flip the approved field
        const tampered: ProvenBreakpointAnswer = {
          ...proven,
          approved: false,
        };

        const result = await verifyAnswer(tampered, tmpDir);

        expect(result.valid).toBe(false);
      });

      it("returns valid: false for tampered responderId", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        const tampered: ProvenBreakpointAnswer = {
          ...proven,
          responderId: "mallory",
        };

        const result = await verifyAnswer(tampered, tmpDir);

        expect(result.valid).toBe(false);
      });

      it("returns valid: false for completely forged signature", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        // Replace signature with garbage
        const forged: ProvenBreakpointAnswer = {
          ...proven,
          signature: Buffer.from("this-is-a-forged-signature").toString("base64"),
        };

        const result = await verifyAnswer(forged, tmpDir);

        expect(result.valid).toBe(false);
      });

      it("detects expired key at time of signing", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        // Mark the key as expired in the past
        const expiredPublicKey: PublicKeyRecord = {
          ...pair.publicKeyRecord,
          metadata: {
            ...pair.publicKeyRecord.metadata,
            expiresAt: "2020-01-01T00:00:00.000Z",
          },
        };
        await saveTrustedPublicKey(expiredPublicKey, tmpDir);
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        const result = await verifyAnswer(proven, tmpDir);

        expect(result.valid).toBe(false);
        expect(result.reason).toBeDefined();
        expect(result.reason!.toLowerCase()).toMatch(/expir/);
      });

      it("returns verification result including valid: false schema for unknown key", async () => {
        const pair = generateKeyPair("tal", "Tal M");
        await savePrivateKey(pair.privateKeyRecord, tmpDir);

        const answer = makeAnswer();
        const proven = await signAnswer(
          answer,
          pair.privateKeyRecord.fingerprint,
          tmpDir,
        );

        const result = await verifyAnswer(proven, tmpDir);

        // Should still conform to the schema even when invalid
        const parseResult = ProvenVerificationResultSchema.safeParse(result);
        expect(parseResult.success).toBe(true);
        expect(result.valid).toBe(false);
        expect(result.verifiedAt).toBeDefined();
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Section 4: Integration Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe("Integration", () => {
    it("full round-trip: generate key -> sign answer -> verify with trusted key -> valid", async () => {
      // 1. Generate key pair
      const pair = generateKeyPair("tal", "Tal M");

      // 2. Save both keys
      await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
      await savePrivateKey(pair.privateKeyRecord, tmpDir);

      // 3. Create and sign an answer
      const answer = makeAnswer();
      const provenAnswer = await signAnswer(
        answer,
        pair.privateKeyRecord.fingerprint,
        tmpDir,
      );

      // 4. Verify it
      const verificationResult = await verifyAnswer(provenAnswer, tmpDir);

      // 5. Assert full valid result
      expect(verificationResult.valid).toBe(true);
      expect(verificationResult.publicKeyFingerprint).toBe(
        pair.publicKeyRecord.metadata.fingerprint,
      );
      expect(verificationResult.responderName).toBe("Tal M");
      expect(verificationResult.verifiedAt).toBeDefined();
    });

    it("sign with one key, verify with a different responder's key -> invalid", async () => {
      // Tal signs the answer
      const talPair = generateKeyPair("tal", "Tal M");
      await savePrivateKey(talPair.privateKeyRecord, tmpDir);

      // Alice's key is the only trusted key
      const alicePair = generateKeyPair("alice", "Alice W");
      await saveTrustedPublicKey(alicePair.publicKeyRecord, tmpDir);

      const answer = makeAnswer({ responderId: "tal" });
      const proven = await signAnswer(
        answer,
        talPair.privateKeyRecord.fingerprint,
        tmpDir,
      );

      // Verification should fail because Tal's public key is not trusted
      const result = await verifyAnswer(proven, tmpDir);

      expect(result.valid).toBe(false);
    });

    it("key rotation: old key removed from trusted, new key added", async () => {
      // 1. Initial key pair for Tal
      const initial = generateKeyPair("tal", "Tal M");
      await saveTrustedPublicKey(initial.publicKeyRecord, tmpDir);
      await savePrivateKey(initial.privateKeyRecord, tmpDir);

      // 2. Sign an answer with the initial key
      const answer1 = makeAnswer({ id: "answer-001", text: "First answer" });
      const proven1 = await signAnswer(
        answer1,
        initial.privateKeyRecord.fingerprint,
        tmpDir,
      );

      // 3. Verify it works with initial key
      const result1 = await verifyAnswer(proven1, tmpDir);
      expect(result1.valid).toBe(true);

      // 4. Rotate the key
      const rotated = await rotateKey(
        "tal",
        "Tal M",
        initial.publicKeyRecord.metadata.fingerprint,
        tmpDir,
      );

      // 5. Sign a new answer with the rotated key
      const answer2 = makeAnswer({ id: "answer-002", text: "Second answer" });
      const proven2 = await signAnswer(
        answer2,
        rotated.privateKeyRecord.fingerprint,
        tmpDir,
      );

      // 6. New answer verifies with the new key
      const result2 = await verifyAnswer(proven2, tmpDir);
      expect(result2.valid).toBe(true);
      expect(result2.publicKeyFingerprint).toBe(
        rotated.publicKeyRecord.metadata.fingerprint,
      );
    });

    it("old answer signed before key expiration remains verifiable", async () => {
      // Generate key pair
      const pair = generateKeyPair("tal", "Tal M");
      await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
      await savePrivateKey(pair.privateKeyRecord, tmpDir);

      // Sign an answer now
      const answer = makeAnswer();
      const proven = await signAnswer(
        answer,
        pair.privateKeyRecord.fingerprint,
        tmpDir,
      );

      // Now rotate the key (marks old key as expired with current timestamp)
      await rotateKey(
        "tal",
        "Tal M",
        pair.publicKeyRecord.metadata.fingerprint,
        tmpDir,
      );

      // The old answer was signed BEFORE the key was expired,
      // so it should still verify (signedAt < expiresAt)
      // Per spec: "Answers signed before expiration remain valid"
      const result = await verifyAnswer(proven, tmpDir);
      expect(result.valid).toBe(true);
    });

    it("answer signed AFTER key expiration fails verification", async () => {
      // Set up key with past expiration
      const pair = generateKeyPair("tal", "Tal M");
      const expiredPublicKey: PublicKeyRecord = {
        ...pair.publicKeyRecord,
        metadata: {
          ...pair.publicKeyRecord.metadata,
          expiresAt: "2020-01-01T00:00:00.000Z",
        },
      };
      await saveTrustedPublicKey(expiredPublicKey, tmpDir);
      await savePrivateKey(pair.privateKeyRecord, tmpDir);

      // Sign an answer (signedAt will be now, which is after 2020)
      const answer = makeAnswer();
      const proven = await signAnswer(
        answer,
        pair.privateKeyRecord.fingerprint,
        tmpDir,
      );

      const result = await verifyAnswer(proven, tmpDir);
      expect(result.valid).toBe(false);
      expect(result.reason!.toLowerCase()).toMatch(/expir/);
    });

    it("revocation: removing public key from trusted directory causes verification failure", async () => {
      const pair = generateKeyPair("tal", "Tal M");
      await saveTrustedPublicKey(pair.publicKeyRecord, tmpDir);
      await savePrivateKey(pair.privateKeyRecord, tmpDir);

      const answer = makeAnswer();
      const proven = await signAnswer(
        answer,
        pair.privateKeyRecord.fingerprint,
        tmpDir,
      );

      // Verify it works first
      const result1 = await verifyAnswer(proven, tmpDir);
      expect(result1.valid).toBe(true);

      // Remove the public key (simulating revocation via git)
      const trustedDir = path.join(tmpDir, ".keys", "trusted");
      const keyFile = path.join(
        trustedDir,
        `${pair.publicKeyRecord.metadata.fingerprint}.pub.json`,
      );
      await fs.unlink(keyFile);

      // Verification should now fail
      const result2 = await verifyAnswer(proven, tmpDir);
      expect(result2.valid).toBe(false);
    });

    it("multiple responders can each sign and verify independently", async () => {
      // Generate keys for two responders
      const talPair = generateKeyPair("tal", "Tal M");
      const alicePair = generateKeyPair("alice", "Alice W");

      // Trust both public keys
      await saveTrustedPublicKey(talPair.publicKeyRecord, tmpDir);
      await saveTrustedPublicKey(alicePair.publicKeyRecord, tmpDir);
      await savePrivateKey(talPair.privateKeyRecord, tmpDir);
      await savePrivateKey(alicePair.privateKeyRecord, tmpDir);

      // Each signs their own answer
      const talAnswer = makeAnswer({
        id: "answer-tal",
        responderId: "tal",
        responderName: "Tal M",
        text: "Tal's answer",
      });
      const aliceAnswer = makeAnswer({
        id: "answer-alice",
        responderId: "alice",
        responderName: "Alice W",
        text: "Alice's answer",
      });

      const talProven = await signAnswer(
        talAnswer,
        talPair.privateKeyRecord.fingerprint,
        tmpDir,
      );
      const aliceProven = await signAnswer(
        aliceAnswer,
        alicePair.privateKeyRecord.fingerprint,
        tmpDir,
      );

      // Both should verify
      const talResult = await verifyAnswer(talProven, tmpDir);
      const aliceResult = await verifyAnswer(aliceProven, tmpDir);

      expect(talResult.valid).toBe(true);
      expect(talResult.responderName).toBe("Tal M");
      expect(aliceResult.valid).toBe(true);
      expect(aliceResult.responderName).toBe("Alice W");
    });

    it("cross-signed answers fail (Tal signs, Alice's fingerprint claimed)", async () => {
      const talPair = generateKeyPair("tal", "Tal M");
      const alicePair = generateKeyPair("alice", "Alice W");

      await saveTrustedPublicKey(talPair.publicKeyRecord, tmpDir);
      await saveTrustedPublicKey(alicePair.publicKeyRecord, tmpDir);
      await savePrivateKey(talPair.privateKeyRecord, tmpDir);

      // Sign with Tal's key
      const answer = makeAnswer();
      const proven = await signAnswer(
        answer,
        talPair.privateKeyRecord.fingerprint,
        tmpDir,
      );

      // Forge the fingerprint to claim it was Alice's key
      const forged: ProvenBreakpointAnswer = {
        ...proven,
        publicKeyFingerprint: alicePair.publicKeyRecord.metadata.fingerprint,
      };

      // Verification should fail because the signature doesn't match Alice's key
      const result = await verifyAnswer(forged, tmpDir);
      expect(result.valid).toBe(false);
    });
  });
});
