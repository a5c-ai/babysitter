/**
 * Milestone C — ENFORCED signed human breakpoints (SDK).
 *
 * Frozen tests authored from docs/design/proof-based-policy-enforcement.md:
 *   - §11 AC-28 (spoofed approval: fabricated `approved:true` with no valid human
 *     signature must be rejected — closes the current spoofable gap where SDK
 *     task_post / commitEffectResult accept UNSIGNED answers today, research §3);
 *   - AC-4 (new breakpoint approvals are signed evidence; the enforcement gate is
 *     consulted in the task_post / commitEffectResult path);
 *   - §5 step 7 / §7 (an unsigned or wrong-signer approval fails verification);
 *   - AC-48/§3.2 (a proven answer whose `approved` bit is NOT inside the signed set
 *     is treated as unsigned → reject).
 *
 * ENFORCEMENT CONTRACT (Milestone C wires this gate into the SDK breakpoint commit
 * path — proven-verification.ts consulted from task_post / commitEffectResult):
 *   - When the policy for a breakpoint REQUIRES a signature, an UNSIGNED answer, or
 *     one with an INVALID / wrong-key / tampered signature, is REJECTED: the commit
 *     is refused, the effect stays PENDING, no EFFECT_RESOLVED is emitted
 *     (fail-closed).
 *   - A validly-signed answer is ACCEPTED.
 *   - When a signature is NOT required (back-compat, the pre-Milestone-C default),
 *     an unsigned answer is UNAFFECTED — the gate does not break existing runs.
 *
 * This file imports from the intended module path the Milestone-C implementation
 * WILL provide: `../enforce-signed-breakpoint` exporting `enforceSignedBreakpointAnswer`.
 * Module resolution MAY fail until the milestone lands — that is expected; there are
 * no syntax errors here. Adversarial cases MUST fail closed (reject → effect pending).
 *
 * The gate is authored as a PURE decision function (no filesystem / run wiring) so it
 * is unit-testable; the runtime wiring (task_post → commitEffectResult) is exercised
 * end-to-end in Milestone E.
 */
import { describe, it, expect, vi } from "vitest";

import {
  enforceSignedBreakpointAnswer,
  type SignedBreakpointEnforcementConfig,
  type SignedBreakpointEnforcementDecision,
} from "../enforce-signed-breakpoint";

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** An UNSIGNED breakpoint answer — the spoofable shape accepted today (research §3). */
function unsignedAnswer(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    id: "ans-1",
    breakpointId: "bp-deploy-prod",
    responderId: "responder-alice",
    responderName: "Alice",
    text: "approved",
    approved: true,
    confidence: 100,
    references: [],
    followUpQuestions: [],
    answeredAt: "2026-07-03T10:00:00.000Z",
    ...overrides,
  };
}

/** A validly-signed proven answer (all security-critical fields inside signedFields). */
function signedAnswer(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    ...unsignedAnswer(),
    signature: "valid-base64-signature==",
    publicKeyFingerprint: "fp-human-alice",
    signedAt: "2026-07-03T10:00:00.000Z",
    signedFields: [
      "id",
      "breakpointId",
      "responderId",
      "text",
      "approved",
      "confidence",
      "answeredAt",
    ],
    ...overrides,
  };
}

/** A config that REQUIRES a signature for this breakpoint. */
function requiredConfig(
  overrides?: Partial<SignedBreakpointEnforcementConfig>,
): SignedBreakpointEnforcementConfig {
  return {
    signatureRequired: true,
    trustedKeysDir: "/trusted/keys",
    ...overrides,
  };
}

// ── AC-28 / AC-4 — signature REQUIRED: reject unsigned & invalid, accept valid ─

