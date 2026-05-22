import { z } from "zod";
import type { BreakpointBackend } from "../../backend.js";
import type { Breakpoint } from "../../types.js";

// ── Tool Description ────────────────────────────────────────────────────

export const checkBreakpointStatusDescription =
  "Check the current status of a pending breakpoint. Returns the breakpoint " +
  "state, any answers received, and timing information.";

// ── Tool Param Schema ───────────────────────────────────────────────────

export const checkBreakpointStatusParams = {
  breakpointId: z.string().describe("The ID of the breakpoint to check."),
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

// ── Params type ─────────────────────────────────────────────────────────

export interface CheckBreakpointStatusParams {
  breakpointId: string;
  backend?: string;
  breakpointsDir?: string;
}

// ── Handler ─────────────────────────────────────────────────────────────

export async function handleCheckBreakpointStatus(
  params: CheckBreakpointStatusParams,
  backend: BreakpointBackend,
): Promise<Breakpoint> {
  if (!params.breakpointId || params.breakpointId.length === 0) {
    throw new Error("breakpointId is required and must be non-empty");
  }

  const breakpoint = await backend.getBreakpoint(params.breakpointId);
  return breakpoint;
}
