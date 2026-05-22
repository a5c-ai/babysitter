import { z } from "zod";
import type { BreakpointBackend } from "../../backend.js";
import type { Breakpoint } from "../../types.js";

// ── Tool Description ────────────────────────────────────────────────────

export const listBreakpointsDescription =
  "List pending breakpoints awaiting answers. Optionally filter by responder.";

// ── Tool Param Schema ───────────────────────────────────────────────────

export const listBreakpointsParams = {
  responderId: z.string().optional().describe(
    "Filter by responder ID. Omit to list all pending breakpoints.",
  ),
  backend: z.string().optional(),
  breakpointsDir: z.string().optional(),
};

// ── Params type ─────────────────────────────────────────────────────────

export interface ListBreakpointsParams {
  responderId?: string;
  backend?: string;
  breakpointsDir?: string;
}

// ── Handler ─────────────────────────────────────────────────────────────

export async function handleListBreakpoints(
  params: ListBreakpointsParams,
  backend: BreakpointBackend,
): Promise<Breakpoint[]> {
  const breakpoints = await backend.listPendingBreakpoints(params.responderId);
  return breakpoints;
}