describe("Milestone C — enforced signed breakpoints (AC-28, AC-4)", () => {
  it("AC-28: signature required + UNSIGNED answer → REJECT (effect stays pending, fail-closed)", async () => {
    const decision: SignedBreakpointEnforcementDecision =
      await enforceSignedBreakpointAnswer(unsignedAnswer(), requiredConfig());
    expect(decision.accepted).toBe(false);
    // Fail-closed: the commit must be refused so no EFFECT_RESOLVED is emitted.
    expect(decision.reason).toBeDefined();
  });

  it("AC-28: fabricated approved:true with no signature fields → REJECT (spoofed approval)", async () => {
    // The classic spoof: an attacker posts { approved: true } with no crypto at all.
    const spoof = unsignedAnswer({ approved: true, responderId: "attacker" });
    const decision = await enforceSignedBreakpointAnswer(spoof, requiredConfig());
    expect(decision.accepted).toBe(false);
  });

  it("AC-28: signature required + WRONG-KEY / invalid signature → REJECT", async () => {
    // verifyAnswer reports the signature does not verify (wrong key or forged sig).
    vi.resetModules();
    vi.doMock("@a5c-ai/tasks-adapter/proven", () => ({
      verifyAnswer: vi.fn().mockResolvedValue({
        valid: false,
        publicKeyFingerprint: "fp-human-alice",
        reason: "signature verification failed",
        verifiedAt: "2026-07-03T10:05:00.000Z",
      }),
    }));
    const { enforceSignedBreakpointAnswer: gate } = await import(
      "../enforce-signed-breakpoint"
    );
    const decision = await gate(signedAnswer(), requiredConfig());
    expect(decision.accepted).toBe(false);
    vi.doUnmock("@a5c-ai/tasks-adapter/proven");
  });

  it("AC-28: signature required + TAMPERED answer (fields mutated after signing) → REJECT", async () => {
    // The signature was made over the original payload; the delivered `approved`
    // and `breakpointId` were flipped after signing → verifyAnswer must fail.
    vi.resetModules();
    vi.doMock("@a5c-ai/tasks-adapter/proven", () => ({
      verifyAnswer: vi.fn().mockResolvedValue({
        valid: false,
        reason: "canonical payload does not match signature",
        verifiedAt: "2026-07-03T10:05:00.000Z",
      }),
    }));
    const { enforceSignedBreakpointAnswer: gate } = await import(
      "../enforce-signed-breakpoint"
    );
    const tampered = signedAnswer({ approved: true, breakpointId: "bp-attacker-target" });
    const decision = await gate(tampered, requiredConfig());
    expect(decision.accepted).toBe(false);
    vi.doUnmock("@a5c-ai/tasks-adapter/proven");
  });

  it("AC-4: signature required + VALID signature → ACCEPT", async () => {
    vi.resetModules();
    vi.doMock("@a5c-ai/tasks-adapter/proven", () => ({
      verifyAnswer: vi.fn().mockResolvedValue({
        valid: true,
        publicKeyFingerprint: "fp-human-alice",
        responderName: "Alice",
        reason: "signature verified",
        verifiedAt: "2026-07-03T10:05:00.000Z",
      }),
    }));
    const { enforceSignedBreakpointAnswer: gate } = await import(
      "../enforce-signed-breakpoint"
    );
    const decision = await gate(signedAnswer(), requiredConfig());
    expect(decision.accepted).toBe(true);
    vi.doUnmock("@a5c-ai/tasks-adapter/proven");
  });

  it("AC-48: signature required + `approved` NOT in signedFields → REJECT (unsigned approved bit)", async () => {
    // Even if the raw signature verifies, an `approved` bit that is not inside the
    // signed set is an UNSIGNED field — it must not be honored as a human approval.
    vi.resetModules();
    vi.doMock("@a5c-ai/tasks-adapter/proven", () => ({
      // A permissive proven verify that (as in the real defect) rebuilds the payload
      // from the attacker-supplied signedFields and reports valid:true.
      verifyAnswer: vi.fn().mockResolvedValue({
        valid: true,
        publicKeyFingerprint: "fp-human-alice",
        verifiedAt: "2026-07-03T10:05:00.000Z",
      }),
    }));
    const { enforceSignedBreakpointAnswer: gate } = await import(
      "../enforce-signed-breakpoint"
    );
    const stripped = signedAnswer({
      approved: true,
      // signedFields omits `approved` and `breakpointId` — the completeness gate
      // must treat those as unsigned and reject.
      signedFields: ["id", "responderId", "text", "confidence", "answeredAt"],
    });
    const decision = await gate(stripped, requiredConfig());
    expect(decision.accepted).toBe(false);
    vi.doUnmock("@a5c-ai/tasks-adapter/proven");
  });
});

// ── Back-compat — signature NOT required: unsigned unaffected ──────────────────

describe("Milestone C — signed breakpoints back-compat (not-required)", () => {
  it("signature NOT required + unsigned answer → ACCEPT (existing runs unaffected)", async () => {
    const decision = await enforceSignedBreakpointAnswer(unsignedAnswer(), {
      signatureRequired: false,
    });
    expect(decision.accepted).toBe(true);
  });

  it("signature NOT required + signed answer → ACCEPT (still fine)", async () => {
    const decision = await enforceSignedBreakpointAnswer(signedAnswer(), {
      signatureRequired: false,
    });
    expect(decision.accepted).toBe(true);
  });
});

// ── Fail-closed discipline — any error during enforcement denies ──────────────

describe("Milestone C — signed-breakpoint enforcement is fail-closed", () => {
  it("required + verifier throws → REJECT (never a pass-through)", async () => {
    vi.resetModules();
    vi.doMock("@a5c-ai/tasks-adapter/proven", () => ({
      verifyAnswer: vi.fn().mockRejectedValue(new Error("verification crashed")),
    }));
    const { enforceSignedBreakpointAnswer: gate } = await import(
      "../enforce-signed-breakpoint"
    );
    const decision = await gate(signedAnswer(), requiredConfig());
    expect(decision.accepted).toBe(false);
    vi.doUnmock("@a5c-ai/tasks-adapter/proven");
  });

  it("required + tasks-adapter/proven not installed → REJECT (cannot verify → deny)", async () => {
    vi.resetModules();
    vi.doMock("@a5c-ai/tasks-adapter/proven", () => {
      throw new Error("Cannot find module '@a5c-ai/tasks-adapter/proven'");
    });
    const { enforceSignedBreakpointAnswer: gate } = await import(
      "../enforce-signed-breakpoint"
    );
    const decision = await gate(signedAnswer(), requiredConfig());
    // When a signature is REQUIRED but verification is impossible, the answer cannot
    // be trusted → reject (fail-closed), never silently accept.
    expect(decision.accepted).toBe(false);
    vi.doUnmock("@a5c-ai/tasks-adapter/proven");
  });
});
