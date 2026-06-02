import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  verifyBreakpointResult,
  hasSignatureFields,
} from "../proven-verification";
import type { BreakpointVerificationConfig } from "../proven-verification";

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

function makeUnsignedResult(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    approved: true,
    response: "Looks good",
    respondedBy: "tal",
    ...overrides,
  };
}

function makeSignedResult(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    ...makeUnsignedResult(),
    signature: "base64sig==",
    publicKeyFingerprint: "abc123fingerprint",
    signedAt: "2026-04-21T10:00:00.000Z",
    signedFields: ["id", "breakpointId", "responderId", "text", "approved", "confidence", "answeredAt"],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// hasSignatureFields
// ---------------------------------------------------------------------------

describe("hasSignatureFields", () => {
  it("returns false for unsigned result", () => {
    expect(hasSignatureFields(makeUnsignedResult())).toBe(false);
  });

  it("returns true when all four signature fields are present", () => {
    expect(hasSignatureFields(makeSignedResult())).toBe(true);
  });

  it("returns false when signature field is missing", () => {
    const result = makeSignedResult();
    delete result.signature;
    expect(hasSignatureFields(result)).toBe(false);
  });

  it("returns false when publicKeyFingerprint is missing", () => {
    const result = makeSignedResult();
    delete result.publicKeyFingerprint;
    expect(hasSignatureFields(result)).toBe(false);
  });

  it("returns false when signedAt is missing", () => {
    const result = makeSignedResult();
    delete result.signedAt;
    expect(hasSignatureFields(result)).toBe(false);
  });

  it("returns false when signedFields is missing", () => {
    const result = makeSignedResult();
    delete result.signedFields;
    expect(hasSignatureFields(result)).toBe(false);
  });

  it("returns false when a signature field is null", () => {
    const result = makeSignedResult({ signature: null });
    expect(hasSignatureFields(result)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// verifyBreakpointResult
// ---------------------------------------------------------------------------

describe("verifyBreakpointResult", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns verified:false for unsigned result", async () => {
    const result = await verifyBreakpointResult(makeUnsignedResult());
    expect(result.verified).toBe(false);
    expect(result.reason).toBe("result is not signed");
  });

  it("returns verified:false when config.enabled is false", async () => {
    const config: BreakpointVerificationConfig = { enabled: false };
    const result = await verifyBreakpointResult(makeSignedResult(), config);
    expect(result.verified).toBe(false);
    expect(result.reason).toBe("verification disabled");
  });

  it("returns verified:false when agent-mux-tasks verifyAnswer is missing", async () => {
    vi.resetModules();
    vi.doMock("@a5c-ai/agent-mux-tasks/proven", () => ({
      verifyAnswer: undefined,
    }));
    const { verifyBreakpointResult: verify } = await import("../proven-verification");
    const result = await verify(makeSignedResult());
    expect(result.verified).toBe(false);
    expect(result.reason).toBe("agent-mux-tasks/proven does not export verifyAnswer");
  });

  it("never throws even when verifyAnswer rejects", async () => {
    vi.resetModules();
    vi.doMock("@a5c-ai/agent-mux-tasks/proven", () => ({
      verifyAnswer: async () => { throw new Error("Unexpected verification crash"); },
    }));
    const { verifyBreakpointResult: verify } = await import("../proven-verification");
    const result = await verify(makeSignedResult(), {
      enabled: true,
      trustedKeysDir: "/nonexistent/path",
    });
    expect(result.verified).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("defaults to enabled:true when config is omitted", async () => {
    vi.resetModules();
    vi.doMock("@a5c-ai/agent-mux-tasks/proven", () => ({
      verifyAnswer: undefined,
    }));
    const { verifyBreakpointResult: verify } = await import("../proven-verification");
    const result = await verify(makeSignedResult());
    expect(result.verified).toBe(false);
    expect(result.reason).toBe("agent-mux-tasks/proven does not export verifyAnswer");
  });

  it("skips verification entirely for unsigned result even when enabled", async () => {
    const config: BreakpointVerificationConfig = { enabled: true };
    const result = await verifyBreakpointResult(makeUnsignedResult(), config);
    expect(result.verified).toBe(false);
    expect(result.reason).toBe("result is not signed");
    // Should not have attempted dynamic import at all
    expect(result.verificationResult).toBeUndefined();
  });

  it("passes trustedKeysDir to verifyAnswer when available", async () => {
    // Mock the dynamic import to verify the trustedKeysDir is passed through
    const mockVerifyAnswer = vi.fn().mockResolvedValue({
      valid: true,
      publicKeyFingerprint: "abc123fingerprint",
      responderName: "Tal",
      reason: "Signature verified successfully",
      verifiedAt: "2026-04-21T10:05:00.000Z",
    });

    vi.doMock("@a5c-ai/agent-mux-tasks/proven", () => ({
      verifyAnswer: mockVerifyAnswer,
    }));

    // Re-import to pick up the mock
    const { verifyBreakpointResult: freshVerify } = await import("../proven-verification");

    const config: BreakpointVerificationConfig = {
      enabled: true,
      trustedKeysDir: "/custom/keys/dir",
    };
    const result = await freshVerify(makeSignedResult(), config);

    expect(result.verified).toBe(true);
    expect(result.verificationResult).toBeDefined();
    expect(result.verificationResult?.valid).toBe(true);
    expect(result.verificationResult?.responderName).toBe("Tal");
    expect(mockVerifyAnswer).toHaveBeenCalledWith(
      expect.objectContaining({ signature: "base64sig==" }),
      "/custom/keys/dir",
    );

    vi.doUnmock("@a5c-ai/agent-mux-tasks/proven");
  });

  it("returns verified:false when verifyAnswer returns valid:false", async () => {
    vi.doMock("@a5c-ai/agent-mux-tasks/proven", () => ({
      verifyAnswer: vi.fn().mockResolvedValue({
        valid: false,
        publicKeyFingerprint: "abc123fingerprint",
        reason: "Signature verification failed",
        verifiedAt: "2026-04-21T10:05:00.000Z",
      }),
    }));

    const { verifyBreakpointResult: freshVerify } = await import("../proven-verification");

    const result = await freshVerify(makeSignedResult());
    expect(result.verified).toBe(false);
    expect(result.verificationResult).toBeDefined();
    expect(result.verificationResult?.valid).toBe(false);
    expect(result.verificationResult?.reason).toBe("Signature verification failed");

    vi.doUnmock("@a5c-ai/agent-mux-tasks/proven");
  });

  it("handles verifyAnswer that throws an error", async () => {
    vi.doMock("@a5c-ai/agent-mux-tasks/proven", () => ({
      verifyAnswer: vi.fn().mockRejectedValue(new Error("corrupted key file")),
    }));

    const { verifyBreakpointResult: freshVerify } = await import("../proven-verification");

    const result = await freshVerify(makeSignedResult());
    expect(result.verified).toBe(false);
    expect(result.reason).toContain("corrupted key file");

    vi.doUnmock("@a5c-ai/agent-mux-tasks/proven");
  });

  it("handles module that exports verifyAnswer as undefined", async () => {
    vi.doMock("@a5c-ai/agent-mux-tasks/proven", () => ({
      verifyAnswer: undefined,
    }));

    const { verifyBreakpointResult: freshVerify } = await import("../proven-verification");

    const result = await freshVerify(makeSignedResult());
    expect(result.verified).toBe(false);
    expect(result.reason).toBe("agent-mux-tasks/proven does not export verifyAnswer");

    vi.doUnmock("@a5c-ai/agent-mux-tasks/proven");
  });
});
