import { z } from "zod";
import {
  selectBreakpointAnswer,
  supportsProvenAnswers,
  unsupportedBackendFeatureMessage,
} from "../../backend.js";
import type { BreakpointBackend } from "../../backend.js";
import { isProvenBreakpointAnswer } from "../../types.js";
import type { ProvenVerificationResult } from "../../types.js";
import { verifyAnswer } from "../../proven/verify.js";

// ── Tool Description ────────────────────────────────────────────────────

export const verifyBreakpointAnswerDescription =
  "Verify the cryptographic signature of a breakpoint answer against " +
  "trusted public keys. Returns verification status and signer identity.";

// ── Tool Param Schema ───────────────────────────────────────────────────

export const verifyBreakpointAnswerParams = {
  breakpointId: z.string().describe(
    "The ID of the breakpoint whose answer to verify.",
  ),
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

// ── Params type ─────────────────────────────────────────────────────────

export interface VerifyBreakpointAnswerParams {
  breakpointId: string;
  backend?: string;
  breakpointsDir?: string;
}

// ── Handler ─────────────────────────────────────────────────────────────

export async function handleVerifyBreakpointAnswer(
  params: VerifyBreakpointAnswerParams,
  backend: BreakpointBackend,
): Promise<ProvenVerificationResult> {
  if (!params.breakpointId || params.breakpointId.length === 0) {
    throw new Error("breakpointId is required and must be non-empty");
  }

  const breakpoint = await backend.getBreakpoint(params.breakpointId);

  if (!breakpoint.answers || breakpoint.answers.length === 0) {
    throw new Error("No answers found for this breakpoint");
  }

  const answer = selectBreakpointAnswer(breakpoint);
  if (!answer) {
    if (breakpoint.selectedAnswer) {
      throw new Error(`Selected answer ${breakpoint.selectedAnswer} was not found on breakpoint ${breakpoint.id}`);
    }
    throw new Error("No answers found for this breakpoint");
  }

  if (!isProvenBreakpointAnswer(answer)) {
    if (!supportsProvenAnswers(backend.name)) {
      throw new Error(unsupportedBackendFeatureMessage(backend.name, "signed answers"));
    }
    throw new Error("Answer is not signed/proven -- no cryptographic signature found");
  }

  const result = await verifyAnswer(answer, params.breakpointsDir);
  return result;
}
