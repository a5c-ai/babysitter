import { z } from "zod";
import type { BreakpointBackend } from "../../backend.js";
import type { Breakpoint } from "../../types.js";

// ── Tool Description ────────────────────────────────────────────────────

export const claimBreakpointDescription =
  "Claim a pending breakpoint so other responders know you are working on it. " +
  "You should claim a breakpoint before answering it. " +
  "Only responders listed in the breakpoint's targetResponders can claim it.";

// ── Tool Param Schema ───────────────────────────────────────────────────

export const claimBreakpointParams = {
  breakpointId: z.string().describe("The ID of the breakpoint to claim."),
  responderId: z
    .string()
    .describe("The responder ID claiming this breakpoint."),
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

// ── Params type ─────────────────────────────────────────────────────────

export interface ClaimBreakpointToolParams {
  breakpointId: string;
  responderId: string;
  backend?: string;
  breakpointsDir?: string;
}

// ── Handler ─────────────────────────────────────────────────────────────

export async function handleClaimBreakpoint(
  params: ClaimBreakpointToolParams,
  backend: BreakpointBackend,
): Promise<Breakpoint> {
  if (!params.breakpointId || params.breakpointId.length === 0) {
    throw new Error("breakpointId is required and must be non-empty");
  }
  if (!params.responderId || params.responderId.length === 0) {
    throw new Error("responderId is required and must be non-empty");
  }

  if (!backend.claimBreakpoint) {
    throw new Error(
      `Backend "${backend.name}" does not support claiming breakpoints`,
    );
  }

  const breakpoint = await backend.claimBreakpoint(params.breakpointId, params.responderId);
  return breakpoint;
}
