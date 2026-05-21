import { describe, it, expect } from "vitest";
import {
  generateSSHKeyPair,
  parsePublicKey,
  calculateFingerprint,
  formatAuthorizedKey,
} from "../auth/ssh-keys.js";

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("SSH Keys", () => {
  // ── generateSSHKeyPair ──────────────────────────────────────────────────

  describe("generateSSHKeyPair()", () => {
    it("should return a key pair with publicKey, privateKey, fingerprint, algorithm, and createdAt", () => {
      const pair = generateSSHKeyPair();

      expect(pair.publicKey).toBeDefined();
      expect(pair.privateKey).toBeDefined();
      expect(pair.fingerprint).toBeDefined();
      expect(pair.algorithm).toBeDefined();
      expect(pair.createdAt).toBeDefined();
    });

    it("should generate an Ed25519 key pair", () => {
      const pair = generateSSHKeyPair();

      expect(pair.algorithm).toBe("ed25519");
    });

    it("should generate a PEM-encoded public key", () => {
      const pair = generateSSHKeyPair();

      expect(pair.publicKey).toContain("-----BEGIN PUBLIC KEY-----");
      expect(pair.publicKey).toContain("-----END PUBLIC KEY-----");
    });

    it("should generate a PEM-encoded private key", () => {
      const pair = generateSSHKeyPair();

      expect(pair.privateKey).toContain("-----BEGIN PRIVATE KEY-----");
      expect(pair.privateKey).toContain("-----END PRIVATE KEY-----");
    });

    it("should generate a SHA256 fingerprint", () => {
      const pair = generateSSHKeyPair();

      expect(pair.fingerprint).toMatch(/^SHA256:/);
    });

    it("should set createdAt to a valid ISO datetime", () => {
      const pair = generateSSHKeyPair();

      const createdAt = new Date(pair.createdAt);
      expect(createdAt.getTime()).not.toBeNaN();
      const now = new Date();
      expect(now.getTime() - createdAt.getTime()).toBeLessThan(5_000);
    });

    it("should generate unique key pairs on each call", () => {
      const pair1 = generateSSHKeyPair();
      const pair2 = generateSSHKeyPair();

      expect(pair1.publicKey).not.toBe(pair2.publicKey);
      expect(pair1.privateKey).not.toBe(pair2.privateKey);
      expect(pair1.fingerprint).not.toBe(pair2.fingerprint);
    });

    it("should generate non-empty keys", () => {
      const pair = generateSSHKeyPair();

      expect(pair.publicKey.length).toBeGreaterThan(50);
      expect(pair.privateKey.length).toBeGreaterThan(50);
    });
  });

  // ── parsePublicKey ──────────────────────────────────────────────────────

  describe("parsePublicKey()", () => {
    it("should detect ed25519 algorithm from ssh-ed25519 prefix", () => {
      const result = parsePublicKey("ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExample user@host");

      expect(result.algorithm).toBe("ed25519");
    });

    it("should detect ed25519 algorithm from ED25519 keyword", () => {
      const result = parsePublicKey("-----BEGIN PUBLIC KEY-----\nED25519 content\n-----END PUBLIC KEY-----");

      expect(result.algorithm).toBe("ed25519");
    });

    it("should detect rsa algorithm from ssh-rsa prefix", () => {
      const result = parsePublicKey("ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAx user@host");

      expect(result.algorithm).toBe("rsa");
    });

    it("should detect rsa algorithm from RSA keyword", () => {
      const result = parsePublicKey("-----BEGIN RSA PUBLIC KEY-----\ncontent\n-----END RSA PUBLIC KEY-----");

      expect(result.algorithm).toBe("rsa");
    });

    it("should detect ecdsa algorithm from ecdsa prefix", () => {
      const result = parsePublicKey("ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABB");

      expect(result.algorithm).toBe("ecdsa");
    });

    it("should return 'unknown' for unrecognized key formats", () => {
      const result = parsePublicKey("some-unknown-key-format AAAA");

      expect(result.algorithm).toBe("unknown");
    });

    it("should always return a fingerprint", () => {
      const result = parsePublicKey("ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExample");

      expect(result.fingerprint).toBeDefined();
      expect(result.fingerprint).toMatch(/^SHA256:/);
    });

    it("should return consistent fingerprint for the same key", () => {
      const key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExample user@host";

      const result1 = parsePublicKey(key);
      const result2 = parsePublicKey(key);

      expect(result1.fingerprint).toBe(result2.fingerprint);
    });
  });

  // ── calculateFingerprint ────────────────────────────────────────────────

  describe("calculateFingerprint()", () => {
    it("should return SHA256: prefixed fingerprint", () => {
      const fp = calculateFingerprint("test-key-content");

      expect(fp).toMatch(/^SHA256:/);
    });

    it("should return a base64-encoded hash after SHA256:", () => {
      const fp = calculateFingerprint("test-key-content");
      const base64Part = fp.slice("SHA256:".length);

      // Should be valid base64
      expect(base64Part.length).toBeGreaterThan(0);
      const decoded = Buffer.from(base64Part, "base64");
      expect(decoded.length).toBe(32); // SHA256 produces 32 bytes
    });

    it("should produce consistent results for the same input", () => {
      const fp1 = calculateFingerprint("same-key");
      const fp2 = calculateFingerprint("same-key");

      expect(fp1).toBe(fp2);
    });

    it("should produce different results for different inputs", () => {
      const fp1 = calculateFingerprint("key-1");
      const fp2 = calculateFingerprint("key-2");

      expect(fp1).not.toBe(fp2);
    });

    it("should trim whitespace before hashing", () => {
      const fp1 = calculateFingerprint("key-content");
      const fp2 = calculateFingerprint("  key-content  ");

      expect(fp1).toBe(fp2);
    });
  });

  // ── formatAuthorizedKey ─────────────────────────────────────────────────

  describe("formatAuthorizedKey()", () => {
    it("should return trimmed key when no comment is provided", () => {
      const result = formatAuthorizedKey("  ssh-ed25519 AAAA...  ");

      expect(result).toBe("ssh-ed25519 AAAA...");
    });

    it("should append comment after the key", () => {
      const result = formatAuthorizedKey("ssh-ed25519 AAAA...", "user@host");

      expect(result).toBe("ssh-ed25519 AAAA... user@host");
    });

    it("should handle empty string key", () => {
      const result = formatAuthorizedKey("");

      expect(result).toBe("");
    });

    it("should handle key with existing comment", () => {
      const result = formatAuthorizedKey("ssh-ed25519 AAAA... old-comment", "new-comment");

      expect(result).toBe("ssh-ed25519 AAAA... old-comment new-comment");
    });

    it("should trim leading and trailing whitespace from the key", () => {
      const result = formatAuthorizedKey("\n  ssh-ed25519 AAAA...  \n", "comment");

      expect(result).toBe("ssh-ed25519 AAAA... comment");
    });
  });
});
