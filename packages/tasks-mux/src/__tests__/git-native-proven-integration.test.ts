import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { GitNativeBackend } from "../backends/git-native.js";
import type { SubmitBreakpointParams } from "../backend.js";
import type {
  BreakpointContext,
  BreakpointRouting,
  ProvenBreakpointAnswer,
  ProvenVerificationResult,
} from "../types.js";
import {
  ProvenBreakpointAnswerSchema,
} from "../types.js";
import {
  generateKeyPair,
  saveTrustedPublicKey,
  savePrivateKey,
} from "../proven/keys.js";

// ────────────────────────────────────────────────────────────────────────────
// Test Factories
// ────────────────────────────────────────────────────────────────────────────

function makeContext(overrides: Partial<BreakpointContext> = {}): BreakpointContext {
  return {
    description: "A test breakpoint",
    codeSnippets: [],
    fileReferences: [],
    tags: [],
    ...overrides,
  };
}

function makeRouting(overrides: Partial<BreakpointRouting> = {}): BreakpointRouting {
  return {
    strategy: "first-response-wins",
    targetResponders: [],
    timeoutMs: 1_800_000,
    presentToUser: false,
    ...overrides,
  };
}

function makeSubmitParams(overrides: Partial<SubmitBreakpointParams> = {}): SubmitBreakpointParams {
  return {
    text: "Should we use connection pooling?",
    context: makeContext(),
    routing: makeRouting(),
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

let tmpDir: string;
let breakpointsDir: string;

async function createTmpDir(): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), "bp-proven-integ-"));
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile(filePath: string): Promise<unknown> {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

/**
 * Generate a key pair and save both the private key file and the trusted
 * public key under the breakpoints directory. Returns the path to the
 * private key .key.json file (for use as signingKeyPath).
 */
async function setupSigningKey(
  bpDir: string,
  responderId = "tal",
  responderName = "Tal M",
): Promise<{ signingKeyPath: string; fingerprint: string }> {
  const pair = generateKeyPair(responderId, responderName);

  // Save the private key as a standalone file (for signingKeyPath)
  const keyDir = path.join(bpDir, ".keys", "private");
  await fs.mkdir(keyDir, { recursive: true });
  const signingKeyPath = path.join(keyDir, `${pair.privateKeyRecord.fingerprint}.key.json`);
  await fs.writeFile(
    signingKeyPath,
    JSON.stringify(pair.privateKeyRecord, null, 2) + "\n",
    "utf-8",
  );

  // Save the trusted public key under the breakpoints dir
  // The verify module looks at baseDir/.keys/trusted/
  await saveTrustedPublicKey(pair.publicKeyRecord, bpDir);

  return {
    signingKeyPath,
    fingerprint: pair.privateKeyRecord.fingerprint,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("GitNativeBackend -- Proven Breakpoint Integration", () => {
  beforeEach(async () => {
    tmpDir = await createTmpDir();
    breakpointsDir = path.join(tmpDir, ".breakpoints");
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  // ── Answer Signing ───────────────────────────────────────────────────────

  describe("answer signing when key is configured", () => {
    it("should create a .proven.json file alongside the .answer.json", async () => {
      const { signingKeyPath } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes, use connection pooling.",
        confidence: 90,
      });

      const provenPath = path.join(breakpointsDir, `${bp.id}.proven.json`);
      expect(await fileExists(provenPath)).toBe(true);
    });

    it("should write a valid ProvenBreakpointAnswer to the .proven.json file", async () => {
      const { signingKeyPath } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes, use connection pooling.",
        confidence: 90,
      });

      const provenPath = path.join(breakpointsDir, `${bp.id}.proven.json`);
      const provenData = await readJsonFile(provenPath);
      const parseResult = ProvenBreakpointAnswerSchema.safeParse(provenData);

      expect(parseResult.success).toBe(true);
    });

    it("should include signature and publicKeyFingerprint in the proven file", async () => {
      const { signingKeyPath, fingerprint } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      const provenPath = path.join(breakpointsDir, `${bp.id}.proven.json`);
      const proven = await readJsonFile(provenPath) as ProvenBreakpointAnswer;

      expect(proven.signature).toBeDefined();
      expect(proven.signature.length).toBeGreaterThan(0);
      expect(proven.publicKeyFingerprint).toBe(fingerprint);
    });

    it("should include signedAt and signedFields in the proven file", async () => {
      const { signingKeyPath } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      const provenPath = path.join(breakpointsDir, `${bp.id}.proven.json`);
      const proven = await readJsonFile(provenPath) as ProvenBreakpointAnswer;

      expect(proven.signedAt).toBeDefined();
      expect(new Date(proven.signedAt).getTime()).not.toBeNaN();
      expect(proven.signedFields).toEqual([
        "id",
        "breakpointId",
        "responderId",
        "text",
        "approved",
        "confidence",
        "answeredAt",
      ]);
    });

    it("should preserve all answer fields in the proven file", async () => {
      const { signingKeyPath } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Use connection pooling with ioredis.",
        approved: true,
        confidence: 95,
        references: ["https://redis.io"],
      });

      const provenPath = path.join(breakpointsDir, `${bp.id}.proven.json`);
      const proven = await readJsonFile(provenPath) as ProvenBreakpointAnswer;

      expect(proven.id).toBe(answer.id);
      expect(proven.breakpointId).toBe(bp.id);
      expect(proven.responderId).toBe("tal");
      expect(proven.responderName).toBe("Tal M");
      expect(proven.text).toBe("Use connection pooling with ioredis.");
      expect(proven.approved).toBe(true);
      expect(proven.confidence).toBe(95);
      expect(proven.references).toEqual(["https://redis.io"]);
    });

    it("should return the signed answer object from answerBreakpoint", async () => {
      const { signingKeyPath } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes, use connection pooling.",
      });

      expect(ProvenBreakpointAnswerSchema.safeParse(answer).success).toBe(true);
    });

    it("should round-trip the signed answer through getBreakpoint and waitForAnswer", async () => {
      const { signingKeyPath } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes, use connection pooling.",
      });

      const retrieved = await backend.getBreakpoint(bp.id);
      const waitResult = await backend.waitForAnswer(bp.id, { timeoutMs: 100 });

      expect(ProvenBreakpointAnswerSchema.safeParse(retrieved.answers[0]).success).toBe(true);
      expect(waitResult.answer).toEqual(answer);
      expect(waitResult.allAnswers[0]).toEqual(answer);
    });

    it("should honor sign=false by leaving the public answer unsigned", async () => {
      const { signingKeyPath } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Unsigned by request.",
        sign: false,
      });

      expect(ProvenBreakpointAnswerSchema.safeParse(answer).success).toBe(false);
      expect(await fileExists(path.join(breakpointsDir, `${bp.id}.proven.json`))).toBe(false);
    });

    it("should honor keyFingerprint by signing with the requested private key", async () => {
      const { fingerprint } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Signed with explicit key.",
        sign: true,
        keyFingerprint: fingerprint,
      });

      expect(ProvenBreakpointAnswerSchema.safeParse(answer).success).toBe(true);
      expect((answer as ProvenBreakpointAnswer).publicKeyFingerprint).toBe(fingerprint);
    });
  });

  // ── No Signing Key ──────────────────────────────────────────────────────

  describe("answer signing skipped when no key configured", () => {
    it("should NOT create a .proven.json file when no signingKeyPath is set", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      const provenPath = path.join(breakpointsDir, `${bp.id}.proven.json`);
      expect(await fileExists(provenPath)).toBe(false);
    });

    it("should NOT create a .proven.json when signingKeyPath points to nonexistent file", async () => {
      const backend = new GitNativeBackend({
        breakpointsDir,
        signingKeyPath: path.join(tmpDir, "nonexistent.key.json"),
      });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      const provenPath = path.join(breakpointsDir, `${bp.id}.proven.json`);
      expect(await fileExists(provenPath)).toBe(false);
    });

    it("should still create .answer.json normally when no signing key", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      const answerPath = path.join(breakpointsDir, `${bp.id}.answer.json`);
      expect(await fileExists(answerPath)).toBe(true);
    });
  });

  // ── Verification of Proven Answers ──────────────────────────────────────

  describe("verification of proven answers with trusted keys", () => {
    it("should verify a signed answer as valid when trusted key is present", async () => {
      const { signingKeyPath } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      const result = await backend.verifyAnswer(bp.id);

      expect(result.valid).toBe(true);
      expect(result.responderName).toBe("Tal M");
      expect(result.verifiedAt).toBeDefined();
    });

    it("should include publicKeyFingerprint in verification result", async () => {
      const { signingKeyPath, fingerprint } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      const result = await backend.verifyAnswer(bp.id);

      expect(result.publicKeyFingerprint).toBe(fingerprint);
    });

    it("should include provenVerification in getBreakpoint when proven file exists", async () => {
      const { signingKeyPath } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      const retrieved = await backend.getBreakpoint(bp.id);
      const verification = (retrieved as typeof retrieved & { provenVerification?: ProvenVerificationResult })
        .provenVerification;

      expect(verification).toBeDefined();
      expect(verification!.valid).toBe(true);
    });

    it("should NOT include provenVerification when no proven file exists", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      const retrieved = await backend.getBreakpoint(bp.id);
      const verification = (retrieved as typeof retrieved & { provenVerification?: ProvenVerificationResult })
        .provenVerification;

      expect(verification).toBeUndefined();
    });
  });

  // ── Verification Failure ────────────────────────────────────────────────

  describe("verification failure with untrusted/wrong keys", () => {
    it("should return valid: false when public key is not in trusted directory", async () => {
      // Set up signing key but do NOT save the public key as trusted
      const pair = generateKeyPair("tal", "Tal M");
      const keyDir = path.join(breakpointsDir, ".keys", "private");
      await fs.mkdir(keyDir, { recursive: true });
      const signingKeyPath = path.join(keyDir, `${pair.privateKeyRecord.fingerprint}.key.json`);
      await fs.writeFile(
        signingKeyPath,
        JSON.stringify(pair.privateKeyRecord, null, 2) + "\n",
        "utf-8",
      );

      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      const result = await backend.verifyAnswer(bp.id);

      expect(result.valid).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it("should return valid: false when proven file is tampered with", async () => {
      const { signingKeyPath } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      // Tamper with the proven file
      const provenPath = path.join(breakpointsDir, `${bp.id}.proven.json`);
      const provenData = await readJsonFile(provenPath) as ProvenBreakpointAnswer;
      provenData.text = "TAMPERED: No, never use connection pooling.";
      await fs.writeFile(
        provenPath,
        JSON.stringify(provenData, null, 2) + "\n",
        "utf-8",
      );

      const result = await backend.verifyAnswer(bp.id);

      expect(result.valid).toBe(false);
    });

    it("should return valid: false with reason when signed with wrong key", async () => {
      // Sign with one key, but trust a different key
      const signerPair = generateKeyPair("tal", "Tal M");
      const trustedPair = generateKeyPair("alice", "Alice W");

      // Only trust Alice's key
      await saveTrustedPublicKey(trustedPair.publicKeyRecord, breakpointsDir);

      // Save Tal's private key for signing
      const keyDir = path.join(breakpointsDir, ".keys", "private");
      await fs.mkdir(keyDir, { recursive: true });
      const signingKeyPath = path.join(keyDir, `${signerPair.privateKeyRecord.fingerprint}.key.json`);
      await fs.writeFile(
        signingKeyPath,
        JSON.stringify(signerPair.privateKeyRecord, null, 2) + "\n",
        "utf-8",
      );

      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      const result = await backend.verifyAnswer(bp.id);

      expect(result.valid).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  // ── verifyAnswer() Method ──────────────────────────────────────────────

  describe("verifyAnswer() method", () => {
    it("should return valid: false with reason when no signed answer exists", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      const result = await backend.verifyAnswer(bp.id);

      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/no signed/i);
      expect(result.verifiedAt).toBeDefined();
    });

    it("should return a valid ProvenVerificationResult shape even on failure", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      const result = await backend.verifyAnswer(bp.id);

      expect(typeof result.valid).toBe("boolean");
      expect(typeof result.verifiedAt).toBe("string");
      expect(new Date(result.verifiedAt).getTime()).not.toBeNaN();
    });

    it("should verify successfully for a correctly signed and trusted answer", async () => {
      const { signingKeyPath } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Use connection pooling.",
        approved: true,
        confidence: 90,
      });

      const result = await backend.verifyAnswer(bp.id);

      expect(result.valid).toBe(true);
      expect(result.responderName).toBe("Tal M");
    });

    it("should return verifiedAt as a recent ISO datetime", async () => {
      const { signingKeyPath } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      const before = Date.now();
      const result = await backend.verifyAnswer(bp.id);
      const after = Date.now();

      const verifiedAt = new Date(result.verifiedAt).getTime();
      expect(verifiedAt).toBeGreaterThanOrEqual(before - 1000);
      expect(verifiedAt).toBeLessThanOrEqual(after + 1000);
    });
  });

  // ── Round-Trip Integration ──────────────────────────────────────────────

  describe("round-trip: submit, answer with signing, get with verification", () => {
    it("full lifecycle with signing and verification", async () => {
      const { signingKeyPath, fingerprint } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      // 1. Submit
      const bp = await backend.submitBreakpoint(
        makeSubmitParams({ text: "Should we deploy to production?" }),
      );
      expect(bp.status).toBe("pending");

      // 2. Answer (signing happens automatically)
      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes, deploy to staging first.",
        approved: true,
        confidence: 85,
      });
      expect(ProvenBreakpointAnswerSchema.safeParse(answer).success).toBe(true);

      // 3. Verify .proven.json was created
      const provenPath = path.join(breakpointsDir, `${bp.id}.proven.json`);
      expect(await fileExists(provenPath)).toBe(true);

      // 4. Verify the signature
      const verification = await backend.verifyAnswer(bp.id);
      expect(verification.valid).toBe(true);
      expect(verification.publicKeyFingerprint).toBe(fingerprint);
      expect(verification.responderName).toBe("Tal M");

      // 5. getBreakpoint includes verification metadata
      const retrieved = await backend.getBreakpoint(bp.id);
      expect(retrieved.status).toBe("answered");
      expect(retrieved.answers.length).toBeGreaterThanOrEqual(1);
      expect(ProvenBreakpointAnswerSchema.safeParse(retrieved.answers[0]).success).toBe(true);

      const provenVerification = (retrieved as typeof retrieved & {
        provenVerification?: ProvenVerificationResult;
      }).provenVerification;
      expect(provenVerification).toBeDefined();
      expect(provenVerification!.valid).toBe(true);
    });

    it("round-trip with multiple breakpoints, each independently signed", async () => {
      const { signingKeyPath } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp1 = await backend.submitBreakpoint(makeSubmitParams({ text: "Q1" }));
      const bp2 = await backend.submitBreakpoint(makeSubmitParams({ text: "Q2" }));

      await backend.answerBreakpoint(bp1.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "A1",
      });
      await backend.answerBreakpoint(bp2.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "A2",
      });

      // Both should have proven files
      expect(await fileExists(path.join(breakpointsDir, `${bp1.id}.proven.json`))).toBe(true);
      expect(await fileExists(path.join(breakpointsDir, `${bp2.id}.proven.json`))).toBe(true);

      // Both should verify
      const v1 = await backend.verifyAnswer(bp1.id);
      const v2 = await backend.verifyAnswer(bp2.id);
      expect(v1.valid).toBe(true);
      expect(v2.valid).toBe(true);
    });

    it("proven files produce different signatures for different answers", async () => {
      const { signingKeyPath } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp1 = await backend.submitBreakpoint(makeSubmitParams({ text: "Q1" }));
      const bp2 = await backend.submitBreakpoint(makeSubmitParams({ text: "Q2" }));

      await backend.answerBreakpoint(bp1.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Answer One",
      });
      await backend.answerBreakpoint(bp2.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Answer Two",
      });

      const proven1 = await readJsonFile(
        path.join(breakpointsDir, `${bp1.id}.proven.json`),
      ) as ProvenBreakpointAnswer;
      const proven2 = await readJsonFile(
        path.join(breakpointsDir, `${bp2.id}.proven.json`),
      ) as ProvenBreakpointAnswer;

      expect(proven1.signature).not.toBe(proven2.signature);
    });

    it("listPendingBreakpoints still ignores .proven.json files", async () => {
      const { signingKeyPath } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp1 = await backend.submitBreakpoint(makeSubmitParams({ text: "Q1" }));
      const bp2 = await backend.submitBreakpoint(makeSubmitParams({ text: "Q2" }));

      // Answer bp1 (creates .answer.json and .proven.json)
      await backend.answerBreakpoint(bp1.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "A1",
      });

      // bp2 should still be pending
      const pending = await backend.listPendingBreakpoints();
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(bp2.id);
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("should handle signing key file with invalid JSON gracefully", async () => {
      const invalidKeyPath = path.join(tmpDir, "bad.key.json");
      await fs.writeFile(invalidKeyPath, "not valid json{{{", "utf-8");

      const backend = new GitNativeBackend({
        breakpointsDir,
        signingKeyPath: invalidKeyPath,
      });

      const bp = await backend.submitBreakpoint(makeSubmitParams());

      // Should not throw -- just skip signing
      const answer = await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      expect(answer).toBeDefined();
      const provenPath = path.join(breakpointsDir, `${bp.id}.proven.json`);
      expect(await fileExists(provenPath)).toBe(false);
    });

    it("should handle verifyAnswer on breakpoint with no answer at all", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      const bp = await backend.submitBreakpoint(makeSubmitParams());

      const result = await backend.verifyAnswer(bp.id);

      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/no signed/i);
    });

    it("should handle concurrent answer-and-verify", async () => {
      const { signingKeyPath } = await setupSigningKey(breakpointsDir);
      const backend = new GitNativeBackend({ breakpointsDir, signingKeyPath });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      // Multiple concurrent verifications should all succeed
      const results = await Promise.all([
        backend.verifyAnswer(bp.id),
        backend.verifyAnswer(bp.id),
        backend.verifyAnswer(bp.id),
      ]);

      for (const result of results) {
        expect(result.valid).toBe(true);
      }
    });

    it("getBreakpoint still works when proven file is malformed", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      // Write a malformed proven file
      const provenPath = path.join(breakpointsDir, `${bp.id}.proven.json`);
      await fs.writeFile(provenPath, "not-json{{{", "utf-8");

      // getBreakpoint should still work (gracefully skip proven loading)
      const retrieved = await backend.getBreakpoint(bp.id);
      expect(retrieved.status).toBe("answered");
      expect(retrieved.answers.length).toBeGreaterThanOrEqual(1);
    });

    it("verifyAnswer returns failure when proven file is malformed", async () => {
      const backend = new GitNativeBackend({ breakpointsDir });

      const bp = await backend.submitBreakpoint(makeSubmitParams());
      await backend.answerBreakpoint(bp.id, {
        responderId: "tal",
        responderName: "Tal M",
        text: "Yes.",
      });

      // Write a malformed proven file
      const provenPath = path.join(breakpointsDir, `${bp.id}.proven.json`);
      await fs.writeFile(provenPath, "not-json{{{", "utf-8");

      const result = await backend.verifyAnswer(bp.id);
      expect(result.valid).toBe(false);
    });
  });
});
