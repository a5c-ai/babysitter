import { z } from "zod";
import type { BreakpointBackend, SubmitAnswerParams } from "../../backend.js";
import type { BreakpointPublicAnswer } from "../../types.js";

// ── Tool Description ────────────────────────────────────────────────────

export const answerBreakpointDescription =
  "Submit an answer to a pending breakpoint. Optionally sign the answer " +
  "cryptographically for verified trust.";

// ── Tool Param Schema ───────────────────────────────────────────────────

export const answerBreakpointParams = {
  breakpointId: z.string().describe("The ID of the breakpoint to answer."),
  text: z.string().describe("The answer text."),
  approved: z.boolean().optional().describe(
    "For approval-type breakpoints, whether to approve or reject.",
  ),
  responderId: z.string().describe("Your responder identity."),
  responderName: z.string().describe("Your display name."),
  confidence: z.number().min(0).max(100).optional().describe(
    "Confidence level 0-100. Defaults to 80.",
  ),
  references: z.array(z.string()).optional().describe(
    "Supporting references or links.",
  ),
  sign: z.boolean().optional().describe(
    "When true, cryptographically sign the answer with your private key.",
  ),
  keyFingerprint: z.string().optional().describe(
    "Ed25519 key fingerprint to use for signing. Required when sign=true.",
  ),
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

// ── Params type ─────────────────────────────────────────────────────────

export interface AnswerBreakpointParams {
  breakpointId: string;
  text: string;
  approved?: boolean;
  responderId: string;
  responderName: string;
  confidence?: number;
  references?: string[];
  sign?: boolean;
  keyFingerprint?: string;
  backend?: string;
  breakpointsDir?: string;
}

// ── Handler ─────────────────────────────────────────────────────────────

export async function handleAnswerBreakpoint(
  params: AnswerBreakpointParams,
  backend: BreakpointBackend,
): Promise<BreakpointPublicAnswer> {
  if (!params.breakpointId || params.breakpointId.length === 0) {
    throw new Error("breakpointId is required and must be non-empty");
  }
  if (!params.text && params.text !== "") {
    throw new Error("text is required");
  }
  if (!params.responderId || params.responderId.length === 0) {
    throw new Error("responderId is required and must be non-empty");
  }
  if (!params.responderName || params.responderName.length === 0) {
    throw new Error("responderName is required and must be non-empty");
  }

  const answerParams: SubmitAnswerParams = {
    responderId: params.responderId,
    responderName: params.responderName,
    text: params.text,
    approved: params.approved,
    confidence: params.confidence,
    references: params.references,
    sign: params.sign,
    keyFingerprint: params.keyFingerprint,
  };

  const answer = await backend.answerBreakpoint(params.breakpointId, answerParams);
  return answer;
}
